import "server-only";
import type {
  Confidence,
  FigureStageRow,
  Framing,
  RerankFailureReason,
  RetrievalMode,
} from "./types";
import { listAll, listByAge } from "./figures";
import {
  APPROVED_PRODUCTION_RECIPE,
  framingFromConfidence,
  requireApprovedProductionRecipe,
  RERANK_TOP_K,
} from "./match-config";
import { pickFigure, RerankError } from "./llm";
import { pickByKeywordHybrid, scoreAllByKeywordHybrid } from "./keyword-match";
import { EmbeddingError } from "./embeddings";
import { retrieveFacets, RetrievalUnavailableError } from "./facets-retrieval";
import {
  withMatchClarification,
  type MatchClarification,
} from "./match-recovery";

export type MatchInput = {
  age: number;
  feeling: string;
  eligibleStageKeys?: ReadonlySet<string>;
  clarification?: MatchClarification;
};

export type MatchResult = {
  figureKey: string;
  stageId: string;
  framing: Framing;
};

export type ChosenBy = "rerank" | "keyword_fallback";

// Which retrieval path actually produced the rerank pool (distinct from the CONFIGURED
// RetrievalMode: "auto" resolves to one of these at runtime).
export type RetrievalPath = "facetsrag" | "keyword";

// Retrieval-stage diagnostics, shared by the rerank-success and keyword-fallback returns.
// stageAKeys/stageBKeys are cache keys (`figureKey/stageId`) carrying NO gold label — the eval
// computes gold survival from them. Present only on the FacetsRAG path.
type RetrievalDebug = {
  retrievalMode: RetrievalPath;
  retrievalFallbackReason?: string;
  retrievalPoolSize?: number;
  stageAKeys?: string[];
  stageBKeys?: string[];
};

type DebugScalars = RetrievalDebug & {
  candidateCount: number;
  ageCandidateCount: number;
  promptChars: number;
  ageFallback: boolean;
};

// Server-only, eval-only enrichment of MatchResult. resonance/gap are deliberately
// NOT here — they never leave lib/. Production callers use match(); the eval uses
// matchWithDebug() to report calibration, latency, and degraded-mode usage.
export type MatchDebug = MatchResult &
  DebugScalars & {
    confidence: Confidence;
    chosenBy: ChosenBy;
    failureReason?: RerankFailureReason;
    httpStatus?: number;
    latencyMs: number;
  };

// Production entry point: only the client-safe shape escapes.
export async function match(input: MatchInput): Promise<MatchResult> {
  const { figureKey, stageId, framing } = await matchWithDebug(input);
  return { figureKey, stageId, framing };
}

export type IntakeMatchResult = MatchResult &
  Pick<
    MatchDebug,
    "confidence" | "chosenBy" | "ageFallback" | "retrievalMode"
  >;

export async function matchForIntake(
  input: MatchInput,
): Promise<IntakeMatchResult> {
  const result = await matchWithDebug(input);
  // Public story creation is pinned to the recipe that cleared the current
  // trust gate. Keep challenger retrieval available through matchWithDebug()
  // for evals, but never let it acquire the approved keyword recipe identity
  // when an intake is persisted or measured.
  requireApprovedProductionRecipe(result.retrievalMode);
  return {
    figureKey: result.figureKey,
    stageId: result.stageId,
    framing: result.framing,
    confidence: result.confidence,
    chosenBy: result.chosenBy,
    ageFallback: result.ageFallback,
    retrievalMode: result.retrievalMode,
  };
}

export async function matchWithDebug(input: MatchInput): Promise<MatchDebug> {
  const effectiveInput: MatchInput = {
    ...input,
    feeling: withMatchClarification(input.feeling, input.clarification),
  };
  const { pool, fallbackToAll } = await buildPool(effectiveInput);
  const selection = await selectMatchPool(
    effectiveInput,
    pool,
    resolveRetrievalMode(),
  );
  const rerankPool = selection.rerankPool;
  const debugScalars: DebugScalars = {
    candidateCount: rerankPool.length,
    ageCandidateCount: pool.length,
    promptChars: sumBiographicalFactChars(rerankPool),
    ageFallback: fallbackToAll,
    retrievalMode: selection.retrievalMode,
    retrievalFallbackReason: selection.retrievalFallbackReason,
    retrievalPoolSize: selection.retrievalPoolSize,
    stageAKeys: selection.stageAKeys,
    stageBKeys: selection.stageBKeys,
  };
  const start = performance.now();

  if (rerankPool.length === 0) {
    return keywordFallback(effectiveInput, pool, start, debugScalars, "invalid_pick");
  }

  try {
    const pick = await pickFigure({
      age: effectiveInput.age,
      feeling: effectiveInput.feeling,
      candidates: rerankPool,
    });

    // #5: don't trust syntactically valid output. A pick naming a figure that isn't
    // in the pool (hallucinated / filtered out) is a failure, not a match.
    const inPool = rerankPool.some(
      (s) => s.figureKey === pick.figureKey && s.stageId === pick.stageId,
    );
    if (!inPool) {
      return keywordFallback(
        effectiveInput,
        pool,
        start,
        debugScalars,
        "invalid_pick",
      );
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
    return keywordFallback(
      effectiveInput,
      pool,
      start,
      debugScalars,
      reason,
      httpStatus,
    );
  }
}

// Meaning-preserving degraded path: the shared keyword-hybrid scorer, forced to low
// confidence (→ "partial"). Strictly better than nearest-age, which would discard the
// user's feeling. See plan, "age vs keyword" discussion.
function keywordFallback(
  input: MatchInput,
  pool: FigureStageRow[],
  start: number,
  debugScalars: DebugScalars,
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

// The configured retrieval mode. The evaluated keyword recipe is the default;
// `auto` and FacetsRAG remain local/eval challengers; production rejects every
// explicit non-keyword or unknown value. The actual path is frozen on MatchDebug
// and IntakeMatchResult, while intake uses this resolver only before a no-run
// no-eligible telemetry outcome.
export function resolveRetrievalMode(
  explicit?: string,
  environment = process.env.NODE_ENV,
): RetrievalMode {
  const configured = explicit ?? process.env.RETRIEVAL_MODE;
  const raw = configured?.trim().toLowerCase();

  // No implicit provider-dependent behavior: an unset value resolves to the
  // approved baseline. Local/eval callers may still explicitly request `auto` or
  // FacetsRAG; a public production process must name its evaluated keyword recipe.
  if (!raw) return APPROVED_PRODUCTION_RECIPE.retrievalMode;
  if (environment === "production" && raw !== "keyword") {
    throw new Error(
      `RETRIEVAL_MODE=${raw} is not approved for production; set RETRIEVAL_MODE=keyword.`,
    );
  }
  if (raw === "auto") {
    return "auto";
  }
  return raw === "facetsrag" || raw === "keyword"
    ? raw
    : APPROVED_PRODUCTION_RECIPE.retrievalMode;
}

type RetrievalSelection = RetrievalDebug & { rerankPool: FigureStageRow[] };

// Picks the rerank pool per the configured mode:
//   keyword   → the keyword-hybrid prefilter (no embeddings touched).
//   facetsrag → FacetsRAG; throws if unavailable, so a forced "FacetsRAG run" can never silently be
//               a keyword run.
//   auto      → FacetsRAG when available, else keyword (recording the fallback reason).
async function selectMatchPool(
  input: MatchInput,
  pool: FigureStageRow[],
  mode: RetrievalMode,
): Promise<RetrievalSelection> {
  if (mode === "keyword") {
    return { rerankPool: selectRerankPool(input, pool), retrievalMode: "keyword" };
  }

  try {
    const retrieval = await retrieveFacets(input, pool);
    return {
      rerankPool: retrieval.pool,
      retrievalMode: "facetsrag",
      retrievalPoolSize: retrieval.stageAKeys.length,
      stageAKeys: retrieval.stageAKeys,
      stageBKeys: retrieval.stageBKeys,
    };
  } catch (error) {
    const reason = retrievalErrorReason(error);
    if (mode === "facetsrag") {
      throw new Error(
        `FacetsRAG retrieval unavailable (RETRIEVAL_MODE=facetsrag): ${reason}. ` +
          "Seed embeddings and set EMBEDDING_PROVIDER=gemini, or run with RETRIEVAL_MODE=keyword.",
      );
    }
    // auto: degrade to keyword (recovery-asymmetry — a degraded match beats no match).
    return {
      rerankPool: selectRerankPool(input, pool),
      retrievalMode: "keyword",
      retrievalFallbackReason: reason,
    };
  }
}

// Short, non-sensitive reason code for why FacetsRAG didn't run (debug/telemetry only).
function retrievalErrorReason(error: unknown): string {
  if (error instanceof RetrievalUnavailableError) return error.reason;
  if (error instanceof EmbeddingError) return `embed_${error.errorClass}`;
  return "retrieval_error";
}

// The keyword-hybrid prefilter (Stage-A/B's degraded sibling): keep the rerank pool to the top
// RERANK_TOP_K by keyword-hybrid score. Stays SYNC and keyword-only — selectMatchPool's keyword
// branch and scripts/eval-match.ts's prefilter-survival assertion both depend on that.
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
  return pool.reduce(
    (sum, stage) => sum + (stage.biographicalFacts?.length ?? 0),
    0,
  );
}

// Wide age hard gate, with a Phase 0/1A-specific fallback-to-all so testers who fall
// outside every window (only a handful of figures) aren't silently dropped — that
// would violate recovery-asymmetry. Phase 1B removes the fallback once the library
// is large enough that the gate reliably returns candidates.
async function buildPool(input: MatchInput): Promise<{
  pool: FigureStageRow[];
  fallbackToAll: boolean;
}> {
  const isEligible = (stage: FigureStageRow) =>
    !input.eligibleStageKeys ||
    input.eligibleStageKeys.has(`${stage.figureKey}\u0000${stage.stageId}`);
  const candidates = (await listByAge(input.age)).filter(isEligible);
  const fallbackToAll = candidates.length === 0;
  const pool = fallbackToAll ? (await listAll()).filter(isEligible) : candidates;

  if (pool.length === 0) {
    throw new Error("No figure stages are available to match against.");
  }

  return { pool, fallbackToAll };
}
