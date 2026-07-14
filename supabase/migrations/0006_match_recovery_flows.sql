-- Single-use, short-lived credits for one-question/no-close-match recovery.
-- Stores only keyed fingerprints and opaque-token hashes: never disclosure,
-- clarification values, boundary values, candidate IDs, or generated prose.

create table match_recovery_flows (
  token_hash text primary key check (token_hash ~ '^[0-9a-f]{64}$'),
  user_id uuid not null references auth.users (id) on delete cascade,
  input_hash text not null check (input_hash ~ '^[0-9a-f]{64}$'),
  purpose text not null check (purpose in ('clarification', 'adjacent_acceptance')),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  check (expires_at > created_at),
  check (consumed_at is null or consumed_at >= created_at)
);

create index match_recovery_flows_expiry_idx
  on match_recovery_flows (expires_at);
create index match_recovery_flows_user_idx
  on match_recovery_flows (user_id, created_at desc);

alter table match_recovery_flows enable row level security;
revoke all on table match_recovery_flows from public, anon, authenticated;
revoke update, delete on table match_recovery_flows from service_role;
grant select, insert on table match_recovery_flows to service_role;

create or replace function consume_match_recovery_flow(
  p_token_hash text,
  p_user_id uuid,
  p_input_hash text
) returns text
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_purpose text;
begin
  update match_recovery_flows
  set consumed_at = now()
  where token_hash = p_token_hash
    and user_id = p_user_id
    and input_hash = p_input_hash
    and consumed_at is null
    and expires_at > now()
  returning purpose into v_purpose;

  return v_purpose;
end;
$fn$;

revoke all on function consume_match_recovery_flow(text, uuid, text)
  from public, anon, authenticated;
grant execute on function consume_match_recovery_flow(text, uuid, text)
  to service_role;

create or replace function delete_expired_match_recovery_flows()
returns void
language sql
security definer
set search_path = public
as $fn$
  delete from match_recovery_flows where expires_at <= now();
$fn$;

revoke all on function delete_expired_match_recovery_flows()
  from public, anon, authenticated;
grant execute on function delete_expired_match_recovery_flows()
  to service_role;

select cron.schedule(
  'onward-match-recovery-cleanup',
  '*/15 * * * *',
  $$select public.delete_expired_match_recovery_flows();$$
);
