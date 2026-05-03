-- Engleet production starter schema for Supabase
-- Run this file in Supabase SQL Editor, or via `supabase db push`.
-- It is intentionally additive: it creates tables/policies without dropping data.

create extension if not exists pgcrypto;
create extension if not exists unaccent;
create extension if not exists pg_trgm;

do $$
begin
  create type public.app_role as enum ('student', 'admin', 'super_admin');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.cefr_level as enum ('pre_a1', 'a1', 'a2', 'b1', 'b2', 'c1', 'c2');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.content_status as enum ('draft', 'review', 'published', 'archived');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.lesson_progress_status as enum ('not_started', 'in_progress', 'completed');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.quiz_question_type as enum (
    'multiple_choice',
    'true_false',
    'fill_blank',
    'matching',
    'ordering',
    'short_answer'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.quiz_attempt_status as enum ('in_progress', 'submitted', 'graded', 'abandoned');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.vocab_learning_status as enum ('new', 'learning', 'reviewing', 'mastered', 'ignored');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.content_ref_type as enum ('lesson', 'quiz', 'quiz_question', 'news_article');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.media_kind as enum ('image', 'video', 'audio', 'document', 'embed');
exception when duplicate_object then null;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.slugify(value text)
returns text
language sql
stable
as $$
  select trim(both '-' from regexp_replace(lower(unaccent(coalesce(value, ''))), '[^a-z0-9]+', '-', 'g'));
$$;

create or replace function public.normalize_english_term(value text)
returns text
language sql
stable
as $$
  select regexp_replace(lower(unaccent(trim(coalesce(value, '')))), '\s+', ' ', 'g');
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique check (username is null or username ~ '^[a-zA-Z0-9_]{3,30}$'),
  display_name text,
  avatar_url text,
  bio text,
  native_language text default 'th',
  learning_language text default 'en',
  target_level public.cefr_level,
  role public.app_role not null default 'student',
  timezone text not null default 'Asia/Bangkok',
  onboarded_at timestamptz,
  last_seen_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  daily_goal_minutes integer not null default 15 check (daily_goal_minutes between 1 and 600),
  daily_goal_xp integer not null default 50 check (daily_goal_xp between 1 and 10000),
  tts_voice text,
  ui_locale text not null default 'th',
  email_notifications boolean not null default true,
  push_notifications boolean not null default false,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_progress_summary (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  total_xp integer not null default 0 check (total_xp >= 0),
  level integer not null default 1 check (level >= 1),
  lessons_completed integer not null default 0 check (lessons_completed >= 0),
  quizzes_completed integer not null default 0 check (quizzes_completed >= 0),
  words_mastered integer not null default 0 check (words_mastered >= 0),
  study_minutes integer not null default 0 check (study_minutes >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_daily_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  activity_date date not null,
  xp_earned integer not null default 0 check (xp_earned >= 0),
  study_minutes integer not null default 0 check (study_minutes >= 0),
  lessons_completed integer not null default 0 check (lessons_completed >= 0),
  quizzes_completed integer not null default 0 check (quizzes_completed >= 0),
  words_reviewed integer not null default 0 check (words_reviewed >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, activity_date)
);

create table if not exists public.user_streaks (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  current_streak integer not null default 0 check (current_streak >= 0),
  longest_streak integer not null default 0 check (longest_streak >= 0),
  last_activity_date date,
  streak_freezes integer not null default 0 check (streak_freezes >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null,
  xp integer not null check (xp >= 0),
  source_type public.content_ref_type,
  source_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.lesson_categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.lesson_categories(id) on delete set null,
  slug text not null unique,
  name text not null,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.lesson_categories(id) on delete set null,
  author_id uuid references public.profiles(id) on delete set null,
  slug text not null unique,
  title text not null,
  excerpt text,
  cover_image_url text,
  level public.cefr_level,
  status public.content_status not null default 'draft',
  estimated_minutes integer not null default 10 check (estimated_minutes > 0),
  xp_reward integer not null default 25 check (xp_reward >= 0),
  content jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  tags text[] not null default '{}'::text[],
  sort_order integer not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lesson_media (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references public.lessons(id) on delete cascade,
  uploaded_by uuid references public.profiles(id) on delete set null,
  kind public.media_kind not null,
  storage_bucket text,
  storage_path text,
  external_url text,
  alt_text text,
  caption text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (storage_path is not null or external_url is not null)
);

create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  status public.lesson_progress_status not null default 'not_started',
  progress_percent numeric(5,2) not null default 0 check (progress_percent between 0 and 100),
  last_position_seconds integer not null default 0 check (last_position_seconds >= 0),
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references public.lessons(id) on delete set null,
  author_id uuid references public.profiles(id) on delete set null,
  slug text not null unique,
  title text not null,
  description text,
  level public.cefr_level,
  status public.content_status not null default 'draft',
  time_limit_seconds integer check (time_limit_seconds is null or time_limit_seconds > 0),
  passing_score_percent numeric(5,2) not null default 70 check (passing_score_percent between 0 and 100),
  xp_reward integer not null default 25 check (xp_reward >= 0),
  settings jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  question_type public.quiz_question_type not null,
  prompt jsonb not null,
  options jsonb not null default '[]'::jsonb,
  correct_answer jsonb not null,
  explanation jsonb,
  points integer not null default 1 check (points > 0),
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status public.quiz_attempt_status not null default 'in_progress',
  score numeric(8,2),
  max_score numeric(8,2),
  score_percent numeric(5,2) check (score_percent is null or score_percent between 0 and 100),
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  graded_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.quiz_attempts(id) on delete cascade,
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  answer jsonb not null,
  is_correct boolean,
  points_awarded numeric(8,2),
  feedback jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (attempt_id, question_id)
);

create table if not exists public.vocab_terms (
  id uuid primary key default gen_random_uuid(),
  language text not null default 'en',
  term text not null,
  normalized_term text not null,
  slug text not null,
  part_of_speech text,
  phonetic text,
  audio_url text,
  level public.cefr_level,
  frequency_rank integer check (frequency_rank is null or frequency_rank > 0),
  definitions jsonb not null default '[]'::jsonb,
  translations jsonb not null default '{}'::jsonb,
  examples jsonb not null default '[]'::jsonb,
  tags text[] not null default '{}'::text[],
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vocab_relations (
  id uuid primary key default gen_random_uuid(),
  term_id uuid not null references public.vocab_terms(id) on delete cascade,
  related_term_id uuid not null references public.vocab_terms(id) on delete cascade,
  relation_type text not null check (relation_type in ('synonym', 'antonym', 'derived', 'phrase', 'confusable')),
  created_at timestamptz not null default now(),
  unique (term_id, related_term_id, relation_type),
  check (term_id <> related_term_id)
);

create table if not exists public.user_vocab_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  term_id uuid not null references public.vocab_terms(id) on delete cascade,
  status public.vocab_learning_status not null default 'new',
  ease_factor numeric(4,2) not null default 2.50 check (ease_factor >= 1.30),
  interval_days integer not null default 0 check (interval_days >= 0),
  repetitions integer not null default 0 check (repetitions >= 0),
  due_at timestamptz,
  last_reviewed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, term_id)
);

create table if not exists public.content_vocabulary_links (
  id uuid primary key default gen_random_uuid(),
  content_type public.content_ref_type not null,
  content_id uuid not null,
  term_id uuid not null references public.vocab_terms(id) on delete cascade,
  context_text text,
  importance_score numeric(5,2) not null default 1 check (importance_score >= 0),
  created_at timestamptz not null default now(),
  unique (content_type, content_id, term_id)
);

create table if not exists public.dictionary_lookups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  selected_text text not null,
  normalized_text text not null,
  term_id uuid references public.vocab_terms(id) on delete set null,
  source_type public.content_ref_type,
  source_id uuid,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.news_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  base_url text,
  api_provider text,
  default_language text not null default 'en',
  is_enabled boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.news_articles (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.news_sources(id) on delete set null,
  external_id text,
  url text,
  title text not null,
  summary text,
  content text,
  image_url text,
  author text,
  language text not null default 'en',
  level public.cefr_level,
  status public.content_status not null default 'draft',
  raw_payload jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  imported_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_id, external_id),
  unique (url)
);

create table if not exists public.news_article_translations (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.news_articles(id) on delete cascade,
  target_language text not null default 'th',
  translated_title text,
  translated_summary text,
  translated_content text,
  provider text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (article_id, target_language)
);

create table if not exists public.tts_assets (
  id uuid primary key default gen_random_uuid(),
  content_type public.content_ref_type not null,
  content_id uuid not null,
  language text not null default 'en',
  voice text,
  text_hash text not null,
  storage_bucket text,
  storage_path text,
  external_url text,
  duration_seconds numeric(10,2),
  provider text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (storage_path is not null or external_url is not null)
);

create index if not exists profiles_username_trgm_idx on public.profiles using gin (username gin_trgm_ops);
create index if not exists lessons_status_published_idx on public.lessons (status, published_at desc);
create index if not exists lessons_category_idx on public.lessons (category_id);
create index if not exists lessons_title_trgm_idx on public.lessons using gin (title gin_trgm_ops);
create index if not exists lesson_progress_user_idx on public.lesson_progress (user_id, status);
create index if not exists quizzes_status_published_idx on public.quizzes (status, published_at desc);
create index if not exists quiz_questions_quiz_sort_idx on public.quiz_questions (quiz_id, sort_order);
create index if not exists quiz_attempts_user_quiz_idx on public.quiz_attempts (user_id, quiz_id, started_at desc);
create index if not exists vocab_terms_normalized_trgm_idx on public.vocab_terms using gin (normalized_term gin_trgm_ops);
create index if not exists vocab_terms_language_level_idx on public.vocab_terms (language, level);
create unique index if not exists vocab_terms_unique_language_term_pos_idx
on public.vocab_terms (language, normalized_term, coalesce(part_of_speech, ''));
create index if not exists user_vocab_due_idx on public.user_vocab_items (user_id, due_at) where status in ('learning', 'reviewing');
create index if not exists content_vocab_content_idx on public.content_vocabulary_links (content_type, content_id);
create index if not exists dictionary_lookups_user_created_idx on public.dictionary_lookups (user_id, created_at desc);
create index if not exists news_articles_status_published_idx on public.news_articles (status, published_at desc);
create index if not exists news_articles_title_trgm_idx on public.news_articles using gin (title gin_trgm_ops);
create index if not exists xp_events_user_created_idx on public.xp_events (user_id, created_at desc);
create unique index if not exists tts_assets_unique_content_voice_hash_idx
on public.tts_assets (content_type, content_id, language, coalesce(voice, ''), text_hash);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_user_settings_updated_at on public.user_settings;
create trigger set_user_settings_updated_at
before update on public.user_settings
for each row execute function public.set_updated_at();

drop trigger if exists set_user_daily_activity_updated_at on public.user_daily_activity;
create trigger set_user_daily_activity_updated_at
before update on public.user_daily_activity
for each row execute function public.set_updated_at();

drop trigger if exists set_lesson_categories_updated_at on public.lesson_categories;
create trigger set_lesson_categories_updated_at
before update on public.lesson_categories
for each row execute function public.set_updated_at();

drop trigger if exists set_lessons_updated_at on public.lessons;
create trigger set_lessons_updated_at
before update on public.lessons
for each row execute function public.set_updated_at();

drop trigger if exists set_lesson_progress_updated_at on public.lesson_progress;
create trigger set_lesson_progress_updated_at
before update on public.lesson_progress
for each row execute function public.set_updated_at();

drop trigger if exists set_quizzes_updated_at on public.quizzes;
create trigger set_quizzes_updated_at
before update on public.quizzes
for each row execute function public.set_updated_at();

drop trigger if exists set_quiz_questions_updated_at on public.quiz_questions;
create trigger set_quiz_questions_updated_at
before update on public.quiz_questions
for each row execute function public.set_updated_at();

drop trigger if exists set_quiz_answers_updated_at on public.quiz_answers;
create trigger set_quiz_answers_updated_at
before update on public.quiz_answers
for each row execute function public.set_updated_at();

drop trigger if exists set_vocab_terms_updated_at on public.vocab_terms;
create trigger set_vocab_terms_updated_at
before update on public.vocab_terms
for each row execute function public.set_updated_at();

drop trigger if exists set_user_vocab_items_updated_at on public.user_vocab_items;
create trigger set_user_vocab_items_updated_at
before update on public.user_vocab_items
for each row execute function public.set_updated_at();

drop trigger if exists set_news_sources_updated_at on public.news_sources;
create trigger set_news_sources_updated_at
before update on public.news_sources
for each row execute function public.set_updated_at();

drop trigger if exists set_news_articles_updated_at on public.news_articles;
create trigger set_news_articles_updated_at
before update on public.news_articles
for each row execute function public.set_updated_at();

drop trigger if exists set_news_article_translations_updated_at on public.news_article_translations;
create trigger set_news_article_translations_updated_at
before update on public.news_article_translations
for each row execute function public.set_updated_at();

create or replace function public.prepare_vocab_term()
returns trigger
language plpgsql
as $$
begin
  new.normalized_term = public.normalize_english_term(new.term);
  if new.slug is null or new.slug = '' then
    new.slug = public.slugify(new.term);
  end if;
  return new;
end;
$$;

drop trigger if exists prepare_vocab_term_before_write on public.vocab_terms;
create trigger prepare_vocab_term_before_write
before insert or update of term, slug on public.vocab_terms
for each row execute function public.prepare_vocab_term();

create or replace function public.is_admin(user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = user_id
      and role in ('admin', 'super_admin')
  );
$$;

create or replace function public.prevent_profile_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role is distinct from new.role
     and coalesce(auth.role(), '') <> 'service_role'
     and not public.is_admin(auth.uid()) then
    raise exception 'Only admins can change profile roles';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_profile_role_escalation_before_update on public.profiles;
create trigger prevent_profile_role_escalation_before_update
before update of role on public.profiles
for each row execute function public.prevent_profile_role_escalation();

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
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.user_progress_summary (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.user_streaks (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.prevent_quiz_attempt_grade_tampering()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  trusted_writer boolean := coalesce(auth.role(), '') = 'service_role' or public.is_admin(auth.uid());
begin
  if not trusted_writer then
    if tg_op = 'INSERT'
       and (
         new.score is not null
         or new.max_score is not null
         or new.score_percent is not null
         or new.graded_at is not null
         or new.status = 'graded'
       ) then
      raise exception 'Quiz scores must be written by a trusted server process';
    end if;

    if tg_op = 'UPDATE'
       and (
         old.score is distinct from new.score
         or old.max_score is distinct from new.max_score
         or old.score_percent is distinct from new.score_percent
         or old.graded_at is distinct from new.graded_at
         or new.status = 'graded'
       ) then
      raise exception 'Quiz scores must be written by a trusted server process';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_quiz_attempt_grade_tampering_before_write on public.quiz_attempts;
create trigger prevent_quiz_attempt_grade_tampering_before_write
before insert or update on public.quiz_attempts
for each row execute function public.prevent_quiz_attempt_grade_tampering();

create or replace function public.record_learning_activity(
  p_event_type text,
  p_xp integer default 0,
  p_study_minutes integer default 0,
  p_source_type public.content_ref_type default null,
  p_source_id uuid default null,
  p_lessons_completed integer default 0,
  p_quizzes_completed integer default 0,
  p_words_reviewed integer default 0,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  today date := (now() at time zone 'Asia/Bangkok')::date;
  new_current_streak integer;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_xp < 0 or p_study_minutes < 0 or p_lessons_completed < 0 or p_quizzes_completed < 0 or p_words_reviewed < 0 then
    raise exception 'Activity values cannot be negative';
  end if;

  insert into public.xp_events (user_id, event_type, xp, source_type, source_id, metadata)
  values (current_user_id, p_event_type, p_xp, p_source_type, p_source_id, coalesce(p_metadata, '{}'::jsonb));

  insert into public.user_daily_activity (
    user_id,
    activity_date,
    xp_earned,
    study_minutes,
    lessons_completed,
    quizzes_completed,
    words_reviewed
  )
  values (
    current_user_id,
    today,
    p_xp,
    p_study_minutes,
    p_lessons_completed,
    p_quizzes_completed,
    p_words_reviewed
  )
  on conflict (user_id, activity_date) do update
  set xp_earned = public.user_daily_activity.xp_earned + excluded.xp_earned,
      study_minutes = public.user_daily_activity.study_minutes + excluded.study_minutes,
      lessons_completed = public.user_daily_activity.lessons_completed + excluded.lessons_completed,
      quizzes_completed = public.user_daily_activity.quizzes_completed + excluded.quizzes_completed,
      words_reviewed = public.user_daily_activity.words_reviewed + excluded.words_reviewed,
      updated_at = now();

  insert into public.user_progress_summary (
    user_id,
    total_xp,
    level,
    lessons_completed,
    quizzes_completed,
    study_minutes
  )
  values (
    current_user_id,
    p_xp,
    greatest(1, floor(sqrt(greatest(p_xp, 0) / 100.0))::integer + 1),
    p_lessons_completed,
    p_quizzes_completed,
    p_study_minutes
  )
  on conflict (user_id) do update
  set total_xp = public.user_progress_summary.total_xp + excluded.total_xp,
      level = greatest(1, floor(sqrt(greatest(public.user_progress_summary.total_xp + excluded.total_xp, 0) / 100.0))::integer + 1),
      lessons_completed = public.user_progress_summary.lessons_completed + excluded.lessons_completed,
      quizzes_completed = public.user_progress_summary.quizzes_completed + excluded.quizzes_completed,
      study_minutes = public.user_progress_summary.study_minutes + excluded.study_minutes,
      updated_at = now();

  insert into public.user_streaks (user_id, current_streak, longest_streak, last_activity_date)
  values (current_user_id, 1, 1, today)
  on conflict (user_id) do update
  set current_streak = case
        when public.user_streaks.last_activity_date = today then public.user_streaks.current_streak
        when public.user_streaks.last_activity_date = today - 1 then public.user_streaks.current_streak + 1
        else 1
      end,
      last_activity_date = greatest(coalesce(public.user_streaks.last_activity_date, today), today),
      updated_at = now();

  select current_streak
  into new_current_streak
  from public.user_streaks
  where user_id = current_user_id;

  update public.user_streaks
  set longest_streak = greatest(longest_streak, new_current_streak)
  where user_id = current_user_id;
end;
$$;

alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.user_progress_summary enable row level security;
alter table public.user_daily_activity enable row level security;
alter table public.user_streaks enable row level security;
alter table public.xp_events enable row level security;
alter table public.lesson_categories enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_media enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.quiz_answers enable row level security;
alter table public.vocab_terms enable row level security;
alter table public.vocab_relations enable row level security;
alter table public.user_vocab_items enable row level security;
alter table public.content_vocabulary_links enable row level security;
alter table public.dictionary_lookups enable row level security;
alter table public.news_sources enable row level security;
alter table public.news_articles enable row level security;
alter table public.news_article_translations enable row level security;
alter table public.tts_assets enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles for select
using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_insert_admin" on public.profiles;
create policy "profiles_insert_admin"
on public.profiles for insert
with check (public.is_admin());

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
on public.profiles for update
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

drop policy if exists "user_settings_own_all" on public.user_settings;
create policy "user_settings_own_all"
on public.user_settings for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "user_progress_select_own_or_admin" on public.user_progress_summary;
create policy "user_progress_select_own_or_admin"
on public.user_progress_summary for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "user_daily_activity_select_own_or_admin" on public.user_daily_activity;
create policy "user_daily_activity_select_own_or_admin"
on public.user_daily_activity for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "user_streaks_select_own_or_admin" on public.user_streaks;
create policy "user_streaks_select_own_or_admin"
on public.user_streaks for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "xp_events_select_own_or_admin" on public.xp_events;
create policy "xp_events_select_own_or_admin"
on public.xp_events for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "lesson_categories_read_active_or_admin" on public.lesson_categories;
create policy "lesson_categories_read_active_or_admin"
on public.lesson_categories for select
using (is_active or public.is_admin());

drop policy if exists "lesson_categories_admin_write" on public.lesson_categories;
create policy "lesson_categories_admin_write"
on public.lesson_categories for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "lessons_read_published_or_admin" on public.lessons;
create policy "lessons_read_published_or_admin"
on public.lessons for select
using (
  public.is_admin()
  or (status = 'published' and (published_at is null or published_at <= now()))
);

drop policy if exists "lessons_admin_write" on public.lessons;
create policy "lessons_admin_write"
on public.lessons for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "lesson_media_read_published_lesson_or_admin" on public.lesson_media;
create policy "lesson_media_read_published_lesson_or_admin"
on public.lesson_media for select
using (
  public.is_admin()
  or exists (
    select 1 from public.lessons
    where lessons.id = lesson_media.lesson_id
      and lessons.status = 'published'
      and (lessons.published_at is null or lessons.published_at <= now())
  )
);

drop policy if exists "lesson_media_admin_write" on public.lesson_media;
create policy "lesson_media_admin_write"
on public.lesson_media for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "lesson_progress_own_all" on public.lesson_progress;
create policy "lesson_progress_own_all"
on public.lesson_progress for all
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "quizzes_read_published_or_admin" on public.quizzes;
create policy "quizzes_read_published_or_admin"
on public.quizzes for select
using (
  public.is_admin()
  or (status = 'published' and (published_at is null or published_at <= now()))
);

drop policy if exists "quizzes_admin_write" on public.quizzes;
create policy "quizzes_admin_write"
on public.quizzes for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "quiz_questions_read_when_quiz_visible" on public.quiz_questions;
create policy "quiz_questions_read_when_quiz_visible"
on public.quiz_questions for select
using (
  public.is_admin()
  or exists (
    select 1 from public.quizzes
    where quizzes.id = quiz_questions.quiz_id
      and quizzes.status = 'published'
      and (quizzes.published_at is null or quizzes.published_at <= now())
  )
);

drop policy if exists "quiz_questions_admin_write" on public.quiz_questions;
create policy "quiz_questions_admin_write"
on public.quiz_questions for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "quiz_attempts_own_or_admin" on public.quiz_attempts;
create policy "quiz_attempts_own_or_admin"
on public.quiz_attempts for all
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "quiz_answers_own_attempt_or_admin" on public.quiz_answers;
create policy "quiz_answers_own_attempt_or_admin"
on public.quiz_answers for all
using (
  public.is_admin()
  or exists (
    select 1 from public.quiz_attempts
    where quiz_attempts.id = quiz_answers.attempt_id
      and quiz_attempts.user_id = auth.uid()
  )
)
with check (
  public.is_admin()
  or exists (
    select 1 from public.quiz_attempts
    where quiz_attempts.id = quiz_answers.attempt_id
      and quiz_attempts.user_id = auth.uid()
  )
);

drop policy if exists "vocab_terms_public_read" on public.vocab_terms;
create policy "vocab_terms_public_read"
on public.vocab_terms for select
using (true);

drop policy if exists "vocab_terms_admin_write" on public.vocab_terms;
create policy "vocab_terms_admin_write"
on public.vocab_terms for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "vocab_relations_public_read" on public.vocab_relations;
create policy "vocab_relations_public_read"
on public.vocab_relations for select
using (true);

drop policy if exists "vocab_relations_admin_write" on public.vocab_relations;
create policy "vocab_relations_admin_write"
on public.vocab_relations for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "user_vocab_items_own_all" on public.user_vocab_items;
create policy "user_vocab_items_own_all"
on public.user_vocab_items for all
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "content_vocabulary_links_public_read" on public.content_vocabulary_links;
create policy "content_vocabulary_links_public_read"
on public.content_vocabulary_links for select
using (true);

drop policy if exists "content_vocabulary_links_admin_write" on public.content_vocabulary_links;
create policy "content_vocabulary_links_admin_write"
on public.content_vocabulary_links for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "dictionary_lookups_own_insert" on public.dictionary_lookups;
create policy "dictionary_lookups_own_insert"
on public.dictionary_lookups for insert
with check (user_id = auth.uid() or user_id is null);

drop policy if exists "dictionary_lookups_select_own_or_admin" on public.dictionary_lookups;
create policy "dictionary_lookups_select_own_or_admin"
on public.dictionary_lookups for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "news_sources_read_enabled_or_admin" on public.news_sources;
create policy "news_sources_read_enabled_or_admin"
on public.news_sources for select
using (is_enabled or public.is_admin());

drop policy if exists "news_sources_admin_write" on public.news_sources;
create policy "news_sources_admin_write"
on public.news_sources for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "news_articles_read_published_or_admin" on public.news_articles;
create policy "news_articles_read_published_or_admin"
on public.news_articles for select
using (
  public.is_admin()
  or (status = 'published' and (published_at is null or published_at <= now()))
);

drop policy if exists "news_articles_admin_write" on public.news_articles;
create policy "news_articles_admin_write"
on public.news_articles for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "news_article_translations_read_when_article_visible" on public.news_article_translations;
create policy "news_article_translations_read_when_article_visible"
on public.news_article_translations for select
using (
  public.is_admin()
  or exists (
    select 1 from public.news_articles
    where news_articles.id = news_article_translations.article_id
      and news_articles.status = 'published'
      and (news_articles.published_at is null or news_articles.published_at <= now())
  )
);

drop policy if exists "news_article_translations_admin_write" on public.news_article_translations;
create policy "news_article_translations_admin_write"
on public.news_article_translations for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "tts_assets_public_read" on public.tts_assets;
create policy "tts_assets_public_read"
on public.tts_assets for select
using (true);

drop policy if exists "tts_assets_admin_write" on public.tts_assets;
create policy "tts_assets_admin_write"
on public.tts_assets for all
using (public.is_admin())
with check (public.is_admin());

grant usage on schema public to anon, authenticated, service_role;

grant usage on type public.app_role to anon, authenticated, service_role;
grant usage on type public.cefr_level to anon, authenticated, service_role;
grant usage on type public.content_status to anon, authenticated, service_role;
grant usage on type public.lesson_progress_status to anon, authenticated, service_role;
grant usage on type public.quiz_question_type to anon, authenticated, service_role;
grant usage on type public.quiz_attempt_status to anon, authenticated, service_role;
grant usage on type public.vocab_learning_status to anon, authenticated, service_role;
grant usage on type public.content_ref_type to anon, authenticated, service_role;
grant usage on type public.media_kind to anon, authenticated, service_role;

grant select on
  public.lesson_categories,
  public.lessons,
  public.lesson_media,
  public.quizzes,
  public.quiz_questions,
  public.vocab_terms,
  public.vocab_relations,
  public.content_vocabulary_links,
  public.news_sources,
  public.news_articles,
  public.news_article_translations,
  public.tts_assets
to anon;

grant insert on public.dictionary_lookups to anon;

grant all on
  public.profiles,
  public.user_settings,
  public.user_progress_summary,
  public.user_daily_activity,
  public.user_streaks,
  public.xp_events,
  public.lesson_categories,
  public.lessons,
  public.lesson_media,
  public.lesson_progress,
  public.quizzes,
  public.quiz_questions,
  public.quiz_attempts,
  public.quiz_answers,
  public.vocab_terms,
  public.vocab_relations,
  public.user_vocab_items,
  public.content_vocabulary_links,
  public.dictionary_lookups,
  public.news_sources,
  public.news_articles,
  public.news_article_translations,
  public.tts_assets
to authenticated, service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('lesson-media', 'lesson-media', true, 104857600, array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'audio/mpeg', 'audio/wav', 'application/pdf']),
  ('tts-audio', 'tts-audio', true, 52428800, array['audio/mpeg', 'audio/wav', 'audio/ogg'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "storage_public_read_engleet_assets" on storage.objects;
create policy "storage_public_read_engleet_assets"
on storage.objects for select
using (bucket_id in ('avatars', 'lesson-media', 'tts-audio'));

drop policy if exists "storage_users_manage_own_avatar" on storage.objects;
create policy "storage_users_manage_own_avatar"
on storage.objects for all
using (
  bucket_id = 'avatars'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "storage_admin_manage_content_assets" on storage.objects;
create policy "storage_admin_manage_content_assets"
on storage.objects for all
using (bucket_id in ('lesson-media', 'tts-audio') and public.is_admin())
with check (bucket_id in ('lesson-media', 'tts-audio') and public.is_admin());

revoke all on function public.record_learning_activity(
  text,
  integer,
  integer,
  public.content_ref_type,
  uuid,
  integer,
  integer,
  integer,
  jsonb
) from public;

grant execute on function public.record_learning_activity(
  text,
  integer,
  integer,
  public.content_ref_type,
  uuid,
  integer,
  integer,
  integer,
  jsonb
) to service_role;
