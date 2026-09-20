# Remaining eligible stories — publication, 20 September 2026

## Scope and owner decision

The owner said, “I already review all the story now lets publish all those story,”
after receiving the [28-story review index](remaining-story-review-2026-09-20/README.md)
and its exact reading copies. This release applies that approval only to the two
source-supported eligible texts: Mary Shelley and the new Charlotte Brontë repair.
It does not turn the other 26 evidence/craft holds into publishable stories.
The owner is recorded as `taizhenC` for the review roles; this is one owner's
review, not a claim of three independent human reviewers.

The disclosed qualifications remain: Shelley is 705 words, narrows the episode
to 1822–1823 at ages 25–26 versus installed matching ages 21–25; Brontë is a
461-word short form at age 31 versus matching ages 28–31, with a retrospective
letter-opening encounter whose exact room/day are unknown. The dated letters
and later memory remain distinguished. No matching age, episode, source,
content profile, canonical prose, recipe, schema, or library was silently changed.
Frozen draft notes and empty review objects remain provenance snapshots, not
current production status.

| Story | Exact frozen candidate SHA-256 | Database publication time (UTC) |
|---|---|---|
| [Mary Shelley](wave-5-drafts-2026-09-20/shelley_m-1818-1823-the-losses-v1.candidate.json) | `fb3e996c03f1a9bed101b22a8bffae515b75e7aeef36343c64dfb21306d2f4c8` | `2026-09-20T07:44:08.064941+00:00` |
| [Charlotte Brontë — new repair](remaining-story-review-2026-09-20/held-repairs/bronte_c-1846-1847-two-copies-v1.candidate.json) | `680159c859a3019dd486a5c246956559650447b1a46e1a8380b7d3f6d8cb8b56` | `2026-09-20T07:44:08.673387+00:00` |

The older wave-two Brontë draft was not published. Her unchanged StorySpec ID
is `bronte_c:1846-1847-two-copies:v1`; Shelley's is
`shelley_m:1818-1823-the-losses:v1`. Neither had a published predecessor.

## Audited database publication

1. [PR #135](https://github.com/taizhenC/Onward/pull/135) merged at
   `3cdf186bacee803452db3b6187805fa3d945d34e`. Its exact reviewed head was
   `b88d08b29d56ad97baaf032de9847688affb0eac`; all applicable PR checks passed.
   Production deployment `6550419577` for the merge succeeded at
   `2026-09-20T07:43:15Z`, before this database publication.
2. Fresh readiness passed all 22 checks, with 22 valid historical publications
   and zero quarantined rows. The target host matched the established production
   Supabase project. No reseed, migration, provider change or recipe promotion ran.
3. An editorial-only backup was captured at `2026-09-20T07:42:46.899Z`.
   It includes every row/stage for all 28 remaining figures and the entire
   prior published catalog/stages. Its decompressed SHA-256 is
   `7f3c034dd34963e43bc2738fe33866e2f51fd1d6fe72e57ff268807a34e53175`.
   That independently observed digest and the exact prior 22 identities were
   pinned in the read-only audit. This is not a reader/account backup.
4. Both promotion dry-runs passed without warning waivers. The existing
   `scripts/drafts/promote-candidate.ts` staged only these two as review,
   signed by the owner. Complete database readback equalled the frozen
   candidates except for status and actual review metadata.
5. The successful pre-publication review receipt was persisted before either
   promotion, then pinned at SHA-256
   `dc20df3a234e6c170afc829ae6ea3a12dec03b1151691e377fe8f0a690b213b5`.
   Existing `scripts/set-story-spec-status.ts publish` calls ran sequentially,
   through `promote_story_spec_v2` with the complete expected reviewed document.
   Each promotion is atomic; the two-story batch is not one transaction.
6. At `2026-09-20T07:44:11.784Z`, the post-publication audit proved exactly
   **24 valid publications, zero quarantines**, both complete reviewed snapshots
   preserved, all 22 prior publications/stages unchanged, all 26 held
   StorySpecs/stages unchanged and still draft, and unchanged matching content.
   Receipt SHA-256:
   `31eb4ec32f75f8d8c37118f743ad0d50e200a309978e2de5a0dd27eba4e80df1`.
   All 22 readiness checks passed again at 24 publications. Recipe governance,
   registry and deployment checks also passed.

Independent agents checked exact reading-copy equality (14/14 passages),
candidate hashes, the adapted audit and the bounded reader canary. Audit review
caught two baseline-binding gaps before publication; the helper now pins the
backup and exact previous publication identities, rather than trusting a mutable
sidecar alone.

Local audit/backup/review receipts stay in ignored `.codex-recovery`; no
credentials, reader disclosures, cookies, user/session IDs or service keys are
included in this release record.

## Worker refresh and live reader verification

**Pending at this record's initial commit.** The database publication is complete,
but the matching-stage cache is load-once per worker. A new successful Production
deployment after promotion must refresh workers, then the bounded guest canary
must verify both full stories. This document will record observed results, not
assume that a merge or healthy database proves live reader completion.

The prepared canary uses the existing evaluation fixtures (Shelley age 24,
Brontë age 30), without changing matching or claiming those ages equal the
narrowed prose episodes. It permits two initial matches, at most one token-bound
clarification and one adjacent acceptance per story, checks all seven canonical
passages and acknowledgements, and deletes its exact new anonymous guest through
the ordinary owner-confirmed CSRF route. It does not use the operator's account
or bypass rate limits. Its scope is normal reader/progress and normalized prose,
not a new visual, fresh-intake Auth-bootstrap or recipe-metadata audit.

## Rollback and remaining holds

If either new publication needs withdrawal, use the audited retirement command
for its exact StorySpec ID. Do not overwrite/demote published rows, restore the
draft backup over immutable records, or weaken the publication boundary.
Previously created reader artifacts retain their pinned versions.

All **26** documented source/craft holds remain unpublished. Human reading does
not supply an undocumented event or repair a conflicting chronology. The
[original review index](remaining-story-review-2026-09-20/README.md) and its
linked research decisions retain the next evidence needed for each story.
牛大, existing published texts and saved reader artifacts are unchanged.

The draft work used 50 focused commits. New release changes also use small
focused commits authored and committed as `taizhenC <tzhcheung@gmail.com>`,
without co-author trailers; GitHub records its normal server-side merge commits.
