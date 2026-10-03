# Independent audit of the production publication checker

Reviewed October 3, 2026, at 01:53 UTC. Exact file: `verify-owner-publication.ts`, SHA-256 `6b56a7f8a2ded08f6f8cecd8e4990313e135a20c3c7d178abf098889dad949a9`.

**No material checker defect found.** This is preparation review only. The reviewer ran no live query, loaded no environment credentials, and performed no production, Auth, reader, session or provider access. The file was not edited.

The live path requires complete external SHA pins for the owner publication selection, full baseline and final receipt. Before any network work it verifies their bytes, the immutable owner authorization and writing baseline, exact ten independently reviewed candidate/original/V2 stage inputs, unchanged owner review, archived full reviewed/published receipts, failed matching evidence identity and explicit owner-exception checks. It retains the actual matching and recorded security failures.

Network access comprises exactly three fixed GETs to `figures`, `figure_stages` and `story_specs` on the independently established production hostname, using explicit public editorial column lists. The base must use HTTPS, the exact hostname, no credentials in the URL and no extra path/query/fragment. Redirects fail. Each full response, including streamed body consumption, is bounded by a 15-second AbortSignal deadline, 4 MiB maximum and 100 rows; the exact-count header must match the parsed array. There are no retries, pagination, mutation paths, Auth calls or reads from reader/user/session/provider tables.

The inspector requires 60 figures, 60 stages and 61 specs; exactly 44 raw and valid published specs, 44 published stages, zero quarantined rows and exact publication/stage parity. All ten full published documents, source attribution, canonical prose, complete owner review and V2 stages must equal the selection and publication archive. Creation timestamps equal the new prepublication baseline; publication timestamps must be valid and follow that baseline; retirement timestamps remain null. All prior 34 full publication rows and all unrelated current baseline rows and lifecycle fields must be identical. The previous writing baseline independently proves the original 50 stage and 51 spec captured core fields; the report correctly limits that older comparison rather than inventing historical lifecycle timestamps.

Raw curated rows stay in memory. Saved output contains public historical identities, scope statements, counts, bounded request statistics and hashes. Credentials, request headers and raw response bodies are never written. The outer error boundary only emits an allowlisted `post_...` code or a fixed generic code, without raw exception text. Imported inspection/validation functions do not log raw rows. The checker explicitly reports `deploymentVerifiedByThisCheck: false`; database success does not claim a refreshed worker or deployed route.

Checks run by this reviewer:

- `node --import tsx docs/releases/new-stories-production-2026-10-02/verify-owner-publication.ts --self-test`: passed one positive fixture and ten negative cases, with fetch forbidden and zero network requests. Negatives cover a draft target, canonical prose change, owner-review change, V2 facts change, prior-publication change, unrelated draft lifecycle change, target creation change, missing publication timestamp, source-attribution change and invalid published schema.
- `npx eslint docs/releases/new-stories-production-2026-10-02/verify-owner-publication.ts --max-warnings=0`: exit code 0.

The root operator's full type/build suite and the eventual live query receipt remain separate evidence. This audit does not assert that any story has been published or deployed.
