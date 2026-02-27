-- CRITICAL SECURITY MIGRATION: Role Purification & Tenant Isolation (v5 - TYPE-SAFE)
-- Run this in your Supabase SQL Editor

BEGIN;

--------------------------------------------------------------------------------
-- 1. CLEANUP INTERNAL ROLES (column: role_name)
--------------------------------------------------------------------------------
DELETE FROM internal_roles
WHERE role_name NOT IN ('super_admin', 'sales_rep', 'support_agent');

ALTER TABLE internal_roles
DROP CONSTRAINT IF EXISTS valid_internal_roles;

ALTER TABLE internal_roles
ADD CONSTRAINT valid_internal_roles
CHECK (role_name IN ('super_admin', 'sales_rep', 'support_agent'));

--------------------------------------------------------------------------------
-- 2. ENFORCE ROLES ON public.users
--------------------------------------------------------------------------------
ALTER TABLE public.users
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users
DROP CONSTRAINT IF EXISTS valid_tenant_roles;

ALTER TABLE public.users
ADD CONSTRAINT valid_tenant_roles
CHECK (role IN ('cabinet_admin', 'doctor', 'assistant'));

--------------------------------------------------------------------------------
-- 3. ENABLE ROW LEVEL SECURITY (RLS)
--------------------------------------------------------------------------------
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

--------------------------------------------------------------------------------
-- 4. TENANT ISOLATION POLICIES (Using explicit TEXT casts for all comparisons)
--------------------------------------------------------------------------------

-- Tenants: Staff see all, Cabinet users see their own
DROP POLICY IF EXISTS "Medicom staff on tenants" ON tenants;
DROP POLICY IF EXISTS "Access own tenant" ON tenants;
DROP POLICY IF EXISTS "Cabinet users on own tenant" ON tenants;

-- Internal Staff Policy
CREATE POLICY "Medicom staff on tenants" ON tenants
FOR ALL USING (auth.uid()::text IN (SELECT id::text FROM medicom_staff));

-- Cabinet Users Policy
CREATE POLICY "Cabinet users on own tenant" ON tenants
FOR ALL USING (id::text IN (SELECT tenant_id::text FROM public.users WHERE id::text = auth.uid()::text));

-- Patients: Strict tenant isolation
DROP POLICY IF EXISTS "Tenant users on patients" ON patients;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON patients;

CREATE POLICY "Tenant users on patients" ON patients
FOR ALL USING (
  tenant_id::text IN (SELECT tenant_id::text FROM public.users WHERE id::text = auth.uid()::text)
);

-- Appointments: Strict tenant isolation
DROP POLICY IF EXISTS "Tenant users on appointments" ON appointments;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON appointments;

CREATE POLICY "Tenant users on appointments" ON appointments
FOR ALL USING (
  tenant_id::text IN (SELECT tenant_id::text FROM public.users WHERE id::text = auth.uid()::text)
);

--------------------------------------------------------------------------------
-- 5. REVOKE DANGEROUS PERMISSIONS
--------------------------------------------------------------------------------
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE CREATE ON SCHEMA public FROM authenticated;

COMMIT;
