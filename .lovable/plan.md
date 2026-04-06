

# إصلاح خط الاتصال أسفل بوكس الأزواج المتعددين

## المشكلة
`UNIT_HEIGHT_POLYGAMY = 250` ثابت، لكن الكارد الفعلي يتغير ارتفاعه حسب عدد الزوجات (padding + gap + avatars + badges). عندما يكون الارتفاع الفعلي أكبر من 250px، الخط يخرج من خلف الكارد بدل أسفله.

## الحل
استبدال الثابت بدالة تحسب الارتفاع ديناميكياً حسب عدد الزوجات في الوحدة.

## التنفيذ — ملف واحد: `src/components/stitch/TreeCanvas.tsx`

### 1. تعديل دالة `getUnitHeight`
بدل إرجاع `UNIT_HEIGHT_POLYGAMY` الثابت، تحسب الارتفاع بناءً على عدد الزوجات:

```tsx
const getUnitHeight = (unit: FamilyUnit): number => {
  if (unit.type === 'polygamy') {
    // Husband section: ~80px (avatar + name + gap)
    // Each row of wives: ~90px (avatar + name + badge)
    // Padding + label: ~60px
    const wivesPerRow = 3; // flex-wrap at ~3 wives per row
    const rows = Math.ceil(unit.wives.length / wivesPerRow);
    return 140 + rows * 90;
  }
  if (unit.type === 'married') return UNIT_HEIGHT_MARRIED;
  return UNIT_HEIGHT_SINGLE;
};
```

### 2. تحديث حساب `maxY` في treeDimensions
استخدام `getUnitHeight(unit)` بدل `UNIT_HEIGHT_POLYGAMY` الثابت عند حساب أبعاد الـ SVG.

### 3. تحديث حساب المواضع في `computePositions`
أي مكان يستخدم `UNIT_HEIGHT_POLYGAMY` أو `getUnitHeight` لحساب `y` للجيل التالي يجب أن يأخذ الارتفاع الفعلي للوحدة الأب.

## التأثير
- الخط يخرج دائماً من أسفل الكارد بغض النظر عن عدد الزوجات
- لا تغيير على الكاردات الأخرى (single/married)

