# Wave 4 — approved four-story publication

Release work began September 19, 2026 (America/New_York); evidence timestamps
below use UTC. The owner requested production publication and explicitly
confirmed reading the exact C. S. Lewis, Barry Marshall, Florence Nightingale
and Flannery O'Connor drafts and content notes, including their disclosed
length and matching-age differences. This approval covers only these four.

## Approved snapshots

| StorySpec | Frozen candidate SHA-256 |
|---|---|
| `lewis:1960-1961-a-grief-observed:v1` | `2629432a8fdd4ab5523dc57c295788e51cd2cd6ff64cf35e96d7fa815ca6e871` |
| `marshall:1982-1984-drinking-the-proof:v1` | `db2b95b04e29af652e6ec507b0a55e39e673ba7bc5ca237fae4d2cab3d9966da` |
| `nightingale:1856-1860-spent:v1` | `eb8bc2c60c4036dbd2ace38a0b8fa5770b16e6086ba7ab70c6ad64d42ecfd732` |
| `oconnor:1950-1955-lupus-and-the-farm:v1` | `039a1afc8ea3d4960af0d363a7cfdafc506caac71b45f24d3af8357757fa35b7` |

The [nine-story packet](wave-4-drafts-2026-09-19/README.md),
[reading copy](wave-4-drafts-2026-09-19/READING-COPY.md) and candidate JSONs
remain frozen. Their draft status and empty reviews preserve the authoring
record, not current production status/review metadata. Approval-pending
wording in source/content notes is retained unchanged as authoring-time
provenance; the actual approval is recorded in production review fields.
The publication derivative changes only status and the actual owner's review
metadata. No prose, source evidence or content note changes after approval.
No additional human reviewer is invented.

The owner accepted the four stories' reading qualifications: 696/596/693/646
words respectively, rather than a claim that every story reaches the soft
duration aim. Narrative versus installed matching ages remain Lewis 61–62
versus 60–62, Marshall 30–33 versus 31–34, Nightingale 37 versus 36–40, and
O'Connor 25–27 versus 25–33. Matching configuration remains unchanged.
Lewis's relief is temporary; Marshall's encouragement is not instant travel
or scientific vindication, and his later self-experiment is non-procedural;
Nightingale's work does not cure illness; O'Connor's humor and publication
threshold do not imply invented despair or emotional transformation.

Lamarr, Frances Glessner Lee, Edmonia Lewis, Lindgren and McClintock remain
held and unpublished. No older hold is cleared by this release.

## Preflight

An independent read-only check verified all nine hashes, all 63 exact
reading-copy passages, and the required-hash batch validator with zero
errors/warnings. [PR #132](https://github.com/taizhenC/Onward/pull/132) was
merged by the owner at `2026-09-20T02:11:26Z`; all required checks passed.
Its merge commit `75c372e668ec3e68c96af24e499bd6e39c3d65eb` reached successful
GitHub Production deployment `6548063530` at `2026-09-20T02:12:43Z`.

Fresh database readiness checks passed all 22 gates: 18 valid published
historical StorySpecs, zero quarantined, matching-stage parity, immutable
recipe registration, and publication/retention/ownership boundaries.
The initial local check stopped because this shell had no telemetry secret;
the non-mutating probe reran with a random, process-local test secret. It did
not read or replace Vercel's secret or verify that deployed secret's value.
The database probes used nonexistent targets or invalid inputs, not reader
content mutations. No migration or seeding was performed.

## Snapshot-bound database publication

The scoped audit matched the established production database identity,
confirmed all nine wave-four stages were draft, and proved that none of the
four selected stages had a published predecessor. A backup captured at
`2026-09-20T02:18:59.539Z` covers all nine scoped editorial rows/stages and the
entire prior public editorial catalog, not reader accounts, Disclosures or
saved artifacts. Local backup:
`.codex-recovery/wave-4-production-before-2026-09-19.json.gz.b64`.
Uncompressed SHA-256:
`3d49dcc9ab94d22a527fa3681d5c18956ecd3dc066c561fdf486f9c3cee4da43`.
The saved backup was decompressed and its hash verified before mutation.

All four dry runs passed without errors or warnings. The existing
`promote-candidate.ts` helper stored the confirmed owner, `taizhenC`, in the
research, historical and tone roles with `contentProfileReviewed: true`.
A separate read-back compared each complete stored review to its frozen
candidate, excluding only status/review metadata, before any publication.

| Story | Stored review time (UTC) | Publication time (UTC) |
|---|---|---|
| C. S. Lewis | `2026-09-20T02:19:15.816Z` | `2026-09-20T02:19:31.286833Z` |
| Barry Marshall | `2026-09-20T02:19:16.965Z` | `2026-09-20T02:19:32.429149Z` |
| Florence Nightingale | `2026-09-20T02:19:18.124Z` | `2026-09-20T02:19:33.502706Z` |
| Flannery O'Connor | `2026-09-20T02:19:19.219Z` | `2026-09-20T02:19:34.547555Z` |

The normal `story-spec:status -- publish` path called `promote_story_spec_v2`
with each complete expected reviewed snapshot. Each promotion is atomic;
the four-story batch is not. All four calls succeeded. No manual retirement,
direct stage-status update, blanket seeding, recipe or schema change occurred.

Read-back at `2026-09-20T02:19:37.539Z` verified:

- Four exact approved StorySpecs and their stages are published.
- All earlier 18 published records and their stages are unchanged.
- All five held wave-four stories/stages remain unchanged and unpublished.
- There are 22 valid published historical stories, zero quarantined, with
  identical stage/catalog inventories and healthy publication safeguards.
- Selected matching-stage content is unchanged apart from publication status.

Local audit/receipts are `.codex-recovery/wave-4-audit-2026-09-19.ts`,
`.codex-recovery/wave-4-reviewed-snapshots-2026-09-19.json` and
`.codex-recovery/wave-4-production-receipt-2026-09-19.json`.

## Worker refresh and live-reader verification

[PR #133](https://github.com/taizhenC/Onward/pull/133) records this publication.
Its CI, recipe-promotion checks and Vercel preview passed before merge at
`2026-09-20T02:24:19Z`. Merge commit
`001d92ab5bc8167f33aabd45a7a2b449d081f6a0` reached successful GitHub Production
deployment `6548151224` at `2026-09-20T02:25:15Z`. This refreshed Vercel workers
after the database promotions; the editorial catalog is cached once per
application process. No required check was bypassed.

At `2026-09-20T02:26:25.600Z`, one fresh anonymous test guest completed all
four stories through the normal [production reader](https://onwardapp.me).
All four existing adult evaluation fixtures opened directly, without
clarification, adjacent acceptance, forced selection or rate-limit bypass.
Candidate hashes and fixture validity were checked before Auth/provider calls.

| Story | Passages verified | Reader chunks | Recovery steps |
|---|---:|---:|---:|
| C. S. Lewis | 7 | 20 | 0 |
| Barry Marshall | 7 | 20 | 0 |
| Florence Nightingale | 7 | 21 | 0 |
| Flannery O'Connor | 7 | 18 | 0 |

All match, reader-page, chunk and acknowledgement requests returned HTTP 200.
Every progress acknowledgement and the seven-passage ending were checked.
All 28 complete passages matched their approved canonical text after
whitespace normalization, not byte-identical paragraph formatting. This API
canary verifies the reader/progress path, not visual layout or fresh-intake
Auth bootstrap; deployment identity is evidenced separately above.

The exact new anonymous identity was rechecked before normal CSRF-protected
account deletion. Its guest account and four test stories were removed;
the operator's account was never used. No account/session IDs, cookies,
credentials or intake disclosures are saved in the receipt.

A final scoped database audit at `2026-09-20T02:26:35.798Z` reconfirmed
22 valid published historical stories, zero quarantined, healthy publication
safeguards, unchanged earlier 18 publications/stages and five held drafts,
and unchanged selected matching content. It also reconstructed each exact
pre-promotion reviewed document and checked its stored hash and review
metadata against the pinned pre-promotion receipt. That receipt's SHA-256 is
`6dfc22a0a341031916445b233af4f61febfd4603a15aa5014345d804ffc48bd8`.
All 22 database readiness gates passed again after publication, using the
same process-local test-secret approach described above.

Local evidence:

- `.codex-recovery/wave-4-production-snapshot-proof-2026-09-19.json`.
- `.codex-recovery/wave-4-reader-canary-2026-09-19.ts`.
- `.codex-recovery/wave-4-reader-canary-receipt-2026-09-19.json`.
- `.codex-recovery/wave-4-production-post-canary-2026-09-19.json`.

The original authoring packet and earlier releases are unchanged. No runtime,
matching/library, recipe, schema, saved reader artifact or 牛大 content changed.
Focused commits use only `taizhenC <tzhcheung@gmail.com>` as author and
committer, without co-author trailers. If a real content concern requires
removal, use audited retirement; restoring prose requires a newly reviewed
version, never an overwrite of a published/retired snapshot or saved artifact.
