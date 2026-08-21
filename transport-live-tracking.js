// HA Marketing - Live driver tracking via Firebase Realtime Database
(function(){
  let geoWatchId=null;
  let activeRideId=null;
  let lastSentAt=0;
  let lastSentPos=null;
  let listeners=[];

  function distanceMeters(a,b){
    if(!a||!b)return Infinity;
    const R=6371000,toRad=x=>x*Math.PI/180;
    const dLat=toRad(b.lat-a.lat),dLng=toRad(b.lng-a.lng);
    const x=Math.sin(dLat/2)**2+
      Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLng/2)**2;
    return 2*R*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
  }

  function stopDriver(){
    if(geoWatchId!==null && navigator.geolocation){
      navigator.geolocation.clearWatch(geoWatchId);
    }
    geoWatchId=null;activeRideId=null;lastSentAt=0;lastSentPos=null;
  }

  function startDriver(rideId, marker){
    stopDriver();
    if(!rideId)throw new Error('rideId required');
    if(!navigator.geolocation){
      alert('هذا الجهاز لا يدعم تحديد الموقع.');
      return null;
    }
    activeRideId=rideId;

    geoWatchId=navigator.geolocation.watchPosition(async pos=>{
      if(!activeRideId)return;
      const now=Date.now();
      const loc={
        lat:pos.coords.latitude,
        lng:pos.coords.longitude,
        accuracy:Math.round(pos.coords.accuracy||0),
        speed:typeof pos.coords.speed==='number' ? pos.coords.speed : null,
        heading:typeof pos.coords.heading==='number' ? pos.coords.heading : null,
        updatedAt:firebase.database.ServerValue.TIMESTAMP
      };

      if(marker && window.L) marker.setLatLng([loc.lat,loc.lng]);

      const moved=distanceMeters(lastSentPos,loc);
      if(now-lastSentAt<1800 && moved<4)return;

      lastSentAt=now;
      lastSentPos={lat:loc.lat,lng:loc.lng};

      try{
        await firebase.database().ref('rides/'+activeRideId+'/driverLocation').set(loc);
        await firebase.database().ref('rides/'+activeRideId+'/tracking').update({
          active:true,
          lastUpdate:firebase.database.ServerValue.TIMESTAMP
        });
      }catch(e){
        console.warn('Live location update failed',e);
      }
    },err=>{
      console.warn('Geolocation error',err);
      if(err.code===1)alert('فعّل صلاحية الموقع حتى يشتغل التتبع المباشر.');
    },{
      enableHighAccuracy:true,
      maximumAge:1500,
      timeout:15000
    });
    return geoWatchId;
  }

  function clearCustomer(){
    listeners.forEach(x=>{try{x.ref.off(x.event,x.cb)}catch(e){}});
    listeners=[];
  }

  function watchCustomer(rideId, options={}){
    clearCustomer();
    if(!rideId||!window.firebase?.database)return;
    const ref=firebase.database().ref('rides/'+rideId+'/driverLocation');

    const cb=snap=>{
      const loc=snap.val();
      if(!loc || typeof loc.lat!=='number' || typeof loc.lng!=='number')return;

      const p=window.L ? L.latLng(loc.lat,loc.lng) : {lat:loc.lat,lng:loc.lng};
      if(typeof options.onLocation==='function') options.onLocation(p,loc);

      // Show freshness if a target element is supplied.
      if(options.statusElement){
        const el=typeof options.statusElement==='string'
          ? document.getElementById(options.statusElement):options.statusElement;
        if(el){
          el.textContent='📍 تتبع مباشر';
          el.title=loc.accuracy ? ('دقة الموقع تقريباً '+loc.accuracy+' م') : 'تتبع مباشر';
        }
      }
    };
    ref.on('value',cb);
    listeners.push({ref,event:'value',cb});
  }

  window.HA_LiveTracking={
    startDriver,
    stopDriver,
    watchCustomer,
    clearCustomer
  };

  window.addEventListener('beforeunload',()=>{stopDriver();clearCustomer();});
})();
