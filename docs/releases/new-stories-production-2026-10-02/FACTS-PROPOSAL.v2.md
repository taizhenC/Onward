# Concise reranker fact summaries — proposal v2

Prepared for independent source and quality review. These files are not installed, evaluated, published or deployed. The failed expanded-library benchmark and the passing original-library run justify inspecting the new metadata; they do not establish that prompt length alone caused the regression.

The ten summaries contain 1,479 words and 9,300 characters, down from 5,293 words and 31,732 characters. Each summary contains 120–180 words and follows its documented episode chronology. Names, dates and factual distinctions remain ordinary historical metadata. No ranking instruction, evaluation-case wording, fabricated interior state or outcome was inserted.

Every output retains its complete library-compatible stage structure. Compared with the immutable `proposed-stages/` input, only `biographicalFacts` changes. Compared with the original writing stages, the only additional changes are the previously reviewed Jacobs `self_invention` and Riis `late_start` themes. All ages, prose, beats, source notes, sources, facets and shapes remain exactly equal to the v1 proposal. The original fifty library stages, candidate files, existing proposal files and database are untouched.

[The machine-readable proposal](FACTS-PROPOSAL.v2.json) records raw SHA-256 hashes for each original writing stage, v1 proposed stage, v2 proposed stage and unchanged candidate; complete before/after field values; and sentence-to-candidate-fact evidence mappings. Its `stages[]` entries expose `file`, `figureKey`, `originalSha256`, `proposedSha256` and `changedFields`, where original means the immutable v1 proposed stage. Those mappings support independent review rather than replace it. Summary qualifications retain approximate ages, retrospective accounts, teacher interpretation, outside assistance and incomplete outcomes.

Jacobs remains an enslaved mother who wanted contact with her children during nearly seven years of concealment; reaching the North did not end legal enslavement. Seacole's nursing requests were refused and she financed the trip and store/hotel work herself; the officials' racial motives remain unestablished. Grant's episode remains illness, failed employment, family-supported shop work and an office invitation using prior military experience; his farm household's enslaved labor stays explicit. Keller's classroom restraint and the teacher's interpretation remain disclosed, and its adult intake age limit is unchanged.

| Figure | Previous words | Proposed words | Proposed full stage |
| --- | ---: | ---: | --- |
| addams | 435 | 133 | [stage](facts-v2-stages/addams-1888-1889-telling-the-plan-v1.stage.json) |
| blackwell_e | 644 | 137 | [stage](facts-v2-stages/blackwell_e-1847-1849-a-place-to-study-v1.stage.json) |
| darwin | 634 | 134 | [stage](facts-v2-stages/darwin-1831-the-refusal-and-the-letter-v1.stage.json) |
| equiano | 546 | 151 | [stage](facts-v2-stages/equiano.stage.json) |
| grant | 633 | 149 | [stage](facts-v2-stages/grant-1858-1861-a-place-in-the-shop-v1.stage.json) |
| jacobs | 598 | 176 | [stage](facts-v2-stages/jacobs.stage.json) |
| keller | 536 | 152 | [stage](facts-v2-stages/keller-1887-learning-that-things-have-names-v1.stage.json) |
| riis | 402 | 145 | [stage](facts-v2-stages/riis.stage.json) |
| seacole | 466 | 155 | [stage](facts-v2-stages/seacole.stage.json) |
| washington_b | 399 | 147 | [stage](facts-v2-stages/washington_b-1872-reaching-the-classroom-v1.stage.json) |

Independent review should check each summary against the pinned candidate facts and primary-source citations, particularly attribution, agency, chronology, outside help and legal status. Only after that review may an integrator install the new metadata and measure the unchanged benchmarks. No matching gate is claimed by this proposal.

## addams

Jane Addams was twenty-seven to twenty-nine during April 1888–September 1889. Her memoir describes chagrin after a bullfight; she judged that her proposed reform had become an excuse for continued study and travel. She had gradually formed a plan to rent a city house where young women would connect study with active life among neighbors with unmet needs. She told Ellen Gates Starr despite stumbling and fearing that speaking would make the plan collapse. Starr's enthusiasm helped give it substance, although details remained uncertain. They sought advice, faced criticism and searched unsuccessfully before finding the house again. They intended to begin with their own resources. After repairs and furnishing, they moved in with housekeeper Mary Keyser in September 1889. Early work included a reading group, shared meals, washing dishes and housing a young neighbor.

Writing-stage SHA-256: `19f0c4891bfd948c1cac9f08feedb02fe657ed15a723de56405a61acd4dcbbf9`. V1 stage: `19f0c4891bfd948c1cac9f08feedb02fe657ed15a723de56405a61acd4dcbbf9`. V2 stage: `88b9f38e502427b62f5a9fbd1f4b627570e43b611695b1bcdf58c4b5a9378f5c`. Candidate: `7f58b64e1d3c48be8a057e1b30435a4ffc6be37ca2eefae77ffdf1c4c5249e20`.

| Summary sentence | Pinned candidate facts |
| --- | --- |
| Jane Addams was twenty-seven to twenty-nine during April 1888–September 1889. | `fact-age` |
| Her memoir describes chagrin after a bullfight; she judged that her proposed reform had become an excuse for continued study and travel. | `fact-arena`, `fact-chagrin`, `fact-paper` |
| She had gradually formed a plan to rent a city house where young women would connect study with active life among neighbors with unmet needs. | `fact-plan` |
| She told Ellen Gates Starr despite stumbling and fearing that speaking would make the plan collapse. | `fact-talk` |
| Starr's enthusiasm helped give it substance, although details remained uncertain. | `fact-companion` |
| They sought advice, faced criticism and searched unsuccessfully before finding the house again. | `fact-visit`, `fact-critic`, `fact-search`, `fact-lost-house`, `fact-found-house` |
| They intended to begin with their own resources. | `fact-search` |
| After repairs and furnishing, they moved in with housekeeper Mary Keyser in September 1889. | `fact-repair`, `fact-move` |
| Early work included a reading group, shared meals, washing dishes and housing a young neighbor. | `fact-reading`, `fact-guest` |

- Jane Addams, Twenty Years at Hull-House with Autobiographical Notes (1910; accessed Gutenberg transcription of 1912 edition). Chapters IV, The Snare of Preparation, and V, First Days at Hull-House. https://www.gutenberg.org/cache/epub/1325/pg1325-images.html
- Jane Addams Hull House / Metropolitan Family Services, History. Jane Addams Biography, birth and rented house paragraphs. https://janeaddamshullhouse.org/history/

## blackwell_e

Elizabeth Blackwell was twenty-six to twenty-seven during medical school in 1847–1849. In November 1847, a professor had asked her to miss some demonstrations. Her journal records annoyance, sadness and discouragement, and her note asked to be regarded as a serious student. During a dissection she sat gravely while her heart palpitated painfully and afterwards felt nearly worn out. She prayed for help in keeping from smiling. She believed some classmates did not wish to hurt her feelings. On November 24 the professor read her note while she waited outside; she heard the class's approval and returned to her place. The class subsequently reserved her seat. She studied with other students. Later hospital doctors stopped recording diagnoses and treatment beside beds, depriving her of that assistance. After receiving her diploma in January 1849, she sought more medical experience.

Writing-stage SHA-256: `250e8d2849b39f8752ad31a11b2048c43da12ce5fc26d3ae431e045f45911efd`. V1 stage: `250e8d2849b39f8752ad31a11b2048c43da12ce5fc26d3ae431e045f45911efd`. V2 stage: `1e4ffa9de5a7ded0bbc197a7bfb697aaa7979a5106bbc3f3d393bae988fff233`. Candidate: `61dac9480f73dd6834c8651b689ebe0434cc2d36779710053073e200aee5bdd2`.

| Summary sentence | Pinned candidate facts |
| --- | --- |
| Elizabeth Blackwell was twenty-six to twenty-seven during medical school in 1847–1849. | `fact-age` |
| In November 1847, a professor had asked her to miss some demonstrations. | `w-exclusion` |
| Her journal records annoyance, sadness and discouragement, and her note asked to be regarded as a serious student. | `w-exclusion`, `w-note` |
| During a dissection she sat gravely while her heart palpitated painfully and afterwards felt nearly worn out. | `w-dissection` |
| She prayed for help in keeping from smiling. | `w-prayer` |
| She believed some classmates did not wish to hurt her feelings. | `w-dissection` |
| On November 24 the professor read her note while she waited outside; she heard the class's approval and returned to her place. | `w-return` |
| The class subsequently reserved her seat. | `fact-seat` |
| She studied with other students. | `fact-study` |
| Later hospital doctors stopped recording diagnoses and treatment beside beds, depriving her of that assistance. | `fact-hospital` |
| After receiving her diploma in January 1849, she sought more medical experience. | `fact-degree`, `fact-next` |

- Elizabeth Blackwell, Pioneer Work in Opening the Medical Profession to Women: Autobiographical Sketches (1895). https://www.gutenberg.org/cache/epub/65496/pg65496-images.html Chapter III: November 9 letter pp. 67–69; November 15, 17, 20, 22 and 24 journal entries pp. 71–72; study recollections pp. 73–74; hospital obstruction pp. 80–81; January 23, 1849 graduation record pp. 87–91; further training p. 92. Chapter IV, birth-record cousin letter pp. 118–119. Chapter VI, women's medical college and practice pp. 237–239 for the bridge.

## darwin

In August–September 1831, Charles Darwin was twenty-two. He wanted to accept a voyage offer to collect and observe natural history. His father advised strongly against it, citing steady employment, preparation and compatibility with the captain. Darwin wrote to decline because ignoring that advice would make him uncomfortable. His uncle answered the objections and accompanied him to his father, who gave consent. A discouraging letter from the captain then led Darwin and Henslow to abandon the plan again, but Darwin still went to London. On September 5 he met the captain and liked his directness. The captain described cramped shared accommodation, plain meals and his need for cabin privacy. On September 6 Darwin felt cheerful but said the matter remained unsettled. He worked on equipment lists and family requests, postponing purchases until arrangements were certain.

Writing-stage SHA-256: `0b9866aed70e86a86ce038a88b050f0aeb3b848e6530ee39c838ecbf1f210dc0`. V1 stage: `0b9866aed70e86a86ce038a88b050f0aeb3b848e6530ee39c838ecbf1f210dc0`. V2 stage: `ae02bc2cdb464181e3dc491f22ec1790acb38b13e18e2a779fc42df17623e986`. Candidate: `26707c4dbde4c4f9dcb18cfdfbe3f3ce0aa3730049cc2b4b8e91271f85cf24f4`.

| Summary sentence | Pinned candidate facts |
| --- | --- |
| In August–September 1831, Charles Darwin was twenty-two. | `fact-age` |
| He wanted to accept a voyage offer to collect and observe natural history. | `fact-letter`, `fact-offer` |
| His father advised strongly against it, citing steady employment, preparation and compatibility with the captain. | `fact-advice`, `fact-concerns` |
| Darwin wrote to decline because ignoring that advice would make him uncomfortable. | `fact-advice`, `fact-refusal` |
| His uncle answered the objections and accompanied him to his father, who gave consent. | `fact-list`, `fact-answers`, `fact-drive`, `fact-consent` |
| A discouraging letter from the captain then led Darwin and Henslow to abandon the plan again, but Darwin still went to London. | `fact-discouraged` |
| On September 5 he met the captain and liked his directness. | `fact-meeting`, `fact-privacy` |
| The captain described cramped shared accommodation, plain meals and his need for cabin privacy. | `fact-cabin`, `fact-plain-meals`, `fact-privacy` |
| On September 6 Darwin felt cheerful but said the matter remained unsettled. | `fact-cheerful`, `fact-route-uncertain` |
| He worked on equipment lists and family requests, postponing purchases until arrangements were certain. | `fact-lists`, `fact-commissions` |

- John Stevens Henslow to Charles Darwin, August 24, 1831, Darwin Correspondence Project letter 105. Transcript, naturalist/companion offer and qualifications paragraphs. https://www.darwinproject.ac.uk/letter/?docId=letters/DCP-LETT-105.xml
- Charles Darwin to John Stevens Henslow, August 30, 1831, Darwin Correspondence Project letter 107. Transcript opening offer, objections and postscript. https://www.darwinproject.ac.uk/letter/?docId=letters/DCP-LETT-107.xml
- Charles Darwin to Robert Waring Darwin, August 31, 1831, Darwin Correspondence Project letter 110. Transcript request for answer and numbered objections. https://www.darwinproject.ac.uk/letter/?docId=letters/DCP-LETT-110.xml
- Josiah Wedgwood II to Robert Waring Darwin, August 31, 1831, Darwin Correspondence Project letter 109. Transcript numbered replies; footnote 1 transcribes Darwin’s December 16, 1831 diary account. https://www.darwinproject.ac.uk/letter/?docId=letters/DCP-LETT-109.xml
- Charles Darwin, letters of September 2 and 4, 1831, in Francis Darwin (ed.), Charles Darwin: His Life Told in an Autobiographical Chapter, and in a Selected Series of His Published Letters (1902). Chapter V, September 2 arrival note and September 4 letter to Susan; Gutenberg inline pages 118–119. https://www.gutenberg.org/cache/epub/38629/pg38629-images.html
- Charles Darwin, Autobiography, written 1876, edited by Francis Darwin. Opening birth statement; Voyage of the Beagle and publications sections. https://www.gutenberg.org/files/2010/2010-h/2010-h.htm
- Charles Darwin, letters of September 5 and 6, 1831, in Francis Darwin (ed.), The Life and Letters of Charles Darwin, volume I (1887). Chapter V (Chapter 1.V in transcription), The Appointment to the Beagle: September 5 letters to Susan Darwin and J. S. Henslow; September 6 letter to Susan Darwin. https://www.gutenberg.org/files/2087/2087-h/2087-h.htm

## equiano

In 1766, Olaudah Equiano was about twenty to twenty-one, based on his memoir's reported birth year. While enslaved, he traded goods while working aboard vessels that also carried enslaved people. Owner-directed port changes disrupted his trading plans. A promised bonus proved disappointing when a dead man's trunks contained little value; he already had nearly enough money to buy his freedom. After returning and selling goods, he approached the owner with the agreed purchase price. The owner questioned his earnings and regretted making the promise when he saved so quickly. A captain confirmed his honest earnings and urged the owner to keep his word. The owner accepted payment and signed a written release in July. Equiano remained with the vessel as a paid sailor. On a subsequent voyage he beat a man who had struck him, then faced the other man's owner's threat of public flogging and hid at a friend's house.

Writing-stage SHA-256: `2c5800b61b6d2ce134f0bed8165ee9e2cf72ce0c3a11faf357c9b2c26f5f2144`. V1 stage: `2c5800b61b6d2ce134f0bed8165ee9e2cf72ce0c3a11faf357c9b2c26f5f2144`. V2 stage: `71a9b20926b1d79e7dcf89d6d8e8cd0bd491a6ec9114d14733d2687e75fe80d5`. Candidate: `f2d63a7dd33de0a889c60f2e87ba4137812ffac4c80b53d447561400338b329c`.

| Summary sentence | Pinned candidate facts |
| --- | --- |
| In 1766, Olaudah Equiano was about twenty to twenty-one, based on his memoir's reported birth year. | `age` |
| While enslaved, he traded goods while working aboard vessels that also carried enslaved people. | `voyage`, `cargo` |
| Owner-directed port changes disrupted his trading plans. | `detour` |
| A promised bonus proved disappointing when a dead man's trunks contained little value; he already had nearly enough money to buy his freedom. | `bonus` |
| After returning and selling goods, he approached the owner with the agreed purchase price. | `savings`, `appointment`, `plea` |
| The owner questioned his earnings and regretted making the promise when he saved so quickly. | `recoil`, `regret` |
| A captain confirmed his honest earnings and urged the owner to keep his word. | `answer`, `support` |
| The owner accepted payment and signed a written release in July. | `consent`, `paper`, `legal` |
| Equiano remained with the vessel as a paid sailor. | `employment` |
| On a subsequent voyage he beat a man who had struck him, then faced the other man's owner's threat of public flogging and hid at a friend's house. | `threat` |

- Olaudah Equiano, The Interesting Narrative (1789), chapters I and VII, including the reproduced manumission. https://www.gutenberg.org/cache/epub/15399/pg15399-images.html

## grant

From 1858 to early 1861, Ulysses S. Grant was thirty-six to thirty-nine. His family had serious illnesses, and his own fever reduced his ability to work and supervise farmworkers. That farm household used enslaved labor. He sold stock, crops and tools, then entered a real estate partnership that could not support two families. He did not receive the county engineer appointment and remained unemployed in late 1859. He wanted the prospect of eventually doing business for himself. In 1860 he took a salaried clerkship in his father's store, where his younger brothers already worked, and supported his family. In 1861 he helped drill a volunteer company and accompanied it to the state capital. Preparing to return home, he was asked by the governor to stay and visit the office next morning. He accepted work preparing troop paperwork using his army experience, relying on a clerk for assistance with records.

Writing-stage SHA-256: `3d7dfe032176623a7cce00b730b56c8f9a4b9d612e4fdf7687bdf861474c8a34`. V1 stage: `3d7dfe032176623a7cce00b730b56c8f9a4b9d612e4fdf7687bdf861474c8a34`. V2 stage: `62f823659ae9ba9852645b3f0a87cd095b1bb9bf5c4ec2121495e07f0d228da4`. Candidate: `9243aab98e701af974666d4d962aabdc0b19cf4b346935b5c4cf633b704fa758`.

| Summary sentence | Pinned candidate facts |
| --- | --- |
| From 1858 to early 1861, Ulysses S. Grant was thirty-six to thirty-nine. | `fact-age` |
| His family had serious illnesses, and his own fever reduced his ability to work and supervise farmworkers. | `fact-family-illness`, `fact-behind`, `fact-fever` |
| That farm household used enslaved labor. | `fact-enslaved-labor` |
| He sold stock, crops and tools, then entered a real estate partnership that could not support two families. | `fact-auction`, `fact-agency` |
| He did not receive the county engineer appointment and remained unemployed in late 1859. | `fact-engineer`, `fact-unemployed` |
| He wanted the prospect of eventually doing business for himself. | `fact-father-offer`, `fact-income-preference` |
| In 1860 he took a salaried clerkship in his father's store, where his younger brothers already worked, and supported his family. | `fact-move`, `fact-salary` |
| In 1861 he helped drill a volunteer company and accompanied it to the state capital. | `fact-help` |
| Preparing to return home, he was asked by the governor to stay and visit the office next morning. | `fact-departure`, `fact-front-door`, `fact-overnight` |
| He accepted work preparing troop paperwork using his army experience, relying on a clerk for assistance with records. | `fact-office`, `fact-forms`, `fact-clerk-help` |

- Ulysses S. Grant, Letters to His Father and His Youngest Sister, 1857–78, edited Jesse Grant Cramer (1912). Letters March 21, September 7 and October 1, 1858; March 12 and October 24, 1859; April 29 and May 2, 1861. Claim support is in Grant’s letters, not editorial commentary. https://www.gutenberg.org/files/13471/13471-h/13471-h.htm
- Ulysses S. Grant, Personal Memoirs (1885). Chapter I birth; Chapter XVI farming, property agency and store; Chapter XVII volunteer company, hotel-front-door encounter and office work. https://www.gutenberg.org/cache/epub/4367/pg4367-images.html
- U.S. National Park Service, Ulysses S. Grant. Quick Facts and biography service and presidency paragraphs. https://www.nps.gov/people/ulysses-s-grant.htm

## jacobs

In 1835–1842, Harriet Jacobs, an enslaved mother, spent nearly seven years hidden beneath the roof of her grandmother's house. Her age range of twenty to twenty-nine reflects uncertain birth chronology. Relatives brought food through concealed access. She could not stand upright; the unlit, poorly ventilated space left her cramped and in physical pain. She heard her children below, cried and wanted to see or speak to them. Using a boring tool, she made an opening for air and watched her children through it. Rain later drenched her clothes and bedding, and fear of discovery complicated repairs. She gave up the first arranged escape when her family feared danger after a fugitive killing, then left with relatives' and a friend's assistance. The vessel's captain warned her and another escaping woman to stay below when other ships were visible. Near departure, she feared being returned. They reached a northern city, but Jacobs had left loved ones behind and remained legally enslaved. After landing, racial discrimination barred her from first-class rail cars. Her legal freedom was obtained in 1852.

Writing-stage SHA-256: `a8cc1d0240c8a1f78ab0e69b6374a2d9e77eb1d2517b97ddcdbde58c6898940d`. V1 stage: `b1b42c978305421387e6f7d12bb0798884eef2e6f8e3b352d458ba49fcb42b37`. V2 stage: `1e742185296306e1002dd43be85485cda013eeb874a0206537bbd68b3ffeb9d8`. Candidate: `515a62f30d6c8d6dac0fe7c02f6a112065f353d24c0fcc69f71b847305fd87ed`.

| Summary sentence | Pinned candidate facts |
| --- | --- |
| In 1835–1842, Harriet Jacobs, an enslaved mother, spent nearly seven years hidden beneath the roof of her grandmother's house. | `age`, `space`, `years`, `children`, `legal` |
| Her age range of twenty to twenty-nine reflects uncertain birth chronology. | `age` |
| Relatives brought food through concealed access. | `aid` |
| She could not stand upright; the unlit, poorly ventilated space left her cramped and in physical pain. | `space`, `darkness`, `years` |
| She heard her children below, cried and wanted to see or speak to them. | `children` |
| Using a boring tool, she made an opening for air and watched her children through it. | `tool`, `holes`, `air`, `seeing` |
| Rain later drenched her clothes and bedding, and fear of discovery complicated repairs. | `leak` |
| She gave up the first arranged escape when her family feared danger after a fugitive killing, then left with relatives' and a friend's assistance. | `lost-chance`, `departure` |
| The vessel's captain warned her and another escaping woman to stay below when other ships were visible. | `cabin`, `quiet` |
| Near departure, she feared being returned. | `distrust` |
| They reached a northern city, but Jacobs had left loved ones behind and remained legally enslaved. | `arrival`, `legal` |
| After landing, racial discrimination barred her from first-class rail cars. | `rail` |
| Her legal freedom was obtained in 1852. | `legal` |

- Harriet A. Jacobs, Incidents in the Life of a Slave Girl (1861), preface and chapters XXI, XXIX–XXXI. https://www.gutenberg.org/cache/epub/11030/pg11030-images.html
- North Carolina Department of Natural and Cultural Resources, Harriet Jacobs c.1813–1897 (A-72). https://www.dncr.nc.gov/blog/2023/12/04/harriet-jacobs-c-1813-1897-72

## keller

In March–May 1887, Helen Keller was six and unable to see or hear after an early childhood illness of uncertain diagnosis. Anne Sullivan's letters describe tactile fingerspelling lessons with a doll, cake and other objects. Keller first imitated finger forms while puzzled. When Sullivan withheld the doll, Keller grew angry; the teacher forced her into a chair and held her, then released her and resumed the exercise. Sullivan interpreted the anger as believing the doll was being taken away. Keller learned more words but confused object names and drinking gestures. Search games initially defeated her, and requests commonly combined single words with gestures. In April, she unsuccessfully sought a hidden cracker, examined Sullivan's mouth, and pointed to her stomach while spelling eat. Sullivan interpreted this as asking whether she had eaten it. By May Keller asked about objects on walks and reported to her mother, still making mistakes and needing Sullivan's help.

Writing-stage SHA-256: `b1db24b02de4260c42e9a4efc4c9ecb6a06fb6df82ff5ffde38d35d466cb7fa8`. V1 stage: `b1db24b02de4260c42e9a4efc4c9ecb6a06fb6df82ff5ffde38d35d466cb7fa8`. V2 stage: `a52a2553641b684f809ed4e7c5bbb921ca2b376769cddf4252ee6a2b8fe140ac`. Candidate: `d0103c4b4447cfa5c1d1c8dc9e3e74be8146ec0a40399e7cb2f8b91e5054a94a`.

| Summary sentence | Pinned candidate facts |
| --- | --- |
| In March–May 1887, Helen Keller was six and unable to see or hear after an early childhood illness of uncertain diagnosis. | `fact-age`, `fact-loss`, `w-walks` |
| Anne Sullivan's letters describe tactile fingerspelling lessons with a doll, cake and other objects. | `w-doll`, `w-cake`, `fact-repeat` |
| Keller first imitated finger forms while puzzled. | `w-doll` |
| When Sullivan withheld the doll, Keller grew angry; the teacher forced her into a chair and held her, then released her and resumed the exercise. | `w-restraint`, `w-cake` |
| Sullivan interpreted the anger as believing the doll was being taken away. | `w-interpretation` |
| Keller learned more words but confused object names and drinking gestures. | `fact-repeat`, `fact-confusion` |
| Search games initially defeated her, and requests commonly combined single words with gestures. | `fact-game`, `fact-grammar` |
| In April, she unsuccessfully sought a hidden cracker, examined Sullivan's mouth, and pointed to her stomach while spelling eat. | `w-cracker` |
| Sullivan interpreted this as asking whether she had eaten it. | `w-question` |
| By May Keller asked about objects on walks and reported to her mother, still making mistakes and needing Sullivan's help. | `w-walks` |

- Anne Sullivan's 1887 letters to Sophia Hopkins, reproduced in The Story of My Life (1903). https://www.gutenberg.org/files/2397/2397-h/2397-h.htm Part III, Education: editorial note on extracts; March 6 first doll/cake lesson; March 20 cup/milk confusion; April 10 requests; April 24 grammar, initial failed searches, and that morning's cracker search; May 8 small/large words; May 16 walks, reports, and mistakes.
- American Foundation for the Blind, Chronology of Helen Keller's Life. https://www.afb.org/about-afb/history/helen-keller/biography-and-chronology/chronology Entries June 27, 1880, February 1882, March 3 and April 5, 1887; institutional chronology for dates and age.
- American Foundation for the Blind, Helen Keller Biography. https://www.afb.org/about-afb/history/helen-keller/biography-and-chronology/biography Opening full-name paragraph; Political and Social Activism section for writer identity and disability advocacy.

## riis

Jacob Riis was approximately twenty-three to twenty-four during his first reporting work in 1873–1874. After two unpaid weeks at a local newspaper, he tried selling books and earned nothing from a day's canvassing. Hungry and without money, he sat on steps with his dog and felt three years had been wasted. His former telegraph-school principal recognized him and gave him an introduction to a news agency. Riis found a new home for the dog and delivered the letter. The desk editor allowed a trial assignment covering a public lunch. Riis watched the food without eating, then wrote a report that earned him acceptance and a regular reporting time. Afterward he collapsed on the stairs at a separate boarding house. The job provided food and pay but involved low wages, long days and multiple evening assignments. The first winter's long rides left his feet painfully cold.

Writing-stage SHA-256: `652ce7834f17917babbc28d135b08630b5c07e98642bbb411f0e449032730ab9`. V1 stage: `0aa584264dceb7d0792576dd52435c38d619c5a8780e283471417a2651dd5ad9`. V2 stage: `8f16ac5cd2cd5f60ab56542e6cc178b6708db1aa78d7a2fb5c88133ba9d17b44`. Candidate: `aa17b49862bdf3bbf994ee02af41c5175c4506584f0e165070759613d38a28b2`.

| Summary sentence | Pinned candidate facts |
| --- | --- |
| Jacob Riis was approximately twenty-three to twenty-four during his first reporting work in 1873–1874. | `age` |
| After two unpaid weeks at a local newspaper, he tried selling books and earned nothing from a day's canvassing. | `first-job`, `unpaid`, `canvass` |
| Hungry and without money, he sat on steps with his dog and felt three years had been wasted. | `steps`, `despair` |
| His former telegraph-school principal recognized him and gave him an introduction to a news agency. | `teacher`, `letter` |
| Riis found a new home for the dog and delivered the letter. | `dog-home`, `morning` |
| The desk editor allowed a trial assignment covering a public lunch. | `trial`, `meal` |
| Riis watched the food without eating, then wrote a report that earned him acceptance and a regular reporting time. | `meal`, `accepted` |
| Afterward he collapsed on the stairs at a separate boarding house. | `collapse` |
| The job provided food and pay but involved low wages, long days and multiple evening assignments. | `workload` |
| The first winter's long rides left his feet painfully cold. | `workload` |

- Jacob A. Riis, The Making of an American (1901), chapter V and opening of chapter VI. https://www.gutenberg.org/cache/epub/6125/pg6125-images.html
- Library of Congress, Jacob Riis exhibition, Biography. https://www.loc.gov/exhibits/jacob-riis/biography.html
- Library of Congress, Jacob A. Riis Papers finding aid, Biographical Note. https://tile.loc.gov/storage-services/service/gdc/gdcfindingaidpdfs/ms010258/ms010258.pdf

## seacole

Mary Seacole was forty-eight to forty-nine during 1854–1855. Experienced in caring for patients in Jamaica and Panama, she offered her experience and references for army nursing in London. Office requests failed; she was told that nursing places were filled, and her final request for funded passage was refused. Her memoir records grief and tears and her suspicion of racial prejudice, without establishing officials' motives. She stood on the street and prayed, then resolved to travel at her own expense. With Thomas Day, she planned a store and hotel near the camp and spent limited capital on medicines and home comforts. She proceeded despite warnings and difficult goods transfers. At the sick wharf, she assisted a wounded artilleryman with dressings and tea. A surgeon thanked her and welcomed her help. For six weeks she sold stores ashore and helped transfer wounded men to hospital ships, sleeping aboard ship at night. A later letter reports business misfortune.

Writing-stage SHA-256: `a85ff657cd70e8d1f7b33488334238f003600f3ddbdb6631b6573e9277fac5fb`. V1 stage: `a85ff657cd70e8d1f7b33488334238f003600f3ddbdb6631b6573e9277fac5fb`. V2 stage: `0fd509e00f40915730c5b9eeefad2e91bea1331ccc1b44d9e2b1578d42aeb248`. Candidate: `6775e85d7a9682cc241ffaaaed5e2f5e5c5051c9fdc3f5758f1ec1c0a777b75a`.

| Summary sentence | Pinned candidate facts |
| --- | --- |
| Mary Seacole was forty-eight to forty-nine during 1854–1855. | `f-age` |
| Experienced in caring for patients in Jamaica and Panama, she offered her experience and references for army nursing in London. | `f-experience` |
| Office requests failed; she was told that nursing places were filled, and her final request for funded passage was refused. | `f-hall`, `f-full`, `f-final` |
| Her memoir records grief and tears and her suspicion of racial prejudice, without establishing officials' motives. | `f-tears`, `f-doubt` |
| She stood on the street and prayed, then resolved to travel at her own expense. | `f-final`, `f-tears`, `f-morrow` |
| With Thomas Day, she planned a store and hotel near the camp and spent limited capital on medicines and home comforts. | `f-cards`, `f-partner`, `f-capital` |
| She proceeded despite warnings and difficult goods transfers. | `f-warning`, `f-transfer` |
| At the sick wharf, she assisted a wounded artilleryman with dressings and tea. | `f-arrival`, `f-dressings`, `f-tea` |
| A surgeon thanked her and welcomed her help. | `f-surgeon` |
| For six weeks she sold stores ashore and helped transfer wounded men to hospital ships, sleeping aboard ship at night. | `f-routine` |
| A later letter reports business misfortune. | `f-later-cost` |

- Mary Seacole, Wonderful Adventures of Mrs. Seacole in Many Lands (1857), edited by W. J. S.; retrospective personal account. VIII, pp.73–82; IX, pp.83–85; X, pp.93–100 https://www.gutenberg.org/files/23031/23031-h/23031-h.htm
- National Library of Jamaica, Mary Seacole (1805–1881), institutional biography. Used only for identity and birth chronology. Biographical heading and opening paragraph https://nlj.gov.jm/project/mary-seacole-1805-1881/

## washington_b

Booker T. Washington was about sixteen when he traveled toward Hampton in 1872; his autobiography says his exact birth date was unknown. He arrived in Richmond hungry, exhausted and without money or lodging. He slept under a raised sidewalk, using his clothing satchel as a pillow. At dawn he asked a ship's captain for unloading work to earn food. Days of paid work and continued sleeping beneath the sidewalk allowed him to save enough to travel on. At Hampton, the head teacher initially left him waiting. She then asked him to sweep a classroom. He repeatedly swept and dusted, moved furniture and cleaned corners and closets. After inspecting the room and finding no dust, she admitted him. He worked as a janitor while preparing lessons, borrowed books and received used clothing and encouragement from teachers. The janitor work paid board; separate financial help was needed for tuition.

Writing-stage SHA-256: `113c6b0e9519697a5c49c8fb428c2227789b6ec77e9bc5d45d13fefd95e073b0`. V1 stage: `113c6b0e9519697a5c49c8fb428c2227789b6ec77e9bc5d45d13fefd95e073b0`. V2 stage: `42c2c501b720c9bb1cfa504eee1b3b61cda0f89668fdff042a1bec79d9264677`. Candidate: `d13fce353183245f5cd8d0feff765c9d2dd2301921011437113e9273f20a2044`.

| Summary sentence | Pinned candidate facts |
| --- | --- |
| Booker T. Washington was about sixteen when he traveled toward Hampton in 1872; his autobiography says his exact birth date was unknown. | `fact-age` |
| He arrived in Richmond hungry, exhausted and without money or lodging. | `fact-city`, `fact-food` |
| He slept under a raised sidewalk, using his clothing satchel as a pillow. | `fact-bag`, `fact-rest` |
| At dawn he asked a ship's captain for unloading work to earn food. | `fact-ask` |
| Days of paid work and continued sleeping beneath the sidewalk allowed him to save enough to travel on. | `fact-breakfast`, `fact-saving` |
| At Hampton, the head teacher initially left him waiting. | `fact-arrival`, `fact-wait` |
| She then asked him to sweep a classroom. | `fact-sweep` |
| He repeatedly swept and dusted, moved furniture and cleaned corners and closets. | `fact-clean` |
| After inspecting the room and finding no dust, she admitted him. | `fact-inspect` |
| He worked as a janitor while preparing lessons, borrowed books and received used clothing and encouragement from teachers. | `fact-janitor`, `fact-books` |
| The janitor work paid board; separate financial help was needed for tuition. | `fact-aid` |

- Booker T. Washington, Up from Slavery: An Autobiography (1901). https://www.gutenberg.org/files/2376/2376-h/2376-h.htm Chapter I, opening birth uncertainty; Chapter II, name paragraphs for reveal; Chapter III, late-night Richmond arrival through initial Hampton work, books, socks, and tuition aid; Chapter VII, founding school teaching purpose for the bridge.
- U.S. National Park Service, Washington Timeline. https://www.nps.gov/bowa/learn/historyculture/washington-timeline.htm Timeline entries 1856 and 1872, compared with Chapter I of the memoir.
