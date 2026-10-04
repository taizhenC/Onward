# Fresh 104-case matching failure audit

**The 63-stage proposal remains held.** Both saved runs get 96/101 positive cases right. Miss detection improves 2/3 → 3/3, while wrong definitive matches increase 1 → 3. The unchanged gate fails positive accuracy and wrong definitive checks. The new run is df19fecee5aafafd57a7f349380a294522c80b44; the prior 60 evidence binds 4a494259aee5b00f7d03791b78a932b39d9947df.

The actual pure age, keyword, top-six, candidate, and prompt functions reproduced every recorded age-pool count, candidate count, and facts-character total in both 104 traces. Of 104 reconstructed user prompts,86 are identical and18 change. Existing matching source files are byte-identical between the two evidence commits.

| Index (zero-based) | Expected | Prior60 choice | New63 choice | Prior → new ordered shortlist |
| --- | --- | --- | --- | --- |
| 6 | butler | butler high/definitive | banting medium/partial | Unchanged: butler, owens, banting, ramanujan, andersen, sullivan_a |
| 7 | douglass | jacobs medium/partial | jacobs high/definitive | Unchanged: jacobs, douglass, owens, riis, hurston, equiano |
| 37 | lee | graham medium/partial | graham high/definitive | lee, rustin, seacole, graham, chandler, child → lee, rustin, somerville_m, seacole, graham, chandler |
| 42 | fitzgerald_e | fitzgerald_e medium/partial | sullivan_a medium/partial | Unchanged: fitzgerald_e, douglass, jacobs, berlin_i, sullivan_a, washington_b |
| 99 | butler | coleman high/definitive | coleman high/definitive | Unchanged: addams, anning, blackwell_e, butler, coleman, hurston |

All five expected figures survive top six; none of the five wrong picks is a new-three figure. Newly wrong cases 6 and42 have unchanged candidate payloads and user prompts. Cases7 and99 also retain identical prompts and were already wrong; 7 changes medium/partial → high/definitive, while 99 remains high/definitive. These observations support an existing matching ambiguity plus provider decision/calibration variation; they do not prove a specific backend cause.

Case 37 is the only failed case with changed candidate content. Somerville enters rank3 and displaces Child. Lee stays rank1; the selected Graham was already wrong in the prior 60 run. Its facts count grows 7,553 → 10,651 (+3,098). A context effect is possible, but the paired snapshots do not establish that Somerville caused the confidence change or expose a source-writing defect.

A deterministic saved-outcome replay through the actual evaluator functions returned exit 1 with the same failed checks. Its minimal captured case is index 7, a wrong definitive match. The pure retrieval/prompt path is also a usable deterministic seam. Neither seam replays fresh provider inference; the trace does not retain raw provider response or resonance/gap.

The companion JSON contains input/evidence/trace SHA-256 pins, each failed shortlist and prompt hash, the ranked hypotheses, and a self-contained no-provider gate replay. Run it from the managed repository:

```powershell
$audit = Get-Content D:/code_save/Onward/docs/releases/new-three-2026-10-03/FAILURE-AUDIT.json -Raw | ConvertFrom-Json
node -e $audit.replayScripts.gate
```

This replay intentionally remains red on frozen failed outcomes; it is not evidence that a future provider change is fixed. The field `promptChars` records candidate facts characters, not total rendered prompt length. The original 60 run already failed, so restoring its registered source does not convert matching to PASS. Supplemental 12 stopped at the deterministic prefilter before any provider call; no supplemental accuracy is asserted.

Only this report and its JSON companion were written. No recipe, gold, threshold, stage, code, database, or provider state was changed.
