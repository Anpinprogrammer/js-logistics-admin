-- Table for daily base money assigned to couriers
CREATE TABLE public.daily_base_money (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  courier_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC NOT NULL DEFAULT 0,
  assigned_by UUID NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(courier_id, date)
);

-- Table for partial money deliveries during the day
CREATE TABLE public.partial_deliveries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  courier_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC NOT NULL,
  received_by UUID NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for operational charges (e.g., collectors)
CREATE TABLE public.operational_charges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 70000,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for daily settlements per courier
CREATE TABLE public.daily_settlements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  courier_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  base_money NUMERIC NOT NULL DEFAULT 0,
  total_collected NUMERIC NOT NULL DEFAULT 0,
  partial_deliveries_sum NUMERIC NOT NULL DEFAULT 0,
  expected_balance NUMERIC NOT NULL DEFAULT 0,
  actual_balance NUMERIC,
  difference NUMERIC,
  is_settled BOOLEAN NOT NULL DEFAULT false,
  settled_by UUID,
  settled_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(courier_id, date)
);

-- System settings for default values
CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID
);

-- Insert default operational charge amount
INSERT INTO public.system_settings (key, value) 
VALUES ('default_operational_charge', '{"amount": 70000}'),
       ('daily_courier_discount', '{"amount": 20000}');

-- Enable RLS on all new tables
ALTER TABLE public.daily_base_money ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partial_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operational_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily_base_money
CREATE POLICY "Admins can manage daily base money" 
ON public.daily_base_money FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Couriers can view their own base money" 
ON public.daily_base_money FOR SELECT 
USING (auth.uid() = courier_id);

-- RLS Policies for partial_deliveries
CREATE POLICY "Admins can manage partial deliveries" 
ON public.partial_deliveries FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Couriers can view their own partial deliveries" 
ON public.partial_deliveries FOR SELECT 
USING (auth.uid() = courier_id);

-- RLS Policies for operational_charges
CREATE POLICY "Admins can manage operational charges" 
ON public.operational_charges FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for daily_settlements
CREATE POLICY "Admins can manage daily settlements" 
ON public.daily_settlements FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Couriers can view their own settlements" 
ON public.daily_settlements FOR SELECT 
USING (auth.uid() = courier_id);

-- RLS Policies for system_settings
CREATE POLICY "Admins can manage settings" 
ON public.system_settings FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view settings" 
ON public.system_settings FOR SELECT 
USING (true);