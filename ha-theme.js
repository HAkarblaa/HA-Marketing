(function(){
  'use strict';
  var root=document.documentElement;

  function daylightOnly(){
    root.setAttribute('data-ha-theme','light');
    root.style.colorScheme='light';

    /* حذف أي إعداد قديم خاص بالوضع الليلي */
    try{
      localStorage.removeItem('ha_theme_mode');
      localStorage.removeItem('ha_theme_mode_v2');
      localStorage.removeItem('ha-theme');
      localStorage.removeItem('theme');
    }catch(e){}

    /* حذف زر/خاصية تبديل الخلفية إن كانت موجودة بصفحة قديمة */
    document.querySelectorAll('#haThemeToggle,.ha-theme-toggle,[data-theme-toggle]').forEach(function(el){
      el.remove();
    });
  }

  window.haSetTheme=function(){ daylightOnly(); };
  window.haToggleTheme=function(){ daylightOnly(); };

  daylightOnly();
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',daylightOnly);
  }else{
    daylightOnly();
  }
})();
