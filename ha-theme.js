(function(){
  'use strict';

  var KEY='ha_theme_mode';
  var root=document.documentElement;

  function readTheme(){
    try{
      var v=localStorage.getItem(KEY);
      return v==='light' ? 'light' : 'dark';
    }catch(e){
      return 'dark';
    }
  }

  function applyTheme(mode){
    mode = mode==='light' ? 'light' : 'dark';
    root.setAttribute('data-ha-theme',mode);
    root.style.colorScheme = mode;

    try{ localStorage.setItem(KEY,mode); }catch(e){}

    var btn=document.getElementById('haThemeToggle');
    if(btn){
      var isDark=mode==='dark';
      btn.innerHTML=isDark?'☀️':'🌙';
      btn.setAttribute('aria-label',isDark?'تفعيل الوضع النهاري':'تفعيل الوضع المظلم');
      btn.setAttribute('title',isDark?'الوضع النهاري':'الوضع المظلم');
    }

    try{
      window.dispatchEvent(new CustomEvent('ha-theme-changed',{detail:{theme:mode}}));
    }catch(e){}
  }

  window.haSetTheme=applyTheme;
  window.haToggleTheme=function(){
    applyTheme(root.getAttribute('data-ha-theme')==='light'?'dark':'light');
  };

  /* Apply before page paint as early as possible. */
  applyTheme(readTheme());

  function isHomePage(){
    var p=(location.pathname||'').toLowerCase();
    return p.endsWith('/index.html') ||
           p.endsWith('/index-offline.html') ||
           p==='/' ||
           p.endsWith('/');
  }

  function addToggle(){
    if(!isHomePage() || document.getElementById('haThemeToggle')) return;

    var btn=document.createElement('button');
    btn.type='button';
    btn.id='haThemeToggle';
    btn.className='ha-theme-toggle';
    btn.onclick=window.haToggleTheme;
    document.body.appendChild(btn);

    applyTheme(root.getAttribute('data-ha-theme')||readTheme());
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',addToggle);
  }else{
    addToggle();
  }

  window.addEventListener('storage',function(e){
    if(e.key===KEY){
      applyTheme(e.newValue==='light'?'light':'dark');
    }
  });
})();