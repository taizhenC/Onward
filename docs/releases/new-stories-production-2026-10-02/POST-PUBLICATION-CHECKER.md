# Read-only postpublication checker preparation

Prepared `verify-owner-publication.ts` in both the root document packet and managed production worktree. The live verification has not been run by this preparation phase. It requires independently pinned complete SHA-256 values for the owner publication selection, new owner publication baseline and completed database publication receipt. It fails before network access if any required receipt or pin is missing.

When invoked after publication, it makes exactly three GETs to curated `figures`, `figure_stages` and `story_specs` on the fixed production host. Each query has a fifteen-second full-response deadline, a four-MiB response limit and a one-hundred-row limit, with no retry. It has no Auth, users, reader sessions, provider or mutation path.

It checks 44 valid published StorySpecs, 44 matching published stages and zero quarantined rows; all ten complete candidate documents and source attribution, exact owner review, v2 stage metadata, full-document publication archives and valid lifecycle timestamps; and the prior 34 publications plus every unrelated stage/spec and lifecycle field. The earlier writing baseline proves its captured core fields; the new owner baseline provides the timestamp comparison.

Offline validation passed a positive simulated publication and ten negative cases covering draft status, altered prose, changed review, altered v2 facts, changed prior/unrelated lifecycle fields, target creation/publication timestamps, source changes and quarantine. Fetch was forbidden during the self-test. Scoped ESLint and full TypeScript checks passed. See [preparation receipt](POST-PUBLICATION-CHECKER.json) for the exact code hash.

After the operator signals that publication completed, use:

```powershell
node --import tsx docs/releases/new-stories-production-2026-10-02/verify-owner-publication.ts --selection-sha256=<complete-hash> --baseline-sha256=<complete-hash> --receipt-sha256=<complete-hash>
```

Success writes a fresh immutable `POST-PUBLICATION-<UTC>.json` plus matching Markdown document. They contain counts, public historical identifiers, hashes, field-scope statements and query bounds; raw rows and credentials are never emitted. The check proves the observed database state, while deployment and worker-cache refresh require separate evidence. Existing matching and recorded standard security failures remain visible under the scoped owner decision.
