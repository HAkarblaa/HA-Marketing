
(function(){
  const KEY='ha_last_location';

  function valid(v){ return Number.isFinite(Number(v)); }

  function save(lat,lng,accuracy){
    const x={
      lat:Number(lat),
      lng:Number(lng),
      accuracy:Number(accuracy||0),
      updatedAt:Date.now()
    };
    try{ localStorage.setItem(KEY,JSON.stringify(x)); }catch(e){}
    return x;
  }

  function cached(maxAgeMs){
    try{
      const x=JSON.parse(localStorage.getItem(KEY)||'null');
      if(!x || !valid(x.lat) || !valid(x.lng)) return null;
      if(maxAgeMs && Date.now()-Number(x.updatedAt||0)>maxAgeMs) return null;
      return x;
    }catch(e){ return null; }
  }

  function distanceKm(a,b){
    if(!a||!b||!valid(a.lat)||!valid(a.lng)||!valid(b.lat)||!valid(b.lng)) return Infinity;
    const R=6371;
    const dLat=(Number(b.lat)-Number(a.lat))*Math.PI/180;
    const dLng=(Number(b.lng)-Number(a.lng))*Math.PI/180;
    const la1=Number(a.lat)*Math.PI/180;
    const la2=Number(b.lat)*Math.PI/180;
    const h=Math.sin(dLat/2)**2+Math.cos(la1)*Math.cos(la2)*Math.sin(dLng/2)**2;
    return 2*R*Math.asin(Math.sqrt(h));
  }

  function getCurrent(opts={}){
    const maxAge=opts.maxAge==null?60000:Number(opts.maxAge);
    const fromCache=opts.allowCache!==false ? cached(maxAge) : null;
    if(fromCache) return Promise.resolve(fromCache);

    return new Promise((resolve,reject)=>{
      if(!navigator.geolocation){
        reject(new Error('GEOLOCATION_NOT_SUPPORTED'));
        return;
      }
      navigator.geolocation.getCurrentPosition(pos=>{
        resolve(save(pos.coords.latitude,pos.coords.longitude,pos.coords.accuracy));
      },reject,{
        enableHighAccuracy:opts.highAccuracy!==false,
        timeout:opts.timeout||12000,
        maximumAge:opts.maximumAge||15000
      });
    });
  }

  function watch(onLocation,onError){
    if(!navigator.geolocation) return null;
    return navigator.geolocation.watchPosition(pos=>{
      onLocation && onLocation(save(pos.coords.latitude,pos.coords.longitude,pos.coords.accuracy));
    },onError||(()=>{}),{
      enableHighAccuracy:true,
      maximumAge:5000,
      timeout:12000
    });
  }

  function distanceText(km){
    if(!Number.isFinite(km)) return '';
    if(km<1) return Math.max(1,Math.round(km*1000))+' م';
    return km.toFixed(km<10?1:0)+' كم';
  }

  window.HA_Nearby={save,cached,getCurrent,watch,distanceKm,distanceText};
})();
