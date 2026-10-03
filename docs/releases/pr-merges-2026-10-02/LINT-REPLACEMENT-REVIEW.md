# Independent review of the Next lint dependency replacement

The final reviewed replacement has no actionable blocker for the pinned Next 15.5.26 directory-glob contract. It preserves lint coverage in the independently tested regular, linked, and hidden-root cases, and a fresh full `npm audit --json` reports zero vulnerabilities across all severity levels.

## Reviewed boundary

The installed Next plugin has one `fast-glob` consumer: `dist/utils/get-root-dirs.js`. It calls `globSync(string, { onlyDirectories: true })` after converting Windows separators to slashes. The compatibility module exports only that function and rejects unsupported argument types or option sets. Its package honestly identifies itself as `@onward/next-lint-glob@1.0.0`.

The npm override is scoped to `@next/eslint-plugin-next`. The tracked `.npmrc` uses `install-links=true` so ordinary `npm ci` copies the local module rather than relying on a fragile consumer-relative link. The reviewer inspected the actual consumer resolution and verified that the installed source exactly matches the authored source. The dependency tree shows published `glob@13.0.6`, `minimatch@10.2.6`, and `picomatch@4.0.4`; the unrelated existing tinyglobby remains at 0.2.16. No vulnerable `braces` package appears in this dependency path.

The module uses maintained glob traversal, maintained brace expansion, and a picomatch directory predicate. The final implementation follows directory links, filters actual directories through stat, preserves the relevant original root spelling, and keeps unsupported APIs closed. The first tinyglobby candidate was rejected after independent testing demonstrated lost Next lint coverage on junction roots. A subsequent negative-extglob hidden-root omission was also corrected before this conclusion.

## Independent verification

The reviewer compared 47 string patterns against the original installed fast-glob 3.3.1 using an isolated Windows fixture. These covered relative and absolute directories, dot prefixes, trailing slashes, globstars, braces, positive and negative extglobs, hidden roots, missing and file literals, duplicate slashes, parent-relative spelling, and directory junction traversal. All 47 now select the same actual filesystem directory scope. Three bare-globstar variants retain a leading `./` where the original removes it; both spellings resolve to identical directories, and Next's directory joining normalizes them. Universal byte-for-byte output parity is therefore not claimed.

Seven additional actual installed Next plugin and ESLint 9 rule probes all passed. Internal anchors were detected under regular wildcard roots, junction-only wildcard roots, and hidden-only negative-extglob roots. External anchors were allowed in each relevant case, and the `_blank` control was allowed. These independently reproduce the two earlier under-selection defects and verify their correction. The complete machine receipt is `LINT-INDEPENDENT-RULE-PROBE.json`.

The reviewer also directly ran the repository's compatibility check with the old package supplied only as a read-only reference. It passed 29 root cases, 54 actual Next rule cases, five unsupported-call rejection cases, and 28 differential cases. A warning for fixture roots that point to a pages directory itself is expected: those roots intentionally contain no nested pages directory, and the check verifies that no internal-page report is invented for them.

The CI workflow retains the original high-severity audit command and adds the new compatibility check. No audit suppression, severity threshold change, matching-label alteration, runtime recipe change, production library change, provider call, DB operation, authentication action, push, or merge was performed by this reviewer. This review does not substitute for the parent's full application test run or hosted CI.

## Reviewed hashes

| File | SHA-256 |
| --- | --- |
| Authored and installed `vendor/next-lint-glob/index.cjs` | `8486e3acd3a5ee85c3ce842b2c75baffe31df7f9e45c9dfadb540b01b41e692c` |
| `vendor/next-lint-glob/package.json` | `e22d27cf13b40a81ffc223be2944b4750186b60a13784af3b62139fe75768781` |
| `scripts/check-next-lint-glob.mjs` | `bc8e2b0a733a1e0bec6e361274e62426a4941358bf8479ea50d2cdd9b3299bc8` |
| `package-lock.json` | `bde6817490252a9ec35a8051391fe900ed28017138e9731df537ed4b8f8b288d` |

The conclusion is bound to these files and the verified Next caller. Future caller, backend, or installation changes require review through the existing compatibility checks.
