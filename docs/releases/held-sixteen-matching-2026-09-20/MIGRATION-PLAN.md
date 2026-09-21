# Proposed implementation/dataset release plan — not approved for execution

## Current decision

Do not install `keyword-routes.json`, register this draft as production gold,
merge a serving catalog replacement, or publish the sixteen candidates yet.
The frozen diagnostic has twelve positive shortlist failures and unresolved
coverage/semantic decisions. Keep the current production state unchanged.

Story text approval remains recorded in the prior packet. New benchmark and
implementation approval must be distinct: approval of prose does not settle
matching behavior, coverage loss, release authority or rollback compatibility.

## Why an ordinary promotion does not solve this

There are three different operations:

- A **catalog-only content release** can retain an already promoted recipe.
  `docs/DEPLOYING.md` documents fresh real-provider passing evidence bound to
  the committed catalog and append-only library lineage. Registering a new eval
  dataset and explicitly selecting it for evaluation can be independent of a
  recipe's immutable default (`scripts/recipe-evidence.ts`, `datasetForEval`).
  That capability alone does not approve changed coverage or fix failed matching.
- **Keyword routing changes** alter the installed scoring implementation.
  `lib/match-recipe-constants.ts` identifies that implementation, and
  `assertStoryRecipeCodeIdentity` in `lib/story-recipe-runtime.ts` currently
  supports only its exact version. Keeping the old identity would misrepresent
  behavior; simply bumping it would invalidate the current primary/rollback.
- **Selector-only promotion** explicitly forbids changing `matchConfigVersion`,
  `datasetVersion` or the library snapshot. Both the governance validator and
  trusted attestor enforce those release-bound axes. It cannot serve as a
  shortcut for a cross-version implementation/dataset cutover.

Additionally, `scripts/check-recipe-governance.ts` currently binds a selected
synthetic primary dataset to `evals/match.json`. A new selected synthetic default
needs explicit dataset-path/version compatibility while preserving that old
file. Do not delete this assertion, overwrite the original, relabel a development
set as protected, or silently reuse the old recipe identity to obtain green CI.

The draft contains 37 hard cases, below the current selector-promotion minimum
of 40 (`RECIPE_PROMOTION_POLICY`). It is also synthetic, not protected/blind.
This floor is separate from catalog-only release rules. Do not inflate weak
decoys to reach forty or reduce the floor to fit this draft.

## Proposed next work, with explicit checkpoints

1. **Review coverage decisions.** Resolve or explicitly accept each of the 33
   original-input coverage losses. Decide how partial comparisons will be
   checked without inventing old premises, including Rudolph's adult partial
   analogy and Poitier's uncertain chronology. Preserve current frozen bytes.
2. **Design an honest matching change.** Address paraphrases and contextual
   distinctions, not just exact fixture phrases. Include neutral/negated
   audition, feedback, composing, childcare and activity-switching contrasts.
   Do not use figure names, test ages, unsupported emotion tags, wider age
   windows, enlarged top-K or lowered trust thresholds as pass shortcuts.
   Use this now-observed draft for development, never call it an unseen holdout.
3. **Review implementation and dataset compatibility separately.** Specify
   versioned dispatch or another explicit forward/rollback mechanism that can
   execute both intended versions. Specify immutable dataset path/hash lookup
   independently of the original default. Test fail-closed handling of unknown
   versions, old session replay and both rollback targets. This is a new release
   mechanism design, not permission to weaken selector-promotion checks.
4. **Establish release authority.** Confirm appropriate independent review,
   required checks and protected release environment. A read-only check on
   2026-09-21 UTC found this repository public, main branch protection absent
   (404), effective main rules empty, and `recipe-promotion` environment absent
   (404). The old private-repository/plan-limitation explanation is stale.
   No settings were changed; configuring controls requires a separate request.
5. **Obtain genuinely independent evidence.** Independently authored protected
   coverage must satisfy the unchanged applicable sample floors, safety and
   statistical policy. Freeze before evaluation. Keep original-104, retained
   legacy, new, hard, miss, framing and unresolved-challenge reports separate.
   Commit implementation/catalog inputs first, then gather real-provider
   evidence tied to exact commits and hashes, at concurrency one. Retain failed
   evidence. Do not run a repeatedly known-failing candidate just to spend quota.
6. **Approve a staged cutover only after green evidence.** Append new records;
   never edit historical manifests, datasets, decisions or release entries.
   Verify staging against production-style published-only eligibility. Review
   the exact rollback build/catalog/selector combination, including old-session
   behavior and fingerprints, before an authorized main merge/deploy.
7. **Targeted content publication after successful cutover.** Seed from the same
   verified release commit. Preserve old held stages and all session/FK history;
   do not delete or rekey them. Apply owner review only to the exact approved
   candidate bytes. Publish only approved targets and verify each is eligible,
   renders all seven canonical beats, survives replay, exposes correct sources
   and cannot revive retired premises. Perform bounded live canaries and report
   observed production results, not merely a successful build.

This packet stops at the first review checkpoint. It has not supplied the new
compatibility mechanism, protected authority, passing provider evidence or
production cutover. Those are remaining work, not hidden assumptions.
