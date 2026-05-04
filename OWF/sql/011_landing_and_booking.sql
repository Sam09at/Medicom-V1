-- ═══════════════════════════════════════════════════════════════
-- Medicom SaaS — 011_landing_and_booking.sql
-- Public-facing landing page config + anonymous booking requests.
-- Anon users can READ published pages and INSERT booking requests.
-- Clinic staff can manage their own data.
-- Depends on: 001_core_schema.sql (tenants, appointments)
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- ─── TABLE: tenant_landing_pages ─────────────────────────────────────────────
-- One row per clinic (UNIQUE tenant_id). MVP: no section system yet —
-- content lives in flat columns. Phase 1 will add a page_sections table.

CREATE TABLE IF NOT EXISTS public.tenant_landing_pages (
  id               uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id        uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  slug             text        NOT NULL,         -- URL slug: medicom.ma/book/{slug}
  is_published     boolean     NOT NULL DEFAULT false,
  headline         text,                         -- Hero H1
  description      text,                         -- Meta description + hero subtitle
  hero_image_url   text,
  accent_color     text        NOT NULL DEFAULT '#2563eb',
  services_visible text[]      NOT NULL DEFAULT '{}',  -- service IDs shown publicly
  schedule_json    jsonb       NOT NULL DEFAULT '{}',  -- { mon:[{start,end}], tue:[], … }
  contact_email    text,
  contact_phone    text,
  address_display  text,
  city             text,
  google_maps_url  text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT tenant_landing_pages_tenant_unique UNIQUE (tenant_id),
  CONSTRAINT tenant_landing_pages_slug_unique   UNIQUE (slug)
);

ALTER TABLE public.tenant_landing_pages ENABLE ROW LEVEL SECURITY;

-- Anon: read published pages only (for medicom-public Next.js site)
CREATE POLICY "anon_read_published_pages"
  ON public.tenant_landing_pages
  FOR SELECT TO anon
  USING (is_published = true);

-- Authenticated clinic staff: manage their own page only
CREATE POLICY "tenant_manage_own_page"
  ON public.tenant_landing_pages
  FOR ALL TO authenticated
  USING     (tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid);

-- Service role (Edge Functions, admin): full access
CREATE POLICY "service_role_landing_pages"
  ON public.tenant_landing_pages
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER landing_pages_updated_at
  BEFORE UPDATE ON public.tenant_landing_pages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_landing_pages_slug
  ON public.tenant_landing_pages(slug)
  WHERE is_published = true;


-- ─── TABLE: booking_requests ──────────────────────────────────────────────────
-- Anonymous patients submit these via the public booking widget.
-- Clinic staff review and convert them to real appointments.
-- Intentionally separate from appointments — no auth required to INSERT.

CREATE TABLE IF NOT EXISTS public.booking_requests (
  id                       uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id                uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  first_name               text        NOT NULL,
  last_name                text        NOT NULL,
  phone                    text        NOT NULL,
  email                    text,
  requested_date           date,
  requested_time           text,                  -- "09:30" — not a timestamptz, user picks time
  service_type             text,
  notes                    text,
  status                   text        NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending', 'confirmed', 'cancelled', 'converted')),
  converted_appointment_id uuid        REFERENCES public.appointments(id) ON DELETE SET NULL,
  source                   text        NOT NULL DEFAULT 'web'
                             CHECK (source IN ('web', 'whatsapp', 'phone')),
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;

-- Anon: INSERT only (submit a booking request, cannot read back)
CREATE POLICY "anon_insert_booking_requests"
  ON public.booking_requests
  FOR INSERT TO anon
  WITH CHECK (true);

-- Authenticated clinic staff: full management of their tenant's requests
CREATE POLICY "tenant_manage_booking_requests"
  ON public.booking_requests
  FOR ALL TO authenticated
  USING     (tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid);

-- Service role: full access
CREATE POLICY "service_role_booking_requests"
  ON public.booking_requests
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER booking_requests_updated_at
  BEFORE UPDATE ON public.booking_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Clinic staff scans pending requests; this index covers the common query
CREATE INDEX IF NOT EXISTS idx_booking_requests_tenant_status
  ON public.booking_requests(tenant_id, status, created_at DESC);

COMMIT;
