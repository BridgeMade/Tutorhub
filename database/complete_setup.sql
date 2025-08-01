-- Complete TutorHub Database Setup
-- Run this script in Supabase SQL Editor to set up all required tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'tutor', 'admin')),
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  grade_level TEXT,
  school TEXT,
  parent_name TEXT,
  parent_email TEXT,
  parent_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create tutors table
CREATE TABLE IF NOT EXISTS tutors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  specializations TEXT[],
  hourly_rate DECIMAL(10,2),
  bio TEXT,
  experience_years INTEGER,
  qualifications TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create topics table
CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lessons table
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id),
  topic_id UUID REFERENCES topics(id),
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')),
  meeting_link TEXT,
  notes TEXT,
  homework_assigned TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table (for manual payment tracking)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('student_payment', 'tutor_payout')),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  method TEXT NOT NULL CHECK (method IN ('bank_transfer', 'cash', 'check', 'paypal', 'other')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  reference_number TEXT,
  description TEXT NOT NULL,
  session_ids UUID[],
  recorded_by UUID NOT NULL REFERENCES profiles(id),
  payment_date DATE NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_tutors_user_id ON tutors(user_id);
CREATE INDEX IF NOT EXISTS idx_lessons_student_id ON lessons(student_id);
CREATE INDEX IF NOT EXISTS idx_lessons_tutor_id ON lessons(tutor_id);
CREATE INDEX IF NOT EXISTS idx_lessons_scheduled_at ON lessons(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_lessons_status ON lessons(status);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_type ON payments(payment_type);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutors ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can insert profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for students
CREATE POLICY "Students can view own data" ON students
  FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'tutor')
    )
  );

CREATE POLICY "Students can update own data" ON students
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Students can insert own data" ON students
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policies for tutors
CREATE POLICY "Tutors can view own data" ON tutors
  FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Tutors can update own data" ON tutors
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Tutors can insert own data" ON tutors
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policies for subjects (read-only for all users)
CREATE POLICY "Anyone can view subjects" ON subjects
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage subjects" ON subjects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for topics (read-only for all users)
CREATE POLICY "Anyone can view topics" ON topics
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage topics" ON topics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for lessons
CREATE POLICY "Users can view own lessons" ON lessons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM students 
      WHERE students.id = lessons.student_id 
      AND students.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM tutors 
      WHERE tutors.id = lessons.tutor_id 
      AND tutors.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Students and tutors can create lessons" ON lessons
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM students 
      WHERE students.id = lessons.student_id 
      AND students.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM tutors 
      WHERE tutors.id = lessons.tutor_id 
      AND tutors.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Lesson participants can update" ON lessons
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM students 
      WHERE students.id = lessons.student_id 
      AND students.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM tutors 
      WHERE tutors.id = lessons.tutor_id 
      AND tutors.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for payments
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage payments" ON payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Create trigger functions for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at
  BEFORE UPDATE ON lessons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default subjects
INSERT INTO subjects (name, description, category) VALUES
  ('Mathematics', 'Basic to advanced mathematics including algebra, geometry, calculus', 'STEM'),
  ('Physics', 'Physics concepts from basic mechanics to advanced topics', 'STEM'),
  ('Chemistry', 'General chemistry, organic chemistry, and laboratory techniques', 'STEM'),
  ('Biology', 'Life sciences including cell biology, genetics, and ecology', 'STEM'),
  ('English', 'English language arts, literature, writing, and communication', 'Language Arts'),
  ('History', 'World history, local history, and historical analysis', 'Social Studies'),
  ('Computer Science', 'Programming, algorithms, data structures, and computer systems', 'STEM'),
  ('Spanish', 'Spanish language learning from beginner to advanced', 'Languages'),
  ('French', 'French language learning from beginner to advanced', 'Languages'),
  ('Art', 'Visual arts, drawing, painting, and art history', 'Arts')
ON CONFLICT (name) DO NOTHING;

-- Insert sample topics for Mathematics
INSERT INTO topics (name, subject_id, description) VALUES
  ('Algebra', (SELECT id FROM subjects WHERE name = 'Mathematics'), 'Linear equations, quadratic equations, polynomials'),
  ('Geometry', (SELECT id FROM subjects WHERE name = 'Mathematics'), 'Shapes, angles, area, volume, and geometric proofs'),
  ('Calculus', (SELECT id FROM subjects WHERE name = 'Mathematics'), 'Derivatives, integrals, and applications'),
  ('Statistics', (SELECT id FROM subjects WHERE name = 'Mathematics'), 'Data analysis, probability, and statistical inference'),
  ('Trigonometry', (SELECT id FROM subjects WHERE name = 'Mathematics'), 'Sine, cosine, tangent, and trigonometric identities')
ON CONFLICT DO NOTHING;

-- Insert sample topics for Physics
INSERT INTO topics (name, subject_id, description) VALUES
  ('Mechanics', (SELECT id FROM subjects WHERE name = 'Physics'), 'Motion, forces, energy, and momentum'),
  ('Thermodynamics', (SELECT id FROM subjects WHERE name = 'Physics'), 'Heat, temperature, and energy transfer'),
  ('Electromagnetism', (SELECT id FROM subjects WHERE name = 'Physics'), 'Electric fields, magnetic fields, and electromagnetic waves'),
  ('Optics', (SELECT id FROM subjects WHERE name = 'Physics'), 'Light, reflection, refraction, and optical instruments'),
  ('Quantum Physics', (SELECT id FROM subjects WHERE name = 'Physics'), 'Wave-particle duality, uncertainty principle, and quantum mechanics')
ON CONFLICT DO NOTHING;

-- Function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', 'student');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();