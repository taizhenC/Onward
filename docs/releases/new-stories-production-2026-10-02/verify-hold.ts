// Read-only curated-history audit. Three bounded GETs; no Auth, reader tables or mutations.
import "../../../scripts/_smoke-bootstrap";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { inspectPublishedStorySpecRows } from "../../../lib/story-spec-repository";
import { parseStorySpecDocument, validateStorySpec } from "../../../lib/story-spec";
import { loadEnvLocal } from "../../../scripts/_load-env";
import type { FigureStageRow } from "../../../lib/types";

const PACKET = "docs/releases/new-stories-production-2026-10-02";
const WRITING = "docs/research/new-stories-2026-10-02";
const HOST = "mbcqkljfekkxlgittzal.supabase.co";
const BASELINE = `${WRITING}/WRITING-DB-BEFORE-UPDATE.json`;
const BASELINE_SHA = "9f187094626f51a39c59ed15bd6e7d8f9e98c13a677a67f7361104658da5875c";
const WRITING_RECEIPT = "docs/releases/new-stories-written-2026-10-02/DATABASE-RECEIPT.json";
const WRITING_RECEIPT_SHA = "81255c50a3dcf2b0ae30e0d2401659da526fc74de9ae33944b6aab85a7057659";
const DEADLINE_MS = 15_000;
const RESPONSE_MAX_BYTES = 4 * 1024 * 1024;
const ROW_LIMIT = 100;
const FIELDS = {
  figures: "key,display_name,birth_year,death_year",
  stages: "figure_key,stage_id,stage_label,age_min,age_max,shape_sentences,facets,biographical_facts,themes,anti_themes,beats,sources,status",
  specs: "story_spec_id,figure_key,stage_id,version,schema_version,status,spec",
} as const;
const SPEC_TIMESTAMPS = ["created_at", "published_at", "retired_at"] as const;
type Row = Record<string, unknown>;
type Stage = Row & { figure_key: string; stage_id: string; status: string };
type Spec = Row & { story_spec_id: string; figure_key: string; stage_id: string; status: string; spec: unknown };
type Catalog = { figures: Row[]; stages: Stage[]; specs: Spec[] };
type TargetPin = { figureKey: string; storySpecId: string; candidateSha256: string; stageSha256: string };
const sha = (bytes: string | Buffer) => createHash("sha256").update(bytes).digest("hex");
const read = <T>(path: string): T => JSON.parse(readFileSync(resolve(path), "utf8")) as T;
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object") return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(",")}}`;
  return JSON.stringify(value);
}
const equal = (a: unknown, b: unknown, code: string) => assert.equal(canonical(a), canonical(b), code);
const pick = (row: Row, fields: string) => Object.fromEntries(fields.split(",").map(key => [key, row[key]]));
const stageKey = (row: Stage) => `${row.figure_key}\u0000${row.stage_id}`;
const sorted = <T extends Row>(rows: T[], key: string) => [...rows].sort((a, b) => String(a[key]).localeCompare(String(b[key])));
const fileHash = (path: string) => sha(readFileSync(resolve(path)));
function stageRow(stage: FigureStageRow): Stage {
  return { figure_key: stage.figureKey, stage_id: stage.stageId, stage_label: stage.stageLabel,
    age_min: stage.ageMin, age_max: stage.ageMax, shape_sentences: stage.shapeSentences,
    facets: stage.facets, biographical_facts: stage.biographicalFacts, themes: stage.themes,
    anti_themes: stage.antiThemes, beats: stage.beats, sources: stage.sources, status: "draft" };
}

async function query(table: "figures" | "figure_stages" | "story_specs", columns: string, order: string, baseUrl: URL, key: string) {
  const url = new URL(`/rest/v1/${table}`, baseUrl);
  url.search = new URLSearchParams({ select: columns, order, limit: String(ROW_LIMIT) }).toString();
  const started = performance.now();
  const response = await fetch(url, { method: "GET", redirect: "error", signal: AbortSignal.timeout(DEADLINE_MS),
    headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: "application/json", Prefer: "count=exact" } });
  if (!response.ok) { if (response.body) void response.body.cancel().catch(() => {}); throw new Error("hold_curated_query_failed"); }
  const contentRange = response.headers.get("content-range") ?? "";
  const total = Number(contentRange.split("/")[1]);
  if (!Number.isInteger(total) || total > ROW_LIMIT || total < 0) throw new Error("hold_curated_count_unbounded");
  const reader = response.body?.getReader();
  if (!reader) throw new Error("hold_curated_body_missing");
  const chunks: Uint8Array[] = []; let bytes = 0;
  try {
    for (;;) {
      const part = await reader.read(); if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > RESPONSE_MAX_BYTES) { void reader.cancel().catch(() => {}); throw new Error("hold_curated_response_limit"); }
      chunks.push(part.value);
    }
  } finally { reader.releaseLock(); }
  const body = Buffer.concat(chunks); const rows: unknown = JSON.parse(body.toString("utf8"));
  if (!Array.isArray(rows) || rows.length !== total || !rows.every(row => row && typeof row === "object" && !Array.isArray(row))) throw new Error("hold_curated_rows_invalid");
  return { rows: rows as Row[], table, rowCount: total, responseBytes: bytes, elapsedMs: Math.round(performance.now() - started) };
}

async function main() {
  if (process.argv.slice(2).length) throw new Error("hold_no_arguments_allowed");
  loadEnvLocal();
  const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
  if (url.protocol !== "https:" || url.hostname !== HOST || url.username || url.password || url.pathname !== "/" || url.search || url.hash) throw new Error("hold_production_host_mismatch");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("hold_curated_read_credential_missing");
  assert.equal(fileHash(BASELINE), BASELINE_SHA, "hold_baseline_hash_changed");
  assert.equal(fileHash(WRITING_RECEIPT), WRITING_RECEIPT_SHA, "hold_writing_receipt_changed");
  const targetProofPath = `${PACKET}/PRODUCTION-TARGET-PROOF.json`;
  const proof = read<{ ok: boolean; publicSupabaseHostname: string; localSupabaseHostname: string; localTargetMatchesCurrentProductionBundle: boolean }>(targetProofPath);
  assert(proof.ok && proof.localTargetMatchesCurrentProductionBundle && proof.publicSupabaseHostname === HOST && proof.localSupabaseHostname === HOST, "hold_public_target_proof_mismatch");
  const baseline = read<Catalog>(BASELINE);
  const writingReceipt = read<{ verifiedStoryCount: number; targets: TargetPin[] }>(WRITING_RECEIPT);
  assert.equal(writingReceipt.verifiedStoryCount, 10, "hold_target_count_changed");
  assert.equal(writingReceipt.targets.length, 10, "hold_target_count_changed");
  const originalProposal = read<{ stages: { figureKey: string; file: string; originalSha256: string }[] }>(`${PACKET}/THEME-PROPOSAL.json`);
  const inputs = writingReceipt.targets.map(pin => {
    const entry = originalProposal.stages.find(stage => stage.figureKey === pin.figureKey);
    assert(entry && !entry.file.includes("/") && !entry.file.includes("\\"), "hold_original_input_missing");
    const inputFolder = existsSync(resolve(`${PACKET}/candidates/${entry.file}`)) ? `${PACKET}/candidates` : WRITING;
    const stagePath = `${inputFolder}/${entry.file}`; const candidatePath = stagePath.replace(".stage.json", ".candidate.json");
    assert.equal(fileHash(stagePath), pin.stageSha256, "hold_original_stage_changed");
    assert.equal(pin.stageSha256, entry.originalSha256, "hold_original_stage_changed");
    assert.equal(fileHash(candidatePath), pin.candidateSha256, "hold_original_candidate_changed");
    const stage = read<FigureStageRow>(stagePath); const raw = read<unknown>(candidatePath); const candidate = parseStorySpecDocument(raw);
    assert(candidate && candidate.status === "draft" && candidate.storySpecId === pin.storySpecId, "hold_original_candidate_invalid");
    const validation = validateStorySpec(candidate, { forPublish: false });
    assert(validation.valid && !validation.warnings.length, "hold_original_candidate_invalid");
    equal(candidate.review, {}, "hold_original_review_nonempty");
    return { pin, stage, candidate: raw };
  });
  assert.equal(new Set(inputs.map(input => input.pin.figureKey)).size, 10, "hold_duplicate_targets");
  const startedAt = new Date().toISOString();
  const results = await Promise.all([
    query("figures", FIELDS.figures, "key.asc", url, key),
    query("figure_stages", FIELDS.stages, "figure_key.asc,stage_id.asc", url, key),
    query("story_specs", `${FIELDS.specs},${SPEC_TIMESTAMPS.join(",")}`, "story_spec_id.asc", url, key),
  ]);
  const current: Catalog = { figures: results[0].rows, stages: results[1].rows as Stage[], specs: results[2].rows as Spec[] };
  equal([current.figures.length, current.stages.length, current.specs.length], [60, 60, 61], "hold_catalog_count_changed");
  equal(sorted(current.figures, "key"), sorted(baseline.figures, "key"), "hold_figure_metadata_changed");
  const published = current.specs.filter(row => row.status === "published");
  const inspection = inspectPublishedStorySpecRows(published.map(row => pick(row, FIELDS.specs)));
  equal([published.length, inspection.catalog.size, inspection.quarantinedRowCount], [34, 34, 0], "hold_published_health_changed");
  const priorPublished = baseline.specs.filter(row => row.status === "published");
  assert.equal(priorPublished.length, 34, "hold_baseline_published_scope_changed");
  const publishedKeys = new Set(priorPublished.map(row => `${row.figure_key}\u0000${row.stage_id}`));
  const baselinePublishedStages = baseline.stages.filter(row => publishedKeys.has(stageKey(row)));
  const actualPublishedStages = current.stages.filter(row => row.status === "published");
  equal(sorted(actualPublishedStages, "figure_key"), sorted(baselinePublishedStages, "figure_key"), "hold_published_stages_changed");
  equal(sorted(published.map(row => pick(row, FIELDS.specs)), "story_spec_id"), sorted(priorPublished, "story_spec_id"), "hold_published_specs_changed");
  const targets = new Set(inputs.map(input => input.pin.figureKey));
  equal(sorted(current.stages.filter(row => !targets.has(row.figure_key)), "figure_key"), sorted(baseline.stages.filter(row => !targets.has(row.figure_key)), "figure_key"), "hold_prior_stages_changed");
  equal(sorted(current.specs.filter(row => !targets.has(row.figure_key)).map(row => pick(row, FIELDS.specs)), "story_spec_id"), sorted(baseline.specs.filter(row => !targets.has(row.figure_key)), "story_spec_id"), "hold_prior_specs_changed");
  const verifiedTargets = inputs.map(({ pin, stage, candidate }) => {
    const actualStage = current.stages.find(row => row.figure_key === pin.figureKey && row.stage_id === stage.stageId);
    const actualSpec = current.specs.find(row => row.story_spec_id === pin.storySpecId);
    assert(actualStage && actualSpec, "hold_draft_target_missing");
    equal(actualStage, stageRow(stage), "hold_draft_stage_changed");
    equal(pick(actualSpec, FIELDS.specs), { story_spec_id: pin.storySpecId, figure_key: stage.figureKey, stage_id: stage.stageId,
      version: (candidate as Row).version, schema_version: (candidate as Row).schemaVersion, status: "draft", spec: candidate }, "hold_draft_spec_changed");
    equal((actualSpec.spec as Row).review, {}, "hold_draft_review_nonempty");
    equal([actualSpec.published_at, actualSpec.retired_at], [null, null], "hold_draft_lifecycle_changed");
    return { ...pin, stageId: stage.stageId, status: "draft", emptyReview: true, originalStageExact: true, originalSpecExact: true,
      currentStageSha256: sha(canonical(actualStage)), currentSpecSha256: sha(canonical(pick(actualSpec, FIELDS.specs))),
      currentLifecycleSha256: sha(canonical(pick(actualSpec, SPEC_TIMESTAMPS.join(",")))) };
  });
  const output = resolve(PACKET, "PRODUCTION-HOLD-DB.json");
  if (existsSync(output)) throw new Error("hold_receipt_already_exists");
  const receipt = { schemaVersion: "new-ten-production-hold-db-v1", ok: true, mode: "read-only-production-hold-verification", startedAt, completedAt: new Date().toISOString(), projectHost: HOST,
    status: "Ten exact finished-writing drafts remain unpublished; the proposed v1 theme additions and v2/v3 experimental metadata are not applied in the database.",
    queries: results.map(({ table, rowCount, responseBytes, elapsedMs }) => ({ table, method: "GET", rowCount, responseBytes, elapsedMs })),
    bounds: { curatedTablesOnly: true, queryCount: 3, maxRowsPerQuery: ROW_LIMIT, maxBytesPerResponse: RESPONSE_MAX_BYTES, completeResponseDeadlineMs: DEADLINE_MS, retries: 0, mutations: 0 },
    counts: { figures: 60, stages: 60, specs: 61, rawPublishedSpecs: 34, validPublishedSpecs: 34, quarantinedPublishedSpecs: 0, publishedStages: actualPublishedStages.length, verifiedDraftTargets: verifiedTargets.length },
    checkedFields: { figures: FIELDS.figures.split(","), stages: FIELDS.stages.split(","), specs: FIELDS.specs.split(","), currentSpecLifecycleOnly: SPEC_TIMESTAMPS },
    baseline: { path: BASELINE, sha256: BASELINE_SHA, capturedAt: null, limitation: "Before-update baseline contains no capture timestamp and no created_at/published_at/retired_at fields. Equality proves exactly the captured core fields, not historical lifecycle timestamps. Today's lifecycle fields are observed only, and new draft published_at/retired_at are null." },
    hashes: { writingReceipt: WRITING_RECEIPT_SHA, publicTargetProof: fileHash(targetProofPath), checker: fileHash(`${PACKET}/verify-hold.ts`),
      publishedSpecsBefore: sha(canonical(sorted(priorPublished, "story_spec_id"))), publishedSpecsNow: sha(canonical(sorted(published.map(row => pick(row, FIELDS.specs)), "story_spec_id"))),
      publishedStagesBefore: sha(canonical(sorted(baselinePublishedStages, "figure_key"))), publishedStagesNow: sha(canonical(sorted(actualPublishedStages, "figure_key"))) },
    unchanged: { all60FigureMetadata: true, prior50StagesCapturedFields: true, prior51SpecsCapturedFields: true, all34PublishedSpecsCapturedFields: true, all34PublishedStagesCapturedFields: true },
    targets: verifiedTargets, publicationAttempted: false, deploymentAttempted: false,
    privacy: "Only curated figures/figure_stages/story_specs were queried. Raw database rows remain in memory; receipt stores checked field names, hashes, status/counts and public historical identifiers. No reader/account/Auth/provider access or credential output." };
  writeFileSync(output, `${JSON.stringify(receipt, null, 2)}\n`, { flag: "wx" });
  console.log(JSON.stringify({ ok: true, receiptPath: output, receiptSha256: fileHash(output), counts: receipt.counts, unchanged: receipt.unchanged, mutations: 0 }));
}
main().catch((error: unknown) => {
  const errorCode = error instanceof Error && /^hold_[a-z_]+$/.test(error.message) ? error.message : "hold_local_or_curated_boundary_failed";
  console.error(JSON.stringify({ ok: false, errorCode, qualification: "No raw exception, database body or credential is emitted. No mutation path exists." }));
  process.exitCode = 1;
});
