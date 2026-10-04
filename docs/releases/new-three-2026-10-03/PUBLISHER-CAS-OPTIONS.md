# Draft-to-review CAS transport options

This addendum preserves [the initial publisher plan](PUBLISHER-PLAN.md). The new owner authority is now frozen at SHA-256 `d1a594f62b55c01600071c9fc88f2f739d0ece077aededcb5e8a869bafbf7018`, recorded 2026-10-04T03:53:26.148Z. ROOT and managed authority bytes match. The instruction and exact three candidate/stage/reading/source/failure pins are unchanged. No publisher or deployed API was called by this reviewer.

Local serialization of the exact pinned drafts gives:

| Figure | Compact JSON bytes | Full-equality URL characters before other guards |
| --- | ---: | ---: |
| franklin_b | 30755 | 39840 |
| slocum_j | 31637 | 40952 |
| somerville_m | 30806 | 39895 |

The first option remains complete draft JSON equality on the review PATCH. Root's bounded read-only HEAD/count probe can establish actual gateway and predicate support before a write; local sizes alone cannot prove a deployed limit.

A possible smaller no-schema alternative is an observed `xmin` guard. PostgreSQL defines `xmin` as the creating transaction ID for a row version and each update creates a new version. This supports the inference that matching an immediately observed row version can reject an intervening row update. It does not establish that deployed PostgREST exposes or filters this system column. Root can test a single exact curated target using `select=story_spec_id,xmin` and, if supported, a tiny `xmin=eq.<observed xid>` predicate. Read the complete exact draft/lifecycle before the CAS, validate the version value, retain identity/status/null-publication/null-retirement predicates, and verify the full readback. Use a fresh observed version per immediate transition; do not turn transaction IDs into durable identities. [PostgreSQL system columns](https://www.postgresql.org/docs/17/ddl-system-columns.html).

The existing public RPC inventory has promotion, retirement and publication health, with no body-based draft-review CAS function. PostgREST's table filters live in URL predicates, whereas RPC JSON body fields become arguments to exposed functions. There is no source-supported reason to assume that moving the full expected JSON into an ordinary PATCH body makes it a filter. [Tables and Views](https://postgrest.org/en/stable/references/api/tables_views.html), [Functions as RPC](https://postgrest.org/en/v14/references/api/functions.html).

If the full predicate transport and `xmin` support both fail, the parent permits a serialized compact-guard fallback with explicit qualification. Exact full pre/post reads, lifecycle/identity/canonical/empty-review predicates, immutable review evidence and the existing complete reviewed-spec promotion CAS preserve the approved publication boundary under the one-operator window. This is **not a full draft-document atomic CAS** and does not prove that an unguarded evidence edit could not be overwritten in the read-to-PATCH interval. Do not describe it as such. The parent must choose the supported mode and pin that mode/limitation in its receipts.

Do not assume native `If-Match`/ETag enforcement: the primary PostgREST [ETag feature issue](https://github.com/PostgREST/postgrest/issues/1176) remains open. No insert/upsert, temporary content rewrite, admin SQL, schema change or pg_catalog exposure is proposed. All original baseline, unrelated-row, exact-three, failure-evidence and retry requirements from the initial plan remain in force.

The [structured options](PUBLISHER-CAS-OPTIONS.json) distinguish measured local facts from unverified deployed capabilities. Actual transport responses and final helper code await root handoff.
