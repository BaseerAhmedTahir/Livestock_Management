/*
  # Fix RLS policies for caretaker access

  1. Security Updates
    - Add missing SELECT policy for user_business_roles table to allow users to view their own roles
    - Add missing SELECT policy for user_profiles table to allow users to view their own profile
    - These policies are essential for caretakers to access their assigned businesses

  2. Changes Made
    - CREATE POLICY for user_business_roles SELECT operations
    - CREATE POLICY for user_profiles SELECT operations
    - Both policies use auth.uid() = user_id to ensure users can only see their own data
*/

-- Add SELECT policy for user_business_roles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_business_roles' 
    AND policyname = 'Allow authenticated users to view their own business roles'
  ) THEN
    CREATE POLICY "Allow authenticated users to view their own business roles"
      ON user_business_roles
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Add SELECT policy for user_profiles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_profiles' 
    AND policyname = 'Allow authenticated users to view their own profile'
  ) THEN
    CREATE POLICY "Allow authenticated users to view their own profile"
      ON user_profiles
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;