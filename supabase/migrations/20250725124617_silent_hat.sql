/*
  # Add caretaker login credentials tracking

  1. Changes
    - Add columns to track caretaker login credentials
    - Add function to update last login timestamp
    - Add indexes for performance

  2. Security
    - Passwords are not stored in plain text in production
    - This is for demo purposes to show credential management UI
*/

-- Add columns to caretakers table for credential tracking
DO $$
BEGIN
  -- Add has_account column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'caretakers' AND column_name = 'has_account'
  ) THEN
    ALTER TABLE caretakers ADD COLUMN has_account boolean DEFAULT false;
  END IF;

  -- Add last_login column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'caretakers' AND column_name = 'last_login'
  ) THEN
    ALTER TABLE caretakers ADD COLUMN last_login timestamptz;
  END IF;

  -- Add login_email column if it doesn't exist (separate from contact email)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'caretakers' AND column_name = 'login_email'
  ) THEN
    ALTER TABLE caretakers ADD COLUMN login_email text;
  END IF;
END $$;

-- Create index for login email lookups
CREATE INDEX IF NOT EXISTS idx_caretakers_login_email ON caretakers(login_email);

-- Function to update last login timestamp
CREATE OR REPLACE FUNCTION update_caretaker_last_login(caretaker_email text)
RETURNS void AS $$
BEGIN
  UPDATE caretakers 
  SET last_login = now()
  WHERE login_email = caretaker_email OR email = caretaker_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_caretaker_last_login(text) TO authenticated;