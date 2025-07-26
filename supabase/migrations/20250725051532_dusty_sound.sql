/*
  # Fix tag number uniqueness constraint

  1. Changes
    - Drop existing unique constraint `goats_tag_number_user_id_key` 
    - Add new unique constraint on `tag_number` and `business_id`
    - This allows same tag numbers across different businesses while maintaining uniqueness within each business

  2. Impact
    - Resolves the conflict between application logic and database constraints
    - Enables proper multi-business functionality
*/

-- Drop the existing constraint that enforces uniqueness per user
ALTER TABLE goats DROP CONSTRAINT IF EXISTS goats_tag_number_user_id_key;

-- Add new constraint that enforces uniqueness per business
ALTER TABLE goats ADD CONSTRAINT goats_tag_number_business_id_key UNIQUE (tag_number, business_id);