import "server-only";
import type { Session } from "./types";
import type { StoryArtifact } from "./story-artifact-types";
import {
  RESONANCE_FEEDBACK_POLICY_VERSION,
  type ResonanceFeedbackInput,
  type ResonanceFeedbackPresentation,
} from "./resonance-feedback-types";
import {
  getMemoryResonanceFeedbackForSession,
  listMemoryResonanceFeedback,
  submitMemoryResonanceFeedback,
} from "./resonance-feedback-store-memory";
import {
  getSupabaseResonanceFeedbackForSession,
  submitSupabaseResonanceFeedback,
} from "./resonance-feedback-store-supabase";
import { prepareResonanceFeedbackTelemetry } from "./resonance-feedback-telemetry";
import { issueAlternateStoryCapability } from "./alternate-story-flow";
import { persistenceMode } from "./persistence";

export class ResonanceFeedbackTargetError extends Error {}
export class ResonanceFeedbackIncompleteError extends Error {}
export class ResonanceFeedbackConflictError extends Error {}

export async function submitResonanceFeedback(input: {
  userId: string;
  session: Session;
  artifact: StoryArtifact;
  feedback: ResonanceFeedbackInput;
}): Promise<"created" | "duplicate"> {
  const { userId, session, artifact, feedback } = input;
  if (
    session.userId !== userId ||
    feedback.sessionId !== session.sessionId ||
    session.storyArtifactId !== artifact.artifactId ||
    session.figureKey !== artifact.figureKey ||
    session.stageId !== artifact.stageId
  ) {
    throw new ResonanceFeedbackTargetError();
  }
  if (session.nextBeatIndex < artifact.beats.length) {
    throw new ResonanceFeedbackIncompleteError();
  }
  const reason = feedback.verdict === "not_close" ? feedback.reason : null;
  const telemetry = await prepareResonanceFeedbackTelemetry({
    userId,
    session,
    verdict: feedback.verdict,
  });
  const result =
    persistenceMode() === "supabase"
      ? await submitSupabaseResonanceFeedback({
          userId,
          sessionId: session.sessionId,
          artifactId: artifact.artifactId,
          policyVersion: RESONANCE_FEEDBACK_POLICY_VERSION,
          verdict: feedback.verdict,
          reason,
          telemetry,
        })
      : await submitMemoryResonanceFeedback({
          userId,
          sessionId: session.sessionId,
          artifactId: artifact.artifactId,
          storySpecId: artifact.storySpecId,
          storySpecVersion: artifact.storySpecVersion,
          figureKey: artifact.figureKey,
          stageId: artifact.stageId,
          recipeId: session.matchRecipe.recipeId,
          policyVersion: RESONANCE_FEEDBACK_POLICY_VERSION,
          verdict: feedback.verdict,
          reason,
          telemetry,
        });

  if (result === "not_found") throw new ResonanceFeedbackTargetError();
  if (result === "incomplete") throw new ResonanceFeedbackIncompleteError();
  if (result === "conflict") throw new ResonanceFeedbackConflictError();
  return result;
}

export function _listResonanceFeedback() {
  if (persistenceMode() === "supabase") {
    throw new Error("feedback test projection is memory-only");
  }
  return listMemoryResonanceFeedback();
}

export async function getResonanceFeedbackPresentation(input: {
  userId: string;
  session: Session;
  artifact: StoryArtifact;
}): Promise<ResonanceFeedbackPresentation> {
  const { userId, session, artifact } = input;
  if (
    session.userId !== userId ||
    session.storyArtifactId !== artifact.artifactId ||
    session.figureKey !== artifact.figureKey ||
    session.stageId !== artifact.stageId
  ) {
    return { status: "unanswered" };
  }
  const feedback =
    persistenceMode() === "supabase"
      ? await getSupabaseResonanceFeedbackForSession({
          userId,
          sessionId: session.sessionId,
          artifactId: artifact.artifactId,
        })
      : getMemoryResonanceFeedbackForSession(session.sessionId);
  if (
    !feedback ||
    feedback.userId !== userId ||
    feedback.artifactId !== artifact.artifactId
  ) {
    return { status: "unanswered" };
  }
  if (feedback.verdict === "felt_close") return { status: "felt_close" };
  try {
    return {
      status: "not_close",
      alternate: await issueAlternateStoryCapability({
        userId,
        session,
        artifact,
      }),
    };
  } catch {
    return {
      status: "not_close",
      alternate: { status: "temporarily_unavailable", retryAfterMs: 15_000 },
    };
  }
}
