/* HA Marketing - 5 image section sliders */
(function(){
'use strict';
const SB_URL='https://ubayrhtshgtgggxprrek.supabase.co';
const SB_KEY='sb_publishable_p3108yoDkdJTLqVXhkvmBg_KVqe-1ll';
const DEFAULTS={"home": [{"slot": 1, "image_url": "images/sliders/home-1.svg", "title": "اكتشف التسوق الجديد", "subtitle": "عروض ومنتجات مختارة يومياً من أقسام HA Marketing", "details_url": "shop.html", "is_active": true}, {"slot": 2, "image_url": "images/sliders/home-2.svg", "title": "تنقّل بسهولة", "subtitle": "خدمات النقل والتوصيل في مكان واحد", "details_url": "taxi-delivery.html", "is_active": true}, {"slot": 3, "image_url": "images/sliders/home-3.svg", "title": "تعلم وتطور", "subtitle": "الدراسة والدورات والملخصات بخطوات بسيطة", "details_url": "study.html", "is_active": true}, {"slot": 4, "image_url": "images/sliders/home-4.svg", "title": "اطلب خدمتك", "subtitle": "مقدمو خدمات موثوقون وخيارات واضحة", "details_url": "services.html", "is_active": true}, {"slot": 5, "image_url": "images/sliders/home-5.svg", "title": "وقت للترفيه", "subtitle": "ألعاب ومحتوى وترفيه مناسب لك", "details_url": "entertainment.html", "is_active": true}], "shop": [{"slot": 1, "image_url": "images/sliders/shop-1.svg", "title": "عروض اليوم", "subtitle": "خصومات ومنتجات مختارة لفترة محدودة", "details_url": "shop.html", "is_active": true}, {"slot": 2, "image_url": "images/sliders/shop-2.svg", "title": "الإلكترونيات", "subtitle": "أجهزة وملحقات وتقنيات حديثة", "details_url": "shop-section.html?section=devices", "is_active": true}, {"slot": 3, "image_url": "images/sliders/shop-3.svg", "title": "الأزياء", "subtitle": "ملابس وأناقة وخيارات متنوعة", "details_url": "shop-section.html?section=clothes", "is_active": true}, {"slot": 4, "image_url": "images/sliders/shop-4.svg", "title": "المنزل والمطبخ", "subtitle": "كل احتياجات البيت في مكان واحد", "details_url": "shop-section.html?section=home_appliances", "is_active": true}, {"slot": 5, "image_url": "images/sliders/shop-5.svg", "title": "الجمال والعطور", "subtitle": "عناية وعطور ومنتجات مختارة", "details_url": "shop-section.html?section=pharmacies", "is_active": true}], "study": [{"slot": 1, "image_url": "images/sliders/study-1.svg", "title": "دورات تعليمية", "subtitle": "تعلم بخطوات واضحة ومن مصادر مرتبة", "details_url": "courses.html", "is_active": true}, {"slot": 2, "image_url": "images/sliders/study-2.svg", "title": "الأسئلة الوزارية", "subtitle": "أسئلة وحلول تساعدك بالمراجعة", "details_url": "ministerial-questions.html", "is_active": true}, {"slot": 3, "image_url": "images/sliders/study-3.svg", "title": "المكتبة الدراسية", "subtitle": "كتب ومصادر وملفات لجميع المراحل", "details_url": "study-library.html", "is_active": true}, {"slot": 4, "image_url": "images/sliders/study-4.svg", "title": "خطط دراستك", "subtitle": "نظم وقتك وجدولك بسهولة", "details_url": "study-planner.html", "is_active": true}, {"slot": 5, "image_url": "images/sliders/study-5.svg", "title": "ملخصات سريعة", "subtitle": "راجع أهم النقاط بوقت أقل", "details_url": "study-summary.html", "is_active": true}], "services": [{"slot": 1, "image_url": "images/sliders/services-1.svg", "title": "اطلب خدمة الآن", "subtitle": "اختر الخدمة وأرسل تفاصيلك بسهولة", "details_url": "contact.html", "is_active": true}, {"slot": 2, "image_url": "images/sliders/services-2.svg", "title": "خدمات منزلية", "subtitle": "صيانة وتنظيف وتركيب من مقدمي خدمة", "details_url": "services.html", "is_active": true}, {"slot": 3, "image_url": "images/sliders/services-3.svg", "title": "خدمات احترافية", "subtitle": "تصميم وتسويق وتطوير لمشروعك", "details_url": "service-category.html", "is_active": true}, {"slot": 4, "image_url": "images/sliders/services-4.svg", "title": "تابع طلبك", "subtitle": "اعرف حالة الطلب وكل تحديثاته", "details_url": "track-service.html", "is_active": true}, {"slot": 5, "image_url": "images/sliders/services-5.svg", "title": "مقدمو الخدمة", "subtitle": "استكشف مقدمي الخدمات المتاحين", "details_url": "service-provider.html", "is_active": true}], "transport": [{"slot": 1, "image_url": "images/sliders/transport-1.svg", "title": "احجز تكسي", "subtitle": "اطلب سيارة قريبة منك بسرعة", "details_url": "taxi.html", "is_active": true}, {"slot": 2, "image_url": "images/sliders/transport-2.svg", "title": "مندوب توصيل", "subtitle": "توصيل سريع للطلبات والمشاوير", "details_url": "delivery.html", "is_active": true}, {"slot": 3, "image_url": "images/sliders/transport-3.svg", "title": "تك تك", "subtitle": "للمشاوير القصيرة والقريبة", "details_url": "tuktuk.html", "is_active": true}, {"slot": 4, "image_url": "images/sliders/transport-4.svg", "title": "سيارة حمل", "subtitle": "لنقل الأثاث والبضائع بأمان", "details_url": "cargo.html", "is_active": true}, {"slot": 5, "image_url": "images/sliders/transport-5.svg", "title": "خطوط النقل", "subtitle": "طلاب وموظفين وخيارات نقل إضافية", "details_url": "transport-directory.html", "is_active": true}], "sports": [{"slot": 1, "image_url": "images/sliders/sports-1.svg", "title": "كرة القدم", "subtitle": "أخبار ومباريات ونتائج", "details_url": "football.html", "is_active": true}, {"slot": 2, "image_url": "images/sliders/sports-2.svg", "title": "أخبار الرياضة", "subtitle": "تابع آخر الأخبار الرياضية", "details_url": "football-news.html", "is_active": true}, {"slot": 3, "image_url": "images/sliders/sports-3.svg", "title": "تحديات رياضية", "subtitle": "شارك وتابع المنافسات", "details_url": "study-sports-challenges.html", "is_active": true}, {"slot": 4, "image_url": "images/sliders/sports-4.svg", "title": "النوادي واللياقة", "subtitle": "خيارات رياضية متنوعة", "details_url": "gym.html", "is_active": true}, {"slot": 5, "image_url": "images/sliders/sports-5.svg", "title": "الترتيب والنتائج", "subtitle": "شاهد النتائج والتحديات المميزة", "details_url": "games-ranking.html", "is_active": true}], "entertainment": [{"slot": 1, "image_url": "images/sliders/entertainment-1.svg", "title": "الألعاب", "subtitle": "مجموعة ألعاب سريعة وممتعة", "details_url": "games.html", "is_active": true}, {"slot": 2, "image_url": "images/sliders/entertainment-2.svg", "title": "التحديات", "subtitle": "نافس وارفع ترتيبك", "details_url": "games-ranking.html", "is_active": true}, {"slot": 3, "image_url": "images/sliders/entertainment-3.svg", "title": "لعبة القناص", "subtitle": "تحديات دقة ومهارة", "details_url": "sniper-battle.html", "is_active": true}, {"slot": 4, "image_url": "images/sliders/entertainment-4.svg", "title": "ركلات الجزاء", "subtitle": "اختبر مهارتك بالتسديد", "details_url": "penalties.html", "is_active": true}, {"slot": 5, "image_url": "images/sliders/entertainment-5.svg", "title": "ألعاب متنوعة", "subtitle": "اكتشف المزيد من الألعاب", "details_url": "games-hub.html", "is_active": true}], "news": [{"slot": 1, "image_url": "images/sliders/news-1.svg", "title": "أهم الأخبار", "subtitle": "تابع الأخبار المحلية والعامة أولاً بأول", "details_url": "news.html", "is_active": true}, {"slot": 2, "image_url": "images/sliders/news-2.svg", "title": "أخبار التعليم", "subtitle": "مستجدات المدارس والجامعات", "details_url": "education-news.html", "is_active": true}, {"slot": 3, "image_url": "images/sliders/news-3.svg", "title": "أخبار الرياضة", "subtitle": "آخر أخبار المباريات والبطولات", "details_url": "football-news.html", "is_active": true}, {"slot": 4, "image_url": "images/sliders/news-4.svg", "title": "الاقتصاد والأسعار", "subtitle": "متابعة أهم المؤشرات والأسعار", "details_url": "currency-prices.html", "is_active": true}, {"slot": 5, "image_url": "images/sliders/news-5.svg", "title": "محتوى مميز", "subtitle": "أخبار مختارة ومواضيع مهمة", "details_url": "news.html", "is_active": true}], "religious": [{"slot": 1, "image_url": "images/sliders/religious-1.svg", "title": "القرآن الكريم", "subtitle": "قراءة واستماع بسهولة", "details_url": "quran.html", "is_active": true}, {"slot": 2, "image_url": "images/sliders/religious-2.svg", "title": "الأدعية", "subtitle": "مجموعة أدعية مأثورة ومختارة", "details_url": "duas.html", "is_active": true}, {"slot": 3, "image_url": "images/sliders/religious-3.svg", "title": "الزيارات", "subtitle": "زيارات وأعمال دينية", "details_url": "ziyarat.html", "is_active": true}, {"slot": 4, "image_url": "images/sliders/religious-4.svg", "title": "مواقيت الصلاة", "subtitle": "اعرف أوقات الصلاة اليومية", "details_url": "prayer-times.html", "is_active": true}, {"slot": 5, "image_url": "images/sliders/religious-5.svg", "title": "القبلة والتسبيح", "subtitle": "أدوات دينية سريعة وسهلة", "details_url": "qibla.html", "is_active": true}]};

function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
async function remote(section){
  const controller = new AbortController();
  const timeout = setTimeout(()=>controller.abort(), 2500);
  try{
    const u=SB_URL+'/rest/v1/section_sliders?select=section_key,slot,image_url,title,subtitle,details_url,is_active&section_key=eq.'+encodeURIComponent(section)+'&order=slot.asc';
    const r=await fetch(u,{
      headers:{apikey:SB_KEY,Authorization:'Bearer '+SB_KEY},
      cache:'no-store',
      signal:controller.signal
    });
    if(!r.ok) return null;
    return await r.json();
  }catch(e){
    return null;
  }finally{
    clearTimeout(timeout);
  }
}
function merge(section,rows){
  const base=(DEFAULTS[section]||[]).map(x=>({...x}));
  if(!Array.isArray(rows)||!rows.length)return base;
  return base.map(d=>{const r=rows.find(x=>Number(x.slot)===d.slot);return r?{...d,...r,image_url:r.image_url||d.image_url,title:r.title||d.title,subtitle:r.subtitle||d.subtitle,details_url:r.details_url||d.details_url}:d}).filter(x=>x.is_active!==false);
}
function initSlider(root,slides){
  if(typeof root._haSliderCleanup==='function') root._haSliderCleanup();
  if(!slides.length){root.innerHTML='<div class="ha-slider-loading">لا توجد صور مفعلة حالياً.</div>';return}
  root.innerHTML=`<div class="ha-slider-track">${slides.map((s,i)=>`<article class="ha-slide ${i===0?'active':''}" data-index="${i}"><img src="${esc(s.image_url)}" alt="${esc(s.title)}" loading="${i===0?'eager':'lazy'}"><div class="ha-slide-content"><span class="ha-slide-badge">HA Marketing</span><h3>${esc(s.title)}</h3><p>${esc(s.subtitle)}</p><a class="ha-slide-details" href="${esc(s.details_url)}">انقر على التفاصيل <span>←</span></a></div></article>`).join('')}</div><button class="ha-slider-arrow prev" type="button" aria-label="الصورة السابقة">›</button><button class="ha-slider-arrow next" type="button" aria-label="الصورة التالية">‹</button><div class="ha-slider-dots">${slides.map((_,i)=>`<button class="ha-slider-dot ${i===0?'active':''}" type="button" aria-label="الصورة ${i+1}"></button>`).join('')}</div><div class="ha-slider-count">1 / ${slides.length}</div>`;
  const els=[...root.querySelectorAll('.ha-slide')],dots=[...root.querySelectorAll('.ha-slider-dot')],count=root.querySelector('.ha-slider-count');
  let index=0,timer=null,startX=null;
  function show(i,user=false){index=(i+els.length)%els.length;els.forEach((x,n)=>x.classList.toggle('active',n===index));dots.forEach((x,n)=>x.classList.toggle('active',n===index));if(count)count.textContent=(index+1)+' / '+els.length;if(user)restart()}
  function play(){clearInterval(timer);if(els.length>1&&!matchMedia('(prefers-reduced-motion: reduce)').matches)timer=setInterval(()=>show(index+1),4500)}
  function restart(){play()}
  const prev=root.querySelector('.prev'),next=root.querySelector('.next');
  const onPrev=()=>show(index-1,true),onNext=()=>show(index+1,true);
  const onEnter=()=>clearInterval(timer),onLeave=()=>play();
  const onTouchStart=e=>{startX=e.touches[0].clientX;clearInterval(timer)};
  const onTouchEnd=e=>{if(startX!=null){const dx=e.changedTouches[0].clientX-startX;if(Math.abs(dx)>45)show(index+(dx>0?-1:1));startX=null}play()};
  const onVisibility=()=>document.hidden?clearInterval(timer):play();
  prev?.addEventListener('click',onPrev); next?.addEventListener('click',onNext);
  dots.forEach((d,i)=>d.addEventListener('click',()=>show(i,true)));
  root.addEventListener('mouseenter',onEnter);root.addEventListener('mouseleave',onLeave);
  root.addEventListener('touchstart',onTouchStart,{passive:true});
  root.addEventListener('touchend',onTouchEnd,{passive:true});
  document.addEventListener('visibilitychange',onVisibility);
  root._haSliderCleanup=()=>{clearInterval(timer);document.removeEventListener('visibilitychange',onVisibility)};
  play();
}
function boot(){
  document.querySelectorAll('[data-ha-slider]').forEach(root=>{
    const section=root.dataset.haSlider;
    // اعرض الصور المحلية فوراً حتى لا تنتظر Supabase أو يعلق الحقل عند ضعف الاتصال.
    initSlider(root,merge(section,null));
    // حدّثها من قاعدة البيانات بالخلفية فقط إذا وصل الرد بنجاح.
    remote(section).then(rows=>{
      if(Array.isArray(rows)&&rows.length) initSlider(root,merge(section,rows));
    }).catch(()=>{});
  });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
