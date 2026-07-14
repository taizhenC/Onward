import "server-only";
import { isDeepStrictEqual } from "node:util";
import {
  deriveProductEventSemanticKey,
  parseTelemetryEventId,
  parseTelemetryOutboxLeaseId,
} from "./telemetry-id";
import { isActiveMemoryTelemetryFlow } from "./telemetry-flow-state-memory";
import { TELEMETRY_ERROR_CLASSES } from "./telemetry-types";
import type {
  ClaimedProductEvent,
  GenerationAttemptRecord,
  ProductEventOutboxPointer,
  ProductEventRecord,
  TelemetryErrorClass,
  TelemetryEventId,
  TelemetryFlowId,
  TelemetryOutboxLeaseId,
  TelemetryOutboxAckResult,
  TelemetryOutboxNackResult,
} from "./telemetry-types";

export type TelemetryWriteResult = "created" | "duplicate" | "conflict";

type MemoryProductEventOutboxPointer = {
  eventId: TelemetryEventId;
  status: ProductEventOutboxPointer["status"];
  attemptCount: number;
  nextAttemptAt: string;
  leaseId: TelemetryOutboxLeaseId | null;
  leaseExpiresAt: string | null;
  lastErrorClass: Exclude<TelemetryErrorClass, "none"> | null;
};

declare global {
  var __onwardProductEvents: Map<string, Readonly<ProductEventRecord>> | undefined;
  var __onwardGenerationAttempts:
    | Map<string, Readonly<GenerationAttemptRecord>>
    | undefined;
  var __onwardProductEventOutbox:
    | Map<string, MemoryProductEventOutboxPointer>
    | undefined;
}

const productEvents =
  globalThis.__onwardProductEvents ??
  (globalThis.__onwardProductEvents = new Map());
const generationAttempts =
  globalThis.__onwardGenerationAttempts ??
  (globalThis.__onwardGenerationAttempts = new Map());
const productEventOutbox =
  globalThis.__onwardProductEventOutbox ??
  (globalThis.__onwardProductEventOutbox = new Map());

export function appendMemoryProductEvent(
  record: Readonly<ProductEventRecord>,
): TelemetryWriteResult {
  return appendMemoryProductEventWithPolicy(record, false);
}

// Memory-mode domain transitions need the same all-or-nothing behavior as a
// Postgres RPC. Validate the complete batch before mutating either the event
// map or pointer-only outbox; duplicate replays still restore a missing
// pointer without requeueing one already marked delivered.
export function appendMemoryProductEventsAtomically(
  records: ReadonlyArray<Readonly<ProductEventRecord>>,
  now = Date.now(),
): TelemetryWriteResult {
  pruneMemoryTelemetry(now);
  const batchIds = new Map<string, Readonly<ProductEventRecord>>();
  const batchSemanticKeys = new Map<string, Readonly<ProductEventRecord>>();

  for (const record of records) {
    if (
      record.flowId !== null &&
      !isActiveMemoryTelemetryFlow(record.flowId, now)
    ) {
      return "conflict";
    }
    const duplicateBatchId = batchIds.get(record.eventId);
    if (duplicateBatchId && !sameProductEvent(duplicateBatchId, record)) {
      return "conflict";
    }
    batchIds.set(record.eventId, record);

    const existing = productEvents.get(record.eventId);
    if (existing && !sameProductEvent(existing, record)) return "conflict";

    const semanticKey = deriveProductEventSemanticKey(record, record.flowId);
    if (semanticKey === null) continue;
    const duplicateBatchSemantic = batchSemanticKeys.get(semanticKey);
    if (
      duplicateBatchSemantic &&
      duplicateBatchSemantic.eventId !== record.eventId
    ) {
      return "conflict";
    }
    batchSemanticKeys.set(semanticKey, record);
    const semanticExisting = [...productEvents.values()].find((candidate) => {
      if (candidate.flowId === null) return false;
      return (
        deriveProductEventSemanticKey(candidate, candidate.flowId) ===
        semanticKey
      );
    });
    if (semanticExisting && semanticExisting.eventId !== record.eventId) {
      return "conflict";
    }
  }

  let created = false;
  for (const record of records) {
    if (!productEvents.has(record.eventId)) {
      productEvents.set(record.eventId, freezeClone(record));
      created = true;
    }
    if (!productEventOutbox.has(record.eventId)) {
      productEventOutbox.set(record.eventId, pendingPointer(record));
    }
  }
  return created ? "created" : "duplicate";
}

// Domain transactions may need to complete after a response-loss retry has
// recomputed different measured dimensions for the same semantic event. This
// narrow path preserves the first accepted measurement while still proving
// that the existing row owns the same flow-scoped semantic unit.
export function reconcileMemoryMatchEventFirstWriteWins(
  record: Readonly<ProductEventRecord>,
): TelemetryWriteResult {
  if (record.event !== "match_completed") {
    throw new Error("first-write-wins reconciliation requires a match event");
  }
  return appendMemoryProductEventWithPolicy(record, true);
}

function appendMemoryProductEventWithPolicy(
  record: Readonly<ProductEventRecord>,
  preserveFirstMeasurement: boolean,
): TelemetryWriteResult {
  pruneMemoryTelemetry();
  if (record.flowId !== null && !isActiveMemoryTelemetryFlow(record.flowId)) {
    return "conflict";
  }
  const semanticKey = deriveProductEventSemanticKey(record, record.flowId);
  const existing = productEvents.get(record.eventId);
  if (existing) {
    if (
      !sameProductEvent(existing, record) &&
      (!preserveFirstMeasurement ||
        semanticKey === null ||
        deriveProductEventSemanticKey(existing, existing.flowId) !== semanticKey)
    ) {
      return "conflict";
    }
    // Reconcile an older in-memory event that predates the pointer map. A
    // delivered pointer is never removed, so normal duplicate capture cannot
    // requeue an acknowledged event.
    if (!productEventOutbox.has(record.eventId)) {
      productEventOutbox.set(record.eventId, pendingPointer(record));
    }
    return "duplicate";
  }
  if (semanticKey !== null) {
    const semanticExisting = [...productEvents.values()].find(
      (candidate) =>
        candidate.flowId !== null &&
        deriveProductEventSemanticKey(candidate, candidate.flowId) ===
          semanticKey,
    );
    if (semanticExisting) {
      if (!preserveFirstMeasurement) return "conflict";
      if (!productEventOutbox.has(semanticExisting.eventId)) {
        productEventOutbox.set(
          semanticExisting.eventId,
          pendingPointer(semanticExisting),
        );
      }
      return "duplicate";
    }
  }
  productEvents.set(record.eventId, freezeClone(record));
  productEventOutbox.set(record.eventId, pendingPointer(record));
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

export function listMemoryProductEventOutbox(): ReadonlyArray<
  Readonly<ProductEventOutboxPointer>
> {
  pruneMemoryTelemetry();
  return Object.freeze(
    [...productEventOutbox.values()]
      .sort(compareOutboxPointers)
      .map((pointer) => freezeClone(pointer)),
  );
}

export function claimMemoryProductEventOutbox(input: {
  leaseId: TelemetryOutboxLeaseId;
  limit: number;
  now?: Date;
}): ReadonlyArray<Readonly<ClaimedProductEvent>> {
  const leaseId = parseTelemetryOutboxLeaseId(input.leaseId);
  const limit = parseClaimLimit(input.limit);
  const now = parseOutboxNow(input.now);
  pruneMemoryTelemetry(now);
  const leaseExpiresAt = new Date(now + OUTBOX_LEASE_MS).toISOString();
  const claimed: Array<Readonly<ClaimedProductEvent>> = [];

  for (const pointer of [...productEventOutbox.values()].sort(
    compareOutboxPointers,
  )) {
    if (claimed.length >= limit) break;
    const claimablePending =
      pointer.status === "pending" && Date.parse(pointer.nextAttemptAt) <= now;
    const claimableExpiredLease =
      pointer.status === "leased" &&
      pointer.leaseExpiresAt !== null &&
      Date.parse(pointer.leaseExpiresAt) <= now;
    if (
      pointer.status === "leased" &&
      claimableExpiredLease &&
      pointer.attemptCount >= OUTBOX_MAX_ATTEMPTS
    ) {
      exhaustPointer(pointer, now, "timeout");
      continue;
    }
    if (
      pointer.status === "pending" &&
      pointer.attemptCount >= OUTBOX_MAX_ATTEMPTS
    ) {
      exhaustPointer(pointer, now);
      continue;
    }
    if (
      pointer.attemptCount >= OUTBOX_MAX_ATTEMPTS ||
      (!claimablePending && !claimableExpiredLease)
    ) continue;
    const event = productEvents.get(pointer.eventId);
    if (!event) {
      productEventOutbox.delete(pointer.eventId);
      continue;
    }
    pointer.status = "leased";
    pointer.attemptCount += 1;
    pointer.leaseId = leaseId;
    pointer.leaseExpiresAt = leaseExpiresAt;
    claimed.push(claimedEvent(event, pointer));
  }
  return Object.freeze(claimed);
}

export function ackMemoryProductEventOutbox(input: {
  eventId: TelemetryEventId;
  leaseId: TelemetryOutboxLeaseId;
  now?: Date;
}): TelemetryOutboxAckResult {
  const eventId = parseTelemetryEventId(input.eventId);
  const leaseId = parseTelemetryOutboxLeaseId(input.leaseId);
  const now = parseOutboxNow(input.now);
  pruneMemoryTelemetry(now);
  const pointer = productEventOutbox.get(eventId);
  if (!pointer) return "not_found";
  if (pointer.status === "delivered") return "duplicate";
  if (pointer.status === "exhausted") return "exhausted";
  if (pointer.status !== "leased" || pointer.leaseId !== leaseId) return "stale";
  if (
    pointer.leaseExpiresAt === null ||
    Date.parse(pointer.leaseExpiresAt) <= now
  ) {
    if (pointer.attemptCount >= OUTBOX_MAX_ATTEMPTS) {
      exhaustPointer(pointer, now, "timeout");
      return "exhausted";
    }
    return "stale";
  }
  pointer.status = "delivered";
  pointer.leaseId = null;
  pointer.leaseExpiresAt = null;
  return "acknowledged";
}

export function nackMemoryProductEventOutbox(input: {
  eventId: TelemetryEventId;
  leaseId: TelemetryOutboxLeaseId;
  errorClass: Exclude<TelemetryErrorClass, "none">;
  now?: Date;
}): TelemetryOutboxNackResult {
  const eventId = parseTelemetryEventId(input.eventId);
  const leaseId = parseTelemetryOutboxLeaseId(input.leaseId);
  const errorClass = parseOutboxErrorClass(input.errorClass);
  const now = parseOutboxNow(input.now);
  pruneMemoryTelemetry(now);
  const pointer = productEventOutbox.get(eventId);
  if (!pointer) return "not_found";
  if (pointer.status === "delivered") return "delivered";
  if (pointer.status === "exhausted") return "exhausted";
  if (pointer.status !== "leased" || pointer.leaseId !== leaseId) return "stale";
  if (pointer.attemptCount >= OUTBOX_MAX_ATTEMPTS) {
    pointer.lastErrorClass = errorClass;
    exhaustPointer(pointer, now);
    return "exhausted";
  }
  pointer.status = "pending";
  pointer.nextAttemptAt = new Date(
    now + retryBackoffMs(pointer.attemptCount),
  ).toISOString();
  pointer.leaseId = null;
  pointer.leaseExpiresAt = null;
  pointer.lastErrorClass = errorClass;
  return "released";
}

export function deleteMemoryProductEventsForFlow(flowId: TelemetryFlowId): number {
  let deleted = 0;
  for (const [eventId, event] of productEvents) {
    if (event.flowId === flowId) {
      productEvents.delete(eventId);
      productEventOutbox.delete(eventId);
      deleted += 1;
    }
  }
  return deleted;
}

export function pruneMemoryTelemetry(now = Date.now()): void {
  for (const [eventId, event] of productEvents) {
    if (
      Date.parse(event.expiresAt) <= now ||
      (event.flowId !== null && !isActiveMemoryTelemetryFlow(event.flowId, now))
    ) {
      productEvents.delete(eventId);
      productEventOutbox.delete(eventId);
    }
  }
  for (const [attemptId, attempt] of generationAttempts) {
    if (Date.parse(attempt.expiresAt) <= now) generationAttempts.delete(attemptId);
  }
  for (const eventId of productEventOutbox.keys()) {
    if (!productEvents.has(eventId)) {
      productEventOutbox.delete(eventId);
    }
  }
}

function pendingPointer(
  record: Readonly<ProductEventRecord>,
): MemoryProductEventOutboxPointer {
  return {
    eventId: record.eventId,
    status: "pending",
    attemptCount: 0,
    nextAttemptAt: record.occurredAt,
    leaseId: null,
    leaseExpiresAt: null,
    lastErrorClass: null,
  };
}

function claimedEvent(
  record: Readonly<ProductEventRecord>,
  pointer: MemoryProductEventOutboxPointer,
): Readonly<ClaimedProductEvent> {
  return freezeClone({
    ...record,
    attemptCount: pointer.attemptCount,
    leaseId: pointer.leaseId as TelemetryOutboxLeaseId,
  }) as Readonly<ClaimedProductEvent>;
}

function exhaustPointer(
  pointer: MemoryProductEventOutboxPointer,
  now: number,
  errorClass?: Exclude<TelemetryErrorClass, "none">,
): void {
  pointer.status = "exhausted";
  pointer.nextAttemptAt = new Date(now).toISOString();
  pointer.leaseId = null;
  pointer.leaseExpiresAt = null;
  pointer.lastErrorClass ??= errorClass ?? "timeout";
}

function compareOutboxPointers(
  left: MemoryProductEventOutboxPointer,
  right: MemoryProductEventOutboxPointer,
): number {
  return (
    left.nextAttemptAt.localeCompare(right.nextAttemptAt) ||
    left.eventId.localeCompare(right.eventId)
  );
}

function parseClaimLimit(value: number): number {
  if (!Number.isInteger(value) || value < 1 || value > 100) {
    throw new Error("telemetry outbox claim limit must be between 1 and 100");
  }
  return value;
}

function parseOutboxNow(value: Date | undefined): number {
  const now = value?.getTime() ?? Date.now();
  if (!Number.isFinite(now)) throw new Error("telemetry outbox time is invalid");
  return now;
}

function parseOutboxErrorClass(
  value: unknown,
): Exclude<TelemetryErrorClass, "none"> {
  if (
    typeof value !== "string" ||
    value === "none" ||
    !(TELEMETRY_ERROR_CLASSES as readonly string[]).includes(value)
  ) {
    throw new Error("telemetry outbox error class is not approved");
  }
  return value as Exclude<TelemetryErrorClass, "none">;
}

function retryBackoffMs(attemptCount: number): number {
  return OUTBOX_RETRY_BACKOFF_MS[
    Math.min(Math.max(attemptCount - 1, 0), OUTBOX_RETRY_BACKOFF_MS.length - 1)
  ];
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

const OUTBOX_LEASE_MS = 60_000;
const OUTBOX_MAX_ATTEMPTS = 20;
const OUTBOX_RETRY_BACKOFF_MS = [5_000, 30_000, 120_000, 600_000, 3_600_000] as const;
