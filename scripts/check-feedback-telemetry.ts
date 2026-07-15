import "./_smoke-bootstrap";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  claimAlternateStoryFlow,
  completeAlternateStoryReady,
  issueAlternateStoryCapability,
} from "../lib/alternate-story-flow";
import { ALTERNATE_STORY_POLICY_VERSION } from "../lib/alternate-story-types";
import { LOCAL_DEV_USER_ID } from "../lib/auth";
import { FIGURE_STAGES } from "../lib/figures-data";
import { APPROVED_PRODUCTION_RECIPE } from "../lib/match-config";
import { createResonanceBrief } from "../lib/resonance-brief";
import {
  ResonanceFeedbackConflictError,
  _listResonanceFeedback,
  submitResonanceFeedback,
} from "../lib/resonance-feedback";
import {
  submitMemoryResonanceFeedback,
  type MemoryResonanceFeedbackInput,
  type SafeResonanceFeedback,
} from "../lib/resonance-feedback-store-memory";
import { prepareResonanceFeedbackTelemetry } from "../lib/resonance-feedback-telemetry";
import {
  RESONANCE_FEEDBACK_POLICY_VERSION,
  type ResonanceFeedbackVerdict,
  type ResonanceMissReason,
} from "../lib/resonance-feedback-types";
import {
  createSession,
  getSession,
  updateSession,
} from "../lib/session";
import { composeCanonicalStoryArtifact } from "../lib/story-artifact";
import type { StoryArtifact } from "../lib/story-artifact-types";
import { createStoryRequestContext } from "../lib/story-request-context";
import { buildDraftStorySpec } from "../lib/story-spec";
import {
  createTelemetryEventId,
  createTelemetryFlowId,
  createTelemetryOutboxLeaseId,
  deleteProductEventsForFlow,
  prepareProductEventCapture,
} from "../lib/telemetry";
import { feedbackSubmittedEvent } from "../lib/telemetry-producers";
import { createProductEventRecord } from "../lib/telemetry-schema";
import {
  ackMemoryProductEventOutbox,
  appendMemoryProductEvent,
  claimMemoryProductEventOutbox,
  listMemoryProductEventOutbox,
  listMemoryProductEvents,
} from "../lib/telemetry-store-memory";
import type {
  ProductEventRecord,
  StoryRole,
  TelemetryFlowId,
} from "../lib/telemetry-types";
import type { FigureStageRow, MatchRecipe, Session } from "../lib/types";

process.env.PERSISTENCE = "memory";
process.env.LLM_PROVIDER = "stub";
process.env.RETRIEVAL_MODE = "keyword";
process.env.TELEMETRY_FLOW_BINDING_ENABLED = "true";

const PRIVATE_CANARY =
  "My private amber compass feels useless after one rejection too many.";
const recipe: MatchRecipe = {
  recipeId: APPROVED_PRODUCTION_RECIPE.recipeId,
  matchConfigVersion: APPROVED_PRODUCTION_RECIPE.matchConfigVersion,
  crisisRegexVersion: "feedback-telemetry-test",
  llmProvider: "stub",
  rerankModelId: "stub",
  proseModelId: "stub",
  embeddingModelId: "stub",
  retrievalMode: "keyword",
};

type Fixture = {
  flowId: TelemetryFlowId | null;
  session: Session;
  artifact: StoryArtifact;
};

async function main(): Promise<void> {
  checkStaticContracts();
  await checkActiveCaptureRollback();
  await checkRetryAndConflictSemantics();
  await checkConcurrentSubmissions();
  await checkNullRevokedAndDisabledFlows();
  const journeyFlow = await checkInitialAndAlternateRoles();
  checkPrivacy(journeyFlow);

  console.log("Onward resonance-feedback telemetry validator");
  console.log("================================================");
  console.log("PASS active-flow feedback and event writes are all-or-nothing");
  console.log("PASS identical replay restores only missing outbox work");
  console.log("PASS delivered events stay delivered and divergent answers conflict first");
  console.log("PASS concurrent feedback converges on one persisted verdict and event");
  console.log("PASS null, revoked, and incident-disabled flows fabricate no telemetry");
  console.log("PASS initial and alternate feedback share one root flow with distinct roles");
  console.log("PASS migration 0014 derives bounded dimensions and preserves feedback privacy");
}

async function checkActiveCaptureRollback(): Promise<void> {
  const invalidCases: Array<{
    label: string;
    capture: (fixture: Fixture) => Promise<MemoryResonanceFeedbackInput["telemetry"]>;
  }> = [
    { label: "missing capture", capture: async () => null },
    {
      label: "wrong role",
      capture: async (fixture) =>
        prepareProductEventCapture({
          flowId: requireFlow(fixture),
          event: feedbackSubmittedEvent("alternate", "felt_close"),
        }),
    },
    {
      label: "wrong verdict",
      capture: async (fixture) =>
        prepareProductEventCapture({
          flowId: requireFlow(fixture),
          event: feedbackSubmittedEvent("initial", "not_close"),
        }),
    },
    {
      label: "wrong flow",
      capture: async () =>
        prepareProductEventCapture({
          flowId: createTelemetryFlowId(),
          event: feedbackSubmittedEvent("initial", "felt_close"),
        }),
    },
    {
      label: "wrong schema",
      capture: async (fixture) => ({
        ...(await requireFeedbackCapture(fixture, "felt_close")),
        schemaVersion: "unsupported-product-event-schema",
      }) as unknown as MemoryResonanceFeedbackInput["telemetry"],
    },
    {
      label: "malformed event ID",
      capture: async (fixture) => ({
        ...(await requireFeedbackCapture(fixture, "felt_close")),
        eventId: "not-a-signed-event-id",
      }) as unknown as MemoryResonanceFeedbackInput["telemetry"],
    },
  ];

  for (const test of invalidCases) {
    const fixture = await makeCompletedFixture();
    const telemetry = await test.capture(fixture);
    const before = snapshotStores();
    await expectRejected(
      () =>
        submitMemoryResonanceFeedback({
          ...safeFeedback(fixture, "felt_close"),
          telemetry,
        }),
      `${test.label} did not reject`,
    );
    assert(
      snapshotStores() === before,
      `${test.label} mutated feedback, event, or outbox state`,
    );
  }

  const semanticFixture = await makeCompletedFixture();
  const flowId = requireFlow(semanticFixture);
  const collision = createProductEventRecord({
    eventId: createTelemetryEventId(),
    flowId,
    event: feedbackSubmittedEvent("initial", "felt_close"),
  });
  assert(
    appendMemoryProductEvent(collision) === "created",
    "semantic-collision fixture could not be installed",
  );
  const beforeCollision = snapshotStores();
  const capture = await requireFeedbackCapture(semanticFixture, "felt_close");
  await expectRejected(
    () =>
      submitMemoryResonanceFeedback({
        ...safeFeedback(semanticFixture, "felt_close"),
        telemetry: capture,
      }),
    "semantic event collision did not reject feedback",
  );
  assert(
    snapshotStores() === beforeCollision,
    "semantic event collision partially persisted feedback or outbox state",
  );
}

async function checkRetryAndConflictSemantics(): Promise<void> {
  const fixture = await makeCompletedFixture();
  const closeCapture = await requireFeedbackCapture(fixture, "felt_close");
  const missCapture = await requireFeedbackCapture(fixture, "not_close");
  assert(
    closeCapture.eventId === missCapture.eventId,
    "feedback event identity unexpectedly depends on measured verdict",
  );

  const created = await submitResonanceFeedback({
    userId: LOCAL_DEV_USER_ID,
    session: fixture.session,
    artifact: fixture.artifact,
    feedback: { sessionId: fixture.session.sessionId, verdict: "felt_close" },
  });
  assert(created === "created", "first feedback was not created");
  const event = singleFeedbackEvent(requireFlow(fixture), "initial");

  globalThis.__onwardProductEventOutbox?.delete(event.eventId);
  const replay = await submitResonanceFeedback({
    userId: LOCAL_DEV_USER_ID,
    session: fixture.session,
    artifact: fixture.artifact,
    feedback: { sessionId: fixture.session.sessionId, verdict: "felt_close" },
  });
  assert(replay === "duplicate", "identical feedback replay was not idempotent");
  assert(
    pointer(event.eventId)?.status === "pending",
    "identical replay did not restore a missing outbox pointer",
  );

  const leaseId = createTelemetryOutboxLeaseId();
  const claimed = claimMemoryProductEventOutbox({ leaseId, limit: 100 });
  assert(
    claimed.some((candidate) => candidate.eventId === event.eventId),
    "feedback outbox row could not be leased",
  );
  assert(
    ackMemoryProductEventOutbox({ eventId: event.eventId, leaseId }) ===
      "acknowledged",
    "feedback outbox row could not be acknowledged",
  );
  await submitResonanceFeedback({
    userId: LOCAL_DEV_USER_ID,
    session: fixture.session,
    artifact: fixture.artifact,
    feedback: { sessionId: fixture.session.sessionId, verdict: "felt_close" },
  });
  assert(
    pointer(event.eventId)?.status === "delivered",
    "an identical retry requeued a delivered feedback event",
  );

  const beforeOpposite = snapshotStores();
  await expectConflict(
    () =>
      submitResonanceFeedback({
        userId: LOCAL_DEV_USER_ID,
        session: fixture.session,
        artifact: fixture.artifact,
        feedback: {
          sessionId: fixture.session.sessionId,
          verdict: "not_close",
          reason: "wrong_feeling",
        },
      }),
    "opposite verdict did not conflict",
  );
  assert(
    snapshotStores() === beforeOpposite,
    "opposite verdict touched feedback, event, or outbox state",
  );

  const missFixture = await makeCompletedFixture();
  await submitResonanceFeedback({
    userId: LOCAL_DEV_USER_ID,
    session: missFixture.session,
    artifact: missFixture.artifact,
    feedback: {
      sessionId: missFixture.session.sessionId,
      verdict: "not_close",
      reason: "wrong_feeling",
    },
  });
  const beforeReason = snapshotStores();
  await expectConflict(
    () =>
      submitResonanceFeedback({
        userId: LOCAL_DEV_USER_ID,
        session: missFixture.session,
        artifact: missFixture.artifact,
        feedback: {
          sessionId: missFixture.session.sessionId,
          verdict: "not_close",
          reason: "wrong_situation",
        },
      }),
    "changed miss reason did not conflict",
  );
  assert(
    snapshotStores() === beforeReason,
    "changed miss reason attempted telemetry capture",
  );
}

async function checkConcurrentSubmissions(): Promise<void> {
  const identical = await makeCompletedFixture();
  const dispositions = await Promise.all(
    Array.from({ length: 12 }, () =>
      submitResonanceFeedback({
        userId: LOCAL_DEV_USER_ID,
        session: identical.session,
        artifact: identical.artifact,
        feedback: {
          sessionId: identical.session.sessionId,
          verdict: "felt_close",
        },
      }),
    ),
  );
  assert(
    dispositions.filter((value) => value === "created").length === 1 &&
      dispositions.filter((value) => value === "duplicate").length === 11,
    "identical concurrent feedback did not converge",
  );
  singleFeedbackEvent(requireFlow(identical), "initial");

  const divergent = await makeCompletedFixture();
  const results = await Promise.allSettled([
    submitResonanceFeedback({
      userId: LOCAL_DEV_USER_ID,
      session: divergent.session,
      artifact: divergent.artifact,
      feedback: {
        sessionId: divergent.session.sessionId,
        verdict: "felt_close",
      },
    }),
    submitResonanceFeedback({
      userId: LOCAL_DEV_USER_ID,
      session: divergent.session,
      artifact: divergent.artifact,
      feedback: {
        sessionId: divergent.session.sessionId,
        verdict: "not_close",
        reason: "story_felt_generic",
      },
    }),
  ]);
  assert(
    results.filter((result) => result.status === "fulfilled").length === 1 &&
      results.filter(
        (result) =>
          result.status === "rejected" &&
          result.reason instanceof ResonanceFeedbackConflictError,
      ).length === 1,
    "divergent concurrent feedback did not preserve first-write-wins",
  );
  const stored = _listResonanceFeedback().find(
    (item) => item.sessionId === divergent.session.sessionId,
  );
  const event = singleFeedbackEvent(requireFlow(divergent), "initial");
  assert(
    stored && event.event === "feedback_submitted" && event.verdict === stored.verdict,
    "feedback event verdict diverged from the persisted answer",
  );
}

async function checkNullRevokedAndDisabledFlows(): Promise<void> {
  const nullFlow = await makeCompletedFixture({ withFlow: false });
  const beforeNullEvents = feedbackEvents().length;
  await submitResonanceFeedback({
    userId: LOCAL_DEV_USER_ID,
    session: nullFlow.session,
    artifact: nullFlow.artifact,
    feedback: { sessionId: nullFlow.session.sessionId, verdict: "felt_close" },
  });
  assert(
    feedbackEvents().length === beforeNullEvents &&
      hasFeedback(nullFlow.session.sessionId),
    "a null-flow feedback write fabricated telemetry or failed",
  );

  const revoked = await makeCompletedFixture();
  await deleteProductEventsForFlow(requireFlow(revoked), LOCAL_DEV_USER_ID);
  const beforeRevokedEvents = feedbackEvents().length;
  await submitResonanceFeedback({
    userId: LOCAL_DEV_USER_ID,
    session: revoked.session,
    artifact: revoked.artifact,
    feedback: { sessionId: revoked.session.sessionId, verdict: "felt_close" },
  });
  assert(
    feedbackEvents().length === beforeRevokedEvents &&
      hasFeedback(revoked.session.sessionId),
    "a revoked-flow feedback write fabricated telemetry or failed",
  );

  const disabled = await makeCompletedFixture();
  const beforeDisabledEvents = feedbackEvents().length;
  process.env.TELEMETRY_FLOW_BINDING_ENABLED = "false";
  try {
    await submitResonanceFeedback({
      userId: LOCAL_DEV_USER_ID,
      session: disabled.session,
      artifact: disabled.artifact,
      feedback: {
        sessionId: disabled.session.sessionId,
        verdict: "felt_close",
      },
    });
  } finally {
    process.env.TELEMETRY_FLOW_BINDING_ENABLED = "true";
  }
  assert(
    feedbackEvents().length === beforeDisabledEvents &&
      hasFeedback(disabled.session.sessionId),
    "incident-disabled feedback attempted linked telemetry or failed",
  );
  const restored = await submitResonanceFeedback({
    userId: LOCAL_DEV_USER_ID,
    session: disabled.session,
    artifact: disabled.artifact,
    feedback: {
      sessionId: disabled.session.sessionId,
      verdict: "felt_close",
    },
  });
  assert(
    restored === "duplicate" &&
      singleFeedbackEvent(requireFlow(disabled), "initial").verdict ===
        "felt_close",
    "post-incident exact retry did not reconcile the missing feedback event",
  );
}

async function checkInitialAndAlternateRoles(): Promise<TelemetryFlowId> {
  const initial = await makeCompletedFixture();
  const flowId = requireFlow(initial);
  await submitResonanceFeedback({
    userId: LOCAL_DEV_USER_ID,
    session: initial.session,
    artifact: initial.artifact,
    feedback: {
      sessionId: initial.session.sessionId,
      verdict: "not_close",
      reason: "wrong_feeling",
    },
  });

  const offer = await issueAlternateStoryCapability({
    userId: LOCAL_DEV_USER_ID,
    session: initial.session,
    artifact: initial.artifact,
  });
  assert(offer.status === "available", "alternate capability was not issued");
  const claim = await claimAlternateStoryFlow({
    userId: LOCAL_DEV_USER_ID,
    session: initial.session,
    artifact: initial.artifact,
    token: offer.token,
  });
  assert(claim.status === "claimed", "alternate capability was not claimed");

  const alternateStage = FIGURE_STAGES.find(
    (stage) =>
      stage.figureKey !== initial.artifact.figureKey ||
      stage.stageId !== initial.artifact.stageId,
  );
  assert(alternateStage, "alternate stage fixture is unavailable");
  const alternateArtifact = makeArtifact(alternateStage, {
    ...recipe,
    alternateStoryPolicyVersion: ALTERNATE_STORY_POLICY_VERSION,
  });
  const alternateSessionId = await completeAlternateStoryReady({
    userId: LOCAL_DEV_USER_ID,
    claim,
    sourceArtifactId: initial.artifact.artifactId,
    artifact: alternateArtifact,
  });
  await updateSession(alternateSessionId, {
    nextBeatIndex: alternateArtifact.beats.length,
    nextChunkIndex: 0,
  });
  const alternateSession = await getSession(alternateSessionId);
  assert(alternateSession, "completed alternate session is unavailable");
  await submitResonanceFeedback({
    userId: LOCAL_DEV_USER_ID,
    session: alternateSession,
    artifact: alternateArtifact,
    feedback: { sessionId: alternateSessionId, verdict: "felt_close" },
  });

  const initialEvent = singleFeedbackEvent(flowId, "initial");
  const alternateEvent = singleFeedbackEvent(flowId, "alternate");
  assert(
    initialEvent.verdict === "not_close" &&
      alternateEvent.verdict === "felt_close",
    "initial/alternate event verdicts were not derived from their feedback rows",
  );
  return flowId;
}

function checkPrivacy(flowId: TelemetryFlowId): void {
  const serialized = JSON.stringify(
    feedbackEvents().filter((event) => event.flowId === flowId),
  );
  const forbidden = [
    PRIVATE_CANARY,
    "reason",
    "feeling",
    "userId",
    "sessionId",
    "artifactId",
    "figureKey",
    "stageId",
    "storySpecId",
    "text",
  ];
  for (const value of forbidden) {
    assert(!serialized.includes(value), `feedback telemetry retained ${value}`);
  }
}

function checkStaticContracts(): void {
  const migration = source("../supabase/migrations/0014_story_feedback_telemetry.sql");
  const supabase = source("../lib/resonance-feedback-store-supabase.ts");
  const memory = source("../lib/resonance-feedback-store-memory.ts");
  const helper = source("../lib/resonance-feedback-telemetry.ts");
  const sqlRequirements = [
    "create or replace function public.submit_story_feedback_v2",
    "where story_session.session_id = p_session_id",
    "and story_session.user_id = p_user_id",
    "for update",
    "v_root_session_id := coalesce",
    "v_story_role := case",
    "p_story_role is distinct from v_story_role",
    "p_feedback_verdict is distinct from v_feedback.verdict",
    "p_event_name => 'feedback_submitted'",
    "p_story_role => v_story_role",
    "p_feedback_verdict => v_feedback.verdict",
    "v_capture_status not in ('created', 'duplicate')",
    "revoke all on function public.submit_story_feedback_v2",
    "grant execute on function public.submit_story_feedback_v2",
  ];
  assert(
    sqlRequirements.every((requirement) => migration.includes(requirement)),
    "migration 0014 is missing an ownership, derivation, or capture invariant",
  );
  assert(
    migration.indexOf("for update") <
      migration.indexOf("select * into v_feedback") &&
      !migration.includes("pg_advisory_xact_lock"),
    "feedback SQL has unsafe or redundant per-session lock ordering",
  );
  const captureCall = migration.slice(
    migration.indexOf("select public.capture_product_event_v1("),
    migration.indexOf(") into v_capture_status;"),
  );
  assert(
    !captureCall.includes("p_reason") &&
      !captureCall.includes("p_session_id") &&
      !captureCall.includes("p_artifact_id"),
    "feedback event capture copied a private domain dimension",
  );
  assert(
    supabase.includes('rpc("submit_story_feedback_v2"') &&
      supabase.includes("const telemetryEnabled = telemetryFlowBindingEnabled()") &&
      supabase.includes("p_story_role: input.telemetry?.storyRole ?? null") &&
      supabase.includes("p_feedback_verdict: input.telemetry?.verdict ?? null") &&
      !supabase.includes("catch"),
    "Supabase feedback write can fall back after an ambiguous v2 response",
  );
  assert(
    helper.indexOf("if (!telemetryFlowBindingEnabled()) return null") <
      helper.indexOf("await resolveOwnedTelemetryFlowForKnownSession(") &&
      helper.includes("input.session.alternateOfSessionId === null"),
    "feedback helper does not derive role/root behind the incident switch",
  );
  assert(
    memory.includes("const now = Date.now()") &&
      memory.includes("const telemetryEnabled = telemetryFlowBindingEnabled()") &&
      memory.includes("session.userId,\n        now,") &&
      memory.includes("recordPreparedMemoryProductEventsAtomically([telemetry], now)") &&
      memory.indexOf("captureFeedbackEvent(telemetry") <
        memory.indexOf("feedback.set(safeInput.sessionId, stored)"),
    "memory feedback transaction lacks one-clock preflight-before-map semantics",
  );
}

async function makeCompletedFixture(input: {
  withFlow?: boolean;
  stage?: FigureStageRow;
} = {}): Promise<Fixture> {
  const stage = input.stage ?? FIGURE_STAGES[0];
  assert(stage, "feedback stage fixture is unavailable");
  const artifact = makeArtifact(stage, recipe);
  const flowId = input.withFlow === false ? null : createTelemetryFlowId();
  const sessionId = await createSession({
    userId: LOCAL_DEV_USER_ID,
    telemetryFlowId: flowId,
    figureKey: artifact.figureKey,
    stageId: artifact.stageId,
    framing: artifact.framing,
    age: 29,
    feeling: PRIVATE_CANARY,
    storyRequestContext: createStoryRequestContext({
      boundaries: undefined,
      clarification: undefined,
    }),
    matchRecipe: recipe,
    artifact,
  });
  await updateSession(sessionId, {
    nextBeatIndex: artifact.beats.length,
    nextChunkIndex: 0,
  });
  const session = await getSession(sessionId);
  assert(session, "completed feedback session is unavailable");
  return { flowId, session, artifact };
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
      eyebrow: "A true story",
      prefaceLines: ["This story is true.", "Your life is not theirs."],
    },
    framing: "partial",
    resonanceBrief: createResonanceBrief(PRIVATE_CANARY),
    allowDraftSpec: true,
  });
}

function safeFeedback(
  fixture: Fixture,
  verdict: ResonanceFeedbackVerdict,
  reason: ResonanceMissReason | null = null,
): SafeResonanceFeedback {
  return {
    userId: LOCAL_DEV_USER_ID,
    sessionId: fixture.session.sessionId,
    artifactId: fixture.artifact.artifactId,
    storySpecId: fixture.artifact.storySpecId,
    storySpecVersion: fixture.artifact.storySpecVersion,
    figureKey: fixture.artifact.figureKey,
    stageId: fixture.artifact.stageId,
    recipeId: fixture.session.matchRecipe.recipeId,
    policyVersion: RESONANCE_FEEDBACK_POLICY_VERSION,
    verdict,
    reason,
  };
}

async function requireFeedbackCapture(
  fixture: Fixture,
  verdict: ResonanceFeedbackVerdict,
) {
  const capture = await prepareResonanceFeedbackTelemetry({
    session: fixture.session,
    userId: LOCAL_DEV_USER_ID,
    verdict,
  });
  assert(capture, "active feedback fixture did not resolve its root flow");
  return capture;
}

function requireFlow(fixture: Fixture): TelemetryFlowId {
  assert(fixture.flowId, "active feedback fixture has no flow");
  return fixture.flowId;
}

function feedbackEvents(): ReadonlyArray<
  Readonly<Extract<ProductEventRecord, { event: "feedback_submitted" }>>
> {
  return listMemoryProductEvents().filter(
    (event): event is Readonly<
      Extract<ProductEventRecord, { event: "feedback_submitted" }>
    > => event.event === "feedback_submitted",
  );
}

function singleFeedbackEvent(flowId: TelemetryFlowId, role: StoryRole) {
  const events = feedbackEvents().filter(
    (event) => event.flowId === flowId && event.storyRole === role,
  );
  assert(events.length === 1, `${role} feedback event was not singleton`);
  return events[0];
}

function pointer(eventId: string) {
  return listMemoryProductEventOutbox().find(
    (candidate) => candidate.eventId === eventId,
  );
}

function hasFeedback(sessionId: string): boolean {
  return _listResonanceFeedback().some((item) => item.sessionId === sessionId);
}

function snapshotStores(): string {
  return JSON.stringify({
    feedback: _listResonanceFeedback(),
    events: listMemoryProductEvents(),
    outbox: listMemoryProductEventOutbox(),
  });
}

async function expectRejected(
  operation: () => Promise<unknown>,
  message: string,
): Promise<void> {
  try {
    await operation();
  } catch {
    return;
  }
  throw new Error(message);
}

async function expectConflict(
  operation: () => Promise<unknown>,
  message: string,
): Promise<void> {
  try {
    await operation();
  } catch (error) {
    if (error instanceof ResonanceFeedbackConflictError) return;
    throw error;
  }
  throw new Error(message);
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
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
