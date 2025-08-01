-- Test admin access to all users
-- Run this in Supabase SQL Editor while logged in as admin

-- Check current user
SELECT 
  'Current User Info' as test,
  auth.uid() as current_user_id,
  EXISTS(SELECT 1 FROM auth.users WHERE id = auth.uid()) as user_exists_in_auth;

-- Check current user profile
SELECT 
  'Current User Profile' as test,
  id, 
  email, 
  full_name, 
  role,
  created_at
FROM profiles 
WHERE id = auth.uid();

-- Test if admin can see all profiles (this should return all 3 users)
SELECT 
  'All Profiles Test' as test,
  id, 
  email, 
  full_name, 
  role,
  created_at
FROM profiles 
ORDER BY created_at;

-- Check which policies exist for profiles table
SELECT 
  'Current Policies' as test,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'profiles';

-- Check if the specific admin user ID policy exists
SELECT 
  'Admin Policy Check' as test,
  count(*) as admin_policies_count
FROM pg_policies 
WHERE tablename = 'profiles' 
  AND policyname LIKE '%admin%';

-- Test direct access as admin
SELECT 
  'Direct Admin Access Test' as test,
  count(*) as total_profiles,
  count(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
  count(CASE WHEN role = 'tutor' THEN 1 END) as tutor_count,
  count(CASE WHEN role = 'student' THEN 1 END) as student_count
FROM profiles;