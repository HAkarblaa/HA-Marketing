(function(){
const c=window.HA_PUSH_CONFIG;if(!c)return;
function load(u){return new Promise((r,j)=>{let s=document.createElement('script');s.src=u;s.onload=r;s.onerror=j;document.head.appendChild(s)})}
async function enable(){
 try{
  if(!('serviceWorker'in navigator)||!('Notification'in window)){alert('هذا المتصفح لا يدعم الإشعارات');return}
  if(c.vapidKey.includes('PUT_YOUR')){alert('باقي فقط إضافة VAPID Key من Firebase');return}
  if(await Notification.requestPermission()!=='granted')return;
  await load('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
  await load('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');
  if(!firebase.apps.length)firebase.initializeApp(c.firebaseConfig);
  let reg=await navigator.serviceWorker.register('./firebase-messaging-sw.js');
  let token=await firebase.messaging().getToken({vapidKey:c.vapidKey,serviceWorkerRegistration:reg});
  localStorage.setItem('ha_web_push_token',token);
  document.getElementById('haPushButton').textContent='🔔 الإشعارات مفعّلة';
  alert('تم تفعيل الإشعارات');
 }catch(e){console.error(e);alert('تعذر تفعيل الإشعارات حالياً')}
}
function add(){
 if(document.getElementById('haPushButton'))return;
 let b=document.createElement('button');b.id='haPushButton';
 b.textContent=Notification.permission==='granted'?'🔔 الإشعارات مفعّلة':'🔔 تفعيل الإشعارات';
 b.onclick=enable;b.style.cssText='position:fixed;right:14px;bottom:78px;z-index:99999;border:0;border-radius:999px;padding:10px 14px;background:#111;color:#fff;font-weight:800;box-shadow:0 5px 18px #0004';
 document.body.appendChild(b)
}
window.HA_EnableNotifications=enable;
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',add):add();
})();