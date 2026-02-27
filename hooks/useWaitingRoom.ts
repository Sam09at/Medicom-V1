import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Appointment, AppointmentStatus } from '../types';
import { useMedicomStore } from '../store';

export function useWaitingRoom() {
  const { currentUser, currentTenant } = useMedicomStore();
  const [waitingPatients, setWaitingPatients] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchWaitingRoom = async () => {
    if (!currentTenant) return;

    try {
      setIsLoading(true);
      setError(null);

      // Fetch today's appointments that are in ARRIVED status
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (!supabase) throw new Error('Supabase client not initialized');

      let query = supabase
        .from('appointments')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .eq('status', AppointmentStatus.ARRIVED)
        .gte('start_time', today.toISOString())
        .lt('start_time', tomorrow.toISOString())
        .order('start_time', { ascending: true });

      if (currentUser?.role === 'doctor') {
        query = query.eq('doctor_id', currentUser.id);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Map DB rows to our Frontend type
      const mappedData: Appointment[] = (data || []).map((row) => ({
        id: row.id,
        patientId: row.patient_id,
        doctorId: row.doctor_id,
        start: new Date(row.start_time),
        duration: Math.round(
          (new Date(row.end_time).getTime() - new Date(row.start_time).getTime()) / 60000
        ),
        type: row.type as any,
        status: row.status as AppointmentStatus,
        notes: row.notes || undefined,
        patientName: row.title || 'Patient', // In real app, we'd join with patients table or compute it
      }));

      setWaitingPatients(mappedData);
    } catch (err: any) {
      console.error('Error fetching waiting room:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWaitingRoom();

    // Subscribe to realtime changes
    if (!currentTenant || !supabase) return;

    const subscription = supabase
      .channel('waiting_room_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `tenant_id=eq.${currentTenant.id}`,
        },
        () => {
          fetchWaitingRoom();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentTenant?.id, currentUser?.id, currentUser?.role]);

  return {
    waitingPatients,
    isLoading,
    error,
    refreshWaitingRoom: fetchWaitingRoom,
  };
}
