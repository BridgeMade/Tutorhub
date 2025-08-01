-- Final fix for signup trigger to properly handle role selection
-- Run this in Supabase SQL Editor

-- First, let's check what's currently in the profiles table
SELECT 
  email,
  full_name,
  role,
  created_at
FROM profiles 
ORDER BY created_at DESC;

-- Check what's in auth.users metadata to see if roles are being stored
SELECT 
  email,
  raw_user_meta_data,
  created_at
FROM auth.users 
ORDER BY created_at DESC;

-- Now let's recreate the trigger function with better debugging
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Extract role from metadata, default to 'student' if not provided
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  
  -- Debug: This will show in Supabase logs
  RAISE LOG 'Creating profile for user % with role %', NEW.email, user_role;
  
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    user_role
  );
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, update the role if it's different
    UPDATE public.profiles 
    SET role = user_role,
        full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', full_name)
    WHERE id = NEW.id;
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log any other errors
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make sure the trigger exists and is active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Now let's manually fix existing users whose roles might be wrong
-- Update crispweekly@gmail.com to be a tutor if that's what they should be
UPDATE profiles 
SET role = 'tutor' 
WHERE email = 'crispweekly@gmail.com';

-- Verify the update
SELECT 
  email,
  role,
  'Role updated' as status
FROM profiles 
WHERE email = 'crispweekly@gmail.com';

-- Show all current profiles and their roles
SELECT 
  email,
  role,
  created_at
FROM profiles 
ORDER BY created_at DESC;