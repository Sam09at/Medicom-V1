-- ══════════════════════════════════════════════════════════════════
-- 018_support_tickets.sql
-- Full support ticket system: tickets + threaded messages
-- Depends on: 001_core_schema.sql
-- ══════════════════════════════════════════════════════════════════

BEGIN;

-- ── Support Tickets ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id        uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  subject          text NOT NULL,
  category         text NOT NULL DEFAULT 'Technical'
    CHECK (category IN ('Technical', 'Billing', 'Feature', 'Bug')),
  priority         text NOT NULL DEFAULT 'Normal'
    CHECK (priority IN ('Low', 'Normal', 'High', 'Urgent')),
  status           text NOT NULL DEFAULT 'Open'
    CHECK (status IN ('Open', 'In Progress', 'Waiting', 'Resolved', 'Closed')),
  created_by_id    text NOT NULL,
  created_by_name  text NOT NULL,
  created_by_role  text NOT NULL DEFAULT 'user',
  created_by_avatar text,
  clinic_name      text,
  plan             text,
  assigned_to_id   uuid REFERENCES public.users(id) ON DELETE SET NULL,
  assigned_to_name text,
  assigned_to_avatar text,
  tags             text[] DEFAULT '{}',
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Cabinet users see only their tenant's tickets
CREATE POLICY "tickets_tenant_read" ON public.support_tickets
  FOR SELECT TO authenticated
  USING (
    tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
  );

CREATE POLICY "tickets_tenant_insert" ON public.support_tickets
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
  );

-- Only SA can update (status changes, assignment)
CREATE POLICY "tickets_sa_update" ON public.support_tickets
  FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin');

CREATE POLICY "service_role_tickets" ON public.support_tickets
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_support_tickets_tenant
  ON public.support_tickets(tenant_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_tickets_status
  ON public.support_tickets(status, priority, created_at DESC);

-- ── Ticket Messages ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id     uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id     text NOT NULL,
  sender_name   text NOT NULL,
  sender_role   text NOT NULL DEFAULT 'user',
  sender_avatar text,
  content       text NOT NULL,
  is_internal   boolean DEFAULT false,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

-- Messages follow ticket visibility; internal notes only visible to SA
CREATE POLICY "messages_read" ON public.ticket_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_id
      AND (
        t.tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid
        OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
      )
    )
    AND (
      is_internal = false
      OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
    )
  );

CREATE POLICY "messages_insert" ON public.ticket_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_id
      AND (
        t.tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid
        OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
      )
    )
  );

CREATE POLICY "service_role_messages" ON public.ticket_messages
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket
  ON public.ticket_messages(ticket_id, created_at ASC);

COMMIT;
