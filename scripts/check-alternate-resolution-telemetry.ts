import "./_smoke-bootstrap";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  claimAlternateStoryFlow,
  completeAlternateStoryExpired,
  completeAlternateStoryReady,
  completeAlternateStoryUnavailable,
  issueAlternateStoryCapability,
  releaseAlternateStoryFlow,
  type ClaimedAlternateStoryFlow,
} from "../lib/alternate-story-flow";
import {
  completeMemoryAlternateStoryReady,
  type StoredAlternateStoryFlow,
} from "../lib/alternate-story-store-memory";
import { prepareAlternateReadyTelemetry } from "../lib/alternate-story-telemetry";
import { createAlternateStory } from "../lib/alternate-story";
import { ALTERNATE_STORY_POLICY_VERSION } from "../lib/alternate-story-types";
import { LOCAL_DEV_USER_ID } from "../lib/auth";
import { FIGURE_STAGES } from "../lib/figures-data";
import { APPROVED_PRODUCTION_RECIPE } from "../lib/match-config";
import { createResonanceBrief } from "../lib/resonance-brief";
import { submitResonanceFeedback } from "../lib/resonance-feedback";
import {
  createMemoryAlternateSession,
} from "../lib/session-store-memory";
import { createSession, getSession, updateSession } from "../lib/session";
import { composeCanonicalStoryArtifact } from "../lib/story-artifact";
import type { StoryArtifact } from "../lib/story-artifact-types";
import { getOwnedMemoryStoryArtifactSync } from "../lib/story-artifact-store-memory";
import { createStoryRequestContext } from "../lib/story-request-context";
import { buildDraftStorySpec } from "../lib/story-spec";
import { loadEligibleStoryCatalog, prepareStory } from "../lib/story-generation";
import {
  createProductEventRecord,
} from "../lib/telemetry-schema";
import {
  createTelemetryEventId,
  createTelemetryFlowId,
  deleteProductEventsForFlow,
} from "../lib/telemetry";
import { artifactCreatedEvent } from "../lib/telemetry-producers";
import {
  appendMemoryProductEvent,
  listMemoryProductEventOutbox,
  listMemoryProductEvents,
} from "../lib/telemetry-store-memory";
import type {
  ProductEventRecord,
  TelemetryFlowId,
} from "../lib/telemetry-types";
import type { FigureStageRow, MatchRecipe, Session } from "../lib/types";

process.env.PERSISTENCE = "memory";
process.env.LLM_PROVIDER = "stub";
process.env.RETRIEVAL_MODE = "keyword";
process.env.TELEMETRY_FLOW_BINDING_ENABLED = "true";

const PRIVATE_CANARY =
  "My private silver lodestar feels discarded after years of trying.";
const recipe: MatchRecipe = {
  recipeId: APPROVED_PRODUCTION_RECIPE.recipeId,
  matchConfigVersion: APPROVED_PRODUCTION_RECIPE.matchConfigVersion,
  crisisRegexVersion: "alternate-resolution-telemetry-test",
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
  stage: FigureStageRow;
  token: string;
};

async function main(): Promise<void> {
  checkStaticContracts();
  await checkReadyAtomicArtifactAndResolution();
  await checkReadyConflictRollsBackArtifact();
  await checkUnavailableReplay();
  await checkFailedAndExhaustedFirstWrite();
  await checkAbandonedLeaseExhaustion();
  await checkPostClaimExpiry();
  await checkNullRevokedAndDisabledFlows();
  await checkAlternateMatchIntegration();
  checkPrivacyShape();

  console.log("Onward alternate-resolution telemetry validator");
  console.log("================================================");
  console.log("PASS ready commits alternate artifact and terminal telemetry atomically");
  console.log("PASS artifact semantic collision rolls back the new alternate session");
  console.log("PASS unavailable replay restores one terminal event and outbox pointer");
  console.log("PASS final operational failure is first-write-wins over later exhaustion");
  console.log("PASS abandoned final lease resolves as exhausted on the next claim");
  console.log("PASS post-claim retention expiry commits the expired terminal outcome");
  console.log("PASS null, revoked, and incident-disabled flows fabricate no terminal row");
  console.log("PASS alternate eligible/no-eligible match calibration is root-linked");
  console.log("PASS migration 0016 derives all terminal/artifact dimensions privately");
}

async function checkReadyAtomicArtifactAndResolution(): Promise<void> {
  const fixture = await makeFixture();
  const claim = await requireClaim(fixture);
  const artifact = makeAlternateArtifact(fixture.stage);
  const sessionId = await completeAlternateStoryReady({
    userId: fixture.session.userId,
    claim,
    sourceArtifactId: fixture.artifact.artifactId,
    artifact,
  });
  const alternate = await getSession(sessionId);
  assert(
    alternate?.alternateOfSessionId === fixture.session.sessionId,
    "ready completion did not persist one alternate session",
  );
  const artifactEvent = singleArtifactEvent(requireFlow(fixture));
  const resolution = singleResolutionEvent(requireFlow(fixture));
  assert(
    artifactEvent.storyRole === "alternate" && resolution.outcome === "ready",
    "ready telemetry dimensions were not derived from the persisted alternate",
  );
  assert(pointer(artifactEvent.eventId) && pointer(resolution.eventId), "ready outbox is incomplete");
}

async function checkReadyConflictRollsBackArtifact(): Promise<void> {
  const fixture = await makeFixture();
  const claim = await requireClaim(fixture);
  const flowId = requireFlow(fixture);
  const artifact = makeAlternateArtifact(fixture.stage);
  assert(
    appendMemoryProductEvent(
      createProductEventRecord({
        eventId: createTelemetryEventId(),
        flowId,
        event: artifactCreatedEvent(artifact, "alternate"),
      }),
    ) === "created",
    "artifact semantic-collision fixture could not be installed",
  );
  const telemetry = prepareAlternateReadyTelemetry(flowId, artifact);
  assert(telemetry, "ready telemetry fixture could not be prepared");
  const beforeChildren = alternateChildren(fixture.session.sessionId).length;
  await expectRejected(
    () =>
      Promise.resolve(
        completeMemoryAlternateStoryReady({
          userId: fixture.session.userId,
          sourceSessionId: fixture.session.sessionId,
          sourceArtifactId: fixture.artifact.artifactId,
          leaseId: claim.leaseId,
          artifact,
          telemetry,
          createSession: () =>
            createMemoryAlternateSession({
              userId: fixture.session.userId,
              sourceSessionId: fixture.session.sessionId,
              sourceArtifactId: fixture.artifact.artifactId,
              artifact,
            }),
        }),
      ),
    "artifact telemetry collision did not reject completion",
  );
  assert(
    alternateChildren(fixture.session.sessionId).length === beforeChildren &&
      getOwnedMemoryStoryArtifactSync(
        artifact.artifactId,
        fixture.session.userId,
        [...(globalThis.__onwardSessions?.values() ?? [])].find(
          (session) => session.storyArtifactId === artifact.artifactId,
        )?.sessionId ?? "missing",
      ) === null &&
      storedFlow(fixture).status === "preparing",
    "failed ready capture left an orphan session, artifact, or terminal flow",
  );
}

async function checkUnavailableReplay(): Promise<void> {
  const fixture = await makeFixture();
  const claim = await requireClaim(fixture);
  assert(
    await completeAlternateStoryUnavailable(fixture.session.userId, claim),
    "unavailable outcome did not commit",
  );
  const event = singleResolutionEvent(requireFlow(fixture));
  assert(event.outcome === "unavailable", "unavailable outcome was not captured");
  globalThis.__onwardProductEventOutbox?.delete(event.eventId);
  assert(
    await completeAlternateStoryUnavailable(fixture.session.userId, claim),
    "unavailable exact replay was not idempotent",
  );
  assert(
    resolutionEvents(fixture.flowId).length === 1 && pointer(event.eventId),
    "unavailable replay did not restore one pointer",
  );
}

async function checkFailedAndExhaustedFirstWrite(): Promise<void> {
  const fixture = await makeFixture();
  const first = await requireClaim(fixture);
  await releaseAlternateStoryFlow(fixture.session.userId, first);
  assert(
    resolutionEvents(fixture.flowId).length === 0,
    "first retryable failure terminalized the flow",
  );
  storedFlowMutable(fixture).nextAttemptAt = Date.now() - 1;
  const second = await requireClaim(fixture);
  await releaseAlternateStoryFlow(fixture.session.userId, second);
  const failed = singleResolutionEvent(requireFlow(fixture));
  assert(failed.outcome === "failed", "final released failure was not terminal");
  globalThis.__onwardProductEventOutbox?.delete(failed.eventId);
  const exhausted = await claimAlternateStoryFlow({
    userId: fixture.session.userId,
    session: fixture.session,
    artifact: fixture.artifact,
    token: fixture.token,
  });
  assert(exhausted.status === "exhausted", "used retry budget was not exhausted");
  const replayed = singleResolutionEvent(requireFlow(fixture));
  assert(
    replayed.outcome === "failed" && pointer(replayed.eventId),
    "later exhaustion rewrote the first terminal outcome or lost its pointer",
  );
}

async function checkAbandonedLeaseExhaustion(): Promise<void> {
  const fixture = await makeFixture();
  const first = await requireClaim(fixture);
  await releaseAlternateStoryFlow(fixture.session.userId, first);
  storedFlowMutable(fixture).nextAttemptAt = Date.now() - 1;
  await requireClaim(fixture);
  storedFlowMutable(fixture).leaseExpiresAt = Date.now() - 1;
  const exhausted = await claimAlternateStoryFlow({
    userId: fixture.session.userId,
    session: fixture.session,
    artifact: fixture.artifact,
    token: fixture.token,
  });
  assert(exhausted.status === "exhausted", "abandoned final lease did not exhaust");
  assert(
    singleResolutionEvent(requireFlow(fixture)).outcome === "exhausted",
    "abandoned final lease did not capture exhausted",
  );
}

async function checkPostClaimExpiry(): Promise<void> {
  const fixture = await makeFixture();
  const claim = await requireClaim(fixture);
  storedFlowMutable(fixture).contextExpiresAt = Date.now() - 1;
  assert(
    await completeAlternateStoryExpired(fixture.session.userId, claim),
    "post-claim expiry did not commit",
  );
  assert(
    singleResolutionEvent(requireFlow(fixture)).outcome === "expired" &&
      storedFlow(fixture).status === "available" &&
      storedFlow(fixture).leaseId === null,
    "expired resolution did not clear the lease or preserve its outcome",
  );
}

async function checkNullRevokedAndDisabledFlows(): Promise<void> {
  const noFlow = await makeFixture(null);
  const noFlowClaim = await requireClaim(noFlow);
  assert(
    await completeAlternateStoryUnavailable(noFlow.session.userId, noFlowClaim),
    "null-flow terminal state failed",
  );
  assert(resolutionEvents(null).length === 0, "null flow fabricated resolution telemetry");

  const revoked = await makeFixture();
  const revokedClaim = await requireClaim(revoked);
  const revokedFlowId = requireFlow(revoked);
  assert(
    (await deleteProductEventsForFlow(revokedFlowId, revoked.session.userId)) === 1,
    "terminal fixture flow was not revoked",
  );
  assert(
    await completeAlternateStoryUnavailable(revoked.session.userId, revokedClaim),
    "revoked-flow terminal state failed",
  );
  assert(
    resolutionEvents(revokedFlowId).length === 0,
    "revoked flow fabricated resolution telemetry",
  );

  const disabled = await makeFixture();
  const disabledClaim = await requireClaim(disabled);
  const disabledFlowId = requireFlow(disabled);
  process.env.TELEMETRY_FLOW_BINDING_ENABLED = "false";
  try {
    assert(
      await completeAlternateStoryUnavailable(
        disabled.session.userId,
        disabledClaim,
      ),
      "incident-disabled terminal state failed",
    );
  } finally {
    process.env.TELEMETRY_FLOW_BINDING_ENABLED = "true";
  }
  assert(
    resolutionEvents(disabledFlowId).length === 0,
    "incident-disabled completion fabricated telemetry",
  );
  assert(
    await completeAlternateStoryUnavailable(disabled.session.userId, disabledClaim),
    "post-incident terminal replay failed",
  );
  assert(
    singleResolutionEvent(disabledFlowId).outcome === "unavailable",
    "post-incident replay did not backfill the terminal event",
  );
}

async function checkAlternateMatchIntegration(): Promise<void> {
  const ready = await makeFixture();
  const result = await createAlternateStory(
    { sessionId: ready.session.sessionId, token: ready.token },
    ready.session.userId,
    {
      loadCatalog: loadEligibleStoryCatalog,
      match: async (input) => {
        const key = [...(input.eligibleStageKeys ?? [])][0];
        assert(key, "ready match fixture has no eligible stage");
        const [figureKey, stageId] = key.split("\u0000");
        return {
          figureKey,
          stageId,
          framing: "partial",
          confidence: "high",
          chosenBy: "rerank",
          ageFallback: false,
          retrievalMode: "keyword",
        };
      },
      prepare: prepareStory,
    },
  );
  assert(result.status === "ready", "eligible alternate integration did not resolve ready");
  const readyMatch = singleAlternateMatchEvent(requireFlow(ready));
  assert(
    readyMatch.disposition === "adjacent" &&
      readyMatch.confidenceBucket === "high" &&
      readyMatch.storyRole === "alternate",
    "eligible alternate match calibration is invalid",
  );

  const empty = await makeFixture();
  const unavailable = await createAlternateStory(
    { sessionId: empty.session.sessionId, token: empty.token },
    empty.session.userId,
    { loadCatalog: async () => ({ status: "no_eligible" }) },
  );
  assert(unavailable.status === "unavailable", "no-eligible alternate did not stop honestly");
  const emptyMatch = singleAlternateMatchEvent(requireFlow(empty));
  assert(
    emptyMatch.disposition === "no_close_match" &&
      emptyMatch.boundaryOutcome === "no_eligible" &&
      emptyMatch.matchPath === "not_run",
    "no-eligible alternate match calibration is invalid",
  );
}

function checkPrivacyShape(): void {
  const events = listMemoryProductEvents().filter(
    (event) =>
      event.event === "alternate_resolved" ||
      (event.event === "artifact_created" && event.storyRole === "alternate") ||
      (event.event === "match_completed" && event.storyRole === "alternate"),
  );
  const serialized = JSON.stringify(events);
  assert(!serialized.includes(PRIVATE_CANARY), "alternate telemetry copied disclosure text");
  for (const key of [
    "figureKey",
    "stageId",
    "artifactId",
    "sessionId",
    "reason",
  ]) {
    assert(!serialized.includes(key), `alternate telemetry exposed forbidden ${key}`);
  }
}

function checkStaticContracts(): void {
  const migration = source("../supabase/migrations/0016_alternate_resolution_telemetry.sql");
  const store = source("../lib/alternate-story-store-supabase.ts");
  const memory = source("../lib/alternate-story-store-memory.ts");
  const flow = source("../lib/alternate-story-flow.ts");
  const orchestration = source("../lib/alternate-story.ts");
  for (const fn of [
    "capture_alternate_resolution_v1",
    "claim_alternate_story_flow_v3",
    "release_alternate_story_claim_v2",
    "complete_alternate_story_unavailable_v2",
    "complete_alternate_story_expired_v1",
    "complete_alternate_story_session_v2",
  ]) {
    assert(migration.includes(fn), `migration 0016 is missing ${fn}`);
  }
  assert(
    migration.includes("v_existing.alternate_outcome") &&
      /capture_alternate_resolution_v1[\s\S]*?pg_advisory_xact_lock\(hashtextextended\(p_event_id, 0\)\)[\s\S]*?select \* into v_existing/m.test(
        migration,
      ) &&
      migration.includes("p_story_role => 'alternate'") &&
      migration.includes("v_result_artifact.composition_mode") &&
      migration.includes("root_session_id = p_source_session_id") &&
      migration.includes("perform pg_advisory_xact_lock") &&
      !migration.includes("p_reason") &&
      !migration.includes("p_token_hash =>"),
    "migration 0016 lacks persisted derivation, lock order, or privacy invariants",
  );
  assert(
    store.includes('"claim_alternate_story_flow_v3"') &&
      store.includes('"complete_alternate_story_session_v2"') &&
      store.includes('"complete_alternate_story_unavailable_v2"') &&
      store.includes('"complete_alternate_story_expired_v1"') &&
      store.includes('"release_alternate_story_claim_v2"') &&
      !/complete_alternate_story_session_v2[\s\S]*?catch\s*\{/m.test(store),
    "Supabase terminal store can ambiguously fall back after a v2/v3 call",
  );
  assert(
    memory.includes("reconcilePreparedMemoryAlternateResolvedEventFirstWriteWins") &&
      memory.includes("deleteMemoryStoryArtifact") &&
      flow.includes("prepareAlternateReadyTelemetry") &&
      orchestration.includes("noEligibleMatchCompletedEvent") &&
      orchestration.includes('storyRole: "alternate"'),
    "memory/orchestration alternate producers are incomplete",
  );
}

async function makeFixture(
  flowId: TelemetryFlowId | null = createTelemetryFlowId(),
): Promise<Fixture> {
  const stage = FIGURE_STAGES[0];
  const artifact = makeArtifact(stage, recipe);
  const sessionId = await createSession({
    userId: LOCAL_DEV_USER_ID,
    telemetryFlowId: flowId,
    figureKey: stage.figureKey,
    stageId: stage.stageId,
    framing: "partial",
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
  assert(session, "alternate terminal fixture session is unavailable");
  await submitResonanceFeedback({
    userId: session.userId,
    session,
    artifact,
    feedback: {
      sessionId,
      verdict: "not_close",
      reason: "wrong_situation",
    },
  });
  const offer = await issueAlternateStoryCapability({
    userId: session.userId,
    session,
    artifact,
  });
  assert(offer.status === "available", "alternate terminal capability was not issued");
  return { flowId, session, artifact, stage, token: offer.token };
}

async function requireClaim(fixture: Fixture): Promise<ClaimedAlternateStoryFlow> {
  const result = await claimAlternateStoryFlow({
    userId: fixture.session.userId,
    session: fixture.session,
    artifact: fixture.artifact,
    token: fixture.token,
  });
  assert(result.status === "claimed", `alternate claim returned ${result.status}`);
  return result;
}

function makeAlternateArtifact(source: FigureStageRow): StoryArtifact {
  const stage = FIGURE_STAGES.find(
    (candidate) =>
      candidate.figureKey !== source.figureKey || candidate.stageId !== source.stageId,
  );
  assert(stage, "alternate artifact fixture has no second stage");
  return makeArtifact(stage, {
    ...recipe,
    alternateStoryPolicyVersion: ALTERNATE_STORY_POLICY_VERSION,
  });
}

function makeArtifact(stage: FigureStageRow, matchRecipe: MatchRecipe): StoryArtifact {
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

function storedFlow(fixture: Fixture): StoredAlternateStoryFlow {
  const flow = globalThis.__onwardAlternateStoryFlows?.get(
    fixture.session.sessionId,
  );
  assert(flow, "stored alternate terminal flow is unavailable");
  return structuredClone(flow);
}

function storedFlowMutable(fixture: Fixture): StoredAlternateStoryFlow {
  const flow = globalThis.__onwardAlternateStoryFlows?.get(
    fixture.session.sessionId,
  );
  assert(flow, "mutable alternate terminal flow is unavailable");
  return flow;
}

function alternateChildren(sourceSessionId: string): Session[] {
  return [...(globalThis.__onwardSessions?.values() ?? [])].filter(
    (session) => session.alternateOfSessionId === sourceSessionId,
  );
}

function resolutionEvents(flowId: TelemetryFlowId | null) {
  return listMemoryProductEvents().filter(
    (event): event is Readonly<
      Extract<ProductEventRecord, { event: "alternate_resolved" }>
    > => event.event === "alternate_resolved" && event.flowId === flowId,
  );
}

function singleResolutionEvent(flowId: TelemetryFlowId) {
  const events = resolutionEvents(flowId);
  assert(events.length === 1, "alternate resolution event was not singleton");
  return events[0];
}

function singleArtifactEvent(flowId: TelemetryFlowId) {
  const events = listMemoryProductEvents().filter(
    (event): event is Readonly<
      Extract<ProductEventRecord, { event: "artifact_created" }>
    > =>
      event.event === "artifact_created" &&
      event.flowId === flowId &&
      event.storyRole === "alternate",
  );
  assert(events.length === 1, "alternate artifact event was not singleton");
  return events[0];
}

function singleAlternateMatchEvent(flowId: TelemetryFlowId) {
  const events = listMemoryProductEvents().filter(
    (event): event is Readonly<
      Extract<ProductEventRecord, { event: "match_completed" }>
    > =>
      event.event === "match_completed" &&
      event.flowId === flowId &&
      event.storyRole === "alternate",
  );
  assert(events.length === 1, "alternate match event was not singleton");
  return events[0];
}

function pointer(eventId: string) {
  return listMemoryProductEventOutbox().find(
    (candidate) => candidate.eventId === eventId,
  );
}

function requireFlow(fixture: Fixture): TelemetryFlowId {
  assert(fixture.flowId, "active alternate terminal fixture has no flow");
  return fixture.flowId;
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
