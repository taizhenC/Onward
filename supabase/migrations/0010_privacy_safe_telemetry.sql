-- Privacy-safe launch telemetry. Both streams are deliberately flat and
-- string-hostile: there is no JSONB payload, metadata bag, user/session ID,
-- story identity, free text, semantic tag, candidate list, or exception body.

create table public.product_events (
  event_id text primary key check (
    event_id ~ '^tev_[0-9a-f]{16}_[0-9a-f]{32}_[0-9a-f]{64}$'
  ),
  schema_version text not null check (
    schema_version = 'product-event-v1-2026-07'
  ),
  flow_id text check (
    flow_id ~ '^tfl_[0-9a-f]{16}_[0-9a-f]{32}_[0-9a-f]{64}$'
  ),
  event_name text not null check (event_name in (
    'landing_cta_clicked', 'intake_started', 'intake_submitted',
    'auth_established', 'crisis_intercepted', 'rate_limited',
    'match_completed', 'clarification_shown', 'artifact_created',
    'first_content_shown', 'passage_presented', 'passage_acknowledged',
    'story_completed',
    'source_opened', 'feedback_submitted', 'alternate_requested',
    'alternate_resolved', 'story_saved', 'saved_story_reopened',
    'deletion_requested', 'deletion_completed', 'flow_failed'
  )),

  surface text check (surface = 'home_primary'),
  viewport_bucket text check (viewport_bucket in ('small', 'large')),
  auth_method text check (auth_method in (
    'anonymous', 'email_link', 'password'
  )),
  rate_operation text check (rate_operation in (
    'intake', 'feedback', 'alternate_story', 'historical_concern', 'auth'
  )),
  limit_scope text check (limit_scope in ('user', 'ip')),
  recipe_id text check (
    recipe_id = 'keyword-rerank-figure-library-50-2026-07-02'
  ),
  story_role text check (story_role in ('initial', 'alternate')),
  match_disposition text check (match_disposition in (
    'close', 'adjacent', 'clarification_required', 'no_close_match'
  )),
  confidence_bucket text check (confidence_bucket in (
    'high', 'medium', 'low', 'not_applicable'
  )),
  match_path text check (match_path in (
    'rerank', 'keyword_fallback', 'not_run'
  )),
  age_fallback boolean,
  boundary_outcome text check (boundary_outcome in (
    'not_set', 'passed', 'no_eligible'
  )),
  policy_version text check (
    policy_version = 'match-recovery-v1-2026-07'
  ),
  composition_mode text check (composition_mode in (
    'hybrid', 'canonical_fallback'
  )),
  fallback_reason text check (fallback_reason in (
    'none', 'canonical_only', 'provider_timeout', 'provider_error',
    'provider_output_invalid', 'validator_rejected'
  )),
  attempt_bucket text check (attempt_bucket in (
    'not_attempted', 'first', 'retry', 'exhausted'
  )),
  latency_bucket text check (latency_bucket in (
    'lt250ms', '250to500ms', '500ms_to1s', '1to3s', '3to6s',
    '6to8s', '8to15s', 'gt15s'
  )),
  passage_ordinal int check (passage_ordinal between 0 and 63),
  feedback_verdict text check (feedback_verdict in (
    'felt_close', 'not_close'
  )),
  alternate_outcome text check (alternate_outcome in (
    'ready', 'unavailable', 'expired', 'exhausted', 'failed'
  )),
  reopen_age_bucket text check (reopen_age_bucket in ('lt7d', '7to30d')),
  deletion_id text check (
    deletion_id ~ '^tdl_[0-9a-f]{16}_[0-9a-f]{32}_[0-9a-f]{64}$'
  ),
  deletion_scope text check (deletion_scope in ('story', 'account')),
  ok boolean,
  error_domain text check (error_domain in (
    'auth', 'database', 'matching', 'composition', 'reader', 'feedback',
    'alternate', 'deletion'
  )),
  error_class text check (error_class in (
    'not_configured', 'timeout', 'rate_limited', 'unauthorized', 'network',
    'upstream', 'invalid_output', 'validation_rejected', 'database',
    'conflict', 'unknown'
  )),
  status_bucket text check (status_bucket in (
    'invalid_request', 'unauthorized', 'rate_limited', 'upstream', 'timeout',
    'network', 'not_applicable'
  )),
  occurred_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days'),

  check (expires_at > occurred_at),
  check (expires_at <= occurred_at + interval '30 days'),
  check (
    (
      event_name in (
        'crisis_intercepted', 'rate_limited', 'deletion_requested',
        'deletion_completed'
      )
      and flow_id is null
    ) or (
      event_name not in (
        'crisis_intercepted', 'rate_limited', 'deletion_requested',
        'deletion_completed'
      )
      and flow_id is not null
    )
  ),
  check (
    (
      event_name in ('deletion_requested', 'deletion_completed')
      and deletion_id is not null
    ) or (
      event_name not in ('deletion_requested', 'deletion_completed')
      and deletion_id is null
    )
  ),
  check (ok is null),
  constraint product_events_exact_shape check (
    case event_name
      when 'landing_cta_clicked' then
        surface = 'home_primary' and num_nonnulls(
          surface, viewport_bucket, auth_method, rate_operation, limit_scope,
          recipe_id, story_role, match_disposition, confidence_bucket,
          match_path, age_fallback, boundary_outcome, policy_version,
          composition_mode, fallback_reason, attempt_bucket, latency_bucket,
          passage_ordinal, feedback_verdict, alternate_outcome,
          reopen_age_bucket, deletion_scope, ok, error_domain, error_class,
          status_bucket
        ) = 1
      when 'intake_started' then
        viewport_bucket is not null and num_nonnulls(
          surface, viewport_bucket, auth_method, rate_operation, limit_scope,
          recipe_id, story_role, match_disposition, confidence_bucket,
          match_path, age_fallback, boundary_outcome, policy_version,
          composition_mode, fallback_reason, attempt_bucket, latency_bucket,
          passage_ordinal, feedback_verdict, alternate_outcome,
          reopen_age_bucket, deletion_scope, ok, error_domain, error_class,
          status_bucket
        ) = 1
      when 'intake_submitted' then num_nonnulls(
        surface, viewport_bucket, auth_method, rate_operation, limit_scope,
        recipe_id, story_role, match_disposition, confidence_bucket,
        match_path, age_fallback, boundary_outcome, policy_version,
        composition_mode, fallback_reason, attempt_bucket, latency_bucket,
        passage_ordinal, feedback_verdict, alternate_outcome,
        reopen_age_bucket, deletion_scope, ok, error_domain, error_class,
        status_bucket
      ) = 0
      when 'auth_established' then
        auth_method is not null and num_nonnulls(
          surface, viewport_bucket, auth_method, rate_operation, limit_scope,
          recipe_id, story_role, match_disposition, confidence_bucket,
          match_path, age_fallback, boundary_outcome, policy_version,
          composition_mode, fallback_reason, attempt_bucket, latency_bucket,
          passage_ordinal, feedback_verdict, alternate_outcome,
          reopen_age_bucket, deletion_scope, ok, error_domain, error_class,
          status_bucket
        ) = 1
      when 'crisis_intercepted' then num_nonnulls(
        surface, viewport_bucket, auth_method, rate_operation, limit_scope,
        recipe_id, story_role, match_disposition, confidence_bucket,
        match_path, age_fallback, boundary_outcome, policy_version,
        composition_mode, fallback_reason, attempt_bucket, latency_bucket,
        passage_ordinal, feedback_verdict, alternate_outcome,
        reopen_age_bucket, deletion_scope, ok, error_domain, error_class,
        status_bucket
      ) = 0
      when 'rate_limited' then
        rate_operation is not null and limit_scope is not null and
        num_nonnulls(
          surface, viewport_bucket, auth_method, rate_operation, limit_scope,
          recipe_id, story_role, match_disposition, confidence_bucket,
          match_path, age_fallback, boundary_outcome, policy_version,
          composition_mode, fallback_reason, attempt_bucket, latency_bucket,
          passage_ordinal, feedback_verdict, alternate_outcome,
          reopen_age_bucket, deletion_scope, ok, error_domain, error_class,
          status_bucket
        ) = 2
      when 'match_completed' then
        recipe_id is not null and story_role is not null and
        match_disposition is not null and confidence_bucket is not null and
        match_path is not null and age_fallback is not null and
        boundary_outcome is not null and
        (
          (
            match_disposition = 'close' and confidence_bucket = 'high'
            and age_fallback is false and boundary_outcome <> 'no_eligible'
            and story_role = 'initial' and match_path <> 'not_run'
          )
          or (
            match_disposition = 'adjacent'
            and confidence_bucket in ('high', 'medium', 'low')
            and boundary_outcome <> 'no_eligible' and match_path <> 'not_run'
          )
          or (
            match_disposition = 'clarification_required'
            and story_role = 'initial'
            and confidence_bucket in ('medium', 'low')
            and boundary_outcome <> 'no_eligible' and match_path <> 'not_run'
          )
          or (
            match_disposition = 'no_close_match'
            and (
              (
                confidence_bucket = 'not_applicable'
                and boundary_outcome = 'no_eligible' and match_path = 'not_run'
              )
              or (
                confidence_bucket in ('medium', 'low')
                and boundary_outcome <> 'no_eligible' and match_path <> 'not_run'
              )
            )
          )
        ) and num_nonnulls(
          surface, viewport_bucket, auth_method, rate_operation, limit_scope,
          recipe_id, story_role, match_disposition, confidence_bucket,
          match_path, age_fallback, boundary_outcome, policy_version,
          composition_mode, fallback_reason, attempt_bucket, latency_bucket,
          passage_ordinal, feedback_verdict, alternate_outcome,
          reopen_age_bucket, deletion_scope, ok, error_domain, error_class,
          status_bucket
        ) = 7
      when 'clarification_shown' then
        policy_version is not null and num_nonnulls(
          surface, viewport_bucket, auth_method, rate_operation, limit_scope,
          recipe_id, story_role, match_disposition, confidence_bucket,
          match_path, age_fallback, boundary_outcome, policy_version,
          composition_mode, fallback_reason, attempt_bucket, latency_bucket,
          passage_ordinal, feedback_verdict, alternate_outcome,
          reopen_age_bucket, deletion_scope, ok, error_domain, error_class,
          status_bucket
        ) = 1
      when 'artifact_created' then
        recipe_id is not null and story_role is not null and
        composition_mode is not null and fallback_reason is not null and
        attempt_bucket is not null and
        (
          (
            composition_mode = 'hybrid' and fallback_reason = 'none'
            and attempt_bucket in ('first', 'retry')
          )
          or (
            composition_mode = 'canonical_fallback'
            and fallback_reason = 'canonical_only'
            and attempt_bucket = 'not_attempted'
          )
          or (
            composition_mode = 'canonical_fallback'
            and fallback_reason not in ('none', 'canonical_only')
            and attempt_bucket = 'exhausted'
          )
          or (
            composition_mode = 'canonical_fallback'
            and fallback_reason = 'validator_rejected'
            and attempt_bucket = 'not_attempted'
          )
        ) and num_nonnulls(
          surface, viewport_bucket, auth_method, rate_operation, limit_scope,
          recipe_id, story_role, match_disposition, confidence_bucket,
          match_path, age_fallback, boundary_outcome, policy_version,
          composition_mode, fallback_reason, attempt_bucket, latency_bucket,
          passage_ordinal, feedback_verdict, alternate_outcome,
          reopen_age_bucket, deletion_scope, ok, error_domain, error_class,
          status_bucket
        ) = 5
      when 'first_content_shown' then
        story_role is not null and latency_bucket is not null and
        num_nonnulls(
          surface, viewport_bucket, auth_method, rate_operation, limit_scope,
          recipe_id, story_role, match_disposition, confidence_bucket,
          match_path, age_fallback, boundary_outcome, policy_version,
          composition_mode, fallback_reason, attempt_bucket, latency_bucket,
          passage_ordinal, feedback_verdict, alternate_outcome,
          reopen_age_bucket, deletion_scope, ok, error_domain, error_class,
          status_bucket
        ) = 2
      when 'passage_acknowledged' then
        story_role is not null and passage_ordinal is not null and
        num_nonnulls(
          surface, viewport_bucket, auth_method, rate_operation, limit_scope,
          recipe_id, story_role, match_disposition, confidence_bucket,
          match_path, age_fallback, boundary_outcome, policy_version,
          composition_mode, fallback_reason, attempt_bucket, latency_bucket,
          passage_ordinal, feedback_verdict, alternate_outcome,
          reopen_age_bucket, deletion_scope, ok, error_domain, error_class,
          status_bucket
        ) = 2
      when 'passage_presented' then
        story_role is not null and passage_ordinal is not null and
        latency_bucket is not null and num_nonnulls(
          surface, viewport_bucket, auth_method, rate_operation, limit_scope,
          recipe_id, story_role, match_disposition, confidence_bucket,
          match_path, age_fallback, boundary_outcome, policy_version,
          composition_mode, fallback_reason, attempt_bucket, latency_bucket,
          passage_ordinal, feedback_verdict, alternate_outcome,
          reopen_age_bucket, deletion_scope, ok, error_domain, error_class,
          status_bucket
        ) = 3
      when 'story_completed' then
        story_role is not null and num_nonnulls(
          surface, viewport_bucket, auth_method, rate_operation, limit_scope,
          recipe_id, story_role, match_disposition, confidence_bucket,
          match_path, age_fallback, boundary_outcome, policy_version,
          composition_mode, fallback_reason, attempt_bucket, latency_bucket,
          passage_ordinal, feedback_verdict, alternate_outcome,
          reopen_age_bucket, deletion_scope, ok, error_domain, error_class,
          status_bucket
        ) = 1
      when 'source_opened' then
        story_role is not null and num_nonnulls(
          surface, viewport_bucket, auth_method, rate_operation, limit_scope,
          recipe_id, story_role, match_disposition, confidence_bucket,
          match_path, age_fallback, boundary_outcome, policy_version,
          composition_mode, fallback_reason, attempt_bucket, latency_bucket,
          passage_ordinal, feedback_verdict, alternate_outcome,
          reopen_age_bucket, deletion_scope, ok, error_domain, error_class,
          status_bucket
        ) = 1
      when 'feedback_submitted' then
        story_role is not null and feedback_verdict is not null and
        num_nonnulls(
          surface, viewport_bucket, auth_method, rate_operation, limit_scope,
          recipe_id, story_role, match_disposition, confidence_bucket,
          match_path, age_fallback, boundary_outcome, policy_version,
          composition_mode, fallback_reason, attempt_bucket, latency_bucket,
          passage_ordinal, feedback_verdict, alternate_outcome,
          reopen_age_bucket, deletion_scope, ok, error_domain, error_class,
          status_bucket
        ) = 2
      when 'alternate_requested' then num_nonnulls(
        surface, viewport_bucket, auth_method, rate_operation, limit_scope,
        recipe_id, story_role, match_disposition, confidence_bucket,
        match_path, age_fallback, boundary_outcome, policy_version,
        composition_mode, fallback_reason, attempt_bucket, latency_bucket,
        passage_ordinal, feedback_verdict, alternate_outcome,
        reopen_age_bucket, deletion_scope, ok, error_domain, error_class,
        status_bucket
      ) = 0
      when 'alternate_resolved' then
        alternate_outcome is not null and num_nonnulls(
          surface, viewport_bucket, auth_method, rate_operation, limit_scope,
          recipe_id, story_role, match_disposition, confidence_bucket,
          match_path, age_fallback, boundary_outcome, policy_version,
          composition_mode, fallback_reason, attempt_bucket, latency_bucket,
          passage_ordinal, feedback_verdict, alternate_outcome,
          reopen_age_bucket, deletion_scope, ok, error_domain, error_class,
          status_bucket
        ) = 1
      when 'story_saved' then
        story_role is not null and num_nonnulls(
          surface, viewport_bucket, auth_method, rate_operation, limit_scope,
          recipe_id, story_role, match_disposition, confidence_bucket,
          match_path, age_fallback, boundary_outcome, policy_version,
          composition_mode, fallback_reason, attempt_bucket, latency_bucket,
          passage_ordinal, feedback_verdict, alternate_outcome,
          reopen_age_bucket, deletion_scope, ok, error_domain, error_class,
          status_bucket
        ) = 1
      when 'saved_story_reopened' then
        story_role is not null and reopen_age_bucket is not null and
        num_nonnulls(
          surface, viewport_bucket, auth_method, rate_operation, limit_scope,
          recipe_id, story_role, match_disposition, confidence_bucket,
          match_path, age_fallback, boundary_outcome, policy_version,
          composition_mode, fallback_reason, attempt_bucket, latency_bucket,
          passage_ordinal, feedback_verdict, alternate_outcome,
          reopen_age_bucket, deletion_scope, ok, error_domain, error_class,
          status_bucket
        ) = 2
      when 'deletion_requested' then
        deletion_id is not null and deletion_scope is not null and num_nonnulls(
          surface, viewport_bucket, auth_method, rate_operation, limit_scope,
          recipe_id, story_role, match_disposition, confidence_bucket,
          match_path, age_fallback, boundary_outcome, policy_version,
          composition_mode, fallback_reason, attempt_bucket, latency_bucket,
          passage_ordinal, feedback_verdict, alternate_outcome,
          reopen_age_bucket, deletion_scope, ok, error_domain, error_class,
          status_bucket
        ) = 1
      when 'deletion_completed' then
        deletion_id is not null and deletion_scope is not null
        and latency_bucket is not null
        and num_nonnulls(
          surface, viewport_bucket, auth_method, rate_operation, limit_scope,
          recipe_id, story_role, match_disposition, confidence_bucket,
          match_path, age_fallback, boundary_outcome, policy_version,
          composition_mode, fallback_reason, attempt_bucket, latency_bucket,
          passage_ordinal, feedback_verdict, alternate_outcome,
          reopen_age_bucket, deletion_scope, ok, error_domain, error_class,
          status_bucket
        ) = 2
      when 'flow_failed' then
        error_domain is not null and error_class is not null and
        status_bucket is not null and latency_bucket is not null and
        num_nonnulls(
          surface, viewport_bucket, auth_method, rate_operation, limit_scope,
          recipe_id, story_role, match_disposition, confidence_bucket,
          match_path, age_fallback, boundary_outcome, policy_version,
          composition_mode, fallback_reason, attempt_bucket, latency_bucket,
          passage_ordinal, feedback_verdict, alternate_outcome,
          reopen_age_bucket, deletion_scope, ok, error_domain, error_class,
          status_bucket
        ) = 4
      else false
    end
  )
);

create index product_events_name_time_idx
  on public.product_events (event_name, occurred_at desc);
create index product_events_flow_time_idx
  on public.product_events (flow_id, occurred_at)
  where flow_id is not null;
create index product_events_expiry_idx
  on public.product_events (expires_at);

create table public.generation_attempts (
  attempt_id text primary key check (
    attempt_id ~ '^gat_[0-9a-f]{16}_[0-9a-f]{32}_[0-9a-f]{64}$'
  ),
  schema_version text not null check (
    schema_version = 'generation-attempt-v1-2026-07'
  ),
  operation text not null check (operation in (
    'catalog', 'embedding', 'rerank', 'compose', 'validate', 'persist'
  )),
  recipe_id text not null check (
    recipe_id = 'keyword-rerank-figure-library-50-2026-07-02'
  ),
  provider text not null check (provider in (
    'internal', 'cerebras', 'gemini', 'supabase'
  )),
  outcome text not null check (outcome in ('success', 'fallback', 'failure')),
  attempt text not null check (attempt in ('first', 'retry')),
  latency_bucket text not null check (latency_bucket in (
    'lt250ms', '250to500ms', '500ms_to1s', '1to3s', '3to6s',
    '6to8s', '8to15s', 'gt15s'
  )),
  status_bucket text not null check (status_bucket in (
    'ok', 'invalid_request', 'unauthorized', 'rate_limited', 'upstream',
    'timeout', 'network', 'not_applicable'
  )),
  error_class text not null check (error_class in (
    'none', 'not_configured', 'timeout', 'rate_limited', 'unauthorized',
    'network', 'upstream', 'invalid_output', 'validation_rejected',
    'database', 'conflict', 'unknown'
  )),
  fallback_reason text not null check (fallback_reason in (
    'none', 'canonical_only', 'provider_timeout', 'provider_error',
    'provider_output_invalid', 'validator_rejected'
  )),
  validation_outcome text not null check (validation_outcome in (
    'not_run', 'passed', 'schema_rejected', 'evidence_rejected',
    'privacy_rejected', 'tone_rejected', 'boundary_rejected', 'other_rejected'
  )),
  cost_micros int not null check (cost_micros between 0 and 10000000),
  occurred_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '14 days'),
  check (expires_at > occurred_at),
  check (expires_at <= occurred_at + interval '14 days'),
  check (
    (outcome = 'success' and status_bucket = 'ok' and error_class = 'none'
      and fallback_reason = 'none'
      and validation_outcome in ('not_run', 'passed')
      and (operation <> 'validate' or validation_outcome = 'passed'))
    or (
      outcome = 'fallback' and fallback_reason = 'canonical_only'
      and status_bucket = 'not_applicable' and error_class = 'none'
      and validation_outcome in ('not_run', 'passed')
    )
    or (
      outcome = 'fallback' and fallback_reason not in ('none', 'canonical_only')
      and status_bucket <> 'ok' and error_class <> 'none'
      and (
        (
          fallback_reason = 'validator_rejected'
          and error_class = 'validation_rejected'
          and validation_outcome not in ('not_run', 'passed')
        )
        or (
          fallback_reason = 'provider_output_invalid'
          and error_class = 'invalid_output'
          and validation_outcome = 'schema_rejected'
        )
        or (
          fallback_reason in ('provider_timeout', 'provider_error')
          and error_class not in ('validation_rejected', 'invalid_output')
          and validation_outcome = 'not_run'
        )
      )
    )
    or (
      outcome = 'failure' and fallback_reason = 'none'
      and error_class <> 'none' and status_bucket <> 'ok'
      and (
        (
          error_class = 'validation_rejected'
          and validation_outcome not in ('not_run', 'passed')
        )
        or (
          error_class = 'invalid_output'
          and validation_outcome = 'schema_rejected'
        )
        or (
          error_class not in ('validation_rejected', 'invalid_output')
          and validation_outcome in ('not_run', 'passed')
        )
      )
    )
  )
);

create index generation_attempts_operation_time_idx
  on public.generation_attempts (operation, outcome, occurred_at desc);
create index generation_attempts_expiry_idx
  on public.generation_attempts (expires_at);

alter table public.product_events enable row level security;
alter table public.product_events force row level security;
alter table public.generation_attempts enable row level security;
alter table public.generation_attempts force row level security;

revoke all on table public.product_events from public, anon, authenticated;
revoke all on table public.generation_attempts from public, anon, authenticated;
revoke all on table public.product_events from service_role;
revoke all on table public.generation_attempts from service_role;
grant select, insert, delete on table public.product_events to service_role;
grant select, insert, delete on table public.generation_attempts to service_role;

create or replace function public.reject_telemetry_update()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $fn$
begin
  raise exception 'Telemetry rows are immutable';
end
$fn$;

create trigger product_events_immutable
before update on public.product_events
for each row execute function public.reject_telemetry_update();
create trigger generation_attempts_immutable
before update on public.generation_attempts
for each row execute function public.reject_telemetry_update();
revoke all on function public.reject_telemetry_update()
  from public, anon, authenticated;

create or replace function public.set_telemetry_retention_window()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $fn$
begin
  new.occurred_at := statement_timestamp();
  if tg_table_name = 'product_events' then
    new.expires_at := new.occurred_at + interval '30 days';
  elsif tg_table_name = 'generation_attempts' then
    new.expires_at := new.occurred_at + interval '14 days';
  else
    raise exception 'Unexpected telemetry table';
  end if;
  return new;
end
$fn$;

create trigger product_events_retention_window
before insert on public.product_events
for each row execute function public.set_telemetry_retention_window();
create trigger generation_attempts_retention_window
before insert on public.generation_attempts
for each row execute function public.set_telemetry_retention_window();
revoke all on function public.set_telemetry_retention_window()
  from public, anon, authenticated;

create or replace function public.delete_expired_telemetry()
returns void
language sql
security definer
set search_path = pg_catalog, public
as $fn$
  delete from public.product_events where expires_at <= now();
  delete from public.generation_attempts where expires_at <= now();
$fn$;

revoke all on function public.delete_expired_telemetry()
  from public, anon, authenticated;
grant execute on function public.delete_expired_telemetry() to service_role;

select cron.schedule(
  'onward-privacy-safe-telemetry-cleanup',
  '53 3 * * *',
  $$select public.delete_expired_telemetry();$$
);
