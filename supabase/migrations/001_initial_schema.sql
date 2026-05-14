-- Finance Pro Initial Schema for Supabase
-- This migration creates the initial database schema for the Finance Pro application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create accounts table
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('checking', 'savings', 'credit_card', 'cash', 'investment')),
  balance NUMERIC NOT NULL DEFAULT 0,
  initial_balance NUMERIC NOT NULL DEFAULT 0,
  initial_balance_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  color TEXT,
  icon TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'both')),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  is_consolidated BOOLEAN NOT NULL DEFAULT FALSE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  installment_id TEXT,
  installment_number INTEGER,
  total_installments INTEGER,
  to_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  transfer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_installment_id ON transactions(installment_id) WHERE installment_id IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for accounts
CREATE POLICY "Users can view their own accounts" ON accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own accounts" ON accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accounts" ON accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own accounts" ON accounts
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for categories
-- Users can view default categories (user_id is NULL) and their own categories
CREATE POLICY "Users can view default and own categories" ON categories
  FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can create their own categories" ON categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories" ON categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories" ON categories
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for transactions
CREATE POLICY "Users can view their own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions" ON transactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions" ON transactions
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories (Brazilian Portuguese to match Firebase)
INSERT INTO categories (name, icon, color, type, user_id) VALUES
  ('Alimentação', 'Utensils', '#94a3b8', 'expense', NULL),
  ('Carro', 'Car', '#fca5a5', 'expense', NULL),
  ('Casa', 'Home', '#8b5cf6', 'expense', NULL),
  ('Educação', 'GraduationCap', '#10b981', 'expense', NULL),
  ('Lazer', 'Gamepad2', '#f59e0b', 'expense', NULL),
  ('Saúde', 'HeartPulse', '#ef4444', 'expense', NULL),
  ('Trabalho', 'Briefcase', '#3b82f6', 'income', NULL),
  ('Investimento', 'TrendingUp', '#06b6d4', 'both', NULL);

-- Create a function for atomic field increment
-- This prevents race conditions when updating numeric fields concurrently
CREATE OR REPLACE FUNCTION increment_field(
  table_name TEXT,
  record_id UUID,
  field_name TEXT,
  increment_value NUMERIC
)
RETURNS VOID AS $$
DECLARE
  query TEXT;
  user_id_value UUID;
  record_user_id UUID;
BEGIN
  -- Get the current authenticated user
  user_id_value := auth.uid();
  
  -- Validate user is authenticated
  IF user_id_value IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Validate table_name is one of our allowed tables
  IF table_name NOT IN ('accounts', 'transactions') THEN
    RAISE EXCEPTION 'Invalid table name';
  END IF;
  
  -- Validate field_name to prevent SQL injection
  IF field_name !~ '^[a-z_]+$' THEN
    RAISE EXCEPTION 'Invalid field name';
  END IF;
  
  -- Check if the record belongs to the current user
  query := format('SELECT user_id FROM %I WHERE id = $1', table_name);
  EXECUTE query INTO record_user_id USING record_id;
  
  IF record_user_id IS NULL THEN
    RAISE EXCEPTION 'Record not found';
  END IF;
  
  IF record_user_id != user_id_value THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;
  
  -- Perform the increment
  query := format(
    'UPDATE %I SET %I = COALESCE(%I, 0) + $1 WHERE id = $2 AND user_id = $3',
    table_name,
    field_name,
    field_name
  );
  EXECUTE query USING increment_value, record_id, user_id_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_field TO authenticated;
