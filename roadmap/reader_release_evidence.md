# Reader Release Evidence

**Evidence date:** July 23, 2026

**Roadmap items:** P0-07, P0-09, and the reader portion of P0-16

**Branch:** `roadmap-reader-resilience`

## Scope and environment

This evidence covers the public reader's passage delivery, explicit
acknowledgement, recovery, focus, and end-state behavior. The interactive run
used the local Next.js development server with memory persistence, stub
providers, keyword retrieval, and synthetic intake text. It does not substitute
for real-Postgres, production-network, target-user, or assistive-technology
evidence.

## Implemented contract

- Passage delivery remains read-only. Durable progress changes only after an
  explicit Continue or Finish action.
- A delivery retry requests the same beat and chunk and discards any partial
  response before presenting it again.
- An acknowledgement retry keeps the complete passage visible and submits the
  exact same session, beat, and chunk tuple. The server's
  `already_advanced` result reconciles a committed acknowledgement whose
  response was lost.
- Missing or malformed next-position headers and malformed successful
  acknowledgement bodies fail closed; they never default to the end state.
- Connection, timeout, and server failures retry in place. Only a genuine
  position conflict (`409`) asks the reader to reload the authoritative saved
  place.
- Delivery and acknowledgement requests have bounded 15-second and 12-second
  client timeouts.
- Synchronous guards prevent double advancement and duplicate final completion.
- Quiet role-based chapter labels provide orientation without numeric or
  gamified progress.
- Focus moves after explicit Begin, Continue, and Finish actions, and to
  actionable failures. A restored session does not steal focus.
- The final bridge remains visible; a separate coda precedes explanation,
  feedback, and account conversion.

## Automated evidence

| Check | Result | Contract covered |
|---|---|---|
| `npm run check-story-beat-resilience` | Pass | Status classification, fail-closed next parsing, exact lost-response ACK retry, malformed ACK rejection, and 409 recovery |
| `npm run check-reader-visibility-telemetry` | Pass | Reader timing remains ordered around the explicit acknowledgement boundary |
| `npm run smoke` | 20/20 | Owner-scoped atomic progress, replay, stale-write rejection, and safe-integer coordinates |
| `npm run lint` | Pass | Strict static analysis |
| `npm run typecheck` | Pass | Client/server contract compatibility |

The existing progress telemetry validator and smoke suite additionally cover
memory-store replay, stale and foreign writes, terminal acknowledgement, and
singleton transition telemetry.

## In-app browser evidence

| Scenario | Result | Observed behavior |
|---|---|---|
| Begin story | Pass | The first chapter heading received focus and exposed a nonnumeric reading cue. |
| Refresh before Continue | Pass | The same unacknowledged passage returned; no content was skipped. At the initial position, the preface appeared again before that same passage. |
| Refresh during reveal | Pass | The same passage returned and restarted its local reveal; durable progress did not move. |
| Double-click Continue | Pass | Exactly one passage advanced and the next chapter heading received focus. |
| Two tabs at the same position | Pass | Concurrent Continue actions converged on the same next passage through `advanced` / `already_advanced` semantics. |
| Tab more than one passage stale | Pass | The stale tab retained its text, focused a conflict alert, and offered **Reload saved place**; reload restored the authoritative passage. |
| Acknowledgement outage | Pass | Suspending the local server beyond the 12-second bound retained the revealed passage, focused an in-place **Try Continue again** action, and advanced exactly once after reconnection. |
| Browser Back / Forward | Pass | A restored stale page failed safely with the same conflict recovery and reloaded the durable position. |
| Explicit Finish | Pass | The final bridge stayed mounted, the coda heading received focus, and afterword/feedback followed in a separate region. |
| Completed-story reload | Pass | The complete bridge and figure identity were restored without forced focus. |
| Reader touch targets | Pass | Reveal and masthead actions rendered at 49.5 CSS pixels high after the minimum-target fix. |
| Console health | Pass with note | No reader application errors were present. Next.js emitted one unrelated future smooth-scroll declaration warning. |

## Gates that remain open

- Run the acknowledgement race, rollback, RLS, and replay suite against the real
  Supabase/Postgres migration, including cross-instance concurrency.
- Add durable automated route/component E2E coverage for partial delivery,
  acknowledgement response loss after commit, timeouts, double-click, Back,
  and same/stale multi-tab cases. The current browser evidence is manual.
- Execute representative-phone responsive testing. The in-app browser's
  requested `390 × 844` viewport override remained at `1280 × 720`, so this run
  cannot honestly claim phone evidence.
- Complete keyboard-only, 200% and 400% zoom/reflow, and named screen-reader
  passes in supported browsers.
- Run moderated comprehension and emotional-pacing sessions with representative
  target readers before marking P0-07 complete.
- Exercise the post-coda save/account conversion sequence in the Supabase-auth
  environment; memory mode intentionally omits that conversion surface.
