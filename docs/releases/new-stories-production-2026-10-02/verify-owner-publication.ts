// Three bounded curated GETs only. No Auth, reader, provider or mutation path.
import "../../../scripts/_smoke-bootstrap";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { inspectPublishedStorySpecRows } from "../../../lib/story-spec-repository";
import { parseStorySpecDocument, validateStorySpec } from "../../../lib/story-spec";
import type { StorySpec } from "../../../lib/story-spec-types";
import type { FigureStageRow } from "../../../lib/types";
import { loadEnvLocal } from "../../../scripts/_load-env";
import { readApprovedV2Inputs, factsV2ProposalSha256, factsV2ReviewSha256 } from "./approved-stage-inputs-v2";

const PACKET = "docs/releases/new-stories-production-2026-10-02";
const HOST = "mbcqkljfekkxlgittzal.supabase.co";
const AUTHORITY_SHA = "454ea8a5eb1cba3c595d5824230cc2e5f1f4295bd6dae9e79c7958c3739a31d8";
const LIBRARY_SHA = "bb27964f0d5347deba75b20bd33c59ecba4289a6a95f9618b891fefbda020061";
const WRITING_BASELINE = "docs/research/new-stories-2026-10-02/WRITING-DB-BEFORE-UPDATE.json";
const WRITING_BASELINE_SHA = "9f187094626f51a39c59ed15bd6e7d8f9e98c13a677a67f7361104658da5875c";
const FAILED_EVIDENCE = "ev_6f9f15f110e062a26799e08df3b71ddf2de73be13d1f230a44b3262576a6ba1d";
const DEADLINE_MS = 15_000;
const MAX_BYTES = 4 * 1024 * 1024;
const LIMIT = 100;
const FIELDS = {
  figures: "key,display_name,birth_year,death_year",
  stages: "figure_key,stage_id,stage_label,age_min,age_max,shape_sentences,facets,biographical_facts,themes,anti_themes,beats,sources,status",
  specs: "story_spec_id,figure_key,stage_id,version,schema_version,status,spec",
} as const;
const LIFECYCLE = "created_at,published_at,retired_at";
const RELEASE_CHECKS = { realProviderTrustGate: false, ownerException: true, recipeGovernance: true, unchangedRecipeSelection: true };
type Row = Record<string, unknown>;
type Stage = Row & { figure_key: string; stage_id: string; status: string };
type Spec = Row & { story_spec_id: string; figure_key: string; stage_id: string; status: string; spec: StorySpec };
type Catalog = { figures: Row[]; stages: Stage[]; specs: Spec[] };
type Pin = { figureKey: string; storySpecId: string; candidateSha256: string; stageSha256: string; productionStageSha256: string };
type Target = Pin & { draft: StorySpec; authoredStage: FigureStageRow; stage: FigureStageRow; reviewed: StorySpec };
type Selection = { schemaVersion: string; capturedAt: string; ownerAuthorizationSha256: string; ownerId: string; ownerStatement: string;
  projectHost: string; ownerReleaseSha256: string; approvedStageProposalSha256: string; approvedStageReviewSha256: string; targets: Target[] };
type Baseline = { capturedAt: string; projectHost: string; selectionSha256: string; initialPublishedStoryCount: number; catalog: Catalog };
type FinalReceipt = { ok: boolean; mode: string; completedAt: string; projectHost: string; ownerAuthorizationSha256: string;
  releaseChecks: typeof RELEASE_CHECKS; actualFailedEvidenceIds: string[]; selectionSha256: string; baselineSha256: string;
  ownerReleaseSha256: string; totalValidPublications: number; quarantinedRows: number; targets: Array<Pin & { reviewedReceiptSha256: string; publishedReceiptSha256: string }> };
type Archived = { observedAt: string; selectionSha256: string; baselineSha256: string; ownerReleaseSha256: string; row: Spec;
  stage?: Stage; reviewedReceiptSha256?: string };
const sha = (bytes: string | Buffer) => createHash("sha256").update(bytes).digest("hex");
const fileHash = (path: string) => sha(readFileSync(resolve(path)));
const read = <T>(path: string): T => JSON.parse(readFileSync(resolve(path), "utf8")) as T;
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object") return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(",")}}`;
  return JSON.stringify(value);
}
const equal = (a: unknown, b: unknown, code: string) => assert.equal(canonical(a), canonical(b), code);
const pick = (row: Row, fields: string) => Object.fromEntries(fields.split(",").map(key => [key, row[key]]));
const sorted = <T extends Row>(rows: T[], key: string) => [...rows].sort((a, b) => String(a[key]).localeCompare(String(b[key])));
const stageKey = (row: Stage) => `${row.figure_key}\u0000${row.stage_id}`;
const pinned = (target: Pin): Pin => ({ figureKey: target.figureKey, storySpecId: target.storySpecId, candidateSha256: target.candidateSha256,
  stageSha256: target.stageSha256, productionStageSha256: target.productionStageSha256 });
function stageRow(stage: FigureStageRow, status = "published"): Stage {
  return { figure_key: stage.figureKey, stage_id: stage.stageId, stage_label: stage.stageLabel,
    age_min: stage.ageMin, age_max: stage.ageMax, shape_sentences: stage.shapeSentences, facets: stage.facets,
    biographical_facts: stage.biographicalFacts, themes: stage.themes, anti_themes: stage.antiThemes, beats: stage.beats, sources: stage.sources, status };
}
function specRow(spec: StorySpec): Spec {
  return { story_spec_id: spec.storySpecId, figure_key: spec.figureKey, stage_id: spec.stageId, version: spec.version,
    schema_version: spec.schemaVersion, status: spec.status, spec };
}
function validateSelection(selection: Selection) {
  assert.equal(selection.schemaVersion, "new-ten-owner-exception-publication-v1", "post_selection_schema");
  assert.equal(selection.ownerAuthorizationSha256, AUTHORITY_SHA, "post_selection_authority");
  assert.equal(selection.projectHost, HOST, "post_selection_host");
  assert.equal(selection.ownerId, "taizhenC", "post_selection_owner");
  assert.equal(selection.ownerStatement, "I checked it, publish those into the production", "post_selection_statement");
  assert(Number.isFinite(Date.parse(selection.capturedAt)), "post_selection_date");
  assert.equal(selection.approvedStageProposalSha256, factsV2ProposalSha256, "post_proposal_changed");
  assert.equal(selection.approvedStageReviewSha256, factsV2ReviewSha256, "post_stage_review_changed");
  const approved = readApprovedV2Inputs();
  assert.equal(selection.targets.length, 10, "post_target_count");
  equal(selection.targets.map(pinned).sort((a, b) => a.figureKey.localeCompare(b.figureKey)), approved.map(pinned).sort((a, b) => a.figureKey.localeCompare(b.figureKey)), "post_target_pins_changed");
  for (const target of selection.targets) {
    const source = approved.find(input => input.figureKey === target.figureKey)!;
    equal(target.draft, source.draft, "post_candidate_changed");
    equal(target.authoredStage, source.original, "post_authored_stage_changed");
    equal(target.stage, source.proposed, "post_vtwo_stage_changed");
    equal(target.reviewed, { ...target.draft, status: "review", review: { researcherId: "taizhenC", historicalReviewerId: "taizhenC",
      toneReviewerId: "taizhenC", reviewedAt: selection.capturedAt, contentProfileReviewed: true } }, "post_owner_review_changed");
  }
}
function inspect(current: Catalog, selection: Selection, baseline: Baseline, writing: Catalog) {
  equal([current.figures.length, current.stages.length, current.specs.length], [60, 60, 61], "post_catalog_count");
  assert.equal(baseline.projectHost, HOST, "post_baseline_host");
  assert.equal(baseline.initialPublishedStoryCount, 34, "post_prior_publication_count");
  assert(Number.isFinite(Date.parse(baseline.capturedAt)), "post_baseline_date");
  const specIds = new Set(selection.targets.map(target => target.storySpecId));
  const stageIds = new Set(selection.targets.map(target => `${target.figureKey}\u0000${target.stage.stageId}`));
  equal(sorted(current.figures, "key"), sorted(baseline.catalog.figures, "key"), "post_figure_metadata_changed");
  equal(sorted(current.figures, "key"), sorted(writing.figures, "key"), "post_written_figure_metadata_changed");
  const unrelatedSpecs = current.specs.filter(row => !specIds.has(row.story_spec_id));
  const unrelatedStages = current.stages.filter(row => !stageIds.has(stageKey(row)));
  assert.equal(unrelatedSpecs.length, 51, "post_unrelated_spec_scope");
  assert.equal(unrelatedStages.length, 50, "post_unrelated_stage_scope");
  equal(sorted(unrelatedSpecs, "story_spec_id"), sorted(baseline.catalog.specs.filter(row => !specIds.has(row.story_spec_id)), "story_spec_id"), "post_unrelated_spec_or_lifecycle_changed");
  equal(sorted(unrelatedStages, "figure_key"), sorted(baseline.catalog.stages.filter(row => !stageIds.has(stageKey(row))), "figure_key"), "post_unrelated_stage_changed");
  equal(sorted(unrelatedSpecs.map(row => pick(row, FIELDS.specs)), "story_spec_id"), sorted(writing.specs.filter(row => !specIds.has(row.story_spec_id)), "story_spec_id"), "post_prior_fiftyone_core_changed");
  equal(sorted(unrelatedStages, "figure_key"), sorted(writing.stages.filter(row => !stageIds.has(stageKey(row))), "figure_key"), "post_prior_fifty_core_changed");
  const published = current.specs.filter(row => row.status === "published");
  const inspection = inspectPublishedStorySpecRows(published.map(row => pick(row, FIELDS.specs)));
  equal([published.length, inspection.catalog.size, inspection.quarantinedRowCount], [44, 44, 0], "post_published_health");
  const publishedStages = current.stages.filter(row => row.status === "published");
  assert.equal(publishedStages.length, 44, "post_published_stage_count");
  equal([...publishedStages.map(stageKey)].sort(), [...published.map(row => stageKey(row))].sort(), "post_publication_stage_parity");
  const priorPublished = baseline.catalog.specs.filter(row => row.status === "published");
  assert.equal(priorPublished.length, 34, "post_original_published_scope");
  const priorIds = new Set(priorPublished.map(row => row.story_spec_id));
  equal(sorted(published.filter(row => priorIds.has(row.story_spec_id)), "story_spec_id"), sorted(priorPublished, "story_spec_id"), "post_previous_thirtyfour_changed");
  const verified = selection.targets.map(target => {
    const row = current.specs.find(item => item.story_spec_id === target.storySpecId);
    const stage = current.stages.find(item => stageKey(item) === `${target.figureKey}\u0000${target.stage.stageId}`);
    const before = baseline.catalog.specs.find(item => item.story_spec_id === target.storySpecId);
    assert(row && stage && before, "post_target_missing");
    equal(pick(before, FIELDS.specs), specRow(target.draft), "post_baseline_target_not_exact_draft");
    equal([before.published_at, before.retired_at], [null, null], "post_baseline_draft_lifecycle_invalid");
    equal(baseline.catalog.stages.find(item => stageKey(item) === `${target.figureKey}\u0000${target.stage.stageId}`), stageRow(target.stage, "draft"), "post_baseline_stage_not_exact_vtwo");
    equal(pick(row, FIELDS.specs), specRow({ ...target.reviewed, status: "published" }), "post_published_document_changed");
    equal(stage, stageRow(target.stage), "post_published_stage_changed");
    equal({ ...row.spec, status: "draft", review: {} }, target.draft, "post_canonical_prose_or_source_changed");
    assert(parseStorySpecDocument(row.spec), "post_document_invalid");
    const validation = validateStorySpec(row.spec, { forPublish: true });
    assert(validation.valid && !validation.warnings.length, "post_publication_validation_failed");
    assert(typeof row.created_at === "string" && Number.isFinite(Date.parse(row.created_at)), "post_creation_date_invalid");
    equal(row.created_at, before.created_at, "post_creation_date_changed");
    assert(typeof row.published_at === "string" && Number.isFinite(Date.parse(row.published_at)) && Date.parse(row.published_at) >= Date.parse(baseline.capturedAt), "post_publication_date_invalid");
    equal(row.retired_at, null, "post_unexpected_retirement");
    return { ...pinned(target), stageId: target.stage.stageId, status: "published", exactFullDocument: true, exactV2Stage: true,
      exactCanonicalProseAndSources: true, exactOwnerReview: true, creationTimestampPreserved: true, publicationTimestampValid: true,
      currentSpecSha256: sha(canonical(pick(row, FIELDS.specs))), currentStageSha256: sha(canonical(stage)),
      currentLifecycleSha256: sha(canonical(pick(row, LIFECYCLE))) };
  });
  return { verified, counts: { figures: 60, stages: 60, specs: 61, rawPublishedSpecs: 44, validPublishedSpecs: 44, quarantinedPublishedSpecs: 0,
    publishedStages: 44, verifiedNewPublications: 10 }, priorPublishedSha256: sha(canonical(sorted(priorPublished, "story_spec_id"))),
    unrelatedSpecsSha256: sha(canonical(sorted(unrelatedSpecs, "story_spec_id"))), unrelatedStagesSha256: sha(canonical(sorted(unrelatedStages, "figure_key"))) };
}
async function query(table: "figures" | "figure_stages" | "story_specs", columns: string, order: string, base: URL, key: string) {
  const url = new URL(`/rest/v1/${table}`, base);
  url.search = new URLSearchParams({ select: columns, order, limit: String(LIMIT) }).toString();
  const started = performance.now();
  const response = await fetch(url, { method: "GET", redirect: "error", signal: AbortSignal.timeout(DEADLINE_MS),
    headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: "application/json", Prefer: "count=exact" } });
  if (!response.ok) { if (response.body) void response.body.cancel().catch(() => {}); throw new Error("post_curated_query_failed"); }
  const total = Number((response.headers.get("content-range") ?? "").split("/")[1]);
  if (!Number.isInteger(total) || total < 0 || total > LIMIT) throw new Error("post_curated_count_unbounded");
  const reader = response.body?.getReader(); if (!reader) throw new Error("post_curated_body_missing");
  let bytes = 0; const chunks: Uint8Array[] = [];
  try {
    for (;;) { const part = await reader.read(); if (part.done) break; bytes += part.value.byteLength;
      if (bytes > MAX_BYTES) { void reader.cancel().catch(() => {}); throw new Error("post_curated_response_limit"); }
      chunks.push(part.value); }
  } finally { reader.releaseLock(); }
  const rows: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  if (!Array.isArray(rows) || rows.length !== total || !rows.every(row => row && typeof row === "object" && !Array.isArray(row))) throw new Error("post_curated_rows_invalid");
  return { rows: rows as Row[], table, rowCount: total, responseBytes: bytes, elapsedMs: Math.round(performance.now() - started) };
}
function selfTest() {
  globalThis.fetch = async () => { throw new Error("post_offline_network_forbidden"); };
  const writing = read<Catalog>(WRITING_BASELINE);
  const capturedAt = "2026-10-03T01:00:00.000Z", createdAt = "2026-10-02T01:00:00.000Z", publishedAt = "2026-10-03T01:01:00.000Z";
  const targets = readApprovedV2Inputs().map(input => ({ ...pinned(input), draft: input.draft, authoredStage: input.original, stage: input.proposed,
    reviewed: { ...input.draft, status: "review" as const, review: { researcherId: "taizhenC", historicalReviewerId: "taizhenC", toneReviewerId: "taizhenC", reviewedAt: capturedAt, contentProfileReviewed: true } } }));
  const selection: Selection = { schemaVersion: "new-ten-owner-exception-publication-v1", capturedAt, ownerAuthorizationSha256: AUTHORITY_SHA, ownerId: "taizhenC", ownerStatement: "I checked it, publish those into the production", projectHost: HOST, ownerReleaseSha256: "0".repeat(64), approvedStageProposalSha256: factsV2ProposalSha256, approvedStageReviewSha256: factsV2ReviewSha256, targets };
  validateSelection(selection);
  const before = structuredClone(writing);
  before.specs.forEach(row => { row.created_at = createdAt; row.published_at = row.status === "published" ? createdAt : null; row.retired_at = row.status === "retired" ? createdAt : null; });
  for (const target of targets) {
    Object.assign(before.stages.find(row => stageKey(row) === `${target.figureKey}\u0000${target.stage.stageId}`)!, stageRow(target.stage, "draft"));
    Object.assign(before.specs.find(row => row.story_spec_id === target.storySpecId)!, specRow(target.draft));
  }
  const baseline: Baseline = { capturedAt, projectHost: HOST, selectionSha256: "0".repeat(64), initialPublishedStoryCount: 34, catalog: before };
  const current = structuredClone(before);
  for (const target of targets) {
    Object.assign(current.stages.find(row => stageKey(row) === `${target.figureKey}\u0000${target.stage.stageId}`)!, stageRow(target.stage));
    Object.assign(current.specs.find(row => row.story_spec_id === target.storySpecId)!, specRow({ ...target.reviewed, status: "published" }), { published_at: publishedAt });
  }
  inspect(current, selection, baseline, writing);
  const mutations: Array<[string, (catalog: Catalog) => void]> = [
    ["draft target", catalog => { catalog.specs.find(row => row.story_spec_id === targets[0].storySpecId)!.status = "draft"; }],
    ["changed canonical story", catalog => { catalog.specs.find(row => row.story_spec_id === targets[0].storySpecId)!.spec.arc[0].canonicalText += " Changed."; }],
    ["changed owner review", catalog => { catalog.specs.find(row => row.story_spec_id === targets[0].storySpecId)!.spec.review.toneReviewerId = "someone-else"; }],
    ["changed v2 facts", catalog => { catalog.stages.find(row => row.figure_key === targets[0].figureKey)!.biographical_facts = "Changed."; }],
    ["changed prior publication", catalog => { catalog.specs.find(row => row.status === "published" && !targets.some(target => target.storySpecId === row.story_spec_id))!.published_at = publishedAt; }],
    ["changed unrelated draft", catalog => { catalog.specs.find(row => row.status === "draft" && !targets.some(target => target.storySpecId === row.story_spec_id))!.created_at = publishedAt; }],
    ["changed target creation timestamp", catalog => { catalog.specs.find(row => row.story_spec_id === targets[0].storySpecId)!.created_at = publishedAt; }],
    ["missing target publication timestamp", catalog => { catalog.specs.find(row => row.story_spec_id === targets[0].storySpecId)!.published_at = null; }],
    ["changed source attribution", catalog => { catalog.specs.find(row => row.story_spec_id === targets[0].storySpecId)!.spec.sources[0].citation += " Changed."; }],
    ["quarantined published spec", catalog => { catalog.specs.find(row => row.story_spec_id === targets[0].storySpecId)!.spec.schemaVersion = "invalid" as StorySpec["schemaVersion"]; }],
  ];
  for (const [label, mutate] of mutations) { const changed = structuredClone(current); mutate(changed); let rejected = false;
    try { inspect(changed, selection, baseline, writing); } catch { rejected = true; } assert(rejected, `post_offline_accepted_${label.replaceAll(" ", "_")}`); }
  console.log(JSON.stringify({ ok: true, mode: "offline-postpublication-self-test", positiveCase: true, negativeCases: mutations.length, networkRequests: 0, databaseMutations: 0 }));
}
async function main() {
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === "--self-test") { selfTest(); return; }
  const prefixes = ["--selection-sha256=", "--baseline-sha256=", "--receipt-sha256="];
  assert(args.length === 3 && prefixes.every(prefix => args.filter(arg => arg.startsWith(prefix)).length === 1), "post_exact_receipt_pins_required");
  const pins = prefixes.map(prefix => args.find(arg => arg.startsWith(prefix))!.slice(prefix.length));
  assert(pins.every(pin => /^[a-f0-9]{64}$/.test(pin)), "post_complete_hash_required");
  const selectionPath = `${PACKET}/OWNER-PUBLICATION-SELECTION.json`, baselinePath = `${PACKET}/OWNER-PUBLICATION-BASELINE.json`, finalPath = `${PACKET}/DATABASE-RECEIPT.json`;
  equal([fileHash(selectionPath), fileHash(baselinePath), fileHash(finalPath)], pins, "post_receipt_hash_changed");
  assert.equal(fileHash(`${PACKET}/OWNER-AUTHORIZATION.json`), AUTHORITY_SHA, "post_authority_changed");
  assert.equal(fileHash(WRITING_BASELINE), WRITING_BASELINE_SHA, "post_writing_baseline_changed");
  const selection = read<Selection>(selectionPath), baseline = read<Baseline>(baselinePath), receipt = read<FinalReceipt>(finalPath);
  validateSelection(selection);
  assert.equal(baseline.selectionSha256, pins[0], "post_baseline_selection_pin");
  assert(receipt.ok && receipt.mode === "published-ten-by-owner-exception", "post_publication_receipt_incomplete");
  equal([receipt.projectHost, receipt.ownerAuthorizationSha256, receipt.selectionSha256, receipt.baselineSha256, receipt.ownerReleaseSha256], [HOST, AUTHORITY_SHA, pins[0], pins[1], selection.ownerReleaseSha256], "post_receipt_binding_changed");
  equal(receipt.releaseChecks, RELEASE_CHECKS, "post_actual_failure_relabelled");
  equal(receipt.actualFailedEvidenceIds, [FAILED_EVIDENCE], "post_actual_failed_evidence_changed");
  equal([receipt.totalValidPublications, receipt.quarantinedRows], [44, 0], "post_receipt_health_changed");
  equal(receipt.targets.map(pinned).sort((a, b) => a.figureKey.localeCompare(b.figureKey)), selection.targets.map(pinned).sort((a, b) => a.figureKey.localeCompare(b.figureKey)), "post_receipt_targets_changed");
  const archived = selection.targets.map(target => {
    const pin = receipt.targets.find(item => item.figureKey === target.figureKey)!;
    const reviewedPath = `${PACKET}/REVIEWED-${target.figureKey}.json`, publishedPath = `${PACKET}/PUBLISHED-${target.figureKey}.json`;
    assert.equal(fileHash(reviewedPath), pin.reviewedReceiptSha256, "post_reviewed_receipt_changed");
    assert.equal(fileHash(publishedPath), pin.publishedReceiptSha256, "post_published_receipt_changed");
    const reviewed = read<Archived>(reviewedPath), published = read<Archived>(publishedPath);
    for (const file of [reviewed, published]) equal([file.selectionSha256, file.baselineSha256, file.ownerReleaseSha256], [pins[0], pins[1], selection.ownerReleaseSha256], "post_archived_receipt_binding");
    equal(pick(reviewed.row, FIELDS.specs), specRow(target.reviewed), "post_archived_review_document");
    const original = baseline.catalog.specs.find(row => row.story_spec_id === target.storySpecId);
    assert(original, "post_archived_review_baseline_missing");
    equal({ ...reviewed.row, status: original.status, spec: original.spec }, original, "post_archived_review_lifecycle_changed");
    equal(published.reviewedReceiptSha256, pin.reviewedReceiptSha256, "post_full_document_cas_receipt_pin");
    equal(pick(published.row, FIELDS.specs), specRow({ ...target.reviewed, status: "published" }), "post_archived_published_document");
    equal(published.stage, stageRow(target.stage), "post_archived_published_stage");
    return { figureKey: target.figureKey, reviewed, published };
  });
  const writing = read<Catalog>(WRITING_BASELINE);
  loadEnvLocal();
  const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""), key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  assert(url.protocol === "https:" && url.hostname === HOST && !url.username && !url.password && url.pathname === "/" && !url.search && !url.hash, "post_production_host_mismatch");
  assert(key, "post_curated_credential_missing");
  const startedAt = new Date().toISOString();
  const outcomes = await Promise.allSettled([query("figures", FIELDS.figures, "key.asc", url, key), query("figure_stages", FIELDS.stages, "figure_key.asc,stage_id.asc", url, key), query("story_specs", `${FIELDS.specs},${LIFECYCLE}`, "story_spec_id.asc", url, key)]);
  const results = outcomes.map(result => { if (result.status === "rejected") throw new Error("post_curated_read_boundary_failed"); return result.value; });
  const current: Catalog = { figures: results[0].rows, stages: results[1].rows as Stage[], specs: results[2].rows as Spec[] };
  const inspected = inspect(current, selection, baseline, writing);
  for (const item of archived) { const actual = current.specs.find(row => row.figure_key === item.figureKey && selection.targets.some(target => target.storySpecId === row.story_spec_id))!;
    equal(actual, item.published.row, "post_database_archive_full_row_changed"); }
  const completedAt = new Date().toISOString(), suffix = completedAt.replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const output = `${PACKET}/POST-PUBLICATION-${suffix}.json`, document = `${PACKET}/POST-PUBLICATION-${suffix}.md`;
  assert(!existsSync(resolve(output)) && !existsSync(resolve(document)), "post_immutable_output_exists");
  const report = { schemaVersion: "new-ten-production-postpublication-verification-v1", ok: true, mode: "read-only-exact-publication-verification", startedAt, completedAt, projectHost: HOST,
    ownerAuthorizationSha256: AUTHORITY_SHA, librarySha256: LIBRARY_SHA, actualMatchingTrustGatePassed: false, recordedStandardSecurityAuditPassed: false,
    pins: { selectionSha256: pins[0], baselineSha256: pins[1], finalPublicationReceiptSha256: pins[2], writingBaselineSha256: WRITING_BASELINE_SHA, checkerSha256: fileHash(`${PACKET}/verify-owner-publication.ts`) },
    counts: inspected.counts, queries: results.map(({ table, rowCount, responseBytes, elapsedMs }) => ({ table, method: "GET", rowCount, responseBytes, elapsedMs })),
    bounds: { curatedTablesOnly: true, queryCount: 3, maxRowsPerQuery: LIMIT, maxBytesPerResponse: MAX_BYTES, completeResponseDeadlineMs: DEADLINE_MS, retries: 0, mutations: 0 },
    preserved: { all60FigureMetadata: true, prior50StagesCapturedCoreFields: true, prior51SpecsCapturedCoreFields: true, prior34FullPublicationRows: true, allUnrelatedLifecycleFieldsSinceOwnerBaseline: true },
    baseline: { capturedAt: baseline.capturedAt, lifecycleComparison: "Full created_at/published_at/retired_at fields compared against new owner publication baseline. Earlier writing baseline comparison is limited to its captured core fields." },
    hashes: { prior34FullPublications: inspected.priorPublishedSha256, unrelated51FullSpecs: inspected.unrelatedSpecsSha256, unrelated50Stages: inspected.unrelatedStagesSha256 }, targets: inspected.verified,
    privacy: "Three curated-table GETs only. Raw rows remain in memory; output has public historical identifiers, counts, field-scope statements and hashes. No Auth, users, reader sessions, providers or mutation access.", deploymentVerifiedByThisCheck: false };
  writeFileSync(resolve(output), JSON.stringify(report, null, 2) + "\n", { flag: "wx" });
  writeFileSync(resolve(document), `# Production publication verification\n\nRead-only observation at ${completedAt} confirms all ten exact owner-authorized stories and stages are published, with 44 valid published StorySpecs, 44 matching published stages and zero quarantined rows. Canonical prose, source attribution, full owner review and complete v2 matching-stage metadata equal their pinned inputs and archived publication readbacks.\n\nThe prior 34 full publications and all unrelated catalog rows are preserved. Lifecycle fields compare against the new owner publication baseline; the earlier writing baseline proves captured core fields only. Three bounded curated GETs performed no mutation, Auth, reader or provider access. This database observation does not itself prove deployment or worker-cache refresh. Actual matching and recorded standard security failures remain retained under the scoped owner decision.\n\n[Reduced immutable receipt](${output.split("/").at(-1)})\n`, { flag: "wx" });
  console.log(JSON.stringify({ ok: true, receiptPath: resolve(output), receiptSha256: fileHash(output), documentPath: resolve(document), counts: inspected.counts, mutations: 0 }));
}
main().catch((error: unknown) => { const code = error instanceof Error && /^post_[a-z_]+$/.test(error.message) ? error.message : "post_local_or_curated_boundary_failed";
  console.error(JSON.stringify({ ok: false, errorCode: code, qualification: "No raw exception, curated response body or credential is emitted. No mutation path exists." })); process.exitCode = 1; });
