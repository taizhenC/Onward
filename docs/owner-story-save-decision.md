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
- `permanent_account_created` records a permanent account that was created
  directly; and
- `legacy_permanent_observed` records only that an account was already
  permanent when the migration ran. Its `saved_at` is deliberately `NULL`
  because the original transition time is not recoverable.

The current policy is `durable-account-save-v1-2026-07`. Legacy observations use
`legacy-pre-durable-save-v0`.

## Product states

| Product state | Authoritative evidence | Meaning |
|---|---|---|
| Temporary | Verified anonymous Auth owner and no Save State | Owner Stories follow the guest activity lifetime. |
| Confirmation pending | Browser has sent an email-change request, but Auth is still anonymous and no Save State exists | Still temporary; sending an email does not change retention. |
| Saved | Verified permanent Auth owner and a current Save State with `saved_at` | Existing and future Owner Stories follow the permanent owner lifecycle. |
| Legacy saved | Verified permanent Auth owner and `legacy_permanent_observed` | Stories follow the permanent owner lifecycle, but no historical save time is claimed. |
| Integrity unavailable | Auth and Save State contradict each other or the state cannot be read | The UI must not make a retention promise. Story reading remains available. |
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

1. a permanent Auth-user insert records `permanent_account_created`;
2. an `is_anonymous: true -> false` update records `anonymous_upgrade`; and
3. `ON CONFLICT DO NOTHING` preserves the first evidence and timestamp.

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

The migration is additive and schema-first:

1. create and secure the state table, helpers, and boolean-only health RPC;
2. take a late ten-second-bounded lock on `auth.users`;
3. install the Auth trigger;
4. backfill every already-permanent owner as `legacy_permanent_observed`;
5. release the lock at transaction commit; and
6. run the service-only health RPC before deploying the state-aware reader.

The trigger is installed before the backfill while the Auth table is locked, so
no account can become permanent between those two operations. A 30-second
statement timeout also bounds each migration statement.

A pre-`0022` application remains functional after the migration. It will keep
using Auth as before; the database starts recording the missing lifecycle
evidence. Deploy the state-aware UI only after the live health gate passes.

If the managed-Auth canary fails, run
`drop trigger onward_record_owner_story_save on auth.users;` and keep existing
state rows immutable. Permanent owners without a row automatically project as
unavailable. When the reviewed trigger is restored, any permanent owner not
covered by exact transition evidence may be backfilled only as
`legacy_permanent_observed`; never fabricate `saved_at`.

## UI contract

- The server projects Save State; browser Auth session inspection is not
  retention authority.
- A guest action is labeled as keeping all stories, because the decision is
  account-wide.
- “Check your email” explicitly says the stories are still temporary.
- Saved copy names generated wording and age as durable Owner Story data while
  retaining the fixed Recovery Context deadline.
- A missing or contradictory state never falls back to “saved.”
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
