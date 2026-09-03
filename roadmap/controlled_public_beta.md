# Controlled Public Beta Release Contract

**Decision date:** August 10, 2026
**Status:** Current authoritative execution scope
**Release shape:** Invite-only, capped, adults-only beta in one approved market

## Product decision

Onward will stop expanding the platform and prove its core promise:

> An adult can share a difficult moment, receive a documented human parallel
> that feels meaningfully close, and read it in a calm, trustworthy experience.

The 43-item roadmap remains a useful long-term product reference. It is no
longer a commitment to implement every item before learning from real readers.
For this release, “done” means the launch-critical code below is merged and the
seven external gates have direct evidence. Deferred work does not keep the
engineering goal open.

## Fixed beta scope

- Adults ages 18–100 only, until youth safety, consent, and privacy review is
  complete.
- One launch market with reviewed crisis resources, privacy terms, and a named
  operator.
- Invite-only or capped access aligned to the situations covered by the
  published StorySpec collection.
- The approved keyword-plus-reranker recipe. FacetsRAG remains dormant because
  current evidence shows it performs worse.
- Only reviewed, published StorySpecs. Draft or malformed content remains
  unavailable rather than falling back to unreviewed prose.
- The current bounded opening and canonical story artifact. No promotion of the
  personalized-preface challenger or broader generative prose.
- Existing intake story limits, inherited unchanged by “Try another.” Readers
  do not edit alternate-story limits in this release.
- Existing private feedback, deletion, save, source, and reader flows.

## Launch-critical engineering closure

| Priority | State | Item | Release evidence |
|---|---|---|---|
| P0 | Complete | [Bug Fix] Block high-severity dependency advisories | `nanoid` is pinned to 3.3.18; `npm run audit:high` reports no high or critical advisory. The remaining `esbuild` advisory is low severity and limited to the Windows development server. |
| P0 | Complete | [Bug Fix] Enforce adult-only beta eligibility | Shared client/server validation accepts ages 18–100; the intake explains eligibility before disclosure; the privacy guide states that minors are excluded pending review. Crisis resources remain reachable before validation or sign-in. |
| P0 | Complete | [UI/UX] Close core accessibility failures | Quiet text is at least 4.5:1, the landing page has one main landmark and a coherent heading hierarchy, the hero example is static, the story reader honors reduced motion, and Space retains native scrolling. `check-core-accessibility` is required in CI. |
| P0 | Complete on `main` | [Bug Fix] Preserve the trust and ownership baseline | Crisis interception, anti-echo validation, hard story boundaries, honest no-close recovery, immutable artifacts, reader acknowledgement, returning-owner-only sign-in, save state, story/account deletion, retention contracts, and production recipe selection already have code-owned regression gates. |

No additional architecture refactor is justified before the beta. The current
modular Next.js/Supabase application is sufficient at the intended cap.

## Seven gates that still block invitations

These tasks require editorial judgment, qualified reviewers, managed-service
access, or production authority. They cannot be completed truthfully by adding
more repository code.

| # | Priority | Required task | Minimum acceptable evidence | Owner |
|---|---|---|---|---|
| 1 | P0 | [Feature] Research, review, and publish the launch StorySpec set | Prefer 20 fully evidence-mapped stories. A smaller set is allowed only when recruitment is explicitly restricted to its documented age/situation coverage. Every published spec needs exact or bounded sources, sentence evidence, fact/entity/quote/chronology closure, content flags, and named historical and tone approvals. | Editorial/research lead + independent historical reviewer |
| 2 | P0 | [Feature] Run a small blinded private-alpha quality check | At least 20 consented target-reader sessions across the intended beta coverage; review every delivered artifact; observe zero unsupported factual claims, privacy echoes, critical safety/tone failures, boundary violations, and definitive wrong hard-confusion matches. Report completion and feedback response without presenting this small sample as statistical proof. The formal 150-session/75-response protocol remains the gate for broad self-serve release, not beta entry. | Product/research + target-reader panel |
| 3 | P0 | [Bug Fix] Approve the safety policy for one market | Qualified review of crisis language and dated resources; a written decision on negated/third-person over-triggers; browser evidence that an intercepted crisis request creates no auth user, session, provider request, or stored disclosure; named incident and content-retirement owners. | Qualified safety reviewer + product owner |
| 4 | P0 | [Refactor] Complete the managed Supabase rollout and narrow correctness drill | Apply migrations 0001–0024 schema-first, seed only approved content, publish the reviewed subset, and pass `npm run check-db`. Prove cross-owner reads fail closed, progress double-submit converges, story/account deletion cascades, guest/disclosure/feedback cleanup runs, one StorySpec can publish and retire, and rollback leaves story creation paused safely. | Database/release operator |
| 5 | P0 | [Feature] Configure and canary production Auth/email | Anonymous sign-in, production URL allowlist, custom SMTP, and all `token_hash` templates configured. Canary guest creation, Save/email upgrade, returning sign-in without account creation, recovery, cross-device access, and account deletion. | Auth/release operator |
| 6 | P0 | [Feature] Publish the actual privacy and operating policy | Name the controller/operator and privacy contact, provide a rights-request path, approve market terms, confirm provider retention/ZDR, redact sensitive flow headers/cookies from infrastructure logs, bound log retention, and document backup/PITR deletion or non-restoration behavior. | Product owner + privacy/legal reviewer |
| 7 | P0 | [Refactor] Perform one guarded production canary and rollback | Green remote CI and Vercel build; valid production recipe/deployment checks; one complete live flow; alerts for recipe-invalid and story-creation failures; verified story kill switch; successful rollback-selector drill; signed go/no-go record with no open critical safety, privacy, factuality, data-isolation, deletion, or accessibility defect. | Release owner + product owner |

## Explicitly deferred

The following work is useful later but unnecessary for this beta:

- P1 [Feature] Editable alternate-story boundaries and boundary commitments. The
  shipped alternate already inherits the original limits exactly.
- P1 [Refactor] FacetsRAG, facet-tagger activation, dynamic retrieval weights,
  vector infrastructure, or another retrieval architecture.
- P1 [Feature] Personalized-preface v2 promotion, full-beat regeneration, or more
  generative story prose.
- P1 [Feature] Publishing all 50 drafts, adding more figures, or building an
  editorial workbench before the launch subset is reviewed.
- P1 [Feature] Advanced cohorts, rollup dashboards, broad product analytics, or
  enabling the telemetry dispatcher beyond minimum incident monitoring.
- P1 [UI/UX] A comprehensive design-system rewrite, all-screen visual polish, or a
  broad E2E framework. Run the bounded manual accessibility matrix instead.
- P1 [Refactor] Paid-plan branch-protection work or additional promotion machinery.
  Preserve PR review and green CI with the repository controls currently
  available.
- P1 [Feature] The formal 150-session/75-response benchmark before beta entry. Use
  the capped beta to gather that evidence before broad self-serve release.
- Every other item keeps its single P1 or P2 priority and type in
  `backlog.md`; all remain outside the controlled-beta engineering goal.

## Stop rule

After the engineering closure above is merged, do not start another feature or
refactor under this goal. The next valid work is execution of gates 1–7 by their
named owners. If one of those drills reveals a concrete defect, open a narrowly
scoped bug-fix branch for that defect only.
