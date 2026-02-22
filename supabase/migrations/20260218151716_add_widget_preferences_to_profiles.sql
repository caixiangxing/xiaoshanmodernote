/*
  # Add Widget Preferences to Profiles

  1. Changes
    - Adds `widget_preferences` JSONB column to `profiles` table (if it exists)
    - Stores user's widget visibility and order preferences for the Health Log dashboard
    - Defaults to NULL (will fall back to localStorage/defaults in the app)

  2. Notes
    - Uses IF NOT EXISTS guard to be idempotent
    - No RLS changes needed; profiles table already has RLS
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'widget_preferences'
  ) THEN
    ALTER TABLE profiles ADD COLUMN widget_preferences JSONB DEFAULT NULL;
  END IF;
END $$;
