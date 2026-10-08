// HA Marketing - approved driver location + push helper
(function(){
  if(window.HA_TransportDriverPush)return;

  const SB_URL='https://ubayrhtshgtgggxprrek.supabase.co';
  const SB_KEY='sb_publishable_p3108yoDkdJTLqVXhkvmBg_KVqe-1ll';
  let db=null,user=null,profile=null,lastPos=null,lastSentAt=0,lastSentPos=null,watchId=null,available=true;
  let notificationTimer=null;

  function client(){
    if(db)return db;
    if(!window.supabase?.createClient)return null;
    db=window.supabase.createClient(SB_URL,SB_KEY,{
      auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'ha-marketing-auth'}
    });
    return db;
  }

  function distM(a,b){
    if(!a||!b)return Infinity;
    const R=6371000,r=x=>x*Math.PI/180;
    const dLat=r(b.lat-a.lat),dLng=r(b.lng-a.lng);
    const q=Math.sin(dLat/2)**2+Math.cos(r(a.lat))*Math.cos(r(b.lat))*Math.sin(dLng/2)**2;
    return 2*R*Math.atan2(Math.sqrt(q),Math.sqrt(1-q));
  }

  async function loadProfile(){
    const c=client();
    if(!c)return null;
    const {data:{session}}=await c.auth.getSession();
    user=session?.user||null;
    if(!user||user.is_anonymous)return null;

    const {data,error}=await c.from('transport_profiles')
      .select('user_id,role_type,vehicle_type,status')
      .eq('user_id',user.id)
      .eq('status','approved')
      .maybeSingle();

    if(error||!data)return null;
    profile=data;
    return data;
  }

  async function savePosition(p,force=false){
    if(!profile||!user||!p)return;
    const now=Date.now();
    if(!force && now-lastSentAt<20000 && distM(lastSentPos,p)<70)return;

    const c=client();
    const {error}=await c.rpc('transport_driver_update_location',{
      p_lat:Number(p.lat),
      p_lng:Number(p.lng),
      p_accuracy:Number(p.accuracy||0),
      p_available:!!available
    });
    if(!error){
      lastSentAt=now;
      lastSentPos={lat:p.lat,lng:p.lng};
    }else{
      console.warn('driver location save',error);
    }
  }

  function startLocation(){
    if(!navigator.geolocation||watchId!==null)return;

    navigator.geolocation.getCurrentPosition(pos=>{
      lastPos={
        lat:pos.coords.latitude,
        lng:pos.coords.longitude,
        accuracy:Math.round(pos.coords.accuracy||0)
      };
      savePosition(lastPos,true);
    },()=>{},{
      enableHighAccuracy:true,timeout:12000,maximumAge:30000
    });

    watchId=navigator.geolocation.watchPosition(pos=>{
      lastPos={
        lat:pos.coords.latitude,
        lng:pos.coords.longitude,
        accuracy:Math.round(pos.coords.accuracy||0)
      };
      savePosition(lastPos,false);
    },()=>{},{
      enableHighAccuracy:true,maximumAge:20000,timeout:20000
    });
  }

  async function setAvailable(v){
    available=!!v;
    try{
      const c=client();
      if(user){
        await c.rpc('transport_driver_set_available',{p_available:available});
      }
      if(lastPos)await savePosition(lastPos,true);
    }catch(e){console.warn(e)}
  }

  function pushEnabled(){
    return typeof Notification!=='undefined' &&
      Notification.permission==='granted' &&
      localStorage.getItem('ha_notifications_enabled')==='1';
  }

  function addPushPrompt(){
    if(pushEnabled()||document.getElementById('haDriverPushPrompt'))return;

    const box=document.createElement('div');
    box.id='haDriverPushPrompt';
    box.style.cssText='position:fixed;left:12px;right:12px;bottom:14px;z-index:99990;max-width:720px;margin:auto;background:#0b1013;color:#fff;border:1px solid #f2b544;border-radius:17px;padding:12px;box-shadow:0 8px 30px #0007;display:flex;align-items:center;gap:10px;direction:rtl';
    box.innerHTML='<div style="font-size:26px">🔔</div><div style="flex:1"><b style="display:block;color:#ffd46a;font-size:14px">شغّل إشعارات طلبات النقل</b><small style="display:block;color:#ddd;margin-top:4px;line-height:1.5">حتى توصلك طلبات الزبائن القريبة منك وأنت خارج الموقع.</small></div><button id="haDriverPushEnableBtn" style="border:0;border-radius:11px;background:#f2b544;color:#111;padding:10px 12px;font-weight:800;cursor:pointer">تشغيل</button>';
    document.body.appendChild(box);

    box.querySelector('#haDriverPushEnableBtn').onclick=async()=>{
      if(typeof window.HA_EnableNotifications!=='function'){
        alert('افتح الإشعارات من القائمة الرئيسية ثم اضغط تشغيل إشعارات الموبايل.');
        return;
      }
      try{
        await window.HA_EnableNotifications();
        if(pushEnabled())box.remove();
      }catch(e){console.warn(e)}
    };
  }

  function ensureHomeBanner(){
    let a=document.getElementById('haDriverOrderAlert');
    if(a)return a;

    a=document.createElement('a');
    a.id='haDriverOrderAlert';
    a.href='driver.html';
    a.style.cssText='display:none;width:min(930px,94%);margin:12px auto 4px;background:linear-gradient(135deg,#17120a,#0b1013);border:1px solid rgba(242,181,68,.68);border-radius:18px;padding:12px 14px;color:#fff;text-decoration:none;align-items:center;gap:12px;box-shadow:0 8px 28px rgba(0,0,0,.25)';
    a.innerHTML='<span style="width:48px;height:48px;border-radius:15px;background:#f2b544;color:#111;display:grid;place-items:center;font-size:25px">🔔</span><span style="flex:1"><b id="haDriverOrderTitle" style="display:block;color:#ffd46a">عندك طلب نقل جديد</b><small id="haDriverOrderText" style="display:block;margin-top:4px;color:#ddd">اضغط حتى تشوف الطلب.</small></span><span id="haDriverOrderCount" style="min-width:34px;height:34px;padding:0 8px;border-radius:999px;background:#e53935;color:#fff;display:grid;place-items:center;font-weight:900">1</span>';
    document.body.insertBefore(a,document.body.firstChild);
    return a;
  }

  async function loadNearbyNotifications(){
    if(!user)return;
    try{
      const since=new Date(Date.now()-2*60*60*1000).toISOString();
      const {data,error}=await client().from('notifications')
        .select('id,title,message,link,created_at,is_read')
        .eq('kind','transport_ride_new')
        .eq('is_read',false)
        .gte('created_at',since)
        .order('created_at',{ascending:false})
        .limit(20);
      if(error)return;

      const rows=data||[];
      const banner=ensureHomeBanner();
      const badge=document.getElementById('haTransportOrderBadge');

      if(!rows.length){
        banner.style.display='none';
        if(badge)badge.style.display='none';
        return;
      }

      const latest=rows[0];
      banner.style.display='flex';
      banner.href=latest.link||'driver.html';
      const t=document.getElementById('haDriverOrderTitle');
      const x=document.getElementById('haDriverOrderText');
      const c=document.getElementById('haDriverOrderCount');
      if(t)t.textContent=rows.length===1?(latest.title||'🔔 طلب نقل قريب منك'):'🔔 عندك '+rows.length+' طلبات نقل قريبة';
      if(x)x.textContent=latest.message||'اضغط حتى تشوف الطلب.';
      if(c)c.textContent=rows.length>99?'99+':String(rows.length);
      if(badge){
        badge.textContent=rows.length>99?'99+':String(rows.length);
        badge.style.display='block';
      }

      banner.onclick=async()=>{
        try{
          await client().from('notifications')
            .update({is_read:true})
            .in('id',rows.map(r=>r.id));
        }catch(e){}
      };
    }catch(e){console.warn('transport notifications banner',e)}
  }

  async function init(){
    const p=await loadProfile();
    if(!p)return;

    startLocation();

    // تم إخفاء شريط "شغّل إشعارات طلبات النقل" من الواجهة.
    // نظام الإشعارات نفسه يبقى شغال، ويمكن تشغيله من زر الإشعارات بالموقع.
    await loadNearbyNotifications();
    notificationTimer=setInterval(loadNearbyNotifications,9000);
  }

  window.HA_TransportDriverPush={
    init,
    setAvailable,
    saveNow:()=>lastPos?savePosition(lastPos,true):Promise.resolve()
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})();
