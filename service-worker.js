const CACHE='ha-marketing-v2026-09-26-clickfix3';
const CORE=['./index.html','./ha-modern-green.css?v=20260926-clickfix3','./ha-modern-green.js?v=20260926-clickfix3','./ha-section-slider.css?v=20260926-clickfix3','./ha-section-slider.js?v=20260926-clickfix3','./ha-logo-transparent.png'];
self.addEventListener('install',e=>{e.waitUntil((async()=>{const c=await caches.open(CACHE);await Promise.allSettled(CORE.map(u=>c.add(u)));await self.skipWaiting();})())});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{for(const k of await caches.keys()){if(k.startsWith('ha-marketing-')&&k!==CACHE)await caches.delete(k)}await self.clients.claim();})())});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url);
  if(u.origin!==self.location.origin)return;
  const isPage=e.request.mode==='navigate'||u.pathname.endsWith('.html')||u.pathname.endsWith('/');
  const isCode=/\.(?:css|js)$/.test(u.pathname);
  if(isPage||isCode){
    e.respondWith((async()=>{try{const r=await fetch(e.request,{cache:'no-store'});if(r&&r.ok){const c=await caches.open(CACHE);c.put(e.request,r.clone())}return r}catch(_){return (await caches.match(e.request))||(isPage?await caches.match('./index.html'):Response.error())}})());
    return;
  }
  e.respondWith((async()=>{const hit=await caches.match(e.request);if(hit)return hit;try{const r=await fetch(e.request);if(r&&r.ok){const c=await caches.open(CACHE);c.put(e.request,r.clone())}return r}catch(_){return Response.error()}})());
});
