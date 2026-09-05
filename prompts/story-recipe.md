# The Onward Story Recipe

How we turn one documented episode of a real life into a story a hurting
person will keep reading. This is the rulebook of record for every Onward
story. `prompts/figure-beats.md` is the generation template and defers to this
file where the two differ. The validator in `lib/story-spec.ts` enforces the
mechanical parts; the rest is the reviewer's job.

Written September 2026 from a research pass over narrative craft, the
psychology of comforting and inspiring stories, formats that already do this
well, what distressed readers say helps and harms, and how biographers disclose
invention. The evidence grade for each rule is in the appendix. Grade A means
research evidence held up when we opened the source; B means craft consensus
from several credible practitioners or research that supports the direction
but not the specifics; C means our own judgment, marked so it can be tested.

The [source guide and continuation audit](../docs/story-recipe-evidence.md)
links primary evidence and states the limits of applying it to Onward. Grades
describe the supporting evidence, not experimental validation of our exact
wording, passage structure, or numeric targets.

---

## 1. What we are making

A reader has typed their age and a few honest sentences about something hard.
We hand them one real person who, at about their age, lived through something
with the same shape. We tell that episode as a story: seven passages, read one
or two paragraphs at a time on a phone, four or five minutes, the person's
name withheld until the last passage. Then a folded section they can open to
see who this was, what really happened, and which lines we wrote ourselves.

Two things have to be true at once.

**It has to be interesting.** Not plot; the reader already knows this person
came through. Interesting here means presence: the reader stands inside one
continuous moment with a body in it, wants something the figure wants, dreads
what the figure dreads, and is not sure how the next passage lands. If the
passage could be summarized without loss, it is a summary, and a summary in a
warm voice is still a summary.

**It has to be honest.** The events, the people, the places, the dates, the
words, the order, and the reasons are real or they are not on the page. What
we add is texture: a room, a light, a gesture, a fear the sources attest. Every
texture sentence is marked, listed for the reader, and inert: delete it and
nothing about what happened, why, or who the person was has changed.

The old failure was a story that read like a history book because every
sentence had to be a citation. The opposite failure is a story that reads well
because it is partly made up. This recipe is how we avoid both.

## 2. The floor that never moves

- No invented events, causes, decisions, realizations, quotations, numbers,
  durations, chronology, or claims about real third parties.
- Every material claim is a fact atom with an exact or bounded source locator.
- Nothing inside quotation marks unless it is a verbatim `QuoteRecord`.
- No diagnosis of the figure or the reader. No promise of an outcome. No
  equivalence between the reader's life and the figure's. No advice. No echo
  of anything the reader wrote.
- The figure stays anonymous until the bridge.
- Texture is disclosed, never laundered as a claim. "Emotional truth" and
  "essentially true" are not justifications for anything.

## 3. The shape

Seven passages, in this order, 700 to 950 words in total. Spend the budget
where the reader is: the dark moment, the response, and the turning point.

| # | role | what it is | target words | time |
|---|---|---|---|---|
| 0 | `scene` | a person, a place, a present moment; the age within two sentences | 90-140 | one moment |
| 1 | `dark_moment` | the low point, felt from inside; stops before any relief | 120-180 | one moment |
| 2 | `response` | the first small documented thing they did | 90-130 | one moment |
| 3 | `struggle` | time passing; at least one thing that did not work | 100-150 | compressed |
| 4 | `turning_point` | the shaped, documented event that changed the ground | 130-180 | one moment |
| 5 | `became` | what changed in ordinary life, and what stayed hard; ends at the edge of the episode | 100-150 | compressed |
| 6 | `bridge` | the name; one plain sentence of what they are known for; the two distance sentences; one or two permission lines | 60-120 | address |

The reader sees no passage count and no progress. Each Continue press reveals
one or two paragraphs, so every chunk must carry an image or an action and
make sense if the reader has forgotten the previous one. Never end a chunk on
an abstraction, and never cut a chunk mid-thought to force a click.

## 4. Rules for the whole story

**R1. Anonymous and undated until the bridge.** No name, no year, no city, no
institution, no war or ruler, no period object, no detail so distinctive that it
identifies the figure. A region or country is allowed only when the episode is
unintelligible without it, never in the first paragraph of the scene, and only
with a `sourceNote` saying why. Test: print the name at the top of passages 0
to 5. If they stop working, the reveal was carrying the story instead of
recontextualizing it. State the age approximately as a documented claim ("She
was seventeen." "He was about twenty."). *Grade B.*

**R2. Moments, not summaries.** Scene, dark moment, response, and turning point
are each one place, one stretch of time short enough to feel, a body in it, an
action in progress. Only the struggle and the became passages compress time.
In the four moment passages, ban "often", "would", "used to", "for years",
"during this period", and any opening that explains who this person was before
showing them somewhere. *Grade B.*

**R3. One concrete anchor per passage.** A room, a light, weather, an object, a
sound, a posture, a body sensation. Use a documented particular first (the
sources are full of them: a borrowed coat, a notebook, a file that slipped);
write texture only where the record has none. "A period of despair" with no
anchor is a defect, not a mood. *Grade A.*

**R4. Texture is inert.** A texture sentence adds no person, place, date,
amount, quotation, event, or causal link. Deleting it changes nothing about
what happened. Never put texture at the two causal joints: the cause of the
dark moment and the trigger of the turn run on documented sentences only. The
validator rejects texture that carries a digit, a quotation mark, or an
allowlisted name, and rejects texture on the bridge; it warns when texture
contains *because, so that, realized, decided, knew, understood, chose*, and
when more than half a passage is texture. A long imagined list means an
under-researched stage, not a permission to keep going. *Grade A.*

**R5. Interior life only on attested states, and render the moment, not the
meaning.** If a letter, memoir, or testimony says he was afraid, ashamed, or
could not sleep, we may write what that looked like from inside: what he
watched, what his hands did, what he could not stop thinking about. We may not
write what he realized, decided, knew, or why. "He watched faces. He tried to
work out who could safely be told the truth." is texture on an attested fear.
"He decided he could trust no one." is an invented decision. *Grade A for the
mechanism, B for the rule.*

**R6. No invented significance, no retroactive courage.** Never narrate what
the episode meant to the figure or what they learned beyond what the sources
say. Never make them braver, calmer, or more self-aware than the record shows.
Review test: does our figure have more agency or insight at this moment than
the cited source gives them? *Grade B.*

**R7. Connect by documented cause, or by an honest jump.** Where the record
shows a cause, use it. Where it shows only a sequence, jump in the open ("Two
winters later.") and never smooth the sequence into a cause with "so",
"because", or "which is why". *Grade B.*

**R8. Leave one implicit question open at the end of passages 0 through 4.**
The question comes from the stated facts (a letter has been sent; a wage has
been lost; a room has gone quiet), never from the narrator. Ban "but
everything was about to change", "little did they know", "what happened next".
Manufactured suspense does not work and reads as being handled. *Grade B.*

**R9. Vary the register.** Ordinary, dread, resolve, grind, relief with a cost,
quiet, company: seven passages in one sad-then-warm tone read as generated.
End on something lost and something held, not on triumph. Every shift comes
from a documented event. *Grade B.*

**R10. Plain style, measured.** Mean sentence length at most 16 words per
passage; no sentence over 28 words; no passage ends on its longest sentence.
Words a fourteen-year-old reading in a second language would know. No idioms,
no cultural shorthand. Repetition of plain words is a device, not a defect
("He kept working." three passages apart is fine). The constraint is the mean
and the ceiling, not every sentence. *Grade B.*

**R11. Lint the register.** No *amazing, incredible, extraordinary,
remarkable, inspiring, powerful, profound, journey*. No sentence whose subject
is an abstraction that assigns meaning ("Grief taught her..."). No simile you
have read before. No imperative to the reader anywhere. No provenance clause
inside the drama ("he later recalled", "an eyewitness remembered"): that
accounting belongs in the fold, except where R19 requires a remembered quote
to be framed as memory. *Grade B.*

**R12. Third person until the bridge.** The reader is addressed only in the
bridge, only in the two fixed distance sentences and the permission lines, and
only in terms true of any reader. Never narrate the reader's situation back to
them; the story does not know it, and a hurting person reads that as
surveillance. *Grade A.*

**R13. Nothing generated inside quotation marks.** Every quotation is a
verbatim `QuoteRecord` linked in its sentence. Set up the stage's one good
sourced line minimally (set-up, quote, stop) and place it late, in the turning
point or the became passage. If the line is a later recollection, say so in
the sentence or cut it. *Grade B, validator-enforced.*

## 5. Passage by passage

### 0. Scene

Job: put the reader in a place with a person and a present moment, and make
them want to know what happens. First sentence: a person, a place, a moment.
Age within two sentences, as a documented claim. No background paragraph; the
past arrives as one or two facts the moment needs, not as a biography.

Must not: name, year, city, institution, period object; explain who they
became; open with a summary of their childhood.

Texture: allowed for the room, the light, the posture. Not for what they
wanted from life.

### 1. Dark moment

Job: the lowest point, felt from inside, at full weight, and then stop. This
passage is why the reader is here. It is emotionally specific and behaviorally
generic: name what was felt, feared, and about to be lost, in the figure's own
terms where the sources give them; never method, means, quantities, duration,
location, or the contents of a note. No consolation and no silver lining
before the turn. No comparison of magnitudes anywhere in the story ("worse
than", "at least"). At most 180 words. *Grade A/B.*

Texture: allowed on attested states (fear, shame, sleeplessness, waiting).
Not at the cause. The cause of the dark moment is documented or it is absent.

### 2. Response

Job: the first documented thing the figure did, small and doable, with the
figure as the grammatical subject: wrote, walked, went back, told one person,
refused, asked. Not a triumph. Not a decision to feel differently. Rescue,
patronage, talent, or "time passed" can appear later; they are not the content
of this passage. If the record has no such act, the figure is the wrong match
for this shape. Do not invent one. *Grade A for attainability.*

### 3. Struggle

Job: time passing, honestly. At least one documented thing that did not work,
or one return to the earlier state, at real length (comparable to the
response, not a clause). Where the record allows, a pressure of a different
kind from the dark moment. One failure at personal scale, not a catalogue.
This is the passage that makes the rest believable. *Grade A for including
real difficulty.*

### 4. Turning point

Job: a shaped, documented event: an encounter, a letter, a death, an argument,
elapsed time, a slow realization the source itself records. Render the moment,
not the analysis. Show what they did next, not only that things changed. Never
"they decided to keep going", "something shifted", "they chose hope". Never one
clean cause where the record shows several. This is the second causal joint:
documented sentences only at the trigger. *Grade B.*

### 5. Became

Job: what changed in the figure's ordinary life, told to the edge of the
episode and no further, and, where documented, one thing that did not get
better. No achievement list. No "went on to". No lifetime legacy. Aim for
"living well" or "making progress" rather than "recovered" unless the record
shows resolution. Fame lives in the fold. *Grade A.*

### 6. Bridge

Job: the reveal and the handing over. Order, exactly:

1. The name. `Her name was [Full Name].` on its own line.
2. One plain sentence of what they are known for. No superlatives, no list,
   no "one of the most important". Written so someone who has never heard of
   them understands why the name is in a book.
3. `Your life is not theirs.`
4. `But a piece of this story may still sit beside you.`
5. One or two permission lines. Second person, declarative, 3 to 24 words,
   no digits, no quotation marks, no name. They predict nothing, instruct
   nothing, compare nothing, and never mention the reader's particulars. The
   last line of the story is short: twelve words at most, and never the
   longest sentence in the bridge.

Permission lines that work: "You do not have to know how it ends to keep
going." "You are allowed to not be ready yet." "You do not have to be early."
Permission lines that fail the validator or the
recipe: "You will get through this." "You should keep going." "If they could
survive that, you can survive this." "You only have to begin." The last example
is an instruction even if a mechanical tone check misses it. *Grade A for
the supporting research; the wording and order are editorial decisions.*

## 6. The fold

After the bridge, the reader can open "Who this was, and what really
happened". The code builds it from the spec: the name and dates; the record
claim by claim in order with its evidence; the exact sentences marked as
texture; how each passage was told; quotations; where to read more.

The fold is the contract with the reader. It is not the accuracy mechanism.
Readers absorb what the prose installed whether or not a label follows, so the
authoring rules above are the defence and the fold is the honesty. What the
author owes the fold:

- Every texture sentence mapped as `dramatized_texture`, grounded in the fact
  it renders. If you cannot name the fact, the sentence is not texture; cut it.
- The documented record longer than the imagined list. If the fold shows more
  lines we wrote than facts we found, the stage is under-researched.
- Later-recollection material carried at `probable` confidence and framed as
  memory in the prose, so the fold shows it as memory rather than doubt.
- Where the later life went badly and the record says so, one plain fact atom
  about it, so the fold does not read as a hagiography the story avoided.

## 7. Mapping sentences

Every sentence of every passage carries exactly one treatment.

| treatment | use for | validator |
|---|---|---|
| `historical_claim` | anything that happened, was said, was felt as the source records it | at least one `factId` or an allowed interpretation; verbatim quotes linked |
| `dramatized_texture` | scene detail, gesture, weather, posture, interior life on an attested state | at least one grounding `factId`; no quotation marks, digits, or allowlisted names; never on the bridge; every non-bridge passage keeps at least one `historical_claim` |
| `reader_bridge` | the two fixed distance sentences | verbatim, bridge only |
| `reader_permission` | the closing line or lines to the reader | bridge only, at most two, 3-24 words, second person, no digits, quotes, instruction, promise, or name |

Interpretations (`allowed: true`, with supporting facts) remain the place for
editorial readings the sources support but do not state ("It was a way of
waiting."). They are not a back door for texture.

Warnings the validator raises and a candidate must clear before promotion: an
allowlisted name or a four-digit year before the bridge; more than half a
passage in texture; a load-bearing verb inside texture; "you" outside quotation
marks before the bridge. A warning can be accepted only by the human promoting
the candidate, and only with the reason written in `sourceNote`.

## 8. Review checklist

Read the draft on a phone, one chunk at a time, before reading it whole.

- [ ] Passages 0 to 5 contain no name, year, city, institution, or period
      object; they still work with the name printed at the top.
- [ ] Scene, dark moment, response, and turning point each stay in one place
      and one stretch of time; struggle and became are the only compressions.
- [ ] Every passage has a concrete anchor; documented particulars come first.
- [ ] Every texture sentence is inert, grounded, and absent from the two
      causal joints; none carries a motive, decision, or realization.
- [ ] The figure has no more agency or insight in any sentence than the cited
      source gives them.
- [ ] The dark moment names the feeling and the stakes, not the method; no
      consolation before the turn; no "at least" anywhere.
- [ ] The response is one small documented act with the figure as subject.
- [ ] The struggle contains a real failure at real length.
- [ ] The turning point is a documented event, rendered, with what they did
      next.
- [ ] Became ends at the episode; one documented hard thing where the record
      has one; no legacy list.
- [ ] Bridge order is exact; the legacy sentence has no superlative or list;
      the permission lines pass the validator; the last line is twelve words
      at most.
- [ ] Mean sentence length under 16 per passage; nothing over 28; a
      fourteen-year-old could follow every word; no idioms.
- [ ] No banned intensifiers, no announced suspense, no provenance clause in
      the drama, no imperative to the reader.
- [ ] Every quotation is a verbatim record; remembered lines are framed as
      remembered.
- [ ] `validate-candidate.ts` passes with zero errors and zero unaccepted
      warnings; the fold shows more facts than texture lines.
- [ ] The register test: would a tired seventeen-year-old on a phone at one in
      the morning keep pressing Continue?

## 9. Do not do

Seen in our own material, all of it.

From the evidence-bound spec that shipped: a date and a full name in the first
sentence; the lowest point written as reportage ("Douglass later described
himself as..."); provenance clauses inside the drama ("Decades later, an
eyewitness recalled..."); one paragraph per passage; the story ending on the
distance pair with no line to the reader; the reveal spent in the first line.

From the over-written hand-authored beats: literary register ("the boots
stopped at the door", "the shape of being alive without yet being anyone");
hardened numbers ("maybe fifteen minutes"); recollected speech rendered as live
dialogue ("The room shouted back"); invented causality ("His mother had died
before she could tell him"); hyperbole that erases documented help ("He had
nothing else"); staging that supplies a decision or a motive.

From the genre: announced suspense; a silver lining inside the dark passage;
legacy and achievement lists in the became passage; "you can do this too",
"you will get through this", "hold on", "keep going"; "at least", "compared
to", "if they could survive that"; diagnosis words applied to the figure as
fact; inline hedges ("perhaps she thought"); "emotional truth" as a review
verdict.

## 10. Open questions we are treating as decisions

No study tests a comfort story's ideal length, whether a withheld name helps
in a true story, or whether an itemized disclosure beats a blanket one. We are
deciding, and we will measure. Length: 700 to 950 words, budget weighted to
passages 1, 2, and 4; chunk-to-chunk drop-off is the product metric. Anonymity:
kept, with the wait pre-committed in the preface copy; first candidate for an
A/B test when telemetry allows. Disclosure: itemized, as built. Episodes with
no real turn (bereavement, chronic illness, irreversible loss) need a story
class whose turning point is "it became bearable" and whose became is
"surviving day to day"; match it where a redemption arc would read as an
instruction. Readers in a psychiatric sample showed a brief mood dip right
after a recovery story, resolving within a week: no mood question sits directly
after the dark moment, and crisis resources stay visible.

---

## Appendix: evidence behind the rules

| Rule | Grade | What held up when we opened the source |
|---|---|---|
| R1 anonymity until the reveal | B | Kaufman & Libby 2012: a late reveal of an out-group identity sustained experience-taking and improved attitudes (fiction). Lockwood & Kunda 1997: upward comparison inspires only when the success seems attainable; a famous name sets the target as "a great person". Ooms et al.: age similarity helped young readers only, small effects. |
| R2 moments not summaries | B | Mar et al. 2021 meta-analysis (150 effects, 33,000+ participants): narrative beats expository text for memory (g = .72) and comprehension (g = .48). Causal structure is a proposed explanation, not an isolated experimental mechanism; scene-over-summary is craft consensus (Hart, Jones, The Moth). |
| R3 concrete anchors | A | Sadoski, Goetz & Fritz 1993: in sentences about historical figures, concreteness strongly affected comprehensibility, recall, and interestingness. |
| R4 inert texture | A / B | Fazio, Dolan & Marsh 2015: readers reproduced misinformation despite a pre-reading warning shared by both conditions. Lists produced more suggestibility than the more engaging stories; processing mattered more than engagement. The experiment did not establish a plot-central-error advantage or test our disclosure. Documentary ethics (Honest Truths) and the inert-texture boundary remain practitioner/editorial guidance. |
| R5 interiority on attested states | A / B | Same Fazio finding; Mantel's Reith Lectures on not inventing motive. |
| R6 no retroactive empowerment | B | Mantel, Reith Lectures 2017: "can't resist retrospectively empowering them. Which is false." |
| R7 cause or honest jump | B | Graesser et al. via Willingham: causal connections are what make stories memorable; the ban on invented connectives is our floor. |
| R8 implicit question | B | Thrilling News Revisited: suspense correlated with appreciation and lingering interest, but structural manipulations meant to create it failed in two of three studies. |
| R9 vary the register | B | Oliver & Bartsch: being moved is a mixed-affect state. A 2023 follow-up found continuously positive versions more persuasive than shift-heavy ones, so shifts are craft, not a lever. |
| R10 plain style | B | Plain-language RCT 2024 (n = 488): understanding improved by ~20 points on one recommendation; CDC health-literacy guidance on chunking. Sentence numbers are practitioner convention. |
| R11 register lint | B | Dan Jones (Modern Love) on lazy intensifiers; Catherine Burns (The Moth) on stakes over description. |
| R12 third person, no narration of the reader | A | Grossmann & Kross 2014 (3 experiments, 693 participants): self-distancing removes the self-other asymmetry in wise reasoning. Wood, Perunovic & Lee 2009: positive self-statements made low-self-esteem participants feel worse. |
| R13 quotations | B | Larson's standing author's note (nothing in quotation marks unless from a document), corroborated. |
| Dark moment floor | A / B | NEON systematic review (five studies; harm pathway through behaviour-specific detail); Samaritans and 988 safe-messaging guidance; Lancet Public Health 2022 meta-analysis: hope-and-recovery stories reduced suicidal ideation in high-vulnerability participants (SMD −0.22). |
| Response as small documented act | A / B | Lockwood & Kunda 1997 (attainability); "Empowering Stories" (vicarious agency effects present in one of two experiments and described by the authors as small and temporary). |
| Struggle with a real failure | A / C | NEON change model: impact rises with perceived authenticity; readers valued narratives that acknowledged the difficult reality. The "different kind of pressure" is craft (Saunders). |
| Turning point as documented event | B | Samaritans guidance against single-cause framing; NEON turning-point typology (Llewellyn-Beardsley et al.). |
| Became ends at the episode | A | Lockwood & Kunda; NEON harm outcome "inadequacy" from noticing narrator achievements; Woods, Hart & Spandler on what recovery-story genre rules silence. |
| Bridge order and permission lines | A | Wood et al. 2009; High & Dillard 2012 meta-analysis on person-centred comfort (acknowledge and legitimize, never tell the other how to feel). |
| The fold as contract | A / B | Fazio 2015 used a warning in both conditions, so it does not estimate the effect of labels or corrections. Center for Media Engagement: labels did not raise trust; a between-byline-and-text explainer was recalled by 66% versus 24% for an above-story label. Neither study tests an afterword. Our pointer placement and itemized disclosure are editorial choices to evaluate. |
