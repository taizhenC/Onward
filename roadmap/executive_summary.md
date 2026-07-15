# Executive Summary

**Status date:** July 14, 2026
**Authoritative delivery ledger:** [`implementation_status.md`](implementation_status.md)

## Executive conclusion

Onward has a compelling product core and a defensible emotional position: it is
neither advice content nor an AI therapist. It uses truthful, sourced episodes
from real lives to give someone in a hard season a sense of human precedent.
The best version feels like a small book selected and quietly shaped for one
reader, not a chatbot impersonating intimacy.

The stacked codebase has moved well beyond the original barebones MVP. It now
has evidence-addressable story contracts, bounded personalization, honest weak-
match recovery, story limits, source transparency, explicit progress writes,
resonance feedback, one controlled alternate-story recovery, and a privacy-safe
telemetry lifecycle with initial match-journey, durable reader-progress,
bounded-feedback, alternate demand/match/artifact/terminal producers, and a
privacy-safe landing-to-intake funnel. Those are meaningful product and
architecture advances.

It is still **not a viable public release**. The current fifty-figure StorySpecs
are review drafts rather than a researcher-approved launch set; end-to-end
relatability has not been validated with target readers; telemetry dispatch,
dashboards, and alerts are not operating; browser accessibility and
critical-flow evidence remain incomplete; and the configured Supabase project
does not yet contain migrations `0004` through `0016`. Local green checks do not
substitute for those editorial, safety, user-research, and production gates.

## What the product does

The current product loop is:

1. A reader enters their age, a short description of what they are going
   through, and optional topic/detail boundaries.
2. Deterministic crisis detection runs before authentication, persistence,
   rate limiting, retrieval, or any model call and returns reviewed resources.
3. For non-crisis input, Onward retrieves from fifty curated historical
   episodes and reranks candidates. Production is pinned to the currently
   approved keyword-retrieval recipe; FacetsRAG remains a challenger.
4. Match confidence becomes an honest product disposition: close match,
   adjacent match, one bounded clarification, or no close match.
5. A governed `ResonanceBrief` and hybrid composer may select only approved
   connective templates. Canonical facts and beats remain immutable, validators
   reject unsafe output, and the canonical artifact is the fallback.
6. The reader presents one immutable seven-beat story in paced chunks, keeps the
   subject's identity until the final bridge, and advances progress only on an
   explicit Continue or Finish action.
7. The completed story exposes why it was selected, its evidence and sources,
   one closed resonance question, and—after a rejection—one owner-bound attempt
   to find a different, clearly partial story.
8. Anonymous readers can use the product without a login wall and may later
   attach an email/password to keep owned stories in a private library.

## Core features and product value

| Capability | Product value |
|---|---|
| Stage-based matching | Matches one emotional episode rather than flattening a famous person's whole life into inspiration. |
| Curated fifty-stage library | Provides an editorial moat, truthful canonical fallback, and meaningful age coverage. |
| Honest match recovery | Allows uncertainty, one clarification, and no-close-match outcomes instead of presenting every result as exact. |
| Evidence-addressable `StorySpec` and immutable `StoryArtifact` | Makes replay deterministic and historical claims inspectable. |
| Bounded hybrid composition | Improves emotional fit without granting a model permission to invent facts or free-write the life. |
| Story intensity and topic boundaries | Gives a hurting reader control before retrieval and composition. |
| Quiet chunked reader | Supports reflection through book-like pacing rather than chat or engagement mechanics. |
| Source transparency and reporting | Lets a reader inspect the “true story” promise and flag a historical concern. |
| Resonance feedback and one alternate | Gives readers a recovery path and creates a closed, privacy-safe learning signal. |
| Anonymous-first ownership and retention | Reduces the cost of being honest while keeping sessions private and time-bounded. |
| Crisis-first safety boundary | Keeps emergency support independent of cookies, rate limits, database state, and providers. |
| Typed telemetry lifecycle and authoritative producers | Captures closed entry/auth/intake/match/recovery/artifact/reader/feedback/alternate milestones without storing disclosure, prompts, prose, miss reasons, or open-ended analytics payloads. |

## Unique value proposition

> **A true story selected for the emotional shape and age of a person's present
> moment, told with the intimacy of a small book and the restraint of an
> evidence-bound system.**

The differentiation is not “AI-generated stories.” Generative prose alone is
easy to copy and unsafe to trust. Onward's durable value comes from five things
working together:

1. **Specific human precedent:** one documented episode, not generic motivation.
2. **Age-aware emotional fit:** life stage matters, while emotional shape leads.
3. **Editorial truth:** facts, interpretations, quotes, and sources have explicit boundaries.
4. **Narrative restraint:** no diagnosis, prescription, false equivalence, or guaranteed outcome.
5. **Private immediacy:** a reader can be honest without first creating a public identity.

## Mission

**Help people in hard seasons feel less alone and recover a sense of possibility
through truthful stories of people who once stood in a comparable human
moment.**

Onward must not promise that every problem resolves, that suffering creates
greatness, or that a historical life predicts the reader's outcome. Its mission
is companionship through precedent: “someone has stood near this shape before,”
not “everything will work out.”

## Overarching direction

The next major stage is a **validated, personalized story companion**. Progress
should be judged as a multiplicative quality system:

`Resonance = Match fit × Factual fidelity × Narrative quality × Presentation × Trust`

A severe failure in any factor invalidates the experience. The roadmap should
therefore continue to favor verified editorial facts and canonical arcs as the
immutable spine, bounded AI only on approved surfaces, deterministic validation,
honest fallback, and direct evidence from target readers before promotion.

## Target audience

### Primary target audience

Digitally comfortable teens and adults, weighted toward ages 15–35, who are in
a non-acute hard season and want recognition rather than instructions.

Likely moments include rejection, loneliness, identity uncertainty, feeling
behind peers, early-career setbacks, burnout, grief, heartbreak, shame,
disability, discrimination, and major life pivots. This audience is likely to
reject generic wellness advice, public posting, forced cheerfulness, and
chatbot role-play, but may accept a quiet five-to-ten-minute reading experience.

### Secondary target audience

- Adults in midlife or later-life transition, supported by a smaller set of older-stage stories.
- Readers already receiving professional support who want non-clinical reflective material.
- Friends, caregivers, educators, or counselors who may recommend Onward once safeguarding and positioning are independently reviewed.

### Explicitly outside the target use case

- Emergency response, crisis care, diagnosis, treatment, therapy, or medical advice.
- Historically exhaustive biography or academic research.
- Achievement coaching, social comparison, or “suffering guarantees success” motivation.

Because intake begins at age thirteen, youth-specific privacy, content, safety,
and market-policy review is a public-release gate, not an implementation detail.

## Current maturity assessment

| Dimension | Current assessment | What remains before public release |
|---|---|---|
| Product thesis | Strong and differentiated | Validate usefulness, trust, and non-harm with target readers. |
| Content and factual integrity | Strong architecture, incomplete launch content | Research, review, and publish a real launch StorySpec subset with exact evidence. |
| Matching | Promising but editorially benchmarked | Run a consented blind holdout and calibrate confidence/clarification with real disclosures. |
| Personalization | Safely bounded, deliberately narrow | Prove the hybrid recipe improves relatability and tone without factual or privacy regression. |
| Reader UX | Materially improved, not fully proven | Complete browser, keyboard, screen-reader, zoom, mobile, refresh, back, offline, and multi-tab evidence. |
| Safety | Deterministic gate and CI corpus exist | Obtain qualified safety review, launch-market approval, and an explicit over-trigger policy. |
| Privacy | Strong ownership/retention foundations | Ship user-facing story/account deletion and consent controls; prove all cascades and cron behavior on real Postgres. |
| Observability | Contract, lifecycle, outbox, entry funnel, flow-bound anonymous-auth, server-owned story journey, and reader-visibility producers exist | Add the sanitized failure producer; operate a privacy-reviewed sink; and build minimum-cell dashboards and alerts. |
| Release engineering | Local CI and production build are green | Apply and exercise migrations in staging/production, verify RLS/concurrency/rollback, and collect remote canary evidence. |

## Public-release definition

A public release requires more than merged roadmap branches. It requires:

- a reviewed and publishable launch story set;
- an end-to-end story-quality gate with target-reader evidence;
- zero critical safety false negatives plus qualified market review;
- complete critical-flow browser and accessibility evidence;
- real-database migration, RLS, lease, cascade, cron, and rollback proof;
- operating privacy-safe metrics, alerts, and incident ownership; and
- user-visible deletion, consent, retention, and account controls.

Until those gates are satisfied, the honest product stage is a development or
private-alpha stack—not a public-ready release.
