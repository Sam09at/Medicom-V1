-- ═══════════════════════════════════════════════════════════════
-- Medicom SaaS — 003_appointments_functions.sql
-- Supplementary functions for appointments module
-- Depends on: 001_core_schema.sql
-- ═══════════════════════════════════════════════════════════════

-- 1. Check for appointment conflicts (Soft check for UI)
-- Returns true if a conflict exists, false otherwise.
-- Ignores 'cancelled', 'absent', 'rescheduled' status.
CREATE OR REPLACE FUNCTION check_appointment_conflict(
    p_tenant_id UUID,
    p_doctor_id UUID,
    p_start_time TIMESTAMP WITH TIME ZONE,
    p_end_time TIMESTAMP WITH TIME ZONE,
    p_exclude_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    conflict_count INT;
BEGIN
    SELECT COUNT(*)
    INTO conflict_count
    FROM public.appointments
    WHERE tenant_id = p_tenant_id
      AND doctor_id = p_doctor_id
      AND status NOT IN ('cancelled', 'absent', 'rescheduled')
      AND (id != p_exclude_id OR p_exclude_id IS NULL)
      AND tstzrange(start_time, end_time) && tstzrange(p_start_time, p_end_time);
    
    RETURN conflict_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Get waiting room queue
-- Returns appointments with status 'arrived' (En salle d'attente) or 'in_progress' (En consultation).
-- Ordered by updated_at (arrival time).
CREATE OR REPLACE FUNCTION get_waiting_room_queue(
    p_tenant_id UUID,
    p_date DATE DEFAULT CURRENT_DATE
) RETURNS TABLE (
    id UUID,
    patient_id UUID,
    doctor_id UUID,
    start_time TIMESTAMP WITH TIME ZONE,
    status public.appointment_status,
    patient_name TEXT,
    doctor_name TEXT,
    waiting_time INTERVAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.patient_id,
        a.doctor_id,
        a.start_time,
        a.status,
        (p.first_name || ' ' || p.last_name) as patient_name,
        (u.first_name || ' ' || u.last_name) as doctor_name,
        (now() - a.updated_at) as waiting_time
    FROM public.appointments a
    JOIN public.patients p ON a.patient_id = p.id
    LEFT JOIN public.users u ON a.doctor_id = u.id
    WHERE a.tenant_id = p_tenant_id
      AND DATE(a.start_time) = p_date
      AND a.status IN ('arrived', 'in_progress')
    ORDER BY a.updated_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
