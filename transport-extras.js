// HA Marketing - transport extras: saved places, ride history, sharing and emergency contact
(function(){
  const LS_FAV='ha_transport_favorites';
  const LS_EMERGENCY='ha_transport_emergency_contact';
  const service=(location.pathname.split('/').pop()||'').includes('tuktuk')?'tuktuk':'taxi';
  const labels={taxi:'تكسي',tuktuk:'تكتك'};
  function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function favs(){try{return JSON.parse(localStorage.getItem(LS_FAV)||'[]')}catch(_e){return[]}}
  function saveFavs(v){localStorage.setItem(LS_FAV,JSON.stringify(v.slice(0,20)))}
  function fmtCoord(p){return p&&Number.isFinite(+p.lat)&&Number.isFinite(+p.lng)?(+p.lat).toFixed(5)+', '+(+p.lng).toFixed(5):'—'}
  function statusLabel(s){return ({searching:'جاري البحث',accepted:'تم القبول',arrived:'وصل السائق',started:'الرحلة بدأت',finished:'مكتملة',cancelled:'ملغاة',rejected:'مرفوضة'})[s]||s||'—'}
  function money(n){return n?Number(n).toLocaleString('ar-IQ')+' د.ع':'—'}
  function date(v){if(!v)return '—';try{return new Date(v).toLocaleString('ar-IQ')}catch(_e){return '—'}}

  function css(){
    if(document.getElementById('haTransportExtrasStyle'))return;
    const s=document.createElement('style');s.id='haTransportExtrasStyle';s.textContent=`
    .ha-x-open{position:fixed;left:14px;bottom:14px;z-index:5600;border:0;border-radius:999px;background:#111;color:#fff;padding:11px 15px;font-weight:800;box-shadow:0 6px 22px #0004}
    .ha-x-sheet{position:fixed;inset:0;background:#0008;z-index:9000;display:none;align-items:flex-end;justify-content:center}.ha-x-sheet.show{display:flex}
    .ha-x-card{width:min(560px,100%);max-height:85vh;overflow:auto;background:#fff;border-radius:22px 22px 0 0;padding:14px}.ha-x-head{display:flex;align-items:center;justify-content:space-between}.ha-x-head button{border:0;background:#eee;width:36px;height:36px;border-radius:50%;font-size:20px}
    .ha-x-tabs{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:12px 0}.ha-x-tab{border:0;border-radius:10px;background:#f1f1f1;padding:10px 5px;font-size:11px;font-weight:800}.ha-x-tab.active{background:#111;color:#fff}
    .ha-x-pane{display:none}.ha-x-pane.active{display:block}.ha-x-item{border:1px solid #e8e8e8;border-radius:13px;padding:11px;margin:8px 0}.ha-x-item b{display:block}.ha-x-muted{font-size:11px;color:#666;line-height:1.6}.ha-x-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.ha-x-btn{border:0;border-radius:10px;padding:10px 12px;background:#111;color:#fff;font-weight:800}.ha-x-btn.alt{background:#eee;color:#111}.ha-x-field{width:100%;padding:11px;border:1px solid #ddd;border-radius:10px;margin:5px 0}
    @media(max-width:430px){.ha-x-tabs{grid-template-columns:repeat(2,1fr)}}`;
    document.head.appendChild(s);
  }
  function html(){
    if(document.getElementById('haTransportExtras'))return;
    document.body.insertAdjacentHTML('beforeend',`
      <button class="ha-x-open" id="haXOpen">⭐ رحلاتي وأماكني</button>
      <div class="ha-x-sheet" id="haTransportExtras"><div class="ha-x-card">
        <div class="ha-x-head"><b>مركز ${labels[service]}</b><button id="haXClose">×</button></div>
        <div class="ha-x-tabs">
          <button class="ha-x-tab active" data-x="history">رحلاتي</button><button class="ha-x-tab" data-x="favorites">أماكني</button><button class="ha-x-tab" data-x="share">مشاركة الرحلة</button><button class="ha-x-tab" data-x="emergency">جهة الطوارئ</button>
        </div>
        <section class="ha-x-pane active" id="haXhistory"><div id="haXHistoryList" class="ha-x-muted">جاري تحميل الرحلات...</div></section>
        <section class="ha-x-pane" id="haXfavorites">
          <div class="ha-x-grid"><button class="ha-x-btn" id="haSaveStart">حفظ الانطلاق الحالي</button><button class="ha-x-btn" id="haSaveEnd">حفظ الوصول الحالي</button></div>
          <div id="haXFavList"></div>
        </section>
        <section class="ha-x-pane" id="haXshare"><p class="ha-x-muted">شارك حالة الرحلة الحالية مع شخص تثق به. لا يتم إرسال شيء بدون ضغطك على زر المشاركة.</p><button class="ha-x-btn" id="haShareRide">مشاركة تفاصيل الرحلة</button><div id="haXShareState" class="ha-x-muted" style="margin-top:8px"></div></section>
        <section class="ha-x-pane" id="haXemergency"><p class="ha-x-muted">احفظ رقم شخص تثق به للاتصال السريع. هذا ليس رقماً رسمياً لخدمات الطوارئ.</p><input class="ha-x-field" id="haEmergencyPhone" inputmode="tel" placeholder="رقم جهة الاتصال"><div class="ha-x-grid"><button class="ha-x-btn" id="haSaveEmergency">حفظ الرقم</button><button class="ha-x-btn alt" id="haCallEmergency">اتصال سريع</button></div></section>
      </div></div>`);
  }
  function open(){document.getElementById('haTransportExtras').classList.add('show');loadHistory();renderFavs()}
  function close(){document.getElementById('haTransportExtras').classList.remove('show')}
  function currentPoint(kind){try{return kind==='start'?start:end}catch(_e){return null}}
  function savePoint(kind){const p=currentPoint(kind);if(!p){alert(kind==='start'?'حدد الانطلاق أولاً.':'حدد الوصول أولاً.');return}const name=prompt('اكتب اسم المكان، مثال: البيت أو العمل');if(!name)return;const a=favs();a.unshift({id:Date.now(),name:name.trim(),lat:+p.lat,lng:+p.lng});saveFavs(a);renderFavs()}
  function renderFavs(){const box=document.getElementById('haXFavList');if(!box)return;const a=favs();box.innerHTML=a.length?a.map(x=>`<div class="ha-x-item"><b>${esc(x.name)}</b><div class="ha-x-muted">${esc(fmtCoord(x))}</div><div class="ha-x-grid" style="margin-top:7px"><button class="ha-x-btn" data-fav-start="${x.id}">كانطلاق</button><button class="ha-x-btn alt" data-fav-end="${x.id}">كوصول</button></div><button class="ha-x-btn alt" style="width:100%;margin-top:6px" data-fav-del="${x.id}">حذف</button></div>`).join(''):'<div class="ha-x-muted">ما عندك أماكن محفوظة بعد.</div>'}
  function useFav(id,kind){const x=favs().find(v=>String(v.id)===String(id));if(!x)return;try{const p=L.latLng(x.lat,x.lng);setPoint(kind,p,x.name);if(kind==='start')setMode('end');close()}catch(e){console.error(e);alert('تعذر استخدام المكان المحفوظ.') }}
  function delFav(id){saveFavs(favs().filter(v=>String(v.id)!==String(id)));renderFavs()}
  async function loadHistory(){const box=document.getElementById('haXHistoryList');if(!box||!window.firebase?.database)return;box.textContent='جاري تحميل الرحلات...';try{await HA_FirebaseAuth.ready();const uid=firebase.auth().currentUser?.uid;if(!uid){box.textContent='تعذر تحديد حساب الرحلات.';return}const snap=await firebase.database().ref('rides').once('value');const rides=[];snap.forEach(c=>{const r=c.val()||{};if(r.customerUid===uid && (r.serviceType||'taxi')===service)rides.push({id:c.key,...r})});rides.sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));box.innerHTML=rides.length?rides.slice(0,30).map(r=>`<div class="ha-x-item"><b>${statusLabel(r.status)} • ${money(r.price)}</b><div class="ha-x-muted">${date(r.createdAt)}<br>من: ${esc(fmtCoord(r.pickup))}<br>إلى: ${esc(fmtCoord(r.destination))}${r.driver?.name?'<br>السائق: '+esc(r.driver.name):''}</div></div>`).join(''):'ما عندك رحلات سابقة.'}catch(e){console.error(e);box.textContent='تعذر تحميل سجل الرحلات.'}}
  async function shareRide(){const state=document.getElementById('haXShareState');const id=localStorage.getItem('ha_active_ride');if(!id){state.textContent='لا توجد رحلة فعالة حالياً.';return}try{const s=await firebase.database().ref('rides/'+id).once('value');const r=s.val();if(!r){state.textContent='تعذر العثور على الرحلة.';return}const text=`HA Marketing - ${labels[service]}\nالحالة: ${statusLabel(r.status)}\nالانطلاق: ${fmtCoord(r.pickup)}\nالوصول: ${fmtCoord(r.destination)}${r.driver?.name?'\nالسائق: '+r.driver.name:''}`;if(navigator.share){await navigator.share({title:'تفاصيل الرحلة',text})}else{await navigator.clipboard.writeText(text);state.textContent='تم نسخ تفاصيل الرحلة.'}}catch(e){if(e?.name!=='AbortError'){console.error(e);state.textContent='تعذرت المشاركة.'}}}
  function bind(){
    document.getElementById('haXOpen').onclick=open;document.getElementById('haXClose').onclick=close;document.getElementById('haTransportExtras').onclick=e=>{if(e.target.id==='haTransportExtras')close()};
    document.querySelectorAll('.ha-x-tab').forEach(b=>b.onclick=()=>{document.querySelectorAll('.ha-x-tab').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.ha-x-pane').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.getElementById('haX'+b.dataset.x).classList.add('active');if(b.dataset.x==='history')loadHistory();if(b.dataset.x==='favorites')renderFavs()});
    document.getElementById('haSaveStart').onclick=()=>savePoint('start');document.getElementById('haSaveEnd').onclick=()=>savePoint('end');document.getElementById('haXFavList').onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.favStart)useFav(b.dataset.favStart,'start');if(b.dataset.favEnd)useFav(b.dataset.favEnd,'end');if(b.dataset.favDel)delFav(b.dataset.favDel)};
    document.getElementById('haShareRide').onclick=shareRide;
    const inp=document.getElementById('haEmergencyPhone');inp.value=localStorage.getItem(LS_EMERGENCY)||'';document.getElementById('haSaveEmergency').onclick=()=>{const v=inp.value.trim();if(!v){alert('اكتب الرقم أولاً.');return}localStorage.setItem(LS_EMERGENCY,v);alert('تم حفظ الرقم.')};document.getElementById('haCallEmergency').onclick=()=>{const v=(localStorage.getItem(LS_EMERGENCY)||inp.value).trim();if(!v){alert('احفظ رقم جهة الاتصال أولاً.');return}location.href='tel:'+v.replace(/[^+\d]/g,'')};
  }
  document.addEventListener('DOMContentLoaded',()=>{css();html();bind()});
})();
