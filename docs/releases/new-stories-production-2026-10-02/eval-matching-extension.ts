import "../../../scripts/_smoke-bootstrap";
import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { FIGURE_STAGES } from "../../../lib/figures-data";
import { ageDistance } from "../../../lib/figures";
import { scoreAllByKeywordHybrid } from "../../../lib/keyword-match";
import { matchWithDebug, type MatchDebug } from "../../../lib/matching";
import { AGE_TOLERANCE_YEARS, RERANK_TOP_K, STUB_KEYWORD_MAP, matchConfigVersion } from "../../../lib/match-config";
import { INTAKE_MIN_AGE, INTAKE_MAX_AGE } from "../../../lib/intake-constraints";
import { DEFAULT_LLM_BASE_URL, DEFAULT_RERANK_TIMEOUT_MS } from "../../../lib/llm-recipe-constants";
import { assertStoryRecipeExecutionRuntime } from "../../../lib/story-recipe-runtime";
import type { FigureStageRow } from "../../../lib/types";
import { canonicalJson, gitInputTreeSha256, loadRecipeRegistry, manifestSha256, recipeForEval } from "../../../scripts/recipe-evidence";
import { loadEnvLocal } from "../../../scripts/_load-env";

const PACKET = "docs/releases/new-stories-production-2026-10-02";
const EXTENSION = `${PACKET}/matching-extension.json`;
const FROZEN_EXTENSION_SHA256 = "203a6e2c69a23525fa733fe0bd481f6f4026c00b9a75a54b5fd27a5e2e5d17f7";
const ORIGINAL_GOLD_SHA256 = "f87962a57990f65a8765afdcd141bbdd1c3b9f5a965d04f4810f1787d8aa2a1e";
const FROZEN_PROJECTION_SHA256 = "17336b720af3aaf5ae623043e38c118187f8f2565c3a740a0c3f70e68b88b6e4";
const RESPONSE_MAX_BYTES = 65_536;
const REQUEST_MAX_BYTES = 131_072;
const ENDPOINT = `${DEFAULT_LLM_BASE_URL}/chat/completions`;
const keyOf = (stage: { figureKey: string; stageId: string }) => `${stage.figureKey}\u0000${stage.stageId}`;
const hash = (bytes: string | Buffer | Uint8Array) => createHash("sha256").update(bytes).digest("hex");
const fileHash = (path: string) => hash(readFileSync(resolve(path)));

type ExtensionCase = { age: number; feeling: string; expect: string; accept?: string[]; hard?: boolean; plausibleWrong?: string; confusionGroup?: string; semantic?: boolean };
type CaseTask = { dataset: "extension" | "original104"; caseIndex: number; entry: ExtensionCase };
type Transport = { requests: number; requestBytes: number; responseBytes: number; failure: "deadline" | "response_limit" | "request_limit" | "boundary" | "transport" | null };
type Trial = {
  dataset: CaseTask["dataset"]; caseIndex: number; age: number; expect: string; accept: string[]; hard: boolean; semantic: boolean; adult: boolean;
  shortlist: string[]; expectedSurvived: boolean; expectedRank: number | null;
  chosenKey: string | null; chosenStageId: string | null;
  confidence: MatchDebug["confidence"] | null; chosenBy: MatchDebug["chosenBy"] | null;
  framing: MatchDebug["framing"] | null; failureReason: MatchDebug["failureReason"] | "checker_error" | null;
  httpStatus: number | null; elapsedMs: number; matcherLatencyMs: number | null;
  correct: boolean; definitiveWrong: boolean; hardConfused: boolean;
  candidateCount: number | null; ageCandidateCount: number | null; ageFallback: boolean | null;
  transport: Transport;
};

function git(args: string[]): Buffer {
  return execFileSync("git", args, { cwd: process.cwd(), windowsHide: true, maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });
}

function committedFile(path: string): Buffer {
  const committed = git(["show", `HEAD:${path}`]);
  if (hash(committed) !== fileHash(path)) throw new Error("extension_uncommitted_input");
  return committed;
}

function parseCases(): ExtensionCase[] {
  if (fileHash(EXTENSION) !== FROZEN_EXTENSION_SHA256) throw new Error("extension_frozen_hash_mismatch");
  const raw: unknown = JSON.parse(readFileSync(resolve(EXTENSION), "utf8"));
  if (!raw || typeof raw !== "object" || !Array.isArray((raw as { cases?: unknown }).cases)) throw new Error("extension_invalid_cases");
  const cases = (raw as { cases: ExtensionCase[] }).cases;
  if (cases.length !== 20 || new Set(cases.map((entry) => entry.expect)).size !== 10) throw new Error("extension_scope_mismatch");
  for (const entry of cases) {
    if (!Number.isInteger(entry.age) || typeof entry.feeling !== "string" || Buffer.byteLength(entry.feeling, "utf8") > 4096 || !entry.feeling.trim() || typeof entry.expect !== "string") throw new Error("extension_invalid_case");
  }
  return cases;
}

function originalCases(): ExtensionCase[] {
  if (fileHash("evals/match.json") !== ORIGINAL_GOLD_SHA256) throw new Error("extension_original_gold_changed");
  const raw = JSON.parse(readFileSync(resolve("evals/match.json"), "utf8")) as { cases: ExtensionCase[] };
  if (!Array.isArray(raw.cases) || raw.cases.length !== 104) throw new Error("extension_original_scope_mismatch");
  return raw.cases;
}

function selectExisting(cases: ExtensionCase[], catalog: FigureStageRow[]) {
  const keys = new Set(catalog.map((stage) => stage.figureKey));
  const included: CaseTask[] = [];
  const unavailable: { caseIndex: number; expect: string; accept: string[]; age: number; hard: boolean; semantic: boolean; reason: string }[] = [];
  for (const [caseIndex, entry] of cases.entries()) {
    if (entry.expect === "miss" || keys.has(entry.expect)) {
      included.push({ dataset: "original104", caseIndex, entry });
    } else {
      unavailable.push({ caseIndex, expect: entry.expect, accept: entry.accept ?? [], age: entry.age,
        hard: entry.hard === true, semantic: entry.semantic === true,
        reason: "Original primary historical label is outside the projected published catalog; excluded from the reachable regression slice and never counted as correct." });
    }
  }
  return { included, unavailable };
}

// This process-only wrapper preserves the provider request and normal bounded
// response bytes. It adds a full-body deadline and cap to the existing matcher;
// it never logs, hashes or persists a provider body, prompt or credential.
async function boundedFetch(
  fetcher: typeof fetch, input: Parameters<typeof fetch>[0], init: Parameters<typeof fetch>[1], transport: Transport,
  deadlineMs = DEFAULT_RERANK_TIMEOUT_MS,
): Promise<Response> {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  if (url !== ENDPOINT || init?.method !== "POST" || typeof init.body !== "string" || transport.requests !== 0) {
    transport.failure = "boundary";
    throw new Error("extension_transport_boundary");
  }
  transport.requestBytes = Buffer.byteLength(init.body, "utf8");
  if (transport.requestBytes > REQUEST_MAX_BYTES) {
    transport.failure = "request_limit";
    throw new Error("extension_request_limit");
  }
  transport.requests += 1;
  const controller = new AbortController();
  const signal = init.signal ? AbortSignal.any([init.signal, controller.signal]) : controller.signal;
  let bodyReader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      transport.failure = "deadline";
      controller.abort();
      reject(new Error("extension_transport_deadline"));
    }, deadlineMs);
  });
  try {
    const task = (async () => {
      const response = await fetcher(input, { ...init, signal });
      if (!response.ok) {
        if (response.body) void response.body.cancel().catch(() => {});
        return new Response(null, { status: response.status, statusText: response.statusText, headers: response.headers });
      }
      const contentLength = Number(response.headers.get("content-length"));
      if (Number.isFinite(contentLength) && contentLength > RESPONSE_MAX_BYTES) {
        transport.failure = "response_limit";
        controller.abort();
        if (response.body) void response.body.cancel().catch(() => {});
        throw new Error("extension_response_limit");
      }
      const chunks: Uint8Array[] = [];
      const reader = response.body?.getReader();
      bodyReader = reader;
      if (reader) {
        try {
          for (;;) {
            const part = await reader.read();
            if (part.done) break;
            transport.responseBytes += part.value.byteLength;
            if (transport.responseBytes > RESPONSE_MAX_BYTES) {
              transport.failure = "response_limit";
              controller.abort();
              void reader.cancel().catch(() => {});
              throw new Error("extension_response_limit");
            }
            chunks.push(part.value);
          }
        } finally {
          reader.releaseLock();
        }
      }
      const bytes = new Uint8Array(transport.responseBytes);
      let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
      return new Response(bytes, { status: response.status, statusText: response.statusText, headers: response.headers });
    })();
    return await Promise.race([task, deadline]);
  } catch {
    transport.failure ??= "transport";
    controller.abort();
    if (bodyReader) void bodyReader.cancel().catch(() => {});
    throw new Error("extension_provider_request_failed");
  } finally {
    clearTimeout(timer);
  }
}

function metrics(trials: Trial[]) {
  const positive = trials.filter((trial) => trial.expect !== "miss");
  const misses = trials.filter((trial) => trial.expect === "miss");
  const reranked = positive.filter((trial) => trial.chosenBy === "rerank");
  const hard = trials.filter((trial) => trial.hard);
  const latencies = trials.map((trial) => trial.elapsedMs).sort((a, b) => a - b);
  const ratio = (numerator: number, denominator: number) => denominator === 0 ? null : numerator / denominator;
  const percentile = (p: number) => latencies.length ? latencies[Math.max(0, Math.ceil(latencies.length * p) - 1)] : null;
  return {
    cases: trials.length, positiveCases: positive.length, correct: trials.filter((trial) => trial.correct).length,
    positiveCorrect: positive.filter((trial) => trial.correct).length,
    overallTop1: ratio(positive.filter((trial) => trial.correct).length, positive.length),
    reranked: trials.filter((trial) => trial.chosenBy === "rerank").length,
    positiveReranked: reranked.length, rerankTop1: ratio(reranked.filter((trial) => trial.correct).length, reranked.length),
    keywordFallbacks: trials.filter((trial) => trial.chosenBy === "keyword_fallback").length,
    errors: trials.filter((trial) => trial.failureReason === "checker_error").length,
    shortlistFailures: trials.filter((trial) => !trial.expectedSurvived).map((trial) => trial.caseIndex),
    definitiveWrong: trials.filter((trial) => trial.definitiveWrong).length,
    hardCases: hard.length, hardConfused: hard.filter((trial) => trial.hardConfused).length,
    hardConfusion: ratio(hard.filter((trial) => trial.hardConfused).length, hard.length),
    missCases: misses.length, missesDetected: misses.filter((trial) => trial.correct).length,
    missDetection: ratio(misses.filter((trial) => trial.correct).length, misses.length),
    p50Ms: percentile(0.5), p95Ms: percentile(0.95),
    providerRequests: trials.reduce((total, trial) => total + trial.transport.requests, 0),
    responseBoundFailures: trials.filter((trial) => trial.transport.failure === "response_limit").length,
    deadlineFailures: trials.filter((trial) => trial.transport.failure === "deadline").length,
  };
}

function adultCoverage(cases: ExtensionCase[], trials: Trial[], catalog: FigureStageRow[]) {
  return [...new Set(cases.map((entry) => entry.expect))].sort().map((key) => {
    const stage = catalog.find((entry) => entry.figureKey === key);
    if (!stage) throw new Error("extension_target_stage_missing");
    const reachable = Math.max(INTAKE_MIN_AGE, stage.ageMin - AGE_TOLERANCE_YEARS) <= Math.min(INTAKE_MAX_AGE, stage.ageMax + AGE_TOLERANCE_YEARS);
    const matching = trials.filter((trial) => trial.dataset === "extension" && trial.expect === key && trial.adult && trial.expectedSurvived && trial.correct && trial.chosenBy === "rerank");
    return { figureKey: key, historicalAgeMin: stage.ageMin, historicalAgeMax: stage.ageMax, adultAgeReachable: reachable,
      realCorrectAdultCaseIndices: matching.map((trial) => trial.caseIndex), observedCorrectAdultCheck: matching.length > 0,
      qualification: reachable ? null : "Historical age six falls outside every normal adult age pool. Under-18 checks are diagnostics only; publication does not establish adult matching availability." };
  });
}

async function selfTest() {
  const transport = (): Transport => ({ requests: 0, requestBytes: 0, responseBytes: 0, failure: null });
  const init = { method: "POST", body: "{}" };
  const normal = transport();
  const fakeFetch = (async () => new Response("{}")) as typeof fetch;
  assert.equal(await (await boundedFetch(fakeFetch, ENDPOINT, init, normal)).text(), "{}");
  assert.equal(normal.responseBytes, 2);
  const oversized = transport();
  await assert.rejects(boundedFetch((async () => new Response(new Uint8Array(RESPONSE_MAX_BYTES + 1))) as typeof fetch, ENDPOINT, init, oversized));
  assert.equal(oversized.failure, "response_limit");
  const stalled = transport();
  await assert.rejects(boundedFetch((async () => new Response(new ReadableStream({ start() {} }))) as typeof fetch, ENDPOINT, init, stalled, 5));
  assert.equal(stalled.failure, "deadline");
  const boundary = transport();
  await assert.rejects(boundedFetch(fakeFetch, "https://example.invalid", init, boundary));
  assert.equal(boundary.requests, 0);
  const cases = parseCases();
  assert.equal(cases.filter((entry) => entry.age >= INTAKE_MIN_AGE).length, 18);
  assert.equal(cases.filter((entry) => entry.age < INTAKE_MIN_AGE).length, 2);
  const projection = JSON.parse(readFileSync(resolve(`${PACKET}/PROJECTED-CATALOG.json`), "utf8")) as { publishedAtBaseline: { figureKey: string; stageId: string }[] };
  const targetKeys = new Set(cases.map((entry) => entry.expect));
  const projectedKeys = new Set([...projection.publishedAtBaseline.map((entry) => entry.figureKey), ...targetKeys]);
  const fakeCatalog = [...projectedKeys].map((figureKey) => ({ figureKey })) as FigureStageRow[];
  const original = originalCases();
  const selection = selectExisting(original, fakeCatalog);
  assert.equal(selection.included.length, 69);
  assert.equal(selection.unavailable.length, 35);
  assert.equal(selection.included.filter((task) => task.entry.expect === "miss").length, 3);
  for (const task of selection.included) assert.equal(task.entry, original[task.caseIndex]);
  assert.equal(hash(canonicalJson(original)), hash(canonicalJson(originalCases())));
  console.log(JSON.stringify({ ok: true, mode: "offline-self-test", networkCalls: 0, frozenCases: cases.length,
    existingIncluded: selection.included.length, existingUnavailable: selection.unavailable.length,
    checks: ["normal response", "response byte cap", "full-body deadline", "closed endpoint", "adult diagnostic split", "untouched existing-case selection", "unavailable labels excluded", "three original misses retained"] }));
}

async function main() {
  if (process.argv.includes("--self-test")) { await selfTest(); return; }
  const flags = process.argv.slice(2);
  const catalogFlag = flags.find((flag) => flag.startsWith("--catalog="));
  const includeExisting = flags.includes("--include-existing");
  if (!catalogFlag || !["--catalog=installed60", "--catalog=projected44"].includes(catalogFlag) || new Set(flags).size !== flags.length || flags.some((flag) => flag !== catalogFlag && flag !== "--include-existing")) throw new Error("extension_catalog_argument_required");
  const catalogMode = catalogFlag.slice("--catalog=".length);
  if (includeExisting && catalogMode !== "projected44") throw new Error("extension_existing_projection_required");
  loadEnvLocal();
  if (process.env.NODE_ENV === "production") throw new Error("extension_local_eval_process_required");
  // No database access: the projection selects exact installed stages in memory.
  process.env.PERSISTENCE = "memory";
  process.env.LLM_PROVIDER = "real";
  process.env.RETRIEVAL_MODE = "keyword";
  if (process.env.FACETSRAG_TAGGER?.trim() || process.env.RERANK_CANDIDATE_ORDER?.trim().toLowerCase() === "alphabetical") throw new Error("extension_routing_override_forbidden");
  const registry = loadRecipeRegistry();
  if (process.env.EVAL_RECIPE_ID?.trim() && process.env.EVAL_RECIPE_ID.trim() !== registry.selection.primaryRecipeId) throw new Error("extension_primary_recipe_required");
  const recipe = recipeForEval(registry, "keyword", registry.selection.primaryRecipeId);
  if (manifestSha256(recipe) !== recipe.manifestSha256 || recipe.matchConfigVersion !== matchConfigVersion || recipe.rerankTopK !== RERANK_TOP_K) throw new Error("extension_recipe_identity_mismatch");
  assertStoryRecipeExecutionRuntime(recipe);
  const inputPaths = ["lib/figures-data.ts", "lib/match-config.ts", "lib/matching.ts", "lib/keyword-match.ts", "lib/llm-real.ts", "lib/provider-exchange.ts", "config/story-recipes.json", "config/prompt-releases.json", "evals/match.json", EXTENSION, `${PACKET}/THEME-PROPOSAL.json`, `${PACKET}/eval-matching-extension.ts`];
  for (const path of inputPaths) committedFile(path);
  if (fileHash("evals/match.json") !== ORIGINAL_GOLD_SHA256) throw new Error("extension_original_gold_changed");
  const cases = parseCases();
  if (FIGURE_STAGES.length !== 60 || new Set(FIGURE_STAGES.map(keyOf)).size !== 60) throw new Error("extension_exact_sixty_catalog_required");
  const proposal = JSON.parse(readFileSync(resolve(`${PACKET}/THEME-PROPOSAL.json`), "utf8")) as { stages: { file: string; figureKey: string; proposedSha256: string }[] };
  if (proposal.stages.length !== 10) throw new Error("extension_proposal_scope_mismatch");
  const targetKeys = new Set(proposal.stages.map((stage) => stage.figureKey));
  for (const pin of proposal.stages) {
    const path = `${PACKET}/proposed-stages/${pin.file}`;
    committedFile(path);
    if (fileHash(path) !== pin.proposedSha256) throw new Error("extension_production_stage_hash_mismatch");
    const stage = JSON.parse(readFileSync(resolve(path), "utf8")) as FigureStageRow;
    if (!isDeepStrictEqual(FIGURE_STAGES.find((entry) => entry.figureKey === pin.figureKey), stage)) throw new Error("extension_installed_stage_mismatch");
  }
  // Projected membership is frozen in the source-controlled original receipt.
  // It is deliberately not represented as a live Supabase catalog audit.
  const capturedPath = `${PACKET}/PROJECTED-CATALOG.json`;
  committedFile(capturedPath);
  if (fileHash(capturedPath) !== FROZEN_PROJECTION_SHA256) throw new Error("extension_frozen_projection_mismatch");
  const captured = JSON.parse(readFileSync(resolve(capturedPath), "utf8")) as { schemaVersion: string; publishedAtBaseline: { figureKey: string; stageId: string }[] };
  if (captured.schemaVersion !== "new-ten-projected-catalog-v1" || captured.publishedAtBaseline.length !== 34) throw new Error("extension_projection_pin_mismatch");
  const baselineKeys = new Set(captured.publishedAtBaseline.map(keyOf));
  if (baselineKeys.size !== 34) throw new Error("extension_projection_membership_incomplete");
  const catalog = catalogMode === "installed60" ? FIGURE_STAGES : FIGURE_STAGES.filter((stage) => baselineKeys.has(keyOf(stage)) || targetKeys.has(stage.figureKey));
  if (catalog.length !== (catalogMode === "installed60" ? 60 : 44)) throw new Error("extension_projected_catalog_scope_mismatch");
  const eligibleStageKeys = new Set(catalog.map(keyOf));
  const existingSelection = selectExisting(originalCases(), catalog);
  const tasks: CaseTask[] = cases.map((entry, caseIndex) => ({ dataset: "extension", caseIndex, entry }));
  if (includeExisting) tasks.push(...existingSelection.included);
  const gitCommit = git(["rev-parse", "HEAD"]).toString("utf8").trim();
  const inputTreeSha256 = gitInputTreeSha256(gitCommit);
  if (!/^[a-f0-9]{40}$/.test(gitCommit) || !inputTreeSha256) throw new Error("extension_committed_tree_required");
  const runId = randomUUID();
  const receiptPath = resolve(PACKET, `MATCHING-EXTENSION-${catalogMode}-${runId}.json`);
  const trials: Trial[] = [];
  const startedAt = new Date().toISOString();
  const header = {
    schemaVersion: "new-ten-supplemental-matching-v1", authoritative: false, promotable: false,
    qualification: "Synthetic observed supplemental measurement only. Supplements and never replaces the unchanged original-104 real trust gate. Projected44 is captured editorial membership, not a live production audit. Optional original-case regression preserves exact inputs, labels and accepted sets; unavailable primary labels are reported separately and never counted as correct.",
    runId, startedAt, gitCommit, inputTreeSha256, catalogMode, includeExisting,
    selection: { extensionCaseCount: cases.length, originalCaseCount: 104,
      includedOriginalCaseIndices: includeExisting ? existingSelection.included.map((task) => task.caseIndex) : [],
      unavailableOriginalLabels: existingSelection.unavailable,
      originalRegressionMeasured: includeExisting,
      rule: "Include an untouched original case only when its primary expected figure is present, or when it is one of the original miss cases. Existing accept arrays stay exact; unavailable primary labels are not reclassified." },
    hashes: { extension: FROZEN_EXTENSION_SHA256, originalGold: ORIGINAL_GOLD_SHA256, library: fileHash("lib/figures-data.ts"), catalog: hash(canonicalJson([...catalog].sort((a, b) => keyOf(a).localeCompare(keyOf(b))))),
      recipeManifest: recipe.manifestSha256, keywordRoutes: hash(canonicalJson(STUB_KEYWORD_MAP)), projectionReceipt: fileHash(capturedPath), checker: fileHash(`${PACKET}/eval-matching-extension.ts`) },
    recipe: { recipeId: recipe.recipeId, provider: "real", model: recipe.rerankModelId, retrievalMode: recipe.retrievalMode, temperature: recipe.rerankTemperature, reasoningEffort: recipe.rerankReasoningEffort, topK: recipe.rerankTopK, matchConfigVersion },
    bounds: { concurrency: 1, maxRetries: 0, maxProviderRequests: tasks.length, requestMaxBytes: REQUEST_MAX_BYTES, responseMaxBytes: RESPONSE_MAX_BYTES, completeResponseDeadlineMs: DEFAULT_RERANK_TIMEOUT_MS, adultMin: INTAKE_MIN_AGE, adultMax: INTAKE_MAX_AGE },
  };
  const save = (complete: boolean) => {
    const coverage = adultCoverage(cases, trials, catalog);
    const reachable = coverage.filter((row) => row.adultAgeReachable);
    const ok = complete && trials.length === tasks.length && trials.every((trial) => trial.correct && trial.chosenBy === "rerank") && reachable.every((row) => row.observedCorrectAdultCheck);
    const extensionTrials = trials.filter((trial) => trial.dataset === "extension");
    const existingTrials = trials.filter((trial) => trial.dataset === "original104");
    const split = (rows: Trial[]) => ({ all: metrics(rows), adult: metrics(rows.filter((trial) => trial.adult)), under18Diagnostics: metrics(rows.filter((trial) => !trial.adult)) });
    const receipt = { ...header, complete, completedAt: complete ? new Date().toISOString() : null, ok,
      metrics: { ...split(trials), extension: split(extensionTrials), existingOriginal104: includeExisting ? split(existingTrials) : null },
      adultCoverage: coverage, observedAdultCoverage: { reachableFigures: reachable.length, checkedFigures: reachable.filter((row) => row.observedCorrectAdultCheck).length }, trials };
    writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
    return receipt;
  };
  writeFileSync(receiptPath, `${JSON.stringify({ ...header, complete: false, trials: [] }, null, 2)}\n`, { flag: "wx" });
  const fetcher = globalThis.fetch.bind(globalThis);
  try {
    for (const { dataset, caseIndex, entry } of tasks) {
      const agePool = catalog.filter((stage) => ageDistance(stage, entry.age) <= AGE_TOLERANCE_YEARS);
      const pool = agePool.length ? agePool : catalog;
      const scores = scoreAllByKeywordHybrid(entry, pool);
      const shortlist = scores.slice(0, RERANK_TOP_K).map((score) => score.stage.figureKey);
      const acceptable = [entry.expect, ...(entry.accept ?? [])];
      const expectedSurvived = entry.expect === "miss" || shortlist.some((key) => acceptable.includes(key));
      const expectedRank = entry.expect === "miss" ? null : scores.findIndex((score) => acceptable.includes(score.stage.figureKey)) + 1 || null;
      const transport: Transport = { requests: 0, requestBytes: 0, responseBytes: 0, failure: null };
      globalThis.fetch = (input, init) => boundedFetch(fetcher, input, init, transport);
      const start = performance.now();
      let result: MatchDebug | null = null;
      try { result = await matchWithDebug({ age: entry.age, feeling: entry.feeling, eligibleStageKeys }); } catch {}
      const elapsedMs = Math.round(performance.now() - start);
      const correct = entry.expect === "miss" ? result?.framing === "partial" : expectedSurvived && typeof result?.figureKey === "string" && acceptable.includes(result.figureKey);
      const trial: Trial = {
        dataset, caseIndex, age: entry.age, expect: entry.expect, accept: entry.accept ?? [], hard: entry.hard === true, semantic: entry.semantic === true,
        adult: entry.age >= INTAKE_MIN_AGE && entry.age <= INTAKE_MAX_AGE,
        shortlist, expectedSurvived, expectedRank, chosenKey: result?.figureKey ?? null, chosenStageId: result?.stageId ?? null,
        confidence: result?.confidence ?? null, chosenBy: result?.chosenBy ?? null, framing: result?.framing ?? null,
        failureReason: result ? result.failureReason ?? null : "checker_error", httpStatus: result?.httpStatus ?? null,
        elapsedMs, matcherLatencyMs: result ? Math.round(result.latencyMs) : null, correct,
        definitiveWrong: result?.framing === "definitive" && !correct,
        hardConfused: entry.hard === true && result?.figureKey === entry.plausibleWrong,
        candidateCount: result?.candidateCount ?? null, ageCandidateCount: result?.ageCandidateCount ?? null, ageFallback: result?.ageFallback ?? null,
        transport,
      };
      trials.push(trial);
      save(false);
      console.log(JSON.stringify({ dataset, caseIndex, expect: entry.expect, chosenKey: trial.chosenKey, confidence: trial.confidence, chosenBy: trial.chosenBy, expectedSurvived, correct, elapsedMs, failureReason: trial.failureReason, transportFailure: transport.failure }));
    }
  } finally {
    globalThis.fetch = fetcher;
  }
  const receipt = save(true);
  console.log(JSON.stringify({ ok: receipt.ok, authoritative: false, receiptPath, metrics: receipt.metrics, observedAdultCoverage: receipt.observedAdultCoverage }));
  if (!receipt.ok) process.exitCode = 1;
}

main().catch((error: unknown) => {
  // Never print an exception/cause that could contain a provider exchange.
  const errorCode = error instanceof Error && /^extension_[a-z_]+$/.test(error.message) ? error.message : "extension_local_boundary_failed";
  console.error(JSON.stringify({ ok: false, errorCode, qualification: "No raw exception, provider response or request data is emitted." }));
  process.exitCode = 1;
});
