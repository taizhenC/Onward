// Edge-safe installed-code identity for the closed-template facet tagger.
// Provider/model/prompt/tuning identity remains in llm-recipe-constants; these
// constants cover the retrieval-specific axes shared by recipe parsing,
// FacetSignal validation, and future execution-plan checks.
export const FACET_TAGGER_MODE = "closed_template" as const;
export const FACET_SIGNAL_SCHEMA_VERSION = "facet-signal-v1-2026-07" as const;
// v2 (2026-08): adds emotional_core/imposed_life and trigger_event/constraint_lifted — the two
// episode shapes the v1 catalog could not express (living a life chosen by others; an episode
// that begins when a constraint lifts rather than when a setback lands). Catalog changes are a
// schema release by contract (lib/facet-signal.ts) and require projection-only shadow
// evaluation before any recipe binds them.
export const FACET_PROJECTION_SCHEMA_VERSION =
  "facet-query-template-catalog-v2-2026-08" as const;
export const FACET_TAGGER_QUERY_MODE = "validated_projection" as const;
export const FACET_TAGGER_WEIGHTING_MODE = "static" as const;
export const FACET_TAGGER_EXPANSION_ENABLED = false as const;
