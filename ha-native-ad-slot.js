(function(){
'use strict';let installed=false,frame=0;
function install(){
 const api=window.HAAndroid;if(installed||api?.adsApiVersion<2||!api.setNativeAdSlot)return;
 if(!/\/(?:index\.html)?$/.test(location.pathname))return;
 const main=document.querySelector('main');if(!main)return;installed=true;
 const slot=document.createElement('section');slot.id='haNativeContentAd';slot.setAttribute('aria-label','إعلان');
 slot.style.cssText='height:320px;margin:20px 0;background:#fff;border:1px solid #dce8ed;border-radius:16px;overflow:hidden';
 const label=document.createElement('p');label.textContent='إعلان';label.style.cssText='padding:12px;color:#738795;font:13px Tahoma';slot.appendChild(label);
 const anchor=main.querySelector('#all,.ha-cats');if(anchor)anchor.after(slot);else main.appendChild(slot);
 function send(){frame=0;const r=slot.getBoundingClientRect();let bottom=innerHeight;
  document.querySelectorAll('.ha-bottom,.ha-bottom-nav,.ha-modern-bottom,.bottom-nav').forEach(el=>{if(getComputedStyle(el).position==='fixed'){const b=el.getBoundingClientRect();if(b.height>0)bottom=Math.min(bottom,b.top);}});
  const scale=window.visualViewport?.scale||1;
  api.setNativeAdSlot({x:r.x,y:r.y,width:r.width,height:r.height,visible:!document.hidden&&scale===1&&r.top>=0&&r.bottom<=bottom&&r.left>=0&&r.right<=innerWidth});
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(send);}
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);addEventListener('ha:native-resume',schedule);document.addEventListener('visibilitychange',schedule);
 if(window.ResizeObserver)new ResizeObserver(schedule).observe(main);
 schedule();
}
addEventListener('ha:native-ready',install);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
