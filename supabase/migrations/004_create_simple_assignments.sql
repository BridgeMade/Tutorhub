-- Create a simple tutor_student_assignments table
-- This is a minimal version that works with profile IDs directly

CREATE TABLE IF NOT EXISTS tutor_student_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tutor_id UUID NOT NULL, -- This will store profile IDs for now
  student_id UUID NOT NULL, -- This will store profile IDs for now
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
  assigned_by UUID REFERENCES profiles(id) NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT CHECK (status IN ('active', 'paused', 'completed', 'cancelled')) DEFAULT 'active',
  notes TEXT,
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique tutor-student-subject combinations
  UNIQUE(tutor_id, student_id, subject_id)
);

-- Enable RLS
ALTER TABLE tutor_student_assignments ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies - admin can do everything
CREATE POLICY "Admin can manage all assignments" ON tutor_student_assignments
  FOR ALL USING (auth.uid() = '2cb80c00-04d5-45a7-b180-30278adf8dc9'::uuid);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tutor_student_assignments_tutor_id ON tutor_student_assignments(tutor_id);
CREATE INDEX IF NOT EXISTS idx_tutor_student_assignments_student_id ON tutor_student_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_tutor_student_assignments_subject_id ON tutor_student_assignments(subject_id);
CREATE INDEX IF NOT EXISTS idx_tutor_student_assignments_status ON tutor_student_assignments(status);

-- Insert a test assignment to verify the table works
-- This will use actual profile IDs from your system
-- Comment this out if you don't want test data
-- INSERT INTO tutor_student_assignments (tutor_id, student_id, subject_id, assigned_by, notes) 
-- VALUES (
--   (SELECT id FROM profiles WHERE role = 'tutor' LIMIT 1),
--   (SELECT id FROM profiles WHERE role = 'student' LIMIT 1), 
--   (SELECT id FROM subjects LIMIT 1),
--   '2cb80c00-04d5-45a7-b180-30278adf8dc9'::uuid,
--   'Test assignment'
-- );