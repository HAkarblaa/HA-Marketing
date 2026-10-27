// ضع إعدادات Firebase الخاصة بمشروع HA Marketing هنا.
// بدون إعدادها يعمل القسم بوضع تجريبي محلي فقط (لا تنتقل الإعلانات بين الأجهزة).
window.HA_MARKETPLACE_CONFIG = {
  firebase: null,
  // مثال: firebase: { apiKey: '...', authDomain: '...', databaseURL: '...', projectId: '...', storageBucket: '...', appId: '...' },
  currency: 'د.ع',
  demoMode: true // غيّرها إلى false بعد إعداد Firebase وقواعد الأمان
};
