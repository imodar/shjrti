

## Problem

When there are only a few images in the gallery, the `auto-fill` grid creates wide columns (since `1fr` expands to fill available space). A `metro-item-large` item spanning 2 columns and 2 rows then occupies most of the visible page -- far larger than the design shows.

## Solution

1. **CSS Fix** (`src/styles/themes/stitch/components.css`):
   - Match the design exactly: `minmax(240px, 1fr)` columns, `240px` row height, `16px` gap
   - Add `max-width` constraints to prevent columns from growing too wide: use `repeat(auto-fill, minmax(240px, 280px))` so each column caps at ~280px instead of stretching to fill the entire width
   - Keep responsive breakpoints with fixed column counts (3 cols at tablet, 2 cols at mobile)
   - Keep `max-height` constraints on item types to prevent overflow

2. **Grid item overflow** (already handled in GalleryView.tsx with `overflow-hidden` on each item, no change needed)

## Technical Details

```css
.metro-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 280px));
  grid-auto-rows: 240px;
  grid-auto-flow: dense;
  gap: 16px;
}
.metro-item-square { grid-column: span 1; grid-row: span 1; max-height: 240px; }
.metro-item-wide   { grid-column: span 2; grid-row: span 1; max-height: 240px; }
.metro-item-tall   { grid-column: span 1; grid-row: span 2; max-height: 496px; }
.metro-item-large  { grid-column: span 2; grid-row: span 2; max-height: 496px; }
```

This caps each column at 280px width, so even with few images the grid cells remain compact and match the design proportions.

