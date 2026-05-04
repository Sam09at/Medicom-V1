-- ═══════════════════════════════════════════════
-- 014_inventory_schema.sql
-- Inventory items table for clinic stock management
-- Depends on: 001_core_schema.sql (tenants, set_updated_at trigger)
-- Run in: Supabase SQL Editor
-- ═══════════════════════════════════════════════

BEGIN;

CREATE TABLE IF NOT EXISTS public.inventory_items (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name          text NOT NULL,
  category      text,
  quantity      integer NOT NULL DEFAULT 0,
  min_threshold integer NOT NULL DEFAULT 5,
  unit          text DEFAULT 'unité',
  supplier      text,
  unit_price    decimal(10,2),
  is_active     boolean DEFAULT true,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inventory_tenant_rw" ON public.inventory_items
  FOR ALL TO authenticated
  USING (tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "service_role_inventory" ON public.inventory_items
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER inventory_items_updated_at
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_inventory_tenant
  ON public.inventory_items(tenant_id, is_active, name);

COMMIT;
