-- Onward — Auth ownership, rate limits, retention, migration 0003
-- Apply by pasting into the Supabase SQL editor (runs as postgres). Run-once.
--
-- Prereqs (dashboard, BEFORE running this file):
--   1. Database → Extensions → enable pg_cron.
--   2. Verify the postgres role may delete auth users (Supabase's documented
--      anonymous-cleanup pattern):  delete from auth.users where false;
--      It must run without a permission error.
--
-- Rule amendment recorded with this migration: the browser talks to Supabase
-- AUTH endpoints only, with the public anon key. The data plane stays
-- server-only via the service-role key; RLS remains default-deny with no
-- policies, so the anon key can read no tables.

-- ── sessions: ownership + activity timestamp ────────────────────────────────
-- DESTRUCTIVE ON PURPOSE: existing rows are pre-auth dev/test data and
-- user_id lands NOT NULL.
delete from sessions;

alter table sessions
  add column user_id uuid not null references auth.users (id) on delete cascade,
  add column updated_at timestamptz not null default now();
-- updated_at is bumped by the app on every progress write (lib/session-store-
-- supabase.ts), not by trigger — it is the "last activity" signal for the
-- guest-TTL job below.

create index sessions_user_id_created_at_idx
  on sessions (user_id, created_at desc);
-- Serves the /stories listing, the cascade lookup on user delete, and the
-- NOT EXISTS activity probe in delete_stale_anonymous_users().

-- ── rate_limits: fixed-window counters (durable across serverless) ─────────
-- One row per (key, window length, window start). Keys: 'u:<user uuid>' and
-- 'ip:<sha256 hex>' — raw IPs never reach this table. Denied attempts also
-- count (hammering while blocked earns no fresh budget within the window).
create table if not exists rate_limits (
  bucket_key     text        not null,
  window_seconds int         not null,
  window_start   timestamptz not null,
  request_count  int         not null default 0,
  primary key (bucket_key, window_seconds, window_start),
  constraint rate_limits_window_check check (window_seconds in (3600, 86400))
);

alter table rate_limits enable row level security;
-- No policies: default-deny for anon/authenticated. Only the service-role
-- server path (lib/rate-limit.ts → rpc) touches this table.

-- Atomic consume: upserts all four counters (user×hour, user×day, ip×hour,
-- ip×day) and returns true iff every counter is within its max. One RPC round
-- trip; concurrency-safe via row-level upsert locks. Hour windows align to
-- clock hours, day windows to UTC midnight (fixed windows, not rolling).
-- Limit values are passed in from lib/rate-limit.ts#MATCH_LIMITS.
create or replace function consume_rate_limit(
  p_user_key      text,
  p_ip_key        text,
  p_user_hour_max int,
  p_user_day_max  int,
  p_ip_hour_max   int,
  p_ip_day_max    int
) returns boolean
language plpgsql
set search_path = public
as $fn$
declare
  v_hour_start timestamptz := date_trunc('hour', now());
  v_day_start  timestamptz := date_trunc('day',  now());
  v_user_hour int; v_user_day int; v_ip_hour int; v_ip_day int;
begin
  insert into rate_limits as r (bucket_key, window_seconds, window_start, request_count)
  values (p_user_key, 3600, v_hour_start, 1)
  on conflict (bucket_key, window_seconds, window_start)
    do update set request_count = r.request_count + 1
  returning r.request_count into v_user_hour;

  insert into rate_limits as r (bucket_key, window_seconds, window_start, request_count)
  values (p_user_key, 86400, v_day_start, 1)
  on conflict (bucket_key, window_seconds, window_start)
    do update set request_count = r.request_count + 1
  returning r.request_count into v_user_day;

  insert into rate_limits as r (bucket_key, window_seconds, window_start, request_count)
  values (p_ip_key, 3600, v_hour_start, 1)
  on conflict (bucket_key, window_seconds, window_start)
    do update set request_count = r.request_count + 1
  returning r.request_count into v_ip_hour;

  insert into rate_limits as r (bucket_key, window_seconds, window_start, request_count)
  values (p_ip_key, 86400, v_day_start, 1)
  on conflict (bucket_key, window_seconds, window_start)
    do update set request_count = r.request_count + 1
  returning r.request_count into v_ip_day;

  return v_user_hour <= p_user_hour_max
     and v_user_day  <= p_user_day_max
     and v_ip_hour   <= p_ip_hour_max
     and v_ip_day    <= p_ip_day_max;
end
$fn$;

revoke all on function consume_rate_limit(text, text, int, int, int, int) from public;
revoke all on function consume_rate_limit(text, text, int, int, int, int) from anon, authenticated;
grant execute on function consume_rate_limit(text, text, int, int, int, int) to service_role;

-- ── retention: stale anonymous users ────────────────────────────────────────
-- Guests are deleted TTL after their last reading activity; deleting the auth
-- user cascades to public.sessions via sessions_user_id_fkey. Linking an email
-- flips is_anonymous to false, which exempts the user permanently. (A guest
-- who requested an email link but never confirmed is still anonymous and is
-- deleted at TTL — accepted edge; activity restarts the clock.)
create or replace function delete_stale_anonymous_users(p_ttl interval)
returns void
language sql
as $fn$
  delete from auth.users u
  where u.is_anonymous is true
    and u.created_at < now() - p_ttl
    and not exists (
      select 1
      from public.sessions s
      where s.user_id = u.id
        and s.updated_at > now() - p_ttl
    );
$fn$;

revoke all on function delete_stale_anonymous_users(interval) from public;
revoke all on function delete_stale_anonymous_users(interval) from anon, authenticated;

-- ── pg_cron schedules (pg_cron runs in UTC) ─────────────────────────────────
create extension if not exists pg_cron;

-- (a) Ephemeral guests, every 30 minutes. TTL = 6 hours. Live copy of the TTL;
--     lib/match-config.ts#ANON_USER_TTL_HOURS documents it — keep in sync.
select cron.schedule(
  'onward-delete-stale-anon-users',
  '*/30 * * * *',
  $job$ select delete_stale_anonymous_users(interval '6 hours') $job$
);

-- (b) Disclosure retention: NULL feelings 60 days after creation, daily.
--     Mirrors lib/match-config.ts#FEELING_RETENTION_DAYS — keep in sync.
select cron.schedule(
  'onward-null-feelings-60d',
  '17 3 * * *',
  $job$
    update public.sessions
    set feeling = null
    where feeling is not null
      and created_at < now() - interval '60 days'
  $job$
);

-- (c) Rate-limit hygiene: drop windows older than 2 days.
select cron.schedule(
  'onward-prune-rate-limits',
  '23 4 * * *',
  $job$ delete from public.rate_limits where window_start < now() - interval '2 days' $job$
);
