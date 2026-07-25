# Onward Safety and Content Incident Runbook

## Scope

Use this runbook for a crisis-flow failure, sensitive-data exposure, unsupported or harmful story content, unsafe provider behavior, or a broken deletion/retention control.

Onward is not an emergency service. Team members do not contact a user from an intake disclosure. Crisis disclosures are intentionally not stored, so they cannot and must not be reconstructed for debugging.

## Immediate controls

1. Set `STORY_CREATION_ENABLED=false` in the affected environment. Crisis resources remain available; non-crisis requests return a quiet 503 and persist nothing.
2. If one stage is affected, remove it from the published content set. A dedicated per-stage runtime flag remains part of P0-15.
3. If one provider or recipe is affected, keep new creation disabled while selecting an already registered, compatible rollback with `ONWARD_PRODUCTION_RECIPE_ID`. Do not try to reconstruct the old keyword/canonical posture with legacy provider, retrieval, model, tuning, or composer environment flags.
4. Never paste disclosures, prompts, provider bodies, raw exceptions, or generated sensitive text into tickets, chat, logs, or this incident record.

## Roles

- **Incident commander:** engineering on-call; owns containment and timeline.
- **Safety owner:** reviews crisis behavior and user-facing safety copy.
- **Editorial owner:** reviews historical support, tone, and stage withdrawal.
- **Privacy owner:** determines exposure scope, deletion, notification, and legal escalation.
- **Release owner:** authorizes re-enabling story creation.

## Safe triage record

Record only incident timestamps, deployment/recipe IDs, affected route or stage ID, provider/validator version, safe error classes, counts, coarse latency/fallback buckets, containment actions, reviewers, and restoration evidence.

Never record intake text, semantic user tags, query embeddings, prompts, model responses, raw exception objects, or ranked candidate lists.

## Crisis-flow incident

1. Confirm crisis classification still happens before the kill switch, rate limit, persistence, embeddings, and LLM calls.
2. Run `npm run eval-crisis`; any critical false negative keeps story creation disabled.
3. Run smoke and verify crisis input changes no session count.
4. Verify resource actions against their linked official pages and update `crisisResourcesReviewedAt`.
5. Obtain the designated safety review before restoration.

## Historical, tone, or privacy incident

1. Disable new creation or the affected stage.
2. Use only figure/stage/beat or future fact IDs in the incident record.
3. Have the appropriate editorial, historical, safety, and privacy owners decide correction, retirement, deletion, and notification.
4. Add a regression case that reproduces the failure without copying a real disclosure.

## Restoration gate

Restore story creation only after the failing regression passes; lint, typecheck, figure validation, crisis eval, smoke, and isolated production build pass; the deployed selector resolves to the intended registered recipe; required reviewers approve; rollback remains available; and monitoring covers the safe failure signal. A new recipe is not an incident shortcut: promotion still requires the protected evidence/attestation path and the strict, up-to-date `CI / verify` plus `Recipe Promotion Authority / recipe-promotion-gate` checks. Until the private-repository plan supports enforcing those controls, keep promotion disabled and use only a previously approved compatible rollback.
