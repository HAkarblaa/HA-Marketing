(function(){
  'use strict';
  var root=document.documentElement;
  root.setAttribute('data-ha-theme','light');
  root.style.colorScheme='light';
  try{localStorage.setItem('ha_theme_mode','light')}catch(e){}
  function addCss(){
    if(document.querySelector('link[href*="ha-modern-green.css"]'))return;
    var l=document.createElement('link');l.rel='stylesheet';l.href='ha-modern-green.css?v=20260926-1';document.head.appendChild(l);
  }
  function addJs(){
    if(document.querySelector('script[src*="ha-modern-green.js"]'))return;
    var s=document.createElement('script');s.src='ha-modern-green.js?v=20260926-1';s.defer=true;document.head.appendChild(s);
  }
  window.haSetTheme=function(){root.setAttribute('data-ha-theme','light');root.style.colorScheme='light'};
  window.haToggleTheme=window.haSetTheme;
  addCss();addJs();
})();
