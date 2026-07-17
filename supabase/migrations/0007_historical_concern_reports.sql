-- Privacy-safe editorial queue for bounded historical concerns.
-- The queue stores curated content identifiers only: never user/session IDs,
-- disclosure, story prose, rationale, source text, IP, or free-form feedback.

create table historical_concern_reports (
  report_id text primary key check (report_id ~ '^[0-9a-f]{32}$'),
  story_spec_id text not null references story_specs (story_spec_id) on delete restrict,
  story_spec_version int not null check (story_spec_version > 0),
  figure_key text not null,
  stage_id text not null,
  fact_id text not null check (fact_id ~ '^[A-Za-z0-9][A-Za-z0-9:._-]{0,127}$'),
  reason text not null check (reason in (
    'incorrect_fact',
    'misleading_context',
    'source_problem',
    'quote_or_attribution',
    'date_or_sequence'
  )),
  status text not null default 'open' check (status in (
    'open', 'investigating', 'resolved', 'dismissed'
  )),
  report_count int not null default 1 check (report_count > 0),
  first_reported_at timestamptz not null default now(),
  last_reported_at timestamptz not null default now(),
  resolved_at timestamptz,
  check (last_reported_at >= first_reported_at),
  check (
    (status in ('open', 'investigating') and resolved_at is null)
    or (status in ('resolved', 'dismissed') and resolved_at is not null)
  )
);

create unique index historical_concern_reports_active_dedupe_idx
  on historical_concern_reports (
    story_spec_id, story_spec_version, fact_id, reason
  ) where status in ('open', 'investigating');
create index historical_concern_reports_queue_idx
  on historical_concern_reports (status, first_reported_at asc);
create index historical_concern_reports_stage_idx
  on historical_concern_reports (figure_key, stage_id, status);

alter table historical_concern_reports enable row level security;
revoke all on table historical_concern_reports from public, anon, authenticated;
revoke all on table historical_concern_reports from service_role;
grant select on table historical_concern_reports to service_role;

-- New artifacts must carry immutable v5 provenance. Existing v1-v4 rows are
-- untouched and remain replayable, but cannot receive fabricated current data.
create or replace function require_current_story_transparency()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $fn$
begin
  if new.schema_version is distinct from 'story-artifact-v5-2026-07'
    or jsonb_typeof(new.artifact -> 'transparency') is distinct from 'object'
    or jsonb_typeof(new.artifact #> '{transparency,facts}') is distinct from 'array'
    or new.artifact #>> '{transparency,schemaVersion}'
      is distinct from 'story-transparency-v1-2026-07'
    or new.artifact #>> '{transparency,storySpec,storySpecId}'
      is distinct from new.story_spec_id
    or (new.artifact #>> '{transparency,storySpec,version}')::int
      is distinct from new.story_spec_version
    or new.artifact #>> '{transparency,storySpec,schemaVersion}'
      is distinct from new.story_spec_schema_version then
    raise exception 'new StoryArtifact requires current immutable transparency';
  end if;
  return new;
end
$fn$;

drop trigger if exists story_artifacts_require_current_transparency
  on story_artifacts;
create trigger story_artifacts_require_current_transparency
before insert on story_artifacts
for each row execute function require_current_story_transparency();
revoke all on function require_current_story_transparency()
  from public, anon, authenticated;

-- Ownership and fact membership are checked atomically against the immutable
-- artifact. Only safe editorial identifiers cross into the queue table.
create or replace function submit_historical_concern(
  p_report_id text,
  p_user_id uuid,
  p_session_id text,
  p_artifact_id text,
  p_fact_id text,
  p_reason text
) returns text
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v_artifact story_artifacts%rowtype;
  v_report_id text;
begin
  if p_reason not in (
    'incorrect_fact',
    'misleading_context',
    'source_problem',
    'quote_or_attribution',
    'date_or_sequence'
  ) then
    return null;
  end if;

  select * into v_artifact
  from public.story_artifacts as artifact
  where artifact.artifact_id = p_artifact_id
    and artifact.session_id = p_session_id
    and artifact.user_id = p_user_id
    and artifact.schema_version = 'story-artifact-v5-2026-07'
    and artifact.artifact #>> '{transparency,provenance,status}'
      = 'editorially_reviewed'
    and exists (
      select 1
      from jsonb_array_elements(
        artifact.artifact #> '{transparency,facts}'
      ) as fact
      where fact ->> 'factId' = p_fact_id
    )
  for share;

  if not found then return null; end if;

  insert into public.historical_concern_reports (
    report_id,
    story_spec_id,
    story_spec_version,
    figure_key,
    stage_id,
    fact_id,
    reason
  ) values (
    p_report_id,
    v_artifact.story_spec_id,
    v_artifact.story_spec_version,
    v_artifact.figure_key,
    v_artifact.stage_id,
    p_fact_id,
    p_reason
  )
  on conflict (story_spec_id, story_spec_version, fact_id, reason)
    where status in ('open', 'investigating')
  do update set
    report_count = public.historical_concern_reports.report_count + 1,
    last_reported_at = now()
  returning report_id into v_report_id;

  return v_report_id;
end
$fn$;

revoke all on function submit_historical_concern(
  text, uuid, text, text, text, text
) from public, anon, authenticated;
grant execute on function submit_historical_concern(
  text, uuid, text, text, text, text
) to service_role;

-- Editorial status is the only mutable surface. A concern never auto-retires
-- content; editors use the existing service-only retire_story_spec RPC.
create or replace function triage_historical_concern(
  p_report_id text,
  p_status text
) returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
begin
  if p_status not in ('investigating', 'resolved', 'dismissed') then
    raise exception 'invalid historical concern status';
  end if;

  update public.historical_concern_reports
  set status = p_status,
      resolved_at = case
        when p_status in ('resolved', 'dismissed') then now()
        else null
      end
  where report_id = p_report_id
    and status in ('open', 'investigating');
  if not found then raise exception 'open historical concern not found'; end if;
end
$fn$;

revoke all on function triage_historical_concern(text, text)
  from public, anon, authenticated;
grant execute on function triage_historical_concern(text, text)
  to service_role;
