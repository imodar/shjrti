## الفكرة

حالياً ميزة "بيانات الزوجة غير متوفرة" تعمل فقط للأعضاء الذكور (تنشئ سجل dummy باسم `unknown_mother`، تربط الأبناء به، وتعرض الزوجة كـ placeholder في الواجهات). نفس الميزة بكل أبعادها ستُضاف للأعضاء الإناث، بحيث يمكن للمرأة أن يكون لها "زوج غير معروف" يُنشأ تلقائياً ويُربط به الأبناء.

## نطاق التطبيق

سيتم استخدام sentinel جديد: `first_name === 'unknown_father'` للزوج الـ dummy، بنفس منطق `unknown_mother`.

### 1) النموذج (AddMemberForm + useAddMemberForm)

- **حقل جديد `fatherUnknown`** في `AddMemberFormData` (مثل `motherUnknown` تماماً) مع قيمة افتراضية `false`.
- **في `AddMemberForm.tsx` (السطور 457-478)**: إظهار نفس Switch + banner التنبيه أيضاً عندما `formData.gender === 'female'`، مع نصوص:
  - `member.husband_info_available` = "اسم الزوج ومعلوماته متوفرة"
  - `member.unknown_husband_note` = "سيتم إنشاء سجل زوج غير معروف تلقائياً وربط الأبناء بالأم مباشرة"
- **شرط إخفاء قائمة الأزواج** (السطر 480) يُحدَّث ليشمل الحالة الأنثوية أيضاً: `!((male && motherUnknown) || (female && fatherUnknown))`.
- **في `useAddMemberForm.ts`**:
  - في `populateFormData` (≈السطر 248-261): اكتشاف ما إذا كانت كل الأزواج dummies من نوع `unknown_father` وتعيين `fatherUnknown: true`.
  - في `handleFormSubmit` (≈السطر 679-792): إضافة فرعين موازيين تماماً للحالة الأنثوية:
    - **سيناريو 1 (معروف → غير معروف)**: إنشاء/إعادة استخدام dummy husband (`first_name: 'unknown_father'`, `name: 'زوج غير معروف'`, `gender: 'male'`, `is_alive: false`)، تحديث `father_id` للأبناء ليشير إلى الـ dummy، حذف الزواجات/الأزواج القدامى الخارجيين.
    - **سيناريو 2 (غير معروف → معروف)**: ترحيل أطفال من dummy husband إلى الزوج الحقيقي الجديد، حذف dummy والـ marriage.
  - تحديث الفلاتر التي تتجاهل dummies لتشمل `unknown_father` (مثل filter في السطر 311).

### 2) عرض البيانات (read-side)

- **`AddMemberForm.tsx` (السطر 117)**: إضافة فحص `unknown_father` → `t('member.unknown_husband', 'زوج غير معروف')`.
- **`MemberTimeline.tsx` (السطر 128-131)**: تحديث الشرط ليشمل كلا الـ sentinels.
- **`FamilyTab.tsx`**: 
  - عرض placeholder للأب عندما `father.first_name === 'unknown_father'` (مرآة منطق الأم في السطور 156-187).
  - في قسم spouseGroups (السطر 203): إضافة فرع placeholder للزوج عندما `spouse.first_name === 'unknown_father'` بنفس تصميم الزوجة المجهولة لكن بأيقونة/ألوان مذكّر.
- **`FamilyCard.tsx`**: إضافة `isUnknownHusband` بنفس منطق `isUnknownWife` لإخفاء الزوج المجهول من بطاقة الشجرة.
- **`StitchPublicTree.tsx` (السطر 288)**: استثناء `unknown_father` أيضاً من فلاتر العرض العامة.

### 3) مفاتيح ترجمة جديدة (تُستخدم مع fallbacks مدمجة)

- `member.husband_info_available` — "اسم الزوج ومعلوماته متوفرة"
- `member.unknown_husband_note` — "سيتم إنشاء سجل زوج غير معروف تلقائياً وربط الأبناء بالأم مباشرة"
- `member.unknown_husband` — "زوج غير معروف"
- `profile.unknown_husband` — "بيانات الزوج غير متوفرة" (موجود مسبقاً كـ fallback في MemberTimeline)
- `profile.unknown_husband_hint` — "Information can be added later"
- `profile.father_unknown_title` — "Father Not Registered"
- `tree_view.unknown_husband` — "Unknown Husband"

## ملاحظات تقنية

- لا تغييرات في قاعدة البيانات أو RLS — الميزة كلها client-side تستخدم سجلات `family_tree_members` عادية مع `first_name` كـ sentinel، تماماً كما هو الحال مع `unknown_mother`.
- التصميم/الألوان: placeholder الزوج يستخدم نفس النمط الرمادي المتقطع (slate dashed) مثل placeholder الزوجة، مع أيقونة `person_off`.
- لا تكرار: الـ Switch + Banner يستخدمان نفس الـ container، مع توجيه الحقل (`motherUnknown` للذكر، `fatherUnknown` للأنثى) حسب جنس العضو.

## الملفات المتأثرة

- `src/components/stitch/AddMemberFormTypes.ts`
- `src/components/stitch/useAddMemberForm.ts`
- `src/components/stitch/AddMemberForm.tsx`
- `src/components/stitch/FamilyTab.tsx`
- `src/components/stitch/FamilyCard.tsx`
- `src/components/stitch/MemberTimeline.tsx`
- `src/pages/StitchPublicTree.tsx`
