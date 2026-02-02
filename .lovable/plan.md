

# خطة إصلاح Tailwind Plugins لـ Stitch Theme

## المشكلة
الـ Tailwind CDN يحتوي على plugins مهمة غير مفعّلة في المشروع:
- `@tailwindcss/forms` - لتنسيق inputs و forms
- `@tailwindcss/typography` - للتنسيقات النصية (prose classes)
- `@tailwindcss/container-queries` - للـ container queries (@container)

## الحل

### الخطوة 1: تثبيت الـ plugins المفقودة

```bash
npm install @tailwindcss/forms @tailwindcss/container-queries
```

### الخطوة 2: تحديث `tailwind.config.ts`

```typescript
plugins: [
  require("tailwindcss-animate"),
  require("@tailwindcss/forms"),
  require("@tailwindcss/typography"),
  require("@tailwindcss/container-queries"),
],
```

## الملفات المتأثرة

| الملف | التغيير |
|-------|---------|
| `package.json` | إضافة `@tailwindcss/forms` و `@tailwindcss/container-queries` |
| `tailwind.config.ts` | تفعيل الـ 3 plugins في مصفوفة plugins |

## ما توفره هذه الـ Plugins

### @tailwindcss/forms
- تنسيق أفضل للـ inputs, selects, checkboxes, radio buttons
- Reset styles للـ form elements

### @tailwindcss/typography
- `prose` classes للتنسيق النصي
- تنسيق headings, paragraphs, lists تلقائياً

### @tailwindcss/container-queries
- `@container` queries بدلاً من `@media`
- `@lg:`, `@md:`, `@sm:` للـ container-based responsive design

## النتيجة المتوقعة
بعد تثبيت وتفعيل هذه الـ plugins، ستعمل جميع الـ classes المستخدمة في تصميم Stitch الأصلي بشكل صحيح.

