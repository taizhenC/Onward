-- Onward - immutable, owner-scoped StoryArtifacts, migration 0005.
-- Requires 0003 (session ownership) and 0004 (StorySpecs).

-- New content is never matchable by default; StorySpec promotion is the only
-- operation that marks a stage published.
alter table figure_stages alter column status set default 'draft';

create table if not exists story_artifacts (
  artifact_id text primary key,
  session_id text not null unique references sessions (session_id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  story_spec_id text not null references story_specs (story_spec_id) on delete restrict,
  story_spec_version int not null,
  story_spec_schema_version text not null,
  figure_key text not null,
  stage_id text not null,
  schema_version text not null,
  composition_mode text not null,
  content_hash text not null,
  artifact jsonb not null,
  created_at timestamptz not null default now(),
  constraint story_artifacts_mode_check
    check (composition_mode in ('canonical_fallback', 'hybrid')),
  constraint story_artifacts_hash_check check (content_hash ~ '^[0-9a-f]{64}$'),
  constraint story_artifacts_document_check check (
    jsonb_typeof(artifact) = 'object'
    and artifact ->> 'artifactId' is not distinct from artifact_id
    and artifact ->> 'storySpecId' is not distinct from story_spec_id
    and (artifact ->> 'storySpecVersion')::int is not distinct from story_spec_version
    and artifact ->> 'storySpecSchemaVersion' is not distinct from story_spec_schema_version
    and artifact ->> 'figureKey' is not distinct from figure_key
    and artifact ->> 'stageId' is not distinct from stage_id
    and artifact ->> 'schemaVersion' is not distinct from schema_version
    and artifact #>> '{composition,mode}' is not distinct from composition_mode
    and artifact ->> 'contentHash' is not distinct from content_hash
    and artifact #>> '{validation,status}' is not distinct from 'validated'
    and jsonb_typeof(artifact -> 'openingCopy') is not distinct from 'object'
    and jsonb_typeof(artifact -> 'beats') is not distinct from 'array'
  )
);

create index if not exists story_artifacts_user_created_idx
  on story_artifacts (user_id, created_at desc);

alter table story_artifacts enable row level security;
revoke all on table story_artifacts from public, anon, authenticated;
revoke all on table story_artifacts from service_role;
grant select on table story_artifacts to service_role;

create or replace function reject_story_artifact_update()
returns trigger
language plpgsql
set search_path = public
as $fn$
begin
  raise exception 'StoryArtifacts are immutable';
end
$fn$;

drop trigger if exists story_artifacts_immutable on story_artifacts;
create trigger story_artifacts_immutable
before update on story_artifacts
for each row execute function reject_story_artifact_update();
revoke all on function reject_story_artifact_update() from public, anon, authenticated;

alter table sessions
  add column if not exists story_artifact_id text unique;

-- The deferred half of the one-to-one relationship permits the RPC's
-- session-first/artifact-second insert order while rejecting dangling pointers
-- at transaction commit. NO ACTION (not RESTRICT) is required for deferral.
alter table sessions
  add constraint sessions_story_artifact_fk
  foreign key (story_artifact_id)
  references story_artifacts (artifact_id)
  on delete no action
  deferrable initially deferred;

-- New sessions must use create_story_session(); existing NULL legacy rows remain
-- readable for backfill. Progress updates and owner-scoped deletes stay allowed.
revoke insert on table sessions from service_role;

create or replace function protect_session_artifact_pointer()
returns trigger
language plpgsql
set search_path = public
as $fn$
begin
  if old.story_artifact_id is not null
    and new.story_artifact_id is distinct from old.story_artifact_id then
    raise exception 'a session StoryArtifact pointer is immutable';
  end if;
  return new;
end
$fn$;

drop trigger if exists sessions_artifact_pointer_immutable on sessions;
create trigger sessions_artifact_pointer_immutable
before update of story_artifact_id on sessions
for each row execute function protect_session_artifact_pointer();
revoke all on function protect_session_artifact_pointer() from public, anon, authenticated;

-- One transaction creates both records, so a session can never point at a
-- missing artifact and a failed session insert cannot leave orphaned prose.
create or replace function create_story_session(
  p_session_id text,
  p_user_id uuid,
  p_figure_key text,
  p_stage_id text,
  p_framing text,
  p_age int,
  p_feeling text,
  p_match_recipe jsonb,
  p_artifact jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_artifact_id text := p_artifact ->> 'artifactId';
  v_story_spec story_specs%rowtype;
begin
  if v_artifact_id is null
    or p_artifact ->> 'figureKey' is distinct from p_figure_key
    or p_artifact ->> 'stageId' is distinct from p_stage_id
    or p_artifact #>> '{validation,status}' is distinct from 'validated'
    or p_artifact #>> '{framing}' is distinct from p_framing
    or p_artifact #> '{recipe,match}' is distinct from p_match_recipe
    or jsonb_typeof(p_artifact -> 'openingCopy') is distinct from 'object'
    or jsonb_typeof(p_artifact -> 'beats') is distinct from 'array' then
    raise exception 'invalid StoryArtifact/session identity';
  end if;

  select * into v_story_spec
  from story_specs
  where story_spec_id = p_artifact ->> 'storySpecId'
  for share;
  if not found
    or v_story_spec.status <> 'published'
    or v_story_spec.version is distinct from (p_artifact ->> 'storySpecVersion')::int
    or v_story_spec.schema_version is distinct from p_artifact ->> 'storySpecSchemaVersion'
    or v_story_spec.figure_key is distinct from p_figure_key
    or v_story_spec.stage_id is distinct from p_stage_id then
    raise exception 'StorySpec is not an active published version';
  end if;

  insert into sessions (
    session_id,
    user_id,
    figure_key,
    stage_id,
    story_artifact_id,
    framing,
    opening_copy,
    age,
    feeling,
    match_recipe,
    next_beat_index,
    next_chunk_index,
    updated_at
  ) values (
    p_session_id,
    p_user_id,
    p_figure_key,
    p_stage_id,
    v_artifact_id,
    p_framing,
    p_artifact -> 'openingCopy',
    p_age,
    p_feeling,
    p_match_recipe,
    0,
    0,
    now()
  );

  insert into story_artifacts (
    artifact_id,
    session_id,
    user_id,
    story_spec_id,
    story_spec_version,
    story_spec_schema_version,
    figure_key,
    stage_id,
    schema_version,
    composition_mode,
    content_hash,
    artifact,
    created_at
  ) values (
    v_artifact_id,
    p_session_id,
    p_user_id,
    p_artifact ->> 'storySpecId',
    (p_artifact ->> 'storySpecVersion')::int,
    p_artifact ->> 'storySpecSchemaVersion',
    p_figure_key,
    p_stage_id,
    p_artifact ->> 'schemaVersion',
    p_artifact #>> '{composition,mode}',
    p_artifact ->> 'contentHash',
    p_artifact,
    now()
  );
end
$fn$;

revoke all on function create_story_session(
  text, uuid, text, text, text, int, text, jsonb, jsonb
) from public, anon, authenticated;
grant execute on function create_story_session(
  text, uuid, text, text, text, int, text, jsonb, jsonb
) to service_role;
