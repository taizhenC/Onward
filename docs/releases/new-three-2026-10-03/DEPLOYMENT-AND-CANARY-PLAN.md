# Deployment and canary plan for the approved three stories

Prepared October 3, 2026 local, at 2026-10-04T03:53:59.890Z UTC. This is a read-only operational audit and plan. It has not deployed code, queried or changed the production database, called a provider, created an account, used a browser, or run a canary.

The user has reviewed the new three-story packet and explicitly requested: “good, I reiview it, lets merge that and publish to the production”. Root will record a new exception and release authority for **exactly Franklin, Slocum, and Somerville**, pinned to reading SHA-256 `475c81587af5559164e9abc810127a213e8edd0527076d7bbf4a882ffde87e1b`. The old ten-story exception is not reused. The earlier immutable packet pin's pending-review statement is historical; the new authorization belongs in a separate record. The failed matching evidence remains failed.

## Available deployment proof

The existing authenticated GitHub CLI successfully reads `taizhenC/Onward`. GitHub connector read tools are also available. There is no callable Vercel connector, no Vercel CLI on PATH, and no local `.vercel` metadata. The existing Git integration supplies the deployment path without a new login or credential.

At the observed checkpoint, [PR #148](https://github.com/taizhenC/Onward/pull/148) is open at head `deccfeb06382510b10874121ea13ac407253ebcc`, with successful CI verification and recipe-promotion gate. Its Vercel check is a preview check and does not prove production deployment. Main is `405f82357351723da6000b9a169999f3c7975191`.

The [GitHub deployment record](https://api.github.com/repos/taizhenC/Onward/deployments/6822273648) has that exact main SHA and named environment `Production`. Its [status history](https://api.github.com/repos/taizhenC/Onward/deployments/6822273648/statuses) reports `success`, “Deployment has completed,” and [the unique Vercel URL](https://onward-d6oq6vg70-taizhencs-projects.vercel.app). GitHub's separate `production_environment` boolean is false in this integration record; no direct Vercel READY/alias-membership result was available. The combination of exact deployment history and later actual worker identity on `onwardapp.me` must establish the new release. A home-page 200, `x-vercel-id`, preview success, or publication receipt alone is insufficient.

Re-read PR checks after root restores the proposed 63-stage library and records the new exact scope. The current head's passing checks do not transfer to a changed head.

## Deployment and cache-refresh sequence

1. Root records the exact three-story owner authorization, matching-failure disclosure and release exception. Prepare the 63-stage content integration while preserving the first 60, the recipe selector, frozen gold and matching code. Verify the complete workflow for the final exact PR head.
2. Merge the checked head of PR #148 normally. Record the resulting main commit and wait for the Vercel GitHub integration's successful `Production` deployment for that exact SHA. Keep the new StorySpecs as drafts through this code-first deployment.
3. Execute the separately audited, scoped three-StorySpec CAS publisher. Verify **47 valid publications**, zero quarantine, all three exact published stage/spec pairs, current review/prose hashes, and preservation of the previous 44. This plan does not supply publication authority or live readback.
4. Commit substantive publication/readback receipts on a branch from that just-deployed main; check and merge the receipt PR. The integration's successful deployment of the new post-publication main commit refreshes warmed workers. A failed or skipped build leaves refresh unresolved. Retain the evaluated proposal and failed-gate history.
5. Establish the exact post-publication deployment through GitHub metadata, refresh the public production Auth-host proof without printing keys, then execute only the root-coordinated reader canaries.

The cache in `lib/figures-source-db.ts` loads published stages once per process. Local `resetDbFigureCache()` does not refresh production, and no public cache-reset endpoint was found. Existing Git integration plus a substantive receipt commit is the available refresh mechanism; no force-push, empty refresh commit, direct deployment-status fabrication, or new integration is needed.

These are read-only operator queries; this audit executed only the current history reads:

```powershell
gh pr view 148 --repo taizhenC/Onward --json headRefOid,state,mergeCommit,statusCheckRollup
gh api repos/taizhenC/Onward/branches/main --jq '.commit.sha'
gh api 'repos/taizhenC/Onward/deployments?environment=Production&sha=<EXACT_MAIN_SHA>&per_page=10' --jq '.[] | {id,sha,environment,created_at}'
gh api repos/taizhenC/Onward/deployments/<OBSERVED_ID>/statuses --jq '.[0] | {state,environment_url,created_at,description}'
```

For actual serving identity, the known canary's owned session `match_recipe.deploymentVersion` and immutable artifact `recipe.match.deploymentVersion` must both equal the observed post-publication commit at **https://onwardapp.me**. Also verify the unchanged approved recipe ID and manifest hash. The recipe's historical library snapshot is not relabeled as the new content library.

## The old canary is not a passing receipt

The historical [Blackwell receipt](../new-stories-production-2026-10-02/LIVE-CANARY-RECEIPT.json) has `ok: false`. It verified seven beats, 23 passages and 23 successful ACKs, worker identity and source HTML, but cleanup failed with `cleanup-normal-confirmation-page-failed`. Its `ownedSessionRemoved: false` records unverified absence because that check was skipped after confirmation failure; it does not prove that a session remained. Its `guestDeleted: true` was set after the normal 303 redirect, without a separate authoritative Auth-absence read.

Preserve that failed receipt. Do not borrow it as a pass, overwrite it, or delete the old attempt guard to retry. The old helper is pinned to Blackwell, the ten-story publication packet, total 44 and consumed attempt/receipt paths. Root must prepare a separately reviewed helper and paths for these three stories.

## Three conditional normal-route canaries

There is no honest target-forcing control in ordinary intake. A helper may submit an independently chosen source-grounded age and feeling, but must not supply a figure/StorySpec override, manufacture an artifact/session, alter gold or routes, or use artificial boundaries to remove competing stories.

Five of nine frozen positives failed the 63-stage prefilter. All three frozen Franklin cases were lost. The surviving Somerville and Slocum cases are not proof of the real reranker or the actual published 47-story catalog. Therefore, three successful target canaries cannot yet be promised.

The proposed fixtures are recorded in [the machine plan](DEPLOYMENT-AND-CANARY-PLAN.json). Root should freeze them before measurement and independently review the new Franklin operational description:

| Target | Proposal | Status |
| --- | --- | --- |
| Franklin | Separate age-21 operational fixture: job loss after an argument, failed alternate opening, return to the same employer, and a small business dependent on help | Source-grounded proposal; unmeasured; not an edit to eval gold |
| Somerville | Unchanged coverage index 3, age 46, experienced self-study and a private explanatory-writing attempt | Survived historical 63-stage prefilter; production selection unproven |
| Slocum | Unchanged coverage index 7, age 49, construction-method doubts and consideration of a professional | Survived historical 63-stage prefilter; production selection unproven |

The Franklin proposal is:

> I lost my job after an argument with my boss. I left angry, couldn't find another opening, and have to take work from the same boss while I try to start a small business with someone else's help.

It translates the documented quarrel/notice, immediate departure, failed alternate search, return and partnership. It makes no historical quotation claim. Keep the original twelve-case dataset SHA `acb9830130d99d362d81706ea88baa58a3116a77b892b11f408242277e29c189` unchanged.

Allow at most **one preselected match attempt and one guest-creation attempt per figure**, three attempts in total. No repeated tailoring, matching retries or account rotation. An unexpected target, clarification, no-close-match or provider/transport failure ends that attempt and triggers cleanup. A legitimate but different selected story does not count as a target canary.

## Full reader and source proof

A new helper should default to offline self-tests and require an explicit root-coordinated live invocation, the exact deployed SHA, new publication receipts and frozen fixture pins. Write an exclusive attempt marker before the first Auth request; use separate immutable per-fixture receipts. Keep all cookie/token/user/session/artifact identifiers transient and out of public output.

Use a fresh anonymous account rather than the user's owner account, an in-memory SSR cookie jar, bounded Auth endpoints and disabled automatic refresh. Submit the ordinary `/api/match` body with age and feeling. This is SSR/API coverage; interactive UI, visual layout and source-toggle telemetry require separately coordinated browser work.

Strictly verify the exact owned expected session, initial progress, reviewed published StorySpec, current stored-artifact integrity and retention envelope. The artifact must contain seven canonical roles and exact published text. Fetch every actual chunk through `/api/beat`, compare it before ACK, then acknowledge the exact owned beat/chunk through `/api/beat/ack`. Record attempted requests and successful ACKs separately. Require complete canonical assembly for each beat and final progress **beat 7, chunk 0**.

Current frozen mechanics produce 23 Franklin chunks, 23 Slocum chunks and 28 Somerville chunks. Verify the actual artifact count rather than inventing progress; the hard bound is 64 passages **per story**, not across all three.

After completion, the normal story GET must visibly contain the bridge, afterword and actual source-record details: facts and their locators, citations and links, passage explanations, review state, rationale, quotations or dramatized lines if present. Exclude scripts, styles and serialized Next flight data. Restrict checks to the source-record region so duplicated report-form options cannot mask missing evidence. Compare the stored transparency with the exact published specification and the same feeling/framing; retain probable memories and the disclosed later-life context.

## Normal cleanup, independently confirmed

Cleanup must run in `finally` even after delivery failure:

1. Reconfirm the exact newly created anonymous owner. Use the normal `GET /account/delete` and its owner-bound CSRF form, then one same-origin `POST /api/account-delete` with the normal acknowledged intent.
2. Preserve the authentic success cookie and normal response cookie changes. Read `/account-deleted` once within its 120-second receipt lifetime and require the rendered deletion confirmation. The cookie is consumed in the response to the first page view; do not fabricate it or reuse it to claim success.
3. Independently verify absence of the exact known owned session and artifact with their known owner/session/artifact keys. Perform these reads even if confirmation HTML checking fails.
4. Independently verify absence of the exact transient Auth user through a narrowly scoped `auth.admin.getUserById(userId)` read. Require explicit 404 or `user_not_found`/`not_found`, following the application's own missing-user semantics. A generic transport, privilege or authentication error is not absence.

The normal deletion route remains the only mutation. No privileged Auth deletion, arbitrary user/session deletion or user listing is permitted. Keep confirmation, session absence, artifact absence and Auth absence as separate receipt fields. Overall pass requires all of them, as well as the seven-beat delivery, ACK and source checks.

The cookie jar must honor deletion/expiry and receipt path semantics, including SSR Auth cookie chunks. A signup response lost before a known owner can be established remains unresolved; do not create a second guest. The ordinary six-hour anonymous expiry is a fallback, not a successful cleanup receipt. An uncertain normal deletion result must remain visible and be reconciled through bounded exact-owner reads, not hidden by a passing delivery result.

Audited guards and source paths are listed in the JSON plan. No live account test or offline scoring hypothesis was run in this audit. Root owns the separately reviewed helper, fixture qualification and coordinated execution.
