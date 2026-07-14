-- Manual post-compatibility cleanup. This file intentionally lives outside
-- supabase/migrations so an automated runner cannot drop the legacy RPC before
-- the create_story_session_v2 application has completed its rollback window.
--
-- Preconditions:
--   1. 0009 has been applied everywhere.
--   2. All application instances call create_story_session_v2.
--   3. Production verification and the agreed rollback window are complete.

revoke all on function public.create_story_session(
  text, uuid, text, text, text, int, text, jsonb, jsonb
) from public, anon, authenticated, service_role;

drop function public.create_story_session(
  text, uuid, text, text, text, int, text, jsonb, jsonb
);
