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
