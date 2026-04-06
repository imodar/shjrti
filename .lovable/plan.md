

# إصلاح أيقونة الشجرة في DashboardLoader

## المشكلة
الـ SVG path الحالي في `TreeIcon` ليس شكل شجرة واضح — هو path عشوائي لا يشبه شجرة.

## الحل
استبدال الـ SVG path بأيقونة شجرة حقيقية (مثل أيقونة park من Material Design) كـ inline SVG صحيح.

## التنفيذ

### ملف واحد: `src/components/stitch/DashboardLoader.tsx`

استبدال `TreeIcon` بـ SVG شجرة واضح — مثلاً أيقونة "park" الرسمية من Material Symbols:

```tsx
const TreeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-9 h-9 text-primary">
    <path d="M17 12h2L12 2 5 12h2l-3 5h5v5h6v-5h5l-3-5z"/>
  </svg>
);
```

أو نستخدم أيقونة `TreePine` من مكتبة Lucide الموجودة أصلاً بالمشروع — بدون أي تحميل خارجي وشكلها واضح 100%.

```tsx
import { TreePine } from 'lucide-react';
// واستخدامها مباشرة بدل TreeIcon
<TreePine className="w-9 h-9 text-primary" />
```

**Lucide هو الخيار الأفضل** لأنه موجود بالمشروع ولا يحتاج font خارجي.

