-- Onward - strict StorySpec identity and compare-and-set publication, migration 0023.
-- Apply after 0004. Reader traffic is unaffected; stale editorial tooling fails closed.

set local lock_timeout = '10s';
set local statement_timeout = '30s';

-- The 0004 text comparisons can evaluate to SQL NULL when a JSON identity is
-- absent, and CHECK accepts NULL. Direct jsonb equality plus IS TRUE rejects
-- absent/null keys, scalar documents, type drift, and stringified versions.
alter table public.story_specs
  add constraint story_specs_document_identity_strict_check
  check ((
    pg_catalog.jsonb_typeof(spec) = 'object'
    and spec -> 'storySpecId' =
      pg_catalog.to_jsonb(story_spec_id)
    and spec -> 'figureKey' =
      pg_catalog.to_jsonb(figure_key)
    and spec -> 'stageId' =
      pg_catalog.to_jsonb(stage_id)
    and spec -> 'version' =
      pg_catalog.to_jsonb(version)
    and spec -> 'schemaVersion' =
      pg_catalog.to_jsonb(schema_version)
    and spec -> 'status' =
      pg_catalog.to_jsonb(status)
  ) is true)
  not valid;

alter table public.story_specs
  validate constraint story_specs_document_identity_strict_check;

alter table public.story_specs
  drop constraint story_specs_document_identity_check;

alter table public.story_specs
  rename constraint story_specs_document_identity_strict_check
  to story_specs_document_identity_check;

-- The caller validates one exact review document in TypeScript. This function
-- locks the row and proves that same document is still current before it
-- retires anything, eliminating the validation-to-promotion race.
create or replace function public.promote_story_spec_v2(
  p_story_spec_id text,
  p_expected_review_spec jsonb
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v_target public.story_specs%rowtype;
begin
  select target.*
  into v_target
  from public.story_specs target
  where target.story_spec_id = p_story_spec_id
  for update;

  if not found then
    raise exception 'StorySpec not found';
  end if;
  if v_target.status is distinct from 'review' then
    raise exception 'only a reviewed StorySpec can be promoted';
  end if;
  if v_target.spec is distinct from p_expected_review_spec then
    raise exception 'reviewed StorySpec changed; reload and revalidate';
  end if;

  if coalesce(v_target.spec #>> '{review,researcherId}', '') = ''
    or coalesce(v_target.spec #>> '{review,historicalReviewerId}', '') = ''
    or coalesce(v_target.spec #>> '{review,toneReviewerId}', '') = ''
    or coalesce(v_target.spec #>> '{review,reviewedAt}', '') = ''
    or coalesce(
      v_target.spec #>> '{review,contentProfileReviewed}',
      ''
    ) <> 'true' then
    raise exception 'required editorial approvals are missing';
  end if;
  if pg_catalog.jsonb_path_exists(
    v_target.spec,
    '$.facts[*].sourceRefs[*] ? (@.scope == "broad")'
  ) or pg_catalog.jsonb_path_exists(
    v_target.spec,
    '$.quotes[*].sourceRefs[*] ? (@.scope == "broad")'
  ) then
    raise exception 'broad source mappings cannot be published';
  end if;
  if exists (
    select 1
    from pg_catalog.jsonb_array_elements(v_target.spec -> 'arc') as beat
    where beat ->> 'role' <> 'bridge'
      and coalesce(
        pg_catalog.jsonb_array_length(beat -> 'requiredFactIds'),
        0
      ) = 0
  ) then
    raise exception 'canonical beats require supporting fact IDs';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      v_target.figure_key || ':' || v_target.stage_id,
      0
    )
  );

  update public.story_specs target
  set status = 'retired',
      spec = pg_catalog.jsonb_set(
        target.spec,
        '{status}',
        pg_catalog.to_jsonb('retired'::text),
        false
      )
  where target.figure_key = v_target.figure_key
    and target.stage_id = v_target.stage_id
    and target.status = 'published';

  update public.story_specs target
  set status = 'published',
      spec = pg_catalog.jsonb_set(
        target.spec,
        '{status}',
        pg_catalog.to_jsonb('published'::text),
        false
      )
  where target.story_spec_id = p_story_spec_id
    and target.status = 'review'
    and target.spec = p_expected_review_spec;

  if not found then
    raise exception 'reviewed StorySpec changed; reload and revalidate';
  end if;

  update public.figure_stages stage
  set status = 'published'
  where stage.figure_key = v_target.figure_key
    and stage.stage_id = v_target.stage_id;
end
$fn$;

-- The legacy ID-only RPC remains discoverable for a clear permission failure,
-- but no application role may execute it after this migration.
revoke all on function public.promote_story_spec(text)
  from public, anon, authenticated, service_role;
revoke all on function public.promote_story_spec_v2(text, jsonb)
  from public, anon, authenticated, service_role;
grant execute on function public.promote_story_spec_v2(text, jsonb)
  to service_role;

-- Boolean-only live proof for release readiness. It exposes no StorySpec,
-- reviewer, source, stage, row-count, or timestamp data.
create or replace function public.story_spec_publication_schema_health_v1()
returns table (
  ok boolean,
  identity_constraint_valid boolean,
  lifecycle_trigger_enabled boolean,
  promotion_cas_valid boolean,
  legacy_rpc_revoked boolean,
  boundary_granted boolean
)
language sql
security definer
set search_path = pg_catalog, public
as $fn$
  with identity_health as (
    select count(*) filter (
      where constraint_row.conname =
          'story_specs_document_identity_check'
        and constraint_row.contype = 'c'
        and constraint_row.convalidated
        and position(
          'jsonb_typeof(spec)'
          in lower(pg_catalog.pg_get_constraintdef(
            constraint_row.oid,
            true
          ))
        ) > 0
        and position(
          'storyspecid'
          in lower(pg_catalog.pg_get_constraintdef(
            constraint_row.oid,
            true
          ))
        ) > 0
        and position(
          'figurekey'
          in lower(pg_catalog.pg_get_constraintdef(
            constraint_row.oid,
            true
          ))
        ) > 0
        and position(
          'stageid'
          in lower(pg_catalog.pg_get_constraintdef(
            constraint_row.oid,
            true
          ))
        ) > 0
        and position(
          'to_jsonb(version)'
          in lower(pg_catalog.pg_get_constraintdef(
            constraint_row.oid,
            true
          ))
        ) > 0
        and position(
          'schemaversion'
          in lower(pg_catalog.pg_get_constraintdef(
            constraint_row.oid,
            true
          ))
        ) > 0
        and position(
          'is true'
          in lower(pg_catalog.pg_get_constraintdef(
            constraint_row.oid,
            true
          ))
        ) > 0
        and position(
          '->>'
          in lower(pg_catalog.pg_get_constraintdef(
            constraint_row.oid,
            true
          ))
        ) = 0
    ) = 1 as value
    from pg_catalog.pg_constraint constraint_row
    where constraint_row.conrelid = 'public.story_specs'::regclass
  ),
  lifecycle_health as (
    select count(*) filter (
      where trigger_row.tgname = 'story_specs_lifecycle'
        and trigger_row.tgenabled = 'O'
        and trigger_row.tgrelid = 'public.story_specs'::regclass
        and procedure_row.proname = 'enforce_story_spec_lifecycle'
    ) = 1 as value
    from pg_catalog.pg_trigger trigger_row
    join pg_catalog.pg_proc procedure_row
      on procedure_row.oid = trigger_row.tgfoid
    where not trigger_row.tgisinternal
      and trigger_row.tgname = 'story_specs_lifecycle'
  ),
  promotion_health as (
    select count(*) filter (
      where procedure_row.proname = 'promote_story_spec_v2'
        and procedure_row.pronargs = 2
        and pg_catalog.oidvectortypes(procedure_row.proargtypes) =
          'text, jsonb'
        and procedure_row.proargnames =
          array['p_story_spec_id', 'p_expected_review_spec']::text[]
        and procedure_row.prosecdef
        and (owner_role.rolsuper or owner_role.rolbypassrls)
        and position(
          'search_path=pg_catalog, public'
          in pg_catalog.array_to_string(procedure_row.proconfig, ',')
        ) > 0
        and position(
          'for update'
          in lower(procedure_row.prosrc)
        ) > 0
        and position(
          'v_target.spec is distinct from p_expected_review_spec'
          in lower(procedure_row.prosrc)
        ) > position(
          'for update'
          in lower(procedure_row.prosrc)
        )
        and position(
          'set status = ''retired'''
          in lower(procedure_row.prosrc)
        ) > position(
          'v_target.spec is distinct from p_expected_review_spec'
          in lower(procedure_row.prosrc)
        )
        and position(
          'target.status = ''review'''
          in lower(procedure_row.prosrc)
        ) > 0
        and position(
          'target.spec = p_expected_review_spec'
          in lower(procedure_row.prosrc)
        ) > 0
    ) = 1 as value
    from pg_catalog.pg_proc procedure_row
    join pg_catalog.pg_namespace namespace_row
      on namespace_row.oid = procedure_row.pronamespace
    join pg_catalog.pg_roles owner_role
      on owner_role.oid = procedure_row.proowner
    where namespace_row.nspname = 'public'
      and procedure_row.proname = 'promote_story_spec_v2'
  ),
  legacy_health as (
    select
      not pg_catalog.has_function_privilege(
        'service_role',
        'public.promote_story_spec(text)',
        'EXECUTE'
      )
      and not pg_catalog.has_function_privilege(
        'anon',
        'public.promote_story_spec(text)',
        'EXECUTE'
      )
      and not pg_catalog.has_function_privilege(
        'authenticated',
        'public.promote_story_spec(text)',
        'EXECUTE'
      ) as value
  ),
  grant_health as (
    select
      pg_catalog.has_function_privilege(
        'service_role',
        'public.promote_story_spec_v2(text,jsonb)',
        'EXECUTE'
      )
      and not pg_catalog.has_function_privilege(
        'anon',
        'public.promote_story_spec_v2(text,jsonb)',
        'EXECUTE'
      )
      and not pg_catalog.has_function_privilege(
        'authenticated',
        'public.promote_story_spec_v2(text,jsonb)',
        'EXECUTE'
      )
      and pg_catalog.has_function_privilege(
        'service_role',
        'public.story_spec_publication_schema_health_v1()',
        'EXECUTE'
      )
      and not pg_catalog.has_function_privilege(
        'anon',
        'public.story_spec_publication_schema_health_v1()',
        'EXECUTE'
      )
      and not pg_catalog.has_function_privilege(
        'authenticated',
        'public.story_spec_publication_schema_health_v1()',
        'EXECUTE'
      ) as value
  )
  select
    identity_health.value
      and lifecycle_health.value
      and promotion_health.value
      and legacy_health.value
      and grant_health.value as ok,
    identity_health.value as identity_constraint_valid,
    lifecycle_health.value as lifecycle_trigger_enabled,
    promotion_health.value as promotion_cas_valid,
    legacy_health.value as legacy_rpc_revoked,
    grant_health.value as boundary_granted
  from identity_health,
    lifecycle_health,
    promotion_health,
    legacy_health,
    grant_health
$fn$;

revoke all on function public.story_spec_publication_schema_health_v1()
  from public, anon, authenticated, service_role;
grant execute on function public.story_spec_publication_schema_health_v1()
  to service_role;

comment on function public.story_spec_publication_schema_health_v1() is
  'Returns only booleans proving strict StorySpec identity, lifecycle, compare-and-set promotion, and grants.';

notify pgrst, 'reload schema';
