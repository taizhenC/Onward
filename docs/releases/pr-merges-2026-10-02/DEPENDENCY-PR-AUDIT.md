# Dependency PR and current audit investigation

Observed 2026-10-03 UTC for the request to merge all open PRs and make their tests pass.

## PR 145

[PR 145](https://github.com/taizhenC/Onward/pull/145) is open at `fdbb941637dfef33d5b99ac582ebb5dd8cc265f8`. Its six direct updates are:

| Package | Before | PR target |
| --- | --- | --- |
| `@supabase/supabase-js` | 2.116.0 | 2.117.1 |
| `motion` | 13.2.0 | 13.4.3 |
| `next` | 15.5.25 | 15.5.26 |
| `@types/node` | 22.20.2 | 22.20.4 |
| `eslint-config-next` | 15.5.25 | 15.5.26 |
| `tsx` | 4.23.13 | 4.23.15 |

Its existing green GitHub CI run completed September 28. That run does not establish that the dependency graph passes the October 2 advisory state or that its combined result with the ten-story main release passes fresh tests.

## Reproduced failure

Read-only `npm audit --json` in the prior managed release checkout returned exit 1 and exactly five high findings. `npm explain braces` confirmed the single development dependency path:

```text
eslint-config-next@15.5.25
  @next/eslint-plugin-next@15.5.25
    fast-glob@3.3.1
      micromatch@4.0.8
        braces@3.0.3
```

The authoritative [GHSA-vfj7-8cjw-p6xm advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), reviewed and updated October 2, affects braces through 3.0.3 and lists no patched version. The failure concerns unbounded recursive brace-pattern walking. No audit threshold, suppression, development omission, or test result has been changed here.

Fresh registry metadata reports latest `braces` 3.0.3, latest `micromatch` 4.0.8, and latest `fast-glob` 3.3.3, all retaining the vulnerable chain. PR 145's `@next/eslint-plugin-next@15.5.26` pins fast-glob 3.3.1. Latest official Next plugin 16.3.8 also pins fast-glob 3.3.1. A routine compatible version bump does not currently remove the finding. npm's proposed downgrade to eslint-config-next 14.2.35 is a major downgrade and was not applied.

[Upstream braces PR 72](https://github.com/micromatch/braces/pull/72) adds depth guards but remains open at `d0d575e55e74a4e0218e5248fafb79efc3e54ebb`. Its author's reported tests are upstream claims, not local verification or a published patched package.

## Narrow replacement hypothesis

Inspection of the installed Next plugin finds one fast-glob call: `get-root-dirs.js` calls the named `globSync` export with a normalized root pattern and `{ onlyDirectories: true }`. The application currently configures no `settings.next.rootDir`, so the default path uses the ESLint working directory without calling that function.

The published [tinyglobby documentation](https://superchupu.dev/tinyglobby) offers `globSync` and `onlyDirectories`; registry version 0.2.17 depends only on fdir and picomatch. It is a candidate for a genuine dependency replacement, but a direct alias is not transparent.

An actual differential probe against the installed tinyglobby 0.2.16 found that its default behavior expands a literal directory recursively, adds trailing slashes, and returns relative output for an absolute input. With `expandDirectories: false` and trailing-slash normalization, relative literal directories, a single wildcard, a brace choice, and a missing directory matched fast-glob. The `app/**` pattern still included the root directory, unlike fast-glob; an absolute literal matching the working directory threw an empty-pattern exception. Those observed incompatibilities must be handled and tested before replacing the dependency.

A small scoped compatibility module could use published tinyglobby for the exact Next root-directory API, handle literal directories explicitly, preserve absolute output, and filter the globstar parent difference. It would need real Next rule regressions for direct and globbed roots, plus a fresh full audit and lint/build checks. This investigation has not yet adopted that source change.

## Scope

These observations used GitHub read APIs, installed package reads, npm registry metadata, and npm audit only. No branches, application source, package files, database records, Auth accounts, or provider calls were changed during this investigation.

## Completed dependency repair

The read-only phase above preceded the authorized implementation in the new merge worktree. The final repair retains all six Dependabot updates and removes the vulnerable dependency chain through a scoped override of the pinned Next plugin's fast-glob dependency. The replacement is an honest local package, `@onward/next-lint-glob@1.0.0`; its supported API is the exact synchronous directory-root call used by the pinned plugin.

Published [glob 13.0.6](https://github.com/isaacs/node-glob) handles traversal, with minimatch 10.2.6 expanding brace alternatives and picomatch 4.0.4 enforcing the original directory matcher semantics. Those dependencies use patched `brace-expansion`, a different package from the removed vulnerable `braces`. The wrapper preserves literal, relative, absolute, Windows-normalized, wildcard, brace, extglob, dot-root, array, and directory-link behavior. It rejects unreviewed options and API expansion. No custom filesystem traversal engine was introduced.

Tinyglobby was rejected after an independent real-rule check proved that its fdir backend omitted a matched directory junction. That omission prevented Next's internal-link rule from detecting an internal anchor in a linked project. The maintained glob backend preserves those linked roots. The final independent 47-pattern review found equivalent resolved directory scope; bare globstar variants retain a harmless leading `./` difference. Discovery order and byte spelling of equivalent paths are not claimed identical.

The repository `.npmrc` enables npm's supported `install-links=true` behavior for the local file dependency. Ordinary `npm ci` must succeed without special invocation flags. The package name and version do not disguise the replacement as an upstream patched release. A named CommonJS import-style exception applies only inside the adapter because the pinned Next caller loads it synchronously with `require`; application lint rules and audit thresholds remain unchanged.

Actual checks completed by 2026-10-03 02:26:06 UTC:

- Ordinary `npm ci`: exit 0; 340 installed packages; zero reported vulnerabilities.
- Full `npm audit --json`: exit 0; zero findings at every severity, including development dependencies.
- `npm run lint`: exit 0 with zero errors and warnings.
- `npm run typecheck`: exit 0.
- Scoped regression: 29 root settings, 54 actual Next internal/external-link checks, and five rejected unsupported calls passed.
- Direct comparison against the unchanged original fast-glob: 28 cases passed. The reference package is read-only and is not installed in the repaired dependency graph or CI.
- Independent review: 47 root patterns and seven installed Next rule cases passed, including linked-only and hidden-only project roots.

The exact outputs and hashes are in `DEPENDENCY-REPLACEMENT-VERIFICATION.json`; diagnostic failures and their corrections remain in `DEPENDENCY-FAILED-PROBES.md`. The final lock SHA-256 is `bde6817490252a9ec35a8051391fe900ed28017138e9731df537ed4b8f8b288d`, and the installed/authored adapter SHA-256 is `8486e3acd3a5ee85c3ce842b2c75baffe31df7f9e45c9dfadb540b01b41e692c`.

These scoped checks establish the dependency repair. The root merge workflow still needs to run the complete repository suite and inspect fresh GitHub checks for the exact final head before merging PR 145. This repair changes no story, matching recipe, historical matching result, owner authorization, database record, Auth account, or provider configuration.
