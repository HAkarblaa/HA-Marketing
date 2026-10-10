/* Static site files load from cache immediately; account/order API calls stay live. */
const CACHE='ha-marketing-speed-images-v2026-10-10-2';
const CORE=['./index.html','./ha-account-gate.js?v=20261010-speed1','./ha-section-artwork.js?v=20261010-speed-images2','./ha-modern-green.js?v=20261010-speed1','./ha-notification-open.js?v=20261010-speed1'];
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
    await Promise.all(keys.filter(key=>key.startsWith('ha-marketing-')&&key!==CACHE).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});
function cacheable(url,request){
  if(request.method!=='GET'||request.cache==='no-store'||url.origin!==self.location.origin)return false;
  if(request.headers.has('Authorization'))return false;
  if(url.searchParams.has('code')||url.searchParams.has('access_token')||url.searchParams.has('refresh_token'))return false;
  return request.mode==='navigate'||/\.(?:html|css|js|png|jpg|jpeg|webp|svg|woff2?|ico)$/i.test(url.pathname);
}
async function refresh(request,cache){
  const response=await fetch(request);
  if(response.ok&&response.type!=='opaque'&&!response.redirected){
    try{await cache.put(request,response.clone());}catch(_e){}
  }
  return response;
}
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(!cacheable(url,request))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE),cached=await cache.match(request);
    const force=request.cache==='reload'||request.cache==='no-store';
    if(cached&&!force){
      // Hashed artwork never changes at the same URL. Other static files refresh
      // in the background, so taps do not wait for a network timeout.
      if(!/\/ha-fast-[a-f0-9]{20}\./.test(url.pathname))event.waitUntil(refresh(request,cache).catch(()=>{}));
      return cached;
    }
    try{return await refresh(request,cache);}catch(_e){
      if(cached)return cached;
      if(request.mode==='navigate'){
        const fallback=await cache.match(new URL('./index.html',self.location.href).href);
        if(fallback)return Response.redirect(new URL('./index.html',self.location.href).href,302);
      }
      return Response.error();
    }
  })());
});
