# Executive Summary

## Executive conclusion

Onward has a compelling product core and a defensible emotional position: it is neither advice content nor an AI therapist. It uses true, sourced lives to give someone in a hard season a sense of human precedent. The best version feels like a small book selected and quietly written for one reader.

The current codebase is a credible concept MVP, not yet a viable public product. It has strong foundations—50 curated historical episodes, anonymous-first private sessions, deterministic crisis interception, rate limits, an evaluated matcher, source lists, and a restrained seven-beat reader—but the delivered story is still mostly static. In real-provider mode, AI selects the figure and writes a short eyebrow; `streamBeat` still serves the hand-authored beat text, and the bridge inserts the user's disclosure verbatim. The system therefore personalizes **selection**, not the story itself.

That distinction explains the reported quality problem. A high top-1 score can coexist with a story that feels generic, emotionally overconfident, historically dramatized, or awkwardly presented. The next stage should build and validate an end-to-end **resonance system**, not simply add a more creative model.

## What the app currently does

The repository implements the following product loop:

1. A landing page positions Onward as “a companion for hard seasons” and previews the reading interaction.
2. A user enters age (13–100) and 10–1,000 characters about what is happening.
3. A deterministic regex checks for crisis language before rate limiting, persistence, embeddings, or LLM use.
4. The matcher age-gates the 50 curated figure stages, retrieves a shortlist, and uses an LLM reranker—or a keyword fallback—to select one episode.
5. A private session stores the match, disclosure, recipe versions, generated eyebrow, and reading position.
6. The reader presents a universal preface and then streams a seven-part linear arc: scene, dark moment, response, struggle, turning point, what the person became, and a bridge to the user.
7. The subject's name is withheld until the final bridge.
8. Anonymous users can read without a login wall; after the story, they may attach an email/password and keep stories in a private library.
9. Guest sessions expire after roughly six hours of inactivity; raw disclosures are nulled after 60 days.

## Product foundations worth preserving

| Foundation | Evidence in the code | Product value |
|---|---|---|
| Stage-based matching | A retrievable unit is one emotional episode, not a famous person's entire life. | Enables specificity and prevents generic “celebrity inspiration.” |
| Curated historical library | 50 seven-beat figure stages carry biography, themes, facets, sources, and source notes. | Creates an editorial moat and a reliable fallback. |
| Anti-echo retrieval discipline | Embedded shape/facet surfaces are kept separate from rerank-only biographical facts. | Reduces confirmation bias in the matcher. |
| Anonymous-first privacy | Supabase anonymous auth, owned sessions, no raw-IP storage, default-deny data access, and retention jobs. | Reduces the cost of being honest in the intake. |
| Safety-before-generation | Crisis detection runs before persistence, rate limits, embeddings, or LLM calls. | Establishes a necessary safety floor for a vulnerable audience. |
| Calm reader model | Single-column typography, chunked passages, reduced-motion handling, delayed name reveal, and no chat UI. | Supports reflection instead of gamification. |
| Reproducible recipe metadata | Sessions retain matcher/model/config identifiers. | Provides a basis for auditing and controlled rollout. |
| Offline development path | Memory persistence and stub providers support deterministic smoke tests. | Keeps development fast and provider-independent. |

## Core product features deduced from the repository

- Personalized intake centered on age and emotional disclosure.
- Safety interception for self-harm or suicide-related language.
- Historical-episode retrieval and LLM reranking.
- A curated, source-aware library of real lives.
- A slow, linear, chapter-like story reader with progressive reveal.
- A final identity reveal and bridge back to the reader.
- Anonymous-first private use, optional account upgrade, and saved-story library.
- Provider fallbacks, rate limits, retention, and private-session ownership.
- Offline matching evaluations, figure validation, and smoke coverage.

## Unique value proposition

> **A true story selected for the emotional shape and age of a person's present moment, told with the intimacy of a small book rather than the voice of a chatbot.**

The differentiation is not “AI-generated stories.” Generative storytelling alone is easy to copy and dangerous to trust. The durable value comes from five things working together:

1. **Specific human precedent:** one documented episode, not generic inspiration.
2. **Age-aware emotional fit:** the person's stage of life matters, but emotional shape leads.
3. **Editorial truth:** sourced biography and explicit distinction between fact and interpretation.
4. **Narrative restraint:** no advice, diagnosis, optimization language, chat bubbles, or false promises.
5. **Private immediacy:** a user can be honest and receive something meaningful without first creating a public identity.

## Mission

**Help people in hard seasons feel less alone and recover a sense of possibility through truthful stories of people who once stood in a comparable human moment.**

Onward should not promise that every problem resolves, that suffering creates greatness, or that a historical life predicts the user's outcome. Its mission is companionship through precedent: “someone has stood near this shape before,” not “everything will work out.”

## Overarching direction

The next major stage should move from a **matched static story MVP** to a **validated, personalized story companion**.

The strategic unit is a quality loop:

`Resonance = Match fit × Factual fidelity × Narrative quality × Presentation × Trust`

This is intentionally multiplicative. A severe failure in any one factor can invalidate the experience:

- The right prose about the wrong figure feels uncanny.
- A relatable but unsupported historical detail breaks the “true story” promise.
- An accurate but generic story feels like a biography summary.
- A strong story in a frustrating reader will not be completed.
- Any privacy or safety breach is disproportionate because the intake is intimate.

The architecture and roadmap should therefore favor a hybrid composition system: verified editorial facts and a canonical arc form the immutable spine; bounded AI personalizes only approved surfaces; deterministic and model-assisted validators gate the result; the canonical story remains the fallback.

## Target audience

### Primary target audience

**Digitally comfortable teens and adults, weighted toward ages 15–35, experiencing a non-acute hard season and seeking recognition rather than instructions.**

Likely moments include:

- rejection, failure, or creative discouragement;
- loneliness after a move or social rupture;
- identity uncertainty and feeling behind peers;
- early-career setbacks, burnout, or being underestimated;
- grief, heartbreak, shame, disability, or a major life pivot;
- being constrained by family, convention, discrimination, or circumstances.

This audience is likely to reject generic wellness advice, public posting, overly cheerful reassurance, and chatbot role-play. They may accept a quiet five-to-ten-minute reading experience when they would not seek coaching or therapy in that moment.

The repository supports this deduction: the library is explicitly weighted toward ages 15–30, the minimum intake age is 13, marketing examples center on exams, moving, identity, and feeling behind, and the product language repeatedly says it is for “hurting people.”

### Secondary target audience

- Adults in midlife or later-life transition, supported by a smaller set of older-stage stories.
- Readers who are already in therapy or receiving support and want reflective material between conversations.
- Friends, caregivers, educators, or counselors who may recommend Onward as a non-clinical reflection tool, provided positioning and safeguarding are clear.

### Explicitly not the target use case

- Immediate crisis response or emergency support.
- Diagnosis, treatment, therapy, or medical advice.
- Users seeking historically exhaustive biography or academic research.
- Social comparison, achievement coaching, or “suffering guarantees success” motivation.

Because the current product admits users from age 13, youth-specific safety, privacy, content, and market-policy review is a public-release gate—not an assumption to leave implicit.

## Current maturity assessment

| Dimension | Assessment | Evidence and implication |
|---|---|---|
| Product thesis | **Promising** | The loop and tone are unusually coherent. The app knows what it does not want to be. |
| Content library | **Strong MVP foundation** | 50 stages and 350 beats pass structural/editorial validation, but claim-level provenance is not machine-enforced. |
| Matching | **Promising but narrowly validated** | The latest stored real run reports 98.0% top-1 on 101 labeled non-miss cases, but the set is editorially authored and does not prove real-user resonance. |
| Story personalization | **Insufficient** | Figure selection and an eyebrow are personalized; story beats are static and the bridge quotes the disclosure verbatim. |
| Factual integrity | **Editorial, not runtime-enforced** | Sources and notes exist, but facts are stored as prose blobs and generated claims cannot be mapped to atomic evidence. |
| Reader UX | **Conceptually right, operationally rough** | Calm typography and chunking are present, but pacing, visible controls, resume semantics, end-state trust, and screen consistency need work. |
| Safety | **Good floor, incomplete system** | Crisis input is intercepted and not persisted, but coverage is regex-only, static resources are broad, and no safety regression corpus is implemented. |
| Privacy/security | **Thoughtful MVP posture** | Ownership, data-plane separation, salted IP hashes, and retention exist; derived personalized content and user deletion semantics are not yet defined. |
| Observability/learning | **Not viable for public iteration** | There is no privacy-safe product telemetry or resonance feedback loop. |
| Release engineering | **Incomplete** | Typecheck, figure validation, and smoke pass; lint opens an interactive setup prompt, and the review build did not finish within two minutes. |

## Most important code-level findings

1. **The story engine is still static.** `lib/llm.ts` explicitly re-exports `streamBeat` from the stub in every provider mode. The real LLM writes only the rerank decision and opening eyebrow.
2. **The final bridge echoes raw disclosure.** `lib/llm-stub.ts` replaces `{feeling}` with `session.feeling`, and the canonical bridge templates include `You wrote: "{feeling}"`. This can feel mechanical, expose sensitive text on screen, and undermine “shape, not exact identity” matching.
3. **Reading progress advances before user intent.** `StoryBeat` acknowledges and advances the server position immediately after the network stream ends, not when the user presses Continue. Refreshing while reading can skip the current passage.
4. **Match confidence is computed but effectively hidden.** `Session.framing` is stored as definitive/partial, but the reader receives only the generated eyebrow and outline. A weak match is therefore still presented as if it were close.
5. **The latest retrieval evidence and deployment docs conflict.** The 50-figure update and stored run say keyword retrieval is currently stronger (98.0% vs. 95.0% for FacetsRAG), while the README still calls FacetsRAG the winner and instructs deployment with `RETRIEVAL_MODE=auto`, which can activate the weaker path.
6. **There is no outcome feedback or production telemetry.** The system cannot measure whether a match felt close, a story was completed, a source note was opened, or a fallback occurred.
7. **Source provenance is not claim-addressable.** A stage has a biography string, broad source strings, optional per-beat notes, and prose. There is no immutable fact ID or exact source span to validate generated claims against.
8. **The content validator is structural, not semantic.** It proves 50 stages have the right seven-beat shape and basic style constraints; it does not prove all statements are supported or that final bridges avoid harmful overclaiming.
9. **The safety suite is incomplete.** Smoke shows expected false positives for negated and third-person crisis language, but the planned crisis regression corpus and fail-the-build evaluation do not exist.
10. **The release pipeline has gaps.** `npm run typecheck`, `npm run check-figure`, and `npm run smoke` pass. `npm run lint` is interactive because ESLint is not configured, and `npm run build` timed out during this review without reaching a result.

## Strategic guardrails

- Do not market Onward as therapy, crisis care, diagnosis, or an outcome predictor.
- Do not let an LLM generate unconstrained historical facts or quotes.
- Do not equate “the figure succeeded later” with “the user's pain is useful” or “success will follow.”
- Do not expose a weak match as exact; uncertainty must be visible and recoverable.
- Do not optimize engagement through streaks, infinite feeds, urgency, or emotionally manipulative notifications.
- Do not add community sharing before private-story controls and derived-data retention are mature.
- Do not scale retrieval infrastructure merely because it is sophisticated. Promote a challenger only when it beats the current production recipe on a held-out, real-world benchmark.

## Public-release definition

Onward reaches its next major stage when a new user can:

1. understand the promise and privacy posture;
2. describe a hard moment without unnecessary friction;
3. receive either a demonstrably close match or an honest clarification/no-close-match path;
4. read a stable, accessible, source-grounded story personalized without verbatim echo;
5. see what is documented and what is interpretive;
6. provide low-friction resonance feedback or try another story;
7. save or delete the story with clear retention semantics; and
8. complete the flow under measured reliability, latency, safety, and factuality thresholds.
