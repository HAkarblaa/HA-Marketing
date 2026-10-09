// Focus an explicitly linked request after its existing authorized view renders.
(function(){
  'use strict';
  const page=location.pathname.split('/').pop(),p=new URLSearchParams(location.search);
  const sections={'driver.html':'requestsSection','seller-dashboard.html':'sellerOrderTools','provider-dashboard.html':'incomingRequestsCard','shop-courier.html':'available'};
  const section=sections[page];if(!section)return;
  const positive=s=>/^\d+$/.test(s||'')&&Number.isSafeInteger(Number(s))&&Number(s)>0;
  const raw=p.get(page==='driver.html'?'ride':page==='seller-dashboard.html'?'order':page==='provider-dashboard.html'?'request':'delivery');
  const requested=page==='driver.html'?(/^[A-Za-z0-9_-]{1,160}$/.test(raw||'')?raw:null):positive(raw)?String(Number(raw)):null;
  if(!requested&&!['#'+section,...(page==='seller-dashboard.html'?['#orders']:[])].includes(location.hash))return;
  let observer,timer,finished=false,filterCleared=false;
  function visible(el){return el&&el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden';}
  function selected(){
    if(!requested)return document.getElementById(location.hash==='#orders'?'orders':section);
    if(page==='driver.html'){
      if(typeof currentRideId==='undefined'||currentRideId!==requested)return null;
      return document.getElementById(typeof currentRide!=='undefined'&&currentRide?.status!=='searching'?'acceptedPanel':'requestCard');
    }
    if(page==='seller-dashboard.html'){
      const el=document.querySelector('[data-seller-order="'+requested+'"]');
      if(el&&!filterCleared){filterCleared=true;const search=document.getElementById('sellerOrderSearch');if(search)search.value='';if(typeof setSellerOrderFilter==='function')setSellerOrderFilter('all');}
      return el;
    }
    if(page==='provider-dashboard.html'){const source=p.get('source')==='orders'?'orders':'requests';return document.querySelector('[data-provider-request="'+requested+'"][data-provider-source="'+source+'"]');}
    return document.querySelector('[data-shop-delivery="'+requested+'"]');
  }
  function focus(){
    if(finished)return;const el=selected();if(!visible(el))return;
    finished=true;observer?.disconnect();clearTimeout(timer);el.style.scrollMarginTop='88px';
    if(requested){el.style.outline='2px solid #14a87a';el.style.outlineOffset='3px';el.setAttribute('tabindex','-1');}
    requestAnimationFrame(()=>{el.scrollIntoView({block:'start',behavior:'auto'});if(requested)el.focus({preventScroll:true});});
  }
  function start(){
    observer=new MutationObserver(focus);observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['style','class','hidden','data-ha-account-lock']});
    timer=setTimeout(()=>{
      observer.disconnect();finished=true;if(!requested)return;
      const box=document.getElementById(section);if(!visible(box))return;
      let lang='ar';try{lang=window.HAI18N?.getLanguage()||localStorage.getItem('ha_language_v1')||'ar';}catch(_e){}
      const words={ar:'الطلب المرتبط بالإشعار غير متاح في القائمة الحالية. اضغط تحديث الطلبات.',iq:'طلب الإشعار مو متاح بالقائمة هسه. حدّث الطلبات.',en:'This notification’s request is not available in the current list. Refresh your requests.',fa:'درخواست این اعلان در فهرست فعلی موجود نیست. درخواست‌ها را تازه‌سازی کنید.'};
      const note=document.createElement('p');note.setAttribute('role','status');note.setAttribute('data-no-i18n','');note.textContent=words[lang]||words.ar;note.style.cssText='padding:12px;border-radius:12px;background:#fff7e1;color:#735a1b;font:13px/1.7 Tahoma,Arial,sans-serif';box.prepend(note);
    },15000);focus();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
