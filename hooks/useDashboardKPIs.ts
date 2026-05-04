import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useMedicomStore } from '../store';
import { CabinetStats } from '../types';

export function useDashboardKPIs(fallback: CabinetStats) {
  const { currentTenant } = useMedicomStore();
  const [stats, setStats] = useState<CabinetStats>(fallback);

  useEffect(() => {
    if (!supabase || !currentTenant) {
      setStats(fallback);
      return;
    }

    const tenantId = currentTenant.id;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    Promise.all([
      supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .gte('start_time', todayStart.toISOString())
        .lte('start_time', todayEnd.toISOString())
        .not('status', 'in', '("cancelled","absent")'),

      supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('status', 'waiting_room'),

      supabase
        .from('payments')
        .select('amount')
        .eq('tenant_id', tenantId)
        .gte('payment_date', todayStart.toISOString())
        .lte('payment_date', todayEnd.toISOString()),

      supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('status', 'pending')
        .gte('start_time', todayStart.toISOString()),
    ]).then(([appts, waiting, payments, pending]) => {
      const revenue = (payments.data ?? []).reduce(
        (sum: number, p: { amount: number }) => sum + (p.amount ?? 0),
        0
      );
      setStats({
        appointmentsToday: appts.count ?? fallback.appointmentsToday,
        waitingRoom: waiting.count ?? fallback.waitingRoom,
        revenueToday: revenue || fallback.revenueToday,
        pendingConfirmations: pending.count ?? fallback.pendingConfirmations,
        activeTreatments: fallback.activeTreatments,
      });
    });
  }, [currentTenant?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return { stats };
}
