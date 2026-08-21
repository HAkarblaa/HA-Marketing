// HA Marketing - FREE transport notifications
// Spark-plan version: uses Firebase Realtime Database listeners in the open site/app.
// No Cloud Functions / Blaze dependency.
(function(){
  const ENABLE_KEY='ha_notifications_enabled';
  let watchers=[];

  function notificationsAllowed(){
    return 'Notification' in window &&
      Notification.permission==='granted' &&
      localStorage.getItem(ENABLE_KEY)==='1';
  }

  async function notify(title,body,url,tag){
    // In-app alert always works while this page is running.
    try{
      if(document.visibilityState==='visible'){
        console.log('[HA]',title,body||'');
      }
      if(!notificationsAllowed())return;

      const options={
        body:body||'',
        icon:'./main.jpg',
        badge:'./main.jpg',
        tag:tag||('ha-'+Date.now()),
        data:{url:url||location.href}
      };

      if('serviceWorker' in navigator){
        try{
          const reg=await navigator.serviceWorker.ready;
          await reg.showNotification(title,options);
          return;
        }catch(e){}
      }
      const n=new Notification(title,options);
      n.onclick=()=>{window.focus(); if(url)location.href=url;};
    }catch(e){console.warn('HA notification error',e)}
  }

  function add(ref,event,cb){
    ref.on(event,cb);
    watchers.push({ref,event,cb});
  }

  function clear(){
    watchers.forEach(w=>{try{w.ref.off(w.event,w.cb)}catch(e){}});
    watchers=[];
  }

  function watchRide(rideId,role){
    if(!window.firebase?.database || !rideId)return;
    clear();
    const db=firebase.database();

    // New chat messages for the opposite side.
    const msgRef=db.ref('rideChats/'+rideId+'/messages');
    let messagesReady=false;
    msgRef.limitToLast(1).once('value').finally(()=>{messagesReady=true;});
    add(msgRef.limitToLast(50),'child_added',snap=>{
      if(!messagesReady)return;
      const m=snap.val()||{};
      if(!m.text || m.senderRole===role)return;
      notify(
        role==='driver'?'💬 رسالة جديدة من الزبون':'💬 رسالة جديدة من السائق/المندوب',
        m.text,
        location.href,
        'ha-msg-'+rideId
      );
    });

    // Incoming calls for the opposite side.
    const callRef=db.ref('rideCalls/'+rideId);
    let callsReady=false;
    callRef.limitToLast(1).once('value').finally(()=>{callsReady=true;});
    add(callRef.limitToLast(20),'child_added',snap=>{
      if(!callsReady)return;
      const c=snap.val()||{};
      if(c.status!=='ringing' || c.callerRole===role)return;
      notify(
        role==='driver'?'📞 اتصال وارد من الزبون':'📞 اتصال وارد من السائق/المندوب',
        'افتح الطلب للرد على المكالمة.',
        location.href,
        'ha-call-'+rideId
      );
    });

    // Customer status updates.
    if(role==='customer'){
      const rideRef=db.ref('rides/'+rideId+'/status');
      let initial=true;
      add(rideRef,'value',snap=>{
        const status=snap.val();
        if(initial){initial=false;return;}
        const labels={
          accepted:['✅ تم قبول طلبك','السائق قبل الطلب.'],
          arrived:['🚕 السائق وصل','السائق وصل إلى نقطة الانطلاق.'],
          started:['🛣️ بدأت الرحلة','تم بدء الرحلة.'],
          finished:['✅ انتهت الرحلة','تم إنهاء الرحلة بنجاح.'],
          cancelled:['❌ تم إلغاء الطلب','تم إلغاء الطلب.']
        };
        if(labels[status]){
          notify(labels[status][0],labels[status][1],location.href,'ha-status-'+rideId);
        }
      });
    }
  }

  function watchDriverRequests(){
    if(!window.firebase?.database)return;
    const db=firebase.database();
    const ref=db.ref('rides');
    const startedAt=Date.now();

    add(ref.limitToLast(50),'child_added',snap=>{
      const r=snap.val()||{};
      // Avoid notifying for old requests already present before driver opened the page.
      const created=Number(r.createdAt||r.timestamp||0);
      if(r.status!=='pending')return;
      if(created && created < startedAt-5000)return;
      notify(
        '🚕 طلب نقل جديد',
        r.type ? ('طلب '+r.type+' جديد بانتظار سائق.') : 'يوجد طلب جديد بانتظار سائق.',
        location.href,
        'ha-new-ride-'+snap.key
      );
    });
  }

  window.HATransportNotify={
    watchRide,
    watchDriverRequests,
    show:notify,
    clear
  };
})();
