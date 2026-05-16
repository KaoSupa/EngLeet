-- Profiles own the timezone column; user_settings does not.

create or replace function public.award_xp_internal(
  p_user_id uuid,
  p_amount integer,
  p_source public.xp_source,
  p_reference_id uuid default null,
  p_description text default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inserted_amount integer := 0;
  v_dedupe_date date;
begin
  perform public.ensure_user_stats_internal(p_user_id);

  if p_amount <= 0 then
    return 0;
  end if;

  select (now() at time zone coalesce(p.timezone, 'Asia/Bangkok'))::date
  into v_dedupe_date
  from public.profiles p
  where p.id = p_user_id;

  if v_dedupe_date is null then
    v_dedupe_date := (now() at time zone 'Asia/Bangkok')::date;
  end if;

  insert into public.user_xp_ledger (
    user_id,
    amount,
    source,
    reference_id,
    dedupe_date,
    description
  )
  values (
    p_user_id,
    p_amount,
    p_source,
    p_reference_id,
    case when p_reference_id is null then v_dedupe_date else null end,
    p_description
  )
  on conflict do nothing
  returning amount into v_inserted_amount;

  v_inserted_amount := coalesce(v_inserted_amount, 0);

  if v_inserted_amount > 0 then
    update public.user_stats
    set total_xp = total_xp + v_inserted_amount,
        level = public.calculate_level(total_xp + v_inserted_amount),
        updated_at = now()
    where user_id = p_user_id;
  end if;

  return v_inserted_amount;
end;
$$;

revoke execute on function public.award_xp_internal(
  uuid,
  integer,
  public.xp_source,
  uuid,
  text
) from public, anon, authenticated;
grant execute on function public.award_xp_internal(
  uuid,
  integer,
  public.xp_source,
  uuid,
  text
) to service_role;

create or replace function public.record_activity_internal(
  p_user_id uuid,
  p_xp_earned integer default 0,
  p_study_time_seconds integer default 0
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date;
  v_last_active_date date;
  v_current_streak integer;
begin
  perform public.ensure_user_stats_internal(p_user_id);

  select (now() at time zone coalesce(p.timezone, 'Asia/Bangkok'))::date
  into v_today
  from public.profiles p
  where p.id = p_user_id;

  if v_today is null then
    v_today := (now() at time zone 'Asia/Bangkok')::date;
  end if;

  insert into public.user_activity_days (
    user_id,
    activity_date,
    activities_count,
    xp_earned,
    study_time_seconds
  )
  values (
    p_user_id,
    v_today,
    1,
    greatest(p_xp_earned, 0),
    greatest(p_study_time_seconds, 0)
  )
  on conflict (user_id, activity_date) do update
  set activities_count = public.user_activity_days.activities_count + 1,
      xp_earned = public.user_activity_days.xp_earned + excluded.xp_earned,
      study_time_seconds = public.user_activity_days.study_time_seconds + excluded.study_time_seconds,
      updated_at = now();

  select last_active_date, current_streak
  into v_last_active_date, v_current_streak
  from public.user_stats
  where user_id = p_user_id;

  if v_last_active_date = v_today then
    v_current_streak := greatest(coalesce(v_current_streak, 1), 1);
  elsif v_last_active_date = v_today - 1 then
    v_current_streak := coalesce(v_current_streak, 0) + 1;
  else
    v_current_streak := 1;
  end if;

  update public.user_stats
  set current_streak = v_current_streak,
      longest_streak = greatest(longest_streak, v_current_streak),
      last_active_date = v_today,
      total_study_time_seconds = total_study_time_seconds + greatest(p_study_time_seconds, 0),
      updated_at = now()
  where user_id = p_user_id;
end;
$$;

revoke execute on function public.record_activity_internal(uuid, integer, integer)
from public, anon, authenticated;
grant execute on function public.record_activity_internal(uuid, integer, integer)
to service_role;
