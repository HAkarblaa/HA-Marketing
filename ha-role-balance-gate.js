(function(){
'use strict';

const SUPA_URL='https://ubayrhtshgtgggxprrek.supabase.co';
const SUPA_KEY='sb_publishable_p3108yoDkdJTLqVXhkvmBg_KVqe-1ll';
let _db=null;
let cache={};
let mounts={};
const PAGE_ROLES={
  'seller-dashboard.html':'seller','shop.html':'seller',
  'provider-dashboard.html':'service_provider','services.html':'service_provider',
  'driver.html':'driver','shop-courier.html':'driver','taxi-delivery.html':'driver'
};
const DRIVER_ROLES=['taxi_driver','delivery_driver','tuktuk_driver','stoota_driver','cargo_driver'];

async function readyDb(){
  if(!window.supabase?.createClient){
    await new Promise((resolve,reject)=>{
      let s=document.querySelector('script[src*="supabase-js"]');
      let append=false;
      if(!s){
        s=document.createElement('script');
        s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
        s.dataset.haRoleSupabase='1';
        s.async=true;
        append=true;
      }
      s.addEventListener('load',resolve,{once:true});
      s.addEventListener('error',reject,{once:true});
      if(append)document.head.appendChild(s);
    });
  }
  return db();
}

function db(){
  if(window.db && typeof window.db.from==='function')return window.db;
  if(_db)return _db;
  if(!window.supabase?.createClient)return null;
  _db=window.supabase.createClient(SUPA_URL,SUPA_KEY,{
    auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'ha-marketing-auth'}
  });
  return _db;
}
const LABELS={
  service_provider:'مقدم الخدمة',
  driver:'السائق / المندوب',
  seller:'البائع / صاحب المتجر',
  employee:'الموظف'
};
const fmt=n=>Number(n||0).toLocaleString('ar-IQ',{maximumFractionDigits:2})+' د.ع';

function ensureStyles(){
  if(document.getElementById('haBalanceGateStyles'))return;
  const st=document.createElement('style');
  st.id='haBalanceGateStyles';
  st.textContent=`
  body section.ha-role-balance-bar{
    box-sizing:border-box;width:min(1050px,94%);max-width:94%;margin:10px auto 12px;padding:11px 14px;border-radius:17px;
    display:flex!important;visibility:visible!important;opacity:1!important;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;direction:rtl;
    background:linear-gradient(135deg,#10243c,#183f58);color:#fff;
    box-shadow:0 10px 26px rgba(8,30,48,.18);border:1px solid rgba(255,255,255,.14);
    position:relative;z-index:50
  }
  body section.ha-role-balance-bar.good{background:linear-gradient(135deg,#087c5e,#10a879)}
  body section.ha-role-balance-bar.zero{background:linear-gradient(135deg,#8a2637,#b83b4c)}
  .ha-role-balance-main{display:flex;align-items:center;gap:10px}
  .ha-role-balance-icon{width:43px;height:43px;border-radius:13px;display:grid;place-items:center;background:rgba(255,255,255,.14);font-size:22px}
  .ha-role-balance-copy{min-width:0;flex:1}body section.ha-role-balance-bar .ha-role-balance-copy b{display:block;font-size:14px;color:#fff!important}body section.ha-role-balance-bar .ha-role-balance-copy small{display:block;margin-top:3px;color:rgba(255,255,255,.92)!important;font-size:11px;line-height:1.6}
  .ha-role-balance-amount{font-size:23px;font-weight:900;white-space:nowrap}
  .ha-role-balance-actions{display:flex;gap:7px;align-items:center}
  body section.ha-role-balance-bar .ha-role-balance-actions button{width:auto!important;min-height:40px;border:0;border-radius:11px;padding:9px 11px;background:#fff!important;color:#15304b!important;font:inherit;font-size:11px;font-weight:900;cursor:pointer;touch-action:manipulation}
  .ha-role-balance-actions button:disabled{opacity:.6;cursor:wait}
  .ha-role-balance-main{min-width:0;flex:1 1 210px}
  body section.ha-role-balance-bar .ha-role-balance-amount{color:#fff!important}
  body.ha-work-balance-active #providerBalanceCard,
  body.ha-work-balance-active #haDriverBalance{display:none!important}
  body section.ha-role-balance-bar [data-balance-status]{flex-basis:100%;font-size:12px;line-height:1.6;color:#fff!important}
  body section.ha-role-balance-bar [data-balance-status]:empty{display:none}
  @media(max-width:560px){
    body section.ha-role-balance-bar{padding:9px 10px;border-radius:14px;gap:8px}
    .ha-role-balance-icon{width:37px;height:37px;font-size:19px}
    .ha-role-balance-amount{font-size:18px}
    body section.ha-role-balance-bar .ha-role-balance-actions button{padding:8px 9px;font-size:10px}
  }`;
  document.head.appendChild(st);
}

async function balance(role,{force=false}={}){
  const c=await readyDb();
  if(!c)return 0;
  const {data:{session}}=await c.auth.getSession();
  const user=session?.user;
  if(!user)return 0;
  if(!force && cache[role]?.userId===user.id && Date.now()-cache[role].at<8000)return cache[role].amount;
  const {data,error}=await c.from('role_balances')
    .select('balance')
    .eq('user_id',user.id)
    .eq('role_type',role)
    .maybeSingle();
  if(error){cache[role]={userId:user.id,amount:0,error,at:0};return 0;}
  const amount=Number(data?.balance||0);
  cache[role]={userId:user.id,amount,at:Date.now(),error:null};
  return amount;
}
async function hasPositive(role,opts){
  return (await balance(role,opts))>0;
}

async function redeem(role){
  const c=await readyDb();
  if(!c)return;
  const code=prompt('أدخل كود تعبئة رصيد '+(LABELS[role]||role)+':');
  if(code===null)return;
  if(!code.trim())return alert('اكتب الكود أولاً');
  const bar=document.querySelector(`.ha-role-balance-bar[data-role="${role}"]`);
  const button=bar?.querySelector('[data-redeem]');
  const status=bar?.querySelector('[data-balance-status]');
  if(button?.disabled)return;
  if(button)button.disabled=true;
  if(status)status.textContent='جاري التحقق من الكود...';
  try{
  const {data,error}=await c.rpc('redeem_balance_recharge_code',{
    p_code:code.trim(),
    p_role_type:role
  });
  if(error){if(status)status.textContent='تعذر إضافة الرصيد: '+error.message;return;}
  delete cache[role];
  alert('✅ تمت إضافة '+fmt(data?.added||0));
  await refreshMounted(role);
  if(status)status.textContent='✅ تمت إضافة '+fmt(data?.added||0);
  }catch(e){if(status)status.textContent='تعذر إضافة الرصيد: '+(e?.message||'تعذر الاتصال');}
  finally{if(button)button.disabled=false;}
}

async function refreshMounted(role){
  const bar=document.querySelector(`.ha-role-balance-bar[data-role="${role}"]`);
  if(!bar)return;
  const amount=await balance(role,{force:true});
  if(cache[role]?.error){
    bar.classList.remove('good','zero');
    if(bar.querySelector('[data-balance-value]'))bar.querySelector('[data-balance-value]').textContent='—';
    if(bar.querySelector('[data-balance-msg]'))bar.querySelector('[data-balance-msg]').textContent='تعذر تحميل الرصيد؛ اضغط تحديث للمحاولة مجدداً.';
    return;
  }
  const val=bar.querySelector('[data-balance-value]');
  const msg=bar.querySelector('[data-balance-msg]');
  if(val)val.textContent=fmt(amount);
  bar.classList.toggle('good',amount>0);
  bar.classList.toggle('zero',amount<=0);
  if(msg)msg.textContent=amount>0
    ?'الرصيد فعال — تصلك الطلبات وإشعارات الطلبات.'
    :'الرصيد صفر — لن تصلك الطلبات أو إشعارات الطلبات حتى تعبئة الرصيد.';
  window.dispatchEvent(new CustomEvent('ha-role-balance-changed',{detail:{role,amount}}));
}

async function mount(role,opts={}){
  if(mounts[role])return mounts[role];
  mounts[role]=mountOnce(role,opts).finally(()=>{delete mounts[role];});
  return mounts[role];
}

async function mountOnce(role,opts={}){
  const c=await readyDb();
  const {data:{session}}=await c.auth.getSession();
  if(!session?.user||session.user.is_anonymous)return;
  ensureStyles();
  if(document.querySelector(`.ha-role-balance-bar[data-role="${role}"]`)){
    await refreshMounted(role); return;
  }
  const amount=await balance(role,{force:true});
  const bar=document.createElement('section');
  bar.className='ha-role-balance-bar '+(amount>0?'good':'zero');
  bar.dataset.role=role;
  bar.innerHTML=`
    <div class="ha-role-balance-main">
      <span class="ha-role-balance-icon">💳</span>
      <div class="ha-role-balance-copy">
        <b>رصيد ${LABELS[role]||role}</b>
        <small data-balance-msg>${amount>0?'الرصيد فعال — تصلك الطلبات وإشعارات الطلبات.':'الرصيد صفر — لن تصلك الطلبات أو إشعارات الطلبات حتى تعبئة الرصيد.'}</small>
      </div>
    </div>
    <div class="ha-role-balance-amount" data-balance-value>${fmt(amount)}</div>
    <div class="ha-role-balance-actions">
      <button type="button" data-redeem>＋ تعبئة الرصيد</button>
      <button type="button" data-refresh>تحديث</button>
    </div>`;
  const status=document.createElement('div');
  status.setAttribute('data-balance-status','');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  bar.appendChild(status);
  bar.querySelector('[data-redeem]').onclick=()=>redeem(role);
  bar.querySelector('[data-refresh]').onclick=async e=>{const b=e.currentTarget;b.disabled=true;try{await refreshMounted(role);}finally{b.disabled=false;}};

  const target=opts.targetSelector?document.querySelector(opts.targetSelector):null;
  if(target)target.insertAdjacentElement(opts.position==='after'?'afterend':'beforebegin',bar);
  else{
    const top=document.querySelector('.ha-family-strip,.ha-section-top,.ha-top,.driver-simple-hero,.topbar,header');
    if(top)top.insertAdjacentElement('afterend',bar);
    else{
      const wrap=document.querySelector('.wrap,.container,main');
      if(wrap)wrap.insertAdjacentElement('afterbegin',bar);
      else document.body.insertAdjacentElement('afterbegin',bar);
    }
  }
  if(role!=='employee')document.body.classList.add('ha-work-balance-active');
  await refreshMounted(role);
}

window.HA_BalanceGate={balance,hasPositive,mount,redeem,refresh:refreshMounted};

async function autoMount(){
  const page=location.pathname.split('/').pop().toLowerCase();
  const role=PAGE_ROLES[page];
  if(!role)return;
  try{
    const c=await readyDb();
    const {data:{session}}=await c.auth.getSession();
    if(!session?.user||session.user.is_anonymous)return;
    const roleNames=role==='driver'?DRIVER_ROLES:[role];
    const checks=await Promise.all(roleNames.map(p_role=>c.rpc('has_approved_role',{p_role}).catch(()=>({data:false}))));
    let approved=checks.some(x=>!x.error&&x.data===true);
    if(!approved&&role==='driver'){
      const {data}=await c.from('transport_profiles').select('role_type,status').eq('user_id',session.user.id).maybeSingle();
      approved=data?.status==='approved'&&DRIVER_ROLES.includes(data.role_type);
    }
    if(!approved)return;
    const target=page==='seller-dashboard.html'||page==='provider-dashboard.html'||page==='shop-courier.html'?'#gate':null;
    await mount(role,target?{targetSelector:target,position:'after'}:{});
  }catch(e){console.warn('تعذر تحميل شريط الرصيد',e);}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',autoMount,{once:true});
else autoMount();
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='visible')Object.keys(cache).forEach(role=>{
    if(document.querySelector(`.ha-role-balance-bar[data-role="${role}"]`))refreshMounted(role).catch(()=>{});
  });
});
})();
