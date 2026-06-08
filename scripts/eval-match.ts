import "./_smoke-bootstrap";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnvLocal } from "./_load-env";
import { listAll, listByAge } from "../lib/figures";
import {
  matchWithDebug,
  selectRerankPool,
  type MatchDebug,
} from "../lib/matching";
import {
  matchConfigVersion,
  RERANK_TOP_K,
  RERANK_TRUST_GATE,
} from "../lib/match-config";

// The verification instrument for Phase 1A: run hand-graded gold cases through the real
// matcher and report whether the reranker picks the right figure — and how honestly it
// frames its confidence. This is the decision gate for the (deferred) vector pipeline.
//
// Privacy: matchWithDebug() never returns resonance/gap (they don't leave lib/), so this
// harness physically cannot dump them. The full per-trial dump (gitignored) carries the
// SYNTHETIC gold feelings; summary.json carries metrics/counts/the 2x2 ONLY — no feeling
// text — so it's safe to commit for cross-run diffing via git history.

const GOLD_PATH = resolve(process.cwd(), "evals/match.json");
const RUNS_DIR = resolve(process.cwd(), "evals/runs");
const DEFAULT_MODEL = "gpt-oss-120b";

type GoldCase = {
  age: number;
  feeling: string;
  expect: string; // figureKey, or "miss"
  note?: string;
  hard?: boolean;
  plausibleWrong?: string;
  confusionGroup?: string;
};

type Trial = {
  gold: GoldCase;
  run: number;
  result: MatchDebug;
};

function numberEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Gold-set loading + validation ────────────────────────────────────────────

function loadGold(validKeys: Set<string>): GoldCase[] {
  let text: string;
  try {
    text = readFileSync(GOLD_PATH, "utf8");
  } catch {
    fail(`Could not read ${GOLD_PATH}`);
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
async function runTrial(gold: GoldCase, maxRetries: number): Promise<MatchDebug> {
  let attempt = 0;
  for (;;) {
    const result = await matchWithDebug({ age: gold.age, feeling: gold.feeling });
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
): Promise<void> {
  const errors: string[] = [];

  for (const [index, gold] of cases.entries()) {
    if (gold.expect === "miss") continue;

    const agePool = await listByAge(gold.age);
    const pool = agePool.length === 0 ? allStages : agePool;
    const selected = selectRerankPool(
      { age: gold.age, feeling: gold.feeling },
      pool,
    );

    const survived = selected.some((stage) => stage.figureKey === gold.expect);
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
    : result.figureKey === gold.expect;
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

  return {
    rerankTop1,
    rerankTop1Counts: { correct: rerankCorrect, total: rerankNonMiss.length },
    overallTop1,
    overallTop1Counts: { correct: overallCorrect, total: nonMiss.length },
    missDetection,
    missDetectionCounts: { detected: missDetected, total: miss.length },
    hardConfusion,
    hardConfusionCounts: { confused: hardConfused, total: hard.length },
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
      input.hardConfusion !== null &&
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
  console.log("");
  console.log(
    `Miss detection (expect=miss -> partial): ${pct(m.missDetection)}  (${m.missDetectionCounts.detected}/${m.missDetectionCounts.total})`,
  );
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
  return Boolean(
    process.env.LLM_API_KEY ??
      process.env.CEREBRAS_API_KEY ??
      process.env.GROQ_API_KEY,
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("Onward match eval");
  console.log("=================");

  const env = loadEnvLocal();
  // Default to real (the verification instrument), but honor an explicitly-set provider
  // — `LLM_PROVIDER=stub` lets you self-test the harness without burning API calls.
  if (!process.env.LLM_PROVIDER) process.env.LLM_PROVIDER = "real";
  const provider = process.env.LLM_PROVIDER;

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
  const validKeys = new Set(stages.map((s) => s.figureKey));
  const cases = loadGold(validKeys);
  await assertExpectedSurvivesPrefilter(cases, stages);

  const jobs = cases.flatMap((gold) =>
    Array.from({ length: k }, (_, run) => ({ gold, run })),
  );

  console.log(
    `provider=${provider} model=${model} k=${k} concurrency=${concurrency} cases=${cases.length} trials=${jobs.length}`,
  );
  console.log(`matchConfigVersion=${matchConfigVersion}`);

  const results = await mapWithConcurrency(jobs, concurrency, async (job) => ({
    gold: job.gold,
    run: job.run,
    result: await runTrial(job.gold, maxRetries),
  }));

  const metrics = computeMetrics(results, k);
  printReport(metrics);

  // ── Dumps ──
  mkdirSync(RUNS_DIR, { recursive: true });
  const ranAt = new Date().toISOString();
  const config = {
    matchConfigVersion,
    provider,
    model,
    k,
    concurrency,
    maxRetries,
    ranAt,
    caseCount: cases.length,
    trialCount: jobs.length,
  };

  const stamp = ranAt.replace(/[:.]/g, "-");
  const fullPath = resolve(RUNS_DIR, `${stamp}.json`);
  // Full dump (gitignored): config + metrics + per-trial gold (SYNTHETIC feeling) + result.
  // No resonance/gap exists to leak — matchWithDebug never returns it.
  writeFileSync(
    fullPath,
    JSON.stringify({ config, metrics, trials: results.map(toDumpTrial) }, null, 2),
  );

  const summaryPath = resolve(RUNS_DIR, "summary.json");
  // Committable: metrics + config ONLY. No `trials`, so no feeling text. Diff across
  // runs via git history.
  writeFileSync(summaryPath, JSON.stringify({ config, metrics }, null, 2));

  console.log("");
  console.log(`Wrote ${fullPath}  (full, gitignored)`);
  console.log(`Wrote ${summaryPath}  (metrics only, committable)`);
  console.log("");
  console.log(
    "Decision gate: high rerank top-1 + low near-miss confusion -> matching works at this scale; the vector pipeline (Phase 1B) stays deferred. High hard-pair confusion is the eval evidence to build the lanes.",
  );

  // Fail loudly for CI/pre-deploy, but only AFTER the dump + summary are written above,
  // and only in real mode (the gate is the real-rerank trust gate; the stub deliberately
  // carries the accepted lonely-child definitive-wrong, which would always trip it).
  if (
    process.env.EVAL_REQUIRE_GATE === "1" &&
    provider === "real" &&
    !metrics.trustGate.passed
  ) {
    console.error("");
    console.error(
      "EVAL_REQUIRE_GATE=1 and the real rerank trust gate FAILED — exiting non-zero (dump + summary were written above).",
    );
    process.exit(1);
  }
}

main().catch((error) => {
  // Never print prompt/feeling/provider bodies — only a class-level message.
  console.error("Eval failed:", error instanceof Error ? error : "unknown error");
  process.exit(1);
});
