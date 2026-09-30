-- HA Marketing - اختيار الموقع بالخريطة/الدبوس لطلبات التسوق
-- شغّل هذا الملف مرة واحدة في Supabase SQL Editor

alter table public.shop_orders
  add column if not exists area text,
  add column if not exists customer_lat double precision,
  add column if not exists customer_lng double precision;

alter table public.shop_saved_addresses
  add column if not exists area text,
  add column if not exists lat double precision,
  add column if not exists lng double precision;

alter table if exists public.shop_order_deliveries
  add column if not exists pickup_lat double precision,
  add column if not exists pickup_lng double precision,
  add column if not exists delivery_lat double precision,
  add column if not exists delivery_lng double precision;

create or replace function public.create_shop_order_v4(
  p_customer_name text,
  p_phone text,
  p_governorate text,
  p_area text,
  p_address text,
  p_customer_lat double precision,
  p_customer_lng double precision,
  p_notes text,
  p_items jsonb,
  p_payment_method text default 'cash_on_delivery',
  p_coupon_code text default null
) returns bigint
language plpgsql security definer set search_path=public as $$
declare
  v_order bigint; v_item jsonb; v_product public.products%rowtype; v_qty int;
  v_subtotal bigint:=0; v_delivery bigint:=0; v_discount bigint:=0; v_total bigint:=0;
  v_method text; v_coupon public.shop_coupons%rowtype; v_price bigint; v_option text;
begin
  if auth.uid() is null then raise exception 'Login required'; end if;

  if coalesce(trim(p_customer_name),'')='' or
     coalesce(trim(p_phone),'')='' or
     coalesce(trim(p_governorate),'')='' or
     coalesce(trim(p_area),'')='' or
     coalesce(trim(p_address),'')='' then
    raise exception 'Customer delivery data is required';
  end if;

  if p_customer_lat is null or p_customer_lng is null then
    raise exception 'Map pin is required';
  end if;

  if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)=0 then
    raise exception 'Cart is empty';
  end if;

  v_method:=case when p_payment_method='electronic' then 'electronic' else 'cash_on_delivery' end;

  select fee into v_delivery
  from public.shop_delivery_fees
  where governorate=trim(p_governorate) and is_active=true;

  v_delivery:=coalesce(v_delivery,0);

  insert into public.shop_orders(
    customer_id,customer_name,phone,governorate,area,address,
    customer_lat,customer_lng,notes,payment_method,payment_status,delivery_fee
  )
  values(
    auth.uid(),trim(p_customer_name),trim(p_phone),trim(p_governorate),trim(p_area),trim(p_address),
    p_customer_lat,p_customer_lng,nullif(trim(p_notes),''),v_method,'pending',v_delivery
  )
  returning id into v_order;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty:=greatest(1,coalesce((v_item->>'quantity')::int,1));
    v_option:=nullif(trim(coalesce(v_item->>'option_text','')),'');
    select * into v_product
    from public.products
    where id=(v_item->>'product_id')::bigint and is_active=true
    for update;

    if not found then raise exception 'Product unavailable'; end if;
    if v_qty < coalesce(v_product.min_order_qty,1) then
      raise exception 'Minimum quantity for % is %',v_product.name,v_product.min_order_qty;
    end if;
    if v_product.stock<v_qty then raise exception 'Insufficient stock for %',v_product.name; end if;

    v_price:=coalesce(v_product.discount_price,v_product.price);
    if v_price<0 then v_price:=v_product.price; end if;

    update public.products set stock=stock-v_qty,updated_at=now() where id=v_product.id;

    insert into public.shop_order_items(
      order_id,product_id,product_name,quantity,unit_price,subtotal,
      option_text,seller_user_id,business_id
    )
    values(
      v_order,v_product.id,v_product.name,v_qty,v_price,v_price*v_qty,
      v_option,v_product.seller_user_id,v_product.business_id
    );

    v_subtotal:=v_subtotal+(v_price*v_qty);
  end loop;

  if nullif(trim(coalesce(p_coupon_code,'')),'') is not null then
    select * into v_coupon
    from public.shop_coupons
    where upper(code)=upper(trim(p_coupon_code))
      and is_active=true
      and (starts_at is null or starts_at<=now())
      and (expires_at is null or expires_at>=now())
    limit 1;

    if found and v_subtotal>=v_coupon.min_total then
      if v_coupon.discount_type='percent' then
        v_discount:=floor(v_subtotal * least(v_coupon.discount_value,100)::numeric / 100);
      else
        v_discount:=v_coupon.discount_value;
      end if;
      if v_coupon.max_discount is not null then
        v_discount:=least(v_discount,v_coupon.max_discount);
      end if;
      v_discount:=least(v_discount,v_subtotal);
    end if;
  end if;

  v_total:=greatest(0,v_subtotal+v_delivery-v_discount);

  update public.shop_orders
  set subtotal=v_subtotal,
      delivery_fee=v_delivery,
      discount_amount=v_discount,
      coupon_code=case when v_discount>0 then upper(trim(p_coupon_code)) else null end,
      total=v_total,
      updated_at=now()
  where id=v_order;

  return v_order;
end$$;

grant execute on function public.create_shop_order_v4(
  text,text,text,text,text,double precision,double precision,text,jsonb,text,text
) to authenticated;

create or replace function public.request_shop_courier(p_order_id bigint)
returns bigint language plpgsql security definer set search_path=public as $$
declare
  v_id bigint;
  v_store public.shop_businesses%rowtype;
  v_order public.shop_orders%rowtype;
  v_otp text;
begin
  if not public.has_approved_role('seller') then raise exception 'غير مصرح كبائع'; end if;

  select * into v_order from public.shop_orders where id=p_order_id;
  if not found or v_order.status='cancelled' then raise exception 'الطلب غير صالح'; end if;

  if not exists(
    select 1 from public.shop_order_items
    where order_id=p_order_id and seller_user_id=auth.uid()
  ) then
    raise exception 'هذا الطلب لا يخص متجرك';
  end if;

  select * into v_store
  from public.shop_businesses
  where owner_user_id=auth.uid()
  order by id limit 1;

  v_otp:=lpad((floor(random()*9000)+1000)::int::text,4,'0');

  insert into public.shop_order_deliveries(
    order_id,seller_user_id,business_id,customer_id,status,
    pickup_name,pickup_address,pickup_lat,pickup_lng,
    delivery_address,delivery_lat,delivery_lng,
    governorate,customer_phone,otp_code
  )
  values(
    v_order.id,auth.uid(),v_store.id,v_order.customer_id,'ready',
    coalesce(v_store.name,'المتجر'),coalesce(v_store.location_text,'العنوان غير محدد'),v_store.lat,v_store.lng,
    concat_ws(' - ',v_order.area,v_order.address),v_order.customer_lat,v_order.customer_lng,
    v_order.governorate,v_order.phone,v_otp
  )
  on conflict(order_id,seller_user_id) do update set
    status=case when public.shop_order_deliveries.status='delivered' then public.shop_order_deliveries.status else 'ready' end,
    driver_id=case when public.shop_order_deliveries.status='delivered' then public.shop_order_deliveries.driver_id else null end,
    otp_code=case when public.shop_order_deliveries.status='delivered' then public.shop_order_deliveries.otp_code else excluded.otp_code end,
    pickup_name=excluded.pickup_name,
    pickup_address=excluded.pickup_address,
    pickup_lat=excluded.pickup_lat,
    pickup_lng=excluded.pickup_lng,
    delivery_address=excluded.delivery_address,
    delivery_lat=excluded.delivery_lat,
    delivery_lng=excluded.delivery_lng,
    governorate=excluded.governorate,
    customer_phone=excluded.customer_phone,
    updated_at=now()
  returning id into v_id;

  update public.shop_orders
  set status=case when status in('new','confirmed') then 'preparing' else status end,
      updated_at=now()
  where id=p_order_id;

  return v_id;
end$$;

grant execute on function public.request_shop_courier(bigint) to authenticated;

create or replace function public.get_available_shop_deliveries()
returns jsonb language sql stable security definer set search_path=public as $$
  select case when not public.has_approved_role('delivery_driver') then '[]'::jsonb else
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',d.id,'order_id',d.order_id,
        'pickup_name',d.pickup_name,'pickup_address',d.pickup_address,
        'pickup_lat',d.pickup_lat,'pickup_lng',d.pickup_lng,
        'delivery_address',d.delivery_address,
        'delivery_lat',d.delivery_lat,'delivery_lng',d.delivery_lng,
        'governorate',d.governorate,'customer_phone',d.customer_phone,
        'created_at',d.created_at
      ) order by d.created_at)
      from public.shop_order_deliveries d
      where d.status='ready'
        and not exists(
          select 1 from public.shop_order_deliveries mine
          where mine.driver_id=auth.uid()
            and mine.status in('accepted','picked_up','on_the_way')
        )
        and (
          coalesce((select governorate from public.transport_profiles where user_id=auth.uid()),'')=''
          or coalesce(d.governorate,'')=''
          or lower(d.governorate)=lower((select governorate from public.transport_profiles where user_id=auth.uid()))
        )
    ),'[]'::jsonb) end;
$$;

grant execute on function public.get_available_shop_deliveries() to authenticated;

create or replace function public.get_driver_shop_deliveries()
returns jsonb language sql stable security definer set search_path=public as $$
  select case when not public.has_approved_role('delivery_driver') then '[]'::jsonb else
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',d.id,'order_id',d.order_id,'status',d.status,
        'pickup_name',d.pickup_name,'pickup_address',d.pickup_address,
        'pickup_lat',d.pickup_lat,'pickup_lng',d.pickup_lng,
        'delivery_address',d.delivery_address,
        'delivery_lat',d.delivery_lat,'delivery_lng',d.delivery_lng,
        'governorate',d.governorate,'customer_phone',d.customer_phone,
        'accepted_at',d.accepted_at,'picked_up_at',d.picked_up_at,
        'delivered_at',d.delivered_at,'created_at',d.created_at
      ) order by d.created_at desc)
      from public.shop_order_deliveries d
      where d.driver_id=auth.uid()
    ),'[]'::jsonb) end;
$$;

grant execute on function public.get_driver_shop_deliveries() to authenticated;