-- Drop the existing policy that allows couriers to insert
DROP POLICY IF EXISTS "Couriers can insert their own deliveries" ON public.deliveries;

-- Create new policy: ONLY admins can insert deliveries
CREATE POLICY "ONLY admins can insert deliveries" 
ON public.deliveries 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));