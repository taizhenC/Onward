# Onward

An emotional-companion web app. You write a few sentences about what you're going through. Onward finds a real historical figure who, at about your age, lived through a genuinely similar emotional episode — and walks you through that episode as a quiet, linear 7-beat narrative that ends by bridging back to you.

The product is for hurting people. Tone, pacing, and prose quality matter more than features.

## Status

Deploy slice (2026-06-10). The matching engine is real and validated:

- **Library**: 50 hand-authored figure stages (weighted toward ages 15-30), seeded to Supabase.
- **Retrieval**: FacetsRAG six-lane semantic retrieval (Gemini embeddings, in-memory cosine) with a keyword fallback; head-to-head eval beats keyword 95.1% vs 90.2% top-1.
- **Rerank**: GPT-OSS 120B on Cerebras, trust-gated by eval.
- **Auth**: anonymous-first via Supabase Auth — no login wall; sessions are owned and private; an email upgrade keeps stories permanently. Guests and their stories are deleted ~6 hours after last activity.
- **Safety**: deterministic crisis regex before any LLM call; crisis input is never persisted and never rate-limited.
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
| `LLM_PROVIDER` | `stub` (default) or `real` (Cerebras) |
| `CEREBRAS_API_KEY`, `CEREBRAS_BASE_URL` | for `LLM_PROVIDER=real` |
| `LLM_MODEL_RERANK`, `LLM_MODEL_PROSE` | default `gpt-oss-120b` |
| `EMBEDDING_PROVIDER` | `stub` (default) or `gemini` |
| `GEMINI_API_KEY` | for `EMBEDDING_PROVIDER=gemini` |
| `RETRIEVAL_MODE` | `keyword` (approved/default) / `facetsrag` (challenger) / `auto` (local only; rejected in production) |
| `STORY_CREATION_ENABLED` | Optional emergency kill switch; set `false` to pause new stories while leaving crisis resources available. |

## Deploying

### 1. Supabase (dashboard)

1. Apply migrations in order from `supabase/migrations/` (SQL editor): `0001` → `0002` → `0003`. Before `0003`: enable the **pg_cron** extension and verify `delete from auth.users where false;` runs without a permission error. **`0003` deletes existing dev session rows on purpose.**
2. Authentication → Sign In/Up → enable **anonymous sign-ins**.
3. Authentication → URL Configuration → set **Site URL** to the production URL; add `http://localhost:3000/**` to the redirect allowlist (a separate Supabase project for local dev is cleaner — Site URL is single-valued).
4. Authentication → Emails → configure **custom SMTP** (Resend's free tier works). The built-in sender is limited to ~2 emails/hour **and only delivers to project team members** — without custom SMTP, real users' save/sign-in emails silently fail.
5. Rewrite **three** email templates to the `token_hash` form (the default PKCE `?code=` links only work in the originating browser):
   - *Magic Link* and *Confirm signup*: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/stories`
   - *Confirm email change*: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email_change&next=/stories`
6. Seed: `npm run seed`, then `npm run check-db`. For semantic retrieval: `npm run check-embeddings` → `npm run seed-embeddings` → `npm run check-embeddings`.

### 2. Vercel

Set the environment variables: `PERSISTENCE=supabase`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `IP_HASH_SALT`, `LLM_PROVIDER=real`, `CEREBRAS_API_KEY`, `CEREBRAS_BASE_URL`, `LLM_MODEL_RERANK`, `LLM_MODEL_PROSE`, `EMBEDDING_PROVIDER=gemini`, `GEMINI_API_KEY`, `RETRIEVAL_MODE=keyword`. Production rejects `auto`: the July 2 fifty-figure holdout approved keyword retrieval, while FacetsRAG remains a shadow/eval challenger. Deploy; then walk the live flow once: landing → begin → story → save card → email confirm → `/stories`, and confirm a foreign story URL 404s. Check `cron.job_run_details` in Supabase after the first cron firings.

## Privacy posture (plain words, enforced in code)

- Anonymous by default; no account required to use the product.
- Stories are owned: another person's story URL is a 404, indistinguishable from a missing one.
- Guest accounts and their stories are deleted ~6 hours after last activity (`ANON_USER_TTL_HOURS`); linking an email keeps them.
- The text a user writes is NULL'd from our side 60 days after creation (`FEELING_RETENTION_DAYS`), saved or not.
- Crisis input is detected by a deterministic regex before any LLM call and is never persisted.
- No prompt/response bodies, feelings, raw IPs, or raw errors are ever logged.

## Architecture

- [`CLAUDE.md`](./CLAUDE.md) — working guidance: invariants (anti-echo, recovery-asymmetry, privacy taint), conventions, file layout, current status.
- [`tbd_plan.md`](./tbd_plan.md) — full target architecture (matching pipeline, FacetsRAG, privacy taint model, prompt design).
- [`MVP.md`](./MVP.md) — the Phase 0 plan snapshot (historical; forks described there were cut).
