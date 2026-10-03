# Prepared one-request API canary

`LIVE-CANARY.ts` is prepared but has **not run against production**. Root must first record ten exact successful publications (44 valid total, zero quarantined rows), refresh the production workers, and establish the exact deployed forty-character commit SHA. The current matching gate remains failed; no live invocation is authorized at this checkpoint.

```powershell
# Offline only. Does not load environment values, contact a provider, create a
# guest, read a live database or alter live data.
node --import tsx docs/releases/new-stories-production-2026-10-02/LIVE-CANARY.ts --self-test

# Root only, after the separate publication and worker-refresh requirements.
node --import tsx docs/releases/new-stories-production-2026-10-02/LIVE-CANARY.ts --run --deployment=<exact-observed-production-commit-sha>
```

The preselected input is frozen extension case index 2, age 26, expected Blackwell. Its exact dataset and completed candidate hashes are checked before environment/Auth/network access. Live mode requires the final forty-four-publication receipt and exact Blackwell publication receipt, and confirms that the published document equals the frozen complete draft apart from publication/review metadata. The production domain and independently observed Supabase hostname are fixed.

A fresh in-memory SSR cookie jar authenticates one anonymous guest. There is one normal `/api/match` POST; any clarification, no-close-match result, rate limit, status failure, or unexpected result ends delivery checks immediately. No continuation, second match, new guest, account rotation, Save action, direct provider invocation or matching override exists. Auth allows only one signup POST and one cleanup owner GET, each with a timeout and repeat refusal.

Only this newly returned session and its proven anonymous owner are used for narrow service-side reads. The artifact query adds the known artifact identity and checks current strict integrity, retention labeling, exact published StorySpec identity, canonical text and full source projection. Both session and artifact must identify the unchanged approved recipe and the exact requested deployed commit. Their private identifiers are never written, printed or included in error messages.

Normal story GET and beat/ACK POST routes supply the delivery check. All seven canonical beats and every actual artifact passage are checked; fourteen passages are possible, while the existing 64-passage contract is the hard bound. Every chunk must match before ACK. Final owned progress must be beat 7, chunk 0. A second normal story GET checks rendered afterword headings, identity, source citations/links, facts/locators, quotations, dramatized lines, review status and the closing bridge. Script/flight data is excluded from that HTML check.

Cleanup runs even after a delivery failure, through the normal account-deletion form and its CSRF-bound route, after reconfirming the exact anonymous owner. It checks the normal deletion confirmation page and absence of the known owned session. There is no service-role Auth deletion, arbitrary privileged delete or user listing. An unconfirmed signup outcome is reported without claiming cleanup or creating another identity.

`LIVE-CANARY-ATTEMPT.json` is created exclusively before the first Auth request. Any existing attempt or receipt refuses another run; failed outcomes cannot silently become retries. `LIVE-CANARY-RECEIPT.json` is written exclusively and records only public content hashes, deployment/recipe identity, reduced counts, status and redacted failure codes. Cookies, tokens, guest/session/artifact identifiers, full route HTML and received prose remain in memory. Successful receipts cannot be overwritten.

This is **SSR/API coverage**, not interactive UI, visual layout, source-toggle telemetry, full-catalog evaluation or youth intake coverage. Root's publication/catalog preservation audit remains separate. The offline self-test passed five negative cases with zero network requests, zero Auth mutations and zero database mutations. TypeScript and scoped ESLint also passed; none proves a completed live canary.
