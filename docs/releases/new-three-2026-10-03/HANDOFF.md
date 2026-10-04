# Three-story draft handoff — October 3, 2026

This document preserves the draft checkpoint. The owner's later review and explicit merge/publication direction are recorded in [the separate exact-three authorization](OWNER-AUTHORIZATION.md). That decision preserves the failed matching evidence and supersedes the pending-owner hold below for these unchanged three texts. Publication and deployment execution receive separate receipts.

Benjamin Franklin, Joshua Slocum and Mary Somerville are researched, written and independently checked. Their exact three StorySpecs and stages were inserted into the production database as drafts. Publication is held by matching failures and pending owner review.

## Reading and evidence

- [Complete reading packet](READING-PACKET.md): 2,321 words, 21 passages and 74 actual reader chunks. SHA-256 `475c81587af5559164e9abc810127a213e8edd0527076d7bbf4a882ffde87e1b`.
- [Frozen input manifest](INPUTS.json), [reading pin](READING-PACKET-PIN.json), [final 33-check integrity audit](FINAL-PACKET-AUDIT.md).
- Individual research and completion documents: [Franklin](franklin_b.md), [Slocum](slocum_j.md), [Somerville](somerville_m.md). Exact source locators, claim maps and prior correction receipts are preserved.
- Slocum's practical doubt is qualified; no despair or failed repair is invented. Somerville's turning passage has 129 words against an approximate 130-word target. Late-life adversity appears as separately sourced context in the actual source fold. These qualifications are disclosed in the frozen reading packet.

## Production database

[The import receipt](DATABASE-RECEIPT.json) records figures/stages/StorySpecs changing from 60/60/61 to 63/63/64. All original rows, review metadata and lifecycle timestamps were preserved. All three new specs remain `draft`, with empty reviews and null publication timestamps. The existing 44 published stories are unchanged.

[The subsequent read-only health check](DATABASE-HEALTH.md) passed all 22 checks. Its caller-only temporary probe secret establishes the catalog/schema/RPC checks described there, rather than deployment-secret configuration or a new live reader canary. No new reader account or saved story was created by this batch.

## Verification and release boundary

[The final local CI receipt](CI-2026-10-04T00-53-38-461Z.json) records 67/67 passing checks, including build, dependency audit, protected-base immutability, recipe governance, existing story snapshots and the actual new-three parser/composer/chunk/rhythm/replay checks. It binds source commit `082948bb8d69dbef70fcfe22cbb4821c94df7857`; later handoff changes add receipts and documentation. CI now checks the three drafts offline.

[The real matching check](MATCHING-RESULT.md) remains failed: 96/101 positive matches, three wrong definitive matches, and 3/3 miss controls. The supplemental twelve-case run stopped at preflight when five positive cases lost their expected story; it made zero provider calls, so its rerank accuracy is unmeasured. [The independent comparison](FAILURE-AUDIT.md) found no bounded story-source defect. [The deterministic reproduction](REPRO-RETRIEVAL.md) preserves the missing shortlist signal and explicitly remains red.

The final branch's runtime library is the exact approved 60-stage snapshot `bb27964f0d5347deba75b20bd33c59ecba4289a6a95f9618b891fefbda020061`. The proposed 63-stage snapshot survives at commit `df19fecee5aafafd57a7f349380a294522c80b44`, together with its frozen stage inputs and failed evidence. No new figure-library release, recipe promotion or selector change was recorded. Passing CI is a draft-handoff result; the failed real gate still holds the release.

## Owner review and continuation

The next human step is reviewing the exact reading packet and its disclosed qualifications. [The repository handoff rule](../../story-first-batches.md#per-set-handoff) says: “Obtain the owner's review before recording approval or publishing a set.” No owner approval has been recorded for these three texts.

[The figure-library release rule](../../DEPLOYING.md#figure-library-releases) says: “If the trust gate failed, the content cannot ship.” The earlier exception is bound to the exact ten-story release. Further evaluated matching work must clear the regression and supplemental coverage gates before normal publication, deployment refresh and complete live reader verification. The preserved draft import does not authorize those publication operations.
