-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('admin', 'courier');

-- Create enum for payment methods
CREATE TYPE public.payment_method AS ENUM ('cash', 'transfer_to_courier', 'transfer_to_client');

-- Create enum for delivery status
CREATE TYPE public.delivery_status AS ENUM ('pending', 'completed', 'cancelled');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'courier',
  UNIQUE(user_id, role)
);

-- Create clients table
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  notes TEXT,
  balance DECIMAL(12,2) DEFAULT 0, -- Positive means client owes money
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create deliveries table
CREATE TABLE public.deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID REFERENCES auth.users(id) NOT NULL,
  client_id UUID REFERENCES public.clients(id) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  payment_method payment_method NOT NULL,
  status delivery_status NOT NULL DEFAULT 'completed',
  receipt_photo_url TEXT,
  notes TEXT,
  delivery_date DATE NOT NULL DEFAULT CURRENT_DATE,
  week_start DATE NOT NULL, -- Saturday of the week
  week_end DATE NOT NULL,   -- Friday of the week
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) NOT NULL
);

-- Create audit log for tracking all changes (admin only)
CREATE TABLE public.delivery_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID REFERENCES public.deliveries(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'created', 'updated', 'cancelled'
  changed_by UUID REFERENCES auth.users(id) NOT NULL,
  old_values JSONB,
  new_values JSONB,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create salary advances table (for courier shortages)
CREATE TABLE public.salary_advances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID REFERENCES auth.users(id) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  reason TEXT NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) NOT NULL
);

-- Create weekly settlements table
CREATE TABLE public.weekly_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID REFERENCES auth.users(id) NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  total_deliveries INTEGER NOT NULL DEFAULT 0,
  total_cash DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_transfers_courier DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_transfers_client DECIMAL(12,2) NOT NULL DEFAULT 0,
  advances_deducted DECIMAL(12,2) NOT NULL DEFAULT 0,
  final_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  is_settled BOOLEAN NOT NULL DEFAULT false,
  settled_at TIMESTAMPTZ,
  settled_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(courier_id, week_start, week_end)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_settlements ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get current user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User roles policies (admin only management)
CREATE POLICY "Users can view their own role"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Clients policies (all authenticated can view, admin manages)
CREATE POLICY "Authenticated users can view clients"
  ON public.clients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage clients"
  ON public.clients FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Deliveries policies
CREATE POLICY "Couriers can view their own deliveries"
  ON public.deliveries FOR SELECT
  USING (auth.uid() = courier_id);

CREATE POLICY "Admins can view all deliveries"
  ON public.deliveries FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Couriers can insert their own deliveries"
  ON public.deliveries FOR INSERT
  WITH CHECK (auth.uid() = courier_id AND auth.uid() = created_by);

CREATE POLICY "ONLY admins can update deliveries"
  ON public.deliveries FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "ONLY admins can delete deliveries"
  ON public.deliveries FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Audit log policies (admin only)
CREATE POLICY "Admins can view audit log"
  ON public.delivery_audit_log FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert audit log"
  ON public.delivery_audit_log FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Salary advances policies
CREATE POLICY "Couriers can view their own advances"
  ON public.salary_advances FOR SELECT
  USING (auth.uid() = courier_id);

CREATE POLICY "Admins can view all advances"
  ON public.salary_advances FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage advances"
  ON public.salary_advances FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Weekly settlements policies
CREATE POLICY "Couriers can view their own settlements"
  ON public.weekly_settlements FOR SELECT
  USING (auth.uid() = courier_id);

CREATE POLICY "Admins can view all settlements"
  ON public.weekly_settlements FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage settlements"
  ON public.weekly_settlements FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_deliveries_updated_at
  BEFORE UPDATE ON public.deliveries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create auto profile creation trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  
  -- Default role is courier
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'courier');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create storage bucket for receipt photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true);

-- Storage policies for receipts
CREATE POLICY "Authenticated users can upload receipts"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'receipts' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view receipts"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'receipts');

CREATE POLICY "Admins can delete receipts"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'receipts' AND public.has_role(auth.uid(), 'admin'));