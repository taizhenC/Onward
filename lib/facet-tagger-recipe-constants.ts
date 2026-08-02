// Edge-safe installed-code identity for the closed-template facet tagger.
// Provider/model/prompt/tuning identity remains in llm-recipe-constants; these
// constants cover the retrieval-specific axes shared by recipe parsing,
// FacetSignal validation, and future execution-plan checks.
export const FACET_TAGGER_MODE = "closed_template" as const;
export const FACET_SIGNAL_SCHEMA_VERSION = "facet-signal-v1-2026-07" as const;
export const FACET_PROJECTION_SCHEMA_VERSION =
  "facet-query-template-catalog-v1-2026-07" as const;
export const FACET_TAGGER_QUERY_MODE = "validated_projection" as const;
export const FACET_TAGGER_WEIGHTING_MODE = "static" as const;
export const FACET_TAGGER_EXPANSION_ENABLED = false as const;
