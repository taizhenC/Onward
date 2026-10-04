# New-three library integration audit

**Integration PASS; release remains blocked.** This independent read-only audit binds commit `df19fecee5aafafd57a7f349380a294522c80b44` (tree `5d1127d7a4a15a03bee18cfec2a42469b9ba8689`) against base `405f82357351723da6000b9a169999f3c7975191`. Audited at 2026-10-04T00:43:40.710Z.

The first 60 exported objects retain identical values, object source text, definition bytes, and export order. The appended order is Franklin, Slocum, Somerville. Each new object equals its frozen stage JSON exactly. All six committed candidate/stage blob hashes match `INPUTS.json` and the supplied database draft receipt; every candidate remains draft with empty review metadata. These are receipt comparisons, not a fresh live database check.

The original 104-case dataset is byte-identical (`f87962a57990f65a8765afdcd141bbdd1c3b9f5a965d04f4810f1787d8aa2a1e`). The registry only appends the 12-case synthetic dataset (`acb9830130d99d362d81706ea88baa58a3116a77b892b11f408242277e29c189`); its three miss controls equal the original objects. Existing datasets, recipes, selector, promotions, evidence history, decisions, prompts, scripts, migrations, and release lineage are unchanged.

No integration defect was found. The following release blockers remain:

- The proposed library `1a33b7b45b48bc054f0eb0d1504bfd7ac312a07f41f678ff032acfa9e97eaa90` is unregistered. The latest release remains `bb27964f0d5347deba75b20bd33c59ecba4289a6a95f9618b891fefbda020061`; the unchanged governance assertion at `scripts/check-recipe-governance.ts:149` correctly rejects that mismatch.
- Fresh passing real matching evidence must bind the exact committed library/input tree before a normal release can be registered. The prior ten-story owner exception is pinned to its exact older library and cannot authorize this addition.
- Owner reading approval is still pending in the frozen inputs. AI cross-review does not supply that approval.
- The 67-step passing CI receipt belongs to commit `6b9816b40405ad0875239453225827a244440b38` with the prior 60-stage library. It is not CI evidence for this 63-stage proposal; required checks must pass on the final registered release head.

No environment file, provider, DB, authentication, matching measurement, source mutation, or Git mutation was used. Only this Markdown report and its JSON companion were written.
