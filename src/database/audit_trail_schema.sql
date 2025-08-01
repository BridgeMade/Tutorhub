-- Session Audit Trail Database Schema
-- Run this in your Supabase SQL editor

-- 1. Create session audit trail table
CREATE TABLE IF NOT EXISTS session_audit_trail (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    
    -- Action details
    action_type VARCHAR(20) NOT NULL CHECK (action_type IN (
        'created', 'updated', 'deleted', 'status_changed', 
        'rescheduled', 'cancelled', 'restored'
    )),
    entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN (
        'lesson', 'reschedule_request', 'counter_proposal', 
        'notification', 'user_action'
    )),
    entity_id VARCHAR(100) NOT NULL,
    
    -- User and timing
    performed_by UUID NOT NULL REFERENCES auth.users(id),
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Change tracking
    old_values JSONB,
    new_values JSONB,
    changes_summary TEXT NOT NULL,
    reason TEXT,
    
    -- Additional context
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_trail_lesson_id ON session_audit_trail(lesson_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_performed_by ON session_audit_trail(performed_by);
CREATE INDEX IF NOT EXISTS idx_audit_trail_performed_at ON session_audit_trail(performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_trail_action_type ON session_audit_trail(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_trail_entity_type ON session_audit_trail(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_trail_entity_id ON session_audit_trail(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_composite ON session_audit_trail(lesson_id, performed_at DESC);

-- 3. Create function to automatically audit lesson changes
CREATE OR REPLACE FUNCTION audit_lesson_changes()
RETURNS TRIGGER AS $$
DECLARE
    changes_text TEXT := '';
    change_count INTEGER := 0;
    old_val TEXT;
    new_val TEXT;
BEGIN
    -- Skip if this is just a timestamp update
    IF TG_OP = 'UPDATE' AND OLD.last_modified_at IS NOT DISTINCT FROM NEW.last_modified_at THEN
        RETURN NEW;
    END IF;
    
    -- Build changes summary for updates
    IF TG_OP = 'UPDATE' THEN
        -- Check each important field for changes
        IF OLD.scheduled_at IS DISTINCT FROM NEW.scheduled_at THEN
            changes_text := changes_text || 'Schedule: ' || 
                COALESCE(OLD.scheduled_at::TEXT, 'null') || ' → ' || 
                COALESCE(NEW.scheduled_at::TEXT, 'null') || '; ';
            change_count := change_count + 1;
        END IF;
        
        IF OLD.duration_minutes IS DISTINCT FROM NEW.duration_minutes THEN
            changes_text := changes_text || 'Duration: ' || 
                COALESCE(OLD.duration_minutes::TEXT, 'null') || ' → ' || 
                COALESCE(NEW.duration_minutes::TEXT, 'null') || ' minutes; ';
            change_count := change_count + 1;
        END IF;
        
        IF OLD.detailed_status IS DISTINCT FROM NEW.detailed_status THEN
            changes_text := changes_text || 'Status: ' || 
                COALESCE(OLD.detailed_status, 'null') || ' → ' || 
                COALESCE(NEW.detailed_status, 'null') || '; ';
            change_count := change_count + 1;
        END IF;
        
        IF OLD.student_id IS DISTINCT FROM NEW.student_id THEN
            changes_text := changes_text || 'Student changed; ';
            change_count := change_count + 1;
        END IF;
        
        IF OLD.tutor_id IS DISTINCT FROM NEW.tutor_id THEN
            changes_text := changes_text || 'Tutor changed; ';
            change_count := change_count + 1;
        END IF;
        
        IF OLD.subject_id IS DISTINCT FROM NEW.subject_id THEN
            changes_text := changes_text || 'Subject changed; ';
            change_count := change_count + 1;
        END IF;
        
        -- Only create audit entry if there were actual changes
        IF change_count > 0 THEN
            INSERT INTO session_audit_trail (
                lesson_id,
                action_type,
                entity_type,
                entity_id,
                performed_by,
                old_values,
                new_values,
                changes_summary,
                reason,
                metadata
            ) VALUES (
                NEW.id,
                'updated',
                'lesson',
                NEW.id,
                COALESCE(NEW.last_modified_by, NEW.student_id),
                to_jsonb(OLD),
                to_jsonb(NEW),
                TRIM(TRAILING '; ' FROM changes_text),
                'Lesson updated via system',
                jsonb_build_object(
                    'trigger_name', TG_NAME,
                    'change_count', change_count,
                    'updated_at', NOW()
                )
            );
        END IF;
    END IF;
    
    -- Handle lesson creation
    IF TG_OP = 'INSERT' THEN
        INSERT INTO session_audit_trail (
            lesson_id,
            action_type,
            entity_type,
            entity_id,
            performed_by,
            new_values,
            changes_summary,
            reason,
            metadata
        ) VALUES (
            NEW.id,
            'created',
            'lesson',
            NEW.id,
            COALESCE(NEW.last_modified_by, NEW.student_id),
            to_jsonb(NEW),
            'Lesson created: ' || COALESCE(NEW.detailed_status, 'scheduled') || ' session',
            'New lesson booking',
            jsonb_build_object(
                'trigger_name', TG_NAME,
                'created_at', NOW()
            )
        );
    END IF;
    
    -- Handle lesson deletion
    IF TG_OP = 'DELETE' THEN
        INSERT INTO session_audit_trail (
            lesson_id,
            action_type,
            entity_type,
            entity_id,
            performed_by,
            old_values,
            changes_summary,
            reason,
            metadata
        ) VALUES (
            OLD.id,
            'deleted',
            'lesson',
            OLD.id,
            COALESCE(OLD.last_modified_by, OLD.student_id),
            to_jsonb(OLD),
            'Lesson deleted',
            'Lesson removal',
            jsonb_build_object(
                'trigger_name', TG_NAME,
                'deleted_at', NOW()
            )
        );
        RETURN OLD;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create trigger for lesson audit
DROP TRIGGER IF EXISTS lesson_audit_trigger ON lessons;
CREATE TRIGGER lesson_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON lessons
    FOR EACH ROW
    EXECUTE FUNCTION audit_lesson_changes();

-- 5. Create function to audit reschedule request changes
CREATE OR REPLACE FUNCTION audit_reschedule_request_changes()
RETURNS TRIGGER AS $$
DECLARE
    changes_text TEXT := '';
    lesson_id_val UUID;
BEGIN
    -- Get lesson_id for the audit trail
    lesson_id_val := COALESCE(NEW.lesson_id, OLD.lesson_id);
    
    IF TG_OP = 'INSERT' THEN
        INSERT INTO session_audit_trail (
            lesson_id,
            action_type,
            entity_type,
            entity_id,
            performed_by,
            new_values,
            changes_summary,
            reason,
            metadata
        ) VALUES (
            lesson_id_val,
            'created',
            'reschedule_request',
            NEW.id,
            NEW.requested_by,
            to_jsonb(NEW),
            'Reschedule request created: ' || NEW.request_type || ' request',
            NEW.reason,
            jsonb_build_object(
                'trigger_name', TG_NAME,
                'request_type', NEW.request_type,
                'created_at', NOW()
            )
        );
    END IF;
    
    IF TG_OP = 'UPDATE' THEN
        -- Build changes summary
        IF OLD.status IS DISTINCT FROM NEW.status THEN
            changes_text := changes_text || 'Status: ' || 
                COALESCE(OLD.status, 'null') || ' → ' || 
                COALESCE(NEW.status, 'null') || '; ';
        END IF;
        
        IF OLD.admin_decision IS DISTINCT FROM NEW.admin_decision THEN
            changes_text := changes_text || 'Admin decision: ' || 
                COALESCE(OLD.admin_decision, 'null') || ' → ' || 
                COALESCE(NEW.admin_decision, 'null') || '; ';
        END IF;
        
        IF OLD.approved_by IS DISTINCT FROM NEW.approved_by THEN
            changes_text := changes_text || 'Approved by changed; ';
        END IF;
        
        INSERT INTO session_audit_trail (
            lesson_id,
            action_type,
            entity_type,
            entity_id,
            performed_by,
            old_values,
            new_values,
            changes_summary,
            reason,
            metadata
        ) VALUES (
            lesson_id_val,
            'updated',
            'reschedule_request',
            NEW.id,
            COALESCE(NEW.approved_by, NEW.requested_by),
            to_jsonb(OLD),
            to_jsonb(NEW),
            COALESCE(NULLIF(TRIM(TRAILING '; ' FROM changes_text), ''), 'Reschedule request updated'),
            COALESCE(NEW.approver_response, NEW.reason),
            jsonb_build_object(
                'trigger_name', TG_NAME,
                'request_type', NEW.request_type,
                'updated_at', NOW()
            )
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create trigger for reschedule request audit
DROP TRIGGER IF EXISTS reschedule_request_audit_trigger ON session_reschedule_requests;
CREATE TRIGGER reschedule_request_audit_trigger
    AFTER INSERT OR UPDATE ON session_reschedule_requests
    FOR EACH ROW
    EXECUTE FUNCTION audit_reschedule_request_changes();

-- 7. Create function to get audit trail with pagination
CREATE OR REPLACE FUNCTION get_audit_trail_paginated(
    lesson_id_filter UUID DEFAULT NULL,
    user_id_filter UUID DEFAULT NULL,
    action_types TEXT[] DEFAULT NULL,
    date_from TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    date_to TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    page_limit INTEGER DEFAULT 50,
    page_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    lesson_id UUID,
    action_type TEXT,
    entity_type TEXT,
    entity_id TEXT,
    performed_by UUID,
    performed_at TIMESTAMP WITH TIME ZONE,
    changes_summary TEXT,
    reason TEXT,
    user_name TEXT,
    user_role TEXT,
    lesson_subject TEXT,
    lesson_student TEXT,
    lesson_tutor TEXT,
    total_count BIGINT
) AS $$
DECLARE
    total_records BIGINT;
BEGIN
    -- Get total count for pagination
    SELECT COUNT(*) INTO total_records
    FROM session_audit_trail a
    WHERE 
        (lesson_id_filter IS NULL OR a.lesson_id = lesson_id_filter) AND
        (user_id_filter IS NULL OR a.performed_by = user_id_filter) AND
        (action_types IS NULL OR a.action_type = ANY(action_types)) AND
        (date_from IS NULL OR a.performed_at >= date_from) AND
        (date_to IS NULL OR a.performed_at <= date_to);
    
    -- Return paginated results with total count
    RETURN QUERY
    SELECT 
        a.id,
        a.lesson_id,
        a.action_type,
        a.entity_type,
        a.entity_id,
        a.performed_by,
        a.performed_at,
        a.changes_summary,
        a.reason,
        p.full_name as user_name,
        p.role as user_role,
        s.name as lesson_subject,
        student.full_name as lesson_student,
        tutor.full_name as lesson_tutor,
        total_records as total_count
    FROM session_audit_trail a
    LEFT JOIN profiles p ON a.performed_by = p.id
    LEFT JOIN lessons l ON a.lesson_id = l.id
    LEFT JOIN subjects s ON l.subject_id = s.id
    LEFT JOIN profiles student ON l.student_id = student.id
    LEFT JOIN profiles tutor ON l.tutor_id = tutor.id
    WHERE 
        (lesson_id_filter IS NULL OR a.lesson_id = lesson_id_filter) AND
        (user_id_filter IS NULL OR a.performed_by = user_id_filter) AND
        (action_types IS NULL OR a.action_type = ANY(action_types)) AND
        (date_from IS NULL OR a.performed_at >= date_from) AND
        (date_to IS NULL OR a.performed_at <= date_to)
    ORDER BY a.performed_at DESC
    LIMIT page_limit
    OFFSET page_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create function to get audit statistics
CREATE OR REPLACE FUNCTION get_audit_statistics(
    lesson_id_filter UUID DEFAULT NULL,
    user_id_filter UUID DEFAULT NULL,
    date_from TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    date_to TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
    total_entries BIGINT,
    action_breakdown JSONB,
    user_breakdown JSONB,
    daily_activity JSONB,
    time_range JSONB
) AS $$
DECLARE
    stats_result RECORD;
BEGIN
    -- Build comprehensive statistics
    WITH audit_data AS (
        SELECT 
            a.*,
            p.full_name as user_name,
            DATE(a.performed_at) as activity_date
        FROM session_audit_trail a
        LEFT JOIN profiles p ON a.performed_by = p.id
        WHERE 
            (lesson_id_filter IS NULL OR a.lesson_id = lesson_id_filter) AND
            (user_id_filter IS NULL OR a.performed_by = user_id_filter) AND
            (date_from IS NULL OR a.performed_at >= date_from) AND
            (date_to IS NULL OR a.performed_at <= date_to)
    ),
    action_stats AS (
        SELECT jsonb_object_agg(action_type, action_count) as breakdown
        FROM (
            SELECT action_type, COUNT(*) as action_count
            FROM audit_data
            GROUP BY action_type
            ORDER BY action_count DESC
        ) action_counts
    ),
    user_stats AS (
        SELECT jsonb_object_agg(user_name, user_count) as breakdown
        FROM (
            SELECT COALESCE(user_name, 'Unknown User') as user_name, COUNT(*) as user_count
            FROM audit_data
            GROUP BY user_name
            ORDER BY user_count DESC
            LIMIT 10
        ) user_counts
    ),
    daily_stats AS (
        SELECT jsonb_object_agg(activity_date, daily_count) as breakdown
        FROM (
            SELECT activity_date, COUNT(*) as daily_count
            FROM audit_data
            GROUP BY activity_date
            ORDER BY activity_date DESC
            LIMIT 30
        ) daily_counts
    ),
    time_range_stats AS (
        SELECT jsonb_build_object(
            'earliest', MIN(performed_at),
            'latest', MAX(performed_at),
            'span_days', EXTRACT(DAY FROM MAX(performed_at) - MIN(performed_at))
        ) as range_info
        FROM audit_data
    )
    SELECT 
        (SELECT COUNT(*) FROM audit_data) as total_entries,
        (SELECT breakdown FROM action_stats) as action_breakdown,
        (SELECT breakdown FROM user_stats) as user_breakdown,
        (SELECT breakdown FROM daily_stats) as daily_activity,
        (SELECT range_info FROM time_range_stats) as time_range
    INTO stats_result;
    
    RETURN QUERY SELECT 
        stats_result.total_entries,
        COALESCE(stats_result.action_breakdown, '{}'::jsonb),
        COALESCE(stats_result.user_breakdown, '{}'::jsonb),
        COALESCE(stats_result.daily_activity, '{}'::jsonb),
        COALESCE(stats_result.time_range, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create audit trail cleanup function (for maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_audit_entries(
    older_than_days INTEGER DEFAULT 365
)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM session_audit_trail
    WHERE performed_at < NOW() - (older_than_days || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Enable RLS
ALTER TABLE session_audit_trail ENABLE ROW LEVEL SECURITY;

-- 11. Create RLS policies
DROP POLICY IF EXISTS "Users can view audit trail for their sessions" ON session_audit_trail;
CREATE POLICY "Users can view audit trail for their sessions" ON session_audit_trail
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM lessons l
            WHERE l.id = lesson_id 
            AND (l.student_id = auth.uid() OR l.tutor_id = auth.uid())
        ) OR
        performed_by = auth.uid()
    );

DROP POLICY IF EXISTS "Admins can view all audit trails" ON session_audit_trail;
CREATE POLICY "Admins can view all audit trails" ON session_audit_trail
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "System can create audit entries" ON session_audit_trail;
CREATE POLICY "System can create audit entries" ON session_audit_trail
    FOR INSERT WITH CHECK (true);

-- 12. Grant permissions
GRANT SELECT, INSERT ON session_audit_trail TO authenticated;
GRANT EXECUTE ON FUNCTION get_audit_trail_paginated(UUID, UUID, TEXT[], TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_audit_statistics(UUID, UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated;

-- 13. Create initial audit entries for existing lessons
INSERT INTO session_audit_trail (
    lesson_id,
    action_type,
    entity_type,
    entity_id,
    performed_by,
    new_values,
    changes_summary,
    reason,
    metadata
)
SELECT 
    l.id,
    'created',
    'lesson',
    l.id,
    COALESCE(l.last_modified_by, l.student_id),
    to_jsonb(l),
    'Historical lesson import: ' || COALESCE(l.detailed_status, 'scheduled') || ' session',
    'Initial audit trail population',
    jsonb_build_object(
        'import', true,
        'imported_at', NOW(),
        'source', 'existing_lessons'
    )
FROM lessons l
WHERE NOT EXISTS (
    SELECT 1 FROM session_audit_trail a 
    WHERE a.lesson_id = l.id AND a.action_type = 'created'
);

-- 14. Create view for easy audit querying
CREATE OR REPLACE VIEW lesson_audit_view AS
SELECT 
    a.id,
    a.lesson_id,
    a.action_type,
    a.entity_type,
    a.entity_id,
    a.performed_by,
    a.performed_at,
    a.changes_summary,
    a.reason,
    a.metadata,
    p.full_name as user_name,
    p.role as user_role,
    l.scheduled_at as lesson_date,
    s.name as lesson_subject,
    student.full_name as lesson_student,
    tutor.full_name as lesson_tutor
FROM session_audit_trail a
LEFT JOIN profiles p ON a.performed_by = p.id
LEFT JOIN lessons l ON a.lesson_id = l.id
LEFT JOIN subjects s ON l.subject_id = s.id
LEFT JOIN profiles student ON l.student_id = student.id
LEFT JOIN profiles tutor ON l.tutor_id = tutor.id;

-- Grant access to the view
GRANT SELECT ON lesson_audit_view TO authenticated;

-- 15. Enable real-time notifications for audit changes
CREATE OR REPLACE FUNCTION notify_audit_change()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify(
        'audit_trail_change',
        json_build_object(
            'lesson_id', NEW.lesson_id,
            'action_type', NEW.action_type,
            'entity_type', NEW.entity_type,
            'performed_by', NEW.performed_by,
            'performed_at', NEW.performed_at,
            'changes_summary', NEW.changes_summary
        )::text
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS audit_trail_notify ON session_audit_trail;
CREATE TRIGGER audit_trail_notify
    AFTER INSERT ON session_audit_trail
    FOR EACH ROW
    EXECUTE FUNCTION notify_audit_change();

-- Verify the schema was created successfully
SELECT 'Session audit trail schema created successfully!' as status;