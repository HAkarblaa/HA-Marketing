HA Marketing - Firebase Push جاهز

الملفات:
- push-config.js
- notifications.js
- firebase-messaging-sw.js
- index.html
- index-offline.html
- notifications-center.html

تم وضع VAPID Key المرسل.
تم ربط FCM Token بجدول public.push_tokens في Supabase.
تم استخدام Service Worker بنطاق ./fcm/ حتى لا يستبدل Service Worker الخاص بالأوفلاين.

طريقة التجربة:
1) ارفع الملفات الستة واستبدل الملفات القديمة.
2) افتح الموقع وسجل الدخول.
3) افتح لوحة المختصرات أو مركز الإشعارات.
4) اضغط: تشغيل إشعارات الموبايل.
5) وافق على إذن الإشعارات من المتصفح.
6) عند النجاح يظهر: تم تشغيل إشعارات الموبايل وربط هذا الجهاز بحسابك.

مهم:
- هذا يجهز استقبال الإشعارات ويخزن FCM Token.
- إرسال Push فعلياً يحتاج أن تكون Edge Function send-fcm-push مربوطة بحساب Firebase Admin/Service Account وتقرأ public.push_tokens.
- على تطبيق Android WebView، إشعارات FCM الأصلية تعتمد أيضاً على إعدادات تطبيق Android نفسه؛ الويب Push يعمل في المتصفحات المدعومة.
