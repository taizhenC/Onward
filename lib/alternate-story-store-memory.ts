import "server-only";
import { isDeepStrictEqual } from "node:util";
import { getMemoryResonanceFeedbackForSession } from "./resonance-feedback-store-memory";
import {
  ALTERNATE_STORY_MAX_ATTEMPTS,
  ALTERNATE_STORY_RETRY_COOLDOWN_MS,
  type AlternateStoryFlowStatus,
} from "./alternate-story-types";
import type {
  AlternateReadyTelemetry,
  AlternateRequestedTelemetryCapture,
  AlternateResolvedTelemetryCapture,
} from "./alternate-story-telemetry";
import { getOwnedMemoryTelemetryFlowBindingByRoot } from "./telemetry-flow-binding-memory";
import { telemetryFlowBindingEnabled } from "./telemetry-flow-lifecycle";
import {
  reconcilePreparedMemoryAlternateResolvedEventFirstWriteWins,
  recordPreparedMemoryProductEventsAtomically,
} from "./telemetry";
import {
  alternateResolvedEvent,
  artifactCreatedEvent,
} from "./telemetry-producers";
import { deleteMemoryStoryArtifact } from "./story-artifact-store-memory";
import type { StoryArtifact } from "./story-artifact-types";
import type { MemoryTelemetryFlowBinding } from "./telemetry-flow-binding-memory";

export type StoredAlternateStoryFlow = {
  userId: string;
  sourceSessionId: string;
  sourceArtifactId: string;
  tokenHash: string;
  policyVersion: string;
  status: AlternateStoryFlowStatus;
  attemptCount: number;
  leaseId: string | null;
  leaseExpiresAt: number | null;
  nextAttemptAt: number | null;
  resultSessionId: string | null;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
  contextExpiresAt: number;
};

export type AlternateFlowIssueResult =
  | { status: "available"; expiresAt: number }
  | { status: "preparing"; retryAfterMs: number }
  | { status: "ready"; sessionId: string }
  | { status: "unavailable" }
  | { status: "expired" }
  | { status: "exhausted" }
  | { status: "not_found" };

export type AlternateFlowClaimResult =
  | { status: "claimed" }
  | { status: "preparing"; retryAfterMs: number }
  | { status: "cooldown"; retryAfterMs: number }
  | { status: "ready"; sessionId: string }
  | { status: "unavailable" }
  | { status: "expired" }
  | { status: "exhausted" }
  | { status: "not_found" };

declare global {
  var __onwardAlternateStoryFlows:
    | Map<string, StoredAlternateStoryFlow>
    | undefined;
}

const flows =
  globalThis.__onwardAlternateStoryFlows ??
  (globalThis.__onwardAlternateStoryFlows = new Map());

export function issueMemoryAlternateStoryFlow(input: {
  userId: string;
  sourceSessionId: string;
  sourceArtifactId: string;
  tokenHash: string;
  policyVersion: string;
  expiresAt: number;
  contextExpiresAt: number;
  allowCreate: boolean;
}): AlternateFlowIssueResult {
  const feedback = getMemoryResonanceFeedbackForSession(input.sourceSessionId);
  if (
    !feedback ||
    feedback.userId !== input.userId ||
    feedback.artifactId !== input.sourceArtifactId ||
    feedback.verdict !== "not_close"
  ) {
    return { status: "not_found" };
  }

  const existing = flows.get(input.sourceSessionId);
  if (existing) {
    if (!sameSourceIdentity(existing, input)) return { status: "not_found" };
    if (existing.status === "ready" && existing.resultSessionId) {
      return { status: "ready", sessionId: existing.resultSessionId };
    }
    const now = Date.now();
    if (
      existing.status === "unavailable" ||
      (existing.status === "ready" && !existing.resultSessionId)
    ) {
      return { status: "unavailable" };
    }
    if (existing.tokenHash !== input.tokenHash) return { status: "expired" };
    if (
      existing.status === "preparing" &&
      existing.leaseExpiresAt !== null &&
      existing.leaseExpiresAt > now
    ) {
      return {
        status: "preparing",
        retryAfterMs: existing.leaseExpiresAt - now,
      };
    }
    if (existing.expiresAt <= now) return { status: "expired" };
    if (existing.attemptCount >= ALTERNATE_STORY_MAX_ATTEMPTS) {
      return { status: "exhausted" };
    }
    if (existing.nextAttemptAt !== null && existing.nextAttemptAt > now) {
      return {
        status: "preparing",
        retryAfterMs: existing.nextAttemptAt - now,
      };
    }
    return { status: "available", expiresAt: existing.expiresAt };
  }

  const now = Date.now();
  if (!input.allowCreate) return { status: "not_found" };
  if (input.expiresAt <= now) return { status: "unavailable" };
  flows.set(input.sourceSessionId, {
    userId: input.userId,
    sourceSessionId: input.sourceSessionId,
    sourceArtifactId: input.sourceArtifactId,
    tokenHash: input.tokenHash,
    policyVersion: input.policyVersion,
    expiresAt: input.expiresAt,
    contextExpiresAt: input.contextExpiresAt,
    status: "available",
    attemptCount: 0,
    leaseId: null,
    leaseExpiresAt: null,
    nextAttemptAt: null,
    resultSessionId: null,
    createdAt: now,
    updatedAt: now,
  });
  return { status: "available", expiresAt: input.expiresAt };
}

export function claimMemoryAlternateStoryFlow(input: {
  userId: string;
  sourceSessionId: string;
  sourceArtifactId: string;
  tokenHash: string;
  policyVersion: string;
  leaseId: string;
  leaseExpiresAt: number;
  telemetry: AlternateRequestedTelemetryCapture | null;
  resolutionTelemetry: AlternateResolvedTelemetryCapture | null;
}): AlternateFlowClaimResult {
  const telemetryEnabled = telemetryFlowBindingEnabled();
  if (
    !telemetryEnabled &&
    (input.telemetry !== null || input.resolutionTelemetry !== null)
  ) {
    throw new Error("disabled alternate telemetry received a capture");
  }
  const flow = flows.get(input.sourceSessionId);
  if (!flow || !sameIdentity(flow, input)) return { status: "not_found" };
  const now = Date.now();
  if (flow.status === "ready" && flow.resultSessionId) {
    captureAlternateClaimTelemetry(
      input,
      flow,
      telemetryEnabled,
      now,
      true,
      "ready",
    );
    return { status: "ready", sessionId: flow.resultSessionId };
  }
  if (flow.status === "unavailable") {
    captureAlternateClaimTelemetry(
      input,
      flow,
      telemetryEnabled,
      now,
      true,
      "unavailable",
    );
    return { status: "unavailable" };
  }
  if (
    flow.status === "preparing" &&
    flow.leaseExpiresAt !== null &&
    flow.leaseExpiresAt > now
  ) {
    captureAlternateClaimTelemetry(input, flow, telemetryEnabled, now, true);
    return {
      status: "preparing",
      retryAfterMs: flow.leaseExpiresAt - now,
    };
  }
  if (flow.expiresAt <= now) {
    captureAlternateClaimTelemetry(
      input,
      flow,
      telemetryEnabled,
      now,
      flow.attemptCount > 0,
      "expired",
    );
    return { status: "expired" };
  }
  if (flow.attemptCount >= ALTERNATE_STORY_MAX_ATTEMPTS) {
    captureAlternateClaimTelemetry(
      input,
      flow,
      telemetryEnabled,
      now,
      true,
      "exhausted",
    );
    return { status: "exhausted" };
  }
  if (flow.nextAttemptAt !== null && flow.nextAttemptAt > now) {
    captureAlternateClaimTelemetry(input, flow, telemetryEnabled, now, true);
    return { status: "cooldown", retryAfterMs: flow.nextAttemptAt - now };
  }
  captureAlternateClaimTelemetry(input, flow, telemetryEnabled, now, true);
  flow.status = "preparing";
  flow.attemptCount += 1;
  flow.leaseId = input.leaseId;
  flow.leaseExpiresAt = input.leaseExpiresAt;
  flow.nextAttemptAt = null;
  flow.updatedAt = now;
  return { status: "claimed" };
}

function captureAlternateClaimTelemetry(
  input: {
    userId: string;
    sourceSessionId: string;
    telemetry: AlternateRequestedTelemetryCapture | null;
    resolutionTelemetry: AlternateResolvedTelemetryCapture | null;
  },
  flow: StoredAlternateStoryFlow,
  telemetryEnabled: boolean,
  now: number,
  claimEvidenced: boolean,
  terminalOutcome?: AlternateResolvedTelemetryCapture["outcome"],
): void {
  if (!claimEvidenced || !telemetryEnabled) return;
  const binding = activeBinding(flow, input.userId, now);
  if (!binding) return;
  if (
    !input.telemetry ||
    input.telemetry.event !== "alternate_requested" ||
    input.telemetry.flowId !== binding.flowId
  ) {
    throw new Error("active alternate-request telemetry capture is invalid");
  }
  if (
    recordPreparedMemoryProductEventsAtomically([input.telemetry], now) ===
    "conflict"
  ) {
    throw new Error("alternate-request telemetry conflicted");
  }
  if (terminalOutcome !== undefined) {
    captureAlternateResolution(
      input.resolutionTelemetry,
      binding,
      terminalOutcome,
      now,
    );
  }
}

export function releaseMemoryAlternateStoryFlow(input: {
  userId: string;
  sourceSessionId: string;
  leaseId: string;
  telemetry: AlternateResolvedTelemetryCapture | null;
}): boolean {
  const telemetryEnabled = telemetryFlowBindingEnabled();
  if (!telemetryEnabled && input.telemetry !== null) {
    throw new Error("disabled alternate telemetry received a capture");
  }
  const flow = flows.get(input.sourceSessionId);
  if (!flow || flow.userId !== input.userId) return false;
  const now = Date.now();
  const binding = telemetryEnabled
    ? activeBinding(flow, input.userId, now)
    : null;

  if (flow.status === "ready" && flow.resultSessionId) {
    if (binding) captureAlternateResolution(input.telemetry, binding, "ready", now);
    return false;
  }
  if (flow.status === "unavailable" || flow.status === "ready") {
    if (binding) {
      captureAlternateResolution(input.telemetry, binding, "unavailable", now);
    }
    return false;
  }
  if (flow.status !== "preparing" || flow.leaseId !== input.leaseId) {
    if (
      flow.status === "available" &&
      flow.attemptCount >= ALTERNATE_STORY_MAX_ATTEMPTS
    ) {
      if (binding) captureAlternateResolution(input.telemetry, binding, "failed", now);
    }
    return false;
  }

  const terminalOutcome =
    flow.contextExpiresAt <= now
      ? "expired"
      : flow.attemptCount >= ALTERNATE_STORY_MAX_ATTEMPTS
        ? "failed"
        : null;
  if (terminalOutcome && binding) {
    captureAlternateResolution(input.telemetry, binding, terminalOutcome, now);
  }
  flow.status = "available";
  flow.leaseId = null;
  flow.leaseExpiresAt = null;
  flow.nextAttemptAt = terminalOutcome
    ? null
    : now + ALTERNATE_STORY_RETRY_COOLDOWN_MS;
  flow.updatedAt = now;
  return true;
}

export function completeMemoryAlternateStoryUnavailable(input: {
  userId: string;
  sourceSessionId: string;
  leaseId: string;
  telemetry: AlternateResolvedTelemetryCapture | null;
}): boolean {
  const telemetryEnabled = telemetryFlowBindingEnabled();
  if (!telemetryEnabled && input.telemetry !== null) {
    throw new Error("disabled alternate telemetry received a capture");
  }
  const flow = flows.get(input.sourceSessionId);
  const now = Date.now();
  if (!flow || flow.userId !== input.userId) return false;
  const binding = telemetryEnabled
    ? activeBinding(flow, input.userId, now)
    : null;
  if (flow.status === "unavailable") {
    if (binding) {
      captureAlternateResolution(input.telemetry, binding, "unavailable", now);
    }
    return true;
  }
  if (flow.status === "ready") {
    if (binding) {
      captureAlternateResolution(
        input.telemetry,
        binding,
        flow.resultSessionId ? "ready" : "unavailable",
        now,
      );
    }
    return false;
  }
  if (
    flow.status !== "preparing" ||
    flow.leaseId !== input.leaseId ||
    flow.leaseExpiresAt === null ||
    flow.leaseExpiresAt <= now ||
    flow.contextExpiresAt <= now
  ) {
    return false;
  }
  if (binding) {
    captureAlternateResolution(input.telemetry, binding, "unavailable", now);
  }
  flow.status = "unavailable";
  flow.leaseId = null;
  flow.leaseExpiresAt = null;
  flow.nextAttemptAt = null;
  flow.updatedAt = now;
  return true;
}

export function completeMemoryAlternateStoryExpired(input: {
  userId: string;
  sourceSessionId: string;
  leaseId: string;
  telemetry: AlternateResolvedTelemetryCapture | null;
}): boolean {
  const telemetryEnabled = telemetryFlowBindingEnabled();
  if (!telemetryEnabled && input.telemetry !== null) {
    throw new Error("disabled alternate telemetry received a capture");
  }
  const flow = flows.get(input.sourceSessionId);
  const now = Date.now();
  if (!flow || flow.userId !== input.userId || flow.attemptCount === 0) {
    return false;
  }
  const binding = telemetryEnabled
    ? activeBinding(flow, input.userId, now)
    : null;
  if (flow.status === "ready" && flow.resultSessionId) {
    if (binding) captureAlternateResolution(input.telemetry, binding, "ready", now);
    return false;
  }
  if (flow.status === "unavailable" || flow.status === "ready") {
    if (binding) {
      captureAlternateResolution(input.telemetry, binding, "unavailable", now);
    }
    return false;
  }
  const session = globalThis.__onwardSessions?.get(input.sourceSessionId);
  if (
    flow.contextExpiresAt > now &&
    (!session || session.disclosureExpiresAt > now)
  ) {
    return false;
  }
  if (
    flow.status === "preparing" &&
    flow.leaseId !== null &&
    flow.leaseId !== input.leaseId
  ) {
    return false;
  }
  if (binding) captureAlternateResolution(input.telemetry, binding, "expired", now);
  flow.status = "available";
  flow.leaseId = null;
  flow.leaseExpiresAt = null;
  flow.nextAttemptAt = null;
  flow.updatedAt = now;
  return true;
}

export function completeMemoryAlternateStoryReady(input: {
  userId: string;
  sourceSessionId: string;
  sourceArtifactId: string;
  leaseId: string;
  artifact: StoryArtifact;
  telemetry: AlternateReadyTelemetry | null;
  createSession: () => string;
}): string | null {
  const telemetryEnabled = telemetryFlowBindingEnabled();
  if (!telemetryEnabled && input.telemetry !== null) {
    throw new Error("disabled alternate telemetry received a capture");
  }
  const flow = flows.get(input.sourceSessionId);
  const now = Date.now();
  if (
    flow?.status !== "preparing" ||
    flow.userId !== input.userId ||
    flow.sourceArtifactId !== input.sourceArtifactId ||
    flow.leaseId !== input.leaseId ||
    flow.leaseExpiresAt === null ||
    flow.leaseExpiresAt <= now ||
    flow.contextExpiresAt <= now
  ) {
    return null;
  }
  const binding = telemetryEnabled
    ? activeBinding(flow, input.userId, now)
    : null;
  const captures = binding
    ? readyCaptures(input.telemetry, binding, input.artifact)
    : null;
  const existingSessionId = [...(globalThis.__onwardSessions?.values() ?? [])]
    .find((session) => session.alternateOfSessionId === input.sourceSessionId)
    ?.sessionId;
  const resultSessionId = input.createSession();
  const created = existingSessionId === undefined;
  if (captures) {
    try {
      if (
        recordPreparedMemoryProductEventsAtomically(captures, now) ===
        "conflict"
      ) {
        throw new Error("alternate ready telemetry conflicted");
      }
    } catch (error) {
      if (created) {
        globalThis.__onwardSessions?.delete(resultSessionId);
        deleteMemoryStoryArtifact(input.artifact.artifactId);
      }
      throw error;
    }
  }
  flow.status = "ready";
  flow.resultSessionId = resultSessionId;
  flow.leaseId = null;
  flow.leaseExpiresAt = null;
  flow.nextAttemptAt = null;
  flow.updatedAt = now;
  return resultSessionId;
}

function activeBinding(
  flow: StoredAlternateStoryFlow,
  userId: string,
  now: number,
): MemoryTelemetryFlowBinding | null {
  const session = globalThis.__onwardSessions?.get(flow.sourceSessionId);
  if (
    !session ||
    session.userId !== userId ||
    session.alternateOfSessionId !== null ||
    session.storyArtifactId !== flow.sourceArtifactId
  ) {
    return null;
  }
  return getOwnedMemoryTelemetryFlowBindingByRoot(
    session.sessionId,
    session.userId,
    now,
  );
}

function captureAlternateResolution(
  telemetry: AlternateResolvedTelemetryCapture | null,
  binding: MemoryTelemetryFlowBinding,
  outcome: AlternateResolvedTelemetryCapture["outcome"],
  now: number,
): void {
  if (
    !telemetry ||
    telemetry.event !== "alternate_resolved" ||
    telemetry.flowId !== binding.flowId
  ) {
    throw new Error("active alternate-resolution telemetry capture is invalid");
  }
  const derived = Object.freeze({
    ...telemetry,
    ...alternateResolvedEvent(outcome),
  });
  if (
    reconcilePreparedMemoryAlternateResolvedEventFirstWriteWins(derived, now) ===
    "conflict"
  ) {
    throw new Error("alternate-resolution telemetry conflicted");
  }
}

function readyCaptures(
  telemetry: AlternateReadyTelemetry | null,
  binding: MemoryTelemetryFlowBinding,
  artifact: StoryArtifact,
): ReadonlyArray<
  AlternateReadyTelemetry["artifact"] | AlternateReadyTelemetry["resolution"]
> {
  const expectedArtifact = artifactCreatedEvent(artifact, "alternate");
  if (
    !telemetry ||
    telemetry.artifact.flowId !== binding.flowId ||
    telemetry.resolution.flowId !== binding.flowId ||
    telemetry.resolution.event !== "alternate_resolved" ||
    !isDeepStrictEqual(captureEvent(telemetry.artifact), expectedArtifact)
  ) {
    throw new Error("active alternate-ready telemetry capture is invalid");
  }
  return Object.freeze([
    telemetry.artifact,
    Object.freeze({
      ...telemetry.resolution,
      ...alternateResolvedEvent("ready"),
    }),
  ]);
}

function captureEvent(
  capture: AlternateReadyTelemetry["artifact"],
): Record<string, unknown> {
  const event: Record<string, unknown> = { ...capture };
  delete event.eventId;
  delete event.schemaVersion;
  delete event.flowId;
  return event;
}

export function deleteMemoryAlternateStoryFlow(sourceSessionId: string): void {
  flows.delete(sourceSessionId);
}

export function markMemoryAlternateResultDeleted(resultSessionId: string): void {
  for (const flow of flows.values()) {
    if (flow.resultSessionId !== resultSessionId) continue;
    flow.status = "unavailable";
    flow.resultSessionId = null;
    flow.leaseId = null;
    flow.leaseExpiresAt = null;
    flow.nextAttemptAt = null;
    flow.updatedAt = Date.now();
  }
}

export function listMemoryAlternateStoryFlows(): StoredAlternateStoryFlow[] {
  return [...flows.values()].map((flow) => structuredClone(flow));
}

function sameIdentity(
  flow: StoredAlternateStoryFlow,
  input: {
    userId: string;
    sourceSessionId: string;
    sourceArtifactId: string;
    tokenHash: string;
    policyVersion: string;
  },
): boolean {
  return (
    flow.userId === input.userId &&
    flow.sourceSessionId === input.sourceSessionId &&
    flow.sourceArtifactId === input.sourceArtifactId &&
    flow.tokenHash === input.tokenHash &&
    flow.policyVersion === input.policyVersion
  );
}

function sameSourceIdentity(
  flow: StoredAlternateStoryFlow,
  input: {
    userId: string;
    sourceSessionId: string;
    sourceArtifactId: string;
    policyVersion: string;
  },
): boolean {
  return (
    flow.userId === input.userId &&
    flow.sourceSessionId === input.sourceSessionId &&
    flow.sourceArtifactId === input.sourceArtifactId &&
    flow.policyVersion === input.policyVersion
  );
}
