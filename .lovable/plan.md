

# صفحة عرض الشجرة العامة بنمط Stitch (`/stitch-tree`)

## الهدف
إنشاء نسخة جديدة من صفحة `/tree` (عرض الشجرة للزوار) بتصميم نمط Stitch، مع نفس الوظائف الأساسية:
- التحقق من رابط المشاركة (share token)
- حماية بكلمة مرور
- صفحات خطأ (رابط منتهي / غير صحيح)
- عرض الشجرة + الإحصائيات + المعرض (حسب إعدادات المشاركة)
- اقتراح تعديلات من الزوار
- عرض قائمة الأعضاء + الملف الشخصي

## الملفات الجديدة

### 1. `src/pages/StitchPublicTreeView.tsx` (الصفحة الرئيسية)
- صفحة كاملة بتصميم Stitch (بدون StitchLayout لأنها صفحة عامة بدون تسجيل دخول)
- تطبق `theme-stitch` class على العنصر الرئيسي
- تستخدم نفس منطق `PublicTreeView.tsx` للتحقق من التوكن والوصول:
  - استدعاء `get-shared-family` Edge Function
  - معالجة PASSWORD_REQUIRED / PASSWORD_INCORRECT / TOKEN_EXPIRED / TOKEN_INVALID
- هيكل الصفحة:
  - **Header بسيط**: شعار الموقع + اسم العائلة (بدون قوائم تنقل كاملة)
  - **شريط تنقل الأقسام**: نبذة | الشجرة | الإحصائيات | المعرض (مشروط بـ share_gallery)
  - **المحتوى الرئيسي**: يتغير حسب القسم النشط
  - **قائمة الأعضاء الجانبية**: تتحول لـ bottom sheet على الموبايل
  - **Footer مبسط**: `GlobalFooterSimplified`

### 2. `src/pages/StitchPublicTreeView/StitchPublicTreeViewWithContext.tsx` (Wrapper)
- مطابق لـ `PublicTreeViewWithContext.tsx`
- يقرأ `token` من URL ويستدعي `get-shared-family`
- يمرر البيانات عبر `FamilyDataProvider`

## التغييرات على ملفات موجودة

### 3. `src/App.tsx`
- إضافة Route جديد: `/stitch-tree` يشير إلى `StitchPublicTreeViewWithContext`
- يبقى `/tree` و `/share` يشيران للنسخة الأصلية

### 4. `src/constants/routes.ts`
- إضافة `'stitch-tree'` للقائمة المحمية

## تفاصيل التصميم (Stitch Style)

### حالة التحميل
- استخدام spinner بسيط مع خلفية `bg-slate-50 dark:bg-background` ونص بتصميم Stitch

### حالة كلمة المرور
- استخدام مكون `PasswordModal` الموجود مع تغليف بتصميم Stitch (ألوان primary بدلاً من emerald/teal)

### حالة الخطأ (رابط غير صحيح / منتهي)
- بطاقة خطأ بتصميم Stitch مع Material Icons بدلاً من Lucide

### الأقسام الرئيسية

```text
+--------------------------------------------------+
| [شعار]  عائلة الفلاني           [إحصائيات سريعة] |
+--------------------------------------------------+
| [نبذة] [الشجرة] [الإحصائيات] [المعرض]            |
+--------------------------------------------------+
|                    |                               |
|  قائمة الأعضاء    |    المحتوى الرئيسي            |
|  (جانبية/bottom   |    (يتغير حسب القسم)           |
|   sheet)          |                               |
+--------------------------------------------------+
| Footer                                            |
+--------------------------------------------------+
```

- **نبذة**: عرض وصف العائلة + إحصائيات أساسية (أعضاء، ذكور، إناث) بتصميم بطاقات Stitch
- **الشجرة**: استخدام `StitchTreeCanvas` + `StitchFamilyBar` (مع root selector) - نفس مكونات الشجرة المصادقة
- **الإحصائيات**: استخدام `FamilyStatisticsView` الموجود
- **المعرض**: استخدام `FamilyGalleryView` مع `readOnly={true}` (مشروط بـ `share_gallery`)

### اقتراح التعديلات
- استخدام مكون `SuggestEditDialog` الموجود بدون تعديل
- يتم تفعيله عند النقر على "اقتراح تعديل" من بطاقة العضو في الشجرة

### عرض الملف الشخصي
- استخدام `MemberProfileModal` الموجود مع `readOnly={true}`

## ملاحظات تقنية
- الصفحة **لا تحتاج** تسجيل دخول (عامة)
- البيانات تأتي من Edge Function `get-shared-family` فقط (REST-API-First)
- `StitchTreeCanvas` يُعاد استخدامه مباشرة مع بيانات من التوكن
- التصميم يطبق `theme-stitch` class لاستخدام CSS المخصص

