# Independent audit of the owner publication pathway

Reviewed October 3, 2026, at 01:41 UTC; final portability verification at 01:43 UTC. Scope: the new owner authority adapter, exact-ten metadata update and publication tools, owner authorization, content release entry, and matching governance changes. This audit performed only offline checks and wrote this document. It did not publish, query production, load environment secrets, or call a provider.

**Finding: no material preparation defect found in the reviewed bytes.** The pathway records an explicit owner exception while preserving the real matching failure and full security audit failure. Live publication and deployed availability remain to be verified separately by the root operator.

## Exact reviewed bytes

| File | SHA-256 |
| --- | --- |
| `owner-publication-authority.ts` | `68f845888d2bb730c9817ffe5ec91736e525e85dc66bb5dab5f13061f7ff7135` |
| `apply-owner-approved-stage-v2.ts` | `2e262c4ef02c33e79a8b2b9f08a15dd9a9f319155f8abf592e79abc4c84ccadb` |
| `publish-owner-approved.ts` | `a312cfcc1a8fc19efd88c8fb8fa60ca9e9fcf2f221331e1abf8e6ae3edef9c85` |
| `scripts/check-recipe-governance.ts` | `70279a5afe9fd0ae319631dd32db0662b54a429314839ebc03901afe6a6b7832` |
| `config/figure-library-releases.json` | `45e95abf0129ee73be8658ab7fbcf4dde55a64b8ccd73e60cf8eb74f94800a1a` |
| `OWNER-AUTHORIZATION.json` | `454ea8a5eb1cba3c595d5824230cc2e5f1f4295bd6dae9e79c7958c3739a31d8` |

The unchanged reviewed facts input helper is also bound to the independent V2 proposal `9427e7e099252b91d7f23b3873fa0a32b9f770a93aa0dcfacc2a47c44e7883ac` and source review `24986cb92b7e7715bbdac8dbe901b4d20108a267878ed07dd3d68471562111d7`. The owner decision binds all ten complete candidate, original stage and V2 production-stage hashes.

## Authority and integrity findings

The authority adapter requires the exact user statement, “I checked it, publish those into the production”, the complete owner authorization hash, the expected owner identity, exact current library hash, original selected recipe, complete real-provider 104-case failed evidence and its byte hash, current lockfile hash, source-reviewed V2 targets, and newest library release. It invokes installed recipe governance before authorizing a live operation. Its distinct receipt schema has `realProviderTrustGate: false` and `ownerException: true`; it does not mint a passing matching receipt or a passing security audit.

The governance change accepts only the explicitly pinned library at release index 1 after the immutable bootstrap. It retains ordinary releases' passing-evidence requirement and the existing real-provider, promoted recipe, full source commit, committed library hash and input-tree provenance checks. A different library, evidence, recipe, altered authority, forged gate result or future release cannot reuse this exception. Historical recipe and lock pins are read from the failed evidence's committed source, rather than indefinitely freezing the working dependency lock. Future security patches therefore do not require rewriting this historical owner decision.

The metadata updater permits only the exact ten factual summaries and the exact two independently reviewed theme additions. It guards draft identity plus both overwritten original fields. Complete immediate pre/post catalog equality preserves all StorySpec documents and their lifecycle timestamps, figure metadata and unrelated stages. It retains immutable selection, baseline, start and per-target receipts. Both live tools bind the independently identified production database hostname and require the separately hashed owner receipt.

Publication preserves complete source/canonical story documents while recording one actual owner in the three required schema roles, without inventing three independent humans. It validates exact drafts and reviewed documents, creation/publication/retirement timestamps, prior 34 publication documents/stages and all unrelated current baseline rows. The terminal operation calls `promote_story_spec_v2` with the complete archived reviewed JSON document. The existing migration implements row locking, full JSON equality, stage locking, status transition and stage publication in one transaction; its behavior was inspected, not redefined by these changes. Immediate read-back checks require the exact published document, correct stage parity, valid lifecycle times and a total of 44 valid publications with zero quarantined rows before success is recorded.

## Checks actually run

All four commands returned exit code 0:

- `node --import tsx docs/releases/new-stories-production-2026-10-02/owner-publication-authority.ts --self-test`: 10 negative authority cases.
- `node --import tsx docs/releases/new-stories-production-2026-10-02/apply-owner-approved-stage-v2.ts --validate-inputs`: ten factual summaries, two theme additions; maximum guarded URL length 4,524, below 7,500.
- `node --import tsx docs/releases/new-stories-production-2026-10-02/publish-owner-approved.ts --validate-inputs`: ten exact finished stories, three schema roles, one actual owner, source/canonical evidence preserved.
- `node --import tsx scripts/check-recipe-governance.ts`: governance passes under the explicitly disclosed exception; 9 negative tamper cases reject. Output explicitly preserves failed matching and security results.

Six additional independent in-memory negative cases rejected a different owner, altered candidate hash, different StorySpec identity, duplicate target, an added claim `standardAuditPassed: true`, and invalid completion timestamp. These tests performed zero database reads/mutations and zero provider requests. Total negative cases exercised across the adapter, governance and independent checks: 25.

The first actual producer invocation from the original checkout to the managed production checkout exposed a `server-only` module-cache portability defect before any receipt or live mutation. The final reviewed fix imports the installed checkout's existing `scripts/_smoke-bootstrap.ts` immediately before importing its server data module; it changes only the CLI cache alias already used by that checkout. Root's offline producer succeeded at `2026-10-03T01:42:21.293Z`, producing owner receipt SHA-256 `4d8ea478a834b0e318452bfaf2191f9c5a30248f6cee4b5b4a288a0df916fc96`, with zero database/Auth/provider work. This independent reviewer then verified that complete pinned receipt from the original checkout against the managed repository with `readOwnerRelease` at `2026-10-03T01:43:10.863Z`; all ten targets, exact authority/source inputs, newest release and installed governance passed, while `realProviderTrustGate` remained false. The 10 authority and 9 governance negative checks also passed again on the final changed bytes.

## Operational limits

The compact draft-to-review update is not an atomic full-document compare-and-swap. It guards empty review plus every canonical passage and checks complete immediate pre/post documents. Root must retain the documented serialized editorial window to avoid overwriting a concurrent change to an unguarded field. This limitation is explicit and unchanged from the previously reviewed publisher; the terminal publication remains a full-document compare-and-swap.

This audit does not establish deployed availability, database RPC installation/attestation, real publication results, or success of the full root CI suite. Those require the separate preflight, mutation receipts and live verification. The full dependency audit remains failed; runtime-only zero findings remain supplemental evidence. Final governance logging now describes the *recorded* security failure, avoiding a false claim about a future patched working lock's current audit result.
