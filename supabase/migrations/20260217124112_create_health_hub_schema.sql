/*
  # Smart Health Hub Schema

  1. New Tables
    - `health_records`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `record_type` (text: 'lab_report', 'imaging', 'prescription', 'other')
      - `file_url` (text, nullable - for uploaded files)
      - `file_name` (text, nullable)
      - `extracted_data` (jsonb - stores AI extracted values)
      - `verified` (boolean - user confirmed the data)
      - `record_date` (timestamptz - date of the medical record)
      - `notes` (text, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `medication_plans`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text - medication name)
      - `dosage` (text - e.g., "500mg")
      - `frequency` (text - e.g., "twice daily")
      - `times` (text[] - array of times like ["08:00", "20:00"])
      - `total_pills` (integer - inventory count)
      - `refill_threshold` (integer - when to show refill reminder)
      - `start_date` (date)
      - `end_date` (date, nullable)
      - `active` (boolean)
      - `notes` (text, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `medication_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `medication_plan_id` (uuid, references medication_plans)
      - `taken_at` (timestamptz)
      - `scheduled_time` (text - the scheduled time slot)
      - `created_at` (timestamptz)
    
    - `fitness_data`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `date` (date)
      - `steps` (integer, default 0)
      - `calories` (integer, default 0)
      - `workout_minutes` (integer, default 0)
      - `source` (text - e.g., "manual", "ios_shortcuts", "api")
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `vital_signs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `recorded_at` (timestamptz)
      - `weight` (numeric, nullable)
      - `blood_pressure_systolic` (integer, nullable)
      - `blood_pressure_diastolic` (integer, nullable)
      - `heart_rate` (integer, nullable)
      - `blood_glucose` (numeric, nullable)
      - `temperature` (numeric, nullable)
      - `notes` (text, nullable)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Health Records Table
CREATE TABLE IF NOT EXISTS health_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  record_type text NOT NULL DEFAULT 'other',
  file_url text,
  file_name text,
  extracted_data jsonb DEFAULT '{}'::jsonb,
  verified boolean DEFAULT false,
  record_date timestamptz DEFAULT now(),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own health records"
  ON health_records FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health records"
  ON health_records FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health records"
  ON health_records FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own health records"
  ON health_records FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Medication Plans Table
CREATE TABLE IF NOT EXISTS medication_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  dosage text NOT NULL,
  frequency text NOT NULL,
  times text[] DEFAULT ARRAY[]::text[],
  total_pills integer DEFAULT 0,
  refill_threshold integer DEFAULT 5,
  start_date date DEFAULT CURRENT_DATE,
  end_date date,
  active boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE medication_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own medication plans"
  ON medication_plans FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own medication plans"
  ON medication_plans FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own medication plans"
  ON medication_plans FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own medication plans"
  ON medication_plans FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Medication Logs Table
CREATE TABLE IF NOT EXISTS medication_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  medication_plan_id uuid REFERENCES medication_plans(id) ON DELETE CASCADE NOT NULL,
  taken_at timestamptz DEFAULT now(),
  scheduled_time text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE medication_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own medication logs"
  ON medication_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own medication logs"
  ON medication_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own medication logs"
  ON medication_logs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Fitness Data Table
CREATE TABLE IF NOT EXISTS fitness_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date date DEFAULT CURRENT_DATE,
  steps integer DEFAULT 0,
  calories integer DEFAULT 0,
  workout_minutes integer DEFAULT 0,
  source text DEFAULT 'manual',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date, source)
);

ALTER TABLE fitness_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own fitness data"
  ON fitness_data FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fitness data"
  ON fitness_data FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fitness data"
  ON fitness_data FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own fitness data"
  ON fitness_data FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Vital Signs Table
CREATE TABLE IF NOT EXISTS vital_signs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recorded_at timestamptz DEFAULT now(),
  weight numeric,
  blood_pressure_systolic integer,
  blood_pressure_diastolic integer,
  heart_rate integer,
  blood_glucose numeric,
  temperature numeric,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE vital_signs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own vital signs"
  ON vital_signs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vital signs"
  ON vital_signs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vital signs"
  ON vital_signs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own vital signs"
  ON vital_signs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_health_records_user_id ON health_records(user_id);
CREATE INDEX IF NOT EXISTS idx_health_records_record_date ON health_records(record_date);
CREATE INDEX IF NOT EXISTS idx_medication_plans_user_id ON medication_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_medication_plans_active ON medication_plans(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_medication_logs_user_id ON medication_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_medication_logs_plan_id ON medication_logs(medication_plan_id);
CREATE INDEX IF NOT EXISTS idx_fitness_data_user_date ON fitness_data(user_id, date);
CREATE INDEX IF NOT EXISTS idx_vital_signs_user_recorded ON vital_signs(user_id, recorded_at);
