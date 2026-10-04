# Source labels for the new three-story coverage set

Prepared October 3, 2026 for independent static review. The labels and inputs were authored before any matching measurement on these cases. This is a synthetic set, with no real reader records and no publication approval.

The companion [NEW-THREE-MATCH-CASES.json](NEW-THREE-MATCH-CASES.json) contains exactly **12 cases**: nine new positive cases, three per proposed figure, followed by three unchanged existing miss controls. Its proposed registration name is `synthetic-new-three-12-2026-10-03`. The current 104-case regression set remains a separate release gate; passing these twelve cannot replace passing that gate.

## Authoring method and context

The author read the installed 60 figures' age ranges, themes, shape sentences, and four facets from actual current-main `lib/figures-data.ts`, then the three proposed stage packets and their source qualifications. The JSON records all 60 existing figure keys, the context hash, and the exact new-stage hashes. The base is `405f82357351723da6000b9a169999f3c7975191`; the complete proposed context contains 63 figures.

Cases are short imagined present-day intake descriptions. They translate a documented predicament into ordinary language; they are not historical quotations, claims that a figure experienced every intake emotion, or adaptations of the canonical story text. Labels follow the source episode's cause, available action, and unresolved constraint. Ages fall within the proposed figures' bounded episode ranges rather than being chosen from observed matching results. The author did not inspect ranks, keyword matches, score explanations, or provider outputs for these cases. No new case is marked `hard` or `semantic`; no unmeasured claim of keyword absence is made.

Only S1 has an accepted alternative. Its omitted occupation and cause leave a real ambiguity with Grant, supported by his own letters. The other labels do not acquire alternatives merely because another figure shares a theme. These expected labels are a source judgment open to independent static review, not a claim that a specific model must infer identity from every short description.

## Primary sources and confidence

- **Franklin:** [*Autobiography*, Part I](https://www.gutenberg.org/files/148/148-h/148-h.htm), from the shop quarrel through the opening partnership shop. Paragraph-opening locators below identify the evidence. This is later recollection, so the packet treats memory-based claims as probable. [Library of Congress chronology](https://www.loc.gov/item/today-in-history/january-17/) and [National Park Service printing chronology](https://home.nps.gov/inde/learn/historyculture/people-franklin-resume.htm) bound the episode to approximately 1727–1728, ages 21–22.
- **Somerville:** [*Personal Recollections*, Chapter XI, pp. 161–172](https://www.gutenberg.org/files/27747/27747-h/27747-h.htm), late-life recollections, her daughter's recollections, and reproduced review letters. The March 27, 1827 request and November 2, 1831 acknowledgment bound the episode to ages 46–50. The initial review letter is undated; the more extensive criticism is dated February 23, 1830. Source distinctions are retained in the packet.
- **Slocum:** [*Sailing Alone Around the World*, Chapters I–II](https://www.gutenberg.org/files/6317/6317-h/6317-h.htm), published 1900, describes the midwinter 1892 offer, thirteen months of rebuilding labor, trial, intermittent work, and failed fishing before April 24, 1895. The [Martha's Vineyard Museum archival finding aid, Historical Note](https://mvmuseum.org/fa_pdfs/RU%20336%20--Joshua%20Slocum.pdf) supplies birth February 20, 1844. The conservatively bounded episode ages are 47–51. Neither launch nor fishing is assigned an invented exact year.
- **Grant, alternative only:** [*Letters of Ulysses S. Grant to His Father and His Youngest Sister, 1857–78*](https://www.gutenberg.org/files/13471/13471-h/13471-h.htm), especially October 1, 1858; March 12, 1859; August 20, 1859; September 23, 1859; and October 24, 1859. Grant discusses seeking work, uncertainty over his new business, earning a living, a refused position, and continued unemployment. The original letters, not editorial speculation, support the alternative.

## Nine positive labels

The identifiers below are document labels; array order is authoritative. Numbering is one-based.

| Case | Array position | Age | Expected figure | Accepted alternative |
| --- | --- | --- | --- | --- |
| F1 | 1 | 21 | `franklin_b` | none |
| F2 | 2 | 22 | `franklin_b` | none |
| F3 | 3 | 22 | `franklin_b` | none |
| M1 | 4 | 46 | `somerville_m` | none |
| M2 | 5 | 48 | `somerville_m` | none |
| M3 | 6 | 50 | `somerville_m` | none |
| S1 | 7 | 48 | `slocum_j` | `grant` |
| S2 | 8 | 49 | `slocum_j` | none |
| S3 | 9 | 50 | `slocum_j` | none |

**F1 — public conflict, exit, and a constrained return.** Franklin's paragraphs beginning `Keimer, being in the street` and `He came up immediately` describe public reproach, his anger, harsh words on both sides, notice, and immediate departure. `I applied to Bradford` reports no vacancy; the following passage reports the civil invitation and Meredith's encouragement to return. The intake sits before a possible return rather than inventing reconciliation. Bly's voluntary exit from restricted reporting, Faraday's class-bound indignity, and Riis's entry into a first unpaid newspaper opportunity have different triggers and choices. Ordinary hatred of office life lacks this documented sequence.

**F2 — skill, insufficient capital, and a dependent partnership.** `Meredith came accordingly` through the equipment inventory records Franklin's objection that he has no money, Meredith's proposal of funds from his father, agreement, and ordering of equipment. The target has practical skill before starting; this is not a story of first learning a trade. Riis's first-job opportunity and Banting's research idea in an empty clinic lack the proposed partnership funded through another person's family. No claim is made that Franklin was independent once the promise existed.

**F3 — a meaningful first payment without settled success.** `We had scarce opened our letters` and `All our cash was now expended` record an acquaintance bringing the first customer, five shillings, and Franklin's pleasure and gratitude. The subsequent doorway stranger predicts failure and leaves him half melancholy. The later low-paid, interrupted work prevents a lasting-success label. A first payment may resonate with Riis or Banting in isolation, but the intake also carries a prepared partnership business, spent setup funds, discouraging business forecasts, and ongoing poorly paid work.

**M1 — an experienced self-taught reader fears an explanatory task.** Chapter XI's request, visit, and conditional agreement show that Somerville already knew advanced mathematics but believed her self-acquired knowledge inadequate beside formally educated men. She accepts under secrecy and destruction if the effort fails; no actual destruction is implied. Graham's inherited responsibility after bereavement and Lee's later permission to study do not supply this technical-writing request. The label does not assert actual intellectual inferiority.

**M2 — private writing repeatedly interrupted by social and family demands.** Chapter XI describes early family arrangements, visitors during difficult problems, the perceived inability to excuse herself on business grounds, learning to leave and resume work, and papers hidden when the bell rang. The intake joins the secrecy with that ordinary social constraint. Nightingale's illness-constrained work and Chandler's career rebuilding after alcohol-related job loss do not explain these interruptions. No exhaustion diagnosis or family hostility is invented.

**M3 — praise, specific correction, and limited accessibility.** The undated Herschel review praises the manuscript while identifying errors. Somerville remembers pride and happiness. His February 23, 1830 letter calls for more clarity and expansion; the November 2, 1831 acknowledgment and her account of the book's preface establish a published work for mathematical readers. Age 50 describes the published endpoint, looking back on the earlier review rather than redating it. McClintock's rejection by a scientific field and Graham's doubts about inherited authority have different feedback relationships. The label does not claim all requested revisions were completed or that publication removed the difficulty.

**S1 — broad work scarcity and an open question about earnings.** Chapter I describes difficulty entering shipyard work because of a fee, too few ships for available commands, rebuilding labor, and repeated questions about whether it pays. These facts support a practical project amid limited ordinary work; they do not establish inability to afford the fee, total unemployment, poverty, or despair. Because the intake deliberately omits occupation and cause, Grant's letters about uncertain business and finding a living are a legitimate alternative. His installed ages 36–39 remain within the existing ten-year age allowance at intake age 48. Chandler's internally caused job loss and novice writing, Wang's specific institutional rejection, and Child's established extended cookbook project are less close to the open work-scarcity structure; no decorative alternatives are added.

**S2 — uncertainty about a construction method under outside criticism.** Chapter I's first sealing work, visitors' warnings, consideration of hiring a professional, and his already planned additional sealing thread support this bounded method question. The source contains two warning visitors and broader commentary, not proof everyone doubted him. The intake avoids predicting actual failure: the completed method held. McClintock's intellectual conviction against a field's disbelief and Graham's uncertain authority are not this hands-on construction decision. No invented failed repair, despair, or new conversion to confidence is required.

**S3 — a working result whose use for income still fails.** Chapter I records completed construction and a successful short trial with the donor. Chapter II records the failed fishing season before departure. The intake's age 50 falls inside the conservative 47–51 range; it does not date either event exactly. The label links physical completion to a later unsuccessful use without inventing an amount lost or lack of all other income. Grant's failed business attempts did not culminate in the same completed object and successful trial; Sanders's loss of a functioning restaurant involved a changed external road. Completion is therefore not treated as a complete cure for uncertainty.

## Three unchanged miss controls

Array positions 10–12 copy existing `evals/match.json` zero-based indexes **5, 20, and 21** without changing any object field, wording, age, expected label, or note:

| Array position | Existing index | Age | Existing expected label | Coverage |
| --- | --- | --- | --- | --- |
| 10 | 5 | 22 | `miss` | Friendship drift |
| 11 | 20 | 30 | `miss` | Numbness despite apparently adequate circumstances |
| 12 | 21 | 45 | `miss` | Ordinary office dissatisfaction |

They remain controls rather than new authored claims. The original 104-case file SHA-256 is `f87962a57990f65a8765afdcd141bbdd1c3b9f5a965d04f4810f1787d8aa2a1e`. A miss is evaluated under the existing evaluator's partial-framing rule; it is not a requirement to select a special figure key. Root will run this coverage set separately from the unchanged current regression set.

## Freeze and next step

The separate freeze receipt records the JSON and this document's SHA-256 values, count checks, unchanged-control equality, new-stage hashes, and zero matching/provider measurements. No matching tests or providers were called by this author. Independent source-and-label review is the next step; any review revision must preserve this initial version and establish a new freeze before measurement.
