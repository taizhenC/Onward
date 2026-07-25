-- Alternate terminal, match-denominator, and artifact telemetry.
--
-- The legacy/v2 claim and legacy completion RPCs remain installed for stacked
-- rollback. Normal application writes use the suffixed functions below so
-- terminal resolution and alternate artifact creation share their owning
-- transaction. Match calibration is emitted at the server match boundary by
-- the existing typed capture path; capability issue/hydration remain silent.

-- Terminal outcome is a measured first-write-wins dimension of one flow-wide
-- semantic event. An exact retry with a later derived outcome reuses the first
-- accepted outcome and restores only a missing outbox pointer. A different
-- event ID for the same semantic unit still conflicts in capture_product_event_v1.
create or replace function public.capture_alternate_resolution_v1(
  p_event_id text,
  p_schema_version text,
  p_flow_id text,
  p_outcome text
) returns text
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v_existing public.product_events%rowtype;
  v_outcome text;
  v_status text;
begin
  if p_event_id is null or p_event_id !~
      '^tev_[0-9a-f]{16}_[0-9a-f]{32}_[0-9a-f]{64}$'
    or p_schema_version is distinct from 'product-event-v1-2026-07'
    or p_flow_id is null or p_flow_id !~
      '^tfl_[0-9a-f]{16}_[0-9a-f]{32}_[0-9a-f]{64}$'
    or p_outcome is null
    or p_outcome not in (
      'ready', 'unavailable', 'expired', 'exhausted', 'failed'
    ) then
    raise exception 'invalid alternate-resolution telemetry';
  end if;

  -- Serialize the read-before-capture reconciliation on the same lock used by
  -- capture_product_event_v1. Without this, two concurrent terminal outcomes
  -- could both observe no row and turn the second writer into a conflict rather
  -- than preserving the first accepted outcome.
  perform pg_advisory_xact_lock(hashtextextended(p_event_id, 0));
  select * into v_existing
  from public.product_events event
  where event.event_id = p_event_id;
  if found then
    if v_existing.schema_version is distinct from p_schema_version
      or v_existing.flow_id is distinct from p_flow_id
      or v_existing.event_name is distinct from 'alternate_resolved'
      or v_existing.alternate_outcome is null
      or v_existing.alternate_outcome not in (
        'ready', 'unavailable', 'expired', 'exhausted', 'failed'
      ) then
      return 'conflict';
    end if;
    v_outcome := v_existing.alternate_outcome;
  else
    v_outcome := p_outcome;
  end if;

  select public.capture_product_event_v1(
    p_event_id => p_event_id,
    p_schema_version => p_schema_version,
    p_flow_id => p_flow_id,
    p_event_name => 'alternate_resolved',
    p_alternate_outcome => v_outcome
  ) into v_status;
  return v_status;
end
$fn$;

revoke all on function public.capture_alternate_resolution_v1(
  text, text, text, text
) from public, anon, authenticated, service_role;

-- v3 preserves v2's claim/request transaction and adds terminal reconciliation
-- for states that prove a prior claim. A never-claimed expiry stays silent.
create or replace function public.claim_alternate_story_flow_v3(
  p_user_id uuid,
  p_source_session_id text,
  p_source_artifact_id text,
  p_token_hash text,
  p_policy_version text,
  p_lease_id text,
  p_telemetry_flow_id text,
  p_alternate_requested_event_id text,
  p_alternate_resolved_event_id text,
  p_telemetry_schema_version text
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v_result jsonb;
  v_status text;
  v_outcome text;
  v_alternate_flow public.alternate_story_flows%rowtype;
  v_telemetry_flow public.telemetry_flows%rowtype;
  v_capture_status text;
begin
  v_result := public.claim_alternate_story_flow_v2(
    p_user_id,
    p_source_session_id,
    p_source_artifact_id,
    p_token_hash,
    p_policy_version,
    p_lease_id,
    p_telemetry_flow_id,
    p_alternate_requested_event_id,
    p_telemetry_schema_version
  );
  v_status := v_result ->> 'status';
  if v_status is null or v_status not in (
    'claimed', 'preparing', 'cooldown', 'ready', 'unavailable',
    'expired', 'exhausted', 'not_found'
  ) then
    raise exception 'alternate claim v2 returned an invalid disposition';
  end if;
  if v_status not in ('ready', 'unavailable', 'expired', 'exhausted') then
    return v_result;
  end if;

  select * into v_alternate_flow
  from public.alternate_story_flows flow
  where flow.source_session_id = p_source_session_id
    and flow.user_id = p_user_id
    and flow.source_artifact_id = p_source_artifact_id
  for share;
  if not found or v_alternate_flow.attempt_count = 0 then return v_result; end if;

  v_outcome := case v_status
    when 'ready' then 'ready'
    when 'unavailable' then 'unavailable'
    when 'expired' then 'expired'
    else 'exhausted'
  end;
  select * into v_telemetry_flow
  from public.telemetry_flows telemetry_flow
  where telemetry_flow.user_id = p_user_id
    and telemetry_flow.root_session_id = p_source_session_id
    and telemetry_flow.expires_at > statement_timestamp()
  for share;
  if found then
    if p_telemetry_flow_id is distinct from v_telemetry_flow.flow_id
      or p_alternate_resolved_event_id is null
      or p_alternate_resolved_event_id !~
        '^tev_[0-9a-f]{16}_[0-9a-f]{32}_[0-9a-f]{64}$'
      or p_telemetry_schema_version is distinct from
        'product-event-v1-2026-07' then
      raise exception 'active alternate terminal capture is invalid';
    end if;
    select public.capture_alternate_resolution_v1(
      p_alternate_resolved_event_id,
      p_telemetry_schema_version,
      v_telemetry_flow.flow_id,
      v_outcome
    ) into v_capture_status;
    if v_capture_status is null
      or v_capture_status not in ('created', 'duplicate') then
      raise exception 'alternate terminal telemetry conflicted';
    end if;
  end if;
  return v_result;
end
$fn$;

revoke all on function public.claim_alternate_story_flow_v3(
  uuid, text, text, text, text, text, text, text, text, text
) from public, anon, authenticated;
grant execute on function public.claim_alternate_story_flow_v3(
  uuid, text, text, text, text, text, text, text, text, text
) to service_role;

-- A retryable release becomes terminal failed only after the bounded second
-- attempt. If the original context expired during work, expired wins. Existing
-- ready/unavailable state is reconciled rather than overwritten after an
-- ambiguous completion response.
create or replace function public.release_alternate_story_claim_v2(
  p_user_id uuid,
  p_source_session_id text,
  p_lease_id text,
  p_telemetry_flow_id text,
  p_alternate_resolved_event_id text,
  p_telemetry_schema_version text
) returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v_released boolean;
  v_outcome text;
  v_alternate_flow public.alternate_story_flows%rowtype;
  v_telemetry_flow public.telemetry_flows%rowtype;
  v_capture_status text;
begin
  v_released := public.release_alternate_story_claim(
    p_user_id, p_source_session_id, p_lease_id
  );
  select * into v_alternate_flow
  from public.alternate_story_flows flow
  where flow.source_session_id = p_source_session_id
    and flow.user_id = p_user_id
  for share;
  if not found then return false; end if;

  v_outcome := case
    when v_alternate_flow.status = 'ready'
      and v_alternate_flow.result_session_id is not null then 'ready'
    when v_alternate_flow.status in ('ready', 'unavailable') then 'unavailable'
    when v_alternate_flow.attempt_count > 0
      and v_alternate_flow.context_expires_at <= statement_timestamp()
      then 'expired'
    when v_alternate_flow.status = 'available'
      and v_alternate_flow.attempt_count >= 2 then 'failed'
    else null
  end;
  if v_outcome is null then return v_released; end if;

  select * into v_telemetry_flow
  from public.telemetry_flows telemetry_flow
  where telemetry_flow.user_id = p_user_id
    and telemetry_flow.root_session_id = p_source_session_id
    and telemetry_flow.expires_at > statement_timestamp()
  for share;
  if found then
    if p_telemetry_flow_id is distinct from v_telemetry_flow.flow_id
      or p_alternate_resolved_event_id is null
      or p_telemetry_schema_version is distinct from
        'product-event-v1-2026-07' then
      raise exception 'active alternate release telemetry is invalid';
    end if;
    select public.capture_alternate_resolution_v1(
      p_alternate_resolved_event_id,
      p_telemetry_schema_version,
      v_telemetry_flow.flow_id,
      v_outcome
    ) into v_capture_status;
    if v_capture_status is null
      or v_capture_status not in ('created', 'duplicate') then
      raise exception 'alternate release telemetry conflicted';
    end if;
  end if;
  return v_released;
end
$fn$;

revoke all on function public.release_alternate_story_claim_v2(
  uuid, text, text, text, text, text
) from public, anon, authenticated;
grant execute on function public.release_alternate_story_claim_v2(
  uuid, text, text, text, text, text
) to service_role;

create or replace function public.complete_alternate_story_unavailable_v2(
  p_user_id uuid,
  p_source_session_id text,
  p_lease_id text,
  p_telemetry_flow_id text,
  p_alternate_resolved_event_id text,
  p_telemetry_schema_version text
) returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v_completed boolean;
  v_outcome text;
  v_alternate_flow public.alternate_story_flows%rowtype;
  v_telemetry_flow public.telemetry_flows%rowtype;
  v_capture_status text;
begin
  v_completed := public.complete_alternate_story_unavailable(
    p_user_id, p_source_session_id, p_lease_id
  );
  select * into v_alternate_flow
  from public.alternate_story_flows flow
  where flow.source_session_id = p_source_session_id
    and flow.user_id = p_user_id
  for share;
  if not found then return false; end if;

  v_outcome := case
    when v_alternate_flow.status = 'ready'
      and v_alternate_flow.result_session_id is not null then 'ready'
    when v_alternate_flow.status in ('ready', 'unavailable') then 'unavailable'
    when v_alternate_flow.attempt_count > 0
      and v_alternate_flow.context_expires_at <= statement_timestamp()
      then 'expired'
    else null
  end;
  if v_alternate_flow.status = 'unavailable' then v_completed := true; end if;
  if v_outcome is null then return v_completed; end if;

  select * into v_telemetry_flow
  from public.telemetry_flows telemetry_flow
  where telemetry_flow.user_id = p_user_id
    and telemetry_flow.root_session_id = p_source_session_id
    and telemetry_flow.expires_at > statement_timestamp()
  for share;
  if found then
    if p_telemetry_flow_id is distinct from v_telemetry_flow.flow_id
      or p_alternate_resolved_event_id is null
      or p_telemetry_schema_version is distinct from
        'product-event-v1-2026-07' then
      raise exception 'active alternate-unavailable telemetry is invalid';
    end if;
    select public.capture_alternate_resolution_v1(
      p_alternate_resolved_event_id,
      p_telemetry_schema_version,
      v_telemetry_flow.flow_id,
      v_outcome
    ) into v_capture_status;
    if v_capture_status is null
      or v_capture_status not in ('created', 'duplicate') then
      raise exception 'alternate-unavailable telemetry conflicted';
    end if;
  end if;
  return v_completed;
end
$fn$;

revoke all on function public.complete_alternate_story_unavailable_v2(
  uuid, text, text, text, text, text
) from public, anon, authenticated;
grant execute on function public.complete_alternate_story_unavailable_v2(
  uuid, text, text, text, text, text
) to service_role;

-- Post-claim expiry is a terminal transition distinct from a capability that
-- expired before any claim. This function owns the existing source lock order,
-- clears the stale lease, and captures expired together.
create or replace function public.complete_alternate_story_expired_v1(
  p_user_id uuid,
  p_source_session_id text,
  p_lease_id text,
  p_telemetry_flow_id text,
  p_alternate_resolved_event_id text,
  p_telemetry_schema_version text
) returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v_source public.sessions%rowtype;
  v_alternate_flow public.alternate_story_flows%rowtype;
  v_telemetry_flow public.telemetry_flows%rowtype;
  v_capture_status text;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_source_session_id, 0));
  select * into v_source
  from public.sessions source
  where source.session_id = p_source_session_id
    and source.user_id = p_user_id
  for update;
  if not found then return false; end if;
  select * into v_alternate_flow
  from public.alternate_story_flows flow
  where flow.source_session_id = p_source_session_id
    and flow.user_id = p_user_id
  for update;
  if not found or v_alternate_flow.attempt_count = 0 then return false; end if;
  if v_alternate_flow.status in ('ready', 'unavailable') then return false; end if;
  if v_source.disclosure_expires_at > statement_timestamp()
    and v_alternate_flow.context_expires_at > statement_timestamp() then
    return false;
  end if;
  if v_alternate_flow.status = 'preparing'
    and v_alternate_flow.lease_id is distinct from p_lease_id then
    return false;
  end if;

  select * into v_telemetry_flow
  from public.telemetry_flows telemetry_flow
  where telemetry_flow.user_id = p_user_id
    and telemetry_flow.root_session_id = p_source_session_id
    and telemetry_flow.expires_at > statement_timestamp()
  for share;
  if found then
    if p_telemetry_flow_id is distinct from v_telemetry_flow.flow_id
      or p_alternate_resolved_event_id is null
      or p_telemetry_schema_version is distinct from
        'product-event-v1-2026-07' then
      raise exception 'active alternate-expired telemetry is invalid';
    end if;
    select public.capture_alternate_resolution_v1(
      p_alternate_resolved_event_id,
      p_telemetry_schema_version,
      v_telemetry_flow.flow_id,
      'expired'
    ) into v_capture_status;
    if v_capture_status is null
      or v_capture_status not in ('created', 'duplicate') then
      raise exception 'alternate-expired telemetry conflicted';
    end if;
  end if;

  update public.alternate_story_flows set
    status = 'available', lease_id = null, lease_expires_at = null,
    next_attempt_at = null, updated_at = now()
  where source_session_id = p_source_session_id;
  return true;
end
$fn$;

revoke all on function public.complete_alternate_story_expired_v1(
  uuid, text, text, text, text, text
) from public, anon, authenticated;
grant execute on function public.complete_alternate_story_expired_v1(
  uuid, text, text, text, text, text
) to service_role;

-- v2 wraps the authoritative alternate session/artifact transaction and derives
-- every artifact dimension from its persisted result before capturing the
-- alternate denominator and ready outcome together.
create or replace function public.complete_alternate_story_session_v2(
  p_user_id uuid,
  p_source_session_id text,
  p_lease_id text,
  p_session_id text,
  p_artifact jsonb,
  p_telemetry_flow_id text,
  p_artifact_event_id text,
  p_alternate_resolved_event_id text,
  p_telemetry_schema_version text
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v_result jsonb;
  v_status text;
  v_result_session public.sessions%rowtype;
  v_result_artifact public.story_artifacts%rowtype;
  v_alternate_flow public.alternate_story_flows%rowtype;
  v_telemetry_flow public.telemetry_flows%rowtype;
  v_recipe_id text;
  v_composition_mode text;
  v_fallback_reason text;
  v_attempt_count int;
  v_attempt_bucket text;
  v_capture_status text;
begin
  v_result := public.complete_alternate_story_session(
    p_user_id,
    p_source_session_id,
    p_lease_id,
    p_session_id,
    p_artifact
  );
  v_status := v_result ->> 'status';
  if v_status is null or v_status not in ('ready', 'collision', 'rejected') then
    raise exception 'alternate completion returned an invalid disposition';
  end if;
  if v_status <> 'ready' then return v_result; end if;

  select * into v_alternate_flow
  from public.alternate_story_flows flow
  where flow.source_session_id = p_source_session_id
    and flow.user_id = p_user_id
  for share;
  select * into v_result_session
  from public.sessions story_session
  where story_session.session_id = v_result ->> 'sessionId'
    and story_session.user_id = p_user_id;
  if v_alternate_flow.source_session_id is null
    or v_alternate_flow.status <> 'ready'
    or v_alternate_flow.result_session_id is distinct from
      v_result_session.session_id
    or v_result_session.alternate_of_session_id is distinct from
      p_source_session_id
    or v_result_session.story_artifact_id is null then
    raise exception 'persisted alternate result is unavailable';
  end if;
  select * into v_result_artifact
  from public.story_artifacts artifact
  where artifact.artifact_id = v_result_session.story_artifact_id
    and artifact.session_id = v_result_session.session_id
    and artifact.user_id = p_user_id;
  if not found then
    raise exception 'persisted alternate artifact is unavailable';
  end if;

  v_recipe_id := v_result_session.match_recipe ->> 'recipeId';
  if v_recipe_id is distinct from
      'keyword-rerank-figure-library-50-2026-07-02'
    or (v_result_session.match_recipe ->> 'matchConfigVersion') is distinct from
      'figure-library-50-2026-07-02'
    or (v_result_session.match_recipe ->> 'retrievalMode') is distinct from
      'keyword'
    or v_result_artifact.artifact #>>
      '{recipe,match,alternateStoryPolicyVersion}' is distinct from
      'alternate-story-v1-2026-07' then
    raise exception 'persisted alternate recipe identity is invalid';
  end if;
  v_composition_mode := v_result_artifact.composition_mode;
  v_attempt_count := (v_result_artifact.artifact #>>
    '{composition,attemptCount}')::int;
  if v_composition_mode = 'hybrid' then
    if v_result_artifact.artifact #>>
        '{composition,fallbackReason}' is not null
      or v_attempt_count is null or v_attempt_count not in (1, 2) then
      raise exception 'persisted alternate hybrid telemetry is invalid';
    end if;
    v_fallback_reason := 'none';
    v_attempt_bucket := case v_attempt_count when 1 then 'first' else 'retry' end;
  elsif v_composition_mode = 'canonical_fallback' then
    v_fallback_reason := v_result_artifact.artifact #>>
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
      raise exception 'persisted alternate fallback telemetry is invalid';
    end if;
  else
    raise exception 'persisted alternate composition mode is invalid';
  end if;

  select * into v_telemetry_flow
  from public.telemetry_flows telemetry_flow
  where telemetry_flow.user_id = p_user_id
    and telemetry_flow.root_session_id = p_source_session_id
    and telemetry_flow.expires_at > statement_timestamp()
  for share;
  if found then
    if p_telemetry_flow_id is distinct from v_telemetry_flow.flow_id
      or p_artifact_event_id is null
      or p_artifact_event_id !~
        '^tev_[0-9a-f]{16}_[0-9a-f]{32}_[0-9a-f]{64}$'
      or p_alternate_resolved_event_id is null
      or p_telemetry_schema_version is distinct from
        'product-event-v1-2026-07' then
      raise exception 'active alternate-ready telemetry is invalid';
    end if;

    select public.capture_product_event_v1(
      p_event_id => p_artifact_event_id,
      p_schema_version => p_telemetry_schema_version,
      p_flow_id => v_telemetry_flow.flow_id,
      p_event_name => 'artifact_created',
      p_recipe_id => v_recipe_id,
      p_story_role => 'alternate',
      p_composition_mode => v_composition_mode,
      p_fallback_reason => v_fallback_reason,
      p_attempt_bucket => v_attempt_bucket
    ) into v_capture_status;
    if v_capture_status is null
      or v_capture_status not in ('created', 'duplicate') then
      raise exception 'alternate artifact telemetry conflicted';
    end if;

    select public.capture_alternate_resolution_v1(
      p_alternate_resolved_event_id,
      p_telemetry_schema_version,
      v_telemetry_flow.flow_id,
      'ready'
    ) into v_capture_status;
    if v_capture_status is null
      or v_capture_status not in ('created', 'duplicate') then
      raise exception 'alternate ready telemetry conflicted';
    end if;
  end if;
  return v_result;
end
$fn$;

revoke all on function public.complete_alternate_story_session_v2(
  uuid, text, text, text, jsonb, text, text, text, text
) from public, anon, authenticated;
grant execute on function public.complete_alternate_story_session_v2(
  uuid, text, text, text, jsonb, text, text, text, text
) to service_role;
