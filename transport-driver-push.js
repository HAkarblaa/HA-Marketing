(function(){
 if(window.HA_TransportDriverPush)return;
 const URL='https://ubayrhtshgtgggxprrek.supabase.co',KEY='sb_publishable_p3108yoDkdJTLqVXhkvmBg_KVqe-1ll';
 let db,user,profile,lastPos,watchId=null,available=true,initializing=null,saving=false;let availableRevision=0;
 const client=()=>db||(db=window.supabase.createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'ha-marketing-auth'}}));
 function bounded(p){let t;return Promise.race([p,new Promise((_,bad)=>t=setTimeout(()=>bad(new Error('timeout')),20000))]).finally(()=>clearTimeout(t));}
 function report(message){let el=document.getElementById('haDriverPushLocationStatus');if(!el){el=document.createElement('div');el.id='haDriverPushLocationStatus';el.setAttribute('role','status');el.style.cssText='margin:8px auto;padding:10px;max-width:900px;width:94%;color:#173654;background:#edf6ff;border-radius:12px';const target=document.getElementById('haDriverPushControls')||document.body;target.appendChild(el);}el.textContent=message;}
 async function savePosition(p){
  if(!profile||!user||!p||saving)return {ok:false};saving=true;
  try{
   const {data,error}=await bounded(client().rpc('transport_driver_update_location',{p_lat:Number(p.lat),p_lng:Number(p.lng),p_accuracy:Number(p.accuracy||0),p_available:available}));
   if(error||data?.ok!==true){report('تعذر حفظ موقع السائق لاستلام الطلبات. اضغط تحديث الموقع.');return {ok:false,error};}
   report(available?'موقع السائق محفوظ لاستلام الطلبات القريبة.':'السائق غير متصل.');return data;
  }catch(e){report('تعذر حفظ موقع السائق لاستلام الطلبات. اضغط تحديث الموقع.');return {ok:false};}finally{saving=false;}
 }
 function locate(){
  if(!navigator.geolocation){report('فعّل GPS والسماح بالموقع لاستلام الطلبات القريبة.');return;}
  const good=pos=>{lastPos={lat:pos.coords.latitude,lng:pos.coords.longitude,accuracy:pos.coords.accuracy};savePosition(lastPos);};
  const bad=()=>report('فعّل GPS والسماح بالموقع لاستلام الطلبات القريبة.');
  navigator.geolocation.getCurrentPosition(good,bad,{enableHighAccuracy:true,timeout:12000,maximumAge:0});
  if(watchId===null)watchId=navigator.geolocation.watchPosition(good,bad,{enableHighAccuracy:true,timeout:20000,maximumAge:20000});
 }
 async function setAvailable(value){
  available=!!value;availableRevision++;
  try{const {error,data}=await bounded(client().rpc('transport_driver_set_available',{p_available:available}));if(error||data?.ok!==true)report('تعذر تحديث اتصال السائق. حاول مجدداً.');else if(lastPos)await savePosition(lastPos);else locate();}catch(e){report('تعذر تحديث اتصال السائق. حاول مجدداً.');}
 }
 function controls(){
  if(document.getElementById('haDriverPushControls'))return;
  const box=document.createElement('div');box.id='haDriverPushControls';box.style.cssText='display:flex;gap:8px;flex-wrap:wrap;width:94%;max-width:900px;margin:10px auto';
  const push=document.createElement('button');push.type='button';push.dataset.haPushButton='';push.textContent='تشغيل إشعارات الموبايل';push.style.cssText='padding:10px;border:0;border-radius:11px;background:#1769e0;color:#fff';push.onclick=()=>window.HA_ToggleNotifications?.();
  const gps=document.createElement('button');gps.type='button';gps.textContent='تحديث الموقع';gps.style.cssText=push.style.cssText;gps.onclick=locate;box.append(push,gps);
  const header=document.querySelector('.driver-hero,.driver-header,.wrap .top')||document.querySelector('main')||document.body;if(header===document.body)document.body.prepend(box);else header.insertAdjacentElement('afterend',box);
 }
 async function init(){
  if(initializing)return initializing;
  initializing=(async()=>{
   try{
    const {data:{session}}=await bounded(client().auth.getSession());user=session?.user;if(!user||user.is_anonymous)return;controls();
    const revision=availableRevision;const {data,error}=await bounded(client().rpc('get_transport_driver_push_state'));if(error||!data?.ok){report('تعذر التحقق من إعدادات إشعارات السائق. راجع اعتماد حساب السائق.');return;}
    profile=data;if(revision===availableRevision)available=data.available!==false;
    window.dispatchEvent(new CustomEvent('ha-driver-push-ready',{detail:{available}}));controls();locate();
    client().channel('ha-driver-incoming-'+user.id).on('postgres_changes',{event:'INSERT',schema:'public',table:'notifications',filter:'user_id=eq.'+user.id},()=>loadNearbyNotifications()).subscribe();
    await loadNearbyNotifications();
   }catch(e){report('تعذر التحقق من إعدادات إشعارات السائق. راجع اعتماد حساب السائق.');}
  })().finally(()=>initializing=null);return initializing;
 }
 async function loadNearbyNotifications(){
  if(!user)return;try{
   const {data,error}=await client().from('notifications').select('id,title,message,link,kind').eq('user_id',user.id).in('kind',['transport_ride_new','shop_courier_new']).eq('is_read',false).gte('created_at',new Date(Date.now()-2*3600000).toISOString()).order('created_at',{ascending:false}).limit(20);
   if(error)return;let banner=document.getElementById('haDriverOrderAlert');if(!banner){banner=document.createElement('a');banner.id='haDriverOrderAlert';banner.style.cssText='display:none;margin:10px auto;padding:12px;width:94%;max-width:900px;border-radius:12px;background:#fff3cf;color:#15283b;text-decoration:none';document.getElementById('haDriverPushControls')?.after(banner);}
   banner.style.display=data?.length?'block':'none';if(!data?.length)return;const n=data[0];banner.textContent=n.title+' — '+n.message;const link=String(n.link||'driver.html');banner.href=/^(driver|shop-courier)\.html(?:[?#].*)?$/.test(link)?link:'notifications-center.html';
   const badge=document.getElementById('haTransportOrderBadge');if(badge){badge.textContent=String(data.length);badge.style.display='block';}
  }catch(e){}
 }
 window.HA_TransportDriverPush={init,setAvailable,saveNow:()=>{locate();},savePosition};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
 setInterval(()=>{if(document.visibilityState==='visible'&&profile){locate();loadNearbyNotifications();}},60000);
 window.addEventListener('online',()=>{if(profile)locate();else init();});document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){if(profile){locate();loadNearbyNotifications();}else init();}});
})();
