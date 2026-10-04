// Offline source-derived fixtures only: no env files, network, DB or receipt writes.
import "../../../scripts/_smoke-bootstrap";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { FIGURE_STAGES } from "../../../lib/figures-data";
import { assertAuthority, assertDeploymentProof, assertTarget, librarySha256, ownerAuthorizationSha256,
  readApprovedInputs, same, type DeploymentProof } from "./owner-publication-authority";
import { assertCatalog, assertCasResult, assertImmutableReceipt, assertPublishedRecovery, coreRow, figureRow, publicationHealth, reviewCasQuery, reviewDraft, specRow, stageRow,
  type Catalog, type Transport, type VersionedRow } from "./publish-owner-approved";

export async function runOfflineChecks() {
  const originalFetch = globalThis.fetch; let networkAttempts = 0;
  globalThis.fetch = async () => {networkAttempts++; throw new Error("Offline publication checks forbid network");};
  try {
    const approved = readApprovedInputs(); const target = approved.targets[0];
    const capturedAt = "2026-10-04T04:00:00.000Z"; const createdAt = "2026-10-04T00:33:26.000Z";
    // Synthetic unrelated documents exercise preservation; they are not production receipts or independent historical approvals.
    const catalog: Catalog = {figures: FIGURE_STAGES.map(figureRow), stages: FIGURE_STAGES.map(row => stageRow(row, "draft")), specs: []};
    const old = FIGURE_STAGES.filter(stage => !approved.targets.some(item => item.figureKey === stage.figureKey));
    for (let index = 0; index < old.length; index++) {
      const stage = old[index]; const status = index < 44 ? "published" : "draft";
      const source = status === "published" ? target.published : target.draft;
      const spec = {...structuredClone(source), figureKey: stage.figureKey, stageId: stage.stageId,
        storySpecId: `${stage.figureKey}:${stage.stageId}:v1`};
      const row = specRow(spec, createdAt); if (status === "published") row.published_at = "2026-10-03T01:00:00.000Z";
      catalog.specs.push(row);
      catalog.stages.find(item => item.figure_key === stage.figureKey && item.stage_id === stage.stageId)!.status = status;
    }
    const extra = structuredClone(catalog.specs[59]); extra.version = 2; extra.story_spec_id = `${extra.figure_key}:${extra.stage_id}:v2`;
    extra.spec.version = 2; extra.spec.storySpecId = extra.story_spec_id; catalog.specs.push(extra);
    for (const item of approved.targets) catalog.specs.push(specRow(item.draft, createdAt));
    const baseline = structuredClone(catalog);
    const results: Array<{name: string; outcome: string}> = [];
    const positive = (name: string, run: () => unknown) => {run(); results.push({name, outcome: "PASS"});};
    const negative = (name: string, run: () => unknown) => {assert.throws(run, name); results.push({name, outcome: "REJECTED_AS_REQUIRED"});};
    const mutate = (name: string, change: (value: Catalog) => void) => negative(name, () => {const altered = structuredClone(catalog); change(altered); assertCatalog(altered, baseline, approved, capturedAt);});
    positive("three exact drafts / 63 figures / 63 stages / 64 specs / 44 valid", () => assert.equal(assertCatalog(catalog, baseline, approved, capturedAt), 0));
    positive("same single owner supplies exactly three review roles", () => approved.targets.forEach(item => assertTarget(item, approved.authority)));
    const review = structuredClone(catalog); const reviewRow = review.specs.find(row => row.story_spec_id === target.storySpecId)!;
    reviewRow.status = "review"; reviewRow.spec = target.reviewed;
    positive("exact review retry is allowed", () => assertCatalog(review, baseline, approved, capturedAt));
    const published = structuredClone(catalog);
    for (const item of approved.targets) {const row = published.specs.find(row => row.story_spec_id === item.storySpecId)!;
      row.status = "published"; row.spec = item.published; row.published_at = "2026-10-04T04:01:00.000Z";
      published.stages.find(stage => stage.figure_key === item.figureKey && stage.stage_id === item.stage.stageId)!.status = "published";}
    positive("all three exact published retries / 47 valid", () => assert.equal(assertCatalog(published, baseline, approved, capturedAt), 3));
    const partial = structuredClone(published); const last = approved.targets[2]; const lastRow = partial.specs.find(row => row.story_spec_id === last.storySpecId)!;
    lastRow.status = "draft"; lastRow.spec = last.draft; lastRow.published_at = null; partial.stages.find(row => row.figure_key === last.figureKey)!.status = "draft";
    positive("interrupted two-publication retry preserves all other rows", () => assert.equal(assertCatalog(partial, baseline, approved, capturedAt), 2));
    const changeAuthority = (name: string, change: (value: typeof approved.authority) => void) => negative(name, () => {const a = structuredClone(approved.authority); change(a); assertAuthority(a);});
    changeAuthority("wrong owner", a => {a.ownerId = "invented-reviewer";});
    changeAuthority("wrong owner statement", a => {a.ownerStatement = "old ten approval";});
    changeAuthority("wrong library", a => {a.librarySha256 = "0".repeat(64);});
    changeAuthority("wrong target count", a => {a.targets.pop();});
    changeAuthority("failed matching relabeled as pass", a => {a.observedMatching.trustGatePassed = true;});
    changeAuthority("supplemental fail relabeled as pass", a => {a.supplementalCoverage.preflightPassed = true;});
    negative("fictitious independent reviewer", () => {const item = structuredClone(target); item.reviewed.review.toneReviewerId = "another-human"; assertTarget(item, approved.authority);});
    negative("wrong candidate pin", () => {const item = structuredClone(target); item.candidateSha256 = "0".repeat(64); assertTarget(item, approved.authority);});
    negative("wrong stage pin", () => {const item = structuredClone(target); item.stageSha256 = "0".repeat(64); assertTarget(item, approved.authority);});
    negative("unapproved published document", () => {const item = structuredClone(target); item.published.avoidRules.push("unapproved change"); assertTarget(item, approved.authority);});
    negative("canonical stage parity", () => {const item = structuredClone(target); item.stage.beats[0].text += " changed"; assertTarget(item, approved.authority);});
    negative("episode/stage age parity", () => {const item = structuredClone(target); item.stage.ageMin++; assertTarget(item, approved.authority);});
    mutate("draft review tamper", c => {c.specs.find(row => row.story_spec_id === target.storySpecId)!.spec.review = target.reviewed.review;});
    mutate("draft nonnull publication time", c => {c.specs.find(row => row.story_spec_id === target.storySpecId)!.published_at = capturedAt;});
    mutate("draft nonnull retirement time", c => {c.specs.find(row => row.story_spec_id === target.storySpecId)!.retired_at = capturedAt;});
    mutate("target created_at drift", c => {c.specs.find(row => row.story_spec_id === target.storySpecId)!.created_at = capturedAt;});
    mutate("target full document mutation", c => {c.specs.find(row => row.story_spec_id === target.storySpecId)!.spec.avoidRules.push("changed");});
    mutate("target core identity drift", c => {c.specs.find(row => row.story_spec_id === target.storySpecId)!.version = 2;});
    mutate("target stage source mutation", c => {c.stages.find(row => row.figure_key === target.figureKey)!.sources.push("unapproved");});
    mutate("target theme mutation", c => {c.stages.find(row => row.figure_key === target.figureKey)!.themes = ["invented"];});
    mutate("unrelated figure drift", c => {c.figures[0].display_name += "changed";});
    mutate("unrelated stage drift", c => {c.stages[0].biographical_facts += "changed";});
    mutate("unrelated spec review drift", c => {c.specs[0].spec.review.toneReviewerId = "changed";});
    mutate("prior44 published_at drift", c => {c.specs[0].published_at = capturedAt;});
    mutate("prior44 retired_at drift", c => {c.specs[0].retired_at = capturedAt;});
    mutate("unrelated extra row", c => {c.figures.push({...c.figures[0], key: "extra"});});
    mutate("unrelated missing row", c => {c.specs.pop();});
    mutate("published sibling would be retired by RPC", c => {const row = c.specs[60]; row.figure_key = target.figureKey; row.stage_id = target.stage.stageId;});
    mutate("duplicate catalog identity", c => {c.specs[60].story_spec_id = c.specs[0].story_spec_id;});
    negative("published row without stage publication", () => {const c = structuredClone(published); c.stages.find(row => row.figure_key === target.figureKey)!.status = "draft"; assertCatalog(c, baseline, approved, capturedAt);});
    negative("published timestamp predates selection", () => {const c = structuredClone(published); c.specs.find(row => row.story_spec_id === target.storySpecId)!.published_at = createdAt; assertCatalog(c, baseline, approved, capturedAt);});
    negative("published wrong full review", () => {const c = structuredClone(published); c.specs.find(row => row.story_spec_id === target.storySpecId)!.spec.review.reviewedAt = capturedAt; assertCatalog(c, baseline, approved, capturedAt);});
    const prior: VersionedRow = {...specRow(target.draft, createdAt), xmin: "100"};
    const returned: VersionedRow = {...specRow(target.reviewed, createdAt), xmin: "101"};
    positive("xmin guard binds identity/status/lifecycle/version", () => {const q = reviewCasQuery(prior, target);
      same([q.get("xmin"), q.get("status"), q.get("published_at"), q.get("retired_at")], ["eq.100", "eq.draft", "is.null", "is.null"], "CAS filters differ");});
    positive("one-row atomic review response", () => assertCasResult([returned], prior, target));
    negative("xmin zero-row concurrent update", () => assertCasResult([], prior, target));
    negative("CAS returns multiple rows", () => assertCasResult([returned, returned], prior, target));
    negative("CAS returns changed content", () => {const changed = structuredClone(returned); changed.spec.avoidRules.push("changed"); assertCasResult([changed], prior, target);});
    negative("CAS returns changed lifecycle", () => assertCasResult([{...returned, published_at: capturedAt}], prior, target));
    negative("CAS row version did not advance", () => assertCasResult([{...returned, xmin: "100"}], prior, target));
    negative("fresh version read is already changed", () => reviewCasQuery({...prior, retired_at: capturedAt}, target));
    negative("missing numeric xmin", () => reviewCasQuery({...prior, xmin: "malformed"}, target));
    positive("identical immutable receipt is reusable", () => assertImmutableReceipt({row: returned}, {row: returned}, "mock"));
    negative("immutable receipt collision", () => assertImmutableReceipt({row: prior}, {row: returned}, "mock"));
    positive("published retry has pre-publication archive", () => assertPublishedRecovery(true));
    negative("published retry lacks pre-publication archive", () => assertPublishedRecovery(false));
    let reviewWrites = 0;
    const transport: Transport = {async catalog() {return catalog;}, async versioned() {return prior;}, async review() {reviewWrites++; return [returned];}, async promote() {throw new Error("Offline mock must never promote");}};
    await reviewDraft(transport, target, catalog); assert.equal(reviewWrites, 1); results.push({name: "real reviewDraft control flow uses fresh full row before mock CAS", outcome: "PASS"});
    await assert.rejects(reviewDraft({...transport, async versioned() {return {...prior, published_at: capturedAt};}}, target, catalog));
    assert.equal(reviewWrites, 1); results.push({name: "changed fresh read blocks before any mock PATCH", outcome: "REJECTED_AS_REQUIRED"});
    const proof: DeploymentProof = {schemaVersion: "new-three-production-deployment-v1", ok: true, phase: "code-before-publication", repository: "taizhenC/Onward",
      requestedSha: "1".repeat(40), sourceHead: "2".repeat(40), ci: {ok: true, headSha: "2".repeat(40), checks: ["verify", "detect-recipe-promotion", "recipe-promotion-gate", "Vercel", "Vercel Preview Comments"]
        .map(name => ({name, state: "COMPLETED", conclusion: "SUCCESS"})).concat([{name: "attest-recipe-promotion", state: "COMPLETED", conclusion: "SKIPPED"}])},
      deployment: {deploymentId: 1, sha: "1".repeat(40), environment: "Production", status: "success", environmentUrl: "https://example.test", detailsUrl: "https://example.test/deploy", createdAt: capturedAt, statusCreatedAt: capturedAt},
      librarySha256, ownerAuthorizationSha256, observedAt: capturedAt};
    positive("successful normal verify CI with expected skipped attestation", () => assertDeploymentProof(proof));
    const badProof = (name: string, change: (p: DeploymentProof) => void) => negative(name, () => {const p = structuredClone(proof); change(p); assertDeploymentProof(p);});
    badProof("CI tested another head", p => {p.ci.headSha = "3".repeat(40);});
    badProof("normal verify CI missing", p => {p.ci.checks = [{name: "unrelated", conclusion: "SUCCESS"}];});
    badProof("normal verify CI failed", p => {p.ci.checks[0].conclusion = "FAILURE";});
    badProof("stale success conclusion on incomplete check", p => {p.ci.checks[0].state = "IN_PROGRESS";});
    badProof("active authority check failed", p => {p.ci.checks[1].conclusion = "FAILURE";});
    badProof("required Vercel check omitted", p => {p.ci.checks = p.ci.checks.filter(check => check.name !== "Vercel");});
    badProof("unrelated skipped check", p => {p.ci.checks.push({name: "unrelated", conclusion: "SKIPPED"});});
    badProof("deployment another SHA", p => {p.deployment.sha = "3".repeat(40);});
    badProof("Preview deployment substituted", p => {p.deployment.environment = "Preview";});
    badProof("deployment not successful", p => {p.deployment.status = "pending";});
    badProof("deployment changed library", p => {p.librarySha256 = "0".repeat(64);});
    badProof("deployment old owner authority", p => {p.ownerAuthorizationSha256 = "0".repeat(64);});
    positive("published health parser rejects zero quarantines requirement", () => publicationHealth(published, 47));
    assert.equal(networkAttempts, 0); assert.equal(coreRow(returned).status, "review");
    const result = {ok: true, mode: "offline-new-three-owner-publication", fixtureScope: "synthetic catalog, exact frozen new-three documents; no production receipt or matching pass",
      ownerAuthorizationSha256, librarySha256, checks: results.length, negativeChecks: results.filter(item => item.outcome === "REJECTED_AS_REQUIRED").length,
      environmentFilesRead: 0, networkAttempts, databaseReads: 0, databaseMutations: 0, providerRequests: 0, receiptWrites: 0, results};
    console.log(JSON.stringify(result)); return result;
  } finally {globalThis.fetch = originalFetch;}
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  assert(process.argv.slice(2).length === 0 || (process.argv.length === 3 && process.argv[2] === "--self-test"), "Offline check accepts only --self-test");
  runOfflineChecks().catch(error => {console.error(error instanceof Error ? error.message : "Offline publication check failed"); process.exitCode = 1;});
}
