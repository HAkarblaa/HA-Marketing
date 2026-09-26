(function(){
  'use strict';
  function q(s,r){return (r||document).querySelector(s)}
  function qa(s,r){return Array.from((r||document).querySelectorAll(s))}
  function path(){return (location.pathname||'').split('/').pop().toLowerCase()||'index.html'}
  function isAdmin(){return /^admin/.test(path()) || ['login.html','register.html','forgot-password.html','delete-account.html'].includes(path())}
  function isGame(){return ['bird-game.html','brick-breaker.html','car-dodge.html','coin-runner.html','game-leaderboard.html','games-hub.html','games-ranking.html','games.html','jumper.html','level-devil.html','ludo.html','penalties.html','sniper-battle.html','snake.html','chess.html','domino.html','backgammon.html','yugioh.html'].includes(path())}
  function isUserPage(){return !isAdmin() && !isGame() && path()!=='privacy-policy.html'}

  document.documentElement.setAttribute('data-ha-theme','light');
  document.documentElement.style.colorScheme='light';
  try{localStorage.setItem('ha_theme_mode','light')}catch(e){}

  function updateNotificationBadges(){
    var count=0;
    try{count=parseInt(localStorage.getItem('ha_notification_count')||'0',10)||0}catch(e){}
    var existing=q('.notification-badge,.badge-notification,[data-notification-count]');
    if(existing){var n=parseInt(existing.textContent||existing.getAttribute('data-notification-count')||'0',10);if(n>count)count=n}
    qa('.ha-notify-count').forEach(function(el){el.textContent=count>99?'99+':String(count);el.classList.toggle('show',count>0)});
  }

  function currentNavKey(){
    var p=path();
    if(p==='account.html'||p==='account-security.html'||p==='personal-center.html')return 'account';
    if(p==='chat.html')return 'chat';
    if(p==='notifications-center.html')return 'notifications';
    if(/order|receipt|ride-history/.test(p))return 'orders';
    return 'home';
  }

  function injectBottomNav(){
    if(!isUserPage())return;
    if(q('.ha-bottom'))return;
    if(q('.bottom,.bottom-nav,.bottomBar,.bottom-bar,nav.bottom'))return;
    var key=currentNavKey();
    var nav=document.createElement('nav');
    nav.className='ha-bottom';
    nav.innerHTML='<div class="ha-bottom-inner">'+
      '<a class="ha-nav '+(key==='home'?'active':'')+'" href="index.html"><span class="nicon">🏠</span><span>الرئيسية</span></a>'+
      '<a class="ha-nav '+(key==='orders'?'active':'')+'" href="orders-center.html"><span class="nicon">🛍️</span><span>طلباتي</span></a>'+
      '<a class="ha-nav '+(key==='notifications'?'active':'')+'" href="notifications-center.html"><span class="nicon ha-nav-badge">🔔</span><span>الإشعارات</span></a>'+
      '<a class="ha-nav '+(key==='chat'?'active':'')+'" href="chat.html"><span class="nicon">💬</span><span>المحادثات</span></a>'+
      '<a class="ha-nav '+(key==='account'?'active':'')+'" href="account.html"><span class="nicon">👤</span><span>حسابي</span></a>'+
    '</div>';
    document.body.appendChild(nav);
  }

  function injectHeader(){
    if(!isUserPage())return;
    if(q('.ha-header,.ha-global-shell'))return;
    if(q('header,.header,.topbar,.navbar,.appbar'))return;
    var shell=document.createElement('div');
    shell.className='ha-global-shell';
    shell.innerHTML='<div class="ha-global-shell-inner">'+
      '<a class="ha-global-logo" href="index.html"><img src="ha-logo-transparent.png" alt="HA"><strong>HA Marketing</strong></a>'+
      '<span class="ha-global-spacer"></span>'+
      '<button class="ha-global-location" type="button" id="haGlobalLocation">📍 <span>موقعك الحالي</span></button>'+
      '<a class="ha-global-notify" href="notifications-center.html" aria-label="الإشعارات">🔔<span class="ha-notify-count"></span></a>'+
    '</div></div>'+
    '<div class="ha-global-search"><span class="ha-gs-icon">⌕</span><input id="haGlobalSearch" type="search" placeholder="ماذا تريد أن تفعل؟"><span class="ha-gs-mic">🎙️</span></div>';
    document.body.insertBefore(shell,document.body.firstChild);
  }

  function bindLocation(){
    var targets=qa('#haLocation,#haGlobalLocation,.ha-location');
    targets.forEach(function(loc){
      if(loc.dataset.haBound)return;loc.dataset.haBound='1';
      loc.addEventListener('click',function(){
        var sub=q('small',loc)||q('span',loc);
        if(!navigator.geolocation){if(sub)sub.textContent='الموقع غير مدعوم';return}
        if(sub)sub.textContent='جاري تحديد الموقع...';
        navigator.geolocation.getCurrentPosition(function(p){
          if(sub)sub.textContent='تم تحديد موقعك ✓';
          try{localStorage.setItem('ha_last_lat',p.coords.latitude);localStorage.setItem('ha_last_lng',p.coords.longitude)}catch(e){}
        },function(){if(sub)sub.textContent='فعّل إذن الموقع';},{enableHighAccuracy:true,timeout:9000,maximumAge:60000});
      });
    });
  }

  function searchableCards(){
    var selectors=['[data-search]','.ha-card','.ha-cat','.card','.service-card','.product-card','.store-card','.provider-card','.category','.role','.tool','.qcard','.feature','.order-row','.request-card'];
    return qa(selectors.join(',')).filter(function(el){return el.offsetParent!==null && !el.closest('.ha-bottom')});
  }
  function bindSearch(){
    qa('#haSearch,#haGlobalSearch').forEach(function(search){
      if(search.dataset.haBound)return;search.dataset.haBound='1';
      search.addEventListener('input',function(){
        var term=(this.value||'').trim().toLowerCase();
        var shown=0;
        searchableCards().forEach(function(el){
          var hay=((el.getAttribute('data-search')||'')+' '+(el.textContent||'')).toLowerCase();
          var ok=!term||hay.indexOf(term)>-1;
          el.style.display=ok?'':'none';if(ok)shown++;
        });
        var empty=q('#haEmpty');if(empty)empty.style.display=(term&&shown===0)?'block':'none';
      });
    });
  }

  function classifyStates(){
    qa('.status,.message,.msg,.notice,.empty,.loading,.error,.alert').forEach(function(el){
      var t=(el.textContent||'').trim();
      el.classList.remove('ha-state-loading','ha-state-empty','ha-state-error','ha-state-success');
      if(/جاري|تحميل|انتظر/.test(t))el.classList.add('ha-state-loading');
      else if(/لا توجد|لا يوجد|فارغ|لم يتم العثور/.test(t))el.classList.add('ha-state-empty');
      else if(/خطأ|تعذر|فشل|غير متاح|❌/.test(t))el.classList.add('ha-state-error');
      else if(/نجاح|تم |جاهز|✅/.test(t))el.classList.add('ha-state-success');
    });
  }

  function injectRequestSteps(){
    if(!isUserPage()||q('.ha-request-steps'))return;
    var p=path();
    if(!['taxi.html','delivery.html','tuktuk.html','cargo.html','contact.html','add-service.html','service-category.html','service-provider.html'].includes(p))return;
    var steps=document.createElement('div');
    steps.className='ha-request-steps';
    steps.innerHTML='<div class="ha-step active"><span class="num">1</span>الاختيار</div><div class="ha-step"><span class="num">2</span>التفاصيل</div><div class="ha-step"><span class="num">3</span>التأكيد</div>';
    var anchor=q('.wrap,.container,.main,.content,.page')||document.body;
    if(anchor!==document.body)anchor.insertBefore(steps,anchor.firstChild);else document.body.insertBefore(steps,document.body.firstChild.nextSibling);
    document.addEventListener('focusin',function(e){
      if(e.target.matches('input,select,textarea')){qa('.ha-step',steps).forEach(function(x,i){x.classList.toggle('active',i<=1)})}
    });
    document.addEventListener('click',function(e){
      if(e.target.closest('.primary,.submit,#submitBtn,[type="submit"]'))qa('.ha-step',steps).forEach(function(x){x.classList.add('active')});
    });
  }

  function usageKey(href){return 'ha_use_'+href.replace(/[^a-z0-9_-]/ig,'_')}
  function trackUsage(){
    document.addEventListener('click',function(e){
      var a=e.target.closest('a[href]');if(!a)return;
      var h=a.getAttribute('href')||'';if(!h||/^https?:|^mailto:|^tel:|^#/.test(h))return;
      try{localStorage.setItem(usageKey(h),String((parseInt(localStorage.getItem(usageKey(h))||'0',10)||0)+1))}catch(err){}
    },true);
  }

  function smartItems(){
    var items=[
      ['shop.html','🛒','التسوق'],['study.html','🎓','الدراسة'],['taxi-delivery.html','🚕','النقل'],['services.html','🛠️','طلب خدمة'],['entertainment.html','🎮','الترفيه'],['sports.html','⚽','الرياضة'],['religious.html','🕌','الدينية'],['news.html','📰','الأخبار']
    ];
    return items.map(function(x){var c=0;try{c=parseInt(localStorage.getItem(usageKey(x[0]))||'0',10)||0}catch(e){};return {href:x[0],ico:x[1],title:x[2],count:c}}).sort(function(a,b){return b.count-a.count}).slice(0,3);
  }
  function injectRecommendations(){
    if(!isUserPage()||q('.ha-smart-section'))return;
    if(!['index.html','shop.html','study.html','services.html','taxi-delivery.html','sports.html','entertainment.html','religious.html','news.html'].includes(path()))return;
    var items=smartItems();
    var sec=document.createElement('section');sec.className='ha-smart-section';
    sec.innerHTML='<div class="ha-smart-head"><h3>مقترح لك ✨</h3><span class="ha-smart-note">حسب استخدامك داخل التطبيق</span></div><div class="ha-smart-grid">'+items.map(function(x){return '<a class="ha-smart-card" href="'+x.href+'"><span class="ha-smart-ico">'+x.ico+'</span><span><b>'+x.title+'</b><small>'+(x.count?'من الأقسام الأكثر استخداماً لديك':'وصول سريع')+'</small></span></a>'}).join('')+'</div>';
    var main=q('.ha-main')||q('.main,.content,.container,.wrap')||document.body;
    if(main===document.body)document.body.appendChild(sec);else main.appendChild(sec);
  }

  function ensureApprovedControls(){
    qa('.ha-bell').forEach(function(bell){
      if(bell.tagName!=='A')bell.addEventListener('click',function(){location.href='notifications-center.html'});
      if(!q('.ha-notify-count',bell)){var c=document.createElement('span');c.className='ha-notify-count';bell.appendChild(c)}
    });
    qa('.ha-nav').forEach(function(a){
      var txt=(a.textContent||'').trim();
      if(/الإشعارات/.test(txt))a.setAttribute('href','notifications-center.html');
      else if(/المحادثات/.test(txt))a.setAttribute('href','chat.html');
      else if(/طلباتي/.test(txt))a.setAttribute('href','orders-center.html');
      else if(/حسابي/.test(txt))a.setAttribute('href','account.html');
      else if(/الرئيسية/.test(txt))a.setAttribute('href','index.html');
    });
  }

  function observeStates(){
    var mo=new MutationObserver(function(){classifyStates();updateNotificationBadges()});
    mo.observe(document.body,{childList:true,subtree:true,characterData:true});
  }

  function init(){
    if(isUserPage())document.body.classList.add('ha-unified-ui');
    injectHeader();injectBottomNav();ensureApprovedControls();bindLocation();bindSearch();classifyStates();injectRequestSteps();injectRecommendations();trackUsage();updateNotificationBadges();observeStates();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
