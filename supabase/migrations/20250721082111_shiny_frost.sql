/*
  # Complete Livestock Management Database Schema

  1. New Tables
    - `goats` - Main goat records with all livestock information
    - `caretakers` - People responsible for goat care
    - `health_records` - Medical history and health tracking
    - `weight_records` - Weight measurements over time
    - `expenses` - Cost tracking for feed, medicine, etc.
    - `transactions` - Financial transactions (purchases, sales)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access only their own data

  3. Features
    - UUID primary keys with auto-generation
    - Proper foreign key relationships
    - Indexes for performance
    - Timestamps for audit trails
*/

-- Create goats table
CREATE TABLE IF NOT EXISTS goats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_number text NOT NULL,
  nickname text,
  breed text NOT NULL,
  gender text NOT NULL CHECK (gender IN ('Male', 'Female')),
  date_of_birth date NOT NULL,
  color text,
  current_weight numeric DEFAULT 0,
  photos text[] DEFAULT '{}',
  qr_code text NOT NULL,
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Sold', 'Deceased', 'Archived')),
  caretaker_id uuid,
  purchase_price numeric DEFAULT 0,
  purchase_date date NOT NULL,
  sale_price numeric,
  sale_date date,
  user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tag_number, user_id)
);

-- Create caretakers table
CREATE TABLE IF NOT EXISTS caretakers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  address text NOT NULL,
  payment_type text NOT NULL DEFAULT 'fixed' CHECK (payment_type IN ('fixed', 'percentage')),
  payment_amount numeric DEFAULT 0,
  total_earnings numeric DEFAULT 0,
  user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create health_records table
CREATE TABLE IF NOT EXISTS health_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goat_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('Vaccination', 'Illness', 'Injury', 'Deworming', 'Checkup', 'Reproductive')),
  date date NOT NULL,
  description text NOT NULL,
  treatment text,
  veterinarian text,
  cost numeric DEFAULT 0,
  notes text,
  status text NOT NULL DEFAULT 'Healthy' CHECK (status IN ('Healthy', 'Under Treatment', 'Recovered')),
  next_due_date date,
  user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create weight_records table
CREATE TABLE IF NOT EXISTS weight_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goat_id uuid NOT NULL,
  weight numeric NOT NULL,
  date date NOT NULL,
  notes text,
  user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goat_id uuid,
  caretaker_id uuid,
  category text NOT NULL CHECK (category IN ('Feed', 'Medicine', 'Transport', 'Veterinary', 'Other')),
  amount numeric NOT NULL,
  date date NOT NULL,
  description text NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goat_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('Purchase', 'Sale', 'Expense')),
  amount numeric NOT NULL,
  date date NOT NULL,
  description text NOT NULL,
  vendor text,
  buyer text,
  category text,
  user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add foreign key constraints
ALTER TABLE goats ADD CONSTRAINT fk_goats_caretaker 
  FOREIGN KEY (caretaker_id) REFERENCES caretakers(id) ON DELETE SET NULL;

ALTER TABLE health_records ADD CONSTRAINT fk_health_records_goat 
  FOREIGN KEY (goat_id) REFERENCES goats(id) ON DELETE CASCADE;

ALTER TABLE weight_records ADD CONSTRAINT fk_weight_records_goat 
  FOREIGN KEY (goat_id) REFERENCES goats(id) ON DELETE CASCADE;

ALTER TABLE expenses ADD CONSTRAINT fk_expenses_goat 
  FOREIGN KEY (goat_id) REFERENCES goats(id) ON DELETE SET NULL;

ALTER TABLE expenses ADD CONSTRAINT fk_expenses_caretaker 
  FOREIGN KEY (caretaker_id) REFERENCES caretakers(id) ON DELETE SET NULL;

ALTER TABLE transactions ADD CONSTRAINT fk_transactions_goat 
  FOREIGN KEY (goat_id) REFERENCES goats(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_goats_user_id ON goats(user_id);
CREATE INDEX IF NOT EXISTS idx_goats_tag_number ON goats(tag_number);
CREATE INDEX IF NOT EXISTS idx_goats_caretaker_id ON goats(caretaker_id);
CREATE INDEX IF NOT EXISTS idx_caretakers_user_id ON caretakers(user_id);
CREATE INDEX IF NOT EXISTS idx_health_records_user_id ON health_records(user_id);
CREATE INDEX IF NOT EXISTS idx_health_records_goat_id ON health_records(goat_id);
CREATE INDEX IF NOT EXISTS idx_weight_records_user_id ON weight_records(user_id);
CREATE INDEX IF NOT EXISTS idx_weight_records_goat_id ON weight_records(goat_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_goat_id ON transactions(goat_id);

-- Enable Row Level Security
ALTER TABLE goats ENABLE ROW LEVEL SECURITY;
ALTER TABLE caretakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for goats
CREATE POLICY "Users can manage their own goats"
  ON goats
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for caretakers
CREATE POLICY "Users can manage their own caretakers"
  ON caretakers
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for health_records
CREATE POLICY "Users can manage their own health records"
  ON health_records
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for weight_records
CREATE POLICY "Users can manage their own weight records"
  ON weight_records
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for expenses
CREATE POLICY "Users can manage their own expenses"
  ON expenses
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for transactions
CREATE POLICY "Users can manage their own transactions"
  ON transactions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for goats table
CREATE TRIGGER update_goats_updated_at 
  BEFORE UPDATE ON goats 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();