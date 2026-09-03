# Backlog

The 43 long-term items from the July 2026 feature roadmap in one table per priority, with each item's status from the implementation ledger dated **2026-08-10** and its standing under the [controlled public beta contract](./controlled_public_beta.md). This is a reference, not a commitment: the beta contract narrows the engineering goal to the launch-critical closure and the seven external gates.

The full acceptance criteria, the evidence behind each status, and the verification history are in git history before 2026-09-03 (`roadmap/feature_roadmap.md` and `roadmap/implementation_status.md`).

**Status** uses the ledger's meanings: `Not started` (no implementation evidence), `Partial` (foundations exist, acceptance criteria missing), `In progress` (being implemented), `Complete` (every acceptance criterion has direct evidence), `External gate` (needs real users, qualified reviewers, managed-service access, or production authority, not more repository code).

**Beta contract** says how the contract treats the item: `launch-critical` (part of the engineering closure), `external gate` (one of the seven gates that block invitations), `deferred` (explicitly deferred), or `outside beta` (not named by the contract).

## P0 — required before public release

| ID | Type | Item | Status | Beta contract | What is left |
|---|---|---|---|---|---|
| P0-01 | Feature | End-to-end story quality benchmark and release gate | External gate | external gate | Approve the real consent protocol, recruit sessions, seal a genuine protected holdout, publish launch StorySpecs, run independent review, provision an external custodian key. |
| P0-02 | Refactor | Evidence-addressable `StorySpec` content model | In progress | external gate | Researchers must author exact locators, resolve entities/quotes/chronology, record real reviews for the launch subset; apply and transactionally exercise 0023 on managed Supabase. |
| P0-03 | Refactor | Hybrid Story Composer with validation and fallback | In progress | launch-critical | Evaluate v2 against v1 on the protected blind benchmark; add target-reader and editorial/safety review, real provider latency and Postgres round-trip evidence. |
| P0-04 | Bug Fix | Remove verbatim disclosure echo and close derived-data leaks | Complete | launch-critical | All 50 canonical bridges and the demo stopped repeating intake; governed brief projection, HMAC echo gates, and the CI sink registry closed the leaks. |
| P0-05 | Feature | Match confidence, one-question clarification, and honest no-close-match recovery | In progress | launch-critical | Calibrate thresholds and prove the question's expected value on the consented holdout; add measured try-another recovery, browser accessibility evidence, benchmark miss/clarification performance. |
| P0-06 | UI/UX | Guided, low-friction intake redesign | Partial | launch-critical | Draft recovery across full navigation, a real server progress boundary, privacy-safe retry measurement, supported-browser accessibility and comprehension evidence, measured intake-to-first-content latency. |
| P0-07 | UI/UX | Production story-reader redesign | In progress | launch-critical | Representative-phone, zoom/reflow, keyboard-only, named screen-reader, Supabase-auth conversion, and target-reader comprehension evidence; the in-app viewport override did not produce a phone viewport. |
| P0-08 | UI/UX | “Why this story” and source transparency | In progress | external gate | Publish a real launch StorySpec and exercise its quote/source projection; apply 0007 and 0023 to managed Supabase; finish accessibility and trust-comprehension testing. |
| P0-09 | Bug Fix | Correct reading-progress acknowledgement and resume behavior | In progress | launch-critical | Real-Postgres concurrency, RLS, rollback and cross-instance evidence; convert the manual browser matrix into durable route/component E2E coverage including committed-ACK response loss. |
| P0-10 | Feature | Resonance feedback and “try another story” loop | In progress | outside beta | Decide consented optional notes; prove anonymous Supabase migration, RPC, RLS, cross-instance lease, cron and deletion behavior, browser accessibility, and aggregate learning with P0-11. |
| P0-11 | Feature | Privacy-safe product telemetry and operational observability | In progress | deferred | Apply and exercise 0017 on real Postgres with cron, RLS, dispatch and deletion cases; add cohort aggregates, dashboards, alerts, on-call ownership, live-data proof. |
| P0-12 | Bug Fix | Safety flow, regression suite, and reviewed resource handling | External gate | external gate | Qualified safety review, launch-market approval, browser proof that crisis never invokes anonymous sign-in, and a deliberate policy for context/negation over-triggers. |
| P0-13 | Bug Fix | Retrieval configuration, documentation, and promotion gate | In progress | external gate | Apply 0020 with the kill-switch cutover, run live check-db, verify a production canary's manifest fields, exercise a one-selector rollback; branch protection remains externally blocked. |
| P0-14 | Feature | Story deletion, account deletion, consent, and retention controls | Partial | external gate | Ship the sign-in compatibility guard; apply and exercise 0021-0023 on managed Supabase; add backup/PITR deletion handling, provider retention review, market-specific legal notice, accessibility evidence. |
| P0-15 | Refactor | Automated release pipeline, migrations, and rollback readiness | In progress | external gate | Complete the route/integration matrix, execute 0023 and remaining migrations on managed Supabase with rollback/RLS cases, run the real benchmark, capture green remote CI/Vercel evidence. |
| P0-16 | UI/UX | Cross-flow design system and accessibility hardening | Partial | launch-critical | Extend shared primitives beyond story limits, establish the all-flow copy system, and complete supported-browser keyboard, screen-reader, zoom, contrast, reduced-motion, and manual usability audits. |
| P0-17 | Feature | Emotional boundaries and story-intensity controls | In progress | launch-critical | Replace inferred draft profiles with human-reviewed launch profiles; complete supported-browser keyboard, named screen-reader, zoom/reflow, safety/editorial, and target-reader review. |

## P1 — high-priority fast-follows

| ID | Type | Item | Status | Beta contract | What is left |
|---|---|---|---|---|---|
| P1-01 | Refactor | Facet query projections and eval-gated dynamic retrieval | Partial | deferred | Registered/hash-verified plan binding, shadow-only invocation, static then bounded-dynamic weighting experiments, protected-holdout superiority, and promotion. |
| P1-02 | Feature | Reader-controlled story emphasis | Not started | outside beta | Optional non-branching emphasis choice and experiment evidence. |
| P1-03 | Feature | Controlled full-beat regeneration experiment | Partial | deferred | Full-beat free-prose challenger behind the same StorySpec/validation contract and a blind comparison. |
| P1-04 | Refactor | Editorial workbench and content lifecycle | Partial | deferred | Internal research/review/preview/publish/report/rollback workbench and audited editor identity/action history. |
| P1-05 | Feature | Demand-led stage expansion and multi-stage figures | Partial | deferred | Demand-led coverage data, additional stage support in product workflow, measured coverage improvement. |
| P1-06 | UI/UX | Saved-story library v2 | Partial | outside beta | Richer privacy status, source access, filters, and cross-device usability. |
| P1-07 | Feature | Controlled model and prompt experimentation | Partial | outside beta | Challenger registry, safe assignment, stopping rules, automatic guardrail shutdown. |
| P1-08 | UI/UX | Market-aware copy, resources, and localization foundation | Not started | outside beta | Externalized copy/resources, market policy, native editorial review. |
| P1-09 | Feature | Gentle revisit and reflection mode | Not started | outside beta | Explicit private reflection mode with consent/deletion and non-clinical guardrails. |
| P1-10 | Refactor | Latency and cost optimization after instrumentation | Partial | outside beta | Production traces, measured bottleneck work, cost budgets, verified quality-neutral optimization. |
| P1-11 | Feature | Two-perspective match choice for ambiguous cases | Not started | outside beta | Calibrated ambiguity rule, two safe previews, choice UI, experiment. |
| P1-12 | Feature | Private Carry-Forward Card | Not started | outside beta | Private user-authored Carry-Forward Card, persistence, deletion/export, outcome evidence. |
| P1-13 | UI/UX | Short and full reading modes | Not started | outside beta | Short/full compilers from one StorySpec, source parity, place-preserving expansion. |
| P1-14 | Feature | Opt-in private context continuity | Not started | outside beta | Opt-in inspectable/deletable stable preferences without disclosure reuse. |
| P1-15 | Feature | Redacted conversation card | Not started | outside beta | Previewed redacted card, safe defaults, revoke/expiry for links. |
| P1-16 | Feature | Outcome-diverse story library | Partial | outside beta | Arc taxonomy, balance audit, new reviewed outcome shapes, target-user evidence. |
| P1-17 | UI/UX | Source-grounded “What changed next” map | Not started | outside beta | Fact-linked external/action/help/failure/time map. |
| P1-18 | Feature | Optional source-grounded afterword lenses | Not started | outside beta | Optional evidence-linked afterword lenses and usefulness evidence. |

## P2 — future considerations

| ID | Type | Item | Status | Beta contract | What is left |
|---|---|---|---|---|---|
| P2-01 | UI/UX | Optional human-quality audio narration | Not started | outside beta | Optional disclosed narration, controls, transcript sync, rights/privacy review. |
| P2-02 | Feature | Native/offline reading surfaces | Not started | outside beta | Proven web repeat use, offline encryption/deletion/revocation, native implementation. |
| P2-03 | Feature | Privacy-preserving story sharing | Not started | outside beta | Redacted canonical share artifact, preview, expiry, revoke, index and recipient controls. |
| P2-04 | Feature | Facilitator pilot for educators, counselors, and support organizations | Not started | outside beta | Research/safeguarding protocol and non-clinical facilitator pilot. |
| P2-05 | Refactor | Database-native vector retrieval at larger library scale | Not started | outside beta | Measured scale trigger, indexed migration, quality/latency parity benchmark. |
| P2-06 | Feature | Multilingual stories and cross-language retrieval | Not started | outside beta | Native editorial, safety resources, cross-language benchmarks, localized product. |
| P2-07 | UI/UX | Curated thematic collections | Not started | outside beta | Small curated shelves without infinite feed and measured discovery value. |
| P2-08 | Feature | Carefully governed community layer | Not started | outside beta | Independently funded moderation, abuse, youth, crisis, privacy, and boundary design. |
