import type { Confidence, Framing } from "./types";

export const matchConfigVersion = "phase1-rerank-eval-2026-05";

export const AGE_TOLERANCE_YEARS = 10;

export const PARTIAL_FRAMING_THRESHOLD = 1;

// Confidence → framing. Only "definitive" | "partial" crosses the wire (CLAUDE.md:
// the client never sees the underlying confidence). A low-confidence pick — including
// every keyword-hybrid fallback — is framed "partial" so we never present a weak
// match as a definitive mirror.
export function framingFromConfidence(confidence: Confidence): Framing {
  return confidence === "low" ? "partial" : "definitive";
}

// Lowercase substring → theme tags. A figure earns one point per matched keyword
// whose theme tag is in the figure's themes[]. Phase 1 replaces this with the
// real BASE_WEIGHTS / WEIGHT_BOUNDS / DYNAMIC from CLAUDE.md.
export const STUB_KEYWORD_MAP: Record<string, string[]> = {
  // Butler — creative_dismissal / worthlessness / keep_going
  reject: ["creative_dismissal", "worthlessness"],
  rejection: ["creative_dismissal", "worthlessness"],
  rejected: ["creative_dismissal", "worthlessness"],
  submit: ["creative_dismissal", "keep_going"],
  manuscript: ["creative_dismissal"],
  writing: ["creative_dismissal"],
  "no one wants": ["creative_dismissal", "worthlessness"],
  "keep trying": ["keep_going"],
  "give up": ["worthlessness", "keep_going"],
  worthless: ["worthlessness"],
  "no achievement": ["worthlessness"],
  "no achievements": ["worthlessness"],
  "nothing to show": ["worthlessness"],
  behind: ["worthlessness", "keep_going"],

  // Douglass — dispossession / self_invention / solitude
  alone: ["solitude"],
  lonely: ["solitude"],
  "lost everyone": ["dispossession", "solitude"],
  "no one knows me": ["dispossession", "self_invention"],
  "starting over": ["self_invention", "dispossession"],
  escape: ["dispossession", "self_invention"],
  escaped: ["dispossession", "self_invention"],
  "ran from": ["dispossession"],
  "left behind": ["dispossession"],
  "who i am": ["self_invention"],
  "name myself": ["self_invention"],
  "no name": ["dispossession", "self_invention"],
  "free": ["self_invention"],

  // Glessner Lee — late_start / social_constraint / quiet_defiance
  "too late": ["late_start"],
  "too old": ["late_start"],
  "wrong life": ["late_start", "social_constraint"],
  stuck: ["late_start", "social_constraint"],
  wasted: ["late_start"],
  "should have": ["late_start"],
  "not allowed": ["social_constraint", "quiet_defiance"],
  "told i couldn't": ["social_constraint", "quiet_defiance"],
  "what they want": ["social_constraint"],
  "everyone expects": ["social_constraint"],
  "expected of me": ["social_constraint"],
};
