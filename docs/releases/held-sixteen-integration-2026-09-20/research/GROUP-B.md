# Group B: four source-grounded episode integrations

20 September 2026. Lee, Edmonia Lewis, Lindgren, and McClintock only. These are **draft candidates and matching-stage proposals**, not publication receipts or human approval. The user authorized modification where needed to make the held stories legitimate and had already authorized short source-led vignettes. All four candidates retain every reviewed `canonicalText` byte; the repairs change episode identity, matching metadata, and obsolete hold explanations rather than inventing a fuller life episode. Frozen release packets were not edited.

## Replacement decisions

| Figure | Old installed stage / ages | Proposed stage / ages | Supported reader connection |
| --- | --- | --- | --- |
| Lee | `1929-1931-harvard-pivot`, 50–54 | `1934-library-dedication`, 56 | Offering a useful part before the whole project is finished |
| Edmonia Lewis | `1862-1866-accused-acquitted-expelled`, 17–21 | `1864-requesting-useful-criticism`, approximately 19–20 | Wanting useful feedback instead of condescending praise |
| Lindgren | `1926-1929-the-secret-son`, 18–22 | `1929-1930-sharing-her-sons-care`, 22 | Needing help with a child's care without pretending the transition was painless |
| McClintock | `1951-1960s-dismissed-and-right`, 48–55 | `1961-comparison-with-open-questions`, 59 | Continuing an inquiry while acknowledging the limits of the evidence |

The old ranges above are read from the actual current `lib/figures-data.ts`, not copied from earlier release-note approximations. New proposal ages equal the new candidate episode ages exactly. Lewis's exact birthday is not established here; her age remains qualified. Lindgren's active episode ends in May 1930; subsequent family care and her much later recollection are explicitly consequences, not extensions of her age-22 action sequence.

## Fresh source access and boundaries

### Lee

Read the entire substantive [25 May 1934 Crimson report reproducing Lee's and Conant's dedication remarks](https://www.thecrimson.com/article/1934/5/25/mrs-lee-and-president-conant-are/). It grounds the dedication, incomplete larger project, and acceptance. The date is the previous afternoon, 24 May. Read the Frances Glessner Lee section of [Glessner House's family history](https://www.glessnerhouse.org/glessner-family) for birth and bridge identity only; that is owning-institution secondary context. The incompatible 1931/1932 chair-foundation dates are not resolved by choosing one, and neither is needed in the new episode. No death-triggered liberation, correspondence scene, refusal, or negotiation survives in the matching proposal.

### Edmonia Lewis

Freshly downloaded [The Liberator, 19 February 1864](https://fair-use.org/the-liberator/1864/02/19/the-liberator-34-08.pdf), rendered PDF page 3 / printed page 31, and visually inspected column 3 from the reception conversation through the complete final invitation paragraph. Child reports Lewis's wish to learn through criticism; the invitation is not evidence of a completed visit. No later legal-memoir chronology is reused. Read the artist and medium fields of the [Allen Memorial Art Museum's owned marble portrait](https://allenartcollection.oberlin.edu/objects/12270/bust-of-james-peck-thomas) as contextual anchors. Child's racial hierarchy is neither adopted nor reproduced. No quotation is introduced into the story.

### Lindgren

Read the complete relevant quotations and attribution in the [estate's published 1976–77 recollection excerpt](https://www.mynewsdesk.com/se/astrid-lindgren-aktiebolag/pressreleases/20-years-since-the-death-of-astrid-lindgren-3158100). This is retrospective primary testimony, not a contemporaneous diary. Reopened the substantive [youth chronology](https://www.astridlindgren.com/se/om-astrid-lindgren/ungdomen), especially the Copenhagen-travel and Stockholm-arrival sections, the [Lasse chronology](https://www.astridlindgren.com/se/om-astrid-lindgren/ungdomen/lasse), and the [estate biography](https://www.astridlindgren.com/se/om-astrid-lindgren). Those later estate accounts supply December 1929 illness, January 1930 co-residence, May 1930 family care, and the birth anchor; they are not mislabeled original letters. The story keeps the distinction between the primary memory and secondary care chronology. No guilt, secret-birth shame, medical advice, or marriage-as-rescue conclusion is inferred.

### McClintock

Ordinary web rendering timed out for [Edith Heard's Collège de France lecture PDF](https://www.college-de-france.fr/sites/default/files/documents/en-edith-heard/UPL4955809431944515605_COURS_I_2017_HEARD.compressed.pdf); an unauthenticated public download succeeded. Rendered page 16 and visually reread the complete visible facsimile of the 1961 paper opening, including the enlarged continuation. The paper's publication and explicit qualifications support the episode, not private distress or rejected-genius mythology. The rest of pages 265–277 was not inspected. [Nobel's facts page](https://www.nobelprize.org/laureate/428) was read via its search-rendered substantive text after direct access returned 403; it supplies the birth and bridge anchors only. No access restriction was bypassed. The `emotionalCore` proposal explicitly distinguishes an evidential position from a documented feeling. The old dismissal, withdrawal, and Nobel-vindication match claims are removed.

The research skill governed the primary-source verification; the PDF skill governed read-only visual inspection of the two facsimiles. No PDF was authored or altered.

## Matching and regression recommendations for root integration

Each `proposals/<figureKey>.stage-proposal.json` is a complete `FigureStageRow`: identity, exact new stage and ages, 2–3 shapes, all four facets, bounded rerank facts, controlled themes, seven canonical beat texts, and sources. `antiThemes` remain empty rather than adding speculative hard-negative penalties. Lee and McClintock use `keep_going` only as a broad continuation tag; this does not establish their private feelings. Lewis uses `social_constraint` and `finding_voice`; Lindgren uses the existing parenting-pressure category `new_parent_fear`, not an assertion of an undocumented fear.

Candidate **synthetic** positive fixtures, to be measured rather than presumed green:

- Lee, 56: `I want to contribute something useful, but the larger project is unfinished and I can only offer one part.`
- Lewis, 20: `People praise my work because of my background, but I want useful criticism that helps me learn.`
- Lindgren, 22: `My young child has come to live with me and I cannot keep work and his care going alone; my parents offered to help.`
- McClintock, 59: `I am working on a comparison, but the evidence is incomplete and I do not want to pretend my answer is certain.`

Possible retrieval phrases are `useful contribution` / `unfinished project`, `useful criticism` / `condescending praise`, `share my child's care` / `parents offered to help`, and `evidence is incomplete` / `leave the question open`. Keep them tied to these limited situations, not generic praise, all uncertainty, or all parenthood. This agent did not edit the keyword map, vocabulary, gold data, prompt, or recipe.

The existing `evals/match.json` labels for Lee's trapped life, McClintock's ignored-but-certain work, Lewis's acquitted-but-expelled claim, and Lindgren's secret pregnancy must not remain positive gold for these replacement episodes. Preserve the synthetic inputs as negative/partial-match regression coverage or reassign only after reviewing a genuinely supported alternative. Also revisit inverse `plausibleWrong` references and explanatory notes (Graham/Chandler/Rustin/Angelou), and the McClintock semantic case. Do not delete hard tests merely to obtain a passing percentage. This is a changed dataset that needs fresh baseline and real-rerank evidence, not proof from the old baseline.

## Safe old-stage handling

The four old identities are **superseded**, not silently renamed in database rows. Root should install new stage rows and new draft StorySpecs under the proposed identities only through the normal library-content release process. Keep old draft StorySpecs and stage rows non-serving for audit and any foreign-key references; do not delete or rewrite historical session artifacts. Lee's previously proposed 1934 draft uses the same new identity and may be updated only if its exact draft baseline is verified. Old matching prose must not remain another retrievable stage alongside its replacement. Verify no old stage has a published spec before any status change; if reality differs, stop and use the normal immutable retirement workflow. No DB queries, writes, environment changes, seed commands, or Git operations were performed by this agent.

## Local verification

All four passed strict candidate parsing, draft validation, and in-memory publication simulation with **0 errors / 0 warnings**. Empty review and draft status were preserved. The unmodified `check-figure.ts` checking function was executed against each proposal as an in-memory fixture; all passed, including controlled-theme membership. Proposal identity, exact age equality, seven beat texts, and equality with the previously reviewed canonical prose were asserted. Canonical artifact composition and serialized replay passed against the selected recipe's local manifest, using synthetic input and fixture-only reviewer labels. Those labels were never written to a candidate. This is structural/composition evidence, **not** provider-eval, production, or owner-review evidence.

| Candidate | Words | SHA-256 |
| --- | ---: | --- |
| `lee-1934-library-dedication-v1.candidate.json` | 199 | `a0d3738d7a7ff5a2acfa460da73c23fb5d23866a560ac568263680ee2fe37dba` |
| `lewis_e-1864-requesting-useful-criticism-v1.candidate.json` | 169 | `dd4d96567a72738f21d9f112e036620bae9a2527b2fe653319399bf36659fb38` |
| `lindgren-1929-1930-sharing-her-sons-care-v1.candidate.json` | 187 | `be4202e97347ec28c73e10e638029d4ff2fbd68c71abb45ecac6b81c294344ea` |
| `mcclintock-1961-comparison-with-open-questions-v1.candidate.json` | 167 | `d6b91589849b6e30e94970f3daa08f81ebb877ac0ed9d7a2ce1846f1ecc1f445` |

Root still needs shared-library integration, exact old-stage rollout verification, fresh matching evaluation, independent cross-review, and a new owner review of the changed matching context. These checks cannot be replaced by the fact that the prose was previously reviewed.
