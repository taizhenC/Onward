# Roadmap Implementation Status

**Authoritative objective:** finish every item in `feature_roadmap.md`.  
**Status date:** July 14, 2026
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
| P0-03 | In progress | New sessions create a strict short-lived ResonanceBrief and pass only its governed projection into a separate Story Composer/provider boundary. The model can select one allowed transition role and approved transition/bridge template IDs, but cannot author prose or claims. The composer deterministically renders those choices onto the canonical seven-beat StorySpec, preserves exact fact/entity/quote IDs and chronology, validates privacy/tone/zones/recipe/hash, retries once with closed failure codes, then returns a complete canonical artifact on provider, output, privacy, or validator failure. Immutable v5 artifacts pin analyzer/match/model/composer/validator/boundary/template/plan versions plus public provenance; v1-v4 replay remains supported without reconstructing old provenance. | Obtain blind human resonance/editorial/safety evidence for the hybrid recipe, add real Postgres transaction/JSONB round-trip evidence, production latency/fallback gates and dashboards, and an editorially safe migration plan for permanent pre-0005 sessions before `Complete`. |
| P0-04 | In progress | All 50 canonical bridges and the demo no longer repeat intake; legacy placeholders are sanitized before chunking. Generated opening and hybrid bridge/transition paths receive only the governed ResonanceBrief projection and are rejected through HMAC exact/eight-word/named-detail/Unicode fingerprints plus placeholder, promise, diagnosis, prescription, equivalence, and closed-template gates. Mock provider capture proves raw text, names, dates, anchors, and hashes do not enter either prose request; artifacts store none of the brief or fingerprints. Provider/flow failures now pass through string-hostile reducers that retain only closed error/status/latency buckets; canary tests prove exception messages, stacks, and bodies are discarded. | Define explicit derived-output retention classes and audit each future prose/provider path before `Complete`. |
| P0-05 | In progress | A versioned deterministic disposition policy converts server-only confidence and age fallback into close, adjacent, one-question, or no-close states. Medium/low first passes ask one six-option question; an answered low match stops honestly without persistence; explicit closest-story acceptance forces partial framing. The preface visibly states that the lives are not the same. Owner/input-bound opaque recovery credits are single-use, purpose-limited, rate-limit safe, and expire in ten minutes. | Calibrate thresholds and prove the question's expected value on the consented holdout; add measured try-another/none-of-these recovery with P0-10; complete browser usability/accessibility evidence and include miss/clarification performance in the release benchmark. |
| P0-06 | Partial | Functional age/free-text intake, honest expectation copy, just-in-time privacy, optional non-clinical story limits, one bounded clarification, retained in-memory draft across no-eligible/no-close recovery, and gentle focused states are implemented. Client and server now share the same whole-number age plus NFC code-point disclosure limits, including emoji-safe counting. | Stronger initial guided prompt/context, retry across full navigation/reload without unsafe persistence, and browser usability/accessibility evidence. |
| P0-07 | In progress | Reader is book-like with visible reveal control and explicit Continue/Finish. The final bridge stays mounted while the afterword and save action appear, and a completed-story refresh now restores the bridge before the coda. | Add quiet orientation and production loading/error polish; complete browser usability/accessibility coverage and responsive QA. |
| P0-08 | In progress | Immutable v5 artifacts now carry a closed disclosure-safe rationale and explicit gap, pinned StorySpec identity/version, reviewed-vs-draft provenance, safe source projection, only referenced fact/quote evidence, qualified/interpretive/reader-bridge labels, and hybrid-connective disclosure. The end-state reader exposes the rationale plus native source/evidence drawers. An exact three-field owner-scoped API validates fact membership; migration `0007` atomically writes only safe content identifiers and closed reasons into a default-deny, idempotent editorial queue with service-only triage and existing rapid retirement. Synthetic public evidence covers verbatim/paraphrase/disputed quotes; all 50 current drafts are honestly labeled as drafts; v1-v4 replay exposes no fabricated provenance. | Publish a real launch StorySpec with researcher-authored exact/bounded evidence and exercise its quote/source projection; run the migration, RLS/concurrency, triage, and retirement drill against real Postgres; complete keyboard/screen-reader/mobile/zoom testing and target-user trust comprehension before `Complete`. |
| P0-09 | In progress | Progress moves only on explicit Continue/Finish. Migration `0013` locks the owned session, independently validates the immutable artifact's complete passage layout, derives the only legal next position, and atomically captures the bounded flattened passage ordinal plus final completion. Response-loss replay restores deterministic events/outbox pointers without advancing twice; memory mode mirrors the transaction. Artifact validator v2 caps every public story at 64 passages, while the migration fails safe unless every persisted validator-v1 artifact already satisfies the same passage contract. | Real-Postgres concurrency/RLS/rollback evidence plus browser-level refresh, back-button, offline, double-click, and multi-tab E2E evidence before `Complete`. |
| P0-10 | In progress | Completed-story readers—including anonymous owners—can answer one close/not-close question with exactly one of seven closed miss reasons. After a durable rejection, a root story can issue one owner/session/artifact-bound capability and generate one different, always-partial story without browser replay of age, disclosure, limits, clarification, reason, candidates, or prose and without a public rate unit. The exact previous stage is removed before age fallback, keyword/Facets retrieval, reranking, fallback, and composition. The original closed context exists only on the root, has an immutable expiry, and is reused under the same hard boundaries; the alternate stores only lineage/deadline and no age, disclosure, limits, or clarification. Empty/low coverage stops honestly; operational failures get two leased attempts with a server-enforced cooldown; concurrent clicks converge; a live second lease hydrates as preparing rather than exhausted; the one-hour capability TTL is consistently start-by while the two-minute lease and original disclosure deadline remain finish-by. SQL finalization rechecks feedback/completion/publication/authoritative content profile/boundaries atomically. Owner-scoped SSR and a separate exact capability-refresh endpoint restore available, preparing, ready, unavailable, expired, exhausted, and timed transient states after reload/back without resending the miss reason. Terminal outcomes and local Back/Stay transitions restore focus, and cross-tab feedback refresh remounts from the durable projection. | Add separate consented/encrypted short-retention optional notes or record an explicit product/privacy decision not to collect them; prove anonymous Supabase migration/RPC/RLS/cross-instance lease/cron/deletion behavior, browser accessibility/navigation, and aggregate learning with P0-11. |
| P0-11 | In progress | The exact 22-event product union and unlinkable attempt stream reject sensitive/unbounded shapes and reduce failures to closed buckets. Purpose-separated HMAC IDs are retry-stable; signed flows have an immutable 30-day lifetime. Migrations `0011`-`0013` implement the owner/root lifecycle, leased outbox, initial intake/match/recovery/artifact producers, and transactional passage/completion capture. Migration `0014` commits bounded feedback with a persisted-verdict event and no miss reason. Migration `0015` captures `alternate_requested` only after a durable claim. Migration `0016` adds alternate match calibration and atomically derives the alternate artifact denominator plus first-write-wins terminal outcomes from authoritative state. Fixed entry endpoints capture CTA and first interaction without a tracking SDK. Three exact reader-visibility endpoints now capture match-to-preface and Continue-to-passage latency plus first source opening; the browser sends closed buckets/session lookup and bounded current beat/chunk coordinates only where required, while the server verifies reached progress and derives role, ordinal, completion eligibility, and immutable playback context. Direct story/reload visits without bound timing, cross-origin/malformed calls, and incident-disabled telemetry remain silent. Exact retries reconcile or deduplicate by semantic unit, capture conflicts roll back domain transitions, and null/revoked flows preserve the product without fabricated telemetry. Memory mode mirrors these transaction and privacy semantics. Crisis resources still return before the match route parses the flow or writes a crisis event. | Add story-flow-auth endpoints plus one sanitized failure owner; operate a privacy-reviewed dispatcher/reconciler (including in-flight deletion); add temporal aggregates, dashboards, alerts/on-call, minimum-cell rollups, and real Postgres migration/RLS/concurrency/cron/cascade/idempotency proof. |
| P0-12 | External gate | Deterministic pre-provider gate; versioned 39-case corpus passes 26/26 critical positives; resource actions are region-specific, linked, and dated; crisis persistence/kill-switch behavior is smoke-tested; the route returns resources before flow/auth/age validation, the client reaches that route before anonymous sign-in, and intake exposes an always-available reviewed-resource action without requiring a valid age/disclosure. | Qualified safety review, launch-market approval, browser proof that crisis never invokes anonymous sign-in, and a deliberate policy for context/negation over-triggers remain required before `Complete`. |
| P0-13 | In progress | Approved recipe ID, keyword default, and fail-closed recipe identity are implemented. Production rejects every non-keyword/unknown retrieval value; story creation carries the matcher's actual path and rejects challengers before persistence; match/artifact telemetry and the v4 SQL boundary require the approved recipe ID, retrieval mode, and match-config version. Eval-only `matchWithDebug` still exercises FacetsRAG. Each immutable artifact pins the complete match recipe plus analyzer, match-recovery, composer, validator, boundary, hybrid-plan, and template-policy versions. | Immutable multi-run eval history, deployment startup check, shadow promotion record, and rollback exercise. |
| P0-14 | Partial | Guest cleanup and root-only disclosure/context expiry exist. Artifacts, feedback, concerns, recovery, and alternate state are owner-scoped/bounded. Migration `0011` adds a default-deny new-session owner/root flow mapping, exact root/flow lookups, account/root cascades, owner-scoped explicit retirement, and opaque revocation tombstones so linked events/outbox work cannot be recreated after deletion. Alternates resolve through the original root; legacy sessions are deliberately not backfilled. | User-facing story/account deletion and consent controls, durable save semantics, full derived-rationale/artifact retention classes, optional-note consent/encryption decision, privacy page, real cascade/cron tests, and market/youth review. |
| P0-15 | In progress | Strict non-interactive ESLint, isolated production build, deterministic fonts, CI, approved-recipe fail-closed behavior, story kill switch, independent hybrid-composer flag, four-path provider health check, and migrations for immutable StorySpecs/StoryArtifacts, atomic pre-story recovery, current provenance, bounded editorial concerns, immutable completed-story feedback, root-only request context, and leased/atomic alternate finalization exist. All persistence/auth boundaries use one parser that rejects memory in served production even when the build-only override is copied. IP-hash/recovery/alternate secrets share a minimum 32-byte fail-closed parser. The story kill switch blocks new capability issuance/claims without hiding terminal ready results. Migration `0009` is deploy-before-app compatible; destructive removal of the legacy RPC is outside the automatic migration stream until the rollback window closes. | Complete route/integration matrix, real migration preflight/rollback and atomic-RPC tests, broader health/readiness checks, remaining kill switches, and green remote CI evidence. |
| P0-16 | Partial | Landing/auth typography, reduced motion, several keyboard affordances, native boundary/clarification/source/report/feedback controls, focused no-eligible/no-close and feedback-reason states, visible partial framing, labeled content notes, safe external-link treatment, and announced report/feedback outcomes exist. | Shared primitives, all-flow copy system, and complete keyboard/screen-reader/zoom/manual usability audit. |
| P0-17 | In progress | Strict optional boundary input, reviewed StorySpec catalog, hard pre-retrieval intensity/topic filtering, age-fallback protection, artifact-level `boundary_violation`, identical canonical-fallback enforcement, honest no-eligible recovery, native accessible controls, and reviewed-only content-note projection are implemented. A rejected completed story can now request one alternate without re-entering disclosure; the exact stored boundaries are applied before every retrieval/fallback path and rechecked by composition, memory persistence, and SQL finalization. | Replace inferred draft profiles with human-reviewed launch profiles; add an active-reader control to change boundaries before requesting recovery; complete keyboard, screen-reader, reflow, and safety/editorial review before `Complete`. |

## P1 ledger

| ID | Status | Current evidence | Missing proof / next dependency |
|---|---|---|---|
| P1-01 | Partial | Six-lane FacetsRAG skeleton and retrieval eval exist. | Validated per-facet projections, dynamic weights, shadow execution, holdout superiority, promotion. |
| P1-02 | Not started | None. | Optional non-branching emphasis choice and experiment evidence. |
| P1-03 | Partial | P0 hybrid composition now personalizes only approved transition/bridge templates while preserving canonical beats and evidence. | Full-beat free-prose challenger behind the same StorySpec/validation contract and a blind comparison. |
| P1-04 | Partial | Seed/check scripts, database draft/published status, a privacy-safe historical-concern queue, service-only triage, and rapid StorySpec retirement exist. | Internal research/review/preview/publish/report/rollback workbench and audited editor identity/action history. |
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

## Verification history

Baseline branch: `roadmap-implementation`

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

### Stacked branch: `roadmap-source-transparency`

| Command | Result |
|---|---|
| `npm run lint` | Pass, zero warnings |
| `npx tsc --noEmit --incremental false` | Pass |
| `npm run check-figure` | Pass, 50/50 stages |
| `npm run check-story-spec` | Pass; 50/50 safe drafts, 50/50 unsafe publish attempts rejected, plus bounded HTTPS source/locator validation |
| `npm run check-story-artifact` | Pass; 50/50 immutable v5 artifacts, honest draft provenance, v1-v4 replay, privacy, and tamper rejection |
| `npm run check-source-transparency` | Pass; synthetic published evidence and verbatim/paraphrase/disputed quote traceability, 9/9 controlled rationale classes, v5/legacy tamper boundaries, owner/foreign/idempotent report attacks, safe queue shape, and accessible static reader contracts |
| `npm run check-story-boundaries` | Pass; hard exclusions remain enforced |
| `npm run check-resonance-brief` | Pass; 9/9 governed projections and privacy fingerprints |
| `npm run check-story-composer` | Pass; hybrid/canonical contracts and exact evidence spine remain enforced |
| `npm run check-match-recovery` | Pass; clarification/no-close/adjacent recovery remains enforced |
| `npm run eval-crisis` | Pass, 26/26 critical positives |
| `npm run smoke` | Pass, 19/19 regressions |
| `NEXT_DIST_DIR=.next-ci npm run build` | Pass; 12 routes compiled/generated, including `/api/historical-concern`; `/story/[sessionId]` 7.81 kB route payload |

Real Postgres RLS/RPC/concurrency/retirement evidence and browser accessibility/usability evidence are intentionally not claimed by the hermetic checks above; both remain explicit P0-08 release gates.

### Stacked branch: `roadmap-resonance-feedback`

| Command | Result |
|---|---|
| `npm run lint` | Pass, zero warnings |
| `npx tsc --noEmit --incremental false` | Pass |
| `npm run check-figure` | Pass, 50/50 stages |
| `npm run check-story-spec` | Pass, 50/50 safe drafts and 50/50 unsafe publish attempts rejected |
| `npm run check-story-artifact` | Pass, 50/50 v5 artifacts plus v1-v4 replay/privacy/tamper gates |
| `npm run check-source-transparency` | Pass; provenance/reporting contract unchanged |
| `npm run check-resonance-feedback` | Pass; exact seven-reason parser, account-free memory owner/completion gates, 12-way concurrent idempotency, conflicting-answer rejection, foreign/missing parity, 90-day/cascade privacy, fact-report separation, migration shape, and accessible static UI sequence |
| `npm run check-story-boundaries` | Pass; hard exclusions unchanged |
| `npm run check-resonance-brief` | Pass; governed privacy boundary unchanged |
| `npm run check-story-composer` | Pass; hybrid/canonical contracts unchanged |
| `npm run check-match-recovery` | Pass; pre-story recovery contract unchanged |
| `npm run eval-crisis` | Pass, 26/26 critical positives |
| `npm run smoke` | Pass, 19/19 regressions |
| `NEXT_DIST_DIR=.next-ci npm run build` | Pass; 13 routes compiled/generated, including `/api/story-feedback`; `/story/[sessionId]` 8.8 kB route payload |

Real anonymous Supabase/RLS/concurrency/cron/deletion and browser accessibility evidence remain release gates. The free alternate and optional-note decisions remain explicitly open in P0-10; this sub-branch proves only the bounded feedback foundation.

### Stacked branch: `roadmap-try-another`

| Command | Result |
|---|---|
| `npx tsc --noEmit --incremental false` | Pass |
| `npm run check-resonance-feedback` | Pass; existing bounded feedback and accessible sequence remain intact |
| `npm run check-try-another` | Pass; exact request/parser and shared intake contracts, root-only context, immutable/start-by deadlines, hard prior-stage/boundary exclusion, 12-way concurrency, live second-lease hydration, stable retry, partial artifact, empty/low honest stop, two-attempt operational recovery, kill-switch terminal replay, weak-secret rejection, no public rate unit, no alternate chain, ownership/origin gates, and memory cascade |
| `npm run lint` | Pass with zero warnings |
| `npm run check-figure` | Pass, 50/50 stages |
| `npm run check-story-spec` | Pass, 50/50 draft contracts and 50/50 unsafe publication attempts rejected |
| `npm run check-story-artifact` | Pass, 50/50 complete artifacts plus privacy/tamper gates |
| `npm run check-source-transparency` | Pass; provenance, bounded reporting, and accessible surface contracts |
| `npm run check-story-boundaries` | Pass; hard exclusion and no-eligible contracts |
| `npm run check-resonance-brief` | Pass; closed derived-input/provider privacy boundary |
| `npm run check-story-composer` | Pass; hybrid retry/fallback/privacy contracts |
| `npm run check-match-recovery` | Pass; bounded pre-story recovery remains intact |
| `npm run eval-crisis` | Pass, 26/26 critical positives |
| `npm run smoke` | Pass, 19/19 regressions |
| `NEXT_DIST_DIR=.next-ci ONWARD_ALLOW_MEMORY_IN_PRODUCTION=true npm run build` | Pass; 15 routes compiled/generated, including both alternate-story endpoints; `/story/[sessionId]` 11.4 kB route payload |

The local suite does not prove migration `0009` against real Postgres, anonymous-auth RLS/service boundaries, cross-instance leases, cron execution, browser focus/navigation, or target-user comprehension. Optional feedback notes also remain deliberately absent pending the consent/encryption/retention decision. P0-10 therefore remains `In progress`.

### Stacked branch: `roadmap-safe-telemetry-contract`

| Command | Result |
|---|---|
| `npm run lint` | Pass, zero warnings |
| `npm run typecheck` | Pass |
| `npm run check-telemetry` | Pass; exact 22-event registry, forbidden-field rejection, HMAC identifier laundering/rotation, deterministic and outbox-owned retry idempotency, actual composer fallback families, exact 500 ms/8 s boundaries, 30/14-day retention, flow/role metric-unit deduplication, and exact SQL event/recipe registry checks |
| `npm run check-figure` | Pass, 50/50 stages |
| `npm run check-story-spec` | Pass, 50/50 safe drafts and 50/50 unsafe publication attempts rejected |
| `npm run check-story-artifact` | Pass, 50/50 complete artifacts plus privacy/tamper gates |
| `npm run check-source-transparency` | Pass; provenance and bounded-report contracts unchanged |
| `npm run check-resonance-feedback` | Pass; bounded feedback contracts unchanged |
| `npm run check-try-another` | Pass; one-use alternate and retention contracts unchanged |
| `npm run check-story-boundaries` | Pass; hard exclusions unchanged |
| `npm run check-resonance-brief` | Pass; governed provider projection unchanged |
| `npm run check-story-composer` | Pass; hybrid retry and canonical fallback families align with telemetry |
| `npm run check-match-recovery` | Pass; clarification and eligible match dispositions unchanged |
| `npm run eval-crisis` | Pass, 26/26 critical positives |
| `npm run smoke` | Pass, 19/19 regressions |
| `NEXT_DIST_DIR=.next-ci ONWARD_ALLOW_MEMORY_IN_PRODUCTION=true npm run build` | Pass; 15 routes compiled/generated; `/story/[sessionId]` 11.4 kB route payload |

This branch proves a privacy-safe contract and storage foundation, not production observability. A transactional outbox, authoritative flow lifecycle/deletion mapping, route/component instrumentation, temporal aggregate queries, dashboards/alerts/on-call, minimum-cell rollups, and real Postgres RLS/cron/deletion/idempotency evidence remain explicit P0-11/P0-14 release work.

### Stacked branch: `roadmap-observability-instrumentation`

| Command | Result |
|---|---|
| `npm run lint` | Pass, zero warnings |
| `npm run typecheck` | Pass |
| `npm run check-telemetry` | Pass; the exact 22-event privacy contract and closed reducers remain intact |
| `npm run check-telemetry-lifecycle` | Pass; semantic first-write-wins IDs, occurrence isolation, original timestamp delivery, lease exclusion/recovery/backoff, delivered tombstones, owner/root conflicts, flow deletion cascades, recovery-flow binding, same-flow session idempotency, and crisis-before-flow routing |
| `npm run check-match-recovery` | Pass; recovery capabilities remain single-use and are now root-flow-bound |
| `npm run check-story-boundaries` | Pass; no-eligible and crisis-first behavior unchanged |
| `npm run smoke` | Pass, 19/19 regressions with a fresh signed root per independent story |
| `NEXT_DIST_DIR=.next-ci ONWARD_ALLOW_MEMORY_IN_PRODUCTION=true npm run build` | Pass; 15 routes compiled/generated; `/story/[sessionId]` 11.4 kB route payload |
| `npm run check-db` | External gate fails, 2/11: configured Supabase has stale authored stage data and lacks migrations `0004` through `0011`; `.env.local` also needs a real dedicated telemetry secret |

This slice adds the new-session owner/root lifecycle and a flat pointer-only transactional outbox without instrumenting broad route-level analytics. Migration `0011` registers or claims a signed flow, binds it atomically with the initial session/artifact commit, lets alternates resolve through the initial root, cascades root/account deletion into linked events and delivery state, and keeps pre-session registrations anonymous and time-bounded. Event delivery is leased, retry-capped, idempotent by `event_id`, and unable to store a generic payload.

P0-11 remains `In progress`: authoritative match/progress/feedback/alternate/rate-limit RPC integration, crisis-safe occurrence enqueueing, narrow client visibility endpoints with monotonic clocks, a production dispatcher/reconciler, aggregate metrics/dashboards/alerts/on-call, and real-Postgres concurrency/RLS/cron/cascade evidence are still required. The configured Supabase project is not deployable with this branch until its authored data is reconciled and migrations `0004` through `0011` are applied schema-first. P0-14 still lacks user-facing save/delete actions and intentionally has no legacy-session telemetry backfill.

### Stacked branch: `roadmap-observability-match-producers`

| Command | Result |
|---|---|
| `npm run lint` | Pass, zero warnings |
| `npm run typecheck` | Pass |
| `npm run check-telemetry` | Pass; the exact 22-event schema and forbidden-field gates remain intact |
| `npm run check-telemetry-lifecycle` | Pass; v4 is the flow-bearing initial session boundary and v2 remains the null-flow fallback |
| `npm run check-telemetry-producers` | Pass; four match dispositions, approved-recipe enforcement, no-eligible, artifact fallback families, drifted recovery reconciliation, clarification/story replay singletons, dual-limit user precedence, unlinkability, and forbidden-value absence |
| `npm run smoke` | Pass, 19/19 regressions |
| `NEXT_DIST_DIR=.next-ci ONWARD_ALLOW_MEMORY_IN_PRODUCTION=true npm run build` | Pass; 15 routes compiled/generated; `/begin` 5.16 kB and `/story/[sessionId]` 11.4 kB route payloads |
| `npm run check-db` | External gate fails, 2/12: configured Supabase has stale authored stage data and lacks migrations `0004` through `0012`; `.env.local` also needs a real dedicated telemetry secret |

This slice instruments only the initial match journey. Valid flow-bearing intake submissions and completed match dispositions are server-derived; clarification/no-close recovery tokens commit with their match telemetry and retain the first measured dimensions across a drifted response-loss retry; rate denials commit one unlinkable, closed scope with the counter transaction, while a two-day identity-free decision row prevents ambiguous RPC replay from consuming twice or contradicting the protection boundary; and the initial artifact event is derived from the persisted artifact inside `create_story_session_v4`. The matcher, TypeScript producers, and SQL artifact boundary all reject a challenger path masquerading as the approved keyword recipe. HMAC authenticity remains application-owned, while SQL validates bounded identifier shape, active owner/flow state, event combinations, and capture conflicts. The crisis path intentionally emits no durable row under the current no-write policy.

P0-11 remains `In progress`: progress/completion, feedback, alternate, landing/intake/auth/visibility, and sanitized failure producers are still uninstrumented; outbox dispatch/reconciliation, aggregates/dashboards/alerts/on-call, and real-Postgres concurrency/RLS/cron/cascade proof remain release gates. Migration `0012` was not applied by this branch; production must use the documented schema-first rollout before deploying v4 callers.

### Stacked branch: `roadmap-observability-engagement-producers`

Migration `0013` and the reader acknowledgement boundary now instrument every artifact-backed Continue/Finish with a server-derived flattened passage ordinal and a final-only completion event. The route reuses its already-owned session and playback, resolves the immutable root flow once, and passes only HMAC-authenticated closed captures; SQL independently re-derives role, ordinal, completion, and next position before the CAS. An `already_advanced` retry reconciles both event rows and pointer-only outbox entries. Initial and alternate stories share the root flow but retain separate roles. Missing/expired flows keep reading available without inventing rows; an active flow with a missing or divergent capture rolls the transition back. The explicit flow-binding kill switch restores the prior owner-scoped CAS only as an incident posture with a documented telemetry gap.

Local gates include `npm run check-story-progress-telemetry`, which walks every persisted passage in both roles, verifies singleton replay/outbox restoration, forces capture and semantic conflicts to prove rollback, and covers null-flow artifact/legacy compatibility. Production still requires migration `0013` before this application slice plus real-Postgres concurrency/RLS/rollback evidence; it has not been applied by this branch.

### Stacked branch: `roadmap-observability-feedback-producer`

Migration `0014` makes one completed-story feedback answer and its `feedback_submitted` event a single owner-scoped transaction. SQL locks the owned session first, derives root role and the accepted verdict from persisted rows, treats caller role/verdict only as signed-capture assertions, and never sends the closed miss reason into telemetry. Initial and alternate answers remain separate semantic units on one root flow. Exact response-loss retries reconcile a missing outbox pointer; changed verdicts or miss reasons return the existing domain conflict before capture; an active-flow event conflict rolls back a new feedback insert. Null, expired, revoked, and explicitly incident-disabled flows retain feedback without inventing an event. The legacy feedback RPC remains available only for the documented schema/config rollback posture.

`npm run check-feedback-telemetry` covers all-or-nothing capture failures, semantic collisions, exact and delivered-pointer replay, divergent and concurrent answers, kill-switch recovery, root/alternate roles, and forbidden-field absence. Production still requires migration `0014` before the v2 caller plus real-Postgres concurrency/RLS/rollback evidence; it has not been applied by this branch.

### Stacked branch: `roadmap-observability-alternate-producer`

Migration `0015` wraps the authoritative alternate claim RPC in the same transaction as `alternate_requested`. Capability issuance and refresh remain silent; an expired capability with zero attempts is not counted as demand. A created claim, active-lease replay, cooldown, terminal replay, or exhausted state with a prior attempt reconciles the same deterministic event and pointer. SQL independently resolves the active owner/root flow after the legacy claim boundary has locked and validated the source. Active-flow capture failure rolls back a newly acquired lease; null, revoked, expired, and explicitly incident-disabled telemetry flows keep alternate recovery available without inventing an event. The unsuffixed claim RPC remains only for documented rollback.

`npm run check-alternate-request-telemetry` covers silent issue/hydration, claim atomicity, semantic collision rollback, exact and delivered-pointer replay, 12-way convergence, kill-switch recovery, never-claimed expiry, and forbidden-field absence. Production still requires migration `0015` before the v2 caller plus real-Postgres concurrency/RLS/rollback evidence; it has not been applied by this branch. Terminal `alternate_resolved`, alternate match calibration, and alternate artifact creation remain the next stacked slice.

### Stacked branch: `roadmap-observability-alternate-resolution`

Migration `0016` completes the server-owned alternate measurement loop. Eligible
and no-eligible alternate matching now emit the same approved-recipe calibration
shape as the initial journey with `storyRole=alternate`. Ready completion derives
the persisted artifact's approved recipe, composition mode, fallback family, and
attempt bucket inside the authoritative session transaction, then commits the
alternate artifact denominator and `alternate_resolved:ready` together. The
unavailable and explicit post-claim expiry transitions capture their terminal
outcomes with the domain mutation; a released second operational attempt becomes
`failed`; and a later abandoned final lease becomes `exhausted`. One deterministic
resolution ID is first-write-wins, so a later retry can restore a missing outbox
pointer but cannot rewrite an earlier terminal outcome. Concurrent terminal
reconciliation serializes on that event ID before reading the accepted outcome.

Capability issuance and hydration remain silent, and a capability that expires
without any claim still creates no demand or terminal row. SQL independently
resolves the active owner/root flow and derives every terminal/artifact dimension
from locked state. Null, expired, revoked, and incident-disabled flows preserve
alternate recovery without fabricating telemetry. Memory mode mirrors the same
all-or-nothing behavior, including rolling back a newly created alternate session
and artifact if its paired telemetry conflicts. Migration `0016` intentionally
does not backfill an alternate artifact event for a result completed before the
migration; manufacturing a historical denominator would be less trustworthy than
the documented rollout gap.

`npm run check-alternate-resolution-telemetry` covers ready atomicity, artifact
conflict rollback, terminal replay/outbox restoration, failed-vs-exhausted
first-write-wins behavior, abandoned-lease exhaustion, post-claim expiry,
null/revoked/incident-disabled flows, eligible/no-eligible match calibration, and
forbidden-field absence. `npm run check-db` now resolves all five public `0016`
RPC signatures with nonexistent owner-scoped identifiers and requires safe,
non-mutating dispositions. The full local CI command matrix and isolated
production build pass, and CI now invokes every transactional telemetry
validator. Production still requires schema-first application of
`0016`, real-Postgres concurrency/RLS/rollback evidence, and an end-to-end live
alternate canary before this producer slice can be treated as operational proof.

### Stacked branch: `roadmap-observability-entry-producers`

The landing-to-intake funnel now preserves one opaque flow without a tracking
SDK, generic analytics endpoint, URL parameter, or script-readable identifier.
Both home CTAs submit the same native fixed-action form. Its same-origin server
boundary chooses the only allowed surface, registers the flow, captures
`landing_cta_clicked`, and redirects even when measurement fails. A successful
capture sets a 30-second HttpOnly `SameSite=Lax` cookie scoped only to `/begin`;
the dynamic intake page validates that signed handoff and otherwise creates a
fresh unregistered capability for direct visits.

The first trusted form change captures `intake_started` through a second narrow
endpoint whose JSON parser accepts exactly one `small`/`large` viewport field.
The client snapshots that bucket once and reuses it for one ambiguous-network
retry, so resizing cannot create a second measurement. The endpoint receives no
age, disclosure, boundary choice, form-element identity, auth state, URL, or
session identifier. Cross-origin, malformed, forged, and incident-disabled
requests create no event; telemetry failures never alter navigation or intake.
Pre-classification entry rows cannot identify a crisis disclosure, and the match
route's stricter no-crisis-event/no-write boundary remains unchanged.

`npm run check-entry-telemetry` executes both route handlers, verifies the
redirect/cookie contract, flow continuity, first-write-wins viewport behavior,
outbox pointers, invalid/cross-origin/kill-switch silence, UI wiring, and
forbidden-field absence. A local in-app browser pass verified the native CTA
click redirects to the rendered intake and that the form remains interactive
without console errors. Full keyboard/screen-reader proof remains correctly open
under P0-16 rather than being inferred from native markup.

### Stacked branch: `roadmap-observability-reader-visibility`

Three exact same-origin routes now own the client-visible reader milestones;
there is still no generic analytics receiver. The match client records only one
ephemeral monotonic timestamp immediately before each dispatch and overwrites it
before an auth retry. Only the accepted response binds it in memory to the returned
session; it never enters session/local storage and cannot cross a reload, new tab,
or different-story navigation. Every crisis, clarification, no-close, rate-limit,
conflict, or failure response clears it. After the preface fade completes (or a fast
reader activates Begin), the component waits one layout frame, consumes the value
once, and sends only a closed latency bucket plus the session lookup. Missing,
mismatched, reversed, over-one-hour total timing, or a preface arriving more than
30 seconds after response binding emits nothing.

The same one-shot bridge wraps an actual alternate-creation dispatch. A ready
response binds the returned alternate session before navigation; preparing,
unavailable, expired, exhausted, failed, and ambiguous responses clear it. Merely
hydrating an already-ready alternate creates no fabricated generation latency.

Continue captures its monotonic start before the acknowledgement CAS. The next
`StoryBeat` stops the clock after the complete stored chunk has streamed and the
outer passage fade has completed, then waits for layout; the optional word reveal
remains outside the SLO. The server verifies ownership before position, loads the
immutable playback, accepts only coordinates proven reached by forward-only durable
progress, and derives the bounded flattened ordinal and initial/alternate role.
Delayed delivery after another acknowledgement is accepted rather than biasing the
latency cohort toward slow readers. Source opening is
captured only on the first local closed-to-open transition, after the server proves
that the owned story is complete and has a persisted transparency record. Semantic
event IDs make reloads, ambiguous retries, and changed buckets first-write-wins.

`npm run check-reader-visibility-telemetry` exercises all three route handlers and
the pure client latency reduction. It proves exact request rejection, first-write
idempotency, server-derived ordinals/roles, initial/alternate root-flow continuity,
ownership-before-position 404 behavior, incomplete/future rejection, delayed-report
acceptance, null/revoked/kill-switch availability, source singleton behavior,
UI/static wiring, and absence
of disclosure, figure, artifact, source, account, or session identifiers from stored
event rows. The full local domain/telemetry matrix, 19-case smoke suite, and a
production build with all three routes pass. Browser evidence for animation timing,
App Router handoff, direct/reload silence, and rapid multi-Continue behavior remains
open under P0-16; static/unit evidence is not presented as that proof. Production
also depends on the existing `0011` capture RPC and the open real-Postgres,
outbox, and aggregate gates; this slice requires no new migration.

## Completion audit rule

The goal remains active until every row above is `Complete` and every external gate has authoritative evidence. A PR merge, green CI check, model output, or local smoke result completes only the acceptance criteria it directly covers.
