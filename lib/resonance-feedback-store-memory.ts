import "server-only";
import { randomBytes } from "node:crypto";
import {
  RESONANCE_FEEDBACK_POLICY_VERSION,
  RESONANCE_FEEDBACK_RETENTION_DAYS,
  type ResonanceFeedbackVerdict,
  type ResonanceMissReason,
} from "./resonance-feedback-types";
import type { ResonanceFeedbackTelemetryCapture } from "./resonance-feedback-telemetry";
import { getOwnedMemoryStoryArtifactSync } from "./story-artifact-store-memory";
import { getOwnedMemoryTelemetryFlowBindingByRoot } from "./telemetry-flow-binding-memory";
import { telemetryFlowBindingEnabled } from "./telemetry-flow-lifecycle";
import { recordPreparedMemoryProductEventsAtomically } from "./telemetry";
import type { StoryRole } from "./telemetry-types";

export type SafeResonanceFeedback = {
  userId: string;
  sessionId: string;
  artifactId: string;
  storySpecId: string;
  storySpecVersion: number;
  figureKey: string;
  stageId: string;
  recipeId: string;
  policyVersion: string;
  verdict: ResonanceFeedbackVerdict;
  reason: ResonanceMissReason | null;
};

export type StoredResonanceFeedback = SafeResonanceFeedback & {
  feedbackId: string;
  createdAt: string;
  expiresAt: string;
};

export type FeedbackWriteResult = "created" | "duplicate" | "conflict";
export type FeedbackStoreResult =
  | FeedbackWriteResult
  | "not_found"
  | "incomplete";

export type MemoryResonanceFeedbackInput = SafeResonanceFeedback & {
  telemetry: ResonanceFeedbackTelemetryCapture | null;
};

declare global {
  var __onwardResonanceFeedback:
    | Map<string, StoredResonanceFeedback>
    | undefined;
}

const feedback =
  globalThis.__onwardResonanceFeedback ??
  (globalThis.__onwardResonanceFeedback = new Map());

export async function submitMemoryResonanceFeedback(
  input: MemoryResonanceFeedbackInput,
): Promise<FeedbackStoreResult> {
  const now = Date.now();
  pruneMemoryResonanceFeedback(now);
  const { telemetry, ...safeInput } = input;
  const telemetryEnabled = telemetryFlowBindingEnabled();
  const session = globalThis.__onwardSessions?.get(safeInput.sessionId);
  if (
    !session ||
    session.userId !== safeInput.userId ||
    session.storyArtifactId !== safeInput.artifactId ||
    session.figureKey !== safeInput.figureKey ||
    session.stageId !== safeInput.stageId
  ) {
    return "not_found";
  }
  const artifact = getOwnedMemoryStoryArtifactSync(
    safeInput.artifactId,
    safeInput.userId,
    safeInput.sessionId,
  );
  if (
    !artifact ||
    artifact.storySpecId !== safeInput.storySpecId ||
    artifact.storySpecVersion !== safeInput.storySpecVersion ||
    artifact.figureKey !== safeInput.figureKey ||
    artifact.stageId !== safeInput.stageId ||
    session.matchRecipe.recipeId !== safeInput.recipeId ||
    safeInput.policyVersion !== RESONANCE_FEEDBACK_POLICY_VERSION
  ) {
    return "not_found";
  }
  if (session.nextBeatIndex < artifact.beats.length) return "incomplete";
  if (
    (safeInput.verdict === "felt_close" && safeInput.reason !== null) ||
    (safeInput.verdict === "not_close" && safeInput.reason === null)
  ) {
    return "conflict";
  }

  const existing = feedback.get(safeInput.sessionId);
  if (existing && !sameFeedback(existing, safeInput)) return "conflict";

  const storyRole: StoryRole =
    session.alternateOfSessionId === null ? "initial" : "alternate";
  const rootSessionId = session.alternateOfSessionId ?? session.sessionId;
  const binding = telemetryEnabled
    ? getOwnedMemoryTelemetryFlowBindingByRoot(
        rootSessionId,
        session.userId,
        now,
      )
    : null;
  if (!telemetryEnabled && telemetry !== null) {
    throw new Error("disabled feedback telemetry received a capture");
  }
  if (
    binding &&
    (!telemetry ||
      telemetry.event !== "feedback_submitted" ||
      telemetry.flowId !== binding.flowId ||
      telemetry.storyRole !== storyRole ||
      telemetry.verdict !== safeInput.verdict)
  ) {
    throw new Error("active feedback telemetry capture is invalid");
  }

  if (existing) {
    captureFeedbackEvent(telemetry, binding !== null, now);
    return "duplicate";
  }

  const createdAt = new Date(now);
  const stored = Object.freeze({
    feedbackId: randomBytes(16).toString("hex"),
    ...safeInput,
    createdAt: createdAt.toISOString(),
    expiresAt: new Date(
      now + RESONANCE_FEEDBACK_RETENTION_DAYS * 86_400_000,
    ).toISOString(),
  });
  captureFeedbackEvent(telemetry, binding !== null, now);
  feedback.set(safeInput.sessionId, stored);
  return "created";
}

export function listMemoryResonanceFeedback(): StoredResonanceFeedback[] {
  pruneMemoryResonanceFeedback();
  return [...feedback.values()].map((item) => structuredClone(item));
}

export function getMemoryResonanceFeedbackForSession(
  sessionId: string,
): StoredResonanceFeedback | null {
  pruneMemoryResonanceFeedback();
  const item = feedback.get(sessionId);
  return item ? structuredClone(item) : null;
}

export function deleteMemoryResonanceFeedbackForSession(
  sessionId: string,
): void {
  feedback.delete(sessionId);
}

function pruneMemoryResonanceFeedback(now = Date.now()): void {
  for (const [sessionId, item] of feedback) {
    if (Date.parse(item.expiresAt) <= now) feedback.delete(sessionId);
  }
}

function captureFeedbackEvent(
  telemetry: ResonanceFeedbackTelemetryCapture | null,
  activeBinding: boolean,
  now: number,
): void {
  if (!activeBinding) return;
  if (!telemetry) {
    throw new Error("active feedback telemetry capture is missing");
  }
  if (
    recordPreparedMemoryProductEventsAtomically([telemetry], now) === "conflict"
  ) {
    throw new Error("feedback telemetry conflicted");
  }
}

function sameFeedback(
  existing: StoredResonanceFeedback,
  input: SafeResonanceFeedback,
): boolean {
  return (
    existing.userId === input.userId &&
    existing.artifactId === input.artifactId &&
    existing.storySpecId === input.storySpecId &&
    existing.storySpecVersion === input.storySpecVersion &&
    existing.figureKey === input.figureKey &&
    existing.stageId === input.stageId &&
    existing.recipeId === input.recipeId &&
    existing.policyVersion === input.policyVersion &&
    existing.verdict === input.verdict &&
    existing.reason === input.reason
  );
}
