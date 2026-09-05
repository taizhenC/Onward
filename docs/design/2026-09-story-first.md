# Story first: dramatized texture, reader permission, and the folded record

**Design record, September 2026.** Dated and append-only, like the two records
before it. It reverses one rule from the July target architecture knowingly and
says why. It does not edit that record.

## What the owner asked for

On 3 September 2026 the owner read the one story production was serving and
said it read like a history book, not a story. The direction that followed:

- Stories are told as stories, in our own words. Interesting comes first.
- We do not need every sentence to be documented. We need the events, the
  people, the dates, the words, and the order to be real.
- The reader does not need the names or the dates while reading. The real
  record folds up under the story, closed by default, for the reader who wants
  to open it and read more closely about the event and the person.
- The purpose is to inspire and help a hurting person, not to teach history.

## What was actually being served

Production matches only against `story_specs` rows with `status = 'published'`.
On 3 September there was exactly one such row, `douglass:1838-1841-nyc-to-nantucket:v1`,
so every reader who reached a story got Douglass regardless of what they wrote.
That spec opens with a date and a full name, reports its lowest point as
"Douglass later described himself...", has no interior life, and is 372 words
in seven undivided paragraphs. It is the gold exemplar of the August
evidence-first pipeline and it passes both validator gates.

The cause was not a style slip. `lib/story-spec.ts` required every sentence of
every beat to map to a fact or a reviewed interpretation, the closed
`SentenceTreatment` union had no place for anything else, and
`config/story-quality-policy.json` listed `unsupported_sensory_detail` as a
zero-tolerance critical failure. "The light moved across the floor" was
illegal; "he later described himself as" was the only legal way to write
despair. The July record's own stated reason for the rule was runtime
validatability ("Runtime factual validation is impossible against prose
blobs"), written for a future where a model writes the beats. No model writes
beats today; served prose is byte-identical to `canonicalText`.

The pipeline also stalled the library: after two weeks, one of fifty stories had
cleared the bar, and the blocking findings were mostly citation locators.

## The decision

Keep the honest floor. Move the truth accounting out of the sentences and into
the record the reader can open.

**Floor that does not move.** No invented events, causes, quotations, numbers,
chronology, or claims about real third parties. Every material claim stays a
fact atom with an exact or bounded locator. The safety categories (diagnosis,
false promise, trauma equivalence, harmful advice, privacy echo, boundary
violation) stay absolute.

**What changes.**

1. A third sentence treatment, `dramatized_texture`: scene detail, gesture,
   weather, or interior life that renders a documented moment. The validator
   requires it to be grounded in at least one fact, forbids it on the bridge,
   and rejects any texture sentence that carries a quotation mark, a digit, or
   a whole-word match of any allowlisted person, place, organization, or work.
   A non-bridge passage must still contain at least one documented sentence.
2. A fourth treatment, `reader_permission`: up to two short second-person
   sentences that close the bridge ("You do not have to know how it ends to
   keep going."). Bounded by shape, not allowlisted by text: 3 to 24 words,
   second person, no digits, no quotation marks, no instruction or promise
   (the same tone regex that guards personalized templates), no figure name.
   The two distance sentences in `lib/reader-bridge-copy.ts` are unchanged.
3. The public transparency projection gains two evidence classes
   (`documented_with_texture`, `qualified_evidence_with_texture`) and an
   optional per-passage `dramatizedSentences` list holding the exact texture
   sentences. The key is omitted, not empty, on passages without texture, so
   every stored artifact re-projects byte-identically.
4. The afterword's folded section becomes "Who this was, and what really
   happened": the figure's name and dates, the documented record claim by
   claim with its evidence, the lines we wrote ourselves, how each passage was
   told, quotations, and where to read more. The report-a-concern drawer is
   unchanged.
5. `unsupported_sensory_detail` is redefined in the benchmark protocol
   (v2): undeclared sensory or interior detail, or declared texture that
   smuggles in a person, place, date, amount, quotation, event, or causal
   link. The policy version moves to `story-quality-release-v2-2026-09`.
6. A pre-bridge anonymity check is added as a validator **warning** (any
   allowlisted person name or four-digit year in beats 0 to 5). It is a
   warning rather than an error so the deployed build keeps serving the
   already-published Douglass v1 until its story-first replacement is
   published; the local promotion tool refuses candidates with warnings.

## Why the StorySpec schema version did not move

`story-spec-v1-2026-07` is pinned by the selected production recipe, and the
recipe registry is append-only with a promotion authority that the July record
deliberately left unenforceable until branch protection exists. Bumping the
schema constant would invalidate the selected recipe and fail production
closed until a promotion that the repository's own rules currently forbid.

The two new treatments are a strictly additive extension: every v1 document
remains valid and means the same thing, the parser is a superset, and nothing
downstream changes for documents that do not use them. A build older than this
change quarantines a texture-bearing row on read, which is the designed
fail-closed behavior. The trade is recorded here so a later reader knows the
version string covers both shapes; the next incompatible change to the
document must bump the version and go through promotion.

## What this does not change

- Anti-echo: shape and facet text still never reach the reranker.
- Privacy taint: no reader-derived text enters composition; the disclosure echo
  check still runs on every beat, texture included.
- No prompt logging, the crisis path, ownership, and 404-over-500 are untouched.
- The model still writes no story prose. Texture is hand-authored and reviewed.

## The craft side

The rules that produce interesting, honest beats are in `prompts/story-recipe.md`,
written from a research pass over narrative craft, the psychology of
comforting and inspiring stories, formats that already do this well, what
distressed readers actually want, and how biographers disclose invention.
`prompts/figure-beats.md` remains the generation template and defers to the
recipe where they differ.
