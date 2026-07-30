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
  published_stage_uniqueness_valid boolean,
  promotion_cas_valid boolean,
  legacy_rpc_revoked boolean,
  boundary_granted boolean
)
language sql
security definer
set search_path = pg_catalog, public
as $fn$
  with identity_constraint_catalog as (
    select
      constraint_row.*,
      pg_catalog.translate(
        pg_catalog.replace(
          pg_catalog.replace(
            pg_catalog.regexp_replace(
              pg_catalog.lower(
                pg_catalog.pg_get_constraintdef(
                  constraint_row.oid,
                  true
                )
              ),
              E'\\s+',
              '',
              'g'
            ),
            '::text',
            ''
          ),
          'pg_catalog.',
          ''
        ),
        '()',
        ''
      ) as normalized_definition
    from pg_catalog.pg_constraint constraint_row
    where constraint_row.conrelid = 'public.story_specs'::regclass
      and constraint_row.conname =
        'story_specs_document_identity_check'
  ),
  identity_health as (
    select count(*) filter (
      where constraint_row.conname =
          'story_specs_document_identity_check'
        and constraint_row.contype = 'c'
        and constraint_row.convalidated
        and constraint_row.conislocal
        and constraint_row.coninhcount = 0
        and not constraint_row.connoinherit
        and constraint_row.normalized_definition =
          'checkjsonb_typeofspec=''object'''
          || 'andspec->''storyspecid''=to_jsonbstory_spec_id'
          || 'andspec->''figurekey''=to_jsonbfigure_key'
          || 'andspec->''stageid''=to_jsonbstage_id'
          || 'andspec->''version''=to_jsonbversion'
          || 'andspec->''schemaversion''=to_jsonbschema_version'
          || 'andspec->''status''=to_jsonbstatusistrue'
    ) = 1 as value
    from identity_constraint_catalog constraint_row
  ),
  lifecycle_helper_health as (
    select count(*) filter (
      where namespace_row.nspname = 'public'
        and procedure_row.proname = 'enforce_story_spec_lifecycle'
        and procedure_row.prokind = 'f'
        and procedure_row.pronargs = 0
        and procedure_row.proallargtypes is null
        and procedure_row.proargmodes is null
        and procedure_row.proargnames is null
        and procedure_row.prorettype = 'trigger'::pg_catalog.regtype
        and not procedure_row.proretset
        and not procedure_row.prosecdef
        and procedure_row.provolatile = 'v'
        and language_row.lanname = 'plpgsql'
        and procedure_row.proconfig =
          array['search_path=public']::text[]
        -- Fingerprint the 0004 helper after removing comments and normalizing
        -- case/whitespace so line endings cannot change the live proof.
        and pg_catalog.md5(
          pg_catalog.btrim(
            pg_catalog.regexp_replace(
              pg_catalog.lower(
                pg_catalog.regexp_replace(
                  procedure_row.prosrc,
                  E'--[^\\n\\r]*',
                  ' ',
                  'g'
                )
              ),
              E'\\s+',
              ' ',
              'g'
            )
          )
        ) = '4319d665aca2de512bf07bdb2b865f3a'
    ) = 1 as value
    from pg_catalog.pg_proc procedure_row
    join pg_catalog.pg_namespace namespace_row
      on namespace_row.oid = procedure_row.pronamespace
    join pg_catalog.pg_language language_row
      on language_row.oid = procedure_row.prolang
    where namespace_row.nspname = 'public'
      and procedure_row.proname = 'enforce_story_spec_lifecycle'
  ),
  lifecycle_trigger_health as (
    select count(*) filter (
      where trigger_row.tgname = 'story_specs_lifecycle'
        and trigger_row.tgenabled = 'O'
        and not trigger_row.tgisinternal
        and trigger_row.tgtype = 23::smallint
        and trigger_row.tgattr = ''::pg_catalog.int2vector
        and trigger_row.tgqual is null
        and trigger_row.tgnargs = 0
        and trigger_row.tgconstraint = 0::pg_catalog.oid
        and trigger_row.tgoldtable is null
        and trigger_row.tgnewtable is null
        and table_namespace.nspname = 'public'
        and table_relation.relname = 'story_specs'
        and table_relation.relkind = 'r'
        and function_namespace.nspname = 'public'
        and procedure_row.proname = 'enforce_story_spec_lifecycle'
        and procedure_row.pronargs = 0
        and procedure_row.prorettype = 'trigger'::pg_catalog.regtype
    ) = 1 as value
    from pg_catalog.pg_trigger trigger_row
    join pg_catalog.pg_class table_relation
      on table_relation.oid = trigger_row.tgrelid
    join pg_catalog.pg_namespace table_namespace
      on table_namespace.oid = table_relation.relnamespace
    join pg_catalog.pg_proc procedure_row
      on procedure_row.oid = trigger_row.tgfoid
    join pg_catalog.pg_namespace function_namespace
      on function_namespace.oid = procedure_row.pronamespace
    where trigger_row.tgname = 'story_specs_lifecycle'
  ),
  lifecycle_health as (
    select
      lifecycle_helper_health.value
        and lifecycle_trigger_health.value as value
    from lifecycle_helper_health,
      lifecycle_trigger_health
  ),
  publication_index_health as (
    select count(*) filter (
      where table_namespace.nspname = 'public'
        and table_relation.relname = 'story_specs'
        and table_relation.relkind = 'r'
        and index_namespace.nspname = 'public'
        and index_relation.relname =
          'story_specs_one_published_stage_idx'
        and index_relation.relkind = 'i'
        and access_method.amname = 'btree'
        and index_row.indisunique
        and index_row.indisvalid
        and index_row.indisready
        and index_row.indislive
        and not index_row.indisprimary
        and not index_row.indisexclusion
        and index_row.indnkeyatts = 2
        and index_row.indnatts = 2
        and index_row.indexprs is null
        and index_row.indpred is not null
        and pg_catalog.pg_get_indexdef(
          index_row.indexrelid,
          1,
          true
        ) = 'figure_key'
        and pg_catalog.pg_get_indexdef(
          index_row.indexrelid,
          2,
          true
        ) = 'stage_id'
        and pg_catalog.translate(
          pg_catalog.replace(
            pg_catalog.regexp_replace(
              pg_catalog.lower(
                pg_catalog.pg_get_expr(
                  index_row.indpred,
                  index_row.indrelid,
                  true
                )
              ),
              E'\\s+',
              '',
              'g'
            ),
            '::text',
            ''
          ),
          '()',
          ''
        ) = 'status=''published'''
    ) = 1 as value
    from pg_catalog.pg_index index_row
    join pg_catalog.pg_class index_relation
      on index_relation.oid = index_row.indexrelid
    join pg_catalog.pg_namespace index_namespace
      on index_namespace.oid = index_relation.relnamespace
    join pg_catalog.pg_class table_relation
      on table_relation.oid = index_row.indrelid
    join pg_catalog.pg_namespace table_namespace
      on table_namespace.oid = table_relation.relnamespace
    join pg_catalog.pg_am access_method
      on access_method.oid = index_relation.relam
    where index_relation.relname =
      'story_specs_one_published_stage_idx'
      and table_relation.oid = 'public.story_specs'::regclass
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
      and publication_index_health.value
      and promotion_health.value
      and legacy_health.value
      and grant_health.value as ok,
    identity_health.value as identity_constraint_valid,
    lifecycle_health.value as lifecycle_trigger_enabled,
    publication_index_health.value
      as published_stage_uniqueness_valid,
    promotion_health.value as promotion_cas_valid,
    legacy_health.value as legacy_rpc_revoked,
    grant_health.value as boundary_granted
  from identity_health,
    lifecycle_health,
    publication_index_health,
    promotion_health,
    legacy_health,
    grant_health
$fn$;

revoke all on function public.story_spec_publication_schema_health_v1()
  from public, anon, authenticated, service_role;
grant execute on function public.story_spec_publication_schema_health_v1()
  to service_role;

comment on function public.story_spec_publication_schema_health_v1() is
  'Returns only booleans proving strict StorySpec identity, exact lifecycle enforcement, one published version per stage, compare-and-set promotion, and grants.';

notify pgrst, 'reload schema';
