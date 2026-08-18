import "./_smoke-bootstrap";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { isDeepStrictEqual } from "node:util";
import { loadEnvLocal } from "./_load-env";
import { listAll, listByAge } from "../lib/figures";
import { FIGURE_STAGES } from "../lib/figures-data";
import {
  listPublishedStorySpecCatalog,
  storySpecStageKey,
} from "../lib/story-spec-repository";
import {
  matchWithDebug,
  resolveRetrievalMode,
  selectRerankPool,
  type MatchDebug,
} from "../lib/matching";
import { getMatchedThemeWeights } from "../lib/keyword-match";
import {
  FACETSRAG_TOP_K,
  matchConfigVersion,
  RERANK_TOP_K,
  RERANK_TRUST_GATE,
} from "../lib/match-config";
import { embeddingModelId } from "../lib/embeddings";
import {
  createEvalEvidence,
  canonicalJson,
  currentDeploymentId,
  currentEvalRunId,
  currentGitCommit,
  datasetForEval,
  evidenceMetricsFromRun,
  loadRecipeRegistry,
  manifestSha256,
  gitInputTreeSha256,
  RECIPE_PROMOTION_POLICY,
  recipeForEval,
  sha256File,
  writeEvalEvidence,
  type EvalEvidence,
} from "./recipe-evidence";
import {
  assertStoryRecipeCodeIdentity,
  assertStoryRecipeExecutionRuntime,
} from "../lib/story-recipe-runtime";

// The verification instrument for Phase 1A: run hand-graded gold cases through the real
// matcher and report whether the reranker picks the right figure — and how honestly it
// frames its confidence. This is the decision gate for the (deferred) vector pipeline.
//
// Privacy: matchWithDebug() never returns resonance/gap (they don't leave lib/), so this
// harness physically cannot dump them. Full per-trial dumps remain gitignored. Every run
// also writes a metrics-only, content-addressed evidence record with no feeling, notes,
// trial rows, resonance/gap, provider body, base URL, or secret.

const RUNS_DIR = resolve(process.cwd(), "evals/runs");
const FULL_GIT_COMMIT = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/;

function evalDatasetPath(): string {
  return resolve(
    process.cwd(),
    process.env.EVAL_DATASET_PATH?.trim() || "evals/match.json",
  );
}
const DEFAULT_MODEL = "gpt-oss-120b";

type GoldCase = {
  age: number;
  feeling: string;
  expect: string; // figureKey, or "miss"
  note?: string;
  hard?: boolean;
  plausibleWrong?: string;
  confusionGroup?: string;
  // Paraphrase/metaphor case with ZERO keyword-map overlap (validated at load time against the
  // live keyword parser) — the keyword path is EXPECTED to be blind to it; only semantic
  // retrieval should route it. Exempt from the keyword top-K prefilter survival assertion.
  semantic?: boolean;
  // Additional figure keys that also count as CORRECT for this case. For inputs a twin-dense
  // library genuinely underdetermines (e.g. a generic rejected-writer feeling with both butler
  // and bronte_c published), a single gold label miscounts a defensible pick as definitive-wrong
  // — the exact metric the trust gate holds at zero. Never includes plausibleWrong: a hard case's
  // planted confusion twin is by definition NOT an acceptable answer.
  accept?: string[];
};

type Trial = {
  gold: GoldCase;
  run: number;
  result: MatchDebug;
};

type ProductionEvalCatalog = {
  eligibleStageKeys: ReadonlySet<string>;
  evidence: NonNullable<EvalEvidence["catalog"]>;
};

function numberEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function finiteNumberEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Gold-set loading + validation ────────────────────────────────────────────

function loadGold(validKeys: Set<string>): GoldCase[] {
  const path = evalDatasetPath();
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    fail(`Could not read ${path}`);
  }

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (error) {
    fail(
      `evals/match.json is not valid JSON: ${error instanceof Error ? error.message : "parse error"}`,
    );
  }

  if (!isRecord(raw) || !Array.isArray(raw.cases)) {
    fail('evals/match.json must be an object with a "cases" array.');
  }

  const cases: GoldCase[] = [];
  const errors: string[] = [];

  raw.cases.forEach((entry, index) => {
    const where = `cases[${index}]`;
    if (!isRecord(entry)) {
      errors.push(`${where} is not an object`);
      return;
    }

    const { age, feeling, expect } = entry;
    if (typeof age !== "number" || !Number.isFinite(age)) {
      errors.push(`${where}.age must be a finite number`);
    }
    if (typeof feeling !== "string" || feeling.trim() === "") {
      errors.push(`${where}.feeling must be a non-empty string`);
    }
    if (typeof expect !== "string" || expect.trim() === "") {
      errors.push(`${where}.expect must be a non-empty string`);
    } else if (expect !== "miss" && !validKeys.has(expect)) {
      errors.push(`${where}.expect "${expect}" is not a known figureKey (typo?)`);
    }

    const hard = entry.hard === true;
    const semantic = entry.semantic === true;
    const plausibleWrong =
      typeof entry.plausibleWrong === "string" ? entry.plausibleWrong : undefined;
    const confusionGroup =
      typeof entry.confusionGroup === "string" ? entry.confusionGroup : undefined;

    if (hard) {
      if (!plausibleWrong || !validKeys.has(plausibleWrong)) {
        errors.push(`${where} is hard but plausibleWrong is missing/unknown`);
      } else if (plausibleWrong === expect) {
        errors.push(`${where} plausibleWrong must differ from expect`);
      }
      if (!confusionGroup) {
        errors.push(`${where} is hard but confusionGroup is missing`);
      }
    } else if (plausibleWrong || confusionGroup) {
      errors.push(`${where} has plausibleWrong/confusionGroup but is not hard:true`);
    }

    // Multi-gold: accept[] lists other figureKeys that also count as correct. Guard the
    // invariants that keep it honest — unknown keys, expect duplicates, miss cases, and
    // (critically) a hard case's plausibleWrong are all rejected.
    let accept: string[] | undefined;
    if (entry.accept !== undefined) {
      if (
        !Array.isArray(entry.accept) ||
        entry.accept.length === 0 ||
        entry.accept.some((key) => typeof key !== "string")
      ) {
        errors.push(`${where}.accept must be a non-empty string array`);
      } else {
        const keys = entry.accept as string[];
        if (expect === "miss") {
          errors.push(`${where} is a miss case and cannot carry accept[]`);
        }
        if (new Set(keys).size !== keys.length) {
          errors.push(`${where}.accept has duplicates`);
        }
        for (const key of keys) {
          if (!validKeys.has(key)) {
            errors.push(`${where}.accept "${key}" is not a known figureKey (typo?)`);
          }
          if (key === expect) {
            errors.push(`${where}.accept must not repeat expect`);
          }
          if (plausibleWrong && key === plausibleWrong) {
            errors.push(
              `${where}.accept must not contain plausibleWrong — a planted confusion twin is not an acceptable answer`,
            );
          }
        }
        accept = keys;
      }
    }

    // Semantic honesty gate: "semantic" is a CLAIM that the keyword path has nothing to grab.
    // Verify it against the live keyword parser (word-boundary matching, same code path the
    // keyword scorer and the FacetsRAG theme lane use) so the slice cannot silently drift into
    // keyword-reachable phrasing as the map grows.
    if (semantic && typeof feeling === "string") {
      const matched = getMatchedThemeWeights(feeling);
      if (matched.size > 0) {
        errors.push(
          `${where} is semantic:true but the keyword map matches it (themes: ${[...matched.keys()].sort().join(", ")})`,
        );
      }
    }

    // Build the case best-effort; if it had errors we exit before running anyway.
    if (typeof age === "number" && typeof feeling === "string" && typeof expect === "string") {
      cases.push({
        age,
        feeling,
        expect,
        note: typeof entry.note === "string" ? entry.note : undefined,
        hard: hard || undefined,
        plausibleWrong,
        confusionGroup,
        semantic: semantic || undefined,
        accept,
      });
    }
  });

  if (errors.length > 0) {
    console.error("Gold set has problems — fix before running (no API calls made):");
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  if (cases.length === 0) {
    fail("evals/match.json has no cases.");
  }

  return cases;
}

// ── Trial execution ──────────────────────────────────────────────────────────

// Transport-level retry ONLY: a keyword_fallback caused by api_error/timeout is a
// transient infrastructure hiccup (e.g. a 429), not a model verdict — retrying keeps
// it out of the rerank metric. parse_error/invalid_pick are genuine model behavior and
// are NEVER retried (they're the signal we're measuring). Distinct from the
// no-retry-on-logic-failure rule in CLAUDE.md.
async function runTrial(
  gold: GoldCase,
  maxRetries: number,
  eligibleStageKeys?: ReadonlySet<string>,
): Promise<MatchDebug> {
  let attempt = 0;
  for (;;) {
    const result = await matchWithDebug({
      age: gold.age,
      feeling: gold.feeling,
      eligibleStageKeys,
    });
    const transient =
      result.chosenBy === "keyword_fallback" &&
      (result.failureReason === "api_error" || result.failureReason === "timeout");
    if (!transient || attempt >= maxRetries) return result;
    attempt += 1;
    await sleep(Math.round(800 * 2 ** (attempt - 1) + Math.random() * 300));
  }
}

async function assertExpectedSurvivesPrefilter(
  cases: GoldCase[],
  allStages: Awaited<ReturnType<typeof listAll>>,
  eligibleStageKeys?: ReadonlySet<string>,
): Promise<void> {
  const errors: string[] = [];

  for (const [index, gold] of cases.entries()) {
    if (gold.expect === "miss") continue;
    // Metaphor/paraphrase cases are expected to elude the keyword prefilter — they exist to prove
    // FacetsRAG's value, so they don't gate the keyword-path provider run.
    if (gold.semantic) continue;

    const isEligible = (stage: (typeof allStages)[number]) =>
      !eligibleStageKeys ||
      eligibleStageKeys.has(storySpecStageKey(stage.figureKey, stage.stageId));
    const agePool = (await listByAge(gold.age)).filter(isEligible);
    const eligibleAll = allStages.filter(isEligible);
    const pool = agePool.length === 0 ? eligibleAll : agePool;
    const selected = selectRerankPool(
      { age: gold.age, feeling: gold.feeling, eligibleStageKeys },
      pool,
    );

    // Multi-gold aware: any acceptable answer surviving the prefilter lets the reranker still
    // reach a correct pick, which is all this gate protects.
    const acceptable = new Set([gold.expect, ...(gold.accept ?? [])]);
    const survived = selected.some((stage) => acceptable.has(stage.figureKey));
    if (!survived) {
      errors.push(
        `cases[${index}] expected ${gold.expect}, but RERANK_TOP_K=${RERANK_TOP_K} selected ${selected.length}/${pool.length} candidates without it`,
      );
    }
  }

  if (errors.length > 0) {
    console.error("Rerank top-K prefilter dropped expected gold figure(s):");
    for (const error of errors) console.error(`  - ${error}`);
    console.error("Raise RERANK_TOP_K or add keyword routes before running provider eval.");
    process.exit(1);
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  async function worker(): Promise<void> {
    for (;;) {
      const index = next;
      next += 1;
      if (index >= items.length) return;
      results[index] = await fn(items[index], index);
    }
  }
  const workers = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, worker);
  await Promise.all(workers);
  return results;
}

// ── Metrics ──────────────────────────────────────────────────────────────────

type Calibration = {
  definitiveCorrect: number;
  definitiveWrong: number;
  partialCorrect: number;
  partialWrong: number;
};

type GroupConfusion = {
  group: string;
  trials: number;
  pickedPlausibleWrong: number;
  correct: number;
};

type Metrics = {
  rerankTop1: number | null;
  rerankTop1Counts: { correct: number; total: number };
  overallTop1: number | null;
  overallTop1Counts: { correct: number; total: number };
  missDetection: number | null;
  missDetectionCounts: { detected: number; total: number };
  hardConfusion: number | null;
  hardConfusionCounts: { confused: number; total: number };
  // Overall top-1 split by the semantic flag — the honest keyword-vs-vector comparison surface.
  // The literal slice's phrasing co-evolved with STUB_KEYWORD_MAP (gold inputs literally contain
  // map phrases), so the keyword baseline partially "knows" those answers; only the semantic
  // slice measures generalization to phrasing no map route anticipates. Console/dump only —
  // deliberately NOT in the immutable evidence schema.
  semanticTop1: number | null;
  semanticTop1Counts: { correct: number; total: number };
  literalTop1: number | null;
  literalTop1Counts: { correct: number; total: number };
  // FacetsRAG retrieval survival (null/zero-total when the run took the keyword path, which
  // populates no stage keys). Eval-owned: computed here from stageAKeys/stageBKeys.
  goldSurvivalStageA: number | null;
  goldSurvivalStageB: number | null;
  goldSurvivalCounts: { survivedA: number; survivedB: number; total: number };
  confusionByGroup: GroupConfusion[];
  calibration: Calibration;
  chosenBy: { rerank: number; keyword_fallback: number };
  failureReasons: Record<string, number>;
  failureReasonStatuses: Record<string, number>;
  candidateCounts: Record<string, number>;
  failedCandidateCounts: Record<string, number>;
  promptChars: Distribution;
  failedPromptChars: Distribution;
  latencyP50: number;
  latencyP95: number;
  stability: number | null;
  trustGate: TrustGate;
};

type Distribution = {
  min: number;
  p50: number;
  p95: number;
  max: number;
};

type TrustGate = {
  passed: boolean;
  coverage: number | null;
  checks: {
    coverage: boolean;
    rerankTop1: boolean;
    missDetection: boolean;
    noDefinitiveWrong: boolean;
    top1: boolean;
    hardConfusion: boolean;
  };
  thresholds: typeof RERANK_TRUST_GATE;
};

function isCorrect(gold: GoldCase, result: MatchDebug): boolean {
  return gold.expect === "miss"
    ? result.framing === "partial"
    : result.figureKey === gold.expect ||
        (gold.accept ?? []).includes(result.figureKey);
}

// Did the gold figure survive a retrieval stage? Stage keys are `figureKey/stageId`.
function keysIncludeFigure(keys: string[] | undefined, figureKey: string): boolean {
  return (keys ?? []).some((key) => key.split("/")[0] === figureKey);
}

function ratio(num: number, den: number): number | null {
  return den === 0 ? null : num / den;
}

function percentile(sortedAsc: number[], p: number): number {
  if (sortedAsc.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sortedAsc.length) - 1;
  return sortedAsc[Math.min(sortedAsc.length - 1, Math.max(0, idx))];
}

function distribution(values: number[]): Distribution {
  if (values.length === 0) return { min: 0, p50: 0, p95: 0, max: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  return {
    min: sorted[0],
    p50: Math.round(percentile(sorted, 50)),
    p95: Math.round(percentile(sorted, 95)),
    max: sorted[sorted.length - 1],
  };
}

function computeMetrics(trials: Trial[], k: number): Metrics {
  const nonMiss = trials.filter((t) => t.gold.expect !== "miss");
  const miss = trials.filter((t) => t.gold.expect === "miss");
  const hard = nonMiss.filter((t) => t.gold.hard);
  const rerankNonMiss = nonMiss.filter((t) => t.result.chosenBy === "rerank");

  // FacetsRAG survival — only trials whose retrieval populated stage keys (the FacetsRAG path).
  const facetsTrials = nonMiss.filter(
    (t) => t.result.stageAKeys !== undefined && t.result.stageBKeys !== undefined,
  );
  const survivedA = facetsTrials.filter((t) =>
    keysIncludeFigure(t.result.stageAKeys, t.gold.expect),
  ).length;
  const survivedB = facetsTrials.filter((t) =>
    keysIncludeFigure(t.result.stageBKeys, t.gold.expect),
  ).length;

  const calibration: Calibration = {
    definitiveCorrect: 0,
    definitiveWrong: 0,
    partialCorrect: 0,
    partialWrong: 0,
  };
  for (const t of nonMiss) {
    const correct = isCorrect(t.gold, t.result);
    const definitive = t.result.framing === "definitive";
    if (definitive && correct) calibration.definitiveCorrect += 1;
    else if (definitive && !correct) calibration.definitiveWrong += 1;
    else if (!definitive && correct) calibration.partialCorrect += 1;
    else calibration.partialWrong += 1;
  }

  const groupMap = new Map<string, GroupConfusion>();
  for (const t of hard) {
    const group = t.gold.confusionGroup ?? "(ungrouped)";
    const entry =
      groupMap.get(group) ??
      { group, trials: 0, pickedPlausibleWrong: 0, correct: 0 };
    entry.trials += 1;
    if (t.result.figureKey === t.gold.plausibleWrong) entry.pickedPlausibleWrong += 1;
    if (isCorrect(t.gold, t.result)) entry.correct += 1;
    groupMap.set(group, entry);
  }

  const chosenBy = { rerank: 0, keyword_fallback: 0 };
  const failureReasons: Record<string, number> = {};
  const failureReasonStatuses: Record<string, number> = {};
  const candidateCounts: Record<string, number> = {};
  const failedCandidateCounts: Record<string, number> = {};
  for (const t of trials) {
    chosenBy[t.result.chosenBy] += 1;
    increment(candidateCounts, String(t.result.candidateCount));
    if (t.result.failureReason) {
      failureReasons[t.result.failureReason] =
        (failureReasons[t.result.failureReason] ?? 0) + 1;
      const status = t.result.httpStatus === undefined ? "none" : String(t.result.httpStatus);
      increment(failureReasonStatuses, `${t.result.failureReason}:${status}`);
      increment(failedCandidateCounts, String(t.result.candidateCount));
    }
  }

  const latencies = trials.map((t) => t.result.latencyMs).sort((a, b) => a - b);
  const promptChars = distribution(trials.map((t) => t.result.promptChars));
  const failedPromptChars = distribution(
    trials.filter((t) => t.result.failureReason).map((t) => t.result.promptChars),
  );

  // Stability: per case, the share of its k runs that landed on the modal pick.
  let stability: number | null = null;
  if (k > 1) {
    const byCase = new Map<string, string[]>();
    for (const t of trials) {
      const caseKey = `${t.gold.age}|${t.gold.feeling}`;
      const picks = byCase.get(caseKey) ?? [];
      picks.push(`${t.result.figureKey}/${t.result.stageId}`);
      byCase.set(caseKey, picks);
    }
    let sum = 0;
    let n = 0;
    for (const picks of byCase.values()) {
      const counts = new Map<string, number>();
      for (const p of picks) counts.set(p, (counts.get(p) ?? 0) + 1);
      const modal = Math.max(...counts.values());
      sum += modal / picks.length;
      n += 1;
    }
    stability = n === 0 ? null : sum / n;
  }

  const rerankCorrect = rerankNonMiss.filter((t) => isCorrect(t.gold, t.result)).length;
  const overallCorrect = nonMiss.filter((t) => isCorrect(t.gold, t.result)).length;
  const missDetected = miss.filter((t) => t.result.framing === "partial").length;
  const hardConfused = hard.filter((t) => t.result.figureKey === t.gold.plausibleWrong).length;
  const rerankTop1 = ratio(rerankCorrect, rerankNonMiss.length);
  const overallTop1 = ratio(overallCorrect, nonMiss.length);
  const hardConfusion = ratio(hardConfused, hard.length);
  const missDetection = ratio(missDetected, miss.length);

  const semanticTrials = nonMiss.filter((t) => t.gold.semantic);
  const literalTrials = nonMiss.filter((t) => !t.gold.semantic);
  const semanticCorrect = semanticTrials.filter((t) => isCorrect(t.gold, t.result)).length;
  const literalCorrect = literalTrials.filter((t) => isCorrect(t.gold, t.result)).length;

  return {
    rerankTop1,
    rerankTop1Counts: { correct: rerankCorrect, total: rerankNonMiss.length },
    overallTop1,
    overallTop1Counts: { correct: overallCorrect, total: nonMiss.length },
    missDetection,
    missDetectionCounts: { detected: missDetected, total: miss.length },
    hardConfusion,
    hardConfusionCounts: { confused: hardConfused, total: hard.length },
    semanticTop1: ratio(semanticCorrect, semanticTrials.length),
    semanticTop1Counts: { correct: semanticCorrect, total: semanticTrials.length },
    literalTop1: ratio(literalCorrect, literalTrials.length),
    literalTop1Counts: { correct: literalCorrect, total: literalTrials.length },
    goldSurvivalStageA: ratio(survivedA, facetsTrials.length),
    goldSurvivalStageB: ratio(survivedB, facetsTrials.length),
    goldSurvivalCounts: { survivedA, survivedB, total: facetsTrials.length },
    confusionByGroup: [...groupMap.values()],
    calibration,
    chosenBy,
    failureReasons,
    failureReasonStatuses,
    candidateCounts,
    failedCandidateCounts,
    promptChars,
    failedPromptChars,
    latencyP50: Math.round(percentile(latencies, 50)),
    latencyP95: Math.round(percentile(latencies, 95)),
    stability,
    trustGate: computeTrustGate({
      chosenBy,
      calibration,
      rerankTop1,
      missDetection,
      overallTop1,
      hardConfusion,
      trialCount: trials.length,
    }),
  };
}

function increment(counts: Record<string, number>, key: string): void {
  counts[key] = (counts[key] ?? 0) + 1;
}

function computeTrustGate(input: {
  chosenBy: { rerank: number; keyword_fallback: number };
  calibration: Calibration;
  rerankTop1: number | null;
  missDetection: number | null;
  overallTop1: number | null;
  hardConfusion: number | null;
  trialCount: number;
}): TrustGate {
  const coverage = ratio(input.chosenBy.rerank, input.trialCount);
  const checks = {
    coverage:
      coverage !== null && coverage >= RERANK_TRUST_GATE.minCoverage,
    rerankTop1:
      input.rerankTop1 !== null &&
      input.rerankTop1 >= RERANK_TRUST_GATE.minRerankTop1,
    missDetection:
      input.missDetection === null ||
      input.missDetection >= RERANK_TRUST_GATE.minMissDetection,
    noDefinitiveWrong:
      input.calibration.definitiveWrong <=
      RERANK_TRUST_GATE.maxDefinitiveWrong,
    top1:
      input.overallTop1 !== null &&
      input.overallTop1 >= RERANK_TRUST_GATE.minOverallTop1,
    hardConfusion:
      input.hardConfusion === null ||
      input.hardConfusion <= RERANK_TRUST_GATE.maxHardConfusion,
  };

  return {
    passed: Object.values(checks).every(Boolean),
    coverage,
    checks,
    thresholds: RERANK_TRUST_GATE,
  };
}

// ── Reporting ──────────────────────────────────────────────────────────────

function pct(value: number | null): string {
  return value === null ? "n/a" : `${(value * 100).toFixed(1)}%`;
}

function printReport(metrics: Metrics): void {
  const m = metrics;
  console.log("");
  console.log("Accuracy");
  console.log(
    `  rerank top-1 (excl. fallback) : ${pct(m.rerankTop1)}  (${m.rerankTop1Counts.correct}/${m.rerankTop1Counts.total})`,
  );
  console.log(
    `  overall top-1 (incl. fallback): ${pct(m.overallTop1)}  (${m.overallTop1Counts.correct}/${m.overallTop1Counts.total})`,
  );
  if (m.semanticTop1Counts.total > 0) {
    console.log(
      `  semantic slice (zero keyword-map overlap): ${pct(m.semanticTop1)}  (${m.semanticTop1Counts.correct}/${m.semanticTop1Counts.total})`,
    );
    console.log(
      `  literal slice (map-reachable phrasing)   : ${pct(m.literalTop1)}  (${m.literalTop1Counts.correct}/${m.literalTop1Counts.total})`,
    );
  }
  console.log("");
  console.log(
    `Miss detection (expect=miss -> partial): ${pct(m.missDetection)}  (${m.missDetectionCounts.detected}/${m.missDetectionCounts.total})`,
  );
  if (m.goldSurvivalCounts.total > 0) {
    console.log("");
    console.log("FacetsRAG gold survival (non-miss; retrieval-owned)");
    console.log(
      `  Stage A (deduped pool)   : ${pct(m.goldSurvivalStageA)}  (${m.goldSurvivalCounts.survivedA}/${m.goldSurvivalCounts.total})`,
    );
    console.log(
      `  Stage B (top-K to rerank): ${pct(m.goldSurvivalStageB)}  (${m.goldSurvivalCounts.survivedB}/${m.goldSurvivalCounts.total})`,
    );
  }
  console.log("");
  console.log("Near-miss confusion (hard cases that picked plausibleWrong)");
  if (m.confusionByGroup.length === 0) {
    console.log("  (no hard cases in the gold set)");
  } else {
    for (const g of m.confusionByGroup) {
      console.log(
        `  ${g.group}: ${pct(ratio(g.pickedPlausibleWrong, g.trials))} confusion, ${pct(ratio(g.correct, g.trials))} correct  (n=${g.trials})`,
      );
    }
    console.log(
      `  overall hard: ${pct(m.hardConfusion)} confusion  (${m.hardConfusionCounts.confused}/${m.hardConfusionCounts.total})`,
    );
  }
  console.log("");
  console.log("Calibration 2x2 (non-miss; correct? x framing)");
  console.log("                   correct   wrong");
  console.log(
    `  definitive      ${pad(m.calibration.definitiveCorrect)}   ${pad(m.calibration.definitiveWrong)}   <- wrong+definitive is the trust-killer`,
  );
  console.log(
    `  partial         ${pad(m.calibration.partialCorrect)}   ${pad(m.calibration.partialWrong)}`,
  );
  console.log("");
  console.log(
    `Chosen by: rerank=${m.chosenBy.rerank}  keyword_fallback=${m.chosenBy.keyword_fallback}`,
  );
  const reasons = Object.entries(m.failureReasons);
  console.log(
    `Failure reasons: ${reasons.length === 0 ? "(none)" : reasons.map(([r, c]) => `${r}=${c}`).join("  ")}`,
  );
  const reasonStatuses = Object.entries(m.failureReasonStatuses);
  console.log(
    `Failure reason/status: ${
      reasonStatuses.length === 0
        ? "(none)"
        : reasonStatuses.map(([r, c]) => `${r}=${c}`).join("  ")
    }`,
  );
  console.log(
    `Rerank candidate counts: ${formatCounts(m.candidateCounts)}`,
  );
  console.log(
    `Failed candidate counts: ${formatCounts(m.failedCandidateCounts)}`,
  );
  console.log(
    `Prompt chars: min=${m.promptChars.min} p50=${m.promptChars.p50} p95=${m.promptChars.p95} max=${m.promptChars.max}`,
  );
  console.log(
    `Failed prompt chars: min=${m.failedPromptChars.min} p50=${m.failedPromptChars.p50} p95=${m.failedPromptChars.p95} max=${m.failedPromptChars.max}`,
  );
  console.log("");
  console.log(`Latency: p50=${m.latencyP50}ms  p95=${m.latencyP95}ms`);
  console.log(`Stability: ${m.stability === null ? "n/a (k=1)" : pct(m.stability)}`);
  console.log("");
  printTrustGate(m.trustGate);

  if (m.chosenBy.rerank === 0) {
    console.log("");
    console.log(
      "WARNING: every trial fell back to the keyword scorer — the provider is likely failing. Run `npm run health`.",
    );
  }
}

function pad(value: number): string {
  return String(value).padStart(5, " ");
}

function formatCounts(counts: Record<string, number>): string {
  const entries = Object.entries(counts).sort(([a], [b]) => Number(a) - Number(b));
  return entries.length === 0
    ? "(none)"
    : entries.map(([value, count]) => `${value}=${count}`).join("  ");
}

function printTrustGate(gate: TrustGate): void {
  const tag = gate.passed ? "PASS" : "FAIL";
  console.log(`Real rerank trust gate: ${tag}`);
  console.log(
    `  coverage >= ${pct(RERANK_TRUST_GATE.minCoverage)}: ${gate.checks.coverage ? "pass" : "fail"} (${pct(gate.coverage)})`,
  );
  console.log(
    `  rerank top-1 >= ${pct(RERANK_TRUST_GATE.minRerankTop1)}: ${gate.checks.rerankTop1 ? "pass" : "fail"}`,
  );
  console.log(
    `  miss detection >= ${pct(RERANK_TRUST_GATE.minMissDetection)}: ${gate.checks.missDetection ? "pass" : "fail"}`,
  );
  console.log(
    `  definitive wrong <= ${RERANK_TRUST_GATE.maxDefinitiveWrong}: ${gate.checks.noDefinitiveWrong ? "pass" : "fail"}`,
  );
  console.log(
    `  overall top-1 >= ${pct(RERANK_TRUST_GATE.minOverallTop1)}: ${gate.checks.top1 ? "pass" : "fail"}`,
  );
  console.log(
    `  hard confusion <= ${pct(RERANK_TRUST_GATE.maxHardConfusion)}: ${gate.checks.hardConfusion ? "pass" : "fail"}`,
  );
}

function toDumpTrial(trial: Trial): {
  gold: Omit<GoldCase, "feeling" | "note">;
  run: number;
  result: MatchDebug;
} {
  const { feeling: _feeling, note: _note, ...gold } = trial.gold;
  void _feeling;
  void _note;
  return {
    gold,
    run: trial.run,
    result: trial.result,
  };
}

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

function apiKeyConfigured(): boolean {
  return [
    process.env.LLM_API_KEY,
    process.env.CEREBRAS_API_KEY,
    process.env.GROQ_API_KEY,
  ].some((key) => Boolean(key?.trim()));
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function loadProductionEvalCatalog(
  stages: Awaited<ReturnType<typeof listAll>>,
): Promise<ProductionEvalCatalog> {
  const authoredByKey = new Map(
    FIGURE_STAGES.map((stage) => [
      storySpecStageKey(stage.figureKey, stage.stageId),
      stage,
    ]),
  );
  for (const stage of stages) {
    const key = storySpecStageKey(stage.figureKey, stage.stageId);
    const authored = authoredByKey.get(key);
    if (!authored || !isDeepStrictEqual(stage, authored)) {
      fail(`Supabase figure catalog differs from the installed library at ${key}.`);
    }
  }

  const storySpecs = await listPublishedStorySpecCatalog();
  if (storySpecs.size === 0) {
    fail("A production-equivalent eval needs at least one valid published StorySpec.");
  }
  const servedByKey = new Map(
    stages.map((stage) => [
      storySpecStageKey(stage.figureKey, stage.stageId),
      stage,
    ]),
  );
  const entries = [...storySpecs.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, storySpec]) => {
      const stage = servedByKey.get(key);
      if (!stage) {
        fail(`Published StorySpec ${key} has no byte-identical published figure stage.`);
      }
      return { key, stage, storySpec };
    });
  const sha256 = createHash("sha256")
    .update(canonicalJson(entries))
    .digest("hex");
  return {
    eligibleStageKeys: new Set(entries.map((entry) => entry.key)),
    evidence: {
      sha256,
      eligibleStageCount: entries.length,
      source: "supabase_published_story_specs",
    },
  };
}

function promotionCandidateInputsReady(
  catalog: ProductionEvalCatalog | null,
  gitCommit: string | null,
  inputTreeSha256: string | null,
  runId: string | null,
  deploymentId: string | null,
): boolean {
  return (
    process.env.PERSISTENCE === "supabase" &&
    catalog !== null &&
    gitCommit !== null &&
    FULL_GIT_COMMIT.test(gitCommit) &&
    gitCommit === gitHeadCommit() &&
    inputTreeSha256 !== null &&
    inputTreeSha256 === gitInputTreeSha256(gitCommit) &&
    runId !== null &&
    deploymentId !== null &&
    runId !== deploymentId &&
    runId !== gitCommit &&
    deploymentId !== gitCommit &&
    gitTrackedTreeIsClean()
  );
}

function promotionMetricFloorsPass(metrics: Metrics, k: number): boolean {
  const policy = RECIPE_PROMOTION_POLICY;
  return (
    k >= policy.minKPerEvidence &&
    metrics.overallTop1Counts.total >= policy.minNonMissCasesPerEvidence * k &&
    metrics.missDetectionCounts.total >= policy.minMissCasesPerEvidence * k &&
    metrics.hardConfusionCounts.total >= policy.minHardCasesPerEvidence * k &&
    metrics.stability !== null &&
    metrics.stability >= policy.minStability &&
    metrics.latencyP95 <= policy.maxP95LatencyMs
  );
}

function gitHeadCommit(): string | null {
  const result = spawnSync("git", ["rev-parse", "HEAD"], {
    cwd: process.cwd(),
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.status !== 0) return null;
  const value = result.stdout.trim();
  return FULL_GIT_COMMIT.test(value) ? value : null;
}

function gitTrackedTreeIsClean(): boolean {
  const result = spawnSync(
    "git",
    ["status", "--porcelain", "--untracked-files=all"],
    { cwd: process.cwd(), encoding: "utf8", windowsHide: true },
  );
  return result.status === 0 && result.stdout.trim() === "";
}

async function main(): Promise<void> {
  console.log("Onward match eval");
  console.log("=================");

  const env = loadEnvLocal();
  // Default to real (the verification instrument), but honor an explicitly-set provider
  // — `LLM_PROVIDER=stub` lets you self-test the harness without burning API calls.
  if (!process.env.LLM_PROVIDER) process.env.LLM_PROVIDER = "real";
  if (!(["stub", "real"] as const).includes(process.env.LLM_PROVIDER as "stub" | "real")) {
    fail("LLM_PROVIDER must be stub or real for an eval run.");
  }
  const provider = process.env.LLM_PROVIDER as "stub" | "real";

  if (provider === "real" && !apiKeyConfigured()) {
    fail(
      `CEREBRAS_API_KEY or LLM_API_KEY is not set (.env.local${env.found ? " was loaded" : " not found"}). Run \`npm run health\` first.`,
    );
  }

  const k = Math.floor(numberEnv("EVAL_K", 1));
  const concurrency = Math.floor(numberEnv("EVAL_CONCURRENCY", 3));
  const maxRetries = Math.floor(numberEnv("EVAL_MAX_RETRIES", 2));
  const model = process.env.LLM_MODEL_RERANK ?? DEFAULT_MODEL;

  const stages = await listAll();
  const productionCatalog =
    process.env.PERSISTENCE === "supabase"
      ? await loadProductionEvalCatalog(stages)
      : null;
  const eligibleStageKeys = productionCatalog?.eligibleStageKeys;
  const gitCommit = currentGitCommit();
  const inputTreeSha256 = gitInputTreeSha256(gitCommit ?? "HEAD");
  const runId = currentEvalRunId();
  const deploymentId = currentDeploymentId();
  const candidateInputsReady = promotionCandidateInputsReady(
    productionCatalog,
    gitCommit,
    inputTreeSha256,
    runId,
    deploymentId,
  );
  const validKeys = new Set(stages.map((s) => s.figureKey));
  const cases = loadGold(validKeys);

  const retrievalMode = resolveRetrievalMode();
  if (retrievalMode === "auto") {
    fail(
      "Eval evidence requires an explicit keyword or facetsrag retrieval mode; auto is not auditable.",
    );
  }
  // The facet-tagger env gate changes facetsrag behavior, but no registered recipe carries a
  // facet-tagger axis yet — a tagger-on run would write evidence mislabeled under a v1 recipe
  // id, the exact mixed-recipe condition the registry exists to prevent. Tagger experiments use
  // the scratch retrieval instruments until a manifest-v2 recipe registers.
  if (process.env.FACETSRAG_TAGGER?.trim()) {
    fail(
      "FACETSRAG_TAGGER must be unset for an eval evidence run: no registered recipe describes tagger-on behavior.",
    );
  }
  const registry = loadRecipeRegistry();
  const recipe = recipeForEval(registry, retrievalMode);
  assertStoryRecipeCodeIdentity(recipe);
  if (provider === "real") {
    assertStoryRecipeExecutionRuntime(recipe);
  }
  const dataset = datasetForEval(registry, recipe);
  const datasetPath = evalDatasetPath();
  const datasetSha256 = sha256File(datasetPath);
  if (
    dataset.version.trim() === "" ||
    dataset.sha256 !== datasetSha256
  ) {
    fail(
      `Recipe eval dataset does not match ${datasetPath} (${dataset.version}/${datasetSha256}).`,
    );
  }
  if (process.env.EVAL_CANDIDATE_MODE === "1") {
    const policy = RECIPE_PROMOTION_POLICY;
    const nonMissCases = cases.filter((entry) => entry.expect !== "miss").length;
    const missCases = cases.length - nonMissCases;
    const hardCases = cases.filter((entry) => entry.hard).length;
    if (
      !candidateInputsReady ||
      provider !== "real" ||
      dataset.visibility !== "protected_holdout" ||
      k < policy.minKPerEvidence ||
      nonMissCases < policy.minNonMissCasesPerEvidence ||
      missCases < policy.minMissCasesPerEvidence ||
      hardCases < policy.minHardCasesPerEvidence
    ) {
      fail(
        "Candidate eval is missing its production catalog, dedicated run/deployment identities, clean input commit, protected dataset, real provider, or sample floors.",
      );
    }
  }
  if (manifestSha256(recipe) !== recipe.manifestSha256) {
    fail(`Recipe manifest hash is invalid for ${recipe.recipeId}.`);
  }
  const actualEmbeddingModel =
    retrievalMode === "facetsrag" ? embeddingModelId() : null;
  const actualTopK =
    retrievalMode === "facetsrag" ? FACETSRAG_TOP_K : RERANK_TOP_K;
  const rerankTemperature = finiteNumberEnv("LLM_RERANK_TEMPERATURE", 0);
  const rerankReasoningEffort =
    process.env.LLM_RERANK_REASONING_EFFORT ?? "low";
  const mismatches = [
    recipe.matchConfigVersion === matchConfigVersion
      ? null
      : `matchConfigVersion=${matchConfigVersion}`,
    recipe.rerankModelId === model ? null : `model=${model}`,
    recipe.embeddingModelId === actualEmbeddingModel
      ? null
      : `embeddingModel=${actualEmbeddingModel ?? "none"}`,
    recipe.rerankTemperature === rerankTemperature
      ? null
      : `rerankTemperature=${rerankTemperature}`,
    recipe.rerankReasoningEffort === rerankReasoningEffort
      ? null
      : `rerankReasoningEffort=${rerankReasoningEffort}`,
    recipe.rerankTopK === actualTopK ? null : `rerankTopK=${actualTopK}`,
  ].filter((entry): entry is string => entry !== null);
  if (mismatches.length > 0) {
    fail(
      `Eval environment does not match recipe ${recipe.recipeId}: ${mismatches.join(", ")}.`,
    );
  }
  // The keyword top-K prefilter assertion applies only to the keyword path. FacetsRAG's pre-flight
  // is `npm run eval-retrieval` (Stage A/B survival); and a forced-but-unavailable facetsrag run
  // throws per-trial, so a "FacetsRAG run" can never silently degrade to keyword unnoticed.
  if (retrievalMode === "keyword") {
    await assertExpectedSurvivesPrefilter(
      cases,
      stages,
      eligibleStageKeys,
    );
  }

  const jobs = cases.flatMap((gold) =>
    Array.from({ length: k }, (_, run) => ({ gold, run })),
  );

  console.log(
    `provider=${provider} model=${model} k=${k} concurrency=${concurrency} cases=${cases.length} trials=${jobs.length}`,
  );
  console.log(
    `recipeId=${recipe.recipeId} matchConfigVersion=${matchConfigVersion} retrievalMode=${retrievalMode} embeddingModel=${actualEmbeddingModel ?? "not-used"}`,
  );

  const startedAt = new Date().toISOString();
  const results = await mapWithConcurrency(jobs, concurrency, async (job) => ({
    gold: job.gold,
    run: job.run,
    result: await runTrial(job.gold, maxRetries, eligibleStageKeys),
  }));

  const metrics = computeMetrics(results, k);
  printReport(metrics);

  // ── Dumps ──
  mkdirSync(RUNS_DIR, { recursive: true });
  const completedAt = new Date().toISOString();
  const config = {
    recipeId: recipe.recipeId,
    recipeManifestSha256: recipe.manifestSha256,
    datasetVersion: dataset.version,
    datasetSha256: dataset.sha256,
    matchConfigVersion,
    provider,
    model,
    retrievalMode,
    embeddingModel: actualEmbeddingModel,
    rerankTemperature,
    rerankReasoningEffort,
    rerankTopK: actualTopK,
    k,
    concurrency,
    maxRetries,
    startedAt,
    completedAt,
    caseCount: cases.length,
    trialCount: jobs.length,
  };

  const stamp = completedAt.replace(/[:.]/g, "-");
  const fullPath = resolve(RUNS_DIR, `${stamp}.json`);
  // Full dump (gitignored): config + metrics + per-trial labels/results. Feelings and notes
  // are stripped by toDumpTrial; resonance/gap cannot appear because MatchDebug omits them.
  writeFileSync(
    fullPath,
    JSON.stringify({ config, metrics, trials: results.map(toDumpTrial) }, null, 2),
  );
  const sourceRunSha256 = sha256File(fullPath);

  // Eval output is always an untrusted candidate. It can never mint promotion
  // authority, even on a protected runner; the locked base-branch attestor is
  // the only component allowed to authorize a selector change.
  const candidate =
    provider === "real" &&
    dataset.visibility === "protected_holdout" &&
    metrics.trustGate.passed &&
    candidateInputsReady &&
    promotionMetricFloorsPass(metrics, k);

  const evidence = createEvalEvidence({
    recipeId: recipe.recipeId,
    recipeManifestSha256: recipe.manifestSha256,
    dataset: {
      version: dataset.version,
      sha256: dataset.sha256,
      visibility: dataset.visibility,
    },
    catalog: productionCatalog?.evidence ?? null,
    run: {
      startedAt,
      completedAt,
      k,
      concurrency,
      maxRetries,
      caseCount: cases.length,
      trialCount: jobs.length,
    },
    config: {
      provider,
      model,
      retrievalMode,
      embeddingModelId: actualEmbeddingModel,
      matchConfigVersion,
      rerankTemperature,
      rerankReasoningEffort,
      rerankTopK: actualTopK,
    },
    metrics: evidenceMetricsFromRun(
      metrics as unknown as Record<string, unknown>,
    ),
    provenance: {
      gitCommit,
      deploymentId,
      sourceRun: `${stamp}.json`,
      runId,
      sourceRunSha256,
      inputTreeSha256,
    },
    legacyImported: false,
    candidate,
    promotable: false,
  });
  const evidencePath = writeEvalEvidence(evidence);

  console.log("");
  console.log(`Wrote ${fullPath}  (full, gitignored)`);
  console.log(`Wrote ${evidencePath}  (metrics only, append-only)`);
  console.log("");
  console.log(
    "Decision gate: high rerank top-1 + low near-miss confusion -> matching works at this scale; the vector pipeline (Phase 1B) stays deferred. High hard-pair confusion is the eval evidence to build the lanes.",
  );

  // Fail loudly for CI/pre-deploy, but only AFTER the dump + immutable evidence are written,
  // and only in real mode (the gate is the real-rerank trust gate; the stub deliberately
  // carries the accepted lonely-child definitive-wrong, which would always trip it).
  if (
    process.env.EVAL_REQUIRE_GATE === "1" &&
    provider === "real" &&
    !metrics.trustGate.passed
  ) {
    console.error("");
    console.error(
      "EVAL_REQUIRE_GATE=1 and the real rerank trust gate FAILED; exiting non-zero after writing the dump and immutable evidence.",
    );
    process.exit(1);
  }
}

main().catch((error) => {
  // Never print prompt/feeling/provider bodies — only a class-level message.
  console.error("Eval failed:", error instanceof Error ? error : "unknown error");
  process.exit(1);
});
