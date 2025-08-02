/*
  # Fix RLS Infinite Recursion Error

  1. Policy Updates
    - Simplify user_business_roles INSERT policy to avoid recursion
    - Fix business owners policy to prevent circular references
    - Ensure policies don't reference themselves

  2. Security
    - Maintain proper access control
    - Prevent infinite recursion in policy evaluation
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Business owners can manage roles in their businesses" ON user_business_roles;
DROP POLICY IF EXISTS "Users can view their own business roles" ON user_business_roles;
DROP POLICY IF EXISTS "Business owners can update their businesses" ON businesses;
DROP POLICY IF EXISTS "Users can create businesses" ON businesses;
DROP POLICY IF EXISTS "Users can view businesses they have access to" ON businesses;

-- Create simplified policies for user_business_roles
CREATE POLICY "Users can insert their own business roles"
  ON user_business_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own business roles"
  ON user_business_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Business owners can manage all roles in their businesses"
  ON user_business_roles
  FOR ALL
  TO authenticated
  USING (
    business_id IN (
      SELECT b.id 
      FROM businesses b 
      WHERE b.created_by_user_id = auth.uid()
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT b.id 
      FROM businesses b 
      WHERE b.created_by_user_id = auth.uid()
    )
  );

-- Create simplified policies for businesses
CREATE POLICY "Users can create businesses"
  ON businesses
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by_user_id = auth.uid());

CREATE POLICY "Users can view their own businesses"
  ON businesses
  FOR SELECT
  TO authenticated
  USING (created_by_user_id = auth.uid());

CREATE POLICY "Business owners can update their businesses"
  ON businesses
  FOR UPDATE
  TO authenticated
  USING (created_by_user_id = auth.uid())
  WITH CHECK (created_by_user_id = auth.uid());

-- Create helper function for business access (used by other tables)
CREATE OR REPLACE FUNCTION user_has_business_access(target_business_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM user_business_roles ubr
    WHERE ubr.user_id = auth.uid() 
    AND ubr.business_id = target_business_id
  ) OR EXISTS (
    SELECT 1 
    FROM businesses b
    WHERE b.id = target_business_id 
    AND b.created_by_user_id = auth.uid()
  );
$$;