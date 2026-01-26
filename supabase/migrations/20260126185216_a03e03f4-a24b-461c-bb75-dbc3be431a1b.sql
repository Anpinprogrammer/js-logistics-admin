-- Allow couriers to update their own PENDING deliveries
-- (to register completion: add amount, payment method, photo, notes, mark as completed)
DROP POLICY IF EXISTS "ONLY admins can update deliveries" ON public.deliveries;

-- Admins can update any delivery
CREATE POLICY "Admins can update any delivery" 
ON public.deliveries 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Couriers can update their own pending deliveries (to register them)
CREATE POLICY "Couriers can update their own pending deliveries" 
ON public.deliveries 
FOR UPDATE 
USING (
  auth.uid() = courier_id 
  AND status = 'pending'::delivery_status
);

-- Allow couriers to insert into audit log when registering deliveries
DROP POLICY IF EXISTS "Admins can insert audit log" ON public.delivery_audit_log;

CREATE POLICY "Users can insert their own audit entries" 
ON public.delivery_audit_log 
FOR INSERT 
WITH CHECK (auth.uid() = changed_by);