-- ==========================================
-- Fix frames table - Add missing columns
-- ==========================================
-- הרץ את זה ב-Supabase SQL Editor

-- Add design_data column (used by the app)
ALTER TABLE public.frames 
ADD COLUMN IF NOT EXISTS design_data JSONB DEFAULT '{}';

-- Add orientation column
ALTER TABLE public.frames 
ADD COLUMN IF NOT EXISTS orientation TEXT DEFAULT 'landscape';

-- Add paired_frame_id for linking landscape/portrait
ALTER TABLE public.frames 
ADD COLUMN IF NOT EXISTS paired_frame_id UUID REFERENCES public.frames(id);

-- Add name_en column
ALTER TABLE public.frames 
ADD COLUMN IF NOT EXISTS name_en TEXT;

-- Add width and height
ALTER TABLE public.frames 
ADD COLUMN IF NOT EXISTS width INTEGER DEFAULT 2500;

ALTER TABLE public.frames 
ADD COLUMN IF NOT EXISTS height INTEGER DEFAULT 1875;

-- Add full_url and preview_url
ALTER TABLE public.frames 
ADD COLUMN IF NOT EXISTS full_url TEXT;

ALTER TABLE public.frames 
ADD COLUMN IF NOT EXISTS preview_url TEXT;

-- Add slug to categories if not exists
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Update categories slug from name_en
UPDATE public.categories 
SET slug = LOWER(REPLACE(name_en, ' ', '-')) 
WHERE slug IS NULL OR slug = '';

-- Create index on slug
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);

-- Create index on frames orientation
CREATE INDEX IF NOT EXISTS idx_frames_orientation ON public.frames(orientation);

-- Create index on frames category_id
CREATE INDEX IF NOT EXISTS idx_frames_category ON public.frames(category_id);

-- Show updated schema
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'frames' 
ORDER BY ordinal_position;

-- Show categories with slug
SELECT id, name, name_en, slug FROM public.categories ORDER BY sort_order;
