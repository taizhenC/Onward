// Exactly ten reviewed factual summaries and two reviewed theme additions.
// --validate-inputs is offline; --preflight reads DB; --apply requires a passed
// hash-pinned matching gate. No publication, lifecycle change or deployment.
import "../../../scripts/_smoke-bootstrap";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { getSupabase } from "../../../lib/db";
import { inspectPublishedStorySpecRows } from "../../../lib/story-spec-repository";
import type { FigureStageRow } from "../../../lib/types";
import { loadEnvLocal } from "../../../scripts/_load-env";
import { factsV2ProposalSha256, factsV2ReviewSha256, themeV1ProposalSha256, themeV1ReviewSha256, readApprovedV2Inputs, type ApprovedV2Input } from "./approved-stage-inputs-v2";

const packet = resolve("docs/releases/new-stories-production-2026-10-02");
const inputs = resolve("docs/research/new-stories-2026-10-02");
const writing = resolve("docs/releases/new-stories-written-2026-10-02");
const projectHost = "mbcqkljfekkxlgittzal.supabase.co";
const approvedProposalHash = factsV2ProposalSha256;
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
  if (existsSync(path)) same(json(path), value, "Existing stage-v2 receipt differs");
  else writeFileSync(path, JSON.stringify(value, null, 2) + "\n", {flag: "wx"});
  return sha(readFileSync(path));
}
type EditorialRow = Record<string, unknown>;
type StageRow = EditorialRow & {figure_key: string; stage_id: string; status: string; themes: string[]; biographical_facts: string};
type SpecRow = EditorialRow & {story_spec_id: string; figure_key: string; stage_id: string; status: string; spec: unknown};
type Catalog = {figures: EditorialRow[]; stages: StageRow[]; specs: SpecRow[]};
type Input = ApprovedV2Input;
type Pins = {schemaVersion: "new-ten-approved-stage-v2-selection-v1"; capturedAt: string; projectHost: string;
  installedRepository: string; proposalSha256: string; independentFactsReviewSha256: string; themeProposalSha256: string; themeReviewSha256: string;
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
  results.forEach(result => {if (result.error) throw new Error(`Stage-v2 snapshot failed (${result.error.code})`);});
  return {figures: results[0].data as EditorialRow[], stages: results[1].data as StageRow[], specs: results[2].data as SpecRow[]};
}
function readInputs(): Input[] {return readApprovedV2Inputs();}
function writtenColumns(input: Input) {
  return equal(input.original.themes, input.proposed.themes) ? ["biographical_facts"] : ["biographical_facts", "themes"];
}
function mutationUrlLength(input: Input) {
  const url = new URL(`https://${projectHost}/rest/v1/figure_stages`);
  for (const [key, value] of Object.entries({figure_key: `eq.${input.figureKey}`, stage_id: `eq.${input.original.stageId}`,
    status: "eq.draft", themes: `eq.{${input.original.themes.join(",")}}`, biographical_facts: `eq.${input.original.biographicalFacts}`, select: stageColumns})) url.searchParams.set(key, value);
  return url.href.length;
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
  same(current.specs, baseline.catalog.specs, "A StorySpec or lifecycle timestamp changed during stage-v2 update");
  const targets = inputs;
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
  if (args.length === 1 && mode === "--validate-inputs") {
    const checked = readInputs(); checked.forEach(input => assert(mutationUrlLength(input) < 7_500, "Exact factual guard exceeds bounded URL size"));
    console.log(JSON.stringify({ok: true, mode: "offline-stage-v2-input-validation", stages: checked.length, factualSummaries: 10, themeAdditions: 2,
      maximumMutationUrlLength: Math.max(...checked.map(mutationUrlLength)), proposalSha256: approvedProposalHash, independentReviewSha256: factsV2ReviewSha256,
      databaseReads: 0, databaseMutations: 0, authMutations: 0, providerRequests: 0})); return;
  }
  assert(mode === "--preflight" || mode === "--apply", "Usage: apply-approved-stage-v2.ts --validate-inputs | --preflight --installed-repository=<path> | --apply --matching-gate=<path> --matching-gate-sha256=<hash>");
  const flags = ["--installed-repository=", "--matching-gate=", "--matching-gate-sha256="];
  assert(args.slice(1).every(arg => flags.some(flag => arg.startsWith(flag))), "Unexpected arguments");
  assert(flags.every(flag => args.filter(arg => arg.startsWith(flag)).length <= 1), "Duplicate flags");
  if (mode === "--preflight") assert(!args.some(arg => arg.startsWith("--matching-gate")), "Read-only preflight does not approve a matching gate");
  loadEnvLocal(); assert.equal(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname, projectHost, "Wrong production target");
  const productionTargetProofPath = resolve(packet, "PRODUCTION-TARGET-PROOF.json");
  const targetProof = json<{ok: boolean; publicSupabaseHostname: string; localSupabaseHostname: string; localTargetMatchesCurrentProductionBundle: boolean}>(productionTargetProofPath);
  assert(targetProof.ok && targetProof.localTargetMatchesCurrentProductionBundle && targetProof.publicSupabaseHostname === projectHost && targetProof.localSupabaseHostname === projectHost,
    "Independent production-target proof missing or mismatched");
  const selectionPath = resolve(packet, "STAGE-V2-UPDATE-SELECTION.json"); const baselinePath = resolve(packet, "STAGE-V2-UPDATE-BASELINE.json");
  const installedArg = args.find(arg => arg.startsWith("--installed-repository="));
  let selection: Pins;
  if (existsSync(selectionPath)) {
    selection = json<Pins>(selectionPath); assert.equal(selection.schemaVersion, "new-ten-approved-stage-v2-selection-v1"); assert.equal(selection.projectHost, projectHost);
    if (installedArg) assert.equal(resolve(installedArg.slice("--installed-repository=".length)), selection.installedRepository);
    assert.equal(selection.proposalSha256, approvedProposalHash);
    assert.equal(selection.themeProposalSha256, themeV1ProposalSha256); assert.equal(selection.themeReviewSha256, themeV1ReviewSha256);
    assert.equal(selection.independentFactsReviewSha256, factsV2ReviewSha256);
    assert.equal(selection.writingReceiptSha256, sha(readFileSync(resolve(writing, "DATABASE-RECEIPT.json"))));
    assert.equal(selection.productionTargetProofSha256, sha(readFileSync(productionTargetProofPath)));
    same(readInputs(), selection.inputs, "Frozen reviewed facts-v2 inputs changed");
  } else {
    assert(mode === "--preflight" && installedArg, "Create a read-only preflight with the production checkout first");
    selection = {schemaVersion: "new-ten-approved-stage-v2-selection-v1", capturedAt: new Date().toISOString(), projectHost,
      installedRepository: resolve(installedArg.slice("--installed-repository=".length)), proposalSha256: approvedProposalHash,
      independentFactsReviewSha256: factsV2ReviewSha256, themeProposalSha256: themeV1ProposalSha256, themeReviewSha256: themeV1ReviewSha256,
      writingReceiptSha256: sha(readFileSync(resolve(writing, "DATABASE-RECEIPT.json"))), productionTargetProofSha256: sha(readFileSync(productionTargetProofPath)), inputs: readInputs()};
    once(selectionPath, selection);
  }
  const selectionSha256 = sha(readFileSync(selectionPath)); let baseline: Baseline;
  if (existsSync(baselinePath)) {baseline = json<Baseline>(baselinePath); assert.equal(baseline.selectionSha256, selectionSha256);}
  else {
    assert(mode === "--preflight", "Capture every exact original draft before applying facts-v2");
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
  if (mode === "--preflight") {console.log(JSON.stringify({ok: true, mode: "read-only-stage-v2-preflight", states, selectionSha256, baselineSha256, databaseMutation: false})); return;}
  const gateArg = args.find(arg => arg.startsWith("--matching-gate=")); const gateHashArg = args.find(arg => arg.startsWith("--matching-gate-sha256="));
  assert(gateArg && gateHashArg, "Root must confirm and pin the passed matching gate before apply");
  const gateSha256 = gateHashArg.slice("--matching-gate-sha256=".length);
  const matching = await gate(resolve(gateArg.slice("--matching-gate=".length)), gateSha256, selection);
  once(resolve(packet, "STAGE-V2-UPDATE-START.json"), {selectionSha256, baselineSha256, gateSha256, librarySha256: matching.librarySha256});
  for (const input of selection.inputs) {
    const before = await snapshot(); preserve(before, baseline, selection.inputs);
    if (state(before, input) === "original") {
      // Exact original facts and themes are the two overwritten-field guards.
      // Complete immediate pre/post snapshots preserve every other field; root
      // must retain its serialized editorial window for unrelated concurrent edits.
      assert(mutationUrlLength(input) < 7_500, "Exact factual guard exceeds bounded URL size");
      const patch = equal(input.original.themes, input.proposed.themes)
        ? {biographical_facts: input.proposed.biographicalFacts}
        : {biographical_facts: input.proposed.biographicalFacts, themes: input.proposed.themes};
      const result = await getSupabase().from("figure_stages").update(patch)
        .eq("figure_key", input.figureKey).eq("stage_id", input.original.stageId).eq("status", "draft")
        .eq("themes", `{${input.original.themes.join(",")}}`).eq("biographical_facts", input.original.biographicalFacts).select(stageColumns);
      if (result.error) throw new Error(`Stage-v2 update failed for ${input.figureKey} (${result.error.code})`);
      assert.equal(result.data?.length, 1, "Exact original facts/themes guard rejected update");
      same(result.data![0], row(input.proposed), "Stage-v2 update returned an unexpected complete stage");
    }
    const after = await snapshot(); preserve(after, baseline, selection.inputs); assert.equal(state(after, input), "applied");
    const receiptPath = resolve(packet, `STAGE-V2-UPDATED-${input.figureKey}.json`);
    const observedAt = existsSync(receiptPath) ? json<{observedAt: string}>(receiptPath).observedAt : new Date().toISOString();
    once(receiptPath, {observedAt, selectionSha256, baselineSha256, gateSha256, figureKey: input.figureKey,
      originalStageSha256: input.stageSha256, productionStageSha256: input.productionStageSha256,
      before: row(input.original), after: row(input.proposed), writtenColumns: writtenColumns(input),
      allStorySpecsAndTimestampsPreserved: true, original34PublicationsPreserved: true, unrelatedStagesAndFiguresPreserved: true});
    console.log(JSON.stringify({figureKey: input.figureKey, changedColumns: writtenColumns(input), status: "draft", exactReadback: true}));
  }
  const after = await snapshot(); assert(preserve(after, baseline, selection.inputs).every(state => state === "applied"));
  const afterPath = resolve(packet, "STAGE-V2-UPDATE-AFTER.json"); once(afterPath, after);
  const receiptPath = resolve(packet, "STAGE-V2-UPDATE-RECEIPT.json");
  const completedAt = existsSync(receiptPath) ? json<{completedAt: string}>(receiptPath).completedAt : new Date().toISOString();
  once(receiptPath, {completedAt, ok: true, updatedStages: 10, selectionSha256, baselineSha256, gateSha256, afterSha256: sha(readFileSync(afterPath)),
    writtenColumns: ["biographical_facts", "themes"], factualSummaries: 10, themeAdditions: 2, allStorySpecsAndTimestampsPreserved: true, original34PublicationsPreserved: true, unrelatedCatalogPreserved: true,
    targets: selection.inputs.map(({figureKey}) => ({figureKey, receiptSha256: sha(readFileSync(resolve(packet, `STAGE-V2-UPDATED-${figureKey}.json`)))}))});
  console.log(JSON.stringify({ok: true, mode: "applied-approved-stage-v2", stages: 10, publishedStories: 34, unrelatedCatalogPreserved: true}));
}
main().catch(error => {console.error(error instanceof Error ? error.message : "Stage-v2 update failed"); process.exitCode = 1;});
