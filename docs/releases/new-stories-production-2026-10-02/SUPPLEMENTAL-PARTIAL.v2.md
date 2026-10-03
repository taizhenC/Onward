# Durable partial v2 supplemental measurement

Read-only inspection on 2026-10-03 UTC of `MATCHING-EXTENSION-v2-projected44-3c28cdc7-f80f-4c48-aa5a-e52afa3c9419.json` in the production worktree. Raw receipt SHA-256: `07a999839e0556c648ce8f2ccf4ed5b413bd615741632517ba44feb5c934d896`.

**This run is incomplete: 79/89 planned trials are durably recorded.** The receipt states `complete:false`, `completedAt:null`, `ok:false`, `authoritative:false`, and `promotable:false`. Its last saved trial is original 104 index 85, Banting, chosen correctly. The optional original slice was selected as 69 cases, but only 59 were saved; the twenty extension cases were all saved. The other 35 unavailable original primary labels remain explicitly unavailable and never count as correct.

| Persisted subset | Correct positives | Correct all cases | Miss detection |
| --- | --- | --- | --- |
| Extension | 17/20 | 17/20 | No miss cases |
| Existing original slice so far | 53/56 | 55/59 | 2/3 |
| Combined durable observations | 70/76 | 72/79 | 2/3 |

The original-slice all-case result is 55/59, not 56/59. These are partial-subset observations, not completed 89-case metrics. All 79 persisted trials used rerank, with zero saved keyword fallbacks, checker errors, response-cap failures or deadline failures. The four persisted definitive-wrong observations comprise extension 17, original 0, original 7 and miss 21. A miss framed definitive counts as wrong in this supplemental instrument.

The extension's newly observed rerank error is case 6, Equiano→Faraday medium/partial despite the expected label surviving. Known case 13 remains Riis→Butler medium/partial with shortlist failure; known case 17 remains Washington→Andersen high/definitive with shortlist failure. Nine adult-age-reachable figures each have an observed correct adult extension case; Keller's two age-six cases remain diagnostics and do not establish ordinary adult availability.

Persisted original wrong cases are 0 Butler→Brontë high/definitive, 1 Douglass→Equiano medium/partial, 7 Douglass→Jacobs high/definitive, and 21 miss→Chandler high/definitive. Their expected positive labels survived retrieval. The remaining ten selected original trials have no durable result and cannot be inferred from the full 104 run or counted as correct.

The parent process reported `extension_local_boundary_failed`. The outer exception boundary deliberately emits no raw exception and does not expose an underlying `Error.code`; this record does not establish EPERM, provider error or another specific cause. Saved transport/request totals describe the persisted trials, not necessarily every operation attempted after the last successful receipt write. No automatic retry, repeated gate shopping, source change or frozen checker edit was made as part of this inspection.

The receipt pins reviewed v2 library `bb27964f0d5347deba75b20bd33c59ecba4289a6a95f9618b891fefbda020061`, v2 checker `4addc9807604491b804122adbd21dbae87aed28e597fd760b5e5f0bc2dc1a331`, and facts proposal `9427e7e099252b91d7f23b3873fa0a32b9f770a93aa0dcfacc2a47c44e7883ac`, with unchanged gold, extension, projection and recipe hashes. The complete fresh full 104 official gate already failed independently. This partial supplemental observation supports further investigation; it cannot support publication or claim the 89-case run completed.
