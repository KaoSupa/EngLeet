-- Backfill auth users that were created before profile/stat provisioning was
-- fully in place. New users continue to be handled by public.handle_new_user().

insert into public.profiles (id, email, display_name, avatar_url)
select
  au.id,
  au.email,
  coalesce(
    au.raw_user_meta_data ->> 'display_name',
    au.raw_user_meta_data ->> 'full_name',
    au.raw_user_meta_data ->> 'name',
    split_part(au.email, '@', 1)
  ),
  au.raw_user_meta_data ->> 'avatar_url'
from auth.users as au
left join public.profiles as p on p.id = au.id
where p.id is null
on conflict (id) do update
set
  email = coalesce(public.profiles.email, excluded.email),
  display_name = coalesce(public.profiles.display_name, excluded.display_name),
  avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url);

insert into public.user_settings (user_id)
select au.id
from auth.users as au
left join public.user_settings as us on us.user_id = au.id
where us.user_id is null
on conflict (user_id) do nothing;

insert into public.user_stats (user_id)
select au.id
from auth.users as au
left join public.user_stats as us on us.user_id = au.id
where us.user_id is null
on conflict (user_id) do nothing;

update auth.users as au
set
  raw_app_meta_data = coalesce(au.raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object('role', coalesce(p.role::text, 'user')),
  updated_at = now()
from public.profiles as p
where p.id = au.id
  and (au.raw_app_meta_data ->> 'role') is distinct from coalesce(p.role::text, 'user');
