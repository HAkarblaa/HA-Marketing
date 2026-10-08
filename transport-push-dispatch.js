// HA Marketing - nationwide transport; nearby driver selection is handled by the server.
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

  // Validate coordinates without restricting trips to a particular town.
  function isInServiceArea(point){
    if(!point || point.lat==null || point.lng==null ||
       String(point.lat).trim()==='' || String(point.lng).trim()==='')return false;
    const lat=Number(point.lat),lng=Number(point.lng);
    return Number.isFinite(lat) && Number.isFinite(lng) &&
      lat>=-90 && lat<=90 && lng>=-180 && lng<=180;
  }

  function validateRouteArea(pickup,destination){
    if(!isInServiceArea(pickup))return {ok:false,reason:'invalid_pickup'};
    if(!isInServiceArea(destination))return {ok:false,reason:'invalid_destination'};
    return {ok:true};
  }

  function showAreaMessage(result){
    if(result?.reason==='invalid_pickup')alert('حدد نقطة الانطلاق على الخريطة.');
    else if(result?.reason==='invalid_destination')alert('حدد نقطة الوصول على الخريطة.');
    else if(/qalat_sukkar/.test(result?.reason||'')){
      alert('تحتاج تحديث إعدادات النقل في قاعدة البيانات لتفعيل الخدمة بكل العراق.');
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
    serviceArea:{name:'Iraq',countryCode:'IQ',nationwide:true,notificationRadiusKm:1}
  };
})();
