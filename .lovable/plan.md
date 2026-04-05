

# تنفيذ خطة التحسينات الشاملة — المرحلة 1

## نظرة عامة
تنفيذ 6 إصلاحات عاجلة (P0) + إضافات المرحلة 2 (Code Splitting + clearAllAppCache + DatePreference cache).

---

## المرحلة 1 — الإصلاحات العاجلة

### 1. إصلاح `window.__croppedImageBlob` → `useRef`
**الملفات:** `src/components/stitch/useAddMemberForm.ts`, `src/pages/FamilyBuilderNew.tsx`

- في `useAddMemberForm.ts`: إضافة `const croppedImageBlobRef = useRef<Blob | null>(null)` واستبدال كل `(window as any).__croppedImageBlob` بـ `croppedImageBlobRef.current` (5 مواقع: سطر 168, 183, 505, 528, 720)
- في `FamilyBuilderNew.tsx`: نفس الشيء — إضافة `useRef` واستبدال كل الاستخدامات (سطر 172, 208, 2141, 2311, 2457)

### 2. إصلاح conditional hook في PublicTreeView
**الملفات:** `src/contexts/FamilyDataContext.tsx`, `src/hooks/useFamilyDataSafe.ts` (جديد), `src/pages/PublicTreeView.tsx`

- في `FamilyDataContext.tsx` سطر ~28: تصدير `FamilyDataContext`:
```typescript
export const FamilyDataContext = createContext<FamilyDataContextType | undefined>(undefined);
```
- إنشاء `src/hooks/useFamilyDataSafe.ts`:
```typescript
import { useContext } from 'react';
import { FamilyDataContext } from '@/contexts/FamilyDataContext';
export const useFamilyDataSafe = () => useContext(FamilyDataContext) ?? null;
```
- في `PublicTreeView.tsx` سطر 24 و 39: استبدال `useFamilyData` بـ `useFamilyDataSafe` واستدعاؤه دائماً بدون شرط

### 3. Swagger UI lazy load
**الملف:** `src/pages/ApiDocs.tsx`

- استبدال السطر 1-2 بـ:
```typescript
import React, { Suspense } from 'react';
const SwaggerUI = React.lazy(() => import('swagger-ui-react'));
```
- لف `<SwaggerUI>` بـ `<Suspense>` مع loading spinner
- نقل CSS import داخل الـ lazy component أو استيراده كـ side effect

### 4. تحسين cache الاشتراك + Realtime
**الملف:** `src/contexts/SubscriptionContext.tsx`

- تغيير TTL من `3600000` إلى `300000` (5 دقائق) في سطر 44
- إضافة Supabase Realtime listener في useEffect الرئيسي:
```typescript
const channel = supabase
  .channel('subscription-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'subscriptions',
    filter: `user_id=eq.${user.id}`
  }, () => {
    localStorage.removeItem(`subscription_${user.id}`);
    fetchSubscriptionDetails(true);
  })
  .subscribe();
```
- تنظيف القناة عند unmount

### 5. تنظيف localStorage عند تسجيل الخروج
**الملف:** `src/contexts/AuthContext.tsx`

- إضافة `clearAllAppCache` في دالة `signOut` (سطر 54-68):
```typescript
const CACHE_KEYS_TO_CLEAR = ['paymentGatewaySettings', 'translations_ar', 'translations_en'];
CACHE_KEYS_TO_CLEAR.forEach(key => localStorage.removeItem(key));
// + مسح subscription cache + date preference
```

### 6. تصدير FamilyDataContext
**الملف:** `src/contexts/FamilyDataContext.tsx`

- تحويل `const FamilyDataContext` إلى `export const FamilyDataContext`

---

## المرحلة 2 — Code Splitting + تحسينات

### 7. Code Splitting لصفحات الإدارة
**الملف:** `src/App.tsx`

- استبدال static imports (سطر 57-63) بـ `React.lazy`:
```typescript
const EnhancedAdminPanel = React.lazy(() => import('./pages/EnhancedAdminPanel'));
const AdminBilling = React.lazy(() => import('./pages/AdminBilling'));
const AdminAPISettings = React.lazy(() => import('./pages/AdminAPISettings'));
const AdminSocialMedia = React.lazy(() => import('./pages/AdminSocialMedia'));
const AdminSEOSettings = React.lazy(() => import('./pages/AdminSEOSettings'));
const AdminNewsletterSubscriptions = React.lazy(() => import('./pages/AdminNewsletterSubscriptions'));
const AdminRefunds = React.lazy(() => import('./pages/AdminRefunds'));
const ApiDocs = React.lazy(() => import('./pages/ApiDocs'));
```
- لف `<Routes>` بـ `<Suspense>` مع spinner

### 8. manualChunks في vite.config.ts
**الملف:** `vite.config.ts`

```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor-react': ['react', 'react-dom', 'react-router-dom'],
        'vendor-supabase': ['@supabase/supabase-js'],
        'vendor-query': ['@tanstack/react-query'],
      }
    }
  }
}
```

### 9. كاش DatePreference في localStorage
**الملف:** `src/contexts/DatePreferenceContext.tsx`

- عند تحميل التفضيل: قراءة من localStorage أولاً، ثم fetch من DB في الخلفية
- عند الحفظ: تحديث localStorage فوراً

---

## ملخص الملفات المتأثرة

| الملف | التعديل |
|---|---|
| `src/components/stitch/useAddMemberForm.ts` | useRef بدل window (5 مواقع) |
| `src/pages/FamilyBuilderNew.tsx` | useRef بدل window (5 مواقع) |
| `src/contexts/FamilyDataContext.tsx` | تصدير FamilyDataContext |
| `src/hooks/useFamilyDataSafe.ts` | **جديد** |
| `src/pages/PublicTreeView.tsx` | useFamilyDataSafe بدون شرط |
| `src/pages/ApiDocs.tsx` | React.lazy + Suspense |
| `src/contexts/SubscriptionContext.tsx` | TTL 5 دقائق + Realtime |
| `src/contexts/AuthContext.tsx` | clearAllAppCache في signOut |
| `src/contexts/DatePreferenceContext.tsx` | localStorage cache |
| `src/App.tsx` | lazy imports للإدارة + Suspense |
| `vite.config.ts` | manualChunks |

