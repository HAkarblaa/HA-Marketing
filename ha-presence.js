(function(){
'use strict';

if(window.__haRealtimePresenceLoaded)return;
window.__haRealtimePresenceLoaded=true;

const currentPage=(location.pathname||'').split('/').pop().toLowerCase()||'index.html';
if(/^admin/.test(currentPage))return;

const SB_URL='https://ubayrhtshgtgggxprrek.supabase.co';
const SB_KEY='sb_publishable_p3108yoDkdJTLqVXhkvmBg_KVqe-1ll';
const STORAGE_KEY='ha-marketing-auth';

let db=null;
let channel=null;
let session=null;
let tracked=false;
let starting=false;

function loadSupabase(){
  return new Promise((resolve,reject)=>{
    if(window.supabase?.createClient)return resolve();
    const old=document.querySelector('script[data-ha-supabase-loader]');
    if(old){
      old.addEventListener('load',resolve,{once:true});
      old.addEventListener('error',reject,{once:true});
      return;
    }
    const s=document.createElement('script');
    s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    s.defer=true;
    s.dataset.haSupabaseLoader='1';
    s.onload=resolve;
    s.onerror=reject;
    document.head.appendChild(s);
  });
}

function pageLabel(){
  const title=String(document.title||'').replace(/\s+/g,' ').trim();
  return (title || currentPage || 'داخل التطبيق').slice(0,120);
}

async function getProfile(uid){
  try{
    const r=await db.from('profiles')
      .select('full_name,username,account_type,employee_status,employee_role_id')
      .eq('id',uid)
      .maybeSingle();

    const p=r?.data||{};
    let employeeRole='موظف';

    if(p.employee_role_id){
      try{
        const rr=await db.from('employee_roles')
          .select('role_name')
          .eq('id',p.employee_role_id)
          .maybeSingle();
        if(rr?.data?.role_name)employeeRole=rr.data.role_name;
      }catch(_e){}
    }

    const isEmployee=
      String(p.account_type||'')==='employee' &&
      String(p.employee_status||'')==='approved';

    return {
      display_name:(p.full_name||p.username||'مستخدم').slice(0,120),
      username:(p.username||'').slice(0,80),
      user_kind:isEmployee?'employee':'regular',
      employee_role:isEmployee?employeeRole:'مستخدم عادي'
    };
  }catch(_e){
    return {
      display_name:'مستخدم',
      username:'',
      user_kind:'regular',
      employee_role:'مستخدم عادي'
    };
  }
}

async function isAdmin(uid){
  try{
    const r=await db.from('app_admins')
      .select('user_id,is_active')
      .eq('user_id',uid)
      .eq('is_active',true)
      .maybeSingle();
    return !!r?.data?.user_id;
  }catch(_e){
    try{
      const r=await db.rpc('is_app_admin');
      return !!r?.data;
    }catch(_e2){
      return false;
    }
  }
}

async function trackNow(){
  if(!channel || !session?.user || tracked)return;
  if(document.hidden || !navigator.onLine)return;

  const profile=await getProfile(session.user.id);

  try{
    await channel.track({
      user_id:session.user.id,
      display_name:profile.display_name,
      username:profile.username,
      user_kind:profile.user_kind,
      employee_role:profile.employee_role,
      current_page:pageLabel(),
      online_since:new Date().toISOString()
    });
    tracked=true;
  }catch(_e){}
}

async function untrackNow(){
  if(!channel || !tracked)return;
  tracked=false;
  try{await channel.untrack()}catch(_e){}
}

async function start(){
  if(starting || channel)return;
  starting=true;

  try{
    await loadSupabase();

    db=window.supabase.createClient(SB_URL,SB_KEY,{
      auth:{
        persistSession:true,
        autoRefreshToken:true,
        detectSessionInUrl:true,
        storageKey:STORAGE_KEY
      }
    });

    const r=await db.auth.getSession();
    session=r?.data?.session||null;
    if(!session?.user)return;

    if(await isAdmin(session.user.id))return;

    channel=db.channel('ha-online-users-v2',{
      config:{presence:{key:session.user.id}}
    });

    channel.subscribe(async(status)=>{
      if(status==='SUBSCRIBED'){
        await trackNow();
      }else if(status==='CLOSED'||status==='CHANNEL_ERROR'||status==='TIMED_OUT'){
        tracked=false;
      }
    });

  }catch(_e){
  }finally{
    starting=false;
  }
}

document.addEventListener('visibilitychange',async()=>{
  if(document.hidden){
    await untrackNow();
  }else{
    if(!channel)await start();
    await trackNow();
  }
});

window.addEventListener('online',async()=>{
  if(!channel)await start();
  await trackNow();
});

window.addEventListener('offline',()=>{untrackNow()});
window.addEventListener('focus',()=>{trackNow()});
window.addEventListener('pagehide',()=>{untrackNow()});
window.addEventListener('beforeunload',()=>{untrackNow()});

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',start,{once:true});
}else{
  start();
}
})();