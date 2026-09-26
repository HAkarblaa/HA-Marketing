(function(){
  'use strict';
  function isSafeLocalHref(href){
    return href && !/^\s*(javascript:|data:)/i.test(href);
  }

  /* Explicit keyboard/touch fallback for links in the redesigned pages. */
  document.addEventListener('click', function(e){
    var a=e.target.closest && e.target.closest('a[href]');
    if(!a) return;
    var href=a.getAttribute('href');
    if(!isSafeLocalHref(href)) return;
    /* Native navigation is preferred. This only repairs cases where another
       page script cancelled the click without providing its own navigation. */
    setTimeout(function(){
      try{
        if(e.defaultPrevented && !a.dataset.haAllowPrevent){
          if(href.charAt(0)==='#'){
            var el=document.querySelector(href);
            if(el) el.scrollIntoView({behavior:'smooth',block:'start'});
          }else{
            location.href=href;
          }
        }
      }catch(_e){}
    },0);
  }, true);

  /* Keep accidental full-page transparent layers from blocking the app.
     Only layers that are effectively invisible are touched; visible modals remain intact. */
  function clearInvisibleBlockers(){
    var app=document.querySelector('.ha-app');
    if(!app) return;
    Array.prototype.forEach.call(document.body.children,function(el){
      if(el===app || el.classList.contains('ha-bottom') || el.tagName==='SCRIPT' || el.tagName==='STYLE') return;
      var s=getComputedStyle(el), r=el.getBoundingClientRect();
      var fullscreen=r.width>=innerWidth*0.95 && r.height>=innerHeight*0.95;
      var invisible=(parseFloat(s.opacity||'1')<0.02) || (s.backgroundColor==='rgba(0, 0, 0, 0)' && !el.textContent.trim() && !el.querySelector('img,video,canvas,iframe'));
      if(fullscreen && invisible && s.position==='fixed' && s.pointerEvents!=='none'){
        el.style.pointerEvents='none';
      }
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',clearInvisibleBlockers);
  else clearInvisibleBlockers();
  window.addEventListener('pageshow',clearInvisibleBlockers);
})();
