# Three-story publisher audit plan

**Plan ready; implementation and live checks remain pending.** Root reports the owner's new explicit instruction after the matching failures were disclosed: “good, I reiview it, lets merge that and publish to the production”. That authorizes this exact three-story set. It does not change the actual matching results or expand the earlier ten-story decision. This plan uses read-only source and frozen public receipts; no live DB, Auth, provider, environment or source/Git action occurred.

## Exact inputs and catalog bounds

The approved reading packet is `docs/releases/new-three-2026-10-03/READING-PACKET.md`, SHA-256 `475c81587af5559164e9abc810127a213e8edd0527076d7bbf4a882ffde87e1b`. Keep the original pending-review pin as historical evidence; a new owner decision records the later instruction separately. The three drafts and stages remain frozen:

| Figure | StorySpec | Candidate SHA-256 | Stage SHA-256 |
| --- | --- | --- | --- |
| franklin_b | `franklin_b:1727-1728-a-first-customer:v1` | `bed180661652b7f0892baa9ae3b24f1af0027342dacc6901d3335c96d5dd7fc4` | `1a88acec9580e2bdec22bd64e0a668e577658b9076bbda80899e0ff5104093d7` |
| slocum_j | `slocum_j:1892-1895-a-boat-in-the-field:v1` | `a0a5c8a53c18fa97667ab1337f69a559c055c265a0ae5d4d003236c71ac778b1` | `bae80966aee65afd5e00ee98c8888ae5e54da51645d737df1d89fb685854ecb2` |
| somerville_m | `somerville_m:1827-1831-a-manuscript-in-secret:v1` | `3e13e429368a9d627d6b612593e2888fd1e20a41926873001310be6242cbb82d` | `9da559979a7144482a8a46844e9593278b86f829490e9382745d36236ccbeda9` |

The exact source 63 library is `1a33b7b45b48bc054f0eb0d1504bfd7ac312a07f41f678ff032acfa9e97eaa90`. The unchanged primary recipe remains `keyword-rerank-figure-library-50-2026-07-02`; K, prompts, keyword routes, thresholds, original gold, selectors and historical evidence remain pinned. The failed 104 evidence and blocked 12 attempt must stay failed/unmeasured in the new scoped owner exception. Passing ordinary CI cannot relabel them.

Fresh preflight must see 63 figures, 63 stages, 64 specs and 44 valid published stories. Successful final readback must retain those total row counts and show 47 valid publications, 47 matching published stages and zero quarantine. All 63 figures, 60 non-target stages, 61 non-target full specs and prior 44 full published rows remain unchanged.

## Publisher requirements

1. **authority.** Create a separate exact-three owner decision using the new verbatim instruction and bind the reading packet, candidate/stage hashes, source 63 hash, failed 104 evidence and blocked 12 attempt. Preserve actual failures; no general recipe promotion or inherited ten-story exception.

2. **source.** Reinstall exact63 source hash1a33b7b45b48bc054f0eb0d1504bfd7ac312a07f41f678ff032acfa9e97eaa90. Append only its scoped release decision; preserve original60 values/order, historical decisions and the immutable primary/rollback recipe selection, prompts, keyword routes, K, thresholds and gold inputs.

3. **offline.** Validate all authority/input/schema/review/prose/stage pins before env loading or DB client construction. Unknown/duplicate/malformed CLI arguments reject. Offline mode performs no env, network, DB/Auth/provider work.

4. **baseline.** Capture a fresh publication baseline in a new ignored private timestamp/UUID path with wx; initial63figures/63stages/64specs and 44 valid publications. Pin path and bytes in immutable selection/start receipts. Original importer DB-BEFORE remains untouched at11a6d8ca49a34bc3e9dadce24a72aee253c035bc73a957d1f12d2461f49df7a2.

5. **preservation.** Preserve all63 figure rows, all60 non-target stage rows and61 non-target full spec rows, including created_at/published_at/retired_at. Preserve prior 44 full publications. Compare against fixed initial publish snapshot before and after each transition and across retries; reject extra/missing/drifted rows before writes.

6. **targets.** Exactly Franklin/Slocum/Somerville v1 identifiers, versions and stage identities; exact frozen draft documents, empty reviews, null published_at/retired_at and valid stable creation timestamps. Initially no other published spec may share a target stage; recheck before RPC because existing promotion retires such siblings.

7. **review.** One actual owner may occupy the schema research/historical/tone roles; record this truthfully and bind one fixed reviewedAt. Do not claim independent human review, measured matching success or prior approvals. Full-document atomic draft-to-review CAS must match complete draft JSON plus identity/version/schema/current draft status and lifecycle guards; exactly one row updated.

8. **promotion.** Validate/read back the complete reviewed document and unchanged lifecycle, archive it immutably, then invoke existing promote_story_spec_v2 with the exact receipt-bound full review spec. Do not call legacy promotion, seeding/upsert, insert, delete, target-content rewrite or direct stage publication.

9. **retry.** Retries retain selection/review time/input/source/evidence/baseline pins. Accept only exact draft, exact reviewed or exact published members of this targetset; published members require the precomputed complete expected published-spec hash, archived reviewed authority and unchanged lifecycle. Existing published receipts/readbacks must retain their full row/stage/hash pins. No generic status-only skip.

10. **readback.** After each target and final completion, compare full published specs, canonical evidence/prose/review, full matching stages and allowed lifecycle changes. Only target review/status, server publication timestamp and target stage status may change. Expected counts remain63/63/64 with47 valid publications, 47 matching published stages,0 quarantined rows; all61 unrelated specs/60 unrelated stages and63figures unchanged.

11. **bounds.** Only bounded complete reads of figures/figure_stages/story_specs; strict production HTTPS host mbcqkljfekkxlgittzal.supabase.co. Require exact row counts/count headers or equivalent complete-response proof, deadline/byte caps, no raw credentials, no Auth/users/sessions/provider/embedding access and no broad retries.

12. **deployment.** Bind passing normal CI to final updated PR148 source/head, merge and deploy exact63 source before publication. Record worker refresh, read-only health and live canary separately after root receives actual proof; publishing alone cannot establish deployed/cache-ready availability.

The original importer baseline stays at `docs/research/new-three-2026-10-03/DB-BEFORE.json`, SHA-256 `11a6d8ca49a34bc3e9dadce24a72aee253c035bc73a957d1f12d2461f49df7a2`. It proves pre-import preservation and must never become the publication snapshot. Create a new ignored private publication path with exclusive `wx`, then pin its path, bytes, input selection and timestamp for every attempt. Do not refresh or overwrite it during retries. Public receipts contain identifiers, bounded counts and hashes; complete curated rows remain in private storage.

## Findings from the prior pattern

The old ten-story review transition guarded empty review and canonical passages, expressly without a full-document atomic CAS. Copying it would permit an evidence or other document change between read and update to be overwritten. The new transition must compare the entire frozen draft JSON and row/lifecycle predicates atomically, require exactly one changed row, and verify the complete review readback.

SQL 0023's existing `promote_story_spec_v2` locks and compares the complete reviewed JSON, but also retires a currently published sibling for that figure/stage. The publisher must prove no such non-target published sibling exists. Its whole-catalog and lifecycle preservation checks remain immediate pre/post checks within a serialized editorial window; they are not an all-catalog transaction or a new whole-row RPC CAS.

One actual owner can occupy the three required schema roles, with one fixed review timestamp and explicit one-owner qualification. Independent AI source/craft review is recorded honestly and cannot be represented as three independent human approvals. Full expected published-document hashes must be fixed before writes and checked on every retry, so `status=published` alone never permits a skip. Already-published exact targets must carry this selection's reviewed authority and expected complete document; existing archived publication row/stage/hash pins cannot be overwritten.

## Audit after root handoff

Once root provides final helper hashes, review the code read-only and build source-derived offline mocks. Exercise fresh success and exact partial/repeat recovery, then reject wrong authority/host/target/source/failure pins; any canonical/source/review/stage mutation; lifecycle, missing/extra or unrelated catalog drift; CAS zero/multirow/race cases; receipt/baseline tamper; published siblings; malformed arguments; and transport/boundary failures. The structured [plan](PUBLISHER-PLAN.json) records the full probe groups and old helper hashes. No new publisher or authority module has been executed or audited yet.

Merge, deployment, worker refresh, read-only health and live canary require separate actual receipts from root. A successful database publication receipt proves database state; it cannot by itself prove refreshed production availability. The old ten-story exception files remain untouched.
