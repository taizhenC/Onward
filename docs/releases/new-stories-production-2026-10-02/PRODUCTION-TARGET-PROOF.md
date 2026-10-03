# Current production database-target proof

The current public production browser bundle identifies **`mbcqkljfekkxlgittzal.supabase.co`**. A read-only check confirmed that the locally loaded `NEXT_PUBLIC_SUPABASE_URL` has that exact hostname. The [complete sanitized proof](PRODUCTION-TARGET-PROOF.json) has SHA-256 `418aa227ad483e9bdb7ec6eac4f5e53e8b8e8f189b1069f3ec446bb0d68f662f`.

The check fetched the live [home page](https://onwardapp.me), verified its ordinary `/signin` link, fetched that [sign-in page](https://onwardapp.me/signin), and fetched all twelve same-origin JavaScript assets referenced by its HTML. Exactly one Supabase project hostname appeared. It is embedded in the current [sign-in app bundle](https://onwardapp.me/_next/static/chunks/app/signin/page-d28be3cd5d91556b.js), whose SHA-256 is `cb27c444087690c30d0d4c131e04ca4f0019e1582be7e4a45d8f2919fb262bd8`. The JSON proof records observation times, response statuses, every inspected asset URL and hash, and the hostname comparison.

The publisher's original fixed host was taken from the earlier local audited release material, specifically `.codex-recovery/held-ten-audit-2026-09-20.ts:148–149` and the corresponding `held-ten-published-audit-2026-09-20.json` `projectHost`. Those files are ignored local operator evidence, not tracked public documentation. This fresh public-bundle check supplies a primary current link between the live product and the local database target.

This establishes the live browser Auth project and the locally loaded target hostname. It does not inspect private Vercel environment variables, assert service-role privileges, verify database schema or publication state, or establish deployed telemetry configuration. Those remain separate release checks.

No login, Auth operation, database mutation or deployment occurred. Public HTML and JavaScript stayed in memory. Only URLs, statuses, SHA-256 hashes and Supabase hostnames were saved. No anonymous/service key values, full asset contents, environment dump or reader data were printed or recorded.

The reproducible check is [check-production-target.ts](check-production-target.ts):

```powershell
node --import tsx docs/releases/new-stories-production-2026-10-02/check-production-target.ts
```

Running it again records a fresh observation. Preserve the proof's current digest when using it as a pinned release artifact.
