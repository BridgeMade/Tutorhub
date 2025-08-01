-- Fix RLS policies for tutor_student_assignments table
-- This allows students, tutors, and admins to see relevant assignments

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Admin can manage all assignments" ON tutor_student_assignments;

-- Policy for students to see their own assignments
CREATE POLICY "Students can view their assignments" ON tutor_student_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'student'
      AND profiles.id = tutor_student_assignments.student_id
    )
  );

-- Policy for tutors to see their assignments  
CREATE POLICY "Tutors can view their assignments" ON tutor_student_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'tutor'
      AND profiles.id = tutor_student_assignments.tutor_id
    )
  );

-- Policy for admins to manage all assignments
CREATE POLICY "Admins can manage all assignments" ON tutor_student_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Policy for admins to insert assignments
CREATE POLICY "Admins can create assignments" ON tutor_student_assignments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Policy for admins to update assignments  
CREATE POLICY "Admins can update assignments" ON tutor_student_assignments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Policy for admins to delete assignments
CREATE POLICY "Admins can delete assignments" ON tutor_student_assignments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );