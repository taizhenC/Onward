# Approved first-wave production publication

Approval date: 2026-09-05. The owner (`taizhenC`) confirmed review of the nine-story reading packet and explicitly requested production publication. The existing promotion tool records that confirmed human in the research, historical, tone and content-profile roles; no additional reviewer was fabricated.

## Release surface

StorySpec content only. The compatible reader shipped through PR #120, production commit `c0489e55d7e8b58a1b3cb8d4dd806e5eb0b1cd92`. The matching library, recipe selector, provider configuration and database schema are unchanged. Existing matching descriptions/ranges remain older than some narrowed narratives; correcting that separate matching surface requires its own evaluated library release.

Canonical story prose is unchanged from `docs/research/story-specs/STORY-FIRST-READING-COPY.md` (local editorial workspace). Preflight corrected only stale metadata: removed overprecise Allende/Douglass episode endpoints and Bly's obsolete 1885 start; extended Allende's age envelope through its publication bound and Anning's through the documented 1829 credit; narrowed Anning's unsupported room-exclusion through-line; clarified Chandler's secondary source and Shostakovich's OCR access. These do not add narrative claims.

Prior length/repetition/source-access limitations remain disclosed; owner approval does not claim newly discovered primary evidence. The local drafts remain working files; publication state and reviewer metadata live in the immutable production records.

## Approved candidate bytes

| StorySpec | Candidate SHA-256 |
|---|---|
| `allende:1975-1981-exile-to-the-letter:v1` | `53e9baa482be6bb9c8108d9deceed898a8c6eacdfec8876174ff24df32330eca` |
| `angelou:1944-1945-teen-mother:v1` | `2cea42e60d6e71f778b1d15682ceb9c42bf8aa39af147943d4746f3fbdbf3944` |
| `anning:1823-1828-the-doubted-sea-dragon:v1` | `d4f1327319f7b57564c0f4e1ce2c7525b639e0fb4d74cd9e4ba7d0d276e7726d` |
| `bly:1885-1887-orphan-girl-to-madhouse:v1` | `8469d89674c31ff7597df4fd564751cff81f7f1ef1ad0e4351ca83f8ff468502` |
| `chandler:1932-1939-fired-to-the-first-novel:v1` | `2310a1ad83172f5408468dbc9ff1934c7ca13c4cf82f87f9871563eb60b6d414` |
| `douglass:1838-1841-nyc-to-nantucket:v2` | `51bd09d08c0ffbb846ea40f88f3b02017191192c8c3660b880167f690d21b455` |
| `muir:1867-1868-the-darkened-room:v1` | `f06793ec13ef71fdb88d4ad7b60ad2bbcd094998796efcaca4fc962c919352ca` |
| `ramanujan:1908-1913-notebooks-to-the-letter:v1` | `79fd657b9e12043fb930fd06515117d4e6f1e772436a759be745d1d7e6165013` |
| `shostakovich:1936-1937-muddle-to-the-fifth:v1` | `dffe39665fe3d8cb0b184c551d6591e416c295b787bb65cbb10ef8bf154149f8` |

## Procedure and recovery

1. Verify production deployment identity and the closed publication-schema health RPC. Inspect current published IDs and stage/catalog agreement with read-only queries.
2. Preserve scoped pre-publication StorySpec/stage data. Local compressed backup: `.codex-recovery/story-first-production-before-2026-09-05.json.gz.b64`; uncompressed SHA-256: `40deed2f2cd7300c4a191333f8547d61c2c570992d5641bf729ba0f78cce65fb`.
3. Require strict parsing and publication simulation with zero errors/warnings. Verify the actual candidate artifacts compose and replay.
4. Use `scripts/drafts/promote-candidate.ts <file> taizhenC` to store the reviewed snapshot, then `npm run story-spec:status -- publish <id>`. The snapshot-bound RPC validates current review identity and atomically replaces any prior same-stage version. Do not manually retire Douglass v1 first.
5. Read back every result, compare it with approved bytes apart from status/review fields, and check the publication catalog. Refresh production workers after enabling stages because their stage inventory is cached per process.

Each story promotion is atomic, not the whole batch. On an ambiguous result, read back before retrying. To disable a bad current story, use the audited retirement RPC. Retired content cannot be reactivated: restoring older text requires a newly reviewed version. Existing saved artifacts are never rewritten.

The full `check-db` suite is not used as a read-only production probe: it attempts mutation canaries using unreserved all-zero identities. Scoped SELECTs and schema-health calls avoid those possible collisions. Completion evidence is recorded separately after actual publication and deployment refresh.

