-- ============================================================
-- Qaryz — Add paid_amount to shared_debts for partial payments
-- Run after 004_friends.sql
-- ============================================================

-- 1. Add paid_amount column to track partial payments
ALTER TABLE public.shared_debts ADD COLUMN IF NOT EXISTS paid_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0);

-- 2. Function to safely increment paid_amount
CREATE OR REPLACE FUNCTION public.increment_shared_debt_paid(debt_id uuid, inc_amount numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  current_paid numeric;
  max_amount numeric;
BEGIN
  SELECT amount INTO max_amount FROM public.shared_debts WHERE id = debt_id;
  
  UPDATE public.shared_debts 
  SET paid_amount = LEAST(COALESCE(paid_amount, 0) + inc_amount, max_amount),
      updated_at = now()
  WHERE id = debt_id;
  
  SELECT COALESCE(paid_amount, 0) INTO current_paid FROM public.shared_debts WHERE id = debt_id;
  RETURN current_paid;
END;
$$;

-- 3. Update existing shared_debts: set paid_amount = 0 for all rows that have it NULL
UPDATE public.shared_debts SET paid_amount = 0 WHERE paid_amount IS NULL;
