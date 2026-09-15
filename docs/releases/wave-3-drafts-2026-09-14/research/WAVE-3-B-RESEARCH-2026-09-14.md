# Wave 3 B research handoff — September 14, 2026

Authoring scope: Ella Fitzgerald, Katharine Graham, Langston Hughes only. These are Curated Reference drafts, not reader-derived material. No credentials, user data, database writes, publishing, Git operations, or external messages were used.

The research skill was read in full. This agent was itself the delegated background researcher; no additional agent was spawned because all four team slots were occupied. The story recipe, evidence limits, domain context, current CLAUDE updates, StorySpec schema, and installed stage IDs were read. No released matching or library material was changed.

## Original author handoff and verification

These original hashes are preserved for the independent review trail. The correction appendix below gives the current frozen candidates and supersedes any baseline prose-scope description here.

| Candidate | SHA-256 | Words | Author assessment |
|---|---|---:|---|
| fitzgerald_e-1932-1934-streets-to-amateur-night-v1.candidate.json | 07437d34b2cbeb1280e90b13c470492da2b5c81b5a8039868eef2cbc0d692a53 | 565 | Source-grounded with substantial retrospective-source qualifications; independent craft review needed |
| graham-1963-1971-thrust-into-the-chair-v1.candidate.json | 04cec6a929c0e953b259d0fbfecdf6fa65d26a0a5b48bf53ddcb272a035f9a19 | 594 | Source-grounded first-person scenes; independent craft review needed |
| hughes-1920-1926-fathers-deal-to-first-book-v1.candidate.json | 1cd725879aa562505726198308ef056865001fb815c0cd4fd6fadee371a54b86 | 621 | Source-grounded memoir scenes plus inspected contemporary letter; independent craft review needed |

All have schema story-spec-v1-2026-07, stable figure/stage version-one IDs, status draft, seven passages, review {}, and complete sentenceEvidence. No simulated reviewer identities were saved.

Each file passed node --import tsx scripts/drafts/validate-candidate.ts with zero draft or simulated-publication errors/warnings. The actual scripts/check-story-batch.ts passed when the directory held eight candidates: canonical composer preserved prose; content hashing and serialized replay passed; every beat mean was below sixteen words, every sentence below twenty-eight, every final sentence shorter than its beat's longest, and bridge endings below twelve. This is mechanical evidence only. Root must rerun against the final nine and any revised bytes.

All three are below the 700–950 editorial target. The shortness is disclosed and is not by itself a HOLD. In particular, Fitzgerald and Graham's early passages repeat a small documented action across scene/dark/response. An independent reader must judge whether that feels sustained or stalled. The author does not grant source, tone, publication, or content-profile approval to their own work.

## Ella Fitzgerald

### Episode and matching distinction

This draft moves from the 1934 amateur performance to the first 1935 band audition and early band routine, approximately ages seventeen to eighteen. The installed stage is labeled 1932–1934 and uses ages fifteen to seventeen. Its dispossession/street-survival claims are not treated as proof. The draft's actual emotional center is being unable to perform, then seeking a place to work. That narrower scope and the short 1935 continuation are matching metadata considerations, not reasons to fabricate an earlier turn.

### Sources actually opened

- [Official artist biography](https://www.ellafitzgerald.com/biography/), particularly the birth paragraph, A rough patch, What's she going to do?, and Coming into her own. This is a Verve/UMG artist website with first-party institutional biography and selected recollections, not a contemporaneous witness record. The narrative particulars are therefore generally probable.
- [Library of Congress, August 1997 bulletin](https://www.loc.gov/loc/lcib/9708/ella.html), paragraphs beginning Ironically, her earliest passion through Ella decided to sing, plus the later audition paragraphs. It quotes Fitzgerald's own writing about freezing, the audience laughing, singing instead, and winning. The original written document is not identified there. Library custody of a collection does not make every sentence in the bulletin an archival fact.
- [Norma Miller, March 29, 1999 oral history](https://www.pbs.org/wnet/americanmasters/archive/interview/norma-miller/), opening exchanges about contests, Webb, early travel, dressing rooms and cards. Miller's own witnessed Opera House appearance must not be mislabeled as eyewitness attendance at the first Apollo contest: she explicitly introduces some earlier events as what she understood. Early touring/cards are her own recollection. Transcript spellings and names contain obvious errors; the video was not played or transcribed independently.
- [The Decca Years, Vol. One liner notes, page 3](https://museum.media.org/ella/decca/decca_3.html), final two paragraphs. Will Friedwald reproduces Fitzgerald's account to Leonard Feather of being brought to Webb's dressing room and singing three songs, followed by the conditional college trial. This supplies an actual audition place and action for passage four. The remembered condition is a verbatim fragment, explicitly framed as memory. The page is preserved by media.org; the original interview recording/article and edition were not inspected.

### Conflicts and exclusions

Age: the official birth date and 1934 contest give seventeen; the LOC quoted memory and the Apollo's current general history say fifteen. The prose says about seventeen and carries probable remembered scene facts. No precise day appears.

Song order: the official site starts with Judy; the LOC recollection begins with The Object of My Affection. Decca notes also warn that Boswell never recorded Judy, contrary to a frequently repeated record story. No song title or order is asserted.

The Opera House engagement is January in the official biography and February 16, 1935 in Decca notes. The draft says only early 1935 in the fold and a later engagement in prose.

The college trial is Yale in the official biography/Fitzgerald-to-Feather account but Princeton in Miller's oral history. The college name is omitted. These are conflicting recollections, not two verified trial performances.

The LOC bulletin also differs from the official site on the mother's death year (1934 versus 1932). The draft does not reconstruct that death or rely on it as its dramatic cause. It retains the official site's 1932 account as a qualified contextual fact.

Do not insert: a supposedly denied week at the Apollo; reform-school violence; specific street survival; detailed housing instability; exact prize cash; or an invented audience speech. Those were not established at the level needed for this draft.

Source/craft readiness: no author-declared HOLD solely for date-label mismatch or length. The original Feather interview and the original Fitzgerald written recollection would strengthen provenance; their absence must remain disclosed. The reader-facing scene does not assert their disputed details. Independent review must scrutinize whether the concise, partly repetitive first three passages carry enough motion.

## Katharine Graham

### Episode and matching distinction

The story ends at the 1965 management appointment, not the famous 1971 publishing decision. It begins at age forty-six and spans forty-six to forty-eight, versus installed matching ages forty-five to forty-eight. This avoids portraying the fifty-four-year-old publisher of 1971 as a novice in her forties. Beebe and other executives' help remains visible.

### Sources actually opened

- [Graham with Brian Lamb, Booknotes, February 16, 1997](https://booknotes.c-span.org/Watch/78359-1/Katharine-Graham). Bounded exchanges: how soon after her husband's death she went to work; learning with Beebe; and the public-speaking exchange ending with rehearsal before her children. This is Graham's retrospective testimony, not a diary or a contemporaneous speech transcript.
- [Graham with Terry Gross, interview from 1997, archival rebroadcast July 18, 2001](https://freshairarchive.org/segments/katharine-graham). The long answer to the question about choosing Bradlee supplies the invitation, club, concern about paying a lunch bill, question, initial refusal, later pressure, consultation, and management appointment. The archive says its transcript can change and the audio is authoritative. Audio was not independently checked; recollections are probable. The brief refusal is exactly as in the transcript and framed as memory.
- [Becoming Katharine Graham, PBS transcript](https://www.pbs.org/video/becoming-katharine-graham-yfyjfn/). Attributed Graham testimony supplies business inexperience and approximately a year of silence at editorial lunches. Weymouth's attributed family recollection supplies rehearsing greetings in children's bedrooms. This documentary interleaves archival speech and later commentary; generic narrator assessments were not treated as her inner voice.
- [Personal History authorized opening excerpt](https://www.readinggroupguides.com/reviews/personal-history/excerpt), final paragraph, supplies her June 16, 1917 birth date.
- [Donald Graham's Post account](https://www.washingtonpost.com/opinions/ben-bradlee-a-hero-to-the-post-newsroom/2014/10/21/365974c8-5881-11e4-8264-deed989ae9a2_story.html), opening paragraph on his mother's appointment of Bradlee, supplies only the bounded 1965 management chronology.

A [Spanish memoir excerpt at the University of Valencia](https://www.uv.es/~dones/Emilia/noticias/Katheringraham.htm) was also opened as a lead. It is not used for English quotations or scene detail because the translation's edition and original pages are unspecified.

### Boundaries and craft questions

The start is a home rehearsal, not a fabricated first-day office scene. No speech reception or claim that practicing cured her fear is added. The lunch does not produce an immediate job offer: she first says no to the top position and later checks references and persuades colleagues to create a management role. The exact title varied across retellings; the draft follows her own phrase assistant editor and does not conflate it with her first lunch.

Suicide loss is flagged in the content profile and described plainly in a fact atom, with no method, means, duration, location or note details. The later workplace discrimination suits are kept in a qualified fact atom, based on Graham's own acknowledgment. The narrative ends before those later events.

Author source assessment: suitable for independent review, no asserted contemporary access beyond the sources above. Craft question: scene/dark/response remain close to one rehearsal and may feel repetitive. No approved verdict is inferred from a validator pass.

## Langston Hughes

### Episode and matching distinction

Winter 1924–25 through early 1926: laundry work and study, his mother's need for rooms, their lunch-hour search, unsuccessful saving and an actual tuition request, then a scholarship and college entry. This is not a claim about his father's engineering bargain. The legacy stage remains 1920–1926, matching ages nineteen to twenty-four. Candidate envelope twenty-two to twenty-five accommodates uncertain birth dating; prose only says about twenty-three at the opening.

### Sources actually inspected

- [The Big Sea HTML transcription](https://gutenberg.ca/ebooks/hughesl-bigsea/hughesl-bigsea-00-h-dir/hughesl-bigsea-00-h.html), based on the 1963 Hill and Wang edition of the 1940 memoir. Bounded locators: Part I, Negro, paragraph beginning I was born in Joplin; Part II, Washington Society, laundry/scholarships/rooms paragraphs; Vachel Lindsay, hotel context; Poetry is Practical, scholarship and mid-year college entry. All reconstructed memoir particulars are probable, with a brief prose memory cue.
- [Signed October 29, 1925 letter to Walter White](https://www.loc.gov/exhibits/naacp/newnegromovement/Assets/na0062_enlarge.jpg), NAACP Records, Manuscript Division, Library of Congress, item 062.00.00, digital ID na0062. The whole single-page image was visually inspected. Paragraph one contains working-hour constraints, the February college plan, the requested annual loan and repayment period; paragraph two says the poetry book had gone to press. The image was temporarily downloaded for visual inspection; it was not modified. The [LOC exhibition item](https://www.loc.gov/exhibits/naacp/the-new-negro-movement.html#obj19) identifies ownership/custody. Exhibit prose is a government description; the letter is Hughes's work.
- [The Weary Blues first-edition transcription](https://en.wikisource.org/wiki/The_Weary_Blues_(collection)), title/copyright/dedication/acknowledgment leaves. The 1926 publication and dedication are independently visible. This edition is public domain in the United States; that does not make the 1940 memoir public domain there. No full memoir file was saved or redistributed.

### Corrections and unresolved limits

The hotel publicity did not originate the book: the October letter already says it was at press. The memoir's chapter arrangement is thematic and cannot be mechanically read as chronological proof that the prize and book contract followed the hotel incident.

The scholarship letter is described in the memoir but was not itself located or inspected. Its arrival and emotional assessment remain probable. The contemporary October loan request is not evidence that the loan was granted. The draft does not claim a reply or causally equate that letter with the later scholarship.

The memoir gives 1902. [Reporting on Eric McHenry's documentary research](https://www.theguardian.com/books/2018/aug/10/langston-hughes-born-a-year-before-accepted-date-poet) identifies earlier newspaper evidence supporting 1901. That report was opened as a discrepancy lead; the underlying 1901 Plaindealer issues and census images were not inspected, so the candidate does not assert an exact corrected birth date.

The rooms search is one documented lunch-hour act. The stove and inability to save come later in compressed struggle. The turned-up scholarship is not used to erase the work of friends, relatives, editors or patrons. First-book publication and school entry answer different practical needs.

Author source assessment: suitable for independent review with the above memory qualifications. Craft assessment: coherent small-response sequence, but the dark moment and turn are compact; no HOLD solely for the word target. Root and independent reviewers control any next decision.

## Correction appendix — independent review response

The independent Coleman/Coltrane/Faraday author reviewed the original three hashes in `WAVE-3-CROSS-REVIEW-B-2026-09-14.md`. I read that full packet and made only source-bounded prose/evidence corrections. Original candidate snapshots belong to the root's focused commit trail. No candidate review approval or synthetic reviewer ID was persisted.

| Current candidate | SHA-256 | Words |
|---|---|---:|
| Fitzgerald | `0bad16690950606624abf0d9c8af59d867cdd3be2c186cab9b3da9dd690fee7b` | 365 |
| Graham | `fcc977a8c65ec59a0eb5b2a4615a837ff410395107ccc77af4c67f2ddd00dbc2` | 496 |
| Hughes | `4221485861e7c44b2f3347551b0dba26d32a1084d50413f5ce7ea425dea08454` | 539 |

Fitzgerald: stage/age/intended dance belong to scene; remembered freeze/laughter/prompt to dark; asking to sing and singing to response. Contest victory now begins compression. Circular reminders were cut. The [LOC recollection paragraphs](https://www.loc.gov/loc/lcib/9708/ella.html) were reopened for the precise nervous/freeze wording. The [Decca dressing-room account](https://museum.media.org/ella/decca/decca_3.html) remains the turn. The ending now stops at the 1935 college trial, hire, weekly wage and traveling job. Miller's cards, humming and several-shows routine is **not dated specifically to 1935** and has been removed, along with undated shyness from this bounded ending. Those sources were inspected; their unused color is not grounds to broaden the episode. No original Feather interview was inspected. Source conflicts listed above remain.

Graham: first three passages now use only the first-year greeting memory in the [Booknotes public-speaking exchange](https://booknotes.c-span.org/Watch/78359-1/Katharine-Graham), reopened in full. Weymouth's plural bedroom rehearsals and welcome wording do not establish the same occasion and were removed, including the unneeded `g-bedroom` atom. The scene introduces the lined-up children, dark carries her attested inability/fear, response gives the small practice act without invented feedback. Business inexperience moved to struggle. Literal `would` and the broken antecedent were removed. The ending of scene does not claim first-ever employment at the paper: earlier employment existed. The lunch/appointment sequence and later source limits remain unchanged.

Hughes: large bags replaces inferred weight; the opening explicitly remains a recalled routine, not a dated shift or proof that the book was present when his mother arrived. The source's own `One day` transition now introduces her actual visit in prose. Repetitive room-search reminders were removed. Catalogue/advice/conversation context moves into struggle with an explicit loose `During that year` frame; past-perfect wording was removed because it could incorrectly force donor conversations before October 29. The turn centers on the memoir's scholarship letter and remembered assessment, not an original letter inspected. The [October 1925 image](https://www.loc.gov/exhibits/naacp/newnegromovement/Assets/na0062_enlarge.jpg) was genuinely inspected and remains distinct. The editorial sentence assigning book and scholarship different meanings was cut. Publication and college entry are both early 1926, with no exact ordering between them asserted. Birth uncertainty and the lack of an instantaneous inner-state report at his mother's arrival remain explicit qualifications.

All three corrected files passed the individual candidate validator with zero errors/warnings. The actual nine-candidate compose/content-hash/serialized-replay/rhythm check passed with these corrected bytes: all means at most sixteen, sentence maxima at most twenty-eight, last sentences shorter than passage maxima, final bridge sentences at most twelve, and no texture sentences. Status remains draft and review remains empty. These deliberately shorter drafts remove unsupported or repetitive material; no missing words were replaced by invented action. Source and craft disposition must come from the independent hash-bound recheck, not the author.
