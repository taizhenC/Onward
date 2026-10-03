// Prepared, bounded operator canary. --self-test is offline; --run creates one
// transient anonymous guest only AFTER root confirms publication/worker refresh.
import "../../../scripts/_smoke-bootstrap";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { createServerClient } from "@supabase/ssr";
import { getSupabase } from "../../../lib/db";
import { isValidIntakeAge, isValidIntakeFeeling } from "../../../lib/intake-constraints";
import { createResonanceBrief } from "../../../lib/resonance-brief";
import { validateStoredStoryArtifact } from "../../../lib/story-artifact";
import { MAX_STORY_PASSAGES, STORY_ARTIFACT_SCHEMA_VERSION, type StoryArtifact } from "../../../lib/story-artifact-types";
import { parsePersistedRetentionLabel } from "../../../lib/derived-output-retention";
import { getNextStoryAdvance } from "../../../lib/story-progress";
import { parseStorySpecDocument, validateStorySpec } from "../../../lib/story-spec";
import { parseStorySpecRow } from "../../../lib/story-spec-repository";
import type { StorySpec } from "../../../lib/story-spec-types";
import { buildStoryTransparency, validateStoredStoryTransparency } from "../../../lib/story-transparency";
import type { StoryTransparency } from "../../../lib/story-transparency-types";
import { loadEnvLocal } from "../../../scripts/_load-env";

const origin = "https://onwardapp.me";
const projectHost = "mbcqkljfekkxlgittzal.supabase.co";
const packet = resolve("docs/releases/new-stories-production-2026-10-02");
const fixtureSha256 = "203a6e2c69a23525fa733fe0bd481f6f4026c00b9a75a54b5fd27a5e2e5d17f7";
const candidateSha256 = "61dac9480f73dd6834c8651b689ebe0434cc2d36779710053073e200aee5bdd2";
const storySpecId = "blackwell_e:1847-1849-a-place-to-study:v1";
const recipeId = "keyword-rerank-figure-library-50-2026-07-02";
const recipeManifestHash = "c2ced0eefa65351dc57a17f14dd76abf575745dafaac0d6d8699a95d5a21de52";
const frozenFeeling = "I am the only woman in my training class. A difficult practical lesson left me shaken, and they don't think I belong there. I still want a chance to learn beside them.";
const roles = ["scene", "dark_moment", "response", "struggle", "turning_point", "became", "bridge"];
const receiptPath = resolve(packet, "LIVE-CANARY-RECEIPT.json");
const attemptPath = resolve(packet, "LIVE-CANARY-ATTEMPT.json");
const sha = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");
const flat = (value: string) => value.replace(/\s+/g, " ").trim();
class CanaryFailure extends Error {}
function requireSafe(condition: unknown, code: string): asserts condition {
  if (!condition) throw new CanaryFailure(code);
}
// Raw assertion/network/SDK errors, bodies and private identifiers never escape.
const safeError = (error: unknown) => error instanceof CanaryFailure ? error.message : "unexpected-error-redacted";
function readJson(path: string): unknown { return JSON.parse(readFileSync(path, "utf8")); }
function object(value: unknown, code: string): Record<string, unknown> {
  requireSafe(value !== null && typeof value === "object" && !Array.isArray(value), code);
  return value as Record<string, unknown>;
}
function immutableJson(path: string, value: unknown) {
  writeFileSync(path, JSON.stringify(value, null, 2) + "\n", {flag: "wx"});
}
function decodeHtml(value: string) {
  const named: Record<string, string> = {amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " "};
  return value.replace(/&(#x[0-9a-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi, (whole, name: string) => {
    if (name.startsWith("#")) {
      const point = name[1].toLowerCase() === "x" ? parseInt(name.slice(2), 16) : Number(name.slice(1));
      return Number.isInteger(point) && point >= 0 && point <= 0x10ffff ? String.fromCodePoint(point) : whole;
    }
    return named[name.toLowerCase()] ?? whole;
  });
}
function renderedSurface(html: string) {
  // Next flight data contains serialized source records. It is not proof that
  // the afterword exists in the rendered HTML: discard scripts/styles/comments.
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, " ").replace(/<!--[\s\S]*?-->/g, " ");
}
function checkSourceHtml(html: string, transparency: StoryTransparency, displayName: string, bridge: string) {
  const rendered = renderedSurface(html);
  const text = flat(decodeHtml(rendered.replace(/<[^>]+>/g, " ")));
  const has = (value: string) => text.includes(flat(value));
  const headings = ["Who this was, and what really happened", "What really happened", "How each passage was told", "Where to read more", "Story record", "Editorially reviewed"];
  requireSafe(headings.every(has), "completed-source-headings-missing");
  requireSafe(has(displayName) && has(storySpecId) && has(bridge), "completed-story-identity-or-bridge-missing");
  requireSafe(!has("Editorial review draft") && !has("awaiting editorial review"), "completed-source-review-not-public");
  requireSafe(has(transparency.rationale.resonance) && has(transparency.rationale.gap), "completed-source-rationale-missing");
  requireSafe(transparency.facts.every(fact => has(fact.statement) && fact.sourceRefs.every(ref => !ref.locator || has(ref.locator))), "completed-source-fact-or-locator-missing");
  const hrefs = [...rendered.matchAll(/\bhref=["']([^"']+)["']/g)].map(match => decodeHtml(match[1]));
  requireSafe(transparency.sources.every(source => has(source.citation) && (!source.url || hrefs.includes(source.url))), "completed-source-citation-or-link-missing");
  requireSafe(transparency.quotes.every(quote => has(quote.text)), "completed-source-quotation-missing");
  const texture = transparency.beats.flatMap(beat => beat.dramatizedSentences ?? []);
  requireSafe(texture.every(has), "completed-source-texture-missing");
  return {headings: headings.length, facts: transparency.facts.length, sources: transparency.sources.length,
    sourceLinks: transparency.sources.filter(source => source.url).length, quotes: transparency.quotes.length,
    dramatizedSentences: texture.length, renderedHtmlChecked: true, serializedFlightDataExcluded: true};
}
function localInput() {
  const fixtureBytes = readFileSync(resolve(packet, "matching-extension.json"));
  requireSafe(sha(fixtureBytes) === fixtureSha256, "frozen-extension-changed");
  const cases = object(JSON.parse(fixtureBytes.toString("utf8")), "invalid-extension").cases;
  requireSafe(Array.isArray(cases), "invalid-extension-cases");
  const fixture = object(cases[2], "frozen-case-unavailable");
  requireSafe(fixture.age === 26 && fixture.feeling === frozenFeeling && fixture.expect === "blackwell_e" && fixture.hard === true && fixture.plausibleWrong === "coleman", "preselected-frozen-case-changed");
  requireSafe(isValidIntakeAge(26) && isValidIntakeFeeling(frozenFeeling), "preselected-adult-input-invalid");
  const bytes = readFileSync(resolve("docs/research/new-stories-2026-10-02/blackwell_e-1847-1849-a-place-to-study-v1.candidate.json"));
  requireSafe(sha(bytes) === candidateSha256, "frozen-blackwell-candidate-changed");
  const draft = parseStorySpecDocument(JSON.parse(bytes.toString("utf8")));
  requireSafe(draft && draft.status === "draft" && isDeepStrictEqual(draft.review, {}) && draft.storySpecId === storySpecId && draft.figureKey === "blackwell_e", "frozen-blackwell-draft-invalid");
  const validity = validateStorySpec(draft, {forPublish: false});
  requireSafe(validity.valid && validity.errors.length === 0 && validity.warnings.length === 0 && isDeepStrictEqual(draft.arc.map(beat => beat.role), roles), "frozen-blackwell-validation-failed");
  return draft;
}
function publishedInput(draft: StorySpec) {
  const receipt = object(readJson(resolve(packet, "DATABASE-RECEIPT.json")), "publication-receipt-unavailable");
  requireSafe(receipt.ok === true && receipt.totalValidPublications === 44 && receipt.quarantinedRows === 0 && receipt.previous34PublicationsPreserved === true && receipt.unrelatedCatalogPreserved === true && receipt.exactReadback === true, "complete-44-publication-receipt-required");
  requireSafe(Array.isArray(receipt.targets) && receipt.targets.length === 10, "ten-publication-pins-required");
  const target = receipt.targets.map(value => object(value, "invalid-publication-pin")).find(value => value.figureKey === "blackwell_e");
  requireSafe(target?.candidateSha256 === candidateSha256 && target.storySpecId === storySpecId, "blackwell-publication-pin-mismatch");
  const publishedBytes = readFileSync(resolve(packet, "PUBLISHED-blackwell_e.json"));
  requireSafe(sha(publishedBytes) === target.publishedReceiptSha256, "blackwell-publication-receipt-changed");
  const publication = object(JSON.parse(publishedBytes.toString("utf8")), "invalid-blackwell-publication-receipt");
  const row = object(publication.row, "blackwell-publication-row-unavailable");
  const core = Object.fromEntries(["story_spec_id", "figure_key", "stage_id", "version", "schema_version", "status", "spec"].map(key => [key, row[key]]));
  const published = parseStorySpecRow(core, "published");
  requireSafe(published && isDeepStrictEqual({...published, status: "draft", review: {}}, draft), "published-blackwell-prose-or-document-changed");
  const proof = object(readJson(resolve(packet, "PRODUCTION-TARGET-PROOF.json")), "production-target-proof-unavailable");
  requireSafe(proof.ok === true && proof.productionOrigin === origin && proof.publicSupabaseHostname === projectHost && proof.localSupabaseHostname === projectHost && proof.localTargetMatchesCurrentProductionBundle === true, "verified-production-target-required");
  return published;
}
function checkRecipe(value: unknown, deployment: string) {
  const recipe = object(value, "canary-recipe-unavailable");
  requireSafe(recipe.deploymentVersion === deployment, "canary-worker-deployment-mismatch");
  requireSafe(recipe.recipeId === recipeId && recipe.recipeManifestHash === recipeManifestHash && recipe.storyComposerMode === "canonical" && recipe.hybridStoryComposerEnabled === false, "canary-approved-recipe-mismatch");
}
type SessionRow = {session_id: string; user_id: string; figure_key: string; stage_id: string; story_artifact_id: string | null;
  match_recipe: unknown; next_beat_index: number; next_chunk_index: number; age: number};
async function ownedKnownSession(sessionId: string, userId: string): Promise<SessionRow | null> {
  // Every service read is scoped to both the freshly returned session and its
  // freshly confirmed anonymous owner. No user listing or catalog reads occur.
  const result = await getSupabase().from("sessions")
    .select("session_id,user_id,figure_key,stage_id,story_artifact_id,match_recipe,next_beat_index,next_chunk_index,age")
    .eq("session_id", sessionId).eq("user_id", userId).abortSignal(AbortSignal.timeout(20_000)).maybeSingle();
  requireSafe(!result.error, "owned-canary-session-read-failed");
  return result.data as SessionRow | null;
}
async function ownedKnownArtifact(artifactId: string, userId: string, sessionId: string) {
  const result = await getSupabase().from("story_artifacts")
    .select("artifact_id,schema_version,content_hash,artifact,retention_class,retention_policy_version")
    .eq("artifact_id", artifactId).eq("user_id", userId).eq("session_id", sessionId)
    .abortSignal(AbortSignal.timeout(20_000)).maybeSingle();
  requireSafe(!result.error && result.data, "known-owned-artifact-unavailable");
  const row = object(result.data, "known-owned-artifact-invalid-row");
  requireSafe(row.artifact_id === artifactId && typeof row.schema_version === "string" && typeof row.content_hash === "string", "known-owned-artifact-envelope-invalid");
  parsePersistedRetentionLabel({policyVersion: row.retention_policy_version, retentionClass: row.retention_class}, "owned_story");
  const artifact = validateStoredStoryArtifact(row.artifact, {artifactId, schemaVersion: row.schema_version, contentHash: row.content_hash, legacyV5ReplayEligible: false});
  requireSafe(artifact, "known-owned-artifact-strict-validation-failed");
  return artifact;
}
function checkArtifact(artifact: StoryArtifact, published: StorySpec, deployment: string) {
  requireSafe(artifact.schemaVersion === STORY_ARTIFACT_SCHEMA_VERSION && artifact.storySpecId === storySpecId && artifact.storySpecVersion === published.version && artifact.storySpecSchemaVersion === published.schemaVersion && artifact.figureKey === "blackwell_e" && artifact.stageId === published.stageId, "owned-artifact-identity-mismatch");
  requireSafe(validateStoredStoryArtifact(artifact, {artifactId: artifact.artifactId, schemaVersion: artifact.schemaVersion, contentHash: artifact.contentHash, legacyV5ReplayEligible: false}), "owned-artifact-strict-integrity-failed");
  checkRecipe(artifact.recipe.match, deployment);
  requireSafe(artifact.composition.mode === "canonical_fallback" && artifact.contentProfile.reviewed === true && artifact.validation.status === "validated" && artifact.validation.failureReasons.length === 0, "owned-artifact-unreviewed-or-noncanonical");
  requireSafe(artifact.beats.length === 7 && isDeepStrictEqual(artifact.beats.map(beat => beat.role), roles), "owned-artifact-seven-role-mismatch");
  requireSafe(artifact.beats.every((beat, index) => flat(beat.text) === flat(published.arc[index].canonicalText) && flat(beat.chunks.join(" ")) === flat(beat.text)), "owned-artifact-canonical-text-mismatch");
  const passages = artifact.beats.reduce((total, beat) => total + beat.chunks.length, 0);
  requireSafe(passages >= 7 && passages <= MAX_STORY_PASSAGES, "owned-artifact-passage-budget-invalid");
  const transparency = artifact.transparency;
  requireSafe(transparency && validateStoredStoryTransparency(transparency) && transparency.provenance.status === "editorially_reviewed", "owned-artifact-source-transparency-invalid");
  requireSafe(isDeepStrictEqual(transparency, buildStoryTransparency(published, createResonanceBrief(frozenFeeling), artifact.framing)), "owned-artifact-source-projection-mismatch");
  return {passages, transparency};
}
function checkChunk(received: string[], chunk: string, expected: string, expectedChunk: string, next: string) {
  requireSafe(flat(chunk) === flat(expectedChunk), "canonical-chunk-mismatch-before-ack");
  const assembled = flat([...received, chunk].join(" "));
  requireSafe(assembled.length > 0 && flat(expected).startsWith(assembled), "canonical-prefix-mismatch-before-ack");
  if (next !== "chunk") requireSafe(assembled === flat(expected), "canonical-beat-incomplete-before-ack");
}
async function readObject(response: Response): Promise<Record<string, unknown>> {
  let value: unknown;
  try { value = await response.json(); } catch { throw new CanaryFailure("route-returned-invalid-json"); }
  return object(value, "route-returned-invalid-object");
}
function selfTest(draft: StorySpec) {
  // These negative tests guard against claiming source visibility from flight
  // props alone and against acknowledging an altered or truncated passage.
  const published: StorySpec = {...draft, status: "published", review: {reviewedAt: "2026-10-02T00:00:00.000Z"}};
  const transparency = buildStoryTransparency(published, createResonanceBrief(frozenFeeling), "definitive");
  const escape = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
  const headings = "Who this was, and what really happened What really happened How each passage was told Where to read more Story record Editorially reviewed";
  const bridge = published.arc[6].canonicalText;
  const body = [headings, "Elizabeth Blackwell", storySpecId, bridge, transparency.rationale.resonance, transparency.rationale.gap,
    ...transparency.facts.flatMap(fact => [fact.statement, ...fact.sourceRefs.map(ref => ref.locator ?? "")]),
    ...transparency.sources.map(source => source.citation), ...transparency.quotes.map(quote => quote.text),
    ...transparency.beats.flatMap(beat => beat.dramatizedSentences ?? [])].map(escape).join(" <p></p> ");
  const links = transparency.sources.filter(source => source.url).map(source => `<a href="${escape(source.url!)}">source</a>`).join("");
  const html = `<main>${body}${links}</main>`;
  checkSourceHtml(html, transparency, "Elizabeth Blackwell", bridge);
  let negativeTests = 0;
  const rejects = (action: () => void) => { let failed = false; try { action(); } catch (error) { failed = error instanceof CanaryFailure; } requireSafe(failed, "offline-negative-case-not-rejected"); negativeTests++; };
  rejects(() => checkSourceHtml(`<script>${html}</script><main>Reader</main>`, transparency, "Elizabeth Blackwell", bridge));
  rejects(() => checkSourceHtml(html.replace(escape(transparency.facts[0].statement), "altered"), transparency, "Elizabeth Blackwell", bridge));
  rejects(() => checkSourceHtml(html.replace("Where to read more", "absent"), transparency, "Elizabeth Blackwell", bridge));
  checkChunk([], "first half", "first half second half", "first half", "chunk");
  checkChunk(["first half"], "second half", "first half second half", "second half", "end");
  rejects(() => checkChunk([], "wrong", "first half second half", "first half", "chunk"));
  rejects(() => checkChunk([], "first half", "first half second half", "first half", "end"));
  requireSafe(getNextStoryAdvance({beatIndex: 6, chunkIndex: 1, chunkCount: 2, beatCount: 7}) === "end", "offline-final-progress-failed");
  console.log(JSON.stringify({ok: true, mode: "offline-self-test", frozenCaseIndex: 2, age: 26, canonicalBeats: 7, negativeTests, networkRequests: 0, authMutations: 0, databaseMutations: 0}));
}
async function run(draft: StorySpec, deployment: string) {
  requireSafe(!existsSync(receiptPath) && !existsSync(attemptPath), "existing-canary-attempt-or-receipt-refusing-another-guest");
  const published = publishedInput(draft);
  loadEnvLocal();
  const authUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  requireSafe(authUrl && new URL(authUrl).hostname === projectHost && new URL(authUrl).protocol === "https:" && anonKey && process.env.SUPABASE_SERVICE_ROLE_KEY, "verified-production-auth-and-owned-read-config-required");
  process.env.PERSISTENCE = "supabase";
  const startedAt = new Date().toISOString();
  const jar = new Map<string, string>();
  let userId: string | null = null, sessionId: string | null = null, artifactId: string | null = null;
  let phase = "auth", failedPhase: string | null = null, failure: string | null = null, cleanupFailure: string | null = null;
  let guestAttempted = false, guestDeleted = false, ownedSessionRemoved = false, matchRequests = 0, storyGets = 0, chunkGets = 0, acknowledgements = 0, completeBeats = 0, expectedPassages = 0;
  let workerVerified = false, sourceProjectionVerified = false, progressVerified = false, artifactContentHash: string | null = null;
  let sourceHtml: ReturnType<typeof checkSourceHtml> | null = null, sourceProjectionSha256: string | null = null;
  const authRequests = new Set<string>();
  const auth = createServerClient(authUrl, anonKey, {auth: {autoRefreshToken: false, debug: false}, global: {fetch: async (input, init) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
    const key = `${method}:${url.pathname}`;
    requireSafe(url.hostname === projectHost && url.protocol === "https:" &&
      ((method === "POST" && url.pathname === "/auth/v1/signup") || (method === "GET" && url.pathname === "/auth/v1/user")), "canary-unexpected-auth-endpoint");
    requireSafe(!authRequests.has(key), "canary-auth-repeat-refused"); authRequests.add(key);
    return fetch(input, {...init, redirect: "error", signal: AbortSignal.timeout(20_000)});
  }}, cookies: {
    getAll: () => [...jar].map(([name, value]) => ({name, value})),
    setAll: entries => { for (const {name, value} of entries) { if (value) jar.set(name, value); else jar.delete(name); } },
  }});
  async function request(path: string, init: RequestInit = {}) {
    requireSafe(path.startsWith("/") && !path.startsWith("//"), "canary-route-outside-production-origin");
    const headers = new Headers(init.headers);
    headers.set("cookie", [...jar].map(([name, value]) => `${name}=${value}`).join("; "));
    headers.set("origin", origin); headers.set("sec-fetch-site", "same-origin");
    const response = await fetch(origin + path, {...init, headers, redirect: "manual", signal: AbortSignal.timeout(60_000)});
    for (const line of response.headers.getSetCookie()) {
      const pair = line.split(";", 1)[0]; const equals = pair.indexOf("=");
      if (equals < 1) continue;
      const name = pair.slice(0, equals), value = pair.slice(equals + 1);
      if (value) jar.set(name, value); else jar.delete(name);
    }
    return response;
  }
  // Write before the first Auth request. Client construction above is local; a
  // lost signup response cannot silently authorize another guest afterward.
  immutableJson(attemptPath, {schemaVersion: "new-ten-live-canary-attempt-v1", startedAt, deployment, origin, fixtureSha256, fixtureIndex: 2, candidateSha256, maximumGuestCreationAttempts: 1, maximumMatchRequests: 1});
  try {
    guestAttempted = true;
    const created = await auth.auth.signInAnonymously();
    if (created.data.user?.is_anonymous === true) userId = created.data.user.id;
    requireSafe(!created.error && userId, "new-anonymous-guest-not-confirmed");
    phase = "match"; matchRequests++;
    const response = await request("/api/match", {method: "POST", headers: {"content-type": "application/json"}, body: JSON.stringify({age: 26, feeling: frozenFeeling})});
    requireSafe(response.status === 200, "match-http-failure-stop-no-retry");
    const result = await readObject(response);
    const terminal = ["temporarilyUnavailable", "noEligibleStory", "rateLimited", "flowConflict", "crisis", "clarificationNeeded", "noCloseMatch"].some(name => result[name] === true);
    requireSafe(!terminal && result.error === undefined && typeof result.sessionId === "string" && result.sessionId.length > 0 && result.sessionId.length <= 200, "match-nonstory-stop-no-recovery");
    sessionId = result.sessionId;
    phase = "owned-session-artifact";
    const session = await ownedKnownSession(sessionId, userId);
    requireSafe(session && session.figure_key === "blackwell_e" && session.stage_id === published.stageId && session.age === 26 && session.next_beat_index === 0 && session.next_chunk_index === 0 && typeof session.story_artifact_id === "string" && session.story_artifact_id.length > 0, "known-session-target-or-initial-progress-mismatch");
    checkRecipe(session.match_recipe, deployment);
    artifactId = session.story_artifact_id;
    const artifact = await ownedKnownArtifact(artifactId, userId, sessionId);
    const checked = checkArtifact(artifact, published, deployment);
    expectedPassages = checked.passages; workerVerified = true; sourceProjectionVerified = true;
    artifactContentHash = artifact.contentHash;
    sourceProjectionSha256 = sha(JSON.stringify(checked.transparency));
    phase = "owned-story-start";
    const page = await request(`/story/${encodeURIComponent(sessionId)}`); storyGets++;
    requireSafe(page.status === 200, "owned-story-get-failed"); await page.text();
    for (const [beatIndex, beat] of artifact.beats.entries()) {
      const received: string[] = [];
      for (const [chunkIndex, expectedChunk] of beat.chunks.entries()) {
        requireSafe(chunkGets < MAX_STORY_PASSAGES, "passage-request-budget-exhausted");
        const body = JSON.stringify({sessionId, beatIndex, chunkIndex});
        const next = getNextStoryAdvance({beatIndex, chunkIndex, chunkCount: beat.chunks.length, beatCount: artifact.beats.length});
        phase = "beat";
        const chunk = await request("/api/beat", {method: "POST", headers: {"content-type": "application/json"}, body}); chunkGets++;
        requireSafe(chunk.status === 200 && chunk.headers.get("x-onward-next") === next, "beat-route-status-or-progress-failure");
        const text = await chunk.text();
        checkChunk(received, text, published.arc[beatIndex].canonicalText, expectedChunk, next);
        received.push(text);
        phase = "ack";
        const ack = await request("/api/beat/ack", {method: "POST", headers: {"content-type": "application/json"}, body});
        requireSafe(ack.status === 200 && (await readObject(ack)).next === next, "ack-route-status-or-progress-failure");
        acknowledgements++;
      }
      requireSafe(flat(received.join(" ")) === flat(published.arc[beatIndex].canonicalText), "completed-canonical-beat-mismatch"); completeBeats++;
    }
    phase = "completed-progress-readback";
    const ended = await ownedKnownSession(sessionId, userId);
    requireSafe(ended && ended.figure_key === "blackwell_e" && ended.stage_id === published.stageId && ended.story_artifact_id === artifactId && ended.next_beat_index === 7 && ended.next_chunk_index === 0 && isDeepStrictEqual(ended.match_recipe, session.match_recipe), "completed-owned-progress-readback-failed");
    requireSafe(completeBeats === 7 && chunkGets === expectedPassages && acknowledgements === expectedPassages, "seven-beats-and-all-passages-not-complete"); progressVerified = true;
    phase = "completed-normal-route-source-html";
    const completed = await request(`/story/${encodeURIComponent(sessionId)}`); storyGets++;
    requireSafe(completed.status === 200, "completed-owned-story-get-failed");
    sourceHtml = checkSourceHtml(await completed.text(), checked.transparency, artifact.figure.displayName, published.arc[6].canonicalText);
    phase = "complete";
  } catch (error) { failure = safeError(error); failedPhase = phase; }
  finally {
    if (userId !== null) {
      try {
        const current = await auth.auth.getUser();
        requireSafe(!current.error && current.data.user?.id === userId && current.data.user.is_anonymous === true, "cleanup-anonymous-owner-not-confirmed-refusing-deletion");
        const form = await request("/account/delete");
        requireSafe(form.status === 200, "cleanup-normal-delete-form-failed");
        const html = await form.text();
        const input = [...html.matchAll(/<input\b[^>]*>/gi)].map(match => match[0]).find(tag => /\bname=["']csrfToken["']/.test(tag));
        const token = input?.match(/\bvalue=["']([^"']+)["']/)?.[1];
        requireSafe(token, "cleanup-csrf-token-unavailable");
        const deleted = await request("/api/account-delete", {method: "POST", headers: {"content-type": "application/x-www-form-urlencoded"}, body: new URLSearchParams({intent: "delete_account", csrfToken: decodeHtml(token), understood: "delete_account_and_stories"})});
        requireSafe(deleted.status === 303 && new URL(deleted.headers.get("location") ?? "", origin).href === `${origin}/account-deleted`, "cleanup-normal-deletion-not-confirmed");
        guestDeleted = true;
        const confirmation = await request("/account-deleted");
        requireSafe(confirmation.status === 200 && flat(decodeHtml(renderedSurface(await confirmation.text()).replace(/<[^>]+>/g, " "))).includes("Your account has been deleted"), "cleanup-normal-confirmation-page-failed");
        if (sessionId !== null) { requireSafe(await ownedKnownSession(sessionId, userId) === null, "cleanup-known-session-still-present"); ownedSessionRemoved = true; }
      } catch (error) { cleanupFailure = safeError(error); }
    } else if (guestAttempted) cleanupFailure = "guest-creation-unconfirmed-cleanup-identity-unavailable";
    const ok = failure === null && cleanupFailure === null && completeBeats === 7 && workerVerified && sourceProjectionVerified && progressVerified && sourceHtml !== null && guestDeleted && ownedSessionRemoved;
    const receipt = {schemaVersion: "new-ten-api-live-canary-v1", startedAt, completedAt: new Date().toISOString(), ok, origin, expectedSupabaseHostname: projectHost, deployment,
      fixtureIndex: 2, fixtureSha256, age: 26, figureKey: "blackwell_e", storySpecId, candidateSha256,
      canonicalProseSha256: sha(JSON.stringify(draft.arc.map(beat => flat(beat.canonicalText)))), artifactContentHash, sourceProjectionSha256,
      recipeId, recipeManifestHash, workerVerified, sourceProjectionVerified, progressVerified, sourceHtml,
      canonicalBeatsVerified: completeBeats, artifactPassageCount: expectedPassages, beatRequests: chunkGets, successfulAcknowledgements: acknowledgements,
      matchRequests, storyGets, guestCreationAttempts: guestAttempted ? 1 : 0, confirmedAnonymousGuest: userId !== null, guestDeleted, ownedSessionRemoved,
      failure, failedPhase, cleanupFailure, maximumMatchRequests: 1, maximumGuestCreationAttempts: 1, maximumPassages: MAX_STORY_PASSAGES,
      coverage: "Normal SSR story GET and beat/ACK API coverage. No interactive UI, Save, source-toggle telemetry, visual layout, youth intake or full-catalog evaluation.",
      privacy: "Cookies, tokens, guest/session/artifact identifiers and route HTML remain transient in memory. Exact service reads cover only this freshly owned known session/artifact. Cleanup uses the normal anonymous-owner account-deletion route."};
    immutableJson(receiptPath, receipt);
    // Clear private bindings before emitting only reduced scalar status.
    jar.clear(); userId = null; sessionId = null; artifactId = null;
    console.log(JSON.stringify({ok, mode: "api-live-canary", canonicalBeatsVerified: completeBeats, passages: expectedPassages, matchRequests, guestDeleted, ownedSessionRemoved, failure, failedPhase, cleanupFailure}));
    if (!ok) process.exitCode = 1;
  }
}
async function main() {
  const args = process.argv.slice(2);
  const draft = localInput();
  if (args.length === 1 && args[0] === "--self-test") { selfTest(draft); return; }
  requireSafe(args.length === 2 && args[0] === "--run" && /^--deployment=[0-9a-f]{40}$/.test(args[1]), "usage-self-test-or-run-with-exact-deployment-sha-required");
  await run(draft, args[1].slice("--deployment=".length));
}
main().catch(error => { console.error(safeError(error)); process.exitCode = 1; });
