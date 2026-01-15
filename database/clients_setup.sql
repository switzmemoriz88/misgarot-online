-- =====================================================
-- CLIENTS SETUP - Run this in Supabase SQL Editor
-- =====================================================

-- STEP 1: Add missing columns for client management
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS photographer_id UUID REFERENCES users(id);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS event_date DATE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS event_venue TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS magic_link_token TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS magic_link_expires_at TIMESTAMPTZ;

-- STEP 2: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_photographer ON users(photographer_id);
CREATE INDEX IF NOT EXISTS idx_users_event_date ON users(event_date);

-- STEP 3: Disable RLS temporarily (or add proper policies)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- STEP 4: Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
