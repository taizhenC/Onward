-- Owner-confirmed account deletion boundary.
--
-- The application authenticates the caller and supplies only that verified
-- auth.users id. This function is the single data-plane mutation: deleting the
-- auth user cascades sessions, artifacts, feedback, recovery/alternate state,
-- and owned telemetry flows. The telemetry-flow BEFORE DELETE trigger keeps
-- only its bounded opaque revocation tombstone. Rate-limit user buckets gain a
-- generated FK below so they obey the same deletion and concurrency boundary.

-- Attach user buckets to auth ownership without changing the limiter RPC
-- signatures. Drop malformed/stale legacy keys before adding the generated FK;
-- all authored keys are exact user UUIDs or salted-IP sha256 values.
delete from public.rate_limits rate
where not (
  rate.bucket_key ~ '^ip:[0-9a-f]{64}$'
  or (
    rate.bucket_key ~ '^u:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and exists (
      select 1
      from auth.users owner
      where owner.id::text = substring(rate.bucket_key from 3)
    )
  )
);

alter table public.rate_limits
  add column owner_user_id uuid generated always as (
    case
      when bucket_key ~ '^u:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        then substring(bucket_key from 3)::uuid
      else null
    end
  ) stored references auth.users (id) on delete cascade,
  add constraint rate_limits_bucket_shape check (
    bucket_key ~ '^ip:[0-9a-f]{64}$'
    or bucket_key ~ '^u:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  );

create index rate_limits_owner_user_id_idx
  on public.rate_limits (owner_user_id)
  where owner_user_id is not null;

-- Account deletion can be race-free only if a new owner claim or initial story
-- takes the account lock before touching a flow or inserting an auth-owned row.
-- Preserve the reviewed implementations behind private names and put the shared
-- advisory lock at their public RPC boundaries. create_story_session_v4 calls
-- v3, so it inherits the same transaction-scoped lock for its remaining work.
alter function public.claim_telemetry_flow_owner_v1(text, uuid)
  rename to claim_telemetry_flow_owner_v1_unserialized;
revoke all on function public.claim_telemetry_flow_owner_v1_unserialized(text, uuid)
  from public, anon, authenticated, service_role;

create or replace function public.claim_telemetry_flow_owner_v1(
  p_flow_id text,
  p_user_id uuid
) returns text
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v_result text;
begin
  if p_user_id is not null then
    perform pg_advisory_xact_lock(
      hashtextextended('onward-account-delete:' || p_user_id::text, 0)
    );
  end if;
  select public.claim_telemetry_flow_owner_v1_unserialized(
    p_flow_id, p_user_id
  ) into v_result;
  return v_result;
end
$fn$;

revoke all on function public.claim_telemetry_flow_owner_v1(text, uuid)
  from public, anon, authenticated;
grant execute on function public.claim_telemetry_flow_owner_v1(text, uuid)
  to service_role;

alter function public.create_story_session_v2(
  text, uuid, text, text, text, int, text, jsonb, jsonb, jsonb
) rename to create_story_session_v2_unserialized;
revoke all on function public.create_story_session_v2_unserialized(
  text, uuid, text, text, text, int, text, jsonb, jsonb, jsonb
) from public, anon, authenticated, service_role;

create or replace function public.create_story_session_v2(
  p_session_id text,
  p_user_id uuid,
  p_figure_key text,
  p_stage_id text,
  p_framing text,
  p_age int,
  p_feeling text,
  p_story_request_context jsonb,
  p_match_recipe jsonb,
  p_artifact jsonb
) returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
begin
  if p_user_id is not null then
    perform pg_advisory_xact_lock(
      hashtextextended('onward-account-delete:' || p_user_id::text, 0)
    );
  end if;
  perform public.create_story_session_v2_unserialized(
    p_session_id, p_user_id, p_figure_key, p_stage_id, p_framing, p_age,
    p_feeling, p_story_request_context, p_match_recipe, p_artifact
  );
end
$fn$;

revoke all on function public.create_story_session_v2(
  text, uuid, text, text, text, int, text, jsonb, jsonb, jsonb
) from public, anon, authenticated;
grant execute on function public.create_story_session_v2(
  text, uuid, text, text, text, int, text, jsonb, jsonb, jsonb
) to service_role;

alter function public.create_story_session_v3(
  text, uuid, text, text, text, int, text, jsonb, jsonb, jsonb, text
) rename to create_story_session_v3_unserialized;
revoke all on function public.create_story_session_v3_unserialized(
  text, uuid, text, text, text, int, text, jsonb, jsonb, jsonb, text
) from public, anon, authenticated, service_role;

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
  v_result jsonb;
begin
  if p_user_id is not null then
    perform pg_advisory_xact_lock(
      hashtextextended('onward-account-delete:' || p_user_id::text, 0)
    );
  end if;
  select public.create_story_session_v3_unserialized(
    p_session_id, p_user_id, p_figure_key, p_stage_id, p_framing, p_age,
    p_feeling, p_story_request_context, p_match_recipe, p_artifact,
    p_telemetry_flow_id
  ) into v_result;
  return v_result;
end
$fn$;

revoke all on function public.create_story_session_v3(
  text, uuid, text, text, text, int, text, jsonb, jsonb, jsonb, text
) from public, anon, authenticated;
grant execute on function public.create_story_session_v3(
  text, uuid, text, text, text, int, text, jsonb, jsonb, jsonb, text
) to service_role;

-- Wrap v4 explicitly as well. Besides making the account lock the outermost
-- operation for the production path, this protects already-compiled v4 plans
-- that may still resolve their v3 call to the renamed implementation.
alter function public.create_story_session_v4(
  text, uuid, text, text, text, int, text, jsonb, jsonb, jsonb, text, text,
  text
) rename to create_story_session_v4_unserialized;
revoke all on function public.create_story_session_v4_unserialized(
  text, uuid, text, text, text, int, text, jsonb, jsonb, jsonb, text, text,
  text
) from public, anon, authenticated, service_role;

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
begin
  if p_user_id is not null then
    perform pg_advisory_xact_lock(
      hashtextextended('onward-account-delete:' || p_user_id::text, 0)
    );
  end if;
  select public.create_story_session_v4_unserialized(
    p_session_id, p_user_id, p_figure_key, p_stage_id, p_framing, p_age,
    p_feeling, p_story_request_context, p_match_recipe, p_artifact,
    p_telemetry_flow_id, p_artifact_event_id, p_telemetry_schema_version
  ) into v_result;
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

-- Both user-requested deletion and scheduled guest expiry enter this private
-- boundary. p_guest_cutoff = null means unconditional owner-requested deletion;
-- a timestamp means the auth row and latest session activity must still satisfy
-- guest expiry while every mutation-relevant lock is held.
create or replace function public.delete_owned_account_internal_v1(
  p_user_id uuid,
  p_guest_cutoff timestamptz
) returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v_deleted boolean := false;
  v_is_anonymous boolean;
  v_user_created_at timestamptz;
  v_root_session_id text;
begin
  if p_user_id is null then
    return false;
  end if;

  -- Serialize duplicate account-deletion requests without retaining a new
  -- account identifier. FK checks on concurrent writes then resolve before the
  -- auth row is removed and cannot commit fresh owned data afterward.
  perform pg_advisory_xact_lock(
    hashtextextended('onward-account-delete:' || p_user_id::text, 0)
  );

  -- Alternate issue/claim/finalize and single-story deletion serialize on each
  -- immutable root. Take every owned root lock in deterministic order before
  -- locking rows, then match progress/feedback's session -> flow lock order.
  -- This prevents the auth cascade's internal FK order from becoming an
  -- accidental deadlock contract.
  for v_root_session_id in
    select owned.session_id
    from public.sessions owned
    where owned.user_id = p_user_id
      and owned.alternate_of_session_id is null
    order by owned.session_id
  loop
    perform pg_advisory_xact_lock(
      hashtextextended(v_root_session_id, 0)
    );
  end loop;

  perform 1
  from public.sessions owned
  where owned.user_id = p_user_id
  order by owned.session_id
  for update;

  perform 1
  from public.telemetry_flows flow
  where flow.user_id = p_user_id
  order by flow.flow_id
  for update;

  -- Story creation and flow claiming lock telemetry before taking an auth FK
  -- key-share lock. Locking auth only after every existing session/flow avoids
  -- reversing that order. Once held, no new owned child can cross this boundary.
  select guest.is_anonymous, guest.created_at
  into v_is_anonymous, v_user_created_at
  from auth.users guest
  where guest.id = p_user_id
  for update;
  if not found then
    return false;
  end if;

  -- Guest cleanup is conditional at the final mutation boundary. A guest that
  -- was confirmed or received any newer story/progress activity while the cron
  -- waited is preserved. User-requested deletion passes null and stays
  -- unconditional after the verified owner reaches this function.
  if p_guest_cutoff is not null then
    if v_is_anonymous is distinct from true
      or v_user_created_at >= p_guest_cutoff then
      return false;
    end if;

    perform 1
    from public.sessions owned
    where owned.user_id = p_user_id
      and owned.updated_at > p_guest_cutoff;
    if found then
      return false;
    end if;
  end if;

  -- Force the privacy cascade through the established revocation trigger
  -- before deleting the parent auth row. This removes linked events/outbox
  -- pointers and preserves only bounded opaque capability tombstones.
  delete from public.telemetry_flows flow
  where flow.user_id = p_user_id;

  delete from auth.users
  where id = p_user_id;
  v_deleted := found;

  return v_deleted;
end
$fn$;

revoke all on function public.delete_owned_account_internal_v1(uuid, timestamptz)
  from public, anon, authenticated, service_role;

comment on function public.delete_owned_account_internal_v1(uuid, timestamptz) is
  'Private shared deletion boundary; optional cutoff enables a locked anonymous-account eligibility recheck.';

create or replace function public.delete_owned_account_v1(
  p_user_id uuid
) returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v_deleted boolean;
begin
  select public.delete_owned_account_internal_v1(p_user_id, null)
  into v_deleted;
  return coalesce(v_deleted, false);
end
$fn$;

revoke all on function public.delete_owned_account_v1(uuid)
  from public, anon, authenticated;
grant execute on function public.delete_owned_account_v1(uuid)
  to service_role;

comment on function public.delete_owned_account_v1(uuid) is
  'Hard-deletes one verified auth owner and all FK-owned product data; shared aggregates and editorial records are outside the account graph.';

-- Guest expiry must use the same locks and non-FK cleanup as a user-requested
-- deletion. Keep the existing cron name/schedule from 0003; replacing its
-- function body upgrades the next run without creating a second job.
create or replace function public.delete_stale_anonymous_users(p_ttl interval)
returns void
language plpgsql
set search_path = pg_catalog, public
as $fn$
declare
  v_user_id uuid;
  v_cutoff timestamptz := statement_timestamp() - p_ttl;
begin
  if p_ttl is null or p_ttl <= interval '0 seconds' then
    raise exception 'anonymous user ttl must be positive';
  end if;

  -- This first pass is only a bounded candidate scan. Every eligibility fact
  -- is re-read under the same deletion locks below; a guest can become
  -- permanent or active while waiting behind an earlier candidate.
  for v_user_id in
    select guest.id
    from auth.users guest
    where guest.is_anonymous is true
      and guest.created_at < v_cutoff
      and not exists (
        select 1
        from public.sessions owned
        where owned.user_id = guest.id
          and owned.updated_at > v_cutoff
      )
    order by guest.id
  loop
    perform public.delete_owned_account_internal_v1(v_user_id, v_cutoff);
  end loop;
end
$fn$;

revoke all on function public.delete_stale_anonymous_users(interval)
  from public, anon, authenticated;

-- Renamed RPC implementations change function OIDs. Supabase PostgREST listens
-- for this transaction-commit notification and refreshes its callable schema;
-- until then the revoked old OIDs fail closed for service_role.
notify pgrst, 'reload schema';
