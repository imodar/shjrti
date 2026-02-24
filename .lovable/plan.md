

# خطة شاملة: توحيد جميع المسارات - جعل تصميم Stitch هو الافتراضي

## الجزء الأول: توحيد المسارات المحمية (بعد تسجيل الدخول)

### 1. `src/App.tsx` - إعادة هيكلة المسارات
- نقل صفحات Stitch إلى المسارات الرئيسية داخل `StitchLayout`:
  - `/dashboard` -> `StitchDashboard`
  - `/family-builder` -> `FamilyBuilderStitchWithProvider`
  - `/family-creator` -> `StitchFamilyCreator`
  - `/family-tree-view` -> `StitchTreeViewWithProvider`
  - `/profile` -> `StitchAccount`
- الإبقاء على مسارات `stitch-*` القديمة كـ aliases (للتوافق مع أي روابط سابقة)
- إزالة مسارات التصميم القديم المكررة

### 2. `src/components/stitch/StitchLayout.tsx` - تحديث التعرف على المسارات
تحديث شروط pathname لتتعرف على المسارات الجديدة:
```text
isBuilderPage = pathname === '/family-builder' || pathname === '/stitch-family-builder'
isTreePage = pathname === '/family-tree-view' || pathname === '/stitch-tree-view'
hideNav = pathname === '/family-creator' || pathname === '/stitch-family-creator'
activeTab matching for '/dashboard', '/profile', etc.
```

### 3. `src/components/stitch/Header.tsx` - تحديث مسارات التبويبات
تغيير paths في `builderTabs` و `accountTabs`:
```text
"/stitch-dashboard"       -> "/dashboard"
"/stitch-family-builder"  -> "/family-builder"
"/stitch-tree-view"       -> "/family-tree-view"
"/stitch-account"         -> "/profile"
```
وتحديث شرط `handleTabClick` ليتعرف على `/family-builder` بدل `/stitch-family-builder`

### 4. `src/pages/StitchDashboard.tsx` - تحديث الروابط الداخلية
```text
navigate('/stitch-family-creator')  -> navigate('/family-creator')
navigate('/stitch-family-builder')  -> navigate('/family-builder')
navigate('/stitch-account')         -> navigate('/profile')
```

### 5. `src/pages/StitchFamilyCreator.tsx` - تحديث الروابط
```text
navigate('/stitch-dashboard')       -> navigate('/dashboard')
navigate('/stitch-family-builder')  -> navigate('/family-builder')
```

### 6. `src/pages/StitchTreeView.tsx` - تحديث الروابط
```text
navigate('/stitch-family-builder')  -> navigate('/family-builder')
```

### 7. `src/components/stitch/SettingsView.tsx` - تحديث الروابط
```text
navigate('/stitch-dashboard')       -> navigate('/dashboard')
navigate('/stitch-family-builder')  -> navigate('/family-builder')
```

### 8. `src/pages/AcceptInvitation.tsx` - تحديث رابط التوجيه
```text
navigate('/stitch-family-builder')  -> navigate('/family-builder')
```

### 9. `src/constants/routes.ts` - التأكد من وجود المسارات
التأكد من وجود `family-builder`, `family-creator`, `profile` في قائمة `PROTECTED_ROUTES` (معظمها موجود بالفعل).

---

## الجزء الثاني: توحيد المسارات العامة (صفحة الشجرة للزوار)

### 10. `src/App.tsx` - تغيير المكون للمسارات العامة
- تغيير `/tree` من `PublicTreeViewWithContext` إلى `StitchPublicTree`
- تغيير `/share` من `PublicTreeViewWithContext` إلى `StitchPublicTree`
- الإبقاء على `/stitch-tree` كـ alias
- إزالة import لـ `PublicTreeViewWithContext` إذا لم يعد مستخدما

---

## ملخص جميع التغييرات

| المسار | قبل (المكون) | بعد (المكون) |
|--------|-------------|-------------|
| `/dashboard` | Dashboard (قديم) | StitchDashboard (جديد) |
| `/family-builder` | غير موجود / قديم | FamilyBuilderStitch (جديد) |
| `/family-creator` | FamilyCreator (قديم) | StitchFamilyCreator (جديد) |
| `/family-tree-view` | FamilyTreeView (قديم) | StitchTreeView (جديد) |
| `/profile` | Profile (قديم) | StitchAccount (جديد) |
| `/tree` | PublicTreeViewWithContext (قديم) | StitchPublicTree (جديد) |
| `/share` | PublicTreeViewWithContext (قديم) | StitchPublicTree (جديد) |
| `/stitch-*` | (تبقى كـ aliases) | نفس المكون الجديد |

## ما لن يتأثر
- صفحات الأدمن (`/admin/*`)
- صفحات الدفع (`/payments`, `/plan-selection`, etc.)
- مسار `/auth`
- الصفحات العامة الثابتة (`/contact`, `/terms-conditions`, `/privacy-policy`)

## الملفات المطلوب تعديلها (10 ملفات)
1. `src/App.tsx`
2. `src/components/stitch/StitchLayout.tsx`
3. `src/components/stitch/Header.tsx`
4. `src/pages/StitchDashboard.tsx`
5. `src/pages/StitchFamilyCreator.tsx`
6. `src/pages/StitchTreeView.tsx`
7. `src/components/stitch/SettingsView.tsx`
8. `src/pages/AcceptInvitation.tsx`
9. `src/constants/routes.ts`
10. أي ملفات أخرى تحتوي على روابط `stitch-*` داخلية

