-- =====================================================
-- FIX RLS SECURITY - תיקון בעיות אבטחה
-- =====================================================
-- הרץ את הקוד הזה ב-Supabase SQL Editor
-- Settings → SQL Editor → New Query
-- =====================================================

-- =====================================================
-- 1. ENABLE RLS ON ALL TABLES
-- =====================================================

-- Enable RLS on users table (CRITICAL!)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Enable RLS on all other tables
ALTER TABLE public.designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Categories and frames are public read, but still need RLS enabled
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frames ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. VERIFY EXISTING POLICIES ON USERS
-- =====================================================

-- Drop duplicate/conflicting policies if exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can read all users" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;

-- =====================================================
-- 3. CREATE CLEAN USERS POLICIES
-- =====================================================

-- Users can view their own profile
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT 
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert their own profile (for registration)
CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "admins_select_all_users" ON public.users
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update all users
CREATE POLICY "admins_update_all_users" ON public.users
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- 4. DESIGNS POLICIES (Clean up and recreate)
-- =====================================================

DROP POLICY IF EXISTS "Users can view own designs" ON public.designs;
DROP POLICY IF EXISTS "Users can create designs" ON public.designs;
DROP POLICY IF EXISTS "Users can update own designs" ON public.designs;
DROP POLICY IF EXISTS "Users can delete own designs" ON public.designs;

-- Users can view their own designs or public ones
CREATE POLICY "designs_select" ON public.designs
  FOR SELECT 
  USING (auth.uid() = user_id OR is_public = true);

-- Users can insert their own designs
CREATE POLICY "designs_insert" ON public.designs
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own designs
CREATE POLICY "designs_update" ON public.designs
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Users can delete their own designs
CREATE POLICY "designs_delete" ON public.designs
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Admins can manage all designs
CREATE POLICY "admins_all_designs" ON public.designs
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- 5. ORDERS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;

-- Users can view their own orders
CREATE POLICY "orders_select_own" ON public.orders
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can create orders
CREATE POLICY "orders_insert" ON public.orders
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Admins can manage all orders
CREATE POLICY "admins_all_orders" ON public.orders
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- 6. ORDER ITEMS POLICIES
-- =====================================================

-- Users can view their own order items (via order ownership)
CREATE POLICY "order_items_select" ON public.order_items
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- Admins can manage all order items
CREATE POLICY "admins_all_order_items" ON public.order_items
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- 7. CATEGORIES POLICIES (Public Read)
-- =====================================================

DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;

-- Anyone can view categories (including anonymous)
CREATE POLICY "categories_public_read" ON public.categories
  FOR SELECT 
  USING (true);

-- Only admins can manage categories
CREATE POLICY "admins_manage_categories" ON public.categories
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- 8. FRAMES POLICIES (Public Read for active)
-- =====================================================

DROP POLICY IF EXISTS "Anyone can view active frames" ON public.frames;

-- Anyone can view active frames
CREATE POLICY "frames_public_read" ON public.frames
  FOR SELECT 
  USING (is_active = true);

-- Only admins can manage frames
CREATE POLICY "admins_manage_frames" ON public.frames
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- 9. SUBSCRIPTIONS POLICIES
-- =====================================================

-- Users can view their own subscription
CREATE POLICY "subscriptions_select_own" ON public.subscriptions
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Admins can manage all subscriptions
CREATE POLICY "admins_all_subscriptions" ON public.subscriptions
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- 10. VERIFY RLS IS ENABLED
-- =====================================================

-- Check all tables have RLS enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- =====================================================
-- ✅ Security Fix Complete!
-- =====================================================
-- After running this script, go back to the Supabase
-- Dashboard → Database → Database Linter and verify
-- there are no more security warnings.
-- =====================================================
