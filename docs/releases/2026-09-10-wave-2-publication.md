# Wave 2 — first cleared production subset

September 10, 2026. After reviewing the nine-story packet, the owner instructed:
publish stories that meet our standards and rewrite those that do not.
This resolves the subset decision recorded in
[the original reviewed packet](wave-2-reviewed-2026-09-10/README.md).
It does not waive the recipe or create new historical facts.

## Published content

Andersen, Banting and Child were published through the existing reviewed
StorySpec workflow. Canonical prose and all evidence are unchanged from the
owner-reviewed JSONs. One actual human, `taizhenC`, is recorded in all review
roles; no additional reviewers or co-authors were invented.

| StorySpec | Candidate SHA-256 | Review timestamp (UTC) |
|---|---|---|
| `andersen:1822-1827-the-headmasters-school:v1` | `051bf21bc75e38b313d7418a6a3f6bd3f595776373a2c975fe20d5a378d0bb07` | 2026-09-10T04:27:38.879Z |
| `banting:1920-1922-empty-waiting-room:v1` | `259cfe33e88bc95464d1867ac0813ffb1cd31ed54ef6702f099b9c6aff72b52a` | 2026-09-10T04:27:42.763Z |
| `child:1946-1961-aimless-to-the-book:v1` | `10838ea0cb64e1ab679d74d571ce69bb0ed90c87f9ae5a20b9ccc871625b205c` | 2026-09-10T04:27:46.303Z |

At 2026-09-10T04:27:50.094Z, a fresh read-back confirmed:

- all three rows and corresponding stages are published;
- all published content and evidence exactly match the selected inputs,
  apart from review/status metadata;
- 12 published historical stories are valid, with zero quarantined rows;
- the earlier nine published StorySpecs are byte-equivalent as structured
  records to the pre-publication baseline;
- publication-schema health is fully true, and stage/catalog inventories agree;
- matching-stage content is unchanged.

**Production publication and live reading are verified.**
[PR #124](https://github.com/taizhenC/Onward/pull/124) merged at
2026-09-10T04:32:59Z after CI and the Vercel preview passed. Its merge commit is
`eb7a1e539fb4b297346e77202372d338af5725d3`. GitHub production deployment
`6364634212` completed successfully at 2026-09-10T04:34:03Z for that commit,
refreshing the workers' stage inventory.

At 2026-09-10T04:35:35.819Z, an actual anonymous-reader canary on
[Onward production](https://onwardapp.me) verified normal matching, reading and
progress acknowledgements through all seven passages of each selected story:

| Story | Passages | Reader chunks | Exact canonical prose |
|---|---:|---:|---|
| Andersen | 7 | 21 | Yes |
| Banting | 7 | 22 | Yes |
| Child | 7 | 24 | Yes |

Every match, beat and acknowledgement request returned HTTP 200. The canary
reached all three endings and compared returned text with the approved inputs.
It used one newly created anonymous guest, never the operator's account. After
verifying that identity, the normal CSRF-protected account-deletion flow removed
only that test guest and its three test stories; the expected 303 redirect to
`/account-deleted` confirmed completion. No reader identifiers or credentials
are included in this receipt.

## Preflight and recovery

The established production database identity matched the previous release
receipt. The most recent successful production deployment before publication
was Git commit `c3d6754032bb6a1b5cd3e5fa79b0172a3add1aa4`, GitHub deployment
`6320674611`. It already contains the compatible reader.

Scoped backup:
`.codex-recovery/wave-2-production-before-2026-09-10.json.gz.b64`.
Uncompressed SHA-256: `46f037f380ebe906d0c755659cfeaedbc46f5d961a89d50d89b00b662e2dae94`.
It contains only selected editorial StorySpec/stage records and the
pre-publication public editorial catalog, not accounts, disclosures or saved
reader artifacts. The detailed local receipt is
`.codex-recovery/wave-2-production-receipt-2026-09-10.json`.

For each exact selected file, the existing promotion helper stored the
confirmed owner review, then `story-spec:status -- publish` invoked
`promote_story_spec_v2` with the complete expected reviewed JSON.
All calls returned successfully. No manual retirement or blanket reseeding
was performed. Each story promotion is atomic; the three-story batch is not.
The read-only postflight compared against the scoped backup before this
publication result was recorded.

To disable a bad current story, use the audited retirement path. Restoring
older text requires a new reviewed version; do not overwrite terminal rows
from the backup. Saved reader artifacts remain immutable.

## Why the other six are not included

The six remaining drafts were rewritten under the same standards, not
published as exceptions. The [separate rewrite packet](wave-2-rewritten-2026-09-10/README.md)
records the actual revisions, source corrections and independent checks.
Brontë and Christie now have more coherent writing-focused arcs; Charles omits
the disputed grief sequence. All six still have specific source or scene-level
holds under the unchanged recipe. The original nine reviewed snapshots remain
frozen. The new drafts have separate hashes and no inherited approval metadata.

The shorter length of Andersen is an editorial qualification, not a missing
ending. Child's unresolved diploma/examination date disagreement is retained
in its evidence record and excluded from the prose; it was not falsely
resolved for publication. Existing matching ages/hooks remain older than
some narrowed narratives, as in the first-wave story-only release. A matching
correction is a separate evaluated figure-library release.

## CI prerequisite

PR #124 initially failed the existing security-audit gate before story tests.
The same failure reproduced locally. The locked dependencies were affected
by [the js-yaml advisory](https://github.com/advisories/GHSA-2883-xcg3-v3hh) and
[the sharp advisory](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c).
A separate focused commit updates js-yaml to 4.3.2 and sharp to 0.35.4 without
changing unrelated platform metadata. Fresh installation, `audit:high`,
`check-sharp-runtime`, lint, typecheck, reviewed-snapshot validation and
story artifact/composer checks pass locally. The existing audit and native
runtime checks provide the regression boundary; no debug instrumentation
or production workaround was added.

The research skill determined the publish/rewrite split. The debugging skill
isolated the deterministic dependency failure; bisection and instrumentation
were unnecessary because the audit named exact packages and fixed versions.
Remote CI run `34437341366` and recipe-gate run `34437487182` passed before
merge. Production deployment and the live reader check subsequently passed as
recorded above; no gate was bypassed.
