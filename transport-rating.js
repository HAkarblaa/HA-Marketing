// HA Marketing - customer/driver rating after service
(function(){
  function starsHtml(prefix){
    return [1,2,3,4,5].map(n=>`<button type="button" class="ha-rate-star" data-rate="${n}" aria-label="${n} نجوم">★</button>`).join('');
  }
  function ensureStyles(){
    if(document.getElementById('haRatingStyles'))return;
    const st=document.createElement('style');st.id='haRatingStyles';
    st.textContent=`
    .ha-rating-overlay{position:fixed;inset:0;background:#0009;z-index:99999;display:none;align-items:center;justify-content:center;padding:18px}
    .ha-rating-overlay.show{display:flex}
    .ha-rating-card{width:min(420px,100%);background:#fff;border-radius:20px;padding:20px;text-align:center;box-shadow:0 20px 60px #0006}
    .ha-rating-title{font-size:20px;font-weight:900;margin-bottom:7px}
    .ha-rating-sub{font-size:13px;color:#666;margin-bottom:14px}
    .ha-rating-stars{display:flex;direction:ltr;justify-content:center;gap:6px;margin:10px 0 15px}
    .ha-rate-star{border:0;background:transparent;font-size:37px;color:#c7c7c7;cursor:pointer;padding:2px}
    .ha-rate-star.on{color:#f5a900}
    .ha-rating-note{width:100%;box-sizing:border-box;border:1px solid #ddd;border-radius:12px;padding:10px;min-height:72px;resize:none;font-family:inherit}
    .ha-rating-send{width:100%;border:0;border-radius:12px;background:#111;color:#fff;padding:12px;margin-top:10px;font-weight:800;cursor:pointer}
    .ha-rating-skip{border:0;background:transparent;color:#777;margin-top:9px;cursor:pointer}`;
    document.head.appendChild(st);
  }
  async function alreadyRated(rideId,role){
    const s=await firebase.database().ref(`rides/${rideId}/ratings/${role}`).once('value');
    return s.exists();
  }
  async function show({rideId,role,targetName='الطرف الآخر'}){
    if(!rideId||!window.firebase?.database)return;
    if(await alreadyRated(rideId,role))return;
    ensureStyles();
    const old=document.getElementById('haRatingOverlay');if(old)old.remove();
    const ov=document.createElement('div');ov.id='haRatingOverlay';ov.className='ha-rating-overlay show';
    ov.innerHTML=`<div class="ha-rating-card">
      <div class="ha-rating-title">قيّم الخدمة</div>
      <div class="ha-rating-sub">شلون كانت تجربتك ويا ${targetName}؟</div>
      <div class="ha-rating-stars">${starsHtml()}</div>
      <textarea class="ha-rating-note" maxlength="300" placeholder="ملاحظة اختيارية..."></textarea>
      <button class="ha-rating-send" type="button">إرسال التقييم</button>
      <button class="ha-rating-skip" type="button">لاحقاً</button>
    </div>`;
    document.body.appendChild(ov);
    let score=0;
    const stars=[...ov.querySelectorAll('.ha-rate-star')];
    stars.forEach(btn=>btn.onclick=()=>{
      score=Number(btn.dataset.rate);
      stars.forEach((x,i)=>x.classList.toggle('on',i<score));
    });
    ov.querySelector('.ha-rating-skip').onclick=()=>ov.remove();
    ov.querySelector('.ha-rating-send').onclick=async()=>{
      if(!score){alert('اختار عدد النجوم أولاً.');return}
      const note=ov.querySelector('.ha-rating-note').value.trim();
      const payload={score,note,createdAt:firebase.database.ServerValue.TIMESTAMP};
      await firebase.database().ref(`rides/${rideId}/ratings/${role}`).set(payload);
      await firebase.database().ref(`rides/${rideId}`).update({
        [`${role}Rating`]:score,
        [`${role}RatingAt`]:firebase.database.ServerValue.TIMESTAMP
      });
      ov.remove();
      alert('تم إرسال التقييم، شكراً.');
    };
  }
  window.HA_Rating={show,alreadyRated};
})();
