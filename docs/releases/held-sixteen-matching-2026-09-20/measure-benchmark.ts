// Read-only deterministic shortlist diagnostic. Not a model eval or release gate.
import "../../../scripts/_smoke-bootstrap";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { FigureStageRow } from "../../../lib/types";

type Case = { id?: string; age: number; feeling: string; expect: string; accept?: string[]; hard?: boolean; semantic?: boolean };
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../../..");
const requireHere = createRequire(import.meta.url);
const json = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const hash = (path: string) => createHash("sha256").update(readFileSync(path)).digest("hex");
const mode = process.argv[2];
assert(process.argv.length === 3 && ["legacy-current", "legacy-overlay", "draft-baseline", "draft-proposal"].includes(mode!),
  "Usage: measure-benchmark.ts legacy-current|legacy-overlay|draft-baseline|draft-proposal");
const freeze = json(resolve(here, "label-freeze.json"));
assert.equal(freeze.kind, "review-only-matching-label-freeze-v1");
assert.equal(freeze.humanApproved, false);
for (const [file, expectedHash] of Object.entries(freeze.files)) {
  assert(["benchmark.json", "case-lineage.json", "BENCHMARK-RATIONALE.md"].includes(file));
  assert.equal(hash(resolve(here, file)), expectedHash, "Frozen labels changed: " + file);
}
const legacyPath = resolve(root, "evals/match.json");
assert.equal(hash(legacyPath), "f87962a57990f65a8765afdcd141bbdd1c3b9f5a965d04f4810f1787d8aa2a1e");
const catalogPath = resolve(root, "lib/figures-data.ts");
assert.equal(hash(catalogPath), "e88751de566fa1077059cee143c4bd9d88b55e8adcca48eab4d5fa49b04ddf88");
const configPath = resolve(root, "lib/match-config.ts");
const originalConfigHash = hash(configPath);
assert.equal(originalConfigHash, "af9421c7476a1e2afdd80b75c996aab7d533160be2a5f60054186b5d54202845");
const indexPath = resolve(here, "../held-sixteen-integration-2026-09-20/review-targets.json");
assert.equal(hash(indexPath), "b43c53652f8cf90b4dcf71f94cb84929af38275dd735bf488848bbba8fa714d0");
const proposals = new Map<string, FigureStageRow>();
for (const target of json(indexPath).targets) {
  const path = resolve(root, target.proposalPath);
  assert.equal(hash(path), target.proposalSha256);
  const stage: FigureStageRow = json(path);
  assert.equal(stage.figureKey, target.figureKey);
  proposals.set(stage.figureKey, stage);
}
assert.equal(proposals.size, 16);
const { FIGURE_STAGES } = requireHere("../../../lib/figures-data") as typeof import("../../../lib/figures-data");
const stages = mode === "legacy-current" ? FIGURE_STAGES : FIGURE_STAGES.map(stage => proposals.get(stage.figureKey) ?? stage);
const config = requireHere("../../../lib/match-config") as typeof import("../../../lib/match-config");
const routesPath = resolve(here, "keyword-routes.json");
assert(!requireHere.cache[requireHere.resolve("../../../lib/keyword-match")], "Parser compiled before proposal injection");
if (mode === "draft-proposal") {
  const routes = json(routesPath);
  assert.equal(routes.status, "review-only-not-installed");
  for (const [phrase, themes] of Object.entries(routes.additions)) {
    assert(!Object.hasOwn(config.STUB_KEYWORD_MAP, phrase));
    assert(Array.isArray(themes) && themes.every(theme => typeof theme === "string"));
    config.STUB_KEYWORD_MAP[phrase] = [...themes];
  }
  for (const [phrase, themes] of Object.entries(routes.extensions)) {
    const current = config.STUB_KEYWORD_MAP[phrase];
    assert(current && Array.isArray(themes) && themes.every(theme => typeof theme === "string" && !current.includes(theme)));
    config.STUB_KEYWORD_MAP[phrase] = [...current, ...themes];
  }
}
const { ageDistance } = requireHere("../../../lib/figures") as typeof import("../../../lib/figures");
const { selectRerankPool } = requireHere("../../../lib/matching") as typeof import("../../../lib/matching");
const { getMatchedThemeWeights, scoreAllByKeywordHybrid } = requireHere("../../../lib/keyword-match") as typeof import("../../../lib/keyword-match");
const corpusPath = mode!.startsWith("legacy-") ? legacyPath : resolve(here, "benchmark.json");
const cases: Case[] = json(corpusPath).cases;
const results = cases.map((entry, index) => {
  const input = { age: entry.age, feeling: entry.feeling };
  const eligible = stages.filter(stage => ageDistance(stage, entry.age) <= config.AGE_TOLERANCE_YEARS);
  const pool = eligible.length ? eligible : stages;
  const selected = selectRerankPool(input, pool);
  const expected = [entry.expect, ...entry.accept ?? []];
  const scores = scoreAllByKeywordHybrid(input, pool);
  const themes = Object.fromEntries(getMatchedThemeWeights(entry.feeling));
  const isMiss = entry.expect === "miss";
  return {
    id: entry.id ?? `legacy-${String(index).padStart(3, "0")}`, expect: entry.expect,
    hard: entry.hard === true, semantic: entry.semantic === true,
    semanticFlagStillHonest: entry.semantic !== true || Object.keys(themes).length === 0,
    survives: isMiss ? null : selected.some(stage => expected.includes(stage.figureKey)),
    targetRank: isMiss ? null : scores.findIndex(pick => expected.includes(pick.stage.figureKey)) + 1,
    themes, selected: selected.map(stage => stage.figureKey),
    framing: "unmeasured-no-provider",
  };
});
const summarize = (items: typeof results) => {
  const positives = items.filter(item => item.survives !== null);
  return {
    cases: items.length, positives: positives.length, missesUnmeasured: items.length - positives.length,
    survives: positives.filter(item => item.survives).length,
    failedIds: positives.filter(item => !item.survives).map(item => item.id),
  };
};
const failures = results.filter(item => item.survives === false);
const semanticViolations = results.filter(item => !item.semanticFlagStillHonest).map(item => item.id);
assert.equal(hash(configPath), originalConfigHash);
console.log(JSON.stringify({
  kind: "frozen-label-shortlist-diagnostic-v1", mode,
  corpusSha256: hash(corpusPath), labelFreezeSha256: hash(resolve(here, "label-freeze.json")),
  routesSha256: hash(routesPath),
  strata: {
    all: summarize(results), inherited: summarize(results.filter(item => item.id.startsWith("legacy-"))),
    new: summarize(results.filter(item => item.id.startsWith("new-"))), hard: summarize(results.filter(item => item.hard)),
    semantic: summarize(results.filter(item => item.semantic)),
  },
  semanticViolations, results,
  providerCalls: 0, databaseCalls: 0, providerTop1: null, missDetection: null,
  definitiveWrong: null, hardConfusion: null, trustGateEvaluated: false,
  legacyCoverageEquivalent: false, unresolvedLegacyChallenges: 33,
  currentRuntimeUnchanged: true, productionAuthority: false,
}, null, 2));
// Strict diagnostic, not the official gate. A known loss still exits red.
if (failures.length || semanticViolations.length) process.exitCode = 1;
