-- Session Cancellation and Automatic Loss System
-- This schema implements the 4-hour cancellation rule and session loss tracking
-- Run this in your Supabase SQL editor

-- ============================================================================
-- SESSION CANCELLATION TRACKING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS session_cancellations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    cancelled_by UUID NOT NULL REFERENCES auth.users(id),
    cancellation_type VARCHAR(20) NOT NULL CHECK (cancellation_type IN (
        'student_early',     -- Student cancelled more than 4 hours before
        'student_late',      -- Student cancelled within 4 hours (session lost)
        'tutor_early',       -- Tutor cancelled more than 4 hours before
        'tutor_late',        -- Tutor cancelled within 4 hours (compensation required)
        'mutual',            -- Both parties agreed to cancel
        'admin_override',    -- Admin cancelled the session
        'emergency'          -- Emergency cancellation with special handling
    )),
    cancellation_reason TEXT NOT NULL,
    hours_before_session DECIMAL(4,2) NOT NULL, -- Hours between cancellation and scheduled time
    session_lost BOOLEAN DEFAULT false, -- Whether the session was lost due to late cancellation
    compensation_required BOOLEAN DEFAULT false, -- Whether compensation is required
    emergency_verified BOOLEAN DEFAULT false, -- For emergency cancellations
    verified_by UUID REFERENCES auth.users(id), -- Admin who verified emergency
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SESSION LOSS TRACKING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS session_losses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES auth.users(id),
    tutor_id UUID NOT NULL REFERENCES auth.users(id),
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    cancellation_id UUID NOT NULL REFERENCES session_cancellations(id),
    loss_type VARCHAR(20) NOT NULL CHECK (loss_type IN (
        'late_cancellation', -- Student cancelled within 4 hours
        'no_show',          -- Student didn't show up
        'admin_penalty'     -- Admin-imposed penalty
    )),
    original_scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    original_duration INTEGER NOT NULL,
    loss_amount DECIMAL(10,2), -- Financial impact if applicable
    recovery_eligible BOOLEAN DEFAULT false, -- Can the session be recovered
    recovery_deadline TIMESTAMP WITH TIME ZONE, -- Deadline for recovery
    recovery_completed BOOLEAN DEFAULT false,
    recovery_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_session_cancellations_lesson_id ON session_cancellations(lesson_id);
CREATE INDEX IF NOT EXISTS idx_session_cancellations_cancelled_by ON session_cancellations(cancelled_by);
CREATE INDEX IF NOT EXISTS idx_session_cancellations_type ON session_cancellations(cancellation_type);
CREATE INDEX IF NOT EXISTS idx_session_cancellations_session_lost ON session_cancellations(session_lost) WHERE session_lost = true;

CREATE INDEX IF NOT EXISTS idx_session_losses_student_id ON session_losses(student_id);
CREATE INDEX IF NOT EXISTS idx_session_losses_tutor_id ON session_losses(tutor_id);
CREATE INDEX IF NOT EXISTS idx_session_losses_lesson_id ON session_losses(lesson_id);
CREATE INDEX IF NOT EXISTS idx_session_losses_type ON session_losses(loss_type);
CREATE INDEX IF NOT EXISTS idx_session_losses_recovery ON session_losses(recovery_eligible) WHERE recovery_eligible = true;

-- ============================================================================
-- BUSINESS LOGIC FUNCTIONS
-- ============================================================================

-- Function to calculate hours between cancellation and session
CREATE OR REPLACE FUNCTION calculate_hours_before_session(
    p_scheduled_at TIMESTAMP WITH TIME ZONE,
    p_cancellation_time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS DECIMAL(4,2) AS $$
BEGIN
    RETURN EXTRACT(EPOCH FROM (p_scheduled_at - p_cancellation_time)) / 3600.0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to determine cancellation type based on timing and user role
CREATE OR REPLACE FUNCTION determine_cancellation_type(
    p_hours_before DECIMAL(4,2),
    p_cancelled_by UUID,
    p_lesson_id UUID,
    p_is_emergency BOOLEAN DEFAULT false
)
RETURNS VARCHAR(20) AS $$
DECLARE
    v_lesson RECORD;
    v_is_student BOOLEAN;
    v_is_tutor BOOLEAN;
BEGIN
    -- Get lesson details
    SELECT student_id, tutor_id INTO v_lesson
    FROM lessons WHERE id = p_lesson_id;
    
    -- Determine user role
    v_is_student := (v_lesson.student_id = p_cancelled_by);
    v_is_tutor := (v_lesson.tutor_id = p_cancelled_by);
    
    -- Handle emergency cancellations
    IF p_is_emergency THEN
        RETURN 'emergency';
    END IF;
    
    -- Handle admin cancellations
    IF NOT v_is_student AND NOT v_is_tutor THEN
        RETURN 'admin_override';
    END IF;
    
    -- Apply 4-hour rule
    IF p_hours_before < 4.0 THEN
        -- Late cancellation (within 4 hours)
        IF v_is_student THEN
            RETURN 'student_late';
        ELSE
            RETURN 'tutor_late';
        END IF;
    ELSE
        -- Early cancellation (more than 4 hours)
        IF v_is_student THEN
            RETURN 'student_early';
        ELSE
            RETURN 'tutor_early';
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Main function to cancel a session with automatic loss calculation
CREATE OR REPLACE FUNCTION cancel_session_with_loss_tracking(
    p_lesson_id UUID,
    p_cancelled_by UUID,
    p_reason TEXT,
    p_is_emergency BOOLEAN DEFAULT false,
    p_verified_by UUID DEFAULT NULL
)
RETURNS TABLE (
    cancellation_id UUID,
    session_lost BOOLEAN,
    loss_id UUID,
    hours_before DECIMAL(4,2),
    cancellation_type VARCHAR(20)
) AS $$
DECLARE
    v_lesson RECORD;
    v_hours_before DECIMAL(4,2);
    v_cancellation_type VARCHAR(20);
    v_session_lost BOOLEAN := false;
    v_compensation_required BOOLEAN := false;
    v_cancellation_id UUID;
    v_loss_id UUID := NULL;
    v_emergency_verified BOOLEAN := false;
BEGIN
    -- Get lesson details
    SELECT * INTO v_lesson
    FROM lessons 
    WHERE id = p_lesson_id AND status IN ('scheduled', 'confirmed');
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Lesson not found or cannot be cancelled (status: %)', 
            (SELECT status FROM lessons WHERE id = p_lesson_id);
    END IF;
    
    -- Calculate hours before session
    v_hours_before := calculate_hours_before_session(v_lesson.scheduled_at);
    
    -- Determine cancellation type
    v_cancellation_type := determine_cancellation_type(
        v_hours_before, 
        p_cancelled_by, 
        p_lesson_id, 
        p_is_emergency
    );
    
    -- Determine if session is lost and compensation required
    CASE v_cancellation_type
        WHEN 'student_late' THEN
            v_session_lost := true;
        WHEN 'tutor_late' THEN
            v_compensation_required := true;
        WHEN 'emergency' THEN
            v_emergency_verified := (p_verified_by IS NOT NULL);
            -- Emergency cancellations don't result in loss if verified
            v_session_lost := NOT v_emergency_verified;
        ELSE
            v_session_lost := false;
    END CASE;
    
    -- Insert cancellation record
    INSERT INTO session_cancellations (
        lesson_id,
        cancelled_by,
        cancellation_type,
        cancellation_reason,
        hours_before_session,
        session_lost,
        compensation_required,
        emergency_verified,
        verified_by
    ) VALUES (
        p_lesson_id,
        p_cancelled_by,
        v_cancellation_type,
        p_reason,
        v_hours_before,
        v_session_lost,
        v_compensation_required,
        v_emergency_verified,
        p_verified_by
    ) RETURNING id INTO v_cancellation_id;
    
    -- If session is lost, create loss record
    IF v_session_lost THEN
        INSERT INTO session_losses (
            student_id,
            tutor_id,
            lesson_id,
            cancellation_id,
            loss_type,
            original_scheduled_at,
            original_duration,
            recovery_eligible,
            recovery_deadline
        ) VALUES (
            v_lesson.student_id,
            v_lesson.tutor_id,
            p_lesson_id,
            v_cancellation_id,
            CASE 
                WHEN v_cancellation_type = 'student_late' THEN 'late_cancellation'
                ELSE 'admin_penalty'
            END,
            v_lesson.scheduled_at,
            v_lesson.duration_minutes,
            (v_cancellation_type = 'emergency' AND NOT v_emergency_verified), -- Emergency cancellations can be recovered
            CASE 
                WHEN v_cancellation_type = 'emergency' THEN NOW() + INTERVAL '7 days'
                ELSE NULL
            END
        ) RETURNING id INTO v_loss_id;
    END IF;
    
    -- Update lesson status
    UPDATE lessons 
    SET 
        status = 'cancelled',
        notes = COALESCE(notes, '') || E'\n' || 
                'Cancelled: ' || v_cancellation_type || 
                CASE WHEN v_session_lost THEN ' (SESSION LOST)' ELSE '' END,
        updated_at = NOW()
    WHERE id = p_lesson_id;
    
    -- Create audit trail entry
    INSERT INTO session_audit_trail (
        lesson_id,
        action_type,
        entity_type,
        entity_id,
        performed_by,
        changes_summary,
        reason,
        metadata
    ) VALUES (
        p_lesson_id,
        'cancelled',
        'lesson',
        p_lesson_id::VARCHAR,
        p_cancelled_by,
        'Session cancelled: ' || v_cancellation_type,
        p_reason,
        jsonb_build_object(
            'cancellation_type', v_cancellation_type,
            'hours_before_session', v_hours_before,
            'session_lost', v_session_lost,
            'compensation_required', v_compensation_required,
            'is_emergency', p_is_emergency
        )
    );
    
    -- Return results
    RETURN QUERY SELECT 
        v_cancellation_id,
        v_session_lost,
        v_loss_id,
        v_hours_before,
        v_cancellation_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- HELPER FUNCTIONS FOR UI
-- ============================================================================

-- Function to check if cancellation will result in session loss
CREATE OR REPLACE FUNCTION will_cancellation_result_in_loss(
    p_lesson_id UUID,
    p_user_id UUID
)
RETURNS TABLE (
    will_lose_session BOOLEAN,
    hours_remaining DECIMAL(4,2),
    warning_message TEXT
) AS $$
DECLARE
    v_lesson RECORD;
    v_hours_before DECIMAL(4,2);
    v_is_student BOOLEAN;
BEGIN
    -- Get lesson details
    SELECT student_id, tutor_id, scheduled_at, status
    INTO v_lesson
    FROM lessons 
    WHERE id = p_lesson_id;
    
    IF NOT FOUND OR v_lesson.status NOT IN ('scheduled', 'confirmed') THEN
        RETURN QUERY SELECT false, 0.0::DECIMAL(4,2), 'Lesson cannot be cancelled'::TEXT;
        RETURN;
    END IF;
    
    -- Calculate hours before session
    v_hours_before := calculate_hours_before_session(v_lesson.scheduled_at);
    v_is_student := (v_lesson.student_id = p_user_id);
    
    -- Determine if cancellation will result in loss
    IF v_is_student AND v_hours_before < 4.0 THEN
        RETURN QUERY SELECT 
            true,
            v_hours_before,
            CASE 
                WHEN v_hours_before < 1.0 THEN 
                    'WARNING: Cancelling now will result in session loss (less than 1 hour notice)'
                WHEN v_hours_before < 2.0 THEN 
                    'WARNING: Cancelling now will result in session loss (less than 2 hours notice)'
                ELSE 
                    'WARNING: Cancelling now will result in session loss (less than 4 hours notice)'
            END;
    ELSE
        RETURN QUERY SELECT 
            false,
            v_hours_before,
            CASE 
                WHEN v_is_student THEN 
                    'Session can be cancelled without penalty'
                ELSE 
                    'Tutor cancellation - compensation may be required if within 4 hours'
            END;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get session loss statistics for a user
CREATE OR REPLACE FUNCTION get_user_session_loss_stats(
    p_user_id UUID,
    p_months_back INTEGER DEFAULT 6
)
RETURNS TABLE (
    total_losses INTEGER,
    late_cancellations INTEGER,
    no_shows INTEGER,
    admin_penalties INTEGER,
    recoverable_losses INTEGER,
    financial_impact DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_losses,
        COUNT(*) FILTER (WHERE loss_type = 'late_cancellation')::INTEGER as late_cancellations,
        COUNT(*) FILTER (WHERE loss_type = 'no_show')::INTEGER as no_shows,
        COUNT(*) FILTER (WHERE loss_type = 'admin_penalty')::INTEGER as admin_penalties,
        COUNT(*) FILTER (WHERE recovery_eligible = true AND NOT recovery_completed)::INTEGER as recoverable_losses,
        COALESCE(SUM(loss_amount), 0) as financial_impact
    FROM session_losses
    WHERE student_id = p_user_id
    AND created_at >= NOW() - (p_months_back || ' months')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
ALTER TABLE session_cancellations ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_losses ENABLE ROW LEVEL SECURITY;

-- Policies for session_cancellations
DROP POLICY IF EXISTS "Users can view related cancellations" ON session_cancellations;
CREATE POLICY "Users can view related cancellations" ON session_cancellations
    FOR SELECT USING (
        cancelled_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM lessons l
            JOIN students s ON l.student_id = s.id
            JOIN tutors t ON l.tutor_id = t.id
            WHERE l.id = lesson_id
            AND (s.user_id = auth.uid() OR t.user_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "System can create cancellations" ON session_cancellations;
CREATE POLICY "System can create cancellations" ON session_cancellations
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can manage all cancellations" ON session_cancellations;
CREATE POLICY "Admins can manage all cancellations" ON session_cancellations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policies for session_losses
DROP POLICY IF EXISTS "Users can view own losses" ON session_losses;
CREATE POLICY "Users can view own losses" ON session_losses
    FOR SELECT USING (student_id = auth.uid() OR tutor_id = auth.uid());

DROP POLICY IF EXISTS "System can create losses" ON session_losses;
CREATE POLICY "System can create losses" ON session_losses
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can manage all losses" ON session_losses;
CREATE POLICY "Admins can manage all losses" ON session_losses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant access to functions
GRANT EXECUTE ON FUNCTION calculate_hours_before_session(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION determine_cancellation_type(DECIMAL(4,2), UUID, UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_session_with_loss_tracking(UUID, UUID, TEXT, BOOLEAN, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION will_cancellation_result_in_loss(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_session_loss_stats(UUID, INTEGER) TO authenticated;

-- Grant table access
GRANT SELECT, INSERT, UPDATE ON session_cancellations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON session_losses TO authenticated;

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Create trigger for session_cancellations
CREATE OR REPLACE FUNCTION update_cancellation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_session_cancellations_updated_at ON session_cancellations;
CREATE TRIGGER update_session_cancellations_updated_at
    BEFORE UPDATE ON session_cancellations
    FOR EACH ROW
    EXECUTE FUNCTION update_cancellation_updated_at();

-- Create trigger for session_losses
CREATE OR REPLACE FUNCTION update_loss_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_session_losses_updated_at ON session_losses;
CREATE TRIGGER update_session_losses_updated_at
    BEFORE UPDATE ON session_losses
    FOR EACH ROW
    EXECUTE FUNCTION update_loss_updated_at();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify the schema was created successfully
SELECT 'Session cancellation and automatic loss system created successfully!' as status;

-- Show available functions
SELECT 'Available cancellation functions:' as info;
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND (routine_name LIKE '%cancel%' OR routine_name LIKE '%loss%')
AND routine_type = 'FUNCTION';