(function(){
'use strict';if(window.__haCompactBottom)return;window.__haCompactBottom=true;
const page=location.pathname.split('/').pop()||'index.html';if(page==='index.html')return;
const base=new URL('./',document.currentScript.src);
const css=document.createElement('link');css.rel='stylesheet';css.href=new URL('ha-bottom-compact.css?v=1',base).href;document.head.append(css);
let scheduled=false;
function normalize(){scheduled=false;let found=false;
 document.querySelectorAll('#haRoleBottomNav,.ha-bottom,.ha-modern-bottom,.bottom-nav,.bottomBar,.bottom-bar,nav.bottom').forEach(nav=>{
  if(nav.closest('dialog,[role=dialog]'))return;
  const style=getComputedStyle(nav);if(nav.id!=='haRoleBottomNav'&&style.position!=='fixed'&&!nav.hasAttribute('data-ha-compact-nav'))return;
  // Move only navigation bars to the document root so a section transform cannot anchor them.
  if(nav.parentElement!==document.body)document.body.appendChild(nav);
  nav.setAttribute('data-ha-compact-nav','');found=true;
 });
 if(found)document.body.setAttribute('data-ha-compact-bottom','');
}
function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(normalize);}}
function start(){normalize();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});addEventListener('resize',schedule,{passive:true});addEventListener('ha:native-ready',schedule);addEventListener('ha:native-resume',schedule);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
