(function(){
'use strict';

const URL='https://ubayrhtshgtgggxprrek.supabase.co';
const KEY='sb_publishable_p3108yoDkdJTLqVXhkvmBg_KVqe-1ll';

let client=null;
function db(){
  if(window.db && typeof window.db.from==='function') return window.db;
  if(client) return client;
  if(!window.supabase?.createClient) throw new Error('Supabase غير متوفر');
  client=window.supabase.createClient(URL,KEY,{
    auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'ha-marketing-auth'}
  });
  return client;
}
function esc(s){
  return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function styles(){
  if(document.getElementById('haUniversalRatingStyles'))return;
  const st=document.createElement('style');
  st.id='haUniversalRatingStyles';
  st.textContent=`
  .ha-ur-wrap{background:#fff;border:1px solid #e2e8e6;border-radius:18px;padding:15px;margin:12px 0;box-shadow:0 8px 24px #15304b0c}
  .ha-ur-head{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
  .ha-ur-title{font-weight:900;font-size:18px;color:#17334d}
  .ha-ur-summary{display:flex;align-items:center;gap:7px;font-weight:900;color:#17334d}
  .ha-ur-summary .score{font-size:24px}
  .ha-ur-stars,.ha-ur-pick{display:flex;direction:ltr;gap:2px;align-items:center}
  .ha-ur-stars span{font-size:20px;color:#f6aa00}
  .ha-ur-pick{justify-content:center;margin:12px 0}
  .ha-ur-pick button{border:0;background:transparent;color:#c8cdd0;font-size:37px;padding:2px;cursor:pointer;line-height:1}
  .ha-ur-pick button.on{color:#f6aa00}
  .ha-ur-comment{width:100%;min-height:76px;border:1px solid #d7e0df;border-radius:12px;padding:10px;font:inherit;resize:vertical}
  .ha-ur-send{width:100%;border:0;border-radius:12px;background:#087f61;color:#fff;padding:12px;margin-top:8px;font:inherit;font-weight:900;cursor:pointer}
  .ha-ur-send:disabled{opacity:.55}
  .ha-ur-note{font-size:11px;color:#71808a;margin-top:6px;line-height:1.6}
  .ha-ur-reviews{margin-top:12px}
  .ha-ur-review{padding:10px 0;border-top:1px solid #edf1f0}
  .ha-ur-review:first-child{border-top:0}
  .ha-ur-review .stars{color:#f6aa00;font-size:17px}
  .ha-ur-empty{color:#71808a;padding:8px 0}
  `;
  document.head.appendChild(st);
}
function stars(score){
  const n=Math.max(0,Math.min(5,Math.round(Number(score)||0)));
  return '★'.repeat(n)+'☆'.repeat(5-n);
}

async function mount(opts){
  styles();
  const targetType=String(opts.targetType||'person');
  const targetKey=String(opts.targetKey||'');
  const container=typeof opts.container==='string'?document.querySelector(opts.container):opts.container;
  if(!container||!targetKey)return;

  const name=opts.targetName||'العنصر';
  const roleLabel=opts.roleLabel||'';
  container.innerHTML=`<div class="ha-ur-wrap">
    <div class="ha-ur-head">
      <div>
        <div class="ha-ur-title">⭐ تقييم ${esc(name)}</div>
        ${roleLabel?`<div class="ha-ur-note">${esc(roleLabel)}</div>`:''}
      </div>
      <div class="ha-ur-summary">
        <span class="score" data-ha-score>—</span><span>/ 5</span>
        <span data-ha-count></span>
      </div>
    </div>
    <div class="ha-ur-form">
      <div class="ha-ur-pick">${[1,2,3,4,5].map(n=>`<button type="button" data-rate="${n}" aria-label="${n} نجوم">★</button>`).join('')}</div>
      <textarea class="ha-ur-comment" maxlength="500" placeholder="اكتب رأيك أو ملاحظتك (اختياري)"></textarea>
      <button class="ha-ur-send" type="button">إرسال التقييم</button>
      <div class="ha-ur-note">التقييم من نجمة إلى خمس نجوم، وتكدر تعدله بعدين.</div>
    </div>
    <div class="ha-ur-reviews"></div>
  </div>`;

  let score=0;
  const pick=[...container.querySelectorAll('.ha-ur-pick button')];
  pick.forEach(btn=>btn.onclick=()=>{
    score=Number(btn.dataset.rate);
    pick.forEach((x,i)=>x.classList.toggle('on',i<score));
  });

  const send=container.querySelector('.ha-ur-send');
  send.onclick=async()=>{
    if(!score){alert('اختار عدد النجوم أولاً.');return}
    const supa=db();
    const {data:{session}}=await supa.auth.getSession();
    if(!session){
      const next=encodeURIComponent(location.pathname.split('/').pop()+location.search);
      location.href='login.html?next='+next;
      return;
    }
    send.disabled=true;
    const comment=container.querySelector('.ha-ur-comment').value.trim();
    const {error}=await supa.rpc('submit_app_rating',{
      p_target_type:targetType,
      p_target_key:targetKey,
      p_rating:score,
      p_comment:comment||null
    });
    send.disabled=false;
    if(error){alert('تعذر حفظ التقييم: '+error.message);return}
    container.querySelector('.ha-ur-comment').value='';
    await load();
  };

  async function load(){
    const supa=db();
    const {data,error}=await supa.from('app_ratings')
      .select('rating,comment,created_at,user_id')
      .eq('target_type',targetType)
      .eq('target_key',targetKey)
      .order('created_at',{ascending:false});
    if(error){
      container.querySelector('.ha-ur-reviews').innerHTML='<div class="ha-ur-empty">شغّل ملف UNIVERSAL-RATINGS.sql حتى يشتغل نظام التقييم.</div>';
      return;
    }
    const arr=data||[];
    const avg=arr.length?arr.reduce((s,x)=>s+Number(x.rating||0),0)/arr.length:0;
    container.querySelector('[data-ha-score]').textContent=arr.length?avg.toFixed(1):'—';
    container.querySelector('[data-ha-count]').textContent=arr.length?`(${arr.length} تقييم)`:'(بدون تقييم)';
    container.querySelector('.ha-ur-reviews').innerHTML=arr.length
      ?arr.slice(0,20).map(r=>`<div class="ha-ur-review"><div class="stars">${stars(r.rating)}</div>${r.comment?`<div>${esc(r.comment)}</div>`:''}<div class="ha-ur-note">${new Date(r.created_at).toLocaleDateString('ar-IQ')}</div></div>`).join('')
      :'<div class="ha-ur-empty">لا توجد تقييمات بعد.</div>';

    // load current user's existing score so editing is easy
    try{
      const {data:{session}}=await supa.auth.getSession();
      if(session){
        const mine=arr.find(x=>x.user_id===session.user.id);
        if(mine){
          score=Number(mine.rating)||0;
          pick.forEach((x,i)=>x.classList.toggle('on',i<score));
          container.querySelector('.ha-ur-comment').value=mine.comment||'';
        }
      }
    }catch(_e){}
  }

  await load();
  return {reload:load};
}

window.HAUniversalRating={mount};
})();