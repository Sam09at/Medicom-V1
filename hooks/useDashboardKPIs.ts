import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useMedicomStore } from '../store';
import { CabinetStats } from '../types';

export interface RevenuePoint {
  name: string;
  current: number;
  prev: number;
}

export interface AppointmentStatusPoint {
  label: string;
  value: number;
  color: string;
}

const STATUS_CHART_CONFIG: Record<string, { label: string; color: string }> = {
  confirmed: { label: 'Confirmés', color: '#136cfb' },
  pending: { label: 'En attente', color: '#94a3b8' },
  absent: { label: 'Non présentés', color: '#e2405f' },
  rescheduled: { label: 'Reportés', color: '#f59e0b' },
  completed: { label: 'Terminés', color: '#10b981' },
  cancelled: { label: 'Annulés', color: '#8b5cf6' },
  waiting_room: { label: 'En salle', color: '#0ea5e9' },
  in_progress: { label: 'En consultation', color: '#6366f1' },
};

const MONTH_LABELS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jui', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

export function useDashboardKPIs(fallback: CabinetStats) {
  const { currentTenant } = useMedicomStore();
  const [stats, setStats] = useState<CabinetStats>(fallback);
  const [revenueByMonth, setRevenueByMonth] = useState<RevenuePoint[]>([]);
  const [appointmentStatusData, setAppointmentStatusData] = useState<AppointmentStatusPoint[]>([]);

  useEffect(() => {
    if (!supabase || !currentTenant) {
      setStats(fallback);
      return;
    }

    const tenantId = currentTenant.id;
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    // Build 12-month windows for current and previous year
    const currentYear = now.getFullYear();
    const prevYear = currentYear - 1;

    // ── KPI Cards ──
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

    // ── Revenue by month (12 months × 2 years) ──
    Promise.all([
      supabase
        .from('payments')
        .select('amount, payment_date')
        .eq('tenant_id', tenantId)
        .gte('payment_date', `${currentYear}-01-01`)
        .lte('payment_date', `${currentYear}-12-31`),

      supabase
        .from('payments')
        .select('amount, payment_date')
        .eq('tenant_id', tenantId)
        .gte('payment_date', `${prevYear}-01-01`)
        .lte('payment_date', `${prevYear}-12-31`),
    ]).then(([cur, prev]) => {
      const bucketize = (rows: { amount: number; payment_date: string }[]) => {
        const buckets = new Array(12).fill(0);
        for (const row of rows) {
          const month = new Date(row.payment_date).getMonth();
          buckets[month] += row.amount ?? 0;
        }
        return buckets;
      };

      const curBuckets = bucketize(cur.data ?? []);
      const prevBuckets = bucketize(prev.data ?? []);

      setRevenueByMonth(
        MONTH_LABELS_FR.map((name, i) => ({
          name,
          current: curBuckets[i],
          prev: prevBuckets[i],
        }))
      );
    });

    // ── Appointment status breakdown (current month) ──
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    supabase
      .from('appointments')
      .select('status')
      .eq('tenant_id', tenantId)
      .gte('start_time', monthStart.toISOString())
      .lte('start_time', monthEnd.toISOString())
      .then(({ data }) => {
        const counts: Record<string, number> = {};
        for (const row of data ?? []) {
          counts[row.status] = (counts[row.status] ?? 0) + 1;
        }

        const points: AppointmentStatusPoint[] = Object.entries(counts)
          .map(([status, value]) => ({
            label: STATUS_CHART_CONFIG[status]?.label ?? status,
            value,
            color: STATUS_CHART_CONFIG[status]?.color ?? '#94a3b8',
          }))
          .sort((a, b) => b.value - a.value);

        setAppointmentStatusData(points);
      });
  }, [currentTenant?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return { stats, revenueByMonth, appointmentStatusData };
}
