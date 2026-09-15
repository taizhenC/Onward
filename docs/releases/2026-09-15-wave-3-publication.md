# Wave 3 — five approved stories published

September 15, 2026. The owner confirmed review of the exact wave-three texts
and content notes, then requested publication and further repair of the four
held stories. This receipt covers only the five approved, unchanged candidates.
It does not record advance human approval for new prose written during repair.

## Published subset

Faraday, Ella Fitzgerald, Katharine Graham, Langston Hughes and Sofia
Kovalevskaya were published through the existing reviewed StorySpec workflow.
The actual owner, `taizhenC`, is recorded in the research, historical and tone
roles, with the confirmed content-profile review. No additional human reviewer
or co-author was invented.

| StorySpec | Frozen candidate SHA-256 | Review timestamp (UTC) |
|---|---|---|
| `faraday:1812-1815-bottle-washer-and-valet:v1` | `42d6334dc0b6935e7eeba43ec0371756088958c5065369382778cb765384048c` | `2026-09-15T05:56:22.174Z` |
| `fitzgerald_e:1932-1934-streets-to-amateur-night:v1` | `0bad16690950606624abf0d9c8af59d867cdd3be2c186cab9b3da9dd690fee7b` | `2026-09-15T05:56:24.716Z` |
| `graham:1963-1971-thrust-into-the-chair:v1` | `fcc977a8c65ec59a0eb5b2a4615a837ff410395107ccc77af4c67f2ddd00dbc2` | `2026-09-15T05:56:27.076Z` |
| `hughes:1920-1926-fathers-deal-to-first-book:v1` | `4221485861e7c44b2f3347551b0dba26d32a1084d50413f5ce7ea425dea08454` | `2026-09-15T05:56:29.427Z` |
| `kovalevskaya:1868-1874-fictitious-marriage-to-doctorate:v1` | `0f0c8255664fa5686db983e4e8fe19dbedbf4fc4c259ddc97d7de0ac4230d33d` | `2026-09-15T05:56:31.775Z` |

The original [nine-story packet](wave-3-drafts-2026-09-14/README.md), its
[reading copy](wave-3-drafts-2026-09-14/READING-COPY.md) and candidate hashes
remain unchanged as the exact reviewed source. The files remain draft
snapshots; only production review/status metadata differs.

## Verified database result

Fresh read-back at `2026-09-15T05:56:34.464Z` confirmed all five selected
StorySpecs and their stages published, exact canonical prose and evidence,
zero publication errors/warnings, 17 valid published historical StorySpecs and
zero quarantined rows. All earlier 12 published records are unchanged. All
publication-schema health booleans are true, and stage/catalog inventories
agree. Matching-stage content, existing ages/hooks, recipe selection, database
schema, 牛大 and saved reader artifacts were not changed.

Each candidate passed a dry run before mutation. The existing
`promote-candidate.ts` helper stored the confirmed owner review; the audited
`story-spec:status -- publish` path then called `promote_story_spec_v2` with
the complete expected reviewed snapshot. Every call succeeded. The five-story
batch is not atomic; each individual promotion is atomic. No blanket seeding
or manual retirement was used.

## Recovery and deployment

Preflight matched the established production database identity. The successful
application deployment before publication was merge commit
`25114b31f4fdb6bc2157e5c806b9e00733c48a1f` (PR #127), GitHub Production
deployment `6452641913`. It already contains the compatible reader.

Scoped local backup:
`.codex-recovery/wave-3-production-before-2026-09-15.json.gz.b64`.
Uncompressed SHA-256: `955df30bbace86276f4fb8cbb7bf745ad062dcec9f3a49a692884b23c00105b0`.
It contains selected editorial stage/StorySpec rows and the prior public
editorial catalog, not reader accounts, Disclosures or saved artifacts. Local
read-only audit and receipt files are
`.codex-recovery/wave-3-audit-2026-09-15.ts` and
`.codex-recovery/wave-3-production-receipt-2026-09-15.json`.

**Production deployment and live reading are verified.**
[PR #128](https://github.com/taizhenC/Onward/pull/128) merged after its CI,
recipe gate and preview passed. Its merge commit
`cb94d5e93666c70dd25aa2821bbe55289c42398b` reached successful GitHub Production
deployment `6452727940` at `2026-09-15T06:01:03Z`, refreshing workers after the
database promotions. The five stories were then read through the normal
[production reader](https://onwardapp.me), including every progress acknowledgement.

| Story | Passages verified | Reader chunks recorded | Recovery steps |
|---|---:|---:|---:|
| Faraday | 7 | Not recorded by the initial run | 0 |
| Fitzgerald | 7 | 12 | 1 clarification |
| Graham | 7 | 18 | 0 |
| Hughes | 7 | 17 | 0 |
| Kovalevskaya | 7 | 17 | 0 |

Final verification completed at `2026-09-15T06:05:00.988Z`. Every complete
story matched its approved canonical passages after whitespace normalization;
the check does not claim byte-identical paragraph formatting. The first run
passed Faraday, then rejected the old Fitzgerald evaluation fixture's age 16.
The unchanged adult-only intake requires 18–100; a local parser reproduction
and red/green fixture preflight confirmed this. A second harness expected an
immediate session and stopped on a normal matching recovery response. The
final run used age 18 and followed the bounded, server-token-based clarification
flow, without forcing a figure or bypassing rate limits. The other three
remaining stories opened directly. No application fix was needed.

Across these bounded tests, three newly created anonymous guests and their
five test stories were removed through the normal CSRF-protected account
deletion route. Each cleanup reverified the exact anonymous identity before
deletion. The operator's account was not used, and no reader identifiers or
credentials appear in the receipt. Details are saved locally in
`.codex-recovery/wave-3-reader-canary-receipt-2026-09-15.json`.

To disable a bad current story, use the audited retirement path. Restoring
older text requires a newly reviewed version, not an overwrite of terminal
rows. Saved reader artifacts remain immutable.

## Retained editorial qualifications

The owner approved the five with their disclosed qualifications: Fitzgerald is
a complete 365-word miniature; Faraday is a quiet 680-word epistolary arc;
Graham is 496 words; Hughes is 539 words with a routine opening and a low point
carried chiefly by household pressure; Kovalevskaya is 568 words with qualified
memories. These are not claims that every story reaches the soft duration aim.
Existing matching ages/hooks remain unchanged, as in the prior story-only
releases; correcting them requires a separate evaluated library release.

Coleman, Coltrane, Hurston and Jones remain unpublished while their substantive
source/scene gaps are investigated. The owner's request to repair them does
not supply missing historical events or make future rewritten text already
reviewed. No recipe exception has been introduced.
