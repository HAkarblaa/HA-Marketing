// HA Marketing - transport auth/profile helper
(function(){
  const URL='https://ubayrhtshgtgggxprrek.supabase.co';
  const KEY='sb_publishable_p3108yoDkdJTLqVXhkvmBg_KVqe-1ll';
  const STORAGE_KEY='ha-marketing-auth';
  let client=null, cached=null;

  function supa(){
    if(client)return client;
    if(!window.supabase?.createClient)throw new Error('Supabase client not loaded');
    client=window.supabase.createClient(URL,KEY,{
      auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:STORAGE_KEY}
    });
    return client;
  }

  function parseStoredSessionValue(raw){
    if(!raw)return null;
    try{
      const x=JSON.parse(raw);
      const candidates=[
        x,
        x?.currentSession,
        x?.session,
        x?.data?.session,
        x?.data,
        x?.value,
        x?.value?.session
      ];
      for(const s of candidates){
        if(!s)continue;
        if(s?.user?.id && (s?.access_token || s?.accessToken)){
          return {user:s.user,access_token:s.access_token||s.accessToken,refresh_token:s.refresh_token||s.refreshToken||''};
        }
      }
    }catch(e){}
    return null;
  }

  function storedSession(){
    try{
      let raw=localStorage.getItem(STORAGE_KEY);
      let found=parseStoredSessionValue(raw);
      if(found)return found;

      // Support sessions saved previously under Supabase's default key.
      for(let i=0;i<localStorage.length;i++){
        const k=localStorage.key(i)||'';
        if(k===STORAGE_KEY)continue;
        if(/^sb-.*-auth-token$/.test(k)){
          found=parseStoredSessionValue(localStorage.getItem(k));
          if(found){
            try{localStorage.setItem(STORAGE_KEY,localStorage.getItem(k));}catch(e){}
            return found;
          }
        }
      }
    }catch(e){}
    return null;
  }

  async function authUser(){
    const db=supa();

    // 1) First read the persisted session used by login.html.
    try{
      const {data}=await db.auth.getSession();
      if(data?.session?.user)return data.session.user;
    }catch(e){}

    // 2) Then ask Supabase directly.
    try{
      const {data}=await db.auth.getUser();
      if(data?.user)return data.user;
    }catch(e){}

    // 3) Final fallback: read the exact saved session from localStorage.
    const saved=storedSession();
    if(saved?.user?.id){
      // Restore it into this client when possible so subsequent authenticated
      // requests also use the same session.
      if(saved.access_token && saved.refresh_token){
        try{
          const r=await db.auth.setSession({
            access_token:saved.access_token,
            refresh_token:saved.refresh_token
          });
          if(r?.data?.user)return r.data.user;
          if(r?.data?.session?.user)return r.data.session.user;
        }catch(e){}
      }
      return saved.user;
    }

    return null;
  }

  async function current(force=false){
    if(cached&&!force)return cached;

    const db=supa();
    const user=await authUser();
    if(!user?.id)return null;

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
      employee_role:p?.employee_role||meta.employee_role||meta.employee_role_key||null
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
    if(!p)return {ok:false,message:'لازم تسجل الدخول أولاً.'};

    const db=supa();

    // صلاحية السائق ممكن تجي من حساب موظف قديم أو من بوابة الانضمام الجديدة.
    const employeeApproved=(p.account_type==='employee' && p.employee_status==='approved');

    let transport=null;
    try{
      const r=await db.from('transport_profiles')
        .select('user_id,role_type,full_name,phone,vehicle_type,vehicle_model,vehicle_color,plate_number,governorate,status')
        .eq('user_id',p.id)
        .maybeSingle();
      if(!r.error&&r.data)transport=r.data;
    }catch(e){}

    let approvedApp=null;
    try{
      const r=await db.from('marketplace_applications')
        .select('role_type,display_name,phone,governorate,details,status')
        .eq('user_id',p.id)
        .in('role_type',['taxi_driver','delivery_driver'])
        .eq('status','approved')
        .order('updated_at',{ascending:false})
        .limit(1);
      if(!r.error&&r.data?.length)approvedApp=r.data[0];
    }catch(e){}

    const marketplaceApproved=!!approvedApp || transport?.status==='approved';

    if(!employeeApproved && !marketplaceApproved){
      return {
        ok:false,
        message:'لا توجد صلاحية عمل مفعّلة لهذا الحساب. قدّم طلب سائق/مندوب وانتظر موافقة الإدارة.'
      };
    }

    const local=vehicle()||{};
    const dbVehicle={
      plate:transport?.plate_number||'',
      carName:transport?.vehicle_model||transport?.vehicle_type||'',
      carColor:transport?.vehicle_color||''
    };
    const v={
      plate:local.plate||dbVehicle.plate,
      carName:local.carName||dbVehicle.carName,
      carColor:local.carColor||dbVehicle.carColor
    };

    // إذا كانت البيانات موجودة في Supabase نخزنها محلياً حتى تستخدمها واجهة السائق.
    if(v.plate||v.carName||v.carColor){
      try{saveVehicle(v)}catch(e){}
    }

    if(!v.plate||!v.carName||!v.carColor){
      return {
        ok:false,
        needsVehicle:true,
        profile:p,
        message:'صلاحية العمل فعالة. أكمل معلومات المركبة أولاً.'
      };
    }

    let workType=approvedApp?.role_type||transport?.role_type||'taxi_driver';
    const details=String(approvedApp?.details||'');
    const vehicleText=String(transport?.vehicle_type||v.carName||'');
    const isTuktuk=/تكتك|tuktuk/i.test(details+' '+vehicleText);

    // نوع السائق المسجل يحدد أي طلبات تظهر له داخل واجهة السائق.
    // تكسي: رحلات التكسي + توصيل بسيارة.
    // تكتك: رحلات التكتك + توصيل بتكتك.
    // مندوب: توصيل المندوب/الدراجة فقط.
    const driverKind=
      workType==='delivery_driver' ? 'delivery' :
      isTuktuk ? 'tuktuk' : 'taxi';

    const dispatchTypes=
      driverKind==='delivery' ? ['delivery_courier'] :
      driverKind==='tuktuk' ? ['tuktuk','delivery_tuktuk'] :
      ['taxi','delivery_car'];

    const workLabel=
      driverKind==='delivery' ? 'مندوب توصيل' :
      driverKind==='tuktuk' ? 'سائق تكتك' : 'سائق تكسي';

    return {ok:true,profile:p,workType,workLabel,driverKind,dispatchTypes,isTuktuk,driver:{
      userId:p.id,
      name:transport?.full_name||approvedApp?.display_name||p.full_name||p.username||'السائق',
      phone:transport?.phone||approvedApp?.phone||p.phone||'',
      plate:v.plate,
      carName:v.carName,
      carColor:v.carColor,
      rating:'—',
      photo:''
    }};
  }

  window.HA_TransportProfile={current,customerOrLogin,driverIdentity,vehicle,saveVehicle};
})();
