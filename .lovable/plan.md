

# Fix Metro Grid Gallery - True Metro Design

## Problem
The current gallery shows all images as equal squares stacked in one column or as identical blocks. This is NOT a Metro design. The code forces `span 1` for all items when there are 4 or fewer images, removing all visual variety.

## What is Metro Design?
Metro design uses a fixed grid (e.g., 3 columns) where items span different numbers of columns and rows to create visual variety -- even with just 2-3 images. For example, with 3 images: one could be large (2x2), one tall (1x2), and one square (1x1).

## Solution

### 1. Fix `getMetroStyle` in `GalleryView.tsx` (line 43-57)

Remove the `totalItems <= 4` condition that forces everything to squares. Instead, define specific patterns for small counts:

```text
3 items:  [large 2x2] [square 1x1]
                       [square 1x1]

4 items:  [large 2x2] [square 1x1]
                       [square 1x1]
          [wide 2x1]

5 items:  [large 2x2] [square 1x1]
                       [square 1x1]
          [square 1x1] [wide 2x1]
```

This ensures even with few images, the layout has Metro-style variety.

### 2. Keep the grid container as `grid-cols-3` (line 425)

The current inline Tailwind `grid grid-cols-3 gap-4` with `gridAutoRows: '220px'` and `gridAutoFlow: 'dense'` is correct. Keep this.

### 3. Clean up unused CSS in `components.css` (lines 263-291)

Since the grid is now fully inline via Tailwind/React styles, the `.metro-grid` and `.metro-item-*` CSS classes are no longer used. They can be removed or kept for reference but won't affect the layout.

## Technical Details

### Updated `getMetroStyle` function:

```typescript
const getMetroStyle = (index: number, totalItems: number) => {
  // Small count patterns for true metro variety
  if (totalItems <= 2) {
    const small = [
      { style: { gridColumn: 'span 2', gridRow: 'span 2' } }, // large
      { style: { gridColumn: 'span 1', gridRow: 'span 2' } }, // tall
    ];
    return { className: index === 0 ? 'shadow-lg' : '', style: small[index]?.style || { gridColumn: 'span 1', gridRow: 'span 1' } };
  }
  if (totalItems === 3) {
    const p = [
      { className: 'shadow-lg', style: { gridColumn: 'span 2', gridRow: 'span 2' } },
      { className: '', style: { gridColumn: 'span 1', gridRow: 'span 1' } },
      { className: '', style: { gridColumn: 'span 1', gridRow: 'span 1' } },
    ];
    return p[index];
  }
  if (totalItems === 4) {
    const p = [
      { className: 'shadow-lg', style: { gridColumn: 'span 2', gridRow: 'span 2' } },
      { className: '', style: { gridColumn: 'span 1', gridRow: 'span 1' } },
      { className: '', style: { gridColumn: 'span 1', gridRow: 'span 1' } },
      { className: '', style: { gridColumn: 'span 3', gridRow: 'span 1' } },
    ];
    return p[index];
  }
  // 5+ items: repeating metro pattern
  const patterns = [
    { className: 'shadow-lg', style: { gridColumn: 'span 2', gridRow: 'span 2' } },
    { className: '', style: { gridColumn: 'span 1', gridRow: 'span 1' } },
    { className: '', style: { gridColumn: 'span 1', gridRow: 'span 2' } },
    { className: '', style: { gridColumn: 'span 2', gridRow: 'span 1' } },
    { className: '', style: { gridColumn: 'span 1', gridRow: 'span 1' } },
    { className: '', style: { gridColumn: 'span 1', gridRow: 'span 1' } },
  ];
  return patterns[index % patterns.length];
};
```

### Files to edit:
1. **`src/components/stitch/GalleryView.tsx`** - Replace `getMetroStyle` function (lines 43-57)
2. **`src/styles/themes/stitch/components.css`** - Optionally clean up unused `.metro-grid` / `.metro-item-*` classes (lines 262-291)

