# Plan: Famous — an emotional-companion app

## Context

The user wants an AI web app for people who are feeling down. A user enters their age and a short description of what they're going through. The app finds a real historical figure who, at the same age, faced a genuinely similar emotional situation, and tells that figure's story as a warm narrative — from the dark moment, through the struggle, to the turning point, to who they became — ending with a personal bridge back to the user.

The user added a key feature: **author mode**. After the figure is matched, the user is walked through that figure's life as a series of beats. Most beats are narrated. At a few real fork-points in the figure's life, the user is shown 2–3 choices and picks one — making them feel like they are leading the story rather than reading it. The point is momentum: someone hurting should feel like they have agency, even inside someone else's life.

The product purpose is heart-healing, so the frontend has to feel calm, dignified, and beautiful — not like a chatbot.

This directory (`D:\code_save\famous`) is currently empty. Nothing to reuse — building from scratch.

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
famous/
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

(Full checklist lives in Step 9. Highlights:)

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

---

# Implementation Instructions

A concise, ordered build guide. Each step is a discrete unit of work; do them in order.

## Step 0 — Scaffold

```powershell
npx create-next-app@latest famous --typescript --tailwind --app --eslint --src-dir=false --import-alias="@/*"
cd famous
npm i framer-motion zod nanoid clsx @supabase/supabase-js server-only openai
npm i -D @types/node tsx
```

`openai` is installed because Groq's API is OpenAI-compatible — we use the OpenAI SDK pointed at Groq's base URL. `tsx` is for running the offline `scripts/*.ts` files directly with `npx tsx`.

Set `.env.local`:

```
# Provider toggles
LLM_PROVIDER=stub                    # stub | real
EMBEDDING_PROVIDER=stub              # stub | gemini | voyage

# Embedder model id (written verbatim into figure_shape_embeddings.model_id; routes the active partial HNSW)
EMBEDDING_MODEL_ID=gemini-embedding-001@2026-Q2-d1536

# Supabase (Step 3.5)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...     # server-only, never expose to browser

# Groq (used when LLM_PROVIDER=real, Step 10)
GROQ_API_KEY=gsk_...
LLM_MODEL_PROSE=llama-3.3-70b-versatile
LLM_MODEL_RERANK=openai/gpt-oss-120b
LLM_MODEL_TAGGER=llama-3.1-8b-instant       # tagAndExpand role; small model is correct here

# Embedders (used when EMBEDDING_PROVIDER != stub)
GEMINI_API_KEY=...                          # primary; gemini-embedding-001 @ 1536 dim
VOYAGE_API_KEY=...                          # challenger; voyage-4-lite @ 1024 dim
```

## Step 1 — Types & contracts (`lib/types.ts`)

Define the shapes everything else depends on. Lock these first.

```ts
type BeatKind = "narrative" | "decision" | "bridge"; // bridge = final personalized beat

type BeatBlueprint = {
  index: number; // 0..8
  kind: BeatKind;
  title: string;
  options?: string[]; // decision beats only
  text?: string; // narrative deterministic content (server-only)
  realChoice?: string; // decision beats: which option matches reality (server-only)
};

// Mirrors a row in the `figures` table. The two text fields are deliberately
// distinct: shape_sentences exist to be embedded; biographical_facts exist
// to be read by the rerank LLM. Never mix them.
type FigureRow = {
  key: string; // e.g. "vanGogh_1870_dismissal"
  name: string;
  lived: string; // "1853–1890"
  ageAtStruggle: number;
  ageMin: number;
  ageMax: number;
  themes: Theme[]; // controlled vocabulary, see lib/themes.ts
  era: string;
  oneLine: string; // shown to LLM during fallback matching only

  // Anti-echo split: shape + facets go to the embedder, facts go to the rerank LLM.
  shapeSentences: string[]; // 2-3 sentences. Each embedded individually (see ShapeEmbeddingRow). Never shown to rerank LLM.
  biographicalFacts: string; // hand-curated, primary-source paragraph. Read by rerank + beat-streaming. Never embedded.

  // Five typed facets layered onto shape retrieval. See Architecture > FacetsRAG
  // for authoring rules. Each is one sentence (12-28 words), an editorial
  // *interpretation* of biographicalFacts (substantiability rule). Embedded
  // individually in figure_facet_embeddings. Never shown to rerank LLM.
  facets: {
    emotional_core: string;
    decision_shape: string;
    trigger_event: string;
    agency_state: string;
  };

  beats: BeatBlueprint[]; // exactly 9
  decisionContinuations: Record<number, Record<string, string>>;
  // { beatIndex: { optionText: continuationText, ... } }

  // No embedding fields on FigureRow. Shape vectors live in figure_shape_embeddings,
  // facet vectors live in figure_facet_embeddings. See ShapeEmbeddingRow / FacetEmbeddingRow.

  // Hand-graded scalars used by rerank (belt + suspenders for prompt-only rules).
  narrativeDynamism: 1 | 2 | 3; // 1=flat, 2=solid, 3=exceptional arc
  canonExposure: 1 | 2 | 3; // 1=obscure, 2=known, 3=textbook-canon

  status: "draft" | "published";
};

// One row per (figure × shape sentence × embedder model_id). Lives in figure_shape_embeddings.
// Mixed-dim coexistence is intentional — Gemini at 1536 and Voyage at 1024 sit in the
// same table, gated apart by partial HNSW indexes per (model_id, dim).
type ShapeEmbeddingRow = {
  figureKey: string; // FK to figures(key)
  shapeIndex: number; // 0..2 — which sentence within the figure
  modelId: string; // canonical id, e.g. "gemini-embedding-001@2026-Q2-d1536"
  dimension: number; // must equal embedding.length AND match the partial HNSW for this model_id
  inputType: "search_document"; // documents only; queries are not stored
  contentHash: string; // sha256(<single shape sentence>); detects sentence edits without re-embed
  embedding: number[]; // L2-normalized at write time
  createdAt: string; // ISO timestamp
};

// One row per (figure × facet_type × embedder model_id). Lives in figure_facet_embeddings.
// Mirrors ShapeEmbeddingRow exactly except keyed on facet_type instead of shape_index.
// Same mixed-dim coexistence rules; same partial HNSW gating per (model_id, dim).
type FacetType =
  | "emotional_core"
  | "decision_shape"
  | "trigger_event"
  | "agency_state";

type FacetEmbeddingRow = {
  figureKey: string;
  facetType: FacetType; // shape lives in figure_shape_embeddings, not here
  facetText: string; // the editorial micro-document; substantiable from biographicalFacts
  modelId: string;
  dimension: number;
  inputType: "search_document";
  contentHash: string; // sha256(<facet_text>); re-embed on edit
  embedding: number[]; // L2-normalized at write
  createdAt: string;
};

// Tagger → dynamic-weighter contract. Built by lib/llm.ts#tagAndExpand,
// consumed by lib/match-config.ts. NEVER reaches the rerank LLM.
// Validation: confidence ≥ 0.55, ≥2 lanes ≥ 0.30, every used lane has at least
// one anchor that is an exact substring of the raw user input. Any failure → null.
type FacetSignal = {
  confidence: number; // 0..1
  dominantMode: FacetType | "unclear";
  facetImportance: { [K in FacetType]: number }; // each 0..1, unconstrained
  anchors: { [K in FacetType]: string[] }; // verbatim substrings from raw user input
};

type Session = {
  id: string;
  age: number;
  feeling: string;
  figureKey: string; // FK into figures
  figureName: string; // denormalized
  choices: Record<number, string>; // beatIndex → chosen option
  lastBeatIndex: number;
  crisisFlagged: boolean;
  createdAt: number;
  updatedAt: number;
};

// What the client receives from /api/match — outline only, no spoilers.
type MatchResponse = {
  sessionId: string;
  figure: { name: string; lived: string; atUserAge: string };
  outline: Array<Pick<BeatBlueprint, "index" | "kind" | "title" | "options">>;
  framing: "definitive" | "partial"; // drives copy: "your story" vs "a fragment that rhymes"
};
```

`text`, `realChoice`, `decisionContinuations`, and `biographicalFacts` are **server-side only** — strip before any client response. Stripping is centralized in `lib/figures.ts` to avoid leak-by-forgetting. Embeddings live in a separate table and are never read by client paths to begin with.

## Step 2 — Safety check (`lib/safety.ts`)

```ts
const CRISIS = [
  /kill myself/i,
  /suicide/i,
  /end it all/i,
  /don'?t want to live/i,
  /want to die/i,
  /hurt myself/i,
];
export function classifyCrisis(text: string) {
  const reasons = CRISIS.filter((r) => r.test(text)).map((r) => r.source);
  return { crisis: reasons.length > 0, reasons };
}
```

Pessimistic by design — false positives are acceptable, false negatives are not.

## Step 3 — Database access (`lib/db.ts` + `lib/figures.ts`)

Two server-only modules over Supabase, splitting concerns:

**`lib/db.ts`** — sessions and miss logging:

```ts
export interface Db {
  createSession(input: {
    age: number;
    feeling: string;
    figureKey: string;
    figureName: string;
    crisisFlagged: boolean;
  }): Promise<string>; // returns sessionId
  getSession(id: string): Promise<Session | null>;
  recordChoice(id: string, beatIndex: number, choice: string): Promise<void>;
  setLastBeat(id: string, beatIndex: number): Promise<void>;
  logMatchMiss(input: {
    age: number;
    feeling: string;
    reason: string; // "no candidate above threshold" | "no candidates in age range"
    closestFigureKey?: string;
  }): Promise<void>;
}
```

**`lib/figures.ts`** — the curated library:

```ts
export interface Figures {
  listByAge(age: number, slack?: number): Promise<FigureRow[]>; // default slack ±3
  getByKey(key: string): Promise<FigureRow | null>;
  vectorSearch(
    queryEmbedding: number[],
    age: number,
    modelId: string, // routes to the partial HNSW for this (model_id, dim)
    k?: number, // returns top-k figures, not sentences (sentence-level hits aggregated)
  ): Promise<Array<{ figure: FigureRow; topSim: number; secondSim: number }>>;
  // v2: per-sentence cosine over figure_shape_embeddings,
  // aggregated to figure-level via max + α·second_max,
  // age-filtered. See lib/matching.ts for the score formula.
  toClientOutline(figure: FigureRow): MatchResponse["outline"];
  // strips server-only fields. Use this everywhere.
}
```

Behavior notes:

- `getSession` and `getByKey` return `null` (not throws) when an id is unknown — API turns null into 404.
- `recordChoice` does an atomic JSONB update: `choices = choices || jsonb_build_object(beatIndex::text, choice)`.
- `setLastBeat` uses `last_beat_index = GREATEST(last_beat_index, :new)` so retries are idempotent.
- `vectorSearch` issues a `set local app.embedding_model = :modelId` then uses pgvector's `<=>` (cosine distance) operator over `figure_shape_embeddings`, joining back to `figures` and aggregating per-sentence hits per figure with `max + α·second_max`. v1 callers may not invoke it — `lib/matching.ts` decides based on library size.
- `toClientOutline` is the single chokepoint for stripping server secrets (`text`, `realChoice`, `decisionContinuations`, `biographicalFacts`, `shapeSentences`). Embeddings are never on `FigureRow` to begin with. All API responses pass through it.

Implementation uses `@supabase/supabase-js`. The client must be a **singleton** to survive Next.js dev hot-reload cleanly, and **server-only** so the service role key cannot leak into the client bundle.

```ts
// lib/db.ts (top of file)
import "server-only"; // build-time: errors if a client component imports this
if (typeof window !== "undefined") {
  // runtime: belt-and-suspenders for edge cases the bundler misses
  throw new Error("lib/db.ts must never run on the client");
}

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const g = globalThis as unknown as { __supabase?: SupabaseClient };
export const supabase =
  g.__supabase ??
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false }, // server-side: don't try to manage auth state we don't have
    },
  );
if (process.env.NODE_ENV !== "production") g.__supabase = supabase;
```

The singleton pattern (memoizing on `globalThis` in dev) prevents fresh client instances on every hot-reload — relevant in dev only; production cold-starts get a fresh module anyway.

## Step 3.5 — Supabase setup (one-time)

1. Create a Supabase project at supabase.com (free tier).
2. In the SQL editor, run the schema below.
3. The schema already enables RLS on all four tables (`figures`, `figure_shape_embeddings`, `sessions`, `match_misses`) with no policies = default deny for the anon role. The service role bypasses RLS automatically.
4. Copy the project URL and **service role key** into `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJ...                    # SERVER-ONLY, never ship to browser
   ```
5. Install client: `npm i @supabase/supabase-js`.

### Schema

```sql
-- pgvector for semantic figure retrieval
create extension if not exists vector;

-- ─── figures: the curated library ────────────────────────────────────────
create table figures (
  key                     text primary key,           -- e.g. "vanGogh_1870_dismissal"
  name                    text not null,
  lived                   text not null,              -- "1853–1890"
  age_at_struggle         int  not null,
  age_min                 int  not null,              -- inclusive match floor
  age_max                 int  not null,              -- inclusive match ceiling
  themes                  text[] not null,            -- controlled vocab; see lib/themes.ts
  era                     text not null,
  one_line                text not null,              -- 1-sentence summary, fallback display

  -- The two text fields enforce the anti-echo rule.
  shape_sentences         text[] not null,            -- 2-3 sentences. Each embedded individually in figure_shape_embeddings. Never shown to rerank LLM.
  biographical_facts      text not null,              -- Hand-curated paragraph. Used for rerank + beat streaming. Never embedded.

  beats                   jsonb not null,             -- BeatBlueprint[] (length 9)
  decision_continuations  jsonb not null default '{}',

  -- Hand-graded scalars used by rerank. Belt + suspenders for prompt-only rules.
  narrative_dynamism      int  not null default 2 check (narrative_dynamism between 1 and 3),
                                                      -- 1 = flat (rare; usually means re-curate), 2 = solid arc, 3 = exceptional arc
  canon_exposure          int  not null default 2 check (canon_exposure between 1 and 3),
                                                      -- 1 = obscure, 2 = known, 3 = textbook-canon (Lincoln, Van Gogh, Einstein)

  status                  text not null default 'draft' check (status in ('draft','published')),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index figures_age_idx     on figures (age_min, age_max) where status = 'published';
create index figures_themes_idx  on figures using gin (themes);

-- ─── figure_shape_embeddings: per-sentence vectors, mixed-dim coexistence ──
-- One row per (figure × shape sentence × embedder model_id). The untyped `vector`
-- column lets Gemini (1536) and Voyage (1024) live in the same table; partial HNSW
-- indexes per (model_id, dim) keep them apart at retrieval time. After an embedder
-- swap or shape edit, rows that haven't been refreshed stay invisible to retrieval
-- until reembed.ts updates them — model_id and content_hash are the two gates.
create table figure_shape_embeddings (
  figure_key     text not null references figures(key) on delete cascade,
  shape_index    int  not null,                      -- 0..2 within the figure
  model_id       text not null,                      -- canonical: e.g. "gemini-embedding-001@2026-Q2-d1536"
  dimension      int  not null,                      -- 1536 for Gemini, 1024 for Voyage; checked against embedding length
  input_type     text not null default 'search_document'
                  check (input_type = 'search_document'),  -- documents only; query vectors are never stored
  content_hash   text not null,                      -- sha256(<single shape_sentence>); detects sentence edits without re-embed
  embedding      vector not null,                    -- untyped → mixed dims allowed; partial HNSW casts per index
  created_at     timestamptz not null default now(),
  primary key (figure_key, shape_index, model_id)
);

create index fse_figure_idx on figure_shape_embeddings (figure_key);

-- Partial HNSW per (model_id, dim). Build only after seeds for that model exist.
-- The cast in the index expression fixes the dim; the WHERE filters mismatched rows out.
-- Active model is selected per-session before reads: set local app.embedding_model = '<id>';
-- vectorSearch joins back to figures and applies the age filter + status='published'.
--
-- create index fse_gemini_v1_idx
--   on figure_shape_embeddings using hnsw ((embedding::vector(1536)) vector_cosine_ops)
--   where model_id = 'gemini-embedding-001@2026-Q2-d1536' and dimension = 1536;
--
-- create index fse_voyage_v1_idx
--   on figure_shape_embeddings using hnsw ((embedding::vector(1024)) vector_cosine_ops)
--   where model_id = 'voyage-4-lite@2026-Q2-d1024' and dimension = 1024;

-- ─── figure_facet_embeddings: per-facet vectors, layered onto shape retrieval ──
-- One row per (figure × facet_type × embedder model_id). Same mixed-dim coexistence
-- pattern as figure_shape_embeddings; same anti-echo discipline (facet_text is for
-- retrieval only, never shown to the rerank LLM). See Architecture > FacetsRAG.
create table figure_facet_embeddings (
  figure_key     text not null references figures(key) on delete cascade,
  facet_type     text not null check (facet_type in
                  ('emotional_core','decision_shape','trigger_event','agency_state')),
  facet_text     text not null,                     -- editorial micro-document, substantiable from biographical_facts
  model_id       text not null,
  dimension      int  not null,
  input_type     text not null default 'search_document'
                  check (input_type = 'search_document'),
  content_hash   text not null,                     -- sha256(facet_text); re-embed on edit
  embedding      vector not null,
  created_at     timestamptz not null default now(),
  primary key (figure_key, facet_type, model_id)
);

create index ffe_figure_idx on figure_facet_embeddings (figure_key);

-- Partial HNSW per (model_id, dim, facet_type). Build only after seeds for that
-- (model, facet) exist. The triple gate (model_id + dim + facet_type) keeps stale
-- or wrong-lane rows invisible to retrieval automatically.
--
-- create index ffe_gemini_v1_emotional_core_idx
--   on figure_facet_embeddings using hnsw ((embedding::vector(1536)) vector_cosine_ops)
--   where model_id = 'gemini-embedding-001@2026-Q2-d1536'
--     and dimension = 1536 and facet_type = 'emotional_core';
-- (repeat for the other 3 facet_types and the other model_id)

-- ─── sessions: one user's story session ──────────────────────────────────
create table sessions (
  id              text primary key,                   -- nanoid
  age             int  not null check (age between 13 and 99),
  feeling         text not null check (length(feeling) <= 500),
  figure_key      text not null references figures(key),
  figure_name     text not null,                      -- denormalized for listing
  choices         jsonb not null default '{}',
  last_beat_index int  not null default 0,
  crisis_flagged  bool not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index sessions_created_at_idx on sessions (created_at desc);

-- ─── match_misses: editorial backlog (unmet user need) ───────────────────
-- Logged when no candidate clears the rerank confidence threshold. Drives
-- which figures to research/write next. Anonymous; no sessionId, no PII.
create table match_misses (
  id                  bigserial primary key,
  age                 int  not null,
  feeling             text not null,
  reason              text not null,                  -- "no candidates in age range" | "below confidence threshold"
  closest_figure_key  text references figures(key),
  created_at          timestamptz not null default now()
);

create index match_misses_created_at_idx on match_misses (created_at desc);

-- ─── figure_editorial_warnings: editorial feedback loop ─────────────────────
-- Decoupled from `figures` so runtime warning writes never touch the read path:
-- no write contention on hot match traffic, no churning updated_at, no cache
-- invalidations. Deduplicated via the unique constraint + on-conflict upsert.
-- Editorial workflow: SELECT * FROM figure_editorial_warnings WHERE resolved_at IS NULL.
create table figure_editorial_warnings (
  id              bigserial primary key,
  figure_key      text not null references figures(key) on delete cascade,
  warning_type    text not null check (warning_type in
                   ('missing_facet','stale_content_hash','missing_embedding','dim_mismatch')),
  active_model_id text not null,                    -- splits warnings across embedder rollouts
  details         jsonb not null default '{}',      -- which facet, what hash, what dim, etc.
  first_seen_at   timestamptz not null default now(),
  last_seen_at    timestamptz not null default now(),
  count           int not null default 1,
  resolved_at     timestamptz,                      -- editorial sets when fixed
  unique (figure_key, warning_type, active_model_id)
);

create index few_unresolved_idx on figure_editorial_warnings (figure_key)
  where resolved_at is null;

-- Atomic upsert from the matcher (no app-level read-modify-write):
--
-- insert into figure_editorial_warnings (figure_key, warning_type, active_model_id, details)
-- values ($1, $2, $3, $4)
-- on conflict (figure_key, warning_type, active_model_id) do update set
--   last_seen_at = now(),
--   count        = figure_editorial_warnings.count + 1,
--   details      = excluded.details;

-- ─── updated_at trigger (shared) ─────────────────────────────────────────
create or replace function touch_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;
create trigger sessions_touch before update on sessions
  for each row execute function touch_updated_at();
create trigger figures_touch  before update on figures
  for each row execute function touch_updated_at();

-- ─── RLS: server-only access via service role ────────────────────────────
alter table sessions                    enable row level security;
alter table figures                     enable row level security;
alter table figure_shape_embeddings     enable row level security;
alter table figure_facet_embeddings     enable row level security;
alter table match_misses                enable row level security;
alter table figure_editorial_warnings   enable row level security;
-- No policies = default deny for anon. Service role bypasses RLS automatically.

create trigger figure_shape_embeddings_touch before update on figure_shape_embeddings
  for each row execute function touch_updated_at();
```

**HNSW index timing:** create each `fse_<model>_idx` only after that model's rows exist in `figure_shape_embeddings`. Building HNSW on empty/sparse partials is wasted work and slows the eventual backfill. When evaluating a new embedder, the typical sequence is: (1) seed all figures with the new `model_id`, (2) build the partial HNSW for that `model_id`, (3) run `eval-match.ts` against it, (4) if it wins, update `EMBEDDING_MODEL_ID` in the env; the loser's rows and index stay queryable for rollback.

### Privacy note

`feeling` is stored as plaintext in both `sessions` and `match_misses`. v1 is anonymous (no accounts), and only the server (with service role key) can read it. If accounts are added later, encrypt `feeling` at rest with a server-side key. `match_misses.feeling` has the same posture — it's editorial input, not analytics on identified users.

## Step 4 — Seed the figures library

The library is the v1 product. With 3–5 well-curated entries, the matching feels honest; with 30+ it gets uncanny. Start small, grow with `match_misses` as the demand signal.

### Themes vocabulary (`lib/themes.ts`)

A fixed enum of ~12–15 emotional shapes. Used both when tagging figures and when (eventually) filtering. Keep it tight — a sprawling vocabulary makes matching fuzzy.

```ts
export const THEMES = [
  "worthlessness",
  "no_achievements",
  "comparison_to_peers",
  "creative_dismissal",
  "rejection_by_authority",
  "grief_loss_of_parent",
  "abandonment",
  "invisibility",
  "fear_of_inadequacy",
  "isolation",
  "shame_familial",
  "romantic_rejection",
  "displacement",
] as const;
export type Theme = (typeof THEMES)[number];
```

### Initial seeds (3–5 figures, hand-curated)

Pick figures who collectively cover several themes and don't overlap heavily. Suggested first batch:

- **van Gogh at 17** — `creative_dismissal`, `comparison_to_peers`, `shame_familial`. Dismissed from Goupil's gallery in The Hague; brother Theo succeeding visibly.
- **Lincoln at ~25** — `worthlessness`, `no_achievements`, `isolation`. Post-1832 election loss, store failure, the "broken-engagement winter."
- **Mary Shelley at 18** — `grief_loss_of_parent`, `abandonment`, `invisibility`. Post-Switzerland, infant daughter's death, Byron's circle dismissive.
- _(Optional 4–5)_ Look for **obscure-but-fitting** picks the canonical-bias rule will appreciate: a 17-year-old apprentice diarist, a 22-year-old who quit then returned. The rerank LLM is told to prefer specificity over fame; reward that with at least one less-canonical figure in the seed batch.

### Authoring workflow per figure

1. **Llama drafts.** `npx tsx scripts/research-figure.ts <key> <age> <theme>` — Llama produces a candidate `FigureRow` JSON to `scripts/drafts/<key>.draft.json` with: name, lived, ages, themes, one_line, shape_sentences (2–3), biographical_facts (paragraph), beats (full 9-beat blueprint), decision_continuations.
2. **You polish (≈5 min).** Open the draft, redline. The shape sentences and biographical_facts are the two highest-leverage pieces — fix anything that reads as analytical or generic. Verify dates and quotes against a primary source. **No LLM-generated fact ships unverified.**
3. **Seed.** `npx tsx scripts/seed-figure.ts scripts/drafts/<key>.draft.json` — validates with zod, inserts the `figures` row with `status='draft'`. If `EMBEDDING_PROVIDER != stub`, calls `embedder.embedDocuments(shape_sentences)` (per-sentence, not joined) and writes one row per sentence into `figure_shape_embeddings` keyed on `model_id`. Set `figures.status='published'` from the Supabase dashboard once you've eyeballed it in the running app.

For every decision beat, the draft must include:

- 2–3 `options` (real fork-points the figure faced).
- `realChoice` = the option matching what they actually did.
- `decision_continuations[beatIndex]` keyed by option text. When `pick !== realChoice`, that continuation opens with truthful-contrast wording (_"You would have stopped here. They didn't, and this is why…"_).

### What about offline / no-DB development?

`LLM_PROVIDER=stub` still works without any figures in the DB if `lib/figures.ts` is given a tiny in-process fallback list (3 minimal `FigureRow` objects in `lib/fixtures-fallback.ts`, used only when `figures` table is empty). This is purely a dev convenience — production always reads from Supabase.

## Step 5 — LLM, Tagger, and Embedder interfaces

Three roles, behind two interfaces. The split mirrors what each call protects against.

### `lib/llm.ts`

```ts
export interface LLM {
  // Role A — Tag and expand the user's feeling (Llama 3.1 8B in real mode).
  // Output is used to *expand* retrieval, never to bias rerank.
  tagAndExpand(input: { feeling: string; age: number }): Promise<{
    tags: Theme[]; // validated against THEMES enum, hallucinations dropped
    expansion: string; // 2-3 sentences, grounded; no invented people/motives/events
    anchors: string[]; // verbatim phrases from input — sanity check, also grounds the expansion
    confidence: "low" | "medium" | "high";
  } | null>; // null = hard failure (caller falls back to raw embedding only)

  // Role B — Pick the best figure (GPT-OSS 120B reasoning_effort: low in real mode).
  // Receives raw feeling + biographical_facts ONLY. Never tags, never expansion, never shape_sentences.
  pickFigure(input: {
    age: number;
    feeling: string; // raw, never the expansion
    candidates: FigureRow[]; // post-retrieval shortlist
  }): Promise<{
    figureKey: string;
    resonance: string; // "this match resonates because..."
    gap: string; // "...but does NOT cover X in the user's words"
    confidence: "low" | "medium" | "high";
  }>;

  // Role C — Stream a beat (Llama 3.3 70B in real mode, persona-anchored).
  streamBeat(args: {
    session: Session;
    figure: FigureRow;
    beat: BeatBlueprint;
    userChoice?: string;
  }): AsyncIterable<string>;
}

export const llm: LLM =
  process.env.LLM_PROVIDER === "real"
    ? require("./llm-real").default
    : require("./llm-stub").default;
```

### Hard failure rules for `tagAndExpand` (real mode)

The tagger is best-effort. Any of these → return `null` immediately, no retry:

- Invalid JSON.
- Timeout > 3 s.
- Any tag not in `THEMES` after one pass of dropping invalid entries (if zero remain, fail).
- Any anchor that is not a substring of the original input (the LLM invented context).
- Model returned `confidence: "low"`.

The caller (`lib/matching.ts`) treats `null` as "skip expansion, embed raw only." No retry loop, no second model — keeps p95 latency bounded.

### `lib/llm-stub.ts`

- `tagAndExpand`: keyword regex over feeling → coarse tags from `THEMES`. Returns identity expansion (= raw feeling). `confidence: "low"` always (stub honesty), so callers fall back to raw-only path naturally.
- `pickFigure`: scores each candidate by overlap of `themes` with stub-derived tags. Tie-breaker: `age_at_struggle` closest to `user_age`. Confidence is "low" if max overlap is 0, otherwise "medium".
- `streamBeat`: reads `beat.text` (or `figure.decisionContinuations[beat.index][userChoice]` for the post-choice beat) and yields word-by-word with `await sleep(40)`. **Real streaming.** Bridge beat renders a templated string with the user's feeling spliced in.

### `lib/embeddings.ts`

```ts
export interface Embedder {
  readonly modelId: string; // canonical id; e.g. "gemini-embedding-001@2026-Q2-d1536".
  // Written verbatim into figure_shape_embeddings.model_id and
  // routes the active partial HNSW index via app.embedding_model GUC.
  readonly dim: number; // 1536 for Gemini, 1024 for Voyage. Asserted to equal embedding.length.

  // Document-side (seed time): RETRIEVAL_DOCUMENT for Gemini / input_type=document for Voyage.
  // Each input string is embedded individually — never concatenate or average.
  // Outputs are L2-normalized before return (Gemini truncated below 3072 returns un-normalized;
  // Voyage MRL likewise).
  embedDocuments(texts: string[]): Promise<number[][]>;

  // Query-side (match time): RETRIEVAL_QUERY / input_type=query, L2-normalized.
  embedQuery(text: string): Promise<number[]>;
}

export const embedder: Embedder = (() => {
  switch (process.env.EMBEDDING_PROVIDER) {
    case "gemini":
      return require("./embeddings-real").gemini;
    case "voyage":
      return require("./embeddings-real").voyage;
    default:
      return require("./embeddings-stub").default;
  }
})();
```

The `modelId` is the contract the rest of the system trusts. It encodes provider, model, **and** dim (e.g. `gemini-embedding-001@2026-Q2-d1536`). Swapping providers or changing dim means changing `modelId`, which forces seed rows in `figure_shape_embeddings` for the new id before retrieval can use it. Stale rows from old providers stay queryable for rollback but are invisible to active retrieval because the partial HNSW filters on `model_id` exactly.

**Why two methods (`embedDocuments` + `embedQuery`), not one.** Asymmetric retrieval is a real feature, not a nicety. Gemini and Voyage both encode queries and documents with different learned prefixes; using one method for both silently degrades quality on this app's specific query/document style mismatch (raw modern user pain vs. curated literary fragments).

`lib/embeddings-stub.ts` exposes `modelId = "stub@v0"`, `dim = 1536`. Both methods return zero vectors. `lib/matching.ts` checks `embedder.modelId === "stub@v0"` to skip the vector retrieval branch entirely.

`lib/embeddings-real.ts` exports two named instances — `gemini` (gemini-embedding-001 at 1536, Matryoshka-truncated then L2-normalized) and `voyage` (voyage-4-lite at 1024, MRL). Both call the OpenAI-compatible / native SDK with the `task_type` / `input_type` parameter set per method. Both batch on the document side (Gemini's `batchEmbedContents`, Voyage's batch endpoint up to 128 inputs per call) for efficient seeds.

### `lib/matching.ts` — hybrid retrieval orchestrator

The single source of truth for "how does a user feeling become a figure pick." Owns the v1/v2 retrieval split, hard failure handling, and the framing decision.

```ts
import { rrf } from "./rrf"; // reciprocal rank fusion; k=60 is standard

export async function match(input: { age: number; feeling: string }): Promise<{
  figure: FigureRow;
  pick: {
    resonance: string;
    gap: string;
    confidence: "low" | "medium" | "high";
  };
  framing: "definitive" | "partial"; // drives client UX copy
}> {
  // 1. Hard age filter (the entire premise: same-age figure)
  const candidates = await figures.listByAge(input.age, /*slack=*/ 3);
  if (candidates.length === 0) {
    await db.logMatchMiss({ ...input, reason: "no candidates in age range" });
    return matchWiderOrFail(input);
  }

  // 2. Best-effort tag and expand. Null is fine — caller degrades gracefully.
  const tagged = await llm.tagAndExpand(input).catch(() => null);
  const useExpansion = tagged !== null;

  // 3. Retrieval. v1 small-library path bypasses vector entirely.
  const useVector =
    candidates.length > 20 &&
    embedder.modelId !== "stub@v0" &&
    embedder.dim > 0;

  let shortlist: FigureRow[];
  if (useVector) {
    // Both queries encoded as RETRIEVAL_QUERY / input_type=query (asymmetric).
    const rawVec = await embedder.embedQuery(input.feeling);
    const rawHits = await figures.vectorSearch(
      rawVec,
      input.age,
      embedder.modelId,
      /*k=*/ 10,
    );

    const expHits = useExpansion
      ? await figures.vectorSearch(
          await embedder.embedQuery(tagged!.expansion),
          input.age,
          embedder.modelId,
          10,
        )
      : [];

    // vectorSearch returns figure-level hits already aggregated from per-sentence
    // similarities (max + α·second_max). RRF fuses the raw lane and the expansion
    // lane: a figure ranking #2 in both outranks one ranked #1 in only one lane.
    shortlist = rrf(
      [rawHits.map((h) => h.figure), expHits.map((h) => h.figure)],
      60,
    ).slice(0, 10);
  } else {
    shortlist = candidates;
  }

  // 4. Rerank. NEVER receives tags or expansion — those would just propagate
  //    tagger bias into stage 2. Reads raw feeling + biographical_facts only.
  const pick = await llm.pickFigure({
    age: input.age,
    feeling: input.feeling,
    candidates: shortlist,
  });

  const figure = shortlist.find((f) => f.key === pick.figureKey);
  if (!figure)
    throw new Error(`pickFigure returned unknown key: ${pick.figureKey}`);

  if (pick.confidence === "low") {
    await db.logMatchMiss({
      ...input,
      reason: "below confidence threshold",
      closestFigureKey: figure.key,
    });
  }

  return {
    figure,
    pick,
    framing: pick.confidence === "low" ? "partial" : "definitive",
  };
}
```

`rrf` (`lib/rrf.ts`) is ~15 lines: for each result list, `score(item) += 1 / (k + rank(item))`. Items appearing in both lists naturally rise. `k=60` is the conventional default and works well for shortlists of size 10–20.

**Per-sentence aggregation lives in `vectorSearch`, not `match`.** The DB query joins `figure_shape_embeddings` to `figures` (filtering by `model_id`, `age_min/age_max`, `status='published'`), computes cosine similarity per sentence, then aggregates per figure with `score(figure) = max_s sim(q,s) + α·second_max_s sim(q,s) + β·narrative_dynamism/3 − γ·canon_exposure/3`. Defaults `(α, β, γ) = (0.15, 0.05, 0.05)`; tune via grid search on the eval set, not by guessing. Tip: log per-sentence sims to the trace file so you can re-run aggregation against new (α, β, γ) **without re-embedding**.

This is the only file that knows about the retrieval-architecture split. API routes call `match()` and never see retrieval, tagger, or rerank as separate things.

## Step 6 — API routes

All three return `text/event-stream` for streaming, except `/api/match` which returns JSON (the outline) plus a `sessionId`. Beats stream separately.

### `app/api/match/route.ts`

```
POST { age, feeling }
1. Rate-limit by IP (5/hour, 30/day). 429 if exceeded.
2. classifyCrisis(feeling) → if crisis, return { crisis: true, reasons } (persist nothing).
3. matching.match({ age, feeling }) → { figure, pick, framing }.
4. db.createSession({ age, feeling, figureKey: figure.key, figureName: figure.name, crisisFlagged: false }) → sessionId.
5. Return:
     {
       sessionId,
       figure: { name, lived, atUserAge: figure.oneLine },
       outline: figures.toClientOutline(figure),   // strips all server secrets
       framing                                      // "definitive" | "partial"
     }
   Never return resonance/gap/confidence to the client — those are internal.
   Framing is the only signal about pick confidence that crosses the wire.
```

### `app/api/beat/route.ts`

```
POST { sessionId, beatIndex }
- session = db.getSession(sessionId) → if null, return 404.
- Stream llm.streamBeat({ session, beatIndex }) as SSE.
- After successful stream, db.setLastBeat(sessionId, beatIndex).
- Must return 404 (not 500) when sessionId is unknown — the client's
  "session drifted away" empty state depends on this.
- Must be idempotent: re-requesting the same (sessionId, beatIndex) returns
  the same beat content and never advances last_beat_index backwards.
  setLastBeat should use GREATEST(last_beat_index, :new) so retries are safe.
```

### `app/api/choose/route.ts`

```
POST { sessionId, beatIndex, choice }
- session = db.getSession(sessionId) → if null, return 404.
- db.recordChoice(sessionId, beatIndex, choice).
- Stream the NEXT beat (beatIndex + 1) via llm.streamBeat.
- After stream, db.setLastBeat(sessionId, beatIndex + 1).
```

Strip `realChoice` and `continuations` before sending anything to client — those are server secrets that drive truthful-contrast.

## Step 7 — UI components

### `components/IntakeForm.tsx`

Two fields: age (number, 13–99), feeling (textarea, ≤500 chars). Single submit button. On submit → POST `/api/match`, then `router.push(/story/{sessionId})` (or render `<CrisisCard>` inline if `crisis: true`).

Below the submit button, a muted-italic **safety disclaimer** in small type:

> _This is an AI storytelling experience for emotional perspective, not a substitute for professional mental health care._

### `components/StoryBeat.tsx`

Receives a `ReadableStream`, appends tokens to a string, renders with a soft fade as new text arrives. When stream ends and beat is narrative, show **Continue** button. Framer Motion `AnimatePresence` for entry.

**Accessibility:**

- The beat container has `aria-live="polite"` and `aria-atomic="false"` so screen readers announce streaming text without interrupting.
- The container has `tabIndex={-1}` and a forwarded `ref`. The parent calls `ref.current?.focus()` whenever a new beat begins, so keyboard users land on the new content instead of re-tabbing through scrollback.

**Stream stall recovery:**

- Track `lastTokenAt: number`. If `Date.now() - lastTokenAt > 5000` while still streaming, render a quiet inline link: _"The thread broke. [Continue]"_. Clicking re-POSTs `/api/beat` for the same `(sessionId, beatIndex)`.
- The `/api/beat` route must be idempotent for a given `(sessionId, beatIndex)` — re-requesting the same beat returns the same content, never advances state.

### `components/DecisionCards.tsx`

Renders 2–3 option cards in a vertical stack. Uses Framer Motion `AnimatePresence`:

- On click, unchosen cards exit via `{ opacity: 0, height: 0, marginBottom: 0 }` with a 300ms ease-out.
- The chosen card stays exactly where it is (no morph, no header transformation — that was considered and rejected as visually busy at a high-emotion moment).
- The next beat fades in below the chosen card once exits complete.

### `components/CrisisCard.tsx`

Crisis hotline copy + a clickable `<a href="tel:988">988 Suicide & Crisis Lifeline (US)</a>` (the `tel:` link works on mobile and is harmless on desktop). Below it, a muted "When you're ready, your story is here →" link that proceeds despite the flag.

### `app/story/[sessionId]/page.tsx`

Owns the beat-walking state machine: `currentBeatIndex`, `phase: "streaming" | "awaiting-continue" | "awaiting-choice" | "done"`. Calls `/api/beat` or `/api/choose` as the user advances. After each phase change, focuses the active beat container (see `StoryBeat.tsx`).

**Framing-aware opening copy.** Before beat 1 streams, the page renders a one-line introduction whose tone is set by `framing` from the match response:

- `definitive`: _"Vincent van Gogh felt something close to this, at your age."_
- `partial`: _"This isn't a perfect mirror — but here's a fragment of someone whose struggle rhymes with yours."_

A weak match presented as a definitive mirror corrodes trust faster than a weak match presented honestly. The `partial` copy is the product correction for low-confidence picks — the rerank could be honest in its `confidence` field and the UX would still oversell unless this line diverged.

**Session recovery:**

- Sessions persist in Supabase, so refresh / new device with the URL just works.
- On successful match, `app/page.tsx` also writes `{ sessionId, createdAt }` to `localStorage` under key `famous.lastSession` so the user can return without bookmarking the URL.
- On revisit to `/`, if a `lastSession` exists, render a quiet "Continue your story?" link above the intake form. (Optional: server-validate the id before showing the link to avoid offering a deleted session.)
- `app/story/[sessionId]/page.tsx` must still handle 404 (malformed URL, deleted session) by rendering a soft empty state: _"This story has drifted away. Begin a new one →"_. **Do not 500.** Clear the stale `localStorage` entry when this happens.

### `app/page.tsx`

Renders `<IntakeForm />` centered, with a one-line tagline. If `localStorage.famous.lastSession` exists and is fresh, also renders the "Continue your story?" link above the form.

## Step 8 — Visual theme (`app/globals.css`, `tailwind.config.ts`)

- Background: `#FAF7F2` (warm off-white).
- Text: `#1F1B16` (ink).
- Accent: `#9C6B3F` (muted amber).
- Body font: `Source Serif 4` via `next/font/google`.
- UI font: `Inter`.
- Max content width: `36rem`. Line-height `1.7`. Generous vertical rhythm.
- No shadows, no gradients. One subtle border on decision cards.

## Step 9 — Verify

- **Match (stub mode):** "17, no achievements" → expect Lincoln (or whichever seeded figure has matching themes). Confirm `match_misses` row appears when the user feeling has no good theme overlap.
- **Match (real mode):** "17, no achievements" → confirm GPT-OSS picks an obscure-but-fitting figure when one exists (canonical-bias rule firing). Inspect server logs for the `resonance`/`gap` strings — both should be specific, not generic.
- **Decision beat truthful-history:** pick the _non-real_ option → next beat opens with contrast wording.
- **Bridge beat:** confirm the final beat references the user's intake words by shape (not verbatim quote) and uses second-person.
- **Crisis input:** `<CrisisCard>` appears, `tel:988` link works, no row inserted into `sessions`.
- **Refresh mid-story:** session loaded from Supabase, story resumes at `last_beat_index`. Malformed/deleted session → "story has drifted away" empty state (404, not 500).
- **Stream stall:** disconnect network during a beat → after 5s, "thread broke" link appears; clicking re-fetches and streams the same beat.
- **Accessibility:** keyboard-only tab walkthrough lands focus on each new beat. Screen reader announces streaming prose via `aria-live="polite"` without interrupting prior text.
- **Rate limit:** 6th `/api/match` call from same IP within an hour → 429.
- **Anti-echo defense (embedding ↔ rerank):** in real mode, confirm the rerank API call's request body contains `biographicalFacts` but NOT `shapeSentences` (server log inspection / API trace).
- **Anti-echo defense (tagger ↔ rerank):** confirm the rerank request body contains the **raw user feeling** but NOT `tags`, `expansion`, or `anchors` from the tagger.
- **Tagger hard-failure path:** force the tagger to return invalid JSON; confirm `matching.match()` falls through to raw-only embedding without retry.
- **Hybrid retrieval:** with library > 20 figures, confirm both `embedder.embedQuery(rawFeeling)` and `embedder.embedQuery(expansion)` calls fire and shortlist comes from RRF union over per-sentence retrieval (log inspection).
- **Asymmetric encoding:** trace one match end-to-end and confirm the document side (seed) used `task_type=RETRIEVAL_DOCUMENT` / `input_type=document` while the query side (match) used `RETRIEVAL_QUERY` / `input_type=query`. Same setting on both sides is a silent quality bug.
- **Per-sentence vs averaged:** confirm `figure_shape_embeddings` has 2–3 rows per figure (one per shape sentence), not one. Spot-check that `content_hash` for each row matches `sha256(<that single shape_sentence>)`, not the joined string.
- **Normalization at write time:** sample a few rows from `figure_shape_embeddings`, compute the L2 norm of `embedding`; should be ≈1.0 for both Gemini-1536 and Voyage-1024. Norm far from 1 means a provider's truncation/MRL is bypassing the normalize step.
- **Mixed-dim coexistence:** seed the same figure twice — once under `gemini-embedding-001@2026-Q2-d1536`, once under `voyage-4-lite@2026-Q2-d1024`. Confirm both rows persist, queries with each `app.embedding_model` GUC return that model's hits, and the wrong-model partial HNSW is not consulted.
- **Stale-vector guard:** edit a figure's `shape_sentences` directly in the DB without re-embedding; confirm that figure no longer appears in vector retrieval (its `content_hash` no longer matches the new sentence) until `reembed.ts` runs.
- **Framing UX:** force `pick.confidence = "low"` (e.g. via stub override); confirm story page renders the `partial` opening copy, not the `definitive` line.
- **Eval gate:** `npx tsx scripts/eval-match.ts` runs end-to-end; report shows top-1, top-5 recall, miss-detection rate, and confidence-calibration spread.
- **Privacy:** grep production logs for any user feeling text; confirm zero hits. Only structural fields (`sessionId`, `figureKey`, `framing`, etc.) leak into hosted logs.

## Step 10 — Real LLM (Groq: Llama 3.3 70B + GPT-OSS 120B)

### `lib/llm-real.ts`

Three roles, three models, one Groq client (OpenAI-compatible SDK). The model split per role is in Architecture > Prompt design (per role).

```ts
import "server-only";
import OpenAI from "openai";

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY!,
  baseURL: "https://api.groq.com/openai/v1",
});

const PROSE_MODEL = process.env.LLM_MODEL_PROSE ?? "llama-3.3-70b-versatile";
const RERANK_MODEL = process.env.LLM_MODEL_RERANK ?? "openai/gpt-oss-120b";
const TAGGER_MODEL = process.env.LLM_MODEL_TAGGER ?? "llama-3.1-8b-instant";
// 8B is the right size: fast, cheap, structured-JSON-friendly.
// No reasoning needed; this is classification + paraphrase.
```

### `tagAndExpand` — Llama 3.1 8B (instant)

- System prompt enforces the grounding rule: no invented people, motives, or events. Anchors must be verbatim substrings of the input.
- Output is strict JSON via `response_format: { type: "json_object" }`. Validate with zod against the `THEMES` enum and the anchor-substring rule.
- Hard failure rules (Step 5) apply: any violation → return `null`. No retry.
- Latency budget 3 s. Caller does not await beyond that.

### `pickFigure` — GPT-OSS 120B with `reasoning_effort: low`

Inputs sent to the model (per candidate):

- `name`, `lived`, `oneLine`, `ageAtStruggle`
- `biographicalFacts` — the rerank's substantive evidence
- `themes` — for fast factor-weighing
- `narrativeDynamism` (1–3) — prefer dynamic arcs
- `canonExposure` (1–3) — prefer obscure-but-fitting

Inputs **never** sent:

- `shapeSentences` — that text is the embedder's, not the rerank's. Showing it here reintroduces the data echo.
- Any tag, expansion, or anchor from `tagAndExpand` — the rerank is grounded on the **raw user feeling** plus the figure's facts. Tagger output is for retrieval only.

System prompt clauses (in addition to the canonical-bias and resonance/gap clauses):

> _Among candidates with comparable emotional fit, prefer figures with `narrativeDynamism: 3`. A figure with a flat life produces a 9-beat story that feels manufactured even if the emotion matches._
>
> _Among candidates with comparable fit, prefer **lower** `canonExposure`. Specifics from a less-famous life are stronger medicine than the cliché outline of a textbook figure. Recognizability adds nothing if the resonance is shallow._

Call config: `response_format: { type: "json_object" }`, `reasoning_effort: "low"`. zod-validate `{ figureKey, resonance, gap, confidence }`. On parse failure, retry once with `reasoning_effort: "medium"` then fall back to closest-by-age and `confidence: "low"`.

### `streamBeat` — Llama 3.3 70B with the persona anchor

- System prompt = persona anchor (Role 2 prose). Bridge addendum (Role 3) appends only when `beat.kind === "bridge"`, including the user's verbatim feeling.
- User-side prompt assembles: `figure.biographicalFacts`, the prior beats' content (so voice carries), the current `beat` (title + deterministic content for narrative beats, or the chosen `decisionContinuations[beat.index][userChoice]`), and one sentence of intent ("Render this beat. Do not summarize what came before. ~80–120 words.").
- Stream via Groq's SSE, yield string chunks as the iterable.

### Why Llama for prose, GPT-OSS for rerank (don't flip)

GPT-OSS is a reasoning model. Asked to write narrative prose, it produces analytical voice ("the figure experienced a state of dismissal characterized by…") even at low reasoning effort. Llama 3.3 70B writes warmer, more sensory prose — what the app needs. Conversely, Llama at the rerank job tends to pick on "feels right" rather than weighed factors; GPT-OSS will actually deliberate. Each model is doing the job it's good at, _and_ using two different model families breaks stylistic echo if Llama drafted the shape sentences.

### Cultural-prior contamination — partial defense, not full

The cross-model split breaks Llama-recognizing-its-own-voice. It does NOT break the fact that both models have read the same Wikipedia about Lincoln. The `pickFigure` system prompt's _"bias against figures whose stories are taught in school"_ rule, plus seeding at least one obscure-but-fitting figure per theme, is the actual defense. Document this in CLAUDE.md as a watch-item — it's a content/curation problem, not a code problem.

### Fallback: prose feels stiff?

If real-mode beats read analytical despite the persona anchor, swap `LLM_MODEL_PROSE=meta-llama/llama-3.1-70b-versatile` (or test Mixtral) — env var change only, zero code edit. The interface intentionally allows per-call model selection so this stays one-line operational change.

### Operational

Flip `LLM_PROVIDER=real`, set `GROQ_API_KEY`, restart. **Zero changes outside `lib/`.**

## Step 11 — Editorial workflow (the v1 product loop)

The bottleneck is figure-writing, not code. Treat the editorial loop as a first-class part of the system.

### `scripts/research-figure.ts <key> <age> <theme>`

Llama drafts a candidate `FigureRow` JSON. Inputs: a key (e.g. `"shelley_1816_genevawinter"`), a target age, a primary theme. The script:

1. Prompts Llama with: _"Draft a JSON describing a real historical figure who, at age {age}, faced {theme}. Include name, lived dates, age_at_struggle (must equal {age}), age_min/age_max (±2 of age_at_struggle by default), 2 themes max, a one-line summary, 2–3 shape_sentences (sensory, internal-state-via-action, no labels), a 150-word biographical_facts paragraph citing dates and at least one quoted phrase from a real letter/journal, four facet sentences (`emotional_core`, `decision_shape`, `trigger_event`, `agency_state` — each one sentence, 12–28 words, past tense, derived from biographical_facts; see Architecture > FacetsRAG), and a 9-beat outline using the canonical arc (Scene/Dark/Fork1/Real/Struggle/Fork2/Turning/Became/Bridge)."_
2. Validates with zod (structural shape), writes to `scripts/drafts/<key>.draft.json`.
3. Prints a checklist: facts to verify (dates, quotes, fork-points), prose to redline (anything analytical-sounding), facets to verify (does each facet's claim sit inside biographical_facts? — no separate source verification needed), and the **two scalars to grade** before seeding:
   - `narrativeDynamism` (1–3) — judge from `biographicalFacts` whether the arc is flat, solid, or exceptional.
   - `canonExposure` (1–3) — judge whether this figure is obscure, known, or textbook-canon.

### `scripts/check-figure.ts <draft-path>`

Pre-insert validator. Runs in `seed-figure.ts` automatically; can also be run standalone. Two layers:

**Structural (hard fails, never bypassed):**

- `beats.length === 9`
- Beat kinds in canonical order: `[narrative, narrative, decision, narrative, narrative, decision, narrative, narrative, bridge]`
- Every decision beat has `options.length` in `[2, 3]`
- Every decision beat has `realChoice` that is one of its `options`
- For every decision beat, `decisionContinuations[beatIndex]` has a key for every option
- `shapeSentences.length` in `[2, 3]`
- `biographicalFacts.length` in `[400, 1500]`
- `facets` object has all four keys (`emotional_core`, `decision_shape`, `trigger_event`, `agency_state`), each non-empty
- Each facet text length is in `[40, 220]` chars (rough guard for the 12–28 word rule)
- Each facet is past tense (heuristic: regex on common present-tense forms; soft fail under `--force`)
- `narrativeDynamism` and `canonExposure` set (no defaults shipped to publish)

**Style (soft fails, `--force` overrides):**

```ts
const BANNED = [
  /\bin conclusion\b/i,
  /\bultimately\b/i,
  /\bit'?s important\b/i,
  /\bwe can see\b/i,
  /\blet me tell you\b/i,
  /\bit goes without saying\b/i,
  /\boverall\b/i,
  /\bmoreover\b/i,
  /\bin essence\b/i,
];
```

Style hits print as a redline list with `{ beatIndex, hit, snippet }` so you can decide whether to fix or override.

### `scripts/seed-figure.ts <draft-path>`

1. Run `check-figure.ts`. Hard fails block. Style fails warn unless `--force`.
2. Insert/update the `figures` row (including the `facets` object) with `status='draft'`.
3. If `EMBEDDING_PROVIDER != stub`: call `embedder.embedDocuments([...shape_sentences, ...facet_texts])` — single batch for efficiency, **per-text not concatenated**. The implementation already passes `task_type=RETRIEVAL_DOCUMENT` / `input_type=document` and L2-normalizes each output.
4. Split the returned vectors back into shape and facet groups. For each shape sentence, upsert into `figure_shape_embeddings` keyed on `(figure_key, shape_index, model_id)`. For each facet, upsert into `figure_facet_embeddings` keyed on `(figure_key, facet_type, model_id)`. Both tables share the same write rules:
   - `model_id = embedder.modelId` (e.g. `gemini-embedding-001@2026-Q2-d1536`)
   - `dimension = embedder.dim`
   - `input_type = 'search_document'`
   - `content_hash = sha256(<this single text>)` — per-text, NOT joined
   - `embedding` = the L2-normalized vector
5. **Coverage gate (block on failure, no `--force`):** after upsert, verify the figure has 5 embedding rows for the active `model_id` — one per shape sentence × shape count, plus one per facet × 4 facets. Missing any → roll back the figures row update and exit non-zero. Facet integrity is a publish-time concern.
6. After eyeballing in the running app, manually promote `figures.status='published'` from the Supabase dashboard.

The seed script never touches the partial HNSW indexes — those are one-time DBA ops once seeds for a new `model_id` exist (see Step 3.5). Indexes for facet lanes are also per-`facet_type`, so each new lane needs its own partial HNSW.

### Re-embedding existing figures

When the embedding provider changes (new `EMBEDDING_MODEL_ID`), or when you edit `shapeSentences` for a figure already in the DB:

```sh
npx tsx scripts/reembed.ts [--all | --key <key> | --where status=published] [--model-id <id>]
```

For each affected `(figure_key, shape_index)`, recomputes `embedding` + `content_hash` against the active (or `--model-id`-overridden) embedder. Upserts on the composite key `(figure_key, shape_index, model_id)` so existing rows for _other_ `model_id`s are untouched (rollback / parallel eval stays intact). The partial HNSW per `(model_id, dim)` keeps stale rows out of retrieval automatically until they're refreshed.

### Reading `match_misses` to drive new figures

```sql
select age, feeling, count(*)
from match_misses
where created_at > now() - interval '30 days'
group by age, feeling
order by count desc
limit 20;
```

Cluster by emotional shape; the most-common unmet feelings are next week's `research-figure` invocations. The app's library grows from real demand, not guessing.

## Step 12 — Eval and observability

Once the embedding layer is live, every change — new tagger model, edited persona prompt, different embedder, additional figures — silently changes match quality. Without an eval set, you'll be reasoning from anecdotes ("this one looked good"), which is exactly how RAG systems quietly rot. Build the regression net before query expansion ships.

### Gold eval set (`evals/match.yaml`)

30–50 hand-graded `(age, feeling) → expected_figure` entries. Critically, **5–10 of them are deliberate misses** — feelings no current figure should match well. If your "no good fit" detection rate is near zero on those, your confidence calibration is broken even when matches look right.

```yaml
- id: lincoln_no_achievements_22
  age: 22
  feeling: "I'm 22 and I haven't done anything good. Everyone my age is moving forward and I'm stuck."
  expected_figure: lincoln_1832_storefailure
  expected_themes: [worthlessness, no_achievements, comparison_to_peers]
  expected_confidence_min: medium

- id: deliberate_miss_dog_grief
  age: 34
  feeling: "I lost my dog yesterday and I can't stop crying."
  expected_figure: null # no figure should match this well
  expected_confidence_max: low # if confidence is medium/high, calibration is broken

# ... 30-50 entries, including 5-10 deliberate misses.
```

### Runner (`scripts/eval-match.ts`)

For each entry, runs the full `matching.match()` pipeline and reports four numbers:

| Metric                            | Layer          | What it catches                                                                                                                                                                                   |
| --------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Top-1 accuracy**                | end-to-end     | picked figure equals `expected_figure`. Blunt-instrument quality score.                                                                                                                           |
| **Top-5 retrieval recall**        | retrieval-only | `expected_figure` is in the post-retrieval shortlist. Separates "rerank picked badly" from "retrieval lost it."                                                                                   |
| **Top-10 retrieval recall**       | retrieval-only | Same but wider shortlist. The gap between top-5 and top-10 tells you whether the right answer is borderline or genuinely lost.                                                                    |
| **MRR (mean reciprocal rank)**    | retrieval-only | Average of `1/rank(expected_figure)` across queries. More signal than binary recall when the answer's near the top of the list.                                                                   |
| **Near-miss confusion rate**      | retrieval-only | Fraction of cases where a hard negative (textually similar but emotionally distant) outranks the expected figure. The single best signal that retrieval is doing emotional matching, not lexical. |
| **Miss-detection rate**           | end-to-end     | For entries with `expected_figure: null`, fraction triggering `confidence: low`. Should be ≥ 80%.                                                                                                 |
| **Confidence calibration spread** | end-to-end     | High-confidence accuracy minus low-confidence accuracy. Should be a wide gap. Narrow = model isn't calibrated and `framing` is misleading users.                                                  |
| **Latency p50 / p95**             | retrieval-only | Embedder + vectorSearch wall time. Watch the p95 when changing embedders or batch sizes.                                                                                                          |

The eval set MUST include **hard negatives**: pairs that look textually similar but are emotionally opposite (e.g., _"I'm exhausted from caring for my sick mom"_ vs _"I'm exhausted from running my startup"_; _"I lost everything when my business failed"_ vs _"I lost everything when my parents divorced when I was 9"_). Without these, top-1 accuracy can look great while the embedder is still confusing surface-similar feelings — the near-miss confusion rate is what exposes that.

Once FacetsRAG is wired in, layer the **per-lane hard negatives** from the FacetsRAG section on top of these baseline pairs. Label each entry with the dimension it tests (modeled facet, un-modeled confounder, canon bias) so eval results stay interpretable — see Architecture > FacetsRAG for the table.

Output is a single table to stdout plus a JSON dump to `evals/runs/<timestamp>.json` for diffing across runs.

**Run it before merging any change to** `lib/llm.ts`, `lib/embeddings.ts`, `lib/matching.ts`, `lib/themes.ts`, `scripts/research-figure.ts`, or any prompt template. CI runs it on PRs that touch those paths.

### Logging discipline

Privacy posture: the database is the only place raw user feelings exist (RLS-locked, server-only access). Logs must not become a second copy.

```
/api/match logs to console:
  { sessionId, figureKey, framing, retrievalUsed, confidence, latencyMs, taggerOk }

NEVER:
  raw feeling, expansion, anchors, resonance, gap.

Dev mode (NODE_ENV !== "production"):
  full traces written to ./logs/match-traces.jsonl
  This file is gitignored. Never ship it to a hosted log service.

Production logging providers (Vercel, Datadog, etc.) get the structural fields only.
```

If you ever need to debug a real production match without raw feelings in logs: pull the row from `sessions` directly via the Supabase dashboard — that's the one privacy boundary, and it's already auditable.

The two highest-leverage steps are **Step 4 (figure curation quality)** and **Step 10's prompt design**. Step 12 is the safety net that lets you change either without flying blind.
