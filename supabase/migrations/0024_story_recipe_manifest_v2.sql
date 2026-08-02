-- Exact database identity for story-recipe-manifest-v2.
--
-- This migration extends the append-only registry without selecting or
-- promoting a v2 recipe. Existing v1 rows remain exact with both new columns
-- null. A v2 row must carry the complete closed-template facet-tagger object,
-- and persisted MatchRecipe JSON must match that object byte-for-byte as jsonb.

create or replace function public.is_valid_facet_tagger_recipe_v1(
  p_tagger jsonb
) returns boolean
language plpgsql
immutable
security definer
set search_path = pg_catalog, public
as $fn$
begin
  if p_tagger is null or jsonb_typeof(p_tagger) <> 'object' then
    return false;
  end if;
  if exists (
    select 1
    from jsonb_object_keys(p_tagger) as tagger_key(key_name)
    where tagger_key.key_name not in (
      'mode', 'modelId', 'promptVersion', 'temperature',
      'reasoningEffort', 'timeoutMs', 'signalSchemaVersion',
      'projectionSchemaVersion', 'queryMode', 'weightingMode',
      'expansionEnabled'
    )
  ) then
    return false;
  end if;

  return p_tagger ?& array[
      'mode', 'modelId', 'promptVersion', 'temperature',
      'reasoningEffort', 'timeoutMs', 'signalSchemaVersion',
      'projectionSchemaVersion', 'queryMode', 'weightingMode',
      'expansionEnabled'
    ]
    and jsonb_typeof(p_tagger -> 'mode') = 'string'
    and p_tagger ->> 'mode' = 'closed_template'
    and jsonb_typeof(p_tagger -> 'modelId') = 'string'
    and (p_tagger ->> 'modelId') ~
      '^[a-z0-9][a-z0-9._/@:-]{0,127}$'
    and jsonb_typeof(p_tagger -> 'promptVersion') = 'string'
    and (p_tagger ->> 'promptVersion') ~
      '^[a-z0-9][a-z0-9._-]{0,127}$'
    and jsonb_typeof(p_tagger -> 'temperature') = 'number'
    and p_tagger -> 'temperature' = '0'::jsonb
    and jsonb_typeof(p_tagger -> 'reasoningEffort') = 'string'
    and (p_tagger ->> 'reasoningEffort') ~
      '^[a-z0-9][a-z0-9._-]{0,127}$'
    and jsonb_typeof(p_tagger -> 'timeoutMs') = 'number'
    and p_tagger -> 'timeoutMs' = '3000'::jsonb
    and jsonb_typeof(p_tagger -> 'signalSchemaVersion') = 'string'
    and (p_tagger ->> 'signalSchemaVersion') ~
      '^[a-z0-9][a-z0-9._-]{0,127}$'
    and jsonb_typeof(p_tagger -> 'projectionSchemaVersion') = 'string'
    and (p_tagger ->> 'projectionSchemaVersion') ~
      '^[a-z0-9][a-z0-9._-]{0,127}$'
    and jsonb_typeof(p_tagger -> 'queryMode') = 'string'
    and p_tagger ->> 'queryMode' in ('raw', 'validated_projection')
    and jsonb_typeof(p_tagger -> 'weightingMode') = 'string'
    and p_tagger ->> 'weightingMode' in ('static', 'bounded_dynamic')
    and p_tagger -> 'expansionEnabled' = 'false'::jsonb;
end
$fn$;

revoke all on function public.is_valid_facet_tagger_recipe_v1(jsonb)
  from public, anon, authenticated, service_role;

alter table public.story_recipe_registry
  add column manifest_schema_version text,
  add column facet_tagger jsonb,
  add constraint story_recipe_registry_manifest_v2_identity_check check (
    (
      manifest_schema_version is null
      and facet_tagger is null
    )
    or (
      manifest_schema_version = 'story-recipe-manifest-v2'
      and public.is_valid_facet_tagger_recipe_v1(facet_tagger)
      and retrieval_mode = 'facetsrag'
      and embedding_model_id is not null
    )
  );

comment on column public.story_recipe_registry.manifest_schema_version is
  'Null for historical manifest v1; exact discriminator for manifest v2.';
comment on column public.story_recipe_registry.facet_tagger is
  'Exact validated manifest-v2 facet-tagger identity; null for manifest v1.';

-- Migration-owner-only append boundary for v2. The web service role retains
-- read-only registry access and cannot register or promote a recipe.
create or replace function public.register_story_recipe_v2(
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
  p_manifest_schema_version text,
  p_facet_tagger jsonb,
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
  if p_manifest_schema_version is distinct from 'story-recipe-manifest-v2'
    or public.is_valid_facet_tagger_recipe_v1(p_facet_tagger)
      is distinct from true
    or p_retrieval_mode is distinct from 'facetsrag'
    or p_embedding_model_id is null
    or p_promoted_at is null
    or p_promoted_at > statement_timestamp() then
    raise exception 'invalid promoted story recipe v2 identity';
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
    resonance_brief_version, manifest_schema_version, facet_tagger,
    decision_id, promoted_at
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
    p_manifest_schema_version, p_facet_tagger,
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
    or v_existing.manifest_schema_version is distinct from
      p_manifest_schema_version
    or v_existing.facet_tagger is distinct from p_facet_tagger
    or v_existing.decision_id is distinct from p_decision_id
    or v_existing.promoted_at is distinct from p_promoted_at then
    raise exception 'story recipe v2 identity conflicts with immutable registry';
  end if;
  return 'existing';
end
$fn$;

revoke all on function public.register_story_recipe_v2(
  text, text, text, text, text, text, text, text, text, text, text, text,
  numeric, text, integer, numeric, text, boolean, text, text, text, text,
  text, text, jsonb, text, timestamptz
) from public, anon, authenticated, service_role;

comment on function public.register_story_recipe_v2(
  text, text, text, text, text, text, text, text, text, text, text, text,
  numeric, text, integer, numeric, text, boolean, text, text, text, text,
  text, text, jsonb, text, timestamptz
) is 'Migration-owner-only exact manifest-v2 append boundary.';

-- Preserve the original v1 predicate as a private compatibility primitive.
-- The public-name wrapper below upgrades every existing trigger/RPC call site
-- to exact v1-or-v2 semantics without copying those large transaction bodies.
create or replace function public.is_promoted_story_recipe_legacy_v1(
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

revoke all on function public.is_promoted_story_recipe_legacy_v1(jsonb)
  from public, anon, authenticated, service_role;

create or replace function public.is_promoted_story_recipe_v2(
  p_recipe jsonb
) returns boolean
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v_common jsonb;
begin
  if p_recipe is null or jsonb_typeof(p_recipe) <> 'object' then
    return false;
  end if;

  if not (p_recipe ? 'manifestSchemaVersion')
      and not (p_recipe ? 'facetTagger') then
    return public.is_promoted_story_recipe_legacy_v1(p_recipe)
      and exists (
        select 1
        from public.story_recipe_registry recipe
        where recipe.recipe_id = p_recipe ->> 'recipeId'
          and recipe.manifest_schema_version is null
          and recipe.facet_tagger is null
      );
  end if;

  if not (p_recipe ?& array['manifestSchemaVersion', 'facetTagger'])
    or jsonb_typeof(p_recipe -> 'manifestSchemaVersion') <> 'string'
    or p_recipe ->> 'manifestSchemaVersion' <>
      'story-recipe-manifest-v2'
    or public.is_valid_facet_tagger_recipe_v1(p_recipe -> 'facetTagger')
      is distinct from true then
    return false;
  end if;

  v_common := p_recipe - 'manifestSchemaVersion' - 'facetTagger';
  return public.is_promoted_story_recipe_legacy_v1(v_common)
    and exists (
      select 1
      from public.story_recipe_registry recipe
      where recipe.recipe_id = p_recipe ->> 'recipeId'
        and recipe.manifest_schema_version =
          p_recipe ->> 'manifestSchemaVersion'
        and recipe.facet_tagger = p_recipe -> 'facetTagger'
    );
end
$fn$;

revoke all on function public.is_promoted_story_recipe_v2(jsonb)
  from public, anon, authenticated, service_role;

-- Keep the historical function name as the call-site compatibility boundary.
-- CREATE OR REPLACE retains its OID, so existing trigger/RPC dependencies now
-- execute the upgraded exact predicate.
create or replace function public.is_promoted_story_recipe_v1(
  p_recipe jsonb
) returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $fn$
  select public.is_promoted_story_recipe_v2(p_recipe);
$fn$;

revoke all on function public.is_promoted_story_recipe_v1(jsonb)
  from public, anon, authenticated, service_role;

comment on function public.is_promoted_story_recipe_v2(jsonb) is
  'Exact persisted MatchRecipe predicate for manifest v1 and v2 identities.';
