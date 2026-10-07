(function(){
'use strict';
if(window.__haLuxIconsLoaded)return;
window.__haLuxIconsLoaded=true;

const P={
 home:`<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h5v-6h4v6h5V9.5" class="ha-gold"/>`,
 cart:`<path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L21 7H6"/><circle cx="10" cy="20" r="1.4" class="ha-gold"/><circle cx="18" cy="20" r="1.4" class="ha-gold"/>`,
 service:`<path d="M14.7 6.3a4 4 0 0 0-5-5l2.1 2.1-3 3-2.1-2.1a4 4 0 0 0 5 5L20 17.6a2 2 0 0 1-2.8 2.8l-8.3-8.3"/><path d="m4 20 5.5-5.5" class="ha-gold"/>`,
 study:`<path d="m2.5 8.5 9.5-5 9.5 5-9.5 5z"/><path d="M6.5 10.6V16c2.7 2.2 8.3 2.2 11 0v-5.4" class="ha-gold"/><path d="M21.5 8.5V14"/>`,
 car:`<path d="m5 16-1.4-1.4a2 2 0 0 1-.6-1.4V11a2 2 0 0 1 2-2h1l1.5-3h9L19 9h1a2 2 0 0 1 2 2v2.2a2 2 0 0 1-.6 1.4L20 16"/><path d="M5 16h14" class="ha-gold"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>`,
 bike:`<circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="m6 17 4-8h4l4 8M9 12h7M12 9l-2-3h3" class="ha-gold"/>`,
 game:`<path d="M7 7h10a5 5 0 0 1 4.7 6.7l-1.2 3.4a2.5 2.5 0 0 1-4.2.9L14.7 16H9.3l-1.6 2a2.5 2.5 0 0 1-4.2-.9l-1.2-3.4A5 5 0 0 1 7 7Z"/><path d="M7 11v4M5 13h4M16.5 11.5h.01M19 14h.01" class="ha-gold"/>`,
 chat:`<path d="M21 12a8 8 0 0 1-8 8H7l-4 2 1.3-4.2A8 8 0 1 1 21 12Z"/><path d="M8 12h.01M12 12h.01M16 12h.01" class="ha-gold"/>`,
 news:`<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h8M8 15h4M15 15h1" class="ha-gold"/>`,
 religious:`<path d="M5 21h14M7 21V10h10v11"/><path d="M9 10a3 3 0 0 1 6 0M12 3v3M10 5h4" class="ha-gold"/>`,
 user:`<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0" class="ha-gold"/>`,
 bell:`<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4" class="ha-gold"/>`,
 clipboard:`<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2M9 9h6M9 13h6M9 17h4" class="ha-gold"/>`,
 package:`<path d="m3 7 9-4 9 4-9 4z"/><path d="M3 7v10l9 4 9-4V7M12 11v10" class="ha-gold"/>`,
 plus:`<path d="M12 5v14M5 12h14" class="ha-gold"/>`,
 store:`<path d="M4 9h16l-1-5H5z"/><path d="M5 9v11h14V9M9 20v-6h6v6" class="ha-gold"/><path d="M4 9c0 2 3 2 4 0 1 2 3 2 4 0 1 2 3 2 4 0 1 2 3 2 4 0"/>`,
 location:`<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5" class="ha-gold"/>`,
 book:`<path d="M3 5a3 3 0 0 1 3-2h6v17H6a3 3 0 0 0-3 2z"/><path d="M21 5a3 3 0 0 0-3-2h-6v17h6a3 3 0 0 1 3 2z" class="ha-gold"/>`,
 printer:`<path d="M7 9V3h10v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M7 14h10v7H7z" class="ha-gold"/><path d="M18 12h.01"/>`,
 phone:`<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M10 5h4M11 19h2" class="ha-gold"/>`,
 laptop:`<rect x="4" y="4" width="16" height="12" rx="1.5"/><path d="M2 20h20l-2-4H4z" class="ha-gold"/>`,
 sparkle:`<path d="m12 3 1.3 4.2L17.5 8.5l-4.2 1.3L12 14l-1.3-4.2-4.2-1.3 4.2-1.3z" class="ha-gold"/><path d="m19 14 .8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8z"/>`,
 trash:`<path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14"/><path d="M10 11v6M14 11v6" class="ha-gold"/>`,
 edit:`<path d="M4 20h4l11-11-4-4L4 16z"/><path d="m13.5 6.5 4 4" class="ha-gold"/>`,
 trophy:`<path d="M8 4h8v4a4 4 0 0 1-8 0z"/><path d="M8 6H4v2a4 4 0 0 0 5 4M16 6h4v2a4 4 0 0 1-5 4M12 12v5M8 21h8M9 17h6" class="ha-gold"/>`,
 search:`<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4" class="ha-gold"/>`,
 menu:`<path d="M4 7h16M4 12h16M4 17h16" class="ha-gold"/>`,
 sports:`<circle cx="12" cy="12" r="9"/><path d="m12 7 3 2-1 4h-4L9 9zM5 10l4-1M19 10l-4-1M7 18l3-5M17 18l-3-5" class="ha-gold"/>`,
 target:`<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" class="ha-gold"/>`,
 globe:`<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" class="ha-gold"/>`,
 gift:`<rect x="3" y="9" width="18" height="12" rx="2"/><path d="M12 9v12M3 13h18M7 9c-3 0-3-5 0-5 2 0 5 5 5 5M17 9c3 0 3-5 0-5-2 0-5 5-5 5" class="ha-gold"/>`,
 heart:`<path d="M20.8 5.7a5.3 5.3 0 0 0-7.5 0L12 7l-1.3-1.3a5.3 5.3 0 0 0-7.5 7.5L12 22l8.8-8.8a5.3 5.3 0 0 0 0-7.5Z" class="ha-gold"/>`,
 idcard:`<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8" cy="11" r="2.5"/><path d="M5.5 16c.8-2.2 4.2-2.2 5 0M13 10h5M13 14h4" class="ha-gold"/>`,
 building:`<path d="M4 21V7h10v14M14 11h6v10M7 10h2M11 10h1M7 14h2M11 14h1M7 18h2M17 14h1M17 18h1" class="ha-gold"/>`,
 camera:`<rect x="3" y="6" width="18" height="14" rx="2"/><path d="m8 6 1-2h6l1 2"/><circle cx="12" cy="13" r="4" class="ha-gold"/>`,
 star:`<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z" class="ha-gold"/>`
};

const EMOJI=[
 [/🏠|⌂/u,'home'],[/🛒|🛍️/u,'cart'],[/🛠️|🔧|⚙️|🧰/u,'service'],[/🎓/u,'study'],
 [/🚕|🚖|🚗/u,'car'],[/🛵/u,'bike'],[/🎮|🕹️|🎲/u,'game'],[/💬|💭|🗨️/u,'chat'],
 [/📰/u,'news'],[/🕌|📿/u,'religious'],[/👤|👥|🧑/u,'user'],[/🔔/u,'bell'],
 [/📋/u,'clipboard'],[/📦/u,'package'],[/➕|✚|＋/u,'plus'],[/🏪/u,'store'],[/📍|🗺️/u,'location'],
 [/📚|📖|📕|📘/u,'book'],[/🖨️/u,'printer'],[/📱/u,'phone'],[/💻|🖥️/u,'laptop'],
 [/💡|✨/u,'sparkle'],[/🗑️/u,'trash'],[/✏️|📝/u,'edit'],[/🏆/u,'trophy'],[/🔍|⌕/u,'search'],
 [/☰/u,'menu'],[/⚽|🏀|🏐/u,'sports'],[/🎯/u,'target'],[/🌐|🌍/u,'globe'],[/🎁/u,'gift'],[/❤️|♥/u,'heart'],
 [/🪪/u,'idcard'],[/🏟️|🏢/u,'building'],[/📷|📸/u,'camera'],[/⭐|🌟/u,'star']
];

function svg(name){
 const p=P[name]||P.sparkle;
 return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${p}</svg>`;
}
function textOf(el){return (el.textContent||'').trim()}
function guessName(el){
 const explicit=el.getAttribute('data-ha-icon'); if(explicit&&P[explicit])return explicit;
 const txt=textOf(el);
 for(const [rx,name] of EMOJI)if(rx.test(txt))return name;
 const ctx=((el.closest('a,button,.card,.ha-cat,.ha-nav,.item')?.textContent)||'')+' '+(el.closest('a')?.getAttribute('href')||'');
 const s=ctx.toLowerCase();
 if(/shop|cart|تسوق|السلة|الأسواق|الاسواق/.test(s))return 'cart';
 if(/service|خدمة|مهام/.test(s))return 'service';
 if(/study|teacher|student|دراسة|المدرس|الطالب|صفوف/.test(s))return 'study';
 if(/taxi|transport|driver|delivery|نقل|تكسي|مندوب|سائق/.test(s))return 'car';
 if(/game|entertain|ترفيه|ألعاب|العاب/.test(s))return 'game';
 if(/chat|محادث|دردشة/.test(s))return 'chat';
 if(/news|أخبار|الاخبار/.test(s))return 'news';
 if(/relig|دينية|القرآن|ادعية|أدعية/.test(s))return 'religious';
 if(/account|profile|حساب/.test(s))return 'user';
 if(/notification|إشعار|اشعار/.test(s))return 'bell';
 if(/order|طلباتي|الطلبات/.test(s))return 'clipboard';
 if(/store|متجر/.test(s))return 'store';
 if(/location|موقع|خريطة/.test(s))return 'location';
 return null;
}
function variant(el){
 const ctx=((el.closest('a,button,.card,.ha-cat,.ha-nav,.item')?.textContent)||'')+' '+(el.closest('a')?.getAttribute('href')||'');
 const s=ctx.toLowerCase();
 if(/entertain|game|ترفيه|ألعاب|العاب/.test(s))return 'violet';
 if(/transport|taxi|driver|delivery|نقل|تكسي|مندوب|سائق/.test(s))return 'amber';
 if(/study|teacher|student|دراسة|مدرس|طالب|صف/.test(s))return 'royal';
 if(/service|خدمة|مهام/.test(s))return 'blue';
 if(/sport|رياضة|ملعب|جم/.test(s))return 'emerald';
 if(/chat|محادث|دردشة/.test(s))return 'purple';
 if(/news|أخبار|الاخبار/.test(s))return 'sky';
 if(/relig|دينية|قرآن|ادعية|أدعية/.test(s))return 'indigo';
 if(/notification|إشعار|اشعار/.test(s))return 'gold';
 if(/account|profile|حساب/.test(s))return 'navy';
 if(/suggest|اقتراح/.test(s))return 'rose';
 return 'teal';
}
function sizeClass(el){
 if(el.classList.contains('nicon')||el.classList.contains('ha-rbn-icon')||el.closest('.ha-nav,.bottom,.bottom-inner,#haRoleBottomNav'))return 'ha-lux-icon--nav';
 if(el.classList.contains('short-ico')||el.classList.contains('notice-icon')||el.classList.contains('qicon'))return 'ha-lux-icon--small';
 if(el.classList.contains('ico')&&el.closest('.ha-cat,.card'))return 'ha-lux-icon--hero';
 return 'ha-lux-icon--small';
}
function upgrade(el){
 if(!el||el.dataset.haLuxDone==='1')return;
 const name=guessName(el); if(!name)return;
 el.dataset.haLuxDone='1';
 el.classList.add('ha-lux-icon',sizeClass(el));
 el.setAttribute('data-ha-lux-variant',variant(el));
 el.setAttribute('aria-hidden','true');
 el.innerHTML=svg(name);
}
function run(root=document){
 root.querySelectorAll('.ico,.nicon,.short-ico,.ha-rbn-icon,.notice-icon,.iconbox,.qicon,.finish-icon,.chat-main-icon,.file-icon,[data-ha-icon]').forEach(upgrade);
 // Upgrade icon-only emoji spans that are direct children of cards/nav buttons.
 root.querySelectorAll('.ha-cat span,.ha-nav span,.card span,.bottom a span').forEach(el=>{
   if(el.classList.contains('ha-lux-icon'))return;
   const tx=textOf(el);
   if(tx.length<=4 && EMOJI.some(([rx])=>rx.test(tx)))upgrade(el);
 });
}
function boot(){run();
 const obs=new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes)if(n.nodeType===1){if(n.matches?.('.ico,.nicon,.short-ico,.ha-rbn-icon,.notice-icon,.iconbox,.qicon,.finish-icon,.chat-main-icon,.file-icon,[data-ha-icon]'))upgrade(n);run(n)}});
 obs.observe(document.body,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

/* HA realtime online presence loader */
(function(){
  if(window.__haPresenceScriptRequested||window.__haRealtimePresenceLoaded)return;
  window.__haPresenceScriptRequested=true;
  var s=document.createElement('script');
  s.src='ha-presence.js?v=20261002-realtime2';
  s.defer=true;
  document.head.appendChild(s);
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
