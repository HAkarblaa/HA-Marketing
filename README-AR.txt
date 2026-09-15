HA Marketing - إصلاح المربع الرمادي في الإشعار الخارجي V3

هذا التعديل للموقع فقط ولا يغيّر الواجهة الرئيسية.

سبب المشكلة السابقة:
ملف badge السابق كان يتحول عملياً إلى مربع ممتلئ، لذلك Android/Chrome عرضه كمربع رمادي.

الإصلاح:
- ha-notification-badge-v3.png صار شعار HA الحقيقي فقط بخلفية شفافة.
- ha-notification-logo-v3.png صار شعار HA بخلفية شفافة.
- تم تحديث Service Worker و notifications.js و Edge Function لاستخدام ملفات V3 الجديدة.
- أسماء V3 تمنع استخدام الصورة القديمة المخزنة بالكاش.

ارفع للموقع بجانب index.html:
1) ha-notification-logo-v3.png
2) ha-notification-badge-v3.png
3) firebase-messaging-sw.js
4) notifications.js

ثم في:
Supabase > Edge Functions > send-fcm-push
استبدل index.ts بمحتوى:
EDGE-send-fcm-push-index.ts
ثم Deploy.

بعدها جرّب إشعار جديد.
لا تحتاج تغيير index.html ولا أي ملف واجهة.
