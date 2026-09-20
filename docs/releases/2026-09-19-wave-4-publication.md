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
remain frozen. Their draft status, empty reviews and approval-pending source
notes preserve the authoring record; they are not current production metadata.
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

Publication, post-promotion worker refresh and complete live-reader checks
are pending at this preflight checkpoint. This section is not a claim that
the four stories are already live.
