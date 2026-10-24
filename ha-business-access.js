(()=>{
'use strict';
const $=id=>document.getElementById(id),msg=$('message'),adminPage=document.body.dataset.page==='admin';let db;
function message(t){msg.textContent=t;}
async function rpc(name,args){const r=await db.rpc(name,args);if(r.error)throw r.error;return r.data;}
const names={none:'لم يُرسل طلب بعد',pending:'بانتظار موافقة الأدمن الرئيسي',approved:'مفعّل',rejected:'تم رفض الطلب',revoked:'تم إيقاف التفعيل'};
async function status(){const r=await rpc('ha_business_status_v1');$('requestForm').hidden=true;$('openAccounting').hidden=true;
 if(!r.eligible){message('المحاسبة متاحة لأصحاب المحلات الموافق عليهم فقط.');return;}
 if(r.allowed){message('برنامج المحاسبة مفعّل لحسابك.');$('openAccounting').hidden=false;return;}
 message(names[r.status]||'غير مفعّل');$('requestForm').hidden=r.status==='pending';
}
async function list(){const rows=await rpc('ha_business_requests_v1'),host=$('requests');host.replaceChildren();for(const r of rows){const item=document.createElement('section');item.className='ha-business-request';const title=document.createElement('h3'),detail=document.createElement('p');title.textContent=r.business_name;detail.textContent=[r.email,names[r.status],new Date(r.requested_at).toLocaleDateString('ar-IQ')].join(' • ');item.append(title,detail);for(const [label,value]of [['موافقة','approved'],['رفض','rejected'],['إيقاف','revoked']]){const b=document.createElement('button');b.textContent=label;if(value!=='approved')b.className='danger';b.disabled=r.status===value;b.onclick=async()=>{if(value==='revoked'&&!confirm('إيقاف المحاسبة لهذا الحساب؟ البيانات تبقى محفوظة.'))return;item.querySelectorAll('button').forEach(x=>x.disabled=true);try{await rpc('ha_business_review_v1',{p_user_id:r.user_id,p_status:value});await list();message('تم حفظ القرار.');}catch(_){message('تعذر حفظ القرار. حاول مجدداً.');await list().catch(()=>{});}};item.append(b);}host.append(item);}if(!rows.length)host.textContent='لا توجد طلبات تفعيل بعد.';}
async function init(){try{message('جارٍ التحقق…');db=await window.HA_AccountGate.getClient();const u=await db.auth.getUser();if(u.error||!u.data?.user)throw Error('login');if(adminPage){await list();message('إدارة تفعيل المحاسبة لأصحاب المحلات.');}else await status();}catch(_){message('تعذر التحقق. تأكد من اتصال الإنترنت وتشغيل ملف إعداد قاعدة البيانات في مشروع HA Marketing.');}}
$('refresh').onclick=init;
if(!adminPage)$('requestForm').onsubmit=async e=>{e.preventDefault();const b=$('requestButton');b.disabled=true;try{await rpc('ha_business_request_v1',{p_business_name:$('businessName').value.trim()});await status();}catch(_){message('تعذر إرسال الطلب. تأكد من اعتماد حسابك كصاحب محل واتصال الإنترنت.');}finally{b.disabled=false;}};
init();
})();
