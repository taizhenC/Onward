# Plan: Onward — an emotional-companion app

## Context

The user wants an AI web app for people who are feeling down. A user enters their age and a short description of what they're going through. The app finds a real historical figure who, at the same age, faced a genuinely similar emotional situation, and tells that figure's story as a warm narrative — from the dark moment, through the struggle, to the turning point, to who they became — ending with a personal bridge back to the user.

The user added a key feature: **author mode**. After the figure is matched, the user is walked through that figure's life as a series of beats. Most beats are narrated. At a few real fork-points in the figure's life, the user is shown 2–3 choices and picks one — making them feel like they are leading the story rather than reading it. The point is momentum: someone hurting should feel like they have agency, even inside someone else's life.

The product purpose is heart-healing, so the frontend has to feel calm, dignified, and beautiful — not like a chatbot.

This directory (`D:\code_save\onward`) is currently empty. Nothing to reuse — building from scratch.

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
- **Database: Supabase (Postgres + pgvector)** — stores sessions, choices, the curated figures library, and unmet-match logs. Browser never talks to Supabase directly; all reads/writes go through Next.js API routes using the **service role key**. RLS on, default-deny for the anon role. pgvector extension for semantic figure retrieval at v2 scale.

### High-level flow

```
┌─ Intake (age + feeling) ──────────────────────────────────┐
│                                                            │
│  POST /api/match                                           │
│    1. Rate-limit by IP (5/hr, 30/day).                     │
│    2. classifyCrisis(feeling). If crisis → return          │
│       resources, persist nothing.                          │
│    3. Hard filter: figures within ±3 years of user_age,    │
│       status='published'.                                  │
│    4. tagAndExpand(feeling) → { tags, expansion, anchors,  │
│       confidence } | null. Best-effort, hard-fail-fast.    │
│    5. Retrieval:                                           │
│       v1 (≤20 figures or stub embedder):                   │
│         pass filtered candidates straight to rerank.       │
│       v2 (>20 figures, real embedder):                     │
│         hybrid — embed(raw feeling) and embed(expansion)   │
│         as RETRIEVAL_QUERY, search per-sentence document   │
│         vectors, aggregate sentence-level hits per figure  │
│         (max + α·second_max), RRF-fuse raw vs expansion    │
│         lanes, take top 10.                                │
│    6. Rerank (GPT-OSS 120B): reads raw feeling +           │
│       candidates' biographical_facts. NEVER sees tags,     │
│       expansion, or shape_sentences. Returns figureKey,    │
│       resonance, gap, confidence.                          │
│    7. If confidence: low → log to match_misses,            │
│       framing="partial". Else framing="definitive".        │
│    8. db.createSession() → sessionId.                      │
│    9. Return { sessionId, figure, outline, framing }.      │
│                                                            │
│  Story player reveals beats one at a time.                 │
│   - Opening copy diverges by framing:                      │
│       definitive → "X felt something close to this..."     │
│       partial    → "...a fragment whose struggle rhymes."  │
│   - NARRATIVE beat: stream prose, "Continue" btn.          │
│   - DECISION beat: show 2-3 options, user picks.           │
│                                                            │
│  POST /api/beat / /api/choose                              │
│    → Llama 3.3 70B streams beat prose. Beats 1-8 read      │
│      deterministic content from figure.beats. Beat 9       │
│      ("bridge to you") is the only freely-generated beat;  │
│      weaves the user's intake words back into the lesson.  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Beat structure (the canonical arc)

1. **Scene** (narrative) — figure at the user's exact age, the world they're in.
2. **The dark moment** (narrative) — mirrors the user's intake feeling.
3. **First fork** (decision) — a real fork-point in the figure's life. User picks.
4. **What they actually did** (narrative) — confirms or gently contrasts with the user's pick.
5. **The struggle** (narrative) — the slog, doubt, setbacks.
6. **Second fork** (decision) — another pivotal real moment.
7. **The turning point** (narrative) — what shifted.
8. **What they became** (narrative) — the legacy in one short paragraph.
9. **Bridge to you** (narrative, second-person) — personalized closing.

Decision beats use **truthful history**: the user picks; the next beat reveals what really happened. When the user's pick matches reality, that's affirming. When it differs, the narrative says "you would have stopped here — they didn't, and this is why," which is often more powerful than a match. This has to be the design philosophy because the figure is real; we don't fabricate alternate histories.

### Matching architecture (RAG, two-stage)

The whole product hinges on matching a user's specific feeling to a real figure. Lazy matches kill the app. The architecture splits the matching problem into stages so each stage uses the right tool.

**Curated figure library (Supabase `figures` table).** Every figure has two distinct text fields, deliberately separated:

- `shape_sentences[]` — 2–3 short, sensory sentences capturing the figure's emotional shape at the relevant age. _Llama-drafted, human-polished (≈5 min/figure)._ Each sentence is embedded individually (one row per sentence in `figure_shape_embeddings`) with `task_type=RETRIEVAL_DOCUMENT` / `input_type=document`, then L2-normalized at write time. **Used only for retrieval.**
- `biographical_facts` — a hand-curated factual paragraph from primary sources (dates, quotes from real letters, named events). **Used only for rerank prompting and beat generation.**

The split is the architectural anti-echo defense: the rerank LLM never sees the same text the embedding step saw. If shapes were both embedded _and_ shown to the rerank LLM, we'd be asking the LLM to confirm what cosine similarity already said — redundant and biased toward Llama's writing style.

**Matching pipeline:**

| Stage                      | Library size                | What runs                                                                                                                                                                                                                                                                                                                                                               | Why                                                                                                                                                                                                                                               |
| -------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Filter                     | any                         | SQL: `WHERE age_min <= user_age AND age_max >= user_age AND status='published'`                                                                                                                                                                                                                                                                                         | Hard age constraint — the entire premise is "at the same age." Cheap, deterministic.                                                                                                                                                              |
| Tag & expand               | any                         | Llama 3.1 8B turns raw feeling into `{ tags, expansion, anchors, confidence }`. Hard-failure rules; null result is fine.                                                                                                                                                                                                                                                | The user's surface words may not match the domain vocabulary the figures are written in. Expansion bridges that gap, with `anchors` grounding it to verbatim user phrases.                                                                        |
| Hybrid retrieval (v2 only) | >20 figures + real embedder | Embed BOTH `raw feeling` AND `expansion` as `RETRIEVAL_QUERY` / `input_type=query`. Search per-sentence document vectors in `figure_shape_embeddings`. Aggregate sentence-level hits to figure-level scores via `score(figure) = max_s sim(q,s) + α·second_max_s sim(q,s)` (defaults α=0.15, tuned on eval set). RRF-fuse the raw lane and the expansion lane → top 10. | Pure expansion-only makes the tagger a single point of failure; pure-raw misses concept-level matches. Per-sentence retrieval keeps distinct sensory anchors discoverable individually. Hybrid degrades gracefully when the tagger misclassifies. |
| Rerank                     | any                         | GPT-OSS 120B reads RAW feeling + candidates' `biographical_facts` + grading scalars (`narrativeDynamism`, `canonExposure`). Returns `{ figureKey, resonance, gap, confidence }`.                                                                                                                                                                                        | Tagger output never reaches this stage. Rerank is grounded on what the user actually said; tags would propagate stage-1 bias into stage 2.                                                                                                        |
| Miss log + framing         | confidence: low             | Insert into `match_misses`; set `framing: "partial"` so the UI tells the user honestly.                                                                                                                                                                                                                                                                                 | A weak match presented as a definitive mirror corrodes trust faster than no match.                                                                                                                                                                |

**v1 simplification:** when the library is ≤20 figures or the embedder is the stub, the SQL filter typically returns most of the library anyway. Skip vector retrieval entirely — shape AND facet lanes both stay dormant — and pass all filtered candidates straight to the rerank LLM. `figure_shape_embeddings` and `figure_facet_embeddings` stay empty until library grows past ~20 AND a real embedder is configured, at which point `scripts/reembed.ts` backfills.

### FacetsRAG — typed facet micro-documents per figure

Layered onto shape-sentence retrieval. Each figure carries five typed facet rows in addition to its `shape_sentences`; each facet is its own embedding, retrieved on its own lane, then weight-fused into one dense rank. Facets add interpretability and improve retrieval recall on dimensions that pure shape retrieval blurs: same trigger, different emotional core; same emotional core, different decision shape.

**The load-bearing rule (do not loosen without re-deriving everything below):** _retrieval failures are unrecoverable; rerank failures are correctable._ If wrong dynamic weights push the correct figure out of the top-12 shortlist, rerank never sees it — game over. If a missed boost demotes the correct figure from rank 3 to rank 8, rerank still gets it and recovers. This asymmetry is why every v1 number below is conservative: passive λ, tight bounds, strict gates. Future tuning may loosen specific constants if eval data justifies it; the asymmetry rule itself does not loosen.

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
- **Substantiability:** every facet must be supported by a passage in `biographical_facts`. If a facet says something the source paragraph doesn't establish, either add the fact or rewrite the facet.

Example:

```
emotional_core:    He began to believe the delay meant something permanent about his worth.
decision_shape:    Whether to disappear from public effort or keep taking small practical risks.
trigger_event:     A public failure after others his age seemed to be moving forward.
agency_state:      Stuck, exposed, and unsure whether the next attempt would matter.
```

**Tagger output schema** (consumed by the dynamic weighter; never reaches the rerank LLM):

```ts
type FacetSignal = {
  confidence: number; // 0..1
  dominantMode:
    | "emotional_core"
    | "decision_shape"
    | "trigger_event"
    | "agency_state"
    | "unclear";
  facetImportance: {
    // each 0..1, unconstrained — bounded normalization handles the sum
    emotional_core: number;
    decision_shape: number;
    trigger_event: number;
    agency_state: number;
  };
  anchors: {
    // verbatim substrings from the raw user input
    emotional_core: string[];
    decision_shape: string[];
    trigger_event: string[];
    agency_state: string[];
  };
};
```

Validation (any failure → return `null`, fall back to base weights, no retry):

- `confidence ≥ 0.55`
- ≥ 2 lanes have `importance ≥ 0.30`
- Every lane with `importance ≥ 0.30` has at least one anchor
- Every anchor is an exact substring of the raw user input
- All `importance` values in `[0, 1]`
- JSON parses

`shape` does not appear in `facetImportance`. Shape is the holistic prior — never weighed up or down by the tagger. Its weight only adjusts as a consequence of bounded renormalization after other lanes shift.

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

**Retrieval pipeline (what `lib/matching.ts` does once facet retrieval is on):**

1. Hard age + status filter.
2. Embed `raw user feeling` once as `RETRIEVAL_QUERY` — same query vector goes against every lane.
3. Five vector searches, each against its own partial HNSW: shape (top-30), `emotional_core` (top-30), `decision_shape` (top-30), `trigger_event` (top-30), `agency_state` (top-30).
4. Aggregate to figure-level: per figure, `denseScore = Σ_lane weight_lane · max_score_in_lane`. Max-not-mean is the same rule as for shape sentences — averaging blurs anchors.
5. BM25 (`tsvector` + `ts_rank_cd`) over `biographical_facts` for keyword evidence. **BM25 reads `biographical_facts`, not facet text** — facets are for retrieval, biographical_facts is the source-verified truth surface.
6. RRF-fuse the dense rank with the BM25 rank → top 12.
7. Rerank reads raw feeling + `biographical_facts` only. Tagger output, facet labels, dynamic weights, expansion text — none of these reach the reranker. The anti-echo rule extends across both stages.

**Wide candidate recall, narrow rerank input.** Top-30 per lane → ~50–80 unique figures after dedup → top-12 to rerank. Cutting per-lane below ~30 risks dropping the correct figure that ranked moderate on the dominant lane. Cost: ~5 HNSW queries × ~50 ms = ~250 ms.

**Asymmetric encoding + L2 normalization apply to facets identically to shape sentences.** Each facet text is a _document_ at seed time (`task_type=RETRIEVAL_DOCUMENT` for Gemini; `input_type=document` for Voyage), normalized at write. The query is a _query_. No exceptions for facets.

**Seed/publish gates** (enforced in `scripts/check-figure.ts` + `scripts/seed-figure.ts`):

- `figure.shapeSentences.length` in `[2, 3]`
- All four `figures.facets.*` keys present and non-empty (`emotional_core`, `decision_shape`, `trigger_event`, `agency_state`)
- An embedding row exists for the active `model_id` for shape AND every facet
- Every embedded row's `content_hash` matches its current source text

Missing any of these → seed fails. No `--force` override. Facet integrity is a publish-time concern, not a runtime one.

**Runtime soft-fail + editorial feedback loop.** If a published figure is somehow missing a facet at match time (publish-gate bypass, partial migration, embedder rollout in progress), the matcher fails soft: upsert a row in `figure_editorial_warnings` (deduplicated on `(figure_key, warning_type, active_model_id)`) and exclude that figure from dynamic facet scoring. It still participates via shape, biographical_facts, and BM25. Serving stays reliable; the bad row surfaces for editorial repair. Schema in Step 3.5; warnings live in their own table so the figures row stays read-only on the hot match path.

**Trace fields on every match** (logged structurally; raw feeling never logged):

```
{ sessionId, modelId, matchConfigVersion, taggerOk, taggerConfidence,
  dominantMode, lambda, baseWeights, dynamicWeights, denseTop10,
  bm25Top10, finalTop12, chosenFigure, framing, latencyMs }
```

`matchConfigVersion` is the key field — a string like `"facets-v1-passive-2026-05"`, bumped on every constant change, never reused. Lets you replay any past trace against any new config and answer "would this config have caught it?" Required for principled tuning.

**FacetsRAG-specific eval hard negatives.** Beyond the existing hard-negative pairs (Step 12), include cases that test each lane independently. Label every test with what it measures, otherwise eval results are uninterpretable:

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
- More than 5 facets.
- Per-facet embedders (one embedder serves all lanes — same `model_id`).
- Failure-mode catalog beyond `missing_facet`, `stale_content_hash`, `missing_embedding`, `dim_mismatch` — write alongside the eval set as failure shapes emerge.

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

**Role 2 — Narrative beat streaming (Llama 3.3 70B).** Reads the figure's `biographical_facts` + the canonical beat blueprint (title, kind, the deterministic content for narrative beats from `figure.beats`) + the user's choices so far. Streams the beat. Persona-anchor system prompt is non-negotiable — Llama-without-persona produces decent prose; Llama-with-persona produces the prose this app actually needs:

> _You are a quiet historian writing one short chapter of a printed book. Constraints, all binding:_
> _— Short sentences. Concrete sensory detail (the cold of the gallery doorknob, the smell of his brother's letter). Internal states shown through small actions, never labeled. Not "he felt ashamed." Yes "he kept his hat on."_
> _— Never use: "In conclusion," "Ultimately," "It's important to note," "We can see that," "Let me tell you about." No reasoning, no caveats, no analysis._
> _— Never explain why you're telling this story. Never address the reader directly except in the final beat._
> _— Treat the page as paper. You have one chance._

**Role 3 — Bridge beat (Llama 3.3 70B, same persona + bridge addendum).** This is the only beat where new prose is generated freely (beats 1–8 use deterministic content from `figure.beats`, polished by the LLM as it streams). The bridge addendum:

> _This final passage speaks directly to the reader, in second person. Weave the reader's own words (provided below verbatim) back into the figure's lesson — not by quoting them, but by echoing their shape. Two short paragraphs. End on a sentence the reader can carry with them, not a moral._
>
> _The reader wrote, at age {age}: "{feeling}"_

### Decision-beat truthful-history rule (unchanged)

Decision beats use **truthful history**: the user picks; the next beat reveals what really happened. When the user's pick matches reality, that's affirming. When it differs, the narrative says "you would have stopped here — they didn't, and this is why," which is often more powerful than a match. We don't fabricate alternate histories. The figure's `decision_continuations` JSONB field stores per-option continuations, with `realChoice` flagging which option matches reality.

### LLM stubbing (v1) and the provider toggle

The LLM layer lives behind one interface in `lib/llm.ts`:

```ts
export interface LLM {
  // Role 1: pick the best figure from candidates (GPT-OSS in real mode)
  pickFigure(input: {
    age: number;
    feeling: string;
    candidates: FigureRow[]; // already filtered by age
  }): Promise<{
    figureKey: string;
    resonance: string;
    gap: string;
    confidence: "low" | "medium" | "high";
  }>;

  // Role 2/3: stream a beat (Llama in real mode). beat.kind === "bridge" triggers the addendum.
  streamBeat(args: {
    session: Session;
    figure: FigureRow;
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

- `pickFigure` does keyword routing on the candidate set's `themes[]` arrays — `achievement|nothing` → prefer figures tagged `worthlessness`, `art|reject` → `creative_dismissal`, `grief|loss` → `grief_loss_of_parent`. If no theme hits, return the candidate with `age_at_struggle` closest to `user_age`.
- `streamBeat` reads `figure.beats[beatIndex].text` (or the user-choice continuation from `figure.decision_continuations`) and yields word-by-word with `await sleep(40)`. Real streaming, not fake-after-the-fact.
- The bridge beat in stub mode uses a templated string with the user's feeling spliced in at one location — enough to test the wiring; the real bridge prose only appears in `LLM_PROVIDER=real`.

**Real mode (`LLM_PROVIDER=real`):**

- `pickFigure` calls Groq's GPT-OSS 120B (`reasoning_effort: low`) with the rerank system prompt + candidate `biographical_facts` (NOT `shape_sentences` — the data echo defense).
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
│  ├─ matching.ts                    # hybrid retrieval orchestrator: filter → tag/expand → 5 lanes + BM25 → RRF → rerank → framing
│  ├─ match-config.ts                # FacetsRAG: BASE_WEIGHTS, WEIGHT_BOUNDS, λ formula, bounded normalization, matchConfigVersion
│  ├─ match-config.test.ts           # invariant + determinism tests for the weighter (sum=1, no bound violations, etc.)
│  ├─ rrf.ts                         # reciprocal rank fusion, k=60 default
│  ├─ themes.ts                      # controlled vocabulary of emotional themes
│  ├─ db.ts                          # Supabase: sessions + match_misses + figure_editorial_warnings (server-only)
│  ├─ figures.ts                     # typed accessors: listByAge, getByKey, vectorSearch, facetSearch, toClientOutline
│  └─ safety.ts                      # crisis keyword check
├─ scripts/
│  ├─ research-figure.ts             # offline: Llama drafts a candidate FigureRow JSON to scripts/drafts/
│  ├─ check-figure.ts                # offline: structural + style validation (called by seed-figure.ts)
│  ├─ seed-figure.ts                 # offline: validates, embeds, inserts row with version metadata
│  ├─ reembed.ts                     # offline: refresh embeddings after provider swap or content edits
│  ├─ eval-match.ts                  # offline: run evals/match.yaml through matching.match(), report 4 metrics
│  └─ drafts/                        # uncommitted human-editing workspace (gitignored except .gitkeep)
├─ evals/
│  ├─ match.yaml                     # 30-50 gold (age, feeling) → expected_figure pairs, incl. 5-10 deliberate misses
│  └─ runs/                          # JSON dumps of past eval runs, for diffing
├─ logs/
│  └─ match-traces.jsonl             # dev-only full traces (gitignored, never ship to hosted log services)
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

1. `npm run dev`, open `http://localhost:3000`. With `LLM_PROVIDER=stub` and a seeded `figures` table, the full flow should work end-to-end.
2. "17, no achievements" → match lands on a figure tagged `worthlessness` or `no_achievements`. Walk all 9 beats; 2–3 decision beats appear; opposite-of-real picks open with contrast wording; final beat references the user's words.
3. Crisis-signal input → `<CrisisCard>` first; no `sessions` row written.
4. Refresh mid-story → resumes from `last_beat_index`. Bad sessionId → "story has drifted away" empty state (404, not 500).
5. Real-mode anti-echo defense → trace the rerank API call; request body contains `biographicalFacts`, never `shapeSentences`.

## Out of scope for v1

- Accounts and authenticated user histories (sessions are anonymous, addressable by id).
- Sharing, public story pages.
- Multiple figure suggestions (we commit to one match — indecision dilutes the emotional arc).
- Voice narration.
- Encryption-at-rest for `feeling` (revisit if accounts are added).
- An admin UI for figures and `match_misses` (raw Supabase dashboard is fine for a single editor).
- A second eval set for prose quality (the persona-anchor compliance check). Style regex in `check-figure.ts` covers the cheap detection; deeper "show, don't tell" checking stays manual.

