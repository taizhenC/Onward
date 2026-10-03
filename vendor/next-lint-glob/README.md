# Next ESLint directory glob compatibility

This local package replaces only the `fast-glob` dependency of the pinned
`@next/eslint-plugin-next@15.5.26`. The replacement has its own honest package
identity and version; it does not claim to be a patched upstream fast-glob.

The supported call is the one used by Next's `get-root-dirs.js`:
`globSync(pattern, { onlyDirectories: true })`. Every other option or API needs
review before adding a consumer. The regression script pins the actual caller,
enumerates its consumers, compares installed code with the authored source,
checks directory roots, and exercises the real internal-link lint rule.

Published `glob@13.0.6` performs the filesystem traversal. The wrapper preserves
literal roots, excludes files, follows directory links, and adjusts terminal
globstars and relative path spelling for the Next root-directory contract.
Directory discovery order is not a stable upstream contract; tests compare
the returned root sets while preserving the Next array-of-settings behavior.

The previous dependency chain included unpatched `braces@3.0.3` through
micromatch. This package removes that chain rather than suppressing its audit
finding. The distinct `brace-expansion` package used by glob's minimatch backend
must also remain patched; full `npm audit --audit-level=high` runs in CI.

`install-links=true` in the repository's `.npmrc` is required for npm's local
file override. Its path is resolved relative to the pinned Next plugin's
node_modules location. A direct local development dependency supplies the
same package normally, and ordinary `npm ci` is part of verification.

Run `npm run check-next-lint-glob`. For a local independent comparison, pass
`--reference-fast-glob=/absolute/path/to/an/unchanged/fast-glob` to that script.
The vulnerable reference is never installed into this dependency graph or CI.

Tinyglobby was evaluated and rejected for this wrapper because its fdir
backend omitted matched directory symlinks. That omission disabled the actual
Next internal-link lint rule for linked project roots.
