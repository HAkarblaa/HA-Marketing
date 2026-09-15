// HA Marketing - transport dispatch limited to Qalat Sukkar service area + 1km push radius
(function(){
  if(window.HA_TransportPush)return;

  const SB_URL='https://ubayrhtshgtgggxprrek.supabase.co';
  const SB_KEY='sb_publishable_p3108yoDkdJTLqVXhkvmBg_KVqe-1ll';

  // Qalat Sukkar service geofence.
  // Center: Qalat Sukkar. Radius chosen to represent the current district service area.
  const QALAT_SUKKAR_CENTER={lat:31.863196,lng:46.073213};
  const QALAT_SUKKAR_SERVICE_RADIUS_KM=15.05;

  let db=null;

  function client(){
    if(db)return db;
    if(!window.supabase?.createClient)return null;
    db=window.supabase.createClient(SB_URL,SB_KEY,{
      auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'ha-marketing-auth'}
    });
    return db;
  }

  function distanceKm(a,b){
    if(!a||!b)return Infinity;
    const lat1=Number(a.lat),lon1=Number(a.lng),lat2=Number(b.lat),lon2=Number(b.lng);
    if(!Number.isFinite(lat1)||!Number.isFinite(lon1)||!Number.isFinite(lat2)||!Number.isFinite(lon2))return Infinity;
    const R=6371,r=x=>x*Math.PI/180;
    const dLat=r(lat2-lat1),dLon=r(lon2-lon1);
    const q=Math.sin(dLat/2)**2+
      Math.cos(r(lat1))*Math.cos(r(lat2))*Math.sin(dLon/2)**2;
    return 2*R*Math.atan2(Math.sqrt(q),Math.sqrt(1-q));
  }

  function isInServiceArea(point){
    return distanceKm(QALAT_SUKKAR_CENTER,point)<=QALAT_SUKKAR_SERVICE_RADIUS_KM;
  }

  function validateRouteArea(pickup,destination){
    if(!isInServiceArea(pickup)){
      return {ok:false,reason:'pickup_outside_qalat_sukkar'};
    }
    if(!isInServiceArea(destination)){
      return {ok:false,reason:'destination_outside_qalat_sukkar'};
    }
    return {ok:true};
  }

  function showAreaMessage(result){
    if(result?.reason==='pickup_outside_qalat_sukkar'){
      alert('نقطة الانطلاق خارج نطاق قضاء قلعة سكر. خدمة النقل متاحة حالياً داخل قلعة سكر فقط.');
      return;
    }
    if(result?.reason==='destination_outside_qalat_sukkar'){
      alert('نقطة الوصول خارج نطاق قضاء قلعة سكر. يجب أن تكون نقطة الانطلاق والوصول داخل النطاق.');
      return;
    }
    if(result?.reason==='outside_qalat_sukkar'){
      alert('خدمة النقل والإشعارات متاحة حالياً داخل نطاق قضاء قلعة سكر فقط.');
    }
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
      if(!c||!rideId||!ride?.pickup||!ride?.destination){
        return {ok:false,reason:'missing_data'};
      }

      const areaCheck=validateRouteArea(ride.pickup,ride.destination);
      if(!areaCheck.ok){
        showAreaMessage(areaCheck);
        return areaCheck;
      }

      const {data:{session}}=await c.auth.getSession();
      if(!session?.user || session.user.is_anonymous)return {ok:false,reason:'no_session'};

      const dispatchType=normalizeDispatch(ride);
      if(!dispatchType)return {ok:false,reason:'unknown_dispatch'};

      const {data,error}=await c.rpc('transport_notify_nearby_drivers_v2',{
        p_ride_id:String(rideId),
        p_dispatch_type:dispatchType,
        p_pickup_lat:Number(ride.pickup.lat),
        p_pickup_lng:Number(ride.pickup.lng),
        p_destination_lat:Number(ride.destination.lat),
        p_destination_lng:Number(ride.destination.lng),
        p_vehicle_type:String(ride.vehicleType||'')
      });

      if(error){
        console.warn('nearby transport push',error);
        return {ok:false,error};
      }

      if(data?.ok===false && data?.reason){
        showAreaMessage(data);
      }
      return data||{ok:true};
    }catch(e){
      console.warn('nearby transport push bridge',e);
      return {ok:false,error:e};
    }
  }

  window.HA_TransportPush={
    dispatch,
    normalizeDispatch,
    isInServiceArea,
    validateRouteArea,
    showAreaMessage,
    serviceArea:{
      name:'Qalat Sukkar',
      center:QALAT_SUKKAR_CENTER,
      radiusKm:QALAT_SUKKAR_SERVICE_RADIUS_KM,
      notificationRadiusKm:1
    }
  };
})();
