-- Add new delivery status values for non-delivered cases
ALTER TYPE public.delivery_status ADD VALUE IF NOT EXISTS 'not_delivered_collected';
ALTER TYPE public.delivery_status ADD VALUE IF NOT EXISTS 'not_delivered_no_collection';