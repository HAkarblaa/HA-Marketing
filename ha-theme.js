(function(){
  'use strict';
  var root=document.documentElement;
  function forceLight(){
    root.setAttribute('data-ha-theme','light');
    root.style.colorScheme='light';
    try{
      ['ha_theme_mode','ha_theme_mode_v2','ha-theme','theme'].forEach(function(k){localStorage.setItem(k,'light')});
    }catch(e){}
    document.querySelectorAll('#haThemeToggle,.ha-theme-toggle,[data-theme-toggle],[data-ha-theme-toggle]').forEach(function(el){el.remove()});
    var meta=document.querySelector('meta[name="theme-color"]');
    if(meta) meta.setAttribute('content','#eef6ff');
  }
  window.haSetTheme=function(){forceLight()};
  window.haToggleTheme=function(){forceLight()};
  forceLight();
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',forceLight);
  else forceLight();
  window.addEventListener('pageshow',forceLight);
  window.addEventListener('storage',forceLight);
})();