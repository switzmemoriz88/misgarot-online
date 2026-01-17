-- ==========================================
-- Add slug column to categories table
-- ==========================================
-- הרץ את זה ב-Supabase SQL Editor

-- Add slug column if not exists
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Update existing categories with slug based on name_en
UPDATE public.categories SET slug = LOWER(REPLACE(name_en, ' ', '-')) WHERE slug IS NULL;

-- Create unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);

-- Show results
SELECT id, name, name_en, slug FROM public.categories;
