# CLAUDE.md

Guidance for Claude Code working in this repo.

## What this is

`Onward` — an emotional-companion web app. A user enters their age and a short description of what they're going through. The app finds a real historical figure who, at the same age, faced a genuinely similar emotional situation, and walks the user through that figure's story as a 9-beat interactive narrative. At 2–3 real fork-points in the figure's life, the user picks an option and helps "author" the story; truthful history governs the continuation.

The product is for hurting people. Tone, pacing, and prose quality matter more than features.

**Repo state:** greenfield. The only committed artifacts are this file and `tbd_plan.md` (the design doc — high-level architecture and assumptions, no step-by-step build plan). Everything below describes the *target* design that should govern code as it lands. Treat file paths, table names, and interface shapes as the planned shape, not as code you can read today.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS, Framer Motion
- **Dual-model LLM on Groq.** Llama 3.3 70B for narrative prose; GPT-OSS 120B (`reasoning_effort: low`) for match reranking. Both behind `lib/llm.ts` via OpenAI-compatible SDK. Stub mode (keyword routing on DB rows) is the default until `LLM_PROVIDER=real` flips on.
- **Embedder: Gemini `gemini-embedding-001` primary at 1536 dim, Voyage `voyage-4-lite` challenger at 1024 dim.** Both behind `lib/embeddings.ts`. Per-text embeddings — each `shape_sentence` is its own row in `figure_shape_embeddings`, and each of the four facet texts (`emotional_core`, `decision_shape`, `trigger_event`, `agency_state`) is its own row in `figure_facet_embeddings`. Lanes scored independently; figure-level scores aggregate via the FacetsRAG weighting in `lib/match-config.ts`. Asymmetric retrieval: `task_type=RETRIEVAL_QUERY` (Gemini) / `input_type=query` (Voyage) at match time, `RETRIEVAL_DOCUMENT` / `input_type=document` at seed time. Vectors L2-normalized at write time (Gemini truncated below 3072 returns un-normalized; Voyage MRL likewise). Free-tier postures are operational, not architectural — production may need a paid key; fallback is one env-var flip with no code or schema change. Stub mode (zero vector) remains the default until `EMBEDDING_PROVIDER` is set.
- **Supabase (Postgres + pgvector)** for sessions, the curated figures library, embedding tables, `match_misses` (editorial backlog), and `figure_editorial_warnings` (data-quality feedback). Server-only access via `lib/db.ts` using the service role key. Browser never talks to Supabase directly. RLS enabled, default-deny for anon role.

## Key architectural rules

- **The LLM provider is invisible outside `lib/`.** Anything that imports from `lib/llm-stub.ts` or `lib/llm-real.ts` directly is wrong — go through `lib/llm.ts`. Same rule for embeddings: only `lib/embeddings.ts` exposes the embedder.
- **Supabase access is server-only.** `lib/db.ts` and `lib/figures.ts` both start with `import "server-only"` plus a runtime `typeof window !== "undefined"` throw. The service role key (`SUPABASE_SERVICE_ROLE_KEY`) bypasses RLS and must never reach the browser — no `NEXT_PUBLIC_` prefix, no inclusion in client components.
- **The Supabase client is a singleton on `globalThis`.** Canonical Next.js pattern for surviving dev hot-reload. Don't `createClient()` ad-hoc — import the existing `supabase` from `lib/db.ts`.
- **Anti-echo data discipline (the most important RAG rule).** Each figure has TWO embedded surfaces and ONE rerank surface, deliberately separated:
  - **Embedded** (retrieval only, never shown to rerank LLM): `shape_sentences` in `figure_shape_embeddings`, plus the four facet texts in `figures.facets` (`emotional_core`, `decision_shape`, `trigger_event`, `agency_state`) in `figure_facet_embeddings`.
  - **Rerank-only** (never embedded): `biographical_facts` — hand-curated, primary-source.

  **Never mix them.** Mixing reintroduces the data echo we split the columns to defeat — the LLM would just confirm what cosine already said.

- **FacetsRAG: five lanes, max-not-mean, never average before storing.** Retrieval runs five independent lanes (shape + 4 facets), each backed by per-text embedding rows. Vector search returns text-level hits; figures rank by `denseScore(figure) = Σ_lane weight_lane · max_score_in_lane`. The `shape` lane keeps its own internal rule: `max_s sim(q,s) + α·second_max_s sim(q,s)` across that figure's sentences. Weights, bounds, and λ live in `lib/match-config.ts` — tune on the eval set, not by guessing. Averaging text vectors before storage blurs the distinct anchors that are the entire point of the per-text design.

- **Recovery-asymmetry rule (load-bearing for FacetsRAG defaults).** *Retrieval failures are unrecoverable; rerank failures are correctable.* If wrong dynamic weights push the correct figure out of the top-12, rerank never sees it — game over. If a missed boost demotes the correct figure within the top-12, rerank still gets it and recovers. This is why `lib/match-config.ts` ships passive defaults (λ_max=0.15, tight bounds, strict tagger gates). Loosening these constants requires eval evidence; never loosen on intuition.

- **Five facets, no more without eval evidence.** Seeded set: `shape`, `emotional_core`, `decision_shape`, `trigger_event`, `agency_state`. `pressure_source`, `relational_context`, `arc_shape` and others are deferred — adding them requires eval data showing the existing 5 don't catch a class of failures. More facets ≠ better matching; it doubles editorial cost and dilutes per-lane signal.

- **Facet substantiability.** Every facet text must be supported by a passage in the figure's `biographical_facts`. Facets are editorial *interpretations* of source-verified material, not new factual claims — so they need human review, but not separate source verification. If a facet says something `biographical_facts` doesn't establish, either add the fact or rewrite the facet.

- **Dynamic weights stay passive and bounded.** `lib/match-config.ts` blends `BASE_WEIGHTS` with tagger-derived `facetImportance` at λ_max=0.15, gated on `confidence ≥ 0.55` AND `≥ 2 lanes ≥ 0.30 importance` AND every used lane has a verbatim anchor in the user input. Below the gate or on validation failure, return `BASE_WEIGHTS` exactly. Bounded normalization is mandatory — naive `clamp + divide-by-sum` re-violates bounds after the divide; use the iterative-projection helper.

- **Asymmetric encoding is required, not optional.** Documents (shape sentences) are encoded with `task_type=RETRIEVAL_DOCUMENT` (Gemini) / `input_type=document` (Voyage) at seed time. Queries (raw user feeling, expansion text) are encoded with `task_type=RETRIEVAL_QUERY` / `input_type=query` at every match call. The encoders learned different prefixes per role; using the same setting on both sides silently degrades quality.
- **Tagger output never reaches rerank.** `tagAndExpand` produces a `FacetSignal` (`confidence`, `dominantMode`, `facetImportance`, `anchors`) — used by `lib/match-config.ts` to bias retrieval lane weights. Neither the FacetSignal, the dynamic weights it produces, nor any facet labels may be passed into `pickFigure`. Rerank is grounded on the raw user feeling + each candidate's `biographicalFacts` only. Allowing tagger output into rerank just propagates stage-1 bias into stage 2 — the same anti-echo argument that motivated the shape/facts split.
- **Embedding rows live in two tables, same gating discipline.** Shape vectors go in `figure_shape_embeddings`, keyed on `(figure_key, shape_index, model_id)`, `content_hash = sha256(<shape_sentence>)`. Facet vectors go in `figure_facet_embeddings`, keyed on `(figure_key, facet_type, model_id)`, `content_hash = sha256(<facet_text>)`. A row is valid for retrieval only when `model_id` matches the active embedder AND `content_hash` matches the current source text. Stale rows (after embedder swap, dim change, or text edit without re-embed) must NOT enter retrieval. Partial HNSW per `(model_id, dim)` (shape) and per `(model_id, dim, facet_type)` (facets) enforces this at the DB level; `lib/figures.ts` enforces it at the query level. Multiple `model_id` rows can coexist — flip the active model via the `app.embedding_model` Postgres GUC. If you see vectors of unknown provenance in retrieval, something has bypassed both gates and that is a bug.

- **Vectors normalized at write time, `vector_cosine_ops` on the HNSW index.** Gemini truncated below 3072 dim and Voyage's MRL outputs are not guaranteed unit-norm — L2-normalize before insert. Stick with `vector_cosine_ops` (handles non-unit vectors correctly); `vector_ip_ops` is a marginal perf win that's only correct if every row is unit-norm — not worth the foot-gun.
- **Tagger failures are absorbed, not retried.** Invalid JSON, timeout > 3 s, low confidence, or any anchor that isn't a substring of the input → `tagAndExpand` returns `null`. `matching.match()` interprets `null` as "skip expansion, embed raw only." No retry loop. p95 latency must stay bounded even when the tagger is having a bad minute.
- **Cross-model role discipline.** Llama writes prose; GPT-OSS reranks. Don't flip them. Llama's reasoning is weaker for weighing trade-offs; GPT-OSS produces analytical voice for narrative even at low reasoning effort. Each model is doing the job it's good at, *and* the cross-family split breaks Llama-recognizing-its-own-voice during rerank.
- **Cultural-canon bias in matching.** The rerank system prompt biases against figures whose stories are taught in school (Lincoln, Van Gogh, Einstein) when fit is comparable. Cross-model split does not solve this — both models trained on the same Wikipedia. Curation choices (seeding obscure-but-fitting figures) and the system-prompt rule are the actual defense.
- **404 over 500 for unknown sessions/figures.** `lib/db.ts#getSession` and `lib/figures.ts#getByKey` return `null`, not throws. API routes turn `null` into 404. Client renders "story has drifted away" empty state on 404, never a generic error.
- **Decision-beat truthful-history.** Every decision beat has a `realChoice`. When the user picks the non-real option, the next beat opens with contrast wording ("You would have stopped here. They didn't, and this is why…"). Never fabricate alternate history.
- **Server secrets stay on the server.** `figures.toClientOutline()` is the single chokepoint for stripping server-only fields (`text`, `realChoice`, `decisionContinuations`, `biographicalFacts`, `shapeSentences`, `facets`). Embedding tables (`figure_shape_embeddings`, `figure_facet_embeddings`) are never read by client paths. All API responses pass through `toClientOutline`. No bespoke field-stripping in routes.
- **Crisis check is non-bypassable, regex-only.** `/api/match` runs `classifyCrisis` before any LLM call. Deterministic regex — never an LLM classifier (latency + false-negative risk). If crisis, return `{ crisis: true, reasons }`, persist nothing.
- **Streaming is real, not faked.** Even the stub yields word-by-word with a delay. UI components that render beats must consume a `ReadableStream`, not await a finished string.
- **`/api/match` is rate-limited per IP.** 5/hour, 30/day. Defends both Groq and (eventual) embedding-provider quotas with one mechanism. Hash-based and semantic input caching were both considered and rejected — duplicates barely happen for free-text emotional disclosures, semantic caching has a bootstrap problem (you'd embed before you could check), and storing user feelings outside the `sessions` table widens the privacy surface for no real win.
- **Raw user feelings live in the database only.** `sessions.feeling` and `match_misses.feeling` are the only places raw text persists. Logs (production or dev) must carry only structural fields: `sessionId`, `figureKey`, `framing`, `confidence`, `latencyMs`, `taggerOk`. Dev mode may write full traces to `./logs/match-traces.jsonl` (gitignored, never shipped to hosted log providers). If you need to debug a real production match, pull the row from Supabase directly — that's the auditable path.
- **`framing` is the only confidence signal that crosses the wire.** `pick.confidence` and `pick.resonance`/`pick.gap` stay server-side. The client only sees `framing: "definitive" | "partial"`, which the story page uses to choose opening copy. Low-confidence matches presented as definitive mirrors corrode trust faster than honest "fragment that rhymes" framing.
- **Eval set is the regression net.** Before merging any change to `lib/llm.ts`, `lib/embeddings.ts`, `lib/matching.ts`, `lib/match-config.ts`, `lib/themes.ts`, `scripts/research-figure.ts`, or any prompt template, run `npx tsx scripts/eval-match.ts`. The metrics — top-1 accuracy, top-5/10 retrieval recall, MRR, near-miss confusion rate, miss-detection rate, confidence-calibration spread, latency p50/p95 — are the only honest way to know whether a "tightening" actually tightened. FacetsRAG-positive results require top-1 improving AND near-miss confusion rate dropping on modeled-facet hard negatives.

## Canonical 9-beat arc

1. Scene · 2. Dark moment · 3. **First fork (decision)** · 4. What they actually did · 5. Struggle · 6. **Second fork (decision)** · 7. Turning point · 8. What they became · 9. **Bridge to you** (second-person, references the user's intake words).

Every figure row has exactly 9 beats. The bridge beat is the only beat where the LLM generates new prose freely (beats 1–8 use deterministic content from `figure.beats`, polished by Llama as it streams).

## File layout

```
app/
  page.tsx                    # intake form
  story/[sessionId]/page.tsx  # story player state machine
  api/match/route.ts          # rate-limit + safety + matching.match() + persist
  api/beat/route.ts           # SSE stream of next narrative beat
  api/choose/route.ts         # record choice, SSE stream next beat
lib/
  types.ts                    # BeatBlueprint, FigureRow, Session, MatchResponse
  llm.ts                      # LLM interface (tagAndExpand, pickFigure, streamBeat) + provider switch
  llm-stub.ts                 # keyword-routing implementation (default)
  llm-real.ts                 # Llama 3.3 70B + GPT-OSS 120B + Llama 3.1 8B via Groq
  embeddings.ts               # Embedder interface (modelId, dim, embedDocuments, embedQuery) + provider switch
  embeddings-stub.ts          # modelId="stub@v0", returns zero vector → matching skips vector branch
  embeddings-real.ts          # Gemini gemini-embedding-001@1536 (primary) + Voyage voyage-4-lite@1024 (challenger)
  matching.ts                 # hybrid retrieval: filter → tag → 5 lanes (shape + 4 facets) + BM25 → RRF → rerank → framing
  match-config.ts             # FacetsRAG: BASE_WEIGHTS, WEIGHT_BOUNDS, λ formula, bounded normalization, matchConfigVersion
  match-config.test.ts        # invariant + determinism tests for the weighter
  rrf.ts                      # reciprocal rank fusion, k=60 default
  themes.ts                   # controlled vocabulary of emotional themes
  db.ts                       # sessions + match_misses + figure_editorial_warnings (server-only)
  figures.ts                  # listByAge, getByKey, vectorSearch, facetSearch, toClientOutline
  safety.ts                   # crisis regex check
scripts/
  research-figure.ts          # Llama drafts a candidate FigureRow JSON
  check-figure.ts             # structural + style validation
  seed-figure.ts              # validates, embeds, inserts with version metadata
  reembed.ts                  # refresh embeddings after provider swap or content edits
  eval-match.ts               # run evals/match.yaml through matching.match(), report 4 metrics
  drafts/                     # gitignored editorial workspace
evals/
  match.yaml                  # 30-50 hand-graded gold pairs, incl. 5-10 deliberate misses
  runs/                       # JSON dumps of past eval runs, for diffing
logs/
  match-traces.jsonl          # dev-only full traces (gitignored)
components/
  IntakeForm.tsx
  StoryBeat.tsx
  DecisionCards.tsx
  CrisisCard.tsx
```

## Visual conventions

- Background `#FAF7F2`, text `#1F1B16`, accent `#9C6B3F`.
- Body: Source Serif 4. UI: Inter. Max content width 36rem. Line-height 1.7.
- No shadows, no gradients, no emojis, no avatars, no chat affordances. It should feel like a small printed book.
- Beats fade in. Decision options are softly bordered cards; unchosen ones fade out after pick.

## Common commands

(Once Next.js scaffolding lands.)

```powershell
npm run dev          # http://localhost:3000
npm run build
npm run lint
```

## Environment

```
LLM_PROVIDER=stub | real          # default stub
EMBEDDING_PROVIDER=stub | gemini | voyage   # default stub
EMBEDDING_MODEL_ID=gemini-embedding-001@2026-Q2-d1536    # canonical id; written into figure_shape_embeddings rows; routes the active partial HNSW index

NEXT_PUBLIC_SUPABASE_URL          # public, fine in browser (browser shouldn't query Supabase anyway)
SUPABASE_SERVICE_ROLE_KEY         # SECRET, server-only. Bypasses RLS. Treat like an SSH key.

GROQ_API_KEY                      # for LLM_PROVIDER=real
LLM_MODEL_PROSE=llama-3.3-70b-versatile
LLM_MODEL_RERANK=openai/gpt-oss-120b
LLM_MODEL_TAGGER=llama-3.1-8b-instant   # tagAndExpand role; small model is correct here

GEMINI_API_KEY                    # for EMBEDDING_PROVIDER=gemini (primary)
VOYAGE_API_KEY                    # for EMBEDDING_PROVIDER=voyage (eval challenger)
```

## Database

Six tables in Supabase (target schema; design rationale in `tbd_plan.md`):

- **`figures`** — the curated library. The anti-echo split lives here: `shape_sentences[]` and `facets` (4 typed sentences) are the embedded surfaces; `biographical_facts` is the rerank-only surface. `beats jsonb` holds the canonical 9-beat blueprint, `decision_continuations jsonb` holds per-option continuations. **Hand-graded scalars** (`narrative_dynamism`, `canon_exposure`) belt-and-suspender the prompt-only rerank rules. `status in ('draft','published')` gates serving. Embeddings live in the two embedding tables, not on this row.
- **`figure_shape_embeddings`** — per-sentence vectors. One row per `(figure_key, shape_index, model_id)`. Untyped `vector` column allows mixed dims (Gemini 1536, Voyage 1024) to coexist; partial HNSW per `(model_id, dim)` keeps stale rows invisible. Columns: `figure_key`, `shape_index`, `model_id`, `dimension`, `input_type`, `content_hash` (sha256 of the single sentence), `embedding`, `created_at`.
- **`figure_facet_embeddings`** — per-facet vectors. One row per `(figure_key, facet_type, model_id)`. Same mixed-dim coexistence pattern; partial HNSW per `(model_id, dim, facet_type)` is the triple gate. `facet_type` constrained to `emotional_core | decision_shape | trigger_event | agency_state`. Columns mirror shape embeddings, plus `facet_text` (the editorial micro-document, substantiable from `biographical_facts`).
- **`figure_editorial_warnings`** — runtime data-quality feedback. Decoupled from `figures` so the matcher never writes to the read path under hot traffic. Deduplicated via unique `(figure_key, warning_type, active_model_id)` + atomic on-conflict upsert (no app-level read-modify-write). Editorial workflow: `SELECT * FROM figure_editorial_warnings WHERE resolved_at IS NULL`.
- **`sessions`** — one row per user story session. FK to `figures(key)`.
- **`match_misses`** — anonymous log of unmet matches. Editorial backlog driving which figure to write next.

Active embedding model is selected per-session via `app.embedding_model` Postgres GUC at query time. Beat content **lives in the database**, not in code.

## Editorial workflow

Adding a figure is a three-step loop:
1. `npx tsx scripts/research-figure.ts <key> <age> <theme>` — Llama drafts a `FigureRow` JSON to `scripts/drafts/`, including the four facet sentences alongside `shape_sentences` and `biographical_facts`.
2. Human polishes (≈8–10 min): verify dates/quotes against primary sources; redline analytical prose; verify each facet is substantiable from `biographical_facts` (no separate source verification — facets are interpretations of already-verified material).
3. `npx tsx scripts/seed-figure.ts <draft-path>` — validates, embeds *each* shape sentence and each facet individually with `task_type=RETRIEVAL_DOCUMENT` (Gemini) or `input_type=document` (Voyage), L2-normalizes the result, inserts rows into `figure_shape_embeddings` and `figure_facet_embeddings`. The coverage gate blocks publish if any of the 5 expected lanes is missing. Sets `figures.status='draft'`. Promote to `published` from Supabase dashboard once eyeballed in the running app.

Read `match_misses` periodically to drive what gets written next. Demand-driven curation, not guess-driven.

## When in doubt

- See `tbd_plan.md` for full architecture, role-by-role prompt design, and the step-by-step build plan.
- Quality of the figures library *is* the v1 product. A figure entry is an editorial artifact — treat it with the care of an essay you'd publish under your name.
- The embedder is provider-pluggable. Default is Gemini `gemini-embedding-001@2026-Q2-d1536`; Voyage `voyage-4-lite@2026-Q2-d1024` is the configured challenger. Don't bake provider-specific assumptions outside `lib/embeddings-real.ts`. Treat the free-tier quota as operational, not architectural — if Gemini's free tier ever caps you, swap `EMBEDDING_PROVIDER=voyage` (or pay) without touching any other code.
