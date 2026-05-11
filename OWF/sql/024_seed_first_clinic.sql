-- ============================================================
-- MEDICOM — Seed your first real clinic + admin user
-- ============================================================
-- Run this in Supabase Dashboard → SQL Editor AFTER you have
-- created the auth user (Dashboard → Authentication → Users →
-- Add user). Copy the UUID from there and paste it below.
-- ============================================================

-- 1. Replace this with the UUID from Auth → Users → your user
\set AUTH_USER_ID 'PASTE-YOUR-AUTH-USER-UUID-HERE'

-- 2. Adjust clinic info as needed
DO $$
DECLARE
  v_auth_id   uuid  := 'PASTE-YOUR-AUTH-USER-UUID-HERE';
  v_tenant_id uuid  := gen_random_uuid();
BEGIN

  -- ── Create the tenant (clinic) ─────────────────────────────
  INSERT INTO public.tenants (
    id, name, email, plan_tier, status,
    city, region, settings_json
  ) VALUES (
    v_tenant_id,
    'Cabinet Dentaire Medicom',
    'admin@medicom.ma',
    'pro',
    'active',
    'Casablanca',
    'Casablanca-Settat',
    '{}'
  )
  ON CONFLICT (id) DO NOTHING;

  -- ── Create the user profile linked to the auth user ────────
  INSERT INTO public.users (
    id, tenant_id, role,
    first_name, last_name, email,
    is_active
  ) VALUES (
    v_auth_id,
    v_tenant_id,
    'clinic_admin',
    'Admin',
    'Medicom',
    'admin@medicom.ma',
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    role      = EXCLUDED.role,
    is_active = true;

  RAISE NOTICE 'Tenant ID: %', v_tenant_id;
  RAISE NOTICE 'User linked: %', v_auth_id;
END $$;
