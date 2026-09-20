# Remaining story-first batches

Requested by the owner on 2026-09-05: continue the same research-led revision
process for the remaining historical stories, nine per set. The first nine
are already published; see [their release record](releases/2026-09-05-story-first-publication.md).

The table preserves the original forty-one-stage queue. Three stages in set 2,
six in set 3 and four in set 4 have now been published, leaving twenty-eight:
six held set-2 rewrites, three held set-3 stories, five held set-4 stories and
fourteen later stages. The set-4 production release and complete live-reader
checks confirmed 22 valid published historical stories, zero quarantined.
See the [set-4 publication record](releases/2026-09-19-wave-4-publication.md).
The deterministic figure-key order keeps difficult episodes visible.

| Set | Figures | State |
|---|---|---|
| 2 | Andersen, Banting, Irving Berlin, Charlotte Brontë, Octavia Butler, Carver, Ray Charles, Julia Child, Agatha Christie | Andersen, Banting and Child live-verified September 10; six others rewritten but held for source/scene completeness |
| 3 | Bessie Coleman, Coltrane, Faraday, Ella Fitzgerald, Katharine Graham, Langston Hughes, Hurston, James Earl Jones, Kovalevskaya | Faraday, Fitzgerald, Graham, Hughes and Kovalevskaya live-verified September 15; Hurston's reframed version subsequently owner-approved and published; Coleman, Coltrane and Jones held for source/scene gaps |
| 4 | Lamarr, Frances Glessner Lee, C. S. Lewis, Edmonia Lewis, Lindgren, Barry Marshall, McClintock, Nightingale, O'Connor | C. S. Lewis, Marshall, Nightingale and O'Connor owner-approved, published and complete-live-reader verified September 19 local / September 20 UTC; five others held |
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

Older local editorial material is in the ignored
`docs/research/story-specs/wave-2/` through `wave-6/` workspaces. Review packets
are tracked separately under `docs/releases/`, including the set-4 packet below.
Earlier artifacts and their publication receipts are preserved unchanged.

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
the September 10 catalog contained 12 valid historical stories, with zero quarantined.
The [release record](releases/2026-09-10-wave-2-publication.md) records the successful
worker refresh and complete live reader verification. The other six were
rewritten and independently checked, but remain unpublished for the specific
source/scene gaps in the [new rewrite packet](releases/wave-2-rewritten-2026-09-10/README.md).
Their changed texts do not inherit approval of the old snapshot.

Matching corrections remain a separate evaluated release, not a silent edit
to this content-only packet. At the September 10 handoff, the next set had not
started and thirty-two stages remained queued. Set 3 began on September 14;
twenty-three later stages remain queued.

The application changes for the separately labeled Chinese fiction mode were
merged in [PR #122](https://github.com/taizhenC/Onward/pull/122). That PR does
not publish or approve these historical candidates. Its public fiction route
is separate from the historical library, Owner Stories and saved progress.

## Set 3 continuation — September 14

The owner requested the next nine stories, parallel research, and many small,
focused commits. Work starts from `5eff085`, after PR #125 was merged. That
merge preserved the held set-2 drafts; it did not publish them.

Three independent authoring groups cover Coleman/Coltrane/Faraday,
Fitzgerald/Graham/Hughes, and Hurston/Jones/Kovalevskaya. Another group checks
each author's work before final packaging. Existing seeded prose is only a
research lead, never a source. The seven-passage recipe and source floor remain
unchanged; missing scenes or uncertain chronology are explicit holds, not
permission to invent events or pad word counts.

Each story has its own source-grounded candidate commit; individual story
corrections, source/review reports, reading copy, hash manifest and CI wiring
are separate focused changes. Commits use only `taizhenC <tzhcheung@gmail.com>`
with no co-author trailers.

The [tracked set-3 packet](releases/wave-3-drafts-2026-09-14/README.md) contains
nine drafts and 63 exact passages (4,764 words). Coleman, Coltrane, Hurston and
Jones retain specific craft holds. The other five have supported local arcs
for the owner's reading decision, not blanket recipe clearance: notably Ella
is a short miniature and Hughes retains a routine-opening/indirect-low-point
qualification. Kovalevskaya's source-supported structural repair cleared its
original moment/compression hold. Full findings and corrected-hash rechecks
are linked in the packet; machine validity is not an editorial approval.

At the September 14 handoff all nine remained drafts with empty review metadata.
No text inherited approval from earlier waves, no production story had been
published, and no library or matching configuration changed. Six candidate age
ranges differ from their legacy matching bounds; the discrepancies remain
disclosed, and any matching correction requires a separately evaluated library
release. Set 4 is next, with 23 later stages still queued and the six older
wave-two rewrites still held.

## Set 3 publication and repairs — September 15

The owner confirmed reading the reviewed text and requested production release
and repairs. Faraday, Fitzgerald, Graham, Hughes and Kovalevskaya were promoted
unchanged through the reviewed StorySpec workflow. A successful deployment
refreshed the workers, and all five passed the live reader through their seven
passages and progress acknowledgements. Test guests and stories were removed.
The [production receipt](releases/2026-09-15-wave-3-publication.md) records the
exact hashes, checks and disclosed short-form/matching qualifications.

At the repair handoff, the [packet](releases/wave-3-repairs-2026-09-15/README.md) contained a
new 342-word Hurston story and exact-hash independent review. It reframes the
episode around the invitation to Howard and subsequent admission difficulties.
Its new prose, short response/turn and changed emphasis required a new owner
reading decision; approval of the old text was not reused. Coleman, Coltrane
and Jones remain held after targeted primary-source work. The full Coltrane
audio yielded unverified performance leads, not a verified repair of the
dismissal story. No new text for those three is represented as complete.

Original snapshots, matching content, recipes, schemas and reader artifacts
remain unchanged. Those five production promotions did not approve or publish
the four then-held stories, the six older rewrites or any later set.

The owner then confirmed reading Hurston's exact replacement and requested
publication. The [Hurston receipt](releases/2026-09-15-hurston-publication.md)
records that distinct approval and snapshot-bound release. Six stories from
set 3 are now published; Coleman, Coltrane and Jones remain held. The catalog
contains 18 valid historical stories, with 32 stages still in the original
queue (six held older rewrites, three set-3 holds and 23 later stages).

## Set 4 continuation — September 19

The owner requested the next nine-story wave using the same source-first
process. Work starts from `ae2e62d`, after the reviewed Hurston release and
PR #131's receipt/terminology corrections. Earlier source packets, production
stories and the nine older held stages are outside this editing scope.

Parallel research groups cover Lamarr/Lee/C. S. Lewis,
Edmonia Lewis/Lindgren/Marshall, and McClintock/Nightingale/O'Connor. Primary
material is reopened before drafting; seeded prose remains a research lead,
never evidence. Every new text stays a draft with empty review metadata.
Independent source and complete-story checks precede the exact-hash reading
packet. Missing historical moments remain visible holds, not invented scenes.

Each story and correction is kept in a focused commit under
`taizhenC <tzhcheung@gmail.com>`, without co-author trailers. No recipe,
matching/library release, production database operation or publication is
included in this authoring wave. The 32 remaining stages now consist of nine
older holds, nine stories in this set and fourteen in later sets. The last
recorded production audit is still the September 15 release, not a new audit.

The [set-4 reading packet](releases/wave-4-drafts-2026-09-19/README.md) now
contains all nine drafts: 63 exact passages, 4,945 words, source reports,
independent cross-reviews and a final SHA-256 manifest. C. S. Lewis, Marshall,
Nightingale and O'Connor have bounded arcs for owner reading, not publication
approval. Lamarr, Lee, Edmonia Lewis, Lindgren and McClintock retain explicit
source/scene/chronology holds. No missing event was invented to fill a role.

Focused corrections remove unsupported concurrence and attribution, disclose
Edmonia's conflicting case dates, and separate Marshall's encouragement from
later travel logistics. All nine pass mechanical validation, composition,
replay and rhythm checks; each remains a draft with an empty review object.
All nine age ranges differ from installed matching, as documented in the
packet. Matching and production remain unchanged. Set 5 is next; this handoff
does not begin it or clear the nine older held stages.

## Set 4 publication follow-up — September 19–20

The owner confirmed review of the exact C. S. Lewis, Marshall, Nightingale and
O'Connor stories, including their content notes, length qualifications and
episode ages, and authorized publication. Database verification confirms all
four approved versions are published and the historical total is now 22.
The previous 18 published stories and the five held set-4 candidates remain
unchanged. Earlier sections above preserve their authoring-handoff checkpoints;
they do not describe the current publication state.

[PR #133](https://github.com/taizhenC/Onward/pull/133) merged as `001d92a` at
2026-09-20 02:24:19 UTC. Production deployment succeeded at 02:25:15 UTC.
One new anonymous canary completed all seven passages of each story at
02:26:25.600 UTC: 28 passages, 79 chunks, every progress acknowledgement,
and whitespace-normalized canonical prose verified. All four matched directly.
The test guest and its four stories were removed through normal account deletion.
The post-canary audit reconfirmed 22 valid stories and zero quarantined at
02:26:35.798 UTC, with earlier publications and held drafts unchanged.
The [publication record](releases/2026-09-19-wave-4-publication.md) records this
distinct approval and release follow-up.

Twenty-eight stages remain: six set-2 holds, three set-3 holds, five set-4
holds and fourteen later stages. The held set-4 stories are Lamarr, Frances
Glessner Lee, Edmonia Lewis, Lindgren and McClintock. Set 5 has not begun.
