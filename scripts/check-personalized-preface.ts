import "./_smoke-bootstrap";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { consumeDerivedOutput } from "../lib/derived-output-retention";
import { FIGURE_STAGES } from "../lib/figures-data";
import { writeOpeningCopy } from "../lib/llm";
import {
  STORY_PROMPT_VERSION_V1,
  STORY_PROMPT_VERSION_V2,
} from "../lib/llm-recipe-constants";
import {
  OpeningCopyPolicyError,
  openingCopyPolicyForStoryPromptVersion,
} from "../lib/opening-copy-policy";
import {
  DEFAULT_PREFACE_LINES,
  NEUTRAL_EYEBROW,
  toEyebrowProviderSurface,
  toEyebrowSurface,
  type OpeningCopyInput,
} from "../lib/opening-copy";
import {
  PERSONALIZED_PREFACE_PROMPT_CONTRACT,
  PREFACE_ACKNOWLEDGEMENT_TEMPLATES,
  PREFACE_DISTANCE_TEMPLATES,
  PREFACE_EYEBROW_TEMPLATES,
  PREFACE_FALLBACK_LINES,
  PREFACE_INVITATION_LINE,
  PREFACE_NON_EQUIVALENCE_LINE,
  PREFACE_PLAN_SCHEMA_VERSION,
  type PrefacePlanCandidate,
  type PrefacePlanRequest,
} from "../lib/preface-plan-contract";
import {
  buildPrefacePlanRequest,
  firstCompatiblePrefacePlan,
  isUniversalPreface,
  renderPersonalizedOpeningCopy,
  renderPersonalizedPreface,
  validatePersonalizedOpeningCopy,
  validatePersonalizedPrefaceLines,
  validatePrefacePlanCandidate,
} from "../lib/preface-plan";
import {
  PRIMARY_PRESSURES,
  createResonanceBrief,
  toResonancePromptSurface,
  type DesiredDistance,
  type PrimaryPressure,
  type ResonanceBrief,
} from "../lib/resonance-brief";
import {
  composeCanonicalStoryArtifact,
  storyArtifactContentHash,
  validateStoredStoryArtifact,
  validateStoryArtifact,
} from "../lib/story-artifact";
import { buildDraftStorySpec } from "../lib/story-spec";
import {
  PRIMARY_STORY_RECIPE,
  getStoryRecipeById,
  getStoryRecipePromotion,
  storyRecipeExecutionPlan,
  type StoryRecipeManifest,
} from "../lib/story-recipe";
import type { StoryBoundaries } from "../lib/story-boundaries";
import type { MatchRecipe, OpeningCopy } from "../lib/types";

const PERSONALIZED_PREFACE_RECIPE_ID =
  "keyword-rerank-personalized-preface-v2-figure-library-50-2026-07-28";
const PRIVATE_DISCLOSURE =
  'After Priya rejected me in Boston in 2024, my "cobalt compass" stopped pointing anywhere.';
const EPISODE_SHAPE =
  "A person kept working after a closed door made the next step uncertain.";
const V2_PROVIDER_REQUEST_SHA256 =
  "6b60b078cbcec4759bfb88d8a53e9b500a73f533ba294901226ef7aed367d53d";

const DISTANCES = [
  "gentle",
  "direct",
  "unspecified",
] as const satisfies readonly DesiredDistance[];

async function main(): Promise<void> {
  const stage = FIGURE_STAGES.find(
    (candidate) => candidate.figureKey === "butler",
  );
  if (!stage) throw new Error("personalized-preface stage fixture is missing");

  const catalogCoverage = assertClosedCatalogMatrix();
  assertStrictPlanValidation();

  const input: OpeningCopyInput = {
    resonanceBrief: createResonanceBrief(
      PRIVATE_DISCLOSURE,
      undefined,
      "rejection",
    ),
    stage,
  };
  const policy = openingCopyPolicyForStoryPromptVersion(
    STORY_PROMPT_VERSION_V2,
  );
  const stubCopy = policy.fromStub(input);
  assert(!isUniversalPreface(stubCopy.prefaceLines));
  assert(validatePersonalizedOpeningCopy(stubCopy, input.resonanceBrief));

  const providerCopy = await assertProviderBoundary(input);
  await assertUnselectedV2CannotReachProvider(input);
  assertArtifactBoundary(input, providerCopy);
  assertRecipeRegistration();

  console.log(
    `Personalized preface check passed (${catalogCoverage.cells} pressure/distance cells, ${catalogCoverage.combinations} server-owned combinations; bounded provider and artifact fallbacks verified).`,
  );
}

function assertClosedCatalogMatrix(): Readonly<{
  cells: number;
  combinations: number;
}> {
  assert(Object.isFrozen(PERSONALIZED_PREFACE_PROMPT_CONTRACT));
  assert(Object.isFrozen(PREFACE_EYEBROW_TEMPLATES));
  assert(Object.isFrozen(PREFACE_ACKNOWLEDGEMENT_TEMPLATES));
  assert(Object.isFrozen(PREFACE_DISTANCE_TEMPLATES));
  assert(Object.isFrozen(PREFACE_FALLBACK_LINES));
  assert.deepEqual(PREFACE_FALLBACK_LINES, DEFAULT_PREFACE_LINES);
  assert.equal(
    new Set(
      [
        ...PREFACE_EYEBROW_TEMPLATES,
        ...PREFACE_ACKNOWLEDGEMENT_TEMPLATES,
        ...PREFACE_DISTANCE_TEMPLATES,
      ].map((template) => template.id),
    ).size,
    PREFACE_EYEBROW_TEMPLATES.length +
      PREFACE_ACKNOWLEDGEMENT_TEMPLATES.length +
      PREFACE_DISTANCE_TEMPLATES.length,
  );

  let cells = 0;
  let combinations = 0;
  for (const pressure of PRIMARY_PRESSURES) {
    for (const distance of DISTANCES) {
      cells += 1;
      const brief = createBrief(pressure, distance);
      const request = requestFor(brief);
      assert(Object.isFrozen(request));
      assert(Object.isFrozen(request.resonance));
      assert(Object.isFrozen(request.allowedEyebrowTemplateIds));
      assert(Object.isFrozen(request.allowedAcknowledgementTemplateIds));
      assert(Object.isFrozen(request.allowedDistanceTemplateIds));
      assert.equal(request.allowedEyebrowTemplateIds.length, 2);
      assert.equal(request.allowedAcknowledgementTemplateIds.length, 2);
      assert.equal(request.allowedDistanceTemplateIds.length, 2);

      for (const eyebrowTemplateId of
        request.allowedEyebrowTemplateIds) {
        for (const acknowledgementTemplateId of
          request.allowedAcknowledgementTemplateIds) {
          for (const distanceTemplateId of
            request.allowedDistanceTemplateIds) {
            combinations += 1;
            const candidate = {
              schemaVersion: PREFACE_PLAN_SCHEMA_VERSION,
              eyebrowTemplateId,
              acknowledgementTemplateId,
              distanceTemplateId,
            } satisfies PrefacePlanCandidate;
            const validation = validatePrefacePlanCandidate(
              candidate,
              request,
            );
            assert(validation.valid);

            const rendered = renderPersonalizedOpeningCopy(
              candidate,
              brief,
            );
            const eyebrow = PREFACE_EYEBROW_TEMPLATES.find(
              (template) => template.id === eyebrowTemplateId,
            );
            const acknowledgement =
              PREFACE_ACKNOWLEDGEMENT_TEMPLATES.find(
                (template) =>
                  template.id === acknowledgementTemplateId,
              );
            const distanceTemplate = PREFACE_DISTANCE_TEMPLATES.find(
              (template) => template.id === distanceTemplateId,
            );
            assert(rendered);
            assert(eyebrow);
            assert(acknowledgement);
            assert(distanceTemplate);
            assert.deepEqual(rendered, {
              eyebrow: eyebrow.line,
              prefaceLines: [
                acknowledgement.line,
                distanceTemplate.line,
                PREFACE_NON_EQUIVALENCE_LINE,
                PREFACE_INVITATION_LINE,
              ],
            });
            assert(validatePersonalizedOpeningCopy(rendered, brief));
            assert(
              !JSON.stringify(rendered).includes(eyebrowTemplateId) &&
                !JSON.stringify(rendered).includes(
                  acknowledgementTemplateId,
                ) &&
                !JSON.stringify(rendered).includes(
                  distanceTemplateId,
                ),
            );
          }
        }
      }
    }
  }

  return Object.freeze({ cells, combinations });
}

function assertStrictPlanValidation(): void {
  const request = requestFor(createBrief("rejection", "gentle"));
  const validPlan = firstCompatiblePrefacePlan(request);
  assert(validatePrefacePlanCandidate(validPlan, request).valid);
  assert(Object.isFrozen(validPlan));

  const wrongEyebrow = PREFACE_EYEBROW_TEMPLATES.find(
    (template) =>
      !request.allowedEyebrowTemplateIds.includes(
        template.id as never,
      ),
  );
  const wrongAcknowledgement = PREFACE_ACKNOWLEDGEMENT_TEMPLATES.find(
    (template) =>
      !request.allowedAcknowledgementTemplateIds.includes(
        template.id as never,
      ),
  );
  const wrongDistance = PREFACE_DISTANCE_TEMPLATES.find(
    (template) =>
      !request.allowedDistanceTemplateIds.includes(template.id as never),
  );
  assert(wrongEyebrow);
  assert(wrongAcknowledgement);
  assert(wrongDistance);

  const invalidCandidates: readonly unknown[] = [
    null,
    [],
    "not-an-object",
    {},
    { ...validPlan, schemaVersion: "preface-plan-v0" },
    { ...validPlan, eyebrowTemplateId: wrongEyebrow.id },
    { ...validPlan, eyebrowTemplateId: "Alone in Paris" },
    { ...validPlan, eyebrowTemplateId: "Suicide made every road narrow" },
    { ...validPlan, extra: "provider-authored prose" },
    {
      schemaVersion: validPlan.schemaVersion,
      eyebrowTemplateId: validPlan.eyebrowTemplateId,
      acknowledgementTemplateId: validPlan.acknowledgementTemplateId,
    },
    {
      ...validPlan,
      acknowledgementTemplateId: wrongAcknowledgement.id,
    },
    { ...validPlan, distanceTemplateId: wrongDistance.id },
    {
      ...validPlan,
      acknowledgementTemplateId: ` ${validPlan.acknowledgementTemplateId}`,
    },
    {
      ...validPlan,
      distanceTemplateId: validPlan.distanceTemplateId.toUpperCase(),
    },
  ];
  for (const candidate of invalidCandidates) {
    assert.equal(validatePrefacePlanCandidate(candidate, request).valid, false);
  }

  const wrongBrief = createBrief("loss", "direct");
  assert.deepEqual(
    renderPersonalizedPreface(validPlan, wrongBrief),
    PREFACE_FALLBACK_LINES,
  );
  assert.equal(
    validatePersonalizedPrefaceLines(
      renderPersonalizedPreface(validPlan, wrongBrief),
      wrongBrief,
    ),
    true,
  );
}

async function assertProviderBoundary(
  input: OpeningCopyInput,
): Promise<OpeningCopy> {
  const request = buildPrefacePlanRequest(
    toEyebrowProviderSurface(toEyebrowSurface(input)),
  );
  const validPlan = firstCompatiblePrefacePlan(request);
  const expectedCopy = renderPersonalizedOpeningCopy(
    validPlan,
    input.resonanceBrief,
  );
  assert(expectedCopy);
  assert(!isUniversalPreface(expectedCopy.prefaceLines));

  const previous = captureEnvironment([
    "LLM_API_KEY",
    "LLM_BASE_URL",
    "LLM_PROVIDER",
    "LLM_MODEL_PROSE",
    "LLM_PROSE_TEMPERATURE",
  ]);
  const originalFetch = globalThis.fetch;
  let response = new Response(
    JSON.stringify({
      choices: [
        { message: { content: JSON.stringify(validPlan) } },
      ],
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
  let capturedBody = "";
  process.env.LLM_API_KEY = "personalized-preface-contract-key";
  process.env.LLM_BASE_URL = "https://provider.invalid/v1";
  process.env.LLM_PROVIDER = "real";
  process.env.LLM_MODEL_PROSE = "gpt-oss-120b";
  process.env.LLM_PROSE_TEMPERATURE = "0.3";
  globalThis.fetch = (async (_url: RequestInfo | URL, init?: RequestInit) => {
    capturedBody = typeof init?.body === "string" ? init.body : "";
    return response;
  }) as typeof fetch;

  try {
    const copy = consumeDerivedOutput(
      await writeOpeningCopy(input, STORY_PROMPT_VERSION_V2),
      "provider_health_check",
    );
    assert.deepEqual(copy, expectedCopy);

    const body = JSON.parse(capturedBody) as Record<string, unknown>;
    assert.equal(
      createHash("sha256").update(capturedBody).digest("hex"),
      V2_PROVIDER_REQUEST_SHA256,
      "v2 provider request bytes changed",
    );
    assert.deepEqual(body.response_format, { type: "json_object" });
    assert.deepEqual(Object.keys(body).sort(), [
      "messages",
      "model",
      "response_format",
      "temperature",
    ]);
    const serializedBody = JSON.stringify(body);
    for (const forbidden of [
      PRIVATE_DISCLOSURE,
      "Priya",
      "Boston",
      "2024",
      input.stage.displayName,
      "biographicalFacts",
      "forbiddenEchoHashes",
      "sourceSpanHash",
    ]) {
      assert(
        !serializedBody.includes(forbidden),
        `provider body exposed ${forbidden}`,
      );
    }
    for (const template of [
      ...PREFACE_EYEBROW_TEMPLATES,
      ...PREFACE_ACKNOWLEDGEMENT_TEMPLATES,
      ...PREFACE_DISTANCE_TEMPLATES,
    ]) {
      assert(
        !serializedBody.includes(template.line),
        `provider received server-owned prose ${template.id}`,
      );
    }
    for (const id of [
      ...request.allowedEyebrowTemplateIds,
      ...request.allowedAcknowledgementTemplateIds,
      ...request.allowedDistanceTemplateIds,
    ]) {
      assert(serializedBody.includes(id));
    }

    response = new Response(
      JSON.stringify({
        choices: [{ message: { content: "not json" } }],
      }),
      { status: 200 },
    );
    assertUniversalFallback(
      consumeDerivedOutput(
        await writeOpeningCopy(input, STORY_PROMPT_VERSION_V2),
        "provider_health_check",
      ),
      "malformed JSON",
    );

    response = new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: JSON.stringify({
                ...validPlan,
                eyebrow: "Alone in Paris after the door closed",
              }),
            },
          },
        ],
      }),
      { status: 200 },
    );
    assertUniversalFallback(
      consumeDerivedOutput(
        await writeOpeningCopy(input, STORY_PROMPT_VERSION_V2),
        "provider_health_check",
      ),
      "provider-authored place copy",
    );

    response = new Response("provider unavailable", { status: 503 });
    assertUniversalFallback(
      consumeDerivedOutput(
        await writeOpeningCopy(input, STORY_PROMPT_VERSION_V2),
        "provider_health_check",
      ),
      "provider failure",
    );

    response = new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: JSON.stringify({
                ...validPlan,
                eyebrowTemplateId: input.stage.displayName,
              }),
            },
          },
        ],
      }),
      { status: 200 },
    );
    assertUniversalFallback(
      consumeDerivedOutput(
        await writeOpeningCopy(input, STORY_PROMPT_VERSION_V2),
        "provider_health_check",
      ),
      "figure-name identifier injection",
    );

    response = new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: JSON.stringify({
                ...validPlan,
                eyebrowTemplateId:
                  "Suicide made every road feel narrow",
              }),
            },
          },
        ],
      }),
      { status: 200 },
    );
    assertUniversalFallback(
      consumeDerivedOutput(
        await writeOpeningCopy(input, STORY_PROMPT_VERSION_V2),
        "provider_health_check",
      ),
      "sensitive-content identifier injection",
    );

    response = new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: JSON.stringify({
                ...validPlan,
                eyebrow: "Priya",
              }),
            },
          },
        ],
      }),
      { status: 200 },
    );
    assertUniversalFallback(
      consumeDerivedOutput(
        await writeOpeningCopy(input, STORY_PROMPT_VERSION_V2),
        "provider_health_check",
      ),
      "disclosure echo",
    );

    return copy;
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnvironment(previous);
  }
}

async function assertUnselectedV2CannotReachProvider(
  input: OpeningCopyInput,
): Promise<void> {
  const previous = captureEnvironment([
    "NODE_ENV",
    "ONWARD_PRODUCTION_RECIPE_ID",
  ]);
  const originalFetch = globalThis.fetch;
  let providerCalled = false;
  Reflect.set(process.env, "NODE_ENV", "production");
  process.env.ONWARD_PRODUCTION_RECIPE_ID =
    PRIMARY_STORY_RECIPE.recipeId;
  globalThis.fetch = (async () => {
    providerCalled = true;
    throw new Error("unselected prompt reached provider");
  }) as typeof fetch;
  try {
    await assert.rejects(
      () => writeOpeningCopy(input, STORY_PROMPT_VERSION_V2),
      (error: unknown) => error instanceof OpeningCopyPolicyError,
    );
    assert.equal(providerCalled, false);
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnvironment(previous);
  }
}

function assertArtifactBoundary(
  input: OpeningCopyInput,
  openingCopy: OpeningCopy,
): void {
  const manifest = getStoryRecipeById(PERSONALIZED_PREFACE_RECIPE_ID);
  assert(manifest);
  const matchRecipe = toMatchRecipe(manifest);
  const storySpec = buildDraftStorySpec(input.stage);
  const artifact = composeCanonicalStoryArtifact({
    storySpec,
    stage: input.stage,
    matchRecipe,
    openingCopy,
    framing: "partial",
    resonanceBrief: input.resonanceBrief,
    allowDraftSpec: true,
    now: new Date("2026-07-28T12:00:00.000Z"),
  });
  assert(validateStoredStoryArtifact(structuredClone(artifact)));
  const serialized = JSON.stringify(artifact);
  assert(!serialized.includes(PRIVATE_DISCLOSURE));
  for (const templateId of [
    ...PREFACE_EYEBROW_TEMPLATES.map((template) => template.id),
    ...PREFACE_ACKNOWLEDGEMENT_TEMPLATES.map((template) => template.id),
    ...PREFACE_DISTANCE_TEMPLATES.map((template) => template.id),
  ]) {
    assert(!serialized.includes(templateId));
  }

  const arbitrary = structuredClone(artifact);
  arbitrary.openingCopy.prefaceLines = [
    "The provider wrote this sentence.",
    ...arbitrary.openingCopy.prefaceLines.slice(1),
  ];
  rehash(arbitrary);
  assert.equal(validateStoredStoryArtifact(arbitrary), null);

  const reordered = structuredClone(artifact);
  reordered.openingCopy.prefaceLines = [
    reordered.openingCopy.prefaceLines[1],
    reordered.openingCopy.prefaceLines[0],
    ...reordered.openingCopy.prefaceLines.slice(2),
  ];
  rehash(reordered);
  assert.equal(validateStoredStoryArtifact(reordered), null);

  const identifierInjected = structuredClone(artifact);
  identifierInjected.openingCopy.prefaceLines = [
    ...identifierInjected.openingCopy.prefaceLines,
    "preface-ack-rejection-next-step-v1",
  ];
  rehash(identifierInjected);
  assert.equal(validateStoredStoryArtifact(identifierInjected), null);

  const extraKey = structuredClone(artifact) as typeof artifact & {
    openingCopy: OpeningCopy & { planId?: string };
  };
  extraKey.openingCopy.planId = "preface-plan-must-not-persist";
  rehash(extraKey);
  assert.equal(validateStoredStoryArtifact(extraKey), null);

  const downgraded = withArbitraryOpening(structuredClone(artifact));
  downgraded.recipe.match.storyPromptVersion =
    STORY_PROMPT_VERSION_V1;
  rehash(downgraded);
  assert.equal(validateStoredStoryArtifact(downgraded), null);

  const unknownVersion = withArbitraryOpening(
    structuredClone(artifact),
  );
  unknownVersion.recipe.match.storyPromptVersion =
    "opening-copy-prompt-unknown";
  rehash(unknownVersion);
  assert.equal(validateStoredStoryArtifact(unknownVersion), null);

  const missingVersion = withArbitraryOpening(
    structuredClone(artifact),
  );
  delete missingVersion.recipe.match.storyPromptVersion;
  rehash(missingVersion);
  assert.equal(validateStoredStoryArtifact(missingVersion), null);

  const incompatiblePressure = structuredClone(artifact);
  const lossLine = PREFACE_ACKNOWLEDGEMENT_TEMPLATES.find(
    (template) =>
      (template.allowedPressures as readonly PrimaryPressure[]).includes(
        "loss",
      ),
  )?.line;
  assert(lossLine);
  incompatiblePressure.openingCopy.prefaceLines = [
    lossLine,
    ...incompatiblePressure.openingCopy.prefaceLines.slice(1),
  ];
  rehash(incompatiblePressure);
  assert.equal(
    validateStoredStoryArtifact(incompatiblePressure),
    null,
  );
  const detailed = validateStoryArtifact(
    incompatiblePressure,
    storySpec,
    input.resonanceBrief,
  );
  assert.equal(detailed.valid, false);
  assert(detailed.failureReasons.includes("opening_copy_invalid"));

  const incompatibleEyebrow = structuredClone(artifact);
  const lossEyebrow = PREFACE_EYEBROW_TEMPLATES.find(
    (template) =>
      (template.allowedPressures as readonly PrimaryPressure[]).includes(
        "loss",
      ),
  )?.line;
  assert(lossEyebrow);
  incompatibleEyebrow.openingCopy.eyebrow = lossEyebrow;
  rehash(incompatibleEyebrow);
  assert.equal(
    validateStoredStoryArtifact(incompatibleEyebrow),
    null,
  );
  const eyebrowValidation = validateStoryArtifact(
    incompatibleEyebrow,
    storySpec,
    input.resonanceBrief,
  );
  assert.equal(eyebrowValidation.valid, false);
  assert(
    eyebrowValidation.failureReasons.includes("opening_copy_invalid"),
  );
}

function assertRecipeRegistration(): void {
  const recipe = getStoryRecipeById(PERSONALIZED_PREFACE_RECIPE_ID);
  assert(recipe);
  assert.equal(recipe.storyPromptVersion, STORY_PROMPT_VERSION_V2);
  assert.equal(getStoryRecipePromotion(recipe.recipeId), null);
  const plan = storyRecipeExecutionPlan(recipe);
  assert.equal(plan.storyPromptVersion, STORY_PROMPT_VERSION_V2);
  assert.equal(plan.retrievalMode, "keyword");
  assert.equal(plan.embedding, null);
  assert.equal(plan.hybridStoryComposerEnabled, false);
}

function requestFor(brief: ResonanceBrief): PrefacePlanRequest {
  return buildPrefacePlanRequest({
    resonance: toResonancePromptSurface(brief),
    throughLine: EPISODE_SHAPE,
  });
}

function createBrief(
  pressure: PrimaryPressure,
  distance: DesiredDistance,
): ResonanceBrief {
  return createResonanceBrief(
    `A private fixture for ${pressure} and ${distance}.`,
    boundariesFor(distance),
    pressure,
  );
}

function boundariesFor(
  distance: DesiredDistance,
): StoryBoundaries | undefined {
  if (distance === "unspecified") return undefined;
  return {
    maxIntensity: distance === "gentle" ? "gentle" : "direct",
    excludedFlags: [],
  };
}

function toMatchRecipe(manifest: StoryRecipeManifest): MatchRecipe {
  return {
    recipeId: manifest.recipeId,
    recipeManifestHash: manifest.manifestSha256,
    datasetVersion: manifest.datasetVersion,
    deploymentVersion: "personalized-preface-check",
    matchConfigVersion: manifest.matchConfigVersion,
    librarySnapshotSha256: manifest.librarySnapshotSha256,
    crisisRegexVersion: "crisis-regex-check",
    llmProvider: manifest.llmProvider,
    rerankModelId: manifest.rerankModelId,
    proseModelId: manifest.proseModelId,
    embeddingModelId: manifest.embeddingModelId,
    retrievalMode: manifest.retrievalMode,
    rerankPromptVersion: manifest.rerankPromptVersion,
    storyPromptVersion: manifest.storyPromptVersion,
    rerankTemperature: manifest.rerankTemperature,
    rerankReasoningEffort: manifest.rerankReasoningEffort,
    rerankTopK: manifest.rerankTopK,
    storyTemperature: manifest.storyTemperature,
    storyComposerMode: manifest.storyComposerMode,
    hybridStoryComposerEnabled: manifest.hybridStoryComposerEnabled,
    composerVersion: manifest.composerVersion,
    validatorVersion: manifest.validatorVersion,
    storySpecSchemaVersion: manifest.storySpecSchemaVersion,
    boundaryPolicyVersion: manifest.boundaryPolicyVersion,
    resonanceBriefVersion: manifest.resonanceBriefVersion,
  };
}

function rehash(
  artifact: Parameters<typeof storyArtifactContentHash>[0] & {
    contentHash: string;
  },
): void {
  artifact.contentHash = storyArtifactContentHash(artifact);
}

function withArbitraryOpening<
  Artifact extends {
    openingCopy: OpeningCopy;
  },
>(artifact: Artifact): Artifact {
  artifact.openingCopy = {
    eyebrow: "Arbitrary provider prose",
    prefaceLines: [
      "Arbitrary line one.",
      "Arbitrary line two.",
      "Arbitrary line three.",
      "Arbitrary line four.",
    ],
  };
  return artifact;
}

function assertUniversalFallback(
  copy: OpeningCopy,
  fixture: string,
): void {
  assert.equal(copy.eyebrow, NEUTRAL_EYEBROW, fixture);
  assert.deepEqual(copy.prefaceLines, PREFACE_FALLBACK_LINES, fixture);
}

function captureEnvironment(
  keys: readonly string[],
): ReadonlyMap<string, string | undefined> {
  return new Map(keys.map((key) => [key, process.env[key]]));
}

function restoreEnvironment(
  values: ReadonlyMap<string, string | undefined>,
): void {
  for (const [key, value] of values) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

void main();
