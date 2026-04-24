# خطة معالجة تقرير المراجعة (Audit) — مع التحقق والشرح

قبل الخطة، تحققت من كل نقطة في الكود الفعلي. ملاحظات مهمة من التحقق:

- **لا يوجد ملف `.gitignore` في جذر المشروع** (وجدت `.env` فقط ولا يوجد `.gitignore`).
- ملف `.env` يحتوي **فقط على مفاتيح Publishable / Anon Key** من Supabase + Recaptcha Site Key — كلها مفاتيح عامة آمنة للنشر. **لا يوجد Service Role Key**.
- `SettingsView.tsx` السطور 358–365 تستخدم `dangerouslySetInnerHTML` مع `family.description` (محتوى محرر HTML المخزّن من المستخدم) → **خطر XSS حقيقي مؤكد**.
- `console.log` في الكود: ~**150+ مرة** عبر `src/` (أكثر بكثير من 23).
- `any` / `as any`: ~**410 استخدام** (مطابق للتقرير تقريباً).
- `tsconfig.app.json` حالياً: `strict: false`, `noImplicitAny: false`, `noUnusedLocals: false` — مجال تحسين كبير.
- `App.tsx` يحتوي Routes + Providers مدموجة (يمكن تقسيمها).
- `MainContent.tsx` بالفعل يحمل props كثيرة جداً.

---

## الأولوية القصوى (Must Fix Now) — مع شرح أهمية كل بند

### 1) إنشاء `.gitignore` وإضافة `.env` إليه (وعدم الحاجة لتدوير المفاتيح)
**الشرح:** عدم وجود `.gitignore` يعني أن أي ملف حساس (مثل `.env.local` مستقبلاً، logs، مجلدات build) يمكن أن يُرفع للمستودع بطريق الخطأ. حالياً `.env` يحوي فقط مفاتيح Publishable (آمنة)، لذلك **لا حاجة لتدوير المفاتيح**. لكن إنشاء `.gitignore` ضرورة معيارية لأي مشروع Node/Vite.
**الإجراء:** إنشاء `.gitignore` قياسي يشمل: `node_modules/`, `dist/`, `.env*`, `*.local`, `.DS_Store`, `coverage/`, `.vite/`.

### 2) معالجة XSS في `SettingsView.tsx` (الأهم على الإطلاق)
**الشرح:** هذا **خطر حقيقي مؤكد**. السطر يحقن `family.description` مباشرة عبر `dangerouslySetInnerHTML` بدون تنظيف. أي مدير عائلة (أو مهاجم استطاع تعديل الوصف) يستطيع حقن `<img onerror=...>` أو `<script>` أو معالجات أحداث إنلاين، فيُنفَّذ على متصفح أي زائر للصفحة → **سرقة جلسات / تنفيذ أوامر باسم المستخدم**.
**الإجراء:** تثبيت `isomorphic-dompurify` وإنشاء helper `sanitizeHtml(html)` يسمح فقط بوسوم النص الأساسية (b, i, u, strong, em, p, br, ul, ol, li, a) ويزيل كل `on*` handlers و `javascript:` URLs. تطبيقه عند **القراءة** و**التخزين**.

### 3) إزالة `console.log` من ملفات الإنتاج
**الشرح:** التحقق أظهر **150+ استخدام** (التقرير قال 23 وهو أقل من الواقع). المشاكل: تسريب بيانات حساسة في DevTools للزائر، تأثير أداء، فوضى debugging. يبقى `console.error` و `console.warn` للأخطاء الحقيقية.
**الإجراء:** إعداد Vite `esbuild.drop: ['console', 'debugger']` للإنتاج فقط (يحذف تلقائياً من build بدون لمس المصدر) + إزالة يدوية للأكثر صخباً في الـ hot paths (Dashboard, MainContent, Auth).

### 4) `npm audit fix` للثغرات
**الشرح:** ثغرة `rollup` بدرجة 8.8 تعني إمكانية تنفيذ كود خبيث أثناء البناء (supply-chain). المشروع يستخدم Vite 5 الذي يعتمد rollup. الإصلاح يتطلب ترقية تبعيات.
**الإجراء:** تشغيل `npm audit` لرؤية الشجرة الفعلية، ثم `npm audit fix` ثم اختبار البناء. إن تطلب breaking changes نبلّغ المستخدم قبل المتابعة.

---

## أولوية عالية (High Priority)

### 5) تفعيل `strict: true` في `tsconfig.app.json`
**الشرح:** الإعدادات الحالية (`strict: false`, `noImplicitAny: false`) تعني أن TypeScript يصمت عن أخطاء حقيقية: متغيرات `undefined`، paramaters بدون نوع، nullability. تفعيل `strict` يكشف bugs قبل الإنتاج.
**الإجراء:** تفعيل تدريجي — أولاً `strictNullChecks` و `noImplicitAny` → إصلاح الأخطاء الناتجة في الملفات الحرجة → ثم `strict: true` كاملاً. هذه المهمة كبيرة لأن المشروع يحتوي 410 `any`؛ سنبدأ بتفعيلها وإصلاح الأخطاء العاجلة فقط.

### 6) تقليل استخدام `any` (تدريجياً)
**الشرح:** `any` يعطّل فحوصات TypeScript بالكامل. التركيز على `MainContent.tsx` (يستقبل بيانات الأنشطة والأعياد) و`MemberProfileView.tsx` (يعرض بيانات أعضاء حساسة). 410 `any` لا تُعالج دفعة واحدة.
**الإجراء:** كنطاق هذه الجولة: إصلاح `any` فقط في الملفين المذكورين باستخدام الأنواع الموجودة في `src/types/family.types.ts` و `src/lib/api/types.ts`.

### 7) إضافة Vitest + React Testing Library
**الشرح:** لا توجد اختبارات حالياً (لا `vitest.config`). أي تعديل قد يكسر شيئاً صامتاً. ضروري لتدفقات الأعمال الحرجة (Auth, إضافة عضو, الزواج).
**الإجراء:** إعداد البنية فقط (config + setup file + 2-3 اختبارات نموذجية على utilities و Auth form). كتابة تغطية شاملة خارج النطاق.

---

## أولوية متوسطة (Medium Priority)

### 8) تقليل Props في `MainContent.tsx` عبر Context
**الشرح:** المكوّن يستقبل عدداً ضخماً من props مما يجعل reuse صعب وكل تغيير يلمس كل المستدعين. Context أنسب لبيانات الأسرة المشتركة.
**الإجراء:** نقل props البيانات (members, marriages, family) إلى `FamilyDataContext` الموجود مسبقاً، وترك props السلوك (callbacks) فقط.

### 9) `React.memo` للعناصر المُكرَّرة
**الشرح:** قوائم الأنشطة وأعياد الميلاد و Sidebar تعيد render كل مرة يتغير فيها أي state بالأب. memo يمنع ذلك للعناصر المتطابقة.
**الإجراء:** استخراج صفوف القوائم لمكونات فرعية ملفوفة بـ `React.memo`.

### 10) أنواع موحّدة للبيانات (إزالة casting بين camelCase/snake_case)
**الشرح:** Supabase يرجع `snake_case` بينما الواجهة تستخدم `camelCase` في أماكن، فيحدث casting يدوي بـ `as any`. ينتج عنه bugs صامتة (حقل غير موجود).
**الإجراء:** اعتماد `snake_case` في كل النماذج (مطابق لـ DB) كما في `family.types.ts` الموجود، وإزالة الـ casting في `MainContent` و `MemberProfileView`.

### 11) استخراج logic الـ className والثابت `SCROLL_THRESHOLD`
**الشرح:** ternary معقد داخل JSX يصعّب القراءة ويُكرر الحسابات. الأرقام السحرية (مثل عتبة scroll) يجب أن تكون ثوابت مسماة.
**الإجراء:** helper `getCardClasses(state)` + `const SCROLL_THRESHOLD = 200` في أعلى الملف.

### 12) تشديد CSP (إزالة `unsafe-eval`) للإنتاج
**الشرح:** `unsafe-eval` يسمح بتنفيذ كود ديناميكي عبر `eval()` و `new Function()` — وسيلة شائعة لاستغلال XSS. حالياً قد يكون موجوداً في meta CSP بـ `index.html`. إزالته يقلل سطح الهجوم.
**الإجراء:** فحص ما يستخدم eval فعلياً (عادةً Vite في dev فقط)، ثم تعريف CSP منفصل للإنتاج بدون `unsafe-eval`.

---

## أولوية منخفضة (Low Priority)

### 13) إصلاح transition زر الإغلاق في `MainContent.tsx`
hover حالياً يقفز بدون smoothness. إضافة `transition-colors duration-200`.

### 14) إعادة تنظيم `src/components/` لمجلدات حسب الميزة
**الشرح:** المجلد يحوي 60+ ملف flat. صعوبة الإيجاد. الانتقال إلى `components/family/`, `components/auth/`, `components/admin/`, `components/shared/`. مهمة ميكانيكية لكنها تلمس imports كثيرة.

### 15) تقسيم `App.tsx` إلى `routes.tsx` + `providers.tsx`
يحسّن قابلية القراءة ويعزل تكوين الـ providers عن خريطة الـ routing.

### 16) ترقية `eslint-plugin-react-hooks` من RC إلى مستقر
بمجرد توفر إصدار stable متوافق.

### 17) إضافة `.env.example` موثّق
يسهّل onboarding المطورين الجدد بسرد الـ variables المطلوبة بدون قيم.

---

## ملاحظات على دقة التقرير الأصلي

| البند | في التقرير | الواقع |
|---|---|---|
| `console.log` | 23 | **150+** |
| `any` types | 418 | ~410 (مطابق) |
| Service key مكشوف | "rotate if committed" | **لا يوجد service key أصلاً، فقط publishable** |
| `.env` يحتاج .gitignore | ✓ | ✓ + **`.gitignore` غير موجود أصلاً** |
| XSS في SettingsView | ✓ | ✓ **مؤكد ومُتحقَّق** |

## ترتيب التنفيذ المقترح (إذا وافقت)

1. إنشاء `.gitignore` (دقيقة).
2. إصلاح XSS بـ DOMPurify (الأخطر).
3. حذف console.log عبر Vite + يدوياً في hot paths.
4. `npm audit fix` + اختبار البناء.
5. إعداد Vitest الأساسي.
6. تفعيل خيارات strict TS تدريجياً + إصلاح أخطاء MainContent/MemberProfileView.
7. باقي البنود الـ Medium/Low كل واحد على حدة بناءً على طلبك.

هل تريد البدء بكل بنود **Must Fix Now** دفعة واحدة، أم بالخطوة 2 (XSS) فقط أولاً لأنها الأخطر؟
