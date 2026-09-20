# Ten repaired stories — production publication, 20 September 2026

## Owner decision and exact scope

The owner said, “I review it, lets merge those test and publish to the production.”
This records approval of the exact repaired packet at
`2a53dce8f3b9e420c72c69c5a38400b382476da8`, including the authorized shorter
source-led forms and disclosed qualifications. Review roles identify `taizhenC`:
one owner, not three independent human reviewers.

[PR #138](https://github.com/taizhenC/Onward/pull/138) passed applicable checks
and merged normally at `d67fc082ecdccf5c48917c25423a90a1e01abc62`
(`2026-09-20T23:51:14Z`), preserving 44 focused commits. Production deployment
`6559166346` for that merge succeeded at `2026-09-20T23:52:11Z`.
This initial deployment preceded the database publication; it is not the
post-publication worker refresh.

The [release selection](held-ten-publication-2026-09-20/selection.json) pins
each of the ten candidate files and SHA-256 digests, records the owner's exact
statement, and explicitly lists the sixteen holds. The frozen 26-story packet
and all earlier review snapshots remain unchanged. The frozen review-index
SHA-256 is `0146c5cf609ca78c489513624e5a3455102993f462e6b485e352b4048deb32d9`.

The preflight added **Christie** to the original fifteen integration holds:
the installed matching descriptions center bereavement, disappearance and the
train journey, while the repaired story centers the difficult-book episode.
Owner text review does not silently authorize a matching rewrite. Charles's
actual installed matching range is **14–17**, not the 14–18 stated in the frozen
research note; his reviewed story retains ages **14–18**. Neither age range nor
matching content was changed, and this is not a narrower-inside comparison.

## Completed database publication

| StorySpec ID | Database publication time (UTC) |
|---|---|
| `butler:1974-1975-pre-patternmaster:v1` | `2026-09-20T23:57:29.84285+00:00` |
| `charles_r:1945-1948-orphaned-to-the-bus:v1` | `2026-09-20T23:57:30.045546+00:00` |
| `coleman:1918-1921-no-school-would-take-her:v1` | `2026-09-20T23:57:30.190546+00:00` |
| `jones:1937-1945-the-silent-years:v1` | `2026-09-20T23:57:30.347114+00:00` |
| `sanders:1956-broke-at-sixty-five:v1` | `2026-09-20T23:57:30.45451+00:00` |
| `simone:1950-1954-curtis-no-to-the-bar:v1` | `2026-09-20T23:57:30.545528+00:00` |
| `sullivan_a:1880-1886-almshouse-to-valedictorian:v1` | `2026-09-20T23:57:30.619696+00:00` |
| `tallchief:1942-1947-the-name-stays:v1` | `2026-09-20T23:57:30.690911+00:00` |
| `wilson:1934-1935-rock-bottom-to-the-fellowship:v1` | `2026-09-20T23:57:30.758299+00:00` |
| `yeats:1889-1893-the-no-and-the-poems:v1` | `2026-09-20T23:57:30.870691+00:00` |

1. A fresh audit verified the existing 24 historical publications and no
   quarantined rows. The configured Supabase host was bound to the established
   production project before writes.
2. An editorial-only backup at `2026-09-20T23:52:44.961Z` captured the full
   StorySpec rows and matching stages for all 26 scoped figures, plus the entire
   existing 24-story published catalog/stages. Its independently recomputed,
   decompressed SHA-256 is
   `9b920b107456a2e1c172ec87fef16b0f397dea25360034bd86955843120c0b90`.
   It contains no reader/account data or credentials.
3. All ten dry-runs passed without warning waivers. The existing
   `scripts/drafts/promote-candidate.ts` moved only these exact candidates to
   review with the owner's review metadata. Full readback equalled the frozen
   candidates except for lifecycle status and actual review metadata.
4. The complete successful review audit finished at
   `2026-09-20T23:55:27.380Z`; its receipt was persisted before publication, SHA-256
   `2a46b9b3c12a1bb6fd1cfa4aa8b674393d43eb37a3e983d8e6f95f69eb7f235b`.
   A bounded, independently reviewed local runner pinned that receipt, the
   review index, backup and exact ten identities. It checked every current
   review row before the first write, then passed each **receipt-bound complete
   document** to the existing `promote_story_spec_v2` RPC. It did not substitute
   a fresh reread as approval. Promotions were sequential, atomic per story,
   not a batch transaction; no retries or alternate mutation path ran.
5. At `2026-09-20T23:57:37.024Z`, a full post-publication audit proved
   **34 valid historical publications, zero quarantine**, all ten complete
   reviewed documents preserved apart from status, all sixteen held
   StorySpecs/stages unchanged, all 24 prior publications/stages unchanged,
   and no changes to matching content. Publication times were validated.
   The full local audit receipt SHA-256 is
   `2fa1d9dfe85ac0dc559bd006c7c71084c2a7a32a7db219fc04418fb206963e52`.

### Readiness qualification

The first unmodified local `npm run check-db` stopped because `.env.local`
does not contain `TELEMETRY_ID_SECRET`. No deployed or local environment
configuration was changed. For the read-only readiness probe only, a dedicated
random telemetry key was supplied in that one process's environment. All
**22 checks passed before publication at 24 stories and afterward at 34**.
This does **not** verify the deployed telemetry secret or its value. The probe
checks database health and closed/nonexistent-owner boundaries; it does not
write reader data. Live route verification remains a separate check below.

Hermetic recipe governance, registry (six assertions), and deployment checks
passed. The frozen-packet checker passed all 26 candidate pins, the 28 unchanged
earlier snapshots, exact 9/9/8 reading copies, cross-review hashes and structural
receipts. The primary/rollback recipe selection remained unchanged.

Independent agents checked eligibility, the audit and publication runner, and
the prepared bounded public-reader canary. Local backup and full review/audit
receipts remain in ignored `.codex-recovery`; no service keys, cookies, reader
disclosures or account/session identifiers are committed.

## Worker refresh and live reader verification

**Pending at this commit.** Database publication is complete. A normal release
PR merge and successful Production deployment after the ten publication times
must refresh the load-once matching-stage cache. The bounded canary will then
sample Butler, Coleman, Sanders and Yeats using existing, unmodified adult
evaluation fixtures and ordinary reader/progress routes. Ten-of-ten database
verification must not be described as ten-of-ten public matching verification.

## Remaining holds and rollback

The sixteen unpublished holds are Berlin, Carver, Christie, Coltrane, Lamarr,
Lee, Edmonia Lewis, Lindgren, McClintock, Owens, Poitier, Rachmaninoff, Rogers,
Rudolph, Rustin and Wang. Their original source/matching/episode qualifications
remain, with Christie's additional integration hold recorded separately.

No reseed, migration, matching rewrite, library/provider configuration change
or recipe promotion ran. This release did not modify 牛大 or existing saved
reader artifacts; the editorial audit does not compare those tables.
If withdrawal is needed, retire only the exact affected StorySpec ID through
the audited retirement command. Never overwrite/demote immutable published
rows or restore draft backups over them; existing reader artifacts keep their
pinned versions.

Release changes use focused commits authored and committed as
`taizhenC <tzhcheung@gmail.com>`, without co-author trailers. GitHub records its
normal server-side merge commits.
