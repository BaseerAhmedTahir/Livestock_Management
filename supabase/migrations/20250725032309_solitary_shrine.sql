/*
  # Multi-Business Support Migration

  1. New Tables
    - `businesses` - Store business information
    - `user_business_roles` - Map users to businesses with roles
    
  2. Schema Updates
    - Add `business_id` to all existing tables
    - Update RLS policies for business isolation
    - Create indexes for performance
    
  3. Security
    - Enable RLS on all tables
    - Add business-scoped policies
    - Ensure data isolation between businesses
*/

-- Create businesses table
CREATE TABLE IF NOT EXISTS businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_by_user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user business roles table
CREATE TABLE IF NOT EXISTS user_business_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'caretaker')),
  linked_caretaker_id uuid,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, business_id)
);

-- Add business_id to existing tables
DO $$
BEGIN
  -- Add business_id to goats table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'goats' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE goats ADD COLUMN business_id uuid REFERENCES businesses(id) ON DELETE CASCADE;
  END IF;

  -- Add business_id to caretakers table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'caretakers' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE caretakers ADD COLUMN business_id uuid REFERENCES businesses(id) ON DELETE CASCADE;
  END IF;

  -- Add business_id to health_records table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'health_records' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE health_records ADD COLUMN business_id uuid REFERENCES businesses(id) ON DELETE CASCADE;
  END IF;

  -- Add business_id to weight_records table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'weight_records' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE weight_records ADD COLUMN business_id uuid REFERENCES businesses(id) ON DELETE CASCADE;
  END IF;

  -- Add business_id to expenses table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE expenses ADD COLUMN business_id uuid REFERENCES businesses(id) ON DELETE CASCADE;
  END IF;

  -- Add business_id to transactions table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN business_id uuid REFERENCES businesses(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_business_roles ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_businesses_created_by ON businesses(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_user_business_roles_user_id ON user_business_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_business_roles_business_id ON user_business_roles(business_id);
CREATE INDEX IF NOT EXISTS idx_goats_business_id ON goats(business_id);
CREATE INDEX IF NOT EXISTS idx_caretakers_business_id ON caretakers(business_id);
CREATE INDEX IF NOT EXISTS idx_health_records_business_id ON health_records(business_id);
CREATE INDEX IF NOT EXISTS idx_weight_records_business_id ON weight_records(business_id);
CREATE INDEX IF NOT EXISTS idx_expenses_business_id ON expenses(business_id);
CREATE INDEX IF NOT EXISTS idx_transactions_business_id ON transactions(business_id);

-- RLS Policies for businesses table
DROP POLICY IF EXISTS "Users can view businesses they have access to" ON businesses;
CREATE POLICY "Users can view businesses they have access to"
  ON businesses
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT business_id 
      FROM user_business_roles 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create businesses" ON businesses;
CREATE POLICY "Users can create businesses"
  ON businesses
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by_user_id = auth.uid());

DROP POLICY IF EXISTS "Business owners can update their businesses" ON businesses;
CREATE POLICY "Business owners can update their businesses"
  ON businesses
  FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT business_id 
      FROM user_business_roles 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- RLS Policies for user_business_roles table
DROP POLICY IF EXISTS "Users can view their own business roles" ON user_business_roles;
CREATE POLICY "Users can view their own business roles"
  ON user_business_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Business owners can manage roles in their businesses" ON user_business_roles;
CREATE POLICY "Business owners can manage roles in their businesses"
  ON user_business_roles
  FOR ALL
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id 
      FROM user_business_roles 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Update existing RLS policies to include business_id checks

-- Helper function to check if user has access to business
CREATE OR REPLACE FUNCTION user_has_business_access(target_business_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_business_roles 
    WHERE user_id = auth.uid() 
    AND business_id = target_business_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update goats policies
DROP POLICY IF EXISTS "Users can manage their own goats" ON goats;
CREATE POLICY "Users can manage goats in their businesses"
  ON goats
  FOR ALL
  TO authenticated
  USING (user_has_business_access(business_id))
  WITH CHECK (user_has_business_access(business_id));

-- Update caretakers policies
DROP POLICY IF EXISTS "Users can manage their own caretakers" ON caretakers;
CREATE POLICY "Users can manage caretakers in their businesses"
  ON caretakers
  FOR ALL
  TO authenticated
  USING (user_has_business_access(business_id))
  WITH CHECK (user_has_business_access(business_id));

-- Update health_records policies
DROP POLICY IF EXISTS "Users can manage their own health records" ON health_records;
CREATE POLICY "Users can manage health records in their businesses"
  ON health_records
  FOR ALL
  TO authenticated
  USING (user_has_business_access(business_id))
  WITH CHECK (user_has_business_access(business_id));

-- Update weight_records policies
DROP POLICY IF EXISTS "Users can manage their own weight records" ON weight_records;
CREATE POLICY "Users can manage weight records in their businesses"
  ON weight_records
  FOR ALL
  TO authenticated
  USING (user_has_business_access(business_id))
  WITH CHECK (user_has_business_access(business_id));

-- Update expenses policies
DROP POLICY IF EXISTS "Users can manage their own expenses" ON expenses;
CREATE POLICY "Users can manage expenses in their businesses"
  ON expenses
  FOR ALL
  TO authenticated
  USING (user_has_business_access(business_id))
  WITH CHECK (user_has_business_access(business_id));

-- Update transactions policies
DROP POLICY IF EXISTS "Users can manage their own transactions" ON transactions;
CREATE POLICY "Users can manage transactions in their businesses"
  ON transactions
  FOR ALL
  TO authenticated
  USING (user_has_business_access(business_id))
  WITH CHECK (user_has_business_access(business_id));

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_businesses_updated_at ON businesses;
CREATE TRIGGER update_businesses_updated_at
    BEFORE UPDATE ON businesses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();