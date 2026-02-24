import { supabase } from '../supabase';
import { Consultation, Prescription, MedicalService } from '../../types';

const MOCK_CONSULTATIONS: Consultation[] = [];

export const getConsultation = async (id: string) => {
  if (!supabase) {
    const found = MOCK_CONSULTATIONS.find((c) => c.id === id);
    if (!found) throw new Error('Consultation not found (Mock)');
    return found;
  }
  const { data, error } = await supabase
    .from('consultations')
    .select(
      `
      *,
      patients (first_name, last_name),
      users (name)
    `
    )
    .eq('id', id)
    .single();

  if (error) throw error;

  return {
    ...data,
    patientName: data.patients
      ? `${data.patients.first_name} ${data.patients.last_name}`
      : 'Unknown',
    doctorName: data.users?.name,
    vitals: data.vitals || {},
    chiefComplaint: data.chief_complaint,
    treatmentPlan: data.treatment_plan,
    invoiceId: data.invoice_id,
  } as Consultation;
};

export const getConsultationByAppointmentId = async (appointmentId: string) => {
  if (!supabase) {
    return MOCK_CONSULTATIONS.find((c) => c.appointmentId === appointmentId) || null;
  }
  const { data, error } = await supabase
    .from('consultations')
    .select(
      `
      *,
      patients (first_name, last_name),
      users (name)
    `
    )
    .eq('appointment_id', appointmentId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    ...data,
    patientName: data.patients
      ? `${data.patients.first_name} ${data.patients.last_name}`
      : 'Unknown',
    doctorName: data.users?.name,
    vitals: data.vitals || {},
    chiefComplaint: data.chief_complaint,
    treatmentPlan: data.treatment_plan,
    invoiceId: data.invoice_id,
  } as Consultation;
};

export const createConsultation = async (consultation: Partial<Consultation>) => {
  if (!supabase) {
    const newC: Consultation = {
      id: `cons-${Date.now()}`,
      ...consultation,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      vitals: consultation.vitals || {},
      status: consultation.status || 'draft',
      patientName: 'Mock Patient',
    } as Consultation;
    MOCK_CONSULTATIONS.push(newC);
    return newC;
  }
  // Map camelCase to snake_case
  const payload = {
    tenant_id: consultation.tenantId,
    patient_id: consultation.patientId,
    appointment_id: consultation.appointmentId,
    doctor_id: consultation.doctorId,
    chief_complaint: consultation.chiefComplaint,
    examination: consultation.examination,
    diagnosis: consultation.diagnosis,
    treatment_plan: consultation.treatmentPlan,
    notes: consultation.notes,
    vitals: consultation.vitals || {},
    status: consultation.status || 'draft',
  };

  const { data, error } = await supabase.from('consultations').insert(payload).select().single();

  if (error) throw error;
  return data;
};

export const updateConsultation = async (id: string, updates: Partial<Consultation>) => {
  if (!supabase) {
    const idx = MOCK_CONSULTATIONS.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Consultation not found (Mock)');
    const updated = { ...MOCK_CONSULTATIONS[idx], ...updates, updatedAt: new Date().toISOString() };
    // Deep merge vitals if needed, but simple spread is ok for now since we pass full vitals object usually
    if (updates.vitals) updated.vitals = { ...MOCK_CONSULTATIONS[idx].vitals, ...updates.vitals };

    MOCK_CONSULTATIONS[idx] = updated;
    return updated;
  }
  const payload: any = {};
  if (updates.chiefComplaint !== undefined) payload.chief_complaint = updates.chiefComplaint;
  if (updates.examination !== undefined) payload.examination = updates.examination;
  if (updates.diagnosis !== undefined) payload.diagnosis = updates.diagnosis;
  if (updates.treatmentPlan !== undefined) payload.treatment_plan = updates.treatmentPlan;
  if (updates.notes !== undefined) payload.notes = updates.notes;
  if (updates.vitals !== undefined) payload.vitals = updates.vitals;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.invoiceId !== undefined) payload.invoice_id = updates.invoiceId;

  const { data, error } = await supabase
    .from('consultations')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const createPrescription = async (prescription: Partial<Prescription>) => {
  if (!supabase) {
    // Mock just accepts it
    return { id: `presc-${Date.now()}`, ...prescription };
  }
  // Only include fields present in the argument
  const payload: any = {
    drugs: prescription.drugs,
    notes: prescription.notes,
    issued_at: prescription.issuedAt,
  };

  if (prescription.tenantId) payload.tenant_id = prescription.tenantId;
  if (prescription.patientId) payload.patient_id = prescription.patientId;
  if (prescription.consultationId) payload.consultation_id = prescription.consultationId;
  if (prescription.doctorId) payload.doctor_id = prescription.doctorId;

  const { data, error } = await supabase.from('prescriptions').insert(payload).select().single();

  if (error) throw error;
  return data;
};

export const getPatientHistory = async (patientId: string) => {
  if (!supabase) {
    return MOCK_CONSULTATIONS.filter((c) => c.patientId === patientId);
  }
  const { data, error } = await supabase
    .from('consultations')
    .select(
      `
      *,
      users (name),
      prescriptions (*)
    `
    )
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data.map((row: any) => ({
    ...row,
    createdAt: row.created_at,
    doctorName: row.users?.name,
    vitals: row.vitals || {},
    chiefComplaint: row.chief_complaint,
    treatmentPlan: row.treatment_plan,
    prescriptions: row.prescriptions || [],
  }));
};

export const getMedicalServices = async (tenantId: string) => {
  if (!supabase) {
    const { MOCK_SERVICES } = await import('../../constants');
    return MOCK_SERVICES;
  }
  const { data, error } = await supabase
    .from('medical_services')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('name');

  if (error) throw error;

  return data.map((row: any) => ({
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    category: row.category,
    durationMinutes: row.duration_minutes,
    price: row.price,
    tvaRate: row.tva_rate,
    isActive: row.is_active,
  })) as MedicalService[];
};
