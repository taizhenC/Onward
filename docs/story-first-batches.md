# Remaining story-first batches

Requested by the owner on 2026-09-05: continue the same research-led revision
process for the remaining historical stories, nine per set. The first nine
are already published; see [their release record](releases/2026-09-05-story-first-publication.md).

Forty-one historical stages remain. The deterministic figure-key order below
keeps the scope visible and avoids quietly dropping a difficult episode.

| Set | Figures | State |
|---|---|---|
| 2 | Andersen, Banting, Irving Berlin, Charlotte Brontë, Octavia Butler, Carver, Ray Charles, Julia Child, Agatha Christie | Andersen, Banting and Child live-verified September 10; six others in source-grounded revision |
| 3 | Bessie Coleman, Coltrane, Faraday, Ella Fitzgerald, Katharine Graham, Langston Hughes, Hurston, James Earl Jones, Kovalevskaya | Queued |
| 4 | Lamarr, Frances Glessner Lee, C. S. Lewis, Edmonia Lewis, Lindgren, Barry Marshall, McClintock, Nightingale, O'Connor | Queued |
| 5 | Owens, Poitier, Rachmaninoff, Fred Rogers, Rudolph, Rustin, Sanders, Mary Shelley, Nina Simone | Queued |
| 6 | Anne Sullivan, Tallchief, Vera Wang, Bill Wilson, Yeats | Queued — final five |

## Per-set handoff

1. Inspect primary material; seeded prose and its assertions are leads, not evidence.
2. Rewrite the seven passages using [the story recipe](../prompts/story-recipe.md).
   Record exact/bounded source locations, inert disclosed texture, chronology,
   accurate episode ages, and any source-access or craft limitations.
3. Keep candidates as `draft` with empty review objects. Run strict parsing,
   both validation gates, actual canonical composition, and serialized replay.
   Automated success is not historical verification or human approval.
4. Independently cross-check the claims and read the complete story. Produce
   a nine-story reading packet bound to exact candidate hashes; the final set
   contains five. Do not pad unsupported material to hit a word target.
5. Obtain the owner's review before recording approval or publishing a set.
   Publication follows the existing snapshot-bound production workflow.

The ignored local editorial directories are
`docs/research/story-specs/wave-2/` through `wave-6/`. Each holds candidate JSON,
evidence notes, independent reviews and its reading packet. The earlier
first-wave artifacts and their publication receipts are preserved unchanged.

This work does not silently rewrite `lib/figures-data.ts`, matching-stage
content, existing recipe identities or saved reader artifacts. Any mismatch
between a narrowed narrative episode and its older matching description is
recorded for a separately evaluated figure-library release.

The separately requested Chinese fictional story, 牛大, is not one of these
41 historical stages and must never be given fabricated historical evidence.

## Set 2 handoff boundary

The September 9 continuation refines this existing set only. Earlier candidate
bytes are preserved in the local `wave-2/snapshots/2026-09-09-before/` directory.
The refreshed reading packet and exact-hash verification report separate machine
validity from editorial readiness. Research and independent checks tightened
chronology, removed unsupported posture and repetitive explanation, and narrowed
source claims. No new historical story has been approved or published.

The main outstanding boundaries are:

- Berlin: new first-song interview evidence does not establish the missing
  primary emotional episode. The original matching shape remains unsupported.
- Child: the inspected diploma inscription does not resolve the exam/receipt
  chronology conflict. The implied post-exam diploma milestone was removed;
  correspondence or school-record collation is still needed.
- Butler and Carver: thinner material is not padded to reach the length target;
  period-level scenes and access limits remain. Other drafts also fall short of
  the soft length target after pruning.
- Brontë and Christie: documented actions now follow a clearer sequence, but
  caregiving versus writing, and work versus travel, still need owner cold-reading.
- Charles: an owning interview supplies a more concrete performance turn; the
  earlier grief-account and source-collation limitations remain.

These September 9 holds preceded the owner's September 10 review. The owner
has now confirmed reading and requested a PR and publication of complete
stories. The [tracked reviewed packet](releases/wave-2-reviewed-2026-09-10/README.md)
preserves the exact nine candidate JSONs, a reading copy and hash-bound
readiness decisions; no prose was changed after that review.

The final source check identifies complete supported arcs for Andersen,
Banting and Child. Child's date disagreement is retained but is not asserted
in the current prose, so it is not itself a necessary missing story fact.
Brontë needs explicit acceptance of the caregiving-response tradeoff; Berlin,
Butler, Carver and Christie retain format/episode decisions; Charles retains
a historical-source adjudication hold. Shortness alone does not block release.
The owner then directed publication for stories meeting the standards and
rewrites for the others. Andersen, Banting and Child are published and live-verified;
the catalog now contains 12 valid historical stories, with zero quarantined.
The [release record](releases/2026-09-10-wave-2-publication.md) records the successful
worker refresh and complete live reader verification. The other six remain unpublished
while source-grounded rewrites are attempted.

Matching corrections remain a separate evaluated release, not a silent edit
to this content-only packet. The next set of nine has not been started;
thirty-two stages remain queued above.

The application changes for the separately labeled Chinese fiction mode were
merged in [PR #122](https://github.com/taizhenC/Onward/pull/122). That PR does
not publish or approve these historical candidates. Its public fiction route
is separate from the historical library, Owner Stories and saved progress.
