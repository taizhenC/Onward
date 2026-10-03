// Packet-specific writing verification and guarded updates of existing drafts.
// Default is offline. Capture the DB baseline before authoring, then use --write
// only after final independent review. Neither mode publishes anything.
import "../../../scripts/_smoke-bootstrap";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { getSupabase } from "../../../lib/db";
import { loadEnvLocal } from "../../../scripts/_load-env";
import { parseStorySpecDocument, validateStorySpec } from "../../../lib/story-spec";
import { countWords, splitCanonicalSentences } from "../../../lib/story-sentences";
import { THEME_VOCABULARY } from "../../../lib/themes";
import { composeCanonicalStoryArtifact, storyArtifactContentHash,
  validateStoryArtifact, validateStoredStoryArtifact } from "../../../lib/story-artifact";
import { PRIMARY_STORY_RECIPE } from "../../../lib/story-recipe";
import { createResonanceBrief } from "../../../lib/resonance-brief";
import { DEFAULT_PREFACE_LINES, NEUTRAL_EYEBROW } from "../../../lib/opening-copy";
import { crisisRegexVersion } from "../../../lib/safety";
import type { FigureStageRow, MatchRecipe } from "../../../lib/types";

const inputDirectory = resolve("docs/research/new-stories-2026-10-02");
const packetDirectory = resolve("docs/releases/new-stories-written-2026-10-02");
const baselinePath = resolve(inputDirectory, "WRITING-DB-BASELINE.json");
const insertionReceipt = JSON.parse(readFileSync(resolve(
  "docs/releases/new-stories-2026-10-02/DATABASE-RECEIPT.json"), "utf8")) as {
  targets: Array<{ figureKey: string; storySpecId: string }>;
};
const keys = new Set(insertionReceipt.targets.map(item => item.figureKey));
const sha = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");
function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}
const equal = (a: unknown, b: unknown) => stable(a) === stable(b);
const same = (a: unknown, b: unknown, message: string) => assert(equal(a, b), message);
async function snapshot() {
  loadEnvLocal();
  const database = getSupabase();
  const results = await Promise.all([
    database.from("figures").select("key,display_name,birth_year,death_year").order("key"),
    database.from("figure_stages").select("figure_key,stage_id,stage_label,age_min,age_max,shape_sentences,facets,biographical_facts,themes,anti_themes,beats,sources,status").order("figure_key").order("stage_id"),
    database.from("story_specs").select("story_spec_id,figure_key,stage_id,version,schema_version,status,spec").order("story_spec_id"),
  ]);
  results.forEach(result => { if (result.error) throw new Error(`DB snapshot failed (${result.error.code})`); });
  return { figures: results[0].data!, stages: results[1].data!, specs: results[2].data! };
}
type Snapshot = Awaited<ReturnType<typeof snapshot>>;
type Baseline = { capturedAt: string; snapshot: Snapshot };
const budgets = {scene: [90, 140], dark_moment: [120, 180], response: [90, 130],
  struggle: [100, 150], turning_point: [130, 180], became: [100, 150], bridge: [60, 120]} as const;

async function main() {
  const args = process.argv.slice(2);
  const figure = args[0]?.startsWith("--figure=") ? args[0].slice("--figure=".length) : undefined;
  assert(args.length === 0 || (args.length === 1 && (["--capture-baseline", "--write"].includes(args[0]) || (figure && keys.has(figure)))),
    "Usage: node --import tsx docs/releases/new-stories-written-2026-10-02/check-and-update.ts [--capture-baseline|--write|--figure=key]");
  assert.equal(keys.size, 10);
  if (args[0] === "--capture-baseline") {
    assert(!existsSync(baselinePath), "Baseline already exists; do not replace the authoring baseline");
    const before = await snapshot();
    for (const target of insertionReceipt.targets) {
      const row = before.specs.find(item => item.story_spec_id === target.storySpecId);
      assert(row && row.status === "draft", `${target.figureKey}: original draft missing or handed to review`);
      const spec = parseStorySpecDocument(row.spec);
      assert(spec && spec.status === "draft");
      same(spec.review, {}, `${target.figureKey}: existing review metadata`);
      const stage = before.stages.find(item => item.figure_key === spec.figureKey && item.stage_id === spec.stageId);
      assert(stage && stage.status === "draft");
      const originalDoc = readFileSync(resolve("docs/releases/new-stories-2026-10-02", `${spec.figureKey}.md`), "utf8");
      assert(spec.arc.every(beat => originalDoc.includes(beat.canonicalText)), `${target.figureKey}: baseline differs from preserved reading copy`);
    }
    writeFileSync(baselinePath, JSON.stringify({capturedAt: new Date().toISOString(), snapshot: before}, null, 2) + "\n");
    console.log(JSON.stringify({ok: true, mode: "baseline", existingDrafts: 10}));
    return;
  }

  const files = readdirSync(inputDirectory).filter(name => name.endsWith(".candidate.json")).sort();
  assert.equal(files.length, 10);
  const seen = new Set<string>();
  const recipe = PRIMARY_STORY_RECIPE;
  const matchRecipe: MatchRecipe = {...recipe, recipeManifestHash: recipe.manifestSha256,
    deploymentVersion: "new-stories-written-offline", crisisRegexVersion};
  const brief = createResonanceBrief("A synthetic editorial fixture with an amber compass.");
  const entries = files.filter(name => !figure || name.startsWith(`${figure}-`) || name === `${figure}.candidate.json`).map(name => {
    const bytes = readFileSync(resolve(inputDirectory, name));
    const spec = parseStorySpecDocument(JSON.parse(bytes.toString("utf8")));
    assert(spec && spec.status === "draft", `${name}: invalid draft`);
    assert(keys.has(spec.figureKey) && !seen.has(spec.figureKey));
    seen.add(spec.figureKey);
    same(spec.review, {}, `${name}: review must remain empty`);
    assert(insertionReceipt.targets.some(item => item.storySpecId === spec.storySpecId), `${name}: identity change requires a new integration decision`);
    const stageBytes = readFileSync(resolve(inputDirectory, name.replace(".candidate.json", ".stage.json")));
    const stage = JSON.parse(stageBytes.toString("utf8")) as FigureStageRow;
    same([stage.figureKey, stage.stageId, stage.ageMin, stage.ageMax],
      [spec.figureKey, spec.stageId, spec.episode.ageMin, spec.episode.ageMax], `${name}: stage identity/age mismatch`);
    same(stage.beats.map(beat => [beat.role, beat.text]), spec.arc.map(beat => [beat.role, beat.canonicalText]), `${name}: prose mismatch`);
    assert([...stage.themes, ...stage.antiThemes].every(theme => THEME_VOCABULARY.includes(theme)), `${name}: uncontrolled theme`);
    assert(stage.displayName.trim() && stage.stageLabel.trim() && stage.biographicalFacts.trim());
    assert(stage.shapeSentences.length && Object.keys(stage.facets).length === 4 && stage.sources.length);
    const doc = readFileSync(resolve(packetDirectory, `${spec.figureKey}.md`), "utf8");
    assert(doc.includes(sha(bytes)) && doc.includes(sha(stageBytes)), `${name}: current hashes absent from writing document`);
    assert(spec.arc.every(beat => doc.includes(beat.canonicalText)), `${name}: writing document prose differs`);
    const draft = validateStorySpec(spec, {forPublish: false});
    const simulation = {...spec, status: "published" as const, review: {
      researcherId: "simulation-not-approval", historicalReviewerId: "simulation-not-approval",
      toneReviewerId: "simulation-not-approval", reviewedAt: "2026-10-02", contentProfileReviewed: true}};
    const simulated = validateStorySpec(simulation, {forPublish: true});
    assert(draft.valid && simulated.valid && !draft.warnings.length && !simulated.warnings.length,
      `${name}: ${JSON.stringify({draft, simulated})}`);
    const passages = spec.arc.map(beat => {
      const paragraphs = beat.canonicalText.split(/\n\s*\n/).filter(value => value.trim()).length;
      if (beat.role !== "bridge") assert(paragraphs >= 1 && paragraphs <= 2, `${name}/${beat.role}: reading step must contain one or two paragraphs`);
      const lengths = splitCanonicalSentences(beat.canonicalText).map(countWords);
      const words = countWords(beat.canonicalText);
      const mean = lengths.reduce((sum, n) => sum + n, 0) / lengths.length;
      const longest = Math.max(...lengths);
      const ending = lengths.at(-1)!;
      const budget = budgets[beat.role];
      // The recipe labels passage budgets as targets. Report departures for
      // editorial review; enforce its total length and explicit dark cap.
      if (beat.role === "dark_moment") assert(words <= 180, `${name}: dark passage exceeds180words`);
      assert(mean <= 16 && longest <= 28 && ending < longest && (beat.role !== "bridge" || ending <= 12), `${name}/${beat.role}: sentence rhythm failed`);
      assert(!/\b(amazing|incredible|extraordinary|remarkable|inspiring|powerful|profound|journey)\b/i.test(beat.canonicalText), `${name}/${beat.role}: banned intensifier`);
      assert(!/\bat least\b/i.test(beat.canonicalText), `${name}/${beat.role}: banned comparison`);
      if (["scene", "dark_moment", "response", "turning_point"].includes(beat.role)) {
        assert(!/\b(often|would|used to|for years|during this period)\b/i.test(beat.canonicalText), `${name}/${beat.role}: compressed-moment wording`);
      }
      return {role: beat.role, words, paragraphs, targetWords: budget, outsideTarget: words < budget[0] || words > budget[1],
        sentenceMean: Number(mean.toFixed(2)), longestSentence: longest, endingWords: ending};
    });
    const words = passages.reduce((sum, passage) => sum + passage.words, 0);
    assert(words >= 700 && words <= 950, `${name}: ${words} words outside 700–950`);
    const artifact = composeCanonicalStoryArtifact({storySpec: simulation, stage, matchRecipe,
      resonanceBrief: brief, framing: "partial", openingCopy: {eyebrow: NEUTRAL_EYEBROW, prefaceLines: DEFAULT_PREFACE_LINES},
      now: new Date("2026-10-02T12:00:00Z")});
    same(artifact.beats.map(beat => beat.text), spec.arc.map(beat => beat.canonicalText), `${name}: composer changed prose`);
    assert.equal(artifact.contentHash, storyArtifactContentHash(artifact));
    assert(validateStoryArtifact(artifact, simulation, brief).valid && validateStoredStoryArtifact(JSON.parse(JSON.stringify(artifact))), `${name}: composition/replay failed`);
    return {spec, stage, candidateSha256: sha(bytes), stageSha256: sha(stageBytes), words, passages};
  });
  const verification = {completedAt: new Date().toISOString(), storyCount: entries.length,
    approval: "None; mechanical checks and agent reviews do not approve publication",
    candidates: entries.map(({spec, candidateSha256, stageSha256, words, passages}) => ({figureKey: spec.figureKey,
      storySpecId: spec.storySpecId, candidateSha256, stageSha256, words, passages,
      draftErrors: 0, draftWarnings: 0, simulationErrors: 0, simulationWarnings: 0,
      canonicalProsePreserved: true, serializedReplay: true}))};
  writeFileSync(resolve(packetDirectory, figure ? `VERIFICATION-${figure}.json` : "VERIFICATION.json"), JSON.stringify(verification, null, 2) + "\n");
  if (args[0] !== "--write") {
    console.log(JSON.stringify({ok: true, mode: "offline", stories: entries.length, words: entries.reduce((sum, entry) => sum + entry.words, 0)}));
    return;
  }

  const reviewText = readdirSync(packetDirectory).filter(name => name.startsWith("CROSS-REVIEW-") && name.endsWith(".md"))
    .map(name => readFileSync(resolve(packetDirectory, name), "utf8")).join("\n");
  assert(entries.every(entry => reviewText.includes(entry.candidateSha256) && reviewText.includes(entry.stageSha256)), "Final independent review hashes missing");
  const baseline = (JSON.parse(readFileSync(baselinePath, "utf8")) as Baseline).snapshot;
  const before = await snapshot();
  const database = getSupabase();
  const desired = entries.map(({spec, stage}) => ({
    spec: {story_spec_id: spec.storySpecId, figure_key: spec.figureKey, stage_id: spec.stageId,
      version: spec.version, schema_version: spec.schemaVersion, status: "draft", spec},
    stage: {figure_key: stage.figureKey, stage_id: stage.stageId, stage_label: stage.stageLabel,
      age_min: stage.ageMin, age_max: stage.ageMax, shape_sentences: stage.shapeSentences, facets: stage.facets,
      biographical_facts: stage.biographicalFacts, themes: stage.themes, anti_themes: stage.antiThemes,
      beats: stage.beats, sources: stage.sources, status: "draft"},
  }));
  for (const target of desired) {
    const originalSpec = baseline.specs.find(row => row.story_spec_id === target.spec.story_spec_id);
    const originalStage = baseline.stages.find(row => row.figure_key === target.stage.figure_key && row.stage_id === target.stage.stage_id);
    const currentSpec = before.specs.find(row => row.story_spec_id === target.spec.story_spec_id);
    const currentStage = before.stages.find(row => row.figure_key === target.stage.figure_key && row.stage_id === target.stage.stage_id);
    assert(originalSpec && originalStage && originalSpec.status === "draft" && originalStage.status === "draft");
    assert(equal(currentSpec, originalSpec) || equal(currentSpec, target.spec), `${target.spec.figure_key}: draft changed since baseline`);
    assert(equal(currentStage, originalStage) || equal(currentStage, target.stage), `${target.spec.figure_key}: stage changed since baseline`);
  }
  writeFileSync(resolve(inputDirectory, "WRITING-DB-BEFORE-UPDATE.json"), JSON.stringify(before, null, 2) + "\n");
  for (const target of desired) {
    const currentSpec = before.specs.find(row => row.story_spec_id === target.spec.story_spec_id)!;
    const currentStage = before.stages.find(row => row.figure_key === target.stage.figure_key && row.stage_id === target.stage.stage_id)!;
    if (!equal(currentSpec, target.spec)) {
      const check = await database.from("story_specs").select("story_spec_id,figure_key,stage_id,version,schema_version,status,spec")
        .eq("story_spec_id", target.spec.story_spec_id).single();
      if (check.error) throw new Error(`Draft recheck failed (${check.error.code})`);
      same(check.data, currentSpec, `${target.spec.figure_key}: concurrent draft edit`);
      const previous = parseStorySpecDocument(currentSpec.spec)!;
      const result = await database.from("story_specs").update({spec: target.spec.spec})
        .eq("story_spec_id", target.spec.story_spec_id).eq("status", "draft")
        .eq("spec->review", "{}").eq("spec->arc->0->>canonicalText", previous.arc[0].canonicalText).select("story_spec_id");
      if (result.error) throw new Error(`Draft update failed (${result.error.code}); exact-input retry is supported`);
      assert.equal(result.data?.length, 1, "Draft guard rejected update");
    }
    if (!equal(currentStage, target.stage)) {
      const check = await database.from("figure_stages").select("figure_key,stage_id,stage_label,age_min,age_max,shape_sentences,facets,biographical_facts,themes,anti_themes,beats,sources,status")
        .eq("figure_key", target.stage.figure_key).eq("stage_id", target.stage.stage_id).single();
      if (check.error) throw new Error(`Stage recheck failed (${check.error.code})`);
      same(check.data, currentStage, `${target.spec.figure_key}: concurrent stage edit`);
      const {figure_key, stage_id, status, ...content} = target.stage;
      const result = await database.from("figure_stages").update(content).eq("figure_key", figure_key).eq("stage_id", stage_id)
        .eq("status", status).eq("biographical_facts", currentStage.biographical_facts)
        .eq("beats->0->>text", (currentStage.beats as Array<{text: string}>)[0].text).select("stage_id");
      if (result.error) throw new Error(`Stage update failed (${result.error.code}); exact-input retry is supported`);
      assert.equal(result.data?.length, 1, "Stage guard rejected update");
    }
  }
  const after = await snapshot();
  desired.forEach(target => {
    same(after.specs.find(row => row.story_spec_id === target.spec.story_spec_id), target.spec, "Draft read-back differs");
    same(after.stages.find(row => row.figure_key === target.stage.figure_key && row.stage_id === target.stage.stage_id), target.stage, "Stage read-back differs");
  });
  same(after.figures, before.figures, "Figure metadata changed");
  const targetSpecIds = new Set(desired.map(target => target.spec.story_spec_id));
  const targetStageIds = new Set(desired.map(target => `${target.stage.figure_key}:${target.stage.stage_id}`));
  same(after.specs.filter(row => !targetSpecIds.has(row.story_spec_id)), before.specs.filter(row => !targetSpecIds.has(row.story_spec_id)), "Unrelated StorySpecs changed");
  same(after.stages.filter(row => !targetStageIds.has(`${row.figure_key}:${row.stage_id}`)), before.stages.filter(row => !targetStageIds.has(`${row.figure_key}:${row.stage_id}`)), "Unrelated stages changed");
  const receipt = {completedAt: new Date().toISOString(), mode: "existing-draft-update", verifiedStoryCount: 10,
    databaseReadbackMatchesInputs: true, figureMetadataUnchanged: true, unrelatedCatalogUnchanged: true,
    beforeCounts: {figures: before.figures.length, stages: before.stages.length, specs: before.specs.length},
    afterCounts: {figures: after.figures.length, stages: after.stages.length, specs: after.specs.length},
    publishedStoriesBefore: before.specs.filter(row => row.status === "published").length,
    publishedStoriesAfter: after.specs.filter(row => row.status === "published").length,
    approval: "None; all ten remain draft with empty review metadata",
    targets: verification.candidates.map(item => ({...item, status: "draft"}))};
  writeFileSync(resolve(packetDirectory, "DATABASE-RECEIPT.json"), JSON.stringify(receipt, null, 2) + "\n");
  console.log(JSON.stringify({ok: true, mode: receipt.mode, stories: 10, afterCounts: receipt.afterCounts,
    publishedStories: receipt.publishedStoriesAfter}));
}
main().catch(error => {console.error(error instanceof Error ? error.message : "Packet check failed"); process.exitCode = 1;});
