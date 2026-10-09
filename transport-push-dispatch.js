// Retry the notification for the saved ride, never create a second ride.
(function(){
 if(window.HA_TransportPush)return;
 const URL='https://ubayrhtshgtgggxprrek.supabase.co',KEY='sb_publishable_p3108yoDkdJTLqVXhkvmBg_KVqe-1ll',QUEUE='ha_transport_push_pending_v2';
 let db=null,flushing=false,last=null;const active=new Map();
 const client=()=>db||(db=window.supabase.createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'ha-marketing-auth'}}));
 function bounded(p,ms=20000){let t;return Promise.race([p,new Promise((_,bad)=>t=setTimeout(()=>bad(new Error('timeout')),ms))]).finally(()=>clearTimeout(t));}
 function isInServiceArea(p){return !!p&&p.lat!=null&&p.lng!=null&&String(p.lat).trim()!==''&&String(p.lng).trim()!==''&&Number.isFinite(Number(p.lat))&&Number.isFinite(Number(p.lng))&&Number(p.lat)>=-90&&Number(p.lat)<=90&&Number(p.lng)>=-180&&Number(p.lng)<=180;}
 function validateRouteArea(a,b){return !isInServiceArea(a)?{ok:false,reason:'invalid_pickup'}:!isInServiceArea(b)?{ok:false,reason:'invalid_destination'}:{ok:true};}
 function showAreaMessage(r){if(r?.reason==='invalid_pickup')alert('حدد نقطة الانطلاق على الخريطة.');if(r?.reason==='invalid_destination')alert('حدد نقطة الوصول على الخريطة.');}
 function normalizeDispatch(r){if(r?.dispatchType)return String(r.dispatchType);const s=String(r?.serviceType||'').toLowerCase(),v=String(r?.vehicleType||'').toLowerCase();if(['taxi','tuktuk','stoota','cargo'].includes(s))return s;if(s==='delivery')return /تكتك|tuktuk/.test(v)?'delivery_tuktuk':/سيارة|car/.test(v)?'delivery_car':'delivery_courier';return '';}
 function read(){try{return JSON.parse(localStorage.getItem(QUEUE)||'[]').filter(x=>Date.now()-x.created<10*60000).slice(-10)}catch(e){return [];}}
 function write(q){try{localStorage.setItem(QUEUE,JSON.stringify(q));}catch(e){}}
 function remove(id,uid){write(read().filter(x=>x.rideId!==id||x.uid!==uid));}
 function status(msg,retry){
  if(!document.body)return;
  let box=document.getElementById('haTransportDispatchStatus');
  if(!box){box=document.createElement('div');box.id='haTransportDispatchStatus';box.setAttribute('role','status');box.style.cssText='position:fixed;bottom:110px;left:12px;right:12px;z-index:9995;max-width:680px;margin:auto;padding:12px;border:1px solid #b9d4ec;border-radius:14px;background:#fff;color:#15283b;box-shadow:0 5px 20px #0002;display:flex;gap:8px;align-items:center;flex-wrap:wrap';document.body.appendChild(box);}
  clearTimeout(status.timer);box.hidden=false;box.style.display='flex';box.replaceChildren();const text=document.createElement('span');text.textContent=msg;text.style.flex='1';box.appendChild(text);
  if(retry){const b=document.createElement('button');b.type='button';b.textContent='إعادة تبليغ السائق';b.style.cssText='border:0;padding:9px;border-radius:10px;background:#1769e0;color:#fff';b.onclick=async()=>{b.disabled=true;try{await flush();}finally{b.disabled=false}};box.appendChild(b);}
  else status.timer=setTimeout(()=>{box.hidden=true;box.style.display='none';},6500);
 }
 async function send(item){
  const {data,error}=await bounded(client().rpc('transport_notify_nearby_drivers_v2',{p_ride_id:item.rideId,p_dispatch_type:normalizeDispatch(item.ride),p_pickup_lat:Number(item.ride.pickup.lat),p_pickup_lng:Number(item.ride.pickup.lng),p_destination_lat:Number(item.ride.destination.lat),p_destination_lng:Number(item.ride.destination.lng),p_vehicle_type:String(item.ride.vehicleType||'')}));
  if(error)throw error;
  if(data?.ok===false){remove(item.rideId,item.uid);return data;}
  if(Number(data?.notified)>0){remove(item.rideId,item.uid);status('تم تبليغ السائقين القريبين بطلبك.',false);return data;}
  status('طلبك محفوظ. ننتظر سائقًا متصلًا وقريبًا من نقطة الانطلاق.',true);
  return data||{ok:false,reason:'empty_response'};
 }
 async function dispatch(rideId,ride){
  const valid=validateRouteArea(ride?.pickup,ride?.destination);if(!valid.ok)return valid;
  if(!rideId||!normalizeDispatch(ride))return {ok:false,reason:'missing_data'};
  const id=String(rideId);if(active.has(id))return active.get(id);
  const task=(async()=>{
   let item;
   try{
    const {data:{session}}=await bounded(client().auth.getSession());if(!session?.user||session.user.is_anonymous)return {ok:false,reason:'no_session'};
    const old=read().find(x=>x.rideId===id&&x.uid===session.user.id);
    item=old||{rideId:id,uid:session.user.id,created:Date.now(),ride:{pickup:ride.pickup,destination:ride.destination,dispatchType:normalizeDispatch(ride),vehicleType:ride.vehicleType||''}};
    write([...read().filter(x=>x.rideId!==id||x.uid!==item.uid),item]);last=item;
    return await send(item);
   }catch(e){status('طلبك محفوظ، لكن تعذر تبليغ السائق. اضغط إعادة تبليغ السائق.',true);console.warn('transport notification pending',e);return {ok:false,reason:'notification_pending'};}
  })().finally(()=>active.delete(id));active.set(id,task);return task;
 }
 async function flush(){
  if(flushing||navigator.onLine===false)return;flushing=true;
  try{
   const {data:{session}}=await bounded(client().auth.getSession());if(!session?.user||session.user.is_anonymous)return;
   for(const item of read().filter(x=>x.uid===session.user.id)){
    if(active.has(item.rideId))continue;
    // Check the real Firebase status before retrying a request after navigation/reload.
    if(!window.firebase?.database)continue;
    try{
     const snap=await bounded(window.firebase.database().ref('rides/'+item.rideId).once('value'),8000);
     if(snap.val()?.status!=='searching'){remove(item.rideId,item.uid);continue;}
     await dispatch(item.rideId,item.ride);
    }catch(e){status('طلبك محفوظ، لكن تعذر تبليغ السائق. اضغط إعادة تبليغ السائق.',true);}
   }
  }finally{flushing=false;}
 }
 window.HA_TransportPush={dispatch,flush,normalizeDispatch,isInServiceArea,validateRouteArea,showAreaMessage,serviceArea:{name:'Iraq',nationwide:true,notificationRadiusKm:1}};
 setInterval(flush,15000);window.addEventListener('online',flush);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')flush();});
})();
