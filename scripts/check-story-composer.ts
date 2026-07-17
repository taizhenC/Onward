import "./_smoke-bootstrap";
import { FIGURE_STAGES } from "../lib/figures-data";
import { buildDraftStorySpec } from "../lib/story-spec";
import {
  HYBRID_BRIDGE_TEMPLATE_IDS,
  HYBRID_PLAN_SCHEMA_VERSION,
  HYBRID_TEMPLATE_POLICY_VERSION,
  HYBRID_TRANSITION_TEMPLATE_IDS,
  HybridPlanProviderError,
  buildHybridPlanRequest,
  type HybridCompositionPlan,
  type HybridPlanRequest,
} from "../lib/hybrid-composition";
import { createResonanceBrief } from "../lib/resonance-brief";
import {
  composeStoryArtifact,
  hybridStoryComposerEnabled,
  type StoryComposerInput,
} from "../lib/story-composer";
import {
  StoryCompositionError,
  storyArtifactContentHash,
  validateStoredStoryArtifact,
  validateStoryArtifact,
} from "../lib/story-artifact";
import { requestHybridPlanReal } from "../lib/llm-real";
import type { MatchRecipe } from "../lib/types";

const PRIVATE_DISCLOSURE =
  "Priya left Boston in 2024, and my private cobalt compass no longer points anywhere after another rejection.";

const recipe: MatchRecipe = {
  recipeId: "hybrid-composer-contract",
  matchConfigVersion: "test",
  crisisRegexVersion: "test",
  llmProvider: "stub",
  rerankModelId: "stub",
  proseModelId: "stub",
  embeddingModelId: "stub",
  retrievalMode: "keyword",
  resonanceBriefVersion: "resonance-brief-v1-2026-07",
};

async function main(): Promise<void> {
  const failures: string[] = [];
  await checkFirstPassHybrid(failures);
  await checkStructuredRetry(failures);
  await checkCanonicalFallbacks(failures);
  await checkOpeningAndBoundaryPreflight(failures);
  await checkProviderProjection(failures);

  console.log("Onward hybrid Story Composer validator");
  console.log("======================================");
  if (failures.length > 0) {
    for (const failure of failures) console.error(`FAIL ${failure}`);
    console.error(`${failures.length} Story Composer contract failure(s).`);
    process.exit(1);
  }
  console.log("PASS first-pass hybrid artifact is complete, exact, and replayable");
  console.log("PASS invalid plans receive one structured retry and no more");
  console.log("PASS provider, output, and validator failures return canonical artifacts");
  console.log("PASS opening, boundary, privacy, and feature-flag preflight");
  console.log("PASS composition provider receives only closed reduced fields");
}

async function checkFirstPassHybrid(failures: string[]): Promise<void> {
  const fixture = makeFixture();
  let calls = 0;
  const artifact = await composeStoryArtifact(fixture.input, {
    hybridEnabled: true,
    requestPlan: async (request) => {
      calls += 1;
      return validPlan(request);
    },
  });
  const personalized = artifact.beats.filter((beat) => beat.personalization);
  if (
    calls !== 1 ||
    artifact.composition.mode !== "hybrid" ||
    artifact.composition.attemptCount !== 1 ||
    artifact.composition.planVersion !== HYBRID_PLAN_SCHEMA_VERSION ||
    artifact.composition.fallbackReason !== undefined ||
    artifact.recipe.hybridTemplatePolicyVersion !==
      HYBRID_TEMPLATE_POLICY_VERSION ||
    personalized.length !== 2 ||
    personalized.some(
      (beat) =>
        beat.personalization?.policyVersion !== HYBRID_TEMPLATE_POLICY_VERSION,
    )
  ) {
    failures.push("first valid plan did not produce the expected hybrid recipe");
  }
  if (
    !validateStoredStoryArtifact(structuredClone(artifact)) ||
    !validateStoryArtifact(
      artifact,
      fixture.spec,
      fixture.brief,
    ).valid
  ) {
    failures.push("hybrid artifact failed stored or StorySpec-aware validation");
  }
  for (const [index, beat] of artifact.beats.entries()) {
    const specBeat = fixture.spec.arc[index];
    if (
      !beat.text.startsWith(specBeat.canonicalText) ||
      !sameSet(beat.factIds, [
        ...specBeat.requiredFactIds,
        ...specBeat.optionalFactIds,
      ]) ||
      !sameSet(beat.entityIds, specBeat.entityIds) ||
      !sameSet(beat.quoteIds, specBeat.quoteIds)
    ) {
      failures.push(`hybrid beat ${beat.role} changed its canonical evidence spine`);
    }
  }
  const serialized = JSON.stringify(artifact);
  if (
    serialized.includes(PRIVATE_DISCLOSURE) ||
    serialized.includes("Priya") ||
    serialized.includes("Boston") ||
    serialized.includes('"forbiddenEchoHashes"') ||
    serialized.includes('"sourceSpanHash"')
  ) {
    failures.push("hybrid artifact retained raw disclosure or ephemeral brief data");
  }

  const unknownTemplate = structuredClone(artifact);
  const beat = unknownTemplate.beats.find((candidate) => candidate.personalization);
  if (beat?.personalization) {
    (beat.personalization as { templateId: string }).templateId = "free-form-prose";
    unknownTemplate.contentHash = storyArtifactContentHash(unknownTemplate);
    if (validateStoredStoryArtifact(unknownTemplate)) {
      failures.push("stored validator accepted a non-catalog personalization template");
    }
  }
}

async function checkStructuredRetry(failures: string[]): Promise<void> {
  const fixture = makeFixture();
  const requests: HybridPlanRequest[] = [];
  const artifact = await composeStoryArtifact(fixture.input, {
    hybridEnabled: true,
    requestPlan: async (request) => {
      requests.push(request);
      if (requests.length === 1) {
        return {
          schemaVersion: HYBRID_PLAN_SCHEMA_VERSION,
          transitionRole: "scene",
          transitionTemplateId: HYBRID_TRANSITION_TEMPLATE_IDS[0],
          bridgeTemplateId: HYBRID_BRIDGE_TEMPLATE_IDS[0],
          prose: PRIVATE_DISCLOSURE,
        };
      }
      return validPlan(request);
    },
  });
  if (
    requests.length !== 2 ||
    !Object.isFrozen(requests[0]) ||
    !Object.isFrozen(requests[0].resonance) ||
    !Object.isFrozen(requests[0].allowedTransitionRoles) ||
    artifact.composition.mode !== "hybrid" ||
    artifact.composition.attemptCount !== 2 ||
    !requests[1].priorFailureReasons.includes("shape_invalid") ||
    !requests[1].priorFailureReasons.includes("zone_not_allowed") ||
    JSON.stringify(requests[1].priorFailureReasons).includes(PRIVATE_DISCLOSURE)
  ) {
    failures.push("structured retry did not carry only closed validation reasons");
  }
}

async function checkCanonicalFallbacks(failures: string[]): Promise<void> {
  const invalidFixture = makeFixture();
  let invalidCalls = 0;
  const invalidFallback = await composeStoryArtifact(invalidFixture.input, {
    hybridEnabled: true,
    requestPlan: async () => {
      invalidCalls += 1;
      return { prose: PRIVATE_DISCLOSURE };
    },
  });
  if (
    invalidCalls !== 2 ||
    invalidFallback.composition.mode !== "canonical_fallback" ||
    invalidFallback.composition.fallbackReason !== "provider_output_invalid" ||
    invalidFallback.composition.attemptCount !== 2 ||
    invalidFallback.beats.some((beat) => beat.personalization)
  ) {
    failures.push("invalid provider output did not use bounded canonical fallback");
  }

  const timeoutFixture = makeFixture();
  let timeoutCalls = 0;
  const timeoutFallback = await composeStoryArtifact(timeoutFixture.input, {
    hybridEnabled: true,
    requestPlan: async () => {
      timeoutCalls += 1;
      throw new HybridPlanProviderError("provider_timeout", "synthetic timeout");
    },
  });
  if (
    timeoutCalls !== 2 ||
    timeoutFallback.composition.fallbackReason !== "provider_timeout" ||
    timeoutFallback.beats.length !== 7 ||
    !validateStoredStoryArtifact(structuredClone(timeoutFallback))
  ) {
    failures.push("provider timeout did not return a complete validated fallback");
  }

  const echoBrief = createResonanceBrief("being refused or unseen");
  const echoFixture = makeFixture(echoBrief);
  let rejectedCalls = 0;
  const validatorFallback = await composeStoryArtifact(echoFixture.input, {
    hybridEnabled: true,
    requestPlan: async (request) => {
      rejectedCalls += 1;
      return validPlan(request);
    },
  });
  if (
    rejectedCalls !== 2 ||
    validatorFallback.composition.fallbackReason !== "validator_rejected" ||
    validatorFallback.composition.mode !== "canonical_fallback"
  ) {
    failures.push("privacy-rejected personalization did not retry once then fall back");
  }
}

async function checkOpeningAndBoundaryPreflight(failures: string[]): Promise<void> {
  const fixture = makeFixture();
  let disabledCalls = 0;
  const disabled = await composeStoryArtifact(fixture.input, {
    hybridEnabled: false,
    requestPlan: async () => {
      disabledCalls += 1;
      return null;
    },
  });
  if (
    disabledCalls !== 0 ||
    disabled.composition.mode !== "canonical_fallback" ||
    disabled.composition.fallbackReason !== "canonical_only" ||
    disabled.composition.attemptCount !== 0 ||
    hybridStoryComposerEnabled(undefined, "production") ||
    !hybridStoryComposerEnabled(undefined, "development") ||
    !hybridStoryComposerEnabled("true", "production") ||
    hybridStoryComposerEnabled("false", "development")
  ) {
    failures.push("hybrid feature flag did not fail closed in production");
  }

  const unsafeOpeningFixture = makeFixture();
  unsafeOpeningFixture.input.openingCopy = {
    eyebrow: "Everything will be cured",
    prefaceLines: ["You should do what they did."],
  };
  const safeOpening = await composeStoryArtifact(unsafeOpeningFixture.input, {
    hybridEnabled: false,
  });
  if (
    safeOpening.openingCopy.eyebrow !==
      unsafeOpeningFixture.input.fallbackOpeningCopy.eyebrow ||
    safeOpening.composition.fallbackReason !== "validator_rejected"
  ) {
    failures.push("invalid generated opening did not use the reviewed fallback copy");
  }

  const boundaryFixture = makeFixture();
  boundaryFixture.spec.contentProfile.intensity = "direct";
  boundaryFixture.input.boundaries = {
    maxIntensity: "gentle",
    excludedFlags: [],
  };
  let boundaryCalls = 0;
  try {
    await composeStoryArtifact(boundaryFixture.input, {
      hybridEnabled: true,
      requestPlan: async () => {
        boundaryCalls += 1;
        return null;
      },
    });
    failures.push("boundary-violating StorySpec reached composition");
  } catch (error) {
    if (
      !(error instanceof StoryCompositionError) ||
      !error.reasons.includes("boundary_violation") ||
      boundaryCalls !== 0
    ) {
      failures.push("boundary preflight did not fail before the provider");
    }
  }
}

async function checkProviderProjection(failures: string[]): Promise<void> {
  const fixture = makeFixture();
  const request = buildHybridPlanRequest(fixture.spec, fixture.brief);
  const plan = validPlan(request);
  const originalFetch = globalThis.fetch;
  const previousKey = process.env.LLM_API_KEY;
  const previousBaseUrl = process.env.LLM_BASE_URL;
  let capturedBody = "";
  process.env.LLM_API_KEY = "hybrid-contract-key";
  process.env.LLM_BASE_URL = "https://provider.invalid/v1";
  globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    capturedBody = typeof init?.body === "string" ? init.body : "";
    return new Response(
      JSON.stringify({
        choices: [{ message: { content: JSON.stringify(plan) } }],
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  }) as typeof fetch;
  try {
    const response = await requestHybridPlanReal(request);
    if (JSON.stringify(response) !== JSON.stringify(plan)) {
      failures.push("real composition provider did not return its structured plan");
    }
    if (
      !capturedBody ||
      capturedBody.includes(PRIVATE_DISCLOSURE) ||
      capturedBody.includes("Priya") ||
      capturedBody.includes("Boston") ||
      capturedBody.includes("2024") ||
      fixture.brief.forbiddenEchoHashes.some((hash) => capturedBody.includes(hash)) ||
      capturedBody.includes("sourceSpanHash") ||
      capturedBody.includes("forbiddenEchoHashes")
    ) {
      failures.push("composition provider request exposed raw or fingerprinted input");
    }
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnv("LLM_API_KEY", previousKey);
    restoreEnv("LLM_BASE_URL", previousBaseUrl);
  }
}

function makeFixture(brief = createResonanceBrief(PRIVATE_DISCLOSURE)): {
  input: StoryComposerInput;
  spec: ReturnType<typeof buildDraftStorySpec>;
  brief: ReturnType<typeof createResonanceBrief>;
} {
  const stage = FIGURE_STAGES.find((candidate) => candidate.figureKey === "butler")!;
  const spec = buildDraftStorySpec(stage);
  return {
    spec,
    brief,
    input: {
      storySpec: spec,
      stage,
      matchRecipe: recipe,
      openingCopy: {
        eyebrow: "A life under a similar pressure",
        prefaceLines: ["This story is true.", "Your life is not theirs."],
      },
      fallbackOpeningCopy: {
        eyebrow: "A life under a similar pressure",
        prefaceLines: ["This story is true.", "Your life is not theirs."],
      },
      framing: "partial",
      resonanceBrief: brief,
      allowDraftSpec: true,
    },
  };
}

function validPlan(request: HybridPlanRequest): HybridCompositionPlan {
  return {
    schemaVersion: HYBRID_PLAN_SCHEMA_VERSION,
    transitionRole: request.allowedTransitionRoles.includes("turning_point")
      ? "turning_point"
      : request.allowedTransitionRoles[0],
    transitionTemplateId: request.allowedTransitionTemplateIds[0],
    bridgeTemplateId: request.allowedBridgeTemplateIds[0],
  };
}

function sameSet(left: string[], right: string[]): boolean {
  const a = [...new Set(left)].sort();
  const b = [...new Set(right)].sort();
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function restoreEnv(key: string, value: string | undefined): void {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}

void main();
