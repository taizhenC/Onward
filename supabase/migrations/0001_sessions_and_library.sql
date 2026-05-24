-- Onward — Supabase Foundation, migration 0001
-- Durable sessions + the curated library (figures, figure_stages).
-- Apply by pasting into the Supabase SQL editor. snake_case columns mirror the
-- camelCase shapes in lib/types.ts (FigureRow, FigureStageRow, Session).
--
-- Deferred to a later migration (dormant vector pipeline / editorial backlog):
--   create extension vector; figure_shape_embeddings; figure_facet_embeddings;
--   match_misses; figure_editorial_warnings.

-- ── figures: thin identity ────────────────────────────────────────────────
create table if not exists figures (
  key          text primary key,
  display_name text not null,
  birth_year   int,
  death_year   int
);

-- ── figure_stages: the retrievable unit (one emotional episode) ─────────────
-- facets and beats are jsonb holding the const's camelCase objects verbatim, so
-- they round-trip losslessly; only scalars/arrays need snake<->camel mapping.
create table if not exists figure_stages (
  figure_key         text   not null references figures (key) on delete cascade,
  stage_id           text   not null,
  stage_label        text   not null,
  age_min            int    not null,
  age_max            int    not null,
  shape_sentences    text[] not null,
  facets             jsonb  not null,
  biographical_facts text   not null,
  themes             text[] not null,
  anti_themes        text[] not null default '{}',
  beats              jsonb  not null,
  sources            text[] not null,
  status             text   not null default 'published',
  primary key (figure_key, stage_id),
  constraint figure_stages_status_check check (status in ('draft', 'published')),
  constraint figure_stages_age_check check (age_min <= age_max)
);

-- ── sessions: one row per user story session (durable across restarts) ──────
-- feeling is intentionally NULLABLE: a future retention job NULLs it ~60 days
-- after created_at (CLAUDE.md). The app always writes it at creation.
create table if not exists sessions (
  session_id       text        primary key,
  figure_key       text        not null,
  stage_id         text        not null,
  framing          text        not null,
  opening_copy     jsonb       not null,
  age              int         not null,
  feeling          text,
  next_beat_index  int         not null default 0,
  next_chunk_index int         not null default 0,
  match_recipe     jsonb       not null,
  created_at       timestamptz not null default now(),
  constraint sessions_framing_check check (framing in ('definitive', 'partial')),
  constraint sessions_next_beat_check check (next_beat_index >= 0),
  constraint sessions_next_chunk_check check (next_chunk_index >= 0),
  -- Composite FK to the composite pk, not two independent FKs.
  constraint sessions_stage_fk foreign key (figure_key, stage_id)
    references figure_stages (figure_key, stage_id)
);

-- ── RLS: default-deny for anon; service-role key (lib/db.ts) bypasses RLS ───
-- No policies are created, so the anon and authenticated roles can read/write
-- nothing. The browser never queries Supabase directly; all access is server
-- side through the service-role key, which bypasses RLS entirely.
alter table figures       enable row level security;
alter table figure_stages enable row level security;
alter table sessions      enable row level security;
