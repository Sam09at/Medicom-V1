-- ══════════════════════════════════════════════════════════════════
-- 016_public_booking_holds.sql
-- Public booking flow: booking holds + patient source extension
-- Depends on: 001_core_schema.sql, 011_landing_and_booking.sql
-- ══════════════════════════════════════════════════════════════════

BEGIN;

-- ── Booking holds (temporary slot reservation during booking flow) ──

CREATE TABLE IF NOT EXISTS public.public_booking_holds (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id        uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  slot_start       timestamptz NOT NULL,
  slot_end         timestamptz NOT NULL,
  patient_name     text,
  phone            text,
  expires_at       timestamptz NOT NULL DEFAULT (now() + INTERVAL '15 minutes'),
  created_at       timestamptz DEFAULT now()
);

ALTER TABLE public.public_booking_holds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "holds_service_role_only" ON public.public_booking_holds
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Auto-expire: run cleanup_expired_holds() via pg_cron every 10 minutes
CREATE OR REPLACE FUNCTION public.cleanup_expired_holds()
RETURNS void LANGUAGE SQL AS $$
  DELETE FROM public.public_booking_holds WHERE expires_at < now();
$$;

-- ── Slot availability function ─────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_available_slots(
  p_tenant_id  uuid,
  p_date       date,
  p_doctor_id  uuid DEFAULT NULL
)
RETURNS TABLE (
  slot_start  timestamptz,
  slot_end    timestamptz,
  doctor_id   uuid,
  doctor_name text
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_slot_duration interval := '30 minutes';
  v_day_start     timestamptz := (p_date::timestamptz AT TIME ZONE 'Africa/Casablanca') + '08:00:00'::interval;
  v_day_end       timestamptz := (p_date::timestamptz AT TIME ZONE 'Africa/Casablanca') + '18:00:00'::interval;
  v_slot          timestamptz;
  v_doctor_id     uuid;
  v_doctor_name   text;
BEGIN
  -- Resolve doctor
  SELECT u.id, u.first_name || ' ' || u.last_name
    INTO v_doctor_id, v_doctor_name
    FROM public.users u
   WHERE u.tenant_id = p_tenant_id
     AND u.role = 'doctor'
     AND (p_doctor_id IS NULL OR u.id = p_doctor_id)
   LIMIT 1;

  v_slot := v_day_start;
  WHILE v_slot < v_day_end LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.tenant_id = p_tenant_id
        AND (v_doctor_id IS NULL OR a.doctor_id = v_doctor_id)
        AND a.start_time < (v_slot + v_slot_duration)
        AND a.end_time   > v_slot
        AND a.status NOT IN ('cancelled', 'rescheduled', 'absent', 'no_show')
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.public_booking_holds h
      WHERE h.tenant_id = p_tenant_id
        AND h.slot_start = v_slot
        AND h.expires_at > now()
    )
    AND v_slot > now()
    THEN
      RETURN QUERY SELECT v_slot, v_slot + v_slot_duration, v_doctor_id, v_doctor_name;
    END IF;
    v_slot := v_slot + v_slot_duration;
  END LOOP;
END;
$$;

-- ── Extend patients with source tracking ──────────────────────────

ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual'
    CHECK (source IN ('manual', 'public_booking', 'phone', 'import'));

ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS primary_whatsapp_number text;

-- ── Extend appointments with booking source ────────────────────────

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual'
    CHECK (source IN ('manual', 'public_booking', 'phone'));

-- Unique constraint for upsert by phone (if not already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'patients_tenant_phone_unique'
  ) THEN
    ALTER TABLE public.patients
      ADD CONSTRAINT patients_tenant_phone_unique UNIQUE (tenant_id, phone);
  END IF;
END $$;

COMMIT;
