// HA Marketing - transport push bridge
// Creates notifications through secure Supabase RPCs and asks the existing
// send-fcm-push Edge Function to deliver them. The database auto-trigger may
// also deliver first; in that case the Edge Function safely returns already_sent.
(function(){
  if(window.HA_TransportPush || !window.supabase) return;

  const SB_URL='https://ubayrhtshgtgggxprrek.supabase.co';
  const SB_KEY='sb_publishable_p3108yoDkdJTLqVXhkvmBg_KVqe-1ll';
  const EDGE_URL=SB_URL+'/functions/v1/send-fcm-push';
  const db=window.supabase.createClient(SB_URL,SB_KEY,{
    auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'ha-marketing-auth'}
  });

  async function session(){
    try{
      const {data,error}=await db.auth.getSession();
      if(error) throw error;
      return data?.session||null;
    }catch(e){
      console.warn('HA transport push session:',e);
      return null;
    }
  }

  async function sendOne(notificationId,accessToken){
    if(!notificationId || !accessToken) return;
    try{
      const r=await fetch(EDGE_URL,{
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'apikey':SB_KEY,
          'Authorization':'Bearer '+accessToken
        },
        body:JSON.stringify({notification_id:Number(notificationId)})
      });
      if(!r.ok){
        console.warn('HA FCM send failed',r.status,await r.text().catch(()=>''));
      }
    }catch(e){
      console.warn('HA FCM send:',e);
    }
  }

  function queuePush(ids,accessToken){
    const clean=[...new Set((Array.isArray(ids)?ids:[ids]).map(Number).filter(Number.isFinite))];
    if(!clean.length || !accessToken) return;
    // نعطي trigger قاعدة البيانات فرصة يرسل أولاً. إذا أرسل، الدالة ترجع already_sent.
    setTimeout(()=>{
      clean.forEach(id=>sendOne(id,accessToken));
    },1400);
  }

  async function notifyDrivers({rideId,dispatchType,title,body,type='taxi',link='driver.html'}){
    try{
      const s=await session();
      if(!s?.user?.id || s.user.is_anonymous) return {ok:false,reason:'not_logged_in'};
      const {data,error}=await db.rpc('ha_notify_transport_drivers',{
        p_ride_id:String(rideId||''),
        p_dispatch_type:String(dispatchType||''),
        p_title:String(title||'طلب نقل جديد'),
        p_body:String(body||'وصلك طلب نقل جديد'),
        p_type:String(type||'taxi'),
        p_link:link||'driver.html'
      });
      if(error) throw error;
      const ids=Array.isArray(data)?data:[];
      queuePush(ids,s.access_token);
      return {ok:true,notificationIds:ids};
    }catch(e){
      console.warn('HA notify transport drivers:',e);
      return {ok:false,error:e};
    }
  }

  async function notifyPeer({targetUserId,rideId,event,title,body,type='taxi',link=null}){
    try{
      if(!targetUserId || !rideId || !event) return {ok:false,reason:'missing_target'};
      const s=await session();
      if(!s?.user?.id || s.user.is_anonymous) return {ok:false,reason:'not_logged_in'};
      const {data,error}=await db.rpc('ha_notify_transport_peer',{
        p_target_user_id:targetUserId,
        p_ride_id:String(rideId),
        p_event:String(event),
        p_title:String(title||'تحديث الطلب'),
        p_body:String(body||'تم تحديث حالة طلبك'),
        p_type:String(type||'taxi'),
        p_link:link
      });
      if(error) throw error;
      queuePush(data,s.access_token);
      return {ok:true,notificationId:data||null};
    }catch(e){
      console.warn('HA notify transport peer:',e);
      return {ok:false,error:e};
    }
  }

  window.HA_TransportPush={notifyDrivers,notifyPeer};
})();
