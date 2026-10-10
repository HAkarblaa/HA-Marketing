(function(){
  'use strict';
  if(window.HA_HomeMyOrders)return;
  const card=document.getElementById('haHomeMyOrders');if(!card)return;
  const base=new URL('./',document.currentScript.src);
  const roleTargets={driver:'driver.html#requestsSection',seller:'seller-dashboard.html#sellerOrderTools',provider:'provider-dashboard.html#incomingRequestsCard'};
  const text={
    ar:{title:'مركز الطلبات',customer:'متابعة طلباتك',driver:'طلبات السائق الواردة',seller:'طلبات متاجرك',provider:'طلبات الخدمات الواردة',multiple:'اختر طلبات دورك',choose:'اختر الطلبات',close:'إغلاق',loading:'جاري التحميل...',error:'تعذر التحقق، اضغط للمحاولة'},
    iq:{title:'مركز الطلبات',customer:'تابع طلباتك',driver:'الطلبات اللي تجيك كسائق',seller:'طلبات متاجرك',provider:'طلبات الخدمات اللي تجيك',multiple:'اختار طلبات دورك',choose:'اختار الطلبات',close:'إغلاق',loading:'جاري التحميل...',error:'تعذر التحقق، اضغط وحاول مرة ثانية'},
    en:{title:'Order Center',customer:'Track your orders',driver:'Incoming driver requests',seller:'Your store orders',provider:'Incoming service requests',multiple:'Choose your work orders',choose:'Choose orders',close:'Close',loading:'Loading...',error:'Could not verify. Tap to retry.'},
    fa:{title:'مرکز سفارش‌ها',customer:'پیگیری سفارش‌های شما',driver:'درخواست‌های دریافتی راننده',seller:'سفارش‌های فروشگاه شما',provider:'درخواست‌های خدمات دریافتی',multiple:'سفارش‌های نقش خود را انتخاب کنید',choose:'انتخاب سفارش‌ها',close:'بستن',loading:'در حال بارگذاری...',error:'تأیید ممکن نشد؛ برای تلاش دوباره بزنید'}
  };
  let db=null,state=null,pending=null,epoch=0,opening=false,chooser=null,previousOverflow='';
  function words(){let lang='ar';try{lang=window.HAI18N?.getLanguage()||localStorage.getItem('ha_language_v1')||'ar';}catch(_e){}return text[lang]||text.ar;}
  function put(el,value){if(el&&el.textContent!==value)el.textContent=value;}
  function bounded(promise,ms=5000){let timer;return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('orders_timeout')),ms);})]).finally(()=>clearTimeout(timer));}
  async function client(){
    if(db)return db;
    const until=Date.now()+6000;
    while(!window.supabase?.createClient&&Date.now()<until)await new Promise(resolve=>setTimeout(resolve,100));
    if(!window.supabase?.createClient)throw new Error('sdk_missing');
    db=window.supabase.createClient('https://ubayrhtshgtgggxprrek.supabase.co','sb_publishable_p3108yoDkdJTLqVXhkvmBg_KVqe-1ll',{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'ha-marketing-auth'}});
    db.auth.onAuthStateChange?.((event)=>{
      if(['SIGNED_IN','SIGNED_OUT','USER_UPDATED'].includes(event)){
        epoch++;state=null;pending=null;card.hidden=true;closeChooser();
        if(event!=='SIGNED_OUT')setTimeout(()=>refresh(true),0);
      }
    });
    return db;
  }
  function paint(){
    const w=words();card.hidden=!state;
    if(!state)return;
    put(card.querySelector('strong'),w.title);
    const label=state.loading?w.loading:state.error?w.error:state.roles.length>1?w.multiple:state.roles.length?w[state.roles[0]]:w.customer;
    put(card.querySelector('small'),label);
    card.setAttribute('aria-label',w.title+' — '+label);
    card.setAttribute('aria-busy',String(!!state.loading));
    card.setAttribute('href',state.error||state.loading?'#':new URL(state.roles.length===1?roleTargets[state.roles[0]]:'orders-center.html',base).href);
    card.dataset.ordersRole=state.roles.length===1?state.roles[0]:state.roles.length?'multiple':'customer';
  }
  async function readState(version){
    const api=await client();const auth=await bounded(api.auth.getSession());
    const user=auth.data?.session?.user;
    if(auth.error||!user||user.is_anonymous){if(version===epoch){state=null;paint();}return null;}
    if(version!==epoch)return null;
    state={userId:user.id,roles:[],loading:true,error:false,at:0};paint();
    const [driver,applications]=await Promise.allSettled([
      bounded(api.rpc('get_transport_driver_push_state')),
      bounded(api.from('marketplace_applications').select('user_id,role_type,status').eq('user_id',user.id).in('role_type',['seller','service_provider']).eq('status','approved'))
    ]);
    const roles=[];let error=false;
    if(driver.status==='fulfilled'&&!driver.value.error){if(driver.value.data?.ok===true)roles.push('driver');}else error=true;
    const approved=new Set();
    if(applications.status==='fulfilled'&&!applications.value.error&&Array.isArray(applications.value.data)){
      for(const row of applications.value.data){if(row.user_id===user.id&&row.status==='approved'&&['seller','service_provider'].includes(row.role_type))approved.add(row.role_type);}
    }else error=true;
    // An admin bypass in has_approved_role must not invent a registered work role.
    const checks=await Promise.allSettled([...approved].map(async role=>({role,result:await bounded(api.rpc('has_approved_role',{p_role:role}))})));
    for(const check of checks){
      if(check.status!=='fulfilled'||check.value.result.error){error=true;continue;}
      if(check.value.result.data===true)roles.push(check.value.role==='seller'?'seller':'provider');
    }
    const current=await bounded(api.auth.getSession());
    if(version!==epoch)return null;
    if(current.error)throw current.error;
    if(current.data?.session?.user?.id!==user.id||current.data?.session?.user?.is_anonymous){
      epoch++;state=null;paint();closeChooser();setTimeout(()=>refresh(true),0);return null;
    }
    state={userId:user.id,roles,loading:false,error,at:Date.now()};paint();return state;
  }
  function refresh(force=false){
    if(pending)return pending;
    if(!force&&state&&!state.loading&&!state.error&&Date.now()-state.at<20000)return Promise.resolve(state);
    const version=epoch;
    const task=readState(version).catch(()=>{
      if(version===epoch&&state){state.loading=false;state.error=true;paint();}return null;
    }).finally(()=>{if(pending===task)pending=null;});
    pending=task;return task;
  }
  function closeChooser(){
    if(!chooser||chooser.hidden)return;
    chooser.hidden=true;document.body.style.overflow=previousOverflow;card.focus();
  }
  function showChooser(){
    if(!chooser){
      chooser=document.createElement('div');chooser.id='haHomeOrdersChooser';chooser.hidden=true;chooser.setAttribute('data-no-i18n','');
      chooser.innerHTML='<section class="ha-orders-dialog" role="dialog" aria-modal="true" aria-labelledby="haOrdersChooseTitle"><button type="button" class="ha-orders-close">×</button><h2 id="haOrdersChooseTitle"></h2><div class="ha-orders-links"></div></section>';
      chooser.querySelector('button').onclick=closeChooser;
      chooser.addEventListener('click',event=>{if(event.target===chooser)closeChooser();});
      chooser.addEventListener('keydown',event=>{
        if(event.key==='Escape'){event.preventDefault();closeChooser();return;}
        if(event.key!=='Tab')return;
        const focusable=[...chooser.querySelectorAll('button,a')],first=focusable[0],last=focusable.at(-1);
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
      });document.body.appendChild(chooser);
    }
    const w=words();put(chooser.querySelector('h2'),w.choose);chooser.querySelector('button').setAttribute('aria-label',w.close);
    const list=chooser.querySelector('.ha-orders-links');list.replaceChildren();
    for(const role of state.roles){const a=document.createElement('a');a.href=new URL(roleTargets[role],base).href;a.textContent=w[role];a.onclick=event=>{event.preventDefault();open(role);};list.appendChild(a);}
    if(chooser.hidden){previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';}
    chooser.hidden=false;list.querySelector('a')?.focus();
  }
  async function open(selectedRole){
    if(opening)return;opening=true;card.setAttribute('aria-busy','true');
    try{
      const api=await client(),auth=await bounded(api.auth.getSession()),user=auth.data?.session?.user;
      if(auth.error||!user||user.is_anonymous){epoch++;state=null;paint();closeChooser();location.assign(new URL('login.html',base).href);return;}
      if(state?.userId!==user.id){epoch++;state=null;pending=null;closeChooser();}
      const fresh=await refresh(false);
      if(!fresh||fresh.error||fresh.userId!==user.id)return;
      const current=await bounded(api.auth.getSession());if(current.error)throw current.error;
      if(current.data?.session?.user?.id!==user.id||current.data?.session?.user?.is_anonymous){epoch++;state=null;paint();closeChooser();setTimeout(()=>refresh(true),0);return;}
      if(selectedRole&&!fresh.roles.includes(selectedRole)){closeChooser();return;}
      if(!selectedRole&&fresh.roles.length>1){showChooser();return;}
      const role=selectedRole||fresh.roles[0];closeChooser();
      location.assign(new URL(role?roleTargets[role]:'orders-center.html',base).href);
    }catch(_e){if(state){state.loading=false;state.error=true;paint();}}
    finally{opening=false;card.setAttribute('aria-busy','false');}
  }
  card.addEventListener('click',event=>{if(event.target.closest('.ha-card-edit-btn'))return;event.preventDefault();open();});
  window.HA_HomeMyOrders={refresh,open};
  window.addEventListener('ha:account-ready',()=>refresh(true));
  window.addEventListener('ha:languagechange',()=>{paint();if(chooser&&!chooser.hidden)showChooser();});
  window.addEventListener('pageshow',()=>refresh(true));
  window.addEventListener('online',()=>refresh(true));
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refresh(true);});
  refresh();
})();
