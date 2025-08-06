-- ===========================================
-- BACKUP AND DISASTER RECOVERY SCHEMA
-- ===========================================
-- This schema supports comprehensive backup and restore operations
-- with job tracking, restore points, and configuration management

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- BACKUP JOBS TABLE
-- ===========================================
-- Tracks all backup operations (full, incremental, differential)

CREATE TABLE IF NOT EXISTS backup_jobs (
    id VARCHAR(255) PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK (type IN ('full', 'incremental', 'differential')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    description TEXT,
    tables TEXT[] DEFAULT '{}',
    size BIGINT, -- Backup size in bytes
    location TEXT, -- Storage location/path
    error_message TEXT,
    compression_level VARCHAR(10) DEFAULT 'medium' CHECK (compression_level IN ('none', 'low', 'medium', 'high')),
    encryption BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_backup_jobs_status ON backup_jobs(status);
CREATE INDEX IF NOT EXISTS idx_backup_jobs_start_time ON backup_jobs(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_backup_jobs_type ON backup_jobs(type);

-- ===========================================
-- RESTORE POINTS TABLE
-- ===========================================
-- Represents available restore points with metadata

CREATE TABLE IF NOT EXISTS restore_points (
    id VARCHAR(255) PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('automatic', 'manual')),
    description TEXT NOT NULL,
    data_size BIGINT NOT NULL DEFAULT 0, -- Database backup size in bytes
    file_size BIGINT NOT NULL DEFAULT 0, -- File backup size in bytes
    verified BOOLEAN DEFAULT false,
    last_verified TIMESTAMPTZ,
    location TEXT NOT NULL, -- Storage location/path
    backup_job_id VARCHAR(255) REFERENCES backup_jobs(id) ON DELETE CASCADE,
    retention_until TIMESTAMPTZ, -- When this restore point expires
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_restore_points_timestamp ON restore_points(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_restore_points_type ON restore_points(type);
CREATE INDEX IF NOT EXISTS idx_restore_points_verified ON restore_points(verified);
CREATE INDEX IF NOT EXISTS idx_restore_points_retention ON restore_points(retention_until);

-- ===========================================
-- BACKUP CONFIGURATION TABLE
-- ===========================================
-- Stores backup policies and configurations

CREATE TABLE IF NOT EXISTS backup_config (
    id VARCHAR(20) PRIMARY KEY DEFAULT 'default',
    frequency VARCHAR(20) NOT NULL DEFAULT 'daily' CHECK (frequency IN ('hourly', 'daily', 'weekly', 'monthly')),
    retention_days INTEGER NOT NULL DEFAULT 30,
    include_files BOOLEAN DEFAULT true,
    include_database BOOLEAN DEFAULT true,
    compression_level VARCHAR(10) DEFAULT 'medium' CHECK (compression_level IN ('none', 'low', 'medium', 'high')),
    encryption BOOLEAN DEFAULT true,
    destination VARCHAR(20) DEFAULT 'cloud' CHECK (destination IN ('local', 'cloud', 'both')),
    max_backup_size BIGINT DEFAULT 10737418240, -- 10GB default limit
    notification_email TEXT,
    auto_cleanup BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default configuration
INSERT INTO backup_config (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;

-- ===========================================
-- BACKUP VERIFICATION LOGS TABLE
-- ===========================================
-- Tracks backup integrity verification results

CREATE TABLE IF NOT EXISTS backup_verification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restore_point_id VARCHAR(255) NOT NULL REFERENCES restore_points(id) ON DELETE CASCADE,
    verification_type VARCHAR(20) NOT NULL CHECK (verification_type IN ('checksum', 'restore_test', 'file_integrity')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('passed', 'failed', 'warning')),
    details JSONB DEFAULT '{}',
    error_message TEXT,
    duration_ms INTEGER,
    verified_at TIMESTAMPTZ DEFAULT NOW(),
    verified_by VARCHAR(255) -- User or system identifier
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_backup_verification_restore_point ON backup_verification_logs(restore_point_id);
CREATE INDEX IF NOT EXISTS idx_backup_verification_status ON backup_verification_logs(status);
CREATE INDEX IF NOT EXISTS idx_backup_verification_date ON backup_verification_logs(verified_at DESC);

-- ===========================================
-- DISASTER RECOVERY PLANS TABLE
-- ===========================================
-- Stores disaster recovery procedures and runbooks

CREATE TABLE IF NOT EXISTS disaster_recovery_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    disaster_type VARCHAR(50) NOT NULL, -- 'data_corruption', 'hardware_failure', 'security_breach', etc.
    priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    description TEXT,
    procedures JSONB NOT NULL DEFAULT '[]', -- Array of step-by-step procedures
    estimated_recovery_time INTEGER, -- In minutes
    required_approvals TEXT[], -- Who needs to approve execution
    contact_list JSONB DEFAULT '[]', -- Emergency contacts
    last_tested TIMESTAMPTZ,
    test_results JSONB DEFAULT '{}',
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_disaster_recovery_type ON disaster_recovery_plans(disaster_type);
CREATE INDEX IF NOT EXISTS idx_disaster_recovery_priority ON disaster_recovery_plans(priority);

-- ===========================================
-- BACKUP METRICS TABLE
-- ===========================================
-- Stores backup performance metrics and statistics

CREATE TABLE IF NOT EXISTS backup_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    backup_job_id VARCHAR(255) NOT NULL REFERENCES backup_jobs(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL,
    metric_value NUMERIC NOT NULL,
    metric_unit VARCHAR(20), -- 'bytes', 'seconds', 'count', etc.
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_backup_metrics_job ON backup_metrics(backup_job_id);
CREATE INDEX IF NOT EXISTS idx_backup_metrics_name ON backup_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_backup_metrics_date ON backup_metrics(recorded_at DESC);

-- ===========================================
-- RESTORE OPERATIONS TABLE
-- ===========================================
-- Tracks restore operations and their progress

CREATE TABLE IF NOT EXISTS restore_operations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restore_point_id VARCHAR(255) NOT NULL REFERENCES restore_points(id),
    initiated_by VARCHAR(255) NOT NULL, -- User who initiated the restore
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    restore_type VARCHAR(20) NOT NULL CHECK (restore_type IN ('full', 'partial', 'database_only', 'files_only')),
    target_environment VARCHAR(50) DEFAULT 'production',
    restore_options JSONB DEFAULT '{}', -- Custom restore options
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    error_message TEXT,
    restore_summary JSONB DEFAULT '{}', -- Summary of what was restored
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_restore_operations_status ON restore_operations(status);
CREATE INDEX IF NOT EXISTS idx_restore_operations_date ON restore_operations(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_restore_operations_point ON restore_operations(restore_point_id);

-- ===========================================
-- BACKUP NOTIFICATIONS TABLE
-- ===========================================
-- Tracks backup-related notifications and alerts

CREATE TABLE IF NOT EXISTS backup_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_type VARCHAR(50) NOT NULL, -- 'backup_failed', 'verification_failed', 'storage_full', etc.
    severity VARCHAR(10) NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_job_id VARCHAR(255) REFERENCES backup_jobs(id),
    related_restore_point VARCHAR(255) REFERENCES restore_points(id),
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_by VARCHAR(255),
    acknowledged_at TIMESTAMPTZ,
    auto_resolve BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_backup_notifications_severity ON backup_notifications(severity);
CREATE INDEX IF NOT EXISTS idx_backup_notifications_ack ON backup_notifications(acknowledged);
CREATE INDEX IF NOT EXISTS idx_backup_notifications_date ON backup_notifications(created_at DESC);

-- ===========================================
-- FUNCTIONS FOR BACKUP MANAGEMENT
-- ===========================================

-- Function to clean up old backup jobs and restore points
CREATE OR REPLACE FUNCTION cleanup_old_backups()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    retention_days INTEGER;
    deleted_count INTEGER := 0;
    cutoff_date TIMESTAMPTZ;
BEGIN
    -- Get retention policy
    SELECT bc.retention_days INTO retention_days
    FROM backup_config bc
    WHERE bc.id = 'default';
    
    IF retention_days IS NULL THEN
        retention_days := 30; -- Default fallback
    END IF;
    
    cutoff_date := NOW() - INTERVAL '1 day' * retention_days;
    
    -- Delete old backup jobs (cascades to metrics)
    DELETE FROM backup_jobs 
    WHERE created_at < cutoff_date 
    AND status IN ('completed', 'failed');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Delete old restore points that are past retention
    DELETE FROM restore_points 
    WHERE (retention_until IS NOT NULL AND retention_until < NOW())
    OR (retention_until IS NULL AND created_at < cutoff_date AND type = 'automatic');
    
    -- Log cleanup operation
    INSERT INTO backup_notifications (
        notification_type,
        severity,
        title,
        message,
        metadata
    ) VALUES (
        'cleanup_completed',
        'info',
        'Backup Cleanup Completed',
        format('Cleaned up %s old backup records', deleted_count),
        jsonb_build_object('deleted_count', deleted_count, 'retention_days', retention_days)
    );
    
    RETURN deleted_count;
END;
$$;

-- Function to calculate backup statistics
CREATE OR REPLACE FUNCTION get_backup_statistics(
    time_range_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
    total_backups INTEGER,
    successful_backups INTEGER,
    failed_backups INTEGER,
    total_data_size BIGINT,
    average_backup_time NUMERIC,
    success_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    start_time TIMESTAMPTZ;
BEGIN
    start_time := NOW() - INTERVAL '1 hour' * time_range_hours;
    
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_backups,
        COUNT(*) FILTER (WHERE status = 'completed')::INTEGER as successful_backups,
        COUNT(*) FILTER (WHERE status = 'failed')::INTEGER as failed_backups,
        COALESCE(SUM(size), 0)::BIGINT as total_data_size,
        COALESCE(AVG(EXTRACT(EPOCH FROM (end_time - start_time))), 0)::NUMERIC as average_backup_time,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                (COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC / COUNT(*)::NUMERIC * 100)
            ELSE 0 
        END as success_rate
    FROM backup_jobs
    WHERE start_time >= start_time;
END;
$$;

-- Function to validate restore point integrity
CREATE OR REPLACE FUNCTION validate_restore_point(
    restore_point_id_param VARCHAR(255)
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    restore_point_exists BOOLEAN;
    verification_result BOOLEAN := true;
BEGIN
    -- Check if restore point exists
    SELECT EXISTS(
        SELECT 1 FROM restore_points 
        WHERE id = restore_point_id_param
    ) INTO restore_point_exists;
    
    IF NOT restore_point_exists THEN
        RETURN false;
    END IF;
    
    -- Log verification attempt
    INSERT INTO backup_verification_logs (
        restore_point_id,
        verification_type,
        status,
        details,
        verified_by
    ) VALUES (
        restore_point_id_param,
        'restore_test',
        CASE WHEN verification_result THEN 'passed' ELSE 'failed' END,
        jsonb_build_object('validation_time', NOW()),
        'system'
    );
    
    -- Update restore point verification status
    UPDATE restore_points 
    SET 
        verified = verification_result,
        last_verified = NOW()
    WHERE id = restore_point_id_param;
    
    RETURN verification_result;
END;
$$;

-- ===========================================
-- TRIGGERS FOR AUTOMATIC MAINTENANCE
-- ===========================================

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Apply update timestamp triggers
DROP TRIGGER IF EXISTS backup_jobs_updated_at ON backup_jobs;
CREATE TRIGGER backup_jobs_updated_at 
    BEFORE UPDATE ON backup_jobs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS restore_points_updated_at ON restore_points;
CREATE TRIGGER restore_points_updated_at 
    BEFORE UPDATE ON restore_points 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS backup_config_updated_at ON backup_config;
CREATE TRIGGER backup_config_updated_at 
    BEFORE UPDATE ON backup_config 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS restore_operations_updated_at ON restore_operations;
CREATE TRIGGER restore_operations_updated_at 
    BEFORE UPDATE ON restore_operations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- ROW LEVEL SECURITY (RLS)
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE backup_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE restore_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_verification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE disaster_recovery_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE restore_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (admins only for backup operations)
CREATE POLICY "Backup operations require admin role" ON backup_jobs
    FOR ALL USING (
        auth.role() = 'authenticated' 
        AND (
            auth.jwt() ->> 'user_role' = 'admin' 
            OR auth.jwt() ->> 'user_role' = 'super_admin'
        )
    );

CREATE POLICY "Restore points require admin role" ON restore_points
    FOR ALL USING (
        auth.role() = 'authenticated' 
        AND (
            auth.jwt() ->> 'user_role' = 'admin' 
            OR auth.jwt() ->> 'user_role' = 'super_admin'
        )
    );

CREATE POLICY "Backup config requires admin role" ON backup_config
    FOR ALL USING (
        auth.role() = 'authenticated' 
        AND (
            auth.jwt() ->> 'user_role' = 'admin' 
            OR auth.jwt() ->> 'user_role' = 'super_admin'
        )
    );

CREATE POLICY "Backup verification requires admin role" ON backup_verification_logs
    FOR ALL USING (
        auth.role() = 'authenticated' 
        AND (
            auth.jwt() ->> 'user_role' = 'admin' 
            OR auth.jwt() ->> 'user_role' = 'super_admin'
        )
    );

CREATE POLICY "Disaster recovery requires admin role" ON disaster_recovery_plans
    FOR ALL USING (
        auth.role() = 'authenticated' 
        AND (
            auth.jwt() ->> 'user_role' = 'admin' 
            OR auth.jwt() ->> 'user_role' = 'super_admin'
        )
    );

CREATE POLICY "Backup metrics require admin role" ON backup_metrics
    FOR ALL USING (
        auth.role() = 'authenticated' 
        AND (
            auth.jwt() ->> 'user_role' = 'admin' 
            OR auth.jwt() ->> 'user_role' = 'super_admin'
        )
    );

CREATE POLICY "Restore operations require admin role" ON restore_operations
    FOR ALL USING (
        auth.role() = 'authenticated' 
        AND (
            auth.jwt() ->> 'user_role' = 'admin' 
            OR auth.jwt() ->> 'user_role' = 'super_admin'
        )
    );

CREATE POLICY "Backup notifications require admin role" ON backup_notifications
    FOR ALL USING (
        auth.role() = 'authenticated' 
        AND (
            auth.jwt() ->> 'user_role' = 'admin' 
            OR auth.jwt() ->> 'user_role' = 'super_admin'
        )
    );

-- ===========================================
-- SAMPLE DATA FOR TESTING
-- ===========================================

-- Insert sample disaster recovery plans
INSERT INTO disaster_recovery_plans (
    name, 
    disaster_type, 
    priority, 
    description, 
    procedures, 
    estimated_recovery_time,
    created_by
) VALUES 
(
    'Database Corruption Recovery',
    'data_corruption',
    'critical',
    'Recovery procedure for database corruption incidents',
    '[
        {"step": 1, "action": "Assess corruption extent", "estimated_time": 10},
        {"step": 2, "action": "Identify latest valid backup", "estimated_time": 5},
        {"step": 3, "action": "Initiate restore process", "estimated_time": 60},
        {"step": 4, "action": "Verify data integrity", "estimated_time": 30},
        {"step": 5, "action": "Resume operations", "estimated_time": 15}
    ]'::jsonb,
    120,
    'system'
),
(
    'Security Breach Response',
    'security_breach',
    'critical',
    'Response procedure for security incidents',
    '[
        {"step": 1, "action": "Isolate affected systems", "estimated_time": 5},
        {"step": 2, "action": "Assess breach scope", "estimated_time": 30},
        {"step": 3, "action": "Restore from clean backup", "estimated_time": 90},
        {"step": 4, "action": "Apply security patches", "estimated_time": 45},
        {"step": 5, "action": "Monitor for further threats", "estimated_time": 60}
    ]'::jsonb,
    230,
    'system'
);

-- ===========================================
-- COMMENTS AND DOCUMENTATION
-- ===========================================

COMMENT ON TABLE backup_jobs IS 'Tracks all backup operations with comprehensive metadata';
COMMENT ON TABLE restore_points IS 'Available restore points with verification status';
COMMENT ON TABLE backup_config IS 'System-wide backup configuration and policies';
COMMENT ON TABLE backup_verification_logs IS 'Logs of backup integrity verification attempts';
COMMENT ON TABLE disaster_recovery_plans IS 'Documented disaster recovery procedures';
COMMENT ON TABLE backup_metrics IS 'Performance metrics for backup operations';
COMMENT ON TABLE restore_operations IS 'Tracks restore operations and progress';
COMMENT ON TABLE backup_notifications IS 'Backup-related alerts and notifications';

COMMENT ON FUNCTION cleanup_old_backups() IS 'Cleans up old backup records based on retention policy';
COMMENT ON FUNCTION get_backup_statistics(INTEGER) IS 'Returns backup performance statistics for specified time range';
COMMENT ON FUNCTION validate_restore_point(VARCHAR) IS 'Validates restore point integrity and updates verification status';