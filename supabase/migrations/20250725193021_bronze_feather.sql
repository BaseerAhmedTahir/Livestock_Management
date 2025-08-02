/*
  # Add permissions column to user_business_roles table

  1. Schema Changes
    - Add `permissions` column to `user_business_roles` table
    - Column type: jsonb with default empty object
    - This will store caretaker permissions as JSON data

  2. Purpose
    - Enables granular permission control for caretakers
    - Allows business owners to customize what caretakers can access
    - Maintains backward compatibility with existing records
*/

-- Add permissions column to user_business_roles table
ALTER TABLE user_business_roles 
ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '{}'::jsonb;

-- Update existing records to have default permissions structure
UPDATE user_business_roles 
SET permissions = '{
  "dashboard": true,
  "goats": true,
  "health": true,
  "scanner": true,
  "settings": true,
  "caretakers": false,
  "finances": false,
  "reports": false
}'::jsonb
WHERE permissions IS NULL OR permissions = '{}'::jsonb;