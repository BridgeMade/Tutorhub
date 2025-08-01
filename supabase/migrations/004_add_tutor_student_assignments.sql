-- Create tutor_student_assignments table for admin-managed assignments
CREATE TABLE tutor_student_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tutor_id UUID REFERENCES tutors(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
  assigned_by UUID REFERENCES profiles(id) NOT NULL, -- Admin who made the assignment
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT CHECK (status IN ('active', 'paused', 'completed', 'cancelled')) DEFAULT 'active',
  notes TEXT, -- Admin notes about the assignment
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE, -- Optional end date for the assignment
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique tutor-student-subject combinations
  UNIQUE(tutor_id, student_id, subject_id)
);

-- Enable RLS
ALTER TABLE tutor_student_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tutor_student_assignments

-- Students can view their own assignments
CREATE POLICY "Students can view own assignments" ON tutor_student_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = tutor_student_assignments.student_id 
      AND s.user_id = auth.uid()
    )
  );

-- Tutors can view their assignments
CREATE POLICY "Tutors can view own assignments" ON tutor_student_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tutors t
      WHERE t.id = tutor_student_assignments.tutor_id 
      AND t.user_id = auth.uid()
    )
  );

-- Admins can view all assignments (using specific admin ID as before)
CREATE POLICY "Correct admin can view all assignments" ON tutor_student_assignments
  FOR SELECT USING (auth.uid() = '2cb80c00-04d5-45a7-b180-30278adf8dc9'::uuid);

-- Admins can insert assignments
CREATE POLICY "Correct admin can create assignments" ON tutor_student_assignments
  FOR INSERT WITH CHECK (auth.uid() = '2cb80c00-04d5-45a7-b180-30278adf8dc9'::uuid);

-- Admins can update assignments
CREATE POLICY "Correct admin can update assignments" ON tutor_student_assignments
  FOR UPDATE USING (auth.uid() = '2cb80c00-04d5-45a7-b180-30278adf8dc9'::uuid);

-- Admins can delete assignments
CREATE POLICY "Correct admin can delete assignments" ON tutor_student_assignments
  FOR DELETE USING (auth.uid() = '2cb80c00-04d5-45a7-b180-30278adf8dc9'::uuid);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_tutor_student_assignments_updated_at BEFORE UPDATE
    ON tutor_student_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_tutor_student_assignments_tutor_id ON tutor_student_assignments(tutor_id);
CREATE INDEX idx_tutor_student_assignments_student_id ON tutor_student_assignments(student_id);
CREATE INDEX idx_tutor_student_assignments_subject_id ON tutor_student_assignments(subject_id);
CREATE INDEX idx_tutor_student_assignments_status ON tutor_student_assignments(status);
CREATE INDEX idx_tutor_student_assignments_assigned_at ON tutor_student_assignments(assigned_at);

-- Insert some sample assignments (optional - can be removed in production)
-- This assumes we have some existing tutors and students