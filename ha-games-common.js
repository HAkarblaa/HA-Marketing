(function(){
  const STORAGE_KEY='ha_games_records_v1';
  const USER_KEYS=['ha_user','ha_current_user','currentUser','user','profile'];
  function parseJson(v){try{return JSON.parse(v)}catch(e){return null}}
  function detectUser(){
    for(const k of USER_KEYS){
      const raw=localStorage.getItem(k); if(!raw) continue;
      const obj=parseJson(raw); if(obj && typeof obj==='object'){
        const username=obj.username||obj.user_name||obj.handle||obj.userHandle||obj.slug||'';
        const name=obj.full_name||obj.fullName||obj.name||obj.display_name||obj.email||'مستخدم HA';
        const id=obj.id||obj.user_id||obj.uid||obj.uuid||username||'guest';
        return {id:String(id), username:String(username||('user_'+String(id).slice(0,6))), name:String(name)};
      }
    }
    return {id:'guest-device', username:'guest', name:'زائر الجهاز'};
  }
  function getData(){return parseJson(localStorage.getItem(STORAGE_KEY))||{games:{},history:[]}}
  function setData(data){localStorage.setItem(STORAGE_KEY,JSON.stringify(data))}
  function saveScore(gameKey, gameTitle, score, meta={}){
    const user=detectUser(); const data=getData();
    if(!data.games[gameKey]) data.games[gameKey]={title:gameTitle, players:{}};
    const p=data.games[gameKey].players[user.id] || {userId:user.id,username:user.username,name:user.name,totalScore:0,bestScore:0,playCount:0,wins:0,lastScore:0,updatedAt:null};
    p.username=user.username; p.name=user.name; p.totalScore += Math.max(0,Math.floor(score||0)); p.lastScore=Math.floor(score||0); p.playCount += 1; p.bestScore=Math.max(p.bestScore,p.lastScore); if(meta.win) p.wins+=1; p.updatedAt=new Date().toISOString();
    data.games[gameKey].players[user.id]=p;
    data.history.unshift({gameKey,gameTitle,score:p.lastScore,userId:user.id,username:user.username,name:user.name,at:p.updatedAt,win:!!meta.win});
    data.history=data.history.slice(0,400);
    setData(data);
    return p;
  }
  function getLeaderboard(gameKey){
    const data=getData();
    if(gameKey==='all'){
      const map={};
      Object.entries(data.games).forEach(([k,g])=>{
        Object.values(g.players||{}).forEach(p=>{
          if(!map[p.userId]) map[p.userId]={userId:p.userId,username:p.username,name:p.name,totalScore:0,bestScore:0,playCount:0,wins:0,games:0};
          const m=map[p.userId]; m.username=p.username; m.name=p.name; m.totalScore += p.totalScore||0; m.bestScore=Math.max(m.bestScore,p.bestScore||0); m.playCount += p.playCount||0; m.wins += p.wins||0; m.games += 1;
        })
      });
      return Object.values(map).sort((a,b)=> b.totalScore-a.totalScore || b.bestScore-a.bestScore || b.playCount-a.playCount);
    }
    const g=data.games[gameKey]; if(!g) return [];
    return Object.values(g.players||{}).sort((a,b)=> b.totalScore-a.totalScore || b.bestScore-a.bestScore || b.playCount-a.playCount);
  }
  function getGameSummaries(){ const data=getData(); return Object.entries(data.games).map(([key,g])=>({key,title:g.title||key,count:Object.keys(g.players||{}).length})); }
  function renderMiniLeaderboard(el, gameKey, limit=8){ if(!el) return; const list=getLeaderboard(gameKey).slice(0,limit); el.innerHTML=list.length?list.map((p,i)=>`<div class="list-item"><div>#${i+1} - ${escapeHtml(p.name)} <span class="small">@${escapeHtml(p.username)}</span></div><div>${p.totalScore} نقطة</div></div>`).join(''):'<div class="notice">لا توجد نتائج بعد.</div>'; }
  function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]))}
  function beep(type='tick'){
    try{
      const C=window.AudioContext||window.webkitAudioContext; if(!C) return; const ctx=new C(); const o=ctx.createOscillator(); const g=ctx.createGain(); o.connect(g); g.connect(ctx.destination);
      const now=ctx.currentTime; const preset={tick:[660,.07,'square'],coin:[880,.12,'triangle'],hit:[180,.15,'sawtooth'],jump:[520,.1,'triangle'],lose:[140,.25,'sawtooth'],win:[740,.2,'square']};
      const [freq,dur,wave]=(preset[type]||preset.tick); o.type=wave; o.frequency.value=freq; g.gain.setValueAtTime(.0001,now); g.gain.exponentialRampToValueAtTime(.15,now+.01); g.gain.exponentialRampToValueAtTime(.0001,now+dur); o.start(now); o.stop(now+dur+.02);
    }catch(e){}
  }
  function toast(msg){ let t=document.getElementById('ha-toast'); if(!t){t=document.createElement('div'); t.id='ha-toast'; t.style.cssText='position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#111827;color:#fff;padding:12px 16px;border-radius:14px;z-index:99999;border:1px solid rgba(255,255,255,.1);box-shadow:0 10px 40px rgba(0,0,0,.35)'; document.body.appendChild(t);} t.textContent=msg; t.style.opacity='1'; clearTimeout(t._h); t._h=setTimeout(()=>t.style.opacity='0',2200); }
  function bindFullscreen(btn, targetSelector){ if(!btn) return; btn.addEventListener('click',()=>{ const el=document.querySelector(targetSelector); if(!el) return; el.classList.toggle('fullscreen-fixed'); }); }
  window.HAGames={detectUser,saveScore,getLeaderboard,getGameSummaries,renderMiniLeaderboard,beep,toast,bindFullscreen};
})();
