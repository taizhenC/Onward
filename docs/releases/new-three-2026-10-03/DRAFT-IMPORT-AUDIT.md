# Independent draft importer audit

**BLOCK pending two small preservation/evidence repairs.** The new three-story helper retains the prior importer's safe insert-only scope, but its current preservation receipt does not observe StorySpec lifecycle timestamps and its retry overwrites the initial baseline. These are concrete inherited audit gaps; neither finding alleges a direct update or publication call.

Recorded 2026-10-04T00:22:14.738Z. Audited helper SHA-256: e72467a8d3d9127c20244ce5f2a9fd75c753f1322d046e4eb6c80f59025e6798. Prior ten-story helper SHA-256: 28ec7bd217ac9e3f0c6215f44245e1ce5ba5872af5022c8500a6171a2cc7eb36.

## Write boundary verified

The adapter accepts only default offline mode or one exact --write argument and requires exactly franklin_b, slocum_j and somerville_m. Candidates must be draft version1 with empty review. It rejects existing source-library figure keys and validates exact candidate/stage identity, completion-document byte pins, all seven canonical passages, strict StorySpec constraints, 700-950 words, adult episode ages, sentence rhythm, dark-passage size, actual composed chunk boundaries, content hash and replay. The temporary published simulation uses clearly marked placeholder review IDs only in memory; desired persisted specs are built from the original empty-review draft.

Live inserts are limited to absent figures, their exact stages and their exact StorySpecs, in that foreign-key order. Every SDK upsert uses ignoreDuplicates=true. The installed PostgrestQueryBuilder source confirms this sets resolution=ignore-duplicates rather than merge/update behavior. Stage status is omitted, defaultToNull=false requests missing=default, and current migrations0005/0023 specify database-owned draft stage status. StorySpec insert explicitly persists draft. There is no direct stage status mutation, existing-target content refresh, publication RPC, retirement, delete, session/Auth access or provider invocation.

Preflight allows existing targets only if their selected business values equal the exact draft input. Conflicting identities, published stages/specs, nonempty saved review, another stage or another spec version are rejected. Postflight verifies complete expected core rows, all preexisting selected core rows, unrelated curated contents and exact three-target counts.

## Concrete findings before a live write

1. **Lifecycle preservation is unobserved.** snapshot() omits story_specs.created_at, published_at and retired_at. An exact-source-derived synthetic mutation of a preexisting created_at passes the current postflight and emits a success receipt. Add these columns; project business fields for desired-target matching, compare complete preexisting rows including lifecycle values, and require new drafts to have a creation timestamp plus null publication/retirement timestamps.
2. **Retry replaces the original baseline.** Every live attempt uses an ordinary write to the same DB-BEFORE.json filename. A two-run exact-source-derived mock proves that retry replaces the first baseline with one containing the inserted target drafts. Use a unique exclusive file per attempt and bind the final receipt to that exact baseline filename and byte SHA-256. Preserve earlier attempts; fail before inserts on any exclusive-create collision.

These repairs can remain limited to this helper and its receipt fields. Do not alter any existing curated input, status, publication authority or historical evidence. Recheck the repaired helper before root performs the live insert.

## Actual offline probes and limits

DRAFT-IMPORT-MOCK-PROBES.json records eleven source-derived tests: nine pass and the two findings above fail. The harness extracts the helper's exact database-path source, transpiles it and runs it only with synthetic in-memory database and filesystem stubs. Passing probes include fresh insert order, exact draft retry, six different existing-target conflicts rejected before any mock upsert, and detection of an unrelated core change. The top-level helper and evolving candidates were not executed or read; actual environment-file reads, network/database/Auth/provider calls and source/git mutations were all zero.

The adapter performs three separate write requests and two three-table read groups, so this is not an atomic cross-table transaction. A partial insertion may leave only drafts and supports exact recovery. Root must keep this batch's curated editing window serialized, use the final independently reviewed byte pins and retain each attempt's evidence. Postflight detects observed unrelated changes but cannot itself prevent another operator from changing or publishing a target between requests. This boundary is explicit; no fictitious transaction or publication approval is claimed.
