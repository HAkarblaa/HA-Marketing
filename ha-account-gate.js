/* HA Marketing - require an existing signed-in account on every app page.
   UI gate only: database RLS and existing role checks remain authoritative. */
(function(){
  'use strict';
  if(window.HA_AccountGate)return;
  const root=document.documentElement;
  const base=new URL('./',document.currentScript.src);
  const STORAGE='ha-marketing-auth';
  const NEXT='ha_account_return_to';
  const publicPages=['login.html','register.html','forgot-password.html','privacy-policy.html','delete-account.html'];
  const relative=location.pathname.slice(base.pathname.length);
  const isPublic=location.origin===base.origin && publicPages.includes(relative);
  let client=null,sdkPromise=null,run=0,expiryTimer=null,subscription=null;
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
    remove(localStorage,'ha_logged_in');
    location.replace(loginURL());
  }
  function validSession(session){
    return !!(session?.access_token && session?.user?.id &&
      session.user.is_anonymous!==true && Number(session.expires_at)>Date.now()/1000);
  }
  function offlineSession(){
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
    state='allowed';clearTimeout(expiryTimer);
    store(localStorage,'ha_logged_in','1');
    root.removeAttribute('data-ha-account-lock');
    document.getElementById('haAccountGate')?.remove();
    document.getElementById('haSplash')?.classList.add('hide');
    // Lock again when the saved access token expires; online Supabase refresh may renew it first.
    expiryTimer=setTimeout(()=>{lock();check();},Math.min(2147483647,Math.max(1000,Number(session.expires_at)*1000-Date.now())));
    window.dispatchEvent(new CustomEvent('ha:account-ready',{detail:{user:session.user}}));
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
        if(['SIGNED_IN','TOKEN_REFRESHED','USER_UPDATED'].includes(event))setTimeout(()=>{lock();check();},0);
      }).data.subscription;
    }
    return client;
  }
  async function check(){
    if(isPublic || state==='redirecting')return;
    const current=++run;state='checking';lock();panel('جاري التحقق من حسابك...');
    if(!navigator.onLine){
      const cached=offlineSession();
      if(cached)allow(cached);else redirect();
      return;
    }
    if(!read(localStorage,STORAGE) && !new URL(location.href).searchParams.has('code') && !/access_token=/.test(location.hash)){redirect();return;}
    try{
      const db=await getClient();
      const {data,error}=await timeout(db.auth.getSession(),12000);
      if(current!==run)return;
      if(error){
        if([400,401,403].includes(error.status) || error.name==='AuthSessionMissingError'){redirect();return;}
        throw error;
      }
      const session=data?.session;
      if(!session?.access_token || !session.user?.id || session.user.is_anonymous===true){redirect();return;}
      const verified=await timeout(db.auth.getUser(),12000);
      if(current!==run)return;
      if(verified.error){
        if([400,401,403].includes(verified.error.status) || verified.error.name==='AuthSessionMissingError'){redirect();return;}
        throw verified.error;
      }
      if(!verified.data?.user || verified.data.user.is_anonymous===true || verified.data.user.id!==session.user.id || !validSession(session)){redirect();return;}
      allow({...session,user:verified.data.user});
    }catch(e){
      if(current!==run)return;
      if(!navigator.onLine){const cached=offlineSession();if(cached){allow(cached);return;}}
      state='error';lock();panel('تعذر التحقق من حسابك. تأكد من اتصال الإنترنت وحاول مجدداً.',true);
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
  rememberPage();lock();
  if(!read(localStorage,STORAGE) && !new URL(location.href).searchParams.has('code') && !/access_token=/.test(location.hash)){redirect();return;}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',check,{once:true});else check();
  window.addEventListener('pageshow',event=>{if(event.persisted){lock();check();}});
  window.addEventListener('online',()=>{lock();check();});
  window.addEventListener('offline',()=>{lock();check();});
  window.addEventListener('storage',event=>{
    if(event.key===STORAGE || event.key===null){lock();if(!read(localStorage,STORAGE))redirect();else check();}
  });
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden)lock();else check();
  });
})();
