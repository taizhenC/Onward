import { getMatchedThemeWeights } from "./keyword-match";
import { THEME_LAMBDA } from "./match-config";

// Deterministic theme lane, with no embedder. User themes come from the same keyword parser
// the keyword scorer uses. Candidate stages are scored by weighted Jaccard against themes[],
// minus a weighted antiTheme penalty. AntiThemes only penalize; they never hard-exclude.
//
// When no user theme matched, lib/facets-retrieval.ts disables this lane entirely and
// renormalizes the remaining weights. A theme lane scoring everything 0 is tie-break noise.

// Controlled vocabulary used by authored stage themes and STUB_KEYWORD_MAP tags.
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

// User themes as theme -> match-count weights. Empty map means the caller disables the lane.
export function extractUserThemes(feeling: string): Map<string, number> {
  return getMatchedThemeWeights(feeling);
}

// Asymmetric weighted Jaccard in [0,1]: numerator = total user weight landing on the candidate's
// tags; denominator = all user weight + candidate tags the user did not match. Reduces to plain
// Jaccard when every user weight is 1.
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

// Raw score is intentionally not clamped before ranking. RRF consumes rank order, and clamping
// would flatten strong theme matches into arbitrary tie-breaks.
export function themeScore(
  userWeights: Map<string, number>,
  stage: { themes: string[]; antiThemes: string[] },
): number {
  const positive = weightedJaccard(userWeights, stage.themes);
  const negative = weightedJaccard(userWeights, stage.antiThemes);
  return positive - THEME_LAMBDA * negative;
}
