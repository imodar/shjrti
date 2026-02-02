
# خطة إصلاح صفحة FamilyBuilderStitch

## المشكلة
صفحة `/family-builder-stitch` لا تعمل لأن `useFamilyData()` يحتاج أن يكون داخل `FamilyDataProvider`، لكن هذا الـ Provider غير موجود.

## الحل (تعديل ملف واحد فقط)

### تعديل `src/App.tsx`

سأضيف wrapper بسيط مباشرة في App.tsx يستخدم نفس النمط الموجود:

```tsx
// إنشاء wrapper مباشر بدون ملف جديد
const FamilyBuilderStitchWithProvider: React.FC = () => {
  const [searchParams] = useSearchParams();
  const familyId = searchParams.get('family');

  return (
    <FamilyDataProvider familyId={familyId}>
      <FamilyBuilderStitch />
    </FamilyDataProvider>
  );
};
```

ثم استخدامه في الـ Route:
```tsx
<Route path="/family-builder-stitch" element={
  <ProtectedRoute>
    <ProtectedFamilyRoute loadingFallback={<SkeletonLayoutForBuilder />}>
      <FamilyBuilderStitchWithProvider />
    </ProtectedFamilyRoute>
  </ProtectedRoute>
} />
```

## التغييرات المطلوبة

| الملف | التغيير |
|-------|---------|
| `src/App.tsx` | إضافة import لـ `FamilyDataProvider` + إنشاء wrapper component + تحديث Route |

## النتيجة
- لا ملفات جديدة
- نفس المنطق والبيانات
- فقط المظهر مختلف
