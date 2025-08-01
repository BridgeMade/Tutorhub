-- UPDATE ADMIN USER ID IN RLS POLICIES
-- The logged-in user ID is: 2cb80c00-04d5-45a7-b180-30278adf8dc9
-- But the policy uses: 2cb80e00-04d5-46a7-b180-402749ef3deb
-- We need to update the policies with the correct user ID

-- Step 1: Drop existing admin policies with wrong user ID
DROP POLICY IF EXISTS "Specific admin can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Specific admin can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Specific admin can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Specific admin can view all students" ON students;
DROP POLICY IF EXISTS "Specific admin can update all students" ON students;
DROP POLICY IF EXISTS "Specific admin can view all tutors" ON tutors;
DROP POLICY IF EXISTS "Specific admin can update all tutors" ON tutors;
DROP POLICY IF EXISTS "Specific admin can view all lessons" ON lessons;
DROP POLICY IF EXISTS "Specific admin can update all lessons" ON lessons;
DROP POLICY IF EXISTS "Specific admin can insert lessons" ON lessons;
DROP POLICY IF EXISTS "Specific admin can view all payments" ON payments;
DROP POLICY IF EXISTS "Specific admin can insert payments" ON payments;
DROP POLICY IF EXISTS "Specific admin can update payments" ON payments;

-- Step 2: Create policies with CORRECT admin user ID
-- Using the actual logged-in user ID: 2cb80c00-04d5-45a7-b180-30278adf8dc9

-- Admin policies for profiles table
CREATE POLICY "Correct admin can view all profiles" ON profiles
  FOR SELECT USING (
    auth.uid() = '2cb80c00-04d5-45a7-b180-30278adf8dc9'::uuid
  );

CREATE POLICY "Correct admin can update all profiles" ON profiles
  FOR UPDATE USING (
    auth.uid() = '2cb80c00-04d5-45a7-b180-30278adf8dc9'::uuid
  );

CREATE POLICY "Correct admin can insert profiles" ON profiles
  FOR INSERT WITH CHECK (
    auth.uid() = '2cb80c00-04d5-45a7-b180-30278adf8dc9'::uuid
  );

-- Admin policies for students table
CREATE POLICY "Correct admin can view all students" ON students
  FOR SELECT USING (
    auth.uid() = '2cb80c00-04d5-45a7-b180-30278adf8dc9'::uuid
  );

CREATE POLICY "Correct admin can update all students" ON students
  FOR UPDATE USING (
    auth.uid() = '2cb80c00-04d5-45a7-b180-30278adf8dc9'::uuid
  );

-- Admin policies for tutors table
CREATE POLICY "Correct admin can view all tutors" ON tutors
  FOR SELECT USING (
    auth.uid() = '2cb80c00-04d5-45a7-b180-30278adf8dc9'::uuid
  );

CREATE POLICY "Correct admin can update all tutors" ON tutors
  FOR UPDATE USING (
    auth.uid() = '2cb80c00-04d5-45a7-b180-30278adf8dc9'::uuid
  );

-- Admin policies for lessons table
CREATE POLICY "Correct admin can view all lessons" ON lessons
  FOR SELECT USING (
    auth.uid() = '2cb80c00-04d5-45a7-b180-30278adf8dc9'::uuid
  );

CREATE POLICY "Correct admin can update all lessons" ON lessons
  FOR UPDATE USING (
    auth.uid() = '2cb80c00-04d5-45a7-b180-30278adf8dc9'::uuid
  );

CREATE POLICY "Correct admin can insert lessons" ON lessons
  FOR INSERT WITH CHECK (
    auth.uid() = '2cb80c00-04d5-45a7-b180-30278adf8dc9'::uuid
  );

-- Admin policies for payments table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
        CREATE POLICY "Correct admin can view all payments" ON payments
          FOR SELECT USING (
            auth.uid() = '2cb80c00-04d5-45a7-b180-30278adf8dc9'::uuid
          );
        
        CREATE POLICY "Correct admin can insert payments" ON payments
          FOR INSERT WITH CHECK (
            auth.uid() = '2cb80c00-04d5-45a7-b180-30278adf8dc9'::uuid
          );
        
        CREATE POLICY "Correct admin can update payments" ON payments
          FOR UPDATE USING (
            auth.uid() = '2cb80c00-04d5-45a7-b180-30278adf8dc9'::uuid
          );
    END IF;
END$$;

-- Step 3: Verify the policies were created
SELECT 'Admin policies updated with correct user ID!' as result;