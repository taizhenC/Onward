# Feature Roadmap

## Roadmap principles

1. **Prove the emotional outcome, not only model accuracy.** Figure-selection accuracy is an input metric. The product outcome is a true story that feels close enough to finish and helpful enough to remember.
2. **Constrain generation with evidence.** Creativity belongs in phrasing and emphasis, never in historical claims.
3. **Prefer honest recovery to confident mismatch.** A clarification, adjacent-match label, curated fallback, or “no close story yet” is better than a false assertion of similarity.
4. **Treat presentation as part of the engine.** Pacing, readability, trust cues, and continuity determine whether good prose reaches the reader.
5. **Protect intimate data by construction.** Raw and derived user language must not leak through logs, analytics, model errors, or indefinite retention.
6. **Keep the product quiet.** No feeds, streaks, chat simulation, achievement mechanics, or notification pressure in the public-release scope.

## Priority summary

| ID | Priority | Type | Item | Outcome |
|---|---|---|---|---|
| P0-01 | P0 | [Feature] | End-to-end story quality benchmark and release gate | Measures the actual promise with real-world disclosures and human review. |
| P0-02 | P0 | [Refactor] | Evidence-addressable `StorySpec` content model | Makes historical claims and interpretations machine-auditable. |
| P0-03 | P0 | [Refactor] | Hybrid Story Composer with validation and fallback | Produces bounded personalization without sacrificing truth or reliability. |
| P0-04 | P0 | [Bug Fix] | Remove verbatim disclosure echo and close derived-data leaks | Prevents awkward, unsafe, or surprising reflection of intimate text. |
| P0-05 | P0 | [Feature] | Match confidence, one-question clarification, and honest no-close-match recovery | Stops weak matches from masquerading as exact ones. |
| P0-06 | P0 | [UI/UX] | Guided, low-friction intake redesign | Improves match signal and user trust before generation begins. |
| P0-07 | P0 | [UI/UX] | Production story-reader redesign | Makes pacing, controls, continuity, and the end state feel intentional. |
| P0-08 | P0 | [UI/UX] | “Why this story” and source transparency | Makes “true story” inspectable without turning the reader into an academic page. |
| P0-09 | P0 | [Bug Fix] | Correct reading-progress acknowledgement and resume behavior | Prevents skipped passages and premature completion. |
| P0-10 | P0 | [Feature] | Resonance feedback and “try another story” loop | Creates user recovery and the product-learning flywheel. |
| P0-11 | P0 | [Feature] | Privacy-safe product telemetry and operational observability | Enables release decisions without collecting disclosures. |
| P0-12 | P0 | [Bug Fix] | Safety flow, regression suite, and reviewed resource handling | Establishes a public-ready safety system, not only a regex. |
| P0-13 | P0 | [Bug Fix] | Retrieval configuration, documentation, and promotion gate | Prevents the weaker retrieval recipe from being silently deployed. |
| P0-14 | P0 | [Feature] | Story deletion, account deletion, consent, and retention controls | Makes the privacy promise controllable by the user. |
| P0-15 | P0 | [Refactor] | Automated release pipeline, migrations, and rollback readiness | Converts passing local checks into repeatable deployment confidence. |
| P0-16 | P0 | [UI/UX] | Cross-flow design system and accessibility hardening | Makes landing, intake, story, auth, and library feel like one product. |
| P0-17 | P0 | [Feature] | Emotional boundaries and story-intensity controls | Lets readers avoid topics or detail levels that would make the story harmful or unreadable. |
| P1-01 | P1 | [Refactor] | Facet query projections and eval-gated dynamic retrieval | Improves semantic recall only after it proves superiority in shadow mode. |
| P1-02 | P1 | [Feature] | Reader-controlled story emphasis | Adds agency without inventing historical branches. |
| P1-03 | P1 | [Feature] | Controlled full-beat regeneration experiment | Tests deeper personalization behind the hybrid composer and evidence gates. |
| P1-04 | P1 | [Refactor] | Editorial workbench and content lifecycle | Scales high-quality research, review, publication, and rollback. |
| P1-05 | P1 | [Feature] | Demand-led stage expansion and multi-stage figures | Fills real coverage gaps instead of adding famous names speculatively. |
| P1-06 | P1 | [UI/UX] | Saved-story library v2 | Improves revisiting, filtering, deletion, and privacy comprehension. |
| P1-07 | P1 | [Feature] | Controlled model and prompt experimentation | Enables safe challenger tests for match and prose quality. |
| P1-08 | P1 | [UI/UX] | Market-aware copy, resources, and localization foundation | Makes the experience appropriate outside one assumed locale. |
| P1-09 | P1 | [Feature] | Gentle revisit and reflection mode | Supports repeat value without streaks or engagement pressure. |
| P1-10 | P1 | [Refactor] | Latency and cost optimization after instrumentation | Improves economics without trading away quality invisibly. |
| P1-11 | P1 | [Feature] | Two-perspective match choice for ambiguous cases | Lets the reader choose between meaningfully different, equally plausible human parallels. |
| P1-12 | P1 | [Feature] | Private Carry-Forward Card | Turns a moving story into one user-authored thought or next step worth keeping. |
| P1-13 | P1 | [UI/UX] | Short and full reading modes | Makes Onward useful when the reader has two minutes as well as when they have ten. |
| P1-14 | P1 | [Feature] | Opt-in private context continuity | Remembers boundaries and prior figures without retaining or reusing old disclosures. |
| P1-15 | P1 | [Feature] | Redacted conversation card | Helps a user bring the historical story into a conversation without exposing their intake. |
| P1-16 | P1 | [Feature] | Outcome-diverse story library | Reduces survivorship bias by representing endurance, adaptation, help, and changed direction—not only fame. |
| P1-17 | P1 | [UI/UX] | Source-grounded “What changed next” map | Makes the story practically legible without converting biography into advice. |
| P1-18 | P1 | [Feature] | Optional source-grounded afterword lenses | Lets readers explore who helped, what failed first, or what took time after the main story. |
| P2-01 | P2 | [UI/UX] | Optional human-quality audio narration | Adds an accessible listening mode when story quality is stable. |
| P2-02 | P2 | [Feature] | Native/offline reading surfaces | Extends reach after web retention and reliability are proven. |
| P2-03 | P2 | [Feature] | Privacy-preserving story sharing | Allows deliberate sharing without exposing the original disclosure. |
| P2-04 | P2 | [Feature] | Facilitator pilot for educators, counselors, and support organizations | Tests recommendation use cases without turning Onward into a clinical product. |
| P2-05 | P2 | [Refactor] | Database-native vector retrieval at larger library scale | Moves cosine search only when in-memory retrieval becomes a measured constraint. |
| P2-06 | P2 | [Feature] | Multilingual stories and cross-language retrieval | Expands access after culturally competent editorial workflows exist. |
| P2-07 | P2 | [UI/UX] | Curated thematic collections | Adds optional discovery without creating an infinite content feed. |
| P2-08 | P2 | [Feature] | Carefully governed community layer | Consider only after abuse, privacy, moderation, and clinical-boundary research. |

---

# P0 — Critical for public release

## P0-01 — [Feature] End-to-end story quality benchmark and release gate

**Problem:** The existing 104-case matching set measures whether the system picks an editorially expected figure. It does not measure whether real people find the final story accurate, specific, relatable, tonally safe, and worth finishing.

**Scope**

- Build a consented, de-identified benchmark from realistic disclosures across the intended age bands and core hard-season categories.
- Separate development, validation, and blind holdout sets. Keep high-risk/safety cases in a distinct corpus.
- Score each complete story on match closeness, factual support, tone, non-diagnostic language, non-overclaiming, narrative coherence, bridge quality, and desire to continue.
- Use at least two trained human reviewers for historical/tone dimensions and target-audience readers for relatability.
- Record rubric scores and non-sensitive error categories; do not put raw disclosures in third-party analytics.
- Compare the canonical story, hybrid composition, and any generative challenger on the same inputs.

**Acceptance criteria**

- A versioned benchmark, written scoring rubric, reviewer guide, and blind holdout exist.
- Every production recipe is identified by an immutable recipe version and has a stored evaluation result.
- Release gates cover the entire artifact, not only match top-1.
- A failed factuality, safety, privacy, or critical-tone gate blocks promotion regardless of aggregate score.

**Dependencies:** None; this starts first and governs P0-02, P0-03, P0-05, and P0-13.  
**Relative effort:** Large.  
**Primary owners:** Product, editorial/research, data/evaluation, safety reviewer.

## P0-02 — [Refactor] Evidence-addressable `StorySpec` content model

**Problem:** `FigureStageRow.biographicalFacts` is a prose blob, `sources` are broad citations, and `sourceNotes` are optional free text. A generator cannot reliably prove which source supports each date, quote, entity, causal statement, or sensory detail.

**Scope**

- Introduce a versioned `StorySpec` for each figure stage containing:
  - atomic fact IDs;
  - exact or bounded source references;
  - event order and age/date ranges;
  - allowed people, places, organizations, and works;
  - quote text plus quote status (`verbatim`, `paraphrase`, `disputed`, or `forbidden`);
  - documented facts, editorial interpretations, dramatization limits, and “avoid saying” rules;
  - canonical arc beats and approved fallback copy.
- Require every factual sentence in canonical and generated stories to reference one or more fact IDs.
- Add content version, reviewer identity, review date, and publish state.
- Migrate the launch subset first; do not block on converting all low-demand content if the public library can be safely narrowed.

**Acceptance criteria**

- Every publicly eligible stage has a published, immutable `StorySpec` version.
- All names, dates, places, organizations, works, direct quotes, and causal claims in a release artifact resolve to allowed evidence.
- The publish validator rejects missing evidence, unresolved entities, unsupported quotes, impossible chronology, and unreviewed changes.
- A stage can be rolled back independently of application deployment.

**Dependencies:** P0-01 supplies the factuality rubric.  
**Relative effort:** Large; content migration is the dominant effort.  
**Primary owners:** Backend/platform, editorial/research.

## P0-03 — [Refactor] Hybrid Story Composer with validation and fallback

**Problem:** The current “story engine” streams static database prose in both stub and real modes. Switching directly to unconstrained runtime generation would improve variation while putting the truth promise at unacceptable risk.

**Scope**

- Create a `StoryComposer` boundary separate from retrieval and provider APIs.
- Convert the user's intake into a short-lived, structured `ResonanceBrief`: primary pressure, emotional core, desired distance, and match gaps. Preserve provenance and sensitivity classifications.
- Compose a complete, immutable `StoryArtifact` from:
  1. the published `StorySpec` factual spine;
  2. canonical seven-beat structure;
  3. explicitly allowed personalization zones, initially preface, beat emphasis/transitions, and final bridge;
  4. a recipe that pins prompt, model, spec, validator, and retrieval versions.
- Run layered gates before the user sees the artifact:
  - schema and beat-role validation;
  - entity/date/quote allowlist validation;
  - fact-ID coverage and chronology checks;
  - contradiction/entailment review against the `StorySpec` as an additional gate, not the sole gate;
  - tone, non-diagnostic, safety, and “no guaranteed outcome” checks;
  - privacy checks that reject verbatim or near-verbatim disclosure echo unless the user explicitly asked to preserve it.
- Allow a bounded retry, then fall back to the reviewed canonical artifact. Never leave the user at a dead end because prose generation failed.
- Persist the validated artifact once and stream stored chunks; do not regenerate individual beats during reading.

**Acceptance criteria**

- The same session always replays the same artifact.
- No unvalidated generated text reaches a reader.
- Fallback produces a complete story when providers time out or validators reject output.
- Validation and fallback reasons are captured as non-sensitive enums.
- Public launch meets the factuality, tone, fallback-rate, and latency gates in the release plan.

**Dependencies:** P0-01 and P0-02.  
**Relative effort:** Extra large.  
**Primary owners:** Backend/AI platform, editorial, safety reviewer.

## P0-04 — [Bug Fix] Remove verbatim disclosure echo and close derived-data leaks

**Problem:** Canonical bridge beats contain `You wrote: "{feeling}"`, and `streamBeat` substitutes the raw session disclosure. This can expose intimate text over a user's shoulder, feel algorithmic, preserve malicious or destabilizing wording, and break once retention nulls the feeling.

**Scope**

- Remove raw `{feeling}` interpolation from all canonical and demo stories.
- Generate or select a bounded bridge from the `ResonanceBrief`, reflecting emotional shape without quoting distinctive phrases.
- Add lexical-overlap and named-detail checks against the raw disclosure.
- Treat generated prefaces, bridges, summaries, and embeddings as sensitive derived data with explicit retention and logging rules.
- Audit UI, provider errors, test fixtures, and observability schemas for accidental disclosure echo.

**Acceptance criteria**

- No public story includes the raw intake by default.
- Saved stories remain coherent after raw `feeling` retention expires.
- Privacy tests reject raw or near-verbatim disclosure in analytics, errors, prompts captured by logs, and persisted non-sensitive fields.
- The marketing demo follows the same non-echo rule.

**Dependencies:** Coordinate with P0-03 and P0-14.  
**Relative effort:** Medium.  
**Primary owners:** Backend/AI platform, privacy, frontend.

## P0-05 — [Feature] Match confidence, one-question clarification, and honest no-close-match recovery

**Problem:** The matcher produces `confidence` and stores `framing`, but the reader does not use it. The reranker is instructed to always choose, so weak coverage still becomes a confident-looking story.

**Scope**

- Calibrate confidence on held-out, real-world data rather than trusting model self-report alone.
- For uncertain cases, ask at most one high-information clarification, such as whether the hardest part is loss, isolation, shame, blocked agency, or uncertainty.
- Re-run matching with the clarification as sensitive input.
- If confidence remains low, present an honest adjacent-match frame: “This is not the same situation, but one part may rhyme.”
- Offer “try another” or “none of these” without forcing the user to rewrite the original disclosure.
- Record anonymous miss categories and candidate coverage counts for editorial planning; free text is opt-in and retention-controlled.

**Acceptance criteria**

- No low-confidence match uses exact-equivalence language.
- Clarification is shown only when it has measured expected value and never becomes a multi-step questionnaire.
- Users can exit, revise, or request another story from every weak-match state.
- Miss and clarification performance are included in the release benchmark.

**Dependencies:** P0-01, P0-10, and P0-11.  
**Relative effort:** Large.  
**Primary owners:** Product, AI/matching, design.

## P0-06 — [UI/UX] Guided, low-friction intake redesign

**Problem:** The current intake is an age field plus a large text box. It gives little guidance on what makes a useful disclosure, little privacy context at the moment of entry, and only a generic “Finding…” wait state.

**Scope**

- Keep free text primary, but provide an example and a concise prompt: what happened, what part hurts, and what feels uncertain.
- Add optional, accessible context chips only when they improve retrieval signal; do not force diagnostic categories.
- Explain in place that the text is private, used to choose/shape one story, and subject to retention.
- Make age rationale clear and allow age-band handling if research shows exact age feels intrusive.
- Use inline validation and humane recovery for cookie, rate-limit, and connection errors.
- Replace the blank wait with a staged, non-deceptive state: securing the session, finding a close life episode, preparing the story. Do not show fabricated progress percentages.
- Preserve a draft locally during transient network failure, with clear device-only semantics.

**Acceptance criteria**

- Mobile and desktop usability tests show users understand what to write and why age is asked.
- Abandonment, invalid submission, and retry rates are measurable without capturing text.
- Keyboard, screen-reader, zoom, contrast, reduced-motion, and error-announcement checks pass.
- Intake-to-first-readable-content meets the release latency target.

**Dependencies:** P0-05 and P0-11 event contract.  
**Relative effort:** Medium.  
**Primary owners:** Product design, frontend, research.

## P0-07 — [UI/UX] Production story-reader redesign

**Problem:** The current reader has the right book-like intent but hidden skip behavior, early Continue availability, no clear chapter orientation, an abrupt ending, and a save card that can appear before the final text finishes revealing.

**Scope**

- Present one stable passage at a time with visible “Show full passage” and Continue controls.
- Keep the page height stable without hiding critical text from assistive technology.
- Do not enable Continue until the full passage is available; allow users to reveal immediately without accidentally advancing.
- Add quiet orientation such as a chapter label or reading-time cue, not a gamified progress bar.
- Improve paragraph rhythm, small-screen line length, tap targets, loading skeletons, focus transitions, and error recovery.
- Separate the story coda from account conversion. Let the emotional landing complete before presenting save, feedback, or another-story actions.
- Retain the delayed name reveal only if usability research shows it increases attention without feeling manipulative.

**Acceptance criteria**

- Users can distinguish reveal, continue, exit, and retry actions without instruction.
- The final bridge remains visible while sources, feedback, and save actions appear in a calm sequence.
- Reader usability and comprehension tests pass across representative phones, desktops, keyboard-only use, and screen readers.
- Completion and passage-reveal behavior are measurable through non-sensitive events.

**Dependencies:** P0-03 artifact shape and P0-09 progress semantics.  
**Relative effort:** Large.  
**Primary owners:** Product design, frontend, accessibility QA.

## P0-08 — [UI/UX] “Why this story” and source transparency

**Problem:** Onward says every story is true, and the database contains sources, but the reader has no way to inspect support or understand which texture is documented versus interpretive.

**Scope**

- Add a short end-of-story “Why Onward chose this” explanation using validated match rationale that names both resonance and the important gap.
- Add an optional source drawer with readable citations, dates, and links/identifiers where available.
- Label direct quotes, paraphrases, documented scenes, and interpretive narrative texture in plain language.
- Provide a “report a historical concern” path that captures a fact ID and reason enum, not the user's disclosure.
- Avoid interrupting the narrative with academic footnote markers unless testing shows they help trust.

**Acceptance criteria**

- Every public story exposes its `StorySpec` version and source list.
- Every displayed quote can be traced to quote status and evidence.
- The rationale never claims the lives are identical or exposes the raw intake.
- Historical reports enter an editorial queue and can unpublish a stage quickly.

**Dependencies:** P0-02 and P0-03.  
**Relative effort:** Medium.  
**Primary owners:** Editorial, design, frontend.

## P0-09 — [Bug Fix] Correct reading-progress acknowledgement and resume behavior

**Problem:** `StoryBeat` calls `/api/beat/ack` as soon as streaming ends. The stored position advances before the reader presses Continue, so a refresh or tab close while reading may resume at the next chunk and skip content. The final session can also be marked ended before the final reveal is complete.

**Scope**

- Separate “content delivered” from “reader acknowledged.”
- Move acknowledgement to an explicit Continue action; acknowledge the final passage only after the full text is visible and the end transition occurs.
- Make updates compare-and-set/idempotent at the data layer, not only in route logic.
- Keep an explicit delivered/read/acknowledged state if product analytics needs the distinction.
- Add concurrency, double-click, refresh-mid-stream, offline retry, back-button, and multi-tab tests.

**Acceptance criteria**

- Refresh before Continue shows the same passage.
- Repeated acknowledgements cannot advance more than once.
- A multi-tab race cannot skip a passage or move the session backward.
- End state is persisted only after the final passage is actually presented.

**Dependencies:** P0-07 interaction design.  
**Relative effort:** Medium.  
**Primary owners:** Frontend, backend, QA.

## P0-10 — [Feature] Resonance feedback and “try another story” loop

**Problem:** A wrong or merely adjacent match is a dead end, and the team cannot learn which part failed.

**Scope**

- Ask one low-friction post-story question: “Did this story feel close to what you meant?”
- If no, offer bounded reasons: wrong situation, wrong feeling, age/life-stage mismatch, story felt generic, tone felt wrong, historical concern, or other.
- Allow “try another” using the same disclosure while excluding the previous stage and preserving the original privacy/retention class.
- Offer optional free text only with explicit consent and a short retention window.
- Feed aggregate miss categories into content and matcher prioritization.

**Acceptance criteria**

- Feedback can be submitted without an account.
- No raw disclosure or generated story text enters the feedback event by default.
- A user can request another story without consuming a new public rate-limit unit when the first was explicitly rejected.
- Duplicate/abusive retries have a bounded policy.

**Dependencies:** P0-05 and P0-11.  
**Relative effort:** Medium.  
**Primary owners:** Product, frontend/backend, data.

## P0-11 — [Feature] Privacy-safe product telemetry and operational observability

**Problem:** The app currently has almost no production learning surface. Public launch without funnel, quality, fallback, latency, and error signals would make improvements guess-driven.

**Scope**

- Define a closed, string-hostile event schema that accepts only allowlisted event names, versioned recipe IDs, booleans, counts, durations, coarse buckets, and approved identifiers.
- Instrument authoritative landing, intake, story-flow auth, rate-limit, match, clarification, artifact, visibility, progress, completion, source, feedback, alternate, and owned failure boundaries. Keep crisis, save/reopen, and deletion events reserved until their stricter safety or P0-14 product policies authorize a producer.
- Add dashboards for funnel, resonance, completion, factual reports, fallback rate, closed latency-bucket distributions and threshold compliance, provider errors, cost per completed story, and retention cohort. Do not infer percentile precision the stored buckets cannot support.
- Keep raw disclosure, prompt/response bodies, free text, derived semantic tags, embeddings, ranked candidate lists, and exception objects categorically excluded.
- Add trace-schema tests that fail CI on forbidden fields.

**Acceptance criteria**

- Every P0 release metric can be computed from approved events.
- Privacy tests prove forbidden payloads are rejected.
- Operational alerts identify elevated failure/fallback/latency without exposing user text.
- Event documentation states purpose, owner, retention, and deletion behavior.

**Dependencies:** P0-14 privacy contract.  
**Relative effort:** Large.  
**Primary owners:** Platform/data, privacy, product.

## P0-12 — [Bug Fix] Safety flow, regression suite, and reviewed resource handling

**Problem:** The deterministic pre-LLM check and versioned regression corpus are a good floor, but the current system still has known negation/third-person false positives, broad resource coverage, and no qualified launch-market review. A vulnerable-audience product needs a reviewed system and operational process, not only a green synthetic gate.

**Scope**

- Build a synthetic, privacy-safe safety corpus covering direct intent, euphemisms, plan language, negation, historical/third-person references, harassment/abuse indicators, and non-crisis near matches.
- Keep a deterministic local safety gate before providers; improve coverage using reviewed pattern/rule changes rather than making the safety floor model-dependent.
- Separate critical false negatives from tolerable false positives in CI policy.
- Provide market-aware, linkable crisis resources and an always-visible route to them, with content reviewed by qualified safety professionals.
- Define what happens after an intercept, including whether and how a user may continue to a story; do not improvise this in product code.
- Create a content incident runbook, escalation owner, kill switch, and post-incident audit that stores no crisis disclosure.

**Acceptance criteria**

- The safety corpus runs in CI with zero critical false negatives.
- Resources and crisis copy have documented reviewer, market, and review date.
- Crisis input still persists nowhere and triggers no rate-limit or model call.
- Product, support, and engineering have an incident and stage-unpublish procedure.

**Dependencies:** Qualified safety review and launch-market decision.  
**Relative effort:** Large.  
**Primary owners:** Safety lead, product, backend, legal/privacy review.

## P0-13 — [Bug Fix] Retrieval configuration, documentation, and promotion gate

**Problem:** The latest repository evidence says keyword retrieval passes the 50-figure gate at 98.0% while FacetsRAG falls to 95.0% with three definitive wrong results. The README still describes FacetsRAG as superior and recommends `RETRIEVAL_MODE=auto`, which may activate it when embeddings are available.

**Scope**

- Pin public production to the current winning recipe (`keyword` plus reranker) until a challenger passes.
- Replace conflicting README/CLAUDE/deploy instructions with one generated configuration manifest.
- Add startup/deploy assertions that print only safe recipe IDs and fail when production uses an unapproved recipe.
- Store benchmark results by dataset version and recipe; never overwrite the only run summary.
- Require shadow evaluation, holdout superiority, no critical regressions, and a deliberate promotion record before changing production retrieval.

**Acceptance criteria**

- Deployment cannot silently resolve `auto` to an unapproved path.
- Documentation and runtime configuration identify the same recipe.
- A rollback is one configuration change with no data migration.
- Production selection can be audited by session recipe and deployment version.

**Dependencies:** P0-01 and P0-15.  
**Relative effort:** Small to medium.  
**Primary owners:** AI/matching, platform/release.

## P0-14 — [Feature] Story deletion, account deletion, consent, and retention controls

**Problem:** The app now lets owners hard-delete an individual story or the whole account from the active database, publishes a plain-language preview privacy guide, and explains the guest/disclosure/story periods at save. Durable save semantics, legal/provider/backup review, restore-time deletion handling, and real cascade proof remain incomplete.

**Scope**

- Add delete-story and delete-account flows with confirmation and safe recovery where feasible.
- Define retention classes for guest sessions, saved sessions, raw disclosures, generated personalized artifacts, feedback free text, events, and audit metadata.
- Make save consent explicit: explain what remains, what is deleted after 60 days, and what remains until user deletion.
- Apply the same or stricter controls to derived personalized prose, not only raw intake.
- Provide a privacy page in plain language and a compact just-in-time summary at intake/save.
- Complete youth, launch-market, terms, content-rights, and privacy review before accepting public users.

**Acceptance criteria**

- Users can delete individual stories and their account without contacting support.
- Database cascades and scheduled jobs are tested against every data class.
- Saved-story behavior after raw-disclosure expiry is coherent and covered by tests.
- Product copy, schema, cron jobs, provider retention settings, and event retention agree.
- Backup/PITR restores cannot silently resurrect deleted owner data: either replay a durable privacy-safe deletion ledger during restore or prove a bounded backup policy that never returns deleted rows to service.

**Dependencies:** P0-03 artifact model and P0-11 event model.  
**Relative effort:** Large.  
**Primary owners:** Product, privacy/legal, backend, frontend.

## P0-15 — [Refactor] Automated release pipeline, migrations, and rollback readiness

**Problem:** Typecheck, content validation, and smoke pass, but lint is interactive and the build did not complete within the review window. Manual SQL/dashboard steps and mutable eval summaries also increase release risk.

**Scope**

- Configure non-interactive ESLint and make lint a CI gate.
- Run typecheck, unit/integration tests, safety eval, content validator, privacy schema tests, story-quality eval, production build, migration checks, and dependency/security checks in CI.
- Add route tests for auth ownership, rate limits, acknowledgement races, provider timeouts, and fallbacks.
- Move schema changes to a repeatable migration workflow with preflight and rollback/forward-fix plans.
- Add deployment health checks for provider configuration, embeddings, recipe approval, source/spec availability, cron health, and email auth.
- Define feature flags and kill switches for personalized composition, individual stages, providers, and retrieval recipes.

**Acceptance criteria**

- CI is non-interactive and required for main/release promotion.
- A clean checkout can build and run the complete hermetic suite.
- A failed provider or new story engine can be disabled without redeploying unrelated code.
- A staged rollback exercise succeeds before public launch.

**Dependencies:** Incorporates gates from all other P0 work.  
**Relative effort:** Large.  
**Primary owners:** Platform/release engineering, all engineering leads.

## P0-16 — [UI/UX] Cross-flow design system and accessibility hardening

**Problem:** The landing and sign-in surfaces are relatively polished, while intake, errors, story library, and reader use simpler and sometimes inconsistent patterns. Public trust depends on a coherent, accessible experience.

**Scope**

- Define reusable typography, spacing, color, form, button, status, card, masthead, source, and reader primitives.
- Standardize copy voice for empty, loading, error, crisis, weak-match, success, save, and deletion states.
- Audit semantic headings, focus order, live regions, error association, keyboard support, screen-reader output, zoom/reflow, contrast, reduced motion, and tap targets.
- Test with real target users, including users reading under stress or with cognitive load.
- Ensure sensitive disclosures are hidden by default on list, history, notification, and browser-title surfaces.

**Acceptance criteria**

- All public flows pass automated and manual accessibility review.
- No flow requires animation, double click, hover, or pointer precision.
- Design primitives replace duplicated high-risk interaction styles.
- Usability tests confirm users can leave, recover, save, and delete without confusion.

**Dependencies:** P0-06, P0-07, P0-08, and P0-14 define the core patterns.  
**Relative effort:** Large.  
**Primary owners:** Design systems, frontend, accessibility QA.

## P0-17 — [Feature] Emotional boundaries and story-intensity controls

**Problem:** The library includes grief, suicide loss, abuse, discrimination, addiction, illness, and other material that can be deeply relevant to one reader and destabilizing to another. Today the match can place a user into that content without asking what they want to avoid or how directly they want it told.

**Scope**

- Add a lightweight, optional “Keep this story…” control at intake or before opening: gentle/direct detail and broad topics to avoid.
- Attach reviewed content flags, intensity, and a spoiler-light content note to every published `StorySpec`.
- Treat an explicit user boundary as a hard eligibility constraint before reranking and composition; it is not a soft preference the matcher may override.
- Ensure alternate matches and fallbacks obey the same boundaries.
- Let the reader change boundaries, leave, or request another story without re-entering the disclosure.
- Do not log the selected topic names in general telemetry; record only whether boundaries were set and whether an eligible story was found.

**Acceptance criteria**

- No stage or generated artifact can bypass an explicit excluded topic or maximum intensity.
- Content notes are accurate, concise, non-graphic, and editorially reviewed.
- The default public prose remains non-graphic even when the reader selects direct language.
- Boundary controls work with keyboard and screen reader and do not resemble a clinical intake.
- If boundaries remove all close matches, the product says so honestly and offers a safe recovery path.

**Dependencies:** P0-02 `StorySpec`, P0-05 match recovery, P0-06 intake, and P0-12 safety review.  
**Relative effort:** Medium to large.  
**Primary owners:** Product, safety/editorial, matching, design, frontend.

---

# P1 — High-priority fast-follows

## P1-01 — [Refactor] Facet query projections and eval-gated dynamic retrieval

Replace raw-feeling reuse across all vector lanes with validated, figure-neutral per-facet projections and bounded dynamic weights. Run FacetsRAG in shadow mode; promote only when it beats the keyword baseline on blind real-world cases, semantic hard cases, calibration, latency, and definitive-wrong rate. **Acceptance:** no production traffic until the P0-13 promotion gate passes. **Effort:** Large.

## P1-02 — [Feature] Reader-controlled story emphasis

Offer one optional, non-branching emphasis choice—such as “stay with the setback,” “focus on the turning point,” or “keep some distance.” It may adjust approved transitions, detail selection, or pacing, but not historical events or outcomes. **Acceptance:** choices preserve the same fact graph, remain optional, and improve resonance in experiment results. **Effort:** Medium.

## P1-03 — [Feature] Controlled full-beat regeneration experiment

Test session-specific regeneration of all seven beats only after the hybrid composer is stable. Compare against canonical and partially personalized artifacts using blind factuality and resonance review. Keep canonical fallback and fact-ID coverage mandatory. **Acceptance:** the challenger materially improves resonance without lowering any factual, tone, safety, privacy, latency, or fallback gate. **Effort:** Extra large.

## P1-04 — [Refactor] Editorial workbench and content lifecycle

Build an internal workflow for research intake, fact/source mapping, draft generation, human review, preview with benchmark disclosures, staged publishing, warnings, historical reports, and rollback. **Acceptance:** editors can ship or unpublish a stage without code edits, while every change remains versioned and reviewable. **Effort:** Large.

## P1-05 — [Feature] Demand-led stage expansion and multi-stage figures

Use aggregate no-match and feedback categories to add emotional episodes, including additional stages for existing figures when one life contains more than one distinct down moment. Prioritize coverage, cultural breadth, and age gaps over fame. **Acceptance:** each new stage passes the same StorySpec, evaluation, and editorial gates; library growth improves coverage without lowering precision. **Effort:** Ongoing large editorial program.

## P1-06 — [UI/UX] Saved-story library v2

Add clear privacy status, source access, delete controls, reading status, and optional filters by figure or broad non-sensitive theme. Never display the original disclosure in list views. **Acceptance:** revisiting and deletion are understandable across devices, and account conversion does not interrupt the story coda. **Effort:** Medium.

## P1-07 — [Feature] Controlled model and prompt experimentation

Create a registry for model/prompt challengers, offline replay, stratified assignment, cost/latency capture, and automatic guardrail shutdown. **Acceptance:** every experiment is recipe-pinned, privacy-safe, statistically planned, and unable to bypass P0 quality gates. **Effort:** Medium to large.

## P1-08 — [UI/UX] Market-aware copy, resources, and localization foundation

Externalize UI copy, resource configuration, date formats, and reading typography. Establish human review for cultural equivalence in sensitive and historical language. **Acceptance:** resource and copy selection follows a supported market/locale policy rather than browser language alone. **Effort:** Large.

## P1-09 — [Feature] Gentle revisit and reflection mode

Let saved users revisit a story and optionally add a private, device-appropriate reflection about what changed. Avoid reminders by default, streaks, sentiment scoring, or claims of therapeutic progress. **Acceptance:** reflection data has explicit consent, deletion, export, and retention controls. **Effort:** Medium.

## P1-10 — [Refactor] Latency and cost optimization after instrumentation

Use measured traces to introduce safe caching of curated inputs, prompt compaction, provider hedging where justified, generation prefetch, and cost budgets. Do not cache user-derived prompts across users. **Acceptance:** latency-budget compliance and cost improve with no quality-gate regression and no new sensitive-data persistence. **Effort:** Medium.

## P1-11 — [Feature] Two-perspective match choice for ambiguous cases

When two candidates are genuinely close but represent different emotional shapes, show two anonymous, two-sentence previews such as “a story about starting over alone” and “a story about years of work going unseen.” Let the reader pick the one that feels nearer. Use this only for calibrated ambiguity, not every session. **Acceptance:** previews are evidence-grounded, disclose the meaningful gap, obey content boundaries, add no more than one decision, and improve felt-close rate over automatic selection. **Effort:** Medium.

## P1-12 — [Feature] Private Carry-Forward Card

After the coda, let the reader choose one verified line or moment from the story and optionally write one sentence they want to carry forward—an observation, question, or small self-chosen action. The product must not generate a prescription or score follow-through. Save it privately with deletion and export controls. **Acceptance:** the card is optional, user-authored, separate from feedback, never used to infer mental state, and increases save/revisit value without lowering story completion. **Effort:** Medium.

## P1-13 — [UI/UX] Short and full reading modes

Offer a short edition for a two-to-three-minute read and a full edition for the existing slower arc. Both must compile from the same `StorySpec`, preserve the same truth and emotional turn, and end with the same honest framing. Remember the preference only with consent. **Acceptance:** neither edition invents a separate summary, source coverage remains complete, the user can expand from short to full without losing place, and metrics are segmented by edition. **Effort:** Medium to large.

## P1-14 — [Feature] Opt-in private context continuity

Let returning users choose to remember only stable preferences: age band, reading length, emotional distance, excluded topics, and figures already read. Do not reuse old disclosures or automatically construct a psychological profile. Show and delete every remembered preference from account settings. **Acceptance:** continuity is off by default, improves repeat-start time and duplicate-match rate, and has explicit consent, encryption/access controls, and deletion coverage. **Effort:** Medium.

## P1-15 — [Feature] Redacted conversation card

Create a printable/copyable card containing the historical episode, source link, a user-selected story line, and—only if chosen—their Carry-Forward sentence. Exclude the intake, match rationale, private metadata, and generated sensitive bridge by default. This makes Onward useful as a starting point with a friend, teacher, counselor, or therapist without making the product clinical. **Acceptance:** the user previews every included field, sharing is revocable when link-based, and the default artifact contains no disclosure-derived prose. **Effort:** Medium.

## P1-16 — [Feature] Outcome-diverse story library

Expand the content model beyond “pain before famous success.” Curate episodes whose honest onward movement was endurance, accepting help, adapting to permanent change, leaving an old ambition, repairing a relationship, or building an ordinary meaningful life. Add an editorial arc taxonomy and balance dashboard without presenting it as a user diagnosis. **Acceptance:** launch research shows the library no longer implies that suffering is redeemed by fame, and every new outcome shape meets the same evidence and resonance gates. **Effort:** Large, primarily editorial.

## P1-17 — [UI/UX] Source-grounded “What changed next” map

At the end, offer a compact timeline separating what the figure did, what other people or circumstances changed, what failed, and how long the turn actually took. This corrects the common impression that one brave decision caused later success. It describes history; it does not tell the reader to copy it. **Acceptance:** every timeline node resolves to fact IDs, time gaps are explicit, external help is visible, and no node is phrased as advice. **Effort:** Medium.

## P1-18 — [Feature] Optional source-grounded afterword lenses

Let a reader open one optional factual afterword: “Who helped them?”, “What did not work first?”, or “What took longer than the story could show?” Each lens is pre-authored or evidence-constrained from the `StorySpec`; it never changes the canonical ending. **Acceptance:** lenses improve source engagement or perceived usefulness, add no unsupported claims, remain optional after the emotional coda, and do not become an infinite content feed. **Effort:** Medium to large.

---

# P2 — Future considerations

## P2-01 — [UI/UX] Optional human-quality audio narration

Offer accessible narration with speed, transcript synchronization, and clear synthetic-voice disclosure. Keep it opt-in and avoid emotionally manipulative music. **Prerequisite:** stable final prose, rights review, and privacy-safe audio generation.

## P2-02 — [Feature] Native/offline reading surfaces

Consider installable/native experiences and encrypted offline access only after the web product proves repeat use. **Prerequisite:** mature session revocation, local-data deletion, and offline privacy design.

## P2-03 — [Feature] Privacy-preserving story sharing

Allow users to share the canonical historical episode or a redacted story card, never the disclosure or personalized bridge by default. **Prerequisite:** preview, expiry, revoke, indexing protection, and recipient-safety controls.

## P2-04 — [Feature] Facilitator pilot for educators, counselors, and support organizations

Test a recommendation/reflection mode with trained partners while preserving the non-clinical boundary. **Prerequisite:** research protocol, safeguarding, consent, and no provider dashboard containing user disclosures.

## P2-05 — [Refactor] Database-native vector retrieval at larger library scale

Move exact cosine from per-process memory to indexed database/vector search when measured library size, cold-start time, cache duplication, or query latency warrants it. **Prerequisite:** retrieval quality parity and an operational migration benchmark; sophistication alone is not a reason.

## P2-06 — [Feature] Multilingual stories and cross-language retrieval

Support additional languages only with native editorial review, source handling, culturally competent safety resources, and cross-language quality benchmarks. Translation-only generation is insufficient for the product promise.

## P2-07 — [UI/UX] Curated thematic collections

Offer small editorial shelves such as “starting late” or “finding a voice” for optional browsing. Keep the default product centered on one matched story and avoid infinite scroll.

## P2-08 — [Feature] Carefully governed community layer

Community responses, shared reflections, or peer support should remain out of scope until moderation, abuse prevention, youth safeguards, crisis escalation, privacy, and the non-therapy boundary have been independently designed and funded.

## Explicit non-goals for the next public release

The following are not roadmap items for P0 or P1:

- AI chat with the historical figure.
- Synthetic avatars or deepfake voice/persona simulation.
- Public profiles, likes, follower graphs, or leaderboards.
- Streaks, push-pressure, or “daily pain” engagement loops.
- User-authored public stories.
- Automated diagnosis, treatment recommendations, or risk scoring.
- Unreviewed open-web RAG at runtime.
- Unconstrained generation of dates, quotes, people, places, or historical outcomes.
