# Owner publication adapter preparation

Updated 2026-10-03 01:42:52 UTC. The owner explicitly said, “I checked it, publish those into the production,” after the measured matching and security failures had been disclosed. Root instructed preparation of a narrow, truthful owner exception. This preparation executed **no database read/mutation, Auth request, provider evaluation, merge, deployment, live preflight or canary**.

The new files are distinct from the existing passed-gate helpers. Their authorization is fixed to `OWNER-AUTHORIZATION.json` SHA-256 `454ea8a5eb1cba3c595d5824230cc2e5f1f4295bd6dae9e79c7958c3739a31d8`, the exact v2 sixty-stage library `bb27964f0d5347deba75b20bd33c59ecba4289a6a95f9618b891fefbda020061`, and the completed failed real-provider evidence `ev_6f9f15f110e062a26799e08df3b71ddf2de73be13d1f230a44b3262576a6ba1d`. They cannot accept an arbitrary future authority or another content catalog.

## New files and checks

| New prepared file | SHA-256 |
| --- | --- |
| owner-publication-authority.ts | 68f845888d2bb730c9817ffe5ec91736e525e85dc66bb5dab5f13061f7ff7135 |
| apply-owner-approved-stage-v2.ts | 2e262c4ef02c33e79a8b2b9f08a15dd9a9f319155f8abf592e79abc4c84ccadb |
| publish-owner-approved.ts | a312cfcc1a8fc19efd88c8fb8fa60ca9e9fcf2f221331e1abf8e6ae3edef9c85 |

Full `npm run typecheck` and scoped ESLint passed. The authority's offline self-test passed a valid fixed-target receipt and rejected ten negative variants: wrong schema, forged passed trust gate, removed owner exception, changed authority pin, old owner statement, changed library, changed evidence, missing target, changed approved stage hash and extra authority key. Both metadata and publication full-input validations passed for exactly ten complete reviewed inputs; the metadata patch's largest URL is 4,524 characters under its 7,500-character limit. Publication validation preserves all canonical text and evidence, and records one actual owner occupying three required schema roles.

The unchanged original helper hashes remain `publish.ts: 6fb0fda06fa9956df705922f7e2ca0079c477bcb84d0c7a26791ff781870d490`, `apply-approved-stage-v2.ts: 4ef2eeccdf87a7cac5f30b158e816781464a4dfff8f459e2d7d0bcf71c082bd5` and `LIVE-CANARY.ts: 1b57debc2a3cdd66cfdf3e84b9bf660e43f530d56483fbd29b1a7c879f1a5388`. Their previous gate and canary behaviors were preserved.

## Separate owner authority and real failure

The shared validator checks the authority's complete pinned bytes, current installed library, newest appended release's exact `ownerAuthorizationSha256`, all ten candidate/original-stage/v2-stage identities, unchanged matching/recipe/gold/selection hashes, current exact package-lock and preserved failed security report. It reads the actual completed matching evidence and requires its real provider, 104/104 completion and failed trust gate, with exact metrics matching the authority.

Before preparing or consuming an owner-release receipt, it runs the installed checkout's real recipe-governance script and requires exit zero. The owner-release schema is `new-ten-owner-authorized-release-v1`, with exact checks:

```json
{
  "realProviderTrustGate": false,
  "ownerException": true,
  "recipeGovernance": true,
  "unchangedRecipeSelection": true
}
```

The ordinary security audit is still failed. The helper does not suppress the advisory, lower the audit threshold, execute a forced dependency update or claim a passing provider gate. `ok: true` on this distinct receipt means the precisely documented owner-authorized content release passed its identity/governance checks. It never means the measured trust gate passed.

The offline preparation CLI creates `OWNER-RELEASE-RECEIPT.json` exclusively and preserves its first real timestamp on exact recovery. It does not load environment values or contact a database, Auth or provider. After root's review and governance completion, root authorized an actual offline producer invocation from the original repository. An initial invocation exposed a cross-checkout `server-only` resolution defect before any receipt existed. The shared validator now imports the managed checkout's existing CLI bootstrap immediately before that checkout's server-only figure-data import; no runtime/provider/persistence guard changed.

The corrected actual invocation completed at `2026-10-03T01:42:21.293Z`, validating the exact authority and successfully running managed recipe governance. It created reduced local `OWNER-RELEASE-RECEIPT.json` with SHA-256 `4d8ea478a834b0e318452bfaf2191f9c5a30248f6cee4b5b4a288a0df916fc96`. Its real trust gate remains false. Full TypeScript, scoped shared-helper ESLint and the ten-case offline negative self-test passed again after this portability correction. Authority JSON, both adapters, original helpers and canary hashes remain unchanged. This local receipt is release identity evidence, not publication or deployment proof.

## Live preservation and promotion boundary

Both live preflight/apply/publication modes require the exact separately pinned owner-release file and full SHA. Their frozen selection binds that path/hash and fixed owner authority before any live baseline is captured. Current authority, evidence, lock and selection pins are checked again on every invocation. An exact existing receipt cannot authorize a changed release.

The metadata adapter preserves the complete original target stage equality, exact v2 scope, all figure rows, all StorySpecs/lifecycle timestamps and all unrelated stages. It writes only ten factual summaries plus the exact Jacobs and Riis theme additions, while the stages remain drafts and the publication count remains 34.

The publication adapter retains complete draft/row integrity, narrow evidence validation, all prior 34 publications and unrelated row preservation. It records the owner's actual latest statement and one-owner review roles. Review authoring uses serialized immediate full readbacks with draft/empty-review/canonical-text guards. The terminal `promote_story_spec_v2` call still receives the entire receipt-pinned reviewed document, using the database's full-document compare-and-set and atomic stage/spec publication. No direct stage-status write, migration, broad reseed, changed-input retry or ID-only promotion was introduced.

The final publication summary records the fixed authority, real failed evidence, exact owner-exception checks and `published-ten-by-owner-exception` mode. A complete 44-valid/zero-quarantine receipt is written only after all ten exact publications and preservation checks actually succeed. It retains the existing `PUBLISHED-<figure>.json` and `DATABASE-RECEIPT.json` structure needed by the unchanged one-attempt live canary.

A scoped packet `.gitignore` excludes the live full selections, editorial baselines, after snapshots and reviewed/published row receipts from commits. Reduced summaries and content/deployment evidence remain commit candidates. Private reader/session/account identifiers and credentials are never part of these editorial receipts.

## Root operator commands after independent review

Run from `D:\\code_save\\Onward`, with the exact deployed code-first checkout. Replace the receipt hash placeholder only with the actual producer result.

```powershell
node --import tsx docs/releases/new-stories-production-2026-10-02/owner-publication-authority.ts --prepare-release --installed-repository="C:\\Users\\taich\\.codex\\worktrees\\ten-story-production\\Onward" --owner-authorization-sha256=454ea8a5eb1cba3c595d5824230cc2e5f1f4295bd6dae9e79c7958c3739a31d8

node --import tsx docs/releases/new-stories-production-2026-10-02/apply-owner-approved-stage-v2.ts --preflight --installed-repository="C:\\Users\\taich\\.codex\\worktrees\\ten-story-production\\Onward" --owner-release=docs/releases/new-stories-production-2026-10-02/OWNER-RELEASE-RECEIPT.json --owner-release-sha256=<actual-receipt-sha>
node --import tsx docs/releases/new-stories-production-2026-10-02/apply-owner-approved-stage-v2.ts --apply --owner-release=docs/releases/new-stories-production-2026-10-02/OWNER-RELEASE-RECEIPT.json --owner-release-sha256=<actual-receipt-sha>

node --import tsx docs/releases/new-stories-production-2026-10-02/publish-owner-approved.ts --preflight --installed-repository="C:\\Users\\taich\\.codex\\worktrees\\ten-story-production\\Onward" --owner-release=docs/releases/new-stories-production-2026-10-02/OWNER-RELEASE-RECEIPT.json --owner-release-sha256=<actual-receipt-sha>
node --import tsx docs/releases/new-stories-production-2026-10-02/publish-owner-approved.ts --publish --owner-release=docs/releases/new-stories-production-2026-10-02/OWNER-RELEASE-RECEIPT.json --owner-release-sha256=<actual-receipt-sha>
```

Root must first verify the actual code-first Production deployment, then run production publication/schema health and serialized editorial checks. After successful publication, commit real reduced receipts and obtain a second successful Production deployment to refresh workers. Only then invoke the unchanged prepared canary once with that observed exact deployment SHA. Publication, deployment and live-serving verification remain distinct actual outcomes.
