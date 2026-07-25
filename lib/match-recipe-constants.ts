// Version of the installed retrieval/scoring implementation. Historical
// manifests may remain in the append-only registry, but a selectable primary
// or rollback must name an implementation this build can actually execute.
export const MATCH_CONFIG_IMPLEMENTATION_VERSION =
  "figure-library-50-2026-07-02";
export const LIBRARY_SNAPSHOT_SHA256 =
  "e88751de566fa1077059cee143c4bd9d88b55e8adcca48eab4d5fa49b04ddf88";

// Immutable minimum acceptance policy for the installed matching release.
// Keep it provider-free so governance/eval tooling can import it without
// crossing a server-only runtime boundary.
export const RERANK_TRUST_GATE = {
  minCoverage: 0.95,
  minRerankTop1: 0.971,
  minOverallTop1: 0.971,
  minMissDetection: 1,
  maxDefinitiveWrong: 0,
  maxHardConfusion: 0,
} as const;
