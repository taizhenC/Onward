import "./_smoke-bootstrap";
import assert from "node:assert/strict";
import {
  PRIMARY_STORY_RECIPE,
  ROLLBACK_STORY_RECIPE,
  SELECTABLE_STORY_RECIPE_IDS,
  STORY_RECIPE_MANIFEST_SCHEMA_V2,
  STORY_RECIPE_REGISTRY,
  StoryRecipeRuntimeError,
  facetTaggerExecutionPlan,
  isStoryRecipeManifestV2,
  parseStoryRecipeRegistry,
  parseStoryRecipeManifest,
  storyRecipeExecutionPlan,
  storyRecipeManifestSha256,
  type StoryRecipeManifest,
  type StoryRecipeManifestV2,
} from "../lib/story-recipe";
import { registrationMatches } from "../lib/story-recipe-registration";
import {
  manifestSha256,
  recipeForEval,
  type StoryRecipeManifest as EvidenceStoryRecipeManifest,
  type StoryRecipeRegistry as EvidenceStoryRecipeRegistry,
} from "./recipe-evidence";

const BASELINE_RECIPE_ID =
  "keyword-rerank-figure-library-50-2026-07-02";
const CHALLENGER_RECIPE_ID =
  "facetsrag-rerank-figure-library-50-2026-07-02";
const V2_RECIPE_ID = "test-only-manifest-v2-fixture";

const HISTORICAL_V1_HASHES = Object.freeze({
  [BASELINE_RECIPE_ID]:
    "c2ced0eefa65351dc57a17f14dd76abf575745dafaac0d6d8699a95d5a21de52",
  [CHALLENGER_RECIPE_ID]:
    "8024a865b7e20bc80ca9dc36a757705a09cc232e5841640546fb048ace25fadd",
});

// Content-addressed from the exact fixture below. This is intentionally a
// literal, not a value computed by the assertion under test.
const GOLDEN_V2_MANIFEST_SHA256 =
  "6b2563507955e70a0794b1bf30e001f60b9154bd5cb3b80b1eb38cc55193d566";

type MutableJsonObject = Record<string, unknown>;

function main(): void {
  checkHistoricalV1Identity();
  checkStrictV1Rejections();

  const rawV2 = validV2Fixture();
  const parsedV2 = parseStoryRecipeManifest(rawV2);
  checkValidV2(parsedV2);
  checkMixedRegistry(rawV2, parsedV2);
  checkStrictV2Rejections(rawV2);
  checkDormantFacetTaggerPlan(parsedV2);
  checkDormantV2Execution(parsedV2);

  console.log("Story recipe manifest v2 contract: PASS");
  console.log("  historical v1 hashes remain exact; exports mirror live selection");
  console.log("  strict closed-template v2 parsing and deep freezing are locked");
  console.log("  exact tagger plans are derivable without provider authority");
  console.log("  runtime and eval reject v2 until execution support is installed");
}

function checkStrictV1Rejections(): void {
  const keyword = STORY_RECIPE_REGISTRY.recipes.find(
    (recipe) => recipe.recipeId === BASELINE_RECIPE_ID,
  );
  const facetsRag = STORY_RECIPE_REGISTRY.recipes.find(
    (recipe) => recipe.recipeId === CHALLENGER_RECIPE_ID,
  );
  assert(keyword && facetsRag, "the historical v1 fixtures are incomplete");

  expectRegistryInvalid(
    "keyword v1 with an embedder",
    cloneObject(keyword) as unknown as MutableJsonObject,
    (candidate) => {
      candidate.embeddingModelId = "gemini-embedding-001@d1536";
    },
  );
  expectRegistryInvalid(
    "FacetsRAG v1 without an embedder",
    cloneObject(facetsRag) as unknown as MutableJsonObject,
    (candidate) => {
      candidate.embeddingModelId = null;
    },
  );
}

function checkHistoricalV1Identity(): void {
  const selectedRecipeIds = [
    ...new Set([
      STORY_RECIPE_REGISTRY.selection.primaryRecipeId,
      STORY_RECIPE_REGISTRY.selection.rollbackRecipeId,
    ]),
  ];
  assert.equal(
    PRIMARY_STORY_RECIPE.recipeId,
    STORY_RECIPE_REGISTRY.selection.primaryRecipeId,
    "the exported primary diverged from registry selection",
  );
  assert.equal(
    ROLLBACK_STORY_RECIPE.recipeId,
    STORY_RECIPE_REGISTRY.selection.rollbackRecipeId,
    "the exported rollback diverged from registry selection",
  );
  assert.deepEqual(
    SELECTABLE_STORY_RECIPE_IDS,
    selectedRecipeIds,
    "the selectable production set diverged from registry selection",
  );

  let historicalBaseline: StoryRecipeManifest | undefined;
  for (const [recipeId, expectedHash] of Object.entries(
    HISTORICAL_V1_HASHES,
  )) {
    const installed = STORY_RECIPE_REGISTRY.recipes.find(
      (recipe) => recipe.recipeId === recipeId,
    );
    assert(installed, `missing historical v1 recipe ${recipeId}`);

    const parsed = parseStoryRecipeManifest(cloneObject(installed));
    assert.equal(
      isStoryRecipeManifestV2(parsed),
      false,
      `${recipeId} was reinterpreted as manifest v2`,
    );
    assert.equal(
      Object.hasOwn(parsed, "manifestSchemaVersion"),
      false,
      `${recipeId} gained a synthetic manifest discriminator`,
    );
    assert.equal(
      Object.hasOwn(parsed, "facetTagger"),
      false,
      `${recipeId} gained a synthetic facet-tagger default`,
    );
    assert.equal(parsed.manifestSha256, expectedHash);
    assert.equal(storyRecipeManifestSha256(parsed), expectedHash);
    assert.equal(
      manifestSha256(parsed as EvidenceStoryRecipeManifest),
      expectedHash,
      `${recipeId} changed under the evidence canonicalizer`,
    );
    if (recipeId === BASELINE_RECIPE_ID) historicalBaseline = parsed;
  }

  assert(historicalBaseline, "the historical baseline recipe is missing");
  const baselinePlan = storyRecipeExecutionPlan(historicalBaseline);
  assert.deepEqual(baselinePlan, {
    llmProvider: "real",
    rerankModelId: "gpt-oss-120b",
    proseModelId: "gpt-oss-120b",
    // Pinned literals, not the movable exported constants: this assertion
    // fixes the immutable historical baseline's resolved prompt identity.
    rerankPromptVersion: "rerank-prompt-v1-2026-07",
    storyPromptVersion: "opening-copy-prompt-v1-2026-07",
    rerankTemperature: 0,
    rerankReasoningEffort: "low",
    storyTemperature: 0.3,
    retrievalMode: "keyword",
    rerankTopK: 6,
    storyComposerMode: "canonical",
    hybridStoryComposerEnabled: false,
    embedding: null,
  });
  assert.equal(
    Object.hasOwn(baselinePlan, "facetTagger"),
    false,
    "the v1 execution plan gained dormant v2 behavior",
  );
}

function validV2Fixture(): MutableJsonObject {
  const installed = STORY_RECIPE_REGISTRY.recipes.find(
    (recipe) => recipe.recipeId === CHALLENGER_RECIPE_ID,
  );
  assert(installed, "the historical FacetsRAG recipe fixture is missing");

  const fixture: MutableJsonObject = {
    ...cloneObject(installed),
    recipeId: V2_RECIPE_ID,
    manifestSha256: "0".repeat(64),
    manifestSchemaVersion: STORY_RECIPE_MANIFEST_SCHEMA_V2,
    facetTagger: {
      mode: "closed_template",
      modelId: "gpt-oss-120b",
      promptVersion: "facet-tagger-prompt-v1-2026-07",
      temperature: 0,
      reasoningEffort: "low",
      timeoutMs: 3000,
      signalSchemaVersion: "facet-signal-v1-2026-07",
      projectionSchemaVersion: "facet-query-template-catalog-v1-2026-07",
      queryMode: "validated_projection",
      weightingMode: "static",
      expansionEnabled: false,
    },
  };
  fixture.manifestSha256 = manifestSha256(
    fixture as EvidenceStoryRecipeManifest,
  );
  return fixture;
}

function checkValidV2(
  parsed: StoryRecipeManifest,
): asserts parsed is StoryRecipeManifestV2 {
  assert(
    isStoryRecipeManifestV2(parsed),
    "the valid v2 fixture was not discriminated as v2",
  );
  assert.equal(parsed.manifestSchemaVersion, STORY_RECIPE_MANIFEST_SCHEMA_V2);
  assert.deepEqual(parsed.facetTagger, {
    mode: "closed_template",
    modelId: "gpt-oss-120b",
    promptVersion: "facet-tagger-prompt-v1-2026-07",
    temperature: 0,
    reasoningEffort: "low",
    timeoutMs: 3000,
    signalSchemaVersion: "facet-signal-v1-2026-07",
    projectionSchemaVersion: "facet-query-template-catalog-v1-2026-07",
    queryMode: "validated_projection",
    weightingMode: "static",
    expansionEnabled: false,
  });
  assert(Object.isFrozen(parsed), "the parsed v2 manifest is mutable");
  assert(
    Object.isFrozen(parsed.facetTagger),
    "the parsed v2 facet-tagger recipe is mutable",
  );

  const runtimeHash = storyRecipeManifestSha256(parsed);
  const evidenceHash = manifestSha256(
    parsed as EvidenceStoryRecipeManifest,
  );
  assert.equal(runtimeHash, evidenceHash, "runtime/evidence v2 hashes diverged");
  assert.equal(runtimeHash, parsed.manifestSha256);
  assert.equal(
    runtimeHash,
    GOLDEN_V2_MANIFEST_SHA256,
    "the canonical v2 identity changed",
  );

  const boundAxes: Array<
    readonly [
      string,
      (candidate: MutableJsonObject) => void,
    ]
  > = [
    [
      "manifest schema",
      (candidate) => {
        candidate.manifestSchemaVersion = "story-recipe-manifest-v3";
      },
    ],
    [
      "tagger mode",
      (candidate) => {
        taggerObject(candidate).mode = "different_mode";
      },
    ],
    [
      "tagger model",
      (candidate) => {
        taggerObject(candidate).modelId = "different-model";
      },
    ],
    [
      "tagger prompt",
      (candidate) => {
        taggerObject(candidate).promptVersion = "different-prompt";
      },
    ],
    [
      "tagger temperature",
      (candidate) => {
        taggerObject(candidate).temperature = 0.1;
      },
    ],
    [
      "tagger reasoning",
      (candidate) => {
        taggerObject(candidate).reasoningEffort = "high";
      },
    ],
    [
      "tagger timeout",
      (candidate) => {
        taggerObject(candidate).timeoutMs = 3001;
      },
    ],
    [
      "signal schema",
      (candidate) => {
        taggerObject(candidate).signalSchemaVersion = "different-signal";
      },
    ],
    [
      "projection schema",
      (candidate) => {
        taggerObject(candidate).projectionSchemaVersion =
          "different-projection";
      },
    ],
    [
      "query mode",
      (candidate) => {
        taggerObject(candidate).queryMode = "raw";
      },
    ],
    [
      "weighting mode",
      (candidate) => {
        taggerObject(candidate).weightingMode = "bounded_dynamic";
      },
    ],
    [
      "expansion posture",
      (candidate) => {
        taggerObject(candidate).expansionEnabled = true;
      },
    ],
  ];
  for (const [axis, mutate] of boundAxes) {
    const candidate = cloneObject(parsed) as unknown as MutableJsonObject;
    mutate(candidate);
    assert.notEqual(
      manifestSha256(candidate as EvidenceStoryRecipeManifest),
      runtimeHash,
      `${axis} is absent from the canonical v2 hash`,
    );
  }
}

function checkMixedRegistry(
  rawV2: MutableJsonObject,
  parsedV2: StoryRecipeManifestV2,
): void {
  const mixed = cloneObject(STORY_RECIPE_REGISTRY) as unknown as {
    recipes: unknown[];
  };
  mixed.recipes.push(rawV2);
  const parsed = parseStoryRecipeRegistry(mixed);
  assert.equal(
    parsed.schemaVersion,
    "story-recipe-registry-v1",
    "a per-manifest version changed the registry envelope",
  );
  assert.deepEqual(
    parsed.selection,
    STORY_RECIPE_REGISTRY.selection,
    "adding an unselected v2 candidate changed production selection",
  );
  const installed = parsed.recipes.find(
    (recipe) => recipe.recipeId === parsedV2.recipeId,
  );
  assert(installed && isStoryRecipeManifestV2(installed));
  assert.equal(installed.manifestSha256, parsedV2.manifestSha256);
  assert(Object.isFrozen(parsed), "the mixed recipe registry is mutable");
}

function checkStrictV2Rejections(valid: MutableJsonObject): void {
  expectRegistryInvalid("unknown manifest discriminator", valid, (candidate) => {
    candidate.manifestSchemaVersion = "story-recipe-manifest-v3";
  });

  for (const rootKey of ["manifestSchemaVersion", "facetTagger"]) {
    expectRegistryInvalid(`missing root key ${rootKey}`, valid, (candidate) => {
      delete candidate[rootKey];
    });
  }
  expectRegistryInvalid("extra root key", valid, (candidate) => {
    candidate.privateCanary = "must-not-parse";
  });

  const taggerKeys = Object.keys(taggerObject(valid));
  for (const key of taggerKeys) {
    expectRegistryInvalid(`missing facetTagger.${key}`, valid, (candidate) => {
      delete taggerObject(candidate)[key];
    });
  }
  expectRegistryInvalid("extra nested key", valid, (candidate) => {
    taggerObject(candidate).privateCanary = "must-not-parse";
  });

  for (const [name, key, value] of [
    ["bad model id", "modelId", "Bad Model"],
    ["bad prompt id", "promptVersion", "bad/prompt"],
    ["bad reasoning id", "reasoningEffort", "bad/reasoning"],
    ["bad signal schema id", "signalSchemaVersion", "bad/signal"],
    ["bad projection schema id", "projectionSchemaVersion", "bad/projection"],
  ] as const) {
    expectRegistryInvalid(name, valid, (candidate) => {
      taggerObject(candidate)[key] = value;
    });
  }

  for (const temperature of [0.1, Number.NaN, Number.POSITIVE_INFINITY]) {
    expectRegistryInvalid(
      `invalid temperature ${String(temperature)}`,
      valid,
      (candidate) => {
        taggerObject(candidate).temperature = temperature;
      },
    );
  }

  for (const timeoutMs of [2999, 3000.5, "3000"]) {
    expectRegistryInvalid(
      `invalid timeout ${String(timeoutMs)}`,
      valid,
      (candidate) => {
        taggerObject(candidate).timeoutMs = timeoutMs;
      },
    );
  }

  for (const [name, key, value] of [
    ["bad tagger mode", "mode", "free_text"],
    ["bad query mode", "queryMode", "projected"],
    ["bad weighting mode", "weightingMode", "dynamic"],
    ["enabled expansion", "expansionEnabled", true],
    ["string expansion flag", "expansionEnabled", "false"],
  ] as const) {
    expectRegistryInvalid(name, valid, (candidate) => {
      taggerObject(candidate)[key] = value;
    });
  }

  expectRegistryInvalid(
    "keyword v2 without an embedder",
    valid,
    (candidate) => {
      candidate.retrievalMode = "keyword";
      candidate.embeddingModelId = null;
    },
  );
  expectRegistryInvalid(
    "FacetsRAG v2 without an embedder",
    valid,
    (candidate) => {
      candidate.embeddingModelId = null;
    },
  );
}

function checkDormantFacetTaggerPlan(parsed: StoryRecipeManifestV2): void {
  const plan = facetTaggerExecutionPlan(parsed);
  const expected = {
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
  } as const;
  assert.deepEqual(plan, expected);
  assert(Object.isFrozen(plan), "facet-tagger execution plan is mutable");
  assert.notEqual(
    plan,
    parsed.facetTagger,
    "facet-tagger execution plan aliases the parsed manifest",
  );
  assert.equal(
    Reflect.set(plan, "modelId", "untrusted-model"),
    false,
    "frozen facet-tagger execution plan accepted mutation",
  );
  assert.deepEqual(plan, expected, "facet-tagger execution plan mutated");

  const historicalV1 = STORY_RECIPE_REGISTRY.recipes.find(
    (recipe) => recipe.recipeId === BASELINE_RECIPE_ID,
  );
  assert(historicalV1, "historical v1 recipe is missing");
  expectTaggerPlanInvalid("manifest v1", historicalV1);

  const identityAxes: Array<
    readonly [string, (tagger: MutableJsonObject) => void]
  > = [
    ["mode", (tagger) => (tagger.mode = "different_mode")],
    ["model", (tagger) => (tagger.modelId = "different-model")],
    ["prompt", (tagger) => (tagger.promptVersion = "different-prompt")],
    ["temperature", (tagger) => (tagger.temperature = 0.1)],
    ["reasoning", (tagger) => (tagger.reasoningEffort = "high")],
    ["timeout", (tagger) => (tagger.timeoutMs = 3001)],
    [
      "signal schema",
      (tagger) => (tagger.signalSchemaVersion = "different-signal"),
    ],
    [
      "projection schema",
      (tagger) =>
        (tagger.projectionSchemaVersion = "different-projection"),
    ],
    ["query mode", (tagger) => (tagger.queryMode = "raw")],
    [
      "weighting mode",
      (tagger) => (tagger.weightingMode = "bounded_dynamic"),
    ],
    ["expansion", (tagger) => (tagger.expansionEnabled = true)],
  ];
  for (const [axis, mutate] of identityAxes) {
    const candidate = cloneObject(parsed) as unknown as MutableJsonObject;
    mutate(taggerObject(candidate));
    expectTaggerPlanInvalid(
      axis,
      candidate as unknown as StoryRecipeManifest,
    );
  }
}

function checkDormantV2Execution(parsed: StoryRecipeManifestV2): void {
  assert.throws(
    () => storyRecipeExecutionPlan(parsed),
    (error: unknown) =>
      error instanceof StoryRecipeRuntimeError &&
      error.code === "code_identity_invalid",
    "manifest v2 reached the production execution plan",
  );

  const mixedRegistry = cloneObject(
    STORY_RECIPE_REGISTRY,
  ) as unknown as EvidenceStoryRecipeRegistry;
  mixedRegistry.recipes.push(
    parsed as unknown as EvidenceStoryRecipeManifest,
  );
  assert.throws(
    () => recipeForEval(mixedRegistry, "facetsrag", parsed.recipeId),
    (error: unknown) =>
      error instanceof Error &&
      error.message.includes("manifest v2") &&
      error.message.includes("execution support is not installed"),
    "manifest v2 reached the eval execution path",
  );

  const promotion = {
    decisionId: `rd_${"f".repeat(64)}`,
    promotedAt: "2026-07-23T00:00:00.000Z",
  };
  const incompleteV1Row = {
    recipe_id: parsed.recipeId,
    manifest_sha256: parsed.manifestSha256,
    dataset_version: parsed.datasetVersion,
    match_config_version: parsed.matchConfigVersion,
    library_snapshot_sha256: parsed.librarySnapshotSha256,
    retrieval_mode: parsed.retrievalMode,
    llm_provider: parsed.llmProvider,
    rerank_model_id: parsed.rerankModelId,
    prose_model_id: parsed.proseModelId,
    embedding_model_id: parsed.embeddingModelId,
    rerank_prompt_version: parsed.rerankPromptVersion,
    story_prompt_version: parsed.storyPromptVersion,
    rerank_temperature: parsed.rerankTemperature,
    rerank_reasoning_effort: parsed.rerankReasoningEffort,
    rerank_top_k: parsed.rerankTopK,
    story_temperature: parsed.storyTemperature,
    story_composer_mode: parsed.storyComposerMode,
    hybrid_story_composer_enabled: parsed.hybridStoryComposerEnabled,
    composer_version: parsed.composerVersion,
    validator_version: parsed.validatorVersion,
    story_spec_schema_version: parsed.storySpecSchemaVersion,
    boundary_policy_version: parsed.boundaryPolicyVersion,
    resonance_brief_version: parsed.resonanceBriefVersion,
    decision_id: promotion.decisionId,
    promoted_at: promotion.promotedAt,
  };
  assert.equal(
    registrationMatches(incompleteV1Row, parsed, promotion),
    false,
    "the v1 database shape appeared to register a v2 identity",
  );
  const completeV2Row = {
    ...incompleteV1Row,
    manifest_schema_version: parsed.manifestSchemaVersion,
    facet_tagger: structuredClone(parsed.facetTagger),
  };
  assert.equal(
    registrationMatches(completeV2Row, parsed, promotion),
    true,
    "the exact manifest-v2 database identity was rejected",
  );
  assert.equal(
    registrationMatches(
      {
        ...completeV2Row,
        facet_tagger: {
          ...completeV2Row.facet_tagger,
          queryMode: "raw",
        },
      },
      parsed,
      promotion,
    ),
    false,
    "a drifted nested facet-tagger identity was accepted",
  );
  assert.equal(
    registrationMatches(
      {
        ...completeV2Row,
        manifest_schema_version: null,
        facet_tagger: null,
      },
      parsed,
      promotion,
    ),
    false,
    "a manifest-v2 recipe matched null v1 identity columns",
  );
}

function expectTaggerPlanInvalid(
  name: string,
  recipe: StoryRecipeManifest,
): void {
  assert.throws(
    () => facetTaggerExecutionPlan(recipe),
    (error: unknown) =>
      error instanceof StoryRecipeRuntimeError &&
      error.code === "code_identity_invalid",
    `${name} drift reached the facet-tagger execution plan`,
  );
}

function expectRegistryInvalid(
  name: string,
  source: MutableJsonObject,
  mutate: (candidate: MutableJsonObject) => void,
): void {
  const candidate = cloneObject(source);
  mutate(candidate);
  assert.throws(
    () => parseStoryRecipeManifest(candidate),
    (error: unknown) =>
      error instanceof StoryRecipeRuntimeError &&
      error.code === "registry_invalid",
    `${name} did not fail closed`,
  );
}

function taggerObject(candidate: MutableJsonObject): MutableJsonObject {
  const tagger = candidate.facetTagger;
  assert(
    typeof tagger === "object" && tagger !== null && !Array.isArray(tagger),
    "fixture facetTagger is not an object",
  );
  return tagger as MutableJsonObject;
}

function cloneObject<T>(value: T): T {
  return structuredClone(value);
}

main();
