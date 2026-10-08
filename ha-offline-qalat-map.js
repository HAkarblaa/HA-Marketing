// Nationwide map support; no automatic download of a particular town.
(function(){
  'use strict';
  async function register(){
    if(!('serviceWorker' in navigator) || !('caches' in window))return;
    try{
      const reg=await navigator.serviceWorker.register('./ha-offline-map-sw.js',{scope:'./',updateViaCache:'none'});
      await reg.update();
    }catch(e){console.warn('HA map cache',e);}
  }
  window.addEventListener('online',register);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',register,{once:true});
  else register();
})();
