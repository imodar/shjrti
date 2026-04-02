

# إضافة خيار "الزوجة غير معروفة" (Switch) في فورم إضافة العضو الذكر

## الفكرة
عند تعديل/إضافة عضو ذكر، نضيف Switch قبل قسم الزوجات: "هل الزوجة معروفة؟"
- **مفعّل (افتراضي)** → قسم الزوجات يظهر كالمعتاد
- **معطّل** → يختفي قسم الزوجات، وعند الحفظ يُنشأ سجل dummy واحد فقط لكل أب

السويتش يظهر فقط للأعضاء الذكور. الزوج دائماً معروف.

## التعديلات

### 1. `AddMemberFormTypes.ts`
- إضافة `motherUnknown: boolean` في `MemberFormData` (default: `false`)
- إضافة القيمة في `defaultFormData`

### 2. `AddMemberForm.tsx` — إضافة السويتش
- قبل قسم الزوجات (سطر ~445)، إذا كان `gender === 'male'`:
  - Switch مع label: `t('member.wife_known', 'هل الزوجة معروفة؟')` / `t('member.wife_known', 'Is the wife known?')`
  - عند إيقاف السويتش (motherUnknown = true): إخفاء قسم الزوجات بالكامل + عرض بانر رمادي: "سيتم ربط الأبناء بالأب مباشرة بدون بيانات زوجة"
  - عند تفعيل السويتش: إظهار قسم الزوجات كالمعتاد

### 3. `useAddMemberForm.ts` — منطق الحفظ (سطر ~660)
- عند `motherUnknown === true` و `gender === 'male'`:
  1. بعد إنشاء/تعديل العضو، نبحث عن dummy wife موجودة مرتبطة بهذا العضو عبر marriage حيث الزوجة `first_name = 'unknown_mother'`
  2. إذا لم توجد → ننشئ عضو أنثى: `{ first_name: 'unknown_mother', name: 'زوجة غير معروفة', gender: 'female', is_alive: false, family_id }`
  3. ننشئ marriage (upsert) بين العضو الحالي وهذه الـ dummy
  - لا يتم إنشاء أكثر من dummy واحدة لكل أب

### 4. `AddMemberForm.tsx` — عرض الوالدين (marriageOptions)
- في `buildFullName` (سطر ~114): عند عرض زوجة بـ `first_name === 'unknown_mother'`، نعرض: `t('member.unknown_mother', 'زوجة غير معروفة')` بدلاً من الاسم العادي

### 5. عرض الشجرة
- في مكونات عرض الشجرة (`TreeCanvas.tsx`/`OrganizationalChart.tsx`): عند عرض زوجة بـ `first_name === 'unknown_mother'`، نعرض "غير معروفة" أو نخفيها حسب السياق
- في الرابط العام: نفس المعالجة

### 6. تعديل وضع التحرير (edit mode)
- عند فتح عضو ذكر للتعديل، نتحقق من زوجاته: إذا كانت جميعها `first_name === 'unknown_mother'`، نضبط `motherUnknown = true` والسويتش يكون معطّل

## ما لا يتأثر
- لا حاجة لـ migration — `mother_id` nullable أصلاً، والـ dummy عضو عادي
- API endpoints تعمل كالمعتاد
- منطق النسب يتتبع الأب أولاً فيعمل بشكل طبيعي

## ملاحظات
- الـ dummy تُميَّز بـ `first_name = 'unknown_mother'` كـ convention ثابت
- إذا أصبحت الزوجة معروفة لاحقاً، يمكن تعديل بيانات الـ dummy مباشرة بتفعيل السويتش وتعديل البيانات

