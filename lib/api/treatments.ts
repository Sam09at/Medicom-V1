import { supabase } from '../supabase';
import { TreatmentPlan, TreatmentSession, ToothStatus, ToothSurface } from '../../types';

// Treatment Plans
export const getTreatmentPlans = async (patientId: string) => {
  if (!supabase) throw new Error('Supabase client not initialized');

  const { data, error } = await supabase
    .from('treatment_plans')
    .select(
      `
      *,
      sessions:treatment_sessions(*)
    `
    )
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as TreatmentPlan[];
};

export const createTreatmentPlan = async (plan: Partial<TreatmentPlan>) => {
  if (!supabase) throw new Error('Supabase client not initialized');

  const { data, error } = await supabase.from('treatment_plans').insert([plan]).select().single();

  if (error) throw error;
  return data as TreatmentPlan;
};

export const updateTreatmentPlan = async (id: string, updates: Partial<TreatmentPlan>) => {
  if (!supabase) throw new Error('Supabase client not initialized');

  const { data, error } = await supabase
    .from('treatment_plans')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as TreatmentPlan;
};

export const updateOdontogramSnapshot = async (
  planId: string,
  snapshot: Record<number, { status: ToothStatus; surfaces: ToothSurface[]; notes?: string }>
) => {
  if (!supabase) throw new Error('Supabase client not initialized');

  const { error } = await supabase
    .from('treatment_plans')
    .update({ odontogram_snapshot: snapshot })
    .eq('id', planId);

  if (error) throw error;
};

// Treatment Sessions
export const addTreatmentSession = async (session: Partial<TreatmentSession>) => {
  if (!supabase) throw new Error('Supabase client not initialized');

  const { data, error } = await supabase
    .from('treatment_sessions')
    .insert([session])
    .select()
    .single();

  if (error) throw error;
  return data as TreatmentSession;
};

export const updateTreatmentSession = async (id: string, updates: Partial<TreatmentSession>) => {
  if (!supabase) throw new Error('Supabase client not initialized');

  const { data, error } = await supabase
    .from('treatment_sessions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as TreatmentSession;
};

export const deleteTreatmentSession = async (id: string) => {
  if (!supabase) throw new Error('Supabase client not initialized');

  const { error } = await supabase.from('treatment_sessions').delete().eq('id', id);

  if (error) throw error;
};
