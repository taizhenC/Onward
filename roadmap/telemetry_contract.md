# Privacy-safe telemetry contract

**Status:** Implemented foundation; production instrumentation and reporting are separate follow-up work.

**Contract version:** `product-event-v1-2026-07` / `generation-attempt-v1-2026-07`

**Product owner:** Product

**Technical owner:** Platform/Data

**Privacy approver:** Privacy/Safety

## Objective

Measure whether Onward's core loop works without copying intimate input, story content, or inferred meaning into an analytics system. This contract is intentionally narrower than the application data model. Dedicated stores remain the source of truth for feedback reasons and historical concerns; general telemetry receives only the minimum closed reduction needed for product and operational decisions.

No third-party tracking SDK or public generic analytics endpoint is permitted for the P0 release. Server-authoritative events must be emitted only after the underlying durable transition succeeds. Client events are allowed only for visibility or opening interactions and must use the same exact server-validated contract.

## Hard privacy boundary

Product events may contain an opaque, signed, time-bounded per-root-flow ID with a domain-separated `tfl_` prefix. Its nonce contains a coarse issuance timestamp plus an 80-bit random suffix; the timestamp is not user data and prevents a deleted registry row from resetting the capability's 30-day active lifetime. Stored event (`tev_`), outbox-only repeatable occurrence (`toc_`), attempt (`gat_`), and deletion-correlation (`tdl_`) IDs use disjoint HMAC-authenticated formats so a raw session/artifact ID, flow-derived event ID, or forged prefixed value cannot be laundered into another purpose. The `toc_` value is never copied into telemetry storage; one occurrence always derives one retry-stable stored `tev_` value, so reuse across crisis, rate-limit, or failure kinds collides rather than minting another row. Linked event IDs identify the authoritative semantic unit rather than measured dimensions: for example, latency and viewport are first-write-wins values for one flow/role/ordinal unit, not inputs that may mint a second unit. Each ID carries a non-secret key ID. Verification accepts the current key plus explicitly configured previous keys; every previous key must remain available for at least the 30-day product-event lifetime and until every associated flow, stored event, and outbox retry is deleted or drained. A flow ID is not a user ID, raw session ID, auth ID, artifact ID, token, or stable cross-session identifier. Crisis, rate-limit, and deletion events are deliberately unlinkable and must have `flowId = null`; a deletion request/completion pair shares only its random one-request correlation ID.

The following are categorically forbidden in both streams:

- disclosure, story, opening, rationale, prompt, response, request, body, message, free text, or hashes/fingerprints of those values;
- figure, stage, StorySpec, fact, source, candidate, embedding, score, theme, facet, resonance, boundary value, clarification choice, feedback miss reason, or age;
- user/session/artifact/auth identifiers, email, IP/IP hash, URL, referrer, user agent, cookie, capability, recovery token, or device ID;
- arbitrary metadata/properties/payload objects, arrays, nested objects, exception objects, messages, stacks, causes, or raw provider bodies;
- unbounded counts, costs, durations, status codes, identifiers, model IDs, or arbitrary strings.

Unknown keys are rejected before storage. SQL uses typed columns and an event-specific exact-shape constraint; neither durable telemetry payload table (`product_events` or `generation_attempts`) has a JSON payload column, and the lifecycle/outbox tables contain only bounded identity and delivery state. Raw provider exceptions may be inspected only by the approved reducer, which returns closed error/status/latency buckets and discards the original value.

## Product event registry

All linked events expire after 30 days. New flows advance through issued, owner-claimed, and root-bound states; root-story/account deletion or explicit owner-scoped retirement cascades events/outbox pointers and preserves only an opaque tombstone through the flow's original signed expiry. Deleted or expired capabilities cannot be re-registered. Legacy sessions are intentionally not backfilled. P0-14 still must expose the user-facing story/account deletion authorities that invoke this substrate. Unlinkable events expire on the same schedule and cannot be traced back to a person. Dashboard consumers must use aggregate queries; raw-row access is restricted to approved Platform/Data service boundaries for incident diagnosis.

| Event | Purpose | Authoritative producer | Allowed dimensions | Owner / consumer | Deletion behavior |
|---|---|---|---|---|---|
| `landing_cta_clicked` | Landing-to-intake funnel | Client, once per flow | fixed surface | Product / funnel | Flow delete or 30-day TTL |
| `intake_started` | Approximate intake abandonment | Client, first valid interaction | coarse viewport | Product/Design / funnel | Flow delete or 30-day TTL |
| `intake_submitted` | Valid intake denominator | Server after exact request validation | none | Product / funnel | Flow delete or 30-day TTL |
| `auth_established` | Story-flow auth reliability | Server after auth success inside an active story-creation root flow | closed auth method | Platform / funnel | Flow delete or 30-day TTL |
| `crisis_intercepted` | Safety-path volume | Server safety gate before persistence/provider | none; unlinkable | Safety / restricted aggregate | 30-day TTL; no subject exists |
| `rate_limited` | Abuse/reliability guardrail | Server limiter denial | operation and user/IP scope only; unlinkable | Platform / reliability | 30-day TTL; no subject exists |
| `match_completed` | Match acceptance/calibration | Server match disposition | approved recipe, story role, closed disposition/confidence/path, age-fallback boolean, boundary outcome | Matching/Product / quality | Flow delete or 30-day TTL |
| `clarification_shown` | Clarification yield | Server recovery response | approved policy version | Product/Matching / quality | Flow delete or 30-day TTL |
| `artifact_created` | Artifact denominator, first-pass and fallback rate | Atomic artifact/session commit | approved recipe, story role, composition/fallback/attempt buckets | AI/Platform / quality | Flow delete or 30-day TTL |
| `first_content_shown` | Time-to-readable-state SLO | Client when preface is visible | story role, latency bucket | Product/Platform / experience | Flow delete or 30-day TTL |
| `passage_presented` | Stored-passage transition SLO | Client after the newly requested stored passage is visible | story role, bounded ordinal, latency bucket | Product/Platform / experience | Flow delete or 30-day TTL |
| `passage_acknowledged` | Reader drop-off and progress correctness | Server only when CAS returns `advanced` | story role, bounded ordinal | Product / experience | Flow delete or 30-day TTL |
| `story_completed` | Completion and north-star numerator | Server on durable final acknowledgement | story role | Product / outcome | Flow delete or 30-day TTL |
| `source_opened` | Provenance engagement | Client, first-ever closed-to-open transition for the flow/role; deterministic ID deduplicates reloads | story role | Product/Editorial / trust | Flow delete or 30-day TTL |
| `feedback_submitted` | Feedback response and felt-close rates | Server only for durable `created` feedback | story role and verdict only | Product/Matching / outcome | Flow delete or 30-day TTL |
| `alternate_requested` | First-match recovery demand | Server on first valid durable claim | none | Product/Matching / recovery | Flow delete or 30-day TTL |
| `alternate_resolved` | Alternate recovery success | Server on terminal transition | closed terminal outcome | Product/Matching / recovery | Flow delete or 30-day TTL |
| `story_saved` | Durable save rate | Server only after P0-14 defines/commits save | story role | Product / retention | Flow delete or 30-day TTL |
| `saved_story_reopened` | Seven-to-thirty-day return value | Server read after durable save | story role, `<7d`/`7-30d` | Product / retention | Flow delete or 30-day TTL |
| `deletion_requested` | Deletion SLA denominator | Server after accepting a valid deletion request | random deletion correlation ID and scope; unlinkable | Privacy/Platform / trust | 30-day TTL; deliberately unlinked |
| `deletion_completed` | Deletion SLA completion | Server after confirmed successful cascade | same deletion correlation ID, scope, latency; unlinkable | Privacy/Platform / trust | 30-day TTL; deliberately unlinked |
| `flow_failed` | Availability and failure alerts | Sanitized server boundary | domain, closed error/status/latency buckets | Platform / reliability | Flow delete or 30-day TTL |

`story_saved` and `saved_story_reopened` are contract reservations, not authorization to instrument the current email-upgrade UI as a saved story. They remain disabled until P0-14 defines the durable save state. The eventual producer must compute age from authoritative persisted timestamps, emit at most the first qualifying reopen in each bucket, and suppress reopens after 30 days; callers may not choose a bucket.

## Reduced generation attempts

Generation attempts are unlinkable operational rows retained for 14 days. They contain only approved recipe, operation/provider, outcome/attempt, latency/status/error/fallback/validation buckets, and a bounded estimated cost in micro-USD. They contain no flow, user, session, story, content, candidate, or model identifier.

Producers are provider/persistence boundaries after an attempt terminates. Platform/AI owns the stream; reliability, fallback, validation, and cost dashboards consume only aggregates. A success cannot carry failure fields, a fallback requires a closed fallback reason, and a failure requires a closed error class. The contract distinguishes provider-output schema rejection (`provider_output_invalid` + `invalid_output` + `schema_rejected`) from artifact-validator rejection (`validator_rejected` + `validation_rejected` + a closed rejection outcome).

## Metric coverage

Core story-outcome metrics are denominator-cohorted by `artifact_created` and use one flow/role as the story-session unit. Completion, feedback, source-open, and alternate behavior count only when they occur from the denominator timestamp through 24 hours later. A cohort is final only after that 24-hour observation window; later events are reported separately and never rewrite the finalized launch cohort. Intake abandonment similarly matures 24 hours after `intake_started`. Raw-data reporting must use a lookback safely below the 30-day TTL (at most 28 days) or a separately retained, privacy-reviewed, minimum-cell-suppressed aggregate. Deletion can reduce any cohort and is never delayed to preserve analytics.

| Release question | Source |
|---|---|
| Resonant Story Completion Rate | The story-session unit is one flow/role pair; require `artifact_created` + `story_completed` + `feedback_submitted:felt_close` on that same unit, and report initial/alternate segments beside the overall rate |
| Completion and feedback-response rates | `story_completed / artifact_created`; `feedback_submitted / story_completed` |
| Felt-close rate | Feedback verdicts; silence is never inferred as positive |
| Try-another demand and rescue | `alternate_requested`, `alternate_resolved`, alternate completion/feedback |
| Clarification yield and no-close rate | `clarification_shown` followed by closed `match_completed` disposition |
| First-pass validation and canonical fallback | `artifact_created` plus reduced generation attempts |
| Intake abandonment | Aggregate `intake_started - intake_submitted`; explicitly approximate |
| Time to first content | `first_content_shown` latency distribution |
| Reader completion/drop-off and transition latency | Durable `passage_acknowledged` ordinals, `story_completed`, and `passage_presented` latency buckets |
| Source engagement | Distinct flow/role `source_opened` units / completed flow/role units |
| Availability/failure/fallback | Eligible `match_completed`, `flow_failed`, `artifact_created`, reduced attempts |
| Cost per completed story | Reduced attempt micro-cost aggregate / completed story units over the same window, never longer than the attempt stream's 14-day TTL |
| Save and seven-to-thirty-day reopen | Reserved events after P0-14 durable save semantics exist; this cohort is finalized 30 days after save rather than using the common 24-hour window |
| Feedback miss categories and factual reports | Dedicated `story_feedback` and `historical_concern_reports`, not telemetry copies |
| Unsupported claims, critical tone, safety false negatives | Offline editorial/safety evaluation; product telemetry cannot prove these |

Eligible-story availability begins when `match_completed` records `close` or `adjacent` for a flow/role. An `artifact_created` for that same unit within 120 seconds is successful. A post-eligibility `flow_failed` followed by the artifact inside 120 seconds is recovered success; an artifact after 120 seconds is a late recovery and remains an SLO failure. No artifact by 120 seconds is unavailable even when no `flow_failed` row exists. `clarification_required`, `no_eligible`, and `no_close_match` are excluded and reported separately. Pre-eligibility auth and matching reliability are reported independently from `intake_submitted` and failure-domain events. Release scorecards finalize only after the common 24-hour reconciliation window; operational views may remain provisional.

Latency buckets are `[0,250ms)`, `[250ms,500ms]`, `(500ms,1s)`, `[1s,3s)`, `[3s,6s)`, `[6s,8s]`, `(8s,15s]`, and `>15s`. Therefore exactly 500 ms and exactly 8 seconds satisfy their release gates. Dashboards must show bucketed distributions and must not claim a more precise percentile than the buckets support.

`first_content_shown` starts on the client's monotonic clock immediately before dispatching an intake request that the server ultimately accepts and ends after the preface is committed, laid out, and visible. `passage_presented` starts when the user activates Continue, before the compare-and-set/network request, and ends when the returned stored passage is committed, laid out, and visible. Both measures include network, database, and render time and exclude optional reveal animation. If the originating monotonic timestamp is unavailable after reload, navigation, or cached re-entry, emit nothing rather than fabricate latency.

`auth_established` is emitted only for authentication performed inside an active story-creation root flow. Standalone sign-in or saved-story access must never fabricate a story flow; general auth reliability requires a separately scoped future operational stream.

## Storage, access, and deletion

- `telemetry_flows`: maximum 30 days; pre-session rows contain only a signed opaque flow, while a committed root story binds owner and root together behind default-deny RLS. Initial and alternate stories resolve through that one root. Root/account deletion cascades the mapping, linked events, and queued delivery pointers. Legacy sessions are deliberately not backfilled.
- `telemetry_flow_revocations`: only the opaque flow ID and its original signed expiry; prevents early deletion from being reversed and is pruned at that expiry.
- `product_events`: maximum 30 days; new linked rows require a registered flow. A root/account cascade or explicit known-flow deletion removes them immediately.
- `product_event_outbox`: pointer-only delivery state retained no longer than its product event. It contains no copied event payload or subject/story identifiers; delivery uses the immutable `event_id` as its sink idempotency key.
- `generation_attempts`: maximum 14 days; unlinkable and pruned by TTL.
- Product-event and generation-attempt payloads are immutable. Flow identity and expiry are immutable; owner and root are write-once through the controlled issued -> owner-claimed -> bound RPC transitions. Outbox state mutates only through claim/ACK/NACK leases. All lifecycle tables are default-deny under RLS and accessible only through approved service-role modules/RPCs.
- SQL constrains identifier shape; HMAC authenticity is enforced before insert by the server-only telemetry module. Operational policy prohibits direct service-role telemetry inserts outside that boundary.
- A daily scheduled job deletes expired rows. Production rollout must verify the job and RLS with real Postgres.
- No external raw-event sink may be enabled yet. A claimed row can be deleted between claim and delivery; any future consumer must either revalidate/retract immediately before delivery or process only into privacy-reviewed unlinkable aggregates that cannot preserve a deleted subject's row. This is a release precondition, not behavior supplied by the pointer queue alone.
- Longer-lived aggregates are not part of this branch. If introduced, they must be unlinkable, minimum-cell suppressed (recommended `k >= 10`), versioned, separately retained, and privacy-reviewed.
- Guest deletion may remove the only live flow before a 30-day cohort matures. Product reporting must not weaken the six-hour guest deletion promise to preserve analytics.

## Required producer rules

- Never spread a request, `Session`, `StoryArtifact`, match debug object, provider response, feedback row, or exception into telemetry.
- Durable transition events must be written transactionally with the domain change or through a transactional outbox. On an idempotent domain replay (`duplicate`/`already_advanced`), reconcile the same deterministic telemetry ID instead of incrementing twice or permanently losing the event.
- Feedback corresponds to the one durable feedback row; passage/completion corresponds to the one durable compare-and-set transition.
- Emit alternate request/terminal events only on durable state transitions, never on polling/hydration.
- Telemetry failure must not delay or suppress crisis resources.
- The telemetry module derives deterministic IDs from the domain-separated flow and the event's closed semantic unit for linked milestones. Measured dimensions are excluded so a conflicting retry is rejected instead of double-counted. Producers never pass session/artifact IDs as event IDs. Repeatable crisis, rate-limit, and failure occurrences receive a purpose-separated `toc_` token minted once by the transactional outbox; it derives the stored `tev_` ID and every ambiguous retry reuses it. Reduced attempts similarly receive one caller-stable `gat_` ID.
- Rotate telemetry keys by adding the outgoing key to `TELEMETRY_ID_PREVIOUS_SECRETS` before changing the current key. Retain it for at least 30 days and until all associated outbox work is drained so early deletion, deletion completion, and retries keep working.

## Remaining release work

This contract, signed flow lifecycle for new root stories, semantic idempotency, and the typed pointer-only outbox are implemented. P0-11 remains in progress until authoritative domain RPCs and narrow client visibility endpoints capture the approved events, outbox delivery/reconciliation is operated, aggregate queries/dashboards/alerts exist, real Postgres concurrency/RLS/retention/cascade behavior is verified, ownership/on-call is named, and live data proves the release metrics without sensitive leakage. P0-14 still needs the user-facing save/delete authorities; the lifecycle here supplies their new-session discovery and cascade substrate but does not invent those product actions or backfill legacy sessions.
