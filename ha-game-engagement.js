
(function(){
  'use strict';

  const ROOT='ha_game_center_v1';
  const TODAY=()=>{
    const d=new Date();
    const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
  };
  const DAY_MS=86400000;

  const GAMES={
    'snake.html':{key:'snake',title:'لعبة الحية',icon:'🐍'},
    'bird-game.html':{key:'bird-game',title:'لعبة الطائر',icon:'🐦'},
    'level-devil.html':{key:'level-devil',title:'ليفل ديفل',icon:'👿'},
    'war-game.html':{key:'war-game',title:'حرب الدبابات',icon:'🪖'},
    'penalties.html':{key:'penalties',title:'ركلات الجزاء',icon:'⚽'}
  };

  function read(){
    try{
      const d=JSON.parse(localStorage.getItem(ROOT)||'null');
      if(d&&typeof d==='object')return d;
    }catch(_e){}
    return {
      totalSessions:0,
      games:{},
      days:{},
      streak:0,
      lastPlayDay:'',
      dailyRewards:{},
      challengeClaims:{},
      achievementClaims:{},
      universalCoins:0,
      bonusXp:0
    };
  }
  function write(d){
    try{localStorage.setItem(ROOT,JSON.stringify(d))}catch(_e){}
  }
  function dayDiff(a,b){
    if(!a||!b)return 999;
    const aa=new Date(a+'T00:00:00'),bb=new Date(b+'T00:00:00');
    return Math.round((bb-aa)/DAY_MS);
  }
  function ensureDay(d,date=TODAY()){
    d.days[date]??={sessions:0,games:{}};
    return d.days[date];
  }

  function detectGame(){
    const file=(location.pathname.split('/').pop()||'').toLowerCase();
    return GAMES[file]||null;
  }

  function recordVisit(game){
    if(!game)return;
    const tabKey=`ha_eng_visit_${TODAY()}_${game.key}`;
    // One session per page/tab load; reload in the same tab won't farm points.
    if(sessionStorage.getItem(tabKey))return;
    sessionStorage.setItem(tabKey,'1');

    const d=read(),today=TODAY(),day=ensureDay(d,today);

    d.totalSessions++;
    d.games[game.key]??={title:game.title,icon:game.icon,sessions:0,lastPlay:''};
    d.games[game.key].sessions++;
    d.games[game.key].lastPlay=today;

    day.sessions++;
    day.games[game.key]=(day.games[game.key]||0)+1;

    if(d.lastPlayDay!==today){
      const diff=dayDiff(d.lastPlayDay,today);
      d.streak=diff===1?Math.max(1,(d.streak||0)+1):1;
      d.lastPlayDay=today;
    }

    write(d);
  }

  function dateSeed(){
    return Number(TODAY().replaceAll('-',''))||1;
  }

  function challenges(){
    const gameList=[
      {key:'snake',title:'لعبة الحية',icon:'🐍'},
      {key:'bird-game',title:'لعبة الطائر',icon:'🐦'},
      {key:'level-devil',title:'ليفل ديفل',icon:'👿'},
      {key:'war-game',title:'حرب الدبابات',icon:'🪖'}
    ];
    const target=gameList[dateSeed()%gameList.length];
    return [
      {id:'sessions3',title:'العب 3 جولات اليوم',reward:20,type:'sessions',target:3,icon:'🎮'},
      {id:'unique2',title:'العب لعبتين مختلفتين',reward:25,type:'unique',target:2,icon:'🧩'},
      {id:'target',title:`العب ${target.title} اليوم`,reward:30,type:'game',target:1,game:target.key,icon:target.icon}
    ];
  }

  function challengeProgress(ch,d=read()){
    const day=ensureDay(d,TODAY());
    if(ch.type==='sessions')return Math.min(ch.target,day.sessions||0);
    if(ch.type==='unique')return Math.min(ch.target,Object.keys(day.games||{}).length);
    if(ch.type==='game')return (day.games?.[ch.game]||0)>0?1:0;
    return 0;
  }

  function dailyRewardStatus(d=read()){
    const today=TODAY();
    return {
      claimed:!!d.dailyRewards?.[today],
      coins:25 + Math.min(25,(d.streak||1)*2),
      xp:20
    };
  }

  function claimDailyReward(){
    const d=read(),today=TODAY(),st=dailyRewardStatus(d);
    if(st.claimed)return st;
    d.dailyRewards[today]={at:Date.now(),coins:st.coins,xp:st.xp};
    d.universalCoins=(d.universalCoins||0)+st.coins;
    d.bonusXp=(d.bonusXp||0)+st.xp;
    write(d);
    return dailyRewardStatus(d);
  }

  function claimCompletedChallenges(){
    const d=read(),today=TODAY();
    d.challengeClaims[today]??={};
    let gained=0,count=0;
    for(const ch of challenges()){
      const done=challengeProgress(ch,d)>=ch.target;
      if(done&&!d.challengeClaims[today][ch.id]){
        d.challengeClaims[today][ch.id]=true;
        d.universalCoins=(d.universalCoins||0)+ch.reward;
        d.bonusXp=(d.bonusXp||0)+ch.reward;
        gained+=ch.reward;
        count++;
      }
    }
    write(d);
    return {gained,count};
  }

  function localBestSignals(){
    let snake=0,level=0,bird=0;
    try{snake=Number(localStorage.getItem('ha_snake_best_v2')||0)}catch(_e){}
    try{
      const p=JSON.parse(localStorage.getItem('ha_level_devil_progress_v1')||'{}');
      level=Number(p.bestLevel||p.unlocked||0);
    }catch(_e){}
    try{
      const d=JSON.parse(localStorage.getItem('ha_games_records_v2')||'{}');
      const players=d?.games?.['bird-game']?.players||{};
      bird=Math.max(0,...Object.values(players).map(x=>Number(x.bestScore||0)));
    }catch(_e){}
    return {snake,level,bird};
  }

  function achievements(d=read()){
    const unique=Object.keys(d.games||{}).length;
    const sig=localBestSignals();
    return [
      {id:'first',icon:'🎮',title:'البداية',desc:'العب أول لعبة',done:d.totalSessions>=1},
      {id:'ten',icon:'🔥',title:'متحمس',desc:'العب 10 جولات',done:d.totalSessions>=10},
      {id:'threegames',icon:'🧩',title:'متنوع',desc:'جرّب 3 ألعاب مختلفة',done:unique>=3},
      {id:'fivegames',icon:'🌟',title:'مستكشف الألعاب',desc:'جرّب 5 ألعاب مختلفة',done:unique>=5},
      {id:'streak3',icon:'📅',title:'3 أيام متتالية',desc:'العب 3 أيام بدون انقطاع',done:(d.streak||0)>=3},
      {id:'streak7',icon:'🏅',title:'أسبوع كامل',desc:'العب 7 أيام متتالية',done:(d.streak||0)>=7},
      {id:'snake100',icon:'🐍',title:'محترف الحية',desc:'أفضل نتيجة 100+',done:sig.snake>=100},
      {id:'level10',icon:'👿',title:'كاسر الفخاخ',desc:'وصل مرحلة 10 بليفل ديفل',done:sig.level>=10},
      {id:'bird15',icon:'🐦',title:'طيران عالي',desc:'أفضل نتيجة طائر 15+',done:sig.bird>=15}
    ];
  }

  function totalXp(d=read()){
    const doneAchievements=achievements(d).filter(a=>a.done).length;
    return (d.totalSessions||0)*10 + (d.bonusXp||0) + doneAchievements*40;
  }

  function summary(){
    const d=read(),xp=totalXp(d),level=Math.max(1,Math.floor(xp/100)+1),inLevel=xp%100;
    const ach=achievements(d),done=ach.filter(a=>a.done).length;
    const day=ensureDay(d,TODAY());
    const ch=challenges();
    return {
      data:d,xp,level,inLevel,
      coins:d.universalCoins||0,
      streak:d.streak||0,
      sessions:d.totalSessions||0,
      uniqueGames:Object.keys(d.games||{}).length,
      todaySessions:day.sessions||0,
      todayUnique:Object.keys(day.games||{}).length,
      achievements:ach,
      achievementsDone:done,
      challenges:ch.map(x=>({...x,progress:challengeProgress(x,d),claimed:!!d.challengeClaims?.[TODAY()]?.[x.id]})),
      reward:dailyRewardStatus(d)
    };
  }

  async function overallLeaderboard(limit=5){
    if(!window.supabase?.createClient)return [];
    try{
      const db=window.supabase.createClient(
        'https://ubayrhtshgtgggxprrek.supabase.co',
        'sb_publishable_p3108yoDkdJTLqVXhkvmBg_KVqe-1ll',
        {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'ha-marketing-auth'}}
      );
      const r=await db.from('ha_game_scores')
        .select('user_id,display_name,username,total_score')
        .order('total_score',{ascending:false})
        .limit(500);
      if(r.error||!Array.isArray(r.data))return [];
      const map=new Map();
      for(const row of r.data){
        const id=row.user_id||row.username||row.display_name||'unknown';
        const old=map.get(id)||{id,name:row.display_name||row.username||'لاعب',score:0};
        old.score+=Number(row.total_score||0);
        if(row.display_name)old.name=row.display_name;
        map.set(id,old);
      }
      return [...map.values()].sort((a,b)=>b.score-a.score).slice(0,limit);
    }catch(_e){return []}
  }

  function renderMini(){
    const box=document.getElementById('haGameCenterMini');
    if(!box)return;
    const s=summary();
    const done=s.challenges.filter(x=>x.progress>=x.target).length;
    box.innerHTML=`
      <div class="gc-mini-stat"><b>${s.level}</b><small>مستواك</small></div>
      <div class="gc-mini-stat"><b>${s.streak} 🔥</b><small>سلسلة الأيام</small></div>
      <div class="gc-mini-stat"><b>${done}/3</b><small>تحديات اليوم</small></div>
      <div class="gc-mini-stat"><b>${s.coins} 🪙</b><small>عملات الألعاب</small></div>`;
  }

  const game=detectGame();
  if(game)recordVisit(game);

  window.HAGameCenter={
    read,write,summary,challenges,achievements,
    claimDailyReward,claimCompletedChallenges,
    overallLeaderboard,renderMini,TODAY
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',renderMini);
  else renderMini();
})();
