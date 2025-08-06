-- ===========================================
-- MULTI-TENANT BRANDING SCHEMA FOR SAAS
-- ===========================================
-- This schema supports white-label branding for multiple tenant organizations

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- TENANTS TABLE (Organizations using the platform)
-- ===========================================

CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic tenant information
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL, -- URL-friendly identifier
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'trial')),
    subscription_tier VARCHAR(50) DEFAULT 'starter' CHECK (subscription_tier IN ('starter', 'professional', 'enterprise')),
    
    -- Contact information
    admin_email VARCHAR(255) NOT NULL,
    admin_phone VARCHAR(50),
    billing_email VARCHAR(255),
    
    -- Business details
    business_type VARCHAR(100),
    industry VARCHAR(100) DEFAULT 'education',
    company_size VARCHAR(50),
    country VARCHAR(100),
    timezone VARCHAR(100) DEFAULT 'Africa/Johannesburg',
    
    -- Technical settings
    custom_domain VARCHAR(255) UNIQUE,
    subdomain VARCHAR(100) UNIQUE, -- tenant.platform.com
    api_key VARCHAR(255) UNIQUE,
    webhook_url TEXT,
    
    -- Subscription details
    trial_ends_at TIMESTAMPTZ,
    subscription_starts_at TIMESTAMPTZ,
    subscription_ends_at TIMESTAMPTZ,
    max_users INTEGER DEFAULT 10,
    max_tutors INTEGER DEFAULT 5,
    max_students INTEGER DEFAULT 100,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_custom_domain ON tenants(custom_domain);
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain);

-- ===========================================
-- TENANT BRANDING CONFIGURATION
-- ===========================================

CREATE TABLE IF NOT EXISTS tenant_branding (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Company branding
    company_name VARCHAR(255) NOT NULL,
    company_tagline VARCHAR(500),
    company_description TEXT,
    website_url TEXT,
    
    -- Logo assets
    logo_url TEXT, -- Primary logo
    logo_dark_url TEXT, -- Logo for dark backgrounds
    logo_light_url TEXT, -- Logo for light backgrounds
    logo_icon_url TEXT, -- Icon/favicon
    logo_wordmark_url TEXT, -- Text-only version
    favicon_url TEXT,
    
    -- Color scheme (hex colors)
    primary_color VARCHAR(7) DEFAULT '#2563eb',
    secondary_color VARCHAR(7) DEFAULT '#64748b',
    accent_color VARCHAR(7) DEFAULT '#059669',
    success_color VARCHAR(7) DEFAULT '#10b981',
    warning_color VARCHAR(7) DEFAULT '#f59e0b',
    error_color VARCHAR(7) DEFAULT '#ef4444',
    info_color VARCHAR(7) DEFAULT '#3b82f6',
    
    -- Background and text colors
    background_color VARCHAR(7) DEFAULT '#ffffff',
    surface_color VARCHAR(7) DEFAULT '#f8fafc',
    text_primary_color VARCHAR(7) DEFAULT '#0f172a',
    text_secondary_color VARCHAR(7) DEFAULT '#64748b',
    border_color VARCHAR(7) DEFAULT '#e2e8f0',
    
    -- Typography
    primary_font VARCHAR(100) DEFAULT 'Inter',
    secondary_font VARCHAR(100) DEFAULT 'Inter',
    font_source VARCHAR(20) DEFAULT 'google' CHECK (font_source IN ('google', 'system', 'custom')),
    
    -- Custom styling
    custom_css TEXT,
    custom_js TEXT,
    
    -- Contact information displayed to end users
    support_email VARCHAR(255),
    support_phone VARCHAR(50),
    support_hours VARCHAR(200),
    contact_address TEXT,
    
    -- Social media links
    social_facebook TEXT,
    social_twitter TEXT,
    social_linkedin TEXT,
    social_instagram TEXT,
    social_youtube TEXT,
    
    -- Legal pages
    terms_url TEXT,
    privacy_url TEXT,
    cookie_policy_url TEXT,
    
    -- Email branding
    email_from_name VARCHAR(255),
    email_from_address VARCHAR(255),
    email_reply_to VARCHAR(255),
    email_footer_text TEXT,
    
    -- Advanced settings
    show_platform_branding BOOLEAN DEFAULT true,
    allow_custom_css BOOLEAN DEFAULT false,
    allow_custom_js BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint to ensure one branding config per tenant
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_branding_tenant ON tenant_branding(tenant_id);

-- ===========================================
-- BRANDING THEMES (Pre-built templates)
-- ===========================================

CREATE TABLE IF NOT EXISTS branding_themes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Theme information
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50), -- 'professional', 'modern', 'academic', 'creative'
    preview_image_url TEXT,
    is_premium BOOLEAN DEFAULT false,
    
    -- Theme configuration (JSON)
    theme_config JSONB NOT NULL,
    
    -- Usage tracking
    usage_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- TENANT THEME SELECTIONS
-- ===========================================

CREATE TABLE IF NOT EXISTS tenant_themes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    theme_id UUID NOT NULL REFERENCES branding_themes(id) ON DELETE CASCADE,
    
    -- Custom overrides on top of theme
    custom_overrides JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- BRANDING ASSETS (File management)
-- ===========================================

CREATE TABLE IF NOT EXISTS branding_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Asset information
    asset_type VARCHAR(50) NOT NULL, -- 'logo', 'favicon', 'background', 'icon'
    asset_variant VARCHAR(50), -- 'primary', 'dark', 'light', 'icon'
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255),
    file_path TEXT NOT NULL,
    file_url TEXT NOT NULL,
    
    -- File metadata
    file_size BIGINT,
    mime_type VARCHAR(100),
    width INTEGER,
    height INTEGER,
    
    -- Usage tracking
    is_active BOOLEAN DEFAULT true,
    usage_context VARCHAR(100), -- 'header', 'footer', 'email', 'favicon'
    
    -- Timestamps
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for asset management
CREATE INDEX IF NOT EXISTS idx_branding_assets_tenant ON branding_assets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_branding_assets_type ON branding_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_branding_assets_active ON branding_assets(is_active);

-- ===========================================
-- TENANT SETTINGS (Additional configuration)
-- ===========================================

CREATE TABLE IF NOT EXISTS tenant_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Feature flags
    features JSONB DEFAULT '{}',
    
    -- Business settings
    business_hours JSONB DEFAULT '{}', -- Operating hours by day
    booking_settings JSONB DEFAULT '{}', -- Booking rules and preferences
    notification_settings JSONB DEFAULT '{}', -- Email/SMS preferences
    payment_settings JSONB DEFAULT '{}', -- Payment gateway configuration
    
    -- Localization
    default_language VARCHAR(10) DEFAULT 'en',
    supported_languages TEXT[] DEFAULT ARRAY['en'],
    currency VARCHAR(3) DEFAULT 'ZAR',
    date_format VARCHAR(20) DEFAULT 'YYYY-MM-DD',
    time_format VARCHAR(10) DEFAULT '24h',
    
    -- Integration settings
    integrations JSONB DEFAULT '{}', -- Third-party service configurations
    api_settings JSONB DEFAULT '{}', -- API access and rate limits
    webhook_settings JSONB DEFAULT '{}', -- Webhook configurations
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- BRANDING ANALYTICS
-- ===========================================

CREATE TABLE IF NOT EXISTS branding_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Event tracking
    event_type VARCHAR(50) NOT NULL, -- 'theme_applied', 'logo_changed', 'color_updated'
    event_data JSONB DEFAULT '{}',
    
    -- Context
    user_id UUID, -- Who made the change
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- FUNCTIONS FOR TENANT MANAGEMENT
-- ===========================================

-- Function to create a new tenant with default branding
CREATE OR REPLACE FUNCTION create_tenant_with_branding(
    p_name VARCHAR(255),
    p_slug VARCHAR(100),
    p_admin_email VARCHAR(255),
    p_company_name VARCHAR(255) DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    tenant_id UUID;
    branding_id UUID;
BEGIN
    -- Create tenant
    INSERT INTO tenants (name, slug, admin_email)
    VALUES (p_name, p_slug, p_admin_email)
    RETURNING id INTO tenant_id;
    
    -- Create default branding
    INSERT INTO tenant_branding (tenant_id, company_name)
    VALUES (tenant_id, COALESCE(p_company_name, p_name))
    RETURNING id INTO branding_id;
    
    -- Create default settings
    INSERT INTO tenant_settings (tenant_id)
    VALUES (tenant_id);
    
    -- Log creation event
    INSERT INTO branding_analytics (tenant_id, event_type, event_data)
    VALUES (tenant_id, 'tenant_created', jsonb_build_object('branding_id', branding_id));
    
    RETURN tenant_id;
END;
$$;

-- Function to get tenant branding by domain
CREATE OR REPLACE FUNCTION get_tenant_by_domain(domain_name TEXT)
RETURNS TABLE (
    tenant_id UUID,
    tenant_name VARCHAR(255),
    tenant_slug VARCHAR(100),
    branding_config JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id as tenant_id,
        t.name as tenant_name,
        t.slug as tenant_slug,
        jsonb_build_object(
            'company_name', tb.company_name,
            'logo_url', tb.logo_url,
            'primary_color', tb.primary_color,
            'secondary_color', tb.secondary_color,
            'custom_css', tb.custom_css
        ) as branding_config
    FROM tenants t
    LEFT JOIN tenant_branding tb ON t.id = tb.tenant_id
    WHERE t.custom_domain = domain_name 
       OR t.subdomain || '.platform.com' = domain_name
       OR t.slug = split_part(domain_name, '.', 1);
END;
$$;

-- ===========================================
-- TRIGGERS FOR AUTOMATIC MAINTENANCE
-- ===========================================

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Apply triggers
DROP TRIGGER IF EXISTS tenants_updated_at ON tenants;
CREATE TRIGGER tenants_updated_at 
    BEFORE UPDATE ON tenants 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS tenant_branding_updated_at ON tenant_branding;
CREATE TRIGGER tenant_branding_updated_at 
    BEFORE UPDATE ON tenant_branding 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS tenant_settings_updated_at ON tenant_settings;
CREATE TRIGGER tenant_settings_updated_at 
    BEFORE UPDATE ON tenant_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- ROW LEVEL SECURITY (RLS)
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE branding_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE branding_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE branding_analytics ENABLE ROW LEVEL SECURITY;

-- Platform admin policies (full access)
CREATE POLICY "Platform admins can manage all tenants" ON tenants
    FOR ALL USING (
        auth.role() = 'authenticated' 
        AND auth.jwt() ->> 'user_role' = 'platform_admin'
    );

-- Tenant admin policies (access to their own tenant)
CREATE POLICY "Tenant admins can manage their tenant" ON tenants
    FOR ALL USING (
        auth.role() = 'authenticated' 
        AND (
            auth.jwt() ->> 'tenant_id' = id::text
            AND auth.jwt() ->> 'user_role' IN ('tenant_admin', 'tenant_owner')
        )
    );

CREATE POLICY "Tenant users can access their branding" ON tenant_branding
    FOR SELECT USING (
        auth.role() = 'authenticated' 
        AND auth.jwt() ->> 'tenant_id' = tenant_id::text
    );

CREATE POLICY "Tenant admins can manage their branding" ON tenant_branding
    FOR ALL USING (
        auth.role() = 'authenticated' 
        AND (
            auth.jwt() ->> 'tenant_id' = tenant_id::text
            AND auth.jwt() ->> 'user_role' IN ('tenant_admin', 'tenant_owner')
        )
    );

-- Public access to themes
CREATE POLICY "Authenticated users can view themes" ON branding_themes
    FOR SELECT USING (auth.role() = 'authenticated');

-- ===========================================
-- SAMPLE DATA FOR TESTING
-- ===========================================

-- Insert default branding themes
INSERT INTO branding_themes (name, description, category, theme_config) VALUES
(
    'Professional Blue',
    'Clean and professional theme with blue accents',
    'professional',
    '{
        "primary_color": "#2563eb",
        "secondary_color": "#64748b",
        "accent_color": "#3b82f6",
        "background_color": "#ffffff",
        "text_primary_color": "#0f172a",
        "primary_font": "Inter"
    }'::jsonb
),
(
    'Modern Orange',
    'Modern and vibrant theme with orange highlights',
    'modern',
    '{
        "primary_color": "#ea580c",
        "secondary_color": "#6b7280",
        "accent_color": "#f97316",
        "background_color": "#ffffff",
        "text_primary_color": "#111827",
        "primary_font": "Inter"
    }'::jsonb
),
(
    'Academic Green',
    'Traditional academic theme with green accents',
    'academic',
    '{
        "primary_color": "#059669",
        "secondary_color": "#6b7280",
        "accent_color": "#10b981",
        "background_color": "#f9fafb",
        "text_primary_color": "#111827",
        "primary_font": "Georgia"
    }'::jsonb
);

-- ===========================================
-- COMMENTS AND DOCUMENTATION
-- ===========================================

COMMENT ON TABLE tenants IS 'Organizations using the SaaS platform';
COMMENT ON TABLE tenant_branding IS 'White-label branding configuration for each tenant';
COMMENT ON TABLE branding_themes IS 'Pre-built branding themes for quick setup';
COMMENT ON TABLE tenant_themes IS 'Applied themes with custom overrides';
COMMENT ON TABLE branding_assets IS 'Uploaded branding assets (logos, images, etc.)';
COMMENT ON TABLE tenant_settings IS 'Additional configuration settings per tenant';
COMMENT ON TABLE branding_analytics IS 'Analytics and tracking for branding changes';

COMMENT ON FUNCTION create_tenant_with_branding IS 'Creates a new tenant with default branding configuration';
COMMENT ON FUNCTION get_tenant_by_domain IS 'Retrieves tenant and branding information by domain name';