(function(){
'use strict';if(window.HAGrowth)return;
const PAGE=location.pathname.split('/').pop()||'index.html',BASE=new URL('./',document.currentScript.src);
const GAMES=[['snake.html','لعبة الحية'],['bird-game.html','لعبة الطائر'],['level-devil.html','ليفل ديفل'],['penalties.html','ركلات الجزاء']];
const CONTENT=new Set(['index.html','shop.html','services.html','study.html','study-summary.html','study-exam.html','file-tools.html','entertainment.html','games.html','games-hub.html','game-center.html','sports-center.html','football-matches.html','football-statistics.html','football-teams.html','football-team.html','football-player.html','football-match-details.html','store.html','product-details.html','piano.html',...GAMES.map(x=>x[0])]);
const PARAMS=['id','store','product','team','league','player','event','sport','game'];
function read(key,fallback){try{const x=JSON.parse(localStorage.getItem(key));return x??fallback;}catch(_){return fallback;}}
function write(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch(_){return false;}}
function day(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function owner(){try{const x=JSON.parse(localStorage.getItem('ha-marketing-auth')||'null');return String(x?.user?.id||x?.currentSession?.user?.id||'guest');}catch(_){return 'guest';}}
function key(){return 'ha_activity_v1_'+owner();}
function state(){const s=read(key(),{});return {recent:[],favorites:[],days:{},remind:false,hour:18,...s};}
function update(fn){const s=state();fn(s);const days=Object.keys(s.days||{}).sort().reverse();for(const d of days.slice(90))delete s.days[d];return write(key(),s);}
function safeLink(value){try{const u=new URL(value,BASE);if(u.origin!==BASE.origin||!u.pathname.startsWith(BASE.pathname)||!CONTENT.has(u.pathname.split('/').pop()))return null;const clean=new URL(u.pathname,BASE);for(const k of PARAMS){const v=u.searchParams.get(k);if(v&&/^[a-zA-Z0-9_.:-]{1,100}$/.test(v))clean.searchParams.set(k,v);}return clean.href;}catch(_){return null;}}
function title(){const t=document.querySelector('#clubHeader h1,main h1,h1')?.textContent||document.title;return String(t||'HA Marketing').replace(/\s+/g,' ').trim().slice(0,85);}
function challenge(){const seed=Number(day().replaceAll('-',''));return GAMES[seed%GAMES.length];}
function id(){if(crypto.randomUUID)return crypto.randomUUID();const bytes=crypto.getRandomValues(new Uint8Array(16));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;const h=Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('');return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20);}
const $=x=>document.getElementById(x);
function el(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;}
function link(text,href,cls){const e=el('a',text,cls);e.href=href;return e;}
async function share(url=location.href,name=title()){
 const clean=safeLink(url)||new URL('index.html',BASE).href;
 try{if(navigator.share){await navigator.share({title:name,url:clean});return;}if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(clean);alert('تم نسخ الرابط');return;}prompt('انسخ الرابط للمشاركة',clean);}catch(e){if(e.name!=='AbortError')prompt('انسخ الرابط للمشاركة',clean);}
}
let lastInput=Date.now(),lastTick=performance.now(),activeTotal=0,stopped=false,adShowing=false,viewId;
function activeTick(){const t=performance.now(),delta=Math.max(0,Math.min(5,(t-lastTick)/1000));lastTick=t;
 if(stopped||adShowing||document.hidden||Date.now()-lastInput>60000||!CONTENT.has(PAGE))return;
 activeTotal+=delta;
 if(GAMES.some(x=>x[0]===PAGE))update(s=>{const d=s.days[day()]??={games:{},study:false};d.games??={};d.games[PAGE]=Math.min(7200,(Number(d.games[PAGE])||0)+delta);});
}
function speed(){const run=()=>{document.querySelectorAll('img:not([loading])').forEach(img=>{if(img.getBoundingClientRect().top>innerHeight*1.25){img.loading='lazy';img.decoding='async';}});};run();let timer;const observer=new MutationObserver(()=>{if(!timer)timer=setTimeout(()=>{timer=0;run();},250);});observer.observe(document.body,{childList:true,subtree:true});setTimeout(()=>{observer.disconnect();clearTimeout(timer);},10000);}
function toolbar(){if(!CONTENT.has(PAGE))return;const main=document.querySelector('main');if(!main)return;
 const bar=el('nav',undefined,'hag-entry');bar.setAttribute('aria-label','المفضّلة والإدارة');
 if(['football-team.html','store.html','product-details.html'].includes(PAGE)){
  const save=el('button');save.type='button';function draw(){save.textContent=state().favorites.some(x=>x.url===safeLink(location.href))?'★ إزالة من المفضّلة':'☆ حفظ بالمفضّلة';}draw();save.onclick=()=>{const url=safeLink(location.href);if(!url)return;const ok=update(s=>{const i=s.favorites.findIndex(x=>x.url===url);if(i>=0)s.favorites.splice(i,1);else s.favorites.unshift({url,title:title(),at:Date.now()});s.favorites=s.favorites.slice(0,60);});if(!ok)alert('تعذر الحفظ؛ مساحة التخزين غير متاحة');draw();};bar.append(save);
 }
 if(bar.childElementCount)main.prepend(bar);
 if(PAGE==='index.html')window.HA_AccountGate?.isMainAdmin().then(ok=>{if(ok){bar.append(link('📊 إحصائيات الاستخدام','admin-usage.html'));if(!bar.isConnected)main.prepend(bar);}}).catch(()=>{});
}

function rows(target,items,removable){const list=$(target);list.replaceChildren();if(!items.length){list.append(el('li','بعد ماكو عناصر محفوظة.'));return;}for(const item of items){const url=safeLink(item.url);if(!url)continue;const row=el('li');row.append(link(item.title||'صفحة محفوظة',url));if(removable){const b=el('button','إزالة','hag-secondary');b.onclick=()=>{update(s=>s.favorites=s.favorites.filter(x=>x.url!==url));renderActivity();};row.append(b);}list.append(row);}}
function renderActivity(){if(!$('hagActivity'))return;const s=state(),[game,name]=challenge(),secs=Math.min(120,Math.floor(s.days?.[day()]?.games?.[game]||0));$('hagChallenge').textContent='العب '+name+' دقيقتين اليوم وخذ شارة الإنجاز.';$('hagProgress').value=secs;$('hagChallengeStatus').textContent=secs>=120?'🏅 أكملت تحدّي اليوم!':secs+' / 120 ثانية نشطة';$('hagPlay').href=game;$('hagStudyCheck').checked=!!s.days?.[day()]?.study;$('hagStudyDays').textContent='جلسات الدراسة التي علّمت إكمالها خلال آخر 90 يوماً: '+Object.values(s.days).filter(x=>x.study).length;rows('hagFavorites',s.favorites,true);rows('hagRecent',s.recent,false);$('hagRemind').checked=!!s.remind;$('hagHour').value=s.hour;$('hagAnalytics').checked=read('ha_usage_enabled',true)!==false;
 $('hagStudyCheck').onchange=e=>{const ok=update(x=>{x.days[day()]??={games:{},study:false};x.days[day()].study=e.target.checked;});$('hagMessage').textContent=ok?'تم حفظ التقدّم':'تعذر الحفظ على هذا الجهاز';renderActivity();};
 $('hagRemind').onchange=e=>update(x=>x.remind=e.target.checked);$('hagHour').onchange=e=>{const n=Number(e.target.value);if(Number.isInteger(n)&&n>=0&&n<=23)update(x=>x.hour=n);else e.target.value=state().hour;};
 $('hagAnalytics').onchange=e=>{write('ha_usage_enabled',e.target.checked);activeTotal=0;viewId=undefined;$('hagMessage').textContent=e.target.checked?'الإحصائيات مفعّلة لهذا الجهاز':'تم إيقاف جمع إحصائيات جديدة لهذا الجهاز';};
 $('hagClear').onclick=()=>{if(!confirm('مسح نشاطك ومفضّلتك وتذكيراتك المحلية؟ ملفات الدراسة ونتائج الألعاب الأصلية تبقى.'))return;try{localStorage.removeItem(key());}catch(_){}renderActivity();};$('hagShare').onclick=()=>share(new URL('index.html',BASE).href,'HA Marketing');
}
// Aggregate first-party usage only. No form values, files, search terms or private routes.
let clientPromise,lastSent=0,sending=false,retryAt=0,sessionId,visitor,trackedDay=day();
async function db(){if(!clientPromise)clientPromise=window.HA_AccountGate.getClient().catch(e=>{clientPromise=null;throw e;});return clientPromise;}
function identity(){visitor=read('ha_usage_visitor',null);if(!/^[a-f0-9-]{36}$/.test(visitor||'')){visitor=id();write('ha_usage_visitor',visitor);}try{let s=JSON.parse(sessionStorage.getItem('ha_usage_session')||'null');if(!s||Date.now()-s.at>1800000)s={id:id()};sessionId=s.id;sessionStorage.setItem('ha_usage_session',JSON.stringify({id:s.id,at:Date.now()}));}catch(_){sessionId=id();}}
function payload(){if(!viewId)viewId=id();return {p_visit:viewId,p_visitor:visitor,p_session:sessionId,p_page:PAGE,p_seconds:Math.min(7200,Math.floor(activeTotal))};}
async function sendUsage(){if(document.hidden||Date.now()-lastInput>60000||!CONTENT.has(PAGE)||read('ha_usage_enabled',true)===false||navigator.doNotTrack==='1'||sending||Date.now()<retryAt||!navigator.onLine)return;
 if(day()!==trackedDay){trackedDay=day();viewId=undefined;activeTotal=0;}
 if(!visitor)identity();else{try{const session=JSON.parse(sessionStorage.getItem('ha_usage_session')||'null');if(!session||Date.now()-session.at>1800000){identity();viewId=undefined;activeTotal=0;}else sessionStorage.setItem('ha_usage_session',JSON.stringify({id:sessionId,at:Date.now()}));}catch(_){}}const data=payload();sending=true;
 try{const c=await db(),r=await c.rpc('ha_usage_record_v1',data);if(r.error)throw r.error;lastSent=Date.now();retryAt=0;}
 catch(_){retryAt=Date.now()+60000;}finally{sending=false;}
}
function flush(){if(!CONTENT.has(PAGE)||!visitor||!viewId||read('ha_usage_enabled',true)===false||navigator.doNotTrack==='1'||Date.now()-lastSent<5000)return;
 // The server receives cumulative seconds, so retries cannot double-count time.
 try{const raw=JSON.parse(localStorage.getItem('ha-marketing-auth')||'null'),token=raw?.access_token;const key='sb_publishable_p3108yoDkdJTLqVXhkvmBg_KVqe-1ll';fetch('https://ubayrhtshgtgggxprrek.supabase.co/rest/v1/rpc/ha_usage_record_v1',{method:'POST',keepalive:true,headers:{apikey:key,Authorization:'Bearer '+(token||key),'Content-Type':'application/json'},body:JSON.stringify(payload())}).catch(()=>{});}catch(_){}
}
let report;
function table(target,heads,items){const root=$(target);root.replaceChildren();const t=el('table'),thead=el('thead'),tr=el('tr');for(const h of heads)tr.append(el('th',h));thead.append(tr);t.append(thead);const body=el('tbody');for(const row of items){const r=el('tr');for(const v of row)r.append(el('td',String(v)));body.append(r);}t.append(body);root.append(t);}
function exportCsv(){if(!report)return;const rows=[['اليوم','زوار أجهزة','جلسات','زوار عائدون','دقائق نشطة'],...report.daily.map(x=>[x.day,x.visitors,x.sessions,x.returning_visitors,Math.round(x.seconds/60)]),[],['الصفحة','زيارات','دقائق نشطة','آخر صفحة للجلسة'],...report.pages.map(x=>[x.page,x.views,Math.round(x.seconds/60),x.exits])];const text='\ufeff'+rows.map(row=>row.map(x=>'"'+String(x).replaceAll('"','""')+'"').join(',')).join('\r\n');const u=URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8'})),a=link('',u);a.download='HA-Usage-'+day()+'.csv';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),30000);}
async function admin(){if(!$('hagAdmin'))return;const status=$('hagAdminStatus');if(!await window.HA_AccountGate.isMainAdmin()){status.textContent='هذه التقارير للأدمن الرئيسي فقط.';return;}$('hagAdminData').hidden=false;
 async function load(){const b=$('hagReload');b.disabled=true;status.textContent='جارٍ تحميل التقرير…';try{const c=await db(),r=await c.rpc('ha_usage_report_v1',{p_days:Number($('hagDays').value)});if(r.error)throw r.error;report=r.data;if(!report||!Array.isArray(report.daily)||!Array.isArray(report.pages))throw Error('report');const totals=$('hagTotals');totals.replaceChildren();for(const [n,v]of [['أجهزة زارت التطبيق',report.visitors],['جلسات الاستخدام',report.sessions],['دقائق نشطة',Math.round(report.seconds/60)]]){const card=el('div',undefined,'hag-card');card.append(el('span',n),el('b',String(v),'hag-stat'));totals.append(card);}table('hagDaily',['اليوم','أجهزة','جلسات','عائدون','دقائق نشطة'],report.daily.map(x=>[x.day,x.visitors,x.sessions,x.returning_visitors,Math.round(x.seconds/60)]));table('hagPages',['الصفحة','زيارات','دقائق نشطة','آخر صفحة'],report.pages.map(x=>[x.page,x.views,Math.round(x.seconds/60),x.exits]));status.textContent=report.daily.length?'تم تحديث التقرير.':'بعد ماكو بيانات ضمن الفترة؛ تبدأ بعد تشغيل الإحصائيات واستخدام الأقسام.';}
 catch(_){report=null;status.textContent='تعذر تحميل التقرير. شغّل HA-USAGE-SETUP.sql بقاعدة بيانات الموقع مرة واحدة، وتأكد من الحساب والاتصال.';}finally{b.disabled=false;}}
 $('hagReload').onclick=load;$('hagDays').onchange=load;$('hagCsv').onclick=exportCsv;$('hagPrint').onclick=()=>window.print();await load();
}
function pauseForAds(){const api=window.HAAndroid;if(!api)return;for(const name of ['adBreak','showRewarded']){const original=api[name];if(typeof original!=='function'||original.__haUsagePause)continue;const wrapped=async function(){activeTick();adShowing=true;try{return await original.apply(this,arguments);}finally{adShowing=false;lastTick=performance.now();}};wrapped.__haUsagePause=true;api[name]=wrapped;}}
addEventListener('ha:native-ready',pauseForAds);pauseForAds();
async function init(){const style=document.createElement('link');style.rel='stylesheet';style.href=new URL('ha-growth.css?v=1',BASE).href;document.head.append(style);speed();toolbar();renderActivity();admin().catch(()=>{});
 const url=safeLink(location.href);if(url)update(s=>{s.recent=[{url,title:title(),at:Date.now()},...s.recent.filter(x=>x.url!==url)].slice(0,12);});
 for(const event of ['pointerdown','keydown','touchstart'])addEventListener(event,()=>lastInput=Date.now(),{passive:true});
 setInterval(()=>{activeTick();if(document.hidden)return;if(Date.now()-lastSent>=30000)sendUsage();},5000);
 document.addEventListener('visibilitychange',()=>{activeTick();if(document.hidden)flush();else{lastTick=performance.now();lastInput=Date.now();sendUsage();renderActivity();}});
 addEventListener('pagehide',()=>{activeTick();stopped=true;flush();});addEventListener('pageshow',()=>{stopped=false;lastTick=performance.now();lastInput=Date.now();});
 addEventListener('ha:account-ready',()=>renderActivity());addEventListener('storage',e=>{if(e.key?.startsWith('ha_activity_'))renderActivity();});
 setTimeout(sendUsage,2500);
}
window.HAGrowth={share,safeLink,challenge,day,state};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
