import {
  RESONANCE_FEEDBACK_VERDICTS,
  RESONANCE_MISS_REASONS,
  type ResonanceFeedbackInput,
  type ResonanceFeedbackVerdict,
  type ResonanceMissReason,
} from "./resonance-feedback-types";

export function parseResonanceFeedbackRequest(
  value: unknown,
): ResonanceFeedbackInput | { error: string } {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return { error: "Story feedback body must be an object." };
  }
  const body = value as Record<string, unknown>;
  if (
    typeof body.sessionId !== "string" ||
    !/^[0-9a-f]{32}$/.test(body.sessionId)
  ) {
    return { error: "Session ID is invalid." };
  }
  if (
    typeof body.verdict !== "string" ||
    !RESONANCE_FEEDBACK_VERDICTS.includes(
      body.verdict as ResonanceFeedbackVerdict,
    )
  ) {
    return { error: "Story feedback verdict is invalid." };
  }

  if (body.verdict === "felt_close") {
    if (Object.keys(body).sort().join(",") !== "sessionId,verdict") {
      return { error: "Close-story feedback fields are invalid." };
    }
    return { sessionId: body.sessionId, verdict: "felt_close" };
  }

  if (Object.keys(body).sort().join(",") !== "reason,sessionId,verdict") {
    return { error: "Miss feedback fields are invalid." };
  }
  if (
    typeof body.reason !== "string" ||
    !RESONANCE_MISS_REASONS.includes(body.reason as ResonanceMissReason)
  ) {
    return { error: "Story feedback reason is invalid." };
  }
  return {
    sessionId: body.sessionId,
    verdict: "not_close",
    reason: body.reason as ResonanceMissReason,
  };
}
