

# خطة: استخراج الدوال المشتركة إلى ملف `memberDisplayUtils.ts`

## الهدف
استخراج دوال عرض الأعضاء من `MemberCard.tsx` إلى ملف مشترك يمكن استخدامه في جميع الثيمات (Modern, Professional, Stitch).

---

## الملفات المتأثرة

| الملف | نوع التغيير |
|-------|-------------|
| `src/lib/memberDisplayUtils.ts` | **جديد** - الدوال المشتركة |
| `src/components/shared/MemberCard.tsx` | تعديل - استيراد واستخدام الدوال |
| `src/components/stitch/Sidebar.tsx` | تعديل - استخدام الدوال + تحديث العرض |
| `src/pages/FamilyBuilderStitch.tsx` | تعديل - تمرير البيانات الكاملة |

---

## التفاصيل التقنية

### 1. إنشاء `src/lib/memberDisplayUtils.ts`

سيحتوي على الدوال التالية كـ **pure functions**:

```typescript
// الدوال المستخرجة من MemberCard.tsx

getFounderLastName(familyMembers: Member[]): string
// الحصول على اسم عائلة المؤسس

isMemberFromFamily(member: Member, familyMembers: Member[]): boolean
// التحقق إذا العضو من داخل العائلة (له أب/أم في الشجرة أو مؤسس)

buildLineageChain(startMember: Member, familyMembers: Member[], useBintForFemaleChild?: boolean): string
// بناء سلسلة النسب (حتى 3 أجيال)

generateMemberDisplayName(member: Member, familyMembers: Member[], marriages: Marriage[]): string | null
// توليد اسم العرض للعضو

getParentageInfo(member: Member, familyMembers: Member[]): { genderTerm: string; lineage: string } | null
// الحصول على معلومات النسب (ابن/ابنة + سلسلة الآباء)

getSpouseDisplayInfo(member: Member, familyMembers: Member[], marriages: Marriage[]): { label: string; info: string } | null
// معلومات الزوج/الزوجة للأعضاء من خارج العائلة

getBirthDeathDisplayInfo(member: Member, t: Function): DisplayInfo | null
// معلومات الولادة/الوفاة مع حساب العمر
```

### 2. تحديث `MemberCard.tsx`

- استيراد الدوال من `@/lib/memberDisplayUtils`
- استبدال الدوال المحلية باستدعاءات للدوال المشتركة
- الحفاظ على نفس السلوك الحالي تماماً

### 3. تحديث `Sidebar.tsx` (Stitch Theme)

**توسيع الـ Member interface:**
```typescript
interface Member {
  // الموجود حالياً
  id, name, first_name, last_name, image_url, gender, is_founder, role
  // الجديد
  father_id?: string;
  mother_id?: string;
  birth_date?: string;
  death_date?: string;
  is_alive?: boolean;
}
```

**إضافة props جديدة:**
```typescript
interface StitchSidebarProps {
  // الموجود حالياً...
  familyMembers: Member[];  // جديد - للبحث عن الآباء
  marriages: Marriage[];    // جديد - لمعلومات الأزواج
}
```

**تحديث العرض لـ 3 سطور:**
```text
┌─────────────────────────────────────────┐
│ [صورة]  محمد السعيد              [🏆]  │ ← السطر 1
│         ابن سعيد ابن أحمد السعيد        │ ← السطر 2
│         🎂 ولد في 1990 - 35 سنة        │ ← السطر 3
└─────────────────────────────────────────┘
```

### 4. تحديث `FamilyBuilderStitch.tsx`

تمرير البيانات الكاملة للـ Sidebar:
```typescript
<StitchSidebar
  members={filteredMembers.map(m => ({
    ...m,  // تمرير كل الحقول
    father_id: m.father_id,
    mother_id: m.mother_id,
    birth_date: m.birth_date,
    death_date: m.death_date,
    is_alive: m.is_alive,
  }))}
  familyMembers={familyMembers}  // جديد
  marriages={marriages}           // جديد
  // ... باقي الـ props
/>
```

---

## الفوائد

- **لا تكرار للكود**: دالة واحدة مشتركة بين جميع الثيمات
- **سهولة الصيانة**: أي تعديل على منطق العرض يتم في مكان واحد
- **توحيد السلوك**: نفس المنطق يعمل في Modern و Professional و Stitch
- **قابلية التوسع**: يمكن لأي ثيم جديد استخدام نفس الدوال

