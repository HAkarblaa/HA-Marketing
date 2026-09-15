HA Marketing - تثبيت أيقونة الإشعار الخارجية

المشكلة:
كانت إشعارات Web تُنشأ أحياناً من Firebase نفسه وأحياناً من Service Worker،
ولذلك كانت أيقونة HA تظهر مرة وتختفي مرة.

هذا التعديل:
- يجعل إشعارات Web Data-Only.
- يجعل firebase-messaging-sw.js هو الوحيد الذي يعرض إشعار Web.
- يثبت الأيقونة على:
  ha-logo-transparent.png
  notification-icon.png
- لا يغيّر المستلم أو محتوى الإشعار أو نظام الإشعارات.

التركيب:
1) ارفع firebase-messaging-sw.js بجانب index.html على GitHub.
2) Supabase > Edge Functions > send-fcm-push
   استبدل index.ts بمحتوى EDGE-send-fcm-push-index.ts ثم Deploy.
3) افتح الموقع مرة واحدة على الهاتف، انتظر عدة ثوانٍ، ثم جرّب إشعار جديد.

مهم:
لا تحتاج تبديل بقية ملفات الموقع.
