# Wave 4 — nine researched drafts for reading review

September 19, 2026. This is an editorial packet, **not a production release**.
It contains nine evidence-mapped drafts and independent source/craft checks.
Four have bounded arcs for the owner's reading decision. Five retain blocking
source or story-shape gaps; seven labeled passages do not make those five
complete, publishable stories.

[Read all nine drafts](READING-COPY.md). The 63 passages total 4,945 words.
Every passage is copied exactly from its candidate JSON, including paragraph
breaks. The [SHA-256 manifest](candidate-sha256.json) pins the final candidate
bytes. All remain version 1, `status: "draft"`, `review: {}`. No earlier owner
approval or validator simulation has been reused as approval of these texts.

## Content decisions

| Story | What the draft supports | Current decision |
|---|---|---|
| Hedy Lamarr | Urgent patent paperwork, a signature defect, correction and eventual grant. | HOLD: contemporary documents do not establish her personal low or situated encounters with those documents. Not the seeded beauty-based dismissal story. |
| Frances Glessner Lee | A family death, support for teaching, and a later library dedication. | HOLD: chair dates conflict; early low, response and failed effort are missing. The 1934 consequence also falls outside the provisional 1929–1931 metadata. |
| C. S. Lewis | Grief notebooks, unsuccessful efforts to remember and talk, temporary morning relief, and later recurrence. | For reading: 696 words; the notebook anchor remains qualified. Independent review corrected an unsupported same-day inference. No lasting recovery is claimed. |
| Edmonia Lewis | Accusation, defense, injury, dismissal and later requests for artistic criticism. | HOLD: memoir dates conflict with institutional chronology; waiting and denial do not supply the missing situated early response. No court record resolves the conflict. |
| Astrid Lindgren | Separate households, study and work, a remembered difficult reunion and further family care. | HOLD: most practical chronology is estate narration; primary moments and a failed-effort sequence remain missing. A 362-word evidence-limited draft, not a completed long-form story. |
| Barry Marshall | A rejected paper, seeking a colleague, remembered encouragement and subsequent practical help. | For reading: 596 words. The turn is support in the conversation, not instantly completed travel arrangements or scientific vindication. The later risky experiment is not an instruction or proof of an ulcer. |
| Barbara McClintock | A specific scientific disagreement, continued explanation and an invitation to discuss a question. | HOLD: original records, endpoint date, personal low/response, failed effort and subsequent change remain insufficient. No universal-rejection or Nobel-vindication plot. |
| Florence Nightingale | A letter explaining bodily limits, delayed reform work, a specific drafting task and continuing illness. | For reading: 693 words. A narrow correction attributes rhetorical explanations to her, not an unrecorded claim by her doctor. Work does not cure her. |
| Flannery O'Connor | Hospital uncertainty, asking a friend for sympathy, further revisions and a publication threshold. | For reading: 646 words. Humor need not conceal invented despair; the photograph exchange is remembered testimony, not an emotional transformation. Repetition remains a reading qualification. |

All nine are below the soft 700–950-word aim. Shortness alone is not a
rejection criterion, but this packet does not claim the target reading
duration. No padding or invented scene was added to reach it. Mechanical
validity, source support, reading quality, matching suitability and human
approval remain separate decisions. No recipe requirement was changed.

## Research and independent review

Three author groups worked in parallel, then each checked another group's
work. The research skill required primary-source work, bounded locators and
an explicit record of unavailable evidence. Seeded prose was a lead, never
proof. Contemporary documents, later memories, institutional chronology and
uninspected originals are distinguished in the reports.

| Group | Research | Independent review and corrected-hash checks |
|---|---|---|
| Lamarr / Lee / C. S. Lewis | [A](research/WAVE-4-A-RESEARCH.md) | [Reviewed by C](research/WAVE-4-CROSS-REVIEW-A.md) |
| Edmonia Lewis / Lindgren / Marshall | [B](research/WAVE-4-B-RESEARCH.md) | [Reviewed by A](research/WAVE-4-CROSS-REVIEW-B.md) |
| McClintock / Nightingale / O'Connor | [C](research/WAVE-4-C-RESEARCH.md) | [Reviewed by B](research/WAVE-4-CROSS-REVIEW-C.md) |

Earlier hashes in findings and commits preserve provenance; the final
manifest and explicit rechecks identify the current texts. The root read
all final prose and spot-checked primary passages, including the Lewis
notebooks, Nightingale letters, Langston memoir, Marshall interview and
Giroux's publication account. These are agent checks, not human approval.

## Matching and publication boundary

Every candidate differs from its installed matching age range:

| Figure | Installed ages | Candidate ages |
|---|---:|---:|
| Lamarr | 25–28 | 27 |
| Lee | 50–54 | 50–53, provisional |
| C. S. Lewis | 60–62 | 61–62 |
| Edmonia Lewis | 17–21 | 17–20, approximate and date-conflicted |
| Lindgren | 18–22 | 19–22 |
| Marshall | 31–34 | 30–33 |
| McClintock | 48–55 | 58–62, provisional |
| Nightingale | 36–40 | 37 |
| O'Connor | 25–33 | 25–27 |

The reports explain episode/focus changes. McClintock's later correspondence
and Lamarr's administrative episode are especially material mismatches.
Envelope dates are not automatically attested event days. Lee and Edmonia's
unresolved chronology must not be treated as settled metadata.

No matching/library, recipe, schema, runtime, earlier snapshot, saved reader
artifact or 牛大 content changed. No production data was read or written.
Nine older held stages remain unchanged; fourteen later stages remain queued.
The last recorded production audit remains September 15, not a new audit.

Merging this packet does **not** publish its JSON files. Publication requires
owner reading of these exact texts, resolution of applicable source/craft and
matching decisions, and the existing snapshot-bound promotion workflow for
an eligible subset. Never blanket-seed these files or persist simulated
reviewers. A later prose change requires a new hash, exact reading copy and
review of the changed text.

## Verification

```sh
node --import tsx scripts/check-story-batch.ts docs/releases/wave-4-drafts-2026-09-19 9 --require-hashes
```

The read-only checker verifies the exact nine-file set and hashes, strict
parsing, empty saved reviews, draft and in-memory publication validation,
actual canonical composition, artifact hashing, serialized replay, sentence
means/ceilings and passage/bridge endings. All nine pass with zero errors or
warnings. A separate exact comparison verifies all 63 reading-copy passages,
their displayed hashes and word counts. CI now runs the required-hash check.

Local lint, typecheck, all 20 smoke assertions, production build, native image
runtime probe and high-severity dependency audit passed (zero vulnerabilities).
The build's automatic `tsconfig.json` change was removed. The unchanged
wave-two reviewed/rewrite, wave-three draft and Hurston repair snapshots,
plus recipe/prompt/story-quality immutability checks, passed.

The broader suite used a clean `git archive` of `3ee8939`, with the same
runtime/checker/dependency code and installed dependencies: all 47 CI script
checks and the trusted attestor self-test passed. This excludes existing
ignored recovery helpers from static scans without deleting them or weakening
the scanner. Final story hashes were checked separately after corrections.
This local verification is not a claim about a not-yet-completed GitHub run.

Git history keeps individual drafts, focused corrections, research/review
reports, reading copy, hash freeze and CI wiring separate. Every new commit
uses only `taizhenC <tzhcheung@gmail.com>` as author and committer, with no
co-author trailers.
