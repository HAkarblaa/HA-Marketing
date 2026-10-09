/* HA Marketing: bounded, retryable uploads for the service request form, including Android WebView. */
(function(){'use strict';
 const MAX=20*1024*1024;
 const types={jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',gif:'image/gif',avif:'image/avif',bmp:'image/bmp',heic:'image/heic',heif:'image/heif',mp4:'video/mp4',webm:'video/webm',mov:'video/quicktime','3gp':'video/3gpp',avi:'video/x-msvideo',ogv:'video/ogg',mpeg:'video/mpeg',mpg:'video/mpeg',mkv:'video/x-matroska'};
 const prepared=new WeakMap(),uploaded=new WeakMap(),paths=new WeakMap();
 const pause=ms=>new Promise(r=>setTimeout(r,ms));
 const mime=f=>f.type||types[String(f.name||'').split('.').pop().toLowerCase()]||'';
 const error=(message,status,code)=>Object.assign(new Error(message),{status:status||0,code:code||''});
 function uuid(){if(crypto.randomUUID)return crypto.randomUUID();const a=new Uint8Array(16);crypto.getRandomValues(a);a[6]=(a[6]&15)|64;a[8]=(a[8]&63)|128;const h=[...a].map(x=>x.toString(16).padStart(2,'0'));return h.slice(0,4).join('')+'-'+h.slice(4,6).join('')+'-'+h.slice(6,8).join('')+'-'+h.slice(8,10).join('')+'-'+h.slice(10).join('')}
 function validate(f){if(!f.size)throw error('المرفق فارغ أو تعذر قراءته. أعد اختياره.');if(f.size>MAX)throw error('الحد الأعلى لكل مرفق 20MB.');if(!Object.values(types).includes(mime(f)))throw error('صيغة المرفق غير مدعومة. اختر صورة أو فيديو بصيغة شائعة.')}
 function read(f){return new Promise((resolve,reject)=>{const r=new FileReader();let settled=false;const done=(fn,v)=>{if(settled)return;settled=true;clearTimeout(t);fn(v)};const t=setTimeout(()=>{r.abort();done(reject,error('تعذر قراءة المرفق. أعد اختياره.'))},20000);r.onload=()=>done(resolve,r.result);r.onerror=()=>done(reject,error('تعذر قراءة المرفق. أعد اختياره.'));r.onabort=()=>done(reject,error('تعذر قراءة المرفق. أعد اختياره.'));r.readAsArrayBuffer(f)})}
 async function prepare(f){
  if(prepared.has(f))return prepared.get(f);validate(f);const original=new Blob([await read(f)],{type:mime(f)});let result=original;
  if(['image/jpeg','image/png','image/webp','image/avif','image/bmp'].includes(original.type)&&original.size>512*1024){
   const url=URL.createObjectURL(original);try{
    const img=await new Promise((resolve,reject)=>{const img=new Image();const t=setTimeout(()=>{img.onload=img.onerror=null;img.src='';reject(error('تعذر تجهيز الصورة'))},10000);img.onload=()=>{clearTimeout(t);resolve(img)};img.onerror=()=>{clearTimeout(t);reject(error('تعذر تجهيز الصورة'))};img.src=url});
    const scale=Math.min(1,2048/Math.max(img.naturalWidth,img.naturalHeight));const c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.naturalWidth*scale));c.height=Math.max(1,Math.round(img.naturalHeight*scale));const g=c.getContext('2d');if(g){g.drawImage(img,0,0,c.width,c.height);const b=await new Promise(resolve=>{const t=setTimeout(()=>resolve(null),10000);c.toBlob(x=>{clearTimeout(t);resolve(x)},'image/webp',.9)});if(b&&b.size<original.size)result=b}
   }catch(_e){/* Keep the readable original if this device cannot encode/decode the image. */}finally{URL.revokeObjectURL(url)}
  }
  prepared.set(f,result);return result;
 }
 async function session(db,owner,refresh){
  const operation=refresh?db.auth.refreshSession():db.auth.getSession();let timer;
  try{const r=await Promise.race([operation,new Promise((_,reject)=>timer=setTimeout(()=>reject(error('تعذر تأكيد الاتصال بحسابك. حاول مجدداً.')),15000))]);if(r.error)throw error('تعذر تأكيد الاتصال بحسابك. حاول مجدداً.',401);const s=r.data?.session;if(!s?.access_token||s.user?.id!==owner)throw error('تغيّر الحساب أو انتهت جلسته. سجّل الدخول مجدداً.',401);return s.access_token}finally{clearTimeout(timer)}
 }
 function send(url,token,key,body,contentType,timeout,onProgress,upsert){
  return new Promise((resolve,reject)=>{
   const x=new XMLHttpRequest();x.open('POST',url,true);x.timeout=timeout;x.setRequestHeader('Authorization','Bearer '+token);x.setRequestHeader('apikey',key);x.setRequestHeader('Content-Type',contentType);if(upsert)x.setRequestHeader('x-upsert','true');
   x.onload=()=>{let data;try{data=JSON.parse(x.responseText||'{}')}catch(_e){data={}};if(x.status>=200&&x.status<300)resolve(data);else reject(error(data.message||data.error_description||data.error||'تعذر الاتصال بالخادم',x.status,data.code))};
   x.onerror=()=>reject(error('تعذر الاتصال أثناء الإرسال.'));x.ontimeout=()=>reject(error('انتهت مهلة الاتصال أثناء الإرسال.'));x.onabort=()=>reject(error('توقف الاتصال أثناء الإرسال.'));
   if(onProgress)x.upload.onprogress=e=>{if(e.lengthComputable)onProgress(Math.min(100,Math.round(e.loaded/e.total*100)))};
   try{x.send(body)}catch(e){reject(error(e.message||'تعذر الاتصال أثناء الإرسال.'))}
  });
 }
 async function retry(db,owner,run,onRetry){
  let last,refresh=false;
  for(let attempt=0;attempt<3;attempt++){
   try{const token=await session(db,owner,refresh);return await run(token)}catch(e){last=e;if(e.status===401&&!refresh){refresh=true}else if(e.status&&e.status<500&&![408,429].includes(e.status))throw e;if(attempt<2){onRetry?.(attempt+2);await pause(attempt?2500:900)}}
  }
  throw last;
 }
 async function upload(db,config,owner,requestKey,f,index,onProgress,onRetry){
  const existing=uploaded.get(f);if(existing&&existing.owner===owner)return existing.url;
  const blob=await prepare(f);const ext=Object.keys(types).find(k=>types[k]===blob.type)||'bin';let item=paths.get(f);if(!item||item.owner!==owner||item.requestKey!==requestKey){item={owner,requestKey,id:uuid()};paths.set(f,item)}const path=owner+'/'+requestKey+'/'+item.id+'.'+ext;
  const objectUrl=config.url+'/storage/v1/object/service-attachments/'+path.split('/').map(encodeURIComponent).join('/');
  await retry(db,owner,token=>send(objectUrl,token,config.key,blob,blob.type,blob.size>6*1024*1024?180000:90000,onProgress,true),onRetry);
  const publicUrl=config.url+'/storage/v1/object/public/service-attachments/'+path;uploaded.set(f,{owner,url:publicUrl});return publicUrl;
 }
 async function submit(db,config,owner,requestKey,payload,onRetry){
  const data=await retry(db,owner,token=>send(config.url+'/rest/v1/rpc/submit_service_order_once',token,config.key,JSON.stringify({p_request_key:requestKey,p_payload:payload}),'application/json',30000,null,false),onRetry);
  if(!data?.ok||!Number.isSafeInteger(Number(data.id))||Number(data.id)<=0)throw error('تعذر تأكيد إرسال الطلب؛ أعد المحاولة.');return data;
 }
 function message(e,stage){
  if(e.status===401)return 'انتهت جلسة الحساب أو تعذر تجديدها. سجّل الدخول مجدداً، ومعلومات الطلب محفوظة.';
  if(e.status===403||/row.level|policy|bucket|PGRST202|column|schema|permission/i.test(String(e.message)+' '+e.code))return 'تعذر الوصول إلى المرفقات أو إرسال الطلب. تواصل مع إدارة التطبيق للتحقق من إعدادات الطلبات.';
  if(e.status===413)return 'حجم المرفق أكبر من الحد المسموح. اختر ملفاً أصغر من 20MB.';
  if(e.status>=400&&e.status<500&&![408,429].includes(e.status))return e.message||'تعذر قبول الطلب. راجع المعلومات وحاول مجدداً.';
  if(stage==='upload')return 'تعذر رفع المرفق بعد إعادة المحاولة. معلوماتك والمرفقات ما زالت محفوظة هنا. أعد المحاولة، أو اختر إرسال الطلب بدون مرفقات.';
  if(stage==='submit')return 'تعذر تأكيد إرسال الطلب بسبب الاتصال. اضغط إعادة المحاولة للتحقق وإكمال الإرسال؛ لن يتكرر الطلب.';
  return e.message||'تعذر الإرسال. أعد المحاولة.';
 }
 window.HAServiceUpload={uuid,mime,validate,upload,submit,message};
})();
