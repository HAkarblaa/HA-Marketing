// HA Marketing - Realtime ride status UI
(function(){
  const LABELS={
    taxi:{
      searching:'جاري البحث عن سائق',
      accepted:'السائق بالطريق إليك',
      arrived:'السائق وصل إليك',
      started:'الرحلة بدأت',
      finished:'تم إنهاء الرحلة',
      cancelled:'تم إلغاء الرحلة',
      rejected:'لم يتم قبول الطلب'
    },
    tuktuk:{
      searching:'جاري البحث عن سائق تكتك',
      accepted:'السائق بالطريق إليك',
      arrived:'السائق وصل إليك',
      started:'الرحلة بدأت',
      finished:'تم إنهاء الرحلة',
      cancelled:'تم إلغاء الرحلة',
      rejected:'لم يتم قبول الطلب'
    },
    delivery:{
      searching:'جاري البحث عن مندوب',
      accepted:'المندوب بالطريق إلى نقطة الاستلام',
      arrived:'المندوب وصل إلى نقطة الاستلام',
      started:'المندوب بالطريق إلى نقطة التسليم',
      finished:'تم تسليم الطلب',
      cancelled:'تم إلغاء الطلب',
      rejected:'لم يتم قبول الطلب'
    }
  };

  let refs=[];

  function label(type,status){
    return (LABELS[type]&&LABELS[type][status])||status||'';
  }

  function paint(container,status){
    if(!container)return;
    const order=['accepted','arrived','started','finished'];
    const index=order.indexOf(status);
    container.querySelectorAll('[data-ride-step]').forEach((el,i)=>{
      el.classList.toggle('done', index>=i);
      el.classList.toggle('current', index===i && status!=='finished');
    });
  }

  function watch(rideId,type,opts={}){
    if(!window.firebase?.database || !rideId)return;
    const ref=firebase.database().ref('rides/'+rideId+'/status');
    const cb=snap=>{
      const status=snap.val();
      if(!status)return;

      const txt=label(type,status);
      if(opts.textElement){
        const el=typeof opts.textElement==='string'
          ? document.getElementById(opts.textElement)
          : opts.textElement;
        if(el)el.textContent=txt;
      }

      if(opts.timelineElement){
        const el=typeof opts.timelineElement==='string'
          ? document.getElementById(opts.timelineElement)
          : opts.timelineElement;
        paint(el,status);
      }

      window.dispatchEvent(new CustomEvent('ha-ride-status',{
        detail:{rideId,type,status,text:txt}
      }));
    };
    ref.on('value',cb);
    refs.push({ref,cb});
  }

  function clear(){
    refs.forEach(x=>{try{x.ref.off('value',x.cb)}catch(e){}});
    refs=[];
  }

  window.HA_RideStatus={watch,clear,label};
  window.addEventListener('beforeunload',clear);
})();
