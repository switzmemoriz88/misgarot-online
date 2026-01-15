-- בדיקת המסגרות שיש ב-Supabase
-- הרץ את זה ב-SQL Editor של Supabase

-- הצג את כל המסגרות
SELECT 
  id,
  name,
  orientation,
  paired_frame_id,
  category_id,
  is_active,
  created_at
FROM frames
ORDER BY created_at DESC;

-- הצג רק מסגרות רוחב (אלה שיוצגו בגלריה)
SELECT 
  id,
  name,
  orientation,
  paired_frame_id
FROM frames
WHERE orientation = 'landscape' AND is_active = true;

-- הצג רק מסגרות אורך
SELECT 
  id,
  name,
  orientation,
  paired_frame_id
FROM frames
WHERE orientation = 'portrait' AND is_active = true;

-- תיקון: קשר בין מסגרות אורך ורוחב
-- אם יש מסגרות לא מקושרות, הרץ את זה:
-- 
-- UPDATE frames 
-- SET paired_frame_id = '<portrait_frame_id>'
-- WHERE id = '<landscape_frame_id>';
--
-- UPDATE frames 
-- SET paired_frame_id = '<landscape_frame_id>'
-- WHERE id = '<portrait_frame_id>';
