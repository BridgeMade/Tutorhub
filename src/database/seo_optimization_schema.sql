-- ===========================================
-- SEO OPTIMIZATION SCHEMA
-- ===========================================
-- Database schema for SEO management, analytics, and optimization

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- SEO PAGE CONFIGURATIONS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS seo_page_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Page Information
    page_path VARCHAR(500) NOT NULL,
    page_type VARCHAR(50) NOT NULL CHECK (page_type IN (
        'landing', 'product', 'blog', 'profile', 'search', 'dynamic'
    )),
    
    -- Meta Tags (stored as JSONB for flexibility)
    meta_tags JSONB NOT NULL DEFAULT '{}',
    
    -- SEO Settings
    is_active BOOLEAN DEFAULT true,
    priority DECIMAL(2,1) DEFAULT 0.5 CHECK (priority >= 0.0 AND priority <= 1.0),
    change_freq VARCHAR(20) DEFAULT 'monthly' CHECK (change_freq IN (
        'always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'
    )),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_modified TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(tenant_id, page_path),
    
    -- Ensure meta_tags contains required fields
    CHECK (
        meta_tags ? 'title' AND 
        meta_tags ? 'description' AND 
        meta_tags ? 'keywords'
    )
);

-- Create indexes for SEO page configs
CREATE INDEX IF NOT EXISTS idx_seo_page_configs_tenant ON seo_page_configs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_seo_page_configs_path ON seo_page_configs(page_path);
CREATE INDEX IF NOT EXISTS idx_seo_page_configs_type ON seo_page_configs(page_type);
CREATE INDEX IF NOT EXISTS idx_seo_page_configs_active ON seo_page_configs(is_active);
CREATE INDEX IF NOT EXISTS idx_seo_page_configs_priority ON seo_page_configs(priority);

-- GIN index for JSONB meta_tags searches
CREATE INDEX IF NOT EXISTS idx_seo_page_configs_meta_tags ON seo_page_configs USING GIN (meta_tags);

-- ===========================================
-- SEO SITEMAPS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS seo_sitemaps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Sitemap Content
    sitemap_xml TEXT NOT NULL,
    sitemap_urls_count INTEGER DEFAULT 0,
    
    -- Generation Info
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    last_accessed TIMESTAMPTZ,
    access_count INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    file_size_bytes INTEGER,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(tenant_id),
    CHECK (sitemap_urls_count >= 0),
    CHECK (file_size_bytes >= 0)
);

-- Create indexes for sitemaps
CREATE INDEX IF NOT EXISTS idx_seo_sitemaps_tenant ON seo_sitemaps(tenant_id);
CREATE INDEX IF NOT EXISTS idx_seo_sitemaps_generated ON seo_sitemaps(generated_at);
CREATE INDEX IF NOT EXISTS idx_seo_sitemaps_active ON seo_sitemaps(is_active);

-- ===========================================
-- SEO ANALYTICS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS seo_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Page Information
    page_url TEXT NOT NULL,
    page_title TEXT,
    
    -- User Information
    user_agent TEXT,
    ip_address INET,
    referer TEXT,
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    utm_term VARCHAR(100),
    utm_content VARCHAR(100),
    
    -- Location Data
    country VARCHAR(100),
    region VARCHAR(100),
    city VARCHAR(100),
    
    -- Device Information
    device_type VARCHAR(50), -- 'desktop', 'mobile', 'tablet'
    browser VARCHAR(100),
    os VARCHAR(100),
    
    -- SEO Metrics
    is_bot BOOLEAN DEFAULT false,
    bot_name VARCHAR(100),
    
    -- Timestamps
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    session_id UUID,
    
    -- Constraints
    CHECK (device_type IN ('desktop', 'mobile', 'tablet', 'unknown') OR device_type IS NULL)
);

-- Create indexes for SEO analytics
CREATE INDEX IF NOT EXISTS idx_seo_analytics_tenant ON seo_analytics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_seo_analytics_page_url ON seo_analytics(page_url);
CREATE INDEX IF NOT EXISTS idx_seo_analytics_viewed_at ON seo_analytics(viewed_at);
CREATE INDEX IF NOT EXISTS idx_seo_analytics_country ON seo_analytics(country);
CREATE INDEX IF NOT EXISTS idx_seo_analytics_device ON seo_analytics(device_type);
CREATE INDEX IF NOT EXISTS idx_seo_analytics_bot ON seo_analytics(is_bot);
CREATE INDEX IF NOT EXISTS idx_seo_analytics_utm_source ON seo_analytics(utm_source);

-- ===========================================
-- SEO KEYWORDS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS seo_keywords (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Keyword Information
    keyword TEXT NOT NULL,
    search_volume INTEGER DEFAULT 0,
    competition_level VARCHAR(20) DEFAULT 'medium' CHECK (competition_level IN ('low', 'medium', 'high')),
    difficulty_score INTEGER CHECK (difficulty_score >= 0 AND difficulty_score <= 100),
    
    -- Tracking Information
    target_page_path VARCHAR(500),
    current_position INTEGER,
    best_position INTEGER,
    
    -- Performance Metrics
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    ctr DECIMAL(5,2) DEFAULT 0.0,
    
    -- Status
    is_target_keyword BOOLEAN DEFAULT false,
    is_tracking BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_position_check TIMESTAMPTZ,
    
    -- Constraints
    UNIQUE(tenant_id, keyword),
    CHECK (current_position > 0 OR current_position IS NULL),
    CHECK (best_position > 0 OR best_position IS NULL),
    CHECK (ctr >= 0.0 AND ctr <= 100.0)
);

-- Create indexes for SEO keywords
CREATE INDEX IF NOT EXISTS idx_seo_keywords_tenant ON seo_keywords(tenant_id);
CREATE INDEX IF NOT EXISTS idx_seo_keywords_keyword ON seo_keywords(keyword);
CREATE INDEX IF NOT EXISTS idx_seo_keywords_target ON seo_keywords(is_target_keyword);
CREATE INDEX IF NOT EXISTS idx_seo_keywords_tracking ON seo_keywords(is_tracking);
CREATE INDEX IF NOT EXISTS idx_seo_keywords_position ON seo_keywords(current_position);
CREATE INDEX IF NOT EXISTS idx_seo_keywords_volume ON seo_keywords(search_volume);

-- ===========================================
-- SEO REDIRECTS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS seo_redirects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Redirect Configuration
    source_path VARCHAR(500) NOT NULL,
    destination_path VARCHAR(500) NOT NULL,
    redirect_type INTEGER DEFAULT 301 CHECK (redirect_type IN (301, 302, 307, 308)),
    
    -- Metadata
    reason TEXT,
    notes TEXT,
    
    -- Usage Statistics
    hit_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMPTZ,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(tenant_id, source_path),
    CHECK (source_path != destination_path),
    CHECK (hit_count >= 0)
);

-- Create indexes for redirects
CREATE INDEX IF NOT EXISTS idx_seo_redirects_tenant ON seo_redirects(tenant_id);
CREATE INDEX IF NOT EXISTS idx_seo_redirects_source ON seo_redirects(source_path);
CREATE INDEX IF NOT EXISTS idx_seo_redirects_active ON seo_redirects(is_active);
CREATE INDEX IF NOT EXISTS idx_seo_redirects_type ON seo_redirects(redirect_type);

-- ===========================================
-- SEO AUDIT RESULTS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS seo_audit_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Audit Information
    audit_type VARCHAR(50) NOT NULL, -- 'page', 'site', 'technical', 'content'
    page_path VARCHAR(500),
    
    -- Results
    overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
    issues JSONB DEFAULT '[]',
    recommendations JSONB DEFAULT '[]',
    technical_details JSONB DEFAULT '{}',
    
    -- Performance Metrics
    load_time_ms INTEGER,
    page_size_bytes INTEGER,
    requests_count INTEGER,
    
    -- SEO Factors
    title_length INTEGER,
    description_length INTEGER,
    h1_count INTEGER,
    images_without_alt INTEGER,
    internal_links_count INTEGER,
    external_links_count INTEGER,
    
    -- Status
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    
    -- Timestamps
    audit_started_at TIMESTAMPTZ DEFAULT NOW(),
    audit_completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CHECK (
        (audit_type = 'page' AND page_path IS NOT NULL) OR 
        (audit_type != 'page')
    )
);

-- Create indexes for audit results
CREATE INDEX IF NOT EXISTS idx_seo_audit_results_tenant ON seo_audit_results(tenant_id);
CREATE INDEX IF NOT EXISTS idx_seo_audit_results_type ON seo_audit_results(audit_type);
CREATE INDEX IF NOT EXISTS idx_seo_audit_results_page ON seo_audit_results(page_path);
CREATE INDEX IF NOT EXISTS idx_seo_audit_results_score ON seo_audit_results(overall_score);
CREATE INDEX IF NOT EXISTS idx_seo_audit_results_status ON seo_audit_results(status);
CREATE INDEX IF NOT EXISTS idx_seo_audit_results_completed ON seo_audit_results(audit_completed_at);

-- GIN indexes for JSONB fields
CREATE INDEX IF NOT EXISTS idx_seo_audit_results_issues ON seo_audit_results USING GIN (issues);
CREATE INDEX IF NOT EXISTS idx_seo_audit_results_recommendations ON seo_audit_results USING GIN (recommendations);

-- ===========================================
-- DATABASE FUNCTIONS FOR SEO
-- ===========================================

-- Function to update sitemap access statistics
CREATE OR REPLACE FUNCTION update_sitemap_access(p_tenant_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE seo_sitemaps 
    SET 
        access_count = access_count + 1,
        last_accessed = NOW(),
        updated_at = NOW()
    WHERE tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get SEO analytics summary
CREATE OR REPLACE FUNCTION get_seo_analytics_summary(
    p_tenant_id UUID,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    total_page_views BIGINT,
    unique_visitors BIGINT,
    top_pages JSONB,
    top_referrers JSONB,
    device_breakdown JSONB,
    country_breakdown JSONB
) AS $$
DECLARE
    start_date TIMESTAMPTZ;
BEGIN
    start_date := NOW() - INTERVAL '1 day' * p_days;
    
    RETURN QUERY
    WITH page_views AS (
        SELECT COUNT(*) as total_views, COUNT(DISTINCT ip_address) as unique_ips
        FROM seo_analytics 
        WHERE tenant_id = p_tenant_id AND viewed_at >= start_date
    ),
    top_pages_data AS (
        SELECT 
            jsonb_agg(
                jsonb_build_object('page', page_url, 'views', view_count)
                ORDER BY view_count DESC
            ) FILTER (WHERE rank <= 10) as top_pages_json
        FROM (
            SELECT page_url, COUNT(*) as view_count, 
                   ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) as rank
            FROM seo_analytics 
            WHERE tenant_id = p_tenant_id AND viewed_at >= start_date
            GROUP BY page_url
        ) ranked_pages
    ),
    top_referrers_data AS (
        SELECT 
            jsonb_agg(
                jsonb_build_object('referrer', referer, 'visits', visit_count)
                ORDER BY visit_count DESC
            ) FILTER (WHERE rank <= 10 AND referer IS NOT NULL) as top_referrers_json
        FROM (
            SELECT referer, COUNT(*) as visit_count,
                   ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) as rank
            FROM seo_analytics 
            WHERE tenant_id = p_tenant_id AND viewed_at >= start_date AND referer IS NOT NULL
            GROUP BY referer
        ) ranked_referrers
    ),
    device_data AS (
        SELECT 
            jsonb_object_agg(
                COALESCE(device_type, 'unknown'), 
                device_count
            ) as device_breakdown_json
        FROM (
            SELECT device_type, COUNT(*) as device_count
            FROM seo_analytics 
            WHERE tenant_id = p_tenant_id AND viewed_at >= start_date
            GROUP BY device_type
        ) device_counts
    ),
    country_data AS (
        SELECT 
            jsonb_agg(
                jsonb_build_object('country', country, 'visits', country_count)
                ORDER BY country_count DESC
            ) FILTER (WHERE rank <= 10 AND country IS NOT NULL) as country_breakdown_json
        FROM (
            SELECT country, COUNT(*) as country_count,
                   ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) as rank
            FROM seo_analytics 
            WHERE tenant_id = p_tenant_id AND viewed_at >= start_date AND country IS NOT NULL
            GROUP BY country
        ) ranked_countries
    )
    SELECT 
        pv.total_views,
        pv.unique_ips,
        COALESCE(tp.top_pages_json, '[]'::jsonb),
        COALESCE(tr.top_referrers_json, '[]'::jsonb),
        COALESCE(dd.device_breakdown_json, '{}'::jsonb),
        COALESCE(cd.country_breakdown_json, '[]'::jsonb)
    FROM page_views pv
    CROSS JOIN top_pages_data tp
    CROSS JOIN top_referrers_data tr  
    CROSS JOIN device_data dd
    CROSS JOIN country_data cd;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate robots.txt content
CREATE OR REPLACE FUNCTION generate_robots_txt(p_tenant_id UUID)
RETURNS TEXT AS $$
DECLARE
    base_url TEXT;
    robots_content TEXT;
BEGIN
    -- Get tenant base URL
    SELECT 
        CASE 
            WHEN custom_domain IS NOT NULL THEN 'https://' || custom_domain
            WHEN subdomain IS NOT NULL THEN 'https://' || subdomain || '.tutorkai.com'
            ELSE 'https://' || slug || '.tutorkai.com'
        END
    INTO base_url
    FROM tenants 
    WHERE id = p_tenant_id;
    
    -- Generate robots.txt content
    robots_content := 'User-agent: *' || chr(10) ||
                     'Allow: /' || chr(10) ||
                     'Disallow: /admin/' || chr(10) ||
                     'Disallow: /api/' || chr(10) ||
                     'Disallow: /private/' || chr(10) ||
                     chr(10) ||
                     'Sitemap: ' || base_url || '/sitemap.xml' || chr(10);
    
    RETURN robots_content;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean old analytics data
CREATE OR REPLACE FUNCTION cleanup_old_seo_analytics()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete analytics data older than 2 years
    DELETE FROM seo_analytics 
    WHERE viewed_at < NOW() - INTERVAL '2 years';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- ROW LEVEL SECURITY POLICIES
-- ===========================================

-- Enable RLS on all SEO tables
ALTER TABLE seo_page_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_sitemaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_redirects ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_audit_results ENABLE ROW LEVEL SECURITY;

-- SEO page configs policies
CREATE POLICY "Users can view their tenant's SEO configs" ON seo_page_configs
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM user_tenant_roles WHERE user_id = auth.uid()
        ) OR tenant_id IS NULL
    );

CREATE POLICY "Admin users can manage SEO configs" ON seo_page_configs
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM user_tenant_roles 
            WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
        ) OR tenant_id IS NULL
    );

-- SEO sitemaps policies (read-only for most users)
CREATE POLICY "Users can view sitemaps" ON seo_sitemaps
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM user_tenant_roles WHERE user_id = auth.uid()
        ) OR tenant_id IS NULL
    );

CREATE POLICY "Admin users can manage sitemaps" ON seo_sitemaps
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM user_tenant_roles 
            WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
        ) OR tenant_id IS NULL
    );

-- SEO analytics policies (admin only)
CREATE POLICY "Admin users can view SEO analytics" ON seo_analytics
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM user_tenant_roles 
            WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
        ) OR tenant_id IS NULL
    );

-- Public insert for analytics tracking (no auth required)
CREATE POLICY "Allow public analytics tracking" ON seo_analytics
    FOR INSERT WITH CHECK (true);

-- SEO keywords policies
CREATE POLICY "Admin users can manage keywords" ON seo_keywords
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM user_tenant_roles 
            WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
        ) OR tenant_id IS NULL
    );

-- SEO redirects policies
CREATE POLICY "Users can view redirects" ON seo_redirects
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM user_tenant_roles WHERE user_id = auth.uid()
        ) OR tenant_id IS NULL
    );

CREATE POLICY "Admin users can manage redirects" ON seo_redirects
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM user_tenant_roles 
            WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
        ) OR tenant_id IS NULL
    );

-- SEO audit results policies
CREATE POLICY "Admin users can view audit results" ON seo_audit_results
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM user_tenant_roles 
            WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
        ) OR tenant_id IS NULL
    );

-- ===========================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ===========================================

-- Function to update sitemap when page configs change
CREATE OR REPLACE FUNCTION trigger_sitemap_regeneration()
RETURNS TRIGGER AS $$
BEGIN
    -- Mark sitemap for regeneration by updating timestamp
    UPDATE seo_sitemaps 
    SET updated_at = NOW()
    WHERE tenant_id = COALESCE(NEW.tenant_id, OLD.tenant_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for sitemap regeneration
CREATE TRIGGER seo_configs_changed
    AFTER INSERT OR UPDATE OR DELETE ON seo_page_configs
    FOR EACH ROW EXECUTE FUNCTION trigger_sitemap_regeneration();

-- Function to update last_modified timestamp
CREATE OR REPLACE FUNCTION update_seo_modified_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.last_modified = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating timestamps
CREATE TRIGGER update_seo_page_configs_timestamp
    BEFORE UPDATE ON seo_page_configs
    FOR EACH ROW EXECUTE FUNCTION update_seo_modified_timestamp();

-- ===========================================
-- SAMPLE DATA FOR PLATFORM PAGES
-- ===========================================

-- Insert default SEO configs for main TutorKai platform pages
INSERT INTO seo_page_configs (tenant_id, page_path, page_type, meta_tags, priority, change_freq) VALUES
(NULL, '/', 'landing', jsonb_build_object(
    'title', 'TutorKai - The Future of Tutoring Business Management',
    'description', 'Revolutionary multi-tenant SaaS platform for tutoring businesses. Manage students, sessions, payments, and grow your tutoring business with TutorKai.',
    'keywords', ARRAY['tutoring software', 'tutor management system', 'tutoring business', 'education SaaS', 'student management'],
    'ogTitle', 'TutorKai - Revolutionize Your Tutoring Business',
    'ogDescription', 'The most advanced tutoring business management platform. Multi-tenant, customizable, and built for growth.',
    'ogType', 'website',
    'schema', jsonb_build_object(
        '@context', 'https://schema.org',
        '@type', 'SoftwareApplication',
        'name', 'TutorKai',
        'description', 'Multi-tenant SaaS platform for tutoring business management',
        'applicationCategory', 'EducationalApplication',
        'operatingSystem', 'Web Browser'
    )
), 1.0, 'monthly'),

(NULL, '/pricing', 'product', jsonb_build_object(
    'title', 'TutorKai Pricing - Choose Your Plan',
    'description', 'Flexible pricing plans for tutoring businesses of all sizes. Start with our Starter plan or go Enterprise for advanced features.',
    'keywords', ARRAY['tutoring software pricing', 'tutor management pricing', 'education SaaS cost', 'tutoring platform plans'],
    'ogTitle', 'TutorKai Pricing Plans - Find Your Perfect Fit',
    'ogDescription', 'Transparent pricing for tutoring businesses. From Starter to Enterprise, find the plan that grows with you.'
), 0.9, 'monthly'),

(NULL, '/features', 'product', jsonb_build_object(
    'title', 'TutorKai Features - Complete Tutoring Business Solution',
    'description', 'Discover TutorKai''s powerful features: student management, session scheduling, payment processing, custom branding, and more.',
    'keywords', ARRAY['tutoring features', 'student management', 'session scheduling', 'payment processing', 'custom branding'],
    'ogTitle', 'TutorKai Features - Everything You Need to Succeed',
    'ogDescription', 'Comprehensive feature set designed for modern tutoring businesses. See how TutorKai can transform your operations.'
), 0.8, 'monthly')

ON CONFLICT (tenant_id, page_path) DO NOTHING;

-- ===========================================
-- COMMENTS AND DOCUMENTATION
-- ===========================================

COMMENT ON SCHEMA public IS 'TutorKai SEO Optimization Schema - Complete SEO management system';
COMMENT ON TABLE seo_page_configs IS 'SEO configuration for individual pages with meta tags and settings';
COMMENT ON TABLE seo_sitemaps IS 'Generated XML sitemaps for search engine indexing';
COMMENT ON TABLE seo_analytics IS 'Page view analytics and SEO performance tracking';
COMMENT ON TABLE seo_keywords IS 'Keyword tracking and ranking management';
COMMENT ON TABLE seo_redirects IS 'URL redirects for SEO and user experience';
COMMENT ON TABLE seo_audit_results IS 'SEO audit results and recommendations';