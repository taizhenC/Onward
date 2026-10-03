# Supplemental real-matching checker v2

The separately named `eval-matching-extension-v2.ts` is frozen for the independently reviewed factual-summary proposal `FACTS-PROPOSAL.v2.json`, SHA-256 `9427e7e099252b91d7f23b3873fa0a32b9f770a93aa0dcfacc2a47c44e7883ac`. Checker SHA-256: `4addc9807604491b804122adbd21dbae87aed28e597fd760b5e5f0bc2dc1a331`.

The v1 checker remains byte-identical, SHA-256 `f1557ee1c1a5536aebd2953bfa874b7c1cbebfedc24e5fba93683e50fb620203`. V2 changes only proposal/stage pins, instrument/receipt identity and the added self-test assertion for the frozen v2 proposal. It retains all scoring, routing, case-selection, acceptance, metrics, privacy and transport behavior. It rejects uncommitted input bytes and requires all ten installed entries to equal their exact pinned `facts-v2-stages/` copies. The library's exact byte hash and full canonical catalog hash are recorded for each run rather than inferred from a filename.

Offline self-test, full TypeScript check (`npx tsc --noEmit --incremental false`) and scoped ESLint completed successfully. This agent made zero real-provider or database calls.

Run from the committed production worktree, with the existing inherited provider environment:

```powershell
node --import tsx docs/releases/new-stories-production-2026-10-02/eval-matching-extension-v2.ts --catalog=installed60
node --import tsx docs/releases/new-stories-production-2026-10-02/eval-matching-extension-v2.ts --catalog=projected44
node --import tsx docs/releases/new-stories-production-2026-10-02/eval-matching-extension-v2.ts --catalog=projected44 --include-existing
```

The third mode measures the exact frozen twenty extension cases plus 69 untouched original cases: 66 positives whose primary label is in the projected published catalog, and all three original miss cases. The other 35 historical primary labels are explicitly unavailable, excluded from this reachable slice and never counted as correct. Existing labels and `accept` sets stay exact. Default behavior remains twenty cases.

For a zero-network verification:

```powershell
node --import tsx docs/releases/new-stories-production-2026-10-02/eval-matching-extension-v2.ts --self-test
```

Each real run writes a fresh `MATCHING-EXTENSION-v2-<catalog>-<UUID>.json` with schema `new-ten-supplemental-matching-v2`. It preserves the exact chosen key, confidence, framing, selection method, shortlist survival and split metrics for extension versus optional original cases, and adult versus under-18 diagnostics. No feeling, prompt, provider body, resonance, gap or secret is emitted. Transport remains one request per case, no retry, concurrency one, 128-KiB request cap, 64-KiB response cap and 15-second complete-response deadline.

The v2 facts-only coverage comparison proves cases 13/17 are still shortlist failures; their provider outcome must continue to be reported as wrong even if an adjacent story is chosen. Keller remains outside every ordinary adult age pool. One observed correct adult case is required for each of the other nine reachable figures; Keller's age-six cases are diagnostics. The receipt can honestly remain `ok:false` even when those nine have coverage.

This checker is supplemental, `authoritative:false`, `promotable:false`, and never replaces the immutable full original 104 trust gate. Preserve the original failed v1 official and supplemental receipts, the passing original 50 baseline, and all frozen v1 instruments. V2 provider measurements must use their own newly committed catalog and receipts.
