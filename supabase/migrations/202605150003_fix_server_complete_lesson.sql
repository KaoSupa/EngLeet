-- Fix PL/pgSQL name ambiguity in server_complete_lesson.
-- Output columns such as lesson_id are variables inside the function, so table
-- columns must be qualified.

create or replace function public.server_complete_lesson(
  p_user_id uuid,
  p_lesson_id uuid,
  p_study_time_seconds integer default 0
)
returns table (
  lesson_id uuid,
  status public.lesson_status,
  xp_earned integer
)
language plpgsql
security invoker
set search_path to ''
as $$
declare
  v_xp_reward integer;
  v_already_completed boolean := false;
  v_xp_earned integer := 0;
  v_study_time_seconds integer := least(greatest(coalesce(p_study_time_seconds, 0), 0), 14400);
  v_recorded_study_time_seconds integer;
begin
  if p_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_lesson_id is null then
    raise exception 'Lesson is required';
  end if;

  if not exists (select 1 from public.profiles p where p.id = p_user_id) then
    raise exception 'User not found';
  end if;

  perform public.ensure_user_stats_internal(p_user_id);

  select l.xp_reward
  into v_xp_reward
  from public.lessons l
  join public.units u on u.id = l.unit_id
  join public.courses c on c.id = u.course_id
  where l.id = p_lesson_id
    and l.status = 'published'::public.content_status
    and u.status = 'published'::public.content_status
    and c.status = 'published'::public.content_status
    and (l.published_at is null or l.published_at <= now())
    and (u.published_at is null or u.published_at <= now())
    and (c.published_at is null or c.published_at <= now());

  if v_xp_reward is null then
    raise exception 'Lesson is not available';
  end if;

  select exists (
    select 1
    from public.user_progress up
    where up.user_id = p_user_id
      and up.lesson_id = p_lesson_id
      and up.status = 'completed'::public.lesson_status
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
    p_user_id,
    p_lesson_id,
    'completed'::public.lesson_status,
    now(),
    now(),
    v_recorded_study_time_seconds
  )
  on conflict on constraint user_progress_pkey do update
  set status = 'completed'::public.lesson_status,
      completed_at = coalesce(public.user_progress.completed_at, now()),
      time_spent_seconds = public.user_progress.time_spent_seconds + excluded.time_spent_seconds,
      updated_at = now();

  if not v_already_completed then
    v_xp_earned := public.award_xp_internal(
      p_user_id,
      v_xp_reward,
      'lesson_complete'::public.xp_source,
      p_lesson_id,
      'Lesson completed'
    );

    update public.user_stats us
    set lessons_completed = us.lessons_completed + 1,
        updated_at = now()
    where us.user_id = p_user_id;
  end if;

  if (not v_already_completed) or v_recorded_study_time_seconds > 0 then
    perform public.record_activity_internal(
      p_user_id,
      v_xp_earned,
      v_recorded_study_time_seconds
    );
  end if;

  return query
  select p_lesson_id, 'completed'::public.lesson_status, v_xp_earned;
end;
$$;

revoke execute on function public.server_complete_lesson(uuid, uuid, integer)
from public, anon, authenticated;
grant execute on function public.server_complete_lesson(uuid, uuid, integer)
to service_role;
