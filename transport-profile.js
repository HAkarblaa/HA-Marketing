// HA Marketing - real logged-in profile helper for transport pages
(function(){
  const URL='https://ubayrhtshgtgggxprrek.supabase.co';
  const KEY='sb_publishable_p3108yoDkdJTLqVXhkvmBg_KVqe-1ll';
  let client=null, cached=null;
  function supa(){
    if(client)return client;
    if(!window.supabase?.createClient)throw new Error('Supabase client not loaded');
    client=window.supabase.createClient(URL,KEY);
    return client;
  }
  async function current(){
    if(cached)return cached;
    const db=supa();
    const {data,error}=await db.auth.getUser();
    if(error||!data?.user)return null;
    const {data:p,error:pe}=await db.from('profiles').select('id,full_name,username,phone,account_type,employee_status,employee_role').eq('id',data.user.id).maybeSingle();
    if(pe||!p)return null;
    cached={...p,user_id:data.user.id};
    return cached;
  }
  function vehicle(){
    try{return JSON.parse(localStorage.getItem('ha_driver_vehicle')||'null')}catch(e){return null}
  }
  function saveVehicle(v){localStorage.setItem('ha_driver_vehicle',JSON.stringify(v||{}));}
  async function customerOrLogin(){
    const p=await current();
    if(!p){
      alert('لازم تسجل الدخول بحسابك أولاً حتى ترسل الطلب.');
      location.href='login.html';
      return null;
    }
    return {id:p.id,name:p.full_name||p.username||'الزبون',phone:p.phone||''};
  }
  async function driverIdentity(){
    const p=await current();
    if(!p)return {ok:false,message:'لازم تسجل الدخول بحساب الموظف أولاً.'};
    if(p.account_type!=='employee')return {ok:false,message:'واجهة السائق مخصصة لحسابات الموظفين فقط.'};
    if(p.employee_status!=='approved')return {ok:false,message:'حساب الموظف لازم يكون موافق عليه من الإدارة قبل استقبال الطلبات.'};
    const v=vehicle()||{};
    if(!v.plate||!v.carName||!v.carColor)return {ok:false,needsVehicle:true,profile:p,message:'أدخل معلومات المركبة الحقيقية أولاً.'};
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
