// HA Marketing - Web Push / FCM
(function(){
  const cfg=window.HA_PUSH_CONFIG;
  if(!cfg)return;

  const SB_URL='https://ubayrhtshgtgggxprrek.supabase.co';
  const SB_KEY='sb_publishable_p3108yoDkdJTLqVXhkvmBg_KVqe-1ll';
  const STORAGE_KEY='ha_notifications_enabled';
  const TOKEN_KEY='ha_web_push_token';
  let pushDb=null;
  let messagingRef=null;

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
      !!localStorage.getItem(TOKEN_KEY);
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
    const token=await messaging.getToken({
      vapidKey:cfg.vapidKey,
      serviceWorkerRegistration:reg
    });

    if(!token)throw new Error('Firebase لم يرجع توكن إشعارات.');

    await saveToken(token);

    localStorage.setItem(TOKEN_KEY,token);
    localStorage.setItem(STORAGE_KEY,'1');
    updateBell();

    // إشعارات أثناء فتح الصفحة.
    if(!window.__haForegroundPushBound){
      window.__haForegroundPushBound=true;
      messaging.onMessage(payload=>{
        const title=payload?.notification?.title||payload?.data?.title||'HA Marketing';
        const body=payload?.notification?.body||payload?.data?.body||'وصلك إشعار جديد';
        try{
          if(Notification.permission==='granted'){
            new Notification(title,{
              body,
              icon:'./icon-192.png',
              badge:'./icon-192.png',
              data:{url:payload?.data?.link||payload?.fcmOptions?.link||'./notifications-center.html'}
            });
          }
        }catch(e){console.warn(e)}
      });
    }

    alert('✅ تم تشغيل إشعارات الموبايل وربط هذا الجهاز بحسابك.');
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
    localStorage.setItem(STORAGE_KEY,'0');
    updateBell();
    alert('تم إيقاف الإشعارات على هذا الجهاز.');
  }

  async function toggleNotifications(){
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
    }
  }

  function bind(){
    document.querySelectorAll('[data-ha-push-button],#haPushButton').forEach(b=>{
      b.onclick=toggleNotifications;
    });
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
