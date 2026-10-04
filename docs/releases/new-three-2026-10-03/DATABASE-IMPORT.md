# Three-story draft import completed

Completed October4,2026 at00:33:27 UTC, October3 in America/New_York. The production database now contains the exact new Franklin, Slocum and Somerville figures, matching stages and StorySpecs as drafts.

The operation inserted only absent rows in foreign-key order, with no existing-row update. It used the independently audited importer and final frozen inputs. Actual full-document readbacks match all three candidate and stage files. The saved reviews remain empty; all publication and retirement timestamps for the new drafts are null.

| Catalog | Before | After |
|---|---:|---:|
| Figures |60|63|
| Stages |60|63|
| StorySpecs |61|64|
| Published StorySpecs |44|44|

Every preexisting selected catalog field and all StorySpec lifecycle timestamps remain unchanged. The immutable original baseline and unique attempt baseline have the same SHA-256 for this first successful attempt. Both exact paths and hashes are recorded in the [database receipt](DATABASE-RECEIPT.json); complete baseline rows stay in ignored local working storage.

Draft insertion does not make these stories available to readers. Owner review and a qualified matching content release still precede guarded publication. The prior ten-story exception is not extended to this batch.
