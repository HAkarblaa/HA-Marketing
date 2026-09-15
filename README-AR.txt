تعبئة الرصيد بواسطة كود

1) شغّل HA-BALANCE-RECHARGE-CODES.sql في Supabase مرة واحدة.
2) استبدل:
   index.html
   index-offline.html
   employee-orders.html
   driver.html
   provider-dashboard.html
3) ارفع admin-balance-codes.html للموقع.

طريقة الاستخدام:
- الموظف أو السائق أو مقدم الخدمة يضغط على مربع رصيده.
- تظهر له نافذة: "أدخل كود تعبئة الرصيد".
- إذا الكود صحيح وغير مستخدم، تضاف قيمته فوراً ويظهر الرصيد الجديد.
- كل كود يستخدم مرة واحدة فقط.
- الإدارة تنشئ الأكواد من admin-balance-codes.html.
- الكود يمكن تخصيصه لموظف أو سائق أو مقدم خدمة أو لجميع الأنواع.

هذا التعديل مبني فوق نظام role_balances السابق ولا يحذف أي رصيد موجود.
