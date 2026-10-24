(function(){'use strict';if(window.HAGamePolish)return;
const page=location.pathname.split('/').pop(),key='ha_game_settings_v3_'+page;
let adapter=null,box=null,context=null,master=null;
function data(){try{return JSON.parse(localStorage.getItem(key)||'{}')}catch(_){return {}}}
function get(name,fallback){return data()[name]??fallback}
function set(name,value){try{localStorage.setItem(key,JSON.stringify({...data(),[name]:value}))}catch(_){}}
function buzz(){if(get('vibration',false)&&navigator.vibrate)navigator.vibrate(14)}
function tone(type='tick'){if(!get('sound',true))return;try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;if(!context){context=new AC();master=context.createGain();master.gain.value=.035;master.connect(context.destination)}if(context.state==='suspended')context.resume().catch(()=>{});const osc=context.createOscillator(),gain=context.createGain(),t=context.currentTime;osc.frequency.value=({lose:150,win:780,coin:920,jump:520,tick:620})[type]||620;gain.gain.setValueAtTime(1,t);gain.gain.exponentialRampToValueAtTime(.001,t+.13);osc.connect(gain);gain.connect(master);osc.start(t);osc.stop(t+.14);osc.onended=()=>{osc.disconnect();gain.disconnect()};}catch(_){}}
function button(text,fn){const b=document.createElement('button');b.type='button';b.textContent=text;b.onclick=()=>{buzz();fn()};return b}
function refresh(){if(!box||!adapter)return;const best=box.querySelector('[data-best]');if(best)best.textContent=(adapter.bestLabel||'أفضل نتيجة')+': '+adapter.best();for(const select of box.querySelectorAll('select[data-extra]')){const extra=adapter.extras?.[Number(select.dataset.extra)];if(extra)for(const option of select.options){const item=extra.options.find(x=>String(x.value)===option.value);option.disabled=!!item?.locked?.();}}const p=box.querySelector('[data-pause]');if(p)p.textContent=adapter.paused()?'▶ متابعة':'Ⅱ إيقاف';}
function mount(){if(box||!adapter||!document.body)return;box=document.createElement('section');box.className='ha-game-polish';box.setAttribute('aria-label','إعدادات اللعبة');
 const row=document.createElement('div');row.className='hgp-row';const back=document.createElement('a');back.href='entertainment.html';back.textContent='‹ الترفيه';row.append(back);
 const best=document.createElement('strong');best.dataset.best='';row.append(best);
 if(adapter.pause){const pause=button('Ⅱ إيقاف',()=>{adapter.pause(!adapter.paused());refresh()});pause.dataset.pause='';row.append(pause);}
 row.append(button('↻ إعادة',()=>{if(window.HARewardedGames?.active)return;if(confirm('تبدأ جولة جديدة؟'))adapter.restart();refresh()}));
 const sound=button('',()=>{set('sound',!get('sound',true));sound.textContent=get('sound',true)?'🔊 الصوت':'🔇 صامت';if(get('sound',true))tone()});sound.textContent=get('sound',true)?'🔊 الصوت':'🔇 صامت';row.append(sound);
 const vibration=button('',()=>{set('vibration',!get('vibration',false));vibration.textContent=get('vibration',false)?'الاهتزاز: شغال':'الاهتزاز: مطفأ';buzz()});vibration.textContent=get('vibration',false)?'الاهتزاز: شغال':'الاهتزاز: مطفأ';row.append(vibration);
 row.append(button('⛶ ملء الشاشة',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch(_){notice.textContent='ملء الشاشة غير متاح بهذا المتصفح.'}}));box.append(row);
 const settings=document.createElement('div');settings.className='hgp-row';(adapter.extras||[]).forEach((extra,index)=>{const label=document.createElement('label');label.textContent=extra.label+' ';const select=document.createElement('select');select.dataset.extra=index;for(const item of extra.options){const option=document.createElement('option');option.value=item.value;option.textContent=item.label;option.disabled=!!item.locked?.();select.append(option)}select.value=extra.get();select.onchange=()=>{extra.set(select.value);notice.textContent='تم حفظ الإعداد.';refresh()};label.append(select);settings.append(label)});box.append(settings);
 const notice=document.createElement('p');notice.className='hgp-note';notice.textContent=adapter.help||'التقدّم والإعدادات محفوظة على هذا الجهاز. إعلانات الاستمرار اختيارية.';notice.setAttribute('role','status');box.append(notice);
 (adapter.host?.()||document.querySelector('main,.wrap,.app')||document.body).prepend(box);refresh();}
function register(value){adapter=value;if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();}
window.HAGamePolish={get,set,tone,buzz,register,refresh};
document.addEventListener('click',e=>{if(e.target.closest?.('button'))Promise.resolve().then(refresh);});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&adapter?.pause){adapter.pause(true);refresh();}});addEventListener('blur',()=>{if(adapter?.pause){adapter.pause(true);refresh();}});
})();
