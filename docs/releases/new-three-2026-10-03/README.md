# Three new source-led stories

[Read the complete three-story packet](READING-PACKET.md). Total 2321 words, seven passages per story. Exact current inputs are in [INPUTS.json](INPUTS.json); [the packet pin](READING-PACKET-PIN.json) fixes the owner reading copy.

| Figure | Episode | Words | Completion |
|---|---|---:|---|
| Benjamin Franklin | 21-22 | 781 | [Research and writing](./franklin_b.md) |
| Joshua Slocum | 47-51 | 774 | [Research and writing](./slocum_j.md) |
| Mary Somerville | 46-50 | 766 | [Research and writing](./somerville_m.md) |

Independent source and complete-story checks resolved chronology, actor, fold and retrieval-metadata issues. See [Franklin](CROSS-REVIEW-FRANKLIN-FINAL.md), [Somerville](CROSS-REVIEW-SOMERVILLE-FINAL.md), and [Slocum](CROSS-REVIEW-SLOCUM-FINAL.md) with its [final metadata extension](CROSS-REVIEW-SLOCUM-METADATA.md). Current-main strict validation, publication-shape simulation, canonical composition, sentence rhythm, full-sentence reading chunks, stage parity and serialized replay pass with zero warnings. The saved candidates remain draft with empty review objects; simulations stay in memory.

The [draft importer audit](DRAFT-IMPORT-FINAL-AUDIT.md) passed 43 offline preservation and recovery probes. Prior failed and intermediate review evidence is retained and marked by its original hashes. [The completion plan](PLAN.md) records the matching, owner-review and production gates. The earlier ten-story owner exception applies only to that release.

The later matching and database phase receipts are recorded separately as actual operations complete. Credentials, account or reader data, raw provider dumps and complete database baselines remain in ignored local working storage.

## Database draft import

The exact three drafts were inserted on October 4 at 00:33:27 UTC (October 3 local). Full readbacks matched the frozen inputs. Figures/stages/StorySpecs changed from 60/60/61 to 63/63/64. All prior rows and StorySpec lifecycle timestamps were preserved; 44 published stories remain unchanged. [Import record](DATABASE-IMPORT.md), [machine receipt](DATABASE-RECEIPT.json).

Somerville's final global source-label clarification is pinned by the [last independent extension](CROSS-REVIEW-SOMERVILLE-SOURCE-LABEL-FINAL.md); it changes no prose or stage content.

## Matching and publication hold

The [actual matching checks](MATCHING-RESULT.md) hold the 63-stage proposal: the real 104-case gate produced 96/101 correct positive matches and three wrong definitive matches. The frozen 12-case coverage attempt stopped before provider calls because five positive cases lost their expected story at shortlist preflight. Supplemental rerank accuracy remains unmeasured.

The final draft branch restores `lib/figures-data.ts` to the approved 60-stage bytes, SHA-256 `bb27964f0d5347deba75b20bd33c59ecba4289a6a95f9618b891fefbda020061`. Proposal commit `df19fecee5aafafd57a7f349380a294522c80b44`, the three frozen stage inputs and failed real evidence remain preserved. No library-release entry, matching-recipe promotion or selector change was made. The new synthetic dataset is registered for future evaluated work.

The earlier [67-step local CI pass](CI-2026-10-04T00-35-29-450Z.json) applies to draft commit `6b9816b40405ad0875239453225827a244440b38` with the approved library. CI now also verifies these exact editorial drafts offline. That machine check cannot clear the failed real matching gate.

The owner has not reviewed or approved these three texts. [The per-set handoff](../../story-first-batches.md#per-set-handoff) requires: “Obtain the owner's review before recording approval or publishing a set.” [Figure-library release rules](../../DEPLOYING.md#figure-library-releases) require a passing real gate. All three new database StorySpecs stay `draft`, with empty review objects and null publication timestamps.

## Completed draft verification

All [67 final local CI checks passed](CI-2026-10-04T00-53-38-461Z.json) on the restored-library source commit `082948bb8d69dbef70fcfe22cbb4821c94df7857`. [The final handoff](HANDOFF.md) connects research, writing, independent review, database preservation, CI and the remaining release gates. [The failure audit](FAILURE-AUDIT.md) and [offline retrieval reproduction](REPRO-RETRIEVAL.md) retain the measured failures; no matching fix or passing real release gate is claimed.
