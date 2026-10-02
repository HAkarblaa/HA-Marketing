(function(){
'use strict';
const db=supabase.createClient(
  'https://ubayrhtshgtgggxprrek.supabase.co',
  'sb_publishable_p3108yoDkdJTLqVXhkvmBg_KVqe-1ll',
  {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'ha-marketing-auth'}}
);
const $=id=>document.getElementById(id);
const GOV=['بغداد','البصرة','نينوى','أربيل','النجف','كربلاء','ذي قار','الأنبار','ديالى','كركوك','صلاح الدين','واسط','ميسان','المثنى','القادسية','بابل','دهوك','السليمانية','حلبجة'];
let me=null,lat=null,lng=null,imageData=null;

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function statusAr(s){return s==='approved'?'✅ مقبول':s==='rejected'?'❌ مرفوض':s==='suspended'?'⏸️ موقوف':'⏳ قيد المراجعة'}

async function compressImage(file){
  if(!file)return null;
  const url=URL.createObjectURL(file);
  try{
    const img=await new Promise((resolve,reject)=>{
      const x=new Image();x.onload=()=>resolve(x);x.onerror=reject;x.src=url;
    });
    const max=1000,scale=Math.min(1,max/Math.max(img.width,img.height));
    const c=document.createElement('canvas');
    c.width=Math.max(1,Math.round(img.width*scale));
    c.height=Math.max(1,Math.round(img.height*scale));
    c.getContext('2d').drawImage(img,0,0,c.width,c.height);
    return c.toDataURL('image/jpeg',.78);
  }finally{URL.revokeObjectURL(url)}
}

async function init(){
  $('storeGovernorate').innerHTML='<option value="">اختر المحافظة</option>'+GOV.map(x=>`<option>${x}</option>`).join('');
  const {data:{session}}=await db.auth.getSession();
  if(!session){location.href='login.html?next=seller-registration.html';return}
  me=session.user;

  const [{data:approved},{data:p}]=await Promise.all([
    db.rpc('has_approved_role',{p_role:'seller'}),
    db.from('profiles').select('full_name,phone,governorate').eq('id',me.id).maybeSingle()
  ]);

  if(p){
    $('sellerName').value=p.full_name||'';
    $('sellerPhone').value=p.phone||'';
    $('storeGovernorate').value=p.governorate||'';
  }

  if(approved){
    $('approvedBox').style.display='block';
    $('formBox').style.display='none';
  }

  await loadStatus();
}

async function loadStatus(){
  const r=await db.rpc('get_my_seller_registration');
  if(r.error){
    $('requestStatus').className='ha-status err';
    $('requestStatus').textContent='شغّل ملف SELLER-STORE-APPROVAL-WORKFLOW.sql أولاً: '+r.error.message;
    return;
  }

  const a=r.data?.application||null;
  const s=r.data?.store||null;

  if(!a){
    $('requestStatus').textContent='ما عندك طلب بائع سابق.';
    return;
  }

  $('requestStatus').className='ha-status '+(a.status==='approved'?'ok':a.status==='rejected'?'err':'');
  $('requestStatus').innerHTML=`${statusAr(a.status)}${a.admin_note?'<br>'+esc(a.admin_note):''}`;

  if(s){
    $('storeStatus').style.display='block';
    $('storeStatus').innerHTML=
      `<b>🏪 ${esc(s.name||'المتجر')}</b><br>`+
      `<span class="ha-badge">${statusAr(s.approval_status||'pending')}</span><br>`+
      `${esc(s.location_text||'')}`+
      `${s.approval_note?'<br><small>'+esc(s.approval_note)+'</small>':''}`;

    if(a.status!=='approved'){
      $('storeSection').value=s.section_key||'markets';
      $('storeName').value=s.name||'';
      $('storeDescription').value=s.description||'';
      if(s.lat!=null){lat=Number(s.lat);lng=Number(s.lng);$('gpsStatus').textContent='✅ موقع محفوظ'}
    }
  }
}

$('gpsBtn').onclick=()=>{
  if(!navigator.geolocation){$('gpsStatus').textContent='GPS غير متوفر';return}
  $('gpsStatus').textContent='جاري تحديد الموقع...';
  navigator.geolocation.getCurrentPosition(
    p=>{lat=p.coords.latitude;lng=p.coords.longitude;$('gpsStatus').textContent='✅ تم تحديد الموقع'},
    ()=>{$('gpsStatus').textContent='تعذر تحديد الموقع'},
    {enableHighAccuracy:true,timeout:12000}
  );
};

$('storeImage').onchange=async e=>{
  const f=e.target.files?.[0];
  imageData=null;
  if(!f){$('storePreview').style.display='none';return}
  imageData=await compressImage(f);
  $('storePreview').src=imageData;
  $('storePreview').style.display='block';
};

$('submitSeller').onclick=async()=>{
  const name=$('sellerName').value.trim();
  const phone=$('sellerPhone').value.trim();
  const section=$('storeSection').value;
  const storeName=$('storeName').value.trim();
  const gov=$('storeGovernorate').value.trim();
  const area=$('storeArea').value.trim();
  const address=$('storeAddress').value.trim();
  const desc=$('storeDescription').value.trim();

  if(!name)return alert('اكتب الاسم');
  if(!phone)return alert('اكتب رقم الهاتف');
  if(!storeName)return alert('اكتب اسم المتجر');
  if(!gov)return alert('اختر المحافظة');

  const btn=$('submitSeller');
  btn.disabled=true;
  $('sellerStatus').className='ha-status';
  $('sellerStatus').textContent='جاري إرسال الطلب...';

  const {error}=await db.rpc('request_seller_with_initial_store',{
    p_display_name:name,
    p_phone:phone,
    p_governorate:gov,
    p_address:address||null,
    p_section:section,
    p_store_name:storeName,
    p_store_area:area||null,
    p_store_description:desc||null,
    p_store_image:imageData,
    p_lat:lat,
    p_lng:lng
  });

  btn.disabled=false;

  if(error){
    $('sellerStatus').className='ha-status err';
    $('sellerStatus').textContent='تعذر إرسال الطلب: '+error.message;
    return;
  }

  $('sellerStatus').className='ha-status ok';
  $('sellerStatus').textContent='✅ تم إرسال طلب البائع والمتجر الأول معاً للأدمن الرئيسي.';
  await loadStatus();
};

init();
})();