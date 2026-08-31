importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:'AIzaSyAPmaCbhJCh1a7DyDos1HyM95HDKe4L6sE',
  authDomain:'ha-marketing.firebaseapp.com',
  databaseURL:'https://ha-marketing-default-rtdb.europe-west1.firebasedatabase.app',
  projectId:'ha-marketing',
  storageBucket:'ha-marketing.firebasestorage.app',
  messagingSenderId:'558520139704',
  appId:'1:558520139704:web:526f8026dac658403b594d'
});

const messaging=firebase.messaging();

messaging.onBackgroundMessage((payload)=>{
  // When FCM already supplies a notification payload, browsers may display it automatically.
  // We only render data-only payloads here to avoid duplicate notifications.
  if(payload?.notification)return;
  const d=payload?.data||{};
  const title=d.title||'HA Marketing';
  const body=d.message||d.body||'لديك إشعار جديد';
  const link=d.link||d.url||'./';
  return self.registration.showNotification(title,{
    body,
    icon:'./main.jpg',
    badge:'./main.jpg',
    data:{url:link},
    tag:d.notification_id?('ha-notification-'+d.notification_id):undefined
  });
});

self.addEventListener('notificationclick',(event)=>{
  event.notification.close();
  const target=event.notification?.data?.url||'./';
  event.waitUntil((async()=>{
    const list=await clients.matchAll({type:'window',includeUncontrolled:true});
    for(const c of list){
      if('focus' in c){
        try{await c.navigate(target)}catch(_e){}
        return c.focus();
      }
    }
    return clients.openWindow(target);
  })());
});
