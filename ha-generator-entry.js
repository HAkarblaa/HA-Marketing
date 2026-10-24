(()=>{
'use strict';
if(window.HABusinessGenerator)return;window.HABusinessGenerator=true;
const root=new URL('./',document.currentScript.src),page=location.pathname.slice(root.pathname.length);
const style=document.createElement('link');style.rel='stylesheet';style.href=new URL('ha-business-tools.css?v=1',root);document.head.append(style);
function card(id,title,description,href,icon){if(document.getElementById(id))return;const host=document.querySelector('main.ha-main,main .ha-main,.ha-main,main');if(!host)return;const a=document.createElement('a');a.id=id;a.className='ha-business-card';a.href=new URL(href,root);const img=document.createElement('img');img.src=new URL(icon,root);img.alt='';const span=document.createElement('span'),h=document.createElement('strong'),p=document.createElement('small');h.textContent=title;p.textContent=description;span.append(h,p);a.append(img,span);const tiles=id==='haGeneratorEntry'&&host.querySelector('.ha-cats');if(tiles){a.classList.add('ha-business-home');tiles.append(a);}else host.append(a);}
function init(){if(page===''||page==='index.html')card('haGeneratorEntry','إدارة المولدة','المشتركون والجباية والتقارير','generator/index.html','ha-generator-cover.svg');}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
