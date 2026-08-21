importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');
firebase.initializeApp({apiKey:"AIzaSyAPmaCbhJCh1a7DyDos1HyM95HDKe4L6sE",authDomain:"ha-marketing.firebaseapp.com",projectId:"ha-marketing",storageBucket:"ha-marketing.firebasestorage.app",messagingSenderId:"558520139704",appId:"1:558520139704:web:526f8026dac658403b594d"});
const messaging=firebase.messaging();
messaging.onBackgroundMessage(p=>self.registration.showNotification(p?.notification?.title||p?.data?.title||'HA Marketing',{body:p?.notification?.body||p?.data?.body||'لديك إشعار جديد',icon:'./main.jpg',data:{url:p?.data?.url||'./'}}));
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(clients.openWindow(e.notification?.data?.url||'./'))});