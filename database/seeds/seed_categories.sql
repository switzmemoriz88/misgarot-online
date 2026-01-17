-- ==========================================
-- 📁 Seed Categories - קטגוריות ברירת מחדל
-- ==========================================
-- הרץ את הסקריפט הזה ב-Supabase SQL Editor
-- ==========================================

-- מחק קטגוריות קיימות (אופציונלי)
-- DELETE FROM categories;

-- הוסף קטגוריות חדשות
INSERT INTO categories (name, name_en, icon, sort_order, is_active) VALUES
  ('חתונה', 'Wedding', '💍', 1, true),
  ('חינה', 'Henna', '🎉', 2, true),
  ('בר מצווה', 'Bar Mitzvah', '✡️', 3, true),
  ('בת מצווה', 'Bat Mitzvah', '🌸', 4, true),
  ('ברית', 'Brit', '👶', 5, true),
  ('בריתה', 'Brit Bat', '🎀', 6, true),
  ('יום הולדת', 'Birthday', '🎂', 7, true),
  ('אירועים עסקיים', 'Business Events', '💼', 8, true),
  ('חגים', 'Holidays', '🕎', 9, true),
  ('אחר', 'Other', '📁', 10, true)
ON CONFLICT (name) DO UPDATE SET
  name_en = EXCLUDED.name_en,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

-- הצג את הקטגוריות שנוספו
SELECT * FROM categories ORDER BY sort_order;
