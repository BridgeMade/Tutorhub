-- Clean up mock data and set up database for real users
-- Run this in Supabase SQL Editor

-- First, let's see what mock data exists
SELECT 'Existing payments:' as info, COUNT(*) as count FROM payments;
SELECT 'Existing students:' as info, COUNT(*) as count FROM students;
SELECT 'Existing tutors:' as info, COUNT(*) as count FROM tutors;
SELECT 'Existing profiles:' as info, COUNT(*) as count FROM profiles;

-- Clean up any mock payment data
DELETE FROM payments 
WHERE description LIKE '%sample%' 
   OR description LIKE '%mock%' 
   OR description LIKE '%test%'
   OR reference_number LIKE 'TXN-2024%'
   OR reference_number LIKE 'PP-2024%';

-- Show current real users
SELECT 
  p.email,
  p.full_name,
  p.role,
  p.created_at,
  CASE 
    WHEN p.role = 'student' AND s.id IS NOT NULL THEN '✓ Has student record'
    WHEN p.role = 'tutor' AND t.id IS NOT NULL THEN '✓ Has tutor record'
    WHEN p.role = 'admin' THEN '✓ Admin (no extra table needed)'
    ELSE '⚠️ Missing role-specific record'
  END as status
FROM profiles p
LEFT JOIN students s ON p.id = s.user_id AND p.role = 'student'
LEFT JOIN tutors t ON p.id = t.user_id AND p.role = 'tutor'
ORDER BY p.created_at DESC;

-- Create missing role-specific records for existing users
-- This ensures all students have student records and all tutors have tutor records

-- Insert missing student records
INSERT INTO students (user_id, created_at)
SELECT 
  p.id,
  NOW()
FROM profiles p
WHERE p.role = 'student'
  AND NOT EXISTS (
    SELECT 1 FROM students s WHERE s.user_id = p.id
  );

-- Insert missing tutor records with default values
INSERT INTO tutors (user_id, hourly_rate, created_at)
SELECT 
  p.id,
  50.00, -- Default hourly rate
  NOW()
FROM profiles p
WHERE p.role = 'tutor'
  AND NOT EXISTS (
    SELECT 1 FROM tutors t WHERE t.user_id = p.id
  );

-- Show final status
SELECT 
  'Setup complete!' as status,
  COUNT(*) as total_profiles
FROM profiles;

SELECT 
  role,
  COUNT(*) as count
FROM profiles
GROUP BY role
ORDER BY role;