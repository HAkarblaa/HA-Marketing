(function(){
'use strict';

const SUPA_URL='https://ubayrhtshgtgggxprrek.supabase.co';
const SUPA_KEY='sb_publishable_p3108yoDkdJTLqVXhkvmBg_KVqe-1ll';
let _db=null;
let cache={};

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
  .ha-role-balance-bar{
    width:min(1050px,94%);margin:10px auto 12px;padding:11px 14px;border-radius:17px;
    display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;
    background:linear-gradient(135deg,#10243c,#183f58);color:#fff;
    box-shadow:0 10px 26px rgba(8,30,48,.18);border:1px solid rgba(255,255,255,.14);
    position:relative;z-index:50
  }
  .ha-role-balance-bar.good{background:linear-gradient(135deg,#087c5e,#10a879)}
  .ha-role-balance-bar.zero{background:linear-gradient(135deg,#8a2637,#b83b4c)}
  .ha-role-balance-main{display:flex;align-items:center;gap:10px}
  .ha-role-balance-icon{width:43px;height:43px;border-radius:13px;display:grid;place-items:center;background:rgba(255,255,255,.14);font-size:22px}
  .ha-role-balance-copy b{display:block;font-size:14px}.ha-role-balance-copy small{display:block;margin-top:3px;color:rgba(255,255,255,.82);font-size:10px}
  .ha-role-balance-amount{font-size:23px;font-weight:900;white-space:nowrap}
  .ha-role-balance-actions{display:flex;gap:7px;align-items:center}
  .ha-role-balance-actions button{border:0;border-radius:11px;padding:9px 11px;background:#fff;color:#15304b;font:inherit;font-size:11px;font-weight:900;cursor:pointer}
  @media(max-width:560px){
    .ha-role-balance-bar{padding:9px 10px;border-radius:14px;gap:8px}
    .ha-role-balance-icon{width:37px;height:37px;font-size:19px}
    .ha-role-balance-amount{font-size:18px}
    .ha-role-balance-actions button{padding:8px 9px;font-size:10px}
  }`;
  document.head.appendChild(st);
}

async function balance(role,{force=false}={}){
  if(!force && cache[role] && Date.now()-cache[role].at<8000)return cache[role].amount;
  const c=db();
  if(!c)return 0;
  const {data:{session}}=await c.auth.getSession();
  const user=session?.user;
  if(!user)return 0;
  const {data,error}=await c.from('role_balances')
    .select('balance')
    .eq('user_id',user.id)
    .eq('role_type',role)
    .maybeSingle();
  const amount=error?0:Number(data?.balance||0);
  cache[role]={amount,at:Date.now()};
  return amount;
}
async function hasPositive(role,opts){
  return (await balance(role,opts))>0;
}

async function redeem(role){
  const c=db();
  if(!c)return;
  const code=prompt('أدخل كود تعبئة رصيد '+(LABELS[role]||role)+':');
  if(code===null)return;
  if(!code.trim())return alert('اكتب الكود أولاً');
  const {data,error}=await c.rpc('redeem_balance_recharge_code',{
    p_code:code.trim(),
    p_role_type:role
  });
  if(error)return alert('تعذر إضافة الرصيد: '+error.message);
  cache[role]={amount:Number(data?.balance||0),at:Date.now()};
  alert('✅ تمت إضافة '+fmt(data?.added||0));
  await refreshMounted(role);
}

async function refreshMounted(role){
  const bar=document.querySelector(`.ha-role-balance-bar[data-role="${role}"]`);
  if(!bar)return;
  const amount=await balance(role,{force:true});
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
  bar.querySelector('[data-redeem]').onclick=()=>redeem(role);
  bar.querySelector('[data-refresh]').onclick=()=>refreshMounted(role);

  const target=opts.targetSelector?document.querySelector(opts.targetSelector):null;
  if(target)target.insertAdjacentElement(opts.position==='after'?'afterend':'beforebegin',bar);
  else{
    const family=document.querySelector('.ha-family-strip');
    if(family)family.insertAdjacentElement('afterend',bar);
    else document.body.insertAdjacentElement('afterbegin',bar);
  }
}

window.HA_BalanceGate={balance,hasPositive,mount,redeem,refresh:refreshMounted};
})();