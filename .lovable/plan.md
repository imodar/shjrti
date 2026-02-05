

# خطة إضافة فورم العضو لتصميم Stitch

## نظرة عامة

سيتم إنشاء مكون فورم مستقل `AddMemberForm.tsx` داخل مجلد `src/components/stitch/` يحتوي على كامل لوجيك إضافة/تعديل الأعضاء المستخرج من `FamilyBuilderNew.tsx` مع تنسيق متوافق مع تصميم Stitch.

---

## الهيكل المقترح

```text
src/components/stitch/
├── AddMemberForm.tsx        <-- المكون الجديد الرئيسي
├── AddMemberFormTypes.ts    <-- تعريفات Types
├── useAddMemberForm.ts      <-- Hook مخصص للحالة والمنطق
├── Sidebar.tsx              <-- (تعديل) لفتح الفورم
├── MainContent.tsx          <-- (تعديل) لعرض الفورم
└── index.ts                 <-- (تعديل) تصدير المكونات الجديدة
```

---

## التفاصيل التقنية

### 1. إنشاء ملف الأنواع `AddMemberFormTypes.ts`

سيحتوي على:
- `MemberFormData` - بيانات الفورم
- `SpouseData` - بيانات الزوج/الزوجة (مستورد من SpouseForm)
- `FormMode` - أوضاع الفورم (add/edit/view)
- Props للمكونات

### 2. إنشاء Hook مخصص `useAddMemberForm.ts`

سيتضمن اللوجيك التالي المستخرج من FamilyBuilderNew:

**الحالات (States):**
- `formData` - بيانات الفورم الأساسية
- `currentStep` - الخطوة الحالية (1 أو 2)
- `formMode` - وضع الفورم (add/edit)
- `editingMember` - العضو قيد التعديل
- `wives/husbands` - قوائم الأزواج
- `isSaving` - حالة الحفظ
- `showSpouseForm` - إظهار فورم الزوج

**الدوال (Handlers):**
- `handleFormSubmit` - حفظ العضو (الدالة الرئيسية ~1250 سطر)
- `resetFormData` - إعادة تعيين الفورم
- `populateFormData` - ملء البيانات للتعديل
- `handleImageCrop` - قص الصورة
- `handleSpouseSave/Delete` - إدارة الأزواج
- `nextStep/prevStep` - التنقل بين الخطوات

**الاستعلامات المستخدمة:**
- `membersApi.create/update/delete`
- `marriagesApi.create/update/delete/upsert`
- `uploadMemberImage`

### 3. إنشاء المكون الرئيسي `AddMemberForm.tsx`

سيتضمن واجهة المستخدم:

**الخطوة 1 - المعلومات الأساسية:**
- الاسم الأول والأخير
- الجنس (ذكر/أنثى)
- اختيار الوالدين (من قائمة الزيجات)
- تاريخ الميلاد والحالة الحيوية
- تاريخ الوفاة (إن وجد)
- السيرة الذاتية
- صورة العضو (مع دعم القص)

**الخطوة 2 - بيانات الزواج:**
- إضافة زوج/زوجة
- فورم الزوج المضمن (SpouseForm)
- قائمة الأزواج الحاليين مع خيارات التعديل/الحذف
- دعم تعدد الزوجات (4 زوجات كحد أقصى للرجال)

**تصميم Stitch:**
- استخدام ألوان الـ Emerald/Teal
- خلفية بيضاء مع ظلال خفيفة
- أزرار مستديرة (rounded-xl)
- أيقونات Material Icons
- دعم RTL كامل

### 4. تعديل `Sidebar.tsx`

**التغييرات:**
- إضافة prop جديد: `onAddMember` يستقبل callback لفتح الفورم
- تحديث زر "إضافة عضو" لاستدعاء الـ callback

### 5. تعديل `MainContent.tsx`

**التغييرات:**
- إضافة props جديدة:
  - `showAddMemberForm: boolean`
  - `onCloseForm: () => void`
  - `familyMembers: Member[]`
  - `marriages: Marriage[]`
  - `familyId: string`
  - `onMemberAdded: () => void`
- إظهار `AddMemberForm` بدلاً من Dashboard عند الحاجة

### 6. تعديل `FamilyBuilderStitch.tsx`

**التغييرات:**
- إضافة state: `showAddMemberForm`
- تمرير الـ callbacks والـ props للمكونات
- استدعاء `refetch()` بعد إضافة عضو جديد

---

## تدفق العمل

```text
المستخدم يضغط "إضافة عضو"
        ↓
Sidebar.onAddMember() → setShowAddMemberForm(true)
        ↓
MainContent يعرض AddMemberForm
        ↓
المستخدم يملأ البيانات (Step 1 → Step 2)
        ↓
handleFormSubmit() → membersApi.create()
        ↓
onMemberAdded() → refetch() + setShowAddMemberForm(false)
        ↓
العودة للـ Dashboard مع تحديث القائمة
```

---

## الملفات المطلوب إنشاؤها/تعديلها

| الملف | الإجراء | الوصف |
|-------|---------|-------|
| `src/components/stitch/AddMemberFormTypes.ts` | إنشاء | تعريفات الأنواع |
| `src/components/stitch/useAddMemberForm.ts` | إنشاء | Hook للحالة واللوجيك |
| `src/components/stitch/AddMemberForm.tsx` | إنشاء | المكون الرئيسي |
| `src/components/stitch/MainContent.tsx` | تعديل | دعم عرض الفورم |
| `src/components/stitch/Sidebar.tsx` | تعديل | تمرير callback الإضافة |
| `src/components/stitch/index.ts` | تعديل | تصدير المكونات الجديدة |
| `src/pages/FamilyBuilderStitch.tsx` | تعديل | إدارة حالة الفورم |

---

## المكونات المستوردة

سيتم استيراد المكونات التالية الموجودة مسبقاً:
- `SpouseForm` من `@/components/SpouseForm`
- `EnhancedDatePicker` من `@/components/ui/enhanced-date-picker`
- `SearchableDropdown` من `@/components/SearchableDropdown`
- جميع مكونات UI من `@/components/ui/`
- الـ APIs من `@/lib/api/`
- الـ Hooks من `@/hooks/`

---

## ملاحظات مهمة

1. **فصل المنطق عن العرض**: اللوجيك في Hook منفصل، والعرض في المكون
2. **إعادة استخدام الكود**: استيراد `SpouseForm` الموجود بدلاً من تكراره
3. **التوافق مع التصميم**: استخدام CSS classes من Stitch theme
4. **الحفاظ على الأداء**: استخدام `useMemo` و `useCallback` للتحسين
5. **دعم RTL**: جميع العناصر تدعم الاتجاه من اليمين لليسار

