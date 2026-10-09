// Exact work request destinations shared by inbox and foreground/background push.
(function(root){
  'use strict';
  function fields(source){
    const s=source||{}, d=s.data||{}, f=s.FCM_MSG||d.FCM_MSG||{};
    return [s,d,f,f.data||{},s.notification?.data||{}];
  }
  function value(parts,key){
    for(const p of parts){if(typeof p[key]==='string'&&p[key].trim())return p[key].trim();if(Number.isSafeInteger(p[key])&&p[key]>0)return String(p[key]);}
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
    const request=requestTarget(source,baseHref);if(request)return request;
    const base=new URL('./',baseHref);
    return safeUrl(rawLink(fields(source)),base)?.href||new URL('notifications-center.html',base).href;
  }
  function requestTarget(source,baseHref){
    const driver=driverTarget(source,baseHref);if(driver){const u=new URL(driver);if(u.pathname.endsWith('/driver.html'))u.hash='requestsSection';return u.href;}
    const parts=fields(source),base=new URL('./',baseHref),explicit=safeUrl(rawLink(parts),base),kind=value(parts,'kind');
    const local=explicit&&explicit.origin===base.origin&&explicit.pathname.startsWith(base.pathname)?explicit:null;
    const name=local?.pathname.slice(base.pathname.length);
    const positive=id=>/^\d+$/.test(id||'')&&Number.isSafeInteger(Number(id))&&Number(id)>0;
    // A generic administrator announcement keeps its detail modal and original link.
    if(['admin_broadcast','news'].includes(kind)||value(parts,'type')==='news')return null;
    if(name==='driver.html'&&/^[A-Za-z0-9_-]{1,160}$/.test(local.searchParams.get('ride')||'')){local.hash='requestsSection';return local.href;}
    if(name==='shop-courier.html'&&positive(local.searchParams.get('delivery')))return local.href;
    if(name==='provider-dashboard.html'){
      if(!positive(local.searchParams.get('request')))return null;
      local.searchParams.set('view','requests');if(!['orders','requests'].includes(local.searchParams.get('source')))local.searchParams.set('source','requests');
      local.hash='incomingRequestsCard';return local.href;
    }
    const ref=value(parts,'external_ref')||value(parts,'event_key');
    if(name==='seller-dashboard.html'||kind==='shop_order_new'){
      const match=/^shop:(\d+):/.exec(ref),id=value(parts,'shop_order_id')||value(parts,'order_id')||local?.searchParams.get('order')||(match?match[1]:'');
      const u=new URL('seller-dashboard.html',base);if(positive(id))u.searchParams.set('order',id);u.hash='orders';return u.href;
    }
    return null;
  }
  root.HA_NotificationRoute={resolve,driverTarget,requestTarget};
})(typeof self!=='undefined'?self:globalThis);
