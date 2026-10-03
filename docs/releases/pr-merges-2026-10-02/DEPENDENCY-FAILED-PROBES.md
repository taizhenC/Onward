# Preserved dependency diagnostic failures

These are diagnostic observations from the tool results, not passing test claims. They explain the corrected final implementation; the full baseline audit and historical production release audit remain unchanged.

## Baseline failure

The read-only prior-release checkout returned `npm audit --json` exit 1 with five high findings on the eslint-config-next → Next plugin → fast-glob → micromatch → braces path. The advisory affects braces through 3.0.3 and lists no patched release. Latest official Next and latest fast-glob still retained this path.

## Rejected direct tinyglobby replacement

The first actual directory probe compared installed fast-glob 3.3.1 with tinyglobby 0.2.16. A literal `app` matched one directory under fast-glob and recursively matched app descendants under tinyglobby's default expansion. Wildcard roots also acquired trailing slashes. After disabling expansion, `app/**` still included the traversal root. An absolute literal equal to the working directory raised:

```text
TypeError: Expected pattern to be a non-empty string
```

An independent junction fixture proved actual lint coverage loss: `apps/*` returned the ordinary root but omitted its directory junction. Changing `onlyDirectories`, `onlyFiles`, or `followSymbolicLinks` did not return the junction. The real Next internal-link rule then reported zero errors for an internal link under a linked-only project, where the ordinary root returned one error. This backend was rejected and replaced with published glob traversal.

## npm local-file resolution and lock regeneration

The first scoped override `file:./vendor/next-lint-glob` resolved relative to the transitive Next plugin, creating an empty nested target. Ordinary `npm ci` correctly rejected it:

```text
Missing: fast-glob@ from lock file
```

Resolving the file path to the repository root corrected the target, but npm's default link handling still rejected the local replacement:

```text
Missing: fast-glob@1.0.0 from lock file
```

`npm ci --install-links` succeeded. The final `.npmrc` records that requirement so ordinary `npm ci` uses it. A direct local development dependency and a scoped consumer-relative override produce real packed packages with their honest `@onward/next-lint-glob` identity.

A probe using a direct-dependency override reference instead of the explicit consumer-relative path failed with ENOENT on:

```text
node_modules/@next/eslint-plugin-next/vendor/next-lint-glob/package.json
```

An attempt to regenerate the lock from the previous registry graph reused the original fast-glob entry and again reported five high vulnerabilities. It was not accepted as a repair. Refreshing the affected local-file records removed that cached resolution.

Changing the local backend dependency without refreshing those local records initially retained the old tinyglobby dependency metadata. The newly packed module then raised:

```text
Error: Cannot find module 'glob'
```

Refreshing the local-file dependency metadata fixed that stale graph. A later package-lock-only graph failed clean installation with missing nested entries:

```text
Missing: brace-expansion@5.0.12 from lock file
Missing: balanced-match@4.0.4 from lock file
```

Actual `npm install --ignore-scripts` regenerated the complete local dependency graph. Final ordinary `npm ci` then succeeded and full audit reported zero vulnerabilities. The unrelated tinyglobby version was restored to the integrated head's 0.2.16 before the final verification.

## Wrapper and fixture corrections

An early real-rule fixture asserted that a root matching only a `pages` directory itself should discover a nested `/known` route. It failed on the brace/globstar case; both the original and replacement root APIs correctly returned page directories with no nested `pages/known.js`. The fixture now asserts actual route presence before expecting an internal-link error; no production rule was weakened.

The first published glob backend normalized a parent-relative root back into the working-directory spelling, failing the exact root fixture. The wrapper now reconstructs results through the original static base and retains caller-relative spelling.

The first CJS adapter failed application lint with four `@typescript-eslint/no-require-imports` errors. The mandatory synchronous CommonJS module now has a named, explained exception to that import-style rule only. All remaining module lint and application lint continue unchanged.

Independent review found that node-glob's default dot policy omitted hidden roots selected by a negative extglob. The final traversal discovers candidates and applies published picomatch's original full-pattern predicate, preserving that hidden-root case while continuing to exclude hidden roots from ordinary stars. The added hidden-root regression and independent real-rule test pass.

The first optional-reference command through PowerShell's npm wrapper dropped its forwarded argument and reported zero differential cases. The final reference check was executed directly with Node and actually compared 28 cases. CI uses the ordinary fixture check without installing a vulnerable reference.

No failed probe was converted into a passing receipt. Final source hashes and actual scoped successes are recorded separately in `DEPENDENCY-REPLACEMENT-VERIFICATION.json`.
