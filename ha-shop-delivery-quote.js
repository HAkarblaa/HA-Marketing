/* HA: seller sets each store's delivery fee after checkout. */
(function(){
 'use strict';
 const note='سيحدد صاحب المتجر أجرة التوصيل وسيتم تبليغكم بها قبل إيصال الطلب.';
 function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
 function amount(v){return Number(v||0).toLocaleString('ar-IQ')+' د.ع'}
 function pending(o){const fees=o.shop_order_store_delivery_fees||[];return o.delivery_pricing_mode==='seller_quote'&&(!fees.length||fees.some(f=>f.delivery_fee==null))}
 function render(o){
  const fees=o.shop_order_store_delivery_fees||[],wait=pending(o),quote=o.delivery_pricing_mode==='seller_quote';
  const zones={nearby:'المناطق القريبة',district:'الأقضية والنواحي',governorate:'المحافظات',other:'مناطق أخرى'};
  return `<div class="ha-order-delivery-summary">${fees.length?'<h3>أجور التوصيل</h3>':''}${fees.map(f=>`<div class="row"><span><span data-no-i18n>${esc(f.business_name)}</span>${!quote&&f.delivery_area?`<br><small>${esc(zones[f.zone_type]||'منطقة التوصيل')}: <span data-no-i18n>${esc(f.delivery_area)}${f.delivery_area!==f.delivery_governorate?'، '+esc(f.delivery_governorate):''}</span></small>`:''}</span><strong>${f.delivery_fee==null?'بانتظار تحديد الأجرة':amount(f.delivery_fee)}</strong></div>`).join('')}<div class="row"><span>مجموع أجور التوصيل</span><strong>${wait?'بانتظار اكتمال تحديد الأجور':amount(o.delivery_fee)}</strong></div>${wait?`<p class="muted" style="line-height:1.8">${note}</p>`:''}<div class="row"><span>الخصم${o.coupon_code?` (<span data-no-i18n>${esc(o.coupon_code)}</span>)`:''}</span><strong>- ${amount(o.discount_amount)}</strong></div><div class="row total"><span>${wait?'المجموع الحالي':'المجموع النهائي'}</span><strong>${amount(o.total)}</strong></div>${wait?'<p class="muted" style="line-height:1.8">المجموع الحالي يشمل أجور التوصيل المحددة فقط؛ تُضاف الأجور المتبقية بعد تبليغك بها.</p>':''}</div>`;
 }
 window.HAShopDeliveryQuote={note,pending,render,amount};
})();
