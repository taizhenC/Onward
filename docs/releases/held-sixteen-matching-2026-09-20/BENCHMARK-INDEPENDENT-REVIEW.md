# Independent editorial review of the proposed matching migration

Reviewed 20 September 2026 local time. **Suitable for an explicitly limited
development/review freeze, not approved gold or production clearance.** This is
an independent agent review, not the owner's benchmark approval.

## Method and independence

The reviewer read all 104 original case objects, the case-parser/scoring
contract, the sixteen proposed matching records and all their canonical
passages, the retained thirty-four rows' age/facet summaries, and the relevant
figure-library release policy in `docs/DEPLOYING.md`. The reviewer then read all
107 proposed scored cases and their lineage/rationales before any migration
measurement was used in this review.

No matcher, provider, database, environment file or retrieval-results artifact
was run or inspected. Earlier conversation-level aggregate failure counts and
old case annotations mentioning historical results were already visible; no
individual migration result was used to assign or revise a label. Static JSON
identity/hash/schema checks below do not measure matching quality. This review
checks consistency with the approved editorial packet, not a fresh historical
source re-audit of all fifty people.

Only after the benchmark author reported the label freeze did the reviewer
inspect the separate proposed keyword routes, without numerical results.

## Exact reviewed bytes

The prospective version is `held-sixteen-coverage-migration-v1`, which is not a
registered recipe or dataset approval. SHA-256 values:

| Artifact | SHA-256 |
| --- | --- |
| `benchmark.json` | `a57e29ed47821270118319e80a7fdd4ae02ca72191300b6a4a3d0d9de73be54c` |
| `case-lineage.json` | `34c09c9025d797cb3517c0e353e0116d4596ea5ee49ac69757057bf3c3f8ee97` |
| `BENCHMARK-RATIONALE.md` | `f63bbf5f271000504c29b887c03e3c20fc219d940fefb8df3e10af5a757d8a21` |
| Final reviewed `keyword-routes.json` | `1f349bc863883c4fefc30e6fab18e6b5847980652cbae84df5ae4a2f47989181` |
| Original `evals/match.json` | `f87962a57990f65a8765afdcd141bbdd1c3b9f5a965d04f4810f1787d8aa2a1e` |
| Unmodified `lib/figures-data.ts` | `e88751de566fa1077059cee143c4bd9d88b55e8adcca48eab4d5fa49b04ddf88` |
| Earlier `held-sixteen-integration-2026-09-20/review-targets.json` | `b43c53652f8cf90b4dcf71f94cb84929af38275dd735bf488848bbba8fa714d0` |

This assessment applies to those bytes. A later label revision needs a new
freeze/review; a successful measurement does not authorize editing failed cases.

## Static lineage and editorial findings

Independent static checks passed:

- All 104 original objects are preserved exactly, including notes, with unique
  original indices and correct individual `JSON.stringify` digests.
- All 71 inherited scored cases retain their original age, feeling and expected
  figure/miss label. Their declared changed fields match the actual changes.
- All 33 unresolved challenges retain the original age and feeling exactly,
  retain the original expected figure as the retired target, and have no scored
  replacement id. They were not silently converted to misses or new positives.
- Stable scored ids are unique; all sixteen replacement figures have exactly
  two new positive cases. Every new input is at least eighteen.
- No `accept` arrays were introduced. Every retained hard decoy differs from
  its expected figure and is excluded from accepted answers. The fourteen new
  hard comparisons have age-compatible decoys under the unchanged ten-year
  gate; that alone does not establish empirical difficulty.

The thirty-two new positives correspond to the documented foregrounds rather
than the retired premises. They are diagnostic, close-to-story examples, not
an independent adversarial holdout. Reader details are not assertions that
every corresponding event occurred historically. In particular, the Rudolph
age-18/19 inputs are qualified partial analogies to limited participation and
trying another activity, not precise-age or medical-recovery evidence. Poitier's
audition chronology remains a coarse envelope.

The four new misses concern routine household labor, roommate boundaries,
adult friendship-group change and sibling disagreement about elder care.
None has a close foreground in this proposed catalog. These are defensible
**partial-framing** expectations, not requests to withhold all stories. The
existing three miss objects remain unchanged. No ordinary-life gap was assigned
a new positive merely to give every input a definitive answer.

## Corrections requested before freeze

The author incorporated the following independent feedback before freezing:

- Do not substitute Jones/Andersen for childhood Rogers just because their
  stories involve children; voice-related shame or authority abuse is not the
  same as peer exclusion.
- Preserve possible partial overlap without claiming all details match: Carver
  mentions racial refusal, Wang remembers an editorial disappointment,
  Lindgren describes foster separation, and Christie/Rachmaninoff retain some
  relationship/work-difficulty overlap. Those facts do not restore the old
  complete premises, but retiring a premise is not proof of a universal miss.
- Retire obsolete hard distinctions rather than count easy wins. Final retired
  original hard indices are **13, 34, 45, 57, 80 and 93**. In particular, revised
  Berlin is not the old homeless-street-singer twin; Lee's voluntary contribution
  is not imposed leadership; Lamarr's paperwork is not ignored science.
- Demote new Lamarr-versus-Marshall and Rogers-versus-Graham examples to ordinary
  positives. Those different foregrounds do not supply sufficiently close hard
  twins. Their positive labels did not change.

The remaining revised distinctions use supported overlap: creative difficulty,
young disability, practical parenting, composer distress or relationship
separation. They do not revive old addiction, cure, ignored-genius or
appearance-dismissal narratives.

## Coverage loss is a release blocker, not a passing result

| Slice | Cases | Hard | Miss | Semantic |
| --- | ---: | ---: | ---: | ---: |
| Original baseline | 104 | 44 | 3 | 5 |
| Retained scored legacy | 71 | 23 | 3 | 3 |
| New diagnostic scored | 36 | 14 | 4 | 0 |
| Proposed scored total | 107 | 37 | 7 | 3 |

The 104 original dispositions are 58 unchanged, seven rationale-revised, six
hard-retired and **33 unresolved/unscored**. Fifteen old hard cases are among
those unresolved challenges. Thus, preserved inputs and unchanged numerical
thresholds are **not equivalent scored coverage or safety evidence**.

No conclusion here approves removing those 33 from a production baseline.
They need explicit editorial decisions about supported partial matches,
alternative coverage or an acknowledged loss of coverage. They must remain
visible alongside original-104 outcomes, not disappear into a larger aggregate
of easier new positives. Inherited, new, hard, miss and framing outcomes need
separate reporting. The approved immutable recipe cannot adopt this new file
simply because a local diagnostic improves.

## Independent semantic review of proposed routes

The initial review-only route artifact had SHA-256
`03c24c4aa5559e06981aee79d1c7186e2a32cbf52c012d4704b9a82ddaa8515b`.
Before new-benchmark measurement, the root agent removed three additions in
commit `3a666a6bc1098b39eb38a43fd28f13d75eae4cf7` after this review:

- `young child` to `new_parent_fear`: a demographic noun does not establish
  parental fear or care strain. A phrase such as "my young child died" instead
  foregrounds bereavement.
- `another activity` and `different sport` to `keep_going`: neutral preference,
  changing interests or declining an activity do not establish perseverance.

Removing those proposals is not a claim that parenting or participation inputs
have been solved. They remain routing-design needs, not excuses to alter gold.

The final artifact has four additions and one extension, all **unapproved
semantic proxies**:

| Proposed route | Remaining limitation |
| --- | --- |
| `useful criticism`, `constructive criticism` to `finding_voice` | Potential learning/expression signal, but asking for feedback, receiving unwanted criticism and declining criticism differ. The literal phrase alone cannot resolve context or negation. |
| `barely compose`, `struggling to compose` to `self_doubt` | Potential creative-difficulty signal, but lack of time, preference for performing, practical obstacles and doubt about ability are different. Difficulty does not prove a private psychological state. |
| Extend `audition` with `creative_dismissal`, retaining existing `dismissed` | An audition may be successful, anticipated happily or merely mentioned. Adding the creative category does not make the existing noun-alone rejection assumption true. |

Before any installation, contrastive context/negation fixtures and wider
regression evidence are needed. These routes were proposed for development,
not independently held-out validation. A dictionary score may aid retrieval
without establishing a reader's emotions, the selected historical rationale,
or the appropriateness of definitive framing.

## Review conclusion

No remaining concrete lineage corruption, inflated accepted-answer list or
unsupported new miss assignment was found in the frozen draft. It is an honest
proposal for further reviewed development, with the coverage loss disclosed.
It is **not** a complete migration, approved benchmark, passed real-provider
gate, permission to register/promote a recipe, or authority to publish stories.
The unresolved 33 inputs, contextual routing risks and chronological/framing
choices must not be hidden by structural checks or improved diagnostic scores.
