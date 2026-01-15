-- =====================================================
-- Misgarot Online - Clients Schema
-- =====================================================
-- סכמה לניהול לקוחות של צלמים
-- הרץ את הקוד הזה ב-Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. הוספת שדות לטבלת users עבור לקוחות
-- =====================================================

-- הוספת שדה photographer_id - לאיזה צלם הלקוח שייך
ALTER TABLE users ADD COLUMN IF NOT EXISTS photographer_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- הוספת שדה event_date - תאריך האירוע
ALTER TABLE users ADD COLUMN IF NOT EXISTS event_date DATE;

-- הוספת שדה event_venue - שם האולם
ALTER TABLE users ADD COLUMN IF NOT EXISTS event_venue TEXT;

-- הוספת שדה magic_link_token - לכניסה בלי סיסמה
ALTER TABLE users ADD COLUMN IF NOT EXISTS magic_link_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS magic_link_expires_at TIMESTAMPTZ;

-- הוספת שדה preferred_language - שפה מועדפת
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'he';

-- אינדקסים
CREATE INDEX IF NOT EXISTS idx_users_photographer ON users(photographer_id);
CREATE INDEX IF NOT EXISTS idx_users_magic_link ON users(magic_link_token);

-- =====================================================
-- 2. עדכון טבלת designs - הוספת שדות ללקוחות
-- =====================================================

-- הוספת שדה client_id - לאיזה לקוח העיצוב שייך
ALTER TABLE designs ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- הוספת שדות לשני המצבים - רוחב ואורך (חובה!)
ALTER TABLE designs ADD COLUMN IF NOT EXISTS landscape_data JSONB;
ALTER TABLE designs ADD COLUMN IF NOT EXISTS portrait_data JSONB;
ALTER TABLE designs ADD COLUMN IF NOT EXISTS landscape_png_url TEXT;
ALTER TABLE designs ADD COLUMN IF NOT EXISTS portrait_png_url TEXT;

-- שדות פרטי הזוג (ממולאים בשליחה)
ALTER TABLE designs ADD COLUMN IF NOT EXISTS couple_names TEXT;
ALTER TABLE designs ADD COLUMN IF NOT EXISTS event_date DATE;
ALTER TABLE designs ADD COLUMN IF NOT EXISTS event_venue TEXT;

-- סטטוס העיצוב
ALTER TABLE designs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' 
  CHECK (status IN ('draft', 'pending_review', 'approved', 'rejected', 'sent'));

-- שדה client_name ו-client_email לתאימות לאחור
ALTER TABLE designs ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE designs ADD COLUMN IF NOT EXISTS client_email TEXT;

-- אינדקס
CREATE INDEX IF NOT EXISTS idx_designs_client ON designs(client_id);
CREATE INDEX IF NOT EXISTS idx_designs_status ON designs(status);

-- =====================================================
-- 3. טבלת client_orders - הזמנות של לקוחות
-- =====================================================

CREATE TABLE IF NOT EXISTS client_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- מזהים
  order_number TEXT UNIQUE NOT NULL,
  client_id UUID REFERENCES users(id) ON DELETE SET NULL,
  photographer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  design_id UUID REFERENCES designs(id) ON DELETE SET NULL,
  
  -- פרטי הזוג
  couple_names TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_venue TEXT NOT NULL,
  
  -- קישורים לקבצים
  landscape_png_url TEXT,
  portrait_png_url TEXT,
  
  -- סטטוס
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',      -- ממתין לאישור צלם
    'approved',     -- אושר ע"י צלם
    'rejected',     -- נדחה ע"י צלם
    'in_progress',  -- בעבודה
    'ready',        -- מוכן להדפסה
    'printed',      -- הודפס
    'delivered'     -- נמסר
  )),
  
  -- הערות
  client_notes TEXT,
  photographer_notes TEXT,
  
  -- תאריכים
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  sent_to_print_at TIMESTAMPTZ
);

-- אינדקסים
CREATE INDEX IF NOT EXISTS idx_client_orders_client ON client_orders(client_id);
CREATE INDEX IF NOT EXISTS idx_client_orders_photographer ON client_orders(photographer_id);
CREATE INDEX IF NOT EXISTS idx_client_orders_status ON client_orders(status);
CREATE INDEX IF NOT EXISTS idx_client_orders_number ON client_orders(order_number);

-- טריגר ליצירת מספר הזמנה
CREATE OR REPLACE FUNCTION generate_client_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number = 'CLT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
    LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS generate_client_order_number_trigger ON client_orders;
CREATE TRIGGER generate_client_order_number_trigger
  BEFORE INSERT ON client_orders
  FOR EACH ROW 
  WHEN (NEW.order_number IS NULL)
  EXECUTE FUNCTION generate_client_order_number();

-- טריגר לעדכון updated_at
DROP TRIGGER IF EXISTS update_client_orders_updated_at ON client_orders;
CREATE TRIGGER update_client_orders_updated_at
  BEFORE UPDATE ON client_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- 4. RLS Policies - הרשאות
-- =====================================================

-- Enable RLS
ALTER TABLE client_orders ENABLE ROW LEVEL SECURITY;

-- Policy: צלמים רואים רק הזמנות של הלקוחות שלהם
CREATE POLICY "Photographers can view their client orders"
  ON client_orders FOR SELECT
  USING (photographer_id = auth.uid());

-- Policy: לקוחות רואים רק את ההזמנות שלהם
CREATE POLICY "Clients can view their own orders"
  ON client_orders FOR SELECT
  USING (client_id = auth.uid());

-- Policy: לקוחות יכולים ליצור הזמנות
CREATE POLICY "Clients can create orders"
  ON client_orders FOR INSERT
  WITH CHECK (client_id = auth.uid());

-- Policy: צלמים יכולים לעדכן הזמנות של הלקוחות שלהם
CREATE POLICY "Photographers can update their client orders"
  ON client_orders FOR UPDATE
  USING (photographer_id = auth.uid());

-- Policy: אדמינים יכולים הכל
CREATE POLICY "Admins have full access to client_orders"
  ON client_orders FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- =====================================================
-- 5. פונקציה ליצירת Magic Link
-- =====================================================

CREATE OR REPLACE FUNCTION generate_magic_link(client_email TEXT)
RETURNS TEXT AS $$
DECLARE
  token TEXT;
  expires_at TIMESTAMPTZ;
BEGIN
  -- יצירת טוקן אקראי
  token := encode(gen_random_bytes(32), 'hex');
  expires_at := NOW() + INTERVAL '7 days';
  
  -- עדכון המשתמש
  UPDATE users 
  SET magic_link_token = token,
      magic_link_expires_at = expires_at
  WHERE email = client_email AND role = 'client';
  
  RETURN token;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. פונקציה לאימות Magic Link
-- =====================================================

CREATE OR REPLACE FUNCTION verify_magic_link(token TEXT)
RETURNS UUID AS $$
DECLARE
  user_id UUID;
BEGIN
  SELECT id INTO user_id
  FROM users
  WHERE magic_link_token = token
    AND magic_link_expires_at > NOW()
    AND role = 'client';
  
  -- נקה את הטוקן אחרי שימוש
  IF user_id IS NOT NULL THEN
    UPDATE users 
    SET magic_link_token = NULL,
        magic_link_expires_at = NULL
    WHERE id = user_id;
  END IF;
  
  RETURN user_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- סיום
-- =====================================================
-- העתק והרץ את כל הקוד הזה ב-Supabase SQL Editor
-- =====================================================
