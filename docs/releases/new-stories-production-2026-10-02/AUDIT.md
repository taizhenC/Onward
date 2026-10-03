# Publication and theme-update preparation audit

Audit date: October 2, 2026, local time. This is a fresh adversarial verification pass by the publication-path agent, who also authored `publish.ts`; it is **not a second-agent review of that helper or an independent human sign-off**. Root retains the separate operator audit and final matching-release decision.

**Release is paused. No database mutation, publication or deployment was run by this audit.** Root reported that the proposed sixty-stage library failed the unchanged official 104-case gate (94.1%, four definitive wrong matches), while the original fifty-stage control passed (99%, zero definitive wrong matches). Neither the old control evidence nor successful mechanical checks authorizes publication of the failed sixty-stage snapshot. A separately preserved source-facts-v2 proposal is being prepared and needs independent source review and passing matching evidence before any mutation.

## Findings addressed

The publisher originally preserved all document, identity and status values but omitted `story_specs.created_at`, `published_at` and `retired_at`. Its snapshot and readbacks now include all ten columns of that table. The strict StorySpec parser continues to receive exactly its seven-column integrity envelope. Unrelated rows, including lifecycle timestamps, are compared in full. Target creation timestamps must remain unchanged; review cannot alter timestamps; targets cannot carry unexpected retirement dates; new publications require valid publication dates after the release baseline.

The publisher originally accepted arbitrary controlled-vocabulary theme-only copies. The current v1 authoring scope now pins the exact independently reviewed proposal and every original/proposed stage hash. That permits only the reviewed Jacobs `self_invention` and Riis `late_start` additions. A future facts-v2 proposal must be separately pinned and explicitly reviewed before extending this allowlist. Existing proposal and source files remain preserved; no proposed facts change has been authorized by this audit.

The production hostname is now supported by [current public-bundle evidence](PRODUCTION-TARGET-PROOF.md), rather than relying solely on an earlier ignored local audit. Current public sign-in assets and the locally loaded URL identify the same Supabase project. This does not inspect private Vercel configuration or replace database schema/privilege checks.

## Prepared theme helper

[apply-approved-themes.ts](apply-approved-themes.ts) supplies read-only `--preflight` and mutation `--apply` modes for the existing v1 theme proposal. It is separate from the publisher and never changes StorySpecs, lifecycle statuses, embeddings, matching implementation, recipes or deployments.

The helper binds original research-stage files and candidate hashes to the completed writing receipt. It parses all ten proposed stages, requires byte equality for eight, verifies only `themes` differs for Jacobs and Riis, requires the exact one-element additions and controlled vocabulary, and checks identity, age and canonical-prose parity. Its reviewed proposal SHA-256 is `5998bcf03e3e9ae672bd4721e1262e2c6dd992618ac6a9486a53f0b3578d838b`.

First preflight requires all ten database stages to equal their complete original rows in draft state and all ten StorySpecs to equal the completed empty-review drafts. It archives the complete editorial catalog: all figures, all fourteen stage columns, and all ten StorySpec columns. It compares the original 34 published documents/stages with the preserved writing baseline and verifies current valid-publication count and lifecycle parity. No reader/account table or credentials are queried or archived.

Apply requires root's separately passed matching gate and its exact file hash. It checks all ten input pins, installed library hash, newest release/evidence identities and complete installed-stage equality before writing. Only the two targeted `themes` columns are updated, with draft state and original theme-array guards. An exact immediate snapshot/readback and complete before/after comparison detect any unrelated drift. Because no other stage field is written, an unrelated concurrent field cannot be overwritten by this helper; drift still stops the operation.

Per-stage receipts, a fixed selection, a complete before snapshot, an immutable start receipt, a complete after snapshot and a final receipt support exact-input recovery. A previously applied stage is accepted only when it equals the exact approved copy and the baseline/pins remain unchanged. Unexpected content or lifecycle changes fail closed. The two-row sequence is not a database transaction; root must retain the serialized editorial window and inspect receipts after an ambiguous result.

```powershell
# Run from the original authoring repository only after the final approved
# proposal is settled. The current helper accepts the preserved v1 proposal.
node --import tsx docs/releases/new-stories-production-2026-10-02/apply-approved-themes.ts --preflight --installed-repository="<isolated-production-checkout>"

# Root invokes this only after a passing matching gate is recorded and pinned.
node --import tsx docs/releases/new-stories-production-2026-10-02/apply-approved-themes.ts --apply --matching-gate="<passed-gate-path>" --matching-gate-sha256="<exact-file-sha256>"
```

No preflight selection or database baseline has been frozen during this audit, so the pending separately reviewed facts-v2 proposal can be prepared without rewriting an earlier release selection. Its final scope should either use a separately bounded helper or extend this helper with exact reviewed proposal/hash/field pins; a generic field allowlist alone is insufficient.

## Remaining operator requirements

The matching-gate receipt is trusted operator evidence. The helpers verify its full hash, required passed-check fields, target pins, installed library and newest registry bindings; they do not execute provider evaluation or recompute an entire historical governance run themselves. Root must generate it only after the actual final production content commit passes the applicable real-provider and governance checks. A receipt must not relabel the failed v1 snapshot as passing or substitute evidence computed on the original fifty stages.

Publication uses complete receipt-bound `promote_story_spec_v2` documents and preserves the full original 34 rows, stages and lifecycle timestamps. Draft-to-review follows the established authoring path with immediate full pre/post reads and compact content predicates; it relies on serialized editorial writes and is not a full-document atomic compare-and-set. Terminal publication retains the database's complete-document compare-and-set.

Publication and worker refresh remain distinct. The load-once production stage cache needs refresh after successful publication, followed by a bounded ordinary-route reader/progress check and explicit cleanup. Database readbacks do not alone establish public matchability, cache refresh or reader delivery.

TypeScript checking and scoped ESLint passed for the prepared theme helper and revised publisher. These checks establish static validity, not a completed live mutation, gate pass, deployment or reader canary. No publication or theme application was attempted.
