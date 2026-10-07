(function(){
'use strict';
const SB_URL='https://ubayrhtshgtgggxprrek.supabase.co';
const SB_KEY='sb_publishable_p3108yoDkdJTLqVXhkvmBg_KVqe-1ll';
const PAGE=(location.pathname.split('/').pop()||'index.html').split('?')[0];
const SHADOWS={none:'none',soft:'0 10px 24px rgba(20,58,78,.10)',strong:'0 16px 34px rgba(20,58,78,.20)'};
const RADII={square:8,soft:16,rounded:24,rounder:32,pill:44};
const SECTION_COVERS={
  'shop.html':{key:'section-cover-shop',label:'صورة واجهة قسم التسوق',fallback:'shop.jpg',selector:'.ha-shop-premium-hero'},
  'services.html':{key:'section-cover-services',label:'صورة واجهة قسم طلب خدمة',fallback:'services.jpg'},
  'study.html':{key:'section-cover-study',label:'صورة واجهة قسم الدراسة',fallback:'study.jpg'},
  'taxi-delivery.html':{key:'section-cover-transport',label:'صورة واجهة قسم النقل والتكسي',fallback:'transport.jpg'},
  'entertainment.html':{key:'section-cover-entertainment',label:'صورة واجهة قسم الترفيه',fallback:'entertainment.jpg'},
  'sports.html':{key:'section-cover-sports',label:'صورة واجهة قسم الرياضة',fallback:'images/sliders/sports-1.svg'},
  'religious.html':{key:'section-cover-religious',label:'صورة واجهة القسم الديني',fallback:'images/sliders/religious-1.svg'},
  'news.html':{key:'section-cover-news',label:'صورة واجهة قسم الأخبار',fallback:'images/sliders/news-1.svg'},
  'suggestions.html':{key:'section-cover-suggestions',label:'صورة واجهة قسم مقترحاتكم',fallback:'images/sliders/home-5.svg'}
};
let db=null,isSuper=false,rows=new Map(),observer=null;
const candidateSelector=['[data-ha-section-cover]','[data-ha-editable-card]','.ha-cat','.ha-feature','.ha-card','.ha-recent-item','.ha-smart-card','.category-card','.service-card','.quick-card','.section-card','.feature-card','.shop-card','.ha-engage-card.ha-welcome','.ha-engage-card.ha-daily','.ha-two>a','.ha-grid>a','.ha-smart-grid>a','.ha-recent-grid>a','a.card'].join(',');
function fnv(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(36)}
function clean(s){return String(s||'').replace(/\s+/g,' ').trim()}
function ensureSectionCover(){
  const def=SECTION_COVERS[PAGE];
  if(!def)return null;
  const family=window.HASectionArtwork?.pages[PAGE]?.key;
  const fallback=window.HASectionArtwork?.covers[family]||def.fallback;
  let cover=null;
  if(def.selector)cover=document.querySelector(def.selector);
  if(!cover)cover=document.querySelector('.ha-section-cover,[data-ha-section-cover]');
  if(!cover){
    const host=document.querySelector('.ha-main')||document.querySelector('.wrap');
    if(!host)return null;
    cover=document.createElement('section');
    cover.className='ha-section-cover ha-generated-section-cover';
    const img=document.createElement('img');
    img.src=fallback;
    img.alt=def.label;
    cover.appendChild(img);
    const firstHead=host.querySelector('.ha-section-head,.card.hero');
    if(firstHead)host.insertBefore(cover,firstHead);else host.prepend(cover);
  }
  cover.setAttribute('data-ha-section-cover','1');
  cover.setAttribute('data-ha-card-key',def.key);
  cover.setAttribute('data-ha-card-label',def.label);
  cover.classList.add('ha-section-cover-standard');
  let img=cover.querySelector('img');
  if(!img){
    img=document.createElement('img');img.src=fallback;img.alt=def.label;cover.appendChild(img);
  }
  if(!img.getAttribute('alt'))img.alt=def.label;
  window.HASectionArtwork?.mount(document);
  return cover;
}
function cardLabel(el){let x=el.getAttribute('data-ha-card-label')||el.getAttribute('aria-label')||'';if(!x){let q=el.querySelector('strong,h5,h4,h3,b,.title,.name');if(q)x=q.textContent}if(!x)x=el.textContent;return clean(x).slice(0,90)||'مربع'}
function cardClasses(el){const keep=[...el.classList].filter(c=>/^(ha-section-cover|ha-shop-premium-hero|ha-cat|ha-feature|ha-card|ha-recent-item|ha-smart-card|category-card|service-card|quick-card|section-card|feature-card|shop-card|card)$/.test(c)).sort();return keep.join('.')||el.tagName.toLowerCase()}
function keyFor(el,page=PAGE){if(el.dataset.haCardKey)return el.dataset.haCardKey;const href=el.getAttribute('href')||'';const label=cardLabel(el);const seed=page+'|'+href+'|'+label+'|'+cardClasses(el);const k=page.replace(/\.html$/,'')+'-'+fnv(seed);el.dataset.haCardKey=k;return k}
function shouldSkip(el){if(!el||el.closest('.ha-card-editor-backdrop,.ha-bottom,.ha-header,.ha-search-wrap,.ha-section-head,nav,footer'))return true;if(el.matches('.ha-engage-card')&&el.querySelector('.ha-recent-grid'))return true;if(!el.matches('a')&&el.querySelector('form,input,textarea,select,table'))return true;return false}
function titleEl(el){return el.querySelector('strong,h5,h4,h3,b,.title,.name')}
function subtitleEl(el){return el.querySelector('small,p,.subtitle,.desc,.description')}
function ensureBg(el){let bg=el.querySelector(':scope>.ha-card-custom-bg');if(!bg){bg=document.createElement('span');bg.className='ha-card-custom-bg';el.prepend(bg)}return bg}
function applyRow(el,row){if(!row)return;el.classList.add('ha-customizable-card');
 if(el.matches('[data-ha-section-cover]')){
   if(row.shape)el.style.setProperty('border-radius',(RADII[row.shape]||Number(row.border_radius)||24)+'px','important');
   else if(row.border_radius!=null)el.style.setProperty('border-radius',Number(row.border_radius)+'px','important');
   if(row.bg_color)el.style.setProperty('background-color',row.bg_color,'important');
   if(row.shadow_style)el.style.setProperty('box-shadow',SHADOWS[row.shadow_style]||SHADOWS.soft,'important');
   const img=el.querySelector('img');
   if(img){
     if(!img.dataset.haDefaultSrc)img.dataset.haDefaultSrc=img.getAttribute('src')||'';
     if(row.image_url)img.src=row.image_url;
     const fit=row.image_fit||'cover';
     img.style.setProperty('object-fit',fit==='100% 100%'?'fill':fit,'important');
   }
   return;
 }
 if(row.shape){el.style.setProperty('border-radius',(RADII[row.shape]||Number(row.border_radius)||24)+'px','important')}else if(row.border_radius!=null){el.style.setProperty('border-radius',Number(row.border_radius)+'px','important')}
 if(row.bg_color)el.style.setProperty('background-color',row.bg_color,'important');
 if(row.shadow_style)el.style.setProperty('box-shadow',SHADOWS[row.shadow_style]||SHADOWS.soft,'important');
 if(row.text_color){const t=titleEl(el),s=subtitleEl(el);if(t)t.style.setProperty('color',row.text_color,'important');if(s)s.style.setProperty('color',row.text_color,'important')}
 if(row.title_text){const t=titleEl(el);if(t)t.textContent=row.title_text}
 if(row.subtitle_text){const s=subtitleEl(el);if(s)s.textContent=row.subtitle_text}
 const bg=ensureBg(el);if(row.image_url){bg.style.backgroundImage='url("'+String(row.image_url).replace(/"/g,'%22')+'")';bg.style.backgroundSize=row.image_fit||'cover';bg.style.backgroundColor=row.bg_color||'transparent';bg.style.opacity='1';bg.style.display='block'}else{bg.style.backgroundImage='none';bg.style.display='none'}
}
function addEdit(el){if(!isSuper||el.querySelector(':scope>.ha-card-edit-btn'))return;el.classList.add('ha-customizable-card','ha-card-admin-outline');const b=document.createElement('span');b.className='ha-card-edit-btn';b.textContent='✎';b.title='تعديل شكل هذا المربع';b.setAttribute('role','button');b.setAttribute('tabindex','0');b.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation()});b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openForElement(el)});b.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openForElement(el)}});el.appendChild(b)}
function process(root=document){const els=[];if(root.nodeType===1&&root.matches?.(candidateSelector))els.push(root);root.querySelectorAll?.(candidateSelector).forEach(x=>els.push(x));els.forEach(el=>{if(shouldSkip(el))return;const k=keyFor(el);el.classList.add('ha-customizable-card');const row=rows.get(k);if(row)applyRow(el,row);if(isSuper)addEdit(el)})}
function toast(t){let x=document.querySelector('.ha-card-editor-toast');if(!x){x=document.createElement('div');x.className='ha-card-editor-toast';document.body.appendChild(x)}x.textContent=t;x.classList.add('show');setTimeout(()=>x.classList.remove('show'),2800)}
function loadSupabase(){return new Promise((resolve,reject)=>{if(window.supabase?.createClient)return resolve();let s=document.querySelector('script[data-ha-sb]');if(s){s.addEventListener('load',resolve,{once:true});return}s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';s.dataset.haSb='1';s.onload=resolve;s.onerror=reject;document.head.appendChild(s)})}
async function ensureDb(){if(db)return db;await loadSupabase();db=window.supabase.createClient(SB_URL,SB_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'ha-marketing-auth'}});return db}
async function checkSuper(){try{const c=await ensureDb();const r=await c.rpc('is_super_admin');if(!r.error&&r.data===true)return true;const u=await c.auth.getUser();const id=u?.data?.user?.id;if(!id)return false;const a=await c.from('app_admins').select('is_super_admin,is_active').eq('user_id',id).maybeSingle();return !!(a.data?.is_active&&a.data?.is_super_admin)}catch(e){return false}}
async function loadRows(page=PAGE){try{const c=await ensureDb();const r=await c.from('ui_card_customizations').select('*').eq('page_key',page);if(!r.error)(r.data||[]).forEach(x=>rows.set(x.card_key,x))}catch(e){}}
function modal(){let b=document.querySelector('.ha-card-editor-backdrop');if(b)return b;b=document.createElement('div');b.className='ha-card-editor-backdrop';b.innerHTML=`<div class="ha-card-editor-modal" role="dialog" aria-modal="true"><div class="ha-card-editor-head"><h3 id="haCeTitle">تعديل المربع</h3><button class="ha-card-editor-close" type="button">×</button></div><div class="ha-card-editor-preview"><span class="pvbg"></span><span class="pvtext"></span></div><div class="ha-card-editor-grid"><div class="ha-card-editor-field full"><label>عنوان المربع</label><input id="haCeCardTitle" type="text"></div><div class="ha-card-editor-field full"><label>الوصف الصغير</label><input id="haCeSubtitle" type="text"></div><div class="ha-card-editor-field full"><label>رفع صورة جديدة</label><input id="haCeFile" type="file" accept="image/*"></div><div class="ha-card-editor-field full"><label>أو رابط الصورة</label><input id="haCeUrl" type="url" placeholder="https://..."></div><div class="ha-card-editor-field"><label>شكل الزوايا</label><select id="haCeShape"><option value="rounded">دائري مرتب</option><option value="rounder">دائري أكثر</option><option value="soft">ناعم</option><option value="square">مربع</option><option value="pill">كبسولة</option></select></div><div class="ha-card-editor-field"><label>عرض الصورة</label><select id="haCeFit"><option value="cover">تعبئة المربع</option><option value="contain">الصورة كاملة</option><option value="100% 100%">تمديد حسب المربع</option></select></div><div class="ha-card-editor-field"><label>لون الخلفية</label><input id="haCeBg" type="color" value="#ffffff"></div><div class="ha-card-editor-field"><label>لون الكتابة</label><input id="haCeText" type="color" value="#102948"></div><div class="ha-card-editor-field"><label>الظل</label><select id="haCeShadow"><option value="soft">خفيف</option><option value="strong">قوي</option><option value="none">بدون</option></select></div></div><div class="ha-card-editor-note">التغيير يظهر مباشرة لكل المستخدمين. صلاحية الحفظ للأدمن الرئيسي فقط.</div><div class="ha-card-editor-actions"><button class="ha-card-editor-save" type="button">حفظ</button><button class="ha-card-editor-reset" type="button">رجوع للافتراضي</button><button class="ha-card-editor-cancel" type="button">إلغاء</button></div></div>`;document.body.appendChild(b);const close=()=>b.classList.remove('show');b.querySelector('.ha-card-editor-close').onclick=close;b.querySelector('.ha-card-editor-cancel').onclick=close;b.addEventListener('click',e=>{if(e.target===b)close()});return b}
async function upload(file,page,key){if(!file)return null;if(!String(file.type||'').startsWith('image/'))throw new Error('اختر صورة فقط');if(file.size>8*1024*1024)throw new Error('الصورة أكبر من 8MB');const ext=(file.name.split('.').pop()||'jpg').replace(/[^a-z0-9]/ig,'')||'jpg';const path=page.replace(/[^a-z0-9_-]/ig,'_')+'/'+key+'/'+Date.now()+'.'+ext;const c=await ensureDb();const up=await c.storage.from('ui-card-images').upload(path,file,{cacheControl:'3600',upsert:false,contentType:file.type||undefined});if(up.error)throw up.error;return c.storage.from('ui-card-images').getPublicUrl(path).data.publicUrl}
async function openEditor(def,el){if(!isSuper){toast('هذه الخاصية للأدمن الرئيسي فقط');return}const b=modal();const key=def.card_key,page=def.page_key,label=def.label||'مربع';let row=rows.get(key);if(!row||row.page_key!==page){try{const c=await ensureDb();const q=await c.from('ui_card_customizations').select('*').eq('card_key',key).maybeSingle();if(q.data){row=q.data;rows.set(key,row)}}catch(e){}}
 const get=id=>b.querySelector('#'+id);const isCover=(def.kind==='section-cover')||!!el?.matches?.('[data-ha-section-cover]');
 b.classList.toggle('ha-cover-editor',isCover);
 b.querySelector('#haCeTitle').textContent=isCover?('تغيير '+label):('تعديل: '+label);
 ['haCeCardTitle','haCeSubtitle','haCeText'].forEach(id=>{const f=get(id)?.closest('.ha-card-editor-field');if(f)f.style.display=isCover?'none':''});get('haCeCardTitle').value=isCover?'':(row?.title_text||def.current_title||label);get('haCeSubtitle').value=isCover?'':(row?.subtitle_text||def.current_subtitle||'');get('haCeUrl').value=row?.image_url||'';get('haCeFile').value='';get('haCeShape').value=row?.shape||'rounded';get('haCeFit').value=row?.image_fit||'cover';get('haCeBg').value=/^#[0-9a-f]{6}$/i.test(row?.bg_color||'')?row.bg_color:'#ffffff';get('haCeText').value=/^#[0-9a-f]{6}$/i.test(row?.text_color||'')?row.text_color:'#102948';get('haCeShadow').value=row?.shadow_style||'soft';const pv=b.querySelector('.ha-card-editor-preview'),pbg=pv.querySelector('.pvbg'),pt=pv.querySelector('.pvtext');const updatePv=()=>{pt.textContent=isCover?'':(get('haCeCardTitle').value||label);pt.style.color=get('haCeText').value;pv.style.backgroundColor=get('haCeBg').value;pv.style.borderRadius=(RADII[get('haCeShape').value]||24)+'px';pbg.style.backgroundImage=get('haCeUrl').value?'url("'+get('haCeUrl').value.replace(/"/g,'%22')+'")':'none';pbg.style.backgroundSize=get('haCeFit').value;pbg.style.backgroundColor=get('haCeBg').value};['haCeCardTitle','haCeUrl','haCeShape','haCeFit','haCeBg','haCeText'].forEach(id=>get(id).addEventListener('input',updatePv,{once:false}));get('haCeFile').onchange=()=>{const f=get('haCeFile').files?.[0];if(f){get('haCeUrl').value=URL.createObjectURL(f);updatePv()}};updatePv();b.classList.add('show');
 b.querySelector('.ha-card-editor-save').onclick=async function(){try{this.disabled=true;let url=get('haCeUrl').value.trim();const f=get('haCeFile').files?.[0];if(f)url=await upload(f,page,key);if(url.startsWith('blob:'))url='';const c=await ensureDb();const u=await c.auth.getUser();const payload={card_key:key,page_key:page,label:label,title_text:isCover?null:(get('haCeCardTitle').value.trim()||null),subtitle_text:isCover?null:(get('haCeSubtitle').value.trim()||null),image_url:url||null,image_fit:get('haCeFit').value,bg_color:get('haCeBg').value,text_color:get('haCeText').value,shape:get('haCeShape').value,shadow_style:get('haCeShadow').value,updated_by:u?.data?.user?.id||null,updated_at:new Date().toISOString()};const r=await c.from('ui_card_customizations').upsert(payload,{onConflict:'card_key'});if(r.error)throw r.error;rows.set(key,payload);if(el)applyRow(el,payload);toast('✅ تم حفظ شكل المربع');b.classList.remove('show')}catch(e){alert('تعذر الحفظ: '+(e?.message||e)+'\nشغّل ملف UI-CARD-CUSTOMIZER-SETUP.sql مرة واحدة إذا لم تشغله.')}finally{this.disabled=false}};
 b.querySelector('.ha-card-editor-reset').onclick=async function(){if(!confirm('ترجع هذا المربع إلى شكله الافتراضي؟'))return;try{this.disabled=true;const c=await ensureDb();const r=await c.from('ui_card_customizations').delete().eq('card_key',key);if(r.error)throw r.error;rows.delete(key);toast('✅ رجع الشكل الافتراضي');location.reload()}catch(e){alert(e?.message||e)}finally{this.disabled=false}};
}
function openForElement(el){const key=keyFor(el);openEditor({card_key:key,page_key:PAGE,label:cardLabel(el),kind:el.matches('[data-ha-section-cover]')?'section-cover':undefined,current_title:titleEl(el)?.textContent||'',current_subtitle:subtitleEl(el)?.textContent||''},el)}
async function openDefinition(def){return openEditor(def,null)}
async function init(){try{ensureSectionCover();await ensureDb();await loadRows(PAGE);isSuper=await checkSuper();if(document.body?.dataset.haCardAdmin!=='1')process(document);observer=new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===1)process(n)})));observer.observe(document.documentElement,{childList:true,subtree:true});window.HACardCustomizer={openDefinition,isSuperAdmin:()=>isSuper,refresh:()=>process(document),page:PAGE};document.dispatchEvent(new CustomEvent('ha-card-customizer-ready',{detail:{isSuper}}))}catch(e){console.warn('HA card customizer:',e)}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
