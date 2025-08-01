-- Check current logged-in user and their role
SELECT 
  'Current User' as type,
  id, 
  email, 
  full_name, 
  role,
  created_at
FROM profiles 
WHERE id = auth.uid();

-- Check all users and their roles
SELECT 
  'All Users' as type,
  id, 
  email, 
  full_name, 
  role,
  created_at
FROM profiles 
ORDER BY created_at;

-- Check if the admin user exists
SELECT 
  'Admin User' as type,
  id, 
  email, 
  full_name, 
  role,
  created_at
FROM profiles 
WHERE role = 'admin';

-- Update current user to admin (run only if needed)
-- UPDATE profiles SET role = 'admin' WHERE id = auth.uid();