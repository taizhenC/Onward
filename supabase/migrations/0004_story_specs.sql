-- Onward - versioned, evidence-bound StorySpecs, migration 0004.
-- Apply after 0001. This table is server-only and default-deny under RLS.

create table if not exists story_specs (
  story_spec_id text primary key,
  figure_key text not null,
  stage_id text not null,
  version int not null,
  schema_version text not null,
  status text not null default 'draft',
  spec jsonb not null,
  created_at timestamptz not null default now(),
  published_at timestamptz,
  retired_at timestamptz,
  constraint story_specs_stage_fk
    foreign key (figure_key, stage_id)
    references figure_stages (figure_key, stage_id) on delete restrict,
  constraint story_specs_version_check check (version > 0),
  constraint story_specs_status_check
    check (status in ('draft', 'review', 'published', 'retired')),
  constraint story_specs_identity_unique unique (figure_key, stage_id, version),
  constraint story_specs_document_identity_check check (
    spec ->> 'storySpecId' = story_spec_id
    and spec ->> 'figureKey' = figure_key
    and spec ->> 'stageId' = stage_id
    and (spec ->> 'version')::int = version
    and spec ->> 'schemaVersion' = schema_version
    and spec ->> 'status' = status
  )
);

-- Exactly one active published version per episode. Retiring it permits a
-- newer reviewed version to be promoted without rewriting history.
create unique index if not exists story_specs_one_published_stage_idx
  on story_specs (figure_key, stage_id)
  where status = 'published';

create index if not exists story_specs_stage_history_idx
  on story_specs (figure_key, stage_id, version desc);

alter table story_specs enable row level security;
revoke all on table story_specs from public, anon, authenticated;
revoke all on table story_specs from service_role;
grant select, insert, update on table story_specs to service_role;

create or replace function enforce_story_spec_lifecycle()
returns trigger
language plpgsql
set search_path = public
as $fn$
begin
  -- Published evidence, prose, and review records are immutable. Retirement
  -- is metadata-only; rollback means selecting a new version, never mutation.
  if tg_op = 'UPDATE' and old.status in ('published', 'retired') then
    if new.story_spec_id is distinct from old.story_spec_id
      or new.figure_key is distinct from old.figure_key
      or new.stage_id is distinct from old.stage_id
      or new.version is distinct from old.version
      or new.schema_version is distinct from old.schema_version
      or new.spec - 'status' is distinct from old.spec - 'status'
      or new.created_at is distinct from old.created_at
      or new.published_at is distinct from old.published_at
      or (
        old.status = 'retired'
        and new.retired_at is distinct from old.retired_at
      ) then
      raise exception 'published StorySpec content and provenance are immutable';
    end if;

    if old.status = 'retired' and new.status <> 'retired' then
      raise exception 'a retired StorySpec cannot be reactivated';
    end if;
    if old.status = 'published' and new.status not in ('published', 'retired') then
      raise exception 'a published StorySpec can only remain published or retire';
    end if;
  end if;

  if new.status = 'published' then
    if new.published_at is null then new.published_at := now(); end if;
    new.retired_at := null;
  elsif new.status = 'retired' then
    if tg_op = 'INSERT' or old.status <> 'published' then
      raise exception 'only a published StorySpec can retire';
    end if;
    if new.retired_at is null then new.retired_at := now(); end if;
  else
    new.published_at := null;
    new.retired_at := null;
  end if;

  return new;
end
$fn$;

drop trigger if exists story_specs_lifecycle on story_specs;
create trigger story_specs_lifecycle
before insert or update on story_specs
for each row execute function enforce_story_spec_lifecycle();

revoke all on function enforce_story_spec_lifecycle() from public, anon, authenticated;

-- Atomic editorial promotion. It retires the currently published version for
-- only this stage, so content rollback/promotion never needs an app deploy.
create or replace function promote_story_spec(p_story_spec_id text)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_target story_specs%rowtype;
begin
  select * into v_target
  from story_specs
  where story_spec_id = p_story_spec_id
  for update;

  if not found then raise exception 'StorySpec not found'; end if;
  if v_target.status <> 'review' then
    raise exception 'only a reviewed StorySpec can be promoted';
  end if;
  -- Text comparison on purpose: a stray non-boolean value must read as
  -- "not approved", not throw a cast error before the clean exception.
  if coalesce(v_target.spec #>> '{review,researcherId}', '') = ''
    or coalesce(v_target.spec #>> '{review,historicalReviewerId}', '') = ''
    or coalesce(v_target.spec #>> '{review,toneReviewerId}', '') = ''
    or coalesce(v_target.spec #>> '{review,reviewedAt}', '') = ''
    or coalesce(v_target.spec #>> '{review,contentProfileReviewed}', '') <> 'true' then
    raise exception 'required editorial approvals are missing';
  end if;
  if jsonb_path_exists(
    v_target.spec,
    '$.facts[*].sourceRefs[*] ? (@.scope == "broad")'
  ) or jsonb_path_exists(
    v_target.spec,
    '$.quotes[*].sourceRefs[*] ? (@.scope == "broad")'
  ) then
    raise exception 'broad source mappings cannot be published';
  end if;
  -- coalesce: a beat missing requiredFactIds entirely must fail this gate,
  -- not slip past it as jsonb_array_length(NULL) = NULL.
  if exists (
    select 1
    from jsonb_array_elements(v_target.spec -> 'arc') as beat
    where beat ->> 'role' <> 'bridge'
      and coalesce(jsonb_array_length(beat -> 'requiredFactIds'), 0) = 0
  ) then
    raise exception 'canonical beats require supporting fact IDs';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(v_target.figure_key || ':' || v_target.stage_id, 0)
  );

  update story_specs
  set status = 'retired',
      spec = jsonb_set(spec, '{status}', to_jsonb('retired'::text))
  where figure_key = v_target.figure_key
    and stage_id = v_target.stage_id
    and status = 'published';

  update story_specs
  set status = 'published',
      spec = jsonb_set(spec, '{status}', to_jsonb('published'::text))
  where story_spec_id = p_story_spec_id;

  update figure_stages
  set status = 'published'
  where figure_key = v_target.figure_key
    and stage_id = v_target.stage_id;
end
$fn$;

create or replace function retire_story_spec(p_story_spec_id text)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_figure_key text;
  v_stage_id text;
begin
  -- Resolve the stage first so an unknown id raises the clean exception
  -- instead of feeding NULL into the advisory lock.
  select figure_key, stage_id into v_figure_key, v_stage_id
  from story_specs
  where story_spec_id = p_story_spec_id;
  if not found then raise exception 'published StorySpec not found'; end if;

  perform pg_advisory_xact_lock(
    hashtextextended(v_figure_key || ':' || v_stage_id, 0)
  );

  update story_specs
  set status = 'retired',
      spec = jsonb_set(spec, '{status}', to_jsonb('retired'::text))
  where story_spec_id = p_story_spec_id
    and status = 'published';
  if not found then raise exception 'published StorySpec not found'; end if;

  update figure_stages
  set status = 'draft'
  where figure_key = v_figure_key
    and stage_id = v_stage_id;
end
$fn$;

revoke all on function promote_story_spec(text) from public, anon, authenticated;
revoke all on function retire_story_spec(text) from public, anon, authenticated;
grant execute on function promote_story_spec(text) to service_role;
grant execute on function retire_story_spec(text) to service_role;
