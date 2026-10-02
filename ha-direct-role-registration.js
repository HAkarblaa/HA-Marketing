(function(){
'use strict';

const SB_URL='https://ubayrhtshgtgggxprrek.supabase.co';
const SB_KEY='sb_publishable_p3108yoDkdJTLqVXhkvmBg_KVqe-1ll';
const STORAGE_KEY='ha-marketing-auth';

const body=document.body;
const role=body.dataset.role||'';
const back=body.dataset.back||'index.html';
const approvedHref=body.dataset.approvedHref||'index.html';
const roleLabel=body.dataset.roleLabel||'طلب انضمام';

const db=supabase.createClient(SB_URL,SB_KEY,{
  auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:STORAGE_KEY}
});

const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));

let me=null;

async function auth(){
  const {data:{session}}=await db.auth.getSession();
  if(!session){
    const next=location.pathname.split('/').pop()+location.search;
    location.href='login.html?next='+encodeURIComponent(next);
    return null;
  }
  me=session.user;
  return me;
}

async function prefill(){
  if(!me)return;
  try{
    const {data:p}=await db.from('profiles')
      .select('full_name,phone,governorate')
      .eq('id',me.id)
      .maybeSingle();
    if(p){
      if(!$('regName').value)$('regName').value=p.full_name||'';
      if(!$('regPhone').value)$('regPhone').value=p.phone||'';
      if(!$('regGov').value)$('regGov').value=p.governorate||'';
    }
  }catch(_e){}
}

function statusLabel(s){
  return s==='approved'?'✅ مقبول':
         s==='rejected'?'❌ مرفوض':
         s==='suspended'?'⏸️ موقوف':
         '⏳ قيد المراجعة';
}

async function loadHistory(){
  const box=$('regHistory');
  if(!me||!box)return;
  box.textContent='جاري التحميل...';

  const {data,error}=await db.from('marketplace_applications')
    .select('id,role_type,status,details,admin_note,created_at')
    .eq('user_id',me.id)
    .eq('role_type',role)
    .order('created_at',{ascending:false});

  if(error){
    box.textContent='تعذر تحميل حالة الطلب: '+error.message;
    return;
  }

  const arr=data||[];
  if(!arr.length){
    box.innerHTML='<div class="ha-reg-note">ما عندك طلب سابق بهذا النوع.</div>';
    return;
  }

  box.innerHTML=arr.map(x=>`
    <div class="ha-reg-history-item">
      <b>${esc(roleLabel)}</b>
      <span class="ha-reg-badge">${statusLabel(x.status)}</span>
      ${x.admin_note?`<div class="ha-reg-note">${esc(x.admin_note)}</div>`:''}
      ${x.status==='approved'?`<div style="margin-top:8px"><a class="ha-reg-home" href="${esc(approvedHref)}">فتح لوحة العمل</a></div>`:''}
    </div>
  `).join('');
}

async function submit(){
  if(!me && !(await auth()))return;

  const fullName=$('regName').value.trim();
  const phone=$('regPhone').value.trim();
  const governorate=$('regGov').value.trim();
  const address=$('regAddress').value.trim();
  const details=$('regDetails').value.trim();

  if(!fullName)return alert('اكتب الاسم');
  if(!phone)return alert('اكتب رقم الهاتف');
  if(!governorate)return alert('اكتب المحافظة');

  const status=$('regStatus');
  const btn=$('regSubmit');
  btn.disabled=true;
  status.className='ha-reg-status';
  status.textContent='جاري إرسال طلب التسجيل...';

  const {error}=await db.rpc('request_marketplace_role',{
    p_role:role,
    p_display_name:fullName,
    p_phone:phone,
    p_governorate:governorate,
    p_address:address||null,
    p_details:details||null,
    p_vehicle_type:null,
    p_vehicle_model:null,
    p_vehicle_color:null,
    p_plate_number:null
  });

  btn.disabled=false;

  if(error){
    status.className='ha-reg-status err';
    status.textContent='تعذر إرسال الطلب: '+error.message;
    return;
  }

  status.className='ha-reg-status ok';
  status.textContent='✅ تم إرسال طلب التسجيل مباشرة للإدارة وهو الآن قيد المراجعة.';
  await loadHistory();
}

async function init(){
  if(!(await auth()))return;
  await prefill();
  await loadHistory();
}

$('regBack')?.setAttribute('href',back);
$('regSubmit')?.addEventListener('click',submit);

init();
})();