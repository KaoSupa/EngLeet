-- Harden SECURITY DEFINER RPC exposure without breaking intended authenticated user actions.

-- Internal trigger/helper functions should not be callable through PostgREST RPC.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.prevent_role_escalation() from public, anon, authenticated;
revoke execute on function public.sync_profile_email_from_auth() from public, anon, authenticated;

grant execute on function public.handle_new_user() to service_role;
grant execute on function public.prevent_role_escalation() to service_role;
grant execute on function public.sync_profile_email_from_auth() to service_role;

-- Authenticated learning actions are intentionally client-callable, but never anon/public.
revoke execute on function public.complete_lesson(uuid, integer) from public, anon;
revoke execute on function public.review_vocabulary(uuid, integer) from public, anon;
revoke execute on function public.save_vocabulary(uuid) from public, anon;
revoke execute on function public.submit_lesson_quiz(uuid, jsonb, integer) from public, anon;

grant execute on function public.complete_lesson(uuid, integer) to authenticated;
grant execute on function public.review_vocabulary(uuid, integer) to authenticated;
grant execute on function public.save_vocabulary(uuid) to authenticated;
grant execute on function public.submit_lesson_quiz(uuid, jsonb, integer) to authenticated;

-- Vocabulary search is public read-only. Run as invoker so normal RLS applies.
alter function public.search_vocabulary(text, integer) security invoker;
revoke execute on function public.search_vocabulary(text, integer) from public;
grant execute on function public.search_vocabulary(text, integer) to anon, authenticated;
