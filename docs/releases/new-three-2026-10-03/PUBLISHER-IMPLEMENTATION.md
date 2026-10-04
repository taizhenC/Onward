# Exact-three publisher implementation

Captured 2026-10-04T04:12:27.671Z. Offline implementation passes; independent review and live publication remain pending.

The new publisher binds the complete owner decision, frozen three candidates and stages, reading packet, source library, unchanged recipe and matching inputs, actual failed104 evidence and blocked supplemental12. It attributes researcher, historical reviewer and tone reviewer roles to the same actual owner at the authorization time. It creates no fictitious independent human approval.

Offline check: **66 checks passed, including 54 expected rejections**. TypeScript, scoped ESLint with zero warnings, and publisher --self-test passed. These commands read no environment files, call no network/provider/database, and write no release or private selection receipts. The full probe results and executable hashes are in PUBLISHER-IMPLEMENTATION.json.

## Invocation

Run from the managed repository. Default/no arguments or --self-test is offline.

```powershell
node --import tsx docs/releases/new-three-2026-10-03/check-owner-publication.ts
node --import tsx docs/releases/new-three-2026-10-03/publish-owner-approved.ts --self-test
node --import tsx docs/releases/new-three-2026-10-03/publish-owner-approved.ts --preflight --deployment-proof=<absolute-proof> --deployment-proof-sha256=<sha256>
node --import tsx docs/releases/new-three-2026-10-03/publish-owner-approved.ts --publish --selection=<absolute-selection> --selection-sha256=<sha256> --baseline=<absolute-baseline> --baseline-sha256=<sha256> --deployment-proof=<same-absolute-proof> --deployment-proof-sha256=<same-sha256>
node --import tsx docs/releases/new-three-2026-10-03/publish-owner-approved.ts --verify --selection=<same-absolute-selection> --selection-sha256=<same-sha256> --baseline=<same-absolute-baseline> --baseline-sha256=<same-sha256> --deployment-proof=<same-M1-proof> --deployment-proof-sha256=<same-sha256>
```

Preflight requires all three exact drafts, 63 figures, 63 stages, 64 specs and 44 valid publications, with zero quarantines. It compares every original pre-import row and lifecycle against the immutable private 11a6… draft-import baseline. A fresh timestamp/UUID directory under docs/research/new-three-2026-10-03/publication contains exclusive SELECTION.json and BASELINE.json. The output supplies their absolute paths and whole-file hashes. The original draft-import baseline is never overwritten.

## Proof and mutation guards

The deployment proof schema is new-three-production-deployment-v1, phase code-before-publication, with exact repository taizhenC/Onward, sourceHead, requestedSha, successful Production deployment SHA, library hash and owner hash. CI must bind sourceHead and include successful verify, detect-recipe-promotion, recipe-promotion-gate, Vercel and Vercel Preview Comments. A completed skipped attest-recipe-promotion is the sole skip allowance. Conflicting/pending/failing check fields fail. Read-only Git ancestry plus deployed tree byte checks bind executable helpers, complete approved inputs, and runtime/validation directories. Credentials load only after these checks.

Immediately before each review update, a fresh full catalog validates all figures, sixty unrelated stages, sixty-one unrelated specs, all prior44 publications, and lifecycle columns. A full target row with xmin must equal the authorized draft and catalog observation. A PATCH is guarded by exact identity/version/schema/draft status, fresh xmin, creation timestamp, and null publication/retirement times. Exactly one returned full reviewed row is required; zero, multiple, changed content or changed lifecycle fail. xmin is not used as a permanent identity or baseline pin.

Before promotion, the full reviewed row is archived exclusively and reread against the authorization; a fresh full catalog and single-version/no-sibling check precede promote_story_spec_v2 with the complete expected review JSON. Complete readback is mandatory. Only status/review and the target publication lifecycle/stage status may change. Existing already-published retries require the exact full expected published document and the pinned pre-publication review archive. Any receipt collision or drift fails.

Public PUBLISHED-<figureKey>.json contains the complete published spec row and stage, exact selection/baseline/authority pins, and published document hash. PUBLICATION-RECEIPT.json binds all three target receipt hashes, 47 valid publications, zero quarantines, exact readback and prior44/unrelated preservation. It remains immutable. --verify requires that existing receipt, performs fresh catalog reads, creates no publication authority, and writes a distinct timestamp/UUID POST-REFRESH-VERIFICATION receipt. A descendant refresh checkout is accepted only when the deployed M1 executable/source bytes remain unchanged; separate deployment/canary evidence establishes M2 refresh.

## Scope qualification

Offline unrelated catalog rows are synthetic fixtures, while the three target documents are the actual frozen source inputs. These tests establish guard behavior, not actual production preservation. The root operator must execute the pinned live preflight and readbacks. All helpers use only curated tables and the existing publication RPC, with 15-second deadlines and 4-MiB response limits; no Auth, provider, schema or unrelated-user-data operations are present.

The target review PATCH has atomic row-version CAS. Whole-catalog preservation and sibling absence have immediate before/after checks; the existing promotion RPC does not atomically lock the entire catalog. Publication assumes the root is the serialized editorial writer. A detected unexpected change aborts rather than widening the release.

The original104 matching gate remains failed, and supplemental12 remains blocked before provider calls. These helpers report the new exact-three owner exception, never a passed matching gate. Live publication and deployment are not claimed by this implementation report.

## Transport qualification — 2026-10-04

The root operator recorded a bounded impossible-xmin review PATCH at 04:12:27.100 UTC: HTTP 200, Content-Range */0, zero returned rows, and identical complete target row plus xmin before and after. REVIEW-CAS-ZERO-ROW-PROBE.json records zero changed rows. This confirms the deployed zero-row return/count behavior required by the guarded transport. An actual successful one-row review update remains a separate owner-authorized publication operation. This implementation agent made no live call.
