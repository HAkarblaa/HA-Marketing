/* HA Marketing: cancellation needs store approval; a late app courier can be replaced before pickup. */
(function(){'use strict';
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
 const active=s=>['new','confirmed','preparing','out_for_delivery'].includes(s);
 let busy=false;
 const style=document.createElement('style');style.textContent='.ha-cancel-panel{padding:12px;margin:12px 0;border:1px solid #e5bc62;border-radius:12px;background:#fff8e8!important;color:#684b08!important;line-height:1.8;overflow-wrap:anywhere}.ha-cancel-panel strong{display:block}.ha-cancel-panel .ha-cancel-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:9px}.ha-cancel-panel .ha-cancel-actions button{flex:1 1 120px!important;white-space:normal}#orders .ha-cancel-panel button[data-cancel-approve]{background:#167147!important;color:#fff!important}#orders .ha-cancel-panel button[data-cancel-reject]{background:#a82b39!important;color:#fff!important}#box .ha-cancel-note button[data-ha-cancel]{background:#a82b39!important;color:#fff!important}.ha-cancel-note{line-height:1.8;margin:8px 0;font-size:13px}.ha-courier-switch{margin-top:10px}.ha-courier-switch button{white-space:normal;width:100%}.ha-courier-switch button:disabled{opacity:.55;cursor:not-allowed}.ha-cancel-panel button:disabled{opacity:.55}@media print{.ha-cancel-panel button,.ha-cancel-note button{display:none!important}}';document.head.append(style);
 function customer(o){
  const closed=!active(o.status);
  if(o.cancel_request_status==='approved')return '<div class="ha-cancel-panel"><strong>تم إلغاء الطلب بموافقة أصحاب المتاجر.</strong></div>';
  if(closed)return '';
  if(o.cancel_request_status==='pending')return '<div class="ha-cancel-panel"><strong>طلب الإلغاء بانتظار موافقة صاحب المتجر.</strong><span>يبقى الطلب فعالاً حتى تتم الموافقة. إذا كان الطلب من أكثر من صاحب متجر، يحتاج موافقة الجميع.</span></div>';
  if(o.cancel_request_status==='rejected')return `<div class="ha-cancel-panel"><strong>لم تتم الموافقة على الإلغاء. الطلب مستمر.</strong>${o.cancel_response_reason?`<div><span>سبب الرفض</span>: <span data-no-i18n>${esc(o.cancel_response_reason)}</span></div>`:''}</div>`;
  if((o.shop_order_store_delivery_fees||[]).some(f=>f.fulfilled_at))return '';
  return `<div class="ha-cancel-note"><button type="button" class="danger" data-ha-cancel="${Number(o.id)}" onclick="requestOrderCancellation(${Number(o.id)})">طلب إلغاء</button><small style="display:block;margin-top:5px">الإلغاء يحتاج موافقة صاحب المتجر.</small></div>`;
 }
 function seller(o){
  if(o.cancel_request_status!=='pending'||!active(o.order_status))return '';
  const reason=o.cancel_request_reason?`<div><span>سبب طلب الإلغاء</span>: <span data-no-i18n>${esc(o.cancel_request_reason)}</span></div>`:'';
  if(o.cancel_own_response==='approved')return `<div class="ha-cancel-panel"><strong>وافقت على الإلغاء. بانتظار بقية أصحاب المتاجر.</strong><span>الطلب يبقى فعالاً حتى موافقة الجميع.</span>${reason}</div>`;
  if(o.cancel_own_response!=='pending')return '';
  return `<div class="ha-cancel-panel"><strong>الزبون يطلب إلغاء الطلب.</strong>${reason}<div class="ha-cancel-actions"><button type="button" data-cancel-approve="${Number(o.order_id)}" onclick="respondCancellation(${Number(o.order_id)},true)">الموافقة على الإلغاء</button><button type="button" data-cancel-reject="${Number(o.order_id)}" onclick="respondCancellation(${Number(o.order_id)},false)">رفض الإلغاء</button></div><small>لا يُلغى الطلب حتى موافقة جميع أصحاب المتاجر.</small></div>`;
 }
 function courierSwitch(o,own){
  const d=o.delivery;
  if(!d||!['ready','accepted'].includes(d.status)||d.picked_up_at||!active(o.order_status)||!own.length||!own.every(q=>q.pricing_mode==='seller_quote'&&Number(q.delivery_fee)>0&&!q.fulfillment_method&&!q.fulfilled_at))return '';
  const allowed=own.every(q=>q.courier_can_replace===true);
  return `<div class="ha-courier-switch"><button type="button" class="light" data-courier-replace="${Number(o.order_id)}" ${allowed?'':'disabled'} onclick="merchantDelivery(${Number(o.order_id)},'start',true)">المندوب متأخر — التوصيل من عندي</button><small class="ha-cancel-note" style="display:block">${allowed?'يمكنك توصيله بنفسك أو بمندوب خارجي. سيتم إلغاء تكليف مندوب التطبيق وتبليغه.':'يتاح التحويل بعد 15 دقيقة من طلب المندوب أو قبوله، وقبل استلام البضاعة. اضغط تحديث بعد انتهاء المدة.'}</small></div>`;
 }
 async function request(db,id,reload){
  if(busy)return;
  const reason=prompt('سبب طلب الإلغاء (اختياري):');if(reason===null)return;
  if(!confirm('سيُرسل طلب الإلغاء لصاحب المتجر. يبقى الطلب فعالاً حتى تتم الموافقة. إرسال الطلب؟'))return;
  busy=true;const buttons=[...document.querySelectorAll('[data-ha-cancel]')];buttons.forEach(b=>b.disabled=true);
  try{const {data,error}=await db.rpc('request_shop_order_cancellation',{p_order_id:id,p_reason:reason.slice(0,500)});if(error||!data?.ok)throw new Error(error?.message||'تعذر إرسال طلب الإلغاء');busy=false;await reload()}
  catch(e){alert(e.message||'تعذر إرسال طلب الإلغاء')}
  finally{busy=false;buttons.forEach(b=>b.disabled=false)}
 }
 window.HAShopOrderControl={customer,seller,courierSwitch,request,isBusy:()=>busy};
})();
