import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
  created_at: string;
};

export type Tag = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
};

export type Note = {
  id: string;
  user_id: string;
  category_id?: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  category?: Category;
  tags?: Tag[];
};

export type Attachment = {
  id: string;
  note_id: string;
  file_name: string;
  file_type: string;
  file_url: string;
  file_size: number;
  created_at: string;
};

export type HealthRecord = {
  id: string;
  user_id: string;
  record_type: string;
  file_url?: string;
  file_name?: string;
  extracted_data: Record<string, any>;
  verified: boolean;
  record_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
};

export type MedicationPlan = {
  id: string;
  user_id: string;
  name: string;
  dosage: string;
  frequency: string;
  times: string[];
  total_pills: number;
  refill_threshold: number;
  start_date: string;
  end_date?: string;
  active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
};

export type MedicationLog = {
  id: string;
  user_id: string;
  medication_plan_id: string;
  taken_at: string;
  scheduled_time: string;
  created_at: string;
};

export type FitnessData = {
  id: string;
  user_id: string;
  date: string;
  steps: number;
  calories: number;
  workout_minutes: number;
  source: string;
  created_at: string;
  updated_at: string;
};

export type VitalSigns = {
  id: string;
  user_id: string;
  recorded_at: string;
  weight?: number;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  heart_rate?: number;
  blood_glucose?: number;
  temperature?: number;
  notes?: string;
  created_at: string;
};

export type FinanceTransaction = {
  id: string;
  user_id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  note?: string;
  is_narrative: boolean;
  source: string;
  created_at: string;
};
