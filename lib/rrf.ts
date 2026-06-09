// Reciprocal Rank Fusion (Stage B). Each lane contributes weight_lane / (k + rank) to every key it
// ranks; the per-key sum across lanes is the fused score. RRF combines rankings whose raw scores
// aren't comparable across lanes (cosine vs theme Jaccard), which is exactly our case — so we fuse
// ranks, not scores. k=60 is the standard constant (lib/match-config.ts RRF_K).

export type LaneRanking = {
  // Lane weight (already theme-adjusted/renormalized by the caller).
  weight: number;
  // Keys in this lane's order, best first. Rank is the 1-based index.
  keys: string[];
};

// Fused score per key. Keys absent from a lane simply receive nothing from that lane.
export function weightedRrf(lanes: LaneRanking[], k: number): Map<string, number> {
  const scores = new Map<string, number>();
  for (const lane of lanes) {
    lane.keys.forEach((key, index) => {
      const rank = index + 1;
      const contribution = lane.weight / (k + rank);
      scores.set(key, (scores.get(key) ?? 0) + contribution);
    });
  }
  return scores;
}
