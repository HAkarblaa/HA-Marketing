(function(){
'use strict';if(window.__haDailyActivity)return;window.__haDailyActivity=true;
if(/^admin/.test(location.pathname.split('/').pop()||''))return;
const base='https://ubayrhtshgtgggxprrek.supabase.co',key='sb_publishable_p3108yoDkdJTLqVXhkvmBg_KVqe-1ll';
const page=(location.pathname.split('/').pop()||'index.html').toLowerCase();
let db,user=null,auth=null,queue=[],mark=null,visit=null,flushing=false,booting=false,accountGeneration=0;
const uuid=()=>crypto.randomUUID?crypto.randomUUID():([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,c=>(c^crypto.getRandomValues(new Uint8Array(1))[0]&15>>c/4).toString(16));
function read(k,storage=localStorage){try{return JSON.parse(storage.getItem(k)||'null')}catch(_){return null}}
function write(k,v,storage=localStorage){try{storage.setItem(k,JSON.stringify(v))}catch(_){}}
function queueKey(){return 'ha-activity-queue-'+user}
function persist(){if(user)write(queueKey(),queue,sessionStorage)}
function getVisit(){
 const k='ha-activity-visit-'+user,v=read(k),now=Date.now();
 if(v&&now>=v.last&&now-v.last<1800000){visit=v.id;write(k,{id:visit,last:now})}
 else{visit=uuid();write(k,{id:visit,last:now})}
}
function begin(){if(!user||document.hidden||!navigator.onLine||mark)return;getVisit();mark={wall:Date.now(),mono:performance.now()};
 queue.push({p_chunk:uuid(),p_visit:visit,p_page:page,p_start:new Date(mark.wall).toISOString(),p_end:new Date(mark.wall).toISOString()});persist();flush();}
function capture(stop=false){
 if(!mark||!user)return;const now=Date.now(),elapsed=Math.min(45000,Math.max(0,performance.now()-mark.mono));
 // A suspended timer cannot add hours of background time.
 if(elapsed>0)queue.push({p_chunk:uuid(),p_visit:visit,p_page:page,p_start:new Date(now-elapsed).toISOString(),p_end:new Date(now).toISOString()});
 queue=queue.filter(x=>Date.parse(x.p_start)>now-7*86400000);persist();
 write('ha-activity-visit-'+user,{id:visit,last:now});mark=stop?null:{wall:now,mono:performance.now()};
}
async function flush(){
 if(flushing||!user||!auth||!navigator.onLine)return;flushing=true;const owner=user;
 try{while(queue.length&&owner===user){const item=queue[0];const r=await fetch(base+'/rest/v1/rpc/ha_record_activity',{method:'POST',keepalive:true,headers:{apikey:key,Authorization:'Bearer '+auth.access_token,'Content-Type':'application/json'},body:JSON.stringify(item)});
 if(!r.ok||owner!==user)break;queue=queue.filter(x=>x.p_chunk!==item.p_chunk);persist();}}
 catch(_){}finally{flushing=false;}
}
async function account(s){
 const generation=++accountGeneration;
 if(s?.user?.id===user){auth=s;return;}
 capture(true);flush();user=null;mark=null;
 if(!s?.user||s.user.is_anonymous)return;
 const candidate=s.user.id;const a=await db.from('app_admins').select('user_id').eq('user_id',candidate).eq('is_active',true).maybeSingle();
 if(generation!==accountGeneration||a.error||a.data)return;
 auth=s;user=candidate;queue=read(queueKey(),sessionStorage)||[];queue=queue.filter(x=>Date.parse(x.p_start)>Date.now()-7*86400000);begin();flush();
}
async function boot(){
 if(booting||db)return;booting=true;
 try{if(!window.supabase?.createClient){await new Promise((ok,bad)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';s.onload=ok;s.onerror=bad;document.head.append(s)});}
 db=window.supabase.createClient(base,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'ha-marketing-auth'}});
 const r=await db.auth.getSession();await account(r.data?.session);
 db.auth.onAuthStateChange((_event,s)=>{setTimeout(()=>account(s),0)});
 }catch(_){}finally{booting=false;}
}
setInterval(()=>{if(document.hidden)return;capture();begin();flush()},30000);
document.addEventListener('visibilitychange',()=>{if(document.hidden){capture(true);flush()}else{begin();flush()}});
window.addEventListener('pagehide',()=>{capture(true);flush()});
window.addEventListener('pageshow',()=>{begin();flush()});
window.addEventListener('offline',()=>capture(true));
window.addEventListener('online',()=>{boot();begin();flush()});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
