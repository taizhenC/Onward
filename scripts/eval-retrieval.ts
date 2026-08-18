import "./_smoke-bootstrap";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnvLocal } from "./_load-env";
import { listAll } from "../lib/figures";
import { matchWithDebug } from "../lib/matching";
import { embeddingModelId, isEmbeddingStub } from "../lib/embeddings";
import { matchConfigVersion } from "../lib/match-config";

// Retrieval-only eval: does the GOLD figure survive Stage A (deduped pool) and Stage B (top-K to
// the reranker)? Runs the FacetsRAG retrieval with the STUB reranker — Gemini query embeddings, NO
// Cerebras — so it's the cheap, fast loop for tuning lanes / quotas / weights BEFORE spending a full
// rerank eval. A gold that doesn't survive Stage B never reaches the reranker (recovery-asymmetry:
// unrecoverable), so Stage B survival is the gate.
//
// Survival is computed HERE from the matcher's stageAKeys/stageBKeys; lib/matching.ts never sees the
// gold label.

// Pin BEFORE the first match call (providers resolve lazily on first use): stub reranker, forced
// FacetsRAG (so this can never silently measure the keyword path). EMBEDDING_PROVIDER=gemini +
// Supabase env come from .env.local.
process.env.LLM_PROVIDER = "stub";
process.env.RETRIEVAL_MODE = "facetsrag";

// Same dataset override eval-match honors, so the retrieval loop can tune against successor
// datasets (e.g. the semantic-slice sets) without touching the frozen default.
function goldPath(): string {
  return resolve(
    process.cwd(),
    process.env.EVAL_DATASET_PATH?.trim() || "evals/match.json",
  );
}

type GoldCase = {
  age: number;
  feeling: string;
  expect: string;
  semantic?: boolean;
  accept?: string[];
};

function loadGold(): GoldCase[] {
  const path = goldPath();
  const raw = JSON.parse(readFileSync(path, "utf8")) as {
    cases?: Array<{
      age?: unknown;
      feeling?: unknown;
      expect?: unknown;
      semantic?: unknown;
      accept?: unknown;
    }>;
  };
  if (!Array.isArray(raw.cases)) {
    console.error(`${path} must have a cases[] array.`);
    process.exit(1);
  }
  const cases: GoldCase[] = [];
  for (const entry of raw.cases) {
    if (
      typeof entry.age === "number" &&
      typeof entry.feeling === "string" &&
      typeof entry.expect === "string"
    ) {
      cases.push({
        age: entry.age,
        feeling: entry.feeling,
        expect: entry.expect,
        semantic: entry.semantic === true || undefined,
        accept:
          Array.isArray(entry.accept) &&
          entry.accept.every((key): key is string => typeof key === "string")
            ? entry.accept
            : undefined,
      });
    }
  }
  return cases;
}

// Acceptable answers for a case: expect plus any multi-gold accept[] keys (twin stages the
// input genuinely underdetermines — mirrors eval-match's scoring).
function acceptableKeys(gold: GoldCase): Set<string> {
  return new Set([gold.expect, ...(gold.accept ?? [])]);
}

function keysIncludeFigure(
  keys: string[] | undefined,
  acceptable: ReadonlySet<string>,
): boolean {
  return (keys ?? []).some((key) => acceptable.has(key.split("/")[0]));
}

// 1-based rank of the best acceptable answer within the ordered Stage B list; 0 when absent.
// Stage B keys arrive best-first from lib/facets-retrieval.ts.
function goldStageBRank(
  keys: string[] | undefined,
  acceptable: ReadonlySet<string>,
): number {
  const index = (keys ?? []).findIndex((key) => acceptable.has(key.split("/")[0]));
  return index === -1 ? 0 : index + 1;
}

function pct(num: number, den: number): string {
  return den === 0 ? "n/a" : `${((num / den) * 100).toFixed(1)}%`;
}

async function main(): Promise<void> {
  console.log("Onward retrieval eval (Stage A/B gold survival, no Cerebras)");
  console.log("===========================================================");
  console.log("");

  const env = loadEnvLocal();
  console.log(
    env.found
      ? `Loaded ${env.loaded} var(s) from .env.local`
      : "No .env.local found; using shell environment",
  );

  if (isEmbeddingStub()) {
    console.error(
      "EMBEDDING_PROVIDER is stub (or unset) — retrieval needs the real embedder. Set " +
        "EMBEDDING_PROVIDER=gemini and GEMINI_API_KEY.",
    );
    process.exit(1);
  }

  await listAll(); // surface a clear figures-source error before per-case retrieval
  const cases = loadGold().filter((c) => c.expect !== "miss");
  console.log(`model=${embeddingModelId()} matchConfigVersion=${matchConfigVersion}`);
  console.log(`cases (non-miss)=${cases.length} mode=facetsrag rerank=stub`);
  console.log(`dataset=${goldPath()}`);
  console.log("");

  let survivedA = 0;
  let survivedB = 0;
  const missedA: string[] = [];
  const missedBOnly: string[] = [];
  // Gold's 1-based rank within the ordered Stage B list, per surviving case. The 2026-07-02
  // challenger run showed the reranker picks Stage-B #1 in ~94% of trials, so survival alone is
  // the wrong health metric: end-to-end accuracy tracks gold@1, not gold-survived. Rank metrics
  // are the cheap predictor of what the full rerank eval will say.
  const goldRanks: number[] = [];
  const semanticFlags: boolean[] = [];
  // Cases where gold survived Stage B but is NOT the default pick: the rerank has to actively
  // rescue these, which the July evidence shows it does under half the time. Figure keys and ages
  // only — never feelings.
  const notAt1: string[] = [];

  for (const gold of cases) {
    let result;
    try {
      result = await matchWithDebug({ age: gold.age, feeling: gold.feeling });
    } catch (error) {
      // Forced facetsrag throws when unavailable — global, so fail fast with the cause.
      console.error("");
      console.error(
        `Retrieval failed: ${error instanceof Error ? error.message : "unknown error"}`,
      );
      console.error("Did you apply migration 0002 and run `npm run seed-embeddings`?");
      process.exit(1);
    }

    const acceptable = acceptableKeys(gold);
    const inA = keysIncludeFigure(result.stageAKeys, acceptable);
    const inB = keysIncludeFigure(result.stageBKeys, acceptable);
    if (inA) survivedA += 1;
    if (inB) survivedB += 1;
    if (!inA) missedA.push(`${gold.expect} (age ${gold.age})`);
    else if (!inB) missedBOnly.push(`${gold.expect} (age ${gold.age})`);
    const rank = goldStageBRank(result.stageBKeys, acceptable);
    goldRanks.push(rank);
    semanticFlags.push(gold.semantic === true);
    if (rank > 1) {
      const top1 = (result.stageBKeys ?? [])[0]?.split("/")[0] ?? "(none)";
      notAt1.push(
        `${gold.expect}${gold.semantic ? " [semantic]" : ""} (age ${gold.age}) at rank ${rank}; Stage-B #1 is ${top1}`,
      );
    }
  }

  const goldAt1 = goldRanks.filter((rank) => rank === 1).length;
  const survivorRanks = goldRanks.filter((rank) => rank > 0);
  const meanRank =
    survivorRanks.length === 0
      ? null
      : survivorRanks.reduce((sum, rank) => sum + rank, 0) / survivorRanks.length;
  // Absent-from-Stage-B contributes 0, the standard reciprocal-rank convention.
  const mrr =
    goldRanks.reduce((sum, rank) => sum + (rank > 0 ? 1 / rank : 0), 0) /
    Math.max(1, goldRanks.length);

  console.log(`Stage A survival (deduped pool): ${survivedA}/${cases.length}  ${pct(survivedA, cases.length)}`);
  console.log(`Stage B survival (top-K to rerank): ${survivedB}/${cases.length}  ${pct(survivedB, cases.length)}`);
  console.log("");
  console.log(`Stage B gold@1 (gold is the reranker's default pick): ${goldAt1}/${cases.length}  ${pct(goldAt1, cases.length)}`);
  console.log(
    `Stage B gold mean rank (survivors): ${meanRank === null ? "n/a" : meanRank.toFixed(2)}`,
  );
  console.log(`Stage B gold MRR: ${mrr.toFixed(3)}`);
  // Slice split: the semantic slice (zero keyword-map overlap, enforced by eval-match's loader)
  // is the surface where vector retrieval must prove itself — the keyword path is blind there.
  const semanticRanks = goldRanks.filter((_, index) => semanticFlags[index]);
  if (semanticRanks.length > 0) {
    const literalRanks = goldRanks.filter((_, index) => !semanticFlags[index]);
    const sliceLine = (label: string, ranks: number[]): string => {
      const at1 = ranks.filter((rank) => rank === 1).length;
      return `  ${label}: gold@1 ${at1}/${ranks.length}  ${pct(at1, ranks.length)} (absent from Stage B: ${ranks.filter((rank) => rank === 0).length})`;
    };
    console.log(sliceLine("semantic slice", semanticRanks));
    console.log(sliceLine("literal slice ", literalRanks));
  }
  if (notAt1.length > 0) {
    console.log("");
    console.log("Gold survived Stage B but is not the default pick (rerank must rescue):");
    for (const line of notAt1) console.log(`  - ${line}`);
  }
  if (missedA.length > 0) {
    console.log("");
    console.log("Dropped at Stage A (unrecoverable — fix lanes/quotas):");
    for (const miss of missedA) console.log(`  - ${miss}`);
  }
  if (missedBOnly.length > 0) {
    console.log("");
    console.log("Survived A but dropped at Stage B top-K (fix weights/age/TOP_K):");
    for (const miss of missedBOnly) console.log(`  - ${miss}`);
  }
  console.log("");

  // Stage B is what reaches the reranker; <100% means gold the reranker can never recover.
  if (survivedB < cases.length) {
    console.log("Stage B survival < 100% — tune lanes/quotas/weights before the full rerank eval.");
    process.exit(1);
  }
  console.log("All gold survived to the reranker. Safe to run the full `npm run eval`.");
  process.exit(0);
}

main().catch((error) => {
  console.error("Retrieval eval failed:", error instanceof Error ? error.message : "unknown error");
  process.exit(1);
});
