import "server-only";
import type { Session } from "./types";
import type { StoryArtifact } from "./story-artifact-types";
import {
  RESONANCE_FEEDBACK_POLICY_VERSION,
  type ResonanceFeedbackInput,
} from "./resonance-feedback-types";
import {
  listMemoryResonanceFeedback,
  submitMemoryResonanceFeedback,
} from "./resonance-feedback-store-memory";
import { submitSupabaseResonanceFeedback } from "./resonance-feedback-store-supabase";

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
  const result =
    process.env.PERSISTENCE === "supabase"
      ? await submitSupabaseResonanceFeedback({
          userId,
          sessionId: session.sessionId,
          artifactId: artifact.artifactId,
          policyVersion: RESONANCE_FEEDBACK_POLICY_VERSION,
          verdict: feedback.verdict,
          reason,
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
        });

  if (result === "not_found") throw new ResonanceFeedbackTargetError();
  if (result === "incomplete") throw new ResonanceFeedbackIncompleteError();
  if (result === "conflict") throw new ResonanceFeedbackConflictError();
  return result;
}

export function _listResonanceFeedback() {
  if (process.env.PERSISTENCE === "supabase") {
    throw new Error("feedback test projection is memory-only");
  }
  return listMemoryResonanceFeedback();
}
