-- Reduce auth-related query overhead and clear high-signal Supabase Advisor warnings.
-- This migration is intentionally additive/idempotent for the current MVP schema.

do $$
begin
  if to_regprocedure('public.set_updated_at()') is not null then
    execute 'alter function public.set_updated_at() set search_path = public';
    execute 'revoke execute on function public.set_updated_at() from public, anon, authenticated';
  end if;

  if to_regprocedure('public.slugify(text)') is not null then
    execute 'alter function public.slugify(text) set search_path = public';
    execute 'revoke execute on function public.slugify(text) from public, anon, authenticated';
  end if;

  if to_regprocedure('public.normalize_english(text)') is not null then
    execute 'alter function public.normalize_english(text) set search_path = public';
    execute 'revoke execute on function public.normalize_english(text) from public, anon, authenticated';
  end if;

  if to_regprocedure('public.normalize_english_term(text)') is not null then
    execute 'alter function public.normalize_english_term(text) set search_path = public';
    execute 'revoke execute on function public.normalize_english_term(text) from public, anon, authenticated';
  end if;

  if to_regprocedure('public.prepare_vocabulary()') is not null then
    execute 'alter function public.prepare_vocabulary() set search_path = public';
    execute 'revoke execute on function public.prepare_vocabulary() from public, anon, authenticated';
  end if;

  if to_regprocedure('public.calculate_level(bigint)') is not null then
    execute 'alter function public.calculate_level(bigint) set search_path = public';
    execute 'revoke execute on function public.calculate_level(bigint) from public, anon, authenticated';
  end if;
end $$;

create index if not exists idx_lessons_created_by
on public.lessons (created_by)
where created_by is not null;

create index if not exists idx_quiz_answers_question_id
on public.quiz_answers (question_id);

create index if not exists idx_quiz_answers_selected_option_id
on public.quiz_answers (selected_option_id)
where selected_option_id is not null;

create index if not exists idx_quiz_attempts_lesson_id
on public.quiz_attempts (lesson_id);

create index if not exists idx_user_progress_lesson_id
on public.user_progress (lesson_id);

create index if not exists idx_user_vocabulary_vocabulary_id
on public.user_vocabulary (vocabulary_id);

drop policy if exists "courses_admin_write" on public.courses;
drop policy if exists "units_admin_write" on public.units;
drop policy if exists "lessons_admin_write" on public.lessons;
drop policy if exists "lesson_contents_admin_write" on public.lesson_contents;
drop policy if exists "lesson_vocabulary_admin_write" on public.lesson_vocabulary;
drop policy if exists "vocabulary_admin_write" on public.vocabulary;
drop policy if exists "quiz_questions_admin_write" on public.quiz_questions;
drop policy if exists "quiz_options_admin_only" on public.quiz_options;
drop policy if exists "courses_admin_insert" on public.courses;
drop policy if exists "courses_admin_update" on public.courses;
drop policy if exists "courses_admin_delete" on public.courses;
drop policy if exists "units_admin_insert" on public.units;
drop policy if exists "units_admin_update" on public.units;
drop policy if exists "units_admin_delete" on public.units;
drop policy if exists "lessons_admin_insert" on public.lessons;
drop policy if exists "lessons_admin_update" on public.lessons;
drop policy if exists "lessons_admin_delete" on public.lessons;
drop policy if exists "lesson_contents_admin_insert" on public.lesson_contents;
drop policy if exists "lesson_contents_admin_update" on public.lesson_contents;
drop policy if exists "lesson_contents_admin_delete" on public.lesson_contents;
drop policy if exists "lesson_vocabulary_admin_insert" on public.lesson_vocabulary;
drop policy if exists "lesson_vocabulary_admin_update" on public.lesson_vocabulary;
drop policy if exists "lesson_vocabulary_admin_delete" on public.lesson_vocabulary;
drop policy if exists "vocabulary_admin_insert" on public.vocabulary;
drop policy if exists "vocabulary_admin_update" on public.vocabulary;
drop policy if exists "vocabulary_admin_delete" on public.vocabulary;
drop policy if exists "quiz_questions_admin_insert" on public.quiz_questions;
drop policy if exists "quiz_questions_admin_update" on public.quiz_questions;
drop policy if exists "quiz_questions_admin_delete" on public.quiz_questions;
drop policy if exists "quiz_options_admin_insert" on public.quiz_options;
drop policy if exists "quiz_options_admin_update" on public.quiz_options;
drop policy if exists "quiz_options_admin_delete" on public.quiz_options;

drop policy if exists "courses_select_published_or_admin" on public.courses;
create policy "courses_select_published_or_admin"
on public.courses for select
to anon, authenticated
using (
  private.is_admin()
  or (
    status = 'published'::public.content_status
    and (published_at is null or published_at <= now())
  )
);

create policy "courses_admin_insert"
on public.courses for insert
to authenticated
with check (private.is_admin());

create policy "courses_admin_update"
on public.courses for update
to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy "courses_admin_delete"
on public.courses for delete
to authenticated
using (private.is_admin());

drop policy if exists "units_select_published_or_admin" on public.units;
create policy "units_select_published_or_admin"
on public.units for select
to anon, authenticated
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

create policy "units_admin_insert"
on public.units for insert
to authenticated
with check (private.is_admin());

create policy "units_admin_update"
on public.units for update
to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy "units_admin_delete"
on public.units for delete
to authenticated
using (private.is_admin());

drop policy if exists "lessons_select_published_or_admin" on public.lessons;
create policy "lessons_select_published_or_admin"
on public.lessons for select
to anon, authenticated
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

create policy "lessons_admin_insert"
on public.lessons for insert
to authenticated
with check (private.is_admin());

create policy "lessons_admin_update"
on public.lessons for update
to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy "lessons_admin_delete"
on public.lessons for delete
to authenticated
using (private.is_admin());

drop policy if exists "lesson_contents_select_published_or_admin" on public.lesson_contents;
create policy "lesson_contents_select_published_or_admin"
on public.lesson_contents for select
to anon, authenticated
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

create policy "lesson_contents_admin_insert"
on public.lesson_contents for insert
to authenticated
with check (private.is_admin());

create policy "lesson_contents_admin_update"
on public.lesson_contents for update
to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy "lesson_contents_admin_delete"
on public.lesson_contents for delete
to authenticated
using (private.is_admin());

drop policy if exists "lesson_vocabulary_select_published_or_admin" on public.lesson_vocabulary;
create policy "lesson_vocabulary_select_published_or_admin"
on public.lesson_vocabulary for select
to anon, authenticated
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

create policy "lesson_vocabulary_admin_insert"
on public.lesson_vocabulary for insert
to authenticated
with check (private.is_admin());

create policy "lesson_vocabulary_admin_update"
on public.lesson_vocabulary for update
to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy "lesson_vocabulary_admin_delete"
on public.lesson_vocabulary for delete
to authenticated
using (private.is_admin());

drop policy if exists "vocabulary_public_read" on public.vocabulary;
create policy "vocabulary_public_read"
on public.vocabulary for select
to anon, authenticated
using (true);

create policy "vocabulary_admin_insert"
on public.vocabulary for insert
to authenticated
with check (private.is_admin());

create policy "vocabulary_admin_update"
on public.vocabulary for update
to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy "vocabulary_admin_delete"
on public.vocabulary for delete
to authenticated
using (private.is_admin());

drop policy if exists "quiz_questions_select_published_or_admin" on public.quiz_questions;
create policy "quiz_questions_select_published_or_admin"
on public.quiz_questions for select
to anon, authenticated
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

create policy "quiz_questions_admin_insert"
on public.quiz_questions for insert
to authenticated
with check (private.is_admin());

create policy "quiz_questions_admin_update"
on public.quiz_questions for update
to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy "quiz_questions_admin_delete"
on public.quiz_questions for delete
to authenticated
using (private.is_admin());

drop policy if exists "quiz_options_select_published" on public.quiz_options;
create policy "quiz_options_select_published"
on public.quiz_options for select
to anon, authenticated
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

create policy "quiz_options_admin_insert"
on public.quiz_options for insert
to authenticated
with check (private.is_admin());

create policy "quiz_options_admin_update"
on public.quiz_options for update
to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy "quiz_options_admin_delete"
on public.quiz_options for delete
to authenticated
using (private.is_admin());

drop policy if exists "storage_admin_manage_lesson_media" on storage.objects;
drop policy if exists "storage_admin_insert_lesson_media" on storage.objects;
drop policy if exists "storage_admin_update_lesson_media" on storage.objects;
drop policy if exists "storage_admin_delete_lesson_media" on storage.objects;

create policy "storage_admin_insert_lesson_media"
on storage.objects for insert
to authenticated
with check (bucket_id = 'lesson-media' and private.is_admin());

create policy "storage_admin_update_lesson_media"
on storage.objects for update
to authenticated
using (bucket_id = 'lesson-media' and private.is_admin())
with check (bucket_id = 'lesson-media' and private.is_admin());

create policy "storage_admin_delete_lesson_media"
on storage.objects for delete
to authenticated
using (bucket_id = 'lesson-media' and private.is_admin());
