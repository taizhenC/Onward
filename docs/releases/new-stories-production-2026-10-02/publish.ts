// Bounded editorial release tool for the ten October 2 stories.
// --preflight is database-read-only. --publish requires a separately pinned
// matching-release gate. Neither mode changes matching content or deployment.
import "../../../scripts/_smoke-bootstrap";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { getSupabase } from "../../../lib/db";
import { THEME_VOCABULARY } from "../../../lib/themes";
import { inspectPublishedStorySpecRows, parseStorySpecRow } from "../../../lib/story-spec-repository";
import { parseStorySpecDocument, validateStorySpec } from "../../../lib/story-spec";
import type { StorySpec } from "../../../lib/story-spec-types";
import type { FigureStageRow } from "../../../lib/types";
import { loadEnvLocal } from "../../../scripts/_load-env";

const packet = resolve("docs/releases/new-stories-production-2026-10-02");
const inputs = resolve("docs/research/new-stories-2026-10-02");
const writing = resolve("docs/releases/new-stories-written-2026-10-02");
const writingDatabaseBaselinePath = resolve(inputs, "WRITING-DB-BEFORE-UPDATE.json");
const approvedProposalHash = "5998bcf03e3e9ae672bd4721e1262e2c6dd992618ac6a9486a53f0b3578d838b";
// Bound in earlier local publication audits and independently rechecked against
// the live site's browser bundle in PRODUCTION-TARGET-PROOF.json. Never derive
// production-target authorization solely from the currently loaded env.
const projectHost = "mbcqkljfekkxlgittzal.supabase.co";
const owner = "taizhenC";
const ownerStatement = "lets push all those story into the production.";
const specColumns = "story_spec_id,figure_key,stage_id,version,schema_version,status,spec,created_at,published_at,retired_at";
const stageColumns = "figure_key,stage_id,stage_label,age_min,age_max,shape_sentences,facets,biographical_facts,themes,anti_themes,beats,sources,status";
const sha = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");
function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}
const equal = (left: unknown, right: unknown) => stable(left) === stable(right);
const same = (left: unknown, right: unknown, label: string) => assert(equal(left, right), label);
function readJson<T>(path: string): T { return JSON.parse(readFileSync(path, "utf8")) as T; }
function saveOnce(path: string, value: unknown): string {
  const bytes = JSON.stringify(value, null, 2) + "\n";
  if (existsSync(path)) same(readJson(path), value, `Immutable receipt differs: ${basename(path)}`);
  else writeFileSync(path, bytes, { flag: "wx" });
  return sha(readFileSync(path));
}
function observedAt(path: string): string {
  return existsSync(path) ? readJson<{observedAt: string}>(path).observedAt : new Date().toISOString();
}
type SpecRow = { story_spec_id: string; figure_key: string; stage_id: string;
  version: number; schema_version: string; status: string; spec: StorySpec;
  created_at?: string; published_at?: string | null; retired_at?: string | null };
type StageRow = { figure_key: string; stage_id: string; status: string;
  stage_label: string; age_min: number; age_max: number; shape_sentences: string[];
  facets: FigureStageRow["facets"]; biographical_facts: string; themes: string[];
  anti_themes: string[]; beats: FigureStageRow["beats"]; sources: string[] };
type FigureRow = { key: string; display_name: string; birth_year: number | null; death_year: number | null };
type Catalog = { figures: FigureRow[]; stages: StageRow[]; specs: SpecRow[] };
type Target = { figureKey: string; storySpecId: string; candidateFile: string;
  candidateSha256: string; stageSha256: string; productionStageSha256: string;
  draft: StorySpec; authoredStage: FigureStageRow; stage: FigureStageRow;
  reviewed: StorySpec };
type Selection = { schemaVersion: "new-ten-owner-publication-v1"; capturedAt: string;
  projectHost: string; ownerId: string; ownerStatement: string; authorizationScope: string;
  writingReceiptSha256: string; writingDatabaseBaselineSha256: string;
  installedRepository: string; productionStageDirectory: string; targets: Target[] };
type Baseline = { capturedAt: string; projectHost: string; selectionSha256: string;
  initialPublishedStoryCount: number; catalog: Catalog };
type Gate = { schemaVersion: "new-ten-matching-release-gate-v1"; ok: true;
  completedAt: string; librarySha256: string; evidenceIds: string[];
  checks: { realProviderTrustGate: true; recipeGovernance: true; unchangedRecipeSelection: true };
  targets: Array<{ figureKey: string; candidateSha256: string; stageSha256: string; productionStageSha256: string }> };

function draftRow(spec: StorySpec): SpecRow {
  return {story_spec_id: spec.storySpecId, figure_key: spec.figureKey, stage_id: spec.stageId,
    version: spec.version, schema_version: spec.schemaVersion, status: spec.status, spec};
}
function coreRow(row: SpecRow): SpecRow {
  return {story_spec_id: row.story_spec_id, figure_key: row.figure_key, stage_id: row.stage_id,
    version: row.version, schema_version: row.schema_version, status: row.status, spec: row.spec};
}
function stageRow(stage: FigureStageRow, status: string): StageRow {
  return {figure_key: stage.figureKey, stage_id: stage.stageId, stage_label: stage.stageLabel,
    age_min: stage.ageMin, age_max: stage.ageMax, shape_sentences: stage.shapeSentences,
    facets: stage.facets, biographical_facts: stage.biographicalFacts, themes: stage.themes,
    anti_themes: stage.antiThemes, beats: stage.beats, sources: stage.sources, status};
}
async function catalog(): Promise<Catalog> {
  const db = getSupabase();
  const result = await Promise.all([
    db.from("figures").select("key,display_name,birth_year,death_year").order("key"),
    db.from("figure_stages").select(stageColumns).order("figure_key").order("stage_id"),
    db.from("story_specs").select(specColumns).order("story_spec_id"),
  ]);
  result.forEach(item => { if (item.error) throw new Error(`Editorial snapshot failed (${item.error.code})`); });
  return {figures: result[0].data as FigureRow[], stages: result[1].data as StageRow[], specs: result[2].data as SpecRow[]};
}
function publicationHealth(current: Catalog, expectedCount: number) {
  const published = current.specs.filter(row => row.status === "published");
  const inspection = inspectPublishedStorySpecRows(published.map(coreRow));
  assert.equal(inspection.quarantinedRowCount, 0, "Published catalog contains quarantined rows");
  assert.equal(inspection.catalog.size, expectedCount, "Unexpected valid publication count");
  const publishedKeys = new Set(published.map(row => `${row.figure_key}:${row.stage_id}`));
  for (const stage of current.stages) assert.equal(stage.status === "published",
    publishedKeys.has(`${stage.figure_key}:${stage.stage_id}`), "StorySpec/stage lifecycle parity failed");
}
function allowedState(current: Catalog, target: Target): "draft" | "review" | "published" {
  const row = current.specs.find(item => item.story_spec_id === target.storySpecId);
  assert(row, `${target.figureKey}: target row missing`);
  const stage = current.stages.find(item => item.figure_key === target.figureKey && item.stage_id === target.stage.stageId);
  assert(stage, `${target.figureKey}: target stage missing`);
  assert(["draft", "review", "published"].includes(row.status), `${target.figureKey}: unexpected lifecycle`);
  const status = row.status as "draft" | "review" | "published";
  const expected = status === "draft" ? target.draft : {...target.reviewed, status};
  same(coreRow(row), draftRow(expected), `${target.figureKey}: row differs from the frozen authorization`);
  assert(typeof row.created_at === "string" && Number.isFinite(Date.parse(row.created_at)), "Missing creation timestamp");
  assert.equal(row.retired_at, null, "Target carries an unexpected retirement timestamp");
  if (status === "published") assert(typeof row.published_at === "string" && Number.isFinite(Date.parse(row.published_at)), "Publication timestamp missing");
  else assert.equal(row.published_at, null, "Unpublished target carries a publication timestamp");
  same(stage, stageRow(target.stage, status === "published" ? "published" : "draft"), `${target.figureKey}: matching content or lifecycle changed`);
  return status;
}
function preserve(current: Catalog, baseline: Baseline, targets: Target[]) {
  const specIds = new Set(targets.map(item => item.storySpecId));
  const stageKeys = new Set(targets.map(item => `${item.figureKey}:${item.stage.stageId}`));
  same(current.figures, baseline.catalog.figures, "Figure metadata changed since baseline");
  same(current.specs.filter(row => !specIds.has(row.story_spec_id)),
    baseline.catalog.specs.filter(row => !specIds.has(row.story_spec_id)), "An unrelated StorySpec changed since baseline");
  same(current.stages.filter(row => !stageKeys.has(`${row.figure_key}:${row.stage_id}`)),
    baseline.catalog.stages.filter(row => !stageKeys.has(`${row.figure_key}:${row.stage_id}`)), "An unrelated stage changed since baseline");
  const states = targets.map(target => allowedState(current, target));
  for (const target of targets) {
    const original = baseline.catalog.specs.find(row => row.story_spec_id === target.storySpecId)!;
    const actual = current.specs.find(row => row.story_spec_id === target.storySpecId)!;
    assert.equal(actual.created_at, original.created_at, "A target creation timestamp changed");
    if (actual.status === "published") assert(Date.parse(actual.published_at!) >= Date.parse(baseline.capturedAt), "Target was published before the release baseline");
  }
  publicationHealth(current, baseline.initialPublishedStoryCount + states.filter(state => state === "published").length);
  return states;
}
function loadInputs(reviewedAt: string, productionStageDirectory: string): Target[] {
  const proposalBytes = readFileSync(resolve(packet, "THEME-PROPOSAL.json"));
  assert.equal(sha(proposalBytes), approvedProposalHash, "The independently reviewed theme proposal changed");
  const proposal = JSON.parse(proposalBytes.toString("utf8")) as {stages: Array<{figureKey: string; file: string; originalSha256: string; proposedSha256: string}>};
  assert.equal(proposal.stages.length, 10);
  const themeReview = readFileSync(resolve(packet, "THEME-REVIEW.md"), "utf8");
  assert(themeReview.includes(approvedProposalHash), "Theme source review does not pin this proposal");
  const receiptPath = resolve(writing, "DATABASE-RECEIPT.json");
  const receipt = readJson<{verifiedStoryCount: number; targets: Array<{figureKey: string;
    storySpecId: string; candidateSha256: string; stageSha256: string}>}>(receiptPath);
  assert.equal(receipt.verifiedStoryCount, 10);
  const files = readdirSync(inputs).filter(name => name.endsWith(".candidate.json")).sort();
  assert.equal(files.length, 10);
  const reviewText = readdirSync(writing).filter(name => /^CROSS-REVIEW-.+\.md$/.test(name))
    .map(name => readFileSync(resolve(writing, name), "utf8")).join("\n");
  const targets = files.map(candidateFile => {
    const bytes = readFileSync(resolve(inputs, candidateFile));
    const draft = parseStorySpecDocument(JSON.parse(bytes.toString("utf8")));
    assert(draft && draft.status === "draft"); same(draft.review, {}, "Frozen candidate must retain empty draft review");
    const stageBytes = readFileSync(resolve(inputs, candidateFile.replace(".candidate.json", ".stage.json")));
    const authoredStage = JSON.parse(stageBytes.toString("utf8")) as FigureStageRow;
    const productionStageBytes = readFileSync(resolve(productionStageDirectory, candidateFile.replace(".candidate.json", ".stage.json")));
    const stage = JSON.parse(productionStageBytes.toString("utf8")) as FigureStageRow;
    same({...stage, themes: authoredStage.themes}, authoredStage, `${candidateFile}: production stage may change only themes`);
    assert(stage.themes.length > 0 && new Set(stage.themes).size === stage.themes.length &&
      stage.themes.every(theme => THEME_VOCABULARY.includes(theme)), "Invalid or uncontrolled production themes");
    const productionStageSha256 = sha(productionStageBytes);
    const candidateSha256 = sha(bytes); const stageSha256 = sha(stageBytes);
    const approvedStage = proposal.stages.find(item => item.figureKey === draft.figureKey);
    assert(approvedStage && approvedStage.file === candidateFile.replace(".candidate.json", ".stage.json") &&
      approvedStage.originalSha256 === stageSha256 && approvedStage.proposedSha256 === productionStageSha256,
      `${candidateFile}: production themes differ from the exact independently reviewed proposal`);
    const pin = receipt.targets.find(item => item.figureKey === draft.figureKey);
    assert(pin && pin.storySpecId === draft.storySpecId && pin.candidateSha256 === candidateSha256 && pin.stageSha256 === stageSha256,
      `${candidateFile}: differs from the completed writing receipt`);
    assert(reviewText.includes(candidateSha256) && reviewText.includes(stageSha256), "Final independent-review pins missing");
    same([stage.figureKey, stage.stageId, stage.ageMin, stage.ageMax],
      [draft.figureKey, draft.stageId, draft.episode.ageMin, draft.episode.ageMax], "Stage identity/age mismatch");
    same(stage.beats.map(beat => [beat.role, beat.text]), draft.arc.map(beat => [beat.role, beat.canonicalText]), "Stage prose mismatch");
    const reading = readFileSync(resolve(writing, `${draft.figureKey}.md`), "utf8");
    assert(reading.includes(candidateSha256) && reading.includes(stageSha256) && draft.arc.every(beat => reading.includes(beat.canonicalText)),
      "Finished reading document differs from the frozen candidate");
    const reviewed: StorySpec = {...draft, status: "review", review: {researcherId: owner,
      historicalReviewerId: owner, toneReviewerId: owner, reviewedAt, contentProfileReviewed: true}};
    for (const validation of [validateStorySpec(draft, {forPublish: false}), validateStorySpec({...reviewed, status: "published"}, {forPublish: true})]) {
      assert(validation.valid && !validation.warnings.length, `${draft.figureKey}: validation errors or warnings`);
    }
    return {figureKey: draft.figureKey, storySpecId: draft.storySpecId, candidateFile,
      candidateSha256, stageSha256, productionStageSha256, draft, authoredStage, stage, reviewed};
  });
  assert.equal(new Set(targets.map(item => item.figureKey)).size, 10);
  assert.equal(new Set(targets.map(item => item.storySpecId)).size, 10);
  return targets;
}
async function matchingGate(path: string, expectedHash: string, targets: Target[], installedRepository: string) {
  assert(/^[a-f0-9]{64}$/.test(expectedHash), "Pin the complete matching-gate file SHA-256");
  assert.equal(sha(readFileSync(path)), expectedHash, "Matching gate changed");
  const gate = readJson<Gate>(path);
  assert.equal(gate.schemaVersion, "new-ten-matching-release-gate-v1"); assert.equal(gate.ok, true);
  assert(gate.completedAt && Number.isFinite(Date.parse(gate.completedAt)), "Missing gate completion date");
  same(gate.checks, {realProviderTrustGate: true, recipeGovernance: true, unchangedRecipeSelection: true}, "Required matching release checks absent");
  same([...gate.targets].sort((a, b) => a.figureKey.localeCompare(b.figureKey)), targets.map(({figureKey, candidateSha256, stageSha256, productionStageSha256}) =>
    ({figureKey, candidateSha256, stageSha256, productionStageSha256})).sort((a, b) => a.figureKey.localeCompare(b.figureKey)), "Gate does not cover the exact ten inputs");
  const libraryPath = resolve(installedRepository, "lib/figures-data.ts");
  const librarySha256 = sha(readFileSync(libraryPath));
  assert.equal(gate.librarySha256, librarySha256);
  const release = readJson<{releases: Array<{sha256: string; evidenceIds: string[]}>}>(resolve(installedRepository, "config/figure-library-releases.json")).releases.at(-1)!;
  assert.equal(release.sha256, librarySha256, "New library is not the installed released snapshot");
  assert(gate.evidenceIds.length > 0); same(gate.evidenceIds, release.evidenceIds, "Gate evidence differs from the newest library release");
  const {FIGURE_STAGES} = await import(pathToFileURL(libraryPath).href) as {FIGURE_STAGES: FigureStageRow[]};
  for (const target of targets) same(FIGURE_STAGES.find(stage => stage.figureKey === target.figureKey && stage.stageId === target.stage.stageId),
    target.stage, `${target.figureKey}: installed matching stage differs from the approved stage`);
  return gate;
}
async function readTarget(target: Target): Promise<SpecRow> {
  const result = await getSupabase().from("story_specs").select(specColumns).eq("story_spec_id", target.storySpecId).single();
  if (result.error) throw new Error(`Target read failed (${result.error.code})`);
  return result.data as SpecRow;
}
async function main() {
  const args = process.argv.slice(2);
  const mode = args[0];
  assert(mode === "--preflight" || mode === "--publish", "Usage: publish.ts --preflight [--installed-repository=<path>] [--production-stage-directory=<path>] | --publish --matching-gate=<path> --matching-gate-sha256=<hash>");
  const allowedFlags = ["--installed-repository=", "--production-stage-directory=", "--matching-gate=", "--matching-gate-sha256="];
  assert(args.slice(1).every(arg => allowedFlags.some(flag => arg.startsWith(flag))), "Unexpected arguments");
  assert(allowedFlags.every(flag => args.filter(arg => arg.startsWith(flag)).length <= 1), "Duplicate flags");
  if (mode === "--preflight") assert(!args.some(arg => arg.startsWith("--matching-gate")), "Preflight does not consume or approve a matching gate");
  const installedArg = args.find(arg => arg.startsWith("--installed-repository="));
  const stageDirectoryArg = args.find(arg => arg.startsWith("--production-stage-directory="));
  loadEnvLocal(); assert.equal(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname, projectHost, "Different production database target");
  mkdirSync(packet, {recursive: true});
  const selectionPath = resolve(packet, "SELECTION.json"); const baselinePath = resolve(packet, "EDITORIAL-BASELINE.json");
  let selection: Selection;
  if (existsSync(selectionPath)) {
    selection = readJson<Selection>(selectionPath);
    assert.equal(selection.schemaVersion, "new-ten-owner-publication-v1");
    assert.equal(selection.projectHost, projectHost); assert.equal(selection.ownerId, owner); assert.equal(selection.ownerStatement, ownerStatement);
    if (installedArg) assert.equal(resolve(installedArg.slice("--installed-repository=".length)), selection.installedRepository);
    if (stageDirectoryArg) assert.equal(resolve(stageDirectoryArg.slice("--production-stage-directory=".length)), selection.productionStageDirectory);
    assert.equal(selection.writingReceiptSha256, sha(readFileSync(resolve(writing, "DATABASE-RECEIPT.json"))));
    assert.equal(selection.writingDatabaseBaselineSha256, sha(readFileSync(writingDatabaseBaselinePath)));
    same(loadInputs(selection.capturedAt, selection.productionStageDirectory), selection.targets, "Authorized inputs changed after selection");
  } else {
    assert(mode === "--preflight", "Create the read-only preflight first");
    const capturedAt = new Date().toISOString();
    const installedRepository = installedArg ? resolve(installedArg.slice("--installed-repository=".length)) : resolve(".");
    const productionStageDirectory = stageDirectoryArg ? resolve(stageDirectoryArg.slice("--production-stage-directory=".length)) : resolve(packet, "proposed-stages");
    selection = {schemaVersion: "new-ten-owner-publication-v1", capturedAt, projectHost, ownerId: owner,
      ownerStatement, authorizationScope: "Owner publication decision for the exact ten finished stories; one owner occupies the three required schema roles. No independent human review or prior reading assertion is invented.",
      writingReceiptSha256: sha(readFileSync(resolve(writing, "DATABASE-RECEIPT.json"))),
      writingDatabaseBaselineSha256: sha(readFileSync(writingDatabaseBaselinePath)), installedRepository,
      productionStageDirectory, targets: loadInputs(capturedAt, productionStageDirectory)};
    saveOnce(selectionPath, selection);
  }
  const selectionSha256 = sha(readFileSync(selectionPath));
  let baseline: Baseline;
  if (existsSync(baselinePath)) {
    baseline = readJson<Baseline>(baselinePath); assert.equal(baseline.projectHost, projectHost); assert.equal(baseline.selectionSha256, selectionSha256);
  } else {
    assert(mode === "--preflight", "Create the baseline in read-only preflight first");
    const before = await catalog(); publicationHealth(before, 34);
    const writingBaseline = readJson<Catalog>(writingDatabaseBaselinePath);
    const priorPublications = writingBaseline.specs.filter(row => row.status === "published");
    assert.equal(priorPublications.length, 34, "The writing baseline must identify the original 34 publications");
    same(before.specs.filter(row => row.status === "published").map(coreRow), priorPublications.map(coreRow), "Original 34 publications changed before publication preflight");
    const priorStageKeys = new Set(priorPublications.map(row => `${row.figure_key}:${row.stage_id}`));
    same(before.stages.filter(row => priorStageKeys.has(`${row.figure_key}:${row.stage_id}`)),
      writingBaseline.stages.filter(row => priorStageKeys.has(`${row.figure_key}:${row.stage_id}`)), "An original published stage changed before preflight");
    selection.targets.forEach(target => assert.equal(allowedState(before, target), "draft", "First preflight requires all ten exact drafts"));
    baseline = {capturedAt: new Date().toISOString(), projectHost, selectionSha256, initialPublishedStoryCount: 34, catalog: before};
    saveOnce(baselinePath, baseline);
  }
  assert.equal(baseline.initialPublishedStoryCount, 34);
  selection.targets.forEach(target => assert.equal(allowedState(baseline.catalog, target), "draft"));
  const baselineSha256 = sha(readFileSync(baselinePath));
  const states = preserve(await catalog(), baseline, selection.targets);
  if (mode === "--preflight") {
    console.log(JSON.stringify({ok: true, mode: "read-only-preflight", stories: 10, states,
      selectionSha256, baselineSha256, publicationExecuted: false})); return;
  }
  const gateArg = args.find(arg => arg.startsWith("--matching-gate="));
  const gateHashArg = args.find(arg => arg.startsWith("--matching-gate-sha256="));
  assert(gateArg && gateHashArg, "Publication requires a separately pinned matching gate");
  const gatePath = resolve(gateArg.slice("--matching-gate=".length)); const gateSha256 = gateHashArg.slice("--matching-gate-sha256=".length);
  const gate = await matchingGate(gatePath, gateSha256, selection.targets, selection.installedRepository);
  // Gate/baseline pins are immutable for recovery, rather than trusting whatever
  // gate happens to be present at the time of a retry.
  saveOnce(resolve(packet, "PUBLICATION-START.json"), {selectionSha256, baselineSha256, gateSha256,
    projectHost, librarySha256: gate.librarySha256, evidenceIds: gate.evidenceIds});
  for (const target of selection.targets) {
    const current = await catalog(); preserve(current, baseline, selection.targets);
    let state = allowedState(current, target);
    if (state === "draft") {
      const before = await readTarget(target); same(coreRow(before), draftRow(target.draft), `${target.figureKey}: concurrent draft change`);
      same(before, current.specs.find(row => row.story_spec_id === target.storySpecId), `${target.figureKey}: concurrent lifecycle-metadata change`);
      // The established authoring transition is serialized by the operator's
      // editorial window, with exact immediate pre/post readbacks. The compact
      // predicates also guard empty review and every canonical passage. This is
      // not a full-document atomic review CAS; publication below is the strict
      // complete-document CAS, and no changed reviewed snapshot is published.
      let update = getSupabase().from("story_specs").update({status: "review", spec: target.reviewed})
        .eq("story_spec_id", target.storySpecId).eq("status", "draft").eq("spec->review", "{}");
      target.draft.arc.forEach((beat, index) => {update = update.eq(`spec->arc->${index}->>canonicalText`, beat.canonicalText);});
      const result = await update.select("story_spec_id");
      if (result.error) throw new Error(`Guarded review transition failed for ${target.figureKey} (${result.error.code})`);
      assert.equal(result.data?.length, 1, `${target.figureKey}: review guard rejected`);
      state = "review";
    }
    const reviewedRow = draftRow(target.reviewed);
    const reviewedReceiptPath = resolve(packet, `REVIEWED-${target.figureKey}.json`);
    if (state === "review") {
      const actual = await readTarget(target); same(coreRow(actual), reviewedRow, `${target.figureKey}: review read-back differs`);
      const original = baseline.catalog.specs.find(row => row.story_spec_id === target.storySpecId)!;
      same({...actual, status: original.status, spec: original.spec}, original, "Review transition changed lifecycle timestamps");
      assert(parseStorySpecRow(coreRow(actual), "review"), "Review-state integrity failed");
      saveOnce(reviewedReceiptPath, {observedAt: observedAt(reviewedReceiptPath), selectionSha256, baselineSha256, gateSha256, row: actual});
      const receipt = readJson<{selectionSha256: string; baselineSha256: string; gateSha256: string; row: SpecRow}>(reviewedReceiptPath);
      assert.equal(receipt.selectionSha256, selectionSha256); assert.equal(receipt.baselineSha256, baselineSha256); assert.equal(receipt.gateSha256, gateSha256);
      same(coreRow(receipt.row), reviewedRow, "Receipt-bound reviewed document changed");
      same(await readTarget(target), receipt.row, `${target.figureKey}: review changed before publication`);
      const result = await getSupabase().rpc("promote_story_spec_v2", {p_story_spec_id: target.storySpecId, p_expected_review_spec: receipt.row.spec});
      if (result.error) throw new Error(`Publication failed for ${target.figureKey} (${result.error.code}); rerun only the same pinned inputs after audit`);
    } else {
      assert(existsSync(reviewedReceiptPath), `${target.figureKey}: published row has no archived review receipt`);
      const receipt = readJson<{selectionSha256: string; baselineSha256: string; gateSha256: string; row: SpecRow}>(reviewedReceiptPath);
      assert.equal(receipt.selectionSha256, selectionSha256); assert.equal(receipt.baselineSha256, baselineSha256); assert.equal(receipt.gateSha256, gateSha256);
      same(coreRow(receipt.row), reviewedRow, "Archived review document differs");
    }
    const after = await catalog(); preserve(after, baseline, selection.targets); assert.equal(allowedState(after, target), "published");
    const actual = after.specs.find(row => row.story_spec_id === target.storySpecId)!;
    assert(parseStorySpecRow(coreRow(actual), "published"), "Published read-back integrity failed");
    const publishedReceiptPath = resolve(packet, `PUBLISHED-${target.figureKey}.json`);
    saveOnce(publishedReceiptPath, {observedAt: observedAt(publishedReceiptPath), selectionSha256, baselineSha256, gateSha256,
      reviewedReceiptSha256: sha(readFileSync(reviewedReceiptPath)), row: actual,
      stage: after.stages.find(row => row.figure_key === target.figureKey && row.stage_id === target.stage.stageId),
      unrelatedCatalogPreserved: true, previous34PublicationsPreserved: true});
    console.log(JSON.stringify({figureKey: target.figureKey, status: "published", exactReadback: true}));
  }
  const after = await catalog(); const finalStates = preserve(after, baseline, selection.targets);
  assert(finalStates.every(state => state === "published")); publicationHealth(after, 44);
  const receipt = {completedAt: new Date().toISOString(), ok: true, mode: "published-ten", projectHost,
    selectionSha256, baselineSha256, gateSha256, totalValidPublications: 44, quarantinedRows: 0,
    previous34PublicationsPreserved: true, unrelatedCatalogPreserved: true, exactReadback: true,
    targets: selection.targets.map(target => ({figureKey: target.figureKey, storySpecId: target.storySpecId,
      candidateSha256: target.candidateSha256, stageSha256: target.stageSha256, productionStageSha256: target.productionStageSha256,
      reviewedReceiptSha256: sha(readFileSync(resolve(packet, `REVIEWED-${target.figureKey}.json`))),
      publishedReceiptSha256: sha(readFileSync(resolve(packet, `PUBLISHED-${target.figureKey}.json`)))}))};
  const finalPath = resolve(packet, "DATABASE-RECEIPT.json");
  if (existsSync(finalPath)) {
    const previous = readJson<typeof receipt>(finalPath); same({...receipt, completedAt: previous.completedAt}, previous, "Final publication receipt changed");
  } else saveOnce(finalPath, receipt);
  console.log(JSON.stringify({ok: true, stories: 10, totalValidPublications: 44, quarantinedRows: 0}));
}
main().catch(error => {console.error(error instanceof Error ? error.message : "Publication tool failed"); process.exitCode = 1;});
