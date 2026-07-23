import "server-only";
import { getSupabase } from "./db";
import {
  StoryRecipeRuntimeError,
  getStoryRecipePromotion,
  isStoryRecipeManifestV2,
  type StoryRecipeManifest,
  type StoryRecipeRuntime,
} from "./story-recipe";

const REGISTRY_COLUMNS = [
  "recipe_id",
  "manifest_sha256",
  "dataset_version",
  "match_config_version",
  "library_snapshot_sha256",
  "retrieval_mode",
  "llm_provider",
  "rerank_model_id",
  "prose_model_id",
  "embedding_model_id",
  "rerank_prompt_version",
  "story_prompt_version",
  "rerank_temperature",
  "rerank_reasoning_effort",
  "rerank_top_k",
  "story_temperature",
  "story_composer_mode",
  "hybrid_story_composer_enabled",
  "composer_version",
  "validator_version",
  "story_spec_schema_version",
  "boundary_policy_version",
  "resonance_brief_version",
  "decision_id",
  "promoted_at",
] as const;

type RegistryRow = Record<(typeof REGISTRY_COLUMNS)[number], unknown>;

declare global {
  var __onwardStoryRecipeRegistrationChecks:
    | Map<string, Promise<void>>
    | undefined;
}

// A production process proves the selected immutable manifest is registered in
// the live database before any model or rate-limit work. Successful checks are
// process-cached because registry rows cannot be updated or deleted; failures
// are evicted so a just-applied migration can recover without a redeploy.
export async function assertProductionStoryRecipeRegistered(
  runtime: StoryRecipeRuntime,
): Promise<void> {
  if (!runtime.production) return;

  const promotion = getStoryRecipePromotion(runtime.recipe.recipeId);
  if (!promotion) throw new StoryRecipeRuntimeError("registry_invalid");
  const cacheKey = `${runtime.recipe.recipeId}:${runtime.recipe.manifestSha256}:${promotion.decisionId}`;
  const cache =
    globalThis.__onwardStoryRecipeRegistrationChecks ??
    (globalThis.__onwardStoryRecipeRegistrationChecks = new Map());
  const existing = cache.get(cacheKey);
  if (existing) return existing;

  const check = verifyRegistration(runtime.recipe, promotion).catch((error) => {
    cache.delete(cacheKey);
    throw error;
  });
  cache.set(cacheKey, check);
  return check;
}

async function verifyRegistration(
  recipe: StoryRecipeManifest,
  promotion: Readonly<{ decisionId: string; promotedAt: string }>,
): Promise<void> {
  const { data, error } = await getSupabase()
    .from("story_recipe_registry")
    .select(REGISTRY_COLUMNS.join(","))
    .eq("recipe_id", recipe.recipeId)
    .maybeSingle();
  if (error || !registrationMatches(data, recipe, promotion)) {
    throw new StoryRecipeRuntimeError("registry_invalid");
  }
}

export function registrationMatches(
  value: unknown,
  recipe: StoryRecipeManifest,
  promotion: Readonly<{ decisionId: string; promotedAt: string }>,
): value is RegistryRow {
  // The v1 database contract has no columns for the facet-tagger identity.
  // Parsing v2 manifests ahead of that migration must not let a partial row
  // appear to prove the stronger manifest was registered.
  if (isStoryRecipeManifestV2(recipe) || !isRecord(value)) return false;
  if (
    Object.keys(value).sort().join(",") !==
    [...REGISTRY_COLUMNS].sort().join(",")
  ) {
    return false;
  }
  const expected: RegistryRow = {
    recipe_id: recipe.recipeId,
    manifest_sha256: recipe.manifestSha256,
    dataset_version: recipe.datasetVersion,
    match_config_version: recipe.matchConfigVersion,
    library_snapshot_sha256: recipe.librarySnapshotSha256,
    retrieval_mode: recipe.retrievalMode,
    llm_provider: recipe.llmProvider,
    rerank_model_id: recipe.rerankModelId,
    prose_model_id: recipe.proseModelId,
    embedding_model_id: recipe.embeddingModelId,
    rerank_prompt_version: recipe.rerankPromptVersion,
    story_prompt_version: recipe.storyPromptVersion,
    rerank_temperature: recipe.rerankTemperature,
    rerank_reasoning_effort: recipe.rerankReasoningEffort,
    rerank_top_k: recipe.rerankTopK,
    story_temperature: recipe.storyTemperature,
    story_composer_mode: recipe.storyComposerMode,
    hybrid_story_composer_enabled: recipe.hybridStoryComposerEnabled,
    composer_version: recipe.composerVersion,
    validator_version: recipe.validatorVersion,
    story_spec_schema_version: recipe.storySpecSchemaVersion,
    boundary_policy_version: recipe.boundaryPolicyVersion,
    resonance_brief_version: recipe.resonanceBriefVersion,
    decision_id: promotion.decisionId,
    promoted_at: promotion.promotedAt,
  };

  return REGISTRY_COLUMNS.every((column) => {
    if (column === "promoted_at") {
      return sameTimestamp(value[column], expected[column]);
    }
    if (typeof expected[column] === "number") {
      return sameNumber(value[column], expected[column]);
    }
    return value[column] === expected[column];
  });
}

function sameNumber(actual: unknown, expected: unknown): boolean {
  if (typeof expected !== "number") return false;
  if (typeof actual === "number") {
    return Number.isFinite(actual) && actual === expected;
  }
  if (typeof actual !== "string" || actual.trim() === "") return false;
  const parsed = Number(actual);
  return Number.isFinite(parsed) && parsed === expected;
}

function sameTimestamp(actual: unknown, expected: unknown): boolean {
  if (typeof actual !== "string" || typeof expected !== "string") return false;
  const actualMs = Date.parse(actual);
  const expectedMs = Date.parse(expected);
  return Number.isFinite(actualMs) && actualMs === expectedMs;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
