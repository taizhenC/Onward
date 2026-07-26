-- Explicit retention labels for the two durable rows that mix or contain
-- reader-derived story material.
--
-- StoryArtifact JSON remains immutable v1-v5. Lifecycle metadata belongs in
-- the relational envelope so a privacy-policy rollout does not rewrite story
-- content, hashes, evidence, or replay history.

-- Existing rows predate the code-owned policy. ADD COLUMN's first default
-- labels them honestly as legacy; the default is switched to the current
-- version before this migration commits, so every later RPC write receives the
-- current label without changing the deployed RPC signatures.
alter table public.story_artifacts
  add column retention_policy_version text not null
    default 'legacy-pre-derived-output-retention-v0',
  add column retention_class text not null
    default 'owned_story';

alter table public.story_artifacts
  alter column retention_policy_version
    set default 'derived-output-retention-v1-2026-07',
  add constraint story_artifacts_retention_policy_check check (
    retention_policy_version in (
      'legacy-pre-derived-output-retention-v0',
      'derived-output-retention-v1-2026-07'
    )
  ),
  add constraint story_artifacts_retention_class_check check (
    retention_class = 'owned_story'
  );

comment on column public.story_artifacts.retention_policy_version is
  'The recorded lifecycle contract; legacy means the row predates explicit policy recording.';
comment on column public.story_artifacts.retention_class is
  'Validated generated wording and rationale follow the owner-story lifecycle.';

-- A session is deliberately a mixed row. Age, story identity, duplicated
-- opening copy, recipe, and progress follow the owner story. Disclosure and
-- story_request_context follow the shorter root-only recovery deadline.
alter table public.sessions
  add column retention_policy_version text not null
    default 'legacy-pre-derived-output-retention-v0',
  add column story_retention_class text not null
    default 'owned_story',
  add column context_retention_class text not null
    default 'recovery_context';

alter table public.sessions
  alter column retention_policy_version
    set default 'derived-output-retention-v1-2026-07',
  add constraint sessions_retention_policy_check check (
    retention_policy_version in (
      'legacy-pre-derived-output-retention-v0',
      'derived-output-retention-v1-2026-07'
    )
  ),
  add constraint sessions_story_retention_class_check check (
    story_retention_class = 'owned_story'
  ),
  add constraint sessions_context_retention_class_check check (
    context_retention_class = 'recovery_context'
  );

comment on column public.sessions.retention_policy_version is
  'The recorded lifecycle contract; legacy means the row predates explicit policy recording.';
comment on column public.sessions.story_retention_class is
  'Age, story identity, opening copy, recipe, and progress follow the owner-story lifecycle.';
comment on column public.sessions.context_retention_class is
  'Disclosure and story-request context are root-only recovery context with a fixed deadline.';

-- The artifact row already rejects every UPDATE. Give session labels the same
-- first-write-wins property while leaving progress and scheduled context
-- nulling untouched.
create or replace function public.protect_session_retention_contract_v1()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $fn$
begin
  if new.retention_policy_version is distinct from old.retention_policy_version
    or new.story_retention_class is distinct from old.story_retention_class
    or new.context_retention_class is distinct from old.context_retention_class
  then
    raise exception 'session retention contract is immutable';
  end if;
  return new;
end;
$fn$;

revoke all on function public.protect_session_retention_contract_v1()
  from public, anon, authenticated, service_role;

create trigger sessions_retention_contract_immutable
before update of retention_policy_version, story_retention_class,
  context_retention_class on public.sessions
for each row execute function public.protect_session_retention_contract_v1();
