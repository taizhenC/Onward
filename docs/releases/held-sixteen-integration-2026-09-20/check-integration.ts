// Read-only, hermetic proposal check: no .env loading, database, providers, Git, or writes.
// From repo root:
//   node --import tsx docs/releases/held-sixteen-integration-2026-09-20/check-integration.ts
// Pinned review packet:
//   node --import tsx docs/releases/held-sixteen-integration-2026-09-20/check-integration.ts --require-manifest
// --manifest <repo-relative path> also requires that exact manifest to exist.
// Exit 1 means structural/pinning failure OR immutable-old-gold age migration blockers.
// Passing structural checks is NOT evidence that this catalog is installed or publishable.
import "../../../scripts/_smoke-bootstrap";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { FIGURE_STAGES } from "../../../lib/figures-data";
import { parseStorySpecDocument, validateStorySpec } from "../../../lib/story-spec";
import { composeCanonicalStoryArtifact, validateStoredStoryArtifact } from "../../../lib/story-artifact";
import { countWords, splitCanonicalSentences } from "../../../lib/story-sentences";
import { createResonanceBrief } from "../../../lib/resonance-brief";
import { DEFAULT_PREFACE_LINES, NEUTRAL_EYEBROW } from "../../../lib/opening-copy";
import { STORY_PROMPT_VERSION_V1 } from "../../../lib/llm-recipe-constants";
import { canonicalJson } from "../../../lib/story-recipe";
import type { FigureStageRow, MatchRecipe } from "../../../lib/types";
import type { StorySpec } from "../../../lib/story-spec-types";

const PACKET = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(PACKET, "../../..");
const OLD_LIBRARY_SHA256 = "e88751de566fa1077059cee143c4bd9d88b55e8adcca48eab4d5fa49b04ddf88";
const OLD_GOLD_SHA256 = "f87962a57990f65a8765afdcd141bbdd1c3b9f5a965d04f4810f1787d8aa2a1e";
const FROZEN_PACKET = resolve(PACKET, "../held-story-repairs-2026-09-20");
const FROZEN_INDEX_SHA256 = "0146c5cf609ca78c489513624e5a3455102993f462e6b485e352b4048deb32d9";
const COARSE_CHRONOLOGY = {
  poitier: {
    stageId: "early-auditions-and-trial-training", ages: [15, 19], ageFactId: "fact-age",
    qualificationSha256: "c347107363f214d7d3cf668c25bb0436e4e090f48c3d70e5f74e3cfbcc812b43",
  },
  rudolph: {
    stageId: "childhood-basketball-to-track", ages: [5, 16], ageFactId: "age",
    qualificationSha256: "014d09a382742b09cb02b8efd0bd2ac12bbc54568b9d08653776460be851dd29",
  },
} as const;
const SET_KEYS = [
  ["berlin_i", "carver", "christie", "coltrane", "lamarr", "lee", "lewis_e", "lindgren", "mcclintock"],
  ["owens", "poitier", "rachmaninoff", "rogers", "rudolph", "rustin", "wang"],
] as const;
const EXPECTED_KEYS: readonly string[] = SET_KEYS.flat();
const ROLES = ["scene", "dark_moment", "response", "struggle", "turning_point", "became", "bridge"] as const;
const FACETS = ["emotionalCore", "decisionShape", "triggerEvent", "agencyState"];
const failures: string[] = [];
const checked: Array<Record<string, unknown>> = [];
const candidates = new Map<string, { spec: StorySpec; path: string; sha256: string }>();
const proposals = new Map<string, { stage: FigureStageRow; path: string; sha256: string }>();
const frozenCandidates = new Map<string, StorySpec>();
const readPaths = new Map<string, string>();

function fileHash(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}
function valueHash(value: unknown): string {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}
function read(path: string): string {
  const value = readFileSync(path, "utf8");
  readPaths.set(path, createHash("sha256").update(value).digest("hex"));
  return value;
}
function json(path: string): unknown { return JSON.parse(read(path)); }
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
function exactKeys(value: Record<string, unknown>, required: string[], optional: string[] = []): void {
  assert(required.every(key => Object.hasOwn(value, key)), "Missing required keys");
  assert(Object.keys(value).every(key => required.includes(key) || optional.includes(key)), "Unexpected keys");
}
function strings(value: unknown, label: string, min = 0, unique = false): asserts value is string[] {
  assert(Array.isArray(value) && value.length >= min && value.every(nonEmpty), label);
  if (unique) assert.equal(new Set(value).size, value.length, label + " duplicates");
}
function guard(label: string, action: () => void): void {
  try { action(); }
  catch (error) {
    failures.push(label + ": " + (error instanceof Error ? error.message : "unknown local-check failure"));
  }
}
function localPath(path: string): string { return relative(REPO, path).split(sep).join("/"); }
function insidePacket(value: unknown): string {
  assert(nonEmpty(value), "Manifest path must be nonempty");
  const absolute = resolve(REPO, value);
  const rel = relative(PACKET, absolute);
  assert(!isAbsolute(rel) && rel !== ".." && !rel.startsWith(".." + sep), "Manifest target outside packet");
  return absolute;
}
function readInitializer(file: string, name: string): ts.Expression {
  const path = resolve(REPO, file);
  const source = ts.createSourceFile(path, read(path), ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
  const matches: ts.Expression[] = [];
  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.name.text === name && declaration.initializer) {
        matches.push(declaration.initializer);
      }
    }
  }
  assert.equal(matches.length, 1, "Expected one literal declaration for " + name);
  return matches[0]!;
}
function controlledThemes(): string[] {
  const value = readInitializer("lib/themes.ts", "THEME_VOCABULARY");
  assert(ts.isArrayLiteralExpression(value), "Theme vocabulary is no longer a literal; inspect before updating checker");
  const result = value.elements.map(element => {
    assert(ts.isStringLiteral(element), "Nonliteral theme vocabulary");
    return element.text;
  });
  assert.equal(new Set(result).size, result.length);
  return result;
}
function hardAgeTolerance(): number {
  const value = readInitializer("lib/match-config.ts", "AGE_TOLERANCE_YEARS");
  assert(ts.isNumericLiteral(value), "Age tolerance no longer literal; inspect before updating checker");
  const tolerance = Number(value.text);
  assert(Number.isFinite(tolerance) && tolerance >= 0);
  // Importing figures.ts would pull in DB modules. Confirm its pure expression and
  // hard-gate comparator from source, then use that exact expression locally.
  const source = read(resolve(REPO, "lib/figures.ts")).replace(/\s+/g, "");
  assert(source.includes("returnMath.max(stage.ageMin-age,age-stage.ageMax,0);"), "Runtime age-distance expression changed");
  assert(source.includes("ageDistance(stage,age)<=AGE_TOLERANCE_YEARS"), "Runtime hard-age comparator changed");
  return tolerance;
}
function ageDistance(stage: FigureStageRow, age: number): number {
  return Math.max(stage.ageMin - age, age - stage.ageMax, 0);
}
function parseStage(raw: unknown, vocabulary: readonly string[]): FigureStageRow {
  assert(record(raw), "Stage must be object");
  exactKeys(raw, ["figureKey", "displayName", "stageId", "stageLabel", "ageMin", "ageMax",
    "shapeSentences", "facets", "biographicalFacts", "themes", "antiThemes", "beats", "sources"],
    ["birthYear", "deathYear"]);
  for (const key of ["figureKey", "displayName", "stageId", "stageLabel", "biographicalFacts"]) {
    assert(nonEmpty(raw[key]), key + " must be nonempty");
  }
  assert(typeof raw.figureKey === "string" && EXPECTED_KEYS.includes(raw.figureKey), "Unexpected figure key");
  assert(typeof raw.stageId === "string" && /^[a-z0-9][a-z0-9-]*$/.test(raw.stageId), "Invalid stage identifier");
  for (const key of ["ageMin", "ageMax"]) {
    assert(typeof raw[key] === "number" && Number.isInteger(raw[key]) && raw[key] >= 0 && raw[key] <= 120, key);
  }
  assert((raw.ageMin as number) <= (raw.ageMax as number), "Reversed ages");
  for (const key of ["birthYear", "deathYear"]) {
    if (Object.hasOwn(raw, key)) assert(typeof raw[key] === "number" && Number.isInteger(raw[key]), key);
  }
  if (typeof raw.birthYear === "number" && typeof raw.deathYear === "number") {
    assert(raw.birthYear <= raw.deathYear, "Reversed life dates");
  }
  strings(raw.shapeSentences, "shapeSentences", 2, true);
  assert(raw.shapeSentences.length <= 3, "More than three shapes");
  assert(record(raw.facets), "facets");
  exactKeys(raw.facets, FACETS);
  for (const key of FACETS) assert(nonEmpty(raw.facets[key]), "facet " + key);
  strings(raw.themes, "themes", 1, true);
  strings(raw.antiThemes, "antiThemes", 0, true);
  const antiThemes = raw.antiThemes;
  for (const theme of [...raw.themes, ...raw.antiThemes]) assert(vocabulary.includes(theme), "Uncontrolled theme " + theme);
  assert(!raw.themes.some(theme => antiThemes.includes(theme)), "Same theme and anti-theme");
  strings(raw.sources, "sources", 1);
  assert(Array.isArray(raw.beats) && raw.beats.length === 7, "Seven beats required");
  for (const [index, beat] of raw.beats.entries()) {
    assert(record(beat), "Beat must be object");
    exactKeys(beat, ["kind", "role", "text"], ["sourceNotes"]);
    assert.equal(beat.role, ROLES[index], "Beat role order");
    assert.equal(beat.kind, index === 6 ? "bridge" : "narrative", "Beat kind");
    assert(nonEmpty(beat.text) && !beat.text.includes("{feeling}"), "Empty beat or raw-disclosure placeholder");
    if (Object.hasOwn(beat, "sourceNotes")) assert(nonEmpty(beat.sourceNotes), "Empty sourceNotes");
  }
  // Every runtime field has been checked above; no unvalidated JSON assertion.
  return raw as FigureStageRow;
}

let requireManifest = false;
let manifestPath = resolve(PACKET, "review-targets.json");
guard("arguments", () => {
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === "--require-manifest") requireManifest = true;
    else if (args[i] === "--manifest") {
      assert(args[i + 1] && !args[i + 1]!.startsWith("--"), "--manifest needs a path");
      manifestPath = resolve(REPO, args[++i]!);
      requireManifest = true;
    } else assert.fail("Unknown argument: " + args[i]);
  }
});

let vocabulary: string[] = [];
let tolerance = -1;
guard("controlled vocabulary", () => { vocabulary = controlledThemes(); });
guard("age gate", () => { tolerance = hardAgeTolerance(); });
guard("pinned original source catalog", () => {
  assert.equal(fileHash(resolve(REPO, "lib/figures-data.ts")), OLD_LIBRARY_SHA256);
  assert.equal(FIGURE_STAGES.length, 50);
  assert.equal(new Set(FIGURE_STAGES.map(stage => stage.figureKey)).size, 50);
  assert.equal(new Set(FIGURE_STAGES.map(stage => stage.figureKey + ":" + stage.stageId)).size, 50);
});
guard("immutable prior 26-story packet", () => {
  const path = resolve(FROZEN_PACKET, "review-targets.json");
  assert.equal(fileHash(path), FROZEN_INDEX_SHA256, "Prior review index changed");
  const index = json(path);
  assert(record(index) && Array.isArray(index.targets), "Prior review index shape");
  assert.equal(index.kind, "editorial-review-index-not-promotion-authority");
  assert.equal(index.approval, "none");
  assert.equal(index.targets.length, 26);
  const seenPaths = new Set<string>();
  for (const target of index.targets) {
    assert(record(target) && nonEmpty(target.path) && nonEmpty(target.figureKey), "Prior target shape");
    const candidatePath = resolve(REPO, target.path);
    const rel = relative(FROZEN_PACKET, candidatePath);
    assert(!isAbsolute(rel) && rel !== ".." && !rel.startsWith(".." + sep), "Prior target outside its packet");
    assert(!seenPaths.has(candidatePath), "Duplicate prior target path");
    seenPaths.add(candidatePath);
    assert.equal(fileHash(candidatePath), target.sha256, "Prior frozen candidate changed: " + target.figureKey);
    const spec = parseStorySpecDocument(json(candidatePath));
    assert(spec && spec.figureKey === target.figureKey, "Prior candidate identity");
    assert(!frozenCandidates.has(spec.figureKey), "Duplicate prior figure");
    assert.equal(spec.arc.length, 7);
    frozenCandidates.set(spec.figureKey, spec);
  }
  assert.equal(frozenCandidates.size, 26);
  assert(EXPECTED_KEYS.every(key => frozenCandidates.has(key)), "Replacement figure absent from prior packet");
});

for (const [index, keys] of SET_KEYS.entries()) {
  const directory = resolve(PACKET, "set-" + (index + 1));
  guard("set-" + (index + 1), () => {
    const paths = readdirSync(directory).filter(name => name.endsWith(".candidate.json")).sort();
    assert.equal(paths.length, keys.length, "Candidate count must be " + keys.length);
    for (const name of paths) {
      guard(name, () => {
        const path = resolve(directory, name);
        const spec = parseStorySpecDocument(json(path));
        assert(spec, "Strict StorySpec parser rejected candidate");
        assert((keys as readonly string[]).includes(spec.figureKey), "Wrong figure in set");
        assert(!candidates.has(spec.figureKey), "Duplicate figure");
        assert.equal(spec.status, "draft");
        assert.deepEqual(spec.review, {});
        assert.equal(spec.version, 1, "Replacement stage starts at version 1");
        assert.equal(spec.storySpecId, spec.figureKey + ":" + spec.stageId + ":v" + spec.version);
        assert.equal(name, spec.figureKey + "-" + spec.stageId + "-v" + spec.version + ".candidate.json");
        candidates.set(spec.figureKey, { spec, path, sha256: fileHash(path) });
      });
    }
  });
}
guard("proposal inventory", () => {
  const directory = resolve(PACKET, "proposals");
  const names = readdirSync(directory).filter(name => name.endsWith(".stage-proposal.json")).sort();
  assert.deepEqual(names, EXPECTED_KEYS.map(key => key + ".stage-proposal.json").sort());
  for (const name of names) {
    guard(name, () => {
      const path = resolve(directory, name);
      const stage = parseStage(json(path), vocabulary);
      assert.equal(name, stage.figureKey + ".stage-proposal.json");
      assert(!proposals.has(stage.figureKey), "Duplicate proposal key");
      proposals.set(stage.figureKey, { stage, path, sha256: fileHash(path) });
    });
  }
});
guard("exact scope", () => {
  assert.deepEqual([...candidates.keys()].sort(), [...EXPECTED_KEYS].sort());
  assert.deepEqual([...proposals.keys()].sort(), [...EXPECTED_KEYS].sort());
  assert.equal(new Set([...candidates.values()].map(item => item.spec.storySpecId)).size, 16);
});

const testRecipe: MatchRecipe = {
  recipeId: "held-sixteen-proposal-check-not-installed",
  matchConfigVersion: "proposal-only",
  crisisRegexVersion: "not-invoked",
  llmProvider: "stub",
  rerankModelId: "not-invoked",
  proseModelId: "not-invoked",
  embeddingModelId: "not-invoked",
  retrievalMode: "keyword",
  storyPromptVersion: STORY_PROMPT_VERSION_V1,
};
const syntheticBrief = createResonanceBrief("This is a synthetic local proposal check.");
let canonicalTextsPreservedFromPrior = 0;
for (const key of EXPECTED_KEYS) {
  guard("integration " + key, () => {
    const item = candidates.get(key);
    const proposal = proposals.get(key);
    assert(item && proposal, "Candidate/proposal missing");
    const { spec } = item;
    const { stage } = proposal;
    const old = FIGURE_STAGES.find(value => value.figureKey === key);
    assert(old, "Missing original figure");
    assert.equal(stage.figureKey, spec.figureKey);
    assert.equal(stage.stageId, spec.stageId);
    assert.equal(stage.ageMin, spec.episode.ageMin);
    assert.equal(stage.ageMax, spec.episode.ageMax);
    assert.equal(stage.displayName, old.displayName, "Identity changed");
    const frozen = frozenCandidates.get(key);
    assert(frozen, "Missing pinned prior candidate");
    if (key !== "rogers") {
      assert.deepEqual(spec.arc.map(beat => beat.canonicalText), frozen.arc.map(beat => beat.canonicalText),
        "Previously reviewed canonical text changed outside the explicit Rogers rewrite");
      canonicalTextsPreservedFromPrior += 1;
    }
    if (key === "poitier" || key === "rudolph") {
      const policy = COARSE_CHRONOLOGY[key];
      assert.equal(spec.stageId, policy.stageId, "Coarse chronology must keep its undated stage identity");
      assert.deepEqual([spec.episode.ageMin, spec.episode.ageMax], [...policy.ages], "Coarse age envelope changed");
      assert(!Object.hasOwn(spec.episode, "startDate") && !Object.hasOwn(spec.episode, "endDate"),
        "Unresolved chronology must not acquire episode start/end dates");
      const ageFact = spec.facts.find(fact => fact.factId === policy.ageFactId);
      assert(ageFact, "Coarse chronology age fact missing");
      assert.equal(ageFact.confidence, "probable", "Inferred/disputed chronology must remain qualified");
      // Pin the complete qualification bundle, not a brittle prose regex. A wording
      // change requires an explicit editorial review and policy-pin update.
      assert.equal(valueHash({ throughLine: spec.episode.throughLine,
        contentNote: spec.contentProfile.contentNote, ageFact, dramatizationLimits: spec.dramatizationLimits }),
      policy.qualificationSha256, "Coarse-envelope/source qualification changed");
    }
    assert.deepEqual(stage.beats.map(beat => [beat.kind, beat.role, beat.text]),
      spec.arc.map(beat => [beat.role === "bridge" ? "bridge" : "narrative", beat.role, beat.canonicalText]));
    const draft = validateStorySpec(spec, { forPublish: false });
    assert.deepEqual(draft.errors, [], "Draft errors");
    assert.deepEqual(draft.warnings, [], "Draft warnings");
    assert(draft.valid);
    const simulation: StorySpec = {
      ...structuredClone(spec), status: "published",
      review: {
        researcherId: "local-simulation-not-human-review",
        historicalReviewerId: "local-simulation-not-human-review",
        toneReviewerId: "local-simulation-not-human-review",
        reviewedAt: "2026-09-20",
        contentProfileReviewed: true,
      },
    };
    const published = validateStorySpec(simulation, { forPublish: true });
    assert(published.valid);
    assert.deepEqual(published.errors, [], "Simulation errors");
    assert.deepEqual(published.warnings, [], "Simulation warnings");
    const rhythm = spec.arc.map(beat => {
      const lengths = splitCanonicalSentences(beat.canonicalText).map(countWords);
      assert(lengths.length > 0, "Empty passage");
      const maximum = Math.max(...lengths);
      const mean = lengths.reduce((sum, count) => sum + count, 0) / lengths.length;
      assert(mean <= 16, key + "/" + beat.role + " sentence mean exceeds 16");
      assert(maximum <= 28, key + "/" + beat.role + " sentence exceeds 28 words");
      assert(lengths[lengths.length - 1]! < maximum, key + "/" + beat.role + " ends on a longest sentence");
      return { role: beat.role, meanWords: mean, maximumWords: maximum, finalWords: lengths[lengths.length - 1] };
    });
    const artifact = composeCanonicalStoryArtifact({
      storySpec: spec, stage, matchRecipe: testRecipe,
      openingCopy: { eyebrow: NEUTRAL_EYEBROW, prefaceLines: DEFAULT_PREFACE_LINES },
      framing: "partial", resonanceBrief: syntheticBrief, allowDraftSpec: true,
      now: new Date("2026-09-20T12:00:00.000Z"),
    });
    assert.deepEqual(artifact.beats.map(beat => beat.text), spec.arc.map(beat => beat.canonicalText));
    assert.equal(artifact.transparency?.provenance.status, "review_draft");
    assert.equal(artifact.contentProfile.reviewed, false);
    const replay = validateStoredStoryArtifact(JSON.parse(JSON.stringify(artifact)));
    assert(replay, "Serialized replay rejected");
    assert.deepEqual(replay.beats.map(beat => beat.text), spec.arc.map(beat => beat.canonicalText));
    for (const [index, beat] of replay.beats.entries()) {
      assert.equal(beat.chunks.join(" ").replace(/\s+/g, " ").trim(),
        spec.arc[index]!.canonicalText.replace(/\s+/g, " ").trim(), "Chunks changed canonical text");
    }
    const tampered = JSON.parse(JSON.stringify(artifact));
    tampered.beats[0].text += " Altered.";
    assert.equal(validateStoredStoryArtifact(tampered), null, "Tampered replay accepted");
    checked.push({
      figureKey: key, storySpecId: spec.storySpecId,
      candidatePath: localPath(item.path), candidateSha256: item.sha256,
      proposalPath: localPath(proposal.path), proposalSha256: proposal.sha256,
      words: countWords(spec.arc.map(beat => beat.canonicalText).join(" ")),
      draftErrors: 0, draftWarnings: 0, publicationSimulationErrors: 0, publicationSimulationWarnings: 0,
      proposedAges: [stage.ageMin, stage.ageMax], installedSourceAges: [old.ageMin, old.ageMax],
      identityDateChanges: {
        birthYear: stage.birthYear !== old.birthYear,
        deathYear: stage.deathYear !== old.deathYear,
        qualification: "Optional date omission/correction requires source review, not inference from the old seed.",
      },
      oldStageId: old.stageId, proposedStageId: stage.stageId,
      canonicalPreservedFromFrozenReview: key !== "rogers",
      canonicalRewriteException: key === "rogers" ? "New Senate-testimony story requires fresh owner review" : null,
      coarseChronologyQualified: key === "poitier" || key === "rudolph",
      canonicalBeatsEqual: true, serializedReplay: true, tamperedReplayRejected: true, rhythm,
    });
    assert.equal(spec.status, "draft");
    assert.deepEqual(spec.review, {});
  });
}

let unchangedOtherRows = 0;
let overlay: FigureStageRow[] = [];
guard("proposal overlay", () => {
  assert.equal(proposals.size, 16);
  const before = structuredClone(FIGURE_STAGES);
  overlay = before.map(stage => structuredClone(proposals.get(stage.figureKey)?.stage ?? stage));
  assert.equal(overlay.length, 50);
  assert.equal(new Set(overlay.map(stage => stage.figureKey)).size, 50);
  assert.equal(new Set(overlay.map(stage => stage.figureKey + ":" + stage.stageId)).size, 50);
  for (const [index, old] of before.entries()) {
    if (EXPECTED_KEYS.includes(old.figureKey)) assert.deepEqual(overlay[index], proposals.get(old.figureKey)!.stage);
    else { assert.deepEqual(overlay[index], old); unchangedOtherRows += 1; }
  }
  assert.equal(unchangedOtherRows, 34);
  assert.deepEqual(FIGURE_STAGES, before, "Imported source catalog mutated");
});

let manifestState = "UNPINNED_DRAFT";
let manifestSha256: string | null = null;
guard("review manifest", () => {
  if (!existsSync(manifestPath)) {
    assert(!requireManifest, "Required manifest missing: " + localPath(manifestPath));
    return;
  }
  const manifest = json(manifestPath);
  assert(record(manifest) && Array.isArray(manifest.targets), "Manifest must contain targets[]");
  assert.equal(manifest.kind, "held-sixteen-integration-review-v1", "Manifest kind");
  assert.equal(manifest.status, "draft-review-only", "Manifest must not claim publication/review completion");
  assert.equal(manifest.humanApproval, null, "No inherited human approval for proposal");
  assert.equal(manifest.servingChanges, false, "Proposal must not claim serving changes");
  assert.equal(manifest.targets.length, 16);
  const seen = new Set<string>();
  for (const target of manifest.targets) {
    assert(record(target) && typeof target.figureKey === "string", "Invalid manifest target");
    assert(EXPECTED_KEYS.includes(target.figureKey) && !seen.has(target.figureKey), "Unexpected/duplicate manifest key");
    seen.add(target.figureKey);
    const candidate = candidates.get(target.figureKey);
    const proposal = proposals.get(target.figureKey);
    assert(candidate && proposal);
    assert.equal(insidePacket(target.path), candidate.path, "Candidate manifest path");
    assert.equal(target.sha256, candidate.sha256, "Candidate manifest hash");
    assert.equal(insidePacket(target.proposalPath), proposal.path, "Proposal manifest path");
    assert.equal(target.proposalSha256, proposal.sha256, "Proposal manifest hash");
  }
  assert.deepEqual([...seen].sort(), [...EXPECTED_KEYS].sort());
  manifestSha256 = fileHash(manifestPath);
  manifestState = "PINNED_PROPOSAL_NOT_INSTALLED";
});

let readingCopyTargetsChecked = 0;
const readingCopyHashes: Record<string, string> = {};
for (const [index, keys] of SET_KEYS.entries()) {
  guard("exact reading copy set-" + (index + 1), () => {
    const path = resolve(PACKET, "set-" + (index + 1), "READING-COPY.md");
    const copy = read(path);
    readingCopyHashes[localPath(path)] = fileHash(path);
    const sections = copy.split(/\r?\n## /).slice(1);
    assert.equal(sections.length, keys.length, "Reading-copy story section count");
    for (const key of keys) {
      const candidate = candidates.get(key);
      const proposal = proposals.get(key);
      assert(candidate && proposal, "Missing reading-copy target");
      const selected = sections.filter(section => section.split(/\r?\n/, 1)[0] === proposal.stage.displayName);
      assert.equal(selected.length, 1, "Missing/duplicate story reading section: " + key);
      const section = selected[0]!;
      assert(section.includes(candidate.spec.storySpecId), "Reading identity differs: " + key);
      assert(section.includes("Candidate SHA-256: `" + candidate.sha256 + "`"), "Reading candidate hash differs: " + key);
      assert(section.includes("Matching proposal SHA-256: `" + proposal.sha256 + "`"), "Reading proposal hash differs: " + key);
      for (const beat of candidate.spec.arc) {
        assert(section.includes(beat.canonicalText), "Reading canonical passage differs: " + key + "/" + beat.role);
      }
      readingCopyTargetsChecked += 1;
    }
  });
}

const ageMigrationBlockers: Array<Record<string, unknown>> = [];
let oldGoldCases = 0;
guard("immutable old gold hard-age reachability", () => {
  const path = resolve(REPO, "evals/match.json");
  assert.equal(fileHash(path), OLD_GOLD_SHA256, "Historical gold bytes changed");
  const gold = json(path);
  assert(record(gold) && Array.isArray(gold.cases));
  assert.equal(overlay.length, 50, "Complete overlay required");
  assert(tolerance >= 0);
  oldGoldCases = gold.cases.length;
  for (const [index, item] of gold.cases.entries()) {
    assert(record(item) && Number.isInteger(item.age) && typeof item.expect === "string", "Invalid old gold row");
    if (item.expect === "miss") continue;
    const targets = overlay.filter(stage => stage.figureKey === item.expect);
    assert(targets.length > 0, "Gold figure missing from overlay: " + item.expect);
    const distance = Math.min(...targets.map(stage => ageDistance(stage, item.age as number)));
    if (distance > tolerance) {
      ageMigrationBlockers.push({
        caseIndex: index, expectedFigure: item.expect, age: item.age,
        proposedRanges: targets.map(stage => [stage.ageMin, stage.ageMax]),
        distanceYears: distance, hardToleranceYears: tolerance,
        classification: "DETERMINISTIC_MIGRATION_BLOCKER_NOT_PROVIDER_EVIDENCE",
      });
    }
  }
});

guard("read inputs remained unchanged", () => {
  for (const [path, hash] of readPaths) assert.equal(fileHash(path), hash, "Input changed during check: " + localPath(path));
  assert.equal(fileHash(resolve(REPO, "lib/figures-data.ts")), OLD_LIBRARY_SHA256);
  assert.equal(fileHash(resolve(REPO, "evals/match.json")), OLD_GOLD_SHA256);
  assert.equal(fileHash(resolve(FROZEN_PACKET, "review-targets.json")), FROZEN_INDEX_SHA256);
  assert.equal(canonicalTextsPreservedFromPrior, 15, "Expected exact prior prose for 15 stories");
  assert.equal(readingCopyTargetsChecked, 16, "Expected exact reading copies for 16 stories");
});
const structuralChecksPassed = failures.length === 0 && checked.length === 16;
console.log(JSON.stringify({
  kind: "held-sixteen-proposal-integration-check",
  catalogState: "PROPOSAL_NOT_INSTALLED",
  structuralChecksPassed,
  expectedKeys: EXPECTED_KEYS, setSizes: [9, 7], candidatesChecked: checked.length,
  overlayRows: overlay.length, unchangedOtherRows,
  originalSourceCatalogSha256: OLD_LIBRARY_SHA256,
  frozenReviewIndexSha256: FROZEN_INDEX_SHA256, frozenCandidatesChecked: frozenCandidates.size,
  canonicalTextsPreservedFromPrior, canonicalRewriteExceptions: ["rogers"],
  readingCopyTargetsChecked, readingCopyHashes,
  immutableOldGoldSha256: OLD_GOLD_SHA256, oldGoldCases,
  manifestState, manifestSha256,
  sentenceRhythmPolicy: { maximumMean: 16, maximumSentence: 28, finalSentenceMustBeStrictlyShorterThanMaximum: true },
  ageMigrationBlockers,
  migrationBlocked: ageMigrationBlockers.length > 0,
  releaseReady: false,
  approval: "none",
  productionWrites: false, databaseAccess: false, environmentLoaded: false, providerCalls: 0,
  realRerankEvidence: false,
  oldStagePolicy: "Old held stages must remain non-serving; preserve all foreign keys and session references; no deletion or rekey.",
  qualification: "Pure composition/replay checks use each proposed stage and a synthetic test recipe, not installed matching or production. No old gold was changed. A clean result is not publication authority.",
  candidates: checked, failures,
}, null, 2));
if (!structuralChecksPassed || ageMigrationBlockers.length > 0) process.exitCode = 1;
