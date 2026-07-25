#!/usr/bin/env node

// SECURITY BOUNDARY
// -----------------
// This dependency-free program must be loaded from the protected base ref,
// never from the pull-request checkout. It reads candidate data only through
// `git show <immutable-commit>:<fixed-path>` and never imports or executes
// candidate code. The protected environment secret is exposed only to this
// process. Ordinary eval/governance scripts deliberately have no authority.

import { createHash, createHmac } from "node:crypto";
import { spawnSync } from "node:child_process";

const SHA256 = /^[a-f0-9]{64}$/;
const COMMIT = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/;
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:@-]{0,127}$/;
const REGISTRY_ID = /^[a-z0-9][a-z0-9._-]{0,127}$/;
const MODEL_ID = /^[a-z0-9][a-z0-9._/@:-]{0,127}$/;
const DEPLOYMENT_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const EVIDENCE_ID = /^ev_[a-f0-9]{64}$/;
const SHADOW_ID = /^sh_[a-f0-9]{64}$/;
const DECISION_ID = /^rd_[a-f0-9]{64}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const TRUSTED_BASE_REF = "main";
const STORY_RECIPE_MANIFEST_SCHEMA_V2 = "story-recipe-manifest-v2";
const RECIPE_MANIFEST_V1_KEYS = Object.freeze([
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
]);
const RECIPE_MANIFEST_V2_KEYS = Object.freeze([
  ...RECIPE_MANIFEST_V1_KEYS,
  "manifestSchemaVersion",
  "facetTagger",
]);
const FACET_TAGGER_KEYS = Object.freeze([
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
]);
const POLICY_SHA256 =
  "4c2fcc31640394956aa1556a606b199e5a541a1c8c31a08d1812ab9da077932e";
const POLICY = Object.freeze({
  minIndependentEvidenceRunsPerRecipe: 2,
  minKPerEvidence: 2,
  minNonMissCasesPerEvidence: 95,
  minMissCasesPerEvidence: 3,
  minHardCasesPerEvidence: 40,
  minStability: 0.95,
  maxP95LatencyMs: 15_000,
  superiorityConfidenceZ: 1.96,
  trustGate: Object.freeze({
    minCoverage: 0.95,
    minRerankTop1: 0.971,
    minOverallTop1: 0.971,
    minMissDetection: 1,
    maxDefinitiveWrong: 0,
    maxHardConfusion: 0,
  }),
});

function fail(message) {
  throw new Error(`trusted recipe attestation failed: ${message}`);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function canonical(value) {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    assert(Number.isFinite(value), "canonical JSON rejects non-finite numbers");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  assert(typeof value === "object", "canonical JSON rejects unsupported values");
  return `{${Object.keys(value)
    .sort()
    .map((key) => {
      assert(value[key] !== undefined, `canonical JSON rejects undefined at ${key}`);
      return `${JSON.stringify(key)}:${canonical(value[key])}`;
    })
    .join(",")}}`;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function contentId(prefix, value, idKey) {
  const payload = { ...value };
  delete payload[idKey];
  return `${prefix}_${sha256(canonical(payload))}`;
}

function git(repository, args, allowFailure = false) {
  const result = spawnSync("git", args, {
    cwd: repository,
    encoding: "utf8",
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0 && !allowFailure) {
    fail(`git ${args[0]} failed`);
  }
  return result.status === 0 ? result.stdout : null;
}

function requireCommit(repository, commit, label) {
  assert(COMMIT.test(commit), `${label} is not a full commit`);
  assert(
    git(repository, ["cat-file", "-e", `${commit}^{commit}`], true) !== null,
    `${label} is unavailable`,
  );
}

function readAt(repository, commit, path) {
  assert(
    !path.startsWith("/") && !path.includes("..") && !path.includes("\\"),
    `unsafe repository path ${path}`,
  );
  const value = git(repository, ["show", `${commit}:${path}`], true);
  assert(value !== null, `${path} is missing at ${commit}`);
  return value;
}

function readJsonAt(repository, commit, path) {
  const text = readAt(repository, commit, path);
  try {
    return JSON.parse(text);
  } catch {
    fail(`${path} is not valid JSON`);
  }
}

function record(value, label) {
  assert(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  return value;
}

function array(value, label) {
  assert(Array.isArray(value), `${label} must be an array`);
  return value;
}

function safeId(value, label) {
  assert(typeof value === "string" && SAFE_ID.test(value), `${label} is not a safe id`);
  return value;
}

function registryId(value, label) {
  assert(
    typeof value === "string" && REGISTRY_ID.test(value),
    `${label} is not a lowercase registry id`,
  );
  return value;
}

function modelId(value, label) {
  assert(
    typeof value === "string" && MODEL_ID.test(value),
    `${label} is not a lowercase model id`,
  );
  return value;
}

function deploymentId(value, label) {
  assert(
    typeof value === "string" && DEPLOYMENT_ID.test(value),
    `${label} is not a safe deployment id`,
  );
  return value;
}

function exactKeys(value, expected, label) {
  const actual = Object.keys(record(value, label)).sort();
  const wanted = [...expected].sort();
  assert(canonical(actual) === canonical(wanted), `${label} has an unexpected shape`);
}

function boolean(value, label) {
  assert(typeof value === "boolean", `${label} must be a boolean`);
  return value;
}

function finite(value, label) {
  assert(typeof value === "number" && Number.isFinite(value), `${label} must be finite`);
  return value;
}

function integer(value, label) {
  assert(Number.isSafeInteger(value), `${label} must be a safe integer`);
  return value;
}

function nonnegativeInteger(value, label) {
  integer(value, label);
  assert(value >= 0, `${label} must be nonnegative`);
  return value;
}

function positiveInteger(value, label) {
  integer(value, label);
  assert(value > 0, `${label} must be positive`);
  return value;
}

function ratioValue(value, label) {
  if (value === null) return null;
  finite(value, label);
  assert(value >= 0 && value <= 1, `${label} must be in [0, 1]`);
  return value;
}

function sha(value, label) {
  assert(typeof value === "string" && SHA256.test(value), `${label} must be a SHA-256`);
  return value;
}

function utcTimestamp(value, label) {
  assert(typeof value === "string" && ISO_DATE.test(value), `${label} must be UTC ISO`);
  const milliseconds = Date.parse(value);
  assert(Number.isFinite(milliseconds), `${label} is not a real timestamp`);
  const normalizedInput = value.includes(".")
    ? value
    : value.replace(/Z$/, ".000Z");
  assert(
    new Date(milliseconds).toISOString() === normalizedInput,
    `${label} is not a canonical timestamp`,
  );
  return milliseconds;
}

function unique(values, label) {
  assert(new Set(values).size === values.length, `${label} contains duplicates`);
  return values;
}

function sortedCsv(values) {
  return [...values].sort().join(",");
}

function envExact(name, expected) {
  assert(
    process.env[name]?.trim() === expected,
    `${name} does not bind the candidate (expected ${expected})`,
  );
}

function validateDataset(value, label) {
  const dataset = record(value, label);
  exactKeys(dataset, ["version", "sha256", "visibility"], label);
  registryId(dataset.version, `${label}.version`);
  sha(dataset.sha256, `${label}.sha256`);
  assert(
    dataset.visibility === "synthetic" ||
      dataset.visibility === "protected_holdout",
    `${label}.visibility is unknown`,
  );
  return dataset;
}

function validateCatalog(value, label) {
  const catalog = record(value, label);
  exactKeys(catalog, ["sha256", "eligibleStageCount", "source"], label);
  sha(catalog.sha256, `${label}.sha256`);
  positiveInteger(catalog.eligibleStageCount, `${label}.eligibleStageCount`);
  assert(
    catalog.source === "supabase_published_story_specs",
    `${label}.source is not production-equivalent`,
  );
  return catalog;
}

function validateRecipeManifest(value, label) {
  const recipe = record(value, label);
  const isV2 = Object.hasOwn(recipe, "manifestSchemaVersion");
  exactKeys(
    recipe,
    isV2 ? RECIPE_MANIFEST_V2_KEYS : RECIPE_MANIFEST_V1_KEYS,
    label,
  );
  for (const key of [
    "recipeId",
    "matchConfigVersion",
    "datasetVersion",
    "rerankPromptVersion",
    "storyPromptVersion",
    "rerankReasoningEffort",
    "composerVersion",
    "validatorVersion",
    "storySpecSchemaVersion",
    "boundaryPolicyVersion",
    "resonanceBriefVersion",
  ]) {
    registryId(recipe[key], `${label}.${key}`);
  }
  modelId(recipe.rerankModelId, `${label}.rerankModelId`);
  modelId(recipe.proseModelId, `${label}.proseModelId`);
  sha(recipe.manifestSha256, `${label}.manifestSha256`);
  sha(recipe.librarySnapshotSha256, `${label}.librarySnapshotSha256`);
  assert(
    recipe.retrievalMode === "keyword" ||
      recipe.retrievalMode === "facetsrag",
    `${label}.retrievalMode is unknown`,
  );
  assert(recipe.llmProvider === "real", `${label}.llmProvider must be real`);
  if (recipe.embeddingModelId !== null) {
    modelId(recipe.embeddingModelId, `${label}.embeddingModelId`);
  }
  assert(
    recipe.retrievalMode === "keyword"
      ? recipe.embeddingModelId === null
      : recipe.embeddingModelId !== null,
    `${label}.embeddingModelId does not match retrieval mode`,
  );
  finite(recipe.rerankTemperature, `${label}.rerankTemperature`);
  positiveInteger(recipe.rerankTopK, `${label}.rerankTopK`);
  finite(recipe.storyTemperature, `${label}.storyTemperature`);
  assert(
    recipe.storyComposerMode === "canonical",
    `${label}.storyComposerMode is unknown`,
  );
  assert(
    boolean(
      recipe.hybridStoryComposerEnabled,
      `${label}.hybridStoryComposerEnabled`,
    ) === false,
    `${label}.hybridStoryComposerEnabled must be false`,
  );
  if (isV2) {
    assert(
      recipe.manifestSchemaVersion === STORY_RECIPE_MANIFEST_SCHEMA_V2,
      `${label}.manifestSchemaVersion is unknown`,
    );
    const facetTagger = record(recipe.facetTagger, `${label}.facetTagger`);
    exactKeys(facetTagger, FACET_TAGGER_KEYS, `${label}.facetTagger`);
    assert(
      facetTagger.mode === "closed_template",
      `${label}.facetTagger.mode is unknown`,
    );
    modelId(facetTagger.modelId, `${label}.facetTagger.modelId`);
    for (const key of [
      "promptVersion",
      "reasoningEffort",
      "signalSchemaVersion",
      "projectionSchemaVersion",
    ]) {
      registryId(facetTagger[key], `${label}.facetTagger.${key}`);
    }
    assert(
      finite(
        facetTagger.temperature,
        `${label}.facetTagger.temperature`,
      ) === 0,
      `${label}.facetTagger.temperature must be zero`,
    );
    assert(
      positiveInteger(
        facetTagger.timeoutMs,
        `${label}.facetTagger.timeoutMs`,
      ) === 3_000,
      `${label}.facetTagger.timeoutMs must be 3000`,
    );
    assert(
      facetTagger.queryMode === "raw" ||
        facetTagger.queryMode === "validated_projection",
      `${label}.facetTagger.queryMode is unknown`,
    );
    assert(
      facetTagger.weightingMode === "static" ||
        facetTagger.weightingMode === "bounded_dynamic",
      `${label}.facetTagger.weightingMode is unknown`,
    );
    assert(
      boolean(
        facetTagger.expansionEnabled,
        `${label}.facetTagger.expansionEnabled`,
      ) === false,
      `${label}.facetTagger.expansionEnabled must be false`,
    );
    assert(
      recipe.retrievalMode === "facetsrag" &&
        recipe.embeddingModelId !== null,
      `${label} v2 requires FacetsRAG with an embedder`,
    );
  }
  assert(
    manifestHash(recipe) === recipe.manifestSha256,
    `${label}.manifestSha256 does not match its exact manifest`,
  );
  return recipe;
}

function validatePromotionHistory(promotions, recipeIds, label) {
  const recipeHistory = new Set();
  const decisionHistory = new Set();
  let priorTime = Number.NEGATIVE_INFINITY;
  for (let index = 0; index < promotions.length; index += 1) {
    const promotion = record(promotions[index], `${label}[${index}]`);
    exactKeys(
      promotion,
      ["recipeId", "decisionId", "promotedAt"],
      `${label}[${index}]`,
    );
    registryId(promotion.recipeId, `${label}[${index}].recipeId`);
    assert(
      DECISION_ID.test(promotion.decisionId),
      `${label}[${index}].decisionId is invalid`,
    );
    const promotedAt = utcTimestamp(
      promotion.promotedAt,
      `${label}[${index}].promotedAt`,
    );
    assert(recipeIds.has(promotion.recipeId), `${label}[${index}] references an unknown recipe`);
    assert(
      !recipeHistory.has(promotion.recipeId),
      `${label} re-promotes recipe ${promotion.recipeId}`,
    );
    assert(
      !decisionHistory.has(promotion.decisionId),
      `${label} repeats decision ${promotion.decisionId}`,
    );
    assert(promotedAt > priorTime, `${label} timestamps are not strictly increasing`);
    recipeHistory.add(promotion.recipeId);
    decisionHistory.add(promotion.decisionId);
    priorTime = promotedAt;
  }
  return { recipeHistory, decisionHistory };
}

function registryAt(repository, commit) {
  const registry = record(
    readJsonAt(repository, commit, "config/story-recipes.json"),
    "recipe registry",
  );
  exactKeys(
    registry,
    ["schemaVersion", "datasets", "selection", "promotions", "recipes"],
    "recipe registry",
  );
  assert(registry.schemaVersion === "story-recipe-registry-v1", "unknown registry schema");
  const selection = record(registry.selection, "registry selection");
  exactKeys(
    selection,
    ["primaryRecipeId", "rollbackRecipeId", "decisionId"],
    "registry selection",
  );
  registryId(selection.primaryRecipeId, "registry selection.primaryRecipeId");
  registryId(selection.rollbackRecipeId, "registry selection.rollbackRecipeId");
  assert(
    DECISION_ID.test(selection.decisionId),
    "registry selection.decisionId is invalid",
  );
  const datasets = array(registry.datasets, "registry datasets");
  assert(datasets.length > 0, "registry has no datasets");
  const datasetMap = mapBy(
    datasets.map((item, index) =>
      validateDataset(item, `registry datasets[${index}]`),
    ),
    "version",
    "registry datasets",
  );
  const recipes = array(registry.recipes, "registry recipes");
  assert(recipes.length > 0, "registry has no recipes");
  const recipeMap = mapBy(
    recipes.map((item, index) =>
      validateRecipeManifest(item, `registry recipes[${index}]`),
    ),
    "recipeId",
    "registry recipes",
  );
  for (const recipe of recipeMap.values()) {
    assert(
      datasetMap.has(recipe.datasetVersion),
      `recipe ${recipe.recipeId} references an unknown dataset`,
    );
  }
  assert(
    recipeMap.has(selection.primaryRecipeId) &&
      recipeMap.has(selection.rollbackRecipeId),
    "registry selection references an unknown recipe",
  );
  const promotions = array(registry.promotions, "registry promotions");
  assert(promotions.length > 0, "registry has no promotion history");
  const history = validatePromotionHistory(
    promotions,
    new Set(recipeMap.keys()),
    "registry promotions",
  );
  const latest = promotions.at(-1);
  assert(latest.recipeId === selection.primaryRecipeId, "selected primary is not the latest promotion");
  assert(latest.decisionId === selection.decisionId, "selected decision is not the latest promotion");
  assert(
    history.decisionHistory.has(selection.decisionId),
    "selected decision is absent from promotion history",
  );
  return registry;
}

function promotionDiff(base, head) {
  const basePromotions = array(base.promotions, "base promotions");
  const headPromotions = array(head.promotions, "head promotions");
  assert(
    headPromotions.length >= basePromotions.length,
    "promotion history was truncated",
  );
  for (let index = 0; index < basePromotions.length; index += 1) {
    assert(
      canonical(basePromotions[index]) === canonical(headPromotions[index]),
      "existing promotion history changed",
    );
  }
  const added = headPromotions.slice(basePromotions.length);
  assert(added.length <= 1, "at most one recipe may be promoted per change");
  if (added.length === 1) {
    const priorRecipes = new Set(basePromotions.map((item) => item.recipeId));
    const priorDecisions = new Set(basePromotions.map((item) => item.decisionId));
    assert(
      !priorRecipes.has(added[0].recipeId),
      `recipe ${added[0].recipeId} was already promoted`,
    );
    assert(
      !priorDecisions.has(added[0].decisionId),
      `decision ${added[0].decisionId} was already used`,
    );
  }
  return added;
}

function promotionRequired(base, head) {
  const added = promotionDiff(base, head);
  const selectionChanged = canonical(base.selection) !== canonical(head.selection);
  if (added.length === 0) {
    assert(
      !selectionChanged,
      "recipe selection changed without one appended promotion",
    );
    return false;
  }
  assert(selectionChanged, "an appended promotion did not update selection");
  return true;
}

function assertRegistryHistoryAppendOnly(base, head) {
  for (const [key, idKey] of [
    ["datasets", "version"],
    ["recipes", "recipeId"],
  ]) {
    const prior = mapBy(base[key], idKey, `base ${key}`);
    const current = mapBy(head[key], idKey, `head ${key}`);
    for (const [id, value] of prior) {
      assert(current.has(id), `${key} removed existing ${id}`);
      assert(
        canonical(current.get(id)) === canonical(value),
        `${key} modified existing ${id}`,
      );
    }
  }
}

function assertProtectedHistoryFilesAppendOnly(repository, baseSha, headSha) {
  const output = git(repository, [
    "diff",
    "--name-status",
    "--find-renames",
    baseSha,
    headSha,
    "--",
    "evals/history",
    "evals/shadow",
    "config/recipe-decisions",
    "supabase/migrations",
  ]);
  const violations = output
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((line) => !line.startsWith("A\t"));
  assert(
    violations.length === 0,
    `immutable evidence/decision/migration history changed: ${violations.join(", ")}`,
  );
}

function assertPromptReleaseHistoryAppendOnly(repository, baseSha, headSha) {
  const path = "config/prompt-releases.json";
  const baseText = git(repository, ["show", `${baseSha}:${path}`], true);
  if (baseText === null) return;
  const headText = readAt(repository, headSha, path);
  let base;
  let head;
  try {
    base = record(JSON.parse(baseText), "base prompt release registry");
    head = record(JSON.parse(headText), "head prompt release registry");
  } catch {
    fail("prompt release registry is not valid JSON");
  }
  exactKeys(base, ["schemaVersion", "rerank", "story"], "base prompt release registry");
  exactKeys(head, ["schemaVersion", "rerank", "story"], "head prompt release registry");
  assert(
    base.schemaVersion === "prompt-release-registry-v1" &&
      head.schemaVersion === base.schemaVersion,
    "prompt release registry schema changed",
  );
  for (const kind of ["rerank", "story"]) {
    const prior = array(base[kind], `base ${kind} prompt releases`);
    const current = array(head[kind], `head ${kind} prompt releases`);
    assert(current.length >= prior.length, `${kind} prompt history was truncated`);
    for (let index = 0; index < prior.length; index += 1) {
      assert(
        canonical(current[index]) === canonical(prior[index]),
        `${kind} prompt release history changed at index ${index}`,
      );
    }
  }
}

function mainDetect(repository, baseSha, headSha) {
  requireCommit(repository, baseSha, "base SHA");
  requireCommit(repository, headSha, "head SHA");
  const base = registryAt(repository, baseSha);
  const head = registryAt(repository, headSha);
  assertRegistryHistoryAppendOnly(base, head);
  assertProtectedHistoryFilesAppendOnly(repository, baseSha, headSha);
  assertPromptReleaseHistoryAppendOnly(repository, baseSha, headSha);
  process.stdout.write(promotionRequired(base, head) ? "true" : "false");
}

function manifestHash(recipe) {
  const payload = { ...recipe };
  delete payload.manifestSha256;
  return sha256(canonical(payload));
}

function assertPromotionRegistrationSupported(recipe) {
  const manifest = record(recipe, "registration recipe");
  assert(
    !Object.hasOwn(manifest, "manifestSchemaVersion") &&
      !Object.hasOwn(manifest, "facetTagger"),
    "story-recipe-manifest-v2 cannot be promoted until exact v2 database identity registration is installed",
  );
}

function mapBy(items, key, label) {
  const result = new Map();
  for (const item of array(items, label)) {
    const id =
      key === "recipeId" || key === "version"
        ? registryId(record(item, label)[key], `${label}.${key}`)
        : safeId(record(item, label)[key], `${label}.${key}`);
    assert(!result.has(id), `${label} repeats ${id}`);
    result.set(id, item);
  }
  return result;
}

function assertSameRegistryCatalog(base, head) {
  assert(canonical(base.datasets) === canonical(head.datasets), "promotion PR changed datasets");
  assert(canonical(base.recipes) === canonical(head.recipes), "promotion PR changed recipe manifests");
}

function changedPaths(repository, baseSha, headSha) {
  const output = git(repository, [
    "diff",
    "--name-status",
    "--find-renames",
    baseSha,
    headSha,
  ]);
  return output
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const fields = line.split("\t");
      assert(fields.length === 2, `rename/copy is forbidden in a promotion PR: ${line}`);
      return { status: fields[0], path: fields[1] };
    });
}

function validatePromotionOnlyDiff(changes, decisionId) {
  const decisionPath = `config/recipe-decisions/${decisionId}.json`;
  const allowedExact = new Set([
    "config/story-recipes.json",
    decisionPath,
    "docs/production-recipe.md",
  ]);
  const migrations = [];
  for (const change of changes) {
    if (/^supabase\/migrations\/\d{4}_[A-Za-z0-9_-]+\.sql$/.test(change.path)) {
      assert(change.status === "A", "promotion registration migration must be new");
      migrations.push(change.path);
      continue;
    }
    assert(allowedExact.has(change.path), `promotion PR changes forbidden path ${change.path}`);
    if (change.path === decisionPath) {
      assert(change.status === "A", "promotion decision must be newly appended");
    } else {
      assert(change.status === "M", `${change.path} must be modified, not replaced`);
    }
  }
  assert(changes.some((item) => item.path === decisionPath), "promotion decision is missing");
  assert(changes.some((item) => item.path === "config/story-recipes.json"), "registry change is missing");
  assert(changes.some((item) => item.path === "docs/production-recipe.md"), "generated recipe doc is missing");
  assert(migrations.length === 1, "promotion PR needs exactly one registration migration");
  return migrations[0];
}

function validateDecisionShape(decision) {
  exactKeys(
    decision,
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
    "promotion decision",
  );
  assert(decision.schemaVersion === "recipe-decision-v1", "unknown decision schema");
  assert(DECISION_ID.test(decision.decisionId), "invalid decision id");
  assert(contentId("rd", decision, "decisionId") === decision.decisionId, "decision content hash mismatch");
  assert(decision.decisionType === "promote_challenger", "decision is not a challenger promotion");
  assert(decision.promotionAuthorized === true, "decision does not declare promotion intent");
  utcTimestamp(decision.decidedAt, "decision time");
  validateDataset(decision.dataset, "decision dataset");
  for (const field of [
    "fromRecipeId",
    "toRecipeId",
    "challengerRecipeId",
    "rollbackRecipeId",
  ]) {
    registryId(decision[field], `decision.${field}`);
  }
  for (const [field, pattern] of [
    ["baselineEvidenceIds", EVIDENCE_ID],
    ["challengerEvidenceIds", EVIDENCE_ID],
    ["shadowEvidenceIds", SHADOW_ID],
  ]) {
    const ids = array(decision[field], `decision.${field}`);
    assert(ids.length > 0, `decision.${field} is empty`);
    unique(ids, `decision.${field}`);
    for (const id of ids) {
      assert(
        typeof id === "string" && pattern.test(id),
        `decision.${field} contains an invalid id`,
      );
    }
  }
  const rationaleCodes = array(decision.rationaleCodes, "rationale codes");
  assert(rationaleCodes.length > 0, "decision needs rationale");
  unique(rationaleCodes, "rationale codes");
  for (const code of rationaleCodes) registryId(code, "rationale code");
  array(decision.approvals, "decision approvals");
}

function validateApprovals(decision) {
  const approvals = array(decision.approvals, "approvals");
  assert(approvals.length === 3, "promotion needs exactly three approvals");
  const byRole = new Map();
  for (const approval of approvals) {
    exactKeys(approval, ["role", "reviewerId", "approvedAt"], "approval");
    assert(
      ["product", "matching", "safety_privacy"].includes(approval.role),
      "unknown approval role",
    );
    assert(!byRole.has(approval.role), `duplicate ${approval.role} approval`);
    safeId(approval.reviewerId, "reviewer id");
    assert(
      utcTimestamp(approval.approvedAt, "approval time") <=
        utcTimestamp(decision.decidedAt, "decision time"),
      "approval post-dates decision",
    );
    byRole.set(approval.role, approval);
  }
  assert(
    new Set(approvals.map((item) => item.reviewerId.toLowerCase())).size === 3,
    "reviewers must be independent",
  );
  envExact("RECIPE_PROMOTION_PRODUCT_REVIEWER_ID", byRole.get("product").reviewerId);
  envExact("RECIPE_PROMOTION_MATCHING_REVIEWER_ID", byRole.get("matching").reviewerId);
  envExact(
    "RECIPE_PROMOTION_SAFETY_PRIVACY_REVIEWER_ID",
    byRole.get("safety_privacy").reviewerId,
  );
  return approvals;
}

async function githubJson(apiUrl, repository, token, path) {
  const response = await fetch(`${apiUrl}/repos/${repository}${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  assert(response.ok, `GitHub API ${path} returned ${response.status}`);
  return response.json();
}

async function validateAuthenticatedHeadReviews(
  approvals,
  baseSha,
  headSha,
) {
  const token = process.env.GITHUB_REVIEW_TOKEN?.trim();
  const repository = process.env.GITHUB_REPOSITORY?.trim();
  const pullNumber = process.env.GITHUB_PR_NUMBER?.trim();
  const apiUrl = process.env.GITHUB_API_URL?.trim() || "https://api.github.com";
  assert(token, "read-only GitHub review token is missing");
  assert(repository && /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository), "invalid GitHub repository identity");
  assert(pullNumber && /^\d+$/.test(pullNumber), "invalid pull request number");

  const pull = record(
    await githubJson(
      apiUrl,
      repository,
      token,
      `/pulls/${pullNumber}`,
    ),
    "GitHub pull request",
  );
  assert(pull.state === "open", "promotion pull request is not open");
  assert(pull.draft === false, "promotion pull request is still a draft");
  assert(pull.head?.sha === headSha, "GitHub pull request head changed");
  assert(pull.base?.sha === baseSha, "GitHub pull request base changed");
  assert(pull.base?.ref === TRUSTED_BASE_REF, "GitHub pull request targets the wrong branch");
  assert(
    pull.base?.repo?.full_name?.toLowerCase() === repository.toLowerCase(),
    "GitHub pull request base repository changed",
  );
  const protectedRef = record(
    await githubJson(
      apiUrl,
      repository,
      token,
      `/git/ref/heads/${encodeURIComponent(TRUSTED_BASE_REF)}`,
    ),
    "GitHub protected ref",
  );
  assert(
    protectedRef.object?.type === "commit" &&
      protectedRef.object?.sha === baseSha,
    "protected base advanced after attestation started",
  );

  const reviews = [];
  for (let page = 1; page <= 10; page += 1) {
    const pageReviews = await githubJson(
      apiUrl,
      repository,
      token,
      `/pulls/${pullNumber}/reviews?per_page=100&page=${page}`,
    );
    assert(Array.isArray(pageReviews), "GitHub review API returned an invalid body");
    reviews.push(...pageReviews);
    if (pageReviews.length < 100) break;
    assert(page < 10, "GitHub review pagination exceeded the attestor bound");
  }

  const latestByLogin = new Map();
  for (const review of reviews) {
    if (!review || typeof review !== "object") continue;
    const login = review.user?.login;
    if (typeof login !== "string") continue;
    const normalized = login.toLowerCase();
    const existing = latestByLogin.get(normalized);
    const id = Number(review.id);
    if (!Number.isSafeInteger(id)) continue;
    if (!existing || id > existing.id) latestByLogin.set(normalized, review);
  }
  return approvals.map((approval) => {
    const review = latestByLogin.get(approval.reviewerId.toLowerCase());
    assert(review, `${approval.role} reviewer has no GitHub review`);
    assert(review.state === "APPROVED", `${approval.role} review is not currently approved`);
    assert(review.commit_id === headSha, `${approval.role} approval is stale for the current head`);
    assert(ISO_DATE.test(review.submitted_at), `${approval.role} review has an invalid timestamp`);
    return {
      role: approval.role,
      login: review.user.login,
      reviewId: review.id,
      state: review.state,
      commitId: review.commit_id,
      submittedAt: review.submitted_at,
    };
  });
}

function validateMatchingOnly(baseRecipe, challenger) {
  for (const axis of [
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
  ]) {
    assert(canonical(baseRecipe[axis]) === canonical(challenger[axis]), `promotion changes release-bound ${axis}`);
  }
}

function resolvePromotionDataset(datasets, decisionDataset) {
  const dataset = datasets.get(decisionDataset.version);
  assert(
    dataset,
    `promotion dataset ${decisionDataset.version} is not registered`,
  );
  assert(
    canonical(dataset) === canonical(decisionDataset),
    "decision dataset differs from registry",
  );
  assert(
    dataset.visibility === "protected_holdout",
    "promotion dataset is not protected holdout",
  );
  return dataset;
}

function parseEvidence(repository, commit, datasetVersion, recipeId, evidenceId) {
  assert(EVIDENCE_ID.test(evidenceId), "invalid evidence id");
  const path = `evals/history/${datasetVersion}/${recipeId}/${evidenceId}.json`;
  const evidence = record(readJsonAt(repository, commit, path), path);
  exactKeys(
    evidence,
    [
      "schemaVersion",
      "harnessVersion",
      "evidenceId",
      "recipeId",
      "recipeManifestSha256",
      "dataset",
      "catalog",
      "run",
      "config",
      "metrics",
      "provenance",
      "legacyImported",
      "candidate",
      "promotable",
    ],
    path,
  );
  assert(evidence.evidenceId === evidenceId, `${path} has the wrong evidence id`);
  assert(contentId("ev", evidence, "evidenceId") === evidenceId, `${evidenceId} content hash mismatch`);
  assert(evidence.schemaVersion === "match-eval-evidence-v1", "unknown evidence schema");
  assert(evidence.harnessVersion === "match-eval-harness-v2-2026-07", "unknown eval harness");
  assert(boolean(evidence.legacyImported, `${path}.legacyImported`) === false, `${evidenceId} is legacy`);
  assert(boolean(evidence.candidate, `${path}.candidate`) === true, `${evidenceId} is not a candidate`);
  assert(boolean(evidence.promotable, `${path}.promotable`) === false, `${evidenceId} self-asserts authority`);
  registryId(evidence.recipeId, `${path}.recipeId`);
  sha(evidence.recipeManifestSha256, `${path}.recipeManifestSha256`);
  validateDataset(evidence.dataset, `${path}.dataset`);

  validateCatalog(evidence.catalog, `${path}.catalog`);

  const run = record(evidence.run, `${path}.run`);
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
  const startedAt = utcTimestamp(run.startedAt, `${path}.run.startedAt`);
  const completedAt = utcTimestamp(run.completedAt, `${path}.run.completedAt`);
  assert(completedAt >= startedAt, `${path}.run completed before it started`);
  positiveInteger(run.k, `${path}.run.k`);
  positiveInteger(run.concurrency, `${path}.run.concurrency`);
  nonnegativeInteger(run.maxRetries, `${path}.run.maxRetries`);
  positiveInteger(run.caseCount, `${path}.run.caseCount`);
  positiveInteger(run.trialCount, `${path}.run.trialCount`);
  assert(
    Number.isSafeInteger(run.caseCount * run.k),
    `${path}.run case/trial product is unsafe`,
  );
  assert(run.trialCount === run.caseCount * run.k, `${path}.run trial count mismatch`);

  const config = record(evidence.config, `${path}.config`);
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
  assert(config.provider === "real", `${path}.config.provider must be real`);
  modelId(config.model, `${path}.config.model`);
  assert(
    config.retrievalMode === "keyword" ||
      config.retrievalMode === "facetsrag",
    `${path}.config.retrievalMode is unknown`,
  );
  if (config.embeddingModelId !== null) {
    modelId(config.embeddingModelId, `${path}.config.embeddingModelId`);
  }
  assert(
    config.retrievalMode === "keyword"
      ? config.embeddingModelId === null
      : config.embeddingModelId !== null,
    `${path}.config.embeddingModelId does not match retrieval mode`,
  );
  registryId(config.matchConfigVersion, `${path}.config.matchConfigVersion`);
  finite(config.rerankTemperature, `${path}.config.rerankTemperature`);
  registryId(
    config.rerankReasoningEffort,
    `${path}.config.rerankReasoningEffort`,
  );
  positiveInteger(config.rerankTopK, `${path}.config.rerankTopK`);

  const provenance = record(evidence.provenance, `${path}.provenance`);
  exactKeys(
    provenance,
    [
      "gitCommit",
      "deploymentId",
      "sourceRun",
      "runId",
      "sourceRunSha256",
      "inputTreeSha256",
    ],
    `${path}.provenance`,
  );
  assert(
    typeof provenance.gitCommit === "string" &&
      COMMIT.test(provenance.gitCommit),
    `${path}.provenance.gitCommit is not a full commit`,
  );
  deploymentId(
    provenance.deploymentId,
    `${path}.provenance.deploymentId`,
  );
  safeId(provenance.sourceRun, `${path}.provenance.sourceRun`);
  safeId(provenance.runId, `${path}.provenance.runId`);
  sha(provenance.sourceRunSha256, `${path}.provenance.sourceRunSha256`);
  sha(provenance.inputTreeSha256, `${path}.provenance.inputTreeSha256`);
  validateMetrics(evidence);
  return { evidence, path };
}

function ratio(value, correct, total, label) {
  const expected = total === 0 ? null : correct / total;
  if (expected === null) assert(value === null, `${label} should be null`);
  else assert(typeof value === "number" && Math.abs(value - expected) <= 1e-12, `${label} arithmetic mismatch`);
}

function validateMetrics(evidence) {
  const metrics = record(evidence.metrics, "evidence metrics");
  exactKeys(
    metrics,
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
    "evidence metrics",
  );
  for (const field of [
    "rerankTop1",
    "overallTop1",
    "missDetection",
    "hardConfusion",
    "goldSurvivalStageA",
    "goldSurvivalStageB",
    "stability",
  ]) {
    ratioValue(metrics[field], `evidence metrics.${field}`);
  }
  const counts = record(metrics.counts, "metric counts");
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
    "metric counts",
  );
  for (const field of Object.keys(counts)) {
    nonnegativeInteger(counts[field], `metric counts.${field}`);
  }
  const calibration = record(metrics.calibration, "calibration");
  exactKeys(
    calibration,
    ["definitiveCorrect", "definitiveWrong", "partialCorrect", "partialWrong"],
    "calibration",
  );
  for (const field of Object.keys(calibration)) {
    nonnegativeInteger(calibration[field], `calibration.${field}`);
  }
  const latency = record(metrics.latency, "latency");
  exactKeys(latency, ["p50Ms", "p95Ms"], "latency");
  nonnegativeInteger(latency.p50Ms, "latency.p50Ms");
  nonnegativeInteger(latency.p95Ms, "latency.p95Ms");
  const gate = record(metrics.trustGate, "trust gate");
  exactKeys(gate, ["passed", "coverage", "checks", "thresholds"], "trust gate");
  boolean(gate.passed, "trust gate.passed");
  ratioValue(gate.coverage, "trust gate.coverage");
  const gateChecks = record(gate.checks, "trust gate checks");
  exactKeys(
    gateChecks,
    [
      "coverage",
      "rerankTop1",
      "missDetection",
      "noDefinitiveWrong",
      "top1",
      "hardConfusion",
    ],
    "trust gate checks",
  );
  for (const field of Object.keys(gateChecks)) {
    boolean(gateChecks[field], `trust gate checks.${field}`);
  }
  const thresholds = record(gate.thresholds, "trust gate thresholds");
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
    "trust gate thresholds",
  );
  for (const field of [
    "minCoverage",
    "minRerankTop1",
    "minOverallTop1",
    "minMissDetection",
    "maxHardConfusion",
  ]) {
    ratioValue(thresholds[field], `trust gate thresholds.${field}`);
    assert(thresholds[field] !== null, `trust gate thresholds.${field} cannot be null`);
  }
  nonnegativeInteger(
    thresholds.maxDefinitiveWrong,
    "trust gate thresholds.maxDefinitiveWrong",
  );
  assert(canonical(gate.thresholds) === canonical(POLICY.trustGate), "trust thresholds differ from locked policy");
  ratio(metrics.rerankTop1, counts.rerankCorrect, counts.rerankTotal, "rerank top-1");
  ratio(metrics.overallTop1, counts.overallCorrect, counts.overallTotal, "overall top-1");
  ratio(metrics.missDetection, counts.missDetected, counts.missTotal, "miss detection");
  ratio(metrics.hardConfusion, counts.hardConfused, counts.hardTotal, "hard confusion");
  ratio(
    metrics.goldSurvivalStageA,
    counts.survivedStageA,
    counts.survivalTotal,
    "stage-A survival",
  );
  ratio(
    metrics.goldSurvivalStageB,
    counts.survivedStageB,
    counts.survivalTotal,
    "stage-B survival",
  );
  ratio(gate.coverage, counts.rerankChosen, evidence.run.trialCount, "coverage");
  assert(counts.rerankCorrect <= counts.rerankTotal, "rerank correct exceeds total");
  assert(counts.overallCorrect <= counts.overallTotal, "overall correct exceeds total");
  assert(counts.missDetected <= counts.missTotal, "miss detected exceeds total");
  assert(counts.hardConfused <= counts.hardTotal, "hard confusion exceeds total");
  assert(counts.survivedStageA <= counts.survivalTotal, "stage-A survival exceeds total");
  assert(counts.survivedStageB <= counts.survivalTotal, "stage-B survival exceeds total");
  assert(counts.survivedStageB <= counts.survivedStageA, "stage-B survival exceeds stage A");
  assert(counts.rerankTotal <= counts.overallTotal, "rerank total exceeds non-miss total");
  assert(counts.rerankTotal <= counts.rerankChosen, "rerank non-miss total exceeds rerank choices");
  assert(counts.hardTotal <= counts.overallTotal, "hard total exceeds non-miss total");
  assert(counts.survivalTotal <= counts.overallTotal, "survival total exceeds non-miss total");
  assert(
    counts.rerankChosen + counts.keywordFallback === evidence.run.trialCount,
    "chosen-path counts differ from trial count",
  );
  assert(
    counts.overallTotal + counts.missTotal === evidence.run.trialCount,
    "miss/non-miss counts differ from trial count",
  );
  assert(
    calibration.definitiveCorrect +
      calibration.definitiveWrong +
      calibration.partialCorrect +
      calibration.partialWrong ===
      counts.overallTotal,
    "calibration total differs from non-miss total",
  );
  assert(
    calibration.definitiveCorrect + calibration.partialCorrect ===
      counts.overallCorrect,
    "calibration correct counts differ from overall correct",
  );
  assert(
    counts.hardConfused <= counts.overallTotal - counts.overallCorrect,
    "hard confusion exceeds all incorrect results",
  );
  assert(latency.p50Ms <= latency.p95Ms, "p50 latency exceeds p95");
  const checks = {
    coverage: gate.coverage !== null && gate.coverage >= POLICY.trustGate.minCoverage,
    rerankTop1: metrics.rerankTop1 !== null && metrics.rerankTop1 >= POLICY.trustGate.minRerankTop1,
    missDetection: metrics.missDetection === null || metrics.missDetection >= POLICY.trustGate.minMissDetection,
    noDefinitiveWrong: calibration.definitiveWrong <= POLICY.trustGate.maxDefinitiveWrong,
    top1: metrics.overallTop1 !== null && metrics.overallTop1 >= POLICY.trustGate.minOverallTop1,
    hardConfusion: metrics.hardConfusion === null || metrics.hardConfusion <= POLICY.trustGate.maxHardConfusion,
  };
  assert(canonical(checks) === canonical(gate.checks), "trust checks do not recompute");
  assert(gate.passed === Object.values(checks).every(Boolean), "trust result does not recompute");
  assert(gate.passed, "candidate trust gate failed");
  assert(evidence.run.k >= POLICY.minKPerEvidence, "candidate k is too small");
  assert(counts.overallTotal >= POLICY.minNonMissCasesPerEvidence * evidence.run.k, "too few non-miss trials");
  assert(counts.missTotal >= POLICY.minMissCasesPerEvidence * evidence.run.k, "too few miss trials");
  assert(counts.hardTotal >= POLICY.minHardCasesPerEvidence * evidence.run.k, "too few hard trials");
  assert(
    metrics.stability !== null &&
      metrics.stability >= POLICY.minStability,
    "candidate stability is too low",
  );
  assert(latency.p95Ms <= POLICY.maxP95LatencyMs, "candidate latency is too high");
  assert(calibration.definitiveWrong === 0, "candidate contains definitive-wrong output");
}

function treeHash(repository, commit) {
  return sha256(git(repository, ["ls-tree", "-r", "--full-tree", commit]));
}

function assertRecipeInputsAtEvaluatedCommit(
  repository,
  commit,
  recipe,
  dataset,
) {
  const evaluatedRegistry = registryAt(repository, commit);
  const evaluatedRecipes = mapBy(
    evaluatedRegistry.recipes,
    "recipeId",
    "evaluated recipes",
  );
  const evaluatedDatasets = mapBy(
    evaluatedRegistry.datasets,
    "version",
    "evaluated datasets",
  );
  const evaluatedRecipe = evaluatedRecipes.get(recipe.recipeId);
  const evaluatedDataset = evaluatedDatasets.get(dataset.version);
  assert(
    evaluatedRecipe &&
      canonical(evaluatedRecipe) === canonical(recipe),
    `evaluated commit does not contain exact recipe ${recipe.recipeId}`,
  );
  assert(
    evaluatedDataset &&
      canonical(evaluatedDataset) === canonical(dataset),
    `evaluated commit does not contain exact dataset ${dataset.version}`,
  );
}

function validateEvidence(
  repository,
  baseSha,
  evidence,
  recipe,
  decisionDataset,
  decisionTime,
) {
  assert(canonical(evidence.dataset) === canonical(decisionDataset), "evidence dataset mismatch");
  assert(evidence.dataset.visibility === "protected_holdout", "evidence is not protected holdout");
  assert(evidence.recipeId === recipe.recipeId, "evidence recipe mismatch");
  assert(evidence.recipeManifestSha256 === recipe.manifestSha256, "evidence manifest mismatch");
  assert(evidence.config.provider === "real", "evidence did not use real provider");
  assert(evidence.config.model === recipe.rerankModelId, "evidence rerank model mismatch");
  assert(evidence.config.retrievalMode === recipe.retrievalMode, "evidence retrieval mismatch");
  assert(evidence.config.embeddingModelId === recipe.embeddingModelId, "evidence embedder mismatch");
  assert(evidence.config.matchConfigVersion === recipe.matchConfigVersion, "evidence config mismatch");
  assert(evidence.config.rerankTemperature === recipe.rerankTemperature, "evidence temperature mismatch");
  assert(evidence.config.rerankReasoningEffort === recipe.rerankReasoningEffort, "evidence effort mismatch");
  assert(evidence.config.rerankTopK === recipe.rerankTopK, "evidence top-K mismatch");
  validateCatalog(evidence.catalog, "evidence catalog");
  const provenance = record(evidence.provenance, "evidence provenance");
  requireCommit(repository, provenance.gitCommit, "evaluated commit");
  assert(
    git(repository, ["merge-base", "--is-ancestor", provenance.gitCommit, baseSha], true) !== null,
    "evaluated commit is not in protected base history",
  );
  assert(provenance.inputTreeSha256 === treeHash(repository, provenance.gitCommit), "input tree is not bound to evaluated commit");
  assertRecipeInputsAtEvaluatedCommit(
    repository,
    provenance.gitCommit,
    recipe,
    decisionDataset,
  );
  safeId(provenance.runId, "provenance runId");
  deploymentId(provenance.deploymentId, "provenance deploymentId");
  safeId(provenance.sourceRun, "provenance sourceRun");
  assert(SHA256.test(provenance.sourceRunSha256), "invalid source-run hash");
  assert(provenance.runId !== provenance.deploymentId, "run and deployment ids are reused");
  assert(provenance.runId !== provenance.gitCommit, "run id reuses commit identity");
  assert(provenance.deploymentId !== provenance.gitCommit, "deployment id reuses commit identity");
  assert(evidence.run.trialCount === evidence.run.caseCount * evidence.run.k, "trial count mismatch");
  assert(
    utcTimestamp(evidence.run.completedAt, "evidence completion time") <=
      decisionTime,
    "evidence completed after the promotion decision",
  );
}

function metricDelta(challenger, baseline, key) {
  assert(challenger.metrics[key] !== null && baseline.metrics[key] !== null, `${key} is null`);
  return challenger.metrics[key] - baseline.metrics[key];
}

function parseShadow(repository, commit, datasetVersion, shadowId) {
  assert(SHADOW_ID.test(shadowId), "invalid shadow id");
  const path = `evals/shadow/${datasetVersion}/${shadowId}.json`;
  const shadow = record(readJsonAt(repository, commit, path), path);
  exactKeys(
    shadow,
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
      "provenance",
      "legacyImported",
      "candidate",
      "promotable",
    ],
    path,
  );
  assert(shadow.shadowId === shadowId, `${path} has the wrong shadow id`);
  assert(contentId("sh", shadow, "shadowId") === shadowId, `${shadowId} content hash mismatch`);
  assert(shadow.schemaVersion === "recipe-shadow-evidence-v1", "unknown shadow schema");
  assert(boolean(shadow.legacyImported, `${path}.legacyImported`) === false, "shadow is legacy");
  assert(boolean(shadow.candidate, `${path}.candidate`) === true, "shadow is not a candidate");
  assert(boolean(shadow.promotable, `${path}.promotable`) === false, "shadow self-asserts authority");
  validateDataset(shadow.dataset, `${path}.dataset`);
  utcTimestamp(shadow.createdAt, `${path}.createdAt`);
  assert(shadow.source === "offline_paired_holdout", `${path}.source is not paired holdout`);
  assert(
    typeof shadow.baselineEvidenceId === "string" &&
      EVIDENCE_ID.test(shadow.baselineEvidenceId),
    `${path}.baselineEvidenceId is invalid`,
  );
  assert(
    typeof shadow.challengerEvidenceId === "string" &&
      EVIDENCE_ID.test(shadow.challengerEvidenceId),
    `${path}.challengerEvidenceId is invalid`,
  );
  assert(
    shadow.baselineEvidenceId !== shadow.challengerEvidenceId,
    `${path} compares one evidence record to itself`,
  );
  const comparison = record(shadow.comparison, `${path}.comparison`);
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
  for (const field of Object.keys(comparison)) {
    finite(comparison[field], `${path}.comparison.${field}`);
  }
  integer(
    comparison.definitiveWrongDelta,
    `${path}.comparison.definitiveWrongDelta`,
  );
  assert(
    boolean(shadow.outputsServedToUsers, `${path}.outputsServedToUsers`) ===
        false &&
      boolean(
        shadow.disclosuresPersisted,
        `${path}.disclosuresPersisted`,
      ) === false,
    `${path} leaked to product paths`,
  );
  const gate = record(shadow.gate, `${path}.gate`);
  exactKeys(gate, ["passed", "checks"], `${path}.gate`);
  boolean(gate.passed, `${path}.gate.passed`);
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
  for (const field of Object.keys(checks)) {
    boolean(checks[field], `${path}.gate.checks.${field}`);
  }
  const provenance = record(shadow.provenance, `${path}.provenance`);
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
  assert(
    typeof provenance.gitCommit === "string" &&
      COMMIT.test(provenance.gitCommit),
    `${path}.provenance.gitCommit is not a full commit`,
  );
  deploymentId(
    provenance.deploymentId,
    `${path}.provenance.deploymentId`,
  );
  safeId(provenance.shadowRunId, `${path}.provenance.shadowRunId`);
  sha(provenance.sourceRunSha256, `${path}.provenance.sourceRunSha256`);
  sha(provenance.inputTreeSha256, `${path}.provenance.inputTreeSha256`);
  return { shadow, path };
}

function validateShadow(
  repository,
  baseSha,
  shadow,
  baseline,
  challenger,
  dataset,
  decisionTime,
) {
  assert(canonical(shadow.dataset) === canonical(dataset), "shadow dataset mismatch");
  assert(shadow.source === "offline_paired_holdout", "shadow is not paired holdout");
  assert(shadow.outputsServedToUsers === false && shadow.disclosuresPersisted === false, "shadow leaked to product paths");
  assert(shadow.baselineEvidenceId === baseline.evidenceId, "shadow baseline mismatch");
  assert(shadow.challengerEvidenceId === challenger.evidenceId, "shadow challenger mismatch");
  const comparison = {
    overallTop1Delta: metricDelta(challenger, baseline, "overallTop1"),
    hardConfusionDelta: metricDelta(challenger, baseline, "hardConfusion"),
    definitiveWrongDelta:
      challenger.metrics.calibration.definitiveWrong - baseline.metrics.calibration.definitiveWrong,
    missDetectionDelta: metricDelta(challenger, baseline, "missDetection"),
    coverageDelta:
      challenger.metrics.trustGate.coverage - baseline.metrics.trustGate.coverage,
  };
  for (const key of Object.keys(comparison)) {
    assert(Math.abs(shadow.comparison[key] - comparison[key]) <= 1e-12, `shadow ${key} mismatch`);
  }
  const checks = {
    sameDataset: true,
    strictTop1Superiority: comparison.overallTop1Delta > 0,
    trustGatePassed: challenger.metrics.trustGate.passed,
    noDefinitiveWrong: challenger.metrics.calibration.definitiveWrong === 0,
    hardConfusionNoWorse: comparison.hardConfusionDelta <= 0,
    missDetectionNoWorse: comparison.missDetectionDelta >= 0,
    coverageNoWorse: comparison.coverageDelta >= 0,
  };
  assert(canonical(shadow.gate.checks) === canonical(checks), "shadow checks do not recompute");
  assert(shadow.gate.passed === true && Object.values(checks).every(Boolean), "shadow gate failed");
  const provenance = record(shadow.provenance, "shadow provenance");
  assert(
    provenance.gitCommit === baseline.provenance.gitCommit &&
      provenance.gitCommit === challenger.provenance.gitCommit,
    "shadow and paired evidence use different evaluated commits",
  );
  assert(
    provenance.inputTreeSha256 === baseline.provenance.inputTreeSha256 &&
      provenance.inputTreeSha256 === challenger.provenance.inputTreeSha256,
    "shadow and paired evidence use different input trees",
  );
  requireCommit(repository, provenance.gitCommit, "shadow evaluated commit");
  assert(
    git(repository, ["merge-base", "--is-ancestor", provenance.gitCommit, baseSha], true) !== null,
    "shadow commit is not in protected base history",
  );
  assert(provenance.inputTreeSha256 === treeHash(repository, provenance.gitCommit), "shadow input tree mismatch");
  safeId(provenance.shadowRunId, "shadow shadowRunId");
  deploymentId(provenance.deploymentId, "shadow deploymentId");
  assert(SHA256.test(provenance.sourceRunSha256), "invalid shadow source hash");
  assert(provenance.shadowRunId !== provenance.deploymentId, "shadow run/deployment identities are reused");
  assert(
    utcTimestamp(shadow.createdAt, "shadow creation time") <= decisionTime,
    "shadow was created after the promotion decision",
  );
}

function aggregate(items) {
  const sum = (selector) => items.reduce((total, item) => total + selector(item), 0);
  const overallCorrect = sum((item) => item.metrics.counts.overallCorrect);
  const overallTotal = sum((item) => item.metrics.counts.overallTotal);
  const hardTotal = sum((item) => item.metrics.counts.hardTotal);
  const missTotal = sum((item) => item.metrics.counts.missTotal);
  const trialTotal = sum((item) => item.run.trialCount);
  return {
    overallCorrect,
    overallTotal,
    overallTop1: overallCorrect / overallTotal,
    hardConfusion: sum((item) => item.metrics.counts.hardConfused) / hardTotal,
    missDetection: sum((item) => item.metrics.counts.missDetected) / missTotal,
    coverage: sum((item) => item.metrics.counts.rerankChosen) / trialTotal,
    definitiveWrong: sum((item) => item.metrics.calibration.definitiveWrong),
  };
}

function wilson(successes, total) {
  const z = POLICY.superiorityConfidenceZ;
  const p = successes / total;
  const z2 = z * z;
  const denominator = 1 + z2 / total;
  const center = (p + z2 / (2 * total)) / denominator;
  const margin =
    (z * Math.sqrt((p * (1 - p)) / total + z2 / (4 * total * total))) /
    denominator;
  return { lower: center - margin, upper: center + margin };
}

function assertAggregateSuperiority(baseline, challenger) {
  const left = aggregate(baseline);
  const right = aggregate(challenger);
  assert(right.overallTop1 > left.overallTop1, "challenger is not strictly superior");
  assert(
    wilson(right.overallCorrect, right.overallTotal).lower -
      wilson(left.overallCorrect, left.overallTotal).upper >
      0,
    "challenger lacks conservative 95% superiority",
  );
  assert(right.definitiveWrong === 0, "challenger has definitive-wrong results");
  assert(right.hardConfusion <= left.hardConfusion, "hard confusion regressed");
  assert(right.missDetection >= left.missDetection, "miss detection regressed");
  assert(right.coverage >= left.coverage, "provider coverage regressed");
}

function assertDistinct(items, selector, label) {
  assert(new Set(items.map(selector)).size === items.length, `${label} identities are not independent`);
}

function assertBaseObjectUnchanged(repository, baseSha, headSha, path) {
  assert(readAt(repository, baseSha, path) === readAt(repository, headSha, path), `${path} changed in promotion PR`);
}

function sqlScalar(value) {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    assert(Number.isFinite(value), "registration migration contains a non-finite number");
    return String(value);
  }
  assert(typeof value === "string" && !value.includes("'"), "registration value is not a safe literal");
  return `'${value}'`;
}

function renderRegistrationMigration(recipe, decision) {
  assertPromotionRegistrationSupported(recipe);
  const values = [
    recipe.recipeId,
    recipe.manifestSha256,
    recipe.datasetVersion,
    recipe.matchConfigVersion,
    recipe.librarySnapshotSha256,
    recipe.retrievalMode,
    recipe.llmProvider,
    recipe.rerankModelId,
    recipe.proseModelId,
    recipe.embeddingModelId,
    recipe.rerankPromptVersion,
    recipe.storyPromptVersion,
    recipe.rerankTemperature,
    recipe.rerankReasoningEffort,
    recipe.rerankTopK,
    recipe.storyTemperature,
    recipe.storyComposerMode,
    recipe.hybridStoryComposerEnabled,
    recipe.composerVersion,
    recipe.validatorVersion,
    recipe.storySpecSchemaVersion,
    recipe.boundaryPolicyVersion,
    recipe.resonanceBriefVersion,
    decision.decisionId,
  ].map((value) => sqlScalar(value));
  values.push(`${sqlScalar(decision.decidedAt)}::timestamptz`);
  return [
    "-- Generated story-recipe promotion registration. Do not add statements.",
    "begin;",
    "",
    "select public.register_story_recipe_v1(",
    ...values.map((value, index) => `  ${value}${index === values.length - 1 ? "" : ","}`),
    ");",
    "",
    "commit;",
    "",
  ].join("\n");
}

function nextMigrationPrefix(paths) {
  const prefixes = [];
  for (const path of paths) {
    if (!path.endsWith(".sql")) continue;
    const match = /^supabase\/migrations\/(\d{4})_[A-Za-z0-9_-]+\.sql$/.exec(
      path,
    );
    assert(match, `migration has a non-canonical filename: ${path}`);
    prefixes.push(Number(match[1]));
  }
  assert(prefixes.length > 0, "protected base has no SQL migrations");
  unique(prefixes, "protected-base migration prefixes");
  const next = Math.max(...prefixes) + 1;
  assert(next <= 9999, "migration prefix space is exhausted");
  return String(next).padStart(4, "0");
}

function migrationPathsAt(repository, commit) {
  return git(repository, [
    "ls-tree",
    "-r",
    "--name-only",
    commit,
    "--",
    "supabase/migrations",
  ])
    .split(/\r?\n/)
    .filter(Boolean);
}

function validateMigration(
  repository,
  baseSha,
  headSha,
  path,
  recipe,
  decision,
) {
  const fileName = path.split("/").at(-1);
  const expectedPrefix = nextMigrationPrefix(
    migrationPathsAt(repository, baseSha),
  );
  assert(
    fileName && fileName.slice(0, 4) === expectedPrefix,
    `promotion migration must use the next protected-base prefix ${expectedPrefix}`,
  );
  const sql = readAt(repository, headSha, path);
  assert(
    sql === renderRegistrationMigration(recipe, decision),
    "registration migration must equal the generated single-call transaction exactly",
  );
  return sha256(sql);
}

async function mainAttest(repository, baseSha, headSha) {
  assert(process.env.CI === "true" && process.env.GITHUB_ACTIONS === "true", "attestor requires GitHub Actions CI");
  assert(process.env.GITHUB_EVENT_NAME === "pull_request_target", "promotion authority requires base-owned pull_request_target");
  assert(process.env.GITHUB_BASE_REF === TRUSTED_BASE_REF, `promotion PR must target ${TRUSTED_BASE_REF}`);
  envExact("RECIPE_PROMOTION_ATTESTED_HEAD_SHA", headSha);
  const token = process.env.RECIPE_PROMOTION_ENVIRONMENT_TOKEN?.trim();
  assert(token && Buffer.byteLength(token, "utf8") >= 32, "protected environment token is missing");
  requireCommit(repository, baseSha, "base SHA");
  requireCommit(repository, headSha, "head SHA");
  assert(git(repository, ["merge-base", "--is-ancestor", baseSha, headSha], true) !== null, "base is not an ancestor of head");

  const base = registryAt(repository, baseSha);
  const head = registryAt(repository, headSha);
  assertSameRegistryCatalog(base, head);
  const added = promotionDiff(base, head);
  assert(added.length === 1, "there is no single new promotion to attest");
  const promotion = record(added[0], "new promotion");
  registryId(promotion.recipeId, "promoted recipe");
  assert(DECISION_ID.test(promotion.decisionId), "promotion has invalid decision id");
  assert(ISO_DATE.test(promotion.promotedAt), "promotion has invalid time");
  const baseSelection = record(base.selection, "base selection");
  const headSelection = record(head.selection, "head selection");
  assert(headSelection.primaryRecipeId === promotion.recipeId, "new promotion is not selected primary");
  assert(headSelection.rollbackRecipeId === baseSelection.primaryRecipeId, "rollback is not the base primary");
  assert(headSelection.decisionId === promotion.decisionId, "selection decision mismatch");

  const decisionPath = `config/recipe-decisions/${promotion.decisionId}.json`;
  const decision = record(readJsonAt(repository, headSha, decisionPath), "promotion decision");
  validateDecisionShape(decision);
  assert(decision.decisionId === promotion.decisionId, "promotion decision id mismatch");
  assert(decision.decidedAt === promotion.promotedAt, "promotion time differs from decision");
  assert(decision.fromRecipeId === baseSelection.primaryRecipeId, "decision does not start from base primary");
  assert(decision.rollbackRecipeId === baseSelection.primaryRecipeId, "decision rollback is not base primary");
  assert(decision.toRecipeId === promotion.recipeId && decision.challengerRecipeId === promotion.recipeId, "decision target mismatch");
  envExact("RECIPE_PROMOTION_ATTESTED_DECISION_ID", decision.decisionId);
  const decisionTime = utcTimestamp(decision.decidedAt, "decision time");

  const migrationPath = validatePromotionOnlyDiff(
    changedPaths(repository, baseSha, headSha),
    decision.decisionId,
  );
  const recipes = mapBy(head.recipes, "recipeId", "recipes");
  const baselineRecipe = record(recipes.get(baseSelection.primaryRecipeId), "baseline recipe");
  const challengerRecipe = record(recipes.get(promotion.recipeId), "challenger recipe");
  assertPromotionRegistrationSupported(challengerRecipe);
  assert(manifestHash(baselineRecipe) === baselineRecipe.manifestSha256, "baseline manifest hash mismatch");
  assert(manifestHash(challengerRecipe) === challengerRecipe.manifestSha256, "challenger manifest hash mismatch");
  validateMatchingOnly(baselineRecipe, challengerRecipe);
  const registrationMigrationSha256 = validateMigration(
    repository,
    baseSha,
    headSha,
    migrationPath,
    challengerRecipe,
    decision,
  );

  const datasets = mapBy(head.datasets, "version", "datasets");
  const dataset = resolvePromotionDataset(datasets, decision.dataset);
  envExact("RECIPE_PROMOTION_ATTESTED_DATASET_SHA256", dataset.sha256);

  const baselineIds = unique(array(decision.baselineEvidenceIds, "baseline evidence ids"), "baseline evidence ids");
  const challengerIds = unique(array(decision.challengerEvidenceIds, "challenger evidence ids"), "challenger evidence ids");
  assert(baselineIds.length >= POLICY.minIndependentEvidenceRunsPerRecipe, "too few baseline evidence runs");
  assert(challengerIds.length >= POLICY.minIndependentEvidenceRunsPerRecipe, "too few challenger evidence runs");
  const baseline = baselineIds.map((id) => {
    const parsed = parseEvidence(repository, headSha, dataset.version, baselineRecipe.recipeId, id);
    assertBaseObjectUnchanged(repository, baseSha, headSha, parsed.path);
    validateEvidence(
      repository,
      baseSha,
      parsed.evidence,
      baselineRecipe,
      dataset,
      decisionTime,
    );
    return parsed.evidence;
  });
  const challenger = challengerIds.map((id) => {
    const parsed = parseEvidence(repository, headSha, dataset.version, challengerRecipe.recipeId, id);
    assertBaseObjectUnchanged(repository, baseSha, headSha, parsed.path);
    validateEvidence(
      repository,
      baseSha,
      parsed.evidence,
      challengerRecipe,
      dataset,
      decisionTime,
    );
    return parsed.evidence;
  });
  const allEvidence = [...baseline, ...challenger];
  for (const selector of [
    (item) => item.evidenceId,
    (item) => item.provenance.runId,
    (item) => item.provenance.deploymentId,
    (item) => item.provenance.sourceRun,
    (item) => item.provenance.sourceRunSha256,
  ]) assertDistinct(allEvidence, selector, "evidence");
  assert(new Set(allEvidence.map((item) => item.provenance.gitCommit)).size === 1, "evidence spans evaluated commits");
  assert(new Set(allEvidence.map((item) => canonical(item.catalog))).size === 1, "catalog snapshots differ");
  assertAggregateSuperiority(baseline, challenger);

  const shadowIds = unique(array(decision.shadowEvidenceIds, "shadow ids"), "shadow ids");
  assert(shadowIds.length >= POLICY.minIndependentEvidenceRunsPerRecipe, "too few paired shadows");
  const evidenceById = new Map(allEvidence.map((item) => [item.evidenceId, item]));
  const shadows = shadowIds.map((id) => {
    const parsed = parseShadow(repository, headSha, dataset.version, id);
    assertBaseObjectUnchanged(repository, baseSha, headSha, parsed.path);
    const shadow = parsed.shadow;
    const left = evidenceById.get(shadow.baselineEvidenceId);
    const right = evidenceById.get(shadow.challengerEvidenceId);
    assert(left && baselineIds.includes(left.evidenceId), "shadow baseline is outside decision");
    assert(right && challengerIds.includes(right.evidenceId), "shadow challenger is outside decision");
    validateShadow(
      repository,
      baseSha,
      shadow,
      left,
      right,
      dataset,
      decisionTime,
    );
    return shadow;
  });
  assertDistinct(shadows, (item) => item.shadowId, "shadow");
  assertDistinct(shadows, (item) => `${item.baselineEvidenceId}:${item.challengerEvidenceId}`, "shadow pair");
  assertDistinct(shadows, (item) => item.provenance.shadowRunId, "shadow run");
  assertDistinct(shadows, (item) => item.provenance.deploymentId, "shadow deployment");
  assertDistinct(shadows, (item) => item.provenance.sourceRunSha256, "shadow source");

  const approvals = validateApprovals(decision);
  const githubReviews = await validateAuthenticatedHeadReviews(
    approvals,
    baseSha,
    headSha,
  );
  const values = {
    baseSha,
    headSha,
    decisionId: decision.decisionId,
    evidenceIds: allEvidence.map((item) => item.evidenceId).sort(),
    shadowIds: shadows.map((item) => item.shadowId).sort(),
    gitCommits: [...new Set(allEvidence.map((item) => item.provenance.gitCommit))].sort(),
    inputTreeSha256s: [...new Set(allEvidence.map((item) => item.provenance.inputTreeSha256))].sort(),
    runIds: allEvidence.map((item) => item.provenance.runId).sort(),
    deploymentIds: allEvidence.map((item) => item.provenance.deploymentId).sort(),
    sourceRunSha256s: allEvidence.map((item) => item.provenance.sourceRunSha256).sort(),
    shadowRunIds: shadows.map((item) => item.provenance.shadowRunId).sort(),
    shadowDeploymentIds: shadows.map((item) => item.provenance.deploymentId).sort(),
    shadowSourceRunSha256s: shadows.map((item) => item.provenance.sourceRunSha256).sort(),
    datasetSha256: dataset.sha256,
    catalogSha256: allEvidence[0].catalog.sha256,
    reviewers: approvals
      .map((item) => `${item.role}:${item.reviewerId}:${item.approvedAt}`)
      .sort(),
    githubReviews: githubReviews.sort((left, right) =>
      left.role.localeCompare(right.role),
    ),
    changedPathsSha256: sha256(canonical(changedPaths(repository, baseSha, headSha))),
    registrationMigrationPath: migrationPath,
    registrationMigrationSha256,
  };
  envExact("RECIPE_PROMOTION_ATTESTED_EVIDENCE_IDS", sortedCsv(values.evidenceIds));
  envExact("RECIPE_PROMOTION_ATTESTED_SHADOW_IDS", sortedCsv(values.shadowIds));
  envExact("RECIPE_PROMOTION_ATTESTED_GIT_COMMITS", sortedCsv(values.gitCommits));
  envExact("RECIPE_PROMOTION_ATTESTED_INPUT_TREE_SHA256S", sortedCsv(values.inputTreeSha256s));
  envExact("RECIPE_PROMOTION_ATTESTED_RUN_IDS", sortedCsv(values.runIds));
  envExact("RECIPE_PROMOTION_ATTESTED_DEPLOYMENT_IDS", sortedCsv(values.deploymentIds));
  envExact("RECIPE_PROMOTION_ATTESTED_SOURCE_RUN_SHA256S", sortedCsv(values.sourceRunSha256s));
  envExact("RECIPE_PROMOTION_ATTESTED_SHADOW_RUN_IDS", sortedCsv(values.shadowRunIds));
  envExact("RECIPE_PROMOTION_ATTESTED_SHADOW_DEPLOYMENT_IDS", sortedCsv(values.shadowDeploymentIds));
  envExact("RECIPE_PROMOTION_ATTESTED_SHADOW_SOURCE_RUN_SHA256S", sortedCsv(values.shadowSourceRunSha256s));
  envExact("RECIPE_PROMOTION_ATTESTED_CATALOG_SHA256", values.catalogSha256);
  const bindingSha256 = sha256(canonical(values));
  envExact("RECIPE_PROMOTION_ATTESTATION_SHA256", bindingSha256);
  // Consume the secret in a one-way proof so a successful process necessarily
  // ran inside the protected environment. The proof is intentionally not
  // persisted or printed; the required-check result is the durable authority.
  createHmac("sha256", token).update(bindingSha256).digest();
  console.log(`Trusted recipe promotion attestation: PASS (${bindingSha256})`);
}

function selfTest() {
  const rejects = (callback, label) => {
    let rejected = false;
    try {
      callback();
    } catch {
      rejected = true;
    }
    assert(rejected, `${label} self-test did not reject`);
  };
  const withManifestHash = (recipe) => {
    const value = structuredClone(recipe);
    value.manifestSha256 = manifestHash(value);
    return value;
  };
  assert(
    sha256(canonical(POLICY)) === POLICY_SHA256,
    "locked promotion policy digest differs",
  );
  const object = { z: 1, a: { y: true, x: [2, null] } };
  assert(canonical(object) === '{"a":{"x":[2,null],"y":true},"z":1}', "canonical JSON self-test failed");
  const decision = { schemaVersion: "recipe-decision-v1", decisionId: "", value: 1 };
  const id = contentId("rd", decision, "decisionId");
  assert(DECISION_ID.test(id), "content-id self-test failed");
  assert(wilson(99, 101).lower > wilson(80, 101).upper, "superiority self-test failed");
  rejects(() => sqlScalar("unsafe'; select true;"), "unsafe SQL literal");
  registryId("recipe-v1", "registry id");
  modelId("provider/model@v1:d1536", "model id");
  deploymentId("Preview_Deployment-1", "deployment id");
  rejects(() => registryId("Recipe-v1", "registry id"), "uppercase registry id");
  rejects(() => modelId("Provider/model", "model id"), "uppercase model id");
  rejects(
    () => deploymentId("deployment:1", "deployment id"),
    "deployment punctuation",
  );

  const v1Recipe = {
    recipeId: "keyword-rerank-figure-library-50-2026-07-02",
    manifestSha256:
      "c2ced0eefa65351dc57a17f14dd76abf575745dafaac0d6d8699a95d5a21de52",
    retrievalMode: "keyword",
    matchConfigVersion: "figure-library-50-2026-07-02",
    librarySnapshotSha256:
      "e88751de566fa1077059cee143c4bd9d88b55e8adcca48eab4d5fa49b04ddf88",
    datasetVersion: "match-104-2026-07-02",
    llmProvider: "real",
    rerankModelId: "gpt-oss-120b",
    proseModelId: "gpt-oss-120b",
    embeddingModelId: null,
    rerankPromptVersion: "rerank-prompt-v1-2026-07",
    storyPromptVersion: "opening-copy-prompt-v1-2026-07",
    rerankTemperature: 0,
    rerankReasoningEffort: "low",
    rerankTopK: 6,
    storyTemperature: 0.3,
    storyComposerMode: "canonical",
    hybridStoryComposerEnabled: false,
    composerVersion: "canonical-composer-v1-2026-07",
    validatorVersion: "artifact-validator-v2-2026-07",
    storySpecSchemaVersion: "story-spec-v1-2026-07",
    boundaryPolicyVersion: "story-boundaries-v1-2026-07",
    resonanceBriefVersion: "resonance-brief-v1-2026-07",
  };
  assert(
    manifestHash(v1Recipe) === v1Recipe.manifestSha256,
    "v1 manifest hash compatibility self-test failed",
  );
  validateRecipeManifest(v1Recipe, "self-test v1 recipe");
  assertPromotionRegistrationSupported(v1Recipe);
  const v1FacetsRecipe = {
    ...v1Recipe,
    recipeId: "facetsrag-rerank-figure-library-50-2026-07-02",
    manifestSha256:
      "8024a865b7e20bc80ca9dc36a757705a09cc232e5841640546fb048ace25fadd",
    retrievalMode: "facetsrag",
    embeddingModelId: "gemini-embedding-001@d1536",
    rerankTopK: 8,
  };
  assert(
    manifestHash(v1FacetsRecipe) === v1FacetsRecipe.manifestSha256,
    "v1 FacetsRAG manifest hash compatibility self-test failed",
  );
  validateRecipeManifest(v1FacetsRecipe, "self-test v1 FacetsRAG recipe");
  const registrationDecision = {
    decisionId: `rd_${"f".repeat(64)}`,
    decidedAt: "2026-07-23T00:00:00.000Z",
  };
  assert(
    renderRegistrationMigration(v1Recipe, registrationDecision).includes(
      "select public.register_story_recipe_v1(",
    ),
    "v1 registration renderer compatibility self-test failed",
  );

  const v2Recipe = {
    recipeId: "facetsrag-tagger-v2-self-test",
    manifestSha256:
      "a711aed8b0ae68d85b4a8172a6821789e6e52e9f94ad1a01e1ce81e1fed452db",
    retrievalMode: "facetsrag",
    matchConfigVersion: "matching-v2",
    librarySnapshotSha256: "b".repeat(64),
    datasetVersion: "synthetic-v1",
    llmProvider: "real",
    rerankModelId: "rerank-v1",
    proseModelId: "prose-v1",
    embeddingModelId: "embedder-v1@d1536",
    rerankPromptVersion: "rerank-prompt-v1",
    storyPromptVersion: "story-prompt-v1",
    rerankTemperature: 0,
    rerankReasoningEffort: "low",
    rerankTopK: 8,
    storyTemperature: 0.3,
    storyComposerMode: "canonical",
    hybridStoryComposerEnabled: false,
    composerVersion: "composer-v1",
    validatorVersion: "validator-v1",
    storySpecSchemaVersion: "story-spec-v1",
    boundaryPolicyVersion: "boundaries-v1",
    resonanceBriefVersion: "resonance-v1",
    manifestSchemaVersion: STORY_RECIPE_MANIFEST_SCHEMA_V2,
    facetTagger: {
      mode: "closed_template",
      modelId: "tagger-v1",
      promptVersion: "facet-tagger-prompt-v1",
      temperature: 0,
      reasoningEffort: "low",
      timeoutMs: 3_000,
      signalSchemaVersion: "facet-signal-v1",
      projectionSchemaVersion: "facet-projection-v1",
      queryMode: "validated_projection",
      weightingMode: "static",
      expansionEnabled: false,
    },
  };
  assert(
    manifestHash(v2Recipe) === v2Recipe.manifestSha256,
    "v2 manifest hash self-test failed",
  );
  validateRecipeManifest(v2Recipe, "self-test v2 recipe");

  const hashTamper = structuredClone(v2Recipe);
  hashTamper.facetTagger.queryMode = "raw";
  rejects(
    () => validateRecipeManifest(hashTamper, "self-test v2 recipe"),
    "v2 nested hash tamper",
  );
  const extraTaggerKey = structuredClone(v2Recipe);
  extraTaggerKey.facetTagger.untrusted = true;
  rejects(
    () =>
      validateRecipeManifest(
        withManifestHash(extraTaggerKey),
        "self-test v2 recipe",
      ),
    "v2 tagger extra field",
  );
  const missingTaggerKey = structuredClone(v2Recipe);
  delete missingTaggerKey.facetTagger.projectionSchemaVersion;
  rejects(
    () =>
      validateRecipeManifest(
        withManifestHash(missingTaggerKey),
        "self-test v2 recipe",
    ),
    "v2 tagger missing field",
  );
  const missingV2RootKey = structuredClone(v2Recipe);
  delete missingV2RootKey.manifestSchemaVersion;
  rejects(
    () =>
      validateRecipeManifest(
        withManifestHash(missingV2RootKey),
        "self-test v2 recipe",
      ),
    "v2 root missing schema discriminator",
  );
  for (const [label, mutate] of [
    [
      "v2 tagger temperature",
      (recipe) => {
        recipe.facetTagger.temperature = 0.1;
      },
    ],
    [
      "v2 tagger timeout",
      (recipe) => {
        recipe.facetTagger.timeoutMs = 3_001;
      },
    ],
    [
      "v2 tagger expansion",
      (recipe) => {
        recipe.facetTagger.expansionEnabled = true;
      },
    ],
    [
      "v2 retrieval mode",
      (recipe) => {
        recipe.retrievalMode = "keyword";
        recipe.embeddingModelId = null;
      },
    ],
  ]) {
    const invalid = structuredClone(v2Recipe);
    mutate(invalid);
    rejects(
      () =>
        validateRecipeManifest(
          withManifestHash(invalid),
          "self-test v2 recipe",
        ),
      label,
    );
  }
  rejects(
    () => assertPromotionRegistrationSupported(v2Recipe),
    "v2 promotion registration",
  );
  rejects(
    () =>
      renderRegistrationMigration(v2Recipe, registrationDecision),
    "v2 registration migration",
  );

  const dataset = {
    version: "protected-holdout-v1",
    sha256: "a".repeat(64),
    visibility: "protected_holdout",
  };
  validateDataset(dataset, "self-test dataset");
  rejects(
    () => validateDataset({ ...dataset, extra: true }, "self-test dataset"),
    "dataset extra field",
  );
  const syntheticDataset = {
    version: "synthetic-v1",
    sha256: "c".repeat(64),
    visibility: "synthetic",
  };
  const matchingRecipe = {
    matchConfigVersion: "matching-v1",
    librarySnapshotSha256: "b".repeat(64),
    datasetVersion: syntheticDataset.version,
    llmProvider: "real",
    proseModelId: "prose-v1",
    rerankPromptVersion: "rerank-prompt-v1",
    storyPromptVersion: "story-prompt-v1",
    storyTemperature: 0.3,
    storyComposerMode: "canonical",
    hybridStoryComposerEnabled: false,
    composerVersion: "composer-v1",
    validatorVersion: "validator-v1",
    storySpecSchemaVersion: "story-spec-v1",
    boundaryPolicyVersion: "boundaries-v1",
    resonanceBriefVersion: "resonance-v1",
  };
  validateMatchingOnly(matchingRecipe, structuredClone(matchingRecipe));
  rejects(
    () =>
      validateMatchingOnly(matchingRecipe, {
        ...matchingRecipe,
        datasetVersion: dataset.version,
      }),
    "matching-only recipe dataset drift",
  );
  rejects(
    () =>
      validateMatchingOnly(matchingRecipe, {
        ...matchingRecipe,
        storyPromptVersion: "story-prompt-v2",
      }),
    "matching-only story prompt drift",
  );
  const promotionDatasets = new Map([
    [syntheticDataset.version, syntheticDataset],
    [dataset.version, dataset],
  ]);
  assert(
    resolvePromotionDataset(promotionDatasets, dataset) === dataset,
    "protected decision dataset bridge failed",
  );
  rejects(
    () =>
      resolvePromotionDataset(promotionDatasets, {
        ...dataset,
        sha256: "d".repeat(64),
      }),
    "promotion dataset metadata mismatch",
  );
  rejects(
    () => resolvePromotionDataset(promotionDatasets, syntheticDataset),
    "synthetic promotion dataset",
  );
  rejects(
    () => resolvePromotionDataset(new Map(), dataset),
    "unregistered promotion dataset",
  );
  const catalog = {
    sha256: "b".repeat(64),
    eligibleStageCount: 50,
    source: "supabase_published_story_specs",
  };
  validateCatalog(catalog, "self-test catalog");
  rejects(
    () => validateCatalog({ ...catalog, eligibleStageCount: 1.5 }, "self-test catalog"),
    "catalog non-integer count",
  );
  rejects(
    () => validateCatalog({ ...catalog, extra: true }, "self-test catalog"),
    "catalog extra field",
  );

  const evidence = {
    run: {
      k: 2,
      caseCount: 98,
      trialCount: 196,
    },
    metrics: {
      rerankTop1: 1,
      overallTop1: 1,
      missDetection: 1,
      hardConfusion: 0,
      goldSurvivalStageA: null,
      goldSurvivalStageB: null,
      stability: 1,
      counts: {
        rerankCorrect: 190,
        rerankTotal: 190,
        overallCorrect: 190,
        overallTotal: 190,
        missDetected: 6,
        missTotal: 6,
        hardConfused: 0,
        hardTotal: 80,
        survivedStageA: 0,
        survivedStageB: 0,
        survivalTotal: 0,
        rerankChosen: 196,
        keywordFallback: 0,
      },
      calibration: {
        definitiveCorrect: 190,
        definitiveWrong: 0,
        partialCorrect: 0,
        partialWrong: 0,
      },
      latency: {
        p50Ms: 50,
        p95Ms: 100,
      },
      trustGate: {
        passed: true,
        coverage: 1,
        checks: {
          coverage: true,
          rerankTop1: true,
          missDetection: true,
          noDefinitiveWrong: true,
          top1: true,
          hardConfusion: true,
        },
        thresholds: structuredClone(POLICY.trustGate),
      },
    },
  };
  validateMetrics(evidence);
  const impossibleEvidence = structuredClone(evidence);
  impossibleEvidence.metrics.counts.overallCorrect = 191;
  rejects(
    () => validateMetrics(impossibleEvidence),
    "impossible evidence count",
  );
  const extraMetricEvidence = structuredClone(evidence);
  extraMetricEvidence.metrics.untrusted = true;
  rejects(
    () => validateMetrics(extraMetricEvidence),
    "evidence extra metric",
  );

  assert(
    nextMigrationPrefix([
      "supabase/migrations/0001_first.sql",
      "supabase/migrations/0002_second.sql",
    ]) === "0003",
    "next migration prefix self-test failed",
  );
  assert(
    validateMigration.length === 6,
    "migration validator signature self-test failed",
  );
  rejects(
    () =>
      nextMigrationPrefix([
        "supabase/migrations/0001_first.sql",
        "supabase/migrations/0001_duplicate.sql",
      ]),
    "duplicate migration prefix",
  );

  const baselineDecisionId = `rd_${"1".repeat(64)}`;
  const challengerDecisionId = `rd_${"2".repeat(64)}`;
  const baseRegistry = {
    selection: {
      primaryRecipeId: "baseline",
      rollbackRecipeId: "baseline",
      decisionId: baselineDecisionId,
    },
    promotions: [
      {
        recipeId: "baseline",
        decisionId: baselineDecisionId,
        promotedAt: "2026-01-01T00:00:00.000Z",
      },
    ],
  };
  validatePromotionHistory(
    baseRegistry.promotions,
    new Set(["baseline", "challenger"]),
    "self-test promotions",
  );
  assert(
    promotionRequired(baseRegistry, structuredClone(baseRegistry)) === false,
    "unchanged selection detection self-test failed",
  );
  rejects(
    () =>
      promotionRequired(baseRegistry, {
        ...structuredClone(baseRegistry),
        selection: {
          primaryRecipeId: "challenger",
          rollbackRecipeId: "baseline",
          decisionId: challengerDecisionId,
        },
      }),
    "selection-only bypass",
  );
  const promotedRegistry = {
    ...structuredClone(baseRegistry),
    selection: {
      primaryRecipeId: "challenger",
      rollbackRecipeId: "baseline",
      decisionId: challengerDecisionId,
    },
    promotions: [
      ...baseRegistry.promotions,
      {
        recipeId: "challenger",
        decisionId: challengerDecisionId,
        promotedAt: "2026-02-01T00:00:00.000Z",
      },
    ],
  };
  assert(
    promotionRequired(baseRegistry, promotedRegistry) === true,
    "appended promotion detection self-test failed",
  );
  validatePromotionHistory(
    promotedRegistry.promotions,
    new Set(["baseline", "challenger"]),
    "self-test promotions",
  );
  rejects(
    () =>
      promotionDiff(baseRegistry, {
        ...structuredClone(baseRegistry),
        promotions: [
          ...baseRegistry.promotions,
          {
            recipeId: "baseline",
            decisionId: challengerDecisionId,
            promotedAt: "2026-02-01T00:00:00.000Z",
          },
        ],
      }),
    "recipe re-promotion",
  );
  rejects(
    () =>
      validatePromotionHistory(
        [
          ...baseRegistry.promotions,
          {
            recipeId: "challenger",
            decisionId: baselineDecisionId,
            promotedAt: "2026-02-01T00:00:00.000Z",
          },
        ],
        new Set(["baseline", "challenger"]),
        "self-test promotions",
      ),
    "duplicate promotion decision",
  );
  rejects(
    () => utcTimestamp("2026-02-30T00:00:00.000Z", "self-test time"),
    "impossible timestamp",
  );
  console.log("Trusted recipe attestor self-test: PASS");
}

function argument(name) {
  const index = process.argv.indexOf(name);
  assert(index >= 0 && process.argv[index + 1], `${name} is required`);
  return process.argv[index + 1];
}

try {
  const command = process.argv[2];
  if (command === "self-test") selfTest();
  else if (command === "policy") process.stdout.write(canonical(POLICY));
  else if (command === "detect") {
    mainDetect(
      argument("--repository"),
      argument("--base-sha"),
      argument("--head-sha"),
    );
  } else if (command === "attest") {
    await mainAttest(
      argument("--repository"),
      argument("--base-sha"),
      argument("--head-sha"),
    );
  } else {
    fail("use self-test, policy, detect, or attest");
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : "trusted recipe attestation failed");
  process.exit(1);
}
