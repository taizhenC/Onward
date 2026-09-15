# Wave 3 — repair packet and publication boundary

September 15, 2026. **The four stories addressed here are not published.**
Five other, unchanged wave-three stories are already live: Faraday,
Fitzgerald, Graham, Hughes and Kovalevskaya. Their
[production receipt](../2026-09-15-wave-3-publication.md) records the exact
promotions, successful worker deployment and all seven live reader passages.
That production catalog contains 17 valid historical stories, zero quarantined.

The owner requested repairs and publication of Coleman, Coltrane, Hurston and
Jones. Parallel primary-source investigation and independent challenge
produced one genuine reframe. They did not establish safe repairs for the
other three under the existing recipe. Missing evidence was not replaced by
invented historical events, thoughts, dialogue or causality.

## Current decisions

| Story | Result of this repair pass | Publication boundary |
|---|---|---|
| Hurston | A new, chronological Howard-transition story removes the unsupported registration low point. The opening invitation, disclosure, still-insufficient savings/preparation, encouragement and first assembly are tied to the memoir and chronology. | New exact-text reading decision: a sparse 342-word miniature, especially the 20-word response and 32-word turn. Not yet approved or published. |
| Coleman | Reopened primary testimony supports shock, training and qualification but does not locate a particular resumed lesson or render the examination as a moment. | HOLD: no safe replacement candidate; a habitual walk cannot become the next morning after the pupil's death. |
| Coltrane | Full primary audio was accessed and locally machine-transcribed. Performance details were located, but the transcript remains unverified and does not repair the dismissal/home-rehearsal episode. | HOLD: no safe replacement candidate. Verify the new timestamps directly before considering a different performance-centered episode. |
| Jones | An additional primary essay sharpens the refusal and poem submission. Unmet feedback expectations could supply the struggle, but the refusal encounter still lacks an attested inward low point. | HOLD: no safe replacement candidate; habitual shame cannot be assigned to that encounter, and no failed practice, teacher trick or instant cure is fabricated. |

## New exact text

[Read Hurston's revised story](READING-COPY.md), including its content note and
the disclosed episode/matching distinction. The candidate remains version 1,
`status: "draft"`, `review: {}`. The
[manifest](candidate-sha256.json) binds its exact bytes to SHA-256
`c29d7856a483ff106cfb0f2ad45f0851c8176b4d08dc020a0931f4f396ade51e`.
The same unpublished StorySpec identity is retained. The original nine-story
packet and its original Hurston hash are preserved unchanged.

The narrower 1917–19 / ages 26–28 narrative and changed emphasis are disclosed;
the installed matching stage still has ages 26–30. No figure-library or
matching correction is included. Such changes need a separate evaluated
release, not an incidental content promotion. A story-only decision must
also consider the disclosed emphasis before any new approval is recorded.

## Evidence and independent challenge

- [Hurston investigation and final corrections](research/HURSTON-REPAIR.md).
- [Independent recheck at the frozen Hurston hash](research/HURSTON-INDEPENDENT-REVIEW.md).
- [Coleman and Coltrane source findings, including unverified audio leads](research/COLEMAN-COLTRANE-REPAIR.md).
- [Jones investigation and independent Hurston outline challenge](research/JONES-REPAIR.md).

The audio investigation used an isolated local environment without repository
dependency changes or paid services. Machine transcripts are locating aids,
not verified quotations or publication evidence. Source-access limits and
unobtained originals remain explicit in the reports. These are bounded
findings about inspected sources, not a claim that no other record exists.

## Verification and release safety

```sh
node --import tsx scripts/check-story-batch.ts docs/releases/wave-3-repairs-2026-09-15 1 --require-hashes
node --import tsx scripts/check-story-batch.ts docs/releases/wave-3-drafts-2026-09-14 9 --require-hashes
```

The first command checks the single new snapshot: exact file/hash inventory,
empty reviews, strict parsing, draft and in-memory publication validation,
canonical composition, artifact hash and serialized replay, sentence and
ending constraints. It does not publish, call a provider or access a database.
The second protects the unchanged original nine candidates. The reading copy
is compared exactly with all seven canonical passages, including the bridge's
paragraph break. Mechanical success and agent review are not human approval.
Both required-hash checks, the exact reading-copy comparison, local lint,
typecheck and `git diff --check` passed for this packet.

Merging this packet cannot publish these drafts. No publication metadata is
fabricated for them; no recipe, matching data, runtime, schema, earlier-wave
snapshot, reader artifact or 牛大 content is changed. The new reading copy
needs the owner's decision before its normal snapshot-bound promotion. The
three remaining source holds need further evidence or an explicit new-episode
decision before a new candidate can be offered for review.

Focused commits use only `taizhenC <tzhcheung@gmail.com>` as author and
committer, with no co-author trailers.
