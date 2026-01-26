-- Add new financial columns to deliveries
ALTER TABLE public.deliveries 
ADD COLUMN IF NOT EXISTS service_value numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_to_collect numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS received_amount numeric;

-- Update existing records: migrate 'amount' to 'total_to_collect' and 'service_value'
UPDATE public.deliveries 
SET service_value = amount, 
    total_to_collect = amount,
    received_amount = CASE WHEN status = 'completed' THEN amount ELSE NULL END
WHERE service_value = 0;

-- Drop old INSERT policy and create new one that allows both admins and couriers to insert
DROP POLICY IF EXISTS "ONLY admins can insert deliveries" ON public.deliveries;

CREATE POLICY "Admins and couriers can insert deliveries"
ON public.deliveries
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  (has_role(auth.uid(), 'courier'::app_role) AND courier_id = auth.uid())
);

-- Update courier update policy to be more permissive (field restrictions handled in code)
DROP POLICY IF EXISTS "Couriers can update their own pending deliveries" ON public.deliveries;

CREATE POLICY "Couriers can update their own deliveries"
ON public.deliveries
FOR UPDATE
TO authenticated
USING (auth.uid() = courier_id AND status != 'cancelled')
WITH CHECK (auth.uid() = courier_id AND status != 'cancelled');