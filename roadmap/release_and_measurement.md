# Release and Measurement Plan

## Release objective

Move Onward from a concept MVP to a controlled public release that proves this outcome:

> A person can disclose a difficult moment, receive a true historical episode that feels meaningfully close, finish it in a calm reader, and leave with more felt companionship—without the product overstating similarity, inventing history, or mishandling intimate data.

This plan assumes one focused product squad:

- one product manager/research lead;
- one product designer with research/accessibility capability;
- two to three full-stack/backend engineers, including one AI/platform owner;
- one editorial/research lead plus contract historical review capacity;
- fractional data/evaluation, safety, privacy/legal, and QA support.

The sequence is an execution model, not a calendar commitment. With fewer people, preserve the order and gates rather than compressing scope by removing validation.

## North-star metric

### Resonant Story Completion Rate

```text
sessions that finish the final bridge AND report that the story felt close
----------------------------------------------------------------------------
eligible non-crisis story sessions created
```

Why this metric:

- Completion alone can reward suspense or slow UI without proving relevance.
- Positive feedback alone is subject to responder bias.
- Match top-1 does not measure the delivered narrative.
- The combined metric reflects the complete product loop.

Track completion and feedback response rate separately so the team can interpret the north star honestly. Do not infer a positive rating from silence.

## Metric framework

### Product outcome metrics

| Metric | Definition | Decision it supports |
|---|---|---|
| Resonant Story Completion Rate | North-star definition above | Is the complete experience working? |
| Story completion rate | Final bridge acknowledged / story artifacts created | Do readers reach the intended emotional landing? |
| “Felt close” rate | Positive close rating / feedback responses | Did selection and emphasis match what the user meant? |
| Try-another rate | Another-story requests / first stories | How often is first-match recovery needed? |
| Save rate | Stories saved / completed guest stories | Is the artifact worth keeping? |
| Return-to-saved rate | Saved stories reopened after seven or more days / saved stories | Does the story retain value? |
| Source-open rate | Source drawer opened / completed stories | Does transparent provenance add trust? Interpret cautiously. |
| Carry-forward creation rate | Private Carry-Forward Cards / completed stories | Does the experience create durable, self-directed utility? |
| Short-to-full expansion rate | Short editions expanded into full stories / short editions started | Does flexible length lead into deeper engagement? |

### Story-engine metrics

| Metric | Definition | Guardrail |
|---|---|---|
| Match acceptance | High/medium calibrated matches / matching attempts | Low confidence must trigger clarification or honest adjacency. |
| Clarification yield | Uncertain matches promoted to acceptable after one question | Clarification must provide value without becoming interrogation. |
| No-close-match rate | Attempts still low-confidence after clarification | Drives library coverage work. It is not automatically a system failure. |
| First-pass validation rate | Artifacts passing all gates without retry / generated artifacts | Tracks composer stability. |
| Canonical fallback rate | Canonical fallback artifacts / created artifacts | Reliability is good; a rising rate signals model/prompt/spec issues. |
| Unsupported-claim rate | Unsupported factual claims / audited factual claims | Critical truth guardrail. |
| Critical tone-failure rate | Stories with diagnosis, false promise, trauma equivalence, or harmful advice / audited stories | Must remain zero in the release benchmark. |
| Recipe-specific resonance | “Felt close” and completion segmented by approved recipe | Supports controlled promotion/rollback. |

### Experience and reliability metrics

| Metric | Definition | Notes |
|---|---|---|
| Intake abandonment | Intake starts without valid submit | Segment only by safe device/flow buckets. |
| Time to first readable content | Intake submit to preface/story readiness | Report the closed latency-bucket distribution and threshold compliance; do not infer unsupported percentile precision. |
| Passage load latency | Continue to next stored passage displayed | Excludes optional local reveal animation. |
| Resume correctness | Sessions returning to last acknowledged passage | Verified by tests and sampled safe state transitions. |
| Story creation error rate | Creation attempts ending without artifact or reviewed safety state | Canonical fallback should keep this very low. |
| Availability | Successful eligible story flows / attempts | Separate auth, match, compose, and reader failure domains. |
| Cost per completed story | Provider + infrastructure cost / completed stories | Optimize after quality is stable. |

### Safety, privacy, and trust metrics

| Metric | Definition | Policy |
|---|---|---|
| Critical safety false negatives | Missed critical cases in the synthetic/reviewed corpus | Zero tolerance for promotion. |
| Crisis persistence violations | Crisis intercepts creating a session, provider call, or stored disclosure | Zero tolerance. |
| Disclosure leakage incidents | Raw/derived sensitive language reaching forbidden logs/events/surfaces | Zero tolerance. |
| Deletion completion | User deletion requests fully cascaded within the stated window | Must match published policy. |
| Content reports | Reports by fact ID and reason | Each has triage SLA and stage kill switch. |
| Fallback transparency | Adjacent/canonical fallback correctly framed / applicable sessions | Must be 100% in tests and audit. |
| Boundary compliance | Artifacts and fallbacks satisfying explicit topic/intensity constraints / constrained sessions | Must be 100%; record compliance, not selected topic values. |

## Preliminary public-release gates

These are proposed go/no-go thresholds. Establish the baseline during private alpha, approve any threshold revision before closed beta, and do not lower thresholds after seeing launch-candidate results.

### Story quality gate

- At least 150 target-audience story sessions in a consented closed beta, with sufficient representation across primary age bands and core situations.
- At least 70% “felt close” among feedback respondents, with feedback response rate reported beside it.
- At least 60% of eligible created artifacts reach the final bridge.
- No critical harmful-tone failures in the blind launch-candidate review.
- No known unsupported person, place, date, amount, direct quote, work, or causal claim in the launch benchmark.
- At least 95% first-pass artifact validation and no more than 5% canonical fallback under normal provider conditions.

### Matching gate

- Current production recipe retains or improves the approved blind holdout result.
- Zero definitive/“close” wrong matches in critical hard-confusion cases.
- 100% detection of labeled no-close-match cases at the approved calibration threshold.
- Any challenger demonstrates improvement on the same holdout and does not regress factuality, latency, cost, calibration, or safety.

### Safety and privacy gate

- Zero critical false negatives in the versioned safety corpus.
- Zero persistence or provider calls for intercepted crisis inputs in integration tests.
- Safety copy/resources reviewed and dated for the launch market.
- Youth/age policy, terms, privacy, content rights, and non-clinical positioning reviewed for the initial market.
- Story deletion, account deletion, guest TTL, disclosure TTL, derived-artifact retention, event pruning, and backup/PITR restore-deletion behavior pass end-to-end tests.
- Privacy schema tests reject every forbidden raw/derived field and provider error object.

### UX and accessibility gate

- No critical usability failures in moderated mobile and desktop testing.
- Every flow works with keyboard only, screen reader, high zoom/reflow, reduced motion, and non-pointer input.
- No interaction requires double click, hover, precise timing, or reading text as it animates.
- Refreshing before Continue returns to the same passage; repeated Continue cannot skip content.
- Final bridge, rationale, sources, feedback, save, and deletion appear in a tested emotional sequence.
- Explicit topic and intensity boundaries are understandable, optional, and honored by first match, alternate match, and fallback.

### Reliability and performance gate

- At least 95% of intake-submit to first-readable measurements fall in the contract's at-or-below-eight-second buckets under beta load; canonical fallback is included.
- At least 95% of stored-passage transitions fall in the at-or-below-500-millisecond buckets, excluding intentional visual transition.
- At least 99.5% successful eligible flow availability during the final beta window.
- Less than 1% of eligible story-creation attempts end without a story artifact or reviewed safety state.
- Provider timeout, invalid output, database transient failure, email failure, and retrieval failure drills have user-safe recovery paths.

### Release engineering gate

- Non-interactive lint, typecheck, tests, safety eval, content validation, privacy tests, story-quality eval, and production build pass in CI.
- Database migration preflight and rollback/forward-fix exercise pass in staging.
- Approved recipe, story-composer, provider, and per-stage kill switches are verified.
- Dashboards and alerts use only the approved safe event schema.
- On-call owner, content incident owner, safety escalation owner, and rollback authority are named.

## Delivery sequence

### Stage 0 — Baseline and release contract (approximately week 1)

**Goal:** Agree on what “good enough to show the public” means before rebuilding the engine.

Work packages:

- **P0-01 [Feature]** Define the end-to-end rubric, benchmark protocol, holdout policy, and preliminary thresholds.
- **P0-11 [Feature]** Define the safe event and trace schema before adding analytics calls.
- **P0-13 [Bug Fix]** Pin production to the approved keyword recipe and remove `auto` from public deployment.
- **P0-14 [Feature]** Decide retention classes and the meaning of “save this story.”
- **P0-15 [Refactor]** Make lint non-interactive, establish CI, and reproduce/diagnose the production build timeout.

Exit criteria:

- Quality rubric and release scorecard approved.
- One production recipe manifest approved.
- Privacy/retention decision recorded.
- CI baseline is green or every existing failure has an owner and release-blocking issue.

### Stage 1 — Truth and safety foundation (approximately weeks 2–4)

**Goal:** Make the content safe to personalize before generating more prose.

Work packages:

- **P0-02 [Refactor]** Implement `StorySpec`, fact/source records, immutable versions, and publish validation.
- **P0-12 [Bug Fix]** Build the safety corpus, reviewed resource policy, and incident controls.
- **P0-04 [Bug Fix]** Remove raw disclosure interpolation from canonical, runtime, and marketing demo copy.
- **P0-14 [Feature]** Implement story/account deletion foundations and cascade tests.
- **P0-15 [Refactor]** Add content, safety, privacy, and migration checks to CI.

Content strategy:

- Select a launch collection based on coverage and evidence quality; it may be smaller than all 50 stages.
- Convert the launch collection to `StorySpec` first.
- Keep unconverted stages unavailable to personalized composition and public traffic.
- Prefer 20 impeccably supported stories over 50 uneven ones.

Exit criteria:

- Every launch stage has a reviewed, published `StorySpec` and canonical fallback.
- Verbatim disclosure echo is absent.
- Safety and privacy regression suites pass.
- A stage can be disabled or rolled back independently.

### Stage 2 — Resonance and composition engine (approximately weeks 4–8)

**Goal:** Deliver bounded personalization with honest uncertainty.

Work packages:

- **P0-03 [Refactor]** Build `ResonanceBrief`, Story Composer, validators, immutable artifact persistence, retry, and fallback.
- **P0-05 [Feature]** Add calibrated confidence, one-question clarification, adjacent framing, and no-close-match behavior.
- **P0-08 [UI/UX]** Generate evidence-backed “why this story” rationale and source projection.
- **P0-11 [Feature]** Instrument recipe, validation, fallback, latency, and safe error events.
- **P0-13 [Bug Fix]** Record recipe-specific evaluation history without overwriting prior runs.

Exit criteria:

- A synthetic provider outage still returns a complete canonical story.
- Generated artifacts are immutable and replayable.
- No unvalidated text can reach the story API.
- The first end-to-end blind benchmark identifies whether hybrid personalization beats canonical copy.

### Stage 3 — Public-quality experience (approximately weeks 7–10)

**Goal:** Make the story feel as intentional as the underlying concept.

Work packages:

- **P0-06 [UI/UX]** Redesign intake, privacy context, validation, and preparation state.
- **P0-07 [UI/UX]** Rebuild reader pacing, controls, final coda, and failure recovery.
- **P0-09 [Bug Fix]** Implement explicit atomic acknowledgement and resume behavior.
- **P0-10 [Feature]** Add resonance feedback and another-story recovery.
- **P0-16 [UI/UX]** Apply shared design primitives and complete accessibility hardening.
- **P0-14 [Feature]** Finish save consent, derived-data classes, market-specific privacy notice, backup/restore deletion guarantees, and retention UI around the shipped active-database deletion controls.
- **P0-17 [Feature]** Add optional emotional boundaries, reviewed content notes, and hard eligibility enforcement.

Exit criteria:

- All critical journeys pass usability/accessibility review.
- Resume and multi-tab tests pass.
- Feedback, save, source, and deletion flows are coherent and instrumented.
- The account conversion card no longer interrupts the final emotional landing.

### Stage 4 — Private alpha and editorial hardening (approximately weeks 9–11)

**Goal:** Find quality failures with controlled participants before scaling.

Work packages:

- **P0-01 [Feature]** Run moderated sessions and blind reviews; freeze the launch holdout.
- **P0-02 [Refactor]** Repair evidence and canonical prose surfaced by reviews.
- **P0-03 [Refactor]** Tune composition only through versioned recipes.
- **P0-05 [Feature]** Calibrate confidence/clarification from observed mismatch patterns.
- **P0-12 [Bug Fix]** Complete safety tabletop and content incident exercises.
- **P0-15 [Refactor]** Run provider-failure, database-failure, migration, and rollback drills.

Exit criteria:

- No open critical safety, privacy, factuality, or data-loss issue.
- Launch candidate passes offline gates.
- Product thresholds are confirmed or revised before closed beta with written rationale.

### Stage 5 — Closed beta, canary, and public release (approximately weeks 12–14)

**Goal:** Validate under real traffic and expand only when gates remain green.

Rollout:

1. Team/staging with synthetic inputs.
2. Invite-only alpha with consented review participants.
3. Closed beta at a fixed account/session cap.
4. Production canary at approximately 5% of eligible traffic, with canonical composer fallback always available.
5. Expand to approximately 25%, then 50%, then 100% only after a full observation window at each step.

Work packages:

- **P0-01 [Feature]** Compute the final launch scorecard on the frozen holdout and beta data.
- **P0-11 [Feature]** Monitor quality, fallback, latency, errors, cost, and deletion.
- **P0-13 [Bug Fix]** Verify every production session records the approved recipe.
- **P0-15 [Refactor]** Execute go/no-go, rollback, and post-release review.

Automatic pause/rollback conditions:

- any critical safety, privacy, or unsupported historical claim incident;
- material increase in definitive wrong match, generation failure, or canonical fallback rate;
- latency-threshold compliance or availability outside the release budget for a sustained observation window;
- evidence that deletion/retention jobs are not operating as promised;
- unexplained recipe/config drift.

## P1 delivery sequence after public release

P1 starts only after P0 metrics are stable and the team has enough real feedback to identify the limiting factor.

1. **P1-04 [Refactor] Editorial workbench** and **P1-05 [Feature] demand-led coverage** if no-close-match and historical report rates dominate.
2. **P1-01 [Refactor] facet projections** if semantic retrieval misses dominate and the shadow challenger passes.
3. **P1-02 [Feature] reader-controlled emphasis** if the figure is right but story framing feels generic.
4. **P1-03 [Feature] full-beat regeneration** only if bounded personalization plateaus and evidence gates are mature.
5. **P1-10 [Refactor] latency/cost optimization** when metrics identify actual bottlenecks.
6. **P1-11 [Feature] two-perspective matching** when ambiguity—not coverage—is the dominant first-match failure.
7. **P1-12 [Feature] Carry-Forward Cards**, **P1-13 [UI/UX] reading modes**, and **P1-17 [UI/UX] the factual next-step map** when completion is healthy but save/revisit utility is weak.
8. **P1-14 [Feature] private continuity** and **P1-15 [Feature] redacted conversation cards** only after deletion and retention controls are proven.
9. **P1-16 [Feature] outcome-diverse stories** and **P1-18 [Feature] factual afterword lenses** when research shows achievement pressure or missing practical context.
10. **P1-06 [UI/UX] library v2**, **P1-08 [UI/UX] market foundation**, and **P1-09 [Feature] revisit mode** after repeat value and initial-market fit are proven.

## Experiment plan

### Experiment A — Canonical versus hybrid composition

**Hypothesis:** A verified canonical spine with personalized preface, emphasis, transitions, and bridge improves felt closeness without reducing trust.

Variants:

- Control: canonical story with non-echo generic bridge.
- Challenger: hybrid Story Composer artifact.

Primary outcome: “felt close” rate.  
Secondary outcomes: completion, bridge completion, save, critical tone flags.  
Guardrails: unsupported claims, safety, privacy, fallback, latency-threshold compliance, cost.

### Experiment B — Clarification for low-confidence matches

**Hypothesis:** One targeted question improves match acceptance more than it increases intake abandonment.

Population: calibrated uncertain matches only.  
Primary outcome: accepted-match and felt-close lift.  
Guardrails: added time, abandonment, user discomfort, repeated clarification rate.

### Experiment C — Name reveal

**Hypothesis:** Delaying the name reduces fame bias and improves attention to the episode.

Variants:

- Existing final-beat reveal.
- Early identity with the same prose and source treatment.

Primary outcome: completion and felt closeness.  
Guardrails: trust, perceived manipulation, source engagement.

### Experiment D — Passage pacing

**Hypothesis:** Visible “Show full passage” plus explicit Continue improves control and completion over implicit double-click acceleration.

Primary outcome: passage acknowledgement and story completion.  
Guardrails: accidental advances, time to finish, accessibility failures.

### Experiment E — Automatic match versus two-perspective choice

**Hypothesis:** In calibrated ambiguous cases, choosing between two meaningfully different anonymous previews improves felt closeness more than it adds decision burden.

Population: ambiguous top-two cases only.  
Primary outcome: felt-close rate.  
Guardrails: abandonment, time to first story, content-boundary compliance, and choice regret.

### Experiment F — Carry-Forward Card

**Hypothesis:** A private, user-authored takeaway increases save and later revisit value without making the coda feel transactional or prescriptive.

Primary outcome: seven-day revisit among completed stories.  
Guardrails: story completion, deletion comprehension, free-text privacy, and perceived pressure to take action.

### Experiment policy

- Experiments never bypass safety, factuality, privacy, or deletion controls.
- Crisis-intercepted users are not experimentation subjects in the crisis flow.
- Assignment and result events contain no disclosure or semantic tag values.
- Sample size and stopping rules are written before exposure.
- A model/prompt/config change is a new recipe, not an invisible variant.

## Qualitative research plan

Quantitative metrics cannot fully detect whether the prose feels patronizing, exploitative, generic, or emotionally false.

Run moderated research across:

- ages 15–17 with appropriate safeguarding and consent process;
- ages 18–24 and 25–35, the primary likely cohorts;
- selected older adults to test age coverage and copy assumptions;
- users from different cultural backgrounds represented in the figure library;
- users with screen-reader, low-vision, motor, attention, or reading-access needs;
- people who rate the first match close and people who reject it.

Core interview questions:

- What did you think Onward would do before submitting?
- At what point, if any, did the story feel selected for you?
- Did any line claim too much about you or the figure?
- Did the later success feel hopeful, pressuring, or irrelevant?
- Did you believe the story was true? What would make that trust stronger?
- Did you feel in control of pace, privacy, and exit?
- Would you keep or revisit this story? Why?

Researchers should use consented test accounts and an approved handling protocol. Raw disclosures should not be copied into general research repositories.

## Team ownership

| Area | Directly responsible | Required approvers |
|---|---|---|
| Product promise, metrics, prioritization | Product manager | Product/design/editorial leads |
| StorySpec and factual review | Editorial/research lead | Historical reviewer |
| Story Composer and validators | AI/platform engineering lead | Editorial, safety, privacy |
| Matching and calibration | AI/matching engineer | Product/data/editorial |
| Reader/intake/design system | Product designer + frontend lead | Accessibility QA, product |
| Safety gate/resources/incident process | Safety lead | Product, privacy/legal, engineering |
| Privacy model/deletion/retention | Backend lead + privacy owner | Privacy/legal, product |
| Telemetry/evaluation | Data/evaluation owner | Privacy, product |
| CI/deploy/rollback/on-call | Platform/release owner | Engineering lead |

## Risk register

| Risk | Probability | Impact | Mitigation and trigger |
|---|---:|---:|---|
| A generated story invents or overstates history | High without controls | Critical | P0-02/P0-03 evidence gates, canonical fallback, stage kill switch; any critical incident pauses personalized generation. |
| A match feels exact only because the library/eval was authored around expected cases | High | High | P0-01 real-world blind benchmark, clarification/no-match, frozen holdout. |
| “They became great” pressures users or trivializes suffering | Medium | Critical | Tone rubric, bridge constraints, target-user review, zero critical-tone launch gate. |
| Safety regex misses euphemistic crisis language | Medium | Critical | P0-12 reviewed corpus/rules, always-visible resources, incident review; never rely solely on an LLM. |
| Safety regex over-triggers and blocks the intended experience | High today | Medium | Reviewed negation/third-person cases and a deliberately designed post-intercept path. |
| Personalization copies private text into story/logs | High today for story echo | Critical | P0-04, sensitive wrappers, overlap checks, string-hostile telemetry, deletion/retention. |
| Public deployment uses stale or losing retrieval recipe | Medium | High | P0-13 approved manifest, startup assertion, immutable eval history, rollback. |
| Full composition makes intake too slow or expensive | Medium | High | Latency budget, canonical fallback, measure before queue, P1-10 optimization. |
| Content migration overwhelms the team | High | High | Launch with a smaller reviewed collection; prioritize coverage and demand, not all 50. |
| Younger users create compliance/safeguarding exposure | Medium | Critical | Launch-market and youth review, clear minimum-age policy, safety/access controls before public traffic. |
| Story save promise conflicts with disclosure/artifact retention | High unless decided | High | P0-14 explicit contract, retention classes, tested post-TTL experience. |
| Topic boundaries remove every close match | Medium | Medium | P0-17 honest no-close-match recovery; never weaken an explicit boundary. |
| Utility features turn reflection into prescriptive self-help | Medium | High | Keep Carry-Forward user-authored, maps/afterwords factual, and all follow-up features optional after the coda. |
| Account conversion interrupts the story's emotional landing | High today | Medium | P0-07 coda sequence and usability testing. |
| No telemetry makes failures invisible | High today | High | P0-11 before beta, with privacy gates. |
| Premature architecture work delays product learning | Medium | High | Keep modular monolith; add queue/vector infrastructure only after measured thresholds. |

## Baseline verification from this review

Run on July 9, 2026 in the provided workspace:

| Check | Result | Interpretation |
|---|---|---|
| `npm run typecheck` | Passed | TypeScript baseline is healthy. |
| `npm run check-figure` | Passed, 50/50 stages | All 50 stages satisfy the current structural/editorial validator. |
| `npm run smoke` | Passed, 12/12 checks | Core memory/stub loop, ownership, anti-echo projection, chunking, opening-copy guard, rate limit, and crisis no-persistence baseline pass. |
| `npm run lint` | Failed as a release check | It opens an interactive ESLint setup prompt; CI lint is not configured. |
| `npm run build` | Inconclusive | The build began with Next.js 15.5.18 and `.env.local` but did not finish within the 120-second review timeout; reproduce in CI and diagnose before release. |

The existing smoke suite's informational crisis cases show the regex intentionally fires on “I don't want to kill myself,” “I'm not suicidal,” “my friend was suicidal years ago,” and “I won't hurt myself.” This is evidence for P0-12's reviewed context/negation corpus, not a reason to move the safety floor to an opaque model.

## Go/no-go meeting template

The release owner should present one scorecard with:

1. frozen recipe and dataset versions;
2. story quality and factuality results;
3. match calibration and no-close-match results;
4. safety/privacy review status;
5. usability/accessibility status;
6. performance, availability, fallback, and cost;
7. open critical/high issues;
8. stage/provider/retrieval kill-switch test results;
9. retention/deletion job evidence;
10. named owners for incidents and rollback.

The launch is **no-go** if any critical safety, privacy, factuality, deletion, or data-isolation issue is open, even if resonance and completion targets are met.

## First 30 days after public release

### Days 1–7

- Daily review of safe funnel, match, validation, fallback, error, latency, deletion, and content-report dashboards.
- Twice-daily editorial triage for historical concerns.
- No retrieval/model/prompt changes without a new approved recipe and rollback plan.

### Days 8–14

- Review qualitative rejection reasons and no-close-match clusters.
- Identify whether the main constraint is coverage, matching, composition, or presentation.
- Start only the P1 work corresponding to the measured constraint.

### Days 15–30

- Publish an internal launch review comparing predicted versus actual outcomes.
- Re-score a stratified, consent-eligible sample for factuality and tone.
- Confirm guest, disclosure, event, and deletion retention jobs operated as promised.
- Decide whether to expand traffic, library, or markets—or hold and repair quality.

The correct first-month outcome is not maximum user count. It is confidence that Onward can repeatedly create the specific feeling its product promise depends on, without sacrificing truth or trust as usage grows.
