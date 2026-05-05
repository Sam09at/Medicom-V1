import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  IconDownload,
  IconFileText,
  IconUsers,
  IconActivity,
  IconLayers,
  IconTrendingUp,
  IconTrendingDown,
} from '../components/Icons';
import { User } from '../types';
import { supabase } from '../lib/supabase';
import { getPlatformMRR } from '../lib/api/saas/analytics';
import { useNoShowScoring } from '../hooks/useNoShowScoring';

interface ReportsProps {
  user: User;
}

// ─── Fallback mock data ─────────────────────────────────────────────────────────

const MOCK_REVENUE = [
  { month: 'Jan', revenue: 45000, projected: 48000 },
  { month: 'Fév', revenue: 52000, projected: 50000 },
  { month: 'Mar', revenue: 49000, projected: 55000 },
  { month: 'Avr', revenue: 58000, projected: 58000 },
  { month: 'Mai', revenue: 63000, projected: 65000 },
  { month: 'Jun', revenue: 71000, projected: 70000 },
];

const FALLBACK_APPT_STATS = [
  { name: 'Confirmés', value: 450, color: '#136cfb' },
  { name: 'Annulés', value: 35, color: '#e2405f' },
  { name: 'Absents', value: 15, color: '#94a3b8' },
  { name: 'Reportés', value: 40, color: '#f59e0b' },
];

const FALLBACK_NOSHOW_TREND = [
  { month: 'Jan', rate: 5.2 },
  { month: 'Fév', rate: 4.8 },
  { month: 'Mar', rate: 3.5 },
  { month: 'Avr', rate: 3.8 },
  { month: 'Mai', rate: 2.1 },
  { month: 'Jun', rate: 1.8 },
];

const FALLBACK_TREATMENT_PERF = [
  { name: 'Consultation', count: 120, avgDuration: 25, revenue: 36000 },
  { name: 'Détartrage', count: 85, avgDuration: 40, revenue: 42500 },
  { name: 'Plombage', count: 45, avgDuration: 50, revenue: 22500 },
  { name: 'Extraction', count: 30, avgDuration: 30, revenue: 12000 },
  { name: 'Blanchiment', count: 15, avgDuration: 60, revenue: 45000 },
];

const featureAdoption = [
  { feature: 'Agenda', usedBy: 98 },
  { feature: 'Dossiers', usedBy: 95 },
  { feature: 'Facturation', usedBy: 70 },
  { feature: 'SMS', usedBy: 45 },
  { feature: 'Stock', usedBy: 30 },
  { feature: 'AI Assist', usedBy: 15 },
];

const cohorts = [
  { cohort: 'Jan 23', size: 12, m1: 100, m2: 98, m3: 95, m6: 90, m12: 85 },
  { cohort: 'Fév 23', size: 15, m1: 100, m2: 100, m3: 98, m6: 92, m12: 88 },
  { cohort: 'Mar 23', size: 10, m1: 100, m2: 90, m3: 88, m6: 80, m12: 75 },
  { cohort: 'Avr 23', size: 18, m1: 100, m2: 98, m3: 98, m6: 96, m12: 92 },
  { cohort: 'Mai 23', size: 20, m1: 100, m2: 95, m3: 92, m6: 88, m12: '-' },
  { cohort: 'Jun 23', size: 22, m1: 100, m2: 98, m3: 95, m6: '-', m12: '-' },
];

// ─── Shared tooltip ─────────────────────────────────────────────────────────────

const BlueTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#136cfb] text-white rounded-[30px] px-4 py-2 text-[12px] font-semibold border border-[#136cfb]">
        <div className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-0.5">
          {label}
        </div>
        <div>
          {payload[0].value?.toLocaleString('fr-FR')}
          {payload[0].unit ?? ''}
        </div>
      </div>
    );
  }
  return null;
};

// ─── Component ─────────────────────────────────────────────────────────────────

export const Reports: React.FC<ReportsProps> = ({ user }) => {
  const [reportType, setReportType] = useState<'financial' | 'operational' | 'clinical'>(
    'financial'
  );
  const [dateRange, setDateRange] = useState('6months');
  const [revenueData, setRevenueData] = useState(MOCK_REVENUE);
  const [totalRevenue, setTotalRevenue] = useState(338000);
  const [mrrData, setMrrData] = useState<{ currentMRR: number; growth: number }>({
    currentMRR: 0,
    growth: 0,
  });
  const [appointmentStats, setAppointmentStats] = useState(FALLBACK_APPT_STATS);
  const [noShowTrend, setNoShowTrend] = useState(FALLBACK_NOSHOW_TREND);
  const [treatmentPerformance, setTreatmentPerformance] = useState(FALLBACK_TREATMENT_PERF);

  const isSuperAdmin = user.role === 'super_admin';
  const { highRisk: highRiskPatients, avgRate: avgNoShowRate } = useNoShowScoring(10);

  useEffect(() => {
    const loadRevenueData = async () => {
      if (!supabase) return;
      try {
        const { data, error } = await supabase
          .from('invoices')
          .select('total_amount, issued_at')
          .in('status', ['paid', 'Paid', 'partial', 'Partial'])
          .order('issued_at', { ascending: true });
        if (!error && data && data.length > 0) {
          const monthlyMap: Record<string, number> = {};
          data.forEach((inv: any) => {
            const d = new Date(inv.issued_at);
            const key = d.toLocaleString('fr-FR', { month: 'short' });
            monthlyMap[key] = (monthlyMap[key] || 0) + (inv.total_amount || 0);
          });
          const mapped = Object.entries(monthlyMap)
            .slice(-6)
            .map(([month, revenue]) => ({
              month,
              revenue,
              projected: revenue * 1.05,
            }));
          if (mapped.length > 0) {
            setRevenueData(mapped);
            setTotalRevenue(mapped.reduce((s, m) => s + m.revenue, 0));
          }
        }
      } catch (err) {
        console.warn('[Reports] Fallback data:', err);
      }
    };

    const loadOperationalData = async () => {
      if (!supabase) return;
      try {
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        // Appointment status breakdown for current month
        const { data: apptData } = await supabase
          .from('appointments')
          .select('status')
          .gte('start_time', monthStart.toISOString());

        if (apptData && apptData.length > 0) {
          const counts: Record<string, number> = {};
          apptData.forEach((a: any) => { counts[a.status] = (counts[a.status] || 0) + 1; });

          const confirmed = (counts['confirmed'] || 0) + (counts['completed'] || 0) +
            (counts['waiting_room'] || 0) + (counts['in_progress'] || 0);
          const cancelled = counts['cancelled'] || 0;
          const absent = counts['absent'] || 0;
          const rescheduled = counts['rescheduled'] || 0;

          if (confirmed + cancelled + absent + rescheduled > 0) {
            setAppointmentStats([
              { name: 'Confirmés', value: confirmed, color: '#136cfb' },
              { name: 'Annulés', value: cancelled, color: '#e2405f' },
              { name: 'Absents', value: absent, color: '#94a3b8' },
              { name: 'Reportés', value: rescheduled, color: '#f59e0b' },
            ]);
          }
        }

        // No-show trend: last 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        sixMonthsAgo.setDate(1);
        sixMonthsAgo.setHours(0, 0, 0, 0);

        const { data: trendData } = await supabase
          .from('appointments')
          .select('status, start_time')
          .gte('start_time', sixMonthsAgo.toISOString())
          .in('status', ['confirmed', 'completed', 'absent', 'cancelled', 'rescheduled', 'waiting_room', 'in_progress']);

        if (trendData && trendData.length > 0) {
          const byMonth: Record<string, { total: number; absent: number }> = {};
          trendData.forEach((a: any) => {
            const key = new Date(a.start_time).toLocaleString('fr-FR', { month: 'short' });
            if (!byMonth[key]) byMonth[key] = { total: 0, absent: 0 };
            byMonth[key].total++;
            if (a.status === 'absent') byMonth[key].absent++;
          });
          const trend = Object.entries(byMonth)
            .slice(-6)
            .map(([month, v]) => ({
              month,
              rate: v.total > 0 ? parseFloat(((v.absent / v.total) * 100).toFixed(1)) : 0,
            }));
          if (trend.length > 0) setNoShowTrend(trend);
        }
      } catch (err) {
        console.warn('[Reports] Operational fallback:', err);
      }
    };

    const loadClinicalData = async () => {
      if (!supabase) return;
      try {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const { data } = await supabase
          .from('appointments')
          .select('appointment_type, duration_minutes')
          .gte('start_time', sixMonthsAgo.toISOString())
          .in('status', ['completed', 'in_progress']);

        if (data && data.length > 0) {
          const map: Record<string, { count: number; totalDuration: number }> = {};
          data.forEach((a: any) => {
            const name = a.appointment_type || 'Consultation';
            if (!map[name]) map[name] = { count: 0, totalDuration: 0 };
            map[name].count++;
            map[name].totalDuration += a.duration_minutes || 30;
          });
          const perf = Object.entries(map)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 5)
            .map(([name, v]) => ({
              name,
              count: v.count,
              avgDuration: Math.round(v.totalDuration / v.count),
              revenue: 0,
            }));
          if (perf.length > 0) setTreatmentPerformance(perf);
        }
      } catch (err) {
        console.warn('[Reports] Clinical fallback:', err);
      }
    };

    const loadMrr = async () => {
      if (!isSuperAdmin) return;
      try {
        const mrr = await getPlatformMRR();
        setMrrData({ currentMRR: mrr.currentMRR, growth: mrr.growth });
      } catch {
        /* fallback */
      }
    };

    loadRevenueData();
    loadOperationalData();
    loadClinicalData();
    loadMrr();
  }, [isSuperAdmin]);

  const handleExport = (format: 'csv' | 'pdf') => {
    if (format === 'pdf') {
      alert('Export PDF disponible prochainement.');
      return;
    }
    // CSV export — build rows based on active tab
    let csvRows: string[][] = [];
    let filename = 'rapport.csv';

    if (reportType === 'financial') {
      filename = 'rapport_revenus.csv';
      csvRows = [
        ['Mois', 'Revenus (MAD)', 'Objectif (MAD)'],
        ...revenueData.map((r) => [r.month, String(r.revenue), String(r.projected)]),
      ];
    } else if (reportType === 'operational') {
      filename = 'rapport_operations.csv';
      csvRows = [
        ['Statut', 'Nombre', 'Pourcentage'],
        ...appointmentStats.map((s) => {
          const total = appointmentStats.reduce((sum, x) => sum + x.value, 0);
          return [s.name, String(s.value), `${Math.round((s.value / total) * 100)}%`];
        }),
        [],
        ['Mois', 'Taux absence (%)'],
        ...noShowTrend.map((n) => [n.month, String(n.rate)]),
      ];
    } else {
      filename = 'rapport_clinique.csv';
      csvRows = [
        ['Traitement', 'Nombre actes', 'Durée moy. (min)', 'CA (MAD)'],
        ...treatmentPerformance.map((t) => [t.name, String(t.count), String(t.avgDuration), String(t.revenue)]),
      ];
    }

    const csv = csvRows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Clinic tabs ──────────────────────────────────────────────────────────────
  const TABS = [
    { id: 'financial', label: 'Revenus' },
    { id: 'operational', label: 'Opérations' },
    { id: 'clinical', label: 'Clinique' },
  ] as const;

  const renderClinicReports = () => (
    <div className="space-y-6">
      {/* Controls bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
        {/* Tab switcher */}
        <div className="flex items-center bg-slate-100/60 p-1 rounded-[30px] gap-1">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setReportType(id)}
              className={`px-4 py-2 rounded-[30px] text-[12px] font-semibold transition-all duration-300 ease-in-out border border-transparent ${reportType === id
                ? 'bg-white text-slate-900 border-slate-200/50'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="text-[12px] font-semibold border border-slate-200/60 rounded-[30px] px-4 py-2 bg-white text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10 transition-all cursor-pointer"
          >
            <option value="1month">Ce mois</option>
            <option value="3months">Dernier trimestre</option>
            <option value="6months">6 derniers mois</option>
            <option value="year">Cette année</option>
          </select>
          <button
            onClick={() => handleExport('csv')}
            title="Export CSV"
            className="w-9 h-9 rounded-[30px] border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#136cfb] hover:border-[#136cfb]/40 transition-all"
          >
            <IconFileText className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleExport('pdf')}
            title="Export PDF"
            className="w-9 h-9 rounded-[30px] border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#136cfb] hover:border-[#136cfb]/40 transition-all"
          >
            <IconDownload className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Financial ── */}
      {reportType === 'financial' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Area chart */}
          <div className="lg:col-span-2 card p-6">
            <h3 className="text-[15px] font-semibold text-slate-900 tracking-tight mb-1">
              Évolution des Revenus
            </h3>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-6">
              Réalisé vs Objectif
            </p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="grev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#136cfb" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#136cfb" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gproj" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.12} />
                      <stop offset="100%" stopColor="#94a3b8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#F1F5F9" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#CBD5E1', fontSize: 11, fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#CBD5E1', fontSize: 11, fontWeight: 600 }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                    dx={-4}
                  />
                  <Tooltip
                    content={<BlueTooltip />}
                    cursor={{ stroke: '#136cfb', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="projected"
                    stroke="#94a3b8"
                    strokeWidth={1.5}
                    fill="url(#gproj)"
                    dot={false}
                    activeDot={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#136cfb"
                    strokeWidth={2.5}
                    fill="url(#grev)"
                    dot={false}
                    activeDot={{ r: 4, fill: '#136cfb', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-5 mt-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#136cfb]" />
                <span className="text-[11px] font-semibold text-slate-500">Réalisé</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <span className="text-[11px] font-semibold text-slate-500">Objectif</span>
              </div>
            </div>
          </div>

          {/* KPI column */}
          <div className="space-y-4">
            {[
              {
                label: 'Revenu Total (6 mois)',
                value: `${Math.round(totalRevenue / 1000)}K MAD`,
                badge: '↑ 12% vs préc.',
                badgeClass: 'bg-emerald-50 text-emerald-600',
              },
              {
                label: 'Panier Moyen / Patient',
                value: '650 MAD',
              },
              {
                label: 'Taux de Recouvrement',
                value: '94%',
                progress: 94,
              },
            ].map((kpi) => (
              <div key={kpi.label} className="card p-5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  {kpi.label}
                </div>
                <div className="text-[26px] font-semibold tracking-tight text-slate-900 leading-none">
                  {kpi.value}
                </div>
                {kpi.badge && (
                  <span
                    className={`inline-block mt-2 text-[11px] font-bold px-2 py-0.5 rounded-[30px] ${kpi.badgeClass}`}
                  >
                    {kpi.badge}
                  </span>
                )}
                {kpi.progress && (
                  <div className="mt-3 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#136cfb]"
                      style={{ width: `${kpi.progress}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Operational ── */}
      {reportType === 'operational' && (
        <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Donut */}
          <div className="card p-6">
            <h3 className="text-[15px] font-semibold text-slate-900 tracking-tight mb-1">
              Statut des Rendez-vous
            </h3>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-6">
              Ce mois-ci
            </p>
            <div className="flex items-center gap-6">
              <div className="relative shrink-0">
                <PieChart width={160} height={160}>
                  <Pie
                    data={appointmentStats}
                    cx={75}
                    cy={75}
                    innerRadius={50}
                    outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                    strokeWidth={0}
                  >
                    {appointmentStats.map((e, i) => (
                      <Cell key={i} fill={e.color} />
                    ))}
                  </Pie>
                </PieChart>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[18px] font-semibold text-slate-900 leading-none">
                    {appointmentStats.reduce((s, d) => s + d.value, 0)}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    Total
                  </span>
                </div>
              </div>
              <div className="flex-1 space-y-3">
                {appointmentStats.map((d) => {
                  const total = appointmentStats.reduce((s, x) => s + x.value, 0);
                  const pct = Math.round((d.value / total) * 100);
                  return (
                    <div key={d.name}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: d.color }}
                          />
                          <span className="text-[12px] font-semibold text-slate-600">{d.name}</span>
                        </div>
                        <span className="text-[12px] font-semibold text-slate-900">{pct}%</span>
                      </div>
                      <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: d.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* No-show trend */}
          <div className="card p-6">
            <h3 className="text-[15px] font-semibold text-slate-900 tracking-tight mb-1">
              Taux d'Absence (No-Show)
            </h3>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-6">
              Évolution mensuelle
            </p>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={noShowTrend} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#F1F5F9" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#CBD5E1', fontSize: 11, fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#CBD5E1', fontSize: 11, fontWeight: 600 }}
                    unit="%"
                    dx={-4}
                  />
                  <Tooltip
                    content={<BlueTooltip />}
                    cursor={{ stroke: '#e2405f', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke="#e2405f"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4, fill: '#e2405f', stroke: '#fff', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* High-risk no-show patients */}
        {highRiskPatients.length > 0 && (
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-[15px] font-semibold text-slate-900 tracking-tight">
                  Patients à Risque Élevé d'Absence
                </h3>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  Score basé sur l'historique · taux moyen {(avgNoShowRate * 100).toFixed(0)}%
                </p>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-600">
                {highRiskPatients.length} patient{highRiskPatients.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="divide-y divide-slate-50">
              {highRiskPatients.map((p) => (
                <div key={p.patientId} className="flex items-center gap-4 px-6 py-3">
                  <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                    <span className="text-[11px] font-bold text-red-600">
                      {p.patientName.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-slate-900 truncate">{p.patientName}</p>
                    <p className="text-[11px] text-slate-400">
                      {p.noShowCount} absence{p.noShowCount > 1 ? 's' : ''} / {p.totalAppointments} RDV
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-[11px] font-bold text-red-600">{Math.round(p.noShowRate * 100)}%</p>
                      <p className="text-[10px] text-slate-400">absence</p>
                    </div>
                    <div className="w-16">
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-red-400"
                          style={{ width: `${p.score}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 text-right mt-0.5">score {p.score}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
      )}

      {/* ── Clinical ── */}
      {reportType === 'clinical' && (
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-[15px] font-semibold text-slate-900 tracking-tight">
              Performance des Traitements
            </h3>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              Actes réalisés ce semestre
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Type Traitement', 'Nombre Actes', 'Durée Moy.', "Chiffre d'Affaires"].map(
                    (h, i) => (
                      <th
                        key={h}
                        className={`px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest ${i === 0 ? 'text-left' : 'text-right'}`}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {treatmentPerformance.map((item, idx) => {
                  const isLast = idx === treatmentPerformance.length - 1;
                  return (
                    <tr
                      key={idx}
                      className={`hover:bg-slate-50/50 transition-colors ${!isLast ? 'border-b border-slate-100/60' : ''}`}
                    >
                      <td className="px-6 py-4 text-[13px] font-semibold text-slate-900">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 text-[13px] font-semibold text-slate-500 text-right">
                        {item.count}
                      </td>
                      <td className="px-6 py-4 text-[13px] font-semibold text-slate-500 text-right">
                        {item.avgDuration} min
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-[13px] font-semibold text-[#136cfb]">
                          {item.revenue.toLocaleString('fr-FR')}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 ml-1">MAD</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  // ── Super Admin view ─────────────────────────────────────────────────────────
  const renderSuperAdminReports = () => (
    <div className="space-y-6">
      {/* Platform Growth Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: 'Growth Rate',
            value: '15.2%',
            trend: '+12%',
            trendColor: 'green',
            sub: 'Croissance annuelle estimée',
            icon: IconUsers
          },
          {
            label: 'LTV (Lifetime Value)',
            value: '65k MAD',
            sub: 'Basé sur historique global',
            icon: IconActivity
          },
          {
            label: 'Churn Rate',
            value: '1.2%',
            trend: '-0.5%',
            trendColor: 'red',
            sub: 'Annulations mensuelles',
            icon: IconLayers
          },
          {
            label: 'CAC',
            value: '2.5k MAD',
            sub: 'Coût d\'acquisition client',
            icon: IconFileText
          }
        ].map((kpi, i) => (
          <div key={i} className="bg-white border border-slate-100 p-5 rounded-[12px]">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-[10px] bg-slate-50 flex items-center justify-center text-slate-500">
                <kpi.icon className="w-5 h-5" />
              </div>
              {kpi.trend && (
                <div className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${kpi.trendColor === 'green' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                  }`}>
                  {kpi.trendColor === 'green' ? <IconTrendingUp className="w-3 h-3" /> : <IconTrendingDown className="w-3 h-3" />}
                  {kpi.trend}
                </div>
              )}
            </div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              {kpi.label}
            </div>
            <div className="text-[26px] font-semibold text-slate-900 tracking-tight leading-none mb-1">
              {kpi.value}
            </div>
            <div className="text-[12px] font-medium text-slate-400">
              {kpi.sub}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Retention Cohort Table */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-[12px] overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[10px] bg-blue-50 flex items-center justify-center text-[#136cfb]">
                <IconUsers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-[#0f0f10]">Analyse de Rétention</h3>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Cohortes mensuelles</p>
              </div>
            </div>
            <button className="text-[12px] font-bold text-slate-500 hover:text-black transition-colors">Détails</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-center">
              <thead>
                <tr className="bg-slate-50/50">
                  {['Cohorte', 'Taille', 'M1', 'M2', 'M3', 'M6', 'M12'].map((h) => (
                    <th key={h} className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest first:text-left border-b border-slate-100">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.03]">
                {cohorts.map((c, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 text-left text-[13px] font-bold text-[#0f0f10]">
                      {c.cohort}
                    </td>
                    <td className="px-5 py-4 text-[13px] font-semibold text-slate-500">{c.size}</td>
                    {[c.m1, c.m2, c.m3, c.m6, c.m12].map((val, j) => {
                      const percentage = typeof val === 'number' ? val : 0;
                      return (
                        <td key={j} className="px-2 py-4">
                          <div
                            className="inline-flex items-center justify-center w-12 py-1.5 rounded-[8px] text-[12px] font-bold"
                            style={{
                              backgroundColor: typeof val === 'number' ? `rgba(19, 108, 251, ${percentage / 100})` : 'transparent',
                              color: percentage > 45 ? '#fff' : '#136cfb',
                              opacity: typeof val === 'number' ? 1 : 0.2
                            }}
                          >
                            {val}{typeof val === 'number' ? '%' : ''}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Feature Adoption / Quick List */}
        <div className="bg-white border border-slate-100 rounded-[12px] p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-[10px] bg-violet-50 flex items-center justify-center text-violet-600">
              <IconLayers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-[#0f0f10]">Adoption Products</h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Activités hebdomadaires</p>
            </div>
          </div>

          <div className="space-y-6">
            {featureAdoption.map((f) => (
              <div key={f.feature}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-bold text-slate-600">{f.feature}</span>
                  <span className="text-[13px] font-extrabold text-[#0f0f10]">{f.usedBy}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-black transition-all duration-1000"
                    style={{ width: `${f.usedBy}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 p-4 rounded-[20px] bg-slate-50 border border-slate-100">
            <p className="text-[11px] font-medium text-slate-500 text-center uppercase tracking-widest mb-3">Besoin de plus de data ?</p>
            <button className="w-full sa-btn !rounded-full">
              Exporter Rapport Complet
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Root render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 font-sans pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold text-slate-900 tracking-tight">
            {isSuperAdmin ? 'Intelligence SaaS' : 'Rapports & Analyses'}
          </h1>
          <p className="text-[13px] text-slate-500 mt-0.5">
            {isSuperAdmin
              ? 'Performances globales de la plateforme.'
              : 'Indicateurs clés de votre cabinet.'}
          </p>
        </div>
        {isSuperAdmin && (
          <div className="flex items-center gap-2">
            <select className="text-[13px] font-semibold border border-slate-200/60 rounded-[30px] px-4 py-2 bg-white text-slate-700 outline-none cursor-pointer">
              <option>Ce trimestre</option>
              <option>Cette année</option>
            </select>
            <button className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#136cfb] hover:border-[#136cfb]/40 transition-all">
              <IconDownload className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {isSuperAdmin ? renderSuperAdminReports() : renderClinicReports()}
    </div>
  );
};
