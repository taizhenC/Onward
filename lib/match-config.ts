import type { Confidence, FacetType, Framing } from "./types";

export const matchConfigVersion = "facetsrag-skeleton-inmemory-2026-06-08";

export const AGE_TOLERANCE_YEARS = 10;

export const PARTIAL_FRAMING_THRESHOLD = 1;

export const RERANK_TOP_K = 6;

export const RERANK_TRUST_GATE = {
  minCoverage: 0.95,
  minRerankTop1: 0.971,
  minOverallTop1: 0.971,
  minMissDetection: 1,
  maxDefinitiveWrong: 0,
  maxHardConfusion: 0,
} as const;

// Confidence → framing. Only "definitive" | "partial" crosses the wire (CLAUDE.md:
// the client never sees the underlying confidence). ONLY a "high"-confidence pick is
// framed as a definitive mirror; "medium" and "low" (and every keyword-hybrid fallback)
// are framed "partial" ("a fragment that rhymes"). The rerank eval shows "high" is a
// clean signal (all correct) while "medium" is a mixed bucket holding wrong and no-match
// cases — so presenting a medium pick as definitive is the trust-killer CLAUDE.md warns
// against. This preserves the match choice while making the framing honest when the model
// itself is not fully certain.
export function framingFromConfidence(confidence: Confidence): Framing {
  return confidence === "high" ? "definitive" : "partial";
}

// ── FacetsRAG retrieval (skeleton) ─────────────────────────────────────────────
// Static lane weights + quotas for the in-memory Stage-A/Stage-B retrieval that feeds the
// reranker. No tagger / projection / dynamic-weights yet (deferred fast-follow); WEIGHT_BOUNDS
// ship now so the dynamic variant is a later config flip, not a refactor. Loosening any of these
// requires eval evidence (recovery-asymmetry) — never intuition.

// The five embedded lanes (shape + one per facet) and the full lane set (+ deterministic theme).
export type VectorLane = "shape" | FacetType;
export type RetrievalLane = VectorLane | "theme";

// BASE_WEIGHTS is the THEME-ABSENT weighting: the five embedded lanes summing to 1.0. When the
// theme lane is active (user themes matched), THEME_WEIGHT is inserted and the set is renormalized
// back to 1.0 (lib/facets-retrieval.ts). When no user theme matched, the theme lane is dropped and
// BASE_WEIGHTS is used as-is — never scoring everything 0 as arbitrary tie-break noise.
export const BASE_WEIGHTS: Record<VectorLane, number> = {
  shape: 0.45,
  emotional_core: 0.25,
  decision_shape: 0.15,
  trigger_event: 0.1,
  agency_state: 0.05,
};

export const THEME_WEIGHT = 0.15;

// Bounds for the (deferred) dynamic-weight variant — passive, tight, eval-tunable. Unused by the
// skeleton (static BASE_WEIGHTS only); present so the dynamic fast-follow is a config change.
export const WEIGHT_BOUNDS: Record<VectorLane, { min: number; max: number }> = {
  shape: { min: 0.3, max: 0.55 },
  emotional_core: { min: 0.15, max: 0.35 },
  decision_shape: { min: 0.05, max: 0.25 },
  trigger_event: { min: 0.03, max: 0.2 },
  agency_state: { min: 0.02, max: 0.15 },
};

// Reciprocal-rank-fusion constant (Stage B). Standard k=60.
export const RRF_K = 60;

// Stage A per-lane quotas: each lane contributes its top-N post-filter to the deduped pool
// UNCONDITIONALLY (recovery-asymmetry — a retrieval miss is unrecoverable). At 20 figures behind a
// ±10y age gate the live pool is smaller than these, so today every age-gated stage survives Stage
// A; the quotas only bite once the library grows.
export const LANE_QUOTAS: Record<RetrievalLane, number> = {
  shape: 20,
  emotional_core: 20,
  decision_shape: 20,
  trigger_event: 15,
  agency_state: 15,
  theme: 20,
};

// Shape lane aggregation: max-not-mean over a stage's shape sentences —
// max_s sim(q,s) + α·second_max_s sim(q,s). Averaging would blur the distinct anchors.
export const MAX_NOT_MEAN_ALPHA = 0.15;

// Theme lane (deterministic): clamp(wJaccard(user,themes) − λ·wJaccard(user,antiThemes), lo, hi).
export const THEME_LAMBDA = 1.0;
export const THEME_CLAMP = { min: -0.25, max: 0.35 } as const;

// Soft age adjustment applied AFTER Stage B RRF, MULTIPLICATIVELY (additive would swamp the tiny
// 1/(k+rank) RRF scores): adjusted = rrf · (1 − min(AGE_CAP, ageDistance·AGE_SLOPE)). At the ±10y
// hard-gate edge the penalty reaches the cap. Age nudges ranking; it never dominates meaning.
export const AGE_CAP = 0.2;
export const AGE_SLOPE = 0.02;

// Stage B output size: the top-K stages handed to the reranker.
export const FACETSRAG_TOP_K = 12;

// Lowercase substring → theme tags. A figure earns one point per matched keyword whose theme tag
// is in the figure's themes[]. Drives the keyword-hybrid scorer/fallback AND (via the exported
// getMatchedThemeWeights in lib/keyword-match.ts) the deterministic FacetsRAG theme lane.
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

  // Rogers — bullied / solitude / finding_voice
  bullied: ["bullied"],
  bully: ["bullied"],
  "picked on": ["bullied"],
  "made fun of": ["bullied"],
  "makes fun of": ["bullied"],
  "pick on": ["bullied"],
  "picks on": ["bullied"],
  "laughed at": ["bullied"],
  "left out": ["bullied", "solitude"],
  "don't fit in": ["bullied", "solitude"],
  "nobody likes me": ["solitude", "bullied"],
  "no friends": ["solitude"],
  "any friends": ["solitude"],
  "have no friends": ["solitude"],
  "express myself": ["finding_voice"],

  // Julia Child — late_start / self_doubt / keep_going
  "no calling": ["late_start", "self_doubt"],
  "no purpose": ["late_start", "self_doubt"],
  aimless: ["late_start", "self_doubt"],
  drifting: ["late_start"],
  "haven't found": ["late_start", "self_doubt"],
  "still don't know what": ["late_start"],
  "no idea what": ["late_start", "self_doubt"],
  "what i'm supposed to do": ["late_start", "self_doubt"],
  "what to do with my life": ["late_start"],
  "not good enough": ["self_doubt"],
  "in over my head": ["self_doubt"],
  impostor: ["self_doubt"],
  imposter: ["self_doubt"],

  // C.S. Lewis — grief / solitude / self_doubt
  grief: ["grief"],
  grieving: ["grief"],
  mourning: ["grief"],
  "passed away": ["grief"],
  died: ["grief"],
  "lost my husband": ["grief", "solitude"],
  "lost my wife": ["grief", "solitude"],
  "lost my mother": ["grief"],
  "lost my father": ["grief"],
  widow: ["grief"],
  funeral: ["grief"],
  "lost someone": ["grief"],
  "loved most": ["grief"],
  "believe in anything": ["self_doubt"],

  // James Earl Jones — shame / finding_voice / solitude
  ashamed: ["shame"],
  shame: ["shame"],
  embarrassed: ["shame"],
  "can't speak up": ["finding_voice", "shame"],
  "afraid to speak": ["finding_voice", "shame"],
  "can't find the words": ["finding_voice"],
  "no voice": ["finding_voice"],
  "stay silent": ["finding_voice", "solitude"],
  "keep it inside": ["shame", "finding_voice"],
  stutter: ["finding_voice", "shame"],

  // Wilma Rudolph — disability / keep_going / quiet_defiance
  disabled: ["disability"],
  disability: ["disability"],
  "can't walk": ["disability"],
  "never walk": ["disability", "quiet_defiance"],
  "my body won't": ["disability"],
  "wrote me off": ["disability", "quiet_defiance"],
  "told i'd never": ["disability", "quiet_defiance"],

  // Maya Angelou — new_parent_fear / self_doubt / keep_going
  "new parent": ["new_parent_fear"],
  "first child": ["new_parent_fear"],
  "just had a baby": ["new_parent_fear"],
  "new baby": ["new_parent_fear"],
  "be a good mother": ["new_parent_fear", "self_doubt"],
  "be a good father": ["new_parent_fear", "self_doubt"],
  "be a good parent": ["new_parent_fear", "self_doubt"],
  "ruin my kid": ["new_parent_fear"],
  "mess up my kid": ["new_parent_fear"],
  "too young to": ["new_parent_fear", "self_doubt"],
  "fail my child": ["new_parent_fear"],

  // Rachmaninoff — public_failure / creative_dismissal / keep_going
  humiliated: ["public_failure", "shame"],
  humiliation: ["public_failure", "shame"],
  "failed in front of": ["public_failure"],
  "everyone saw me fail": ["public_failure"],
  "made a fool of myself": ["public_failure", "shame"],
  "fell apart in public": ["public_failure"],
  "can't create": ["creative_dismissal", "public_failure"],
  "creative block": ["creative_dismissal"],
  "lost my confidence": ["public_failure", "self_doubt"],
  "torn apart": ["public_failure", "creative_dismissal"],

  // Flannery O'Connor — illness / solitude / keep_going
  "got sick": ["illness"],
  "seriously ill": ["illness"],
  illness: ["illness"],
  chronic: ["illness"],
  diagnosed: ["illness"],
  "body is failing": ["illness"],
  incurable: ["illness"],
  dying: ["illness"],
  "running out of time": ["illness", "keep_going"],
  "can't do what i used to": ["illness"],

  // Barry Marshall — dismissed / quiet_defiance / keep_going
  dismissed: ["dismissed"],
  "no one believes me": ["dismissed"],
  "nobody believes me": ["dismissed"],
  "they don't believe me": ["dismissed"],
  "not taken seriously": ["dismissed"],
  "ignored my work": ["dismissed"],
  "ahead of my time": ["dismissed"],
  "i know i'm right": ["dismissed", "quiet_defiance"],
  "prove them wrong": ["dismissed", "quiet_defiance"],
  "laughed out of": ["dismissed"],

  // Isabel Allende — exile / self_invention / finding_voice
  exile: ["exile"],
  exiled: ["exile"],
  "had to flee": ["exile", "dispossession"],
  "lost my country": ["exile", "dispossession"],
  "lost my home": ["exile"],
  "far from home": ["exile", "solitude"],
  "forced to leave": ["exile"],
  refugee: ["exile"],
  "start over in a new country": ["exile", "self_invention"],
  "everything i knew is gone": ["exile", "dispossession"],

  // Bill Wilson — addiction / shame / keep_going
  addicted: ["addiction"],
  addiction: ["addiction"],
  "can't stop drinking": ["addiction"],
  "can't stop gambling": ["addiction"],
  "can't stop using": ["addiction"],
  alcoholic: ["addiction"],
  "rock bottom": ["addiction", "shame"],
  "hit bottom": ["addiction"],
  "drinking has": ["addiction"],
  "too ashamed to tell": ["shame", "addiction"],

  // Vera Wang — late_start / self_invention / public_failure
  "passed over": ["public_failure", "self_invention"],
  "didn't get the promotion": ["public_failure"],
  "didn't get the job": ["public_failure"],
  "start a new career": ["late_start", "self_invention"],
  "start over at": ["late_start", "self_invention"],
  "the plan didn't work": ["self_invention", "late_start"],
  "career change": ["late_start", "self_invention"],
  "starting again": ["late_start", "self_invention"],

  // Raymond Chandler — late_start / public_failure / self_invention
  fired: ["public_failure", "self_invention"],
  "lost my job": ["public_failure"],
  "begin again": ["late_start", "self_invention"],
  "reinvent myself": ["self_invention", "late_start"],
  "wasted my best years": ["late_start", "public_failure"],
  "start from scratch": ["self_invention", "late_start"],

  // Katharine Graham — self_doubt / social_constraint / finding_voice
  "feel like a fraud": ["self_doubt"],
  "don't belong": ["self_doubt", "social_constraint"],
  "out of my depth": ["self_doubt"],
  "made me feel small": ["social_constraint", "self_doubt"],
  "not smart enough": ["self_doubt"],
  "thrust into": ["self_doubt"],
  "pushed into": ["self_doubt", "social_constraint"],
  "everyone expects me to fail": ["self_doubt"],

  // Barbara McClintock — dismissed / quiet_defiance / keep_going
  overlooked: ["dismissed"],
  "no recognition": ["dismissed"],
  "no one understands": ["dismissed"],
  "my work is ignored": ["dismissed"],
  "ignored for years": ["dismissed", "keep_going"],

  // Bayard Rustin — dismissed / social_constraint / quiet_defiance
  "no credit": ["dismissed"],
  "get no credit": ["dismissed"],
  "do all the work": ["dismissed"],
  "behind the scenes": ["dismissed"],
  "pushed aside": ["dismissed", "social_constraint"],
  "pushed me aside": ["dismissed", "social_constraint"],
  "in the background": ["dismissed"],
  "for who i am": ["social_constraint"],
  "because of who i": ["social_constraint"],
  erased: ["dismissed"],

  // Harland Sanders — late_start / public_failure / keep_going
  "at my age": ["late_start"],
  "lost everything": ["public_failure", "late_start"],
  "have to start over": ["late_start", "self_invention"],
  "too old now": ["late_start"],
  "starting over so late": ["late_start"],
};
