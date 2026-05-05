-- ═══════════════════════════════════════════════════════════════
-- Medicom SaaS — 021_tenant_landing_pages.sql
-- Flat landing-page store: one row per tenant, JSONB for sections.
-- Referenced by lib/api/landingPages.ts.
-- Depends on: 001_core_schema.sql
-- ═══════════════════════════════════════════════════════════════

BEGIN;

CREATE TABLE IF NOT EXISTS public.tenant_landing_pages (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id         uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

  -- Public URL slug (e.g. "cabinet-amina" → medicom.ma/c/cabinet-amina)
  slug              text NOT NULL,

  -- Publish state
  is_published      boolean NOT NULL DEFAULT false,
  published_at      timestamptz,

  -- Hero & branding
  headline          text,
  description       text,
  hero_image_url    text,
  accent_color      text NOT NULL DEFAULT '#136cfb',

  -- Contact & location
  contact_email     text,
  contact_phone     text,
  address_display   text,
  city              text,
  google_maps_url   text,

  -- Flexible content
  services_visible  text[]  DEFAULT '{}',
  schedule_json     jsonb   DEFAULT '{}',
  sections_json     jsonb   DEFAULT '[]',

  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now(),

  CONSTRAINT one_page_per_tenant UNIQUE (tenant_id),
  CONSTRAINT unique_slug         UNIQUE (slug)
);

ALTER TABLE public.tenant_landing_pages ENABLE ROW LEVEL SECURITY;

-- Clinic admin: read + write their own page
CREATE POLICY "landing_pages_tenant_rw"
  ON public.tenant_landing_pages
  FOR ALL TO authenticated
  USING (tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid);

-- Super admin: read all pages
CREATE POLICY "landing_pages_super_admin_read"
  ON public.tenant_landing_pages
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'super_admin');

-- Anonymous: read published pages only (for public site rendering)
CREATE POLICY "landing_pages_public_read"
  ON public.tenant_landing_pages
  FOR SELECT TO anon
  USING (is_published = true);

-- Service role: full access for Edge Functions
CREATE POLICY "landing_pages_service_role"
  ON public.tenant_landing_pages
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER tenant_landing_pages_updated_at
  BEFORE UPDATE ON public.tenant_landing_pages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_landing_pages_tenant
  ON public.tenant_landing_pages (tenant_id);

CREATE INDEX IF NOT EXISTS idx_landing_pages_slug
  ON public.tenant_landing_pages (slug) WHERE is_published = true;

COMMIT;
