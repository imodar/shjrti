-- Distribute stacked tags (all at 50,50) horizontally across each photo
WITH ranked AS (
  SELECT id, memory_id,
         ROW_NUMBER() OVER (PARTITION BY memory_id ORDER BY created_at) - 1 AS idx,
         COUNT(*) OVER (PARTITION BY memory_id) AS total
  FROM photo_member_tags
  WHERE x_percent = 50 AND y_percent = 50
)
UPDATE photo_member_tags p
SET x_percent = CASE WHEN r.total = 1 THEN 50 ELSE ROUND((20 + (60.0 * r.idx) / (r.total - 1))::numeric, 2) END,
    y_percent = 85
FROM ranked r
WHERE p.id = r.id AND r.total > 1;