# Roadmap Implementation Status

**Authoritative objective:** finish every item in `feature_roadmap.md`.  
**Status date:** July 26, 2026
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
| P0-01 | External gate | A versioned end-to-end benchmark protocol and code-owned policy now define paired baseline/candidate evaluation over exact v5 artifacts and published StorySpecs. The evaluator verifies HMAC-bound protected inputs, immutable split/cohort manifests, full artifact/spec hashes and validators, exact production recipe/runtime identity, candidate/holdout/content chronology, frozen reviewer assignments, independent closed-rubric reviews, consent/representation/coverage, factual/tone/privacy failures, outcome floors, and candidate non-inferiority. Every artifact/spec and the final public evidence are scanned against every protected disclosure, including meaningful short and Unicode-confusable echoes. Aggregate evidence is content-addressed, recomputed on parse, append-only in CI, and can pass only when an externally supplied Ed25519 custodian key verifies a signature over both the complete private packet and deterministic safe result; unverified proofs are omitted. Synthetic fixtures remain non-passing, promotion authority is always false, and a 74-assertion adversarial suite exercises tampering and fail-closed behavior. | Approve and operate the real consent protocol; recruit at least 150 target-audience sessions and 75 feedback responses per required arm; freeze and seal a genuine protected holdout; publish the launch StorySpecs; run independent expert/target-reader review; provision a protected custodian key, access-log procedure, and base-owned signing/verification workflow outside the repository; then commit the resulting metrics-only launch-candidate evidence. No real study, holdout, review packet, trusted custodian, or protected evidence-authority workflow currently exists. |
| P0-02 | In progress | Versioned StorySpec contract, atomic facts, sentence-level evidence maps, source-scope gates, entity/quote links, chronology checks, dramatization limits, reviewer metadata, immutable database versions, fail-closed runtime loading, protected draft seeding, and independent per-stage publish/retire operations are implemented. All 50 legacy stages convert to valid review drafts, and all 50 are rejected when publication is attempted. | The generated drafts intentionally retain broad evidence references and empty beat-to-fact links. Editorial researchers must create exact/bounded locators, resolve quotes/entities/causal claims, and record real reviews for the launch subset before any stage is publicly eligible. |
| P0-03 | In progress | New sessions create a strict short-lived ResonanceBrief and pass only its governed projection into a separate Story Composer/provider boundary. The model can select one allowed transition role and approved transition/bridge template IDs, but cannot author prose or claims. The composer deterministically renders those choices onto the canonical seven-beat StorySpec, preserves exact fact/entity/quote IDs and chronology, validates privacy/tone/zones/recipe/hash, retries once with closed failure codes, then returns a complete canonical artifact on provider, output, privacy, or validator failure. Immutable v5 artifacts pin analyzer/match/model/composer/validator/boundary/template/plan versions plus public provenance; v1-v4 replay remains supported without reconstructing old provenance. | Obtain blind human resonance/editorial/safety evidence for the hybrid recipe, add real Postgres transaction/JSONB round-trip evidence, production latency/fallback gates and dashboards, and an editorially safe migration plan for permanent pre-0005 sessions before `Complete`. |
| P0-04 | Complete | All 50 canonical bridges and the demo no longer repeat intake; legacy placeholders are sanitized before chunking. Generated opening and hybrid bridge/transition paths receive only the governed ResonanceBrief projection and are rejected through HMAC exact/eight-word/named-detail/Unicode fingerprints plus placeholder, promise, diagnosis, prescription, equivalence, and closed-template gates. Mock provider capture proves raw text, names, dates, anchors, and hashes do not enter either prose request; artifacts store none of the brief or fingerprints. The approved initial-composition failure owner passes thrown values through a string-hostile reducer that retains only closed error/status/latency buckets; canary tests prove exception messages, stacks, causes, and bodies are discarded. The versioned derived-output contract now defines seven closed lifecycle classes, 20 surfaces (including age, closed hybrid-retry feedback, and owner Save State), five current provider exchanges, opaque consumer-allowlisted outputs, request-only opening candidates, exchange-branded request bodies, reduced errors, and an exact inventory of all current direct TypeScript network paths and provider-boundary imports. Every current application table has a named class, and CI rejects unregistered sinks, consumers, provider calls, storage tables, or direct network paths. | None for this code-scoped bug fix. Provider account settings, infrastructure logs, and backup/PITR behavior remain explicit P0-14 external gates rather than hidden P0-04 claims. |
| P0-05 | In progress | A versioned deterministic disposition policy converts server-only confidence and age fallback into close, adjacent, one-question, or no-close states. Medium/low first passes ask one six-option question; an answered low match stops honestly without persistence; explicit closest-story acceptance forces partial framing. The preface visibly states that the lives are not the same. Owner/input-bound opaque recovery credits are single-use, purpose-limited, rate-limit safe, and expire in ten minutes. | Calibrate thresholds and prove the question's expected value on the consented holdout; add measured try-another/none-of-these recovery with P0-10; complete browser usability/accessibility evidence and include miss/clarification performance in the release benchmark. |
| P0-06 | Partial | Functional age/free-text intake, honest expectation copy, just-in-time privacy, optional non-clinical story limits, one bounded clarification, retained in-memory draft across no-eligible/no-close recovery, and gentle focused states are implemented. Client and server now share the same whole-number age plus NFC code-point disclosure limits, including emoji-safe counting. | Stronger initial guided prompt/context, retry across full navigation/reload without unsafe persistence, and browser usability/accessibility evidence. |
| P0-07 | In progress | Reader is book-like with visible reveal and explicit Continue/Finish controls; quiet role-based chapter labels and count-agnostic cues orient without a progress bar. Delayed loading, bounded delivery/ACK timeouts, in-place retry, focused failures, deliberate transition focus, and minimum 44px actions are implemented. The final bridge stays mounted, a focused coda separates the emotional landing from afterword/feedback/save, and completed refresh restores the bridge and figure. Desktop browser evidence covers refresh, outage recovery, Back/Forward, same/stale multi-tab, and Finish; see [reader release evidence](reader_release_evidence.md). | Complete representative-phone, zoom/reflow, keyboard-only, named screen-reader, Supabase-auth conversion, and target-reader comprehension/pacing evidence. The in-app viewport override did not produce a phone viewport, so responsive acceptance remains open. |
| P0-08 | In progress | Immutable v5 artifacts now carry a closed disclosure-safe rationale and explicit gap, pinned StorySpec identity/version, reviewed-vs-draft provenance, safe source projection, only referenced fact/quote evidence, qualified/interpretive/reader-bridge labels, and hybrid-connective disclosure. The end-state reader exposes the rationale plus native source/evidence drawers. An exact three-field owner-scoped API validates fact membership; migration `0007` atomically writes only safe content identifiers and closed reasons into a default-deny, idempotent editorial queue with service-only triage and existing rapid retirement. Synthetic public evidence covers verbatim/paraphrase/disputed quotes; all 50 current drafts are honestly labeled as drafts; v1-v4 replay exposes no fabricated provenance. | Publish a real launch StorySpec with researcher-authored exact/bounded evidence and exercise its quote/source projection; run the migration, RLS/concurrency, triage, and retirement drill against real Postgres; complete keyboard/screen-reader/mobile/zoom testing and target-user trust comprehension before `Complete`. |
| P0-09 | In progress | Progress moves only on explicit Continue/Finish. Migration `0013` locks the owned session, independently validates the immutable artifact's complete passage layout, derives the only legal next position, and atomically captures the bounded flattened passage ordinal plus final completion. Response-loss replay restores deterministic events/outbox pointers without advancing twice; memory mode mirrors the transaction. The client now retries the exact ACK tuple after connection/timeout/invalid-response failures, fails closed on malformed next contracts, rejects unsafe coordinates, and reloads only on true divergence. Browser evidence proves refresh-mid-reveal, double-click, Back/Forward, outage/reconnect, same-position convergence, stale-tab conflict, and one-shot Finish in memory mode; see [reader release evidence](reader_release_evidence.md). | Real-Postgres concurrency/RLS/rollback and cross-instance evidence remains mandatory. Convert the manual browser matrix into durable route/component E2E coverage, including partial delivery and committed-ACK response loss, before `Complete`. |
| P0-10 | In progress | Completed-story readers—including anonymous owners—can answer one close/not-close question with exactly one of seven closed miss reasons. After a durable rejection, a root story can issue one owner/session/artifact-bound capability and generate one different, always-partial story without browser replay of age, disclosure, limits, clarification, reason, candidates, or prose and without a public rate unit. The exact previous stage is removed before age fallback, keyword/Facets retrieval, reranking, fallback, and composition. The original closed context exists only on the root, has an immutable expiry, and is reused under the same hard boundaries; the alternate stores only lineage/deadline and no age, disclosure, limits, or clarification. Empty/low coverage stops honestly; operational failures get two leased attempts with a server-enforced cooldown; concurrent clicks converge; a live second lease hydrates as preparing rather than exhausted; the one-hour capability TTL is consistently start-by while the two-minute lease and original disclosure deadline remain finish-by. SQL finalization rechecks feedback/completion/publication/authoritative content profile/boundaries atomically. Owner-scoped SSR and a separate exact capability-refresh endpoint restore available, preparing, ready, unavailable, expired, exhausted, and timed transient states after reload/back without resending the miss reason. Terminal outcomes and local Back/Stay transitions restore focus, and cross-tab feedback refresh remounts from the durable projection. | Add separate consented/encrypted short-retention optional notes or record an explicit product/privacy decision not to collect them; prove anonymous Supabase migration/RPC/RLS/cross-instance lease/cron/deletion behavior, browser accessibility/navigation, and aggregate learning with P0-11. |
| P0-11 | In progress | The exact 22-event product union and unlinkable attempt stream reject sensitive/unbounded shapes and reduce failures to closed buckets. Purpose-separated HMAC IDs are retry-stable; signed flows have an immutable 30-day lifetime. Migrations `0011`-`0013` implement the owner/root lifecycle, leased outbox, initial intake/match/recovery/artifact producers, and transactional passage/completion capture. Migration `0014` commits bounded feedback with a persisted-verdict event and no miss reason. Migration `0015` captures `alternate_requested` only after a durable claim. Migration `0016` adds alternate match calibration and atomically derives the alternate artifact denominator plus first-write-wins terminal outcomes from authoritative state. Fixed entry endpoints capture CTA and first interaction without a tracking SDK. Three exact reader-visibility endpoints capture match-to-preface and Continue-to-passage latency plus first source opening. The match boundary proves story-flow anonymous authentication with a short-lived HttpOnly flow challenge plus verified fresh AMR before owner-scoped singleton capture. Eligible initial-story preparation owns one bounded `flow_failed:composition` occurrence, while raw errors and expected recovery states remain silent. Migration `0017` adds a pure-Postgres, ID-only dispatcher that locks the source before its pointer, atomically folds it into identifier-free UTC-day marginal counts, and then marks delivery. Dispatch defaults off behind a dedicated database control. A hardened 28-day/`k>=10` daily-read candidate withholds immature, missing-pointer, unsettled, and complementary-count-unsafe cells but has no caller grant; rollups expire within 30 days. Queue health exposes the control state, counts, and a closed oldest-actionable age bucket, while schema health verifies effective grants, private helpers, forced RLS, and exact cron definitions with booleans only. Raw external delivery remains prohibited. Exact retries reconcile or deduplicate by semantic unit; transaction-coupled capture conflicts roll back their domain transitions, while auth and failure observation are documented availability-first exceptions; and null/revoked flows preserve the product without fabricated telemetry. Memory mode mirrors producer transaction and privacy semantics. Crisis resources still return before the match route parses the flow, reads an auth challenge, or writes a crisis event. | Apply, check, explicitly enable, and exercise `0017` on real Postgres, including cron, RLS/grants, concurrent dispatch, lease recovery, deletion races, retention, and exhaustion. Complete dashboard privacy review before granting any read; add flow-linked 24-hour cohort and generation-attempt aggregates, dashboards, alerts/runbooks, named on-call ownership, and live-data proof. Marginal rollups alone cannot satisfy every release metric. |
| P0-12 | External gate | Deterministic pre-provider gate; versioned 39-case corpus passes 26/26 critical positives; resource actions are region-specific, linked, and dated; crisis persistence/kill-switch behavior is smoke-tested; the route returns resources before flow/auth/age validation, the client reaches that route before anonymous sign-in, and intake exposes an always-available reviewed-resource action without requiring a valid age/disclosure. | Qualified safety review, launch-market approval, browser proof that crisis never invokes anonymous sign-in, and a deliberate policy for context/negation over-triggers remain required before `Complete`. |
| P0-13 | In progress | A canonical content-addressed registry now pins the full retrieval/model/prompt/tuning/composer/validator/spec recipe. Production requires an explicit primary-or-compatible-rollback recipe and deployment ID; that manifest is the sole non-secret behavior source, so stale `auto`, provider/model/tuning/embedder/composer environment values cannot create a mixed recipe. Unsafe persistence, missing credentials, endpoint/timeout drift, unknown selectors, and missing deployment identity fail before non-crisis auth, limits, providers, or writes. New sessions/artifacts store manifest, dataset, deployment, prompt, model, composer, validator, and schema identity; keyword correctly records no embedder. Migration `0020` adds an append-only forced-RLS promotion registry, exact immutable session trigger, migration-owner-only registration, and registry-backed initial/alternate/recovery/telemetry/rollup validation. Eval evidence, shadow comparisons, and decisions are append-only/content-addressed; the current non-promoting record retains keyword (98.0%, zero definitive-wrong) over FacetsRAG (95.0%, three definitive-wrong). Eval/shadow output is always non-authoritative. A locked dependency-free attestor loaded from protected `main` independently binds a separate promotion-only PR to exact candidate hashes, clean commit/input tree, distinct run/deployment/shadow identities, catalog/dataset, reviewers, base-primary rollback, rerank-prompt compatibility, and one migration; its secret is scoped to that single step. The attestor now resolves the promotion corpus from the protected decision rather than a recipe's release-bound default, allowing both exact manifests to be paired on one protected holdout without weakening rollback compatibility. Generated docs, deploy/startup checks, DB/static checks, CODEOWNERS, and PR append-only enforcement are wired into CI. | Apply `0020` with the documented kill-switch cutover, run live `check-db`, verify a production canary's manifest/deployment fields, and exercise a real one-selector rollback when a second compatible recipe is actually promoted. Promotion is currently externally blocked: on 2026-07-23 the private repository's branch-protection/ruleset APIs returned `403` requiring GitHub Pro or public visibility, and the `recipe-promotion` environment did not exist. Upgrade the plan or deliberately change visibility, then protect `main` with strict/up-to-date `CI / verify` and `Recipe Promotion Authority / recipe-promotion-gate`, required CODEOWNERS review, stale-review dismissal, no direct pushes, and independent protected-environment reviewers. Keep merge queue disabled unless both workflows gain and verify `merge_group` support. Current imported synthetic evidence is audit-only and cannot promote a challenger. |
| P0-14 | Partial | Guest cleanup and root-only disclosure/context expiry exist. Artifacts, feedback, recovery, and alternate state are owner-scoped and/or time-bounded. Concern submission is owner-authorized, but the resulting shared editorial record retains only curated identifiers and currently has no TTL. Migration `0018` plus the paginated `/stories` flow let an owner hard-delete any Owner Story from the active database without JavaScript or support. Migration `0019` plus dedicated `/account` and `/account/delete` surfaces let a verified guest or recently reauthenticated permanent owner hard-delete the Auth account and every FK-owned story/artifact/feedback/recovery/alternate/telemetry record. A public plain-language privacy guide distinguishes the 60-day situation/context deadline from age/story retention and discloses provider, backup, shared-editorial, security, and unlinkable residuals. The code-owned retention registry classifies all 22 current application tables, 20 derived-output surfaces, and the exact 35 fields on the two Disclosure/Owner Story content relations. Migration `0021` adds immutable current-or-honest-legacy session/artifact labels and a closed schema-health boundary. Migration `0022` adds one immutable account-level Save State: an informed anonymous-to-permanent Auth transition receives an exact first-write-wins timestamp, returning-owner sign-in cannot create an account, direct permanent creation receives no Save claim, fails the coverage gate, and cannot create an indefinitely retained story, older permanent owners receive an honest null-time legacy observation, story deletion preserves the owner decision, and account deletion cascades it. The application reads that state through a server-only boundary and the save card, story library, account page, and privacy guide distinguish temporary, confirmation-pending, saved, and unavailable states without extending the fixed 60-day Recovery Context deadline. | Ship the independent returning-owner sign-in compatibility guard, then use the documented paused-and-drained coordinated cutover to apply and exercise `0021` and `0022` against managed Supabase, including anonymous confirmation timing, rejected sign-in account creation, direct-permanent coverage and story-creation rejection, same/cross-device reads, RLS/grants, trigger rollback, account/story cascade, lock/deadlock, limiter, and cron canaries. Decide optional-note consent/encryption and the resolved shared-editorial retention period. Add a backup/PITR lifecycle plus restore-time deletion replay or a bounded non-restoration guarantee, complete provider/infrastructure retention review, convert the preview guide into a market-specific legal notice with a named controller/contact and rights process, complete supported-browser accessibility evidence, and finish market/youth review. |
| P0-15 | In progress | Strict non-interactive ESLint, isolated production build, deterministic fonts, CI, approved-recipe fail-closed behavior, story kill switch, independent hybrid-composer flag, four-path provider health check, and migrations for immutable StorySpecs/StoryArtifacts, atomic pre-story recovery, current provenance, bounded editorial concerns, immutable completed-story feedback, root-only request context, and leased/atomic alternate finalization exist. All persistence/auth boundaries use one parser that rejects memory in served production even when the build-only override is copied. IP-hash/recovery/alternate secrets share a minimum 32-byte fail-closed parser. The story kill switch blocks new capability issuance/claims without hiding terminal ready results. Migration `0009` is deploy-before-app compatible; destructive removal of the legacy RPC is outside the automatic migration stream until the rollback window closes. CI now runs the story-quality contract suite; rejects mutation/deletion/copying of published evidence, tracked private/run material, unversioned policy changes, and unsynchronized protocol changes; and parses every added history record at its exact content-addressed regular-file path. Story-quality authority surfaces have explicit CODEOWNERS, and main-push CI audits the prior diff. | Complete route/integration matrix, real migration preflight/rollback and atomic-RPC tests, broader health/readiness checks, remaining kill switches, protected base-owned story-quality authority, a real benchmark execution, and green remote CI/deployment evidence. CODEOWNERS and push audits are not preventive until the repository can require protected pull requests and base-owned checks; the current private-plan limitation remains an external blocker. |
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
| P1-06 | Partial | The paginated private saved-story list now shows reading status when available, keeps every row openable and deletable when optional details time out, and links every story to a progressive owner-scoped delete confirmation. | Richer privacy status, source access, filters, and cross-device usability. |
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

### Stacked branch: `roadmap-observability-auth-producer`

The initial non-crisis match boundary now measures only authentication that the
story flow itself caused. An exactly validated unauthenticated request with a
valid signed flow receives a purpose-separated two-minute HMAC challenge in an HttpOnly
`SameSite=Strict` cookie scoped to `/api/match`; the browser's existing anonymous
sign-in retry never reads or stores it. The authenticated retry must present the
same-flow challenge, a validated anonymous user, a fresh timestamped `anonymous`
AMR claim, and an active owner claim before `auth_established:anonymous` is
captured. Deterministic flow/event identity makes exact and concurrent retries a
single product row and outbox pointer.

Already-authenticated visits, permanent users, stale/forged/cross-flow proofs,
foreign or revoked owners, standalone sign-in, email confirmation and account
upgrade, password setting, saved-story access, and alternate creation remain
silent. Crisis and the story kill switch return before cookie inspection, auth,
flow registration, or telemetry. Invalid measurement never blocks a story, and a
transient `503` preserves the short-lived challenge for retry. This is a
pure-observability cross-system boundary: successful capture is idempotent, but a
telemetry outage after successful Supabase authentication may undercount rather
than prevent story creation. No database migration is added; the slice reuses the
existing owner lifecycle, `capture_product_event_v1`, singleton constraint, and
pointer-only outbox.

`npm run check-auth-telemetry` executes the real server-side `401` issuance and
authenticated retry in memory mode and covers signed challenge lifetime/cookie
scope, verified-method freshness, exact and concurrent
replay, outbox singleton behavior, missing/forged/stale/cross-flow proofs,
foreign/revoked owners, crisis and incident switches, static silence across every
standalone auth surface, and forbidden-field absence. Production evidence still
requires a live Supabase anonymous-auth canary plus real-Postgres dispatcher,
cohort/dashboard, alert/on-call, and migration gates. Typecheck, zero-warning lint, telemetry
lifecycle/producer checks, story-boundary checks, the 19-case smoke suite, and the
isolated production build all pass; the build still generates 19 routes and keeps
`/api/match` server-only.

### Stacked branch: `roadmap-observability-failure-producer`

One deliberately bounded owner now turns a terminal eligible initial-story
preparation failure into `flow_failed:composition`. The owner is created only
after a close/adjacent match disposition and immediately before `prepareStory`;
it mints one server-side `toc_` occurrence and starts a monotonic clock for that
attempt. A thrown value passes through the existing string-hostile reducer, while
a `null` preparation uses a fixed `conflict` sentinel for disappeared catalog or
stage identity. The resulting row contains exactly the approved domain, error,
status, and latency buckets. One ambiguous capture retry reuses the exact
occurrence-derived event ID inside a strict one-second total budget, so an
already-committed row deduplicates and repairs a missing pointer instead of
creating another occurrence. A later request that actually reruns preparation
is correctly a new attempt and occurrence.

The producer is intentionally not a generic route-level 503 hook. Crisis, the
story kill switch, malformed input, auth challenge, rate limiting, flow conflict,
clarification, no-close/no-eligible outcomes, valid canonical fallback, session
persistence, alternates, reader, and feedback paths remain silent. Telemetry
failure or an event conflict cannot change the existing gentle 503. No migration
is added: `0010` already enforces the exact four failure dimensions, and `0011`
already commits event plus outbox under an active linked flow with advisory-lock
idempotency and deletion cascade.

`npm run check-flow-failure-telemetry` executes the actual intake owner in memory
mode and covers thrown and null/content-conflict preparation, successful
canonical fallback,
raw-error canaries, exact/concurrent occurrence replay, pointer restoration,
dimension conflict, a second occurrence, capture outage, null/revoked/expired and
incident-disabled flows, crisis/malformed/kill-switch silence, latency boundaries,
exact-schema rejection, and static SQL/owner restrictions. Typecheck and
zero-warning lint pass. Production still requires a synthetic real-Postgres
concurrency/RLS/revocation canary plus the dispatcher, dashboard, alert, cohort,
on-call, and live-data gates; P0-11 therefore remains `In progress`.

### Stacked branch: `roadmap-observability-outbox-dispatcher`

Migration `0017` implements the first gated destination candidate for the product-event
outbox without adding an HTTP worker or external analytics sink. A v2 claim
returns only event ID, attempt count, and lease ID to the private
security-definer dispatcher. Settlement locks the immutable source event before
its cascade-owned pointer, rechecks source/flow lifetime, and in one transaction
folds the event then marks the pointer delivered. If deletion commits first,
there is no source to aggregate; if settlement commits first, later deletion
leaves only unlinkable counts. The atomic cutover first creates missing pointers
for every still-live pre-outbox source, performs a one-time fold of still-live
pointers previously marked delivered, then revokes service-role execution
of the v1 full-row claim and plain ACK so the atomic fold cannot be bypassed. A
default-deny singleton control starts `false`, so applying the migration and
installing its cron never begins queue consumption by itself.

`telemetry_event_daily_rollups` contains exactly UTC date, product schema
version, event name, one closed marginal dimension name/value, and count. Each
event contributes one fixed `all/all` cell plus one independent cell for every
applicable populated dimension; it never stores a dimension cross-product or
any event, flow, deletion, user, session, artifact, lease, exact timestamp, or
content identifier. The table is default-deny. Its private read candidate
accepts at most 28 retained UTC days, excludes the two newest dates and dates
with missing-pointer or unsettled sources, and withholds every child partition containing a
positive cell below `k=10` plus the corresponding parent. It has no service-role
grant in this slice; dashboard privacy review is still open. Daily pruning caps
retention at 30 calendar days. Queue health returns the dispatch-enabled flag,
pending/leased/delivered/exhausted counts, dispatcher-actionable live-source counts,
and one closed oldest-actionable age bucket. Schema health returns closed booleans
for forced RLS, effective denial of raw/direct/private paths to every browser
role and `service_role`, granted service-only operational boundaries, and exact
active cron schedules and commands.

The dispatcher cron runs inside Supabase every minute with a 25-row batch but
returns zero counts while the control is false. An operator enables it through
`set_telemetry_rollup_dispatch_enabled_v1(true)` only after staging and the
target environment's `check-db` gates, and disables it before rollback or an
incident. Dispatch holds a shared control-row lock for its transaction, so a
successful disable waits for already-running batches to drain. Each row has its
own exception subtransaction; any fold failure is
reduced to a fixed `database` NACK, preserving the existing 60-second lease,
20-attempt cap, expired-lease recovery, and bounded backoff. No raw SQL exception
is logged or returned. The daily prune job is separately scheduled. Raw external
event delivery, webhooks, third-party analytics SDKs, and public cron endpoints
remain prohibited.

`npm run check-telemetry-dispatcher` validates the exact table/allowlists,
ID-only claim, complete legacy-pointer cutover, source-first atomic settlement,
marginal-only emission, fixed
NACK, retry/exhaustion policy, default-off control, hardened private read
candidate, 30-day retention, closed queue/schema-health shapes, RLS/grants, cron
definitions, and absence of external runtime paths. `npm run check-db` probes
the public dispatcher, control-independent queue health, and schema health
without dispatching live rows; it does not receive aggregate-read permission.
These checks are hermetic/static evidence only. P0-11 remains `In progress`
until staging and production explicitly enable and prove real concurrent
`SKIP LOCKED`, lease recovery, source/pointer deletion races, RLS/grants,
exact-once folding, cron execution, pruning, and queue drain; a separate privacy
review must approve any dashboard grant. Dashboards, alerts/runbooks, named
on-call ownership, flow-linked 24-hour cohort aggregates, and
generation-attempt aggregates also remain open. The normalized marginal rollup
must not be used to infer flow-linked conversion or outcome cohorts.

### Stacked branch: `roadmap-privacy-story-deletion`

Migration `0018` adds the only service-role authority for individual story
deletion and revokes direct service-role `sessions` DELETE. Its security-definer
RPC discovers lineage without an existence oracle, takes the alternate-flow
advisory lock, locks every existing owned family session in deterministic order,
then locks and removes the shared telemetry flow before deleting the requested
session. Root deletion cascades alternate content; alternate-only deletion keeps
the root and consumed recovery tombstone. Either scope retires the shared raw
telemetry family because role-less recovery events cannot be separated safely.
Previously settled identifier-free daily counts are not decremented. Historical
concern reports remain attached to their shared editorial StorySpec/fact record,
without reporter/account/session/artifact/disclosure/prose, and currently have no
automatic expiry or user-controlled deletion; the user-facing copy says so.

The private saved-story library is now stably paginated beyond 100 rows. Every
row keeps independent Open and Delete links, a contextual accessible delete
name, 44-pixel targets, and visible keyboard focus. Optional playback enrichment
has a 500 ms deadline and can fall back to a disclosure-free label without
hiding either control. The confirmation itself depends only on the owned session,
identifies the target with its date/time and initial/alternate role, requires an exact
same-origin three-field native POST, and uses a ten-minute owner/session-bound
HMAC token with one minute of clock-skew tolerance. Expired forms return to the
confirmation surface; tampering remains a generic 403. Post/Redirect/Get status
is focused for announcement, private story pages are explicitly no-store, and a
global `frame-ancestors 'none'` plus `X-Frame-Options: DENY` blocks framing.

Deletion telemetry is unlinkable and best effort. A form token derives one
retry-stable deletion correlation ID, so response-loss and concurrent
same-form retries converge. The owner-scoped mutation completes before telemetry
is started; configuration errors, rejected writes, or a hung store cannot retain
content. Completion waits at most 100 ms, and its closed latency bucket freezes
at storage confirmation rather than including telemetry delivery time. Save and
intake copy now states the six-hour guest cleanup, provider processing, 60-day
raw-disclosure schedule, saved-until-deleted period, and the exact residual
aggregate/editorial-record boundaries without claiming infrastructure or provider
logs have already been verified.

A local in-app browser walkthrough created disposable same-figure stories,
confirmed their date/time plus page-position accessible names are distinct,
submitted the native confirmation form, observed the 303 result, verified focus
on the `Story deleted.` status, and reached the gentle stale-link state. Measured
Open/Delete/Keep/confirm targets were at least 50 px high. Live local responses
returned `Cache-Control: no-store`, `frame-ancestors 'none'`, and
`X-Frame-Options: DENY`. This is useful interaction evidence, not a substitute
for JavaScript-disabled, mobile/reflow, assistive-technology, or deployed-header
coverage in the supported-browser matrix.

`npm run check-story-deletion` covers owner/foreign behavior, root and alternate
cascades, artifact/feedback/recovery cleanup, flow revocation, outbox retirement,
signed-token binding/skew/expiry/tampering, same-origin and exact-body gates,
signed-out behavior, Post/Redirect/Get replay, concurrent double-submit,
retry-stable events, hung/rejected telemetry, frozen SLA latency, a never-resolving
playback lookup, pagination beyond 100 rows, SQL lock/grant shape, accessibility
markup, cache/framing headers, and misleading-copy canaries. The complete local
CI command matrix, 19-case smoke suite, zero-warning lint, typecheck, and isolated
production build pass. This is not real-Postgres or deployed-browser-matrix proof. Before release,
apply `0018` schema-first in staging; run two-connection root-delete versus
alternate-progress/feedback deadlock tests plus cascade, revocation, RLS, and
effective-grant checks; then verify no-JavaScript submission, expiry recovery,
screen-reader announcements, mobile reflow, touch/keyboard behavior, and
effective no-store/framing headers in supported browsers. Account deletion is
implemented in the next stacked slice; P0-14 remains `Partial` until both
deletion paths clear those gates and the complete privacy/retention surface is
finished.

### Stacked branch: `roadmap-privacy-account-deletion`

Migration `0019_owned_account_deletion.sql` adds the service-only hard account
authority. It takes an account advisory lock, every owned root advisory lock in
stable order, all owned session locks, then every owned telemetry-flow lock
before locking `auth.users`, optionally rechecking guest eligibility, explicitly
retiring flows, and deleting the auth owner. Auth cascades remove
sessions, artifacts, feedback, recovery and alternate state. `rate_limits` gains
a generated nullable owner UUID with `ON DELETE CASCADE` plus a partial index,
so a limiter UPSERT
either commits before deletion and is removed or loses its FK race after the
owner is gone. Scheduled anonymous cleanup now calls the same private boundary
with one fixed cutoff; that boundary rechecks guest status, creation time, and
saved progress only after all account/root/session/flow/auth locks are held. A
queued candidate that confirmed an email or saved newer progress is skipped.
Flow-owner claim and v2/v3/v4 initial-story RPCs take the same account advisory
lock before flow/auth/session work; their renamed implementations are revoked,
and an explicit PostgREST schema notification prevents a stale callable map.

The dedicated `/account` surface is independent of story-list/content loading.
Permanent accounts need a verified password/OTP AMR no older than ten minutes;
stale sessions can send a native-form one-time link to the server-known email,
with a signed HttpOnly same-device continuation through `/auth/confirm`. Guests
can delete immediately because they have no separate reauthentication channel
and already auto-expire. The final native form never accepts a user ID, requires
an owner-bound purpose-specific token plus explicit acknowledgement, rechecks
auth freshness, commits deletion before telemetry/sign-out, and redirects with
a two-minute account-ID-free signed receipt. The success page verifies that
receipt and the absence of another active account; edge middleware consumes the
cookie in the response serving its first view, so the public URL cannot make a
false deletion claim. Copy names the age/story distinction, shared
historical concerns, provider terms, revocation tombstones, and unlinkable
counts without promising provider or backup erasure. `/privacy` exposes the
implemented lifecycle, provider categories, cleanup semantics, active-database
deletion boundary, and preview/youth/legal gaps in plain language. Destructive
and status text clears AA contrast, and status focus uses valid block markup.

`npm run check-account-deletion`, lint, typecheck, and the structural database
probe cover token purpose/owner/skew/expiry, one-view success receipts, AMR allowlisting, guest/stale/signed-
out route behavior, exact same-origin body/PRG handling, memory graph cleanup,
unbound flow revocation, recovery/rate-key deletion, post-confirmation bounded
telemetry, RPC retry/Auth reconciliation, SQL lock/FK/grant/locked guest recheck,
account-serialized writers, cache headers, semantic status markup,
privacy-guide presence, and residual-copy
canaries. This is not real-Postgres or deployed-
browser evidence. Before release, apply `0019` schema-first and run two-connection
account deletion against initial creation, progress, feedback, alternate claim/
finalize, recovery issue/consume, limiter UPSERT, flow capture, story deletion,
and dispatcher settlement. Verify FK cascades, old-JWT rejection, guest cron,
RLS/grants, native no-JavaScript submission, same/cross-device email links,
screen-reader focus, mobile/reflow, and deployed no-store/framing headers. Before
an unqualified permanent-deletion promise, verify provider/backups and implement
a restore-time deletion-replay strategy or prove deleted rows cannot be restored.

### Stacked branch: `roadmap-recipe-promotion-gate`

`config/story-recipes.json` is now the single runtime and documentation source
for the production recipe. Its current decision is deliberately
`retain_baseline`: the imported July 2 keyword run passed at 99/101 non-miss
top-1 with zero hard-confusion and zero definitive-wrong results, while the
FacetsRAG challenger reached 96/101, confused one hard pair, and produced three
definitive-wrong results. Both metrics-only records, their aggregate offline
comparison, and the no-promotion decision are content-addressed and append-only;
the detailed local run directory is ignored. The governance checker recomputes
every manifest/evidence/shadow/decision hash and metric, validates the generated
operator document, and prevents synthetic or imported evidence from authorizing
a promotion. Future promotion requires one protected holdout, real non-legacy
candidate evidence from the exact production-eligible catalog, fixed sample/stability/
latency floors, conservative superiority, a passing paired shadow record, zero definitive-
wrong results, no hard/miss/coverage regression, product/matching/safety-privacy
approvals attested by a reviewer-protected environment, and the base commit's
compatible primary as both source and rollback. Eval and shadow records remain
`promotable=false`; their exact commit/input-tree and distinct run, deployment,
source-output, and shadow identities are bound only by the dependency-free
attestor loaded from protected `main`. Its authority is scoped to one minimal
step and one promotion-only PR, so PR-controlled code, checkout, and package
installation never receive the secret. CI also rejects modification or deletion
of prior evidence/decisions and mutation of an existing recipe entry.

Production requires `ONWARD_PRODUCTION_RECIPE_ID`, Supabase persistence,
provider credentials, canonical endpoint/timeout posture, and a safe deployment
identifier. The selected manifest is the sole non-secret production source for
provider/model/tuning/retrieval/embedder/composer behavior; stale local/eval
environment values are ignored instead of creating a mixed recipe. The
append-only prompt-release registry binds each version to the SHA-256 of its
exact canonical prompt content, which is also verified by the runtime. Startup logs
only safe recipe identity; invalid
configuration keeps crisis resources available but stops every other story
before auth, rate limiting, providers, or durable work. New session recipes pin
the manifest hash, dataset, deployment, prompt, model, composer, validator, and
StorySpec versions, with `embeddingModelId=null` on keyword. Migration
`0020_story_recipe_registry.sql` independently enforces the same identity through
an append-only default-deny registry and exact session trigger, while replacing
the old duplicated single-ID checks across recovery, initial/alternate writes,
product events, generation attempts, and daily rollups. The database has no
active pointer, so a compatible pre-registered matching rollback is one
application selector change. Promotion is restricted to the same installed
library, prompt, validator, schema, boundary, and composer compatibility set;
changes to those axes require a rollback-capable code/content release rather
than an unsafe selector-only claim.

Local gates pass for recipe governance, registry structure/tampering,
deployment drift/rollback selection, telemetry contracts/producers, lint,
typecheck, and the 19-case smoke suite. This does not claim the migration has
been applied or that a second recipe has been promoted. Before public release,
pause new stories, deploy the registry-aware writer, apply `0020`, run the live
database gate, re-enable for one canary, verify persisted manifest/deployment
identity, and restore the prior selector in a real rollback drill. A protected
holdout remains mandatory before any challenger promotion.
The workflow and CODEOWNERS entries are present, but the repository is private
and, as verified on 2026-07-23, its current GitHub plan returns `403` for branch
protection and rulesets with an instruction to upgrade to GitHub Pro or make the
repository public. The `recipe-promotion` environment is also absent. Promotion
is therefore externally blocked: upgrade the plan or deliberately change
visibility, then create/protect the environment, populate its
exact head/decision/evidence/shadow/commit/tree/run/deployment/source/catalog/
dataset/reviewer bindings plus canonical attestation digest and secret, and
protect `main` with pull requests, CODEOWNERS review, dismissal of stale
approvals, no direct pushes, and strict/up-to-date `CI / verify` plus
`Recipe Promotion Authority / recipe-promotion-gate`. Keep merge queue disabled
because the current workflows do not handle `merge_group`; if it is adopted,
add and verify that trigger in both required workflows before enabling the
queue. Only then may the separate direct-to-`main` promotion PR be considered.

### Stacked branch: `codex/p0-story-quality-benchmark-contract`

This slice establishes the code-owned portion of P0-01 without claiming the
human study is complete. It adds the blind paired benchmark protocol, strict
private packet and aggregate evidence contracts, externally rooted Ed25519
custody, full artifact/StorySpec/review bindings, cross-case privacy checks,
closed arithmetic, a controlled runner, and append-only history governance.
The final adversarial audit found no remaining P0 defect after cross-case,
short/non-Latin echo, unverified-proof, history-admission, public-identifier,
and ownership gaps were closed.

| Command | Result |
|---|---|
| `npm run check-story-quality-benchmark` | Pass; 74 adversarial assertions, including a 150-session-per-arm protected release fixture |
| `npm run check-story-quality-immutability-self-test` | Pass; append-only, private-path, regular-file, path, policy, and protocol cases |
| `npm run check-story-quality-immutability -- c720b8e` | Pass; final committed branch diff is append-only against the stacked PR base |
| `npm run lint` | Pass; zero warnings |
| `npm run typecheck` | Pass |
| All other commands in `CI / verify` before build | Pass |
| `npm run smoke` | Pass; 20/20 regressions, including short English and non-Latin disclosure echoes |
| `NEXT_DIST_DIR=.next-ci PERSISTENCE=memory ONWARD_ALLOW_MEMORY_IN_PRODUCTION=true LLM_PROVIDER=stub EMBEDDING_PROVIDER=stub RETRIEVAL_MODE=keyword npm run build` | Pass; 23 static/dynamic app surfaces compiled/generated |

P0-01 remains `External gate`. The repository contains no participant packet,
real holdout, completed human review, trusted custodian key, or signed release
evidence. Ordinary pull-request CI intentionally rejects custody-bearing
evidence because it has no protected trust root. Before a public release, a
base-owned workflow and enforced branch controls must independently verify and
land the real signed result; CODEOWNERS and post-push audits are not a substitute
for those controls.

### Stacked branch: `codex/p0-derived-output-retention-contract`

This slice closes the code-scoped P0-04 derived-output privacy gap without
claiming that P0-14's external retention program is complete. It adds seven
closed lifecycle classes, 19 classified surfaces, five exact provider
exchanges, opaque reader-derived outputs and exchange-bound request bodies,
exact consumer/caller/sink inventories, reduced provider errors, private
owner-response caching rules, and migration `0021`'s honest current-or-legacy
labels over all 35 session/artifact fields. The migration uses bounded,
session-first rollout locks and exposes only a closed service-role schema-health
result. The checker also enumerates every current application table and
production JavaScript/TypeScript network path. A final independent standards
and contract audit found no remaining concrete defect.

| Command | Result |
|---|---|
| `npm run check-recipe-immutability -- 69e366b14d7b4dfa62f4c83149c7140e97e8ffd6` | Pass; stacked recipe history remains append-only |
| `npm run check-prompt-releases -- 69e366b14d7b4dfa62f4c83149c7140e97e8ffd6` | Pass; prompt releases remain append-only |
| `npm run check-story-quality-immutability -- 69e366b14d7b4dfa62f4c83149c7140e97e8ffd6` | Pass; protected quality evidence remains append-only |
| `npm run check-derived-output-retention` | Pass; 7 classes, 19 surfaces, 5 exchanges, 21 tables, and 35 sensitive fields |
| `npm run check-telemetry-dispatcher` | Pass; declarative classification does not open private runtime reporting access |
| `npm run lint` / `npm run typecheck` | Pass; zero lint warnings and no type errors |
| All remaining commands in `CI / verify` before build | Pass |
| `npm run eval-crisis` | Pass; 26/26 critical safety cases with zero critical false negatives |
| `npm run smoke` | Pass; 20/20 application regressions |
| `NEXT_DIST_DIR=.next-ci PERSISTENCE=memory ONWARD_ALLOW_MEMORY_IN_PRODUCTION=true LLM_PROVIDER=stub EMBEDDING_PROVIDER=stub RETRIEVAL_MODE=keyword npm run build` | Pass; optimized production build compiled and generated successfully |

P0-04 is `Complete`; P0-14 remains `Partial`. Before public release, apply and
exercise `0021` on real Postgres, verify lock/concurrency/RLS/grant/cron behavior,
capture a durable transactional save state, approve the shared-editorial
retention period, configure provider and infrastructure logging/retention, and
define backup/PITR deletion replay or a bounded non-restoration guarantee.
Legal, market, and youth review remain external gates.

### Stacked branch: `codex/p0-durable-story-save-state`

This slice makes the account-wide Save decision durable without stamping or
mutating every Session. Migration `0022` records only the informed
anonymous-to-permanent Auth transition as current evidence, backfills older
permanent owners with an honest null-time legacy observation, preserves the
owner decision across story deletion, and removes it with account deletion.
The server projects closed temporary, saved, read-unavailable, and
integrity-conflict states. Returning-owner sign-in cannot create an account,
and the initial match boundary stops a permanent owner without coherent Save
evidence before telemetry activation, limits, providers, or writes.

The story library and Save card now state the guest clock and fixed 60-day
Recovery Context deadline, show and correct the pending email destination,
avoid stranding a guest on an existing-account sign-in, distinguish retryable
reads from contradictions, and preserve keyboard/screen-reader focus through
async Save and sign-in states. A separate main-based compatibility slice is
open as PR #72 so returning-only sign-in can deploy before the coordinated
`0022` cutover. The runbook requires pausing and draining story creation,
verifying migration health, deploying the full guard, running canaries, and
only then reopening; it prohibits public rollback to an implicit-signup or
unguarded permanent-story build.

| Command or review | Result |
|---|---|
| Recipe, prompt-release, and story-quality immutability checks against `89cf591a6d313712a99f3a0e89691dc46a6ccf81` | Pass; all protected histories remain append-only |
| `npm run check-owner-story-save` | Pass; parser, projection, consent, SQL ordering, grants, deletion, UI, cutover, and integration contracts |
| Exact migration execution in PGlite/PostgreSQL | Pass; all 9 health flags plus upgrade consent, direct-account coverage failure, immutability, Auth cascade, and role denial |
| `npm run check-derived-output-retention` | Pass; 7 classes, 20 surfaces, 5 exchanges, 22 tables, and 35 sensitive fields |
| `npm run check-auth-telemetry` | Pass; permanent-without-Save returns 503 without flow/session mutation, then succeeds with coherent evidence |
| `npm run check-story-deletion` / `npm run check-account-deletion` | Pass; story deletion preserves Save State and account deletion removes it |
| `npm run lint` / `npm run typecheck` | Pass; zero lint warnings and no type errors |
| Every remaining command in `CI / verify` before build | Pass |
| `npm run eval-crisis` | Pass; 26/26 critical safety cases with zero critical false negatives |
| `npm run smoke` | Pass; 20/20 application regressions |
| `NEXT_DIST_DIR=.next-ci PERSISTENCE=memory ONWARD_ALLOW_MEMORY_IN_PRODUCTION=true LLM_PROVIDER=stub EMBEDDING_PROVIDER=stub RETRIEVAL_MODE=keyword npm run build` | Pass; optimized production build compiled and generated all 23 app surfaces |
| Focused local browser QA | Pass; desktop/mobile temporary library and returning sign-in render correctly, labels are exposed, and email validation enables/disables the Save action without submitting Auth data |
| Independent code, security/database, and product/accessibility reviews | All implementation findings resolved; managed Supabase/Auth and production cutover evidence remain external |

P0-14 remains `Partial`. Before public release, merge and deploy the
compatibility guard, execute the documented paused cutover against managed
Supabase, verify real Auth timing, lock/deadlock, RLS/grants, same/cross-device,
cascade, limiter, cron, rollback, and supported-browser accessibility canaries,
and complete the provider, infrastructure, backup/PITR, legal, market, youth,
optional-note, and shared-editorial-retention decisions listed in the matrix.

## Completion audit rule

The goal remains active until every row above is `Complete` and every external gate has authoritative evidence. A PR merge, green CI check, model output, or local smoke result completes only the acceptance criteria it directly covers.
