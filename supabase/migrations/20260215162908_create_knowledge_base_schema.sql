/*
  # Knowledge Management System Schema

  ## Overview
  Complete schema for a knowledge management application with notes, categories, tags, and attachments.

  ## New Tables
  
  ### 1. `profiles`
  User profile information extending auth.users
  - `id` (uuid, primary key, references auth.users)
  - `email` (text)
  - `full_name` (text)
  - `avatar_url` (text, optional)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `categories`
  Note categories for organization
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `name` (text)
  - `color` (text, hex color code)
  - `icon` (text, lucide icon name)
  - `created_at` (timestamptz)

  ### 3. `tags`
  Tags for flexible note organization
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `name` (text)
  - `created_at` (timestamptz)

  ### 4. `notes`
  Main notes table with rich content
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `category_id` (uuid, references categories)
  - `title` (text)
  - `content` (text, rich text HTML)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 5. `note_tags`
  Many-to-many relationship between notes and tags
  - `note_id` (uuid, references notes)
  - `tag_id` (uuid, references tags)
  - Primary key: (note_id, tag_id)

  ### 6. `attachments`
  File attachments for notes (images, audio, video)
  - `id` (uuid, primary key)
  - `note_id` (uuid, references notes)
  - `file_name` (text)
  - `file_type` (text, e.g., 'image', 'audio', 'video')
  - `file_url` (text)
  - `file_size` (bigint, bytes)
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Users can only access their own data
  - Cascading deletes for related records
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text DEFAULT '#6366f1',
  icon text DEFAULT 'Folder',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own categories"
  ON categories FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
  ON categories FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, name)
);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tags"
  ON tags FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tags"
  ON tags FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tags"
  ON tags FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tags"
  ON tags FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  title text NOT NULL DEFAULT '',
  content text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notes"
  ON notes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes"
  ON notes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes"
  ON notes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes"
  ON notes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create note_tags junction table
CREATE TABLE IF NOT EXISTS note_tags (
  note_id uuid REFERENCES notes(id) ON DELETE CASCADE,
  tag_id uuid REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (note_id, tag_id)
);

ALTER TABLE note_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own note tags"
  ON note_tags FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM notes
      WHERE notes.id = note_tags.note_id
      AND notes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own note tags"
  ON note_tags FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM notes
      WHERE notes.id = note_tags.note_id
      AND notes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own note tags"
  ON note_tags FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM notes
      WHERE notes.id = note_tags.note_id
      AND notes.user_id = auth.uid()
    )
  );

-- Create attachments table
CREATE TABLE IF NOT EXISTS attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_url text NOT NULL,
  file_size bigint DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view attachments of own notes"
  ON attachments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM notes
      WHERE notes.id = attachments.note_id
      AND notes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert attachments to own notes"
  ON attachments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM notes
      WHERE notes.id = attachments.note_id
      AND notes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete attachments from own notes"
  ON attachments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM notes
      WHERE notes.id = attachments.note_id
      AND notes.user_id = auth.uid()
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_category_id ON notes(category_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_attachments_note_id ON attachments(note_id);
