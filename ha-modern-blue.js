(function(){
  'use strict';
  var root=document.documentElement;
  root.setAttribute('data-ha-modern','1');
  root.setAttribute('data-ha-theme','light');
  root.style.colorScheme='light';
  try{
    localStorage.setItem('ha_theme_mode','light');
    localStorage.setItem('ha_theme_mode_v2','light');
    localStorage.setItem('ha-theme','light');
    localStorage.setItem('theme','light');
  }catch(e){}

  var file=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  var mainPages={
    'index.html':{key:'home',title:'HA Marketing',sub:'كل ما تحتاجه في مكان واحد',headline:'حياة أسهل تبدأ من هنا',text:'تسوّق، تعلّم، اطلب خدمة، تنقّل واستمتع بكل سهولة.',icon:'✨',cta:'استكشف الأقسام',href:'#mainGrid'},
    'shop.html':{key:'shop',title:'التسوق',sub:'اكتشف المنتجات والمتاجر بسهولة',headline:'تسوّق بذكاء وبشكل أسرع',text:'أقسام مرتبة، عروض واضحة ووصول سريع للسلة والطلبات.',icon:'🛍️',cta:'عرض الأقسام',href:'#categories'},
    'services.html':{key:'services',title:'طلب خدمة',sub:'الخدمة المناسبة بخطوات بسيطة',headline:'خدماتك اليومية في مكان واحد',text:'اختر نوع الخدمة، أرسل طلبك وتابع حالته بكل سهولة.',icon:'🛠️',cta:'اختر خدمة',href:'#categories'},
    'study.html':{key:'study',title:'الدراسة',sub:'تعلم ونظّم دراستك بسهولة',headline:'كل أدوات الدراسة بواجهة واحدة',text:'أسئلة وزارية، دورات، ملخصات، ملفات وجدول دراسي منظم.',icon:'🎓',cta:'ابدأ الدراسة',href:'ministerial-questions.html'},
    'taxi-delivery.html':{key:'transport',title:'النقل',sub:'تنقل وتوصيل بطريقة أبسط',headline:'تنقّل بسهولة في أي وقت',text:'تكسي، مندوب، تكتك، ستوتة، حمل وخطوط طلاب وموظفين.',icon:'🚕',cta:'اطلب الآن',href:'taxi.html'},
    'entertainment.html':{key:'entertainment',title:'الترفيه',sub:'ألعاب وتحديات ومحتوى ممتع',headline:'وقت ممتع بتجربة أخف وأوضح',text:'ألعاب ومسابقات وترتيب لاعبين ومحتوى ترفيهي متنوع.',icon:'🎮',cta:'استكشف الألعاب',href:'games.html'},
    'sports.html':{key:'sports',title:'الرياضة',sub:'أخبار ونتائج ونشاطات رياضية',headline:'كل ما يهمك في الرياضة',text:'كرة قدم، ملاعب، جم، أخبار وتحديات رياضية في مكان واحد.',icon:'⚽',cta:'استكشف الرياضة',href:'football.html'},
    'religious.html':{key:'religious',title:'الدينية',sub:'محتوى ديني مرتب وسهل',headline:'محتوى ديني مفيد وقريب منك',text:'قرآن، أدعية، أذكار، قبلة، مواقيت صلاة وزيارات.',icon:'📖',cta:'ابدأ التصفح',href:'quran.html'},
    'news.html':{key:'news',title:'الأخبار',sub:'أهم الأخبار في أقسام واضحة',headline:'تابع ما يهمك بدون تعقيد',text:'التربية، التعليم العالي، الرياضة والعملات في مكان واحد.',icon:'📰',cta:'عرض الأخبار',href:'#'},
    'chat.html':{key:'chat',title:'الدردشة',sub:'تواصل بسرعة داخل HA Marketing',headline:'محادثاتك أقرب وأسهل',text:'ابدأ محادثة أو ارجع لآخر تواصل بسرعة ووضوح.',icon:'💬',cta:'ابدأ محادثة',href:'#chatHub'},
    'call-us.html':{key:'contact',title:'اتصل بنا',sub:'دعم ومساعدة عند الحاجة',headline:'نحن أقرب لك',text:'اختر وسيلة التواصل المناسبة واحصل على المساعدة بسرعة.',icon:'☎️',cta:'عرض وسائل التواصل',href:'#'},
    'suggestions.html':{key:'suggest',title:'مقترحاتكم',sub:'رأيك يساعدنا على التطور',headline:'شاركنا فكرتك',text:'أرسل ملاحظتك أو اقتراحك بشكل بسيط وواضح.',icon:'💡',cta:'اكتب اقتراحك',href:'#'}
  };

  function esc(s){return String(s||'').replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]})}

  function addShell(cfg){
    if(!document.body || document.querySelector('.ha-modern-appbar')) return;
    document.body.classList.add('ha-modern-main','ha-modern-'+cfg.key);

    var app=document.createElement('header');
    app.className='ha-modern-appbar';
    app.innerHTML='<div class="ha-modern-toprow">'+
      '<div class="ha-modern-location" title="الموقع"><div><b style="color:#fff!important">موقعك الحالي</b><div style="margin-top:3px;color:rgba(255,255,255,.78)">تحديد الموقع من داخل القسم</div></div><span class="pin">📍</span></div>'+
      '<div class="ha-modern-brand"><div class="ha-modern-brandtext"><b>'+esc(cfg.title)+'</b><small>'+esc(cfg.sub)+'</small></div><div class="ha-modern-logo">HA</div></div>'+
      '</div><div class="ha-modern-search"><span class="sicon">🔍</span><input id="haModernSearch" type="search" placeholder="ابحث داخل هذا القسم..." aria-label="بحث"><span class="sicon">🎤</span></div>';
    document.body.insertBefore(app,document.body.firstChild);

    var intro=document.createElement('section');
    intro.className='ha-modern-section-intro';
    intro.innerHTML='<div class="ha-modern-intro-card"><div class="ha-modern-intro-copy"><span class="ha-modern-kicker">✦ تجربة مرتبة وسريعة</span><h1>'+esc(cfg.headline)+'</h1><p>'+esc(cfg.text)+'</p><a class="ha-modern-intro-cta" href="'+esc(cfg.href)+'">'+esc(cfg.cta)+' ←</a></div><div class="ha-modern-intro-art">'+cfg.icon+'</div></div>';
    app.insertAdjacentElement('afterend',intro);

    var nav=document.createElement('nav');
    nav.className='ha-modern-bottomnav';
    var navItems=[
      ['index.html','🏠','الرئيسية','home'],
      ['orders-center.html','📦','طلباتي','orders'],
      ['notifications-center.html','🔔','الإشعارات','notifications'],
      ['chat.html','💬','المحادثات','chat'],
      ['account.html','👤','حسابي','account']
    ];
    nav.innerHTML='<div class="ha-modern-bottominner">'+navItems.map(function(n){return '<a class="ha-modern-navitem '+(cfg.key===n[3]?'active':'')+'" href="'+n[0]+'"><span class="ni">'+n[1]+'</span><span>'+n[2]+'</span></a>'}).join('')+'</div>';
    document.body.appendChild(nav);

    var input=app.querySelector('#haModernSearch');
    input.addEventListener('input',function(){
      var q=this.value.trim().toLowerCase();
      var selectors=['.card','.c','.service-card','.category','.tool','.qcard','.store-action','.product-card','.role','.item'];
      var nodes=document.querySelectorAll(selectors.join(','));
      nodes.forEach(function(el){
        if(el.closest('.ha-modern-appbar,.ha-modern-section-intro,.ha-modern-bottomnav')) return;
        var t=(el.innerText||'').toLowerCase();
        el.style.display=(!q||t.indexOf(q)!==-1)?'':'none';
      });
    });
  }

  function boot(){
    document.querySelectorAll('#haThemeToggle,.ha-theme-toggle,[data-theme-toggle],[data-ha-theme-toggle]').forEach(function(el){el.remove()});
    var cfg=mainPages[file] || (file===''?mainPages['index.html']:null);
    if(cfg) addShell(cfg);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
