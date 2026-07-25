-- Promotion-controlled story recipe registry.
--
-- This table is an append-only allowlist, not an active-pointer table. The
-- application selects either the reviewed primary or rollback recipe through
-- ONWARD_PRODUCTION_RECIPE_ID. Keeping every promoted recipe registered lets a
-- rollback be one environment change without a reverse/data migration.

create table public.story_recipe_registry (
  recipe_id text primary key check (
    recipe_id ~ '^[a-z0-9][a-z0-9._-]{0,127}$'
  ),
  manifest_sha256 text not null unique check (
    manifest_sha256 ~ '^[0-9a-f]{64}$'
  ),
  dataset_version text not null check (
    dataset_version ~ '^[a-z0-9][a-z0-9._-]{0,127}$'
  ),
  match_config_version text not null check (
    match_config_version ~ '^[a-z0-9][a-z0-9._-]{0,127}$'
  ),
  library_snapshot_sha256 text not null check (
    library_snapshot_sha256 ~ '^[0-9a-f]{64}$'
  ),
  retrieval_mode text not null check (
    retrieval_mode in ('keyword', 'facetsrag')
  ),
  llm_provider text not null check (llm_provider = 'real'),
  rerank_model_id text not null check (
    rerank_model_id ~ '^[a-z0-9][a-z0-9._/@:-]{0,127}$'
  ),
  prose_model_id text not null check (
    prose_model_id ~ '^[a-z0-9][a-z0-9._/@:-]{0,127}$'
  ),
  embedding_model_id text check (
    embedding_model_id is null
    or embedding_model_id ~ '^[a-z0-9][a-z0-9._/@:-]{0,127}$'
  ),
  rerank_prompt_version text not null check (
    rerank_prompt_version ~ '^[a-z0-9][a-z0-9._-]{0,127}$'
  ),
  story_prompt_version text not null check (
    story_prompt_version ~ '^[a-z0-9][a-z0-9._-]{0,127}$'
  ),
  rerank_temperature numeric not null,
  rerank_reasoning_effort text not null check (
    rerank_reasoning_effort ~ '^[a-z0-9][a-z0-9._-]{0,127}$'
  ),
  rerank_top_k integer not null check (rerank_top_k > 0),
  story_temperature numeric not null,
  story_composer_mode text not null check (
    story_composer_mode = 'canonical'
  ),
  hybrid_story_composer_enabled boolean not null check (
    hybrid_story_composer_enabled is false
  ),
  composer_version text not null check (
    composer_version ~ '^[a-z0-9][a-z0-9._-]{0,127}$'
  ),
  validator_version text not null check (
    validator_version ~ '^[a-z0-9][a-z0-9._-]{0,127}$'
  ),
  story_spec_schema_version text not null check (
    story_spec_schema_version ~ '^[a-z0-9][a-z0-9._-]{0,127}$'
  ),
  boundary_policy_version text not null check (
    boundary_policy_version ~ '^[a-z0-9][a-z0-9._-]{0,127}$'
  ),
  resonance_brief_version text not null check (
    resonance_brief_version ~ '^[a-z0-9][a-z0-9._-]{0,127}$'
  ),
  decision_id text not null check (
    decision_id ~ '^[a-z0-9][a-z0-9._-]{0,127}$'
  ),
  promoted_at timestamptz not null,
  constraint story_recipe_registry_embedding_role_check check (
    (retrieval_mode = 'keyword' and embedding_model_id is null)
    or (retrieval_mode = 'facetsrag' and embedding_model_id is not null)
  )
);

alter table public.story_recipe_registry enable row level security;
alter table public.story_recipe_registry force row level security;
revoke all on table public.story_recipe_registry
  from public, anon, authenticated, service_role;
grant select on table public.story_recipe_registry to service_role;

comment on table public.story_recipe_registry is
  'Append-only reviewed story recipes; application configuration owns the active pointer.';

-- Even a privileged operational caller cannot rewrite history through ordinary
-- DML. A correction is a newly identified recipe/decision, never an UPDATE.
create or replace function public.reject_story_recipe_mutation_v1()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
begin
  raise exception 'story recipe registry rows are immutable';
end;
$fn$;

revoke all on function public.reject_story_recipe_mutation_v1()
  from public, anon, authenticated, service_role;

create trigger story_recipe_registry_immutable
before update or delete on public.story_recipe_registry
for each row execute function public.reject_story_recipe_mutation_v1();

-- The narrow future-promotion write boundary. It is insert-only and
-- response-loss safe: replaying the exact identity returns existing, while a
-- reused recipe ID with different evidence fails closed.
create or replace function public.register_story_recipe_v1(
  p_recipe_id text,
  p_manifest_sha256 text,
  p_dataset_version text,
  p_match_config_version text,
  p_library_snapshot_sha256 text,
  p_retrieval_mode text,
  p_llm_provider text,
  p_rerank_model_id text,
  p_prose_model_id text,
  p_embedding_model_id text,
  p_rerank_prompt_version text,
  p_story_prompt_version text,
  p_rerank_temperature numeric,
  p_rerank_reasoning_effort text,
  p_rerank_top_k integer,
  p_story_temperature numeric,
  p_story_composer_mode text,
  p_hybrid_story_composer_enabled boolean,
  p_composer_version text,
  p_validator_version text,
  p_story_spec_schema_version text,
  p_boundary_policy_version text,
  p_resonance_brief_version text,
  p_decision_id text,
  p_promoted_at timestamptz
) returns text
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v_existing public.story_recipe_registry%rowtype;
begin
  if p_recipe_id is null
      or p_recipe_id !~ '^[a-z0-9][a-z0-9._-]{0,127}$'
    or p_manifest_sha256 is null
      or p_manifest_sha256 !~ '^[0-9a-f]{64}$'
    or p_dataset_version is null
      or p_dataset_version !~ '^[a-z0-9][a-z0-9._-]{0,127}$'
    or p_match_config_version is null
      or p_match_config_version !~ '^[a-z0-9][a-z0-9._-]{0,127}$'
    or p_library_snapshot_sha256 is null
      or p_library_snapshot_sha256 !~ '^[0-9a-f]{64}$'
    or p_retrieval_mode is null
      or p_retrieval_mode not in ('keyword', 'facetsrag')
    or p_llm_provider is distinct from 'real'
    or p_rerank_model_id is null
      or p_rerank_model_id !~ '^[a-z0-9][a-z0-9._/@:-]{0,127}$'
    or p_prose_model_id is null
      or p_prose_model_id !~ '^[a-z0-9][a-z0-9._/@:-]{0,127}$'
    or (
      p_embedding_model_id is not null
      and p_embedding_model_id !~
        '^[a-z0-9][a-z0-9._/@:-]{0,127}$'
    )
    or (p_retrieval_mode = 'keyword' and p_embedding_model_id is not null)
    or (p_retrieval_mode = 'facetsrag' and p_embedding_model_id is null)
    or p_rerank_prompt_version is null
      or p_rerank_prompt_version !~
        '^[a-z0-9][a-z0-9._-]{0,127}$'
    or p_story_prompt_version is null
      or p_story_prompt_version !~
        '^[a-z0-9][a-z0-9._-]{0,127}$'
    or p_rerank_temperature is null
    or p_rerank_reasoning_effort is null
      or p_rerank_reasoning_effort !~
        '^[a-z0-9][a-z0-9._-]{0,127}$'
    or p_rerank_top_k is null or p_rerank_top_k <= 0
    or p_story_temperature is null
    or p_story_composer_mode is null
      or p_story_composer_mode <> 'canonical'
    or p_hybrid_story_composer_enabled is distinct from false
    or p_composer_version is null
      or p_composer_version !~
        '^[a-z0-9][a-z0-9._-]{0,127}$'
    or p_validator_version is null
      or p_validator_version !~
        '^[a-z0-9][a-z0-9._-]{0,127}$'
    or p_story_spec_schema_version is null
      or p_story_spec_schema_version !~
        '^[a-z0-9][a-z0-9._-]{0,127}$'
    or p_boundary_policy_version is null
      or p_boundary_policy_version !~
        '^[a-z0-9][a-z0-9._-]{0,127}$'
    or p_resonance_brief_version is null
      or p_resonance_brief_version !~
        '^[a-z0-9][a-z0-9._-]{0,127}$'
    or p_decision_id is null
      or p_decision_id !~ '^[a-z0-9][a-z0-9._-]{0,127}$'
    or p_promoted_at is null
    or p_promoted_at > statement_timestamp() then
    raise exception 'invalid promoted story recipe identity';
  end if;

  insert into public.story_recipe_registry (
    recipe_id, manifest_sha256, dataset_version, match_config_version,
    library_snapshot_sha256,
    retrieval_mode, llm_provider, rerank_model_id, prose_model_id,
    embedding_model_id, rerank_prompt_version, story_prompt_version,
    rerank_temperature, rerank_reasoning_effort, rerank_top_k,
    story_temperature, story_composer_mode,
    hybrid_story_composer_enabled, composer_version, validator_version,
    story_spec_schema_version, boundary_policy_version,
    resonance_brief_version, decision_id, promoted_at
  ) values (
    p_recipe_id, p_manifest_sha256, p_dataset_version,
    p_match_config_version, p_library_snapshot_sha256,
    p_retrieval_mode, p_llm_provider,
    p_rerank_model_id, p_prose_model_id, p_embedding_model_id,
    p_rerank_prompt_version, p_story_prompt_version,
    p_rerank_temperature, p_rerank_reasoning_effort, p_rerank_top_k,
    p_story_temperature, p_story_composer_mode,
    p_hybrid_story_composer_enabled, p_composer_version,
    p_validator_version, p_story_spec_schema_version,
    p_boundary_policy_version, p_resonance_brief_version,
    p_decision_id, p_promoted_at
  ) on conflict do nothing;
  if found then return 'created'; end if;

  select * into v_existing
  from public.story_recipe_registry recipe
  where recipe.recipe_id = p_recipe_id;
  if not found
    or v_existing.manifest_sha256 is distinct from p_manifest_sha256
    or v_existing.dataset_version is distinct from p_dataset_version
    or v_existing.match_config_version is distinct from p_match_config_version
    or v_existing.library_snapshot_sha256 is distinct from
      p_library_snapshot_sha256
    or v_existing.retrieval_mode is distinct from p_retrieval_mode
    or v_existing.llm_provider is distinct from p_llm_provider
    or v_existing.rerank_model_id is distinct from p_rerank_model_id
    or v_existing.prose_model_id is distinct from p_prose_model_id
    or v_existing.embedding_model_id is distinct from p_embedding_model_id
    or v_existing.rerank_prompt_version is distinct from
      p_rerank_prompt_version
    or v_existing.story_prompt_version is distinct from p_story_prompt_version
    or v_existing.rerank_temperature is distinct from p_rerank_temperature
    or v_existing.rerank_reasoning_effort is distinct from
      p_rerank_reasoning_effort
    or v_existing.rerank_top_k is distinct from p_rerank_top_k
    or v_existing.story_temperature is distinct from p_story_temperature
    or v_existing.story_composer_mode is distinct from p_story_composer_mode
    or v_existing.hybrid_story_composer_enabled is distinct from
      p_hybrid_story_composer_enabled
    or v_existing.composer_version is distinct from p_composer_version
    or v_existing.validator_version is distinct from p_validator_version
    or v_existing.story_spec_schema_version is distinct from
      p_story_spec_schema_version
    or v_existing.boundary_policy_version is distinct from
      p_boundary_policy_version
    or v_existing.resonance_brief_version is distinct from
      p_resonance_brief_version
    or v_existing.decision_id is distinct from p_decision_id
    or v_existing.promoted_at is distinct from p_promoted_at then
    raise exception 'story recipe identity conflicts with immutable registry';
  end if;
  return 'existing';
end
$fn$;

revoke all on function public.register_story_recipe_v1(
  text, text, text, text, text, text, text, text, text, text, text, text,
  numeric, text, integer, numeric, text, boolean, text, text, text, text,
  text, text, timestamptz
) from public, anon, authenticated, service_role;

comment on function public.register_story_recipe_v1(
  text, text, text, text, text, text, text, text, text, text, text, text,
  numeric, text, integer, numeric, text, boolean, text, text, text, text,
  text, text, timestamptz
) is 'Migration-owner-only append boundary; never callable by the web service role.';

-- Current reviewed production baseline. FacetsRAG is deliberately NOT seeded:
-- presence in the application challenger manifest is not a promotion decision.
insert into public.story_recipe_registry (
  recipe_id, manifest_sha256, dataset_version, match_config_version,
  library_snapshot_sha256,
  retrieval_mode, llm_provider, rerank_model_id, prose_model_id,
  embedding_model_id, rerank_prompt_version, story_prompt_version,
  rerank_temperature, rerank_reasoning_effort, rerank_top_k,
  story_temperature, story_composer_mode,
  hybrid_story_composer_enabled, composer_version, validator_version,
  story_spec_schema_version, boundary_policy_version,
  resonance_brief_version, decision_id, promoted_at
) values (
  'keyword-rerank-figure-library-50-2026-07-02',
  'c2ced0eefa65351dc57a17f14dd76abf575745dafaac0d6d8699a95d5a21de52',
  'match-104-2026-07-02',
  'figure-library-50-2026-07-02',
  'e88751de566fa1077059cee143c4bd9d88b55e8adcca48eab4d5fa49b04ddf88',
  'keyword',
  'real',
  'gpt-oss-120b',
  'gpt-oss-120b',
  null,
  'rerank-prompt-v1-2026-07',
  'opening-copy-prompt-v1-2026-07',
  0,
  'low',
  6,
  0.3,
  'canonical',
  false,
  'canonical-composer-v1-2026-07',
  'artifact-validator-v2-2026-07',
  'story-spec-v1-2026-07',
  'story-boundaries-v1-2026-07',
  'resonance-brief-v1-2026-07',
  'rd_c5c82ca18b56997b606f2d30e8d03cde57365a806b78fefeb436065085b2ad8b',
  '2026-07-02T07:13:02.101Z'::timestamptz
);

-- Private closed-ID helper for telemetry boundaries that receive only a recipe
-- ID, rather than the complete immutable MatchRecipe object.
create or replace function public.is_registered_story_recipe_id_v1(
  p_recipe_id text
) returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $fn$
  select p_recipe_id is not null
    and p_recipe_id ~ '^[a-z0-9][a-z0-9._-]{0,127}$'
    and exists (
      select 1
      from public.story_recipe_registry recipe
      where recipe.recipe_id = p_recipe_id
    );
$fn$;

revoke all on function public.is_registered_story_recipe_id_v1(text)
  from public, anon, authenticated, service_role;

-- Exact promoted identity check for persisted MatchRecipe JSON. Operational
-- fields (crisis/recovery policy versions and optional alternate policy) may be
-- present, but every recipe-defining field must exist, have the right JSON
-- type, and equal the immutable registry row. Deployment version is dynamic but
-- remains a bounded, safe audit identifier.
create or replace function public.is_promoted_story_recipe_v1(
  p_recipe jsonb
) returns boolean
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $fn$
begin
  if p_recipe is null or jsonb_typeof(p_recipe) <> 'object' then
    return false;
  end if;
  if exists (
    select 1
    from jsonb_object_keys(p_recipe) as recipe_key(key_name)
    where recipe_key.key_name not in (
      'recipeId', 'recipeManifestHash', 'datasetVersion',
      'deploymentVersion', 'matchConfigVersion', 'librarySnapshotSha256',
      'retrievalMode',
      'llmProvider', 'rerankModelId', 'proseModelId', 'embeddingModelId',
      'rerankPromptVersion', 'storyPromptVersion', 'storyComposerMode',
      'rerankTemperature', 'rerankReasoningEffort', 'rerankTopK',
      'storyTemperature', 'hybridStoryComposerEnabled', 'composerVersion',
      'validatorVersion', 'storySpecSchemaVersion', 'boundaryPolicyVersion',
      'crisisRegexVersion', 'resonanceBriefVersion',
      'matchRecoveryPolicyVersion',
      'alternateStoryPolicyVersion'
    )
  ) then
    return false;
  end if;

  return p_recipe ?& array[
      'recipeId', 'recipeManifestHash', 'datasetVersion',
      'deploymentVersion', 'matchConfigVersion', 'librarySnapshotSha256',
      'retrievalMode',
      'llmProvider', 'rerankModelId', 'proseModelId', 'embeddingModelId',
      'rerankPromptVersion', 'storyPromptVersion', 'storyComposerMode',
      'rerankTemperature', 'rerankReasoningEffort', 'rerankTopK',
      'storyTemperature', 'hybridStoryComposerEnabled', 'composerVersion',
      'validatorVersion', 'storySpecSchemaVersion', 'boundaryPolicyVersion',
      'crisisRegexVersion', 'resonanceBriefVersion',
      'matchRecoveryPolicyVersion'
    ]
    and jsonb_typeof(p_recipe -> 'recipeId') = 'string'
    and jsonb_typeof(p_recipe -> 'recipeManifestHash') = 'string'
    and jsonb_typeof(p_recipe -> 'datasetVersion') = 'string'
    and jsonb_typeof(p_recipe -> 'deploymentVersion') = 'string'
    and (p_recipe ->> 'deploymentVersion') ~
      '^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$'
    and jsonb_typeof(p_recipe -> 'matchConfigVersion') = 'string'
    and jsonb_typeof(p_recipe -> 'librarySnapshotSha256') = 'string'
    and jsonb_typeof(p_recipe -> 'retrievalMode') = 'string'
    and jsonb_typeof(p_recipe -> 'llmProvider') = 'string'
    and jsonb_typeof(p_recipe -> 'rerankModelId') = 'string'
    and jsonb_typeof(p_recipe -> 'proseModelId') = 'string'
    and (
      p_recipe -> 'embeddingModelId' = 'null'::jsonb
      or jsonb_typeof(p_recipe -> 'embeddingModelId') = 'string'
    )
    and jsonb_typeof(p_recipe -> 'rerankPromptVersion') = 'string'
    and jsonb_typeof(p_recipe -> 'storyPromptVersion') = 'string'
    and jsonb_typeof(p_recipe -> 'rerankTemperature') = 'number'
    and jsonb_typeof(p_recipe -> 'rerankReasoningEffort') = 'string'
    and jsonb_typeof(p_recipe -> 'rerankTopK') = 'number'
    and (p_recipe ->> 'rerankTopK') ~ '^[1-9][0-9]*$'
    and jsonb_typeof(p_recipe -> 'storyTemperature') = 'number'
    and jsonb_typeof(p_recipe -> 'storyComposerMode') = 'string'
    and p_recipe -> 'hybridStoryComposerEnabled' = 'false'::jsonb
    and jsonb_typeof(p_recipe -> 'composerVersion') = 'string'
    and jsonb_typeof(p_recipe -> 'validatorVersion') = 'string'
    and jsonb_typeof(p_recipe -> 'storySpecSchemaVersion') = 'string'
    and jsonb_typeof(p_recipe -> 'boundaryPolicyVersion') = 'string'
    and jsonb_typeof(p_recipe -> 'crisisRegexVersion') = 'string'
    and (p_recipe ->> 'crisisRegexVersion') ~
      '^[a-z0-9][a-z0-9._-]{0,127}$'
    and jsonb_typeof(p_recipe -> 'resonanceBriefVersion') = 'string'
    and (p_recipe ->> 'resonanceBriefVersion') ~
      '^[a-z0-9][a-z0-9._-]{0,127}$'
    and jsonb_typeof(p_recipe -> 'matchRecoveryPolicyVersion') = 'string'
    and (p_recipe ->> 'matchRecoveryPolicyVersion') ~
      '^[a-z0-9][a-z0-9._-]{0,127}$'
    and (
      not (p_recipe ? 'alternateStoryPolicyVersion')
      or (
        jsonb_typeof(p_recipe -> 'alternateStoryPolicyVersion') = 'string'
        and (p_recipe ->> 'alternateStoryPolicyVersion') ~
          '^[a-z0-9][a-z0-9._-]{0,127}$'
      )
    )
    and exists (
      select 1
      from public.story_recipe_registry recipe
      where recipe.recipe_id = p_recipe ->> 'recipeId'
        and recipe.manifest_sha256 = p_recipe ->> 'recipeManifestHash'
        and recipe.dataset_version = p_recipe ->> 'datasetVersion'
        and recipe.match_config_version = p_recipe ->> 'matchConfigVersion'
        and recipe.library_snapshot_sha256 =
          p_recipe ->> 'librarySnapshotSha256'
        and recipe.retrieval_mode = p_recipe ->> 'retrievalMode'
        and recipe.llm_provider = p_recipe ->> 'llmProvider'
        and recipe.rerank_model_id = p_recipe ->> 'rerankModelId'
        and recipe.prose_model_id = p_recipe ->> 'proseModelId'
        and (
          (recipe.embedding_model_id is null
            and p_recipe -> 'embeddingModelId' = 'null'::jsonb)
          or recipe.embedding_model_id = p_recipe ->> 'embeddingModelId'
        )
        and recipe.rerank_prompt_version =
          p_recipe ->> 'rerankPromptVersion'
        and recipe.story_prompt_version = p_recipe ->> 'storyPromptVersion'
        and recipe.rerank_temperature::text =
          p_recipe ->> 'rerankTemperature'
        and recipe.rerank_reasoning_effort =
          p_recipe ->> 'rerankReasoningEffort'
        and recipe.rerank_top_k::text = p_recipe ->> 'rerankTopK'
        and recipe.story_temperature::text =
          p_recipe ->> 'storyTemperature'
        and recipe.story_composer_mode = p_recipe ->> 'storyComposerMode'
        and recipe.hybrid_story_composer_enabled is false
        and recipe.composer_version = p_recipe ->> 'composerVersion'
        and recipe.validator_version = p_recipe ->> 'validatorVersion'
        and recipe.story_spec_schema_version =
          p_recipe ->> 'storySpecSchemaVersion'
        and recipe.boundary_policy_version =
          p_recipe ->> 'boundaryPolicyVersion'
        and recipe.resonance_brief_version =
          p_recipe ->> 'resonanceBriefVersion'
    );
end
$fn$;

revoke all on function public.is_promoted_story_recipe_v1(jsonb)
  from public, anon, authenticated, service_role;

create or replace function public.enforce_session_story_recipe_v1()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
begin
  if tg_op = 'UPDATE' and new.match_recipe is distinct from old.match_recipe then
    raise exception 'persisted session recipe is immutable';
  end if;
  if public.is_promoted_story_recipe_v1(new.match_recipe) is distinct from true
  then
    raise exception 'session requires an exact promoted story recipe';
  end if;
  return new;
end
$fn$;

revoke all on function public.enforce_session_story_recipe_v1()
  from public, anon, authenticated, service_role;

create trigger sessions_promoted_story_recipe
before insert or update of match_recipe on public.sessions
for each row execute function public.enforce_session_story_recipe_v1();

-- Replace exact-current-ID telemetry checks with immutable registry
-- references. The privacy surface remains closed: only reviewed recipe IDs can
-- be stored, and registry rows cannot be changed or removed.
alter table public.product_events
  drop constraint product_events_recipe_id_check;
alter table public.product_events
  add constraint product_events_recipe_id_fkey
  foreign key (recipe_id) references public.story_recipe_registry(recipe_id)
  on update restrict on delete restrict;

alter table public.generation_attempts
  drop constraint generation_attempts_recipe_id_check;
alter table public.generation_attempts
  add constraint generation_attempts_recipe_id_fkey
  foreign key (recipe_id) references public.story_recipe_registry(recipe_id)
  on update restrict on delete restrict;

alter table public.telemetry_event_daily_rollups
  drop constraint telemetry_event_daily_rollups_value_check;
alter table public.telemetry_event_daily_rollups
  add constraint telemetry_event_daily_rollups_value_check check (
    case dimension_name
      when 'all' then dimension_value = 'all'
      when 'surface' then dimension_value = 'home_primary'
      when 'viewport_bucket' then dimension_value in ('small', 'large')
      when 'auth_method' then dimension_value in (
        'anonymous', 'email_link', 'password'
      )
      when 'rate_operation' then dimension_value in (
        'intake', 'feedback', 'alternate_story', 'historical_concern', 'auth'
      )
      when 'limit_scope' then dimension_value in ('user', 'ip')
      when 'recipe_id' then
        public.is_registered_story_recipe_id_v1(dimension_value)
      when 'story_role' then dimension_value in ('initial', 'alternate')
      when 'match_disposition' then dimension_value in (
        'close', 'adjacent', 'clarification_required', 'no_close_match'
      )
      when 'confidence_bucket' then dimension_value in (
        'high', 'medium', 'low', 'not_applicable'
      )
      when 'match_path' then dimension_value in (
        'rerank', 'keyword_fallback', 'not_run'
      )
      when 'age_fallback' then dimension_value in ('true', 'false')
      when 'boundary_outcome' then dimension_value in (
        'not_set', 'passed', 'no_eligible'
      )
      when 'policy_version' then dimension_value =
        'match-recovery-v1-2026-07'
      when 'composition_mode' then dimension_value in (
        'hybrid', 'canonical_fallback'
      )
      when 'fallback_reason' then dimension_value in (
        'none', 'canonical_only', 'provider_timeout', 'provider_error',
        'provider_output_invalid', 'validator_rejected'
      )
      when 'attempt_bucket' then dimension_value in (
        'not_attempted', 'first', 'retry', 'exhausted'
      )
      when 'latency_bucket' then dimension_value in (
        'lt250ms', '250to500ms', '500ms_to1s', '1to3s', '3to6s',
        '6to8s', '8to15s', 'gt15s'
      )
      when 'passage_ordinal' then dimension_value ~
        '^(?:[0-9]|[1-5][0-9]|6[0-3])$'
      when 'feedback_verdict' then dimension_value in (
        'felt_close', 'not_close'
      )
      when 'alternate_outcome' then dimension_value in (
        'ready', 'unavailable', 'expired', 'exhausted', 'failed'
      )
      when 'reopen_age_bucket' then dimension_value in ('lt7d', '7to30d')
      when 'deletion_scope' then dimension_value in ('story', 'account')
      when 'error_domain' then dimension_value in (
        'auth', 'database', 'matching', 'composition', 'reader', 'feedback',
        'alternate', 'deletion'
      )
      when 'error_class' then dimension_value in (
        'not_configured', 'timeout', 'rate_limited', 'unauthorized',
        'network', 'upstream', 'invalid_output', 'validation_rejected',
        'database', 'conflict', 'unknown'
      )
      when 'status_bucket' then dimension_value in (
        'invalid_request', 'unauthorized', 'rate_limited', 'upstream',
        'timeout', 'network', 'not_applicable'
      )
      else false
    end
  );

-- Recovery telemetry receives the closed recipe ID before a session exists.
-- Preserve its original atomic recovery-token/event transaction, changing only
-- the old single-ID assertion to the immutable registry allowlist.
create or replace function public.issue_match_recovery_flow_v2(
  p_token_hash text,
  p_user_id uuid,
  p_input_hash text,
  p_purpose text,
  p_expires_at timestamptz,
  p_telemetry_flow_id text,
  p_match_event_id text,
  p_clarification_event_id text,
  p_schema_version text,
  p_recipe_id text,
  p_confidence_bucket text,
  p_match_path text,
  p_age_fallback boolean,
  p_boundary_outcome text
) returns text
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v_flow public.telemetry_flows%rowtype;
  v_match_disposition text;
  v_capture_status text;
  v_existing_match_event_id text;
begin
  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$'
    or p_input_hash is null or p_input_hash !~ '^[0-9a-f]{64}$'
    or p_user_id is null
    or p_purpose is null
    or p_purpose not in ('clarification', 'adjacent_acceptance')
    or p_expires_at is null
    or p_expires_at <= statement_timestamp()
    or p_expires_at > statement_timestamp() + interval '10 minutes'
    or p_telemetry_flow_id is null or p_telemetry_flow_id !~
      '^tfl_[0-9a-f]{16}_[0-9a-f]{32}_[0-9a-f]{64}$'
    or p_match_event_id is null or p_match_event_id !~
      '^tev_[0-9a-f]{16}_[0-9a-f]{32}_[0-9a-f]{64}$'
    or p_schema_version is distinct from 'product-event-v1-2026-07'
    or public.is_registered_story_recipe_id_v1(p_recipe_id)
      is distinct from true
    or p_confidence_bucket is null
    or p_confidence_bucket not in ('medium', 'low')
    or p_match_path is null
    or p_match_path not in ('rerank', 'keyword_fallback')
    or p_age_fallback is null
    or p_boundary_outcome is null
    or p_boundary_outcome not in ('not_set', 'passed') then
    raise exception 'invalid match recovery flow input';
  end if;
  if (
    p_purpose = 'clarification'
    and (
      p_clarification_event_id is null
      or p_clarification_event_id !~
        '^tev_[0-9a-f]{16}_[0-9a-f]{32}_[0-9a-f]{64}$'
    )
  ) or (
    p_purpose = 'adjacent_acceptance'
    and p_clarification_event_id is not null
  ) then
    raise exception 'invalid match recovery telemetry combination';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended('telemetry-flow:' || p_telemetry_flow_id, 0)
  );
  select * into v_flow
  from public.telemetry_flows flow
  where flow.flow_id = p_telemetry_flow_id
  for update;
  if not found
    or v_flow.user_id is distinct from p_user_id
    or v_flow.root_session_id is not null
    or v_flow.expires_at <= statement_timestamp()
    or p_expires_at > v_flow.expires_at then
    raise exception 'match recovery telemetry flow is unavailable';
  end if;

  insert into public.match_recovery_flows (
    token_hash, user_id, input_hash, purpose, expires_at
  ) values (
    p_token_hash, p_user_id, p_input_hash, p_purpose, p_expires_at
  );

  v_match_disposition := case p_purpose
    when 'clarification' then 'clarification_required'
    else 'no_close_match'
  end;
  select public.capture_product_event_v1(
    p_event_id => p_match_event_id,
    p_schema_version => p_schema_version,
    p_flow_id => p_telemetry_flow_id,
    p_event_name => 'match_completed',
    p_recipe_id => p_recipe_id,
    p_story_role => 'initial',
    p_match_disposition => v_match_disposition,
    p_confidence_bucket => p_confidence_bucket,
    p_match_path => p_match_path,
    p_age_fallback => p_age_fallback,
    p_boundary_outcome => p_boundary_outcome
  ) into v_capture_status;
  if v_capture_status = 'conflict' then
    -- A response-loss retry may legitimately recompute different calibration
    -- dimensions for the same match transition. The semantic unit is fixed by
    -- flow + role + disposition, so retain the first measured row and ensure
    -- its delivery pointer exists instead of blocking a fresh recovery token.
    select existing.event_id into v_existing_match_event_id
    from public.product_events existing
    where existing.schema_version = p_schema_version
      and existing.flow_id = p_telemetry_flow_id
      and existing.event_name = 'match_completed'
      and existing.story_role = 'initial'
      and existing.match_disposition = v_match_disposition;
    if not found then
      raise exception 'match recovery match telemetry conflicted';
    end if;
    insert into public.product_event_outbox (event_id)
    values (v_existing_match_event_id)
    on conflict (event_id) do nothing;
  elsif v_capture_status is null
    or v_capture_status not in ('created', 'duplicate') then
    raise exception 'match recovery match telemetry conflicted';
  end if;

  if p_purpose = 'clarification' then
    select public.capture_product_event_v1(
      p_event_id => p_clarification_event_id,
      p_schema_version => p_schema_version,
      p_flow_id => p_telemetry_flow_id,
      p_event_name => 'clarification_shown',
      p_policy_version => 'match-recovery-v1-2026-07'
    ) into v_capture_status;
    if v_capture_status is null
      or v_capture_status not in ('created', 'duplicate') then
      raise exception 'match recovery clarification telemetry conflicted';
    end if;
  end if;

  return 'created';
end
$fn$;

revoke all on function public.issue_match_recovery_flow_v2(
  text, uuid, text, text, timestamptz, text, text, text, text, text, text,
  text, boolean, text
) from public, anon, authenticated;
grant execute on function public.issue_match_recovery_flow_v2(
  text, uuid, text, text, timestamptz, text, text, text, text, text, text,
  text, boolean, text
) to service_role;

-- Migration 0019 renamed the v4 implementation and put the account-deletion
-- advisory lock in an outer wrapper. Replace only that private implementation;
-- the outer lock, v3 transaction, idempotency, and event capture stay intact.
create or replace function public.create_story_session_v4_unserialized(
  p_session_id text,
  p_user_id uuid,
  p_figure_key text,
  p_stage_id text,
  p_framing text,
  p_age int,
  p_feeling text,
  p_story_request_context jsonb,
  p_match_recipe jsonb,
  p_artifact jsonb,
  p_telemetry_flow_id text,
  p_artifact_event_id text,
  p_telemetry_schema_version text
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v_result jsonb;
  v_status text;
  v_session public.sessions%rowtype;
  v_artifact public.story_artifacts%rowtype;
  v_recipe_id text;
  v_composition_mode text;
  v_fallback_reason text;
  v_attempt_count int;
  v_attempt_bucket text;
  v_capture_status text;
begin
  if p_artifact_event_id is null or p_artifact_event_id !~
    '^tev_[0-9a-f]{16}_[0-9a-f]{32}_[0-9a-f]{64}$'
    or p_telemetry_schema_version is distinct from
      'product-event-v1-2026-07' then
    raise exception 'invalid artifact telemetry identity';
  end if;

  v_result := public.create_story_session_v3(
    p_session_id,
    p_user_id,
    p_figure_key,
    p_stage_id,
    p_framing,
    p_age,
    p_feeling,
    p_story_request_context,
    p_match_recipe,
    p_artifact,
    p_telemetry_flow_id
  );
  v_status := v_result ->> 'status';
  if v_status is null then
    raise exception 'story-session v3 returned an invalid disposition';
  end if;
  if v_status not in ('created', 'existing') then return v_result; end if;

  select * into v_session
  from public.sessions story_session
  where story_session.session_id = v_result ->> 'sessionId'
    and story_session.user_id = p_user_id;
  if not found or v_session.alternate_of_session_id is not null
    or v_session.story_artifact_id is null then
    raise exception 'persisted initial story session is unavailable';
  end if;

  select * into v_artifact
  from public.story_artifacts artifact
  where artifact.artifact_id = v_session.story_artifact_id
    and artifact.session_id = v_session.session_id
    and artifact.user_id = v_session.user_id;
  if not found then
    raise exception 'persisted initial story artifact is unavailable';
  end if;

  v_recipe_id := v_session.match_recipe ->> 'recipeId';
  if public.is_promoted_story_recipe_v1(v_session.match_recipe)
      is distinct from true
    or v_artifact.artifact #> '{recipe,match}'
      is distinct from v_session.match_recipe then
    raise exception 'persisted artifact recipe identity is invalid';
  end if;
  v_composition_mode := v_artifact.composition_mode;
  v_attempt_count := (v_artifact.artifact #>>
    '{composition,attemptCount}')::int;

  if v_composition_mode = 'hybrid' then
    if v_artifact.artifact #>> '{composition,fallbackReason}' is not null
      or v_attempt_count is null or v_attempt_count not in (1, 2) then
      raise exception 'persisted hybrid artifact telemetry is invalid';
    end if;
    v_fallback_reason := 'none';
    v_attempt_bucket := case v_attempt_count
      when 1 then 'first'
      else 'retry'
    end;
  elsif v_composition_mode = 'canonical_fallback' then
    v_fallback_reason := v_artifact.artifact #>>
      '{composition,fallbackReason}';
    if v_attempt_count = 0
      and v_fallback_reason in ('canonical_only', 'validator_rejected') then
      v_attempt_bucket := 'not_attempted';
    elsif v_attempt_count in (1, 2)
      and v_fallback_reason in (
        'provider_timeout', 'provider_error', 'provider_output_invalid',
        'validator_rejected'
      ) then
      v_attempt_bucket := 'exhausted';
    else
      raise exception 'persisted canonical artifact telemetry is invalid';
    end if;
  else
    raise exception 'persisted artifact composition mode is invalid';
  end if;

  select public.capture_product_event_v1(
    p_event_id => p_artifact_event_id,
    p_schema_version => p_telemetry_schema_version,
    p_flow_id => p_telemetry_flow_id,
    p_event_name => 'artifact_created',
    p_recipe_id => v_recipe_id,
    p_story_role => 'initial',
    p_composition_mode => v_composition_mode,
    p_fallback_reason => v_fallback_reason,
    p_attempt_bucket => v_attempt_bucket
  ) into v_capture_status;
  if v_capture_status is null
    or v_capture_status not in ('created', 'duplicate') then
    raise exception 'initial artifact telemetry conflicted';
  end if;

  return v_result;
end
$fn$;

revoke all on function public.create_story_session_v4_unserialized(
  text, uuid, text, text, text, int, text, jsonb, jsonb, jsonb, text, text,
  text
) from public, anon, authenticated, service_role;

-- Alternate completion already derives every telemetry dimension from the
-- committed result. Keep that transaction unchanged while validating the full
-- persisted artifact/session recipe against the registry instead of one
-- hard-coded recipe triplet.
create or replace function public.complete_alternate_story_session_v2(
  p_user_id uuid,
  p_source_session_id text,
  p_lease_id text,
  p_session_id text,
  p_artifact jsonb,
  p_telemetry_flow_id text,
  p_artifact_event_id text,
  p_alternate_resolved_event_id text,
  p_telemetry_schema_version text
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v_result jsonb;
  v_status text;
  v_result_session public.sessions%rowtype;
  v_result_artifact public.story_artifacts%rowtype;
  v_alternate_flow public.alternate_story_flows%rowtype;
  v_telemetry_flow public.telemetry_flows%rowtype;
  v_recipe_id text;
  v_composition_mode text;
  v_fallback_reason text;
  v_attempt_count int;
  v_attempt_bucket text;
  v_capture_status text;
begin
  v_result := public.complete_alternate_story_session(
    p_user_id,
    p_source_session_id,
    p_lease_id,
    p_session_id,
    p_artifact
  );
  v_status := v_result ->> 'status';
  if v_status is null or v_status not in ('ready', 'collision', 'rejected') then
    raise exception 'alternate completion returned an invalid disposition';
  end if;
  if v_status <> 'ready' then return v_result; end if;

  select * into v_alternate_flow
  from public.alternate_story_flows flow
  where flow.source_session_id = p_source_session_id
    and flow.user_id = p_user_id
  for share;
  select * into v_result_session
  from public.sessions story_session
  where story_session.session_id = v_result ->> 'sessionId'
    and story_session.user_id = p_user_id;
  if v_alternate_flow.source_session_id is null
    or v_alternate_flow.status <> 'ready'
    or v_alternate_flow.result_session_id is distinct from
      v_result_session.session_id
    or v_result_session.alternate_of_session_id is distinct from
      p_source_session_id
    or v_result_session.story_artifact_id is null then
    raise exception 'persisted alternate result is unavailable';
  end if;
  select * into v_result_artifact
  from public.story_artifacts artifact
  where artifact.artifact_id = v_result_session.story_artifact_id
    and artifact.session_id = v_result_session.session_id
    and artifact.user_id = p_user_id;
  if not found then
    raise exception 'persisted alternate artifact is unavailable';
  end if;

  v_recipe_id := v_result_session.match_recipe ->> 'recipeId';
  if public.is_promoted_story_recipe_v1(v_result_session.match_recipe)
      is distinct from true
    or v_result_artifact.artifact #> '{recipe,match}'
      is distinct from v_result_session.match_recipe
    or v_result_artifact.artifact #>>
      '{recipe,match,alternateStoryPolicyVersion}' is distinct from
      'alternate-story-v1-2026-07' then
    raise exception 'persisted alternate recipe identity is invalid';
  end if;
  v_composition_mode := v_result_artifact.composition_mode;
  v_attempt_count := (v_result_artifact.artifact #>>
    '{composition,attemptCount}')::int;
  if v_composition_mode = 'hybrid' then
    if v_result_artifact.artifact #>>
        '{composition,fallbackReason}' is not null
      or v_attempt_count is null or v_attempt_count not in (1, 2) then
      raise exception 'persisted alternate hybrid telemetry is invalid';
    end if;
    v_fallback_reason := 'none';
    v_attempt_bucket := case v_attempt_count when 1 then 'first' else 'retry' end;
  elsif v_composition_mode = 'canonical_fallback' then
    v_fallback_reason := v_result_artifact.artifact #>>
      '{composition,fallbackReason}';
    if v_attempt_count = 0
      and v_fallback_reason in ('canonical_only', 'validator_rejected') then
      v_attempt_bucket := 'not_attempted';
    elsif v_attempt_count in (1, 2)
      and v_fallback_reason in (
        'provider_timeout', 'provider_error', 'provider_output_invalid',
        'validator_rejected'
      ) then
      v_attempt_bucket := 'exhausted';
    else
      raise exception 'persisted alternate fallback telemetry is invalid';
    end if;
  else
    raise exception 'persisted alternate composition mode is invalid';
  end if;

  select * into v_telemetry_flow
  from public.telemetry_flows telemetry_flow
  where telemetry_flow.user_id = p_user_id
    and telemetry_flow.root_session_id = p_source_session_id
    and telemetry_flow.expires_at > statement_timestamp()
  for share;
  if found then
    if p_telemetry_flow_id is distinct from v_telemetry_flow.flow_id
      or p_artifact_event_id is null
      or p_artifact_event_id !~
        '^tev_[0-9a-f]{16}_[0-9a-f]{32}_[0-9a-f]{64}$'
      or p_alternate_resolved_event_id is null
      or p_telemetry_schema_version is distinct from
        'product-event-v1-2026-07' then
      raise exception 'active alternate-ready telemetry is invalid';
    end if;

    select public.capture_product_event_v1(
      p_event_id => p_artifact_event_id,
      p_schema_version => p_telemetry_schema_version,
      p_flow_id => v_telemetry_flow.flow_id,
      p_event_name => 'artifact_created',
      p_recipe_id => v_recipe_id,
      p_story_role => 'alternate',
      p_composition_mode => v_composition_mode,
      p_fallback_reason => v_fallback_reason,
      p_attempt_bucket => v_attempt_bucket
    ) into v_capture_status;
    if v_capture_status is null
      or v_capture_status not in ('created', 'duplicate') then
      raise exception 'alternate artifact telemetry conflicted';
    end if;

    select public.capture_alternate_resolution_v1(
      p_alternate_resolved_event_id,
      p_telemetry_schema_version,
      v_telemetry_flow.flow_id,
      'ready'
    ) into v_capture_status;
    if v_capture_status is null
      or v_capture_status not in ('created', 'duplicate') then
      raise exception 'alternate ready telemetry conflicted';
    end if;
  end if;
  return v_result;
end
$fn$;

revoke all on function public.complete_alternate_story_session_v2(
  uuid, text, text, text, jsonb, text, text, text, text
) from public, anon, authenticated;
grant execute on function public.complete_alternate_story_session_v2(
  uuid, text, text, text, jsonb, text, text, text, text
) to service_role;
