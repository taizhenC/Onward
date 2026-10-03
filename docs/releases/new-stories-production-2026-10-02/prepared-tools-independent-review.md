# Independent review of prepared operator tools

Reviewed 2026-10-03 UTC by `/root/publication_path/prepared_tools_audit`, separately from the tools' author. Scope: `LIVE-CANARY.ts`, `approved-stage-inputs-v2.ts`, `apply-approved-stage-v2.ts`, and the current `publish.ts`. This is agent review of preparation, not human editorial approval, a passing matching gate, publication, deployment, or a live canary receipt.

No unresolved defect was found in the reviewed preparation after the two canary fixes below. The existing serialized editorial-window limitation remains explicit. Both measured matching proposals remain failed; this review does not authorize any release operation or change their evidence.

## Findings corrected during review

1. **Attempted request counts omitted lost responses.** The original story/beat counters incremented only after fetch returned. A sent request that timed out or lost its response would therefore be omitted. Current `LIVE-CANARY.ts` lines 287–288, 297–298, 304–307 and 316–317 increment attempted story, beat and ACK counts before awaiting the request, while successful ACKs increment only after status/next verification. The reduced receipt distinguishes attempted beats/ACKs and successful ACKs.
2. **Report options could mask missing displayed facts.** The original source checker searched the whole rendered page. `StoryAfterword` repeats fact statements in historical-concern select options, so a missing source fact paragraph could still pass. Current lines 67–102 isolate the balanced afterword section and its source-record details by their existing heading IDs. Facts, locators, source citations/links, quotation text and dramatized lines must occur inside that record. Scripts/styles/comments remain excluded. The added negative fixture preserves a removed source fact only in a report option outside the record and must fail.

## Checked guarantees and limits

- The canary fixes production origin/project hostname, frozen case index 2/age 26, the candidate hash, recipe/manifest identity and the exact requested deployed commit. Local publication receipts must establish 44 valid publications and zero quarantined rows before Auth begins.
- A fresh in-memory cookie jar precedes one anonymous signup and one normal match POST. An exclusively created attempt file refuses any subsequent run, including after an ambiguous signup or failed canary. Auth endpoint/repeat guards and per-request timeouts prevent hidden client retries or refresh requests. Story delivery stops at the first error or non-story result; cleanup is the only subsequent flow.
- Service reads filter the freshly known session by its freshly confirmed owner, and the artifact by all three exact identifiers. No catalog/user listing or privileged deletion is present. Cookies, tokens, user/session/artifact identities, prose, response bodies and HTML are not emitted or persisted. Errors from external libraries are reduced to a fixed redacted code.
- The seven canonical beats, all actual artifact chunks, strict artifact envelope, source projection, next indicators and final beat-7/chunk-0 progress are checked. Cleanup reconfirms the anonymous owner and uses the normal account-deletion form, CSRF route, confirmation page and absence of the known owned session. Unconfirmed creation/deletion is reported without inventing success. Coverage remains SSR/API, with no interactive UI, Save, source-toggle telemetry or visual-layout claim.
- Facts-v2 inputs pin the complete proposal, independent review, v1 ancestry, every original/candidate/v1/v2 file, directory membership and sentence-to-existing-fact ledger. Only ten factual summaries and the two exact reviewed theme additions are allowed. The stage updater writes only the corresponding facts/themes columns and guards their exact original values plus identity/draft status. Full snapshots preserve all four figure columns, thirteen stage columns and ten StorySpec columns, including lifecycle timestamps.
- Publication checks exact candidate/stage ancestry, passed-gate hash, newest installed library release/evidence, complete stage equality, immutable baseline/receipts and full catalog preservation. The actual `promote_story_spec_v2` function locks the reviewed row and compares the complete expected reviewed JSON before publishing it and its stage.

**Existing operator limitation:** `publish.ts` lines 323–330 replace the complete draft document while atomically guarding empty review and seven canonical texts, rather than the complete draft JSON. A concurrent same-prose edit to facts/sources/entities/limits could be overwritten before readback. The complete promotion CAS does not close that earlier race. This path was already expressly authorized with a serialized editorial window; retain that operational assumption and do not describe the review transition as full-document atomic protection. A future exact-draft transition RPC would close it, but no migration/RPC expansion belongs to this preparation task. Likewise, stage/catalog preservation checks detect unrelated concurrent edits after reads; they do not provide a transaction spanning the whole catalog.

## Verification performed

Only offline commands ran in this review. `LIVE-CANARY.ts --self-test` passed six negative cases, reporting zero network requests, zero Auth mutations and zero database mutations. `apply-approved-stage-v2.ts --validate-inputs` passed all ten summaries/two theme additions, with maximum guarded URL length 4,524 and zero database/Auth/provider operations. Parent handles the final typecheck/scoped lint after these fixes.

The fourteen relevant route/player/progress/artifact/transparency/retention/parser files were also byte-compared with `C:/Users/taich/.codex/worktrees/ten-story-production/Onward`; all matched. No live database, Auth, provider, website, git or deployment operation was performed by this reviewer. No attempt, selection, baseline, mutation or publication receipt was created.

Reviewed file SHA-256 values:

| File | SHA-256 |
| --- | --- |
| LIVE-CANARY.ts | `1b57debc2a3cdd66cfdf3e84b9bf660e43f530d56483fbd29b1a7c879f1a5388` |
| approved-stage-inputs-v2.ts | `2711cd4a7174f2d6c919e49fc7a5a369884bb6c01fa891f084fbad50a54713c5` |
| apply-approved-stage-v2.ts | `4ef2eeccdf87a7cac5f30b158e816781464a4dfff8f459e2d7d0bcf71c082bd5` |
| publish.ts | `6fb0fda06fa9956df705922f7e2ca0079c477bcb84d0c7a26791ff781870d490` |
