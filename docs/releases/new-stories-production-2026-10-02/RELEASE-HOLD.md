# Production release hold

The request was to publish all ten completed stories to production. Preparation and bounded evaluations are complete; **publication is not complete**. No release entry, matching-pass receipt, production merge, deployment, authoring metadata mutation or publication was performed. The isolated `codex/ten-story-production` branch retains the completed research, ten standard-format reading documents, source-bound candidates, prepared publication tools and the complete failure trail for review.

## Measured blocker

| Exact catalog | Positive accuracy | Wrong definitive positives | Miss detection | Mandatory trust gate |
| --- | ---: | ---: | ---: | --- |
| Original fifty control | 100/101 (99.0%) | 0 | 3/3 | Pass |
| Initial sixty, `dd499953…` | 95/101 (94.1%) | 4 | 3/3 | Fail |
| Reviewed concise sixty, `bb27964f…` | 96/101 (95.0%) | 1 | 2/3 | Fail |

All three runs used the real provider, unchanged original104 gold, selected immutable keyword recipe, temperature zero, low reasoning, top-six and sequential requests. The control is an observed comparison, not authority for the expanded catalog. Content evidence IDs are `ev_86ef2374e263d41eae3302d69837f3ced8700f41264248e0a146f5e21cd626d9` and `ev_6f9f15f110e062a26799e08df3b71ddf2de73be13d1f230a44b3262576a6ba1d`; the control is preserved in `BASELINE-EVIDENCE.json`. Thresholds remain 97.1% positive accuracy, zero wrong definitive matches and complete miss detection. No label, accepted alternative or threshold was changed.

Every required original label survives retrieval. The new candidates alter comparison context and some positions. Source-reviewed factual summaries reduced context and confident errors but did not restore the gate. Independent source reviewers found no justified removal of Seacole's central institutional constraint. Optional removal of adjacent Jacobs/Grant themes introduces another Jacobs retrieval failure and leaves other failed pools unchanged. See [diagnosis](REGRESSION-DIAGNOSIS.md) and [source-led assessment](PRIMARY-THEME-ASSESSMENT.v3.md).

The projected forty-four-catalog v2 supplemental run is **partial, not a completed pass**: 79/89 trials, including twenty new probes and fifty-nine unchanged original cases. It measured 17/20 new cases and 55/59 original cases correct, with four wrong definitive results including an original miss. The complete original104 gate independently failed, so the local supplemental boundary cannot explain away the publication blocker. See [partial receipt qualification](SUPPLEMENTAL-PARTIAL.v2.md).

## Why the hold applies

The [deployment runbook](../../DEPLOYING.md#figure-library-releases) explicitly says: “If the trust gate failed, the content cannot ship.” The code-first content-release path requires passing evidence on the exact expanded library before appending its release entry. Current governance correctly rejects the unregistered expanded snapshot. Broad database reseeding, direct published-status writes, repeated unchanged evaluations, fabricated review/evidence or a recipe-selector override would not resolve this failure.

Matching implementation or prompt changes require a separately governed recipe release. The repository currently registers only synthetic datasets; it has no registered protected holdout for challenger promotion. The [promotion procedure](../../DEPLOYING.md) requires protected evidence, independently reviewed bindings and a protected `recipe-promotion` environment. This task did not invent those inputs or bypass that authority. The next dependency is matching calibration and appropriate independent release evidence, followed by the actual content gate and publication/deployment sequence.

## Preserved scope and prepared handoff

All original fifty stages, gold, recipes, prompt contracts, routes, schemas and selected production recipe remain unchanged. The completed stories total 7,302 words and retain all original candidate hashes. The reviewed v2 metadata and optional v3 diagnostics are separate copies; none was applied to the database. Keller's age-six episode remains outside adult intake reachability; the Riis and Washington lexical gaps remain counted failures.

The prepared publisher uses receipt-bound whole-document promotion, exact stage proposal hashes and prior-publication preservation. Static checks and offline tests do not authorize invoking it while the matching gate fails. Production worker refresh and the prepared normal-route API canary remain unexecuted. A draft PR is review material, not a deployment. The independent read-only database receipt records the actual current draft/publication state without claiming an unperformed release.

The final separate security audit also failed on the currently unpatched `braces` advisory; [its qualification](SECURITY-AUDIT-UPDATE.md) and [validation checkpoint](VALIDATION.md) preserve that newly observed blocker. A future release must resolve both matching and security gates. The earlier successful audit observation is not presented as current passing evidence.
