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
- **Embedder: Gemini `gemini-embedding-001` primary at 1536 dim, Voyage `voyage-4-lite` challenger at 1024 dim.** Both behind `lib/embeddings.ts`. Per-text embeddings — each `shape_sentence` is its own row in `figure_shape_embeddings`, and each of the four facet texts (`emotional_core`, `decision_shape`, `trigger_event`, `agency_state`) is its own row in `figure_facet_embeddings`. Lanes scored independently; per-lane top-N flow into a deduped pool unconditionally (Stage A — quotas honor the recovery-asymmetry rule); dynamic-weighted RRF over the deduped pool selects top-K for rerank (Stage B). Per-lane queries: shape uses raw user feeling; the four facet lanes use *facet query projections* (figure-neutral, anchor-substantiated sentences emitted by the tagger) when validation passes, else fall back to raw user feeling. Theme lane is deterministic (no embedder), uses weighted Jaccard with antiTheme penalty + clamp. Asymmetric retrieval: `task_type=RETRIEVAL_QUERY` (Gemini) / `input_type=query` (Voyage) at match time, `RETRIEVAL_DOCUMENT` / `input_type=document` at seed time. Vectors L2-normalized at write. Free-tier postures are operational; provider swap is one env-var flip. Stub mode (zero vector) remains the default until `EMBEDDING_PROVIDER` is set.
- **Supabase (Postgres + pgvector)** for sessions, the curated figures library, embedding tables, `match_misses` (editorial backlog), and `figure_editorial_warnings` (data-quality feedback). Server-only access via `lib/db.ts` using the service role key. Browser never talks to Supabase directly. RLS enabled, default-deny for anon role.

## Key architectural rules

- **The LLM provider is invisible outside `lib/`.** Anything that imports from `lib/llm-stub.ts` or `lib/llm-real.ts` directly is wrong — go through `lib/llm.ts`. Same rule for embeddings: only `lib/embeddings.ts` exposes the embedder.
- **Supabase access is server-only.** `lib/db.ts` and `lib/figures.ts` both start with `import "server-only"` plus a runtime `typeof window !== "undefined"` throw. The service role key (`SUPABASE_SERVICE_ROLE_KEY`) bypasses RLS and must never reach the browser — no `NEXT_PUBLIC_` prefix, no inclusion in client components.
- **The Supabase client is a singleton on `globalThis`.** Canonical Next.js pattern for surviving dev hot-reload. Don't `createClient()` ad-hoc — import the existing `supabase` from `lib/db.ts`.
- **Anti-echo data discipline (the most important RAG rule).** Each figure has TWO embedded surfaces and ONE rerank surface, deliberately separated:
  - **Embedded** (retrieval only, never shown to rerank LLM): `shape_sentences` in `figure_shape_embeddings`, plus the four facet texts in `figures.facets` (`emotional_core`, `decision_shape`, `trigger_event`, `agency_state`) in `figure_facet_embeddings`.
  - **Rerank-only** (never embedded): `biographical_facts` — hand-curated, primary-source.

  **Never mix them.** Mixing reintroduces the data echo we split the columns to defeat — the LLM would just confirm what cosine already said.

- **FacetsRAG: six lanes (shape + 4 facets + theme), per-lane quotas, max-not-mean within each lane.** Retrieval runs five embedded lanes plus a deterministic theme lane. Each embedded lane uses a typed query — shape gets the raw user feeling; each facet lane gets its *projection* (figure-neutral sentence emitted by the tagger, anchor-substantiated) or falls back to raw feeling if projection validation fails. Stage A: each lane contributes its top-N **post-filter** to a deduped pool unconditionally; quotas live in `lib/match-config.ts`. Stage B: dynamic-weighted RRF over the deduped pool selects top-K for rerank. Within a lane, aggregation is max-not-mean (`max_s sim(q,s) + α·second_max_s sim(q,s)`). Averaging text vectors before storage blurs the distinct anchors that are the entire point of the per-text design. **BM25 is intentionally excluded** — short metaphor-heavy user inputs produce metaphor↔literal token collisions against literal `biographical_facts` that RRF cannot down-weight.

- **Recovery-asymmetry rule (load-bearing for FacetsRAG defaults).** *Retrieval failures are unrecoverable; rerank failures are correctable.* If wrong dynamic weights push the correct figure out of the top-12, rerank never sees it — game over. If a missed boost demotes the correct figure within the top-12, rerank still gets it and recovers. This is why `lib/match-config.ts` ships passive defaults (λ_max=0.15, tight bounds, strict tagger gates). Loosening these constants requires eval evidence; never loosen on intuition.

- **Five facets, no more without eval evidence.** Seeded set: `shape`, `emotional_core`, `decision_shape`, `trigger_event`, `agency_state`. `pressure_source`, `relational_context`, `arc_shape` and others are deferred — adding them requires eval data showing the existing 5 don't catch a class of failures. More facets ≠ better matching; it doubles editorial cost and dilutes per-lane signal.

- **Facet substantiability.** Every facet text must be supported by a passage in the figure's `biographical_facts`. Facets are editorial *interpretations* of source-verified material, not new factual claims — so they need human review, but not separate source verification. If a facet says something `biographical_facts` doesn't establish, either add the fact or rewrite the facet.

- **Dynamic weights stay passive and bounded.** `lib/match-config.ts` blends `BASE_WEIGHTS` with tagger-derived `facetImportance` at λ_max=0.15, gated on `confidence ≥ 0.55` AND `≥ 2 lanes ≥ 0.30 importance` AND every used lane has a verbatim anchor in the user input. Below the gate or on validation failure, return `BASE_WEIGHTS` exactly. Bounded normalization is mandatory — naive `clamp + divide-by-sum` re-violates bounds after the divide; use the iterative-projection helper.

- **Asymmetric encoding is required, not optional.** Documents (shape sentences) are encoded with `task_type=RETRIEVAL_DOCUMENT` (Gemini) / `input_type=document` (Voyage) at seed time. Queries (raw user feeling, expansion text) are encoded with `task_type=RETRIEVAL_QUERY` / `input_type=query` at every match call. The encoders learned different prefixes per role; using the same setting on both sides silently degrades quality.
- **Tagger output never reaches rerank.** `tagAndExpand` produces a `FacetSignal` (`confidence`, `dominantMode`, `facetImportance`, `anchors`, `facetQueries`) — used by `lib/match-config.ts` to bias retrieval lane weights and as the per-lane query text. Neither the FacetSignal, the projection texts, the dynamic weights it produces, theme tags, antiTheme tags, nor any facet labels may be passed into `pickFigure`. Rerank is grounded on raw user feeling + each candidate's `biographicalFacts` + grading scalars only. Allowing any tagger output into rerank propagates stage-1 bias into stage 2 — the same anti-echo argument that motivated the shape/facts split.

- **Facet query projection is not HyDE.** The tagger emits a *figure-neutral, anchor-substantiated* sentence per facet — past tense, no proper names, no four-digit years, no first-person, no diagnosis terms, no concrete invented events, ≤32 words. Projection validation failure on a facet nulls *that lane only* (lane falls back to raw user feeling); it does not abort the FacetSignal. The constraint set is what keeps projection from drifting back into HyDE: a fluent unanchored projection is a fabrication, not a translation.

- **Theme lane is deterministic + capped.** `themeScore = clamp(weightedJaccard(userThemes, figure.themes) − λ · weightedJaccard(userThemes, figure.antiThemes), -0.25, 0.35)`. λ defaults to 1.0; bounds are eval-tunable. `figure.antiThemes` is populated only when an editor encountered a confusion case during seeding or eval surfaced one — never pre-filled from a confusion matrix. AntiThemes never hard-exclude — only score penalty. Hard exclusion violates recovery-asymmetry.
- **Embedding rows live in two tables, same gating discipline.** Shape vectors go in `figure_shape_embeddings`, keyed on `(figure_key, shape_index, model_id)`, `content_hash = sha256(<shape_sentence>)`. Facet vectors go in `figure_facet_embeddings`, keyed on `(figure_key, facet_type, model_id)`, `content_hash = sha256(<facet_text>)`. A row is valid for retrieval only when `model_id` matches the active embedder AND `content_hash` matches the current source text. Stale rows (after embedder swap, dim change, or text edit without re-embed) must NOT enter retrieval. Partial HNSW per `(model_id, dim)` (shape) and per `(model_id, dim, facet_type)` (facets) enforces this at the DB level; `lib/figures.ts` enforces it at the query level. Multiple `model_id` rows can coexist — flip the active model via the `app.embedding_model` Postgres GUC. If you see vectors of unknown provenance in retrieval, something has bypassed both gates and that is a bug.

- **Vectors normalized at write time, `vector_cosine_ops` on the HNSW index.** Gemini truncated below 3072 dim and Voyage's MRL outputs are not guaranteed unit-norm — L2-normalize before insert. Stick with `vector_cosine_ops` (handles non-unit vectors correctly); `vector_ip_ops` is a marginal perf win that's only correct if every row is unit-norm — not worth the foot-gun.
- **Tagger failures are absorbed, not retried.** Invalid JSON, timeout > 3 s, low confidence, or any anchor that isn't a substring of the input → `tagAndExpand` returns `null`. `matching.match()` interprets `null` as "skip expansion, embed raw only." No retry loop. p95 latency must stay bounded even when the tagger is having a bad minute.
- **Cross-model role discipline.** Llama writes prose; GPT-OSS reranks. Don't flip them. Llama's reasoning is weaker for weighing trade-offs; GPT-OSS produces analytical voice for narrative even at low reasoning effort. Each model is doing the job it's good at, *and* the cross-family split breaks Llama-recognizing-its-own-voice during rerank.
- **Cultural-canon bias in matching.** The rerank system prompt biases against figures whose stories are taught in school (Lincoln, Van Gogh, Einstein) when fit is comparable. Cross-model split does not solve this — both models trained on the same Wikipedia. Curation choices (seeding obscure-but-fitting figures) and the system-prompt rule are the actual defense.
- **404 over 500 for unknown sessions/figures.** `lib/db.ts#getSession` and `lib/figures.ts#getByKey` return `null`, not throws. API routes turn `null` into 404. Client renders "story has drifted away" empty state on 404, never a generic error.
- **Decision-beat truthful-history.** Every decision beat has a `realChoice`. When the user picks the non-real option, the next beat opens with contrast wording ("You would have stopped here. They didn't, and this is why…"). Never fabricate alternate history.
- **Server secrets stay on the server.** `figures.toClientOutline()` is the single chokepoint for stripping server-only fields (`text`, `realChoice`, `decisionContinuations`, `biographicalFacts`, `shapeSentences`, `facets`). Embedding tables (`figure_shape_embeddings`, `figure_facet_embeddings`) are never read by client paths. All API responses pass through `toClientOutline`. No bespoke field-stripping in routes.
- **Crisis check is non-bypassable, regex-only, and the strictest privacy path.** `/api/match` runs `classifyCrisis` before any LLM call. Deterministic regex — never an LLM classifier (latency + false-negative risk). On match: return crisis resources, persist nothing (no `sessions` row, no embeddings, no LLM call). Trace shape is exhaustive: `{ crisisDetected: true, crisisRegexVersion, latencyMs }` — no matched-pattern enum, no reason category, no phrase index. False positives are debugged offline against `evals/crisis-regex.yaml` (synthetic inputs, treated as a safety regression set, separate from the match eval). False positives acceptable; false negatives are not.
- **Streaming is real, not faked.** Even the stub yields word-by-word with a delay. UI components that render beats must consume a `ReadableStream`, not await a finished string.
- **`/api/match` is rate-limited per IP.** 5/hour, 30/day. Defends both Groq and (eventual) embedding-provider quotas with one mechanism. Hash-based and semantic input caching were both considered and rejected — duplicates barely happen for free-text emotional disclosures, semantic caching has a bootstrap problem (you'd embed before you could check), and storing user feelings outside the `sessions` table widens the privacy surface for no real win.
- **Privacy taint model — load-bearing alongside anti-echo and recovery-asymmetry.** *User-derived natural language and embeddings are sensitive until explicitly reduced into non-semantic telemetry.* Six closed sensitivity classes; provenance determines class, not surface type:
  - `SensitiveRaw` — user feeling.
  - `SensitiveDerivedText` — anchors, projection texts, expansion text, prompt bodies, tagger raw JSON, reranker `resonance`/`gap`, generated bridge prose.
  - `SensitiveDerivedTags` — user theme tags, antiTheme triggers, `dominantMode`, `facetImportance`, crisis reason codes (an enum value classifying user input is sensitive even though the vocabulary is public).
  - `SensitiveDerivedVector` — query embeddings (figure embeddings are *not* sensitive — different provenance, same shape).
  - `SafeOperational` — `matchConfigVersion`, model ids, provider name, latency, counts, booleans, score buckets.
  - `SafeIdentifier` — `sessionId`, `figureKey`, model id.

  Sensitive values reach the production trace surface *only* through reduction (e.g., projection object → `{ generated: bool, anchorCount: int }`). The trace writer is string-hostile — it accepts `SafeOperational` / `SafeIdentifier` / number / bool / null only, never arbitrary strings. Boundary discipline is enforced by *opaque wrappers* with named greppable unwraps (`unwrapForLLM`, `unwrapForEmbedder`, `unwrapForDB`, `unwrapForCrisisRegex`, `unwrapForVectorSearch`, `unwrapForReplayWithFlag`) — not by branded primitive types, which silently widen.

- **Categorical no-prompt-logging — even on errors.** No path may emit provider request/response bodies, raw tagger JSON (especially on parse failure), LLM prompts, raw exception objects, ranked candidate arrays beyond `chosenFigureKey`, specific user-tag enum values, raw scores, or reranker `resonance`/`gap` text to the production trace. Provider-call wrappers convert thrown errors to `{ provider, route, errorClass, latencyMs }` *before* they propagate — the original error (with body, parameters, stack) is discarded inside the wrapper. No hosted error services (Sentry/Datadog/etc.) at v1 — they capture request bodies by default.

- **Retention is half the privacy story.** `sessions.feeling` and `match_misses.feeling` are NULL'd 60 days after creation by a scheduled Postgres job; structural fields preserved. `logs/match-traces.jsonl` and `logs/replay-audit.jsonl` rotate 90 days locally, gitignored, never copied off the dev machine. TTL values live in `match-config.ts`, version-stamped.

- **Recipe pinning + auditable replay.** `sessions.match_recipe JSONB` freezes the active versions at session creation (matchConfigVersion, embeddingModelId, taggerModelId, rerankModelId, projectionSchemaVersion, expansionEnabled, rerankTopK, crisisRegexVersion). To debug a match, run `npx tsx scripts/replay-match.ts <sessionId>`; full sensitive trace requires `--include-sensitive-local-trace`; every invocation appends a row to `logs/replay-audit.jsonl`. This is the *only* path that touches user disclosure outside the live match. Production traces deliberately can't surface it.
- **`framing` is the only confidence signal that crosses the wire.** `pick.confidence` and `pick.resonance`/`pick.gap` stay server-side. The client only sees `framing: "definitive" | "partial"`, which the story page uses to choose opening copy. Low-confidence matches presented as definitive mirrors corrode trust faster than honest "fragment that rhymes" framing.
- **Eval set is the regression net.** Before merging any change to `lib/llm.ts`, `lib/embeddings.ts`, `lib/matching.ts`, `lib/match-config.ts`, `lib/themes.ts`, `scripts/research-figure.ts`, or any prompt template, run `npx tsx scripts/eval-match.ts`. The metrics — top-1 accuracy, top-5/10 retrieval recall, MRR, near-miss confusion rate, miss-detection rate, confidence-calibration spread, latency p50/p95 — are the only honest way to know whether a "tightening" actually tightened. FacetsRAG-positive results require top-1 improving AND near-miss confusion rate dropping on modeled-facet hard negatives. The expansion-vs-projection ablation (configs A/B/C — see `tbd_plan.md`) is decided by eval, not intuition; `expansionEnabled` flips are config-version bumps.

- **Privacy regressions are CI-tested, not convention-enforced.** `lib/trace.test.ts` asserts the production-trace schema *throws or fails type-check* when given `feeling`, anchor texts, projection text, expansion text, raw LLM prompt/response bodies, ranked figure-key arrays, raw enum tags from user classification, or raw vectors. Schema-level testing catches regressions across all log call sites with one test surface — testing the logger function in isolation only catches one path.

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
  types.ts                    # BeatBlueprint, FigureRow, Session, MatchResponse, FacetSignal, FacetQuery
  llm.ts                      # LLM interface (tagAndExpand, pickFigure, streamBeat) + provider switch
  llm-stub.ts                 # keyword-routing implementation (default)
  llm-real.ts                 # Llama 3.3 70B + GPT-OSS 120B + Llama 3.1 8B via Groq
  embeddings.ts               # Embedder interface (modelId, dim, embedDocuments, embedQuery) + provider switch
  embeddings-stub.ts          # modelId="stub@v0", returns zero vector → matching skips vector branch
  embeddings-real.ts          # Gemini gemini-embedding-001@1536 (primary) + Voyage voyage-4-lite@1024 (challenger)
  matching.ts                 # retrieval: filter → tag/project → 6 lanes with quotas → dynamic-weighted RRF → rerank → framing
  match-config.ts             # BASE_WEIGHTS, WEIGHT_BOUNDS, λ, lane quotas, theme λ + clamp, projection schema version, expansionEnabled, rerank top-K, retention TTLs, matchConfigVersion
  match-config.test.ts        # invariant + determinism tests for the weighter and bounded-normalization helper
  rrf.ts                      # reciprocal rank fusion, k=60 default; dynamic-weighted variant for Stage B
  themes.ts                   # controlled vocabulary of emotional themes (positive + antiTheme name space)
  sensitive.ts                # privacy taint model: SensitiveRaw / SensitiveDerivedText / SensitiveDerivedTags / SensitiveDerivedVector wrappers with named unwrap exits
  trace.ts                    # string-hostile production-trace schema + reduction helpers; writeProdTrace is the only path; no console.* outside tests
  trace.test.ts               # privacy regression tests: schema rejects feeling, anchors, projection text, raw enum tags, raw vectors, prompt/response bodies, raw exception objects
  db.ts                       # sessions (+ match_recipe) + match_misses + figure_editorial_warnings (server-only)
  figures.ts                  # listByAge, getByKey, vectorSearch, facetSearch, themeSearch, toClientOutline
  safety.ts                   # crisis regex check; never persists; emits only { crisisDetected, crisisRegexVersion, latencyMs }
scripts/
  research-figure.ts          # Llama drafts a candidate FigureRow JSON
  check-figure.ts             # structural + style validation
  seed-figure.ts              # validates, embeds, inserts with version metadata
  reembed.ts                  # refresh embeddings after provider swap or content edits
  eval-match.ts               # run evals/match.yaml through matching.match(), report metrics across the three expansion configs
  eval-crisis.ts              # run evals/crisis-regex.yaml through safety.classifyCrisis; safety regression — false-negatives fail
  replay-match.ts             # auditable replay: SELECT feeling FROM sessions, reconstruct via match_recipe; --include-sensitive-local-trace gates writes
  drafts/                     # gitignored editorial workspace
evals/
  match.yaml                  # 30-50 hand-graded gold pairs, incl. 5-10 deliberate misses; FacetsRAG hard negatives labeled by what they measure
  crisis-regex.yaml           # synthetic crisis inputs; safety regression set, separate from match eval
  runs/                       # JSON dumps of past eval runs, for diffing
logs/
  match-traces.jsonl          # dev-only full traces; written ONLY under replay-match.ts --include-sensitive-local-trace; gitignored, 90-day local rotation
  replay-audit.jsonl          # append-only audit: one row per replay invocation; gitignored
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

- **`figures`** — the curated library. The anti-echo split lives here: `shape_sentences[]` and `facets` (4 typed sentences) are the embedded surfaces; `biographical_facts` is the rerank-only surface. `themes[]` and `antiThemes[]` (optional, demand-driven) drive the deterministic theme lane. `beats jsonb` holds the canonical 9-beat blueprint, `decision_continuations jsonb` holds per-option continuations. **Hand-graded scalars** (`narrative_dynamism`, `canon_exposure`) belt-and-suspender the prompt-only rerank rules. `status in ('draft','published')` gates serving. Embeddings live in the two embedding tables, not on this row.
- **`figure_shape_embeddings`** — per-sentence vectors. One row per `(figure_key, shape_index, model_id)`. Untyped `vector` column allows mixed dims (Gemini 1536, Voyage 1024) to coexist; partial HNSW per `(model_id, dim)` keeps stale rows invisible. Columns: `figure_key`, `shape_index`, `model_id`, `dimension`, `input_type`, `content_hash` (sha256 of the single sentence), `embedding`, `created_at`.
- **`figure_facet_embeddings`** — per-facet vectors. One row per `(figure_key, facet_type, model_id)`. Same mixed-dim coexistence pattern; partial HNSW per `(model_id, dim, facet_type)` is the triple gate. `facet_type` constrained to `emotional_core | decision_shape | trigger_event | agency_state`. Columns mirror shape embeddings, plus `facet_text` (the editorial micro-document, substantiable from `biographical_facts`).
- **`figure_editorial_warnings`** — runtime data-quality feedback. Decoupled from `figures` so the matcher never writes to the read path under hot traffic. Deduplicated via unique `(figure_key, warning_type, active_model_id)` + atomic on-conflict upsert (no app-level read-modify-write). Editorial workflow: `SELECT * FROM figure_editorial_warnings WHERE resolved_at IS NULL`.
- **`sessions`** — one row per user story session. FK to `figures(key)`. `feeling text` (NULL'd 60 days after `created_at` by a scheduled retention job — disclosure dropped, structural fields preserved). **`match_recipe jsonb`** — frozen at session creation: `{ matchConfigVersion, embeddingModelId, taggerModelId, rerankModelId, projectionSchemaVersion, expansionEnabled, rerankTopK, crisisRegexVersion }`. Required for replay to faithfully reconstruct the original matcher; without it, every config bump silently invalidates prior sessions for replay.
- **`match_misses`** — anonymous log of unmet matches. Editorial backlog driving which figure to write next. `feeling` follows the same 60-day NULL retention as `sessions.feeling`.

Active embedding model is selected per-session via `app.embedding_model` Postgres GUC at query time. Beat content **lives in the database**, not in code. Retention TTLs themselves live in `lib/match-config.ts` (version-stamped via `matchConfigVersion`), not as magic numbers in the cron job.

## Editorial workflow

Adding a figure is a three-step loop:
1. `npx tsx scripts/research-figure.ts <key> <age> <theme>` — Llama drafts a `FigureRow` JSON to `scripts/drafts/`, including the four facet sentences alongside `shape_sentences` and `biographical_facts`.
2. Human polishes (≈8–10 min): verify dates/quotes against primary sources; redline analytical prose; verify each facet is substantiable from `biographical_facts` (no separate source verification — facets are interpretations of already-verified material).
3. `npx tsx scripts/seed-figure.ts <draft-path>` — validates, embeds *each* shape sentence and each facet individually with `task_type=RETRIEVAL_DOCUMENT` (Gemini) or `input_type=document` (Voyage), L2-normalizes the result, inserts rows into `figure_shape_embeddings` and `figure_facet_embeddings`. The coverage gate blocks publish if any of the 5 expected lanes is missing. Sets `figures.status='draft'`. Promote to `published` from Supabase dashboard once eyeballed in the running app.

Read `match_misses` periodically to drive what gets written next. Demand-driven curation, not guess-driven.

## When in doubt

- See `tbd_plan.md` for full architecture: matching pipeline, FacetsRAG, facet query projection, theme/antiTheme lane, privacy taint model, prompt design.
- Three structural invariants govern everything: *anti-echo* (shape and facet text never reach rerank), *recovery-asymmetry* (retrieval failures unrecoverable, rerank failures correctable), *privacy taint* (user-derived natural language and embeddings are sensitive until reduced to non-semantic telemetry). Loosening any of them requires eval evidence, not intuition.
- Quality of the figures library *is* the v1 product. A figure entry is an editorial artifact — treat it with the care of an essay you'd publish under your name.
- The embedder is provider-pluggable. Default is Gemini `gemini-embedding-001@2026-Q2-d1536`; Voyage `voyage-4-lite@2026-Q2-d1024` is the configured challenger. Don't bake provider-specific assumptions outside `lib/embeddings-real.ts`. Treat the free-tier quota as operational, not architectural — if Gemini's free tier ever caps you, swap `EMBEDDING_PROVIDER=voyage` (or pay) without touching any other code.
