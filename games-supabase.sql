-- اختياري: إذا تريد تحويل النتائج من محلية إلى نتائج مشتركة عبر Supabase
-- هذا السكربت ينشئ جدول جاهز لنتائج الألعاب

create table if not exists public.ha_game_scores (
  id bigserial primary key,
  user_id uuid,
  username text,
  display_name text,
  game_key text not null,
  game_title text not null,
  total_score integer not null default 0,
  best_score integer not null default 0,
  play_count integer not null default 0,
  wins integer not null default 0,
  last_score integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, game_key)
);

create or replace function public.ha_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists trg_ha_game_scores_updated_at on public.ha_game_scores;
create trigger trg_ha_game_scores_updated_at
before update on public.ha_game_scores
for each row execute function public.ha_set_updated_at();

alter table public.ha_game_scores enable row level security;

-- الجميع يقرؤون التصنيف
create policy if not exists "ha_game_scores_select_all"
on public.ha_game_scores
for select
using (true);

-- المستخدم الموثق يضيف نتيجته فقط
create policy if not exists "ha_game_scores_insert_own"
on public.ha_game_scores
for insert
to authenticated
with check (auth.uid() = user_id);

-- المستخدم يعدل نتيجته فقط
create policy if not exists "ha_game_scores_update_own"
on public.ha_game_scores
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
