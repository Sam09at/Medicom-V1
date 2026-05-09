import { supabase } from '../supabase';
import { TreatmentPlan, TreatmentSession, ToothStatus, ToothSurface } from '../../types';

// ── Row type (DB snake_case) ──────────────────────────────────────────────────

interface PlanRow {
  id: string;
  tenant_id: string;
  patient_id: string;
  doctor_id: string;
  title: string;
  description?: string;
  status: string;
  total_amount: number;
  odontogram_snapshot: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  sessions?: SessionRow[];
}

interface SessionRow {
  id: string;
  treatment_plan_id: string;
  tenant_id: string;
  appointment_id?: string;
  service_name?: string;
  price?: number;
  session_order?: number;
  tooth_numbers?: number[];
  procedure_notes?: string;
  status: string;
  session_date?: string;
  created_at: string;
}

function toPlan(row: PlanRow): TreatmentPlan {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    patientId: row.patient_id,
    doctorId: row.doctor_id,
    title: row.title,
    description: row.description,
    status: row.status as TreatmentPlan['status'],
    totalAmount: row.total_amount,
    odontogramSnapshot: row.odontogram_snapshot as any,
    sessions: (row.sessions ?? []).map(toSession),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toSession(row: SessionRow): TreatmentSession {
  return {
    id: row.id,
    treatmentPlanId: row.treatment_plan_id,
    tenantId: row.tenant_id,
    doctorId: '',
    appointmentId: row.appointment_id,
    serviceName: row.service_name,
    price: row.price ?? 0,
    sessionOrder: row.session_order ?? 0,
    toothNumbers: row.tooth_numbers ?? [],
    procedureNotes: row.procedure_notes,
    status: row.status as TreatmentSession['status'],
    sessionDate: row.session_date,
    durationMinutes: 0,
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

export const getTreatmentPlans = async (patientId: string): Promise<TreatmentPlan[]> => {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('treatment_plans')
    .select('*, sessions:treatment_sessions(*)')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((r) => toPlan(r as PlanRow));
};

export const createTreatmentPlan = async (
  plan: Pick<TreatmentPlan, 'title' | 'patientId' | 'doctorId' | 'status' | 'totalAmount' | 'tenantId'> & {
    odontogramSnapshot?: Record<number, unknown>;
    description?: string;
  }
): Promise<TreatmentPlan> => {
  if (!supabase) throw new Error('Supabase client not initialized');

  const row = {
    tenant_id:          plan.tenantId,
    patient_id:         plan.patientId,
    doctor_id:          plan.doctorId,
    title:              plan.title,
    description:        plan.description ?? null,
    status:             plan.status,
    total_amount:       plan.totalAmount,
    odontogram_snapshot: plan.odontogramSnapshot ?? {},
  };

  const { data, error } = await supabase
    .from('treatment_plans')
    .insert([row])
    .select('*, sessions:treatment_sessions(*)')
    .single();

  if (error) throw error;
  return toPlan(data as PlanRow);
};

export const updateTreatmentPlan = async (
  id: string,
  updates: Partial<Pick<TreatmentPlan, 'title' | 'status' | 'totalAmount'>>
): Promise<TreatmentPlan> => {
  if (!supabase) throw new Error('Supabase client not initialized');

  const row: Record<string, unknown> = {};
  if (updates.title)       row.title        = updates.title;
  if (updates.status)      row.status       = updates.status;
  if (updates.totalAmount !== undefined) row.total_amount = updates.totalAmount;

  const { data, error } = await supabase
    .from('treatment_plans')
    .update(row)
    .eq('id', id)
    .select('*, sessions:treatment_sessions(*)')
    .single();

  if (error) throw error;
  return toPlan(data as PlanRow);
};

export const updateOdontogramSnapshot = async (
  planId: string,
  snapshot: Record<number, { status: ToothStatus; surfaces: ToothSurface[]; notes?: string }>
): Promise<void> => {
  if (!supabase) throw new Error('Supabase client not initialized');

  const { error } = await supabase
    .from('treatment_plans')
    .update({ odontogram_snapshot: snapshot })
    .eq('id', planId);

  if (error) throw error;
};

export const addTreatmentSession = async (
  session: Pick<TreatmentSession, 'treatmentPlanId' | 'tenantId' | 'serviceName' | 'price' | 'sessionOrder' | 'status'> & { doctorId?: string }
): Promise<TreatmentSession> => {
  if (!supabase) throw new Error('Supabase client not initialized');

  const row = {
    treatment_plan_id: session.treatmentPlanId,
    tenant_id:         session.tenantId,
    service_name:      session.serviceName,
    price:             session.price,
    session_order:     session.sessionOrder,
    status:            session.status,
  };

  const { data, error } = await supabase
    .from('treatment_sessions')
    .insert([row])
    .select()
    .single();

  if (error) throw error;
  return toSession(data as SessionRow);
};

export const updateTreatmentSession = async (
  id: string,
  updates: Partial<Pick<TreatmentSession, 'status' | 'procedureNotes' | 'sessionDate'>>
): Promise<TreatmentSession> => {
  if (!supabase) throw new Error('Supabase client not initialized');

  const row: Record<string, unknown> = {};
  if (updates.status)        row.status          = updates.status;
  if (updates.procedureNotes) row.procedure_notes = updates.procedureNotes;
  if (updates.sessionDate)   row.session_date    = updates.sessionDate;

  const { data, error } = await supabase
    .from('treatment_sessions')
    .update(row)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toSession(data as SessionRow);
};

export const deleteTreatmentSession = async (id: string): Promise<void> => {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { error } = await supabase.from('treatment_sessions').delete().eq('id', id);
  if (error) throw error;
};
