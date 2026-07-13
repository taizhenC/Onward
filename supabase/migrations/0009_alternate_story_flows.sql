-- One-use alternate stories with root-only sensitive request context.
-- The browser sends only an opaque capability. The alternate session stores no
-- disclosure, boundary selection, clarification, ranked candidates, or prose.

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
begin
  if jsonb_typeof(p_context) <> 'object'
    or (select count(*) from jsonb_object_keys(p_context)) <> 3
    or not (p_context ? 'schemaVersion')
    or not (p_context ? 'boundaries')
    or not (p_context ? 'clarification')
    or p_context ->> 'schemaVersion'
      is distinct from 'story-request-context-v1-2026-07' then
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

create or replace function public.story_content_allowed_by_context(
  p_context jsonb,
  p_content_profile jsonb
) returns boolean
language plpgsql
immutable
strict
set search_path = pg_catalog, public
as $fn$
declare
  v_boundaries jsonb;
  v_max_rank int;
  v_story_rank int;
  v_flag text;
begin
  if not public.is_valid_story_request_context(p_context) then return false; end if;
  if jsonb_typeof(p_content_profile -> 'flags') is distinct from 'array' then
    return false;
  end if;
  v_story_rank := case p_content_profile ->> 'intensity'
    when 'gentle' then 0 when 'moderate' then 1 when 'direct' then 2 else 99 end;
  if v_story_rank = 99 then return false; end if;
  if exists (
    select 1 from jsonb_array_elements(p_content_profile -> 'flags') item
    where jsonb_typeof(item) is distinct from 'string'
  ) or jsonb_array_length(p_content_profile -> 'flags') <> (
    select count(distinct value)
    from jsonb_array_elements_text(p_content_profile -> 'flags')
  ) then
    return false;
  end if;
  for v_flag in
    select value from jsonb_array_elements_text(p_content_profile -> 'flags')
  loop
    if v_flag is null or v_flag not in (
      'death_or_grief', 'suicide_loss', 'abuse_or_violence', 'addiction',
      'serious_illness', 'discrimination', 'pregnancy_or_parenthood',
      'other_reviewed_flag'
    ) then
      return false;
    end if;
  end loop;
  v_boundaries := p_context -> 'boundaries';
  if v_boundaries = 'null'::jsonb then return true; end if;
  v_max_rank := case v_boundaries ->> 'maxIntensity'
    when 'gentle' then 0 when 'moderate' then 1 when 'direct' then 2 else -1 end;
  if v_story_rank > v_max_rank then return false; end if;
  for v_flag in
    select value from jsonb_array_elements_text(v_boundaries -> 'excludedFlags')
  loop
    if (p_content_profile -> 'flags') @> jsonb_build_array(v_flag) then
      return false;
    end if;
  end loop;
  return true;
exception when others then
  return false;
end
$fn$;

revoke all on function public.story_content_allowed_by_context(jsonb, jsonb)
  from public, anon, authenticated;

alter table public.sessions
  add column story_request_context jsonb,
  add column disclosure_expires_at timestamptz,
  add column alternate_of_session_id text;

update public.sessions
set disclosure_expires_at = created_at + interval '60 days'
where disclosure_expires_at is null;

alter table public.sessions
  alter column age drop not null,
  alter column disclosure_expires_at set default (now() + interval '60 days'),
  alter column disclosure_expires_at set not null,
  add constraint sessions_story_request_context_check check (
    story_request_context is null
    or public.is_valid_story_request_context(story_request_context)
  ),
  add constraint sessions_alternate_shape_check check (
    (alternate_of_session_id is null and age is not null)
    or (
      alternate_of_session_id is not null
      and
      feeling is null
      and age is null
      and story_request_context is null
      and framing = 'partial'
    )
  ),
  add constraint sessions_identity_owner_unique unique (session_id, user_id),
  add constraint sessions_alternate_source_fk foreign key (
    alternate_of_session_id, user_id
  ) references public.sessions (session_id, user_id) on delete cascade;

create unique index sessions_one_alternate_per_source_idx
  on public.sessions (alternate_of_session_id)
  where alternate_of_session_id is not null;
create index sessions_disclosure_expiry_idx
  on public.sessions (disclosure_expires_at)
  where feeling is not null or story_request_context is not null;

create or replace function public.protect_story_request_context()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $fn$
begin
  if new.age is distinct from old.age
    or new.disclosure_expires_at is distinct from old.disclosure_expires_at
    or new.alternate_of_session_id is distinct from old.alternate_of_session_id then
    raise exception 'story request lineage and expiry are immutable';
  end if;
  if new.feeling is distinct from old.feeling
    and not (
      old.feeling is not null
      and new.feeling is null
      and old.disclosure_expires_at <= now()
    ) then
    raise exception 'story disclosure is immutable before expiry';
  end if;
  if new.story_request_context is distinct from old.story_request_context
    and not (
      old.story_request_context is not null
      and new.story_request_context is null
      and old.disclosure_expires_at <= now()
    ) then
    raise exception 'story request context is immutable before expiry';
  end if;
  return new;
end
$fn$;

create trigger sessions_protect_story_request_context
before update of age, feeling, story_request_context, disclosure_expires_at,
  alternate_of_session_id on public.sessions
for each row execute function public.protect_story_request_context();
revoke all on function public.protect_story_request_context()
  from public, anon, authenticated;

-- Keep the old RPC only for the migration -> application rollout window. Its
-- rows receive the original-deadline default but have NULL context and are
-- deliberately ineligible for alternates. The manual rollout cleanup removes
-- it only after the v2 application is live and its rollback window closes.

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
declare
  v_artifact_id text := p_artifact ->> 'artifactId';
  v_story_spec public.story_specs%rowtype;
begin
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

  insert into public.sessions (
    session_id, user_id, figure_key, stage_id, story_artifact_id, framing,
    opening_copy, age, feeling, story_request_context, disclosure_expires_at,
    alternate_of_session_id, match_recipe, next_beat_index, next_chunk_index,
    updated_at
  ) values (
    p_session_id, p_user_id, p_figure_key, p_stage_id, v_artifact_id, p_framing,
    p_artifact -> 'openingCopy', p_age, p_feeling, p_story_request_context,
    now() + interval '60 days', null, p_match_recipe, 0, 0, now()
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
end
$fn$;

revoke all on function public.create_story_session_v2(
  text, uuid, text, text, text, int, text, jsonb, jsonb, jsonb
) from public, anon, authenticated;
grant execute on function public.create_story_session_v2(
  text, uuid, text, text, text, int, text, jsonb, jsonb, jsonb
) to service_role;

create table public.alternate_story_flows (
  source_session_id text primary key
    references public.sessions (session_id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  source_artifact_id text not null
    references public.story_artifacts (artifact_id) on delete cascade,
  token_hash text not null check (token_hash ~ '^[0-9a-f]{64}$'),
  policy_version text not null check (
    policy_version = 'alternate-story-v1-2026-07'
  ),
  status text not null default 'available' check (
    status in ('available', 'preparing', 'ready', 'unavailable')
  ),
  attempt_count int not null default 0 check (attempt_count between 0 and 2),
  lease_id text check (lease_id ~ '^[0-9a-f]{32}$'),
  lease_expires_at timestamptz,
  next_attempt_at timestamptz,
  -- SET NULL preserves a consumed tombstone if a reader later deletes only the
  -- alternate; it must never mint a second free story.
  result_session_id text unique
    references public.sessions (session_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null,
  context_expires_at timestamptz not null,
  completed_at timestamptz,
  check (expires_at <= context_expires_at),
  check (
    (status = 'available' and lease_id is null and lease_expires_at is null
      and result_session_id is null and completed_at is null)
    or (status = 'preparing' and lease_id is not null and lease_expires_at is not null
      and next_attempt_at is null and result_session_id is null and completed_at is null)
    or (status = 'ready' and lease_id is null and lease_expires_at is null
      and next_attempt_at is null and completed_at is not null)
    or (status = 'unavailable' and lease_id is null and lease_expires_at is null
      and next_attempt_at is null and result_session_id is null and completed_at is not null)
  )
);

create index alternate_story_flows_expiry_idx
  on public.alternate_story_flows (context_expires_at);
alter table public.alternate_story_flows enable row level security;
revoke all on table public.alternate_story_flows from public, anon, authenticated;
revoke all on table public.alternate_story_flows from service_role;
grant select on table public.alternate_story_flows to service_role;

create or replace function public.issue_alternate_story_flow(
  p_user_id uuid,
  p_source_session_id text,
  p_source_artifact_id text,
  p_token_hash text,
  p_policy_version text,
  p_allow_create boolean
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v_session public.sessions%rowtype;
  v_artifact public.story_artifacts%rowtype;
  v_flow public.alternate_story_flows%rowtype;
  v_expires_at timestamptz;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_source_session_id, 0));
  select * into v_session from public.sessions
  where session_id = p_source_session_id
    and user_id = p_user_id
    and story_artifact_id = p_source_artifact_id
  for update;
  if not found then return jsonb_build_object('status', 'not_found'); end if;

  select * into v_flow from public.alternate_story_flows
    where source_session_id = p_source_session_id for update;
  if found then
    if v_flow.user_id is distinct from p_user_id
      or v_flow.source_artifact_id is distinct from p_source_artifact_id
      or v_flow.policy_version is distinct from p_policy_version then
      return jsonb_build_object('status', 'not_found');
    end if;
    if v_flow.status = 'ready' and v_flow.result_session_id is not null then
      return jsonb_build_object(
        'status', 'ready', 'sessionId', v_flow.result_session_id
      );
    end if;
    if v_flow.status in ('ready', 'unavailable') then
      return jsonb_build_object('status', 'unavailable');
    end if;
    if v_session.feeling is null or v_session.story_request_context is null then
      return jsonb_build_object('status', 'not_found');
    end if;
    if v_session.disclosure_expires_at <= now() then
      return jsonb_build_object('status', 'expired');
    end if;
    if v_flow.token_hash is distinct from p_token_hash then
      return jsonb_build_object('status', 'expired');
    end if;
    if v_flow.status = 'preparing' and v_flow.lease_expires_at > now() then
      return jsonb_build_object(
        'status', 'preparing',
        'retryAfterMs', ceil(
          extract(epoch from (v_flow.lease_expires_at - now())) * 1000
        )
      );
    end if;
    if v_flow.expires_at <= now() then
      return jsonb_build_object('status', 'expired');
    end if;
    if v_flow.attempt_count >= 2 then
      return jsonb_build_object('status', 'exhausted');
    end if;
    if v_flow.next_attempt_at > now() then
      return jsonb_build_object(
        'status', 'preparing',
        'retryAfterMs', ceil(
          extract(epoch from (v_flow.next_attempt_at - now())) * 1000
        )
      );
    end if;
    return jsonb_build_object(
      'status', 'available', 'expiresAt', v_flow.expires_at
    );
  end if;

  if p_allow_create is distinct from true then
    return jsonb_build_object('status', 'not_found');
  end if;
  if v_session.alternate_of_session_id is not null
    or v_session.feeling is null
    or v_session.story_request_context is null
    or not public.is_valid_story_request_context(v_session.story_request_context)
    or v_session.disclosure_expires_at <= now() then
    return jsonb_build_object('status', 'not_found');
  end if;
  select * into v_artifact from public.story_artifacts
  where artifact_id = p_source_artifact_id
    and session_id = p_source_session_id
    and user_id = p_user_id;
  if not found
    or v_session.next_beat_index < jsonb_array_length(v_artifact.artifact -> 'beats')
    or not exists (
      select 1 from public.story_feedback feedback
      where feedback.session_id = p_source_session_id
        and feedback.user_id = p_user_id
        and feedback.artifact_id = p_source_artifact_id
        and feedback.verdict = 'not_close'
    )
    or p_token_hash !~ '^[0-9a-f]{64}$'
    or p_policy_version <> 'alternate-story-v1-2026-07' then
    return jsonb_build_object('status', 'not_found');
  end if;

  v_expires_at := least(
    v_session.disclosure_expires_at,
    now() + interval '60 minutes'
  );
  insert into public.alternate_story_flows (
    source_session_id, user_id, source_artifact_id, token_hash,
    policy_version, expires_at, context_expires_at
  ) values (
    p_source_session_id, p_user_id, p_source_artifact_id, p_token_hash,
    p_policy_version, v_expires_at, v_session.disclosure_expires_at
  );
  return jsonb_build_object('status', 'available', 'expiresAt', v_expires_at);
end
$fn$;

create or replace function public.claim_alternate_story_flow(
  p_user_id uuid,
  p_source_session_id text,
  p_source_artifact_id text,
  p_token_hash text,
  p_policy_version text,
  p_lease_id text
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v_session public.sessions%rowtype;
  v_artifact public.story_artifacts%rowtype;
  v_flow public.alternate_story_flows%rowtype;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_source_session_id, 0));
  select * into v_session from public.sessions
  where session_id = p_source_session_id and user_id = p_user_id
    and story_artifact_id = p_source_artifact_id for update;
  if not found then return jsonb_build_object('status', 'not_found'); end if;
  select * into v_flow from public.alternate_story_flows
    where source_session_id = p_source_session_id for update;
  if not found
    or v_flow.user_id is distinct from p_user_id
    or v_flow.source_artifact_id is distinct from p_source_artifact_id
    or v_flow.token_hash is distinct from p_token_hash
    or v_flow.policy_version is distinct from p_policy_version
    or p_lease_id !~ '^[0-9a-f]{32}$' then
    return jsonb_build_object('status', 'not_found');
  end if;
  if v_flow.status = 'ready' and v_flow.result_session_id is not null then
    return jsonb_build_object(
      'status', 'ready', 'sessionId', v_flow.result_session_id
    );
  end if;
  if v_flow.status in ('ready', 'unavailable') then
    return jsonb_build_object('status', 'unavailable');
  end if;
  select * into v_artifact from public.story_artifacts
  where artifact_id = p_source_artifact_id and session_id = p_source_session_id
    and user_id = p_user_id;
  if v_session.session_id is null or v_artifact.artifact_id is null
    or v_session.alternate_of_session_id is not null
    or v_session.feeling is null or v_session.story_request_context is null
    or v_session.disclosure_expires_at <= now()
    or v_session.next_beat_index < jsonb_array_length(v_artifact.artifact -> 'beats')
    or not exists (
      select 1 from public.story_feedback feedback
      where feedback.session_id = p_source_session_id
        and feedback.user_id = p_user_id
        and feedback.artifact_id = p_source_artifact_id
        and feedback.verdict = 'not_close'
    ) then
    return jsonb_build_object('status', 'not_found');
  end if;
  if v_flow.status = 'preparing' and v_flow.lease_expires_at > now() then
    return jsonb_build_object(
      'status', 'preparing',
      'retryAfterMs', ceil(
        extract(epoch from (v_flow.lease_expires_at - now())) * 1000
      )
    );
  end if;
  if v_flow.expires_at <= now() then
    return jsonb_build_object('status', 'expired');
  end if;
  if v_flow.attempt_count >= 2 then
    return jsonb_build_object('status', 'exhausted');
  end if;
  if v_flow.next_attempt_at > now() then
    return jsonb_build_object(
      'status', 'cooldown',
      'retryAfterMs', ceil(
        extract(epoch from (v_flow.next_attempt_at - now())) * 1000
      )
    );
  end if;
  update public.alternate_story_flows set
    status = 'preparing', attempt_count = attempt_count + 1,
    lease_id = p_lease_id, lease_expires_at = now() + interval '2 minutes',
    next_attempt_at = null, updated_at = now()
  where source_session_id = p_source_session_id;
  return jsonb_build_object('status', 'claimed');
end
$fn$;

create or replace function public.release_alternate_story_claim(
  p_user_id uuid,
  p_source_session_id text,
  p_lease_id text
) returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
begin
  perform pg_advisory_xact_lock(hashtextextended(p_source_session_id, 0));
  update public.alternate_story_flows set
    status = 'available', lease_id = null, lease_expires_at = null,
    next_attempt_at = now() + interval '15 seconds', updated_at = now()
  where source_session_id = p_source_session_id and user_id = p_user_id
    and status = 'preparing' and lease_id = p_lease_id;
  return found;
end
$fn$;

create or replace function public.complete_alternate_story_unavailable(
  p_user_id uuid,
  p_source_session_id text,
  p_lease_id text
) returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v_session public.sessions%rowtype;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_source_session_id, 0));
  select * into v_session from public.sessions
  where session_id = p_source_session_id and user_id = p_user_id
  for update;
  if not found or v_session.story_request_context is null
    or v_session.feeling is null
    or v_session.disclosure_expires_at <= now() then
    return false;
  end if;
  update public.alternate_story_flows set
    status = 'unavailable', lease_id = null, lease_expires_at = null,
    next_attempt_at = null, completed_at = now(), updated_at = now()
  where source_session_id = p_source_session_id
    and user_id = p_user_id and status = 'preparing'
    and lease_id = p_lease_id and lease_expires_at > now();
  return found;
end
$fn$;

create or replace function public.complete_alternate_story_session(
  p_user_id uuid,
  p_source_session_id text,
  p_lease_id text,
  p_session_id text,
  p_artifact jsonb
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v_flow public.alternate_story_flows%rowtype;
  v_source public.sessions%rowtype;
  v_source_artifact public.story_artifacts%rowtype;
  v_story_spec public.story_specs%rowtype;
  v_artifact_id text := p_artifact ->> 'artifactId';
begin
  perform pg_advisory_xact_lock(hashtextextended(p_source_session_id, 0));
  select * into v_source from public.sessions
  where session_id = p_source_session_id and user_id = p_user_id
  for update;
  if not found then return jsonb_build_object('status', 'rejected'); end if;
  select * into v_flow from public.alternate_story_flows
    where source_session_id = p_source_session_id for update;
  if not found or v_flow.user_id is distinct from p_user_id then
    return jsonb_build_object('status', 'rejected');
  end if;
  if v_flow.status = 'ready' and v_flow.result_session_id is not null then
    return jsonb_build_object(
      'status', 'ready', 'sessionId', v_flow.result_session_id
    );
  end if;
  if v_flow.status <> 'preparing' or v_flow.lease_id is distinct from p_lease_id
    or v_flow.lease_expires_at <= now() then
    return jsonb_build_object('status', 'rejected');
  end if;
  if exists (select 1 from public.sessions where session_id = p_session_id) then
    return jsonb_build_object('status', 'collision');
  end if;

  select * into v_source_artifact from public.story_artifacts
  where artifact_id = v_flow.source_artifact_id
    and session_id = p_source_session_id and user_id = p_user_id;
  if v_source.story_artifact_id is distinct from v_flow.source_artifact_id
    or v_source_artifact.artifact_id is null
    or v_source.alternate_of_session_id is not null
    or v_source.feeling is null or v_source.story_request_context is null
    or v_source.disclosure_expires_at <= now()
    or v_source.next_beat_index < jsonb_array_length(v_source_artifact.artifact -> 'beats')
    or not exists (
      select 1 from public.story_feedback feedback
      where feedback.session_id = p_source_session_id
        and feedback.user_id = p_user_id
        and feedback.artifact_id = v_flow.source_artifact_id
        and feedback.verdict = 'not_close'
    )
    or p_session_id !~ '^[0-9a-f]{32}$'
    or v_artifact_id is null
    or (p_artifact ->> 'figureKey' = v_source.figure_key
      and p_artifact ->> 'stageId' = v_source.stage_id)
    or p_artifact #>> '{framing}' is distinct from 'partial'
    or p_artifact #>> '{validation,status}' is distinct from 'validated'
    or p_artifact #>> '{recipe,match,alternateStoryPolicyVersion}'
      is distinct from 'alternate-story-v1-2026-07' then
    return jsonb_build_object('status', 'rejected');
  end if;

  select * into v_story_spec from public.story_specs
  where story_spec_id = p_artifact ->> 'storySpecId' for share;
  if not found or v_story_spec.status <> 'published'
    or v_story_spec.version is distinct from (p_artifact ->> 'storySpecVersion')::int
    or v_story_spec.schema_version is distinct from p_artifact ->> 'storySpecSchemaVersion'
    or v_story_spec.figure_key is distinct from p_artifact ->> 'figureKey'
    or v_story_spec.stage_id is distinct from p_artifact ->> 'stageId'
    or p_artifact #>> '{contentProfile,intensity}'
      is distinct from v_story_spec.spec #>> '{contentProfile,intensity}'
    or p_artifact #> '{contentProfile,flags}'
      is distinct from v_story_spec.spec #> '{contentProfile,flags}'
    or p_artifact #>> '{contentProfile,contentNote}'
      is distinct from v_story_spec.spec #>> '{contentProfile,contentNote}'
    or public.story_content_allowed_by_context(
      v_source.story_request_context, v_story_spec.spec -> 'contentProfile'
    ) is distinct from true then
    return jsonb_build_object('status', 'rejected');
  end if;

  insert into public.sessions (
    session_id, user_id, figure_key, stage_id, story_artifact_id, framing,
    opening_copy, age, feeling, story_request_context, disclosure_expires_at,
    alternate_of_session_id, match_recipe, next_beat_index, next_chunk_index,
    updated_at
  ) values (
    p_session_id, p_user_id, p_artifact ->> 'figureKey',
    p_artifact ->> 'stageId', v_artifact_id, 'partial',
    p_artifact -> 'openingCopy', null, null, null,
    v_source.disclosure_expires_at, v_source.session_id,
    p_artifact #> '{recipe,match}', 0, 0, now()
  );
  insert into public.story_artifacts (
    artifact_id, session_id, user_id, story_spec_id, story_spec_version,
    story_spec_schema_version, figure_key, stage_id, schema_version,
    composition_mode, content_hash, artifact, created_at
  ) values (
    v_artifact_id, p_session_id, p_user_id, p_artifact ->> 'storySpecId',
    (p_artifact ->> 'storySpecVersion')::int,
    p_artifact ->> 'storySpecSchemaVersion', p_artifact ->> 'figureKey',
    p_artifact ->> 'stageId', p_artifact ->> 'schemaVersion',
    p_artifact #>> '{composition,mode}', p_artifact ->> 'contentHash',
    p_artifact, now()
  );
  update public.alternate_story_flows set
    status = 'ready', result_session_id = p_session_id, lease_id = null,
    lease_expires_at = null, next_attempt_at = null,
    completed_at = now(), updated_at = now()
  where source_session_id = p_source_session_id;
  return jsonb_build_object('status', 'ready', 'sessionId', p_session_id);
end
$fn$;

revoke all on function public.issue_alternate_story_flow(
  uuid, text, text, text, text, boolean
) from public, anon, authenticated;
grant execute on function public.issue_alternate_story_flow(
  uuid, text, text, text, text, boolean
) to service_role;
revoke all on function public.claim_alternate_story_flow(
  uuid, text, text, text, text, text
) from public, anon, authenticated;
grant execute on function public.claim_alternate_story_flow(
  uuid, text, text, text, text, text
) to service_role;
revoke all on function public.release_alternate_story_claim(uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.release_alternate_story_claim(uuid, text, text)
  to service_role;
revoke all on function public.complete_alternate_story_unavailable(uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.complete_alternate_story_unavailable(uuid, text, text)
  to service_role;
revoke all on function public.complete_alternate_story_session(
  uuid, text, text, text, jsonb
) from public, anon, authenticated;
grant execute on function public.complete_alternate_story_session(
  uuid, text, text, text, jsonb
) to service_role;

-- Replace the old disclosure-only job. Both sensitive fields expire against the
-- original immutable deadline; creating an alternate cannot move that clock.
select cron.unschedule('onward-null-feelings-60d');
select cron.schedule(
  'onward-null-feelings-60d',
  '17 3 * * *',
  $job$
    update public.sessions
    set feeling = null, story_request_context = null
    where disclosure_expires_at <= now()
      and (feeling is not null or story_request_context is not null)
  $job$
);

create or replace function public.delete_expired_alternate_story_flows()
returns void
language sql
security definer
set search_path = pg_catalog, public
as $fn$
  delete from public.alternate_story_flows
  where context_expires_at <= now();
$fn$;
revoke all on function public.delete_expired_alternate_story_flows()
  from public, anon, authenticated;
grant execute on function public.delete_expired_alternate_story_flows()
  to service_role;
select cron.schedule(
  'onward-alternate-story-cleanup',
  '47 3 * * *',
  $$select public.delete_expired_alternate_story_flows();$$
);
