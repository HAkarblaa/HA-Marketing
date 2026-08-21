// HA Marketing - Web Push notifications
(function(){
  const cfg=window.HA_PUSH_CONFIG;
  if(!cfg)return;

  const STORAGE_KEY='ha_notifications_enabled';

  function load(src){
    return new Promise((ok,bad)=>{
      const s=document.createElement('script');
      s.src=src;s.onload=ok;s.onerror=bad;
      document.head.appendChild(s);
    });
  }

  async function ensureFirebase(){
    if(!(window.firebase&&firebase.messaging)){
      await load('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
      await load('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');
    }
    if(!firebase.apps.length)firebase.initializeApp(cfg.firebaseConfig);
    return firebase.messaging();
  }

  function isEnabled(){
    return localStorage.getItem(STORAGE_KEY)==='1' && Notification.permission==='granted';
  }

  function updateBell(){
    const b=document.getElementById('haPushButton');
    if(!b)return;
    b.classList.toggle('on',isEnabled());
    b.title=isEnabled()?'الإشعارات مفعّلة':'الإشعارات متوقفة';
    b.setAttribute('aria-label',b.title);
  }

  async function enableNotifications(){
    if(!('serviceWorker' in navigator)||!('Notification' in window)){
      alert('هذا المتصفح لا يدعم الإشعارات.');
      return;
    }
    if(!cfg.vapidKey||cfg.vapidKey.includes('PUT_YOUR')){
      alert('إعداد الإشعارات غير مكتمل بعد.');
      return;
    }

    const permission=await Notification.requestPermission();
    if(permission!=='granted'){
      localStorage.setItem(STORAGE_KEY,'0');
      updateBell();
      alert('لم يتم السماح بالإشعارات.');
      return;
    }

    const reg=await navigator.serviceWorker.register('./firebase-messaging-sw.js');
    const messaging=await ensureFirebase();
    const token=await messaging.getToken({
      vapidKey:cfg.vapidKey,
      serviceWorkerRegistration:reg
    });

    if(token){
      localStorage.setItem('ha_web_push_token',token);
      localStorage.setItem(STORAGE_KEY,'1');
      updateBell();
      alert('تم تشغيل الإشعارات.');
    }
  }

  async function disableNotifications(){
    try{
      if(window.firebase&&firebase.messaging){
        try{
          const messaging=firebase.messaging();
          const token=localStorage.getItem('ha_web_push_token');
          if(token && messaging.deleteToken) await messaging.deleteToken(token);
        }catch(e){console.warn(e)}
      }
    }finally{
      localStorage.removeItem('ha_web_push_token');
      localStorage.setItem(STORAGE_KEY,'0');
      updateBell();
      alert('تم إيقاف الإشعارات.');
    }
  }

  async function toggleNotifications(){
    try{
      if(isEnabled()){
        if(confirm('الإشعارات مفعّلة حالياً. هل تريد إيقافها؟')){
          await disableNotifications();
        }
      }else{
        if(confirm('الإشعارات متوقفة حالياً. هل تريد تشغيلها؟')){
          await enableNotifications();
        }
      }
    }catch(e){
      console.error(e);
      alert('تعذر تغيير حالة الإشعارات حالياً.');
    }
  }

  function bind(){
    const b=document.getElementById('haPushButton');
    if(!b)return;
    b.onclick=toggleNotifications;
    updateBell();
  }

  window.HA_EnableNotifications=enableNotifications;
  window.HA_ToggleNotifications=toggleNotifications;

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',bind);
  }else{
    bind();
  }
})();
