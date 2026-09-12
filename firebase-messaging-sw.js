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
  const title=payload?.notification?.title || payload?.data?.title || 'HA Marketing';
  const options={
    body:payload?.notification?.body || payload?.data?.body || 'وصلك إشعار جديد',
    icon:'../icon-192.png',
    badge:'../icon-192.png',
    tag:payload?.data?.tag || 'ha-marketing',
    renotify:true,
    data:{
      url:payload?.data?.link || '../notifications-center.html'
    }
  };
  self.registration.showNotification(title,options);
});

self.addEventListener('notificationclick',(event)=>{
  event.notification.close();
  const target=new URL(
    event.notification?.data?.url || '../notifications-center.html',
    self.location.origin + self.location.pathname
  ).href;

  event.waitUntil(
    clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
      for(const c of list){
        if('focus' in c){
          try{
            const u=new URL(c.url);
            const t=new URL(target);
            if(u.origin===t.origin){
              c.navigate(target);
              return c.focus();
            }
          }catch(_e){}
        }
      }
      if(clients.openWindow)return clients.openWindow(target);
    })
  );
});
