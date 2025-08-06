-- ===========================================
-- DATA PRIVACY COMPLIANCE SCHEMA
-- ===========================================
-- Supports GDPR, POPI, CCPA and other privacy regulations

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- PRIVACY SETTINGS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS privacy_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Regulation Compliance Flags
    gdpr_enabled BOOLEAN DEFAULT true,
    popi_enabled BOOLEAN DEFAULT true,
    ccpa_enabled BOOLEAN DEFAULT false,
    
    -- Data Retention Policies
    data_retention_default_months INTEGER DEFAULT 24,
    automatic_data_deletion BOOLEAN DEFAULT true,
    
    -- Consent Management
    consent_banner_enabled BOOLEAN DEFAULT true,
    consent_banner_text TEXT DEFAULT 'We use cookies and collect data to improve your experience.',
    consent_withdrawal_enabled BOOLEAN DEFAULT true,
    
    -- Privacy Documentation
    privacy_policy_url TEXT,
    cookie_policy_url TEXT,
    data_protection_officer_email VARCHAR(255),
    
    -- Data Subject Rights
    data_portability_enabled BOOLEAN DEFAULT true,
    data_processing_log_enabled BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(tenant_id),
    CHECK (data_retention_default_months > 0),
    CHECK (data_protection_officer_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR data_protection_officer_email IS NULL)
);

-- ===========================================
-- CONSENT RECORDS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS consent_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Consent Details
    consent_type VARCHAR(50) NOT NULL CHECK (consent_type IN (
        'marketing', 'analytics', 'functional', 'performance', 
        'necessary', 'data_processing', 'communication', 'profiling', 'third_party_sharing'
    )),
    consent_given BOOLEAN NOT NULL,
    consent_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    withdrawal_date TIMESTAMPTZ,
    
    -- Legal and Technical Details
    legal_basis VARCHAR(100),
    purpose TEXT NOT NULL,
    data_categories TEXT[] DEFAULT '{}',
    retention_period_months INTEGER,
    
    -- Audit Trail
    ip_address INET NOT NULL,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for consent records
CREATE INDEX IF NOT EXISTS idx_consent_records_user_tenant ON consent_records(user_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_consent_records_type ON consent_records(consent_type);
CREATE INDEX IF NOT EXISTS idx_consent_records_date ON consent_records(consent_date);
CREATE INDEX IF NOT EXISTS idx_consent_records_active ON consent_records(is_active);

-- ===========================================
-- DATA PROCESSING ACTIVITIES TABLE (GDPR Article 30)
-- ===========================================

CREATE TABLE IF NOT EXISTS data_processing_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Activity Details
    activity_name VARCHAR(255) NOT NULL,
    purpose TEXT NOT NULL,
    legal_basis VARCHAR(50) NOT NULL CHECK (legal_basis IN (
        'consent', 'contract', 'legal_obligation', 'vital_interests', 'public_task', 'legitimate_interests'
    )),
    
    -- Data Categories and Subjects
    data_categories TEXT[] NOT NULL,
    data_subjects TEXT[] NOT NULL, -- e.g., 'students', 'tutors', 'parents'
    recipients TEXT[] DEFAULT '{}', -- Who receives the data
    
    -- International Transfers
    third_country_transfers BOOLEAN DEFAULT false,
    
    -- Data Retention
    retention_period_months INTEGER NOT NULL,
    
    -- Security Measures
    security_measures TEXT[] DEFAULT '{}',
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CHECK (retention_period_months > 0)
);

-- Create indexes for processing activities
CREATE INDEX IF NOT EXISTS idx_processing_activities_tenant ON data_processing_activities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_processing_activities_legal_basis ON data_processing_activities(legal_basis);
CREATE INDEX IF NOT EXISTS idx_processing_activities_active ON data_processing_activities(is_active);

-- ===========================================
-- DATA SUBJECT REQUESTS TABLE (GDPR Articles 15-22)
-- ===========================================

CREATE TABLE IF NOT EXISTS data_subject_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Request Details
    request_type VARCHAR(50) NOT NULL CHECK (request_type IN (
        'access', 'rectification', 'erasure', 'restriction', 'portability', 'objection'
    )),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending', 'in_progress', 'completed', 'rejected'
    )),
    
    -- Request Content
    request_details TEXT NOT NULL,
    response_data JSONB,
    rejection_reason TEXT,
    
    -- Dates and Deadlines
    request_date TIMESTAMPTZ DEFAULT NOW(),
    completion_date TIMESTAMPTZ,
    deadline_date TIMESTAMPTZ NOT NULL, -- Usually 30 days from request
    
    -- Follow-up
    follow_up_required BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for data subject requests
CREATE INDEX IF NOT EXISTS idx_data_subject_requests_user ON data_subject_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_data_subject_requests_tenant ON data_subject_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_data_subject_requests_type ON data_subject_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_data_subject_requests_status ON data_subject_requests(status);
CREATE INDEX IF NOT EXISTS idx_data_subject_requests_deadline ON data_subject_requests(deadline_date);

-- ===========================================
-- DATA DELETION SCHEDULE TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS data_deletion_schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Deletion Details
    data_category VARCHAR(100) NOT NULL,
    scheduled_deletion_date TIMESTAMPTZ NOT NULL,
    executed_at TIMESTAMPTZ,
    
    -- Status
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN (
        'scheduled', 'completed', 'failed', 'cancelled'
    )),
    error_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for deletion schedule
CREATE INDEX IF NOT EXISTS idx_deletion_schedule_user ON data_deletion_schedule(user_id);
CREATE INDEX IF NOT EXISTS idx_deletion_schedule_tenant ON data_deletion_schedule(tenant_id);
CREATE INDEX IF NOT EXISTS idx_deletion_schedule_date ON data_deletion_schedule(scheduled_deletion_date);
CREATE INDEX IF NOT EXISTS idx_deletion_schedule_status ON data_deletion_schedule(status);

-- ===========================================
-- DATA INVENTORY TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS data_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Data Classification
    data_category VARCHAR(100) NOT NULL,
    data_fields TEXT[] NOT NULL,
    storage_location VARCHAR(255) NOT NULL,
    
    -- Legal Basis and Purpose
    purpose TEXT NOT NULL,
    legal_basis VARCHAR(50) NOT NULL,
    retention_period_months INTEGER NOT NULL,
    
    -- Security and Access
    is_encrypted BOOLEAN DEFAULT false,
    access_controls TEXT[] DEFAULT '{}',
    third_party_access BOOLEAN DEFAULT false,
    
    -- Audit Information
    last_audit_date TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CHECK (retention_period_months > 0)
);

-- Create indexes for data inventory
CREATE INDEX IF NOT EXISTS idx_data_inventory_tenant ON data_inventory(tenant_id);
CREATE INDEX IF NOT EXISTS idx_data_inventory_category ON data_inventory(data_category);
CREATE INDEX IF NOT EXISTS idx_data_inventory_encrypted ON data_inventory(is_encrypted);

-- ===========================================
-- PRIVACY IMPACT ASSESSMENTS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS privacy_impact_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Assessment Details
    activity_name VARCHAR(255) NOT NULL,
    data_categories TEXT[] NOT NULL,
    risk_factors TEXT[] NOT NULL,
    mitigation_measures TEXT[] NOT NULL,
    
    -- Legal Tests
    necessity_test TEXT NOT NULL,
    proportionality_test TEXT NOT NULL,
    
    -- Status and Review
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN (
        'draft', 'under_review', 'approved', 'rejected', 'requires_revision'
    )),
    review_date TIMESTAMPTZ,
    next_review_date TIMESTAMPTZ,
    
    -- Approvals
    approved_by UUID,
    approval_date TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for privacy impact assessments
CREATE INDEX IF NOT EXISTS idx_pia_tenant ON privacy_impact_assessments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pia_status ON privacy_impact_assessments(status);
CREATE INDEX IF NOT EXISTS idx_pia_review_date ON privacy_impact_assessments(next_review_date);

-- ===========================================
-- PRIVACY AUDIT LOG TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS privacy_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Event Details
    event_type VARCHAR(100) NOT NULL,
    event_description TEXT NOT NULL,
    affected_user_id UUID,
    
    -- Legal and Compliance Context
    regulation VARCHAR(20), -- 'GDPR', 'POPI', 'CCPA', etc.
    legal_basis VARCHAR(100),
    data_categories TEXT[],
    
    -- Technical Details
    ip_address INET,
    user_agent TEXT,
    
    -- Results and Impact
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for audit log
CREATE INDEX IF NOT EXISTS idx_audit_log_tenant ON privacy_audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_event_type ON privacy_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON privacy_audit_log(affected_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_regulation ON privacy_audit_log(regulation);
CREATE INDEX IF NOT EXISTS idx_audit_log_date ON privacy_audit_log(created_at);

-- ===========================================
-- PLATFORM SETTINGS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS platform_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    
    -- Platform Identity
    platform_name VARCHAR(100) DEFAULT 'TutorKai',
    platform_tagline TEXT DEFAULT 'The Future of Tutoring Business Management',
    
    -- Contact Information
    support_email VARCHAR(255),
    sales_email VARCHAR(255),
    
    -- URLs
    main_website_url TEXT,
    documentation_url TEXT,
    status_page_url TEXT,
    terms_of_service_url TEXT,
    privacy_policy_url TEXT,
    
    -- Platform Features
    marketing_enabled BOOLEAN DEFAULT true,
    analytics_enabled BOOLEAN DEFAULT true,
    maintenance_mode BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure only one row
    CHECK (id = 1)
);

-- Insert default platform settings
INSERT INTO platform_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

-- ===========================================
-- DATABASE FUNCTIONS FOR PRIVACY COMPLIANCE
-- ===========================================

-- Function to get platform metrics
CREATE OR REPLACE FUNCTION get_platform_metrics()
RETURNS TABLE (
    total_tenants BIGINT,
    active_tenants BIGINT,
    total_revenue NUMERIC,
    average_sessions_per_tenant NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM tenants)::BIGINT as total_tenants,
        (SELECT COUNT(*) FROM tenants WHERE status = 'active')::BIGINT as active_tenants,
        0::NUMERIC as total_revenue, -- Would integrate with billing system
        0::NUMERIC as average_sessions_per_tenant; -- Would calculate from sessions
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create tenant with subscription
CREATE OR REPLACE FUNCTION create_tenant_with_subscription(
    p_name TEXT,
    p_slug TEXT,
    p_admin_email TEXT,
    p_subscription_tier TEXT DEFAULT 'starter',
    p_company_name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_tenant_id UUID;
BEGIN
    -- Create tenant
    INSERT INTO tenants (
        name,
        slug,
        admin_email,
        subscription_tier,
        status,
        created_at
    ) VALUES (
        p_name,
        p_slug,
        p_admin_email,
        p_subscription_tier,
        'active',
        NOW()
    ) RETURNING id INTO new_tenant_id;
    
    -- Create default privacy settings
    INSERT INTO privacy_settings (tenant_id, created_at)
    VALUES (new_tenant_id, NOW());
    
    -- Create default tenant branding
    INSERT INTO tenant_branding (
        tenant_id,
        company_name,
        primary_color,
        secondary_color,
        accent_color,
        created_at
    ) VALUES (
        new_tenant_id,
        COALESCE(p_company_name, p_name),
        '#6366f1', -- TutorKai primary color
        '#64748b',
        '#8b5cf6',
        NOW()
    );
    
    RETURN new_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to audit data retention compliance
CREATE OR REPLACE FUNCTION audit_data_retention_compliance(p_tenant_id UUID)
RETURNS TABLE (
    data_category TEXT,
    records_count BIGINT,
    oldest_record_date TIMESTAMPTZ,
    retention_period_months INTEGER,
    compliance_status TEXT
) AS $$
BEGIN
    -- This would be implemented based on actual data tables
    -- For now, return a placeholder structure
    RETURN QUERY
    SELECT 
        'user_profiles'::TEXT,
        0::BIGINT,
        NOW()::TIMESTAMPTZ,
        24::INTEGER,
        'compliant'::TEXT
    WHERE FALSE; -- No actual data for now
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- ROW LEVEL SECURITY POLICIES
-- ===========================================

-- Enable RLS on all privacy tables
ALTER TABLE privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_processing_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_subject_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_deletion_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_impact_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_audit_log ENABLE ROW LEVEL SECURITY;

-- Privacy settings policies
CREATE POLICY "Users can view their tenant's privacy settings" ON privacy_settings
    FOR SELECT USING (tenant_id IN (
        SELECT tenant_id FROM user_tenant_roles WHERE user_id = auth.uid()
    ));

CREATE POLICY "Admin users can manage privacy settings" ON privacy_settings
    FOR ALL USING (tenant_id IN (
        SELECT tenant_id FROM user_tenant_roles 
        WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    ));

-- Consent records policies
CREATE POLICY "Users can view their own consent records" ON consent_records
    FOR SELECT USING (
        user_id = auth.uid() OR 
        tenant_id IN (
            SELECT tenant_id FROM user_tenant_roles 
            WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
        )
    );

CREATE POLICY "Users can manage their own consent" ON consent_records
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin users can view tenant consent records" ON consent_records
    FOR SELECT USING (tenant_id IN (
        SELECT tenant_id FROM user_tenant_roles 
        WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    ));

-- Data subject requests policies
CREATE POLICY "Users can view their own data subject requests" ON data_subject_requests
    FOR SELECT USING (
        user_id = auth.uid() OR
        tenant_id IN (
            SELECT tenant_id FROM user_tenant_roles 
            WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
        )
    );

CREATE POLICY "Users can create their own data subject requests" ON data_subject_requests
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Data processing activities policies (admin only)
CREATE POLICY "Admin users can manage processing activities" ON data_processing_activities
    FOR ALL USING (tenant_id IN (
        SELECT tenant_id FROM user_tenant_roles 
        WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    ));

-- Privacy audit log policies (read-only for admins)
CREATE POLICY "Admin users can view privacy audit logs" ON privacy_audit_log
    FOR SELECT USING (tenant_id IN (
        SELECT tenant_id FROM user_tenant_roles 
        WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    ));

-- ===========================================
-- TRIGGERS FOR AUDIT LOGGING
-- ===========================================

-- Function to log privacy events
CREATE OR REPLACE FUNCTION log_privacy_event()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO privacy_audit_log (
        tenant_id,
        event_type,
        event_description,
        affected_user_id,
        regulation,
        success,
        created_at
    ) VALUES (
        COALESCE(NEW.tenant_id, OLD.tenant_id),
        TG_TABLE_NAME || '_' || TG_OP,
        'Privacy-related data change in ' || TG_TABLE_NAME,
        COALESCE(NEW.user_id, OLD.user_id),
        'GDPR',
        true,
        NOW()
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for privacy audit logging
CREATE TRIGGER privacy_audit_consent_records
    AFTER INSERT OR UPDATE OR DELETE ON consent_records
    FOR EACH ROW EXECUTE FUNCTION log_privacy_event();

CREATE TRIGGER privacy_audit_data_subject_requests
    AFTER INSERT OR UPDATE OR DELETE ON data_subject_requests
    FOR EACH ROW EXECUTE FUNCTION log_privacy_event();

CREATE TRIGGER privacy_audit_privacy_settings
    AFTER INSERT OR UPDATE OR DELETE ON privacy_settings
    FOR EACH ROW EXECUTE FUNCTION log_privacy_event();

-- ===========================================
-- SCHEDULED TASKS (Would be implemented with pg_cron or external scheduler)
-- ===========================================

-- Example of what would be scheduled:
-- 1. Daily execution of scheduled data deletions
-- 2. Weekly compliance audits
-- 3. Monthly privacy impact assessment reviews
-- 4. Quarterly data retention policy reviews

COMMENT ON SCHEMA public IS 'TutorKai Data Privacy Compliance Schema - GDPR, POPI, CCPA compliant';
COMMENT ON TABLE privacy_settings IS 'Per-tenant privacy configuration and compliance settings';
COMMENT ON TABLE consent_records IS 'User consent records with full audit trail for GDPR compliance';
COMMENT ON TABLE data_processing_activities IS 'GDPR Article 30 - Record of processing activities';
COMMENT ON TABLE data_subject_requests IS 'GDPR Articles 15-22 - Data subject rights requests';
COMMENT ON TABLE data_deletion_schedule IS 'Automated data deletion scheduling for retention compliance';
COMMENT ON TABLE privacy_audit_log IS 'Comprehensive audit log for all privacy-related activities';