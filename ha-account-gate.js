/* HA Marketing - open immediately for a saved signed-in account; guests must sign in.
   UI gate only: database RLS and existing role checks remain authoritative. */
(function(){
  'use strict';
  if(window.HA_AccountGate)return;
  const root=document.documentElement;
  const base=new URL('./',document.currentScript.src);
  const STORAGE='ha-marketing-auth';
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
  function publicLinks(){
    const next=nextURL();
    document.querySelectorAll('a[href]').forEach(a=>{
      const url=new URL(a.getAttribute('href'),location.href);
      if(url.origin===base.origin && ['login.html','register.html','forgot-password.html'].some(p=>url.pathname===new URL(p,base).pathname)){
        url.searchParams.set('next',next.slice(base.href.length));a.href=url.href;
      }
    });
  }
  window.HA_AccountGate={check,nextURL,safeNext,get state(){return state;}};
  if(isPublic){
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',publicLinks,{once:true});else publicLinks();
    return;
  }
  rememberPage();
  // Synchronous local session check removes the boot lock before the page is painted.
  const initial=savedSession();
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
