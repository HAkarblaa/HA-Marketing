HA Marketing - تحديث أمان الحساب

المضاف:
- مركز أمان الحساب account-security.html
- PIN خاص من 6 أرقام ويُخزن Hash فقط.
- تغيير المعرف مرة كل 30 يوم (مفروض من قاعدة البيانات).
- بريد إلكتروني اختياري مع بنية تأكيد.
- تأكيد واتساب برمز 6 أرقام، صلاحية 5 دقائق، 3 محاولات فقط، ومنع طلب رمز جديد خلال دقيقة.
- 2FA عبر تطبيق Authenticator باستخدام Supabase MFA.
- سجل أحداث أمان وبنية OTP في قاعدة البيانات.

التثبيت:
1) شغّل ACCOUNT-SECURITY-UPGRADE.sql في Supabase SQL Editor.
2) انشر EDGE-account-verification-index.ts كـ Edge Function باسم account-verification.
3) ضع أسرار WhatsApp Business في Secrets فقط: WHATSAPP_TOKEN و WHATSAPP_PHONE_NUMBER_ID. لا تضعها داخل HTML.
4) أنشئ WhatsApp template باسم ha_verification_code لدى Meta.
5) تأكيد البريد يحتاج مزود إرسال بريد؛ القالب متعمد ألا يحتوي أي مفتاح سري.

مهم: لا توجد مفاتيح WhatsApp أو بريد داخل الملف لأن وضعها في الموقع يعرّضها للسرقة.
