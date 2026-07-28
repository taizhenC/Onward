-- Onward durable account-level Owner Story Save state, migration 0022.
-- Apply as one transaction after 0021 and before the state-aware application.
--
-- Save is account-wide (CONTEXT.md), so this relation records the owner
-- lifecycle once rather than stamping every current/future session. The Auth
-- trigger is deliberately narrow: it inserts only this row and takes no
-- Session, telemetry, or advisory locks while auth.users is already locked.

set local lock_timeout = '10s';
set local statement_timeout = '30s';

create table public.owner_story_save_states (
  user_id uuid primary key
    references auth.users (id) on delete cascade,
  saved_at timestamptz,
  observed_at timestamptz not null default statement_timestamp(),
  evidence_kind text not null,
  save_policy_version text not null,
  retention_policy_version text not null
    default 'derived-output-retention-v1-2026-07',
  retention_class text not null default 'owned_story',

  constraint owner_story_save_evidence_check check (
    (
      evidence_kind = 'anonymous_upgrade'
      and saved_at is not null
      and saved_at = observed_at
      and save_policy_version = 'durable-account-save-v1-2026-07'
    )
    or (
      evidence_kind = 'legacy_permanent_observed'
      and saved_at is null
      and save_policy_version = 'legacy-pre-durable-save-v0'
    )
  ),
  constraint owner_story_save_retention_check check (
    retention_policy_version = 'derived-output-retention-v1-2026-07'
    and retention_class = 'owned_story'
  )
);

comment on table public.owner_story_save_states is
  'One immutable account-lifecycle Save record. Current evidence has an exact transition timestamp; legacy evidence never fabricates one.';
comment on column public.owner_story_save_states.saved_at is
  'Exact Auth transition time for current-policy evidence; NULL for honest legacy observations.';
comment on column public.owner_story_save_states.observed_at is
  'Time Onward recorded the evidence. Equals saved_at for current transitions; migration observation time for legacy rows.';

alter table public.owner_story_save_states enable row level security;
alter table public.owner_story_save_states force row level security;

revoke all on table public.owner_story_save_states
  from public, anon, authenticated, service_role;
grant select on table public.owner_story_save_states to service_role;

create or replace function public.reject_owner_story_save_state_update_v1()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $fn$
begin
  raise exception 'owner story save state is immutable';
end
$fn$;

revoke all on function public.reject_owner_story_save_state_update_v1()
  from public, anon, authenticated, service_role;

create trigger owner_story_save_state_immutable
before update on public.owner_story_save_states
for each row execute function public.reject_owner_story_save_state_update_v1();

create or replace function public.record_owner_story_save_from_auth_v1()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v_now timestamptz := statement_timestamp();
begin
  if old.is_anonymous is not true or new.is_anonymous is true then
    return new;
  end if;

  insert into public.owner_story_save_states (
    user_id,
    saved_at,
    observed_at,
    evidence_kind,
    save_policy_version,
    retention_policy_version,
    retention_class
  ) values (
    new.id,
    v_now,
    v_now,
    'anonymous_upgrade',
    'durable-account-save-v1-2026-07',
    'derived-output-retention-v1-2026-07',
    'owned_story'
  )
  on conflict (user_id) do nothing;

  return new;
end
$fn$;

revoke all on function public.record_owner_story_save_from_auth_v1()
  from public, anon, authenticated, service_role;

-- Boolean-only health proof. No owner ID, timestamp, count, or evidence value
-- crosses this service boundary.
create or replace function public.owner_story_save_schema_health_v1()
returns table (
  ok boolean,
  table_shape_valid boolean,
  constraints_valid boolean,
  triggers_enabled boolean,
  helper_bodies_valid boolean,
  grants_valid boolean,
  rls_valid boolean,
  coverage_valid boolean,
  rows_valid boolean
)
language sql
security definer
set search_path = pg_catalog, public
as $fn$
  with table_shape as (
    select coalesce(
      array_agg(
        format(
          '%s:%s:%s',
          attribute.attname,
          format_type(attribute.atttypid, attribute.atttypmod),
          case when attribute.attnotnull then 'true' else 'false' end
        )
        order by attribute.attnum
      ),
      array[]::text[]
    ) = array[
      'user_id:uuid:true',
      'saved_at:timestamp with time zone:false',
      'observed_at:timestamp with time zone:true',
      'evidence_kind:text:true',
      'save_policy_version:text:true',
      'retention_policy_version:text:true',
      'retention_class:text:true'
    ]::text[]
    and (
      select count(*) = 3
      from pg_attrdef default_row
      where default_row.adrelid =
        'public.owner_story_save_states'::regclass
    )
    and exists (
      select 1
      from pg_attrdef default_row
      join pg_attribute default_attribute
        on default_attribute.attrelid = default_row.adrelid
        and default_attribute.attnum = default_row.adnum
      where default_row.adrelid =
          'public.owner_story_save_states'::regclass
        and default_attribute.attname = 'observed_at'
        and lower(
          pg_get_expr(default_row.adbin, default_row.adrelid)
        ) = 'statement_timestamp()'
    )
    and exists (
      select 1
      from pg_attrdef default_row
      join pg_attribute default_attribute
        on default_attribute.attrelid = default_row.adrelid
        and default_attribute.attnum = default_row.adnum
      where default_row.adrelid =
          'public.owner_story_save_states'::regclass
        and default_attribute.attname = 'retention_policy_version'
        and position(
          'derived-output-retention-v1-2026-07'
          in lower(pg_get_expr(default_row.adbin, default_row.adrelid))
        ) > 0
    )
    and exists (
      select 1
      from pg_attrdef default_row
      join pg_attribute default_attribute
        on default_attribute.attrelid = default_row.adrelid
        and default_attribute.attnum = default_row.adnum
      where default_row.adrelid =
          'public.owner_story_save_states'::regclass
        and default_attribute.attname = 'retention_class'
        and position(
          'owned_story'
          in lower(pg_get_expr(default_row.adbin, default_row.adrelid))
        ) > 0
    ) as value
    from pg_attribute attribute
    where attribute.attrelid = 'public.owner_story_save_states'::regclass
      and attribute.attnum > 0
      and not attribute.attisdropped
  ),
  constraint_catalog as (
    select
      constraint_row.*,
      lower(pg_get_constraintdef(constraint_row.oid, true)) as definition
    from pg_constraint constraint_row
    where constraint_row.conrelid =
        'public.owner_story_save_states'::regclass
      and constraint_row.contype in ('c', 'p', 'f')
  ),
  constraint_health as (
    select coalesce(
      array_agg(
        format(
          '%s:%s:%s',
          constraint_row.conname,
          constraint_row.contype::text,
          case when constraint_row.convalidated then 'true' else 'false' end
        )
        order by constraint_row.conname
      ),
      array[]::text[]
    ) = array[
      'owner_story_save_evidence_check:c:true',
      'owner_story_save_retention_check:c:true',
      'owner_story_save_states_pkey:p:true',
      'owner_story_save_states_user_id_fkey:f:true'
    ]::text[]
    and count(*) filter (
      where constraint_row.conname = 'owner_story_save_evidence_check'
        and position('anonymous_upgrade' in constraint_row.definition) > 0
        and position(
          'permanent_account_created'
          in constraint_row.definition
        ) = 0
        and position(
          'legacy_permanent_observed'
          in constraint_row.definition
        ) > 0
        and position(
          'durable-account-save-v1-2026-07'
          in constraint_row.definition
        ) > 0
        and position(
          'legacy-pre-durable-save-v0'
          in constraint_row.definition
        ) > 0
        and position(
          'saved_at = observed_at'
          in constraint_row.definition
        ) > 0
    ) = 1
    and count(*) filter (
      where constraint_row.conname = 'owner_story_save_retention_check'
        and position(
          'derived-output-retention-v1-2026-07'
          in constraint_row.definition
        ) > 0
        and position('owned_story' in constraint_row.definition) > 0
    ) = 1
    and count(*) filter (
      where constraint_row.conname = 'owner_story_save_states_pkey'
        and constraint_row.definition = 'primary key (user_id)'
    ) = 1
    and count(*) filter (
      where constraint_row.conname =
          'owner_story_save_states_user_id_fkey'
        and constraint_row.confrelid = 'auth.users'::regclass
        and constraint_row.confdeltype = 'c'
        and position('foreign key (user_id)' in constraint_row.definition) > 0
        and position('references auth.users(id)' in constraint_row.definition) > 0
        and position('on delete cascade' in constraint_row.definition) > 0
    ) = 1 as value
    from constraint_catalog constraint_row
  ),
  trigger_health as (
    select
      count(*) filter (
        where trigger_row.tgname = 'owner_story_save_state_immutable'
          and trigger_row.tgenabled = 'O'
          and trigger_row.tgrelid =
            'public.owner_story_save_states'::regclass
          and procedure_row.proname =
            'reject_owner_story_save_state_update_v1'
          and position(
            'before update on public.owner_story_save_states'
            in lower(pg_get_triggerdef(trigger_row.oid))
          ) > 0
      ) = 1
      and count(*) filter (
        where trigger_row.tgname = 'onward_record_owner_story_save'
          and trigger_row.tgenabled = 'O'
          and trigger_row.tgrelid = 'auth.users'::regclass
          and procedure_row.proname =
            'record_owner_story_save_from_auth_v1'
          and position(
            'after update of is_anonymous on auth.users'
            in lower(pg_get_triggerdef(trigger_row.oid))
          ) > 0
      ) = 1
      and count(*) = 2 as value
    from pg_trigger trigger_row
    join pg_proc procedure_row
      on procedure_row.oid = trigger_row.tgfoid
    where not trigger_row.tgisinternal
      and trigger_row.tgname in (
        'owner_story_save_state_immutable',
        'onward_record_owner_story_save'
      )
  ),
  helper_health as (
    select
      count(*) filter (
        where procedure_row.proname =
          'reject_owner_story_save_state_update_v1'
          and position(
            'owner story save state is immutable'
            in lower(procedure_row.prosrc)
          ) > 0
          and not procedure_row.prosecdef
          and position(
            'search_path=pg_catalog, public'
            in array_to_string(procedure_row.proconfig, ',')
          ) > 0
      ) = 1
      and count(*) filter (
        where procedure_row.proname =
          'record_owner_story_save_from_auth_v1'
          and position(
            'anonymous_upgrade'
            in lower(procedure_row.prosrc)
          ) > 0
          and position(
            'permanent_account_created'
            in lower(procedure_row.prosrc)
          ) = 0
          and position(
            'old.is_anonymous is not true'
            in lower(procedure_row.prosrc)
          ) > 0
          and position(
            'new.is_anonymous is true'
            in lower(procedure_row.prosrc)
          ) > 0
          and position(
            'on conflict (user_id) do nothing'
            in lower(procedure_row.prosrc)
          ) > 0
          and procedure_row.prosecdef
          and (owner_role.rolsuper or owner_role.rolbypassrls)
          and position(
            'search_path=pg_catalog, public'
            in array_to_string(procedure_row.proconfig, ',')
          ) > 0
      ) = 1
      and count(*) filter (
        where procedure_row.proname =
          'owner_story_save_schema_health_v1'
          and procedure_row.prosecdef
          and (owner_role.rolsuper or owner_role.rolbypassrls)
          and position(
            'search_path=pg_catalog, public'
            in array_to_string(procedure_row.proconfig, ',')
          ) > 0
      ) = 1 as value
    from pg_proc procedure_row
    join pg_namespace namespace_row
      on namespace_row.oid = procedure_row.pronamespace
    join pg_roles owner_role
      on owner_role.oid = procedure_row.proowner
    where namespace_row.nspname = 'public'
      and procedure_row.pronargs = 0
      and procedure_row.proname in (
        'reject_owner_story_save_state_update_v1',
        'record_owner_story_save_from_auth_v1',
        'owner_story_save_schema_health_v1'
      )
  ),
  grant_health as (
    select
      has_table_privilege(
        'service_role',
        'public.owner_story_save_states',
        'SELECT'
      )
      and not has_table_privilege(
        'service_role',
        'public.owner_story_save_states',
        'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER'
      )
      and not has_table_privilege(
        'anon',
        'public.owner_story_save_states',
        'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER'
      )
      and not has_table_privilege(
        'authenticated',
        'public.owner_story_save_states',
        'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER'
      )
      and not exists (
        select 1
        from (values
          ('anon'::text),
          ('authenticated'::text),
          ('service_role'::text)
        ) as principal(role_name)
        cross join (values
          ('public.reject_owner_story_save_state_update_v1()'::text),
          ('public.record_owner_story_save_from_auth_v1()'::text)
        ) as helper(function_name)
        where has_function_privilege(
          principal.role_name,
          helper.function_name,
          'EXECUTE'
        )
      )
      and has_function_privilege(
        'service_role',
        'public.owner_story_save_schema_health_v1()',
        'EXECUTE'
      )
      and not exists (
        select 1
        from (values
          ('anon'::text),
          ('authenticated'::text)
        ) as principal(role_name)
        where has_function_privilege(
          principal.role_name,
          'public.owner_story_save_schema_health_v1()',
          'EXECUTE'
        )
      ) as value
  ),
  rls_health as (
    select
      catalog.relrowsecurity
      and catalog.relforcerowsecurity
      and not exists (
        select 1
        from pg_policy policy_row
        where policy_row.polrelid = catalog.oid
      ) as value
    from pg_class catalog
    where catalog.oid = 'public.owner_story_save_states'::regclass
  ),
  coverage_health as (
    select
      not exists (
        select 1
        from auth.users owner_row
        where owner_row.is_anonymous is not true
          and not exists (
            select 1
            from public.owner_story_save_states save_row
            where save_row.user_id = owner_row.id
          )
      )
      and not exists (
        select 1
        from public.owner_story_save_states save_row
        join auth.users owner_row on owner_row.id = save_row.user_id
        where owner_row.is_anonymous is true
      ) as value
  ),
  row_health as (
    select not exists (
      select 1
      from public.owner_story_save_states save_row
      where save_row.retention_policy_version <>
          'derived-output-retention-v1-2026-07'
        or save_row.retention_class <> 'owned_story'
        or (
          save_row.evidence_kind = 'anonymous_upgrade'
          and (
            save_row.saved_at is null
            or save_row.saved_at <> save_row.observed_at
            or save_row.save_policy_version <>
              'durable-account-save-v1-2026-07'
          )
        )
        or (
          save_row.evidence_kind = 'legacy_permanent_observed'
          and (
            save_row.saved_at is not null
            or save_row.save_policy_version <>
              'legacy-pre-durable-save-v0'
          )
        )
        or save_row.evidence_kind not in (
          'anonymous_upgrade',
          'legacy_permanent_observed'
        )
    ) as value
  )
  select
    table_shape.value
      and constraint_health.value
      and trigger_health.value
      and helper_health.value
      and grant_health.value
      and rls_health.value
      and coverage_health.value
      and row_health.value as ok,
    table_shape.value as table_shape_valid,
    constraint_health.value as constraints_valid,
    trigger_health.value as triggers_enabled,
    helper_health.value as helper_bodies_valid,
    grant_health.value as grants_valid,
    rls_health.value as rls_valid,
    coverage_health.value as coverage_valid,
    row_health.value as rows_valid
  from table_shape,
    constraint_health,
    trigger_health,
    helper_health,
    grant_health,
    rls_health,
    coverage_health,
    row_health
$fn$;

revoke all on function public.owner_story_save_schema_health_v1()
  from public, anon, authenticated;
grant execute on function public.owner_story_save_schema_health_v1()
  to service_role;

comment on function public.owner_story_save_schema_health_v1() is
  'Returns only closed booleans proving the durable owner-save schema, trigger, coverage, and grants.';

-- Keep the Auth write pause as short as possible. Installing the trigger before
-- the legacy scan must still be one atomic cutover: SHARE ROW EXCLUSIVE blocks
-- concurrent Auth writes while leaving reads available.
lock table auth.users in share row exclusive mode;

create trigger onward_record_owner_story_save
after update of is_anonymous on auth.users
for each row execute function public.record_owner_story_save_from_auth_v1();

-- Existing permanent accounts were already retained under the original Auth
-- behavior. We can prove that observation now, but not when the account became
-- permanent, so saved_at remains NULL and the legacy policy stays explicit.
insert into public.owner_story_save_states (
  user_id,
  saved_at,
  observed_at,
  evidence_kind,
  save_policy_version,
  retention_policy_version,
  retention_class
)
select
  existing.id,
  null,
  statement_timestamp(),
  'legacy_permanent_observed',
  'legacy-pre-durable-save-v0',
  'derived-output-retention-v1-2026-07',
  'owned_story'
from auth.users existing
where existing.is_anonymous is not true
on conflict (user_id) do nothing;

notify pgrst, 'reload schema';
