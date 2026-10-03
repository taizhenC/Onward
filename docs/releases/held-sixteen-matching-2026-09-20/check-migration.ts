// Review-packet integrity only. No environment loading, providers, database,
// matching execution, writes, or production authority. Run from the repository:
// node --import tsx docs/releases/held-sixteen-matching-2026-09-20/check-migration.ts
// --self-test additionally rejects in-memory anti-tamper fixtures; no file edits.
import "../../../scripts/_smoke-bootstrap";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { FIGURE_STAGES } from "../../../lib/figures-data";

const PACKET = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(PACKET, "../../..");
const ORIGINAL = resolve(PACKET, "../held-sixteen-integration-2026-09-20");
const KEYS = ["berlin_i", "carver", "christie", "coltrane", "lamarr", "lee", "lewis_e", "lindgren",
  "mcclintock", "owens", "poitier", "rachmaninoff", "rogers", "rudolph", "rustin", "wang"];
const PRIMARY = "keyword-rerank-figure-library-50-2026-07-02";
const LABEL_FREEZE_SHA256 = "7c89510d4c45b759e018977c2469677e5698d95b01933c283fb1044edd2be08d";
const FROZEN_LABEL_FILES = {
  "benchmark.json": "a57e29ed47821270118319e80a7fdd4ae02ca72191300b6a4a3d0d9de73be54c",
  "case-lineage.json": "34c09c9025d797cb3517c0e353e0116d4596ea5ee49ac69757057bf3c3f8ee97",
  "BENCHMARK-RATIONALE.md": "f63bbf5f271000504c29b887c03e3c20fc219d940fefb8df3e10af5a757d8a21",
};
const PINS: Record<string, string> = {
  "evals/match.json": "f87962a57990f65a8765afdcd141bbdd1c3b9f5a965d04f4810f1787d8aa2a1e",
  "lib/figures-data.ts": "e88751de566fa1077059cee143c4bd9d88b55e8adcca48eab4d5fa49b04ddf88",
  "lib/match-config.ts": "af9421c7476a1e2afdd80b75c996aab7d533160be2a5f60054186b5d54202845",
  "lib/match-recipe-constants.ts": "4b7ae64c268663bf5658ce7aff3b69258b9f072a649a0eaded00a383d0a4d0a7",
  "lib/keyword-match.ts": "c0ec4c0643da2ba9912a78ce94c47c84fe1133bf307d70a54c6bddda64b1003e",
  "lib/matching.ts": "8ba563cf11d124caf6fe7d41a69e6335913ec02c2fd6e6c22e364b15836278ba",
  "lib/themes.ts": "d8f5171a75140f891e72a1950d3a42114ccbe2f38f19ce92a3da409868f017b7",
  "lib/figures.ts": "9501db49d0ac873148dcc9bcad190a8d99a431f7562bc059de3d75a72b319b42",
  "config/story-recipes.json": "4fd08d8018ebcc54ca1b71ac87b4a6cd533dfccf95e1243ab222cfce6a0ce9f6",
  "config/figure-library-releases.json": "1031a5e1b8782a8ce01dcf5b5d6c612969fb9ff1bc803de863c02fa7ed90fbaa",
  "docs/releases/held-sixteen-integration-2026-09-20/review-targets.json":
    "b43c53652f8cf90b4dcf71f94cb84929af38275dd735bf488848bbba8fa714d0",
};
type ObjectValue = Record<string, unknown>;
const readHashes = new Map<string, string>();
function hash(bytes: string | Buffer): string { return createHash("sha256").update(bytes).digest("hex"); }
function read(path: string): string {
  const bytes = readFileSync(path);
  readHashes.set(path, hash(bytes));
  return bytes.toString("utf8");
}
function json(path: string): unknown { return JSON.parse(read(path)); }
function object(value: unknown, label: string): asserts value is ObjectValue {
  assert(typeof value === "object" && value !== null && !Array.isArray(value), label);
}
function text(value: unknown, label: string): asserts value is string {
  assert(typeof value === "string" && value.trim().length > 0, label);
}
function array(value: unknown, label: string): asserts value is unknown[] { assert(Array.isArray(value), label); }
function keys(value: ObjectValue, required: string[], optional: string[] = []): void {
  assert(required.every(key => Object.hasOwn(value, key)), "Missing fields: " + required.join(", "));
  assert(Object.keys(value).every(key => required.includes(key) || optional.includes(key)), "Unexpected fields");
}
function strings(value: unknown, label: string, minimum = 0): asserts value is string[] {
  array(value, label);
  assert(value.length >= minimum && value.every(item => typeof item === "string" && item.trim()), label);
  assert.equal(new Set(value).size, value.length, label + " duplicates");
}
function confined(path: unknown, boundary: string): string {
  text(path, "File path");
  const result = resolve(REPO, path);
  const rel = relative(boundary, result);
  assert(!isAbsolute(rel) && rel !== ".." && !rel.startsWith(".." + sep), "Target outside packet");
  return result;
}
function initializer(file: string, name: string): ts.Expression {
  const path = resolve(REPO, file);
  const source = ts.createSourceFile(path, read(path), ts.ScriptTarget.ES2022, true);
  const matches: ts.Expression[] = [];
  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.name.text === name && declaration.initializer) {
        matches.push(declaration.initializer);
      }
    }
  }
  assert.equal(matches.length, 1, "Expected one literal declaration: " + name);
  let value = matches[0]!;
  if (ts.isAsExpression(value)) value = value.expression;
  return value;
}
function literalStrings(value: ts.Expression): string[] {
  assert(ts.isArrayLiteralExpression(value));
  return value.elements.map(item => { assert(ts.isStringLiteral(item)); return item.text; });
}
function propertyName(name: ts.PropertyName): string {
  assert(ts.isIdentifier(name) || ts.isStringLiteral(name));
  return name.text;
}
function except(value: ObjectValue, excluded: string[]): ObjectValue {
  return Object.fromEntries(Object.entries(value).filter(([key]) => !excluded.includes(key)));
}
function changedFields(before: ObjectValue, after: ObjectValue): string[] {
  return [...new Set([...Object.keys(before), ...Object.keys(after)])]
    .filter(key => JSON.stringify(before[key]) !== JSON.stringify(after[key])).sort();
}

type Inputs = { benchmark: unknown; lineage: unknown; routes: unknown; freeze: unknown };
type Context = {
  legacy: ObjectValue[];
  proposals: Map<string, { path: string; stage: ObjectValue }>;
  vocabulary: string[];
  installedRoutes: Map<string, string[]>;
  figureKeys: Set<string>;
};
function validate(inputs: Inputs, context: Context) {
  const { benchmark, lineage, routes, freeze } = inputs;
  object(freeze, "Required label freeze");
  keys(freeze, ["kind", "version", "status", "frozenBeforeFirstMeasurement", "humanApproved", "files", "qualification"]);
  assert.equal(freeze.kind, "review-only-matching-label-freeze-v1");
  assert.equal(freeze.version, "held-sixteen-coverage-migration-v1");
  assert.equal(freeze.status, "draft-unapproved");
  assert.equal(freeze.frozenBeforeFirstMeasurement, true);
  assert.equal(freeze.humanApproved, false);
  assert.deepEqual(freeze.files, FROZEN_LABEL_FILES, "Exact premeasurement label pins required");
  text(freeze.qualification, "Freeze scope qualification");
  object(benchmark, "Benchmark object");
  keys(benchmark, ["schemaVersion", "draftVersion", "status", "authorship", "readme", "cases"]);
  assert.equal(benchmark.schemaVersion, 1);
  assert.equal(benchmark.draftVersion, "held-sixteen-coverage-migration-v1");
  assert.equal(benchmark.status, "draft-unapproved-label-freeze");
  object(benchmark.authorship, "Benchmark authorship");
  keys(benchmark.authorship, ["method", "matcherResultsSeen", "humanApproved", "providerEvaluated"]);
  assert.equal(benchmark.authorship.method,
    "Independent source-led labels authored before inspecting matcher outputs for this migration.");
  assert.equal(benchmark.authorship.matcherResultsSeen, false);
  assert.equal(benchmark.authorship.humanApproved, false);
  assert.equal(benchmark.authorship.providerEvaluated, false);
  text(benchmark.readme, "Benchmark qualifications");
  array(benchmark.cases, "Benchmark cases");
  const cases = new Map<string, ObjectValue>();
  for (const item of benchmark.cases) {
    object(item, "Benchmark case");
    keys(item, ["id", "age", "feeling", "expect"], ["note", "hard", "plausibleWrong", "confusionGroup", "semantic"]);
    text(item.id, "Case id");
    assert(/^[a-z0-9][a-z0-9_-]*$/.test(item.id), "Stable case id");
    assert(!cases.has(item.id), "Duplicate case id");
    assert(Number.isInteger(item.age) && Number(item.age) >= 0 && Number(item.age) <= 120, "Case age");
    text(item.feeling, "Case synthetic feeling");
    text(item.expect, "Case expected figure");
    assert(item.expect === "miss" || context.figureKeys.has(item.expect), "Unknown expected figure");
    for (const key of ["note", "plausibleWrong", "confusionGroup"]) {
      if (Object.hasOwn(item, key)) text(item[key], "Case " + key);
    }
    for (const key of ["hard", "semantic"]) {
      if (Object.hasOwn(item, key)) assert.equal(item[key], true, "Case flags must be true or omitted");
    }
    if (item.hard === true) {
      assert(typeof item.plausibleWrong === "string" && context.figureKeys.has(item.plausibleWrong));
      assert.notEqual(item.expect, item.plausibleWrong);
      text(item.confusionGroup, "Hard case confusion group");
    } else {
      assert(!Object.hasOwn(item, "plausibleWrong") && !Object.hasOwn(item, "confusionGroup"), "Orphan hard-case fields");
    }
    cases.set(item.id, item);
  }
  object(lineage, "Lineage object");
  keys(lineage, ["schemaVersion", "draftVersion", "status", "authorship", "legacy", "counts", "entries", "newCases",
    "supplementalChallenges", "reviewDecisionsRequired"]);
  assert.equal(lineage.schemaVersion, 1);
  assert.equal(lineage.draftVersion, benchmark.draftVersion);
  assert.equal(lineage.status, "draft-unapproved");
  object(lineage.authorship, "Lineage authorship");
  assert.deepEqual(lineage.authorship, { matcherResultsSeen: false, humanApproved: false, providerEvaluated: false });
  strings(lineage.reviewDecisionsRequired, "Unresolved editorial decisions", 1);
  object(lineage.legacy, "Legacy metadata");
  keys(lineage.legacy, ["path", "sha256", "caseCount", "objectDigestEncoding"]);
  assert.equal(lineage.legacy.path, "evals/match.json");
  assert.equal(lineage.legacy.sha256, PINS["evals/match.json"]);
  assert.equal(lineage.legacy.caseCount, 104);
  assert.equal(lineage.legacy.objectDigestEncoding, "SHA256 UTF-8 JSON.stringify(original parsed object)");
  assert.equal(context.legacy.length, 104);
  array(lineage.entries, "Lineage entries");
  assert.equal(lineage.entries.length, 104, "Every original case requires a disposition");
  const seenIndices = new Set<number>();
  const mappedCases = new Set<string>();
  const challenges = new Set<string>();
  const dispositions: Record<string, number> = {};
  const changes: Array<{ originalIndex: number; disposition: string; changedFields: string[] }> = [];
  function challenge(value: unknown, original?: ObjectValue): void {
    object(value, "Unscored challenge");
    keys(value, ["id", "age", "feeling", "retiredFigure", "assertions", "scoring"]);
    text(value.id, "Challenge id");
    assert(!challenges.has(value.id) && !cases.has(value.id), "Challenge must not be silently scored");
    challenges.add(value.id);
    assert(Number.isInteger(value.age) && Number(value.age) >= 0 && Number(value.age) <= 120);
    text(value.feeling, "Challenge synthetic feeling");
    assert(![...cases.values()].some(item => item.age === value.age && item.feeling === value.feeling),
      "An unscored challenge input cannot be relabeled into the scored benchmark");
    assert(typeof value.retiredFigure === "string" && KEYS.includes(value.retiredFigure), "Challenge retired figure");
    strings(value.assertions, "Challenge editorial assertions", 1);
    assert.equal(value.scoring, "unscored-editorial-decision-required");
    if (original) {
      assert.equal(value.age, original.age, "Challenge must preserve original age");
      assert.equal(value.feeling, original.feeling, "Challenge must preserve original text");
      assert.equal(value.retiredFigure, original.expect, "Challenge must identify former expected figure");
    }
  }
  for (const entry of lineage.entries) {
    object(entry, "Lineage entry");
    keys(entry, ["originalIndex", "originalCaseSha256", "originalCase", "disposition", "newCaseIds", "reason"],
      ["challenge", "changedFields"]);
    assert(Number.isInteger(entry.originalIndex) && Number(entry.originalIndex) >= 0 && Number(entry.originalIndex) < 104);
    const index = Number(entry.originalIndex);
    assert(!seenIndices.has(index), "Duplicate original index");
    seenIndices.add(index);
    const original = context.legacy[index]!;
    assert.deepEqual(entry.originalCase, original, "Original case object changed: " + index);
    assert.equal(entry.originalCaseSha256, hash(JSON.stringify(original)), "Original object hash: " + index);
    text(entry.reason, "Disposition rationale");
    strings(entry.newCaseIds, "Mapped case ids");
    text(entry.disposition, "Disposition");
    dispositions[entry.disposition] = (dispositions[entry.disposition] ?? 0) + 1;
    if (entry.disposition === "historical-premise-challenge") {
      assert.deepEqual(entry.newCaseIds, [], "An unresolved premise cannot enter the scored denominator");
      assert.notEqual(original.expect, "miss", "Original miss case cannot be retired as a historical premise");
      challenge(entry.challenge, original);
      if (Object.hasOwn(entry, "changedFields")) assert.deepEqual(entry.changedFields, [], "Original input bytes unchanged");
      continue;
    }
    assert(!Object.hasOwn(entry, "challenge"), "Scored case cannot also be a retired challenge");
    assert.equal(entry.newCaseIds.length, 1, "One reviewed successor for a retained case");
    const id = entry.newCaseIds[0]!;
    assert(!mappedCases.has(id), "Benchmark case mapped twice");
    mappedCases.add(id);
    const item = cases.get(id);
    assert(item, "Mapped benchmark case missing");
    const successor = except(item, ["id"]);
    let changed: string[];
    switch (entry.disposition) {
      case "carried-unchanged":
        assert.deepEqual(successor, original, "Carried case changed");
        changed = [];
        break;
      case "positive-retained-hardness-retired":
        assert.equal(original.hard, true, "Only an existing hard case can retire its hardness");
        assert.notEqual(original.expect, "miss");
        assert(typeof original.plausibleWrong === "string" && KEYS.includes(original.plausibleWrong),
          "Only a replaced episode can retire its old hard-decoy premise");
        assert.deepEqual(except(successor, ["note"]), except(original, ["hard", "plausibleWrong", "confusionGroup", "note"]),
          "Hardness retirement changed inputs/label");
        for (const key of ["hard", "plausibleWrong", "confusionGroup"]) assert(!Object.hasOwn(successor, key));
        changed = changedFields(original, successor);
        break;
      case "positive-retained-rationale-revised":
        assert.notEqual(original.expect, "miss");
        assert.deepEqual(except(successor, ["note"]), except(original, ["note"]), "Rationale revision changed inputs/label/hardness");
        assert.notEqual(successor.note, original.note, "Rationale revision must actually revise its note");
        changed = changedFields(original, successor);
        break;
      default: assert.fail("Unknown disposition: " + entry.disposition);
    }
    if (Object.hasOwn(entry, "changedFields")) {
      strings(entry.changedFields, "Declared changed fields");
      assert.deepEqual([...entry.changedFields].sort(), changed);
    }
    changes.push({ originalIndex: index, disposition: entry.disposition, changedFields: changed });
  }
  assert.equal(seenIndices.size, 104);
  array(lineage.newCases, "New case lineage");
  const inheritedCases = [...mappedCases].map(id => cases.get(id)!);
  const newCases: ObjectValue[] = [];
  const positives: Record<string, number> = Object.fromEntries(KEYS.map(key => [key, 0]));
  let addedMisses = 0;
  for (const addition of lineage.newCases) {
    object(addition, "New case rationale");
    keys(addition, ["id", "expect", "sourceProposalPath", "rationale", "kind"], ["ageQualification"]);
    text(addition.id, "New case id");
    assert(!mappedCases.has(addition.id), "New case duplicates a mapped case");
    mappedCases.add(addition.id);
    const item = cases.get(addition.id);
    assert(item, "New case not in benchmark");
    newCases.push(item);
    assert.equal(addition.expect, item.expect);
    text(addition.rationale, "New case source-led rationale");
    if (Object.hasOwn(addition, "ageQualification")) text(addition.ageQualification, "Reader-age qualification");
    if (addition.kind === "source-led-positive") {
      assert(typeof item.expect === "string" && KEYS.includes(item.expect), "New positive scope");
      assert.equal(addition.sourceProposalPath, context.proposals.get(item.expect)!.path);
      positives[item.expect]! += 1;
    } else {
      assert.equal(addition.kind, "supported-miss");
      assert.equal(item.expect, "miss");
      assert.equal(addition.sourceProposalPath, null, "No source episode is asserted for a miss");
      addedMisses += 1;
    }
  }
  assert.deepEqual([...mappedCases].sort(), [...cases.keys()].sort(), "Every scored case requires exactly one lineage record");
  for (const key of KEYS) assert(positives[key]! >= 2, "At least two independently authored new positives required: " + key);
  const originalMisses = context.legacy.filter(item => item.expect === "miss").length;
  assert.equal(originalMisses, 3);
  array(lineage.supplementalChallenges, "Supplemental challenges");
  assert.deepEqual(lineage.supplementalChallenges,
    lineage.entries.filter(entry => { object(entry, "Lineage entry"); return Object.hasOwn(entry, "challenge"); })
      .map(entry => { object(entry, "Lineage entry"); return entry.challenge; }),
    "Supplemental challenge index must be an exact ordered projection, not additional or relabeled cases");
  object(lineage.counts, "Lineage count claims");
  assert.deepEqual(lineage.counts, { scored: cases.size,
    inheritedScored: 104 - (dispositions["historical-premise-challenge"] ?? 0),
    newScored: lineage.newCases.length,
    unscoredLegacyChallenges: challenges.size, dispositions }, "Lineage denominator/count claims differ from actual data");
  object(routes, "Keyword route proposal");
  keys(routes, ["kind", "status", "additions", "extensions"]);
  assert.equal(routes.kind, "keyword-route-proposal-v1");
  assert.equal(routes.status, "review-only-not-installed");
  object(routes.additions, "Route additions");
  object(routes.extensions, "Route theme extensions");
  for (const [phrase, themes, extension] of [
    ...Object.entries(routes.additions).map(([phrase, themes]) => [phrase, themes, false] as const),
    ...Object.entries(routes.extensions).map(([phrase, themes]) => [phrase, themes, true] as const),
  ]) {
    assert(phrase.length >= 3 && phrase.length <= 100 && phrase === phrase.toLowerCase().trim(), "Route must be ordinary lowercase text");
    assert(!/[0-9]/.test(phrase), "No fixture age/count routing");
    if (extension) assert(context.installedRoutes.has(phrase), "Theme extension requires an existing route");
    else assert(!context.installedRoutes.has(phrase), "Additions must not replace existing routes");
    strings(themes, "Controlled route themes", 1);
    assert(themes.every(theme => context.vocabulary.includes(theme)), "Uncontrolled route theme");
    if (extension) assert(themes.every(theme => !context.installedRoutes.get(phrase)!.includes(theme)),
      "Extensions must add themes, never repeat or replace old mappings");
    for (const figure of FIGURE_STAGES) {
      // `child` is also an ordinary parenting noun; do not ban childcare input
      // because Julia Child's key happens to use it. Her full name stays banned.
      const names = [figure.displayName.toLowerCase()];
      if (figure.figureKey !== "child") names.push(figure.figureKey.replaceAll("_", " "));
      for (const name of names) {
        const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        assert(!new RegExp("(?:^|[^a-z])" + escaped + "(?:$|[^a-z])", "i").test(phrase),
          "No figure-name routing: " + phrase + " / " + name);
      }
    }
  }
  const strata = (items: ObjectValue[]) => ({ cases: items.length,
    positives: items.filter(item => item.expect !== "miss").length,
    misses: items.filter(item => item.expect === "miss").length,
    hard: items.filter(item => item.hard === true).length,
    semantic: items.filter(item => item.semantic === true).length });
  return { benchmarkCases: cases.size, originalCasesPreserved: seenIndices.size, dispositions,
    changedLegacyFields: changes.filter(item => item.changedFields.length > 0),
    originalMissesPreserved: originalMisses, newPositivesPerFigure: positives, addedMisses,
    coverageStrata: { immutableLegacy: strata(context.legacy), inheritedScored: strata(inheritedCases),
      newlyAuthoredScored: strata(newCases), prospectiveScored: strata([...cases.values()]) },
    coverageEquivalentToLegacy: false, unresolvedCoverageBlocksPromotion: challenges.size > 0,
    unscoredChallenges: challenges.size, routeAdditions: Object.keys(routes.additions).length,
    routeThemeExtensions: Object.keys(routes.extensions).length };
}

function main(): void {
  const args = process.argv.slice(2);
  assert(args.every(arg => arg === "--self-test") && args.length <= 1, "Only --self-test is supported");
  for (const [path, expected] of Object.entries(PINS)) {
    assert.equal(hash(readFileSync(resolve(REPO, path))), expected, "Protected bytes changed: " + path);
  }
  const freezePath = resolve(PACKET, "label-freeze.json");
  assert.equal(hash(readFileSync(freezePath)), LABEL_FREEZE_SHA256, "Committed premeasurement freeze changed");
  for (const [name, expected] of Object.entries(FROZEN_LABEL_FILES)) {
    assert.equal(hash(read(resolve(PACKET, name))), expected, "Frozen label input changed: " + name);
  }
  const originalIndex = json(resolve(ORIGINAL, "review-targets.json"));
  object(originalIndex, "Original reviewed proposal index");
  assert.equal(originalIndex.kind, "held-sixteen-integration-review-v1");
  assert.equal(originalIndex.status, "draft-review-only");
  assert.equal(originalIndex.servingChanges, false);
  array(originalIndex.targets, "Original targets");
  assert.equal(originalIndex.targets.length, 16);
  const proposals: Context["proposals"] = new Map();
  const artifactPaths = new Set<string>();
  for (const target of originalIndex.targets) {
    object(target, "Original target");
    text(target.figureKey, "Original figure key");
    assert(KEYS.includes(target.figureKey) && !proposals.has(target.figureKey));
    const candidatePath = confined(target.path, ORIGINAL);
    const proposalPath = confined(target.proposalPath, ORIGINAL);
    for (const [path, expected] of [[candidatePath, target.sha256], [proposalPath, target.proposalSha256]]) {
      assert(typeof path === "string" && !artifactPaths.has(path), "Unique source artifact path");
      artifactPaths.add(path);
      assert.equal(hash(readFileSync(path)), expected, "Reviewed artifact changed: " + relative(REPO, path));
    }
    const candidate = json(candidatePath);
    const stage = json(proposalPath);
    object(candidate, "Candidate"); object(stage, "Proposal");
    assert.equal(candidate.figureKey, target.figureKey);
    assert.equal(stage.figureKey, target.figureKey);
    assert.equal(candidate.stageId, stage.stageId);
    assert.equal(candidate.storySpecId, target.storySpecId);
    assert.equal(candidate.status, "draft");
    assert.deepEqual(candidate.review, {});
    object(candidate.episode, "Candidate episode");
    assert.equal(candidate.episode.ageMin, stage.ageMin);
    assert.equal(candidate.episode.ageMax, stage.ageMax);
    array(candidate.arc, "Candidate arc"); array(stage.beats, "Proposal beats");
    assert.equal(candidate.arc.length, 7); assert.equal(stage.beats.length, 7);
    const beats = stage.beats;
    candidate.arc.forEach((beat, index) => {
      object(beat, "Candidate beat"); object(beats[index], "Proposal beat");
      assert.equal(beat.role, beats[index].role);
      assert.equal(beat.canonicalText, beats[index].text);
    });
    assert(typeof target.proposalPath === "string");
    proposals.set(target.figureKey, { path: target.proposalPath, stage });
  }
  assert.equal(artifactPaths.size, 32);
  assert.deepEqual([...proposals.keys()].sort(), [...KEYS].sort());
  const before = structuredClone(FIGURE_STAGES);
  const overlay = FIGURE_STAGES.map(stage => structuredClone(proposals.get(stage.figureKey)?.stage ?? stage));
  assert.equal(overlay.length, 50);
  assert.equal(new Set(overlay.map(stage => stage.figureKey)).size, 50);
  assert.equal(new Set(overlay.map(stage => stage.figureKey + ":" + stage.stageId)).size, 50);
  let untouched = 0;
  FIGURE_STAGES.forEach((stage, index) => {
    if (!proposals.has(stage.figureKey)) { assert.deepEqual(overlay[index], stage); untouched += 1; }
  });
  assert.equal(untouched, 34);
  assert.deepEqual(FIGURE_STAGES, before);
  const registry = json(resolve(REPO, "config/story-recipes.json"));
  object(registry, "Recipe registry"); object(registry.selection, "Recipe selection");
  assert.equal(registry.selection.primaryRecipeId, PRIMARY);
  assert.equal(registry.selection.rollbackRecipeId, PRIMARY);
  const thresholdExpression = initializer("lib/match-recipe-constants.ts", "RERANK_TRUST_GATE");
  assert(ts.isObjectLiteralExpression(thresholdExpression));
  const thresholds = Object.fromEntries(thresholdExpression.properties.map(property => {
    assert(ts.isPropertyAssignment(property) && ts.isNumericLiteral(property.initializer));
    return [propertyName(property.name), Number(property.initializer.text)];
  }));
  assert.deepEqual(thresholds, { minCoverage: 0.95, minRerankTop1: 0.971, minOverallTop1: 0.971,
    minMissDetection: 1, maxDefinitiveWrong: 0, maxHardConfusion: 0 });
  const tolerance = initializer("lib/match-config.ts", "AGE_TOLERANCE_YEARS");
  assert(ts.isNumericLiteral(tolerance) && Number(tolerance.text) === 10);
  const keywordExpression = initializer("lib/match-config.ts", "STUB_KEYWORD_MAP");
  assert(ts.isObjectLiteralExpression(keywordExpression));
  const installedRoutes = new Map(keywordExpression.properties.map(property => {
    assert(ts.isPropertyAssignment(property));
    return [propertyName(property.name), literalStrings(property.initializer)] as const;
  }));
  const legacy = json(resolve(REPO, "evals/match.json"));
  object(legacy, "Legacy dataset"); array(legacy.cases, "Legacy cases");
  legacy.cases.forEach(item => object(item, "Legacy case"));
  const context: Context = { legacy: legacy.cases as ObjectValue[], proposals, installedRoutes,
    vocabulary: literalStrings(initializer("lib/themes.ts", "THEME_VOCABULARY")),
    figureKeys: new Set(FIGURE_STAGES.map(stage => stage.figureKey)) };
  const inputs: Inputs = { benchmark: json(resolve(PACKET, "benchmark.json")),
    lineage: json(resolve(PACKET, "case-lineage.json")), routes: json(resolve(PACKET, "keyword-routes.json")),
    freeze: json(freezePath) };
  const result = validate(inputs, context);
  let antiTamperRejected = 0;
  if (args.includes("--self-test")) {
    // Fixtures are cloned only in memory. Never mutate the frozen files.
    const mutations: Array<[string, (fixture: Inputs) => void]> = [
      ["freeze claims human approval", fixture => { (fixture.freeze as ObjectValue).humanApproved = true; }],
      ["freeze follows measurement", fixture => { (fixture.freeze as ObjectValue).frozenBeforeFirstMeasurement = false; }],
      ["freeze target hash changed", fixture => {
        ((fixture.freeze as ObjectValue).files as ObjectValue)["benchmark.json"] = "0".repeat(64);
      }],
      ["freeze admits another file", fixture => {
        ((fixture.freeze as ObjectValue).files as ObjectValue)["unreviewed.json"] = "0".repeat(64);
      }],
      ["benchmark claims approval", fixture => { (fixture.benchmark as ObjectValue).status = "approved"; }],
      ["author saw matcher output", fixture => { ((fixture.benchmark as ObjectValue).authorship as ObjectValue).matcherResultsSeen = true; }],
      ["duplicate scored case", fixture => {
        const rows = (fixture.benchmark as ObjectValue).cases as ObjectValue[]; rows.push(structuredClone(rows[0]!));
      }],
      ["original object altered", fixture => {
        const rows = (fixture.lineage as ObjectValue).entries as ObjectValue[];
        (rows[0]!.originalCase as ObjectValue).age = 99;
      }],
      ["original hash altered", fixture => {
        ((fixture.lineage as ObjectValue).entries as ObjectValue[])[0]!.originalCaseSha256 = "0".repeat(64);
      }],
      ["original case omitted", fixture => { ((fixture.lineage as ObjectValue).entries as ObjectValue[]).pop(); }],
      ["unscored challenge relabeled as miss", fixture => {
        const entries = (fixture.lineage as ObjectValue).entries as ObjectValue[];
        const unresolved = entries.find(row => row.disposition === "historical-premise-challenge")!.challenge as ObjectValue;
        const rows = (fixture.benchmark as ObjectValue).cases as ObjectValue[];
        rows.push({ id: "relabeled-challenge-fixture", age: unresolved.age, feeling: unresolved.feeling, expect: "miss" });
      }],
      ["challenge claims benchmark score", fixture => {
        const entries = (fixture.lineage as ObjectValue).entries as ObjectValue[];
        (entries.find(row => row.disposition === "historical-premise-challenge")!.challenge as ObjectValue).scoring = "scored-as-miss";
      }],
      ["unmapped benchmark case", fixture => {
        const rows = (fixture.benchmark as ObjectValue).cases as ObjectValue[];
        rows.push({ ...structuredClone(rows[0]!), id: "unmapped-fixture" });
      }],
      ["new source lineage altered", fixture => {
        const rows = (fixture.lineage as ObjectValue).newCases as ObjectValue[];
        rows.find(row => row.kind === "source-led-positive")!.sourceProposalPath = "evals/match.json";
      }],
      ["uncontrolled route theme", fixture => {
        ((fixture.routes as ObjectValue).additions as ObjectValue)["uncontrolled synthetic fixture"] = ["made_up_theme"];
      }],
      ["existing route replaced", fixture => {
        ((fixture.routes as ObjectValue).additions as ObjectValue)[[...installedRoutes.keys()][0]!] = [context.vocabulary[0]!];
      }],
      ["age-targeted route", fixture => {
        ((fixture.routes as ObjectValue).additions as ObjectValue)["test at 41 years"] = [context.vocabulary[0]!];
      }],
      ["figure-name route", fixture => {
        ((fixture.routes as ObjectValue).additions as ObjectValue)["fred rogers"] = [context.vocabulary[0]!];
      }],
      ["route claims installation", fixture => { (fixture.routes as ObjectValue).status = "installed"; }],
      ["extension repeats installed theme", fixture => {
        const [phrase, themes] = [...installedRoutes.entries()][0]!;
        ((fixture.routes as ObjectValue).extensions as ObjectValue)[phrase] = [themes[0]!];
      }],
      ["extension invents source route", fixture => {
        ((fixture.routes as ObjectValue).extensions as ObjectValue)["unknown synthetic fixture"] = [context.vocabulary[0]!];
      }],
    ];
    for (const [label, mutate] of mutations) {
      const fixture = structuredClone(inputs);
      mutate(fixture);
      assert.throws(() => validate(fixture, context), "Anti-tamper fixture accepted: " + label);
      antiTamperRejected += 1;
    }
  }
  for (const [path, expected] of readHashes) assert.equal(hash(readFileSync(path)), expected, "Input changed during check");
  for (const [path, expected] of Object.entries(PINS)) assert.equal(hash(readFileSync(resolve(REPO, path))), expected);
  console.log(JSON.stringify({ kind: "held-sixteen-matching-review-integrity-check", passed: true,
    authority: "REVIEW_ONLY_NOT_PRODUCTION_EVIDENCE", benchmarkHumanApproval: null,
    requiredPremeasurementLabelFreezeSha256: LABEL_FREEZE_SHA256, frozenLabelFiles: FROZEN_LABEL_FILES,
    originalProtectedFiles: PINS, reviewedArtifactsChecked: artifactPaths.size,
    overlayRows: overlay.length, proposedRows: proposals.size, untouchedRows: untouched,
    primaryRecipeUnchanged: PRIMARY, trustThresholdsUnchanged: thresholds, hardAgeToleranceUnchanged: 10,
    ...result, antiTamperRejected,
    packetSha256: Object.fromEntries(["benchmark.json", "case-lineage.json", "keyword-routes.json"]
      .map(name => [name, readHashes.get(resolve(PACKET, name))])),
    matchingExecuted: false, providerCalls: 0, productionWrites: false, environmentLoaded: false,
    releaseReady: false,
    qualification: "Integrity and coverage-accounting assertions only. Unscored historical-premise challenges are explicitly outside the new denominator; they remain mandatory loss-of-coverage review items. No real rerank, production readiness, benchmark approval, or release authority is established.",
  }, null, 2));
}

try { main(); }
catch (error) {
  console.error(JSON.stringify({ kind: "held-sixteen-matching-review-integrity-check", passed: false,
    releaseReady: false, error: error instanceof Error ? error.message : "Local integrity check failed" }, null, 2));
  process.exitCode = 1;
}
