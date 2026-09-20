# Root checks — revised held stories

20 September 2026. Editorial checks, not historical-reviewer or owner approval.
The reports beside each candidate contain the author's fuller source reading.
This log deliberately distinguishes independent spot checks from full source
collation. Candidate commits do not clear a matching or publication hold.

## Initial six candidates

The root read all seven canonical passages and the research decision for each
candidate below. Each passed the existing draft and in-memory publication
simulation with zero errors and warnings. No simulated review was saved.

| Candidate | Exact SHA-256 checked | Independent check and boundary |
|---|---|---|
| Jones | `5ae4c427a976e86bdf91b1ab8d00852cbba5e2dce808e3905f4491390a493b0f` | Read the TIME essay's opening five paragraphs, Academy interview answers on written examinations and the poem, and the Fresh Air interview's childhood/poem answers. Fresh Air explicitly places shock at the accusation; Academy separately places shock after recitation. These are not a relocated single reaction. The recurring school/religious experience remains marked background. |
| Rustin | `90fea5d3d5b618f27628cfb29b47cc0e2e2943de9debbb7a5e6e5ca9ebf110f6` | Read Cox's early-morning recollection in the Smithsonian oral history. His turnout question and the arriving group support the small external change, not an inferred lowest emotional point or causal response. The author's separate Lewis and contemporary Rustin sources were not independently collated in this spot check. |
| Butler | `ad3631229782cc43e4384987f729afbbbec1d8f4c60771185ce81d7806ea6fd7` | Read the final professional-writing answer in the Beal interview transcription. It supports work on the older manuscript while two novels circulated and mixed replies during that work. The draft does not stage simultaneous letters. Original journal/recording and the author's other two sources were not independently collated here. |
| Rogers | `d358b949cfdecb3bfe442c585ead4c48ab4c2d3a4f03f3700fea23a53702e252` | Read the Fresh Air childhood and grandfather answers. Root rejected unsupported precise ages 8–13. The revised 0–18 is only an editorial childhood envelope; AGE/INTEGRATION HOLD remains. Separate accompaniment and childhood song memories are not fused. The WQED and Rehm passages still require independent cross-review. |
| Rachmaninoff | `220d6776188f6cacf4d570e9bf75821ba822d3a0e9d87af8e99bad48e13f0433` | Read Russian letter 158 directly. The tentative self-assessment and conditional request/fallback survive in the paraphrase. Root fetches of letters 160 and 186 timed out; author reports direct reading of all seven letters. No printed-edition/manuscript collation or human translation sign-off is claimed. |
| Sanders | `0977ece676fa704b065a826f829419a215c269ed4bae755f800015024121352b` | Read KFC's 1952 and 1956 entries: the franchise predates the road expansion. The candidate preserves that distinction. Root's Guideposts fetch was rate-limited; the author read its full publisher HTML through ordinary HTTP. That root access failure is not independent testimony verification. |

Sources actually read for the checks above:

- Jones: [TIME essay](https://content.time.com/time/subscriber/article/0,33009,1071262,00.html), [Academy interview](https://achievement.org/achiever/james-earl-jones/), [Fresh Air interview](https://freshairarchive.org/segments/actor-james-earl-jones), childhood/poem section, not the unrelated interview earlier on the page.
- Rustin: [Smithsonian oral history](https://www.smithsonianmag.com/history/oral-history-march-washington-180953863/), Courtland Cox's early-morning recollection.
- Butler: [Beal interview transcription](https://www.enotes.com/topics/octavia-butler/criticism/criticism/octavia-butler-with-frances-m-beal-interview-date), final question and answer.
- Rogers: [Fresh Air interview](https://freshairarchive.org/segments/tv-host-fred-rogers), childhood question through sister and grandfather answers. A subsequent root check also read the [Rehm transcript](https://dianerehm.org/shows/2016-12-27/fred-rogers-on-parenting-rebroadcast/), 11:31:38 and 11:48:40–11:49:31: play during childhood illness and the accompaniment memory are supported; the later adult illness is excluded.
- Rachmaninoff: [letter 158](https://senar.ru/letters/158), complete substantive text.
- Sanders: [KFC history](https://global.kfc.com/our-history), 1952 and 1956 timeline entries.

## Preservation

All 28 original targets in the previous `remaining-story-review-2026-09-20`
index matched their recorded raw-byte SHA-256 hashes in the initial root check.
That includes the 26 held targets and the two previously published selections.
The new work is additive; no previous review is transferred to rewritten text.

## Carver

Root read all canonical passages and the research decision for SHA-256
`9abb888ac9c7e60aa88da18902957a4abcea919fd207aa25402a6c5ed4dbd328`.
Draft and publication simulation returned zero errors/warnings. Independently
read the [NPS transcription of his autobiographical fragment](https://www.nps.gov/gwca/learn/historyculture/index.htm),
from the Highland refusal through the Simpson laundry and named supporters.
The institution warns this is incomplete recollection, not a definitive life
history. The draft preserves that memory framing and does not turn collective
support into a newly invented rescue encounter. The new foreground and matching
qualification still need owner reading.

## Structural regressions

The existing `check-story-spec`, `check-story-artifact`, `check-story-composer`
and `check-source-transparency` suites all passed locally. These are structural
and safety-contract checks using synthetic/in-memory fixtures, not a provider
evaluation or production deployment. Final exact-file batch checks are recorded
separately after all sets and cross-review corrections are complete.
