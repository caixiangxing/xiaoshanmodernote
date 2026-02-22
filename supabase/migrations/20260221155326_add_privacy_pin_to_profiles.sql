/*
  # Add privacy_pin column to profiles

  ## Summary
  Adds a unified privacy PIN system for securing sensitive sections across the app.
  Users can set a custom PIN in Settings, with a default of "0000" for immediate access.

  ## Changes
  ### Modified Tables
  - `profiles`
    - `privacy_pin` (text, default '0000'): User's privacy PIN for accessing protected sections
      like Finance dashboard, Medical Records, and Medication Manager.

  ## Security
  - No new policies needed — existing `profiles` RLS already allows users
    to read and update their own row.
  - PIN is stored as plain text (4-digit code) for simplicity. Consider hashing
    if stronger security is needed in the future.

  ## Notes
  - Default PIN is "0000" to provide immediate access while encouraging users to set a custom PIN
  - This replaces individual section passwords with a unified privacy system
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'privacy_pin'
  ) THEN
    ALTER TABLE profiles ADD COLUMN privacy_pin text DEFAULT '0000';
  END IF;
END $$;
