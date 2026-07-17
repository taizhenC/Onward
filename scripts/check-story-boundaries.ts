import "./_smoke-bootstrap";
import { FIGURE_STAGES } from "../lib/figures-data";
import {
  BOUNDARY_TOPICS,
  STORY_BOUNDARY_POLICY_VERSION,
  filterStorySpecCatalog,
  parseStoryBoundaries,
  storyProfileAllowed,
  type StoryBoundaries,
  type StoryIntensity,
} from "../lib/story-boundaries";
import { buildDraftStorySpec } from "../lib/story-spec";
import {
  composeCanonicalStoryArtifact,
  StoryCompositionError,
  storyArtifactContentHash,
  validateStoryArtifact,
} from "../lib/story-artifact";
import { match } from "../lib/matching";
import { storySpecStageKey } from "../lib/story-spec-repository";
import { handleIntake } from "../lib/intake";
import { _sessionCount } from "../lib/session";
import { _storyArtifactCount } from "../lib/story-artifacts";
import { reviewedStoryContentNote } from "../lib/story-playback";
import { createResonanceBrief } from "../lib/resonance-brief";
import type { StorySpec } from "../lib/story-spec-types";
import type { MatchRecipe } from "../lib/types";
import { POST as matchRoutePost } from "../app/api/match/route";
import { createTelemetryFlowId } from "../lib/telemetry";

process.env.PERSISTENCE = "memory";
process.env.LLM_PROVIDER = "stub";

const recipe: MatchRecipe = {
  recipeId: "boundary-contract-test",
  matchConfigVersion: "test",
  crisisRegexVersion: "test",
  llmProvider: "stub",
  rerankModelId: "stub",
  proseModelId: "stub",
  embeddingModelId: "stub",
  retrievalMode: "keyword",
};

const rank: Record<StoryIntensity, number> = { gentle: 0, moderate: 1, direct: 2 };

async function main(): Promise<void> {
  const failures: string[] = [];
  checkParsing(failures);
  checkEligibilityMatrix(failures);
  await checkRetrievalAndArtifactDefense(failures);
  await checkIntakeRecovery(failures);

  console.log("Onward story-boundary validator");
  console.log("=================================");
  if (failures.length > 0) {
    for (const failure of failures) console.error(`FAIL ${failure}`);
    console.error(`${failures.length} boundary contract failure(s).`);
    process.exit(1);
  }
  console.log("PASS strict optional boundary parsing and closed enums");
  console.log("PASS intensity/topic eligibility matrix");
  console.log("PASS prohibited stages cannot re-enter retrieval or composition");
  console.log("PASS no-eligible and invalid-input paths persist nothing");
  console.log("PASS crisis resources precede malformed optional boundaries");
}

function checkParsing(failures: string[]): void {
  const valid: StoryBoundaries = {
    maxIntensity: "moderate",
    excludedFlags: ["addiction", "serious_illness"],
  };
  if ("error" in parseStoryBoundaries(valid)) failures.push("valid boundaries rejected");
  if (!("value" in parseStoryBoundaries(undefined))) failures.push("omitted boundaries rejected");

  const invalid: Array<[string, unknown]> = [
    ["null", null],
    ["unknown intensity", { maxIntensity: "extreme", excludedFlags: [] }],
    ["unknown topic", { maxIntensity: "gentle", excludedFlags: ["unknown"] }],
    ["duplicate topic", { maxIntensity: "gentle", excludedFlags: ["addiction", "addiction"] }],
    ["extra field", { maxIntensity: "gentle", excludedFlags: [], diagnosis: true }],
    ["missing field", { maxIntensity: "gentle" }],
  ];
  for (const [name, input] of invalid) {
    if (!("error" in parseStoryBoundaries(input))) {
      failures.push(`${name} boundaries were accepted`);
    }
  }
  if (BOUNDARY_TOPICS.length !== 8) failures.push("boundary topic UI catalog is incomplete");
}

function checkEligibilityMatrix(failures: string[]): void {
  const intensities: StoryIntensity[] = ["gentle", "moderate", "direct"];
  for (const profileIntensity of intensities) {
    for (const maximum of intensities) {
      const allowed = storyProfileAllowed(
        { intensity: profileIntensity, flags: [], contentNote: "Reviewed." },
        { maxIntensity: maximum, excludedFlags: [] },
      );
      if (allowed !== (rank[profileIntensity] <= rank[maximum])) {
        failures.push(`intensity ${profileIntensity} <= ${maximum} evaluated incorrectly`);
      }
    }
  }
  const allFlags = BOUNDARY_TOPICS.map((topic) => topic.flag);
  for (const flag of allFlags) {
    const allowed = storyProfileAllowed(
      { intensity: "gentle", flags: [flag], contentNote: "Reviewed." },
      { maxIntensity: "direct", excludedFlags: [flag] },
    );
    if (allowed) failures.push(`excluded topic ${flag} was allowed`);
  }
}

async function checkRetrievalAndArtifactDefense(failures: string[]): Promise<void> {
  const douglassStage = FIGURE_STAGES.find((stage) => stage.figureKey === "douglass")!;
  const butlerStage = FIGURE_STAGES.find((stage) => stage.figureKey === "butler")!;
  const douglass = buildDraftStorySpec(douglassStage);
  const butler = buildDraftStorySpec(butlerStage);
  douglass.contentProfile.flags = ["abuse_or_violence"];
  butler.contentProfile.flags = [];
  const catalog = new Map<string, StorySpec>([
    [storySpecStageKey(douglass.figureKey, douglass.stageId), douglass],
    [storySpecStageKey(butler.figureKey, butler.stageId), butler],
  ]);
  const boundaries: StoryBoundaries = {
    maxIntensity: "direct",
    excludedFlags: ["abuse_or_violence"],
  };
  const eligible = filterStorySpecCatalog(catalog, boundaries);
  const selected = await match({
    age: 21,
    feeling: "I escaped and do not know where I belong",
    eligibleStageKeys: new Set(eligible.keys()),
  });
  if (selected.figureKey !== "butler") {
    failures.push("excluded high-resonance stage reached the matcher");
  }

  const directSpec = structuredClone(butler);
  directSpec.contentProfile = {
    intensity: "direct",
    flags: ["addiction"],
    contentNote: "Reviewed direct account.",
  };
  const restrictive: StoryBoundaries = {
    maxIntensity: "moderate",
    excludedFlags: ["addiction"],
  };
  try {
    compose(directSpec, butlerStage, restrictive);
    failures.push("composition accepted a boundary-violating StorySpec");
  } catch (error) {
    if (!(error instanceof StoryCompositionError) || !error.reasons.includes("boundary_violation")) {
      failures.push("composition boundary rejection used the wrong reason enum");
    }
  }

  const allowedSpec = structuredClone(butler);
  allowedSpec.contentProfile = {
    intensity: "gentle",
    flags: [],
    contentNote: "Reviewed gentle account.",
  };
  const artifact = compose(allowedSpec, butlerStage, restrictive);
  const serialized = JSON.stringify(artifact);
  if (
    serialized.includes('"boundaries"') ||
    serialized.includes('"excludedFlags"') ||
    serialized.includes('"maxIntensity"') ||
    artifact.recipe.boundaryPolicyVersion !== STORY_BOUNDARY_POLICY_VERSION
  ) {
    failures.push("artifact persisted boundary selections or omitted policy version");
  }
  if (reviewedStoryContentNote(artifact.contentProfile) !== null) {
    failures.push("unreviewed draft content note reached the client projection");
  }
  const reviewedNote = reviewedStoryContentNote({
    ...artifact.contentProfile,
    reviewed: true,
  });
  if (reviewedNote !== artifact.contentProfile.contentNote) {
    failures.push("reviewed content note was not projected exactly");
  }

  const launderedArtifact = structuredClone(artifact);
  launderedArtifact.contentProfile = {
    intensity: "gentle",
    flags: [],
    contentNote: "Substituted metadata.",
    reviewed: false,
  };
  launderedArtifact.contentHash = storyArtifactContentHash(launderedArtifact);
  const launderedSpec = structuredClone(allowedSpec);
  launderedSpec.contentProfile = {
    intensity: "direct",
    flags: ["addiction"],
    contentNote: "Reviewed direct account.",
  };
  const launderingValidation = validateStoryArtifact(
    launderedArtifact,
    launderedSpec,
    createResonanceBrief(
      "A private situation that should not enter the artifact.",
      restrictive,
    ),
    restrictive,
  );
  if (
    launderingValidation.valid ||
    !launderingValidation.failureReasons.includes("content_profile_mismatch") ||
    !launderingValidation.failureReasons.includes("boundary_violation")
  ) {
    failures.push("artifact metadata could launder an ineligible StorySpec profile");
  }
}

async function checkIntakeRecovery(failures: string[]): Promise<void> {
  const ctx = {
    userId: "boundary-check-user",
    ipHash: "boundary-check-ip",
    telemetryFlowId: createTelemetryFlowId(),
  };
  const beforeSessions = await _sessionCount();
  const beforeArtifacts = await _storyArtifactCount();
  const noEligible = await handleIntake(
    {
      age: 28,
      feeling: "I keep being rejected and do not know whether to continue",
      boundaries: { maxIntensity: "gentle", excludedFlags: [] },
    },
    ctx,
  );
  if (!("noEligibleStory" in noEligible)) failures.push("no-eligible state was not explicit");
  if (
    (await _sessionCount()) !== beforeSessions ||
    (await _storyArtifactCount()) !== beforeArtifacts
  ) {
    failures.push("no-eligible state persisted a session or artifact");
  }
  if (/gentle|excluded|flag/i.test(JSON.stringify(noEligible))) {
    failures.push("no-eligible response exposed selected boundary values");
  }

  const invalid = await handleIntake(
    {
      age: 28,
      feeling: "I keep being rejected and do not know whether to continue",
      boundaries: { maxIntensity: "extreme", excludedFlags: [] },
    },
    ctx,
  );
  if (!("error" in invalid)) failures.push("invalid boundaries did not fail validation");
  if (
    (await _sessionCount()) !== beforeSessions ||
    (await _storyArtifactCount()) !== beforeArtifacts
  ) {
    failures.push("invalid boundaries persisted a session or artifact");
  }

  const crisis = await handleIntake(
    {
      age: 28,
      feeling: "I want to kill myself",
      boundaries: { malformed: true },
    },
    ctx,
  );
  if (!("crisis" in crisis)) failures.push("malformed boundaries hid crisis resources");

  const routeResponse = await matchRoutePost(
    new Request("http://localhost/api/match", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        age: 28,
        feeling: "I want to kill myself",
        boundaries: { malformed: true },
      }),
    }),
  );
  const routePayload = (await routeResponse.json()) as Record<string, unknown>;
  if (routeResponse.status !== 200 || routePayload.crisis !== true) {
    failures.push("unauthenticated crisis route did not return resources first");
  }
}

function compose(
  spec: StorySpec,
  stage: (typeof FIGURE_STAGES)[number],
  boundaries: StoryBoundaries,
) {
  return composeCanonicalStoryArtifact({
    storySpec: spec,
    stage,
    matchRecipe: recipe,
    openingCopy: {
      eyebrow: "A story for the difficult middle",
      prefaceLines: ["This story is true.", "Your life is not theirs."],
    },
    framing: "partial",
    resonanceBrief: createResonanceBrief(
      "A private situation that should not enter the artifact.",
      boundaries,
    ),
    boundaries,
    allowDraftSpec: true,
  });
}

void main();
