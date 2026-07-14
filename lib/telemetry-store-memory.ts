import "server-only";
import { isDeepStrictEqual } from "node:util";
import type {
  GenerationAttemptRecord,
  ProductEventRecord,
  TelemetryFlowId,
} from "./telemetry-types";

export type TelemetryWriteResult = "created" | "duplicate" | "conflict";

declare global {
  var __onwardProductEvents: Map<string, Readonly<ProductEventRecord>> | undefined;
  var __onwardGenerationAttempts:
    | Map<string, Readonly<GenerationAttemptRecord>>
    | undefined;
}

const productEvents =
  globalThis.__onwardProductEvents ??
  (globalThis.__onwardProductEvents = new Map());
const generationAttempts =
  globalThis.__onwardGenerationAttempts ??
  (globalThis.__onwardGenerationAttempts = new Map());

export function appendMemoryProductEvent(
  record: Readonly<ProductEventRecord>,
): TelemetryWriteResult {
  pruneMemoryTelemetry();
  const existing = productEvents.get(record.eventId);
  if (existing) return sameProductEvent(existing, record) ? "duplicate" : "conflict";
  productEvents.set(record.eventId, freezeClone(record));
  return "created";
}

export function appendMemoryGenerationAttempt(
  record: Readonly<GenerationAttemptRecord>,
): TelemetryWriteResult {
  pruneMemoryTelemetry();
  const existing = generationAttempts.get(record.attemptId);
  if (existing) {
    return sameTelemetryRecord(existing, record) ? "duplicate" : "conflict";
  }
  generationAttempts.set(record.attemptId, freezeClone(record));
  return "created";
}

export function listMemoryProductEvents(): ReadonlyArray<Readonly<ProductEventRecord>> {
  pruneMemoryTelemetry();
  return Object.freeze([...productEvents.values()].map(freezeClone));
}

export function listMemoryGenerationAttempts(): ReadonlyArray<
  Readonly<GenerationAttemptRecord>
> {
  pruneMemoryTelemetry();
  return Object.freeze([...generationAttempts.values()].map(freezeClone));
}

export function deleteMemoryProductEventsForFlow(flowId: TelemetryFlowId): number {
  let deleted = 0;
  for (const [eventId, event] of productEvents) {
    if (event.flowId === flowId) {
      productEvents.delete(eventId);
      deleted += 1;
    }
  }
  return deleted;
}

export function pruneMemoryTelemetry(now = Date.now()): void {
  for (const [eventId, event] of productEvents) {
    if (Date.parse(event.expiresAt) <= now) productEvents.delete(eventId);
  }
  for (const [attemptId, attempt] of generationAttempts) {
    if (Date.parse(attempt.expiresAt) <= now) generationAttempts.delete(attemptId);
  }
}

function freezeClone<T extends object>(value: T): Readonly<T> {
  return Object.freeze(structuredClone(value));
}

function sameProductEvent(
  left: Readonly<ProductEventRecord>,
  right: Readonly<ProductEventRecord>,
): boolean {
  return sameTelemetryRecord(left, right);
}

function sameTelemetryRecord<T extends { occurredAt: string; expiresAt: string }>(
  left: Readonly<T>,
  right: Readonly<T>,
): boolean {
  const leftSemantic: Record<string, unknown> = { ...left };
  const rightSemantic: Record<string, unknown> = { ...right };
  delete leftSemantic.occurredAt;
  delete leftSemantic.expiresAt;
  delete rightSemantic.occurredAt;
  delete rightSemantic.expiresAt;
  return isDeepStrictEqual(leftSemantic, rightSemantic);
}
