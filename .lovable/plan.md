## خطة شاملة لتحسين الجودة والأمان والأداء

مرتّبة حسب الأولوية. كل مرحلة مستقلة وقابلة للتنفيذ بشكل تدريجي.

---

### 🔴 المرحلة 1 — أمان حرج (يوم واحد)

**1.1 تأمين `.env`**
- إضافة `.env` إلى `.gitignore`
- التأكيد للمستخدم بضرورة **تدوير المفاتيح** (rotate) في Supabase + Google reCAPTCHA لأن المفاتيح القديمة موجودة في تاريخ Git
- ملاحظة: مفاتيح Supabase الـ `anon` و `VITE_*` عامة بطبيعتها لكن من الأفضل عدم رفعها

**1.2 تشديد CSP في `index.html`**
- إزالة `unsafe-eval` (غير ضروري في Vite production)
- استبدال `unsafe-inline` للسكربتات بنظام `nonce` أو `hash` للـ inline scripts الموجودة
- ترك `unsafe-inline` للـ styles فقط (مطلوب لـ Tailwind/shadcn)

**1.3 فحص `npm audit`**
- تشغيل `npm audit` ومعالجة الثغرات HIGH (rollup, vite, إلخ)
- ترقية الحزم الحرجة بحذر مع اختبار البناء

---

### 🟠 المرحلة 2 — جودة الكود (3-5 أيام)

**2.1 تنظيف console.log (339 حالة)**
- إنشاء `src/lib/logger.ts` بسيط: `logger.debug/info/warn/error` يعمل فقط في `import.meta.env.DEV`
- استبدال `console.log` بـ `logger.debug` آلياً عبر `rg --replace`
- إبقاء `console.error` فقط في معالجات الأخطاء الفعلية

**2.2 تفعيل TypeScript strict تدريجياً**
- المرحلة A: تفعيل `strictNullChecks: true` فقط (الأكثر فائدة، الأقل ضرراً)
- المرحلة B: تفعيل `noImplicitAny: true`
- المرحلة C: تفعيل `strict: true` كاملاً
- إصلاح الأخطاء ملف بملف. لا حاجة لإصلاح كل شيء دفعة واحدة

**2.3 تقليل استخدام `any` (610 حالة)**
- بعد تفعيل strict، استبدال `any` تدريجياً بـ `unknown` + type guards أو أنواع من `database.types.ts`
- التركيز على الملفات الحساسة أمنياً أولاً (auth, payments, edge functions calls)

---

### 🟠 المرحلة 3 — تقسيم الملفات الضخمة (أسبوع)

**3.1 تفكيك `FamilyBuilderNew.tsx` (4297 سطر / 53 useState)**
- استخراج الحالة إلى `useReducer` أو Zustand store
- تقسيم إلى:
  - `useFamilyBuilderState.ts` (الحالة)
  - `useFamilyBuilderActions.ts` (CRUD)
  - `FamilyBuilderForm/` (مكونات النموذج)
  - `FamilyBuilderTree/` (العرض الشجري)
  - `FamilyBuilderModals/` (المودالات)

**3.2 تفكيك `EnhancedAdminPanel.tsx` (2981 سطر)**
- تقسيم لتبويبات منفصلة: `AdminUsers/`, `AdminPackages/`, `AdminPayments/`, `AdminSettings/`
- استخدام lazy loading لكل تبويب

**3.3 إعادة هيكلة `MainContent.tsx`**
- إذا كان فعلاً يأخذ 27 prop: استخدام Context أو composition بدل prop-drilling

---

### 🟡 المرحلة 4 — تنظيم البنية (3 أيام)

**4.1 تنظيم `src/components/` (65 ملف flat)**
- إعادة تجميع حسب الميزة:
  ```
  components/
    family/      (FamilyHeader, FamilyOverview, FamilyMembersList...)
    member/      (MemberCard, MemberProfileModal, MemberMemories...)
    payment/     (PayPalButton, PaymentGatewaySettings...)
    auth/        (PasswordModal, ProtectedRoute...)
    layout/      (GlobalHeader, GlobalFooter, ScrollToTop...)
    common/      (DateDisplay, LanguageSwitcher, ErrorPage...)
    ui/          (موجود بالفعل — shadcn)
  ```

**4.2 إصلاح `tailwind.config.ts`**
- إضافة keyframes + animation لـ `animate-fade-in` المستخدم في الكود

---

### 🟡 المرحلة 5 — اختبارات وCI/CD (أسبوع)

**5.1 توسيع تغطية الاختبارات**
- إضافة اختبارات Vitest للوحدات الحرجة:
  - `lib/memberDisplayUtils.ts` (منطق النسب والكنية)
  - `lib/dateUtils.ts`
  - `lib/security.ts` (التحقق من المدخلات)
  - `hooks/queries/useFamilyQueries.ts`
- هدف واقعي: 40% تغطية للمنطق الحرج

**5.2 GitHub Actions CI**
- إضافة `.github/workflows/ci.yml`:
  - `bun install` → `bun run lint` → `bunx tsc --noEmit` → `bunx vitest run` → `bun run build`
- يشتغل على كل PR

**5.3 مراقبة الأخطاء (Sentry)**
- إضافة `@sentry/react` مع DSN كـ env var
- تفعيل sourcemaps في الـ production build (`vite.config.ts`)

---

### 🟢 المرحلة 6 — تحسينات إضافية

**6.1 ESLint**
- تفعيل `no-unused-vars` و `no-console` (مع warning فقط)
- ترقية `eslint-plugin-react-hooks` من RC إلى stable

**6.2 إضافة PWA**
- `vite-plugin-pwa` مع manifest + service worker للعمل offline

**6.3 Code splitting إضافي**
- `React.lazy` لكل route رئيسي لتقليل bundle initial

---

## ترتيب التنفيذ المقترح

| الأسبوع | المهام |
|---|---|
| 1 | المرحلة 1 كاملة + بداية 2.1 (logger) |
| 2 | 2.2 (strictNullChecks) + 4.2 (tailwind fix) + 5.2 (CI) |
| 3-4 | 3.1 (تفكيك FamilyBuilderNew) |
| 5 | 3.2 (تفكيك AdminPanel) + 4.1 (تنظيم components) |
| 6 | 5.1 (اختبارات) + 5.3 (Sentry) |
| 7+ | 2.3 (تقليل any) + 6.x (تحسينات) |

---

## ملاحظات مهمة

- **لا أستطيع تنفيذ كل شيء في رسالة واحدة** — كل مرحلة تحتاج رسالة منفصلة (أو اثنتين) حتى لا تنكسر التغييرات
- **الاختبار بعد كل مرحلة** ضروري — التغييرات الكبيرة في TS strict أو تفكيك الملفات قد تكسر سلوك موجود
- **النقاط المرفوضة من تقييمك السابق**:
  - XSS في SettingsView: محمي فعلاً بـ DOMPurify (لا حاجة لإصلاح)
  - App.tsx 333 سطر + 10 Providers: App.tsx 64 سطر فقط، مفصول لـ `providers.tsx` (لا حاجة لإصلاح)

## ما الذي تريد البدء به؟

أقترح البدء بـ **المرحلة 1 كاملة** (أمان حرج، تنفيذ سريع، أثر كبير). هل توافق؟ أم تفضّل ترتيباً مختلفاً؟