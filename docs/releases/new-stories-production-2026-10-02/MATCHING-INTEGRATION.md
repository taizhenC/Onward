# Ten-story production matching preflight

This document records a read-only implementation review and an isolated, no-network shortlist diagnostic. It does not publish stories, change routes, register a release or supply real-provider evidence.

## Smallest supported content release

Append the ten exact approved `FigureStageRow` objects to `lib/figures-data.ts`, preserving every original entry. Keep `STUB_KEYWORD_MAP`, `MATCH_CONFIG_IMPLEMENTATION_VERSION`, the top-six cutoff, age tolerance, immutable recipe manifests, primary/rollback selection, original gold and historical evidence unchanged. The new metadata already uses the controlled theme vocabulary; no new theme is necessary.

Publish the matching database stages and their exact StorySpecs only through the reviewed, snapshot-bound publication workflow. Production reads all published database stages into a load-once cache; it does not constrain those keys to the installed const. A worker refresh is needed after publication. The fresh production catalog must be audited separately from the captured 34-story baseline used by this diagnostic.

A catalog release can retain the current promoted recipe. The [deployment runbook](../../DEPLOYING.md#figure-library-releases) requires a content commit, a passing real-reranker trust gate tied to that commit, and an append-only library release citing that evidence. The installed const must hash to the latest release entry. Do not reseed the existing fifty stages or StorySpecs to publish this scoped packet; published/retired snapshots remain immutable, and current draft prose is not necessarily the generic const-derived draft.

Changing keyword routes would change the installed scoring implementation, even if the public constant kept the same string. That needs an honest forward/rollback compatibility design; it is outside this minimal content release. The [earlier migration plan](../held-sixteen-matching-2026-09-20/MIGRATION-PLAN.md) explains this distinction.

## Independent matching cases

[matching-extension.json](matching-extension.json) contains 20 new synthetic positive cases: two per new story, including ten specific hard distinctions. The comparison figures are existing published figures or another member of the approved ten. No figure name appears in an input. The original 104 cases and labels remain unchanged. This extension is an observed development and release diagnostic, not a blind or protected holdout.

The hard distinctions are sharing an unfinished useful plan versus searching for a vocation; returning to a difficult clinical classroom versus securing training abroad; a family's objection to a working opportunity versus legal university exclusion; negotiating promised release versus reinvention after escape; family-income pressure versus aimlessness; hiding near children versus post-escape adjustment; a paid reporting trial versus school admission; refusal of nursing service versus lost bodily capacity; school admission versus a reporting trial; and a child's communication lesson versus the teacher's own training.

The Keller cases use age six only in the hermetic diagnostic. The public intake accepts ages 18–100. Keller's honest historical range is 6–6, and the unchanged age tolerance is ten: **no valid adult age can reach her through the normal age pool**. Publication would make the content a published catalog entry, but cannot establish ordinary adult matching availability. Do not change her historical age or submit child ages to the public intake. Washington's public test uses age 18 while preserving his historical range of 16–17.

## Measured shortlist coverage

Run the [no-network checker](check-matching-coverage.ts):

```powershell
node --import tsx docs/releases/new-stories-production-2026-10-02/check-matching-coverage.ts
```

The [coverage receipt](matching-coverage.json) pins the original gold and extension hashes and reports each case's top-six pool and expected rank. It measures both the prospective installed 60-stage catalog and the production-style 44-stage catalog reconstructed from the captured writing baseline. It reads no live database and calls no provider.

All 96 non-semantic original shortlist requirements survive with the prospective installed sixty. In production-style 44, only 63 of those 96 labels are present and reachable because sixteen existing figures remain unpublished. The 33 non-semantic production failures were already present with the 34-story baseline; the ten additions cause no new original-production shortlist loss. These existing coverage gaps remain reported, never relabeled as passing.

The independent extension reaches the shortlist in **16 of 20 cases** in both catalogs. Four open failures remain:

| Zero-based case | Figure | Expected rank in production-style catalog | Failure |
| --- | --- | ---: | --- |
| 11 | Jacobs | 10 | “escaped” routes to dispossession and self-invention; her honest confinement themes do not include self-invention. |
| 12 | Riis | 10 | “wasted” routes to late start; unpaid wages, hunger and an introduced reporting trial have no matching route. |
| 13 | Riis | 11 | “writing” routes to creative dismissal; the episode is unpaid employment and practical work, with no rejected manuscript. |
| 17 | Washington | 10 | Hunger, waiting for school admission and a practical task have no keyword route; zero-signal age ties fill the shortlist before him. |

These are real lexical coverage limitations. Adding unsupported themes, rewriting the failed inputs, widening accepted labels, raising top-K or lowering thresholds would obscure them. The current extension therefore cannot be represented as a fully passing release benchmark. It should not be handed to the ordinary full eval harness as though its prefilter gate could pass; that harness rejects these known shortlist failures before reranking.

### Scoped metadata proposal

The parent requested source-supported theme proposals while retaining every failed case. [THEME-PROPOSAL.json](THEME-PROPOSAL.json) records all ten original and proposed stage hashes, exact field differences and source justifications. [proposed-stages](proposed-stages/) contains isolated production copies: eight are byte-identical to the writing inputs, Jacobs adds `self_invention` and Riis adds `late_start`. No writing input, prose, source, facet, biography, age, route or registry was modified. These are editorial inferences requiring independent review, not new documentary claims about the figures' motives.

Jacobs's proposed tag covers the bounded move out of prolonged concealment toward a different and unfamiliar life. Legal freedom, bodily relief and reunion are not implied. Riis's proposed tag covers perceived lost time: the memoir explicitly calls three years wasted before another reporting beginning. It does not call a twenty-four-year-old chronologically old. No `creative_dismissal` is added to Riis: accepted but unpaid reporting supplies no rejected creative work.

The [proposed coverage receipt](matching-coverage-proposed.json) retains the exact original and extension hashes. All 96 original installed shortlist requirements still survive, all 63 already-reachable production requirements survive, and no new original-production failure appears. The new extension improves from **16/20 to 18/20** in both prospective catalogs. Cases 11 (Jacobs) and 12 (Riis) reach the shortlist; cases 13 (Riis) and 17 (Washington) remain failures. Washington's latter case has zero route overlap, so changing themes cannot affect that score. The same adult reachability limit remains for Keller.

```powershell
node --import tsx docs/releases/new-stories-production-2026-10-02/propose-themes.ts
node --import tsx docs/releases/new-stories-production-2026-10-02/check-matching-coverage.ts --proposed
```

The proposal does not claim a passing release benchmark. Remaining failures should remain explicit lexical challenges, and any further routing mechanism change requires its own honest compatibility and evidence work.

## Verification required for a release

Run strict StorySpec validation, exact composition/replay and source-fold checks for all ten approved bytes. Verify the installed stage additions match the frozen stage documents and preserve all old const entries. Run TypeScript, lint, figure structure, story artifact/composer/source transparency, hermetic recipe governance/immutability/registry/deployment checks, and a production build.

Keep original-104 regression results distinct from the new extension and under-18 diagnostics. Any real reranker eval uses the unchanged promoted primary, keyword retrieval, concurrency one, the exact committed content tree and immutable dataset identity; retain failed evidence. The applicable real gate is coverage at least 95%, rerank and overall top-one at least 97.1%, every miss partial, no definitive wrong and no hard confusion. A passing old-104 run alone does not establish new-story matching coverage.

Before publication, audit a backup containing the scoped editorial rows and the previous published catalog; confirm the established production database identity; compare exact approved bytes; record actual human reviewer metadata; dry-run; pin complete reviewed read-backs before snapshot-bound RPC publication. After publication, verify all ten lifecycle changes and exact prose, every unrelated row, valid catalog/stage parity and zero quarantine. Refresh workers only after the publications, then perform bounded adult canaries through ordinary match/reader/progress routes, with exact canonical text and normal cleanup. Keller's absence from adult intake must remain disclosed. Withdrawal uses exact-ID retirement, never overwrites or demotions of published snapshots.
