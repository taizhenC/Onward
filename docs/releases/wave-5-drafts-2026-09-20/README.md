# Wave 5 — 9 researched drafts for owner review

20 September 2026 UTC. This is an editorial packet, **not a production release**.
Mary Shelley has a supported complete letter-led arc for the owner's reading decision. The other eight remain source/craft HOLDs and are not completed stories.
The request to finish the remaining stories is not fully achieved while these
gaps remain. They were not padded or silently moved to unrelated episodes.

[Read the exact drafts](READING-COPY.md) · [All 28 remaining stages](../remaining-story-review-2026-09-20/README.md)

The 63 passages total 3,957 words. The [SHA-256 manifest](candidate-sha256.json)
pins the candidate bytes. Every candidate is version 1, `status: "draft"`,
`review: {}`. No prior review, agent check or validator simulation is owner approval.

## Reading decisions

| Story | Words | Decision |
|---|---:|---|
| [Jesse Owens](READING-COPY.md#jesse-owens) | 462 | HOLD: incompatible retrospective accounts, uncertain chronology and incomplete situated low/response. |
| [Sidney Poitier](READING-COPY.md#sidney-poitier) | 572 | HOLD: conflicting ages, situated-moment qualification and a 1946 endpoint outside the installed 1943–1945 stage. |
| [Sergei Rachmaninoff](READING-COPY.md#sergei-rachmaninoff) | 546 | HOLD: Russian transcription/translation verification and letter-led moment/failed-return qualification. |
| [Fred Rogers](READING-COPY.md#fred-rogers) | 314 | HOLD: undated recurring childhood memories; age, ordering and a complete arc remain unestablished. |
| [Wilma Rudolph](READING-COPY.md#wilma-rudolph) | 241 | HOLD: unverified interview transcript, brace-age conflict and missing located recovery sequence. |
| [Bayard Rustin](READING-COPY.md#bayard-rustin) | 434 | HOLD: brief turnout doubt is not a demonstrated deepest low; the eventual turn needs his own situated response. |
| [Harland Sanders](READING-COPY.md#harland-sanders) | 312 | HOLD: inaccessible primary pages, undated promotion sequence and missing complete arc. |
| [Mary Shelley](READING-COPY.md#mary-shelley) | 705 | FOR OWNER READING: supported contemporary-letter arc; narrowed 1822–1823 episode and ages 25–26 differ from installed 21–25. Not yet approved. |
| [Nina Simone](READING-COPY.md#nina-simone) | 371 | HOLD: conflicting hiring accounts, missing located low/response and incomplete arc. |

The 700–950-word aim is soft, but lack of a complete supported arc is not.
Shortness is disclosed rather than hidden by added scenes, feelings or repetition.
The reading copy reproduces all prose and content notes, including limitations.

## Research and independent checks

Three authoring groups worked concurrently and checked one another's source
claims and story shape. Corrections included script attribution, own-line reveals,
unsupported clock time, conflicting memories, and reporter-versus-speaker attribution.

| Group | Author research | Independent review |
|---|---|---|
| Owens / Poitier / Rachmaninoff | [A](research/WAVE-5-A-RESEARCH.md) | [Cross-review A](research/WAVE-5-CROSS-REVIEW-A.md) |
| Rogers / Rudolph / Rustin | [B](research/WAVE-5-B-RESEARCH.md) | [Cross-review B](research/WAVE-5-CROSS-REVIEW-B.md) |
| Sanders / Shelley / Simone | [C](research/WAVE-5-C-RESEARCH.md) | [Cross-review C](research/WAVE-5-CROSS-REVIEW-C.md) |

The root read all nine drafts and independently spot-checked Shelley's September
1822 and September 1823 letters against the public-domain transcription. That
checks the limited financial relief and continuing grief; it does not certify
original-manuscript inspection. Earlier hashes in correction history are not
current approval targets.

The [final register recheck](research/WAVE-5-FINAL-REGISTER-CHECK.md) binds the
later literal wording corrections to current hashes. It also verifies all
fourteen new candidates against their exact reading copies and manifests.

## Matching boundary

Candidate ages differ from the installed library for Owens (24–27 versus
23–27), Poitier (15–19 versus 16–18), Rachmaninoff (27–28 versus 23–28), Rudolph
(5–13 versus 8–16), Rustin (51 versus 48–54), Sanders (65–66 versus 62–66),
Shelley (25–26 versus 21–25), and Simone (18–21 versus 17–21). Rogers retains
8–13 provisionally, not as verified dating of every memory. Poitier's professional
job reaches 1946 outside the installed stage label. Owens and Rachmaninoff shift
the focus within their installed periods; Shelley narrows to widowhood/support.
Sanders's undated promotional episodes cannot yet be certified for 1956.

No figure-library or matching edit is bundled here. Date and age qualifiers
require a separate evaluated matching decision before promotion. No recipe,
schema, runtime, earlier snapshot, 牛大 content or saved reader artifact changed.
No production or provider operation was performed.

## Verification and publication boundary

```sh
node --import tsx scripts/check-story-batch.ts docs/releases/wave-5-drafts-2026-09-20 9 --require-hashes
```

The check covers exact hashes, strict structure, empty review objects, both
validation modes, actual canonical composition, artifact validation, serialized
replay and sentence rhythm. It does **not** establish historical accuracy,
complete storytelling, matching suitability or human approval.

Merging the packet does not publish its JSON. Publication requires owner reading
of eligible exact texts, resolution of the source/craft and matching decisions,
and the existing snapshot-bound promotion workflow. Never blanket-seed this
packet or save simulated reviewer identities. Changed prose needs a new hash and
new reading review. No merging or publication is requested by this handoff.
