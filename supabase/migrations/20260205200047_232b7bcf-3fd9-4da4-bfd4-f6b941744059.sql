-- Add company and identification_number columns to clients table
ALTER TABLE public.clients 
ADD COLUMN company text,
ADD COLUMN identification_number text;

-- Add index for faster lookups by identification number
CREATE INDEX idx_clients_identification_number ON public.clients(identification_number);