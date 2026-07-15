-- Transaction-coupled alternate-request telemetry.
--
-- Capability issuance and capability polling remain measurement-free. Only a
-- durable claim (or an idempotent state that proves an earlier claim) captures
-- alternate_requested. The legacy claim RPC stays available behind the
-- explicit telemetry-flow incident switch.

create or replace function public.claim_alternate_story_flow_v2(
  p_user_id uuid,
  p_source_session_id text,
  p_source_artifact_id text,
  p_token_hash text,
  p_policy_version text,
  p_lease_id text,
  p_telemetry_flow_id text,
  p_alternate_requested_event_id text,
  p_telemetry_schema_version text
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v_result jsonb;
  v_status text;
  v_alternate_flow public.alternate_story_flows%rowtype;
  v_telemetry_flow public.telemetry_flows%rowtype;
  v_capture_status text;
begin
  -- v1 owns the source advisory/session/flow lock order and the authoritative
  -- claim transition. Calling it inside this function keeps that mutation in
  -- this same outer transaction.
  v_result := public.claim_alternate_story_flow(
    p_user_id,
    p_source_session_id,
    p_source_artifact_id,
    p_token_hash,
    p_policy_version,
    p_lease_id
  );
  v_status := v_result ->> 'status';
  if v_status is null or v_status not in (
    'claimed', 'preparing', 'cooldown', 'ready', 'unavailable',
    'expired', 'exhausted', 'not_found'
  ) then
    raise exception 'alternate claim returned an invalid disposition';
  end if;
  if v_status = 'not_found' then return v_result; end if;

  select * into v_alternate_flow
  from public.alternate_story_flows flow
  where flow.source_session_id = p_source_session_id
    and flow.user_id = p_user_id
    and flow.source_artifact_id = p_source_artifact_id
  for share;
  if not found then
    raise exception 'claimed alternate flow is unavailable';
  end if;

  -- An expired, never-claimed capability is not recovery demand. Every other
  -- non-not-found disposition with attempt_count > 0 proves that the first
  -- valid durable claim already happened and may reconcile its outbox pointer.
  if v_alternate_flow.attempt_count = 0 then return v_result; end if;

  select * into v_telemetry_flow
  from public.telemetry_flows telemetry_flow
  where telemetry_flow.user_id = p_user_id
    and telemetry_flow.root_session_id = p_source_session_id
    and telemetry_flow.expires_at > statement_timestamp()
  for share;
  if found then
    if p_telemetry_flow_id is distinct from v_telemetry_flow.flow_id
      or p_alternate_requested_event_id is null
      or p_alternate_requested_event_id !~
        '^tev_[0-9a-f]{16}_[0-9a-f]{32}_[0-9a-f]{64}$'
      or p_telemetry_schema_version is distinct from
        'product-event-v1-2026-07' then
      raise exception 'active alternate-request telemetry capture is invalid';
    end if;

    select public.capture_product_event_v1(
      p_event_id => p_alternate_requested_event_id,
      p_schema_version => p_telemetry_schema_version,
      p_flow_id => v_telemetry_flow.flow_id,
      p_event_name => 'alternate_requested'
    ) into v_capture_status;
    if v_capture_status is null
      or v_capture_status not in ('created', 'duplicate') then
      raise exception 'alternate-request telemetry conflicted';
    end if;
  end if;

  return v_result;
end
$fn$;

revoke all on function public.claim_alternate_story_flow_v2(
  uuid, text, text, text, text, text, text, text, text
) from public, anon, authenticated;
grant execute on function public.claim_alternate_story_flow_v2(
  uuid, text, text, text, text, text, text, text, text
) to service_role;
