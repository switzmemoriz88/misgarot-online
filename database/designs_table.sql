-- ==========================================
-- טבלת designs - שמירת עיצובים שנשלחו
-- ==========================================

-- Create designs table
CREATE TABLE IF NOT EXISTS designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Client info
  client_name TEXT NOT NULL,
  client_email TEXT,
  
  -- Design data
  landscape_data JSONB,
  portrait_data JSONB,
  
  -- PNG URLs (stored in storage)
  landscape_png_url TEXT,
  portrait_png_url TEXT,
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'approved', 'printed', 'archived')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  
  -- Notes
  notes TEXT
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_designs_user_id ON designs(user_id);
CREATE INDEX IF NOT EXISTS idx_designs_status ON designs(status);
CREATE INDEX IF NOT EXISTS idx_designs_created_at ON designs(created_at DESC);

-- Enable RLS
ALTER TABLE designs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own designs
CREATE POLICY "Users can view own designs"
  ON designs FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own designs
CREATE POLICY "Users can insert own designs"
  ON designs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own designs
CREATE POLICY "Users can update own designs"
  ON designs FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own designs
CREATE POLICY "Users can delete own designs"
  ON designs FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can see all designs
CREATE POLICY "Admins can view all designs"
  ON designs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_designs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER designs_updated_at
  BEFORE UPDATE ON designs
  FOR EACH ROW
  EXECUTE FUNCTION update_designs_updated_at();

-- ==========================================
-- Storage bucket for design PNGs
-- ==========================================
-- Run in Supabase Dashboard > Storage:
-- 1. Create bucket: design-exports
-- 2. Make it public or add policies as needed
