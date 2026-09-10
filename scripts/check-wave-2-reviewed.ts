// Read-only, hash-bound snapshot check. No credentials, providers or persistence.
// Usage: npx tsx scripts/check-wave-2-reviewed.ts
import "./_smoke-bootstrap";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { FIGURE_STAGES } from "../lib/figures-data";
import { DEFAULT_PREFACE_LINES, NEUTRAL_EYEBROW } from "../lib/opening-copy";
import { createResonanceBrief } from "../lib/resonance-brief";
import { crisisRegexVersion } from "../lib/safety";
import {
  composeCanonicalStoryArtifact,
  storyArtifactContentHash,
  validateStoryArtifact,
  validateStoredStoryArtifact,
} from "../lib/story-artifact";
import { getStoryRecipeById, storyRecipeExecutionPlan } from "../lib/story-recipe";
import { countWords, splitCanonicalSentences } from "../lib/story-sentences";
import { parseStorySpecDocument, validateStorySpec } from "../lib/story-spec";
import type { MatchRecipe } from "../lib/types";

const SNAPSHOT = new URL("../docs/releases/wave-2-reviewed-2026-09-10/", import.meta.url);
const EXPECTED_HASHES = {
  "andersen-1822-1827-the-headmasters-school-v1.candidate.json": "051bf21bc75e38b313d7418a6a3f6bd3f595776373a2c975fe20d5a378d0bb07",
  "banting-1920-1922-empty-waiting-room-v1.candidate.json": "259cfe33e88bc95464d1867ac0813ffb1cd31ed54ef6702f099b9c6aff72b52a",
  "berlin_i-1901-1907-bowery-to-first-song-v1.candidate.json": "35a6bc5924c934c544f0eb3028aa6aa7585152f2aed3cce53c8b01d7bc3ba48f",
  "bronte_c-1846-1847-two-copies-v1.candidate.json": "8993d886438a706386a3754ef6391fe12b7eec1e55b6d5e4a69160b425679e1f",
  "butler-1974-1975-pre-patternmaster-v1.candidate.json": "ef22c914d9ae0ea928fb4b6382eb7c55d0abaaf09fbde4c669e8cd23ee8b0f51",
  "carver-1885-1891-turned-away-to-the-sod-house-v1.candidate.json": "69336be7fd6630f4680264012caf2224be95779628200230bb0a1ddbea27943c",
  "charles_r-1945-1948-orphaned-to-the-bus-v1.candidate.json": "dcad2fe377e3c6df2e6abbc0468b654eb3378ffbb01f66d6db4683a8785349e2",
  "child-1946-1961-aimless-to-the-book-v1.candidate.json": "10838ea0cb64e1ab679d74d571ce69bb0ed90c87f9ae5a20b9ccc871625b205c",
  "christie-1926-1928-the-year-that-broke-v1.candidate.json": "18630b8f127981d334582819dccf55b9b698199cb63100e75660075c6086a1b4",
} as const;
const ROLES = ["scene", "dark_moment", "response", "struggle", "turning_point", "became", "bridge"];
const WORD_TARGETS = [[90, 140], [120, 180], [90, 130], [100, 150], [130, 180], [100, 150], [60, 120]];

function main(): void {
  assert.equal(process.argv.length, 2, "Usage: npx tsx scripts/check-wave-2-reviewed.ts");
  const names = readdirSync(SNAPSHOT).filter(name => name.endsWith(".candidate.json")).sort();
  assert.equal(names.length, 9, "Expected exactly nine reviewed candidates");
  assert.deepEqual(names, Object.keys(EXPECTED_HASHES).sort(), "Unexpected snapshot file set");
  // Bind this historical check to the released recipe, not future selector changes.
  const recipe = getStoryRecipeById("keyword-rerank-figure-library-50-2026-07-02");
  assert(recipe, "Released recipe missing");
  assert.equal(recipe.manifestSha256, "c2ced0eefa65351dc57a17f14dd76abf575745dafaac0d6d8699a95d5a21de52");
  assert.equal(storyRecipeExecutionPlan(recipe).storyComposerMode, "canonical");
  const matchRecipe: MatchRecipe = {
    ...recipe, recipeManifestHash: recipe.manifestSha256,
    deploymentVersion: "wave-2-reviewed-check", crisisRegexVersion,
  };
  const brief = createResonanceBrief("A synthetic editorial fixture with an amber compass.");
  const ids = new Set<string>();
  const results = Object.entries(EXPECTED_HASHES).map(([name, expectedHash]) => {
    const bytes = readFileSync(new URL(name, SNAPSHOT));
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    assert.equal(sha256, expectedHash, `${name}: reviewed bytes changed`);
    const spec = parseStorySpecDocument(JSON.parse(bytes.toString("utf8")));
    assert(spec, `${name}: strict document parse failed`);
    assert.equal(spec.status, "draft", `${name}: expected draft-shaped review input`);
    assert.equal(spec.version, 1, `${name}: unexpected version`);
    assert.deepEqual(spec.review, {}, `${name}: saved approval is not allowed`);
    assert(!ids.has(spec.storySpecId), `${name}: duplicate identity`);
    ids.add(spec.storySpecId);
    assert.deepEqual(spec.arc.map(beat => beat.role), ROLES, `${name}: seven-role order`);
    // Temporary placeholders test the gate, and are never saved or called approvals.
    const simulation = { ...spec, status: "published" as const, review: {
      researcherId: "validator-only-not-approval", historicalReviewerId: "validator-only-not-approval",
      toneReviewerId: "validator-only-not-approval", reviewedAt: "2026-09-10", contentProfileReviewed: true,
    } };
    const draft = validateStorySpec(spec, { forPublish: false });
    const publication = validateStorySpec(simulation, { forPublish: true });
    for (const [gate, result] of Object.entries({ draft, publication })) {
      assert(result.valid && result.errors.length === 0 && result.warnings.length === 0,
        `${name}: ${gate} ${JSON.stringify(result)}`);
    }
    const stage = FIGURE_STAGES.find(item => item.figureKey === spec.figureKey && item.stageId === spec.stageId);
    assert(stage, `${name}: stage absent from installed library`);
    const artifact = composeCanonicalStoryArtifact({
      storySpec: simulation, stage, matchRecipe, resonanceBrief: brief, framing: "partial",
      openingCopy: { eyebrow: NEUTRAL_EYEBROW, prefaceLines: DEFAULT_PREFACE_LINES },
      now: new Date("2026-09-10T00:00:00.000Z"),
    });
    const canonical = spec.arc.map(beat => beat.canonicalText);
    assert.deepEqual(artifact.beats.map(beat => beat.text), canonical, `${name}: composed prose changed`);
    assert.equal(artifact.contentHash, storyArtifactContentHash(artifact), `${name}: artifact hash`);
    const artifactCheck = validateStoryArtifact(artifact, simulation, brief);
    assert(artifactCheck.valid, `${name}: ${JSON.stringify(artifactCheck)}`);
    const replay = validateStoredStoryArtifact(JSON.parse(JSON.stringify(artifact)));
    assert(replay, `${name}: serialized replay rejected`);
    assert.deepEqual(replay.beats.map(beat => beat.role), ROLES, `${name}: replay roles`);
    assert.deepEqual(replay.beats.map(beat => beat.text), canonical, `${name}: replay prose changed`);
    const passages = spec.arc.map((beat, index) => {
      const lengths = splitCanonicalSentences(beat.canonicalText).map(countWords);
      assert(lengths.length > 0, `${name}/${beat.role}: no sentences`);
      const mean = lengths.reduce((sum, length) => sum + length, 0) / lengths.length;
      const longest = Math.max(...lengths);
      const last = lengths[lengths.length - 1];
      assert(mean <= 16 && longest <= 28, `${name}/${beat.role}: sentence length targets`);
      assert(last < longest, `${name}/${beat.role}: final sentence is longest (including ties)`);
      if (beat.role === "bridge") assert(last <= 12, `${name}: bridge ending exceeds twelve words`);
      const words = countWords(beat.canonicalText);
      const [min, max] = WORD_TARGETS[index];
      return { role: beat.role, words, mean: Number(mean.toFixed(2)), longest, last,
        withinSoftWordTarget: words >= min && words <= max };
    });
    const words = passages.reduce((sum, passage) => sum + passage.words, 0);
    return { file: name, sha256, words, withinSoftTotalTarget: words >= 700 && words <= 950,
      canonicalProsePreserved: true, serializedReplay: true,
      matchingAgeRangeDiffers: spec.episode.ageMin !== stage.ageMin || spec.episode.ageMax !== stage.ageMax,
      passages };
  });
  console.log(JSON.stringify({ ok: true, directory: fileURLToPath(SNAPSHOT), checked: results.length,
    recipeId: recipe.recipeId, recipeManifestSha256: recipe.manifestSha256,
    notice: "Mechanics are not editorial approval. Soft word targets and matching differences are reported, not cleared.",
    candidates: results }, null, 2));
}

try { main(); } catch (error) {
  console.error(error instanceof Error ? error.message : "Reviewed snapshot check failed");
  process.exitCode = 1;
}
