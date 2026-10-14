(function(){
'use strict';if(window.__haNativePush)return;window.__haNativePush=true;
const BASE='https://ubayrhtshgtgggxprrek.supabase.co',KEY='sb_publishable_p3108yoDkdJTLqVXhkvmBg_KVqe-1ll';
const TOKEN='ha_native_push_token',OWNER='ha_native_push_owner',ENABLED='ha_native_push_enabled';
let db,session=null,sequence=0,busy=false,active=false;
const sleep=ms=>new Promise(ok=>setTimeout(ok,ms));
function buttons(){return document.querySelectorAll('[data-ha-push-button],#haPushButton')}
function draw(){buttons().forEach(b=>{b.disabled=busy;b.classList.toggle('on',active);const label=active?'🔔 الإشعارات الخارجية مفعّلة':'🔕 تشغيل إشعارات الموبايل';if(b.textContent!==label)b.textContent=label;b.onclick=toggle;});}
async function disableOld(s,token,owner){if(!s?.access_token||!token||!owner)return;const q=new URLSearchParams({token:'eq.'+token,user_id:'eq.'+owner});const r=await fetch(BASE+'/rest/v1/push_tokens?'+q,{method:'PATCH',keepalive:true,headers:{apikey:KEY,Authorization:'Bearer '+s.access_token,'Content-Type':'application/json'},body:JSON.stringify({enabled:false})});if(!r.ok)throw Error('تعذر إيقاف توكن الحساب السابق. حاول مرة أخرى.');}
async function register(s,ticket,requestPermission){
 if(!s?.user||s.user.is_anonymous)throw Error('سجّل الدخول أولاً.');
 if(!requestPermission&&!await HAAndroid.notificationsAllowed())return;
 const token=await HAAndroid.getPushToken();if(ticket!==sequence)return;
 const result=await db.from('push_tokens').upsert({user_id:s.user.id,token,platform:'android',user_agent:navigator.userAgent,enabled:true,last_seen_at:new Date().toISOString()},{onConflict:'token'});
 if(result.error)throw result.error;if(ticket!==sequence)return;
 await HAAndroid.setPushOwner(s.user.id);if(ticket!==sequence){await HAAndroid.clearPushOwner();return;}
 localStorage.setItem(TOKEN,token);localStorage.setItem(OWNER,s.user.id);localStorage.setItem(ENABLED,'1');active=true;draw();
}
async function changed(s){
 const previous=session;session=s;const ticket=++sequence;active=false;draw();
 await HAAndroid.clearPushOwner();
 const oldOwner=localStorage.getItem(OWNER),token=localStorage.getItem(TOKEN);
 if(oldOwner&&oldOwner!==s?.user?.id){
  try{await disableOld(previous,token,oldOwner);}catch(e){console.warn('Previous notification device needs cleanup');}
  await HAAndroid.deletePushToken();
  localStorage.removeItem(TOKEN);localStorage.removeItem(OWNER);localStorage.setItem(ENABLED,'0');
 }
 if(ticket!==sequence)return;
 if(s?.user&&!s.user.is_anonymous&&localStorage.getItem(ENABLED)==='1'){
  try{await register(s,ticket,false)}catch(e){active=false;draw();}
 }
}
async function toggle(){if(busy)return;busy=true;draw();try{
 if(active){if(!confirm('تريد إيقاف إشعارات الموبايل؟'))return;await disableOld(session,localStorage.getItem(TOKEN),localStorage.getItem(OWNER));await HAAndroid.deletePushToken();localStorage.setItem(ENABLED,'0');localStorage.removeItem(TOKEN);localStorage.removeItem(OWNER);active=false;}
 else{const r=await db.auth.getSession();if(r.error)throw r.error;session=r.data.session;if(localStorage.getItem(OWNER)&&localStorage.getItem(OWNER)!==session?.user?.id)await changed(session);await register(session,++sequence,true);}
 }catch(e){alert('تعذر تغيير الإشعارات: '+(e.message||''))}finally{busy=false;draw();}}
(async()=>{try{
 for(let n=0;n<200&&(!window.HAAndroid||!window.supabase?.createClient);n++)await sleep(100);
 if(!window.HAAndroid||!window.supabase?.createClient)throw Error('Native bridge unavailable');
 db=supabase.createClient(BASE,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'ha-marketing-auth'}});
 window.HA_EnableNotifications=()=>register(session,++sequence,true);window.HA_ToggleNotifications=toggle;
 db.auth.onAuthStateChange((_event,s)=>setTimeout(()=>changed(s).catch(()=>{active=false;draw()}),0));const r=await db.auth.getSession();await changed(r.data?.session);
 window.addEventListener('ha:native-resume',()=>{if(!busy)changed(session).catch(()=>{active=false;draw()});});
 const observer=new MutationObserver(()=>{if(!busy)draw()});if(document.body)observer.observe(document.body,{childList:true,subtree:true});else document.addEventListener('DOMContentLoaded',()=>{draw();observer.observe(document.body,{childList:true,subtree:true});},{once:true});
 }catch(e){console.warn('Native notification setup requires attention');draw();}})();
})();
