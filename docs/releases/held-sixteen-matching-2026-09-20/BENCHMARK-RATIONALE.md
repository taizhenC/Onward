# Prospective matching coverage: independent editorial draft

Status: **not approved gold, not promotion authority, not production evidence**.
Prospective draft version: `held-sixteen-coverage-migration-v1`. This is a review
identifier, not an existing registered recipe or permission to register one.
Prepared 20 September 2026 local time. The existing story review does not approve
this new benchmark, its loss of coverage, new labels, chronology policy or any
recipe/configuration change.

## Independence and scope

The benchmark author read the original 104 case objects, the sixteen replacement
matching records and their source-led passages before authoring these labels.
The author did **not** run matching, inspect candidate rankings, inspect provider
results or adjust labels to seek a passing score. Reading inherited annotations
that mention historical results is not a new measurement; those annotations are
retained in the complete original-object ledger. Label changes below follow the
changed story foregrounds, not retrieval success or failure.

The replacement packet's checked primary-source work is the factual basis for
new positive labels. This is not a fresh primary-source re-audit of the other
thirty-four biographies. Their unaffected labels are inherited coverage and are
reported separately. No private reader disclosure or production session data
was used. All new feelings are synthetic editorial examples.

`benchmark.json` is directly shaped for the existing evaluator's case parser;
the extra stable `id` fields are ignored by that parser. `case-lineage.json`
contains every original object, its zero-based original index and SHA-256 of
`JSON.stringify(originalObject)`, plus the raw original file SHA-256:

```text
evals/match.json
f87962a57990f65a8765afdcd141bbdd1c3b9f5a965d04f4810f1787d8aa2a1e
```

Neither that file nor its existing recipe, thresholds or evidence is changed.
This draft cannot be substituted into the current immutable recipe and then
reported as a pass of its original 104 cases.

## Full accounting, including the loss

| Disposition | Original cases | Treatment |
| --- | ---: | --- |
| Carried unchanged | 58 | Original fields unchanged; only a stable id added |
| Positive retained, historical rationale revised | 7 | Same input, expected figure and hardness; note corrected |
| Positive retained, obsolete hardness retired | 6 | Same input/expected figure; retired hard fields and corrected note |
| Historical-premise challenge | 33 | Full original object preserved; no replacement scored label assumed |
| Total original objects | **104** | No original input silently disappears |

The proposed scored set is **107 cases**: 71 inherited positives/misses, 32 new
source-led positives (two per replacement), and four new miss-calibration
examples. It contains 37 hard cases and seven miss cases. Counts are not proof
of equivalent difficulty, statistical power or release readiness.
The 37 hard cases split into 23 inherited and 14 new diagnostic cases; the old
set had 44. Fifteen old hard cases are unresolved challenges and six had their
hardness retired. Three inherited semantic fixtures remain scored, while two
other old semantic inputs are preserved among the unresolved challenges.

**The 33 unresolved inputs materially reduce scored legacy coverage.** They are
mandatory loss-of-coverage/partial-fit challenges, not passes, exclusions to hide
a regression, or presumed misses. A new benchmark approval must explicitly
resolve or accept that loss. Until then, there is no equivalent replacement for
the approved 104-case baseline and no basis for promotion. The ordered
`supplementalChallenges` array is an exact readable index of the 33 per-entry
challenge objects, not 33 additional cases.

The lost or changed historical comparisons include childhood Rogers bullying;
Lee escaping an imposed life; McClintock's ignored certainty; Rustin's universal
erasure; Berlin leaving home; Lewis's accusation/acquittal sequence; Coltrane's
addiction recovery; Lamarr's appearance-based dismissal; and other richer old
premises that the narrower documents do not establish.

Some old inputs still have partial factual overlap. Carver's vignette mentions
earlier racial refusal, Wang remembers missing the top editorial role, Lindgren
describes foster separation, Christie is separated, and Rachmaninoff describes
difficulty composing. **Retiring the old exact rationale does not mean that no
candidate can fit.** No automatic old-positive-to-`miss` conversion, invented
replacement positive or broad `accept` list was used. The ledger explains each
case rather than treating factual overlap as either total identity or zero fit.

## Corrected inherited distinctions

The six retired hard cases are original indices **13, 34, 45, 57, 80 and 93**:

- Jones and Andersen no longer face a child-age Rogers confusion twin: his
  replacement is adult testimony.
- Graham's involuntary leadership is not meaningfully confusable with Lee's
  voluntary library contribution on the original imposed-life rationale.
- Fitzgerald's homelessness and street singing are not a sufficiently close
  hard comparison to Berlin's credited first publication and small return.
- Marshall's rejected scientific discovery is not Lamarr's administrative
  name/signature mismatch.
- Wilson's drinking/shame episode no longer has a Coltrane addiction twin.

Their positive labels remain; counting the obsolete decoys as easy hard wins
would exaggerate retained difficulty. No replacement decoy was invented simply
to keep the old hard-case count.

Original indices **18, 43, 48, 50, 59, 89 and 96** retain their decision labels
but receive truthful notes. Creative difficulty still makes Rachmaninoff a
neighbor to Butler; young disability still connects the Charles/Rudolph pair;
young-parent care still connects Angelou/Lindgren; composer distress can still
confuse Rachmaninoff with Shostakovich; and separation remains adjacent to
Yeats's unrequited love. These distinctions must use the current foreground,
not the retired facts. Poitier's audition labels retain support but
no longer assert ninety-second timing, private feelings or deficient-accent
judgments. Original 47 already described an audition/conservatory distinction
that remains supported and is unchanged.

## New positive labels and evidence

Each figure has two separately written inputs: one relatively direct and one
different practical emphasis. These are diagnostic near-story wording, **not
an independent adversarial holdout** or proof of equivalent old difficulty.
They are not copies of the proposal's shape sentences and do not require every
fact of the reader's life to match. Fourteen second inputs have a plausible
neighboring episode; the Lamarr/Marshall and Rogers/Graham contrasts were
demoted after independent editorial review because they were weak hard decoys.
The hard decoy is excluded from `accept`; no new
`accept` lists are introduced. Any future broadening must receive another
independent editorial review, before evaluating it as a new frozen revision.

| Id family | Supported comparison and non-overclaim | Evidence in reviewed packet |
| --- | --- | --- |
| `new-berlin_i-*` | First collaborative publication, credited work, little return; not abandonment or a hit | [Berlin proposal](../held-sixteen-integration-2026-09-20/proposals/berlin_i.stage-proposal.json): attributed 1934 interview and original sheet-music credits |
| `new-carver-*` | Food shortage while enrolled and working, difficulty disclosing need; help is not promised | [Carver proposal](../held-sixteen-integration-2026-09-20/proposals/carver.stage-proposal.json): autobiographical fragment held by NPS |
| `new-christie-*` | Paid writing during separation/childcare, completed but disliked book; not emotional recovery | [Christie proposal](../held-sixteen-integration-2026-09-20/proposals/christie.stage-proposal.json): estate chronology and bounded memoir quotation |
| `new-coltrane-*` | Repeated musical instruction and reliance on collaborators; not addiction recovery | [Coltrane proposal](../held-sixteen-integration-2026-09-20/proposals/coltrane.stage-proposal.json): Blume interview and Coltrane's essay |
| `new-lamarr-*` | Deadline, incorrect signature name and corrected form; no appearance-based rejection | [Lamarr proposal](../held-sixteen-integration-2026-09-20/proposals/lamarr.stage-proposal.json): attorneys' letters, telegram and patent |
| `new-lee-*` | Useful early contribution within an unfinished larger undertaking; not escaping constraint | [Lee proposal](../held-sixteen-integration-2026-09-20/proposals/lee.stage-proposal.json): printed dedication remarks and acceptance |
| `new-lewis_e-*` | Request for useful criticism instead of praise based on background; no completed visit claimed | [Lewis proposal](../held-sixteen-integration-2026-09-20/proposals/lewis_e.stage-proposal.json): Lydia Maria Child's 1864 letter |
| `new-lindgren-*` | Practical sharing of an existing child's care; no inferred shame or abandonment | [Lindgren proposal](../held-sixteen-integration-2026-09-20/proposals/lindgren.stage-proposal.json): estate chronology and retrospective notes |
| `new-mcclintock-*` | Publishing a qualified scientific comparison; no private crisis or vindication | [McClintock proposal](../held-sixteen-integration-2026-09-20/proposals/mcclintock.stage-proposal.json): inspected opening of her 1961 article |
| `new-owens-*` | Recognition without reliable income, reported exhibition complaints and later business debt; no claim that one complaint caused suspension | [Owens proposal](../held-sixteen-integration-2026-09-20/proposals/owens.stage-proposal.json): contemporary dispatch and OSU chronology |
| `new-poitier-*` | Asking for classes after unsuccessful auditions, insecure trial attendance; no guaranteed success | [Poitier proposal](../held-sixteen-integration-2026-09-20/proposals/poitier.stage-proposal.json): his 1989 and 2009 testimony, with chronology conflict preserved |
| `new-rachmaninoff-*` | Stated composing difficulty, requesting time, unfinished work despite encouragement; not a medical cure | [Rachmaninoff proposal](../held-sixteen-integration-2026-09-20/proposals/rachmaninoff.stage-proposal.json): contemporary letters |
| `new-rogers-*` | Explaining quiet caring work to a decision-maker; no guaranteed appropriation | [Rogers proposal](../held-sixteen-integration-2026-09-20/proposals/rogers.stage-proposal.json): Senate hearing transcript |
| `new-rudolph-*` | Limited team participation and trying another activity; not medical defiance or cure | [Rudolph proposal](../held-sixteen-integration-2026-09-20/proposals/rudolph.stage-proposal.json): publisher's memoir excerpt and attributed biographical narration |
| `new-rustin-*` | Turnout uncertainty, coalition disagreement and unfinished follow-through; not universal erasure | [Rustin proposal](../held-sixteen-integration-2026-09-20/proposals/rustin.stage-proposal.json): attributed recollections, recorded address and his later essay |
| `new-wang-*` | An experienced move into a business, prompted by a clothing gap; not starting with nothing | [Wang proposal](../held-sixteen-integration-2026-09-20/proposals/wang.stage-proposal.json): interviews and official brand chronology |

The underlying research distinguishes original records, retrospective testimony,
institutional chronology and scholarly narration; a table link is not a claim
that all sources are equally primary or that unread full works were inspected.

## Miss calibration and supplemental no-false-premise checks

All three old miss objects remain unchanged. Four new miss cases cover household
labor negotiation in an intact relationship, roommate property boundaries,
adult friendship-group change and sibling disagreement about elder care. Each
note explains the missing foreground and why a superficial theme is not enough.
These are substantive ordinary-life gaps, not deliberately invalid input or an
age-outside-every-row trick. In the current evaluator `expect: "miss"` means
**partial framing**, regardless of which figure is named. It does not demand no
candidate, refuse help or declare the reader's experience unimportant.

The 33 legacy challenge assertions are separate from top-1 gold because the
current matcher score cannot express "do not invent this historical rationale"
while allowing an honest partial analogy. They must be reviewed independently
of a top-1 score and must never be added to a passing denominator. A story being
retrieved is not by itself proof of false history; the actual explanation or
rendering must be checked against the permitted facts. Conversely, not returning
the old figure is not proof that the lost reader need is adequately served.

## Ages, framing and release boundaries

The application intake is adult-only. Inherited under-eighteen cases remain
explicit historical/synthetic matching fixtures for regression accountability;
they do not authorize child intake or a new age policy. Every new input is at
least eighteen. Reader ages are synthetic, not newly established episode dates.

Carver's range is approximate; Poitier's 15–19 range preserves conflicting
audition chronology. Rudolph's 5–16 historical envelope is broad and partly
inferred. Her new age-18 and age-19 inputs test only an **adult partial
connection** to limited participation and a new activity. They do not certify
age-identical matching, medical recovery, definitive framing or a new policy
allowing the coarse envelope. The owner must explicitly review that choice.
Other new top-1 labels likewise identify the most defensible episode, not a
promise that every input detail matches or that a definitive framing is safe.

Future measurements must report, without changing existing safety thresholds:

1. Original-104 outcomes and all 33 unresolved challenges as their own legacy
   accountability record, not a substituted pass.
2. The 71 retained legacy cases, separating unchanged, rationale-revised and
   hard-retired decisions.
3. New positives for each of the sixteen replacements, and new miss cases.
4. Hard confusion, miss calibration and definitive-wrong outcomes separately,
   including retired Berlin hardness and adult Rudolph framing qualification.

Do not let new direct positives dilute a failing legacy slice. A structurally
valid or empirically better draft does not settle the unresolved editorial
decisions, authorize a new recipe, establish independent promotion controls,
or publish a StorySpec. If measurements later motivate editorial changes,
create a separately reviewed and newly frozen revision with preserved prior
bytes and an explicit reason; do not quietly relabel a failed example.
