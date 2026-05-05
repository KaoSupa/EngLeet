-- Mirror profile roles into auth.users.raw_app_meta_data so new JWTs can carry
-- the app authorization role without a profiles lookup on every auth redirect.

create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;

create or replace function private.sync_profile_role_to_auth_jwt()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update auth.users
  set
    raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
      || jsonb_build_object('role', coalesce(new.role::text, 'user')),
    updated_at = now()
  where id = new.id;

  return new;
end;
$$;

revoke all on function private.sync_profile_role_to_auth_jwt() from public;
grant execute on function private.sync_profile_role_to_auth_jwt() to service_role;

drop trigger if exists sync_profile_role_to_auth_jwt on public.profiles;
create trigger sync_profile_role_to_auth_jwt
after insert or update of role on public.profiles
for each row execute function private.sync_profile_role_to_auth_jwt();

update auth.users as au
set
  raw_app_meta_data = coalesce(au.raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object('role', coalesce(p.role::text, 'user')),
  updated_at = now()
from public.profiles as p
where p.id = au.id
  and (au.raw_app_meta_data ->> 'role') is distinct from coalesce(p.role::text, 'user');
