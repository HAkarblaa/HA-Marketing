HA Marketing - إصلاح V5 لأيقونة الإشعار الخارجي

المشكلة:
الإشعار يصل، لكن Firebase كان أحياناً ينشئ الإشعار تلقائياً قبل Service Worker،
خصوصاً للتوكنات القديمة التي لا تحتوي platform=web.
عندها يتم تجاهل شعار HA ويظهر مربع رمادي.

الإصلاح V5:
- كل توكن ليس Android يعامل كإشعار Web.
- إشعارات Web تُرسل DATA ONLY.
- firebase-messaging-sw.js هو الوحيد الذي ينشئ الإشعار الخارجي.
- لذلك icon و badge يؤخذان من ملفات HA الشفافة V5.
- استخدمنا أسماء V5 حتى لا يبقى Cache للصور القديمة.

الخطوة 1 - GitHub:
ارفع بجانب index.html:
1) notifications.js
2) firebase-messaging-sw.js
3) ha-notification-logo-v5.png
4) ha-notification-badge-v5.png

الخطوة 2 - Supabase (ضرورية):
Supabase > Edge Functions > send-fcm-push
استبدل ملف index.ts بالكامل بمحتوى:
EDGE-send-fcm-push-index.ts
ثم اضغط Deploy.

بعدها:
- افتح الموقع على الموبايل مرة واحدة.
- انتظر 10 ثوانٍ.
- أرسل إشعاراً جديداً.
- لا تحتاج تغيير index.html.

مهم:
إذا لم تبدل Edge Function وتعمل Deploy، قد يبقى المربع الرمادي حتى لو رفعت الصور.
