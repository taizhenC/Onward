-- First-party, privacy-reviewed delivery for the product-event outbox.
--
-- Raw events never leave Postgres. One settlement transaction locks the source
-- event before its pointer, folds only approved marginal dimensions into
-- identifier-free UTC-day cells, and marks the pointer delivered. If privacy
-- deletion commits first there is no source row to fold. If settlement commits
-- first, later deletion leaves only unlinkable counts. Reporting is fixed at
-- an event-count floor of 10, UTC-day cells, and a maximum 28-day lookback.
-- That floor is not distinct-contributor k-anonymity; the read stays private
-- until a separate review adds contribution bounds or another approved model.

create table public.telemetry_event_daily_rollups (
  bucket_date date not null,
  schema_version text not null check (
    schema_version = 'product-event-v1-2026-07'
  ),
  event_name text not null check (event_name in (
    'landing_cta_clicked', 'intake_started', 'intake_submitted',
    'auth_established', 'crisis_intercepted', 'rate_limited',
    'match_completed', 'clarification_shown', 'artifact_created',
    'first_content_shown', 'passage_presented', 'passage_acknowledged',
    'story_completed', 'source_opened', 'feedback_submitted',
    'alternate_requested', 'alternate_resolved', 'story_saved',
    'saved_story_reopened', 'deletion_requested', 'deletion_completed',
    'flow_failed'
  )),
  dimension_name text not null check (dimension_name in (
    'all', 'surface', 'viewport_bucket', 'auth_method', 'rate_operation',
    'limit_scope', 'recipe_id', 'story_role', 'match_disposition',
    'confidence_bucket', 'match_path', 'age_fallback', 'boundary_outcome',
    'policy_version', 'composition_mode', 'fallback_reason',
    'attempt_bucket', 'latency_bucket', 'passage_ordinal',
    'feedback_verdict', 'alternate_outcome', 'reopen_age_bucket',
    'deletion_scope', 'error_domain', 'error_class', 'status_bucket'
  )),
  dimension_value text not null,
  event_count bigint not null check (event_count > 0),

  -- Every value is closed. In particular there is no generic string branch,
  -- deletion correlation ID, event/flow ID, exact timestamp, or content field.
  constraint telemetry_event_daily_rollups_value_check check (
    case dimension_name
      when 'all' then dimension_value = 'all'
      when 'surface' then dimension_value = 'home_primary'
      when 'viewport_bucket' then dimension_value in ('small', 'large')
      when 'auth_method' then dimension_value in (
        'anonymous', 'email_link', 'password'
      )
      when 'rate_operation' then dimension_value in (
        'intake', 'feedback', 'alternate_story', 'historical_concern', 'auth'
      )
      when 'limit_scope' then dimension_value in ('user', 'ip')
      when 'recipe_id' then dimension_value =
        'keyword-rerank-figure-library-50-2026-07-02'
      when 'story_role' then dimension_value in ('initial', 'alternate')
      when 'match_disposition' then dimension_value in (
        'close', 'adjacent', 'clarification_required', 'no_close_match'
      )
      when 'confidence_bucket' then dimension_value in (
        'high', 'medium', 'low', 'not_applicable'
      )
      when 'match_path' then dimension_value in (
        'rerank', 'keyword_fallback', 'not_run'
      )
      when 'age_fallback' then dimension_value in ('true', 'false')
      when 'boundary_outcome' then dimension_value in (
        'not_set', 'passed', 'no_eligible'
      )
      when 'policy_version' then dimension_value =
        'match-recovery-v1-2026-07'
      when 'composition_mode' then dimension_value in (
        'hybrid', 'canonical_fallback'
      )
      when 'fallback_reason' then dimension_value in (
        'none', 'canonical_only', 'provider_timeout', 'provider_error',
        'provider_output_invalid', 'validator_rejected'
      )
      when 'attempt_bucket' then dimension_value in (
        'not_attempted', 'first', 'retry', 'exhausted'
      )
      when 'latency_bucket' then dimension_value in (
        'lt250ms', '250to500ms', '500ms_to1s', '1to3s', '3to6s',
        '6to8s', '8to15s', 'gt15s'
      )
      when 'passage_ordinal' then dimension_value ~
        '^(?:[0-9]|[1-5][0-9]|6[0-3])$'
      when 'feedback_verdict' then dimension_value in (
        'felt_close', 'not_close'
      )
      when 'alternate_outcome' then dimension_value in (
        'ready', 'unavailable', 'expired', 'exhausted', 'failed'
      )
      when 'reopen_age_bucket' then dimension_value in ('lt7d', '7to30d')
      when 'deletion_scope' then dimension_value in ('story', 'account')
      when 'error_domain' then dimension_value in (
        'auth', 'database', 'matching', 'composition', 'reader', 'feedback',
        'alternate', 'deletion'
      )
      when 'error_class' then dimension_value in (
        'not_configured', 'timeout', 'rate_limited', 'unauthorized',
        'network', 'upstream', 'invalid_output', 'validation_rejected',
        'database', 'conflict', 'unknown'
      )
      when 'status_bucket' then dimension_value in (
        'invalid_request', 'unauthorized', 'rate_limited', 'upstream',
        'timeout', 'network', 'not_applicable'
      )
      else false
    end
  ),

  -- Applicability is also exact: adding an event or dimension requires a
  -- reviewed migration rather than silently creating a new analytics surface.
  constraint telemetry_event_daily_rollups_event_dimension_check check (
    case event_name
      when 'landing_cta_clicked' then dimension_name in ('all', 'surface')
      when 'intake_started' then dimension_name in ('all', 'viewport_bucket')
      when 'intake_submitted' then dimension_name = 'all'
      when 'auth_established' then dimension_name in ('all', 'auth_method')
      when 'crisis_intercepted' then dimension_name = 'all'
      when 'rate_limited' then dimension_name in (
        'all', 'rate_operation', 'limit_scope'
      )
      when 'match_completed' then dimension_name in (
        'all', 'recipe_id', 'story_role', 'match_disposition',
        'confidence_bucket', 'match_path', 'age_fallback', 'boundary_outcome'
      )
      when 'clarification_shown' then dimension_name in (
        'all', 'policy_version'
      )
      when 'artifact_created' then dimension_name in (
        'all', 'recipe_id', 'story_role', 'composition_mode',
        'fallback_reason', 'attempt_bucket'
      )
      when 'first_content_shown' then dimension_name in (
        'all', 'story_role', 'latency_bucket'
      )
      when 'passage_presented' then dimension_name in (
        'all', 'story_role', 'passage_ordinal', 'latency_bucket'
      )
      when 'passage_acknowledged' then dimension_name in (
        'all', 'story_role', 'passage_ordinal'
      )
      when 'story_completed' then dimension_name in ('all', 'story_role')
      when 'source_opened' then dimension_name in ('all', 'story_role')
      when 'feedback_submitted' then dimension_name in (
        'all', 'story_role', 'feedback_verdict'
      )
      when 'alternate_requested' then dimension_name = 'all'
      when 'alternate_resolved' then dimension_name in (
        'all', 'alternate_outcome'
      )
      when 'story_saved' then dimension_name in ('all', 'story_role')
      when 'saved_story_reopened' then dimension_name in (
        'all', 'story_role', 'reopen_age_bucket'
      )
      when 'deletion_requested' then dimension_name in (
        'all', 'deletion_scope'
      )
      when 'deletion_completed' then dimension_name in (
        'all', 'deletion_scope', 'latency_bucket'
      )
      when 'flow_failed' then dimension_name in (
        'all', 'error_domain', 'error_class', 'status_bucket', 'latency_bucket'
      )
      else false
    end
  ),
  primary key (
    bucket_date, schema_version, event_name, dimension_name, dimension_value
  )
);

create index telemetry_event_daily_rollups_name_date_idx
  on public.telemetry_event_daily_rollups (event_name, bucket_date);

alter table public.telemetry_event_daily_rollups enable row level security;
alter table public.telemetry_event_daily_rollups force row level security;
revoke all on table public.telemetry_event_daily_rollups
  from public, anon, authenticated, service_role;

-- Schema-first rollout must not start consuming an existing queue merely by
-- applying the migration. The minute cron is installed below, but remains a
-- no-op until an operator completes the real-Postgres gates and enables this
-- single closed control through its dedicated RPC.
create table public.telemetry_rollup_dispatch_control (
  singleton boolean primary key default true check (singleton is true),
  enabled boolean not null default false
);

insert into public.telemetry_rollup_dispatch_control (singleton, enabled)
values (true, false);

alter table public.telemetry_rollup_dispatch_control enable row level security;
alter table public.telemetry_rollup_dispatch_control force row level security;
revoke all on table public.telemetry_rollup_dispatch_control
  from public, anon, authenticated, service_role;

create or replace function public.set_telemetry_rollup_dispatch_enabled_v1(
  p_enabled boolean
) returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
begin
  if p_enabled is null then
    raise exception 'telemetry rollup dispatch state is required';
  end if;
  update public.telemetry_rollup_dispatch_control control
  set enabled = p_enabled
  where control.singleton is true;
  if not found then
    raise exception 'telemetry rollup dispatch control is missing';
  end if;
  return p_enabled;
end
$fn$;

revoke all on function public.set_telemetry_rollup_dispatch_enabled_v1(boolean)
  from public, anon, authenticated;
grant execute on function public.set_telemetry_rollup_dispatch_enabled_v1(boolean)
  to service_role;

-- The dispatcher claims references only. v1 stays installed for schema
-- history, but its full raw-event projection is revoked from service_role
-- after pre-existing delivered rows are backfilled below.
create or replace function public.claim_product_event_outbox_v2(
  p_lease_id text,
  p_limit int
) returns table (
  event_id text,
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

  -- Lock source before pointer, matching the event -> pointer cascade used by
  -- expiry and privacy deletion. MATERIALIZED makes the ordering explicit.
  with terminal_sources as materialized (
    select event.event_id
    from public.product_events event
    join public.product_event_outbox queue on queue.event_id = event.event_id
    where queue.attempt_count >= 20 and (
      (
        queue.status = 'leased'
        and queue.lease_expires_at <= statement_timestamp()
      ) or (
        queue.status = 'pending'
        and queue.next_attempt_at <= statement_timestamp()
      )
    )
    order by queue.next_attempt_at, queue.created_at
    limit p_limit
    for update of event skip locked
  ), terminal_pointers as materialized (
    select queue.event_id
    from public.product_event_outbox queue
    join terminal_sources source on source.event_id = queue.event_id
    for update of queue skip locked
  )
  update public.product_event_outbox queue set
    status = 'exhausted',
    lease_id = null,
    lease_expires_at = null,
    last_error_class = coalesce(queue.last_error_class, 'timeout'),
    exhausted_at = statement_timestamp(),
    updated_at = statement_timestamp()
  from terminal_pointers pointer
  where queue.event_id = pointer.event_id
    and queue.attempt_count >= 20
    and (
      (
        queue.status = 'leased'
        and queue.lease_expires_at <= statement_timestamp()
      ) or (
        queue.status = 'pending'
        and queue.next_attempt_at <= statement_timestamp()
      )
    );

  return query
  with source_candidates as materialized (
    select event.event_id
    from public.product_events event
    join public.product_event_outbox queue on queue.event_id = event.event_id
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
    and (
      event.flow_id is null
      or exists (
        select 1
        from public.telemetry_flows flow
        where flow.flow_id = event.flow_id
          and flow.expires_at > statement_timestamp()
      )
    )
    order by queue.next_attempt_at, queue.created_at
    limit p_limit
    for update of event skip locked
  ), pointer_candidates as materialized (
    select queue.event_id
    from public.product_event_outbox queue
    join source_candidates source on source.event_id = queue.event_id
    for update of queue skip locked
  ), claimed as (
    update public.product_event_outbox queue set
      status = 'leased',
      attempt_count = queue.attempt_count + 1,
      lease_id = p_lease_id,
      lease_expires_at = statement_timestamp() + interval '60 seconds',
      exhausted_at = null,
      updated_at = statement_timestamp()
    from pointer_candidates candidate
    where queue.event_id = candidate.event_id
      and queue.attempt_count < 20
      and (
        (
          queue.status = 'pending'
          and queue.next_attempt_at <= statement_timestamp()
        ) or (
          queue.status = 'leased'
          and queue.lease_expires_at <= statement_timestamp()
        )
      )
    returning queue.event_id, queue.attempt_count, queue.lease_id
  )
  select claimed.event_id, claimed.attempt_count, claimed.lease_id
  from claimed
  order by claimed.event_id;
end
$fn$;

revoke all on function public.claim_product_event_outbox_v2(text, int)
  from public, anon, authenticated, service_role;

-- Source-first locking matches the event -> pointer cascade direction and
-- avoids an outbox-first deadlock with flow deletion. The dimension upserts and
-- delivered transition are one transaction; response loss cannot double fold.
create or replace function public.settle_product_event_outbox_rollup_v1(
  p_event_id text,
  p_lease_id text
) returns text
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v_event public.product_events%rowtype;
  v_queue public.product_event_outbox%rowtype;
  v_flow_expires_at timestamptz;
begin
  if p_event_id is null or p_event_id !~
    '^tev_[0-9a-f]{16}_[0-9a-f]{32}_[0-9a-f]{64}$'
    or p_lease_id is null or p_lease_id !~ '^[0-9a-f]{32}$' then
    raise exception 'invalid product-event rollup settlement';
  end if;

  select event.* into v_event
  from public.product_events event
  where event.event_id = p_event_id
  for update;
  if not found then return 'not_found'; end if;
  if not (v_event.expires_at > statement_timestamp()) then
    delete from public.product_events event where event.event_id = p_event_id;
    return 'not_found';
  end if;

  if v_event.flow_id is not null then
    select flow.expires_at into v_flow_expires_at
    from public.telemetry_flows flow
    where flow.flow_id = v_event.flow_id;
    if not found or not (v_flow_expires_at > statement_timestamp()) then
      delete from public.product_events event where event.event_id = p_event_id;
      return 'not_found';
    end if;
  end if;

  select queue.* into v_queue
  from public.product_event_outbox queue
  where queue.event_id = p_event_id
  for update;
  if not found then return 'not_found'; end if;
  if v_queue.status = 'delivered' then return 'duplicate'; end if;
  if v_queue.status = 'exhausted' then return 'exhausted'; end if;
  if v_queue.status <> 'leased' or v_queue.lease_id <> p_lease_id then
    return 'stale';
  end if;
  if v_queue.lease_expires_at <= statement_timestamp() then
    if v_queue.attempt_count >= 20 then
      update public.product_event_outbox queue set
        status = 'exhausted',
        lease_id = null,
        lease_expires_at = null,
        last_error_class = coalesce(queue.last_error_class, 'timeout'),
        exhausted_at = statement_timestamp(),
        updated_at = statement_timestamp()
      where queue.event_id = p_event_id;
      return 'exhausted';
    end if;
    return 'stale';
  end if;

  insert into public.telemetry_event_daily_rollups (
    bucket_date, schema_version, event_name, dimension_name,
    dimension_value, event_count
  )
  select
    (v_event.occurred_at at time zone 'UTC')::date,
    v_event.schema_version,
    v_event.event_name,
    dimension.dimension_name,
    dimension.dimension_value,
    1
  from (values
    (0, 'all'::text, 'all'::text),
    (1, 'surface', v_event.surface),
    (2, 'viewport_bucket', v_event.viewport_bucket),
    (3, 'auth_method', v_event.auth_method),
    (4, 'rate_operation', v_event.rate_operation),
    (5, 'limit_scope', v_event.limit_scope),
    (6, 'recipe_id', v_event.recipe_id),
    (7, 'story_role', v_event.story_role),
    (8, 'match_disposition', v_event.match_disposition),
    (9, 'confidence_bucket', v_event.confidence_bucket),
    (10, 'match_path', v_event.match_path),
    (11, 'age_fallback', case
      when v_event.age_fallback is null then null
      else v_event.age_fallback::text
    end),
    (12, 'boundary_outcome', v_event.boundary_outcome),
    (13, 'policy_version', v_event.policy_version),
    (14, 'composition_mode', v_event.composition_mode),
    (15, 'fallback_reason', v_event.fallback_reason),
    (16, 'attempt_bucket', v_event.attempt_bucket),
    (17, 'latency_bucket', v_event.latency_bucket),
    (18, 'passage_ordinal', case
      when v_event.passage_ordinal is null then null
      else v_event.passage_ordinal::text
    end),
    (19, 'feedback_verdict', v_event.feedback_verdict),
    (20, 'alternate_outcome', v_event.alternate_outcome),
    (21, 'reopen_age_bucket', v_event.reopen_age_bucket),
    (22, 'deletion_scope', v_event.deletion_scope),
    (23, 'error_domain', v_event.error_domain),
    (24, 'error_class', v_event.error_class),
    (25, 'status_bucket', v_event.status_bucket)
  ) as dimension(sort_order, dimension_name, dimension_value)
  where dimension.dimension_value is not null
  order by dimension.sort_order
  on conflict (
    bucket_date, schema_version, event_name, dimension_name, dimension_value
  ) do update set event_count =
    public.telemetry_event_daily_rollups.event_count + 1;

  update public.product_event_outbox queue set
    status = 'delivered',
    lease_id = null,
    lease_expires_at = null,
    delivered_at = statement_timestamp(),
    updated_at = statement_timestamp()
  where queue.event_id = p_event_id
    and queue.status = 'leased'
    and queue.lease_id = p_lease_id
    and queue.lease_expires_at > statement_timestamp();
  if not found then
    raise exception 'product-event rollup settlement lost its active lease';
  end if;
  return 'aggregated';
end
$fn$;

revoke all on function public.settle_product_event_outbox_rollup_v1(text, text)
  from public, anon, authenticated, service_role;

-- Fold any still-live pointer that an internal pre-0017 test consumer already
-- marked delivered. This is a one-time grouped backfill into a new table.
-- With the mandatory rollout quiescence, serialize queue writes, backfill, and
-- v1 grant revocation. A table lock cannot cancel a function invocation that
-- passed authorization before this transaction, so operators must stop legacy
-- workers and drain the 60-second lease first. Run this migration transactionally.
lock table public.product_event_outbox in share row exclusive mode;

-- 0011 deliberately did not backfill pointers for events that predated its
-- registry. Give every still-live legacy source a pointer during this atomic
-- cutover. Unregistered linked rows remain ineligible for v2 claim and expire
-- with their raw source; their pending pointer keeps reporting from declaring
-- that UTC date complete. Unlinkable or active-flow rows can drain normally.
insert into public.product_event_outbox (event_id)
select event.event_id
from public.product_events event
where event.expires_at > statement_timestamp()
on conflict (event_id) do nothing;

insert into public.telemetry_event_daily_rollups (
  bucket_date, schema_version, event_name, dimension_name,
  dimension_value, event_count
)
select
  (event.occurred_at at time zone 'UTC')::date,
  event.schema_version,
  event.event_name,
  dimension.dimension_name,
  dimension.dimension_value,
  count(*)
from public.product_event_outbox queue
join public.product_events event on event.event_id = queue.event_id
cross join lateral (values
  (0, 'all'::text, 'all'::text),
  (1, 'surface', event.surface),
  (2, 'viewport_bucket', event.viewport_bucket),
  (3, 'auth_method', event.auth_method),
  (4, 'rate_operation', event.rate_operation),
  (5, 'limit_scope', event.limit_scope),
  (6, 'recipe_id', event.recipe_id),
  (7, 'story_role', event.story_role),
  (8, 'match_disposition', event.match_disposition),
  (9, 'confidence_bucket', event.confidence_bucket),
  (10, 'match_path', event.match_path),
  (11, 'age_fallback', case
    when event.age_fallback is null then null else event.age_fallback::text
  end),
  (12, 'boundary_outcome', event.boundary_outcome),
  (13, 'policy_version', event.policy_version),
  (14, 'composition_mode', event.composition_mode),
  (15, 'fallback_reason', event.fallback_reason),
  (16, 'attempt_bucket', event.attempt_bucket),
  (17, 'latency_bucket', event.latency_bucket),
  (18, 'passage_ordinal', case
    when event.passage_ordinal is null then null else event.passage_ordinal::text
  end),
  (19, 'feedback_verdict', event.feedback_verdict),
  (20, 'alternate_outcome', event.alternate_outcome),
  (21, 'reopen_age_bucket', event.reopen_age_bucket),
  (22, 'deletion_scope', event.deletion_scope),
  (23, 'error_domain', event.error_domain),
  (24, 'error_class', event.error_class),
  (25, 'status_bucket', event.status_bucket)
) as dimension(sort_order, dimension_name, dimension_value)
where queue.status = 'delivered'
  and dimension.dimension_value is not null
  and event.expires_at > statement_timestamp()
  and (event.occurred_at at time zone 'UTC')::date + 30 >
    (statement_timestamp() at time zone 'UTC')::date
  and (
    event.flow_id is null
    or exists (
      select 1 from public.telemetry_flows flow
      where flow.flow_id = event.flow_id
        and flow.expires_at > statement_timestamp()
    )
  )
group by
  (event.occurred_at at time zone 'UTC')::date,
  event.schema_version,
  event.event_name,
  dimension.dimension_name,
  dimension.dimension_value;

-- A full-row claim plus separate ACK can bypass the atomic fold. No production
-- consumer existed before 0017, so revoke those service-role paths after the
-- backfill while retaining the functions for migration/rollback history.
revoke execute on function public.claim_product_event_outbox_v1(text, int)
  from service_role;
revoke execute on function public.ack_product_event_outbox_v1(text, text)
  from service_role;

create or replace function public.dispatch_product_event_rollups_v1(
  p_limit int
) returns table (
  claimed_count int,
  aggregated_count int,
  duplicate_count int,
  gone_count int,
  retried_count int,
  settlement_exhausted_count int,
  stale_count int,
  unsettled_count int
)
language plpgsql
security definer
set search_path = pg_catalog, public
set lock_timeout = '2s'
as $fn$
declare
  v_lease_id text := replace(gen_random_uuid()::text, '-', '');
  v_enabled boolean;
  v_claim record;
  v_settle text;
  v_nack text;
  v_claimed_count int := 0;
  v_aggregated_count int := 0;
  v_duplicate_count int := 0;
  v_gone_count int := 0;
  v_retried_count int := 0;
  v_settlement_exhausted_count int := 0;
  v_stale_count int := 0;
  v_unsettled_count int := 0;
begin
  if p_limit is null or p_limit < 1 or p_limit > 100 then
    raise exception 'product-event rollup dispatch limit must be between 1 and 100';
  end if;

  -- Hold a shared lock for the whole dispatch transaction. Disabling takes an
  -- update lock on this singleton, so the setter returns only after every
  -- already-running batch has drained; later batches observe false and no-op.
  select control.enabled into v_enabled
  from public.telemetry_rollup_dispatch_control control
  where control.singleton is true
  for share;
  if not coalesce(v_enabled, false) then
    return query select 0, 0, 0, 0, 0, 0, 0, 0;
    return;
  end if;

  for v_claim in
    select claim.event_id, claim.lease_id
    from public.claim_product_event_outbox_v2(v_lease_id, p_limit) claim
    join public.product_events event on event.event_id = claim.event_id
    -- Every event writes its all/all cell first. A global event/day order keeps
    -- concurrent batches from taking shared aggregate-cell locks in reverse.
    order by
      event.event_name,
      (event.occurred_at at time zone 'UTC')::date,
      event.event_id
  loop
    v_claimed_count := v_claimed_count + 1;
    begin
      v_settle := public.settle_product_event_outbox_rollup_v1(
        v_claim.event_id,
        v_claim.lease_id
      );
      case v_settle
        when 'aggregated' then
          v_aggregated_count := v_aggregated_count + 1;
        when 'duplicate' then
          v_duplicate_count := v_duplicate_count + 1;
        when 'exhausted' then
          v_settlement_exhausted_count :=
            v_settlement_exhausted_count + 1;
        when 'not_found' then
          v_gone_count := v_gone_count + 1;
        when 'stale' then
          v_stale_count := v_stale_count + 1;
        else
          raise exception 'product-event rollup settlement returned an invalid result';
      end case;
    exception when others then
      -- This exception subtransaction rolls back a partial fold. Persist only
      -- one fixed closed class; never copy SQLERRM, detail, context, or data.
      begin
        v_nack := public.nack_product_event_outbox_v1(
          v_claim.event_id,
          v_claim.lease_id,
          'database'
        );
        case v_nack
          when 'released' then
            v_retried_count := v_retried_count + 1;
          when 'exhausted' then
            v_settlement_exhausted_count :=
              v_settlement_exhausted_count + 1;
          when 'delivered' then
            v_duplicate_count := v_duplicate_count + 1;
          when 'not_found' then
            v_gone_count := v_gone_count + 1;
          when 'stale' then
            v_unsettled_count := v_unsettled_count + 1;
          else
            v_unsettled_count := v_unsettled_count + 1;
        end case;
      exception when others then
        -- Leave the pointer to lease expiry/reclaim. Queue health exposes only
        -- counts and a closed age bucket; this exception is never logged.
        v_unsettled_count := v_unsettled_count + 1;
      end;
    end;
  end loop;

  return query select
    v_claimed_count, v_aggregated_count, v_duplicate_count, v_gone_count,
    v_retried_count, v_settlement_exhausted_count, v_stale_count,
    v_unsettled_count;
end
$fn$;

revoke all on function public.dispatch_product_event_rollups_v1(int)
  from public, anon, authenticated;
grant execute on function public.dispatch_product_event_rollups_v1(int)
  to service_role;

-- This is a private reporting candidate, not yet an approved dashboard grant.
-- It withholds the two newest UTC dates, any day with unsettled source work,
-- and every cell for an event/day when any positive marginal cell is below k.
-- Counts are events, not distinct contributors; this is only a cell threshold.
-- A later privacy-reviewed dashboard slice
-- may grant it or replace it; 0017 deliberately grants no caller.
create or replace function public.read_telemetry_event_rollups_v1(
  p_from date,
  p_to date
) returns table (
  bucket_date date,
  schema_version text,
  event_name text,
  dimension_name text,
  dimension_value text,
  event_count bigint
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v_today date := (statement_timestamp() at time zone 'UTC')::date;
begin
  if p_from is null or p_to is null or p_from >= p_to
    or p_to - p_from > 28
    or p_from < v_today - 29
    or p_to > v_today - 1 then
    raise exception 'telemetry rollup window must be mature, retained, and at most 28 days';
  end if;

  return query
  with requested as materialized (
    select cell.*
    from public.telemetry_event_daily_rollups cell
    where cell.bucket_date >= p_from and cell.bucket_date < p_to
  ), unsafe_partitions as materialized (
    select
      cell.bucket_date, cell.schema_version, cell.event_name,
      cell.dimension_name
    from requested cell
    where cell.dimension_name <> 'all'
    group by
      cell.bucket_date, cell.schema_version, cell.event_name,
      cell.dimension_name
    having min(cell.event_count) < 10
  ), unsafe_events as materialized (
    select distinct
      unsafe_partition.bucket_date, unsafe_partition.schema_version,
      unsafe_partition.event_name
    from unsafe_partitions unsafe_partition
  )
  select
    rollup.bucket_date,
    rollup.schema_version,
    rollup.event_name,
    rollup.dimension_name,
    rollup.dimension_value,
    rollup.event_count
  from requested rollup
  where rollup.event_count >= 10
    and not exists (
      select 1
      from public.product_events event
      left join public.product_event_outbox queue
        on queue.event_id = event.event_id
      where (event.occurred_at at time zone 'UTC')::date = rollup.bucket_date
        and (
          queue.event_id is null
          or queue.status <> 'delivered'
        )
    )
    -- Secondary suppression is event/day-wide. If any positive category in
    -- any marginal partition is below k, return no cell for that event/day;
    -- otherwise another complete marginal could reveal the hidden complement.
    and not exists (
      select 1
      from unsafe_events unsafe
      where unsafe.bucket_date = rollup.bucket_date
        and unsafe.schema_version = rollup.schema_version
        and unsafe.event_name = rollup.event_name
    )
  order by
    rollup.bucket_date, rollup.event_name,
    rollup.dimension_name, rollup.dimension_value;
end
$fn$;

revoke all on function public.read_telemetry_event_rollups_v1(date, date)
  from public, anon, authenticated, service_role;

-- Queue health is independent of event delivery and returns no event name,
-- identifier, timestamp, payload, or exception.
create or replace function public.telemetry_outbox_health_v1()
returns table (
  dispatch_enabled boolean,
  pending_count bigint,
  leased_count bigint,
  delivered_count bigint,
  exhausted_count bigint,
  actionable_count bigint,
  oldest_actionable_age_bucket text
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $fn$
  with actionable as (
    select
      case
        when queue.status = 'pending' then queue.next_attempt_at
        else queue.lease_expires_at
      end as actionable_at
    from public.product_event_outbox queue
    join public.product_events event on event.event_id = queue.event_id
    where (
      (queue.status = 'pending' and queue.next_attempt_at <= statement_timestamp())
      or (queue.status = 'leased' and queue.lease_expires_at <= statement_timestamp())
    )
    and event.expires_at > statement_timestamp()
    and (
      event.flow_id is null
      or exists (
        select 1
        from public.telemetry_flows flow
        where flow.flow_id = event.flow_id
          and flow.expires_at > statement_timestamp()
      )
    )
  ), summary as (
    select
      count(*) filter (where queue.status = 'pending') as pending_count,
      count(*) filter (where queue.status = 'leased') as leased_count,
      count(*) filter (where queue.status = 'delivered') as delivered_count,
      count(*) filter (where queue.status = 'exhausted') as exhausted_count,
      (select count(*) from actionable) as actionable_count,
      (select min(actionable.actionable_at) from actionable) as oldest_actionable_at
    from public.product_event_outbox queue
  ), control as (
    select coalesce(bool_or(setting.enabled), false) as dispatch_enabled
    from public.telemetry_rollup_dispatch_control setting
    where setting.singleton is true
  )
  select
    control.dispatch_enabled,
    summary.pending_count,
    summary.leased_count,
    summary.delivered_count,
    summary.exhausted_count,
    summary.actionable_count,
    case
      when summary.oldest_actionable_at is null then 'none'
      when statement_timestamp() - summary.oldest_actionable_at < interval '1 minute'
        then 'lt1m'
      when statement_timestamp() - summary.oldest_actionable_at < interval '5 minutes'
        then '1to5m'
      when statement_timestamp() - summary.oldest_actionable_at < interval '15 minutes'
        then '5to15m'
      when statement_timestamp() - summary.oldest_actionable_at < interval '60 minutes'
        then '15to60m'
      else 'gt60m'
    end
  from summary cross join control;
$fn$;

revoke all on function public.telemetry_outbox_health_v1()
  from public, anon, authenticated;
grant execute on function public.telemetry_outbox_health_v1()
  to service_role;

create or replace function public.delete_expired_telemetry_rollups_v1()
returns void
language sql
security definer
set search_path = pg_catalog, public
as $fn$
  delete from public.telemetry_event_daily_rollups rollup
  where rollup.bucket_date + 30 <=
    (statement_timestamp() at time zone 'UTC')::date;
$fn$;

revoke all on function public.delete_expired_telemetry_rollups_v1()
  from public, anon, authenticated;
grant execute on function public.delete_expired_telemetry_rollups_v1()
  to service_role;

select cron.schedule(
  'onward-dispatch-product-event-rollups',
  '* * * * *',
  $$select public.dispatch_product_event_rollups_v1(25);$$
);

select cron.schedule(
  'onward-prune-product-event-rollups',
  '17 4 * * *',
  $$select public.delete_expired_telemetry_rollups_v1();$$
);

-- Read-only deployment proof for the pieces that check-db cannot safely
-- exercise with live queue rows. This exposes closed booleans only; real
-- concurrency, deletion races, and cron execution still require staging.
create or replace function public.telemetry_rollup_schema_health_v1()
returns table (
  ok boolean,
  dispatch_enabled boolean,
  tables_forced_rls boolean,
  raw_paths_revoked boolean,
  helpers_private boolean,
  boundaries_granted boolean,
  cron_jobs_active boolean
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v_dispatch_enabled boolean;
  v_tables_forced_rls boolean;
  v_raw_paths_revoked boolean;
  v_helpers_private boolean;
  v_boundaries_granted boolean;
  v_cron_jobs_active boolean;
begin
  select coalesce(bool_or(control.enabled), false)
  into v_dispatch_enabled
  from public.telemetry_rollup_dispatch_control control
  where control.singleton is true;

  select count(*) = 2 and bool_and(class.relrowsecurity and class.relforcerowsecurity)
  into v_tables_forced_rls
  from pg_catalog.pg_class class
  join pg_catalog.pg_namespace namespace on namespace.oid = class.relnamespace
  where namespace.nspname = 'public'
    and class.relname in (
      'telemetry_event_daily_rollups',
      'telemetry_rollup_dispatch_control'
    );

  v_raw_paths_revoked :=
    not exists (
      select 1
      from (values
        ('anon'::text),
        ('authenticated'::text),
        ('service_role'::text)
      ) as principal(role_name)
      where pg_catalog.has_function_privilege(
        principal.role_name,
        'public.claim_product_event_outbox_v1(text,integer)',
        'EXECUTE'
      ) or pg_catalog.has_function_privilege(
        principal.role_name,
        'public.ack_product_event_outbox_v1(text,text)',
        'EXECUTE'
      )
    )
    and not exists (
      select 1
      from (values
        ('anon'::text),
        ('authenticated'::text),
        ('service_role'::text)
      ) as principal(role_name)
      cross join (values
        ('public.telemetry_event_daily_rollups'::text),
        ('public.telemetry_rollup_dispatch_control'::text)
      ) as target(relation_name)
      cross join (values
        ('SELECT'::text), ('INSERT'::text), ('UPDATE'::text),
        ('DELETE'::text), ('TRUNCATE'::text), ('REFERENCES'::text),
        ('TRIGGER'::text)
      ) as privilege(privilege_name)
      where pg_catalog.has_table_privilege(
        principal.role_name,
        target.relation_name,
        privilege.privilege_name
      )
    )
    and not exists (
      select 1
      from (values
        ('anon'::text),
        ('authenticated'::text),
        ('service_role'::text)
      ) as principal(role_name)
      cross join (values
        ('public.telemetry_event_daily_rollups'::text),
        ('public.telemetry_rollup_dispatch_control'::text)
      ) as target(relation_name)
      cross join (values
        ('SELECT'::text), ('INSERT'::text),
        ('UPDATE'::text), ('REFERENCES'::text)
      ) as privilege(privilege_name)
      where pg_catalog.has_any_column_privilege(
        principal.role_name,
        target.relation_name,
        privilege.privilege_name
      )
    );

  v_helpers_private :=
    pg_catalog.to_regprocedure(
      'public.claim_product_event_outbox_v2(text,integer)'
    ) is not null
    and pg_catalog.to_regprocedure(
      'public.settle_product_event_outbox_rollup_v1(text,text)'
    ) is not null
    and pg_catalog.to_regprocedure(
      'public.nack_product_event_outbox_v1(text,text,text)'
    ) is not null
    and not exists (
      select 1
      from (values
        ('anon'::text),
        ('authenticated'::text),
        ('service_role'::text)
      ) as principal(role_name)
      where pg_catalog.has_function_privilege(
        principal.role_name,
        'public.claim_product_event_outbox_v2(text,integer)',
        'EXECUTE'
      ) or pg_catalog.has_function_privilege(
        principal.role_name,
        'public.settle_product_event_outbox_rollup_v1(text,text)',
        'EXECUTE'
      ) or pg_catalog.has_function_privilege(
        principal.role_name,
        'public.read_telemetry_event_rollups_v1(date,date)',
        'EXECUTE'
      )
    );

  v_boundaries_granted :=
    pg_catalog.has_function_privilege(
      'service_role',
      'public.dispatch_product_event_rollups_v1(integer)',
      'EXECUTE'
    )
    and pg_catalog.has_function_privilege(
      'service_role',
      'public.telemetry_outbox_health_v1()',
      'EXECUTE'
    )
    and pg_catalog.has_function_privilege(
      'service_role',
      'public.set_telemetry_rollup_dispatch_enabled_v1(boolean)',
      'EXECUTE'
    )
    and pg_catalog.has_function_privilege(
      'service_role',
      'public.delete_expired_telemetry_rollups_v1()',
      'EXECUTE'
    )
    and pg_catalog.has_function_privilege(
      'service_role',
      'public.telemetry_rollup_schema_health_v1()',
      'EXECUTE'
    )
    and not exists (
      select 1
      from (values
        ('anon'::text),
        ('authenticated'::text)
      ) as principal(role_name)
      where pg_catalog.has_function_privilege(
        principal.role_name,
        'public.dispatch_product_event_rollups_v1(integer)',
        'EXECUTE'
      ) or pg_catalog.has_function_privilege(
        principal.role_name,
        'public.telemetry_outbox_health_v1()',
        'EXECUTE'
      ) or pg_catalog.has_function_privilege(
        principal.role_name,
        'public.set_telemetry_rollup_dispatch_enabled_v1(boolean)',
        'EXECUTE'
      ) or pg_catalog.has_function_privilege(
        principal.role_name,
        'public.delete_expired_telemetry_rollups_v1()',
        'EXECUTE'
      ) or pg_catalog.has_function_privilege(
        principal.role_name,
        'public.telemetry_rollup_schema_health_v1()',
        'EXECUTE'
      )
    );

  select count(*) = 2 and bool_and(
    job.active and case job.jobname
      when 'onward-dispatch-product-event-rollups' then
        job.schedule = '* * * * *'
        and pg_catalog.btrim(job.command) =
          'select public.dispatch_product_event_rollups_v1(25);'
      when 'onward-prune-product-event-rollups' then
        job.schedule = '17 4 * * *'
        and pg_catalog.btrim(job.command) =
          'select public.delete_expired_telemetry_rollups_v1();'
      else false
    end
  )
  into v_cron_jobs_active
  from cron.job job
  where job.jobname in (
    'onward-dispatch-product-event-rollups',
    'onward-prune-product-event-rollups'
  );

  return query select
    v_tables_forced_rls and v_raw_paths_revoked and v_helpers_private
      and v_boundaries_granted and v_cron_jobs_active,
    v_dispatch_enabled,
    v_tables_forced_rls,
    v_raw_paths_revoked,
    v_helpers_private,
    v_boundaries_granted,
    v_cron_jobs_active;
end
$fn$;

revoke all on function public.telemetry_rollup_schema_health_v1()
  from public, anon, authenticated;
grant execute on function public.telemetry_rollup_schema_health_v1()
  to service_role;
