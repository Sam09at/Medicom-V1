BEGIN;
ALTER TABLE public.tenant_landing_pages
  ADD COLUMN IF NOT EXISTS sections_json jsonb DEFAULT '[]'::jsonb;
COMMENT ON COLUMN public.tenant_landing_pages.sections_json IS 'Ordered array of page sections with type, visible, and content fields';
COMMIT;
