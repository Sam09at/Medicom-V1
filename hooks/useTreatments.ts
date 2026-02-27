import { useState, useEffect } from 'react';
import { TreatmentPlan, TreatmentSession, ToothStatus, ToothSurface } from '../types';
import {
  getTreatmentPlans,
  createTreatmentPlan,
  updateOdontogramSnapshot,
  addTreatmentSession,
  updateTreatmentSession,
} from '../lib/api/treatments';
import { supabase } from '../lib/supabase';

export const useTreatments = (patientId?: string) => {
  const [plans, setPlans] = useState<TreatmentPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = async () => {
    if (!patientId) return;
    if (!supabase) {
      setPlans([]);
      return;
    } // Graceful fallback if no Supabase

    setLoading(true);
    try {
      const data = await getTreatmentPlans(patientId);
      setPlans(data);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching treatment plans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [patientId]);

  const addPlan = async (plan: Partial<TreatmentPlan>) => {
    try {
      const newPlan = await createTreatmentPlan(plan);
      setPlans([newPlan, ...plans]);
      return newPlan;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const saveOdontogram = async (
    planId: string,
    snapshot: Record<number, { status: ToothStatus; surfaces: ToothSurface[]; notes?: string }>
  ) => {
    try {
      await updateOdontogramSnapshot(planId, snapshot);
      // Update local state
      setPlans(plans.map((p) => (p.id === planId ? { ...p, odontogramSnapshot: snapshot } : p)));
    } catch (err: any) {
      console.error('Failed to save odontogram:', err);
    }
  };

  const addSession = async (session: Partial<TreatmentSession>) => {
    try {
      const newSession = await addTreatmentSession(session);
      // Refresh plans to get updated sessions if they are nested,
      // or we might need a separate getSessions for the plan.
      // For now, let's just refresh.
      await fetchPlans();
      return newSession;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const completeSession = async (sessionId: string, status: 'Completed' | 'Skipped') => {
    try {
      await updateTreatmentSession(sessionId, { status });
      await fetchPlans();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    plans,
    loading,
    error,
    addPlan,
    saveOdontogram,
    addSession,
    completeSession,
    refresh: fetchPlans,
  };
};
