# Onward roadmap

What stands between the current build and a public release, and the contracts
CI enforces along the way.

The long-form planning set written in July 2026 (executive summary, 43-item
feature roadmap, implementation ledger, release and measurement plan) was
condensed on 2026-09-03. Its full text is in git history before that date. The
target architecture it described is kept as a dated design record in
[`docs/design/2026-07-target-architecture.md`](../docs/design/2026-07-target-architecture.md).

## Documents

1. [Controlled public beta release contract](./controlled_public_beta.md) — the
   authoritative execution scope, decided 2026-08-10: the fixed beta scope, the
   launch-critical engineering closure, the seven external gates that still
   block invitations, the explicit deferrals, and the stop rule.
2. [Backlog](./backlog.md) — the 43 long-term items in one table: id, priority,
   type, status as of 2026-08-10, how the beta contract treats each, and what is
   left. It is a reference, not a commitment to finish everything before the
   beta.
3. [Privacy-safe telemetry contract](./telemetry_contract.md) — the hard privacy
   boundary, the event registry, and the producer rules. `check-owner-story-save`
   reads this file in CI, so its wording is load-bearing.
4. [Story-quality benchmark protocol](./story_quality_benchmark.md) — the
   consented blind-holdout design and the promotion thresholds. Story-quality
   evidence hashes this file and `check-story-quality-immutability` protects it,
   so a change means a new protocol version, not an edit.

## Priorities and tags

Priorities are strict and mutually exclusive: **P0** is required before opening
the product to the public, **P1** is a fast-follow that is not a launch blocker,
**P2** is a future consideration. Every item carries exactly one type tag:
`[Feature]`, `[Bug Fix]`, `[Refactor]`, or `[UI/UX]`.

## Release thesis

Do not launch "an AI story generator." Launch a **trusted historical-story
companion** whose AI is constrained by an editorially verified spine:

> Tell Onward what you are carrying. It will find a documented human parallel,
> tell that episode with care, and return to you without pretending the two
> lives are identical.

The release is ready only when the complete experience, not merely top-1 figure
selection, passes the factuality, resonance, safety, privacy, reliability, and
reading-experience gates in the beta contract.
