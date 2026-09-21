# Poitier and Rudolph: honest chronology envelopes

20 September 2026. The user authorized modifying unresolved stories into legitimate supported versions. These two proposals change the **identity, chronology contract, matching range, and matching premise**, not merely a hold checkbox. Both remain `draft` with empty review; all canonical reader prose is byte-identical to the frozen set-2 candidates. No precise event year is newly asserted.

| Figure | Superseded identity | New undated identity | Candidate and proposed matching ages |
| --- | --- | --- | --- |
| Poitier | `1943-1945-dishwasher-to-second-audition` | `early-auditions-and-trial-training` | 15–19, qualified outer envelope |
| Rudolph | `1945-1953-the-brace-years` | `childhood-basketball-to-track` | approximately 5–16, qualified outer envelope |

Both omit `episode.startDate` and `episode.endDate`. The stage labels do not smuggle calendar dates back into the matching surface. The ages are conservative comparison boundaries, **not** a claim that every episode event is securely dated or that every age in the range occupied the same situation. Exact dating remains uncertain and is disclosed in candidate content notes, limits, and proposed rerank facts.

## Poitier: the conflict is retained

Freshly reopened the [1989 Pinewood Dialogue transcript](https://movingimage.org/wp-content/uploads/2020/12/63_programs_transcript_pdf_228.pdf), especially printed pages 2–4: the first audition recollection explicitly gives fifteen; the later passage describes trial classes and continuing doubt. Freshly read the [Academy of Achievement biography and selected 2009 interview answers](https://achievement.org/achiever/sidney-poitier/): the institutional biography places the first audition after Army service, whereas the interview supplies the cleaning offer, separate return, and desire to learn. These are different source tiers and are not silently harmonized. [IBDB's birth and Lysistrata record](https://www.ibdb.com/broadway-cast-staff/sidney-poitier-15894) gives an October 1946 professional debut at nineteen, used only as an external upper bound. The story ends before that debut. No video/audio was independently audited during this integration.

The new matching premise is **unsuccessful auditions followed by asking for instruction and uncertain trial admission**, not deficient speech, an accent determining worth, or guaranteed vindication. `creative_dismissal` and `keep_going` are the broad routing tags. His remembered distress stays attributed to him. No facet adopts a gatekeeper's assessment as truth or instructs readers to work unpaid.

## Rudolph: the boundary is inferential

Web rendering of the [University of Arkansas Press excerpt](https://www.uapress.com/2015/06/23/foxes-not-oxes-an-excerpt-from-a-spectacular-leap/) returned 502, but a normal unauthenticated fetch succeeded. The complete substantive excerpt was independently read, including the autobiographical quotations and the surrounding biographer's school-sport sequence. Its school-at-seven after two brace years statement implies approximately five; it does not directly date the initial brace use. The [Olympic museum's first-Olympics-at-sixteen statement](https://usopm.org/wilma-rudolph/) supplies an outside upper boundary, not the year of the track tryout. The exact seventh/eighth-grade years remain unestablished. The candidate's age fact is now **`probable`**, correcting its former `documented` classification for this inferred envelope.

The new matching premise is **family-supported entry into school sport, limited basketball playing time, and an invitation to try another activity**. `disability` and `keep_going` do not imply a cure, medical defiance, or an illness-created competitive personality. The quoted recollections are primary testimony mediated by the publisher; the school details remain secondary narration. No full memoir, endnotes, medical record, or AAPB recording was inspected or newly relied upon. Do not turn an adult reader's present mobility situation into a promise to repeat an Olympic outcome.

## Integration and selection constraints

The complete proposed rows live in `proposals/poitier.stage-proposal.json` and `proposals/rudolph.stage-proposal.json`; candidate filenames are in the table below. New rows must supersede the old dated matching identities rather than leave both available for retrieval. Preserve non-serving old drafts and session references; do not rename primary keys, delete historical rows, or rewrite frozen artifacts. Root owns shared-library, matching, evaluation, and eventual rollout changes. No database or environment access occurred here.

Possible **synthetic, untested** fixture directions:

- Poitier, 18: `I practiced for an audition and still did not get in; I want a chance to learn, but even a trial place would be uncertain.`
- Rudolph, 18: `I joined a team but mostly sit on the bench; I am considering another activity without knowing whether I will like it.` This adult fixture is outside the historical envelope by two years; do not silently change its age or force a positive result. Treat it as a proposed partial connection to evaluate, not proof of an age-identical experience.

Keep negative coverage for accent-as-worth and cure-by-ignoring-treatment prompts. An age range is a matching aid, never evidence that a source's chronology has been resolved. Existing positive fixtures that depend on precise old dates, a guaranteed breakthrough, or medical defiance require substantive re-review, not removal merely to improve a score.

## Local verification

Both candidates pass strict parsing, draft validation, and in-memory publication simulation with **0 errors / 0 warnings**. All seven canonical texts equal the old packet exactly. Proposal identity, exact candidate-age equality, date omission, controlled themes, and seven beat texts were asserted. The existing `check-figure.ts` checking function passed against the proposed rows as an in-memory fixture. Canonical composition and serialized artifact replay also passed using the selected local recipe manifest, synthetic input, and fixture-only reviewer values that were never written to the candidates. This proves structural compatibility, not matching quality, production publication, or human review.

| Candidate | Words | SHA-256 |
| --- | ---: | --- |
| `poitier-early-auditions-and-trial-training-v1.candidate.json` | 241 | `03d0eae3b03deaa271e389ba82657ce21e5edc1806f3ae6f541861e3e1274093` |
| `rudolph-childhood-basketball-to-track-v1.candidate.json` | 181 | `aa4eafe1c1e6745d571d28a2f11545b952e416c361cee4992213c5062705aa54` |
