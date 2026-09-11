-- HA Marketing
-- تفعيل صلاحيات العمل في جميع الأقسام المرتبطة بالدور بعد موافقة الإدارة
-- شغّل هذا الملف مرة واحدة في Supabase > SQL Editor

-- 1) دالة موحدة للتحقق من صلاحية العمل.
-- تدعم بوابة الانضمام + تسجيل النقل القديم حتى ما تنقطع صلاحيات المستخدمين السابقين.
create or replace function public.has_approved_role(p_role text)
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select
    public.is_super_admin()
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
        select 1
        from public.transport_profiles t
        where t.user_id=auth.uid()
          and t.role_type=p_role
          and t.status='approved'
      )
    );
$$;

grant execute on function public.has_approved_role(text) to authenticated;

-- 2) البائع: يقدر يدير متجره ومنتجاته في أي قسم تسوق مسموح.
drop policy if exists "seller own businesses" on public.shop_businesses;
create policy "seller own businesses"
on public.shop_businesses
for all
to authenticated
using(
  (owner_user_id=auth.uid() and public.has_approved_role('seller'))
  or public.is_super_admin()
)
with check(
  (owner_user_id=auth.uid() and public.has_approved_role('seller'))
  or public.is_super_admin()
);

drop policy if exists "seller own products" on public.products;
create policy "seller own products"
on public.products
for all
to authenticated
using(
  (seller_user_id=auth.uid() and public.has_approved_role('seller'))
  or public.is_super_admin()
)
with check(
  (seller_user_id=auth.uid() and public.has_approved_role('seller'))
  or public.is_super_admin()
);

-- 3) مقدم الخدمة: الملف + المواعيد + الطلبات الخاصة به.
drop policy if exists "provider own profile" on public.service_providers;
create policy "provider own profile"
on public.service_providers
for all
to authenticated
using(
  (owner_user_id=auth.uid() and public.has_approved_role('service_provider'))
  or public.is_super_admin()
)
with check(
  (owner_user_id=auth.uid() and public.has_approved_role('service_provider'))
  or public.is_super_admin()
);

drop policy if exists "provider own availability" on public.service_availability;
create policy "provider own availability"
on public.service_availability
for all
to authenticated
using(
  public.is_super_admin()
  or exists(
    select 1 from public.service_providers p
    where p.id=provider_id
      and p.owner_user_id=auth.uid()
      and public.has_approved_role('service_provider')
  )
)
with check(
  public.is_super_admin()
  or exists(
    select 1 from public.service_providers p
    where p.id=provider_id
      and p.owner_user_id=auth.uid()
      and public.has_approved_role('service_provider')
  )
);

drop policy if exists "provider request read" on public.service_requests;
create policy "provider request read"
on public.service_requests
for select
to authenticated
using(
  customer_id=auth.uid()
  or public.is_app_admin()
  or exists(
    select 1 from public.service_providers p
    where p.id=provider_id
      and p.owner_user_id=auth.uid()
      and public.has_approved_role('service_provider')
  )
);

drop policy if exists "provider request update" on public.service_requests;
create policy "provider request update"
on public.service_requests
for update
to authenticated
using(
  customer_id=auth.uid()
  or public.is_app_admin()
  or exists(
    select 1 from public.service_providers p
    where p.id=provider_id
      and p.owner_user_id=auth.uid()
      and public.has_approved_role('service_provider')
  )
)
with check(
  customer_id=auth.uid()
  or public.is_app_admin()
  or exists(
    select 1 from public.service_providers p
    where p.id=provider_id
      and p.owner_user_id=auth.uid()
      and public.has_approved_role('service_provider')
  )
);

-- 4) النقل: السائق/التكتك/المندوب يعتمدون نفس نظام الاعتماد.
-- سائق التكتك محفوظ كـ taxi_driver مع تحديد "تكتك" في بيانات المركبة/التفاصيل.
drop policy if exists "transport profile own" on public.transport_profiles;
create policy "transport profile own"
on public.transport_profiles
for select
to authenticated
using(user_id=auth.uid() or public.is_super_admin());

drop policy if exists "transport profile insert" on public.transport_profiles;
create policy "transport profile insert"
on public.transport_profiles
for insert
to authenticated
with check(user_id=auth.uid() or public.is_super_admin());

drop policy if exists "transport profile update" on public.transport_profiles;
create policy "transport profile update"
on public.transport_profiles
for update
to authenticated
using(user_id=auth.uid() or public.is_super_admin())
with check(user_id=auth.uid() or public.is_super_admin());

-- 5) الحسابات: البائع المعتمد فقط + الأدمن الرئيسي.
do $$
begin
  if to_regclass('public.shop_accounting_entries') is not null then
    execute 'drop policy if exists "accounting entries seller" on public.shop_accounting_entries';
    execute $p$
      create policy "accounting entries seller"
      on public.shop_accounting_entries
      for all
      to authenticated
      using((user_id=auth.uid() and public.has_approved_role('seller')) or public.is_super_admin())
      with check((user_id=auth.uid() and public.has_approved_role('seller')) or public.is_super_admin())
    $p$;
  end if;

  if to_regclass('public.shop_accounting_parties') is not null then
    execute 'drop policy if exists "accounting parties seller" on public.shop_accounting_parties';
    execute $p$
      create policy "accounting parties seller"
      on public.shop_accounting_parties
      for all
      to authenticated
      using((user_id=auth.uid() and public.has_approved_role('seller')) or public.is_super_admin())
      with check((user_id=auth.uid() and public.has_approved_role('seller')) or public.is_super_admin())
    $p$;
  end if;
end $$;

-- 6) النقل الطلابي: المندوب المعتمد يقدر يضيف ويدير خطوطه.
do $$
begin
  if to_regclass('public.student_transport_routes') is not null then
    execute 'drop policy if exists "student routes transport insert" on public.student_transport_routes';
    execute 'drop policy if exists "student routes transport update" on public.student_transport_routes';
    execute 'drop policy if exists "student routes transport delete" on public.student_transport_routes';

    execute $p$
      create policy "student routes transport insert"
      on public.student_transport_routes
      for insert to authenticated
      with check(
        (owner_user_id=auth.uid() and public.has_approved_role('delivery_driver'))
        or public.is_super_admin()
      )
    $p$;

    execute $p$
      create policy "student routes transport update"
      on public.student_transport_routes
      for update to authenticated
      using(
        (owner_user_id=auth.uid() and public.has_approved_role('delivery_driver'))
        or public.is_super_admin()
      )
      with check(
        (owner_user_id=auth.uid() and public.has_approved_role('delivery_driver'))
        or public.is_super_admin()
      )
    $p$;

    execute $p$
      create policy "student routes transport delete"
      on public.student_transport_routes
      for delete to authenticated
      using(
        (owner_user_id=auth.uid() and public.has_approved_role('delivery_driver'))
        or public.is_super_admin()
      )
    $p$;
  end if;
end $$;

-- 7) مزامنة حالات النقل الموجودة مع الطلب الموافق عليه.
update public.transport_profiles t
set status='approved', updated_at=now()
where exists(
  select 1 from public.marketplace_applications m
  where m.user_id=t.user_id
    and m.role_type=t.role_type
    and m.status='approved'
);

-- النتيجة:
-- seller            => كل أقسام التسوق + المنتجات + الطلبات + الحسابات
-- service_provider  => كل فئات الخدمات + ملف مقدم الخدمة + طلباته
-- taxi_driver       => واجهة السائق وطلبات التكسي
-- taxi_driver/تكتك  => واجهة السائق وطلبات التكتك حسب نوع المركبة
-- delivery_driver   => واجهة المندوب + توصيل المتاجر + النقل الطلابي
