# Sixteen held stories — corrected editorial and matching proposals

Prepared 20 September 2026 (local date). **Draft review packet, not installed or live.**

The user's instruction was to fix all sixteen held stories and modify what could
not be supported. The repairs replace unsupported premises with documented,
smaller episodes and make the proposed matching records describe those same
episodes. They do not invent missing history or turn agent checks into human
approval. The prior permission to use shorter source-led vignettes applies.

## What is ready to review

- [Set 1: nine stories](set-1/READING-COPY.md).
- [Set 2: seven stories](set-2/READING-COPY.md).
- [Exact candidate and matching-record hashes](review-targets.json).
- [Independent source/craft review and correction receipts](cross-review.md).
- [Supplemental proposed matching probes](MATCHING-REVIEW-CASES.json): unmeasured,
  synthetic editorial proposals, not the approved regression dataset.

Fifteen stories preserve all seven canonical passages from the previously
reviewed packet. Their new metadata, matching context and chronology still
require review. **Rogers is newly written**: the uncertain childhood composite
is replaced with his spring 1969 Senate testimony, at forty-one. The archive's
broadcast/event-day discrepancy is disclosed; no exact day is asserted.

All candidates remain `draft` with empty review records. The seven passage slots
are compatibility slots, not a claim that sources establish seven separate
scenes, a full crisis/recovery arc or the normal full-length recipe. These are
159–306-word source-led vignettes under the user's format exception.

## All sixteen corrections

| Set | Figure | Supported focus replacing the old matching premise | Proposed matching ages |
| --- | --- | --- | --- |
| 1 | Irving Berlin | First song, collaboration and a small return; not abandonment | 18–19 |
| 1 | George Washington Carver | Laundry work, scarce food and college support; not isolated homesteading | approximately 24–27 |
| 1 | Agatha Christie | A difficult book during separation; not a disappearance-to-recovery arc | 36–38 |
| 1 | John Coltrane | Learning music with help; not firing or addiction recovery | 30–31 |
| 1 | Hedy Lamarr | Patent paperwork and a corrected name; not appearance-based dismissal | 27 |
| 1 | Frances Glessner Lee | Offering a library before the larger plan is finished; not a bereavement-driven escape | 56 |
| 1 | Edmonia Lewis | Asking for useful criticism; not an accusation/acquittal/expulsion sequence | approximately 19–20 |
| 1 | Astrid Lindgren | Sharing her son's care; not shame resolved by marriage | 22 |
| 1 | Barbara McClintock | Publishing a qualified comparison; not rejected-genius vindication | 59 |
| 2 | Jesse Owens | Exhibition complaints, suspension and uncertain paid work; not a horse-race humiliation scene | 22–26 |
| 2 | Sidney Poitier | Auditions, asking to learn and insecure trial admission; not guaranteed vindication | coarse 15–19 envelope |
| 2 | Sergei Rachmaninoff | Letters, requesting time and unfinished work; not a medical-cure narrative | 27–28 |
| 2 | Fred Rogers | Explaining caring work at the Senate hearing; not childhood bullying | 41 |
| 2 | Wilma Rudolph | Limited basketball participation and trying track; not medical defiance or an athletic cure | coarse 5–16 envelope |
| 2 | Bayard Rustin | Collective organizing and unresolved work; not universal erasure | 51 |
| 2 | Vera Wang | A bridal business using prior experience; not starting from nothing after a documented promotion contest | 39–41 |

Poitier and Rudolph **do not have newly recovered precise episode dates**. Their
undated identities and broad, qualified comparison ranges preserve the source
conflicts and inferences. Rudolph's brace-onset age is marked probable, not
documented. Whether the matcher should accept these coarse envelopes is an
explicit editorial/release decision; the packet does not certify precise-age
matching. Carver's range includes a possible twenty-four-year-old start given
the uncertain 1864–1865 birth year and unestablished birthday.

## What was changed — and what was not

Each proposal is a **complete replacement matching row**: stage identity, label,
age range, shapes, four facets, factual summary, themes, sources and all seven
fallback passages. Candidate/proposal identity, ages and passage text agree.
The proposed fifty-row overlay replaces precisely these sixteen and preserves
the other thirty-four source rows byte-for-byte in their structured values.

Nothing in this packet installs that overlay. `lib/figures-data.ts`, keyword
mapping, runtime, recipe/configuration, embeddings, approved gold cases,
previous frozen packets, database and production were not changed. The existing
published stories therefore have no serving changes from this work. No human
review receipt is recorded and no provider evaluation result is invented.

## Verification and the remaining release block

Run from the repository root:

```text
node --import tsx docs/releases/held-sixteen-integration-2026-09-20/check-integration.ts --require-manifest
node docs/releases/held-story-repairs-2026-09-20/check-review-packet.mjs
npm run typecheck
npm run lint
```

The proposal checker distinguishes structural consistency from migration
eligibility. It validates the sixteen pairs, exact hashes, empty draft reviews,
composition/replay, sentence rhythm, old snapshots, unchanged canonical text for
fifteen stories, qualified chronology, and the untouched thirty-four-row overlay.
It also checks the unchanged old gold cases against the real hard-age formula.

**Exit 1 is currently expected and must not be suppressed:** four immutable old
Rogers gold cases (zero-based indices 8, 12, 58 and 100, ages 11–13) are outside
the new age-41 episode's ten-year hard gate. They expect a different story.
Other old cases also describe retired premises; age reachability alone does not
prove semantic fit. The supplemental probes have not been run against a real
provider. A structural pass is not a passed matching release.

See [the verification receipt](VERIFICATION.md) and
[machine-readable check result](INTEGRATION-CHECK.json) for exact outcomes.

## Safe next release steps

1. Review the newly scoped matching records, chronology qualifications, the new
   Rogers text and the proposed coverage changes. This packet has no approval.
2. Decide the new matching coverage explicitly, including lost childhood Rogers
   coverage and the acceptability of coarse Poitier/Rudolph ages. Preserve the
   immutable old dataset and evidence. Do not relabel old expected answers,
   weaken gates or restore unsupported claims to manufacture a pass.
3. Through the documented release process, establish an authorized new coverage
   baseline and real-rerank evidence before installing changed library bytes.
   A changed dataset/policy may need a separate recipe and promotion authority;
   this PR does not grant or implement that authority. Follow
   [DEPLOYING.md](../../DEPLOYING.md), including the private-repository governance
   constraints. A supplemental test list is not promotion authority.
4. Install only the reviewed replacements under their exact new identities.
   Keep superseded held drafts non-serving and preserve every historical primary
   key and session reference. Do not rename/delete old rows or leave obsolete
   matching premises as a second selectable copy. Lee's proposed identity also
   exists in an earlier draft: verify that exact baseline before any update.
5. After required review and validation, publish exact selected StorySpecs using
   the existing guarded workflow, refresh the worker as needed, and verify the
   new live rows and existing publications. Do not broadly reseed fifty stories
   or infer permission to overwrite published documents.

## Source notes

The research skill drove primary-source checks and source-grounded reframing.
Later institutional chronology is labeled separately from firsthand testimony;
failed fetches and uninspected audio/full works are disclosed.

- [Berlin, Carver, Christie, Coltrane, Lamarr](set-1/research/GROUP-A.md).
- [Lee, Lewis, Lindgren, McClintock](research/GROUP-B.md).
- [Owens, Rachmaninoff, Rustin, Wang](research/GROUP-C.md).
- [Poitier and Rudolph chronology envelopes](research/CHRONOLOGY-ENVELOPES.md).
- [Rogers replacement episode](research/ROGERS.md).
