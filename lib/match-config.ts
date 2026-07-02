import type { Confidence, FacetType, Framing } from "./types";

export const matchConfigVersion = "figure-library-50-2026-07-02";

// ── Retention TTLs (CLAUDE.md: TTLs live here, version-stamped — not as magic numbers in
// the cron job). SQL can't read TS, so migration 0003's pg_cron schedules are the LIVE
// copies of these values; change both together.
//   - Anonymous guests (and their sessions, via FK cascade) are deleted this many hours
//     after their last reading activity. Linking an email exempts the user permanently.
//   - sessions.feeling / the user's disclosure is NULL'd this many days after creation;
//     structural fields are preserved.
export const ANON_USER_TTL_HOURS = 6;
export const FEELING_RETENTION_DAYS = 60;

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
// UNCONDITIONALLY (recovery-asymmetry — a retrieval miss is unrecoverable). At 50 figures the
// densest age windows (late teens/twenties) put ~25-30 stages behind the ±10y gate, so the quotas
// can now bite; eval-retrieval's Stage A/B gold-survival check is the tripwire for retuning them.
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

// Stage B output size: the top-K stages handed to the reranker. Tightened 12 → 8 at the
// 50-figure library (2026-07-02 eval): with 12 candidates the rerank regressed on previously
// green cases (lee definitive-wrongs, butler smoke leak); at 8 the choice set matches the
// keyword path's proven regime while Stage B gold survival stays 100% (eval-retrieval).
export const FACETSRAG_TOP_K = 8;

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
  "something wrong with me": ["bullied", "worthlessness"],
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
  "stopped talking": ["finding_voice", "shame"],

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
  terrified: ["new_parent_fear", "self_doubt"],

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

  // Irving Berlin — dispossession / worthlessness / finding_voice
  "left home": ["dispossession"],
  burden: ["worthlessness"],
  "contribute nothing": ["worthlessness"],
  "one less mouth": ["worthlessness", "dispossession"],
  sing: ["finding_voice"],
  singing: ["finding_voice"],

  // Ray Charles — grief / disability / self_invention
  blind: ["disability"],
  "can't see": ["disability"],
  orphan: ["dispossession", "grief"],
  orphaned: ["dispossession", "grief"],
  "take care of myself": ["self_invention"],

  // Anne Sullivan — dispossession / worthlessness / self_invention
  "no one came": ["dispossession", "solitude"],
  "gave up on me": ["dispossession", "worthlessness"],
  "foster care": ["dispossession"],
  "catch up": ["worthlessness", "self_invention"],
  "can't read": ["worthlessness"],

  // Ella Fitzgerald — dispossession / solitude / finding_voice
  homeless: ["dispossession"],
  "nowhere to go": ["dispossession", "solitude"],
  "nowhere to sleep": ["dispossession"],
  "on the streets": ["dispossession"],
  "no family": ["dispossession", "solitude"],

  // Sidney Poitier — dismissed / worthlessness / self_invention
  accent: ["dismissed"],
  audition: ["dismissed"],
  "not cut out": ["dismissed", "worthlessness"],
  "dead-end": ["worthlessness"],

  // Nina Simone — dismissed / shame / finding_voice
  conservatory: ["dismissed"],
  "didn't get in": ["dismissed"],
  "turned me down": ["dismissed"],
  "fake name": ["shame"],

  // Hans Christian Andersen — bullied / worthlessness / keep_going
  "humiliates me": ["bullied", "shame"],
  "calls me stupid": ["bullied", "worthlessness"],
  "makes me feel stupid": ["bullied", "worthlessness"],
  stupid: ["worthlessness"],
  mocked: ["bullied", "dismissed"],
  mocks: ["bullied"],
  ridiculed: ["bullied", "dismissed"],

  // Maria Tallchief — social_constraint / quiet_defiance / dismissed
  "change who i am": ["social_constraint", "quiet_defiance"],
  "where i come from": ["social_constraint"],
  "hide where i come from": ["social_constraint", "shame"],
  "proud of who i am": ["quiet_defiance"],
  "won't change": ["quiet_defiance"],
  novelty: ["dismissed"],
  erase: ["dismissed", "social_constraint"],
  heritage: ["social_constraint"],
  assimilate: ["social_constraint"],

  // Astrid Lindgren — shame / new_parent_fear / solitude
  pregnant: ["new_parent_fear"],
  pregnancy: ["new_parent_fear"],
  "single mom": ["new_parent_fear", "solitude"],
  "single mother": ["new_parent_fear", "solitude"],
  "single dad": ["new_parent_fear", "solitude"],
  "single father": ["new_parent_fear", "solitude"],
  "judging me": ["shame"],
  scandal: ["shame"],
  unplanned: ["new_parent_fear"],

  // Edmonia Lewis — dismissed / dispossession / quiet_defiance
  "falsely accused": ["dismissed"],
  accused: ["dismissed", "shame"],
  "cleared my name": ["dismissed", "quiet_defiance"],
  "kicked out": ["dispossession", "dismissed"],
  "kicked me out": ["dispossession", "dismissed"],
  expelled: ["dispossession", "dismissed"],

  // Sofia Kovalevskaya — social_constraint / self_invention / quiet_defiance
  "won't let me": ["social_constraint"],
  "because i'm a woman": ["social_constraint"],
  "because i'm a girl": ["social_constraint"],
  forbidden: ["social_constraint"],
  "find a way around": ["quiet_defiance", "self_invention"],

  // Langston Hughes — social_constraint / self_invention / finding_voice
  "waste of time": ["creative_dismissal", "social_constraint"],
  "practical career": ["social_constraint"],
  "my own path": ["self_invention", "quiet_defiance"],
  "my own voice": ["finding_voice"],
  "find my voice": ["finding_voice"],
  poetry: ["finding_voice"],
  poems: ["finding_voice"],

  // Mary Shelley — grief / solitude / keep_going
  "lost my child": ["grief"],
  "lost my baby": ["grief"],
  "lost my son": ["grief"],
  "lost my daughter": ["grief"],
  widowed: ["grief", "solitude"],
  "one loss after another": ["grief"],
  "so much loss": ["grief"],

  // Nellie Bly — dismissed / social_constraint / finding_voice
  "won't hire me": ["dismissed"],
  "no jobs for": ["dismissed", "social_constraint"],
  "take me seriously": ["dismissed"],
  pigeonhole: ["social_constraint"],
  pigeonholed: ["social_constraint"],
  "things to say": ["finding_voice"],

  // Michael Faraday — social_constraint / dismissed / self_invention
  "look down on me": ["social_constraint", "dismissed"],
  "looks down on me": ["social_constraint", "dismissed"],
  "looked down on": ["social_constraint", "dismissed"],
  "treat me like a servant": ["social_constraint", "dismissed"],
  "beneath them": ["social_constraint"],
  "no degree": ["social_constraint", "worthlessness"],
  "self-taught": ["self_invention"],
  "self taught": ["self_invention"],
  "taught myself": ["self_invention"],
  "working class": ["social_constraint"],

  // George Washington Carver — dismissed / solitude / keep_going
  "because i'm black": ["dismissed", "social_constraint"],
  "because of my race": ["dismissed", "social_constraint"],
  "turned away": ["dismissed"],
  "turned me away": ["dismissed"],
  "middle of nowhere": ["solitude"],

  // Srinivasa Ramanujan — worthlessness / solitude / keep_going
  "failed my exams": ["worthlessness"],
  "failed out": ["worthlessness"],
  flunked: ["worthlessness"],
  "dropped out": ["worthlessness"],
  "no qualifications": ["worthlessness", "social_constraint"],
  "no credentials": ["worthlessness", "social_constraint"],
  crank: ["dismissed"],

  // Mary Anning — social_constraint / dismissed / keep_going
  "take the credit": ["dismissed"],
  "takes the credit": ["dismissed"],
  "took the credit": ["dismissed"],
  "gets the credit": ["dismissed"],
  "not allowed in": ["social_constraint"],
  barred: ["social_constraint"],
  "feed my family": ["keep_going"],

  // Jesse Owens — dispossession / worthlessness / self_invention
  "taken away": ["dispossession"],
  "taken from me": ["dispossession"],
  banned: ["dispossession", "dismissed"],
  suspended: ["dispossession", "dismissed"],
  "washed up": ["worthlessness", "late_start"],
  "used to be somebody": ["worthlessness", "dispossession"],

  // W. B. Yeats — heartbreak / solitude / finding_voice
  "love me back": ["heartbreak"],
  "never loved me": ["heartbreak"],
  "love someone who": ["heartbreak"],
  "just friends": ["heartbreak"],

  // Bessie Coleman — dismissed / quiet_defiance / self_invention
  "no school would": ["dismissed"],
  "won't teach me": ["dismissed"],
  "won't train me": ["dismissed"],
  "refused to": ["dismissed"],
  "not for people like me": ["dismissed", "social_constraint"],
  "find another way": ["quiet_defiance", "self_invention"],
  "another way in": ["quiet_defiance", "self_invention"],

  // Hedy Lamarr — dismissed / creative_dismissal / social_constraint
  "just a pretty face": ["dismissed", "social_constraint"],
  "pretty face": ["dismissed"],
  "only see my looks": ["dismissed", "social_constraint"],
  "shot down": ["creative_dismissal", "dismissed"],
  underestimate: ["dismissed"],
  underestimated: ["dismissed"],

  // Zora Neale Hurston — self_invention / late_start / dispossession
  "missed my window": ["late_start"],
  "missed my chance": ["late_start"],
  "ahead of me": ["late_start"],
  "go back to school": ["late_start", "self_invention"],
  "years behind": ["late_start", "worthlessness"],
  "decade behind": ["late_start"],

  // John Muir — illness / solitude / self_invention
  accident: ["illness"],
  "almost died": ["illness"],
  "wake-up call": ["illness", "self_invention"],
  "second chance": ["self_invention", "illness"],
  "lost my sight": ["disability", "illness"],
  "going blind": ["disability", "illness"],
  "what really matters": ["self_invention"],

  // Frederick Banting — worthlessness / dismissed / keep_going
  "no patients": ["worthlessness"],
  "no clients": ["worthlessness"],
  "practice is failing": ["worthlessness"],
  "won't fund": ["dismissed"],
  "no one will back": ["dismissed"],

  // Charlotte Brontë — creative_dismissal / social_constraint / keep_going
  "every publisher": ["creative_dismissal"],
  "nobody bought": ["creative_dismissal", "worthlessness"],
  unpublished: ["creative_dismissal"],

  // Dmitri Shostakovich — public_failure / social_constraint / quiet_defiance
  denounced: ["public_failure", "social_constraint"],
  "publicly shamed": ["public_failure", "shame"],
  cancelled: ["public_failure", "dismissed"],
  canceled: ["public_failure", "dismissed"],
  "turned on me": ["public_failure", "social_constraint"],

  // John Coltrane — addiction / shame / keep_going
  relapse: ["addiction"],
  relapsed: ["addiction"],
  "get clean": ["addiction", "keep_going"],
  "getting clean": ["addiction", "keep_going"],
  "got clean": ["addiction", "keep_going"],
  sober: ["addiction"],
  "cold turkey": ["addiction"],

  // Agatha Christie — heartbreak / grief / self_invention
  "wants a divorce": ["heartbreak"],
  "loves someone else": ["heartbreak"],
  "for someone else": ["heartbreak"],

  // Florence Nightingale — burnout / illness / keep_going
  "can't work anymore": ["burnout", "illness"],
  "no energy": ["burnout"],
  overworked: ["burnout"],
  "pushed myself too hard": ["burnout"],

  // Heartbreak (generic) — christie / yeats
  heartbreak: ["heartbreak"],
  heartbroken: ["heartbreak"],
  "heart is broken": ["heartbreak"],
  breakup: ["heartbreak"],
  "broke up": ["heartbreak"],
  "break up": ["heartbreak"],
  divorce: ["heartbreak"],
  divorced: ["heartbreak"],
  "left me": ["heartbreak"],
  cheated: ["heartbreak"],
  "cheating on me": ["heartbreak"],
  betrayed: ["heartbreak"],
  betrayal: ["heartbreak"],
  dumped: ["heartbreak"],
  affair: ["heartbreak"],
  "doesn't love me": ["heartbreak"],
  "didn't love me": ["heartbreak"],
  "won't love me back": ["heartbreak"],
  "doesn't want me": ["heartbreak"],
  "rejected me": ["heartbreak"],
  unrequited: ["heartbreak"],

  // Burnout (generic) — nightingale
  burnout: ["burnout"],
  "burned out": ["burnout"],
  "burnt out": ["burnout"],
  exhausted: ["burnout"],
  exhaustion: ["burnout"],
  drained: ["burnout"],
  "running on empty": ["burnout"],
  "nothing left to give": ["burnout"],
  "used up": ["burnout"],
  "tired all the time": ["burnout"],
};
