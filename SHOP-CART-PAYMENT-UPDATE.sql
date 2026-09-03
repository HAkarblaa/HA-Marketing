-- HA Marketing - Cart + two payment methods update
-- Run once in Supabase SQL Editor after uploading the website update.

alter table public.shop_orders add column if not exists payment_method text not null default 'cash_on_delivery';
alter table public.shop_orders add column if not exists payment_status text not null default 'pending';

do $$ begin
  alter table public.shop_orders add constraint shop_orders_payment_method_check check(payment_method in('cash_on_delivery','electronic'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.shop_orders add constraint shop_orders_payment_status_check check(payment_status in('pending','paid','failed','refunded'));
exception when duplicate_object then null; end $$;

create or replace function public.create_shop_order_v2(
  p_customer_name text,
  p_phone text,
  p_governorate text,
  p_address text,
  p_notes text,
  p_items jsonb,
  p_payment_method text default 'cash_on_delivery'
) returns bigint
language plpgsql security definer set search_path=public as $$
declare
  v_order bigint; v_item jsonb; v_product public.products%rowtype; v_qty int; v_total bigint:=0; v_method text;
begin
  if auth.uid() is null then raise exception 'Login required'; end if;
  if coalesce(trim(p_customer_name),'')='' or coalesce(trim(p_phone),'')='' or coalesce(trim(p_address),'')='' then
    raise exception 'Customer name, phone and address are required';
  end if;
  if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)=0 then raise exception 'Cart is empty'; end if;
  v_method:=case when p_payment_method='electronic' then 'electronic' else 'cash_on_delivery' end;

  insert into public.shop_orders(customer_id,customer_name,phone,governorate,address,notes,payment_method,payment_status)
  values(auth.uid(),trim(p_customer_name),trim(p_phone),nullif(trim(p_governorate),''),trim(p_address),nullif(trim(p_notes),''),v_method,'pending')
  returning id into v_order;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty:=greatest(1,coalesce((v_item->>'quantity')::int,1));
    select * into v_product from public.products
      where id=(v_item->>'product_id')::bigint and is_active=true for update;
    if not found then raise exception 'Product unavailable'; end if;
    if v_product.stock<v_qty then raise exception 'Insufficient stock for %',v_product.name; end if;
    update public.products set stock=stock-v_qty,updated_at=now() where id=v_product.id;
    insert into public.shop_order_items(order_id,product_id,product_name,quantity,unit_price,subtotal)
    values(v_order,v_product.id,v_product.name,v_qty,v_product.price,v_product.price*v_qty);
    v_total:=v_total+(v_product.price*v_qty);
  end loop;
  update public.shop_orders set total=v_total,updated_at=now() where id=v_order;
  return v_order;
end$$;

grant execute on function public.create_shop_order_v2(text,text,text,text,text,jsonb,text) to authenticated;
