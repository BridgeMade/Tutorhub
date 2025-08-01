-- ========================================
-- EXECUTE THIS SQL IN SUPABASE SQL EDITOR
-- ========================================
-- This script fixes the User Management showing only 1 user instead of 3 users
-- by adding admin RLS policies. Execute in parts if needed.

-- Step 1: Drop existing policies that might conflict (run if needed)
-- DROP POLICY IF EXISTS "Users can view own payments" ON payments;
-- DROP POLICY IF EXISTS "Admins can view all payments" ON payments;

-- Step 2: Add admin policies for all tables to allow admin users to view all data
-- Only add policies that don't exist yet

-- Admin policies for profiles table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Admins can view all profiles') THEN
        CREATE POLICY "Admins can view all profiles" ON profiles
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM profiles p
              WHERE p.id = auth.uid() AND p.role = 'admin'
            )
          );
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Admins can update all profiles') THEN
        CREATE POLICY "Admins can update all profiles" ON profiles
          FOR UPDATE USING (
            EXISTS (
              SELECT 1 FROM profiles p
              WHERE p.id = auth.uid() AND p.role = 'admin'
            )
          );
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Admins can insert profiles') THEN
        CREATE POLICY "Admins can insert profiles" ON profiles
          FOR INSERT WITH CHECK (
            EXISTS (
              SELECT 1 FROM profiles p
              WHERE p.id = auth.uid() AND p.role = 'admin'
            )
          );
    END IF;
END$$;

-- Admin policies for students table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'students' AND policyname = 'Admins can view all students') THEN
        CREATE POLICY "Admins can view all students" ON students
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM profiles p
              WHERE p.id = auth.uid() AND p.role = 'admin'
            )
          );
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'students' AND policyname = 'Admins can update all students') THEN
        CREATE POLICY "Admins can update all students" ON students
          FOR UPDATE USING (
            EXISTS (
              SELECT 1 FROM profiles p
              WHERE p.id = auth.uid() AND p.role = 'admin'
            )
          );
    END IF;
END$$;

-- Admin policies for tutors table  
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tutors' AND policyname = 'Admins can view all tutors') THEN
        CREATE POLICY "Admins can view all tutors" ON tutors
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM profiles p
              WHERE p.id = auth.uid() AND p.role = 'admin'
            )
          );
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tutors' AND policyname = 'Admins can update all tutors') THEN
        CREATE POLICY "Admins can update all tutors" ON tutors
          FOR UPDATE USING (
            EXISTS (
              SELECT 1 FROM profiles p
              WHERE p.id = auth.uid() AND p.role = 'admin'
            )
          );
    END IF;
END$$;

-- Admin policies for lessons table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lessons' AND policyname = 'Admins can view all lessons') THEN
        CREATE POLICY "Admins can view all lessons" ON lessons
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM profiles p
              WHERE p.id = auth.uid() AND p.role = 'admin'
            )
          );
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lessons' AND policyname = 'Admins can update all lessons') THEN
        CREATE POLICY "Admins can update all lessons" ON lessons
          FOR UPDATE USING (
            EXISTS (
              SELECT 1 FROM profiles p
              WHERE p.id = auth.uid() AND p.role = 'admin'
            )
          );
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lessons' AND policyname = 'Admins can insert lessons') THEN
        CREATE POLICY "Admins can insert lessons" ON lessons
          FOR INSERT WITH CHECK (
            EXISTS (
              SELECT 1 FROM profiles p
              WHERE p.id = auth.uid() AND p.role = 'admin'
            )
          );
    END IF;
END$$;

-- Admin policies for payments table (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Admins can view all payments') THEN
            CREATE POLICY "Admins can view all payments" ON payments
              FOR SELECT USING (
                EXISTS (
                  SELECT 1 FROM profiles p
                  WHERE p.id = auth.uid() AND p.role = 'admin'
                )
              );
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Admins can insert payments') THEN
            CREATE POLICY "Admins can insert payments" ON payments
              FOR INSERT WITH CHECK (
                EXISTS (
                  SELECT 1 FROM profiles p
                  WHERE p.id = auth.uid() AND p.role = 'admin'
                )
              );
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Admins can update payments') THEN
            CREATE POLICY "Admins can update payments" ON payments
              FOR UPDATE USING (
                EXISTS (
                  SELECT 1 FROM profiles p
                  WHERE p.id = auth.uid() AND p.role = 'admin'
                )
              );
        END IF;
    END IF;
END$$;

-- Step 3: Verify the current user has admin role
-- Run this query to check if the current user is an admin:
-- SELECT id, email, full_name, role FROM profiles WHERE id = auth.uid();

-- Step 4: Insert sample data if tables are empty (optional)
-- You can add sample data here if needed for testing

SELECT 'Admin policies and payments table setup completed successfully!' as result;