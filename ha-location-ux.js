// HA Marketing - location searching, spinner, and enable-location alert
(function(){
  'use strict';
  if(window.HA_LocationUX)return;

  let globalChip=null;
  let modal=null;
  let retryAction=null;
  let currentLocalStatus=null;
  let lastPromptAt=0;

  function ensureUI(){
    if(!document.body)return;

    if(!globalChip){
      globalChip=document.createElement('div');
      globalChip.id='haLocationStatusChip';
      globalChip.className='ha-location-status-chip';
      globalChip.innerHTML='<span class="ha-location-spinner"></span><span>جاري تحديد موقعك...</span>';
      document.body.appendChild(globalChip);
    }

    if(!modal){
      modal=document.createElement('div');
      modal.id='haLocationEnableModal';
      modal.className='ha-location-modal';
      modal.innerHTML=
        '<div class="ha-location-modal-card" role="dialog" aria-modal="true">'+
          '<div class="ha-location-modal-icon">📍</div>'+
          '<h3 id="haLocationModalTitle">فعّل الموقع</h3>'+
          '<p id="haLocationModalText">شغّل خدمة الموقع (GPS) واسمح للتطبيق باستخدام موقعك، ثم حاول مرة ثانية.</p>'+
          '<div class="ha-location-modal-actions">'+
            '<button id="haLocationRetryBtn" class="ha-location-retry" type="button">فعّلت الموقع — إعادة المحاولة</button>'+
            '<button id="haLocationCloseBtn" class="ha-location-close" type="button">إغلاق</button>'+
          '</div>'+
        '</div>';
      document.body.appendChild(modal);

      document.getElementById('haLocationCloseBtn').onclick=function(){
        modal.classList.remove('show');
        retryAction=null;
      };

      document.getElementById('haLocationRetryBtn').onclick=function(){
        const fn=retryAction;
        modal.classList.remove('show');
        retryAction=null;
        if(typeof fn==='function')setTimeout(fn,180);
      };

      modal.addEventListener('click',function(e){
        if(e.target===modal){
          modal.classList.remove('show');
          retryAction=null;
        }
      });
    }
  }

  function findLocalStatus(){
    const ids=['notice','status','provinceName','locationStatus','gpsStatus'];
    for(const id of ids){
      const el=document.getElementById(id);
      if(!el)continue;
      const t=(el.textContent||'').trim();
      if(/جاري\s+(تحديد|البحث عن)\s+.*الموقع|جاري\s+تحديد\s+موقعك/.test(t)){
        return el;
      }
    }
    return null;
  }

  function showSearching(){
    ensureUI();
    setTimeout(function(){
      const el=findLocalStatus();
      if(el){
        currentLocalStatus=el;
        el.classList.add('ha-location-loading');
        if(globalChip)globalChip.classList.remove('show');
      }else if(globalChip){
        globalChip.classList.add('show');
      }
    },20);
  }

  function hideSearching(){
    if(currentLocalStatus){
      currentLocalStatus.classList.remove('ha-location-loading');
      currentLocalStatus=null;
    }
    document.querySelectorAll('.ha-location-loading').forEach(function(el){
      el.classList.remove('ha-location-loading');
    });
    if(globalChip)globalChip.classList.remove('show');
  }

  function errorMessage(err){
    if(err && err.code===1){
      return {
        title:'فعّل صلاحية الموقع',
        text:'صلاحية الموقع غير مفعّلة. اسمح للتطبيق أو المتصفح باستخدام الموقع، وشغّل GPS، ثم حاول مرة ثانية.'
      };
    }
    if(err && err.code===2){
      return {
        title:'فعّل الموقع (GPS)',
        text:'خدمة الموقع تبدو متوقفة أو الموقع غير متاح. شغّل GPS من الجهاز ثم اضغط إعادة المحاولة.'
      };
    }
    if(err && err.code===3){
      return {
        title:'تعذر العثور على الموقع',
        text:'استغرق تحديد الموقع وقتاً طويلاً. تأكد من تشغيل GPS ومن وجود إشارة موقع جيدة ثم حاول مرة ثانية.'
      };
    }
    return {
      title:'فعّل الموقع',
      text:'شغّل خدمة الموقع (GPS) واسمح للتطبيق باستخدام موقعك، ثم حاول مرة ثانية.'
    };
  }

  function showEnablePrompt(err,retryFn){
    ensureUI();
    hideSearching();

    // منع ظهور تنبيهين بنفس اللحظة بسبب طلبات تحديد الموقع التلقائية.
    const now=Date.now();
    if(now-lastPromptAt<1800)return;
    lastPromptAt=now;

    const msg=errorMessage(err);
    document.getElementById('haLocationModalTitle').textContent=msg.title;
    document.getElementById('haLocationModalText').textContent=msg.text;

    retryAction=typeof retryFn==='function'?retryFn:null;
    const retryBtn=document.getElementById('haLocationRetryBtn');
    retryBtn.style.display=retryAction?'block':'none';

    modal.classList.add('show');
  }

  function unsupported(){
    showEnablePrompt({code:2},null);
  }

  function getCurrentPosition(success,error,options){
    if(!navigator.geolocation){
      unsupported();
      if(typeof error==='function')error({code:2,message:'Geolocation unavailable'});
      return null;
    }

    const run=function(){
      showSearching();
      navigator.geolocation.getCurrentPosition(
        function(pos){
          hideSearching();
          if(typeof success==='function')success(pos);
        },
        function(err){
          hideSearching();
          showEnablePrompt(err,run);
          if(typeof error==='function')error(err);
        },
        options||{enableHighAccuracy:true,timeout:12000,maximumAge:0}
      );
    };

    run();
    return true;
  }

  function watchPosition(success,error,options){
    if(!navigator.geolocation){
      unsupported();
      if(typeof error==='function')error({code:2,message:'Geolocation unavailable'});
      return null;
    }

    let firstFix=true;
    showSearching();

    return navigator.geolocation.watchPosition(
      function(pos){
        if(firstFix){
          firstFix=false;
          hideSearching();
        }
        if(typeof success==='function')success(pos);
      },
      function(err){
        hideSearching();
        // watchPosition لا يعاد تلقائياً حتى لا نترك مراقبة خفية بعد الضغط على إيقاف.
        showEnablePrompt(err,null);
        if(typeof error==='function')error(err);
      },
      options||{enableHighAccuracy:true,timeout:15000,maximumAge:0}
    );
  }

  // إذا الصفحة كتبت "جاري تحديد موقعك..." نضيف الدائرة الصغيرة بجانب النص.
  function observeStatusText(){
    if(!document.body)return;
    const observer=new MutationObserver(function(){
      const el=findLocalStatus();
      if(el){
        el.classList.add('ha-location-loading');
        currentLocalStatus=el;
        if(globalChip)globalChip.classList.remove('show');
      }
    });
    observer.observe(document.body,{childList:true,subtree:true,characterData:true});
  }

  window.HA_LocationUX={
    getCurrentPosition,
    watchPosition,
    showSearching,
    hideSearching,
    showEnablePrompt,
    unsupported
  };

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',function(){
      ensureUI();
      observeStatusText();
    });
  }else{
    ensureUI();
    observeStatusText();
  }
})();