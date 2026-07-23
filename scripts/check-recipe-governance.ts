import {
  existsSync,
  readFileSync,
  readdirSync,
} from "node:fs";
import { relative, resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";
import {
  EVAL_EVIDENCE_SCHEMA_VERSION,
  EVAL_HARNESS_VERSION,
  EVAL_HISTORY_DIR,
  EVAL_SHADOW_DIR,
  PRODUCTION_RECIPE_DOC_PATH,
  RECIPE_PROMOTION_POLICY,
  RECIPE_DECISIONS_DIR,
  RECIPE_DECISION_SCHEMA_VERSION,
  RECIPE_REGISTRY_PATH,
  RECIPE_REGISTRY_SCHEMA_VERSION,
  SHADOW_EVIDENCE_SCHEMA_VERSION,
  STORY_RECIPE_MANIFEST_SCHEMA_V2,
  canonicalJson,
  contentId,
  manifestSha256,
  recipeForEval,
  renderProductionRecipeDoc,
  sha256File,
  type DatasetVisibility,
  type EvalEvidence,
  type EvidenceMetrics,
  type RecipeDecision,
  type ShadowEvidence,
  type StoryRecipeManifest,
  type StoryRecipeManifestV2,
  type StoryRecipeRegistry,
} from "./recipe-evidence";

const GOLD_PATH = resolve(process.cwd(), "evals/match.json");
const FIGURE_LIBRARY_PATH = resolve(process.cwd(), "lib/figures-data.ts");
const LEGACY_SUMMARY_PATH = resolve(process.cwd(), "evals/runs/summary.json");
const SHA256 = /^[a-f0-9]{64}$/;
const EVIDENCE_ID = /^ev_[a-f0-9]{64}$/;
const SHADOW_ID = /^sh_[a-f0-9]{64}$/;
const DECISION_ID = /^rd_[a-f0-9]{64}$/;
const REGISTRY_VERSION_ID = /^[a-z0-9][a-z0-9._-]{0,127}$/;
const MODEL_ID = /^[a-z0-9][a-z0-9._/@:-]{0,127}$/;
const DEPLOYMENT_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:@-]{0,127}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const EPSILON = 1e-12;
const FULL_GIT_COMMIT = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/;

// The first production selector predates challenger promotion governance. Keep
// exactly this retain record as the one explicit bootstrap exception; no future
// retain decision may mint a promoted recipe.
const HISTORICAL_BOOTSTRAP_RETAIN = {
  recipeId: "keyword-rerank-figure-library-50-2026-07-02",
  decisionId:
    "rd_c5c82ca18b56997b606f2d30e8d03cde57365a806b78fefeb436065085b2ad8b",
  promotedAt: "2026-07-02T07:13:02.101Z",
} as const;

type GovernanceState = {
  registry: StoryRecipeRegistry;
  recipes: Map<string, StoryRecipeManifest>;
  evidence: Map<string, EvalEvidence>;
  shadows: Map<string, ShadowEvidence>;
  decisions: Map<string, RecipeDecision>;
};

function main(): void {
  const registry = parseRegistry(readJson(RECIPE_REGISTRY_PATH));
  const datasets = new Map<
    string,
    StoryRecipeRegistry["datasets"][number]
  >();
  for (const dataset of registry.datasets) {
    assert(!datasets.has(dataset.version), `duplicate dataset ${dataset.version}`);
    datasets.set(dataset.version, dataset);
  }
  const recipes = new Map<string, StoryRecipeManifest>();
  for (const recipe of registry.recipes) {
    assert(!recipes.has(recipe.recipeId), `duplicate recipe ${recipe.recipeId}`);
    assert(
      manifestSha256(recipe) === recipe.manifestSha256,
      `${recipe.recipeId} manifestSha256 does not match its canonical payload`,
    );
    assert(
      datasets.has(recipe.datasetVersion),
      `${recipe.recipeId} references unknown dataset ${recipe.datasetVersion}`,
    );
    recipes.set(recipe.recipeId, recipe);
  }
  assert(recipes.has(registry.selection.primaryRecipeId), "primary recipe is missing");
  assert(recipes.has(registry.selection.rollbackRecipeId), "rollback recipe is missing");
  const promotions = new Map(
    registry.promotions.map((promotion) => [promotion.recipeId, promotion]),
  );
  assert(
    promotions.size === registry.promotions.length,
    "a recipe may be promoted only once",
  );
  for (const promotion of registry.promotions) {
    assert(recipes.has(promotion.recipeId), "promotion references an unknown recipe");
  }
  const primaryPromotion = promotions.get(registry.selection.primaryRecipeId);
  assert(primaryPromotion, "primary recipe has no append-only promotion record");
  assert(
    promotions.has(registry.selection.rollbackRecipeId),
    "rollback recipe has no append-only promotion record",
  );
  assert(
    primaryPromotion.decisionId === registry.selection.decisionId,
    "active selection decision differs from the primary promotion record",
  );
  const installedLibraryHash = sha256File(FIGURE_LIBRARY_PATH);
  for (const recipeId of new Set([
    registry.selection.primaryRecipeId,
    registry.selection.rollbackRecipeId,
  ])) {
    assert(
      recipes.get(recipeId)?.librarySnapshotSha256 === installedLibraryHash,
      `${recipeId} does not match the installed figure-library snapshot`,
    );
  }
  const primary = recipes.get(registry.selection.primaryRecipeId)!;
  const primaryDataset = datasets.get(primary.datasetVersion)!;
  assert(
    primaryDataset.visibility !== "synthetic" ||
      sha256File(GOLD_PATH) === primaryDataset.sha256,
    "primary synthetic dataset hash differs from evals/match.json",
  );

  assert(
    !existsSync(LEGACY_SUMMARY_PATH),
    "evals/runs/summary.json is mutable legacy state; migrate/remove it",
  );

  const evidence = loadEvidence(recipes, datasets);
  const shadows = loadShadows(evidence);
  const decisions = loadDecisions();
  const state = { registry, recipes, evidence, shadows, decisions };
  for (const promotion of registry.promotions) {
    assert(
      decisions.has(promotion.decisionId),
      `${promotion.recipeId} promotion references a missing decision`,
    );
  }
  validateRegisteredPromotions(state);
  validateDecisionChain(state);
  validateGeneratedDoc(registry);
  validateTrustedAttestorPolicy();
  validateAppendOnlyDiff();
  runTamperSelfChecks(state);

  const selected = decisions.get(registry.selection.decisionId)!;
  console.log("Recipe governance: PASS");
  console.log(
    `  primary=${registry.selection.primaryRecipeId} rollback=${registry.selection.rollbackRecipeId}`,
  );
  console.log(
    `  evidence=${evidence.size} shadow=${shadows.size} decisions=${decisions.size} selected=${selected.decisionType}`,
  );
  console.log(
    "  synthetic/legacy evidence is retained for audit but cannot authorize promotion",
  );
}

function parseRegistry(value: unknown): StoryRecipeRegistry {
  const root = record(value, "registry");
  exactKeys(
    root,
    ["schemaVersion", "datasets", "selection", "promotions", "recipes"],
    "registry",
  );
  literal(
    root.schemaVersion,
    RECIPE_REGISTRY_SCHEMA_VERSION,
    "registry.schemaVersion",
  );
  const datasets = array(root.datasets, "registry.datasets").map(
    (entry, index) => parseDataset(entry, `registry.datasets[${index}]`),
  );
  assert(datasets.length >= 1, "registry needs at least one dataset");
  const selection = record(root.selection, "registry.selection");
  exactKeys(
    selection,
    ["primaryRecipeId", "rollbackRecipeId", "decisionId"],
    "registry.selection",
  );
  const primaryRecipeId = registryVersionId(
    selection.primaryRecipeId,
    "primaryRecipeId",
  );
  const rollbackRecipeId = registryVersionId(
    selection.rollbackRecipeId,
    "rollbackRecipeId",
  );
  const decisionId = string(selection.decisionId, "selection.decisionId");
  assert(DECISION_ID.test(decisionId), "selection.decisionId must be content-addressed");
  const recipes = array(root.recipes, "registry.recipes").map((entry, index) =>
    parseRecipe(entry, `registry.recipes[${index}]`),
  );
  const promotions = array(root.promotions, "registry.promotions").map(
    (entry, index) => parsePromotion(entry, `registry.promotions[${index}]`),
  );
  assert(recipes.length >= 2, "registry needs a primary and at least one challenger");
  assert(promotions.length >= 1, "registry needs at least one promoted recipe");
  return {
    schemaVersion: RECIPE_REGISTRY_SCHEMA_VERSION,
    datasets,
    selection: { primaryRecipeId, rollbackRecipeId, decisionId },
    promotions,
    recipes,
  };
}

function parseRecipe(value: unknown, path: string): StoryRecipeManifest {
  const item = record(value, path);
  const commonKeys = [
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
  const isV2 = Object.prototype.hasOwnProperty.call(
    item,
    "manifestSchemaVersion",
  );
  exactKeys(
    item,
    isV2
      ? [...commonKeys, "manifestSchemaVersion", "facetTagger"]
      : commonKeys,
    path,
  );
  const retrievalMode = oneOf(
    item.retrievalMode,
    ["keyword", "facetsrag"] as const,
    `${path}.retrievalMode`,
  );
  const manifest = {
    recipeId: registryVersionId(item.recipeId, `${path}.recipeId`),
    manifestSha256: sha(item.manifestSha256, `${path}.manifestSha256`),
    retrievalMode,
    matchConfigVersion: registryVersionId(
      item.matchConfigVersion,
      `${path}.matchConfigVersion`,
    ),
    librarySnapshotSha256: sha(
      item.librarySnapshotSha256,
      `${path}.librarySnapshotSha256`,
    ),
    datasetVersion: registryVersionId(
      item.datasetVersion,
      `${path}.datasetVersion`,
    ),
    llmProvider: oneOf(item.llmProvider, ["real"] as const, `${path}.llmProvider`),
    rerankModelId: modelId(item.rerankModelId, `${path}.rerankModelId`),
    proseModelId: modelId(item.proseModelId, `${path}.proseModelId`),
    embeddingModelId:
      item.embeddingModelId === null
        ? null
        : modelId(item.embeddingModelId, `${path}.embeddingModelId`),
    rerankPromptVersion: registryVersionId(
      item.rerankPromptVersion,
      `${path}.rerankPromptVersion`,
    ),
    storyPromptVersion: registryVersionId(
      item.storyPromptVersion,
      `${path}.storyPromptVersion`,
    ),
    rerankTemperature: finite(item.rerankTemperature, `${path}.rerankTemperature`),
    rerankReasoningEffort: registryVersionId(
      item.rerankReasoningEffort,
      `${path}.rerankReasoningEffort`,
    ),
    rerankTopK: positiveInteger(item.rerankTopK, `${path}.rerankTopK`),
    storyTemperature: finite(item.storyTemperature, `${path}.storyTemperature`),
    storyComposerMode: oneOf(
      item.storyComposerMode,
      ["canonical"] as const,
      `${path}.storyComposerMode`,
    ),
    hybridStoryComposerEnabled: false as const,
    composerVersion: registryVersionId(
      item.composerVersion,
      `${path}.composerVersion`,
    ),
    validatorVersion: registryVersionId(
      item.validatorVersion,
      `${path}.validatorVersion`,
    ),
    storySpecSchemaVersion: registryVersionId(
      item.storySpecSchemaVersion,
      `${path}.storySpecSchemaVersion`,
    ),
    boundaryPolicyVersion: registryVersionId(
      item.boundaryPolicyVersion,
      `${path}.boundaryPolicyVersion`,
    ),
    resonanceBriefVersion: registryVersionId(
      item.resonanceBriefVersion,
      `${path}.resonanceBriefVersion`,
    ),
  };
  literal(
    item.hybridStoryComposerEnabled,
    false,
    `${path}.hybridStoryComposerEnabled`,
  );
  assert(
    retrievalMode === "keyword"
      ? manifest.embeddingModelId === null
      : manifest.embeddingModelId !== null,
    `${path}.embeddingModelId does not match retrieval mode`,
  );
  if (!isV2) return manifest;

  literal(
    item.manifestSchemaVersion,
    STORY_RECIPE_MANIFEST_SCHEMA_V2,
    `${path}.manifestSchemaVersion`,
  );
  assert(
    retrievalMode === "facetsrag" && manifest.embeddingModelId !== null,
    `${path} manifest v2 requires FacetsRAG with an embedder`,
  );
  const tagger = record(item.facetTagger, `${path}.facetTagger`);
  exactKeys(
    tagger,
    [
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
    ],
    `${path}.facetTagger`,
  );
  const facetTagger = {
    mode: oneOf(
      tagger.mode,
      ["closed_template"] as const,
      `${path}.facetTagger.mode`,
    ),
    modelId: modelId(tagger.modelId, `${path}.facetTagger.modelId`),
    promptVersion: registryVersionId(
      tagger.promptVersion,
      `${path}.facetTagger.promptVersion`,
    ),
    temperature: literal(
      tagger.temperature,
      0,
      `${path}.facetTagger.temperature`,
    ),
    reasoningEffort: registryVersionId(
      tagger.reasoningEffort,
      `${path}.facetTagger.reasoningEffort`,
    ),
    timeoutMs: literal(
      tagger.timeoutMs,
      3000,
      `${path}.facetTagger.timeoutMs`,
    ),
    signalSchemaVersion: registryVersionId(
      tagger.signalSchemaVersion,
      `${path}.facetTagger.signalSchemaVersion`,
    ),
    projectionSchemaVersion: registryVersionId(
      tagger.projectionSchemaVersion,
      `${path}.facetTagger.projectionSchemaVersion`,
    ),
    queryMode: oneOf(
      tagger.queryMode,
      ["raw", "validated_projection"] as const,
      `${path}.facetTagger.queryMode`,
    ),
    weightingMode: oneOf(
      tagger.weightingMode,
      ["static", "bounded_dynamic"] as const,
      `${path}.facetTagger.weightingMode`,
    ),
    expansionEnabled: literal(
      tagger.expansionEnabled,
      false,
      `${path}.facetTagger.expansionEnabled`,
    ),
  } satisfies StoryRecipeManifestV2["facetTagger"];
  return {
    ...manifest,
    manifestSchemaVersion: STORY_RECIPE_MANIFEST_SCHEMA_V2,
    facetTagger,
  };
}

function parsePromotion(
  value: unknown,
  path: string,
): StoryRecipeRegistry["promotions"][number] {
  const item = record(value, path);
  exactKeys(item, ["recipeId", "decisionId", "promotedAt"], path);
  const decisionId = string(item.decisionId, `${path}.decisionId`);
  assert(DECISION_ID.test(decisionId), `${path}.decisionId must be content-addressed`);
  return {
    recipeId: registryVersionId(item.recipeId, `${path}.recipeId`),
    decisionId,
    promotedAt: iso(item.promotedAt, `${path}.promotedAt`),
  };
}

function loadEvidence(
  recipes: Map<string, StoryRecipeManifest>,
  datasets: Map<string, StoryRecipeRegistry["datasets"][number]>,
): Map<string, EvalEvidence> {
  const result = new Map<string, EvalEvidence>();
  for (const path of jsonFiles(EVAL_HISTORY_DIR)) {
    const evidence = parseEvidence(readJson(path), path);
    assert(!result.has(evidence.evidenceId), `duplicate evidence ${evidence.evidenceId}`);
    const recipe = recipes.get(evidence.recipeId);
    assert(recipe, `${evidence.evidenceId} references unknown recipe ${evidence.recipeId}`);
    assert(
      evidence.recipeManifestSha256 === recipe.manifestSha256,
      `${evidence.evidenceId} recipe manifest hash mismatch`,
    );
    const registeredDataset = datasets.get(evidence.dataset.version);
    assert(registeredDataset, "evidence references an unknown dataset version");
    assert(
      canonicalJson(evidence.dataset) ===
        canonicalJson(registeredDataset),
      "evidence dataset metadata differs from immutable registry",
    );
    assert(evidence.config.retrievalMode === recipe.retrievalMode, "evidence retrieval mismatch");
    assert(evidence.config.model === recipe.rerankModelId, "evidence rerank model mismatch");
    assert(
      evidence.config.embeddingModelId === recipe.embeddingModelId,
      "evidence embedding model mismatch",
    );
    assert(
      evidence.config.matchConfigVersion === recipe.matchConfigVersion,
      "evidence match config mismatch",
    );
    assert(
      evidence.config.rerankTemperature === recipe.rerankTemperature &&
        evidence.config.rerankReasoningEffort === recipe.rerankReasoningEffort &&
        evidence.config.rerankTopK === recipe.rerankTopK,
      "evidence safe settings differ from recipe manifest",
    );
    const expectedPath = resolve(
      EVAL_HISTORY_DIR,
      evidence.dataset.version,
      evidence.recipeId,
      `${evidence.evidenceId}.json`,
    );
    assert(samePath(path, expectedPath), `${evidence.evidenceId} is at the wrong path`);
    assert(
      contentId(
        "ev",
        evidence as unknown as Record<string, unknown>,
        "evidenceId",
      ) === evidence.evidenceId,
      `${evidence.evidenceId} content hash mismatch`,
    );
    assert(
      !evidence.promotable,
      `${evidence.evidenceId} cannot self-assert promotion authority`,
    );
    if (evidence.legacyImported) {
      assert(evidence.candidate === undefined, "legacy evidence cannot be a candidate");
    } else {
      assert(typeof evidence.candidate === "boolean", "new evidence needs candidate status");
      if (evidence.candidate) validateCandidateEvidence(evidence);
    }
    result.set(evidence.evidenceId, evidence);
  }
  assert(result.size >= 2, "at least baseline and challenger evidence are required");
  return result;
}

function validateCandidateEvidence(evidence: EvalEvidence): void {
  const policy = RECIPE_PROMOTION_POLICY;
  assert(
    evidence.catalog !== undefined && evidence.catalog !== null,
    `${evidence.evidenceId} needs a production-eligible catalog snapshot`,
  );
  assert(
    evidence.run.k >= policy.minKPerEvidence,
    `${evidence.evidenceId} needs k>=${policy.minKPerEvidence}`,
  );
  assert(
    evidence.metrics.counts.overallTotal >=
      policy.minNonMissCasesPerEvidence * evidence.run.k,
    `${evidence.evidenceId} has too few non-miss samples`,
  );
  assert(
    evidence.metrics.counts.missTotal >=
      policy.minMissCasesPerEvidence * evidence.run.k,
    `${evidence.evidenceId} has too few miss samples`,
  );
  assert(
    evidence.metrics.counts.hardTotal >=
      policy.minHardCasesPerEvidence * evidence.run.k,
    `${evidence.evidenceId} has too few hard-confusion samples`,
  );
  assert(
    evidence.metrics.stability !== null &&
      evidence.metrics.stability >= policy.minStability,
    `${evidence.evidenceId} stability is below ${policy.minStability}`,
  );
  assert(
    evidence.metrics.latency.p95Ms <= policy.maxP95LatencyMs,
    `${evidence.evidenceId} p95 latency exceeds ${policy.maxP95LatencyMs}ms`,
  );
  assert(
    evidence.provenance.gitCommit !== null &&
      FULL_GIT_COMMIT.test(evidence.provenance.gitCommit),
    `${evidence.evidenceId} needs a full immutable git commit`,
  );
  assert(
    evidence.provenance.deploymentId !== null &&
      evidence.provenance.sourceRun !== null,
    `${evidence.evidenceId} needs candidate-run provenance`,
  );
  assert(
    evidence.provenance.runId !== null &&
      evidence.provenance.runId !== undefined &&
      evidence.provenance.runId !== evidence.provenance.deploymentId &&
      evidence.provenance.runId !== evidence.provenance.gitCommit &&
      evidence.provenance.deploymentId !== evidence.provenance.gitCommit,
    `${evidence.evidenceId} needs distinct run, deployment, and commit identities`,
  );
  assert(
    evidence.provenance.sourceRunSha256 !== null &&
      evidence.provenance.sourceRunSha256 !== undefined &&
      SHA256.test(evidence.provenance.sourceRunSha256) &&
      evidence.provenance.inputTreeSha256 !== null &&
      evidence.provenance.inputTreeSha256 !== undefined &&
      SHA256.test(evidence.provenance.inputTreeSha256),
    `${evidence.evidenceId} needs content-bound run and input-tree hashes`,
  );
}

function parseEvidence(value: unknown, path: string): EvalEvidence {
  const root = record(value, path);
  const legacyImported = boolean(root.legacyImported, `${path}.legacyImported`);
  exactKeys(
    root,
    [
      "schemaVersion",
      "harnessVersion",
      "evidenceId",
      "recipeId",
      "recipeManifestSha256",
      "dataset",
      "run",
      "config",
      "metrics",
      "provenance",
      "legacyImported",
      "promotable",
      ...(!legacyImported ? ["catalog", "candidate"] : []),
    ],
    path,
  );
  literal(root.schemaVersion, EVAL_EVIDENCE_SCHEMA_VERSION, `${path}.schemaVersion`);
  literal(root.harnessVersion, EVAL_HARNESS_VERSION, `${path}.harnessVersion`);
  const evidenceId = string(root.evidenceId, `${path}.evidenceId`);
  assert(EVIDENCE_ID.test(evidenceId), `${path}.evidenceId is invalid`);
  const run = record(root.run, `${path}.run`);
  exactKeys(
    run,
    [
      "startedAt",
      "completedAt",
      "k",
      "concurrency",
      "maxRetries",
      "caseCount",
      "trialCount",
    ],
    `${path}.run`,
  );
  const config = record(root.config, `${path}.config`);
  exactKeys(
    config,
    [
      "provider",
      "model",
      "retrievalMode",
      "embeddingModelId",
      "matchConfigVersion",
      "rerankTemperature",
      "rerankReasoningEffort",
      "rerankTopK",
    ],
    `${path}.config`,
  );
  const provenance = record(root.provenance, `${path}.provenance`);
  exactKeys(
    provenance,
    [
      "gitCommit",
      "deploymentId",
      "sourceRun",
      ...(!legacyImported
        ? ["runId", "sourceRunSha256", "inputTreeSha256"]
        : []),
    ],
    `${path}.provenance`,
  );
  const metrics = parseMetrics(root.metrics, `${path}.metrics`);
  const catalog = legacyImported
    ? undefined
    : parseEvidenceCatalog(root.catalog, `${path}.catalog`);
  const evidence: EvalEvidence = {
    schemaVersion: EVAL_EVIDENCE_SCHEMA_VERSION,
    harnessVersion: EVAL_HARNESS_VERSION,
    evidenceId,
    recipeId: registryVersionId(root.recipeId, `${path}.recipeId`),
    recipeManifestSha256: sha(
      root.recipeManifestSha256,
      `${path}.recipeManifestSha256`,
    ),
    dataset: parseDataset(root.dataset, `${path}.dataset`),
    ...(legacyImported ? {} : { catalog }),
    run: {
      startedAt: iso(run.startedAt, `${path}.run.startedAt`),
      completedAt: iso(run.completedAt, `${path}.run.completedAt`),
      k: positiveInteger(run.k, `${path}.run.k`),
      concurrency: positiveInteger(run.concurrency, `${path}.run.concurrency`),
      maxRetries: nonnegativeInteger(run.maxRetries, `${path}.run.maxRetries`),
      caseCount: positiveInteger(run.caseCount, `${path}.run.caseCount`),
      trialCount: positiveInteger(run.trialCount, `${path}.run.trialCount`),
    },
    config: {
      provider: oneOf(config.provider, ["stub", "real"] as const, `${path}.config.provider`),
      model: modelId(config.model, `${path}.config.model`),
      retrievalMode: oneOf(
        config.retrievalMode,
        ["keyword", "facetsrag"] as const,
        `${path}.config.retrievalMode`,
      ),
      embeddingModelId:
        config.embeddingModelId === null
          ? null
          : modelId(config.embeddingModelId, `${path}.config.embeddingModelId`),
      matchConfigVersion: registryVersionId(
        config.matchConfigVersion,
        `${path}.config.matchConfigVersion`,
      ),
      rerankTemperature: finite(
        config.rerankTemperature,
        `${path}.config.rerankTemperature`,
      ),
      rerankReasoningEffort: registryVersionId(
        config.rerankReasoningEffort,
        `${path}.config.rerankReasoningEffort`,
      ),
      rerankTopK: positiveInteger(config.rerankTopK, `${path}.config.rerankTopK`),
    },
    metrics,
    provenance: {
      gitCommit: nullableSafeString(provenance.gitCommit, `${path}.provenance.gitCommit`),
      deploymentId: nullableDeploymentId(
        provenance.deploymentId,
        `${path}.provenance.deploymentId`,
      ),
      sourceRun: nullableSafeString(provenance.sourceRun, `${path}.provenance.sourceRun`),
      ...(!legacyImported
        ? {
            runId: nullableSafeString(provenance.runId, `${path}.provenance.runId`),
            sourceRunSha256: nullableSafeString(
              provenance.sourceRunSha256,
              `${path}.provenance.sourceRunSha256`,
            ),
            inputTreeSha256: nullableSafeString(
              provenance.inputTreeSha256,
              `${path}.provenance.inputTreeSha256`,
            ),
          }
        : {}),
    },
    legacyImported,
    ...(legacyImported
      ? {}
      : { candidate: boolean(root.candidate, `${path}.candidate`) }),
    promotable: boolean(root.promotable, `${path}.promotable`),
  };
  assert(evidence.run.completedAt >= evidence.run.startedAt, "completedAt precedes startedAt");
  assert(
    evidence.run.trialCount === evidence.run.caseCount * evidence.run.k,
    `${evidence.evidenceId} trial count must equal cases * k`,
  );
  assert(
    metrics.counts.rerankChosen + metrics.counts.keywordFallback ===
      evidence.run.trialCount,
    `${evidence.evidenceId} chosen-path counts differ from trial count`,
  );
  assert(
    metrics.counts.overallTotal + metrics.counts.missTotal ===
      evidence.run.trialCount,
    `${evidence.evidenceId} miss/non-miss counts differ from trial count`,
  );
  assertRatio(
    metrics.trustGate.coverage,
    metrics.counts.rerankChosen,
    evidence.run.trialCount,
    `${evidence.evidenceId}.coverage`,
  );
  return evidence;
}

function parseEvidenceCatalog(
  value: unknown,
  path: string,
): NonNullable<EvalEvidence["catalog"]> | null {
  if (value === null) return null;
  const catalog = record(value, path);
  exactKeys(
    catalog,
    ["sha256", "eligibleStageCount", "source"],
    path,
  );
  literal(
    catalog.source,
    "supabase_published_story_specs",
    `${path}.source`,
  );
  return {
    sha256: sha(catalog.sha256, `${path}.sha256`),
    eligibleStageCount: positiveInteger(
      catalog.eligibleStageCount,
      `${path}.eligibleStageCount`,
    ),
    source: "supabase_published_story_specs",
  };
}

function parseMetrics(value: unknown, path: string): EvidenceMetrics {
  const root = record(value, path);
  exactKeys(
    root,
    [
      "rerankTop1",
      "overallTop1",
      "missDetection",
      "hardConfusion",
      "goldSurvivalStageA",
      "goldSurvivalStageB",
      "stability",
      "counts",
      "calibration",
      "latency",
      "trustGate",
    ],
    path,
  );
  const counts = record(root.counts, `${path}.counts`);
  exactKeys(
    counts,
    [
      "rerankCorrect",
      "rerankTotal",
      "overallCorrect",
      "overallTotal",
      "missDetected",
      "missTotal",
      "hardConfused",
      "hardTotal",
      "survivedStageA",
      "survivedStageB",
      "survivalTotal",
      "rerankChosen",
      "keywordFallback",
    ],
    `${path}.counts`,
  );
  const calibration = record(root.calibration, `${path}.calibration`);
  exactKeys(
    calibration,
    ["definitiveCorrect", "definitiveWrong", "partialCorrect", "partialWrong"],
    `${path}.calibration`,
  );
  const latency = record(root.latency, `${path}.latency`);
  exactKeys(latency, ["p50Ms", "p95Ms"], `${path}.latency`);
  const trustGate = record(root.trustGate, `${path}.trustGate`);
  exactKeys(
    trustGate,
    ["passed", "coverage", "checks", "thresholds"],
    `${path}.trustGate`,
  );
  const checks = record(trustGate.checks, `${path}.trustGate.checks`);
  exactKeys(
    checks,
    [
      "coverage",
      "rerankTop1",
      "missDetection",
      "noDefinitiveWrong",
      "top1",
      "hardConfusion",
    ],
    `${path}.trustGate.checks`,
  );
  const thresholds = record(trustGate.thresholds, `${path}.trustGate.thresholds`);
  exactKeys(
    thresholds,
    [
      "minCoverage",
      "minRerankTop1",
      "minOverallTop1",
      "minMissDetection",
      "maxDefinitiveWrong",
      "maxHardConfusion",
    ],
    `${path}.trustGate.thresholds`,
  );
  const metrics: EvidenceMetrics = {
    rerankTop1: ratioValue(root.rerankTop1, `${path}.rerankTop1`),
    overallTop1: ratioValue(root.overallTop1, `${path}.overallTop1`),
    missDetection: ratioValue(root.missDetection, `${path}.missDetection`),
    hardConfusion: ratioValue(root.hardConfusion, `${path}.hardConfusion`),
    goldSurvivalStageA: ratioValue(root.goldSurvivalStageA, `${path}.goldSurvivalStageA`),
    goldSurvivalStageB: ratioValue(root.goldSurvivalStageB, `${path}.goldSurvivalStageB`),
    stability: ratioValue(root.stability, `${path}.stability`),
    counts: {
      rerankCorrect: nonnegativeInteger(counts.rerankCorrect, "rerankCorrect"),
      rerankTotal: nonnegativeInteger(counts.rerankTotal, "rerankTotal"),
      overallCorrect: nonnegativeInteger(counts.overallCorrect, "overallCorrect"),
      overallTotal: nonnegativeInteger(counts.overallTotal, "overallTotal"),
      missDetected: nonnegativeInteger(counts.missDetected, "missDetected"),
      missTotal: nonnegativeInteger(counts.missTotal, "missTotal"),
      hardConfused: nonnegativeInteger(counts.hardConfused, "hardConfused"),
      hardTotal: nonnegativeInteger(counts.hardTotal, "hardTotal"),
      survivedStageA: nonnegativeInteger(counts.survivedStageA, "survivedStageA"),
      survivedStageB: nonnegativeInteger(counts.survivedStageB, "survivedStageB"),
      survivalTotal: nonnegativeInteger(counts.survivalTotal, "survivalTotal"),
      rerankChosen: nonnegativeInteger(counts.rerankChosen, "rerankChosen"),
      keywordFallback: nonnegativeInteger(counts.keywordFallback, "keywordFallback"),
    },
    calibration: {
      definitiveCorrect: nonnegativeInteger(calibration.definitiveCorrect, "definitiveCorrect"),
      definitiveWrong: nonnegativeInteger(calibration.definitiveWrong, "definitiveWrong"),
      partialCorrect: nonnegativeInteger(calibration.partialCorrect, "partialCorrect"),
      partialWrong: nonnegativeInteger(calibration.partialWrong, "partialWrong"),
    },
    latency: {
      p50Ms: nonnegativeInteger(latency.p50Ms, "latency.p50Ms"),
      p95Ms: nonnegativeInteger(latency.p95Ms, "latency.p95Ms"),
    },
    trustGate: {
      passed: boolean(trustGate.passed, "trustGate.passed"),
      coverage: ratioValue(trustGate.coverage, "trustGate.coverage"),
      checks: {
        coverage: boolean(checks.coverage, "checks.coverage"),
        rerankTop1: boolean(checks.rerankTop1, "checks.rerankTop1"),
        missDetection: boolean(checks.missDetection, "checks.missDetection"),
        noDefinitiveWrong: boolean(checks.noDefinitiveWrong, "checks.noDefinitiveWrong"),
        top1: boolean(checks.top1, "checks.top1"),
        hardConfusion: boolean(checks.hardConfusion, "checks.hardConfusion"),
      },
      thresholds: {
        minCoverage: ratio(thresholds.minCoverage, "minCoverage"),
        minRerankTop1: ratio(thresholds.minRerankTop1, "minRerankTop1"),
        minOverallTop1: ratio(thresholds.minOverallTop1, "minOverallTop1"),
        minMissDetection: ratio(thresholds.minMissDetection, "minMissDetection"),
        maxDefinitiveWrong: nonnegativeInteger(
          thresholds.maxDefinitiveWrong,
          "maxDefinitiveWrong",
        ),
        maxHardConfusion: ratio(thresholds.maxHardConfusion, "maxHardConfusion"),
      },
    },
  };
  validateMetricArithmetic(metrics);
  return metrics;
}

function validateMetricArithmetic(metrics: EvidenceMetrics): void {
  assert(
    canonicalJson(metrics.trustGate.thresholds) ===
      canonicalJson(RECIPE_PROMOTION_POLICY.trustGate),
    "evidence trust thresholds differ from the immutable promotion policy",
  );
  assertRatio(metrics.rerankTop1, metrics.counts.rerankCorrect, metrics.counts.rerankTotal, "rerankTop1");
  assertRatio(metrics.overallTop1, metrics.counts.overallCorrect, metrics.counts.overallTotal, "overallTop1");
  assertRatio(metrics.missDetection, metrics.counts.missDetected, metrics.counts.missTotal, "missDetection");
  assertRatio(metrics.hardConfusion, metrics.counts.hardConfused, metrics.counts.hardTotal, "hardConfusion");
  assertRatio(metrics.goldSurvivalStageA, metrics.counts.survivedStageA, metrics.counts.survivalTotal, "goldSurvivalStageA");
  assertRatio(metrics.goldSurvivalStageB, metrics.counts.survivedStageB, metrics.counts.survivalTotal, "goldSurvivalStageB");
  assert(
    metrics.calibration.definitiveCorrect +
      metrics.calibration.definitiveWrong +
      metrics.calibration.partialCorrect +
      metrics.calibration.partialWrong ===
      metrics.counts.overallTotal,
    "calibration total differs from non-miss total",
  );
  const expectedChecks = {
    coverage:
      metrics.trustGate.coverage !== null &&
      metrics.trustGate.coverage >= metrics.trustGate.thresholds.minCoverage,
    rerankTop1:
      metrics.rerankTop1 !== null &&
      metrics.rerankTop1 >= metrics.trustGate.thresholds.minRerankTop1,
    missDetection:
      metrics.missDetection === null ||
      metrics.missDetection >= metrics.trustGate.thresholds.minMissDetection,
    noDefinitiveWrong:
      metrics.calibration.definitiveWrong <=
      metrics.trustGate.thresholds.maxDefinitiveWrong,
    top1:
      metrics.overallTop1 !== null &&
      metrics.overallTop1 >= metrics.trustGate.thresholds.minOverallTop1,
    hardConfusion:
      metrics.hardConfusion === null ||
      metrics.hardConfusion <= metrics.trustGate.thresholds.maxHardConfusion,
  };
  assert(
    canonicalJson(expectedChecks) === canonicalJson(metrics.trustGate.checks),
    "trust gate checks do not recompute from metrics",
  );
  assert(
    metrics.trustGate.passed === Object.values(expectedChecks).every(Boolean),
    "trust gate passed flag does not recompute",
  );
}

function loadShadows(evidence: Map<string, EvalEvidence>): Map<string, ShadowEvidence> {
  const result = new Map<string, ShadowEvidence>();
  for (const path of jsonFiles(EVAL_SHADOW_DIR)) {
    const shadow = parseShadow(readJson(path), path);
    assert(!result.has(shadow.shadowId), `duplicate shadow ${shadow.shadowId}`);
    const baseline = evidence.get(shadow.baselineEvidenceId);
    const challenger = evidence.get(shadow.challengerEvidenceId);
    assert(baseline && challenger, `${shadow.shadowId} references missing evidence`);
    const expectedPath = resolve(
      EVAL_SHADOW_DIR,
      shadow.dataset.version,
      `${shadow.shadowId}.json`,
    );
    assert(samePath(path, expectedPath), `${shadow.shadowId} is at the wrong path`);
    assert(
      contentId("sh", shadow as unknown as Record<string, unknown>, "shadowId") ===
        shadow.shadowId,
      `${shadow.shadowId} content hash mismatch`,
    );
    validateShadowComparison(shadow, baseline, challenger);
    result.set(shadow.shadowId, shadow);
  }
  assert(result.size >= 1, "at least one shadow comparison is required");
  return result;
}

function parseShadow(value: unknown, path: string): ShadowEvidence {
  const root = record(value, path);
  const legacyImported = boolean(root.legacyImported, `${path}.legacyImported`);
  exactKeys(
    root,
    [
      "schemaVersion",
      "shadowId",
      "dataset",
      "createdAt",
      "source",
      "baselineEvidenceId",
      "challengerEvidenceId",
      "comparison",
      "outputsServedToUsers",
      "disclosuresPersisted",
      "gate",
      ...(!legacyImported ? ["provenance", "candidate"] : []),
      "legacyImported",
      "promotable",
    ],
    path,
  );
  literal(root.schemaVersion, SHADOW_EVIDENCE_SCHEMA_VERSION, `${path}.schemaVersion`);
  const shadowId = string(root.shadowId, `${path}.shadowId`);
  assert(SHADOW_ID.test(shadowId), `${path}.shadowId is invalid`);
  const comparison = record(root.comparison, `${path}.comparison`);
  exactKeys(
    comparison,
    [
      "overallTop1Delta",
      "hardConfusionDelta",
      "definitiveWrongDelta",
      "missDetectionDelta",
      "coverageDelta",
    ],
    `${path}.comparison`,
  );
  const gate = record(root.gate, `${path}.gate`);
  exactKeys(gate, ["passed", "checks"], `${path}.gate`);
  const checks = record(gate.checks, `${path}.gate.checks`);
  exactKeys(
    checks,
    [
      "sameDataset",
      "strictTop1Superiority",
      "trustGatePassed",
      "noDefinitiveWrong",
      "hardConfusionNoWorse",
      "missDetectionNoWorse",
      "coverageNoWorse",
    ],
    `${path}.gate.checks`,
  );
  literal(root.outputsServedToUsers, false, `${path}.outputsServedToUsers`);
  literal(root.disclosuresPersisted, false, `${path}.disclosuresPersisted`);
  const provenance = legacyImported
    ? null
    : record(root.provenance, `${path}.provenance`);
  if (provenance) {
    exactKeys(
      provenance,
      [
        "gitCommit",
        "deploymentId",
        "shadowRunId",
        "sourceRunSha256",
        "inputTreeSha256",
      ],
      `${path}.provenance`,
    );
  }
  return {
    schemaVersion: SHADOW_EVIDENCE_SCHEMA_VERSION,
    shadowId,
    dataset: parseDataset(root.dataset, `${path}.dataset`),
    createdAt: iso(root.createdAt, `${path}.createdAt`),
    source: oneOf(
      root.source,
      ["offline_aggregate_import", "offline_paired_holdout"] as const,
      `${path}.source`,
    ),
    baselineEvidenceId: evidenceId(root.baselineEvidenceId, `${path}.baselineEvidenceId`),
    challengerEvidenceId: evidenceId(
      root.challengerEvidenceId,
      `${path}.challengerEvidenceId`,
    ),
    comparison: {
      overallTop1Delta: finite(comparison.overallTop1Delta, "overallTop1Delta"),
      hardConfusionDelta: finite(comparison.hardConfusionDelta, "hardConfusionDelta"),
      definitiveWrongDelta: integer(comparison.definitiveWrongDelta, "definitiveWrongDelta"),
      missDetectionDelta: finite(comparison.missDetectionDelta, "missDetectionDelta"),
      coverageDelta: finite(comparison.coverageDelta, "coverageDelta"),
    },
    outputsServedToUsers: false,
    disclosuresPersisted: false,
    gate: {
      passed: boolean(gate.passed, `${path}.gate.passed`),
      checks: {
        sameDataset: boolean(checks.sameDataset, "sameDataset"),
        strictTop1Superiority: boolean(checks.strictTop1Superiority, "strictTop1Superiority"),
        trustGatePassed: boolean(checks.trustGatePassed, "trustGatePassed"),
        noDefinitiveWrong: boolean(checks.noDefinitiveWrong, "noDefinitiveWrong"),
        hardConfusionNoWorse: boolean(checks.hardConfusionNoWorse, "hardConfusionNoWorse"),
        missDetectionNoWorse: boolean(checks.missDetectionNoWorse, "missDetectionNoWorse"),
        coverageNoWorse: boolean(checks.coverageNoWorse, "coverageNoWorse"),
      },
    },
    ...(provenance
      ? {
          provenance: {
            gitCommit: fullGitCommit(
              provenance.gitCommit,
              `${path}.provenance.gitCommit`,
            ),
            deploymentId: deploymentId(
              provenance.deploymentId,
              `${path}.provenance.deploymentId`,
            ),
            shadowRunId: safeId(
              provenance.shadowRunId,
              `${path}.provenance.shadowRunId`,
            ),
            sourceRunSha256: sha(
              provenance.sourceRunSha256,
              `${path}.provenance.sourceRunSha256`,
            ),
            inputTreeSha256: sha(
              provenance.inputTreeSha256,
              `${path}.provenance.inputTreeSha256`,
            ),
          },
        }
      : {}),
    legacyImported,
    ...(legacyImported
      ? {}
      : { candidate: boolean(root.candidate, `${path}.candidate`) }),
    promotable: boolean(root.promotable, `${path}.promotable`),
  };
}

function validateShadowComparison(
  shadow: ShadowEvidence,
  baseline: EvalEvidence,
  challenger: EvalEvidence,
): void {
  const comparison = {
    overallTop1Delta: metricDelta(challenger.metrics.overallTop1, baseline.metrics.overallTop1),
    hardConfusionDelta: metricDelta(challenger.metrics.hardConfusion, baseline.metrics.hardConfusion),
    definitiveWrongDelta:
      challenger.metrics.calibration.definitiveWrong -
      baseline.metrics.calibration.definitiveWrong,
    missDetectionDelta: metricDelta(challenger.metrics.missDetection, baseline.metrics.missDetection),
    coverageDelta: metricDelta(
      challenger.metrics.trustGate.coverage,
      baseline.metrics.trustGate.coverage,
    ),
  };
  for (const key of Object.keys(comparison) as Array<keyof typeof comparison>) {
    assertClose(shadow.comparison[key], comparison[key], `${shadow.shadowId}.${key}`);
  }
  const checks = {
    sameDataset:
      canonicalJson(baseline.dataset) === canonicalJson(challenger.dataset) &&
      canonicalJson(shadow.dataset) === canonicalJson(baseline.dataset),
    strictTop1Superiority: comparison.overallTop1Delta > 0,
    trustGatePassed: challenger.metrics.trustGate.passed,
    noDefinitiveWrong: challenger.metrics.calibration.definitiveWrong === 0,
    hardConfusionNoWorse: comparison.hardConfusionDelta <= 0,
    missDetectionNoWorse: comparison.missDetectionDelta >= 0,
    coverageNoWorse: comparison.coverageDelta >= 0,
  };
  assert(
    canonicalJson(checks) === canonicalJson(shadow.gate.checks),
    `${shadow.shadowId} checks do not recompute`,
  );
  assert(
    shadow.gate.passed === Object.values(checks).every(Boolean),
    `${shadow.shadowId} gate flag does not recompute`,
  );
  assert(
    !shadow.promotable,
    `${shadow.shadowId} cannot self-assert promotion authority`,
  );
  if (shadow.legacyImported) {
    assert(shadow.candidate === undefined, "legacy shadow cannot be a candidate");
    return;
  }
  if (shadow.candidate) {
    assert(
      shadow.source === "offline_paired_holdout" &&
        shadow.dataset.visibility === "protected_holdout" &&
        baseline.candidate === true &&
        challenger.candidate === true &&
        shadow.gate.passed &&
        shadow.provenance !== undefined,
      `${shadow.shadowId} is not a complete paired-holdout candidate`,
    );
    const provenance = shadow.provenance;
    assert(
      provenance.shadowRunId !== provenance.deploymentId &&
        provenance.shadowRunId !== provenance.gitCommit &&
        provenance.deploymentId !== provenance.gitCommit,
      `${shadow.shadowId} needs distinct run, deployment, and commit identities`,
    );
  }
}

function loadDecisions(): Map<string, RecipeDecision> {
  const result = new Map<string, RecipeDecision>();
  for (const path of jsonFiles(RECIPE_DECISIONS_DIR)) {
    const decision = parseDecision(readJson(path), path);
    assert(!result.has(decision.decisionId), `duplicate decision ${decision.decisionId}`);
    const expectedPath = resolve(RECIPE_DECISIONS_DIR, `${decision.decisionId}.json`);
    assert(samePath(path, expectedPath), `${decision.decisionId} is at the wrong path`);
    assert(
      contentId(
        "rd",
        decision as unknown as Record<string, unknown>,
        "decisionId",
      ) === decision.decisionId,
      `${decision.decisionId} content hash mismatch`,
    );
    result.set(decision.decisionId, decision);
  }
  assert(result.size >= 1, "at least one recipe decision is required");
  return result;
}

function parseDecision(value: unknown, path: string): RecipeDecision {
  const root = record(value, path);
  exactKeys(
    root,
    [
      "schemaVersion",
      "decisionId",
      "decisionType",
      "dataset",
      "decidedAt",
      "fromRecipeId",
      "toRecipeId",
      "challengerRecipeId",
      "rollbackRecipeId",
      "baselineEvidenceIds",
      "challengerEvidenceIds",
      "shadowEvidenceIds",
      "promotionAuthorized",
      "rationaleCodes",
      "approvals",
    ],
    path,
  );
  literal(root.schemaVersion, RECIPE_DECISION_SCHEMA_VERSION, `${path}.schemaVersion`);
  const decisionId = string(root.decisionId, `${path}.decisionId`);
  assert(DECISION_ID.test(decisionId), `${path}.decisionId is invalid`);
  const approvals = array(root.approvals, `${path}.approvals`).map((entry, index) => {
    const approval = record(entry, `${path}.approvals[${index}]`);
    exactKeys(approval, ["role", "reviewerId", "approvedAt"], `${path}.approvals[${index}]`);
    return {
      role: oneOf(
        approval.role,
        ["product", "matching", "safety_privacy"] as const,
        `${path}.approvals[${index}].role`,
      ),
      reviewerId: safeId(approval.reviewerId, `${path}.approvals[${index}].reviewerId`),
      approvedAt: iso(approval.approvedAt, `${path}.approvals[${index}].approvedAt`),
    };
  });
  return {
    schemaVersion: RECIPE_DECISION_SCHEMA_VERSION,
    decisionId,
    decisionType: oneOf(
      root.decisionType,
      ["retain_baseline", "promote_challenger"] as const,
      `${path}.decisionType`,
    ),
    dataset: parseDataset(root.dataset, `${path}.dataset`),
    decidedAt: iso(root.decidedAt, `${path}.decidedAt`),
    fromRecipeId: registryVersionId(root.fromRecipeId, `${path}.fromRecipeId`),
    toRecipeId: registryVersionId(root.toRecipeId, `${path}.toRecipeId`),
    challengerRecipeId: registryVersionId(
      root.challengerRecipeId,
      `${path}.challengerRecipeId`,
    ),
    rollbackRecipeId: registryVersionId(
      root.rollbackRecipeId,
      `${path}.rollbackRecipeId`,
    ),
    baselineEvidenceIds: idArray(root.baselineEvidenceIds, EVIDENCE_ID, "baselineEvidenceIds"),
    challengerEvidenceIds: idArray(
      root.challengerEvidenceIds,
      EVIDENCE_ID,
      "challengerEvidenceIds",
    ),
    shadowEvidenceIds: idArray(root.shadowEvidenceIds, SHADOW_ID, "shadowEvidenceIds"),
    promotionAuthorized: boolean(root.promotionAuthorized, `${path}.promotionAuthorized`),
    rationaleCodes: array(root.rationaleCodes, `${path}.rationaleCodes`).map((entry, index) =>
      registryVersionId(entry, `${path}.rationaleCodes[${index}]`),
    ),
    approvals,
  };
}

function validateRegisteredPromotions(state: GovernanceState): void {
  const { registry, decisions } = state;
  const promotionChange = newlyPromotedRecipeIds(registry);
  for (const promotion of registry.promotions) {
    const decision = requiredMap(decisions, promotion.decisionId);
    assert(
      decision.toRecipeId === promotion.recipeId,
      `${promotion.recipeId} promotion decision targets ${decision.toRecipeId}`,
    );
    assert(
      decision.decidedAt === promotion.promotedAt,
      `${promotion.recipeId} promotedAt differs from its decision`,
    );
    if (isHistoricalBootstrapRetain(promotion, decision)) continue;
    assert(
      decision.decisionType === "promote_challenger" &&
        decision.promotionAuthorized,
      `${promotion.recipeId} requires an authorized challenger-promotion decision`,
    );
    if (promotionChange.recipeIds.has(promotion.recipeId)) {
      assert(
        promotionChange.basePrimaryRecipeId !== null &&
          decision.fromRecipeId === promotionChange.basePrimaryRecipeId &&
          decision.rollbackRecipeId === promotionChange.basePrimaryRecipeId,
        `${promotion.recipeId} must promote from and roll back to the base commit primary`,
      );
    }
  }
}

function newlyPromotedRecipeIds(
  registry: StoryRecipeRegistry,
): {
  recipeIds: ReadonlySet<string>;
  basePrimaryRecipeId: string | null;
} {
  const base =
    process.env.RECIPE_GOVERNANCE_BASE_SHA?.trim() ||
    process.env.GITHUB_BASE_SHA?.trim();
  // Attestation is a change-time authority check. Ordinary local/post-merge
  // audits remain deterministic structural checks; the protected CI job always
  // supplies its exact base commit.
  if (!base) return { recipeIds: new Set<string>(), basePrimaryRecipeId: null };
  const result = spawnSync(
    "git",
    ["show", `${base}:config/story-recipes.json`],
    { cwd: process.cwd(), encoding: "utf8", windowsHide: true },
  );
  const priorIds = new Set<string>();
  let basePrimaryRecipeId: string | null = null;
  if (result.status === 0) {
    const prior = record(JSON.parse(result.stdout) as unknown, "base registry");
    const selection = record(prior.selection, "base registry.selection");
    basePrimaryRecipeId = registryVersionId(
      selection.primaryRecipeId,
      "base registry.selection.primaryRecipeId",
    );
    for (const entry of array(prior.promotions, "base registry.promotions")) {
      const promotion = record(entry, "base registry promotion");
      priorIds.add(
        registryVersionId(promotion.recipeId, "base promotion.recipeId"),
      );
    }
  }
  const added = registry.promotions
    .map((promotion) => promotion.recipeId)
    .filter(
      (recipeId) =>
        recipeId !== HISTORICAL_BOOTSTRAP_RETAIN.recipeId &&
        !priorIds.has(recipeId),
  );
  assert(added.length <= 1, "promote at most one story recipe per change");
  return { recipeIds: new Set(added), basePrimaryRecipeId };
}

function isHistoricalBootstrapRetain(
  promotion: StoryRecipeRegistry["promotions"][number],
  decision: RecipeDecision,
): boolean {
  const exactBootstrap =
    promotion.recipeId === HISTORICAL_BOOTSTRAP_RETAIN.recipeId &&
    promotion.decisionId === HISTORICAL_BOOTSTRAP_RETAIN.decisionId &&
    promotion.promotedAt === HISTORICAL_BOOTSTRAP_RETAIN.promotedAt;
  if (!exactBootstrap) return false;
  assert(
    decision.decisionType === "retain_baseline" &&
      !decision.promotionAuthorized &&
      decision.fromRecipeId === HISTORICAL_BOOTSTRAP_RETAIN.recipeId &&
      decision.toRecipeId === HISTORICAL_BOOTSTRAP_RETAIN.recipeId,
    "historical bootstrap exception no longer matches its immutable retain record",
  );
  return true;
}

function validateDecisionChain(state: GovernanceState): void {
  const { registry, recipes, evidence, shadows, decisions } = state;
  const selected = decisions.get(registry.selection.decisionId);
  assert(selected, "registry selection references a missing decision");
  assert(selected.toRecipeId === registry.selection.primaryRecipeId, "selected decision does not authorize primary");
  assert(selected.rollbackRecipeId === registry.selection.rollbackRecipeId, "selected decision rollback differs from registry");

  for (const decision of decisions.values()) {
    assert(recipes.has(decision.fromRecipeId), `${decision.decisionId} from recipe missing`);
    assert(recipes.has(decision.toRecipeId), `${decision.decisionId} to recipe missing`);
    assert(recipes.has(decision.challengerRecipeId), `${decision.decisionId} challenger missing`);
    const baseline = decision.baselineEvidenceIds.map((id) => requiredMap(evidence, id));
    const challenger = decision.challengerEvidenceIds.map((id) => requiredMap(evidence, id));
    const shadow = decision.shadowEvidenceIds.map((id) => requiredMap(shadows, id));
    assert(decision.rationaleCodes.length > 0, `${decision.decisionId} needs rationale codes`);
    assert(
      baseline.every((item) => item.recipeId === decision.fromRecipeId),
      `${decision.decisionId} baseline recipe mismatch`,
    );
    assert(
      challenger.every((item) => item.recipeId === decision.challengerRecipeId),
      `${decision.decisionId} challenger evidence mismatch`,
    );
    assert(
      shadow.every(
        (item) =>
          decision.baselineEvidenceIds.includes(item.baselineEvidenceId) &&
          decision.challengerEvidenceIds.includes(item.challengerEvidenceId),
      ),
      `${decision.decisionId} shadow references evidence outside the decision`,
    );
    if (decision.decisionType === "retain_baseline") {
      assert(!decision.promotionAuthorized, "retain decision cannot authorize promotion");
      assert(decision.fromRecipeId === decision.toRecipeId, "retain decision must keep baseline");
      assert(decision.approvals.length === 0, "retain record does not masquerade as approval");
      continue;
    }
    validatePromotionDecision(
      decision,
      requiredMap(recipes, decision.fromRecipeId),
      requiredMap(recipes, decision.challengerRecipeId),
      baseline,
      challenger,
      shadow,
    );
    const prior = [...decisions.values()].some(
      (candidate) =>
        candidate.decisionId !== decision.decisionId &&
        candidate.toRecipeId === decision.fromRecipeId &&
        candidate.decidedAt <= decision.decidedAt,
    );
    assert(prior, `${decision.decisionId} has no prior-primary decision in the chain`);
  }
}

function validatePromotionDecision(
  decision: RecipeDecision,
  baselineRecipe: StoryRecipeManifest,
  challengerRecipe: StoryRecipeManifest,
  baseline: EvalEvidence[],
  challenger: EvalEvidence[],
  shadows: ShadowEvidence[],
): void {
  assert(decision.promotionAuthorized, "promotion decision must explicitly authorize promotion");
  assert(decision.fromRecipeId !== decision.toRecipeId, "promotion must change the primary");
  assert(decision.toRecipeId === decision.challengerRecipeId, "promoted recipe must be the challenger");
  assert(decision.rollbackRecipeId === decision.fromRecipeId, "rollback target must be prior primary");
  assert(
    challengerRecipe.manifestSchemaVersion !==
      STORY_RECIPE_MANIFEST_SCHEMA_V2,
    "manifest v2 recipes cannot be promoted until execution support is installed",
  );
  assert(decision.dataset.visibility === "protected_holdout", "promotion requires protected/blind holdout evidence");
  validateMatchingOnlyPromotion(baselineRecipe, challengerRecipe);
  const allEvidence = [...baseline, ...challenger];
  assert(
    allEvidence.every(
      (item) =>
        item.dataset.visibility === "protected_holdout" &&
        canonicalJson(item.dataset) === canonicalJson(decision.dataset) &&
        item.config.provider === "real" &&
        item.candidate === true &&
        !item.promotable &&
        !item.legacyImported,
    ),
    "promotion evidence must be real, non-legacy candidates on one protected holdout",
  );
  const catalogIdentities = new Set(
    allEvidence.map((item) => canonicalJson(item.catalog)),
  );
  assert(
    catalogIdentities.size === 1 && allEvidence[0]?.catalog,
    "promotion evidence must use one exact production-eligible catalog snapshot",
  );
  validateIndependentPromotionRuns("baseline", baseline);
  validateIndependentPromotionRuns("challenger", challenger);
  validateIndependentEvidenceIdentities(allEvidence);
  const baselineAggregate = aggregateMetrics(baseline);
  const challengerAggregate = aggregateMetrics(challenger);
  assert(
    challengerAggregate.overallTop1 > baselineAggregate.overallTop1,
    "promotion requires strict top-1 superiority",
  );
  assert(
    conservativeTop1SuperiorityLowerBound(
      baselineAggregate.overallCorrect,
      baselineAggregate.overallTotal,
      challengerAggregate.overallCorrect,
      challengerAggregate.overallTotal,
    ) > 0,
    "promotion requires a positive conservative 95% top-1 superiority bound",
  );
  assert(challenger.every((item) => item.metrics.trustGate.passed), "challenger trust gate failed");
  assert(challengerAggregate.definitiveWrong === 0, "challenger has definitive-wrong results");
  assert(
    challengerAggregate.hardConfusion <= baselineAggregate.hardConfusion,
    "challenger hard confusion is worse",
  );
  assert(
    challengerAggregate.missDetection >= baselineAggregate.missDetection,
    "challenger miss detection is worse",
  );
  assert(
    challengerAggregate.coverage >= baselineAggregate.coverage,
    "challenger provider coverage is worse",
  );
  assert(
    shadows.length >= RECIPE_PROMOTION_POLICY.minIndependentEvidenceRunsPerRecipe &&
      shadows.every(
        (item) =>
          item.candidate === true &&
          !item.promotable &&
          !item.legacyImported &&
          item.source === "offline_paired_holdout" &&
          item.gate.passed &&
          canonicalJson(item.dataset) === canonicalJson(decision.dataset),
      ),
    "promotion requires passing paired-shadow candidates",
  );
  validateIndependentShadowIdentities(shadows);
  const evaluatedCommit = allEvidence[0]?.provenance.gitCommit;
  const inputTreeSha256 = allEvidence[0]?.provenance.inputTreeSha256;
  assert(
    shadows.every(
      (item) =>
        item.provenance?.gitCommit === evaluatedCommit &&
        item.provenance.inputTreeSha256 === inputTreeSha256,
    ),
    "paired shadows must use the exact evidence commit and input tree",
  );
  const roles = new Set(decision.approvals.map((approval) => approval.role));
  const reviewers = new Set(
    decision.approvals.map((approval) => approval.reviewerId),
  );
  assert(
    decision.approvals.length === 3 &&
      roles.size === 3 &&
      roles.has("product") &&
      roles.has("matching") &&
      roles.has("safety_privacy") &&
      reviewers.size === 3 &&
      decision.approvals.every(
        (approval) => approval.approvedAt <= decision.decidedAt,
      ),
    "promotion requires product, matching, and safety/privacy approvals",
  );
}

function validateMatchingOnlyPromotion(
  baseline: StoryRecipeManifest,
  challenger: StoryRecipeManifest,
): void {
  const releaseBoundAxes = [
    "matchConfigVersion",
    "librarySnapshotSha256",
    "datasetVersion",
    "llmProvider",
    "proseModelId",
    "rerankPromptVersion",
    "storyPromptVersion",
    "storyTemperature",
    "storyComposerMode",
    "hybridStoryComposerEnabled",
    "composerVersion",
    "validatorVersion",
    "storySpecSchemaVersion",
    "boundaryPolicyVersion",
    "resonanceBriefVersion",
  ] as const satisfies ReadonlyArray<keyof StoryRecipeManifest>;
  for (const axis of releaseBoundAxes) {
    assert(
      canonicalJson(baseline[axis]) === canonicalJson(challenger[axis]),
      `selector promotion cannot change release-bound axis ${axis}`,
    );
  }
}

function validateIndependentPromotionRuns(
  label: "baseline" | "challenger",
  evidence: EvalEvidence[],
): void {
  const minimum = RECIPE_PROMOTION_POLICY.minIndependentEvidenceRunsPerRecipe;
  assert(evidence.length >= minimum, `promotion requires at least ${minimum} ${label} runs`);
  assert(
    new Set(evidence.map((item) => item.evidenceId)).size === evidence.length,
    `${label} evidence contains duplicate records`,
  );
  assert(
    new Set(evidence.map((item) => item.provenance.sourceRun)).size ===
      evidence.length,
    `${label} evidence runs are not independent`,
  );
  assert(
    new Set(evidence.map((item) => item.provenance.runId)).size ===
      evidence.length,
    `${label} evidence needs distinct trusted run identities`,
  );
  assert(
    new Set(evidence.map((item) => item.provenance.deploymentId)).size ===
      evidence.length,
    `${label} evidence needs distinct deployment identities`,
  );
  assert(
    new Set(evidence.map((item) => item.provenance.sourceRunSha256)).size ===
      evidence.length,
    `${label} evidence needs distinct bound source-run hashes`,
  );
  const commits = new Set(evidence.map((item) => item.provenance.gitCommit));
  assert(commits.size === 1, `${label} evidence spans multiple code commits`);
}

function validateIndependentEvidenceIdentities(evidence: EvalEvidence[]): void {
  assert(
    new Set(evidence.map((item) => item.provenance.gitCommit)).size === 1,
    "baseline and challenger evidence must use one exact evaluated commit",
  );
  assert(
    new Set(evidence.map((item) => item.provenance.inputTreeSha256)).size === 1,
    "baseline and challenger evidence must use one exact input tree",
  );
  for (const field of [
    "runId",
    "deploymentId",
    "sourceRun",
    "sourceRunSha256",
  ] as const) {
    assert(
      new Set(evidence.map((item) => item.provenance[field])).size ===
        evidence.length,
      `baseline and challenger evidence reuse ${field}`,
    );
  }
}

function validateIndependentShadowIdentities(shadows: ShadowEvidence[]): void {
  assert(
    new Set(shadows.map((item) => item.shadowId)).size === shadows.length,
    "shadow candidates contain duplicate identities",
  );
  assert(
    new Set(
      shadows.map(
        (item) => `${item.baselineEvidenceId}:${item.challengerEvidenceId}`,
      ),
    ).size === shadows.length,
    "shadow candidates reuse an evidence pair",
  );
  for (const field of ["shadowRunId", "deploymentId", "sourceRunSha256"] as const) {
    assert(
      shadows.every((item) => item.provenance !== undefined) &&
        new Set(shadows.map((item) => item.provenance?.[field])).size ===
          shadows.length,
      `shadow candidates need distinct ${field} identities`,
    );
  }
}

function conservativeTop1SuperiorityLowerBound(
  baselineCorrect: number,
  baselineTotal: number,
  challengerCorrect: number,
  challengerTotal: number,
): number {
  const baseline = wilsonBounds(baselineCorrect, baselineTotal);
  const challenger = wilsonBounds(challengerCorrect, challengerTotal);
  return challenger.lower - baseline.upper;
}

function wilsonBounds(
  successes: number,
  total: number,
): { lower: number; upper: number } {
  assert(total > 0, "Wilson interval requires a positive denominator");
  const z = RECIPE_PROMOTION_POLICY.superiorityConfidenceZ;
  const proportion = successes / total;
  const z2 = z * z;
  const denominator = 1 + z2 / total;
  const center = (proportion + z2 / (2 * total)) / denominator;
  const margin =
    (z *
      Math.sqrt(
        (proportion * (1 - proportion)) / total + z2 / (4 * total * total),
      )) /
    denominator;
  return { lower: center - margin, upper: center + margin };
}

function aggregateMetrics(items: EvalEvidence[]): {
  overallTop1: number;
  overallCorrect: number;
  overallTotal: number;
  hardConfusion: number;
  missDetection: number;
  coverage: number;
  definitiveWrong: number;
} {
  const sum = (selector: (item: EvalEvidence) => number) =>
    items.reduce((total, item) => total + selector(item), 0);
  const overallTotal = sum((item) => item.metrics.counts.overallTotal);
  const hardTotal = sum((item) => item.metrics.counts.hardTotal);
  const missTotal = sum((item) => item.metrics.counts.missTotal);
  const trialTotal = sum((item) => item.run.trialCount);
  assert(overallTotal > 0 && trialTotal > 0, "promotion evidence has empty denominators");
  const overallCorrect = sum((item) => item.metrics.counts.overallCorrect);
  return {
    overallTop1: overallCorrect / overallTotal,
    overallCorrect,
    overallTotal,
    hardConfusion:
      hardTotal === 0 ? 0 : sum((item) => item.metrics.counts.hardConfused) / hardTotal,
    missDetection:
      missTotal === 0 ? 1 : sum((item) => item.metrics.counts.missDetected) / missTotal,
    coverage: sum((item) => item.metrics.counts.rerankChosen) / trialTotal,
    definitiveWrong: sum((item) => item.metrics.calibration.definitiveWrong),
  };
}

function validateGeneratedDoc(registry: StoryRecipeRegistry): void {
  assert(existsSync(PRODUCTION_RECIPE_DOC_PATH), "generated production recipe doc is missing");
  const expected = renderProductionRecipeDoc(registry).replaceAll("\r\n", "\n");
  const actual = readFileSync(PRODUCTION_RECIPE_DOC_PATH, "utf8").replaceAll("\r\n", "\n");
  assert(actual === expected, "docs/production-recipe.md is stale or hand-edited");
}

function validateTrustedAttestorPolicy(): void {
  const result = spawnSync(
    process.execPath,
    ["scripts/trusted/recipe-promotion-attestor.mjs", "policy"],
    { cwd: process.cwd(), encoding: "utf8", windowsHide: true },
  );
  assert(
    result.status === 0,
    `could not read trusted attestor policy: ${result.stderr.trim()}`,
  );
  assert(
    result.stdout.trim() === canonicalJson(RECIPE_PROMOTION_POLICY),
    "trusted attestor promotion policy differs from runtime governance policy",
  );
}

function validateAppendOnlyDiff(): void {
  const base =
    process.env.RECIPE_GOVERNANCE_BASE_SHA?.trim() ||
    process.env.GITHUB_BASE_SHA?.trim();
  if (!base) return;
  const result = spawnSync(
    "git",
    [
      "diff",
      "--name-status",
      "--find-renames",
      `${base}...HEAD`,
      "--",
      "evals/history",
      "evals/shadow",
      "config/recipe-decisions",
    ],
    { cwd: process.cwd(), encoding: "utf8", windowsHide: true },
  );
  assert(result.status === 0, "could not inspect immutable evidence diff");
  for (const line of result.stdout.split(/\r?\n/).filter(Boolean)) {
    const status = line.split(/\s+/)[0];
    assert(status === "A", `immutable governance path changed with status ${status}: ${line}`);
  }
}

function runTamperSelfChecks(state: GovernanceState): void {
  const sample = state.evidence.values().next().value as EvalEvidence | undefined;
  assert(sample, "tamper self-check needs evidence");
  const tampered = structuredClone(sample) as EvalEvidence;
  tampered.metrics.overallTop1 = (tampered.metrics.overallTop1 ?? 0) / 2;
  assert(
    contentId("ev", tampered as unknown as Record<string, unknown>, "evidenceId") !==
      tampered.evidenceId,
    "content hash self-check did not detect tampering",
  );
  let extraKeyRejected = false;
  try {
    parseEvidence({ ...sample, unexpected: true }, "self-check");
  } catch {
    extraKeyRejected = true;
  }
  assert(extraKeyRejected, "exact-shape self-check did not reject an unknown key");
  const selected = state.decisions.get(state.registry.selection.decisionId)!;
  assert(
    selected.decisionType !== "promote_challenger" || selected.dataset.visibility === "protected_holdout",
    "synthetic evidence authorized a promotion",
  );
  runManifestV2SelfChecks(state);
}

function runManifestV2SelfChecks(state: GovernanceState): void {
  const baseline = requiredMap(
    state.recipes,
    state.registry.selection.primaryRecipeId,
  );
  const raw = {
    ...baseline,
    recipeId: "facetsrag-manifest-v2-self-check",
    manifestSha256: "0".repeat(64),
    retrievalMode: "facetsrag",
    embeddingModelId: "gemini-embedding-001@d1536",
    manifestSchemaVersion: STORY_RECIPE_MANIFEST_SCHEMA_V2,
    facetTagger: {
      mode: "closed_template",
      modelId: "gpt-oss-120b",
      promptVersion: "facet-tagger-prompt-v1-2026-07",
      temperature: 0,
      reasoningEffort: "low",
      timeoutMs: 3000,
      signalSchemaVersion: "facet-signal-v1-2026-07",
      projectionSchemaVersion:
        "facet-query-template-catalog-v1-2026-07",
      queryMode: "validated_projection",
      weightingMode: "static",
      expansionEnabled: false,
    },
  } satisfies StoryRecipeManifestV2;
  raw.manifestSha256 = manifestSha256(raw);
  const parsed = parseRecipe(raw, "self-check.manifestV2");
  assert(
    parsed.manifestSchemaVersion ===
      STORY_RECIPE_MANIFEST_SCHEMA_V2 &&
      manifestSha256(parsed) === raw.manifestSha256,
    "manifest v2 did not preserve its canonical identity",
  );

  const changedQueryMode: StoryRecipeManifestV2 = {
    ...raw,
    facetTagger: {
      ...raw.facetTagger,
      queryMode: "raw",
    },
  };
  assert(
    manifestSha256(changedQueryMode) !== raw.manifestSha256,
    "manifest v2 hash omitted nested facet-tagger axes",
  );

  let nestedExtraRejected = false;
  try {
    parseRecipe(
      {
        ...raw,
        facetTagger: { ...raw.facetTagger, unexpected: true },
      },
      "self-check.manifestV2Extra",
    );
  } catch {
    nestedExtraRejected = true;
  }
  assert(
    nestedExtraRejected,
    "manifest v2 accepted an unknown facet-tagger key",
  );

  let evalRejected = false;
  try {
    recipeForEval(
      { ...state.registry, recipes: [...state.registry.recipes, parsed] },
      "facetsrag",
      parsed.recipeId,
    );
  } catch (error) {
    evalRejected =
      error instanceof Error &&
      error.message.includes("v2 execution support is not installed");
  }
  assert(evalRejected, "manifest v2 reached the eval execution path");

  const selectedDecision = requiredMap(
    state.decisions,
    state.registry.selection.decisionId,
  );
  const promotionProbe: RecipeDecision = {
    ...selectedDecision,
    decisionType: "promote_challenger",
    fromRecipeId: baseline.recipeId,
    toRecipeId: parsed.recipeId,
    challengerRecipeId: parsed.recipeId,
    rollbackRecipeId: baseline.recipeId,
    promotionAuthorized: true,
  };
  let promotionRejectedBeforeEvidence = false;
  try {
    validatePromotionDecision(
      promotionProbe,
      baseline,
      parsed,
      [],
      [],
      [],
    );
  } catch (error) {
    promotionRejectedBeforeEvidence =
      error instanceof Error &&
      error.message.includes("manifest v2 recipes cannot be promoted");
  }
  assert(
    promotionRejectedBeforeEvidence,
    "manifest v2 promotion was not rejected before evidence validation",
  );
}

function parseDataset(value: unknown, path: string): {
  version: string;
  sha256: string;
  visibility: DatasetVisibility;
} {
  const dataset = record(value, path);
  exactKeys(dataset, ["version", "sha256", "visibility"], path);
  return {
    version: registryVersionId(dataset.version, `${path}.version`),
    sha256: sha(dataset.sha256, `${path}.sha256`),
    visibility: oneOf(
      dataset.visibility,
      ["synthetic", "protected_holdout"] as const,
      `${path}.visibility`,
    ),
  };
}

function jsonFiles(root: string): string[] {
  if (!existsSync(root)) return [];
  const files: string[] = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = resolve(root, entry.name);
    if (entry.isDirectory()) files.push(...jsonFiles(path));
    else if (entry.isFile() && entry.name.endsWith(".json")) files.push(path);
  }
  return files.sort();
}

function readJson(path: string): unknown {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as unknown;
  } catch (error) {
    throw new Error(
      `${relative(process.cwd(), path)} is not valid JSON: ${error instanceof Error ? error.message : "parse error"}`,
    );
  }
}

function exactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
  path: string,
): void {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  assert(
    canonicalJson(actual) === canonicalJson(wanted),
    `${path} keys must be exactly ${wanted.join(", ")}; got ${actual.join(", ")}`,
  );
}

function record(value: unknown, path: string): Record<string, unknown> {
  assert(typeof value === "object" && value !== null && !Array.isArray(value), `${path} must be an object`);
  return value as Record<string, unknown>;
}

function array(value: unknown, path: string): unknown[] {
  assert(Array.isArray(value), `${path} must be an array`);
  return value;
}

function string(value: unknown, path: string): string {
  assert(typeof value === "string" && value.length > 0, `${path} must be a non-empty string`);
  return value;
}

function registryVersionId(value: unknown, path: string): string {
  const result = string(value, path);
  assert(
    REGISTRY_VERSION_ID.test(result),
    `${path} is not a registry/version identifier`,
  );
  return result;
}

function modelId(value: unknown, path: string): string {
  const result = string(value, path);
  assert(MODEL_ID.test(result), `${path} is not a model identifier`);
  return result;
}

function deploymentId(value: unknown, path: string): string {
  const result = string(value, path);
  assert(DEPLOYMENT_ID.test(result), `${path} is not a deployment identifier`);
  return result;
}

function safeId(value: unknown, path: string): string {
  const result = string(value, path);
  assert(SAFE_ID.test(result), `${path} is not a safe identifier`);
  return result;
}

function evidenceId(value: unknown, path: string): string {
  const result = string(value, path);
  assert(EVIDENCE_ID.test(result), `${path} is not an evidence ID`);
  return result;
}

function idArray(value: unknown, pattern: RegExp, path: string): string[] {
  const result = array(value, path).map((entry, index) => string(entry, `${path}[${index}]`));
  assert(result.length > 0, `${path} must not be empty`);
  assert(new Set(result).size === result.length, `${path} contains duplicates`);
  assert(result.every((entry) => pattern.test(entry)), `${path} contains an invalid ID`);
  return result;
}

function nullableSafeString(value: unknown, path: string): string | null {
  if (value === null) return null;
  const result = string(value, path);
  assert(result.length <= 256 && !/[\r\n]/.test(result), `${path} is not a bounded safe string`);
  return result;
}

function nullableDeploymentId(value: unknown, path: string): string | null {
  return value === null ? null : deploymentId(value, path);
}

function sha(value: unknown, path: string): string {
  const result = string(value, path);
  assert(SHA256.test(result), `${path} must be a lowercase SHA-256`);
  return result;
}

function fullGitCommit(value: unknown, path: string): string {
  const result = string(value, path);
  assert(FULL_GIT_COMMIT.test(result), `${path} must be a full git commit`);
  return result;
}

function iso(value: unknown, path: string): string {
  const result = string(value, path);
  assert(ISO_DATE.test(result) && !Number.isNaN(Date.parse(result)), `${path} must be UTC ISO time`);
  return result;
}

function finite(value: unknown, path: string): number {
  assert(typeof value === "number" && Number.isFinite(value), `${path} must be finite`);
  return value;
}

function integer(value: unknown, path: string): number {
  const result = finite(value, path);
  assert(Number.isInteger(result), `${path} must be an integer`);
  return result;
}

function nonnegativeInteger(value: unknown, path: string): number {
  const result = integer(value, path);
  assert(result >= 0, `${path} must be nonnegative`);
  return result;
}

function positiveInteger(value: unknown, path: string): number {
  const result = integer(value, path);
  assert(result > 0, `${path} must be positive`);
  return result;
}

function ratio(value: unknown, path: string): number {
  const result = finite(value, path);
  assert(result >= 0 && result <= 1, `${path} must be in [0,1]`);
  return result;
}

function ratioValue(value: unknown, path: string): number | null {
  return value === null ? null : ratio(value, path);
}

function boolean(value: unknown, path: string): boolean {
  assert(typeof value === "boolean", `${path} must be boolean`);
  return value;
}

function literal<T extends string | number | boolean>(
  value: unknown,
  expected: T,
  path: string,
): T {
  assert(value === expected, `${path} must equal ${String(expected)}`);
  return expected;
}

function oneOf<const T extends readonly string[]>(
  value: unknown,
  allowed: T,
  path: string,
): T[number] {
  assert(typeof value === "string" && allowed.includes(value), `${path} must be one of ${allowed.join(", ")}`);
  return value as T[number];
}

function assertRatio(
  value: number | null,
  numerator: number,
  denominator: number,
  path: string,
): void {
  const expected = denominator === 0 ? null : numerator / denominator;
  if (value === null || expected === null) {
    assert(value === expected, `${path} nullability differs from its denominator`);
    return;
  }
  assertClose(value, expected, path);
}

function assertClose(actual: number, expected: number, path: string): void {
  assert(Math.abs(actual - expected) <= EPSILON, `${path} expected ${expected}, got ${actual}`);
}

function metricDelta(challenger: number | null, baseline: number | null): number {
  assert(challenger !== null && baseline !== null, "shadow comparison metric is null");
  return challenger - baseline;
}

function requiredMap<T>(map: Map<string, T>, id: string): T {
  const value = map.get(id);
  assert(value !== undefined, `missing referenced record ${id}`);
  return value;
}

function samePath(left: string, right: string): boolean {
  const normalize = (value: string) =>
    resolve(value).split(sep).join("/").toLowerCase();
  return normalize(left) === normalize(right);
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

try {
  main();
} catch (error) {
  console.error(
    `Recipe governance: FAIL — ${error instanceof Error ? error.message : "unknown error"}`,
  );
  process.exit(1);
}
