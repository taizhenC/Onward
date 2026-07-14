-- Transactional telemetry flow ownership and delivery outbox.
--
-- This migration leaves create_story_session_v2 available as a session-write
-- rollback target. That rollback does not register/claim/bind telemetry flows,
-- and telemetry capture for a revoked flow is intentionally incompatible.
-- Product-event payloads stay in the closed, flat table introduced by 0010;
-- the outbox contains only a pointer plus bounded delivery state.

-- v2 adds the user's adjacent-story acceptance to the private request
-- identity, which lets response-loss retries reconcile before consuming a
-- recovery token or rerunning providers. Keep v1 readable for existing saved
-- stories and alternate eligibility during the rollout.
create or replace function public.is_valid_story_request_context(p_context jsonb)
returns boolean
language plpgsql
immutable
strict
set search_path = pg_catalog, public
as $fn$
declare
  v_boundaries jsonb;
  v_clarification jsonb;
  v_flag text;
  v_count int;
  v_distinct_count int;
  v_schema text;
begin
  if jsonb_typeof(p_context) <> 'object'
    or not (p_context ? 'schemaVersion')
    or not (p_context ? 'boundaries')
    or not (p_context ? 'clarification') then
    return false;
  end if;

  v_schema := p_context ->> 'schemaVersion';
  if v_schema = 'story-request-context-v1-2026-07' then
    if (select count(*) from jsonb_object_keys(p_context)) <> 3 then
      return false;
    end if;
  elsif v_schema = 'story-request-context-v2-2026-07' then
    if (select count(*) from jsonb_object_keys(p_context)) <> 4
      or not (p_context ? 'acceptedAdjacent')
      or jsonb_typeof(p_context -> 'acceptedAdjacent') <> 'boolean' then
      return false;
    end if;
  else
    return false;
  end if;

  v_boundaries := p_context -> 'boundaries';
  if v_boundaries <> 'null'::jsonb then
    if jsonb_typeof(v_boundaries) <> 'object'
      or (select count(*) from jsonb_object_keys(v_boundaries)) <> 2
      or not (v_boundaries ? 'maxIntensity')
      or not (v_boundaries ? 'excludedFlags')
      or v_boundaries ->> 'maxIntensity' not in ('gentle', 'moderate', 'direct')
      or jsonb_typeof(v_boundaries -> 'excludedFlags') <> 'array' then
      return false;
    end if;
    select count(*), count(distinct value)
      into v_count, v_distinct_count
    from jsonb_array_elements_text(v_boundaries -> 'excludedFlags');
    if v_count <> v_distinct_count then return false; end if;
    for v_flag in
      select value from jsonb_array_elements_text(v_boundaries -> 'excludedFlags')
    loop
      if v_flag not in (
        'death_or_grief', 'suicide_loss', 'abuse_or_violence', 'addiction',
        'serious_illness', 'discrimination', 'pregnancy_or_parenthood',
        'other_reviewed_flag'
      ) then
        return false;
      end if;
    end loop;
  end if;

  v_clarification := p_context -> 'clarification';
  if v_clarification <> 'null'::jsonb
    and (
      jsonb_typeof(v_clarification) <> 'string'
      or p_context ->> 'clarification' not in (
        'rejection', 'isolation', 'blocked_agency', 'shame', 'uncertainty', 'loss'
      )
    ) then
    return false;
  end if;
  return true;
exception when others then
  return false;
end
$fn$;

revoke all on function public.is_valid_story_request_context(jsonb)
  from public, anon, authenticated;

-- A flow advances through issued (neither owner nor root), owner-claimed
-- (owner only), and bound (owner plus root). Identity, retention, ownership,
-- and the final root binding can never be changed or moved backward. Either
-- account deletion or root-story deletion therefore removes the mapping and
-- every linked product event.
create table public.telemetry_flows (
  flow_id text primary key check (
    flow_id ~ '^tfl_[0-9a-f]{16}_[0-9a-f]{32}_[0-9a-f]{64}$'
  ),
  user_id uuid references auth.users (id) on delete cascade,
  root_session_id text unique check (
    root_session_id is null or root_session_id ~ '^[0-9a-f]{32}$'
  ),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  constraint telemetry_flows_owner_root_pair_check check (
    (user_id is null and root_session_id is null)
    or (user_id is not null and root_session_id is null)
    or (user_id is not null and root_session_id is not null)
  ),
  constraint telemetry_flows_retention_check check (
    expires_at > created_at
    and expires_at <= created_at + interval '30 days 5 minutes'
  ),
  constraint telemetry_flows_root_owner_fk foreign key (
    root_session_id, user_id
  ) references public.sessions (session_id, user_id) on delete cascade
);

create index telemetry_flows_user_id_idx
  on public.telemetry_flows (user_id)
  where user_id is not null;
create index telemetry_flows_expiry_idx
  on public.telemetry_flows (expires_at);

alter table public.telemetry_flows enable row level security;
alter table public.telemetry_flows force row level security;
revoke all on table public.telemetry_flows
  from public, anon, authenticated, service_role;

-- A deleted capability cannot be registered again during its original
-- validity window. Tombstones deliberately retain only the opaque capability
-- and its already-bounded expiry; no user/session/reason data is copied.
create table public.telemetry_flow_revocations (
  flow_id text primary key check (
    flow_id ~ '^tfl_[0-9a-f]{16}_[0-9a-f]{32}_[0-9a-f]{64}$'
  ),
  expires_at timestamptz not null
);

create index telemetry_flow_revocations_expiry_idx
  on public.telemetry_flow_revocations (expires_at);

alter table public.telemetry_flow_revocations enable row level security;
alter table public.telemetry_flow_revocations force row level security;
revoke all on table public.telemetry_flow_revocations
  from public, anon, authenticated, service_role;

create or replace function public.set_telemetry_flow_retention_window()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $fn$
begin
  new.created_at := statement_timestamp();
  if new.expires_at <= new.created_at
    or new.expires_at > new.created_at + interval '30 days 5 minutes' then
    raise exception 'telemetry flow expiry must preserve its signed active window';
  end if;
  return new;
end
$fn$;

create trigger telemetry_flows_retention_window
before insert on public.telemetry_flows
for each row execute function public.set_telemetry_flow_retention_window();
revoke all on function public.set_telemetry_flow_retention_window()
  from public, anon, authenticated;

create or replace function public.preserve_telemetry_flow_revocation()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
begin
  insert into public.telemetry_flow_revocations (flow_id, expires_at)
  values (old.flow_id, old.expires_at)
  on conflict (flow_id) do update set
    expires_at = greatest(
      public.telemetry_flow_revocations.expires_at,
      excluded.expires_at
    );
  return old;
end
$fn$;

create trigger telemetry_flows_preserve_revocation
before delete on public.telemetry_flows
for each row execute function public.preserve_telemetry_flow_revocation();
revoke all on function public.preserve_telemetry_flow_revocation()
  from public, anon, authenticated;

create or replace function public.protect_telemetry_flow_binding()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $fn$
begin
  if new.flow_id is distinct from old.flow_id
    or new.created_at is distinct from old.created_at
    or new.expires_at is distinct from old.expires_at then
    raise exception 'telemetry flow identity and retention are immutable';
  end if;

  if old.user_id is null and old.root_session_id is null then
    if new.user_id is null and new.root_session_id is null then
      return new;
    end if;
    if new.user_id is not null and new.root_session_id is null then
      return new;
    end if;
    raise exception 'telemetry flow must be owner-claimed before root binding';
  end if;

  if old.user_id is not null and old.root_session_id is null then
    if new.user_id is not distinct from old.user_id
      and new.root_session_id is null then
      return new;
    end if;
    if new.user_id is not distinct from old.user_id
      and new.root_session_id is not null then
      return new;
    end if;
    raise exception 'telemetry flow ownership is immutable';
  end if;

  if new.user_id is distinct from old.user_id
    or new.root_session_id is distinct from old.root_session_id then
    raise exception 'telemetry flow binding is immutable';
  end if;
  return new;
end
$fn$;

create trigger telemetry_flows_binding_immutable
before update on public.telemetry_flows
for each row execute function public.protect_telemetry_flow_binding();
revoke all on function public.protect_telemetry_flow_binding()
  from public, anon, authenticated;

-- Existing rows are allowed to predate the registry. Every new linked event
-- must reference a registered flow, and deleting a flow performs the privacy
-- cascade without exposing a user/session identifier in product_events.
alter table public.product_events
  add constraint product_events_flow_fk foreign key (flow_id)
  references public.telemetry_flows (flow_id) on delete cascade not valid;

-- Enforce the metric's semantic units in addition to retry-stable event IDs.
-- Repeatable failure/safety/rate-limit occurrences are deliberately excluded.
create unique index product_events_flow_singleton_unit_idx
  on public.product_events (flow_id, event_name)
  where flow_id is not null and event_name in (
    'landing_cta_clicked', 'intake_started', 'intake_submitted',
    'auth_established', 'clarification_shown', 'alternate_requested',
    'alternate_resolved'
  );

create unique index product_events_story_role_unit_idx
  on public.product_events (flow_id, event_name, story_role)
  where flow_id is not null and event_name in (
    'artifact_created', 'first_content_shown', 'story_completed',
    'source_opened', 'feedback_submitted', 'story_saved'
  );

create unique index product_events_match_disposition_unit_idx
  on public.product_events (
    flow_id, story_role, match_disposition
  )
  where flow_id is not null and event_name = 'match_completed';

create unique index product_events_passage_unit_idx
  on public.product_events (
    flow_id, event_name, story_role, passage_ordinal
  )
  where flow_id is not null and event_name in (
    'passage_presented', 'passage_acknowledged'
  );

create unique index product_events_reopen_unit_idx
  on public.product_events (
    flow_id, story_role, reopen_age_bucket
  )
  where flow_id is not null and event_name = 'saved_story_reopened';

-- Pointer-only queue: the closed product_events row is the payload. A
-- delivered tombstone remains until that event's TTL/cascade so replaying a
-- successful capture cannot accidentally enqueue it again.
create table public.product_event_outbox (
  event_id text primary key
    references public.product_events (event_id) on delete cascade,
  status text not null default 'pending' check (
    status in ('pending', 'leased', 'delivered', 'exhausted')
  ),
  attempt_count int not null default 0 check (attempt_count between 0 and 20),
  next_attempt_at timestamptz not null default now(),
  lease_id text check (lease_id ~ '^[0-9a-f]{32}$'),
  lease_expires_at timestamptz,
  last_error_class text check (last_error_class in (
    'not_configured', 'timeout', 'rate_limited', 'unauthorized', 'network',
    'upstream', 'invalid_output', 'validation_rejected', 'database',
    'conflict', 'unknown'
  )),
  delivered_at timestamptz,
  exhausted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_event_outbox_state_check check (
    (
      status = 'pending' and lease_id is null
      and lease_expires_at is null and delivered_at is null
      and exhausted_at is null
    )
    or (
      status = 'leased' and lease_id is not null
      and lease_expires_at is not null and delivered_at is null
      and exhausted_at is null
    )
    or (
      status = 'delivered' and lease_id is null
      and lease_expires_at is null and delivered_at is not null
      and exhausted_at is null
    )
    or (
      status = 'exhausted' and lease_id is null
      and lease_expires_at is null and delivered_at is null
      and exhausted_at is not null
    )
  )
);

create index product_event_outbox_claim_idx
  on public.product_event_outbox (next_attempt_at, created_at)
  where status = 'pending';
create index product_event_outbox_expired_lease_idx
  on public.product_event_outbox (lease_expires_at)
  where status = 'leased';

alter table public.product_event_outbox enable row level security;
alter table public.product_event_outbox force row level security;
revoke all on table public.product_event_outbox
  from public, anon, authenticated, service_role;

-- Registration is intentionally shape-only in SQL. HMAC authenticity remains
-- a server-module responsibility, just as it is for every signed telemetry ID.
create or replace function public.register_telemetry_flow_v1(
  p_flow_id text,
  p_expires_at timestamptz
) returns text
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v_flow public.telemetry_flows%rowtype;
  v_revocation_expires_at timestamptz;
begin
  if p_flow_id is null or p_flow_id !~
    '^tfl_[0-9a-f]{16}_[0-9a-f]{32}_[0-9a-f]{64}$'
    or p_expires_at is null
    or p_expires_at <= statement_timestamp()
    or p_expires_at > statement_timestamp() + interval '30 days 5 minutes' then
    raise exception 'invalid telemetry flow identifier';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended('telemetry-flow:' || p_flow_id, 0)
  );
  select revocation.expires_at into v_revocation_expires_at
  from public.telemetry_flow_revocations revocation
  where revocation.flow_id = p_flow_id;
  if found then
    if v_revocation_expires_at <= statement_timestamp() then
      return 'expired';
    end if;
    return 'revoked';
  end if;

  select * into v_flow
  from public.telemetry_flows flow
  where flow.flow_id = p_flow_id
  for update;
  if found then
    if v_flow.expires_at <= statement_timestamp() then return 'expired'; end if;
    if v_flow.expires_at is distinct from p_expires_at then
      raise exception 'telemetry flow retention identity conflicted';
    end if;
    return 'duplicate';
  end if;

  -- Recheck after a potentially blocking row lock: an account/session cascade
  -- can delete the flow without taking this function's advisory lock.
  select revocation.expires_at into v_revocation_expires_at
  from public.telemetry_flow_revocations revocation
  where revocation.flow_id = p_flow_id;
  if found then
    if v_revocation_expires_at <= statement_timestamp() then
      return 'expired';
    end if;
    return 'revoked';
  end if;

  insert into public.telemetry_flows (flow_id, expires_at)
  values (p_flow_id, p_expires_at);
  return 'created';
end
$fn$;

revoke all on function public.register_telemetry_flow_v1(text, timestamptz)
  from public, anon, authenticated;
grant execute on function public.register_telemetry_flow_v1(text, timestamptz)
  to service_role;

-- Authentication claims an issued capability before any story write. The
-- owner is immutable; retrying with the same owner is idempotent, while a
-- different owner cannot take over either an owner-claimed or bound flow.
create or replace function public.claim_telemetry_flow_owner_v1(
  p_flow_id text,
  p_user_id uuid
) returns text
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v_flow public.telemetry_flows%rowtype;
  v_revocation_expires_at timestamptz;
begin
  if p_flow_id is null or p_flow_id !~
    '^tfl_[0-9a-f]{16}_[0-9a-f]{32}_[0-9a-f]{64}$'
    or p_user_id is null then
    raise exception 'invalid telemetry flow owner claim';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended('telemetry-flow:' || p_flow_id, 0)
  );
  select revocation.expires_at into v_revocation_expires_at
  from public.telemetry_flow_revocations revocation
  where revocation.flow_id = p_flow_id;
  if found then
    if v_revocation_expires_at <= statement_timestamp() then
      return 'expired';
    end if;
    return 'revoked';
  end if;

  select * into v_flow
  from public.telemetry_flows flow
  where flow.flow_id = p_flow_id
  for update;
  if not found then return 'not_found'; end if;
  if v_flow.expires_at <= statement_timestamp() then return 'expired'; end if;
  if v_flow.user_id is not null then
    if v_flow.user_id is not distinct from p_user_id then return 'duplicate'; end if;
    return 'collision';
  end if;

  update public.telemetry_flows flow set user_id = p_user_id
  where flow.flow_id = p_flow_id
    and flow.user_id is null and flow.root_session_id is null
    and flow.expires_at > statement_timestamp();
  if not found then return 'collision'; end if;
  return 'claimed';
end
$fn$;

revoke all on function public.claim_telemetry_flow_owner_v1(text, uuid)
  from public, anon, authenticated;
grant execute on function public.claim_telemetry_flow_owner_v1(text, uuid)
  to service_role;

-- Explicit privacy retirement accepts either the exact owner or NULL for an
-- as-yet unclaimed flow. Deletion atomically cascades product events/outbox
-- rows and records the bounded opaque revocation tombstone via trigger.
create or replace function public.revoke_telemetry_flow_v1(
  p_flow_id text,
  p_user_id uuid
) returns text
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v_flow public.telemetry_flows%rowtype;
begin
  if p_flow_id is null or p_flow_id !~
    '^tfl_[0-9a-f]{16}_[0-9a-f]{32}_[0-9a-f]{64}$' then
    raise exception 'invalid telemetry flow revocation';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended('telemetry-flow:' || p_flow_id, 0)
  );
  if exists (
    select 1 from public.telemetry_flow_revocations revocation
    where revocation.flow_id = p_flow_id
  ) then
    return 'duplicate';
  end if;

  select * into v_flow
  from public.telemetry_flows flow
  where flow.flow_id = p_flow_id
  for update;
  if not found then return 'not_found'; end if;
  if v_flow.user_id is distinct from p_user_id then return 'collision'; end if;

  delete from public.telemetry_flows flow
  where flow.flow_id = p_flow_id;
  return 'revoked';
end
$fn$;

revoke all on function public.revoke_telemetry_flow_v1(text, uuid)
  from public, anon, authenticated;
grant execute on function public.revoke_telemetry_flow_v1(text, uuid)
  to service_role;

-- Owner-scoped lookup keeps the fully revoked mapping table behind a narrow
-- server boundary. Callers must supply the root session, not an alternate.
create or replace function public.resolve_owned_telemetry_flow_v1(
  p_user_id uuid,
  p_root_session_id text
) returns text
language sql
stable
security definer
set search_path = pg_catalog, public
as $fn$
  select flow.flow_id
  from public.telemetry_flows flow
  where flow.user_id = p_user_id
    and flow.root_session_id = p_root_session_id
    and flow.expires_at > statement_timestamp();
$fn$;

revoke all on function public.resolve_owned_telemetry_flow_v1(uuid, text)
  from public, anon, authenticated;
grant execute on function public.resolve_owned_telemetry_flow_v1(uuid, text)
  to service_role;

-- Reverse owner-scoped lookup lets the application recover a committed root
-- after a response loss before it reruns matching/composition. Issued,
-- owner-claimed, expired, revoked, and foreign-owner flows resolve to NULL.
create or replace function public.resolve_owned_telemetry_root_v1(
  p_user_id uuid,
  p_flow_id text
) returns text
language sql
stable
security definer
set search_path = pg_catalog, public
as $fn$
  select flow.root_session_id
  from public.telemetry_flows flow
  where flow.user_id = p_user_id
    and flow.flow_id = p_flow_id
    and flow.root_session_id is not null
    and flow.expires_at > statement_timestamp();
$fn$;

revoke all on function public.resolve_owned_telemetry_root_v1(uuid, text)
  from public, anon, authenticated;
grant execute on function public.resolve_owned_telemetry_root_v1(uuid, text)
  to service_role;

-- The only service-role product-event write boundary. All columns are typed
-- scalars; occurred_at/expires_at remain database-owned through the 0010
-- retention trigger and are therefore not caller parameters.
create or replace function public.capture_product_event_v1(
  p_event_id text,
  p_schema_version text,
  p_flow_id text,
  p_event_name text,
  p_surface text default null,
  p_viewport_bucket text default null,
  p_auth_method text default null,
  p_rate_operation text default null,
  p_limit_scope text default null,
  p_recipe_id text default null,
  p_story_role text default null,
  p_match_disposition text default null,
  p_confidence_bucket text default null,
  p_match_path text default null,
  p_age_fallback boolean default null,
  p_boundary_outcome text default null,
  p_policy_version text default null,
  p_composition_mode text default null,
  p_fallback_reason text default null,
  p_attempt_bucket text default null,
  p_latency_bucket text default null,
  p_passage_ordinal int default null,
  p_feedback_verdict text default null,
  p_alternate_outcome text default null,
  p_reopen_age_bucket text default null,
  p_deletion_id text default null,
  p_deletion_scope text default null,
  p_ok boolean default null,
  p_error_domain text default null,
  p_error_class text default null,
  p_status_bucket text default null
) returns text
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v_existing public.product_events%rowtype;
  v_same boolean;
begin
  if p_event_id is null or p_event_id !~
    '^tev_[0-9a-f]{16}_[0-9a-f]{32}_[0-9a-f]{64}$' then
    raise exception 'invalid telemetry event identifier';
  end if;
  if p_schema_version is distinct from 'product-event-v1-2026-07' then
    raise exception 'unsupported product-event schema version';
  end if;
  if p_flow_id is not null and not exists (
    select 1 from public.telemetry_flows flow
    where flow.flow_id = p_flow_id
      and flow.expires_at > statement_timestamp()
  ) then
    raise exception 'product event requires an active registered flow';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_event_id, 0));
  select * into v_existing
  from public.product_events
  where event_id = p_event_id;

  if found then
    select row(
      v_existing.schema_version, v_existing.flow_id, v_existing.event_name,
      v_existing.surface, v_existing.viewport_bucket, v_existing.auth_method,
      v_existing.rate_operation, v_existing.limit_scope,
      v_existing.recipe_id, v_existing.story_role,
      v_existing.match_disposition, v_existing.confidence_bucket,
      v_existing.match_path, v_existing.age_fallback,
      v_existing.boundary_outcome, v_existing.policy_version,
      v_existing.composition_mode, v_existing.fallback_reason,
      v_existing.attempt_bucket, v_existing.latency_bucket,
      v_existing.passage_ordinal, v_existing.feedback_verdict,
      v_existing.alternate_outcome, v_existing.reopen_age_bucket,
      v_existing.deletion_id, v_existing.deletion_scope, v_existing.ok,
      v_existing.error_domain, v_existing.error_class,
      v_existing.status_bucket
    ) is not distinct from row(
      p_schema_version, p_flow_id, p_event_name, p_surface,
      p_viewport_bucket, p_auth_method, p_rate_operation, p_limit_scope,
      p_recipe_id, p_story_role, p_match_disposition, p_confidence_bucket,
      p_match_path, p_age_fallback, p_boundary_outcome, p_policy_version,
      p_composition_mode, p_fallback_reason, p_attempt_bucket,
      p_latency_bucket, p_passage_ordinal, p_feedback_verdict,
      p_alternate_outcome, p_reopen_age_bucket, p_deletion_id,
      p_deletion_scope, p_ok, p_error_domain, p_error_class,
      p_status_bucket
    ) into v_same;
    if not v_same then return 'conflict'; end if;

    insert into public.product_event_outbox (event_id)
    values (p_event_id)
    on conflict (event_id) do nothing;
    return 'duplicate';
  end if;

  begin
    insert into public.product_events (
      event_id, schema_version, flow_id, event_name, surface,
      viewport_bucket, auth_method, rate_operation, limit_scope, recipe_id,
      story_role, match_disposition, confidence_bucket, match_path,
      age_fallback, boundary_outcome, policy_version, composition_mode,
      fallback_reason, attempt_bucket, latency_bucket, passage_ordinal,
      feedback_verdict, alternate_outcome, reopen_age_bucket, deletion_id,
      deletion_scope, ok, error_domain, error_class, status_bucket
    ) values (
      p_event_id, p_schema_version, p_flow_id, p_event_name, p_surface,
      p_viewport_bucket, p_auth_method, p_rate_operation, p_limit_scope,
      p_recipe_id, p_story_role, p_match_disposition, p_confidence_bucket,
      p_match_path, p_age_fallback, p_boundary_outcome, p_policy_version,
      p_composition_mode, p_fallback_reason, p_attempt_bucket,
      p_latency_bucket, p_passage_ordinal, p_feedback_verdict,
      p_alternate_outcome, p_reopen_age_bucket, p_deletion_id,
      p_deletion_scope, p_ok, p_error_domain, p_error_class,
      p_status_bucket
    );
    insert into public.product_event_outbox (event_id) values (p_event_id);
  exception when unique_violation then
    return 'conflict';
  end;
  return 'created';
end
$fn$;

revoke all on function public.capture_product_event_v1(
  text, text, text, text, text, text, text, text, text, text, text, text,
  text, text, boolean, text, text, text, text, text, text, int, text, text,
  text, text, text, boolean, text, text, text
) from public, anon, authenticated;
grant execute on function public.capture_product_event_v1(
  text, text, text, text, text, text, text, text, text, text, text, text,
  text, text, boolean, text, text, text, text, text, text, int, text, text,
  text, text, text, boolean, text, text, text
) to service_role;

-- Direct service-role writes are no longer permitted after the typed capture
-- and revocation boundaries exist. SELECT supports aggregate consumers and
-- claimed delivery. Privacy deletion must revoke the flow atomically so a
-- deleted event cannot be recreated under the same capability.
revoke insert, delete on table public.product_events from service_role;

create or replace function public.claim_product_event_outbox_v1(
  p_lease_id text,
  p_limit int
) returns table (
  event_id text,
  schema_version text,
  flow_id text,
  event_name text,
  surface text,
  viewport_bucket text,
  auth_method text,
  rate_operation text,
  limit_scope text,
  recipe_id text,
  story_role text,
  match_disposition text,
  confidence_bucket text,
  match_path text,
  age_fallback boolean,
  boundary_outcome text,
  policy_version text,
  composition_mode text,
  fallback_reason text,
  attempt_bucket text,
  latency_bucket text,
  passage_ordinal int,
  feedback_verdict text,
  alternate_outcome text,
  reopen_age_bucket text,
  deletion_id text,
  deletion_scope text,
  ok boolean,
  error_domain text,
  error_class text,
  status_bucket text,
  occurred_at timestamptz,
  expires_at timestamptz,
  attempt_count int,
  lease_id text
)
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
begin
  if p_lease_id is null or p_lease_id !~ '^[0-9a-f]{32}$' then
    raise exception 'invalid product-event outbox lease identifier';
  end if;
  if p_limit is null or p_limit < 1 or p_limit > 100 then
    raise exception 'product-event outbox claim limit must be between 1 and 100';
  end if;

  -- A worker that disappears while holding the final lease must not leave a
  -- permanently leased row. Pending attempt-20 rows from an interrupted
  -- rollout are terminalized by the same bounded transition.
  update public.product_event_outbox queue set
    status = 'exhausted',
    lease_id = null,
    lease_expires_at = null,
    last_error_class = coalesce(queue.last_error_class, 'timeout'),
    exhausted_at = statement_timestamp(),
    updated_at = statement_timestamp()
  where queue.attempt_count >= 20 and (
    (
      queue.status = 'leased'
      and queue.lease_expires_at <= statement_timestamp()
    ) or (
      queue.status = 'pending'
      and queue.next_attempt_at <= statement_timestamp()
    )
  );

  return query
  with candidates as (
    select queue.event_id
    from public.product_event_outbox queue
    join public.product_events event on event.event_id = queue.event_id
    where (
      (
        queue.status = 'pending'
        and queue.next_attempt_at <= statement_timestamp()
        and queue.attempt_count < 20
      ) or (
        queue.status = 'leased'
        and queue.lease_expires_at <= statement_timestamp()
        and queue.attempt_count < 20
      )
    )
    and event.expires_at > statement_timestamp()
    order by queue.next_attempt_at, queue.created_at
    limit p_limit
    for update of queue skip locked
  ), claimed as (
    update public.product_event_outbox queue set
      status = 'leased',
      attempt_count = queue.attempt_count + 1,
      lease_id = p_lease_id,
      lease_expires_at = statement_timestamp() + interval '60 seconds',
      exhausted_at = null,
      updated_at = statement_timestamp()
    from candidates
    where queue.event_id = candidates.event_id
    returning queue.event_id, queue.attempt_count, queue.lease_id
  )
  select
    event.event_id, event.schema_version, event.flow_id, event.event_name,
    event.surface, event.viewport_bucket, event.auth_method,
    event.rate_operation, event.limit_scope, event.recipe_id,
    event.story_role, event.match_disposition, event.confidence_bucket,
    event.match_path, event.age_fallback, event.boundary_outcome,
    event.policy_version, event.composition_mode, event.fallback_reason,
    event.attempt_bucket, event.latency_bucket, event.passage_ordinal,
    event.feedback_verdict, event.alternate_outcome,
    event.reopen_age_bucket, event.deletion_id, event.deletion_scope,
    event.ok, event.error_domain, event.error_class, event.status_bucket,
    event.occurred_at, event.expires_at, claimed.attempt_count,
    claimed.lease_id
  from claimed
  join public.product_events event on event.event_id = claimed.event_id
    and event.expires_at > statement_timestamp()
  order by event.occurred_at, event.event_id;
end
$fn$;

revoke all on function public.claim_product_event_outbox_v1(text, int)
  from public, anon, authenticated;
grant execute on function public.claim_product_event_outbox_v1(text, int)
  to service_role;

create or replace function public.ack_product_event_outbox_v1(
  p_event_id text,
  p_lease_id text
) returns text
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v_status text;
begin
  if p_event_id is null or p_event_id !~
    '^tev_[0-9a-f]{16}_[0-9a-f]{32}_[0-9a-f]{64}$'
    or p_lease_id is null or p_lease_id !~ '^[0-9a-f]{32}$' then
    raise exception 'invalid product-event outbox acknowledgement';
  end if;

  update public.product_event_outbox queue set
    status = 'exhausted',
    lease_id = null,
    lease_expires_at = null,
    last_error_class = coalesce(queue.last_error_class, 'timeout'),
    exhausted_at = statement_timestamp(),
    updated_at = statement_timestamp()
  where queue.event_id = p_event_id and queue.status = 'leased'
    and queue.lease_id = p_lease_id and queue.attempt_count >= 20
    and queue.lease_expires_at <= statement_timestamp();
  if found then return 'exhausted'; end if;

  update public.product_event_outbox queue set
    status = 'delivered',
    lease_id = null,
    lease_expires_at = null,
    delivered_at = statement_timestamp(),
    updated_at = statement_timestamp()
  where queue.event_id = p_event_id and queue.status = 'leased'
    and queue.lease_id = p_lease_id
    and queue.lease_expires_at > statement_timestamp();
  if found then return 'acknowledged'; end if;

  select queue.status into v_status
  from public.product_event_outbox queue
  where queue.event_id = p_event_id;
  if not found then return 'not_found'; end if;
  if v_status = 'delivered' then return 'duplicate'; end if;
  if v_status = 'exhausted' then return 'exhausted'; end if;
  return 'stale';
end
$fn$;

revoke all on function public.ack_product_event_outbox_v1(text, text)
  from public, anon, authenticated;
grant execute on function public.ack_product_event_outbox_v1(text, text)
  to service_role;

create or replace function public.nack_product_event_outbox_v1(
  p_event_id text,
  p_lease_id text,
  p_error_class text
) returns text
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v_status text;
begin
  if p_event_id is null or p_event_id !~
    '^tev_[0-9a-f]{16}_[0-9a-f]{32}_[0-9a-f]{64}$'
    or p_lease_id is null or p_lease_id !~ '^[0-9a-f]{32}$' then
    raise exception 'invalid product-event outbox rejection';
  end if;
  if p_error_class is null or p_error_class not in (
    'not_configured', 'timeout', 'rate_limited', 'unauthorized', 'network',
    'upstream', 'invalid_output', 'validation_rejected', 'database',
    'conflict', 'unknown'
  ) then
    raise exception 'invalid product-event outbox error class';
  end if;

  update public.product_event_outbox queue set
    status = case
      when queue.attempt_count >= 20 then 'exhausted'
      else 'pending'
    end,
    next_attempt_at = case
      when queue.attempt_count >= 20 then statement_timestamp()
      else statement_timestamp() + make_interval(
        secs => case
          when queue.attempt_count <= 1 then 5
          when queue.attempt_count = 2 then 30
          when queue.attempt_count = 3 then 120
          when queue.attempt_count = 4 then 600
          else 3600
        end
      )
    end,
    lease_id = null,
    lease_expires_at = null,
    last_error_class = p_error_class,
    exhausted_at = case
      when queue.attempt_count >= 20 then statement_timestamp()
      else null
    end,
    updated_at = statement_timestamp()
  where queue.event_id = p_event_id and queue.status = 'leased'
    and queue.lease_id = p_lease_id
  returning queue.status into v_status;
  if found then
    if v_status = 'exhausted' then return 'exhausted'; end if;
    return 'released';
  end if;

  select queue.status into v_status
  from public.product_event_outbox queue
  where queue.event_id = p_event_id;
  if not found then return 'not_found'; end if;
  if v_status = 'delivered' then return 'delivered'; end if;
  if v_status = 'exhausted' then return 'exhausted'; end if;
  return 'stale';
end
$fn$;

revoke all on function public.nack_product_event_outbox_v1(text, text, text)
  from public, anon, authenticated;
grant execute on function public.nack_product_event_outbox_v1(text, text, text)
  to service_role;

-- v3 preserves every v2 validation and write, but accepts only a previously
-- registered, active, owner-claimed flow. A bound flow is replayable only when
-- its owner and normalized request identity exactly match the committed root;
-- newly generated session/artifact identifiers are deliberately not identity.
create or replace function public.create_story_session_v3(
  p_session_id text,
  p_user_id uuid,
  p_figure_key text,
  p_stage_id text,
  p_framing text,
  p_age int,
  p_feeling text,
  p_story_request_context jsonb,
  p_match_recipe jsonb,
  p_artifact jsonb,
  p_telemetry_flow_id text
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v_artifact_id text := p_artifact ->> 'artifactId';
  v_story_spec public.story_specs%rowtype;
  v_flow public.telemetry_flows%rowtype;
  v_existing_session public.sessions%rowtype;
  v_revocation_expires_at timestamptz;
begin
  if p_telemetry_flow_id is null or p_telemetry_flow_id !~
    '^tfl_[0-9a-f]{16}_[0-9a-f]{32}_[0-9a-f]{64}$'
    or p_user_id is null then
    raise exception 'invalid telemetry flow identifier';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended('telemetry-flow:' || p_telemetry_flow_id, 0)
  );
  select * into v_flow
  from public.telemetry_flows flow
  where flow.flow_id = p_telemetry_flow_id
  for update;
  if not found then
    select revocation.expires_at into v_revocation_expires_at
    from public.telemetry_flow_revocations revocation
    where revocation.flow_id = p_telemetry_flow_id;
    if found then
      if v_revocation_expires_at <= statement_timestamp() then
        return jsonb_build_object('status', 'expired', 'sessionId', null);
      end if;
      return jsonb_build_object('status', 'revoked', 'sessionId', null);
    end if;
    return jsonb_build_object('status', 'flow_not_found', 'sessionId', null);
  end if;

  -- Expiration is authoritative even for a byte-for-byte replay.
  if v_flow.expires_at <= statement_timestamp() then
    return jsonb_build_object('status', 'expired', 'sessionId', null);
  end if;
  if v_flow.user_id is null then
    return jsonb_build_object('status', 'unclaimed', 'sessionId', null);
  end if;
  if v_flow.user_id is distinct from p_user_id then
    return jsonb_build_object('status', 'conflict', 'sessionId', null);
  end if;

  if v_flow.root_session_id is not null then
    select * into v_existing_session
    from public.sessions story_session
    where story_session.session_id = v_flow.root_session_id
      and story_session.user_id = p_user_id;
    if found
      and v_existing_session.alternate_of_session_id is null
      and v_existing_session.framing is not distinct from p_framing
      and v_existing_session.age is not distinct from p_age
      and v_existing_session.feeling is not distinct from p_feeling
      and v_existing_session.story_request_context
        is not distinct from p_story_request_context then
      return jsonb_build_object(
        'status', 'existing', 'sessionId', v_flow.root_session_id
      );
    end if;
    return jsonb_build_object('status', 'conflict', 'sessionId', null);
  end if;

  if p_session_id !~ '^[0-9a-f]{32}$'
    or p_age < 13 or p_age > 100
    or p_feeling is null or length(p_feeling) < 10 or length(p_feeling) > 1000
    or public.is_valid_story_request_context(p_story_request_context)
      is distinct from true
    or v_artifact_id is null
    or p_artifact ->> 'figureKey' is distinct from p_figure_key
    or p_artifact ->> 'stageId' is distinct from p_stage_id
    or p_artifact #>> '{validation,status}' is distinct from 'validated'
    or p_artifact #>> '{framing}' is distinct from p_framing
    or p_artifact #> '{recipe,match}' is distinct from p_match_recipe
    or jsonb_typeof(p_artifact -> 'openingCopy') is distinct from 'object'
    or jsonb_typeof(p_artifact -> 'beats') is distinct from 'array' then
    raise exception 'invalid StoryArtifact/session/context identity';
  end if;

  if exists (
    select 1 from public.sessions where session_id = p_session_id
  ) then
    return jsonb_build_object('status', 'collision', 'sessionId', null);
  end if;

  select * into v_story_spec
  from public.story_specs
  where story_spec_id = p_artifact ->> 'storySpecId'
  for share;
  if not found
    or v_story_spec.status <> 'published'
    or v_story_spec.version is distinct from (p_artifact ->> 'storySpecVersion')::int
    or v_story_spec.schema_version is distinct from p_artifact ->> 'storySpecSchemaVersion'
    or v_story_spec.figure_key is distinct from p_figure_key
    or v_story_spec.stage_id is distinct from p_stage_id
    or p_artifact #>> '{contentProfile,intensity}'
      is distinct from v_story_spec.spec #>> '{contentProfile,intensity}'
    or p_artifact #> '{contentProfile,flags}'
      is distinct from v_story_spec.spec #> '{contentProfile,flags}'
    or p_artifact #>> '{contentProfile,contentNote}'
      is distinct from v_story_spec.spec #>> '{contentProfile,contentNote}'
    or public.story_content_allowed_by_context(
      p_story_request_context, v_story_spec.spec -> 'contentProfile'
    ) is distinct from true then
    raise exception 'StorySpec is not an active published version';
  end if;

  begin
    insert into public.sessions (
      session_id, user_id, figure_key, stage_id, story_artifact_id, framing,
      opening_copy, age, feeling, story_request_context,
      disclosure_expires_at, alternate_of_session_id, match_recipe,
      next_beat_index, next_chunk_index, updated_at
    ) values (
      p_session_id, p_user_id, p_figure_key, p_stage_id, v_artifact_id,
      p_framing, p_artifact -> 'openingCopy', p_age, p_feeling,
      p_story_request_context, now() + interval '60 days', null,
      p_match_recipe, 0, 0, now()
    );

    insert into public.story_artifacts (
      artifact_id, session_id, user_id, story_spec_id, story_spec_version,
      story_spec_schema_version, figure_key, stage_id, schema_version,
      composition_mode, content_hash, artifact, created_at
    ) values (
      v_artifact_id, p_session_id, p_user_id, p_artifact ->> 'storySpecId',
      (p_artifact ->> 'storySpecVersion')::int,
      p_artifact ->> 'storySpecSchemaVersion', p_figure_key, p_stage_id,
      p_artifact ->> 'schemaVersion', p_artifact #>> '{composition,mode}',
      p_artifact ->> 'contentHash', p_artifact, now()
    );
  exception when unique_violation then
    return jsonb_build_object('status', 'collision', 'sessionId', null);
  end;

  update public.telemetry_flows set
    root_session_id = p_session_id
  where flow_id = p_telemetry_flow_id
    and user_id = p_user_id and root_session_id is null
    and expires_at > statement_timestamp();
  if not found then
    raise exception 'telemetry flow could not be bound';
  end if;

  return jsonb_build_object(
    'status', 'created', 'sessionId', p_session_id
  );
end
$fn$;

revoke all on function public.create_story_session_v3(
  text, uuid, text, text, text, int, text, jsonb, jsonb, jsonb, text
) from public, anon, authenticated;
grant execute on function public.create_story_session_v3(
  text, uuid, text, text, text, int, text, jsonb, jsonb, jsonb, text
) to service_role;

create or replace function public.delete_expired_telemetry_flows_v1()
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
begin
  -- Flow deletion first records a tombstone. Once the capability's original
  -- retention window has ended, that opaque tombstone can be removed too.
  delete from public.telemetry_flows where expires_at <= statement_timestamp();
  delete from public.telemetry_flow_revocations
  where expires_at <= statement_timestamp();
end
$fn$;

revoke all on function public.delete_expired_telemetry_flows_v1()
  from public, anon, authenticated;
grant execute on function public.delete_expired_telemetry_flows_v1()
  to service_role;

select cron.schedule(
  'onward-telemetry-flow-cleanup',
  '47 3 * * *',
  $$select public.delete_expired_telemetry_flows_v1();$$
);
