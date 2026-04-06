

# الخطة النهائية المحكمة — 3 مهام

## المهمة 1 — إصلاح تكرار Providers

### `src/main.tsx`
- حذف imports: `AuthProvider`, `SubscriptionProvider`, `PaymentGatewayProvider`, `DatePreferenceProvider`
- إبقاء فقط: `PublicSettingsProvider` → `ThemeProvider` → `CookieConsentProvider` → `App`

### `src/App.tsx`
- **إضافة imports جديدة** (غير موجودة حالياً — تم التأكد):
```tsx
import { DatePreferenceProvider } from './contexts/DatePreferenceContext';
import { PaymentGatewayProvider } from './contexts/PaymentGatewayContext';
```
- تعديل ترتيب الـ providers (سطور 146-149) ليصبح:
```tsx
<AuthProvider>
  <DatePreferenceProvider>
    <AdminProvider>
      <SubscriptionProvider>
        <PaymentGatewayProvider>
          <MaintenanceModeGuard>
            ...
```
- إغلاق الـ tags الجديدة في نهاية الـ return

---

## المهمة 2 — حذف `@xyflow/react`

- حذف `@xyflow/react` من `package.json` (dependency ميتة — 0 imports مؤكد)

---

## المهمة 3 — حذف `react-google-recaptcha` v2

- حذف `import ReCAPTCHA from 'react-google-recaptcha';` من `src/pages/ContactUs.tsx`
- حذف `react-google-recaptcha` و `@types/react-google-recaptcha` من `package.json`

---

## ملخص الملفات

| الملف | التعديل |
|---|---|
| `src/main.tsx` | حذف 4 providers + 4 imports |
| `src/App.tsx` | إضافة 2 imports + إضافة `DatePreferenceProvider` و `PaymentGatewayProvider` في الترتيب الصحيح |
| `src/pages/ContactUs.tsx` | حذف dead import سطر واحد |
| `package.json` | حذف 3 packages: `@xyflow/react`, `react-google-recaptcha`, `@types/react-google-recaptcha` |

