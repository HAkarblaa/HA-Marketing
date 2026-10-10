// Explicit native/WebView links only; an ordinary Home visit never redirects.
(function(){
  'use strict';
  const base=new URL('./',document.currentScript.src),params=new URLSearchParams(location.search);
  const id=params.get('notification_id')||params.get('notification')||params.get('nid');
  const valid=/^\d+$/.test(id||'')&&Number.isSafeInteger(Number(id))&&Number(id)>0;
  const raw=params.get('link')||params.get('url');
  const direct=raw?window.HA_NotificationRoute?.requestTarget({link:raw},base.href):null;
  if(!valid&&!direct)return;
  let running=false,done=false;
  function bounded(p){let t;return Promise.race([p,new Promise((_,bad)=>t=setTimeout(()=>bad(Error('timeout')),8000))]).finally(()=>clearTimeout(t));}
  function report(){
    if(document.getElementById('haNotificationOpenStatus'))return;
    const note=document.createElement('p');note.id='haNotificationOpenStatus';note.setAttribute('role','status');note.setAttribute('data-no-i18n','');
    let lang='ar';try{lang=window.HAI18N?.getLanguage()||localStorage.getItem('ha_language_v1')||'ar';}catch(_e){}
    const words={ar:'تعذر فتح طلب الإشعار. افتح صفحة الإشعارات وحاول مجدداً.',iq:'ما كدرنا نفتح طلب الإشعار. افتح الإشعارات وحاول مرة ثانية.',en:'Could not open this request. Open Notifications and try again.',fa:'باز کردن این درخواست ممکن نشد. اعلان‌ها را باز کنید و دوباره تلاش کنید.'};
    note.textContent=words[lang]||words.ar;note.style.cssText='margin:12px auto;width:94%;max-width:860px;padding:12px;background:#fff7e1;color:#735a1b;border-radius:12px;font:13px/1.7 Tahoma,Arial,sans-serif';(document.querySelector('.ha-main,.wrap,.app')||document.body).prepend(note);
  }
  async function open(){
    if(running||done)return;running=true;
    try{
      const until=Date.now()+6000;while(!window.supabase?.createClient&&Date.now()<until)await new Promise(r=>setTimeout(r,100));
      if(!window.supabase?.createClient)throw Error('sdk');
      const db=window.supabase.createClient('https://ubayrhtshgtgggxprrek.supabase.co','sb_publishable_p3108yoDkdJTLqVXhkvmBg_KVqe-1ll',{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'ha-marketing-auth'}});
      const auth=await bounded(db.auth.getSession()),user=auth.data?.session?.user;
      if(auth.error)throw auth.error;if(!user||user.is_anonymous)return;
      let target=direct,n=null;
      if(valid){
        const result=await bounded(db.from('notifications').select('*').eq('id',Number(id)).eq('user_id',user.id).maybeSingle());
        if(result.error)throw result.error;n=result.data;
        if(!n||n.user_id!==user.id||String(n.id)!==String(Number(id)))throw Error('missing');
        target=window.HA_NotificationRoute.requestTarget(n,base.href);
      }
      if(!target)throw Error('not_request');
      const current=await bounded(db.auth.getSession());if(current.error||current.data?.session?.user?.id!==user.id||current.data.session.user.is_anonymous)throw Error('changed_account');
      if(n&&!n.is_read)db.from('notifications').update({is_read:true}).eq('id',n.id).eq('user_id',user.id).then(()=>{},()=>{});
      done=true;location.replace(target);
    }catch(_e){report();}finally{running=false;}
  }
  window.addEventListener('ha:account-ready',open);window.addEventListener('online',open);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',open,{once:true});else open();
})();

// Version 1.3.4 cannot forward the notification Intent to JavaScript.
// On Home in the Android app, resume the latest unread work request instead.
(function(){
  'use strict';
  const script=document.currentScript;
  const base=new URL('./',script.src),params=new URLSearchParams(location.search);
  const page=location.pathname.slice(base.pathname.length);
  if(!['','index.html'].includes(page)||params.has('notification_id')||params.has('notification')||params.has('nid')||params.has('link')||params.has('url'))return;
  let db=null,running=false,done=false,lastCheck=0;
  const memory=new Map();
  function android(){try{return !!window.HAAndroid;}catch(_e){return false;}}
  function bounded(p){let t;return Promise.race([p,new Promise((_,bad)=>t=setTimeout(()=>bad(Error('timeout')),8000))]).finally(()=>clearTimeout(t));}
  function key(uid){return 'ha_android_request_resume_v1:'+uid;}
  function checkpoint(uid){
    try{const raw=localStorage.getItem(key(uid));if(raw)return JSON.parse(raw);}catch(_e){}
    return memory.get(uid)||null;
  }
  function newer(row,mark){
    const at=Date.parse(row.created_at);if(!Number.isFinite(at))return false;
    if(!mark)return true;
    return at>mark.at||(at===mark.at&&Number(row.id)>Number(mark.id));
  }
  function remember(uid,row){
    const mark={at:Date.parse(row.created_at),id:String(row.id)};memory.set(uid,mark);
    try{localStorage.setItem(key(uid),JSON.stringify(mark));}catch(_e){}
  }
  async function check(){
    if(running||done||!android()||document.visibilityState==='hidden'||navigator.onLine===false||Date.now()-lastCheck<1500)return;
    running=true;lastCheck=Date.now();
    try{
      const until=Date.now()+6000;while(!window.supabase?.createClient&&Date.now()<until)await new Promise(r=>setTimeout(r,100));
      if(!window.supabase?.createClient||!window.HA_NotificationRoute||!window.HA_HomeMyOrders)return;
      db=db||window.supabase.createClient('https://ubayrhtshgtgggxprrek.supabase.co','sb_publishable_p3108yoDkdJTLqVXhkvmBg_KVqe-1ll',{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'ha-marketing-auth'}});
      const auth=await bounded(db.auth.getSession()),user=auth.data?.session?.user;
      if(auth.error||!user||user.is_anonymous)return;
      const [inbox,state]=await Promise.all([
        bounded(db.from('notifications').select('*').eq('user_id',user.id).eq('is_read',false).gte('created_at',new Date(Date.now()-2*3600000).toISOString()).order('created_at',{ascending:false}).order('id',{ascending:false}).limit(50)),
        bounded(window.HA_HomeMyOrders.refresh(true))
      ]);
      if(inbox.error||!Array.isArray(inbox.data)||state?.userId!==user.id||state.loading)return;
      const mark=checkpoint(user.id);let chosen=null,target=null;
      for(const row of inbox.data){
        if(row.user_id!==user.id||row.is_read!==false||!newer(row,mark))continue;
        const href=window.HA_NotificationRoute.requestTarget(row,base.href);if(!href)continue;
        const u=new URL(href),name=u.pathname.slice(base.pathname.length);
        if(u.origin!==base.origin||!u.pathname.startsWith(base.pathname))continue;
        const role={'driver.html':'driver','shop-courier.html':'driver','seller-dashboard.html':'seller','provider-dashboard.html':'provider'}[name];
        if(!role||!state.roles.includes(role))continue;
        chosen=row;target=u.href;break;
      }
      if(!chosen)return;
      const current=await bounded(db.auth.getSession());
      if(current.error||current.data?.session?.user?.id!==user.id||current.data.session.user.is_anonymous||document.visibilityState==='hidden')return;
      // Record before navigating so Back never reopens the same or older request.
      // Do not mark it read: its authorized destination/inbox owns that decision.
      remember(user.id,chosen);done=true;location.replace(target);
    }catch(_e){/* Keep Home usable; retry on resume, reconnect, or the next check. */}
    finally{running=false;}
  }
  function resume(){check();}
  window.addEventListener('ha:account-ready',resume);
  window.addEventListener('focus',resume);
  window.addEventListener('online',resume);
  window.addEventListener('pageshow',event=>{if(event.persisted)done=false;resume();});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')resume();});
  setInterval(resume,30000);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',resume,{once:true});else resume();
})();
