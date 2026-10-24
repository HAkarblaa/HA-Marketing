/* A continuation is granted only after the native SDK reports earned=true. */
(function(){
'use strict';if(window.HARewardedGames)return;
let active=false;
function supported(){return window.HAAndroid?.adsApiVersion>=2&&typeof window.HAAndroid.showRewarded==='function';}
function offer(options){
 if(active)return;
 if(!supported()&&!options.result){options.restart();return;}
 active=true;let settled=false,busy=false;
 const box=document.createElement('dialog');box.dir='rtl';box.style.cssText='border:0;border-radius:22px;padding:24px;width:min(90vw,400px);background:#fff;color:#16324f;text-align:center;font:17px/1.7 Tahoma;z-index:2147483647';
 const title=document.createElement('h2');title.textContent=options.result?'انتهت الجولة':'محاولة إضافية؟';
 const note=document.createElement('p');note.textContent=options.message||'شاهد إعلاناً لتحصل على محاولة واحدة وتكمل من نفس المستوى.';
 const status=document.createElement('p');status.setAttribute('role','status');
 function button(label,color){const b=document.createElement('button');b.type='button';b.textContent=label;b.style.cssText='display:block;width:100%;margin:10px 0;padding:13px;border:0;border-radius:12px;font:inherit;background:'+color+';color:#fff';box.appendChild(b);return b;}
 box.append(title);if(options.result){const summary=document.createElement('p');summary.style.cssText='font-weight:bold;font-size:22px';summary.textContent=options.result.label+': '+options.result.score;box.append(summary);const best=document.createElement('p');best.textContent='أفضل تقدّم / رصيد: '+options.result.best;box.append(best);}if(supported()&&typeof options.continue==='function')box.append(note);box.append(status);
 const watch=button('شاهد إعلان وكمل','#087f82'),restart=button(options.restartLabel||'ابدأ من جديد','#536779');watch.hidden=!supported()||typeof options.continue!=='function';watch.style.display=watch.hidden?'none':'block';
 function settle(earned){if(settled)return;settled=true;active=false;box.close();box.remove();window.HAGamePolish?.refresh();(earned?options.continue:options.restart)();}
 restart.onclick=()=>{if(!busy)settle(false);};
 box.addEventListener('cancel',e=>{e.preventDefault();if(!busy)settle(false);});
 watch.onclick=async()=>{
  if(busy||settled||typeof options.continue!=='function')return;busy=true;watch.disabled=restart.disabled=true;status.textContent='جارٍ طلب الإعلان…';
  try{const r=await window.HAAndroid.showRewarded();if(settled)return;if(r?.earned===true){settle(true);return;}status.textContent=r?.status==='not_ready'||r?.status==='unavailable'?'الإعلان غير متوفر حالياً؛ جرّب بعد قليل أو ابدأ من جديد.':'لم تُكتسب المكافأة؛ أكمل الإعلان للحصول على المحاولة.';}
  catch(_){status.textContent='تعذر عرض الإعلان. يمكنك المحاولة لاحقاً أو البدء من جديد.';}
  finally{busy=false;if(!settled)watch.disabled=restart.disabled=false;}
 };
 document.body.appendChild(box);box.showModal();
}
window.HARewardedGames={supported,offer,get active(){return active;}};
})();
