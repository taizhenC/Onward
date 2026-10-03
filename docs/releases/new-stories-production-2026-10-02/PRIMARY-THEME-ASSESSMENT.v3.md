# Primary-theme assessment after the v2 gate failure

Recorded 2026-10-03 UTC. Read-only source-led assessment by the library-integration agent, with an independent second assessment by its primary-theme-review subagent. The second reviewer examined the source ledger, final story, v2 summary and comparable original stages without inspecting evaluation prompts. Neither reviewer used provider or database calls. Previous writing inputs, proposal versions, reviews, checkers, original 50, gold, keyword map and recipe remain frozen.

**Release conclusion: these tag changes cannot establish a legitimate content-only remedy for the remaining gate failure. Keep publication pending.** An optional narrower editorial v3 is prepared, but it is not a discovery of false historical facts, an approved release, or a forecast of a passing provider run.

The v2 full 104 run `2026-10-03T00-54-40-298Z.json` failed at 96/101 positive matches, miss detection 2/3, and one positive wrong definitive. Its facts-char p95 is 10,547, below the passing original 50 baseline's 10,862; shortening summaries therefore did not restore label accuracy. Lee 37/38 and Douglass 7 became wrong partials rather than wrong definitives, while Butler 99 became wrong definitive and miss 21 was also definitive. All expected positive labels still survive retrieval. This is now evidence against prompt length being a sufficient explanation or remedy.

## Source assessment

| Questioned tag | Verdict | Bounded editorial action |
| --- | --- | --- |
| Jacobs `self_invention` | Adjacent but defensible; not a false historical assertion | Omission is reasonable only under a narrower rule that positive tags describe the bounded episode's principal emotional/decision through-line. |
| Grant `self_invention` | Adjacent but defensible; weaker omission case than Jacobs | The same narrower rule can justify omission, while retaining illness and persistence. |
| Seacole `social_constraint` | Central and source-supported | Retain; removing it to eject her from Lee pools would discard a documented institutional barrier. |

Neither `lib/themes.ts` nor the inspected stage standards explicitly prohibit supported secondary themes. The controlled vocabulary and existing source-qualified stage patterns include broader editorial connections. The frozen v1 Jacobs addition/review remains a valid bounded secondary reading. Any v3 omission must honestly be described as adopting a narrower editorial tagging criterion for the new stories, rather than correcting fabrication. The primary-tag criterion is proposed here, not claimed as an existing repository requirement.

Jacobs's stage label, both shapes and all four facets center on an enslaved mother concealed near her children: fear of capture, inability to speak to them, bodily pain, small acts within confinement and dependence on relatives and a friend. Candidate facts `space`, `children`, `years`, `departure`, `distrust`, `arrival`, `rail` and `legal` map this through-line to memoir chapters XXI and XXIX–XXXI and the existing official chronology. A different northern life after escape is a reasonable adjacent inference, but the bounded story does not develop a new vocation, deliberate identity-building project or legal emancipation. Comparable original Douglass instead gives a new name, work, community and public voice a substantial place in its aftermath. Omitting Jacobs's secondary tag can improve episode specificity without denying her agency, assistance or ongoing legal enslavement.

Grant's October 1, 1858 letter supports wanting eventually to do business for himself (`fact-father-offer`, `fact-income-preference`), and changes from farming to property work and salaried shop employment support a secondary starting-over reading. The main emotional and decision sequence is nevertheless illness, insufficient income, failed applications, family-supported work and practical assistance. The turn uses prior army experience after an invitation; its aftermath explicitly relies on a clerk (`fact-office`, `fact-forms`, `fact-clerk-help`). Original Chandler, Wang and Muir make adoption of a different craft or life direction central. Grant's tag is defensible, but illness and persistence describe this particular episode more directly. No humiliation, loss of identity or new calling should be invented to strengthen the tag.

Seacole's candidate `f-hall`, `f-full` and `f-final`, mapped to memoir chapter VIII pp. 78–80, document failed official nursing requests and refused funded passage. `f-morrow` through `f-capital` document the independently financed route, contacts, partnership and limited capital. Those constraints define the opening, dark moment, struggle and eventual welcome. `social_constraint` is not synonymous with proven racial discrimination: the original vocabulary also covers institutional access and externally controlled roles. Her suspicion of prejudice remains qualified as her suspicion. Retain the tag without claiming officials' racial motives are established.

The optional `THEME-PROPOSAL.v3.json` has SHA-256 `4d216d2a6c7a9b3ce38c6798b0d44e19c1132040fd9b5ad27238e89bb8d0a3d9`. It pins ten complete copies under `themes-v3-stages/`, exactly equal to facts-v2 apart from removing `self_invention` from Jacobs and Grant. It records exact field diffs and source-fact IDs, leaves Seacole and every other tag unchanged, and adds no anti-theme. The two changed files are Jacobs SHA `7ce355d370e5c1d4625fd9b6493f4f40cbd49c52d823c0f0089b61530da9dafe` and Grant SHA `c35dcbcab2ec9cf69fbb43318e2cbf9ebf9a8c57aaa0c710e46780c6c2a21737`. These copies are optional review artifacts; no library, database or frozen instrument was changed.

## Offline counterfactual coverage

`THEME-COUNTERFACTUAL.v3.json` records all 104 original cases and twenty frozen extension cases for all eight combinations of the three questioned removals in installed 60. `THEME-COUNTERFACTUAL-PROJECTED.v3.json` does the same for projected 44, retaining exact case inputs/labels/acceptance sets and reporting historical primary labels absent from production separately. The unchanged production scorer and ten-year age tolerance were imported; no reranker was invoked. None of these diagnostic combinations is a provider-result prediction or approval of Seacole removal.

| Diagnostic removal | Installed 60 original required survival | Extension survival, 60 and 44 | Material result |
| --- | --- | --- | --- |
| None | 96/96 | 18/20 | Known cases 13/17 remain failures. |
| Jacobs only | 96/96 | 17/20 | Douglass 7 moves rank 2→1; Jacobs extension 11 newly falls rank 2→11 in 60 and 2→10 in 44. |
| Grant only | 96/96 | 18/20 | No currently wrong original case changes shortlist. |
| Seacole only, not editorially approved | 96/96 | 18/20 | Restores the three Lee pools, but discards a central valid tag. |
| Jacobs and Grant, optional editorial v3 | 96/96 | 17/20 | Same new Jacobs11 failure; current Angelou 3, Butler 99, miss 21 pools remain unchanged. |
| All three, not editorially approved | 96/96 | 17/20 | Still leaves Angelou 3, Butler 99 and miss 21 pools unchanged. |

All eight combinations preserve 96/96 nonsemantic required original labels. In projected 44 there are 69 primary-label-reachable original cases including the three misses, and 35 unavailable historical primary labels; no previously surviving reachable original case is newly lost under any combination. Unavailable labels are never counted as correct.

Jacobs extension 10 remains in the shortlist without `self_invention`: rank 6 in 60, rank 5 in 44. It still provides one genuinely reachable adult probe, but extension 11 becomes an additional failure and must remain counted as such. Cases 13/17 are untouched failures in every combination. The same labels and ages remain frozen; no replacement feeling or enlarged acceptance set is proposed.

Angelou 3's shortlist is identical in every combination. Butler 99 and miss 21 have no matched keyword themes at all, so any theme-only edits—not merely these three removals—cannot alter their keyword scores or alphabetical/age tie-breaking. The added candidates in these zero-signal pools remain contextual competitors regardless of their themes. No credible tag-only correction can therefore be presented as repairing the complete failed-gate behavior. Retaining accurate age ranges and source-grounded summaries rules out manipulating those fields to remove competitors.

The optional primary-theme cleanup can be evaluated later if its editorial criterion is accepted. It should not be installed as a claimed release fix, and unchanged failing inputs should not be rerun repeatedly to search for a favorable receipt. Finishing this ten-story production release may require separately scoped retrieval/rerank calibration work, a new approved recipe and appropriate regression evidence. Within the current immutable-map/recipe/content-only boundary, the evidence supports a publication hold rather than claiming the production goal achieved.
