(()=>{
'use strict';
if(window.HABusinessAccounting)return;window.HABusinessAccounting=true;
const root=new URL('./',document.currentScript.src),page=location.pathname.slice(root.pathname.length);
const style=document.createElement('link');style.rel='stylesheet';style.href=new URL('ha-business-tools.css?v=1',root);document.head.append(style);
function card(id,title,description,href,icon){if(document.getElementById(id))return;const host=document.querySelector('main.ha-main,main .ha-main,.ha-main,main');if(!host)return;const a=document.createElement('a');a.id=id;a.className='ha-business-card';a.href=new URL(href,root);const img=document.createElement('img');img.src=new URL(icon,root);img.alt='';const span=document.createElement('span'),h=document.createElement('strong'),p=document.createElement('small');h.textContent=title;p.textContent=description;span.append(h,p);a.append(img,span);const tiles=id==='haGeneratorEntry'&&host.querySelector('.ha-cats');if(tiles){a.classList.add('ha-business-home');tiles.append(a);}else host.append(a);}
async function init(){
 if(!['','index.html','shop.html','seller-dashboard.html'].includes(page))return;
 try{const db=await window.HA_AccountGate.getClient(),u=await db.auth.getUser();if(u.error||!u.data?.user||u.data.user.is_anonymous)return;
 const [seller,admin]=await Promise.all([db.rpc('has_approved_role',{p_role:'seller'}),db.rpc('is_super_admin')]);
 if(['shop.html','seller-dashboard.html'].includes(page)&&((!seller.error&&seller.data===true)||(!admin.error&&admin.data===true)))card('haAccountingEntry','برنامج المحاسبة','لأصحاب المحلات • التفعيل بموافقة الإدارة','accounting-access.html','ha-accounting-cover.svg');
 if(!admin.error&&admin.data===true)card('haAccountingAdminEntry','طلبات تفعيل المحاسبة','موافقة أو رفض وإيقاف الوصول','admin-accounting.html','ha-accounting-cover.svg');
 }catch(_){}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
addEventListener('ha:print-auth-change',()=>{for(const id of ['haAccountingEntry','haAccountingAdminEntry'])document.getElementById(id)?.remove();init();});
})();
