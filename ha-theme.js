(function(){
  'use strict';
  const root=document.documentElement;
  const KEYS=['ha_theme_mode_v2','ha_theme_mode','ha-theme','theme'];
  function daylight(){
    root.setAttribute('data-ha-theme','light');
    root.style.colorScheme='light';
    try{KEYS.forEach(k=>localStorage.setItem(k,'light'));}catch(e){}
    document.querySelectorAll('#haThemeToggle,.ha-theme-toggle,[data-theme-toggle],[data-ha-theme-toggle]').forEach(el=>el.remove());
    try{window.dispatchEvent(new CustomEvent('ha-theme-changed',{detail:{theme:'light'}}));}catch(e){}
  }
  window.haSetTheme=daylight;
  window.haToggleTheme=daylight;
  daylight();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',daylight,{once:true});
  else daylight();
  window.addEventListener('storage',daylight);
})();

(function(){function kill(){document.documentElement.setAttribute('data-ha-theme','light');document.documentElement.style.colorScheme='light';document.querySelectorAll('#haThemeToggle,.ha-theme-toggle,[data-theme-toggle],[data-ha-theme-toggle]').forEach(function(e){e.remove();});}kill();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',kill);else kill();window.addEventListener('pageshow',kill);})();
