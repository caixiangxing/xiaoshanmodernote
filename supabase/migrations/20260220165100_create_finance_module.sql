/*
  # Create Finance Module

  ## Summary
  Adds the finance_transactions table to support the new Finance module.
  Each transaction records an amount, type (income/expense), category,
  date, optional note, and an optional source tag (manual / omni_input).

  ## New Tables
  - `finance_transactions`
    - `id` (uuid, PK)
    - `user_id` (uuid, FK → auth.users)
    - `amount` (numeric, not null) — always positive
    - `type` (text) — 'income' | 'expense'
    - `category` (text) — e.g. 'food', 'transport', 'salary', etc.
    - `date` (date) — transaction date
    - `note` (text, nullable) — narrative text attached to the entry
    - `is_narrative` (boolean, default false) — true when note contains
         meaningful narrative text (used by smart feed filter)
    - `source` (text, default 'manual') — 'manual' | 'omni_input'
    - `created_at` (timestamptz)

  ## Security
  - RLS enabled
  - Users can only read/insert/update/delete their own rows
*/

CREATE TABLE IF NOT EXISTS finance_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric(12, 2) NOT NULL CHECK (amount > 0),
  type text NOT NULL DEFAULT 'expense' CHECK (type IN ('income', 'expense')),
  category text NOT NULL DEFAULT 'other',
  date date NOT NULL DEFAULT CURRENT_DATE,
  note text,
  is_narrative boolean NOT NULL DEFAULT false,
  source text NOT NULL DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE finance_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own finance transactions"
  ON finance_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own finance transactions"
  ON finance_transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own finance transactions"
  ON finance_transactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own finance transactions"
  ON finance_transactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS finance_transactions_user_date_idx
  ON finance_transactions(user_id, date DESC);
