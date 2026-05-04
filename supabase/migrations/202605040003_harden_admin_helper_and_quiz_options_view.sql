-- Harden public security warnings from Supabase Advisor.
-- 1. Move the admin helper used by RLS into a non-exposed private schema.
-- 2. Recreate public_quiz_options as a security_invoker view and expose only
--    safe answer-option columns for published lessons.

create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;

create or replace function private.is_admin(user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = user_id
      and role = 'admin'
  );
$$;

revoke all on function private.is_admin(uuid) from public;
grant execute on function private.is_admin(uuid) to anon, authenticated, service_role;

create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role is distinct from new.role
     and not private.is_admin(auth.uid()) then
    raise exception 'Only admins can change user roles';
  end if;

  return new;
end;
$$;

-- User domain policies.
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles for select
using (id = (select auth.uid()) or private.is_admin());

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
on public.profiles for update
using (id = (select auth.uid()) or private.is_admin())
with check (id = (select auth.uid()) or private.is_admin());

drop policy if exists "user_settings_own_select" on public.user_settings;
create policy "user_settings_own_select"
on public.user_settings for select
using (user_id = (select auth.uid()) or private.is_admin());

drop policy if exists "user_settings_own_update" on public.user_settings;
create policy "user_settings_own_update"
on public.user_settings for update
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists "user_stats_select_own_or_admin" on public.user_stats;
create policy "user_stats_select_own_or_admin"
on public.user_stats for select
using (user_id = (select auth.uid()) or private.is_admin());

drop policy if exists "user_activity_days_select_own_or_admin" on public.user_activity_days;
create policy "user_activity_days_select_own_or_admin"
on public.user_activity_days for select
using (user_id = (select auth.uid()) or private.is_admin());

drop policy if exists "user_xp_ledger_select_own_or_admin" on public.user_xp_ledger;
create policy "user_xp_ledger_select_own_or_admin"
on public.user_xp_ledger for select
using (user_id = (select auth.uid()) or private.is_admin());

drop policy if exists "user_vocabulary_select_own_or_admin" on public.user_vocabulary;
create policy "user_vocabulary_select_own_or_admin"
on public.user_vocabulary for select
using (user_id = (select auth.uid()) or private.is_admin());

drop policy if exists "user_progress_select_own_or_admin" on public.user_progress;
create policy "user_progress_select_own_or_admin"
on public.user_progress for select
using (user_id = (select auth.uid()) or private.is_admin());

-- Learning content policies.
drop policy if exists "courses_admin_write" on public.courses;
create policy "courses_admin_write"
on public.courses for all
using (private.is_admin())
with check (private.is_admin());

drop policy if exists "courses_select_published_or_admin" on public.courses;
create policy "courses_select_published_or_admin"
on public.courses for select
using (
  private.is_admin()
  or (
    status = 'published'::public.content_status
    and (published_at is null or published_at <= now())
  )
);

drop policy if exists "units_admin_write" on public.units;
create policy "units_admin_write"
on public.units for all
using (private.is_admin())
with check (private.is_admin());

drop policy if exists "units_select_published_or_admin" on public.units;
create policy "units_select_published_or_admin"
on public.units for select
using (
  private.is_admin()
  or (
    status = 'published'::public.content_status
    and (published_at is null or published_at <= now())
    and exists (
      select 1
      from public.courses c
      where c.id = units.course_id
        and c.status = 'published'::public.content_status
        and (c.published_at is null or c.published_at <= now())
    )
  )
);

drop policy if exists "lessons_admin_write" on public.lessons;
create policy "lessons_admin_write"
on public.lessons for all
using (private.is_admin())
with check (private.is_admin());

drop policy if exists "lessons_select_published_or_admin" on public.lessons;
create policy "lessons_select_published_or_admin"
on public.lessons for select
using (
  private.is_admin()
  or (
    status = 'published'::public.content_status
    and (published_at is null or published_at <= now())
    and exists (
      select 1
      from public.units u
      join public.courses c on c.id = u.course_id
      where u.id = lessons.unit_id
        and u.status = 'published'::public.content_status
        and c.status = 'published'::public.content_status
        and (u.published_at is null or u.published_at <= now())
        and (c.published_at is null or c.published_at <= now())
    )
  )
);

drop policy if exists "lesson_contents_admin_write" on public.lesson_contents;
create policy "lesson_contents_admin_write"
on public.lesson_contents for all
using (private.is_admin())
with check (private.is_admin());

drop policy if exists "lesson_contents_select_published_or_admin" on public.lesson_contents;
create policy "lesson_contents_select_published_or_admin"
on public.lesson_contents for select
using (
  private.is_admin()
  or exists (
    select 1
    from public.lessons l
    join public.units u on u.id = l.unit_id
    join public.courses c on c.id = u.course_id
    where l.id = lesson_contents.lesson_id
      and l.status = 'published'::public.content_status
      and u.status = 'published'::public.content_status
      and c.status = 'published'::public.content_status
      and (l.published_at is null or l.published_at <= now())
      and (u.published_at is null or u.published_at <= now())
      and (c.published_at is null or c.published_at <= now())
  )
);

drop policy if exists "lesson_vocabulary_admin_write" on public.lesson_vocabulary;
create policy "lesson_vocabulary_admin_write"
on public.lesson_vocabulary for all
using (private.is_admin())
with check (private.is_admin());

drop policy if exists "lesson_vocabulary_select_published_or_admin" on public.lesson_vocabulary;
create policy "lesson_vocabulary_select_published_or_admin"
on public.lesson_vocabulary for select
using (
  private.is_admin()
  or exists (
    select 1
    from public.lessons l
    join public.units u on u.id = l.unit_id
    join public.courses c on c.id = u.course_id
    where l.id = lesson_vocabulary.lesson_id
      and l.status = 'published'::public.content_status
      and u.status = 'published'::public.content_status
      and c.status = 'published'::public.content_status
  )
);

drop policy if exists "vocabulary_admin_write" on public.vocabulary;
create policy "vocabulary_admin_write"
on public.vocabulary for all
using (private.is_admin())
with check (private.is_admin());

-- Quiz policies.
drop policy if exists "quiz_questions_admin_write" on public.quiz_questions;
create policy "quiz_questions_admin_write"
on public.quiz_questions for all
using (private.is_admin())
with check (private.is_admin());

drop policy if exists "quiz_questions_select_published_or_admin" on public.quiz_questions;
create policy "quiz_questions_select_published_or_admin"
on public.quiz_questions for select
using (
  private.is_admin()
  or exists (
    select 1
    from public.lessons l
    join public.units u on u.id = l.unit_id
    join public.courses c on c.id = u.course_id
    where l.id = quiz_questions.lesson_id
      and l.status = 'published'::public.content_status
      and u.status = 'published'::public.content_status
      and c.status = 'published'::public.content_status
      and (l.published_at is null or l.published_at <= now())
      and (u.published_at is null or u.published_at <= now())
      and (c.published_at is null or c.published_at <= now())
  )
);

drop policy if exists "quiz_options_admin_only" on public.quiz_options;
create policy "quiz_options_admin_only"
on public.quiz_options for all
using (private.is_admin())
with check (private.is_admin());

drop policy if exists "quiz_options_select_published" on public.quiz_options;
create policy "quiz_options_select_published"
on public.quiz_options for select
using (
  exists (
    select 1
    from public.quiz_questions qq
    join public.lessons l on l.id = qq.lesson_id
    join public.units u on u.id = l.unit_id
    join public.courses c on c.id = u.course_id
    where qq.id = quiz_options.question_id
      and l.status = 'published'::public.content_status
      and u.status = 'published'::public.content_status
      and c.status = 'published'::public.content_status
      and (l.published_at is null or l.published_at <= now())
      and (u.published_at is null or u.published_at <= now())
      and (c.published_at is null or c.published_at <= now())
  )
);

drop policy if exists "quiz_attempts_select_own_or_admin" on public.quiz_attempts;
create policy "quiz_attempts_select_own_or_admin"
on public.quiz_attempts for select
using (user_id = (select auth.uid()) or private.is_admin());

drop policy if exists "quiz_answers_select_own_or_admin" on public.quiz_answers;
create policy "quiz_answers_select_own_or_admin"
on public.quiz_answers for select
using (
  private.is_admin()
  or exists (
    select 1
    from public.quiz_attempts qa
    where qa.id = quiz_answers.attempt_id
      and qa.user_id = (select auth.uid())
  )
);

-- Expose safe quiz option columns to the public API while keeping is_correct private.
grant select (id, question_id, content, order_index)
on public.quiz_options to anon, authenticated;

create or replace view public.public_quiz_options
with (security_invoker = true)
as
select
  qo.id,
  qo.question_id,
  qo.content,
  qo.order_index
from public.quiz_options qo
join public.quiz_questions qq on qq.id = qo.question_id
join public.lessons l on l.id = qq.lesson_id
join public.units u on u.id = l.unit_id
join public.courses c on c.id = u.course_id
where l.status = 'published'::public.content_status
  and u.status = 'published'::public.content_status
  and c.status = 'published'::public.content_status
  and (l.published_at is null or l.published_at <= now())
  and (u.published_at is null or u.published_at <= now())
  and (c.published_at is null or c.published_at <= now());

grant select on public.public_quiz_options to anon, authenticated;

-- Storage policies can also depend on the public admin helper.
drop policy if exists "storage_admin_manage_lesson_media" on storage.objects;
create policy "storage_admin_manage_lesson_media"
on storage.objects for all
using (bucket_id = 'lesson-media' and private.is_admin())
with check (bucket_id = 'lesson-media' and private.is_admin());

-- Remove the exposed public admin RPC after all policies point at private.is_admin().
drop function if exists public.is_admin(uuid);
