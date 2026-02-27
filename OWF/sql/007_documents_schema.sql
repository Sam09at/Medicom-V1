-- ═══════════════════════════════════════════════════════════════
-- Medicom SaaS — 007_documents_schema.sql
-- Documents management (GED) linked to Supabase Storage
-- Depends on: 001_core_schema.sql
-- ═══════════════════════════════════════════════════════════════

-- NOTE: Requires a Supabase Storage bucket named 'medicom-documents'
-- with policies allowing authenticated users to read/write their tenant's folder.

CREATE TABLE IF NOT EXISTS public.documents (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       text NOT NULL REFERENCES public.tenants(id),
  patient_id      text NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  uploaded_by     text REFERENCES public.users(id),
  name            text NOT NULL,
  file_path       text NOT NULL, -- Storage path: {tenant_id}/{patient_id}/{uuid}/{filename}
  file_type       text,          -- MIME type
  file_size       integer,       -- Bytes
  category        text CHECK (category IN ('prescription', 'xray', 'scan', 'report', 'id', 'insurance', 'other')) DEFAULT 'other',
  is_generated    boolean DEFAULT false,
  consultation_id uuid, -- Optional link to consultation
  treatment_plan_id uuid, -- Optional link to treatment plan
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Authenticated users: CRUD within own tenant
CREATE POLICY "documents_tenant_isolation"
  ON public.documents
  FOR ALL
  TO authenticated
  USING (
    tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')
  )
  WITH CHECK (
    tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')
  );

-- Service role full access
CREATE POLICY "service_role_manage_documents"
  ON public.documents
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Auto-update updated_at
CREATE TRIGGER documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
