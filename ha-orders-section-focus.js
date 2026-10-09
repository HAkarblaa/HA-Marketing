// Focus the existing incoming orders section after its role-gated panel becomes visible.
(function(){
  const sections={'driver.html':'requestsSection','seller-dashboard.html':'sellerOrderTools','provider-dashboard.html':'incomingRequestsCard'};
  const id=sections[location.pathname.split('/').pop()];
  if(!id||location.hash!=='#'+id)return;
  let observer,timer,finished=false;
  function focus(){
    if(finished)return;
    const el=document.getElementById(id);
    if(!el||!el.getClientRects().length||getComputedStyle(el).visibility==='hidden')return;
    finished=true;observer?.disconnect();clearTimeout(timer);
    el.style.scrollMarginTop='80px';requestAnimationFrame(()=>el.scrollIntoView({block:'start',behavior:'auto'}));
  }
  function start(){
    observer=new MutationObserver(focus);observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['style','class','hidden','data-ha-account-lock']});
    timer=setTimeout(()=>{observer.disconnect();finished=true;},15000);focus();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
