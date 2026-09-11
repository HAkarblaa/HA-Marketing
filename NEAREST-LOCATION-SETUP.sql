-- HA Marketing
-- نظام الأقرب حسب الموقع
-- شغّل هذا الملف مرة واحدة في Supabase > SQL Editor

-- المتاجر: إضافة الإحداثيات
alter table public.shop_businesses
  add column if not exists lat double precision,
  add column if not exists lng double precision;

-- مقدمو الخدمة موجود عندهم lat/lng في النظام الحالي،
-- وهذه الأوامر آمنة حتى لو الأعمدة موجودة مسبقاً.
alter table public.service_providers
  add column if not exists lat double precision,
  add column if not exists lng double precision;

-- الملاعب والجم
alter table public.sports_facilities
  add column if not exists lat double precision,
  add column if not exists lng double precision;

-- فهارس بسيطة تساعد مع البيانات الكبيرة
create index if not exists shop_businesses_geo_idx
  on public.shop_businesses(lat,lng)
  where lat is not null and lng is not null;

create index if not exists service_providers_geo_idx
  on public.service_providers(lat,lng)
  where lat is not null and lng is not null;

create index if not exists sports_facilities_geo_idx
  on public.sports_facilities(lat,lng)
  where lat is not null and lng is not null;
