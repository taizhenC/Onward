import "./_smoke-bootstrap";
import { handleIntake } from "../lib/intake";
import type { IntakeContext } from "../lib/intake";
import { classifyCrisis } from "../lib/safety";
import { toClientOutline } from "../lib/figures";
import { FIGURE_STAGES } from "../lib/figures-data";
import { toRerankCandidate } from "../lib/llm";
import {
  _sessionCount,
  acknowledgeOwnedSessionPosition,
  createSession,
  getOwnedSession,
  getSession,
} from "../lib/session";
import { _storyArtifactCount, getOwnedStoryArtifact } from "../lib/story-artifacts";
import {
  composeCanonicalStoryArtifact,
  validateStoredStoryArtifact,
} from "../lib/story-artifact";
import { getStoryPlayback } from "../lib/story-playback";
import {
  deriveStoryPassageLayout,
  parseBeatPositionRequest,
} from "../lib/story-progress";
import { prepareStoryProgressTelemetry } from "../lib/story-progress-telemetry";
import { buildDraftStorySpec } from "../lib/story-spec";
import { createResonanceBrief } from "../lib/resonance-brief";
import { MATCH_LIMITS } from "../lib/rate-limit";
import { match, resolveRetrievalMode } from "../lib/matching";
import { APPROVED_PRODUCTION_RECIPE } from "../lib/match-config";
import { CHUNK_CHAR_LIMIT, chunkBeatText } from "../lib/chunks";
import { NEUTRAL_EYEBROW, sanitizeEyebrow } from "../lib/opening-copy";
import { streamBeat } from "../lib/llm";
import {
  containsDisclosureEcho,
  SAFE_BRIDGE_DISTANCE_LINE,
} from "../lib/story-privacy";
import type { BeatBlueprint, Session } from "../lib/types";
import { createTelemetryFlowId } from "../lib/telemetry";

// Smoke always runs in stub mode (provider matrix). getLLM() resolves lazily on the
// first match call, so setting this before main() runs is sufficient.
process.env.LLM_PROVIDER = "stub";
// Sessions + figures from the in-process store/const (no DB) — keeps smoke hermetic.
process.env.PERSISTENCE = "memory";
process.env.HYBRID_STORY_COMPOSER_ENABLED = "true";

// Fixed request identity for every intake in this run. The whole run shares one
// user, so the rate-limit assertion (which exhausts the 5/hour budget) MUST stay
// last among the intake-driven assertions.
const SMOKE_USER_ID = "smoke-user";
function createSmokeContext(): IntakeContext {
  return {
    userId: SMOKE_USER_ID,
    ipHash: "smoke-ip",
    telemetryFlowId: createTelemetryFlowId(),
  };
}
const PROGRESS_CTX: IntakeContext = {
  userId: "smoke-progress-user",
  ipHash: "smoke-progress-ip",
  telemetryFlowId: createTelemetryFlowId(),
};
const ARTIFACT_CTX: IntakeContext = {
  userId: "smoke-artifact-user",
  ipHash: "smoke-artifact-ip",
  telemetryFlowId: createTelemetryFlowId(),
};

type AssertionResult = { name: string; ok: boolean; detail: string };

const FORBIDDEN_OUTLINE_KEYS = new Set([
  "text",
  "realChoice",
  "continuationText",
  "decisionContinuations",
  "options",
  "arcVariant",
  "choices",
  "biographicalFacts",
  "shapeSentences",
  "facets",
  "stageLabel",
  "sources",
  "sourceNotes",
]);

const EXPECTED_LINEAR_ROLES = [
  "scene",
  "dark_moment",
  "response",
  "struggle",
  "turning_point",
  "became",
  "bridge",
] as const;

const CRISIS_OVERTRIGGER_PHRASES = [
  "I don't want to kill myself",
  "I'm not suicidal",
  "my friend was suicidal years ago",
  "I won't hurt myself",
  "this isn't a crisis",
  "I want to kill the bug in my code",
  "I almost died laughing",
];

async function runMatchAssertion(
  label: string,
  input: { age: number; feeling: string },
  expectedFigureKey: string,
): Promise<AssertionResult> {
  const before = await _sessionCount();
  const result = await handleIntake(input, createSmokeContext());

  if ("error" in result) {
    return { name: label, ok: false, detail: `validation error: ${result.error}` };
  }
  if ("crisis" in result) {
    return {
      name: label,
      ok: false,
      detail: `crisis triggered unexpectedly`,
    };
  }
  if ("rateLimited" in result) {
    return { name: label, ok: false, detail: "rate-limited unexpectedly" };
  }
  if (!("sessionId" in result)) {
    return { name: label, ok: false, detail: "no sessionId in response" };
  }

  const after = await _sessionCount();
  if (after !== before + 1) {
    return {
      name: label,
      ok: false,
      detail: `session map did not grow by 1 (before=${before}, after=${after})`,
    };
  }

  const session = await getSession(result.sessionId);
  if (!session) {
    return {
      name: label,
      ok: false,
      detail: `sessionId=${result.sessionId.slice(0, 8)} not found after creation`,
    };
  }
  if (session.figureKey !== expectedFigureKey) {
    return {
      name: label,
      ok: false,
      detail: `matched figureKey=${session.figureKey}, expected ${expectedFigureKey}`,
    };
  }

  if (
    !session.openingCopy ||
    session.openingCopy.eyebrow.trim().length === 0 ||
    session.openingCopy.eyebrow.includes("\n")
  ) {
    return {
      name: label,
      ok: false,
      detail: "session.openingCopy.eyebrow missing or not a clean single line",
    };
  }

  const prefaceLines = session.openingCopy.prefaceLines;
  if (
    !Array.isArray(prefaceLines) ||
    prefaceLines.length === 0 ||
    prefaceLines.some((line) => line.trim().length === 0)
  ) {
    return {
      name: label,
      ok: false,
      detail: "session.openingCopy.prefaceLines missing, empty, or has a blank line",
    };
  }

  const outline = FIGURE_STAGES.find(
    (stage) => stage.figureKey === expectedFigureKey,
  );
  if (!outline) {
    return {
      name: label,
      ok: false,
      detail: `expected figureKey=${expectedFigureKey} not in library`,
    };
  }

  return {
    name: label,
    ok: true,
    detail: `sessionId=${result.sessionId.slice(0, 8)}…`,
  };
}

async function runCrisisAssertion(): Promise<AssertionResult> {
  const before = await _sessionCount();
  const result = await handleIntake(
    {
      age: 22,
      feeling: "I want to kill myself",
    },
    createSmokeContext(),
  );
  const after = await _sessionCount();

  if ("error" in result) {
    return {
      name: "crisis: no session created",
      ok: false,
      detail: `validation error: ${result.error}`,
    };
  }
  if (!("crisis" in result) || !result.crisis) {
    return {
      name: "crisis: no session created",
      ok: false,
      detail: "crisis flag not set on response",
    };
  }
  if ("sessionId" in result) {
    return {
      name: "crisis: no session created",
      ok: false,
      detail: "sessionId leaked on a crisis response",
    };
  }
  if (after !== before) {
    return {
      name: "crisis: no session created",
      ok: false,
      detail: `session map changed during crisis (before=${before}, after=${after})`,
    };
  }
  if (!Array.isArray(result.resources) || result.resources.length === 0) {
    return {
      name: "crisis: no session created",
      ok: false,
      detail: "no crisis resources returned",
    };
  }

  return {
    name: "crisis: no session created",
    ok: true,
    detail: `resources=${result.resources.length}, sessions=${after}`,
  };
}

async function runArtifactPersistenceAssertion(): Promise<AssertionResult> {
  const name = "artifact: immutable, private, atomic replay payload";
  const beforeSessions = await _sessionCount();
  const beforeArtifacts = await _storyArtifactCount();
  const disclosure =
    "My private cobalt compass stopped pointing anywhere after a rejection I cannot explain.";
  const result = await handleIntake({ age: 28, feeling: disclosure }, ARTIFACT_CTX);
  if (!("sessionId" in result)) return { name, ok: false, detail: "intake created no session" };

  const session = await getSession(result.sessionId);
  if (!session?.storyArtifactId) {
    return { name, ok: false, detail: "new session has no artifact pointer" };
  }
  const artifact = await getOwnedStoryArtifact(
    session.storyArtifactId,
    ARTIFACT_CTX.userId,
    session.sessionId,
  );
  const foreign = await getOwnedStoryArtifact(
    session.storyArtifactId,
    "foreign-user",
    session.sessionId,
  );
  const wrongSession = await getOwnedStoryArtifact(
    session.storyArtifactId,
    ARTIFACT_CTX.userId,
    "wrong-session",
  );
  if (!artifact || foreign || wrongSession) {
    return { name, ok: false, detail: "artifact ownership boundary failed" };
  }
  if (
    (await _sessionCount()) !== beforeSessions + 1 ||
    (await _storyArtifactCount()) !== beforeArtifacts + 1
  ) {
    return { name, ok: false, detail: "session/artifact counts did not advance together" };
  }
  if (
    JSON.stringify(artifact).includes(disclosure) ||
    artifact.composition.mode !== "hybrid" ||
    artifact.composition.attemptCount !== 1 ||
    artifact.beats.filter((beat) => beat.personalization).length !== 2 ||
    !Object.isFrozen(artifact) ||
    !Object.isFrozen(artifact.beats) ||
    !Object.isFrozen(artifact.beats[0]) ||
    !Object.isFrozen(artifact.beats[0].chunks) ||
    !Object.isFrozen(artifact.openingCopy) ||
    !Object.isFrozen(artifact.recipe)
  ) {
    return { name, ok: false, detail: "artifact retained disclosure or was mutable" };
  }

  const tampered = structuredClone(artifact);
  tampered.beats[0].text += " Tampered.";
  if (validateStoredStoryArtifact(tampered)) {
    return { name, ok: false, detail: "tampered artifact passed replay validation" };
  }

  const memoryArtifacts = globalThis.__onwardStoryArtifacts;
  const originalOwnedArtifact = memoryArtifacts?.get(artifact.artifactId);
  if (!memoryArtifacts || !originalOwnedArtifact) {
    return { name, ok: false, detail: "memory artifact store unavailable" };
  }
  const corruptedStored = structuredClone(artifact);
  corruptedStored.contentProfile.contentNote += " corrupted";
  let storageBoundaryRejected = false;
  memoryArtifacts.set(artifact.artifactId, {
    ...originalOwnedArtifact,
    artifact: corruptedStored,
  });
  try {
    await getOwnedStoryArtifact(
      artifact.artifactId,
      ARTIFACT_CTX.userId,
      session.sessionId,
    );
  } catch {
    storageBoundaryRejected = true;
  } finally {
    memoryArtifacts.set(artifact.artifactId, originalOwnedArtifact);
  }
  if (!storageBoundaryRejected) {
    return { name, ok: false, detail: "storage boundary served a corrupt artifact" };
  }

  const stage = FIGURE_STAGES.find(
    (candidate) =>
      candidate.figureKey === session.figureKey && candidate.stageId === session.stageId,
  );
  if (!stage) return { name, ok: false, detail: "matched stage missing from fixture" };
  const originalStageText = stage.beats[0].text;
  const immutableText = artifact.beats[0].text;
  let playback;
  try {
    stage.beats[0].text = "MUTABLE STAGE SENTINEL";
    playback = await getStoryPlayback(session);
  } finally {
    stage.beats[0].text = originalStageText;
  }
  if (
    playback?.source !== "artifact" ||
    normalizeChunkText(playback.beats[0].chunks.join(" ")) !==
      normalizeChunkText(immutableText)
  ) {
    return { name, ok: false, detail: "playback changed with mutable stage prose" };
  }

  const beforeDuplicate = await _sessionCount();
  let duplicateRejected = false;
  try {
    await createSession({
      userId: session.userId,
      telemetryFlowId: createTelemetryFlowId(),
      figureKey: session.figureKey,
      stageId: session.stageId,
      framing: session.framing,
      age: session.age ?? 13,
      feeling: session.feeling ?? "",
      storyRequestContext:
        session.storyRequestContext ?? {
          schemaVersion: "story-request-context-v2-2026-07",
          boundaries: null,
          clarification: null,
          acceptedAdjacent: false,
        },
      matchRecipe: session.matchRecipe,
      artifact,
    });
  } catch {
    duplicateRejected = true;
  }
  if (!duplicateRejected || (await _sessionCount()) !== beforeDuplicate) {
    return { name, ok: false, detail: "failed artifact insert left a session behind" };
  }

  const freshArtifact = composeCanonicalStoryArtifact({
    storySpec: buildDraftStorySpec(stage),
    stage,
    matchRecipe: session.matchRecipe,
    openingCopy: artifact.openingCopy,
    framing: session.framing,
    resonanceBrief: createResonanceBrief(disclosure),
    allowDraftSpec: true,
  });
  const memorySessions = globalThis.__onwardSessions;
  if (!memorySessions) return { name, ok: false, detail: "memory session map unavailable" };
  const originalSet = memorySessions.set;
  const beforeInjectedSessions = await _sessionCount();
  const beforeInjectedArtifacts = await _storyArtifactCount();
  let injectedFailureObserved = false;
  memorySessions.set = (() => {
    throw new Error("injected session persistence failure");
  }) as typeof memorySessions.set;
  try {
    await createSession({
      userId: session.userId,
      telemetryFlowId: createTelemetryFlowId(),
      figureKey: session.figureKey,
      stageId: session.stageId,
      framing: session.framing,
      age: session.age ?? 13,
      feeling: session.feeling ?? "",
      storyRequestContext:
        session.storyRequestContext ?? {
          schemaVersion: "story-request-context-v2-2026-07",
          boundaries: null,
          clarification: null,
          acceptedAdjacent: false,
        },
      matchRecipe: session.matchRecipe,
      artifact: freshArtifact,
    });
  } catch {
    injectedFailureObserved = true;
  } finally {
    memorySessions.set = originalSet;
  }
  if (
    !injectedFailureObserved ||
    (await _sessionCount()) !== beforeInjectedSessions ||
    (await _storyArtifactCount()) !== beforeInjectedArtifacts
  ) {
    return { name, ok: false, detail: "session failure did not roll back artifact insert" };
  }

  return {
    name,
    ok: true,
    detail: `artifact=${artifact.artifactId.slice(0, 8)}…; tamper/foreign/mutation rejected`,
  };
}

async function runLegacyPlaybackAssertion(): Promise<AssertionResult> {
  const name = "playback: pre-artifact session compatibility is explicit";
  const sessions = globalThis.__onwardSessions;
  const stage = FIGURE_STAGES[0];
  if (!sessions || !stage) return { name, ok: false, detail: "legacy fixture unavailable" };
  const sessionId = `legacy-${Date.now()}`;
  const now = Date.now();
  const rawLegacy = {
    sessionId,
    userId: "legacy-user",
    figureKey: stage.figureKey,
    stageId: stage.stageId,
    framing: "partial",
    openingCopy: {
      eyebrow: NEUTRAL_EYEBROW,
      prefaceLines: ["This story is true."],
    },
    age: stage.ageMin,
    feeling: "legacy private text",
    matchRecipe: {
      recipeId: APPROVED_PRODUCTION_RECIPE.recipeId,
      matchConfigVersion: "legacy",
      crisisRegexVersion: "legacy",
      llmProvider: "stub",
      rerankModelId: "stub",
      proseModelId: "stub",
      embeddingModelId: "stub",
      retrievalMode: "keyword",
    },
    nextBeatIndex: 0,
    nextChunkIndex: 0,
    createdAt: now,
    updatedAt: now,
  } as unknown as Session;
  const originalBridge = stage.beats[6].text;
  sessions.set(sessionId, rawLegacy);
  try {
    stage.beats[6].text = 'You wrote: "{feeling}"';
    const normalized = await getSession(sessionId);
    const foreign = await getOwnedSession(sessionId, "foreign-user");
    if (!normalized || normalized.storyArtifactId !== null || foreign) {
      return { name, ok: false, detail: "legacy ownership/normalization failed" };
    }
    const playback = await getStoryPlayback(normalized);
    const bridge = playback?.beats[6].chunks.join(" ") ?? "";
    const ok =
      playback?.source === "legacy_stage" &&
      bridge.includes(SAFE_BRIDGE_DISTANCE_LINE) &&
      !bridge.includes("{feeling}");
    return {
      name,
      ok,
      detail: ok
        ? "missing pointer normalized to null; legacy prose sanitized"
        : "legacy playback did not sanitize or identify its source",
    };
  } finally {
    stage.beats[6].text = originalBridge;
    sessions.delete(sessionId);
  }
}

// Ownership chokepoint: a foreign or absent user must read null (the routes' 404),
// indistinguishable from a missing session.
async function runOwnershipAssertion(): Promise<AssertionResult> {
  const name = "ownership: foreign/absent user cannot read a session";
  const ctx = createSmokeContext();
  const result = await handleIntake(
    {
      age: 28,
      feeling: "I keep getting rejected and I don't know if I should keep trying",
    },
    ctx,
  );
  if (!("sessionId" in result)) {
    return { name, ok: false, detail: "intake did not create a session" };
  }

  const owned = await getOwnedSession(result.sessionId, ctx.userId);
  if (!owned) {
    return { name, ok: false, detail: "owner could not read their own session" };
  }
  const foreign = await getOwnedSession(result.sessionId, "someone-else");
  if (foreign) {
    return { name, ok: false, detail: "foreign user could read the session" };
  }
  const absent = await getOwnedSession(result.sessionId, null);
  if (absent) {
    return { name, ok: false, detail: "absent user could read the session" };
  }

  return { name, ok: true, detail: "owner reads; foreign and absent users get null" };
}

async function runAtomicProgressAssertion(): Promise<AssertionResult> {
  const name = "progress: explicit acknowledgement is atomic and owner-scoped";
  const result = await handleIntake(
    {
      age: 28,
      feeling: "I keep getting rejected and I don't know if I should keep trying",
    },
    PROGRESS_CTX,
  );
  if (!("sessionId" in result)) {
    return { name, ok: false, detail: "intake did not create a progress session" };
  }

  const owned = await getOwnedSession(result.sessionId, PROGRESS_CTX.userId);
  const playback = owned ? await getStoryPlayback(owned) : null;
  const layout = playback
    ? deriveStoryPassageLayout(playback.beats, {
        beatIndex: 0,
        chunkIndex: 0,
      })
    : null;
  if (!owned || !layout) {
    return { name, ok: false, detail: "progress artifact was unavailable" };
  }
  const telemetry = await prepareStoryProgressTelemetry({
    session: owned,
    userId: PROGRESS_CTX.userId,
    layout,
  });

  const input = {
    sessionId: result.sessionId,
    userId: PROGRESS_CTX.userId,
    storyArtifactId: owned.storyArtifactId,
    telemetry,
    expectedBeatIndex: 0,
    expectedChunkIndex: 0,
    nextBeatIndex: layout.nextBeatIndex,
    nextChunkIndex: layout.nextChunkIndex,
  } as const;
  const first = await acknowledgeOwnedSessionPosition(input);
  const repeated = await acknowledgeOwnedSessionPosition(input);
  const stale = await acknowledgeOwnedSessionPosition({
    ...input,
    nextBeatIndex: layout.nextBeatIndex + 1,
  });
  const foreign = await acknowledgeOwnedSessionPosition({
    ...input,
    userId: "someone-else",
  });
  const session = await getOwnedSession(result.sessionId, PROGRESS_CTX.userId);

  if (
    first !== "advanced" ||
    repeated !== "already_advanced" ||
    stale !== "conflict" ||
    foreign !== "not_found" ||
    session?.nextBeatIndex !== layout.nextBeatIndex ||
    session.nextChunkIndex !== layout.nextChunkIndex
  ) {
    return {
      name,
      ok: false,
      detail: `first=${first}, repeat=${repeated}, stale=${stale}, foreign=${foreign}, position=${session?.nextBeatIndex}/${session?.nextChunkIndex}`,
    };
  }

  return {
    name,
    ok: true,
    detail: "advanced once; retry idempotent; stale/foreign writes rejected",
  };
}

async function runStoryCreationKillSwitchAssertion(): Promise<AssertionResult> {
  const name = "safety: story kill switch preserves crisis support and persists nothing";
  const previous = process.env.STORY_CREATION_ENABLED;
  const ctx: IntakeContext = {
    userId: "smoke-disabled-user",
    ipHash: "smoke-disabled-ip",
    telemetryFlowId: createTelemetryFlowId(),
  };
  const before = await _sessionCount();
  try {
    process.env.STORY_CREATION_ENABLED = "false";
    const blocked = await handleIntake(
      { age: 28, feeling: "I feel rejected and uncertain about what comes next" },
      ctx,
    );
    const crisis = await handleIntake(
      { age: 22, feeling: "I want to kill myself" },
      ctx,
    );
    const after = await _sessionCount();
    const ok =
      "temporarilyUnavailable" in blocked &&
      "crisis" in crisis &&
      after === before;
    return {
      name,
      ok,
      detail: ok
        ? "new story blocked; crisis resources still returned; no session created"
        : `blocked=${JSON.stringify(blocked)}, crisis=${"crisis" in crisis}, sessions=${before}/${after}`,
    };
  } finally {
    if (previous === undefined) delete process.env.STORY_CREATION_ENABLED;
    else process.env.STORY_CREATION_ENABLED = previous;
  }
}

function runApprovedRecipeAssertion(): AssertionResult {
  const name = "recipe: production retrieval is explicit and approved";
  const defaultMode = resolveRetrievalMode(undefined, "development");
  const developmentChallenger = resolveRetrievalMode(
    "facetsrag",
    "development",
  );
  const productionMode = resolveRetrievalMode("keyword", "production");
  const staleAuto = resolveRetrievalMode("auto", "production");
  const staleFacets = resolveRetrievalMode("facetsrag", "production");
  const staleUnknown = resolveRetrievalMode("unexpected-mode", "production");

  const ok =
    defaultMode === APPROVED_PRODUCTION_RECIPE.retrievalMode &&
    developmentChallenger === "facetsrag" &&
    productionMode === "keyword" &&
    staleAuto === "keyword" &&
    staleFacets === "keyword" &&
    staleUnknown === "keyword";
  return {
    name,
    ok,
    detail: ok
      ? `${APPROVED_PRODUCTION_RECIPE.recipeId}; production behavior is selector-owned`
      : `default=${defaultMode}, developmentChallenger=${developmentChallenger}, production=${productionMode}, stale=${staleAuto}/${staleFacets}/${staleUnknown}`,
  };
}

async function runPublishedEligibilityAssertion(): Promise<AssertionResult> {
  const name = "matching: publication eligibility survives age fallback";
  const butlerKey = "butler\u00001974-1975-pre-patternmaster";
  const selected = await match({
    age: 99,
    feeling: "I escaped and do not know where I belong now",
    eligibleStageKeys: new Set([butlerKey]),
  });
  let emptyRejected = false;
  try {
    await match({
      age: 28,
      feeling: "I keep getting rejected and do not know whether to continue",
      eligibleStageKeys: new Set(),
    });
  } catch {
    emptyRejected = true;
  }
  const ok = selected.figureKey === "butler" && emptyRejected;
  return {
    name,
    ok,
    detail: ok
      ? "only eligible stage selected through fallback; empty catalog failed closed"
      : `selected=${selected.figureKey}, emptyRejected=${emptyRejected}`,
  };
}

// MUST run last among intake assertions: it spends the rest of smoke-user's hourly
// budget. Earlier assertions consumed 4 (3 matches + 1 ownership); the 5th here
// still passes, the 6th must come back rate-limited — without a session and without
// blocking crisis.
async function runRateLimitAssertion(): Promise<AssertionResult> {
  const name = `rate limit: intake ${MATCH_LIMITS.userPerHour + 1} of the hour is refused`;
  const input = {
    age: 28,
    feeling: "I keep getting rejected and I don't know if I should keep trying",
  };

  const fifth = await handleIntake(input, createSmokeContext());
  if (!("sessionId" in fifth)) {
    return {
      name,
      ok: false,
      detail: `intake ${MATCH_LIMITS.userPerHour} of the hour should still pass`,
    };
  }

  const before = await _sessionCount();
  const sixth = await handleIntake(input, createSmokeContext());
  const after = await _sessionCount();
  if (!("rateLimited" in sixth)) {
    return { name, ok: false, detail: "over-budget intake was not rate-limited" };
  }
  if (after !== before) {
    return {
      name,
      ok: false,
      detail: `rate-limited intake changed the session map (before=${before}, after=${after})`,
    };
  }

  const crisis = await handleIntake(
    { age: 22, feeling: "I want to kill myself" },
    createSmokeContext(),
  );
  if (!("crisis" in crisis)) {
    return {
      name,
      ok: false,
      detail: "crisis did not bypass the rate limit while over budget",
    };
  }

  return {
    name,
    ok: true,
    detail: "limit holds, no session created, crisis still bypasses",
  };
}

function runArcShapeAssertion(): AssertionResult {
  const stages = FIGURE_STAGES;
  if (stages.length === 0) {
    return {
      name: "arc shape: 7 linear beats per figure",
      ok: false,
      detail: "no stages in library",
    };
  }

  for (const stage of stages) {
    if (stage.beats.length !== EXPECTED_LINEAR_ROLES.length) {
      return {
        name: "arc shape: 7 linear beats per figure",
        ok: false,
        detail: `figure=${stage.figureKey} has ${stage.beats.length} beats, expected ${EXPECTED_LINEAR_ROLES.length}`,
      };
    }
    for (let index = 0; index < EXPECTED_LINEAR_ROLES.length; index += 1) {
      const expected = EXPECTED_LINEAR_ROLES[index];
      const actual = stage.beats[index].role;
      if (actual !== expected) {
        return {
          name: "arc shape: 7 linear beats per figure",
          ok: false,
          detail: `figure=${stage.figureKey} beat[${index}] role=${actual}, expected ${expected}`,
        };
      }
    }
    const finalKind = stage.beats[stage.beats.length - 1].kind;
    if (finalKind !== "bridge") {
      return {
        name: "arc shape: 7 linear beats per figure",
        ok: false,
        detail: `figure=${stage.figureKey} final beat kind=${finalKind}, expected bridge`,
      };
    }
  }

  return {
    name: "arc shape: 7 linear beats per figure",
    ok: true,
    detail: `${stages.length} figure(s), all 7-beat linear arcs`,
  };
}

function runOutlineAssertion(): AssertionResult {
  const stages = FIGURE_STAGES;
  if (stages.length === 0) {
    return {
      name: "toClientOutline strips server-only fields",
      ok: false,
      detail: "no stages in library",
    };
  }

  for (const stage of stages) {
    const outline = toClientOutline(stage);
    const violation = findForbiddenKey(outline);
    if (violation) {
      return {
        name: "toClientOutline strips server-only fields",
        ok: false,
        detail: `figure=${stage.figureKey} leaked key=${violation}`,
      };
    }
  }

  return {
    name: "toClientOutline strips server-only fields",
    ok: true,
    detail: `${stages.length} outline(s) audited`,
  };
}

function runRerankCandidateAssertion(): AssertionResult {
  const name = "anti-echo: toRerankCandidate excludes embedded surfaces";
  const stages = FIGURE_STAGES;
  if (stages.length === 0) {
    return { name, ok: false, detail: "no stages in library" };
  }

  const allowedKeys = new Set([
    "figureKey",
    "stageId",
    "displayName",
    "ageMin",
    "ageMax",
    "biographicalFacts",
  ]);

  for (const stage of stages) {
    const candidate = toRerankCandidate(stage);

    const extraKey = Object.keys(candidate).find((key) => !allowedKeys.has(key));
    if (extraKey) {
      return {
        name,
        ok: false,
        detail: `figure=${stage.figureKey} leaked key=${extraKey}`,
      };
    }

    // Content guard: the embedded surfaces (shape sentences, facet text, beat prose)
    // must never ride along into the rerank prompt.
    const serialized = JSON.stringify(candidate);
    const embedded = [
      ...stage.shapeSentences,
      stage.facets.emotionalCore,
      stage.facets.decisionShape,
      stage.facets.triggerEvent,
      stage.facets.agencyState,
      ...stage.beats.map((beat) => beat.text),
    ];
    const leak = embedded.find((text) => text && serialized.includes(text));
    if (leak) {
      return {
        name,
        ok: false,
        detail: `figure=${stage.figureKey} rerank candidate contained embedded (shape/facet/beat) text`,
      };
    }
  }

  return { name, ok: true, detail: `${stages.length} candidate(s) audited` };
}

function runEyebrowGuardAssertion(): AssertionResult {
  const name =
    "opening copy: eyebrow guard yields one clean line or the neutral fallback";
  const cases: Array<{
    label: string;
    raw: string | null;
    displayName: string;
    expectNeutral: boolean;
  }> = [
    { label: "null", raw: null, displayName: "Octavia Butler", expectNeutral: true },
    { label: "blank", raw: "   ", displayName: "Octavia Butler", expectNeutral: true },
    {
      label: "clean line",
      raw: "a weight you carry without setting down",
      displayName: "Octavia Butler",
      expectNeutral: false,
    },
    {
      label: "quoted clean line",
      raw: '"the long wait for a yes"',
      displayName: "Frederick Douglass",
      expectNeutral: false,
    },
    {
      label: "article in figure name is not a leak",
      raw: "the pressure before the next step",
      displayName: "The Buddha",
      expectNeutral: false,
    },
    {
      label: "epithet in figure name is not a leak",
      raw: "a great pressure held quietly",
      displayName: "Catherine the Great",
      expectNeutral: false,
    },
    {
      label: "preamble (multi-line)",
      raw: "Here is the line:\nthe long wait for a yes",
      displayName: "Octavia Butler",
      expectNeutral: true,
    },
    {
      label: "names the figure",
      raw: "what Douglass carried alone",
      displayName: "Frederick Douglass",
      expectNeutral: true,
    },
    {
      label: "too long",
      raw: "x".repeat(120),
      displayName: "Frances Glessner Lee",
      expectNeutral: true,
    },
  ];

  for (const testCase of cases) {
    const out = sanitizeEyebrow(testCase.raw, testCase.displayName);
    const isNeutral = out === NEUTRAL_EYEBROW;
    if (isNeutral !== testCase.expectNeutral) {
      return {
        name,
        ok: false,
        detail: `case "${testCase.label}": expected ${
          testCase.expectNeutral ? "neutral fallback" : "kept line"
        }, got "${out}"`,
      };
    }
    if (!testCase.expectNeutral && (out.includes("\n") || out !== out.trim())) {
      return {
        name,
        ok: false,
        detail: `case "${testCase.label}": kept line not clean: "${out}"`,
      };
    }
  }

  return { name, ok: true, detail: `${cases.length} guard case(s) audited` };
}

function runChunkIntegrityAssertion(): AssertionResult {
  const stages = FIGURE_STAGES;
  let beatCount = 0;
  let chunkCount = 0;

  for (const stage of stages) {
    for (let index = 0; index < stage.beats.length; index += 1) {
      const beat = stage.beats[index];
      const chunks = chunkBeatText(beat);
      beatCount += 1;
      chunkCount += chunks.length;

      if (chunks.length === 0) {
        return {
          name: "chunking: beat text preserved in small chunks",
          ok: false,
          detail: `figure=${stage.figureKey} beat[${index}] produced no chunks`,
        };
      }

      const overLimit = chunks.find((chunk) => chunk.length > CHUNK_CHAR_LIMIT);
      if (overLimit) {
        return {
          name: "chunking: beat text preserved under limit",
          ok: false,
          detail: `figure=${stage.figureKey} beat[${index}] produced ${overLimit.length} char chunk, limit=${CHUNK_CHAR_LIMIT}`,
        };
      }

      const reassembled = chunks.join("\n\n");
      if (normalizeChunkText(reassembled) !== normalizeChunkText(beat.text)) {
        return {
          name: "chunking: beat text preserved under limit",
          ok: false,
          detail: `figure=${stage.figureKey} beat[${index}] did not preserve normalized text`,
        };
      }
    }
  }

  return {
    name: "chunking: beat text preserved under limit",
    ok: true,
    detail: `${beatCount} beat(s), ${chunkCount} chunk(s)`,
  };
}

async function runStoryPrivacyAssertion(): Promise<AssertionResult> {
  const name = "story privacy: canonical and legacy paths never echo disclosure";
  const disclosure =
    "I moved across the country and now I feel completely alone every night";

  for (const stage of FIGURE_STAGES) {
    const text = stage.beats.map((beat) => beat.text).join("\n");
    if (
      text.includes("{feeling}") ||
      /You wrote:/i.test(text) ||
      containsDisclosureEcho(text, disclosure)
    ) {
      return {
        name,
        ok: false,
        detail: `figure=${stage.figureKey} contains a disclosure echo surface`,
      };
    }
  }

  const legacyBeat: BeatBlueprint = {
    kind: "bridge",
    role: "bridge",
    text: 'You wrote: "{feeling}"\n\nThe story continues.',
  };
  let rendered = "";
  for await (const token of streamBeat({ beat: legacyBeat })) rendered += token;

  if (
    rendered.includes("{feeling}") ||
    /You wrote:/i.test(rendered) ||
    !rendered.includes(SAFE_BRIDGE_DISTANCE_LINE)
  ) {
    return {
      name,
      ok: false,
      detail: "legacy bridge sanitizer did not replace the disclosure surface",
    };
  }

  if (
    !containsDisclosureEcho(
      `A preface. ${disclosure}. A coda.`,
      disclosure,
    ) ||
    !containsDisclosureEcho(
      "The record described the period as suicidal.",
      "suicidal!!",
    ) ||
    !containsDisclosureEcho(
      "The note read I am sad before it turned.",
      "I am sad...",
    ) ||
    !containsDisclosureEcho("死にたい", "死にたい") ||
    !containsDisclosureEcho("自殺", "自殺!!!!!!!!") ||
    !containsDisclosureEcho(
      "В записке было: мне страшно.",
      "мне страшно",
    ) ||
    containsDisclosureEcho(SAFE_BRIDGE_DISTANCE_LINE, disclosure)
  ) {
    return {
      name,
      ok: false,
      detail: "disclosure overlap guard is not classifying exact/safe copy correctly",
    };
  }

  return {
    name,
    ok: true,
    detail: `${FIGURE_STAGES.length} stages clean; legacy placeholder sanitized`,
  };
}

function runChunkBehaviorAssertion(): AssertionResult {
  const grouped = chunkBeatText({
    kind: "narrative",
    role: "scene",
    text: "One.\n\nTwo.\n\nThree.",
  } satisfies BeatBlueprint);

  if (grouped.length !== 1 || grouped[0] !== "One.\n\nTwo.\n\nThree.") {
    return {
      name: "chunking: groups short paragraphs and wraps long ones",
      ok: false,
      detail: `expected three short paragraphs to fit in one chunk, got ${grouped.length}`,
    };
  }

  const longText = Array.from({ length: 80 }, (_, index) => `word${index}`).join(
    " ",
  );
  const wrapped = chunkBeatText({
    kind: "narrative",
    role: "scene",
    text: longText,
  } satisfies BeatBlueprint);
  const overLimit = wrapped.find((chunk) => chunk.length > CHUNK_CHAR_LIMIT);

  if (wrapped.length <= 1 || overLimit) {
    return {
      name: "chunking: groups short paragraphs and wraps long ones",
      ok: false,
      detail: overLimit
        ? `wrapped chunk length ${overLimit.length} exceeded limit=${CHUNK_CHAR_LIMIT}`
        : "long paragraph did not wrap into multiple chunks",
    };
  }

  if (normalizeChunkText(wrapped.join("\n\n")) !== normalizeChunkText(longText)) {
    return {
      name: "chunking: groups short paragraphs and wraps long ones",
      ok: false,
      detail: "wrapped long paragraph did not preserve normalized text",
    };
  }

  return {
    name: "chunking: groups short paragraphs and wraps long ones",
    ok: true,
    detail: `short=${grouped.length} chunk, long=${wrapped.length} chunks`,
  };
}

function normalizeChunkText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function findForbiddenKey(value: unknown): string | null {
  if (value === null || typeof value !== "object") return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const hit = findForbiddenKey(item);
      if (hit) return hit;
    }
    return null;
  }
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (FORBIDDEN_OUTLINE_KEYS.has(key)) return key;
    const hit = findForbiddenKey(child);
    if (hit) return hit;
  }
  return null;
}

function printOverTriggerMap(): void {
  console.log("");
  console.log("Crisis regex over-trigger map (informational, not asserted):");
  console.log(
    "  The Phase 0 regex is intentionally pessimistic. False positives are",
  );
  console.log(
    "  acceptable; false negatives are not. This is the surface to inspect.",
  );
  console.log("");
  for (const phrase of CRISIS_OVERTRIGGER_PHRASES) {
    const result = classifyCrisis(phrase);
    const label = result.crisisDetected ? "FIRES   " : "passes  ";
    console.log(`  [${label}] ${JSON.stringify(phrase)}`);
  }
}

function runProgressInputAssertion(): AssertionResult {
  const valid = parseBeatPositionRequest({
    sessionId: "safe-position",
    beatIndex: 0,
    chunkIndex: 1,
  });
  const unsafeBeat = parseBeatPositionRequest({
    sessionId: "unsafe-beat-position",
    beatIndex: Number.MAX_SAFE_INTEGER + 1,
    chunkIndex: 0,
  });
  const unsafeChunk = parseBeatPositionRequest({
    sessionId: "unsafe-chunk-position",
    beatIndex: 0,
    chunkIndex: Number.MAX_SAFE_INTEGER + 1,
  });
  const ok =
    !("error" in valid) &&
    "error" in unsafeBeat &&
    "error" in unsafeChunk;
  return {
    name: "progress coordinates: unsafe integers are rejected",
    ok,
    detail: ok
      ? "valid=accepted, unsafe beat/chunk=rejected"
      : `valid=${JSON.stringify(valid)}, unsafeBeat=${JSON.stringify(unsafeBeat)}, unsafeChunk=${JSON.stringify(unsafeChunk)}`,
  };
}

async function main(): Promise<void> {
  const assertions: AssertionResult[] = [
    await runMatchAssertion(
      "match: rejection feeling at 28 → Butler",
      {
        age: 28,
        feeling:
          "I keep getting rejected and I don't know if I should keep trying",
      },
      "butler",
    ),
    await runMatchAssertion(
      "match: escape feeling at 21 → Douglass",
      { age: 21, feeling: "I escaped and don't know who I am" },
      "douglass",
    ),
    await runMatchAssertion(
      "match: stuck-in-wrong-life at 52 → Lee",
      {
        age: 52,
        feeling: "I'm stuck in the wrong life and don't know how to leave",
      },
      "lee",
    ),
    await runCrisisAssertion(),
    await runOwnershipAssertion(),
    await runArtifactPersistenceAssertion(),
    await runLegacyPlaybackAssertion(),
    await runAtomicProgressAssertion(),
    runProgressInputAssertion(),
    await runStoryCreationKillSwitchAssertion(),
    runApprovedRecipeAssertion(),
    await runPublishedEligibilityAssertion(),
    runOutlineAssertion(),
    runRerankCandidateAssertion(),
    runEyebrowGuardAssertion(),
    runArcShapeAssertion(),
    await runStoryPrivacyAssertion(),
    runChunkIntegrityAssertion(),
    runChunkBehaviorAssertion(),
    // Last on purpose — exhausts smoke-user's hourly budget (see the comment above).
    await runRateLimitAssertion(),
  ];

  console.log("Onward Phase 0 smoke check");
  console.log("==========================");
  console.log("");

  let failed = 0;
  assertions.forEach((assertion, index) => {
    const tag = assertion.ok ? "OK  " : "FAIL";
    const number = `[${index + 1}/${assertions.length}]`;
    console.log(`${number} ${tag}  ${assertion.name}`);
    if (assertion.detail) console.log(`         ${assertion.detail}`);
    if (!assertion.ok) failed += 1;
  });

  printOverTriggerMap();

  console.log("");
  if (failed === 0) {
    console.log(`All ${assertions.length} assertion(s) passed.`);
    process.exit(0);
  }
  console.log(`${failed} assertion(s) failed.`);
  process.exit(1);
}

void main();
