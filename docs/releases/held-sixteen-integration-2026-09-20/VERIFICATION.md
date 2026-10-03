# Verification — sixteen draft repair proposals

Run on 21 September 2026 UTC / 20 September local time. Base commit:
`117500612dac5ec0eff6c7e9a39737989f23080f`. These are local, read-only editorial
checks. They are not human approval, production inspection, or real-provider
evaluation. All candidates remain draft with empty reviews.

## Final checks

| Check | Result and boundary |
| --- | --- |
| `check-integration.ts --require-manifest` | All 16 structurally consistent; zero errors/warnings per candidate and in-memory publication simulation. Exit **1** because four legacy-age migration incompatibilities remain. |
| Canonical composition and stored replay | 16/16; canonical passages and normalized playback chunks preserved; tampered replay rejected for every candidate. |
| Candidate/proposal agreement | 16 exact identities, age ranges and all 112 fallback passages agree. |
| Review packet | 9 + 7 exact reading sections, both target hashes present; manifest pins all 32 candidate/proposal files. |
| Frozen history | All 26 prior candidate hashes unchanged; canonical passages unchanged for 15 replacements. Rogers is the explicit new-text exception. |
| Proposed catalog overlay | 50 rows, 16 replacements, other 34 structured rows unchanged. This is an in-memory proposal overlay, not installation. |
| Coarse chronology | Poitier and Rudolph retain undated identities, qualified age facts and pinned uncertainty notes. No precise dates silently introduced. |
| `check-review-packet.mjs` in the prior repair packet | Pass: 26 repair candidates, 28 earlier snapshots unchanged, exact reading copies and prior receipts intact. |
| `npm run typecheck` | Pass. |
| `npm run lint` | Pass, zero warnings. |
| `npm run check-story-artifact` | Pass: 50 baseline artifacts, disclosure exclusion and tamper rejection. This checks the unchanged installed source library, not new-stage matching. |
| `npm run check-story-spec` | Pass: 50 baseline drafts and negative evidence/review gates. Same baseline limitation. |
| `npm run check-figure` | Pass: unchanged 50-row source catalog. New proposal rows are independently checked by the packet checker. |
| `npm run check-recipe-immutability -- 117500612dac5ec0eff6c7e9a39737989f23080f` | Pass; immutable recipe history preserved. |

Exact per-story hashes, rhythm statistics and blockers are in
[INTEGRATION-CHECK.json](INTEGRATION-CHECK.json). The synthetic publication
simulation creates placeholder reviews in memory only and does not write them
to candidates or any database. Source checking does not convert inference into
historical certainty; see the research and independent-review notes.

## Independent checker verification

A second agent independently ran the final mandatory-manifest command and
verified the same results. It exercised twelve negative probes in an isolated,
in-memory harness without changing the actual inputs:

1. Coordinated candidate/proposal/reading-copy change to previously reviewed text.
2. Adding a precise Poitier episode date.
3. Upgrading Rudolph's inferred age confidence.
4. Removing Rudolph's chronology qualification.
5. Adding human approval to the manifest.
6. Claiming serving changes in the manifest.
7. Marking the manifest published.
8. Claiming candidate publication/review.
9. Adding an unauthorized proposal status field.
10. Tampering with a frozen candidate.
11. Tampering with the original source library.
12. Removing a canonical passage from a reading copy.

All twelve failed closed at the intended guard; 117 actual input files were
verified unchanged. The disposable harness is retained outside the repository:
`C:/Users/taich/AppData/Local/Temp/onward-held-sixteen-checker-review-e3dd0f04891a4cb4b827412591b428a5/mutation-review.cjs`.
This machine-local path is an audit aid, not a required portable dependency.

## Deterministic migration incompatibility, not a provider test result

The unchanged `evals/match.json` has 104 cases. Four require childhood Rogers,
without an acceptable alternate figure:

| Zero-based index | User age | New Rogers distance | Other age-eligible rows | Keyword preflight |
| --- | ---: | ---: | ---: | --- |
| 8 | 11 | 30 years | 19 | Expected figure cannot survive |
| 12 | 12 | 29 years | 22 | Expected figure cannot survive |
| 58 | 12 | 29 years | 22 | Expected figure cannot survive |
| 100 | 13 | 28 years | 23 | Semantic case; exempt from this preflight |

The installed hard tolerance is ten years. The evaluator's keyword preflight
uses the age pool and only falls back to all figures if that pool is empty;
these pools are not empty. Its selected top-K is a subset of that pool, and
none of the three nonsemantic cases has an `accept` alternative. Thus, if this
complete overlay were installed and an otherwise-valid keyword evaluation
reached that check, cases 8/12/58 would abort before provider trials. The fourth
case is exempt from that preflight but still cannot select the adult episode
through the runtime age pool. Out-of-pool model answers are rejected.

This conclusion was independently checked against `scripts/eval-match.ts`,
`lib/figures.ts`, `lib/match-config.ts`, `lib/matching.ts`, and the unchanged gold
rows. **No real-provider run or real trust-gate failure is claimed.** The packet
checker intentionally reports this known incompatibility with exit 1 instead
of masking it behind its structural passes.

Further semantic coverage changes are disclosed in the research notes. Age
reachability for the other cases is not evidence of a correct match. The 16
positive-target and 8 negative-premise proposals in MATCHING-REVIEW-CASES.json
are synthetic and unmeasured, not an approved replacement benchmark. All use
adult reader ages; Rudolph's age-18 case is an explicitly partial connection
outside the historical envelope, not a fabricated age-identical episode.

## Operational boundary

No installed matching row, keyword map, active eval dataset, recipe selector,
release lineage, embedding, database document, environment or production worker
was changed. Historical packets are preserved. No broad seeding, old-stage
deletion or session rekeying was performed. The five temporary source PDFs/page
renders from group B were moved intact out of the repository to
`C:/Users/taich/AppData/Local/Temp/onward-held-sixteen-group-b-source-checks`;
nothing was deleted.

One trailing blank line in a new research note was caught by staged whitespace
validation and removed before that note was committed. All story commits use
the owner's author and committer identity; no co-author trailers are permitted.
