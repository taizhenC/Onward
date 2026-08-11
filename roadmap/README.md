# Onward: MVP-to-Public-Release Roadmap

**Prepared:** July 9, 2026  
**Perspective:** Senior Product Management and Lead Technical Architecture  
**Scope:** Repository-based assessment and roadmap for the next viable public release

> **Current execution scope (August 10, 2026):** the
> [controlled public beta release contract](./controlled_public_beta.md) is
> authoritative. The 43-item roadmap remains a long-term product reference; it
> is not a commitment to finish every item before the beta.

## Purpose

This roadmap treats Onward as the barebones MVP described in the brief: a product built to prove one loop—user disclosure → matched historical story → a moment of recognition. The repository already contains meaningful deployment, privacy, content, and matching foundations, but the public-release product has not yet proved the outcome that matters: that a real user reliably receives a true, personally resonant story in a calm, trustworthy reading experience.

The roadmap therefore prioritizes end-to-end story quality and presentation over breadth, social mechanics, or premature platform expansion.

The long-term backlog contains **43 items: 17 P0, 18 P1, and 8 P2**. The beta
contract intentionally narrows that plan to the core story loop, safety, trust,
accessibility, and production operations.

## Documents

1. [Controlled public beta release contract](./controlled_public_beta.md) — the
   current finish line, required external gates, explicit deferrals, and stop
   rule.
2. [Executive summary](./executive_summary.md) — product thesis, current capabilities, unique value proposition, mission, direction, target audience, and strategic diagnosis.
3. [Feature roadmap](./feature_roadmap.md) — the complete long-term P0/P1/P2 backlog. Every proposed item has exactly one priority and one required type tag.
4. [Technical architecture](./technical_architecture.md) — current-state review, target story-composition pipeline, data model, service boundaries, privacy model, and refactor rationale.
5. [Release and measurement plan](./release_and_measurement.md) — broad-release sequence, quality gates, metrics, rollout, ownership, dependencies, and risks.
6. [Implementation status](./implementation_status.md) — evidence ledger for all 43 long-term items; it is no longer the current execution scope.
7. [Story-quality benchmark protocol](./story_quality_benchmark.md) — consented blind-holdout design, independent review contract, privacy boundary, broad-release thresholds, and custodian attestation requirements.

## Priority and tag contract

Priorities are strict and mutually exclusive:

- **P0 — Critical:** required before opening the product to the public.
- **P1 — High Priority:** a fast-follow or high-value capability that is not a launch blocker.
- **P2 — Low Priority:** a future consideration or nice-to-have.

Every backlog item uses exactly one of the requested tags:

- `[Feature]`
- `[Bug Fix]`
- `[Refactor]`
- `[UI/UX]`

## Recommended release thesis

Do not launch “an AI story generator.” Launch a **trusted historical-story companion** whose AI is constrained by an editorially verified spine.

The public-release promise should be:

> Tell Onward what you are carrying. It will find a documented human parallel, tell that episode with care, and return to you without pretending the two lives are identical.

The release is ready only when the complete experience—not merely top-1 figure selection—passes factuality, resonance, safety, privacy, reliability, and reading-experience gates.
