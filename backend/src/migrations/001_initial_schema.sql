-- ==========================================
-- סכמה ראשונית - Misgarot Online
-- ==========================================

-- קטגוריות
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_he VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    icon VARCHAR(255),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- משתמשים
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'photographer', 'client')),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    preferred_language VARCHAR(2) DEFAULT 'he',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP
);

-- צלמים (הרחבה של משתמשים)
CREATE TABLE IF NOT EXISTS photographers (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255),
    subscription_status VARCHAR(20) DEFAULT 'trial' 
        CHECK (subscription_status IN ('trial', 'active', 'expired', 'cancelled')),
    trial_ends_at TIMESTAMP,
    subscription_ends_at TIMESTAMP,
    plan VARCHAR(50)
);

-- לקוחות (של צלמים)
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    photographer_id UUID NOT NULL REFERENCES photographers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    event_date DATE,
    event_venue VARCHAR(255),
    design_status VARCHAR(20) DEFAULT 'open' 
        CHECK (design_status IN ('open', 'in_progress', 'submitted', 'archived')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- תבניות מסגרות
CREATE TABLE IF NOT EXISTS frame_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_he VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    orientation VARCHAR(10) NOT NULL CHECK (orientation IN ('width', 'height')),
    pixel_width INTEGER NOT NULL,
    pixel_height INTEGER NOT NULL,
    category_id UUID REFERENCES categories(id),
    base_background_image VARCHAR(500),
    initial_elements_json JSONB DEFAULT '[]',
    paired_template_id UUID REFERENCES frame_templates(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- נכסים (תמונות, אלמנטים)
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(20) NOT NULL CHECK (type IN ('library', 'uploaded', 'background')),
    name VARCHAR(255),
    file_key VARCHAR(500) NOT NULL,
    mime_type VARCHAR(50),
    file_size INTEGER,
    width INTEGER,
    height INTEGER,
    category VARCHAR(100),
    tags TEXT[],
    uploaded_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- עיצובים
CREATE TABLE IF NOT EXISTS designs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES frame_templates(id),
    orientation VARCHAR(10) NOT NULL CHECK (orientation IN ('width', 'height')),
    status VARCHAR(20) DEFAULT 'open' 
        CHECK (status IN ('open', 'in_progress', 'submitted', 'archived')),
    elements_json JSONB DEFAULT '[]',
    is_locked BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP
);

-- אינדקסים
CREATE INDEX IF NOT EXISTS idx_clients_photographer ON clients(photographer_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(design_status);
CREATE INDEX IF NOT EXISTS idx_designs_client ON designs(client_id);
CREATE INDEX IF NOT EXISTS idx_designs_status ON designs(status);
CREATE INDEX IF NOT EXISTS idx_frame_templates_category ON frame_templates(category_id);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(type);

-- הוספת קטגוריות ברירת מחדל
INSERT INTO categories (name_he, name_en, slug, sort_order) VALUES
    ('חתונה', 'Wedding', 'wedding', 1),
    ('בר/בת מצווה', 'Bar/Bat Mitzvah', 'bar-bat-mitzvah', 2),
    ('ברית', 'Brit', 'brit', 3),
    ('יום הולדת', 'Birthday', 'birthday', 4),
    ('חגים', 'Holidays', 'holidays', 5),
    ('אירועים עסקיים', 'Business Events', 'business', 6)
ON CONFLICT (slug) DO NOTHING;
