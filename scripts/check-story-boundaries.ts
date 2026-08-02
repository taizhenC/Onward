import "./_smoke-bootstrap";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  selectedStoryBoundaries,
  StoryBoundaryEditor,
  type StoryBoundaryEditorValue,
  updateStoryBoundaryEditorValue,
} from "../components/StoryBoundaryEditor";
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
import { CONTENT_FLAGS, type StorySpec } from "../lib/story-spec-types";
import type { MatchRecipe } from "../lib/types";
import { POST as matchRoutePost } from "../app/api/match/route";
import { createTelemetryFlowId } from "../lib/telemetry";
import { STORY_PROMPT_VERSION_V1 } from "../lib/llm-recipe-constants";
import {
  DEFAULT_PREFACE_LINES,
  NEUTRAL_EYEBROW,
} from "../lib/opening-copy";

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
  storyPromptVersion: STORY_PROMPT_VERSION_V1,
};

const rank: Record<StoryIntensity, number> = { gentle: 0, moderate: 1, direct: 2 };

async function main(): Promise<void> {
  const failures: string[] = [];
  checkParsing(failures);
  checkEditorPresentation(failures);
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
  console.log("PASS reusable native boundary editor and independent radio groups");
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
  if (
    JSON.stringify(BOUNDARY_TOPICS.map((topic) => topic.flag)) !==
    JSON.stringify(CONTENT_FLAGS)
  ) {
    failures.push("boundary topic UI catalog drifted from the closed content flags");
  }
}

function checkEditorPresentation(failures: string[]): void {
  checkEditorTransitions(failures);
  const hiddenDraft: StoryBoundaryEditorValue = {
    enabled: false,
    boundaries: {
      maxIntensity: "gentle",
      excludedFlags: ["addiction"],
    },
  };
  const hidden = renderBoundaryEditor(hiddenDraft);
  if (countMatches(hidden, /type="checkbox"/g) !== 1) {
    failures.push("disabled boundary selection did not render one native toggle");
  }
  if (/type="radio"|Topics to leave out/.test(hidden)) {
    failures.push("disabled boundary selection exposed its retained draft controls");
  }
  if (/gentle|addiction|maxIntensity|excludedFlags/.test(hidden)) {
    failures.push("disabled boundary selection serialized its hidden draft");
  }
  if (!/aria-expanded="false"/.test(hidden)) {
    failures.push("disabled boundary selection did not announce its collapsed state");
  }

  const enabledValue: StoryBoundaryEditorValue = {
    ...hiddenDraft,
    enabled: true,
  };
  const enabled = renderBoundaryEditor(enabledValue);
  if (countMatches(enabled, /<fieldset/g) !== 3) {
    failures.push("enabled boundary editor lost its native grouped fieldsets");
  }
  if (countMatches(enabled, /type="radio"/g) !== 3) {
    failures.push("boundary editor did not render all three native intensities");
  }
  if (countMatches(enabled, /type="checkbox"/g) !== BOUNDARY_TOPICS.length + 1) {
    failures.push("boundary editor did not render the toggle plus every topic checkbox");
  }
  if (/\srole=/.test(enabled)) {
    failures.push("boundary editor replaced native semantics with ARIA roles");
  }
  for (const intensity of ["gentle", "moderate", "direct"] as const) {
    if (!enabled.includes(`value="${intensity}"`)) {
      failures.push(`boundary editor omitted the ${intensity} intensity`);
    }
  }
  for (const topic of BOUNDARY_TOPICS) {
    if (!enabled.includes(topic.label) || !enabled.includes(topic.description)) {
      failures.push(`boundary editor omitted reviewed copy for ${topic.flag}`);
    }
  }

  const ids = [...enabled.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  const idSet = new Set(ids);
  if (ids.length !== idSet.size) {
    failures.push("boundary editor rendered duplicate control or description IDs");
  }
  const inputIds = new Set(
    [...enabled.matchAll(/<input[^>]*\sid="([^"]+)"/g)].map((match) => match[1]),
  );
  const spanIds = new Set(
    [...enabled.matchAll(/<span[^>]*\sid="([^"]+)"/g)].map((match) => match[1]),
  );
  const labelTargets = [...enabled.matchAll(/\sfor="([^"]+)"/g)].map(
    (match) => match[1],
  );
  const namedTargets = [...enabled.matchAll(/aria-labelledby="([^"]+)"/g)].map(
    (match) => match[1],
  );
  const describedTargets = [
    ...enabled.matchAll(/aria-describedby="([^"]+)"/g),
  ].flatMap((match) => match[1].split(/\s+/));
  if (
    labelTargets.length !== 12 ||
    namedTargets.length !== 12 ||
    describedTargets.length !== 12
  ) {
    failures.push("boundary editor does not expose exactly 12 label/description pairs");
  }
  for (const target of labelTargets) {
    if (!inputIds.has(target)) {
      failures.push(`boundary editor label targets non-input ID ${target}`);
    }
  }
  for (const target of namedTargets) {
    if (!spanIds.has(target) || !target.endsWith("-label")) {
      failures.push(`boundary editor accessible name targets invalid ID ${target}`);
    }
  }
  for (const target of describedTargets) {
    if (!spanIds.has(target) || !target.endsWith("-description")) {
      failures.push(`boundary editor description targets invalid ID ${target}`);
    }
  }
  if (namedTargets.some((target) => describedTargets.includes(target))) {
    failures.push("boundary editor reused one node as both name and description");
  }
  const controlledId = enabled.match(/aria-controls="([^"]+)"/)?.[1];
  if (!controlledId || !idSet.has(controlledId)) {
    failures.push("expanded boundary toggle does not control the rendered options panel");
  }

  const disabled = renderBoundaryEditor(enabledValue, true);
  if (!/^<fieldset[^>]*disabled=""/.test(disabled)) {
    failures.push("boundary editor did not disable every control through its fieldset");
  }

  const pair = renderToStaticMarkup(
    createElement(
      "div",
      null,
      createElement(StoryBoundaryEditor, {
        value: enabledValue,
        onChange: () => undefined,
      }),
      createElement(StoryBoundaryEditor, {
        value: enabledValue,
        onChange: () => undefined,
      }),
    ),
  );
  const radioNames = [...pair.matchAll(/type="radio"[^>]*name="([^"]+)"/g)].map(
    (match) => match[1],
  );
  const uniqueRadioNames = new Set(radioNames);
  if (radioNames.length !== 6 || uniqueRadioNames.size !== 2) {
    failures.push("two boundary editors did not receive independent radio groups");
  }
}

function checkEditorTransitions(failures: string[]): void {
  const original: StoryBoundaryEditorValue = {
    enabled: true,
    boundaries: {
      maxIntensity: "moderate",
      excludedFlags: ["addiction", "serious_illness"],
    },
  };
  Object.freeze(original.boundaries.excludedFlags);
  Object.freeze(original.boundaries);
  Object.freeze(original);

  const disabled = updateStoryBoundaryEditorValue(original, {
    type: "set_enabled",
    enabled: false,
  });
  if (
    disabled.enabled ||
    disabled.boundaries.maxIntensity !== "moderate" ||
    disabled.boundaries.excludedFlags.join(",") !==
      "addiction,serious_illness" ||
    disabled === original ||
    disabled.boundaries === original.boundaries ||
    disabled.boundaries.excludedFlags === original.boundaries.excludedFlags
  ) {
    failures.push("disabling the editor did not retain and clone its hidden draft");
  }
  if (selectedStoryBoundaries(disabled) !== undefined) {
    failures.push("disabled editor projected an explicit boundary request");
  }

  const restored = updateStoryBoundaryEditorValue(disabled, {
    type: "set_enabled",
    enabled: true,
  });
  const restoredSelection = selectedStoryBoundaries(restored);
  if (
    !restoredSelection ||
    restoredSelection.maxIntensity !== "moderate" ||
    restoredSelection.excludedFlags.join(",") !==
      "addiction,serious_illness" ||
    restoredSelection.excludedFlags === restored.boundaries.excludedFlags
  ) {
    failures.push("re-enabled editor did not restore an isolated boundary selection");
  }

  for (const maxIntensity of ["gentle", "moderate", "direct"] as const) {
    const changed = updateStoryBoundaryEditorValue(original, {
      type: "set_intensity",
      maxIntensity,
    });
    if (
      !changed.enabled ||
      changed.boundaries.maxIntensity !== maxIntensity ||
      changed.boundaries.excludedFlags.join(",") !==
        "addiction,serious_illness" ||
      changed === original ||
      changed.boundaries === original.boundaries ||
      changed.boundaries.excludedFlags === original.boundaries.excludedFlags
    ) {
      failures.push(
        `changing to ${maxIntensity} did not preserve enabled state in a fresh value`,
      );
    }
  }

  let topicValue: StoryBoundaryEditorValue = {
    enabled: true,
    boundaries: { maxIntensity: "direct", excludedFlags: [] },
  };
  for (const flag of CONTENT_FLAGS) {
    const priorTopicValue = topicValue;
    const nextTopicValue = updateStoryBoundaryEditorValue(priorTopicValue, {
      type: "toggle_topic",
      flag,
    });
    if (
      !nextTopicValue.enabled ||
      nextTopicValue.boundaries.maxIntensity !== "direct" ||
      nextTopicValue === priorTopicValue ||
      nextTopicValue.boundaries === priorTopicValue.boundaries ||
      nextTopicValue.boundaries.excludedFlags ===
        priorTopicValue.boundaries.excludedFlags
    ) {
      failures.push(`adding ${flag} did not preserve state in a fresh value`);
    }
    topicValue = nextTopicValue;
  }
  if (topicValue.boundaries.excludedFlags.join(",") !== CONTENT_FLAGS.join(",")) {
    failures.push("topic toggles did not append the closed flags in reviewed order");
  }
  const withoutFirst = updateStoryBoundaryEditorValue(topicValue, {
    type: "toggle_topic",
    flag: CONTENT_FLAGS[0],
  });
  if (
    !withoutFirst.enabled ||
    withoutFirst.boundaries.maxIntensity !== "direct" ||
    withoutFirst.boundaries.excludedFlags.join(",") !==
      CONTENT_FLAGS.slice(1).join(",") ||
    new Set(withoutFirst.boundaries.excludedFlags).size !==
      withoutFirst.boundaries.excludedFlags.length ||
    withoutFirst === topicValue ||
    withoutFirst.boundaries === topicValue.boundaries ||
    withoutFirst.boundaries.excludedFlags === topicValue.boundaries.excludedFlags
  ) {
    failures.push(
      "topic removal changed enabled/intensity/order or reused prior state",
    );
  }
}

function renderBoundaryEditor(
  value: StoryBoundaryEditorValue,
  disabled = false,
): string {
  return renderToStaticMarkup(
    createElement(StoryBoundaryEditor, {
      value,
      disabled,
      onChange: () => undefined,
    }),
  );
}

function countMatches(value: string, pattern: RegExp): number {
  return value.match(pattern)?.length ?? 0;
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
      eyebrow: NEUTRAL_EYEBROW,
      prefaceLines: DEFAULT_PREFACE_LINES,
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
