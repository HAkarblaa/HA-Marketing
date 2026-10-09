// One destination for driver notifications in the inbox and foreground/background push.
(function(root){
  'use strict';
  function fields(source){
    const s=source||{}, d=s.data||{}, f=s.FCM_MSG||d.FCM_MSG||{};
    return [s,d,f,f.data||{},s.notification?.data||{}];
  }
  function value(parts,key){
    for(const p of parts){if(typeof p[key]==='string'&&p[key].trim())return p[key].trim();}
    return '';
  }
  function rawLink(parts){
    for(const p of parts){
      const link=p.url||p.link||p.link_url||p.fcmOptions?.link||p.webpush?.fcm_options?.link;
      if(typeof link==='string'&&link.trim())return link.trim();
    }
    return '';
  }
  function safeUrl(raw,base){
    if(!raw)return null;
    try{const u=new URL(raw,base);return /^https?:$/.test(u.protocol)?u:null;}catch(_e){return null;}
  }
  function driverTarget(source,baseHref){
    const parts=fields(source),kind=value(parts,'kind');
    if(!['transport_ride_new','shop_courier_new'].includes(kind))return null;
    const base=new URL('./',baseHref),shop=kind==='shop_courier_new';
    const page=shop?'shop-courier.html':'driver.html';
    const target=new URL(page,base),explicit=safeUrl(rawLink(parts),base);
    if(explicit&&explicit.origin===base.origin&&explicit.pathname===target.pathname)return explicit.href;
    const ref=value(parts,'external_ref')||value(parts,'event_key');
    const match=shop?/^shop-courier:(\d+)(?::new)?$/.exec(ref):/^transport:([A-Za-z0-9_-]{1,160})$/.exec(ref);
    const id=value(parts,shop?'delivery_id':'ride_id')||(match?match[1]:'');
    if(id&&(shop?/^\d+$/:/^[A-Za-z0-9_-]{1,160}$/).test(id))target.searchParams.set(shop?'delivery':'ride',id);
    return target.href;
  }
  function resolve(source,baseHref){
    const driver=driverTarget(source,baseHref);if(driver)return driver;
    const base=new URL('./',baseHref);
    return safeUrl(rawLink(fields(source)),base)?.href||new URL('notifications-center.html',base).href;
  }
  root.HA_NotificationRoute={resolve,driverTarget};
})(typeof self!=='undefined'?self:globalThis);
