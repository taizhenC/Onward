# Onward

An emotional-companion web app. You write a few sentences about what you're going through. Onward looks for a grounded point of contact in a real historical life, says when the parallel is only adjacent, and walks you through the episode as a quiet linear narrative.

The product is for hurting people. Tone, pacing, and prose quality matter more than features.

## Status

Roadmap-stack snapshot (2026-07-14; these slices are not assumed to be on the June production deployment). The matching engine is real and validated:

- **Library**: 50 hand-authored figure stages (weighted toward ages 15-30), seeded to Supabase.
- **Retrieval**: the latest fifty-figure gate approves keyword retrieval; FacetsRAG remains a six-lane semantic shadow challenger until it proves superiority.
- **Rerank**: GPT-OSS 120B on Cerebras, trust-gated by eval.
- **Auth**: anonymous-first via Supabase Auth — no login wall; sessions are owned and private; an email upgrade keeps stories permanently. Guests and their stories are deleted ~6 hours after last activity.
- **Safety**: deterministic crisis regex before any LLM call; crisis input is never persisted and never rate-limited.
- **Story boundaries**: optional detail/topic limits are hard eligibility rules before retrieval and composition; selections are not persisted.
- **Resonance boundary**: prose composition receives a short-lived governed brief, not the raw disclosure; HMAC fingerprints reject copied phrases and named details without persisting them.
- **Hybrid Story Composer**: the model selects only allowlisted placement/template IDs; deterministic rendering preserves canonical facts, retries once, and always returns a validated canonical fallback on failure.
- **Honest match recovery**: uncertain matches ask at most one bounded question; unresolved fits persist nothing, and an accepted adjacent story is labeled before playback.
- **Source transparency**: v5 artifacts freeze a controlled rationale, explicit gap, StorySpec version, claim/quote evidence, and safe source list; older artifacts are never backfilled from mutable content.
- **Historical concerns**: owners can send only a selected fact ID and closed reason into a privacy-safe editorial queue; no disclosure, story prose, user, session, or artifact ID is retained there.
- **Resonance recovery**: completed-story readers can answer one bounded close/not-close question without linking an email. An explicitly rejected root story can use one short-lived capability to produce a different, always-partial story without resending the disclosure, relaxing its limits, or consuming another public rate-limit unit.
- **Rate limiting**: 5/hour, 30/day per user on `/api/match` (+ hashed-IP backstop), durable in Postgres; denials carry only an unlinkable user/IP scope event committed with the counter update.
- **Retention**: the disclosure and its closed boundary/clarification context are kept only on the original session and NULL'd together at its immutable 60-day deadline; an alternate never resets that clock.
- **Safe telemetry contract**: exact allowlisted product events and unlinkable operational attempts have no generic metadata or story/input fields; entry, flow-bound anonymous auth, initial/alternate match and artifact, reader progress/completion/visibility, bounded feedback, alternate demand/resolution, and one bounded eligible initial-composition failure now use narrow authoritative producers.

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
npm run eval              # match eval (EVAL_CONCURRENCY=1 with real providers)
npm run seed              # seed figures + figure_stages to Supabase
npm run check-story-spec  # validate all draft contracts and publish rejection gates
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
| `LLM_PROVIDER` | `stub` (default) or `real` (Cerebras) |
| `CEREBRAS_API_KEY`, `CEREBRAS_BASE_URL` | for `LLM_PROVIDER=real` |
| `LLM_MODEL_RERANK`, `LLM_MODEL_PROSE` | default `gpt-oss-120b` |
| `EMBEDDING_PROVIDER` | `stub` (default) or `gemini` |
| `GEMINI_API_KEY` | for `EMBEDDING_PROVIDER=gemini` |
| `RETRIEVAL_MODE` | `keyword` is the only approved story-creation recipe. `facetsrag` and `auto` remain eval/debug challengers; every non-keyword value is rejected in production, and challenger results cannot be persisted or labeled as the approved recipe. |
| `STORY_CREATION_ENABLED` | Optional emergency kill switch; set `false` to pause new stories while leaving crisis resources available. |
| `HYBRID_STORY_COMPOSER_ENABLED` | Eval-gated promotion/rollback flag. Production defaults to canonical unless explicitly `true`; local development exercises hybrid by default. |

## Deploying

### 1. Supabase (dashboard)

1. For a fresh project, apply every file from `supabase/migrations/` in numeric order in the Supabase SQL editor: `0001` → `0002` → `0003` → `0004` → `0005` → `0006` → `0007` → `0008` → `0009` → `0010` → `0011` → `0012` → `0013` → `0014` → `0015` → `0016`. Before `0003`, enable the **pg_cron** extension and verify `delete from auth.users where false;` runs without a permission error. Apply each migration exactly once and stop on the first error. **`0003` deletes existing development session rows on purpose.** Migration `0009` adds root-only request context plus leased/atomic alternate recovery; `0010` adds typed privacy-safe product/operational telemetry with 30/14-day pruning; `0011` adds the telemetry-flow registry, transactional `create_story_session_v3` binding, typed capture RPC, and leased product-event outbox; `0012` adds transactional match-limiter, recovery, and `create_story_session_v4` artifact producers, including two-day unlinkable limiter-decision replay for ambiguous responses; `0013` makes each artifact-backed Continue/Finish an owner-scoped CAS that atomically captures its persisted-artifact-derived passage ordinal and final completion; `0014` atomically captures the persisted feedback verdict while keeping the closed miss reason in the feedback domain only; `0015` captures alternate demand only when a valid capability becomes a durable claim; `0016` derives alternate match calibration at the server boundary and atomically captures alternate terminal outcomes plus ready-artifact telemetry with their authoritative transitions. Pre-`0009` sessions remain deliberately ineligible because their original limits cannot be reconstructed safely.

Before applying `0011`-`0016`, validate the release commit locally:

```powershell
npm run typecheck
npm run check-telemetry
npm run check-telemetry-lifecycle
npm run check-telemetry-producers
npm run check-story-progress-telemetry
npm run check-feedback-telemetry
npm run check-alternate-request-telemetry
npm run check-alternate-resolution-telemetry
npm run check-entry-telemetry
npm run check-auth-telemetry
npm run check-flow-failure-telemetry
npm run check-reader-visibility-telemetry
npm run build
```

The bounded initial-composition failure producer is an application-only slice:
it adds no `0017` migration and reuses the exact `flow_failed` columns from
`0010` plus the active-flow capture/outbox transaction from `0011`.

For an existing deployment, use a schema-first rollout. Create a database restore point and validate `0011_transactional_telemetry_outbox.sql`, `0012_match_telemetry_producers.sql`, `0013_story_progress_telemetry.sql`, `0014_story_feedback_telemetry.sql`, `0015_alternate_request_telemetry.sql`, and `0016_alternate_resolution_telemetry.sql` against staging first. Migration `0013` deliberately aborts if any validator-v1 artifact has blank chunks or more than 64 passages; repair or explicitly retire every reported legacy row before retrying, so rollout cannot silently strand an old reader. Keep the currently deployed application in place, apply all six migrations to production, and run `npm run check-db` with the production Supabase URL, service-role key, and a dedicated `TELEMETRY_ID_SECRET`. Only after that gate passes should you deploy the application version that calls `create_story_session_v4`, `issue_match_recovery_flow_v2`, `consume_match_rate_limit_v2`, `acknowledge_story_position_v1`, `submit_story_feedback_v2`, `claim_alternate_story_flow_v3`, `release_alternate_story_claim_v2`, `complete_alternate_story_unavailable_v2`, `complete_alternate_story_expired_v1`, and `complete_alternate_story_session_v2`; deploying that application first makes the corresponding new story, recovery, Continue, feedback, or alternate writes fail because those RPCs do not exist yet. Confirm before the window that the running build does not require direct `product_events` writes for a request to succeed, because `0011` revokes both inserts and deletes as soon as it is applied. If a maintenance window is needed, set `STORY_CREATION_ENABLED=false` before the migrations and restore it only after the live-flow check passes. `TELEMETRY_FLOW_BINDING_ENABLED=false` is an explicit temporary escape hatch for schema/config incidents: it keeps story creation on v2 without flow registration or binding, uses the prior owner-scoped progress CAS, retains the legacy feedback RPC, and keeps all alternate claim/completion paths on their legacy RPCs, deliberately creating a telemetry gap; it does not replace the migration-first rollout. Remove it or set it to `true` only after `0011`-`0016` and the database gate pass. Migration `0011` is also the prerequisite for any outbox consumer: do not start a consumer until the capture and claim/ack/nack RPCs have been verified.

Migration `0011` revokes both direct `INSERT` and direct `DELETE` on
`product_events` from `service_role`. Capture must use
`capture_product_event_v1`; privacy deletion must use
`revoke_telemetry_flow_v1`, which removes linked events and leaves the opaque
revocation tombstone that prevents recreation.

The post-migration database gate must confirm the lifecycle/capture/outbox functions plus `create_story_session_v4`, `issue_match_recovery_flow_v2`, `consume_match_rate_limit_v2`, `acknowledge_story_position_v1`, `submit_story_feedback_v2`, `claim_alternate_story_flow_v3`, `release_alternate_story_claim_v2`, `complete_alternate_story_unavailable_v2`, `complete_alternate_story_expired_v1`, and `complete_alternate_story_session_v2` are reachable, and that the telemetry-flow and limiter-decision cleanup jobs are active. `npm run check-db` safely resolves those signatures with invalid or nonexistent identifiers and requires expected validation/not-found dispositions before any write, proving the service-role execution grants. It does not inspect `pg_proc`, cron, anon/authenticated revocation, forced RLS, concurrency, or cascades. The following read-only SQL-editor preflight and staging exercises are therefore mandatory, not optional:

```sql
select p.proname
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = any (array[
    'register_telemetry_flow_v1',
    'claim_telemetry_flow_owner_v1',
    'revoke_telemetry_flow_v1',
    'resolve_owned_telemetry_flow_v1',
    'resolve_owned_telemetry_root_v1',
    'capture_product_event_v1',
    'claim_product_event_outbox_v1',
    'ack_product_event_outbox_v1',
    'nack_product_event_outbox_v1',
    'create_story_session_v3',
    'create_story_session_v4',
    'issue_match_recovery_flow_v2',
    'consume_match_rate_limit_v2',
    'acknowledge_story_position_v1',
    'submit_story_feedback_v2',
    'claim_alternate_story_flow_v3',
    'release_alternate_story_claim_v2',
    'complete_alternate_story_unavailable_v2',
    'complete_alternate_story_expired_v1',
    'complete_alternate_story_session_v2'
  ])
order by p.proname;

select jobname, schedule, active
from cron.job
where jobname in (
  'onward-privacy-safe-telemetry-cleanup',
  'onward-telemetry-flow-cleanup',
  'onward-prune-match-rate-limit-decisions'
)
order by jobname;
```

Rollback compatibility is deliberately narrow. Migrations `0011`-`0016` retain `create_story_session_v3`, `create_story_session_v2`, the prior direct session CAS permissions, the legacy `submit_story_feedback` RPC, and the legacy alternate claim/completion RPCs, so the application can roll back while the new schema remains installed. A pre-0016 rollback loses alternate terminal, match-calibration, and ready-artifact telemetry; a pre-0015 rollback also loses transactional alternate-request events; a pre-0014 rollback also loses transactional feedback events; a pre-0013 rollback also loses transactional progress/completion events; a v3 rollback loses transactional match-producer completeness; a v2 rollback stops registering/binding new flows and is incident-only. None restores the pre-`0011` direct-write telemetry paths: `0011` revokes direct `product_events` inserts and deletes in favor of `capture_product_event_v1` and `revoke_telemetry_flow_v1`. Do not roll back to an application that requires direct product-event writes; use a rollback build that retains typed capture and privacy deletion through flow revocation, or roll forward. Keep all six migrations installed during the rollback window.

A rollback build must retain the typed capture path and perform privacy deletion
through `revoke_telemetry_flow_v1`; a build that directly inserts or deletes
`product_events` is not compatible with schema `0011`.

The older `0009` cleanup rule still applies: keep the unsuffixed `create_story_session` RPC through the v2 rollback window. Only after every instance uses v2 or newer, production verification passes, and that rollback compatibility is no longer required should an operator manually apply `supabase/rollout/remove_legacy_story_session_rpc.sql`. That cleanup intentionally lives outside the automatic migration stream.

The alternate capability expiry is a **start-by** deadline: a claim must begin before it, while an already-started claim may finish only within its separate two-minute lease and the original disclosure-retention deadline.
2. Authentication → Sign In/Up → enable **anonymous sign-ins**.
3. Authentication → URL Configuration → set **Site URL** to the production URL; add `http://localhost:3000/**` to the redirect allowlist (a separate Supabase project for local dev is cleaner — Site URL is single-valued).
4. Authentication → Emails → configure **custom SMTP** (Resend's free tier works). The built-in sender is limited to ~2 emails/hour **and only delivers to project team members** — without custom SMTP, real users' save/sign-in emails silently fail.
5. Rewrite **three** email templates to the `token_hash` form (the default PKCE `?code=` links only work in the originating browser):
   - *Magic Link* and *Confirm signup*: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/stories`
   - *Confirm email change*: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email_change&next=/stories`
6. Seed: `npm run seed`, then `npm run seed-story-specs`. New stages and specs stay in `draft`; source mapping and human review are required before an editor moves a spec to `review` and runs `npm run story-spec:status -- publish <storySpecId>`. Production matching considers only valid published StorySpecs. The same command with `retire` immediately removes one stage version from new matching without a deploy. Historical concerns appear in `historical_concern_reports`; triage them through `triage_historical_concern`, and retire the pinned `story_spec_id` when a concern requires immediate unpublication. Reports never auto-retire content. Run `npm run check-db` after publishing the intended launch subset. For semantic retrieval: `npm run check-embeddings` → `npm run seed-embeddings` → `npm run check-embeddings`.

### 2. Vercel

Set the environment variables: `PERSISTENCE=supabase`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `IP_HASH_SALT`, a separate required `TELEMETRY_ID_SECRET`, `TELEMETRY_FLOW_BINDING_ENABLED=true` after `0011`-`0016` pass verification, optionally dedicated `MATCH_RECOVERY_TOKEN_SECRET` and `ALTERNATE_STORY_TOKEN_SECRET`, `LLM_PROVIDER=real`, `CEREBRAS_API_KEY`, `CEREBRAS_BASE_URL`, `LLM_MODEL_RERANK`, `LLM_MODEL_PROSE`, `EMBEDDING_PROVIDER=gemini`, `GEMINI_API_KEY`, `RETRIEVAL_MODE=keyword`, and `HYBRID_STORY_COMPOSER_ENABLED=false` until the hybrid recipe clears its benchmark and review gate. Production rejects every non-keyword retrieval value, and story creation independently rejects a challenger result before persistence or telemetry; the July 2 fifty-figure holdout approved keyword retrieval while FacetsRAG remains an eval challenger. Promote hybrid independently by setting its flag to `true`; rollback requires only restoring `false`. Deploy; then walk the live flow once: landing → begin → story → negative feedback → alternate story → save card → email confirm → `/stories`, and confirm a foreign story URL 404s. Check `cron.job_run_details` in Supabase after the first cron firings.

For telemetry deployments, set a dedicated `TELEMETRY_ID_SECRET`; Supabase/production mode has no fallback to `IP_HASH_SALT`, and reusing the salt is not supported. During rotation, configure `TELEMETRY_ID_PREVIOUS_SECRETS` before switching the current key and retain outgoing keys until every associated flow, event, and outbox retry is deleted or drained. Configure Vercel, proxy, and APM logging to redact `x-onward-telemetry-flow-id`, the short-lived `onward_entry_flow` handoff cookie, and the two-minute `onward_auth_retry` challenge cookie; the application does not log any of them, but infrastructure retention must also stay within the reviewed lifecycle.

In staging, verify story-flow auth from a fresh signed-out browser: submit one
valid non-crisis intake, confirm the first `/api/match` response is `401` with an
HttpOnly `onward_auth_retry` cookie, and confirm the anonymous-auth retry creates
exactly one `auth_established:anonymous` row plus one outbox pointer. Replaying
the same request must not create a second unit. A second intake from the now
authenticated browser, standalone `/signin`, email confirmation/upgrade,
password setting, and saved-story access must create none. Repeat the crisis and
`STORY_CREATION_ENABLED=false` canaries and confirm they set no auth challenge,
register no flow, and emit no event. This check requires no migration beyond the
existing `0011` lifecycle/capture/outbox schema.

## Privacy posture (plain words, enforced in code)

- Anonymous by default; no account required to use the product.
- Stories are owned: another person's story URL is a 404, indistinguishable from a missing one.
- Guest accounts and their stories are deleted ~6 hours after last activity (`ANON_USER_TTL_HOURS`); linking an email keeps them.
- The text a user writes is NULL'd from our side 60 days after creation (`FEELING_RETENTION_DAYS`), saved or not.
- Crisis input is detected by a deterministic regex before any LLM call and is never persisted.
- Optional story intensity/topic limits and a closed clarification choice are retained with the disclosure only on the original session so one alternate can reuse them exactly. They are never placed in either StoryArtifact or the alternate session, and are NULL'd at the original disclosure deadline.
- Pre-story recovery keeps only an opaque-token hash and keyed input fingerprint; the key is usable for ten minutes and expired rows are removed by the 15-minute cleanup job.
- Historical concerns retain only curated StorySpec/stage/fact identifiers, a closed reason/status, aggregate count, and timestamps. They do not retain the reporter, session, artifact, rationale, disclosure, or prose.
- Resonance feedback is owner-linked for deletion but contains only story/recipe identifiers and a closed verdict/reason. It expires after 90 days; no optional note field exists until separate consent, encryption, reviewer access, and shorter deletion are implemented.
- Alternate flow rows contain only owner/content identifiers, a token hash, closed state, bounded attempt count, lease, and timestamps. The browser sends no age, disclosure, boundaries, clarification, feedback reason, candidate list, or prose; the alternate session stores none of the original sensitive context.
- Product telemetry accepts only exact closed events and HMAC-authenticated, purpose-separated opaque IDs; raw session/artifact IDs and flow-derived IDs at unlinkable boundaries are rejected. Outbox-only repeatable-occurrence tokens are never stored. IDs carry a non-secret key ID so current and retained previous keys can verify deletion and outbox retries across rotation. Crisis, rate-limit, and deletion events are unlinkable. Operational attempts contain no flow/user/session/story ID. Product events expire within 30 days and attempts within 14 days. New flows have an issued/owner-claimed/root-bound mapping with root/account cascades and opaque revocation tombstones; P0-14 still must expose the user-facing delete/save/consent actions and intentionally does not backfill legacy sessions. No external raw-event consumer may launch until its in-flight deletion/retraction behavior passes privacy review. See [`roadmap/telemetry_contract.md`](./roadmap/telemetry_contract.md).
- No prompt/response bodies, feelings, raw IPs, or raw errors are ever logged.

## Architecture

- [`CLAUDE.md`](./CLAUDE.md) — working guidance: invariants (anti-echo, recovery-asymmetry, privacy taint), conventions, file layout, current status.
- [`tbd_plan.md`](./tbd_plan.md) — full target architecture (matching pipeline, FacetsRAG, privacy taint model, prompt design).
- [`MVP.md`](./MVP.md) — the Phase 0 plan snapshot (historical; forks described there were cut).
