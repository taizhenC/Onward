import "./_smoke-bootstrap";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { chunkBeatText } from "../lib/chunks";
import { FIGURE_STAGES } from "../lib/figures-data";
import { MATCH_RECOVERY_POLICY_VERSION } from "../lib/match-recovery";
import { APPROVED_PRODUCTION_RECIPE } from "../lib/match-config";
import {
  deriveProductEventId,
  parseTelemetryFlowId,
  parseTelemetryFlowIdForRetirement,
} from "../lib/telemetry-id";
import {
  createGenerationAttemptRecord,
  createProductEventRecord,
  parseGenerationAttempt,
  parseProductEvent,
} from "../lib/telemetry-schema";
import {
  createDeletionCorrelationId,
  createGenerationAttemptId,
  createTelemetryEventId,
  createTelemetryFlowId,
  createTelemetryOccurrenceId,
  recordGenerationAttempt,
  recordProductEvent,
} from "../lib/telemetry";
import {
  latencyBucketForMs,
  reduceFlowFailure,
  reduceGenerationAttempt,
} from "../lib/telemetry-reductions";
import {
  appendMemoryGenerationAttempt,
  appendMemoryProductEvent,
  deleteMemoryProductEventsForFlow,
  listMemoryGenerationAttempts,
  listMemoryProductEvents,
  pruneMemoryTelemetry,
} from "../lib/telemetry-store-memory";
import { toProductEventRow } from "../lib/telemetry-store-supabase";
import { registerMemoryTelemetryFlow } from "../lib/telemetry-flow-binding-memory";
import {
  GENERATION_ATTEMPT_RETENTION_DAYS,
  PRODUCT_EVENT_NAMES,
  PRODUCT_EVENT_RETENTION_DAYS,
  type GenerationAttempt,
  type ProductEvent,
  type ProductEventRecord,
  type TelemetryEventId,
  type TelemetryFlowId,
  type TelemetryOccurrenceId,
} from "../lib/telemetry-types";

const recipeId = APPROVED_PRODUCTION_RECIPE.recipeId;
const flowId = createTelemetryFlowId();
const deletionId = createDeletionCorrelationId();

const validEvents: ProductEvent[] = [
  { event: "landing_cta_clicked", surface: "home_primary" },
  { event: "intake_started", viewportBucket: "small" },
  { event: "intake_submitted" },
  { event: "auth_established", authMethod: "anonymous" },
  { event: "crisis_intercepted" },
  { event: "rate_limited", operation: "intake", limitScope: "ip" },
  {
    event: "match_completed",
    recipeId,
    storyRole: "initial",
    disposition: "close",
    confidenceBucket: "high",
    matchPath: "rerank",
    ageFallback: false,
    boundaryOutcome: "passed",
  },
  {
    event: "clarification_shown",
    policyVersion: MATCH_RECOVERY_POLICY_VERSION,
  },
  {
    event: "artifact_created",
    recipeId,
    storyRole: "initial",
    compositionMode: "hybrid",
    fallbackReason: "none",
    attemptBucket: "first",
  },
  {
    event: "first_content_shown",
    storyRole: "initial",
    latencyBucket: "6to8s",
  },
  {
    event: "passage_presented",
    storyRole: "initial",
    passageOrdinal: 0,
    latencyBucket: "250to500ms",
  },
  { event: "passage_acknowledged", storyRole: "initial", passageOrdinal: 0 },
  { event: "story_completed", storyRole: "initial" },
  { event: "source_opened", storyRole: "initial" },
  { event: "feedback_submitted", storyRole: "initial", verdict: "felt_close" },
  { event: "alternate_requested" },
  { event: "alternate_resolved", outcome: "ready" },
  { event: "story_saved", storyRole: "initial" },
  { event: "saved_story_reopened", storyRole: "initial", ageBucket: "7to30d" },
  { event: "deletion_requested", deletionId, scope: "story" },
  {
    event: "deletion_completed",
    deletionId,
    scope: "story",
    latencyBucket: "lt250ms",
  },
  {
    event: "flow_failed",
    domain: "composition",
    errorClass: "timeout",
    statusBucket: "timeout",
    latencyBucket: "8to15s",
  },
];

const forbiddenFields = [
  "feeling",
  "text",
  "message",
  "prompt",
  "response",
  "body",
  "content",
  "openingCopy",
  "beats",
  "story",
  "rationale",
  "primaryPressure",
  "emotionalCore",
  "situationShape",
  "themes",
  "facets",
  "boundaries",
  "excludedFlags",
  "figureKey",
  "stageId",
  "storySpecId",
  "factId",
  "sourceId",
  "candidateKeys",
  "embedding",
  "userId",
  "email",
  "ipHash",
  "token",
  "userAgent",
  "url",
  "referrer",
  "age",
  "error",
  "exception",
  "stack",
  "cause",
  "payload",
  "properties",
  "metadata",
] as const;

function expectReject(run: () => unknown, label: string): void {
  assert.throws(run, label);
}

function eventFlow(event: ProductEvent): TelemetryFlowId | null {
  return [
    "crisis_intercepted",
    "rate_limited",
    "deletion_requested",
    "deletion_completed",
  ].includes(event.event)
    ? null
    : flowId;
}

function checkExactSchemas(): void {
  assert.equal(new Set(PRODUCT_EVENT_NAMES).size, validEvents.length);
  assert.deepEqual(
    new Set(validEvents.map((event) => event.event)),
    new Set(PRODUCT_EVENT_NAMES),
  );
  for (const event of validEvents) {
    const parsed = parseProductEvent(event);
    assert(Object.isFrozen(parsed));
    for (const field of forbiddenFields) {
      expectReject(
        () => parseProductEvent({ ...event, [field]: "harmless" }),
        `${event.event} accepted forbidden ${field}`,
      );
    }
  }
  expectReject(() => parseProductEvent(null), "null event accepted");
  expectReject(() => parseProductEvent([]), "array event accepted");
  expectReject(
    () => parseProductEvent({ event: "intake_started", viewportBucket: {} }),
    "nested object accepted",
  );
  expectReject(
    () => parseProductEvent({ event: "made_up" }),
    "unknown event accepted",
  );
  expectReject(
    () => parseProductEvent({ event: "match_completed", recipeId }),
    "missing match dimensions accepted",
  );
  expectReject(
    () => parseProductEvent({ event: "intake_started", viewportBucket: "mobile" }),
    "arbitrary enum string accepted",
  );
  expectReject(
    () => parseProductEvent({
      event: "artifact_created",
      recipeId,
      storyRole: "initial",
      compositionMode: "hybrid",
      fallbackReason: "provider_timeout",
      attemptBucket: "retry",
    }),
    "hybrid artifact with fallback reason accepted",
  );
  expectReject(
    () => parseProductEvent({
      event: "artifact_created",
      recipeId,
      storyRole: "initial",
      compositionMode: "hybrid",
      fallbackReason: "none",
      attemptBucket: "not_attempted",
    }),
    "hybrid artifact without a generation attempt accepted",
  );
  assert.equal(
    parseProductEvent({
      event: "artifact_created",
      recipeId,
      storyRole: "initial",
      compositionMode: "canonical_fallback",
      fallbackReason: "validator_rejected",
      attemptBucket: "not_attempted",
    }).event,
    "artifact_created",
  );
  expectReject(
    () => parseProductEvent({
      event: "artifact_created",
      recipeId,
      storyRole: "initial",
      compositionMode: "canonical_fallback",
      fallbackReason: "provider_timeout",
      attemptBucket: "first",
    }),
    "attempted canonical fallback before retry exhaustion accepted",
  );
  expectReject(
    () => parseProductEvent({
      event: "match_completed",
      recipeId,
      storyRole: "alternate",
      disposition: "close",
      confidenceBucket: "not_applicable",
      matchPath: "not_run",
      ageFallback: true,
      boundaryOutcome: "no_eligible",
    }),
    "impossible match disposition accepted",
  );
  expectReject(
    () => parseProductEvent({
      ...validEvents.find((event) => event.event === "passage_acknowledged"),
      passageOrdinal: 64,
    }),
    "unbounded passage count accepted",
  );
  const maxAuthoredPassages = Math.max(
    ...FIGURE_STAGES.map((stage) =>
      stage.beats.reduce((count, beat) => count + chunkBeatText(beat).length, 0),
    ),
  );
  assert(maxAuthoredPassages > 15, "passage-bound regression fixture is too weak");
  assert(
    maxAuthoredPassages <= 64,
    `authored story needs ${maxAuthoredPassages} passage ordinals`,
  );
}

function checkEnvelopeAndRetention(): void {
  const now = new Date();
  validEvents.forEach((event) => {
    const record = createProductEventRecord({
      event,
      eventId: createTelemetryEventId(),
      flowId: eventFlow(event),
      now,
    });
    assert(Object.isFrozen(record));
    assert.equal(
      Date.parse(record.expiresAt) - Date.parse(record.occurredAt),
      PRODUCT_EVENT_RETENTION_DAYS * 86_400_000,
    );
  });
  expectReject(
    () => createProductEventRecord({
      event: { event: "crisis_intercepted" },
      eventId: createTelemetryEventId(),
      flowId,
    }),
    "linked crisis event accepted",
  );
  expectReject(
    () => createProductEventRecord({
      event: { event: "intake_submitted" },
      eventId: createTelemetryEventId(),
      flowId: null,
    }),
    "linkable event without flow accepted",
  );
  expectReject(
    () => createProductEventRecord({
      event: { event: "intake_submitted" },
      eventId: "not-an-id" as TelemetryEventId,
      flowId,
    }),
    "unapproved event ID accepted",
  );
  expectReject(
    () => createProductEventRecord({
      event: { event: "intake_submitted" },
      eventId: createTelemetryEventId(),
      flowId: `tfl_${"7".repeat(16)}_${"8".repeat(32)}_${"0".repeat(64)}` as TelemetryFlowId,
    }),
    "raw session-shaped ID laundered as a telemetry flow",
  );
  expectReject(
    () => createProductEventRecord({
      event: { event: "intake_submitted" },
      eventId: `tev_${"7".repeat(16)}_${"8".repeat(32)}_${"0".repeat(64)}` as TelemetryEventId,
      flowId,
    }),
    "raw artifact-shaped ID laundered as a telemetry event ID",
  );
}

function checkReductions(): void {
  assert.equal(latencyBucketForMs(249), "lt250ms");
  assert.equal(latencyBucketForMs(250), "250to500ms");
  assert.equal(latencyBucketForMs(499), "250to500ms");
  assert.equal(latencyBucketForMs(500), "250to500ms");
  assert.equal(latencyBucketForMs(501), "500ms_to1s");
  assert.equal(latencyBucketForMs(7_999), "6to8s");
  assert.equal(latencyBucketForMs(8_000), "6to8s");
  assert.equal(latencyBucketForMs(8_001), "8to15s");
  expectReject(() => latencyBucketForMs(Number.POSITIVE_INFINITY), "infinite latency accepted");
  expectReject(() => latencyBucketForMs(3_600_001), "unbounded latency accepted");

  const canary = "RAW-DISCLOSURE-私密-CANARY";
  const providerError = Object.assign(new Error(canary), {
    name: "AbortError",
    status: 500,
    stack: `stack ${canary}`,
    response: { body: canary },
  });
  const failure = reduceFlowFailure({
    domain: "composition",
    error: providerError,
    durationMs: 8_001,
  });
  assert.deepEqual(failure, {
    event: "flow_failed",
    domain: "composition",
    errorClass: "timeout",
    statusBucket: "timeout",
    latencyBucket: "8to15s",
  });
  assert(!JSON.stringify(failure).includes(canary));
  assert.equal(
    reduceFlowFailure({
      domain: "database",
      error: { errorClass: "database", message: canary },
      durationMs: 10,
    }).errorClass,
    "database",
  );

  const reducedAttempt = reduceGenerationAttempt({
    operation: "compose",
    recipeId,
    provider: "cerebras",
    outcome: "fallback",
    attempt: "retry",
    durationMs: 15_001,
    error: providerError,
    fallbackReason: "provider_timeout",
    validationOutcome: "not_run",
    costMicros: 900,
  });
  assert(!JSON.stringify(reducedAttempt).includes(canary));
  assert.equal(reducedAttempt.errorClass, "timeout");
  assert.equal(reducedAttempt.latencyBucket, "gt15s");

  const invalidOutputAttempt = reduceGenerationAttempt({
    operation: "compose",
    recipeId,
    provider: "cerebras",
    outcome: "fallback",
    attempt: "first",
    durationMs: 700,
    error: { errorClass: "invalid_output", message: canary },
    fallbackReason: "provider_output_invalid",
    validationOutcome: "schema_rejected",
    costMicros: 500,
  });
  assert.equal(invalidOutputAttempt.errorClass, "invalid_output");
  assert.equal(invalidOutputAttempt.validationOutcome, "schema_rejected");

  const validatorAttempt = reduceGenerationAttempt({
    operation: "validate",
    recipeId,
    provider: "internal",
    outcome: "fallback",
    attempt: "retry",
    durationMs: 10,
    error: { errorClass: "validation_rejected", message: canary },
    fallbackReason: "validator_rejected",
    validationOutcome: "boundary_rejected",
    costMicros: 0,
  });
  assert.equal(validatorAttempt.errorClass, "validation_rejected");
  assert.equal(validatorAttempt.validationOutcome, "boundary_rejected");
}

function checkGenerationSchema(): void {
  const success: GenerationAttempt = {
    operation: "compose",
    recipeId,
    provider: "cerebras",
    outcome: "success",
    attempt: "first",
    latencyBucket: "1to3s",
    statusBucket: "ok",
    errorClass: "none",
    fallbackReason: "none",
    validationOutcome: "passed",
    costMicros: 1200,
  };
  assert(Object.isFrozen(parseGenerationAttempt(success)));
  expectReject(
    () => parseGenerationAttempt({ ...success, payload: {} }),
    "generation metadata accepted",
  );
  expectReject(
    () => parseGenerationAttempt({ ...success, errorClass: "timeout" }),
    "success with error accepted",
  );
  expectReject(
    () => parseGenerationAttempt({
      ...success,
      validationOutcome: "privacy_rejected",
    }),
    "success with rejected validation accepted",
  );
  expectReject(
    () => parseGenerationAttempt({
      ...success,
      operation: "validate",
      validationOutcome: "not_run",
    }),
    "successful validation without a passed result accepted",
  );
  expectReject(
    () => parseGenerationAttempt({
      ...success,
      outcome: "fallback",
      fallbackReason: "provider_error",
    }),
    "fallback without reduced failure accepted",
  );
  expectReject(
    () => parseGenerationAttempt({
      ...success,
      outcome: "fallback",
      statusBucket: "timeout",
      errorClass: "timeout",
      fallbackReason: "validator_rejected",
      validationOutcome: "not_run",
    }),
    "validator fallback without a rejected validation accepted",
  );
  expectReject(
    () => parseGenerationAttempt({
      ...success,
      outcome: "failure",
      errorClass: "database",
    }),
    "failure with successful status accepted",
  );
  expectReject(
    () => parseGenerationAttempt({
      ...success,
      outcome: "failure",
      statusBucket: "upstream",
      errorClass: "database",
      fallbackReason: "provider_error",
    }),
    "terminal failure with a fallback reason accepted",
  );
  expectReject(
    () => parseGenerationAttempt({ ...success, costMicros: 10_000_001 }),
    "unbounded cost accepted",
  );
  expectReject(
    () => parseProductEvent({
      event: "saved_story_reopened",
      storyRole: "initial",
      ageBucket: "ge7d",
    }),
    "legacy unbounded reopen age bucket accepted",
  );
  const record = createGenerationAttemptRecord({
    attemptId: createGenerationAttemptId(),
    attempt: success,
    now: new Date("2026-07-12T12:00:00.000Z"),
  });
  assert.equal(
    Date.parse(record.expiresAt) - Date.parse(record.occurredAt),
    GENERATION_ATTEMPT_RETENTION_DAYS * 86_400_000,
  );
}

function checkMemoryStore(): void {
  assert.notEqual(registerMemoryTelemetryFlow(flowId), "revoked");
  const now = new Date();
  const event = createProductEventRecord({
    eventId: createTelemetryEventId(),
    flowId,
    event: { event: "intake_submitted" },
    now,
  });
  assert.equal(appendMemoryProductEvent(event), "created");
  assert.equal(appendMemoryProductEvent(event), "duplicate");
  const conflict = createProductEventRecord({
    eventId: event.eventId,
    flowId,
    event: { event: "alternate_requested" },
    now,
  });
  assert.equal(appendMemoryProductEvent(conflict), "conflict");
  const listed = listMemoryProductEvents().find(
    (candidate) => candidate.eventId === event.eventId,
  );
  assert(listed);
  assert(Object.isFrozen(listed));
  assert.throws(() => {
    (listed as { event: string }).event = "tampered";
  });
  assert.equal(deleteMemoryProductEventsForFlow(flowId) >= 1, true);

  const attempt = createGenerationAttemptRecord({
    attemptId: createGenerationAttemptId(),
    attempt: {
      operation: "persist",
      recipeId,
      provider: "supabase",
      outcome: "failure",
      attempt: "first",
      latencyBucket: "500ms_to1s",
      statusBucket: "upstream",
      errorClass: "database",
      fallbackReason: "none",
      validationOutcome: "not_run",
      costMicros: 0,
    },
    now,
  });
  assert.equal(appendMemoryGenerationAttempt(attempt), "created");
  assert.equal(appendMemoryGenerationAttempt(attempt), "duplicate");
  assert(Object.isFrozen(listMemoryGenerationAttempts()[0]));

  const expired = createProductEventRecord({
    eventId: createTelemetryEventId(),
    flowId: null,
    event: { event: "crisis_intercepted" },
    now: new Date("2025-01-01T00:00:00.000Z"),
  });
  assert.equal(appendMemoryProductEvent(expired), "created");
  pruneMemoryTelemetry(Date.parse("2025-02-01T00:00:00.001Z"));
  assert(!listMemoryProductEvents().some((item) => item.eventId === expired.eventId));
}

function checkMetricFixture(): void {
  const flowA = createTelemetryFlowId();
  const flowB = createTelemetryFlowId();
  const now = new Date();
  const record = (flow: typeof flowA, event: ProductEvent): ProductEventRecord =>
    createProductEventRecord({
      eventId: createTelemetryEventId(),
      flowId: flow,
      event,
      now,
    });
  const records = [
    record(flowA, { event: "artifact_created", recipeId, storyRole: "initial", compositionMode: "hybrid", fallbackReason: "none", attemptBucket: "first" }),
    record(flowA, { event: "story_completed", storyRole: "initial" }),
    record(flowA, { event: "feedback_submitted", storyRole: "initial", verdict: "felt_close" }),
    record(flowA, { event: "source_opened", storyRole: "initial" }),
    record(flowA, { event: "source_opened", storyRole: "initial" }),
    record(flowA, { event: "alternate_requested" }),
    record(flowA, { event: "artifact_created", recipeId, storyRole: "alternate", compositionMode: "canonical_fallback", fallbackReason: "provider_timeout", attemptBucket: "exhausted" }),
    record(flowA, { event: "story_completed", storyRole: "alternate" }),
    record(flowA, { event: "feedback_submitted", storyRole: "alternate", verdict: "not_close" }),
    record(flowB, { event: "artifact_created", recipeId, storyRole: "initial", compositionMode: "hybrid", fallbackReason: "none", attemptBucket: "first" }),
    record(flowB, { event: "story_completed", storyRole: "initial" }),
  ];
  const unit = (event: ProductEventRecord & { storyRole: string }) =>
    `${event.flowId}:${event.storyRole}`;
  const unitsFor = (name: ProductEvent["event"], predicate?: (event: ProductEventRecord) => boolean) =>
    new Set(
      records
        .filter((event) => event.event === name && (!predicate || predicate(event)))
        .filter((event): event is ProductEventRecord & { storyRole: string } => "storyRole" in event)
        .map(unit),
    );
  const artifactUnits = unitsFor("artifact_created");
  const completedUnits = unitsFor("story_completed");
  const feedbackUnits = unitsFor("feedback_submitted");
  const positiveUnits = unitsFor(
    "feedback_submitted",
    (event) => event.event === "feedback_submitted" && event.verdict === "felt_close",
  );
  const sourceUnits = unitsFor("source_opened");
  const resonantUnits = new Set(
    [...artifactUnits].filter(
      (key) => completedUnits.has(key) && positiveUnits.has(key),
    ),
  );
  assert.equal(completedUnits.size / artifactUnits.size, 1);
  assert.equal(feedbackUnits.size / completedUnits.size, 2 / 3);
  assert.equal(resonantUnits.size / artifactUnits.size, 1 / 3);
  assert.equal(sourceUnits.size / completedUnits.size, 1 / 3);
  const initialFlows = new Set(
    records
      .filter(
        (event) =>
          event.event === "artifact_created" && event.storyRole === "initial",
      )
      .map((event) => event.flowId),
  );
  const alternateRequestFlows = new Set(
    records
      .filter((event) => event.event === "alternate_requested")
      .map((event) => event.flowId),
  );
  assert.equal(alternateRequestFlows.size / initialFlows.size, 1 / 2);
}

async function checkPublicEmitterIdempotency(): Promise<void> {
  process.env.PERSISTENCE = "memory";
  const flow = createTelemetryFlowId();
  const event: ProductEvent = { event: "story_completed", storyRole: "initial" };
  assert.equal(await recordProductEvent({ flowId: flow, event }), "created");
  await new Promise((resolveDelay) => setTimeout(resolveDelay, 2));
  assert.equal(await recordProductEvent({ flowId: flow, event }), "duplicate");
  const rows = listMemoryProductEvents().filter(
    (candidate) => candidate.flowId === flow && candidate.event === event.event,
  );
  assert.equal(rows.length, 1);
  assert.match(
    rows[0].eventId,
    /^tev_[0-9a-f]{16}_[0-9a-f]{32}_[0-9a-f]{64}$/,
  );

  const repeatableCases: Array<{
    event: ProductEvent;
    flowId: TelemetryFlowId | null;
  }> = [
    { event: { event: "crisis_intercepted" }, flowId: null },
    {
      event: {
        event: "rate_limited",
        operation: "intake",
        limitScope: "ip",
      },
      flowId: null,
    },
    {
      event: {
        event: "flow_failed",
        domain: "composition",
        errorClass: "timeout",
        statusBucket: "timeout",
        latencyBucket: "8to15s",
      },
      flowId: flow,
    },
  ];
  for (const repeatable of repeatableCases) {
    const occurrenceId = createTelemetryOccurrenceId();
    const storedEventId = deriveProductEventId(
      repeatable.event,
      repeatable.flowId,
      occurrenceId,
    );
    assert.match(
      occurrenceId,
      /^toc_[0-9a-f]{16}_[0-9a-f]{32}_[0-9a-f]{64}$/,
    );
    assert.equal(
      await recordProductEvent({ ...repeatable, occurrenceId }),
      "created",
    );
    assert.equal(
      await recordProductEvent({ ...repeatable, occurrenceId }),
      "duplicate",
    );
    assert.equal(
      listMemoryProductEvents().filter(
        (candidate) => candidate.eventId === storedEventId,
      ).length,
      1,
    );
    await assert.rejects(() => recordProductEvent(repeatable));
  }
  const flowDerivedEventId = deriveProductEventId(event, flow);
  await assert.rejects(() =>
    recordProductEvent({
      event: { event: "crisis_intercepted" },
      flowId: null,
      occurrenceId:
        flowDerivedEventId as unknown as TelemetryOccurrenceId,
    }),
  );

  const attemptId = createGenerationAttemptId();
  const attempt: GenerationAttempt = {
    operation: "compose",
    recipeId,
    provider: "cerebras",
    outcome: "success",
    attempt: "first",
    latencyBucket: "1to3s",
    statusBucket: "ok",
    errorClass: "none",
    fallbackReason: "none",
    validationOutcome: "passed",
    costMicros: 100,
  };
  assert.equal(
    await recordGenerationAttempt({ attemptId, attempt }),
    "created",
  );
  await new Promise((resolveDelay) => setTimeout(resolveDelay, 2));
  assert.equal(
    await recordGenerationAttempt({ attemptId, attempt }),
    "duplicate",
  );
  assert.equal(
    listMemoryGenerationAttempts().filter(
      (candidate) => candidate.attemptId === attemptId,
    ).length,
    1,
  );
}

function checkSigningKeyRotation(): void {
  const oldCurrent = process.env.TELEMETRY_ID_SECRET;
  const oldPrevious = process.env.TELEMETRY_ID_PREVIOUS_SECRETS;
  const firstKey = "a".repeat(64);
  const nextKey = "b".repeat(64);
  try {
    process.env.TELEMETRY_ID_SECRET = firstKey;
    delete process.env.TELEMETRY_ID_PREVIOUS_SECRETS;
    const oldFlow = createTelemetryFlowId();
    const oldDeletionId = createDeletionCorrelationId();
    const oldOccurrenceId = createTelemetryOccurrenceId();
    const milestone: ProductEvent = {
      event: "story_completed",
      storyRole: "initial",
    };
    const oldEventId = deriveProductEventId(milestone, oldFlow);
    const crisisEvent: ProductEvent = { event: "crisis_intercepted" };
    const oldCrisisEventId = deriveProductEventId(
      crisisEvent,
      null,
      oldOccurrenceId,
    );

    process.env.TELEMETRY_ID_SECRET = nextKey;
    process.env.TELEMETRY_ID_PREVIOUS_SECRETS = firstKey;
    assert.equal(parseTelemetryFlowId(oldFlow), oldFlow);
    assert.equal(deriveProductEventId(milestone, oldFlow), oldEventId);
    assert.equal(
      deriveProductEventId(crisisEvent, null, oldOccurrenceId),
      oldCrisisEventId,
    );
    assert.equal(
      parseProductEvent({
        event: "deletion_completed",
        deletionId: oldDeletionId,
        scope: "story",
        latencyBucket: "lt250ms",
      }).event,
      "deletion_completed",
    );

    delete process.env.TELEMETRY_ID_PREVIOUS_SECRETS;
    expectReject(
      () => parseTelemetryFlowId(oldFlow),
      "retired signing key accepted outside the verification ring",
    );
    expectReject(
      () => parseTelemetryFlowIdForRetirement(oldFlow),
      "retirement parser accepted a flow signed by a retired key",
    );
  } finally {
    if (oldCurrent === undefined) delete process.env.TELEMETRY_ID_SECRET;
    else process.env.TELEMETRY_ID_SECRET = oldCurrent;
    if (oldPrevious === undefined) {
      delete process.env.TELEMETRY_ID_PREVIOUS_SECRETS;
    } else {
      process.env.TELEMETRY_ID_PREVIOUS_SECRETS = oldPrevious;
    }
  }
}

function checkDatabaseAndStaticPrivacyContract(): void {
  const migration = readFileSync(
    resolve("supabase/migrations/0010_privacy_safe_telemetry.sql"),
    "utf8",
  );
  const types = readFileSync(resolve("lib/telemetry-types.ts"), "utf8");
  assert(!/^\s*\w+\s+jsonb\b/gim.test(migration), "telemetry SQL has a JSONB column");
  assert(!/^\s*(payload|properties|metadata|message|text|error|exception)\s+/gim.test(migration));
  assert.match(migration, /product_events_exact_shape/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /force row level security/);
  assert.match(migration, /revoke all on table public\.product_events from public, anon, authenticated/);
  assert.match(migration, /grant select, insert, delete on table public\.product_events to service_role/);
  assert.match(migration, /Telemetry rows are immutable/);
  assert.match(migration, /interval '30 days'/);
  assert.match(migration, /interval '14 days'/);
  assert.match(migration, /delete_expired_telemetry/);
  assert.match(migration, /set_telemetry_retention_window/);
  const sqlRecipeIds = [...migration.matchAll(/recipe_id\s*=\s*'([^']+)'/g)]
    .map((match) => match[1]);
  assert.equal(sqlRecipeIds.length, 2, "SQL recipe constraints changed shape");
  assert(
    sqlRecipeIds.every((candidate) => candidate === recipeId),
    "SQL recipe differs from approved runtime recipe",
  );
  const eventRegistry = /event_name text not null check \(event_name in \(([\s\S]*?)\)\),/.exec(
    migration,
  );
  assert(eventRegistry, "SQL product-event registry is missing");
  const sqlEventNames = [...eventRegistry[1].matchAll(/'([^']+)'/g)]
    .map((match) => match[1]);
  assert.equal(
    sqlEventNames.length,
    PRODUCT_EVENT_NAMES.length,
    "SQL product-event registry contains duplicates or extra names",
  );
  assert.deepEqual(
    [...sqlEventNames].sort(),
    [...PRODUCT_EVENT_NAMES].sort(),
    "SQL and TypeScript product-event registries differ",
  );
  assert(!/\b(user_id|session_id|figure_key|stage_id|story_spec_id)\b/i.test(migration));
  assert(!/\[\s*key\s*:/i.test(types), "public telemetry types contain an index signature");
  for (const field of forbiddenFields) {
    assert(
      !new RegExp(`\\b${field}\\??\\s*:`, "i").test(types),
      `telemetry type exposes forbidden field ${field}`,
    );
  }

  const row = toProductEventRow(
    createProductEventRecord({
      eventId: createTelemetryEventId(),
      flowId,
      event: { event: "feedback_submitted", storyRole: "initial", verdict: "felt_close" },
    }),
  );
  assert(!("payload" in row));
  assert(!("user_id" in row));
  assert(!("session_id" in row));
}

async function main(): Promise<void> {
  checkExactSchemas();
  checkEnvelopeAndRetention();
  checkReductions();
  checkGenerationSchema();
  checkMemoryStore();
  checkMetricFixture();
  checkSigningKeyRotation();
  checkDatabaseAndStaticPrivacyContract();
  await checkPublicEmitterIdempotency();
  console.log(
    `Telemetry contract OK: ${validEvents.length} exact product events, closed operational attempts, forbidden-field rejection, reduction, retention, retry/rotation, metric-unit, and SQL registry/privacy checks`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
