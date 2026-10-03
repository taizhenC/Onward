# Security release path investigation

Checked October 3, 2026, at 01:33 UTC after the owner's explicit instruction: “I checked it, publish those into the production.” This investigation made no dependency, workflow, publication, or production changes. It does not turn a failing audit into a pass.

## Actual GitHub failure

[PR #146](https://github.com/taizhenC/Onward/pull/146), head `f975e1d998495f29620830e7715ca9dd4a036fc8`, has a failed [`verify` job](https://github.com/taizhenC/Onward/actions/runs/37085267290/job/111094131640). `gh run view 37085267290 --log-failed` identifies the failing step as **Reject high-severity dependency advisories**, executing `npm run audit:high` (`npm audit --audit-level=high`) and returning exit code 1. The job stopped at this step; its failure does not establish results for later lint, matching-governance, test, or build steps.

The report has five high-severity package entries along one chain:

`eslint-config-next@15.5.25` → `@next/eslint-plugin-next@15.5.25` → `fast-glob@3.3.1` → `micromatch@4.0.8` → `braces@3.0.3`.

The audited lockfile SHA-256 is `449b89a953b6c2679f00aee6ad10ccdbb326fad21978d1703757e0c8fa86be37`. A fresh local full `npm audit --json` at 01:34:48 UTC also returned exit code 1, with five high findings and zero other findings. The reduced exact package nodes, installed versions, lock flags, audit observations, and limits are preserved in the adjacent [JSON receipt](SECURITY-RELEASE-PATH-20261003T013352Z.json).

[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) describes stack exhaustion from deeply nested brace patterns, affects versions through 3.0.3, and lists no patched version. The [upstream issue](https://github.com/micromatch/braces/issues/70) proposes a nesting-depth guard. `braces` is distinct from the two already patched `brace-expansion` copies.

## Compatible official package search

Registry queries on this checkpoint found `eslint-config-next@15.5.27` as the latest stable Next 15 config. Its plugin still has the exact `fast-glob@3.3.1` dependency, confirmed by [Next's tagged source](https://github.com/vercel/next.js/blob/v15.5.27/packages/eslint-plugin-next/package.json). The current stable Next 16 plugin, `16.3.8`, also retains this dependency in [its tagged source](https://github.com/vercel/next.js/blob/v16.3.8/packages/eslint-plugin-next/package.json). Advancing these versions therefore does not remove this advisory.

The latest published `fast-glob@3.3.3` still depends on `micromatch@^4.0.8` ([maintainer manifest](https://github.com/mrmlnc/fast-glob/blob/3.3.3/package.json)), whose latest published version is 4.0.8 and depends on `braces@^3.0.3` ([maintainer manifest](https://github.com/micromatch/micromatch/blob/4.0.8/package.json)). `npm view braces version` returned 3.0.3. An override to these latest stable compatible packages cannot resolve the finding.

Next 15 documents [direct plugin configuration](https://nextjs.org/docs/15/app/api-reference/config/eslint), but the same plugin carries the vulnerable dependency. Removing `eslint-config-next` and its plugin would discard existing Next rules; changing to a different glob implementation requires a reviewed fork or upstream fix. Neither is a narrow verified content-release repair. The audit's force suggestion downgrades the config to 14.2.35 while the application remains on Next 15.5.25; it is an incompatible major change and is not recommended.

## Observed exposure and limits

All five affected lock entries have `dev: true`. `npm ls braces micromatch fast-glob --all` shows the single installed development chain above. `npm audit --omit=dev --json` returned exit code 0 and zero vulnerabilities on this checkpoint. This supplemental command does not replace or weaken `audit:high`.

The existing `.next-ci` build contains 38 output-trace `.nft.json` files. None of their dependency lists include `eslint`, `fast-glob`, `micromatch`, or `braces`. This describes the local build traces; it is not proof of deployed Vercel filesystem contents or an unconditional security guarantee.

ESLint's calculated configuration for `src/app/page.tsx` has no `settings.next`. The installed plugin's [root-directory helper](https://github.com/vercel/next.js/blob/v15.5.25/packages/eslint-plugin-next/src/utils/get-root-dirs.ts) only calls `globSync` for a configured string/array `rootDir`; otherwise it returns the working directory. This is evidence that the current app configuration does not feed a reader-supplied pattern into that helper. It does not prove every possible development invocation is safe.

The content branch preserves `package.json`, `eslint.config.mjs`, and `.github/workflows/ci.yml` from `origin/main`; the only dependency diff is the previously reviewed pair of compatible `brace-expansion` patches. The existing vulnerable lint chain is unchanged. Reader story content does not configure ESLint root-directory glob patterns.

## Recommendation

There is no verified compatible published official dependency change that clears the current audit. Keep the audit command, severity threshold, lint rules, advisory record, and failing result intact. Do not use `npm audit fix --force`, suppress the advisory, or relabel the job as passing.

If the owner chooses to proceed with the explicitly requested content publication, record a **release-specific owner exception** acknowledging this unresolved development-dependency audit, its unchanged scope, and the limits above. It must not imply that the issue has been fixed or that CI passed. A future upstream patch or separately reviewed tooling repair remains required. The independent matching-release failure also remains a separate recorded result; this security investigation does not approve or alter it.

Read-only evidence: GitHub PR/check status and failed logs; installed package tree and lock flags; exact registry manifests; local ESLint calculated settings; 38 local build trace files; runtime-only supplemental audit; official tagged source and reviewed advisory. No tokens, environment values, private sessions, or production rows were recorded.
