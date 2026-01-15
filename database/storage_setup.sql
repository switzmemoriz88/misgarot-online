-- ==========================================
-- 🗄️ MISGAROT ONLINE - Storage Buckets Setup
-- ==========================================
-- הרץ את הסקריפט הזה ב-Supabase SQL Editor
-- לאחר יצירת הסכמה הראשית
-- ==========================================

-- ==========================================
-- 📦 CREATE STORAGE BUCKETS
-- ==========================================

-- יצירת Buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('frames', 'frames', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp']),
  ('designs', 'designs', false, 10485760, ARRAY['image/png']),
  ('exports', 'exports', true, 10485760, ARRAY['image/png']),
  ('avatars', 'avatars', true, 2097152, ARRAY['image/png', 'image/jpeg', 'image/webp']),
  ('logos', 'logos', true, 4194304, ARRAY['image/png', 'image/svg+xml'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ==========================================
-- 🔐 STORAGE POLICIES
-- ==========================================

-- ==========================================
-- 📁 FRAMES BUCKET POLICIES (Public Read)
-- ==========================================

-- כולם יכולים לראות מסגרות
DROP POLICY IF EXISTS "Public can view frames" ON storage.objects;
CREATE POLICY "Public can view frames"
ON storage.objects FOR SELECT
USING (bucket_id = 'frames');

-- רק מנהלים יכולים להעלות מסגרות
DROP POLICY IF EXISTS "Admins can upload frames" ON storage.objects;
CREATE POLICY "Admins can upload frames"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'frames' AND
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- רק מנהלים יכולים למחוק מסגרות
DROP POLICY IF EXISTS "Admins can delete frames" ON storage.objects;
CREATE POLICY "Admins can delete frames"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'frames' AND
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ==========================================
-- 📁 DESIGNS BUCKET POLICIES (Private)
-- ==========================================

-- משתמשים יכולים לראות רק את העיצובים שלהם
DROP POLICY IF EXISTS "Users can view own designs" ON storage.objects;
CREATE POLICY "Users can view own designs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'designs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- משתמשים יכולים להעלות לתיקייה שלהם
DROP POLICY IF EXISTS "Users can upload own designs" ON storage.objects;
CREATE POLICY "Users can upload own designs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'designs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- משתמשים יכולים למחוק את העיצובים שלהם
DROP POLICY IF EXISTS "Users can delete own designs" ON storage.objects;
CREATE POLICY "Users can delete own designs"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'designs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ==========================================
-- 📁 EXPORTS BUCKET POLICIES (Public Read)
-- ==========================================

-- כולם יכולים לראות exports (עיצובים שנשלחו)
DROP POLICY IF EXISTS "Public can view exports" ON storage.objects;
CREATE POLICY "Public can view exports"
ON storage.objects FOR SELECT
USING (bucket_id = 'exports');

-- משתמשים מחוברים יכולים להעלות
DROP POLICY IF EXISTS "Users can upload exports" ON storage.objects;
CREATE POLICY "Users can upload exports"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'exports' AND
  auth.role() = 'authenticated'
);

-- ==========================================
-- 📁 AVATARS BUCKET POLICIES
-- ==========================================

-- כולם יכולים לראות תמונות פרופיל
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- משתמשים יכולים להעלות רק לתיקייה שלהם
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- משתמשים יכולים לעדכן רק את התמונה שלהם
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- משתמשים יכולים למחוק רק את התמונה שלהם
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ==========================================
-- 📁 LOGOS BUCKET POLICIES
-- ==========================================

-- כולם יכולים לראות לוגואים
DROP POLICY IF EXISTS "Public can view logos" ON storage.objects;
CREATE POLICY "Public can view logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'logos');

-- משתמשים יכולים להעלות לוגו לתיקייה שלהם
DROP POLICY IF EXISTS "Users can upload own logo" ON storage.objects;
CREATE POLICY "Users can upload own logo"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'logos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- משתמשים יכולים למחוק את הלוגו שלהם
DROP POLICY IF EXISTS "Users can delete own logo" ON storage.objects;
CREATE POLICY "Users can delete own logo"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'logos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ==========================================
-- ✅ VERIFICATION
-- ==========================================
SELECT 
  id as bucket_name,
  public,
  file_size_limit / 1024 / 1024 as max_size_mb,
  allowed_mime_types
FROM storage.buckets
WHERE id IN ('frames', 'designs', 'exports', 'avatars', 'logos');
