# Matching release checks — three-story proposal

These results preserve the original failed gate and publication hold. The owner's subsequent [exact-three release authorization](OWNER-AUTHORIZATION.md) directs publication of the unchanged reviewed texts after this disclosure. It does not change any metric, threshold, gold label, prompt or matching result below.

The proposed 63-stage library is held. The original real-provider regression gate failed, and the supplemental coverage run stopped at shortlist preflight. Neither result authorizes a figure-library release or story publication.

## Original 104-case regression run

- Evaluated committed proposal `df19fecee5aafafd57a7f349380a294522c80b44`, library SHA-256 `1a33b7b45b48bc054f0eb0d1504bfd7ac312a07f41f678ff032acfa9e97eaa90`.
- Actual run: October 4, 2026, 00:42:18–00:42:56 UTC; memory persistence, real `gpt-oss-120b`, immutable primary keyword recipe, concurrency 1, K=1.
- 104 completed trials; 96/101 positive matches correct (95.05%, required 97.1%); 3/3 miss controls detected; 3 wrong definitive matches (allowed 0), plus 2 wrong partial matches.
- All trials used the reranker; no transport fallback. Hard-confusion count 0/44. The trust gate failed, and the command exited 1.
- Preserved immutable evidence: [`ev_554809…`](../../../evals/history/match-104-2026-07-02/keyword-rerank-figure-library-50-2026-07-02/ev_554809052151d64dbd6b51975ab89b3d60cb425081a63e79b8cd1e6560710247.json). [Command receipt](COMMAND-eval-104-2026-10-04T00-42-18-263Z.json).

## Frozen 12-case supplemental coverage

The nine positive cases and three unchanged miss controls were independently labelled and frozen before measurement. Dataset SHA-256 `acb9830130d99d362d81706ea88baa58a3116a77b892b11f408242277e29c189`. [Freeze](NEW-THREE-MATCH-CASES-FREEZE.json), [label rationale](COVERAGE-LABELS.md), [22-check independent static review](CASE-AND-THEME-REVIEW.md).

At October 4, 00:47:08 UTC, the actual harness stopped before provider execution because five of nine positive cases lost every acceptable gold answer at top-K=6:

| Zero-based case | Expected figure | Age-pool size | Result |
|---|---|---:|---|
| 0 (F1) | Franklin | 45 | Lost from shortlist |
| 1 (F2) | Franklin | 45 | Lost from shortlist |
| 2 (F3) | Franklin | 45 | Lost from shortlist |
| 4 (M2) | Somerville | 15 | Lost from shortlist |
| 6 (S1) | Slocum, or predeclared Grant alternative | 15 | Both lost from shortlist |

The command exited 1. Provider calls and completed rerank trials were zero; supplemental accuracy and miss-detection metrics are unmeasured. No successful evidence record was generated. [Command receipt](COMMAND-eval-new12-2026-10-04T00-47-07-824Z.json).

## Handoff

The original gold labels, new frozen cases, recipe, prompt, top-K and trust thresholds retain their measured identities. Historical failed evidence stays intact. The earlier owner's exception is bound to the exact ten-story snapshot and cannot approve these three additions.

[The deployment procedure](../../DEPLOYING.md#figure-library-releases) requires: “If the trust gate failed, the content cannot ship.” A passing evaluated matching release and the owner's review of [the exact reading packet](READING-PACKET.md) remain separate requirements. The three inserted StorySpecs remain drafts; the existing 44 publications are preserved.
