# خطوات إضافة حرف جديد (Checklist)

إضافة أي حرف جديد لا تتطلب **أي تعديل على الكود البرمجي**، بل تقتصر فقط على إضافة مدخلة بيانات داخل `src/data/letters.js` مع الأصول الاختيارية التابعة له.

---

### 1. إضافة مدخلة الحرف في البيانات
افتح الملف `src/data/letters.js` وأضف كائن الحرف الجديد في مصفوفة `LETTERS` بالترتيب:

```javascript
{
  id: 'B',
  upper: 'B',
  lower: 'b',
  stationId: 1, // رقم المحطة التي تستضيف الحرف
  word: {
    en: 'Ball',
    ar: 'كرة',
    image: 'words/ball.svg' // نسبي لمجلد public/assets/images/
  },
  ipa: {
    name: '/biː/',
    sound: '/b/'
  }, // للتوثيق الداخلي فقط؛ لا يظهر على الشاشة أبداً
  audio: {
    letterName: 'letters/b-name.mp3',
    letterSound: 'letters/b-sound.mp3',
    word: 'words/ball.mp3'
  }, // نسبي لمجلد public/assets/audio/
  distractors: ['T', 'S'], // حرفان كبيران مموهان مختلفان عن الحرف المستهدف وعن بعضهما
  character: {
    victoryVideo: 'victory/victory-b.mp4',   // اختياري؛ نسبي لمجلد public/characters/younes/
    thinking: 'thinking/thinking-b.webp'     // اختياري؛ يرجع تلقائياً للتفكير الافتراضي ليونس
  }
}
```

---

### 2. وضع الأصول في مجلداتها المحددة (اختيارية)
جميع الأصول اختيارية؛ إذا لم يتوفر أي ملف سيعمل التطبيق ببدائله السلسة (Fallbacks) دون توقف:
* **صورة الكلمة:** `public/assets/images/words/<word-name>.svg` (أو png/webp).
* **الملفات الصوتية:**
  * اسم الحرف: `public/assets/audio/letters/<letter>-name.mp3`
  * صوت الحرف: `public/assets/audio/letters/<letter>-sound.mp3`
  * نطق الكلمة: `public/assets/audio/words/<word-name>.mp3`
* **أصول يونس (قاعدة صارمة):**
  * فيديو الفوز: `public/characters/younes/victory/victory-<letter>.mp4`
  * صورة التفكير: `public/characters/younes/thinking/thinking-<letter>.webp`
  * **تنبيه هام:** أصول شخصية يونس توضع حصراً في `public/characters/younes/` وتخضع لمراجعة المالك واعتماده قبل أي تثبيت (Commit). جميع حقوقها محفوظة وليست MIT.

---

### 3. التحقق الآلي من صحة البيانات
شغّل أمر الفحص للتحقق من سلامة البنية والمطابقة:
```bash
npm run validate
```
* في حال وجود أصول اختيارية غير متوفرة، ستظهر كـ `[WARNING]` فقط دون فشل.
* في حال وجود أخطاء في الحقول الإلزامية أو الأحرف المضللة أو المسارات، سينتهي الفحص برسالة `[ERROR]`.

---

### 4. اختبار التشغيل محلياً
1. شغّل خادم التطوير:
   ```bash
   npm run dev
   ```
2. افتح التطبيق في المتصفح وتأكد من:
   * فتح المهمة مباشرة في مرحلة الاختيار (CHOOSE) مع نطق اسم الحرف وصوته والكلمة تلقائياً.
   * إمكانية الاختيار بالمسات أو بلوحة المفاتيح (الضغط على مفتاح الحرف الصحيح يكمل فوراً).
   * عمل البدائل في حال عدم توفر الصوت أو الفيديو.
   * الانتقال التلقائي للحرف التالي بعد شاشة النتيجة (RESULT)، والوصول لشاشة الإتمام (COMPLETION) بعد آخر حرف.
