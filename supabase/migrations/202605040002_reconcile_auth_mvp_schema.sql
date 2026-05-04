-- Reconcile the MVP auth/profile schema expected by the current application.
-- This migration is intentionally idempotent so it can run safely on databases
-- that already match production, and on fresh databases replaying older MVP SQL.

do $$
begin
  create type public.user_role as enum ('user', 'admin');
exception
  when duplicate_object then null;
end $$;

grant usage on type public.user_role to anon, authenticated, service_role;

do $$
begin
  if to_regclass('public.profiles') is null then
    raise exception 'public.profiles must exist before reconciling auth schema';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'target_level'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'preferred_cefr_level'
  ) then
    alter table public.profiles
      rename column target_level to preferred_cefr_level;
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'preferred_cefr_level'
  ) then
    alter table public.profiles
      add column preferred_cefr_level public.cefr_level;
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'role'
  ) then
    alter table public.profiles
      add column role public.user_role not null default 'user';
  elsif exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'role'
      and udt_name <> 'user_role'
  ) then
    if exists (
      select 1
      from public.profiles
      where role::text not in ('student', 'user', 'admin')
    ) then
      raise exception 'Unsupported legacy profile roles found. Resolve them manually before converting profiles.role to public.user_role.';
    end if;

    alter table public.profiles
      alter column role drop default;

    alter table public.profiles
      alter column role type public.user_role
      using (
        case role::text
          when 'admin' then 'admin'::public.user_role
          when 'user' then 'user'::public.user_role
          else 'user'::public.user_role
        end
      );

    alter table public.profiles
      alter column role set default 'user';
  end if;
end $$;

create table if not exists public.user_stats (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  total_xp bigint not null default 0,
  level integer not null default 1,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  lessons_completed integer not null default 0,
  quizzes_completed integer not null default 0,
  vocab_mastered integer not null default 0,
  total_study_time_seconds bigint not null default 0,
  last_active_date date,
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'user_stats'
      and column_name = 'quizzes_completed'
  ) then
    alter table public.user_stats
      add column quizzes_completed integer not null default 0;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'user_stats'
      and column_name = 'vocab_mastered'
  ) then
    alter table public.user_stats
      add column vocab_mastered integer not null default 0;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'user_stats'
      and column_name = 'total_study_time_seconds'
  ) then
    alter table public.user_stats
      add column total_study_time_seconds bigint not null default 0;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'user_stats'
      and column_name = 'last_active_date'
  ) then
    alter table public.user_stats
      add column last_active_date date;
  end if;
end $$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.is_admin(p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = p_user_id
      and role = 'admin'
  );
$$;

create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role is distinct from new.role
     and not public.is_admin(auth.uid()) then
    raise exception 'Only admins can change user roles';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_role_escalation on public.profiles;
create trigger prevent_role_escalation
before update on public.profiles
for each row execute function public.prevent_role_escalation();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  if to_regclass('public.user_settings') is not null then
    insert into public.user_settings (user_id)
    values (new.id)
    on conflict (user_id) do nothing;
  end if;

  insert into public.user_stats (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.user_stats enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "profiles_admin_select" on public.profiles;
create policy "profiles_admin_select"
on public.profiles for select
using (public.is_admin());

drop policy if exists "user_stats_select_own" on public.user_stats;
create policy "user_stats_select_own"
on public.user_stats for select
using (auth.uid() = user_id);

drop policy if exists "user_stats_admin_select" on public.user_stats;
create policy "user_stats_admin_select"
on public.user_stats for select
using (public.is_admin());

grant select, update on public.profiles to authenticated;
grant select on public.user_stats to authenticated;
