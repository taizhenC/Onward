import "server-only";
import { getMemoryResonanceFeedbackForSession } from "./resonance-feedback-store-memory";
import {
  ALTERNATE_STORY_MAX_ATTEMPTS,
  ALTERNATE_STORY_RETRY_COOLDOWN_MS,
  type AlternateStoryFlowStatus,
} from "./alternate-story-types";
import type { AlternateRequestedTelemetryCapture } from "./alternate-story-telemetry";
import { getOwnedMemoryTelemetryFlowBindingByRoot } from "./telemetry-flow-binding-memory";
import { telemetryFlowBindingEnabled } from "./telemetry-flow-lifecycle";
import { recordPreparedMemoryProductEventsAtomically } from "./telemetry";

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
}): AlternateFlowClaimResult {
  const telemetryEnabled = telemetryFlowBindingEnabled();
  if (!telemetryEnabled && input.telemetry !== null) {
    throw new Error("disabled alternate telemetry received a capture");
  }
  const flow = flows.get(input.sourceSessionId);
  if (!flow || !sameIdentity(flow, input)) return { status: "not_found" };
  const now = Date.now();
  if (flow.status === "ready" && flow.resultSessionId) {
    captureAlternateRequested(input, flow, telemetryEnabled, now, true);
    return { status: "ready", sessionId: flow.resultSessionId };
  }
  if (flow.status === "unavailable") {
    captureAlternateRequested(input, flow, telemetryEnabled, now, true);
    return { status: "unavailable" };
  }
  if (
    flow.status === "preparing" &&
    flow.leaseExpiresAt !== null &&
    flow.leaseExpiresAt > now
  ) {
    captureAlternateRequested(input, flow, telemetryEnabled, now, true);
    return {
      status: "preparing",
      retryAfterMs: flow.leaseExpiresAt - now,
    };
  }
  if (flow.expiresAt <= now) {
    captureAlternateRequested(
      input,
      flow,
      telemetryEnabled,
      now,
      flow.attemptCount > 0,
    );
    return { status: "expired" };
  }
  if (flow.attemptCount >= ALTERNATE_STORY_MAX_ATTEMPTS) {
    captureAlternateRequested(input, flow, telemetryEnabled, now, true);
    return { status: "exhausted" };
  }
  if (flow.nextAttemptAt !== null && flow.nextAttemptAt > now) {
    captureAlternateRequested(input, flow, telemetryEnabled, now, true);
    return { status: "cooldown", retryAfterMs: flow.nextAttemptAt - now };
  }
  captureAlternateRequested(input, flow, telemetryEnabled, now, true);
  flow.status = "preparing";
  flow.attemptCount += 1;
  flow.leaseId = input.leaseId;
  flow.leaseExpiresAt = input.leaseExpiresAt;
  flow.nextAttemptAt = null;
  flow.updatedAt = now;
  return { status: "claimed" };
}

function captureAlternateRequested(
  input: {
    userId: string;
    sourceSessionId: string;
    telemetry: AlternateRequestedTelemetryCapture | null;
  },
  flow: StoredAlternateStoryFlow,
  telemetryEnabled: boolean,
  now: number,
  claimEvidenced: boolean,
): void {
  if (!claimEvidenced || !telemetryEnabled) return;
  const session = globalThis.__onwardSessions?.get(input.sourceSessionId);
  const binding =
    session &&
    session.userId === input.userId &&
    session.alternateOfSessionId === null &&
    session.storyArtifactId === flow.sourceArtifactId
      ? getOwnedMemoryTelemetryFlowBindingByRoot(
          session.sessionId,
          session.userId,
          now,
        )
      : null;
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
}

export function releaseMemoryAlternateStoryFlow(input: {
  userId: string;
  sourceSessionId: string;
  leaseId: string;
}): boolean {
  const flow = flows.get(input.sourceSessionId);
  if (
    flow?.status !== "preparing" ||
    flow.userId !== input.userId ||
    flow.leaseId !== input.leaseId
  ) {
    return false;
  }
  flow.status = "available";
  flow.leaseId = null;
  flow.leaseExpiresAt = null;
  flow.nextAttemptAt = Date.now() + ALTERNATE_STORY_RETRY_COOLDOWN_MS;
  flow.updatedAt = Date.now();
  return true;
}

export function completeMemoryAlternateStoryUnavailable(input: {
  userId: string;
  sourceSessionId: string;
  leaseId: string;
}): boolean {
  const flow = flows.get(input.sourceSessionId);
  const now = Date.now();
  if (
    flow?.status !== "preparing" ||
    flow.userId !== input.userId ||
    flow.leaseId !== input.leaseId ||
    flow.leaseExpiresAt === null ||
    flow.leaseExpiresAt <= now ||
    flow.contextExpiresAt <= now
  ) {
    return false;
  }
  flow.status = "unavailable";
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
  createSession: () => string;
}): string | null {
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
  const resultSessionId = input.createSession();
  flow.status = "ready";
  flow.resultSessionId = resultSessionId;
  flow.leaseId = null;
  flow.leaseExpiresAt = null;
  flow.nextAttemptAt = null;
  flow.updatedAt = now;
  return resultSessionId;
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
