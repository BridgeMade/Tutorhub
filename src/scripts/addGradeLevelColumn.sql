-- Add grade_level column to profiles table
-- Run this in your Supabase SQL Editor

-- Add the grade_level column if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS grade_level VARCHAR(10) DEFAULT 'K';

-- Add a comment to document the column
COMMENT ON COLUMN profiles.grade_level IS 'Student grade level (K, 1-12). Determines which dashboard they see.';

-- Update any existing students to have a default grade
UPDATE profiles 
SET grade_level = 'K' 
WHERE role = 'student' AND grade_level IS NULL;

-- Create an index for faster queries on grade_level
CREATE INDEX IF NOT EXISTS idx_profiles_grade_level ON profiles(grade_level);

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'grade_level';

-- Show current profile structure
SELECT * FROM profiles LIMIT 3;