import "server-only";
import { randomBytes } from "node:crypto";
import {
  RESONANCE_FEEDBACK_RETENTION_DAYS,
  type ResonanceFeedbackVerdict,
  type ResonanceMissReason,
} from "./resonance-feedback-types";

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

declare global {
  var __onwardResonanceFeedback:
    | Map<string, StoredResonanceFeedback>
    | undefined;
}

const feedback =
  globalThis.__onwardResonanceFeedback ??
  (globalThis.__onwardResonanceFeedback = new Map());

export async function submitMemoryResonanceFeedback(
  input: SafeResonanceFeedback,
): Promise<FeedbackWriteResult> {
  pruneMemoryResonanceFeedback();
  const existing = feedback.get(input.sessionId);
  if (existing) return sameFeedback(existing, input) ? "duplicate" : "conflict";
  const now = new Date();
  feedback.set(input.sessionId, {
    feedbackId: randomBytes(16).toString("hex"),
    ...input,
    createdAt: now.toISOString(),
    expiresAt: new Date(
      now.getTime() + RESONANCE_FEEDBACK_RETENTION_DAYS * 86_400_000,
    ).toISOString(),
  });
  return "created";
}

export function listMemoryResonanceFeedback(): StoredResonanceFeedback[] {
  pruneMemoryResonanceFeedback();
  return [...feedback.values()].map((item) => structuredClone(item));
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
