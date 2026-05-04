-- ──────────────────────────────────────────────────────────────────────────
-- Migration 017: Specialty + Domain columns on public.tenants
-- ──────────────────────────────────────────────────────────────────────────
-- Adds specialty, domain management, onboarding lifecycle, trial window,
-- and billing contact directly to the tenants table so that the Super Admin
-- lifecycle wizard and domain-verification flow have a stable home.
-- ──────────────────────────────────────────────────────────────────────────

BEGIN;

-- 1. Clinic specialty -------------------------------------------------------
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS specialty text
    DEFAULT 'dentistry'
    CHECK (specialty IN (
      'dentistry',
      'orthodontics',
      'pediatric_dentistry',
      'oral_surgery',
      'periodontology',
      'endodontics',
      'general_medicine',
      'cardiology',
      'dermatology',
      'psychology',
      'pediatrics',
      'gynecology',
      'ophthalmology',
      'orthopedics',
      'ent',
      'other'
    ));

-- 2. Admin domain (e.g. admin.drlebbar.ma) ----------------------------------
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS admin_domain text;

-- 3. Public domain (e.g. www.drlebbar.ma) -----------------------------------
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS public_domain text;

-- 4. Onboarding lifecycle status --------------------------------------------
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS onboarding_status text
    DEFAULT 'pending'
    CHECK (onboarding_status IN (
      'pending',
      'provisioning',
      'active',
      'suspended'
    ));

-- 5. Trial window -----------------------------------------------------------
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;

-- 6. Billing contact email --------------------------------------------------
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS billing_email text;

-- Indexes for common filter queries
CREATE INDEX IF NOT EXISTS tenants_specialty_idx        ON public.tenants (specialty);
CREATE INDEX IF NOT EXISTS tenants_onboarding_status_idx ON public.tenants (onboarding_status);
CREATE INDEX IF NOT EXISTS tenants_trial_ends_at_idx    ON public.tenants (trial_ends_at)
  WHERE trial_ends_at IS NOT NULL;

COMMENT ON COLUMN public.tenants.specialty         IS '16-value enum: clinic medical specialty, drives module defaults';
COMMENT ON COLUMN public.tenants.admin_domain      IS 'Custom admin subdomain, e.g. admin.drlebbar.ma';
COMMENT ON COLUMN public.tenants.public_domain     IS 'Custom public domain, e.g. www.drlebbar.ma';
COMMENT ON COLUMN public.tenants.onboarding_status IS 'Lifecycle gate: pending → provisioning → active → suspended';
COMMENT ON COLUMN public.tenants.trial_ends_at     IS 'NULL means not in trial; set to future date for trial tenants';
COMMENT ON COLUMN public.tenants.billing_email     IS 'Billing contact email, may differ from clinic contact email';

COMMIT;
