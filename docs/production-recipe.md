# Production Story Recipe

This file is generated from `config/story-recipes.json`. Do not edit it by hand.

- Primary dataset: `match-104-2026-07-02` (`f87962a57990f65a8765afdcd141bbdd1c3b9f5a965d04f4810f1787d8aa2a1e`)
- Primary dataset visibility: `synthetic`
- Primary recipe: `keyword-rerank-figure-library-50-2026-07-02`
- Rollback recipe: `keyword-rerank-figure-library-50-2026-07-02`
- Decision record: `rd_c5c82ca18b56997b606f2d30e8d03cde57365a806b78fefeb436065085b2ad8b`

| Recipe | Dataset | Retrieval | Reranker | Embedder | Role |
|---|---|---|---|---|---|
| `keyword-rerank-figure-library-50-2026-07-02` | `match-104-2026-07-02` | keyword | real / `gpt-oss-120b` | Not used | Primary |
| `facetsrag-rerank-figure-library-50-2026-07-02` | `match-104-2026-07-02` | facetsrag | real / `gpt-oss-120b` | `gemini-embedding-001@d1536` | Challenger |
| `keyword-rerank-personalized-preface-v2-figure-library-50-2026-07-28` | `match-104-2026-07-02` | keyword | real / `gpt-oss-120b` | Not used | Challenger |

Production must name either the primary or rollback recipe explicitly. The selected manifest is the sole non-secret behavior source; stale provider, model, tuning, retrieval, embedder, and composer environment values are ignored. A selector-only rollback is valid only inside the same installed library, rerank/story prompts, validator, schema, boundary, and composer compatibility set.

Historical datasets, recipes, evidence, decisions, promotions, and database registrations remain append-only. Eval and shadow tools emit non-authoritative candidates only (`promotable=false`). A candidate recipe/evidence set must land on the protected base before a separate promotion-only pull request. That pull request may change only the selector, one content-addressed decision, this generated document, and one exact generated registration migration. Its rollback and decision source must be the base commit's primary recipe.

Promotion authority belongs only to the dependency-free attestor loaded by the base-owned `pull_request_target` workflow from that protected commit. The GitHub `recipe-promotion` environment exposes its secret, read-only review API token, and exact head/decision/dataset/catalog/evidence/shadow/commit/input-tree/run/deployment/source-hash/reviewer bindings to the single attestor step; no checkout, install, eval, or pull-request-controlled script receives them. The attestor also requires each role's latest GitHub review to approve the exact head. Branch protection must require ordinary CI plus the always-running `recipe-promotion-gate`, independent environment reviewers, CODEOWNERS review, dismissal after new commits, no direct pushes, and a strict up-to-date branch so success cannot be reused against an advanced base. The current workflows do not handle `merge_group`; keep merge queue disabled unless both required workflows add and verify that trigger.

Release blocker (verified July 23, 2026): this repository is private on a GitHub plan whose branch-protection API returns `403` and says GitHub Pro or public visibility is required. The controls above are therefore not enforceable yet. Recipe promotion must remain disabled until the plan or visibility changes and the required checks, CODEOWNERS review, stale-review dismissal, environment reviewers, and no-direct-push rule are configured and verified.
