-- ==========================================
-- 🎨 MISGAROT ONLINE - Database Schema
-- ==========================================
-- Project: מערכת עיצוב מסגרות לצלמים
-- Version: 1.0.0
-- Created: December 2024
-- Author: Misgarot Online Team
-- 
-- Description:
-- סכמת מסד נתונים מלאה למערכת עיצוב מסגרות לאירועים.
-- כוללת: משתמשים, לקוחות, קטגוריות, מסגרות, עיצובים, 
-- הזמנות, מנויים ולוג מיילים.
-- ==========================================

-- ==========================================
-- 🔧 EXTENSIONS - תוספים נדרשים
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- יצירת UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";       -- הצפנה
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- חיפוש טקסט מתקדם

-- ==========================================
-- 🧹 CLEANUP - ניקוי (הפעל רק אם צריך לאפס!)
-- ==========================================
-- ⚠️ זהירות! הסר את ההערות רק אם אתה רוצה למחוק הכל!
-- DROP TABLE IF EXISTS email_logs CASCADE;
-- DROP TABLE IF EXISTS orders CASCADE;
-- DROP TABLE IF EXISTS designs CASCADE;
-- DROP TABLE IF EXISTS frames CASCADE;
-- DROP TABLE IF EXISTS categories CASCADE;
-- DROP TABLE IF EXISTS subscriptions CASCADE;
-- DROP TABLE IF EXISTS clients CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;
-- DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
-- DROP FUNCTION IF EXISTS increment_designs_count CASCADE;

-- ==========================================
-- 📊 CUSTOM TYPES - טיפוסים מותאמים
-- ==========================================
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'photographer');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE subscription_plan AS ENUM ('free', 'pro', 'business');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE design_status AS ENUM ('draft', 'completed', 'sent', 'approved');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('pending', 'processing', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE email_status AS ENUM ('pending', 'sent', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'expired', 'pending');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ==========================================
-- 👤 USERS - משתמשים (צלמים ומנהלים)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.users (
  -- Primary Key - מקושר ל-Supabase Auth
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- פרטים בסיסיים
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  
  -- פרטי עסק
  business_name TEXT,
  business_logo TEXT,
  business_address TEXT,
  
  -- הרשאות ומנוי
  role user_role DEFAULT 'photographer',
  subscription_plan subscription_plan DEFAULT 'free',
  subscription_expires_at TIMESTAMPTZ,
  
  -- סטטיסטיקות
  designs_count INTEGER DEFAULT 0 CHECK (designs_count >= 0),
  clients_count INTEGER DEFAULT 0 CHECK (clients_count >= 0),
  
  -- סטטוס
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  last_login_at TIMESTAMPTZ,
  
  -- תאריכים
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- הערות לטבלה
COMMENT ON TABLE public.users IS 'טבלת משתמשים - צלמים ומנהלי מערכת';
COMMENT ON COLUMN public.users.id IS 'מזהה ייחודי - מקושר ל-Supabase Auth';
COMMENT ON COLUMN public.users.role IS 'תפקיד: admin=מנהל מערכת, photographer=צלם';
COMMENT ON COLUMN public.users.subscription_plan IS 'סוג מנוי: free=חינמי, pro=מקצועי, business=עסקי';
COMMENT ON COLUMN public.users.designs_count IS 'מספר עיצובים שנוצרו';

-- ==========================================
-- 👥 CLIENTS - לקוחות של הצלמים
-- ==========================================
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- קשר לצלם
  photographer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- פרטי לקוח
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  
  -- פרטי אירוע
  event_type TEXT,
  event_date DATE,
  event_location TEXT,
  notes TEXT,
  
  -- סטטיסטיקות
  designs_count INTEGER DEFAULT 0 CHECK (designs_count >= 0),
  
  -- סטטוס
  is_active BOOLEAN DEFAULT true,
  
  -- תאריכים
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- בדיקת תקינות מייל
  CONSTRAINT valid_client_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

COMMENT ON TABLE public.clients IS 'לקוחות של הצלמים - בעלי האירועים';
COMMENT ON COLUMN public.clients.photographer_id IS 'הצלם שהלקוח שייך אליו';

-- ==========================================
-- 📂 CATEGORIES - קטגוריות אירועים
-- ==========================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- פרטי קטגוריה
  name TEXT NOT NULL,
  name_en TEXT NOT NULL UNIQUE,
  description TEXT,
  
  -- עיצוב
  icon TEXT,
  gradient_from TEXT DEFAULT '#6366f1',
  gradient_to TEXT DEFAULT '#8b5cf6',
  
  -- סדר ותצוגה
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  -- תאריכים
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.categories IS 'קטגוריות אירועים - חתונה, בר מצווה, וכו';
COMMENT ON COLUMN public.categories.name_en IS 'שם באנגלית - משמש כ-slug';

-- ==========================================
-- 🖼️ FRAMES - מסגרות ותבניות
-- ==========================================
CREATE TABLE IF NOT EXISTS public.frames (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- קשרים
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- פרטי מסגרת
  name TEXT NOT NULL,
  description TEXT,
  
  -- תמונות
  thumbnail_url TEXT,
  preview_landscape_url TEXT,
  preview_portrait_url TEXT,
  
  -- נתוני עיצוב (JSON)
  design_landscape JSONB DEFAULT '{}',
  design_portrait JSONB DEFAULT '{}',
  
  -- צבעים וסגנון
  colors JSONB DEFAULT '[]',
  tags TEXT[] DEFAULT '{}',
  
  -- הגדרות
  is_premium BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  
  -- סטטיסטיקות
  usage_count INTEGER DEFAULT 0 CHECK (usage_count >= 0),
  sort_order INTEGER DEFAULT 0,
  
  -- תאריכים
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.frames IS 'מסגרות ותבניות לעיצוב';
COMMENT ON COLUMN public.frames.design_landscape IS 'נתוני עיצוב רוחב בפורמט JSON';
COMMENT ON COLUMN public.frames.design_portrait IS 'נתוני עיצוב אורך בפורמט JSON';
COMMENT ON COLUMN public.frames.is_premium IS 'האם המסגרת למנויים בתשלום בלבד';
COMMENT ON COLUMN public.frames.is_featured IS 'האם להציג במסגרות מובחרות';

-- ==========================================
-- 🎨 DESIGNS - עיצובים שמורים
-- ==========================================
CREATE TABLE IF NOT EXISTS public.designs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- קשרים
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  frame_id UUID REFERENCES public.frames(id) ON DELETE SET NULL,
  
  -- פרטי עיצוב
  name TEXT NOT NULL DEFAULT 'עיצוב ללא שם',
  description TEXT,
  
  -- נתוני עיצוב (JSON)
  landscape_data JSONB DEFAULT '{}',
  portrait_data JSONB DEFAULT '{}',
  
  -- תמונות
  thumbnail_url TEXT,
  landscape_preview_url TEXT,
  portrait_preview_url TEXT,
  
  -- סטטוס
  status design_status DEFAULT 'draft',
  is_template BOOLEAN DEFAULT false,
  
  -- תאריכים
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.designs IS 'עיצובים שנוצרו על ידי המשתמשים';
COMMENT ON COLUMN public.designs.landscape_data IS 'עיצוב רוחב - כל האלמנטים בפורמט JSON';
COMMENT ON COLUMN public.designs.portrait_data IS 'עיצוב אורך - כל האלמנטים בפורמט JSON';
COMMENT ON COLUMN public.designs.is_template IS 'האם זו תבנית שניתן לשתף';

-- ==========================================
-- 📦 ORDERS - הזמנות/שליחות
-- ==========================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- קשרים
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  design_id UUID REFERENCES public.designs(id) ON DELETE SET NULL,
  
  -- פרטי מייל
  client_name TEXT,
  client_email TEXT NOT NULL,
  photographer_email TEXT NOT NULL,
  
  -- קבצים
  landscape_url TEXT,
  portrait_url TEXT,
  
  -- סטטוס
  status order_status DEFAULT 'pending',
  
  -- תאריכים
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- בדיקות תקינות
  CONSTRAINT valid_client_order_email CHECK (client_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_photographer_email CHECK (photographer_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

COMMENT ON TABLE public.orders IS 'הזמנות - שליחת עיצובים במייל';
COMMENT ON COLUMN public.orders.landscape_url IS 'קישור לקובץ PNG רוחב';
COMMENT ON COLUMN public.orders.portrait_url IS 'קישור לקובץ PNG אורך';

-- ==========================================
-- 📧 EMAIL_LOGS - לוג שליחת מיילים
-- ==========================================
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- קשר להזמנה
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  
  -- פרטי מייל
  recipient_email TEXT NOT NULL,
  recipient_type TEXT CHECK (recipient_type IN ('client', 'photographer')),
  subject TEXT,
  
  -- סטטוס
  status email_status DEFAULT 'pending',
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- תאריכים
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.email_logs IS 'לוג שליחת מיילים - למעקב ודיבוג';

-- ==========================================
-- 💳 SUBSCRIPTIONS - מנויים
-- ==========================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- קשר למשתמש
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- פרטי PayPal
  paypal_subscription_id TEXT UNIQUE,
  paypal_plan_id TEXT,
  
  -- פרטי מנוי
  plan subscription_plan NOT NULL,
  status subscription_status DEFAULT 'pending',
  
  -- מחיר
  price DECIMAL(10, 2),
  currency TEXT DEFAULT 'ILS',
  
  -- תאריכים
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.subscriptions IS 'מנויים - חיבור ל-PayPal';
COMMENT ON COLUMN public.subscriptions.paypal_subscription_id IS 'מזהה מנוי ב-PayPal';

-- ==========================================
-- 📊 INDEXES - אינדקסים לביצועים
-- ==========================================

-- Users
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_subscription ON public.users(subscription_plan);
CREATE INDEX IF NOT EXISTS idx_users_active ON public.users(is_active) WHERE is_active = true;

-- Clients
CREATE INDEX IF NOT EXISTS idx_clients_photographer ON public.clients(photographer_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_event_date ON public.clients(event_date);
CREATE INDEX IF NOT EXISTS idx_clients_active ON public.clients(is_active) WHERE is_active = true;

-- Categories
CREATE INDEX IF NOT EXISTS idx_categories_name_en ON public.categories(name_en);
CREATE INDEX IF NOT EXISTS idx_categories_sort ON public.categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_categories_active ON public.categories(is_active) WHERE is_active = true;

-- Frames
CREATE INDEX IF NOT EXISTS idx_frames_category ON public.frames(category_id);
CREATE INDEX IF NOT EXISTS idx_frames_active ON public.frames(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_frames_premium ON public.frames(is_premium);
CREATE INDEX IF NOT EXISTS idx_frames_featured ON public.frames(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_frames_sort ON public.frames(sort_order);
CREATE INDEX IF NOT EXISTS idx_frames_tags ON public.frames USING GIN(tags);

-- Designs
CREATE INDEX IF NOT EXISTS idx_designs_user ON public.designs(user_id);
CREATE INDEX IF NOT EXISTS idx_designs_client ON public.designs(client_id);
CREATE INDEX IF NOT EXISTS idx_designs_frame ON public.designs(frame_id);
CREATE INDEX IF NOT EXISTS idx_designs_status ON public.designs(status);
CREATE INDEX IF NOT EXISTS idx_designs_created ON public.designs(created_at DESC);

-- Orders
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_design ON public.orders(design_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);

-- Subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_paypal ON public.subscriptions(paypal_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires ON public.subscriptions(expires_at);

-- Email Logs
CREATE INDEX IF NOT EXISTS idx_email_logs_order ON public.email_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(status);

-- ==========================================
-- 🔄 FUNCTIONS - פונקציות
-- ==========================================

-- פונקציה לעדכון updated_at אוטומטי
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- פונקציה להגדלת מונה עיצובים
CREATE OR REPLACE FUNCTION increment_user_designs_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.users SET designs_count = designs_count + 1 WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.users SET designs_count = designs_count - 1 WHERE id = OLD.user_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- פונקציה להגדלת מונה לקוחות
CREATE OR REPLACE FUNCTION increment_user_clients_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.users SET clients_count = clients_count + 1 WHERE id = NEW.photographer_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.users SET clients_count = clients_count - 1 WHERE id = OLD.photographer_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- פונקציה להגדלת מונה שימוש במסגרת
CREATE OR REPLACE FUNCTION increment_frame_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.frame_id IS NOT NULL THEN
    UPDATE public.frames SET usage_count = usage_count + 1 WHERE id = NEW.frame_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- ⚡ TRIGGERS - טריגרים
-- ==========================================

-- עדכון updated_at אוטומטי
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clients_updated_at ON public.clients;
CREATE TRIGGER update_clients_updated_at 
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_frames_updated_at ON public.frames;
CREATE TRIGGER update_frames_updated_at 
  BEFORE UPDATE ON public.frames
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_designs_updated_at ON public.designs;
CREATE TRIGGER update_designs_updated_at 
  BEFORE UPDATE ON public.designs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at 
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at 
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- עדכון מונים אוטומטי
DROP TRIGGER IF EXISTS trigger_increment_user_designs ON public.designs;
CREATE TRIGGER trigger_increment_user_designs
  AFTER INSERT OR DELETE ON public.designs
  FOR EACH ROW EXECUTE FUNCTION increment_user_designs_count();

DROP TRIGGER IF EXISTS trigger_increment_user_clients ON public.clients;
CREATE TRIGGER trigger_increment_user_clients
  AFTER INSERT OR DELETE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION increment_user_clients_count();

DROP TRIGGER IF EXISTS trigger_increment_frame_usage ON public.designs;
CREATE TRIGGER trigger_increment_frame_usage
  AFTER INSERT ON public.designs
  FOR EACH ROW EXECUTE FUNCTION increment_frame_usage();

-- ==========================================
-- 🔐 ROW LEVEL SECURITY (RLS) - אבטחה
-- ==========================================

-- הפעלת RLS על כל הטבלאות
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frames ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 👤 USERS POLICIES
-- ==========================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ==========================================
-- 👥 CLIENTS POLICIES
-- ==========================================
DROP POLICY IF EXISTS "Photographers can view own clients" ON public.clients;
CREATE POLICY "Photographers can view own clients" ON public.clients
  FOR SELECT USING (photographer_id = auth.uid());

DROP POLICY IF EXISTS "Photographers can insert clients" ON public.clients;
CREATE POLICY "Photographers can insert clients" ON public.clients
  FOR INSERT WITH CHECK (photographer_id = auth.uid());

DROP POLICY IF EXISTS "Photographers can update own clients" ON public.clients;
CREATE POLICY "Photographers can update own clients" ON public.clients
  FOR UPDATE USING (photographer_id = auth.uid());

DROP POLICY IF EXISTS "Photographers can delete own clients" ON public.clients;
CREATE POLICY "Photographers can delete own clients" ON public.clients
  FOR DELETE USING (photographer_id = auth.uid());

-- ==========================================
-- 📂 CATEGORIES POLICIES
-- ==========================================
DROP POLICY IF EXISTS "Everyone can view active categories" ON public.categories;
CREATE POLICY "Everyone can view active categories" ON public.categories
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories" ON public.categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ==========================================
-- 🖼️ FRAMES POLICIES
-- ==========================================
DROP POLICY IF EXISTS "Everyone can view active frames" ON public.frames;
CREATE POLICY "Everyone can view active frames" ON public.frames
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage frames" ON public.frames;
CREATE POLICY "Admins can manage frames" ON public.frames
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ==========================================
-- 🎨 DESIGNS POLICIES
-- ==========================================
DROP POLICY IF EXISTS "Users can view own designs" ON public.designs;
CREATE POLICY "Users can view own designs" ON public.designs
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert designs" ON public.designs;
CREATE POLICY "Users can insert designs" ON public.designs
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own designs" ON public.designs;
CREATE POLICY "Users can update own designs" ON public.designs
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own designs" ON public.designs;
CREATE POLICY "Users can delete own designs" ON public.designs
  FOR DELETE USING (user_id = auth.uid());

-- ==========================================
-- 📦 ORDERS POLICIES
-- ==========================================
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
CREATE POLICY "Users can create orders" ON public.orders
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ==========================================
-- 💳 SUBSCRIPTIONS POLICIES
-- ==========================================
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (user_id = auth.uid());

-- ==========================================
-- 📧 EMAIL_LOGS POLICIES
-- ==========================================
DROP POLICY IF EXISTS "Users can view own email logs" ON public.email_logs;
CREATE POLICY "Users can view own email logs" ON public.email_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = email_logs.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- ==========================================
-- 📝 INSERT DEFAULT DATA - נתוני ברירת מחדל
-- ==========================================

-- קטגוריות ברירת מחדל
INSERT INTO public.categories (name, name_en, icon, gradient_from, gradient_to, sort_order) VALUES
  ('חתונה', 'wedding', '💒', '#f43f5e', '#ec4899', 1),
  ('בר מצווה', 'bar-mitzvah', '✡️', '#3b82f6', '#6366f1', 2),
  ('בת מצווה', 'bat-mitzvah', '🌸', '#ec4899', '#f472b6', 3),
  ('ברית / בריתה', 'brit', '👶', '#10b981', '#34d399', 4),
  ('יום הולדת', 'birthday', '🎂', '#f59e0b', '#fbbf24', 5),
  ('אירוע עסקי', 'business', '💼', '#6366f1', '#8b5cf6', 6),
  ('חינה / מסיבת רווקות', 'henna', '🎉', '#f97316', '#fb923c', 7),
  ('אחר', 'other', '✨', '#64748b', '#94a3b8', 99)
ON CONFLICT (name_en) DO NOTHING;

-- ==========================================
-- ✅ VERIFICATION - בדיקות
-- ==========================================

-- בדיקה שהטבלאות נוצרו
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('users', 'clients', 'categories', 'frames', 'designs', 'orders', 'email_logs', 'subscriptions');
  
  IF table_count = 8 THEN
    RAISE NOTICE '✅ All 8 tables created successfully!';
  ELSE
    RAISE WARNING '⚠️ Only % tables created. Expected 8.', table_count;
  END IF;
END $$;

-- הצגת סטטיסטיקות
SELECT 
  '✅ Schema created successfully!' as status,
  (SELECT COUNT(*) FROM public.categories) as categories_count,
  NOW() as created_at;
