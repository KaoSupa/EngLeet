-- Move public search into parameterized database functions and add full-text
-- indexes for read-heavy search paths.

create index if not exists lessons_public_search_idx
on public.lessons using gin (
  to_tsvector(
    'english',
    coalesce(title, '') || ' ' || coalesce(description, '')
  )
)
where status = 'published'::public.content_status;

create index if not exists lessons_public_title_trgm_idx
on public.lessons using gin (lower(title) gin_trgm_ops)
where status = 'published'::public.content_status;

create index if not exists vocabulary_public_search_idx
on public.vocabulary using gin (
  to_tsvector(
    'english',
    coalesce(word, '') || ' ' ||
    coalesce(normalized_word, '') || ' ' ||
    coalesce(definition, '') || ' ' ||
    coalesce(definition_th, '')
  )
)
where status = 'published'::public.content_status
  and review_status = 'approved'::public.vocabulary_review_status;

create index if not exists vocabulary_public_word_trgm_idx
on public.vocabulary using gin (lower(word) gin_trgm_ops)
where status = 'published'::public.content_status
  and review_status = 'approved'::public.vocabulary_review_status;

create index if not exists vocabulary_public_normalized_word_trgm_idx
on public.vocabulary using gin (lower(normalized_word) gin_trgm_ops)
where status = 'published'::public.content_status
  and review_status = 'approved'::public.vocabulary_review_status;

create or replace function public.search_published_lessons(
  p_query text,
  p_level public.cefr_level default null,
  p_category public.lesson_category default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (
  id uuid,
  slug text,
  title text,
  description text,
  thumbnail_url text,
  cefr_level public.cefr_level,
  category public.lesson_category,
  estimated_minutes integer,
  xp_reward integer,
  published_at timestamptz,
  unit_title text,
  course_title text,
  question_count integer,
  total_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  with normalized as (
    select
      nullif(trim(p_query), '') as q,
      least(greatest(coalesce(p_limit, 50), 1), 100) as safe_limit,
      greatest(coalesce(p_offset, 0), 0) as safe_offset
  ),
  matched as (
    select
      l.id,
      l.slug,
      l.title,
      l.description,
      l.thumbnail_url,
      l.cefr_level,
      l.category,
      l.estimated_minutes,
      l.xp_reward,
      l.published_at,
      u.title as unit_title,
      c.title as course_title,
      (
        select count(*)::integer
        from public.quiz_questions qq
        where qq.lesson_id = l.id
      ) as question_count,
      case
        when normalized.q is null then 0
        else ts_rank_cd(
          to_tsvector(
            'english',
            coalesce(l.title, '') || ' ' || coalesce(l.description, '')
          ),
          plainto_tsquery('english', normalized.q)
        )
      end as rank
    from public.lessons l
    join public.units u on u.id = l.unit_id
    join public.courses c on c.id = u.course_id
    cross join normalized
    where l.status = 'published'::public.content_status
      and u.status = 'published'::public.content_status
      and c.status = 'published'::public.content_status
      and (l.published_at is null or l.published_at <= now())
      and (u.published_at is null or u.published_at <= now())
      and (c.published_at is null or c.published_at <= now())
      and (p_level is null or l.cefr_level = p_level)
      and (p_category is null or l.category = p_category)
      and (
        normalized.q is null
        or to_tsvector(
          'english',
          coalesce(l.title, '') || ' ' || coalesce(l.description, '')
        ) @@ plainto_tsquery('english', normalized.q)
        or lower(l.title) OPERATOR(public.%) lower(normalized.q)
      )
  )
  select
    matched.id,
    matched.slug,
    matched.title,
    matched.description,
    matched.thumbnail_url,
    matched.cefr_level,
    matched.category,
    matched.estimated_minutes,
    matched.xp_reward,
    matched.published_at,
    matched.unit_title,
    matched.course_title,
    matched.question_count,
    count(*) over () as total_count
  from matched
  cross join normalized
  order by
    matched.rank desc,
    matched.published_at desc nulls last,
    matched.title asc
  limit (select safe_limit from normalized)
  offset (select safe_offset from normalized);
$$;

revoke execute on function public.search_published_lessons(
  text,
  public.cefr_level,
  public.lesson_category,
  integer,
  integer
) from public;
grant execute on function public.search_published_lessons(
  text,
  public.cefr_level,
  public.lesson_category,
  integer,
  integer
) to anon, authenticated, service_role;

create or replace function public.search_published_vocabulary(
  p_query text,
  p_level public.cefr_level default null,
  p_part public.part_of_speech default null,
  p_tag text default null,
  p_list text default 'all',
  p_difficulty integer default null,
  p_saved_user_id uuid default null,
  p_saved_only boolean default false,
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (
  id uuid,
  word text,
  slug text,
  normalized_word text,
  definition text,
  definition_th text,
  example_sentence text,
  example_sentence_th text,
  part_of_speech public.part_of_speech,
  cefr_level public.cefr_level,
  difficulty integer,
  frequency_rank integer,
  phonetic text,
  tags text[],
  is_toeic boolean,
  is_oxford boolean,
  image_url text,
  tts_audio_url text,
  source public.vocabulary_source,
  source_url text,
  license text,
  review_status public.vocabulary_review_status,
  total_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  with normalized as (
    select
      nullif(trim(p_query), '') as q,
      nullif(trim(p_tag), '') as safe_tag,
      case when p_list in ('all', 'toeic', 'oxford') then p_list else 'all' end as safe_list,
      least(greatest(coalesce(p_limit, 50), 1), 100) as safe_limit,
      greatest(coalesce(p_offset, 0), 0) as safe_offset
  ),
  matched as (
    select
      v.id,
      v.word,
      v.slug,
      v.normalized_word,
      v.definition,
      v.definition_th,
      v.example_sentence,
      v.example_sentence_th,
      v.part_of_speech,
      v.cefr_level,
      v.difficulty,
      v.frequency_rank,
      v.phonetic,
      v.tags,
      v.is_toeic,
      v.is_oxford,
      v.image_url,
      v.tts_audio_url,
      v.source,
      v.source_url,
      v.license,
      v.review_status,
      case
        when normalized.q is null then 0
        else ts_rank_cd(
          to_tsvector(
            'english',
            coalesce(v.word, '') || ' ' ||
            coalesce(v.normalized_word, '') || ' ' ||
            coalesce(v.definition, '') || ' ' ||
            coalesce(v.definition_th, '')
          ),
          plainto_tsquery('english', normalized.q)
        )
      end as rank
    from public.vocabulary v
    cross join normalized
    where v.status = 'published'::public.content_status
      and v.review_status = 'approved'::public.vocabulary_review_status
      and (p_level is null or v.cefr_level = p_level)
      and (p_part is null or v.part_of_speech = p_part)
      and (p_difficulty is null or v.difficulty = p_difficulty)
      and (normalized.safe_tag is null or v.tags @> array[normalized.safe_tag])
      and (normalized.safe_list <> 'toeic' or v.is_toeic)
      and (normalized.safe_list <> 'oxford' or v.is_oxford)
      and (
        not p_saved_only
        or (
          p_saved_user_id is not null
          and exists (
            select 1
            from public.user_vocabulary uv
            where uv.user_id = p_saved_user_id
              and uv.vocabulary_id = v.id
          )
        )
      )
      and (
        normalized.q is null
        or to_tsvector(
          'english',
          coalesce(v.word, '') || ' ' ||
          coalesce(v.normalized_word, '') || ' ' ||
          coalesce(v.definition, '') || ' ' ||
          coalesce(v.definition_th, '')
        ) @@ plainto_tsquery('english', normalized.q)
        or lower(v.word) OPERATOR(public.%) lower(normalized.q)
        or lower(v.normalized_word) OPERATOR(public.%) lower(normalized.q)
      )
  )
  select
    matched.id,
    matched.word,
    matched.slug,
    matched.normalized_word,
    matched.definition,
    matched.definition_th,
    matched.example_sentence,
    matched.example_sentence_th,
    matched.part_of_speech,
    matched.cefr_level,
    matched.difficulty,
    matched.frequency_rank,
    matched.phonetic,
    matched.tags,
    matched.is_toeic,
    matched.is_oxford,
    matched.image_url,
    matched.tts_audio_url,
    matched.source,
    matched.source_url,
    matched.license,
    matched.review_status,
    count(*) over () as total_count
  from matched
  cross join normalized
  order by
    matched.rank desc,
    matched.frequency_rank asc nulls last,
    matched.word asc
  limit (select safe_limit from normalized)
  offset (select safe_offset from normalized);
$$;

revoke execute on function public.search_published_vocabulary(
  text,
  public.cefr_level,
  public.part_of_speech,
  text,
  text,
  integer,
  uuid,
  boolean,
  integer,
  integer
) from public;
grant execute on function public.search_published_vocabulary(
  text,
  public.cefr_level,
  public.part_of_speech,
  text,
  text,
  integer,
  uuid,
  boolean,
  integer,
  integer
) to anon, authenticated, service_role;

create or replace function public.list_published_vocabulary_page(
  p_level public.cefr_level default null,
  p_part public.part_of_speech default null,
  p_tag text default null,
  p_list text default 'all',
  p_difficulty integer default null,
  p_saved_user_id uuid default null,
  p_saved_only boolean default false,
  p_after_frequency_rank integer default null,
  p_after_word text default null,
  p_after_id uuid default null,
  p_limit integer default 50
)
returns table (
  id uuid,
  word text,
  slug text,
  normalized_word text,
  definition text,
  definition_th text,
  example_sentence text,
  example_sentence_th text,
  part_of_speech public.part_of_speech,
  cefr_level public.cefr_level,
  difficulty integer,
  frequency_rank integer,
  phonetic text,
  tags text[],
  is_toeic boolean,
  is_oxford boolean,
  image_url text,
  tts_audio_url text,
  source public.vocabulary_source,
  source_url text,
  license text,
  review_status public.vocabulary_review_status,
  total_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  with normalized as (
    select
      nullif(trim(p_tag), '') as safe_tag,
      case when p_list in ('all', 'toeic', 'oxford') then p_list else 'all' end as safe_list,
      least(greatest(coalesce(p_limit, 50), 1), 101) as safe_limit,
      coalesce(p_after_frequency_rank, 2147483647) as after_rank,
      nullif(trim(p_after_word), '') as after_word
  ),
  filtered as (
    select
      v.id,
      v.word,
      v.slug,
      v.normalized_word,
      v.definition,
      v.definition_th,
      v.example_sentence,
      v.example_sentence_th,
      v.part_of_speech,
      v.cefr_level,
      v.difficulty,
      v.frequency_rank,
      v.phonetic,
      v.tags,
      v.is_toeic,
      v.is_oxford,
      v.image_url,
      v.tts_audio_url,
      v.source,
      v.source_url,
      v.license,
      v.review_status
    from public.vocabulary v
    cross join normalized
    where v.status = 'published'::public.content_status
      and v.review_status = 'approved'::public.vocabulary_review_status
      and (p_level is null or v.cefr_level = p_level)
      and (p_part is null or v.part_of_speech = p_part)
      and (p_difficulty is null or v.difficulty = p_difficulty)
      and (normalized.safe_tag is null or v.tags @> array[normalized.safe_tag])
      and (normalized.safe_list <> 'toeic' or v.is_toeic)
      and (normalized.safe_list <> 'oxford' or v.is_oxford)
      and (
        not p_saved_only
        or (
          p_saved_user_id is not null
          and exists (
            select 1
            from public.user_vocabulary uv
            where uv.user_id = p_saved_user_id
              and uv.vocabulary_id = v.id
          )
        )
      )
  ),
  counted as (
    select count(*) as total_count from filtered
  ),
  paged as (
    select filtered.*
    from filtered
    cross join normalized
    where p_after_id is null
      or (
        coalesce(filtered.frequency_rank, 2147483647) > normalized.after_rank
        or (
          coalesce(filtered.frequency_rank, 2147483647) = normalized.after_rank
          and lower(filtered.word) > lower(coalesce(normalized.after_word, ''))
        )
        or (
          coalesce(filtered.frequency_rank, 2147483647) = normalized.after_rank
          and lower(filtered.word) = lower(coalesce(normalized.after_word, ''))
          and filtered.id > p_after_id
        )
      )
    order by
      coalesce(filtered.frequency_rank, 2147483647) asc,
      lower(filtered.word) asc,
      filtered.id asc
    limit (select safe_limit from normalized)
  )
  select
    paged.id,
    paged.word,
    paged.slug,
    paged.normalized_word,
    paged.definition,
    paged.definition_th,
    paged.example_sentence,
    paged.example_sentence_th,
    paged.part_of_speech,
    paged.cefr_level,
    paged.difficulty,
    paged.frequency_rank,
    paged.phonetic,
    paged.tags,
    paged.is_toeic,
    paged.is_oxford,
    paged.image_url,
    paged.tts_audio_url,
    paged.source,
    paged.source_url,
    paged.license,
    paged.review_status,
    counted.total_count
  from paged
  cross join counted;
$$;

revoke execute on function public.list_published_vocabulary_page(
  public.cefr_level,
  public.part_of_speech,
  text,
  text,
  integer,
  uuid,
  boolean,
  integer,
  text,
  uuid,
  integer
) from public;
grant execute on function public.list_published_vocabulary_page(
  public.cefr_level,
  public.part_of_speech,
  text,
  text,
  integer,
  uuid,
  boolean,
  integer,
  text,
  uuid,
  integer
) to anon, authenticated, service_role;
