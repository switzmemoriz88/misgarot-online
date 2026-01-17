-- =====================================================
-- Add missing columns to frames table
-- הרץ את הקוד הזה ב-Supabase SQL Editor
-- =====================================================

-- Add design_data column for storing frame design
ALTER TABLE frames 
ADD COLUMN IF NOT EXISTS design_data JSONB;

-- Add name_en column for English name
ALTER TABLE frames 
ADD COLUMN IF NOT EXISTS name_en TEXT;

-- Add width and height columns
ALTER TABLE frames 
ADD COLUMN IF NOT EXISTS width INTEGER DEFAULT 2500;

ALTER TABLE frames 
ADD COLUMN IF NOT EXISTS height INTEGER DEFAULT 1875;

-- Add orientation column
ALTER TABLE frames 
ADD COLUMN IF NOT EXISTS orientation TEXT DEFAULT 'landscape' 
CHECK (orientation IN ('landscape', 'portrait'));

-- Add paired_frame_id for linking landscape/portrait versions
ALTER TABLE frames 
ADD COLUMN IF NOT EXISTS paired_frame_id UUID REFERENCES frames(id);

-- Add full_url and preview_url columns
ALTER TABLE frames 
ADD COLUMN IF NOT EXISTS full_url TEXT;

ALTER TABLE frames 
ADD COLUMN IF NOT EXISTS preview_url TEXT;

-- Add usage_count for tracking popularity
ALTER TABLE frames 
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;

-- Update categories table if name column is missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'name'
  ) THEN
    ALTER TABLE categories ADD COLUMN name TEXT;
    UPDATE categories SET name = name_he WHERE name IS NULL;
  END IF;
END $$;

-- Verify changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'frames'
ORDER BY ordinal_position;
