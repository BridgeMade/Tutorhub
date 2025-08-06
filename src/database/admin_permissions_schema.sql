-- Admin Permissions and Database Policies Schema
-- This schema provides full administrative access while maintaining security
-- Run this in your Supabase SQL editor

-- ============================================================================
-- ADMIN ROLE VERIFICATION FUNCTION
-- ============================================================================

-- Create a reusable function to check if current user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

-- ============================================================================
-- PROFILES TABLE POLICIES
-- ============================================================================

-- Drop existing policies and recreate with admin access
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;

-- Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Admins have full access to all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (is_admin());

CREATE POLICY "Admins can manage all profiles" ON profiles
    FOR ALL USING (is_admin());

-- ============================================================================
-- STUDENTS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Students can view own data" ON students;
DROP POLICY IF EXISTS "Students can update own data" ON students;
DROP POLICY IF EXISTS "Tutors can view assigned students" ON students;
DROP POLICY IF EXISTS "Admins can manage all students" ON students;

-- Students can manage their own data
CREATE POLICY "Students can view own data" ON students
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Students can update own data" ON students
    FOR UPDATE USING (user_id = auth.uid());

-- Tutors can view students they are assigned to (assignments store profile IDs directly)
CREATE POLICY "Tutors can view assigned students" ON students
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tutor_student_assignments tsa
            WHERE tsa.student_id = students.user_id
            AND tsa.tutor_id = auth.uid()
            AND tsa.status = 'active'
        )
    );

-- Admins have full access to all students
CREATE POLICY "Admins can manage all students" ON students
    FOR ALL USING (is_admin());

-- ============================================================================
-- TUTORS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Tutors can view own data" ON tutors;
DROP POLICY IF EXISTS "Tutors can update own data" ON tutors;
DROP POLICY IF EXISTS "Students can view assigned tutors" ON tutors;
DROP POLICY IF EXISTS "Public can view tutor profiles" ON tutors;
DROP POLICY IF EXISTS "Admins can manage all tutors" ON tutors;

-- Tutors can manage their own data
CREATE POLICY "Tutors can view own data" ON tutors
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Tutors can update own data" ON tutors
    FOR UPDATE USING (user_id = auth.uid());

-- Students can view tutors they are assigned to (assignments store profile IDs directly)
CREATE POLICY "Students can view assigned tutors" ON tutors
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tutor_student_assignments tsa
            WHERE tsa.tutor_id = tutors.user_id
            AND tsa.student_id = auth.uid()
            AND tsa.status = 'active'
        )
    );

-- Public read access for tutor discovery
CREATE POLICY "Public can view tutor profiles" ON tutors
    FOR SELECT USING (true);

-- Admins have full access to all tutors
CREATE POLICY "Admins can manage all tutors" ON tutors
    FOR ALL USING (is_admin());

-- ============================================================================
-- LESSONS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Students can view own lessons" ON lessons;
DROP POLICY IF EXISTS "Tutors can view assigned lessons" ON lessons;
DROP POLICY IF EXISTS "Students can update own lessons" ON lessons;
DROP POLICY IF EXISTS "Tutors can update assigned lessons" ON lessons;
DROP POLICY IF EXISTS "Admins can manage all lessons" ON lessons;

-- Students can view and update their own lessons (through students table)
CREATE POLICY "Students can view own lessons" ON lessons
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM students s
            WHERE s.id = student_id
            AND s.user_id = auth.uid()
        )
    );

CREATE POLICY "Students can update own lessons" ON lessons
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM students s
            WHERE s.id = student_id
            AND s.user_id = auth.uid()
        )
    );

-- Tutors can view and update lessons they are assigned to (through tutors table)
CREATE POLICY "Tutors can view assigned lessons" ON lessons
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tutors t
            WHERE t.id = tutor_id
            AND t.user_id = auth.uid()
        )
    );

CREATE POLICY "Tutors can update assigned lessons" ON lessons
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM tutors t
            WHERE t.id = tutor_id
            AND t.user_id = auth.uid()
        )
    );

-- Admins have full access to all lessons
CREATE POLICY "Admins can manage all lessons" ON lessons
    FOR ALL USING (is_admin());

-- ============================================================================
-- TUTOR_STUDENT_ASSIGNMENTS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Students can view own assignments" ON tutor_student_assignments;
DROP POLICY IF EXISTS "Tutors can view own assignments" ON tutor_student_assignments;
DROP POLICY IF EXISTS "Tutors can update own assignments" ON tutor_student_assignments;
DROP POLICY IF EXISTS "Admins can manage all assignments" ON tutor_student_assignments;

-- Students can view their assignments (assignments store profile IDs directly)
CREATE POLICY "Students can view own assignments" ON tutor_student_assignments
    FOR SELECT USING (student_id = auth.uid());

-- Tutors can view and update their assignments (assignments store profile IDs directly)
CREATE POLICY "Tutors can view own assignments" ON tutor_student_assignments
    FOR SELECT USING (tutor_id = auth.uid());

CREATE POLICY "Tutors can update own assignments" ON tutor_student_assignments
    FOR UPDATE USING (tutor_id = auth.uid());

-- Admins have full access to all assignments
CREATE POLICY "Admins can manage all assignments" ON tutor_student_assignments
    FOR ALL USING (is_admin());

-- ============================================================================
-- MESSAGING TABLES POLICIES (conversations, messages)
-- ============================================================================

-- Conversations policies
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
DROP POLICY IF EXISTS "Admins can view all conversations" ON conversations;

CREATE POLICY "Users can view own conversations" ON conversations
    FOR SELECT USING (student_id = auth.uid() OR tutor_id = auth.uid());

CREATE POLICY "Users can manage own conversations" ON conversations
    FOR ALL USING (student_id = auth.uid() OR tutor_id = auth.uid());

CREATE POLICY "Admins can manage all conversations" ON conversations
    FOR ALL USING (is_admin());

-- Messages policies
DROP POLICY IF EXISTS "Users can view conversation messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Admins can manage all messages" ON messages;

CREATE POLICY "Users can view conversation messages" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversations c
            WHERE c.id = conversation_id
            AND (c.student_id = auth.uid() OR c.tutor_id = auth.uid())
        )
    );

CREATE POLICY "Users can send messages" ON messages
    FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update own messages" ON messages
    FOR UPDATE USING (sender_id = auth.uid());

CREATE POLICY "Admins can manage all messages" ON messages
    FOR ALL USING (is_admin());

-- ============================================================================
-- CONDITIONAL POLICIES FOR OPTIONAL TABLES
-- ============================================================================

-- Only create policies for tables that exist

-- TUTOR_AVAILABILITY TABLE POLICIES (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tutor_availability') THEN
        DROP POLICY IF EXISTS "Admins can override all availability" ON tutor_availability;
        CREATE POLICY "Admins can override all availability" ON tutor_availability
            FOR ALL USING (is_admin());
    END IF;
END $$;

-- NOTIFICATIONS TABLE POLICIES (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') THEN
        DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
        DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
        DROP POLICY IF EXISTS "Admins can manage all notifications" ON notifications;

        CREATE POLICY "Users can view own notifications" ON notifications
            FOR SELECT USING (recipient_id = auth.uid());

        CREATE POLICY "Users can update own notifications" ON notifications
            FOR UPDATE USING (recipient_id = auth.uid());

        CREATE POLICY "Admins can manage all notifications" ON notifications
            FOR ALL USING (is_admin());
    END IF;
END $$;

-- SESSION RESCHEDULE REQUESTS TABLE POLICIES (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'session_reschedule_requests') THEN
        DROP POLICY IF EXISTS "Users can view related reschedule requests" ON session_reschedule_requests;
        DROP POLICY IF EXISTS "Users can create reschedule requests" ON session_reschedule_requests;
        DROP POLICY IF EXISTS "Users can respond to reschedule requests" ON session_reschedule_requests;
        DROP POLICY IF EXISTS "Admins can manage all reschedule requests" ON session_reschedule_requests;

        CREATE POLICY "Users can view related reschedule requests" ON session_reschedule_requests
            FOR SELECT USING (
                requested_by = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM lessons l
                    JOIN students s ON l.student_id = s.id
                    JOIN tutors t ON l.tutor_id = t.id
                    WHERE l.id = lesson_id
                    AND (s.user_id = auth.uid() OR t.user_id = auth.uid())
                )
            );

        CREATE POLICY "Users can create reschedule requests" ON session_reschedule_requests
            FOR INSERT WITH CHECK (requested_by = auth.uid());

        CREATE POLICY "Users can respond to reschedule requests" ON session_reschedule_requests
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM lessons l
                    JOIN students s ON l.student_id = s.id
                    JOIN tutors t ON l.tutor_id = t.id
                    WHERE l.id = lesson_id
                    AND (s.user_id = auth.uid() OR t.user_id = auth.uid())
                )
            );

        CREATE POLICY "Admins can manage all reschedule requests" ON session_reschedule_requests
            FOR ALL USING (is_admin());
    END IF;
END $$;

-- SESSION AUDIT TRAIL TABLE POLICIES (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'session_audit_trail') THEN
        DROP POLICY IF EXISTS "Users can view related audit entries" ON session_audit_trail;
        DROP POLICY IF EXISTS "System can create audit entries" ON session_audit_trail;
        DROP POLICY IF EXISTS "Admins can view all audit entries" ON session_audit_trail;

        CREATE POLICY "Users can view related audit entries" ON session_audit_trail
            FOR SELECT USING (
                performed_by = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM lessons l
                    JOIN students s ON l.student_id = s.id
                    JOIN tutors t ON l.tutor_id = t.id
                    WHERE l.id = lesson_id
                    AND (s.user_id = auth.uid() OR t.user_id = auth.uid())
                )
            );

        CREATE POLICY "System can create audit entries" ON session_audit_trail
            FOR INSERT WITH CHECK (true);

        CREATE POLICY "Admins can view all audit entries" ON session_audit_trail
            FOR SELECT USING (is_admin());
    END IF;
END $$;

-- ============================================================================
-- SUBJECTS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Public can view subjects" ON subjects;
DROP POLICY IF EXISTS "Admins can manage subjects" ON subjects;

CREATE POLICY "Public can view subjects" ON subjects
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage subjects" ON subjects
    FOR ALL USING (is_admin());

-- ============================================================================
-- ADMIN HELPER FUNCTIONS
-- ============================================================================

-- Function to get system statistics for admin dashboard
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS TABLE (
    total_users INTEGER,
    total_students INTEGER,
    total_tutors INTEGER,
    total_lessons INTEGER,
    total_active_assignments INTEGER,
    total_pending_reschedules INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM profiles),
        (SELECT COUNT(*)::INTEGER FROM students),
        (SELECT COUNT(*)::INTEGER FROM tutors),
        (SELECT COUNT(*)::INTEGER FROM lessons),
        (SELECT COUNT(*)::INTEGER FROM tutor_student_assignments WHERE status = 'active'),
        (SELECT COUNT(*)::INTEGER FROM session_reschedule_requests WHERE status = 'pending');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to admins only
GRANT EXECUTE ON FUNCTION get_admin_stats() TO authenticated;

-- Function to override any lesson status (admin only)
CREATE OR REPLACE FUNCTION admin_override_lesson_status(
    p_lesson_id UUID,
    p_new_status TEXT,
    p_admin_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if current user is admin
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;
    
    -- Update lesson status
    UPDATE lessons 
    SET 
        status = p_new_status,
        updated_at = NOW()
    WHERE id = p_lesson_id;
    
    -- Log the admin override
    INSERT INTO session_audit_trail (
        lesson_id,
        action_type,
        changed_by,
        old_status,
        new_status,
        change_reason,
        metadata
    ) VALUES (
        p_lesson_id,
        'admin_override',
        auth.uid(),
        (SELECT status FROM lessons WHERE id = p_lesson_id),
        p_new_status,
        COALESCE(p_admin_reason, 'Admin override'),
        jsonb_build_object('override_reason', p_admin_reason)
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users (function checks admin status internally)
GRANT EXECUTE ON FUNCTION admin_override_lesson_status(UUID, TEXT, TEXT) TO authenticated;

-- Function to bulk update user roles (admin only)
CREATE OR REPLACE FUNCTION admin_bulk_update_roles(
    p_user_ids UUID[],
    p_new_role TEXT
)
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER := 0;
BEGIN
    -- Check if current user is admin
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;
    
    -- Validate role
    IF p_new_role NOT IN ('student', 'tutor', 'admin') THEN
        RAISE EXCEPTION 'Invalid role: %', p_new_role;
    END IF;
    
    -- Update roles
    UPDATE profiles 
    SET role = p_new_role, updated_at = NOW()
    WHERE id = ANY(p_user_ids);
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users (function checks admin status internally)
GRANT EXECUTE ON FUNCTION admin_bulk_update_roles(UUID[], TEXT) TO authenticated;

-- ============================================================================
-- ENABLE RLS ON ALL TABLES (if not already enabled and if they exist)
-- ============================================================================

-- Enable RLS on core tables (if they exist)
DO $$
BEGIN
    -- Core tables that should always exist
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'students') THEN
        ALTER TABLE students ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tutors') THEN
        ALTER TABLE tutors ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'lessons') THEN
        ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tutor_student_assignments') THEN
        ALTER TABLE tutor_student_assignments ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'subjects') THEN
        ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- Optional tables
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'conversations') THEN
        ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'messages') THEN
        ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tutor_availability') THEN
        ALTER TABLE tutor_availability ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') THEN
        ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'session_reschedule_requests') THEN
        ALTER TABLE session_reschedule_requests ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'session_audit_trail') THEN
        ALTER TABLE session_audit_trail ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant table permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify admin permissions schema was created successfully
SELECT 'Admin permissions and database policies created successfully!' as status;

-- Show admin function availability
SELECT 'Available admin functions:' as info;
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%admin%' 
OR routine_name = 'is_admin';