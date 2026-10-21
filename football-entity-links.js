(function(root){'use strict';
function league(v){if(HAFootballTeamLeagues.some(x=>x[0]===v))return v;const s=HAFootballLeagueIds[String(v)];return HAFootballTeamLeagues.some(x=>x[0]===s)?s:null}
function matchLeague(d){const slug=d?.header?.leagues?.[0]?.slug;if(league(slug))return slug;const uid=d?.header?.uid||d?.header?.competitions?.[0]?.uid||'';return league(uid.match(/~l:([^~]+)/)?.[1])}
function node(kind,id,name,slug,cls=''){const valid=/^\d{1,12}$/.test(String(id||'')),l=league(slug);const n=document.createElement(valid&&l?'a':'span');n.textContent=String(name??'');n.dir='auto';n.className='fe-name '+cls;if(valid&&l){n.href=(kind==='player'?'football-player.html?player=':'football-team.html?team=')+encodeURIComponent(id)+'&league='+encodeURIComponent(l);n.setAttribute('aria-label',(kind==='player'?'صفحة اللاعب: ':'صفحة النادي: ')+String(name||''))}return n}
root.HAFootballEntities={league,matchLeague,node,club:(id,name,l,c)=>node('club',id,name,l,c),player:(id,name,l,c)=>node('player',id,name,l,c)};
})(window);
