/* HA Marketing - lightweight service worker (speed fix 2026-09-27)
   Keeps navigation responsive and avoids downloading the whole app during install. */
const CACHE='ha-marketing-speed-v2026-09-27-1';
const CORE=[
  './index.html',
  './ha-modern-green.css',
  './ha-modern-green.js',
  './ha-logo-transparent.png'
];

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await Promise.allSettled(CORE.map(url=>cache.add(url)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys
      .filter(key=>key.startsWith('ha-marketing-') && key!==CACHE)
      .map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});

function networkWithTimeout(request,ms){
  return Promise.race([
    fetch(request),
    new Promise((_,reject)=>setTimeout(()=>reject(new Error('timeout')),ms))
  ]);
}

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;

  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;

  const isNavigation=request.mode==='navigate';
  const isCode=/\.(?:html|css|js)(?:$|\?)/i.test(url.pathname+url.search);

  if(isNavigation || isCode){
    event.respondWith((async()=>{
      const cached=await caches.match(request);
      try{
        /* Short timeout prevents a tap from looking frozen on slow/unstable internet. */
        const fresh=await networkWithTimeout(request,1800);
        if(fresh && fresh.ok){
          const cache=await caches.open(CACHE);
          cache.put(request,fresh.clone()).catch(()=>{});
        }
        return fresh;
      }catch(_err){
        if(cached)return cached;
        if(isNavigation){
          return (await caches.match('./index.html')) || Response.error();
        }
        return Response.error();
      }
    })());
    return;
  }

  /* Images/fonts/media: return cache immediately, refresh only when missing. */
  event.respondWith((async()=>{
    const cached=await caches.match(request);
    if(cached)return cached;
    try{
      const fresh=await fetch(request);
      if(fresh && fresh.ok){
        const cache=await caches.open(CACHE);
        cache.put(request,fresh.clone()).catch(()=>{});
      }
      return fresh;
    }catch(_err){
      return Response.error();
    }
  })());
});
