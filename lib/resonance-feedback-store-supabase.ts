import "server-only";
import { randomBytes } from "node:crypto";
import { getSupabase } from "./db";
import type {
  ResonanceFeedbackVerdict,
  ResonanceMissReason,
} from "./resonance-feedback-types";
import type { FeedbackWriteResult } from "./resonance-feedback-store-memory";

export type SupabaseResonanceFeedbackInput = {
  userId: string;
  sessionId: string;
  artifactId: string;
  policyVersion: string;
  verdict: ResonanceFeedbackVerdict;
  reason: ResonanceMissReason | null;
};

export async function submitSupabaseResonanceFeedback(
  input: SupabaseResonanceFeedbackInput,
): Promise<FeedbackWriteResult | "not_found" | "incomplete"> {
  const { data, error } = await getSupabase().rpc("submit_story_feedback", {
    p_feedback_id: randomBytes(16).toString("hex"),
    p_user_id: input.userId,
    p_session_id: input.sessionId,
    p_artifact_id: input.artifactId,
    p_policy_version: input.policyVersion,
    p_verdict: input.verdict,
    p_reason: input.reason,
  });
  if (error) throw new Error("story feedback could not be stored");
  if (
    data === "created" ||
    data === "duplicate" ||
    data === "conflict" ||
    data === "not_found" ||
    data === "incomplete"
  ) {
    return data;
  }
  throw new Error("story feedback returned an invalid disposition");
}
