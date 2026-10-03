# Independent review of the Seacole writing draft

Reviewed 2026-10-02 by the vocation research agent against `prompts/story-recipe.md` and `prompts/figure-beats.md`. Reviewed the complete canonical reading copy, every sentence treatment, used fact atoms and bounded references, matching stage facts and the completion document. This is a draft review; the saved spec remains `status: draft`, `review: {}`. No publication approval or database mutation is recorded here.

## Exact final bytes

- Candidate: `docs/research/new-stories-2026-10-02/seacole.candidate.json`
- Candidate SHA256: `6775e85d7a9682cc241ffaaaed5e2f5e5c5051c9fdc3f5758f1ec1c0a777b75a`
- Stage: `docs/research/new-stories-2026-10-02/seacole.stage.json`
- Stage SHA256: `a85ff657cd70e8d1f7b33488334238f003600f3ddbdb6631b6573e9277fac5fb`
- Canonical total: 748 words, seven prescribed roles.

Hashes were read directly from disk after the final paragraph-only correction, rather than copied from an earlier review snapshot.

## Sources reopened and bounded checks

Primary episode source: [Wonderful Adventures of Mrs. Seacole in Many Lands, 1857](https://www.gutenberg.org/files/23031/23031-h/23031-h.htm), Chapter VIII, pp. 73–82; Chapter IX, pp. 83–85; Chapter X, pp. 93–100. Checked age against the [National Library of Jamaica biography](https://nlj.gov.jm/project/mary-seacole-1805-1881/), birth heading, November 23, 1805. The biography was available through the same official site's indexed text after a direct-open error. It supports the approximate late-forties wording alongside the memoir's autumn 1854 and early 1855 bounds.

Specific primary bounds reopened:

| Passage | Bounded primary locator | Check |
|---|---|---|
| scene | VIII, pp. 78–79, private address and hall wait; web-text 541–543 | References and persistence are sourced. One instance of attested repeated hall waiting is rendered; no refusal message or interview is moved into that instance. |
| dark and response | VIII, pp. 79–80, final passage refusal through street prayer; 544–547 | One cold-evening sequence supports tears, suspected prejudice, standing still, clouds and prayer aloud. No prayer wording is supplied. |
| struggle | VIII, pp. 80–82, next morning through partnership and supplies; IX, pp. 83–85, officers' warning; X, pp. 93–95, transfer and stores | Planning and travel are openly compressed. Money, partnership, supplies and housing difficulty remain ordinary actions and obstacles. |
| turning point | X, pp. 97–98, first sick-wharf visit through surgeon's welcome; 658–665 | Patient care, tea, hand contact and the surgeon's welcome are one continuous encounter. No second patient is substituted or merged. |
| became | X, pp. 96–99, six-week shore/ship routine and trying work; 656–668 | Care and selling goods both remain visible. Continued work and hardship replace an achievement montage. |
| fold context | X, p. 100, September 1856 letter; 674–679 | Later business trouble is retained as sourced evidence context, without extending the enacted episode. |

The memoir was published retrospectively. Its event atoms are appropriately `probable`; the record supports what she reported, not independent verification of every event or clinical result. The author's suspicion of racial exclusion is preserved as suspicion. Officials' motives are not established. The change in a patient's groans is an observed report, not proof of therapeutic effectiveness. The early-1855 endpoint remains a bounded period, not an invented last shift or precise departure day.

## Findings closed

The draft formerly assigned the grief to the prejudice question itself. The source instead records grief over her motives being doubted. The unsupported question-cause sentence has been removed. A sentence describing what the question did not tell her about officials' thoughts has also been removed; that source-accounting qualification belongs in the fold. The final narrative preserves her attested suspicion without adding knowledge or an unrecorded inner debate.

An abstract subject in became has been replaced by plain action-focused wording. Finally, the five three-paragraph prose passages were reduced to two paragraphs by joining existing paragraphs with a space. The final paragraph edit changes no sentence, word count or evidence mapping. These fixes were sent to the author/root; this reviewer did not edit their candidate.

## Full recipe review

The scene begins with a body waiting in a hall and gives approximate age in the second sentence. The hall instance is source-bounded but undated: the memoir attests repeated waits, not a unique diary-dated visit. This limitation is explicit in the source note. The scene stays in that hall; the later failure is background in the following passage. Dark and response stay in one street sequence. The response is the figure's own attested request for help, before the next morning's rest or renewed determination. The turning point stays beside one patient through the surgeon's approach and welcome. No invented dialogue, room, weather, gesture, realization, or third-party private thought supplies a causal joint.

The concrete anchors are hall traffic, fading light and tears, clouds and spoken prayer, soaked clothes and exposed goods, stiff dressings and tea, and coverings over stores. The struggle keeps the travel warnings and lack of shelter at real length. The became passage keeps care work, commercial work and the difficulty of daily transfers together. There is no military achievement list or implied cure. The register moves from waiting through grief, an exposed request, logistical strain, welcomed work and continuing effort.

Every prose sentence is `historical_claim` linked to used atoms. There is no invented texture, editorial interpretation record or generated quotation. Later business trouble is mapped into the bridge's business-identity evidence so it actually survives the used-fact fold projection; it is omitted from the matching stage's episode retrieval facts. Names, years, city, institution, named war and distinctive dress or equipment are absent before the bridge. The unnamed nursing application and landing-place work remain intelligible without their historical identifiers.

Each non-bridge passage now has two short paragraphs; the bridge keeps its prescribed separate name, plain known-for sentence, exact distance pair and two declarative permissions. Reader address appears only there. The final permission has seven words. The content profile is moderate, carrying `discrimination`, `abuse_or_violence` and `serious_illness`: suspected racial exclusion, crying and wounded patients, without graphic injury detail. The profile does not assert proven discriminatory motives.

## Independent final verification

Ran `npx tsx docs/research/new-stories-2026-10-02/review-education-written.ts seacole` after the paragraph correction. Strict parsing, draft validation and an in-memory publication-shape simulation returned zero errors and warnings. The temporary simulation is not saved approval.

| Role | Words | Mean sentence words | Longest sentence | Final sentence words |
|---|---:|---:|---:|---:|
| scene | 95 | 8.64 | 13 | 11 |
| dark_moment | 115 | 9.58 | 15 | 4 |
| response | 90 | 9.00 | 12 | 8 |
| struggle | 130 | 8.67 | 14 | 5 |
| turning_point | 135 | 8.44 | 15 | 6 |
| became | 123 | 10.25 | 15 | 8 |
| bridge | 60 | 10.00 | 17 | 7 |

Total length, the strict dark cap and sentence rhythm pass. The dark passage is five words below its guidance target; no unsupported particulars were added to pad it. No passage ends on its longest sentence. The final packet has no unresolved blocking factual, chronology, classification, disclosure or content-profile finding. The undated hall instance and retrospective source remain explicit limitations requiring ordinary human editorial judgment before publication.
