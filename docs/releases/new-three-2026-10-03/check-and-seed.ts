// Packet-specific draft import. Default is offline verification; --write loads
// the configured database and inserts only absent, byte-equivalent draft rows.
// It never refreshes existing content or invokes publication functions.
import "../../../scripts/_smoke-bootstrap";
import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
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
import { CHUNK_CHAR_LIMIT } from "../../../lib/chunks";
import { crisisRegexVersion } from "../../../lib/safety";
import { loadEnvLocal } from "../../../scripts/_load-env";
import { getSupabase } from "../../../lib/db";
import type { FigureStageRow, MatchRecipe } from "../../../lib/types";

const directory = resolve("docs/research/new-three-2026-10-03");
const reportDirectory = resolve("docs/releases/new-three-2026-10-03");
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
    "Usage: node --import tsx docs/releases/new-three-2026-10-03/check-and-seed.ts [--write]");
  const files = readdirSync(directory).filter(name => name.endsWith(".candidate.json")).sort();
  assert.equal(files.length, 3, "This batch must contain exactly three stories");
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
    keys.add(spec.figureKey); ids.add(spec.storySpecId);
    const stageBytes = readFileSync(resolve(directory, name.replace(".candidate.json", ".stage.json")));
    const stage = JSON.parse(stageBytes.toString("utf8")) as FigureStageRow;
    const installedTargets = FIGURE_STAGES.filter(value => value.figureKey === spec.figureKey);
    assert(installedTargets.length <= 1, `${name}: unexpected additional installed stage`);
    if (installedTargets[0]) same(installedTargets[0], stage, `${name}: installed proposal differs from frozen stage`);
    const completionDoc = readFileSync(resolve(reportDirectory, `${spec.figureKey}.md`), "utf8");
    assert(completionDoc.includes(sha(candidateBytes)) && completionDoc.includes(sha(stageBytes)),
      `${name}: completion document does not pin current inputs`);
    assert(spec.arc.every(beat => completionDoc.includes(beat.canonicalText)),
      `${name}: completion document reading copy differs`);
    same([stage.figureKey, stage.stageId, stage.ageMin, stage.ageMax],
      [spec.figureKey, spec.stageId, spec.episode.ageMin, spec.episode.ageMax], `${name}: stage identity/ages differ`);
    assert(stage.displayName?.trim() && stage.stageLabel?.trim() && stage.biographicalFacts?.trim(), `${name}: missing stage text`);
    assert(stage.shapeSentences.length >= 2 && stage.shapeSentences.length <= 3 && stage.shapeSentences.every(value => value.trim()), `${name}: invalid retrieval shapes`);
    same(Object.keys(stage.facets).sort(), ["agencyState", "decisionShape", "emotionalCore", "triggerEvent"], `${name}: invalid facet keys`);
    assert(Object.values(stage.facets).every(value => value.trim()), `${name}: invalid facets`);
    assert(stage.sources.length > 0, `${name}: stage has no sources`);
    assert([...stage.themes, ...stage.antiThemes].every(theme => THEME_VOCABULARY.includes(theme)), `${name}: theme outside controlled vocabulary`);
    same(stage.beats.map(beat => [beat.role, beat.text]),
      spec.arc.map(beat => [beat.role, beat.canonicalText]), `${name}: stage prose differs`);
    const draft = validateStorySpec(spec, { forPublish: false });
    // Temporary mechanical simulation only; never saved as a review or approval.
    const simulation = { ...spec, status: "published" as const, review: {
      researcherId: "validator-only-not-approval", historicalReviewerId: "validator-only-not-approval",
      toneReviewerId: "validator-only-not-approval", reviewedAt: "2026-10-03", contentProfileReviewed: true } };
    const simulated = validateStorySpec(simulation, { forPublish: true });
    assert(draft.valid && simulated.valid, `${name}: ${JSON.stringify({ draft, simulated })}`);
    assert.equal(draft.warnings.length + simulated.warnings.length, 0, `${name}: StorySpec warnings`);
    const artifact = composeCanonicalStoryArtifact({ storySpec: simulation, stage, matchRecipe,
      resonanceBrief: brief, framing: "partial", openingCopy: { eyebrow: NEUTRAL_EYEBROW,
        prefaceLines: DEFAULT_PREFACE_LINES }, now: new Date("2026-10-03T12:00:00Z") });
    same(artifact.beats.map(beat => beat.text), spec.arc.map(beat => beat.canonicalText), `${name}: composed prose differs`);
    assert.equal(artifact.contentHash, storyArtifactContentHash(artifact));
    assert(validateStoryArtifact(artifact, simulation, brief).valid, `${name}: invalid canonical artifact`);
    assert(validateStoredStoryArtifact(JSON.parse(JSON.stringify(artifact))), `${name}: replay rejected`);
    for (const beat of artifact.beats) {
      for (const chunk of beat.chunks) {
        assert(chunk.length <= CHUNK_CHAR_LIMIT, `${name}/${beat.role}: oversized reading chunk`);
        assert(/[.!?]["”']?\s*$/.test(chunk), `${name}/${beat.role}: reading chunk cuts a sentence`);
        const paragraphCount = chunk.split(/\n\n+/).filter(value => value.trim()).length;
        assert(paragraphCount >= 1 && paragraphCount <= 2, `${name}/${beat.role}: reading chunk must contain one or two paragraphs`);
      }
    }
    const passages = spec.arc.map(beat => {
      const lengths = splitCanonicalSentences(beat.canonicalText).map(countWords);
      const mean = lengths.reduce((sum, value) => sum + value, 0) / lengths.length;
      if (beat.role === "dark_moment") assert(countWords(beat.canonicalText) <= 180, `${name}: dark passage exceeds 180 words`);
      assert(!/\b(amazing|incredible|extraordinary|remarkable|inspiring|powerful|profound|journey|at least)\b/i.test(beat.canonicalText), `${name}/${beat.role}: prohibited register`);
      if (["scene", "dark_moment", "response", "turning_point"].includes(beat.role)) {
        assert(!/\b(often|would|used to|for years|during this period)\b/i.test(beat.canonicalText), `${name}/${beat.role}: compressed moment wording`);
      }
      return {role: beat.role, words: countWords(beat.canonicalText),
        chunks: artifact.beats.find(value => value.role === beat.role)!.chunks.length,
        sentenceMean: Number(mean.toFixed(2)), longestSentence: Math.max(...lengths),
        endingWords: lengths.at(-1), rhythmQualification: mean > 16 || Math.max(...lengths) > 28 ||
          lengths.at(-1) === Math.max(...lengths) || (beat.role === "bridge" && lengths.at(-1)! > 12)};
    });
    const words = passages.reduce((sum, passage) => sum + passage.words, 0);
    assert(words >= 700 && words <= 950, `${name}: story must contain 700-950 source-supported words`);
    assert(passages.every(passage => !passage.rhythmQualification), `${name}: unresolved sentence-rhythm constraint`);
    assert(spec.episode.ageMin >= 18 && spec.episode.ageMax <= 100, `${name}: this batch uses adult episodes within intake ages`);
    return {spec, stage, name, candidateSha256: sha(candidateBytes), stageSha256: sha(stageBytes), passages};
  });
  same([...keys].sort(), ["franklin_b", "slocum_j", "somerville_m"], "This packet must contain the three selected figures");
  const validationReport = { completedAt: new Date().toISOString(), expectedCount: 3,
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
      database.from("story_specs").select("story_spec_id,figure_key,stage_id,version,schema_version,status,spec,created_at,published_at,retired_at").order("story_spec_id"),
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
  assert.equal(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').hostname, 'mbcqkljfekkxlgittzal.supabase.co', 'Unexpected production database host');
  const before = await snapshot();
  // Match authored columns while preserving every lifecycle column in snapshots.
  function authoredSpec(row: (typeof before.specs)[number]) {
    return Object.fromEntries(Object.entries(row).filter(([key]) =>
      !["created_at", "published_at", "retired_at"].includes(key)));
  }
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
    if (existing) {
      same(authoredSpec(existing), target, `Existing StorySpec differs: ${target.story_spec_id}`);
      assert(existing.created_at && existing.published_at === null && existing.retired_at === null,
        `Existing draft lifecycle differs: ${target.story_spec_id}`);
    }
    assert(!before.specs.some(row => row.figure_key === target.figure_key && row.story_spec_id !== target.story_spec_id),
      `Unexpected existing StorySpec for new figure ${target.figure_key}`);
  }
  const beforeHashes = Object.fromEntries(Object.entries(before).map(([key, rows]) => [key, sha(stable(rows))]));
  const inputPins = validationReport.candidates.map(({storySpecId, candidateSha256, stageSha256}) =>
    ({storySpecId, candidateSha256, stageSha256}));
  const capturedAt = new Date().toISOString();
  const baselineBytes = JSON.stringify({capturedAt, inputPins, beforeHashes, snapshot: before}, null, 2) + "\n";
  const initialBaselinePath = resolve(directory, "DB-BEFORE.json");
  if (!existsSync(initialBaselinePath)) writeFileSync(initialBaselinePath, baselineBytes, {flag: "wx"});
  const initialBaselineBytes = readFileSync(initialBaselinePath);
  const initialBaseline = JSON.parse(initialBaselineBytes.toString("utf8")) as {
    inputPins: unknown; beforeHashes: Record<string, string>; snapshot: typeof before };
  same(initialBaseline.inputPins, inputPins, "Initial baseline belongs to different inputs; do not overwrite it");
  same(initialBaseline.beforeHashes, Object.fromEntries(Object.entries(initialBaseline.snapshot)
    .map(([key, rows]) => [key, sha(stable(rows))])), "Initial baseline hashes are inconsistent");
  function assertPreserved(snapshotToCheck: typeof before, original: typeof before): void {
    for (const row of original.figures) same(snapshotToCheck.figures.find(item => item.key === row.key), row, "Preexisting figure changed");
    for (const row of original.stages) same(snapshotToCheck.stages.find(item => item.figure_key === row.figure_key && item.stage_id === row.stage_id), row, "Preexisting stage changed");
    for (const row of original.specs) same(snapshotToCheck.specs.find(item => item.story_spec_id === row.story_spec_id), row, "Preexisting StorySpec changed");
  }
  function unrelated(snapshotToFilter: typeof before) {
    return {figures: snapshotToFilter.figures.filter(row => !keys.has(row.key)),
      stages: snapshotToFilter.stages.filter(row => !keys.has(row.figure_key)),
      specs: snapshotToFilter.specs.filter(row => !keys.has(row.figure_key))};
  }
  assertPreserved(before, initialBaseline.snapshot);
  same(unrelated(before), unrelated(initialBaseline.snapshot), "Unrelated catalog drifted since initial attempt");
  const attemptBaselineName = `DB-BEFORE-${capturedAt.replace(/[:.]/g, "-")}-${randomUUID()}.json`;
  const attemptBaselinePath = resolve(directory, attemptBaselineName);
  writeFileSync(attemptBaselinePath, baselineBytes, {flag: "wx"});
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
  desired.specs.forEach(target => {
    const row = after.specs.find(item => item.story_spec_id === target.story_spec_id);
    assert(row, "StorySpec read-back missing");
    same(authoredSpec(row), target, "StorySpec read-back differs");
    assert(row.created_at && row.published_at === null && row.retired_at === null, "Draft lifecycle read-back differs");
  });
  assertPreserved(after, before);
  assertPreserved(after, initialBaseline.snapshot);
  const afterUnrelated = unrelated(after);
  const beforeUnrelated = unrelated(before);
  same(afterUnrelated, beforeUnrelated, "Unrelated database catalog changed during import");
  for (const table of ["figures", "stages", "specs"] as const) {
    assert.equal(after[table].length, beforeUnrelated[table].length + 3, `${table}: final count differs`);
  }
  const receipt = { completedAt: new Date().toISOString(), mode: "draft-only-insert", verifiedNewStoryCount: 3,
    beforeCounts: {figures: before.figures.length, stages: before.stages.length, specs: before.specs.length},
    afterCounts: {figures: after.figures.length, stages: after.stages.length, specs: after.specs.length},
    publishedStoriesBefore: before.specs.filter(row => row.status === "published").length,
    publishedStoriesAfter: after.specs.filter(row => row.status === "published").length,
    preexistingCatalogUnchanged: true, databaseReadbackMatchesInputs: true,
    reviewMetadataEmpty: true, beforeHashes,
    initialBaseline: {path: "docs/research/new-three-2026-10-03/DB-BEFORE.json", sha256: sha(initialBaselineBytes)},
    attemptBaseline: {path: `docs/research/new-three-2026-10-03/${attemptBaselineName}`, sha256: sha(baselineBytes)},
    targets: validationReport.candidates.map(item => ({figureKey: item.figureKey, storySpecId: item.storySpecId,
      candidateSha256: item.candidateSha256, stageSha256: item.stageSha256, words: item.words, status: "draft"})),
    approval: "No publication approval recorded or simulated metadata persisted" };
  writeFileSync(resolve(reportDirectory, "DATABASE-RECEIPT.json"), JSON.stringify(receipt, null, 2) + "\n");
  console.log(JSON.stringify(receipt, null, 2));
}
main().catch(error => { console.error(error instanceof Error ? error.message : "Batch failed"); process.exitCode = 1; });
