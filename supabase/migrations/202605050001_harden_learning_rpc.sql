-- Harden authenticated learning RPCs that must remain SECURITY DEFINER.
-- These functions still run with elevated privileges, but now validate input,
-- clamp user-supplied timing, and reduce stat/activity inflation from replay.

create or replace function public.complete_lesson(
  p_lesson_id uuid,
  p_study_time_seconds integer default 0
)
returns table (
  lesson_id uuid,
  status public.lesson_status,
  xp_earned integer
)
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_user_id uuid := auth.uid();
  v_xp_reward integer;
  v_already_completed boolean := false;
  v_xp_earned integer := 0;
  v_study_time_seconds integer := least(greatest(coalesce(p_study_time_seconds, 0), 0), 14400);
  v_recorded_study_time_seconds integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_lesson_id is null then
    raise exception 'Lesson is required';
  end if;

  select l.xp_reward
  into v_xp_reward
  from public.lessons l
  join public.units u on u.id = l.unit_id
  join public.courses c on c.id = u.course_id
  where l.id = p_lesson_id
    and l.status = 'published'
    and u.status = 'published'
    and c.status = 'published'
    and (l.published_at is null or l.published_at <= now())
    and (u.published_at is null or u.published_at <= now())
    and (c.published_at is null or c.published_at <= now());

  if v_xp_reward is null then
    raise exception 'Lesson is not available';
  end if;

  select exists (
    select 1
    from public.user_progress
    where user_id = v_user_id
      and lesson_id = p_lesson_id
      and status = 'completed'
  )
  into v_already_completed;

  v_recorded_study_time_seconds := case
    when v_already_completed and v_study_time_seconds < 30 then 0
    else v_study_time_seconds
  end;

  insert into public.user_progress (
    user_id,
    lesson_id,
    status,
    started_at,
    completed_at,
    time_spent_seconds
  )
  values (
    v_user_id,
    p_lesson_id,
    'completed',
    now(),
    now(),
    v_recorded_study_time_seconds
  )
  on conflict (user_id, lesson_id) do update
  set status = 'completed',
      completed_at = coalesce(public.user_progress.completed_at, now()),
      time_spent_seconds = public.user_progress.time_spent_seconds + excluded.time_spent_seconds,
      updated_at = now();

  if not v_already_completed then
    v_xp_earned := public.award_xp_internal(
      v_user_id,
      v_xp_reward,
      'lesson_complete',
      p_lesson_id,
      'Lesson completed'
    );

    update public.user_stats
    set lessons_completed = lessons_completed + 1
    where user_id = v_user_id;
  end if;

  if (not v_already_completed) or v_recorded_study_time_seconds > 0 then
    perform public.record_activity_internal(
      v_user_id,
      v_xp_earned,
      v_recorded_study_time_seconds
    );
  end if;

  return query
  select p_lesson_id, 'completed'::public.lesson_status, v_xp_earned;
end;
$$;

create or replace function public.save_vocabulary(p_vocabulary_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_vocabulary_id is null then
    raise exception 'Vocabulary is required';
  end if;

  if not exists (select 1 from public.vocabulary where id = p_vocabulary_id) then
    raise exception 'Vocabulary not found';
  end if;

  insert into public.user_vocabulary (user_id, vocabulary_id)
  values (v_user_id, p_vocabulary_id)
  on conflict (user_id, vocabulary_id) do nothing;
end;
$$;

create or replace function public.review_vocabulary(
  p_vocabulary_id uuid,
  p_quality integer
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_user_id uuid := auth.uid();
  v_ease numeric(4,2);
  v_interval integer;
  v_reps integer;
  v_status public.vocab_status;
  v_last_reviewed_at timestamptz;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_vocabulary_id is null then
    raise exception 'Vocabulary is required';
  end if;

  if p_quality is null or p_quality < 0 or p_quality > 5 then
    raise exception 'Quality must be between 0 and 5';
  end if;

  if not exists (select 1 from public.vocabulary where id = p_vocabulary_id) then
    raise exception 'Vocabulary not found';
  end if;

  select ease_factor, interval_days, repetition_count, last_reviewed_at
  into v_ease, v_interval, v_reps, v_last_reviewed_at
  from public.user_vocabulary
  where user_id = v_user_id
    and vocabulary_id = p_vocabulary_id;

  if found and v_last_reviewed_at > now() - interval '30 seconds' then
    raise exception 'Please wait before reviewing this vocabulary again';
  end if;

  if not found then
    v_ease := 2.50;
    v_interval := 0;
    v_reps := 0;
  end if;

  if p_quality >= 3 then
    if v_reps = 0 then
      v_interval := 1;
    elsif v_reps = 1 then
      v_interval := 6;
    else
      v_interval := ceil(v_interval * v_ease)::integer;
    end if;

    v_reps := v_reps + 1;
  else
    v_reps := 0;
    v_interval := 1;
  end if;

  v_interval := greatest(v_interval, 1);

  v_ease := greatest(
    1.30,
    v_ease + (0.1 - (5 - p_quality) * (0.08 + (5 - p_quality) * 0.02))
  );

  if v_reps = 0 then
    v_status := 'learning';
  elsif v_interval < 21 then
    v_status := 'reviewing';
  else
    v_status := 'mastered';
  end if;

  insert into public.user_vocabulary (
    user_id,
    vocabulary_id,
    status,
    ease_factor,
    interval_days,
    repetition_count,
    last_quality,
    last_reviewed_at,
    next_review_at
  )
  values (
    v_user_id,
    p_vocabulary_id,
    v_status,
    v_ease,
    v_interval,
    v_reps,
    p_quality,
    now(),
    now() + (v_interval || ' days')::interval
  )
  on conflict (user_id, vocabulary_id) do update
  set status = v_status,
      ease_factor = v_ease,
      interval_days = v_interval,
      repetition_count = v_reps,
      last_quality = p_quality,
      last_reviewed_at = now(),
      next_review_at = now() + (v_interval || ' days')::interval,
      updated_at = now();

  update public.user_stats
  set vocab_mastered = (
    select count(*)::integer
    from public.user_vocabulary
    where user_id = v_user_id
      and status = 'mastered'
  )
  where user_id = v_user_id;

  perform public.record_activity_internal(v_user_id, 0, 0);
end;
$$;

create or replace function public.submit_lesson_quiz(
  p_lesson_id uuid,
  p_answers jsonb,
  p_time_taken_seconds integer default null
)
returns table (
  attempt_id uuid,
  score integer,
  max_score integer,
  percentage numeric,
  passed boolean,
  xp_earned integer
)
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_user_id uuid := auth.uid();
  v_attempt_id uuid;
  v_score integer := 0;
  v_max_score integer := 0;
  v_percentage numeric(5,2) := 0;
  v_passed boolean := false;
  v_attempt_number integer := 1;
  v_xp_earned integer := 0;
  v_passing_score integer := 70;
  v_time_taken_seconds integer := least(greatest(coalesce(p_time_taken_seconds, 0), 0), 14400);
  v_was_completed boolean := false;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_lesson_id is null then
    raise exception 'Lesson is required';
  end if;

  if coalesce(jsonb_typeof(p_answers), 'null') <> 'array' then
    raise exception 'Answers must be a JSON array';
  end if;

  if jsonb_array_length(p_answers) = 0 then
    raise exception 'Answers are required';
  end if;

  if jsonb_array_length(p_answers) > 100 then
    raise exception 'Too many answers submitted';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_answers) as answer(item)
    where jsonb_typeof(answer.item) <> 'object'
      or nullif(answer.item ->> 'question_id', '') is null
      or (answer.item ->> 'question_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      or (
        nullif(answer.item ->> 'selected_option_id', '') is not null
        and (answer.item ->> 'selected_option_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      )
  ) then
    raise exception 'Answers contain invalid identifiers';
  end if;

  if exists (
    select 1
    from public.quiz_attempts qa
    where qa.user_id = v_user_id
      and qa.lesson_id = p_lesson_id
      and qa.created_at > now() - interval '10 seconds'
  ) then
    raise exception 'Please wait before submitting this quiz again';
  end if;

  select l.passing_score
  into v_passing_score
  from public.lessons l
  join public.units u on u.id = l.unit_id
  join public.courses c on c.id = u.course_id
  where l.id = p_lesson_id
    and l.status = 'published'
    and u.status = 'published'
    and c.status = 'published'
    and (l.published_at is null or l.published_at <= now())
    and (u.published_at is null or u.published_at <= now())
    and (c.published_at is null or c.published_at <= now());

  if v_passing_score is null then
    raise exception 'Lesson is not available';
  end if;

  select coalesce(sum(points), 0)
  into v_max_score
  from public.quiz_questions
  where lesson_id = p_lesson_id;

  if v_max_score = 0 then
    raise exception 'This lesson has no quiz questions';
  end if;

  if exists (
    with submitted as (
      select distinct on (question_id)
        question_id
      from jsonb_to_recordset(p_answers)
        as x(question_id uuid, selected_option_id uuid)
      where question_id is not null
      order by question_id
    )
    select 1
    from submitted s
    left join public.quiz_questions qq
      on qq.id = s.question_id
     and qq.lesson_id = p_lesson_id
    where qq.id is null
  ) then
    raise exception 'Answers must belong to this lesson';
  end if;

  with submitted as (
    select distinct on (question_id)
      question_id,
      selected_option_id
    from jsonb_to_recordset(p_answers)
      as x(question_id uuid, selected_option_id uuid)
    where question_id is not null
    order by question_id
  )
  select coalesce(sum(
    case when qo.is_correct then qq.points else 0 end
  ), 0)
  into v_score
  from public.quiz_questions qq
  left join submitted s on s.question_id = qq.id
  left join public.quiz_options qo
    on qo.id = s.selected_option_id
   and qo.question_id = qq.id
  where qq.lesson_id = p_lesson_id;

  v_percentage := round((v_score::numeric / v_max_score::numeric) * 100, 2);
  v_passed := v_percentage >= v_passing_score;

  select exists (
    select 1
    from public.user_progress
    where user_id = v_user_id
      and lesson_id = p_lesson_id
      and status = 'completed'
  )
  into v_was_completed;

  select coalesce(max(qa.attempt_number), 0) + 1
  into v_attempt_number
  from public.quiz_attempts qa
  where qa.user_id = v_user_id
    and qa.lesson_id = p_lesson_id;

  insert into public.quiz_attempts (
    user_id,
    lesson_id,
    score,
    max_score,
    percentage,
    passed,
    xp_earned,
    time_taken_seconds,
    attempt_number
  )
  values (
    v_user_id,
    p_lesson_id,
    v_score,
    v_max_score,
    v_percentage,
    v_passed,
    0,
    v_time_taken_seconds,
    v_attempt_number
  )
  returning id into v_attempt_id;

  with submitted as (
    select distinct on (question_id)
      question_id,
      selected_option_id
    from jsonb_to_recordset(p_answers)
      as x(question_id uuid, selected_option_id uuid)
    where question_id is not null
    order by question_id
  )
  insert into public.quiz_answers (
    attempt_id,
    question_id,
    selected_option_id,
    is_correct,
    points_awarded
  )
  select
    v_attempt_id,
    qq.id,
    s.selected_option_id,
    coalesce(qo.is_correct, false),
    case when coalesce(qo.is_correct, false) then qq.points else 0 end
  from public.quiz_questions qq
  left join submitted s on s.question_id = qq.id
  left join public.quiz_options qo
    on qo.id = s.selected_option_id
   and qo.question_id = qq.id
  where qq.lesson_id = p_lesson_id;

  insert into public.user_progress (
    user_id,
    lesson_id,
    status,
    best_score,
    attempts,
    started_at,
    completed_at,
    time_spent_seconds
  )
  values (
    v_user_id,
    p_lesson_id,
    case when v_passed then 'completed' else 'in_progress' end,
    v_score,
    1,
    now(),
    case when v_passed then now() else null end,
    v_time_taken_seconds
  )
  on conflict (user_id, lesson_id) do update
  set status = case
        when public.user_progress.status = 'completed' then 'completed'
        when v_passed then 'completed'
        else 'in_progress'
      end,
      best_score = greatest(coalesce(public.user_progress.best_score, 0), v_score),
      attempts = public.user_progress.attempts + 1,
      completed_at = case
        when public.user_progress.completed_at is not null then public.user_progress.completed_at
        when v_passed then now()
        else null
      end,
      time_spent_seconds = public.user_progress.time_spent_seconds + v_time_taken_seconds,
      updated_at = now();

  if v_passed and not v_was_completed then
    update public.user_stats
    set quizzes_completed = quizzes_completed + 1
    where user_id = v_user_id;
  end if;

  if v_passed then
    v_xp_earned := public.award_xp_internal(
      v_user_id,
      10,
      'quiz_pass',
      p_lesson_id,
      'Quiz passed'
    );
  end if;

  update public.quiz_attempts
  set xp_earned = v_xp_earned
  where id = v_attempt_id;

  perform public.record_activity_internal(
    v_user_id,
    v_xp_earned,
    v_time_taken_seconds
  );

  return query
  select v_attempt_id, v_score, v_max_score, v_percentage, v_passed, v_xp_earned;
end;
$$;

revoke execute on function public.complete_lesson(uuid, integer) from public, anon;
revoke execute on function public.review_vocabulary(uuid, integer) from public, anon;
revoke execute on function public.save_vocabulary(uuid) from public, anon;
revoke execute on function public.submit_lesson_quiz(uuid, jsonb, integer) from public, anon;

grant execute on function public.complete_lesson(uuid, integer) to authenticated;
grant execute on function public.review_vocabulary(uuid, integer) to authenticated;
grant execute on function public.save_vocabulary(uuid) to authenticated;
grant execute on function public.submit_lesson_quiz(uuid, jsonb, integer) to authenticated;
