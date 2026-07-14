-- Transaction-coupled telemetry producers for the initial match journey.
--
-- These RPCs keep domain state and its authoritative product event in the
-- same Postgres transaction. Event IDs remain HMAC-authenticated by the
-- server application; SQL validates their bounded shape and delegates every
-- event write to capture_product_event_v1.

-- An RPC response can be lost after Postgres commits. Persist the closed
-- limiter decision under the caller's retry-stable occurrence event ID so a
-- retry returns the authoritative answer without incrementing the counters a
-- second time. Deliberately store no user key or IP hash here: rate-limit
-- telemetry remains unlinkable. Rows only need to outlive the counter windows.
create table public.match_rate_limit_decisions (
  event_id text primary key,
  allowed boolean not null,
  denied_scope text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '2 days'),
  constraint match_rate_limit_decisions_event_id_check check (
    event_id ~ '^tev_[0-9a-f]{16}_[0-9a-f]{32}_[0-9a-f]{64}$'
  ),
  constraint match_rate_limit_decisions_result_check check (
    (allowed is true and denied_scope is null)
    or (allowed is false and denied_scope in ('user', 'ip'))
  ),
  constraint match_rate_limit_decisions_retention_check check (
    expires_at > created_at
    and expires_at <= created_at + interval '2 days'
  )
);

create index match_rate_limit_decisions_expiry_idx
  on public.match_rate_limit_decisions (expires_at);

alter table public.match_rate_limit_decisions enable row level security;
alter table public.match_rate_limit_decisions force row level security;
revoke all on table public.match_rate_limit_decisions
  from public, anon, authenticated, service_role;

select cron.schedule(
  'onward-prune-match-rate-limit-decisions',
  '29 4 * * *',
  $job$
    delete from public.match_rate_limit_decisions
    where expires_at <= now()
  $job$
);

-- Consume all four fixed-window match counters. A denial records one
-- unlinkable intake rate-limit occurrence in the same transaction. User scope
-- wins deterministically when both the user and IP budgets deny the request.
-- Reusing p_event_id returns the first committed decision without consuming
-- again; an advisory transaction lock serializes concurrent copies.
create or replace function public.consume_match_rate_limit_v2(
  p_user_key text,
  p_ip_key text,
  p_user_hour_max int,
  p_user_day_max int,
  p_ip_hour_max int,
  p_ip_day_max int,
  p_event_id text,
  p_schema_version text
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v_hour_start timestamptz := date_trunc('hour', statement_timestamp());
  v_day_start timestamptz := date_trunc('day', statement_timestamp());
  v_user_hour int;
  v_user_day int;
  v_ip_hour int;
  v_ip_day int;
  v_denied_scope text;
  v_capture_status text;
  v_existing public.match_rate_limit_decisions%rowtype;
begin
  if p_user_key is null or p_user_key !~
      '^u:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    or p_ip_key is null or p_ip_key !~ '^ip:[0-9a-f]{64}$'
    or p_user_hour_max is null or p_user_hour_max < 1
    or p_user_day_max is null or p_user_day_max < 1
    or p_ip_hour_max is null or p_ip_hour_max < 1
    or p_ip_day_max is null or p_ip_day_max < 1 then
    raise exception 'invalid match rate-limit input';
  end if;
  if p_event_id is null or p_event_id !~
    '^tev_[0-9a-f]{16}_[0-9a-f]{32}_[0-9a-f]{64}$'
    or p_schema_version is distinct from 'product-event-v1-2026-07' then
    raise exception 'invalid match rate-limit telemetry identity';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended('match-rate-limit:' || p_event_id, 0)
  );
  delete from public.match_rate_limit_decisions decision
  where decision.event_id = p_event_id
    and decision.expires_at <= statement_timestamp();
  select * into v_existing
  from public.match_rate_limit_decisions decision
  where decision.event_id = p_event_id;
  if found then
    return jsonb_build_object(
      'allowed', v_existing.allowed,
      'deniedScope', v_existing.denied_scope
    );
  end if;

  insert into public.rate_limits as rate_limit (
    bucket_key, window_seconds, window_start, request_count
  ) values (p_user_key, 3600, v_hour_start, 1)
  on conflict (bucket_key, window_seconds, window_start)
    do update set request_count = rate_limit.request_count + 1
  returning rate_limit.request_count into v_user_hour;

  insert into public.rate_limits as rate_limit (
    bucket_key, window_seconds, window_start, request_count
  ) values (p_user_key, 86400, v_day_start, 1)
  on conflict (bucket_key, window_seconds, window_start)
    do update set request_count = rate_limit.request_count + 1
  returning rate_limit.request_count into v_user_day;

  insert into public.rate_limits as rate_limit (
    bucket_key, window_seconds, window_start, request_count
  ) values (p_ip_key, 3600, v_hour_start, 1)
  on conflict (bucket_key, window_seconds, window_start)
    do update set request_count = rate_limit.request_count + 1
  returning rate_limit.request_count into v_ip_hour;

  insert into public.rate_limits as rate_limit (
    bucket_key, window_seconds, window_start, request_count
  ) values (p_ip_key, 86400, v_day_start, 1)
  on conflict (bucket_key, window_seconds, window_start)
    do update set request_count = rate_limit.request_count + 1
  returning rate_limit.request_count into v_ip_day;

  v_denied_scope := case
    when v_user_hour > p_user_hour_max or v_user_day > p_user_day_max
      then 'user'
    when v_ip_hour > p_ip_hour_max or v_ip_day > p_ip_day_max
      then 'ip'
    else null
  end;

  if v_denied_scope is not null then
    select public.capture_product_event_v1(
      p_event_id => p_event_id,
      p_schema_version => p_schema_version,
      p_flow_id => null,
      p_event_name => 'rate_limited',
      p_rate_operation => 'intake',
      p_limit_scope => v_denied_scope
    ) into v_capture_status;
    if v_capture_status is null
      or v_capture_status not in ('created', 'duplicate') then
      raise exception 'match rate-limit telemetry conflicted';
    end if;
  end if;

  insert into public.match_rate_limit_decisions (
    event_id, allowed, denied_scope
  ) values (
    p_event_id, v_denied_scope is null, v_denied_scope
  );

  return jsonb_build_object(
    'allowed', v_denied_scope is null,
    'deniedScope', v_denied_scope
  );
end
$fn$;

revoke all on function public.consume_match_rate_limit_v2(
  text, text, int, int, int, int, text, text
) from public, anon, authenticated;
grant execute on function public.consume_match_rate_limit_v2(
  text, text, int, int, int, int, text, text
) to service_role;

-- Issue a single-use recovery token only for an active owner-claimed flow that
-- has not yet been bound to a story. The recovery purpose fixes the match
-- disposition and whether clarification_shown must exist, so callers cannot
-- report an impossible purpose/event combination.
create or replace function public.issue_match_recovery_flow_v2(
  p_token_hash text,
  p_user_id uuid,
  p_input_hash text,
  p_purpose text,
  p_expires_at timestamptz,
  p_telemetry_flow_id text,
  p_match_event_id text,
  p_clarification_event_id text,
  p_schema_version text,
  p_recipe_id text,
  p_confidence_bucket text,
  p_match_path text,
  p_age_fallback boolean,
  p_boundary_outcome text
) returns text
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v_flow public.telemetry_flows%rowtype;
  v_match_disposition text;
  v_capture_status text;
  v_existing_match_event_id text;
begin
  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$'
    or p_input_hash is null or p_input_hash !~ '^[0-9a-f]{64}$'
    or p_user_id is null
    or p_purpose is null
    or p_purpose not in ('clarification', 'adjacent_acceptance')
    or p_expires_at is null
    or p_expires_at <= statement_timestamp()
    or p_expires_at > statement_timestamp() + interval '10 minutes'
    or p_telemetry_flow_id is null or p_telemetry_flow_id !~
      '^tfl_[0-9a-f]{16}_[0-9a-f]{32}_[0-9a-f]{64}$'
    or p_match_event_id is null or p_match_event_id !~
      '^tev_[0-9a-f]{16}_[0-9a-f]{32}_[0-9a-f]{64}$'
    or p_schema_version is distinct from 'product-event-v1-2026-07'
    or p_recipe_id is distinct from
      'keyword-rerank-figure-library-50-2026-07-02'
    or p_confidence_bucket is null
    or p_confidence_bucket not in ('medium', 'low')
    or p_match_path is null
    or p_match_path not in ('rerank', 'keyword_fallback')
    or p_age_fallback is null
    or p_boundary_outcome is null
    or p_boundary_outcome not in ('not_set', 'passed') then
    raise exception 'invalid match recovery flow input';
  end if;
  if (
    p_purpose = 'clarification'
    and (
      p_clarification_event_id is null
      or p_clarification_event_id !~
        '^tev_[0-9a-f]{16}_[0-9a-f]{32}_[0-9a-f]{64}$'
    )
  ) or (
    p_purpose = 'adjacent_acceptance'
    and p_clarification_event_id is not null
  ) then
    raise exception 'invalid match recovery telemetry combination';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended('telemetry-flow:' || p_telemetry_flow_id, 0)
  );
  select * into v_flow
  from public.telemetry_flows flow
  where flow.flow_id = p_telemetry_flow_id
  for update;
  if not found
    or v_flow.user_id is distinct from p_user_id
    or v_flow.root_session_id is not null
    or v_flow.expires_at <= statement_timestamp()
    or p_expires_at > v_flow.expires_at then
    raise exception 'match recovery telemetry flow is unavailable';
  end if;

  insert into public.match_recovery_flows (
    token_hash, user_id, input_hash, purpose, expires_at
  ) values (
    p_token_hash, p_user_id, p_input_hash, p_purpose, p_expires_at
  );

  v_match_disposition := case p_purpose
    when 'clarification' then 'clarification_required'
    else 'no_close_match'
  end;
  select public.capture_product_event_v1(
    p_event_id => p_match_event_id,
    p_schema_version => p_schema_version,
    p_flow_id => p_telemetry_flow_id,
    p_event_name => 'match_completed',
    p_recipe_id => p_recipe_id,
    p_story_role => 'initial',
    p_match_disposition => v_match_disposition,
    p_confidence_bucket => p_confidence_bucket,
    p_match_path => p_match_path,
    p_age_fallback => p_age_fallback,
    p_boundary_outcome => p_boundary_outcome
  ) into v_capture_status;
  if v_capture_status = 'conflict' then
    -- A response-loss retry may legitimately recompute different calibration
    -- dimensions for the same match transition. The semantic unit is fixed by
    -- flow + role + disposition, so retain the first measured row and ensure
    -- its delivery pointer exists instead of blocking a fresh recovery token.
    select existing.event_id into v_existing_match_event_id
    from public.product_events existing
    where existing.schema_version = p_schema_version
      and existing.flow_id = p_telemetry_flow_id
      and existing.event_name = 'match_completed'
      and existing.story_role = 'initial'
      and existing.match_disposition = v_match_disposition;
    if not found then
      raise exception 'match recovery match telemetry conflicted';
    end if;
    insert into public.product_event_outbox (event_id)
    values (v_existing_match_event_id)
    on conflict (event_id) do nothing;
  elsif v_capture_status is null
    or v_capture_status not in ('created', 'duplicate') then
    raise exception 'match recovery match telemetry conflicted';
  end if;

  if p_purpose = 'clarification' then
    select public.capture_product_event_v1(
      p_event_id => p_clarification_event_id,
      p_schema_version => p_schema_version,
      p_flow_id => p_telemetry_flow_id,
      p_event_name => 'clarification_shown',
      p_policy_version => 'match-recovery-v1-2026-07'
    ) into v_capture_status;
    if v_capture_status is null
      or v_capture_status not in ('created', 'duplicate') then
      raise exception 'match recovery clarification telemetry conflicted';
    end if;
  end if;

  return 'created';
end
$fn$;

revoke all on function public.issue_match_recovery_flow_v2(
  text, uuid, text, text, timestamptz, text, text, text, text, text, text,
  text, boolean, text
) from public, anon, authenticated;
grant execute on function public.issue_match_recovery_flow_v2(
  text, uuid, text, text, timestamptz, text, text, text, text, text, text,
  text, boolean, text
) to service_role;

-- v4 wraps v3 so session/artifact insertion, telemetry-flow binding, and the
-- initial artifact denominator commit or roll back together. For an idempotent
-- v3 replay, dimensions are loaded from the already-persisted records rather
-- than trusting the newly supplied artifact payload.
create or replace function public.create_story_session_v4(
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
  p_telemetry_flow_id text,
  p_artifact_event_id text,
  p_telemetry_schema_version text
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v_result jsonb;
  v_status text;
  v_session public.sessions%rowtype;
  v_artifact public.story_artifacts%rowtype;
  v_recipe_id text;
  v_composition_mode text;
  v_fallback_reason text;
  v_attempt_count int;
  v_attempt_bucket text;
  v_capture_status text;
begin
  if p_artifact_event_id is null or p_artifact_event_id !~
    '^tev_[0-9a-f]{16}_[0-9a-f]{32}_[0-9a-f]{64}$'
    or p_telemetry_schema_version is distinct from
      'product-event-v1-2026-07' then
    raise exception 'invalid artifact telemetry identity';
  end if;

  v_result := public.create_story_session_v3(
    p_session_id,
    p_user_id,
    p_figure_key,
    p_stage_id,
    p_framing,
    p_age,
    p_feeling,
    p_story_request_context,
    p_match_recipe,
    p_artifact,
    p_telemetry_flow_id
  );
  v_status := v_result ->> 'status';
  if v_status is null then
    raise exception 'story-session v3 returned an invalid disposition';
  end if;
  if v_status not in ('created', 'existing') then return v_result; end if;

  select * into v_session
  from public.sessions story_session
  where story_session.session_id = v_result ->> 'sessionId'
    and story_session.user_id = p_user_id;
  if not found or v_session.alternate_of_session_id is not null
    or v_session.story_artifact_id is null then
    raise exception 'persisted initial story session is unavailable';
  end if;

  select * into v_artifact
  from public.story_artifacts artifact
  where artifact.artifact_id = v_session.story_artifact_id
    and artifact.session_id = v_session.session_id
    and artifact.user_id = v_session.user_id;
  if not found then
    raise exception 'persisted initial story artifact is unavailable';
  end if;

  v_recipe_id := v_session.match_recipe ->> 'recipeId';
  if v_recipe_id is distinct from
      'keyword-rerank-figure-library-50-2026-07-02'
    or (v_session.match_recipe ->> 'matchConfigVersion') is distinct from
      'figure-library-50-2026-07-02'
    or (v_session.match_recipe ->> 'retrievalMode') is distinct from 'keyword'
    or v_artifact.artifact #>> '{recipe,match,recipeId}'
      is distinct from v_recipe_id
    or v_artifact.artifact #>> '{recipe,match,matchConfigVersion}'
      is distinct from (v_session.match_recipe ->> 'matchConfigVersion')
    or v_artifact.artifact #>> '{recipe,match,retrievalMode}'
      is distinct from (v_session.match_recipe ->> 'retrievalMode') then
    raise exception 'persisted artifact recipe identity is invalid';
  end if;
  v_composition_mode := v_artifact.composition_mode;
  v_attempt_count := (v_artifact.artifact #>>
    '{composition,attemptCount}')::int;

  if v_composition_mode = 'hybrid' then
    if v_artifact.artifact #>> '{composition,fallbackReason}' is not null
      or v_attempt_count is null or v_attempt_count not in (1, 2) then
      raise exception 'persisted hybrid artifact telemetry is invalid';
    end if;
    v_fallback_reason := 'none';
    v_attempt_bucket := case v_attempt_count
      when 1 then 'first'
      else 'retry'
    end;
  elsif v_composition_mode = 'canonical_fallback' then
    v_fallback_reason := v_artifact.artifact #>>
      '{composition,fallbackReason}';
    if v_attempt_count = 0
      and v_fallback_reason in ('canonical_only', 'validator_rejected') then
      v_attempt_bucket := 'not_attempted';
    elsif v_attempt_count in (1, 2)
      and v_fallback_reason in (
        'provider_timeout', 'provider_error', 'provider_output_invalid',
        'validator_rejected'
      ) then
      v_attempt_bucket := 'exhausted';
    else
      raise exception 'persisted canonical artifact telemetry is invalid';
    end if;
  else
    raise exception 'persisted artifact composition mode is invalid';
  end if;

  select public.capture_product_event_v1(
    p_event_id => p_artifact_event_id,
    p_schema_version => p_telemetry_schema_version,
    p_flow_id => p_telemetry_flow_id,
    p_event_name => 'artifact_created',
    p_recipe_id => v_recipe_id,
    p_story_role => 'initial',
    p_composition_mode => v_composition_mode,
    p_fallback_reason => v_fallback_reason,
    p_attempt_bucket => v_attempt_bucket
  ) into v_capture_status;
  if v_capture_status is null
    or v_capture_status not in ('created', 'duplicate') then
    raise exception 'initial artifact telemetry conflicted';
  end if;

  return v_result;
end
$fn$;

revoke all on function public.create_story_session_v4(
  text, uuid, text, text, text, int, text, jsonb, jsonb, jsonb, text, text,
  text
) from public, anon, authenticated;
grant execute on function public.create_story_session_v4(
  text, uuid, text, text, text, int, text, jsonb, jsonb, jsonb, text, text,
  text
) to service_role;
