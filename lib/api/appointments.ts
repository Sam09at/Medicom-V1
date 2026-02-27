import { supabase } from '../supabase';
import { MedicomError, ERROR_CODES, fromSupabaseError } from '../errors';
import type { Appointment, AppointmentStatus, AppointmentType } from '../../types';

// ── DB row ↔ Frontend type mappers ──

interface AppointmentRow {
  id: string;
  tenant_id: string;
  patient_id: string;
  doctor_id: string;
  created_by: string | null;
  service_id: string | null;
  title: string | null;
  type: string;
  status: string;
  start_time: string;
  end_time: string;
  notes: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
  // joined fields
  patients?: { first_name: string; last_name: string };
}

/** Maps DB status (snake_case English) → frontend AppointmentStatus (French) */
const STATUS_DB_TO_UI: Record<string, AppointmentStatus> = {
  pending: 'En attente' as AppointmentStatus,
  confirmed: 'Confirmé' as AppointmentStatus,
  waiting_room: "En salle d'attente" as AppointmentStatus,
  in_progress: 'En consultation' as AppointmentStatus,
  completed: 'Terminé' as AppointmentStatus,
  cancelled: 'Annulé' as AppointmentStatus,
  rescheduled: 'Reporté' as AppointmentStatus,
  absent: 'Absent' as AppointmentStatus,
};

/** Maps frontend AppointmentStatus (French) → DB status (snake_case English) */
const STATUS_UI_TO_DB: Record<string, string> = {};
for (const [dbVal, uiVal] of Object.entries(STATUS_DB_TO_UI)) {
  STATUS_UI_TO_DB[uiVal] = dbVal;
}

const TYPE_DB_TO_UI: Record<string, AppointmentType> = {
  consultation: 'Consultation' as AppointmentType,
  treatment: 'Séance Traitement' as AppointmentType,
  checkup: 'Contrôle' as AppointmentType,
  urgency: 'Urgence' as AppointmentType,
  break: 'Pause / Absence' as AppointmentType,
};

const TYPE_UI_TO_DB: Record<string, string> = {};
for (const [dbVal, uiVal] of Object.entries(TYPE_DB_TO_UI)) {
  TYPE_UI_TO_DB[uiVal] = dbVal;
}

/** Maps a Supabase row to the frontend Appointment type */
function toAppointment(row: AppointmentRow): Appointment {
  const start = new Date(row.start_time);
  const end = new Date(row.end_time);
  const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);

  return {
    id: row.id,
    patientId: row.patient_id,
    doctorId: row.doctor_id,
    start,
    duration: durationMinutes,
    type: TYPE_DB_TO_UI[row.type] ?? ('Consultation' as AppointmentType),
    status: STATUS_DB_TO_UI[row.status] ?? ('En attente' as AppointmentStatus),
    notes: row.notes ?? undefined,
    patientName: row.patients
      ? `${row.patients.first_name} ${row.patients.last_name}`
      : (row.title ?? 'Patient'),
  };
}

// ── Audit helper ──

async function writeAuditLog(
  tenantId: string,
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  changes?: { before?: Record<string, unknown>; after?: Record<string, unknown> }
): Promise<void> {
  if (!supabase) return;
  await supabase.from('audit_logs').insert({
    tenant_id: tenantId,
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    changes: changes ?? null,
  });
}

// ═══════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════

/**
 * Fetches appointments for a tenant, with optional date/doctor/status filters.
 * Joins patient name for display.
 */
export async function getAppointments(
  tenantId: string,
  filters?: {
    date?: string;
    doctorId?: string;
    status?: AppointmentStatus;
  }
): Promise<Appointment[]> {
  if (!supabase) {
    const { MOCK_APPOINTMENTS } = await import('../../constants');
    return MOCK_APPOINTMENTS;
  }

  let query = supabase
    .from('appointments')
    .select('*, patients(first_name, last_name)')
    .eq('tenant_id', tenantId)
    .order('start_time', { ascending: true });

  if (filters?.date) {
    // Filter by day: start_time >= dayStart AND start_time < nextDay
    const dayStart = `${filters.date}T00:00:00`;
    const dayEnd = `${filters.date}T23:59:59`;
    query = query.gte('start_time', dayStart).lte('start_time', dayEnd);
  }
  if (filters?.doctorId) {
    query = query.eq('doctor_id', filters.doctorId);
  }
  if (filters?.status) {
    const dbStatus = STATUS_UI_TO_DB[filters.status];
    if (dbStatus) query = query.eq('status', dbStatus);
  }

  const { data, error } = await query;
  if (error) throw fromSupabaseError(error);
  return (data as AppointmentRow[]).map(toAppointment);
}

/**
 * Creates a new appointment.
 * The DB EXCLUDE constraint will reject overlapping appointments.
 * @throws MedicomError(APPOINTMENT_CONFLICT) on overlap
 */
export async function createAppointment(
  data: {
    patientId: string;
    doctorId: string;
    type: AppointmentType;
    startTime: Date;
    endTime: Date;
    title?: string;
    notes?: string;
    color?: string;
  },
  tenantId: string,
  userId: string
): Promise<Appointment> {
  if (!supabase) {
    // Mock mode
    return {
      id: `APT-${Date.now()}`,
      patientId: data.patientId,
      doctorId: data.doctorId,
      start: data.startTime,
      duration: Math.round((data.endTime.getTime() - data.startTime.getTime()) / 60000),
      type: data.type,
      status: 'En attente' as AppointmentStatus,
      notes: data.notes,
      patientName: data.title ?? 'Patient',
    };
  }

  const { data: created, error } = await supabase
    .from('appointments')
    .insert({
      tenant_id: tenantId,
      patient_id: data.patientId,
      doctor_id: data.doctorId,
      created_by: userId,
      type: TYPE_UI_TO_DB[data.type] ?? 'consultation',
      start_time: data.startTime.toISOString(),
      end_time: data.endTime.toISOString(),
      title: data.title || null,
      notes: data.notes || null,
      color: data.color || null,
    })
    .select('*, patients(first_name, last_name)')
    .single();

  if (error) throw fromSupabaseError(error);

  await writeAuditLog(tenantId, userId, 'appointment.create', 'Appointment', created.id, {
    after: {
      patientId: data.patientId,
      startTime: data.startTime.toISOString(),
      type: data.type,
    },
  });

  return toAppointment(created as AppointmentRow);
}

/**
 * Updates an appointment's details (start, duration, type, etc.)
 */
export async function updateAppointment(
  id: string,
  updates: Partial<Appointment>,
  tenantId: string,
  userId: string
): Promise<Appointment> {
  if (!supabase) {
    const { MOCK_APPOINTMENTS } = await import('../../constants');
    const aptIndex = MOCK_APPOINTMENTS.findIndex((a) => a.id === id);
    if (aptIndex === -1)
      throw new MedicomError(ERROR_CODES.APPOINTMENT_NOT_FOUND, 'Not found', 404);

    const current = MOCK_APPOINTMENTS[aptIndex];
    const updated = { ...current, ...updates };

    // Recalculate end time if start or duration changed
    if (updates.start || updates.duration) {
      const start = updates.start ? new Date(updates.start) : current.start;
      const duration = updates.duration || current.duration;
      updated.start = start;
      updated.duration = duration;
    }

    // In a real app we'd mutate the mock array, but for now we just return the object
    // to make the UI update optimistically.
    // Note: useAppointments hook usually updates local state too.
    return updated;
  }

  const dbUpdates: any = {};
  if (updates.start || updates.duration) {
    // We need to fetch current if we don't have both
    // But for simplicity assume caller provides valid combinations or we do a read-before-write?
    // The hook did a read-before-write. Let's do a read-before-write here to be safe.
    const { data: current } = await supabase
      .from('appointments')
      .select('start_time, duration')
      .eq('id', id)
      .single();
    if (!current) throw new Error('Appointment not found');

    const start = updates.start ? new Date(updates.start) : new Date(current.start_time);
    const duration = updates.duration ?? current.duration;
    const end = new Date(start.getTime() + duration * 60000);

    dbUpdates.start_time = start.toISOString();
    dbUpdates.end_time = end.toISOString();
    dbUpdates.duration = duration;
  }

  if (updates.type) dbUpdates.type = TYPE_UI_TO_DB[updates.type] ?? updates.type;
  if (updates.status) dbUpdates.status = STATUS_UI_TO_DB[updates.status] ?? updates.status;
  if (updates.notes) dbUpdates.notes = updates.notes;
  if (updates.patientId) dbUpdates.patient_id = updates.patientId;
  if (updates.doctorId) dbUpdates.doctor_id = updates.doctorId;

  const { data: updated, error } = await supabase
    .from('appointments')
    .update(dbUpdates)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select('*, patients(first_name, last_name)')
    .single();

  if (error) {
    if (error.code === '23P01') throw new Error('Conflit de rendez-vous');
    throw fromSupabaseError(error);
  }

  await writeAuditLog(tenantId, userId, 'appointment.update', 'Appointment', id, {
    after: dbUpdates,
  });

  return toAppointment(updated as AppointmentRow);
}

/**
 * Updates the status of an appointment and writes an audit log.
 * @throws MedicomError if not found
 */
export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
  tenantId: string,
  userId: string
): Promise<Appointment> {
  if (!supabase) {
    const { MOCK_APPOINTMENTS } = await import('../../constants');
    const apt = MOCK_APPOINTMENTS.find((a) => a.id === id);
    if (!apt)
      throw new MedicomError(ERROR_CODES.APPOINTMENT_NOT_FOUND, `Appointment ${id} not found`, 404);
    return { ...apt, status };
  }

  const dbStatus = STATUS_UI_TO_DB[status];
  if (!dbStatus) {
    throw new MedicomError(ERROR_CODES.UNKNOWN, `Unknown status: ${status}`, 400);
  }

  const { data: updated, error } = await supabase
    .from('appointments')
    .update({ status: dbStatus })
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select('*, patients(first_name, last_name)')
    .single();

  if (error) throw fromSupabaseError(error);
  if (!updated)
    throw new MedicomError(ERROR_CODES.APPOINTMENT_NOT_FOUND, `Appointment ${id} not found`, 404);

  await writeAuditLog(tenantId, userId, 'appointment.status_change', 'Appointment', id, {
    after: { status: dbStatus },
  });

  return toAppointment(updated as AppointmentRow);
}

/**
 * Fetches the waiting room queue: today's confirmed, waiting_room, or in_progress appointments.
 * @param date - ISO date string e.g. "2026-02-18"
 */
export async function getWaitingRoomQueue(tenantId: string, date: string): Promise<Appointment[]> {
  if (!supabase) {
    const { MOCK_APPOINTMENTS } = await import('../../constants');
    return MOCK_APPOINTMENTS;
  }

  const dayStart = `${date}T00:00:00`;
  const dayEnd = `${date}T23:59:59`;

  const { data, error } = await supabase
    .from('appointments')
    .select('*, patients(first_name, last_name)')
    .eq('tenant_id', tenantId)
    .in('status', ['confirmed', 'waiting_room', 'in_progress'])
    .gte('start_time', dayStart)
    .lte('start_time', dayEnd)
    .order('start_time', { ascending: true });

  if (error) throw fromSupabaseError(error);
  return (data as AppointmentRow[]).map(toAppointment);
}
