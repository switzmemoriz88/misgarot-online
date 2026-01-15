-- ==========================================
-- 🎨 ELEMENTS SCHEMA - אלמנטים גרפיים
-- ==========================================
-- טבלאות לניהול אלמנטים גרפיים (סטיקרים, לוגואים וכו')
-- ==========================================

-- ==========================================
-- 📁 ELEMENT CATEGORIES - קטגוריות אלמנטים
-- ==========================================
CREATE TABLE IF NOT EXISTS public.element_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- פרטי הקטגוריה
  name TEXT NOT NULL,           -- שם בעברית
  name_en TEXT NOT NULL,        -- שם באנגלית
  icon TEXT DEFAULT '✨',       -- אייקון
  description TEXT,             -- תיאור
  
  -- סדר וסטטוס
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  -- מטא
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 🖼️ ELEMENTS - אלמנטים גרפיים
-- ==========================================
CREATE TABLE IF NOT EXISTS public.elements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- קישור לקטגוריה
  category_id UUID REFERENCES public.element_categories(id) ON DELETE SET NULL,
  
  -- פרטי האלמנט
  name TEXT NOT NULL,           -- שם האלמנט
  name_en TEXT,                 -- שם באנגלית
  
  -- קבצים
  image_url TEXT NOT NULL,      -- URL לתמונה (PNG/SVG)
  thumbnail_url TEXT,           -- תמונה ממוזערת
  
  -- מאפיינים
  width INTEGER,                -- רוחב מקורי
  height INTEGER,               -- גובה מקורי
  file_type TEXT DEFAULT 'png', -- סוג קובץ (png, svg, webp)
  file_size INTEGER,            -- גודל בבייטים
  
  -- תגיות לחיפוש
  tags TEXT[],                  -- תגיות
  keywords TEXT,                -- מילות מפתח לחיפוש
  
  -- פרימיום
  is_premium BOOLEAN DEFAULT false,
  
  -- סטטיסטיקות
  usage_count INTEGER DEFAULT 0,
  
  -- סטטוס
  is_active BOOLEAN DEFAULT true,
  
  -- מי העלה
  uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- מטא
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 🔍 INDEXES - אינדקסים לביצועים
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_elements_category ON public.elements(category_id);
CREATE INDEX IF NOT EXISTS idx_elements_active ON public.elements(is_active);
CREATE INDEX IF NOT EXISTS idx_elements_premium ON public.elements(is_premium);
CREATE INDEX IF NOT EXISTS idx_elements_tags ON public.elements USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_element_categories_active ON public.element_categories(is_active);

-- ==========================================
-- 🔄 TRIGGER - עדכון תאריך
-- ==========================================
CREATE OR REPLACE FUNCTION update_elements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_elements_updated_at ON public.elements;
CREATE TRIGGER trigger_elements_updated_at
  BEFORE UPDATE ON public.elements
  FOR EACH ROW
  EXECUTE FUNCTION update_elements_updated_at();

DROP TRIGGER IF EXISTS trigger_element_categories_updated_at ON public.element_categories;
CREATE TRIGGER trigger_element_categories_updated_at
  BEFORE UPDATE ON public.element_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_elements_updated_at();

-- ==========================================
-- 🔐 RLS - Row Level Security
-- ==========================================
ALTER TABLE public.element_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elements ENABLE ROW LEVEL SECURITY;

-- כולם יכולים לקרוא קטגוריות פעילות
CREATE POLICY "Anyone can view active element categories"
  ON public.element_categories FOR SELECT
  USING (is_active = true);

-- כולם יכולים לקרוא אלמנטים פעילים
CREATE POLICY "Anyone can view active elements"
  ON public.elements FOR SELECT
  USING (is_active = true);

-- רק מנהלים יכולים לנהל
CREATE POLICY "Admins can manage element categories"
  ON public.element_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage elements"
  ON public.elements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- ==========================================
-- 📦 DEFAULT CATEGORIES - קטגוריות ברירת מחדל
-- ==========================================
INSERT INTO public.element_categories (name, name_en, icon, description, sort_order) VALUES
  ('פרחים', 'Flowers', '🌸', 'פרחים, עלים ואלמנטים בוטניים', 1),
  ('לבבות ואהבה', 'Hearts & Love', '❤️', 'לבבות, רומנטיקה ואהבה', 2),
  ('חתונה', 'Wedding', '💍', 'טבעות, כוסות יין, חופה ועוד', 3),
  ('חינה ומזרחי', 'Henna & Oriental', '🪔', 'עיטורים מזרחיים, חמסות, מנדלות', 4),
  ('יהדות', 'Jewish', '✡️', 'מגן דוד, חנוכיה, תורה, מזוזה', 5),
  ('ימי הולדת', 'Birthday', '🎂', 'עוגות, בלונים, קונפטי', 6),
  ('בר/בת מצווה', 'Bar/Bat Mitzvah', '📜', 'ספר תורה, כיפה, טלית', 7),
  ('ברית/בריתה', 'Brit', '👶', 'עריסה, תינוקות, כוכבים', 8),
  ('צורות וגאומטריה', 'Shapes & Geometric', '⬡', 'צורות גאומטריות, קווים, מסגרות', 9),
  ('מסגרות דקורטיביות', 'Decorative Frames', '🖼️', 'מסגרות פנימיות, גבולות', 10),
  ('טקסטורות ורקעים', 'Textures & Backgrounds', '🎨', 'טקסטורות, דוגמאות', 11),
  ('סרטים וקישוטים', 'Ribbons & Decorations', '🎀', 'סרטים, פפיונים, קישוטים', 12),
  ('כוכבים ונצנצים', 'Stars & Sparkles', '✨', 'כוכבים, נצנצים, זוהר', 13),
  ('אחר', 'Other', '📁', 'אלמנטים שונים', 99)
ON CONFLICT DO NOTHING;
