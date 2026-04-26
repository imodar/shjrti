## سبب المشكلة

عند فحص قاعدة البيانات (`family_tree_members`) لعائلة "الشيخ سعيد"، تبيّن أن حقل `last_name` ملوّث بسلاسل متراكمة بدلاً من اسم العائلة فقط:

| first_name | last_name المخزن (خاطئ) | الصحيح |
|---|---|---|
| محمد سعيد | `سعيد الشيخ سعيد` | `الشيخ سعيد` |
| صلاح الدين | `الدين الشيخ سعيد` | `الشيخ سعيد` |
| عبد اللطيف | `اللطيف اللطيف الشيخ سعيد` | `الشيخ سعيد` |

**عدد السجلات الملوّثة في عائلتك: 142 عضواً**.

التكرار يظهر في كل المواضع لأن منطق العرض في `src/lib/memberDisplayUtils.ts` (دالة `generateMemberDisplayName`) يستخدم `member.last_name` مباشرةً قبل الرجوع لاسم المؤسس:
```ts
const familyName = member.last_name || getFounderLastName(familyMembers);
```
لذلك يظهر التكرار في: بطاقة الملف الشخصي، بطاقات شجرة العائلة، الشجرة العامة، تبويبات العائلة، وأي مكان يستخدم هذه الدالة.

## كيف يجب أن يُعرض الاسم (بعد الإصلاح)

### 1. أعضاء من داخل العائلة (لهم أب داخل الشجرة)
`{first_name} {last_name الخاص بالمؤسس}`
- مثال: `عبد اللطيف الشيخ سعيد`
- مثال: `محمد سعيد الشيخ سعيد`
- اسم العائلة دائماً = `last_name` للمؤسس فقط (مصدر واحد موحّد).

### 2. المؤسس
`{first_name} {last_name}` كما هو مخزّن (مثال: `سعيد الشيخ سعيد`).

### 3. الأزواج/الزوجات من خارج العائلة
`{first_name} {last_name}` الخاص بهم (لأنهم من عائلة مختلفة)
- مثال: `بديعة البظ`، `كوكب باشوري`.

### 4. سلسلة النسب (lineage chain) — تبقى كما هي
لا تستخدم `last_name` إطلاقاً — تبني السلسلة من `first_name` للأب ثم الجد (حتى 3 أجيال) وتنتهي بـ `last_name` المؤسس فقط.

## خطة التنفيذ

### الخطوة 1 — تنظيف بيانات قاعدة البيانات (Migration)
تحديث `family_tree_members.last_name` لكل عضو لديه أب داخل الشجرة، ليطابق `last_name` الخاص بمؤسس عائلته:

```sql
UPDATE public.family_tree_members AS m
SET last_name = founder.last_name,
    updated_at = now()
FROM public.family_tree_members AS founder
WHERE founder.family_id = m.family_id
  AND founder.is_founder = true
  AND founder.last_name IS NOT NULL
  AND m.is_founder IS NOT TRUE
  AND m.last_name IS DISTINCT FROM founder.last_name
  AND m.father_id IN (
    SELECT id FROM public.family_tree_members ftm2
    WHERE ftm2.family_id = m.family_id
  );
```

**لا يتأثر:** المؤسس، والأزواج/الزوجات من خارج العائلة (لا أب لهم في الشجرة).

### الخطوة 2 — تعديل منطق العرض
في `src/lib/memberDisplayUtils.ts` داخل `generateMemberDisplayName`، استبدال:
```ts
const familyName = member.last_name || getFounderLastName(familyMembers);
```
بـ:
```ts
const familyName = getFounderLastName(familyMembers);
```
هذا يضمن مصدر واحد لاسم العائلة (المؤسس) ويمنع عودة المشكلة مستقبلاً حتى لو أُدخلت بيانات تالفة.

### الخطوة 3 — تعديل بطاقة الملف الشخصي
في `src/components/stitch/MemberProfile.tsx` (سطر 506):
```tsx
familyName={member?.last_name || member?.name || ''}
```
استبدالها بـ:
```tsx
familyName={getFounderLastName(familyMembers) || ''}
```

### الخطوة 4 — منع تلوث البيانات مستقبلاً
في نموذج إضافة/تعديل العضو (`useAddMemberForm.ts` و `familyBuilderService.ts`)، عند حفظ عضو لديه أب داخل العائلة، ضبط `last_name` تلقائياً = `last_name` المؤسس بدلاً من بناء سلسلة نسب فيه.

## النتيجة المتوقعة
- يختفي التكرار "اللطيف اللطيف الشيخ سعيد" → يصبح "عبد اللطيف الشيخ سعيد".
- يختفي "محمد سعيد سعيد الشيخ سعيد" → يصبح "محمد سعيد الشيخ سعيد".
- توحيد العرض في جميع الشاشات (الشجرة، الملف الشخصي، التبويبات، الشجرة العامة).
- مصدر واحد لاسم العائلة = المؤسس، يمنع تكرار المشكلة.