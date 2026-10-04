# New-three owner governance exception

The owner explicitly directed merging and publication after the disclosed matching failure. A separate fixed exception now validates only the exact three-story library and owner decision `owner-publish-new-three-2026-10-04`. The authorization JSON hash is `d1a594f62b55c01600071c9fc88f2f739d0ece077aededcb5e8a869bafbf7018`; the target library remains `1a33b7b45b48bc054f0eb0d1504bfd7ac312a07f41f678ff032acfa9e97eaa90`.

The new handler requires lineage index 2, the unchanged predecessor, the exact failed real evidence and its source commit/input tree, the frozen recipe manifest and measured selector, the complete reading packet, frozen inputs, draft receipt, and three candidate/stage byte pins. It retains all eleven publication constraints and the supplemental preflight failure with zero provider calls. It supplies no authority for another snapshot, a future release, recipe promotion, weaker thresholds, or audit suppression.

The original ten-story constant, validator, and nine negative tests are text-identical after line-ending normalization. The ordinary passing-real-evidence branch, source/tree validation, and trusted recipe-promotion authority remain in place. No trusted attestor change was needed.

Validation passed:

- `npm run check-recipe-governance`: 30 new negative cases plus the existing 9; overall PASS with matching FAIL explicitly retained.
- TypeScript checking and scoped ESLint passed.
- `git diff --check` passed for the changed governance file.

The negative checks reject wrong lineage, library, predecessor, decision, evidence, recipe/manifest/prompt, provider, source tree, gold, metrics, selector, reading packet, story scope, claimed supplemental success, and reuse as recipe-promotion authority. Document mutations fail their exact byte pin; semantic manifest/prompt changes also fail the recomputed manifest check.

Governance source SHA-256 at verification: `56c368f525007170e129c574cec87283702a9f1a4059489f29a0d32c9a4abca6`. Full final-head CI, deployment, and database publication are separate required steps. Matching remains 96/101 positive with three wrong definitive matches; this exception does not relabel that result.

Only `scripts/check-recipe-governance.ts` and these `GOVERNANCE-EXCEPTION` reports were changed by this agent. No database, provider, authentication, commit, or push operation was performed.
