# Onward

An emotional-companion web app. You write a few sentences about what you're going through. Onward looks for a grounded point of contact in a real historical life, says when the parallel is only adjacent, and walks you through the episode as a quiet linear narrative.

The product is for hurting people. Tone, pacing, and prose quality matter more than features.

## Status

Deploy slice (2026-06-10). The matching engine is real and validated:

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
- **Resonance feedback**: completed-story readers can answer one bounded close/not-close question without linking an email; rows contain only owner/content identifiers and closed enums, expire after 90 days, and never include disclosure or story prose.
- **Rate limiting**: 5/hour, 30/day per user on `/api/match` (+ hashed-IP backstop), durable in Postgres.
- **Retention**: user disclosures are NULL'd 60 days after creation by a scheduled job.

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
| `NEXT_PUBLIC_SUPABASE_URL` | public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public; browser uses it for **auth endpoints only** (RLS default-deny) |
| `SUPABASE_SERVICE_ROLE_KEY` | **secret**, server-only, bypasses RLS |
| `IP_HASH_SALT` | **secret**; required with `PERSISTENCE=supabase`; `openssl rand -hex 32` |
| `MATCH_RECOVERY_TOKEN_SECRET` | Optional dedicated HMAC secret for single-use recovery fingerprints; production falls back to `IP_HASH_SALT`. |
| `LLM_PROVIDER` | `stub` (default) or `real` (Cerebras) |
| `CEREBRAS_API_KEY`, `CEREBRAS_BASE_URL` | for `LLM_PROVIDER=real` |
| `LLM_MODEL_RERANK`, `LLM_MODEL_PROSE` | default `gpt-oss-120b` |
| `EMBEDDING_PROVIDER` | `stub` (default) or `gemini` |
| `GEMINI_API_KEY` | for `EMBEDDING_PROVIDER=gemini` |
| `RETRIEVAL_MODE` | `keyword` (approved/default) / `facetsrag` (challenger) / `auto` (local only; rejected in production) |
| `STORY_CREATION_ENABLED` | Optional emergency kill switch; set `false` to pause new stories while leaving crisis resources available. |
| `HYBRID_STORY_COMPOSER_ENABLED` | Eval-gated promotion/rollback flag. Production defaults to canonical unless explicitly `true`; local development exercises hybrid by default. |

## Deploying

### 1. Supabase (dashboard)

1. Apply migrations in order from `supabase/migrations/` (SQL editor): `0001` → `0002` → `0003` → `0004` → `0005` → `0006` → `0007` → `0008`. Before `0003`: enable the **pg_cron** extension and verify `delete from auth.users where false;` runs without a permission error. **`0003` deletes existing dev session rows on purpose.** Migration `0004` adds immutable StorySpecs; `0005` adds immutable owner-scoped StoryArtifacts and atomic session creation; `0006` adds short-lived single-use match-recovery credits; `0007` requires v5 provenance on new artifacts and adds the bounded historical-concern queue; `0008` adds immutable 90-day resonance feedback for completed stories.
2. Authentication → Sign In/Up → enable **anonymous sign-ins**.
3. Authentication → URL Configuration → set **Site URL** to the production URL; add `http://localhost:3000/**` to the redirect allowlist (a separate Supabase project for local dev is cleaner — Site URL is single-valued).
4. Authentication → Emails → configure **custom SMTP** (Resend's free tier works). The built-in sender is limited to ~2 emails/hour **and only delivers to project team members** — without custom SMTP, real users' save/sign-in emails silently fail.
5. Rewrite **three** email templates to the `token_hash` form (the default PKCE `?code=` links only work in the originating browser):
   - *Magic Link* and *Confirm signup*: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/stories`
   - *Confirm email change*: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email_change&next=/stories`
6. Seed: `npm run seed`, then `npm run seed-story-specs`. New stages and specs stay in `draft`; source mapping and human review are required before an editor moves a spec to `review` and runs `npm run story-spec:status -- publish <storySpecId>`. Production matching considers only valid published StorySpecs. The same command with `retire` immediately removes one stage version from new matching without a deploy. Historical concerns appear in `historical_concern_reports`; triage them through `triage_historical_concern`, and retire the pinned `story_spec_id` when a concern requires immediate unpublication. Reports never auto-retire content. Run `npm run check-db` after publishing the intended launch subset. For semantic retrieval: `npm run check-embeddings` → `npm run seed-embeddings` → `npm run check-embeddings`.

### 2. Vercel

Set the environment variables: `PERSISTENCE=supabase`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `IP_HASH_SALT`, `LLM_PROVIDER=real`, `CEREBRAS_API_KEY`, `CEREBRAS_BASE_URL`, `LLM_MODEL_RERANK`, `LLM_MODEL_PROSE`, `EMBEDDING_PROVIDER=gemini`, `GEMINI_API_KEY`, `RETRIEVAL_MODE=keyword`, and `HYBRID_STORY_COMPOSER_ENABLED=false` until the hybrid recipe clears its benchmark and review gate. Production rejects retrieval `auto`: the July 2 fifty-figure holdout approved keyword retrieval, while FacetsRAG remains a shadow/eval challenger. Promote hybrid independently by setting its flag to `true`; rollback requires only restoring `false`. Deploy; then walk the live flow once: landing → begin → story → save card → email confirm → `/stories`, and confirm a foreign story URL 404s. Check `cron.job_run_details` in Supabase after the first cron firings.

## Privacy posture (plain words, enforced in code)

- Anonymous by default; no account required to use the product.
- Stories are owned: another person's story URL is a 404, indistinguishable from a missing one.
- Guest accounts and their stories are deleted ~6 hours after last activity (`ANON_USER_TTL_HOURS`); linking an email keeps them.
- The text a user writes is NULL'd from our side 60 days after creation (`FEELING_RETENTION_DAYS`), saved or not.
- Crisis input is detected by a deterministic regex before any LLM call and is never persisted.
- Optional story intensity/topic limits are applied in memory before retrieval and are not stored in the session or StoryArtifact.
- Clarification choices are not stored. Recovery keeps only an opaque-token hash and keyed input fingerprint; the key is usable for ten minutes and expired rows are removed by the 15-minute cleanup job.
- Historical concerns retain only curated StorySpec/stage/fact identifiers, a closed reason/status, aggregate count, and timestamps. They do not retain the reporter, session, artifact, rationale, disclosure, or prose.
- Resonance feedback is owner-linked for deletion but contains only story/recipe identifiers and a closed verdict/reason. It expires after 90 days; no optional note field exists until separate consent, encryption, reviewer access, and shorter deletion are implemented.
- No prompt/response bodies, feelings, raw IPs, or raw errors are ever logged.

## Architecture

- [`CLAUDE.md`](./CLAUDE.md) — working guidance: invariants (anti-echo, recovery-asymmetry, privacy taint), conventions, file layout, current status.
- [`tbd_plan.md`](./tbd_plan.md) — full target architecture (matching pipeline, FacetsRAG, privacy taint model, prompt design).
- [`MVP.md`](./MVP.md) — the Phase 0 plan snapshot (historical; forks described there were cut).
