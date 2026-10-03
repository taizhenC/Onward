# Ten written Onward stories — October 2, 2026

This packet contains the new reading copies written after the [research and first draft insertion](../new-stories-2026-10-02/README.md). Each finished story is saved separately when its author completes it. The earlier research documents and database receipt remain intact.

All ten stories are written, independently reviewed, and saved to their existing database drafts. They contain **7,302 words across 70 passages**, with each story between **704 and 801 words**. Each document includes the full story, sources, evidence qualifications and exact input hashes.

The standard is [the Onward story recipe](../../../prompts/story-recipe.md): seven passages, 700–950 words, source-grounded moments, concrete anchors, plain measured sentences, anonymity until the final bridge, and a bounded address to the reader. Passage budgets are targets; their departures are measured and assessed alongside source and craft review. No fictional event, motive or dialogue is added to fill a target.

## Reading documents

| Figure | Words | Finished reading copy |
| --- | ---: | --- |
| Jane Addams | 747 | [Addams](addams.md) |
| Elizabeth Blackwell | 709 | [Blackwell](blackwell_e.md) |
| Charles Darwin | 726 | [Darwin](darwin.md) |
| Olaudah Equiano | 714 | [Equiano](equiano.md) |
| Ulysses S. Grant | 704 | [Grant](grant.md) |
| Harriet Jacobs | 801 | [Jacobs](jacobs.md) |
| Helen Keller | 725 | [Keller](keller.md) |
| Jacob Riis | 718 | [Riis](riis.md) |
| Mary Seacole | 748 | [Seacole](seacole.md) |
| Booker T. Washington | 710 | [Washington](washington_b.md) |

## Verification and database drafts

The [database receipt](DATABASE-RECEIPT.json) records the completed replacement and exact read-back of all ten StorySpecs and their matching stages. Counts remain 60 figures, 60 stages and 61 StorySpecs. Figure metadata and every unrelated catalog row matched the immediate pre-update snapshot. All ten remain draft with empty review metadata; the 34 published stories were unchanged.

The [verification report](VERIFICATION.json) records zero errors and warnings for strict draft validation and the in-memory publication simulation, exact canonical composition, serialized replay, one-or-two-paragraph reading steps, word counts and sentence measures. TypeScript checking and full ESLint passed after the final source and formatting corrections. Simulated reviewer identities were never saved.

Independent source and craft reviews pin the final input hashes: [education](CROSS-REVIEW-EDUCATION.md), [vocation](CROSS-REVIEW-VOCATION.md), [Riis/Jacobs/Equiano](CROSS-REVIEW-RESILIENCE.md), and [Seacole](CROSS-REVIEW-SEACOLE.md). Every required correction was closed before the database update. Retrospective testimony, approximate ages, unrecorded locations and potential recognition by familiar readers remain qualified in the documents. Addams has one explicitly disclosed inert posture sentence; the other stories contain no invented texture. Short target departures, particularly Riis’s 57-word turn, are retained where the sources do not support a longer moment.

All 22 post-update database checks passed; see [database health output](DATABASE-HEALTH.txt). Local configuration still lacks `TELEMETRY_ID_SECRET`, so the non-writing health probes used a random temporary process-only test secret. No environment file was edited. This check does not establish a configured production telemetry secret.

The packet verifier is [check-and-update.ts](check-and-update.ts). Its default mode checks the local candidates, matching stages and exact reading documents; measures total length, passage targets, paragraph counts and sentence rhythm; runs strict draft validation and a publication simulation in memory; and verifies canonical composition and serialized replay. It does not save simulated reviewer metadata.

```powershell
node --import tsx docs/releases/new-stories-written-2026-10-02/check-and-update.ts
```

The separate `--write` mode requires final independent-review hashes and the captured original draft baseline. It rejects changed or reviewed targets, rechecks each row before updating, uses draft and content guards, reads back every target, and verifies all figure metadata and unrelated catalog rows against the immediate pre-update snapshot. It supports exact-input recovery from a partially completed update. The sequence is not a ten-story database transaction; all affected rows remain draft throughout.

Publication review remains separate. This writing packet does not change the installed library, matching routes, recipe manifests or public story availability.
