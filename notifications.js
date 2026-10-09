// HA Marketing - Web Push / FCM
(function(){
  const cfg=window.HA_PUSH_CONFIG;
  if(!cfg)return;

  const SB_URL='https://ubayrhtshgtgggxprrek.supabase.co';
  const SB_KEY='sb_publishable_p3108yoDkdJTLqVXhkvmBg_KVqe-1ll';
  const STORAGE_KEY='ha_notifications_enabled';
  const TOKEN_KEY='ha_web_push_token';
  const OWNER_KEY='ha_web_push_user';
  let pushDb=null;
  let messagingRef=null;
  let currentOwner=null;
  let pushBusy=false;

  function getDb(){
    if(pushDb)return pushDb;
    if(!window.supabase)throw new Error('Supabase غير محمّل');
    pushDb=window.supabase.createClient(SB_URL,SB_KEY,{
      auth:{
        persistSession:true,
        autoRefreshToken:true,
        detectSessionInUrl:true,
        storageKey:'ha-marketing-auth'
      }
    });
    return pushDb;
  }

  function load(src){
    return new Promise((ok,bad)=>{
      if([...document.scripts].some(s=>s.src===src)){ok();return;}
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
    messagingRef=firebase.messaging();
    return messagingRef;
  }

  async function sessionUser(){
    const {data:{session},error}=await getDb().auth.getSession();
    if(error)throw error;
    return {session,user:session?.user||null};
  }

  function isEnabled(){
    return localStorage.getItem(STORAGE_KEY)==='1' &&
      typeof Notification!=='undefined' &&
      Notification.permission==='granted' &&
      !!localStorage.getItem(TOKEN_KEY) &&
      !!currentOwner && localStorage.getItem(OWNER_KEY)===currentOwner;
  }

  function updateBell(){
    const buttons=document.querySelectorAll('[data-ha-push-button],#haPushButton');
    buttons.forEach(b=>{
      const on=isEnabled();
      b.classList.toggle('on',on);
      b.textContent=on?'🔔 الإشعارات الخارجية مفعّلة':'🔕 تشغيل إشعارات الموبايل';
      b.title=on?'الإشعارات الخارجية مفعّلة':'تشغيل إشعارات الموبايل';
      b.setAttribute('aria-label',b.title);
    });
  }

  async function saveToken(token){
    const {session,user}=await sessionUser();
    if(!session||!user||user.is_anonymous){
      throw new Error('سجل الدخول أولاً حتى نربط الإشعارات بحسابك.');
    }

    const payload={
      user_id:user.id,
      token,
      platform:'web',
      user_agent:navigator.userAgent||'HA Marketing Web',
      enabled:true,
      last_seen_at:new Date().toISOString()
    };

    const {error}=await getDb()
      .from('push_tokens')
      .upsert(payload,{onConflict:'token'});

    if(error)throw error;
  }

  async function disableDbToken(token){
    if(!token)return;
    try{
      const {session,user}=await sessionUser();
      if(!session||!user)return;
      await getDb()
        .from('push_tokens')
        .update({enabled:false,last_seen_at:new Date().toISOString()})
        .eq('token',token)
        .eq('user_id',user.id);
    }catch(e){
      console.warn('push disable db',e);
    }
  }

  async function enableNotifications(){
    if(!navigator.onLine){
      alert('تحتاج إنترنت لتشغيل الإشعارات.');
      return;
    }
    if(!('serviceWorker' in navigator)||!('Notification' in window)){
      alert('هذا المتصفح لا يدعم إشعارات الويب.');
      return;
    }
    if(!cfg.vapidKey){
      alert('مفتاح Web Push غير موجود.');
      return;
    }

    const {user}=await sessionUser();
    if(!user||user.is_anonymous){
      alert('سجل الدخول أولاً، وبعدها شغّل الإشعارات.');
      return;
    }

    const permission=await Notification.requestPermission();
    if(permission!=='granted'){
      localStorage.setItem(STORAGE_KEY,'0');
      updateBell();
      alert('لم يتم السماح بالإشعارات. فعّلها من إعدادات المتصفح إذا كنت تريدها.');
      return;
    }

    // نطاق مستقل حتى لا يستبدل Service Worker الخاص بالأوفلاين.
    const reg=await navigator.serviceWorker.register(
      './firebase-messaging-sw.js',
      {scope:'./fcm/'}
    );

    const messaging=await ensureFirebase();
    // A shared phone may have switched accounts. Obtain a fresh token instead
    // of falsely showing "enabled" for the device token registered to someone else.
    if(localStorage.getItem(TOKEN_KEY)&&localStorage.getItem(OWNER_KEY)!==user.id){
      await messaging.deleteToken();
      localStorage.removeItem(TOKEN_KEY);
      localStorage.setItem(STORAGE_KEY,'0');
    }
    const token=await messaging.getToken({
      vapidKey:cfg.vapidKey,
      serviceWorkerRegistration:reg
    });

    if(!token)throw new Error('Firebase لم يرجع توكن إشعارات.');

    await saveToken(token);

    localStorage.setItem(TOKEN_KEY,token);
    currentOwner=user.id;
    localStorage.setItem(OWNER_KEY,user.id);
    localStorage.setItem(STORAGE_KEY,'1');
    updateBell();

    bindForeground(messaging,reg);

    alert('✅ تم تشغيل إشعارات الموبايل وربط هذا الجهاز بحسابك.');
  }

  function bindForeground(messaging,reg){
    // Restore the foreground listener on every page visit, not only after pressing Enable.
    if(!window.__haForegroundPushBound){
      window.__haForegroundPushBound=true;
      messaging.onMessage(async payload=>{
        const title=payload?.notification?.title||payload?.data?.title||'HA Marketing';
        const body=payload?.notification?.body||payload?.data?.body||'وصلك إشعار جديد';
        try{
          if(isEnabled()){
            const options={
              body,
              icon:'./ha-logo-transparent.png',
              badge:'./notification-icon.png',
              tag:'ha-notification-'+(payload?.data?.notification_id||payload?.messageId||Date.now()),
              data:{url:new URL(payload?.data?.link||payload?.fcmOptions?.link||'./notifications-center.html',location.href).href}
            };
            // Mobile browsers require the registered messaging worker to display notifications.
            if(reg?.showNotification){await reg.showNotification(title,options);return;}
            const notice=new Notification(title,options);
            notice.onclick=()=>{
              const url=payload?.data?.link||payload?.fcmOptions?.link||'./notifications-center.html';
              try{const target=new URL(url,location.href);if(['https:','http:'].includes(target.protocol)){window.focus();location.href=target.href;}}catch(e){}
              notice.close();
            };
          }
        }catch(e){console.warn(e)}
      });
    }

  }

  async function disableNotifications(){
    const token=localStorage.getItem(TOKEN_KEY);
    await disableDbToken(token);

    try{
      const messaging=await ensureFirebase();
      if(token && messaging.deleteToken){
        await messaging.deleteToken();
      }
    }catch(e){
      console.warn('delete push token',e);
    }

    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(OWNER_KEY);
    localStorage.setItem(STORAGE_KEY,'0');
    updateBell();
    alert('تم إيقاف الإشعارات على هذا الجهاز.');
  }

  async function toggleNotifications(){
    if(pushBusy)return;
    pushBusy=true;
    document.querySelectorAll('[data-ha-push-button],#haPushButton').forEach(b=>b.disabled=true);
    try{
      if(isEnabled()){
        if(confirm('الإشعارات مفعّلة على هذا الجهاز. تريد إيقافها؟')){
          await disableNotifications();
        }
      }else{
        await enableNotifications();
      }
    }catch(e){
      console.error(e);
      alert('تعذر تشغيل الإشعارات: '+(e?.message||'خطأ غير معروف'));
    }finally{
      pushBusy=false;
      document.querySelectorAll('[data-ha-push-button],#haPushButton').forEach(b=>b.disabled=false);
      updateBell();
    }
  }

  async function restoreNotifications(){
    try{
      const {user}=await sessionUser();
      currentOwner=user?.id||null;
      if(!user||user.is_anonymous)return;
      if(!isEnabled())return;
      const reg=await navigator.serviceWorker.register('./firebase-messaging-sw.js',{scope:'./fcm/'});
      const messaging=await ensureFirebase();
      const token=await messaging.getToken({vapidKey:cfg.vapidKey,serviceWorkerRegistration:reg});
      if(!token)throw new Error('No device token');
      await saveToken(token);
      localStorage.setItem(TOKEN_KEY,token);
      bindForeground(messaging,reg);
    }catch(e){
      localStorage.setItem(STORAGE_KEY,'0');
      console.warn('push registration needs renewal',e);
    }finally{updateBell();}
  }

  function bind(){
    document.querySelectorAll('[data-ha-push-button],#haPushButton').forEach(b=>{
      b.onclick=toggleNotifications;
    });
    updateBell();
    restoreNotifications();
  }

  window.HA_EnableNotifications=enableNotifications;
  window.HA_ToggleNotifications=toggleNotifications;

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',bind);
  }else{
    bind();
  }
})();
