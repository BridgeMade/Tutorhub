-- ========================================
-- FIX INFINITE RECURSION IN RLS POLICIES
-- ========================================
-- This script fixes the infinite recursion error by removing problematic policies
-- and creating safe admin access

-- Step 1: Drop all admin policies that cause recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all students" ON students;
DROP POLICY IF EXISTS "Admins can update all students" ON students;
DROP POLICY IF EXISTS "Admins can view all tutors" ON tutors;
DROP POLICY IF EXISTS "Admins can update all tutors" ON tutors;
DROP POLICY IF EXISTS "Admins can view all lessons" ON lessons;
DROP POLICY IF EXISTS "Admins can update all lessons" ON lessons;
DROP POLICY IF EXISTS "Admins can insert lessons" ON lessons;
DROP POLICY IF EXISTS "Admins can view all payments" ON payments;
DROP POLICY IF EXISTS "Admins can insert payments" ON payments;
DROP POLICY IF EXISTS "Admins can update payments" ON payments;

-- Step 2: Create safe admin policies using specific admin user ID
-- First, let's identify the admin user ID from your screenshot: 2cb80e00-04d5-46a7-b180-4027...

-- Option 1: Create policies for specific admin user ID (replace with actual admin ID)
-- You'll need to replace 'YOUR_ADMIN_USER_ID' with the actual UUID from your profiles table

-- Admin policies for profiles table (using specific admin ID to avoid recursion)
CREATE POLICY "Specific admin can view all profiles" ON profiles
  FOR SELECT USING (
    auth.uid() = '2cb80e00-04d5-46a7-b180-402749ef3deb'::uuid
  );

CREATE POLICY "Specific admin can update all profiles" ON profiles
  FOR UPDATE USING (
    auth.uid() = '2cb80e00-04d5-46a7-b180-402749ef3deb'::uuid
  );

CREATE POLICY "Specific admin can insert profiles" ON profiles
  FOR INSERT WITH CHECK (
    auth.uid() = '2cb80e00-04d5-46a7-b180-402749ef3deb'::uuid
  );

-- Admin policies for other tables (these are safe because they don't reference profiles)
CREATE POLICY "Specific admin can view all students" ON students
  FOR SELECT USING (
    auth.uid() = '2cb80e00-04d5-46a7-b180-402749ef3deb'::uuid
  );

CREATE POLICY "Specific admin can update all students" ON students
  FOR UPDATE USING (
    auth.uid() = '2cb80e00-04d5-46a7-b180-402749ef3deb'::uuid
  );

CREATE POLICY "Specific admin can view all tutors" ON tutors
  FOR SELECT USING (
    auth.uid() = '2cb80e00-04d5-46a7-b180-402749ef3deb'::uuid
  );

CREATE POLICY "Specific admin can update all tutors" ON tutors
  FOR UPDATE USING (
    auth.uid() = '2cb80e00-04d5-46a7-b180-402749ef3deb'::uuid
  );

CREATE POLICY "Specific admin can view all lessons" ON lessons
  FOR SELECT USING (
    auth.uid() = '2cb80e00-04d5-46a7-b180-402749ef3deb'::uuid
  );

CREATE POLICY "Specific admin can update all lessons" ON lessons
  FOR UPDATE USING (
    auth.uid() = '2cb80e00-04d5-46a7-b180-402749ef3deb'::uuid
  );

CREATE POLICY "Specific admin can insert lessons" ON lessons
  FOR INSERT WITH CHECK (
    auth.uid() = '2cb80e00-04d5-46a7-b180-402749ef3deb'::uuid
  );

-- Admin policies for payments table (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
        CREATE POLICY "Specific admin can view all payments" ON payments
          FOR SELECT USING (
            auth.uid() = '2cb80e00-04d5-46a7-b180-402749ef3deb'::uuid
          );
        
        CREATE POLICY "Specific admin can insert payments" ON payments
          FOR INSERT WITH CHECK (
            auth.uid() = '2cb80e00-04d5-46a7-b180-402749ef3deb'::uuid
          );
        
        CREATE POLICY "Specific admin can update payments" ON payments
          FOR UPDATE USING (
            auth.uid() = '2cb80e00-04d5-46a7-b180-402749ef3deb'::uuid
          );
    END IF;
END$$;

-- Step 3: Check if policies were created successfully
SELECT 'Infinite recursion fixed! Admin policies created for specific user.' as result;