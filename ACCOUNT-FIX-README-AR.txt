HA Marketing - إصلاح الحساب النهائي

المشكلة: تغيير المعرّف/الرقم السري كان يتم مباشرة من المتصفح عبر طلب PUT إلى Supabase Auth، وهذا كان يرجع Failed to fetch لدى المستخدم.

الإصلاح: account.html الآن يرسل طلب POST إلى Edge Function باسم update-my-account. الدالة تتحقق من جلسة المستخدم وتغيّر بيانات المستخدم نفسه فقط عبر Service Role داخل الخادم.

المطلوب في Supabase:
1) Edge Functions > Create a new function
2) الاسم بالضبط: update-my-account
3) استبدال الكود بمحتوى EDGE-update-my-account-index.ts
4) Deploy

لا تحتاج SQL جديد لهذا الإصلاح.
