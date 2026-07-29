import "./_smoke-bootstrap";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  _listAlternateStoryFlows,
  claimAlternateStoryFlow,
  issueAlternateStoryCapability,
} from "../lib/alternate-story-flow";
import {
  claimMemoryAlternateStoryFlow,
  type StoredAlternateStoryFlow,
} from "../lib/alternate-story-store-memory";
import { prepareAlternateRequestedTelemetry } from "../lib/alternate-story-telemetry";
import { LOCAL_DEV_USER_ID } from "../lib/auth";
import { FIGURE_STAGES } from "../lib/figures-data";
import { STORY_PROMPT_VERSION_V1 } from "../lib/llm-recipe-constants";
import { APPROVED_PRODUCTION_RECIPE } from "../lib/match-config";
import {
  DEFAULT_PREFACE_LINES,
  NEUTRAL_EYEBROW,
} from "../lib/opening-copy";
import { createResonanceBrief } from "../lib/resonance-brief";
import { submitResonanceFeedback } from "../lib/resonance-feedback";
import { createSession, getSession } from "../lib/session";
import { composeCanonicalStoryArtifact } from "../lib/story-artifact";
import type { StoryArtifact } from "../lib/story-artifact-types";
import { createStoryRequestContext } from "../lib/story-request-context";
import { buildDraftStorySpec } from "../lib/story-spec";
import {
  createProductEventRecord,
} from "../lib/telemetry-schema";
import {
  createTelemetryEventId,
  createTelemetryFlowId,
  deleteProductEventsForFlow,
  prepareProductEventCapture,
} from "../lib/telemetry";
import { alternateRequestedEvent } from "../lib/telemetry-producers";
import {
  appendMemoryProductEvent,
  listMemoryProductEventOutbox,
  listMemoryProductEvents,
} from "../lib/telemetry-store-memory";
import type {
  ProductEventRecord,
  TelemetryFlowId,
} from "../lib/telemetry-types";
import type { MatchRecipe, Session } from "../lib/types";
import { completeMemoryStorySessionFixture } from "./_story-session-fixture";

process.env.PERSISTENCE = "memory";
process.env.LLM_PROVIDER = "stub";
process.env.RETRIEVAL_MODE = "keyword";
process.env.TELEMETRY_FLOW_BINDING_ENABLED = "true";

const PRIVATE_CANARY =
  "My private violet sextant feels useless after another rejection.";
const recipe: MatchRecipe = {
  recipeId: APPROVED_PRODUCTION_RECIPE.recipeId,
  matchConfigVersion: APPROVED_PRODUCTION_RECIPE.matchConfigVersion,
  crisisRegexVersion: "alternate-request-telemetry-test",
  llmProvider: "stub",
  rerankModelId: "stub",
  proseModelId: "stub",
  embeddingModelId: "stub",
  retrievalMode: "keyword",
  storyPromptVersion: STORY_PROMPT_VERSION_V1,
};

type Fixture = {
  flowId: TelemetryFlowId | null;
  session: Session;
  artifact: StoryArtifact;
  token: string;
};

async function main(): Promise<void> {
  checkStaticContracts();
  await checkIssueAndHydrationAreSilent();
  await checkClaimCaptureAndReplay();
  await checkCaptureFailureRollsBackClaim();
  await checkConcurrentClaimsConverge();
  await checkNullRevokedAndDisabledFlows();
  await checkExpiredUnclaimedCapabilityIsSilent();
  await checkPrivacyShape();

  console.log("Onward alternate-request telemetry validator");
  console.log("=============================================");
  console.log("PASS capability issue and hydration remain measurement-free");
  console.log("PASS first durable claim captures one retry-stable request event");
  console.log("PASS replay restores missing outbox work without requeueing delivery");
  console.log("PASS capture and semantic conflicts roll back a new claim");
  console.log("PASS concurrent claims converge on one lease transition and event");
  console.log("PASS null, revoked, and incident-disabled flows fabricate no event");
  console.log("PASS never-claimed expiry is not counted as recovery demand");
  console.log("PASS migration 0015 preserves the closed privacy-safe event shape");
}

async function checkIssueAndHydrationAreSilent(): Promise<void> {
  const fixture = await makeFixture();
  assert(requestEvents(fixture.flowId).length === 0, "capability issue emitted demand");
  const replay = await issueAlternateStoryCapability({
    userId: fixture.session.userId,
    session: fixture.session,
    artifact: fixture.artifact,
  });
  assert(replay.status === "available", "capability hydration changed state");
  assert(
    requestEvents(fixture.flowId).length === 0,
    "capability hydration emitted alternate_requested",
  );
}

async function checkClaimCaptureAndReplay(): Promise<void> {
  const fixture = await makeFixture();
  const first = await claim(fixture);
  assert(first.status === "claimed", "first valid claim was not durable");
  const event = singleRequestEvent(requireFlow(fixture));
  assert(pointer(event.eventId), "claimed event has no outbox pointer");

  globalThis.__onwardProductEventOutbox?.delete(event.eventId);
  const replay = await claim(fixture);
  assert(replay.status === "preparing", "live-lease replay changed claim state");
  assert(
    requestEvents(fixture.flowId).length === 1 && pointer(event.eventId),
    "claim replay did not restore exactly one event and pointer",
  );

  const storedPointer = globalThis.__onwardProductEventOutbox?.get(event.eventId);
  assert(storedPointer, "request pointer disappeared before delivery replay");
  storedPointer.status = "delivered";
  storedPointer.leaseId = null;
  storedPointer.leaseExpiresAt = null;
  await claim(fixture);
  assert(
    pointer(event.eventId)?.status === "delivered",
    "duplicate claim requeued a delivered request event",
  );
}

async function checkCaptureFailureRollsBackClaim(): Promise<void> {
  const missing = await makeFixture();
  const missingFlow = storedFlow(missing);
  await expectRejected(
    () =>
      Promise.resolve(
        claimMemoryAlternateStoryFlow({
          ...claimIdentity(missingFlow),
          leaseId: "a".repeat(32),
          leaseExpiresAt: Date.now() + 120_000,
          telemetry: null,
          resolutionTelemetry: null,
        }),
      ),
    "missing active-flow capture did not reject",
  );
  assertUnclaimed(missing, "missing capture mutated the claim");

  const wrongFlow = await makeFixture();
  const wrongStored = storedFlow(wrongFlow);
  const wrongCapture = prepareProductEventCapture({
    flowId: createTelemetryFlowId(),
    event: alternateRequestedEvent(),
  });
  await expectRejected(
    () =>
      Promise.resolve(
        claimMemoryAlternateStoryFlow({
          ...claimIdentity(wrongStored),
          leaseId: "b".repeat(32),
          leaseExpiresAt: Date.now() + 120_000,
          telemetry: wrongCapture,
          resolutionTelemetry: null,
        }),
      ),
    "wrong-flow capture did not reject",
  );
  assertUnclaimed(wrongFlow, "wrong-flow capture mutated the claim");

  const collision = await makeFixture();
  const collisionFlowId = requireFlow(collision);
  assert(
    appendMemoryProductEvent(
      createProductEventRecord({
        eventId: createTelemetryEventId(),
        flowId: collisionFlowId,
        event: alternateRequestedEvent(),
      }),
    ) === "created",
    "semantic collision fixture could not be installed",
  );
  const correctCapture = await prepareAlternateRequestedTelemetry({
    session: collision.session,
    userId: collision.session.userId,
  });
  assert(correctCapture, "active request capture could not be prepared");
  await expectRejected(
    () =>
      Promise.resolve(
        claimMemoryAlternateStoryFlow({
          ...claimIdentity(storedFlow(collision)),
          leaseId: "c".repeat(32),
          leaseExpiresAt: Date.now() + 120_000,
          telemetry: correctCapture,
          resolutionTelemetry: null,
        }),
      ),
    "semantic-key collision did not reject",
  );
  assertUnclaimed(collision, "semantic collision mutated the claim");
}

async function checkConcurrentClaimsConverge(): Promise<void> {
  const fixture = await makeFixture();
  const results = await Promise.all(
    Array.from({ length: 12 }, () => claim(fixture)),
  );
  assert(
    results.filter((result) => result.status === "claimed").length === 1 &&
      results.filter((result) => result.status === "preparing").length === 11,
    "concurrent claims did not converge on one active lease",
  );
  assert(
    requestEvents(fixture.flowId).length === 1,
    "concurrent claims emitted more than one demand event",
  );
}

async function checkNullRevokedAndDisabledFlows(): Promise<void> {
  const noFlow = await makeFixture(null);
  assert((await claim(noFlow)).status === "claimed", "null-flow claim failed");
  assert(requestEvents(null).length === 0, "null flow fabricated a linked event");

  const revoked = await makeFixture();
  const revokedFlowId = requireFlow(revoked);
  assert(
    (await deleteProductEventsForFlow(revokedFlowId, revoked.session.userId)) === 1,
    "request fixture flow was not revoked",
  );
  assert((await claim(revoked)).status === "claimed", "revoked-flow claim failed");
  assert(
    requestEvents(revokedFlowId).length === 0,
    "revoked flow fabricated alternate_requested",
  );

  const disabled = await makeFixture();
  const disabledFlowId = requireFlow(disabled);
  process.env.TELEMETRY_FLOW_BINDING_ENABLED = "false";
  try {
    assert((await claim(disabled)).status === "claimed", "incident-mode claim failed");
  } finally {
    process.env.TELEMETRY_FLOW_BINDING_ENABLED = "true";
  }
  assert(
    requestEvents(disabledFlowId).length === 0,
    "incident-disabled claim fabricated telemetry",
  );
  assert(
    (await claim(disabled)).status === "preparing" &&
      requestEvents(disabledFlowId).length === 1,
    "post-incident exact replay did not backfill the durable request",
  );
}

async function checkExpiredUnclaimedCapabilityIsSilent(): Promise<void> {
  const fixture = await makeFixture();
  const flow = globalThis.__onwardAlternateStoryFlows?.get(
    fixture.session.sessionId,
  );
  assert(flow && flow.attemptCount === 0, "expiry fixture already had a claim");
  flow.expiresAt = Date.now() - 1;
  assert((await claim(fixture)).status === "expired", "expired claim was not closed");
  assert(
    requestEvents(fixture.flowId).length === 0,
    "never-claimed capability expiry was counted as demand",
  );
}

async function checkPrivacyShape(): Promise<void> {
  const fixture = await makeFixture();
  await claim(fixture);
  const event = singleRequestEvent(requireFlow(fixture));
  assert(
    sameKeys(event, [
      "event",
      "eventId",
      "expiresAt",
      "flowId",
      "occurredAt",
      "schemaVersion",
    ]),
    "alternate request event gained an unapproved dimension",
  );
  const serialized = JSON.stringify({
    event,
    pointer: pointer(event.eventId),
  });
  for (const forbidden of [
    PRIVATE_CANARY,
    fixture.session.sessionId,
    fixture.artifact.artifactId,
    fixture.token,
    fixture.session.figureKey,
    fixture.session.stageId,
  ]) {
    assert(!serialized.includes(forbidden), "alternate request telemetry leaked private data");
  }
}

function checkStaticContracts(): void {
  const migration = source("../supabase/migrations/0015_alternate_request_telemetry.sql");
  const store = source("../lib/alternate-story-store-supabase.ts");
  const memory = source("../lib/alternate-story-store-memory.ts");
  const helper = source("../lib/alternate-story-telemetry.ts");
  const requestHelper = helper.slice(
    helper.indexOf("export async function prepareAlternateRequestedTelemetry"),
    helper.indexOf("export function prepareAlternateResolvedTelemetry"),
  );
  assert(
    migration.includes("claim_alternate_story_flow_v2") &&
      migration.includes("public.claim_alternate_story_flow(") &&
      migration.indexOf("public.claim_alternate_story_flow(") <
        migration.indexOf("capture_product_event_v1") &&
      migration.includes("v_alternate_flow.attempt_count = 0") &&
      migration.includes("root_session_id = p_source_session_id") &&
      migration.includes("p_event_name => 'alternate_requested'") &&
      migration.includes("for share") &&
      !migration.includes("p_token_hash =>") &&
      !migration.includes("p_source_artifact_id =>"),
    "migration 0015 lacks claim-first, owner/root, or privacy invariants",
  );
  assert(
    store.includes('telemetryFlowBindingEnabled()') &&
    store.includes('"claim_alternate_story_flow_v3"') &&
      store.includes('"claim_alternate_story_flow"') &&
      !/claim_alternate_story_flow_v3[\s\S]*?catch\s*\{/m.test(store),
    "Supabase claim store can ambiguously retry or bypass the incident switch",
  );
  assert(
    memory.includes("recordPreparedMemoryProductEventsAtomically") &&
      memory.indexOf("captureAlternateClaimTelemetry(input") <
      memory.indexOf('flow.status = "preparing"') &&
      helper.includes("resolveOwnedTelemetryFlowForKnownSession") &&
      !requestHelper.includes("token") &&
      !requestHelper.includes("artifact:"),
    "memory/helper request producer lacks atomic or privacy boundaries",
  );
}

async function makeFixture(
  flowId: TelemetryFlowId | null = createTelemetryFlowId(),
): Promise<Fixture> {
  const stage = FIGURE_STAGES[0];
  const artifact = composeCanonicalStoryArtifact({
    storySpec: buildDraftStorySpec(stage),
    stage,
    matchRecipe: recipe,
    openingCopy: {
      eyebrow: NEUTRAL_EYEBROW,
      prefaceLines: DEFAULT_PREFACE_LINES,
    },
    framing: "partial",
    resonanceBrief: createResonanceBrief(PRIVATE_CANARY),
    allowDraftSpec: true,
  });
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
  await completeMemoryStorySessionFixture({
    sessionId,
    userId: LOCAL_DEV_USER_ID,
    artifact,
  });
  const session = await getSession(sessionId);
  assert(session, "alternate request fixture session is unavailable");
  await submitResonanceFeedback({
    userId: session.userId,
    session,
    artifact,
    feedback: {
      sessionId,
      verdict: "not_close",
      reason: "wrong_feeling",
    },
  });
  const offer = await issueAlternateStoryCapability({
    userId: session.userId,
    session,
    artifact,
  });
  assert(offer.status === "available", "alternate request capability was not issued");
  return { flowId, session, artifact, token: offer.token };
}

function claim(fixture: Fixture) {
  return claimAlternateStoryFlow({
    userId: fixture.session.userId,
    session: fixture.session,
    artifact: fixture.artifact,
    token: fixture.token,
  });
}

function storedFlow(fixture: Fixture): StoredAlternateStoryFlow {
  const flow = _listAlternateStoryFlows().find(
    (candidate) => candidate.sourceSessionId === fixture.session.sessionId,
  );
  assert(flow, "stored alternate request flow is unavailable");
  return flow;
}

function claimIdentity(flow: StoredAlternateStoryFlow) {
  return {
    userId: flow.userId,
    sourceSessionId: flow.sourceSessionId,
    sourceArtifactId: flow.sourceArtifactId,
    tokenHash: flow.tokenHash,
    policyVersion: flow.policyVersion,
  };
}

function assertUnclaimed(fixture: Fixture, message: string): void {
  const flow = storedFlow(fixture);
  assert(
    flow.status === "available" &&
      flow.attemptCount === 0 &&
      flow.leaseId === null,
    message,
  );
}

function requestEvents(flowId: TelemetryFlowId | null) {
  return listMemoryProductEvents().filter(
    (event): event is Readonly<
      Extract<ProductEventRecord, { event: "alternate_requested" }>
    > => event.event === "alternate_requested" && event.flowId === flowId,
  );
}

function singleRequestEvent(flowId: TelemetryFlowId) {
  const events = requestEvents(flowId);
  assert(events.length === 1, "alternate request event was not singleton");
  return events[0];
}

function pointer(eventId: string) {
  return listMemoryProductEventOutbox().find(
    (candidate) => candidate.eventId === eventId,
  );
}

function requireFlow(fixture: Fixture): TelemetryFlowId {
  assert(fixture.flowId, "active alternate request fixture has no flow");
  return fixture.flowId;
}

function sameKeys(value: object, keys: string[]): boolean {
  return JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...keys].sort());
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
