(function(){
'use strict';
const db=supabase.createClient(
  'https://ubayrhtshgtgggxprrek.supabase.co',
  'sb_publishable_p3108yoDkdJTLqVXhkvmBg_KVqe-1ll',
  {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'ha-marketing-auth'}}
);
const $=id=>document.getElementById(id);
const GOV=['بغداد','البصرة','نينوى','أربيل','النجف','كربلاء','ذي قار','الأنبار','ديالى','كركوك','صلاح الدين','واسط','ميسان','المثنى','القادسية','بابل','دهوك','السليمانية','حلبجة'];
const SECTION={markets:'الأسواق',library:'مكتبة',printers:'مطبعة',devices:'موبايلات',home_appliances:'الأجهزة الإلكترونية',device_accessories:'إكسسوارات',clothes:'ملابس',shoes:'أحذية',restaurants:'مطاعم',flowers:'ورد وهدايا',building_materials:'مواد البناء'};
let me=null,lat=null,lng=null,imageData=null;

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function statusAr(s){return s==='approved'?'✅ معتمد':s==='rejected'?'❌ مرفوض':'⏳ قيد الموافقة'}

async function compressImage(file){
  if(!file)return null;
  const url=URL.createObjectURL(file);
  try{
    const img=await new Promise((resolve,reject)=>{const x=new Image();x.onload=()=>resolve(x);x.onerror=reject;x.src=url});
    const max=1000,scale=Math.min(1,max/Math.max(img.width,img.height));
    const c=document.createElement('canvas');c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);
    c.getContext('2d').drawImage(img,0,0,c.width,c.height);
    return c.toDataURL('image/jpeg',.78);
  }finally{URL.revokeObjectURL(url)}
}

async function init(){
  $('newGov').innerHTML='<option value="">اختر المحافظة</option>'+GOV.map(x=>`<option>${x}</option>`).join('');
  const {data:{session}}=await db.auth.getSession();
  if(!session){location.href='login.html?next=seller-store-request.html';return}
  me=session.user;

  const {data:ok,error}=await db.rpc('has_approved_role',{p_role:'seller'});
  if(error||!ok){
    location.href='seller-registration.html';
    return;
  }
  await loadMine();
}

$('newGpsBtn').onclick=()=>{
  if(!navigator.geolocation){$('newGpsStatus').textContent='GPS غير متوفر';return}
  $('newGpsStatus').textContent='جاري تحديد الموقع...';
  navigator.geolocation.getCurrentPosition(
    p=>{lat=p.coords.latitude;lng=p.coords.longitude;$('newGpsStatus').textContent='✅ تم تحديد الموقع'},
    ()=>{$('newGpsStatus').textContent='تعذر تحديد الموقع'},
    {enableHighAccuracy:true,timeout:12000}
  );
};

$('newImage').onchange=async e=>{
  const f=e.target.files?.[0];imageData=null;
  if(!f){$('newPreview').style.display='none';return}
  imageData=await compressImage(f);$('newPreview').src=imageData;$('newPreview').style.display='block';
};

async function loadMine(){
  const {data,error}=await db.from('shop_businesses')
    .select('id,name,section_key,location_text,approval_status,approval_note,is_active,created_at')
    .eq('owner_user_id',me.id)
    .order('created_at',{ascending:false});

  if(error){$('myStoreRequests').textContent=error.message;return}
  const arr=data||[];
  $('myStoreRequests').innerHTML=arr.map(x=>`
    <div class="ha-store-summary">
      <b>🏪 ${esc(x.name)}</b> — ${esc(SECTION[x.section_key]||x.section_key)}
      <br><span class="ha-badge">${statusAr(x.approval_status||'pending')}</span>
      <br><small>${esc(x.location_text||'')}</small>
      ${x.approval_note?'<br><small>'+esc(x.approval_note)+'</small>':''}
    </div>
  `).join('')||'<div class="ha-status">ما عندك متاجر بعد.</div>';
}

$('newSubmit').onclick=async()=>{
  const name=$('newName').value.trim(),gov=$('newGov').value.trim();
  if(!name)return alert('اكتب اسم المتجر');
  if(!gov)return alert('اختر المحافظة');

  const btn=$('newSubmit');btn.disabled=true;
  $('newStatus').className='ha-status';$('newStatus').textContent='جاري إرسال المتجر...';

  const {error}=await db.rpc('seller_request_new_store',{
    p_section:$('newSection').value,
    p_store_name:name,
    p_governorate:gov,
    p_store_area:$('newArea').value.trim()||null,
    p_address:$('newAddress').value.trim()||null,
    p_description:$('newDesc').value.trim()||null,
    p_image:imageData,
    p_lat:lat,
    p_lng:lng
  });

  btn.disabled=false;
  if(error){
    $('newStatus').className='ha-status err';
    $('newStatus').textContent='تعذر إرسال المتجر: '+error.message;
    return;
  }

  $('newStatus').className='ha-status ok';
  $('newStatus').textContent='✅ تم إرسال المتجر الجديد للأدمن الرئيسي. سيبقى مخفياً لحين الموافقة.';
  $('newName').value='';$('newArea').value='';$('newAddress').value='';$('newDesc').value='';$('newImage').value='';$('newPreview').style.display='none';imageData=null;lat=lng=null;
  await loadMine();
};

init();
})();