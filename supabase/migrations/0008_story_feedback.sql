-- Bounded, owner-linked post-story resonance feedback.
-- No disclosure, generated prose, rationale, source text, prompt, or free-form
-- field exists in this table. Optional notes require a later separate encrypted
-- consent/retention design; this migration deliberately cannot accept them.

create table story_feedback (
  feedback_id text primary key check (feedback_id ~ '^[0-9a-f]{32}$'),
  user_id uuid not null references auth.users (id) on delete cascade,
  session_id text not null unique references sessions (session_id) on delete cascade,
  artifact_id text not null unique references story_artifacts (artifact_id) on delete cascade,
  story_spec_id text not null references story_specs (story_spec_id) on delete restrict,
  story_spec_version int not null check (story_spec_version > 0),
  figure_key text not null,
  stage_id text not null,
  recipe_id text not null check (recipe_id ~ '^[A-Za-z0-9][A-Za-z0-9:._-]{0,127}$'),
  policy_version text not null check (
    policy_version = 'resonance-feedback-v1-2026-07'
  ),
  verdict text not null check (verdict in ('felt_close', 'not_close')),
  reason text check (reason in (
    'wrong_situation',
    'wrong_feeling',
    'life_stage_mismatch',
    'story_felt_generic',
    'tone_felt_wrong',
    'historical_concern',
    'other'
  )),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '90 days'),
  check (expires_at > created_at),
  check (
    (verdict = 'felt_close' and reason is null)
    or (verdict = 'not_close' and reason is not null)
  )
);

create index story_feedback_reason_created_idx
  on story_feedback (verdict, reason, created_at desc);
create index story_feedback_recipe_created_idx
  on story_feedback (recipe_id, created_at desc);
create index story_feedback_expiry_idx
  on story_feedback (expires_at);

alter table story_feedback enable row level security;
revoke all on table story_feedback from public, anon, authenticated;
revoke all on table story_feedback from service_role;
grant select on table story_feedback to service_role;

create or replace function reject_story_feedback_update()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $fn$
begin
  raise exception 'Story feedback is immutable';
end
$fn$;

create trigger story_feedback_immutable
before update on story_feedback
for each row execute function reject_story_feedback_update();
revoke all on function reject_story_feedback_update()
  from public, anon, authenticated;

-- The RPC derives every aggregate identifier from the completed, owned,
-- immutable story. Identical network retries are idempotent; a conflicting
-- second answer is rejected instead of double-counted.
create or replace function submit_story_feedback(
  p_feedback_id text,
  p_user_id uuid,
  p_session_id text,
  p_artifact_id text,
  p_policy_version text,
  p_verdict text,
  p_reason text
) returns text
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v_session public.sessions%rowtype;
  v_artifact public.story_artifacts%rowtype;
  v_existing public.story_feedback%rowtype;
  v_inserted int;
  v_recipe_id text;
begin
  if p_policy_version <> 'resonance-feedback-v1-2026-07'
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

  select * into v_session
  from public.sessions as session
  where session.session_id = p_session_id
    and session.user_id = p_user_id
    and session.story_artifact_id = p_artifact_id
  for share;
  if not found then return 'not_found'; end if;

  select * into v_artifact
  from public.story_artifacts as artifact
  where artifact.artifact_id = p_artifact_id
    and artifact.session_id = p_session_id
    and artifact.user_id = p_user_id
  for share;
  if not found then return 'not_found'; end if;

  if jsonb_typeof(v_artifact.artifact -> 'beats') is distinct from 'array'
    or v_session.next_beat_index < jsonb_array_length(v_artifact.artifact -> 'beats') then
    return 'incomplete';
  end if;

  v_recipe_id := v_session.match_recipe ->> 'recipeId';
  if coalesce(v_recipe_id, '') !~ '^[A-Za-z0-9][A-Za-z0-9:._-]{0,127}$' then
    return 'not_found';
  end if;

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
  )
  on conflict (session_id) do nothing;
  get diagnostics v_inserted = row_count;
  if v_inserted = 1 then return 'created'; end if;

  select * into v_existing
  from public.story_feedback
  where session_id = p_session_id;
  if found
    and v_existing.user_id = p_user_id
    and v_existing.artifact_id = p_artifact_id
    and v_existing.policy_version = p_policy_version
    and v_existing.verdict = p_verdict
    and v_existing.reason is not distinct from p_reason then
    return 'duplicate';
  end if;
  return 'conflict';
end
$fn$;

revoke all on function submit_story_feedback(
  text, uuid, text, text, text, text, text
) from public, anon, authenticated;
grant execute on function submit_story_feedback(
  text, uuid, text, text, text, text, text
) to service_role;

create or replace function delete_expired_story_feedback()
returns void
language sql
security definer
set search_path = pg_catalog, public
as $fn$
  delete from public.story_feedback where expires_at <= now();
$fn$;

revoke all on function delete_expired_story_feedback()
  from public, anon, authenticated;
grant execute on function delete_expired_story_feedback()
  to service_role;

select cron.schedule(
  'onward-story-feedback-cleanup',
  '41 3 * * *',
  $$select public.delete_expired_story_feedback();$$
);
