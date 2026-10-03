# Independent source and craft check — Rogers, Poitier and Rudolph

20 September 2026. Reviewer: delegated group-A research agent. These three drafts were authored by other agents. This is a source/craft review, **not owner approval, production authorization, an audio audit or a passed matching release**. No candidate, proposal, installed library, database or Git state was changed by this review.

## Exact inputs reviewed

| Figure | Candidate SHA-256 | Stage-proposal SHA-256 |
|---|---|---|
| Rogers | `36643a930b36c7e4153777075ef7d561b842487d074c9e833c57119240e621af` | `01d339cfdb2d7533fc533ad6faa692e04bcd430c77294e552baa8156967bd429` |
| Poitier | `03d0eae3b03deaa271e389ba82657ce21e5edc1806f3ae6f541861e3e1274093` | `1a59ed77f61b77828736e9e15a8db395a7fde2f85b06d631e97744c25c803446` |
| Rudolph | `aa4eafe1c1e6745d571d28a2f11545b952e416c361cee4992213c5062705aa54` | `ff0a58bfd732e05886d42014087f39144dd8b039e8c795efd6b1d981f036e047` |

Candidates are under `set-2/`; corresponding rows are under `proposals/`. Any subsequent correction must receive a new hash and explicit verification receipt; this record is not approval of unseen later bytes.

## Rogers — three concrete corrections before freezing

1. **The current exact hearing date is not established by its cited locator.** The [AAPB catalog](https://americanarchive.org/catalog/cpb-aacip-516-t72794201n) explicitly labels May 1, 1969 as the **broadcast date**. Its series description describes hearings on April 29 and 30. The [owning Rogers page](https://www.misterrogers.org/videos/pastore/) identifies the event only as 1969. This does not prove that the widely repeated May 1 event date is false; it does mean the candidate currently promotes one metadata field into an exact event date despite an internal catalog conflict. The safe bounded repair is to remove exact `startDate`/`endDate`, describe the spring 1969 hearing, and disclose the catalog conflict in the source locator and chronology fact. The year-based new stage ID can stay. Age 41 is still supported: [WQED's PBS documentary transcript](https://www.pbs.org/video/our-neighbor-fred-rogers-qmsiqr/) explicitly gives March 20, 1928, and all dates at issue fall after that birthday. Alternatively, establish an exact event day from a separate first-party hearing record before restoring day precision.
2. **Scene omits the age.** The draft has an age fact but no age in its first two sentences, contrary to the current recipe. Add forty-one to the opening and map that sentence to the age fact; mirror the same text in the proposal. This is a readily fixable craft gap, not a reason to invent chronology.
3. **Self-description became outside reputation.** The turning point says the senator had a reputation for toughness. The [hearing transcript](https://americanarchive.org/catalog/cpb-aacip-516-t72794201n), in the goosebumps exchange, establishes what the senator said about himself, not an independently verified reputation. Replace the clause with a bounded paraphrase such as “though he described himself as tough.” Keep the reported response separate from any inferred inner transformation.

A smaller precision improvement is to replace “That was the hearing's response” with a sentence referring to the senator's reply. One speaker's favorable statement should not become a collective committee verdict. This is not a claim that the current sentence promises an appropriation; it is an avoidable ambiguity.

### What the sources do support

I freshly read the AAPB transcript's Rogers segment from program length through the closing song exchange, the event metadata and the surrounding final funding discussion. It supports the short daily program, an earlier interruption in production funds, community support, the argument for representing ordinary childhood feelings, his production responsibilities, the favorable verbal response and a song concerning choices when angry. I did **not** listen to the soundtrack or independently verify every transcript word. No lyrics, exact quotations or audio-performance details are needed for this draft.

The draft correctly places the earlier production funding interruption in recalled background, not on the hearing day. It does not conflate that shortage with a final congressional appropriation. The later AAPB discussion expressly distinguishes authorization, funding and future votes; the new story properly stops at a favorable response. No solitary “saved public television” causal claim is supported or needed. [AAPB transcript and metadata](https://americanarchive.org/catalog/cpb-aacip-516-t72794201n).

### Craft and fit

As an authorized source-led miniature, there is a legible sequence: explain the program, name the earlier practical limit, show its care through examples, describe the work, receive a favorable response, leave with no promised fiscal outcome. It is not a full interior low/failed-effort/recovery arc. The dark-moment slot already contains help, and the struggle slot is explanation rather than an unsuccessful attempt; the draft openly names those exceptions. Do not add fear, humiliation, stage fright or a hostile senator to manufacture a stronger arc.

The replacement matcher describes **explaining caring work to a decision-maker**. It does not support childhood bullying, rejection for difference or a cure story. The coarse phrase “quiet work” is an editorial framing of the testimony, not evidence of Rogers's private feelings. Reader permission predicts no result. The source-led form is complete at its modest endpoint, subject to the three corrections above; it is not a full-recipe length pass.

## Poitier — legitimate uncertainty, not a newly solved date

Fresh readings: the [Museum of the Moving Image's 1989 interview transcript](https://movingimage.org/wp-content/uploads/2020/12/63_programs_transcript_pdf_228.pdf), printed pp. 2–5; the relevant audition/job passage in [PBS American Masters' 1998 interview transcript](https://www.pbs.org/wnet/americanmasters/archive/interview/sidney-poitier-interview-2/); the institutional chronology and audition/admission answers in [the Academy of Achievement's 2009 record](https://achievement.org/achiever/sidney-poitier/); and the owning [IBDB birth and debut record](https://www.ibdb.com/broadway-cast-staff/sidney-poitier-15894). No interview audio was independently audited.

His 1989 account explicitly gives fifteen at the first audition. The Academy's biographical chronology instead places it after Army service. IBDB supplies birth on February 20, 1927 and the October 17, 1946 opening of *Lysistrata*, providing an external age-nineteen upper bound on the preceding training episode. **15–19 is a defensible qualified comparison envelope, not the dates of a demonstrated four-year episode and not a resolution of the conflict.** The new undated stage ID, teenage scene wording, probable confidence and explicit qualification correctly avoid making the contradiction disappear.

The bounded story is coherent: early rejection, recalled preparation, another rejection, a cleaning-for-classes offer, later trial admission and continuing doubt from teachers. The 2009 source distinguishes the woman at the desk from the later admission encounter; the draft preserves that separation. The 1989 account supports the insecure first-term endpoint, so a promised triumph is unnecessary. The current proposal does not present accent modification as proof of intelligence or human worth. No additional factual fabrication was found in these checked claims.

For integration, label this **coarse matching age with unresolved exact chronology**, and test the age-filter consequences. A reader aged nineteen is not evidence that the first audition occurred at nineteen; a reader aged fifteen is not evidence every narrated event happened then. Do not report this as an exact-date repair or use it to silently relabel historical gold cases.

## Rudolph — a wider and weaker chronological envelope

Fresh readings: the complete substantive [University of Arkansas Press excerpt](https://www.uapress.com/2015/06/23/foxes-not-oxes-an-excerpt-from-a-spectacular-leap/), fetched through an ordinary unauthenticated HTTP request after the web renderer failed, and the birth/competition fields and bounded Olympic paragraph of the [U.S. Olympic & Paralympic Museum record](https://usopm.org/wilma-rudolph/). The full 1977 autobiography was **not** accessed. Primary recollections quoted by the publisher remain distinct from its surrounding biographical narration; the draft is honest about that distinction.

The publisher places school entry at seven after two brace years. About five is arithmetic from that account, not a separately dated medical event. The museum supplies the first Olympics at sixteen. The **5–16 range is only an outer childhood-to-pre-Olympic envelope**. It does not establish ages for seventh-grade basketball, the later season or the track invitation. This is a much wider interval than Poitier's and includes background childhood material, not only the sports foreground.

The checked excerpt supports limited basketball participation, the coach's invitation and the initial practical interest in trying track. The draft does not add brace-removal instructions, medical defiance or an athletic cure. Attributing the initial motive to the published account avoids passing biographical narration off as firsthand speech. The bridge identifies later achievement without asserting it was guaranteed by this tryout.

This is an honestly qualified source-led vignette, but **not a solved precise-age stage**. The release must preserve that visible qualification and examine whether such a wide age span is acceptable for this matcher. It should not claim that a child at five and a teenager at sixteen had the same immediate sporting situation, or that primary documentation establishes exact school years. If exact episode-age correspondence is mandatory, this stage still requires a better-dated episode or a separate handling of uncertain ages; cosmetic metadata wording alone cannot supply that evidence.

## Release-level conclusion

Rogers has three fixable source/craft issues identified above. Poitier and Rudolph make their remaining chronological uncertainty materially more honest; neither should be described as having recovered dates the sources do not supply. Their coarse envelopes may be a deliberate editorial matching choice, but that choice and its measured age-filter effect must remain separate from historical certainty. Structural validity, an unchanged public catalog and human permission to shorten stories do not substitute for that distinction.

## Rogers correction verification — 20 September 2026

The root author supplied corrected files after the initial review. I reread both complete corrected documents. The historical hashes and findings above remain the record of the original inputs; this receipt applies only to these replacement bytes:

| Artifact | Verified SHA-256 |
|---|---|
| `set-2/rogers-1969-speaking-for-childrens-television-v1.candidate.json` | `46f0d7fdb5896f478d08d49d598ae06c2426301b1f6e5118e6dcbb8c5d47bfdb` |
| `proposals/rogers.stage-proposal.json` | `b85312a8b74969c196923b98a3318d7e87525740ac49be7557f6989adcde0d78` |

All three requested corrections are present. The scene states age forty-one and maps it to the age fact. Toughness is now the senator's self-description. Exact episode dates are omitted; spring 1969, the broadcast-versus-hearing metadata conflict, and the supported age calculation are expressly recorded. The additional precision suggestion is also adopted: the ending calls the favorable statement the senator's response, not the hearing's collective verdict. These changes resolve the identified source/craft defects without inventing distress or a fiscal outcome.

A read-only local check using the existing StorySpec parser and draft validator completed with zero errors and zero warnings. Assertions verified the two age bounds, omitted exact dates, scene age evidence, all seven candidate/proposal text and source-note pairs, draft status and empty persisted review. This was not a production simulation, provider match run, audio audit or approval. The short-vignette qualifications and independent release/owner-review requirements above still apply. No candidate or proposal was edited by this reviewer.

## Supplemental Carver chronology boundary finding

The group-B reviewer raised a valid lower-bound arithmetic issue in the group-A Carver proposal. Its cited [NPS study, executive summary p. vii](https://www.govinfo.gov/content/pkg/GOVPUB-I29-PURL-gpo236603/pdf/GOVPUB-I29-PURL-gpo236603.pdf) treats birth as approximate, and [Simpson's institutional collection record](https://www.simpson.edu/academics-programs/dunn-library/archives-special-collections/george-washington-carver-collection/) supplies 1890–1891 attendance. Those sources were already read for group A; this supplemental check does not claim a new manuscript or birth record.

Given the proposal's stated 1864–1865 birth uncertainty, an 1890 arrival before a possible late-1865 birthday permits age twenty-four. No inspected source rules out that boundary. The conservative matching envelope is therefore **approximately 24–27**, not 25–27. This is a qualification of uncertain chronology, not a newly established exact age. The retained “mid-twenties” prose is compatible; metadata, fact statement, content note, findings and any integration checks that encode the prior lower bound must agree. This issue was reported to the root author for correction; no input bytes were changed here. The previous group-A validation receipt applies to its then-current bytes and cannot stand in for verification after this correction.

### Carver correction verification — 20 September 2026

Root corrected the candidate, proposal and group-A findings. This receipt verifies the following bytes without changing them:

| Artifact | Verified SHA-256 |
|---|---|
| `set-1/carver-1890-1891-laundry-and-college-v1.candidate.json` | `03716d035b9228da8c891a2de1cc48a7345f75de7a75da4b0ad6b1912ed5ec0d` |
| `proposals/carver.stage-proposal.json` | `68eadf05b8b6592c8f67fd682d0326f922ce14bda4b1b84211a09702dd6b4599` |
| `set-1/research/GROUP-A.md` | `694f487907c85afe2fae62a469782bd0ad624e21c207024e453bc65e26337b7f` |

The candidate and proposed stage now agree on 24–27. The candidate's chronology fact and content note, proposal's biographical facts, and group-A findings retain the approximate qualification and use the corrected range. The chronology fact remains `probable`, not an exact birth record. The existing parser and draft validator completed with zero errors and zero warnings. Assertions checked identity, both age bounds, empty review, draft status, and equality of all seven canonical texts with both the proposed fallback and the frozen earlier Carver candidate. No story prose was changed by this age correction.

The initial checker attempted a nonexistent `v2` frozen filename and stopped before validation. After resolving the actual `v1` filename with a file search, the bounded check above exited successfully. A separate attempted read of a nonexistent intake helper was corrected by locating `lib/intake-constraints.ts`; neither failed read changed anything. These are local structural checks, not owner approval or measured matching evidence.
