-- ============================================
-- Cargo Guardian - Schema PostgreSQL
-- ============================================

-- Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum: roles de la aplicación
CREATE TYPE app_role AS ENUM ('admin', 'courier');

-- Enum: estado de entrega
CREATE TYPE delivery_status AS ENUM (
  'pending',
  'completed',
  'cancelled',
  'not_delivered_collected',
  'not_delivered_no_collection'
);

-- Enum: método de pago
CREATE TYPE payment_method AS ENUM (
  'cash',
  'transfer_to_courier',
  'transfer_to_client'
);

-- ============================================
-- Tabla: users (reemplaza auth.users de Supabase)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Tabla: user_roles
-- ============================================
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'courier',
  UNIQUE(user_id)
);

-- ============================================
-- Tabla: profiles
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Tabla: clients
-- ============================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  notes TEXT,
  balance NUMERIC DEFAULT 0,
  company TEXT,
  identification_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clients_identification_number ON clients(identification_number);

-- ============================================
-- Tabla: deliveries
-- ============================================
CREATE TABLE IF NOT EXISTS deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id),
  courier_id UUID NOT NULL REFERENCES users(id),
  created_by UUID NOT NULL REFERENCES users(id),
  amount NUMERIC NOT NULL,
  service_value NUMERIC NOT NULL DEFAULT 0,
  total_to_collect NUMERIC NOT NULL DEFAULT 0,
  received_amount NUMERIC,
  recipient_name TEXT,
  payment_method payment_method NOT NULL,
  status delivery_status NOT NULL DEFAULT 'pending',
  delivery_date DATE NOT NULL DEFAULT CURRENT_DATE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  notes TEXT,
  receipt_photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deliveries_client_id ON deliveries(client_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_courier_id ON deliveries(courier_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_delivery_date ON deliveries(delivery_date);

-- ============================================
-- Tabla: delivery_audit_log
-- ============================================
CREATE TABLE IF NOT EXISTS delivery_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID REFERENCES deliveries(id),
  action TEXT NOT NULL,
  changed_by UUID NOT NULL REFERENCES users(id),
  old_values JSONB,
  new_values JSONB,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Tabla: daily_base_money
-- ============================================
CREATE TABLE IF NOT EXISTS daily_base_money (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID NOT NULL REFERENCES users(id),
  assigned_by UUID NOT NULL REFERENCES users(id),
  amount NUMERIC NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Tabla: daily_settlements
-- ============================================
CREATE TABLE IF NOT EXISTS daily_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID NOT NULL REFERENCES users(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  base_money NUMERIC NOT NULL DEFAULT 0,
  total_collected NUMERIC NOT NULL DEFAULT 0,
  partial_deliveries_sum NUMERIC NOT NULL DEFAULT 0,
  expected_balance NUMERIC NOT NULL DEFAULT 0,
  actual_balance NUMERIC,
  difference NUMERIC,
  is_settled BOOLEAN NOT NULL DEFAULT false,
  settled_by UUID REFERENCES users(id),
  settled_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Tabla: partial_deliveries
-- ============================================
CREATE TABLE IF NOT EXISTS partial_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID NOT NULL REFERENCES users(id),
  received_by UUID NOT NULL REFERENCES users(id),
  amount NUMERIC NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Tabla: weekly_settlements
-- ============================================
CREATE TABLE IF NOT EXISTS weekly_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID NOT NULL REFERENCES users(id),
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  total_deliveries INTEGER NOT NULL DEFAULT 0,
  total_cash NUMERIC NOT NULL DEFAULT 0,
  total_transfers_courier NUMERIC NOT NULL DEFAULT 0,
  total_transfers_client NUMERIC NOT NULL DEFAULT 0,
  advances_deducted NUMERIC NOT NULL DEFAULT 0,
  final_balance NUMERIC NOT NULL DEFAULT 0,
  is_settled BOOLEAN NOT NULL DEFAULT false,
  settled_by UUID REFERENCES users(id),
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Tabla: salary_advances
-- ============================================
CREATE TABLE IF NOT EXISTS salary_advances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID NOT NULL REFERENCES users(id),
  created_by UUID NOT NULL REFERENCES users(id),
  amount NUMERIC NOT NULL,
  reason TEXT NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Tabla: operational_charges
-- ============================================
CREATE TABLE IF NOT EXISTS operational_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES users(id),
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Tabla: system_settings
-- ============================================
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Función: actualizar updated_at automáticamente
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deliveries_updated_at BEFORE UPDATE ON deliveries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
