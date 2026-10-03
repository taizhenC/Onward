# Guarded publication plan for the ten finished stories

The owner requested: “lets push all those story into the production.” This authorizes release work for the exact ten finished stories in the [writing packet](../new-stories-written-2026-10-02/README.md). The owner is recorded as `taizhenC` in the three review roles required by the StorySpec schema. That records one owner's publication decision; it does not invent three independent human reviewers or assert that the owner previously read a document.

The matching library must first pass its content-release gate. These ten stages are new to the installed fifty-stage library. Publishing their database rows would change the live candidate pool; it therefore requires an evaluated library release under [the deployment runbook](../../../docs/DEPLOYING.md#figure-library-releases). It does not require changing the selected recipe. The production release starts from the actual production `origin/main`, rather than merging unrelated work from the authoring branch.

The preserved v1 stages differ from the completed writing inputs only by the reviewed Jacobs `self_invention` and Riis `late_start` additions. The separately preserved [facts-v2 proposal](FACTS-PROPOSAL.v2.json) replaces only all ten `biographicalFacts` summaries relative to v1; [its independent source review](FACTS-REVIEW.v2.md) approves installation and fresh measurement. Frozen original candidates, prose, source ledgers, ages, v1 files and reviews remain intact.

**Current state: publication is paused after two failed matching gates.** Root reported v1 at 94.1% with four definitive wrong matches and v2 at 95% with only two of three misses partial and one definitive positive error. Source-quality approval and mechanical checks do not satisfy those release gates. Prepared v1/v2 helper scopes must not be invoked for database preflight freezing or application until root establishes the final passing content snapshot. See [the preserved initial audit](AUDIT.md) and [v2 preparation audit](AUDIT.v2.md).

## Operator sequence

1. Install and evaluate the exact proposed stages in the isolated production checkout, preserve earlier stages, recipe selection, keyword routes and frozen gold labels, and append the passing real-provider library-release evidence. Document the two unresolved lexical probes and Keller's adult age-gate limit.
2. Once the final reviewed proposal passes, apply only its exact approved matching-column changes to the still-draft database stages. The preserved v1 two-theme scope has [a historical helper](apply-approved-themes.ts). The separately bounded [v2 helper](apply-approved-stage-v2.ts) accepts only exact proposal/review hashes for ten factual summaries and the two reviewed themes. Any future v3 scope needs its own approval and exact allowlist. The publisher does not write matching content. Its first preflight requires complete database equality with all ten approved production stages.
3. Run current database health and publication-integrity checks. Establish a serialized editorial window for these targets. The existing local telemetry probe-secret qualification remains separate from verification of deployed telemetry configuration.
4. Run the publisher's read-only preflight from the original authoring repository, passing the isolated production checkout and approved stage directory. It freezes selection, full intended reviewed documents and an editorial-only baseline covering all figures, stages and StorySpecs. No reader/account table or credential is archived.
5. After independent review of those pins and the passed matching gate, invoke publication with the gate's exact SHA-256. The tool stages only the ten authorized drafts to review, records actual complete readbacks, and persists each review receipt before publishing. The publication RPC receives the full receipt-pinned reviewed document.
6. Verify 44 valid historical publications, zero quarantine, exact prose and review metadata, all ten matching stages published, and all previous 34 publications and unrelated rows unchanged. Refresh production workers after publication and run the [one-request normal-route API canary](LIVE-CANARY-PLAN.md). Record deployment and cleanup evidence separately.

```powershell
# Run with D:\code_save\Onward as the working directory. Replace the isolated
# checkout path with the managed production worktree returned by Codex. Current
# gate failures prohibit the live preflight/apply/publication commands below.
node --import tsx docs/releases/new-stories-production-2026-10-02/apply-approved-stage-v2.ts --validate-inputs

# Only if this exact v2 proposal separately passes the applicable matching gate:
node --import tsx docs/releases/new-stories-production-2026-10-02/apply-approved-stage-v2.ts --preflight --installed-repository="<production-worktree>"
node --import tsx docs/releases/new-stories-production-2026-10-02/apply-approved-stage-v2.ts --apply --matching-gate="<gate-receipt-path>" --matching-gate-sha256="<exact-64-character-sha256>"
node --import tsx docs/releases/new-stories-production-2026-10-02/publish.ts --preflight --installed-repository="<production-worktree>" --production-stage-directory="docs/releases/new-stories-production-2026-10-02/facts-v2-stages"

# Only after the matching gate and independent release audit are complete:
node --import tsx docs/releases/new-stories-production-2026-10-02/publish.ts --publish --matching-gate="<gate-receipt-path>" --matching-gate-sha256="<exact-64-character-sha256>"
```

The preflight pins both configured paths and the exact proposal/review identity. Later calls use those same paths and reject any explicit replacement. The publisher permits either all ten exact preserved v1 stages or all ten exact independently approved v2 stages; it rejects mixed or arbitrary metadata. Its default is v2. It also binds the independently established production Supabase hostname. Preflight never recaptures an existing baseline or rewrites an existing selection. Idempotent recovery accepts only the exact frozen draft, reviewed or published documents; an unexpected edit, lifecycle, gate or prior-catalog change stops the tool.

## Matching-gate receipt contract

The separately prepared gate file must use `schemaVersion: "new-ten-matching-release-gate-v1"`, `ok: true`, a real completion timestamp, `librarySha256` for the isolated checkout's complete `lib/figures-data.ts`, and `evidenceIds` equal to the newest appended library release. Its `checks` object must be exactly:

```json
{
  "realProviderTrustGate": true,
  "recipeGovernance": true,
  "unchangedRecipeSelection": true
}
```

Its `targets` array must contain exactly the ten objects with `figureKey`, original `candidateSha256`, original writing `stageSha256`, and `productionStageSha256`. The gate is consumed only in publication mode. The publisher independently verifies the gate's complete file hash, installed library hash, newest release/evidence bindings, and full equality of every installed production stage with its pinned approved copy. A claimed check in this receipt must refer to the actual completed release checks; the tool does not run a provider evaluation itself.

## Boundaries and recovery

Draft-to-review uses the established authoring path with exact immediate pre-read and post-read, the draft state, empty review and all seven canonical passages as compact predicates. This authoring transition is not a full-document atomic compare-and-set; the operator must keep editorial writes serialized. No changed reviewed snapshot reaches publication.

Each terminal promotion uses the existing `promote_story_spec_v2` function's **full-document compare-and-set**. That function atomically publishes the StorySpec and its corresponding stage. The batch is sequential, not a ten-story transaction. There are no direct stage-status writes, migrations, broad reseeds, automatic changed-input retries or recipe overrides.

`REVIEWED-<figure>.json` persists the actual complete reviewed row before the RPC. `PUBLISHED-<figure>.json` persists the complete verified publication, stage and receipt hashes immediately after each successful readback. First-observed timestamps are retained on exact retries. `PUBLICATION-START.json` pins selection, baseline and gate before any review mutation. A final `DATABASE-RECEIPT.json` is produced only after all ten exact publications and preservation checks pass.

If an RPC result is ambiguous or an operation stops halfway, inspect the durable receipts and rerun only the same pinned inputs. Exact published rows are verified and skipped; exact reviewed rows use the previously bound complete review document. Withdrawal uses the audited `story-spec:status -- retire <storySpecId>` path. Do not demote or overwrite immutable publications or restore draft snapshots over them.

At preparation, the publication tool passed TypeScript checking and scoped ESLint. No database mutation, publication or production deployment was performed by this preparation step.
