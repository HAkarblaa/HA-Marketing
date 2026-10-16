/* Separate printable questions and evidence-backed model answers. */
async function examSession(){
 if(!window.__examAuthClient)window.__examAuthClient=supabase.createClient(SUPA_URL,SUPA_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'ha-marketing-auth'}});
 const {data,error}=await window.__examAuthClient.auth.getSession();
 if(error||!data.session||data.session.user?.is_anonymous){location.href='login.html?next=study-exam.html';throw Error('سجّل دخولك لإنشاء الأسئلة.');}return data.session;
}
(function(){
let exporting=false;
async function savePdf(answers){
 if(!lastExam.length||exporting)return;exporting=true;
 const buttons=[...document.querySelectorAll('#resultCard button')];buttons.forEach(b=>b.disabled=true);
 let host;
 try{
  if(!window.jspdf||!window.html2canvas)throw Error('تعذر تحميل أداة PDF. أعد فتح الصفحة.');
  const pdf=new jspdf.jsPDF({unit:'mm',format:'a4'});const title=answers?'نموذج الإجابة':'ورقة الأسئلة';
  host=document.createElement('div');host.dir='rtl';host.style.cssText='position:absolute;left:-10000px;top:0;width:720px;background:white;color:#15253b;font:18px/1.8 Tahoma,Arial;padding:22px;box-sizing:border-box';document.body.append(host);
  let y=12,first=true;
  const blocks=[`<h1 style="font-size:26px;margin:0">${title} — HA Marketing</h1><p>المادة: ${escapeHtml([...sourceFiles.files].map(f=>f.name).join('، '))}</p><p>${answers?'أجوبة مولّدة من المادة مع الاقتباس الداعم؛ راجعها قبل اعتمادها.':'الاسم: ....................................    التاريخ: ................'}</p>`,...lastExam.map(q=>`<h3 style="font-size:20px;margin:0">${q.number}. ${escapeHtml(q.question)}</h3>${!answers&&q.options.length?'<ol type="A">'+q.options.map(o=>'<li>'+escapeHtml(o)+'</li>').join('')+'</ol>':''}${answers?'<p><b>الجواب النموذجي:</b> '+escapeHtml(q.answer)+'</p><p>'+escapeHtml(q.explanation)+'</p><p style="background:#f1f6fa;padding:10px"><b>من المادة '+(q.page?'— صفحة '+escapeHtml(q.page):'')+':</b> '+escapeHtml(q.source_quote)+'</p>':'<div style="height:100px;border-bottom:1px dotted #aaa;margin-bottom:12px"></div>'}`)];
  for(const html of blocks){
   host.innerHTML=html;const canvas=await html2canvas(host,{scale:1.5,backgroundColor:'#ffffff',logging:false});
   const totalH=canvas.height*186/canvas.width;
   if(y+totalH>283&&!first){pdf.addPage();y=12;}first=false;
   let offset=0;
   while(offset<canvas.height){
    const maxPx=Math.max(1,Math.floor((283-y)*canvas.width/186));const height=Math.min(maxPx,canvas.height-offset);
    const part=document.createElement('canvas');part.width=canvas.width;part.height=height;part.getContext('2d').drawImage(canvas,0,offset,canvas.width,height,0,0,canvas.width,height);
    pdf.addImage(part.toDataURL('image/jpeg',.94),'JPEG',12,y,186,height*186/canvas.width);offset+=height;y+=height*186/canvas.width;
    if(offset<canvas.height){pdf.addPage();y=12;}
   }
   y+=5;canvas.width=canvas.height=0;
  }
  pdf.save((answers?'أجوبة-نموذجية':'أسئلة')+'-HA-Marketing.pdf');
 }catch(e){alert(e.message||'تعذر إنشاء PDF');}finally{host?.remove();exporting=false;buttons.forEach(b=>b.disabled=false);}
}
downloadBtn.onclick=()=>savePdf(false);
const answerPdf=document.createElement('button');answerPdf.type='button';answerPdf.className='secondary';answerPdf.textContent='تنزيل الأجوبة النموذجية PDF';answerPdf.onclick=()=>savePdf(true);downloadBtn.after(answerPdf);
})();
