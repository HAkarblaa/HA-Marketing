
const HA_MAP_CACHE='ha-qalat-sukkar-map-v1';

// Cache tiles actually viewed on maps anywhere, without a geographic boundary.
function isOsmTile(url){
  try{
    const u=new URL(url);
    return /(^|\.)tile\.openstreetmap\.org$/.test(u.hostname)
      && /^\/\d+\/\d+\/\d+\.png$/.test(u.pathname);
  }catch(_){
    return false;
  }
}

self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));

// Network first، وإذا النت مقطوع نرجع للبلاطة المحفوظة.
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET' || !isOsmTile(req.url))return;

  event.respondWith((async()=>{
    const cache=await caches.open(HA_MAP_CACHE);

    try{
      const fresh=await fetch(req);
      if(fresh && (fresh.ok || fresh.type==='opaque')){
        await cache.put(req,fresh.clone()).catch(()=>{});
      }
      if(fresh && (fresh.ok || fresh.type==='opaque'))return fresh;
      const cached=await cache.match(req,{ignoreSearch:true});
      return cached||fresh;
    }catch(_){
      const cached=await cache.match(req,{ignoreSearch:true});
      if(cached)return cached;

      // نخلي Leaflet يتعامل مع الخطأ إذا البلاطة غير محفوظة.
      return new Response('',{status:504,statusText:'Offline tile unavailable'});
    }
  })());
});

