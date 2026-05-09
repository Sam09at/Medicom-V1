BEGIN;

-- ─── Stripe integration columns ───────────────────────────────────────────────
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS stripe_customer_id      text UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id  text UNIQUE,
  ADD COLUMN IF NOT EXISTS current_period_end       timestamptz,
  ADD COLUMN IF NOT EXISTS billing_email            text;

-- ─── Reschedule / cancel tokens on appointments ───────────────────────────────
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS reschedule_token  text UNIQUE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS cancel_token      text UNIQUE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS no_show_score     integer NOT NULL DEFAULT 0;

-- end_time already exists in 001_core_schema.sql — no need to add it

-- Index for token lookups (patient-facing links)
CREATE INDEX IF NOT EXISTS idx_appointments_reschedule_token
  ON public.appointments (reschedule_token) WHERE reschedule_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_cancel_token
  ON public.appointments (cancel_token) WHERE cancel_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_noshows
  ON public.appointments (no_show_score, start_time)
  WHERE status NOT IN ('cancelled', 'completed', 'absent');

-- ─── Function: generate unique tokens on insert ───────────────────────────────
CREATE OR REPLACE FUNCTION public.generate_appointment_tokens()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.reschedule_token IS NULL THEN
    NEW.reschedule_token := encode(gen_random_bytes(24), 'base64url');
  END IF;
  IF NEW.cancel_token IS NULL THEN
    NEW.cancel_token := encode(gen_random_bytes(24), 'base64url');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS appointments_generate_tokens ON public.appointments;
CREATE TRIGGER appointments_generate_tokens
  BEFORE INSERT ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.generate_appointment_tokens();

COMMIT;
