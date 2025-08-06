-- ===========================================
-- USER TENANT ROLES SCHEMA
-- ===========================================
-- Database schema for managing user roles within tenants

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- USER TENANT ROLES TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS user_tenant_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- User and Tenant References
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Role Information
    role VARCHAR(50) NOT NULL CHECK (role IN (
        'owner',        -- Full access to everything
        'admin',        -- Administrative access
        'manager',      -- Management functions
        'tutor',        -- Tutor-specific functions
        'student',      -- Student-specific functions
        'parent',       -- Parent-specific functions
        'viewer'        -- Read-only access
    )),
    
    -- Role Permissions (stored as JSONB for flexibility)
    permissions JSONB DEFAULT '{}',
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Constraints
    UNIQUE(user_id, tenant_id), -- One role per user per tenant
    
    -- Ensure owner role is unique per tenant
    EXCLUDE (tenant_id WITH =) WHERE (role = 'owner' AND is_active = true)
);

-- Create indexes for user tenant roles
CREATE INDEX IF NOT EXISTS idx_user_tenant_roles_user ON user_tenant_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tenant_roles_tenant ON user_tenant_roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_tenant_roles_role ON user_tenant_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_tenant_roles_active ON user_tenant_roles(is_active);
CREATE INDEX IF NOT EXISTS idx_user_tenant_roles_created ON user_tenant_roles(created_at);

-- GIN index for permissions JSONB searches
CREATE INDEX IF NOT EXISTS idx_user_tenant_roles_permissions ON user_tenant_roles USING GIN (permissions);

-- ===========================================
-- ROLE PERMISSIONS TEMPLATE TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS role_permissions_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Role Template
    role_name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Default Permissions
    default_permissions JSONB NOT NULL DEFAULT '{}',
    
    -- Role Properties
    is_system_role BOOLEAN DEFAULT true,
    is_customizable BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for role templates
CREATE INDEX IF NOT EXISTS idx_role_templates_name ON role_permissions_templates(role_name);
CREATE INDEX IF NOT EXISTS idx_role_templates_system ON role_permissions_templates(is_system_role);
CREATE INDEX IF NOT EXISTS idx_role_templates_order ON role_permissions_templates(sort_order);

-- ===========================================
-- FUNCTIONS FOR ROLE MANAGEMENT
-- ===========================================

-- Function to check if user has specific permission
CREATE OR REPLACE FUNCTION user_has_permission(
    p_user_id UUID,
    p_tenant_id UUID,
    p_permission TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    user_permissions JSONB;
    user_role VARCHAR(50);
BEGIN
    -- Get user role and permissions
    SELECT role, permissions INTO user_role, user_permissions
    FROM user_tenant_roles 
    WHERE user_id = p_user_id 
      AND tenant_id = p_tenant_id 
      AND is_active = true;
    
    -- If no role found, return false
    IF user_role IS NULL THEN
        RETURN false;
    END IF;
    
    -- Owner and admin have all permissions
    IF user_role IN ('owner', 'admin') THEN
        RETURN true;
    END IF;
    
    -- Check specific permission in user permissions
    IF user_permissions ? p_permission THEN
        RETURN (user_permissions->p_permission)::boolean;
    END IF;
    
    -- Check default permissions for role
    SELECT default_permissions->p_permission INTO user_permissions
    FROM role_permissions_templates
    WHERE role_name = user_role;
    
    IF user_permissions IS NOT NULL THEN
        RETURN user_permissions::boolean;
    END IF;
    
    -- Default to false if permission not found
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's effective permissions
CREATE OR REPLACE FUNCTION get_user_permissions(
    p_user_id UUID,
    p_tenant_id UUID
)
RETURNS JSONB AS $$
DECLARE
    user_role VARCHAR(50);
    user_permissions JSONB;
    template_permissions JSONB;
    effective_permissions JSONB;
BEGIN
    -- Get user role and custom permissions
    SELECT role, permissions INTO user_role, user_permissions
    FROM user_tenant_roles 
    WHERE user_id = p_user_id 
      AND tenant_id = p_tenant_id 
      AND is_active = true;
    
    -- If no role found, return empty permissions
    IF user_role IS NULL THEN
        RETURN '{}'::jsonb;
    END IF;
    
    -- Owner and admin get all permissions
    IF user_role IN ('owner', 'admin') THEN
        RETURN jsonb_build_object(
            'all_permissions', true,
            'role', user_role
        );
    END IF;
    
    -- Get template permissions for role
    SELECT default_permissions INTO template_permissions
    FROM role_permissions_templates
    WHERE role_name = user_role;
    
    -- Merge template permissions with user-specific permissions
    effective_permissions := COALESCE(template_permissions, '{}'::jsonb);
    
    IF user_permissions IS NOT NULL THEN
        effective_permissions := effective_permissions || user_permissions;
    END IF;
    
    -- Add role information
    effective_permissions := effective_permissions || jsonb_build_object('role', user_role);
    
    RETURN effective_permissions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to assign role to user
CREATE OR REPLACE FUNCTION assign_user_role(
    p_user_id UUID,
    p_tenant_id UUID,
    p_role VARCHAR(50),
    p_assigned_by UUID,
    p_custom_permissions JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    role_id UUID;
BEGIN
    -- Insert or update user role
    INSERT INTO user_tenant_roles (
        user_id,
        tenant_id,
        role,
        permissions,
        created_by,
        is_active
    ) VALUES (
        p_user_id,
        p_tenant_id,
        p_role,
        COALESCE(p_custom_permissions, '{}'::jsonb),
        p_assigned_by,
        true
    )
    ON CONFLICT (user_id, tenant_id) 
    DO UPDATE SET
        role = EXCLUDED.role,
        permissions = EXCLUDED.permissions,
        updated_at = NOW(),
        is_active = true
    RETURNING id INTO role_id;
    
    RETURN role_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- ROW LEVEL SECURITY POLICIES
-- ===========================================

-- Enable RLS on user tenant roles
ALTER TABLE user_tenant_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions_templates ENABLE ROW LEVEL SECURITY;

-- Users can view their own roles
CREATE POLICY "Users can view their own roles" ON user_tenant_roles
    FOR SELECT USING (user_id = auth.uid());

-- Tenant owners and admins can manage roles
CREATE POLICY "Tenant admins can manage roles" ON user_tenant_roles
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM user_tenant_roles 
            WHERE user_id = auth.uid() 
              AND role IN ('owner', 'admin')
              AND is_active = true
        )
    );

-- Role templates are readable by authenticated users
CREATE POLICY "Authenticated users can view role templates" ON role_permissions_templates
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only system admins can modify role templates
CREATE POLICY "System admins can manage role templates" ON role_permissions_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_tenant_roles 
            WHERE user_id = auth.uid() 
              AND role = 'owner'
              AND tenant_id IS NULL -- Platform-level owner
        )
    );

-- ===========================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ===========================================

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_user_role_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating timestamps
CREATE TRIGGER update_user_tenant_roles_timestamp
    BEFORE UPDATE ON user_tenant_roles
    FOR EACH ROW EXECUTE FUNCTION update_user_role_timestamp();

-- ===========================================
-- DEFAULT ROLE TEMPLATES
-- ===========================================

-- Insert default role permission templates
INSERT INTO role_permissions_templates (role_name, display_name, description, default_permissions, sort_order) VALUES
('owner', 'Owner', 'Full system access and ownership', jsonb_build_object(
    'all_permissions', true,
    'manage_users', true,
    'manage_billing', true,
    'manage_settings', true,
    'delete_tenant', true
), 1),

('admin', 'Administrator', 'Administrative access to all features', jsonb_build_object(
    'manage_users', true,
    'manage_sessions', true,
    'manage_payments', true,
    'manage_reports', true,
    'manage_settings', true,
    'view_analytics', true
), 2),

('manager', 'Manager', 'Management access to operations', jsonb_build_object(
    'manage_sessions', true,
    'manage_tutors', true,
    'manage_students', true,
    'view_reports', true,
    'view_analytics', true
), 3),

('tutor', 'Tutor', 'Tutor-specific access', jsonb_build_object(
    'manage_own_sessions', true,
    'view_own_students', true,
    'manage_own_availability', true,
    'view_own_payments', true,
    'update_own_profile', true
), 4),

('student', 'Student', 'Student access to learning features', jsonb_build_object(
    'view_own_sessions', true,
    'book_sessions', true,
    'view_own_progress', true,
    'update_own_profile', true,
    'access_resources', true
), 5),

('parent', 'Parent', 'Parent access to monitor children', jsonb_build_object(
    'view_child_sessions', true,
    'view_child_progress', true,
    'manage_child_bookings', true,
    'communicate_tutors', true,
    'view_payments', true
), 6),

('viewer', 'Viewer', 'Read-only access', jsonb_build_object(
    'view_basic_info', true,
    'view_public_content', true
), 7)

ON CONFLICT (role_name) DO NOTHING;

-- ===========================================
-- COMMENTS AND DOCUMENTATION
-- ===========================================

COMMENT ON TABLE user_tenant_roles IS 'User roles within specific tenants with granular permissions';
COMMENT ON TABLE role_permissions_templates IS 'Templates defining default permissions for each role type';
COMMENT ON FUNCTION user_has_permission(UUID, UUID, TEXT) IS 'Check if user has specific permission in tenant';
COMMENT ON FUNCTION get_user_permissions(UUID, UUID) IS 'Get all effective permissions for user in tenant';
COMMENT ON FUNCTION assign_user_role(UUID, UUID, VARCHAR, UUID, JSONB) IS 'Assign or update user role in tenant';