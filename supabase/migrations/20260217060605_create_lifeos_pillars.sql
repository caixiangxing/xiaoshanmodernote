/*
  # LifeOS: Three Pillars Architecture
  
  ## Overview
  This migration transforms the application into LifeOS with three core pillars:
  - Biological (Body): Health metrics, medical records, genetic data
  - Emotional (Soul): Mood tracking and emotional patterns
  - Cognitive (Mind): Enhanced note-taking with AI connections
  
  ## New Tables
  
  ### 1. health_logs
  Tracks daily health metrics with flexible JSONB structure
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `logged_at` (timestamptz) - when the measurement was taken
  - `metrics` (jsonb) - flexible structure for any health data
    Examples: {"blood_pressure": "120/80", "heart_rate": 72, "weight": 70.5}
  - `notes` (text) - optional contextual notes
  - `created_at` (timestamptz)
  
  ### 2. mood_logs
  Tracks emotional state over time
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `mood_score` (integer) - 1-10 scale
  - `emotions` (text[]) - array of emotion tags
  - `context` (text) - what influenced this mood
  - `logged_at` (timestamptz)
  - `created_at` (timestamptz)
  
  ### 3. medical_documents
  Stores uploaded medical reports and health documents
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `title` (text) - document name
  - `document_type` (text) - e.g., "lab_report", "x_ray", "prescription"
  - `file_url` (text) - storage URL
  - `file_size` (integer) - in bytes
  - `mime_type` (text)
  - `upload_date` (timestamptz)
  - `metadata` (jsonb) - flexible additional data
  - `created_at` (timestamptz)
  
  ### 4. genetic_insights
  Stores genomic markers and DNA analysis data
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `marker_name` (text) - e.g., "MTHFR"
  - `result` (text) - e.g., "Mutation Detected"
  - `details` (jsonb) - additional technical details
  - `source` (text) - where this data came from
  - `recorded_at` (timestamptz)
  - `created_at` (timestamptz)
  
  ### 5. health_alerts
  Tracks automated health alerts based on thresholds
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `metric_name` (text) - which metric triggered the alert
  - `threshold_value` (text) - the threshold that was exceeded
  - `actual_value` (text) - the measured value
  - `severity` (text) - "low", "medium", "high"
  - `acknowledged` (boolean) - whether user has seen it
  - `triggered_at` (timestamptz)
  - `created_at` (timestamptz)
  
  ### 6. user_settings
  Stores user preferences and AI consent
  - `user_id` (uuid, primary key, foreign key to auth.users)
  - `ai_training_consent` (boolean) - allow AI to learn from notes
  - `theme` (text) - UI theme preference
  - `privacy_mode` (boolean) - extra privacy features
  - `preferences` (jsonb) - flexible settings storage
  - `updated_at` (timestamptz)
  
  ## Security
  All tables have RLS enabled with policies for authenticated users to:
  - SELECT, INSERT, UPDATE, DELETE their own data only
  - No cross-user data access
*/

-- Create health_logs table
CREATE TABLE IF NOT EXISTS health_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  logged_at timestamptz NOT NULL DEFAULT now(),
  metrics jsonb NOT NULL DEFAULT '{}',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS health_logs_user_id_idx ON health_logs(user_id);
CREATE INDEX IF NOT EXISTS health_logs_logged_at_idx ON health_logs(logged_at DESC);
CREATE INDEX IF NOT EXISTS health_logs_metrics_idx ON health_logs USING gin(metrics);

ALTER TABLE health_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own health logs"
  ON health_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own health logs"
  ON health_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health logs"
  ON health_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own health logs"
  ON health_logs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create mood_logs table
CREATE TABLE IF NOT EXISTS mood_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mood_score integer NOT NULL CHECK (mood_score >= 1 AND mood_score <= 10),
  emotions text[] DEFAULT '{}',
  context text DEFAULT '',
  logged_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mood_logs_user_id_idx ON mood_logs(user_id);
CREATE INDEX IF NOT EXISTS mood_logs_logged_at_idx ON mood_logs(logged_at DESC);
CREATE INDEX IF NOT EXISTS mood_logs_score_idx ON mood_logs(mood_score);

ALTER TABLE mood_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mood logs"
  ON mood_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own mood logs"
  ON mood_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mood logs"
  ON mood_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own mood logs"
  ON mood_logs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create medical_documents table
CREATE TABLE IF NOT EXISTS medical_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  document_type text DEFAULT 'general',
  file_url text NOT NULL,
  file_size integer DEFAULT 0,
  mime_type text DEFAULT 'application/pdf',
  upload_date timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS medical_documents_user_id_idx ON medical_documents(user_id);
CREATE INDEX IF NOT EXISTS medical_documents_upload_date_idx ON medical_documents(upload_date DESC);

ALTER TABLE medical_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own medical documents"
  ON medical_documents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own medical documents"
  ON medical_documents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own medical documents"
  ON medical_documents FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own medical documents"
  ON medical_documents FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create genetic_insights table
CREATE TABLE IF NOT EXISTS genetic_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  marker_name text NOT NULL,
  result text NOT NULL,
  details jsonb DEFAULT '{}',
  source text DEFAULT 'manual',
  recorded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS genetic_insights_user_id_idx ON genetic_insights(user_id);
CREATE INDEX IF NOT EXISTS genetic_insights_marker_idx ON genetic_insights(marker_name);

ALTER TABLE genetic_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own genetic insights"
  ON genetic_insights FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own genetic insights"
  ON genetic_insights FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own genetic insights"
  ON genetic_insights FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own genetic insights"
  ON genetic_insights FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create health_alerts table
CREATE TABLE IF NOT EXISTS health_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  metric_name text NOT NULL,
  threshold_value text NOT NULL,
  actual_value text NOT NULL,
  severity text DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  acknowledged boolean DEFAULT false,
  triggered_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS health_alerts_user_id_idx ON health_alerts(user_id);
CREATE INDEX IF NOT EXISTS health_alerts_acknowledged_idx ON health_alerts(acknowledged);
CREATE INDEX IF NOT EXISTS health_alerts_severity_idx ON health_alerts(severity);

ALTER TABLE health_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own health alerts"
  ON health_alerts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own health alerts"
  ON health_alerts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health alerts"
  ON health_alerts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own health alerts"
  ON health_alerts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  ai_training_consent boolean DEFAULT false,
  theme text DEFAULT 'system',
  privacy_mode boolean DEFAULT false,
  preferences jsonb DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own settings"
  ON user_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings"
  ON user_settings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);