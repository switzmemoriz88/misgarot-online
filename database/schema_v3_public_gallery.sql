-- =====================================================
-- Misgarot Online - Schema V3 - Public Gallery
-- =====================================================
-- הרץ את הקוד הזה אחרי schema_v2_permissions.sql
-- =====================================================

-- =====================================================
-- 1. PUBLIC_FRAMES - מסגרות בגלריה הציבורית
-- =====================================================
CREATE TABLE IF NOT EXISTS public_frames (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Source reference
  order_id UUID REFERENCES frame_orders(id) ON DELETE SET NULL,
  original_creator_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Frame data
  name TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  full_image_url TEXT,
  design_data JSONB,
  
  -- Category info (for browsing)
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  
  -- Creator info (displayed on frame)
  creator_name TEXT,
  creator_business TEXT,
  show_creator_credit BOOLEAN DEFAULT true,
  
  -- Publishing details
  published_by UUID REFERENCES users(id), -- Admin who approved
  published_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- 6 months from publish for user-submitted
  
  -- Statistics
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_public_frames_category ON public_frames(category_id);
CREATE INDEX IF NOT EXISTS idx_public_frames_creator ON public_frames(original_creator_id);
CREATE INDEX IF NOT EXISTS idx_public_frames_active ON public_frames(is_active);
CREATE INDEX IF NOT EXISTS idx_public_frames_featured ON public_frames(is_featured);
CREATE INDEX IF NOT EXISTS idx_public_frames_expires ON public_frames(expires_at);
CREATE INDEX IF NOT EXISTS idx_public_frames_tags ON public_frames USING GIN(tags);

-- =====================================================
-- 2. UPDATE TRIGGER
-- =====================================================
CREATE TRIGGER update_public_frames_updated_at
  BEFORE UPDATE ON public_frames
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- 3. ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public_frames ENABLE ROW LEVEL SECURITY;

-- Everyone can view active public frames
CREATE POLICY public_frames_view ON public_frames
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Only admins can manage public frames
CREATE POLICY admin_manage_public_frames ON public_frames
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Starred photographers can insert directly
CREATE POLICY starred_photographer_publish ON public_frames
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND (role = 'admin' OR is_starred = true)
    )
  );

-- =====================================================
-- 4. FUNCTION: Publish frame from order
-- =====================================================
CREATE OR REPLACE FUNCTION publish_frame_from_order(
  p_order_id UUID,
  p_category_id UUID DEFAULT NULL,
  p_name TEXT DEFAULT NULL,
  p_tags TEXT[] DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_order frame_orders%ROWTYPE;
  v_user users%ROWTYPE;
  v_public_frame_id UUID;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Get order
  SELECT * INTO v_order FROM frame_orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
  
  -- Get user
  SELECT * INTO v_user FROM users WHERE id = v_order.user_id;
  
  -- Calculate expiration (6 months for user-submitted)
  IF v_user.role != 'admin' THEN
    v_expires_at := NOW() + INTERVAL '6 months';
  END IF;
  
  -- Create public frame
  INSERT INTO public_frames (
    order_id,
    original_creator_id,
    name,
    thumbnail_url,
    design_data,
    category_id,
    tags,
    creator_name,
    creator_business,
    published_by,
    expires_at
  ) VALUES (
    p_order_id,
    v_order.user_id,
    COALESCE(p_name, 'מסגרת ' || v_order.order_number),
    v_order.thumbnail_url,
    v_order.design_data,
    p_category_id,
    p_tags,
    v_user.name,
    v_user.business_name,
    auth.uid(),
    v_expires_at
  )
  RETURNING id INTO v_public_frame_id;
  
  -- Update order status
  UPDATE frame_orders 
  SET 
    status = 'published',
    published_at = NOW(),
    published_by = auth.uid()
  WHERE id = p_order_id;
  
  RETURN v_public_frame_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. FUNCTION: Clean expired public frames (run daily)
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_expired_public_frames()
RETURNS void AS $$
BEGIN
  UPDATE public_frames
  SET is_active = false
  WHERE expires_at < NOW() AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. VIEW: Public frames for gallery
-- =====================================================
CREATE OR REPLACE VIEW public_gallery AS
SELECT 
  pf.*,
  c.name as category_name,
  c.slug as category_slug
FROM public_frames pf
LEFT JOIN categories c ON pf.category_id = c.id
WHERE pf.is_active = true
  AND (pf.expires_at IS NULL OR pf.expires_at > NOW())
ORDER BY pf.is_featured DESC, pf.display_order, pf.published_at DESC;

