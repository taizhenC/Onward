# Deterministic retrieval reproduction

**RED reproduced. This is a diagnostic, not a passing CI check or publication approval.** The frozen supplemental twelve-case provider evaluation stopped at preflight before making provider calls. This independent no-network loop reproduces the same dropped zero-based cases **0, 1, 2, 4, and 6** with the real keyword scorer and prefilter.

The helper is `docs/releases/new-three-2026-10-03/repro-retrieval.ts` in the managed worktree. Its final SHA-256 is `6dbd4fbeb42896754e773b6e0d1e4191e3ad3d1a132e10c857704ab83d84dc9e`. Run from that repository:

```powershell
node --import tsx docs/releases/new-three-2026-10-03/repro-retrieval.ts --case all
node --import tsx docs/releases/new-three-2026-10-03/repro-retrieval.ts --case 0
node --import tsx docs/releases/new-three-2026-10-03/repro-retrieval.ts --case 0 --minimize
```

All three commands have actually run and exit **1** because required frozen positive coverage is missing. Invalid arguments exit 2, distinguished from the reproduced symptom. The all-case run took 561ms before source restoration and 588ms afterward; minimized case 0 alone took 504ms, and the bounded hypothesis probes took 380ms. The loop is deterministic, fast, and unattended. Exact narrow stdout, command arrays, exit codes, elapsed times, and source hashes are retained in [REPRO-RETRIEVAL.json](REPRO-RETRIEVAL.json) and the companion stdout receipts.

## Fixed fixture and actual call path

The helper hashes the unchanged complete original 60 row objects against `0d210d3393250d4860b8c5718c1bb9f9b713347656edc0b5e213a75f98c955f5`, asserts their original order and unique identities, and overlays exactly the three byte-pinned stage JSON packets. It binds case JSON `acb9830130d99d362d81706ea88baa58a3116a77b892b11f408242277e29c189`, its original freeze receipt, and the unchanged 104-case dataset `f87962a57990f65a8765afdcd141bbdd1c3b9f5a965d04f4810f1787d8aa2a1e`. The three miss controls must be object-identical to original indexes 5, 20, 21. Existing installed proposals must be absent or exactly equal to the frozen stage; unexpected or duplicate rows fail before scoring.

The runtime can therefore remain at the restored original 60: the test fixture consistently contains 63 and does not write the library. Full all-case stdout before and after root's source restoration was byte-identical. This confirms that restoring the proposed library addition does not erase the failure signal.

Age eligibility uses real `ageDistance` and the unchanged ten-year constant, with the evaluator's fallback to all if its age pool is empty. Candidate pruning uses real `selectRerankPool` at the unchanged recipe K=6. Scores and matched themes come from actual `scoreAllByKeywordHybrid` and `getMatchedThemeWeights`. Accepted alternatives pass if any survives, matching evaluator behavior. Miss/semantic cases do not impose a positive-survival assertion; this harness does not measure their calibration. Output is limited to selected and acceptable stages, ranks, scores, themes, age distance, and survival. It contains no provider response or real reader record.

## Minimized symptom and ranked predictions

Case0 alone is red. Franklin is in the 45-stage age pool, at age distance 0, but has no matched themes, keyword score 0, age penalty 0, and total score 0. Its tied rank is 7. The selected six are Andersen, Bly, Carver, Douglass, Equiano, and Faraday.

Root supplied three ranked falsifiable predictions after this red command and before further probes:

| Hypothesis | Bounded actual probe | Outcome |
| --- | --- | --- |
| H1: unrecognized wording gives no theme signal | Record the actual theme map and target score without changing wording or routes | Confirmed zero map and target keyword score 0 for case 0; no mapping fix tested. |
| H2: age gate drops Franklin | Check actual ageDistance and presence in the age-filtered pool | Falsified for case 0: distance 0 and target present. |
| H3: equal-zero ordering loses the seventh candidate | Reduce to the selected six plus Franklin; then remove only Andersen | Seven candidates all score 0 and Franklin remains seventh/excluded. The six-candidate reduced pool includes Franklin. |

This seven-candidate pool is a minimal failure at unchanged K=6: removing a competitor makes all remaining candidates fit. It demonstrates the cutoff and tie-order effect. The artificial removal changes only a diagnostic pool, not production eligibility, keyword routes, theme metadata, case labels, gold inputs, recipe, K, or story prose. The default frozen 63 loop remains red, including during `--minimize`; the green survival inside the artificial six-stage probe is not a fix or release result.

## Guards, validation, and disposition

Process-local fetch, HTTP/HTTPS, socket, and TLS guards are installed before application imports. The helper imports only the server-only bootstrap alias and actual runtime modules; it never invokes an env loader, provider/match request, database list/get, or write. All captured runs report zero network attempts, provider calls, database calls, and env files loaded. Four malformed/out-of-range argument probes rejected with exit 2. Scoped ESLint passed with zero warnings and the nonincremental no-emit typecheck passed. Independent static review found no required harness bug.

Only this diagnostic helper and public receipts were authored by this subagent. No general matcher fix was attempted. The separate original 104 evaluation remains failed as reported by root; this supplemental loop cannot clear that failure. The supplemental provider run remains blocked, and no publication authority follows from these probes.
