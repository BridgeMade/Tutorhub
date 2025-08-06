-- TutorHub Student Resources System Database Schema
-- Comprehensive resource management with grade 1-12 support
-- Supports worksheets, assignments, tests, learning materials, and tutor resources

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- RESOURCE CATEGORIES AND ORGANIZATION
-- =============================================

-- Grade levels (1-12)
CREATE TABLE IF NOT EXISTS grade_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grade_number INTEGER NOT NULL UNIQUE CHECK (grade_number >= 1 AND grade_number <= 12),
    grade_name TEXT NOT NULL, -- e.g., "Grade 1", "Grade 12"
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert grade levels 1-12
INSERT INTO grade_levels (grade_number, grade_name, description) VALUES
(1, 'Grade 1', 'Foundation year - basic literacy and numeracy'),
(2, 'Grade 2', 'Elementary education - building fundamental skills'),
(3, 'Grade 3', 'Elementary education - expanding core concepts'),
(4, 'Grade 4', 'Elementary education - intermediate foundation'),
(5, 'Grade 5', 'Elementary education - advanced foundation'),
(6, 'Grade 6', 'Middle school preparation'),
(7, 'Grade 7', 'Junior secondary education'),
(8, 'Grade 8', 'Junior secondary education'),
(9, 'Grade 9', 'Senior secondary education'),
(10, 'Grade 10', 'Senior secondary education'),
(11, 'Grade 11', 'Pre-university preparation'),
(12, 'Grade 12', 'University preparation and final year')
ON CONFLICT (grade_number) DO NOTHING;

-- Resource categories/types
CREATE TABLE IF NOT EXISTS resource_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT, -- Icon name for UI
    color TEXT, -- Color code for UI
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default resource categories
INSERT INTO resource_categories (name, description, icon, color, sort_order) VALUES
('worksheet', 'Practice worksheets and exercises', 'FileText', '#3B82F6', 1),
('topic_explainer', 'Topic explanations and learning guides', 'BookOpen', '#10B981', 2),
('mock_test', 'Practice tests and assessments', 'FileCheck', '#F59E0B', 3),
('homework', 'Student homework submissions', 'Upload', '#8B5CF6', 4),
('assignment', 'Student assignment submissions', 'Folder', '#EF4444', 5),
('test_submission', 'Student test submissions', 'FileX', '#F97316', 6),
('study_guide', 'Comprehensive study materials', 'Bookmark', '#06B6D4', 7),
('video_resource', 'Educational videos and tutorials', 'Play', '#EC4899', 8),
('interactive_tool', 'Interactive learning tools', 'Settings', '#84CC16', 9),
('reference_material', 'Reference books and materials', 'Library', '#6366F1', 10)
ON CONFLICT (name) DO NOTHING;

-- Topics within subjects for better organization
CREATE TABLE IF NOT EXISTS subject_topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    grade_level_id UUID NOT NULL REFERENCES grade_levels(id) ON DELETE CASCADE,
    topic_name TEXT NOT NULL,
    description TEXT,
    learning_objectives TEXT[],
    difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
    estimated_duration_hours INTEGER, -- How long to master this topic
    prerequisite_topics UUID[], -- Array of topic IDs that should be learned first
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(subject_id, grade_level_id, topic_name)
);

-- =============================================
-- MAIN RESOURCES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL, -- Path in storage bucket
    file_size BIGINT, -- File size in bytes
    file_type TEXT NOT NULL, -- MIME type
    file_extension TEXT, -- .pdf, .docx, etc.
    
    -- Classification
    category_id UUID NOT NULL REFERENCES resource_categories(id) ON DELETE RESTRICT,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    grade_level_id UUID NOT NULL REFERENCES grade_levels(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES subject_topics(id) ON DELETE SET NULL,
    
    -- Access and permissions
    uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    uploader_role TEXT NOT NULL CHECK (uploader_role IN ('student', 'tutor', 'admin')),
    visibility TEXT NOT NULL CHECK (visibility IN ('public', 'private', 'restricted')) DEFAULT 'public',
    target_audience TEXT[] DEFAULT ARRAY['student'], -- student, tutor, admin
    
    -- Content metadata
    difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
    estimated_time_minutes INTEGER, -- Time to complete/review
    keywords TEXT[], -- Search keywords
    tags TEXT[], -- Custom tags
    
    -- Relationships
    lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL, -- Link to specific lesson
    assignment_id UUID REFERENCES tutor_student_assignments(id) ON DELETE SET NULL, -- Link to assignment
    parent_resource_id UUID REFERENCES resources(id) ON DELETE SET NULL, -- For versions/revisions
    
    -- Status and approval
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'under_review', 'rejected')),
    approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    
    -- Analytics
    download_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    rating_average DECIMAL(3,2) DEFAULT 0.0,
    rating_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- STUDENT SUBMISSIONS (Homework, Assignments, Tests)
-- =============================================

CREATE TABLE IF NOT EXISTS student_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Submission details
    submission_type TEXT NOT NULL CHECK (submission_type IN ('homework', 'assignment', 'test', 'project', 'essay')),
    title TEXT NOT NULL,
    description TEXT,
    instructions TEXT, -- Original instructions for the work
    
    -- Academic details
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    grade_level_id UUID NOT NULL REFERENCES grade_levels(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES subject_topics(id) ON DELETE SET NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Grading and feedback
    assigned_tutor UUID REFERENCES profiles(id) ON DELETE SET NULL,
    grade_received TEXT, -- A+, B, 85%, etc.
    grade_percentage DECIMAL(5,2), -- Numerical grade
    max_points INTEGER,
    points_earned INTEGER,
    
    -- Status tracking
    status TEXT DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'reviewed', 'graded', 'returned')),
    needs_review BOOLEAN DEFAULT true,
    is_late BOOLEAN DEFAULT false,
    
    -- Tutor feedback
    tutor_feedback TEXT,
    tutor_comments JSONB, -- Structured feedback
    reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    
    -- Additional metadata
    effort_level TEXT CHECK (effort_level IN ('low', 'medium', 'high')),
    completion_percentage INTEGER DEFAULT 100 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    time_spent_minutes INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- RESOURCE ACCESS AND DOWNLOADS
-- =============================================

CREATE TABLE IF NOT EXISTS resource_access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    access_type TEXT NOT NULL CHECK (access_type IN ('view', 'download', 'share')),
    
    -- Context information
    session_info JSONB, -- Browser, device, etc.
    referrer_url TEXT,
    lesson_context UUID REFERENCES lessons(id) ON DELETE SET NULL,
    
    -- Analytics
    duration_seconds INTEGER, -- Time spent viewing
    completed BOOLEAN DEFAULT false, -- For videos, documents, etc.
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- RESOURCE RATINGS AND REVIEWS
-- =============================================

CREATE TABLE IF NOT EXISTS resource_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    is_helpful BOOLEAN,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(resource_id, user_id)
);

-- =============================================
-- RESOURCE COLLECTIONS AND PLAYLISTS
-- =============================================

CREATE TABLE IF NOT EXISTS resource_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Classification
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    grade_level_id UUID REFERENCES grade_levels(id) ON DELETE SET NULL,
    
    -- Settings
    is_public BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    
    -- Metadata
    resource_count INTEGER DEFAULT 0,
    total_duration_minutes INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS collection_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collection_id UUID NOT NULL REFERENCES resource_collections(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(collection_id, resource_id)
);

-- =============================================
-- RESOURCE SHARING AND COLLABORATION
-- =============================================

CREATE TABLE IF NOT EXISTS resource_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    shared_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    shared_with UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Sharing settings
    permission_level TEXT DEFAULT 'view' CHECK (permission_level IN ('view', 'comment', 'edit')),
    expires_at TIMESTAMP WITH TIME ZONE,
    message TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    accessed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(resource_id, shared_by, shared_with)
);

-- =============================================
-- HOMEWORK AND ASSIGNMENT TRACKING
-- =============================================

CREATE TABLE IF NOT EXISTS homework_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    instructions TEXT NOT NULL,
    
    -- Assignment details
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, -- Tutor who created it
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    grade_level_id UUID NOT NULL REFERENCES grade_levels(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES subject_topics(id) ON DELETE SET NULL,
    
    -- Timing
    assigned_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    estimated_duration_minutes INTEGER,
    
    -- Requirements
    max_points INTEGER DEFAULT 100,
    required_format TEXT[], -- pdf, docx, image, etc.
    max_file_size_mb INTEGER DEFAULT 10,
    allow_late_submission BOOLEAN DEFAULT true,
    late_penalty_percentage DECIMAL(5,2) DEFAULT 0.0,
    
    -- Resources
    reference_resources UUID[], -- Array of resource IDs
    attached_files UUID[], -- Array of resource IDs for assignment materials
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    submission_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bridge table for assignment to student assignments
CREATE TABLE IF NOT EXISTS homework_assignment_students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    homework_assignment_id UUID NOT NULL REFERENCES homework_assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    assignment_id UUID NOT NULL REFERENCES tutor_student_assignments(id) ON DELETE CASCADE,
    
    -- Individual student settings
    custom_due_date TIMESTAMP WITH TIME ZONE,
    custom_instructions TEXT,
    bonus_points INTEGER DEFAULT 0,
    
    -- Status
    is_assigned BOOLEAN DEFAULT true,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(homework_assignment_id, student_id)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Resources table indexes
CREATE INDEX IF NOT EXISTS idx_resources_subject_grade ON resources(subject_id, grade_level_id);
CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category_id);
CREATE INDEX IF NOT EXISTS idx_resources_uploaded_by ON resources(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_resources_status ON resources(status);
CREATE INDEX IF NOT EXISTS idx_resources_visibility ON resources(visibility);
CREATE INDEX IF NOT EXISTS idx_resources_created_at ON resources(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resources_keywords ON resources USING gin(keywords);
CREATE INDEX IF NOT EXISTS idx_resources_tags ON resources USING gin(tags);

-- Student submissions indexes
CREATE INDEX IF NOT EXISTS idx_student_submissions_student ON student_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_student_submissions_tutor ON student_submissions(assigned_tutor);
CREATE INDEX IF NOT EXISTS idx_student_submissions_subject_grade ON student_submissions(subject_id, grade_level_id);
CREATE INDEX IF NOT EXISTS idx_student_submissions_status ON student_submissions(status);
CREATE INDEX IF NOT EXISTS idx_student_submissions_due_date ON student_submissions(due_date);
CREATE INDEX IF NOT EXISTS idx_student_submissions_needs_review ON student_submissions(needs_review) WHERE needs_review = true;

-- Access logs indexes
CREATE INDEX IF NOT EXISTS idx_resource_access_logs_resource ON resource_access_logs(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_access_logs_user ON resource_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_resource_access_logs_created_at ON resource_access_logs(created_at DESC);

-- Subject topics indexes
CREATE INDEX IF NOT EXISTS idx_subject_topics_subject_grade ON subject_topics(subject_id, grade_level_id);
CREATE INDEX IF NOT EXISTS idx_subject_topics_difficulty ON subject_topics(difficulty_level);

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE grade_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework_assignment_students ENABLE ROW LEVEL SECURITY;

-- Grade levels - readable by all authenticated users
CREATE POLICY "Grade levels are readable by all users" ON grade_levels
    FOR SELECT USING (auth.role() = 'authenticated');

-- Resource categories - readable by all authenticated users
CREATE POLICY "Resource categories are readable by all users" ON resource_categories
    FOR SELECT USING (auth.role() = 'authenticated');

-- Subject topics policies
CREATE POLICY "Subject topics are readable by all users" ON subject_topics
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Tutors and admins can manage subject topics" ON subject_topics
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM profiles WHERE role IN ('tutor', 'admin')
        )
    );

-- Resources policies
CREATE POLICY "Public resources are viewable by all" ON resources
    FOR SELECT USING (
        visibility = 'public' OR
        uploaded_by = auth.uid() OR
        auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin') OR
        (visibility = 'restricted' AND auth.uid() IN (
            SELECT shared_with FROM resource_shares 
            WHERE resource_id = resources.id AND is_active = true
        ))
    );

CREATE POLICY "Users can upload resources" ON resources
    FOR INSERT WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can update their own resources" ON resources
    FOR UPDATE USING (
        uploaded_by = auth.uid() OR
        auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
    );

CREATE POLICY "Users can delete their own resources" ON resources
    FOR DELETE USING (
        uploaded_by = auth.uid() OR
        auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
    );

-- Student submissions policies
CREATE POLICY "Students can view their own submissions" ON student_submissions
    FOR SELECT USING (
        student_id = auth.uid() OR
        assigned_tutor = auth.uid() OR
        auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
    );

CREATE POLICY "Students can create their own submissions" ON student_submissions
    FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update their own submissions" ON student_submissions
    FOR UPDATE USING (
        student_id = auth.uid() OR
        assigned_tutor = auth.uid() OR
        auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
    );

-- Resource access logs policies
CREATE POLICY "Users can view their own access logs" ON resource_access_logs
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can log all access" ON resource_access_logs
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Resource ratings policies
CREATE POLICY "Users can view all ratings" ON resource_ratings
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create ratings" ON resource_ratings
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own ratings" ON resource_ratings
    FOR UPDATE USING (user_id = auth.uid());

-- Resource collections policies
CREATE POLICY "Public collections are viewable by all" ON resource_collections
    FOR SELECT USING (
        is_public = true OR
        created_by = auth.uid() OR
        auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
    );

CREATE POLICY "Users can create collections" ON resource_collections
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can manage their own collections" ON resource_collections
    FOR ALL USING (
        created_by = auth.uid() OR
        auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
    );

-- Collection resources policies
CREATE POLICY "Collection resources follow collection permissions" ON collection_resources
    FOR SELECT USING (
        collection_id IN (
            SELECT id FROM resource_collections 
            WHERE is_public = true OR 
                  created_by = auth.uid() OR
                  auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
        )
    );

CREATE POLICY "Collection owners can manage collection resources" ON collection_resources
    FOR ALL USING (
        collection_id IN (
            SELECT id FROM resource_collections 
            WHERE created_by = auth.uid() OR
                  auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
        )
    );

-- Resource shares policies
CREATE POLICY "Users can view shares involving them" ON resource_shares
    FOR SELECT USING (
        shared_by = auth.uid() OR 
        shared_with = auth.uid() OR
        auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
    );

CREATE POLICY "Users can create shares for their resources" ON resource_shares
    FOR INSERT WITH CHECK (
        shared_by = auth.uid() AND
        resource_id IN (
            SELECT id FROM resources 
            WHERE uploaded_by = auth.uid() OR
                  auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
        )
    );

-- Homework assignments policies
CREATE POLICY "Tutors and admins can view homework assignments" ON homework_assignments
    FOR SELECT USING (
        created_by = auth.uid() OR
        auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin') OR
        auth.uid() IN (
            SELECT student_id FROM homework_assignment_students 
            WHERE homework_assignment_id = homework_assignments.id
        )
    );

CREATE POLICY "Tutors can create homework assignments" ON homework_assignments
    FOR INSERT WITH CHECK (
        created_by = auth.uid() AND
        auth.uid() IN (SELECT id FROM profiles WHERE role IN ('tutor', 'admin'))
    );

CREATE POLICY "Tutors can manage their homework assignments" ON homework_assignments
    FOR ALL USING (
        created_by = auth.uid() OR
        auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
    );

-- Homework assignment students policies
CREATE POLICY "Assignment participants can view assignments" ON homework_assignment_students
    FOR SELECT USING (
        student_id = auth.uid() OR
        homework_assignment_id IN (
            SELECT id FROM homework_assignments WHERE created_by = auth.uid()
        ) OR
        auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
    );

CREATE POLICY "Tutors can assign homework to students" ON homework_assignment_students
    FOR INSERT WITH CHECK (
        homework_assignment_id IN (
            SELECT id FROM homework_assignments 
            WHERE created_by = auth.uid() OR
                  auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
        )
    );

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to get user's recommended resources
CREATE OR REPLACE FUNCTION get_recommended_resources(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    resource_id UUID,
    title TEXT,
    description TEXT,
    category_name TEXT,
    subject_name TEXT,
    grade_name TEXT,
    recommendation_score DECIMAL
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Get user's grade and subjects from their profile or recent activities
    RETURN QUERY
    WITH user_context AS (
        SELECT 
            p.grade_level,
            ARRAY_AGG(DISTINCT s.id) as subject_ids
        FROM profiles p
        LEFT JOIN lessons l ON (l.student_id = p.id OR l.tutor_id = p.id)
        LEFT JOIN subjects s ON l.subject_id = s.id
        WHERE p.id = p_user_id
        GROUP BY p.grade_level
    ),
    scored_resources AS (
        SELECT 
            r.id as resource_id,
            r.title,
            r.description,
            rc.name as category_name,
            s.name as subject_name,
            gl.grade_name,
            (
                CASE WHEN r.subject_id = ANY(uc.subject_ids) THEN 3.0 ELSE 1.0 END +
                CASE WHEN gl.grade_number = uc.grade_level THEN 2.0 ELSE 0.0 END +
                CASE WHEN r.rating_average > 4.0 THEN 1.5 ELSE r.rating_average * 0.3 END +
                CASE WHEN r.download_count > 100 THEN 1.0 ELSE r.download_count * 0.01 END
            ) as recommendation_score
        FROM resources r
        JOIN resource_categories rc ON r.category_id = rc.id
        JOIN subjects s ON r.subject_id = s.id
        JOIN grade_levels gl ON r.grade_level_id = gl.id
        CROSS JOIN user_context uc
        WHERE r.status = 'active' 
        AND r.visibility = 'public'
        AND r.id NOT IN (
            SELECT resource_id FROM resource_access_logs 
            WHERE user_id = p_user_id AND access_type = 'download'
        )
    )
    SELECT 
        sr.resource_id,
        sr.title,
        sr.description,
        sr.category_name,
        sr.subject_name,
        sr.grade_name,
        sr.recommendation_score
    FROM scored_resources sr
    ORDER BY sr.recommendation_score DESC
    LIMIT p_limit;
END;
$$;

-- Function to get resource statistics
CREATE OR REPLACE FUNCTION get_resource_stats(p_resource_id UUID)
RETURNS TABLE (
    total_downloads INTEGER,
    total_views INTEGER,
    average_rating DECIMAL,
    rating_count INTEGER,
    recent_activity_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.download_count,
        r.view_count,
        r.rating_average,
        r.rating_count,
        (
            SELECT COUNT(*)::INTEGER 
            FROM resource_access_logs ral 
            WHERE ral.resource_id = p_resource_id 
            AND ral.created_at > NOW() - INTERVAL '7 days'
        ) as recent_activity_count
    FROM resources r
    WHERE r.id = p_resource_id;
END;
$$;

-- Function to search resources with advanced filtering
CREATE OR REPLACE FUNCTION search_resources(
    p_query TEXT DEFAULT '',
    p_subject_ids UUID[] DEFAULT NULL,
    p_grade_levels INTEGER[] DEFAULT NULL,
    p_categories TEXT[] DEFAULT NULL,
    p_difficulty_level TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    resource_id UUID,
    title TEXT,
    description TEXT,
    file_name TEXT,
    category_name TEXT,
    subject_name TEXT,
    grade_name TEXT,
    difficulty_level TEXT,
    rating_average DECIMAL,
    download_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    can_access BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id as resource_id,
        r.title,
        r.description,
        r.file_name,
        rc.name as category_name,
        s.name as subject_name,
        gl.grade_name,
        r.difficulty_level,
        r.rating_average,
        r.download_count,
        r.created_at,
        (
            r.visibility = 'public' OR
            r.uploaded_by = p_user_id OR
            (p_user_id IS NOT NULL AND p_user_id IN (SELECT id FROM profiles WHERE role = 'admin')) OR
            (r.visibility = 'restricted' AND p_user_id IS NOT NULL AND p_user_id IN (
                SELECT shared_with FROM resource_shares 
                WHERE resource_id = r.id AND is_active = true
            ))
        ) as can_access
    FROM resources r
    JOIN resource_categories rc ON r.category_id = rc.id
    JOIN subjects s ON r.subject_id = s.id
    JOIN grade_levels gl ON r.grade_level_id = gl.id
    WHERE r.status = 'active'
    AND (p_query = '' OR (
        r.title ILIKE '%' || p_query || '%' OR
        r.description ILIKE '%' || p_query || '%' OR
        r.keywords && ARRAY[p_query] OR
        r.tags && ARRAY[p_query]
    ))
    AND (p_subject_ids IS NULL OR r.subject_id = ANY(p_subject_ids))
    AND (p_grade_levels IS NULL OR gl.grade_number = ANY(p_grade_levels))
    AND (p_categories IS NULL OR rc.name = ANY(p_categories))
    AND (p_difficulty_level IS NULL OR r.difficulty_level = p_difficulty_level)
    ORDER BY 
        CASE WHEN p_query != '' THEN 
            ts_rank(to_tsvector('english', r.title || ' ' || COALESCE(r.description, '')), plainto_tsquery('english', p_query))
        ELSE 0 END DESC,
        r.rating_average DESC,
        r.download_count DESC,
        r.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Function to update resource stats after access
CREATE OR REPLACE FUNCTION update_resource_access_stats(
    p_resource_id UUID,
    p_access_type TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF p_access_type = 'download' THEN
        UPDATE resources 
        SET download_count = download_count + 1,
            updated_at = NOW()
        WHERE id = p_resource_id;
    ELSIF p_access_type = 'view' THEN
        UPDATE resources 
        SET view_count = view_count + 1,
            updated_at = NOW()
        WHERE id = p_resource_id;
    END IF;
END;
$$;

-- =============================================
-- TRIGGERS
-- =============================================

-- Update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_grade_levels_updated_at BEFORE UPDATE ON grade_levels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resource_categories_updated_at BEFORE UPDATE ON resource_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subject_topics_updated_at BEFORE UPDATE ON subject_topics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_submissions_updated_at BEFORE UPDATE ON student_submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resource_ratings_updated_at BEFORE UPDATE ON resource_ratings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resource_collections_updated_at BEFORE UPDATE ON resource_collections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_homework_assignments_updated_at BEFORE UPDATE ON homework_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- SAMPLE DATA FOR TESTING
-- =============================================

-- Insert some sample topic data for Mathematics Grade 8
DO $$
DECLARE
    math_subject_id UUID;
    grade_8_id UUID;
BEGIN
    -- Get Math subject ID
    SELECT id INTO math_subject_id FROM subjects WHERE name = 'Mathematics' LIMIT 1;
    -- Get Grade 8 ID
    SELECT id INTO grade_8_id FROM grade_levels WHERE grade_number = 8;
    
    IF math_subject_id IS NOT NULL AND grade_8_id IS NOT NULL THEN
        INSERT INTO subject_topics (subject_id, grade_level_id, topic_name, description, difficulty_level) VALUES
        (math_subject_id, grade_8_id, 'Algebra Basics', 'Introduction to algebraic expressions and equations', 'beginner'),
        (math_subject_id, grade_8_id, 'Linear Equations', 'Solving and graphing linear equations', 'intermediate'),
        (math_subject_id, grade_8_id, 'Geometry Fundamentals', 'Basic geometric shapes and properties', 'beginner'),
        (math_subject_id, grade_8_id, 'Fractions and Decimals', 'Operations with fractions and decimal numbers', 'intermediate'),
        (math_subject_id, grade_8_id, 'Data Analysis', 'Introduction to statistics and data interpretation', 'advanced')
        ON CONFLICT (subject_id, grade_level_id, topic_name) DO NOTHING;
    END IF;
END $$;