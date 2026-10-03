// One narrowly pinned owner exception; this never reports a passed trust gate.
// All modes are offline: no environment loading, database, Auth or provider work.
import "../../../scripts/_smoke-bootstrap";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";
import type { FigureStageRow } from "../../../lib/types";
import { factsV2ProposalSha256, factsV2ReviewSha256, readApprovedV2Inputs } from "./approved-stage-inputs-v2";

export const ownerAuthorizationSha256 = "454ea8a5eb1cba3c595d5824230cc2e5f1f4295bd6dae9e79c7958c3739a31d8";
export const ownerStatement = "I checked it, publish those into the production";
const librarySha256 = "bb27964f0d5347deba75b20bd33c59ecba4289a6a95f9618b891fefbda020061";
const evidenceId = "ev_6f9f15f110e062a26799e08df3b71ddf2de73be13d1f230a44b3262576a6ba1d";
const evidenceSha256 = "daeed85259fa3437a7b724168fe46cbba50e591ab0b5347ad7d04ea1a17497e4";
const recipeId = "keyword-rerank-figure-library-50-2026-07-02";
const packetRelative = "docs/releases/new-stories-production-2026-10-02";
const sha = (bytes: string | Buffer) => createHash("sha256").update(bytes).digest("hex");
const same = (a: unknown, b: unknown, message: string) => assert(isDeepStrictEqual(a, b), message);
const json = <T>(path: string) => JSON.parse(readFileSync(path, "utf8")) as T;
export type OwnerTarget = {figureKey: string; storySpecId: string; candidateSha256: string; stageSha256: string; productionStageSha256: string};
type Authority = {schemaVersion: string; decisionId: string; authorizedAt: string; ownerId: string; ownerStatement: string; authorizationSource: string;
  librarySha256: string; evidenceId: string; evidenceSha256: string; recipeId: string; recipeSelection: unknown;
  approvedStageProposalSha256: string; approvedStageReviewSha256: string; targets: OwnerTarget[];
  unchangedInputs: Array<{path: string; sha256: string}>;
  observedMatching: {trustGatePassed: false; metrics: {trustGate: {passed: false}}};
  securityException: {advisoryId: string; packageLockSha256: string; standardAuditPassed: false; scope: string; reportFile: string; reportSha256: string};
  constraints: Record<string, boolean>};
export type OwnerRelease = {schemaVersion: "new-ten-owner-authorized-release-v1"; ok: true; completedAt: string;
  ownerAuthorizationSha256: string; ownerId: "taizhenC"; ownerStatement: string;
  librarySha256: string; evidenceIds: string[];
  checks: {realProviderTrustGate: false; ownerException: true; recipeGovernance: true; unchangedRecipeSelection: true};
  targets: OwnerTarget[]};
type LatestRelease = {sha256: string; evidenceIds: string[]; ownerAuthorizationSha256?: string};
function exactKeys(value: object, keys: string[], label: string) {
  same(Object.keys(value).sort(), [...keys].sort(), label + ": unexpected keys");
}
function sortedTargets(targets: OwnerTarget[]) {
  return [...targets].sort((a, b) => a.figureKey.localeCompare(b.figureKey));
}
function targetPins(): OwnerTarget[] {
  return sortedTargets(readApprovedV2Inputs().map(({figureKey, storySpecId, candidateSha256, stageSha256, productionStageSha256}) =>
    ({figureKey, storySpecId, candidateSha256, stageSha256, productionStageSha256})));
}
export function assertOwnerRelease(receipt: OwnerRelease, expectedTargets: OwnerTarget[]) {
  exactKeys(receipt, ["schemaVersion", "ok", "completedAt", "ownerAuthorizationSha256", "ownerId", "ownerStatement", "librarySha256", "evidenceIds", "checks", "targets"], "Owner release");
  assert.equal(receipt.schemaVersion, "new-ten-owner-authorized-release-v1");
  assert.equal(receipt.ok, true, "Owner release is not authorized");
  assert(typeof receipt.completedAt === "string" && Number.isFinite(Date.parse(receipt.completedAt)), "Missing owner-release completion time");
  assert.equal(receipt.ownerAuthorizationSha256, ownerAuthorizationSha256, "Owner authority pin differs");
  assert.equal(receipt.ownerId, "taizhenC"); assert.equal(receipt.ownerStatement, ownerStatement);
  assert.equal(receipt.librarySha256, librarySha256, "Unexpected installed library");
  same(receipt.evidenceIds, [evidenceId], "Unexpected failed evidence");
  same(receipt.checks, {realProviderTrustGate: false, ownerException: true, recipeGovernance: true, unchangedRecipeSelection: true},
    "Owner exception must preserve the actual failed trust gate");
  same(sortedTargets(receipt.targets), sortedTargets(expectedTargets), "Owner receipt targets differ");
  assert.equal(receipt.targets.length, 10);
}
async function inspectAuthority(installedRepository: string, expectedAuthorizationHash: string) {
  assert.equal(expectedAuthorizationHash, ownerAuthorizationSha256, "Different owner authorization");
  const authorityPath = resolve(installedRepository, packetRelative, "OWNER-AUTHORIZATION.json");
  const bytes = readFileSync(authorityPath); assert.equal(sha(bytes), ownerAuthorizationSha256, "Complete owner authority changed");
  const authority = JSON.parse(bytes.toString("utf8")) as Authority;
  assert.equal(authority.schemaVersion, "owner-authorized-library-exception-v1");
  assert.equal(authority.decisionId, "owner-publish-new-ten-2026-10-03");
  assert(typeof authority.authorizedAt === "string" && Number.isFinite(Date.parse(authority.authorizedAt)));
  assert.equal(authority.ownerId, "taizhenC"); assert.equal(authority.ownerStatement, ownerStatement);
  assert.equal(authority.authorizationSource, "current-conversation-user-message");
  assert.equal(authority.librarySha256, librarySha256); assert.equal(authority.evidenceId, evidenceId); assert.equal(authority.evidenceSha256, evidenceSha256);
  assert.equal(authority.recipeId, recipeId);
  assert.equal(authority.approvedStageProposalSha256, factsV2ProposalSha256); assert.equal(authority.approvedStageReviewSha256, factsV2ReviewSha256);
  const targets = targetPins(); same(authority.targets, targets, "Owner authority differs from independently reviewed ten v2 inputs");
  assert.equal(authority.observedMatching.trustGatePassed, false);
  const evidencePath = resolve(installedRepository, "evals/history/match-104-2026-07-02", recipeId, evidenceId + ".json");
  const evidenceBytes = readFileSync(evidencePath); assert.equal(sha(evidenceBytes), evidenceSha256, "Actual failed matching evidence changed");
  const evidence = JSON.parse(evidenceBytes.toString("utf8")) as {evidenceId: string; recipeId: string; metrics: {trustGate: {passed: boolean}}; config: {provider: string}; run: {caseCount: number; trialCount: number}};
  assert.equal(evidence.evidenceId, evidenceId); assert.equal(evidence.recipeId, recipeId); assert.equal(evidence.config.provider, "real");
  same([evidence.run.caseCount, evidence.run.trialCount], [104, 104], "Owner evidence is not the completed original gate");
  assert.equal(evidence.metrics.trustGate.passed, false); same(authority.observedMatching.metrics, evidence.metrics, "Owner exception misstates actual metrics");
  const recipes = json<{selection: unknown}>(resolve(installedRepository, "config/story-recipes.json"));
  same(recipes.selection, authority.recipeSelection, "Selected primary/rollback/decision changed");
  for (const pin of authority.unchangedInputs) {
    assert(!pin.path.includes("..") && !pin.path.startsWith("/") && !pin.path.includes("\\") && !pin.path.includes(":"), "Unsafe unchanged-input path");
    assert.equal(sha(readFileSync(resolve(installedRepository, pin.path))), pin.sha256, "Pinned matching/recipe input changed: " + pin.path);
  }
  assert.equal(authority.securityException.advisoryId, "GHSA-vfj7-8cjw-p6xm");
  assert.equal(authority.securityException.standardAuditPassed, false); assert.equal(authority.securityException.scope, "development-dependency-only");
  assert.equal(sha(readFileSync(resolve(installedRepository, "package-lock.json"))), authority.securityException.packageLockSha256, "Owner security exception lock changed");
  assert(!authority.securityException.reportFile.includes("/") && !authority.securityException.reportFile.includes("\\") && !authority.securityException.reportFile.includes(".."), "Unsafe security report path");
  assert.equal(sha(readFileSync(resolve(installedRepository, packetRelative, authority.securityException.reportFile))), authority.securityException.reportSha256, "Security exception report changed");
  same(authority.constraints, {onlyExactTenReviewedInputs: true, matchingImplementationUnchanged: true, recipeThresholdsUnchanged: true, evidenceUnchanged: true,
    noRecipePromotion: true, sourceCanonicalTextUnchanged: true, prior34PublicationPreservationRequired: true, strictEditorialPromotionRequired: true,
    securityAuditFailureRetained: true, auditThresholdUnchanged: true, noDependencyAdvisorySuppression: true}, "Owner authority scope changed");
  assert.equal(sha(readFileSync(resolve(installedRepository, "lib/figures-data.ts"))), librarySha256, "Installed library changed");
  const latest = json<{releases: LatestRelease[]}>(resolve(installedRepository, "config/figure-library-releases.json")).releases.at(-1);
  assert(latest, "Missing newest content release"); assert.equal(latest.sha256, librarySha256);
  assert.equal(latest.ownerAuthorizationSha256, ownerAuthorizationSha256, "Newest library release lacks exact owner authority");
  same(latest.evidenceIds, [evidenceId], "Newest release changed failed evidence");
  // The installed checkout may resolve its own node_modules/server-only path.
  // Apply that checkout's existing CLI bootstrap before its server data import.
  await import(pathToFileURL(resolve(installedRepository, "scripts/_smoke-bootstrap.ts")).href);
  const {FIGURE_STAGES} = await import(pathToFileURL(resolve(installedRepository, "lib/figures-data.ts")).href) as {FIGURE_STAGES: FigureStageRow[]};
  for (const input of readApprovedV2Inputs()) same(FIGURE_STAGES.find(stage => stage.figureKey === input.figureKey && stage.stageId === input.proposed.stageId),
    input.proposed, input.figureKey + ": installed stage differs from independently reviewed v2");
  return {authority, targets};
}
function governance(installedRepository: string) {
  try {
    execFileSync(process.execPath, ["--import", "tsx", "scripts/check-recipe-governance.ts"], {cwd: installedRepository, stdio: "pipe", timeout: 60_000});
  } catch {
    throw new Error("Installed recipe governance failed; owner receipt is unavailable");
  }
}
export async function readOwnerRelease(path: string, expectedHash: string, installedRepository: string, expectedTargets: OwnerTarget[]) {
  assert(/^[a-f0-9]{64}$/.test(expectedHash), "Pin complete owner-release receipt SHA");
  assert.equal(sha(readFileSync(path)), expectedHash, "Owner-release receipt changed");
  const receipt = json<OwnerRelease>(path); assertOwnerRelease(receipt, expectedTargets);
  const {authority, targets} = await inspectAuthority(installedRepository, receipt.ownerAuthorizationSha256);
  same(sortedTargets(expectedTargets), targets, "Adapter targets differ from authority");
  assert(Date.parse(receipt.completedAt) >= Date.parse(authority.authorizedAt), "Owner receipt predates actual instruction");
  governance(installedRepository);
  return receipt;
}
async function main() {
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === "--self-test") {
    const targets = targetPins();
    const receipt: OwnerRelease = {schemaVersion: "new-ten-owner-authorized-release-v1", ok: true, completedAt: new Date().toISOString(),
      ownerAuthorizationSha256, ownerId: "taizhenC", ownerStatement, librarySha256, evidenceIds: [evidenceId],
      checks: {realProviderTrustGate: false, ownerException: true, recipeGovernance: true, unchangedRecipeSelection: true}, targets};
    assertOwnerRelease(receipt, targets);
    const mutate = (change: (value: Record<string, unknown>) => void) => {
      const changed = structuredClone(receipt) as unknown as Record<string, unknown>; change(changed);
      assert.throws(() => assertOwnerRelease(changed as unknown as OwnerRelease, targets));
    };
    mutate(value => {value.schemaVersion = "new-ten-matching-release-gate-v1";});
    mutate(value => {value.checks = {...receipt.checks, realProviderTrustGate: true};});
    mutate(value => {value.checks = {...receipt.checks, ownerException: false};});
    mutate(value => {value.ownerAuthorizationSha256 = "0".repeat(64);});
    mutate(value => {value.ownerStatement = "lets push all those story into the production.";});
    mutate(value => {value.librarySha256 = "0".repeat(64);});
    mutate(value => {value.evidenceIds = ["ev_forged"];});
    mutate(value => {value.targets = targets.slice(1);});
    mutate(value => {value.targets = targets.map((target, index) => index === 0 ? {...target, productionStageSha256: "0".repeat(64)} : target);});
    mutate(value => {value.extraAuthority = true;});
    console.log(JSON.stringify({ok: true, mode: "offline-owner-release-self-test", negativeCases: 10, databaseReads: 0, databaseMutations: 0, authMutations: 0, providerRequests: 0})); return;
  }
  assert(args[0] === "--prepare-release" && args.length === 3, "Usage: owner-publication-authority.ts --self-test | --prepare-release --installed-repository=<path> --owner-authorization-sha256=<hash>");
  const installedArg = args.find(arg => arg.startsWith("--installed-repository="));
  const hashArg = args.find(arg => arg.startsWith("--owner-authorization-sha256="));
  assert(installedArg && hashArg, "Missing exact owner-authority inputs");
  const installedRepository = resolve(installedArg.slice("--installed-repository=".length));
  const {targets, authority} = await inspectAuthority(installedRepository, hashArg.slice("--owner-authorization-sha256=".length));
  governance(installedRepository);
  const path = resolve(packetRelative, "OWNER-RELEASE-RECEIPT.json");
  const receipt: OwnerRelease = {schemaVersion: "new-ten-owner-authorized-release-v1", ok: true,
    completedAt: existsSync(path) ? json<OwnerRelease>(path).completedAt : new Date().toISOString(),
    ownerAuthorizationSha256, ownerId: "taizhenC", ownerStatement, librarySha256, evidenceIds: [evidenceId],
    checks: {realProviderTrustGate: false, ownerException: true, recipeGovernance: true, unchangedRecipeSelection: true}, targets};
  assertOwnerRelease(receipt, targets); assert(Date.parse(receipt.completedAt) >= Date.parse(authority.authorizedAt));
  if (existsSync(path)) same(json(path), receipt, "Immutable owner-release receipt changed");
  else writeFileSync(path, JSON.stringify(receipt, null, 2) + "\n", {flag: "wx"});
  console.log(JSON.stringify({ok: true, mode: "offline-owner-release-preparation", ownerAuthorizationSha256, ownerReleaseSha256: sha(readFileSync(path)),
    checks: receipt.checks, databaseReads: 0, databaseMutations: 0, authMutations: 0, providerRequests: 0}));
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {console.error(error instanceof Error ? error.message : "Owner authority validation failed"); process.exitCode = 1;});
}
