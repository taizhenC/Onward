import "server-only";
import type {
  Confidence,
  FigureStageRow,
  Framing,
  RerankFailureReason,
} from "./types";
import { listAll, listByAge } from "./figures";
import { framingFromConfidence } from "./match-config";
import { pickFigure, RerankError } from "./llm";
import { pickByKeywordHybrid } from "./keyword-match";

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
  latencyMs: number;
};

// Production entry point: only the client-safe shape escapes.
export async function match(input: MatchInput): Promise<MatchResult> {
  const { figureKey, stageId, framing } = await matchWithDebug(input);
  return { figureKey, stageId, framing };
}

export async function matchWithDebug(input: MatchInput): Promise<MatchDebug> {
  const { pool, fallbackToAll } = buildPool(input);
  const start = performance.now();

  try {
    const pick = await pickFigure({
      age: input.age,
      feeling: input.feeling,
      candidates: pool,
    });

    // #5: don't trust syntactically valid output. A pick naming a figure that isn't
    // in the pool (hallucinated / filtered out) is a failure, not a match.
    const inPool = pool.some(
      (s) => s.figureKey === pick.figureKey && s.stageId === pick.stageId,
    );
    if (!inPool) {
      return keywordFallback(input, pool, start, "invalid_pick");
    }

    return {
      figureKey: pick.figureKey,
      stageId: pick.stageId,
      // An age-gate fallback-to-all pool is honest-but-thin → always "partial".
      framing: fallbackToAll ? "partial" : framingFromConfidence(pick.confidence),
      confidence: pick.confidence,
      chosenBy: "rerank",
      latencyMs: performance.now() - start,
    };
  } catch (error) {
    const reason: RerankFailureReason =
      error instanceof RerankError ? error.reason : "api_error";
    return keywordFallback(input, pool, start, reason);
  }
}

// Meaning-preserving degraded path: the shared keyword-hybrid scorer, forced to low
// confidence (→ "partial"). Strictly better than nearest-age, which would discard the
// user's feeling. See plan, "age vs keyword" discussion.
function keywordFallback(
  input: MatchInput,
  pool: FigureStageRow[],
  start: number,
  failureReason: RerankFailureReason,
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
    latencyMs: performance.now() - start,
  };
}

// Wide age hard gate, with a Phase 0/1A-specific fallback-to-all so testers who fall
// outside every window (only a handful of figures) aren't silently dropped — that
// would violate recovery-asymmetry. Phase 1B removes the fallback once the library
// is large enough that the gate reliably returns candidates.
function buildPool(input: MatchInput): {
  pool: FigureStageRow[];
  fallbackToAll: boolean;
} {
  const candidates = listByAge(input.age);
  const fallbackToAll = candidates.length === 0;
  const pool = fallbackToAll ? listAll() : candidates;

  if (pool.length === 0) {
    throw new Error("No figure stages are available to match against.");
  }

  return { pool, fallbackToAll };
}
