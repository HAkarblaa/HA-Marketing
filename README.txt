HA Marketing - إصلاح الألعاب
============================
استبدل هذه الملفات داخل نفس مجلد موقع HA:
- entertainment.html
- car-dodge.html
- bird-game.html
- brick-breaker.html
- jumper.html
- coin-runner.html
- games-ranking.html

هذه النسخة:
- كل لعبة مستقلة ولا تعتمد على مجلد assets حتى لا تتعطل بسبب المسار.
- تعمل حتى لو تعذر localStorage؛ التصنيف المحلي يصبح احتياطياً.
- عند توفر الإنترنت وحساب مستخدم مسجل، تحاول مزامنة النتائج مع جدول ha_game_scores في Supabase.
- صفحة games-ranking.html تعرض تصنيف كل الألعاب أو لعبة محددة.

إذا كنت شغلت SQL الخاص بجدول ha_game_scores سابقاً فلا تحتاج تشغيل SQL جديد.
