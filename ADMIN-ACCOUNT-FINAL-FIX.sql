-- HA Marketing - final admin/account fix
-- Run once in Supabase SQL Editor.
-- Does not delete users, orders, or existing admins.

-- 1) Keep legacy admin checks compatible with the newer app_admins system.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select
    exists(
      select 1 from public.app_admins a
      where a.user_id=auth.uid() and a.is_active=true
    )
    or exists(
      select 1 from public.profiles p
      where p.id=auth.uid() and p.account_type='admin'
    );
$$;
grant execute on function public.is_admin() to authenticated;

-- 2) Every signed-in user can read/create/update their own profile.
alter table public.profiles enable row level security;
drop policy if exists "users read own profile" on public.profiles;
create policy "users read own profile"
on public.profiles for select to authenticated
using (id=auth.uid());

drop policy if exists "users insert own profile" on public.profiles;
create policy "users insert own profile"
on public.profiles for insert to authenticated
with check (id=auth.uid());

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile"
on public.profiles for update to authenticated
using (id=auth.uid())
with check (id=auth.uid());

-- 3) Safe account update used by account.html.
create or replace function public.update_my_profile(p_username text,p_phone text)
returns void
language plpgsql
security definer
set search_path=public
as $$
declare
  v_username text:=trim(coalesce(p_username,''));
  v_phone text:=regexp_replace(coalesce(p_phone,''),'[^0-9]','','g');
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if v_username !~ '^[!-~]{6,40}$' then raise exception 'Invalid username'; end if;
  if v_phone !~ '^9647[0-9]{9}$' then raise exception 'Invalid phone'; end if;

  if exists(select 1 from public.profiles where username=v_username and id<>auth.uid()) then
    raise exception 'Username already used';
  end if;
  if exists(select 1 from public.profiles where phone=v_phone and id<>auth.uid()) then
    raise exception 'Phone already used';
  end if;

  update public.profiles
     set username=v_username, phone=v_phone
   where id=auth.uid();

  if not found then
    insert into public.profiles(id,username,phone,account_type)
    values(auth.uid(),v_username,v_phone,'customer');
  end if;
end;
$$;
grant execute on function public.update_my_profile(text,text) to authenticated;

-- 4) Re-assert principal Super Admin account without changing its UID.
insert into public.app_admins(user_id,is_super_admin,is_active,created_by)
values(
  'f65185bb-1761-42c0-b358-1b0277555e24'::uuid,
  true,
  true,
  'f65185bb-1761-42c0-b358-1b0277555e24'::uuid
)
on conflict(user_id) do update set
  is_super_admin=true,
  is_active=true,
  updated_at=now();


-- 5) General admin management functions used by admin-panel.html.
create or replace function public.admin_set_user_role(
  p_identifier text,
  p_super boolean,
  p_sections text[] default '{}'::text[]
)
returns void
language plpgsql
security definer
set search_path=public
as $$
declare
  v_user uuid;
  v_id text:=trim(coalesce(p_identifier,''));
  v_phone text:=regexp_replace(v_id,'[^0-9]','','g');
  v_section text;
  allowed_sections constant text[]:=array[
    'shop','services','chat','news','religious','study','entertainment','sports',
    'transport','appointments','employees','users','notifications','settings'
  ];
begin
  if not public.is_super_admin() then raise exception 'Super Admin only'; end if;

  if v_phone ~ '^07[0-9]{9}$' then v_phone:='964'||substr(v_phone,2); end if;

  select id into v_user
  from public.profiles
  where username=v_id or phone=v_phone
  limit 1;

  if v_user is null then raise exception 'User profile not found'; end if;

  foreach v_section in array coalesce(p_sections,'{}'::text[]) loop
    if not (v_section=any(allowed_sections)) then
      raise exception 'Invalid section: %',v_section;
    end if;
  end loop;

  insert into public.app_admins(user_id,is_super_admin,is_active,created_by)
  values(v_user,coalesce(p_super,false),true,auth.uid())
  on conflict(user_id) do update set
    is_super_admin=excluded.is_super_admin,
    is_active=true,
    updated_at=now();

  delete from public.app_admin_permissions where admin_user_id=v_user;

  if not coalesce(p_super,false) then
    insert into public.app_admin_permissions(
      admin_user_id,section_key,can_view,can_create,can_edit,can_delete,can_manage
    )
    select v_user,x,true,true,true,true,true
    from unnest(coalesce(p_sections,'{}'::text[])) x;
  end if;

  if to_regclass('public.study_notification_admins') is not null then
    if coalesce(p_super,false) or 'study'=any(coalesce(p_sections,'{}'::text[])) or 'notifications'=any(coalesce(p_sections,'{}'::text[])) then
      execute 'insert into public.study_notification_admins(user_id) values($1) on conflict(user_id) do nothing' using v_user;
    else
      execute 'delete from public.study_notification_admins where user_id=$1' using v_user;
    end if;
  end if;
end;
$$;
grant execute on function public.admin_set_user_role(text,boolean,text[]) to authenticated;

create or replace function public.admin_disable_user(p_identifier text)
returns void
language plpgsql
security definer
set search_path=public
as $$
declare
  v_user uuid;
  v_id text:=trim(coalesce(p_identifier,''));
  v_phone text:=regexp_replace(v_id,'[^0-9]','','g');
begin
  if not public.is_super_admin() then raise exception 'Super Admin only'; end if;
  if v_phone ~ '^07[0-9]{9}$' then v_phone:='964'||substr(v_phone,2); end if;

  select id into v_user from public.profiles
  where username=v_id or phone=v_phone
  limit 1;
  if v_user is null then raise exception 'User profile not found'; end if;
  if v_user=auth.uid() then raise exception 'Cannot disable your own Super Admin account'; end if;

  update public.app_admins set is_active=false,updated_at=now() where user_id=v_user;
  delete from public.app_admin_permissions where admin_user_id=v_user;
  if to_regclass('public.study_notification_admins') is not null then
    execute 'delete from public.study_notification_admins where user_id=$1' using v_user;
  end if;
end;
$$;
grant execute on function public.admin_disable_user(text) to authenticated;
