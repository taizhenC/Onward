# Derived-output retention contract

- Status: Accepted
- Date: 2026-07-26
- Scope: Provider-derived output and the story/context persistence boundary

## Context

Onward already deletes a guest account after its inactivity window, clears the
original disclosure and story-request context after 60 days, retains a
permanent account's generated story until owner deletion, and bounds feedback
and operational records. Those behaviors were distributed across types,
provider adapters, cron jobs, deletion functions, and product copy. They were
not one closed contract.

That left two material failure modes:

1. A future prose, tagger, or embedding path could return a bare value and
   accidentally persist or log unreviewed provider output.
2. A durable session or artifact row did not state which retention policy and
   class governed its mixed raw and derived fields.

The immutable StoryArtifact is content-addressed and supports v1-v5 replay.
Changing its JSON solely to carry lifecycle metadata would change hashes,
validators, benchmark fixtures, database writers, and replay semantics without
changing the story itself.

## Interface designs considered

### A. Relational envelope only

Add policy/class columns beside sessions and artifacts, with database checks and
explicit legacy labels.

- Strength: durable, queryable, and enforceable across processes.
- Weakness: cannot prevent a new provider adapter from leaking an output before
  persistence.

### B. Opaque derived-output tokens only

Return provider-derived values as frozen tokens backed by a module-private
value store. Only literal, allowlisted consumers may unwrap them.

- Strength: small interface and strong compile/runtime pressure at the provider
  seam.
- Weakness: does not prove that a database row carries the intended lifecycle,
  and JavaScript cannot erase a string after an authorized consumer unwraps it.

### C. StoryArtifact v6 retention stamp

Put a current policy stamp and retained-kind list inside the content-addressed
artifact.

- Strength: story content and lifecycle identity travel together.
- Weakness: couples a privacy-policy rollout to story schema/hash migration,
  forces every writer and benchmark to move together, and tempts false
  backfilling of immutable v1-v5 artifacts.

## Decision

Use A and B together, behind one code-owned retention registry:

- Reader-derived Cerebras and query-embedding boundaries return opaque
  classified outputs. Their values live in module-private working memory and
  can be consumed only by named, AST-enumerated literal reducers, validators,
  or scorers. Curated document embeddings remain bare catalog vectors, but
  their caller and sink are separately allowlisted. Opening copy remains
  request-only until complete artifact validation promotes it as part of the
  Owner Story.
- Every external provider exchange goes through one adapter and names a
  registered request/output policy. The adapter owns the origin and path and
  accepts only an opaque exchange-bound request-body token plus the exact
  headers and options for that exchange. The five reviewed builders enforce the
  registered JSON shapes, including the prompt-defined response format. The
  adapter discards raw transport error causes; each reviewed caller discards a
  non-2xx response body before emitting its closed error.
- Validated generated story content uses the `owned_story` class. Recovery
  Context uses `recovery_context`. Closed feedback, operational, editorial, and
  curated stores use their own non-overlapping classes.
- Sessions and story artifacts carry relational policy/class labels outside
  StoryArtifact JSON. New writes receive the current version. Existing rows are
  labeled as legacy classifications rather than being represented as having
  recorded a policy that did not yet exist. INSERT guards reject explicit
  legacy or wrong-class claims on later rows.
- The one-way legacy-v5 replay marker retains only an existing artifact ID,
  uses the `owned_story` class, and cascades with that artifact; it carries no
  disclosure, prose, account, session, or analytics field.
- CI compares the retention registry with all 23 current application-owned
  tables, all five current provider exchanges, their reviewed transport owners,
  every current direct production JavaScript/TypeScript fetch path and forbidden
  alternate transport reference, and the exact 35-column inventory of the two
  relations that can hold Disclosure or Owner Story data.
  The live service-only health boundary independently compares those 35 fields
  with `pg_attribute`. Unknown kinds, sinks, classes, consumers, policy
  versions, raw-provider imports, fields, and egress paths fail closed until
  the registry/checker is deliberately updated.

The current product posture remains explicit: Recovery Context becomes
cleanup-eligible at its fixed deadline and is physically cleared by the next
daily cleanup; validated generated wording in an Owner Story follows the owner
lifecycle. A guest's owner lifecycle is temporary. A permanent account's story
remains until story or account deletion. The deadline and policy-label columns
are durable control metadata, not retained Disclosure.

## Consequences

- StoryArtifact remains v5; its content hashes and existing benchmark evidence
  do not change for policy-only metadata.
- Provider call sites gain classify/consume plumbing, but the provider
  implementation remains invisible outside `lib/`.
- The relational envelope can be applied before the application deploy because
  existing RPCs receive safe database defaults. Operators must still pause and
  drain writers: the whole-file migration takes bounded, session-first
  access-exclusive locks.
- Existing artifacts remain readable under an explicit legacy policy version.
- The contract does not govern Cerebras, Gemini, hosting, email, or backup/PITR
  retention after data leaves Onward's application boundary. Those remain
  external launch reviews.
- Durable account-level Save State now lives in the separate
  `durable-account-save-v1-2026-07` contract and migration `0022`. That
  additive control does not change this decision's 60-day Recovery Context
  deadline or rewrite immutable StoryArtifact content.
