import "server-only";
import type { FacetType, FigureStageRow } from "./types";
import { FACET_TYPES } from "./types";
import { ageDistance } from "./figures";
import {
  AGE_CAP,
  AGE_SLOPE,
  BASE_WEIGHTS,
  FACETSRAG_TOP_K,
  LANE_QUOTAS,
  MAX_NOT_MEAN_ALPHA,
  RRF_K,
  THEME_WEIGHT,
  type RetrievalLane,
} from "./match-config";
import { embedQuery, isEmbeddingStub } from "./embeddings";
import { loadEmbeddingCache, stageCacheKey } from "./embeddings-cache";
import { consumeDerivedOutput } from "./derived-output-retention";
import { extractUserThemes, themeScore } from "./themes";
import { weightedRrf, type LaneRanking } from "./rrf";

// FacetsRAG retrieval (skeleton). Six lanes over the age-gated pool: shape + 4 facets (vector
// cosine) + theme (deterministic). The query is embedded ONCE (raw user feeling) and reused across
// all five vector lanes — the per-facet projection that would warrant separate query vectors is the
// deferred tagger fast-follow.
//
//   Stage A — each lane contributes its top-N (LANE_QUOTAS) to a deduped pool, UNCONDITIONALLY
//             (recovery-asymmetry: a retrieval miss is unrecoverable, so no lane is gated off).
//   Stage B — weighted RRF over the deduped pool, then a MULTIPLICATIVE soft age adjustment, then
//             the top-K handed to the reranker.
//
// Anti-echo: only vectors + theme tags drive retrieval here; the reranker still sees only
// biographicalFacts (lib/llm-real.ts). Nothing from this module reaches pickFigure.

export type RetrievalInput = { age: number; feeling: string };

export type RetrievalResult = {
  // Stage B output: the top-K stages for the reranker, best first.
  pool: FigureStageRow[];
  // Diagnostics for the eval — gold survival is computed THERE (this module never sees the gold
  // label). Cache keys (`${figureKey}/${stageId}`).
  stageAKeys: string[];
  stageBKeys: string[];
  themeLaneActive: boolean;
  // Relative margin between the top two age-adjusted RRF scores, in [0,1]; null when Stage B has
  // fewer than two candidates. A thin margin means retrieval could not meaningfully separate its
  // leaders — with a twin-dense library that is exactly where a confident rerank pick is least
  // trustworthy, so lib/matching.ts demotes framing to "partial" under STAGE_B_NEAR_TIE_MARGIN.
  // Safe operational scalar: derived from scores only, carries no user text.
  stageBTopMargin: number | null;
};

export type RetrievalUnavailableReason = "embedder_stub" | "cache_empty";

export class RetrievalUnavailableError extends Error {
  constructor(
    readonly reason: RetrievalUnavailableReason,
    message: string,
  ) {
    super(message);
    this.name = "RetrievalUnavailableError";
  }
}

type Scored = { key: string; score: number };
type Lane = { lane: RetrievalLane; ranking: string[] };

export async function retrieveFacets(
  input: RetrievalInput,
  pool: FigureStageRow[],
  topK = FACETSRAG_TOP_K,
): Promise<RetrievalResult> {
  if (!Number.isInteger(topK) || topK < 1) {
    throw new Error("FacetsRAG top-K must be a positive integer.");
  }
  // Stub embedder → no real vectors (the seeder refuses stubs). Cheapest check first, before any
  // Supabase or Gemini call.
  if (isEmbeddingStub()) {
    throw new RetrievalUnavailableError(
      "embedder_stub",
      "EMBEDDING_PROVIDER is stub — no query embedding available.",
    );
  }

  const cache = await loadEmbeddingCache();
  if (cache.byStage.size === 0) {
    throw new RetrievalUnavailableError(
      "cache_empty",
      "no embeddings cached for the active model — run scripts/seed-embeddings.ts.",
    );
  }

  // One query embedding, reused across shape + all facet lanes (can throw EmbeddingError → the
  // caller falls back to keyword in auto mode, or fails in facetsrag mode).
  const query = consumeDerivedOutput(
    await embedQuery(input.feeling),
    "retrieval_scoring",
  );

  const stageByKey = new Map<string, FigureStageRow>();
  const poolWithKey = pool.map((stage) => {
    const key = stageCacheKey(stage.figureKey, stage.stageId);
    stageByKey.set(key, stage);
    return { stage, key, vectors: cache.byStage.get(key) };
  });

  // ── Lane scoring ─────────────────────────────────────────────────────────
  const shapeScored: Scored[] = [];
  for (const item of poolWithKey) {
    if (!item.vectors || item.vectors.shape.length === 0) continue;
    const sims = item.vectors.shape.map((vector) => dot(query, vector));
    shapeScored.push({ key: item.key, score: maxNotMean(sims) });
  }

  const facetScored: Record<FacetType, Scored[]> = {
    emotional_core: [],
    decision_shape: [],
    trigger_event: [],
    agency_state: [],
  };
  for (const facetType of FACET_TYPES) {
    for (const item of poolWithKey) {
      const vector = item.vectors?.facets[facetType];
      if (!vector) continue;
      facetScored[facetType].push({ key: item.key, score: dot(query, vector) });
    }
  }

  const userThemes = extractUserThemes(input.feeling);
  // Only stages with a strictly positive theme score enter the lane ranking. A zero (or negative)
  // score means no real overlap or an antiTheme penalty ate it: ranking those stages anyway — in
  // alphabetical order behind the positives — hands them Stage-A theme-quota slots and RRF
  // contributions of the same magnitude as genuine top-rank gaps in other lanes (all 1/(k+r)
  // deltas). This is lane-absence, not pool exclusion: the stage still competes in the five
  // vector lanes, so antiThemes still never hard-exclude (recovery-asymmetry holds).
  const themeScored: Scored[] = (
    userThemes.size > 0
      ? poolWithKey.map((item) => ({
          key: item.key,
          score: themeScore(userThemes, item.stage),
        }))
      : []
  ).filter((entry) => entry.score > 0);
  // Active only when the lane has actual signal: user themes matched AND at least one candidate
  // scored positive. An active-but-empty lane would still pull THEME_WEIGHT out of the
  // renormalization, diluting the vector lanes in exchange for nothing.
  const themeLaneActive = themeScored.length > 0;

  // ── Assemble lanes (theme lane present only when active) ───────────────────
  const lanes: Lane[] = [
    { lane: "shape", ranking: rankLane(shapeScored) },
    ...FACET_TYPES.map((facetType) => ({
      lane: facetType,
      ranking: rankLane(facetScored[facetType]),
    })),
  ];
  if (themeLaneActive) lanes.push({ lane: "theme", ranking: rankLane(themeScored) });

  // Theme-absent BASE_WEIGHTS sum to 1.0; inserting THEME_WEIGHT and renormalizing keeps the active
  // set summing to 1.0 (cosmetic for argmax, but keeps weights interpretable). When the theme lane
  // is dropped, BASE_WEIGHTS is used as-is.
  const rawWeights: Record<RetrievalLane, number> = themeLaneActive
    ? { ...BASE_WEIGHTS, theme: THEME_WEIGHT }
    : { ...BASE_WEIGHTS, theme: 0 };
  const weightSum = lanes.reduce((sum, lane) => sum + rawWeights[lane.lane], 0);

  // ── Stage A: per-lane quotas → deduped pool ───────────────────────────────
  const stageAset = new Set<string>();
  for (const lane of lanes) {
    for (const key of lane.ranking.slice(0, LANE_QUOTAS[lane.lane])) {
      stageAset.add(key);
    }
  }
  const stageAKeys = [...stageAset];

  // ── Stage B: weighted RRF over the deduped pool, then multiplicative age adjust ──
  const laneRankings: LaneRanking[] = lanes.map((lane) => ({
    weight: weightSum === 0 ? 0 : rawWeights[lane.lane] / weightSum,
    keys: lane.ranking.filter((key) => stageAset.has(key)),
  }));
  const rrfScores = weightedRrf(laneRankings, RRF_K);

  const adjusted = stageAKeys.map((key) => {
    const stage = stageByKey.get(key);
    const distance = stage ? ageDistance(stage, input.age) : 0;
    const penalty = Math.min(AGE_CAP, distance * AGE_SLOPE);
    return { key, score: (rrfScores.get(key) ?? 0) * (1 - penalty) };
  });
  adjusted.sort((a, b) => b.score - a.score || a.key.localeCompare(b.key));

  const stageBKeys = adjusted.slice(0, topK).map((entry) => entry.key);
  const resultPool = stageBKeys
    .map((key) => stageByKey.get(key))
    .filter((stage): stage is FigureStageRow => stage !== undefined);

  const stageBTopMargin =
    adjusted.length >= 2 && adjusted[0].score > 0
      ? (adjusted[0].score - adjusted[1].score) / adjusted[0].score
      : null;

  return { pool: resultPool, stageAKeys, stageBKeys, themeLaneActive, stageBTopMargin };
}

// max_s sim + α·second_max_s sim — keeps the single strongest shape-sentence match dominant while
// rewarding a second corroborating anchor. Averaging would blur the distinct anchors.
function maxNotMean(sims: number[]): number {
  if (sims.length === 0) return Number.NEGATIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  let second = Number.NEGATIVE_INFINITY;
  for (const sim of sims) {
    if (sim > max) {
      second = max;
      max = sim;
    } else if (sim > second) {
      second = sim;
    }
  }
  return second === Number.NEGATIVE_INFINITY ? max : max + MAX_NOT_MEAN_ALPHA * second;
}

// Cosine via dot product (both sides L2-normalized at write/query time). The min-length guard is
// belt-and-suspenders against a dim drift that the stale-vector gate should already exclude.
function dot(a: number[], b: number[]): number {
  const length = Math.min(a.length, b.length);
  let sum = 0;
  for (let i = 0; i < length; i++) sum += a[i] * b[i];
  return sum;
}

function rankLane(scored: Scored[]): string[] {
  return [...scored]
    .sort((a, b) => b.score - a.score || a.key.localeCompare(b.key))
    .map((entry) => entry.key);
}
