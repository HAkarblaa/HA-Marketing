-- HA Marketing
-- تفعيل صلاحيات العمل من داخل التطبيق لكل الأقسام
-- شغّل هذا الملف مرة واحدة في Supabase > SQL Editor

-- 1) إضافة صلاحية sports_manager إلى طلبات الانضمام بدون حذف البيانات الحالية.
do $$
declare c record;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid='public.marketplace_applications'::regclass
      and contype='c'
      and pg_get_constraintdef(oid) ilike '%role_type%'
  loop
    execute format('alter table public.marketplace_applications drop constraint %I',c.conname);
  end loop;
end $$;

alter table public.marketplace_applications
  add constraint marketplace_applications_role_type_check
  check(role_type in ('seller','service_provider','sports_manager','taxi_driver','delivery_driver'));

-- 2) دالة الصلاحية تبقى عامة لكل الأدوار.
create or replace function public.has_approved_role(p_role text)
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select public.is_super_admin()
  or exists(
    select 1
    from public.marketplace_applications m
    where m.user_id=auth.uid()
      and m.role_type=p_role
      and m.status='approved'
  )
  or (
    p_role in ('taxi_driver','delivery_driver')
    and exists(
      select 1 from public.transport_profiles t
      where t.user_id=auth.uid()
        and t.role_type=p_role
        and t.status='approved'
    )
  );
$$;

grant execute on function public.has_approved_role(text) to authenticated;

-- 3) صلاحية إدارة الرياضة: صاحب ملعب/جم أو مقدم خدمة قديم أو موظف معتمد أو الأدمن.
create or replace function public.can_manage_sports()
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select public.is_super_admin()
  or public.has_approved_role('sports_manager')
  or public.has_approved_role('service_provider')
  or exists(
    select 1 from public.profiles p
    where p.id=auth.uid()
      and p.account_type='employee'
      and coalesce(p.employee_status,'')='approved'
  );
$$;

grant execute on function public.can_manage_sports() to authenticated;

-- 4) صاحب الصلاحية الرياضية يدير مرافقه فقط.
drop policy if exists "sports facilities manage" on public.sports_facilities;
create policy "sports facilities manage"
on public.sports_facilities
for all
to authenticated
using(
  (owner_user_id=auth.uid() and public.can_manage_sports())
  or public.is_super_admin()
)
with check(
  (owner_user_id=auth.uid() and public.can_manage_sports())
  or public.is_super_admin()
);

drop policy if exists "sports leagues manage" on public.sports_leagues;
create policy "sports leagues manage"
on public.sports_leagues
for all
to authenticated
using(
  (owner_user_id=auth.uid() and public.can_manage_sports())
  or public.is_super_admin()
)
with check(
  (owner_user_id=auth.uid() and public.can_manage_sports())
  or public.is_super_admin()
);

-- 5) سياسات البائع ومقدم الخدمة تبقى مرتبطة بالموافقة.
drop policy if exists "seller own businesses" on public.shop_businesses;
create policy "seller own businesses"
on public.shop_businesses
for all to authenticated
using((owner_user_id=auth.uid() and public.has_approved_role('seller')) or public.is_super_admin())
with check((owner_user_id=auth.uid() and public.has_approved_role('seller')) or public.is_super_admin());

drop policy if exists "seller own products" on public.products;
create policy "seller own products"
on public.products
for all to authenticated
using((seller_user_id=auth.uid() and public.has_approved_role('seller')) or public.is_super_admin())
with check((seller_user_id=auth.uid() and public.has_approved_role('seller')) or public.is_super_admin());

drop policy if exists "provider own profile" on public.service_providers;
create policy "provider own profile"
on public.service_providers
for all to authenticated
using((owner_user_id=auth.uid() and public.has_approved_role('service_provider')) or public.is_super_admin())
with check((owner_user_id=auth.uid() and public.has_approved_role('service_provider')) or public.is_super_admin());

-- 6) طلبات الانضمام: المستخدم يشوف ويضيف طلباته، والأدمن يراجع.
drop policy if exists "market apps own read" on public.marketplace_applications;
create policy "market apps own read"
on public.marketplace_applications
for select to authenticated
using(user_id=auth.uid() or public.is_super_admin());

drop policy if exists "market apps own insert" on public.marketplace_applications;
create policy "market apps own insert"
on public.marketplace_applications
for insert to authenticated
with check(user_id=auth.uid());

drop policy if exists "market apps own update" on public.marketplace_applications;
create policy "market apps own update"
on public.marketplace_applications
for update to authenticated
using(user_id=auth.uid() or public.is_super_admin())
with check(user_id=auth.uid() or public.is_super_admin());

grant select,insert,update on public.marketplace_applications to authenticated;

-- بعد تشغيل هذا الملف:
-- seller            => إضافة متجر ومنتجات من داخل التطبيق
-- service_provider  => إضافة/إدارة الخدمة من داخل التطبيق
-- sports_manager    => إضافة ملعب/جم/دوري وإدارة الحجوزات من داخل التطبيق
-- taxi_driver       => سائق تكسي/تكتك
-- delivery_driver   => مندوب توصيل
