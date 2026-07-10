# Onward: MVP-to-Public-Release Roadmap

**Prepared:** July 9, 2026  
**Perspective:** Senior Product Management and Lead Technical Architecture  
**Scope:** Repository-based assessment and roadmap for the next viable public release

## Purpose

This roadmap treats Onward as the barebones MVP described in the brief: a product built to prove one loop—user disclosure → matched historical story → a moment of recognition. The repository already contains meaningful deployment, privacy, content, and matching foundations, but the public-release product has not yet proved the outcome that matters: that a real user reliably receives a true, personally resonant story in a calm, trustworthy reading experience.

The roadmap therefore prioritizes end-to-end story quality and presentation over breadth, social mechanics, or premature platform expansion.

The prioritized backlog contains **43 items: 17 P0, 18 P1, and 8 P2**. The expanded utility layer adds multiple perspectives, short/full editions, private continuity, carry-forward artifacts, factual afterwords, and safer conversation sharing—without turning the product into chat or a wellness tracker.

## Documents

1. [Executive summary](./executive_summary.md) — product thesis, current capabilities, unique value proposition, mission, direction, target audience, and strategic diagnosis.
2. [Feature roadmap](./feature_roadmap.md) — the complete P0/P1/P2 backlog. Every proposed item has exactly one priority and one required type tag.
3. [Technical architecture](./technical_architecture.md) — current-state review, target story-composition pipeline, data model, service boundaries, privacy model, and refactor rationale.
4. [Release and measurement plan](./release_and_measurement.md) — delivery sequence, quality gates, metrics, rollout, ownership, dependencies, and risks.
5. [Implementation status](./implementation_status.md) — live evidence ledger for all 43 items; an item is complete only when every acceptance criterion is directly verified.

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
