(function(){
'use strict';

const SB_URL='https://ubayrhtshgtgggxprrek.supabase.co';
const SB_KEY='sb_publishable_p3108yoDkdJTLqVXhkvmBg_KVqe-1ll';
const db=supabase.createClient(SB_URL,SB_KEY,{
  auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'ha-marketing-auth'}
});
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const GOVS=[
  'بغداد','البصرة','نينوى','أربيل','النجف','كربلاء','ذي قار','الأنبار','ديالى',
  'كركوك','صلاح الدين','واسط','ميسان','المثنى','القادسية','بابل','دهوك','السليمانية','حلبجة'
];

let me=null;
let lat=null,lng=null;

function statusLabel(s){
  return s==='approved'?'✅ مقبول':
         s==='rejected'?'❌ مرفوض':
         s==='suspended'?'⏸️ موقوف':
         '⏳ قيد المراجعة';
}

function initGovs(){
  $('regGov').innerHTML='<option value="">اختر المحافظة</option>'+
    GOVS.map(x=>`<option value="${x}">${x}</option>`).join('');
}

function addPhone(value=''){
  const row=document.createElement('div');
  row.className='ha-phone-row';
  row.innerHTML=`<input class="regPhoneInput" inputmode="tel" placeholder="07XXXXXXXXX" value="${esc(value)}">
    <button class="ha-phone-remove" type="button" title="حذف الرقم">×</button>`;
  row.querySelector('.ha-phone-remove').onclick=()=>{
    const rows=[...document.querySelectorAll('.ha-phone-row')];
    if(rows.length===1){
      row.querySelector('input').value='';
      return;
    }
    row.remove();
  };
  $('phoneList').appendChild(row);
}

function bindInitialPhoneRemove(){
  const row=document.querySelector('.ha-phone-row');
  if(!row)return;
  row.querySelector('.ha-phone-remove').onclick=()=>row.querySelector('input').value='';
}

function getPhones(){
  return [...document.querySelectorAll('.regPhoneInput')]
    .map(x=>x.value.trim())
    .filter(Boolean);
}

async function auth(){
  const {data:{session}}=await db.auth.getSession();
  if(!session){
    location.href='login.html?next='+encodeURIComponent('service-provider-registration.html');
    return false;
  }
  me=session.user;
  return true;
}

async function prefill(){
  const {data:p}=await db.from('profiles')
    .select('full_name,username,phone,governorate')
    .eq('id',me.id)
    .maybeSingle();

  if(p){
    $('regName').value=p.full_name||'';
    $('regUsername').value=p.username?('@'+p.username):(me.email||me.id);
    if(p.phone) document.querySelector('.regPhoneInput').value=p.phone;
    if(p.governorate) $('regGov').value=p.governorate;
  }else{
    $('regUsername').value=me.email||me.id;
  }
}

async function loadCategories(){
  const {data,error}=await db.from('service_categories')
    .select('id,name')
    .eq('is_active',true)
    .order('sort_order',{ascending:true});

  const fallback=[
    {id:'fixed-printers',name:'صيانة طابعات'},
    {id:'fixed-phones',name:'صيانة موبايلات'},
    {id:'fixed-blacksmith',name:'حداد'},
    {id:'fixed-barber',name:'حلاق'}
  ];

  const arr=(!error && data?.length)?data:fallback;
  $('regServiceType').innerHTML=
    '<option value="">اختر نوع الخدمة / المهنة</option>'+
    arr.map(x=>`<option value="${esc(x.id)}" data-name="${esc(x.name)}">${esc(x.name)}</option>`).join('')+
    '<option value="other">➕ مهنتي غير موجودة بالقائمة</option>';
}

function serviceChanged(){
  const other=$('regServiceType').value==='other';
  $('regOtherProfessionBox').classList.toggle('show',other);
}

async function reverseGeocode(latitude,longitude){
  const url=`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}&accept-language=ar`;
  const res=await fetch(url,{headers:{'Accept':'application/json'}});
  if(!res.ok)throw new Error('تعذر جلب العنوان');
  const data=await res.json();
  return data?.display_name||`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

async function locate(){
  const status=$('regLocateStatus');
  if(!navigator.geolocation){
    status.textContent='هذا الجهاز لا يدعم تحديد الموقع.';
    return;
  }

  status.className='ha-locate-status';
  status.textContent='جاري تحديد موقعك...';

  navigator.geolocation.getCurrentPosition(async pos=>{
    lat=pos.coords.latitude;
    lng=pos.coords.longitude;

    try{
      status.textContent='تم تحديد الإحداثيات، جاري جلب العنوان...';
      const address=await reverseGeocode(lat,lng);
      $('regLocationText').value=address;
      status.className='ha-locate-status ok';
      status.textContent='✅ تم تحديد موقعك وعنوانك.';
    }catch(_e){
      $('regLocationText').value=`${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      status.className='ha-locate-status ok';
      status.textContent='✅ تم تحديد موقعك. تعذر جلب اسم العنوان لكن الإحداثيات محفوظة.';
    }
  },err=>{
    status.className='ha-locate-status';
    status.textContent='تعذر تحديد الموقع. فعّل GPS واسمح للموقع بالوصول إلى مكانك.';
  },{enableHighAccuracy:true,timeout:15000,maximumAge:0});
}

async function loadHistory(){
  const box=$('regHistory');
  const {data,error}=await db.from('marketplace_applications')
    .select('*')
    .eq('user_id',me.id)
    .eq('role_type','service_provider')
    .order('created_at',{ascending:false});

  if(error){
    box.textContent='تعذر تحميل حالة الطلب: '+error.message;
    return;
  }

  const arr=data||[];
  if(!arr.length){
    box.innerHTML='<div class="ha-reg-note">ما عندك طلب سابق.</div>';
    return;
  }

  box.innerHTML=arr.map(x=>`
    <div class="ha-reg-history-item">
      <b>${esc(x.service_type_name||x.custom_profession||'مقدم خدمة')}</b>
      <span class="ha-reg-badge">${statusLabel(x.status)}</span>
      <div class="ha-reg-note">${esc(x.governorate||'')} ${x.area?'— '+esc(x.area):''}</div>
      ${x.admin_note?`<div class="ha-reg-note">${esc(x.admin_note)}</div>`:''}
      ${x.status==='approved'?'<div style="margin-top:8px"><a class="ha-reg-home" href="provider-dashboard.html">فتح لوحة مقدم الخدمة</a></div>':''}
    </div>
  `).join('');
}

async function submit(){
  const name=$('regName').value.trim();
  const username=$('regUsername').value.trim();
  const phones=getPhones();
  const gov=$('regGov').value.trim();
  const area=$('regArea').value.trim();
  const locationText=$('regLocationText').value.trim();
  const serviceValue=$('regServiceType').value;
  const selected=$('regServiceType').selectedOptions[0];
  const selectedName=selected?.dataset?.name||selected?.textContent?.trim()||'';
  const custom=$('regOtherProfession').value.trim();
  const details=$('regDetails').value.trim();

  if(!name)return alert('اكتب الاسم الكامل');
  if(!phones.length)return alert('أضف رقم هاتف واحد على الأقل');
  if(!gov)return alert('اختر المحافظة');
  if(!area)return alert('اكتب المنطقة');
  if(lat==null||lng==null||!locationText)return alert('اضغط مسمار الموقع وحدد موقعك');
  if(!serviceValue)return alert('اختر نوع الخدمة / المهنة');
  if(serviceValue==='other'&&!custom)return alert('اكتب اسم مهنتك');

  const numericCategory=Number(serviceValue);
  const categoryId=Number.isFinite(numericCategory)?numericCategory:null;
  const serviceName=serviceValue==='other'?null:selectedName;

  const btn=$('regSubmit');
  const st=$('regStatus');
  btn.disabled=true;
  st.className='ha-reg-status';
  st.textContent='جاري إرسال طلب الاعتماد للأدمن الرئيسي...';

  const {error}=await db.rpc('request_service_provider_application',{
    p_display_name:name,
    p_original_username:username,
    p_phones:phones,
    p_governorate:gov,
    p_area:area,
    p_location_text:locationText,
    p_lat:lat,
    p_lng:lng,
    p_category_id:categoryId,
    p_service_type_name:serviceName,
    p_custom_profession:serviceValue==='other'?custom:null,
    p_details:details||null
  });

  btn.disabled=false;

  if(error){
    st.className='ha-reg-status err';
    st.textContent='تعذر إرسال الطلب: '+error.message;
    return;
  }

  st.className='ha-reg-status ok';
  st.textContent='✅ تم إرسال الطلب للأدمن الرئيسي وهو الآن قيد المراجعة.';
  await loadHistory();
}

async function init(){
  initGovs();
  bindInitialPhoneRemove();
  $('addPhoneBtn').onclick=()=>addPhone();
  $('regServiceType').onchange=serviceChanged;
  $('regLocateBtn').onclick=locate;
  $('regSubmit').onclick=submit;

  if(!(await auth()))return;
  await Promise.all([prefill(),loadCategories()]);
  await loadHistory();
}

init();
})();