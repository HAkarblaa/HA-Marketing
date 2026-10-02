(function(){
  'use strict';

  const SB_URL='https://ubayrhtshgtgggxprrek.supabase.co';
  const SB_KEY='sb_publishable_p3108yoDkdJTLqVXhkvmBg_KVqe-1ll';
  const STORAGE_KEY='ha-marketing-auth';

  const file=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  const hash=(location.hash||'').toLowerCase();
  const params=new URLSearchParams(location.search);

  const GROUPS={
    shop:new Set(['shop.html','shop-section.html','shop-business.html','cart.html','shop-orders.html','seller-dashboard.html','shop-store-suggestion.html']),
    services:new Set(['services.html','add-service.html','service-orders.html','track-service.html','provider-dashboard.html','service-provider.html','employee-orders.html']),
    transport:new Set(['taxi-delivery.html','taxi.html','delivery.html','tuktuk.html','cargo.html','driver.html','transport-registration.html','transport-my-rides.html','transport-directory.html','student-transport.html','employee-student-transport.html','shop-courier.html']),
    sports:new Set(['sports.html','sports-owner.html','gym.html','football.html','football-news.html']),
    entertainment:new Set(['entertainment.html','games.html','games-hub.html','games-ranking.html']),
    news:new Set(['news.html']),
    religious:new Set(['religious.html']),
    chat:new Set(['chat.html'])
  };

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
      return {role:'الزبون',items:[
        it('home','🏠','الرئيسية','index.html'),
        it('shop','🛍️','التسوق','shop.html'),
        it('cart','🛒','السلة','cart.html'),
        it('orders','📦','طلباتي','shop-orders.html'),
        it('join','🏪','انضم كبائع','marketplace-onboarding.html')
      ]};
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
        it('join','➕','انضم كمقدم','marketplace-onboarding.html')
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

  function render(nav,section){
    document.getElementById('haRoleBottomNav')?.remove();

    const active=activeKey(section,nav);
    const el=document.createElement('nav');
    el.id='haRoleBottomNav';
    el.dataset.section=section||'general';
    el.setAttribute('aria-label','الشريط السفلي حسب نوع الحساب');

    const visibleItems=nav.items.filter(x=>{
      const href=String(x.href||'').split('?')[0].split('#')[0].toLowerCase();
      const label=String(x.label||'').trim();
      return x.key!=='chat' &&
             href!=='chat.html' &&
             label!=='المحادثات' &&
             label!=='الدردشة';
    }).slice(0,5);

    el.style.setProperty('--ha-rbn-cols',String(Math.max(1,visibleItems.length)));

    el.innerHTML=
      `<div class="ha-rbn-role">${nav.role}</div>`+
      `<div class="ha-rbn-inner">`+
      visibleItems.map(x=>
        `<a class="ha-rbn-item ${x.key===active?'active':''}" href="${x.href}">
          <span class="ha-rbn-icon">${x.icon}</span>
          <span class="ha-rbn-label">${x.label}</span>
        </a>`
      ).join('')+
      `</div>`;

    document.body.appendChild(el);
    document.body.classList.add('ha-role-bottom-active');
  }

  function hideChatShortcuts(){
    document.querySelectorAll('a,button').forEach(el=>{
      const href=String(el.getAttribute('href')||'').split('?')[0].split('#')[0].toLowerCase();
      const txt=String(el.textContent||'').replace(/\s+/g,' ').trim();
      if(href==='chat.html' || txt==='المحادثات' || txt==='الدردشة'){
        const navLike=el.closest('nav,.ha-bottom-nav,.bottom-nav,.ha-rbn-inner,.ha-shortcuts,.shortcuts,.ha-actions,.quick-actions');
        if(navLike || href==='chat.html'){
          el.style.setProperty('display','none','important');
          el.setAttribute('aria-hidden','true');
        }
      }
    });
  }

  function watchChatShortcuts(){
    hideChatShortcuts();
    const obs=new MutationObserver(hideChatShortcuts);
    obs.observe(document.documentElement,{childList:true,subtree:true});
    setTimeout(()=>obs.disconnect(),10000);
  }

  async function start(){
    try{
      const sec=sectionOf();
      const c=await context();
      render(choose(sec,c),sec);
      watchChatShortcuts();
    }catch(_e){
      render(choose(sectionOf(),{
        apps:[],profile:null,transport:null,teacher:null,isAdmin:false,canSports:false,guest:true
      }),sectionOf());
      watchChatShortcuts();
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();