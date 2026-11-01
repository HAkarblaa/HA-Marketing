/* One caption layout for every home tile, including cards added after page load. */
(()=>{'use strict';if(window.HAHomeCardText)return;window.HAHomeCardText=true;
let pending=0;const cached=new WeakMap(),watched=new WeakSet();
const resize=new ResizeObserver(()=>schedule());
function styles(el,values){for(const [k,v] of Object.entries(values))el.style.setProperty(k,String(v),'important')}
function apply(card){
 const title=card.querySelector('strong'),sub=card.querySelector('small');if(!title)return;
 const width=card.getBoundingClientRect().width;if(width<1)return;
 const wrapper=title.parentElement!==card?title.parentElement:null;
 const signature=[Math.round(width),title.textContent,sub?.textContent||''].join('|'),prior=cached.get(card);
 if(prior?.signature===signature&&prior.title===title.getAttribute('style')&&prior.sub===(sub?.getAttribute('style')||'')&&prior.wrapper===(wrapper?.getAttribute('style')||''))return;
 const mobile=width<250,pad=mobile?10:16,left=mobile?38:64,bottom=mobile?9:16,titleSize=Number(Math.max(16,Math.min(30,width*.056)).toFixed(1)),subSize=Number(Math.max(10,Math.min(14,width*.026)).toFixed(1));
 if(wrapper)styles(wrapper,{'display':'contents','position':'static','inset':'auto','transform':'none','background':'transparent','padding':'0','margin':'0'});
 const common={'position':'absolute','display':'block','right':pad+'px','left':left+'px','top':'auto','width':'auto','height':'auto','min-height':'0','max-height':'none','max-width':'none','margin':'0','padding':'0','background':'transparent','color':'rgb(255, 255, 255)','font-family':'Tahoma, Arial, sans-serif','text-align':'right','text-shadow':'0px 2px 5px rgba(0, 24, 47, 0.65)','opacity':'1','visibility':'visible','transform':'none','z-index':'4','white-space':'normal','overflow-wrap':'anywhere','box-sizing':'border-box'};
 if(sub)styles(sub,{...common,'font-size':subSize+'px','font-weight':'600','line-height':'1.4','bottom':bottom+'px'});
 const subHeight=sub?Math.max(Math.ceil(sub.getBoundingClientRect().height),Math.ceil(subSize*(mobile?2.8:1.4))):0;
 if(sub)styles(sub,{'min-height':subHeight+'px'});
 styles(title,{...common,'font-size':titleSize+'px','font-weight':'900','line-height':'1.25','bottom':(bottom+(subHeight?subHeight+3:0))+'px'});
 cached.set(card,{signature,title:title.getAttribute('style'),sub:sub?.getAttribute('style')||'',wrapper:wrapper?.getAttribute('style')||''});
}
function run(){pending=0;for(const card of document.querySelectorAll('.ha-main #all.ha-cats > a')){if(!watched.has(card)){watched.add(card);resize.observe(card)}apply(card)}}
function schedule(){if(!pending)pending=requestAnimationFrame(run)}
function boot(){const grid=document.querySelector('.ha-main #all.ha-cats');if(!grid)return;new MutationObserver(records=>{if(records.some(r=>r.type!=='attributes'||r.target.matches?.('strong,small')||r.target.querySelector?.('strong,small')))schedule()}).observe(grid,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['style']});schedule();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
addEventListener('resize',schedule);addEventListener('pageshow',schedule);document.addEventListener('load',schedule,true);document.fonts?.ready.then(schedule);
})();
