// Exactly two draft-only theme additions. --preflight reads DB; --apply requires
// the separately passed and hash-pinned matching gate. No publication/deploy.
import "../../../scripts/_smoke-bootstrap";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { getSupabase } from "../../../lib/db";
import { inspectPublishedStorySpecRows } from "../../../lib/story-spec-repository";
import { parseStorySpecDocument, validateStorySpec } from "../../../lib/story-spec";
import type { StorySpec } from "../../../lib/story-spec-types";
import { THEME_VOCABULARY } from "../../../lib/themes";
import type { FigureStageRow } from "../../../lib/types";
import { loadEnvLocal } from "../../../scripts/_load-env";

const packet = resolve("docs/releases/new-stories-production-2026-10-02");
const inputs = resolve("docs/research/new-stories-2026-10-02");
const writing = resolve("docs/releases/new-stories-written-2026-10-02");
const proposedDirectory = resolve(packet, "proposed-stages");
const projectHost = "mbcqkljfekkxlgittzal.supabase.co";
const approvedProposalHash = "5998bcf03e3e9ae672bd4721e1262e2c6dd992618ac6a9486a53f0b3578d838b";
const additions = {jacobs: "self_invention", riis: "late_start"} as const;
const specColumns = "story_spec_id,figure_key,stage_id,version,schema_version,status,spec,created_at,published_at,retired_at";
const stageColumns = "figure_key,stage_id,stage_label,age_min,age_max,shape_sentences,facets,biographical_facts,themes,anti_themes,beats,sources,status";
const sha = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");
function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value !== null && typeof value === "object") return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b))
    .map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`).join(",")}}`;
  return JSON.stringify(value);
}
const same = (left: unknown, right: unknown, message: string) => assert(stable(left) === stable(right), message);
const equal = (left: unknown, right: unknown) => stable(left) === stable(right);
function json<T>(path: string): T {return JSON.parse(readFileSync(path, "utf8")) as T;}
function once(path: string, value: unknown) {
  if (existsSync(path)) same(json(path), value, "Existing theme receipt differs");
  else writeFileSync(path, JSON.stringify(value, null, 2) + "\n", {flag: "wx"});
  return sha(readFileSync(path));
}
type EditorialRow = Record<string, unknown>;
type StageRow = EditorialRow & {figure_key: string; stage_id: string; status: string; themes: string[]};
type SpecRow = EditorialRow & {story_spec_id: string; figure_key: string; stage_id: string; status: string; spec: unknown};
type Catalog = {figures: EditorialRow[]; stages: StageRow[]; specs: SpecRow[]};
type Input = {figureKey: string; storySpecId: string; candidateSha256: string; stageSha256: string;
  productionStageSha256: string; original: FigureStageRow; proposed: FigureStageRow; draft: StorySpec};
type Pins = {schemaVersion: "new-ten-approved-themes-selection-v1"; capturedAt: string; projectHost: string;
  installedRepository: string; proposalSha256: string; independentThemeReviewSha256: string;
  writingReceiptSha256: string; productionTargetProofSha256: string; inputs: Input[]};
type Baseline = {capturedAt: string; selectionSha256: string; catalog: Catalog};
type Gate = {schemaVersion: "new-ten-matching-release-gate-v1"; ok: true; completedAt: string;
  librarySha256: string; evidenceIds: string[]; checks: {realProviderTrustGate: true; recipeGovernance: true; unchangedRecipeSelection: true};
  targets: Array<{figureKey: string; candidateSha256: string; stageSha256: string; productionStageSha256: string}>};
function row(stage: FigureStageRow): StageRow {
  return {figure_key: stage.figureKey, stage_id: stage.stageId, stage_label: stage.stageLabel,
    age_min: stage.ageMin, age_max: stage.ageMax, shape_sentences: stage.shapeSentences,
    facets: stage.facets, biographical_facts: stage.biographicalFacts, themes: stage.themes,
    anti_themes: stage.antiThemes, beats: stage.beats, sources: stage.sources, status: "draft"};
}
function coreSpec(row: SpecRow) {
  return {story_spec_id: row.story_spec_id, figure_key: row.figure_key, stage_id: row.stage_id,
    version: row.version, schema_version: row.schema_version, status: row.status, spec: row.spec};
}
function health(catalog: Catalog) {
  const published = catalog.specs.filter(row => row.status === "published");
  const inspection = inspectPublishedStorySpecRows(published.map(coreSpec));
  assert.equal(published.length, 34); assert.equal(inspection.catalog.size, 34); assert.equal(inspection.quarantinedRowCount, 0);
  const keys = new Set(published.map(row => `${row.figure_key}:${row.stage_id}`));
  catalog.stages.forEach(stage => assert.equal(stage.status === "published", keys.has(`${stage.figure_key}:${stage.stage_id}`), "Publication parity changed"));
}
async function snapshot(): Promise<Catalog> {
  const db = getSupabase();
  const results = await Promise.all([
    db.from("figures").select("key,display_name,birth_year,death_year").order("key"),
    db.from("figure_stages").select(stageColumns).order("figure_key").order("stage_id"),
    db.from("story_specs").select(specColumns).order("story_spec_id"),
  ]);
  results.forEach(result => {if (result.error) throw new Error(`Theme snapshot failed (${result.error.code})`);});
  return {figures: results[0].data as EditorialRow[], stages: results[1].data as StageRow[], specs: results[2].data as SpecRow[]};
}
function readInputs(): Input[] {
  const proposalBytes = readFileSync(resolve(packet, "THEME-PROPOSAL.json"));
  assert.equal(sha(proposalBytes), approvedProposalHash, "Reviewed theme proposal changed");
  const proposal = JSON.parse(proposalBytes.toString("utf8")) as {stages: Array<{figureKey: string; file: string; originalSha256: string; proposedSha256: string; changedFields: string[]}>};
  assert.equal(proposal.stages.length, 10);
  const writingReceipt = json<{verifiedStoryCount: number; targets: Array<{figureKey: string; storySpecId: string; candidateSha256: string; stageSha256: string}>}>(resolve(writing, "DATABASE-RECEIPT.json"));
  assert.equal(writingReceipt.verifiedStoryCount, 10);
  assert.equal(readdirSync(proposedDirectory).filter(name => name.endsWith(".stage.json")).length, 10);
  const review = readFileSync(resolve(packet, "THEME-REVIEW.md"), "utf8");
  assert(review.includes(approvedProposalHash), "Independent theme review does not pin the proposal");
  const result = proposal.stages.map(pin => {
    assert(!pin.file.includes("/") && !pin.file.includes("\\") && pin.file.endsWith(".stage.json"), "Invalid proposal file");
    const originalBytes = readFileSync(resolve(inputs, pin.file)); const proposedBytes = readFileSync(resolve(proposedDirectory, pin.file));
    const stageSha256 = sha(originalBytes); const productionStageSha256 = sha(proposedBytes);
    assert.equal(stageSha256, pin.originalSha256); assert.equal(productionStageSha256, pin.proposedSha256);
    const original = JSON.parse(originalBytes.toString("utf8")) as FigureStageRow;
    const proposed = JSON.parse(proposedBytes.toString("utf8")) as FigureStageRow;
    assert.equal(original.figureKey, pin.figureKey); same({...proposed, themes: original.themes}, original, "A production stage changes more than themes");
    const addition = additions[pin.figureKey as keyof typeof additions];
    if (addition) {
      same(proposed.themes, [...original.themes, addition], "The exact approved theme addition differs");
      same(pin.changedFields, ["themes"], "Proposal does not identify the approved theme-only edit");
      assert(review.includes(stageSha256) && review.includes(productionStageSha256), "Theme review lacks exact input pins");
    } else {
      assert.equal(stageSha256, productionStageSha256, "Unapproved stage changed"); same(pin.changedFields, [], "Unapproved changed field");
    }
    assert(new Set(proposed.themes).size === proposed.themes.length && proposed.themes.every(theme => THEME_VOCABULARY.includes(theme)), "Uncontrolled or duplicate themes");
    const candidateBytes = readFileSync(resolve(inputs, pin.file.replace(".stage.json", ".candidate.json")));
    const candidateSha256 = sha(candidateBytes); const draft = parseStorySpecDocument(JSON.parse(candidateBytes.toString("utf8")));
    assert(draft && draft.status === "draft"); same(draft.review, {}, "Candidate has review metadata");
    const validation = validateStorySpec(draft, {forPublish: false}); assert(validation.valid && !validation.warnings.length, "Candidate validation failed");
    const written = writingReceipt.targets.find(target => target.figureKey === pin.figureKey);
    assert(written && written.storySpecId === draft.storySpecId && written.candidateSha256 === candidateSha256 && written.stageSha256 === stageSha256, "Inputs differ from completed writing receipt");
    same([original.figureKey, original.stageId, original.ageMin, original.ageMax], [draft.figureKey, draft.stageId, draft.episode.ageMin, draft.episode.ageMax], "Stage identity or age differs");
    same(original.beats.map(beat => [beat.role, beat.text]), draft.arc.map(beat => [beat.role, beat.canonicalText]), "Stage prose differs from candidate");
    return {figureKey: pin.figureKey, storySpecId: draft.storySpecId, candidateSha256, stageSha256,
      productionStageSha256, original, proposed, draft};
  });
  assert.equal(new Set(result.map(input => input.figureKey)).size, 10);
  same(result.filter(input => input.stageSha256 !== input.productionStageSha256).map(input => input.figureKey).sort(), ["jacobs", "riis"], "Exactly the two approved stages must change");
  return result;
}
function state(catalog: Catalog, target: Input): "original" | "applied" {
  const actual = catalog.stages.find(stage => stage.figure_key === target.figureKey && stage.stage_id === target.original.stageId);
  assert(actual && actual.status === "draft", `${target.figureKey}: expected an exact draft stage`);
  if (equal(actual, row(target.original))) return "original";
  same(actual, row(target.proposed), `${target.figureKey}: draft stage differs from both frozen states`);
  return "applied";
}
function preserve(current: Catalog, baseline: Baseline, inputs: Input[]) {
  health(current);
  same(current.figures, baseline.catalog.figures, "Figure metadata changed");
  same(current.specs, baseline.catalog.specs, "A StorySpec or lifecycle timestamp changed during theme update");
  const targets = inputs.filter(input => input.figureKey in additions);
  const keys = new Set(targets.map(target => `${target.figureKey}:${target.original.stageId}`));
  same(current.stages.filter(stage => !keys.has(`${stage.figure_key}:${stage.stage_id}`)),
    baseline.catalog.stages.filter(stage => !keys.has(`${stage.figure_key}:${stage.stage_id}`)), "An unrelated stage changed");
  inputs.forEach(input => state(current, input));
  return targets.map(target => state(current, target));
}
async function gate(path: string, expectedSha256: string, selection: Pins) {
  assert(/^[a-f0-9]{64}$/.test(expectedSha256)); assert.equal(sha(readFileSync(path)), expectedSha256, "Matching gate changed");
  const receipt = json<Gate>(path); assert.equal(receipt.schemaVersion, "new-ten-matching-release-gate-v1"); assert.equal(receipt.ok, true);
  assert(Number.isFinite(Date.parse(receipt.completedAt)), "Matching gate completion time missing");
  same(receipt.checks, {realProviderTrustGate: true, recipeGovernance: true, unchangedRecipeSelection: true}, "Matching gate has not passed required checks");
  same([...receipt.targets].sort((a, b) => a.figureKey.localeCompare(b.figureKey)), selection.inputs.map(({figureKey, candidateSha256, stageSha256, productionStageSha256}) =>
    ({figureKey, candidateSha256, stageSha256, productionStageSha256})).sort((a, b) => a.figureKey.localeCompare(b.figureKey)), "Gate differs from approved stage inputs");
  const libraryPath = resolve(selection.installedRepository, "lib/figures-data.ts"); assert.equal(receipt.librarySha256, sha(readFileSync(libraryPath)));
  const latest = json<{releases: Array<{sha256: string; evidenceIds: string[]}>}>(resolve(selection.installedRepository, "config/figure-library-releases.json")).releases.at(-1)!;
  assert.equal(latest.sha256, receipt.librarySha256); assert(receipt.evidenceIds.length > 0); same(receipt.evidenceIds, latest.evidenceIds, "Newest release evidence differs");
  const {FIGURE_STAGES} = await import(pathToFileURL(libraryPath).href) as {FIGURE_STAGES: FigureStageRow[]};
  selection.inputs.forEach(input => same(FIGURE_STAGES.find(stage => stage.figureKey === input.figureKey && stage.stageId === input.original.stageId), input.proposed,
    `${input.figureKey}: installed production stage differs`));
  return receipt;
}
async function main() {
  const args = process.argv.slice(2); const mode = args[0];
  assert(mode === "--preflight" || mode === "--apply", "Usage: apply-approved-themes.ts --preflight --installed-repository=<path> | --apply --matching-gate=<path> --matching-gate-sha256=<hash>");
  const flags = ["--installed-repository=", "--matching-gate=", "--matching-gate-sha256="];
  assert(args.slice(1).every(arg => flags.some(flag => arg.startsWith(flag))), "Unexpected arguments");
  assert(flags.every(flag => args.filter(arg => arg.startsWith(flag)).length <= 1), "Duplicate flags");
  if (mode === "--preflight") assert(!args.some(arg => arg.startsWith("--matching-gate")), "Read-only preflight does not approve a matching gate");
  loadEnvLocal(); assert.equal(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname, projectHost, "Wrong production target");
  const productionTargetProofPath = resolve(packet, "PRODUCTION-TARGET-PROOF.json");
  const targetProof = json<{ok: boolean; publicSupabaseHostname: string; localSupabaseHostname: string; localTargetMatchesCurrentProductionBundle: boolean}>(productionTargetProofPath);
  assert(targetProof.ok && targetProof.localTargetMatchesCurrentProductionBundle && targetProof.publicSupabaseHostname === projectHost && targetProof.localSupabaseHostname === projectHost,
    "Independent production-target proof missing or mismatched");
  const selectionPath = resolve(packet, "THEME-UPDATE-SELECTION.json"); const baselinePath = resolve(packet, "THEME-UPDATE-BASELINE.json");
  const installedArg = args.find(arg => arg.startsWith("--installed-repository="));
  let selection: Pins;
  if (existsSync(selectionPath)) {
    selection = json<Pins>(selectionPath); assert.equal(selection.schemaVersion, "new-ten-approved-themes-selection-v1"); assert.equal(selection.projectHost, projectHost);
    if (installedArg) assert.equal(resolve(installedArg.slice("--installed-repository=".length)), selection.installedRepository);
    assert.equal(selection.proposalSha256, approvedProposalHash);
    assert.equal(selection.independentThemeReviewSha256, sha(readFileSync(resolve(packet, "THEME-REVIEW.md"))));
    assert.equal(selection.writingReceiptSha256, sha(readFileSync(resolve(writing, "DATABASE-RECEIPT.json"))));
    assert.equal(selection.productionTargetProofSha256, sha(readFileSync(productionTargetProofPath)));
    same(readInputs(), selection.inputs, "Frozen theme inputs changed");
  } else {
    assert(mode === "--preflight" && installedArg, "Create a read-only preflight with the production checkout first");
    selection = {schemaVersion: "new-ten-approved-themes-selection-v1", capturedAt: new Date().toISOString(), projectHost,
      installedRepository: resolve(installedArg.slice("--installed-repository=".length)), proposalSha256: approvedProposalHash,
      independentThemeReviewSha256: sha(readFileSync(resolve(packet, "THEME-REVIEW.md"))),
      writingReceiptSha256: sha(readFileSync(resolve(writing, "DATABASE-RECEIPT.json"))), productionTargetProofSha256: sha(readFileSync(productionTargetProofPath)), inputs: readInputs()};
    once(selectionPath, selection);
  }
  const selectionSha256 = sha(readFileSync(selectionPath)); let baseline: Baseline;
  if (existsSync(baselinePath)) {baseline = json<Baseline>(baselinePath); assert.equal(baseline.selectionSha256, selectionSha256);}
  else {
    assert(mode === "--preflight", "Capture the exact originals before applying themes");
    const before = await snapshot(); health(before);
    selection.inputs.forEach(input => {
      assert.equal(state(before, input), "original", "First baseline requires every exact original stage");
      const actual = before.specs.find(row => row.story_spec_id === input.storySpecId);
      assert(actual && actual.status === "draft");
      same(coreSpec(actual), {story_spec_id: input.draft.storySpecId, figure_key: input.draft.figureKey,
        stage_id: input.draft.stageId, version: input.draft.version, schema_version: input.draft.schemaVersion,
        status: "draft", spec: input.draft}, "Existing StorySpec differs from completed draft or row identity");
    });
    const original = json<Catalog>(resolve(inputs, "WRITING-DB-BEFORE-UPDATE.json"));
    same(before.specs.filter(row => row.status === "published").map(coreSpec), original.specs.filter(row => row.status === "published").map(coreSpec), "Original 34 published documents changed");
    const publishedKeys = new Set(original.specs.filter(row => row.status === "published").map(row => `${row.figure_key}:${row.stage_id}`));
    same(before.stages.filter(row => publishedKeys.has(`${row.figure_key}:${row.stage_id}`)), original.stages.filter(row => publishedKeys.has(`${row.figure_key}:${row.stage_id}`)), "An original published stage changed");
    baseline = {capturedAt: new Date().toISOString(), selectionSha256, catalog: before}; once(baselinePath, baseline);
  }
  const baselineSha256 = sha(readFileSync(baselinePath));
  const current = await snapshot(); const states = preserve(current, baseline, selection.inputs);
  if (mode === "--preflight") {console.log(JSON.stringify({ok: true, mode: "read-only-theme-preflight", states, selectionSha256, baselineSha256, databaseMutation: false})); return;}
  const gateArg = args.find(arg => arg.startsWith("--matching-gate=")); const gateHashArg = args.find(arg => arg.startsWith("--matching-gate-sha256="));
  assert(gateArg && gateHashArg, "Root must confirm and pin the passed matching gate before apply");
  const gateSha256 = gateHashArg.slice("--matching-gate-sha256=".length);
  const matching = await gate(resolve(gateArg.slice("--matching-gate=".length)), gateSha256, selection);
  once(resolve(packet, "THEME-UPDATE-START.json"), {selectionSha256, baselineSha256, gateSha256, librarySha256: matching.librarySha256});
  for (const input of selection.inputs.filter(input => input.figureKey in additions)) {
    const before = await snapshot(); preserve(before, baseline, selection.inputs);
    if (state(before, input) === "original") {
      // Only the themes column is written. Concurrency elsewhere cannot be
      // silently overwritten; exact readbacks and full preservation stop drift.
      const result = await getSupabase().from("figure_stages").update({themes: input.proposed.themes})
        .eq("figure_key", input.figureKey).eq("stage_id", input.original.stageId).eq("status", "draft")
        .eq("themes", `{${input.original.themes.join(",")}}`).select(stageColumns);
      if (result.error) throw new Error(`Theme update failed for ${input.figureKey} (${result.error.code})`);
      assert.equal(result.data?.length, 1, "Original theme guard rejected update");
      same(result.data![0], row(input.proposed), "Theme update returned an unexpected complete stage");
    }
    const after = await snapshot(); preserve(after, baseline, selection.inputs); assert.equal(state(after, input), "applied");
    const receiptPath = resolve(packet, `THEME-UPDATED-${input.figureKey}.json`);
    const observedAt = existsSync(receiptPath) ? json<{observedAt: string}>(receiptPath).observedAt : new Date().toISOString();
    once(receiptPath, {observedAt, selectionSha256, baselineSha256, gateSha256, figureKey: input.figureKey,
      originalStageSha256: input.stageSha256, productionStageSha256: input.productionStageSha256,
      before: row(input.original), after: row(input.proposed), writtenColumns: ["themes"],
      allStorySpecsAndTimestampsPreserved: true, original34PublicationsPreserved: true, unrelatedStagesAndFiguresPreserved: true});
    console.log(JSON.stringify({figureKey: input.figureKey, changedColumns: ["themes"], status: "draft", exactReadback: true}));
  }
  const after = await snapshot(); assert(preserve(after, baseline, selection.inputs).every(state => state === "applied"));
  const afterPath = resolve(packet, "THEME-UPDATE-AFTER.json"); once(afterPath, after);
  const receiptPath = resolve(packet, "THEME-UPDATE-RECEIPT.json");
  const completedAt = existsSync(receiptPath) ? json<{completedAt: string}>(receiptPath).completedAt : new Date().toISOString();
  once(receiptPath, {completedAt, ok: true, updatedStages: 2, selectionSha256, baselineSha256, gateSha256, afterSha256: sha(readFileSync(afterPath)),
    writtenColumns: ["themes"], allStorySpecsAndTimestampsPreserved: true, original34PublicationsPreserved: true, unrelatedCatalogPreserved: true,
    targets: ["jacobs", "riis"].map(figureKey => ({figureKey, receiptSha256: sha(readFileSync(resolve(packet, `THEME-UPDATED-${figureKey}.json`)))}))});
  console.log(JSON.stringify({ok: true, mode: "applied-approved-themes", stages: 2, publishedStories: 34, unrelatedCatalogPreserved: true}));
}
main().catch(error => {console.error(error instanceof Error ? error.message : "Theme update failed"); process.exitCode = 1;});
