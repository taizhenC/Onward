# Remaining-story packet — local verification receipt

20 September 2026 UTC. This is an editorial verification receipt, not a
production audit or human approval. No production credentials, database or
provider were used by these checks.

## Exact snapshot checks

| Directory under docs/releases | Candidates | Required-hash batch result |
|---|---:|---|
| wave-2-rewritten-2026-09-10 | 6 | PASS; older snapshot unchanged |
| wave-3-drafts-2026-09-14 | 9 | PASS; older snapshot unchanged |
| wave-4-drafts-2026-09-19 | 9 | PASS; older snapshot unchanged |
| wave-5-drafts-2026-09-20 | 9 | PASS |
| wave-6-drafts-2026-09-20 | 5 | PASS |
| remaining-story-review-2026-09-20/held-repairs | 1 | PASS |

Command shape: `node --import tsx scripts/check-story-batch.ts <directory> <count> --require-hashes`.

Each check validates exact candidate bytes, strict parsing, version/draft
identity, empty reviews, zero draft and isolated publication-simulation errors
or warnings, canonical composition, artifact integrity, serialized replay and
rhythm. The temporary simulation metadata is not written to candidates.

The 28-entry [master target index](review-targets.json) was independently
recomputed from files: no duplicate figure, all hashes and figure keys match,
all draft with empty review objects. It selects the new Brontë repair instead
of the unchanged September 10 version. There are **2 for owner reading and
26 on HOLD**; neither category is an authorization to publish.

The [final register check](../wave-5-drafts-2026-09-20/research/WAVE-5-FINAL-REGISTER-CHECK.md)
independently verifies all fourteen later drafts and 98 exact reading passages,
including the five literal travel-word replacements. Brontë's separate
[independent review](research/BRONTE-REPAIR-INDEPENDENT.md) binds its final
461-word candidate. The master handoff adds no words to canonical prose.

## Local regression and governance checks

All passed:

- `npm run lint`
- `npm run typecheck`
- `npm run check-story-spec` (50 baseline structural fixtures; all unreviewed
  publication attempts rejected; negative evidence/quote/chronology gates)
- `npm run check-story-artifact` (50 baseline fixtures, disclosure exclusions,
  tamper rejection and replay boundaries)
- `npm run check-source-transparency`
- `npm run check-recipe-immutability -- 40b76165dc29f1f8402c52ca351b62f1fefa7812`
- `npm run check-prompt-releases -- 40b76165dc29f1f8402c52ca351b62f1fefa7812`
- `npm run check-story-quality-immutability -- 40b76165dc29f1f8402c52ca351b62f1fefa7812`
- `node scripts/trusted/recipe-promotion-attestor.mjs self-test`
- `git diff --check 40b7616`

Baseline fixture counts are not a claim that 50 new stories were authored or
approved. Branch scope is editorial files and three read-only CI snapshot
steps. Diff checks confirm no modifications to `lib/`, `prompts/` or the
older frozen wave-two/three/four packets and Hurston repair.

The focused commits use only `taizhenC <tzhcheung@gmail.com>` as author and
committer, with no co-author trailers. A draft PR allows owner reading without
merging or deployment. Remote CI results must be inspected on that PR; this
local receipt does not predeclare a future remote result.

## What remains unresolved

Mechanical integrity and independent source review have different purposes.
The story/episode qualifications and missing evidence are listed in the
[review index](README.md) and each primary-source report. The request to finish
all remaining stories is not fully achieved while 26 substantive holds remain.
No incomplete draft is represented as publication-ready because its JSON passes.
