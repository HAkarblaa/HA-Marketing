(function(){
'use strict';

const SUPABASE_URL='https://ubayrhtshgtgggxprrek.supabase.co';
const SUPABASE_KEY='sb_publishable_p3108yoDkdJTLqVXhkvmBg_KVqe-1ll';
const AUTH_OPTIONS={persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'ha-marketing-auth'};
const ALLOWED_GAMES=['snake','penalties','domino','chess','backgammon'];
let client=null;

function db(){
  if(client)return client;
  if(!window.supabase||typeof window.supabase.createClient!=='function')return null;
  client=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:AUTH_OPTIONS});
  return client;
}

function newPlayId(gameKey){
  let id='';
  try{id=crypto.randomUUID()}catch(_e){id=Math.random().toString(36).slice(2)+Date.now().toString(36)}
  return String(gameKey||'game')+'-'+Date.now()+'-'+id;
}

async function currentUser(){
  const c=db();
  if(!c)return null;
  try{
    const {data}=await c.auth.getSession();
    return data?.session?.user||null;
  }catch(_e){return null}
}

async function record(gameKey,score,options){
  options=options||{};
  gameKey=String(gameKey||'').toLowerCase();
  if(!ALLOWED_GAMES.includes(gameKey))return {ok:false,reason:'game'};
  const c=db();
  if(!c)return {ok:false,reason:'sdk'};
  const user=await currentUser();
  if(!user)return {ok:false,guest:true};

  const points=Math.max(0,Math.min(100000,Math.floor(Number(score)||0)));
  const playId=String(options.playId||newPlayId(gameKey)).slice(0,140);
  try{
    const {data,error}=await c.rpc('ha_record_game_score',{
      p_game_key:gameKey,
      p_score:points,
      p_won:!!options.won,
      p_play_id:playId
    });
    if(error){
      console.warn('HA ranking record:',error.message||error);
      return {ok:false,error};
    }
    return data||{ok:true};
  }catch(error){
    console.warn('HA ranking record:',error);
    return {ok:false,error};
  }
}

async function leaderboard(gameKey,limit){
  const c=db();
  if(!c)return {data:null,error:new Error('Supabase SDK غير جاهز')};
  try{
    return await c.rpc('ha_game_leaderboard',{
      p_game_key:(gameKey&&gameKey!=='all')?String(gameKey):'all',
      p_limit:Math.max(1,Math.min(100,Number(limit)||50))
    });
  }catch(error){
    return {data:null,error};
  }
}

window.HA_GameRanking={
  record,
  leaderboard,
  currentUser,
  newPlayId,
  games:ALLOWED_GAMES.slice()
};
})();