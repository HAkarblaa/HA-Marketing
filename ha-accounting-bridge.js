(()=>{
'use strict';
const banner=document.getElementById('cloudStatus'),lock=document.getElementById('workspaceLock');let db,user,key,revision=0,saving=false,dirty=false,conflict=false,stopped=false,refreshing=false,timer;
function report(t){banner.textContent=t;}
function stop(t){stopped=true;clearTimeout(timer);document.documentElement.classList.remove('accounting-ready');lock.hidden=false;lock.querySelector('p').textContent=t;}
async function rpc(name,args){const r=await db.rpc(name,args);if(r.error)throw r.error;return r.data;}
function pending(){return 'ha-market-accounting-pending:'+user.id;}
function draft(){try{return JSON.parse(localStorage.getItem(pending())||'null')}catch(_){return null;}}
function queue(){if(conflict||stopped||!user)return;dirty=true;try{localStorage.setItem(pending(),JSON.stringify({revision,data:JSON.parse(localStorage.getItem(key))}));}catch(_){stop('تعذر حفظ النسخة المحلية. نزّل نسخة احتياطية قبل إغلاق الصفحة.');return;}report(navigator.onLine?'جارٍ حفظ التغييرات…':'محفوظ على هذا الجهاز • بانتظار الإنترنت');clearTimeout(timer);timer=setTimeout(flush,700);}
async function flush(){if(saving||refreshing||stopped||!dirty||conflict||!navigator.onLine)return;saving=true;dirty=false;try{
 const current=await db.auth.getUser();if(current.error||current.data?.user?.id!==user.id){stop('تغيّر الحساب. ارجع إلى التسوق وافتح المحاسبة مجدداً.');return;}
 const data=JSON.parse(localStorage.getItem(key));revision=await rpc('ha_business_save_v1',{p_data:data,p_revision:revision});
 if(dirty){localStorage.setItem(pending(),JSON.stringify({revision,data:JSON.parse(localStorage.getItem(key))}));}else localStorage.removeItem(pending());
 report(dirty?'جارٍ حفظ بقية التغييرات…':'تم الحفظ في حسابك');if(!dirty)setTimeout(refreshCatalog,0);
 }catch(e){dirty=true;if(e.code==='40001'||String(e.message).includes('workspace_conflict')){conflict=true;stop('تغيّرت البيانات من جهاز أو نافذة ثانية. نسختك المحلية محفوظة؛ نزّلها من الزر أدناه قبل إعادة الفتح، ولا تستبدل البيانات تلقائياً.');}
 else if(['shop_stock_changed_or_insufficient','shop_product_unavailable','shop_stock_requires_whole_units','invalid_stock_movement'].some(t=>String(e.message).includes(t))){conflict=true;stop('تغيّر رصيد منتج بالتسوق أو الكمية غير صالحة. العملية لم تُرحّل للسحابة. نسختك المحلية محفوظة؛ نزّلها ثم أعد فتح النسخة السحابية قبل إعادة المحاولة.');}
 else if(e.code==='42501')stop('لم يعد الحساب مخوّلاً باستخدام المحاسبة. راجع الأدمن الرئيسي.');
 else report('التغييرات محفوظة محلياً؛ تعذر الحفظ السحابي، سيُعاد عند عودة الاتصال.');
 }finally{saving=false;if(dirty&&!conflict&&!stopped&&navigator.onLine)timer=setTimeout(flush,10000);}}
async function check(){if(!user)return;try{const current=await db.auth.getUser();if(current.error||current.data?.user?.id!==user.id){stop('انتهت جلسة الحساب. ارجع إلى التسوق وسجّل دخولك.');return;}const a=await rpc('ha_business_status_v1');if(!a.allowed)stop('تم إيقاف الوصول إلى المحاسبة. البيانات محفوظة.');}catch(_){report('تعذر التحقق الآن؛ التغييرات المحلية تبقى محفوظة.');}}
document.getElementById('downloadLocal').onclick=()=>{const raw=key&&localStorage.getItem(key);if(!raw)return;const blob=new Blob([JSON.stringify({app:'HA Accounting',version:1,exportedAt:new Date().toISOString(),data:JSON.parse(raw)},null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='HA-Accounting-local-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),5000);};
document.getElementById('useCloud').onclick=()=>{if(!user||!key||!confirm('هل نزّلت نسختك المحلية؟ سيتم حفظها محلياً كنسخة استرجاع وفتح بيانات السحابة بدلاً عنها.'))return;localStorage.setItem(key+':recovery',localStorage.getItem(key)||'{}');localStorage.removeItem(pending());location.reload();};
const photoCache=new Map(),photoVersions=new Map();window.HAShopProductImages=photoCache;let photosBusy=false,photoTimer;
function safePhoto(raw){try{if(/^data:image\/(?:png|jpe?g|webp|gif);base64,/i.test(raw))return raw;const u=new URL(raw);if(['http:','https:'].includes(u.protocol))return u.href;}catch(_){}return '';}
function paintPhotos(){for(const el of document.querySelectorAll('[data-shop-image-id]')){const raw=photoCache.get(el.dataset.shopImageId),url=raw&&safePhoto(raw);if(url){el.hidden=false;if(el.getAttribute('src')!==url)el.src=url;}}}
async function loadPhotos(){if(photosBusy||!user||stopped||!navigator.onLine)return;const ids=[...new Set([...document.querySelectorAll('[data-shop-image-id]')].map(el=>el.dataset.shopImageId).filter(id=>id&&!photoCache.has(id)))].slice(0,32);if(!ids.length){paintPhotos();return;}photosBusy=true;let fetched=false;try{const photos=await rpc('ha_business_product_images_v1',{p_ids:ids});fetched=true;for(const id of ids)photoCache.set(id,'');for(const [id,raw]of Object.entries(photos||{}))photoCache.set(id,safePhoto(String(raw||'')));paintPhotos();}catch(_){}finally{photosBusy=false;if(fetched&&ids.length===32)schedulePhotos();}}
function schedulePhotos(){clearTimeout(photoTimer);photoTimer=setTimeout(loadPhotos,80);}
function photoCatalog(data){for(const p of data?.products||[]){if(!p.shopInlineImage)continue;const id=String(p.shopProductId),v=String(p.shopSourceUpdatedAt||'');if(photoVersions.get(id)!==v){photoVersions.set(id,v);photoCache.delete(id);}}schedulePhotos();}
async function refreshCatalog(){const note=document.getElementById('catalogStatus');if(!user||!window.HAAccountingWorkspace||stopped||conflict||!navigator.onLine||saving||refreshing)return;if(dirty){flush();return;}if(window.HAAccountingWorkspace.isBusy()){note.textContent='أكمل العملية المفتوحة ثم حدّث المنتجات حتى لا تضيع إدخالاتك.';return;}refreshing=true;try{const snapshot=await rpc('ha_business_load_v1');if(dirty||window.HAAccountingWorkspace.isBusy()){note.textContent='توجد بيانات أحدث؛ ستظهر بعد انتهاء العملية الحالية.';return;}window.HAAccountingWorkspace.apply(snapshot.data);photoCatalog(snapshot.data);revision=Number(snapshot.revision);note.textContent='تمت مطابقة المنتجات مع التسوق • '+new Date().toLocaleTimeString('ar-IQ');}catch(e){if(e.code==='42501')stop('لم يعد الحساب مخوّلاً باستخدام المحاسبة.');else note.textContent='تعذر تحديث المنتجات الآن. التغييرات المحلية محفوظة.';}finally{refreshing=false;if(dirty&&!stopped&&!conflict)flush();}}
document.getElementById('refreshCatalog').onclick=refreshCatalog;
setInterval(()=>{if(!document.hidden)refreshCatalog();},30000);
async function boot(){try{
 db=await window.HA_AccountGate.getClient();const u=await db.auth.getUser();if(u.error||!u.data?.user||u.data.user.is_anonymous)throw Error('login');user=u.data.user;
 const access=await rpc('ha_business_status_v1');if(!access.allowed){stop('المحاسبة غير مفعّلة لهذا الحساب. أرسل طلباً وانتظر موافقة الأدمن الرئيسي.');return;}
 const cloud=await rpc('ha_business_load_v1');revision=Number(cloud.revision);key='ha-market-accounting-v1:'+user.id;window.HA_ACCOUNTING_KEY=key;
 const waiting=draft();if(waiting&&waiting.revision!==revision){stop('توجد تغييرات محلية غير متزامنة، والنسخة السحابية تغيّرت. نزّل النسخة المحلية قبل المتابعة؛ لم يتم استبدال أي بيانات.');return;}
 if(waiting){localStorage.setItem(key,JSON.stringify(waiting.data));dirty=true;}else localStorage.setItem(key,JSON.stringify(cloud.data||{company:{name:access.business_name||'شركتي',currency:'د.ع'},accounts:[],entries:[],demoOptOut:true}));
 const s=document.createElement('script');s.src='ha-accounting-engine.js?v=shop-sync1';s.onload=()=>{document.documentElement.classList.add('accounting-ready');lock.hidden=true;report('المحاسبة مفعّلة • حساب مستقل');photoCatalog(cloud.data);new MutationObserver(schedulePhotos).observe(document.getElementById('view'),{childList:true,subtree:true});if(dirty)flush();};s.onerror=()=>stop('تعذر تحميل واجهة المحاسبة. أعد فتح الصفحة.');document.body.append(s);
 addEventListener('ha-accounting-save',queue);addEventListener('online',()=>{check();flush();});addEventListener('offline',()=>report('بدون إنترنت • تُحفظ التغييرات على هذا الجهاز'));
 addEventListener('beforeunload',e=>{if(dirty||saving){e.preventDefault();e.returnValue='';}});
 setInterval(()=>{if(navigator.onLine)check();},30000);
 db.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT'||(session?.user?.id&&session.user.id!==user.id))stop('تغيّر الحساب. أعد فتح المحاسبة من التسوق.');});
 }catch(_){stop('يلزم الإنترنت للتحقق من موافقة الإدارة عند فتح المحاسبة. تأكد أيضاً من تنفيذ ملف إعداد قاعدة البيانات.');}}
boot();
})();
