-- =====================================================
-- Update categories to use consistent IDs
-- הרץ את הקוד הזה ב-Supabase SQL Editor
-- =====================================================

-- First, check what categories exist
SELECT id, name, name_en FROM categories;

-- Check what frames exist and their category_id
SELECT id, name, category_id, orientation, is_active FROM frames;

-- Update frames category_id to match local category IDs
-- Map from UUID to text ID based on category name

-- Option 1: If categories table has UUID ids, update frames to use name-based IDs
-- First create categories with text IDs if they don't exist

INSERT INTO categories (id, name, name_en, icon, sort_order, is_active)
VALUES 
  ('wedding', 'חתונה', 'Wedding', '💒', 1, true),
  ('bar-mitzvah', 'בר מצווה', 'Bar Mitzvah', '✡️', 2, true),
  ('bat-mitzvah', 'בת מצווה', 'Bat Mitzvah', '🌸', 3, true),
  ('brit', 'ברית / בריתה', 'Brit / Baby Naming', '👶', 4, true),
  ('birthday', 'יום הולדת', 'Birthday', '🎂', 5, true),
  ('business', 'אירוע עסקי', 'Business Events', '💼', 6, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  icon = EXCLUDED.icon,
  is_active = true;

-- Now update existing frames to use these category IDs
-- Update frames where category_id matches 'חתונה' category
UPDATE frames 
SET category_id = 'wedding'
WHERE category_id IN (
  SELECT id FROM categories WHERE name = 'חתונה' OR name_en = 'Wedding'
);

-- Verify the update
SELECT f.id, f.name, f.category_id, c.name as category_name 
FROM frames f
LEFT JOIN categories c ON f.category_id = c.id;
