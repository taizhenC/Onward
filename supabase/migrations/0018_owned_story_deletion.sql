-- Onward - owner-scoped story deletion, migration 0018.
--
-- One privacy boundary serializes against alternate generation, retires the
-- shared raw telemetry flow, and hard-deletes the requested story. Deleting a
-- root cascades its alternate; deleting only an alternate preserves the root
-- content but still retires their shared raw telemetry family. Identifier-free
-- rollups already settled before deletion are deliberately not decremented.

create or replace function public.delete_owned_story_v1(
  p_user_id uuid,
  p_session_id text
) returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v_root_session_id text;
  v_confirmed_root_session_id text;
  v_deleted_count integer;
begin
  if p_user_id is null
    or p_session_id is null
    or p_session_id !~ '^[0-9a-f]{32}$' then
    return false;
  end if;

  -- This first owner-scoped read is intentionally unlocked: it discovers the
  -- immutable lineage key used by every alternate-flow transaction.
  select coalesce(target.alternate_of_session_id, target.session_id)
  into v_root_session_id
  from public.sessions target
  where target.session_id = p_session_id
    and target.user_id = p_user_id;
  if not found then return false; end if;

  -- Match the lock used by issue/claim/finalize alternate RPCs, then lock the
  -- complete existing family before touching its shared telemetry row. Reader
  -- progress and feedback lock one session before taking a flow SHARE lock;
  -- taking the flow first here would deadlock against an alternate reader while
  -- the root cascade waited for that alternate. Deterministic family ordering
  -- also makes two future multi-child implementations safe.
  perform pg_advisory_xact_lock(hashtextextended(v_root_session_id, 0));

  perform 1
  from public.sessions family
  where family.user_id = p_user_id
    and (
      family.session_id = v_root_session_id
      or family.alternate_of_session_id = v_root_session_id
    )
  order by family.session_id
  for update;

  perform 1
  from public.sessions root
  where root.session_id = v_root_session_id
    and root.user_id = p_user_id;
  if not found then return false; end if;

  select coalesce(target.alternate_of_session_id, target.session_id)
  into v_confirmed_root_session_id
  from public.sessions target
  where target.session_id = p_session_id
    and target.user_id = p_user_id;
  if not found
    or v_confirmed_root_session_id is distinct from v_root_session_id then
    return false;
  end if;

  -- Initial and alternate events share one flow, including role-less recovery
  -- events. Retire the entire still-linkable family for either story scope.
  -- The existing BEFORE DELETE trigger preserves only the opaque bounded
  -- revocation tombstone and the FK cascade removes events/outbox pointers.
  perform 1
  from public.telemetry_flows flow
  where flow.root_session_id = v_root_session_id
    and flow.user_id = p_user_id
  for update;

  delete from public.telemetry_flows flow
  where flow.root_session_id = v_root_session_id
    and flow.user_id = p_user_id;

  delete from public.sessions target
  where target.session_id = p_session_id
    and target.user_id = p_user_id;
  get diagnostics v_deleted_count = row_count;

  return v_deleted_count = 1;
end
$fn$;

revoke all on function public.delete_owned_story_v1(uuid, text)
  from public, anon, authenticated;
grant execute on function public.delete_owned_story_v1(uuid, text)
  to service_role;

-- The application service can delete sessions only through the function above.
-- Auth-user cascades and the postgres-owned guest cleanup remain unaffected.
revoke delete on table public.sessions from service_role;

comment on function public.delete_owned_story_v1(uuid, text) is
  'Owner-scoped hard story deletion with root-family raw telemetry retirement.';
