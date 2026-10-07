(function(){
  'use strict';

  const SB_URL='https://ubayrhtshgtgggxprrek.supabase.co';
  const SB_KEY='sb_publishable_p3108yoDkdJTLqVXhkvmBg_KVqe-1ll';
  const STORAGE_KEY='ha-marketing-auth';

  const file=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  const hash=(location.hash||'').toLowerCase();
  const params=new URLSearchParams(location.search);

  const GROUPS={
    shop:new Set(['shop.html','shop-section.html','shop-business.html','cart.html','shop-orders.html','order-receipt.html','seller-dashboard.html','shop-store-suggestion.html']),
    services:new Set(['services.html','add-service.html','service-orders.html','track-service.html','provider-dashboard.html','service-provider.html','employee-orders.html']),
    transport:new Set(['taxi-delivery.html','taxi.html','delivery.html','tuktuk.html','cargo.html','driver.html','transport-registration.html','transport-my-rides.html','transport-directory.html','student-transport.html','employee-student-transport.html','shop-courier.html']),
    sports:new Set(['sports.html','sports-owner.html','gym.html','football.html','football-news.html']),
    entertainment:new Set(['entertainment.html','games.html','games-hub.html','games-ranking.html']),
    news:new Set(['news.html']),
    religious:new Set(['religious.html']),
    chat:new Set(['chat.html'])
  };

  const SHOP_CUSTOMER_VIEWS=new Set([
    'shop-section.html','shop-business.html','cart.html',
    'shop-orders.html','order-receipt.html','shop-store-suggestion.html'
  ]);

  function sectionOf(){
    if(file.startsWith('study-')||file.startsWith('teacher-')||file.startsWith('student-my-')||file==='study.html'||file==='courses.html') return 'study';
    for(const [k,set] of Object.entries(GROUPS)) if(set.has(file)) return k;
    return 'general';
  }

  function loadSupabase(){
    if(window.supabase)return Promise.resolve();
    return new Promise((resolve,reject)=>{
      const old=document.querySelector('script[data-ha-role-supabase]');
      if(old){
        old.addEventListener('load',resolve,{once:true});
        old.addEventListener('error',reject,{once:true});
        return;
      }
      const s=document.createElement('script');
      s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      s.async=true;
      s.dataset.haRoleSupabase='1';
      s.onload=resolve;
      s.onerror=reject;
      document.head.appendChild(s);
    });
  }

  const safe=async(fn,def=null)=>{
    try{
      const v=await fn();
      return v??def;
    }catch(_e){return def}
  };

  function roleApp(apps,role){
    return apps.some(x=>x.role_type===role && x.status==='approved');
  }

  async function context(){
    await loadSupabase();
    const db=window.supabase.createClient(SB_URL,SB_KEY,{
      auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:STORAGE_KEY}
    });

    const {data:{session}}=await db.auth.getSession();
    if(!session)return {db,user:null,guest:true,apps:[],profile:null,transport:null,teacher:null,isAdmin:false,canSports:false};

    const uid=session.user.id;

    const [profileR,appsR,transportR,teacherR,adminR,sportsR]=await Promise.all([
      safe(()=>db.from('profiles').select('account_type,employee_status,employee_role,employee_role_id').eq('id',uid).maybeSingle(),{}),
      safe(()=>db.from('marketplace_applications').select('role_type,status,details').eq('user_id',uid),{}),
      safe(()=>db.from('transport_profiles').select('role_type,status,vehicle_type').eq('user_id',uid).maybeSingle(),{}),
      safe(()=>db.from('study_teachers').select('is_approved,is_active').eq('user_id',uid).maybeSingle(),{}),
      safe(()=>db.rpc('is_super_admin'),{}),
      safe(()=>db.rpc('can_manage_sports'),{})
    ]);

    return {
      db,
      user:session.user,
      guest:false,
      profile:profileR?.data||null,
      apps:appsR?.data||[],
      transport:transportR?.data||null,
      teacher:teacherR?.data||null,
      isAdmin:adminR?.data===true,
      canSports:sportsR?.data===true
    };
  }

  function it(key,icon,label,href){return {key,icon,label,href}}

  function customerShopNav(){
    return {role:'الزبون',items:[
      it('home','🏠','الرئيسية','index.html'),
      it('shop','🛍️','التسوق','shop.html'),
      it('cart','🛒','السلة','cart.html'),
      it('orders','📦','طلباتي','shop-orders.html'),
      it('join','🏪','انضم كبائع','seller-registration.html')
    ]};
  }

  function adminNav(section){
    const sectionData={
      shop:['🛍️','التسوق','shop.html','admin-shop.html'],
      services:['🛠️','الخدمات','services.html','admin-services.html'],
      study:['🎓','الدراسة','study.html','admin-study.html'],
      transport:['🚕','النقل','taxi-delivery.html','admin-transport.html'],
      sports:['⚽','الرياضة','sports.html','sports-owner.html'],
      entertainment:['🎮','الترفيه','entertainment.html','admin-content.html?section=entertainment'],
      news:['📰','الأخبار','news.html','admin-content.html?section=news'],
      religious:['🕌','الدينية','religious.html','admin-content.html?section=religious'],
      chat:['💬','الدردشة','chat.html','admin-panel.html'],
      general:['📂','القسم','index.html','admin-panel.html']
    }[section]||['📂','القسم','index.html','admin-panel.html'];

    return {
      role:'الأدمن الرئيسي',
      items:[
        it('home','🏠','الرئيسية','index.html'),
        it('section',sectionData[0],sectionData[1],sectionData[2]),
        it('manage','🛡️','إدارة القسم',sectionData[3]),
        it('notify','🔔','الإشعارات','notifications-center.html'),
        it('account','👤','حسابي','account.html')
      ]
    };
  }

  function choose(section,c){
    const apps=c.apps||[];
    const employee=c.profile?.account_type==='employee' && c.profile?.employee_status==='approved';
    const seller=roleApp(apps,'seller');
    const provider=roleApp(apps,'service_provider');
    const sportsManager=roleApp(apps,'sports_manager') || c.canSports;
    const gamesManager=roleApp(apps,'games_manager');
    const teacher=!!(c.teacher?.is_approved && c.teacher?.is_active!==false);

    let transportRole='';
    if(c.transport?.status==='approved')transportRole=c.transport.role_type||'';
    if(!transportRole){
      const a=apps.find(x=>x.status==='approved' && ['taxi_driver','delivery_driver','stoota_driver','cargo_driver','tuktuk_driver'].includes(x.role_type));
      transportRole=a?.role_type||'';
    }

    // Browsing stores and checking out uses the customer navigation for all buyers.
    if(section==='shop' && SHOP_CUSTOMER_VIEWS.has(file))return customerShopNav();
    if(c.isAdmin)return adminNav(section);

    if(section==='shop'){
      if(seller){
        return {role:'صاحب متجر',items:[
          it('home','🏠','الرئيسية','index.html'),
          it('store','🏪','متجري','seller-dashboard.html#store'),
          it('add','➕','إضافة منتج','seller-dashboard.html#add-product'),
          it('orders','📋','الطلبات','seller-dashboard.html#orders'),
          it('courier','🛵','طلب مندوب','seller-dashboard.html#orders')
        ]};
      }
      return customerShopNav();
    }

    if(section==='services'){
      if(provider){
        return {role:'مقدم الخدمة',items:[
          it('home','🏠','الرئيسية','index.html'),
          it('services','🛠️','الخدمات','services.html'),
          it('requests','📥','الطلبات','provider-dashboard.html?view=requests'),
          it('add','➕','إضافة خدمة','add-service.html'),
          it('profile','🧰','ملفي المهني','provider-dashboard.html')
        ]};
      }
      if(employee){
        return {role:'الموظف',items:[
          it('home','🏠','الرئيسية','index.html'),
          it('services','🛠️','الخدمات','services.html'),
          it('jobs','📋','مهامي','employee-orders.html'),
          it('notify','🔔','الإشعارات','notifications-center.html'),
          it('account','👤','حسابي','account.html')
        ]};
      }
      return {role:'الزبون',items:[
        it('home','🏠','الرئيسية','index.html'),
        it('services','🛠️','طلب خدمة','services.html'),
        it('orders','📋','طلباتي','service-orders.html'),
        it('track','📍','التتبع','track-service.html'),
        it('join','➕','انضم كمقدم','service-provider-registration.html')
      ]};
    }

    if(section==='study'){
      if(teacher){
        return {role:'المدرس',items:[
          it('home','🏠','الرئيسية','index.html'),
          it('study','🎓','الدراسة','study.html'),
          it('classes','📚','صفوفي','teacher-my-classes.html'),
          it('manage','➕','إنشاء صف','teacher-classes.html'),
          it('account','👤','حسابي','account.html')
        ]};
      }
      return {role:'الطالب',items:[
        it('home','🏠','الرئيسية','index.html'),
        it('study','🎓','الدراسة','study.html'),
        it('classes','📚','صفوفي','student-my-classes.html'),
        it('profile','🪪','ملفي الدراسي','study-profile.html'),
        it('library','📖','المكتبة','study-library.html')
      ]};
    }

    if(section==='transport'){
      if(transportRole){
        const deliveryDriver=transportRole==='delivery_driver';
        return {role:deliveryDriver?'مندوب التوصيل':'السائق',items:[
          it('home','🏠','الرئيسية','index.html'),
          it('transport','🚕','النقل','taxi-delivery.html'),
          it('driver',deliveryDriver?'🛵':'🚘',deliveryDriver?'واجهة المندوب':'واجهة السائق','driver.html'),
          it('requests','📥','الطلبات',deliveryDriver?'shop-courier.html':'driver.html#requestsSection'),
          it('rides','🧾','رحلاتي','transport-my-rides.html')
        ]};
      }
      if(employee && file==='employee-student-transport.html'){
        return {role:'موظف نقل الطلاب',items:[
          it('home','🏠','الرئيسية','index.html'),
          it('transport','🚕','النقل','taxi-delivery.html'),
          it('student','🚌','نقل الطلاب','employee-student-transport.html'),
          it('jobs','📋','مهامي','employee-orders.html'),
          it('account','👤','حسابي','account.html')
        ]};
      }
      return {role:'الزبون / الراكب',items:[
        it('home','🏠','الرئيسية','index.html'),
        it('transport','🚕','النقل','taxi-delivery.html'),
        it('rides','🧾','رحلاتي','transport-my-rides.html'),
        it('taxi','🚖','طلب تكسي','taxi.html'),
        it('delivery','🛵','طلب مندوب','delivery.html')
      ]};
    }

    if(section==='sports'){
      if(sportsManager){
        return {role:'صاحب ملعب / جم',items:[
          it('home','🏠','الرئيسية','index.html'),
          it('sports','⚽','الرياضة','sports.html'),
          it('manage','🏟️','إدارتي','sports-owner.html'),
          it('bookings','📋','الحجوزات','sports-owner.html#bookings'),
          it('account','👤','حسابي','account.html')
        ]};
      }
      return {role:'المستخدم',items:[
        it('home','🏠','الرئيسية','index.html'),
        it('sports','⚽','الرياضة','sports.html'),
        it('gyms','🏟️','الملاعب والجم','gym.html'),
        it('football','⚽','كرة القدم','football.html'),
        it('account','👤','حسابي','account.html')
      ]};
    }

    if(section==='entertainment'){
      if(gamesManager){
        return {role:'إدارة الألعاب',items:[
          it('home','🏠','الرئيسية','index.html'),
          it('fun','🎮','الترفيه','entertainment.html'),
          it('games','🕹️','الألعاب','games.html'),
          it('manage','⚙️','إدارة الألعاب','work-center.html'),
          it('account','👤','حسابي','account.html')
        ]};
      }
      return {role:'المستخدم',items:[
        it('home','🏠','الرئيسية','index.html'),
        it('fun','🎮','الترفيه','entertainment.html'),
        it('games','🕹️','الألعاب','games-hub.html'),
        it('rank','🏆','التصنيف','games-ranking.html'),
        it('account','👤','حسابي','account.html')
      ]};
    }

    if(section==='news'){
      return {role:'المستخدم',items:[
        it('home','🏠','الرئيسية','index.html'),
        it('news','📰','الأخبار','news.html'),
        it('notify','🔔','الإشعارات','notifications-center.html'),
        it('chat','💬','المحادثات','chat.html'),
        it('account','👤','حسابي','account.html')
      ]};
    }

    if(section==='religious'){
      return {role:'المستخدم',items:[
        it('home','🏠','الرئيسية','index.html'),
        it('religious','🕌','الدينية','religious.html'),
        it('quran','📖','القرآن','quran.html'),
        it('duas','🤲','الأدعية','duas.html'),
        it('account','👤','حسابي','account.html')
      ]};
    }

    if(section==='chat'){
      return {role:'المستخدم',items:[
        it('home','🏠','الرئيسية','index.html'),
        it('chat','💬','المحادثات','chat.html'),
        it('notify','🔔','الإشعارات','notifications-center.html'),
        it('orders','📦','طلباتي','orders-center.html'),
        it('account','👤','حسابي','account.html')
      ]};
    }

    return {role:employee?'الموظف':'المستخدم',items:[
      it('home','🏠','الرئيسية','index.html'),
      it('orders','📦','طلباتي','orders-center.html'),
      it('chat','💬','المحادثات','chat.html'),
      it('notify','🔔','الإشعارات','notifications-center.html'),
      it('account','👤','حسابي','account.html')
    ]};
  }

  function activeKey(section,nav){
    const hrefFile=(h)=>String(h||'').split('#')[0].split('?')[0].toLowerCase();

    if(file==='seller-dashboard.html'){
      if(hash.includes('add-product'))return 'add';
      if(hash.includes('orders'))return hash.includes('orders')?'orders':'store';
      return 'store';
    }
    if(file==='provider-dashboard.html'){
      return params.get('view')==='requests'?'requests':'profile';
    }
    if(file==='teacher-classes.html')return 'manage';
    if(file==='teacher-my-classes.html')return 'classes';
    if(file==='student-my-classes.html')return 'classes';
    if(file==='study-profile.html')return 'profile';
    if(file==='study-library.html')return 'library';
    if(file==='driver.html')return hash.includes('requests')?'requests':'driver';
    if(file==='shop-courier.html')return 'requests';
    if(file==='order-receipt.html')return 'orders';
    if(file==='transport-my-rides.html')return 'rides';
    if(file==='sports-owner.html')return hash.includes('bookings')?'bookings':'manage';
    if(file==='games-ranking.html')return 'rank';
    if(file==='games.html'||file==='games-hub.html')return 'games';

    const exact=nav.items.find(x=>hrefFile(x.href)===file);
    return exact?.key||(
      section==='shop'?'shop':
      section==='services'?'services':
      section==='study'?'study':
      section==='transport'?'transport':
      section==='sports'?'sports':
      section==='entertainment'?'fun':
      section==='news'?'news':
      section==='religious'?'religious':
      section==='chat'?'chat':'home'
    );
  }

  function iconSvg(key){
    const map={
      home:'<svg viewBox="0 0 24 24"><path d="M3 10.5 12 3l9 7.5v9a1.5 1.5 0 0 1-1.5 1.5H15v-6H9v6H4.5A1.5 1.5 0 0 1 3 19.5z"/></svg>',
      account:'<svg viewBox="0 0 24 24"><circle cx="12" cy="7.5" r="4"/><path d="M4.5 21c.6-5 3.1-7.5 7.5-7.5S18.9 16 19.5 21z"/></svg>',
      notify:'<svg viewBox="0 0 24 24"><path d="M6 17h12l-1.5-2.5V10a4.5 4.5 0 0 0-9 0v4.5z"/><path d="M10 19a2 2 0 0 0 4 0"/></svg>',
      orders:'<svg viewBox="0 0 24 24"><rect x="5" y="3.5" width="14" height="17" rx="2.5"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
      requests:'<svg viewBox="0 0 24 24"><rect x="5" y="3.5" width="14" height="17" rx="2.5"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
      cart:'<svg viewBox="0 0 24 24"><path d="M3 4h2l2.2 10h9.8l2-7H7"/><circle cx="9" cy="19" r="1.6"/><circle cx="17" cy="19" r="1.6"/></svg>',
      shop:'<svg viewBox="0 0 24 24"><path d="M4 9h16l-1-5H5z"/><path d="M5 9v11h14V9"/><path d="M9 20v-6h6v6"/></svg>',
      store:'<svg viewBox="0 0 24 24"><path d="M4 9h16l-1-5H5z"/><path d="M5 9v11h14V9"/><path d="M9 20v-6h6v6"/></svg>',
      add:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M7 12h10"/></svg>',
      join:'<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M3.5 20c.5-4 2.4-6 5.5-6 1.8 0 3.1.6 4 1.5M18 10v7M14.5 13.5h7"/></svg>',
      services:'<svg viewBox="0 0 24 24"><path d="m14.5 5.5 4 4-9 9-4 1 1-4z"/><path d="m13 7 4 4M5 5l4 4"/></svg>',
      profile:'<svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="9" r="3"/><path d="M8.5 17c.5-2.4 1.7-3.6 3.5-3.6s3 1.2 3.5 3.6"/></svg>',
      jobs:'<svg viewBox="0 0 24 24"><rect x="3.5" y="6" width="17" height="13" rx="2"/><path d="M9 6V4h6v2M3.5 11h17"/></svg>',
      track:'<svg viewBox="0 0 24 24"><path d="M12 21s6-5.3 6-11a6 6 0 1 0-12 0c0 5.7 6 11 6 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
      study:'<svg viewBox="0 0 24 24"><path d="m3 8 9-5 9 5-9 5z"/><path d="M6 10.5V16c3.5 2.4 8.5 2.4 12 0v-5.5"/></svg>',
      classes:'<svg viewBox="0 0 24 24"><path d="M4 5h7v14H4zM13 5h7v14h-7z"/></svg>',
      library:'<svg viewBox="0 0 24 24"><path d="M4 4h5v16H4zM10 4h5v16h-5zM16 4h4v16h-4z"/></svg>',
      transport:'<svg viewBox="0 0 24 24"><path d="M5 7h14l2 6v5H3v-5z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>',
      driver:'<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3"/><path d="M5 20c.7-4.2 3-6.3 7-6.3s6.3 2.1 7 6.3"/></svg>',
      rides:'<svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h8M8 15h5"/></svg>',
      taxi:'<svg viewBox="0 0 24 24"><path d="M6 8h12l2 5v5H4v-5z"/><path d="M9 8V6h6v2"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>',
      delivery:'<svg viewBox="0 0 24 24"><path d="M3 10h11v7H3zM14 12h4l3 3v2h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>',
      sports:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m12 7 3 2-.8 3.5h-4.4L9 9z"/></svg>',
      fun:'<svg viewBox="0 0 24 24"><path d="M7 8h10a4 4 0 0 1 4 4v3a3 3 0 0 1-5.2 2l-1.3-1.5h-5L8.2 17A3 3 0 0 1 3 15v-3a4 4 0 0 1 4-4z"/></svg>',
      games:'<svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="14" rx="4"/><path d="M8 10v4M6 12h4"/></svg>',
      rank:'<svg viewBox="0 0 24 24"><path d="M7 4h10v4a5 5 0 0 1-10 0z"/><path d="M12 13v4M8 21h8M9 17h6"/></svg>',
      news:'<svg viewBox="0 0 24 24"><rect x="5" y="4" width="14" height="16" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
      religious:'<svg viewBox="0 0 24 24"><path d="M4 20h16M6 20v-9l6-5 6 5v9M9 20v-5h6v5"/></svg>',
      quran:'<svg viewBox="0 0 24 24"><path d="M4 5c3-1 5-.5 8 1v14c-3-1.5-5-2-8-1zM20 5c-3-1-5-.5-8 1v14c3-1.5 5-2 8-1z"/></svg>',
      duas:'<svg viewBox="0 0 24 24"><path d="M7 13c-1-3 0-5 2-6 1 0 2 1 2 3v3M17 13c1-3 0-5-2-6-1 0-2 1-2 3v3"/></svg>',
      manage:'<svg viewBox="0 0 24 24"><path d="M12 3 5 6v5c0 4.7 2.7 8 7 10 4.3-2 7-5.3 7-10V6z"/><path d="m9 12 2 2 4-4"/></svg>',
      section:'<svg viewBox="0 0 24 24"><rect x="4" y="4" width="6" height="6" rx="1.5"/><rect x="14" y="4" width="6" height="6" rx="1.5"/><rect x="4" y="14" width="6" height="6" rx="1.5"/><rect x="14" y="14" width="6" height="6" rx="1.5"/></svg>',
      courier:'<svg viewBox="0 0 24 24"><path d="M3 9h11v7H3zM14 11h4l3 3v2h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>',
      student:'<svg viewBox="0 0 24 24"><rect x="4" y="7" width="16" height="10" rx="2"/></svg>',
      gyms:'<svg viewBox="0 0 24 24"><path d="M3 9h3v6H3zM18 9h3v6h-3zM6 7h3v10H6zM15 7h3v10h-3zM9 11h6v2H9z"/></svg>',
      football:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/></svg>'
    };
    return map[key]||map.section;
  }

  function render(nav,section){
    document.getElementById('haRoleBottomNav')?.remove();

    const active=activeKey(section,nav);
    const items=(nav.items||[]).filter(x=>{
      const href=String(x.href||'').split('?')[0].split('#')[0].toLowerCase();
      const label=String(x.label||'').trim();
      return x.key!=='chat' && href!=='chat.html' && label!=='المحادثات' && label!=='الدردشة';
    }).slice(0,5);

    const el=document.createElement('nav');
    el.id='haRoleBottomNav';
    el.dataset.section=section||'general';
    el.setAttribute('aria-label','الشريط السفلي');
    el.style.setProperty('--ha-nav-count',String(Math.max(1,items.length)));

    el.innerHTML='<div class="ha-rbn-inner">'+items.map(x=>
      `<a class="ha-rbn-item ${x.key===active?'active':''}" href="${x.href}">
        <span class="ha-rbn-icon" data-key="${x.key}">${iconSvg(x.key)}</span>
        <span class="ha-rbn-label">${x.label}</span>
      </a>`
    ).join('')+'</div>';

    document.body.appendChild(el);
    document.body.classList.add('ha-role-bottom-active');
  }

  async function start(){
    try{
      const sec=sectionOf();
      if(sec==='shop' && SHOP_CUSTOMER_VIEWS.has(file))render(customerShopNav(),sec);
      const c=await context();
      render(choose(sec,c),sec);
    }catch(_e){
      render(choose(sectionOf(),{
        apps:[],profile:null,transport:null,teacher:null,isAdmin:false,canSports:false,guest:true
      }),sectionOf());
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();

/* HA Marketing multilingual loader */
(function(){
  if(window.__haI18nRequested||window.__haI18nLoaded)return;
  window.__haI18nRequested=true;
  var s=document.createElement('script');
  s.src='ha-i18n.js?v=20261008-all-sections1';
  s.defer=true;
  document.head.appendChild(s);
})();
