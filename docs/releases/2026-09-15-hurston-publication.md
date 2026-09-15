# Hurston — reviewed replacement published

September 15, 2026. The owner confirmed reading the exact replacement and
requested publication. This releases only Hurston; Coleman, Coltrane and
Jones remain held for the source/scene gaps in the
[repair packet](wave-3-repairs-2026-09-15/README.md).

## Exact approved text

- StorySpec: `hurston:1917-1921-sixteen-again:v1`.
- Candidate: [frozen replacement JSON](wave-3-repairs-2026-09-15/hurston-1917-1921-sixteen-again-v1.candidate.json).
- SHA-256: `c29d7856a483ff106cfb0f2ad45f0851c8176b4d08dc020a0931f4f396ade51e`.
- [Reading copy](wave-3-repairs-2026-09-15/READING-COPY.md): seven passages, 342 words.
- Actual owner reviewer: `taizhenC`, recorded in research, historical and tone
  roles; content profile reviewed. Stored review time:
  `2026-09-15T06:17:39.758Z`.

Approval applies to this exact new college-transition story, including its
content note, sparse 20-word response/32-word turn, and disclosed difference
between narrative ages 26–28 and installed matching ages 26–30. It is not a
claim that the miniature reaches the soft four-to-five-minute aim. Matching
configuration remains unchanged; any library correction requires a separate
evaluated release. No additional human reviewer was invented.

The original September 14 draft and the replacement's frozen review packet
remain unchanged. Their draft status and empty saved review metadata are
historical authoring snapshots, not current production status. No approval
was copied from the superseded text, and no prose changed after this review.

## Promotion and database verification

Preflight confirmed the established production project
`mbcqkljfekkxlgittzal.supabase.co`, the target's draft state, 17 valid
published historical stories, zero quarantined, and every publication-schema
health check. An independent read-only preflight verified the exact candidate
hash, all seven reading-copy passages and the required-hash batch validator.
The promotion dry run passed without errors or warnings.

A scoped editorial backup was saved before mutation:
`.codex-recovery/hurston-production-before-2026-09-15.json.gz.b64`.
Its uncompressed SHA-256 is
`6fc14c6eb2df374086e11bd25597f1acab866613602ec6a854490e8ab433f3dc`.
It covers the selected editorial rows/stage and prior public editorial
catalog, not reader accounts, disclosures or saved artifacts.

The existing `promote-candidate.ts` helper stored the confirmed owner review.
The normal `story-spec:status -- publish` command then called
`promote_story_spec_v2` with the complete expected reviewed snapshot.
The read-back at `2026-09-15T06:17:55.245Z` confirmed:

- Hurston's StorySpec and stage are published, with exact approved prose and evidence.
- All earlier 17 published records are unchanged.
- The catalog contains 18 valid historical stories, zero quarantined; stage
  and StorySpec publication inventories agree.
- Matching-stage content and every publication-schema health check are unchanged/healthy.

The local read-only audit and receipt are
`.codex-recovery/hurston-audit-2026-09-15.ts` and
`.codex-recovery/hurston-production-receipt-2026-09-15.json`.
No blanket seeding, schema update, recipe selection, library release, direct
stage-status update or manual retirement was performed.

## Production deployment and complete reader check

[PR #129](https://github.com/taizhenC/Onward/pull/129) was made ready and merged
at `2026-09-15T06:18:00Z` after its CI, recipe-promotion checks and preview
passed. Merge commit `fb1467a9975d17efe21396e3626ce3ccab6cec71` reached
successful GitHub Production deployment `6452946159` at
`2026-09-15T06:19:01Z`. This refreshed the load-once editorial cache after
the database promotion. No recipe authority check was bypassed.

A fresh anonymous canary followed the normal
[production reader](https://onwardapp.me) with the existing adult Hurston
evaluation fixture (age 28). Fixture validation ran before Auth/provider
calls. The match opened directly, without recovery or forced figure selection.
The reader completed **all seven passages in 12 chunks**, with every progress
acknowledgement checked. All seven texts matched the approved canonical
passages after whitespace normalization; this is not a claim of byte-identical
paragraph formatting. Match, reader-page, chunk and acknowledgement requests
succeeded with HTTP 200.

The successful run completed at `2026-09-15T06:19:32.700Z`. Its single test
guest and test story were removed through the normal CSRF-protected account
deletion route after rechecking that the identity was the anonymous guest
created by this process. The operator's account was never used. No reader
identifiers, Auth tokens or credentials are stored in the receipt.

A final scoped database check at `2026-09-15T06:20:10.350Z` reconfirmed
18 valid published stories, zero quarantined, exact Hurston prose/evidence,
unchanged earlier 17 records and matching content, and healthy publication
schema. Local evidence:

- `.codex-recovery/hurston-reader-canary-2026-09-15.ts`.
- `.codex-recovery/hurston-reader-canary-receipt-2026-09-15.json`.
- `.codex-recovery/hurston-production-post-canary-2026-09-15.json`.

Local lint, typecheck and snapshot validation passed. No runtime, recipe,
schema, matching or historical snapshot file changed during publication.
If an actual content concern requires removal, use the audited retirement
path; never overwrite a published/retired snapshot or a saved reader artifact.
