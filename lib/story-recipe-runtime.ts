import registryDocument from "../config/story-recipes.json";
import type { RetrievalMode } from "./types";
import {
  DEFAULT_LLM_BASE_URL,
  DEFAULT_PROSE_TIMEOUT_MS,
  DEFAULT_RERANK_TIMEOUT_MS,
  RERANK_PROMPT_VERSION,
  isSupportedStoryPromptVersion,
} from "./llm-recipe-constants";
import {
  DEFAULT_EMBEDDING_BASE_URL,
  DEFAULT_EMBEDDING_DIM,
  DEFAULT_EMBEDDING_MAX_RETRIES,
  DEFAULT_EMBEDDING_MODEL,
  DEFAULT_EMBEDDING_RETRY_BASE_MS,
  DEFAULT_EMBEDDING_TIMEOUT_MS,
} from "./embedding-recipe-constants";
import {
  LIBRARY_SNAPSHOT_SHA256,
  MATCH_CONFIG_IMPLEMENTATION_VERSION,
} from "./match-recipe-constants";
import {
  STORY_ARTIFACT_VALIDATOR_VERSION,
  STORY_COMPOSER_VERSION,
} from "./story-artifact-types";
import { STORY_BOUNDARY_POLICY_VERSION } from "./story-boundaries";
import { RESONANCE_BRIEF_VERSION } from "./resonance-brief-constants";
import { STORY_SPEC_SCHEMA_VERSION } from "./story-spec-types";

export const STORY_RECIPE_REGISTRY_SCHEMA_VERSION =
  "story-recipe-registry-v1" as const;
export const STORY_RECIPE_MANIFEST_SCHEMA_V2 =
  "story-recipe-manifest-v2" as const;

const MANIFEST_HASH_PATTERN = /^[0-9a-f]{64}$/;
const REGISTRY_VERSION_ID_PATTERN = /^[a-z0-9][a-z0-9._-]{0,127}$/;
const MODEL_ID_PATTERN = /^[a-z0-9][a-z0-9._/@:-]{0,127}$/;
export const DEPLOYMENT_VERSION_PATTERN =
  /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;

type StoryRecipeManifestBase = Readonly<{
  recipeId: string;
  manifestSha256: string;
  retrievalMode: Extract<RetrievalMode, "keyword" | "facetsrag">;
  matchConfigVersion: string;
  librarySnapshotSha256: string;
  datasetVersion: string;
  llmProvider: "real";
  rerankModelId: string;
  proseModelId: string;
  embeddingModelId: string | null;
  rerankPromptVersion: string;
  storyPromptVersion: string;
  rerankTemperature: number;
  rerankReasoningEffort: string;
  rerankTopK: number;
  storyTemperature: number;
  storyComposerMode: "canonical";
  hybridStoryComposerEnabled: false;
  composerVersion: string;
  validatorVersion: string;
  storySpecSchemaVersion: string;
  boundaryPolicyVersion: string;
  resonanceBriefVersion: string;
}>;

export type StoryRecipeManifestV1 = StoryRecipeManifestBase &
  Readonly<{
    manifestSchemaVersion?: never;
    facetTagger?: never;
  }>;

export type FacetTaggerRecipe = Readonly<{
  mode: "closed_template";
  modelId: string;
  promptVersion: string;
  temperature: 0;
  reasoningEffort: string;
  timeoutMs: 3000;
  signalSchemaVersion: string;
  projectionSchemaVersion: string;
  queryMode: "raw" | "validated_projection";
  weightingMode: "static" | "bounded_dynamic";
  expansionEnabled: false;
}>;

export type StoryRecipeManifestV2 = StoryRecipeManifestBase &
  Readonly<{
    manifestSchemaVersion: typeof STORY_RECIPE_MANIFEST_SCHEMA_V2;
    facetTagger: FacetTaggerRecipe;
  }>;

export type StoryRecipeManifest =
  | StoryRecipeManifestV1
  | StoryRecipeManifestV2;

export type StoryRecipeDataset = Readonly<{
  version: string;
  sha256: string;
  visibility: "synthetic" | "protected_holdout";
}>;

export type StoryRecipeRegistry = Readonly<{
  schemaVersion: typeof STORY_RECIPE_REGISTRY_SCHEMA_VERSION;
  datasets: readonly StoryRecipeDataset[];
  selection: Readonly<{
    primaryRecipeId: string;
    rollbackRecipeId: string;
    decisionId: string;
  }>;
  promotions: readonly StoryRecipePromotion[];
  recipes: readonly StoryRecipeManifest[];
}>;

export type StoryRecipePromotion = Readonly<{
  recipeId: string;
  decisionId: string;
  promotedAt: string;
}>;

export type StoryRecipeRuntime = Readonly<{
  recipe: StoryRecipeManifest;
  deploymentVersion: string;
  production: boolean;
}>;

export type StoryRecipeExecutionPlan = Readonly<{
  llmProvider: StoryRecipeManifest["llmProvider"];
  rerankModelId: string;
  proseModelId: string;
  rerankPromptVersion: string;
  storyPromptVersion: string;
  rerankTemperature: number;
  rerankReasoningEffort: string;
  storyTemperature: number;
  retrievalMode: StoryRecipeManifest["retrievalMode"];
  rerankTopK: number;
  storyComposerMode: StoryRecipeManifest["storyComposerMode"];
  hybridStoryComposerEnabled: StoryRecipeManifest["hybridStoryComposerEnabled"];
  embedding: Readonly<{
    provider: "gemini";
    model: string;
    dimension: number;
  }> | null;
}>;

export type StoryRecipeRuntimeErrorCode =
  | "registry_invalid"
  | "recipe_id_required"
  | "recipe_not_selectable"
  | "persistence_invalid"
  | "llm_provider_invalid"
  | "llm_credentials_missing"
  | "llm_endpoint_invalid"
  | "llm_timeout_invalid"
  | "rerank_model_invalid"
  | "prose_model_invalid"
  | "rerank_temperature_invalid"
  | "rerank_reasoning_invalid"
  | "story_temperature_invalid"
  | "composer_mode_invalid"
  | "code_identity_invalid"
  | "retrieval_mode_invalid"
  | "embedding_runtime_invalid"
  | "deployment_version_invalid";

export class StoryRecipeRuntimeError extends Error {
  constructor(readonly code: StoryRecipeRuntimeErrorCode) {
    super("Story recipe runtime configuration is invalid.");
    this.name = "StoryRecipeRuntimeError";
  }
}

const MANIFEST_V1_KEYS = [
  "recipeId",
  "manifestSha256",
  "retrievalMode",
  "matchConfigVersion",
  "librarySnapshotSha256",
  "datasetVersion",
  "llmProvider",
  "rerankModelId",
  "proseModelId",
  "embeddingModelId",
  "rerankPromptVersion",
  "storyPromptVersion",
  "rerankTemperature",
  "rerankReasoningEffort",
  "rerankTopK",
  "storyTemperature",
  "storyComposerMode",
  "hybridStoryComposerEnabled",
  "composerVersion",
  "validatorVersion",
  "storySpecSchemaVersion",
  "boundaryPolicyVersion",
  "resonanceBriefVersion",
] as const;

const MANIFEST_V2_KEYS = [
  ...MANIFEST_V1_KEYS,
  "manifestSchemaVersion",
  "facetTagger",
] as const;

const FACET_TAGGER_KEYS = [
  "mode",
  "modelId",
  "promptVersion",
  "temperature",
  "reasoningEffort",
  "timeoutMs",
  "signalSchemaVersion",
  "projectionSchemaVersion",
  "queryMode",
  "weightingMode",
  "expansionEnabled",
] as const;

export const STORY_RECIPE_REGISTRY: StoryRecipeRegistry = parseStoryRecipeRegistry(
  registryDocument as unknown,
);

const recipesById = new Map(
  STORY_RECIPE_REGISTRY.recipes.map((recipe) => [recipe.recipeId, recipe]),
);
const promotionsByRecipeId = new Map(
  STORY_RECIPE_REGISTRY.promotions.map((promotion) => [
    promotion.recipeId,
    promotion,
  ]),
);

export const PRIMARY_STORY_RECIPE = requiredRecipe(
  STORY_RECIPE_REGISTRY.selection.primaryRecipeId,
);
export const ROLLBACK_STORY_RECIPE = requiredRecipe(
  STORY_RECIPE_REGISTRY.selection.rollbackRecipeId,
);
export const SELECTABLE_STORY_RECIPE_IDS = Object.freeze(
  [...new Set([
    PRIMARY_STORY_RECIPE.recipeId,
    ROLLBACK_STORY_RECIPE.recipeId,
  ])],
);

export function getStoryRecipeById(
  recipeId: string,
): StoryRecipeManifest | null {
  return recipesById.get(recipeId) ?? null;
}

export function getStoryRecipePromotion(
  recipeId: string,
): StoryRecipePromotion | null {
  return promotionsByRecipeId.get(recipeId) ?? null;
}

export function storyRecipeExecutionPlan(
  recipe: StoryRecipeManifest,
): StoryRecipeExecutionPlan {
  assertStoryRecipeCodeIdentity(recipe);
  const embedding = embeddingPlan(recipe.embeddingModelId);
  return Object.freeze({
    llmProvider: recipe.llmProvider,
    rerankModelId: recipe.rerankModelId,
    proseModelId: recipe.proseModelId,
    rerankPromptVersion: recipe.rerankPromptVersion,
    storyPromptVersion: recipe.storyPromptVersion,
    rerankTemperature: recipe.rerankTemperature,
    rerankReasoningEffort: recipe.rerankReasoningEffort,
    storyTemperature: recipe.storyTemperature,
    retrievalMode: recipe.retrievalMode,
    rerankTopK: recipe.rerankTopK,
    storyComposerMode: recipe.storyComposerMode,
    hybridStoryComposerEnabled: recipe.hybridStoryComposerEnabled,
    embedding,
  });
}

// Production behavior has one non-secret selector. Provider/model/tuning,
// retrieval, embedder, and composer settings are read from its immutable
// manifest; stale environment variables cannot create an unmeasured hybrid.
export function productionStoryRecipeExecutionPlan(
  env: Readonly<Record<string, string | undefined>> = process.env,
): StoryRecipeExecutionPlan | null {
  if (env.NODE_ENV !== "production") return null;
  return storyRecipeExecutionPlan(selectedRecipe(env, true));
}

// Pure and dependency-injected so deploy checks can exercise the complete
// production matrix without mutating provider singletons or process state.
export function assertProductionStoryRecipeRuntime(
  env: Readonly<Record<string, string | undefined>> = process.env,
): StoryRecipeRuntime {
  const production = env.NODE_ENV === "production";
  const recipe = selectedRecipe(env, production);
  const deploymentVersion = deploymentVersionFor(env, production);
  assertStoryRecipeCodeIdentity(recipe);

  if (!production) {
    return Object.freeze({ recipe, deploymentVersion, production: false });
  }

  if (normalized(env.PERSISTENCE) !== "supabase") {
    throw new StoryRecipeRuntimeError("persistence_invalid");
  }
  assertStoryRecipeInfrastructureRuntime(recipe, env);

  return Object.freeze({ recipe, deploymentVersion, production: true });
}

// Strict provider/runtime check shared by served production and the eval
// harness. It accepts an unpromoted challenger manifest, but never a different
// endpoint, timeout/fallback posture, credential state, or installed code path.
export function assertStoryRecipeExecutionRuntime(
  recipe: StoryRecipeManifest,
  env: Readonly<Record<string, string | undefined>> = process.env,
): void {
  assertStoryRecipeCodeIdentity(recipe);
  assertStoryRecipeInfrastructureRuntime(recipe, env);
  if (env.LLM_PROVIDER !== recipe.llmProvider) {
    throw new StoryRecipeRuntimeError("llm_provider_invalid");
  }
  if (
    resolvedLiteral(env.LLM_MODEL_RERANK, "gpt-oss-120b") !==
    recipe.rerankModelId
  ) {
    throw new StoryRecipeRuntimeError("rerank_model_invalid");
  }
  if (
    resolvedLiteral(env.LLM_MODEL_PROSE, "gpt-oss-120b") !==
    recipe.proseModelId
  ) {
    throw new StoryRecipeRuntimeError("prose_model_invalid");
  }
  if (
    resolvedNumber(env.LLM_RERANK_TEMPERATURE, 0) !==
    recipe.rerankTemperature
  ) {
    throw new StoryRecipeRuntimeError("rerank_temperature_invalid");
  }
  if (
    resolvedLiteral(env.LLM_RERANK_REASONING_EFFORT, "low") !==
    recipe.rerankReasoningEffort
  ) {
    throw new StoryRecipeRuntimeError("rerank_reasoning_invalid");
  }
  if (
    resolvedNumber(env.LLM_PROSE_TEMPERATURE, 0.3) !==
    recipe.storyTemperature
  ) {
    throw new StoryRecipeRuntimeError("story_temperature_invalid");
  }
  if (
    recipe.storyComposerMode !== "canonical" ||
    recipe.hybridStoryComposerEnabled !== false ||
    !composerDisabled(env.HYBRID_STORY_COMPOSER_ENABLED)
  ) {
    throw new StoryRecipeRuntimeError("composer_mode_invalid");
  }
  if (normalized(env.RETRIEVAL_MODE) !== recipe.retrievalMode) {
    throw new StoryRecipeRuntimeError("retrieval_mode_invalid");
  }
  if (
    recipe.embeddingModelId !== null &&
    !embeddingRuntimeMatches(env, recipe.embeddingModelId)
  ) {
    throw new StoryRecipeRuntimeError("embedding_runtime_invalid");
  }
}

// Endpoints, timeouts, retry posture, credentials, and persistence are
// deployment infrastructure rather than recipe axes. They stay fail-closed;
// every non-secret behavior axis comes from the selected manifest above.
function assertStoryRecipeInfrastructureRuntime(
  recipe: StoryRecipeManifest,
  env: Readonly<Record<string, string | undefined>>,
): void {
  if (!hasCredential(env.LLM_API_KEY, env.CEREBRAS_API_KEY)) {
    throw new StoryRecipeRuntimeError("llm_credentials_missing");
  }
  if (resolvedLlmBaseUrl(env) !== DEFAULT_LLM_BASE_URL) {
    throw new StoryRecipeRuntimeError("llm_endpoint_invalid");
  }
  if (
    resolvedPositiveNumber(
      env.LLM_RERANK_TIMEOUT_MS,
      DEFAULT_RERANK_TIMEOUT_MS,
    ) !== DEFAULT_RERANK_TIMEOUT_MS ||
    resolvedPositiveNumber(
      env.LLM_PROSE_TIMEOUT_MS,
      DEFAULT_PROSE_TIMEOUT_MS,
    ) !== DEFAULT_PROSE_TIMEOUT_MS
  ) {
    throw new StoryRecipeRuntimeError("llm_timeout_invalid");
  }
  if (recipe.embeddingModelId !== null) {
    const plan = embeddingPlan(recipe.embeddingModelId);
    if (plan === null || !embeddingInfrastructureMatches(env, plan)) {
      throw new StoryRecipeRuntimeError("embedding_runtime_invalid");
    }
  }
}

function selectedRecipe(
  env: Readonly<Record<string, string | undefined>>,
  production: boolean,
): StoryRecipeManifest {
  const configured = env.ONWARD_PRODUCTION_RECIPE_ID;
  if (production && (!configured || configured.trim() === "")) {
    throw new StoryRecipeRuntimeError("recipe_id_required");
  }
  const recipeId = configured?.trim() || PRIMARY_STORY_RECIPE.recipeId;
  if (!SELECTABLE_STORY_RECIPE_IDS.includes(recipeId)) {
    throw new StoryRecipeRuntimeError("recipe_not_selectable");
  }
  const recipe = recipesById.get(recipeId);
  if (!recipe || !promotionsByRecipeId.has(recipeId)) {
    throw new StoryRecipeRuntimeError("recipe_not_selectable");
  }
  return recipe;
}

function deploymentVersionFor(
  env: Readonly<Record<string, string | undefined>>,
  production: boolean,
): string {
  const explicit = env.ONWARD_DEPLOYMENT_VERSION;
  const candidate = explicit === undefined ? env.VERCEL_GIT_COMMIT_SHA : explicit;
  const value = candidate?.trim();
  if (value && DEPLOYMENT_VERSION_PATTERN.test(value)) return value;
  if (!production) return "local";
  throw new StoryRecipeRuntimeError("deployment_version_invalid");
}

function embeddingRuntimeMatches(
  env: Readonly<Record<string, string | undefined>>,
  expectedModelId: string,
): boolean {
  if (env.EMBEDDING_PROVIDER !== "gemini") return false;
  if (!hasCredential(env.EMBEDDING_API_KEY, env.GEMINI_API_KEY)) return false;
  const model = env.EMBEDDING_MODEL?.trim() || DEFAULT_EMBEDDING_MODEL;
  const rawDimension = env.EMBEDDING_DIM;
  const dimension = rawDimension?.trim()
    ? Number(rawDimension)
    : DEFAULT_EMBEDDING_DIM;
  const configuredBase =
    env.EMBEDDING_BASE_URL?.trim() ?? env.GEMINI_BASE_URL?.trim();
  const baseUrl = configuredBase
    ? configuredBase.replace(/\/+$/, "") || DEFAULT_EMBEDDING_BASE_URL
    : DEFAULT_EMBEDDING_BASE_URL;
  return (
    Number.isInteger(dimension) &&
    dimension > 0 &&
    `${model}@d${dimension}` === expectedModelId &&
    baseUrl === DEFAULT_EMBEDDING_BASE_URL &&
    resolvedPositiveNumber(
      env.EMBEDDING_TIMEOUT_MS,
      DEFAULT_EMBEDDING_TIMEOUT_MS,
    ) === DEFAULT_EMBEDDING_TIMEOUT_MS &&
    resolvedNonNegativeInteger(
      env.EMBEDDING_MAX_RETRIES,
      DEFAULT_EMBEDDING_MAX_RETRIES,
    ) === DEFAULT_EMBEDDING_MAX_RETRIES &&
    resolvedPositiveNumber(
      env.EMBEDDING_RETRY_BASE_MS,
      DEFAULT_EMBEDDING_RETRY_BASE_MS,
    ) === DEFAULT_EMBEDDING_RETRY_BASE_MS
  );
}

function embeddingInfrastructureMatches(
  env: Readonly<Record<string, string | undefined>>,
  expected: NonNullable<StoryRecipeExecutionPlan["embedding"]>,
): boolean {
  if (!hasCredential(env.EMBEDDING_API_KEY, env.GEMINI_API_KEY)) return false;
  const configuredBase =
    env.EMBEDDING_BASE_URL?.trim() ?? env.GEMINI_BASE_URL?.trim();
  const baseUrl = configuredBase
    ? configuredBase.replace(/\/+$/, "") || DEFAULT_EMBEDDING_BASE_URL
    : DEFAULT_EMBEDDING_BASE_URL;
  return (
    expected.provider === "gemini" &&
    baseUrl === DEFAULT_EMBEDDING_BASE_URL &&
    resolvedPositiveNumber(
      env.EMBEDDING_TIMEOUT_MS,
      DEFAULT_EMBEDDING_TIMEOUT_MS,
    ) === DEFAULT_EMBEDDING_TIMEOUT_MS &&
    resolvedNonNegativeInteger(
      env.EMBEDDING_MAX_RETRIES,
      DEFAULT_EMBEDDING_MAX_RETRIES,
    ) === DEFAULT_EMBEDDING_MAX_RETRIES &&
    resolvedPositiveNumber(
      env.EMBEDDING_RETRY_BASE_MS,
      DEFAULT_EMBEDDING_RETRY_BASE_MS,
    ) === DEFAULT_EMBEDDING_RETRY_BASE_MS
  );
}

function embeddingPlan(
  modelId: string | null,
): StoryRecipeExecutionPlan["embedding"] {
  if (modelId === null) return null;
  const match = /^(?<model>[a-z0-9][a-z0-9._-]{0,111})@d(?<dimension>[1-9][0-9]{0,5})$/.exec(
    modelId,
  );
  const model = match?.groups?.model;
  const dimension = Number(match?.groups?.dimension);
  if (!model || !Number.isInteger(dimension) || dimension < 1) {
    throw new StoryRecipeRuntimeError("code_identity_invalid");
  }
  return Object.freeze({ provider: "gemini", model, dimension });
}

function hasCredential(...values: Array<string | undefined>): boolean {
  return values.some((value) => Boolean(value?.trim()));
}

function resolvedLlmBaseUrl(
  env: Readonly<Record<string, string | undefined>>,
): string {
  const configured =
    env.LLM_BASE_URL?.trim() ??
    env.CEREBRAS_BASE_URL?.trim() ??
    env.GROQ_BASE_URL?.trim();
  if (!configured) return DEFAULT_LLM_BASE_URL;
  return configured.replace(/\/+$/, "") || DEFAULT_LLM_BASE_URL;
}

function composerDisabled(value: string | undefined): boolean {
  return value === undefined || value.trim().toLowerCase() === "false";
}

function resolvedLiteral(value: string | undefined, fallback: string): string {
  return value === undefined ? fallback : value;
}

function resolvedNumber(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function resolvedPositiveNumber(
  value: string | undefined,
  fallback: number,
): number {
  const resolved = resolvedNumber(value, fallback);
  return resolved > 0 ? resolved : fallback;
}

function resolvedNonNegativeInteger(
  value: string | undefined,
  fallback: number,
): number {
  const resolved = resolvedNumber(value, fallback);
  return Number.isFinite(resolved) && resolved >= 0
    ? Math.floor(resolved)
    : fallback;
}

function normalized(value: string | undefined): string | undefined {
  return value?.trim().toLowerCase();
}

function requiredRecipe(recipeId: string): StoryRecipeManifest {
  const recipe = recipesById.get(recipeId);
  if (!recipe) throw new StoryRecipeRuntimeError("registry_invalid");
  return recipe;
}

export function parseStoryRecipeRegistry(value: unknown): StoryRecipeRegistry {
  try {
    if (!isRecord(value) || !hasExactKeys(value, [
      "schemaVersion",
      "datasets",
      "selection",
      "promotions",
      "recipes",
    ])) {
      throw new Error();
    }
    if (value.schemaVersion !== STORY_RECIPE_REGISTRY_SCHEMA_VERSION) {
      throw new Error();
    }
    if (!Array.isArray(value.datasets) || value.datasets.length < 1) {
      throw new Error();
    }
    const datasets = value.datasets.map(parseDataset);
    const datasetVersions = new Set(datasets.map((dataset) => dataset.version));
    if (datasetVersions.size !== datasets.length) throw new Error();
    if (
      !isRecord(value.selection) ||
      !hasExactKeys(value.selection, [
        "primaryRecipeId",
        "rollbackRecipeId",
        "decisionId",
      ]) ||
      !registryVersionId(value.selection.primaryRecipeId) ||
      !registryVersionId(value.selection.rollbackRecipeId) ||
      !registryVersionId(value.selection.decisionId)
    ) {
      throw new Error();
    }
    const selection = value.selection;
    if (!Array.isArray(value.recipes) || value.recipes.length < 2) {
      throw new Error();
    }
    if (!Array.isArray(value.promotions) || value.promotions.length < 1) {
      throw new Error();
    }

    const recipes = value.recipes.map(parseManifest);
    const ids = new Set(recipes.map((recipe) => recipe.recipeId));
    const promotions = value.promotions.map(parsePromotion);
    const promotedIds = new Set(promotions.map((promotion) => promotion.recipeId));
    const primaryPromotion = promotions.find(
      (promotion) => promotion.recipeId === selection.primaryRecipeId,
    );
    if (
      ids.size !== recipes.length ||
      promotedIds.size !== promotions.length ||
      recipes.some((recipe) => !datasetVersions.has(recipe.datasetVersion)) ||
      promotions.some((promotion) => !ids.has(promotion.recipeId)) ||
      !ids.has(selection.primaryRecipeId as string) ||
      !ids.has(selection.rollbackRecipeId as string) ||
      !promotedIds.has(selection.primaryRecipeId as string) ||
      !promotedIds.has(selection.rollbackRecipeId as string) ||
      primaryPromotion?.decisionId !== selection.decisionId
    ) {
      throw new Error();
    }

    return deepFreeze({
      schemaVersion: STORY_RECIPE_REGISTRY_SCHEMA_VERSION,
      datasets,
      selection: {
        primaryRecipeId: selection.primaryRecipeId as string,
        rollbackRecipeId: selection.rollbackRecipeId as string,
        decisionId: selection.decisionId as string,
      },
      promotions,
      recipes,
    });
  } catch {
    throw new StoryRecipeRuntimeError("registry_invalid");
  }
}

export function parseStoryRecipeManifest(
  value: unknown,
): StoryRecipeManifest {
  try {
    return parseManifest(value);
  } catch {
    throw new StoryRecipeRuntimeError("registry_invalid");
  }
}

function parseManifest(value: unknown): StoryRecipeManifest {
  if (!isRecord(value)) throw new Error();
  if (Object.hasOwn(value, "manifestSchemaVersion")) {
    return parseManifestV2(value);
  }
  return parseManifestV1(value);
}

function parseManifestV1(
  value: Record<string, unknown>,
): StoryRecipeManifestV1 {
  if (!hasExactKeys(value, MANIFEST_V1_KEYS)) throw new Error();
  assertManifestBase(value);
  return deepFreeze({ ...value }) as unknown as StoryRecipeManifestV1;
}

function parseManifestV2(
  value: Record<string, unknown>,
): StoryRecipeManifestV2 {
  if (
    !hasExactKeys(value, MANIFEST_V2_KEYS) ||
    value.manifestSchemaVersion !== STORY_RECIPE_MANIFEST_SCHEMA_V2 ||
    value.retrievalMode !== "facetsrag" ||
    value.embeddingModelId === null ||
    !isRecord(value.facetTagger) ||
    !hasExactKeys(value.facetTagger, FACET_TAGGER_KEYS)
  ) {
    throw new Error();
  }
  assertManifestBase(value);
  const tagger = value.facetTagger;
  if (
    tagger.mode !== "closed_template" ||
    !modelId(tagger.modelId) ||
    !registryVersionId(tagger.promptVersion) ||
    tagger.temperature !== 0 ||
    !registryVersionId(tagger.reasoningEffort) ||
    tagger.timeoutMs !== 3000 ||
    !registryVersionId(tagger.signalSchemaVersion) ||
    !registryVersionId(tagger.projectionSchemaVersion) ||
    (tagger.queryMode !== "raw" &&
      tagger.queryMode !== "validated_projection") ||
    (tagger.weightingMode !== "static" &&
      tagger.weightingMode !== "bounded_dynamic") ||
    tagger.expansionEnabled !== false
  ) {
    throw new Error();
  }
  return deepFreeze({
    ...value,
    manifestSchemaVersion: STORY_RECIPE_MANIFEST_SCHEMA_V2,
    facetTagger: { ...tagger },
  }) as unknown as StoryRecipeManifestV2;
}

function assertManifestBase(value: Record<string, unknown>): void {
  if (
    !registryVersionId(value.recipeId) ||
    typeof value.manifestSha256 !== "string" ||
    !MANIFEST_HASH_PATTERN.test(value.manifestSha256) ||
    (value.retrievalMode !== "keyword" && value.retrievalMode !== "facetsrag") ||
    !registryVersionId(value.matchConfigVersion) ||
    typeof value.librarySnapshotSha256 !== "string" ||
    !MANIFEST_HASH_PATTERN.test(value.librarySnapshotSha256) ||
    !registryVersionId(value.datasetVersion) ||
    value.llmProvider !== "real" ||
    !modelId(value.rerankModelId) ||
    !modelId(value.proseModelId) ||
    (value.embeddingModelId !== null && !modelId(value.embeddingModelId)) ||
    (value.retrievalMode === "keyword" &&
      value.embeddingModelId !== null) ||
    (value.retrievalMode === "facetsrag" &&
      value.embeddingModelId === null) ||
    !registryVersionId(value.rerankPromptVersion) ||
    !registryVersionId(value.storyPromptVersion) ||
    typeof value.rerankTemperature !== "number" ||
    !Number.isFinite(value.rerankTemperature) ||
    !registryVersionId(value.rerankReasoningEffort) ||
    !Number.isInteger(value.rerankTopK) ||
    (value.rerankTopK as number) < 1 ||
    typeof value.storyTemperature !== "number" ||
    !Number.isFinite(value.storyTemperature) ||
    value.storyComposerMode !== "canonical" ||
    value.hybridStoryComposerEnabled !== false ||
    !registryVersionId(value.composerVersion) ||
    !registryVersionId(value.validatorVersion) ||
    !registryVersionId(value.storySpecSchemaVersion) ||
    !registryVersionId(value.boundaryPolicyVersion) ||
    !registryVersionId(value.resonanceBriefVersion)
  ) {
    throw new Error();
  }
}

function parsePromotion(value: unknown): StoryRecipePromotion {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ["recipeId", "decisionId", "promotedAt"]) ||
    !registryVersionId(value.recipeId) ||
    !registryVersionId(value.decisionId) ||
    !validIsoTimestamp(value.promotedAt)
  ) {
    throw new Error();
  }
  return deepFreeze({
    recipeId: value.recipeId,
    decisionId: value.decisionId,
    promotedAt: value.promotedAt,
  });
}

function parseDataset(value: unknown): StoryRecipeDataset {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ["version", "sha256", "visibility"]) ||
    !registryVersionId(value.version) ||
    typeof value.sha256 !== "string" ||
    !MANIFEST_HASH_PATTERN.test(value.sha256) ||
    (value.visibility !== "synthetic" &&
      value.visibility !== "protected_holdout")
  ) {
    throw new Error();
  }
  return deepFreeze({
    version: value.version,
    sha256: value.sha256,
    visibility: value.visibility,
  });
}

export function assertStoryRecipeCodeIdentity(
  recipe: StoryRecipeManifest,
): void {
  if (
    isStoryRecipeManifestV2(recipe) ||
    recipe.matchConfigVersion !== MATCH_CONFIG_IMPLEMENTATION_VERSION ||
    recipe.librarySnapshotSha256 !== LIBRARY_SNAPSHOT_SHA256 ||
    recipe.rerankPromptVersion !== RERANK_PROMPT_VERSION ||
    !isSupportedStoryPromptVersion(recipe.storyPromptVersion) ||
    recipe.composerVersion !== STORY_COMPOSER_VERSION ||
    recipe.validatorVersion !== STORY_ARTIFACT_VALIDATOR_VERSION ||
    recipe.storySpecSchemaVersion !== STORY_SPEC_SCHEMA_VERSION ||
    recipe.boundaryPolicyVersion !== STORY_BOUNDARY_POLICY_VERSION ||
    recipe.resonanceBriefVersion !== RESONANCE_BRIEF_VERSION
  ) {
    throw new StoryRecipeRuntimeError("code_identity_invalid");
  }
}

export function isStoryRecipeManifestV2(
  recipe: StoryRecipeManifest,
): recipe is StoryRecipeManifestV2 {
  return recipe.manifestSchemaVersion === STORY_RECIPE_MANIFEST_SCHEMA_V2;
}

function validIsoTimestamp(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value;
}

function registryVersionId(value: unknown): value is string {
  return typeof value === "string" && REGISTRY_VERSION_ID_PATTERN.test(value);
}

function modelId(value: unknown): value is string {
  return typeof value === "string" && MODEL_ID_PATTERN.test(value);
}

function hasExactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  return Object.keys(value).sort().join("\u0000") ===
    [...keys].sort().join("\u0000");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach((entry) =>
      deepFreeze(entry),
    );
    Object.freeze(value);
  }
  return value;
}
