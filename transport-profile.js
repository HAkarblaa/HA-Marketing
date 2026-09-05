// HA Marketing - real logged-in profile helper for transport pages
(function(){
  const URL='https://ubayrhtshgtgggxprrek.supabase.co';
  const KEY='sb_publishable_p3108yoDkdJTLqVXhkvmBg_KVqe-1ll';
  let client=null, cached=null;

  // نقل جلسة تسجيل الدخول القديمة إلى المفتاح الحالي قبل إنشاء عميل Supabase.
  // هذا مهم للمستخدمين الذين سجلوا الدخول قبل تغيير storageKey.
  function migrateLegacyAuth(){
    try{
      const target='ha-marketing-auth';
      if(localStorage.getItem(target))return;
      for(let i=0;i<localStorage.length;i++){
        const k=localStorage.key(i)||'';
        if(/^sb-.*-auth-token$/.test(k)){
          const v=localStorage.getItem(k);
          if(v){localStorage.setItem(target,v);break;}
        }
      }
    }catch(e){console.warn('transport auth migration',e)}
  }

  migrateLegacyAuth();

  function supa(){
    if(client)return client;
    if(!window.supabase?.createClient)throw new Error('Supabase client not loaded');
    client=window.supabase.createClient(URL,KEY,{
      auth:{
        persistSession:true,
        autoRefreshToken:true,
        detectSessionInUrl:true,
        storageKey:'ha-marketing-auth'
      }
    });
    return client;
  }

  async function authUser(){
    const db=supa();

    // getSession reads the same saved login session used by login.html.
    // This prevents transport pages from treating a valid saved session as logged out.
    try{
      const {data}=await db.auth.getSession();
      if(data?.session?.user)return data.session.user;
    }catch(e){}

    // Fallback: ask Supabase for the authenticated user.
    try{
      const {data}=await db.auth.getUser();
      if(data?.user)return data.user;
    }catch(e){}

    return null;
  }

  async function current(force=false){
    if(cached&&!force)return cached;

    const db=supa();
    const user=await authUser();
    if(!user)return null;

    // Authentication and profile loading are separate things.
    // A profile query problem must not make an authenticated customer "logged out".
    let p=null;
    try{
      const r=await db.from('profiles')
        .select('id,full_name,username,phone,account_type,employee_status,employee_role')
        .eq('id',user.id)
        .maybeSingle();
      if(!r.error&&r.data)p=r.data;
    }catch(e){}

    const meta=user.user_metadata||{};
    cached={
      id:p?.id||user.id,
      user_id:user.id,
      full_name:p?.full_name||meta.full_name||meta.name||'',
      username:p?.username||meta.username||'',
      phone:p?.phone||user.phone||meta.phone||'',
      account_type:p?.account_type||meta.account_type||'customer',
      employee_status:p?.employee_status||meta.employee_status||null,
      employee_role:p?.employee_role||meta.employee_role||null
    };

    return cached;
  }

  function vehicle(){
    try{return JSON.parse(localStorage.getItem('ha_driver_vehicle')||'null')}catch(e){return null}
  }

  function saveVehicle(v){
    localStorage.setItem('ha_driver_vehicle',JSON.stringify(v||{}));
  }

  async function customerOrLogin(){
    const p=await current(true);
    if(!p){
      alert('لازم تسجل الدخول بحسابك أولاً حتى ترسل الطلب.');
      const next=encodeURIComponent(location.pathname.split('/').pop()||'index.html');
      location.href='login.html?next='+next;
      return null;
    }
    return {
      id:p.id,
      name:p.full_name||p.username||'الزبون',
      phone:p.phone||''
    };
  }

  async function driverIdentity(){
    const p=await current(true);
    if(!p)return {ok:false,message:'لازم تسجل الدخول بحساب الموظف أولاً.'};
    if(p.account_type!=='employee')return {ok:false,message:'واجهة السائق مخصصة لحسابات الموظفين فقط.'};
    if(p.employee_status!=='approved')return {ok:false,message:'حساب الموظف لازم يكون موافق عليه من الإدارة قبل استقبال الطلبات.'};

    const v=vehicle()||{};
    if(!v.plate||!v.carName||!v.carColor){
      return {ok:false,needsVehicle:true,profile:p,message:'أدخل معلومات المركبة الحقيقية أولاً.'};
    }

    return {ok:true,profile:p,driver:{
      userId:p.id,
      name:p.full_name||p.username||'السائق',
      phone:p.phone||'',
      plate:v.plate,
      carName:v.carName,
      carColor:v.carColor,
      rating:'—',
      photo:''
    }};
  }

  window.HA_TransportProfile={current,customerOrLogin,driverIdentity,vehicle,saveVehicle};
})();
