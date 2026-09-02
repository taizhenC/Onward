# Onward

An emotional-companion web app. You write a few sentences about what you're going through. Onward looks for a grounded point of contact in a real historical life, says when the parallel is only adjacent, and walks you through the episode as a quiet linear narrative.

The product is for hurting people. Tone, pacing, and prose quality matter more than features.

## Status

Roadmap-stack snapshot (2026-07-14; these slices are not assumed to be on the June production deployment). The matching engine is real and validated:

- **Library**: 50 hand-authored figure stages (weighted toward ages 15-30), seeded to Supabase.
- **Retrieval**: the latest fifty-figure gate approves keyword retrieval; FacetsRAG remains a six-lane semantic shadow challenger until it proves superiority.
- **Rerank**: GPT-OSS 120B on Cerebras, trust-gated by eval.
- **Auth**: anonymous-first via Supabase Auth — no login wall; sessions are owned and private; a confirmed email upgrade keeps stories beyond guest cleanup, until the owner deletes them. A temporary guest account and every story in it are deleted about six hours after the latest story creation or saved reading progress in that account.
- **Safety**: deterministic crisis regex before any LLM call; crisis input is never persisted and never rate-limited.
- **Story boundaries**: optional detail/topic limits are hard eligibility rules before retrieval and composition; selections persist only on the original session with its private context and are cleared by daily cleanup after the fixed 60-day disclosure deadline, or earlier with guest, story, or account deletion.
- **Resonance boundary**: prose composition receives a short-lived governed brief, not the raw disclosure; HMAC fingerprints reject copied phrases and named details without persisting them.
- **Hybrid Story Composer**: the model selects only allowlisted placement/template IDs; deterministic rendering preserves canonical facts, retries once, and always returns a validated canonical fallback on failure.
- **Honest match recovery**: uncertain matches ask at most one bounded question; unresolved fits persist nothing, and an accepted adjacent story is labeled before playback.
- **Source transparency**: v5 artifacts freeze a controlled rationale, explicit gap, StorySpec version, claim/quote evidence, and safe source list; older artifacts are never backfilled from mutable content.
- **Historical concerns**: owners can send only a selected shared historical-library fact ID and closed reason into a privacy-safe editorial queue; no disclosure, generated story prose, account, session, saved-story, or artifact identifier is retained there.
- **Resonance recovery**: completed-story readers can answer one bounded close/not-close question without linking an email. An explicitly rejected root story can use one short-lived capability to produce a different, always-partial story without resending the disclosure, relaxing its limits, or consuming another public rate-limit unit.
- **Rate limiting**: 5/hour, 30/day per user on `/api/match` (+ hashed-IP backstop), durable in Postgres; denials carry only an unlinkable user/IP scope event committed with the counter update.
- **Retention**: the disclosure and its closed boundary/clarification context are kept only on the original session, become eligible for daily cleanup together at its immutable 60-day deadline, and may be deleted earlier with the guest account, story, or account; an alternate never resets that clock.
- **Safe telemetry contract**: exact allowlisted product events and unlinkable operational attempts have no generic metadata or story/input fields; entry, flow-bound anonymous auth, initial/alternate match and artifact, reader progress/completion/visibility, bounded feedback, alternate demand/resolution, and one bounded eligible initial-composition failure now use narrow authoritative producers. Migration `0017` installs a first-party Postgres rollup dispatcher, disabled by default; raw events are never sent to an external sink.

## Run locally

```powershell
npm install
npm run dev          # http://localhost:3000 — zero-config (memory mode, stub providers)
```

Memory mode needs no keys, no database, no auth setup: sessions live in-process, figures come from the authored const, matching uses the keyword stub, and the server uses a fixed local user.

For the full stack locally, copy `.env.example` to `.env.local` and fill in the Supabase / Cerebras / Gemini sections.

### Scripts

```powershell
npm run typecheck         # tsc --noEmit
npm run build             # production build
npm run smoke             # hermetic regression suite (memory + stubs)
npm run eval              # match eval (set EVAL_RECIPE_ID; use EVAL_CONCURRENCY=1 with real providers)
npm run seed              # seed figures + figure_stages to Supabase
npm run check-story-spec  # validate all draft contracts and publish rejection gates
npm run check-story-spec-cutover # live pre-0023 gate; requires zero published StorySpecs
npm run check-story-artifact # validate complete replay payloads, privacy, and tamper rejection
npm run check-source-transparency # validate rationale, evidence, sources, and bounded reports
npm run check-resonance-feedback # validate bounded post-story feedback and privacy gates
npm run check-try-another   # validate one-use alternate, exclusion, retry, and retention gates
npm run check-telemetry     # validate exact safe events, reductions, retention, and SQL privacy
npm run check-telemetry-lifecycle # memory lifecycle + SQL/runtime static invariants (not a real-Postgres proof)
npm run check-telemetry-producers # validate initial match/recovery/artifact producer mappings and privacy
npm run check-story-progress-telemetry # validate atomic passage/completion producers and replay
npm run check-feedback-telemetry # validate atomic feedback producer, replay, roles, and privacy
npm run check-alternate-request-telemetry # validate claim-only alternate demand telemetry
npm run check-alternate-resolution-telemetry # validate terminal/match/artifact alternate telemetry
npm run check-entry-telemetry # validate landing-to-intake handoff and first interaction telemetry
npm run check-auth-telemetry # validate flow-bound anonymous-auth proof, singleton capture, and silence rules
npm run check-flow-failure-telemetry # validate bounded initial-composition failure capture and privacy
npm run check-telemetry-dispatcher # validate private daily rollups, atomic delivery, k suppression, and queue health
npm run check-story-deletion # validate owner cascades, CSRF, telemetry retirement, and deletion UX
npm run check-reader-visibility-telemetry # validate first-content, passage-presentation, and source-open telemetry
npm run check-story-boundaries # validate hard exclusions, recovery, and crisis precedence
npm run check-resonance-brief # validate bounded derived input and provider privacy
npm run check-story-composer # validate hybrid retry, gates, and canonical fallback
npm run check-match-recovery # validate one-question and adjacent-match recovery
npm run seed-story-specs  # seed review drafts; never overwrites reviewed/published content
npm run check-db          # Supabase acceptance check (after seed)
npm run seed-embeddings   # embed shape/facet texts (requires EMBEDDING_PROVIDER=gemini)
npm run check-embeddings  # live embed probe + cache validity check
npm run eval-retrieval    # Stage A/B gold survival (no Cerebras)
```

`keyword` now has both the promoted v1 recipe and an unpromoted personalized-
preface v2 challenger. Set `EVAL_RECIPE_ID` explicitly for match evaluation so
two recipes with the same retrieval mode cannot be confused. Story-quality
evaluation instead binds the candidate recipe inside its protected packet and
manifest. The v2 recipe is evaluation-only and cannot be selected by served
production until a separate evidence-backed promotion changes the protected
selector. The selected v1 request contract remains frozen, but its returned
eyebrow is displayed only when it exactly matches a code-reviewed line;
otherwise the neutral eyebrow is used.

## Environment

See `.env.example` for the documented template. Summary:

| Variable | Notes |
| --- | --- |
| `PERSISTENCE` | `memory` (default) or `supabase` |
| `ONWARD_ALLOW_MEMORY_IN_PRODUCTION` | Build-only escape hatch. It is honored only while `npm run build` is executing; served production runtimes still reject memory or unknown persistence modes even if the variable was copied. |
| `NEXT_PUBLIC_SUPABASE_URL` | public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public; browser uses it for **auth endpoints only** (RLS default-deny) |
| `SUPABASE_SERVICE_ROLE_KEY` | **secret**, server-only, bypasses RLS |
| `IP_HASH_SALT` | **secret**; required with `PERSISTENCE=supabase`; minimum 32 bytes, generated with `openssl rand -hex 32` |
| `TELEMETRY_ID_SECRET` | **Dedicated secret required in Supabase and production modes** for authenticated telemetry identifiers; minimum 32 bytes. There is no `IP_HASH_SALT` fallback and the values must be different. |
| `TELEMETRY_ID_PREVIOUS_SECRETS` | Optional comma-separated verification ring of up to eight prior telemetry secrets. Retain each previous key for at least 30 days after its last issuance and until its outbox retries are drained. |
| `TELEMETRY_FLOW_BINDING_ENABLED` | Temporary schema/config availability kill switch. Defaults enabled; set `false` only to keep stories on legacy v2, reader progress on the prior CAS, feedback on the legacy RPC, and alternate claim/completion on the legacy RPCs while `0011`-`0016` or their configuration is unavailable. This incident mode intentionally loses linked telemetry, including story-flow auth measurement. |
| `MATCH_RECOVERY_TOKEN_SECRET` | Optional dedicated HMAC secret for single-use recovery fingerprints; minimum 32 bytes; production falls back to `IP_HASH_SALT`. |
| `ALTERNATE_STORY_TOKEN_SECRET` | Optional dedicated HMAC secret for post-story alternate capabilities; minimum 32 bytes; falls back to the recovery secret, then `IP_HASH_SALT`. |
| `STORY_DELETION_TOKEN_SECRET` | Optional dedicated HMAC secret for ten-minute story-delete confirmations; minimum 32 bytes; production falls back to `IP_HASH_SALT`. Rotation invalidates only outstanding confirmation forms. |
| `ACCOUNT_DELETION_TOKEN_SECRET` | Optional dedicated HMAC secret for ten-minute account-delete and reauthentication continuations; minimum 32 bytes; falls back to `STORY_DELETION_TOKEN_SECRET`, then `IP_HASH_SALT`. Rotation invalidates only outstanding forms. |
| `LLM_PROVIDER`, `LLM_MODEL_RERANK`, `LLM_MODEL_PROSE` | Local/eval controls. Served production ignores them and uses the selected immutable recipe. |
| `CEREBRAS_API_KEY`, `CEREBRAS_BASE_URL` | Production credential and pinned Cerebras endpoint. |
| `EMBEDDING_PROVIDER`, `EMBEDDING_MODEL`, `EMBEDDING_DIM` | Local/eval controls. Served production derives them from the selected recipe. |
| `GEMINI_API_KEY` | Required when the selected production recipe uses Gemini embeddings. |
| `RETRIEVAL_MODE` | Local/eval control only. Production ignores it—including `auto`—and uses the selected recipe's exact retrieval path and top-K. |
| `ONWARD_PRODUCTION_RECIPE_ID` | Required in production and the sole non-secret behavior selector. It can name only the primary or pre-registered rollback recipe in [`config/story-recipes.json`](config/story-recipes.json). A compatible matching-recipe rollback is this one change and needs no data migration. |
| `ONWARD_DEPLOYMENT_VERSION` | Required outside Vercel when no `VERCEL_GIT_COMMIT_SHA` is present. Stored with the immutable session recipe for release audit. |
| `STORY_CREATION_ENABLED` | Optional emergency kill switch; set `false` to pause new stories while leaving crisis resources available. |
| `HYBRID_STORY_COMPOSER_ENABLED` | Local/eval control only. Production composer behavior is pinned by the selected recipe; local development exercises hybrid by default. |

## Deploying

The Supabase and Vercel runbook (migration order, dashboard settings, email
templates, rollout gates, and the live-flow checklist) lives in
[`docs/DEPLOYING.md`](docs/DEPLOYING.md).

## Privacy posture (plain words, enforced in code)

- Anonymous by default; no account required to use the product.
- Stories are owned: another person's story URL is a 404, indistinguishable from a missing one.
- A temporary guest account and every story in it are deleted about six hours after the latest story creation or saved reading progress in that account (`ANON_USER_TTL_HOURS`). Sending an email link does not change that lifecycle. Confirming it commits one immutable account-level Save State for the same owner, covering existing and future Owner Stories until story/account deletion; older permanent accounts are marked as legacy without a fabricated confirmation time.
- Owners can hard-delete any saved story or their entire account from the active Onward database without support. Account deletion removes the sign-in, all owned stories/artifacts/feedback/recovery state, owner-linked telemetry flows, and user rate-limit keys; guest expiry uses the same cascade. Deleting an original story also deletes its alternate; deleting only an alternate preserves the original. Daily counts already settled before deletion follow a 30-day expiry schedule without an account, session, or saved-story identifier, with physical removal by daily cleanup. Historical concern reports remain attached to shared historical-library StorySpec and fact identifiers but contain no reporter, account, session, saved-story, artifact, disclosure, or generated-prose identifier; they currently have no automatic expiry or user-controlled deletion. Provider processing and infrastructure backups follow separately reviewed schedules and are not recalled by the in-app transaction.
- Legacy v5 replay eligibility is a database-owned marker containing only the existing `artifact_id`. It follows the Owner Story lifecycle: its foreign key cascades when the artifact is removed by story deletion, account deletion, or guest expiry. It copies no account, session, disclosure, source, or generated prose, and it is not an analytics record. Forced RLS keeps it browser-inaccessible; the service role may only read it while loading an already-owned artifact.
- The situation text and private request context become eligible for daily cleanup at their fixed 60-day deadline (`FEELING_RETENTION_DAYS`), saved or not, and are deleted earlier with the guest account, story, or account. The submitted age and validated generated wording follow the Owner Story lifecycle until story or account deletion; Save never extends the private-context deadline.
- Crisis input is detected by a deterministic regex before any LLM call and is never persisted.
- Optional story intensity/topic limits and a closed clarification choice are retained with the disclosure only on the original session so one alternate can reuse them exactly. They are never placed in either StoryArtifact or the alternate session, become cleanup-eligible at the original disclosure deadline, and are NULL'd by the next daily cleanup.
- Pre-story recovery keeps only an opaque-token hash and keyed input fingerprint; the key is usable for ten minutes and expired rows are removed by the 15-minute cleanup job.
- Historical concerns retain only shared historical-library StorySpec/stage/fact identifiers, a closed reason/status, aggregate count, and timestamps. They do not retain the reporter, account, session, saved-story, artifact, rationale, disclosure, or generated prose.
- Resonance feedback is owner-linked for deletion but contains only story/recipe identifiers and a closed verdict/reason. It becomes cleanup-eligible after 90 days and is physically removed by scheduled cleanup; no optional note field exists until separate consent, encryption, reviewer access, and shorter deletion are implemented.
- Alternate flow rows contain only owner/content identifiers, a token hash, closed state, bounded attempt count, lease, and timestamps. The browser sends no age, disclosure, boundaries, clarification, feedback reason, candidate list, or prose; the alternate session stores none of the original sensitive context.
- Product telemetry accepts only exact closed events and HMAC-authenticated, purpose-separated opaque IDs; raw session/artifact IDs and flow-derived IDs at unlinkable boundaries are rejected. Outbox-only repeatable-occurrence tokens are never stored. IDs carry a non-secret key ID so current and retained previous keys can verify deletion and retries across rotation. Crisis, rate-limit, and deletion events are unlinkable. Operational attempts contain no flow/user/session/story ID. Product events and identifier-free daily marginal rollups become cleanup-eligible by 30 days; attempts do so by 14 days, and scheduled jobs perform physical deletion. New flows have an issued/owner-claimed/root-bound mapping with root/account cascades and opaque revocation tombstones. Individual-story/account deletion, just-in-time Save consent, durable owner Save State, and a closed code-owned retention registry now exist; real managed-database/backup proof and external provider/infrastructure review remain. Save/reopen telemetry is still disabled until a separate transaction-derived producer is reviewed. Raw product events stay inside Postgres: when explicitly enabled after release gates, the first-party dispatcher claims IDs only and atomically folds source-first before delivery. The candidate aggregate read remains private pending a separate dashboard privacy review. External raw-event consumers remain prohibited because no deletion-retraction protocol exists. See [`roadmap/telemetry_contract.md`](./roadmap/telemetry_contract.md).
- Application code does not intentionally log prompt/response bodies, disclosures, raw IPs, or raw errors; production proxy, APM, and provider logging/retention must be configured and verified separately.

## Architecture

- [`CLAUDE.md`](./CLAUDE.md) — working guidance: invariants (anti-echo, recovery-asymmetry, privacy taint), conventions, file layout, current status.
- [`tbd_plan.md`](./tbd_plan.md) — full target architecture (matching pipeline, FacetsRAG, privacy taint model, prompt design).
- [`MVP.md`](./MVP.md) — the Phase 0 plan snapshot (historical; forks described there were cut).
