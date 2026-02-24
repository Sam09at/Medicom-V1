import { supabase } from '@/lib/supabase';

export interface MRRData {
  currentMRR: number;
  growth: number;
  history: { date: string; amount: number }[];
}

export interface ActivityFeedItem {
  id: string;
  type: 'tenant.created' | 'appointment.created' | 'invoice.paid' | string;
  description: string;
  created_at: string;
}

export const getPlatformMRR = async (): Promise<MRRData> => {
  if (!supabase) throw new Error('Supabase client not initialized');

  // Current MRR
  const { data: currentData, error: currentError } = await supabase
    .from('subscriptions')
    .select('mrr')
    .eq('status', 'active');

  if (currentError) throw currentError;
  const totalMRR = currentData.reduce((sum: number, sub: any) => sum + (sub.mrr || 0), 0);

  // Growth (Mock logic for now as we don't have historical snapshots table yet)
  const growth = 12.5;

  // History (Mock for chart, last 12 months)
  const history = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (11 - i));
    return {
      date: d.toLocaleString('fr-FR', { month: 'short' }),
      amount: Math.round(totalMRR * (0.5 + i * 0.05)), // Simulated growth curve
    };
  });

  return {
    currentMRR: totalMRR,
    growth,
    history,
  };
};

export const getActiveTenantsCount = async (): Promise<number> => {
  if (!supabase) throw new Error('Supabase client not initialized');

  const { count, error } = await supabase
    .from('tenants')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  if (error) throw error;
  return count || 0;
};

export const getDailyBookingStats = async (): Promise<{ today: number; trend: number }> => {
  if (!supabase) throw new Error('Supabase client not initialized');

  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('tenant_usage')
    .select('bookings_count')
    .eq('date', today);

  if (error) throw error;

  const total = data.reduce((sum: number, row: any) => sum + (row.bookings_count || 0), 0);

  return {
    today: total,
    trend: 5.2, // Mock trend
  };
};

export const getChurnRiskTenants = async (): Promise<any[]> => {
  if (!supabase) throw new Error('Supabase client not initialized');

  // Returning mock churn risk tenants
  return [
    { id: '1', name: 'Cabinet Casablanca', riskScore: 85 },
    { id: '2', name: 'Dr. Tazi Dental', riskScore: 78 },
  ];
};

export const getNewSignups = async (days: number = 7): Promise<number> => {
  // Mock new signups
  return 12;
};

export const getUrgentTicketsCount = async (): Promise<number> => {
  // Mock urgent tickets
  return 3;
};
