(function(root){'use strict';const key='ha-followed-football-teams-v1';
function logo(raw){try{const u=new URL(raw);return u.protocol==='https:'&&(u.hostname==='espncdn.com'||u.hostname.endsWith('.espncdn.com'))?u.href:''}catch(_){return ''}}
function clean(t){if(!t||!/^\d{1,12}$/.test(String(t.id))||!HAFootballTeamLeagues.some(x=>x[0]===t.league))return null;return{id:String(t.id),league:t.league,name:String(t.name||'فريق').slice(0,100),logo:logo(t.logo)}}
function list(){try{const a=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(a)?a.map(clean).filter(Boolean).slice(0,100):[]}catch(_){return []}}
function has(t){return list().some(x=>x.id===t.id&&x.league===t.league)}
function toggle(raw){const t=clean(raw);if(!t)throw Error('بيانات الفريق غير صالحة.');const a=list(),i=a.findIndex(x=>x.id===t.id&&x.league===t.league);if(i>=0)a.splice(i,1);else{if(a.length>=100)throw Error('وصلت إلى حد ١٠٠ متابعة على هذا الجهاز.');a.push(t)}try{localStorage.setItem(key,JSON.stringify(a))}catch(_){throw Error('تعذر حفظ المتابعة على هذا الجهاز. تحقق من إعدادات التخزين.')}return i<0}
root.HAFootballTeamStore={list,has,toggle,logo};
})(window);
