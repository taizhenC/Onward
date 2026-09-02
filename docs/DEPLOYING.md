# Deploying Onward

This is the operator runbook for a real deployment: Supabase (Postgres, Auth,
pg_cron) plus Vercel. It is long on purpose. Every migration in
`supabase/migrations/` is applied by hand in the Supabase SQL editor, several
dashboard settings have to be changed from their defaults, and the production
behaviour is pinned by the immutable recipe selected with
`ONWARD_PRODUCTION_RECIPE_ID` (see [`production-recipe.md`](production-recipe.md)).

You do not need any of this to run Onward locally: `npm run dev` starts in
memory mode with stub providers and no database.

What you need before you start:

- A Supabase project (free tier is fine) with the **pg_cron** extension available.
- A Vercel project connected to this repository.
- A Cerebras API key (reranking and opening copy).
- A Gemini API key only if the selected recipe uses FacetsRAG embeddings.
- A transactional email sender for Supabase Auth (Resend's free tier works);
  the built-in sender only delivers to project team members.


## 1. Supabase (dashboard)

1. For a fresh project, apply every file from `supabase/migrations/` in numeric order in the Supabase SQL editor: `0001` → `0002` → `0003` → `0004` → `0005` → `0006` → `0007` → `0008` → `0009` → `0010` → `0011` → `0012` → `0013` → `0014` → `0015` → `0016` → `0017` → `0018` → `0019` → `0020` → `0021` → `0022` → `0023` → `0024`. Before `0003`, enable the **pg_cron** extension and verify `delete from auth.users where false;` runs without a permission error. Apply each migration exactly once and stop on the first error. **`0003` deletes existing development session rows on purpose.** Migration `0009` adds root-only request context plus leased/atomic alternate recovery; `0010` adds typed privacy-safe product/operational telemetry with 30/14-day pruning; `0011` adds the telemetry-flow registry, transactional `create_story_session_v3` binding, typed capture RPC, and leased product-event outbox; `0012` adds transactional match-limiter, recovery, and `create_story_session_v4` artifact producers, including two-day unlinkable limiter-decision replay for ambiguous responses; `0013` makes each artifact-backed Continue/Finish an owner-scoped CAS that atomically captures its persisted-artifact-derived passage ordinal plus final completion; `0014` atomically captures the persisted feedback verdict while keeping the closed miss reason in the feedback domain only; `0015` captures alternate demand only when a valid capability becomes a durable claim; `0016` derives alternate match calibration at the server boundary and atomically captures alternate terminal outcomes plus ready-artifact telemetry with their authoritative transitions; `0017` replaces service-role raw-event claims with a private, ID-only Postgres dispatcher that atomically folds each source event into identifier-free UTC-day marginal counts before marking its outbox pointer delivered; `0018` adds the owner-scoped story-deletion RPC and removes direct service-role session deletion; `0019` adds the owner-confirmed account-deletion RPC, FK-binds and indexes rate-limit user keys, routes guest expiry through the same locked cascade, and account-serializes flow ownership plus initial-story RPCs; `0020` adds the append-only promoted-recipe registry, exact immutable session-recipe trigger, and registry-backed telemetry/recovery/rollup checks; `0021` adds immutable current-or-honest-legacy retention labels, current-only insert guards, and a closed service-role schema-health boundary without rewriting StoryArtifact JSON; `0022` atomically records one immutable account-level Save State at the confirmed Auth transition, preserves honest legacy observations, and exposes a closed service-only health boundary; `0023` enforces strict StorySpec JSON identity, snapshot-bound reviewed publication, legacy-promotion revocation, a one-way database-owned replay marker for pre-cutover v5 artifacts, and closed publication/replay schema health; `0024` adds the exact manifest-v2 discriminator and nested facet-tagger identity without registering or selecting a v2 recipe. The dispatcher minute cron remains disabled in `telemetry_rollup_dispatch_control` until an operator completes the rollout gates. Pre-`0009` sessions remain deliberately ineligible for linked telemetry because their original limits cannot be reconstructed safely, but they remain deletable.

Run each migration as one whole-file transaction, never statement-by-statement.
This is mandatory for `0017`: its table lock, delivered-pointer backfill, and
legacy claim/ACK revocation are one atomic cutover. If the migration runner does
not transaction-wrap a file, wrap the complete `0017` script in `BEGIN` and
`COMMIT` for that execution. Apply the same whole-file wrapper to `0021`,
`0022`, and `0023`; their `SET LOCAL` timeouts and ordered cutovers must share one
transaction.

Before applying `0011`-`0024`, validate the release commit locally:

```powershell
npm run typecheck
npm run check-telemetry
npm run check-telemetry-lifecycle
npm run check-telemetry-producers
npm run check-story-progress-telemetry
npm run check-feedback-telemetry
npm run check-alternate-request-telemetry
npm run check-alternate-resolution-telemetry
npm run check-entry-telemetry
npm run check-auth-telemetry
npm run check-flow-failure-telemetry
npm run check-telemetry-dispatcher
npm run check-story-deletion
npm run check-account-deletion
npm run check-reader-visibility-telemetry
npm run check-derived-output-retention
npm run check-owner-story-save
npm run check-story-spec
npm run check-story-spec-migration
npm run check-recipe-registry-v2
npm run build
```

Migration `0018` must be applied before deploying the story-deletion UI. It
installs the only service-role story-delete authority, serializes against
alternate creation, revokes direct session deletes, and retires the shared raw
telemetry flow for either an initial or alternate deletion. Run `npm run
check-db` after applying it; do not deploy the caller first.

Migration `0019` must be applied before deploying the account-deletion UI. It
installs the only service-role account-delete authority, closes the concurrent
rate-limit-key race with an auth-owner FK, and upgrades scheduled guest cleanup
to the same lock/cascade path. It also wraps flow-owner claim and v2/v3/v4
initial-story writers with the same account advisory lock before they touch a
flow or auth-owned row; the renamed implementations are revoked, and the
transaction-commit PostgREST notification refreshes the callable RPC schema.
Run `npm run check-db` after applying it. The
real-Postgres account-delete versus progress, feedback, alternate, limiter, and
dispatcher concurrency matrix remains a deployment gate; do not infer it from
the hermetic validator.

The bounded initial-composition failure producer itself is an application-only
slice: it reuses the exact `flow_failed` columns from `0010` plus the active-flow
capture/outbox transaction from `0011`. Migration `0017` belongs to the separate
first-party dispatcher slice; it does not broaden the failure producer.

For an existing deployment, use a schema-first rollout. Create a database restore point and validate `0011_transactional_telemetry_outbox.sql` through `0019_owned_account_deletion.sql` against staging first. Migration `0013` deliberately aborts if any validator-v1 artifact has blank chunks or more than 64 passages; repair or explicitly retire every reported legacy row before retrying, so rollout cannot silently strand an old reader. Keep the currently deployed application in place, apply all nine migrations to production, and run `npm run check-db` with the production Supabase URL, service-role key, and a dedicated `TELEMETRY_ID_SECRET`. Only after that gate passes should you deploy the application version that calls the `0012`-`0016` domain RPCs or the `0018`/`0019` deletion RPCs; deploying that application first makes the corresponding new story, recovery, Continue, feedback, alternate, story-delete, or account-delete action fail because its RPC does not exist yet. Migration `0017` creates missing pointers for every still-live pre-outbox event, backfills still-live pointers already marked delivered, revokes service-role access to the v1 full-row claim and plain ACK paths, and installs private dispatch plus pruning cron jobs. Dispatch remains a no-op until explicitly enabled; applying the migration alone never consumes the queue. Before applying it, stop every legacy outbox worker, wait at least the 60-second lease period, and verify there is no active leased row (`status='leased' and lease_expires_at > statement_timestamp()`). This quiescence is mandatory because revoking execute permission cannot cancel a v1 ACK invocation that already passed authorization. Confirm that no old worker depends on the revoked paths. Confirm before the window that the running build does not require direct `product_events` writes for a request to succeed, because `0011` revokes both inserts and deletes as soon as it is applied. If a maintenance window is needed, set `STORY_CREATION_ENABLED=false` before the migrations and restore it only after the live-flow check passes. `TELEMETRY_FLOW_BINDING_ENABLED=false` remains an explicit temporary escape hatch for producer schema/config incidents; it deliberately creates a telemetry gap and does not replace migration-first rollout. Remove it or set it to `true` only after `0011`-`0016` and the producer database gate pass. The `0017` dispatch control is database-only and independent of that application flag.

Migration `0020` is the deliberate exception to the schema-first rule because
its session trigger requires the expanded immutable MatchRecipe written by this
application version. In staging and production, pause new stories with
`STORY_CREATION_ENABLED=false` (crisis resources remain available), deploy this
code with the exact manifest environment, apply `0020`, run the three recipe
checks plus `npm run check-db`, create one canary after re-enabling stories, and
verify its session records the expected manifest hash and deployment version.
Do not roll the application back to a pre-registry build while `0020` remains
installed; keep stories paused until a registry-aware build is restored. Recipe
rollback between the registry-aware build's compatible, pre-registered matching
recipes is one `ONWARD_PRODUCTION_RECIPE_ID` change and needs no database
change. A figure-library, prompt, validator, schema, or story-composer change is
a code/content release, not a matching-recipe promotion; it requires its own
forward/rollback release plan and cannot borrow this selector guarantee.

### Figure-library releases

`config/figure-library-releases.json` is the append-only lineage of
`lib/figures-data.ts` snapshots. The newest entry is the snapshot a build
installs; `check-recipe-governance` fails whenever the committed library hashes
to anything else, and `check-recipe-immutability` rejects any edit to an
existing entry. A recipe manifest keeps pinning the snapshot its evidence was
evaluated on, and the runtime accepts a selected recipe as long as that
snapshot is somewhere in the lineage, so a content release never needs a new
recipe, a promotion, or an `ONWARD_PRODUCTION_RECIPE_ID` change.

To ship a content change to the library:

1. Land the content on a branch and commit it, then run the real reranker
   against it from that commit (`EVAL_CONCURRENCY=1 RETRIEVAL_MODE=keyword
   EVAL_RECIPE_ID=<primary recipe id> EVAL_REQUIRE_GATE=1 npm run eval`).
   The harness appends an evidence record under `evals/history/`; commit it.
2. If the trust gate failed, the content cannot ship. Fix the regressions and
   re-run; do not append a release. The evidence stays as the audit trail.
3. If it passed, append one entry to `config/figure-library-releases.json`:
   the new `sha256` of `lib/figures-data.ts`, `releasedAt`, `supersedes` (the
   previous entry's hash), a `note` describing the change, and the passing
   `evidenceIds`. The governance check verifies that each cited evidence record
   evaluated a promoted recipe with the real provider, passed the gate, and
   was computed at a commit whose `lib/figures-data.ts` hashes to the new
   entry (it fetches that single commit on a shallow CI checkout).
4. After the merge deploys, reseed the database from the same commit:
   `npm run seed` for `figure_stages`, `npm run seed-story-specs` for review
   drafts, and `npm run seed-embeddings` when a FacetsRAG recipe is selectable.
   Rolling the content back is the reverse: append the previous snapshot as a
   new release (its evidence is already in the lineage) and reseed.

Migration `0021` is schema-first compatible. Apply it before this application
build, but first pause new stories and drain in-flight story/progress/deletion
requests because it takes explicit session-then-artifact access-exclusive
locks and fails after a ten-second lock wait. Existing rows receive the explicit
legacy policy label, while database defaults plus INSERT guards require the
current policy and exact classes on every later RPC insert without changing any
RPC signature. Run `npm run check-derived-output-retention` before the migration
and `npm run check-db` after it; the latter requires the closed schema-health
RPC to prove defaults, validated constraints, trigger definitions, labels, and
grants, including the exact bodies of all four label/immutability helpers. It
also compares the live `pg_attribute` inventory for all 20 session
columns and all 15 artifact columns with the closed code registry; an added,
removed, or unclassified field fails the deployment gate. Do not represent
legacy rows as current-policy rows, remove the label
constraints/guards, or deploy a reader that silently accepts an unknown
policy/class. A pre-`0021` application can continue writing through the existing
RPCs after the migration because the database supplies the new columns, but it
will not enforce the provider-output boundary; roll forward to the classified
build promptly.

Migration `0022` is additive but requires a coordinated production cutover; do
not apply it schema-first while an older public build is live. That build can
create a missing user from `/signin` and lacks the permanent-owner creation
guard, while the revised trigger deliberately ignores direct Auth inserts.
First deploy the independent returning-owner `/signin` compatibility guard
with `shouldCreateUser: false`. Then set `STORY_CREATION_ENABLED=false`, verify
ordinary `/api/match` requests return 503, wait at least the route's 60-second
maximum duration for in-flight matches to drain, and prove an unknown
`/signin` email creates no Auth user. If that compatibility deploy is
not possible, place sign-in, Save, and story creation behind a maintenance
boundary for the whole cutover.

With those controls active, apply `0022`. It creates a forced-RLS,
service-read-only owner lifecycle
row and installs a narrow trigger on `auth.users`. The trigger records
`anonymous_upgrade` only when Auth confirms the `true` to non-true transition,
and never treats direct account creation as informed Save evidence or touches
Sessions, telemetry, or advisory locks. `/signin` is returning-owner-only and
sets `shouldCreateUser: false`; the match boundary also refuses story creation
for a permanent owner without readable current-or-legacy Save evidence before
telemetry, limits, providers, or writes. Existing permanent owners are backfilled as
`legacy_permanent_observed` with `saved_at = NULL`; do not invent a historical
confirmation time. The file takes a ten-second bounded Auth lock only after its
catalog/helper DDL and limits each statement to 30 seconds, then installs the
trigger before scanning legacy owners in the same transaction.

Run `npm run check-owner-story-save`, then run `npm run check-db`
and require every `owner_story_save_schema_health_v1` boolean to be true before
deploying the full guarded reader. In staging, create one guest, request email linking, prove
no row exists while the email is merely pending, confirm it, and prove the same
Auth ID has one exact `anonymous_upgrade` row. Also prove `/signin` cannot
create a missing account, direct permanent creation fails the coverage gate,
and test a same-device and cross-device read, story deletion preserving the
owner row, and account deletion cascading it. If managed Auth confirmation
fails because of the trigger, keep `STORY_CREATION_ENABLED=false` and first
activate edge maintenance for every Save surface and `/auth/confirm`
email-change redemption. Prove an already-issued pending link cannot redeem;
blocking only new link requests is not enough. Then use
`drop trigger onward_record_owner_story_save on auth.users;` and keep existing
rows immutable. Keep confirmation maintenance and the returning-only sign-in
guard active until the trigger and guarded app are restored, all health flags
are true, and confirmation canaries pass. Never serve a build that allows
implicit signup, redeemable unguarded Save links, or unguarded permanent story
creation after `0022`. A permanent owner without a row projects as unavailable;
any reviewed repair may backfill only an honest legacy observation. Remove
confirmation maintenance and re-enable story creation only after the canaries.

Migration `0024` returns to schema-first rollout. Apply it to staging and
production before deploying a build that selects the new registry columns.
The pre-`0024` registry-aware application remains compatible while the
migration is present, and v1 rows remain exact with both new columns null. Run
`npm run check-recipe-registry-v2` locally and `npm run check-db` against the
target database before deploying the v2-aware reader. Applying `0024` does not
register, promote, select, evaluate, or execute a manifest-v2 recipe.

Prompt version labels are not trusted by themselves: `config/prompt-releases.json`
is append-only, and each active rerank, story, and facet-tagger version binds
the exact canonical prompt-content SHA-256 that the runtime verifies. Facet
tagger contracts are inert JSON artifacts under
`config/prompt-artifacts/facet-tagger/<sha256>.json`; the protected-base
attestor checks their schema, bounds, placeholders, hidden characters, and
content-derived path before accepting registry v2. CI also checks hostile-input
JSON framing and pull-request-base append-only history. A dormant
`lib/llm.ts#tagAndExpand` facade now has an always-null stub and one bounded real
adapter: fixed model/tuning, one request, a three-second deadline, an IDs-only
template catalog, strict UTF-8/response limits, and silent null fallback. CI
proves that no production matching or retrieval path references it, and the
facade itself returns the null stub whenever `NODE_ENV=production`.
A pure `facetTaggerExecutionPlan` can now derive a detached frozen plan only
when all eleven nested manifest-v2 axes match installed code, but it verifies
neither recipe registration/hash nor execution authority and has no production
consumer. Manifest-v2 execution, shadow invocation, weighting changes, and
promotion remain separate reviewed gates; future shadow wiring must resolve an
exact registered/hash-verified recipe before it may use the plan.

Before the first challenger promotion, create a protected GitHub environment
named `recipe-promotion`, require independent reviewers, and add a dedicated
`RECIPE_PROMOTION_ENVIRONMENT_TOKEN` secret of at least 32 bytes. Eval and
paired-shadow tooling always writes `promotable=false`; a normal, non-authority
PR first lands its content-addressed candidate evidence on `main`. A separate
promotion-only PR must target `main` and may modify only the selector registry,
one new decision, the generated recipe document, and one new registration
migration. It cannot introduce or modify evidence, manifests, datasets, code,
workflows, or the attestor while requesting authority.

For that promotion PR, set protected environment variables for the exact head,
decision, dataset, catalog, evidence IDs, shadow IDs, evaluated commits and
input-tree hashes, independent eval run/deployment/source-run hashes, independent
shadow run/deployment/source hashes, and the three reviewer identities. The
variable names are the `RECIPE_PROMOTION_ATTESTED_*` and
`RECIPE_PROMOTION_*_REVIEWER_ID` names mapped only on the final step in
`.github/workflows/recipe-promotion.yml`;
`RECIPE_PROMOTION_ATTESTATION_SHA256` binds the whole canonical bundle. The
detector and attestor are dependency-free and are loaded from the pull request's
protected base commit. The secret and variables are unavailable to checkout,
package installation, evals, and every pull-request-controlled script.

Bootstrap note: the first landing of this governance system contains no new
promotion; it establishes `.github/workflows/recipe-promotion.yml` and the
attestor on protected `main`. Every later promotion is evaluated by that merged
base-owned `pull_request_target` workflow. Do not use a workflow copied from the
promotion head as a substitute.

Require ordinary CI's `verify` plus the always-running
`recipe-promotion-gate` check; that stable gate accepts a non-promotion only
after trusted detection and accepts a promotion only after the conditional
attestor succeeds. Also require independent
environment review, CODEOWNERS review, dismissal after new commits, and no
direct pushes. Require the promotion branch to be up to date with `main` before
merging, so a success bound to an older base SHA cannot be reused after `main`
advances. The current workflows do not handle `merge_group`; keep merge queue
disabled unless both required workflows add and verify that trigger. The
attestor independently recomputes content IDs, metric floors,
paired comparisons, conservative superiority, manifest compatibility (including
the rerank prompt), exact base-primary/rollback binding, immutable candidate
files, one registration migration, and every protected binding. Missing or
reused run/deployment/shadow identity, dirty/unbound input tree, or any other
proof fails closed.

As of July 23, 2026, this repository is private on a GitHub plan for which the
branch-protection API returns `403` and reports that GitHub Pro (or a public
repository) is required. Therefore CODEOWNERS, required checks, stale-review
dismissal, and no-direct-push rules cannot yet be enforced. Do not authorize a
recipe promotion while that remains true. Upgrade the plan or deliberately
change repository visibility, then configure and verify the controls above
before treating the attestation workflow as a production authority boundary.

Migration `0017` is the only implemented P0 outbox destination candidate. It claims only
event and lease identifiers inside Postgres, locks the authoritative source
before its cascade-owned pointer, emits one `all` cell plus separate
single-dimension marginal cells, and folds those cells in the same transaction
that marks the pointer delivered. The rollup contains only UTC date, schema,
event, one closed dimension name/value, and count. The candidate read RPC has
no caller grant in this slice: it withholds the two newest UTC dates, any date
with missing-pointer or unsettled source work, every child partition containing a positive cell
below `k=10`, and the parent `all/all` cell when a child partition is unsafe.
It also rejects windows longer than 28 retained days. A later dashboard privacy
review must add contribution bounding or approve another disclosure-control
model before granting any consumer. The threshold counts events, not distinct
people, and must not be described as contributor-level k-anonymity.
Rollups are deleted after no more than 30 calendar days. They cannot calculate
flow-linked intersections or 24-hour story cohorts; those require a separately
reviewed aggregate design. Raw-event export, webhooks, third-party analytics
SDKs, and external outbox consumers remain prohibited.

Migration `0011` revokes both direct `INSERT` and direct `DELETE` on
`product_events` from `service_role`. Capture must use
`capture_product_event_v1`; privacy deletion must use
`revoke_telemetry_flow_v1`, which removes linked events and leaves the opaque
revocation tombstone that prevents recreation.

The post-migration database gate must confirm the lifecycle/capture/domain functions plus the `0017` dispatch control, dispatcher, queue-health, and schema-health boundaries are reachable. The schema-health RPC returns only closed booleans proving the expected forced-RLS state, effective privilege denial for raw/helper/read paths, granted operational boundaries, and exact active cron schedules/commands. `npm run check-db` requires that closed schema result and the exact queue-health shape without dispatching live rows; immediately after migration, both health RPCs must report `dispatch_enabled=false`. The candidate daily-read RPC remains private and is not a service-role reporting boundary. These checks do not prove cron execution, concurrent `SKIP LOCKED` behavior, source-before-pointer deletion ordering, or cascade behavior. The following read-only SQL-editor preflight and staging exercises are therefore mandatory, not optional:

```sql
select p.proname
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = any (array[
    'register_telemetry_flow_v1',
    'claim_telemetry_flow_owner_v1',
    'revoke_telemetry_flow_v1',
    'resolve_owned_telemetry_flow_v1',
    'resolve_owned_telemetry_root_v1',
    'capture_product_event_v1',
    'nack_product_event_outbox_v1',
    'claim_product_event_outbox_v2',
    'settle_product_event_outbox_rollup_v1',
    'dispatch_product_event_rollups_v1',
    'read_telemetry_event_rollups_v1',
    'telemetry_outbox_health_v1',
    'telemetry_rollup_schema_health_v1',
    'set_telemetry_rollup_dispatch_enabled_v1',
    'delete_expired_telemetry_rollups_v1',
    'create_story_session_v3',
    'create_story_session_v4',
    'issue_match_recovery_flow_v2',
    'consume_match_rate_limit_v2',
    'acknowledge_story_position_v1',
    'submit_story_feedback_v2',
    'claim_alternate_story_flow_v3',
    'release_alternate_story_claim_v2',
    'complete_alternate_story_unavailable_v2',
    'complete_alternate_story_expired_v1',
    'complete_alternate_story_session_v2'
  ])
order by p.proname;

select jobname, schedule, active
from cron.job
where jobname in (
  'onward-privacy-safe-telemetry-cleanup',
  'onward-telemetry-flow-cleanup',
  'onward-prune-match-rate-limit-decisions',
  'onward-dispatch-product-event-rollups',
  'onward-prune-product-event-rollups'
)
order by jobname;

select
  has_function_privilege(
    'service_role',
    'public.claim_product_event_outbox_v1(text,integer)',
    'execute'
  ) as legacy_raw_claim_must_be_false,
  has_function_privilege(
    'service_role',
    'public.ack_product_event_outbox_v1(text,text)',
    'execute'
  ) as plain_ack_must_be_false,
  has_function_privilege(
    'service_role',
    'public.claim_product_event_outbox_v2(text,integer)',
    'execute'
  ) as private_claim_must_be_false,
  has_function_privilege(
    'service_role',
    'public.settle_product_event_outbox_rollup_v1(text,text)',
    'execute'
  ) as private_settle_must_be_false,
  has_function_privilege(
    'service_role',
    'public.dispatch_product_event_rollups_v1(integer)',
    'execute'
  ) as service_dispatch_must_be_true,
  has_function_privilege(
    'service_role',
    'public.read_telemetry_event_rollups_v1(date,date)',
    'execute'
  ) as candidate_read_must_be_false,
  has_function_privilege(
    'service_role',
    'public.set_telemetry_rollup_dispatch_enabled_v1(boolean)',
    'execute'
  ) as dispatch_control_must_be_true,
  has_function_privilege(
    'service_role',
    'public.telemetry_rollup_schema_health_v1()',
    'execute'
  ) as schema_health_must_be_true,
  has_table_privilege(
    'service_role',
    'public.telemetry_event_daily_rollups',
    'select'
  ) as direct_rollup_read_must_be_false;

select * from public.telemetry_rollup_schema_health_v1();
select * from public.telemetry_outbox_health_v1();
```

After applying `0017` in staging, run `npm run check-db`, confirm schema health
is `ok=true` and both health RPCs say `dispatch_enabled=false`, then enable only
the staging dispatcher:

```sql
select public.set_telemetry_rollup_dispatch_enabled_v1(true);
```

Run two dispatch calls concurrently against a seeded queue and prove that each
event contributes exactly once. Exercise an
expired lease, a forced per-row fold failure, a flow revocation racing dispatch,
and a deletion that commits before dispatch. Confirm lease/fold failures recover
or exhaust under the existing bounded policy, a revoked or deleted source
produces no rollup, and `service_role` cannot execute the candidate read RPC.
The SQL-owner privacy harness must separately prove that the private candidate
withholds the two newest dates, unsettled dates, unsafe child partitions, and
their parent cells. Inspect `cron.job_run_details` after several enabled minute
jobs and one pruning run. Query `telemetry_outbox_health_v1()` and require
`dispatch_enabled=true` with zero actionable or exhausted rows before declaring
the staging dispatcher healthy. Disable it again after the exercise. These are
real-Postgres release exercises; `npm run check-telemetry-dispatcher` is a
hermetic structural gate, not concurrency, cron, or dashboard-privacy evidence.

Rollback compatibility is deliberately narrow. Keep migrations `0011`-`0024` installed during the application rollback window; the older application-compatible domain RPCs remain, and a pre-deletion application simply exposes no delete action. After `0020`, however, every build that creates stories must write the expanded registry-backed MatchRecipe; use the story kill switch instead of rolling back to a pre-registry writer. Never restore direct service-role `sessions` DELETE or remove the rate-limit owner FK while old/new instances overlap. A pre-0016 application loses alternate terminal, match-calibration, and ready-artifact telemetry; a pre-0015 application also loses transactional alternate-request events; a pre-0014 application also loses transactional feedback events; a pre-0013 application also loses transactional progress/completion events; a v3 application loses transactional match-producer completeness; and a v2 application stops registering/binding new flows and is incident-only. None restores the pre-`0011` direct-write telemetry paths. Migration `0017` also intentionally revokes service-role execution of the raw-row v1 claim and plain ACK paths, so do not roll back to an outbox worker that requires them. Migration `0021` remains compatible with older RPC writers through database defaults; do not drop its labels or immutability trigger during rollback. After `0022`, never roll back under public traffic to a build that permits implicit signup or lacks the permanent-owner Save guard. After `0023`, never re-grant the ID-only StorySpec promotion RPC or restore nullable/text-cast document identity; older publication tooling must remain intentionally fail-closed. Keep `STORY_CREATION_ENABLED=false`, the returning-only sign-in guard, Save-surface maintenance, and `/auth/confirm` email-change blocking active until the full guarded app and trigger are restored and their health/confirmation canaries pass; already-issued links must remain unredeemable during the gap. Keep the immutable Save rows. If the managed-Auth trigger itself causes confirmation failures, use the documented trigger-only rollback rather than dropping the state table or fabricating timestamps. Migration `0024` is additive for v1 and must remain installed once a v2-aware build or row exists.

Before an application rollback or dispatcher incident, disable aggregation
through the dedicated control; do not drop the rollup/control tables,
unschedule the reviewed cron definitions, re-grant raw-event claim/ACK, or
export queued events. Producers may continue filling the bounded outbox:

```sql
select public.set_telemetry_rollup_dispatch_enabled_v1(false);
```

The installed minute cron will then return zero counts without claiming work.
The control update waits for any batch that already held the shared control lock,
so a successful `false` response is also the in-flight dispatch drain barrier.
Keep both authored jobs active so schema health remains valid and pruning never
extends the 30-day maximum. Re-enable with
`set_telemetry_rollup_dispatch_enabled_v1(true)` only after `check-db`, queue
health, deletion, and privacy checks pass again. An exhausted pointer is not
automatically requeued; repair requires an explicit reviewed runbook.

A rollback build must retain the typed capture path and perform privacy deletion
through `revoke_telemetry_flow_v1`; a build that directly inserts or deletes
`product_events` is not compatible with schema `0011`.

The older `0009` cleanup rule still applies: keep the unsuffixed `create_story_session` RPC through the v2 rollback window. Only after every instance uses v2 or newer, production verification passes, and that rollback compatibility is no longer required should an operator manually apply `supabase/rollout/remove_legacy_story_session_rpc.sql`. That cleanup intentionally lives outside the automatic migration stream.

The alternate capability expiry is a **start-by** deadline: a claim must begin before it, while an already-started claim may finish only within its separate two-minute lease and the original disclosure-retention deadline.
2. Authentication → Sign In/Up → enable **anonymous sign-ins**.
3. Authentication → URL Configuration → set **Site URL** to the production URL; add `http://localhost:3000/**` to the redirect allowlist (a separate Supabase project for local dev is cleaner — Site URL is single-valued).
4. Authentication → Emails → configure **custom SMTP** (Resend's free tier works). The built-in sender is limited to ~2 emails/hour **and only delivers to project team members** — without custom SMTP, real users' save/sign-in emails silently fail.
5. Rewrite **three** email templates to the `token_hash` form (the default PKCE `?code=` links only work in the originating browser):
   - *Magic Link* and *Confirm signup*: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/stories`
   - *Confirm email change*: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email_change&next=/stories`
   Account-deletion reauthentication reuses the Magic Link template. A signed,
   HttpOnly, ten-minute `onward_account_delete_reauth` cookie redirects the
   originating device back to `/account/delete`; another device lands at the
   normal `/stories` destination and can choose Account there.
6. Seed: `npm run seed`, then `npm run seed-story-specs`. New stages and specs stay in `draft`; source mapping and human review are required before an editor moves a spec to `review` and runs `npm run story-spec:status -- publish <storySpecId>`. Production matching considers only valid published StorySpecs. The same command with `retire` immediately removes one stage version from new matching without a deploy. Historical concerns appear in `historical_concern_reports`; triage them through `triage_historical_concern`, and retire the pinned `story_spec_id` when a concern requires immediate unpublication. Reports never auto-retire content. Run `npm run check-db` after publishing the intended launch subset. For semantic retrieval: `npm run check-embeddings` → `npm run seed-embeddings` → `npm run check-embeddings`.

Apply migration `0023` before using the `publish` action from this version.
Set `STORY_CREATION_ENABLED=false`, verify a new intake is paused, drain
in-flight creation, and pause editorial writes before the cutover. Existing
story pages already in memory remain readable, but an artifact load or reload
may wait while the short cutover transaction holds its lock. Run the whole
migration file as the database owner; it locks `story_specs`, `figure_stages`,
and `story_artifacts` together until commit. The
migration rejects any different database/table/routine owner, application-role
inheritance of the database owner, unexpected controlled-routine overload, or
user trigger on `figure_stages` before changing the schema. It also rejects
inheritance or partition edges, table rewrite rules, a missing or altered
`story_specs(story_spec_id)` primary key, any missing or altered publication
column, generated columns, and every constraint or index outside the exact
reviewed inventory on either publication table. The
database owner must have no actual direct or indirect
`pg_auth_members` members. The managed
Supabase `service_role` descendant set is closed to `authenticator`, the current
database-owner OID, and the optional exact `supabase_storage_admin` role, whether
its managed membership is direct or reached through `authenticator`; any app,
browser, or unknown role makes readiness fail. Exactly one direct-or-indirect
storage path may exist, and its membership edge must remain `INHERIT FALSE`,
`SET TRUE`, and `ADMIN FALSE`.
`authenticator` must remain `NOINHERIT`, non-superuser, without `BYPASSRLS`,
`CREATEROLE`, `CREATEDB`, or replication authority. On PostgreSQL 16+, its
direct membership edge must also remain `INHERIT FALSE`, `SET TRUE`, and
`ADMIN FALSE`; the migration reads these per-membership options through a
backward-compatible catalog projection. `service_role` must remain a
non-login, non-superuser, non-delegating role with `BYPASSRLS`; `anon` and
`authenticated` must remain non-login, non-superuser, non-delegating roles
without `BYPASSRLS`. Managed platform superusers and the database owner remain
unavoidable database-administration trust roots, but they are not application
publication principals.

Before applying the file, run `npm run check-story-spec-cutover` against the
target database and save its count in the release evidence. The count of
published StorySpecs must be zero. If it is not, retire each immutable legacy
publication with `npm run story-spec:status -- retire <storySpecId>`, preserve
its already-created artifacts for replay, author a new StorySpec version under
the current contract, and rerun the check. Never rewrite a published document
in place. This read-only SQL-editor query independently records the exact stage
projection set the migration will normalize:

```sql
select
  (select count(*)
   from public.story_specs
   where status = 'published') as published_story_specs_must_be_zero,
  (select count(*)
   from public.figure_stages
   where status = 'published') as published_stages_to_demote;

select figure_key, stage_id
from public.figure_stages
where status = 'published'
order by figure_key, stage_id;
```

The migration validates strict JSON identities; replaces and fingerprints the
exact StorySpec status constraint, StorySpec-to-stage foreign key, stage-status
constraint, publication index, and canonical stage lifecycle trigger; revokes
the legacy ID-only promotion RPC; and installs snapshot-bound
`promote_story_spec_v2` plus the audited retirement RPC. While all three tables
are locked, it snapshots the IDs of existing
`story-artifact-v5-2026-07` rows into the database-owned
`story_artifact_legacy_v5_replay` table. That one-way snapshot is the only
legacy-replay capability: artifacts created after the cutover cannot add
themselves to it, and artifact JSON, schema labels, timestamps, or a recomputed
content hash cannot manufacture eligibility. The migration also reconciles
every stage projection: a stage is `published` exactly when one published
StorySpec exists for it, and every legacy stage-only publication becomes
`draft`. Inspect that expected demotion set before the cutover and keep story
creation paused until the reviewed launch subset is confirmed. The service role
retains direct draft/review authoring and content-only stage refreshes, but
direct writes cannot create a published row, demote a reviewed StorySpec, change
`figure_stages.status`, or enter either terminal StorySpec status.
Publication and retirement must pass through the owner-definer RPCs, and either
RPC rolls its StorySpec transition back if exactly one corresponding stage does
not exist. `npm run seed` inserts missing stages as drafts and refreshes existing
content in one status-free statement. `npm run seed-story-specs` inserts only
missing drafts, then refreshes an existing row only while its status is still
`draft`; reviewed, published, and retired rows are never overwritten. A review
changed after validation fails with “reload and revalidate”; do not retry it
automatically.
Published sentence maps must classify every sentence as an evidence-backed
historical claim or one of the code-owned reader-bridge lines, and every
beat-level quote link must equal its sentence-level quote links.
Pre-closure v5 artifacts first pass the current strict replay validator. Only a
strict failure may try the legacy transparency shape, and that fallback requires
the exact immutable database envelope, unchanged content hash, and an
`artifact_id` row in `story_artifact_legacy_v5_replay`. Missing eligibility or a
marker lookup error fails closed. The compatibility seam cannot compose a new
artifact, and the UI labels an old mixed bridge with fact or quote IDs as
historical without mutating the hashed artifact.

Run `npm run check-db` before resuming editorial work. Any quarantined row,
stage/spec mismatch, unexpected enabled or disabled user trigger,
controlled-routine overload, unsafe StorySpec/stage table, column, trigger, or
function grant, replay-marker shape, owner, FORCE-RLS, policy, rule, trigger,
inheritance, or ACL drift, other controlled-object owner drift or policy,
unsafe role-membership graph, missing/changed publication column, constraint,
primary key, stage FK, or index, generated publication column, or stale
identity/trigger/full publication-index fingerprint makes readiness fail. `npm run
check-story-spec-migration` executes promotion, stale rejection, retirement,
review-demotion and direct stage-status denial, hostile ACL cleanup, managed
role-graph drift, inherited stage-trigger rejection, stage/spec reconciliation,
orphan-stage rollback, forged FK metadata, owner/overload/disabled-trigger/
column/constraint/index/generated-column drift, and atomic cutover rollback in
embedded
PostgreSQL. It does not replace
managed-Supabase lock/concurrency, RLS/grant, rollback, role-catalog, and
service-role canaries. Deploy the guarded application, rerun
readiness and terminal-RPC canaries, then reopen story creation and editorial
work. Roll application code back without re-granting the legacy RPC, restoring
direct terminal writes, or restoring the nullable identity constraint.

## 2. Vercel

Set the environment variables: `PERSISTENCE=supabase`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `IP_HASH_SALT`, a separate required `TELEMETRY_ID_SECRET`, `TELEMETRY_FLOW_BINDING_ENABLED=true` after `0011`-`0016` pass verification, optionally dedicated `MATCH_RECOVERY_TOKEN_SECRET`, `ALTERNATE_STORY_TOKEN_SECRET`, `STORY_DELETION_TOKEN_SECRET`, and `ACCOUNT_DELETION_TOKEN_SECRET`, `CEREBRAS_API_KEY`, the canonical `CEREBRAS_BASE_URL`, and `ONWARD_PRODUCTION_RECIPE_ID=keyword-rerank-figure-library-50-2026-07-02`. Add `GEMINI_API_KEY` only when the selected promoted recipe uses Gemini embeddings. Do not use `LLM_PROVIDER`, model/tuning, `EMBEDDING_PROVIDER`, `RETRIEVAL_MODE`, or composer flags as production behavior controls; the selected manifest is authoritative and stale values are ignored. Vercel supplies `VERCEL_GIT_COMMIT_SHA`; another host must set `ONWARD_DEPLOYMENT_VERSION`. Run `npm run check-recipe-governance`, `npm run check-recipe-registry`, and `npm run check-recipe-deployment` before deploying. [`docs/production-recipe.md`](production-recipe.md) is generated from the same manifest the runtime reads and is the authoritative recipe/rollback procedure. The `0017` dispatcher is pure Postgres and adds no Vercel cron secret, webhook, or analytics destination. Production fails closed on an unknown selector, unsafe persistence, missing credentials, unapproved endpoints/timeouts, or missing deployment identity before provider or persistence work, while crisis resources remain available. Deploy; then walk the live flow once: landing → begin → story → negative feedback → alternate story → save card → email confirm → `/stories` → story delete confirmation → deletion success → `/account` → recent-sign-in/account delete confirmation → account-deleted success. Confirm the new session records the expected recipe manifest hash and deployment version, stale story URLs 404, the old JWT cannot authenticate, and a new intake creates a distinct guest account. Keep dispatch disabled while running the production `check-db` and schema/queue-health preflight. Only after the staging exercises and production checks pass may an operator call `set_telemetry_rollup_dispatch_enabled_v1(true)`. Confirm queue health reports `dispatch_enabled=true`, inspect `cron.job_run_details` for enabled dispatch and pruning, and disable the control before rollback or incident response. No dashboard may call the private daily-read candidate in this slice.

For telemetry deployments, set a dedicated `TELEMETRY_ID_SECRET`; Supabase/production mode has no fallback to `IP_HASH_SALT`, and reusing the salt is not supported. During rotation, configure `TELEMETRY_ID_PREVIOUS_SECRETS` before switching the current key and retain outgoing keys until every associated flow, event, and outbox retry is deleted or drained. Configure Vercel, proxy, and APM logging to redact `x-onward-telemetry-flow-id`, the short-lived `onward_entry_flow` handoff cookie, the two-minute `onward_auth_retry` challenge cookie, the ten-minute `onward_account_delete_reauth` continuation cookie, and the two-minute one-view `onward_account_delete_success` receipt; the application does not log any of them, but infrastructure retention must also stay within the reviewed lifecycle.

In staging, verify story-flow auth from a fresh signed-out browser: submit one
valid non-crisis intake, confirm the first `/api/match` response is `401` with an
HttpOnly `onward_auth_retry` cookie, and confirm the anonymous-auth retry creates
exactly one `auth_established:anonymous` row plus one outbox pointer. Replaying
the same request must not create a second unit. A second intake from the now
authenticated browser, standalone `/signin`, email confirmation/upgrade,
password setting, and saved-story access must create none. Repeat the crisis and
`STORY_CREATION_ENABLED=false` canaries and confirm they set no auth challenge,
register no flow, and emit no event. This check requires no migration beyond the
existing `0011` lifecycle/capture/outbox schema.
