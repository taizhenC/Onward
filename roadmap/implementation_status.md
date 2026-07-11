# Roadmap Implementation Status

**Authoritative objective:** finish every item in `feature_roadmap.md`.  
**Status date:** July 10, 2026  
**Evidence rule:** an item is `Complete` only when every acceptance criterion is implemented and directly verified. Passing a neighboring test is not sufficient.

## Status meanings

- `Not started` — no implementation evidence.
- `Partial` — useful foundations exist, but one or more acceptance criteria are missing.
- `In progress` — actively being implemented on the current dependency branch.
- `Complete` — all stated acceptance criteria have direct code/test/runtime evidence.
- `External gate` — implementation may exist, but the item also requires real users, editorial review, safety review, a market decision, or production observation.

## P0 ledger

| ID | Status | Current evidence | Missing proof / next dependency |
|---|---|---|---|
| P0-01 | External gate | Existing 104-case match eval and trust gate. | End-to-end consented benchmark, blind holdout, reviewer rubric, and full-artifact release gate. |
| P0-02 | In progress | Versioned StorySpec contract, atomic facts, sentence-level evidence maps, source-scope gates, entity/quote links, chronology checks, dramatization limits, reviewer metadata, immutable database versions, fail-closed runtime loading, protected draft seeding, and independent per-stage publish/retire operations are implemented. All 50 legacy stages convert to valid review drafts, and all 50 are rejected when publication is attempted. | The generated drafts intentionally retain broad evidence references and empty beat-to-fact links. Editorial researchers must create exact/bounded locators, resolve quotes/entities/causal claims, and record real reviews for the launch subset before any stage is publicly eligible. |
| P0-03 | In progress | New sessions create a strict short-lived ResonanceBrief and pass only its governed projection into a separate Story Composer/provider boundary. The model can select one allowed transition role and approved transition/bridge template IDs, but cannot author prose or claims. The composer deterministically renders those choices onto the canonical seven-beat StorySpec, preserves exact fact/entity/quote IDs and chronology, validates privacy/tone/zones/recipe/hash, retries once with closed failure codes, then returns a complete canonical artifact on provider, output, privacy, or validator failure. Immutable v4 artifacts pin analyzer/match/model/composer/validator/boundary/template/plan versions; v1-v3 replay remains supported. | Obtain blind human resonance/editorial/safety evidence for the hybrid recipe, add real Postgres transaction/JSONB round-trip evidence, production latency/fallback gates and dashboards, and an editorially safe migration plan for permanent pre-0005 sessions before `Complete`. |
| P0-04 | In progress | All 50 canonical bridges and the demo no longer repeat intake; legacy placeholders are sanitized before chunking. Generated opening and hybrid bridge/transition paths receive only the governed ResonanceBrief projection and are rejected through HMAC exact/eight-word/named-detail/Unicode fingerprints plus placeholder, promise, diagnosis, prescription, equivalence, and closed-template gates. Mock provider capture proves raw text, names, dates, anchors, and hashes do not enter either prose request; artifacts store none of the brief or fingerprints. | Add closed telemetry reductions and explicit derived-output retention classes, then audit each future prose/provider path before `Complete`. |
| P0-05 | In progress | A versioned deterministic disposition policy converts server-only confidence and age fallback into close, adjacent, one-question, or no-close states. Medium/low first passes ask one six-option question; an answered low match stops honestly without persistence; explicit closest-story acceptance forces partial framing. The preface visibly states that the lives are not the same. Owner/input-bound opaque recovery credits are single-use, purpose-limited, rate-limit safe, and expire in ten minutes. | Calibrate thresholds and prove the question's expected value on the consented holdout; add measured try-another/none-of-these recovery with P0-10; complete browser usability/accessibility evidence and include miss/clarification performance in the release benchmark. |
| P0-06 | Partial | Functional age/free-text intake, honest expectation copy, just-in-time privacy, optional non-clinical story limits, one bounded clarification, retained in-memory draft across no-eligible/no-close recovery, and gentle focused states are implemented. | Stronger initial guided prompt/context, retry across full navigation/reload without unsafe persistence, and browser usability/accessibility evidence. |
| P0-07 | In progress | Reader is book-like; current branch adds visible reveal control and explicit Continue/Finish. | Full coda sequencing, orientation, browser usability/accessibility coverage, and responsive QA. |
| P0-08 | Not started | Source arrays exist server-side. | User-facing rationale/gap, source drawer, provenance labels, fact report workflow. |
| P0-09 | In progress | Current branch adds owner-scoped atomic compare-and-set; progress moves only on explicit Continue/Finish; smoke covers advance/retry/stale/foreign cases. | Browser-level refresh, back-button, offline, double-click, and multi-tab E2E evidence before `Complete`. |
| P0-10 | Not started | None. | Feedback schema/UI, bounded reasons, privacy controls, and rate-limit-safe alternate story. |
| P0-11 | Not started | Code avoids deliberate sensitive logging. | Closed event schema, reductions, privacy rejection tests, dashboards, and alerts. |
| P0-12 | External gate | Deterministic pre-provider gate; versioned 39-case corpus passes 26/26 critical positives; resource actions are region-specific, linked, and dated; crisis persistence/kill-switch behavior is smoke-tested; the match route and intake return resources before auth, age, malformed boundaries, or malformed recovery fields; incident runbook exists. | Qualified safety review, launch-market approval, and a deliberate policy for context/negation over-triggers remain required before `Complete`. |
| P0-13 | In progress | Approved recipe ID, keyword default, production rejection of `auto`, deploy docs, and smoke proof exist; each immutable artifact pins the complete match recipe plus analyzer, match-recovery, composer, validator, boundary, hybrid-plan, and template-policy versions. | Immutable multi-run eval history, deployment startup check, shadow promotion record, and rollback exercise. |
| P0-14 | Partial | Guest cleanup and 60-day raw-disclosure nulling exist; StoryArtifacts are owner-scoped and cascade with their session/user. Recovery stores only an opaque-token hash, keyed base-input fingerprint, owner, purpose, and expiry; it is single-use, usable for ten minutes, cascade-deleted with the user, and removed by a 15-minute cleanup job. | User-facing story/account deletion, full derived-data retention classes, consent UI, privacy page, real cascade/cron tests, and market/youth review. |
| P0-15 | In progress | Strict non-interactive ESLint, isolated production build, deterministic fonts, CI, approved-recipe fail-closed behavior, story kill switch, independent hybrid-composer flag, four-path provider health check, and migrations for immutable StorySpecs/StoryArtifacts plus atomic single-use recovery credits exist. | Complete route/integration matrix, real migration preflight/rollback and atomic-RPC tests, broader health/readiness checks, remaining kill switches, and green remote CI evidence. |
| P0-16 | Partial | Landing/auth typography, reduced motion, several keyboard affordances, native boundary and clarification controls, focused no-eligible/no-close live states, visible partial framing, and labeled content notes exist. | Shared primitives, all-flow copy system, and complete keyboard/screen-reader/zoom/manual usability audit. |
| P0-17 | In progress | Strict optional boundary input, reviewed StorySpec catalog, hard pre-retrieval intensity/topic filtering, age-fallback protection, artifact-level `boundary_violation`, identical canonical-fallback enforcement, non-persistence of selections, honest no-eligible recovery, native accessible controls, and reviewed-only content-note projection are implemented and directly checked. | Replace inferred draft profiles with human-reviewed launch profiles; add change/try-another controls from the active reader without re-entering disclosure; complete keyboard, screen-reader, reflow, and safety/editorial review before `Complete`. |

## P1 ledger

| ID | Status | Current evidence | Missing proof / next dependency |
|---|---|---|---|
| P1-01 | Partial | Six-lane FacetsRAG skeleton and retrieval eval exist. | Validated per-facet projections, dynamic weights, shadow execution, holdout superiority, promotion. |
| P1-02 | Not started | None. | Optional non-branching emphasis choice and experiment evidence. |
| P1-03 | Partial | P0 hybrid composition now personalizes only approved transition/bridge templates while preserving canonical beats and evidence. | Full-beat free-prose challenger behind the same StorySpec/validation contract and a blind comparison. |
| P1-04 | Partial | Seed/check scripts and database draft/published status exist. | Internal research/review/preview/publish/report/rollback workbench. |
| P1-05 | Partial | Fifty one-stage figures and content validation exist. | Demand-led coverage data, additional stage support in product workflow, measured coverage improvement. |
| P1-06 | Partial | Basic private saved-story list exists. | Privacy status, sources, delete, progress, filters, and cross-device usability. |
| P1-07 | Partial | Provider toggles, recipe metadata, and offline eval exist. | Challenger registry, safe assignment, stopping rules, automatic guardrail shutdown. |
| P1-08 | Not started | English copy and static broad resources. | Externalized copy/resources, market policy, native editorial review. |
| P1-09 | Not started | Saved stories can be reopened. | Explicit private reflection mode with consent/deletion and non-clinical guardrails. |
| P1-10 | Partial | Provider boundaries, client reveal, and build size output exist. | Production traces, measured bottleneck work, cost budgets, verified quality-neutral optimization. |
| P1-11 | Not started | Matcher already has a ranked shortlist internally. | Calibrated ambiguity rule, two safe previews, choice UI, experiment. |
| P1-12 | Not started | None. | Private user-authored Carry-Forward Card, persistence, deletion/export, outcome evidence. |
| P1-13 | Not started | One canonical chunked edition. | Short/full compilers from one StorySpec, source parity, place-preserving expansion. |
| P1-14 | Not started | Account exists; no preference profile. | Opt-in inspectable/deletable stable preferences without disclosure reuse. |
| P1-15 | Not started | None. | Previewed redacted card, safe defaults, revoke/expiry for links. |
| P1-16 | Partial | Some arcs show adaptation and endurance, but the library is achievement-heavy. | Arc taxonomy, balance audit, new reviewed outcome shapes, target-user evidence. |
| P1-17 | Not started | Source chronology exists only inside prose. | Fact-linked external/action/help/failure/time map. |
| P1-18 | Not started | None. | Optional evidence-linked afterword lenses and usefulness evidence. |

## P2 ledger

| ID | Status | Current evidence | Missing proof / next dependency |
|---|---|---|---|
| P2-01 | Not started | None. | Optional disclosed narration, controls, transcript sync, rights/privacy review. |
| P2-02 | Not started | Web app only. | Proven web repeat use, offline encryption/deletion/revocation, native implementation. |
| P2-03 | Not started | Private URLs are non-shareable across owners. | Redacted canonical share artifact, preview, expiry, revoke, index and recipient controls. |
| P2-04 | Not started | None. | Research/safeguarding protocol and non-clinical facilitator pilot. |
| P2-05 | Not started | Exact in-memory cosine is appropriate at current scale. | Measured scale trigger, indexed migration, quality/latency parity benchmark. |
| P2-06 | Not started | English-only content/retrieval. | Native editorial, safety resources, cross-language benchmarks, localized product. |
| P2-07 | Not started | No browse surface. | Small curated shelves without infinite feed and measured discovery value. |
| P2-08 | Not started | No community surface. | Independently funded moderation, abuse, youth, crisis, privacy, and boundary design. |

## Current branch verification

Branch: `roadmap-implementation`

| Command | Result |
|---|---|
| `npm run typecheck` | Pass |
| `npm run lint` | Pass, zero warnings |
| `npm run check-figure` | Pass, 50/50 stages |
| `npm run smoke` | Pass, 14/14 |
| `NEXT_DIST_DIR=.next-ci npm run build` | Pass; 11 static/dynamic routes compiled and generated |

### Stacked branch: `roadmap-safety-privacy`

| Command | Result |
|---|---|
| `npm run lint` | Pass, zero warnings |
| `npm run typecheck` | Pass |
| `npm run check-figure` | Pass, 50/50 stages and no disclosure placeholders |
| `npm run eval-crisis` | Pass, 26/26 critical positives; review-only over-trigger IDs reported |
| `npm run smoke` | Pass, 16/16 including disclosure, crisis persistence, and kill-switch assertions |
| `NEXT_DIST_DIR=.next-ci npm run build` | Pass; 11 routes compiled/generated |

### Stacked branch: `roadmap-storyspec`

| Command | Result |
|---|---|
| `npm run lint` | Pass, zero warnings |
| `npm run typecheck` | Pass |
| `npm run check-story-spec` | Pass; 50/50 drafts valid and 50/50 unsafe publish attempts rejected |
| `npm run check-figure` | Pass, 50/50 stages |
| `npm run eval-crisis` | Pass, 26/26 critical positives |
| `npm run smoke` | Pass, 16/16 regressions |
| `NEXT_DIST_DIR=.next-ci npm run build` | Pass; 11 routes compiled/generated |

### Stacked branch: `roadmap-story-artifacts`

| Command | Result |
|---|---|
| `npm run lint` | Pass, zero warnings |
| `npm run typecheck` | Pass |
| `npm run check-figure` | Pass, 50/50 stages |
| `npm run check-story-spec` | Pass, 50/50 safe drafts and 50/50 unsafe publish attempts rejected |
| `npm run check-story-artifact` | Pass, 50/50 complete artifacts; disclosure, JSONB key-order, tamper, opening-copy, and static migration-shape gates |
| `npm run eval-crisis` | Pass, 26/26 critical positives |
| `npm run smoke` | Pass, 19/19 including private immutable replay, storage-boundary tamper rejection, nested freezing, injected atomic rollback, explicit legacy compatibility, and publication eligibility through age fallback |
| `NEXT_DIST_DIR=.next-ci npm run build` | Pass; 11 routes compiled/generated |

### Stacked branch: `roadmap-story-boundaries`

| Command | Result |
|---|---|
| `npm run lint` | Pass, zero warnings |
| `npm run typecheck` | Pass |
| `npm run check-story-spec` | Pass; 50/50 safe drafts, 50/50 unsafe publish attempts rejected, and closed content-profile enums enforced |
| `npm run check-story-artifact` | Pass; 50/50 complete artifacts, 50/50 privacy checks, and 50/50 tamper attempts rejected |
| `npm run check-story-boundaries` | Pass; strict parsing, full intensity/topic matrix, retrieval and artifact enforcement, non-persistence, no-eligible recovery, and unauthenticated crisis precedence |
| `npm run eval-crisis` | Pass, 26/26 critical positives |
| `npm run smoke` | Pass, 19/19 regressions |
| `NEXT_DIST_DIR=.next-ci npm run build` | Pass; 11 routes compiled/generated |

### Stacked branch: `roadmap-resonance-brief`

| Command | Result |
|---|---|
| `npm run lint` | Pass, zero warnings |
| `npm run typecheck` | Pass |
| `npm run check-resonance-brief` | Pass; 9/9 governed projections, strict/frozen schema, HMAC phrase/name/date/Unicode guards, and mocked provider-capture privacy |
| `npm run check-story-spec` | Pass; 50/50 safe drafts and 50/50 unsafe publish attempts rejected |
| `npm run check-story-artifact` | Pass; 50/50 complete v3 artifacts, v1/v2 replay, disclosure exclusion, and tamper rejection |
| `npm run check-story-boundaries` | Pass; retrieval/composition exclusions and no-persistence recovery remain enforced |
| `npm run eval-crisis` | Pass, 26/26 critical positives |
| `npm run smoke` | Pass, 19/19 regressions |
| `NEXT_DIST_DIR=.next-ci npm run build` | Pass; 11 routes compiled/generated |

### Stacked branch: `roadmap-hybrid-composer`

| Command | Result |
|---|---|
| `npm run lint` | Pass, zero warnings |
| `npm run typecheck` | Pass |
| `npm run check-story-composer` | Pass; first-pass hybrid, one structured retry, provider/output/validator fallbacks, feature flag, boundary preflight, exact evidence spine, and provider projection |
| `npm run check-resonance-brief` | Pass; 9/9 governed projections and privacy fingerprints |
| `npm run check-story-spec` | Pass; 50/50 safe drafts and 50/50 unsafe publish attempts rejected |
| `npm run check-story-artifact` | Pass; 50/50 complete v4 artifacts, v1-v3 replay, privacy, and tamper rejection |
| `npm run check-story-boundaries` | Pass; retrieval/composition exclusions remain enforced |
| `npm run eval-crisis` | Pass, 26/26 critical positives |
| `npm run smoke` | Pass, 19/19 including an integrated first-pass hybrid artifact with two allowlisted zones |
| `NEXT_DIST_DIR=.next-ci npm run build` | Pass; 11 routes compiled/generated |

### Stacked branch: `roadmap-match-recovery`

| Command | Result |
|---|---|
| `npm run lint` | Pass, zero warnings |
| `npm run typecheck` | Pass |
| `npm run check-match-recovery` | Pass; closed decision matrix, one question, no-persistence weak states, improved controlled retrieval, visible partial framing, owner/input/purpose-bound single-use recovery, replay/foreign rejection, and rate-budget safety |
| `npm run check-story-composer` | Pass; hybrid and canonical fallback contracts unchanged |
| `npm run check-resonance-brief` | Pass; clarification override uses governed projection and hashed provenance |
| `npm run check-story-spec` | Pass; 50/50 safe drafts and 50/50 unsafe publish attempts rejected |
| `npm run check-story-artifact` | Pass; 50/50 complete artifacts, v1-v3 replay, privacy, and tamper rejection |
| `npm run check-story-boundaries` | Pass; hard exclusions remain enforced before recovery/matching |
| `npm run eval-crisis` | Pass, 26/26 critical positives |
| `npm run smoke` | Pass, 19/19 regressions |
| `NEXT_DIST_DIR=.next-ci npm run build` | Pass; 11 routes compiled/generated; `/begin` 4.8 kB route payload |

`npm run eval-retrieval` was not used as branch evidence: it requires the real Gemini provider, while network/provider access is unavailable in the local sandbox. Matching's new eligibility filter is covered by type, smoke, and artifact/publication gates; the provider retrieval eval remains a release-gate dependency.

## Completion audit rule

The goal remains active until every row above is `Complete` and every external gate has authoritative evidence. A PR merge, green CI check, model output, or local smoke result completes only the acceptance criteria it directly covers.
