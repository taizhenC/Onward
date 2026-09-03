# Plan: Onward — an emotional-companion app

> **Design record, May 2026.** This is the plan Onward was first built from, kept for the reasoning behind the invariants (anti-echo, recovery-asymmetry, the privacy taint model). It predates the fork cut, the immutable recipe registry, and the StorySpec pipeline. `CLAUDE.md` and the README describe what shipped; `2026-07-target-architecture.md` beside this file is the later design pass.

## Context

The user wants an AI web app for people who are feeling down. A user enters their age and a short description of what they're going through. The app finds a real historical figure who, at a similar age, lived through a genuinely similar *emotional episode*, and tells that episode of the figure's life as a warm narrative — from the dark moment, through the struggle, to the turning point, to who they became out of it — ending with a personal bridge back to the user.

The user added a key feature: **author mode**. After the figure is matched, the user is walked through that episode as a series of beats. Most beats are narrated. At 1 or 2 real fork-points in the figure's life, the user is shown 2–3 choices and picks one — making them feel like they are leading the story rather than reading it. The point is momentum: someone hurting should feel like they have agency, even inside someone else's life.

The product purpose is heart-healing, so the frontend has to feel calm, dignified, and beautiful — not like a chatbot.

The repository was empty when this plan was written. Nothing to reuse — building from scratch.

## Architecture

### Stack

- **Next.js 15 (App Router) + TypeScript** — single app, server routes co-located with the UI.
- **Tailwind CSS + shadcn/ui** — clean primitives, easy to theme warm and quiet.
- **Framer Motion** — gentle fades and beat transitions; nothing flashy.
- **LLM layer — dual-model on Groq.** Two free models behind one interface, each chosen for what it's good at:
  - **Llama 3.3 70B** for _narrative prose_ — shape-sentence drafting (curation), beat streaming (runtime), bridge beat (runtime). Llama writes warmer, more sensory, less analytical.
  - **GPT-OSS 120B** (`reasoning_effort: low`) for _match reranking_ (runtime). Reasoning model earns its keep when weighing competing factors (emotion vs. age vs. subtext).
  - Both via Groq's free tier, OpenAI-compatible SDK. Stub mode (keyword routing on DB rows) remains the default until `LLM_PROVIDER=real` is set.
- **Embedding layer — Gemini primary + Voyage challenger, per-sentence.** Two providers behind one interface, picked for free-tier quality + asymmetric retrieval support:
  - **Primary:** Gemini `gemini-embedding-001` at 1536 dim (Matryoshka-truncated from 3072, manually L2-normalized after truncation). Leads English MTEB; free tier on Google AI Studio is generous enough to be effectively production-free at this app's volume. `task_type=RETRIEVAL_QUERY` for the user feeling, `task_type=RETRIEVAL_DOCUMENT` for the shape sentences.
  - **Challenger:** Voyage `voyage-4-lite` at 1024 dim (native MRL preset). 200M free tokens per account covers the project's lifetime. `input_type=query` / `input_type=document`.
  - **Per-sentence embeddings.** Each `shape_sentence` is its own row in `figure_shape_embeddings`. **Never average** — averaging blurs the distinct sensory anchors that justify the shape-sentence field's existence.
  - **Mixed-dim coexistence.** Single `figure_shape_embeddings` table with an untyped `vector` column; partial HNSW indexes per `(model_id, dim)` route queries to the active embedder, with rollback to inactive embedders preserved. Active model is selected via the `app.embedding_model` Postgres GUC. **Free-tier posture is operational, not architectural** — capping is one env-var flip away from a paid key or the challenger.
  - Stub mode (zero vector, `modelId="stub@v0"`) remains the default until `EMBEDDING_PROVIDER` is set; when stubbed, matching skips vector retrieval and runs filter → rerank only.
- **Database: Supabase (Postgres + pgvector)** — stores sessions, choices, the curated library (`figures` for thin identity, `figure_stages` for the actual retrievable unit — see *Stage-based chunking* below), embedding tables, and unmet-match logs. Browser never talks to Supabase directly; all reads/writes go through Next.js API routes using the **service role key**. RLS on, default-deny for the anon role. pgvector extension for semantic stage retrieval at v2 scale.

### High-level flow

```
┌─ Intake (age + feeling) ──────────────────────────────────┐
│                                                            │
│  POST /api/match                                           │
│    1. Rate-limit by IP (5/hr, 30/day).                     │
│    2. classifyCrisis(feeling). If crisis → return          │
│       resources, persist nothing.                          │
│    3. Filter: figure_stages with age range overlapping     │
│       user_age (wide hard gate), status='published'.       │
│       Soft age penalty applied later in scoring.           │
│    4. tagAndExpand(feeling) → { tags, expansion, anchors,  │
│       confidence } | null. Best-effort, hard-fail-fast.    │
│    5. Retrieval:                                           │
│       v1 (≤20 stages or stub embedder):                    │
│         pass filtered candidates straight to rerank.       │
│       v2 (>20 stages, real embedder):                      │
│         multi-lane FacetsRAG (shape + 4 facets + theme)    │
│         over the stages pool, per-lane quotas, dynamic-    │
│         weighted RRF, age soft penalty after RRF, top-K    │
│         to rerank.                                         │
│    6. Rerank (GPT-OSS 120B): reads raw feeling +           │
│       candidate stages' biographical_facts. NEVER sees     │
│       tags, expansion, or shape_sentences. Returns         │
│       (figureKey, stageId), resonance, gap, confidence.    │
│    7. If confidence: low → log to match_misses,            │
│       framing="partial". Else framing="definitive".        │
│    8. db.createSession() → sessionId. (FK to               │
│       figure_stages.)                                      │
│    9. Return { sessionId, figure, stage, outline, framing }.│
│                                                            │
│  Story player reveals beats one at a time.                 │
│   - Opening copy diverges by framing:                      │
│       definitive → "X felt something close to this..."     │
│       partial    → "...a fragment whose struggle rhymes."  │
│   - NARRATIVE beat: stream prose, "Continue" btn.          │
│   - DECISION beat: show 2-3 options, user picks.           │
│                                                            │
│  POST /api/beat / /api/choose                              │
│    → Llama 3.3 70B streams beat prose. All beats except    │
│      the final "bridge to you" read deterministic content  │
│      from figure_stages.beats; bridge is the only freely-  │
│      generated beat, weaving the user's intake words back  │
│      into the lesson.                                      │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Beat structure — `arc_variant` determines count, `role` determines validation

Each `figure_stages` row declares its `arc_variant`: `"double_fork"` (canonical, 9 beats) or `"single_fork"` (integrity fallback, 8 beats). Use `double_fork` only when both forks are historically documented **and** the second fork's outcome is, or directly causes, the turn. Beat 7's reveal-as-turn merge depends on that causal link; without it, the structure feels forced. Use `single_fork` when either condition fails: only one strong historically-documented decision, or the real turn was not a decision (external event, gradual realization, time). **Forbidden:** zero forks (defeats the agency contract that hurting people came for) or three-plus forks (decision fatigue). **Health band:** 10–30% `single_fork` across the published library — below means editors are forcing second forks, above means the library is light on documented agency. Surface this as an eval metric (`pct_single_fork_stages`).

**Canonical (`double_fork`), 9 beats:**

1. **Scene** (narrative) — figure at the user's exact age, the world they're in.
2. **The dark moment** (narrative) — mirrors the user's intake feeling.
3. **First fork** (decision) — a real fork-point. User picks.
4. **What they actually did** (narrative) — confirms or gently contrasts with the user's pick.
5. **The struggle** (narrative) — the slog, doubt, setbacks.
6. **Second fork** (decision) — another pivotal real moment.
7. **The turning point** (narrative) — what shifted; also the reveal of fork 2 (the figure's last choice IS the turn — that's why this lands at 9 beats, not 10). If the real turn wasn't caused by a decision, this merge cannot happen; use `single_fork` instead.
8. **What they became** (narrative) — what they became *out of this episode*, in one short paragraph.
9. **Bridge to you** (narrative, second-person) — personalized closing.

**Integrity fallback (`single_fork`), 8 beats** — used when the biography supports only one strong real decision, or when the real turn was not caused by a decision:

1. **Scene** (narrative)
2. **The dark moment** (narrative)
3. **Fork** (decision) — the one real fork-point.
4. **What they actually did** (narrative) — reveal of the fork.
5. **The struggle** (narrative)
6. **The turning point** (narrative) — separate beat (something shifted that wasn't a decision: realization, encounter, time, slow-burn fracture finally breaking).
7. **What they became** (narrative)
8. **Bridge to you** (narrative, second-person)

Beats are stored 0-indexed in `beats jsonb`, each carrying both **`kind`** (`narrative | decision | bridge` — drives player rendering) and **`role`** (`scene | dark_moment | fork | reveal | struggle | turning_point | became | bridge` — drives validation). *Role = narrative structure; kind = UI/player behavior.* The player keys on `kind` (does this beat show options or not?); validation keys on `role` (is this beat in the right slot for this `arc_variant`?). Index-based validation alone misses the case where an editor swaps two narrative beats; role-based catches it.

Decision beats use **truthful history**: the user picks; the next beat reveals what really happened. When the user's pick matches reality, that's affirming. When it differs, the narrative says "you would have stopped here — they didn't, and this is why," which is often more powerful than a match. This has to be the design philosophy because the figure is real; we don't fabricate alternate histories.

**Beat count is never exposed to the user** — no progress bar, no "beat 4 of 9." The user presses Continue, the journey is whatever length it is. "What they became" is scoped to *this episode*, not whole-life legacy — the bridge handles connection back to the user. Multi-stage figures (v2) reuse the same arc shape per stage; a 70-year-old figure does not become a single 50-year telescoped beat 8.

### Matching architecture (RAG, two-stage)

The whole product hinges on matching a user's specific feeling to a real figure. Lazy matches kill the app. The architecture splits the matching problem into stages so each stage uses the right tool.

**Stage-based chunking — the retrievable unit.** The retrievable unit is the `figure_stages` row, not the `figures` row. A *stage* is one *emotional episode organized around one down moment* — not an age period or demographic life-phase. `figures` is thin identity (`key`, `display_name`, optional birth/death years); all matching surfaces live on `figure_stages`. Age range is a *consequence* of when the episode happened (`stage.age_min`, `stage.age_max`), not the separator between matchable units. The editorial test for "is this one stage?" is whether you can write one clean through-line sentence at `shape_sentences[0]`; if you can't, it's actually two stages and should be split. v1 ships one stage per figure; v2 expands to multi-stage figures as content expansion (additive — no schema migration, just additional rows). Multi-stage softens the cultural-canon problem at the same time: famous figures stay matchable but on their less-told episodes ("Lincoln in his 30s, when his career stalled" not "Lincoln").

**Curated stage library (Supabase `figure_stages` table).** Every stage has two distinct text fields, deliberately separated:

- `shape_sentences[]` — 2–3 short, sensory sentences capturing the figure's emotional shape during *this episode*. `shape_sentences[0]` is the editorial through-line by convention — the one-sentence summary that decides whether this is one stage or two. _Llama-drafted, human-polished (≈8–10 min/stage)._ Each sentence is embedded individually (one row per sentence in `figure_shape_embeddings`) with `task_type=RETRIEVAL_DOCUMENT` / `input_type=document`, then L2-normalized at write time. **Used only for retrieval.**
- `biographical_facts` — a hand-curated factual paragraph from primary sources (dates, quotes from real letters, named events), scoped to this episode. **Used only for rerank prompting and beat generation.**

The split is the architectural anti-echo defense: the rerank LLM never sees the same text the embedding step saw. If shapes were both embedded _and_ shown to the rerank LLM, we'd be asking the LLM to confirm what cosine similarity already said — redundant and biased toward Llama's writing style.

**Matching pipeline:**

| Stage                      | Library size                | What runs                                                                                                                                                                                                                                                                                                                                                               | Why                                                                                                                                                                                                                                               |
| -------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Filter                     | any                         | SQL on `figure_stages`: wide age hard gate (range overlap with user_age, plus tolerance) AND `status='published'`. Soft age penalty applied later in Stage-B scoring (see *Soft age filter*).                                                                                                                                                                            | Wide hard gate prevents biographically-impossible matches; soft penalty inside the gate keeps near-age stages with strong emotional fit reachable. Pure hard filter loses recovery; pure soft filter violates recovery-asymmetry by letting impossible matches through.                                                                                                                                          |
| Tag & expand               | any                         | Llama 3.1 8B turns raw feeling into `{ tags, expansion, anchors, confidence }`. Hard-failure rules; null result is fine.                                                                                                                                                                                                                                                | The user's surface words may not match the domain vocabulary the figures are written in. Expansion bridges that gap, with `anchors` grounding it to verbatim user phrases.                                                                        |
| Multi-lane retrieval (v2 only) | >20 stages + real embedder | Tagger emits a `FacetSignal` including per-facet **query projections** (figure-neutral sentences, anchor-substantiated). Each lane runs an age/status-filtered vector search over `figure_stages` rows against its own typed corpus: shape (raw user feeling, optionally expansion as ablation), four facet lanes (each typed projection if non-null, else raw user feeling), plus a deterministic theme/antiTheme lane. Stage A — every lane contributes its top-N **post-filter** to a deduped pool unconditionally (per-lane quotas in `match-config.ts`). Stage B — dynamic-weighted RRF over the deduped pool, age soft penalty applied to each candidate's blended score, select top-K (default 12, eval-tunable to 15) for rerank. Aggregation within a lane is max-not-mean (`score = max_s sim(q,s) + α·second_max_s sim(q,s)`, α≈0.15). | Per-lane query/document space alignment beats single-query retrieval on short, metaphor-heavy inputs. Quotas honor the recovery-asymmetry rule: a strong-on-one-lane stage cannot be excluded by elegant weighting; rerank can only correct candidates that reach the pool. The deterministic theme lane is a stable floor under LLM-driven lanes when those wobble. **BM25 is intentionally excluded** — short emotional disclosures are dominated by metaphor tokens, and lexical overlap against literal `biographical_facts` produces metaphor↔literal collisions that RRF cannot down-weight. |
| Rerank                     | any                         | GPT-OSS 120B reads RAW feeling + candidate stages' `biographical_facts` + grading scalars (`narrativeDynamism`, `canonExposure`). Returns `{ figureKey, stageId, resonance, gap, confidence }`.                                                                                                                                                                          | Tagger output never reaches this stage. Rerank is grounded on what the user actually said; tags would propagate stage-1 bias into stage 2.                                                                                                        |
| Miss log + framing         | confidence: low             | Insert into `match_misses`; set `framing: "partial"` so the UI tells the user honestly.                                                                                                                                                                                                                                                                                 | A weak match presented as a definitive mirror corrodes trust faster than no match.                                                                                                                                                                |

**v1 simplification:** when the library is ≤20 stages or the embedder is the stub, the SQL filter typically returns most of the library anyway. Skip vector retrieval entirely — shape AND facet lanes both stay dormant — and pass all filtered candidates straight to the rerank LLM. The age soft penalty still applies as a final score adjustment so age-near stages outrank age-far ones. `figure_shape_embeddings` and `figure_facet_embeddings` stay empty until library grows past ~20 AND a real embedder is configured, at which point `scripts/reembed.ts` backfills.

### FacetsRAG — typed facet micro-documents per stage

Layered onto shape-sentence retrieval. Each *stage* (the retrievable unit) carries five typed facet rows in addition to its `shape_sentences`; each facet is its own embedding, retrieved on its own lane, then weight-fused into one dense rank. Facets add interpretability and improve retrieval recall on dimensions that pure shape retrieval blurs: same trigger, different emotional core; same emotional core, different decision shape.

**The load-bearing rule (do not loosen without re-deriving everything below):** _retrieval failures are unrecoverable; rerank failures are correctable._ If wrong dynamic weights push the correct stage out of the top-12 shortlist, rerank never sees it — game over. If a missed boost demotes the correct stage from rank 3 to rank 8, rerank still gets it and recovers. This asymmetry is why every v1 number below is conservative: passive λ, tight bounds, strict gates. Future tuning may loosen specific constants if eval data justifies it; the asymmetry rule itself does not loosen.

**Five facets — start small, expand only on eval evidence:**

| Facet            | What it captures                                                                         |
| ---------------- | ---------------------------------------------------------------------------------------- |
| `shape`          | The 2–3 `shape_sentences` as today. Multi-anchor holistic signal. The most-trusted lane. |
| `emotional_core` | The core feeling-state at this moment. One sentence.                                     |
| `decision_shape` | The shape of the dilemma — what they were choosing between. One sentence.                |
| `trigger_event`  | The concrete event/situation that brought it on. One sentence.                           |
| `agency_state`   | Their relationship to action right now — stuck, exposed, half-trying, etc. One sentence. |

`pressure_source`, `relational_context`, `arc_shape` are deferred. Add only if eval shows specific failure modes those would catch.

**Authoring rules.** Facets are editorial _interpretations_ of already-source-verified `biographical_facts`, not new factual claims. They need human review for accuracy and tone, not separate source verification per facet.

- One sentence per facet.
- 12–28 words.
- Past tense for figure facets.
- No proper names unless absolutely needed — use "he"/"she" so the facet generalizes.
- No abstract diagnosis words ("depression", "trauma", "anxiety disorder") unless the term is in `lib/themes.ts`.
- Concrete but not overloaded — one specific image or one specific tension per facet, not three.
- **Substantiability:** every facet must be supported by a passage in the stage's `biographical_facts`. If a facet says something the source paragraph doesn't establish, either add the fact or rewrite the facet.

Example:

```
emotional_core:    He began to believe the delay meant something permanent about his worth.
decision_shape:    Whether to disappear from public effort or keep taking small practical risks.
trigger_event:     A public failure after others his age seemed to be moving forward.
agency_state:      Stuck, exposed, and unsure whether the next attempt would matter.
```

**Tagger output schema** (consumed by the dynamic weighter and the per-lane query encoder; never reaches the rerank LLM):

```ts
type FacetType = "emotional_core" | "decision_shape" | "trigger_event" | "agency_state";

type FacetSignal = {
  confidence: number;                                  // 0..1
  dominantMode: FacetType | "unclear";
  facetImportance: Record<FacetType, number>;          // each 0..1, unconstrained
  anchors: Record<FacetType, string[]>;                // verbatim substrings
  facetQueries: Record<FacetType, FacetQuery | null>;  // per-lane query projections; see below
};

type FacetQuery = {
  text: string;                                        // figure-neutral projection sentence
  anchors: string[];                                   // verbatim substrings substantiating `text`
};
```

Validation (any failure on a *signal-level* rule → return `null`, fall back to base weights, no retry; per-projection failures null out *that facet only*):

- *Signal-level:* JSON parses; `confidence ≥ 0.55`; ≥ 2 lanes with `importance ≥ 0.30`; every lane with `importance ≥ 0.30` has at least one anchor; every anchor is an exact substring of the raw user input; all `importance` values in `[0, 1]`.
- *Projection-level (per facet):* projection `text` length ≤ 32 words; non-empty `anchors` list; every projection anchor is an exact substring of raw user input; `text` contains no proper-noun tokens, no four-digit years, no first-person pronouns, no controlled-vocabulary diagnosis terms (`depression`, `trauma`, etc.); past tense.
- A facet whose projection fails any *projection-level* rule has its `facetQueries[facet]` set to `null` — that lane falls back to embedding the raw user feeling. The `FacetSignal` itself remains valid.

`shape` does not appear in `facetImportance` or `facetQueries`. Shape is the holistic prior — never reweighted by the tagger, and its query is always the raw user feeling (and optionally the expansion text). Shape weight adjusts only as a consequence of bounded renormalization after other lanes shift.

**Facet query projection — per-lane query rewriting.** The retrieval problem this solves: user inputs are short and dominated by metaphor and sensation; documents in each lane are concrete, past-tense, figure-neutral facet sentences. Embedding the raw user feeling against every lane forces a single query vector to bridge a different semantic gap per lane. *Facet query projection* closes that gap by translating the user's input into the same writing-style distribution as the documents in each lane, *per lane*.

This is deliberately **not HyDE.** HyDE invites the model to invent biographical specifics (names, dates, events), which then leak into retrieval as spurious anchors. Projection is constrained to *emotional/decision shape only*:

- One sentence per facet, in the same shape as `figures.facets.<type>` documents (past tense, "he"/"she" or generic "they"/"someone", 12–28 words).
- Forbidden: proper names; four-digit years; concrete invented events ("after his draft notice", "when her father died" — fabricates fact); first-person pronouns; controlled-vocabulary diagnosis terms; abstract jargon ("trauma", "depression").
- Required: anchor-substantiated. Every projection carries a list of verbatim user-input substrings that justify it. Empty anchors → projection nulls out for that facet.
- Nullable per facet. The tagger emits a projection only for facets where the user's input substantiates one. Lanes without a projection fall back to embedding the raw user feeling.

Why these constraints are tight: a fluent but unanchored projection drifts back into HyDE; a projection containing names or dates is a fabricated fact, not a translation of user shape; first-person leaks raw user voice into a representation that's supposed to be figure-neutral. Each constraint is a recoverable failure (null that lane) rather than a tagger-level abort, because retrieval failures are unrecoverable but lane-fallback to raw-feeling is correct behavior.

Example (figure-neutral past tense, anchor-substantiated):

```
emotional_core: { text: "Someone felt overwhelmed by forces they could not name.",
                  anchors: ["overwhelmed", "I don't know what's happening"] }
decision_shape: null
trigger_event:  { text: "Something public went wrong while peers seemed to be moving forward.",
                  anchors: ["my friends are all ahead", "messed up in front of everyone"] }
agency_state:   { text: "They were still present, but felt their control slipping.",
                  anchors: ["I can't keep up", "barely holding on"] }
```

The same `RETRIEVAL_QUERY` / `input_type=query` asymmetric encoding applies to projections as to raw-feeling queries. Projections never persist; they are computed once per match call and dropped after retrieval.

**Dynamic weight formula** (lives in `lib/match-config.ts`, version-stamped via `matchConfigVersion`):

```ts
const BASE_WEIGHTS = {
  shape: 0.45,
  emotional_core: 0.25,
  decision_shape: 0.15,
  trigger_event: 0.1,
  agency_state: 0.05,
};

const WEIGHT_BOUNDS = {
  // [min, max] per lane
  shape: [0.38, 0.55],
  emotional_core: [0.18, 0.38],
  decision_shape: [0.06, 0.28],
  trigger_event: [0.03, 0.22],
  agency_state: [0.02, 0.12],
};

const DYNAMIC = {
  lambdaMax: 0.15, // tagger never controls more than 15% of the mix
  minTaggerConfidence: 0.55, // below → static weights, no blending
  minSecondLaneImportance: 0.3, // need ≥2 lanes ≥ this → otherwise static
};

// Continuous λ within the gate (no cliff at 0.55).
function lambda(confidence: number): number {
  if (confidence < DYNAMIC.minTaggerConfidence) return 0;
  return (
    ((confidence - DYNAMIC.minTaggerConfidence) /
      (1 - DYNAMIC.minTaggerConfidence)) *
    DYNAMIC.lambdaMax
  );
}
```

Bounded normalization is mandatory: clamp to `[min, max]` → renormalize to sum=1 → re-clamp violations → repeat until stable. Naive `clamp + divide-by-sum` re-violates bounds after the divide. Iterative projection converges in ≤ 5 iterations for 5 lanes; helper lives in `lib/match-config.ts`.

**Invariant tests** (`lib/match-config.test.ts`) — required before facet weighting wires into retrieval:

- Weights always sum to 1 (within float epsilon).
- No bound is ever violated.
- `confidence < 0.55` returns `BASE_WEIGHTS` exactly.
- Invalid anchors return `BASE_WEIGHTS` exactly.
- Single-lane signal returns `BASE_WEIGHTS` (the ≥2-lane gate).
- Decision-heavy query cannot push `shape` below 0.38.
- Emotion-heavy query cannot push `emotional_core` above 0.38.
- Same input → byte-identical weights (determinism, no float-order drift).

**Retrieval pipeline (two stages, age-filter-aware):**

1. **Tag & project.** Tagger emits a `FacetSignal` including per-facet **query projections** (figure-neutral sentences, anchor-substantiated; see *Facet query projection* below). Projection-validation failure on any facet → that facet's projection is null and that lane falls back to the raw user feeling as its query.

2. **Stage A — pool entry (per-lane quotas, unconditional).** Each lane runs a vector search over `figure_stages` rows pre-filtered by the wide age hard gate and `status='published'`, and contributes its top-N **post-filter** to a deduped pool. Quotas are *post-filter* by definition — implementations either pre-filter inside the HNSW scan (preferred, via pgvector iterative scan) or overfetch by ~3× and post-filter; the constant in `match-config.ts` is the post-filter target.

   | Lane | Query | Quota (post-filter) |
   |---|---|---|
   | shape | `embed(raw user feeling)` as `RETRIEVAL_QUERY`; `embed(expansion)` as a second query if expansion is enabled | 20 each |
   | `emotional_core` | `embed(facetQueries.emotional_core)` if non-null, else raw feeling | 20 |
   | `decision_shape` | same pattern | 20 |
   | `trigger_event` | same pattern | 15 |
   | `agency_state` | same pattern | 15 |
   | theme | deterministic weighted Jaccard with antiTheme penalty (no embedder) | 20 |

   Each lane aggregates within itself max-not-mean: `score(stage, lane) = max_s sim(q,s) + α·second_max_s sim(q,s)` (α≈0.15, eval-tunable). Pool deduplicates by `(figure_key, stage_id)`; expected pool size ~50–80 unique stages.

3. **Stage B — final selection (dynamic-weighted RRF over the deduped pool, with age soft adjustment).** Per-lane importance from `FacetSignal` is blended with `BASE_WEIGHTS` per the bounded λ formula. Final rank = Σ_lane (weight_lane / (k + rank_in_lane)), default k=60. The age adjustment (proportional to distance from `stage.age_min`/`age_max`, capped — see *Soft age filter* below) is applied as a score adjustment per candidate, *not* added as a sixth FacetsRAG lane (keeps the lane mix clean and the adjustment independent of FacetsRAG weights). The exact function is scale-calibrated in `lib/match-config.ts` and version-stamped via `matchConfigVersion`. Output top-K to rerank: K=12 by default, eval-test up to K=15 once richer retrieval lands.

4. **Rerank.** GPT-OSS reads raw feeling + candidates' `biographical_facts` + grading scalars only. Tagger output, projections, anchors, theme tags, lane weights, expansion text — none reach the reranker. Anti-echo extends across both stages.

**Why two stages, not one.** Quotas honor recovery-asymmetry: a strong-on-one-lane figure cannot be excluded from the pool by elegant weighting (Stage A is unconditional). Stage B is allowed clever ranking because rerank still recovers candidates within the pool. Compressing this into a single weighted-sum stage re-introduces the failure mode the asymmetry rule was drawn to avoid.

**Wide candidate recall, narrow rerank input.** ~50–80 unique stages pool → top-12 (or top-15) to rerank. Cutting per-lane quotas below the listed values risks dropping the correct stage that ranked moderate on the dominant lane. Cost: ~6 HNSW queries × ~50 ms + ~5 ms theme-Jaccard = ~300 ms.

**Soft age filter (post-RRF, pre-rerank).** Each `figure_stages` row carries `age_min`/`age_max` — the documented age range of the episode. Match-time has two layers: a *wide* hard gate (range overlap with user_age plus a tolerance, ≈±10 years from the range edges, eval-tunable) excludes only stages whose mismatch is extreme; inside the gate, age contributes a soft adjustment proportional to distance from the stage's range, capped. The adjustment is applied once per candidate after Stage-B RRF blending and before rerank — *not* added as a sixth FacetsRAG lane and does not affect per-lane quotas (keeps the lane mix clean and the adjustment independent of FacetsRAG weights). The exact function (multiplicative on blended score, rank-additive, or calibrated additive) is scale-calibrated in `lib/match-config.ts` and version-stamped via `matchConfigVersion`. *Why both gate and adjustment:* pure soft filter (no hard gate) violates recovery-asymmetry by letting biographically-impossible matches sneak in; pure hard filter (no soft adjustment) loses near-age stages whose emotional fit is strong. Both together get wide reach without losing discipline. *Why not prescribe the math here:* RRF scores are small and scale-dependent (≈0.005–0.020 per candidate after weighted blending), so a fixed additive constant could dominate or under-influence the retrieval signal depending on lane count and pool size — picking the function before score distributions are visible would freeze a guess as a constraint. A bad adjustment constant is recoverable inside rerank's top-K; a hard age gate that's too tight is not.

**Theme lane and antiThemes — deterministic editorial signal.** The theme lane is the only retrieval lane that does not use an embedder. It exists because hand-curated semantic structure (which figures are *about* `worthlessness` vs `creative_dismissal` vs `grief_loss_of_parent`) survives when the LLM-driven lanes wobble: tagger drift, embedder swap, projection failure. Deterministic, fast, debuggable.

- `figure_stages.themes: string[]` — positive: what this stage is about. Drawn from the controlled vocabulary in `lib/themes.ts`.
- `figure_stages.antiThemes: string[]` (optional) — neighboring themes the editor flagged as confusable-but-distinct. Encodes "this stage looks like X but is actually Y" judgment that no embedder can infer from text.
- Tagger emits user theme tags from the same controlled vocabulary; tags are derived from anchored user phrases.

Score, capped to prevent editorial tags from overpowering the dense lanes:

```
themeScore = clamp(
  weightedJaccard(userThemes, stage.themes)
    − λ · weightedJaccard(userThemes, stage.antiThemes),
  -0.25,
  0.35
)
```

`λ` defaults to 1.0 (penalty equal to bonus); both `λ` and the clamp bounds are eval-tunable and version-stamped via `matchConfigVersion`.

**antiThemes never hard-exclude.** They are *only* a Stage-B scoring penalty. A bad antiTheme is recoverable if the figure still reaches rerank via shape or facet lanes; a hard exclusion is not. This is the recovery-asymmetry rule applied to the editorial signal.

**Population discipline.** `antiThemes` is populated only when (a) an editor encountered a confusion case while seeding ("this stage looks like X but is actually Y"), or (b) eval surfaced a confusion *this specific stage* caused. Pre-filling from a "themes commonly confused with this one" matrix is forbidden — it bloats editorial cost and freezes guesses as data. Default empty.

**Expansion as an explicit ablation — eval-pending, not eval-decided.** Once facet query projection is in place, the original `expansion` text (a single holistic paraphrase of the user feeling, embedded as a second shape-lane query) does work that overlaps with the per-lane projections. The plan does not pre-decide whether to keep both, drop expansion, or drop projections — three configs are graded against the eval set:

| Config | Shape lane queries | Facet lanes |
|---|---|---|
| A — both | raw + expansion | raw or per-facet projection |
| B — projections only | raw | raw or per-facet projection |
| C — expansion only | raw + expansion | raw (no projections) |

A FacetsRAG-positive result requires top-1 accuracy improving AND near-miss confusion rate dropping vs. the prior config. Prior expectation: expansion drops out (B wins). The decision is recorded as `expansionEnabled: bool` in `match-config.ts`, version-stamped via `matchConfigVersion`. No silent toggling between configs in production — every flip is a config-version bump and re-evals.

**Asymmetric encoding + L2 normalization apply to facets identically to shape sentences.** Each facet text is a _document_ at seed time (`task_type=RETRIEVAL_DOCUMENT` for Gemini; `input_type=document` for Voyage), normalized at write. The query is a _query_. No exceptions for facets. The theme lane is exempt because it has no embedder.

**Seed/publish gates** (enforced in `scripts/check-figure.ts` + `scripts/seed-figure.ts`):

- `stage.shapeSentences.length` in `[2, 3]`; `shape_sentences[0]` is the through-line and must stand alone as one clean sentence (the "is this one stage?" test — failure means split into two stages).
- All four `figure_stages.facets.*` keys present and non-empty (`emotional_core`, `decision_shape`, `trigger_event`, `agency_state`).
- Each facet substantiable from the stage's `biographical_facts`.
- `arc_variant ∈ {single_fork, double_fork}` and `beats.length` matches the variant: 8 for `single_fork`, 9 for `double_fork`.
- Every beat carries `kind` and `role`; the role at each index matches the expected role for the declared `arc_variant` (role-based, variant-aware validation — catches swapped-narrative-beat editorial errors that index-based validation alone would miss).
- An embedding row exists for the active `model_id` for shape AND every facet, keyed on `(figure_key, stage_id, ...)`.
- Every embedded row's `content_hash` matches its current source text.

Missing any of these → seed fails. No `--force` override. Stage integrity is a publish-time concern, not a runtime one.

**Runtime soft-fail + editorial feedback loop.** If a published stage is somehow missing a facet at match time (publish-gate bypass, partial migration, embedder rollout in progress), the matcher fails soft: upsert a row in `figure_editorial_warnings` (deduplicated on `(figure_key, stage_id, warning_type, active_model_id)`) and exclude that stage from the affected facet lane only. It still participates via the shape lane, the theme lane, and any other facet lanes for which a valid embedding exists. Serving stays reliable; the bad row surfaces for editorial repair. Warnings live in their own table so the `figure_stages` row stays read-only on the hot match path.

**Production trace fields on every match** — the schema is *string-hostile* (see *Privacy taint model*). Every field is `SafeOperational` or `SafeIdentifier`; nothing user-derived crosses into the trace surface without explicit reduction to counts, booleans, or buckets:

```
{
  // identifiers
  sessionId,                        // SafeIdentifier
  matchConfigVersion,               // SafeOperational
  embeddingModelId,                 // SafeOperational

  // tagger / projection — reduced
  taggerOk: bool,
  taggerConfidenceBucket,           // "low" | "medium" | "high"
  dominantModeBucket,               // "emotional" | "decisional" | "situational" | "unclear"
  lambdaBucket,                     // "off" | "low" | "mid" | "high" — never raw λ
  projectionGenerated,              // { emotional_core: bool, decision_shape: bool, ... }
  projectionAnchorCounts,           // { emotional_core: int, ... }

  // theme lane — reduced
  userThemeTagCount: int,           // count only; specific tag values are SensitiveDerivedTags
  antiThemeFiredCount: int,

  // retrieval / rerank — counts and outcome only
  candidateCount, dedupedPoolSize, rerankedCount,
  scoreStatsBucket,                 // coarsened distribution; raw scores leak
  chosenFigureKey,                  // SafeIdentifier — the match outcome

  // outcome
  framing,                          // "definitive" | "partial"

  // timing
  latencyMs: { tagger, retrieval, rerank, total }
}
```

Forbidden in production trace, on any path including errors: raw user feeling; anchor texts; projection texts; expansion text; provider request bodies; provider response bodies; tagger raw JSON (especially on parse failure); reranker `resonance` / `gap` text; ranked candidate lists beyond `chosenFigureKey`; specific theme/antiTheme/dominantMode enum values; raw scores (only buckets). Full traces live in `logs/match-traces.jsonl` and are written *only* under explicit dev-replay (see *Privacy taint model*).

`matchConfigVersion` is the key field — a string like `"retrieval-v2-projection-themes-no-bm25-2026-05"`, bumped on every constant change, never reused. It covers the *full retrieval recipe*, not just lane weights:

- lane list and per-lane quotas
- theme `λ` and clamp bounds
- projection schema version (forbidden-token list, max-words, anchor rules)
- `expansionEnabled: bool`
- rerank top-K
- retention TTLs (`feeling` NULL-after, log rotation)
- crisis regex version
- `BASE_WEIGHTS`, `WEIGHT_BOUNDS`, `DYNAMIC` constants

Combined with `sessions.match_recipe` (which freezes the active versions per session), this is what makes principled replay possible: any past match can be re-run against its original recipe to verify reproducibility, or against a new recipe to ask "would this config have caught it?"

**FacetsRAG-specific eval hard negatives.** Beyond the existing hard-negative pairs in `evals/match.yaml`, include cases that test each lane independently. Label every test with what it measures, otherwise eval results are uninterpretable:

| Hard negative type                                    | Tests                 | What it measures                                                                            |
| ----------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------- |
| Same trigger, different `emotional_core`              | modeled facet         | Does `emotional_core` discriminate when `trigger_event` is identical?                       |
| Same `emotional_core`, different `decision_shape`     | modeled facet         | Does `decision_shape` discriminate when `emotional_core` is identical?                      |
| Same `agency_state`, different un-modeled life domain | un-modeled confounder | Do shape + `biographical_facts` implicitly encode life-domain we deliberately didn't model? |
| Same age + theme, wrong un-modeled `pressure_source`  | un-modeled confounder | Same — do we need `pressure_source` as a facet, or does existing signal already separate?   |
| Canonical-famous match vs obscure-but-sharper         | canon bias            | Does the rerank-prompt cultural-canon penalty actually penalize?                            |

A FacetsRAG-positive eval result requires top-1 accuracy improving AND near-miss confusion rate dropping, _especially on modeled-facet tests_. If only top-1 moves but near-miss rate is flat, the gain is from re-ranked recall, not facet discrimination — interpret accordingly before tuning.

**Out of scope for v1 FacetsRAG (revisit only on eval evidence):**

- Cross-facet multiplicative boosts (additive weighting is more debuggable, less brittle).
- More than 5 facets (`pressure_source`, `relational_context`, `arc_shape` deferred — add only if eval shows they catch a class of failures the existing 5 miss).
- Per-facet embedders (one embedder serves all lanes — same `model_id`).
- BM25 / keyword-overlap retrieval against `biographical_facts` (rejected: short metaphor-heavy user inputs produce metaphor↔literal token collisions; RRF cannot down-weight a poisoned lane; the deterministic theme lane covers the editorial-signal job that BM25 was supposed to catch).
- Cross-encoder pre-rerank between dense retrieval and GPT-OSS (deferred: GPT-OSS already does cross-encoder-style reasoning on top-12; marginal recall gain doesn't justify another model dependency).
- Hard exclusion via antiThemes (always penalty-only; hard exclusion violates recovery-asymmetry).
- Failure-mode catalog beyond `missing_facet`, `stale_content_hash`, `missing_embedding`, `dim_mismatch`, `projection_validation_failed`, `missing_anti_theme_population` — write alongside the eval set as failure shapes emerge.

### Privacy taint model

The product asks people in pain to disclose how they're feeling. Once entered, that text is sensitive — not just to the database row that stores it, but to every artifact derived from it (anchors, projections, expansions, embeddings, LLM outputs, classification tags). The architectural rule:

> User-derived natural language and embeddings are sensitive until explicitly reduced into non-semantic telemetry.

This is a structural invariant alongside *anti-echo* (shape and facet text never reach rerank) and *recovery-asymmetry* (retrieval failures unrecoverable, rerank failures correctable). All three are simple, named, with a load-bearing reason. None loosens on intuition. The privacy invariant is *also* about product trust: users who trust the form enough to type their pain should not have that pain replicated into operational systems they don't know exist.

**Six sensitivity classes (closed set; provenance determines class, not type).**

| Class | Examples | Authorized exits |
|---|---|---|
| `SensitiveRaw` | User-entered feeling | DB persistence (`sessions.feeling`, `match_misses.feeling`), LLM prompt input, embedder query input, crisis regex, replay-with-flag |
| `SensitiveDerivedText` | Anchors, projection texts, expansion text, prompt bodies, tagger raw JSON, reranker `resonance` / `gap`, generated bridge prose | Downstream LLM input, DB if persisted (same TTL as raw), replay-with-flag |
| `SensitiveDerivedTags` | User theme tags, antiTheme triggers, `dominantMode`, `facetImportance`, crisis reason codes | Reduction step → safe counts/booleans/buckets, replay-with-flag |
| `SensitiveDerivedVector` | Query embeddings (raw user feeling, expansion, projections) | Vector search only; never persisted, never logged, dropped after retrieval |
| `SafeOperational` | `matchConfigVersion`, `embeddingModelId`, provider name, `latencyMs`, counts, booleans, `errorClass`, score buckets | Production trace, dashboards |
| `SafeIdentifier` | `sessionId`, `figureKey`, theme vocab id, model id (curated content / non-derived) | Production trace, dashboards |

`SensitiveDerivedTags` exists because enum values from a controlled vocabulary are not safe just because they're enums. The literal `"worthlessness"` is `SafeOperational` when it's a curated `figures.themes` entry, and `SensitiveDerivedTags` when it's a tagger output classifying a user's disclosure. *Provenance, not surface type.*

Document embeddings (`figure_*_embeddings.embedding` rows) are not sensitive — they are derived from curated editorial content (`shape_sentences`, facet text), not from user input. Same dimensionality, same encoder; different sensitivity class because different provenance.

**Authorized exits and the reduction step.** Sensitive values do not flow into the production trace surface directly. They flow through *reduction* — a deliberate transformation from a sensitive object into a non-semantic safe summary. The mental model: *sensitive object in, safe counters/enums/scores out.* Examples:

- projection object → `{ generated: bool, anchorCount: int, valid: bool }` per facet
- theme scoring → `{ userThemeTagCount, antiThemeFiredCount, dominantModeBucket }`
- retrieval results → `{ candidateCount, dedupedPoolSize, scoreStatsBucket, chosenFigureKey }`
- LLM call → `{ provider, route, latencyMs, errorClass | success }`

The trace writer accepts only the reduced form. Boundary discipline is enforced by *opaque wrappers* with named, greppable unwrap methods — `unwrapForLLM`, `unwrapForEmbedder`, `unwrapForDB`, `unwrapForCrisisRegex`, `unwrapForVectorSearch`, `unwrapForReplayWithFlag` — not by branded primitive types (which remain assignable to their underlying primitive and therefore cannot enforce the boundary). Each `unwrapFor*` is a documented exit; grep across the codebase reveals every authorized boundary in one search. New exits require new methods, not new conventions.

**Production trace surface is string-hostile.** The schema accepts only `SafeOperational` and `SafeIdentifier` values, plus numbers, booleans, and nulls. It rejects arbitrary strings. Every value crosses the boundary through a deliberate classifier (`asEnum`, `asFigureKey`, `asConfigVersion`, etc.) rather than a generic "log this" path.

**Categorical exclusions, even on errors.** No path — success, exception, timeout, JSON parse failure, retry — may emit any of the following to the production trace:

- provider request bodies (Groq, Gemini, Voyage)
- provider response bodies
- tagger raw JSON, especially on parse failure (the failed payload contains the disclosure)
- LLM prompts of any role (system, user, assistant)
- raw exception objects (request body, parameter values, and stack frames often ride along inside)
- ranked candidate lists beyond `chosenFigureKey`
- specific user-tag enum values (only counts and coarsened buckets)
- reranker `resonance` / `gap` text (the LLM's interpretation of why a figure matches *the user's specific words*)

**Provider-call sanitizing wrappers.** Every LLM, embedder, and DB call is wrapped at the boundary. Thrown errors are converted to a structured shape (`{ provider, route, errorClass, latencyMs }`) *before* propagating. The original error — request body, stack with parameter values, response body — is discarded inside the wrapper. The caller never sees a provider-SDK error directly. This is the most operationally important rule, because most leaks happen through unhandled provider errors, not through deliberate logging.

**Hosted error services are not wired at v1.** Sentry / Datadog / Honeycomb capture request bodies by default; even with scrubbing rules they're a leak vector waiting for misconfiguration. Local logging only until ops need clearly outweighs the surface. If added later, they receive only the same reduced trace shape — never raw provider objects.

**Retention discipline.** Placement is half the privacy story; the other half is duration.

- `sessions.feeling`: NULL'd 60 days after creation. The structural row (figure_key, framing, choice trail, recipe metadata) is preserved for aggregate eval; the disclosure itself is dropped. Session id remains addressable; pain text is gone.
- `match_misses.feeling`: NULL'd 60 days after creation. Editorial review window is short by design — old misses don't drive curation, they expand the surface.
- `logs/match-traces.jsonl`, `logs/replay-audit.jsonl`: 90-day local rotation, gitignored, never copied off the dev machine.
- TTL values live in `match-config.ts`, version-stamped via `matchConfigVersion`, changeable on review — not buried as magic numbers in cron scripts.

Implementation runs as a scheduled Postgres job (`pg_cron` on Supabase or a scheduled Edge Function), executed daily, NULL-deleting feeling fields older than the TTL.

**Recipe metadata pinning — `sessions.match_recipe`.** Replay is only useful if reproduction is *faithful*. A new column on `sessions`, frozen at session creation, stores the active recipe at match time:

```
sessions.match_recipe JSONB NOT NULL
-- {
--   matchConfigVersion, embeddingModelId, taggerModelId, rerankModelId,
--   projectionSchemaVersion, expansionEnabled, rerankTopK, crisisRegexVersion
-- }
```

Replay reads this column and reconstructs the matcher with the *original* versions. Without recipe pinning, every config bump silently invalidates every prior session for replay reproducibility — and we'd never notice we'd lost it until we needed it.

**Replay is the only path that touches sensitive data outside the live match.**

```
npx tsx scripts/replay-match.ts <sessionId> --include-sensitive-local-trace
```

Replay fetches `sessions.feeling` (if not yet NULL'd by retention), reads `sessions.match_recipe`, reconstructs the matcher, and writes a full trace to `logs/match-traces.jsonl`. Without the explicit flag, replay produces structured-only output even locally. Each invocation appends a row to `logs/replay-audit.jsonl` (`{ sessionId, purpose, actor, createdAt }`) — append-only, gitignored. This is the *auditable path* that production traces deliberately don't provide: every read of user disclosure is intentional, flagged, and trail-logged.

**Crisis flow is the strictest path of all.** Crisis input *persists nowhere*: when `classifyCrisis` matches, no `sessions` row is written, no embedding is computed, no LLM call is made. This means crisis false positives cannot be debugged via replay — by design. The exhaustive trace shape for crisis:

```
{ crisisDetected: true, crisisRegexVersion, latencyMs }
```

No matched-pattern enum, no reason category, no phrase index. The crisis regex is debugged offline against `evals/crisis-regex.yaml` — synthetic inputs treated as a *safety regression* set, separate from `evals/match.yaml`. False positives are acceptable; false negatives are not.

**Privacy regression tests.** The taint invariant is enforced by schema-level CI tests rather than per-call discipline. Tests assert that the production-trace schema *throws or fails type-check* when given any of: a `feeling` field, anchor texts, projection text, expansion text, raw LLM prompt body, raw LLM response body, ranked figure-key array, raw enum tag from user classification, raw vector. One test surface catches regressions across all log call sites. Without these tests, the invariant is whatever the current author remembers it is.

### Prompt design (per role)

The product lives or dies in three system prompts. Each has a different model and a different job.

**Role 1 — Match reranker (GPT-OSS 120B, `reasoning_effort: low`).** Reads the user's feeling and the candidate figures' `biographical_facts`. Returns one chosen `figure_key`. The prompt has three jobs that are easy to get wrong:

- _Forbid lazy matches._ Bias against figures whose stories are taught in school (Lincoln, Van Gogh, Einstein) — culturally pre-packaged narratives feel hollow. Prefer obscure-but-fitting over famous-but-roughly-fitting when the fit is comparable.
- _Force balanced deliberation, not skepticism._ Skeptic prompts overcorrect into rejecting good matches. Instead require the model to surface both _the strongest reason this match resonates_ and _the strongest gap — what does this figure's struggle NOT cover that's in the user's words?_ — then commit.
- _Structured output._ JSON with `figure_key`, `resonance` (1 sentence), `gap` (1 sentence), `confidence` (low/medium/high).

Sample system prompt fragment:

> _You are matching a user's emotional disclosure to a curated set of historical figures. The user has typed an age and a short feeling. You read the candidates' biographical facts and pick the one whose specific struggle at the user's age best mirrors the user's emotional shape._
>
> _Bias against figures whose stories are taught in school. Prefer specificity over fame. If a less-famous figure has a sharper fit, choose them — recognizability adds nothing if the resonance is shallow._
>
> _Before committing, articulate two things: (1) the strongest reason this match resonates with the user's specific words, and (2) the strongest gap — what's in the user's words that this figure's struggle does NOT cover. Then commit, even if (2) is non-trivial. Do not refuse to pick._

**Role 2 — Narrative beat streaming (Llama 3.3 70B).** Reads the matched stage's `biographical_facts` + the canonical beat blueprint (`kind`, `role`, the deterministic content for narrative beats from `figure_stages.beats`) + the user's choices so far. Streams the beat. Persona-anchor system prompt is non-negotiable — Llama-without-persona produces decent prose; Llama-with-persona produces the prose this app actually needs:

> _You are a quiet historian writing one short chapter of a printed book. Constraints, all binding:_
> _— Short sentences. Concrete sensory detail (the cold of the gallery doorknob, the smell of his brother's letter). Internal states shown through small actions, never labeled. Not "he felt ashamed." Yes "he kept his hat on."_
> _— Never use: "In conclusion," "Ultimately," "It's important to note," "We can see that," "Let me tell you about." No reasoning, no caveats, no analysis._
> _— Never explain why you're telling this story. Never address the reader directly except in the final beat._
> _— Treat the page as paper. You have one chance._

**Role 3 — Bridge beat (Llama 3.3 70B, same persona + bridge addendum).** This is the only beat where new prose is generated freely (other beats use deterministic content from `figure_stages.beats`, polished by the LLM as it streams). The bridge addendum:

> _This final passage speaks directly to the reader, in second person. Weave the reader's own words (provided below verbatim) back into the figure's lesson — not by quoting them, but by echoing their shape. Two short paragraphs. End on a sentence the reader can carry with them, not a moral._
>
> _The reader wrote, at age {age}: "{feeling}"_

### Decision-beat truthful-history rule (unchanged)

Decision beats use **truthful history**: the user picks; the next beat reveals what really happened. When the user's pick matches reality, that's affirming. When it differs, the narrative says "you would have stopped here — they didn't, and this is why," which is often more powerful than a match. We don't fabricate alternate histories. The stage's `decision_continuations` JSONB field stores per-option continuations, with `realChoice` flagging which option matches reality.

### LLM stubbing (v1) and the provider toggle

The LLM layer lives behind one interface in `lib/llm.ts`:

```ts
export interface LLM {
  // Role 1: pick the best stage from candidates (GPT-OSS in real mode)
  pickFigure(input: {
    age: number;
    feeling: string;
    candidates: FigureStageRow[]; // already filtered by wide age hard gate
  }): Promise<{
    figureKey: string;
    stageId: string;
    resonance: string;
    gap: string;
    confidence: "low" | "medium" | "high";
  }>;

  // Role 2/3: stream a beat (Llama in real mode). beat.kind === "bridge" triggers the addendum.
  streamBeat(args: {
    session: Session;
    stage: FigureStageRow;
    beat: BeatBlueprint;
    userChoice?: string;
  }): AsyncIterable<string>;
}
```

A separate `lib/embeddings.ts` exposes:

```ts
export interface Embedder {
  readonly modelId: string; // e.g. "gemini-embedding-001@2026-Q2-d1536"; written into figure_shape_embeddings.model_id
  readonly dim: number; // 1536 for Gemini, 1024 for Voyage
  embedDocuments(texts: string[]): Promise<number[][]>; // RETRIEVAL_DOCUMENT / input_type=document, L2-normalized
  embedQuery(text: string): Promise<number[]>; // RETRIEVAL_QUERY / input_type=query, L2-normalized
}
```

The embedding provider switches via `EMBEDDING_PROVIDER=stub | gemini | voyage` (default `stub`). `lib/embeddings-stub.ts` returns a zero vector with `modelId="stub@v0"` so callers can no-op the vector branch in dev. `lib/embeddings-real.ts` implements both Gemini (`gemini-embedding-001` at 1536 dim) and Voyage (`voyage-4-lite` at 1024 dim) behind one switch keyed on `EMBEDDING_PROVIDER`. The schema does NOT commit to a single dim — `figure_shape_embeddings.embedding` is an untyped `vector` and partial HNSW indexes are built per `(model_id, dim)`, so multiple embedders coexist for side-by-side eval. The active model is selected via `set local app.embedding_model = '<modelId>'` before retrieval.

**Stub mode (`LLM_PROVIDER=stub`, default):**

- `pickFigure` does keyword routing on the candidate stages' `themes[]` arrays — `achievement|nothing` → prefer stages tagged `worthlessness`, `art|reject` → `creative_dismissal`, `grief|loss` → `grief_loss_of_parent`. If no theme hits, return the candidate stage whose `age_min`/`age_max` center is closest to `user_age`.
- `streamBeat` reads `stage.beats[beatIndex].text` (or the user-choice continuation from `stage.decision_continuations`) and yields word-by-word with `await sleep(40)`. Real streaming, not fake-after-the-fact.
- The bridge beat in stub mode uses a templated string with the user's feeling spliced in at one location — enough to test the wiring; the real bridge prose only appears in `LLM_PROVIDER=real`.

**Real mode (`LLM_PROVIDER=real`):**

- `pickFigure` calls Groq's GPT-OSS 120B (`reasoning_effort: low`) with the rerank system prompt + candidate stages' `biographical_facts` (NOT `shape_sentences`, NOT facet text — the data echo defense).
- `streamBeat` calls Groq's Llama 3.3 70B with the persona-anchor system prompt and the figure context.

**Crisis classifier** stays a regex check in `lib/safety.ts` regardless of provider — it's deliberately not LLM-based to avoid latency and false-negative risk.

Swap-in path: a `LLM_PROVIDER` env var picks `stub` | `real`. **No code outside `lib/llm.ts` and `lib/embeddings.ts` knows which provider, model, or even whether an LLM ran.**

### Safety floor

On `/api/match`, run a deterministic regex check (`lib/safety.ts`) on the intake before any LLM call. If the input contains crisis signals (active self-harm or suicidality), the app shows crisis resources first and offers the story as a follow-up — it does not skip straight to a historical narrative. This is a hard requirement for an app aimed at people in pain.

Regex over LLM-classifier here is deliberate: the safety floor must not depend on LLM availability, latency, or false negatives. Pessimistic by design — false positives are acceptable, false negatives are not.

### Frontend feel

- Single column, generous line-height, serif body type (e.g. Source Serif), sans for UI.
- Soft palette: warm off-white background, ink-dark text, one accent color (muted amber or dusk blue).
- Beats fade in as text streams. "Continue" is a quiet, large button — no progress bar, no gamification.
- Decision options render as three softly bordered cards. Hover lifts gently. After picking, the unchosen options fade and the next beat begins.
- No avatars, no emojis, no AI-chat affordances. It should feel like reading a small book someone wrote for you.

## File layout (target)

```
onward/
├─ app/
│  ├─ page.tsx                       # intake form
│  ├─ story/[sessionId]/page.tsx     # story player
│  ├─ api/match/route.ts             # POST: safety check, candidate filter, pickFigure, persist
│  ├─ api/beat/route.ts              # POST: stream next narrative beat
│  └─ api/choose/route.ts            # POST: record choice, stream next beat
├─ lib/
│  ├─ llm.ts                         # LLM interface (tagAndExpand, pickFigure, streamBeat) + provider switch
│  ├─ llm-stub.ts                    # v1 default: keyword routing + word-stream from DB
│  ├─ llm-real.ts                    # Llama 3.3 70B + GPT-OSS 120B + Llama 3.1 8B via Groq
│  ├─ embeddings.ts                  # Embedder interface (modelId, dim, embedDocuments, embedQuery) + provider switch
│  ├─ embeddings-stub.ts             # modelId="stub@v0", returns zero vector → matching skips vector branch
│  ├─ embeddings-real.ts             # Gemini gemini-embedding-001@1536 (primary) + Voyage voyage-4-lite@1024 (challenger)
│  ├─ matching.ts                    # retrieval orchestrator: filter → tag/project → per-lane quotas → dynamic-weighted RRF → rerank → framing
│  ├─ match-config.ts                # BASE_WEIGHTS, WEIGHT_BOUNDS, λ formula, lane quotas, theme λ + clamp, projection schema version, expansionEnabled, rerank top-K, retention TTLs, matchConfigVersion
│  ├─ match-config.test.ts           # invariant + determinism tests for the weighter and the bounded-normalization helper
│  ├─ rrf.ts                         # reciprocal rank fusion, k=60 default; dynamic-weighted variant for Stage B
│  ├─ themes.ts                      # controlled vocabulary of emotional themes (positive + antiTheme name space)
│  ├─ sensitive.ts                   # privacy taint model: opaque wrappers (SensitiveRaw, SensitiveDerivedText, SensitiveDerivedTags, SensitiveDerivedVector) with named unwrap exits
│  ├─ trace.ts                       # string-hostile production-trace schema + reduction helpers (asEnum, asFigureKey, asConfigVersion, asBucket); writeProdTrace is the only path
│  ├─ trace.test.ts                  # privacy regression tests: schema rejects feeling, anchors, projection text, raw enum tags, raw vectors, prompt bodies, raw exception objects
│  ├─ db.ts                          # Supabase: sessions (with match_recipe) + match_misses + figure_editorial_warnings (server-only)
│  ├─ figures.ts                     # typed accessors: listByAge, getByKey, vectorSearch, facetSearch, themeSearch, toClientOutline
│  └─ safety.ts                      # crisis regex check (deterministic, non-LLM); never persists; emits only { crisisDetected, crisisRegexVersion, latencyMs }
├─ scripts/
│  ├─ research-figure.ts             # offline: Llama drafts a candidate FigureRow JSON to scripts/drafts/
│  ├─ check-figure.ts                # offline: structural + style validation (called by seed-figure.ts)
│  ├─ seed-figure.ts                 # offline: validates, embeds, inserts row with version metadata
│  ├─ reembed.ts                     # offline: refresh embeddings after provider swap or content edits
│  ├─ eval-match.ts                  # offline: run evals/match.yaml through matching.match(), report metrics across the three expansion configs
│  ├─ eval-crisis.ts                 # offline: run evals/crisis-regex.yaml through safety.classifyCrisis; safety regression — false-negatives fail the build
│  ├─ replay-match.ts                # auditable replay: SELECT feeling FROM sessions, reconstruct via match_recipe, --include-sensitive-local-trace gates writes
│  └─ drafts/                        # uncommitted human-editing workspace (gitignored except .gitkeep)
├─ evals/
│  ├─ match.yaml                     # 30-50 gold (age, feeling) → expected_figure pairs, incl. 5-10 deliberate misses; FacetsRAG hard-negative pairs labeled by what they measure
│  ├─ crisis-regex.yaml              # synthetic crisis inputs; treated as safety regression, separate from match eval
│  └─ runs/                          # JSON dumps of past eval runs, for diffing
├─ logs/
│  ├─ match-traces.jsonl             # dev-only full traces; written ONLY under replay-match.ts --include-sensitive-local-trace; gitignored, 90-day local rotation
│  └─ replay-audit.jsonl             # append-only audit log: one row per replay invocation; gitignored
├─ components/
│  ├─ IntakeForm.tsx
│  ├─ StoryBeat.tsx                  # streams text in
│  ├─ DecisionCards.tsx
│  └─ CrisisCard.tsx
├─ .env.local                        # see Step 0 for full var list
├─ tailwind.config.ts
├─ package.json
└─ README.md
```

## Verification

Acceptance criteria (highlights):

1. `npm run dev`, open `http://localhost:3000`. With `LLM_PROVIDER=stub` and seeded `figures` + `figure_stages` tables, the full flow should work end-to-end.
2. "17, no achievements" → match lands on a stage tagged `worthlessness` or `no_achievements`. Walk all 8 or 9 beats (per the matched stage's `arc_variant`); 1 or 2 decision beats appear; opposite-of-real picks open with contrast wording; final beat references the user's words.
3. Crisis-signal input → `<CrisisCard>` first; no `sessions` row written. Trace contains only `{ crisisDetected, crisisRegexVersion, latencyMs }`.
4. Refresh mid-story → resumes from `last_beat_index`. Bad sessionId → "story has drifted away" empty state (404, not 500).
5. **Anti-echo invariant (real mode)** — trace the rerank API call; request body contains `biographicalFacts`, never `shapeSentences`, never facet text, never tagger output.
6. **Privacy taint invariant** — `lib/trace.test.ts` rejects `feeling`, anchor texts, projection text, expansion text, raw LLM prompt/response bodies, ranked figure-key arrays, raw enum tags from user classification, and raw vectors. Schema-level fail is the test pass.
7. **Recovery-asymmetry invariant** — eval the multi-lane retrieval against the FacetsRAG hard-negatives in `evals/match.yaml`. Quotas constant in `match-config.ts`; verify a strong-on-one-lane test case stays in the deduped pool even when other lanes score it low.
8. **Replay reproducibility** — `scripts/replay-match.ts <sessionId>` (without `--include-sensitive-local-trace`) reads `sessions.match_recipe`, runs the matcher, produces a structured-only trace whose `chosenFigureKey` matches the original. Adding the flag produces full local traces; appends one row to `logs/replay-audit.jsonl`.
9. **Retention enforcement** — manually inserting a row with `created_at` > 60 days into `sessions` and running the retention job NULLs the `feeling` column while preserving structural fields.
10. **Crisis safety regression** — `npx tsx scripts/eval-crisis.ts` against `evals/crisis-regex.yaml`; zero false negatives required. False positives logged but not failing.

## Out of scope for v1

- Accounts and authenticated user histories (sessions are anonymous, addressable by id).
- Sharing, public story pages.
- Multiple stage suggestions (we commit to one match — indecision dilutes the emotional arc).
- Voice narration.
- Encryption-at-rest for `feeling` (revisit if accounts are added).
- An admin UI for figures, stages, and `match_misses` (raw Supabase dashboard is fine for a single editor).
- A second eval set for prose quality (the persona-anchor compliance check). Style regex in `check-figure.ts` covers the cheap detection; deeper "show, don't tell" checking stays manual.
- **Multi-stage figures** (deferred to v2 as a content-expansion task, not a v1 capability). One figure carrying multiple emotional episodes — e.g., "Lincoln in his 30s, when his career stalled" alongside "Lincoln during the war." v1 ships one stage per figure; v2 lets editors author additional stages over time without schema migration (additive rows). Two- and three-plus-fork variants beyond `single_fork` / `double_fork` (`"ambiguous_turn"` for figures whose turn is gradual, `"compressed_struggle"` for sparse middles, etc.) are also deferred behind eval evidence — a `arc_variant` value is added only when an existing variant demonstrably fails to capture a class of biographies.

