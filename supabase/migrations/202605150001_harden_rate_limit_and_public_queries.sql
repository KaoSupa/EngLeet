-- Production hardening:
-- 1. Put API rate limits in Postgres so limits are shared across serverless
--    instances and regions.
-- 2. Close legacy browser-callable learning RPCs now that Next.js routes call
--    the service-role-only server_* RPCs.
-- 3. Add indexes for read-heavy public lesson/vocabulary queries.

create table if not exists public.api_rate_limits (
  rate_key text primary key,
  request_count integer not null default 0 check (request_count >= 0),
  reset_at timestamptz not null,
  updated_at timestamptz not null default now()
);

alter table public.api_rate_limits enable row level security;
revoke all on public.api_rate_limits from public, anon, authenticated;
grant select, insert, update, delete on public.api_rate_limits to service_role;

create or replace function public.server_take_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns table (
  allowed boolean,
  retry_after_seconds integer
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_reset_at timestamptz;
  v_count integer;
  v_window interval;
begin
  if nullif(trim(p_key), '') is null then
    raise exception 'Rate limit key is required';
  end if;

  if p_limit is null or p_limit < 1 or p_limit > 10000 then
    raise exception 'Rate limit is invalid';
  end if;

  if p_window_seconds is null or p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'Rate limit window is invalid';
  end if;

  v_window := make_interval(secs => p_window_seconds);

  perform pg_advisory_xact_lock(hashtextextended(p_key, 0));

  select request_count, reset_at
  into v_count, v_reset_at
  from public.api_rate_limits
  where rate_key = p_key
  for update;

  if not found or v_reset_at <= v_now then
    insert into public.api_rate_limits (
      rate_key,
      request_count,
      reset_at,
      updated_at
    )
    values (
      p_key,
      1,
      v_now + v_window,
      v_now
    )
    on conflict (rate_key) do update
    set request_count = 1,
        reset_at = excluded.reset_at,
        updated_at = excluded.updated_at;

    return query select true, 0;
    return;
  end if;

  if v_count >= p_limit then
    return query
    select
      false,
      greatest(1, ceil(extract(epoch from (v_reset_at - v_now)))::integer);
    return;
  end if;

  update public.api_rate_limits
  set request_count = request_count + 1,
      updated_at = v_now
  where rate_key = p_key;

  delete from public.api_rate_limits
  where reset_at < v_now - interval '1 day';

  return query select true, 0;
end;
$$;

revoke execute on function public.server_take_rate_limit(text, integer, integer)
from public, anon, authenticated;
grant execute on function public.server_take_rate_limit(text, integer, integer)
to service_role;

revoke execute on function public.complete_lesson(uuid, integer)
from public, anon, authenticated;
revoke execute on function public.review_vocabulary(uuid, integer)
from public, anon, authenticated;
revoke execute on function public.save_vocabulary(uuid)
from public, anon, authenticated;
revoke execute on function public.submit_lesson_quiz(uuid, jsonb, integer)
from public, anon, authenticated;

create index if not exists lessons_public_listing_idx
on public.lessons (status, published_at, order_index, title)
where status = 'published'::public.content_status;

create index if not exists lessons_public_slug_idx
on public.lessons (slug, status, published_at);

create index if not exists quiz_questions_lesson_id_idx
on public.quiz_questions (lesson_id, order_index);

create index if not exists quiz_attempts_lesson_id_idx
on public.quiz_attempts (lesson_id, created_at);

create index if not exists user_progress_lesson_status_idx
on public.user_progress (lesson_id, status, user_id);

create index if not exists vocabulary_public_listing_idx
on public.vocabulary (status, review_status, frequency_rank, word)
where status = 'published'::public.content_status
  and review_status = 'approved'::public.vocabulary_review_status;

create index if not exists vocabulary_public_filters_idx
on public.vocabulary (
  status,
  review_status,
  cefr_level,
  part_of_speech,
  difficulty,
  frequency_rank
);

create index if not exists vocabulary_tags_gin_idx
on public.vocabulary using gin (tags);

create index if not exists user_vocabulary_user_vocabulary_idx
on public.user_vocabulary (user_id, vocabulary_id);
