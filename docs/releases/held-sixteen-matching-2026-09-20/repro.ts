// Hermetic development diagnostic; not provider evidence or publication authority.
// It uses the real keyword parser/scorer/top-K selector with proposed catalog rows.
// Optional route additions exist only in this process, before the parser compiles.
import "../../../scripts/_smoke-bootstrap";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { FigureStageRow } from "../../../lib/types";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../../..");
const requireFromHere = createRequire(import.meta.url);
const json = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const hash = (path: string) => createHash("sha256").update(readFileSync(path)).digest("hex");
const args = process.argv.slice(2);
const value = (flag: string, fallback: string) => {
  const at = args.indexOf(flag);
  if (at < 0) return fallback;
  assert(args[at + 1] && !args[at + 1]!.startsWith("--"), flag + " needs a value");
  return args[at + 1]!;
};
for (let i = 0; i < args.length; i += 2) {
  assert(["--routes", "--case"].includes(args[i]!), "Unknown argument");
}
const routeMode = value("--routes", "baseline");
assert(["baseline", "proposal"].includes(routeMode));
const caseId = value("--case", "all");
const sourcePacket = resolve(here, "../held-sixteen-integration-2026-09-20");
const indexPath = resolve(sourcePacket, "review-targets.json");
assert.equal(hash(indexPath), "b43c53652f8cf90b4dcf71f94cb84929af38275dd735bf488848bbba8fa714d0");
const index = json(indexPath);
assert.equal(index.targets.length, 16);
const proposalMap = new Map<string, FigureStageRow>();
for (const target of index.targets) {
  const path = resolve(root, target.proposalPath);
  assert.equal(hash(path), target.proposalSha256);
  const stage = json(path) as FigureStageRow;
  assert.equal(stage.figureKey, target.figureKey);
  proposalMap.set(stage.figureKey, stage);
}
const { FIGURE_STAGES } = requireFromHere("../../../lib/figures-data") as typeof import("../../../lib/figures-data");
const overlay = FIGURE_STAGES.map(stage => proposalMap.get(stage.figureKey) ?? stage);
assert.equal(overlay.length, 50);
const config = requireFromHere("../../../lib/match-config") as typeof import("../../../lib/match-config");
const originalRoutes = structuredClone(config.STUB_KEYWORD_MAP);
// Refuse order-dependent results: the real parser must not already be compiled.
assert(!requireFromHere.cache[requireFromHere.resolve("../../../lib/keyword-match")]);
if (routeMode === "proposal") {
  const routes = json(resolve(here, "keyword-routes.json"));
  assert.equal(routes.kind, "keyword-route-proposal-v1");
  assert.equal(routes.status, "review-only-not-installed");
  for (const [phrase, themes] of Object.entries(routes.additions)) {
    assert(!Object.hasOwn(originalRoutes, phrase), "Addition would overwrite existing route: " + phrase);
    assert(Array.isArray(themes) && themes.length > 0 && themes.every(t => typeof t === "string"));
    config.STUB_KEYWORD_MAP[phrase] = [...themes];
  }
}
const { selectRerankPool } = requireFromHere("../../../lib/matching") as typeof import("../../../lib/matching");
const { ageDistance } = requireFromHere("../../../lib/figures") as typeof import("../../../lib/figures");
const { getMatchedThemeWeights, scoreAllByKeywordHybrid } = requireFromHere("../../../lib/keyword-match") as typeof import("../../../lib/keyword-match");
const probes = json(resolve(sourcePacket, "MATCHING-REVIEW-CASES.json")).positiveCases;
const selectedProbes = probes.filter((probe: { caseId: string }) => caseId === "all" || probe.caseId === caseId);
assert(selectedProbes.length > 0, "No diagnostic case selected");
const results = selectedProbes.map((probe: { caseId: string; age: number; input: string; proposedTarget: { figureKey: string; stageId: string } }) => {
  const input = { age: probe.age, feeling: probe.input };
  const eligible = overlay.filter(stage => ageDistance(stage, input.age) <= config.AGE_TOLERANCE_YEARS);
  const pool = eligible.length ? eligible : overlay;
  const selected = selectRerankPool(input, pool);
  const scores = scoreAllByKeywordHybrid(input, pool);
  const targetRank = scores.findIndex(pick => pick.stage.figureKey === probe.proposedTarget.figureKey) + 1;
  return {
    caseId: probe.caseId, target: probe.proposedTarget.figureKey,
    survives: selected.some(stage => stage.figureKey === probe.proposedTarget.figureKey && stage.stageId === probe.proposedTarget.stageId),
    targetRank, themes: Object.fromEntries(getMatchedThemeWeights(input.feeling)),
    selected: selected.map(stage => stage.figureKey),
  };
});
const failures = results.filter((result: { survives: boolean }) => !result.survives);
console.log(JSON.stringify({
  kind: "synthetic-retrieval-development-check", routeMode, cases: results.length,
  failures: failures.map((r: { target: string }) => r.target), results,
  baselineRoutesUnchangedOnDisk: true, installed: false,
  providerCalls: 0, databaseCalls: 0, realRerankEvidence: false,
}, null, 2));
// A successful CLI invocation must prove target survival, not merely print JSON.
if (failures.length > 0) process.exitCode = 1;
