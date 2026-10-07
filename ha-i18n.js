(function(){
'use strict';
if(window.__haI18nLoaded)return;
window.__haI18nLoaded=true;

const KEY='ha_language_v1';
const LANGS={
  ar:{name:'العربية',sub:'العربية الفصحى',flag:'🌐',dir:'rtl',html:'ar'},
  iq:{name:'اللهجة العراقية',sub:'واجهة باللهجة العراقية',flag:'🇮🇶',dir:'rtl',html:'ar-IQ'},
  en:{name:'English',sub:'English interface',flag:'🇬🇧',dir:'ltr',html:'en'},
  fa:{name:'فارسی',sub:'رابط کاربری فارسی',flag:'🇮🇷',dir:'rtl',html:'fa'}
};

const EN={
'الرئيسية':'Home','التسوق':'Shopping','طلب خدمة':'Request Service','الدراسة':'Study',
'طلب النقل والتكسي':'Transport & Taxi','النقل والتكسي':'Transport & Taxi','النقل':'Transport',
'التكسي':'Taxi','الترفيه':'Entertainment','مقترحاتكم':'Your Suggestions',
'مقترح متجر':'Suggest a Store','اختر القسم الذي تحتاجه':'Choose the section you need',
'كل خدمات HA Marketing مرتبة بشكل سريع وواضح':'All HA Marketing services, organized clearly and quickly',
'عرض الكل':'View All','عرض المزيد':'View More','الأكثر طلباً':'Most Requested',
'العروض المميزة':'Featured Offers','ماذا تريد أن تفعل؟':'What would you like to do?',
'ماذا تريد أن تبحث عن منتج؟':'What product are you looking for?','ابحث عن منتج':'Search for a product',
'بحث':'Search','رجوع':'Back','التالي':'Next','السابق':'Previous','إغلاق':'Close','فتح':'Open',
'إرسال':'Send','حفظ':'Save','حفظ التعديلات':'Save Changes','إلغاء':'Cancel','تأكيد':'Confirm',
'تعديل':'Edit','حذف':'Delete','إضافة':'Add','جاري التحميل...':'Loading...','جاري التحميل':'Loading',
'لا توجد نتائج':'No results','لا يوجد':'None','نعم':'Yes','لا':'No','موافق':'OK',

'الأسواق':'Markets','مكتبة':'Library','مطبعة':'Print Shop','موبايلات':'Mobiles',
'الأجهزة الإلكترونية':'Electronics','إكسسوارات':'Accessories','ملابس':'Clothing','أحذية':'Shoes',
'مطاعم':'Restaurants','ورد وهدايا':'Flowers & Gifts','مواد البناء':'Building Materials',
'أضف متجرك':'Add Your Store','اقترح متجراً':'Suggest a Store','اقترح متجر':'Suggest a Store',
'السلة':'Cart','طلباتي':'My Orders','طلب مندوب':'Request Courier','متجري':'My Store',
'إضافة منتج':'Add Product','الطلبات':'Orders','انضم كبائع':'Join as Seller','منتجات':'Products',
'المنتجات':'Products','السعر':'Price','وصف المنتج':'Product Description','الوصف':'Description',
'الكمية':'Quantity','المخزون':'Stock','حالة المنتج':'Product Status','متوفر':'Available',
'موقوف':'Paused','إخفاء':'Hide','تفعيل':'Enable','اسم المنتج':'Product Name',
'صورة المنتج':'Product Image','تغيير الصورة (اختياري)':'Change Image (Optional)',
'إضافة متجر جديد':'Add New Store','قسم المتجر':'Store Category','اسم المتجر':'Store Name',
'المحافظة':'Governorate','العنوان':'Address','العنوان التفصيلي':'Detailed Address',
'القضاء / الناحية / الحي':'District / Subdistrict / Neighborhood','الموقع':'Location',
'تحديد موقعي الحالي':'Use My Current Location','تحديد موقع المتجر':'Set Store Location',
'صورة المتجر':'Store Image','وصف المتجر':'Store Description','إرسال طلب التسجيل':'Submit Registration',
'إرسال طلب البائع والمتجر':'Submit Seller & Store Request','إرسال المتجر للموافقة':'Send Store for Approval',
'قيد المراجعة':'Under Review','قيد الموافقة':'Pending Approval','معتمد':'Approved','مرفوض':'Rejected',
'حالة الطلب':'Request Status','طلبات متاجري':'My Store Requests','متاجري':'My Stores',
'حسابك بائع معتمد':'Your seller account is approved',

'الخدمات':'Services','الخدمات المنزلية':'Home Services','مقدم الخدمة':'Service Provider',
'انضم كمقدم':'Join as Provider','إضافة خدمة':'Add Service','ملفي المهني':'My Professional Profile',
'مهامي':'My Tasks','التتبع':'Tracking','صيانة':'Maintenance','تنظيف':'Cleaning','حلاق':'Barber',
'حداد':'Blacksmith','تصليح موبايلات':'Mobile Repair','تصليح طابعات':'Printer Repair',
'اقتراح خدمة':'Suggest a Service','نوع الخدمة':'Service Type','شرح المشكلة':'Describe the Problem',
'صور المشكلة':'Problem Photos',

'الترجمة':'Translation','التلخيص':'Summarization','تحويل الملفات':'File Conversion',
'الامتحانات':'Exams','الأسئلة الوزارية':'Ministerial Questions','الملزم':'Study Notes',
'صفوفي':'My Classes','إنشاء صف':'Create Class','ملفي الدراسي':'My Study Profile','طالب':'Student',
'معلم':'Teacher','المرحلة':'Level','الصف':'Grade','المادة':'Subject','تحميل':'Download',
'رفع ملف':'Upload File','اختر ملف':'Choose File','الكتب':'Books','الدورات':'Courses',

'طلب تكسي':'Request Taxi','رحلاتي':'My Trips','سجل كسائق':'Register as Driver','سائق':'Driver',
'مندوب':'Courier','موقعي الحالي':'My Current Location','حدد موقعك':'Set Your Location',
'من':'From','إلى':'To','قبول':'Accept','رفض':'Reject','طلب نقل':'Transport Request','التوصيل':'Delivery',

'الألعاب':'Games','الأفلام':'Movies','المسلسلات':'Series','الحية':'Snake',
'ركلات الجزاء':'Penalty Kicks','الطائرة':'Airplane','الترتيب العام':'Leaderboard','الرياضة':'Sports',

'حسابي':'My Account','الإشعارات':'Notifications','تسجيل الدخول':'Sign In','تسجيل خروج':'Sign Out',
'اسم المستخدم':'Username','كلمة المرور':'Password','رقم الهاتف':'Phone Number','الاسم الكامل':'Full Name',
'اختر المحافظة':'Choose Governorate','اختياري':'Optional','تم تحديد الموقع':'Location selected',
'تعذر تحديد الموقع':'Could not get location','جاري تحديد الموقع...':'Getting location...',
'تم الحفظ':'Saved','تم الإرسال':'Sent',

'لوحة الإدارة العامة':'General Admin Panel','صلاحيات الأقسام':'Section Permissions',
'إدارة صور الأقسام':'Manage Section Images','تصميم المربعات وصور الأقسام':'Design Cards & Section Images',
'طلبات البائعين':'Seller Requests','إدارة الأخبار والمحتوى':'Manage News & Content',
'طلبات المتاجر':'Store Requests','المستخدمون النشطون':'Active Users',
'الموظفون النشطون':'Active Employees','المستخدمون العاديون':'Regular Users',
'متصل الآن':'Online Now','الأدمن الرئيسي':'Super Admin','صور الأقسام':'Section Images',
'تصميم المربعات':'Card Design','الأخبار والمحتوى':'News & Content','كل الأقسام':'All Sections',
'الأقسام':'Sections','الكل':'All'
};

const FA={
'الرئيسية':'خانه','التسوق':'خرید','طلب خدمة':'درخواست خدمات','الدراسة':'آموزش',
'طلب النقل والتكسي':'حمل‌ونقل و تاکسی','النقل والتكسي':'حمل‌ونقل و تاکسی','النقل':'حمل‌ونقل',
'التكسي':'تاکسی','الترفيه':'سرگرمی','مقترحاتكم':'پیشنهادهای شما','مقترح متجر':'پیشنهاد فروشگاه',
'اختر القسم الذي تحتاجه':'بخش موردنیاز را انتخاب کنید',
'كل خدمات HA Marketing مرتبة بشكل سريع وواضح':'همه خدمات HA Marketing به‌صورت مرتب و ساده',
'عرض الكل':'نمایش همه','عرض المزيد':'بیشتر','الأكثر طلباً':'پرمخاطب‌ترین',
'العروض المميزة':'پیشنهادهای ویژه','ماذا تريد أن تفعل؟':'چه کاری می‌خواهید انجام دهید؟',
'ماذا تريد أن تبحث عن منتج؟':'دنبال چه محصولی هستید؟','ابحث عن منتج':'جستجوی محصول',
'بحث':'جستجو','رجوع':'بازگشت','التالي':'بعدی','السابق':'قبلی','إغلاق':'بستن',
'فتح':'باز کردن','إرسال':'ارسال','حفظ':'ذخیره','حفظ التعديلات':'ذخیره تغییرات',
'إلغاء':'لغو','تأكيد':'تأیید','تعديل':'ویرایش','حذف':'حذف','إضافة':'افزودن',
'جاري التحميل...':'در حال بارگذاری...','جاري التحميل':'در حال بارگذاری','لا توجد نتائج':'نتیجه‌ای نیست',
'لا يوجد':'وجود ندارد','نعم':'بله','لا':'خیر','موافق':'تأیید',

'الأسواق':'بازارها','مكتبة':'کتاب‌فروشی','مطبعة':'چاپخانه','موبايلات':'موبایل',
'الأجهزة الإلكترونية':'لوازم الکترونیکی','إكسسوارات':'لوازم جانبی','ملابس':'پوشاک','أحذية':'کفش',
'مطاعم':'رستوران‌ها','ورد وهدايا':'گل و هدیه','مواد البناء':'مصالح ساختمانی',
'أضف متجرك':'فروشگاه خود را اضافه کنید','اقترح متجراً':'پیشنهاد فروشگاه','اقترح متجر':'پیشنهاد فروشگاه',
'السلة':'سبد خرید','طلباتي':'سفارش‌های من','طلب مندوب':'درخواست پیک','متجري':'فروشگاه من',
'إضافة منتج':'افزودن محصول','الطلبات':'سفارش‌ها','انضم كبائع':'ثبت‌نام فروشنده','منتجات':'محصولات',
'المنتجات':'محصولات','السعر':'قیمت','وصف المنتج':'توضیحات محصول','الوصف':'توضیحات','الكمية':'تعداد',
'المخزون':'موجودی','حالة المنتج':'وضعیت محصول','متوفر':'موجود','موقوف':'متوقف','إخفاء':'مخفی',
'تفعيل':'فعال‌سازی','اسم المنتج':'نام محصول','صورة المنتج':'تصویر محصول',
'تغيير الصورة (اختياري)':'تغییر تصویر (اختیاری)','إضافة متجر جديد':'افزودن فروشگاه جدید',
'قسم المتجر':'دسته فروشگاه','اسم المتجر':'نام فروشگاه','المحافظة':'استان','العنوان':'آدرس',
'العنوان التفصيلي':'آدرس کامل','القضاء / الناحية / الحي':'شهرستان / بخش / محله',
'الموقع':'موقعیت','تحديد موقعي الحالي':'موقعیت فعلی من','تحديد موقع المتجر':'تعیین موقعیت فروشگاه',
'صورة المتجر':'تصویر فروشگاه','وصف المتجر':'توضیحات فروشگاه','إرسال طلب التسجيل':'ارسال درخواست ثبت‌نام',
'إرسال طلب البائع والمتجر':'ارسال درخواست فروشنده و فروشگاه','إرسال المتجر للموافقة':'ارسال فروشگاه برای تأیید',
'قيد المراجعة':'در حال بررسی','قيد الموافقة':'در انتظار تأیید','معتمد':'تأیید شده','مرفوض':'رد شده',
'حالة الطلب':'وضعیت درخواست','طلبات متاجري':'درخواست‌های فروشگاه من','متاجري':'فروشگاه‌های من',
'حسابك بائع معتمد':'حساب فروشندگی شما تأیید شده است',

'الخدمات':'خدمات','الخدمات المنزلية':'خدمات خانگی','مقدم الخدمة':'ارائه‌دهنده خدمات',
'انضم كمقدم':'ثبت‌نام ارائه‌دهنده','إضافة خدمة':'افزودن خدمت','ملفي المهني':'پروفایل کاری من',
'مهامي':'وظایف من','التتبع':'پیگیری','صيانة':'تعمیرات','تنظيف':'نظافت','حلاق':'آرایشگر',
'حداد':'آهنگر','تصليح موبايلات':'تعمیر موبایل','تصليح طابعات':'تعمیر چاپگر',
'اقتراح خدمة':'پیشنهاد خدمت','نوع الخدمة':'نوع خدمت','شرح المشكلة':'شرح مشکل','صور المشكلة':'تصاویر مشکل',

'الترجمة':'ترجمه','التلخيص':'خلاصه‌سازی','تحويل الملفات':'تبدیل فایل','الامتحانات':'آزمون‌ها',
'الأسئلة الوزارية':'سؤالات وزارتی','الملزم':'جزوه','صفوفي':'کلاس‌های من','إنشاء صف':'ایجاد کلاس',
'ملفي الدراسي':'پروفایل تحصیلی من','طالب':'دانش‌آموز','معلم':'معلم','المرحلة':'مقطع','الصف':'پایه',
'المادة':'درس','تحميل':'دانلود','رفع ملف':'بارگذاری فایل','اختر ملف':'انتخاب فایل','الكتب':'کتاب‌ها','الدورات':'دوره‌ها',

'طلب تكسي':'درخواست تاکسی','رحلاتي':'سفرهای من','سجل كسائق':'ثبت‌نام راننده','سائق':'راننده',
'مندوب':'پیک','موقعي الحالي':'موقعیت فعلی من','حدد موقعك':'موقعیت خود را تعیین کنید',
'من':'از','إلى':'به','قبول':'پذیرش','رفض':'رد','طلب نقل':'درخواست حمل‌ونقل','التوصيل':'ارسال',

'الألعاب':'بازی‌ها','الأفلام':'فیلم‌ها','المسلسلات':'سریال‌ها','الحية':'مار',
'ركلات الجزاء':'ضربات پنالتی','الطائرة':'هواپیما','الترتيب العام':'رتبه‌بندی','الرياضة':'ورزش',

'حسابي':'حساب من','الإشعارات':'اعلان‌ها','تسجيل الدخول':'ورود','تسجيل خروج':'خروج',
'اسم المستخدم':'نام کاربری','كلمة المرور':'رمز عبور','رقم الهاتف':'شماره تلفن','الاسم الكامل':'نام کامل',
'اختر المحافظة':'استان را انتخاب کنید','اختياري':'اختیاری','تم تحديد الموقع':'موقعیت ثبت شد',
'تعذر تحديد الموقع':'دریافت موقعیت ممکن نشد','جاري تحديد الموقع...':'در حال دریافت موقعیت...',
'تم الحفظ':'ذخیره شد','تم الإرسال':'ارسال شد',

'لوحة الإدارة العامة':'پنل مدیریت اصلی','صلاحيات الأقسام':'دسترسی بخش‌ها',
'إدارة صور الأقسام':'مدیریت تصاویر بخش‌ها','تصميم المربعات وصور الأقسام':'طراحی کارت‌ها و تصاویر بخش‌ها',
'طلبات البائعين':'درخواست‌های فروشندگان','إدارة الأخبار والمحتوى':'مدیریت اخبار و محتوا',
'طلبات المتاجر':'درخواست‌های فروشگاه‌ها','المستخدمون النشطون':'کاربران آنلاین',
'الموظفون النشطون':'کارمندان آنلاین','المستخدمون العاديون':'کاربران عادی',
'متصل الآن':'اکنون آنلاین','الأدمن الرئيسي':'مدیر اصلی','صور الأقسام':'تصاویر بخش‌ها',
'تصميم المربعات':'طراحی کارت‌ها','الأخبار والمحتوى':'اخبار و محتوا',
'الأقسام':'بخش‌ها','كل الأقسام':'همه بخش‌ها','الكل':'همه'
};

const IQ={
'الرئيسية':'الرئيسية','التسوق':'التسوق','طلب خدمة':'أطلب خدمة','الدراسة':'الدراسة',
'طلب النقل والتكسي':'النقل والتكسي','الترفيه':'الترفيه','مقترحاتكم':'مقترحاتكم',
'مقترح متجر':'اقترح متجر','اختر القسم الذي تحتاجه':'اختار القسم اللي تحتاجه',
'كل خدمات HA Marketing مرتبة بشكل سريع وواضح':'كل خدمات HA Marketing مرتبة وسهلة قدامك',
'عرض الكل':'شوف الكل','عرض المزيد':'شوف أكثر','الأكثر طلباً':'الأكثر طلب',
'العروض المميزة':'العروض المميزة','ماذا تريد أن تفعل؟':'شنو تريد تسوي؟',
'ماذا تريد أن تبحث عن منتج؟':'شنو المنتج اللي تدور عليه؟','ابحث عن منتج':'دوّر على منتج',
'بحث':'دور','رجوع':'رجوع','التالي':'التالي','السابق':'اللي قبله','إغلاق':'سكر','فتح':'افتح',
'إرسال':'دز','حفظ':'احفظ','حفظ التعديلات':'احفظ التعديلات','إلغاء':'إلغاء','تأكيد':'أكد',
'تعديل':'عدّل','حذف':'احذف','إضافة':'ضيف','جاري التحميل...':'جاي يتحمل...',
'جاري التحميل':'جاي يتحمل','لا توجد نتائج':'ماكو نتائج','لا يوجد':'ماكو','نعم':'إي','لا':'لا','موافق':'تمام',

'أضف متجرك':'ضيف متجرك','اقترح متجراً':'اقترح متجر','السلة':'السلة','طلباتي':'طلباتي',
'طلب مندوب':'أطلب مندوب','متجري':'متجري','إضافة منتج':'ضيف منتج','الطلبات':'الطلبات',
'انضم كبائع':'انضم كبائع','اسم المنتج':'اسم المنتج','وصف المنتج':'وصف المنتج','الكمية':'الكمية',
'المخزون':'المخزون','حالة المنتج':'حالة المنتج','متوفر':'متوفر','موقوف':'موقوف',
'إخفاء':'خفي','تفعيل':'فعّل','تغيير الصورة (اختياري)':'غيّر الصورة إذا تريد',
'إضافة متجر جديد':'ضيف متجر جديد','قسم المتجر':'قسم المتجر','اسم المتجر':'اسم المتجر',
'المحافظة':'المحافظة','العنوان التفصيلي':'العنوان بالتفصيل','القضاء / الناحية / الحي':'القضاء / الناحية / الحي',
'الموقع':'الموقع','تحديد موقعي الحالي':'حدد موقعي هسه','تحديد موقع المتجر':'حدد موقع المتجر',
'صورة المتجر':'صورة المتجر','وصف المتجر':'تفاصيل المتجر','إرسال طلب التسجيل':'دز طلب التسجيل',
'إرسال طلب البائع والمتجر':'دز طلب البائع والمتجر','إرسال المتجر للموافقة':'دز المتجر للموافقة',
'قيد المراجعة':'جاي ينراجع','قيد الموافقة':'ينتظر موافقة','معتمد':'موافق عليه','مرفوض':'مرفوض',
'حالة الطلب':'حالة الطلب','طلبات متاجري':'طلبات متاجري','متاجري':'متاجري',
'حسابك بائع معتمد':'حسابك صار بائع وموافق عليه',

'الخدمات':'الخدمات','الخدمات المنزلية':'خدمات بيتية','مقدم الخدمة':'مقدم الخدمة',
'انضم كمقدم':'انضم كمقدم خدمة','إضافة خدمة':'ضيف خدمة','ملفي المهني':'ملفي المهني',
'مهامي':'شغلاتي','التتبع':'التتبع','اقتراح خدمة':'اقترح خدمة','نوع الخدمة':'نوع الخدمة',
'شرح المشكلة':'اشرح المشكلة','صور المشكلة':'صور المشكلة',

'الترجمة':'الترجمة','التلخيص':'التلخيص','تحويل الملفات':'تحويل الملفات','الامتحانات':'الامتحانات',
'الأسئلة الوزارية':'الأسئلة الوزارية','الملزم':'الملازم','صفوفي':'صفوفي','إنشاء صف':'سوّي صف',
'ملفي الدراسي':'ملفي الدراسي','تحميل':'نزّل','رفع ملف':'ارفع ملف','اختر ملف':'اختار ملف',

'طلب تكسي':'أطلب تكسي','رحلاتي':'رحلاتي','سجل كسائق':'سجل كسائق','سائق':'سائق',
'مندوب':'مندوب','موقعي الحالي':'موقعي هسه','حدد موقعك':'حدد موقعك','من':'من','إلى':'إلى',
'قبول':'اقبل','رفض':'ارفض','طلب نقل':'أطلب نقل',

'الألعاب':'الألعاب','الأفلام':'الأفلام','المسلسلات':'المسلسلات','الترتيب العام':'الترتيب العام',

'حسابي':'حسابي','الإشعارات':'الإشعارات','تسجيل الدخول':'سجّل دخول','تسجيل خروج':'اطلع من الحساب',
'اسم المستخدم':'اسم المستخدم','كلمة المرور':'الرمز السري','رقم الهاتف':'رقم الموبايل',
'الاسم الكامل':'الاسم الكامل','اختر المحافظة':'اختار المحافظة','اختياري':'مو إجباري',
'تم تحديد الموقع':'تم تحديد الموقع','تعذر تحديد الموقع':'ما كدرنا نحدد الموقع',
'جاري تحديد الموقع...':'جاي نحدد موقعك...','تم الحفظ':'انحفظ','تم الإرسال':'اندز',

'لوحة الإدارة العامة':'لوحة الإدارة الرئيسية','طلبات البائعين':'طلبات البائعين',
'طلبات المتاجر':'طلبات المتاجر','المستخدمون النشطون':'المستخدمين المتصلين',
'الموظفون النشطون':'الموظفين المتصلين','المستخدمون العاديون':'الناس المتصلين',
'متصل الآن':'متصل هسه','الأدمن الرئيسي':'الأدمن الرئيسي','كل الأقسام':'كل الأقسام',
'الأقسام':'الأقسام','الكل':'الكل'
};

const MAPS={en:EN,fa:FA,iq:IQ};
const originalText=new WeakMap();
const originalAttrs=new WeakMap();
let current=localStorage.getItem(KEY)||'ar';
let observer=null;

function norm(s){return String(s||'').replace(/\s+/g,' ').trim()}
function translateCore(s,lang){
  if(lang==='ar')return s;
  const map=MAPS[lang]||{};
  const n=norm(s);
  if(!n)return s;
  if(map[n])return map[n];

  let out=s;
  const keys=Object.keys(map).sort((a,b)=>b.length-a.length);
  for(const k of keys){
    if(k.length<4)continue;
    if(out.includes(k))out=out.split(k).join(map[k]);
  }
  return out;
}

function skipNode(node){
  const p=node.parentElement;
  if(!p)return true;
  if(p.closest('script,style,code,pre,[data-no-i18n],[contenteditable="true"],#haLanguageOverlay,#haLanguageButton'))return true;
  return false;
}

function translateTextNode(node,lang){
  if(skipNode(node))return;
  if(!originalText.has(node))originalText.set(node,node.nodeValue);
  node.nodeValue=translateCore(originalText.get(node),lang);
}

function translateAttrs(el,lang){
  if(!(el instanceof Element))return;
  if(el.closest('#haLanguageOverlay,#haLanguageButton,[data-no-i18n]'))return;
  let data=originalAttrs.get(el);
  if(!data){data={};originalAttrs.set(el,data)}

  for(const attr of ['placeholder','title','aria-label']){
    if(el.hasAttribute(attr)){
      if(!(attr in data))data[attr]=el.getAttribute(attr);
      el.setAttribute(attr,translateCore(data[attr],lang));
    }
  }

  if(el instanceof HTMLInputElement && ['button','submit','reset'].includes(el.type)){
    if(!('value' in data))data.value=el.value;
    el.value=translateCore(data.value,lang);
  }
}

function walk(root,lang){
  if(root.nodeType===Node.TEXT_NODE){translateTextNode(root,lang);return}
  if(!(root instanceof Element) && root!==document)return;
  if(root instanceof Element)translateAttrs(root,lang);

  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  let n;
  while((n=w.nextNode()))translateTextNode(n,lang);

  if(root.querySelectorAll)root.querySelectorAll('*').forEach(el=>translateAttrs(el,lang));
}

function applyDirection(lang){
  const cfg=LANGS[lang]||LANGS.ar;
  document.documentElement.lang=cfg.html;
  document.documentElement.dir=cfg.dir;
  document.documentElement.classList.toggle('ha-lang-ltr',cfg.dir==='ltr');
  document.documentElement.classList.toggle('ha-lang-rtl',cfg.dir==='rtl');
  document.body?.setAttribute('data-ha-language',lang);
}

function apply(lang,save=true){
  if(!LANGS[lang])lang='ar';
  current=lang;
  if(save)localStorage.setItem(KEY,lang);
  applyDirection(lang);
  walk(document.body,lang);
  updatePicker();
  window.dispatchEvent(new CustomEvent('ha:languagechange',{detail:{language:lang}}));
}

function updatePicker(){
  document.querySelectorAll('.ha-lang-option').forEach(
    b=>b.classList.toggle('active',b.dataset.lang===current)
  );
  const btn=document.getElementById('haLanguageButton');
  if(btn)btn.title=LANGS[current]?.name||'Language';
}

function openPicker(force=false){
  const ov=document.getElementById('haLanguageOverlay');
  if(!ov)return;
  ov.classList.add('show');
  ov.dataset.force=force?'1':'0';
  const close=ov.querySelector('.ha-lang-close');
  if(close)close.style.display=force?'none':'block';
}

function closePicker(){
  document.getElementById('haLanguageOverlay')?.classList.remove('show');
}

function makeUI(){
  if(document.getElementById('haLanguageButton'))return;

  const btn=document.createElement('button');
  btn.id='haLanguageButton';
  btn.type='button';
  btn.textContent='🌐';
  btn.setAttribute('aria-label','Language');
  btn.onclick=()=>openPicker(false);
  document.body.appendChild(btn);

  const ov=document.createElement('div');
  ov.id='haLanguageOverlay';
  ov.innerHTML=
    `<div class="ha-lang-card">
      <div class="ha-lang-head">
        <div class="ico">🌐</div>
        <h2>اختر اللغة / Choose language</h2>
        <p>يمكنك تغيير اللغة لاحقاً من زر 🌐</p>
      </div>
      <div class="ha-lang-grid">
        ${Object.entries(LANGS).map(([k,v])=>
          `<button class="ha-lang-option" data-lang="${k}" type="button">
            <span class="flag">${v.flag}</span>
            <span><b>${v.name}</b><small>${v.sub}</small></span>
          </button>`
        ).join('')}
      </div>
      <button class="ha-lang-close" type="button">إغلاق / Close</button>
    </div>`;
  document.body.appendChild(ov);

  ov.querySelectorAll('.ha-lang-option').forEach(
    b=>b.onclick=()=>{apply(b.dataset.lang,true);closePicker()}
  );
  ov.querySelector('.ha-lang-close').onclick=closePicker;
  ov.addEventListener('click',e=>{
    if(e.target===ov && ov.dataset.force!=='1')closePicker();
  });
  updatePicker();
}

function startObserver(){
  if(observer)observer.disconnect();
  observer=new MutationObserver(ms=>{
    observer.disconnect();
    try{
      for(const m of ms)for(const n of m.addedNodes)walk(n,current);
    }finally{
      observer.observe(document.body,{childList:true,subtree:true});
    }
  });
  observer.observe(document.body,{childList:true,subtree:true});
}

function loadCss(){
  if(document.querySelector('link[data-ha-i18n-css]'))return;
  const l=document.createElement('link');
  l.rel='stylesheet';
  l.href='ha-i18n.css?v=20261007-1';
  l.dataset.haI18nCss='1';
  document.head.appendChild(l);
}

function init(){
  loadCss();
  makeUI();
  apply(current,false);
  startObserver();
  if(!localStorage.getItem(KEY))openPicker(true);
}

window.HAI18N={
  setLanguage:apply,
  getLanguage:()=>current,
  open:()=>openPicker(false),
  languages:LANGS
};

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',init,{once:true});
}else{
  init();
}
})();