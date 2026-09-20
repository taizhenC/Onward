# Verification — editorial packet only

20 September 2026. These are local structural and editorial checks, not an
owner approval, production audit, provider evaluation or deployment receipt.

## Exact-file structural results

Final packet check passed: all 26 new targets, all 28 earlier snapshot hashes,
the 9/9/8 split, exact reading copies and both cross-review/structural receipt
hashes. Every new candidate remains a draft with empty review metadata.

| Check | Result | Boundary |
| --- | --- | --- |
| Set 1, strict installed-identity batch | 9/9 pass; 1,950 words | Does not certify matching-focus fit |
| Set 2, unmodified installed-identity batch | Expected rejection: Lee's `1934-library-dedication` stage is absent | Integration remains blocked; the validator was not weakened |
| Set 2, isolated proposal fixture | 9/9 pass; 1,849 words | Adds a Lee identity only in this process's memory; not installed-catalog clearance |
| Set 3, strict installed-identity batch | 8/8 pass; 1,721 words | Includes final Yeats hash `4bae8f16a55804c3469446c95d4e7dc95091e82865254c2fd476c22320f623e0` |

The per-set `STRUCTURAL-CHECK.json` receipts record the exact candidate hashes,
word counts, draft/publication-simulation errors and warnings, canonical prose
preservation, replay and sentence rhythm. All 26 return zero errors/warnings.
Simulated publication adds no saved review or approval. Lee's fixture-only age
comparison is against the preview metadata, not the installed stage.

The 26 drafts total 5,520 words. Their 157–327-word lengths intentionally depart
from the usual 700–950-word aim under the owner's short-vignette authorization.
Mechanical success is not a full-recipe or historical-fact pass. Documentary
distance and reading quality remain owner judgments; the source reports keep
their explicit access, chronology and mediation qualifications.

## Reproduce locally

From the repository root, with the existing dependencies installed:

```powershell
node docs/releases/held-story-repairs-2026-09-20/check-review-packet.mjs
node --import tsx scripts/check-story-batch.ts docs/releases/held-story-repairs-2026-09-20/set-1 9 --require-hashes
node --import tsx scripts/check-story-batch.ts docs/releases/held-story-repairs-2026-09-20/set-3 8 --require-hashes
node --import tsx docs/releases/held-story-repairs-2026-09-20/check-set-2-proposal.ts
```

The packet checker verifies all 28 previous indexed snapshot hashes, the exact
26 held-figure scope, new candidate hashes, draft/empty-review state, reading
copy text, cross-review hash presence and matching structural receipts. It
reads files only; it cannot verify the truth of historical claims or infer a
human review. The proposal fixture is similarly local and does not access
environment files, providers or the database.

The intentional negative check below exits 1 with
`lee-1934-library-dedication-v1.candidate.json: stage absent from installed library`:

```powershell
node --import tsx scripts/check-story-batch.ts docs/releases/held-story-repairs-2026-09-20/set-2 9 --require-hashes
```

Do not replace that check's failure with a claim that Lee can be published.
The preview helper explicitly fails if the new identity has since appeared in
the installed library; a later integration must reassess and retire the fixture.

## Regression results

The following existing suites passed locally after the content corrections:

- `npm run check-story-spec`
- `npm run check-story-artifact`
- `npm run check-story-composer`
- `npm run check-source-transparency`
- `npm run typecheck`
- `npm run lint`
- `git diff --check`

These checks use structural/in-memory fixtures; no live model or production
access was needed. The new packet commands are explicit local checks, not new
steps added to the repository CI workflow. The PR's existing CI result should
be read separately from these content-specific receipts.

## Editorial and release limits

The three `CROSS-REVIEW.md` files identify the independent source passages
checked and the narrow corrections made. Christie's reviewer-made opening and
metadata edit is expressly distinguished from the root's independent diff and
batch check. No agent review is recorded as human approval.

Fifteen candidates carry separate age/episode/matching-focus integration holds
in the master index; all 26 need review of the exact new text. Other narrower
age comparisons and source qualifications are still disclosed. Approval cannot
establish missing dates, and a shorter story cannot erase an evidence gap.

Only this additive review packet changes. Older snapshots, runtime code,
recipes, matching data and production remain untouched. Commits are authored
and committed as `taizhenC <tzhcheung@gmail.com>`, without co-author trailers.
