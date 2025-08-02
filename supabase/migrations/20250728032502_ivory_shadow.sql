/*
  # Update business fields for payment model and address

  1. Changes
    - Add `address` field to businesses table
    - Add `payment_model_type` field to businesses table (percentage or monthly)
    - Add `payment_model_amount` field to businesses table
    - Remove payment fields from caretakers table (keep for backward compatibility initially)
    - Update existing businesses with default values

  2. Security
    - Maintain existing RLS policies
    - Ensure data consistency during migration
*/

-- Add new fields to businesses table
DO $$
BEGIN
  -- Add address field if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'businesses' AND column_name = 'address'
  ) THEN
    ALTER TABLE businesses ADD COLUMN address text NOT NULL DEFAULT 'Not specified';
  END IF;

  -- Add payment_model_type field if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'businesses' AND column_name = 'payment_model_type'
  ) THEN
    ALTER TABLE businesses ADD COLUMN payment_model_type text DEFAULT 'percentage' CHECK (payment_model_type IN ('percentage', 'monthly'));
  END IF;

  -- Add payment_model_amount field if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'businesses' AND column_name = 'payment_model_amount'
  ) THEN
    ALTER TABLE businesses ADD COLUMN payment_model_amount numeric DEFAULT 15;
  END IF;
END $$;

-- Update existing businesses with default values
UPDATE businesses 
SET 
  address = COALESCE(address, 'Not specified'),
  payment_model_type = COALESCE(payment_model_type, 'percentage'),
  payment_model_amount = COALESCE(payment_model_amount, 15)
WHERE address IS NULL OR payment_model_type IS NULL OR payment_model_amount IS NULL;

-- Make address field NOT NULL after setting defaults
ALTER TABLE businesses ALTER COLUMN address SET NOT NULL;