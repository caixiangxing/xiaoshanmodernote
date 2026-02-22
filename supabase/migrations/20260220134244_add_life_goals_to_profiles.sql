/*
  # Add life_goals JSONB column to profiles

  ## Summary
  Stores each user's personal goal targets for the Life Panorama Index Engine.
  Goals are persisted per-user so the chart always reflects their custom targets
  on any device.

  ## Changes
  ### Modified Tables
  - `profiles`
    - `life_goals` (jsonb, nullable): Stores writing_target, steps_target,
      workout_target, weight_target, bp_systolic_target, glucose_target,
      mood_target, words_per_learning_session.

  ## Security
  - No new policies needed — existing `profiles` RLS already allows users
    to read and update their own row.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'life_goals'
  ) THEN
    ALTER TABLE profiles ADD COLUMN life_goals jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;
