HA Marketing - إصلاح شعار الإشعار الخارجي فقط V2

هذا التعديل لا يغير الواجهة الرئيسية نهائياً.

التعديل:
- الشعار المربع القديم لم يعد مستخدماً في الإشعارات الجديدة.
- تم إنشاء شعار HA بخلفية شفافة.
- تم إنشاء Badge صغير مفرغ/أحادي اللون مناسب لإشعارات Android/Chrome.
- استخدمت أسماء ملفات جديدة V2 حتى لا يبقى المتصفح على الصورة القديمة المخزنة بالكاش.

ارفع إلى الموقع بجانب index.html:
1) ha-notification-logo-v2.png
2) ha-notification-badge-v2.png
3) firebase-messaging-sw.js
4) notifications.js

ثم:
Supabase > Edge Functions > send-fcm-push
استبدل index.ts بمحتوى EDGE-send-fcm-push-index.ts ثم Deploy.

بعدها جرّب إشعار جديد.
لا تحتاج تغيير index.html ولا أي ملف واجهة.
