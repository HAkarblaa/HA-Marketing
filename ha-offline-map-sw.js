
const HA_MAP_CACHE='ha-qalat-sukkar-map-v1';

// نفس مصدر الخريطة المستخدم حالياً بالموقع.
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
      if(fresh && fresh.ok){
        cache.put(req,fresh.clone()).catch(()=>{});
      }
      return fresh;
    }catch(_){
      const cached=await cache.match(req,{ignoreSearch:true});
      if(cached)return cached;

      // نخلي Leaflet يتعامل مع الخطأ إذا البلاطة غير محفوظة.
      return new Response('',{status:504,statusText:'Offline tile unavailable'});
    }
  })());
});

function lon2tile(lon,z){
  return Math.floor((lon+180)/360*Math.pow(2,z));
}
function lat2tile(lat,z){
  const r=lat*Math.PI/180;
  return Math.floor(
    (1-Math.asinh(Math.tan(r))/Math.PI)/2*Math.pow(2,z)
  );
}
function tileUrl(z,x,y){
  // نثبت على a.tile حتى يصير التخزين ثابتاً وما تتكرر نفس البلاطة بثلاثة subdomains.
  return `https://a.tile.openstreetmap.org/${z}/${x}/${y}.png`;
}

function tileUrlsForCircle(lat,lng,radiusKm,z){
  const latDelta=radiusKm/111.32;
  const lonDelta=radiusKm/(111.32*Math.cos(lat*Math.PI/180));

  const minLat=lat-latDelta;
  const maxLat=lat+latDelta;
  const minLng=lng-lonDelta;
  const maxLng=lng+lonDelta;

  const minX=lon2tile(minLng,z);
  const maxX=lon2tile(maxLng,z);
  const minY=lat2tile(maxLat,z);
  const maxY=lat2tile(minLat,z);

  const urls=[];
  for(let x=minX;x<=maxX;x++){
    for(let y=minY;y<=maxY;y++){
      urls.push(tileUrl(z,x,y));
    }
  }
  return urls;
}

async function precache(port){
  try{
    // مركز قلعة سكر المستخدم حالياً بالمشروع.
    const lat=31.863196;
    const lng=46.073213;

    // كامل نطاق قلعة سكر تقريباً بمستويين خفيفين،
    // وتفاصيل أعلى حول مركز القضاء.
    const urls=[
      ...tileUrlsForCircle(lat,lng,15.05,13),
      ...tileUrlsForCircle(lat,lng,15.05,14),
      ...tileUrlsForCircle(lat,lng,5.5,15),
    ];

    const unique=[...new Set(urls)];
    const cache=await caches.open(HA_MAP_CACHE);
    let done=0;

    for(const url of unique){
      const already=await cache.match(url);
      if(!already){
        try{
          const r=await fetch(url,{mode:'cors',cache:'no-store'});
          if(r && r.ok)await cache.put(url,r.clone());
        }catch(_){}
      }

      done++;
      if(done===1 || done%10===0 || done===unique.length){
        port.postMessage({
          type:'HA_OFFLINE_MAP_PROGRESS',
          done,
          total:unique.length
        });
      }

      // تنزيل هادئ حتى ما يضغط على الشبكة.
      await new Promise(r=>setTimeout(r,35));
    }

    port.postMessage({
      type:'HA_OFFLINE_MAP_DONE',
      total:unique.length
    });
  }catch(e){
    port.postMessage({
      type:'HA_OFFLINE_MAP_ERROR',
      message:String(e)
    });
  }
}

self.addEventListener('message',event=>{
  if(event.data?.type!=='HA_PRECACHE_QALAT_SUKKAR')return;
  const port=event.ports && event.ports[0];
  if(!port)return;
  event.waitUntil(precache(port));
});
