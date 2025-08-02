/*
  # Add photo column to caretakers table

  1. Changes
    - Add `photo` column to `caretakers` table to store profile photos
    - Column is nullable to make it optional
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'caretakers' AND column_name = 'photo'
  ) THEN
    ALTER TABLE caretakers ADD COLUMN photo text;
  END IF;
END $$;