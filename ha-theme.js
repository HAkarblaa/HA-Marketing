(function(){
  'use strict';
  const root = document.documentElement;
  const KEYS = ['ha_theme_mode_v2','ha_theme_mode','ha-theme','theme'];
  function forceLight(){
    root.setAttribute('data-ha-theme','light');
    root.style.colorScheme='light';
    try{ KEYS.forEach(k=>localStorage.setItem(k,'light')); }catch(e){}
    try{ sessionStorage.setItem('ha_theme_mode_v2','light'); }catch(e){}
    document.querySelectorAll('#haThemeToggle,.ha-theme-toggle,[data-theme-toggle],[data-ha-theme-toggle]').forEach(el=>el.remove());
    const meta = document.querySelector('meta[name="theme-color"]');
    if(meta) meta.setAttribute('content','#f6fbff');
    document.body && document.body.classList.remove('dark','theme-dark');
  }
  window.haSetTheme = forceLight;
  window.haToggleTheme = forceLight;
  forceLight();
  document.addEventListener('DOMContentLoaded', forceLight, {once:false});
  window.addEventListener('pageshow', forceLight);
  window.addEventListener('storage', forceLight);
})();
