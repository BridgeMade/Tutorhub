-- Session Status Tracking Database Schema
-- Run this in your Supabase SQL editor

-- 1. Create session status history table
CREATE TABLE IF NOT EXISTS session_status_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    
    -- Status information
    status VARCHAR(30) NOT NULL CHECK (status IN (
        'scheduled', 'confirmed', 'reschedule_requested', 'rescheduled',
        'cancelled', 'lost', 'completed', 'missed', 'no_show_tutor',
        'pending_approval', 'disputed', 'refunded'
    )),
    previous_status VARCHAR(30),
    
    -- Change tracking
    changed_by UUID NOT NULL REFERENCES auth.users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    change_reason TEXT,
    
    -- Additional metadata
    metadata JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add last_modified_at column to lessons table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lessons' AND column_name = 'last_modified_at'
    ) THEN
        ALTER TABLE lessons 
        ADD COLUMN last_modified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_session_status_history_lesson_id ON session_status_history(lesson_id);
CREATE INDEX IF NOT EXISTS idx_session_status_history_status ON session_status_history(status);
CREATE INDEX IF NOT EXISTS idx_session_status_history_changed_at ON session_status_history(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_session_status_history_changed_by ON session_status_history(changed_by);
CREATE INDEX IF NOT EXISTS idx_lessons_detailed_status ON lessons(detailed_status);
CREATE INDEX IF NOT EXISTS idx_lessons_last_modified_at ON lessons(last_modified_at DESC);

-- 4. Create function to automatically create status history when lesson status changes
CREATE OR REPLACE FUNCTION create_status_history_on_lesson_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create history if detailed_status actually changed
    IF OLD.detailed_status IS DISTINCT FROM NEW.detailed_status THEN
        INSERT INTO session_status_history (
            lesson_id,
            status,
            previous_status,
            changed_by,
            change_reason,
            metadata
        ) VALUES (
            NEW.id,
            NEW.detailed_status,
            OLD.detailed_status,
            NEW.last_modified_by,
            'Automatic status change tracking',
            jsonb_build_object(
                'automatic', true,
                'trigger_source', 'lesson_update',
                'updated_at', NOW()
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create trigger for automatic status history
DROP TRIGGER IF EXISTS lesson_status_history_trigger ON lessons;
CREATE TRIGGER lesson_status_history_trigger
    AFTER UPDATE ON lessons
    FOR EACH ROW
    EXECUTE FUNCTION create_status_history_on_lesson_update();

-- 6. Create function to update lesson last_modified_at
CREATE OR REPLACE FUNCTION update_lesson_modified_time()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_modified_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger for updating last_modified_at
DROP TRIGGER IF EXISTS update_lessons_modified_time ON lessons;
CREATE TRIGGER update_lessons_modified_time
    BEFORE UPDATE ON lessons
    FOR EACH ROW
    EXECUTE FUNCTION update_lesson_modified_time();

-- 8. Create function to get session status statistics
CREATE OR REPLACE FUNCTION get_session_status_stats(
    user_id UUID DEFAULT NULL,
    user_role TEXT DEFAULT NULL,
    date_from TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    date_to TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
    status TEXT,
    count BIGINT,
    percentage DECIMAL
) AS $$
DECLARE
    total_count BIGINT;
BEGIN
    -- Build base query for total count
    SELECT COUNT(*) INTO total_count
    FROM lessons l
    WHERE 
        (date_from IS NULL OR l.scheduled_at >= date_from) AND
        (date_to IS NULL OR l.scheduled_at <= date_to) AND
        (user_id IS NULL OR (
            (user_role = 'student' AND l.student_id = user_id) OR
            (user_role = 'tutor' AND l.tutor_id = user_id) OR
            (user_role = 'admin')
        ));
    
    -- Return status counts with percentages
    RETURN QUERY
    SELECT 
        l.detailed_status as status,
        COUNT(*)::BIGINT as count,
        CASE 
            WHEN total_count > 0 THEN ROUND((COUNT(*)::DECIMAL / total_count) * 100, 2)
            ELSE 0
        END as percentage
    FROM lessons l
    WHERE 
        (date_from IS NULL OR l.scheduled_at >= date_from) AND
        (date_to IS NULL OR l.scheduled_at <= date_to) AND
        (user_id IS NULL OR (
            (user_role = 'student' AND l.student_id = user_id) OR
            (user_role = 'tutor' AND l.tutor_id = user_id) OR
            (user_role = 'admin')
        ))
    GROUP BY l.detailed_status
    ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create function to get recent status changes
CREATE OR REPLACE FUNCTION get_recent_status_changes(
    lesson_id_param UUID DEFAULT NULL,
    user_id UUID DEFAULT NULL,
    limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    lesson_id UUID,
    status TEXT,
    previous_status TEXT,
    changed_by_name TEXT,
    changed_at TIMESTAMP WITH TIME ZONE,
    change_reason TEXT,
    lesson_subject TEXT,
    student_name TEXT,
    tutor_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        h.id,
        h.lesson_id,
        h.status,
        h.previous_status,
        p.full_name as changed_by_name,
        h.changed_at,
        h.change_reason,
        s.name as lesson_subject,
        student.full_name as student_name,
        tutor.full_name as tutor_name
    FROM session_status_history h
    JOIN lessons l ON h.lesson_id = l.id
    JOIN profiles p ON h.changed_by = p.id
    LEFT JOIN subjects s ON l.subject_id = s.id
    LEFT JOIN profiles student ON l.student_id = student.id
    LEFT JOIN profiles tutor ON l.tutor_id = tutor.id
    WHERE 
        (lesson_id_param IS NULL OR h.lesson_id = lesson_id_param) AND
        (user_id IS NULL OR (
            l.student_id = user_id OR 
            l.tutor_id = user_id OR
            h.changed_by = user_id
        ))
    ORDER BY h.changed_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create status change notification trigger
CREATE OR REPLACE FUNCTION notify_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Send real-time notification about status change
    PERFORM pg_notify(
        'session_status_change',
        json_build_object(
            'lesson_id', NEW.lesson_id,
            'status', NEW.status,
            'previous_status', NEW.previous_status,
            'changed_by', NEW.changed_by,
            'changed_at', NEW.changed_at
        )::text
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Create trigger for status change notifications
DROP TRIGGER IF EXISTS session_status_change_notify ON session_status_history;
CREATE TRIGGER session_status_change_notify
    AFTER INSERT ON session_status_history
    FOR EACH ROW
    EXECUTE FUNCTION notify_status_change();

-- 12. Populate initial status history for existing lessons
INSERT INTO session_status_history (lesson_id, status, changed_by, change_reason, metadata)
SELECT 
    l.id,
    COALESCE(l.detailed_status, 'scheduled'),
    COALESCE(l.last_modified_by, l.student_id), -- Use student as fallback
    'Initial status import',
    jsonb_build_object(
        'import', true,
        'imported_at', NOW(),
        'original_status', l.detailed_status
    )
FROM lessons l
WHERE NOT EXISTS (
    SELECT 1 FROM session_status_history h WHERE h.lesson_id = l.id
);

-- 13. Enable RLS
ALTER TABLE session_status_history ENABLE ROW LEVEL SECURITY;

-- 14. Create RLS policies for session_status_history
DROP POLICY IF EXISTS "Users can view status history for their sessions" ON session_status_history;
CREATE POLICY "Users can view status history for their sessions" ON session_status_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM lessons l
            WHERE l.id = lesson_id 
            AND (l.student_id = auth.uid() OR l.tutor_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Admins can view all status history" ON session_status_history;
CREATE POLICY "Admins can view all status history" ON session_status_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Users can create status history for their sessions" ON session_status_history;
CREATE POLICY "Users can create status history for their sessions" ON session_status_history
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM lessons l
            WHERE l.id = lesson_id 
            AND (l.student_id = auth.uid() OR l.tutor_id = auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- 15. Grant permissions
GRANT SELECT, INSERT ON session_status_history TO authenticated;
GRANT EXECUTE ON FUNCTION get_session_status_stats(UUID, TEXT, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_status_changes(UUID, UUID, INTEGER) TO authenticated;

-- 16. Create view for easier status querying
CREATE OR REPLACE VIEW lesson_status_view AS
SELECT 
    l.id,
    l.student_id,
    l.tutor_id,
    l.subject_id,
    l.scheduled_at,
    l.duration_minutes,
    l.detailed_status as current_status,
    l.last_modified_by,
    l.last_modified_at,
    student.full_name as student_name,
    tutor.full_name as tutor_name,
    s.name as subject_name,
    latest_change.changed_at as status_changed_at,
    latest_change.change_reason as status_change_reason
FROM lessons l
LEFT JOIN profiles student ON l.student_id = student.id
LEFT JOIN profiles tutor ON l.tutor_id = tutor.id
LEFT JOIN subjects s ON l.subject_id = s.id
LEFT JOIN LATERAL (
    SELECT changed_at, change_reason
    FROM session_status_history h
    WHERE h.lesson_id = l.id
    ORDER BY changed_at DESC
    LIMIT 1
) latest_change ON true;

-- Grant access to the view
GRANT SELECT ON lesson_status_view TO authenticated;

-- Enable RLS on the view (inherits from base tables)
ALTER VIEW lesson_status_view SET (security_invoker = true);

-- Verify the schema was created successfully
SELECT 'Session status tracking schema created successfully!' as status;