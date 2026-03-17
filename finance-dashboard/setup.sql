-- =============================================================
-- FINANCE DASHBOARD — Setup Completo do Banco de Dados
-- Supabase (PostgreSQL)
-- Execute este script no SQL Editor do seu projeto Supabase.
-- =============================================================

-- Extensão UUID (necessária para geração de IDs)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================
-- TABELAS PRINCIPAIS
-- =============================================================

-- Rendas (salário, freelance, etc.)
CREATE TABLE IF NOT EXISTS incomes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date TEXT NOT NULL,
  source TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  recurring BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gastos fixos (aluguel, internet, academia, etc.)
CREATE TABLE IF NOT EXISTS fixed_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE,
  category TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('fixed', 'installment')),
  installments INTEGER,
  current_installment INTEGER,
  paid BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gastos variáveis (supermercado, lazer, restaurante, etc.)
CREATE TABLE IF NOT EXISTS variable_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Despesas de cartão de crédito (parceladas ou à vista)
CREATE TABLE IF NOT EXISTS credit_card_expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  description TEXT NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  installments INTEGER NOT NULL DEFAULT 1,
  current_installment INTEGER NOT NULL DEFAULT 1,
  bank_name TEXT NOT NULL,
  category TEXT NOT NULL,
  paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Limites dos cartões de crédito por banco
CREATE TABLE IF NOT EXISTS credit_card_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  limit_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  due_day INTEGER,  -- Dia do mês em que vence a fatura (1-31)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, bank_name),
  CONSTRAINT due_day_range CHECK (due_day IS NULL OR (due_day >= 1 AND due_day <= 31))
);

-- Metas financeiras (viagem, reserva de emergência, etc.)
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  target_amount DECIMAL(10, 2) NOT NULL,
  current_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  deadline TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configurações do usuário (reserva de emergência, categorias personalizadas)
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  emergency_reserve DECIMAL(10, 2) NOT NULL DEFAULT 0,
  categories JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================
-- ROW LEVEL SECURITY (RLS)
-- Garante que cada usuário acessa apenas os seus próprios dados
-- =============================================================

ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE variable_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_card_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_card_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Políticas para incomes
DROP POLICY IF EXISTS "Users can view their own incomes" ON incomes;
CREATE POLICY "Users can view their own incomes" ON incomes FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own incomes" ON incomes;
CREATE POLICY "Users can insert their own incomes" ON incomes FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own incomes" ON incomes;
CREATE POLICY "Users can update their own incomes" ON incomes FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own incomes" ON incomes;
CREATE POLICY "Users can delete their own incomes" ON incomes FOR DELETE USING (auth.uid() = user_id);

-- Políticas para fixed_expenses
DROP POLICY IF EXISTS "Users can view their own fixed expenses" ON fixed_expenses;
CREATE POLICY "Users can view their own fixed expenses" ON fixed_expenses FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own fixed expenses" ON fixed_expenses;
CREATE POLICY "Users can insert their own fixed expenses" ON fixed_expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own fixed expenses" ON fixed_expenses;
CREATE POLICY "Users can update their own fixed expenses" ON fixed_expenses FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own fixed expenses" ON fixed_expenses;
CREATE POLICY "Users can delete their own fixed expenses" ON fixed_expenses FOR DELETE USING (auth.uid() = user_id);

-- Políticas para variable_expenses
DROP POLICY IF EXISTS "Users can view their own variable expenses" ON variable_expenses;
CREATE POLICY "Users can view their own variable expenses" ON variable_expenses FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own variable expenses" ON variable_expenses;
CREATE POLICY "Users can insert their own variable expenses" ON variable_expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own variable expenses" ON variable_expenses;
CREATE POLICY "Users can update their own variable expenses" ON variable_expenses FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own variable expenses" ON variable_expenses;
CREATE POLICY "Users can delete their own variable expenses" ON variable_expenses FOR DELETE USING (auth.uid() = user_id);

-- Políticas para credit_card_expenses
DROP POLICY IF EXISTS "Users can view their own credit card expenses" ON credit_card_expenses;
CREATE POLICY "Users can view their own credit card expenses" ON credit_card_expenses FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own credit card expenses" ON credit_card_expenses;
CREATE POLICY "Users can insert their own credit card expenses" ON credit_card_expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own credit card expenses" ON credit_card_expenses;
CREATE POLICY "Users can update their own credit card expenses" ON credit_card_expenses FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own credit card expenses" ON credit_card_expenses;
CREATE POLICY "Users can delete their own credit card expenses" ON credit_card_expenses FOR DELETE USING (auth.uid() = user_id);

-- Políticas para credit_card_limits
DROP POLICY IF EXISTS "Users can view their own credit card limits" ON credit_card_limits;
CREATE POLICY "Users can view their own credit card limits" ON credit_card_limits FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own credit card limits" ON credit_card_limits;
CREATE POLICY "Users can insert their own credit card limits" ON credit_card_limits FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own credit card limits" ON credit_card_limits;
CREATE POLICY "Users can update their own credit card limits" ON credit_card_limits FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own credit card limits" ON credit_card_limits;
CREATE POLICY "Users can delete their own credit card limits" ON credit_card_limits FOR DELETE USING (auth.uid() = user_id);

-- Políticas para goals
DROP POLICY IF EXISTS "Users can view their own goals" ON goals;
CREATE POLICY "Users can view their own goals" ON goals FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own goals" ON goals;
CREATE POLICY "Users can insert their own goals" ON goals FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own goals" ON goals;
CREATE POLICY "Users can update their own goals" ON goals FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own goals" ON goals;
CREATE POLICY "Users can delete their own goals" ON goals FOR DELETE USING (auth.uid() = user_id);

-- Políticas para user_settings
DROP POLICY IF EXISTS "Users can view their own settings" ON user_settings;
CREATE POLICY "Users can view their own settings" ON user_settings FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own settings" ON user_settings;
CREATE POLICY "Users can insert their own settings" ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own settings" ON user_settings;
CREATE POLICY "Users can update their own settings" ON user_settings FOR UPDATE USING (auth.uid() = user_id);

-- =============================================================
-- ÍNDICES (para melhor performance)
-- =============================================================

CREATE INDEX IF NOT EXISTS idx_incomes_user_id ON incomes(user_id);
CREATE INDEX IF NOT EXISTS idx_fixed_expenses_user_id ON fixed_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_variable_expenses_user_id ON variable_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_card_expenses_user_id ON credit_card_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_card_expenses_date ON credit_card_expenses(date);
CREATE INDEX IF NOT EXISTS idx_credit_card_limits_user_id ON credit_card_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- =============================================================
-- FUNÇÃO E TRIGGER: atualiza updated_at automaticamente
-- =============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_credit_card_expenses_updated_at ON credit_card_expenses;
CREATE TRIGGER update_credit_card_expenses_updated_at
  BEFORE UPDATE ON credit_card_expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_credit_card_limits_updated_at ON credit_card_limits;
CREATE TRIGGER update_credit_card_limits_updated_at
  BEFORE UPDATE ON credit_card_limits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================
-- Pronto! Seu banco de dados está configurado.
-- Agora configure as variáveis de ambiente no arquivo .env.local
-- e execute: npm install && npm run dev
-- =============================================================
