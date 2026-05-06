do $$
begin
  create type public.vocabulary_review_status as enum (
    'ai_draft',
    'human_reviewed',
    'approved'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.vocabulary_source as enum (
    'manual',
    'ai',
    'wiktionary',
    'imported'
  );
exception when duplicate_object then null;
end $$;

grant usage on type public.vocabulary_review_status to anon, authenticated, service_role;
grant usage on type public.vocabulary_source to anon, authenticated, service_role;

alter table public.vocabulary
  add column if not exists status public.content_status not null default 'draft',
  add column if not exists review_status public.vocabulary_review_status not null default 'ai_draft',
  add column if not exists source public.vocabulary_source not null default 'manual',
  add column if not exists source_url text,
  add column if not exists license text,
  add column if not exists is_toeic boolean not null default false,
  add column if not exists is_oxford boolean not null default false,
  add column if not exists reviewed_at timestamptz;

alter table public.vocabulary
  drop constraint if exists vocabulary_source_url_http_check;

alter table public.vocabulary
  add constraint vocabulary_source_url_http_check
  check (source_url is null or source_url ~* '^https?://');

create index if not exists vocabulary_status_cefr_rank_idx
on public.vocabulary (status, cefr_level, frequency_rank);

create unique index if not exists vocabulary_slug_unique_idx
on public.vocabulary (slug);

create index if not exists vocabulary_review_status_idx
on public.vocabulary (review_status);

create index if not exists vocabulary_toeic_filter_idx
on public.vocabulary (cefr_level, frequency_rank)
where is_toeic;

create index if not exists vocabulary_oxford_filter_idx
on public.vocabulary (cefr_level, frequency_rank)
where is_oxford;

drop policy if exists "vocabulary_public_read" on public.vocabulary;

create policy "vocabulary_public_read"
on public.vocabulary for select
to anon, authenticated
using (
  status = 'published'::public.content_status
  or private.is_admin()
);

comment on column public.vocabulary.status is
  'Publishing state. Draft entries are not intended for normal learner-facing lists.';

comment on column public.vocabulary.review_status is
  'Editorial quality state for manual, AI-generated, or imported vocabulary content.';

comment on column public.vocabulary.source is
  'Where the vocabulary entry originated: manual, AI, Wiktionary, or imported data.';

comment on column public.vocabulary.source_url is
  'Optional attribution or provenance URL for imported/reference-derived entries.';

comment on column public.vocabulary.license is
  'Optional license label that applies to the sourced vocabulary content.';

comment on column public.vocabulary.is_toeic is
  'Marks entries that are useful for TOEIC-focused vocabulary and practice content.';

comment on column public.vocabulary.is_oxford is
  'Marks entries that belong to an Oxford-style curated core word list, when licensing/provenance is tracked.';

comment on column public.vocabulary.reviewed_at is
  'When a human reviewer last approved or reviewed the entry.';
