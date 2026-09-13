-- =========================================================
-- HA Marketing - Automatic transport push RPCs
-- شغّل هذا الملف مرة واحدة في Supabase > SQL Editor
-- يعتمد على جدول notifications وعلى trigger الإرسال التلقائي الذي تم تشغيله سابقاً.
-- =========================================================

alter table public.notifications add column if not exists event_key text;
create unique index if not exists notifications_user_event_key_uidx
  on public.notifications(user_id,event_key)
  where event_key is not null;

-- يرسل إشعاراً لكل السائقين الموافق عليهم المطابقين لنوع الطلب.
create or replace function public.ha_notify_transport_drivers(
  p_ride_id text,
  p_dispatch_type text,
  p_title text,
  p_body text,
  p_type text default 'taxi',
  p_link text default 'driver.html'
)
returns bigint[]
language plpgsql
security definer
set search_path=public
as $$
declare
  v_uid uuid;
  v_id bigint;
  v_ids bigint[] := '{}'::bigint[];
  v_event_key text;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  if coalesce(trim(p_ride_id),'')='' then
    raise exception 'ride_id_required';
  end if;

  if p_dispatch_type not in ('taxi','tuktuk','delivery_car','delivery_tuktuk','delivery_courier') then
    raise exception 'invalid_dispatch_type';
  end if;

  v_event_key := 'ride:'||p_ride_id||':driver:new';

  for v_uid in
    with approved as (
      select distinct
        m.user_id,
        m.role_type,
        lower(coalesce(m.details,'')||' '||coalesce(t.vehicle_type,'')||' '||coalesce(t.vehicle_model,'')) as vehicle_text
      from public.marketplace_applications m
      left join public.transport_profiles t
        on t.user_id=m.user_id and t.status='approved'
      where m.status='approved'
        and m.role_type in ('taxi_driver','delivery_driver')

      union

      select distinct
        t.user_id,
        t.role_type,
        lower(coalesce(t.vehicle_type,'')||' '||coalesce(t.vehicle_model,'')) as vehicle_text
      from public.transport_profiles t
      where t.status='approved'
        and t.role_type in ('taxi_driver','delivery_driver')
    ), classified as (
      select
        user_id,
        role_type,
        case
          when role_type='delivery_driver' then 'delivery'
          when vehicle_text like '%تكتك%' or vehicle_text like '%tuktuk%' then 'tuktuk'
          else 'taxi'
        end as driver_kind
      from approved
    )
    select distinct user_id
    from classified
    where user_id<>auth.uid()
      and (
        (p_dispatch_type='taxi' and driver_kind='taxi') or
        (p_dispatch_type='tuktuk' and driver_kind='tuktuk') or
        (p_dispatch_type='delivery_car' and driver_kind='taxi') or
        (p_dispatch_type='delivery_tuktuk' and driver_kind='tuktuk') or
        (p_dispatch_type='delivery_courier' and driver_kind='delivery')
      )
  loop
    v_id := null;
    insert into public.notifications(user_id,title,body,type,link,is_read,event_key)
    values(v_uid,p_title,p_body,coalesce(nullif(p_type,''),'taxi'),p_link,false,v_event_key)
    on conflict do nothing
    returning id into v_id;

    if v_id is not null then
      v_ids := array_append(v_ids,v_id);
    end if;
  end loop;

  return v_ids;
end;
$$;

revoke all on function public.ha_notify_transport_drivers(text,text,text,text,text,text) from public;
grant execute on function public.ha_notify_transport_drivers(text,text,text,text,text,text) to authenticated;

-- إشعار بين طرفي الرحلة: سائق -> زبون أو زبون -> السائق المعيّن.
create or replace function public.ha_notify_transport_peer(
  p_target_user_id uuid,
  p_ride_id text,
  p_event text,
  p_title text,
  p_body text,
  p_type text default 'taxi',
  p_link text default null
)
returns bigint
language plpgsql
security definer
set search_path=public
as $$
declare
  v_caller uuid := auth.uid();
  v_id bigint;
  v_event_key text;
  v_caller_driver boolean := false;
  v_target_driver boolean := false;
begin
  if v_caller is null then
    raise exception 'not_authenticated';
  end if;
  if p_target_user_id is null then
    raise exception 'target_required';
  end if;
  if coalesce(trim(p_ride_id),'')='' or coalesce(trim(p_event),'')='' then
    raise exception 'ride_event_required';
  end if;

  select exists(
    select 1 from public.marketplace_applications m
    where m.user_id=v_caller and m.status='approved' and m.role_type in ('taxi_driver','delivery_driver')
    union all
    select 1 from public.transport_profiles t
    where t.user_id=v_caller and t.status='approved' and t.role_type in ('taxi_driver','delivery_driver')
  ) into v_caller_driver;

  select exists(
    select 1 from public.marketplace_applications m
    where m.user_id=p_target_user_id and m.status='approved' and m.role_type in ('taxi_driver','delivery_driver')
    union all
    select 1 from public.transport_profiles t
    where t.user_id=p_target_user_id and t.status='approved' and t.role_type in ('taxi_driver','delivery_driver')
  ) into v_target_driver;

  -- يسمح فقط إذا أحد طرفي الإشعار سائق/مندوب موافق عليه.
  if not (v_caller_driver or v_target_driver) then
    raise exception 'transport_peer_not_allowed';
  end if;

  v_event_key := 'ride:'||p_ride_id||':'||p_event;

  insert into public.notifications(user_id,title,body,type,link,is_read,event_key)
  values(p_target_user_id,p_title,p_body,coalesce(nullif(p_type,''),'taxi'),p_link,false,v_event_key)
  on conflict do nothing
  returning id into v_id;

  if v_id is null then
    select id into v_id
    from public.notifications
    where user_id=p_target_user_id and event_key=v_event_key
    order by id desc
    limit 1;
  end if;

  return v_id;
end;
$$;

revoke all on function public.ha_notify_transport_peer(uuid,text,text,text,text,text,text) from public;
grant execute on function public.ha_notify_transport_peer(uuid,text,text,text,text,text,text) to authenticated;

select 'transport automatic push RPCs ready' as status;
