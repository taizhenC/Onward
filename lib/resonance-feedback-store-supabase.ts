import "server-only";
import { randomBytes } from "node:crypto";
import { getSupabase } from "./db";
import type {
  ResonanceFeedbackVerdict,
  ResonanceMissReason,
} from "./resonance-feedback-types";
import type { ResonanceFeedbackTelemetryCapture } from "./resonance-feedback-telemetry";
import type { FeedbackStoreResult } from "./resonance-feedback-store-memory";
import { telemetryFlowBindingEnabled } from "./telemetry-flow-lifecycle";

export type SupabaseResonanceFeedbackInput = {
  userId: string;
  sessionId: string;
  artifactId: string;
  policyVersion: string;
  verdict: ResonanceFeedbackVerdict;
  reason: ResonanceMissReason | null;
  telemetry: ResonanceFeedbackTelemetryCapture | null;
};

export type SupabaseResonanceFeedbackProjection = {
  userId: string;
  sessionId: string;
  artifactId: string;
  verdict: ResonanceFeedbackVerdict;
  reason: ResonanceMissReason | null;
};

export async function getSupabaseResonanceFeedbackForSession(input: {
  userId: string;
  sessionId: string;
  artifactId: string;
}): Promise<SupabaseResonanceFeedbackProjection | null> {
  const { data, error } = await getSupabase()
    .from("story_feedback")
    .select("user_id,session_id,artifact_id,verdict,reason")
    .eq("user_id", input.userId)
    .eq("session_id", input.sessionId)
    .eq("artifact_id", input.artifactId)
    .maybeSingle();
  if (error) throw new Error("story feedback could not be read");
  if (!data) return null;
  if (
    (data.verdict !== "felt_close" && data.verdict !== "not_close") ||
    (data.reason !== null && typeof data.reason !== "string")
  ) {
    throw new Error("story feedback projection is invalid");
  }
  return {
    userId: data.user_id,
    sessionId: data.session_id,
    artifactId: data.artifact_id,
    verdict: data.verdict,
    reason: data.reason as ResonanceMissReason | null,
  };
}

export async function submitSupabaseResonanceFeedback(
  input: SupabaseResonanceFeedbackInput,
): Promise<FeedbackStoreResult> {
  const feedbackId = randomBytes(16).toString("hex");
  const telemetryEnabled = telemetryFlowBindingEnabled();
  if (!telemetryEnabled && input.telemetry !== null) {
    throw new Error("disabled feedback telemetry received a capture");
  }
  const { data, error } = telemetryEnabled
    ? await getSupabase().rpc("submit_story_feedback_v2", {
        p_feedback_id: feedbackId,
        p_user_id: input.userId,
        p_session_id: input.sessionId,
        p_artifact_id: input.artifactId,
        p_policy_version: input.policyVersion,
        p_verdict: input.verdict,
        p_reason: input.reason,
        p_telemetry_flow_id: input.telemetry?.flowId ?? null,
        p_feedback_event_id: input.telemetry?.eventId ?? null,
        p_telemetry_schema_version: input.telemetry?.schemaVersion ?? null,
        p_story_role: input.telemetry?.storyRole ?? null,
        p_feedback_verdict: input.telemetry?.verdict ?? null,
      })
    : await getSupabase().rpc("submit_story_feedback", {
        p_feedback_id: feedbackId,
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
