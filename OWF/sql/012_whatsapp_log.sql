-- ═══════════════════════════════════════════════════════════════
-- Medicom SaaS — 012_whatsapp_log.sql
-- WhatsApp message log: appointment reminders, OTP, campaigns.
-- Populated by Supabase Edge Functions (Twilio callbacks).
-- Clinic staff can read their log; only service_role writes.
-- Depends on: 001_core_schema.sql (tenants, patients, appointments)
-- ═══════════════════════════════════════════════════════════════

BEGIN;

CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id                  uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id           uuid        NOT NULL REFERENCES public.tenants(id)       ON DELETE CASCADE,
  patient_id          uuid                 REFERENCES public.patients(id)      ON DELETE SET NULL,
  appointment_id      uuid                 REFERENCES public.appointments(id)  ON DELETE SET NULL,
  phone_to            text        NOT NULL,
  template_name       text,                         -- Approved WhatsApp template name
  message_body        text,                         -- Rendered message (for logging)
  status              text        NOT NULL DEFAULT 'queued'
                        CHECK (status IN ('queued', 'sent', 'delivered', 'read', 'failed')),
  external_message_id text,                         -- Twilio/WhatsApp message SID
  direction           text        NOT NULL DEFAULT 'outbound'
                        CHECK (direction IN ('outbound', 'inbound')),
  error_message       text,                         -- Populated on failed status
  sent_at             timestamptz,
  delivered_at        timestamptz,
  read_at             timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now()
  -- No updated_at: message log rows are append-only after creation;
  -- status updates are done via specific UPDATE on status + timestamp columns
);

ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Clinic staff: read their tenant's message log (not write — Edge Functions own writes)
CREATE POLICY "tenant_read_whatsapp"
  ON public.whatsapp_messages
  FOR SELECT TO authenticated
  USING (tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid);

-- Service role (Edge Functions): full access for writes + status updates
CREATE POLICY "service_role_whatsapp"
  ON public.whatsapp_messages
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Primary query: clinic dashboard loads recent messages ordered by time
CREATE INDEX IF NOT EXISTS idx_whatsapp_tenant_created
  ON public.whatsapp_messages(tenant_id, created_at DESC);

-- Status filtering for retry/monitoring dashboards
CREATE INDEX IF NOT EXISTS idx_whatsapp_status
  ON public.whatsapp_messages(status, created_at DESC)
  WHERE status IN ('queued', 'failed');

-- Patient message history (Phase 2 patient detail view)
CREATE INDEX IF NOT EXISTS idx_whatsapp_patient
  ON public.whatsapp_messages(patient_id, created_at DESC)
  WHERE patient_id IS NOT NULL;

COMMIT;
