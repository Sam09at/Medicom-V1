-- ═══════════════════════════════════════════════════════════════
-- Medicom SaaS — 010_extend_core.sql
-- Additive extensions to core tables.
-- Depends on: 001_core_schema.sql, 009_saas_schema.sql
-- NO breaking changes — all operations use IF NOT EXISTS / IF EXISTS
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- ─── 1. users: add updated_at (omitted from 001_core_schema.sql) ─────────────

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Only create the trigger if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'users_updated_at'
      AND tgrelid = 'public.users'::regclass
  ) THEN
    CREATE TRIGGER users_updated_at
      BEFORE UPDATE ON public.users
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END;
$$;

-- ─── 2. tenants: add region (needed for TenantDetailed.region) ───────────────

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS region text;

-- ─── 3. Performance indexes for auth lookups ─────────────────────────────────
-- These are on the hot path: every login + every RLS policy evaluation

CREATE INDEX IF NOT EXISTS idx_users_email
  ON public.users(email);

-- Partial index: only active users — most queries filter is_active = true
CREATE INDEX IF NOT EXISTS idx_users_active_tenant
  ON public.users(tenant_id, is_active)
  WHERE is_active = true;

-- Landing page slug lookup (written now, used in Phase 1)
CREATE INDEX IF NOT EXISTS idx_tenants_domain
  ON public.tenants(domain)
  WHERE domain IS NOT NULL;

COMMIT;
