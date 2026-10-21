(function(root){'use strict';
function stats(d,slug){const s=d?.statistics;if(!Array.isArray(s?.names))return [];const split=(s.splits||[]).find(x=>x.leagueSlug===slug);if(!split)return [];return s.names.map((name,i)=>({name,value:split.stats?.[i]??null,season:split.displayName||''})).filter(x=>x.value!==null)}
function games(d){const g=d?.gameLog;if(!g?.events)return [];const map=new Map();for(const group of g.statistics||[])for(const row of group.events||[]){const event=g.events[row.eventId];if(event&&/^\d+$/.test(String(event.id)))map.set(String(event.id),{...event,playerStats:(group.names||[]).map((name,i)=>({name,value:row.stats?.[i]??null})).filter(x=>x.value!==null)})}return [...map.values()].sort((a,b)=>Date.parse(b.gameDate)-Date.parse(a.gameDate))}
const api={stats,games};root.HAFootballPlayerCore=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
