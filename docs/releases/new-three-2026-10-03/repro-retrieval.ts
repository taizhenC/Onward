// Diagnostic only: frozen supplemental coverage, not a CI or publication gate.
// Runs the real keyword prefilter without loading an env file or calling a provider.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import tls from "node:tls";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";
import type { FigureStageRow } from "../../../lib/types";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const PACKET = resolve(ROOT, "docs/releases/new-three-2026-10-03");
const RESEARCH = resolve(ROOT, "docs/research/new-three-2026-10-03");
const CASE_SHA = "acb9830130d99d362d81706ea88baa58a3116a77b892b11f408242277e29c189";
const FREEZE_SHA = "47facaaca93190d99d0e5e1388f875f555766041af888901870bcc35ebcf0299";
const CONTEXT_SHA = "0d210d3393250d4860b8c5718c1bb9f9b713347656edc0b5e213a75f98c955f5";
const ORIGINAL_GOLD_SHA = "f87962a57990f65a8765afdcd141bbdd1c3b9f5a965d04f4810f1787d8aa2a1e";
const STAGE_PINS = [
  { figureKey: "franklin_b", file: "franklin_b-1727-1728-a-first-customer-v1.stage.json", sha256: "1a88acec9580e2bdec22bd64e0a668e577658b9076bbda80899e0ff5104093d7" },
  { figureKey: "somerville_m", file: "somerville_m-1827-1831-a-manuscript-in-secret-v1.stage.json", sha256: "9da559979a7144482a8a46844e9593278b86f829490e9382745d36236ccbeda9" },
  { figureKey: "slocum_j", file: "slocum_j-1892-1895-a-boat-in-the-field-v1.stage.json", sha256: "bae80966aee65afd5e00ee98c8888ae5e54da51645d737df1d89fb685854ecb2" },
] as const;

type GoldCase = { age: number; feeling: string; expect: string; accept?: string[]; semantic?: boolean };
type Dataset = {
  datasetVersion: string;
  authoring: { existingFigureKeys: string[]; existingContextSha256: string; newStages: { figureKey: string; file: string; sha256: string }[] };
  cases: GoldCase[];
};

function hash(data: string | Buffer): string {
  return createHash("sha256").update(data).digest("hex");
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function readPinned<T>(path: string, expectedSha: string): T {
  const bytes = readFileSync(path);
  assert(hash(bytes) === expectedSha, `Fixture hash mismatch: ${path}`);
  return JSON.parse(bytes.toString("utf8")) as T;
}

function parseCase(args: string[]): { requestedCase: "all" | number; minimize: boolean } {
  assert((args.length === 2 || args.length === 3) && args[0] === "--case", "Usage: repro-retrieval.ts --case all|<zero-based index> [--minimize]");
  const minimize = args.length === 3;
  assert(!minimize || args[2] === "--minimize", "Unknown diagnostic argument.");
  if (args[1] === "all") {
    assert(!minimize, "The authorized minimization probe is limited to case0.");
    return { requestedCase: "all", minimize };
  }
  assert(/^(0|[1-9]\d*)$/.test(args[1]), "Case must be all or a zero-based integer 0..11.");
  const index = Number(args[1]);
  assert(Number.isSafeInteger(index) && index < 12, "Case index must be 0..11.");
  assert(!minimize || index === 0, "The authorized minimization probe is limited to case0.");
  return { requestedCase: index, minimize };
}

async function main(): Promise<void> {
  const { requestedCase, minimize } = parseCase(process.argv.slice(2));
  let networkAttempts = 0;
  const blockNetwork = (): never => {
    networkAttempts += 1;
    throw new Error("Network access is forbidden in repro-retrieval.");
  };
  // Guards are process-local and installed before any application runtime import.
  globalThis.fetch = async () => blockNetwork();
  http.request = blockNetwork;
  http.get = blockNetwork;
  https.request = blockNetwork;
  https.get = blockNetwork;
  net.connect = blockNetwork;
  net.createConnection = blockNetwork;
  net.Socket.prototype.connect = blockNetwork;
  tls.connect = blockNetwork;

  const dataset = readPinned<Dataset>(resolve(PACKET, "NEW-THREE-MATCH-CASES.json"), CASE_SHA);
  readPinned<unknown>(resolve(PACKET, "NEW-THREE-MATCH-CASES-FREEZE.json"), FREEZE_SHA);
  const originalGold = readPinned<{ cases: GoldCase[] }>(resolve(ROOT, "evals/match.json"), ORIGINAL_GOLD_SHA);
  assert(dataset.cases.length === 12 && originalGold.cases.length === 104, "Frozen case counts changed.");
  assert(dataset.authoring.existingContextSha256 === CONTEXT_SHA, "Frozen context declaration changed.");
  assert(dataset.authoring.existingFigureKeys.length === 60, "Expected exactly 60 original figure keys.");
  assert(new Set(dataset.authoring.existingFigureKeys).size === 60, "Duplicate original figure keys.");
  [5, 20, 21].forEach((oldIndex, index) => {
    assert(isDeepStrictEqual(dataset.cases[9 + index], originalGold.cases[oldIndex]), "Original miss control changed.");
  });

  const proposed = STAGE_PINS.map((pin) => {
    const stage = readPinned<FigureStageRow>(resolve(RESEARCH, pin.file), pin.sha256);
    assert(stage.figureKey === pin.figureKey, "Stage identity differs from its pin.");
    assert(dataset.authoring.newStages.some((entry) => entry.figureKey === pin.figureKey && entry.file === pin.file && entry.sha256 === pin.sha256), "Case freeze does not bind the expected stage.");
    return stage;
  });
  assert(dataset.authoring.newStages.length === 3, "Expected exactly three frozen proposed stages.");

  // Bootstrap only aliases server-only. It does not load local env files.
  await import("../../../scripts/_smoke-bootstrap");
  const { FIGURE_STAGES } = await import("../../../lib/figures-data");
  const { selectRerankPool } = await import("../../../lib/matching");
  const { ageDistance } = await import("../../../lib/figures");
  const { scoreAllByKeywordHybrid, getMatchedThemeWeights } = await import("../../../lib/keyword-match");
  const { AGE_TOLERANCE_YEARS, RERANK_TOP_K, matchConfigVersion } = await import("../../../lib/match-config");

  const existingKeys = new Set(dataset.authoring.existingFigureKeys);
  const existing = FIGURE_STAGES.filter((stage) => existingKeys.has(stage.figureKey));
  assert(existing.length === 60, "The original library must contain all 60 unchanged rows.");
  assert(isDeepStrictEqual(existing.map((stage) => stage.figureKey), dataset.authoring.existingFigureKeys), "Original library order changed.");
  assert(hash(JSON.stringify(existing)) === CONTEXT_SHA, "Original 60-row full structure changed.");
  const newKeys = new Set<string>(STAGE_PINS.map((pin) => pin.figureKey));
  assert(FIGURE_STAGES.every((stage) => existingKeys.has(stage.figureKey) || newKeys.has(stage.figureKey)), "Unexpected figure outside the frozen fixture.");
  for (const proposedStage of proposed) {
    const installed = FIGURE_STAGES.filter((stage) => stage.figureKey === proposedStage.figureKey);
    assert(installed.length <= 1, "Duplicate installed proposed stage.");
    assert(installed.length === 0 || isDeepStrictEqual(installed[0], proposedStage), "Installed proposal differs from frozen stage.");
  }
  // The overlay works with either the restored original60 or the exact installed63.
  const fixture = [...existing, ...proposed];
  assert(fixture.length === 63, "Diagnostic fixture must contain exactly 63 stages.");
  const indexes = requestedCase === "all" ? dataset.cases.map((_, index) => index) : [requestedCase];
  const results = indexes.map((index) => {
    const gold = dataset.cases[index];
    const input = { age: gold.age, feeling: gold.feeling };
    const agePool = fixture.filter((stage) => ageDistance(stage, input.age) <= AGE_TOLERANCE_YEARS);
    const pool = agePool.length === 0 ? fixture : agePool;
    const selected = selectRerankPool(input, pool);
    const scored = scoreAllByKeywordHybrid(input, pool);
    const acceptable = new Set([gold.expect, ...(gold.accept ?? [])]);
    const requiredPositive = gold.expect !== "miss" && !gold.semantic;
    const expectedSurvives = requiredPositive ? selected.some((stage) => acceptable.has(stage.figureKey)) : null;
    const selectedKeys = new Set(selected.map((stage) => `${stage.figureKey}/${stage.stageId}`));
    return {
      caseIndexZeroBased: index,
      age: gold.age,
      inputSha256: hash(gold.feeling),
      expect: gold.expect,
      accept: gold.accept ?? [],
      requiredPositive,
      matchedThemeWeights: Object.fromEntries(getMatchedThemeWeights(input.feeling)),
      agePoolSize: agePool.length,
      poolSize: pool.length,
      ageFallbackToAll: agePool.length === 0,
      selected: selected.map((stage) => stage.figureKey),
      scores: scored.flatMap((pick, rank) => {
        const key = `${pick.stage.figureKey}/${pick.stage.stageId}`;
        if (!selectedKeys.has(key) && !acceptable.has(pick.stage.figureKey)) return [];
        return [{
          rankOneBased: rank + 1,
          figureKey: pick.stage.figureKey,
          stageId: pick.stage.stageId,
          themes: pick.stage.themes,
          ageDistance: ageDistance(pick.stage, input.age),
          keywordScore: pick.keywordScore,
          agePenalty: pick.agePenalty,
          totalScore: pick.totalScore,
          selected: selectedKeys.has(key),
          acceptable: acceptable.has(pick.stage.figureKey),
        }];
      }),
      acceptableExcludedByAge: fixture.filter((stage) => acceptable.has(stage.figureKey) && !pool.includes(stage)).map((stage) => ({ figureKey: stage.figureKey, ageDistance: ageDistance(stage, input.age) })),
      expectedSurvives,
      missCalibrationMeasured: false,
    };
  });
  let hypothesisProbes: unknown = undefined;
  if (minimize) {
    // Root authorized these ranked predictions after the baseline went red.
    // The artificial pool reduction is a diagnosis, not a runtime change or fix.
    const gold = dataset.cases[0];
    const input = { age: gold.age, feeling: gold.feeling };
    const target = fixture.find((stage) => stage.figureKey === gold.expect);
    assert(target, "Case0 target not found in frozen fixture.");
    const agePool = fixture.filter((stage) => ageDistance(stage, input.age) <= AGE_TOLERANCE_YEARS);
    const selected = selectRerankPool(input, agePool);
    const weights = getMatchedThemeWeights(input.feeling);
    const targetScore = scoreAllByKeywordHybrid(input, agePool).find((pick) => pick.stage === target);
    assert(targetScore, "Case0 target is absent from age pool.");
    assert(weights.size === 0 && targetScore.keywordScore === 0, "H1 recorded zero-theme symptom differs from baseline.");
    assert(selected.length === RERANK_TOP_K && !selected.includes(target), "Case0 no longer reproduces the baseline loss.");
    const minimalPool = [...selected, target];
    const minimalSelected = selectRerankPool(input, minimalPool);
    const minimalScores = scoreAllByKeywordHybrid(input, minimalPool);
    assert(minimalScores.every((pick) => pick.totalScore === 0 && pick.keywordScore === 0 && pick.agePenalty === 0), "H3 expected an equal-zero minimal pool.");
    assert(!minimalSelected.includes(target), "Seven-candidate pool did not preserve the baseline failure.");
    const removed = selected[0];
    const reducedPool = minimalPool.filter((stage) => stage !== removed);
    const reducedSelected = selectRerankPool(input, reducedPool);
    assert(reducedSelected.includes(target), "Removing one competitor did not restore target survival.");
    hypothesisProbes = {
      authorizedByRootAfterRedLoop: true,
      h1ZeroThemeSymptom: { matchedThemeWeights: Object.fromEntries(weights), targetKeywordScore: targetScore.keywordScore, observation: "ZERO_THEME_SIGNAL_CONFIRMED_NO_PHRASE_OR_ROUTE_CHANGE" },
      h2AgeExclusion: { target: target.figureKey, ageDistance: ageDistance(target, input.age), ageToleranceYears: AGE_TOLERANCE_YEARS, presentInAgePool: agePool.includes(target), observation: "AGE_EXCLUSION_FALSIFIED_FOR_CASE0" },
      h3TieOrdering: {
        minimalPool: minimalPool.map((stage) => stage.figureKey),
        minimalPoolSize: minimalPool.length,
        minimalRankedKeys: minimalScores.map((pick) => pick.stage.figureKey),
        allScoresZero: true,
        selectedBeforeRemoval: minimalSelected.map((stage) => stage.figureKey),
        targetRankBeforeRemoval: minimalScores.findIndex((pick) => pick.stage === target) + 1,
        targetSurvivesBeforeRemoval: false,
        removedCompetitor: removed.figureKey,
        reducedPoolSize: reducedPool.length,
        selectedAfterRemoval: reducedSelected.map((stage) => stage.figureKey),
        targetSurvivesAfterRemoval: true,
        observation: "ONE_COMPETITOR_REMOVAL_CHANGES_SURVIVAL_IN_ARTIFICIAL_POOL_ONLY",
      },
      fixesTested: 0,
      productionChange: false,
      releasePass: false,
    };
  }
  assert(networkAttempts === 0, "Diagnostic attempted network access.");
  const dropped = results.filter((result) => result.requiredPositive && !result.expectedSurvives).map((result) => result.caseIndexZeroBased);
  console.log(JSON.stringify({
    diagnosticOnly: true,
    caseSelection: requestedCase,
    datasetVersion: dataset.datasetVersion,
    caseSha256: CASE_SHA,
    frozenExisting60Sha256: CONTEXT_SHA,
    original104GoldSha256: ORIGINAL_GOLD_SHA,
    proposedStages: STAGE_PINS,
    fixtureStageCount: fixture.length,
    runtime: {
      matchConfigVersion,
      rerankTopK: RERANK_TOP_K,
      ageToleranceYears: AGE_TOLERANCE_YEARS,
      sourceSha256: Object.fromEntries(["lib/matching.ts", "lib/figures.ts", "lib/keyword-match.ts", "lib/match-config.ts", "lib/story-recipe-runtime.ts", "config/story-recipes.json"].map((file) => [file, hash(readFileSync(resolve(ROOT, file)))])),
    },
    results,
    ...(hypothesisProbes ? { hypothesisProbes } : {}),
    droppedRequiredPositiveIndexesZeroBased: dropped,
    verdict: dropped.length > 0 ? "RED_EXPECTED_GOLD_DROPPED" : "GREEN_REQUIRED_POSITIVES_SURVIVE",
    networkAttempts,
    providerCalls: 0,
    databaseCalls: 0,
    envFilesLoaded: 0,
    publicationAuthority: false,
  }, null, 2));
  process.exitCode = dropped.length > 0 ? 1 : 0;
}

void main().catch((error: unknown) => {
  console.log(JSON.stringify({ diagnosticOnly: true, verdict: "INVALID_REPRO_INPUT_OR_RUNTIME", error: error instanceof Error ? error.message : "Unknown diagnostic error", publicationAuthority: false }, null, 2));
  process.exitCode = 2;
});
