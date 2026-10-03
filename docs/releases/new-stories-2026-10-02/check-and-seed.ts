// Packet-specific draft import. Default is offline verification; --write loads
// the configured database and inserts only absent, byte-equivalent draft rows.
// It never refreshes existing content or invokes publication functions.
import "../../../scripts/_smoke-bootstrap";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { FIGURE_STAGES } from "../../../lib/figures-data";
import { parseStorySpecDocument, validateStorySpec } from "../../../lib/story-spec";
import { countWords, splitCanonicalSentences } from "../../../lib/story-sentences";
import { THEME_VOCABULARY } from "../../../lib/themes";
import { composeCanonicalStoryArtifact, storyArtifactContentHash,
  validateStoryArtifact, validateStoredStoryArtifact } from "../../../lib/story-artifact";
import { PRIMARY_STORY_RECIPE } from "../../../lib/story-recipe";
import { createResonanceBrief } from "../../../lib/resonance-brief";
import { DEFAULT_PREFACE_LINES, NEUTRAL_EYEBROW } from "../../../lib/opening-copy";
import { crisisRegexVersion } from "../../../lib/safety";
import { loadEnvLocal } from "../../../scripts/_load-env";
import { getSupabase } from "../../../lib/db";
import type { FigureStageRow, MatchRecipe } from "../../../lib/types";

const directory = resolve("docs/research/new-stories-2026-10-02");
const reportDirectory = resolve("docs/releases/new-stories-2026-10-02");
const sha = (bytes: string | Buffer) => createHash("sha256").update(bytes).digest("hex");
function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}
function same(actual: unknown, expected: unknown, message: string): void {
  assert.equal(stable(actual), stable(expected), message);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  assert(args.length === 0 || (args.length === 1 && args[0] === "--write"),
    "Usage: node --import tsx docs/releases/new-stories-2026-10-02/check-and-seed.ts [--write]");
  const files = readdirSync(directory).filter(name => name.endsWith(".candidate.json")).sort();
  assert.equal(files.length, 10, "This batch must contain exactly ten stories");
  const stageFiles = readdirSync(directory).filter(name => name.endsWith(".stage.json")).sort();
  same(stageFiles, files.map(name => name.replace(".candidate.json", ".stage.json")), "Stage/candidate sets differ");
  const keys = new Set<string>();
  const ids = new Set<string>();
  const recipe = PRIMARY_STORY_RECIPE;
  const matchRecipe: MatchRecipe = { ...recipe, recipeManifestHash: recipe.manifestSha256,
    deploymentVersion: "new-story-offline-review", crisisRegexVersion };
  const brief = createResonanceBrief("A synthetic editorial fixture with an amber compass.");
  const entries = files.map(name => {
    const candidateBytes = readFileSync(resolve(directory, name));
    const spec = parseStorySpecDocument(JSON.parse(candidateBytes.toString("utf8")));
    assert(spec, `${name}: strict StorySpec parser rejected candidate`);
    assert.equal(spec.status, "draft");
    same(spec.review, {}, `${name}: saved review must be empty`);
    assert.equal(spec.version, 1);
    assert.equal(spec.storySpecId, `${spec.figureKey}:${spec.stageId}:v1`);
    assert(!keys.has(spec.figureKey) && !ids.has(spec.storySpecId), "Duplicate candidate identity");
    assert(!FIGURE_STAGES.some(stage => stage.figureKey === spec.figureKey), `${name}: existing figure`);
    keys.add(spec.figureKey); ids.add(spec.storySpecId);
    const stageBytes = readFileSync(resolve(directory, name.replace(".candidate.json", ".stage.json")));
    const stage = JSON.parse(stageBytes.toString("utf8")) as FigureStageRow;
    const completionDoc = readFileSync(resolve(reportDirectory, `${spec.figureKey}.md`), "utf8");
    assert(completionDoc.includes(sha(candidateBytes)) && completionDoc.includes(sha(stageBytes)),
      `${name}: completion document does not pin current inputs`);
    assert(spec.arc.every(beat => completionDoc.includes(beat.canonicalText)),
      `${name}: completion document reading copy differs`);
    same([stage.figureKey, stage.stageId, stage.ageMin, stage.ageMax],
      [spec.figureKey, spec.stageId, spec.episode.ageMin, spec.episode.ageMax], `${name}: stage identity/ages differ`);
    assert(stage.displayName?.trim() && stage.stageLabel?.trim() && stage.biographicalFacts?.trim(), `${name}: missing stage text`);
    assert(stage.shapeSentences.length > 0 && stage.shapeSentences.every(value => value.trim()), `${name}: missing retrieval shapes`);
    assert(Object.values(stage.facets).length === 4 && Object.values(stage.facets).every(value => value.trim()), `${name}: invalid facets`);
    assert(stage.sources.length > 0, `${name}: stage has no sources`);
    assert([...stage.themes, ...stage.antiThemes].every(theme => THEME_VOCABULARY.includes(theme)), `${name}: theme outside controlled vocabulary`);
    same(stage.beats.map(beat => [beat.role, beat.text]),
      spec.arc.map(beat => [beat.role, beat.canonicalText]), `${name}: stage prose differs`);
    const draft = validateStorySpec(spec, { forPublish: false });
    // Temporary mechanical simulation only; never saved as a review or approval.
    const simulation = { ...spec, status: "published" as const, review: {
      researcherId: "validator-only-not-approval", historicalReviewerId: "validator-only-not-approval",
      toneReviewerId: "validator-only-not-approval", reviewedAt: "2026-10-02", contentProfileReviewed: true } };
    const simulated = validateStorySpec(simulation, { forPublish: true });
    assert(draft.valid && simulated.valid, `${name}: ${JSON.stringify({ draft, simulated })}`);
    assert.equal(draft.warnings.length + simulated.warnings.length, 0, `${name}: StorySpec warnings`);
    const artifact = composeCanonicalStoryArtifact({ storySpec: simulation, stage, matchRecipe,
      resonanceBrief: brief, framing: "partial", openingCopy: { eyebrow: NEUTRAL_EYEBROW,
        prefaceLines: DEFAULT_PREFACE_LINES }, now: new Date("2026-10-02T12:00:00Z") });
    same(artifact.beats.map(beat => beat.text), spec.arc.map(beat => beat.canonicalText), `${name}: composed prose differs`);
    assert.equal(artifact.contentHash, storyArtifactContentHash(artifact));
    assert(validateStoryArtifact(artifact, simulation, brief).valid, `${name}: invalid canonical artifact`);
    assert(validateStoredStoryArtifact(JSON.parse(JSON.stringify(artifact))), `${name}: replay rejected`);
    const passages = spec.arc.map(beat => {
      const lengths = splitCanonicalSentences(beat.canonicalText).map(countWords);
      const mean = lengths.reduce((sum, value) => sum + value, 0) / lengths.length;
      return {role: beat.role, words: countWords(beat.canonicalText),
        sentenceMean: Number(mean.toFixed(2)), longestSentence: Math.max(...lengths),
        endingWords: lengths.at(-1), rhythmQualification: mean > 16 || Math.max(...lengths) > 28 ||
          lengths.at(-1) === Math.max(...lengths) || (beat.role === "bridge" && lengths.at(-1)! > 12)};
    });
    return {spec, stage, name, candidateSha256: sha(candidateBytes), stageSha256: sha(stageBytes), passages};
  });
  const validationReport = { completedAt: new Date().toISOString(), expectedCount: 10,
    approval: "none; draft import and mechanical verification do not approve publication",
    recipeId: recipe.recipeId, candidates: entries.map(entry => ({figureKey: entry.spec.figureKey,
      storySpecId: entry.spec.storySpecId, candidateSha256: entry.candidateSha256, stageSha256: entry.stageSha256,
      words: entry.passages.reduce((sum, passage) => sum + passage.words, 0), passages: entry.passages,
      draftErrors: 0, draftWarnings: 0, simulationErrors: 0, simulationWarnings: 0,
      canonicalProsePreserved: true, serializedReplay: true})) };
  writeFileSync(resolve(reportDirectory, "VERIFICATION.json"), JSON.stringify(validationReport, null, 2) + "\n");
  if (args[0] !== "--write") {
    console.log(JSON.stringify({ok: true, mode: "offline", stories: entries.length,
      words: validationReport.candidates.reduce((sum, item) => sum + item.words, 0),
      rhythmQualifications: validationReport.candidates.flatMap(item => item.passages.filter(p => p.rhythmQualification)
        .map(p => `${item.figureKey}/${p.role}`))}));
    return;
  }
  loadEnvLocal();
  const database = getSupabase();
  async function snapshot() {
    const results = await Promise.all([
      database.from("figures").select("key,display_name,birth_year,death_year").order("key"),
      database.from("figure_stages").select("figure_key,stage_id,stage_label,age_min,age_max,shape_sentences,facets,biographical_facts,themes,anti_themes,beats,sources,status").order("figure_key").order("stage_id"),
      database.from("story_specs").select("story_spec_id,figure_key,stage_id,version,schema_version,status,spec").order("story_spec_id"),
    ]);
    results.forEach(result => { if (result.error) throw new Error(`Database read failed (${result.error.code})`); });
    return {figures: results[0].data!, stages: results[1].data!, specs: results[2].data!};
  }
  const desired = {
    figures: entries.map(({stage}) => ({key: stage.figureKey, display_name: stage.displayName,
      birth_year: stage.birthYear ?? null, death_year: stage.deathYear ?? null})),
    stages: entries.map(({stage}) => ({figure_key: stage.figureKey, stage_id: stage.stageId,
      stage_label: stage.stageLabel, age_min: stage.ageMin, age_max: stage.ageMax,
      shape_sentences: stage.shapeSentences, facets: stage.facets, biographical_facts: stage.biographicalFacts,
      themes: stage.themes, anti_themes: stage.antiThemes, beats: stage.beats, sources: stage.sources})),
    specs: entries.map(({spec}) => ({story_spec_id: spec.storySpecId, figure_key: spec.figureKey,
      stage_id: spec.stageId, version: spec.version, schema_version: spec.schemaVersion, status: "draft", spec})),
  };
  const before = await snapshot();
  // Existing target rows are permitted only for exact, draft-only retry recovery.
  for (const target of desired.figures) {
    const existing = before.figures.find(row => row.key === target.key);
    if (existing) same(existing, target, `Existing figure differs: ${target.key}`);
  }
  for (const target of desired.stages) {
    const existing = before.stages.find(row => row.figure_key === target.figure_key && row.stage_id === target.stage_id);
    if (existing) same(existing, {...target, status: "draft"}, `Existing stage differs: ${target.figure_key}`);
    assert(!before.stages.some(row => row.figure_key === target.figure_key && row.stage_id !== target.stage_id),
      `Unexpected existing stage for new figure ${target.figure_key}`);
  }
  for (const target of desired.specs) {
    const existing = before.specs.find(row => row.story_spec_id === target.story_spec_id);
    if (existing) same(existing, target, `Existing StorySpec differs: ${target.story_spec_id}`);
    assert(!before.specs.some(row => row.figure_key === target.figure_key && row.story_spec_id !== target.story_spec_id),
      `Unexpected existing StorySpec for new figure ${target.figure_key}`);
  }
  const beforeHashes = Object.fromEntries(Object.entries(before).map(([key, rows]) => [key, sha(stable(rows))]));
  writeFileSync(resolve(directory, "DB-BEFORE.json"), JSON.stringify({capturedAt: new Date().toISOString(),
    beforeHashes, snapshot: before}, null, 2) + "\n");
  // Insert-only ON CONFLICT DO NOTHING, sequenced by foreign-key dependencies.
  // Omit stage status so the database-owned draft default applies.
  const figureResult = await database.from("figures").upsert(desired.figures, {onConflict: "key", ignoreDuplicates: true});
  if (figureResult.error) throw new Error(`Figure insert failed (${figureResult.error.code}); retry with exact inputs`);
  const stageResult = await database.from("figure_stages").upsert(desired.stages,
    {onConflict: "figure_key,stage_id", ignoreDuplicates: true, defaultToNull: false});
  if (stageResult.error) throw new Error(`Stage insert failed (${stageResult.error.code}); retry with exact inputs`);
  const specResult = await database.from("story_specs").upsert(desired.specs,
    {onConflict: "story_spec_id", ignoreDuplicates: true});
  if (specResult.error) throw new Error(`StorySpec insert failed (${specResult.error.code}); retry with exact inputs`);
  const after = await snapshot();
  desired.figures.forEach(target => same(after.figures.find(row => row.key === target.key), target, "Figure read-back differs"));
  desired.stages.forEach(target => same(after.stages.find(row => row.figure_key === target.figure_key && row.stage_id === target.stage_id),
    {...target, status: "draft"}, "Stage read-back differs"));
  desired.specs.forEach(target => same(after.specs.find(row => row.story_spec_id === target.story_spec_id), target, "StorySpec read-back differs"));
  for (const row of before.figures) same(after.figures.find(item => item.key === row.key), row, "Preexisting figure changed");
  for (const row of before.stages) same(after.stages.find(item => item.figure_key === row.figure_key && item.stage_id === row.stage_id), row, "Preexisting stage changed");
  for (const row of before.specs) same(after.specs.find(item => item.story_spec_id === row.story_spec_id), row, "Preexisting StorySpec changed");
  const afterUnrelated = {figures: after.figures.filter(row => !keys.has(row.key)),
    stages: after.stages.filter(row => !keys.has(row.figure_key)),
    specs: after.specs.filter(row => !keys.has(row.figure_key))};
  const beforeUnrelated = {figures: before.figures.filter(row => !keys.has(row.key)),
    stages: before.stages.filter(row => !keys.has(row.figure_key)),
    specs: before.specs.filter(row => !keys.has(row.figure_key))};
  same(afterUnrelated, beforeUnrelated, "Unrelated database catalog changed during import");
  for (const table of ["figures", "stages", "specs"] as const) {
    assert.equal(after[table].length, beforeUnrelated[table].length + 10, `${table}: final count differs`);
  }
  const receipt = { completedAt: new Date().toISOString(), mode: "draft-only-insert", verifiedNewStoryCount: 10,
    beforeCounts: {figures: before.figures.length, stages: before.stages.length, specs: before.specs.length},
    afterCounts: {figures: after.figures.length, stages: after.stages.length, specs: after.specs.length},
    publishedStoriesBefore: before.specs.filter(row => row.status === "published").length,
    publishedStoriesAfter: after.specs.filter(row => row.status === "published").length,
    preexistingCatalogUnchanged: true, databaseReadbackMatchesInputs: true,
    reviewMetadataEmpty: true, beforeHashes,
    targets: validationReport.candidates.map(item => ({figureKey: item.figureKey, storySpecId: item.storySpecId,
      candidateSha256: item.candidateSha256, stageSha256: item.stageSha256, words: item.words, status: "draft"})),
    approval: "No publication approval recorded or simulated metadata persisted" };
  writeFileSync(resolve(reportDirectory, "DATABASE-RECEIPT.json"), JSON.stringify(receipt, null, 2) + "\n");
  console.log(JSON.stringify(receipt, null, 2));
}
main().catch(error => { console.error(error instanceof Error ? error.message : "Batch failed"); process.exitCode = 1; });
