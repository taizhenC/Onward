# Ten stories published

Publication completed at `2026-10-03T01:51:42.036Z` in the pinned production database. All ten exact authorized StorySpecs and matching stages are published: Addams, Blackwell, Darwin, Equiano, Grant, Jacobs, Keller, Riis, Seacole and Washington. The catalog now contains **44 valid published StorySpecs and 44 published stages, with zero quarantine**. The prior 34 full publications and unrelated catalog rows remain unchanged.

The reduced [database receipt](DATABASE-RECEIPT.json) has SHA-256 `5f34fe8f5db84a4c0c61512706f1f2ecea09aa0bac54cfc14bde7debfa8fc192`. Independent [post-publication verification](POST-PUBLICATION-20261003T015418Z.md), observed at `2026-10-03T01:54:18.045Z`, confirmed all ten exact canonical documents, narrow source attribution, owner review, v2 matching metadata and lifecycle fields against pinned inputs and local archived readbacks. Its reduced receipt SHA-256 is `f67d099a2493a85e6adcfd4f1756d1420acd9a47289eb4aaf2a4d858f1aadd22`. That verification used exactly three bounded curated-table GETs, with no Auth, reader, provider or mutation access.

## Deployment and publication

[PR #146](https://github.com/taizhenC/Onward/pull/146) merged at `2026-10-03T01:47:36Z`, with commit `e65edfc23000b8407fc74e35287d88b7b9f1f5a0`. The [merge receipt](CODE-FIRST-MERGE.json) retains the acknowledged matching and security failures. The [code-first Vercel Production deployment](DEPLOYMENT-code-first-e65edfc23000b8407fc74e35287d88b7b9f1f5a0.json), `6821822272`, succeeded at `2026-10-03T01:49:10Z` for that exact SHA. The ten remained drafts until after this code deployment.

The guarded [metadata update](OWNER-STAGE-V2-UPDATE-RECEIPT.json) completed at `2026-10-03T01:50:54.513Z`, changing only ten approved factual summaries and the exact Jacobs/Riis theme additions. All StorySpecs, lifecycle timestamps, prior publications and unrelated catalog were preserved. The [publication start](OWNER-PUBLICATION-START.json) binds the real selection/baseline hashes, exact owner authorization and failed evidence. Each terminal promotion used the complete receipt-pinned reviewed document through `promote_story_spec_v2`, atomically publishing its stage/spec pair.

All [twenty-two post-publication database health checks](OWNER-HEALTH-2026-10-03T01-54-16-224Z.json) passed. Their temporary process-only telemetry probe secret does not prove production worker telemetry-secret configuration; no environment setting was changed for that probe.

## Exact owner exception

The owner's instruction was, “I checked it, publish those into the production.” The [authorization](OWNER-AUTHORIZATION.json) is pinned to `454ea8a5eb1cba3c595d5824230cc2e5f1f4295bd6dae9e79c7958c3739a31d8`; the [owner-release receipt](OWNER-RELEASE-RECEIPT.json) is pinned to `4d8ea478a834b0e318452bfaf2191f9c5a30248f6cee4b5b4a288a0df916fc96`.

This scoped owner decision accepts the actual failed matching result—96/101 positive matches, one wrong definitive positive match, two of three misses detected—and the unchanged development-dependency advisory GHSA-vfj7-8cjw-p6xm with five high audit entries. The real trust gate remains false, the standard audit remains failed, and the recipe selection/implementation, thresholds, gold labels, immutable evidence, canonical prose and sources remain unchanged. One owner occupies the three required editorial schema roles; no independent human reviewers are invented.

## Remaining live verification

**Post-publication worker refresh and the live-serving canary are still pending at this checkpoint.** The production stage cache is loaded once per worker process. A second successful Production deployment after publication must refresh workers, then the unchanged [one-attempt canary](LIVE-CANARY-PLAN.md) must prove the exact refreshed worker SHA and new Blackwell story through ordinary matching, delivery, source display, progress and owned guest cleanup. Database publication and the earlier deployment do not establish this live-route result.

Keller's age-six episode is published but remains outside the current adult intake's age gate. Publishing ten rows does not make every episode selectable by adults. The earlier hold, failed evaluations and partial supplemental diagnostics remain preserved; no new evaluation pass is claimed.
