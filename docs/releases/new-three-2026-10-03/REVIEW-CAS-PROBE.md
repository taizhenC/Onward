# Publication concurrency guard

Actual read-only production probes confirmed that PostgREST exposes and filters the target's PostgreSQL xmin row version: the observed version selected one row, while a different version selected zero. The full-document query filter returned HTTP 400 at 39,939 bytes; it will not be used.

The publisher selects xmin with the complete row, compares all source and lifecycle fields to the frozen owner-approved draft, and guards the review update by that immediate version. A concurrent update creates a new row version, so the guarded update must return zero and stop. The existing publication RPC receives the complete reviewed document and compares it under lock. Neither test mutated the database.

[PostgreSQL system columns](https://www.postgresql.org/docs/17/ddl-system-columns.html) documents xmin as the creating transaction of the row version. It is used only for immediate concurrency control. Probe receipt SHA256: 1019c9c862b56b2e243f1b41b927bb29b47e8068285407dd0c6cd88d16b88766.
