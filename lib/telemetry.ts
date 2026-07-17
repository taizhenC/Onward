import "server-only";
import { persistenceMode } from "./persistence";
import {
  createGenerationAttemptRecord,
  createProductEventRecord,
  parseProductEvent,
} from "./telemetry-schema";
import {
  deriveProductEventId,
  deriveDeletionCorrelationId,
  issueDeletionCorrelationId,
  issueGenerationAttemptId,
  issueTelemetryEventId,
  issueTelemetryFlowId,
  issueTelemetryOccurrenceId,
  issueTelemetryOutboxLeaseId,
} from "./telemetry-id";
import {
  ackMemoryProductEventOutbox,
  appendMemoryGenerationAttempt,
  appendMemoryProductEvent,
  appendMemoryProductEventsAtomically,
  claimMemoryProductEventOutbox,
  nackMemoryProductEventOutbox,
  reconcileMemoryMatchEventFirstWriteWins as reconcileMemoryMatchEventRecord,
  reconcileMemoryAlternateResolvedEventFirstWriteWins as reconcileMemoryAlternateResolvedEventRecord,
  type TelemetryWriteResult,
} from "./telemetry-store-memory";
import {
  ackSupabaseProductEventOutbox,
  appendSupabaseGenerationAttempt,
  appendSupabaseProductEvent,
  claimSupabaseProductEventOutbox,
  nackSupabaseProductEventOutbox,
} from "./telemetry-store-supabase";
import {
  registerTelemetryFlow,
  revokeTelemetryFlow,
} from "./telemetry-flow-lifecycle";
import { PRODUCT_EVENT_SCHEMA_VERSION } from "./telemetry-types";
import type {
  ClaimedProductEvent,
  DeletionCorrelationId,
  GenerationAttempt,
  GenerationAttemptId,
  ProductEvent,
  ProductEventCapture,
  ProductEventRecord,
  TelemetryEventId,
  TelemetryFlowId,
  TelemetryOccurrenceId,
  TelemetryOutboxLeaseId,
  TelemetryErrorClass,
  TelemetryOutboxAckResult,
  TelemetryOutboxNackResult,
} from "./telemetry-types";

// Builds the exact, HMAC-authenticated capture passed into a domain RPC that
// commits telemetry in the same database transaction as its authoritative
// state change. Unlike recordProductEvent(), this does not register or write a
// flow; the receiving RPC must verify the active owner/root binding itself.
export function prepareProductEventCapture<Event extends ProductEvent>(input: {
  event: Event;
  flowId: TelemetryFlowId | null;
  occurrenceId?: TelemetryOccurrenceId;
}): Readonly<ProductEventCapture<Event>> {
  const event = parseProductEvent(input.event) as Readonly<Event>;
  const record = createProductEventRecord({
    event,
    flowId: input.flowId,
    eventId: deriveProductEventId(event, input.flowId, input.occurrenceId),
  });
  const { occurredAt, expiresAt, ...capture } = record;
  void occurredAt;
  void expiresAt;
  return Object.freeze(capture) as Readonly<ProductEventCapture<Event>>;
}

export async function recordProductEvent(input: {
  event: ProductEvent;
  flowId: TelemetryFlowId | null;
  occurrenceId?: TelemetryOccurrenceId;
}): Promise<TelemetryWriteResult> {
  const event = parseProductEvent(input.event);
  if (input.flowId !== null) {
    const registration = await registerTelemetryFlow(input.flowId);
    if (registration !== "registered") return "conflict";
  }
  const record = createProductEventRecord({
    event,
    flowId: input.flowId,
    eventId: deriveProductEventId(event, input.flowId, input.occurrenceId),
  });
  return persistenceMode() === "supabase"
    ? appendSupabaseProductEvent(record)
    : appendMemoryProductEvent(record);
}

// A memory-backed domain store calls this immediately before its infallible
// state-map mutation. The complete event batch is preflighted and committed
// together, mirroring the transaction used by the Supabase domain RPC.
export function recordPreparedMemoryProductEventsAtomically(
  captures: ReadonlyArray<Readonly<ProductEventCapture>>,
  now = Date.now(),
): TelemetryWriteResult {
  if (persistenceMode() !== "memory") {
    throw new Error("prepared memory event transaction requires memory mode");
  }
  const records: Readonly<ProductEventRecord>[] = captures.map((capture) => {
    const { eventId, schemaVersion, flowId, ...event } = capture;
    if (schemaVersion !== PRODUCT_EVENT_SCHEMA_VERSION) {
      throw new Error("prepared product-event schema version is unsupported");
    }
    return createProductEventRecord({
      eventId,
      flowId,
      event,
      now: new Date(now),
    });
  });
  return appendMemoryProductEventsAtomically(records, now);
}

// Memory-backed domain transactions use this only when the durable product
// action must survive a retry whose non-identity measurements have drifted.
// Supabase equivalents belong inside their owning SQL transaction.
export async function reconcileMemoryMatchEventFirstWriteWins(input: {
  event: Extract<ProductEvent, { event: "match_completed" }>;
  flowId: TelemetryFlowId;
}): Promise<TelemetryWriteResult> {
  if (persistenceMode() !== "memory") {
    throw new Error("first-write-wins memory reconciliation requires memory mode");
  }
  const event = parseProductEvent(input.event);
  const registration = await registerTelemetryFlow(input.flowId);
  if (registration !== "registered") return "conflict";
  const record = createProductEventRecord({
    event,
    flowId: input.flowId,
    eventId: deriveProductEventId(event, input.flowId),
  });
  return reconcileMemoryMatchEventRecord(record);
}

export function reconcilePreparedMemoryAlternateResolvedEventFirstWriteWins(
  capture: Readonly<
    Extract<ProductEventCapture, { event: "alternate_resolved" }>
  >,
  now = Date.now(),
): TelemetryWriteResult {
  if (persistenceMode() !== "memory") {
    throw new Error(
      "alternate-resolution memory reconciliation requires memory mode",
    );
  }
  const { eventId, schemaVersion, flowId, ...event } = capture;
  if (schemaVersion !== PRODUCT_EVENT_SCHEMA_VERSION) {
    throw new Error("prepared product-event schema version is unsupported");
  }
  return reconcileMemoryAlternateResolvedEventRecord(
    createProductEventRecord({
      eventId,
      flowId,
      event,
      now: new Date(now),
    }),
  );
}

export async function recordGenerationAttempt(input: {
  attempt: GenerationAttempt;
  attemptId: GenerationAttemptId;
}): Promise<TelemetryWriteResult> {
  const record = createGenerationAttemptRecord({
    attempt: input.attempt,
    attemptId: input.attemptId,
  });
  return persistenceMode() === "supabase"
    ? appendSupabaseGenerationAttempt(record)
    : appendMemoryGenerationAttempt(record);
}

export async function deleteProductEventsForFlow(
  flowId: TelemetryFlowId,
  userId: string | null = null,
): Promise<number> {
  const result = await revokeTelemetryFlow(flowId, userId);
  if (result === "conflict") {
    throw new Error("telemetry flow revocation owner conflicted");
  }
  return result === "revoked" ? 1 : 0;
}

export async function claimProductEventOutbox(input: {
  leaseId: TelemetryOutboxLeaseId;
  limit: number;
}): Promise<ReadonlyArray<Readonly<ClaimedProductEvent>>> {
  return persistenceMode() === "supabase"
    ? claimSupabaseProductEventOutbox(input)
    : claimMemoryProductEventOutbox(input);
}

export async function ackProductEventOutbox(input: {
  eventId: TelemetryEventId;
  leaseId: TelemetryOutboxLeaseId;
}): Promise<TelemetryOutboxAckResult> {
  return persistenceMode() === "supabase"
    ? ackSupabaseProductEventOutbox(input)
    : ackMemoryProductEventOutbox(input);
}

export async function nackProductEventOutbox(input: {
  eventId: TelemetryEventId;
  leaseId: TelemetryOutboxLeaseId;
  errorClass: Exclude<TelemetryErrorClass, "none">;
}): Promise<TelemetryOutboxNackResult> {
  return persistenceMode() === "supabase"
    ? nackSupabaseProductEventOutbox(input)
    : nackMemoryProductEventOutbox(input);
}

export function createTelemetryFlowId(): TelemetryFlowId {
  return issueTelemetryFlowId();
}

export function createDeletionCorrelationId(): DeletionCorrelationId {
  return issueDeletionCorrelationId();
}

export function createDeletionCorrelationIdForRequest(
  seed: string,
): DeletionCorrelationId {
  return deriveDeletionCorrelationId(seed);
}

export function createGenerationAttemptId(): GenerationAttemptId {
  return issueGenerationAttemptId();
}

export function createTelemetryEventId(): TelemetryEventId {
  return issueTelemetryEventId();
}

export function createTelemetryOccurrenceId(): TelemetryOccurrenceId {
  return issueTelemetryOccurrenceId();
}

export function createTelemetryOutboxLeaseId(): TelemetryOutboxLeaseId {
  return issueTelemetryOutboxLeaseId();
}
