# Group C — source-grounded integration repairs

Prepared 20 September 2026 for Jesse Owens, Sergei Rachmaninoff, Bayard Rustin, and Vera Wang. This is an editorial proposal, **not a production write, human-review receipt, match-eval pass, or publication authorization**.

The owner's shorter-vignette exception is retained. All 28 canonical passages are unchanged from the previously reviewed held-story-repairs packet. The repairs replace unsupported selection surfaces and obsolete episode identities rather than adding invented scenes. New candidates remain version 1 of their **new** stage, draft, with empty review metadata. The old packet remains immutable.

## Hold-to-correction map

| Figure | Old stage / matching ages | Proposed stage / matching and story ages | Concrete correction |
|---|---|---|---|
| Owens | `1936-1940-after-the-gold` / 23–27 | `1936-1939-after-the-exhibitions` / 22–26 | Match the actual contemporary-report/financial-uncertainty vignette. Remove horse-race humiliation, permanent ban from all racing, invented proud refusal and later recovery from retrieval, rerank and fallback beats. |
| Rachmaninoff | `1897-1901-after-the-first-symphony` / 23–28 | `1900-1901-letters-and-unfinished-work` / 27–28 | Match the letter-led request and unfinished work. Remove premiere humiliation, absolute three-year silence, diagnosis and therapy-cure premises from selection surfaces. |
| Rustin | `1963-the-man-in-the-back` / 48–54 | `1963-organizing-the-march` / 51–51 | Match collective organization, turnout uncertainty and unresolved work. Remove universal abandonment, never spoke publicly and accepting erasure as the emotional lesson. |
| Wang | `1987-1990-passed-over-to-the-pivot` / 38–41 | `1989-1990-the-bridal-store` / 39–41 | Match the bridal-business transition with existing skills. Remove the unsupported dated promotion competition, Wintour replacement claim, and no-experience/no-resources premise. Earlier career is explicit background. |

The new rows are complete `FigureStageRow` replacements, including all seven fallback beats copied from the corresponding candidate. None retains stale seed prose behind a corrected matcher. Shape and facets are editorial interpretations of the separate biographical-facts field; they are not added to that field as emotional testimony. Empty antiThemes are deliberate: no new penalty has been invented to force eval success.

## Evidence rechecked and boundaries

### Owens

Freshly read the [17 August 1936 Denison Press dispatch](https://texashistory.unt.edu/ark:/67531/metapth737480/m1/1/), OCR lines 463–480, and not the unrelated editorial on the same page. It supports the reported suspension and attributed complaints; it does **not** establish a precise complaint-before-suspension sequence. The proposal therefore does not impose one.

The owning archive's [timeline](https://library.osu.edu/timeline), 1913 and 1936–1939 entries, supports age and later work chronology. Its [business account](https://library.osu.edu/jesse-owens-a-lasting-legend/owens-legacy-a-national-icon), paragraphs starting “After a whirlwind,” supports the business endpoint. These are institutional secondary summaries, not newly inspected AAU minutes, contracts or bankruptcy records. The contemporary complaint is the primary anchor. No horse-race variants were harmonized.

### Rachmaninoff

Freshly read the complete short Russian transcriptions of letters [157](https://senar.ru/letters/157), [158](https://senar.ru/letters/158), [159](https://senar.ru/letters/159), [160](https://senar.ru/letters/160), [175](https://senar.ru/letters/175), [178](https://senar.ru/letters/178), and [186](https://senar.ru/letters/186). Initial fetch timeouts for four pages were followed by successful ordinary web reads. The [corpus header](https://senar.ru/letters/) attributes the edition to Moscow, 1978.

The translation keeps the apparent/self-assessed nature of his lost capacity in letter 158, and distinguishes requests, intentions and accomplished actions. Letter 160 supplies permission, not a witnessed delivery scene. Letters 175/178/186 support unfinished work and continuing doubt. The opera and concerto remain different works. June 1900 to November 1901 metadata accommodates the final letter's Old Style date. The prior age/identity source is retained; no new manuscript or printed-edition collation, independent human translation approval, or medical claim is asserted.

### Rustin

Fresh primary reading:

- [Cox's Smithsonian oral history](https://www.smithsonianmag.com/history/oral-history-march-washington-180953863/), “The morning,” two Cox paragraphs: the remembered encounter and arrivals. This is retrospective witness testimony, not a contemporaneous transcript; probability and memory framing remain.
- [Rustin's 1979 interview](https://americanarchive.org/catalog/cpb-aacip_151-rr1pg1jj76), march-role and manager answers: collaborative logistics.
- [Lewis's 1979 interview](https://americanarchive.org/catalog/cpb-aacip_151-hd7np1xb3j), speech-change question through objections at the memorial: the call, disputed speech and unresolved discussion. The later “note under door” account is not spliced into this version.
- [Contemporary march address transcript](https://jtojhumanrights.org.uk/bayard-rustin/), speaker introduction and first demand: public participation, not invisibility.
- [Rustin's October 1963 article](https://crmvet.lib.duke.edu/info/mowrust.html), opening and sections 1–2: unfinished preparation and coalition aims after racist violence.
- [Rustin's 1986 interview](https://makinggayhistory.org/podcast/bayard-rustin/), attack/response passage: his stated lack of basic apprehension and allies' defense. Private panic is not invented.

The [Stanford chronology](https://kinginstitute.stanford.edu/rustin-bayard) is retained for identity and age. Transcripts were read; recordings were not independently audited. The source-led format does not claim a fully reconstructed emotional turnaround.

### Wang

Freshly read her own career/design and market-concept answers in the [2010 Vogue interview](https://www.vogue.in/content/meet-vera-wang-bride-maker), the direct retrospective editorial remarks in [TIME's 2007 profile](https://time.com/archive/6682262/aisles-of-style/), the starting-at-forty answer in [Elle's 2023 interview](https://www.elle.com/beauty/makeup-skin-care/a43328070/vera-wang-kohls-aging-interview/), and the [official brand's 1990 entry](https://www.verawang.com/pages/the-brand). [The 2011 Bazaar profile](https://www.harpersbazaar.com/fashion/designers/a694/vera-wang-interview/) was freshly read through ordinary HTTP after web extraction failed, specifically the wedding/dressmaker paragraph.

The material establishes a transition with accumulated experience, not a fresh start from zero. The profile's shopping account remains probable secondary narrative. Conflicting wedding-age fractions and funding recollections remain excluded rather than reconciled by invention. No exact shop-opening age, private conversation, or formal promotion decision is added.

## Stage lifecycle and release handling

These IDs are intentionally new because the old labels promise different episodes. For each mapping above:

1. Keep the old StorySpec and stage non-serving. Preserve their identifiers and any session references. Do not delete or rewrite past sessions, frozen packets, or published documents.
2. Insert the proposed new stage as draft only after the reviewed library release permits it. Stage label, ages, matching surfaces, fallback beats and candidate must agree exactly.
3. Create/review the new candidate under its new composite identity; a prior story-text review is not silently converted into approval of changed matching metadata.
4. At publication, verify the new target and all existing publications. Do not use a broad figure seeder to overwrite unrelated rows.
5. If the installed backend unexpectedly reports either old stage as published, stop for explicit exact-ID retirement/replacement handling rather than rekeying it.
6. Updated retrieval text invalidates prior content-addressed embeddings. Do not relabel stale vectors; any required re-embedding must use the normal release procedure and the selected recipe.

No stage migration, database command, config selector change, provider run, or live publication was executed by this group.

## Matching proposals for the integrator

These are **synthetic test recommendations, not measured results**. They describe ordinary user concerns without inserting a figure's name. Shared keywords must not be removed merely because their former figure-specific comment was wrong: other stories still cover public failure, erasure and career rejection.

| Figure | Proposed themes | Candidate keyword additions |
|---|---|---|
| Owens | burnout, dispossession, public_failure | “exhausting appearances” → burnout; “without expense money” → burnout + dispossession; “suspended me” → dispossession + public_failure; “achievement doesn't pay” → dispossession |
| Rachmaninoff | self_doubt, keep_going | “can't compose” / “creative block” → self_doubt + keep_going; “ask for more time” → self_doubt + keep_going; “unfinished work” → self_doubt |
| Rustin | self_doubt, social_constraint, keep_going | “organizing a gathering” / “will anyone come” → self_doubt + keep_going; “coalition disagrees” → social_constraint + keep_going; “groups still disagree” → social_constraint + keep_going |
| Wang | late_start, self_invention, keep_going | “use my experience” / “business of my own” → self_invention + keep_going; “change direction near forty” → late_start + self_invention |

Review the existing “can't create” → creative_dismissal + public_failure mapping: creation difficulty alone does not establish public humiliation. Do not rename global public-failure keys as Rachmaninoff-only routes. Likewise, Rustin's old no-credit/comment block should not advertise this new episode as erasure, and Wang's stage no longer needs the public_failure tag solely to fit a faulty promotion anecdote.

Suggested positive cases:

- Age 24, expected Owens: “I achieved something important, but the exhausting appearances left me without expense money; they suspended me and I still need reliable work.”
- Age 27, expected Rachmaninoff: “I can barely compose anymore. I want to ask for more time with unfinished work, but I can't promise it will be ready.”
- Age 51, expected Rustin: “I'm organizing a gathering with several groups. The groups still disagree, and I keep asking myself, will anyone come?”
- Age 40, expected Wang: “I want a business of my own after years in this field. I can use my experience, but changing direction near forty still feels like a beginning.”

Suggested hard comparisons:

- Rachmaninoff versus Butler: inability to compose and requesting time versus repeated external rejection while continuing to submit work. A public premiere is no longer the discriminator.
- Rustin versus Graham: collaborative organizing with unresolved disagreement versus being unexpectedly thrust into a role and feeling fraudulent. Do not use “forced to stay invisible” as Rustin's gold anchor.
- Wang versus Chandler: experienced move toward a self-directed business versus employment dismissal followed by reinvention. Do not pretend Wang lost everything.
- Owens versus Nightingale: exhausting appearances followed by institutional suspension and unreliable work versus post-service exhaustion/illness. Avoid matching merely because both contain exhaustion.

Active eval coverage requires an explicit editorial revision. The old Rachmaninoff public-premiere cases, Rustin no-credit cases, Wang starting-from-scratch case, and Owens odd-jobs/shame case encode premises no longer in these episodes. Preserve historical eval evidence unchanged; explain the new coverage boundary instead of silently changing prior results. For exclusion/erasure or a public premiere without the new episode's core, do not assert a definitive match to these replacements.

## Local verification

Ran the existing candidate validator on all four new files. Strict parse, draft validation and in-memory publish simulation each passed with **zero errors and zero warnings**. Placeholder simulation reviewers were never written into the files. All remain draft with empty review.

Shared-library structural checks, content-release governance, full synthetic regression and real-provider evaluation are the integrator's remaining tasks. A schema pass does not establish matching quality, source certainty, owner approval or production readiness.
