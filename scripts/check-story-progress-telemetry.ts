import "./_smoke-bootstrap";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { LOCAL_DEV_USER_ID } from "../lib/auth";
import {
  claimAlternateStoryFlow,
  completeAlternateStoryReady,
  issueAlternateStoryCapability,
} from "../lib/alternate-story-flow";
import { ALTERNATE_STORY_POLICY_VERSION } from "../lib/alternate-story-types";
import { FIGURE_STAGES } from "../lib/figures-data";
import { STORY_PROMPT_VERSION_V1 } from "../lib/llm-recipe-constants";
import { APPROVED_PRODUCTION_RECIPE } from "../lib/match-config";
import {
  DEFAULT_PREFACE_LINES,
  NEUTRAL_EYEBROW,
} from "../lib/opening-copy";
import { createResonanceBrief } from "../lib/resonance-brief";
import {
  acknowledgeOwnedSessionPosition,
  createSession,
  getSession,
} from "../lib/session";
import { submitResonanceFeedback } from "../lib/resonance-feedback";
import { composeCanonicalStoryArtifact } from "../lib/story-artifact";
import type { StoryArtifact } from "../lib/story-artifact-types";
import {
  deriveStoryPassageLayout,
  type StoryPassageLayout,
} from "../lib/story-progress";
import { prepareStoryProgressTelemetry } from "../lib/story-progress-telemetry";
import { createStoryRequestContext } from "../lib/story-request-context";
import { buildDraftStorySpec } from "../lib/story-spec";
import {
  listMemoryProductEventOutbox,
  listMemoryProductEvents,
} from "../lib/telemetry-store-memory";
import {
  createTelemetryEventId,
  createTelemetryFlowId,
  prepareProductEventCapture,
} from "../lib/telemetry";
import { issueTelemetryFlowId } from "../lib/telemetry-id";
import { passageAcknowledgedEvent } from "../lib/telemetry-producers";
import { createProductEventRecord } from "../lib/telemetry-schema";
import {
  TELEMETRY_FLOW_RETENTION_DAYS,
  type ProductEventRecord,
  type StoryRole,
  type TelemetryFlowId,
} from "../lib/telemetry-types";
import type { FigureStageRow, MatchRecipe, Session } from "../lib/types";

process.env.PERSISTENCE = "memory";
process.env.LLM_PROVIDER = "stub";
process.env.RETRIEVAL_MODE = "keyword";
process.env.TELEMETRY_FLOW_BINDING_ENABLED = "true";

const PRIVATE_CANARY =
  "My private ultraviolet astrolabe feels rejected and unseen after years of trying.";
const FOREIGN_USER_ID = "11111111-1111-4111-8111-111111111111";
const recipe: MatchRecipe = {
  recipeId: APPROVED_PRODUCTION_RECIPE.recipeId,
  matchConfigVersion: APPROVED_PRODUCTION_RECIPE.matchConfigVersion,
  crisisRegexVersion: "story-progress-test",
  llmProvider: "stub",
  rerankModelId: "stub",
  proseModelId: "stub",
  embeddingModelId: "stub",
  retrievalMode: "keyword",
  storyPromptVersion: STORY_PROMPT_VERSION_V1,
};

async function main(): Promise<void> {
  checkStaticBoundaries();
  checkDeferredCaptureExpiryBoundary();

  const initialStage = FIGURE_STAGES[0];
  assert(initialStage, "figure fixture is unavailable");
  const initialArtifact = makeArtifact(initialStage, recipe);
  const flowId = createTelemetryFlowId();
  const initialSessionId = await createSession({
    userId: LOCAL_DEV_USER_ID,
    telemetryFlowId: flowId,
    figureKey: initialStage.figureKey,
    stageId: initialStage.stageId,
    framing: "partial",
    age: 28,
    feeling: PRIVATE_CANARY,
    storyRequestContext: createStoryRequestContext({
      boundaries: undefined,
      clarification: undefined,
    }),
    matchRecipe: recipe,
    artifact: initialArtifact,
  });

  await checkForeignAndMissingAreIndistinguishable({
    sessionId: initialSessionId,
    artifact: initialArtifact,
  });
  await checkActiveFlowFailuresRollback({
    sessionId: initialSessionId,
    artifact: initialArtifact,
    flowId,
  });
  await walkStory({
    sessionId: initialSessionId,
    artifact: initialArtifact,
    flowId,
    storyRole: "initial",
    checkStalePosition: true,
  });

  const alternateStage = FIGURE_STAGES.find(
    (stage) =>
      stage.figureKey !== initialStage.figureKey ||
      stage.stageId !== initialStage.stageId,
  );
  assert(alternateStage, "alternate figure fixture is unavailable");
  const alternateRecipe: MatchRecipe = {
    ...recipe,
    alternateStoryPolicyVersion: ALTERNATE_STORY_POLICY_VERSION,
  };
  const alternateArtifact = makeArtifact(alternateStage, alternateRecipe);
  const completedInitial = await getSession(initialSessionId);
  assert(completedInitial, "completed initial session is unavailable");
  await submitResonanceFeedback({
    userId: LOCAL_DEV_USER_ID,
    session: completedInitial,
    artifact: initialArtifact,
    feedback: {
      sessionId: initialSessionId,
      verdict: "not_close",
      reason: "wrong_feeling",
    },
  });
  const offer = await issueAlternateStoryCapability({
    userId: LOCAL_DEV_USER_ID,
    session: completedInitial,
    artifact: initialArtifact,
  });
  assert(offer.status === "available", "alternate capability was not issued");
  const claim = await claimAlternateStoryFlow({
    userId: LOCAL_DEV_USER_ID,
    session: completedInitial,
    artifact: initialArtifact,
    token: offer.token,
  });
  assert(claim.status === "claimed", "alternate capability was not claimed");
  const alternateSessionId = await completeAlternateStoryReady({
    userId: LOCAL_DEV_USER_ID,
    claim,
    sourceArtifactId: initialArtifact.artifactId,
    artifact: alternateArtifact,
  });
  await walkStory({
    sessionId: alternateSessionId,
    artifact: alternateArtifact,
    flowId,
    storyRole: "alternate",
    checkStalePosition: false,
  });

  await checkNullFlowProgress();
  await checkKillSwitchBypass();

  checkEventPrivacy(flowId);

  console.log("Onward story-progress telemetry validator");
  console.log("===========================================");
  console.log("PASS every persisted initial passage maps to one zero-based ordinal");
  console.log("PASS alternate passages share the root flow with alternate story role");
  console.log("PASS completion is emitted only with the final acknowledged passage");
  console.log("PASS immediate retries are singleton and restore missing outbox pointers");
  console.log("PASS expiry-edge captures defer flow activity to the domain transaction");
  console.log("PASS stale, foreign, and missing progress writes reveal no position oracle");
  console.log("PASS route, stores, migration 0013, and event payloads keep disclosure private");
}

function checkDeferredCaptureExpiryBoundary(): void {
  const issuedAt = new Date(
    Date.now() - (TELEMETRY_FLOW_RETENTION_DAYS * 86_400_000 + 1_000),
  );
  const expiredButAuthenticFlow = issueTelemetryFlowId(issuedAt);
  const capture = prepareProductEventCapture({
    flowId: expiredButAuthenticFlow,
    event: passageAcknowledgedEvent("initial", 0),
  });
  assert(
    capture.flowId === expiredButAuthenticFlow,
    "transaction-prepared capture rejected an authentic expiry-edge flow",
  );
}

async function checkActiveFlowFailuresRollback(input: {
  sessionId: string;
  artifact: StoryArtifact;
  flowId: TelemetryFlowId;
}): Promise<void> {
  const session = await getSession(input.sessionId);
  assert(session, "active-flow rollback fixture is unavailable");
  const layout = deriveStoryPassageLayout(input.artifact.beats, {
    beatIndex: 0,
    chunkIndex: 0,
  });
  assert(layout, "active-flow rollback layout is unavailable");
  const telemetry = await prepareStoryProgressTelemetry({
    session,
    userId: LOCAL_DEV_USER_ID,
    layout,
  });
  assert(telemetry, "active-flow rollback capture is unavailable");
  const base = {
    sessionId: input.sessionId,
    userId: LOCAL_DEV_USER_ID,
    storyArtifactId: session.storyArtifactId,
    expectedBeatIndex: 0,
    expectedChunkIndex: 0,
    nextBeatIndex: layout.nextBeatIndex,
    nextChunkIndex: layout.nextChunkIndex,
  };
  const originalEventCount = flowEvents(input.flowId).length;

  await expectRejected(
    () => acknowledgeOwnedSessionPosition({ ...base, telemetry: null }),
    "active flow advanced without a capture",
  );
  await assertPositionAndEventCount(
    input.sessionId,
    0,
    0,
    input.flowId,
    originalEventCount,
    "missing capture",
  );

  const mismatchedPassage = prepareProductEventCapture({
    flowId: input.flowId,
    event: passageAcknowledgedEvent("initial", layout.passageOrdinal + 1),
  });
  await expectRejected(
    () =>
      acknowledgeOwnedSessionPosition({
        ...base,
        telemetry: { passage: mismatchedPassage, completion: null },
      }),
    "active flow accepted a mismatched capture",
  );
  await assertPositionAndEventCount(
    input.sessionId,
    0,
    0,
    input.flowId,
    originalEventCount,
    "mismatched capture",
  );

  const conflictingRecord = createProductEventRecord({
    eventId: createTelemetryEventId(),
    flowId: input.flowId,
    event: passageAcknowledgedEvent("initial", layout.passageOrdinal),
  });
  globalThis.__onwardProductEvents?.set(
    conflictingRecord.eventId,
    conflictingRecord,
  );
  const conflictCount = flowEvents(input.flowId).length;
  await expectRejected(
    () => acknowledgeOwnedSessionPosition({ ...base, telemetry }),
    "semantic event conflict did not abort progress",
  );
  await assertPositionAndEventCount(
    input.sessionId,
    0,
    0,
    input.flowId,
    conflictCount,
    "semantic conflict",
  );
  globalThis.__onwardProductEvents?.delete(conflictingRecord.eventId);
  globalThis.__onwardProductEventOutbox?.delete(conflictingRecord.eventId);
}

async function checkNullFlowProgress(): Promise<void> {
  const stage = FIGURE_STAGES.at(-1);
  assert(stage, "null-flow fixture stage is unavailable");
  const artifact = makeArtifact(stage, recipe);
  const artifactSessionId = await createSession({
    userId: LOCAL_DEV_USER_ID,
    telemetryFlowId: null,
    figureKey: stage.figureKey,
    stageId: stage.stageId,
    framing: "partial",
    age: 28,
    feeling: PRIVATE_CANARY,
    storyRequestContext: createStoryRequestContext({
      boundaries: undefined,
      clarification: undefined,
    }),
    matchRecipe: recipe,
    artifact,
  });
  const artifactSession = await getSession(artifactSessionId);
  const layout = deriveStoryPassageLayout(artifact.beats, {
    beatIndex: 0,
    chunkIndex: 0,
  });
  assert(artifactSession && layout, "null-flow artifact fixture is invalid");
  assert(
    (await prepareStoryProgressTelemetry({
      session: artifactSession,
      userId: LOCAL_DEV_USER_ID,
      layout,
    })) === null,
    "null-flow artifact fabricated a capture",
  );
  const beforeArtifact = listMemoryProductEvents().length;
  const artifactResult = await acknowledgeOwnedSessionPosition({
    sessionId: artifactSessionId,
    userId: LOCAL_DEV_USER_ID,
    storyArtifactId: artifactSession.storyArtifactId,
    telemetry: null,
    expectedBeatIndex: 0,
    expectedChunkIndex: 0,
    nextBeatIndex: layout.nextBeatIndex,
    nextChunkIndex: layout.nextChunkIndex,
  });
  assert(
    artifactResult === "advanced" &&
      listMemoryProductEvents().length === beforeArtifact,
    "null-flow artifact progress fabricated telemetry",
  );

  const legacyArtifact = makeArtifact(stage, recipe);
  const legacySessionId = await createSession({
    userId: LOCAL_DEV_USER_ID,
    telemetryFlowId: null,
    figureKey: stage.figureKey,
    stageId: stage.stageId,
    framing: "partial",
    age: 28,
    feeling: PRIVATE_CANARY,
    storyRequestContext: createStoryRequestContext({
      boundaries: undefined,
      clarification: undefined,
    }),
    matchRecipe: recipe,
    artifact: legacyArtifact,
  });
  const legacyRow = globalThis.__onwardSessions?.get(legacySessionId);
  assert(legacyRow, "legacy null-flow fixture is unavailable");
  legacyRow.storyArtifactId = null;
  const beforeLegacy = listMemoryProductEvents().length;
  const legacyResult = await acknowledgeOwnedSessionPosition({
    sessionId: legacySessionId,
    userId: LOCAL_DEV_USER_ID,
    storyArtifactId: null,
    telemetry: null,
    expectedBeatIndex: 0,
    expectedChunkIndex: 0,
    nextBeatIndex: layout.nextBeatIndex,
    nextChunkIndex: layout.nextChunkIndex,
  });
  assert(
    legacyResult === "advanced" &&
      listMemoryProductEvents().length === beforeLegacy,
    "legacy null-flow progress fabricated telemetry",
  );
}

async function checkKillSwitchBypass(): Promise<void> {
  const stage = FIGURE_STAGES[1];
  assert(stage, "kill-switch fixture stage is unavailable");
  const artifact = makeArtifact(stage, recipe);
  const flowId = createTelemetryFlowId();
  const sessionId = await createSession({
    userId: LOCAL_DEV_USER_ID,
    telemetryFlowId: flowId,
    figureKey: stage.figureKey,
    stageId: stage.stageId,
    framing: "partial",
    age: 28,
    feeling: PRIVATE_CANARY,
    storyRequestContext: createStoryRequestContext({
      boundaries: undefined,
      clarification: undefined,
    }),
    matchRecipe: recipe,
    artifact,
  });
  const session = await getSession(sessionId);
  const layout = deriveStoryPassageLayout(artifact.beats, {
    beatIndex: 0,
    chunkIndex: 0,
  });
  assert(session && layout, "kill-switch fixture is invalid");
  const previous = process.env.TELEMETRY_FLOW_BINDING_ENABLED;
  process.env.TELEMETRY_FLOW_BINDING_ENABLED = "false";
  try {
    assert(
      (await prepareStoryProgressTelemetry({
        session,
        userId: LOCAL_DEV_USER_ID,
        layout,
      })) === null,
      "kill switch did not stop progress capture preparation",
    );
    const before = flowEvents(flowId).length;
    const result = await acknowledgeOwnedSessionPosition({
      sessionId,
      userId: LOCAL_DEV_USER_ID,
      storyArtifactId: session.storyArtifactId,
      telemetry: null,
      expectedBeatIndex: 0,
      expectedChunkIndex: 0,
      nextBeatIndex: layout.nextBeatIndex,
      nextChunkIndex: layout.nextChunkIndex,
    });
    assert(
      result === "advanced" && flowEvents(flowId).length === before,
      "kill-switch CAS fabricated progress telemetry",
    );
  } finally {
    if (previous === undefined) {
      delete process.env.TELEMETRY_FLOW_BINDING_ENABLED;
    } else {
      process.env.TELEMETRY_FLOW_BINDING_ENABLED = previous;
    }
  }
}

async function walkStory(input: {
  sessionId: string;
  artifact: StoryArtifact;
  flowId: TelemetryFlowId;
  storyRole: StoryRole;
  checkStalePosition: boolean;
}): Promise<void> {
  const expectedTotal = input.artifact.beats.reduce(
    (count, beat) => count + beat.chunks.length,
    0,
  );
  assert(expectedTotal >= 2, `${input.storyRole} fixture needs two passages`);
  let expectedOrdinal = 0;
  let firstReplay:
    | {
        session: Session;
        layout: StoryPassageLayout;
        telemetry: NonNullable<
          Awaited<ReturnType<typeof prepareStoryProgressTelemetry>>
        >;
      }
    | undefined;

  for (const [beatIndex, beat] of input.artifact.beats.entries()) {
    for (const chunkIndex of beat.chunks.keys()) {
      const session = await getSession(input.sessionId);
      assert(session, `${input.storyRole} session disappeared during playback`);
      const layout = deriveStoryPassageLayout(input.artifact.beats, {
        beatIndex,
        chunkIndex,
      });
      assert(layout, `${input.storyRole} persisted passage layout was rejected`);
      assert(
        layout.passageOrdinal === expectedOrdinal &&
          layout.totalPassages === expectedTotal,
        `${input.storyRole} passage ordinal did not follow persisted chunk order`,
      );
      const telemetry = await prepareStoryProgressTelemetry({
        session,
        userId: LOCAL_DEV_USER_ID,
        layout,
      });
      assert(telemetry, `${input.storyRole} active flow was not resolved`);
      assert(
        telemetry.passage.flowId === input.flowId &&
          telemetry.passage.storyRole === input.storyRole &&
          telemetry.passage.passageOrdinal === expectedOrdinal,
        `${input.storyRole} helper did not derive the owned passage dimensions`,
      );
      assert(
        (telemetry.completion !== null) ===
          (expectedOrdinal === expectedTotal - 1),
        `${input.storyRole} completion was not final-passage-only`,
      );
      if (telemetry.completion) {
        assert(
          telemetry.completion.flowId === input.flowId &&
            telemetry.completion.storyRole === input.storyRole,
          `${input.storyRole} completion did not inherit the owned flow role`,
        );
      }

      const before = flowEvents(input.flowId);
      const result = await acknowledgeOwnedSessionPosition({
        sessionId: input.sessionId,
        userId: LOCAL_DEV_USER_ID,
        storyArtifactId: session.storyArtifactId,
        telemetry,
        expectedBeatIndex: beatIndex,
        expectedChunkIndex: chunkIndex,
        nextBeatIndex: layout.nextBeatIndex,
        nextChunkIndex: layout.nextChunkIndex,
      });
      assert(result === "advanced", `${input.storyRole} passage did not advance`);
      const after = flowEvents(input.flowId);
      const created = after.length - before.length;
      assert(
        created === (layout.next === "end" ? 2 : 1),
        `${input.storyRole} acknowledgement did not atomically create its event batch`,
      );
      assert(
        countEvents(after, "passage_acknowledged", input.storyRole) ===
          expectedOrdinal + 1,
        `${input.storyRole} passage event count diverged from its ordinal`,
      );
      assert(
        countEvents(after, "story_completed", input.storyRole) ===
          (layout.next === "end" ? 1 : 0),
        `${input.storyRole} completion count diverged from final position`,
      );

      if (expectedOrdinal === 0) firstReplay = { session, layout, telemetry };
      await checkReplaySingleton({
        sessionId: input.sessionId,
        storyArtifactId: session.storyArtifactId,
        layout,
        beatIndex,
        chunkIndex,
        telemetry,
        flowId: input.flowId,
        restoreOutbox: expectedOrdinal === 0 || layout.next === "end",
      });
      expectedOrdinal += 1;

      if (input.checkStalePosition && expectedOrdinal === 2) {
        assert(firstReplay, "initial stale-position fixture was not retained");
        const staleCount = flowEvents(input.flowId).length;
        const stale = await acknowledgeOwnedSessionPosition({
          sessionId: input.sessionId,
          userId: LOCAL_DEV_USER_ID,
          storyArtifactId: firstReplay.session.storyArtifactId,
          telemetry: firstReplay.telemetry,
          expectedBeatIndex: 0,
          expectedChunkIndex: 0,
          nextBeatIndex: firstReplay.layout.nextBeatIndex,
          nextChunkIndex: firstReplay.layout.nextChunkIndex,
        });
        assert(stale === "conflict", "stale passage retry did not conflict");
        assert(
          flowEvents(input.flowId).length === staleCount,
          "stale passage retry created telemetry",
        );
      }
    }
  }

  assert(
    expectedOrdinal === expectedTotal,
    `${input.storyRole} did not acknowledge every persisted passage`,
  );
  const completed = await getSession(input.sessionId);
  assert(
    completed?.nextBeatIndex === input.artifact.beats.length &&
      completed.nextChunkIndex === 0,
    `${input.storyRole} session did not finish at the canonical terminal position`,
  );
}

async function checkReplaySingleton(input: {
  sessionId: string;
  storyArtifactId: string | null;
  layout: StoryPassageLayout;
  beatIndex: number;
  chunkIndex: number;
  telemetry: NonNullable<
    Awaited<ReturnType<typeof prepareStoryProgressTelemetry>>
  >;
  flowId: TelemetryFlowId;
  restoreOutbox: boolean;
}): Promise<void> {
  const before = flowEvents(input.flowId);
  const captures = input.telemetry.completion
    ? [input.telemetry.passage, input.telemetry.completion]
    : [input.telemetry.passage];
  if (input.restoreOutbox) {
    for (const capture of captures) {
      globalThis.__onwardProductEventOutbox?.delete(capture.eventId);
    }
  }

  const replay = await acknowledgeOwnedSessionPosition({
    sessionId: input.sessionId,
    userId: LOCAL_DEV_USER_ID,
    storyArtifactId: input.storyArtifactId,
    telemetry: input.telemetry,
    expectedBeatIndex: input.beatIndex,
    expectedChunkIndex: input.chunkIndex,
    nextBeatIndex: input.layout.nextBeatIndex,
    nextChunkIndex: input.layout.nextChunkIndex,
  });
  assert(replay === "already_advanced", "immediate replay did not converge");
  assert(
    flowEvents(input.flowId).length === before.length,
    "immediate replay duplicated a product event",
  );
  if (input.restoreOutbox) {
    const pointerIds = new Set(
      listMemoryProductEventOutbox().map((pointer) => pointer.eventId),
    );
    assert(
      captures.every((capture) => pointerIds.has(capture.eventId)),
      "duplicate replay did not reconcile a missing outbox pointer",
    );
  }
}

async function checkForeignAndMissingAreIndistinguishable(input: {
  sessionId: string;
  artifact: StoryArtifact;
}): Promise<void> {
  const session = await getSession(input.sessionId);
  assert(session, "ownership fixture session is unavailable");
  const layout = deriveStoryPassageLayout(input.artifact.beats, {
    beatIndex: 0,
    chunkIndex: 0,
  });
  assert(layout, "ownership fixture layout is unavailable");
  const capture = await prepareStoryProgressTelemetry({
    session,
    userId: LOCAL_DEV_USER_ID,
    layout,
  });
  assert(capture, "ownership fixture flow is unavailable");
  assert(
    (await prepareStoryProgressTelemetry({
      session,
      userId: FOREIGN_USER_ID,
      layout,
    })) === null,
    "server helper resolved a flow for a foreign owner",
  );
  const before = listMemoryProductEvents().length;
  const base = {
    storyArtifactId: session.storyArtifactId,
    telemetry: capture,
    expectedBeatIndex: 0,
    expectedChunkIndex: 0,
    nextBeatIndex: layout.nextBeatIndex,
    nextChunkIndex: layout.nextChunkIndex,
  };
  const foreign = await acknowledgeOwnedSessionPosition({
    ...base,
    sessionId: input.sessionId,
    userId: FOREIGN_USER_ID,
  });
  const missing = await acknowledgeOwnedSessionPosition({
    ...base,
    sessionId: "f".repeat(32),
    userId: LOCAL_DEV_USER_ID,
  });
  assert(
    foreign === "not_found" && missing === "not_found",
    "foreign and missing progress writes were distinguishable",
  );
  assert(
    listMemoryProductEvents().length === before,
    "rejected ownership probe emitted telemetry",
  );
}

function makeArtifact(
  stage: FigureStageRow,
  matchRecipe: MatchRecipe,
): StoryArtifact {
  return composeCanonicalStoryArtifact({
    storySpec: buildDraftStorySpec(stage),
    stage,
    matchRecipe,
    openingCopy: {
      eyebrow: NEUTRAL_EYEBROW,
      prefaceLines: DEFAULT_PREFACE_LINES,
    },
    framing: "partial",
    resonanceBrief: createResonanceBrief(PRIVATE_CANARY),
    allowDraftSpec: true,
  });
}

function flowEvents(
  flowId: TelemetryFlowId,
): ReadonlyArray<Readonly<ProductEventRecord>> {
  return listMemoryProductEvents().filter((event) => event.flowId === flowId);
}

function countEvents(
  events: ReadonlyArray<Readonly<ProductEventRecord>>,
  event: ProductEventRecord["event"],
  storyRole: StoryRole,
): number {
  return events.filter(
    (candidate) =>
      candidate.event === event &&
      "storyRole" in candidate &&
      candidate.storyRole === storyRole,
  ).length;
}

function checkEventPrivacy(flowId: TelemetryFlowId): void {
  const serialized = JSON.stringify(flowEvents(flowId));
  const forbiddenKeys = [
    "feeling",
    "userId",
    "sessionId",
    "artifactId",
    "figureKey",
    "stageId",
    "storyArtifactId",
    "rootSessionId",
    "text",
    "content",
  ];
  for (const key of forbiddenKeys) {
    assert(!serialized.includes(`\"${key}\"`), `telemetry persisted ${key}`);
  }
  assert(
    !serialized.includes(PRIVATE_CANARY) &&
      !serialized.includes(LOCAL_DEV_USER_ID),
    "telemetry copied a disclosure or account identifier",
  );
}

function checkStaticBoundaries(): void {
  const route = source("../app/api/beat/ack/route.ts");
  const helper = source("../lib/story-progress-telemetry.ts");
  const memory = source("../lib/session-store-memory.ts");
  const supabase = source("../lib/session-store-supabase.ts");
  const supabaseAcknowledge = supabase.slice(
    supabase.indexOf("async function acknowledgePosition"),
    supabase.indexOf("async function acknowledgeLegacyPosition"),
  );
  const migration = source(
    "../supabase/migrations/0013_story_progress_telemetry.sql",
  );

  assert(
    route.includes("getOwnedSession") &&
      route.indexOf("await getOwnedSession(") <
        route.indexOf("await getStoryPlayback(") &&
      route.includes("prepareStoryProgressTelemetry") &&
      route.includes("telemetry,"),
    "ack route does not cross ownership and server telemetry boundaries",
  );
  assert(
    !route.includes("prepareProductEventCapture") &&
      !route.includes("passageAcknowledgedEvent") &&
      !route.includes("storyCompletedEvent") &&
      !route.includes("body.telemetry"),
    "ack route accepts or constructs event dimensions outside the helper",
  );
  assert(
    helper.includes("telemetryFlowBindingEnabled") &&
      helper.indexOf("if (!telemetryFlowBindingEnabled()) return null") <
        helper.indexOf("await resolveOwnedTelemetryFlowForKnownSession(") &&
      helper.includes("input.session.alternateOfSessionId === null") &&
      helper.includes("input.layout.passageOrdinal") &&
      helper.includes('input.layout.next === "end"'),
    "story-progress helper does not derive dimensions from owned server state",
  );
  assert(
    memory.includes("deriveStoryPassageLayout(artifact.beats") &&
      memory.includes("telemetry.passage.passageOrdinal !== layout.passageOrdinal") &&
      memory.includes("const now = Date.now()") &&
      memory.includes("existing.userId,\n        now,") &&
      memory.includes("recordPreparedMemoryProductEventsAtomically(captures, now)") &&
      memory.includes("updatedAt: now") &&
      source("../lib/telemetry.ts").includes("now: new Date(now)") &&
      source("../lib/telemetry-schema.ts").includes(
        "authenticateTelemetryFlowId(input.flowId)",
      ) &&
      source("../lib/telemetry-store-memory.ts").includes(
        "deriveProductEventSemanticKey(candidate, candidate.flowId)",
      ),
    "memory store does not independently reduce and atomically capture progress",
  );
  assert(
    supabaseAcknowledge.includes('"acknowledge_story_position_v1"') &&
      supabaseAcknowledge.includes(
        "p_story_role: passageCapture?.storyRole ?? null",
      ) &&
      supabaseAcknowledge.includes(
        "p_passage_ordinal: passageCapture?.passageOrdinal ?? null",
      ) &&
      !supabaseAcknowledge.includes("p_feeling") &&
      !supabaseAcknowledge.includes("p_story_text"),
    "Supabase progress boundary is missing closed, disclosure-free capture args",
  );
  assert(
    supabaseAcknowledge.includes("acknowledgeLegacyPosition(input, false)") &&
      supabaseAcknowledge.includes("acknowledgeLegacyPosition(input, true)") &&
      supabase.includes('.is("story_artifact_id", null)'),
    "Supabase fallback does not separate incident bypass from true legacy rows",
  );

  const sqlRequirements = [
    "do $legacy_progress_preflight$",
    "artifact-validator-v1-2026-07",
    "v_total_passages > 64",
    "legacy StoryArtifact preflight failed",
    "p_story_role text",
    "p_passage_ordinal int",
    "where story_session.session_id = p_session_id",
    "and story_session.user_id = p_user_id",
    "for update",
    "v_story_role := case",
    "v_passage_ordinal := p_expected_chunk_index",
    "p_story_role is distinct from v_story_role",
    "p_passage_ordinal is distinct from v_passage_ordinal::int",
    "p_event_name => 'passage_acknowledged'",
    "p_passage_ordinal => v_passage_ordinal::int",
    "p_event_name => 'story_completed'",
    "if v_is_completion then",
    "revoke all on function public.acknowledge_story_position_v1",
    "grant execute on function public.acknowledge_story_position_v1",
  ];
  assert(
    sqlRequirements.every((requirement) => migration.includes(requirement)),
    "migration 0013 does not independently verify and capture story progress",
  );
  assert(
    migration.indexOf("and story_session.user_id = p_user_id") <
      migration.indexOf("p_expected_beat_index is null") &&
      !migration.includes("p_feeling") &&
      !migration.includes("p_story_text") &&
      !migration.includes("p_figure_key") &&
      !migration.includes("p_artifact_id"),
    "migration 0013 leaks disclosure/domain identity or checks position before ownership",
  );
  assert(
    migration.includes("if found then") &&
      migration.includes(
        "raise exception 'active story progress telemetry capture is invalid'",
      ) &&
      migration.includes("if v_flow.flow_id is not null then"),
    "migration 0013 does not fail closed for active-flow capture gaps",
  );
}

async function expectRejected(
  action: () => Promise<unknown>,
  message: string,
): Promise<void> {
  try {
    await action();
  } catch {
    return;
  }
  throw new Error(message);
}

async function assertPositionAndEventCount(
  sessionId: string,
  expectedBeatIndex: number,
  expectedChunkIndex: number,
  flowId: TelemetryFlowId,
  eventCount: number,
  label: string,
): Promise<void> {
  const session = await getSession(sessionId);
  assert(
    session?.nextBeatIndex === expectedBeatIndex &&
      session.nextChunkIndex === expectedChunkIndex,
    `${label} changed the durable reader position`,
  );
  assert(
    flowEvents(flowId).length === eventCount,
    `${label} partially changed the product-event batch`,
  );
}

function source(relativePath: string): string {
  return readFileSync(
    fileURLToPath(new URL(relativePath, import.meta.url)),
    "utf8",
  );
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

main().catch((error) => {
  console.error(
    `Story-progress telemetry check failed: ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
  process.exit(1);
});
