// HA Marketing - dispatch a new transport ride to nearby approved drivers
(function(){
  if(window.HA_TransportPush)return;

  const SB_URL='https://ubayrhtshgtgggxprrek.supabase.co';
  const SB_KEY='sb_publishable_p3108yoDkdJTLqVXhkvmBg_KVqe-1ll';
  let db=null;

  function client(){
    if(db)return db;
    if(!window.supabase?.createClient)return null;
    db=window.supabase.createClient(SB_URL,SB_KEY,{
      auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'ha-marketing-auth'}
    });
    return db;
  }

  function normalizeDispatch(ride){
    if(ride?.dispatchType)return String(ride.dispatchType);
    const service=String(ride?.serviceType||'').toLowerCase();
    const vehicle=String(ride?.vehicleType||'').toLowerCase();

    if(service==='taxi')return 'taxi';
    if(service==='tuktuk')return 'tuktuk';
    if(service==='stoota')return 'stoota';
    if(service==='cargo')return 'cargo';
    if(service==='delivery'){
      if(/تكتك|tuktuk/.test(vehicle))return 'delivery_tuktuk';
      if(/سيارة|car/.test(vehicle))return 'delivery_car';
      return 'delivery_courier';
    }
    return '';
  }

  async function dispatch(rideId,ride){
    try{
      const c=client();
      if(!c||!rideId||!ride?.pickup)return {ok:false,reason:'missing_data'};

      const {data:{session}}=await c.auth.getSession();
      if(!session?.user || session.user.is_anonymous)return {ok:false,reason:'no_session'};

      const dispatchType=normalizeDispatch(ride);
      if(!dispatchType)return {ok:false,reason:'unknown_dispatch'};

      const {data,error}=await c.rpc('transport_notify_nearby_drivers',{
        p_ride_id:String(rideId),
        p_dispatch_type:dispatchType,
        p_pickup_lat:Number(ride.pickup.lat),
        p_pickup_lng:Number(ride.pickup.lng),
        p_vehicle_type:String(ride.vehicleType||'')
      });

      if(error){
        console.warn('nearby transport push',error);
        return {ok:false,error};
      }
      return data||{ok:true};
    }catch(e){
      console.warn('nearby transport push bridge',e);
      return {ok:false,error:e};
    }
  }

  window.HA_TransportPush={dispatch,normalizeDispatch};
})();
