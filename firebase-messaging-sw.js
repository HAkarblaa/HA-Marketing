importScripts('./ha-notification-route.js?v=20261009-driver-click1');

self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(clients.claim()));

self.addEventListener('notificationclick',(event)=>{
  event.notification.close();
  const base=self.location.origin+self.location.pathname;
  const target=self.HA_NotificationRoute.resolve(event.notification?.data,base);

  if(!/^https?:\/\//i.test(target))return;
  event.stopImmediatePropagation();
  event.waitUntil(
    clients.matchAll({type:'window',includeUncontrolled:true}).then(async list=>{
      const t=new URL(target),appBase=new URL('./',base);
      for(const c of list){
        if('focus' in c){
          try{
            const u=new URL(c.url);
            if(u.origin===t.origin&&u.pathname.startsWith(appBase.pathname)){
              const navigated=await c.navigate(target);
              if(navigated)return await navigated.focus();
            }
          }catch(_e){}
        }
      }
      if(clients.openWindow)return clients.openWindow(target);
    })
  );
});

importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAPmaCbhJCh1a7DyDos1HyM95HDKe4L6sE",
  authDomain: "ha-marketing.firebaseapp.com",
  databaseURL: "https://ha-marketing-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "ha-marketing",
  storageBucket: "ha-marketing.firebasestorage.app",
  messagingSenderId: "558520139704",
  appId: "1:558520139704:web:526f8026dac658403b594d"
});

const messaging=firebase.messaging();

messaging.onBackgroundMessage((payload)=>{
  // Firebase displays notification payloads automatically. Only display data-only messages here.
  if(payload?.notification)return;
  const title=payload?.notification?.title || payload?.data?.title || 'HA Marketing';
  const options={
    body:payload?.notification?.body || payload?.data?.body || 'وصلك إشعار جديد',
    icon:'./ha-logo-transparent.png',
    badge:'./notification-icon.png',
    tag:payload?.data?.tag || ('ha-notification-'+(payload?.data?.notification_id || payload?.messageId || Date.now())),
    renotify:true,
    data:{
      ...(payload?.data||{}),
      url:self.HA_NotificationRoute.resolve(payload,self.location.origin+self.location.pathname)
    }
  };
  return self.registration.showNotification(title,options);
});

