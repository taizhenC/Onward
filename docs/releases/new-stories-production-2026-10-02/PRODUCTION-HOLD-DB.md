# Production database hold verified

The bounded `verify-hold.ts` check completed successfully against the pinned production Supabase host `mbcqkljfekkxlgittzal.supabase.co`. It used the existing root environment and made exactly three GET requests, one each to `figures`, `figure_stages` and `story_specs`. It made no mutation, Auth, reader/account or provider request.

The reduced `PRODUCTION-HOLD-DB.json` receipt has SHA-256 `c49b75ff521c7a03c6a9ef477081511bc4e8622c6e780d1f9c30436fa526670f`. Its observed timestamps, checked field lists, pinned inputs, query bounds and before/current canonical hashes are the evidence for this checkpoint.

| Observation | Verified result |
| --- | ---: |
| Historical figures | 60 |
| Historical stages | 60 |
| Story specifications | 61 |
| Published specifications, raw and valid | 34 / 34 |
| Quarantined published specifications | 0 |
| Published stages | 34 |
| Exact finished-writing draft targets | 10 |
| Database mutations | 0 |

All ten new current draft stage rows equal their exact original finished-writing stage files. All ten draft specification rows and full `spec` documents equal their pinned finished-writing candidates, with empty review metadata. Their current `published_at` and `retired_at` values are null. Neither the proposed v1 theme additions nor the v2/v3 experimental metadata has been applied in the database.

All sixty figure-metadata rows remain exact. Excluding the ten written targets, all fifty stage rows and fifty-one specification rows remain equal to `WRITING-DB-BEFORE-UPDATE.json` over its captured fields. This includes exact equality for all thirty-four previously published stages and full specification documents, including their captured status and editorial review fields. Production still serves the same thirty-four valid published specifications, with no quarantine.

The before-update baseline does not contain a capture timestamp or `created_at`, `published_at` or `retired_at` fields. The receipt explicitly records that limitation and does not invent an earlier timestamp or claim historical lifecycle-field equality. Current lifecycle fields were queried only for today's observation; new draft publication/retirement values were checked as null. The separately captured initial-baseline timestamp cannot substitute for an uncaptured before-update timestamp.

The checker rejects another host, unexpected arguments, changed source pins, oversized responses, more than one hundred rows per table, invalid count headers and failed draft/publication integrity checks. Bounds are three requests, no retry, fifteen-second complete-response deadlines and four MiB per response. Raw database rows remain in memory. Only hashes, field names, public historical identifiers, counts, draft status and check outcomes are saved; no credential or reader disclosure is printed.

Full TypeScript and scoped ESLint checks passed before the read-only run. This receipt verifies the production hold; it does not authorize publication, claim a passing matching gate or establish a deployment. The mandatory matching failures remain grounds to preserve a draft release without merge or production publication.
