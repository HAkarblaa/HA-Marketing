/* HA Marketing - open immediately for a saved signed-in account; guests must sign in.
   UI gate only: database RLS and existing role checks remain authoritative. */
(function(){
  'use strict';
  if(window.HA_AccountGate)return;
  const root=document.documentElement;
  const base=new URL('./',document.currentScript.src);
  const STORAGE='ha-marketing-auth';
  const GUEST='ha_guest_mode';
  const guestPages=['index.html','', 'study.html','study-summary.html','study-summary[1].html','study-exam.html','study-library.html','study-language.html','study-primary.html','study-middle.html','study-preparatory.html','study-grade-hub.html','study-directory.html','education-news.html','higher-education-news.html','entertainment.html','games.html','games-hub.html','games-ranking.html','snake.html','level-devil.html','bird-game.html','penalties.html','movies.html','series.html'];
  const guestPage=guestPages.includes(location.pathname.slice(base.pathname.length));
  const NEXT='ha_account_return_to';
  const VERIFIED='ha_account_verified_session';
  const publicPages=['login.html','register.html','forgot-password.html','privacy-policy.html','delete-account.html'];
  const relative=location.pathname.slice(base.pathname.length);
  const isPublic=location.origin===base.origin && publicPages.includes(relative);
  let client=null,sdkPromise=null,run=0,expiryTimer=null,subscription=null,inFlight=null,lastAllowedUser=null;
  let state=isPublic?'public':'checking';

  function store(storage,key,value){try{storage.setItem(key,value);}catch(_){}}
  function read(storage,key){try{return storage.getItem(key);}catch(_){return null;}}
  function remove(storage,key){try{storage.removeItem(key);}catch(_){}}
  function safeNext(value){
    try{
      if(!value || /[\\\u0000-\u001f]/.test(value))return new URL('index.html',base).href;
      const url=new URL(value,base),path=decodeURIComponent(url.pathname);
      if(url.origin!==base.origin || !path.startsWith(base.pathname) ||
         path.split('/').some(p=>p==='.'||p==='..') || !/\.html$/i.test(path) ||
         publicPages.includes(path.slice(base.pathname.length)))return new URL('index.html',base).href;
      return url.href;
    }catch(_){return new URL('index.html',base).href;}
  }
  function nextURL(){
    const value=new URL(location.href).searchParams.get('next') || read(sessionStorage,NEXT);
    return safeNext(value);
  }
  function rememberPage(){
    if(!isPublic)store(sessionStorage,NEXT,relative+location.search+location.hash);
  }
  function loginURL(){
    const url=new URL('login.html',base);
    const next=safeNext(relative+location.search+location.hash);
    url.searchParams.set('next',next.slice(base.href.length));
    return url.href;
  }
  function lock(){
    if(isPublic)return;
    root.setAttribute('data-ha-account-lock','1');
  }
  function panel(message,error=false){
    if(!document.body)return;
    let box=document.getElementById('haAccountGate');
    if(!box){
      box=document.createElement('section');box.id='haAccountGate';box.setAttribute('role','status');box.setAttribute('aria-live','polite');
      const title=document.createElement('strong');title.textContent='HA Marketing';
      const text=document.createElement('p');text.id='haAccountGateText';
      const retry=document.createElement('button');retry.id='haAccountGateRetry';retry.type='button';retry.textContent='إعادة المحاولة';retry.onclick=()=>check();
      const login=document.createElement('a');login.href=loginURL();login.textContent='تسجيل الدخول';
      box.append(title,text,retry,login);document.body.appendChild(box);
    }
    box.querySelector('#haAccountGateText').textContent=message;
    box.querySelector('#haAccountGateRetry').hidden=!error;
    box.querySelector('a').hidden=!error;
  }
  function redirect(){
    if(guestPage && read(localStorage,GUEST)==='1'){allowGuest();return;}
    state='redirecting';run++;lock();rememberPage();clearTimeout(expiryTimer);
    remove(localStorage,'ha_logged_in');remove(sessionStorage,VERIFIED);
    location.replace(loginURL());
  }
  function validSession(session){
    return !!(session?.access_token && session?.user?.id &&
      session.user.is_anonymous!==true && Number(session.expires_at)>Date.now()/1000);
  }
  function savedSession(){
    // A login flag alone never opens the app. Require the saved account and its unexpired token.
    try{
      const session=JSON.parse(read(localStorage,STORAGE)||'null');
      if(!validSession(session))return null;
      const part=session.access_token.split('.')[1];
      const claim=JSON.parse(atob(part.replace(/-/g,'+').replace(/_/g,'/')));
      if(claim.sub!==session.user.id || claim.role!=='authenticated' ||
         claim.is_anonymous===true || !Number.isFinite(Number(claim.exp)) || Number(claim.exp)<=Date.now()/1000)return null;
      return session;
    }catch(_){return null;}
  }
  function allow(session){
    const changed=state!=='allowed'||lastAllowedUser!==session.user.id;
    state='allowed';lastAllowedUser=session.user.id;clearTimeout(expiryTimer);
    store(localStorage,'ha_logged_in','1');
    root.removeAttribute('data-ha-account-lock');
    document.getElementById('haAccountGate')?.remove();
    document.getElementById('haSplash')?.classList.add('hide');
    // Refresh expired sessions without an inter-page verification overlay.
    expiryTimer=setTimeout(()=>{check();},Math.min(2147483647,Math.max(1000,Number(session.expires_at)*1000-Date.now())));
    if(changed)window.dispatchEvent(new CustomEvent('ha:account-ready',{detail:{user:session.user}}));
  }
  function timeout(promise,ms){
    let timer;
    return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('account_check_timeout')),ms);})]).finally(()=>clearTimeout(timer));
  }
  async function sdk(){
    if(window.supabase?.createClient)return window.supabase;
    if(sdkPromise)return sdkPromise;
    sdkPromise=timeout(new Promise((resolve,reject)=>{
      const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      script.onload=()=>window.supabase?.createClient?resolve(window.supabase):reject(new Error('sdk_missing'));
      script.onerror=()=>reject(new Error('sdk_unavailable'));document.head.appendChild(script);
    }),10000).catch(e=>{sdkPromise=null;throw e;});
    return sdkPromise;
  }
  async function getClient(){
    if(client)return client;
    const lib=await sdk();
    client=lib.createClient('https://ubayrhtshgtgggxprrek.supabase.co','sb_publishable_p3108yoDkdJTLqVXhkvmBg_KVqe-1ll',{
      auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:STORAGE}
    });
    if(!subscription){
      subscription=client.auth.onAuthStateChange((event,session)=>{
        document.documentElement.setAttribute('data-ha-print-admin','0');
        setTimeout(()=>window.dispatchEvent(new Event('ha:print-auth-change')),0);
        if(event==='SIGNED_OUT' || (event==='SIGNED_IN' && session?.user?.is_anonymous===true)){
          redirect();return;
        }
        // Run Supabase calls outside the auth callback to avoid holding its session lock.
        if(['SIGNED_IN','TOKEN_REFRESHED','USER_UPDATED'].includes(event)){
          if(session?.user?.id&&session.user.id!==lastAllowedUser){run++;inFlight=null;remove(sessionStorage,VERIFIED);}
          // Never call Supabase while its auth callback holds the session lock.
          setTimeout(()=>check(),0);
        }
      }).data.subscription;
    }
    return client;
  }
  function hasCallback(){return new URL(location.href).searchParams.has('code') || /access_token=/.test(location.hash);}
  function wasVerified(session){
    try{const v=JSON.parse(read(sessionStorage,VERIFIED)||'null');return v?.user_id===session.user.id&&v.expires_at===session.expires_at;}catch(_){return false;}
  }
  function check(){
    if(isPublic || state==='redirecting')return Promise.resolve();
    if(guestPage && read(localStorage,GUEST)==='1' && !savedSession()){allowGuest();return Promise.resolve();}
    const cached=savedSession();
    if(cached)allow(cached);
    else if(!navigator.onLine || (!read(localStorage,STORAGE)&&!hasCallback())){redirect();return Promise.resolve();}
    else{state='checking';lock();}
    if(!navigator.onLine)return Promise.resolve();
    if(inFlight)return inFlight;
    const current=++run;
    const pending=reconcile(current).finally(()=>{if(inFlight===pending)inFlight=null;});
    inFlight=pending;return pending;
  }
  async function reconcile(current){
    try{
      const db=await getClient();
      if(current!==run)return;
      const {data,error}=await timeout(db.auth.getSession(),12000);
      if(current!==run)return;
      if(error){
        if([400,401,403].includes(error.status) || error.name==='AuthSessionMissingError'){redirect();return;}
        throw error;
      }
      const session=data?.session;
      if(!validSession(session)){redirect();return;}
      // Open first; verify identity once for this token in this tab, in the background.
      allow(session);
      if(wasVerified(session))return;
      const verified=await timeout(db.auth.getUser(),12000);
      if(current!==run)return;
      if(verified.error){
        if([400,401,403].includes(verified.error.status) || verified.error.name==='AuthSessionMissingError'){redirect();return;}
        throw verified.error;
      }
      if(!verified.data?.user || verified.data.user.is_anonymous===true || verified.data.user.id!==session.user.id){redirect();return;}
      if(!validSession(session)){setTimeout(()=>check(),0);return;}
      store(sessionStorage,VERIFIED,JSON.stringify({user_id:session.user.id,expires_at:session.expires_at}));
      allow({...session,user:verified.data.user});
    }catch(e){
      if(current!==run)return;
      const cached=savedSession();
      if(cached){allow(cached);return;}
      state='error';lock();panel('تعذر تجديد تسجيل الدخول. اتصل بالإنترنت وحاول مجدداً أو سجّل الدخول.',true);
    }
  }
  function allowGuest(){
    state='guest';clearTimeout(expiryTimer);root.removeAttribute('data-ha-account-lock');
    document.getElementById('haAccountGate')?.remove();
    document.getElementById('haSplash')?.classList.add('hide');
    const ready=()=>{document.getElementById('haSplash')?.classList.add('hide');};
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
  }
  function guestPrompt(target){
    let dialog=document.getElementById('haGuestDialog');if(dialog){dialog.showModal();return;}
    dialog=document.createElement('dialog');dialog.id='haGuestDialog';dialog.dir='rtl';
    dialog.style.cssText='border:0;border-radius:24px;padding:24px;width:min(88vw,380px);text-align:center;color:#16324f;font-family:Tahoma,Arial;background:white;box-shadow:0 20px 80px #0004';
    const title=document.createElement('h2');title.textContent='يجب إنشاء حساب';
    const text=document.createElement('p');text.textContent='لاستخدام التسوق أو النقل أو طلب خدمة، أنشئ حساباً أو سجّل الدخول. الدراسة والترفيه متاحان للضيف.';text.style.lineHeight='1.8';
    dialog.append(title,text);
    for(const [label,page,color] of [['إنشاء حساب','register.html','#07996f'],['تسجيل الدخول','login.html','#087de1']]){
      const a=document.createElement('a');const url=new URL(page,base);url.searchParams.set('next',target);a.href=url.href;a.textContent=label;a.style.cssText='display:block;margin:10px 0;padding:13px;border-radius:13px;color:white;text-decoration:none;background:'+color;dialog.append(a);
    }
    const close=document.createElement('button');close.type='button';close.textContent='متابعة كضيف';close.style.cssText='border:0;background:transparent;color:#087de1;padding:12px;font:inherit';close.onclick=()=>{dialog.close();dialog.remove();};dialog.append(close);document.body.append(dialog);dialog.showModal();
    dialog.addEventListener('close',()=>dialog.remove(),{once:true});
  }
  document.addEventListener('click',event=>{
    if(read(localStorage,GUEST)!=='1'||savedSession())return;
    const a=event.target.closest?.('a[href]');if(!a||a.closest('#haGuestDialog'))return;
    const url=new URL(a.href,location.href);if(url.origin!==base.origin||!url.pathname.startsWith(base.pathname))return;
    const page=url.pathname.slice(base.pathname.length);
    if(!page.endsWith('.html')||guestPages.includes(page)||publicPages.includes(page))return;
    event.preventDefault();event.stopImmediatePropagation();guestPrompt(page+url.search+url.hash);
  },true);
  function publicLinks(){
    const next=nextURL();
    document.querySelectorAll('a[href]').forEach(a=>{
      const url=new URL(a.getAttribute('href'),location.href);
      if(url.origin===base.origin && ['login.html','register.html','forgot-password.html'].some(p=>url.pathname===new URL(p,base).pathname)){
        url.searchParams.set('next',next.slice(base.href.length));a.href=url.href;
      }
    });
  }
  window.HA_AccountGate={check,nextURL,safeNext,get state(){return state;},
    async isMainAdmin(){
      try{
        const c=await getClient(),u=await c.auth.getUser();
        const id=u.data?.user?.id;if(u.error||!id||u.data.user.is_anonymous)return false;
        const r=await c.rpc('is_super_admin');
        let allowed=!r.error&&r.data===true;
        if(!allowed){const a=await c.from('app_admins').select('is_super_admin,is_active').eq('user_id',id).maybeSingle();allowed=!a.error&&a.data?.is_active===true&&a.data?.is_super_admin===true;}
        const current=await c.auth.getUser();
        return !!(allowed&&!current.error&&current.data?.user?.id===id);
      }catch(_){return false;}
    }
  };
  if(isPublic){
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',publicLinks,{once:true});else publicLinks();
    return;
  }
  rememberPage();
  // Synchronous local session check removes the boot lock before the page is painted.
  const initial=savedSession();
  if(!initial && guestPage && read(localStorage,GUEST)==='1'){allowGuest();return;}
  if(initial)allow(initial);
  else if(!read(localStorage,STORAGE)&&!hasCallback()){redirect();return;}
  else lock();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',check,{once:true});else check();
  window.addEventListener('pageshow',event=>{if(event.persisted)check();});
  window.addEventListener('online',check);
  window.addEventListener('offline',check);
  window.addEventListener('storage',event=>{
    if(event.key===STORAGE || event.key===null){
      if(!read(localStorage,STORAGE)){redirect();return;}
      // Discard an in-flight response for a previous account/token.
      run++;inFlight=null;check();
    }
  });
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)check();});
})();

// Install static caching after the first paint; leave specialized map workers alone.
(function(){
  if(!('serviceWorker' in navigator)||window.__haStaticCacheRequested)return;
  window.__haStaticCacheRequested=true;
  const base=new URL('./',document.currentScript.src);
  async function install(){
    try{
      const reg=await navigator.serviceWorker.getRegistration(base.href);
      const worker=reg?.active||reg?.waiting||reg?.installing;
      if(worker&&new URL(worker.scriptURL).pathname!==new URL('service-worker.js',base).pathname)return;
      await navigator.serviceWorker.register(new URL('service-worker.js',base).href,{scope:base.pathname,updateViaCache:'none'});
    }catch(_e){}
  }
  function schedule(){if(window.requestIdleCallback)requestIdleCallback(install,{timeout:2000});else setTimeout(install,500);}
  if(document.readyState==='complete')schedule();else window.addEventListener('load',schedule,{once:true});
})();

/* Website-controlled update gate for native HAAndroid versioned clients. */
(function(){
'use strict';if(window.__haUpdateGate)return;window.__haUpdateGate=true;
const base=new URL('./',document.currentScript.src);
const match=navigator.userAgent.match(/\bHAAndroid\/(\d+(?:\.\d+){0,3})(?=\s|$)/);
if(!match)return; // Browsers and legacy clients without a version marker are not identifiable.
const installed=match[1],store='https://play.google.com/store/apps/details?id=com.hamarketing.ap';
let running=false,last=0;
function compare(a,b){const x=a.split('.').map(Number),y=b.split('.').map(Number);for(let i=0;i<Math.max(x.length,y.length);i++){const d=(x[i]||0)-(y[i]||0);if(d)return Math.sign(d);}return 0;}
function unblock(){document.getElementById('haRequiredUpdate')?.remove();}
function show(c){
 const render=()=>{
  let box=document.getElementById('haRequiredUpdate');if(box)return;
  const style=document.createElement('style');style.textContent='#haRequiredUpdate::backdrop{background:rgba(12,32,55,.82)}';document.head.append(style);
  box=document.createElement('dialog');box.id='haRequiredUpdate';box.dir='rtl';box.setAttribute('aria-labelledby','haRequiredUpdateTitle');
  box.style.cssText='border:0;border-radius:24px;padding:28px 22px;width:min(88vw,390px);background:white;color:#16324f;text-align:center;font-family:Tahoma,Arial;box-shadow:0 20px 70px #0005';
  const title=document.createElement('h2');title.id='haRequiredUpdateTitle';title.textContent='تحديث التطبيق مطلوب';
  const message=document.createElement('p');message.textContent=c.message||'حتى تستمر باستخدام التطبيق، حدّثه إلى النسخة الجديدة من سوق بلي.';message.style.lineHeight='1.8';
  const version=document.createElement('p');version.textContent='نسختك '+installed+' — الحد الأدنى '+c.minimum_version;version.style.cssText='font-size:12px;color:#64748b';
  const link=document.createElement('a');link.href=store;link.textContent='حدّث من سوق بلي';link.style.cssText='display:block;padding:15px;border-radius:14px;background:#087de1;color:white;text-decoration:none;font-weight:bold;margin-top:18px';
  const retry=document.createElement('button');retry.type='button';retry.textContent='إعادة التحقق';retry.style.cssText='margin-top:12px;padding:10px;border:0;background:transparent;color:#087de1;font:inherit';retry.onclick=()=>check(true);
  box.append(title,message,version,link,retry);box.addEventListener('cancel',e=>e.preventDefault());document.body.append(box);box.showModal();
 };
 if(document.body)render();else document.addEventListener('DOMContentLoaded',render,{once:true});
}
async function check(force=false){
 if(running||(!force&&Date.now()-last<30000))return;running=true;last=Date.now();
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),7000);
 try{
  const url=new URL('ha-update-config.json',base);url.searchParams.set('t',Date.now());
  const response=await fetch(url,{cache:'no-store',credentials:'omit',signal:controller.signal});if(!response.ok)return;
  const c=await response.json();if(typeof c.enabled!=='boolean'||!/^\d+(?:\.\d+){0,3}$/.test(c.minimum_version||''))return;
  if(c.enabled&&compare(installed,c.minimum_version)<0)show(c);else unblock();
 }catch(_){/* Network/config failures must not lock out everyone. */}
 finally{clearTimeout(timer);running=false;}
}
check(true);document.addEventListener('visibilitychange',()=>{if(!document.hidden)check(true)});window.addEventListener('online',()=>check(true));setInterval(()=>{if(!document.hidden)check()},60000);
})();

/* HA interstitial requests at content navigation boundaries. */
(function(){
 'use strict';
 if(window.__haNavigationAds)return;window.__haNavigationAds=true;
 const targets=new Set(['shop.html','services.html','study.html','taxi-delivery.html','entertainment.html','sports-center.html','snake.html','level-devil.html','bird-game.html','penalties.html','chess.html','royal-chess.html','piano.html']);
 let lastRequest=-Infinity;
 document.addEventListener('click',function(event){
  if(event.defaultPrevented||event.button>0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
  const link=event.target.closest&&event.target.closest('a[href]');
  if(!link||link.hasAttribute('download')||(link.target&&link.target!=='_self'))return;
  let destination;try{destination=new URL(link.href,location.href);}catch(_){return;}
  if(destination.origin!==location.origin||!destination.pathname.startsWith('/HA-Marketing/'))return;
  if(destination.pathname===location.pathname)return;
  if(!targets.has(destination.pathname.split('/').pop().toLowerCase()))return;
  const native=window.HAAndroid;if(!native||typeof native.adBreak!=='function')return;
  const now=performance.now();if(now-lastRequest<1500)return;lastRequest=now;
  // Native owns consent, loaded ads and frequency limits. No timer, retries or navigation blocking.
  try{Promise.resolve(native.adBreak()).catch(function(){});}catch(_){}
 },true);
})();

/* Print entry visibility: verified main admin only, fail closed. UI restriction only. */
(function(){
'use strict';if(window.HAPrintAccess)return;
const root=document.documentElement;root.setAttribute('data-ha-print-admin','0');
const css=document.createElement('style');css.textContent='html:not([data-ha-print-admin="1"]) #haNativePrinterEntry,html:not([data-ha-print-admin="1"]) a[href*="image-print.html"]{display:none!important}html[data-ha-print-page]:not([data-ha-print-admin="1"]) main{display:none!important}';document.head.appendChild(css);
let revision=0,allowed=false;
function wrapBridge(){
 const n=window.HAAndroid;if(!n||typeof n.openPrinters!=='function'||n.openPrinters.__haAdminGuard)return;
 const original=n.openPrinters.bind(n);
 function guarded(){if(!allowed){alert('الطباعة متاحة للأدمن الرئيسي فقط');return;}return original();}
 guarded.__haAdminGuard=true;n.openPrinters=guarded;
}
function update(ok){allowed=ok;root.setAttribute('data-ha-print-admin',ok?'1':'0');wrapBridge();window.dispatchEvent(new CustomEvent('ha:print-access',{detail:{allowed:ok}}));}
async function refresh(){const current=++revision;update(false);const ok=await window.HA_AccountGate.isMainAdmin();if(current===revision)update(ok);return current===revision&&ok;}
window.HAPrintAccess={refresh,get allowed(){return allowed;}};
document.addEventListener('click',e=>{const el=e.target.closest?.('#haNativePrinterEntry,a[href*="image-print.html"]');if(el&&!allowed){e.preventDefault();e.stopImmediatePropagation();}},true);
window.addEventListener('ha:native-ready',wrapBridge);
window.addEventListener('ha:print-auth-change',refresh);
window.addEventListener('pageshow',refresh);

document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
wrapBridge();refresh();
})();
