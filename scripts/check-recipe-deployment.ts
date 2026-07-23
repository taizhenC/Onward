import "./_smoke-bootstrap";
import { createHash } from "node:crypto";
import {
  PRIMARY_STORY_RECIPE,
  ROLLBACK_STORY_RECIPE,
  StoryRecipeRuntimeError,
  assertProductionStoryRecipeRuntime,
  getStoryRecipeById,
  getStoryRecipePromotion,
  productionStoryRecipeExecutionPlan,
  storyRecipeExecutionPlan,
} from "../lib/story-recipe";
import { registrationMatches } from "../lib/story-recipe-registration";
import { activeRecipe } from "../lib/llm";
import { isEmbeddingStub } from "../lib/embeddings";
import { resolveRetrievalMode } from "../lib/matching";
import { hybridStoryComposerEnabled } from "../lib/story-composer";
import {
  FACET_TAGGER_PROMPT_CONTRACT,
  RERANK_PROMPT_CONTRACT,
  STORY_PROMPT_CONTRACT,
  canonicalPromptContract,
} from "../lib/llm-prompts";
import { sha256Hex } from "../lib/sha256-edge";

type Environment = Record<string, string | undefined>;

const DEPLOYMENT_ID = "deploy_check_2026-07-18";

function productionEnvironment(recipeId = PRIMARY_STORY_RECIPE.recipeId): Environment {
  return {
    NODE_ENV: "production",
    PERSISTENCE: "supabase",
    CEREBRAS_API_KEY: "secret-sentinel",
    ONWARD_PRODUCTION_RECIPE_ID: recipeId,
    ONWARD_DEPLOYMENT_VERSION: DEPLOYMENT_ID,
  };
}

function expectFailure(
  name: string,
  mutate: (env: Environment) => void,
  expectedCode: StoryRecipeRuntimeError["code"],
): void {
  const env = productionEnvironment();
  mutate(env);
  try {
    assertProductionStoryRecipeRuntime(env);
    throw new Error(`${name} unexpectedly passed`);
  } catch (error) {
    if (!(error instanceof StoryRecipeRuntimeError)) throw error;
    if (error.code !== expectedCode) {
      throw new Error(`${name} failed with ${error.code}, expected ${expectedCode}`);
    }
    if (
      error.message.includes("unapproved-sentinel") ||
      error.message.includes("secret-sentinel")
    ) {
      throw new Error(`${name} leaked untrusted configuration into its error`);
    }
  }
}

function main(): void {
  for (const contract of [
    RERANK_PROMPT_CONTRACT,
    STORY_PROMPT_CONTRACT,
    FACET_TAGGER_PROMPT_CONTRACT,
  ]) {
    const canonical = canonicalPromptContract(contract);
    if (
      sha256Hex(canonical) !==
      createHash("sha256").update(canonical).digest("hex")
    ) {
      throw new Error("the edge-safe prompt identity hash is not SHA-256");
    }
  }
  const runtime = assertProductionStoryRecipeRuntime(productionEnvironment());
  const selectedPlan = productionStoryRecipeExecutionPlan(
    productionEnvironment(),
  );
  if (
    !runtime.production ||
    runtime.recipe.recipeId !== PRIMARY_STORY_RECIPE.recipeId ||
    runtime.recipe.retrievalMode !== "keyword" ||
    runtime.recipe.embeddingModelId !== null ||
    runtime.deploymentVersion !== DEPLOYMENT_ID ||
    selectedPlan?.llmProvider !== "real" ||
    selectedPlan.rerankModelId !== "gpt-oss-120b" ||
    selectedPlan.proseModelId !== "gpt-oss-120b" ||
    selectedPlan.retrievalMode !== "keyword" ||
    selectedPlan.rerankTopK !== 6 ||
    selectedPlan.embedding !== null ||
    selectedPlan.hybridStoryComposerEnabled !== false
  ) {
    throw new Error("the approved production recipe did not resolve exactly");
  }

  const promotion = getStoryRecipePromotion(runtime.recipe.recipeId);
  if (!promotion) throw new Error("the selected recipe promotion is missing");
  const registeredRow = {
    recipe_id: runtime.recipe.recipeId,
    manifest_sha256: runtime.recipe.manifestSha256,
    dataset_version: runtime.recipe.datasetVersion,
    match_config_version: runtime.recipe.matchConfigVersion,
    library_snapshot_sha256: runtime.recipe.librarySnapshotSha256,
    retrieval_mode: runtime.recipe.retrievalMode,
    llm_provider: runtime.recipe.llmProvider,
    rerank_model_id: runtime.recipe.rerankModelId,
    prose_model_id: runtime.recipe.proseModelId,
    embedding_model_id: runtime.recipe.embeddingModelId,
    rerank_prompt_version: runtime.recipe.rerankPromptVersion,
    story_prompt_version: runtime.recipe.storyPromptVersion,
    rerank_temperature: String(runtime.recipe.rerankTemperature),
    rerank_reasoning_effort: runtime.recipe.rerankReasoningEffort,
    rerank_top_k: runtime.recipe.rerankTopK,
    story_temperature: String(runtime.recipe.storyTemperature),
    story_composer_mode: runtime.recipe.storyComposerMode,
    hybrid_story_composer_enabled: runtime.recipe.hybridStoryComposerEnabled,
    composer_version: runtime.recipe.composerVersion,
    validator_version: runtime.recipe.validatorVersion,
    story_spec_schema_version: runtime.recipe.storySpecSchemaVersion,
    boundary_policy_version: runtime.recipe.boundaryPolicyVersion,
    resonance_brief_version: runtime.recipe.resonanceBriefVersion,
    decision_id: promotion.decisionId,
    promoted_at: promotion.promotedAt.replace("Z", "+00:00"),
  };
  if (!registrationMatches(registeredRow, runtime.recipe, promotion)) {
    throw new Error("the exact live recipe registration was rejected");
  }
  if (
    registrationMatches(
      { ...registeredRow, decision_id: "rd_unapproved" },
      runtime.recipe,
      promotion,
    )
  ) {
    throw new Error("a drifted live recipe registration was accepted");
  }
  if (
    registrationMatches(
      { ...registeredRow, rerank_temperature: null },
      runtime.recipe,
      promotion,
    )
  ) {
    throw new Error("a malformed numeric recipe registration was accepted");
  }

  // The rollback target is precompiled and selectable through the same single
  // environment control. It intentionally equals the baseline until a later,
  // evidence-backed promotion names this recipe as the old primary.
  const rollback = assertProductionStoryRecipeRuntime(
    productionEnvironment(ROLLBACK_STORY_RECIPE.recipeId),
  );
  if (rollback.recipe.recipeId !== ROLLBACK_STORY_RECIPE.recipeId) {
    throw new Error("the configured rollback recipe did not resolve");
  }

  const challenger = getStoryRecipeById(
    "facetsrag-rerank-figure-library-50-2026-07-02",
  );
  if (!challenger) throw new Error("the challenger execution fixture is missing");
  const primaryPlan = storyRecipeExecutionPlan(runtime.recipe);
  const challengerPlan = storyRecipeExecutionPlan(challenger);
  if (
    primaryPlan.retrievalMode !== "keyword" ||
    primaryPlan.rerankTopK !== 6 ||
    primaryPlan.embedding !== null ||
    challengerPlan.retrievalMode !== "facetsrag" ||
    challengerPlan.rerankTopK !== 8 ||
    challengerPlan.embedding?.provider !== "gemini" ||
    challengerPlan.embedding.model !== "gemini-embedding-001" ||
    challengerPlan.embedding.dimension !== 1536
  ) {
    throw new Error("recipe-specific execution plans did not preserve retrieval/top-K");
  }

  const vercel = productionEnvironment();
  delete vercel.ONWARD_DEPLOYMENT_VERSION;
  vercel.VERCEL_GIT_COMMIT_SHA = "abcdef0123456789";
  if (
    assertProductionStoryRecipeRuntime(vercel).deploymentVersion !==
    "abcdef0123456789"
  ) {
    throw new Error("Vercel deployment identity did not resolve");
  }

  const local = assertProductionStoryRecipeRuntime({ NODE_ENV: "development" });
  if (
    local.production ||
    local.recipe.recipeId !== PRIMARY_STORY_RECIPE.recipeId ||
    local.deploymentVersion !== "local"
  ) {
    throw new Error("local development did not use the safe baseline default");
  }

  expectFailure(
    "missing recipe id",
    (env) => delete env.ONWARD_PRODUCTION_RECIPE_ID,
    "recipe_id_required",
  );
  expectFailure(
    "unknown recipe",
    (env) => {
      env.ONWARD_PRODUCTION_RECIPE_ID = "unapproved-sentinel";
    },
    "recipe_not_selectable",
  );
  const stale = productionEnvironment();
  Object.assign(stale, {
    LLM_PROVIDER: "stub",
    LLM_MODEL_RERANK: "unapproved-sentinel",
    LLM_MODEL_PROSE: "unapproved-sentinel",
    LLM_RERANK_TEMPERATURE: "0.9",
    LLM_RERANK_REASONING_EFFORT: "high",
    LLM_PROSE_TEMPERATURE: "0.9",
    HYBRID_STORY_COMPOSER_ENABLED: "true",
    RETRIEVAL_MODE: "auto",
    EMBEDDING_PROVIDER: "gemini",
    EMBEDDING_MODEL: "unapproved-sentinel",
    EMBEDDING_DIM: "7",
  });
  const staleRuntime = assertProductionStoryRecipeRuntime(stale);
  const stalePlan = productionStoryRecipeExecutionPlan(stale);
  if (
    staleRuntime.recipe.recipeId !== PRIMARY_STORY_RECIPE.recipeId ||
    JSON.stringify(stalePlan) !== JSON.stringify(selectedPlan)
  ) {
    throw new Error("stale non-secret environment values changed the recipe");
  }
  withProcessEnvironment(stale, () => {
    const active = activeRecipe();
    if (
      active.llmProvider !== "real" ||
      active.rerankModelId !== selectedPlan.rerankModelId ||
      active.proseModelId !== selectedPlan.proseModelId ||
      resolveRetrievalMode() !== selectedPlan.retrievalMode ||
      hybridStoryComposerEnabled() !== false ||
      !isEmbeddingStub()
    ) {
      throw new Error("a production execution boundary bypassed the recipe selector");
    }
  });
  expectFailure(
    "missing LLM credential",
    (env) => {
      delete env.CEREBRAS_API_KEY;
    },
    "llm_credentials_missing",
  );
  expectFailure(
    "unapproved LLM endpoint",
    (env) => {
      env.LLM_BASE_URL = "https://unapproved-sentinel.invalid/v1";
    },
    "llm_endpoint_invalid",
  );
  expectFailure(
    "rerank timeout drift",
    (env) => {
      env.LLM_RERANK_TIMEOUT_MS = "1";
    },
    "llm_timeout_invalid",
  );
  expectFailure(
    "prose timeout drift",
    (env) => {
      env.LLM_PROSE_TIMEOUT_MS = "1";
    },
    "llm_timeout_invalid",
  );
  expectFailure(
    "unsafe persistence",
    (env) => {
      env.PERSISTENCE = "memory";
    },
    "persistence_invalid",
  );
  expectFailure(
    "missing deployment identity",
    (env) => delete env.ONWARD_DEPLOYMENT_VERSION,
    "deployment_version_invalid",
  );
  expectFailure(
    "unsafe deployment identity",
    (env) => {
      env.ONWARD_DEPLOYMENT_VERSION = "secret-sentinel value";
    },
    "deployment_version_invalid",
  );

  console.log(
    `Recipe deployment check passed (${PRIMARY_STORY_RECIPE.recipeId}; compatible rollback is one selector change).`,
  );
}

function withProcessEnvironment(
  env: Environment,
  run: () => void,
): void {
  const keys = [
    "NODE_ENV",
    "PERSISTENCE",
    "CEREBRAS_API_KEY",
    "LLM_PROVIDER",
    "LLM_MODEL_RERANK",
    "LLM_MODEL_PROSE",
    "LLM_RERANK_TEMPERATURE",
    "LLM_RERANK_REASONING_EFFORT",
    "LLM_PROSE_TEMPERATURE",
    "HYBRID_STORY_COMPOSER_ENABLED",
    "RETRIEVAL_MODE",
    "EMBEDDING_PROVIDER",
    "EMBEDDING_MODEL",
    "EMBEDDING_DIM",
    "ONWARD_PRODUCTION_RECIPE_ID",
    "ONWARD_DEPLOYMENT_VERSION",
  ] as const;
  const previous = new Map(keys.map((key) => [key, process.env[key]]));
  try {
    for (const key of keys) {
      const value = env[key];
      if (value === undefined) Reflect.deleteProperty(process.env, key);
      else Reflect.set(process.env, key, value);
    }
    run();
  } finally {
    for (const key of keys) {
      const value = previous.get(key);
      if (value === undefined) Reflect.deleteProperty(process.env, key);
      else Reflect.set(process.env, key, value);
    }
  }
}

main();
