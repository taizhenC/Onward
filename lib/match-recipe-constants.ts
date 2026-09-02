import figureLibraryReleases from "../config/figure-library-releases.json";

// Version of the installed retrieval/scoring implementation. Historical
// manifests may remain in the append-only registry, but a selectable primary
// or rollback must name an implementation this build can actually execute.
export const MATCH_CONFIG_IMPLEMENTATION_VERSION =
  "figure-library-50-2026-07-02";

// The figure library ships as an ordered lineage of content releases
// (config/figure-library-releases.json, append-only). A recipe manifest pins
// the snapshot its evidence was evaluated on; the newest release is the one
// this build installs. Both must be registered, and CI proves that the
// installed lib/figures-data.ts hashes to the newest entry.
export const FIGURE_LIBRARY_RELEASE_LINEAGE: readonly string[] = Object.freeze(
  figureLibraryReleases.releases.map((release) => release.sha256),
);
export const LIBRARY_SNAPSHOT_SHA256 =
  FIGURE_LIBRARY_RELEASE_LINEAGE[FIGURE_LIBRARY_RELEASE_LINEAGE.length - 1]!;
export function isRegisteredFigureLibrarySnapshot(sha256: string): boolean {
  return FIGURE_LIBRARY_RELEASE_LINEAGE.includes(sha256);
}

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
