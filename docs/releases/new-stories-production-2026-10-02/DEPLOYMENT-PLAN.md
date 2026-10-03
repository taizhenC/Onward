# Production deployment and live canary plan

Prepared October 2, 2026. This document records a read-only operational audit. It does not establish a completed deployment or publication. Execute from the managed `codex/ten-story-production` worktree based on production `origin/main`; do not merge the unrelated `codex/held-sixteen-matching-migration` branch.

## Existing deployment access

GitHub CLI is authenticated to `taizhenC/Onward` with repository and workflow access. The audited main head is `38815c83922afd7350ab1f1aafcd3dcafd874cd3`. GitHub reports it unprotected, and returned no repository rulesets. Passing checks must therefore be verified explicitly before merging; the absence of an enforced rule is not evidence that checks passed.

Vercel's GitHub integration created successful Production deployment `6560967505` for that exact head on September 21. Its [deployment dashboard](https://vercel.com/taizhencs-projects/onward/74dKipa4S31nGR5RrJmaZ9zjNyjb) links to `onward-gse7jnw0o-taizhencs-projects.vercel.app`. That commit changed only the existing retelling release document, demonstrating that a documentation-only main commit triggered production deployment under the observed integration. [onwardapp.me](https://onwardapp.me) responds 200 from Vercel. A landing-page response or request-level `x-vercel-id` header does not prove the worker's build identity or catalog membership.

No Vercel token, local CLI authentication/project metadata, or Vercel connector was found. Existing GitHub deployment integration is sufficient for the proposed release and a later worker refresh; no new credential or integration is needed. Confirm the integration still creates a successful Production deployment for each new exact main SHA.

The deployed `lib/figures-source-db.ts` loads published stages once per process. Publishing after a build has already served requests can leave warmed workers with the previous stage list. `resetDbFigureCache()` is an internal process helper, not a public endpoint; calling it locally cannot refresh production.

## Code first, publication, then worker refresh

1. Finish the exact sixty-stage content integration, the real-provider trust gate, append-only library release evidence, source/structure checks and main's complete CI workflow. Preserve the first fifty stages, existing retellings, recipe selection, keyword routes, frozen datasets and migration history. Record existing limitations, including Keller's adult age-gate exclusion. Follow [the figure-library release procedure](../../../docs/DEPLOYING.md#figure-library-releases) and [the pinned publication plan](PUBLICATION-PLAN.md).
2. Push the prepared branch and open a content PR. Attach every created PR to the Codex task. Inspect checks for its exact head, including `CI / verify` and the always-running recipe-promotion gate; a content release must not request recipe-promotion authority. Check for an advanced main before merge, and rerun checks if the integration changes.
3. Merge only the reviewed, passing head. Prefer preserving the evaluated content commit in the merge history, so governance can resolve its exact library and input-tree hashes. Wait for Vercel to report a successful Production deployment for the resulting main SHA. The new ten remain drafts during this code-first deployment, so the serving database still exposes the previous thirty-four publications.
4. Reconfirm production Supabase identity, exact draft/proposed-stage parity and publication/schema health. Invoke the independently audited, hash-bound publisher only after its matching gate and editorial pins are satisfied. It promotes only the authorized ten and preserves all previous publications. Do not use broad reseeds or direct stage-status writes.
5. Read back forty-four valid publications, zero quarantine, ten exact published stage/spec pairs, expected review/prose hashes and unchanged prior thirty-four publications. Persist the real receipt. Commit this publication receipt and its concise release documentation on a branch based on the just-deployed main, check that documentation change, then merge it. This substantive audit commit triggers a second Vercel production deployment and refreshes workers after publication. If the integration skips that build or fails, production refresh is unresolved; do not claim completion.
6. Verify the second deployment's exact SHA and run the bounded public intake/reader canary below. Preserve distinct publication and deployment receipts, rather than labeling publication success as live-serving proof.

The following are operator commands, not commands executed by this audit. Replace angle-bracket values with observed identifiers; prepare the exact multiline PR body in a file first.

```powershell
git push --set-upstream origin codex/ten-story-production
gh pr create --repo taizhenC/Onward --base main --head codex/ten-story-production --title "Release ten evidence-grounded stories" --body-file "<reviewed-pr-body-file>"
gh pr checks <PR_NUMBER> --repo taizhenC/Onward
gh pr view <PR_NUMBER> --repo taizhenC/Onward --json headRefOid,baseRefName,mergeable,statusCheckRollup
gh pr merge <PR_NUMBER> --repo taizhenC/Onward --merge --match-head-commit <REVIEWED_HEAD_SHA>
gh api repos/taizhenC/Onward/branches/main --jq '.commit.sha'
gh api 'repos/taizhenC/Onward/deployments?environment=Production&per_page=5' --jq '.[] | {id,sha,environment,created_at}'
gh api repos/taizhenC/Onward/deployments/<DEPLOYMENT_ID>/statuses --jq '.[0] | {state,environment_url,created_at,description}'
```

Use the publisher commands and exact gate hash already defined in `PUBLICATION-PLAN.md`; this document does not replace its baseline/receipt authority. Apply the same exact-head/check/deployment verification to the later publication-receipt PR. Do not force-push main, use `--admin` to bypass checks, or use an empty commit as evidence of publication.

## Bounded normal-route canary

Use a fresh isolated browser session at the production domain. Avoid the user's existing authenticated owner account. The public beta accepts integer ages 18–100 and 10–1000 characters. Select one synthetic extension case whose target survived the final forty-four-publication shortlist and real rerank checks. For example, the age-26 Blackwell training-class case in `matching-extension.json` is suitable only if its final measured results actually select Blackwell. Do not tailor the request repeatedly to obtain a desired result, and do not bypass the age gate for Keller.

Submit through `/begin`. The ordinary client first calls `/api/match`; on an unauthenticated non-crisis 401 it uses Supabase Auth's `signInAnonymously()` and retries the same body. The server validates ownership through Auth `getUser()`. A direct API-only fallback may use this same Auth endpoint with an in-memory SSR cookie jar, followed by the normal `/api/match` route, but it must be labeled as API coverage rather than complete intake UI coverage. Do not write tokens, cookies, recovery capabilities, private session IDs or credential values into committed evidence or tool output.

Require successful navigation to the owned story, canonical text for the expected new StorySpec, ordinary Continue/Finish progress, the bridge's expected name and the source fold. `/api/beat` and `/api/beat/ack` use the exact owned session's `sessionId`, `beatIndex`, and `chunkIndex`; a direct fallback must follow the server's current position rather than guess indexes. A clarification/no-close-match response is a legitimate product state, not successful creation of the target story. At most one additional preselected synthetic case may be used if the first result is inconclusive; stop on repeated 503/429 rather than multiply accounts or requests.

For definitive worker identity, inspect only this known canary's session/artifact with the service-side read boundary, keep the owner/session identifiers transient, and save reduced findings. Confirm `matchRecipe.deploymentVersion` and `artifact.recipe.match.deploymentVersion` equal the observed post-publication production SHA, and `recipeId`/`recipeManifestHash` equal the unchanged approved recipe. Confirm the target `storySpecId`, exact canonical passages and successful validation. The recipe's `librarySnapshotSha256` intentionally remains its historical pinned bootstrap snapshot; the new installed sixty-stage library is established by the appended release and deployed commit, not by relabeling that recipe field.

The canary creates one normal ephemeral guest and story. Do not link email or create a permanent account. Let the existing six-hour guest-expiry mechanism handle it; do not issue privileged arbitrary account/session deletion. Record the bounded synthetic-canary count, expiry policy and absence of permanent Save. One successful new-story canary demonstrates that the refreshed worker can select and serve that story; it does not prove every story's intake reachability. Exact catalog read-back and matching coverage supply the broader evidence, with Keller's limitation retained.

## Failure and rollback boundaries

If publication stops partway, inspect the publisher's durable receipts and retry only the same pinned inputs; never overwrite a changed review or immutable publication. Withdrawal uses `npm run story-spec:status -- retire <exact-new-storySpecId>` through the audited lifecycle. Preserve the previous thirty-four publications and all immutable owner artifacts. A retired version cannot be restored by editing it back to draft; a repaired replacement needs a new version and review.

Prefer retaining compatible sixty-stage code while withdrawing exact new publications if needed. Reverting the installed library to fifty while ten extra stages remain published breaks the documented code/database parity contract. No recipe-selector rollback, new schema migration, telemetry-dispatch change or environment edit is part of this content release. The local temporary telemetry probe secret qualification remains distinct from proof of the deployed production configuration.

Audited sources: `docs/DEPLOYING.md`, `lib/figures-source-db.ts`, `lib/intake-constraints.ts`, `components/IntakeForm.tsx`, `app/api/match/handler.ts`, `lib/auth.ts`, `lib/supabase/client.ts`, `lib/supabase/server.ts`, `app/api/beat/route.ts`, `app/api/beat/ack/route.ts`, `lib/story-generation.ts`, current GitHub branch/deployment/status APIs and local GitHub CLI help. No production or environment mutation was performed by this audit.
