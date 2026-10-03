# Independent cross-review: education drafts

Reviewed on 2026-10-02 by the vocation research agent. This is an independent source and craft check of the education agent's three pairs. It supplies no publication approval: all saved candidates remain `draft`, with `review={}`. No education file was edited by this reviewer.

## Outcome and actions

No unresolved factual contradiction was found in the checked chronology, actions, stated reasons, or ages. Two source/editorial corrections were sent to the author, applied, and rechecked:

- **Blackwell locator corrected:** the later medical college appears in Chapter **VI**, pp. 237–239, rather than Chapter V. Candidate fact/source locators, stage sources, and completion document now agree.
- **Keller language corrected:** the became passage now says, “She did not yet form full sentences herself.” The prior fluency phrasing could be mistaken for oral speech; the teaching record concerns manual language.

Two explicit craft limitations remain for human review before publication:

- **Keller dark passage:** it recounts recurring, undated communication failures before the teacher arrived. The source and completion document disclose this, but it does not satisfy the recipe's R2 requirement that the dark passage occupy one short moment. Preserve that limitation; do not invent a dated incident.
- **Blackwell response:** obtaining prospectuses and sending twelve applications is an attested action sequence, but the memoir supplies neither one location nor one short session. It is summarized in the response, where R2 permits a single moment. The author now explicitly acknowledges the compression in the response source note and completion scope. Editorial review must decide whether this shape is acceptable.

These are craft holds, rather than reasons to misstate the source or to publish automatically. Washington has a source-supported arrival, night's shelter, dawn request, and cleaning test that fit the four moment roles more closely.

## Primary records reopened and bounded checks

### Helen Keller

[The Story of My Life](https://www.gutenberg.org/files/2397/2397-h/2397-h.htm) was reopened at Part I, Chapter II, paragraphs beginning “I do not remember when I first realized” and the following anger paragraph; Chapter IV, porch, next-morning doll, copied letters, and water recognition paragraphs; and Part III, Education, Sullivan's March 20, April 3, April 5, April 10, and April 24, 1887 letters.

These support the waiting scene, copied fingers, object-name confusion, washing question, cold water, dropped cup, requests for names, and continued practice. Sullivan's April 24 account concerns one-word manual requests. Interior recognition remains probable and supported by Keller's retrospective account rather than asserted from an observer alone. The April 5 letter's later postscript complicates day precision; the prose avoids an exact day. Keller's recurring anger is supported but undated.

[AFB chronology](https://www.afb.org/about-afb/history/helen-keller/biography-and-chronology/chronology), June 27, 1880; February 1882; March 3 and April 5, 1887 entries, supports six throughout the episode, lasting sight/hearing loss, and unknown diagnosis. [AFB biography](https://www.afb.org/about-afb/history/helen-keller/biography-and-chronology/biography), opening full-name paragraph and Political and Social Activism section, supports the bridge identity. A recognizable event can reveal identity despite formal anonymity; the completion document acknowledges this.

### Elizabeth Blackwell

[Pioneer Work in Opening the Medical Profession to Women](https://www.gutenberg.org/cache/epub/65496/pg65496-images.html) was reopened at Chapter III, June 1–2 journal and May 24 letter, pp. 58–63; smaller-school application paragraph, p. 64; October 20, 1847 invitation and resolutions, pp. 65–66; November 15, 17, 24 journal entries, pp. 71–72; study/seat paragraphs, pp. 73–74; Blockley paragraph, pp. 80–81; January 23, 1849 journal, pp. 87–88; and further-experience paragraph, p. 92. These support refusals, twelve applications, unanimous admission, continuing exclusion, degree, and unfinished training. The “practical joke” explanation is appropriately absent.

Chapter IV's cousin letter, pp. 118–119, states her February 3, 1821 birth: twenty-six in 1847 and twenty-seven at the January 1849 degree. Chapter VI, pp. 237–239, supports the corrected bridge role. Reproduced dated correspondence/journals are documented; connective memoir narration remains probable. The receiving-letter turn is supported, while the application response remains compressed.

### Booker T. Washington

[Up from Slavery](https://www.gutenberg.org/files/2376/2376-h/2376-h.htm) was reopened at Chapter I's uncertain-birth opening; Chapter II's name paragraphs; Chapter III's autumn departure, Richmond arrival, sidewalk shelter, iron-unloading request, saving, waiting, sweeping, handkerchief inspection, janitor work, board/tuition, books, socks, and clothing paragraphs; and Chapter VII's May 1881 school appointment. These support the concrete actions and continuing dependence on work and assistance. The prose does not import imagined despair: the memoir expressly retains hope during the night.

[NPS Washington timeline](https://www.nps.gov/bowa/learn/historyculture/washington-timeline.htm), 1856 and 1872 entries, supports about sixteen. The probable age atom preserves the disagreement with his own uncertain recollection; the 16–17 range allows undated early student life. The became passage stays with early school costs and material shortages, without borrowing graduation or later political fame.

## Classification, content profile, and fold

Every historical sentence is mapped to fact atoms. Contemporary records and retrospective memories are distinguished; no generated quotation or unmarked invented texture was found. No new content flag is required by the actual reading copy: Keller's `serious_illness` covers lasting loss, and Blackwell/Washington's `discrimination` covers educational exclusion and the episode's racial barriers. The notes describe the practical hardship without suggesting that disability or discrimination was cured.

All fact atoms are declared required or optional in at least one passage, so the transparency projection retains their mapped evidence; Keller's illness context is included. Stage biographical facts are episode-scoped and omit the bridge's later fame. Stage beat text and role order exactly match the candidate. The seven-role shape, first-two-sentence age, anonymity, fixed bridge distance sentences, bounded permissions, and mechanical sentence limits pass. Mechanical validation does not resolve the two R2 limitations above.

## Exact reviewed artifacts and local verification

Executed `npx tsx docs/research/new-stories-2026-10-02/check-education-independent.ts` after the author's two corrections and Blackwell response-compression disclosure. Strict parser accepted each candidate. Draft validation and a separate in-memory publish simulation each returned zero errors and zero warnings. The simulation assigns placeholder reviewers only in memory; saved status and review remain untouched. Stage/candidate prose parity is true; no unknown controlled themes, unused fact atoms, or sentence-length exceptions remain.

| Pair stem | Words | Candidate SHA256 | Stage SHA256 |
|---|---:|---|---|
| keller-1887-learning-that-things-have-names-v1 | 700 | `f22c3d72571e23bb7724d55417f6bd8b348dbd0a10ae777b51968c3cd3f03f38` | `a1a3dbf3462a653a77c69a0c43fc71277c2a3466e98b5be079be6a0e6d8eef99` |
| blackwell_e-1847-1849-a-place-to-study-v1 | 704 | `00603068c790572fcd006caef825c0623980258ab243d176d8be4b9f55d2470b` | `b9008cdf3d9d3e76e95c360dadbc5364c8accc43a2e1127b46296fdeac524557` |
| washington_b-1872-reaching-the-classroom-v1 | 703 | `4f3f3802b6ccb30c0f0ef817d9ce650a331682066237eca39dfb3158a2a6cc55` | `0bcd6d3752ccc0073354a15f901a36eef2df13db7d7e47a61bc5d69c3defbfe8` |

Each row refers to the `.candidate.json` and matching `.stage.json` under this research directory. Tracked completion reading copies and hash records are in `docs/releases/new-stories-2026-10-02/{keller,blackwell_e,washington_b}.md`.
