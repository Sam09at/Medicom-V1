-- ============================================================
-- MEDICOM — Seed real clinic (corrected for live DB schema)
-- ============================================================
-- Run this in Supabase Dashboard → SQL Editor
-- Your Auth user UUID: 987f0946-aebd-44bc-95cd-46a66fe1569f
--
-- This script:
--   1. Creates the tenant row (uses real column names: plan, status, name…)
--   2. Creates / updates your public.users profile row
--   3. Injects tenant_id into your JWT metadata so RLS allows
--      SELECT on appointments, patients, etc.
--
-- Safe to re-run — all statements use ON CONFLICT DO UPDATE.
-- ============================================================

DO $$
DECLARE
  v_auth_id   uuid := '987f0946-aebd-44bc-95cd-46a66fe1569f';
  v_tenant_id uuid := '10000000-1000-1000-1000-100000000001';
  v_email     text;
BEGIN

  -- Pull the email that was used to create the auth user
  SELECT email INTO v_email FROM auth.users WHERE id = v_auth_id;

  IF v_email IS NULL THEN
    RAISE EXCEPTION 'Auth user % not found. Make sure you created the user in Authentication → Users first.', v_auth_id;
  END IF;

  -- ── 1. Tenant (clinic) ────────────────────────────────────────
  INSERT INTO public.tenants (
    id,
    name,
    email,
    plan,
    status,
    contact_name,
    location,
    region
  ) VALUES (
    v_tenant_id,
    'Cabinet Dentaire Medicom',
    v_email,
    'pro',
    'active',
    'Admin Medicom',
    'Casablanca',
    'Casablanca-Settat'
  )
  ON CONFLICT (id) DO UPDATE SET
    name   = EXCLUDED.name,
    plan   = EXCLUDED.plan,
    status = EXCLUDED.status;

  -- ── 2. User profile ───────────────────────────────────────────
  INSERT INTO public.users (
    id,
    tenant_id,
    role,
    name,
    full_name,
    email,
    status
  ) VALUES (
    v_auth_id,
    v_tenant_id,
    'clinic_admin',
    'Admin Medicom',
    'Admin Medicom',
    v_email,
    'active'
  )
  ON CONFLICT (id) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    role      = EXCLUDED.role,
    name      = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    status    = EXCLUDED.status;

  -- ── 3. Inject tenant_id into JWT so RLS works ────────────────
  -- Appointments, patients, tasks policies check:
  --   tenant_id = (auth.jwt()->'user_metadata'->>'tenant_id')::uuid
  -- Without this the queries return 0 rows (silent RLS block).
  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data ||
    jsonb_build_object(
      'tenant_id', v_tenant_id::text,
      'role',      'clinic_admin'
    )
  WHERE id = v_auth_id;

  RAISE NOTICE '✓ Tenant created/updated: %', v_tenant_id;
  RAISE NOTICE '✓ User profile created/updated: %', v_auth_id;
  RAISE NOTICE '✓ JWT metadata updated — you MUST log out and log back in for the new token to take effect.';

END $$;
