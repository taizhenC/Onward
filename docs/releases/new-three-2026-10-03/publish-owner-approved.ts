// No environment loading or network until explicit live mode and all byte/proof checks pass.
import "../../../scripts/_smoke-bootstrap";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, isAbsolute, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { inspectPublishedStorySpecRows, parseStorySpecRow } from "../../../lib/story-spec-repository";
import type { StorySpec } from "../../../lib/story-spec-types";
import type { FigureStageRow } from "../../../lib/types";
import { draftImportBaselinePath, draftImportBaselineSha256, librarySha256, ownerAuthorizationSha256,
  packetRelative, projectHost, readApprovedInputs, readDeploymentProof, readJson, relativeFile, repository, same, sha, stable,
  type Approved, type Pin, type Target } from "./owner-publication-authority";

export type FigureRow = {key: string; display_name: string; birth_year: number | null; death_year: number | null};
export type StageRow = {figure_key: string; stage_id: string; stage_label: string; age_min: number; age_max: number;
  shape_sentences: string[]; facets: FigureStageRow["facets"]; biographical_facts: string; themes: string[]; anti_themes: string[];
  beats: FigureStageRow["beats"]; sources: string[]; status: string};
export type SpecRow = {story_spec_id: string; figure_key: string; stage_id: string; version: number; schema_version: string;
  status: string; spec: StorySpec; created_at: string; published_at: string | null; retired_at: string | null};
export type VersionedRow = SpecRow & {xmin: string | number};
export type Catalog = {figures: FigureRow[]; stages: StageRow[]; specs: SpecRow[]};
export const figureColumns = "key,display_name,birth_year,death_year";
export const stageColumns = "figure_key,stage_id,stage_label,age_min,age_max,shape_sentences,facets,biographical_facts,themes,anti_themes,beats,sources,status";
export const specColumns = "story_spec_id,figure_key,stage_id,version,schema_version,status,spec,created_at,published_at,retired_at";
const privateRoot = resolve(repository, "docs/research/new-three-2026-10-03/publication");
export const coreRow = (row: SpecRow) => ({story_spec_id: row.story_spec_id, figure_key: row.figure_key, stage_id: row.stage_id,
  version: row.version, schema_version: row.schema_version, status: row.status, spec: row.spec});
export const figureRow = (stage: FigureStageRow): FigureRow => ({key: stage.figureKey, display_name: stage.displayName,
  birth_year: stage.birthYear ?? null, death_year: stage.deathYear ?? null});
export const stageRow = (stage: FigureStageRow, status: string): StageRow => ({figure_key: stage.figureKey, stage_id: stage.stageId,
  stage_label: stage.stageLabel, age_min: stage.ageMin, age_max: stage.ageMax, shape_sentences: stage.shapeSentences,
  facets: stage.facets, biographical_facts: stage.biographicalFacts, themes: stage.themes, anti_themes: stage.antiThemes,
  beats: stage.beats, sources: stage.sources, status});
export const specRow = (spec: StorySpec, createdAt: string): SpecRow => ({story_spec_id: spec.storySpecId, figure_key: spec.figureKey,
  stage_id: spec.stageId, version: spec.version, schema_version: spec.schemaVersion, status: spec.status, spec,
  created_at: createdAt, published_at: null, retired_at: null});
const sort = <T>(rows: T[], key: (row: T) => string) => [...rows].sort((a, b) => key(a).localeCompare(key(b)));
const stageKey = (row: StageRow | SpecRow) => `${row.figure_key}:${row.stage_id}`;
export function catalogHashes(catalog: Catalog) {
  return {figures: sha(stable(sort(catalog.figures, row => row.key))), stages: sha(stable(sort(catalog.stages, stageKey))),
    specs: sha(stable(sort(catalog.specs, row => row.story_spec_id)))};
}
export function publicationHealth(catalog: Catalog, count: number) {
  const published = catalog.specs.filter(row => row.status === "published");
  const inspection = inspectPublishedStorySpecRows(published.map(coreRow));
  same([published.length, inspection.catalog.size, inspection.quarantinedRowCount], [count, count, 0], "Publication count/quarantine failed");
  const keys = new Set(published.map(stageKey));
  for (const stage of catalog.stages) assert.equal(stage.status === "published", keys.has(stageKey(stage)), "Stage/publication lifecycle parity failed");
  return inspection;
}
function exactKeys(value: object, keys: string[], label: string) {same(Object.keys(value).sort(), [...keys].sort(), label);}
export function targetState(catalog: Catalog, target: Target, initial: SpecRow, capturedAt: string): "draft" | "review" | "published" {
  const siblings = catalog.specs.filter(row => row.figure_key === target.figureKey && row.stage_id === target.stage.stageId);
  assert.equal(siblings.length, 1, "Target has an additional version; promotion could retire an unrelated publication");
  const row = siblings[0]; assert.equal(row.story_spec_id, target.storySpecId);
  exactKeys(row, specColumns.split(","), "Target row projection differs");
  assert(["draft", "review", "published"].includes(row.status), "Unexpected target state");
  const status = row.status as "draft" | "review" | "published";
  const doc = status === "draft" ? target.draft : status === "review" ? target.reviewed : target.published;
  same(coreRow(row), coreRow(specRow(doc, initial.created_at)), "Complete target document/core differs from authorization");
  assert.equal(row.created_at, initial.created_at, "Target creation timestamp changed");
  assert.equal(row.retired_at, null, "Target retirement timestamp is nonnull");
  if (status === "published") {
    assert(typeof row.published_at === "string" && Number.isFinite(Date.parse(row.published_at)), "Missing publication time");
    assert(Date.parse(row.published_at) >= Date.parse(capturedAt), "Target publication predates pinned preflight");
    assert(parseStorySpecRow(coreRow(row), "published"), "Published row integrity failed");
  } else {
    assert.equal(row.published_at, null, "Unpublished target has publication time");
    if (status === "review") assert(parseStorySpecRow(coreRow(row), "review"), "Review row integrity failed");
  }
  const stage = catalog.stages.find(item => stageKey(item) === stageKey(row)); assert(stage, "Missing target stage");
  same(stage, stageRow(target.stage, status === "published" ? "published" : "draft"), "Complete target stage/status differs");
  return status;
}
export function assertCatalog(catalog: Catalog, baseline: Catalog, approved: Approved, capturedAt: string) {
  same([catalog.figures.length, catalog.stages.length, catalog.specs.length], [63, 63, 64], "Catalog row counts changed");
  same([baseline.figures.length, baseline.stages.length, baseline.specs.length], [63, 63, 64], "Baseline has wrong counts");
  for (const [rows, key] of [[catalog.figures, (row: FigureRow) => row.key], [catalog.stages, stageKey],
    [catalog.specs, (row: SpecRow) => row.story_spec_id]] as const) {
    const strings = rows.map(key as (row: FigureRow | StageRow | SpecRow) => string);
    assert.equal(new Set(strings).size, rows.length, "Duplicate catalog identity");
  }
  same(sort(catalog.figures, row => row.key), sort(baseline.figures, row => row.key), "Existing figure rows changed");
  const isTargetStage = (row: StageRow) => approved.targets.some(target => row.figure_key === target.figureKey && row.stage_id === target.stage.stageId);
  const isTargetSpec = (row: SpecRow) => approved.targets.some(target => row.story_spec_id === target.storySpecId);
  same(sort(catalog.stages.filter(row => !isTargetStage(row)), stageKey), sort(baseline.stages.filter(row => !isTargetStage(row)), stageKey), "Unrelated sixty stages changed");
  same(sort(catalog.specs.filter(row => !isTargetSpec(row)), row => row.story_spec_id), sort(baseline.specs.filter(row => !isTargetSpec(row)), row => row.story_spec_id), "Unrelated sixty-one specs/lifecycle changed");
  let published = 0;
  for (const target of approved.targets) {
    const initial = baseline.specs.find(row => row.story_spec_id === target.storySpecId); assert(initial);
    same(initial, specRow(target.draft, initial.created_at), "Baseline is not complete exact draft");
    assert(Number.isFinite(Date.parse(initial.created_at)), "Baseline creation time is absent");
    same(baseline.stages.find(row => row.figure_key === target.figureKey && row.stage_id === target.stage.stageId), stageRow(target.stage, "draft"), "Baseline target stage differs");
    same(catalog.figures.find(row => row.key === target.figureKey), figureRow(target.stage), "Target figure source parity failed");
    if (targetState(catalog, target, initial, capturedAt) === "published") published++;
  }
  publicationHealth(baseline, 44); publicationHealth(catalog, 44 + published);
  return published;
}
export function assertImportPreserved(catalog: Catalog) {
  assert.equal(sha(readFileSync(relativeFile(draftImportBaselinePath))), draftImportBaselineSha256, "Original draft-import baseline changed");
  const initial = readJson<{snapshot: Catalog}>(relativeFile(draftImportBaselinePath)).snapshot;
  for (const [oldRows, freshRows, key] of [[initial.figures, catalog.figures, (row: FigureRow) => row.key],
    [initial.stages, catalog.stages, stageKey], [initial.specs, catalog.specs, (row: SpecRow) => row.story_spec_id]] as const) {
    for (const row of oldRows) same(freshRows.find(item => key(item as FigureRow & StageRow & SpecRow) === key(row as FigureRow & StageRow & SpecRow)), row, "A pre-import row or lifecycle changed");
  }
  publicationHealth(initial, 44);
}
export function withoutXmin(row: VersionedRow): SpecRow {const rest = {...row}; delete (rest as Partial<VersionedRow>).xmin; return rest;}
export function reviewCasQuery(row: VersionedRow, target: Target) {
  assert(/^\d+$/.test(String(row.xmin)), "Missing numeric fresh xmin");
  same(withoutXmin(row), specRow(target.draft, row.created_at), "Fresh xmin row is not complete exact draft");
  const query = new URLSearchParams({story_spec_id: `eq.${target.storySpecId}`, figure_key: `eq.${target.figureKey}`,
    stage_id: `eq.${target.stage.stageId}`, version: `eq.${target.draft.version}`, schema_version: `eq.${target.draft.schemaVersion}`,
    status: "eq.draft", xmin: `eq.${row.xmin}`, created_at: `eq.${row.created_at}`, published_at: "is.null", retired_at: "is.null",
    select: specColumns + ",xmin"});
  return query;
}
export function assertCasResult(rows: VersionedRow[], prior: VersionedRow, target: Target) {
  assert.equal(rows.length, 1, "Draft review CAS did not change exactly one current row");
  same(withoutXmin(rows[0]), {...withoutXmin(prior), status: "review", spec: target.reviewed}, "CAS returned a changed/unapproved row");
  assert(/^\d+$/.test(String(rows[0].xmin)), "CAS omitted row version");
  assert.notEqual(String(rows[0].xmin), String(prior.xmin), "Review update did not advance row version");
  assert(parseStorySpecRow(coreRow(rows[0]), "review"), "CAS review integrity failed");
}
export type Transport = {catalog(): Promise<Catalog>; versioned(target: Target): Promise<VersionedRow>;
  review(target: Target, observed: VersionedRow): Promise<VersionedRow[]>; promote(target: Target): Promise<void>};
export async function reviewDraft(transport: Transport, target: Target, fresh: Catalog) {
  const observed = await transport.versioned(target);
  same(withoutXmin(observed), fresh.specs.find(row => row.story_spec_id === target.storySpecId), "Target changed since full catalog validation");
  reviewCasQuery(observed, target);
  const returned = await transport.review(target, observed); assertCasResult(returned, observed, target);
}
async function liveTransport(): Promise<Transport> {
  // Read only the two needed DB variables; do not initialize Auth or any provider client.
  const {loadEnvLocal} = await import("../../../scripts/_load-env"); loadEnvLocal();
  const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
  same([url.protocol, url.hostname, url.port, url.username, url.password, url.pathname, url.search, url.hash],
    ["https:", projectHost, "", "", "", "/", "", ""], "Different production database target");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY; assert(key, "Production service key unavailable");
  async function request(table: "figures" | "figure_stages" | "story_specs" | "rpc/promote_story_spec_v2", method: "GET" | "PATCH" | "POST", query: URLSearchParams, body?: unknown) {
    assert(method === "GET" || (method === "PATCH" && table === "story_specs") || (method === "POST" && table === "rpc/promote_story_spec_v2"), "Forbidden transport mutation");
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 15_000);
    try {
      const response = await fetch(`${url.origin}/rest/v1/${table}?${query}`, {method, signal: controller.signal, redirect: "error",
        headers: {apikey: key!, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "count=exact,return=representation"},
        ...(body === undefined ? {} : {body: JSON.stringify(body)})});
      assert(response.ok, `Curated database request failed (${response.status}); response contents withheld`);
      assert(Number(response.headers.get("content-length") ?? 0) <= 4 * 1024 * 1024, "Database response too large");
      const reader = response.body?.getReader();
      if (!reader) {
        assert(method === "POST" && table === "rpc/promote_story_spec_v2" && response.status === 204, "Empty database response");
        return null;
      }
      const chunks: Uint8Array[] = []; let size = 0;
      while (true) {const next = await reader.read(); if (next.done) break; size += next.value.length;
        assert(size <= 4 * 1024 * 1024, "Database response exceeded bounded limit"); chunks.push(next.value);}
      const text = Buffer.concat(chunks).toString("utf8");
      const rows: unknown = text ? JSON.parse(text) : null;
      if (method !== "POST") {
        assert(Array.isArray(rows), "Database did not return rows");
        const range = response.headers.get("content-range"); assert(range && /\/\d+$/.test(range), "Exact response count is absent");
        assert.equal(rows.length, Number(range.split("/")[1]), "Database rows were truncated or count changed");
      }
      return rows;
    } finally {clearTimeout(timer);}
  }
  const read = (table: "figures" | "figure_stages" | "story_specs", columns: string, order: string) => request(table, "GET", new URLSearchParams({select: columns, order, limit: "100"}));
  return {
    async catalog() {const [figures, stages, specs] = await Promise.all([read("figures", figureColumns, "key.asc"), read("figure_stages", stageColumns, "figure_key.asc,stage_id.asc"), read("story_specs", specColumns, "story_spec_id.asc")]);
      return {figures: figures as FigureRow[], stages: stages as StageRow[], specs: specs as SpecRow[]};},
    async versioned(target) {const rows = await request("story_specs", "GET", new URLSearchParams({select: specColumns + ",xmin", story_spec_id: `eq.${target.storySpecId}`, limit: "2"})) as VersionedRow[];
      assert.equal(rows.length, 1, "Fresh target version is missing/ambiguous"); return rows[0];},
    async review(target, observed) {return await request("story_specs", "PATCH", reviewCasQuery(observed, target), {status: "review", spec: target.reviewed}) as VersionedRow[];},
    async promote(target) {await request("rpc/promote_story_spec_v2", "POST", new URLSearchParams(), {p_story_spec_id: target.storySpecId, p_expected_review_spec: target.reviewed});},
  };
}
type Selection = {schemaVersion: string; capturedAt: string; projectHost: string; ownerAuthorizationSha256: string; librarySha256: string;
  draftImportBaselineSha256: string; deploymentProof: Pin; sourcePins: Pin[]; baselinePath: string; targets: Array<{figureKey: string; storySpecId: string; candidateSha256: string; stageSha256: string; reviewedSpecSha256: string; publishedSpecSha256: string}>};
type Baseline = {schemaVersion: string; capturedAt: string; projectHost: string; selectionSha256: string; initialPublishedStoryCount: number;
  catalogHashes: ReturnType<typeof catalogHashes>; catalog: Catalog};
function targetPins(approved: Approved): Selection["targets"] {return approved.targets.map(target => ({figureKey: target.figureKey, storySpecId: target.storySpecId,
  candidateSha256: target.candidateSha256, stageSha256: target.stageSha256, reviewedSpecSha256: sha(stable(target.reviewed)), publishedSpecSha256: sha(stable(target.published))}));}
export function assertImmutableReceipt(existing: unknown, expected: unknown, label: string) {same(existing, expected, `Immutable receipt differs: ${label}`);}
export function assertPublishedRecovery(hasArchive: boolean) {assert(hasArchive, "Already-published retry lacks the pinned pre-publication full review archive");}
function writeOnce(path: string, value: unknown) {
  if (existsSync(path)) assertImmutableReceipt(readJson(path), value, basename(path));
  else writeFileSync(path, JSON.stringify(value, null, 2) + "\n", {flag: "wx"});
  return sha(readFileSync(path));
}
function privatePath(path: string) {
  assert(isAbsolute(path), "Private receipt path must be absolute");
  const resolved = resolve(path); const rel = relative(privateRoot, resolved);
  assert(rel && !rel.startsWith("..") && !isAbsolute(rel), "Private receipt is outside the exact release publication folder"); return resolved;
}
export function assertSelection(selection: Selection, baseline: Baseline, approved: Approved, selectionSha: string, proof: Pin) {
  same([selection.schemaVersion, selection.projectHost, selection.ownerAuthorizationSha256, selection.librarySha256, selection.draftImportBaselineSha256],
    ["new-three-owner-publication-selection-v1", projectHost, ownerAuthorizationSha256, librarySha256, draftImportBaselineSha256], "Selection authority changed");
  same(selection.deploymentProof, proof, "Selection deployment proof changed"); same(selection.sourcePins, approved.sourcePins, "Selection executable/source pins changed");
  same(selection.targets, targetPins(approved), "Selection exact target hashes changed");
  same([baseline.schemaVersion, baseline.projectHost, baseline.selectionSha256, baseline.initialPublishedStoryCount, baseline.capturedAt],
    ["new-three-owner-publication-baseline-v1", projectHost, selectionSha, 44, selection.capturedAt], "Baseline/selection binding changed");
  assert(Number.isFinite(Date.parse(selection.capturedAt)) && Date.parse(selection.capturedAt) >= Date.parse(approved.authority.authorizedAt), "Preflight predates owner authority");
  same(baseline.catalogHashes, catalogHashes(baseline.catalog), "Baseline catalog hashes changed");
  assertImportPreserved(baseline.catalog); assertCatalog(baseline.catalog, baseline.catalog, approved, baseline.capturedAt);
  assert(approved.targets.every(target => baseline.catalog.specs.find(row => row.story_spec_id === target.storySpecId)?.status === "draft"), "Preflight baseline is not all draft");
}
type PublishedReceipt = {schemaVersion: string; ownerAuthorizationSha256: string; selectionSha256: string; baselineSha256: string;
  observedAt: string; figureKey: string; storySpecId: string; publishedSpecSha256: string; row: SpecRow; stage: StageRow};
function publicTargetReceipt(target: Target, catalog: Catalog, selectionSha: string, baselineSha: string) {
  const path = relativeFile(`${packetRelative}/PUBLISHED-${target.figureKey}.json`);
  const row = catalog.specs.find(item => item.story_spec_id === target.storySpecId)!;
  const stage = catalog.stages.find(item => item.figure_key === target.figureKey && item.stage_id === target.stage.stageId)!;
  const receipt: PublishedReceipt = {schemaVersion: "new-three-published-target-v1", ownerAuthorizationSha256, selectionSha256: selectionSha,
    baselineSha256: baselineSha, observedAt: existsSync(path) ? readJson<PublishedReceipt>(path).observedAt : new Date().toISOString(),
    figureKey: target.figureKey, storySpecId: target.storySpecId, publishedSpecSha256: sha(stable(target.published)), row, stage};
  return {figureKey: target.figureKey, storySpecId: target.storySpecId, candidateSha256: target.candidateSha256, stageSha256: target.stageSha256,
    publishedSpecSha256: receipt.publishedSpecSha256, publishedReceiptFile: `${packetRelative}/PUBLISHED-${target.figureKey}.json`, publishedReceiptSha256: writeOnce(path, receipt)};
}
function validateReviewArchive(path: string, target: Target, initial: SpecRow, selectionSha: string, baselineSha: string) {
  const expected = {schemaVersion: "new-three-reviewed-target-v1", ownerAuthorizationSha256, selectionSha256: selectionSha, baselineSha256: baselineSha,
    storySpecId: target.storySpecId, reviewedSpecSha256: sha(stable(target.reviewed)), row: {...initial, status: "review", spec: target.reviewed}};
  if (existsSync(path)) same(readJson(path), expected, "Pinned full review archive changed");
  return expected;
}
function options(args: string[]) {
  const flags = new Map<string, string>();
  for (const arg of args) {const [name, ...value] = arg.split("="); assert(!flags.has(name), "Duplicate argument");
    assert(["--preflight", "--publish", "--verify", "--deployment-proof", "--deployment-proof-sha256", "--selection", "--selection-sha256", "--baseline", "--baseline-sha256"].includes(name), "Unknown argument");
    flags.set(name, value.join("="));}
  const modes = ["--preflight", "--publish", "--verify"].filter(flag => flags.has(flag)); assert.equal(modes.length, 1, "Select exactly one live mode");
  assert.equal(flags.get(modes[0]), "", "Mode takes no value");
  const required = modes[0] === "--preflight" ? ["--deployment-proof", "--deployment-proof-sha256"] : ["--deployment-proof", "--deployment-proof-sha256", "--selection", "--selection-sha256", "--baseline", "--baseline-sha256"];
  assert.equal(flags.size, required.length + 1, "Unexpected mode arguments"); required.forEach(flag => assert(flags.get(flag), `Missing ${flag}`));
  for (const flag of required.filter(flag => flag.endsWith("sha256"))) assert(/^[a-f0-9]{64}$/.test(flags.get(flag)!), `Invalid ${flag}`);
  return {mode: modes[0].slice(2) as "preflight" | "publish" | "verify", flags};
}
export async function main(args = process.argv.slice(2)) {
  if (args.length === 0 || (args.length === 1 && args[0] === "--self-test")) {
    const {runOfflineChecks} = await import("./check-owner-publication"); return runOfflineChecks();
  }
  const {mode, flags} = options(args); const approved = readApprovedInputs();
  assert.equal(sha(readFileSync(relativeFile(draftImportBaselinePath))), draftImportBaselineSha256, "Original draft-import baseline changed before live access");
  const proofPin: Pin = {path: resolve(flags.get("--deployment-proof")!), sha256: flags.get("--deployment-proof-sha256")!};
  readDeploymentProof(proofPin.path, proofPin.sha256, approved, mode);
  let selection: Selection; let baseline: Baseline; let selectionPath: string; let baselinePath: string; let selectionSha: string; let baselineSha: string;
  // All receipt/authority/proof validation precedes loading credentials or touching the network.
  if (mode !== "preflight") {
    selectionPath = privatePath(flags.get("--selection")!); baselinePath = privatePath(flags.get("--baseline")!);
    selectionSha = flags.get("--selection-sha256")!; baselineSha = flags.get("--baseline-sha256")!;
    assert.equal(sha(readFileSync(selectionPath)), selectionSha, "Selection byte pin changed"); assert.equal(sha(readFileSync(baselinePath)), baselineSha, "Baseline byte pin changed");
    selection = readJson<Selection>(selectionPath); baseline = readJson<Baseline>(baselinePath);
    assert.equal(selection.baselinePath, baselinePath, "Selection points at different baseline");
    assert.equal(resolve(selectionPath, ".."), resolve(baselinePath, ".."), "Selection/baseline attempts differ");
    assertSelection(selection, baseline, approved, selectionSha, proofPin);
  }
  const transport = await liveTransport();
  if (mode === "preflight") {
    const catalog = await transport.catalog(); const capturedAt = new Date().toISOString();
    assertImportPreserved(catalog); assert.equal(assertCatalog(catalog, catalog, approved, capturedAt), 0, "Preflight requires three exact drafts");
    const dir = resolve(privateRoot, `${capturedAt.replace(/[:.]/g, "-")}-${randomUUID()}`); mkdirSync(dir, {recursive: true});
    selectionPath = resolve(dir, "SELECTION.json"); baselinePath = resolve(dir, "BASELINE.json");
    selection = {schemaVersion: "new-three-owner-publication-selection-v1", capturedAt, projectHost, ownerAuthorizationSha256, librarySha256,
      draftImportBaselineSha256, deploymentProof: proofPin, sourcePins: approved.sourcePins, baselinePath, targets: targetPins(approved)};
    selectionSha = writeOnce(selectionPath, selection);
    baseline = {schemaVersion: "new-three-owner-publication-baseline-v1", capturedAt, projectHost, selectionSha256: selectionSha,
      initialPublishedStoryCount: 44, catalogHashes: catalogHashes(catalog), catalog};
    baselineSha = writeOnce(baselinePath, baseline);
    console.log(JSON.stringify({ok: true, mode, selectionPath, selectionSha256: selectionSha, baselinePath, baselineSha256: baselineSha,
      deploymentProofSha256: proofPin.sha256, rows: {figures: 63, stages: 63, specs: 64}, totalValidPublications: 44, databaseMutations: 0})); return;
  }
  // Non-preflight variables were assigned before the credential/network boundary above.
  const initialBaseline = baseline!; const initialSelection = selection!; const selectionHash = selectionSha!; const baselineHash = baselineSha!;
  const receiptDirectory = resolve(selectionPath!, ".."); const publicationPath = relativeFile(`${packetRelative}/PUBLICATION-RECEIPT.json`);
  if (mode === "publish") {
    for (const target of approved.targets) {
      let current = await transport.catalog(); assertImportPreserved(current); assertCatalog(current, initialBaseline.catalog, approved, initialBaseline.capturedAt);
      const initial = initialBaseline.catalog.specs.find(row => row.story_spec_id === target.storySpecId)!;
      let status = targetState(current, target, initial, initialBaseline.capturedAt);
      const reviewPath = resolve(receiptDirectory, `REVIEWED-${target.figureKey}.json`);
      const archive = validateReviewArchive(reviewPath, target, initial, selectionHash, baselineHash);
      if (status === "draft") {
        assert(!existsSync(reviewPath), "Draft conflicts with an already archived review");
        await reviewDraft(transport, target, current);
        current = await transport.catalog(); assertCatalog(current, initialBaseline.catalog, approved, initialBaseline.capturedAt); assertImportPreserved(current);
        status = targetState(current, target, initial, initialBaseline.capturedAt); assert.equal(status, "review", "Review CAS readback failed");
      }
      if (status === "review") {
        writeOnce(reviewPath, archive);
        // Fresh full read and sibling check immediately precede complete expected-document RPC.
        current = await transport.catalog(); assertImportPreserved(current); assertCatalog(current, initialBaseline.catalog, approved, initialBaseline.capturedAt);
        assert.equal(targetState(current, target, initial, initialBaseline.capturedAt), "review", "Review changed before promotion");
        await transport.promote(target);
        current = await transport.catalog(); assertImportPreserved(current); assertCatalog(current, initialBaseline.catalog, approved, initialBaseline.capturedAt);
        assert.equal(targetState(current, target, initial, initialBaseline.capturedAt), "published", "Publication RPC readback failed");
      } else {
        assertPublishedRecovery(existsSync(reviewPath));
      }
      publicTargetReceipt(target, current, selectionHash, baselineHash);
    }
  } else assert(existsSync(publicationPath), "Verification requires existing immutable publication receipt");
  const final = await transport.catalog(); assertImportPreserved(final); assert.equal(assertCatalog(final, initialBaseline.catalog, approved, initialBaseline.capturedAt), 3, "Final catalog is not exactly three authorized publications");
  const targets = approved.targets.map(target => {
    if (mode === "verify") assert(existsSync(relativeFile(`${packetRelative}/PUBLISHED-${target.figureKey}.json`)), "Verification cannot create publication authority");
    return publicTargetReceipt(target, final, selectionHash, baselineHash);
  });
  const publication = {schemaVersion: "new-three-owner-publication-receipt-v1", ok: true,
    completedAt: existsSync(publicationPath) ? readJson<{completedAt: string}>(publicationPath).completedAt : new Date().toISOString(), projectHost,
    ownerAuthorizationSha256, librarySha256, selectionSha256: selectionHash, baselineSha256: baselineHash, deploymentProofSha256: proofPin.sha256,
    totalValidPublications: 47, previous44PublicationsPreserved: true, unrelatedCatalogPreserved: true, exactReadback: true, quarantinedRows: 0,
    matchingTrustGatePassed: false, supplementalCoveragePassed: false, targets};
  if (mode === "publish") {
    const publicationReceiptSha256 = writeOnce(publicationPath, publication);
    console.log(JSON.stringify({...publication, publicationReceiptFile: `${packetRelative}/PUBLICATION-RECEIPT.json`, publicationReceiptSha256}));
  } else {
    same(readJson(publicationPath), publication, "Original publication receipt differs from final readback");
    const verifiedAt = new Date().toISOString(); const path = relativeFile(`${packetRelative}/POST-REFRESH-VERIFICATION-${verifiedAt.replace(/[:.]/g, "-")}-${randomUUID()}.json`);
    const verification = {...publication, schemaVersion: "new-three-post-refresh-verification-v1", verifiedAt,
      publicationReceiptSha256: sha(readFileSync(publicationPath)), originalDeploymentProof: initialSelection.deploymentProof, databaseMutations: 0};
    const verificationSha256 = writeOnce(path, verification); console.log(JSON.stringify({...verification, verificationPath: path, verificationSha256}));
  }
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  main().catch(error => {console.error(error instanceof Error ? error.message : "Scoped publication failed"); process.exitCode = 1;});
}
