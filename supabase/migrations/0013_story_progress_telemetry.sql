-- Transaction-coupled reader progress telemetry.
--
-- Apply this migration before deploying the application code that calls
-- acknowledge_story_position_v1. The RPC remains the progress boundary even
-- after a flow expires: active flows capture their authoritative events in the
-- same transaction, while artifact-backed sessions without an active flow
-- continue without analytics.

-- Validator v1 did not encode the telemetry ordinal ceiling even though the
-- shipped composer produced nonblank, comfortably bounded stories. Refuse the
-- migration if an out-of-contract legacy row exists; operators must repair or
-- explicitly retire that row before deploying the v2 validator/application.
-- This makes legacy compatibility an audited fact instead of silently turning
-- an old Continue action into a 404 after rollout.
do $legacy_progress_preflight$
declare
  v_artifact record;
  v_beat jsonb;
  v_chunk jsonb;
  v_chunks jsonb;
  v_total_passages bigint;
begin
  for v_artifact in
    select artifact.artifact
    from public.story_artifacts artifact
    where artifact.artifact #>> '{recipe,validatorVersion}' =
      'artifact-validator-v1-2026-07'
  loop
    if jsonb_typeof(v_artifact.artifact -> 'beats') is distinct from 'array'
      or jsonb_array_length(v_artifact.artifact -> 'beats') < 1 then
      raise exception using
        message = 'migration 0013 legacy StoryArtifact preflight failed',
        hint = 'Repair or retire validator-v1 artifacts with invalid beats before retrying.';
    end if;

    v_total_passages := 0;
    for v_beat in
      select value from jsonb_array_elements(v_artifact.artifact -> 'beats')
    loop
      v_chunks := v_beat -> 'chunks';
      if jsonb_typeof(v_chunks) is distinct from 'array'
        or jsonb_array_length(v_chunks) < 1 then
        raise exception using
          message = 'migration 0013 legacy StoryArtifact preflight failed',
          hint = 'Repair or retire validator-v1 artifacts with invalid chunks before retrying.';
      end if;

      v_total_passages := v_total_passages + jsonb_array_length(v_chunks);
      if v_total_passages > 64 then
        raise exception using
          message = 'migration 0013 legacy StoryArtifact preflight failed',
          hint = 'Repair or retire validator-v1 artifacts above 64 passages before retrying.';
      end if;

      for v_chunk in select value from jsonb_array_elements(v_chunks)
      loop
        if jsonb_typeof(v_chunk) is distinct from 'string'
          or btrim(v_chunk #>> '{}') = '' then
          raise exception using
            message = 'migration 0013 legacy StoryArtifact preflight failed',
            hint = 'Repair or retire validator-v1 artifacts with blank chunks before retrying.';
        end if;
      end loop;
    end loop;
  end loop;
end
$legacy_progress_preflight$;

create or replace function public.acknowledge_story_position_v1(
  p_session_id text,
  p_user_id uuid,
  p_expected_beat_index int,
  p_expected_chunk_index int,
  p_next_beat_index int,
  p_next_chunk_index int,
  p_telemetry_flow_id text,
  p_passage_event_id text,
  p_completion_event_id text,
  p_schema_version text,
  p_story_role text,
  p_passage_ordinal int
) returns text
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v_session public.sessions%rowtype;
  v_artifact public.story_artifacts%rowtype;
  v_flow public.telemetry_flows%rowtype;
  v_beats jsonb;
  v_chunks jsonb;
  v_beat_count int;
  v_chunk_count int;
  v_i int;
  v_j int;
  v_total_passages bigint := 0;
  v_passage_ordinal bigint;
  v_derived_next_beat int;
  v_derived_next_chunk int;
  v_is_completion boolean;
  v_story_role text;
  v_root_session_id text;
  v_status text;
  v_capture_status text;
begin
  -- Ownership is the first observation. Missing and foreign sessions return
  -- the same result before position, artifact, or flow state is inspected.
  select * into v_session
  from public.sessions story_session
  where story_session.session_id = p_session_id
    and story_session.user_id = p_user_id
  for update;
  if not found then return 'not_found'; end if;

  -- Check non-negative coordinates before using JSON integer subscripts:
  -- negative jsonb indexes address from the end of an array.
  if p_expected_beat_index is null or p_expected_beat_index < 0
    or p_expected_chunk_index is null or p_expected_chunk_index < 0
    or p_next_beat_index is null or p_next_beat_index < 0
    or p_next_chunk_index is null or p_next_chunk_index < 0 then
    return 'conflict';
  end if;

  select * into v_artifact
  from public.story_artifacts artifact
  where artifact.artifact_id = v_session.story_artifact_id
    and artifact.session_id = v_session.session_id
    and artifact.user_id = v_session.user_id
  for share;
  if not found then return 'not_found'; end if;

  v_beats := v_artifact.artifact -> 'beats';
  if jsonb_typeof(v_beats) is distinct from 'array' then
    return 'not_found';
  end if;
  v_beat_count := jsonb_array_length(v_beats);
  if v_beat_count < 1 or p_expected_beat_index >= v_beat_count then
    return 'conflict';
  end if;

  -- Validate the complete immutable passage layout and cap it to the same
  -- 0..63 ordinal range enforced by the product-event schema. Use bigint
  -- while summing so corrupt JSON cannot overflow an int before the bound.
  v_passage_ordinal := p_expected_chunk_index;
  for v_i in 0..(v_beat_count - 1) loop
    v_chunks := (v_beats -> v_i) -> 'chunks';
    if jsonb_typeof(v_chunks) is distinct from 'array' then
      return 'not_found';
    end if;
    v_chunk_count := jsonb_array_length(v_chunks);
    if v_chunk_count < 1 then return 'not_found'; end if;
    v_total_passages := v_total_passages + v_chunk_count;
    if v_total_passages > 64 then return 'not_found'; end if;

    for v_j in 0..(v_chunk_count - 1) loop
      if jsonb_typeof(v_chunks -> v_j) is distinct from 'string'
        or btrim(v_chunks ->> v_j) = '' then
        return 'not_found';
      end if;
    end loop;

    if v_i < p_expected_beat_index then
      v_passage_ordinal := v_passage_ordinal + v_chunk_count;
    elsif v_i = p_expected_beat_index then
      if p_expected_chunk_index >= v_chunk_count then return 'conflict'; end if;
      if p_expected_chunk_index + 1 < v_chunk_count then
        v_derived_next_beat := p_expected_beat_index;
        v_derived_next_chunk := p_expected_chunk_index + 1;
      elsif p_expected_beat_index + 1 < v_beat_count then
        v_derived_next_beat := p_expected_beat_index + 1;
        v_derived_next_chunk := 0;
      else
        v_derived_next_beat := v_beat_count;
        v_derived_next_chunk := 0;
      end if;
    end if;
  end loop;

  if v_passage_ordinal < 0 or v_passage_ordinal > 63 then
    return 'not_found';
  end if;
  if p_next_beat_index is distinct from v_derived_next_beat
    or p_next_chunk_index is distinct from v_derived_next_chunk then
    return 'conflict';
  end if;
  v_is_completion := v_derived_next_beat = v_beat_count;
  v_story_role := case
    when v_session.alternate_of_session_id is null then 'initial'
    else 'alternate'
  end;
  v_root_session_id := coalesce(
    v_session.alternate_of_session_id,
    v_session.session_id
  );

  if v_session.next_beat_index = v_derived_next_beat
    and v_session.next_chunk_index = v_derived_next_chunk then
    v_status := 'already_advanced';
  elsif v_session.next_beat_index is distinct from p_expected_beat_index
    or v_session.next_chunk_index is distinct from p_expected_chunk_index then
    return 'conflict';
  else
    v_status := 'advanced';
  end if;

  -- Look up the authoritative flow independently of caller input. An active
  -- flow makes the signed capture tuple mandatory; absent/expired/revoked
  -- flows deliberately do not block reading.
  select * into v_flow
  from public.telemetry_flows flow
  where flow.user_id = v_session.user_id
    and flow.root_session_id = v_root_session_id
    and flow.expires_at > statement_timestamp()
  for share;
  if found then
    if p_telemetry_flow_id is distinct from v_flow.flow_id
      or p_schema_version is distinct from 'product-event-v1-2026-07'
      or p_story_role is distinct from v_story_role
      or p_passage_ordinal is distinct from v_passage_ordinal::int
      or p_passage_event_id is null or p_passage_event_id !~
        '^tev_[0-9a-f]{16}_[0-9a-f]{32}_[0-9a-f]{64}$'
      or (
        v_is_completion and (
          p_completion_event_id is null or p_completion_event_id !~
            '^tev_[0-9a-f]{16}_[0-9a-f]{32}_[0-9a-f]{64}$'
          or p_completion_event_id = p_passage_event_id
        )
      )
      or (not v_is_completion and p_completion_event_id is not null) then
      raise exception 'active story progress telemetry capture is invalid';
    end if;
  end if;

  if v_status = 'advanced' then
    update public.sessions story_session set
      next_beat_index = v_derived_next_beat,
      next_chunk_index = v_derived_next_chunk,
      updated_at = statement_timestamp()
    where story_session.session_id = v_session.session_id
      and story_session.user_id = v_session.user_id
      and story_session.next_beat_index = p_expected_beat_index
      and story_session.next_chunk_index = p_expected_chunk_index;
    if not found then
      raise exception 'story progress compare-and-set was lost';
    end if;
  end if;

  if v_flow.flow_id is not null then
    select public.capture_product_event_v1(
      p_event_id => p_passage_event_id,
      p_schema_version => p_schema_version,
      p_flow_id => v_flow.flow_id,
      p_event_name => 'passage_acknowledged',
      p_story_role => v_story_role,
      p_passage_ordinal => v_passage_ordinal::int
    ) into v_capture_status;
    if v_capture_status is null
      or v_capture_status not in ('created', 'duplicate') then
      raise exception 'passage acknowledgement telemetry conflicted';
    end if;

    if v_is_completion then
      select public.capture_product_event_v1(
        p_event_id => p_completion_event_id,
        p_schema_version => p_schema_version,
        p_flow_id => v_flow.flow_id,
        p_event_name => 'story_completed',
        p_story_role => v_story_role
      ) into v_capture_status;
      if v_capture_status is null
        or v_capture_status not in ('created', 'duplicate') then
        raise exception 'story completion telemetry conflicted';
      end if;
    end if;
  end if;

  return v_status;
end
$fn$;

revoke all on function public.acknowledge_story_position_v1(
  text, uuid, int, int, int, int, text, text, text, text, text, int
) from public, anon, authenticated;
grant execute on function public.acknowledge_story_position_v1(
  text, uuid, int, int, int, int, text, text, text, text, text, int
) to service_role;
