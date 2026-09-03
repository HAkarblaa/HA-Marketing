// Supabase Edge Function: account-verification/index.ts
// Secrets required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID
// For email verification also connect your chosen transactional email provider; this template intentionally does not embed provider secrets in HTML.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
const json=(x:any,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{'content-type':'application/json'}})
Deno.serve(async(req)=>{try{
 const b=JSON.parse(await req.text()); const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
 const {data:u,error:ue}=await admin.auth.getUser(b.access_token); if(ue||!u.user)return json({ok:false,error:'جلسة غير فعالة'},401);
 const uid=u.user.id; const {data:p}=await admin.from('profiles').select('phone,contact_email').eq('id',uid).single();
 if(b.action==='send'){
   const channel=b.channel; if(!['whatsapp','email'].includes(channel))return json({ok:false,error:'قناة غير صحيحة'},400);
   const target=channel==='whatsapp'?p?.phone:(b.email||p?.contact_email); if(!target)return json({ok:false,error:'لا توجد جهة إرسال'},400);
   const {data:last}=await admin.from('account_verification_challenges').select('created_at').eq('user_id',uid).eq('channel',channel).order('created_at',{ascending:false}).limit(1).maybeSingle();
   if(last && Date.now()-new Date(last.created_at).getTime()<60000)return json({ok:false,error:'انتظر دقيقة قبل طلب رمز جديد'},429);
   const code=String(crypto.getRandomValues(new Uint32Array(1))[0]%1000000).padStart(6,'0');
   // Hash server-side. pgcrypto crypt is generated through an RPC in production; never store plaintext OTP.
   const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(code+'|'+uid+'|'+Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'))); const code_hash=Array.from(new Uint8Array(hash)).map(x=>x.toString(16).padStart(2,'0')).join('');
   await admin.from('account_verification_challenges').insert({user_id:uid,phone:channel==='whatsapp'?target:null,email:channel==='email'?target:null,channel,code_hash});
   if(channel==='whatsapp'){
     const token=Deno.env.get('WHATSAPP_TOKEN'),pid=Deno.env.get('WHATSAPP_PHONE_NUMBER_ID'); if(!token||!pid)return json({ok:false,error:'إعداد WhatsApp Business غير مكتمل'},503);
     const rr=await fetch(`https://graph.facebook.com/v23.0/${pid}/messages`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({messaging_product:'whatsapp',to:String(target).replace(/^0/,'964'),type:'template',template:{name:'ha_verification_code',language:{code:'ar'},components:[{type:'body',parameters:[{type:'text',text:code}]}]}})}); if(!rr.ok)return json({ok:false,error:'فشل إرسال واتساب'},502);
   } else return json({ok:false,error:'اربط مزود البريد داخل Edge Function قبل تفعيل إرسال البريد'},503);
   return json({ok:true});
 }
 if(b.action==='verify'){
   const {data:c}=await admin.from('account_verification_challenges').select('*').eq('user_id',uid).eq('channel',b.channel).is('consumed_at',null).order('created_at',{ascending:false}).limit(1).maybeSingle();
   if(!c||new Date(c.expires_at)<new Date())return json({ok:false,error:'انتهت صلاحية الرمز'},400); if(c.attempts>=3)return json({ok:false,error:'تم تجاوز 3 محاولات'},429);
   const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(b.code)+'|'+uid+'|'+Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'))); const got=Array.from(new Uint8Array(hash)).map(x=>x.toString(16).padStart(2,'0')).join('');
   if(got!==c.code_hash){await admin.from('account_verification_challenges').update({attempts:c.attempts+1}).eq('id',c.id);return json({ok:false,error:'الرمز غير صحيح'},400)}
   await admin.from('account_verification_challenges').update({consumed_at:new Date().toISOString()}).eq('id',c.id);
   const upd=b.channel==='whatsapp'?{phone_verified:true}:{contact_email_verified:true,contact_email:c.email}; await admin.from('profiles').update(upd).eq('id',uid); return json({ok:true});
 }
 return json({ok:false,error:'طلب غير صحيح'},400)
}catch(e){return json({ok:false,error:String(e?.message||e)},500)}})
