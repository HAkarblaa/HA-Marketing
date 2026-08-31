// HA Marketing - Firebase Web Push registration + Supabase token sync
(function(){
  const cfg=window.HA_PUSH_CONFIG;
  if(!cfg)return;

  const STORAGE_KEY='ha_notifications_enabled';
  const TOKEN_KEY='ha_web_push_token';
  const SB_URL='https://ubayrhtshgtgggxprrek.supabase.co';
  const SB_KEY='sb_publishable_p3108yoDkdJTLqVXhkvmBg_KVqe-1ll';
  let db=null;

  function load(src){
    return new Promise((ok,bad)=>{
      const s=document.createElement('script');
      s.src=src;s.onload=ok;s.onerror=bad;
      document.head.appendChild(s);
    });
  }

  async function ensureSupabase(){
    if(!window.supabase || !window.supabase.createClient){
      await load('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
    }
    if(!db) db=window.supabase.createClient(SB_URL,SB_KEY);
    return db;
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
    b.title=isEnabled()?'الإشعارات مفعّلة':'تشغيل الإشعارات';
    b.setAttribute('aria-label',b.title);
  }

  async function saveToken(token){
    if(!token)return false;
    const client=await ensureSupabase();
    const {data:{user}}=await client.auth.getUser();
    if(!user || user.is_anonymous)return false;

    const payload={
      user_id:user.id,
      token,
      platform:'web',
      user_agent:navigator.userAgent,
      updated_at:new Date().toISOString()
    };

    const {error}=await client.from('push_tokens').upsert(payload,{onConflict:'token'});
    if(error){
      console.warn('Could not save push token',error);
      return false;
    }
    localStorage.setItem(TOKEN_KEY,token);
    return true;
  }

  async function removeStoredToken(){
    const token=localStorage.getItem(TOKEN_KEY);
    if(!token)return;
    try{
      const client=await ensureSupabase();
      await client.from('push_tokens').delete().eq('token',token);
    }catch(e){console.warn(e)}
  }

  async function getCurrentToken(){
    if(!('serviceWorker' in navigator) || Notification.permission!=='granted')return null;
    const reg=await navigator.serviceWorker.register('./firebase-messaging-sw.js');
    const messaging=await ensureFirebase();
    return await messaging.getToken({
      vapidKey:cfg.vapidKey,
      serviceWorkerRegistration:reg
    });
  }

  async function syncStoredToken(){
    try{
      if(Notification.permission!=='granted')return;
      const token=await getCurrentToken();
      if(token){
        await saveToken(token);
        localStorage.setItem(STORAGE_KEY,'1');
        updateBell();
      }
    }catch(e){console.warn('Push token sync failed',e)}
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

    const client=await ensureSupabase();
    const {data:{user}}=await client.auth.getUser();
    if(!user || user.is_anonymous){
      alert('سجّل دخولك بحسابك أولاً حتى يتم ربط الإشعارات بحسابك.');
      return;
    }

    const permission=await Notification.requestPermission();
    if(permission!=='granted'){
      localStorage.setItem(STORAGE_KEY,'0');
      updateBell();
      alert('لم يتم السماح بالإشعارات.');
      return;
    }

    const token=await getCurrentToken();
    if(!token)throw new Error('لم يتم إنشاء رمز الإشعارات');

    const saved=await saveToken(token);
    if(!saved)throw new Error('تعذر ربط الإشعارات بالحساب');

    localStorage.setItem(STORAGE_KEY,'1');
    updateBell();
    alert('تم تشغيل الإشعارات وربط هذا الجهاز بحسابك.');
  }

  async function disableNotifications(){
    try{
      await removeStoredToken();
      if(window.firebase&&firebase.messaging){
        try{
          const messaging=firebase.messaging();
          if(messaging.deleteToken) await messaging.deleteToken();
        }catch(e){console.warn(e)}
      }
    }finally{
      localStorage.removeItem(TOKEN_KEY);
      localStorage.setItem(STORAGE_KEY,'0');
      updateBell();
      alert('تم إيقاف إشعارات هذا الجهاز.');
    }
  }

  async function toggleNotifications(){
    try{
      if(isEnabled()){
        if(confirm('الإشعارات مفعّلة حالياً. هل تريد إيقافها على هذا الجهاز؟')){
          await disableNotifications();
        }
      }else{
        await enableNotifications();
      }
    }catch(e){
      console.error(e);
      alert('تعذر تغيير حالة الإشعارات حالياً: '+(e?.message||''));
    }
  }

  function bind(){
    const b=document.getElementById('haPushButton');
    if(b)b.onclick=toggleNotifications;
    updateBell();
    // If permission was already granted, refresh/reattach the token to the currently signed-in account.
    syncStoredToken();
  }

  window.HA_EnableNotifications=enableNotifications;
  window.HA_ToggleNotifications=toggleNotifications;
  window.HA_SyncPushToken=syncStoredToken;

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);
  else bind();
})();
