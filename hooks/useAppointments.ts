import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useMedicomStore } from '../store';
import { Appointment, AppointmentStatus, AppointmentType } from '../types';

// ── Enum mapping: UI (French) ↔ DB (English) ─────────────────────────────────

const STATUS_TO_DB: Record<string, string> = {
  'En attente': 'pending',
  'Confirmé': 'confirmed',
  "En salle d'attente": 'waiting_room',
  'En consultation': 'in_progress',
  'Terminé': 'completed',
  'Annulé': 'cancelled',
  'Reporté': 'rescheduled',
  'Absent': 'absent',
};

const STATUS_FROM_DB: Record<string, AppointmentStatus> = {
  pending: AppointmentStatus.PENDING,
  confirmed: AppointmentStatus.CONFIRMED,
  waiting_room: AppointmentStatus.ARRIVED,
  in_progress: AppointmentStatus.IN_PROGRESS,
  completed: AppointmentStatus.COMPLETED,
  cancelled: AppointmentStatus.CANCELLED,
  rescheduled: AppointmentStatus.RESCHEDULED,
  absent: AppointmentStatus.NOSHOW,
};

const TYPE_TO_DB: Record<string, string> = {
  'Consultation': 'consultation',
  'Séance Traitement': 'treatment',
  'Contrôle': 'checkup',
  'Urgence': 'urgency',
  'Pause / Absence': 'break',
};

const TYPE_FROM_DB: Record<string, AppointmentType> = {
  consultation: AppointmentType.CONSULTATION,
  treatment: AppointmentType.TREATMENT,
  checkup: AppointmentType.CONTROL,
  urgency: AppointmentType.URGENCY,
  break: AppointmentType.BREAK,
};

// ─────────────────────────────────────────────────────────────────────────────

interface UseAppointmentsOptions {
  startDate?: Date;
  endDate?: Date;
  doctorId?: string;
  patientId?: string;
}

export function useAppointments(options?: UseAppointmentsOptions) {
  const { currentTenant, showToast, currentUser } = useMedicomStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = useCallback(async () => {
    const client = supabase;

    // ── Mock Mode ──
    if (!client) {
      setLoading(true);
      try {
        const { MOCK_APPOINTMENTS } = await import('../constants');
        let data = [...MOCK_APPOINTMENTS];

        if (options?.startDate) data = data.filter((a) => a.start >= options.startDate!);
        if (options?.endDate) data = data.filter((a) => a.start <= options.endDate!);
        if (options?.doctorId) data = data.filter((a) => a.doctorId === options.doctorId);
        if (options?.patientId) data = data.filter((a) => a.patientId === options.patientId);

        setAppointments(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
      return;
    }

    // ── Real Supabase ──
    if (!currentTenant) return;
    setLoading(true);
    try {
      let query = client
        .from('appointments')
        .select(
          'id, patient_id, doctor_id, start_time, duration, duration_minutes, type, status, notes, patient_name, tenant_id'
        )
        .eq('tenant_id', currentTenant.id);

      if (options?.startDate) query = query.gte('start_time', options.startDate.toISOString());
      if (options?.endDate) query = query.lte('start_time', options.endDate.toISOString());
      if (options?.doctorId) query = query.eq('doctor_id', options.doctorId);
      if (options?.patientId) query = query.eq('patient_id', options.patientId);

      const { data, error } = await query;
      if (error) throw error;

      const mapped: Appointment[] = data.map((row: any) => ({
        id: row.id,
        patientId: row.patient_id,
        doctorId: row.doctor_id,
        start: new Date(row.start_time),
        duration: row.duration || row.duration_minutes || 30,
        type: TYPE_FROM_DB[row.type] ?? (row.type as AppointmentType),
        status: STATUS_FROM_DB[row.status] ?? (row.status as AppointmentStatus),
        notes: row.notes,
        patientName: row.patient_name || 'Patient Inconnu',
      }));

      setAppointments(mapped);
    } catch (err: any) {
      console.error('Error fetching appointments:', err);
      showToast({ type: 'error', message: 'Erreur lors du chargement des rendez-vous' });
    } finally {
      setLoading(false);
    }
  }, [
    currentTenant,
    options?.doctorId,
    options?.startDate?.toISOString(),
    options?.endDate?.toISOString(),
    options?.patientId,
  ]);

  useEffect(() => {
    const client = supabase;
    if (client && !currentTenant) return;

    fetchAppointments();

    if (!client) return;

    const channel = client
      .channel(`appointments:${currentTenant!.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `tenant_id=eq.${currentTenant!.id}`,
        },
        () => fetchAppointments()
      )
      .subscribe();

    return () => { client.removeChannel(channel); };
  }, [currentTenant, fetchAppointments]);

  const createAppointment = async (appointment: Omit<Appointment, 'id' | 'patientName'>) => {
    const client = supabase;

    // ── Mock Mode ──
    if (!client) {
      const { MOCK_APPOINTMENTS, MOCK_PATIENTS } = await import('../constants');
      const patient = MOCK_PATIENTS.find((p) => p.id === appointment.patientId);
      const newApt: Appointment = {
        ...appointment,
        id: `mock-${Date.now()}`,
        patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Patient Mock',
        start: new Date(appointment.start),
      };
      MOCK_APPOINTMENTS.push(newApt);
      setAppointments((prev) => [...prev, newApt]);
      showToast({ type: 'success', message: 'Rendez-vous créé (Mock)' });
      return newApt;
    }

    if (!currentTenant) {
      showToast({ type: 'error', message: 'Erreur de connexion' });
      return;
    }
    try {
      const startTime = new Date(appointment.start);
      const doctorId = appointment.doctorId || currentUser?.id || '';

      const { data, error } = await client
        .from('appointments')
        .insert({
          tenant_id: currentTenant.id,
          patient_id: appointment.patientId,
          doctor_id: doctorId,
          start_time: startTime.toISOString(),
          duration: appointment.duration,
          type: TYPE_TO_DB[appointment.type] ?? appointment.type,
          status: STATUS_TO_DB[appointment.status] ?? appointment.status,
          notes: appointment.notes,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23P01') throw new Error('Créneau déjà occupé');
        throw error;
      }

      showToast({ type: 'success', message: 'Rendez-vous créé' });
      return data;
    } catch (err: any) {
      console.error('Error creating appointment:', err);
      showToast({ type: 'error', message: err.message || 'Erreur lors de la création' });
      throw err;
    }
  };

  const updateAppointment = async (id: string, updates: Partial<Appointment>) => {
    const client = supabase;

    // ── Mock Mode ──
    if (!client) {
      const { MOCK_APPOINTMENTS } = await import('../constants');
      const idx = MOCK_APPOINTMENTS.findIndex((a) => a.id === id);
      if (idx >= 0) {
        const updated = { ...MOCK_APPOINTMENTS[idx], ...updates };
        if (updates.start) updated.start = new Date(updates.start);
        MOCK_APPOINTMENTS[idx] = updated;
        setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)));
        showToast({ type: 'success', message: 'Rendez-vous mis à jour (Mock)' });
        return updated;
      }
      return;
    }

    try {
      const dbUpdates: Record<string, unknown> = {};

      if (updates.start || updates.duration) {
        const current = appointments.find((a) => a.id === id);
        if (!current) throw new Error('Appointment not found locally');

        const start = updates.start ? new Date(updates.start) : current.start;
        const duration = updates.duration ?? current.duration;

        dbUpdates.start_time = start.toISOString();
        dbUpdates.duration = duration;
      }

      if (updates.type) dbUpdates.type = TYPE_TO_DB[updates.type] ?? updates.type;
      if (updates.status) dbUpdates.status = STATUS_TO_DB[updates.status] ?? updates.status;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      if (updates.patientId) dbUpdates.patient_id = updates.patientId;
      if (updates.doctorId) dbUpdates.doctor_id = updates.doctorId;

      const { data, error } = await client
        .from('appointments')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === '23P01') throw new Error('Conflit de rendez-vous');
        throw error;
      }

      showToast({ type: 'success', message: 'Rendez-vous mis à jour' });
      return data;
    } catch (err: any) {
      console.error('Error updating appointment:', err);
      showToast({ type: 'error', message: err.message || 'Erreur lors de la mise à jour' });
      throw err;
    }
  };

  const deleteAppointment = async (id: string) => {
    const client = supabase;
    if (!client) return;
    try {
      const { error } = await client.from('appointments').delete().eq('id', id);
      if (error) throw error;
      showToast({ type: 'success', message: 'Rendez-vous supprimé' });
    } catch (err: any) {
      console.error('Error deleting appointment:', err);
      showToast({ type: 'error', message: 'Erreur lors de la suppression' });
    }
  };

  const checkConflict = async (start: Date, end: Date, doctorId: string, excludeId?: string) => {
    const client = supabase;

    // ── Mock Mode ──
    if (!client) {
      const { MOCK_APPOINTMENTS } = await import('../constants');
      return MOCK_APPOINTMENTS.some((a) => {
        if (a.id === excludeId) return false;
        if (a.doctorId !== doctorId) return false;
        const aStart = new Date(a.start);
        const aEnd = new Date(aStart.getTime() + a.duration * 60000);
        return aStart < end && aEnd > start;
      });
    }

    if (!currentTenant) return true;

    const { data, error } = await client.rpc('check_appointment_conflict', {
      p_tenant_id: currentTenant.id,
      p_doctor_id: doctorId,
      p_start_time: start.toISOString(),
      p_end_time: end.toISOString(),
      p_exclude_id: excludeId,
    });

    if (error) {
      console.error('Conflict check error', error);
      return false;
    }

    return data as boolean;
  };

  return {
    appointments,
    loading,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    checkConflict,
  };
}
