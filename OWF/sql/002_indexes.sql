-- ═══════════════════════════════════════════════════════════════
-- Medicom SaaS — 002_indexes.sql
-- Performance indexes for core tables.
-- Depends on: 001_core_schema.sql
-- ═══════════════════════════════════════════════════════════════

-- ── Patients ──
CREATE INDEX IF NOT EXISTS idx_patients_tenant
  ON public.patients(tenant_id);

-- Full-text search index (French) on patient name + phone
CREATE INDEX IF NOT EXISTS idx_patients_search
  ON public.patients
  USING GIN(
    to_tsvector('french', first_name || ' ' || last_name || ' ' || coalesce(phone, ''))
  );

CREATE INDEX IF NOT EXISTS idx_patients_active
  ON public.patients(tenant_id, is_active)
  WHERE is_active = true;

-- ── Appointments ──
CREATE INDEX IF NOT EXISTS idx_appointments_tenant_date
  ON public.appointments(tenant_id, start_time);

CREATE INDEX IF NOT EXISTS idx_appointments_doctor
  ON public.appointments(doctor_id, start_time);

CREATE INDEX IF NOT EXISTS idx_appointments_status
  ON public.appointments(tenant_id, status)
  WHERE status IN ('pending', 'confirmed', 'waiting_room', 'in_progress');

-- ── Audit Logs ──
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant
  ON public.audit_logs(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
  ON public.audit_logs(entity_type, entity_id);

-- ── Users ──
CREATE INDEX IF NOT EXISTS idx_users_tenant
  ON public.users(tenant_id);
