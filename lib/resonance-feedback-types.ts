export const RESONANCE_FEEDBACK_POLICY_VERSION =
  "resonance-feedback-v1-2026-07";
export const RESONANCE_FEEDBACK_RETENTION_DAYS = 90;

export const RESONANCE_FEEDBACK_VERDICTS = [
  "felt_close",
  "not_close",
] as const;

export type ResonanceFeedbackVerdict =
  (typeof RESONANCE_FEEDBACK_VERDICTS)[number];

export const RESONANCE_MISS_REASONS = [
  "wrong_situation",
  "wrong_feeling",
  "life_stage_mismatch",
  "story_felt_generic",
  "tone_felt_wrong",
  "historical_concern",
  "other",
] as const;

export type ResonanceMissReason =
  (typeof RESONANCE_MISS_REASONS)[number];

export type ResonanceFeedbackInput =
  | {
      sessionId: string;
      verdict: "felt_close";
    }
  | {
      sessionId: string;
      verdict: "not_close";
      reason: ResonanceMissReason;
    };
