-- Session Management and Rescheduling System Database Schema
-- Run this in your Supabase SQL editor

-- 1. Add new columns to lessons table for session management
DO $$
BEGIN
    -- Add status column with more detailed states
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'detailed_status') THEN
        ALTER TABLE lessons ADD COLUMN detailed_status VARCHAR(30) DEFAULT 'scheduled' 
        CHECK (detailed_status IN ('scheduled', 'reschedule_requested', 'reschedule_pending', 'rescheduled', 'confirmed', 'completed', 'cancelled', 'lost'));
    END IF;
    
    -- Add cancellation reason
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'cancellation_reason') THEN
        ALTER TABLE lessons ADD COLUMN cancellation_reason TEXT;
    END IF;
    
    -- Add last modified by (for audit trail)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'last_modified_by') THEN
        ALTER TABLE lessons ADD COLUMN last_modified_by UUID REFERENCES auth.users(id);
    END IF;
    
    -- Add original scheduled time (for tracking changes)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'original_scheduled_at') THEN
        ALTER TABLE lessons ADD COLUMN original_scheduled_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 2. Create session_reschedule_requests table
CREATE TABLE IF NOT EXISTS session_reschedule_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES auth.users(id),
    request_type VARCHAR(20) NOT NULL CHECK (request_type IN ('reschedule', 'cancel')),
    reason TEXT NOT NULL,
    
    -- Original session details
    original_date TIMESTAMP WITH TIME ZONE NOT NULL,
    original_duration INTEGER NOT NULL,
    
    -- Proposed new details (null for cancellations)
    proposed_date TIMESTAMP WITH TIME ZONE,
    proposed_duration INTEGER,
    
    -- Approval workflow
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'counter_proposed', 'expired', 'admin_required')),
    approver_response TEXT,
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    
    -- Response time tracking
    response_deadline TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '4 hours'),
    
    -- Admin escalation
    admin_escalated BOOLEAN DEFAULT false,
    admin_escalated_at TIMESTAMP WITH TIME ZONE,
    admin_decision VARCHAR(20) CHECK (admin_decision IN ('approved', 'declined', 'pending')),
    admin_notes TEXT,
    
    -- Audit trail
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create session_change_history table for complete audit trail
CREATE TABLE IF NOT EXISTS session_change_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    reschedule_request_id UUID REFERENCES session_reschedule_requests(id),
    
    -- Change details
    change_type VARCHAR(30) NOT NULL CHECK (change_type IN ('created', 'rescheduled', 'cancelled', 'status_changed', 'reschedule_requested', 'approved', 'declined')),
    changed_by UUID NOT NULL REFERENCES auth.users(id),
    
    -- Before and after values
    old_values JSONB,
    new_values JSONB,
    
    -- Additional context
    reason TEXT,
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create counter_proposals table for declined reschedule requests
CREATE TABLE IF NOT EXISTS counter_proposals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    original_request_id UUID NOT NULL REFERENCES session_reschedule_requests(id) ON DELETE CASCADE,
    proposed_by UUID NOT NULL REFERENCES auth.users(id),
    
    -- Counter proposal details
    proposed_date TIMESTAMP WITH TIME ZONE NOT NULL,
    proposed_duration INTEGER NOT NULL,
    reason TEXT,
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    response_deadline TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '4 hours'),
    
    responded_by UUID REFERENCES auth.users(id),
    responded_at TIMESTAMP WITH TIME ZONE,
    response_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reschedule_requests_lesson_id ON session_reschedule_requests(lesson_id);
CREATE INDEX IF NOT EXISTS idx_reschedule_requests_status ON session_reschedule_requests(status);
CREATE INDEX IF NOT EXISTS idx_reschedule_requests_deadline ON session_reschedule_requests(response_deadline);
CREATE INDEX IF NOT EXISTS idx_change_history_lesson_id ON session_change_history(lesson_id);
CREATE INDEX IF NOT EXISTS idx_counter_proposals_request_id ON counter_proposals(original_request_id);

-- 6. Create function to automatically create change history entries
CREATE OR REPLACE FUNCTION create_session_change_history()
RETURNS TRIGGER AS $$
BEGIN
    -- For UPDATE operations, log the change
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO session_change_history (
            lesson_id,
            change_type,
            changed_by,
            old_values,
            new_values,
            reason
        ) VALUES (
            NEW.id,
            CASE 
                WHEN OLD.detailed_status != NEW.detailed_status THEN 'status_changed'
                WHEN OLD.scheduled_at != NEW.scheduled_at THEN 'rescheduled'
                ELSE 'updated'
            END,
            COALESCE(NEW.last_modified_by, auth.uid()),
            to_jsonb(OLD),
            to_jsonb(NEW),
            NEW.notes
        );
    END IF;
    
    -- For INSERT operations, log creation
    IF TG_OP = 'INSERT' THEN
        INSERT INTO session_change_history (
            lesson_id,
            change_type,
            changed_by,
            new_values,
            reason
        ) VALUES (
            NEW.id,
            'created',
            COALESCE(NEW.last_modified_by, auth.uid()),
            to_jsonb(NEW),
            'Session created'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create trigger for automatic change history
DROP TRIGGER IF EXISTS trigger_session_change_history ON lessons;
CREATE TRIGGER trigger_session_change_history
    AFTER INSERT OR UPDATE ON lessons
    FOR EACH ROW
    EXECUTE FUNCTION create_session_change_history();

-- 8. Create function to check if reschedule is within 24 hours
CREATE OR REPLACE FUNCTION is_within_24_hours(lesson_date TIMESTAMP WITH TIME ZONE)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN lesson_date <= (NOW() + INTERVAL '24 hours');
END;
$$ LANGUAGE plpgsql;

-- 9. Create function to check if cancellation is within 4 hours
CREATE OR REPLACE FUNCTION is_within_4_hours(lesson_date TIMESTAMP WITH TIME ZONE)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN lesson_date <= (NOW() + INTERVAL '4 hours');
END;
$$ LANGUAGE plpgsql;

-- 10. Create function to auto-escalate expired requests
CREATE OR REPLACE FUNCTION escalate_expired_requests()
RETURNS void AS $$
BEGIN
    -- Update expired requests that haven't been escalated
    UPDATE session_reschedule_requests 
    SET 
        admin_escalated = true,
        admin_escalated_at = NOW(),
        status = 'admin_required'
    WHERE 
        status = 'pending' 
        AND response_deadline < NOW()
        AND admin_escalated = false;
        
    -- Similarly for counter proposals
    UPDATE counter_proposals 
    SET status = 'expired'
    WHERE 
        status = 'pending' 
        AND response_deadline < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Create function to automatically mark sessions as lost
CREATE OR REPLACE FUNCTION mark_sessions_as_lost()
RETURNS void AS $$
BEGIN
    -- Mark sessions as lost if cancelled within 4 hours
    UPDATE lessons 
    SET 
        detailed_status = 'lost',
        last_modified_by = (
            SELECT requested_by 
            FROM session_reschedule_requests 
            WHERE lesson_id = lessons.id 
            AND request_type = 'cancel' 
            ORDER BY created_at DESC 
            LIMIT 1
        )
    WHERE id IN (
        SELECT l.id 
        FROM lessons l
        JOIN session_reschedule_requests srr ON l.id = srr.lesson_id
        WHERE srr.request_type = 'cancel'
        AND srr.status = 'approved'
        AND is_within_4_hours(l.scheduled_at)
        AND l.detailed_status != 'lost'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Enable RLS (Row Level Security)
ALTER TABLE session_reschedule_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_change_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE counter_proposals ENABLE ROW LEVEL SECURITY;

-- 13. Create RLS policies for session_reschedule_requests
DROP POLICY IF EXISTS "Users can view their own reschedule requests" ON session_reschedule_requests;
CREATE POLICY "Users can view their own reschedule requests" ON session_reschedule_requests
    FOR SELECT USING (
        requested_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM lessons 
            WHERE lessons.id = session_reschedule_requests.lesson_id 
            AND (lessons.student_id = auth.uid() OR lessons.tutor_id = auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Users can create reschedule requests for their sessions" ON session_reschedule_requests;
CREATE POLICY "Users can create reschedule requests for their sessions" ON session_reschedule_requests
    FOR INSERT WITH CHECK (
        requested_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM lessons 
            WHERE lessons.id = session_reschedule_requests.lesson_id 
            AND (lessons.student_id = auth.uid() OR lessons.tutor_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Admins can manage all reschedule requests" ON session_reschedule_requests;
CREATE POLICY "Admins can manage all reschedule requests" ON session_reschedule_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- 14. Create RLS policies for session_change_history
DROP POLICY IF EXISTS "Users can view history for their sessions" ON session_change_history;
CREATE POLICY "Users can view history for their sessions" ON session_change_history
    FOR SELECT USING (
        changed_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM lessons 
            WHERE lessons.id = session_change_history.lesson_id 
            AND (lessons.student_id = auth.uid() OR lessons.tutor_id = auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- 15. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON session_reschedule_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON session_change_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON counter_proposals TO authenticated;
GRANT EXECUTE ON FUNCTION is_within_24_hours(TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION is_within_4_hours(TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION escalate_expired_requests() TO authenticated;
GRANT EXECUTE ON FUNCTION mark_sessions_as_lost() TO authenticated;

-- 16. Create indexes for lessons table new columns
CREATE INDEX IF NOT EXISTS idx_lessons_detailed_status ON lessons(detailed_status);
CREATE INDEX IF NOT EXISTS idx_lessons_scheduled_at ON lessons(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_lessons_last_modified_by ON lessons(last_modified_by);

-- Verify the schema was created successfully
SELECT 'Session management schema created successfully!' as status;