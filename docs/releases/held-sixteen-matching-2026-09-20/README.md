# Held-sixteen matching migration — review draft v1

**Prepared for review, not implemented or ready for production.** The benchmark
and development proposal are separate from the owner-reviewed story text in
[the source packet](../held-sixteen-integration-2026-09-20/README.md).
No story, catalog row, runtime route, recipe, threshold, dataset registry,
environment, database or production deployment was changed by this packet.

The owner authorized preparing this migration for review after the publication
preflight failed. That authorization is not approval of this new benchmark,
its coverage losses, route semantics, or a new release mechanism.

## What to review

1. [Benchmark rationale](BENCHMARK-RATIONALE.md) and
   [case lineage](case-lineage.json): all original 104 inputs and objects remain
   intact, but only 71 are scored in the draft. **33 remain unresolved coverage
   losses**, not passes or presumed misses. Six obsolete hard labels were
   retired and seven historical notes corrected without changing their inputs
   or positive targets.
2. [Draft benchmark](benchmark.json): 107 cases, including two source-led
   positives per replacement and four new partial-framing miss cases. Its
   37 hard cases are not equivalent to the old 44. These near-story examples
   are a development set, not a protected adversarial holdout.
3. [Independent editorial review](BENCHMARK-INDEPENDENT-REVIEW.md): exact hashes,
   source/age qualifications, partial framing and remaining route risks.
4. [Migration plan](MIGRATION-PLAN.md): decisions and compatibility work required
   before installation. This is not a deploy command checklist ready to execute.

`label-freeze.json` pins the independently authored/reviewed labels before the
first measurement. Its freeze was committed as `e798c30`. Do not change failed
labels to seek a pass; any editorial revision needs a new reviewed version.

## Measured result: the keyword proposal is insufficient

The diagnostics use the actual keyword parser, age gate and six-candidate
selector, with sixteen reviewed rows substituted **only in memory**. Labels are
used only after selection to count survival; the matcher receives age/feeling.

| Diagnostic | Positive targets reaching the shortlist | Exit |
| --- | ---: | ---: |
| Original 104 against original authored catalog | 101/101 | 0 |
| Original 104 against proposed sixteen-row overlay | 86/101 | 1 |
| Frozen draft against overlay, existing routes | 88/100 | 1 |
| Frozen draft against overlay, proposed routes | 88/100 | 1 |

The draft's retained legacy slice is **66/68**; the newly authored positive
slice is **22/32**. Seven miss cases require model confidence/framing and remain
unmeasured. Proposed routes improve two ranks without moving either into the
top six. There is no target-survival improvement on the frozen draft.

Twelve draft targets remain outside the shortlist: both retained Poitier cases,
Lamarr-b, Lewis-a, both Lindgren cases, both new Poitier cases, both Rachmaninoff
cases and both Rudolph cases. Exact IDs, ranks and selected figures are in
[the retrieval receipt](retrieval-receipt.json). A rank of zero means the expected
figure is absent from the age-filtered pool, not first place. The original-104
overlay loses fifteen targets, including semantic case 100; this is the earlier
fourteen non-semantic failures plus that additional age-ineligible case.

These are authored **50-row** catalogs, not the live production published-only
candidate pool. No production eligibility, session or application gate was
simulated. Legacy target survival against a replacement is a mechanical
accountability check, not validation of a retired historical premise.

Survival is only a necessary precondition, not a correct match. Many surviving
examples have zero keyword hits and survive by age/tie ordering. The 88/100
ceiling already cannot reach the unchanged 97.1% expected-figure top-1 threshold.
No provider top-1, miss detection, definitive-wrong, hard-confusion or trust-gate
pass is claimed. No provider calls were spent on this already-failing draft.

## What the small experiments established

The earlier sixteen development probes initially lost Lewis, Lindgren, Poitier,
Rachmaninoff and Rudolph. General criticism/composition aliases and an additive
audition theme recover Lewis, Rachmaninoff and Poitier in those particular
probes (11/16 becomes 14/16). This does **not** generalize to the frozen draft.

Independent semantic review rejected `young child` → parenting fear and
`another activity` / `different sport` → perseverance. Those ordinary phrases
do not establish the inferred emotional context; the proposals were removed
before new-benchmark measurement. Lindgren and Rudolph remain red in the
development repro. No disability theme was inferred from sports participation.

The four remaining aliases and one theme extension in `keyword-routes.json`
are **unapproved experiments, not a recommended production patch**. They need
context/negation contrasts, and they are inadequate even on close-fit examples.
No figures' historical facts or age ranges were stretched to improve scores.

This follows the diagnosing-bugs workflow: reproduce with the real seam, change
one route family at a time, reject semantically unsafe hypotheses, then test
against independently frozen labels. The observed causes are missing wording
coverage, obsolete route-to-theme associations, broad-theme ranking collisions
and genuine episode-age incompatibility—not a broken test runner.

## Reproduce without credentials or services

From the repository root:

```powershell
node --import tsx docs/releases/held-sixteen-matching-2026-09-20/check-migration.ts --self-test
node --import tsx docs/releases/held-sixteen-matching-2026-09-20/repro.ts
node --import tsx docs/releases/held-sixteen-matching-2026-09-20/repro.ts --routes proposal
node --import tsx docs/releases/held-sixteen-matching-2026-09-20/measure-benchmark.ts legacy-current
node --import tsx docs/releases/held-sixteen-matching-2026-09-20/measure-benchmark.ts legacy-overlay
node --import tsx docs/releases/held-sixteen-matching-2026-09-20/measure-benchmark.ts draft-baseline
node --import tsx docs/releases/held-sixteen-matching-2026-09-20/measure-benchmark.ts draft-proposal
```

The two development repro commands and final three benchmark commands
**intentionally exit 1** for actual remaining failures. Do not suppress that
status or describe it as a passed official evaluation. Run commands separately
when recording exit codes.

## Verification and boundaries

- Integrity passes; 21 in-memory tamper fixtures are rejected. It pins the old
  104, approved proposal artifacts, unchanged runtime/recipe/threshold files,
  premeasurement labels, exact 16+34 overlay and every case disposition.
- Typecheck, repository lint, recipe governance and recipe immutability pass.
- The earlier 26-story packet passes unchanged. The sixteen integration check
  still exits 1 for its four existing Rogers age blockers; structural checks
  remain successful. This packet does not erase that red result.
- All four benchmark outputs were identical on a root rerun. A separate agent
  reproduced them, checked the 16+34 overlay, and ran network-blocked diagnostics
  with zero network attempts or database-factory calls.
- [Integrity receipt](integrity-receipt.json) and retrieval receipt are local
  diagnostic records only. They are deliberately outside `evals/history/` and
  do not claim approved evidence IDs or any publication authority.

Every commit uses the owner's author/committer identity without co-author
trailers. This draft is stacked on the source-packet branch so it can be reviewed
without folding matching-policy decisions into the sixteen stories themselves.
