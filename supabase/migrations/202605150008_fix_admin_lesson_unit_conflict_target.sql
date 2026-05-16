-- Match the units table constraint: units are unique per course, not globally
-- by slug. The previous RPC used ON CONFLICT (slug), which has no matching
-- unique constraint on the current schema.

create or replace function public.server_admin_upsert_lesson_bundle(
  p_admin_user_id uuid,
  p_lesson jsonb,
  p_content_blocks jsonb default '[]'::jsonb,
  p_questions jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_lesson_id uuid := nullif(p_lesson ->> 'id', '')::uuid;
  v_course_id uuid;
  v_unit_id uuid;
  v_saved_lesson_id uuid;
  v_title text := nullif(trim(p_lesson ->> 'title'), '');
  v_slug text := public.slugify(coalesce(nullif(p_lesson ->> 'slug', ''), p_lesson ->> 'title'));
  v_course_title text := coalesce(nullif(trim(p_lesson ->> 'course_title'), ''), 'Engleet Core');
  v_unit_title text := coalesce(nullif(trim(p_lesson ->> 'unit_title'), ''), 'Foundation');
  v_course_slug text := public.slugify(coalesce(nullif(trim(p_lesson ->> 'course_title'), ''), 'Engleet Core'));
  v_unit_slug text := public.slugify(v_course_title || '-' || v_unit_title);
  v_level public.cefr_level := coalesce(nullif(p_lesson ->> 'cefr_level', ''), 'A1')::public.cefr_level;
  v_status public.content_status := coalesce(nullif(p_lesson ->> 'status', ''), 'draft')::public.content_status;
  v_category public.lesson_category := coalesce(nullif(p_lesson ->> 'category', ''), 'vocabulary')::public.lesson_category;
  v_published_at timestamptz := case when coalesce(nullif(p_lesson ->> 'status', ''), 'draft') = 'published' then now() else null end;
  v_question jsonb;
  v_option jsonb;
  v_question_id uuid;
begin
  if p_admin_user_id is null or not private.is_admin(p_admin_user_id) then
    raise exception 'Admin access required';
  end if;

  if v_title is null then
    raise exception 'Lesson title is required';
  end if;

  if coalesce(jsonb_typeof(p_content_blocks), 'null') <> 'array' then
    raise exception 'content_blocks must be an array';
  end if;

  if coalesce(jsonb_typeof(p_questions), 'null') <> 'array' then
    raise exception 'questions must be an array';
  end if;

  insert into public.courses (
    title,
    slug,
    cefr_level,
    status,
    published_at
  )
  values (
    v_course_title,
    v_course_slug,
    v_level,
    v_status,
    v_published_at
  )
  on conflict (slug) do update
  set title = excluded.title,
      cefr_level = excluded.cefr_level,
      status = case
        when excluded.status = 'published'::public.content_status then excluded.status
        else public.courses.status
      end,
      published_at = case
        when excluded.status = 'published'::public.content_status then coalesce(public.courses.published_at, now())
        else public.courses.published_at
      end,
      updated_at = now()
  returning id into v_course_id;

  insert into public.units (
    course_id,
    title,
    slug,
    status,
    published_at
  )
  values (
    v_course_id,
    v_unit_title,
    v_unit_slug,
    v_status,
    v_published_at
  )
  on conflict (course_id, slug) do update
  set course_id = excluded.course_id,
      title = excluded.title,
      status = case
        when excluded.status = 'published'::public.content_status then excluded.status
        else public.units.status
      end,
      published_at = case
        when excluded.status = 'published'::public.content_status then coalesce(public.units.published_at, now())
        else public.units.published_at
      end,
      updated_at = now()
  returning id into v_unit_id;

  if v_lesson_id is null then
    insert into public.lessons (
      unit_id,
      created_by,
      title,
      slug,
      description,
      thumbnail_url,
      category,
      cefr_level,
      status,
      estimated_minutes,
      xp_reward,
      passing_score,
      meta_title,
      meta_description,
      published_at
    )
    values (
      v_unit_id,
      p_admin_user_id,
      v_title,
      v_slug,
      nullif(p_lesson ->> 'description', ''),
      nullif(p_lesson ->> 'thumbnail_url', ''),
      v_category,
      v_level,
      v_status,
      coalesce((p_lesson ->> 'estimated_minutes')::integer, 10),
      coalesce((p_lesson ->> 'xp_reward')::integer, 25),
      coalesce((p_lesson ->> 'passing_score')::integer, 70),
      nullif(p_lesson ->> 'meta_title', ''),
      nullif(p_lesson ->> 'meta_description', ''),
      v_published_at
    )
    returning id into v_saved_lesson_id;
  else
    update public.lessons
    set unit_id = v_unit_id,
        created_by = coalesce(public.lessons.created_by, p_admin_user_id),
        title = v_title,
        slug = v_slug,
        description = nullif(p_lesson ->> 'description', ''),
        thumbnail_url = nullif(p_lesson ->> 'thumbnail_url', ''),
        category = v_category,
        cefr_level = v_level,
        status = v_status,
        estimated_minutes = coalesce((p_lesson ->> 'estimated_minutes')::integer, 10),
        xp_reward = coalesce((p_lesson ->> 'xp_reward')::integer, 25),
        passing_score = coalesce((p_lesson ->> 'passing_score')::integer, 70),
        meta_title = nullif(p_lesson ->> 'meta_title', ''),
        meta_description = nullif(p_lesson ->> 'meta_description', ''),
        published_at = case
          when v_status = 'published'::public.content_status then coalesce(public.lessons.published_at, now())
          else null
        end,
        updated_at = now()
    where id = v_lesson_id
    returning id into v_saved_lesson_id;

    if v_saved_lesson_id is null then
      raise exception 'Lesson not found';
    end if;
  end if;

  delete from public.lesson_contents where lesson_id = v_saved_lesson_id;
  insert into public.lesson_contents (
    lesson_id,
    block_type,
    content,
    order_index
  )
  select
    v_saved_lesson_id,
    (block.value ->> 'block_type')::public.content_block_type,
    coalesce(block.value -> 'content', '{}'::jsonb),
    block.ordinality::integer - 1
  from jsonb_array_elements(p_content_blocks) with ordinality as block(value, ordinality);

  delete from public.quiz_answers
  where question_id in (
    select id from public.quiz_questions where lesson_id = v_saved_lesson_id
  );

  delete from public.quiz_options
  where question_id in (
    select id from public.quiz_questions where lesson_id = v_saved_lesson_id
  );

  delete from public.quiz_questions where lesson_id = v_saved_lesson_id;

  for v_question in select value from jsonb_array_elements(p_questions)
  loop
    insert into public.quiz_questions (
      lesson_id,
      question,
      type,
      explanation,
      points,
      order_index
    )
    values (
      v_saved_lesson_id,
      v_question ->> 'question',
      coalesce(nullif(v_question ->> 'type', ''), 'multiple_choice')::public.quiz_type,
      nullif(v_question ->> 'explanation', ''),
      coalesce((v_question ->> 'points')::integer, 1),
      coalesce((v_question ->> 'order_index')::integer, 0)
    )
    returning id into v_question_id;

    for v_option in select value from jsonb_array_elements(coalesce(v_question -> 'options', '[]'::jsonb))
    loop
      insert into public.quiz_options (
        question_id,
        content,
        feedback,
        is_correct,
        order_index
      )
      values (
        v_question_id,
        v_option ->> 'content',
        nullif(v_option ->> 'feedback', ''),
        coalesce((v_option ->> 'is_correct')::boolean, false),
        coalesce((v_option ->> 'order_index')::integer, 0)
      );
    end loop;
  end loop;

  return v_saved_lesson_id;
end;
$$;

revoke execute on function public.server_admin_upsert_lesson_bundle(uuid, jsonb, jsonb, jsonb)
from public, anon, authenticated;
grant execute on function public.server_admin_upsert_lesson_bundle(uuid, jsonb, jsonb, jsonb)
to service_role;
