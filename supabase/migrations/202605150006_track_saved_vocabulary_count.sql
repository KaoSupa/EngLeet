-- Reuse user_stats.vocab_mastered as the saved vocabulary count until the app
-- has a full mastery/review dashboard.

create or replace function public.sync_saved_vocabulary_count_internal(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.ensure_user_stats_internal(p_user_id);

  update public.user_stats us
  set vocab_mastered = (
        select count(*)::integer
        from public.user_vocabulary uv
        where uv.user_id = p_user_id
      ),
      updated_at = now()
  where us.user_id = p_user_id;
end;
$$;

revoke execute on function public.sync_saved_vocabulary_count_internal(uuid)
from public, anon, authenticated;
grant execute on function public.sync_saved_vocabulary_count_internal(uuid)
to service_role;

create or replace function public.sync_saved_vocabulary_count_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := coalesce(new.user_id, old.user_id);
begin
  perform public.sync_saved_vocabulary_count_internal(v_user_id);
  return coalesce(new, old);
end;
$$;

revoke execute on function public.sync_saved_vocabulary_count_trigger()
from public, anon, authenticated;

drop trigger if exists sync_saved_vocabulary_count_after_write
on public.user_vocabulary;

create trigger sync_saved_vocabulary_count_after_write
after insert or update or delete on public.user_vocabulary
for each row execute function public.sync_saved_vocabulary_count_trigger();

update public.user_stats us
set vocab_mastered = (
      select count(*)::integer
      from public.user_vocabulary uv
      where uv.user_id = us.user_id
    ),
    updated_at = now();
