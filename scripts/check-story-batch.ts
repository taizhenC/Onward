// Read-only editorial verification. Does not load credentials, approve content,
// call providers, or persist artifacts. Usage: <directory> [expected-count=9] [--require-hashes].
import "./_smoke-bootstrap";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import assert from "node:assert/strict";
import { FIGURE_STAGES } from "../lib/figures-data";
import { parseStorySpecDocument, validateStorySpec } from "../lib/story-spec";
import {
  composeCanonicalStoryArtifact,
  storyArtifactContentHash,
  validateStoryArtifact,
  validateStoredStoryArtifact,
} from "../lib/story-artifact";
import { PRIMARY_STORY_RECIPE, storyRecipeExecutionPlan } from "../lib/story-recipe";
import { createResonanceBrief } from "../lib/resonance-brief";
import { DEFAULT_PREFACE_LINES, NEUTRAL_EYEBROW } from "../lib/opening-copy";
import { countWords, splitCanonicalSentences } from "../lib/story-sentences";
import { crisisRegexVersion } from "../lib/safety";
import type { MatchRecipe } from "../lib/types";

function main(): void {
  const directory = process.argv[2];
  const expectedCount = Number(process.argv[3] ?? 9);
  assert(directory, "Usage: check-story-batch.ts <directory> [expected-count=9] [--require-hashes]");
  assert(Number.isInteger(expectedCount) && expectedCount > 0, "Invalid expected count");
  assert(process.argv.length <= 5 && (process.argv[4] === undefined || process.argv[4] === "--require-hashes"),
    "Unexpected arguments");
  const names = readdirSync(directory).filter(name => name.endsWith(".candidate.json")).sort();
  assert.equal(names.length, expectedCount, "Batch does not contain the expected candidate count");
  // A frozen editorial packet can pin its exact inputs without persisting reviews.
  const hashFile = resolve(directory, "candidate-sha256.json");
  if (process.argv[4] === "--require-hashes") assert(existsSync(hashFile), "Candidate hash manifest is required");
  const expectedHashes: unknown = existsSync(hashFile) ? JSON.parse(readFileSync(hashFile, "utf8")) : undefined;
  if (expectedHashes !== undefined) {
    assert(expectedHashes && typeof expectedHashes === "object" && !Array.isArray(expectedHashes),
      "Invalid candidate hash manifest");
    assert.deepEqual(Object.keys(expectedHashes).sort(), names, "Hash manifest file set differs");
  }
  const recipe = PRIMARY_STORY_RECIPE;
  assert.equal(storyRecipeExecutionPlan(recipe).storyComposerMode, "canonical");
  const matchRecipe: MatchRecipe = {
    ...recipe,
    recipeManifestHash: recipe.manifestSha256,
    deploymentVersion: "local-editorial-batch-check",
    crisisRegexVersion,
  };
  const brief = createResonanceBrief("A synthetic editorial fixture with an amber compass.");
  const ids = new Set<string>();
  const results = names.map(name => {
    const bytes = readFileSync(resolve(directory, name));
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    if (expectedHashes && typeof expectedHashes === "object") {
      assert.equal(sha256, Reflect.get(expectedHashes, name), `${name}: frozen candidate bytes changed`);
    }
    const spec = parseStorySpecDocument(JSON.parse(bytes.toString("utf8")));
    assert(spec, `${name}: invalid document shape`);
    assert.equal(spec.status, "draft", `${name}: candidate must remain a draft`);
    assert.deepEqual(spec.review, {}, `${name}: do not save simulated approval`);
    assert(!ids.has(spec.storySpecId), `${name}: duplicate identity`);
    ids.add(spec.storySpecId);
    const draft = validateStorySpec(spec, { forPublish: false });
    // The simulation exists only in memory. These are not reviewer identities.
    const simulation = { ...spec, status: "published" as const, review: {
      researcherId: "validator-only-not-approval",
      historicalReviewerId: "validator-only-not-approval",
      toneReviewerId: "validator-only-not-approval",
      reviewedAt: "2026-09-05", contentProfileReviewed: true,
    } };
    const publication = validateStorySpec(simulation, { forPublish: true });
    assert(draft.valid && publication.valid, `${name}: ${JSON.stringify({ draft, publication })}`);
    assert.equal(draft.warnings.length + publication.warnings.length, 0,
      `${name}: ${JSON.stringify([...draft.warnings, ...publication.warnings])}`);
    const stage = FIGURE_STAGES.find(value => value.figureKey === spec.figureKey && value.stageId === spec.stageId);
    assert(stage, `${name}: stage absent from installed library`);
    const artifact = composeCanonicalStoryArtifact({
      storySpec: simulation, stage, matchRecipe, resonanceBrief: brief,
      framing: "partial",
      openingCopy: { eyebrow: NEUTRAL_EYEBROW, prefaceLines: DEFAULT_PREFACE_LINES },
      now: new Date("2026-09-05T00:00:00.000Z"),
    });
    assert.deepEqual(artifact.beats.map(beat => beat.text), spec.arc.map(beat => beat.canonicalText));
    assert.equal(artifact.contentHash, storyArtifactContentHash(artifact));
    assert(validateStoryArtifact(artifact, simulation, brief).valid, `${name}: invalid artifact`);
    assert(validateStoredStoryArtifact(JSON.parse(JSON.stringify(artifact))), `${name}: serialized replay failed`);
    const passages = spec.arc.map(beat => {
      const sentences = splitCanonicalSentences(beat.canonicalText);
      const lengths = sentences.map(countWords);
      assert(lengths.length > 0, `${name}/${beat.role}: no sentences`);
      const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
      const longest = Math.max(...lengths);
      const last = lengths[lengths.length - 1];
      assert(mean <= 16 && longest <= 28, `${name}/${beat.role}: sentence length targets`);
      assert(last < longest, `${name}/${beat.role}: final sentence is longest (including ties)`);
      if (beat.role === "bridge") assert(last <= 12, `${name}: bridge ending exceeds twelve words`);
      return { role: beat.role, words: countWords(beat.canonicalText),
        sentenceMean: Number(mean.toFixed(2)),
        longestSentence: longest,
        textureSentences: beat.sentenceEvidence.filter(item => item.treatment === "dramatized_texture").length,
      };
    });
    return { file: name, id: spec.storySpecId, figureKey: spec.figureKey,
      sha256,
      words: passages.reduce((sum, passage) => sum + passage.words, 0),
      draftErrors: 0, draftWarnings: 0, publicationErrors: 0, publicationWarnings: 0,
      canonicalProsePreserved: true, serializedReplay: true,
      matchingAgeRangeDiffers: spec.episode.ageMin !== stage.ageMin || spec.episode.ageMax !== stage.ageMax,
      passages,
    };
  });
  console.log(JSON.stringify({ ok: true, directory, expectedCount,
    recipeId: recipe.recipeId, recipeManifestSha256: recipe.manifestSha256,
    approval: "none; source accuracy and reading quality require independent review",
    candidates: results,
  }, null, 2));
}

try { main(); } catch (error) {
  console.error(error instanceof Error ? error.message : "Batch verification failed");
  process.exitCode = 1;
}
