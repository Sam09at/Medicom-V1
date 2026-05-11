-- ============================================================
-- MEDICOM — 026_fix_rls_and_seed.sql
-- ============================================================
-- PURPOSE:
--   1. Create auth_tenant_id() — reads tenant_id from public.users
--      instead of relying on JWT user_metadata (which is often absent)
--   2. Rebuild ALL tenant-isolation RLS policies on every key table
--      to use the new function
--   3. Seed your first real clinic + user + patch JWT metadata
--
-- RUN THIS IN ORDER:
--   Supabase Dashboard → SQL Editor → paste → Run
--
-- Auth user UUID: 987f0946-aebd-44bc-95cd-46a66fe1569f
-- ============================================================

-- ── STEP 1: Security-definer helper ─────────────────────────────────────────
-- Reads the current user's tenant_id directly from public.users.
-- SECURITY DEFINER bypasses RLS so it can always read the users table.
-- Falls back to JWT user_metadata for backwards-compat.

CREATE OR REPLACE FUNCTION public.auth_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT tenant_id FROM public.users WHERE id = auth.uid()),
    (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid
  )
$$;

-- ── STEP 2: Rebuild RLS policies on all key tables ──────────────────────────

-- ── tenants ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "users_read_own_tenant" ON public.tenants;
CREATE POLICY "users_read_own_tenant"
  ON public.tenants FOR SELECT TO authenticated
  USING (id = public.auth_tenant_id());

-- ── patients ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "patients_tenant_isolation" ON public.patients;
CREATE POLICY "patients_tenant_isolation"
  ON public.patients FOR ALL TO authenticated
  USING (tenant_id = public.auth_tenant_id())
  WITH CHECK (tenant_id = public.auth_tenant_id());

-- ── appointments ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "appointments_tenant_isolation" ON public.appointments;
CREATE POLICY "appointments_tenant_isolation"
  ON public.appointments FOR ALL TO authenticated
  USING (tenant_id = public.auth_tenant_id())
  WITH CHECK (tenant_id = public.auth_tenant_id());

-- ── audit_logs ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "audit_logs_insert" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_read_tenant" ON public.audit_logs;
CREATE POLICY "audit_logs_insert"
  ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.auth_tenant_id());
CREATE POLICY "audit_logs_read_tenant"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (tenant_id = public.auth_tenant_id());

-- ── invoices (if table exists) ────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='invoices') THEN
    DROP POLICY IF EXISTS "invoices_tenant_isolation" ON public.invoices;
    EXECUTE $pol$
      CREATE POLICY "invoices_tenant_isolation"
        ON public.invoices FOR ALL TO authenticated
        USING (tenant_id = public.auth_tenant_id())
        WITH CHECK (tenant_id = public.auth_tenant_id())
    $pol$;
  END IF;
END $$;

-- ── inventory_items (if table exists) ─────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='inventory_items') THEN
    DROP POLICY IF EXISTS "inventory_tenant_isolation" ON public.inventory_items;
    EXECUTE $pol$
      CREATE POLICY "inventory_tenant_isolation"
        ON public.inventory_items FOR ALL TO authenticated
        USING (tenant_id = public.auth_tenant_id())
        WITH CHECK (tenant_id = public.auth_tenant_id())
    $pol$;
  END IF;
END $$;

-- ── treatment_plans (if table exists) ─────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='treatment_plans') THEN
    DROP POLICY IF EXISTS "treatment_plans_tenant_isolation" ON public.treatment_plans;
    EXECUTE $pol$
      CREATE POLICY "treatment_plans_tenant_isolation"
        ON public.treatment_plans FOR ALL TO authenticated
        USING (tenant_id = public.auth_tenant_id())
        WITH CHECK (tenant_id = public.auth_tenant_id())
    $pol$;
  END IF;
END $$;

-- ── tasks (if table exists) ───────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='tasks') THEN
    DROP POLICY IF EXISTS "tasks_tenant_isolation" ON public.tasks;
    EXECUTE $pol$
      CREATE POLICY "tasks_tenant_isolation"
        ON public.tasks FOR ALL TO authenticated
        USING (tenant_id = public.auth_tenant_id())
        WITH CHECK (tenant_id = public.auth_tenant_id())
    $pol$;
  END IF;
END $$;

-- ── STEP 2b: Super Admin read-all policies ──────────────────────────────────
-- super_admin role can read everything — needed for Cabinets management page.

DROP POLICY IF EXISTS "super_admin_read_all_tenants" ON public.tenants;
CREATE POLICY "super_admin_read_all_tenants"
  ON public.tenants FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin')
  );

DROP POLICY IF EXISTS "super_admin_manage_users" ON public.users;
CREATE POLICY "super_admin_manage_users"
  ON public.users FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'super_admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'super_admin')
  );

-- ── STEP 3: Seed tenant + user + patch JWT ─────────────────────────────────
DO $$
DECLARE
  v_auth_id   uuid := '987f0946-aebd-44bc-95cd-46a66fe1569f';
  v_tenant_id uuid := '10000000-1000-1000-1000-100000000001';
  v_email     text;
  v_tenant_cols text[];
  v_user_cols   text[];
BEGIN

  -- Verify auth user exists
  SELECT email INTO v_email FROM auth.users WHERE id = v_auth_id;
  IF v_email IS NULL THEN
    RAISE EXCEPTION 'Auth user % not found. Create it in Authentication → Users first.', v_auth_id;
  END IF;

  -- ── Detect which column names actually exist on tenants ──────────────────
  -- This makes the seed safe regardless of which migration version is live.
  SELECT array_agg(column_name::text)
    INTO v_tenant_cols
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tenants';

  SELECT array_agg(column_name::text)
    INTO v_user_cols
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users';

  -- ── Insert tenant using detected columns ─────────────────────────────────
  IF 'plan' = ANY(v_tenant_cols) THEN
    -- Live DB schema (user's actual DB)
    INSERT INTO public.tenants (id, name, email, plan, status)
    VALUES (v_tenant_id, 'Cabinet Medicom', v_email, 'pro', 'active')
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name, plan = EXCLUDED.plan, status = EXCLUDED.status;
  ELSE
    -- Migration-file schema (plan_tier, settings_json)
    INSERT INTO public.tenants (id, name, plan_tier, status)
    VALUES (v_tenant_id, 'Cabinet Medicom', 'pro', 'active')
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name, plan_tier = EXCLUDED.plan_tier, status = EXCLUDED.status;
  END IF;

  -- ── Insert user using detected columns ───────────────────────────────────
  IF 'name' = ANY(v_user_cols) THEN
    -- Live DB schema
    INSERT INTO public.users (id, tenant_id, role, name, full_name, email, status)
    VALUES (v_auth_id, v_tenant_id, 'clinic_admin', 'Admin Medicom', 'Admin Medicom', v_email, 'active')
    ON CONFLICT (id) DO UPDATE SET
      tenant_id = EXCLUDED.tenant_id,
      role      = EXCLUDED.role,
      name      = EXCLUDED.name,
      status    = EXCLUDED.status;
  ELSE
    -- Migration-file schema (first_name, last_name, is_active)
    INSERT INTO public.users (id, tenant_id, role, first_name, last_name, email, is_active)
    VALUES (v_auth_id, v_tenant_id, 'clinic_admin', 'Admin', 'Medicom', v_email, true)
    ON CONFLICT (id) DO UPDATE SET
      tenant_id  = EXCLUDED.tenant_id,
      role       = EXCLUDED.role,
      first_name = EXCLUDED.first_name,
      is_active  = true;
  END IF;

  -- ── Patch JWT so RLS works on next login ─────────────────────────────────
  UPDATE auth.users
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) ||
    jsonb_build_object('tenant_id', v_tenant_id::text, 'role', 'clinic_admin')
  WHERE id = v_auth_id;

  RAISE NOTICE '✓ Tenant: %', v_tenant_id;
  RAISE NOTICE '✓ User:   %', v_auth_id;
  RAISE NOTICE '✓ Email:  %', v_email;
  RAISE NOTICE '';
  RAISE NOTICE '⚠  Log out and log back in — the new JWT must be issued for RLS to activate.';

END $$;
