

# خطة نظام الأدوار والصلاحيات (Family Collaborators)

## الفكرة العامة

نظام يتيح لمالك الشجرة دعوة أشخاص آخرين لإدارة شجرته، مع تحديد صلاحياتهم. الميزة مدفوعة (متاحة فقط لباقة Plus/Integrated).

الشخص المدعو قد يكون مستخدم جديد (ينشئ حساب) أو مستخدم حالي (لديه شجرته الخاصة). في كلتا الحالتين يستطيع التبديل بين أشجاره وأشجار الآخرين.

---

## المرحلة 1: قاعدة البيانات

### جدول الدعوات `family_invitations`

| العمود | النوع | الوصف |
|--------|-------|-------|
| id | uuid | المعرف |
| family_id | uuid | FK -> families |
| invited_by | uuid | FK -> auth.users (المالك) |
| invited_email | text | إيميل المدعو |
| role | text | الدور: `editor` |
| token | text | رمز الدعوة (unique) |
| status | text | `pending` / `accepted` / `expired` / `revoked` |
| expires_at | timestamptz | صلاحية الدعوة (7 أيام) |
| accepted_at | timestamptz | وقت القبول |
| created_at | timestamptz | وقت الإنشاء |

### جدول المتعاونين `family_collaborators`

| العمود | النوع | الوصف |
|--------|-------|-------|
| id | uuid | المعرف |
| family_id | uuid | FK -> families |
| user_id | uuid | FK -> auth.users |
| role | text | الدور: `editor` (قابل للتوسع لاحقا) |
| invited_by | uuid | FK -> auth.users |
| created_at | timestamptz | تاريخ الإضافة |
| UNIQUE | | (family_id, user_id) |

### سياسات الأمان (RLS)

- المالك فقط يمكنه إضافة/حذف متعاونين
- المتعاون يرى فقط الأشجار المدعو إليها
- دالة `SECURITY DEFINER` للتحقق من الصلاحيات بدون recursion

### دالة التحقق

```sql
create or replace function public.is_family_collaborator(
  _user_id uuid, _family_id uuid
) returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from family_collaborators
    where user_id = _user_id and family_id = _family_id
  )
$$;
```

---

## المرحلة 2: الصلاحيات

### ما يستطيع المتعاون (Editor) فعله:
- اضافة/تعديل/حذف أعضاء الشجرة
- رفع صور وذكريات
- تعديل وصف العائلة
- تعديل إعدادات الخصوصية (اسم الأنثى، الصور)
- تعديل إعدادات المشاركة (الرابط العام)
- مراجعة الاقتراحات (قبول/رفض)
- عرض الإحصائيات والمعرض

### ما لا يستطيع المتعاون فعله:
- حذف الشجرة
- الدخول لصفحة الاشتراكات والفواتير
- الدخول للملف الشخصي لصاحب الشجرة
- دعوة متعاونين آخرين
- تغيير الدومين المخصص
- أرشفة الشجرة

---

## المرحلة 3: Edge Function للدعوات

### `api-family-invitations` Edge Function

- **POST** `/invite` - إرسال دعوة (المالك فقط)
  - يتحقق من الاشتراك (Plus فقط)
  - يتحقق أن المدعو ليس المالك نفسه
  - ينشئ سجل في `family_invitations` مع token
  - يرسل إيميل عبر `send-templated-email` بقالب الدعوة

- **POST** `/accept` - قبول الدعوة
  - يتحقق من صلاحية الـ token
  - إذا المستخدم غير مسجل: يوجه لصفحة التسجيل مع الـ token
  - إذا مسجل: ينشئ سجل في `family_collaborators`
  - يحدث حالة الدعوة إلى `accepted`

- **DELETE** `/:id` - إلغاء دعوة أو إزالة متعاون (المالك فقط)

- **GET** `/family/:familyId` - عرض المتعاونين والدعوات المعلقة

---

## المرحلة 4: صفحة قبول الدعوة

### مسار جديد: `/accept-invitation?token=xxx`

- إذا المستخدم مسجل دخول: يقبل الدعوة مباشرة ويوجه للشجرة
- إذا غير مسجل:
  - يتحقق من الإيميل: هل موجود في النظام؟
    - نعم: يوجه لتسجيل الدخول ثم يقبل تلقائياً
    - لا: يعرض نموذج تسجيل مبسط (الإيميل محدد مسبقاً، يدخل كلمة مرور فقط)

---

## المرحلة 5: التبديل بين الأشجار

### تعديل الداشبورد (`StitchDashboard`)

حالياً الداشبورد يعرض فقط أشجار `creator_id = user.id`. سيتم إضافة قسم جديد:

- **أشجاري**: الأشجار التي أنشأها المستخدم (كما هو حالياً)
- **أشجار أديرها**: الأشجار المدعو إليها كمتعاون

كل شجرة مشتركة تظهر بعلامة مميزة (badge) توضح أنه "مشرف" وليس "مالك".

---

## المرحلة 6: ربط الصلاحيات بالواجهة

### تعديل `FamilyBuilderStitch`

- إنشاء hook جديد `useFamilyRole` يرجع:
  - `role`: `owner` | `editor` | `none`
  - `canDelete`: boolean
  - `canInvite`: boolean
  - `canManageSubscription`: boolean
  - `canEditMembers`: boolean
  - `canEditSettings`: boolean

- إخفاء/تعطيل العناصر بناءً على الصلاحيات:
  - تبويب "متقدمة" في الإعدادات: إخفاء زر حذف الشجرة
  - تبويب "المشرفون": يظهر القائمة لكن بدون زر "دعوة" للمتعاون
  - الهيدر: إخفاء رابط الاشتراكات/الفواتير

### تعديل Edge Functions الحالية

- `api-families` (DELETE): التحقق أن المستخدم مالك وليس متعاون
- `api-members`, `api-memories`, `api-marriages`: السماح للمتعاون بالإضافة/التعديل/الحذف

---

## المرحلة 7: واجهة تبويب المشرفين

### تعديل `SettingsView` - تبويب "المشرفون والصلاحيات"

استبدال placeholder الحالي بـ:

- قائمة المتعاونين الحاليين (اسم، إيميل، تاريخ الإضافة، زر إزالة)
- قائمة الدعوات المعلقة (إيميل، حالة، زر إلغاء)
- زر "دعوة مشرف جديد" (يفتح modal لإدخال الإيميل)
- رسالة الترقية إذا الباقة لا تدعم الميزة

---

## ملخص الملفات المتأثرة

| الملف | التعديل |
|-------|---------|
| migration جديد | إنشاء الجداول والدوال و RLS |
| `supabase/functions/api-family-invitations/` | Edge Function جديد |
| `supabase/functions/api-families/` | تعديل لدعم المتعاونين |
| `supabase/functions/api-members/` | تعديل التحقق من الصلاحيات |
| `src/lib/api/endpoints/familyInvitations.ts` | API client جديد |
| `src/hooks/useFamilyRole.ts` | Hook جديد |
| `src/pages/AcceptInvitation.tsx` | صفحة قبول الدعوة |
| `src/components/stitch/SettingsView.tsx` | واجهة المشرفين |
| `src/pages/StitchDashboard.tsx` | قسم الأشجار المشتركة |
| `src/pages/FamilyBuilderStitch.tsx` | ربط الصلاحيات |
| `src/App.tsx` | إضافة route جديد |
| email template (DB) | قالب إيميل الدعوة |
| translations (DB) | ترجمات الواجهة الجديدة |

---

## ملاحظات مهمة

- الميزة مقيدة بباقة Plus عبر التحقق من `packages` في الباك إند (ليس فقط الفرونت)
- كل عمليات التحقق من الصلاحيات تتم server-side في Edge Functions
- الدعوة تنتهي بعد 7 أيام تلقائياً
- يمكن للمالك إزالة أي متعاون في أي وقت
- المتعاون يمكنه مغادرة الشجرة بنفسه

