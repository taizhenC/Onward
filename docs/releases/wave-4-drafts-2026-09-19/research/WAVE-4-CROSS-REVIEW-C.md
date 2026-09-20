# Wave four — independent review of group C

Reviewer: wave4_b, 19 September 2026. This is an independent agent source-and-craft review, not human approval or publication authorization. I read the canonical passages, fact records, source notes and relevant source passages myself. I did not edit C's candidate files; author C made the narrow corrections discussed below. All candidates remain `draft`, version1, with empty `review`.

## Exact reviewed versions and verdicts

| Candidate | SHA-256 | Words | Independent disposition |
| --- | --- | ---: | --- |
| `nightingale-1856-1860-spent-v1.candidate.json` | `eb8bc2c60c4036dbd2ace38a0b8fa5770b16e6086ba7ab70c6ad64d42ecfd732` | 693 | No remaining blocking source/arc issue identified; owner reading and human review outstanding |
| `oconnor-1950-1955-lupus-and-the-farm-v1.candidate.json` | `039a1afc8ea3d4960af0d363a7cfdafc506caac71b45f24d3af8357757fa35b7` | 646 | Bounded low and publication turn acceptable; length/readability qualifications, no human approval |
| `mcclintock-1951-1960s-dismissed-and-right-v1.candidate.json` | `51ee0d5543da35d4477e9b140ad2b805c044f535e50b7aa063e39cf2a8e69e0e` | 441 | HOLD: source access, dated scene/low/response, failed effort and subsequent change remain insufficient |

## Nightingale

Read [Cook, volume I](https://www.gutenberg.org/files/40057/40057-h/40057-h.htm), printed pp.362–374, distinguishing his editorial chronology from the embedded contemporary letters. Also checked p.4 for birth and pp.440,445–446 for the restrained nursing legacy. The source actually supports a single letter encounter rather than three invented scenes: her undated reply to Sutherland follows his late-August letters and precedes his 7 September reply, pp.368–370. It contains the physical complaints and protest at being misunderstood. Her act of explaining those limits is a valid small response.

The 10 October letter, pp.365–366, supports failed attempts to move approved plans into execution. The 15 November letter, p.366, supports the new drafting task and its glad reception. The 1 December letter and 5 December family report, pp.366,372–373, support both concrete work and continuing physical limits. The latter is an intermediary family report, not a clinician's diagnosis; the fact note preserves that distinction.

One narrow attribution issue was found in initial hash `5fc4b20db359156a353bc52dc1e0e9fe14a00dedc49deab668156c9813b1949e`: response wording could imply that Sutherland specifically alleged fashionable appetite or deliberate deprivation. His quoted advice does not say this. Her own rhetorical questions introduce those possibilities. C changed both fact-response and response sentences3–5 to make them explanations she ruled out, without assigning those claims to him. I reread the revised passage at the final hash; the issue is resolved.

No invented concurrence is needed for the turn: the scene is her later letter reporting authorization, not an invented moment of receiving it. The turn does not cure her. The historical refusal to rest is not turned into a reader instruction; the permission ending acknowledges limits. Anonymity and age placement pass. At693words it is near, but below, the requested range; padding is not warranted. Some repeated bodily language may feel deliberate or repetitive to an owner reader, but that is not a source failure.

## O'Connor

Independently read the available [Habit of Being preview](https://www.everand.com/book/182507415/The-Habit-of-Being-Letters-of-Flannery-O-Connor/290457046): PartI opening headnote; illness/farm headnote; 23 December1950 letter to Betty Boyd Love; probably-January1951 letter to Elizabeth McKee; both 10 March1951 letters up to the displayed cutoff. No access to the rest of the book is claimed. Also read the relevant [Giroux introduction](https://fsgworkinprogress.com/2015/03/25/the-supernatural-grace-of-flannery-oconnor/) sections from the October1950 contract through May1952 publication, especially the quoted1September1951 letter and following photograph paragraph.

The hospital letter gives bodily limitation and uncertainty, expressed with humor, followed by an actual request for sympathy. That is an adequate bounded low and small response; despair is not required and must not be invented. The repeated draft work is supported: a supposed final version was followed by further revision. The photograph exchange is participant recollection, appropriately probable and framed as memory. Publication preparation is a modest material threshold. It need not represent an undocumented emotional transformation. Later restrictions remain present; illness is neither a gift nor cured by writing. The editor's disappointment is attributed to him.

Initial hash `30bc8dbcece49e68407705fd39129cd34aaf92df2df23cde5ba8a91fbd11571f` marked the low and turn as provisional craft HOLD. I advised C those two bounded uses are defensible. C removed the provisional HOLD wording from metadata only, preserving uncertainty, memory qualifications and owner/human-review requirements. I read the new metadata and verified unchanged canonical646words at the final hash.

The hospital/letter scene is specific and anonymous; no title, city, proper name or famous literary marker leaks before the bridge. No invented bedside gesture or diagnosis revelation is present. Seven disclosed texture sentences do not supply the trigger or response. The sentence about what a reply could contain is possibility, not a claimed received letter. Readability qualifications remain: several closing sentences repeat the prior point, and646words is below target. These do not justify fabricating extra events. Owner reading should decide whether the repetition is helpful.

## McClintock — blocking HOLD remains

Read the reproduced primary excerpts and surrounding context in [Wu, sections3–5 and notes17–19,37–38](https://link.springer.com/article/10.1007/s40656-024-00631-9). This is access to excerpts through a later historian, not access to the archival manuscripts or whole1961 paper. The [CSHL record](https://repository.cshl.edu/id/eprint/34630/) was retrievable as a bibliographic result, but a subsequent full reopen timed out. It is not full-paper evidence. [APS's indexed catalog result](https://as.amphilsoc.org/repositories/2/top_containers/30310) independently showed Paigen's folder dated1966–1979; full catalog opening failed. [Nobel's indexed institutional Facts text](https://www.nobelprize.org/laureate/428) supports birth and the modest bridge only.

The paper comparison and later correction are bounded responsibly. The1978 marginal correction supports a remembered disagreement, not a contemporaneously attested1961 emotional low. The December seminar is continued explanation, not an established immediate response. Repeated explanations do not themselves prove repeated failed efforts. The invitation to discuss a question is real in the reproduced letter excerpt, but the draft has no established later change. The endpoint date remains provisional against the catalog discrepancy. These are substantive story gaps already disclosed by C, not merely an objection to441words.

No manufactured meeting, Nobel vindication or universal dismissal is asserted. The scientific distinction is kept plain enough for the short draft, though the reader still encounters conceptual summary instead of an anchored personal episode. Do not expand by inventing reactions. Reopen the original letters/seminar records and locate an attested low/response/change, or retain HOLD.

## Matching, safety and mechanical verification

All three preserve their catalog stage IDs and version1 without changing installed matching. The narrative ranges are narrower/different: Nightingale37 in1857 versus installed36–40; O'Connor25–27 in1950–1952 versus25–33; McClintock58–62 in1961–provisional1965 versus48–55. The last is a substantial mismatch, not a silent equivalent. The research report discloses these deltas. No matching edit was authorized or performed.

I ran each final candidate through `node --import tsx scripts/drafts/validate-candidate.ts <candidate> --sentences`: draft and in-memory publication simulation each returned zero errors and warnings. I also ran the read-only9-file `scripts/check-story-batch.ts` after the final revisions: exact canonical composition, serialized replay, all evidence-shape checks and rhythm passed at the hashes above. This does not adjudicate factual truth or confer approval.

Maximum passage means/maximum sentence lengths: Nightingale11/15; O'Connor11.09/18; McClintock10.75/17. Every passage ends shorter than its maximum sentence; bridge finals are7,8,8words. Age occurs in sentence2, identity first appears in the bridge, and prescribed bridge sentences are intact. Serious-illness flags fit the first two; no medical instructions, guaranteed outcomes, invented psychological diagnoses or cure claims were found. Final human historical, tone, safety and owner reading decisions remain open.
