(()=>{'use strict';
const input=document.getElementById('printFile'),button=document.getElementById('printButton'),preview=document.getElementById('preview'),status=document.getElementById('status');let revision=0,loading=null;
function message(s){status.textContent=s;}
async function addPage(data,number,token){if(token!==revision)return;const figure=document.createElement('figure');figure.className='page';const image=new Image();image.alt='صفحة '+number;image.src=data;await image.decode();if(token!==revision)return;const caption=document.createElement('figcaption');caption.textContent='صفحة '+number;figure.append(image,caption);preview.append(figure);}
input.addEventListener('change',async()=>{
 const token=++revision;button.disabled=true;preview.replaceChildren();if(loading){loading.destroy();loading=null;}
 const file=input.files[0];if(!file){message('اختار صورة أو PDF لعرض المعاينة.');return;}if(file.size>25*1024*1024){message('اختار ملفًا أقل من 25 ميغابايت.');return;}
 let url=null,pdf=null,task=null;try{
 message('جاري تجهيز المعاينة…');const signature=new Uint8Array(await file.slice(0,5).arrayBuffer());if(token!==revision)return;
 const isPdf=signature.length===5&&signature.every((v,i)=>v===[37,80,68,70,45][i]);
 if(isPdf){
  if(!window.pdfjsLib)throw Error('تعذر تحميل عارض PDF. تأكد من رفع مجلد vendor ثم أعد فتح الصفحة.');
  pdfjsLib.GlobalWorkerOptions.workerSrc='vendor/pdf.worker.min.js?v=3.11.174';
  task=pdfjsLib.getDocument({data:new Uint8Array(await file.arrayBuffer()),isEvalSupported:false});loading=task;pdf=await task.promise;
  if(token!==revision)return;if(pdf.numPages>30)throw Error('الملف أكثر من 30 صفحة. اختر جزءًا منه للطباعة.');
  for(let n=1;n<=pdf.numPages;n++){
   if(token!==revision)return;message('تجهيز صفحة '+n+' من '+pdf.numPages+'…');const page=await pdf.getPage(n),base=page.getViewport({scale:1});
   const scale=Math.min(1.8,1200/base.width,2400/base.height),viewport=page.getViewport({scale});
   const canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
   await page.render({canvasContext:canvas.getContext('2d'),viewport,background:'rgb(255,255,255)'}).promise;
   await addPage(canvas.toDataURL('image/jpeg',.94),n,token);canvas.width=canvas.height=0;page.cleanup();
  }
 }else{
  if(!/^image\/(jpeg|png|webp)$/.test(file.type)&&! /\.(jpe?g|png|webp)$/i.test(file.name))throw Error('اختر صورة JPG أو PNG أو WebP، أو ملف PDF.');
  url=URL.createObjectURL(file);const source=new Image();source.src=url;await source.decode();if(token!==revision)return;
  const scale=Math.min(1,1800/Math.max(source.naturalWidth,source.naturalHeight)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(source.naturalWidth*scale));canvas.height=Math.max(1,Math.round(source.naturalHeight*scale));
  const ctx=canvas.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(source,0,0,canvas.width,canvas.height);await addPage(canvas.toDataURL('image/jpeg',.94),1,token);canvas.width=canvas.height=0;
 }
 if(token===revision){button.disabled=false;message('المعاينة جاهزة. اضغط طباعة.');}
 }catch(e){if(token===revision){preview.replaceChildren();message(e.name==='PasswordException'?'الملف محمي بكلمة مرور. اختر نسخة مفتوحة للطباعة.':(e.message||'تعذر فتح الملف.'));}}
 finally{if(url)URL.revokeObjectURL(url);if(pdf)await pdf.destroy();else if(task)await task.destroy();if(loading===task)loading=null;}
});
button.addEventListener('click',()=>{if(button.disabled||!preview.children.length)return;try{
 if(window.HAAndroid&&typeof HAAndroid.print==='function')HAAndroid.print();
 else if(window.HAPort&&typeof HAPort.postMessage==='function')HAPort.postMessage(JSON.stringify({id:'print-'+Date.now(),action:'print'}));
 else window.print();
 }catch(e){message('تعذر فتح الطباعة. جرّب الصفحة من متصفح الهاتف.');}});
})();
