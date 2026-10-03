# Dependency audit for the ten-story production release

Audited on October 2, 2026, from the production worktree based on `origin/main` (`38815c83922afd7350ab1f1aafcd3dcafd874cd3`). This is a read-only investigation and a proposed dependency repair; it does not claim that the repair or production deployment has completed.

`npm audit --json` reports one high-severity affected package, `brace-expansion`, represented by two installed development dependency copies. The current working branch and production main have identical affected lock entries. Next.js and `eslint-config-next` are already at `15.5.25` on both branches; this audit does not call for changing them.

| Lock entry | Installed | Parent requirement | Minimum for current high advisories | Recommended patch |
| --- | --- | --- | --- | --- |
| `node_modules/brace-expansion` | `1.1.18` | `minimatch@3.1.5`: `^1.1.7` | `1.1.20` | `1.1.21` |
| `node_modules/@typescript-eslint/typescript-estree/node_modules/brace-expansion` | `5.0.9` | nested `minimatch@10.2.5`: `^5.0.5` | `5.0.11` | `5.0.12` |

The maintainer's [nested-group recursion advisory](https://github.com/juliangruber/brace-expansion/security/advisories/GHSA-qhr7-859c-m2p7) reports that deeply nested brace patterns can exhaust the call stack; its relevant patched versions are `1.1.20` and `5.0.11`. A separate [comma-parser recursion advisory](https://github.com/juliangruber/brace-expansion/security/advisories/GHSA-6j4f-fj2g-mc7p) is also reported against the installed versions.

Stopping at those high-severity patches would leave the maintainer's [quadratic expansion advisory](https://github.com/juliangruber/brace-expansion/security/advisories/GHSA-q2hr-2g5m-vwhr), rated moderate. That advisory's relevant patched versions are `1.1.21` and `5.0.12`. The recommended pair therefore addresses all findings in this audit. Package registry metadata confirms that `5.0.12` supports Node `20 || >=22`, including this repository's Node 22 runtime.

Both parent ranges already permit the recommended patches. The minimum scoped repair is a lockfile refresh of these two transitive packages, without a new direct dependency, a forced major upgrade, or a `package.json` override. `npm audit fix --dry-run --json` proposed exactly these two installed-version changes. Its additional optional-platform entries represent lockfile platform dependencies, not a proposed change to the application's package versions. Inspect the actual lockfile diff before accepting any repair.

After the repair, run `npm ci`, `npm run audit:high`, `npm run lint`, `npm run typecheck`, and the production worktree's required CI checks. A dry run still audits the unmodified installed tree; its reported vulnerability does not establish that the proposed repair failed.

Evidence gathered: `npm audit --json`, `npm ls brace-expansion minimatch --all`, exact lock-entry comparison with `origin/main`, `npm view brace-expansion@1.1.21`, `npm view brace-expansion@5.0.12`, and `npm audit fix --dry-run --json`. No dependency manifest, lockfile, environment setting, publication status, or deployment was changed by this investigation.
