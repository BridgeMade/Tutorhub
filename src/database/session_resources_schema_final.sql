-- Session Resources Integration Schema (Final Fixed Version)
-- This schema enables linking resources to tutoring sessions for preparation, reference, and follow-up
-- Fixed PostgreSQL syntax errors

-- Table for session-resource assignments
CREATE TABLE IF NOT EXISTS session_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES profiles(id),
    assignment_type TEXT NOT NULL CHECK (assignment_type IN ('preparation', 'reference', 'homework', 'follow_up')),
    is_required BOOLEAN NOT NULL DEFAULT false,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    
    -- Ensure no duplicate assignments
    UNIQUE(session_id, resource_id),
    
    -- Indexes for performance
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient queries (only create if they don't exist)
CREATE INDEX IF NOT EXISTS idx_session_resources_session_id ON session_resources(session_id);
CREATE INDEX IF NOT EXISTS idx_session_resources_resource_id ON session_resources(resource_id);
CREATE INDEX IF NOT EXISTS idx_session_resources_assigned_by ON session_resources(assigned_by);
CREATE INDEX IF NOT EXISTS idx_session_resources_assignment_type ON session_resources(assignment_type);
CREATE INDEX IF NOT EXISTS idx_session_resources_assigned_at ON session_resources(assigned_at);

-- Resource access tracking for sessions
CREATE TABLE IF NOT EXISTS session_resource_access (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_resource_id UUID NOT NULL REFERENCES session_resources(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id),
    access_type TEXT NOT NULL CHECK (access_type IN ('view', 'download', 'complete')),
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    time_spent_minutes INTEGER,
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for session resource access
CREATE INDEX IF NOT EXISTS idx_session_resource_access_session_resource_id ON session_resource_access(session_resource_id);
CREATE INDEX IF NOT EXISTS idx_session_resource_access_user_id ON session_resource_access(user_id);
CREATE INDEX IF NOT EXISTS idx_session_resource_access_type ON session_resource_access(access_type);
CREATE INDEX IF NOT EXISTS idx_session_resource_access_accessed_at ON session_resource_access(accessed_at);

-- Session resource recommendations cache
CREATE TABLE IF NOT EXISTS session_resource_suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    suggestion_type TEXT NOT NULL CHECK (suggestion_type IN ('preparation', 'follow_up', 'similar')),
    relevance_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    reason TEXT,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate suggestions
    UNIQUE(session_id, resource_id, suggestion_type),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for suggestions
CREATE INDEX IF NOT EXISTS idx_session_resource_suggestions_session_id ON session_resource_suggestions(session_id);
CREATE INDEX IF NOT EXISTS idx_session_resource_suggestions_resource_id ON session_resource_suggestions(resource_id);
CREATE INDEX IF NOT EXISTS idx_session_resource_suggestions_type ON session_resource_suggestions(suggestion_type);
CREATE INDEX IF NOT EXISTS idx_session_resource_suggestions_score ON session_resource_suggestions(relevance_score DESC);

-- Trigger to update updated_at timestamp (only create if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_session_resources_updated_at'
    ) THEN
        CREATE TRIGGER update_session_resources_updated_at 
            BEFORE UPDATE ON session_resources 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;

-- RLS Policies for session_resources
ALTER TABLE session_resources ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS session_resources_student_read ON session_resources;
DROP POLICY IF EXISTS session_resources_tutor_full ON session_resources;
DROP POLICY IF EXISTS session_resources_tutor_assign ON session_resources;
DROP POLICY IF EXISTS session_resources_admin_full ON session_resources;

-- Students can view resources assigned to their sessions
CREATE POLICY session_resources_student_read ON session_resources
    FOR SELECT USING (
        session_id IN (
            SELECT id FROM lessons 
            WHERE student_id = auth.uid()
        )
    );

-- Tutors can view and manage resources for their sessions
CREATE POLICY session_resources_tutor_full ON session_resources
    FOR ALL USING (
        session_id IN (
            SELECT id FROM lessons 
            WHERE tutor_id = auth.uid()
        )
    );

-- Tutors can assign resources to any session they're part of
CREATE POLICY session_resources_tutor_assign ON session_resources
    FOR INSERT WITH CHECK (
        assigned_by = auth.uid() AND
        session_id IN (
            SELECT id FROM lessons 
            WHERE tutor_id = auth.uid()
        )
    );

-- Admin full access
CREATE POLICY session_resources_admin_full ON session_resources
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for session_resource_access
ALTER TABLE session_resource_access ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS session_resource_access_own ON session_resource_access;
DROP POLICY IF EXISTS session_resource_access_create ON session_resource_access;
DROP POLICY IF EXISTS session_resource_access_tutor_view ON session_resource_access;
DROP POLICY IF EXISTS session_resource_access_admin ON session_resource_access;

-- Users can view their own access logs
CREATE POLICY session_resource_access_own ON session_resource_access
    FOR SELECT USING (user_id = auth.uid());

-- Users can create their own access logs
CREATE POLICY session_resource_access_create ON session_resource_access
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Tutors can view access logs for their assigned resources
CREATE POLICY session_resource_access_tutor_view ON session_resource_access
    FOR SELECT USING (
        session_resource_id IN (
            SELECT sr.id FROM session_resources sr
            JOIN lessons l ON sr.session_id = l.id
            WHERE l.tutor_id = auth.uid()
        )
    );

-- Admin full access to access logs
CREATE POLICY session_resource_access_admin ON session_resource_access
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for session_resource_suggestions
ALTER TABLE session_resource_suggestions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS session_resource_suggestions_participants ON session_resource_suggestions;
DROP POLICY IF EXISTS session_resource_suggestions_tutor_create ON session_resource_suggestions;
DROP POLICY IF EXISTS session_resource_suggestions_admin ON session_resource_suggestions;

-- Students and tutors can view suggestions for their sessions
CREATE POLICY session_resource_suggestions_participants ON session_resource_suggestions
    FOR SELECT USING (
        session_id IN (
            SELECT id FROM lessons 
            WHERE student_id = auth.uid() OR tutor_id = auth.uid()
        )
    );

-- Only tutors can create suggestions (through the service)
CREATE POLICY session_resource_suggestions_tutor_create ON session_resource_suggestions
    FOR INSERT WITH CHECK (
        session_id IN (
            SELECT id FROM lessons 
            WHERE tutor_id = auth.uid()
        )
    );

-- Admin full access to suggestions
CREATE POLICY session_resource_suggestions_admin ON session_resource_suggestions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Function to get session resource statistics
CREATE OR REPLACE FUNCTION get_session_resource_stats(p_session_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_resources', COUNT(*),
        'required_resources', COUNT(*) FILTER (WHERE is_required = true),
        'by_type', json_object_agg(assignment_type, type_count),
        'total_estimated_time', SUM(COALESCE(r.estimated_time_minutes, 0))
    ) INTO result
    FROM session_resources sr
    JOIN resources r ON sr.resource_id = r.id
    LEFT JOIN (
        SELECT assignment_type, COUNT(*) as type_count
        FROM session_resources
        WHERE session_id = p_session_id
        GROUP BY assignment_type
    ) type_stats ON sr.assignment_type = type_stats.assignment_type
    WHERE sr.session_id = p_session_id;
    
    RETURN COALESCE(result, '{"total_resources": 0, "required_resources": 0, "by_type": {}, "total_estimated_time": 0}'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate automatic resource suggestions for a session (Fixed Version)
CREATE OR REPLACE FUNCTION generate_session_resource_suggestions(p_session_id UUID)
RETURNS INTEGER AS $$
DECLARE
    session_record RECORD;
    suggestion_count INTEGER := 0;
    temp_count INTEGER := 0;
BEGIN
    -- Get session details
    SELECT l.*, s.name as subject_name, p.grade_level
    INTO session_record
    FROM lessons l
    JOIN subjects s ON l.subject_id = s.id
    JOIN profiles p ON l.student_id = p.id
    WHERE l.id = p_session_id;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- Clear existing suggestions
    DELETE FROM session_resource_suggestions WHERE session_id = p_session_id;
    
    -- Insert preparation suggestions (resources that match subject and grade)
    INSERT INTO session_resource_suggestions (session_id, resource_id, suggestion_type, relevance_score, reason)
    SELECT 
        p_session_id,
        r.id,
        'preparation',
        (
            CASE WHEN r.rating_average > 4.0 THEN 20 ELSE 0 END +
            CASE WHEN r.download_count > 50 THEN 15 ELSE 0 END +
            CASE WHEN r.difficulty_level = 'beginner' THEN 10 ELSE 0 END +
            CASE WHEN r.estimated_time_minutes <= 60 THEN 10 ELSE 0 END
        ) as relevance_score,
        CASE 
            WHEN r.estimated_time_minutes <= 30 THEN 'Quick preparation material'
            WHEN r.rating_average > 4.0 THEN 'Highly rated preparation resource'
            WHEN r.difficulty_level = 'beginner' THEN 'Good foundation material'
            ELSE 'Recommended for session preparation'
        END as reason
    FROM resources r
    JOIN grade_levels gl ON r.grade_level_id = gl.id
    WHERE r.subject_id = session_record.subject_id
      AND gl.grade_number = session_record.grade_level
      AND r.status = 'active'
      AND r.visibility = 'public'
    ORDER BY relevance_score DESC
    LIMIT 5;
    
    -- Get count using proper PostgreSQL syntax
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    suggestion_count := temp_count;
    
    -- Insert follow-up suggestions (slightly more advanced resources)
    INSERT INTO session_resource_suggestions (session_id, resource_id, suggestion_type, relevance_score, reason)
    SELECT 
        p_session_id,
        r.id,
        'follow_up',
        (
            CASE WHEN r.rating_average > 4.0 THEN 20 ELSE 0 END +
            CASE WHEN r.download_count > 50 THEN 15 ELSE 0 END +
            CASE WHEN r.difficulty_level = 'intermediate' THEN 15 ELSE 0 END +
            CASE WHEN r.estimated_time_minutes BETWEEN 30 AND 90 THEN 10 ELSE 0 END
        ) as relevance_score,
        CASE 
            WHEN r.difficulty_level = 'intermediate' THEN 'Builds on session concepts'
            WHEN r.rating_average > 4.0 THEN 'Highly rated follow-up material'
            ELSE 'Recommended for continued learning'
        END as reason
    FROM resources r
    JOIN grade_levels gl ON r.grade_level_id = gl.id
    WHERE r.subject_id = session_record.subject_id
      AND gl.grade_number BETWEEN session_record.grade_level AND (session_record.grade_level + 1)
      AND r.status = 'active'
      AND r.visibility = 'public'
      AND r.id NOT IN (
          SELECT resource_id FROM session_resource_suggestions 
          WHERE session_id = p_session_id
      )
    ORDER BY relevance_score DESC
    LIMIT 3;
    
    -- Add the follow-up count using proper syntax
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    suggestion_count := suggestion_count + temp_count;
    
    RETURN suggestion_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track resource access during sessions
CREATE OR REPLACE FUNCTION track_session_resource_access(
    p_session_resource_id UUID,
    p_user_id UUID,
    p_access_type TEXT,
    p_time_spent_minutes INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO session_resource_access (
        session_resource_id,
        user_id,
        access_type,
        time_spent_minutes
    ) VALUES (
        p_session_resource_id,
        p_user_id,
        p_access_type,
        p_time_spent_minutes
    );
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON session_resources TO authenticated;
GRANT SELECT, INSERT ON session_resource_access TO authenticated;
GRANT SELECT, INSERT, DELETE ON session_resource_suggestions TO authenticated;
GRANT EXECUTE ON FUNCTION get_session_resource_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_session_resource_suggestions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION track_session_resource_access(UUID, UUID, TEXT, INTEGER) TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE session_resources IS 'Links learning resources to tutoring sessions for preparation, reference, and follow-up';
COMMENT ON TABLE session_resource_access IS 'Tracks how students and tutors access session-linked resources';
COMMENT ON TABLE session_resource_suggestions IS 'Automated suggestions for resources relevant to specific sessions';

COMMENT ON COLUMN session_resources.assignment_type IS 'Type of resource assignment: preparation (before session), reference (during session), homework (assigned during), follow_up (after session)';
COMMENT ON COLUMN session_resources.is_required IS 'Whether the student must complete this resource before/after the session';
COMMENT ON COLUMN session_resource_access.time_spent_minutes IS 'How long the user spent with the resource (when trackable)';
COMMENT ON COLUMN session_resource_suggestions.relevance_score IS 'Algorithmic score indicating how relevant this resource is to the session (0-100)';

-- Success message
SELECT 'Session Resources Schema installed successfully! ✅' as status;