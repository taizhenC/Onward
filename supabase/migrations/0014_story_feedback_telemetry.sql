-- Transaction-coupled resonance-feedback telemetry.
--
-- The legacy submit_story_feedback RPC remains available for an explicit
-- application kill-switch rollback. Normal writes use v2 so the immutable
-- feedback row and its closed feedback_submitted event commit or roll back
-- together. Caller role/verdict are capture assertions only; authoritative
-- values are derived from the owned session and accepted feedback row.

create or replace function public.submit_story_feedback_v2(
  p_feedback_id text,
  p_user_id uuid,
  p_session_id text,
  p_artifact_id text,
  p_policy_version text,
  p_verdict text,
  p_reason text,
  p_telemetry_flow_id text,
  p_feedback_event_id text,
  p_telemetry_schema_version text,
  p_story_role text,
  p_feedback_verdict text
) returns text
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v_session public.sessions%rowtype;
  v_artifact public.story_artifacts%rowtype;
  v_feedback public.story_feedback%rowtype;
  v_flow public.telemetry_flows%rowtype;
  v_recipe_id text;
  v_root_session_id text;
  v_story_role text;
  v_status text;
  v_capture_status text;
begin
  -- Ownership is the first observation. Missing and foreign sessions are
  -- indistinguishable before completion, feedback, or flow state is read.
  select * into v_session
  from public.sessions story_session
  where story_session.session_id = p_session_id
    and story_session.user_id = p_user_id
    and story_session.story_artifact_id = p_artifact_id
  for update;
  if not found then return 'not_found'; end if;

  select * into v_artifact
  from public.story_artifacts artifact
  where artifact.artifact_id = p_artifact_id
    and artifact.session_id = p_session_id
    and artifact.user_id = p_user_id
  for share;
  if not found then return 'not_found'; end if;

  if jsonb_typeof(v_artifact.artifact -> 'beats') is distinct from 'array'
    or v_session.next_beat_index <
      jsonb_array_length(v_artifact.artifact -> 'beats') then
    return 'incomplete';
  end if;

  if p_feedback_id is null or p_feedback_id !~ '^[0-9a-f]{32}$'
    or p_policy_version is distinct from
      'resonance-feedback-v1-2026-07'
    or p_verdict is null
    or p_verdict not in ('felt_close', 'not_close')
    or (p_verdict = 'felt_close' and p_reason is not null)
    or (
      p_verdict = 'not_close'
      and (
        p_reason is null
        or p_reason not in (
          'wrong_situation',
          'wrong_feeling',
          'life_stage_mismatch',
          'story_felt_generic',
          'tone_felt_wrong',
          'historical_concern',
          'other'
        )
      )
    ) then
    return 'conflict';
  end if;

  v_recipe_id := v_session.match_recipe ->> 'recipeId';
  if coalesce(v_recipe_id, '') !~
    '^[A-Za-z0-9][A-Za-z0-9:._-]{0,127}$' then
    return 'not_found';
  end if;

  -- The owned session row serializes identical and divergent copies. Do not
  -- acquire a post-session advisory lock here: alternate-story RPCs take their
  -- advisory lock before this row, so reversing that order would deadlock.
  select * into v_feedback
  from public.story_feedback feedback
  where feedback.session_id = p_session_id
  for share;

  if found then
    if v_feedback.user_id is distinct from p_user_id
      or v_feedback.artifact_id is distinct from p_artifact_id
      or v_feedback.story_spec_id is distinct from v_artifact.story_spec_id
      or v_feedback.story_spec_version is distinct from
        v_artifact.story_spec_version
      or v_feedback.figure_key is distinct from v_artifact.figure_key
      or v_feedback.stage_id is distinct from v_artifact.stage_id
      or v_feedback.recipe_id is distinct from v_recipe_id
      or v_feedback.policy_version is distinct from p_policy_version
      or v_feedback.verdict is distinct from p_verdict
      or v_feedback.reason is distinct from p_reason then
      return 'conflict';
    end if;
    v_status := 'duplicate';
  else
    insert into public.story_feedback (
      feedback_id,
      user_id,
      session_id,
      artifact_id,
      story_spec_id,
      story_spec_version,
      figure_key,
      stage_id,
      recipe_id,
      policy_version,
      verdict,
      reason
    ) values (
      p_feedback_id,
      p_user_id,
      p_session_id,
      p_artifact_id,
      v_artifact.story_spec_id,
      v_artifact.story_spec_version,
      v_artifact.figure_key,
      v_artifact.stage_id,
      v_recipe_id,
      p_policy_version,
      p_verdict,
      p_reason
    ) returning * into v_feedback;
    v_status := 'created';
  end if;

  v_root_session_id := coalesce(
    v_session.alternate_of_session_id,
    v_session.session_id
  );
  v_story_role := case
    when v_session.alternate_of_session_id is null then 'initial'
    else 'alternate'
  end;

  -- The database decides flow activity at this transaction's timestamp. A
  -- flow that is absent, expired, or revoked permits the bounded feedback row
  -- without fabricating telemetry. An active flow requires an exact signed
  -- capture; any mismatch aborts both writes.
  select * into v_flow
  from public.telemetry_flows flow
  where flow.user_id = v_session.user_id
    and flow.root_session_id = v_root_session_id
    and flow.expires_at > statement_timestamp()
  for share;
  if found then
    if p_telemetry_flow_id is distinct from v_flow.flow_id
      or p_telemetry_schema_version is distinct from
        'product-event-v1-2026-07'
      or p_story_role is distinct from v_story_role
      or p_feedback_verdict is distinct from v_feedback.verdict
      or p_feedback_event_id is null
      or p_feedback_event_id !~
        '^tev_[0-9a-f]{16}_[0-9a-f]{32}_[0-9a-f]{64}$' then
      raise exception 'active story feedback telemetry capture is invalid';
    end if;

    select public.capture_product_event_v1(
      p_event_id => p_feedback_event_id,
      p_schema_version => p_telemetry_schema_version,
      p_flow_id => v_flow.flow_id,
      p_event_name => 'feedback_submitted',
      p_story_role => v_story_role,
      p_feedback_verdict => v_feedback.verdict
    ) into v_capture_status;
    if v_capture_status is null
      or v_capture_status not in ('created', 'duplicate') then
      raise exception 'story feedback telemetry conflicted';
    end if;
  end if;

  return v_status;
end
$fn$;

revoke all on function public.submit_story_feedback_v2(
  text, uuid, text, text, text, text, text, text, text, text, text, text
) from public, anon, authenticated;
grant execute on function public.submit_story_feedback_v2(
  text, uuid, text, text, text, text, text, text, text, text, text, text
) to service_role;
