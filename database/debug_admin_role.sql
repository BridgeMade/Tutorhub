-- Debug script to check admin role in database
-- Run this in Supabase SQL Editor to check the user's role

-- Check the profiles table to see what role is stored
SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM profiles 
WHERE email = 'bridgetutoringsa@gmail.com';

-- Check the auth.users table to see what metadata was stored
SELECT 
  id,
  email,
  raw_user_meta_data,
  created_at
FROM auth.users 
WHERE email = 'bridgetutoringsa@gmail.com';

-- Update the user's role to admin if it's not correct
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'bridgetutoringsa@gmail.com' 
AND role != 'admin';

-- Verify the update
SELECT 
  email,
  role,
  'Updated to admin' as status
FROM profiles 
WHERE email = 'bridgetutoringsa@gmail.com';