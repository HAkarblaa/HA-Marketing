
(function(){
  function q(s,r){return (r||document).querySelector(s)}
  function qa(s,r){return Array.from((r||document).querySelectorAll(s))}
  var search=q('#haSearch');
  if(search){
    search.addEventListener('input',function(){
      var term=(this.value||'').trim().toLowerCase();
      var cards=qa('[data-search]');
      var shown=0;
      cards.forEach(function(el){
        var hay=(el.getAttribute('data-search')||'').toLowerCase();
        var ok=!term||hay.indexOf(term)>-1;
        el.style.display=ok?'':'none'; if(ok) shown++;
      });
      var empty=q('#haEmpty'); if(empty) empty.style.display=(term&&shown===0)?'block':'none';
    });
  }
  var loc=q('#haLocation');
  if(loc){
    loc.addEventListener('click',function(){
      var sub=q('small',loc);
      if(!navigator.geolocation){ if(sub) sub.textContent='الموقع غير مدعوم'; return; }
      if(sub) sub.textContent='جاري تحديد موقعك...';
      navigator.geolocation.getCurrentPosition(function(p){
        if(sub) sub.textContent='تم تحديد موقعك ✓';
        try{localStorage.setItem('ha_last_lat',p.coords.latitude);localStorage.setItem('ha_last_lng',p.coords.longitude)}catch(e){}
      },function(){ if(sub) sub.textContent='فعّل إذن الموقع'; },{enableHighAccuracy:true,timeout:9000,maximumAge:60000});
    });
  }
})();
