import "server-only";
import { persistenceMode } from "./persistence";
import {
  createGenerationAttemptRecord,
  createProductEventRecord,
  parseProductEvent,
} from "./telemetry-schema";
import {
  deriveProductEventId,
  issueDeletionCorrelationId,
  issueGenerationAttemptId,
  issueTelemetryEventId,
  issueTelemetryFlowId,
  issueTelemetryOccurrenceId,
  parseTelemetryFlowId,
} from "./telemetry-id";
import {
  appendMemoryGenerationAttempt,
  appendMemoryProductEvent,
  deleteMemoryProductEventsForFlow,
  type TelemetryWriteResult,
} from "./telemetry-store-memory";
import {
  appendSupabaseGenerationAttempt,
  appendSupabaseProductEvent,
  deleteSupabaseProductEventsForFlow,
} from "./telemetry-store-supabase";
import type {
  DeletionCorrelationId,
  GenerationAttempt,
  GenerationAttemptId,
  ProductEvent,
  TelemetryEventId,
  TelemetryFlowId,
  TelemetryOccurrenceId,
} from "./telemetry-types";

export async function recordProductEvent(input: {
  event: ProductEvent;
  flowId: TelemetryFlowId | null;
  occurrenceId?: TelemetryOccurrenceId;
}): Promise<TelemetryWriteResult> {
  const event = parseProductEvent(input.event);
  const record = createProductEventRecord({
    event,
    flowId: input.flowId,
    eventId: deriveProductEventId(event, input.flowId, input.occurrenceId),
  });
  return persistenceMode() === "supabase"
    ? appendSupabaseProductEvent(record)
    : appendMemoryProductEvent(record);
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
): Promise<number> {
  const safeFlowId = parseTelemetryFlowId(flowId);
  return persistenceMode() === "supabase"
    ? deleteSupabaseProductEventsForFlow(safeFlowId)
    : deleteMemoryProductEventsForFlow(safeFlowId);
}

export function createTelemetryFlowId(): TelemetryFlowId {
  return issueTelemetryFlowId();
}

export function createDeletionCorrelationId(): DeletionCorrelationId {
  return issueDeletionCorrelationId();
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
