-- Onward - strict StorySpec identity and compare-and-set publication, migration 0023.
-- Apply after 0004. Existing story playback is unaffected; pause and drain new
-- story creation plus editorial writes because both terminal tables are locked.

set local lock_timeout = '10s';
set local statement_timeout = '30s';

-- Hold both tables touched by the owner-definer terminal routines for the whole
-- cutover. This closes the owner/trigger/ACL preflight-to-health race rather
-- than relying on a sequence of catalog snapshots.
lock table public.story_specs, public.figure_stages
  in access exclusive mode;

-- Migration 0004 creates the editorial table and its three lifecycle routines
-- under one canonical migration authority. Do not let a coordinated
-- BYPASSRLS owner or a same-name PostgREST overload become the trust root for
-- this cutover.
do $do$
declare
  authority_owner oid;
begin
  select database_row.datdba
  into strict authority_owner
  from pg_catalog.pg_database database_row
  where database_row.datname = pg_catalog.current_database();

  if (current_user::pg_catalog.regrole)::oid <> authority_owner then
    raise exception
      'StorySpec cutover must run as the database owner';
  end if;

  if exists (
    with recursive owner_members(member_oid) as (
      select membership.member
      from pg_catalog.pg_auth_members membership
      where membership.roleid = authority_owner
      union
      select membership.member
      from pg_catalog.pg_auth_members membership
      join owner_members inherited
        on membership.roleid = inherited.member_oid
    )
    select 1
    from owner_members
  ) then
    raise exception
      'other roles must not inherit StorySpec publication authority';
  end if;

  if not exists (
    with recursive service_members(member_oid) as (
      select membership.member
      from pg_catalog.pg_auth_members membership
      where membership.roleid = 'service_role'::regrole
      union
      select membership.member
      from pg_catalog.pg_auth_members membership
      join service_members inherited
        on membership.roleid = inherited.member_oid
    )
    select 1
    from pg_catalog.pg_roles authenticator_role
    where authenticator_role.oid = 'authenticator'::regrole
      and not authenticator_role.rolinherit
      and not authenticator_role.rolsuper
      and not authenticator_role.rolbypassrls
      and (select count(*) from service_members) = 1
      and exists (
        select 1
        from service_members
        where service_members.member_oid = authenticator_role.oid
      )
  ) then
    raise exception
      'StorySpec service authority role graph is unsafe';
  end if;

  if exists (
    select 1
    from pg_catalog.pg_class relation_row
    where relation_row.oid in (
        'public.story_specs'::regclass,
        'public.figure_stages'::regclass
      )
      and relation_row.relowner <> authority_owner
  ) then
    raise exception
      'StorySpec cutover must run as the canonical table owner';
  end if;

  if exists (
    select 1
    from pg_catalog.pg_proc procedure_row
    join pg_catalog.pg_namespace namespace_row
      on namespace_row.oid = procedure_row.pronamespace
    where namespace_row.nspname = 'public'
      and procedure_row.proname in (
        'enforce_figure_stage_publication',
        'enforce_story_spec_lifecycle',
        'promote_story_spec',
        'promote_story_spec_v2',
        'retire_story_spec',
        'story_spec_publication_manifest_v1',
        'story_spec_publication_schema_health_v1'
      )
      and (
        procedure_row.oid not in (
          'public.enforce_story_spec_lifecycle()'::regprocedure,
          'public.promote_story_spec(text)'::regprocedure,
          'public.retire_story_spec(text)'::regprocedure
        )
        or procedure_row.proowner <> authority_owner
      )
  ) then
    raise exception
      'StorySpec cutover found an unexpected routine, overload, or owner';
  end if;

  -- A trigger on figure_stages would execute inside the promotion/retirement
  -- SECURITY DEFINER context. No user trigger is part of the reviewed schema,
  -- including a disabled one that could later be enabled.
  if exists (
    select 1
    from pg_catalog.pg_trigger trigger_row
    where trigger_row.tgrelid = 'public.figure_stages'::regclass
      and not trigger_row.tgisinternal
  ) then
    raise exception
      'figure_stages must not have user triggers';
  end if;
end
$do$;

-- Only a SECURITY DEFINER routine owned by the canonical table owner may
-- create a published row or enter either terminal lifecycle state. The service
-- role keeps draft/review authoring access but cannot publish or retire by
-- writing the table directly.
create or replace function public.enforce_story_spec_lifecycle()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $fn$
begin
  if new.status in ('published', 'retired')
    and (current_user::pg_catalog.regrole)::oid <> (
      select relation_row.relowner
      from pg_catalog.pg_class relation_row
      where relation_row.oid = 'public.story_specs'::regclass
    ) then
    raise exception
      'published and retired StorySpecs require the owner-definer boundary';
  end if;

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
      raise exception
        'published StorySpec content and provenance are immutable';
    end if;

    if old.status = 'retired' and new.status <> 'retired' then
      raise exception 'a retired StorySpec cannot be reactivated';
    end if;
    if old.status = 'published'
      and new.status not in ('published', 'retired') then
      raise exception
        'a published StorySpec can only remain published or retire';
    end if;
  end if;

  if new.status = 'published' then
    if new.published_at is null then
      new.published_at := pg_catalog.now();
    end if;
    new.retired_at := null;
  elsif new.status = 'retired' then
    if tg_op = 'INSERT' or old.status <> 'published' then
      raise exception 'only a published StorySpec can retire';
    end if;
    if new.retired_at is null then
      new.retired_at := pg_catalog.now();
    end if;
  else
    new.published_at := null;
    new.retired_at := null;
  end if;

  return new;
end
$fn$;

-- Replace the 0004 stage reference and the 0001 stage-status check under the
-- same two-table lock. The exact server deparse is captured below, so later
-- constraint replacement, disabling, or comment-only self-attestation cannot
-- keep release readiness green.
alter table public.story_specs
  add constraint story_specs_stage_strict_fk
  foreign key (figure_key, stage_id)
  references public.figure_stages (figure_key, stage_id)
  on delete restrict
  not valid;

alter table public.story_specs
  validate constraint story_specs_stage_strict_fk;

alter table public.story_specs
  drop constraint story_specs_stage_fk;

alter table public.story_specs
  rename constraint story_specs_stage_strict_fk
  to story_specs_stage_fk;

alter table public.figure_stages
  add constraint figure_stages_status_strict_check
  check ((status in ('draft', 'published')) is true)
  not valid;

alter table public.figure_stages
  validate constraint figure_stages_status_strict_check;

alter table public.figure_stages
  drop constraint figure_stages_status_check;

alter table public.figure_stages
  rename constraint figure_stages_status_strict_check
  to figure_stages_status_check;

alter table public.figure_stages
  alter column status set default 'draft',
  alter column status set not null;

-- figure_stages.status is a projection of the terminal StorySpec lifecycle.
-- Service-role authoring may create drafts and update stage content, but only
-- the owner-definer terminal routines may change publication visibility.
create or replace function public.enforce_figure_stage_publication()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $fn$
begin
  if new.status not in ('draft', 'published') then
    raise exception 'figure stage status is outside the publication lifecycle';
  end if;

  if (current_user::pg_catalog.regrole)::oid <> (
    select relation_row.relowner
    from pg_catalog.pg_class relation_row
    where relation_row.oid = 'public.figure_stages'::regclass
  ) then
    if tg_op = 'INSERT' and new.status <> 'draft' then
      raise exception
        'published figure stages require the owner-definer boundary';
    end if;

    if tg_op = 'UPDATE' and new.status is distinct from old.status then
      raise exception
        'figure stage publication changes require the owner-definer boundary';
    end if;
  end if;

  return new;
end
$fn$;

create trigger figure_stages_publication_lifecycle
before insert or update of status on public.figure_stages
for each row execute function public.enforce_figure_stage_publication();

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

-- Recreate the one-published-version invariant in this same transaction so
-- the exact full-index fingerprint below cannot bless pre-existing drift.
drop index if exists public.story_specs_one_published_stage_idx;
create unique index story_specs_one_published_stage_idx
  on public.story_specs (figure_key, stage_id)
  where status = 'published';

-- Capture the server's own exact deparse after creating the reviewed objects.
-- Future health checks compare byte-for-byte output, avoiding unsafe
-- case/cast/parenthesis/whitespace normalization and PostgreSQL-version guesses.
do $do$
declare
  identity_fingerprint text;
  publication_index_fingerprint text;
  stage_fk_fingerprint text;
  stage_status_fingerprint text;
  stage_trigger_fingerprint text;
  story_specs_owner oid;
begin
  select relation_row.relowner
  into strict story_specs_owner
  from pg_catalog.pg_class relation_row
  where relation_row.oid = 'public.story_specs'::regclass;

  select pg_catalog.md5(
    pg_catalog.pg_get_constraintdef(constraint_row.oid, true)
  )
  into strict identity_fingerprint
  from pg_catalog.pg_constraint constraint_row
  where constraint_row.conrelid = 'public.story_specs'::regclass
    and constraint_row.conname = 'story_specs_document_identity_check';

  select pg_catalog.md5(
    pg_catalog.pg_get_indexdef(index_row.indexrelid, 0, true)
  )
  into strict publication_index_fingerprint
  from pg_catalog.pg_index index_row
  join pg_catalog.pg_class index_relation
    on index_relation.oid = index_row.indexrelid
  where index_relation.relnamespace = 'public'::regnamespace
    and index_relation.relname = 'story_specs_one_published_stage_idx'
    and index_row.indrelid = 'public.story_specs'::regclass;

  select pg_catalog.md5(
    pg_catalog.pg_get_constraintdef(constraint_row.oid, true)
  )
  into strict stage_fk_fingerprint
  from pg_catalog.pg_constraint constraint_row
  where constraint_row.conrelid = 'public.story_specs'::regclass
    and constraint_row.conname = 'story_specs_stage_fk';

  select pg_catalog.md5(
    pg_catalog.pg_get_constraintdef(constraint_row.oid, true)
  )
  into strict stage_status_fingerprint
  from pg_catalog.pg_constraint constraint_row
  where constraint_row.conrelid = 'public.figure_stages'::regclass
    and constraint_row.conname = 'figure_stages_status_check';

  select pg_catalog.md5(
    pg_catalog.pg_get_triggerdef(trigger_row.oid, true)
  )
  into strict stage_trigger_fingerprint
  from pg_catalog.pg_trigger trigger_row
  where trigger_row.tgrelid = 'public.figure_stages'::regclass
    and trigger_row.tgname = 'figure_stages_publication_lifecycle'
    and not trigger_row.tgisinternal;

  -- Keep the code-created fingerprints independently from the mutable object
  -- comments. Health compares both the live objects and their comments to
  -- these captured constants, so recomputing a comment over drift is not
  -- sufficient to turn readiness green.
  execute pg_catalog.format(
    $create$
      create or replace function
        public.story_spec_publication_manifest_v1()
      returns table (
        identity_fingerprint text,
        publication_index_fingerprint text,
        stage_fk_fingerprint text,
        stage_status_fingerprint text,
        stage_trigger_fingerprint text,
        authority_owner oid
      )
      language sql
      immutable
      set search_path = pg_catalog
      as $manifest$
        select %L::text, %L::text, %L::text, %L::text, %L::text, %s::oid
      $manifest$
    $create$,
    identity_fingerprint,
    publication_index_fingerprint,
    stage_fk_fingerprint,
    stage_status_fingerprint,
    stage_trigger_fingerprint,
    story_specs_owner
  );

  execute pg_catalog.format(
    'comment on constraint story_specs_document_identity_check '
      || 'on public.story_specs is %L',
    'onward-story-spec-identity-v1:'
      || identity_fingerprint
      || ':owner='
      || story_specs_owner::text
  );
  execute pg_catalog.format(
    'comment on index public.story_specs_one_published_stage_idx is %L',
    'onward-story-spec-published-index-v1:'
      || publication_index_fingerprint
      || ':owner='
      || story_specs_owner::text
  );
  execute pg_catalog.format(
    'comment on constraint story_specs_stage_fk '
      || 'on public.story_specs is %L',
    'onward-story-spec-stage-fk-v1:'
      || stage_fk_fingerprint
      || ':owner='
      || story_specs_owner::text
  );
  execute pg_catalog.format(
    'comment on constraint figure_stages_status_check '
      || 'on public.figure_stages is %L',
    'onward-figure-stage-status-v1:'
      || stage_status_fingerprint
      || ':owner='
      || story_specs_owner::text
  );
  execute pg_catalog.format(
    'comment on trigger figure_stages_publication_lifecycle '
      || 'on public.figure_stages is %L',
    'onward-figure-stage-lifecycle-v1:'
      || stage_trigger_fingerprint
      || ':owner='
      || story_specs_owner::text
  );
end
$do$;

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

  if not found then
    raise exception 'StorySpec stage not found';
  end if;
end
$fn$;

-- Retirement is the other terminal transition and must share the same exact
-- owner-definer, stage lock, body attestation, and ACL boundary as promotion.
create or replace function public.retire_story_spec(
  p_story_spec_id text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v_figure_key text;
  v_stage_id text;
begin
  select target.figure_key, target.stage_id
  into v_figure_key, v_stage_id
  from public.story_specs target
  where target.story_spec_id = p_story_spec_id;

  if not found then
    raise exception 'published StorySpec not found';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      v_figure_key || ':' || v_stage_id,
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
  where target.story_spec_id = p_story_spec_id
    and target.status = 'published';

  if not found then
    raise exception 'published StorySpec not found';
  end if;

  update public.figure_stages stage
  set status = 'draft'
  where stage.figure_key = v_figure_key
    and stage.stage_id = v_stage_id;

  if not found then
    raise exception 'StorySpec stage not found';
  end if;
end
$fn$;

-- The legacy ID-only RPC remains discoverable for a clear permission failure,
-- but no application role may execute it after this migration.
revoke all on function public.promote_story_spec(text)
  from public, anon, authenticated, service_role;
revoke all on function public.promote_story_spec_v2(text, jsonb)
  from public, anon, authenticated, service_role;
revoke all on function public.retire_story_spec(text)
  from public, anon, authenticated, service_role;
revoke all on function public.enforce_figure_stage_publication()
  from public, anon, authenticated, service_role;
revoke all on function public.enforce_story_spec_lifecycle()
  from public, anon, authenticated, service_role;
revoke all on function public.story_spec_publication_manifest_v1()
  from public, anon, authenticated, service_role;

-- CREATE OR REPLACE preserves old ACL entries. Remove every explicit
-- non-owner EXECUTE grantee, including roles unknown to the application, before
-- adding back the single reviewed service boundary.
do $do$
declare
  target record;
  grantee_role record;
begin
  for target in
    select
      procedure_row.oid,
      procedure_row.proowner,
      procedure_row.proacl,
      pg_catalog.format(
        '%I.%I(%s)',
        namespace_row.nspname,
        procedure_row.proname,
        pg_catalog.pg_get_function_identity_arguments(procedure_row.oid)
      ) as signature
    from pg_catalog.pg_proc procedure_row
    join pg_catalog.pg_namespace namespace_row
      on namespace_row.oid = procedure_row.pronamespace
    where procedure_row.oid in (
      'public.enforce_figure_stage_publication()'::regprocedure,
      'public.enforce_story_spec_lifecycle()'::regprocedure,
      'public.promote_story_spec(text)'::regprocedure,
      'public.promote_story_spec_v2(text,jsonb)'::regprocedure,
      'public.retire_story_spec(text)'::regprocedure,
      'public.story_spec_publication_manifest_v1()'::regprocedure
    )
  loop
    for grantee_role in
      select distinct role_row.rolname
      from pg_catalog.aclexplode(
        coalesce(
          target.proacl,
          pg_catalog.acldefault('f', target.proowner)
        )
      ) acl
      join pg_catalog.pg_roles role_row
        on role_row.oid = acl.grantee
      where acl.privilege_type = 'EXECUTE'
        and acl.grantee <> target.proowner
    loop
      execute pg_catalog.format(
        'revoke all on function %s from %I',
        target.signature,
        grantee_role.rolname
      );
    end loop;
  end loop;
end
$do$;

grant execute on function public.promote_story_spec_v2(text, jsonb)
  to service_role;
grant execute on function public.retire_story_spec(text)
  to service_role;

-- Preserve the documented editorial data plane while removing DELETE,
-- TRUNCATE, browser, PUBLIC, and unknown-role bypasses.
revoke all on table public.story_specs
  from public, anon, authenticated, service_role;

do $do$
declare
  target record;
  grantee_role record;
begin
  select
    relation_row.relowner,
    relation_row.relacl,
    pg_catalog.format(
      '%I.%I',
      namespace_row.nspname,
      relation_row.relname
    ) as signature
  into strict target
  from pg_catalog.pg_class relation_row
  join pg_catalog.pg_namespace namespace_row
    on namespace_row.oid = relation_row.relnamespace
  where relation_row.oid = 'public.story_specs'::regclass;

  for grantee_role in
    select distinct role_row.rolname
    from pg_catalog.aclexplode(
      coalesce(
        target.relacl,
        pg_catalog.acldefault('r', target.relowner)
      )
    ) acl
    join pg_catalog.pg_roles role_row
      on role_row.oid = acl.grantee
    where acl.grantee <> target.relowner
  loop
    execute pg_catalog.format(
      'revoke all on table %s from %I',
      target.signature,
      grantee_role.rolname
    );
  end loop;
end
$do$;

-- Table-level REVOKE does not remove grants made against individual columns.
-- Scrub every explicit non-owner column grantee before restoring the narrow
-- table-level service role boundary.
do $do$
declare
  story_specs_owner oid;
  column_grant record;
  grantee_sql text;
begin
  select relation_row.relowner
  into strict story_specs_owner
  from pg_catalog.pg_class relation_row
  where relation_row.oid = 'public.story_specs'::regclass;

  for column_grant in
    select distinct
      attribute_row.attname,
      acl.grantee,
      role_row.rolname
    from pg_catalog.pg_attribute attribute_row
    cross join lateral pg_catalog.aclexplode(attribute_row.attacl) acl
    left join pg_catalog.pg_roles role_row
      on role_row.oid = acl.grantee
    where attribute_row.attrelid = 'public.story_specs'::regclass
      and attribute_row.attnum > 0
      and not attribute_row.attisdropped
      and acl.grantee <> story_specs_owner
  loop
    if column_grant.grantee = 0 then
      grantee_sql := 'PUBLIC';
    elsif column_grant.rolname is null then
      raise exception
        'story_specs column ACL references an unknown grantee';
    else
      grantee_sql := pg_catalog.format('%I', column_grant.rolname);
    end if;

    execute pg_catalog.format(
      'revoke all (%I) on table public.story_specs from %s',
      column_grant.attname,
      grantee_sql
    );
  end loop;
end
$do$;

grant select, insert, update on table public.story_specs to service_role;
alter table public.story_specs enable row level security;

do $do$
begin
  if exists (
    select 1
    from pg_catalog.pg_policy policy_row
    where policy_row.polrelid = 'public.story_specs'::regclass
  ) then
    raise exception
      'story_specs must remain default-deny with no row-level policies';
  end if;
end
$do$;

-- figure_stages is updated inside both owner-definer terminal routines. Close
-- its full non-owner table/column ACL boundary as well: in particular, no
-- application or unknown role may retain TRIGGER and execute code under the
-- outer definer's current_user.
revoke all on table public.figure_stages
  from public, anon, authenticated, service_role;

do $do$
declare
  target record;
  grantee_role record;
begin
  select
    relation_row.relowner,
    relation_row.relacl,
    pg_catalog.format(
      '%I.%I',
      namespace_row.nspname,
      relation_row.relname
    ) as signature
  into strict target
  from pg_catalog.pg_class relation_row
  join pg_catalog.pg_namespace namespace_row
    on namespace_row.oid = relation_row.relnamespace
  where relation_row.oid = 'public.figure_stages'::regclass;

  for grantee_role in
    select distinct role_row.rolname
    from pg_catalog.aclexplode(
      coalesce(
        target.relacl,
        pg_catalog.acldefault('r', target.relowner)
      )
    ) acl
    join pg_catalog.pg_roles role_row
      on role_row.oid = acl.grantee
    where acl.grantee <> target.relowner
  loop
    execute pg_catalog.format(
      'revoke all on table %s from %I',
      target.signature,
      grantee_role.rolname
    );
  end loop;
end
$do$;

do $do$
declare
  figure_stages_owner oid;
  column_grant record;
  grantee_sql text;
begin
  select relation_row.relowner
  into strict figure_stages_owner
  from pg_catalog.pg_class relation_row
  where relation_row.oid = 'public.figure_stages'::regclass;

  for column_grant in
    select distinct
      attribute_row.attname,
      acl.grantee,
      role_row.rolname
    from pg_catalog.pg_attribute attribute_row
    cross join lateral pg_catalog.aclexplode(attribute_row.attacl) acl
    left join pg_catalog.pg_roles role_row
      on role_row.oid = acl.grantee
    where attribute_row.attrelid = 'public.figure_stages'::regclass
      and attribute_row.attnum > 0
      and not attribute_row.attisdropped
      and acl.grantee <> figure_stages_owner
  loop
    if column_grant.grantee = 0 then
      grantee_sql := 'PUBLIC';
    elsif column_grant.rolname is null then
      raise exception
        'figure_stages column ACL references an unknown grantee';
    else
      grantee_sql := pg_catalog.format('%I', column_grant.rolname);
    end if;

    execute pg_catalog.format(
      'revoke all (%I) on table public.figure_stages from %s',
      column_grant.attname,
      grantee_sql
    );
  end loop;
end
$do$;

grant select, insert, update on table public.figure_stages to service_role;
alter table public.figure_stages enable row level security;

do $do$
begin
  if exists (
    select 1
    from pg_catalog.pg_policy policy_row
    where policy_row.polrelid = 'public.figure_stages'::regclass
  ) then
    raise exception
      'figure_stages must remain default-deny with no row-level policies';
  end if;
end
$do$;

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
  with recursive publication_manifest as materialized (
    select manifest.*
    from public.story_spec_publication_manifest_v1() manifest
  ),
  owner_members(member_oid) as (
    select membership.member
    from pg_catalog.pg_auth_members membership
    join publication_manifest
      on membership.roleid = publication_manifest.authority_owner
    union
    select membership.member
    from pg_catalog.pg_auth_members membership
    join owner_members inherited
      on membership.roleid = inherited.member_oid
  ),
  service_members(member_oid) as (
    select membership.member
    from pg_catalog.pg_auth_members membership
    where membership.roleid = 'service_role'::regrole
    union
    select membership.member
    from pg_catalog.pg_auth_members membership
    join service_members inherited
      on membership.roleid = inherited.member_oid
  ),
  authority_health as (
    select count(*) filter (
      where database_row.datname = pg_catalog.current_database()
        and database_row.datdba = publication_manifest.authority_owner
        and owner_role.oid = publication_manifest.authority_owner
        and (owner_role.rolsuper or owner_role.rolbypassrls)
        and not exists (select 1 from owner_members)
        and authenticator_role.oid = 'authenticator'::regrole
        and not authenticator_role.rolinherit
        and not authenticator_role.rolsuper
        and not authenticator_role.rolbypassrls
        and (select count(*) from service_members) = 1
        and exists (
          select 1
          from service_members
          where service_members.member_oid = authenticator_role.oid
        )
    ) = 1 as value
    from pg_catalog.pg_database database_row
    join pg_catalog.pg_roles owner_role
      on owner_role.oid = database_row.datdba
    cross join pg_catalog.pg_roles authenticator_role
    cross join publication_manifest
    where database_row.datname = pg_catalog.current_database()
      and authenticator_role.oid = 'authenticator'::regrole
  ),
  manifest_function_health as (
    select
      count(*) = 1
      and count(*) filter (
        where procedure_row.oid =
            'public.story_spec_publication_manifest_v1()'::regprocedure
          and procedure_row.prokind = 'f'
          and procedure_row.pronargs = 0
          and procedure_row.prorettype = 'record'::pg_catalog.regtype
          and procedure_row.proretset
          and not procedure_row.prosecdef
          and procedure_row.provolatile = 'i'
          and language_row.lanname = 'sql'
          and procedure_row.proowner = table_relation.relowner
          and procedure_row.proconfig =
            array['search_path=pg_catalog']::text[]
      ) = 1
      and (select count(*) from publication_manifest) = 1 as value
    from pg_catalog.pg_proc procedure_row
    join pg_catalog.pg_namespace namespace_row
      on namespace_row.oid = procedure_row.pronamespace
    join pg_catalog.pg_language language_row
      on language_row.oid = procedure_row.prolang
    cross join pg_catalog.pg_class table_relation
    where namespace_row.nspname = 'public'
      and procedure_row.proname =
        'story_spec_publication_manifest_v1'
      and table_relation.oid = 'public.story_specs'::regclass
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
        and pg_catalog.obj_description(
          constraint_row.oid,
          'pg_constraint'
        ) =
          'onward-story-spec-identity-v1:'
          || publication_manifest.identity_fingerprint
          || ':owner='
          || publication_manifest.authority_owner::text
        and pg_catalog.md5(
          pg_catalog.pg_get_constraintdef(
            constraint_row.oid,
            true
          )
        ) = publication_manifest.identity_fingerprint
        and table_relation.relowner =
          publication_manifest.authority_owner
    ) = 1 as value
    from pg_catalog.pg_constraint constraint_row
    join pg_catalog.pg_class table_relation
      on table_relation.oid = constraint_row.conrelid
    cross join publication_manifest
    where constraint_row.conrelid = 'public.story_specs'::regclass
      and constraint_row.conname =
        'story_specs_document_identity_check'
  ),
  stage_fk_health as (
    select count(*) filter (
      where constraint_row.conname = 'story_specs_stage_fk'
        and constraint_row.contype = 'f'
        and constraint_row.convalidated
        and constraint_row.conislocal
        and constraint_row.coninhcount = 0
        and constraint_row.conparentid = 0
        and constraint_row.connoinherit
        and not constraint_row.condeferrable
        and not constraint_row.condeferred
        and constraint_row.confupdtype = 'a'
        and constraint_row.confdeltype = 'r'
        and constraint_row.confmatchtype = 's'
        and constraint_row.confrelid =
          'public.figure_stages'::regclass
        and constraint_row.conkey = array[
          (
            select attribute_row.attnum
            from pg_catalog.pg_attribute attribute_row
            where attribute_row.attrelid =
                'public.story_specs'::regclass
              and attribute_row.attname = 'figure_key'
              and not attribute_row.attisdropped
          ),
          (
            select attribute_row.attnum
            from pg_catalog.pg_attribute attribute_row
            where attribute_row.attrelid =
                'public.story_specs'::regclass
              and attribute_row.attname = 'stage_id'
              and not attribute_row.attisdropped
          )
        ]::smallint[]
        and constraint_row.confkey = array[
          (
            select attribute_row.attnum
            from pg_catalog.pg_attribute attribute_row
            where attribute_row.attrelid =
                'public.figure_stages'::regclass
              and attribute_row.attname = 'figure_key'
              and not attribute_row.attisdropped
          ),
          (
            select attribute_row.attnum
            from pg_catalog.pg_attribute attribute_row
            where attribute_row.attrelid =
                'public.figure_stages'::regclass
              and attribute_row.attname = 'stage_id'
              and not attribute_row.attisdropped
          )
        ]::smallint[]
        and child_relation.relowner =
          publication_manifest.authority_owner
        and parent_relation.relowner =
          publication_manifest.authority_owner
        and pg_catalog.obj_description(
          constraint_row.oid,
          'pg_constraint'
        ) =
          'onward-story-spec-stage-fk-v1:'
          || publication_manifest.stage_fk_fingerprint
          || ':owner='
          || publication_manifest.authority_owner::text
        and pg_catalog.md5(
          pg_catalog.pg_get_constraintdef(
            constraint_row.oid,
            true
          )
        ) = publication_manifest.stage_fk_fingerprint
        and (
          select count(*)
          from pg_catalog.pg_trigger trigger_row
          where trigger_row.tgconstraint = constraint_row.oid
            and trigger_row.tgisinternal
            and trigger_row.tgenabled = 'O'
            and trigger_row.tgrelid in (
              constraint_row.conrelid,
              constraint_row.confrelid
            )
        ) = 4
        and (
          select count(*)
          from pg_catalog.pg_trigger trigger_row
          where trigger_row.tgconstraint = constraint_row.oid
        ) = 4
    ) = 1 as value
    from pg_catalog.pg_constraint constraint_row
    join pg_catalog.pg_class child_relation
      on child_relation.oid = constraint_row.conrelid
    join pg_catalog.pg_class parent_relation
      on parent_relation.oid = constraint_row.confrelid
    cross join publication_manifest
    where constraint_row.conrelid = 'public.story_specs'::regclass
      and constraint_row.conname = 'story_specs_stage_fk'
  ),
  stage_status_constraint_health as (
    select count(*) filter (
      where constraint_row.conname = 'figure_stages_status_check'
        and constraint_row.contype = 'c'
        and constraint_row.convalidated
        and constraint_row.conislocal
        and constraint_row.coninhcount = 0
        and constraint_row.conparentid = 0
        and not constraint_row.connoinherit
        and table_relation.relowner =
          publication_manifest.authority_owner
        and status_attribute.atttypid = 'text'::pg_catalog.regtype
        and status_attribute.attnotnull
        and status_attribute.atthasdef
        and status_attribute.attidentity = ''
        and status_attribute.attgenerated = ''
        and pg_catalog.pg_get_expr(
          status_default.adbin,
          status_default.adrelid,
          true
        ) = '''draft''::text'
        and pg_catalog.obj_description(
          constraint_row.oid,
          'pg_constraint'
        ) =
          'onward-figure-stage-status-v1:'
          || publication_manifest.stage_status_fingerprint
          || ':owner='
          || publication_manifest.authority_owner::text
        and pg_catalog.md5(
          pg_catalog.pg_get_constraintdef(
            constraint_row.oid,
            true
          )
        ) = publication_manifest.stage_status_fingerprint
    ) = 1 as value
    from pg_catalog.pg_constraint constraint_row
    join pg_catalog.pg_class table_relation
      on table_relation.oid = constraint_row.conrelid
    join pg_catalog.pg_attribute status_attribute
      on status_attribute.attrelid = table_relation.oid
      and status_attribute.attname = 'status'
      and status_attribute.attnum > 0
      and not status_attribute.attisdropped
    join pg_catalog.pg_attrdef status_default
      on status_default.adrelid = status_attribute.attrelid
      and status_default.adnum = status_attribute.attnum
    cross join publication_manifest
    where constraint_row.conrelid = 'public.figure_stages'::regclass
      and constraint_row.conname = 'figure_stages_status_check'
  ),
  lifecycle_helper_health as (
    select
      count(*) = 1
      and count(*) filter (
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
        and procedure_row.proowner = table_relation.relowner
        and procedure_row.proconfig =
          array['search_path=pg_catalog, public']::text[]
        -- The exact replacement body includes the owner-definer transition
        -- gate as well as the immutable published/retired lifecycle.
        and pg_catalog.md5(
          pg_catalog.btrim(
            pg_catalog.regexp_replace(
              pg_catalog.regexp_replace(
                procedure_row.prosrc,
                E'--[^\\n\\r]*',
                ' ',
                'g'
              ),
              E'\\s+',
              ' ',
              'g'
            )
          )
        ) = 'bcf8821de64db8fe334eec63c5dd702a'
    ) = 1 as value
    from pg_catalog.pg_proc procedure_row
    join pg_catalog.pg_namespace namespace_row
      on namespace_row.oid = procedure_row.pronamespace
    join pg_catalog.pg_language language_row
      on language_row.oid = procedure_row.prolang
    cross join pg_catalog.pg_class table_relation
    where namespace_row.nspname = 'public'
      and procedure_row.proname = 'enforce_story_spec_lifecycle'
      and table_relation.oid = 'public.story_specs'::regclass
  ),
  lifecycle_trigger_health as (
    select
      count(*) filter (
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
      ) = 1
      and count(*) filter (
        where not trigger_row.tgisinternal
          and trigger_row.tgenabled <> 'D'
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
    where trigger_row.tgrelid = 'public.story_specs'::regclass
  ),
  lifecycle_health as (
    select
      lifecycle_helper_health.value
        and lifecycle_trigger_health.value as value
    from lifecycle_helper_health,
      lifecycle_trigger_health
  ),
  stage_lifecycle_helper_health as (
    select
      count(*) = 1
      and count(*) filter (
        where procedure_row.oid =
            'public.enforce_figure_stage_publication()'::regprocedure
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
          and procedure_row.proowner = table_relation.relowner
          and table_relation.relowner =
            publication_manifest.authority_owner
          and procedure_row.proconfig =
            array['search_path=pg_catalog, public']::text[]
          and pg_catalog.md5(
            pg_catalog.btrim(
              pg_catalog.regexp_replace(
                pg_catalog.regexp_replace(
                  procedure_row.prosrc,
                  E'--[^\\n\\r]*',
                  ' ',
                  'g'
                ),
                E'\\s+',
                ' ',
                'g'
              )
            )
          ) = '36d8d57e86e730a48930a6f0502e4b56'
      ) = 1 as value
    from pg_catalog.pg_proc procedure_row
    join pg_catalog.pg_namespace namespace_row
      on namespace_row.oid = procedure_row.pronamespace
    join pg_catalog.pg_language language_row
      on language_row.oid = procedure_row.prolang
    cross join pg_catalog.pg_class table_relation
    cross join publication_manifest
    where namespace_row.nspname = 'public'
      and procedure_row.proname =
        'enforce_figure_stage_publication'
      and table_relation.oid = 'public.figure_stages'::regclass
  ),
  stage_lifecycle_trigger_health as (
    select
      count(*) filter (
        where trigger_row.tgname =
            'figure_stages_publication_lifecycle'
          and trigger_row.tgenabled = 'O'
          and not trigger_row.tgisinternal
          and trigger_row.tgtype = 23::smallint
          and trigger_row.tgqual is null
          and trigger_row.tgnargs = 0
          and trigger_row.tgconstraint = 0::pg_catalog.oid
          and trigger_row.tgoldtable is null
          and trigger_row.tgnewtable is null
          and table_namespace.nspname = 'public'
          and table_relation.relname = 'figure_stages'
          and table_relation.relkind = 'r'
          and function_namespace.nspname = 'public'
          and procedure_row.oid =
            'public.enforce_figure_stage_publication()'::regprocedure
          and pg_catalog.obj_description(
            trigger_row.oid,
            'pg_trigger'
          ) =
            'onward-figure-stage-lifecycle-v1:'
            || publication_manifest.stage_trigger_fingerprint
            || ':owner='
            || publication_manifest.authority_owner::text
          and pg_catalog.md5(
            pg_catalog.pg_get_triggerdef(
              trigger_row.oid,
              true
            )
          ) = publication_manifest.stage_trigger_fingerprint
      ) = 1
      and count(*) filter (
        where not trigger_row.tgisinternal
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
    cross join publication_manifest
    where trigger_row.tgrelid = 'public.figure_stages'::regclass
  ),
  stage_lifecycle_health as (
    select
      stage_status_constraint_health.value
        and stage_lifecycle_helper_health.value
        and stage_lifecycle_trigger_health.value as value
    from stage_status_constraint_health,
      stage_lifecycle_helper_health,
      stage_lifecycle_trigger_health
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
        and index_relation.relowner = table_relation.relowner
        and index_relation.relowner =
          publication_manifest.authority_owner
        and index_relation.reloptions is null
        and access_method.amname = 'btree'
        and index_row.indisunique
        and index_row.indimmediate
        and index_row.indisvalid
        and index_row.indisready
        and index_row.indislive
        and not index_row.indisclustered
        and not index_row.indisreplident
        and not index_row.indnullsnotdistinct
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
        and pg_catalog.obj_description(
          index_relation.oid,
          'pg_class'
        ) =
          'onward-story-spec-published-index-v1:'
          || publication_manifest.publication_index_fingerprint
          || ':owner='
          || publication_manifest.authority_owner::text
        and pg_catalog.md5(
          pg_catalog.pg_get_indexdef(
            index_row.indexrelid,
            0,
            true
          )
        ) = publication_manifest.publication_index_fingerprint
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
    cross join publication_manifest
    where index_relation.relname =
      'story_specs_one_published_stage_idx'
      and table_relation.oid = 'public.story_specs'::regclass
  ),
  promotion_health as (
    select
      count(*) = 1
      and count(*) filter (
      where namespace_row.nspname = 'public'
        and procedure_row.proname = 'promote_story_spec_v2'
        and procedure_row.prokind = 'f'
        and procedure_row.pronargs = 2
        and pg_catalog.oidvectortypes(procedure_row.proargtypes) =
          'text, jsonb'
        and procedure_row.proallargtypes is null
        and procedure_row.proargmodes is null
        and procedure_row.proargnames =
          array['p_story_spec_id', 'p_expected_review_spec']::text[]
        and procedure_row.prorettype = 'void'::pg_catalog.regtype
        and not procedure_row.proretset
        and procedure_row.prosecdef
        and procedure_row.provolatile = 'v'
        and language_row.lanname = 'plpgsql'
        and procedure_row.proowner = (
          select table_relation.relowner
          from pg_catalog.pg_class table_relation
          where table_relation.oid = 'public.story_specs'::regclass
        )
        and (owner_role.rolsuper or owner_role.rolbypassrls)
        and owner_role.oid not in (
          'service_role'::regrole,
          'anon'::regrole,
          'authenticated'::regrole
        )
        and pg_catalog.has_table_privilege(
          owner_role.rolname,
          'public.story_specs',
          'SELECT'
        )
        and pg_catalog.has_table_privilege(
          owner_role.rolname,
          'public.story_specs',
          'UPDATE'
        )
        and pg_catalog.has_table_privilege(
          owner_role.rolname,
          'public.figure_stages',
          'SELECT'
        )
        and pg_catalog.has_table_privilege(
          owner_role.rolname,
          'public.figure_stages',
          'UPDATE'
        )
        and procedure_row.proconfig =
          array['search_path=pg_catalog, public']::text[]
        -- The exact case-preserving body fingerprint attests the locked
        -- snapshot comparison, retirement, and promotion transaction.
        and pg_catalog.md5(
          pg_catalog.btrim(
            pg_catalog.regexp_replace(
              pg_catalog.regexp_replace(
                procedure_row.prosrc,
                E'--[^\\n\\r]*',
                ' ',
                'g'
              ),
              E'\\s+',
              ' ',
              'g'
            )
          )
        ) = '7b030c62cc71ce1e13669bc63baeaeb4'
    ) = 1 as value
    from pg_catalog.pg_proc procedure_row
    join pg_catalog.pg_namespace namespace_row
      on namespace_row.oid = procedure_row.pronamespace
    join pg_catalog.pg_language language_row
      on language_row.oid = procedure_row.prolang
    join pg_catalog.pg_roles owner_role
      on owner_role.oid = procedure_row.proowner
    where namespace_row.nspname = 'public'
      and procedure_row.proname = 'promote_story_spec_v2'
  ),
  retirement_health as (
    select
      count(*) = 1
      and count(*) filter (
        where procedure_row.oid =
            'public.retire_story_spec(text)'::regprocedure
          and namespace_row.nspname = 'public'
          and procedure_row.proname = 'retire_story_spec'
          and procedure_row.prokind = 'f'
          and procedure_row.pronargs = 1
          and pg_catalog.oidvectortypes(procedure_row.proargtypes) =
            'text'
          and procedure_row.proallargtypes is null
          and procedure_row.proargmodes is null
          and procedure_row.proargnames =
            array['p_story_spec_id']::text[]
          and procedure_row.prorettype = 'void'::pg_catalog.regtype
          and not procedure_row.proretset
          and procedure_row.prosecdef
          and procedure_row.provolatile = 'v'
          and language_row.lanname = 'plpgsql'
          and procedure_row.proowner = table_relation.relowner
          and (owner_role.rolsuper or owner_role.rolbypassrls)
          and procedure_row.proconfig =
            array['search_path=pg_catalog, public']::text[]
          and pg_catalog.has_table_privilege(
            owner_role.rolname,
            'public.story_specs',
            'SELECT'
          )
          and pg_catalog.has_table_privilege(
            owner_role.rolname,
            'public.story_specs',
            'UPDATE'
          )
          and pg_catalog.has_table_privilege(
            owner_role.rolname,
            'public.figure_stages',
            'UPDATE'
          )
          and pg_catalog.md5(
            pg_catalog.btrim(
              pg_catalog.regexp_replace(
                pg_catalog.regexp_replace(
                  procedure_row.prosrc,
                  E'--[^\\n\\r]*',
                  ' ',
                  'g'
                ),
                E'\\s+',
                ' ',
                'g'
              )
            )
          ) = 'b58ebb00db35f1ece3497c14065529c5'
      ) = 1 as value
    from pg_catalog.pg_proc procedure_row
    join pg_catalog.pg_namespace namespace_row
      on namespace_row.oid = procedure_row.pronamespace
    join pg_catalog.pg_language language_row
      on language_row.oid = procedure_row.prolang
    join pg_catalog.pg_roles owner_role
      on owner_role.oid = procedure_row.proowner
    cross join pg_catalog.pg_class table_relation
    where namespace_row.nspname = 'public'
      and procedure_row.proname = 'retire_story_spec'
      and table_relation.oid = 'public.story_specs'::regclass
  ),
  legacy_health as (
    select
      count(*) = 1
      and count(*) filter (
      where procedure_row.oid =
          'public.promote_story_spec(text)'::regprocedure
        and procedure_row.proowner = (
          select table_relation.relowner
          from pg_catalog.pg_class table_relation
          where table_relation.oid = 'public.story_specs'::regclass
        )
        and not exists (
          select 1
          from pg_catalog.aclexplode(
            coalesce(
              procedure_row.proacl,
              pg_catalog.acldefault('f', procedure_row.proowner)
            )
          ) acl
          where acl.privilege_type = 'EXECUTE'
            and acl.grantee <> procedure_row.proowner
        )
    ) = 1 as value
    from pg_catalog.pg_proc procedure_row
    join pg_catalog.pg_namespace namespace_row
      on namespace_row.oid = procedure_row.pronamespace
    where namespace_row.nspname = 'public'
      and procedure_row.proname = 'promote_story_spec'
  ),
  public_function_grant_health as (
    select count(*) filter (
      where procedure_row.oid in (
          'public.promote_story_spec_v2(text,jsonb)'::regprocedure,
          'public.retire_story_spec(text)'::regprocedure,
          'public.story_spec_publication_schema_health_v1()'::regprocedure
        )
        and procedure_row.proowner = (
          select table_relation.relowner
          from pg_catalog.pg_class table_relation
          where table_relation.oid = 'public.story_specs'::regclass
        )
        and exists (
          select 1
          from pg_catalog.aclexplode(
            coalesce(
              procedure_row.proacl,
              pg_catalog.acldefault('f', procedure_row.proowner)
            )
          ) acl
          where acl.privilege_type = 'EXECUTE'
            and acl.grantee = 'service_role'::regrole
            and not acl.is_grantable
        )
        and not exists (
          select 1
          from pg_catalog.aclexplode(
            coalesce(
              procedure_row.proacl,
              pg_catalog.acldefault('f', procedure_row.proowner)
            )
          ) acl
          where acl.privilege_type = 'EXECUTE'
            and (
              acl.grantee not in (
                procedure_row.proowner,
                'service_role'::regrole
              )
              or (
                acl.grantee = 'service_role'::regrole
                and acl.is_grantable
              )
            )
        )
    ) = 3 as value
    from pg_catalog.pg_proc procedure_row
    where procedure_row.oid in (
      'public.promote_story_spec_v2(text,jsonb)'::regprocedure,
      'public.retire_story_spec(text)'::regprocedure,
      'public.story_spec_publication_schema_health_v1()'::regprocedure
    )
  ),
  private_function_grant_health as (
    select count(*) filter (
      where procedure_row.oid in (
          'public.enforce_figure_stage_publication()'::regprocedure,
          'public.enforce_story_spec_lifecycle()'::regprocedure,
          'public.promote_story_spec(text)'::regprocedure,
          'public.story_spec_publication_manifest_v1()'::regprocedure
        )
        and procedure_row.proowner = table_relation.relowner
        and not exists (
          select 1
          from pg_catalog.aclexplode(
            coalesce(
              procedure_row.proacl,
              pg_catalog.acldefault('f', procedure_row.proowner)
            )
          ) acl
          where acl.privilege_type = 'EXECUTE'
            and acl.grantee <> procedure_row.proowner
        )
    ) = 4 as value
    from pg_catalog.pg_proc procedure_row
    cross join pg_catalog.pg_class table_relation
    where procedure_row.oid in (
        'public.enforce_figure_stage_publication()'::regprocedure,
        'public.enforce_story_spec_lifecycle()'::regprocedure,
        'public.promote_story_spec(text)'::regprocedure,
        'public.story_spec_publication_manifest_v1()'::regprocedure
      )
      and table_relation.oid = 'public.story_specs'::regclass
  ),
  controlled_routine_inventory_health as (
    select
      count(*) = 7
      and pg_catalog.bool_and(
        procedure_row.oid in (
          'public.enforce_figure_stage_publication()'::regprocedure,
          'public.enforce_story_spec_lifecycle()'::regprocedure,
          'public.promote_story_spec(text)'::regprocedure,
          'public.promote_story_spec_v2(text,jsonb)'::regprocedure,
          'public.retire_story_spec(text)'::regprocedure,
          'public.story_spec_publication_manifest_v1()'::regprocedure,
          'public.story_spec_publication_schema_health_v1()'::regprocedure
        )
      ) as value
    from pg_catalog.pg_proc procedure_row
    join pg_catalog.pg_namespace namespace_row
      on namespace_row.oid = procedure_row.pronamespace
    where namespace_row.nspname = 'public'
      and procedure_row.proname in (
        'enforce_figure_stage_publication',
        'enforce_story_spec_lifecycle',
        'promote_story_spec',
        'promote_story_spec_v2',
        'retire_story_spec',
        'story_spec_publication_manifest_v1',
        'story_spec_publication_schema_health_v1'
      )
  ),
  function_grant_health as (
    select
      public_function_grant_health.value
        and private_function_grant_health.value
        and controlled_routine_inventory_health.value as value
    from public_function_grant_health,
      private_function_grant_health,
      controlled_routine_inventory_health
  ),
  table_boundary_health as (
    select count(*) filter (
      where table_namespace.nspname = 'public'
        and table_relation.relname = 'story_specs'
        and table_relation.relkind = 'r'
        and table_relation.relrowsecurity
        and table_relation.relowner =
          publication_manifest.authority_owner
        and (owner_role.rolsuper or owner_role.rolbypassrls)
        and owner_role.oid not in (
          'service_role'::regrole,
          'anon'::regrole,
          'authenticated'::regrole
        )
        and not exists (
          select 1
          from pg_catalog.pg_policy policy_row
          where policy_row.polrelid = table_relation.oid
        )
        and (
          select count(distinct acl.privilege_type)
          from pg_catalog.aclexplode(
            coalesce(
              table_relation.relacl,
              pg_catalog.acldefault('r', table_relation.relowner)
            )
          ) acl
          where acl.grantee = 'service_role'::regrole
            and acl.privilege_type in ('SELECT', 'INSERT', 'UPDATE')
            and not acl.is_grantable
        ) = 3
        and not exists (
          select 1
          from pg_catalog.aclexplode(
            coalesce(
              table_relation.relacl,
              pg_catalog.acldefault('r', table_relation.relowner)
            )
          ) acl
          where acl.grantee <> table_relation.relowner
            and (
              acl.grantee <> 'service_role'::regrole
              or acl.privilege_type not in ('SELECT', 'INSERT', 'UPDATE')
              or acl.is_grantable
            )
        )
        and not exists (
          select 1
          from pg_catalog.pg_attribute attribute_row
          cross join lateral pg_catalog.aclexplode(
            attribute_row.attacl
          ) acl
          where attribute_row.attrelid = table_relation.oid
            and attribute_row.attnum > 0
            and not attribute_row.attisdropped
            and acl.grantee <> table_relation.relowner
        )
    ) = 1 as value
    from pg_catalog.pg_class table_relation
    join pg_catalog.pg_namespace table_namespace
      on table_namespace.oid = table_relation.relnamespace
    join pg_catalog.pg_roles owner_role
      on owner_role.oid = table_relation.relowner
    cross join publication_manifest
    where table_relation.oid = 'public.story_specs'::regclass
  ),
  stage_boundary_health as (
    select count(*) filter (
      where table_namespace.nspname = 'public'
        and table_relation.relname = 'figure_stages'
        and table_relation.relkind = 'r'
        and table_relation.relrowsecurity
        and table_relation.relowner =
          publication_manifest.authority_owner
        and (owner_role.rolsuper or owner_role.rolbypassrls)
        and owner_role.oid not in (
          'service_role'::regrole,
          'anon'::regrole,
          'authenticated'::regrole
        )
        and not exists (
          select 1
          from pg_catalog.pg_policy policy_row
          where policy_row.polrelid = table_relation.oid
        )
        and (
          select count(distinct acl.privilege_type)
          from pg_catalog.aclexplode(
            coalesce(
              table_relation.relacl,
              pg_catalog.acldefault('r', table_relation.relowner)
            )
          ) acl
          where acl.grantee = 'service_role'::regrole
            and acl.privilege_type in ('SELECT', 'INSERT', 'UPDATE')
            and not acl.is_grantable
        ) = 3
        and not exists (
          select 1
          from pg_catalog.aclexplode(
            coalesce(
              table_relation.relacl,
              pg_catalog.acldefault('r', table_relation.relowner)
            )
          ) acl
          where acl.grantee <> table_relation.relowner
            and (
              acl.grantee <> 'service_role'::regrole
              or acl.privilege_type not in ('SELECT', 'INSERT', 'UPDATE')
              or acl.is_grantable
            )
        )
        and not exists (
          select 1
          from pg_catalog.pg_attribute attribute_row
          cross join lateral pg_catalog.aclexplode(
            attribute_row.attacl
          ) acl
          where attribute_row.attrelid = table_relation.oid
            and attribute_row.attnum > 0
            and not attribute_row.attisdropped
            and acl.grantee <> table_relation.relowner
        )
    ) = 1 as value
    from pg_catalog.pg_class table_relation
    join pg_catalog.pg_namespace table_namespace
      on table_namespace.oid = table_relation.relnamespace
    join pg_catalog.pg_roles owner_role
      on owner_role.oid = table_relation.relowner
    cross join publication_manifest
    where table_relation.oid = 'public.figure_stages'::regclass
  ),
  grant_health as (
    select
      authority_health.value
        and function_grant_health.value
        and table_boundary_health.value
        and stage_boundary_health.value
        and stage_lifecycle_health.value as value
    from authority_health,
      function_grant_health,
      table_boundary_health,
      stage_boundary_health,
      stage_lifecycle_health
  )
  select
    manifest_function_health.value
      and identity_health.value
      and stage_fk_health.value
      and lifecycle_health.value
      and stage_lifecycle_health.value
      and publication_index_health.value
      and promotion_health.value
      and retirement_health.value
      and legacy_health.value
      and grant_health.value as ok,
    identity_health.value
      and stage_fk_health.value as identity_constraint_valid,
    lifecycle_health.value
      and stage_lifecycle_health.value as lifecycle_trigger_enabled,
    publication_index_health.value
      as published_stage_uniqueness_valid,
    promotion_health.value
      and retirement_health.value as promotion_cas_valid,
    legacy_health.value as legacy_rpc_revoked,
    grant_health.value as boundary_granted
  from manifest_function_health,
    identity_health,
    stage_fk_health,
    lifecycle_health,
    stage_lifecycle_health,
    publication_index_health,
    promotion_health,
    retirement_health,
    legacy_health,
    grant_health
$fn$;

revoke all on function public.story_spec_publication_schema_health_v1()
  from public, anon, authenticated, service_role;

do $do$
declare
  target record;
  grantee_role record;
begin
  select
    procedure_row.proowner,
    procedure_row.proacl,
    pg_catalog.format(
      '%I.%I(%s)',
      namespace_row.nspname,
      procedure_row.proname,
      pg_catalog.pg_get_function_identity_arguments(procedure_row.oid)
    ) as signature
  into strict target
  from pg_catalog.pg_proc procedure_row
  join pg_catalog.pg_namespace namespace_row
    on namespace_row.oid = procedure_row.pronamespace
  where procedure_row.oid =
    'public.story_spec_publication_schema_health_v1()'::regprocedure;

  for grantee_role in
    select distinct role_row.rolname
    from pg_catalog.aclexplode(
      coalesce(
        target.proacl,
        pg_catalog.acldefault('f', target.proowner)
      )
    ) acl
    join pg_catalog.pg_roles role_row
      on role_row.oid = acl.grantee
    where acl.privilege_type = 'EXECUTE'
      and acl.grantee <> target.proowner
  loop
    execute pg_catalog.format(
      'revoke all on function %s from %I',
      target.signature,
      grantee_role.rolname
    );
  end loop;
end
$do$;

grant execute on function public.story_spec_publication_schema_health_v1()
  to service_role;

-- Do not commit a partially hardened cutover. This evaluates after every
-- owner, object, trigger, policy, table/column ACL, and function ACL change.
do $do$
begin
  if not coalesce(
    (
      select health.ok
      from public.story_spec_publication_schema_health_v1() health
    ),
    false
  ) then
    raise exception
      'StorySpec publication schema did not pass its closed health boundary';
  end if;
end
$do$;

comment on function public.story_spec_publication_schema_health_v1() is
  'Returns only booleans proving strict StorySpec identity, exact lifecycle enforcement, one published version per stage, compare-and-set promotion, and grants.';

notify pgrst, 'reload schema';
