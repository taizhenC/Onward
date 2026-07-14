import "./_smoke-bootstrap";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { POST as matchPost } from "../app/api/match/route";
import { handleIntake, type IntakeContext } from "../lib/intake";
import { APPROVED_PRODUCTION_RECIPE } from "../lib/match-config";
import {
  consumeMatchRecoveryToken,
  issueMatchRecoveryToken,
} from "../lib/match-recovery-flow";
import { getOwnedSession, _sessionCount } from "../lib/session";
import {
  bindMemoryTelemetryFlow,
  claimMemoryTelemetryFlowOwner,
  deleteMemoryTelemetryFlowBindingForRoot,
  getOwnedMemoryTelemetryFlowBindingByRoot,
  registerMemoryTelemetryFlow,
} from "../lib/telemetry-flow-binding-memory";
import { resolveOwnedTelemetryFlowForSession } from "../lib/telemetry-flow-binding";
import { TELEMETRY_FLOW_HEADER } from "../lib/telemetry-flow-header";
import { getMemoryTelemetryFlowByFlow } from "../lib/telemetry-flow-state-memory";
import {
  deriveProductEventId,
  issueTelemetryFlowId,
  parseTelemetryFlowId,
  parseTelemetryFlowIdForRetirement,
  telemetryFlowExpiresAt,
} from "../lib/telemetry-id";
import { createProductEventRecord, parseProductEvent } from "../lib/telemetry-schema";
import {
  ackMemoryProductEventOutbox,
  appendMemoryProductEvent,
  claimMemoryProductEventOutbox,
  listMemoryProductEventOutbox,
  listMemoryProductEvents,
  nackMemoryProductEventOutbox,
} from "../lib/telemetry-store-memory";
import {
  createDeletionCorrelationId,
  createTelemetryEventId,
  createTelemetryFlowId,
  createTelemetryOccurrenceId,
  createTelemetryOutboxLeaseId,
  deleteProductEventsForFlow,
  recordProductEvent,
} from "../lib/telemetry";
import type {
  ProductEvent,
  TelemetryFlowId,
  TelemetryOccurrenceId,
} from "../lib/telemetry-types";

process.env.PERSISTENCE = "memory";
process.env.LLM_PROVIDER = "stub";
process.env.EMBEDDING_PROVIDER = "stub";
process.env.RETRIEVAL_MODE = "keyword";
process.env.HYBRID_STORY_COMPOSER_ENABLED = "true";

const recipeId = APPROVED_PRODUCTION_RECIPE.recipeId;

async function main(): Promise<void> {
  checkSignedFlowLifetime();
  checkSemanticUnitIds();
  checkMemoryOutboxLifecycle();
  await checkFlowOwnershipAndRouteBoundary();
  checkMigrationAndRuntimeBoundary();

  console.log("Telemetry lifecycle OK: signed root ownership, semantic idempotency, typed outbox leases, privacy cascades, and crisis-first routing");
}

function checkSignedFlowLifetime(): void {
  const issuedAt = new Date("2026-07-13T12:00:00.000Z");
  const flowId = issueTelemetryFlowId(issuedAt);
  assert.equal(parseTelemetryFlowId(flowId, issuedAt), flowId);
  assert.equal(
    telemetryFlowExpiresAt(flowId).toISOString(),
    "2026-08-12T12:00:00.000Z",
  );
  assert.equal(
    parseTelemetryFlowId(
      issueTelemetryFlowId(new Date(issuedAt.getTime() + 5 * 60_000)),
      issuedAt,
    ).startsWith("tfl_"),
    true,
  );
  assert.throws(
    () =>
      parseTelemetryFlowId(
        issueTelemetryFlowId(new Date(issuedAt.getTime() + 5 * 60_000 + 1_000)),
        issuedAt,
      ),
    /future/,
  );
  assert.equal(
    parseTelemetryFlowId(
      flowId,
      new Date(issuedAt.getTime() + 30 * 86_400_000 - 1_000),
    ),
    flowId,
  );
  assert.throws(
    () =>
      parseTelemetryFlowId(
        flowId,
        new Date(issuedAt.getTime() + 30 * 86_400_000),
      ),
    /expired/,
  );
  assert.equal(parseTelemetryFlowIdForRetirement(flowId), flowId);
  const alreadyExpired = issueTelemetryFlowId(
    new Date(Date.now() - 31 * 86_400_000),
  );
  assert.throws(
    () => registerMemoryTelemetryFlow(alreadyExpired),
    /expired/,
    "an expired capability must not reset its registry lifetime",
  );
  const forged = `${flowId.slice(0, -1)}${flowId.endsWith("0") ? "1" : "0"}`;
  assert.throws(() => parseTelemetryFlowIdForRetirement(forged), /signature/);
}

function checkSemanticUnitIds(): void {
  const flowId = createTelemetryFlowId();
  const id = (event: ProductEvent, occurrenceId?: TelemetryOccurrenceId) =>
    deriveProductEventId(parseProductEvent(event), eventFlow(event, flowId), occurrenceId);

  assert.equal(
    id({ event: "intake_started", viewportBucket: "small" }),
    id({ event: "intake_started", viewportBucket: "large" }),
    "viewport must be first-write-wins for one intake-start unit",
  );
  assert.equal(
    id({ event: "first_content_shown", storyRole: "initial", latencyBucket: "lt250ms" }),
    id({ event: "first_content_shown", storyRole: "initial", latencyBucket: "gt15s" }),
    "latency must not mint a second first-content unit",
  );
  assert.notEqual(
    id({ event: "first_content_shown", storyRole: "initial", latencyBucket: "lt250ms" }),
    id({ event: "first_content_shown", storyRole: "alternate", latencyBucket: "lt250ms" }),
  );
  assert.equal(
    id({ event: "passage_presented", storyRole: "initial", passageOrdinal: 3, latencyBucket: "lt250ms" }),
    id({ event: "passage_presented", storyRole: "initial", passageOrdinal: 3, latencyBucket: "8to15s" }),
  );
  assert.notEqual(
    id({ event: "passage_presented", storyRole: "initial", passageOrdinal: 3, latencyBucket: "lt250ms" }),
    id({ event: "passage_presented", storyRole: "initial", passageOrdinal: 4, latencyBucket: "lt250ms" }),
  );
  assert.equal(
    id({ event: "feedback_submitted", storyRole: "initial", verdict: "felt_close" }),
    id({ event: "feedback_submitted", storyRole: "initial", verdict: "not_close" }),
    "a contradictory feedback retry must conflict with the durable first verdict",
  );
  assert.equal(
    id({
      event: "artifact_created",
      recipeId,
      storyRole: "initial",
      compositionMode: "hybrid",
      fallbackReason: "none",
      attemptBucket: "first",
    }),
    id({
      event: "artifact_created",
      recipeId,
      storyRole: "initial",
      compositionMode: "canonical_fallback",
      fallbackReason: "provider_timeout",
      attemptBucket: "exhausted",
    }),
  );
  assert.equal(
    id(closeMatch("rerank", "passed")),
    id(closeMatch("keyword_fallback", "not_set")),
    "calibration dimensions must not split one match disposition",
  );
  assert.notEqual(
    id(closeMatch("rerank", "passed")),
    id({
      event: "match_completed",
      recipeId,
      storyRole: "initial",
      disposition: "clarification_required",
      confidenceBucket: "medium",
      matchPath: "rerank",
      ageFallback: false,
      boundaryOutcome: "passed",
    }),
    "a clarification transition and accepted match are separate units",
  );
  assert.notEqual(
    id({ event: "saved_story_reopened", storyRole: "initial", ageBucket: "lt7d" }),
    id({ event: "saved_story_reopened", storyRole: "initial", ageBucket: "7to30d" }),
  );

  const occurrence = createTelemetryOccurrenceId();
  assert.equal(
    id({ event: "rate_limited", operation: "intake", limitScope: "ip" }, occurrence),
    id({ event: "rate_limited", operation: "feedback", limitScope: "user" }, occurrence),
    "one outbox occurrence must reconcile to one first-write-wins event ID",
  );
  assert.equal(
    id({ event: "rate_limited", operation: "intake", limitScope: "ip" }, occurrence),
    id({ event: "crisis_intercepted" }, occurrence),
    "one occurrence capability must not be reusable across event kinds",
  );
  assert.notEqual(
    id({ event: "rate_limited", operation: "intake", limitScope: "ip" }, occurrence),
    id(
      { event: "rate_limited", operation: "intake", limitScope: "ip" },
      createTelemetryOccurrenceId(),
    ),
  );

  const deletionId = createDeletionCorrelationId();
  assert.equal(
    id({ event: "deletion_completed", deletionId, scope: "story", latencyBucket: "lt250ms" }),
    id({ event: "deletion_completed", deletionId, scope: "account", latencyBucket: "gt15s" }),
  );
}

function checkMemoryOutboxLifecycle(): void {
  const flowId = createTelemetryFlowId();
  assert.equal(registerMemoryTelemetryFlow(flowId), "created");
  const now = new Date();
  const event: ProductEvent = { event: "intake_started", viewportBucket: "small" };
  const eventId = deriveProductEventId(event, flowId);
  const record = createProductEventRecord({ event, eventId, flowId, now });

  assert.equal(appendMemoryProductEvent(record), "created");
  assert.equal(
    appendMemoryProductEvent(
      createProductEventRecord({
        event,
        eventId: createTelemetryEventId(),
        flowId,
        now,
      }),
    ),
    "conflict",
    "memory must enforce the same semantic unique unit as Postgres",
  );
  assert.deepEqual(
    listMemoryProductEventOutbox().map(({ status, attemptCount }) => ({ status, attemptCount })),
    [{ status: "pending", attemptCount: 0 }],
  );

  const firstLease = createTelemetryOutboxLeaseId();
  const claimed = claimMemoryProductEventOutbox({
    leaseId: firstLease,
    limit: 10,
    now: new Date(now.getTime() + 1),
  });
  assert.equal(claimed.length, 1);
  assert.equal(claimed[0].occurredAt, record.occurredAt);
  assert.equal(claimed[0].expiresAt, record.expiresAt);
  assert(Object.isFrozen(claimed[0]));
  assert.equal(
    claimMemoryProductEventOutbox({
      leaseId: createTelemetryOutboxLeaseId(),
      limit: 10,
      now: new Date(now.getTime() + 30_000),
    }).length,
    0,
    "an active lease must not be double-claimed",
  );
  assert.equal(
    ackMemoryProductEventOutbox({
      eventId,
      leaseId: createTelemetryOutboxLeaseId(),
      now: new Date(now.getTime() + 1_000),
    }),
    "stale",
  );
  assert.equal(
    nackMemoryProductEventOutbox({
      eventId,
      leaseId: firstLease,
      errorClass: "network",
      now: new Date(now.getTime() + 1_000),
    }),
    "released",
  );
  assert.equal(
    claimMemoryProductEventOutbox({
      leaseId: createTelemetryOutboxLeaseId(),
      limit: 10,
      now: new Date(now.getTime() + 5_999),
    }).length,
    0,
    "the first retry must honor its five-second backoff",
  );
  const secondLease = createTelemetryOutboxLeaseId();
  const retried = claimMemoryProductEventOutbox({
    leaseId: secondLease,
    limit: 10,
    now: new Date(now.getTime() + 6_000),
  });
  assert.equal(retried[0]?.attemptCount, 2);
  assert.equal(
    ackMemoryProductEventOutbox({
      eventId,
      leaseId: secondLease,
      now: new Date(now.getTime() + 6_001),
    }),
    "acknowledged",
  );
  assert.equal(
    ackMemoryProductEventOutbox({
      eventId,
      leaseId: secondLease,
      now: new Date(now.getTime() + 6_002),
    }),
    "duplicate",
  );
  assert.equal(appendMemoryProductEvent(record), "duplicate");
  assert.equal(listMemoryProductEventOutbox()[0]?.status, "delivered");

  const contradictory: ProductEvent = {
    event: "intake_started",
    viewportBucket: "large",
  };
  assert.equal(
    appendMemoryProductEvent(
      createProductEventRecord({
        event: contradictory,
        eventId: deriveProductEventId(contradictory, flowId),
        flowId,
        now,
      }),
    ),
    "conflict",
  );

  const expiryFlow = createTelemetryFlowId();
  assert.equal(registerMemoryTelemetryFlow(expiryFlow), "created");
  const sourceEvent: ProductEvent = { event: "source_opened", storyRole: "initial" };
  const sourceId = deriveProductEventId(sourceEvent, expiryFlow);
  assert.equal(
    appendMemoryProductEvent(
      createProductEventRecord({ event: sourceEvent, eventId: sourceId, flowId: expiryFlow, now }),
    ),
    "created",
  );
  const oldLease = createTelemetryOutboxLeaseId();
  assert.equal(
    claimMemoryProductEventOutbox({ leaseId: oldLease, limit: 1, now }).length,
    1,
  );
  assert.equal(
    ackMemoryProductEventOutbox({
      eventId: sourceId,
      leaseId: oldLease,
      now: new Date(now.getTime() + 60_001),
    }),
    "stale",
    "an expired non-final lease must never acknowledge delivery",
  );
  const recoveredLease = createTelemetryOutboxLeaseId();
  const recovered = claimMemoryProductEventOutbox({
    leaseId: recoveredLease,
    limit: 1,
    now: new Date(now.getTime() + 60_001),
  });
  assert.equal(recovered[0]?.eventId, sourceId);
  assert.equal(recovered[0]?.attemptCount, 2);
  assert.equal(
    ackMemoryProductEventOutbox({ eventId: sourceId, leaseId: oldLease }),
    "stale",
  );
  assert.equal(
    ackMemoryProductEventOutbox({ eventId: sourceId, leaseId: recoveredLease }),
    "acknowledged",
  );

  const exhaustedFlow = createTelemetryFlowId();
  assert.equal(registerMemoryTelemetryFlow(exhaustedFlow), "created");
  const exhaustedEvent: ProductEvent = {
    event: "story_completed",
    storyRole: "initial",
  };
  const exhaustedId = deriveProductEventId(exhaustedEvent, exhaustedFlow);
  assert.equal(
    appendMemoryProductEvent(
      createProductEventRecord({
        event: exhaustedEvent,
        eventId: exhaustedId,
        flowId: exhaustedFlow,
        now,
      }),
    ),
    "created",
  );
  let retryNow = now.getTime() + 120_000;
  for (let attempt = 1; attempt <= 20; attempt += 1) {
    const leaseId = createTelemetryOutboxLeaseId();
    const attemptRows = claimMemoryProductEventOutbox({
      leaseId,
      limit: 100,
      now: new Date(retryNow),
    });
    assert.equal(
      attemptRows.find((candidate) => candidate.eventId === exhaustedId)
        ?.attemptCount,
      attempt,
    );
    const result = nackMemoryProductEventOutbox({
      eventId: exhaustedId,
      leaseId,
      errorClass: "network",
      now: new Date(retryNow + 1),
    });
    assert.equal(result, attempt === 20 ? "exhausted" : "released");
    retryNow += 3_700_000;
  }
  const exhaustedPointer = listMemoryProductEventOutbox().find(
    (candidate) => candidate.eventId === exhaustedId,
  );
  assert.equal(exhaustedPointer?.status, "exhausted");
  assert.equal(exhaustedPointer?.lastErrorClass, "network");
  assert.equal(
    ackMemoryProductEventOutbox({
      eventId: exhaustedId,
      leaseId: createTelemetryOutboxLeaseId(),
      now: new Date(retryNow),
    }),
    "exhausted",
  );

  const crashedFlow = createTelemetryFlowId();
  assert.equal(registerMemoryTelemetryFlow(crashedFlow), "created");
  const crashedEvent: ProductEvent = {
    event: "story_completed",
    storyRole: "alternate",
  };
  const crashedId = deriveProductEventId(crashedEvent, crashedFlow);
  assert.equal(
    appendMemoryProductEvent(
      createProductEventRecord({
        event: crashedEvent,
        eventId: crashedId,
        flowId: crashedFlow,
        now: new Date(retryNow),
      }),
    ),
    "created",
  );
  let crashedLease = createTelemetryOutboxLeaseId();
  for (let attempt = 1; attempt <= 20; attempt += 1) {
    crashedLease = createTelemetryOutboxLeaseId();
    const attemptRows = claimMemoryProductEventOutbox({
      leaseId: crashedLease,
      limit: 100,
      now: new Date(retryNow),
    });
    assert.equal(
      attemptRows.find((candidate) => candidate.eventId === crashedId)
        ?.attemptCount,
      attempt,
    );
    if (attempt < 20) {
      assert.equal(
        nackMemoryProductEventOutbox({
          eventId: crashedId,
          leaseId: crashedLease,
          errorClass: "timeout",
          now: new Date(retryNow + 1),
        }),
        "released",
      );
      retryNow += 3_700_000;
    }
  }
  assert.equal(
    claimMemoryProductEventOutbox({
      leaseId: createTelemetryOutboxLeaseId(),
      limit: 100,
      now: new Date(retryNow + 60_001),
    }).some((candidate) => candidate.eventId === crashedId),
    false,
  );
  const crashedPointer = listMemoryProductEventOutbox().find(
    (candidate) => candidate.eventId === crashedId,
  );
  assert.equal(crashedPointer?.status, "exhausted");
  assert.equal(crashedPointer?.lastErrorClass, "timeout");
  assert.equal(
    ackMemoryProductEventOutbox({
      eventId: crashedId,
      leaseId: crashedLease,
      now: new Date(retryNow + 60_002),
    }),
    "exhausted",
  );

  assert.equal(
    claimMemoryTelemetryFlowOwner({
      flowId,
      userId: "lifecycle-user",
    }),
    "claimed",
  );
  assert.equal(
    bindMemoryTelemetryFlow({ flowId, userId: "lifecycle-user", rootSessionId: "a".repeat(32) }),
    "created",
  );
  assert.equal(
    bindMemoryTelemetryFlow({ flowId, userId: "foreign-user", rootSessionId: "b".repeat(32) }),
    "conflict",
  );
  assert.equal(
    getOwnedMemoryTelemetryFlowBindingByRoot("a".repeat(32), "lifecycle-user")?.flowId,
    flowId,
  );
  deleteMemoryTelemetryFlowBindingForRoot("a".repeat(32));
  assert(!listMemoryProductEvents().some((candidate) => candidate.flowId === flowId));
  assert(!listMemoryProductEventOutbox().some((candidate) => candidate.eventId === eventId));
  assert.equal(registerMemoryTelemetryFlow(flowId), "revoked");

  deleteMemoryTelemetryFlowBindingForRoot("a".repeat(32));
  deleteMemoryTelemetryFlowBindingForRoot("b".repeat(32));
  // This flow was not bound above; remove its rows through a temporary root mapping.
  assert.equal(
    claimMemoryTelemetryFlowOwner({
      flowId: expiryFlow,
      userId: "expiry-user",
    }),
    "claimed",
  );
  assert.equal(
    bindMemoryTelemetryFlow({
      flowId: expiryFlow,
      userId: "expiry-user",
      rootSessionId: "c".repeat(32),
    }),
    "created",
  );
  deleteMemoryTelemetryFlowBindingForRoot("c".repeat(32));
}

async function checkFlowOwnershipAndRouteBoundary(): Promise<void> {
  const flowId = createTelemetryFlowId();
  const context: IntakeContext = {
    userId: "telemetry-lifecycle-reader",
    ipHash: "telemetry-lifecycle-ip",
    telemetryFlowId: flowId,
  };
  const input = {
    age: 28,
    feeling: "I keep getting rejected and do not know whether I should keep trying.",
  };
  const recoveryIdentity = {
    age: input.age,
    feeling: input.feeling,
    telemetryFlowId: flowId,
  };
  const recoveryToken = await issueMatchRecoveryToken(
    context.userId,
    recoveryIdentity,
    "clarification",
  );
  assert.equal(
    await consumeMatchRecoveryToken(recoveryToken, context.userId, {
      ...recoveryIdentity,
      telemetryFlowId: createTelemetryFlowId(),
    }),
    null,
    "a recovery capability must not move to another telemetry root flow",
  );
  assert.equal(
    await consumeMatchRecoveryToken(
      recoveryToken,
      context.userId,
      recoveryIdentity,
    ),
    "clarification",
  );
  const before = await _sessionCount();
  const created = await handleIntake(input, context);
  assert("sessionId" in created, "lifecycle fixture did not create a story");
  const replayed = await handleIntake(input, context);
  assert("sessionId" in replayed, "same-flow replay did not reconcile");
  assert.equal(replayed.sessionId, created.sessionId);
  assert.equal(await _sessionCount(), before + 1);

  const owned = await getOwnedSession(created.sessionId, context.userId);
  assert(owned);
  const binding = await resolveOwnedTelemetryFlowForSession(
    created.sessionId,
    context.userId,
  );
  assert.equal(binding?.flowId, flowId);
  assert.equal(binding?.rootSessionId, created.sessionId);
  assert.equal(
    await resolveOwnedTelemetryFlowForSession(created.sessionId, "someone-else"),
    null,
  );

  const editedRetry = await handleIntake(
    {
      ...input,
      boundaries: { maxIntensity: "moderate" as const, excludedFlags: [] },
    },
    context,
  );
  assert(
    "flowConflict" in editedRetry,
    "a changed disclosure/safety context must not reuse the prior root story",
  );
  assert.equal(await _sessionCount(), before + 1);

  const collision = await handleIntake(input, {
    userId: "telemetry-lifecycle-foreign-reader",
    ipHash: "telemetry-lifecycle-foreign-ip",
    telemetryFlowId: flowId,
  });
  assert("flowConflict" in collision);
  assert.equal(await _sessionCount(), before + 1);

  const previousBindingFlag = process.env.TELEMETRY_FLOW_BINDING_ENABLED;
  process.env.TELEMETRY_FLOW_BINDING_ENABLED = "false";
  try {
    const degradedFlow = createTelemetryFlowId();
    const degraded = await handleIntake(input, {
      userId: "telemetry-degraded-reader",
      ipHash: "telemetry-degraded-ip",
      telemetryFlowId: degradedFlow,
    });
    assert("sessionId" in degraded, "v2 kill-switch path did not create a story");
    assert.equal(
      await resolveOwnedTelemetryFlowForSession(
        degraded.sessionId,
        "telemetry-degraded-reader",
      ),
      null,
      "the v2 kill-switch path must not create a false flow binding",
    );
  } finally {
    if (previousBindingFlag === undefined) {
      delete process.env.TELEMETRY_FLOW_BINDING_ENABLED;
    } else {
      process.env.TELEMETRY_FLOW_BINDING_ENABLED = previousBindingFlag;
    }
  }

  const previousStoryCreationFlag = process.env.STORY_CREATION_ENABLED;
  process.env.STORY_CREATION_ENABLED = "false";
  try {
    const crisisResponse = await matchPost(
      new Request("http://localhost/api/match", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ age: 22, feeling: "I want to kill myself" }),
      }),
    );
    assert.equal(crisisResponse.status, 200);
    assert.equal(
      (await crisisResponse.json() as { crisis?: unknown }).crisis,
      true,
      "crisis resources must remain available while stories are paused",
    );

    const pausedFlow = createTelemetryFlowId();
    const pausedResponse = await matchPost(
      new Request("http://localhost/api/match", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          [TELEMETRY_FLOW_HEADER]: pausedFlow,
        },
        body: JSON.stringify(input),
      }),
    );
    assert.equal(pausedResponse.status, 503);
    assert.equal(
      getMemoryTelemetryFlowByFlow(pausedFlow),
      null,
      "the story kill switch must stop before flow registration or owner claim",
    );
  } finally {
    if (previousStoryCreationFlag === undefined) {
      delete process.env.STORY_CREATION_ENABLED;
    } else {
      process.env.STORY_CREATION_ENABLED = previousStoryCreationFlag;
    }
  }

  const missingFlow = await matchPost(
    new Request("http://localhost/api/match", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
  assert.notEqual(missingFlow.status, 400);

  const wrongPurpose = await matchPost(
    new Request("http://localhost/api/match", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        [TELEMETRY_FLOW_HEADER]: createTelemetryEventId(),
      },
      body: JSON.stringify(input),
    }),
  );
  assert.equal(wrongPurpose.status, 400);

  const expiredFlow = issueTelemetryFlowId(
    new Date(Date.now() - 31 * 86_400_000),
  );
  const expiredFlowResponse = await matchPost(
    new Request("http://localhost/api/match", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        [TELEMETRY_FLOW_HEADER]: expiredFlow,
      },
      body: JSON.stringify(input),
    }),
  );
  assert.equal(
    expiredFlowResponse.status,
    409,
    "an authentic expired flow must reach the form's start-fresh recovery",
  );

  const validFlow = createTelemetryFlowId();
  const validFlowResponse = await matchPost(
    new Request("http://localhost/api/match", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        [TELEMETRY_FLOW_HEADER]: validFlow,
      },
      body: JSON.stringify(input),
    }),
  );
  assert.notEqual(validFlowResponse.status, 400);
  assert.notEqual(validFlowResponse.status, 401);
  assert.notEqual(validFlowResponse.status, 409);

  const retiredFlow = createTelemetryFlowId();
  assert.equal(registerMemoryTelemetryFlow(retiredFlow), "created");
  assert.equal(
    claimMemoryTelemetryFlowOwner({
      flowId: retiredFlow,
      userId: "retirement-owner",
    }),
    "claimed",
  );
  assert.equal(
    await recordProductEvent({
      flowId: retiredFlow,
      event: { event: "intake_submitted" },
    }),
    "created",
  );
  await assert.rejects(
    deleteProductEventsForFlow(retiredFlow, null),
    /owner conflicted/,
  );
  assert.equal(
    await deleteProductEventsForFlow(retiredFlow, "retirement-owner"),
    1,
  );
  assert.equal(
    await recordProductEvent({
      flowId: retiredFlow,
      event: { event: "intake_submitted" },
    }),
    "conflict",
    "a retired flow must never accept recreated events",
  );
}

function checkMigrationAndRuntimeBoundary(): void {
  const migration = readFileSync(
    resolve("supabase/migrations/0011_transactional_telemetry_outbox.sql"),
    "utf8",
  );
  const outboxTable = /create table public\.product_event_outbox \([\s\S]*?^\);/m.exec(
    migration,
  )?.[0];
  assert(outboxTable, "typed outbox table is missing");
  assert(!/\bjsonb\b/i.test(outboxTable));
  assert(!/\b(user_id|session_id|artifact_id|payload|metadata|properties|message|body)\b/i.test(outboxTable));
  assert.match(outboxTable, /references public\.product_events \(event_id\) on delete cascade/);
  assert.match(
    outboxTable,
    /status in \('pending', 'leased', 'delivered', 'exhausted'\)/,
  );
  assert.match(outboxTable, /attempt_count between 0 and 20/);

  assert.match(migration, /create table public\.telemetry_flows/);
  assert.match(migration, /create table public\.telemetry_flow_revocations/);
  assert.match(migration, /telemetry_flows_owner_root_pair_check/);
  assert.match(migration, /references public\.sessions \(session_id, user_id\) on delete cascade/);
  assert.match(migration, /product_events_flow_fk[\s\S]*on delete cascade not valid/);
  assert.match(migration, /force row level security/g);
  assert.match(migration, /revoke all on table public\.telemetry_flows[\s\S]*service_role/);
  assert.match(migration, /revoke all on table public\.product_event_outbox[\s\S]*service_role/);
  assert.match(
    migration,
    /revoke insert, delete on table public\.product_events from service_role/,
  );
  for (const rpc of [
    "register_telemetry_flow_v1",
    "claim_telemetry_flow_owner_v1",
    "revoke_telemetry_flow_v1",
    "resolve_owned_telemetry_flow_v1",
    "resolve_owned_telemetry_root_v1",
    "capture_product_event_v1",
    "claim_product_event_outbox_v1",
    "ack_product_event_outbox_v1",
    "nack_product_event_outbox_v1",
    "create_story_session_v3",
  ]) {
    assert.match(migration, new RegExp(`create or replace function public\\.${rpc}\\(`));
  }
  assert.match(migration, /for update(?: of queue)? skip locked/);
  assert.match(migration, /queue\.attempt_count < 20/);
  assert.match(migration, /event\.expires_at > statement_timestamp\(\)/);
  assert.match(migration, /register_telemetry_flow_v1\([\s\S]*p_expires_at timestamptz/);
  assert.match(migration, /status = 'exhausted'/);
  assert.match(migration, /product_events_passage_unit_idx/);
  assert.match(migration, /product_events_match_disposition_unit_idx/);
  assert.match(
    migration,
    /v_existing_session\.story_request_context[\s\S]*is not distinct from p_story_request_context/,
  );
  assert.match(migration, /onward-telemetry-flow-cleanup/);
  const unclaimedIndex = migration.indexOf("'status', 'unclaimed'");
  const ownerCollisionIndex = migration.indexOf(
    "v_flow.user_id is distinct from p_user_id",
    unclaimedIndex,
  );
  assert(unclaimedIndex >= 0 && unclaimedIndex < ownerCollisionIndex);

  const beginPage = readFileSync(resolve("app/begin/page.tsx"), "utf8");
  const matchRoute = readFileSync(resolve("app/api/match/route.ts"), "utf8");
  const intakeForm = readFileSync(resolve("components/IntakeForm.tsx"), "utf8");
  const intake = readFileSync(resolve("lib/intake.ts"), "utf8");
  const sessionStore = readFileSync(
    resolve("lib/session-store-supabase.ts"),
    "utf8",
  );
  const telemetryStore = readFileSync(
    resolve("lib/telemetry-store-supabase.ts"),
    "utf8",
  );
  assert.match(beginPage, /dynamic = "force-dynamic"/);
  assert.match(beginPage, /<IntakeForm[\s\S]*telemetryFlowId=\{telemetryFlowId\}/);
  assert(
    matchRoute.indexOf("classifyCrisis(safetyText)") <
      matchRoute.indexOf("parseTelemetryFlowId(flowHeader)"),
    "crisis support must precede flow capability parsing",
  );
  assert.match(intake, /activateTelemetryFlowForOwner\(/);
  assert.match(intake, /resolveOwnedTelemetryRootForFlow\(/);
  assert(
    intake.indexOf("resolveOwnedTelemetryRootForFlow(") <
      intake.indexOf("loadEligibleStoryCatalog({"),
    "committed retries must resolve before catalog/rate/provider work",
  );
  assert.match(intake, /telemetryFlowId,[\s\S]*figureKey:/);
  assert.match(intakeForm, /headers\[TELEMETRY_FLOW_HEADER\] = telemetryFlowId/);
  assert(
    intakeForm.indexOf("response = await postMatch()") <
      intakeForm.indexOf("await ensureAuthSession()"),
    "the client must reach crisis classification before anonymous auth",
  );
  assert.match(intakeForm, /I need immediate help/);
  assert.match(sessionStore, /create_story_session_v3/);
  assert.match(sessionStore, /create_story_session_v2/);
  assert.doesNotMatch(
    telemetryStore,
    /deleteSupabaseProductEventsForFlow/,
    "privacy deletion must retire the flow instead of deleting event rows directly",
  );
  assert.doesNotThrow(() => parseTelemetryFlowId(createTelemetryFlowId()));
}

function closeMatch(
  matchPath: "rerank" | "keyword_fallback",
  boundaryOutcome: "not_set" | "passed",
): Extract<ProductEvent, { event: "match_completed" }> {
  return {
    event: "match_completed",
    recipeId,
    storyRole: "initial",
    disposition: "close",
    confidenceBucket: "high",
    matchPath,
    ageFallback: false,
    boundaryOutcome,
  };
}

function eventFlow(event: ProductEvent, flowId: TelemetryFlowId): TelemetryFlowId | null {
  return [
    "crisis_intercepted",
    "rate_limited",
    "deletion_requested",
    "deletion_completed",
  ].includes(event.event)
    ? null
    : flowId;
}

void main();
