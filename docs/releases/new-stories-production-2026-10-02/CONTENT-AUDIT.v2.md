# Installed factual-summary v2 integrity audit

Read-only audit of the production worktree at commit `4a494259aee5b00f7d03791b78a932b39d9947df`, recorded 2026-10-03 UTC. Installed `lib/figures-data.ts` disk and `HEAD` bytes both have SHA-256 `bb27964f0d5347deba75b20bd33c59ecba4289a6a95f9618b891fefbda020061`.

The original production base is `38815c83922afd7350ab1f1aafcd3dcafd874cd3`. I independently transpiled and loaded its library declarations, then compared them with the installed worktree library. All fifty original stages, ordering and structured values remain exact. The complete original 612,845-byte declaration prefix also remains an exact prefix of the installed source.

All ten appended stages are structurally equal to the final dot-named v2 proposal's pinned `facts-v2-stages/` copies; every copy's raw SHA-256 equals its proposal pin. The proposal's hash remains `9427e7e099252b91d7f23b3873fa0a32b9f770a93aa0dcfacc2a47c44e7883ac`. The separate independent `FACTS-REVIEW.v2.md` and `FACTS-COVERAGE.v2.json` record source quality, facts-only field scope and exact retrieval preservation. This audit confirms that approved metadata was actually installed.

The following disk files remain byte-identical to the production base: `lib/match-config.ts`, `lib/keyword-match.ts`, `lib/matching.ts`, `lib/llm-real.ts`, `config/story-recipes.json`, `config/prompt-releases.json`, `evals/match.json`, and `config/figure-library-releases.json`. The v1 supplemental checker still hashes to `f1557ee1c1a5536aebd2953bfa874b7c1cbebfedc24e5fba93683e50fb620203`.

Outside documentation, the complete base-to-current tracked diff consists of the intended library addition/facts correction, `README.md`, the previously audited two dependency-lock entry patches, and the newly preserved initial failed original 104 evidence file `ev_86ef2374e263d41eae3302d69837f3ced8700f41264248e0a146f5e21cd626d9.json`. No auth, API, schema, routing, age policy, model policy, prompt or original gold change was introduced.

At this checkpoint the fresh v2 official gate was still running. This integrity audit does not claim its result, registry promotion, review-role publication, database mutation, deployment or cache refresh. Preserve the initial v1 failed evidence and passing original 50 baseline as separate measurements; the v2 release decision must refer to its own exact committed library and newly completed receipts.
