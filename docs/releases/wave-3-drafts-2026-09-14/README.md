# Wave 3 — nine researched drafts for reading review

September 14, 2026. This is an editorial packet, **not a production release**.
It contains nine new seven-passage drafts, independent source/craft reviews,
and the focused corrections those reviews produced. Four stories still have
explicit blocking craft gaps. The other five have supported local arcs for
the owner's reading decision, with the qualifications below; they do not
receive blanket recipe or publication clearance.

[Read all nine stories](READING-COPY.md). The 63 passages total 4,764 words.
Every passage is copied exactly from its candidate JSON. Those files also
contain fact atoms, bounded source locators, sentence evidence, and source
qualifications. The [SHA-256 manifest](candidate-sha256.json) freezes the exact
candidate bytes. All nine remain `status: "draft"`, version 1, `review: {}`.
No earlier review or validator simulation has been reused as human approval.

## Content decisions

| Story | What this draft actually tells | Current content decision |
|---|---|---|
| Bessie Coleman | Training abroad, a witnessed pupil death, qualification and the return-home interview. | HOLD: continued training is not a located next lesson; the exam remains a summary. The low point is too thin to expand without invention. |
| John Coltrane | Job loss, learning with another musician, club work and a recording session. | HOLD: the dismissal lacks a situated, attested inner response; the response still compresses repeated visits. No withdrawal scene or permanent cure is invented. |
| Michael Faraday | Homesick letters, postage arrangements, language study and limited relief from unwanted duties. | For reading review: independent source/craft check found no further load-bearing correction. Quiet epistolary arc, 680 words; it does not make mistreatment the cause of later greatness. |
| Ella Fitzgerald | A stalled amateur act, singing instead, further auditions and her first band job. | Short-form reading decision: the concrete defects were repaired, but this is a 365-word miniature, not the target four-to-five-minute experience. Undated touring/card-playing details were removed. |
| Katharine Graham | A first-year family rehearsal, continuing difficulty speaking, and a tentative management hire. | For reading review: 496 words; no conflation with later bedroom rehearsals or instant confidence. The lunch and later appointment stay separate. |
| Langston Hughes | Laundry work, helping his mother find rooms, failed saving, a tuition request and a scholarship. | Qualified reading decision: 539 words, with a routine opening and a low point carried chiefly by his mother's distress and family pressure. These limits remain visible; his immediate thoughts are not invented. |
| Zora Neale Hurston | Night classes, registration, paid work, a classroom friendship and further preparatory study. | HOLD: the opening and response were repaired, but the source gives anticipated fear at registration, not the full inside-the-low-point moment this shape requires. |
| James Earl Jones | School accommodations, speech difficulties, poetry and an uncomfortable classroom recital. | HOLD: recurring childhood memories do not supply located opening moments or an intervening sustained failed effort. No happiness, teacher trick or instant cure is manufactured. |
| Sofia Kovalevskaya | Leaving home to study, the anxious staircase/study encounter, private mathematics lessons and a doctorate. | For reading review: the original moment/compression HOLD was cleared at the revised hash. Reported memories remain qualified; the ending retains exhaustion. 568 words. |

All nine are below the soft 700–950-word aim. Shortness alone is not a
rejection criterion, but shorter text is not silently represented as meeting
that reading-duration target. Mechanical validity, historical support,
reading quality, matching suitability and human approval are distinct.
The recipe itself has not been changed or waived by this packet.

## Research and independent review

Three author groups worked in parallel, then reviewed another group's work.
The research skill kept primary material, exact source locations and missing
evidence central to the revisions. Seeded prose was a research lead, not proof.
Contemporary letters and recording records are distinguished from later
memoirs, interviews, institutional summaries and uninspected originals.

| Group | Author source findings | Independent review, including corrected-hash rechecks |
|---|---|---|
| Coleman / Coltrane / Faraday | [Research A](research/WAVE-3-A-RESEARCH-2026-09-14.md) | [Reviewed by C](research/WAVE-3-CROSS-REVIEW-A-2026-09-14.md) |
| Fitzgerald / Graham / Hughes | [Research B](research/WAVE-3-B-RESEARCH-2026-09-14.md) | [Reviewed by A](research/WAVE-3-CROSS-REVIEW-B-2026-09-14.md) |
| Hurston / Jones / Kovalevskaya | [Research C](research/WAVE-3-C-RESEARCH-2026-09-14.md) | [Reviewed by B](research/WAVE-3-CROSS-REVIEW-C-2026-09-14.md) |

The reports preserve original findings and then bind rechecks to revised
hashes. Their early tables are historical inputs, not the current manifest.
Agent findings are not identities permitted to approve production content.
The root also spot-checked primary passages and read all final prose.

## Matching and publication boundary

Several narratives narrow or change the emphasis of their legacy matching
stages. In particular, Hughes is not a father's engineering bargain, Graham
does not reach the 1971 publishing decision, and Coltrane does not affirm a
withdrawal-and-cure plot. Six candidates differ from the installed stage's
age range; Coltrane, Jones and Kovalevskaya retain it. The reports identify exact ranges
and conflicting dates. Editorial envelope dates are not attested event days.

No library, matching text, recipe, schema, provider configuration, saved
reader artifact, earlier-wave snapshot or 牛大 content was changed. No
production data was read or written for this wave. The previous six held
wave-two rewrites remain held; the next 23 historical stages remain queued.

Merging this packet does **not** publish its JSON files. Publication still
requires a review of these exact texts, resolution of each applicable
source/craft/matching decision, and the established snapshot-bound promotion
workflow for an eligible subset. Do not run blanket seeding or persist the
validator's simulated review fields. Any further prose change needs a new
hash, reading-copy refresh and review of that change.

## Verification

```sh
node --import tsx scripts/check-story-batch.ts docs/releases/wave-3-drafts-2026-09-14 9 --require-hashes
npm run check-wave-2-reviewed
node --import tsx scripts/check-story-batch.ts docs/releases/wave-2-rewritten-2026-09-10 6 --require-hashes
npm run lint
npm run typecheck
```

The read-only batch check verifies the exact nine-file set and hashes, strict
parsing, empty saved reviews, draft and in-memory publication validation,
actual canonical composition, artifact content hashing, serialized replay,
sentence means/ceilings, and passage/bridge ending constraints. All nine pass
with zero errors/warnings. It uses no provider or database. A separate exact
comparison verified all 63 reading-copy passages and their displayed hashes.
CI runs the required-hash check without granting publication authority.
Four reading-copy paragraph endings retain spaces present in the frozen
canonical text; `git diff --check` reports those whitespace warnings. They
were not silently trimmed after the exact-copy/hash review.

Local lint, typecheck, all 20 smoke assertions, the production build, native
image runtime probe, high-severity dependency audit (zero vulnerabilities),
and recipe/prompt/story-quality immutability checks passed. The unchanged
earlier-wave snapshots passed too. The build's automatic `tsconfig.json`
rewrite was removed; no configuration change is included.

The broader suite initially failed in this working directory because the
existing static scanner also traverses an ignored local recovery helper,
`.codex-recovery/verify-publication-artifacts.ts`. That helper and the scanner
are unchanged by this wave. A clean `git archive` of committed source
(`ac11ccb`, same runtime/checker/dependency code as this final packet), using
the same installed dependencies, passed all 47 CI script checks and the
trusted attestor self-test. The final nine-story hash check was rerun after
the content corrections. The diagnosis did not require deleting recovery
files or weakening the privacy check. This distinguishes local scratch-file
contamination from the committed PR; it is not a claim that the original
working-directory scan now passes.

Git history intentionally keeps each initial story, each story correction,
source reports, reading copy, hash freeze and CI wiring in focused commits.
Every new commit uses only `taizhenC <tzhcheung@gmail.com>` as both author and
committer, without co-author trailers.
