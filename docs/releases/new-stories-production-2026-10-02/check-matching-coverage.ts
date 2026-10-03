import "../../../scripts/_smoke-bootstrap";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { FIGURE_STAGES } from "../../../lib/figures-data";
import { ageDistance } from "../../../lib/figures";
import { scoreAllByKeywordHybrid } from "../../../lib/keyword-match";
import { AGE_TOLERANCE_YEARS, RERANK_TOP_K } from "../../../lib/match-config";
import { INTAKE_MIN_AGE, INTAKE_MAX_AGE } from "../../../lib/intake-constraints";
import type { FigureStageRow } from "../../../lib/types";

type GoldCase = {
  age: number;
  feeling: string;
  expect: string;
  accept?: string[];
  hard?: boolean;
  plausibleWrong?: string;
  confusionGroup?: string;
  semantic?: boolean;
};

const folder = resolve("docs/releases/new-stories-production-2026-10-02");
const writingFolder = resolve("docs/research/new-stories-2026-10-02");
const proposed = process.argv.includes("--proposed");
const candidateFolder = proposed ? resolve(folder, "proposed-stages") : writingFolder;
const read = (path: string): unknown => JSON.parse(readFileSync(path, "utf8"));
const sha256 = (path: string): string => createHash("sha256")
  .update(readFileSync(path)).digest("hex");
const stageFiles = readdirSync(candidateFolder).filter((file) => file.endsWith(".stage.json"));
const newStages = stageFiles.map((file) => read(resolve(candidateFolder, file)) as FigureStageRow);
if (newStages.length !== 10) throw new Error("Expected exactly ten new stages");
const newKeys = new Set(newStages.map((stage) => stage.figureKey));
const oldStages = FIGURE_STAGES.filter((stage) => !newKeys.has(stage.figureKey));
if (oldStages.length !== 50) throw new Error("Expected the unchanged original fifty stages");
const installedStages = [...oldStages, ...newStages];
const baseline = read(resolve(writingFolder, "WRITING-DB-BASELINE.json")) as {
  capturedAt: string;
  snapshot: { specs: { figure_key: string; stage_id: string; status: string }[] };
};
const publishedKeys = new Set(baseline.snapshot.specs
  .filter((spec) => spec.status === "published")
  .map((spec) => `${spec.figure_key}\u0000${spec.stage_id}`));
const productionStages = installedStages.filter((stage) =>
  newKeys.has(stage.figureKey) || publishedKeys.has(`${stage.figureKey}\u0000${stage.stageId}`));
if (productionStages.length !== 44) throw new Error("Expected a thirty-four plus ten prospective production catalog");
const baselineProductionStages = oldStages.filter((stage) =>
  publishedKeys.has(`${stage.figureKey}\u0000${stage.stageId}`));
if (baselineProductionStages.length !== 34) throw new Error("Expected the thirty-four published baseline stages");
const originalPath = resolve("evals/match.json");
const extensionPath = resolve(folder, "matching-extension.json");
const original = read(originalPath) as { cases: GoldCase[] };
const extension = read(extensionPath) as { cases: GoldCase[] };

function measure(cases: GoldCase[], catalog: FigureStageRow[]) {
  return cases.map((entry, index) => {
    const eligible = catalog.filter((stage) => ageDistance(stage, entry.age) <= AGE_TOLERANCE_YEARS);
    const pool = eligible.length > 0 ? eligible : catalog;
    const scores = scoreAllByKeywordHybrid(entry, pool);
    const shortlist = scores.slice(0, RERANK_TOP_K);
    const expected = [entry.expect, ...(entry.accept ?? [])];
    const expectedPresent = catalog.some((stage) => expected.includes(stage.figureKey));
    const expectedInAgePool = pool.some((stage) => expected.includes(stage.figureKey));
    const survived = entry.expect === "miss" || shortlist.some((score) => expected.includes(score.stage.figureKey));
    const validAdultIntake = Number.isInteger(entry.age) && entry.age >= INTAKE_MIN_AGE && entry.age <= INTAKE_MAX_AGE;
    return {
      index,
      age: entry.age,
      expect: entry.expect,
      hard: entry.hard === true,
      semantic: entry.semantic === true,
      validAdultIntake,
      expectedPresent,
      expectedInAgePool,
      survived,
      expectedRank: scores.findIndex((score) => expected.includes(score.stage.figureKey)) + 1 || null,
      shortlist: shortlist.map((score) => ({ key: score.stage.figureKey, keywordScore: score.keywordScore, agePenalty: score.agePenalty })),
      plausibleWrong: entry.plausibleWrong ?? null,
      wrongPresentInShortlist: entry.plausibleWrong ? shortlist.some((score) => score.stage.figureKey === entry.plausibleWrong) : null,
      confusionGroup: entry.confusionGroup ?? null,
    };
  });
}

function summary(rows: ReturnType<typeof measure>) {
  const positive = rows.filter((row) => row.expect !== "miss");
  const required = positive.filter((row) => !row.semantic);
  return {
    cases: rows.length,
    positives: positive.length,
    misses: rows.length - positive.length,
    nonSemanticRequired: required.length,
    nonSemanticSurvived: required.filter((row) => row.survived).length,
    absentExpected: positive.filter((row) => !row.expectedPresent).map((row) => row.index),
    lostRequired: required.filter((row) => !row.survived).map((row) => row.index),
    adultCases: rows.filter((row) => row.validAdultIntake).length,
    under18DiagnosticCases: rows.filter((row) => !row.validAdultIntake).length,
    hardCases: rows.filter((row) => row.hard).length,
  };
}

const originalInstalled = measure(original.cases, installedStages);
const originalBaselineProduction = measure(original.cases, baselineProductionStages);
const originalProduction = measure(original.cases, productionStages);
const extensionInstalled = measure(extension.cases, installedStages);
const extensionProduction = measure(extension.cases, productionStages);
const adultReachability = newStages.map((stage) => {
  const reachableAges: number[] = [];
  for (let age = INTAKE_MIN_AGE; age <= INTAKE_MAX_AGE; age += 1) {
    if (ageDistance(stage, age) <= AGE_TOLERANCE_YEARS) reachableAges.push(age);
  }
  return { key: stage.figureKey, historicalAgeMin: stage.ageMin, historicalAgeMax: stage.ageMax,
    firstEligibleAdultAge: reachableAges[0] ?? null,
    lastEligibleAdultAge: reachableAges.at(-1) ?? null,
    adultAgeEligible: reachableAges.length > 0 };
});
const receipt = {
  measuredAt: new Date().toISOString(),
  method: "No-network keyword shortlist diagnostic; no rerank, database reads/writes, publication or release authority. Prospective production membership comes from the captured writing baseline, not a fresh catalog audit.",
  baselineCapturedAt: baseline.capturedAt,
  rerankTopK: RERANK_TOP_K,
  ageTolerance: AGE_TOLERANCE_YEARS,
  proposed,
  hashes: { originalGold: sha256(originalPath), extension: sha256(extensionPath), stages: stageFiles.map((file) => ({ file, sha256: sha256(resolve(candidateFolder, file)) })) },
  catalog: { originalInstalled: oldStages.length, prospectiveInstalled: installedStages.length, publishedAtBaseline: publishedKeys.size, prospectiveProduction: productionStages.length },
  adultReachability,
  newlyLostOriginalProductionCases: originalProduction.filter((row) => !row.semantic && row.expect !== "miss" && !row.survived && originalBaselineProduction[row.index].survived).map((row) => row.index),
  summaries: { originalInstalled: summary(originalInstalled), originalBaselineProduction: summary(originalBaselineProduction), originalProduction: summary(originalProduction), extensionInstalled: summary(extensionInstalled), extensionProduction: summary(extensionProduction) },
  originalInstalled, originalBaselineProduction, originalProduction, extensionInstalled, extensionProduction,
};
writeFileSync(resolve(folder, proposed ? "matching-coverage-proposed.json" : "matching-coverage.json"), `${JSON.stringify(receipt, null, 2)}\n`);
console.log(JSON.stringify({ summaries: receipt.summaries, adultReachability }, null, 2));
