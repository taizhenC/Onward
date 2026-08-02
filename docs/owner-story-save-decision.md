# Durable Owner-Story Save Decision

**Status:** Implemented in code; managed-Supabase canary pending
**Date:** 2026-07-27

## Decision

Save is an account-lifecycle transition, not a copy operation and not an
independent flag repeated on every Session.

Onward will keep one immutable `owner_story_save_states` row per permanent
owner:

- `anonymous_upgrade` records the exact database time at which a temporary
  anonymous owner became permanent;
- `legacy_permanent_observed` records only that an account was already
  permanent when the migration ran. Its `saved_at` is deliberately `NULL`
  because the original transition time is not recoverable.

`/signin` is returning-owner-only and sets Supabase
`shouldCreateUser: false`. A new permanent account is not a Save event: if any
unreviewed path creates one directly after this migration, it receives no
current Save State, projects as unavailable, and fails the database coverage
health gate. The initial-match boundary also rejects story creation for a
permanent owner without readable current-or-legacy Save evidence, before
telemetry activation, rate limiting, provider work, or persistence.

The current policy is `durable-account-save-v1-2026-07`. Legacy observations use
`legacy-pre-durable-save-v0`.

## Product states

| Product state | Authoritative evidence | Meaning |
|---|---|---|
| Temporary | Verified anonymous Auth owner and no Save State | Owner Stories follow the guest activity lifetime. |
| Confirmation pending | Browser has sent an email-change request, but Auth is still anonymous and no Save State exists | Still temporary; sending an email does not change retention. |
| Saved | Verified permanent Auth owner and a current Save State with `saved_at` | Existing and future Owner Stories follow the permanent owner lifecycle. |
| Legacy saved | Verified permanent Auth owner and `legacy_permanent_observed` | Stories follow the permanent owner lifecycle, but no historical save time is claimed. |
| Read unavailable | The Save State could not be read or validated | The UI makes no retention promise and offers an immediate retry. Story reading remains available. |
| Integrity unavailable | Verified Auth and Save State contradict each other | The UI must not make a retention promise or offer a Save transition from the contradictory state. Story reading remains available. |
| Deleted | Auth owner and state row are absent | Existing account deletion semantics remain authoritative. |

Completion is orthogonal. A temporary or saved Owner Story may still be open.

## Why the state is owner-scoped

The existing product promise is account-wide: confirming the email keeps the
same owner ID and all Owner Stories attached to it. Repeating `saved_at` across
every Session would introduce fan-out races with initial stories, alternates,
story deletion, guest cleanup, and account deletion. It would also require a
second transaction after Auth confirmation, leaving a window where the account
was permanent but its stories were not stamped.

An owner-scoped row is the deeper boundary:

- existing and future stories derive the same lifecycle without mutation;
- root and alternate stories cannot disagree;
- one FK cascade removes the state on account deletion;
- deleting one story does not undo the owner's account decision; and
- immutable StoryArtifact content and hashes remain untouched.

## Atomic transition

Migration `0022` installs a narrow trigger on `auth.users`:

1. an `is_anonymous: true -> false` update records `anonymous_upgrade`; and
2. `ON CONFLICT DO NOTHING` preserves the first evidence and timestamp.

The trigger inserts only the new owner-state row. It does not lock Sessions,
telemetry flows, or the account-deletion advisory key. This is important:
initial-story and account-deletion transactions already take their established
locks before reaching the Auth row. Taking those locks from an Auth trigger
would reverse the order and create a deadlock.

The table is forced-RLS and default-deny. Application roles cannot insert,
update, or delete it. The service role receives read access only. A separate
always-reject update trigger makes the first evidence immutable; account
deletion removes the row only through the Auth FK cascade.

## Rollout and legacy truth

The schema change is additive, but production rollout is a coordinated
cutover—not an unqualified schema-first deployment. The pre-guard application
can create a missing user from `/signin` and then create stories without Save
evidence, while the revised trigger intentionally ignores direct Auth inserts.

Before applying `0022` in production:

1. deploy the independently compatible `/signin` guard with
   `shouldCreateUser: false`;
2. set `STORY_CREATION_ENABLED=false`, verify ordinary `/api/match` requests
   return the reviewed 503, and wait at least the route's 60-second maximum
   duration so in-flight match requests drain; and
3. verify an unknown email submitted on `/signin` does not create an Auth user.

If that compatibility deploy is not possible, put the sign-in, Save, and story
creation surfaces behind a maintenance boundary for the entire cutover. The
migration transaction then:

1. create and secure the state table, helpers, and boolean-only health RPC;
2. take a late ten-second-bounded lock on `auth.users`;
3. add the owner foreign key only after that explicit lock, then install the
   Auth trigger;
4. backfill every already-permanent owner as `legacy_permanent_observed`;
5. release the lock at transaction commit; and
6. run the service-only health RPC before deploying the guarded reader.

The trigger is installed before the backfill while the Auth table is locked, so
no account can become permanent between those two operations. A 30-second
statement timeout also bounds each migration statement.

Deploy the full state-aware application only after every health flag is true.
Repeat the unknown-email and anonymous-confirmation canaries in production,
then re-enable story creation. Keep destructive direct-permanent and
story-creation rejection exercises in staging, followed by cleanup and a green
health check. Do not leave a pre-guard application live after the migration.

If the managed-Auth canary fails, first keep
`STORY_CREATION_ENABLED=false` and activate an edge maintenance boundary that
blocks every Save surface plus `/auth/confirm` email-change redemption. Verify
an already-issued pending confirmation link reaches maintenance and cannot
change `is_anonymous`; blocking only new link requests is insufficient. Only
then run `drop trigger onward_record_owner_story_save on auth.users;` and keep
existing state rows immutable. Keep confirmation maintenance and the
returning-only sign-in guard active until the reviewed trigger and full guarded
application are restored, every health flag is true, and confirmation canaries
pass. Remove confirmation maintenance only after that point. Never roll back to
a build that allows implicit signup, redeemable unguarded Save links, or
unguarded permanent story creation while public traffic is enabled. Permanent
owners without a row project as unavailable; any reviewed repair may backfill
only an honest `legacy_permanent_observed` row and must never fabricate
`saved_at`.

## UI contract

- The server projects Save State; browser Auth session inspection is not
  retention authority.
- Returning-owner sign-in cannot create a new account; new permanent ownership
  begins only through the informed guest Save action.
- A guest action is labeled as keeping all stories, because the decision is
  account-wide.
- “Check your email” explicitly says the stories are still temporary.
- The pending state names the destination email and lets the reader correct it
  or resend without abandoning the temporary owner.
- A transient state-read failure is distinct from a verified integrity
  contradiction and offers an immediate server refresh. The refreshed state
  moves focus to its resulting heading instead of dropping keyboard and
  assistive-technology context.
- Sign-in failures are focused alerts, and the sent-link result is a focused
  status message.
- Saved copy names generated wording and age as durable Owner Story data while
  retaining the fixed Recovery Context deadline.
- A missing or contradictory state never falls back to “saved.”
- Permanent owners without readable, coherent Save evidence cannot create a
  new indefinitely retained story; anonymous owners still create under the
  bounded guest lifecycle.
- `/stories` may show temporary owned stories, but must label the temporary
  account lifecycle and must not call an individual guest item a Saved Story.

## Deliberate exclusions

- This slice does not transfer temporary stories into an already-existing
  account. That needs a separate one-time ownership handoff design.
- It does not activate `story_saved` or `saved_story_reopened` telemetry. The
  durable state makes those producers possible, but the first event must be
  transaction-derived and reopen age must be computed from authoritative
  timestamps in a separate reviewed slice.
- It does not change the 60-day Disclosure/Recovery Context deadline.
- Provider retention, infrastructure logs, backup/PITR deletion behavior,
  legal notice, launch-market review, and youth review remain external P0-14
  gates.
