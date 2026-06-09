-- Onward — FacetsRAG retrieval, migration 0002
-- Per-text embedding rows for the in-memory Stage-A/Stage-B retrieval. Apply by pasting into the
-- Supabase SQL editor (after 0001). snake_case mirrors lib/types.ts; facet_type is the snake_case
-- FacetType from lib/types.ts (the camel↔snake crossing lives in facetText()).
--
-- Storage choice: `embedding` is real[] (a plain float array), NOT pgvector. Vectors round-trip as
-- clean number[] through supabase-js, are loaded once into a process cache (lib/embeddings-cache.ts),
-- and cosine is computed in JS (both sides L2-normalized → dot product). pgvector + HNSW is a future
-- migration once the library reaches hundreds of figures; in-memory exact cosine is correct at this
-- scale.
--
-- Stale-vector gate (replaces partial HNSW): a row is valid for retrieval ONLY when model_id ==
-- the active embedder AND content_hash == sha256(current source text). Multiple model_id rows may
-- coexist; the loader (lib/embeddings-cache.ts) admits only matching rows. model_id + content_hash
-- + dimension are stored on every row so the gate is enforceable without re-reading source text.

-- ── figure_shape_embeddings: one row per shape sentence per model ───────────
create table if not exists figure_shape_embeddings (
  figure_key   text        not null,
  stage_id     text        not null,
  shape_index  int         not null,
  model_id     text        not null,
  dimension    int         not null,
  input_type   text        not null,
  content_hash text        not null,
  embedding    real[]      not null,
  created_at   timestamptz not null default now(),
  primary key (figure_key, stage_id, shape_index, model_id),
  constraint figure_shape_embeddings_stage_fk
    foreign key (figure_key, stage_id)
    references figure_stages (figure_key, stage_id) on delete cascade
);

-- ── figure_facet_embeddings: one row per facet per model ────────────────────
-- facet_text is the embedded micro-document (kept for audit / re-embed); never shown to rerank.
create table if not exists figure_facet_embeddings (
  figure_key   text        not null,
  stage_id     text        not null,
  facet_type   text        not null,
  model_id     text        not null,
  dimension    int         not null,
  input_type   text        not null,
  content_hash text        not null,
  facet_text   text        not null,
  embedding    real[]      not null,
  created_at   timestamptz not null default now(),
  primary key (figure_key, stage_id, facet_type, model_id),
  constraint figure_facet_embeddings_type_check
    check (facet_type in ('emotional_core', 'decision_shape', 'trigger_event', 'agency_state')),
  constraint figure_facet_embeddings_stage_fk
    foreign key (figure_key, stage_id)
    references figure_stages (figure_key, stage_id) on delete cascade
);

-- ── RLS: default-deny for anon; service-role key (lib/db.ts) bypasses RLS ───
-- No policies → anon/authenticated read/write nothing. The browser never queries these tables;
-- all access is server-side through the service-role key, which bypasses RLS entirely.
alter table figure_shape_embeddings enable row level security;
alter table figure_facet_embeddings enable row level security;
