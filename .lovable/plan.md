## المشكلة
الـ buckets (`member-memories`, `family-memories`) صارت خاصة. الزائر المجهول في `/sheikhsaeed` (أو أي رابط مشاركة) ما يقدر يولّد signed URL لأن RLS تمنعه. النتيجة: الصور كلها مكسورة في الصفحات العامة.

## الحل
نضيف edge function عامة `get-shared-image` تستلم `share_token` + `file_path` + `bucket`، تتحقق إن التوكن صالح وأن الملف يخص نفس العائلة، ثم ترجع **signed URL** صالح لمدة ساعة باستخدام `service_role`.

### 1. Edge function جديدة `get-shared-image`
- إدخال: `{ share_token, bucket: 'member-memories'|'family-memories', file_path }`
- خطوات:
  1. تأكيد التوكن في `families` (غير منتهي).
  2. للملفات في `family-memories`: التأكد إن `file_path` يبدأ بـ `{family.id}/`.
  3. للملفات في `member-memories`: استخراج `memberId` من أول جزء من المسار والتأكد إنه ينتمي لنفس العائلة.
  4. توليد signed URL (3600s) وإرجاعه.
- Rate limiting بسيط بالـ IP لتجنّب الاستغلال.

### 2. تحديث الفرونت
- أداة مساعدة `getPublicShareToken()` ترجع التوكن من سياق الصفحة (URL `?token=`، أو window context للـ custom domain، أو preloaded data).
- `useResolvedImageUrl` و `useLazyImageUrl` و `FamilyGalleryView.getImageUrl`: لو في `share_token` نستدعي `get-shared-image` بدل `getPublicUrl`/`createSignedUrl`. خلاف ذلك يبقى السلوك الحالي (signed URL مباشر للمستخدم المسجَّل).
- نخزّن النتائج في نفس الـ in-memory cache (مع expiry).

### 3. ما لا يتغيّر
- صلاحيات الـ buckets تبقى خاصة.
- سياسات storage.objects تبقى كما هي (المالك فقط للقراءة المباشرة).
- المستخدم المسجّل في لوحته يستمر يستخدم signed URLs الحالية عبر `getMemberImageUrl`.

## ملفات تتأثر
- جديد: `supabase/functions/get-shared-image/index.ts`
- تعديل: `src/utils/useResolvedImageUrl.ts`, `src/hooks/useLazyImageUrl.ts`, `src/components/FamilyGalleryView.tsx`, و helper جديد `src/utils/publicShareContext.ts`.
