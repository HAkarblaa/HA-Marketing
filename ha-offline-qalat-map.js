
(function(){
  'use strict';

  const STATUS_ID='haOfflineMapStatus';

  function statusBox(){
    let el=document.getElementById(STATUS_ID);
    if(el)return el;
    el=document.createElement('div');
    el.id=STATUS_ID;
    el.style.cssText=
      'position:fixed;left:50%;bottom:68px;transform:translateX(-50%);z-index:99999;'+
      'max-width:92vw;padding:7px 11px;border-radius:999px;background:rgba(8,12,15,.93);'+
      'color:#fff;border:1px solid rgba(231,173,62,.45);font:700 10px Arial,Tahoma,sans-serif;'+
      'box-shadow:0 7px 20px rgba(0,0,0,.3);display:none;white-space:nowrap';
    document.body.appendChild(el);
    return el;
  }

  function showStatus(text,ms){
    const el=statusBox();
    el.textContent=text;
    el.style.display='block';
    if(ms)setTimeout(()=>{el.style.display='none'},ms);
  }

  async function register(){
    if(!('serviceWorker' in navigator) || !('caches' in window))return;

    try{
      const reg=await navigator.serviceWorker.register('./ha-offline-map-sw.js',{scope:'./'});
      await navigator.serviceWorker.ready;

      // كل فتح للصفحة نفحص النسخة الجديدة.
      try{ await reg.update(); }catch(_){}

      // التحميل التلقائي يتم مرة واحدة لكل إصدار.
      const key='ha_qalat_sukkar_offline_map_v1_ready';
      if(localStorage.getItem(key)==='1'){
        return;
      }

      if(!navigator.onLine){
        showStatus('الخريطة المحفوظة تعمل بدون إنترنت',2500);
        return;
      }

      showStatus('جاري تجهيز خريطة قلعة سكر للعمل بدون إنترنت...');

      const sw=reg.active || reg.waiting || reg.installing;
      if(!sw)return;

      const channel=new MessageChannel();
      channel.port1.onmessage=(ev)=>{
        const d=ev.data||{};
        if(d.type==='HA_OFFLINE_MAP_PROGRESS'){
          showStatus('تحميل خريطة قلعة سكر '+d.done+'/'+d.total);
        }else if(d.type==='HA_OFFLINE_MAP_DONE'){
          localStorage.setItem(key,'1');
          showStatus('✅ تم حفظ خريطة قلعة سكر للعمل بدون إنترنت',3500);
        }else if(d.type==='HA_OFFLINE_MAP_ERROR'){
          showStatus('تعذر إكمال تحميل الخريطة، سيعاد المحاولة لاحقاً',3500);
        }
      };

      sw.postMessage({type:'HA_PRECACHE_QALAT_SUKKAR'},[channel.port2]);

    }catch(e){
      console.warn('HA offline map',e);
    }
  }

  window.addEventListener('online',register);
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',register);
  }else{
    register();
  }
})();
