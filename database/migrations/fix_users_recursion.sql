-- =====================================================
-- FIX INFINITE RECURSION IN USERS POLICIES
-- =====================================================
-- הבעיה: הפוליסות בודקות את users בתוך עצמן וזה יוצר לולאה אינסופית
-- הפתרון: להשתמש ב-auth.uid() ישירות בלי subquery על users
-- =====================================================

-- 1. מחק את כל הפוליסות הקיימות על users
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can read all users" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
DROP POLICY IF EXISTS "admins_select_all_users" ON public.users;
DROP POLICY IF EXISTS "admins_update_all_users" ON public.users;

-- 2. צור פוליסות פשוטות בלי recursion
-- משתמשים יכולים לראות את הפרופיל שלהם
CREATE POLICY "users_read_own" ON public.users
  FOR SELECT 
  USING (auth.uid() = id);

-- משתמשים יכולים לעדכן את הפרופיל שלהם
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- משתמשים יכולים ליצור את הפרופיל שלהם (הרשמה)
CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- 3. פוליסה לאדמינים - באמצעות פונקציה נפרדת
-- קודם צור פונקציה שבודקת אם המשתמש הוא אדמין
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. פוליסה לאדמינים לצפות בכל המשתמשים
-- נשתמש ב-service role במקום, או ניצור view נפרד
-- לעכשיו נשאיר רק את הפוליסות הבסיסיות

-- 5. וודא ש-RLS מופעל
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- בדיקה
-- =====================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'users';
