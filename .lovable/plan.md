
# خطة: إنشاء صفحة عرض عام بنمط Stitch (`/stitch-tree`)

## الفكرة
إنشاء صفحة عامة (public) بنفس تصميم `/stitch-family-builder` لكن بوظائف `/tree` - متاحة للزوار الخارجيين عبر رابط المشاركة (share token)، مع دعم كلمة المرور والاقتراحات.

## البنية المعمارية

```text
/stitch-tree?token=xxx
     |
     v
StitchPublicTreePage.tsx  (صفحة جديدة)
     |
     +-- يستدعي get-shared-family Edge Function (نفس الموجود)
     +-- يتعامل مع: كلمة المرور / Token منتهي / Token خاطئ
     |
     v
بعد التحقق يعرض:
  +-- StitchHeader (variant: public) -- بدون تسجيل دخول
  +-- StitchFamilyBar (اسم العائلة فقط)
  +-- StitchSidebar (الأعضاء - قراءة فقط، بدون زر إضافة)
  +-- StitchMainContent (العرض الرئيسي - readOnly)
  +-- بدون StitchRightPanel (غير مطلوب للزوار)
```

## التغييرات المطلوبة

### 1. صفحة جديدة: `src/pages/StitchPublicTree.tsx`
- **الوظيفة الأساسية**: نسخة مبسطة من `FamilyBuilderStitch.tsx` لكن بدون مصادقة
- تقرأ `token` من URL query params
- تستدعي `get-shared-family` Edge Function عبر `supabase.functions.invoke()` (نفس آلية PublicTreeView)
- تتعامل مع حالات الخطأ: `PASSWORD_REQUIRED`, `TOKEN_EXPIRED`, `TOKEN_INVALID`, `PASSWORD_INCORRECT`
- تعرض `PasswordModal` عند الحاجة
- بعد التحقق الناجح، تعرض نفس layout الـ stitch-family-builder لكن بوضع `readOnly`
- **التبويبات المتاحة**: dashboard (الرئيسية)، tree-view (الشجرة)، gallery (المعرض)، statistics (الإحصائيات)، suggestions (اقتراح تعديل)
- **بدون**: إضافة أعضاء، تعديل، حذف، إعدادات

### 2. تعديل `StitchHeader.tsx` - إضافة variant جديد: `public`
- variant جديد `'public'` يعرض:
  - اسم العائلة فقط
  - تبويبات محدودة: dashboard, tree, gallery, statistics, suggestions
  - بدون dropdown المستخدم (لا يوجد تسجيل دخول)
  - يبقي على LanguageSwitcher

### 3. تعديل `StitchSidebar.tsx`
- إضافة prop `readOnly?: boolean`
- عند `readOnly=true`: إخفاء زر "إضافة عضو" (الزر العلوي والسفلي)

### 4. تعديل `StitchMainContent.tsx`
- دعم عرض اقتراحات التعديل للزوار عبر `SuggestEditDialog`
- إضافة prop `onSuggestEdit?: (memberId, memberName) => void`
- عند وضع `readOnly`: عرض زر "اقتراح تعديل" بدل أزرار التعديل/الحذف في MemberProfile

### 5. تسجيل المسار في `App.tsx`
- إضافة route عام (بدون ProtectedRoute):
  ```
  <Route path="/stitch-tree" element={<StitchPublicTree />} />
  ```

### 6. التبويبات والوظائف

| التبويب | المكون المستخدم | ملاحظات |
|---------|----------------|---------|
| dashboard | StitchMainContent (welcome + birthdays) | قراءة فقط، بدون activities |
| tree | StitchTreeCanvas | نفس المكون الموجود |
| gallery | StitchGalleryView | قراءة فقط (readOnly) |
| statistics | StitchStatisticsView | نفس المكون الموجود |
| suggestions | SuggestEditDialog | يفتح dialog اقتراح التعديل |

### 7. الأمان
- نفس آلية `/tree`: token-based access عبر `get-shared-family`
- دعم كلمة المرور عبر `PasswordModal`
- معدل محدود (rate limiting) مطبق بالفعل في Edge Function
- لا يتم تمرير أي بيانات حساسة (creator_id, share_password hash) للعميل
- وضع `readOnly` يمنع أي تعديل من الواجهة

### 8. المكونات الموجودة التي سيتم إعادة استخدامها (بدون نسخ)
- `StitchHeader` (مع variant جديد)
- `StitchFamilyBar`
- `StitchSidebar` (مع readOnly prop)
- `StitchMainContent` (مع readOnly prop)
- `StitchMemberProfile` (readOnly موجود بالفعل)
- `StitchTreeCanvas`
- `StitchGalleryView`
- `StitchStatisticsView`
- `SuggestEditDialog`
- `PasswordModal`

## التفاصيل التقنية

### تدفق البيانات
```text
1. المستخدم يفتح /stitch-tree?token=xxx
2. الصفحة تستدعي get-shared-family مع الـ token
3. إذا PASSWORD_REQUIRED -> يظهر PasswordModal
4. إذا نجح -> تخزين البيانات في state محلي (familyData, members, marriages)
5. عرض الواجهة بنمط Stitch مع readOnly=true
```

### حالات الخطأ (نفس تصميم PublicTreeView لكن بنمط Stitch)
- Token منتهي/خاطئ: صفحة خطأ بتصميم Stitch
- كلمة مرور خاطئة: رسالة خطأ بتصميم Stitch
- Loading: StitchLoadingFallback
