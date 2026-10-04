# Prepared bounded production canary

The new helper is prepared and tested offline. No production canary, guest, database request or provider request was executed in this task. Root’s [independent helper review](CANARY-CROSS-REVIEW.md) and actual offline self-test passed at 2026-10-04T04:09:32.476Z, with no findings. The helper is frozen at the hash below. Root must inspect the actual publication and post-publication deployment receipts, then create the SHA-bound authority manifest before running it. This document supersedes the earlier plan’s execution examples: one unchanged Somerville case only, with no new Franklin fixture or repeated attempts.

The predetermined input is frozen case **zero-based 3**, age **46**, expected figure `somerville_m`. Its exact text remains in [the frozen case file](NEW-THREE-MATCH-CASES.json), SHA `acb9830130d99d362d81706ea88baa58a3116a77b892b11f408242277e29c189`. A wrong selected figure or non-story response stops delivery, records the actual result, and still runs normal guest cleanup. The attempt marker is written with exclusive creation before signup; a second guest or match is refused.

The private source is `docs/research/new-three-2026-10-03/run-production-canary.ts` in ROOT and managed, SHA `74dc29e4a7c8510e5d0f0f03cf562f64499c3f3fe47b01c6f478cd04b41a8bb2`. The launcher SHA is `74dce433aefb45ef8fd46fc68c380c6e20d1725df48d065b0501633af4295d0b`. ROOT and managed source bytes must agree. The launcher runs Node/tsx from the managed worktree; the helper loads ROOT’s environment only in process after every local authority, frozen input and publication/deployment guard succeeds. Secrets, raw errors, cookies, HTML and private Auth/session/artifact identities stay out of receipts and tool output.

## Invocation and prerequisites

Offline self-test:

```powershell
node D:/code_save/Onward/docs/research/new-three-2026-10-03/run-production-canary.mjs --self-test
```

Isolated TypeScript check, from the managed worktree:

```powershell
node node_modules/typescript/lib/tsc.js --project docs/research/new-three-2026-10-03/run-production-canary.typecheck.json --pretty false
```

Live invocation is for root after publication and refresh, using the actual 40-character merged M2 commit and an inspected, actual SHA-bound manifest:

```text
node D:/code_save/Onward/docs/research/new-three-2026-10-03/run-production-canary.mjs --run --deployment=<exact M2 40-character SHA> --authority=CANARY-AUTHORITY.json --authority-sha=<exact actual manifest 64-character SHA>
```

[The machine-readable plan](CANARY-PLAN-IMPLEMENTATION.json) documents the manifest shape. Its placeholders are deliberately non-executable. Root should create `CANARY-AUTHORITY.json` inside this release packet, with the exact helper SHA and actual file SHA descriptors for `PUBLICATION-RECEIPT.json`, `PUBLISHED-somerville_m.json`, `PRODUCTION-TARGET-PROOF.json` and the exact `DEPLOYMENT-post-publication-refresh-<M2>.json`. Pass the actual manifest SHA on the command line. Every dependency is limited to a leaf JSON filename within the release folder.

The publication guard requires the publisher’s `new-three-owner-publication-receipt-v1` schema: 47 valid publications, zero quarantines, previous 44 and unrelated catalog preserved, exact readback, exact three target candidate/stage/spec pins, correct owner and library. The target receipt’s full published row must normalize exactly to the frozen unreviewed Somerville draft, with valid publication review and lifecycle. Its byte pin must equal the target metadata in the catalog receipt.

The production guard requires origin `https://onwardapp.me` and verified bundle/local Supabase hostname `mbcqkljfekkxlgittzal.supabase.co`. The deployment proof must be `new-three-production-deployment-v1`, repository `taizhenC/Onward`, phase `post-publication-refresh`, exact requested/observed M2 commit, Production success, approved library and owner pins, and source-head CI. All five mandatory checks must be SUCCESS: verify, detect-recipe-promotion, recipe-promotion-gate, Vercel Preview Comments and Vercel. Unresolved or failing checks are refused.

## Delivery and cleanup

The helper signs in once through normal anonymous Auth and sends one normal `/api/match` request with the frozen age and feeling. It records the exact known owned session and artifact before asserting the expected selection, so a wrong selection still has bounded cleanup targets. It checks the actual session and v5 artifact for the exact post-publication deployment, unchanged recipe/manifest, canonical composer, reviewed published Somerville text, seven roles, strict integrity and exact assembled chunks. It uses the initial normal owned SSR route, retrieves every actual beat chunk through `/api/beat`, ACKs every chunk through `/api/beat/ack`, and checks final stored progress 7/0 with the same artifact and recipe.

The final normal owned SSR story route must contain the afterword and source details as rendered HTML: final bridge identity, rationale, facts and locators, citations and links, quotes and declared texture. Script/flight props cannot count as rendered source evidence. This covers SSR/API behavior; it does not claim interactive toggle clicks, telemetry, visual layout, Save or youth intake coverage.

Cleanup uses only the normal owned account deletion flow: confirm the same anonymous Auth owner, get the normal CSRF form, submit its exact acknowledgment, verify the 303 deletion redirect and rendered confirmation page. Independently, even after deletion/confirmation failure, it reads exact known session absence, exact known artifact absence and exact Auth user absence. The Auth admin endpoint is GET-only for the freshly confirmed user; there is no admin delete, purge, user listing or broad ownership query. Explicit missing-user semantics are accepted; other Auth errors cannot count as absence.

The receipt separates normal deletion redirect, confirmation, known session absence, known artifact absence and Auth absence. A failed confirmation keeps the overall result false even if every independently reconciled record is absent. An unconfirmed signup identity remains an unresolved cleanup failure, and the immutable marker blocks another signup. No automatic retry, changed intake or forced figure selection is available.

The global fetch guard permits only the two named origins and bounded normal routes or exact fresh identity filters. One signup, one match, up to 64 beat/ACK requests each, two story GETs, one of each normal deletion route, at most three exact session reads, two exact artifact reads and one exact Auth absence read are permitted. Direct model endpoints and administrative mutations are refused. Production’s normal match route may use its unchanged existing provider path. Delivery has a three-minute deadline; individual requests have timeouts and the child process has a ten-minute bound, allowing separate cleanup time.

## Offline evidence and limitations

The launcher self-test and isolated TypeScript check both passed. Nine negative cases cover source HTML, false report/flight evidence, altered or truncated chunks, premature completion, CLI shape and ambiguous Auth absence. Cookie path/removal checks passed. Two injected cleanup scenarios proved that confirmation failure still calls all three absence checks, and deletion or first read failure does not skip later absence checks. Environment loading was false; network, Auth mutation and database mutation counts were zero. No live attempt/receipt was produced.

Catalog availability remains a separate root/publisher receipt: all three exact stories in 47 valid published entries. A successful fixed Somerville canary proves only that bounded normal route example. The real 104-case result remains failed, 96/101 with three wrong definitive answers. Supplemental failures were measured against the frozen 63-stage memory library before provider calls: five of nine new positive targets were lost. Those losses do not prove Franklin unreachable in production’s 47 published-stage catalog. No input, gold, matcher or threshold was altered here.

The previous Blackwell live receipt remains overall false because the normal confirmation check failed; its completed reading/source/ACK checks cannot be reused as a successful new canary. All source and craft qualifications in the frozen packet remain intact. This work changes only the unique private canary helper and these implementation documents.
