import "server-only";
import type {
  Confidence,
  FigureStageRow,
  Framing,
  RerankFailureReason,
} from "./types";
import { listAll, listByAge } from "./figures";
import { framingFromConfidence, RERANK_TOP_K } from "./match-config";
import { pickFigure, RerankError } from "./llm";
import { pickByKeywordHybrid, scoreAllByKeywordHybrid } from "./keyword-match";

export type MatchInput = {
  age: number;
  feeling: string;
};

export type MatchResult = {
  figureKey: string;
  stageId: string;
  framing: Framing;
};

export type ChosenBy = "rerank" | "keyword_fallback";

// Server-only, eval-only enrichment of MatchResult. resonance/gap are deliberately
// NOT here — they never leave lib/. Production callers use match(); the eval uses
// matchWithDebug() to report calibration, latency, and degraded-mode usage.
export type MatchDebug = MatchResult & {
  confidence: Confidence;
  chosenBy: ChosenBy;
  failureReason?: RerankFailureReason;
  httpStatus?: number;
  candidateCount: number;
  ageCandidateCount: number;
  promptChars: number;
  latencyMs: number;
};

// Production entry point: only the client-safe shape escapes.
export async function match(input: MatchInput): Promise<MatchResult> {
  const { figureKey, stageId, framing } = await matchWithDebug(input);
  return { figureKey, stageId, framing };
}

export async function matchWithDebug(input: MatchInput): Promise<MatchDebug> {
  const { pool, fallbackToAll } = await buildPool(input);
  const rerankPool = selectRerankPool(input, pool);
  const debugScalars = {
    candidateCount: rerankPool.length,
    ageCandidateCount: pool.length,
    promptChars: sumBiographicalFactChars(rerankPool),
  };
  const start = performance.now();

  try {
    const pick = await pickFigure({
      age: input.age,
      feeling: input.feeling,
      candidates: rerankPool,
    });

    // #5: don't trust syntactically valid output. A pick naming a figure that isn't
    // in the pool (hallucinated / filtered out) is a failure, not a match.
    const inPool = rerankPool.some(
      (s) => s.figureKey === pick.figureKey && s.stageId === pick.stageId,
    );
    if (!inPool) {
      return keywordFallback(input, pool, start, debugScalars, "invalid_pick");
    }

    return {
      figureKey: pick.figureKey,
      stageId: pick.stageId,
      // An age-gate fallback-to-all pool is honest-but-thin → always "partial".
      framing: fallbackToAll ? "partial" : framingFromConfidence(pick.confidence),
      confidence: pick.confidence,
      chosenBy: "rerank",
      ...debugScalars,
      latencyMs: performance.now() - start,
    };
  } catch (error) {
    const reason: RerankFailureReason =
      error instanceof RerankError ? error.reason : "api_error";
    const httpStatus = error instanceof RerankError ? error.status : undefined;
    return keywordFallback(input, pool, start, debugScalars, reason, httpStatus);
  }
}

// Meaning-preserving degraded path: the shared keyword-hybrid scorer, forced to low
// confidence (→ "partial"). Strictly better than nearest-age, which would discard the
// user's feeling. See plan, "age vs keyword" discussion.
function keywordFallback(
  input: MatchInput,
  pool: FigureStageRow[],
  start: number,
  debugScalars: {
    candidateCount: number;
    ageCandidateCount: number;
    promptChars: number;
  },
  failureReason: RerankFailureReason,
  httpStatus?: number,
): MatchDebug {
  const { stage } = pickByKeywordHybrid(
    { age: input.age, feeling: input.feeling },
    pool,
  );

  return {
    figureKey: stage.figureKey,
    stageId: stage.stageId,
    framing: "partial",
    confidence: "low",
    chosenBy: "keyword_fallback",
    failureReason,
    httpStatus,
    ...debugScalars,
    latencyMs: performance.now() - start,
  };
}

export function selectRerankPool(
  input: MatchInput,
  pool: FigureStageRow[],
): FigureStageRow[] {
  if (pool.length <= RERANK_TOP_K) return pool;
  return scoreAllByKeywordHybrid(input, pool)
    .slice(0, RERANK_TOP_K)
    .map((pick) => pick.stage);
}

function sumBiographicalFactChars(pool: FigureStageRow[]): number {
  return pool.reduce((sum, stage) => sum + stage.biographicalFacts.length, 0);
}

// Wide age hard gate, with a Phase 0/1A-specific fallback-to-all so testers who fall
// outside every window (only a handful of figures) aren't silently dropped — that
// would violate recovery-asymmetry. Phase 1B removes the fallback once the library
// is large enough that the gate reliably returns candidates.
async function buildPool(input: MatchInput): Promise<{
  pool: FigureStageRow[];
  fallbackToAll: boolean;
}> {
  const candidates = await listByAge(input.age);
  const fallbackToAll = candidates.length === 0;
  const pool = fallbackToAll ? await listAll() : candidates;

  if (pool.length === 0) {
    throw new Error("No figure stages are available to match against.");
  }

  return { pool, fallbackToAll };
}
