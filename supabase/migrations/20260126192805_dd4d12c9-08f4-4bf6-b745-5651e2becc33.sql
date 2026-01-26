-- Add recipient_name column to deliveries table
ALTER TABLE public.deliveries 
ADD COLUMN recipient_name text;