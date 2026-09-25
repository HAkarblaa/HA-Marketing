(function(){
  'use strict';

  var root=document.documentElement;
  var KEY='ha_theme_mode_v2';

  function forceDaylight(){
    root.setAttribute('data-ha-theme','light');
    root.style.colorScheme='light';

    try{
      localStorage.setItem(KEY,'light');
      localStorage.setItem('ha_theme_mode','light');
      localStorage.setItem('ha-theme','light');
      localStorage.setItem('theme','light');
    }catch(e){}

    var btn=document.getElementById('haThemeToggle');
    if(btn) btn.remove();

    document.querySelectorAll('.ha-theme-toggle').forEach(function(el){
      el.remove();
    });

    try{
      window.dispatchEvent(new CustomEvent('ha-theme-changed',{
        detail:{theme:'light'}
      }));
    }catch(e){}
  }

  window.haSetTheme=function(){ forceDaylight(); };
  window.haToggleTheme=function(){ forceDaylight(); };

  forceDaylight();

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',forceDaylight);
  }else{
    forceDaylight();
  }

  window.addEventListener('storage',function(){
    forceDaylight();
  });
})();
