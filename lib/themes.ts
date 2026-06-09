import { getMatchedThemeWeights } from "./keyword-match";
import { THEME_CLAMP, THEME_LAMBDA } from "./match-config";

// The deterministic theme lane (no embedder). User themes are derived from the SAME keyword parsing
// the keyword scorer uses (getMatchedThemeWeights, reused — never re-parsed here). A stage is scored
// by weighted Jaccard against its themes[], minus λ·Jaccard against its antiThemes[], clamped small.
// AntiThemes only penalize — they never hard-exclude (recovery-asymmetry).
//
// When no user theme matched, the caller (lib/facets-retrieval.ts) DISABLES this lane entirely and
// renormalizes the remaining weights — a theme lane scoring everything 0 is arbitrary tie-break
// noise, not signal.

// The controlled vocabulary (CLAUDE.md: reuse exact names, don't fragment with synonyms). Mirrors
// the themes[] authored across lib/figures-data.ts and the tags in STUB_KEYWORD_MAP.
export const THEME_VOCABULARY: readonly string[] = [
  "creative_dismissal",
  "worthlessness",
  "keep_going",
  "solitude",
  "dispossession",
  "self_invention",
  "late_start",
  "social_constraint",
  "quiet_defiance",
  "bullied",
  "finding_voice",
  "self_doubt",
  "grief",
  "shame",
  "disability",
  "new_parent_fear",
  "public_failure",
  "illness",
  "dismissed",
  "exile",
  "addiction",
];

// User themes as theme → match-count weights. Empty map ⇒ caller disables the theme lane.
export function extractUserThemes(feeling: string): Map<string, number> {
  return getMatchedThemeWeights(feeling);
}

// Asymmetric weighted Jaccard in [0,1]: numerator = total user weight landing on the candidate's
// tags; denominator = all user weight + candidate tags the user didn't match. Reduces to plain
// Jaccard when every user weight is 1. Emphasizes strongly-matched themes; penalizes tag mismatch.
export function weightedJaccard(
  userWeights: Map<string, number>,
  tags: string[],
): number {
  if (userWeights.size === 0) return 0;

  const tagSet = new Set(tags);
  let intersection = 0;
  let userTotal = 0;
  for (const [theme, weight] of userWeights) {
    userTotal += weight;
    if (tagSet.has(theme)) intersection += weight;
  }
  let extraTags = 0;
  for (const tag of tagSet) {
    if (!userWeights.has(tag)) extraTags += 1;
  }

  const denom = userTotal + extraTags;
  return denom === 0 ? 0 : intersection / denom;
}

// clamp(wJaccard(user, themes) − λ·wJaccard(user, antiThemes), THEME_CLAMP).
export function themeScore(
  userWeights: Map<string, number>,
  stage: { themes: string[]; antiThemes: string[] },
): number {
  const positive = weightedJaccard(userWeights, stage.themes);
  const negative = weightedJaccard(userWeights, stage.antiThemes);
  const raw = positive - THEME_LAMBDA * negative;
  return Math.max(THEME_CLAMP.min, Math.min(THEME_CLAMP.max, raw));
}
