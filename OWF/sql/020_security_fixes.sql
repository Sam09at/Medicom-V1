-- ═══════════════════════════════════════════════════════════════
-- Medicom SaaS — 020_security_fixes.sql
-- Remediates all issues identified in the 2026-05-04 security audit.
-- Safe to run multiple times (idempotent).
-- Depends on: 001_core_schema.sql
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- ────────────────────────────────────────────────────────────────
-- FIX C-2: Drop role constraint that blocks super_admin users
-- The CHECK was added by 20260218_security_cleanup.sql and rejects
-- any INSERT/UPDATE on users with role='super_admin'.
-- ────────────────────────────────────────────────────────────────
ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS valid_tenant_roles;

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_role_check;


-- ────────────────────────────────────────────────────────────────
-- FIX H-1 + H-2: Purge all System B (subquery-based) RLS policies
-- These were created by 20260218_security_cleanup.sql.
-- They use correlated subqueries (O(n) per row) and reference the
-- undefined medicom_staff table.
-- System A (JWT-based) policies from 001_core_schema.sql remain.
-- ────────────────────────────────────────────────────────────────

-- tenants
DROP POLICY IF EXISTS "Medicom staff on tenants"     ON public.tenants;
DROP POLICY IF EXISTS "Access own tenant"             ON public.tenants;
DROP POLICY IF EXISTS "Cabinet users on own tenant"   ON public.tenants;

-- patients
DROP POLICY IF EXISTS "Tenant users on patients"      ON public.patients;
DROP POLICY IF EXISTS "Tenant Isolation Policy"       ON public.patients;

-- appointments
DROP POLICY IF EXISTS "Tenant users on appointments"  ON public.appointments;
DROP POLICY IF EXISTS "Tenant Isolation Policy"       ON public.appointments;

-- users (any subquery-based policies added by the security cleanup)
DROP POLICY IF EXISTS "Medicom staff on users"        ON public.users;


-- ────────────────────────────────────────────────────────────────
-- FIX M-2: Replace deprecated CREATE RULE with proper triggers
-- for audit_logs immutability.
-- Rules are invisible to pg_policies, bypassed by TRUNCATE, and
-- deprecated for this purpose in modern PostgreSQL.
-- ────────────────────────────────────────────────────────────────

-- Drop the old rules
DROP RULE IF EXISTS audit_logs_no_update ON public.audit_logs;
DROP RULE IF EXISTS audit_logs_no_delete ON public.audit_logs;

-- Immutability trigger function
CREATE OR REPLACE FUNCTION public.prevent_audit_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs are immutable — no UPDATE or DELETE allowed';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach to table (drop first to make this script idempotent)
DROP TRIGGER IF EXISTS audit_logs_immutable ON public.audit_logs;
CREATE TRIGGER audit_logs_immutable
  BEFORE UPDATE OR DELETE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_mutation();

-- RLS-level deny for authenticated role (belt and suspenders)
DROP POLICY IF EXISTS "audit_logs_no_update" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_no_delete" ON public.audit_logs;

CREATE POLICY "audit_logs_no_update"
  ON public.audit_logs
  FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY "audit_logs_no_delete"
  ON public.audit_logs
  FOR DELETE
  TO authenticated
  USING (false);


-- ────────────────────────────────────────────────────────────────
-- FIX M-3: Add updated_at column and trigger to public.users
-- All other core tables have this; users was missing it.
-- ────────────────────────────────────────────────────────────────
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

DROP TRIGGER IF EXISTS users_updated_at ON public.users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


COMMIT;
