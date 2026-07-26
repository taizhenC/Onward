-- Explicit retention labels for the two durable rows that mix or contain
-- reader-derived story material.
--
-- StoryArtifact JSON remains immutable v1-v5. Lifecycle metadata belongs in
-- the relational envelope so a privacy-policy rollout does not rewrite story
-- content, hashes, evidence, or replay history.
--
-- Every live create/delete path locks sessions before story_artifacts. Preserve
-- that order during this whole-file transaction so the migration cannot hold
-- story_artifacts while waiting on a session-owning writer. Fail the rollout
-- instead of creating an indefinite lock queue if the operator did not drain
-- in-flight work as required.
set local lock_timeout = '10s';
lock table public.sessions in access exclusive mode;
lock table public.story_artifacts in access exclusive mode;

-- A session is deliberately a mixed row. Age, story identity, duplicated
-- opening copy, recipe, and progress follow the owner story. Disclosure and
-- story_request_context follow the shorter root-only recovery deadline.
--
-- Existing rows predate the code-owned policy. ADD COLUMN's first default
-- labels them honestly as legacy; the default is switched to the current
-- version before this migration commits, so every later RPC write receives the
-- current label without changing the deployed RPC signatures.
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

-- Legacy is an honest read/backfill state, never a valid new-write claim.
-- Existing RPCs omit these columns and therefore receive the current defaults.
create or replace function public.enforce_current_session_retention_contract_v1()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $fn$
begin
  if new.retention_policy_version <>
      'derived-output-retention-v1-2026-07'
    or new.story_retention_class <> 'owned_story'
    or new.context_retention_class <> 'recovery_context'
  then
    raise exception 'new rows require the current retention contract';
  end if;
  return new;
end;
$fn$;

revoke all on function public.enforce_current_session_retention_contract_v1()
  from public, anon, authenticated, service_role;

create or replace function public.enforce_current_artifact_retention_contract_v1()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $fn$
begin
  if new.retention_policy_version <>
      'derived-output-retention-v1-2026-07'
    or new.retention_class <> 'owned_story'
  then
    raise exception 'new rows require the current retention contract';
  end if;
  return new;
end;
$fn$;

revoke all on function public.enforce_current_artifact_retention_contract_v1()
  from public, anon, authenticated, service_role;

create trigger sessions_retention_contract_current_insert
before insert on public.sessions
for each row execute function
  public.enforce_current_session_retention_contract_v1();

create trigger story_artifacts_retention_contract_current_insert
before insert on public.story_artifacts
for each row execute function
  public.enforce_current_artifact_retention_contract_v1();

-- Closed deployment proof for the catalog properties that a PostgREST column
-- probe cannot establish. It returns booleans only and never exposes a row,
-- label value, default expression, or provider-derived story value.
create or replace function public.derived_output_retention_schema_health_v1()
returns table (
  ok boolean,
  columns_classified boolean,
  current_defaults boolean,
  constraints_valid boolean,
  trigger_enabled boolean,
  helper_bodies_valid boolean,
  labels_valid boolean,
  boundary_granted boolean
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v_columns_classified boolean;
  v_current_defaults boolean;
  v_constraints_valid boolean;
  v_trigger_enabled boolean;
  v_helper_bodies_valid boolean;
  v_labels_valid boolean;
  v_boundary_granted boolean;
begin
  with expected(table_name, column_name, retention_class) as (
    values
      -- retention-column-health:start
      ('sessions'::text, 'session_id'::text, 'owned_story'::text),
      ('sessions', 'user_id', 'owned_story'),
      ('sessions', 'figure_key', 'owned_story'),
      ('sessions', 'stage_id', 'owned_story'),
      ('sessions', 'story_artifact_id', 'owned_story'),
      ('sessions', 'framing', 'owned_story'),
      ('sessions', 'opening_copy', 'owned_story'),
      ('sessions', 'age', 'owned_story'),
      ('sessions', 'feeling', 'recovery_context'),
      ('sessions', 'story_request_context', 'recovery_context'),
      ('sessions', 'disclosure_expires_at', 'owned_story'),
      ('sessions', 'alternate_of_session_id', 'owned_story'),
      ('sessions', 'match_recipe', 'owned_story'),
      ('sessions', 'next_beat_index', 'owned_story'),
      ('sessions', 'next_chunk_index', 'owned_story'),
      ('sessions', 'created_at', 'owned_story'),
      ('sessions', 'updated_at', 'owned_story'),
      ('sessions', 'retention_policy_version', 'owned_story'),
      ('sessions', 'story_retention_class', 'owned_story'),
      ('sessions', 'context_retention_class', 'owned_story'),
      ('story_artifacts', 'artifact_id', 'owned_story'),
      ('story_artifacts', 'session_id', 'owned_story'),
      ('story_artifacts', 'user_id', 'owned_story'),
      ('story_artifacts', 'story_spec_id', 'owned_story'),
      ('story_artifacts', 'story_spec_version', 'owned_story'),
      ('story_artifacts', 'story_spec_schema_version', 'owned_story'),
      ('story_artifacts', 'figure_key', 'owned_story'),
      ('story_artifacts', 'stage_id', 'owned_story'),
      ('story_artifacts', 'schema_version', 'owned_story'),
      ('story_artifacts', 'composition_mode', 'owned_story'),
      ('story_artifacts', 'content_hash', 'owned_story'),
      ('story_artifacts', 'artifact', 'owned_story'),
      ('story_artifacts', 'created_at', 'owned_story'),
      ('story_artifacts', 'retention_policy_version', 'owned_story'),
      ('story_artifacts', 'retention_class', 'owned_story')
      -- retention-column-health:end
  ),
  actual(table_name, column_name) as (
    select relation.relname::text, attribute.attname::text
    from pg_catalog.pg_namespace namespace
    join pg_catalog.pg_class relation
      on relation.relnamespace = namespace.oid
    join pg_catalog.pg_attribute attribute
      on attribute.attrelid = relation.oid
    where namespace.nspname = 'public'
      and relation.relname in ('sessions', 'story_artifacts')
      and relation.relkind = 'r'
      and attribute.attnum > 0
      and not attribute.attisdropped
  )
  select
    not exists (
      select table_name, column_name from expected
      except
      select table_name, column_name from actual
    )
    and not exists (
      select table_name, column_name from actual
      except
      select table_name, column_name from expected
    )
    and not exists (
      select 1
      from expected
      where (
        table_name = 'sessions'
        and column_name in ('feeling', 'story_request_context')
        and retention_class <> 'recovery_context'
      ) or (
        table_name = 'sessions'
        and column_name not in ('feeling', 'story_request_context')
        and retention_class <> 'owned_story'
      ) or (
        table_name = 'story_artifacts'
        and retention_class <> 'owned_story'
      )
    )
  into v_columns_classified;

  select count(*) = 5 and coalesce(bool_and(
    attribute.attnotnull
    and default_definition.oid is not null
    and pg_catalog.format_type(
      attribute.atttypid,
      attribute.atttypmod
    ) = 'text'
    and pg_catalog.pg_get_expr(
      default_definition.adbin,
      default_definition.adrelid
    ) = pg_catalog.quote_literal(expected.default_value) || '::text'
  ), false)
  into v_current_defaults
  from (values
    (
      'sessions'::text,
      'retention_policy_version'::text,
      'derived-output-retention-v1-2026-07'::text
    ),
    ('sessions', 'story_retention_class', 'owned_story'),
    ('sessions', 'context_retention_class', 'recovery_context'),
    (
      'story_artifacts',
      'retention_policy_version',
      'derived-output-retention-v1-2026-07'
    ),
    ('story_artifacts', 'retention_class', 'owned_story')
  ) as expected(table_name, column_name, default_value)
  join pg_catalog.pg_namespace namespace
    on namespace.nspname = 'public'
  join pg_catalog.pg_class relation
    on relation.relnamespace = namespace.oid
    and relation.relname = expected.table_name
    and relation.relkind = 'r'
  join pg_catalog.pg_attribute attribute
    on attribute.attrelid = relation.oid
    and attribute.attname = expected.column_name
    and attribute.attnum > 0
    and not attribute.attisdropped
  left join pg_catalog.pg_attrdef default_definition
    on default_definition.adrelid = relation.oid
    and default_definition.adnum = attribute.attnum;

  select count(*) = 5 and coalesce(bool_and(
    constraint_record.contype = 'c'
    and constraint_record.convalidated
    and (
      select bool_and(
        pg_catalog.pg_get_constraintdef(
          constraint_record.oid,
          true
        ) like '%' || token || '%'
      )
      from unnest(expected.required_tokens) token
    )
  ), false)
  into v_constraints_valid
  from (values
    (
      'sessions'::text,
      'sessions_retention_policy_check'::text,
      array[
        'retention_policy_version',
        'legacy-pre-derived-output-retention-v0',
        'derived-output-retention-v1-2026-07'
      ]::text[]
    ),
    (
      'sessions',
      'sessions_story_retention_class_check',
      array['story_retention_class', 'owned_story']::text[]
    ),
    (
      'sessions',
      'sessions_context_retention_class_check',
      array['context_retention_class', 'recovery_context']::text[]
    ),
    (
      'story_artifacts',
      'story_artifacts_retention_policy_check',
      array[
        'retention_policy_version',
        'legacy-pre-derived-output-retention-v0',
        'derived-output-retention-v1-2026-07'
      ]::text[]
    ),
    (
      'story_artifacts',
      'story_artifacts_retention_class_check',
      array['retention_class', 'owned_story']::text[]
    )
  ) as expected(table_name, constraint_name, required_tokens)
  join pg_catalog.pg_namespace namespace
    on namespace.nspname = 'public'
  join pg_catalog.pg_class relation
    on relation.relnamespace = namespace.oid
    and relation.relname = expected.table_name
    and relation.relkind = 'r'
  join pg_catalog.pg_constraint constraint_record
    on constraint_record.conrelid = relation.oid
    and constraint_record.conname = expected.constraint_name;

  select count(*) = 4 and coalesce(bool_and(
    trigger_record.tgenabled = 'O'
    and not trigger_record.tgisinternal
    and trigger_record.tgqual is null
    and procedure_record.proname = expected.procedure_name
    and procedure_record.pronamespace = namespace.oid
    and trigger_record.tgtype = expected.trigger_type
    and pg_catalog.pg_get_triggerdef(trigger_record.oid, true)
      like '%' || expected.required_definition || '%'
  ), false)
  into v_trigger_enabled
  from (values
    (
      'sessions'::text,
      'sessions_retention_contract_immutable'::text,
      'protect_session_retention_contract_v1'::text,
      19::smallint,
      'BEFORE UPDATE OF retention_policy_version, story_retention_class, context_retention_class ON sessions'::text
    ),
    (
      'sessions',
      'sessions_retention_contract_current_insert',
      'enforce_current_session_retention_contract_v1',
      7::smallint,
      'BEFORE INSERT ON sessions'
    ),
    (
      'story_artifacts',
      'story_artifacts_retention_contract_current_insert',
      'enforce_current_artifact_retention_contract_v1',
      7::smallint,
      'BEFORE INSERT ON story_artifacts'
    ),
    (
      'story_artifacts',
      'story_artifacts_immutable',
      'reject_story_artifact_update',
      19::smallint,
      'BEFORE UPDATE ON story_artifacts'
    )
  ) as expected(
    table_name,
    trigger_name,
    procedure_name,
    trigger_type,
    required_definition
  )
  join pg_catalog.pg_trigger trigger_record
    on true
  join pg_catalog.pg_class relation
    on relation.oid = trigger_record.tgrelid
  join pg_catalog.pg_namespace namespace
    on namespace.oid = relation.relnamespace
  join pg_catalog.pg_proc procedure_record
    on procedure_record.oid = trigger_record.tgfoid
  where namespace.nspname = 'public'
    and relation.relname = expected.table_name
    and trigger_record.tgname = expected.trigger_name;

  select count(*) = 4 and coalesce(bool_and(
    language_record.lanname = 'plpgsql'
    and procedure_record.prokind = 'f'
    and procedure_record.pronargs = 0
    and procedure_record.prorettype = 'trigger'::pg_catalog.regtype
    and not procedure_record.prosecdef
    and pg_catalog.btrim(pg_catalog.regexp_replace(
      procedure_record.prosrc,
      E'\\s+',
      ' ',
      'g'
    )) = expected.normalized_body
    and pg_catalog.pg_get_functiondef(procedure_record.oid)
      like '%RETURNS trigger%'
  ), false)
  into v_helper_bodies_valid
  from (values
    (
      'protect_session_retention_contract_v1'::text,
      'begin if new.retention_policy_version is distinct from old.retention_policy_version or new.story_retention_class is distinct from old.story_retention_class or new.context_retention_class is distinct from old.context_retention_class then raise exception ''session retention contract is immutable''; end if; return new; end;'::text
    ),
    (
      'enforce_current_session_retention_contract_v1',
      'begin if new.retention_policy_version <> ''derived-output-retention-v1-2026-07'' or new.story_retention_class <> ''owned_story'' or new.context_retention_class <> ''recovery_context'' then raise exception ''new rows require the current retention contract''; end if; return new; end;'
    ),
    (
      'enforce_current_artifact_retention_contract_v1',
      'begin if new.retention_policy_version <> ''derived-output-retention-v1-2026-07'' or new.retention_class <> ''owned_story'' then raise exception ''new rows require the current retention contract''; end if; return new; end;'
    ),
    (
      'reject_story_artifact_update',
      'begin raise exception ''StoryArtifacts are immutable''; end'
    )
  ) as expected(procedure_name, normalized_body)
  join pg_catalog.pg_namespace namespace
    on namespace.nspname = 'public'
  join pg_catalog.pg_proc procedure_record
    on procedure_record.pronamespace = namespace.oid
    and procedure_record.proname = expected.procedure_name
  join pg_catalog.pg_language language_record
    on language_record.oid = procedure_record.prolang;

  select
    not exists (
      select 1
      from public.sessions session
      where session.retention_policy_version not in (
          'legacy-pre-derived-output-retention-v0',
          'derived-output-retention-v1-2026-07'
        )
        or session.story_retention_class <> 'owned_story'
        or session.context_retention_class <> 'recovery_context'
    )
    and not exists (
      select 1
      from public.story_artifacts artifact
      where artifact.retention_policy_version not in (
          'legacy-pre-derived-output-retention-v0',
          'derived-output-retention-v1-2026-07'
        )
        or artifact.retention_class <> 'owned_story'
    )
  into v_labels_valid;

  v_boundary_granted :=
    pg_catalog.has_function_privilege(
      'service_role',
      'public.derived_output_retention_schema_health_v1()',
      'EXECUTE'
    )
    and not exists (
      select 1
      from (values
        ('anon'::text),
        ('authenticated'::text)
      ) as principal(role_name)
      where pg_catalog.has_function_privilege(
        principal.role_name,
        'public.derived_output_retention_schema_health_v1()',
        'EXECUTE'
      )
    )
    and not exists (
      select 1
      from (values
        ('anon'::text),
        ('authenticated'::text),
        ('service_role'::text)
      ) as principal(role_name)
      where pg_catalog.has_function_privilege(
        principal.role_name,
        'public.protect_session_retention_contract_v1()',
        'EXECUTE'
      ) or pg_catalog.has_function_privilege(
        principal.role_name,
        'public.enforce_current_session_retention_contract_v1()',
        'EXECUTE'
      ) or pg_catalog.has_function_privilege(
        principal.role_name,
        'public.enforce_current_artifact_retention_contract_v1()',
        'EXECUTE'
      )
    );

  return query select
    v_columns_classified
      and v_current_defaults
      and v_constraints_valid
      and v_trigger_enabled
      and v_helper_bodies_valid
      and v_labels_valid
      and v_boundary_granted,
    v_columns_classified,
    v_current_defaults,
    v_constraints_valid,
    v_trigger_enabled,
    v_helper_bodies_valid,
    v_labels_valid,
    v_boundary_granted;
end
$fn$;

revoke all on function public.derived_output_retention_schema_health_v1()
  from public, anon, authenticated, service_role;
grant execute on function public.derived_output_retention_schema_health_v1()
  to service_role;

notify pgrst, 'reload schema';
