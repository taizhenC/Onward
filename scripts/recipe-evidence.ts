import { createHash } from "node:crypto";
import {
  mkdirSync,
  readFileSync,
  writeFileSync,
  type WriteFileOptions,
} from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { RERANK_TRUST_GATE } from "../lib/match-recipe-constants";

export const RECIPE_REGISTRY_SCHEMA_VERSION = "story-recipe-registry-v1";
export const STORY_RECIPE_MANIFEST_SCHEMA_V2 =
  "story-recipe-manifest-v2";
export const EVAL_EVIDENCE_SCHEMA_VERSION = "match-eval-evidence-v1";
export const SHADOW_EVIDENCE_SCHEMA_VERSION = "recipe-shadow-evidence-v1";
export const RECIPE_DECISION_SCHEMA_VERSION = "recipe-decision-v1";
// v3 (2026-08): multi-gold accept[] scoring, load-time enforcement of the semantic-slice
// zero-keyword claim, and slice-split reporting in scripts/eval-match.ts. Evidence imported
// from the July pre-registry runs was produced by v2 and stays pinned to it —
// check-recipe-governance accepts the legacy version only on legacyImported records.
export const EVAL_HARNESS_VERSION = "match-eval-harness-v3-2026-08";
export const LEGACY_EVAL_HARNESS_VERSION = "match-eval-harness-v2-2026-07";
// Promotion policy is code-owned and immutable for a given release. Evidence may
// record these values for auditability, but it cannot choose weaker thresholds.
// Changing any floor is a policy release, not an eval-run option.
export const RECIPE_PROMOTION_POLICY = {
  trustGate: RERANK_TRUST_GATE,
  minIndependentEvidenceRunsPerRecipe: 2,
  minKPerEvidence: 2,
  minNonMissCasesPerEvidence: 95,
  minMissCasesPerEvidence: 3,
  minHardCasesPerEvidence: 40,
  minStability: 0.95,
  maxP95LatencyMs: 15_000,
  superiorityConfidenceZ: 1.96,
} as const;

export const RECIPE_REGISTRY_PATH = resolve(
  process.cwd(),
  "config/story-recipes.json",
);
export const EVAL_HISTORY_DIR = resolve(process.cwd(), "evals/history");
export const EVAL_SHADOW_DIR = resolve(process.cwd(), "evals/shadow");
export const RECIPE_DECISIONS_DIR = resolve(
  process.cwd(),
  "config/recipe-decisions",
);
export const PRODUCTION_RECIPE_DOC_PATH = resolve(
  process.cwd(),
  "docs/production-recipe.md",
);

export type DatasetVisibility = "synthetic" | "protected_holdout";
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

type StoryRecipeManifestBase = {
  recipeId: string;
  manifestSha256: string;
  retrievalMode: "keyword" | "facetsrag";
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
};

export type StoryRecipeManifestV1 = StoryRecipeManifestBase & {
  manifestSchemaVersion?: never;
  facetTagger?: never;
};

export type ClosedTemplateFacetTaggerRecipe = {
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
};

export type StoryRecipeManifestV2 = StoryRecipeManifestBase & {
  manifestSchemaVersion: typeof STORY_RECIPE_MANIFEST_SCHEMA_V2;
  facetTagger: ClosedTemplateFacetTaggerRecipe;
};

export type StoryRecipeManifest =
  | StoryRecipeManifestV1
  | StoryRecipeManifestV2;

export type StoryRecipeRegistry = {
  schemaVersion: typeof RECIPE_REGISTRY_SCHEMA_VERSION;
  datasets: Array<{
    version: string;
    sha256: string;
    visibility: DatasetVisibility;
  }>;
  selection: {
    primaryRecipeId: string;
    rollbackRecipeId: string;
    decisionId: string;
  };
  promotions: Array<{
    recipeId: string;
    decisionId: string;
    promotedAt: string;
  }>;
  recipes: StoryRecipeManifest[];
};

export type EvidenceMetrics = {
  rerankTop1: number | null;
  overallTop1: number | null;
  missDetection: number | null;
  hardConfusion: number | null;
  goldSurvivalStageA: number | null;
  goldSurvivalStageB: number | null;
  stability: number | null;
  counts: {
    rerankCorrect: number;
    rerankTotal: number;
    overallCorrect: number;
    overallTotal: number;
    missDetected: number;
    missTotal: number;
    hardConfused: number;
    hardTotal: number;
    survivedStageA: number;
    survivedStageB: number;
    survivalTotal: number;
    rerankChosen: number;
    keywordFallback: number;
  };
  calibration: {
    definitiveCorrect: number;
    definitiveWrong: number;
    partialCorrect: number;
    partialWrong: number;
  };
  latency: {
    p50Ms: number;
    p95Ms: number;
  };
  trustGate: {
    passed: boolean;
    coverage: number | null;
    checks: {
      coverage: boolean;
      rerankTop1: boolean;
      missDetection: boolean;
      noDefinitiveWrong: boolean;
      top1: boolean;
      hardConfusion: boolean;
    };
    thresholds: {
      minCoverage: number;
      minRerankTop1: number;
      minOverallTop1: number;
      minMissDetection: number;
      maxDefinitiveWrong: number;
      maxHardConfusion: number;
    };
  };
};

export type EvalEvidence = {
  schemaVersion: typeof EVAL_EVIDENCE_SCHEMA_VERSION;
  harnessVersion: typeof EVAL_HARNESS_VERSION | typeof LEGACY_EVAL_HARNESS_VERSION;
  evidenceId: string;
  recipeId: string;
  recipeManifestSha256: string;
  dataset: {
    version: string;
    sha256: string;
    visibility: DatasetVisibility;
  };
  // Added after the legacy July import. New evidence always carries this key:
  // null for ordinary/local runs, or the exact production-eligible catalog
  // snapshot used by a protected promotion run.
  catalog?: {
    sha256: string;
    eligibleStageCount: number;
    source: "supabase_published_story_specs";
  } | null;
  run: {
    startedAt: string;
    completedAt: string;
    k: number;
    concurrency: number;
    maxRetries: number;
    caseCount: number;
    trialCount: number;
  };
  config: {
    provider: "stub" | "real";
    model: string;
    retrievalMode: "keyword" | "facetsrag";
    embeddingModelId: string | null;
    matchConfigVersion: string;
    rerankTemperature: number;
    rerankReasoningEffort: string;
    rerankTopK: number;
  };
  metrics: EvidenceMetrics;
  provenance: {
    gitCommit: string | null;
    deploymentId: string | null;
    sourceRun: string | null;
    // Present on every non-legacy candidate. These values are claims, not
    // promotion authority: the locked base-branch attestor independently
    // verifies/binds them before a selector change can merge.
    runId?: string | null;
    sourceRunSha256?: string | null;
    inputTreeSha256?: string | null;
  };
  legacyImported: boolean;
  candidate?: boolean;
  promotable: boolean;
};

export type ShadowEvidence = {
  schemaVersion: typeof SHADOW_EVIDENCE_SCHEMA_VERSION;
  shadowId: string;
  dataset: {
    version: string;
    sha256: string;
    visibility: DatasetVisibility;
  };
  createdAt: string;
  source: "offline_aggregate_import" | "offline_paired_holdout";
  baselineEvidenceId: string;
  challengerEvidenceId: string;
  comparison: {
    overallTop1Delta: number;
    hardConfusionDelta: number;
    definitiveWrongDelta: number;
    missDetectionDelta: number;
    coverageDelta: number;
  };
  outputsServedToUsers: false;
  disclosuresPersisted: false;
  gate: {
    passed: boolean;
    checks: {
      sameDataset: boolean;
      strictTop1Superiority: boolean;
      trustGatePassed: boolean;
      noDefinitiveWrong: boolean;
      hardConfusionNoWorse: boolean;
      missDetectionNoWorse: boolean;
      coverageNoWorse: boolean;
    };
  };
  provenance?: {
    gitCommit: string;
    deploymentId: string;
    shadowRunId: string;
    sourceRunSha256: string;
    inputTreeSha256: string;
  };
  legacyImported: boolean;
  candidate?: boolean;
  promotable: boolean;
};

export type RecipeApproval = {
  role: "product" | "matching" | "safety_privacy";
  reviewerId: string;
  approvedAt: string;
};

export type RecipeDecision = {
  schemaVersion: typeof RECIPE_DECISION_SCHEMA_VERSION;
  decisionId: string;
  decisionType: "retain_baseline" | "promote_challenger";
  dataset: {
    version: string;
    sha256: string;
    visibility: DatasetVisibility;
  };
  decidedAt: string;
  fromRecipeId: string;
  toRecipeId: string;
  challengerRecipeId: string;
  rollbackRecipeId: string;
  baselineEvidenceIds: string[];
  challengerEvidenceIds: string[];
  shadowEvidenceIds: string[];
  promotionAuthorized: boolean;
  rationaleCodes: string[];
  approvals: RecipeApproval[];
};

export function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

function canonicalize(value: unknown): JsonValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("canonical JSON rejects non-finite numbers");
    return value;
  }
  if (Array.isArray(value)) return value.map(canonicalize);
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const result: JsonObject = {};
    for (const key of Object.keys(record).sort()) {
      const entry = record[key];
      if (entry === undefined) throw new Error(`canonical JSON rejects undefined at ${key}`);
      result[key] = canonicalize(entry);
    }
    return result;
  }
  throw new Error(`canonical JSON rejects ${typeof value}`);
}

export function sha256Text(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function sha256File(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

export function contentId(
  prefix: "ev" | "sh" | "rd",
  value: Record<string, unknown>,
  idKey: "evidenceId" | "shadowId" | "decisionId",
): string {
  const payload = { ...value };
  delete payload[idKey];
  return `${prefix}_${sha256Text(canonicalJson(payload))}`;
}

export function manifestSha256(recipe: StoryRecipeManifest): string {
  const payload = { ...recipe } as Record<string, unknown>;
  delete payload.manifestSha256;
  return sha256Text(canonicalJson(payload));
}

export function loadRecipeRegistry(
  path = RECIPE_REGISTRY_PATH,
): StoryRecipeRegistry {
  return JSON.parse(readFileSync(path, "utf8")) as StoryRecipeRegistry;
}

export function recipeForEval(
  registry: StoryRecipeRegistry,
  retrievalMode: "keyword" | "facetsrag",
  explicitRecipeId = process.env.EVAL_RECIPE_ID?.trim(),
): StoryRecipeManifest {
  if (explicitRecipeId) {
    const recipe = registry.recipes.find((entry) => entry.recipeId === explicitRecipeId);
    if (!recipe) throw new Error(`EVAL_RECIPE_ID ${explicitRecipeId} is not registered`);
    if (recipe.retrievalMode !== retrievalMode) {
      throw new Error(
        `EVAL_RECIPE_ID ${explicitRecipeId} uses ${recipe.retrievalMode}, not ${retrievalMode}`,
      );
    }
    return requireEvalSupportedRecipe(recipe);
  }
  const matches = registry.recipes.filter(
    (entry) => entry.retrievalMode === retrievalMode,
  );
  if (matches.length !== 1) {
    throw new Error(
      `Set EVAL_RECIPE_ID; ${matches.length} recipes use retrievalMode=${retrievalMode}`,
    );
  }
  return requireEvalSupportedRecipe(matches[0]);
}

function requireEvalSupportedRecipe(
  recipe: StoryRecipeManifest,
): StoryRecipeManifestV1 {
  if (
    recipe.manifestSchemaVersion ===
    STORY_RECIPE_MANIFEST_SCHEMA_V2
  ) {
    throw new Error(
      `Recipe ${recipe.recipeId} uses manifest v2, but v2 execution support is not installed`,
    );
  }
  return recipe;
}

export function datasetForRecipe(
  registry: StoryRecipeRegistry,
  recipe: Pick<StoryRecipeManifest, "datasetVersion" | "recipeId">,
): StoryRecipeRegistry["datasets"][number] {
  const dataset = registry.datasets.find(
    (entry) => entry.version === recipe.datasetVersion,
  );
  if (!dataset) {
    throw new Error(
      `recipe ${recipe.recipeId} references unknown dataset ${recipe.datasetVersion}`,
    );
  }
  return dataset;
}

export function datasetForEval(
  registry: StoryRecipeRegistry,
  recipe: Pick<StoryRecipeManifest, "datasetVersion" | "recipeId">,
  explicitVersion = process.env.EVAL_DATASET_VERSION?.trim(),
): StoryRecipeRegistry["datasets"][number] {
  // `datasetVersion` is the recipe's immutable default and remains
  // release-bound for selector-only rollback compatibility. A protected
  // promotion run explicitly overrides it so the unchanged baseline and
  // challenger are evaluated on the same decision-bound holdout.
  const version = explicitVersion || recipe.datasetVersion;
  const dataset = registry.datasets.find((entry) => entry.version === version);
  if (!dataset) {
    throw new Error(
      `eval dataset ${version} is not registered for recipe ${recipe.recipeId}`,
    );
  }
  return dataset;
}

export function evidenceMetricsFromRun(metrics: Record<string, unknown>): EvidenceMetrics {
  const counts = metrics as {
    rerankTop1?: unknown;
    overallTop1?: unknown;
    missDetection?: unknown;
    hardConfusion?: unknown;
    goldSurvivalStageA?: unknown;
    goldSurvivalStageB?: unknown;
    stability?: unknown;
    rerankTop1Counts?: { correct?: unknown; total?: unknown };
    overallTop1Counts?: { correct?: unknown; total?: unknown };
    missDetectionCounts?: { detected?: unknown; total?: unknown };
    hardConfusionCounts?: { confused?: unknown; total?: unknown };
    goldSurvivalCounts?: { survivedA?: unknown; survivedB?: unknown; total?: unknown };
    chosenBy?: { rerank?: unknown; keyword_fallback?: unknown };
    calibration?: Record<string, unknown>;
    latencyP50?: unknown;
    latencyP95?: unknown;
    trustGate?: Record<string, unknown>;
  };
  const calibration = counts.calibration ?? {};
  const trustGate = counts.trustGate ?? {};
  const checks = asRecord(trustGate.checks, "metrics.trustGate.checks");
  const thresholds = asRecord(
    trustGate.thresholds,
    "metrics.trustGate.thresholds",
  );
  const recordedThresholds = {
    minCoverage: requiredNumber(thresholds.minCoverage, "thresholds.minCoverage"),
    minRerankTop1: requiredNumber(
      thresholds.minRerankTop1,
      "thresholds.minRerankTop1",
    ),
    minOverallTop1: requiredNumber(
      thresholds.minOverallTop1,
      "thresholds.minOverallTop1",
    ),
    minMissDetection: requiredNumber(
      thresholds.minMissDetection,
      "thresholds.minMissDetection",
    ),
    maxDefinitiveWrong: requiredNumber(
      thresholds.maxDefinitiveWrong,
      "thresholds.maxDefinitiveWrong",
    ),
    maxHardConfusion: requiredNumber(
      thresholds.maxHardConfusion,
      "thresholds.maxHardConfusion",
    ),
  };
  if (
    canonicalJson(recordedThresholds) !==
    canonicalJson(RECIPE_PROMOTION_POLICY.trustGate)
  ) {
    throw new Error(
      "metrics trust thresholds differ from the immutable recipe-promotion policy",
    );
  }
  return {
    rerankTop1: nullableNumber(counts.rerankTop1, "metrics.rerankTop1"),
    overallTop1: nullableNumber(counts.overallTop1, "metrics.overallTop1"),
    missDetection: nullableNumber(counts.missDetection, "metrics.missDetection"),
    hardConfusion: nullableNumber(counts.hardConfusion, "metrics.hardConfusion"),
    goldSurvivalStageA: nullableNumber(
      counts.goldSurvivalStageA,
      "metrics.goldSurvivalStageA",
    ),
    goldSurvivalStageB: nullableNumber(
      counts.goldSurvivalStageB,
      "metrics.goldSurvivalStageB",
    ),
    stability: nullableNumber(counts.stability, "metrics.stability"),
    counts: {
      rerankCorrect: requiredNumber(counts.rerankTop1Counts?.correct, "rerankCorrect"),
      rerankTotal: requiredNumber(counts.rerankTop1Counts?.total, "rerankTotal"),
      overallCorrect: requiredNumber(counts.overallTop1Counts?.correct, "overallCorrect"),
      overallTotal: requiredNumber(counts.overallTop1Counts?.total, "overallTotal"),
      missDetected: requiredNumber(counts.missDetectionCounts?.detected, "missDetected"),
      missTotal: requiredNumber(counts.missDetectionCounts?.total, "missTotal"),
      hardConfused: requiredNumber(counts.hardConfusionCounts?.confused, "hardConfused"),
      hardTotal: requiredNumber(counts.hardConfusionCounts?.total, "hardTotal"),
      survivedStageA: requiredNumber(counts.goldSurvivalCounts?.survivedA, "survivedStageA"),
      survivedStageB: requiredNumber(counts.goldSurvivalCounts?.survivedB, "survivedStageB"),
      survivalTotal: requiredNumber(counts.goldSurvivalCounts?.total, "survivalTotal"),
      rerankChosen: requiredNumber(counts.chosenBy?.rerank, "rerankChosen"),
      keywordFallback: requiredNumber(
        counts.chosenBy?.keyword_fallback,
        "keywordFallback",
      ),
    },
    calibration: {
      definitiveCorrect: requiredNumber(calibration.definitiveCorrect, "definitiveCorrect"),
      definitiveWrong: requiredNumber(calibration.definitiveWrong, "definitiveWrong"),
      partialCorrect: requiredNumber(calibration.partialCorrect, "partialCorrect"),
      partialWrong: requiredNumber(calibration.partialWrong, "partialWrong"),
    },
    latency: {
      p50Ms: requiredNumber(counts.latencyP50, "latencyP50"),
      p95Ms: requiredNumber(counts.latencyP95, "latencyP95"),
    },
    trustGate: {
      passed: requiredBoolean(trustGate.passed, "trustGate.passed"),
      coverage: nullableNumber(trustGate.coverage, "trustGate.coverage"),
      checks: {
        coverage: requiredBoolean(checks.coverage, "checks.coverage"),
        rerankTop1: requiredBoolean(checks.rerankTop1, "checks.rerankTop1"),
        missDetection: requiredBoolean(checks.missDetection, "checks.missDetection"),
        noDefinitiveWrong: requiredBoolean(
          checks.noDefinitiveWrong,
          "checks.noDefinitiveWrong",
        ),
        top1: requiredBoolean(checks.top1, "checks.top1"),
        hardConfusion: requiredBoolean(checks.hardConfusion, "checks.hardConfusion"),
      },
      thresholds: recordedThresholds,
    },
  };
}

export function createEvalEvidence(
  input: Omit<EvalEvidence, "schemaVersion" | "harnessVersion" | "evidenceId">,
): EvalEvidence {
  const candidate = {
    schemaVersion: EVAL_EVIDENCE_SCHEMA_VERSION,
    harnessVersion: EVAL_HARNESS_VERSION,
    evidenceId: "",
    ...input,
  } satisfies EvalEvidence;
  return {
    ...candidate,
    evidenceId: contentId(
      "ev",
      candidate as unknown as Record<string, unknown>,
      "evidenceId",
    ),
  };
}

export function createShadowEvidence(
  input: Omit<ShadowEvidence, "schemaVersion" | "shadowId">,
): ShadowEvidence {
  const candidate = {
    schemaVersion: SHADOW_EVIDENCE_SCHEMA_VERSION,
    shadowId: "",
    ...input,
  } satisfies ShadowEvidence;
  return {
    ...candidate,
    shadowId: contentId(
      "sh",
      candidate as unknown as Record<string, unknown>,
      "shadowId",
    ),
  };
}

export function createRecipeDecision(
  input: Omit<RecipeDecision, "schemaVersion" | "decisionId">,
): RecipeDecision {
  const candidate = {
    schemaVersion: RECIPE_DECISION_SCHEMA_VERSION,
    decisionId: "",
    ...input,
  } satisfies RecipeDecision;
  return {
    ...candidate,
    decisionId: contentId(
      "rd",
      candidate as unknown as Record<string, unknown>,
      "decisionId",
    ),
  };
}

export function writeEvalEvidence(evidence: EvalEvidence): string {
  const directory = resolve(
    EVAL_HISTORY_DIR,
    evidence.dataset.version,
    evidence.recipeId,
  );
  mkdirSync(directory, { recursive: true });
  const path = resolve(directory, `${evidence.evidenceId}.json`);
  writeJsonExclusive(path, evidence);
  return path;
}

function writeJsonExclusive(path: string, value: unknown): void {
  const options: WriteFileOptions = { encoding: "utf8", flag: "wx" };
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, options);
}

export function currentGitCommit(): string | null {
  const result = spawnSync("git", ["rev-parse", "HEAD"], {
    cwd: process.cwd(),
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.status !== 0) return null;
  const value = result.stdout.trim();
  return value || null;
}

export function currentDeploymentId(): string | null {
  return (
    [
      process.env.RECIPE_EVAL_DEPLOYMENT_ID,
      process.env.VERCEL_DEPLOYMENT_ID,
    ]
      .map((value) => value?.trim())
      .find((value): value is string => Boolean(value)) ?? null
  );
}

export function currentEvalRunId(): string | null {
  const explicit = process.env.RECIPE_EVAL_RUN_ID?.trim();
  if (explicit) return explicit;
  const runId = process.env.GITHUB_RUN_ID?.trim();
  const attempt = process.env.GITHUB_RUN_ATTEMPT?.trim();
  const job = process.env.GITHUB_JOB?.trim();
  return runId && attempt && job ? `${runId}:${attempt}:${job}` : null;
}

export function gitInputTreeSha256(commit = "HEAD"): string | null {
  const result = spawnSync(
    "git",
    ["ls-tree", "-r", "--full-tree", commit],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      windowsHide: true,
    },
  );
  return result.status === 0 ? sha256Text(result.stdout) : null;
}

export function renderProductionRecipeDoc(
  registry: StoryRecipeRegistry,
): string {
  const primary = registry.recipes.find(
    (recipe) => recipe.recipeId === registry.selection.primaryRecipeId,
  );
  const rollback = registry.recipes.find(
    (recipe) => recipe.recipeId === registry.selection.rollbackRecipeId,
  );
  if (!primary || !rollback) throw new Error("registry selection references missing recipe");
  const primaryPromotion = registry.promotions.find(
    (promotion) => promotion.recipeId === primary.recipeId,
  );
  if (!primaryPromotion) throw new Error("primary recipe is not promoted");
  const primaryDataset = datasetForRecipe(registry, primary);
  const rows = registry.recipes
    .map(
      (recipe) =>
        `| \`${recipe.recipeId}\` | \`${recipe.datasetVersion}\` | ${recipe.retrievalMode} | ${recipe.llmProvider} / \`${recipe.rerankModelId}\` | ${recipe.embeddingModelId ? `\`${recipe.embeddingModelId}\`` : "Not used"} | ${recipe.recipeId === primary.recipeId ? "Primary" : recipe.recipeId === rollback.recipeId ? "Rollback" : "Challenger"} |`,
    )
    .join("\n");
  return `# Production Story Recipe\n\nThis file is generated from \`config/story-recipes.json\`. Do not edit it by hand.\n\n- Primary dataset: \`${primaryDataset.version}\` (\`${primaryDataset.sha256}\`)\n- Primary dataset visibility: \`${primaryDataset.visibility}\`\n- Primary recipe: \`${primary.recipeId}\`\n- Rollback recipe: \`${rollback.recipeId}\`\n- Decision record: \`${registry.selection.decisionId}\`\n\n| Recipe | Dataset | Retrieval | Reranker | Embedder | Role |\n|---|---|---|---|---|---|\n${rows}\n\nProduction must name either the primary or rollback recipe explicitly. The selected manifest is the sole non-secret behavior source; stale provider, model, tuning, retrieval, embedder, and composer environment values are ignored. A selector-only rollback is valid only inside the same installed library, rerank/story prompts, validator, schema, boundary, and composer compatibility set.\n\nHistorical datasets, recipes, evidence, decisions, promotions, and database registrations remain append-only. Eval and shadow tools emit non-authoritative candidates only (\`promotable=false\`). A candidate recipe/evidence set must land on the protected base before a separate promotion-only pull request. That pull request may change only the selector, one content-addressed decision, this generated document, and one exact generated registration migration. Its rollback and decision source must be the base commit's primary recipe.\n\nPromotion authority belongs only to the dependency-free attestor loaded by the base-owned \`pull_request_target\` workflow from that protected commit. The GitHub \`recipe-promotion\` environment exposes its secret, read-only review API token, and exact head/decision/dataset/catalog/evidence/shadow/commit/input-tree/run/deployment/source-hash/reviewer bindings to the single attestor step; no checkout, install, eval, or pull-request-controlled script receives them. The attestor also requires each role's latest GitHub review to approve the exact head. Branch protection must require ordinary CI plus the always-running \`recipe-promotion-gate\`, independent environment reviewers, CODEOWNERS review, dismissal after new commits, no direct pushes, and a strict up-to-date branch so success cannot be reused against an advanced base. The current workflows do not handle \`merge_group\`; keep merge queue disabled unless both required workflows add and verify that trigger.\n\nRelease blocker (verified July 23, 2026): this repository is private on a GitHub plan whose branch-protection API returns \`403\` and says GitHub Pro or public visibility is required. The controls above are therefore not enforceable yet. Recipe promotion must remain disabled until the plan or visibility changes and the required checks, CODEOWNERS review, stale-review dismissal, environment reviewers, and no-direct-push rule are configured and verified.\n`;
}

function asRecord(value: unknown, name: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${name} must be an object`);
  }
  return value as Record<string, unknown>;
}

function requiredNumber(value: unknown, name: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${name} must be a finite number`);
  }
  return value;
}

function nullableNumber(value: unknown, name: string): number | null {
  if (value === null) return null;
  return requiredNumber(value, name);
}

function requiredBoolean(value: unknown, name: string): boolean {
  if (typeof value !== "boolean") throw new Error(`${name} must be boolean`);
  return value;
}

function printLegacyEvidenceFromCli(): void {
  if (process.argv[2] === "print-doc") {
    process.stdout.write(renderProductionRecipeDoc(loadRecipeRegistry()));
    return;
  }
  if (process.argv[2] === "print-retain-decision") {
    const registry = loadRecipeRegistry();
    const primary = registry.recipes.find(
      (recipe) => recipe.recipeId === registry.selection.primaryRecipeId,
    );
    const challenger = registry.recipes.find(
      (recipe) => recipe.recipeId !== registry.selection.primaryRecipeId,
    );
    const baselineEvidenceId = process.argv[3];
    const challengerEvidenceId = process.argv[4];
    const shadowEvidenceId = process.argv[5];
    if (!primary || !challenger || !baselineEvidenceId || !challengerEvidenceId || !shadowEvidenceId) {
      throw new Error(
        "Usage: recipe-evidence.ts print-retain-decision <baselineEvidenceId> <challengerEvidenceId> <shadowEvidenceId>",
      );
    }
    const primaryPromotion = registry.promotions.find(
      (promotion) => promotion.recipeId === primary.recipeId,
    );
    if (!primaryPromotion) throw new Error("primary recipe is not promoted");
    const decision = createRecipeDecision({
      decisionType: "retain_baseline",
      dataset: datasetForRecipe(registry, primary),
      decidedAt: primaryPromotion.promotedAt,
      fromRecipeId: primary.recipeId,
      toRecipeId: primary.recipeId,
      challengerRecipeId: challenger.recipeId,
      rollbackRecipeId: primary.recipeId,
      baselineEvidenceIds: [baselineEvidenceId],
      challengerEvidenceIds: [challengerEvidenceId],
      shadowEvidenceIds: [shadowEvidenceId],
      promotionAuthorized: false,
      rationaleCodes: [
        "baseline_trust_gate_passed",
        "challenger_lower_top1",
        "challenger_definitive_wrong",
        "challenger_hard_confusion_regression",
        "legacy_synthetic_evidence_not_promotable",
      ],
      approvals: [],
    });
    process.stdout.write(`${JSON.stringify(decision, null, 2)}\n`);
    return;
  }
  if (process.argv[2] === "print-shadow") {
    const baselinePath = process.argv[3];
    const challengerPath = process.argv[4];
    if (!baselinePath || !challengerPath) {
      throw new Error(
        "Usage: recipe-evidence.ts print-shadow <baseline-evidence.json> <challenger-evidence.json>",
      );
    }
    const baseline = JSON.parse(
      readFileSync(baselinePath, "utf8"),
    ) as EvalEvidence;
    const challenger = JSON.parse(
      readFileSync(challengerPath, "utf8"),
    ) as EvalEvidence;
    const comparison = {
      overallTop1Delta: metricDelta(
        challenger.metrics.overallTop1,
        baseline.metrics.overallTop1,
      ),
      hardConfusionDelta: metricDelta(
        challenger.metrics.hardConfusion,
        baseline.metrics.hardConfusion,
      ),
      definitiveWrongDelta:
        challenger.metrics.calibration.definitiveWrong -
        baseline.metrics.calibration.definitiveWrong,
      missDetectionDelta: metricDelta(
        challenger.metrics.missDetection,
        baseline.metrics.missDetection,
      ),
      coverageDelta: metricDelta(
        challenger.metrics.trustGate.coverage,
        baseline.metrics.trustGate.coverage,
      ),
    };
    const checks = {
      sameDataset:
        canonicalJson(baseline.dataset) === canonicalJson(challenger.dataset),
      strictTop1Superiority: comparison.overallTop1Delta > 0,
      trustGatePassed: challenger.metrics.trustGate.passed,
      noDefinitiveWrong:
        challenger.metrics.calibration.definitiveWrong === 0,
      hardConfusionNoWorse: comparison.hardConfusionDelta <= 0,
      missDetectionNoWorse: comparison.missDetectionDelta >= 0,
      coverageNoWorse: comparison.coverageDelta >= 0,
    };
    const shadow = createShadowEvidence({
      dataset: baseline.dataset,
      createdAt:
        baseline.run.completedAt > challenger.run.completedAt
          ? baseline.run.completedAt
          : challenger.run.completedAt,
      source: "offline_aggregate_import",
      baselineEvidenceId: baseline.evidenceId,
      challengerEvidenceId: challenger.evidenceId,
      comparison,
      outputsServedToUsers: false,
      disclosuresPersisted: false,
      gate: { passed: Object.values(checks).every(Boolean), checks },
      legacyImported: true,
      promotable: false,
    });
    process.stdout.write(`${JSON.stringify(shadow, null, 2)}\n`);
    return;
  }
  if (process.argv[2] !== "print-legacy") return;
  const sourcePath = process.argv[3];
  const recipeId = process.argv[4];
  const sourceCommit = process.argv[5] ?? null;
  if (!sourcePath || !recipeId) {
    throw new Error(
      "Usage: recipe-evidence.ts print-legacy <run.json> <recipeId> [sourceCommit]",
    );
  }
  const source = JSON.parse(readFileSync(sourcePath, "utf8")) as {
    config: {
      matchConfigVersion: string;
      provider: "stub" | "real";
      model: string;
      retrievalMode: "keyword" | "facetsrag";
      k: number;
      concurrency: number;
      maxRetries: number;
      ranAt: string;
      caseCount: number;
      trialCount: number;
    };
    metrics: Record<string, unknown>;
  };
  const registry = loadRecipeRegistry();
  const recipe = registry.recipes.find((entry) => entry.recipeId === recipeId);
  if (!recipe) throw new Error(`unknown recipe ${recipeId}`);
  if (recipe.retrievalMode !== source.config.retrievalMode) {
    throw new Error("source retrieval mode differs from recipe");
  }
  const evidence = createEvalEvidence({
    recipeId: recipe.recipeId,
    recipeManifestSha256: recipe.manifestSha256,
    dataset: datasetForRecipe(registry, recipe),
    run: {
      startedAt: source.config.ranAt,
      completedAt: source.config.ranAt,
      k: source.config.k,
      concurrency: source.config.concurrency,
      maxRetries: source.config.maxRetries,
      caseCount: source.config.caseCount,
      trialCount: source.config.trialCount,
    },
    config: {
      provider: source.config.provider,
      model: source.config.model,
      retrievalMode: recipe.retrievalMode,
      embeddingModelId: recipe.embeddingModelId,
      matchConfigVersion: source.config.matchConfigVersion,
      rerankTemperature: recipe.rerankTemperature,
      rerankReasoningEffort: recipe.rerankReasoningEffort,
      rerankTopK: recipe.rerankTopK,
    },
    metrics: evidenceMetricsFromRun(source.metrics),
    provenance: {
      gitCommit: sourceCommit,
      deploymentId: null,
      sourceRun: sourcePath.replaceAll("\\", "/").split("/").at(-1) ?? null,
    },
    legacyImported: true,
    promotable: false,
  });
  process.stdout.write(`${JSON.stringify(evidence, null, 2)}\n`);
}

function metricDelta(challenger: number | null, baseline: number | null): number {
  if (challenger === null || baseline === null) {
    throw new Error("shadow comparison requires non-null metrics");
  }
  return challenger - baseline;
}

if (process.argv[1]?.replaceAll("\\", "/").endsWith("/recipe-evidence.ts")) {
  printLegacyEvidenceFromCli();
}
