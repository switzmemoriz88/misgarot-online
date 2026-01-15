-- =====================================================
-- Misgarot Online - Schema V2 - Permissions & Orders Update
-- =====================================================
-- הרץ את הקוד הזה ב-Supabase SQL Editor אחרי schema.sql
-- =====================================================

-- =====================================================
-- 1. UPDATE USERS TABLE - הוספת שדות לצלמים
-- =====================================================

-- Add star permission for photographers
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_starred BOOLEAN DEFAULT false;
-- Starred photographers can publish frames directly

-- Add photographer_id for third-party clients
ALTER TABLE users ADD COLUMN IF NOT EXISTS photographer_id UUID REFERENCES users(id) ON DELETE CASCADE;
-- Links client to their photographer

-- Add event details for clients
ALTER TABLE users ADD COLUMN IF NOT EXISTS event_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS client_name TEXT;

-- Index for finding clients of a photographer
CREATE INDEX IF NOT EXISTS idx_users_photographer ON users(photographer_id);

-- =====================================================
-- 2. FRAME_ORDERS - הזמנות מסגרות
-- =====================================================
CREATE TABLE IF NOT EXISTS frame_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  
  -- Who ordered
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  photographer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  -- If ordered by client, photographer_id is their photographer
  -- If ordered by photographer, photographer_id is null (self-order)
  
  -- Design reference
  design_id UUID REFERENCES designs(id) ON DELETE SET NULL,
  design_data JSONB, -- Snapshot of design at order time
  thumbnail_url TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',           -- כחול - ממתין
    'completed',         -- ירוק - הושלם
    'publish_requested', -- צהוב - בקשה לפרסום
    'published',         -- סגול - פורסם למאגר
    'cancelled'          -- אפור - בוטל
  )),
  
  -- Publish request details
  publish_requested_at TIMESTAMPTZ,
  publish_request_expires_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  published_by UUID REFERENCES users(id),
  
  -- Completion tracking
  completed_at TIMESTAMPTZ,
  downloaded_at TIMESTAMPTZ,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_frame_orders_user ON frame_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_frame_orders_photographer ON frame_orders(photographer_id);
CREATE INDEX IF NOT EXISTS idx_frame_orders_status ON frame_orders(status);
CREATE INDEX IF NOT EXISTS idx_frame_orders_number ON frame_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_frame_orders_publish_request ON frame_orders(status, publish_requested_at);

-- =====================================================
-- 3. GENERATE ORDER NUMBER FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION generate_frame_order_number()
RETURNS TRIGGER AS $$
DECLARE
  new_number TEXT;
  counter INTEGER;
BEGIN
  -- Get count of orders today
  SELECT COUNT(*) + 1 INTO counter
  FROM frame_orders
  WHERE DATE(created_at) = CURRENT_DATE;
  
  -- Format: FRM-YYYYMMDD-XXXX
  new_number := 'FRM-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 4, '0');
  
  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM frame_orders WHERE order_number = new_number) LOOP
    counter := counter + 1;
    new_number := 'FRM-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 4, '0');
  END LOOP;
  
  NEW.order_number := new_number;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_frame_order_number_trigger
  BEFORE INSERT ON frame_orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL)
  EXECUTE FUNCTION generate_frame_order_number();

-- =====================================================
-- 4. AUTO-EXPIRE PUBLISH REQUESTS (run daily via cron)
-- =====================================================
CREATE OR REPLACE FUNCTION expire_old_publish_requests()
RETURNS void AS $$
BEGIN
  UPDATE frame_orders
  SET 
    status = 'completed',
    publish_requested_at = NULL,
    publish_request_expires_at = NULL,
    updated_at = NOW()
  WHERE 
    status = 'publish_requested'
    AND publish_request_expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. UPDATE TRIGGER
-- =====================================================
CREATE TRIGGER update_frame_orders_updated_at
  BEFORE UPDATE ON frame_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE frame_orders ENABLE ROW LEVEL SECURITY;

-- Admin can see all orders
CREATE POLICY admin_all_frame_orders ON frame_orders
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Photographers can see their own orders and their clients' orders
CREATE POLICY photographer_frame_orders ON frame_orders
  FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR photographer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE id = frame_orders.user_id 
      AND photographer_id = auth.uid()
    )
  );

-- Clients can only see their own orders
CREATE POLICY client_own_frame_orders ON frame_orders
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- =====================================================
-- 7. USEFUL VIEWS
-- =====================================================

-- View: Orders with user details
CREATE OR REPLACE VIEW frame_orders_with_users AS
SELECT 
  fo.*,
  u.email as user_email,
  u.name as user_name,
  u.client_name,
  u.event_date,
  p.email as photographer_email,
  p.name as photographer_name,
  p.business_name as photographer_business
FROM frame_orders fo
LEFT JOIN users u ON fo.user_id = u.id
LEFT JOIN users p ON fo.photographer_id = p.id;

-- View: Pending publish requests (for admin)
CREATE OR REPLACE VIEW pending_publish_requests AS
SELECT 
  fo.*,
  u.email as requester_email,
  u.name as requester_name,
  u.is_starred as requester_is_starred
FROM frame_orders fo
JOIN users u ON fo.user_id = u.id
WHERE fo.status = 'publish_requested'
ORDER BY fo.publish_requested_at DESC;
