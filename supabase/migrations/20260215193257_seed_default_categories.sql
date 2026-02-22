/*
  # Seed Default Categories

  ## Overview
  This migration adds default categories for new users to provide a better onboarding experience.

  ## Changes
  Creates a function to automatically seed default categories when a new user profile is created.
  
  ## Default Categories
  1. 人物记录 (Person Log) - Purple
  2. 日记 (Journal) - Blue
  3. 灵感时刻 (Eureka Moments) - Yellow
  4. 生活记录 (Life Log) - Green
  5. 读书笔记 (Reading Notes) - Pink

  ## Implementation
  - Creates a trigger function that runs after profile insert
  - Automatically creates default categories for new users
*/

-- Function to create default categories for new users
CREATE OR REPLACE FUNCTION create_default_categories()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO categories (user_id, name, color, icon) VALUES
    (NEW.id, '人物记录', '#8b5cf6', 'User'),
    (NEW.id, '日记', '#3b82f6', 'BookOpen'),
    (NEW.id, '灵感时刻', '#f59e0b', 'Lightbulb'),
    (NEW.id, '生活记录', '#10b981', 'Heart'),
    (NEW.id, '读书笔记', '#ec4899', 'BookMarked');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create categories for new users
DROP TRIGGER IF EXISTS trigger_create_default_categories ON profiles;
CREATE TRIGGER trigger_create_default_categories
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_categories();
