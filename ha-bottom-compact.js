/* Compact section navigation. AdMob's native banner already has its own screen area. */
(()=>{'use strict';if(window.__haCompactBottom)return;window.__haCompactBottom=true;
const page=location.pathname.split('/').pop()||'index.html';if(page==='index.html')return;
const base=new URL('./',document.currentScript.src),sheet=document.createElement('link');sheet.rel='stylesheet';sheet.href=new URL('ha-bottom-compact.css?v=20261101-navfix7',base).href;document.head.append(sheet);
const selector='#haRoleBottomNav,.ha-bottom,.ha-modern-bottom,.bottom-nav,.bottomBar,.bottom-bar,nav.bottom,.fb-nav';let pending=0;
function set(el,values){for(const [key,value]of Object.entries(values))if(el.style.getPropertyValue(key)!==value||el.style.getPropertyPriority(key)!=='important')el.style.setProperty(key,value,'important')}
const paths={home:'<path d="m3 10 9-7 9 7v10H3zM9 20v-7h6v7"/>',sport:'<circle cx="12" cy="12" r="9"/><path d="m12 7 5 4-2 6H9l-2-6zM12 3v4M3 10l4 1m2 6-3 3m9-3 3 3m-1-9 4-1"/>',matches:'<rect x="4" y="5" width="16" height="16" rx="3"/><path d="M8 3v4m8-4v4M4 10h16m-12 4h2m4 0h2m-8 4h2m4 0h2"/>',stats:'<path d="M4 20V4m0 16h17M8 17v-5m5 5V7m5 10V3"/>',teams:'<circle cx="9" cy="8" r="3"/><path d="M3 20v-3a6 6 0 0 1 12 0v3M17 5a3 3 0 0 1 0 6m1 3a5 5 0 0 1 3 4v2"/>'};
const sports={'index.html':['الرئيسية','home'],'sports-center.html':['الرياضة','sport'],'football-matches.html':['المباريات','matches'],'football-statistics.html':['الإحصائيات','stats'],'football-teams.html':['متابعاتي','teams']};
function sportsItem(a){if(a.querySelector('.ha-compact-icon'))return;let path;try{path=new URL(a.href,location.href).pathname.split('/').pop()}catch{return}const info=sports[path];if(!info)return;const icon=document.createElement('span');icon.className='ha-compact-icon';icon.setAttribute('aria-hidden','true');icon.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+paths[info[1]]+'</svg>';const label=document.createElement('span');label.className='ha-compact-label';label.textContent=info[0];a.replaceChildren(icon,label);}
function normalize(){pending=0;const role=document.getElementById('haRoleBottomNav');let found=false;
 for(const nav of document.querySelectorAll(selector)){
  if(nav.closest('dialog,[role=dialog]'))continue;
  if(role&&nav!==role){set(nav,{'display':'none'});continue;}
  const style=getComputedStyle(nav);if(style.display==='none'&&nav!==role)continue;
  if(nav!==role&&style.position!=='fixed'&&!nav.hasAttribute('data-ha-compact-nav'))continue;
  if(nav.parentElement!==document.body)document.body.append(nav);
  if(!nav.hasAttribute('data-ha-compact-nav'))nav.setAttribute('data-ha-compact-nav','');
  set(nav,{'position':'fixed','top':'auto','bottom':'0px','left':'50%','right':'auto','transform':'translateX(-50%)','box-sizing':'border-box','height':'calc(70px + min(env(safe-area-inset-bottom, 0px), 8px))','min-height':'0px','max-height':'78px','aspect-ratio':'auto','padding':'6px 8px','padding-bottom':'calc(6px + min(env(safe-area-inset-bottom, 0px), 8px))','margin':'0px'});
  let inner=nav.querySelector('.ha-rbn-inner,.ha-bottom-inner,.ha-modern-bottominner,.bottom-inner,.ha-compact-inner');
  if(!inner){inner=document.createElement('div');inner.className='ha-compact-inner';while(nav.firstChild)inner.append(nav.firstChild);nav.append(inner)}
  set(inner,{'display':'flex','height':'56px','min-height':'56px','max-height':'56px','aspect-ratio':'auto','padding':'0px','margin':'0px auto','align-items':'stretch','justify-content':'space-between','gap':'3px'});
  for(const a of inner.querySelectorAll('a')){if(nav.classList.contains('fb-nav'))sportsItem(a);if(!a.hasAttribute('data-ha-compact-item'))a.setAttribute('data-ha-compact-item','');set(a,{'display':'flex','height':'56px','min-height':'56px','max-height':'56px','aspect-ratio':'auto','box-sizing':'border-box','flex-direction':'column','align-items':'center','justify-content':'center','padding':'4px 2px','margin':'0px','gap':'3px'});}
  found=true;
 }
 if(found&&!document.body.hasAttribute('data-ha-compact-bottom'))document.body.setAttribute('data-ha-compact-bottom','');
}
function schedule(){if(!pending)pending=requestAnimationFrame(normalize)}
function start(){normalize();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});addEventListener('resize',schedule,{passive:true});window.visualViewport?.addEventListener('resize',schedule,{passive:true});addEventListener('ha:native-ready',schedule);addEventListener('ha:native-resume',schedule);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
