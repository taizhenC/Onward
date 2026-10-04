// Exact-three owner exception. Failed matching evidence remains failed.
import "../../../scripts/_smoke-bootstrap";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";
import { FIGURE_STAGES } from "../../../lib/figures-data";
import { parseStorySpecDocument, validateStorySpec } from "../../../lib/story-spec";
import type { StorySpec } from "../../../lib/story-spec-types";
import type { FigureStageRow } from "../../../lib/types";

export const repository = resolve(fileURLToPath(new URL("../../../", import.meta.url)));
export const packetRelative = "docs/releases/new-three-2026-10-03";
export const ownerAuthorizationSha256 = "d1a594f62b55c01600071c9fc88f2f739d0ece077aededcb5e8a869bafbf7018";
export const librarySha256 = "1a33b7b45b48bc054f0eb0d1504bfd7ac312a07f41f678ff032acfa9e97eaa90";
export const draftImportBaselineSha256 = "11a6d8ca49a34bc3e9dadce24a72aee253c035bc73a957d1f12d2461f49df7a2";
export const draftImportBaselinePath = "docs/research/new-three-2026-10-03/DB-BEFORE.json";
export const projectHost = "mbcqkljfekkxlgittzal.supabase.co";
export const sha = (bytes: string | Buffer) => createHash("sha256").update(bytes).digest("hex");
export function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value !== null && typeof value === "object") return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b))
    .map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`).join(",")}}`;
  const result = JSON.stringify(value); assert(result !== undefined, "Unserializable receipt value"); return result;
}
export const same = (a: unknown, b: unknown, label: string) => assert(isDeepStrictEqual(a, b), label);
export const readJson = <T>(path: string): T => JSON.parse(readFileSync(path, "utf8")) as T;
export type Pin = {path: string; sha256: string};
export type TargetPin = {figureKey: string; storySpecId: string; candidateSha256: string; stageSha256: string};
type Input = TargetPin & {candidateFile: string; stageFile: string; words: number};
export type Authority = {schemaVersion: string; decisionId: string; authorizedAt: string; ownerId: string; ownerStatement: string;
  authorizationSource: string; librarySha256: string; previousLibrarySha256: string; evidenceId: string; evidenceSha256: string;
  recipeId: string; recipeSelection: unknown; readingPacket: Pin; frozenInputs: Pin; draftImportReceipt: Pin;
  supplementalCoverage: Pin & {providerCalls: number; preflightPassed: boolean; rerankTrials: number; lostPositiveCaseIndexesZeroBased: number[]};
  targets: TargetPin[]; unchangedInputs: Pin[]; observedMatching: {trustGatePassed: boolean; metrics: {trustGate: {passed: boolean}}};
  constraints: Record<string, boolean>};
export type Target = Input & {draft: StorySpec; reviewed: StorySpec; published: StorySpec; stage: FigureStageRow};
export type Approved = {authority: Authority; targets: Target[]; sourcePins: Pin[]};
export const helperPaths = ["owner-publication-authority.ts", "publish-owner-approved.ts", "check-owner-publication.ts"]
  .map(file => `${packetRelative}/${file}`);
export function relativeFile(path: string): string {
  assert(path && !path.includes("..") && !path.startsWith("/") && !path.includes("\\") && !path.includes(":"), "Unsafe pinned repository path");
  return resolve(repository, path);
}
function checkPin(pin: Pin) {
  assert(/^[0-9a-f]{64}$/.test(pin.sha256), "Invalid byte pin");
  assert.equal(sha(readFileSync(relativeFile(pin.path))), pin.sha256, `Pinned bytes changed: ${pin.path}`);
}
export function assertAuthority(authority: Authority) {
  assert.equal(authority.schemaVersion, "owner-authorized-new-three-library-exception-v1");
  assert.equal(authority.decisionId, "owner-publish-new-three-2026-10-04");
  assert.equal(authority.authorizedAt, "2026-10-04T03:53:26.148Z");
  assert.equal(authority.ownerId, "taizhenC");
  assert.equal(authority.ownerStatement, "good, I reiview it, lets merge that and publish to the production");
  assert.equal(authority.authorizationSource, "current-conversation-user-message");
  assert.equal(authority.librarySha256, librarySha256);
  assert.equal(authority.previousLibrarySha256, "bb27964f0d5347deba75b20bd33c59ecba4289a6a95f9618b891fefbda020061");
  same(authority.targets.map(target => target.figureKey), ["franklin_b", "slocum_j", "somerville_m"], "Owner target set/order changed");
  assert.equal(authority.targets.length, 3);
  assert.equal(authority.observedMatching.trustGatePassed, false);
  assert.equal(authority.observedMatching.metrics.trustGate.passed, false);
  same([authority.supplementalCoverage.providerCalls, authority.supplementalCoverage.preflightPassed, authority.supplementalCoverage.rerankTrials],
    [0, false, 0], "Supplemental coverage failure changed");
  same(authority.supplementalCoverage.lostPositiveCaseIndexesZeroBased, [0, 1, 2, 4, 6], "Lost coverage changed");
  same(authority.constraints, {onlyExactThreeReviewedInputs: true, sourceCanonicalTextUnchanged: true, matchingImplementationUnchanged: true,
    recipeThresholdsUnchanged: true, evidenceUnchanged: true, noRecipePromotion: true, prior44PublicationPreservationRequired: true,
    strictEditorialPromotionRequired: true, supplementalCoverageFailureRetained: true, auditThresholdUnchanged: true,
    noDependencyAdvisorySuppression: true}, "Owner exception scope changed");
}
export function assertTarget(target: Target, authority: Authority) {
  const {draft, stage, reviewed, published} = target;
  const pin = authority.targets.find(item => item.storySpecId === target.storySpecId); assert(pin, "Target is outside exact owner scope");
  same({figureKey: target.figureKey, storySpecId: target.storySpecId, candidateSha256: target.candidateSha256, stageSha256: target.stageSha256}, pin, "Target pin differs from owner scope");
  checkPin({path: target.candidateFile, sha256: pin.candidateSha256}); checkPin({path: target.stageFile, sha256: pin.stageSha256});
  same(draft, readJson(relativeFile(target.candidateFile)), "Complete frozen draft changed");
  same(stage, readJson(relativeFile(target.stageFile)), "Complete frozen source stage changed");
  assert.equal(draft.status, "draft"); same(draft.review, {}, "Frozen draft includes approval");
  same([draft.storySpecId, draft.figureKey, draft.stageId, draft.version], [target.storySpecId, target.figureKey, stage.stageId, 1], "Target identity changed");
  same([stage.figureKey, stage.ageMin, stage.ageMax], [draft.figureKey, draft.episode.ageMin, draft.episode.ageMax], "Stage identity/age parity changed");
  same(stage.beats.map(beat => [beat.role, beat.text]), draft.arc.map(beat => [beat.role, beat.canonicalText]), "Reader prose parity changed");
  const expectedReviewed: StorySpec = {...draft, status: "review", review: {researcherId: authority.ownerId,
    historicalReviewerId: authority.ownerId, toneReviewerId: authority.ownerId, reviewedAt: authority.authorizedAt, contentProfileReviewed: true}};
  same(reviewed, expectedReviewed, "Review is not the exact single human owner's three roles");
  same(published, {...expectedReviewed, status: "published"}, "Published document changed outside review/status");
  for (const [spec, forPublish] of [[draft, false], [reviewed, false], [published, true]] as const) {
    assert(parseStorySpecDocument(spec), "Spec shape rejected");
    const result = validateStorySpec(spec, {forPublish});
    assert(result.valid && result.warnings.length === 0, `${target.figureKey}: strict validation failed`);
  }
}
export function readApprovedInputs(): Approved {
  const authorityPath = `${packetRelative}/OWNER-AUTHORIZATION.json`;
  checkPin({path: authorityPath, sha256: ownerAuthorizationSha256});
  const authority = readJson<Authority>(relativeFile(authorityPath)); assertAuthority(authority);
  const evidencePin = {path: `evals/history/match-104-2026-07-02/${authority.recipeId}/${authority.evidenceId}.json`, sha256: authority.evidenceSha256};
  const pins = [authority.readingPacket, authority.frozenInputs, authority.draftImportReceipt, authority.supplementalCoverage,
    evidencePin, ...authority.unchangedInputs, {path: "lib/figures-data.ts", sha256: librarySha256}];
  pins.forEach(checkPin);
  const evidence = readJson<{evidenceId: string; recipeId: string; metrics: Authority["observedMatching"]["metrics"]; config: {provider: string}; run: {caseCount: number; trialCount: number}}>(relativeFile(evidencePin.path));
  same([evidence.evidenceId, evidence.recipeId, evidence.config.provider, evidence.run.caseCount, evidence.run.trialCount],
    [authority.evidenceId, authority.recipeId, "real", 104, 104], "Actual matching evidence changed");
  same(evidence.metrics, authority.observedMatching.metrics, "Owner decision misstates actual failed matching");
  same(readJson<{selection: unknown}>(relativeFile("config/story-recipes.json")).selection, authority.recipeSelection, "Primary/rollback recipe changed");
  const latest = readJson<{releases: Array<{sha256: string; supersedes: string; ownerAuthorizationSha256: string; evidenceIds: string[]}>}>(relativeFile("config/figure-library-releases.json")).releases.at(-1);
  assert(latest); same([latest.sha256, latest.supersedes, latest.ownerAuthorizationSha256, latest.evidenceIds],
    [librarySha256, authority.previousLibrarySha256, ownerAuthorizationSha256, [authority.evidenceId]], "Latest library release lacks this exact decision");
  const inputs = readJson<{schemaVersion: string; expectedStories: number; totalWords: number; candidates: Input[]}>(relativeFile(authority.frozenInputs.path));
  same([inputs.schemaVersion, inputs.expectedStories, inputs.totalWords], ["new-three-frozen-inputs-v1", 3, 2321], "Frozen inputs changed");
  same(inputs.candidates.map(({figureKey, storySpecId, candidateSha256, stageSha256}) => ({figureKey, storySpecId, candidateSha256, stageSha256})), authority.targets, "Frozen inputs differ from owner target pins");
  const packet = readFileSync(relativeFile(authority.readingPacket.path), "utf8");
  const targets = inputs.candidates.map(input => {
    checkPin({path: input.candidateFile, sha256: input.candidateSha256}); checkPin({path: input.stageFile, sha256: input.stageSha256});
    const draft = readJson<StorySpec>(relativeFile(input.candidateFile));
    const stage = readJson<FigureStageRow>(relativeFile(input.stageFile));
    const reviewed: StorySpec = {...structuredClone(draft), status: "review", review: {researcherId: authority.ownerId, historicalReviewerId: authority.ownerId,
      toneReviewerId: authority.ownerId, reviewedAt: authority.authorizedAt, contentProfileReviewed: true}};
    const target: Target = {...input, draft, stage, reviewed, published: {...structuredClone(reviewed), status: "published"}};
    assertTarget(target, authority);
    same(FIGURE_STAGES.find(row => row.figureKey === input.figureKey && row.stageId === stage.stageId), stage, "Installed source stage changed");
    assert(draft.arc.every(beat => packet.includes(beat.canonicalText)), "Owner reading packet changed");
    return target;
  });
  assert.equal(FIGURE_STAGES.length, 63);
  assert.equal(new Set(FIGURE_STAGES.map(row => `${row.figureKey}:${row.stageId}`)).size, 63);
  const old = FIGURE_STAGES.filter(row => !targets.some(target => target.figureKey === row.figureKey));
  assert.equal(old.length, 60);
  assert.equal(sha(JSON.stringify(old)), "0d210d3393250d4860b8c5718c1bb9f9b713347656edc0b5e213a75f98c955f5", "Original sixty complete source rows/order changed");
  return {authority, targets, sourcePins: [{path: authorityPath, sha256: ownerAuthorizationSha256}, ...pins,
    ...inputs.candidates.flatMap(input => [{path: input.candidateFile, sha256: input.candidateSha256}, {path: input.stageFile, sha256: input.stageSha256}]),
    {path: "config/figure-library-releases.json", sha256: sha(readFileSync(relativeFile("config/figure-library-releases.json")))},
    ...helperPaths.map(path => ({path, sha256: sha(readFileSync(relativeFile(path)))}))]};
}
export type DeploymentProof = {schemaVersion: string; ok: boolean; phase: string; requestedSha: string; repository: string; sourceHead: string;
  ci: {ok: boolean; headSha: string; checks: Array<{name: string; state?: string | null; conclusion?: string | null}>};
  deployment: {deploymentId: number | string; sha: string; environment: string; status: string; environmentUrl: string; detailsUrl: string; createdAt: string; statusCreatedAt: string};
  librarySha256: string; ownerAuthorizationSha256: string; observedAt: string};
export function assertDeploymentProof(proof: DeploymentProof) {
  same([proof.schemaVersion, proof.ok, proof.phase, proof.repository], ["new-three-production-deployment-v1", true, "code-before-publication", "taizhenC/Onward"], "Wrong production proof");
  assert(/^[0-9a-f]{40}$/.test(proof.requestedSha) && /^[0-9a-f]{40}$/.test(proof.sourceHead), "Unpinned Git source");
  same([proof.ci.ok, proof.ci.headSha], [true, proof.sourceHead], "CI did not test this source head");
  const success = (check: DeploymentProof["ci"]["checks"][number]) => {
    const state = check.state?.toLowerCase(); const conclusion = check.conclusion?.toLowerCase();
    return (state === "completed" && conclusion === "success") || (state === "success" && (!conclusion || conclusion === "success"));
  };
  const required = ["verify", "detect-recipe-promotion", "recipe-promotion-gate", "Vercel", "Vercel Preview Comments"];
  assert.equal(new Set(proof.ci.checks.map(check => check.name)).size, proof.ci.checks.length, "Duplicate CI check identity");
  for (const name of required) assert(proof.ci.checks.some(check => check.name === name && success(check)), `Required successful CI check absent: ${name}`);
  assert(proof.ci.checks.every(check => success(check) || (check.name === "attest-recipe-promotion" && check.state?.toLowerCase() === "completed" && check.conclusion?.toLowerCase() === "skipped")), "A provided CI check did not succeed");
  same([proof.deployment.sha, proof.deployment.environment, proof.deployment.status], [proof.requestedSha, "Production", "success"], "Deployment is not exact successful Production SHA");
  assert(proof.deployment.deploymentId && /^https:\/\//.test(proof.deployment.environmentUrl) && /^https:\/\//.test(proof.deployment.detailsUrl), "Missing deployment identity/URLs");
  for (const value of [proof.deployment.createdAt, proof.deployment.statusCreatedAt, proof.observedAt]) assert(Number.isFinite(Date.parse(value)), "Missing deployment observation time");
  assert(Date.parse(proof.observedAt) >= Date.parse(proof.deployment.statusCreatedAt), "Proof precedes success");
  same([proof.librarySha256, proof.ownerAuthorizationSha256], [librarySha256, ownerAuthorizationSha256], "Deployment proof authority/library changed");
}
export function readDeploymentProof(path: string, hash: string, approved: Approved, mode: "preflight" | "publish" | "verify") {
  assert(/^[a-f0-9]{64}$/.test(hash), "Deployment proof SHA is required");
  assert.equal(sha(readFileSync(path)), hash, "Deployment proof bytes changed");
  const proof = readJson<DeploymentProof>(path); assertDeploymentProof(proof);
  const git = (...args: string[]) => execFileSync("git", args, {cwd: repository, timeout: 10_000, maxBuffer: 4 * 1024 * 1024});
  git("merge-base", "--is-ancestor", proof.sourceHead, proof.requestedSha);
  const head = git("rev-parse", "HEAD").toString().trim();
  if (head !== proof.sourceHead && head !== proof.requestedSha) {
    assert.equal(mode, "verify", "Live mutations require sourceHead or deployed merge checkout");
    git("merge-base", "--is-ancestor", proof.requestedSha, head);
  }
  // Byte comparisons include the executable helpers, preventing local uncommitted code from inheriting deployment authority.
  for (const pin of approved.sourcePins) {
    assert.equal(sha(git("show", `${proof.requestedSha}:${pin.path}`)), pin.sha256, `Production Git tree differs: ${pin.path}`);
    assert.equal(sha(readFileSync(relativeFile(pin.path))), pin.sha256, `Live checkout differs: ${pin.path}`);
  }
  assert.equal(git("diff", "--name-only", proof.requestedSha, "--", "app", "lib", "config", "evals", "prompts", "scripts", "supabase").toString().trim(), "", "Runtime or validation code differs from deployed Git tree");
  return proof;
}
