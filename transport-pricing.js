// HA Marketing - unified transport pricing helper
(function(){
  function round250(x){ return Math.ceil(Number(x||0)/250)*250; }

  const EXTRA_FEES={
    taxi:{extraDestination:1000,stop:750,luggage:500,passenger:500},
    tuktuk:{extraDestination:750,stop:500,luggage:250,passenger:250},
    delivery:{extraDestination:1000,extraPickup:1000,fragile:750,package:500}
  };

  function extrasTotal(type, extras={}){
    const f=EXTRA_FEES[type]||{};
    let total=0,parts=[];

    if(type==='delivery'){
      if(extras.extraDestination){ total+=f.extraDestination; parts.push(['وصول إضافي',f.extraDestination]); }
      if(extras.extraPickup){ total+=f.extraPickup; parts.push(['استلام إضافي',f.extraPickup]); }
      if(extras.fragile){ total+=f.fragile; parts.push(['قابل للكسر',f.fragile]); }
      const packages=Math.max(1,Number(extras.packages||1));
      if(packages>1){
        const fee=(packages-1)*f.package;
        total+=fee;parts.push([`${packages-1} طرد إضافي`,fee]);
      }
    }else{
      if(extras.extraDestination){ total+=f.extraDestination; parts.push(['وصول إضافي',f.extraDestination]); }
      if(extras.stop){ total+=f.stop; parts.push(['توقف/انتظار',f.stop]); }
      if(extras.luggage){ total+=f.luggage; parts.push(['أغراض/حقائب',f.luggage]); }
      const p=Math.max(0,Number(extras.extraPassengers||0));
      if(p){
        const fee=p*f.passenger;
        total+=fee;parts.push([`${p} راكب إضافي`,fee]);
      }
    }
    return {total:round250(total),parts};
  }

  function baseFare(card,km,min){
    return round250(
      Number(card.dataset.base||0)+
      Number(km||0)*Number(card.dataset.km||0)+
      Number(min||0)*Number(card.dataset.min||0)
    );
  }

  function totalFare(type,card,km,min,extras){
    const base=baseFare(card,km,min);
    const ex=extrasTotal(type,extras);
    return {base,extras:ex.total,total:round250(base+ex.total),parts:ex.parts};
  }

  window.HA_Pricing={round250,extrasTotal,baseFare,totalFare,EXTRA_FEES};
})();
