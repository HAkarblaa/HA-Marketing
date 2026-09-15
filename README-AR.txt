HA Marketing - شعار HA مفرغ لإشعارات الموقع الخارجية

هذا التعديل للموقع فقط، وليس لتطبيق Android.

الملفات:
- ha-notification-logo.png
- ha-notification-badge.png
- firebase-messaging-sw.js
- notifications.js
- EDGE-send-fcm-push-index.ts

التعديل:
- تم أخذ شعار HA الذي أرسلته وتحويل الخلفية البيضاء إلى شفافة.
- الإشعار الخارجي يستخدم الشعار المفرغ بدل الصورة المربعة.
- badge صار شعاراً مفرغاً أحادي اللون مناسباً لإشعارات المتصفح.
- Service Worker يستخدم الشعار الجديد للإشعارات عندما يكون الموقع مغلقاً.
- Edge Function تستخدم نفس الشعار عند إرسال Web Push.

طريقة التركيب:
1) ارفع إلى GitHub Pages بجانب index.html:
   ha-notification-logo.png
   ha-notification-badge.png
   firebase-messaging-sw.js
   notifications.js

2) في Supabase > Edge Functions > send-fcm-push
   استبدل index.ts بمحتوى:
   EDGE-send-fcm-push-index.ts
   ثم Deploy.

مهم:
- جرّب بإشعار جديد بعد رفع الملفات وDeploy.
- قد يعرض Android/Chrome رمز المتصفح الصغير بجانب اسم المتصفح كجزء من النظام،
  لكن صورة إشعار الموقع نفسها ستكون شفافة بالشعار HA بدل مربع أبيض.
