-- Create missing entries in students and tutors tables for existing users
-- Run this in Supabase SQL Editor to fix missing role data

-- Create student entries for users with role 'student' but no student record
INSERT INTO students (user_id, created_at)
SELECT 
  p.id,
  NOW()
FROM profiles p
WHERE p.role = 'student'
  AND NOT EXISTS (
    SELECT 1 FROM students s WHERE s.user_id = p.id
  );

-- Create tutor entries for users with role 'tutor' but no tutor record  
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

-- Show what was created
SELECT 
  'Students created' as table_name,
  COUNT(*) as count
FROM students s
JOIN profiles p ON s.user_id = p.id
WHERE p.role = 'student'

UNION ALL

SELECT 
  'Tutors created' as table_name,
  COUNT(*) as count
FROM tutors t
JOIN profiles p ON t.user_id = p.id
WHERE p.role = 'tutor';

-- Verify all users now have proper role data
SELECT 
  p.email,
  p.role,
  CASE 
    WHEN p.role = 'student' AND s.id IS NOT NULL THEN 'Has student record'
    WHEN p.role = 'tutor' AND t.id IS NOT NULL THEN 'Has tutor record'
    WHEN p.role = 'admin' THEN 'Admin (no extra table needed)'
    ELSE 'Missing role record'
  END as status
FROM profiles p
LEFT JOIN students s ON p.id = s.user_id AND p.role = 'student'
LEFT JOIN tutors t ON p.id = t.user_id AND p.role = 'tutor'
ORDER BY p.role, p.email;