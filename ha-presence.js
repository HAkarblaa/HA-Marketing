(function(){
'use strict';
if(window.__haPresenceLoaded)return;
window.__haPresenceLoaded=true;

const SB_URL='https://ubayrhtshgtgggxprrek.supabase.co';
const SB_KEY='sb_publishable_p3108yoDkdJTLqVXhkvmBg_KVqe-1ll';
const STORAGE_KEY='ha-marketing-auth';
const HEARTBEAT_MS=20000;
let timer=null;

function readSession(){
  try{
    const raw=localStorage.getItem(STORAGE_KEY);
    if(!raw)return null;
    const v=JSON.parse(raw);
    return v?.access_token?v:(v?.currentSession?.access_token?v.currentSession:(v?.data?.session?.access_token?v.data.session:null));
  }catch(_e){return null}
}

function pageLabel(){
  const title=String(document.title||'').replace(/\s+/g,' ').trim();
  if(title)return title.slice(0,160);
  return (location.pathname.split('/').pop()||'index.html').slice(0,160);
}

function networkLabel(){
  if(!navigator.onLine)return 'offline';
  const c=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
  if(!c)return 'online';
  const parts=[];
  if(c.effectiveType)parts.push(c.effectiveType);
  if(Number.isFinite(c.downlink))parts.push(c.downlink+'Mbps');
  return (parts.join(' • ')||'online').slice(0,40);
}

async function ping(){
  if(!navigator.onLine)return;
  const s=readSession();
  if(!s?.access_token)return;
  try{
    await fetch(SB_URL+'/rest/v1/rpc/ha_presence_ping',{
      method:'POST',
      headers:{
        apikey:SB_KEY,
        Authorization:'Bearer '+s.access_token,
        'Content-Type':'application/json'
      },
      body:JSON.stringify({
        p_page:pageLabel(),
        p_online:true,
        p_network:networkLabel()
      }),
      cache:'no-store',
      keepalive:true
    });
  }catch(_e){}
}

function start(){
  clearInterval(timer);
  ping();
  timer=setInterval(ping,HEARTBEAT_MS);
}

window.addEventListener('online',start);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)ping()});
window.addEventListener('focus',ping);

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
else start();
})();
