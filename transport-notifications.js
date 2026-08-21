// HA Marketing - Transport notifications (Realtime Database + browser/app notifications)
(function(){
  const ENABLE_KEY='ha_notifications_enabled';
  let watchers=[];

  function enabled(){
    return localStorage.getItem(ENABLE_KEY)==='1' && 'Notification' in window && Notification.permission==='granted';
  }

  async function show(title, body, url){
    if(!enabled())return;
    try{
      if('serviceWorker' in navigator){
        const reg=await navigator.serviceWorker.ready;
        await reg.showNotification(title,{
          body,
          icon:'./main.jpg',
          badge:'./main.jpg',
          tag:'ha-transport-'+Date.now(),
          data:{url:url||location.href}
        });
      }else{
        const n=new Notification(title,{body,icon:'./main.jpg'});
        n.onclick=()=>{window.focus(); if(url)location.href=url;};
      }
    }catch(e){console.warn('HA notify error',e)}
  }

  function deviceId(){
    let id=localStorage.getItem('ha_device_id');
    if(!id){
      id='dev_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,10);
      localStorage.setItem('ha_device_id',id);
    }
    return id;
  }

  async function registerContext(role, rideId){
    try{
      if(!window.firebase?.database)return;
      const token=localStorage.getItem('ha_web_push_token')||'';
      await firebase.database().ref('pushDevices/'+deviceId()).update({
        role:role||'unknown',
        activeRide:rideId||'',
        token,
        updatedAt:firebase.database.ServerValue.TIMESTAMP
      });
    }catch(e){console.warn('push context save failed',e)}
  }

  function clear(){
    watchers.forEach(x=>{
      try{x.ref.off(x.event,x.cb)}catch(e){}
    });
    watchers=[];
  }

  function on(ref,event,cb){
    ref.on(event,cb);
    watchers.push({ref,event,cb});
  }

  function watchRide(rideId, role){
    if(!window.firebase?.database || !rideId)return;
    clear();
    registerContext(role,rideId);

    const db=firebase.database();

    // New messages
    const msgRef=db.ref('rideChats/'+rideId+'/messages');
    on(msgRef.limitToLast(30),'child_added',snap=>{
      const m=snap.val();
      if(!m || m.senderRole===role)return;
      const title=role==='driver'?'💬 رسالة من الزبون':'💬 رسالة من السائق/المندوب';
      show(title,m.text||'لديك رسالة جديدة',location.href);
    });

    // Incoming calls
    const callsRef=db.ref('rideCalls/'+rideId);
    on(callsRef.limitToLast(10),'child_added',snap=>{
      const c=snap.val();
      if(!c || c.status!=='ringing' || c.callerRole===role)return;
      const title=role==='driver'?'📞 اتصال من الزبون':'📞 اتصال من السائق/المندوب';
      show(title,'اضغط للعودة إلى الطلب والرد على المكالمة',location.href);
    });

    // Status updates for customer
    const rideRef=db.ref('rides/'+rideId);
    on(rideRef,'value',snap=>{
      const r=snap.val();
      if(!r || role!=='customer')return;
      const key='ha_last_status_'+rideId;
      const previous=localStorage.getItem(key);
      if(previous===r.status)return;
      localStorage.setItem(key,r.status||'');
      const map={
        accepted:'✅ تم قبول طلبك',
        arrived:'🚕 السائق وصل إليك',
        started:'🛣️ بدأت الرحلة',
        finished:'✅ انتهت الرحلة',
        cancelled:'❌ تم إلغاء الطلب'
      };
      if(map[r.status])show(map[r.status], 'اضغط لفتح تفاصيل الطلب', location.href);
    });
  }

  // Driver gets alerts for new pending transport requests while driver page is open.
  function watchDriverRequests(){
    if(!window.firebase?.database)return;
    registerContext('driver','');
    const ref=firebase.database().ref('rides');
    on(ref.limitToLast(30),'child_added',snap=>{
      const r=snap.val();
      if(!r || r.status!=='pending')return;
      show('🚕 طلب جديد قريب منك','يوجد طلب نقل جديد بانتظار سائق',location.href);
    });
  }

  window.HATransportNotify={watchRide,watchDriverRequests,registerContext,show,clear};
})();
