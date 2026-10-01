(function(){
  'use strict';
  var SECTIONS={
    'shop.html':['🛒','التسوق'],'study.html':['🎓','الدراسة'],'taxi-delivery.html':['🚕','النقل'],'services.html':['🛠️','طلب خدمة'],
    'entertainment.html':['🎮','الترفيه'],'sports.html':['⚽','الرياضة'],'religious.html':['🕌','الدينية'],'news.html':['📰','الأخبار'],'chat.html':['💬','الدردشة']
  };
  function safeGet(k,d){try{return localStorage.getItem(k)||d}catch(e){return d}}
  function safeSet(k,v){try{localStorage.setItem(k,v)}catch(e){}}
  function dayKey(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
  function updateDaily(){
    var today=dayKey(), last=safeGet('ha_engage_last_day',''), points=parseInt(safeGet('ha_engage_points','0'),10)||0, streak=parseInt(safeGet('ha_engage_streak','0'),10)||0;
    if(last!==today){
      var y=new Date();y.setDate(y.getDate()-1);var yk=y.getFullYear()+'-'+String(y.getMonth()+1).padStart(2,'0')+'-'+String(y.getDate()).padStart(2,'0');
      streak=last===yk?streak+1:1;points+=5;safeSet('ha_engage_last_day',today);safeSet('ha_engage_streak',String(streak));safeSet('ha_engage_points',String(points));
    }
    return {points:points,streak:streak};
  }
  function loadRecent(){try{return JSON.parse(safeGet('ha_recent_sections','[]'))||[]}catch(e){return []}}
  function saveRecent(href){if(!SECTIONS[href])return;var arr=loadRecent().filter(function(x){return x!==href});arr.unshift(href);arr=arr.slice(0,6);safeSet('ha_recent_sections',JSON.stringify(arr))}
  function bindTracking(){document.addEventListener('click',function(e){var a=e.target.closest('a[href]');if(!a)return;var href=(a.getAttribute('href')||'').split('?')[0];saveRecent(href)},true)}
  function renderRecent(){var box=document.getElementById('haRecentGrid');if(!box)return;var arr=loadRecent();if(!arr.length)arr=['shop.html','study.html','services.html','taxi-delivery.html'];box.innerHTML=arr.slice(0,4).map(function(h){var s=SECTIONS[h]||['✨','قسم'];return '<a class="ha-recent-item" href="'+h+'"><span class="ha-recent-ico">'+s[0]+'</span><span><b>'+s[1]+'</b><small>فتح سريع</small></span></a>'}).join('')}
  function renderBase(){
    var main=document.querySelector('.ha-main'); if(!main||document.querySelector('.ha-engage'))return;
    var stats=updateDaily(), wrap=document.createElement('section');wrap.className='ha-engage';
    wrap.innerHTML='<div class="ha-engage-top"><div class="ha-engage-card ha-welcome"><small>تجربتك داخل HA Marketing</small><h3 id="haExperienceTitle">كل احتياجاتك من مكان واحد</h3><p id="haExperienceText">وصول أسرع للأقسام التي تستخدمها، مع حفظ آخر اختياراتك على هذا الجهاز.</p><div class="ha-stats"><span class="ha-pill">⭐ نقاطك <b>'+stats.points+'</b></span><span class="ha-pill">🔥 أيام الاستمرار <b>'+stats.streak+'</b></span></div><div id="haExperienceNote" class="ha-engage-note"></div></div><div class="ha-engage-card ha-daily"><span class="ha-mini-label">مكافأة الدخول اليومية</span><strong>+5</strong><p>تُضاف مرة واحدة في اليوم. بدون إشعارات مزعجة أو نوافذ إجبارية.</p></div></div><div class="ha-engage-card"><div class="ha-smart-title"><h3>استمر من حيث توقفت</h3><span>آخر الأقسام المستخدمة</span></div><div id="haRecentGrid" class="ha-recent-grid"></div></div><a id="haAdminExperience" class="ha-admin-banner" href="admin-home-experience.html"><span><b>⚙️ إدارة تجربة الصفحة الرئيسية</b><small>العنوان والرسالة والملاحظة العامة</small></span><span>‹</span></a>';
    var slider=document.querySelector('.ha-smart-slider');if(slider)slider.parentNode.insertBefore(wrap,slider);else main.appendChild(wrap);renderRecent();
  }
  async function loadRemoteConfig(){
    if(!window.supabase||!window.supabase.createClient)return;
    try{
      var db=window.supabase.createClient('https://ubayrhtshgtgggxprrek.supabase.co','sb_publishable_p3108yoDkdJTLqVXhkvmBg_KVqe-1ll',{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'ha-marketing-auth'}});
      var r=await db.from('home_experience_settings').select('title,subtitle,note,enabled').eq('slug','home').maybeSingle();
      if(r.data&&r.data.enabled!==false){if(r.data.title)document.getElementById('haExperienceTitle').textContent=r.data.title;if(r.data.subtitle)document.getElementById('haExperienceText').textContent=r.data.subtitle;if(r.data.note){var n=document.getElementById('haExperienceNote');n.textContent=r.data.note;n.classList.add('show')}}
      var u=await db.auth.getUser();var id=u&&u.data&&u.data.user&&u.data.user.id;if(id){var p=await db.from('profiles').select('account_type').eq('id',id).maybeSingle();if(p.data&&p.data.account_type==='admin')document.getElementById('haAdminExperience').classList.add('show')}
    }catch(e){}
  }
  function init(){
    var p=(location.pathname||'').split('/').pop().toLowerCase()||'index.html';
    if(p==='index.html'){
      bindTracking();
      return;
    }
    renderBase();
    bindTracking();
    loadRemoteConfig();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
