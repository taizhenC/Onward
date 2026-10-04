# Final independent draft importer audit

**PASS** for the repaired helper's operational safeguards at SHA-256 85e6acec34014cea205c53d1e3f477b50e2e62677eacf255aa909cfd82deed8a. All 43 exact-source-derived offline probes passed. The original two failed findings and intermediate 27-case repair report are retained unchanged under their original source hashes.

Recorded 2026-10-04T00:28:24.583Z. This is a code and synthetic write-path audit; the top-level importer, evolving authored candidates, environment files and live services were not executed or read.

## Repairs verified

Snapshots now include StorySpec created_at, published_at and retired_at. Existing target drafts require a creation timestamp and null publication/retirement timestamps. Desired target comparison excludes only those database-owned lifecycle fields, while preservation compares complete original rows including all three lifecycle values. Postflight rejects lifecycle-only changes and newly inserted drafts with nonnull publication/retirement values.

The first DB-BEFORE.json is created with exclusive wx mode. Exact retry leaves its bytes unchanged. Its candidate/stage input pins and canonical snapshot hashes are checked before inserts. Each attempt writes a distinct exclusive timestamp-plus-UUID baseline, and the final receipt pins both first and attempt baseline paths and exact byte SHA-256 values. Collision or changed input/hash fails before a mock insert.

Before any insert, current rows are compared to every initial baseline row and the whole unrelated catalog is compared to the first snapshot. Between-attempt lifecycle and core edits, added unrelated rows or missing original rows fail closed before writes. After insertion, both the current attempt's rows and the first baseline's rows must remain unchanged.

The operation still inserts only absent rows with ignoreDuplicates, in figures → stages → StorySpecs foreign-key order. Stage status is omitted so the database draft default applies, and persisted specs retain the original empty review. Simulated publication reviews remain memory-only. Exact recovery from a stage or spec insert failure succeeds with the first baseline preserved; conflicting/published targets and saved reviews are rejected before writes.

An installed source proposal now permits repeat offline verification only when exactly one full structured stage equals the frozen stage input. Absent/exact proposals pass; differing content or duplicate stages fail. This does not approve or publish any story.

## Actual probe evidence and scope

DRAFT-IMPORT-PRESERVATION-FINAL-MOCK-PROBES.json records 43/43 passes, including the original red cases, lifecycle null guards, complete baseline SHA/path pins, between-attempt drift, baseline hash tamper, exclusive collision, wrong host, exact partial-failure recovery and installed-stage guards. The JSON audit records content hashes of all three retained earlier receipts. No candidate prose, real SDK network response or production schema response was evaluated by these mock cases.

The importer still makes three separate table writes rather than one cross-table transaction. Root must keep this curated editing window serialized and use final independently reviewed input hashes. Baseline self-consistency does not authenticate against an actor who can replace a file and recompute its hash; preserve the original files and externally recorded receipt hashes. Final live readback and production publication remain separate root steps.

No authored source/Git mutation, real environment-file read, database/Auth/provider call or top-level helper execution occurred in this audit.
