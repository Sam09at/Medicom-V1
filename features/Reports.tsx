import React, { useState, useEffect } from 'react';
import {
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
  Legend,
} from 'recharts';
import {
  IconDownload,
  IconFileText,
  IconUsers,
  IconActivity,
  IconLayers,
} from '../components/Icons';
import { User } from '../types';
import { supabase } from '../lib/supabase';
import { getPlatformMRR } from '../lib/api/saas/analytics';

interface ReportsProps {
  user: User;
}

// Fallback mock data
const MOCK_REVENUE = [
  { month: 'Jan', revenue: 45000, projected: 48000 },
  { month: 'Fev', revenue: 52000, projected: 50000 },
  { month: 'Mar', revenue: 49000, projected: 55000 },
  { month: 'Avr', revenue: 58000, projected: 58000 },
  { month: 'Mai', revenue: 63000, projected: 65000 },
  { month: 'Juin', revenue: 71000, projected: 70000 },
];

const appointmentStats = [
  { name: 'Confirmés', value: 450, color: '#10B981' },
  { name: 'Annulés', value: 35, color: '#EF4444' },
  { name: 'Absents', value: 15, color: '#64748b' },
  { name: 'Reportés', value: 40, color: '#8B5CF6' },
];

const noShowTrend = [
  { month: 'Jan', rate: 5.2 },
  { month: 'Fev', rate: 4.8 },
  { month: 'Mar', rate: 3.5 },
  { month: 'Avr', rate: 3.8 },
  { month: 'Mai', rate: 2.1 },
  { month: 'Juin', rate: 1.8 },
];

const treatmentPerformance = [
  { name: 'Consultation', count: 120, avgDuration: 25, revenue: 36000 },
  { name: 'Détartrage', count: 85, avgDuration: 40, revenue: 42500 },
  { name: 'Plombage', count: 45, avgDuration: 50, revenue: 22500 },
  { name: 'Extraction', count: 30, avgDuration: 30, revenue: 12000 },
  { name: 'Blanchiment', count: 15, avgDuration: 60, revenue: 45000 },
];

// --- Super Admin Mock Data ---
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
  { cohort: 'Fev 23', size: 15, m1: 100, m2: 100, m3: 98, m6: 92, m12: 88 },
  { cohort: 'Mar 23', size: 10, m1: 100, m2: 90, m3: 88, m6: 80, m12: 75 },
  { cohort: 'Avr 23', size: 18, m1: 100, m2: 98, m3: 98, m6: 96, m12: 92 },
  { cohort: 'Mai 23', size: 20, m1: 100, m2: 95, m3: 92, m6: 88, m12: '-' },
  { cohort: 'Jun 23', size: 22, m1: 100, m2: 98, m3: 95, m6: '-', m12: '-' },
];

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

  const isSuperAdmin = user.role === 'super_admin';

  // Load real data from Supabase
  useEffect(() => {
    const loadRevenueData = async () => {
      if (!supabase) return;
      try {
        // Clinic-level: aggregate invoice totals by month
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
              projected: revenue * 1.05, // 5% projected growth
            }));
          if (mapped.length > 0) {
            setRevenueData(mapped);
            setTotalRevenue(mapped.reduce((s, m) => s + m.revenue, 0));
          }
        }
      } catch (err) {
        console.warn('[Reports] Using fallback revenue data:', err);
      }
    };

    const loadMrrData = async () => {
      if (!isSuperAdmin) return;
      try {
        const mrr = await getPlatformMRR();
        setMrrData({ currentMRR: mrr.currentMRR, growth: mrr.growth });
      } catch {
        /* fallback */
      }
    };

    loadRevenueData();
    loadMrrData();
  }, [isSuperAdmin]);

  const handleExport = (format: 'csv' | 'pdf') => {
    alert(`Export du rapport ${reportType} en format ${format.toUpperCase()} lancé...`);
  };

  const renderClinicReports = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-3 rounded-3xl border border-slate-100/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex gap-1 p-1 bg-slate-50/80 rounded-2xl w-full sm:w-auto overflow-auto">
          <button
            onClick={() => setReportType('financial')}
            className={`px-5 py-2.5 text-[0.875rem] font-bold rounded-xl transition-all whitespace-nowrap ${reportType === 'financial' ? 'bg-white text-blue-600 shadow-sm border border-slate-100/80' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50 border border-transparent'}`}
          >
            Revenus
          </button>
          <button
            onClick={() => setReportType('operational')}
            className={`px-5 py-2.5 text-[0.875rem] font-bold rounded-xl transition-all whitespace-nowrap ${reportType === 'operational' ? 'bg-white text-blue-600 shadow-sm border border-slate-100/80' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50 border border-transparent'}`}
          >
            Opérations
          </button>
          <button
            onClick={() => setReportType('clinical')}
            className={`px-5 py-2.5 text-[0.875rem] font-bold rounded-xl transition-all whitespace-nowrap ${reportType === 'clinical' ? 'bg-white text-blue-600 shadow-sm border border-slate-100/80' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50 border border-transparent'}`}
          >
            Clinique
          </button>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full sm:w-48 px-4 py-2.5 bg-slate-50/50 border border-slate-100/80 rounded-2xl text-[0.875rem] font-bold text-slate-900 transition-all outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/20 shadow-sm appearance-none"
          >
            <option value="1month">Ce mois</option>
            <option value="3months">Dernier trimestre</option>
            <option value="6months">6 derniers mois</option>
            <option value="year">Cette année</option>
          </select>
          <div className="flex gap-1.5">
            <button
              onClick={() => handleExport('csv')}
              className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
              title="Export CSV"
            >
              <IconFileText className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
              title="Export PDF"
            >
              <IconDownload className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {reportType === 'financial' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-100/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <h3 className="text-[1rem] font-bold text-slate-900 mb-8 tracking-tight">
              Évolution des Revenus
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={revenueData}
                  barSize={40}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#E2E8F0"
                    opacity={0.5}
                  />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 600 }}
                  />
                  <Tooltip
                    cursor={{ fill: '#F8FAFC' }}
                    contentStyle={{
                      borderRadius: '1rem',
                      border: '1px solid #E2E8F0',
                      padding: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '13px', paddingTop: '20px', fontWeight: 500 }}
                  />
                  <Bar dataKey="revenue" name="Réalisé" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="projected" name="Objectif" fill="#E2E8F0" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-100/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-center">
              <div className="space-y-2">
                <div className="text-[0.75rem] font-bold text-slate-400 uppercase tracking-widest">
                  Revenu Total (6 mois)
                </div>
                <div className="text-4xl font-extrabold text-slate-900 tracking-tight">
                  {Math.round(totalRevenue / 1000)}k{' '}
                  <span className="text-xl text-slate-400 font-bold ml-1">MAD</span>
                </div>
                <div className="text-[0.75rem] text-emerald-600 font-bold bg-emerald-50 inline-flex items-center px-2 py-1 rounded-[8px]">
                  ↑ 12% vs période préc.
                </div>
              </div>
            </div>
            <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-100/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-center">
              <div className="space-y-2">
                <div className="text-[0.75rem] font-bold text-slate-400 uppercase tracking-widest">
                  Panier Moyen / Patient
                </div>
                <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  650 <span className="text-lg text-slate-400 font-bold ml-1">MAD</span>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-100/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-center">
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="text-[0.75rem] font-bold text-slate-400 uppercase tracking-widest">
                    Taux Recouvrement
                  </div>
                  <div className="text-3xl font-extrabold text-slate-900 tracking-tight">94%</div>
                </div>
                <div className="w-full bg-slate-50 border border-slate-100/80 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '94%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {reportType === 'operational' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-100/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <h3 className="text-[1rem] font-bold text-slate-900 mb-8 tracking-tight">
              Statut des Rendez-vous
            </h3>
            <div className="h-80 flex justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={appointmentStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {appointmentStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '1rem',
                      border: 'none',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={40}
                    iconType="circle"
                    wrapperStyle={{ fontSize: '13px', fontWeight: 500 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-100/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <h3 className="text-[1rem] font-bold text-slate-900 mb-8 tracking-tight">
              Taux d'Absence (No-Show)
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={noShowTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#E2E8F0"
                    opacity={0.5}
                  />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 600 }}
                    unit="%"
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '1rem',
                      border: '1px solid #E2E8F0',
                      padding: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke="#EF4444"
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 6, stroke: '#fff', strokeWidth: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {reportType === 'clinical' && (
        <div className="bg-white border border-slate-100/50 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="px-8 py-5 border-b border-slate-100/50 bg-slate-50/30">
            <h3 className="text-[1rem] font-bold text-slate-900 tracking-tight">
              Performance des Traitements
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50/50 border-b border-slate-100/50">
                <tr>
                  <th
                    scope="col"
                    className="px-8 py-4 text-left text-[0.65rem] font-bold text-slate-400 uppercase tracking-[0.1em]"
                  >
                    Type Traitement
                  </th>
                  <th
                    scope="col"
                    className="px-8 py-4 text-right text-[0.65rem] font-bold text-slate-400 uppercase tracking-[0.1em]"
                  >
                    Nombre Actes
                  </th>
                  <th
                    scope="col"
                    className="px-8 py-4 text-right text-[0.65rem] font-bold text-slate-400 uppercase tracking-[0.1em]"
                  >
                    Durée Moy. (min)
                  </th>
                  <th
                    scope="col"
                    className="px-8 py-4 text-right text-[0.65rem] font-bold text-slate-400 uppercase tracking-[0.1em]"
                  >
                    Chiffre d'Affaires
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-50/80">
                {treatmentPerformance.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-8 py-5 whitespace-nowrap text-[0.875rem] font-bold text-slate-900">
                      {item.name}
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-[0.875rem] font-medium text-slate-500 text-right">
                      {item.count}
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-[0.875rem] font-medium text-slate-500 text-right">
                      {item.avgDuration}
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-[0.875rem] font-extrabold text-blue-600 text-right">
                      {item.revenue.toLocaleString()}{' '}
                      <span className="text-[0.65rem] text-slate-400 font-bold uppercase tracking-wider ml-0.5">
                        MAD
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderSuperAdminReports = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Retention Cohort Analysis */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <h3 className="text-[1rem] font-bold text-slate-900 mb-6 flex items-center gap-3 tracking-tight">
            <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-600">
              <IconUsers className="w-5 h-5" />
            </div>
            Analyse de Rétention (Cohortes)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr>
                  <th className="p-4 border-b border-slate-100/50 text-left text-[0.65rem] font-bold text-slate-400 uppercase tracking-[0.1em]">
                    Cohorte
                  </th>
                  <th className="p-4 border-b border-slate-100/50 text-[0.65rem] font-bold text-slate-400 uppercase tracking-[0.1em]">
                    Taille
                  </th>
                  <th className="p-4 border-b border-slate-100/50 text-[0.65rem] font-bold text-slate-400 uppercase tracking-[0.1em]">
                    M1
                  </th>
                  <th className="p-4 border-b border-slate-100/50 text-[0.65rem] font-bold text-slate-400 uppercase tracking-[0.1em]">
                    M2
                  </th>
                  <th className="p-4 border-b border-slate-100/50 text-[0.65rem] font-bold text-slate-400 uppercase tracking-[0.1em]">
                    M3
                  </th>
                  <th className="p-4 border-b border-slate-100/50 text-[0.65rem] font-bold text-slate-400 uppercase tracking-[0.1em]">
                    M6
                  </th>
                  <th className="p-4 border-b border-slate-100/50 text-[0.65rem] font-bold text-slate-400 uppercase tracking-[0.1em]">
                    M12
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {cohorts.map((c, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-left font-bold text-slate-900 text-[0.8125rem]">
                      {c.cohort}
                    </td>
                    <td className="p-4 text-[0.8125rem] font-medium text-slate-500">{c.size}</td>
                    <td className="p-4 text-[0.8125rem] font-bold bg-blue-50/50 text-blue-700">
                      {c.m1}%
                    </td>
                    <td
                      className="p-4 text-[0.8125rem] font-bold bg-blue-50/50 text-blue-700"
                      style={{ opacity: typeof c.m2 === 'number' ? 0.3 + (c.m2 / 100) * 0.7 : 0.3 }}
                    >
                      {c.m2}%
                    </td>
                    <td
                      className="p-4 text-[0.8125rem] font-bold bg-blue-50/50 text-blue-700"
                      style={{ opacity: typeof c.m3 === 'number' ? 0.3 + (c.m3 / 100) * 0.7 : 0.3 }}
                    >
                      {c.m3}%
                    </td>
                    <td
                      className="p-4 text-[0.8125rem] font-bold bg-blue-50/50 text-blue-700"
                      style={{ opacity: typeof c.m6 === 'number' ? 0.3 + (c.m6 / 100) * 0.7 : 0.2 }}
                    >
                      {c.m6}%
                    </td>
                    <td
                      className="p-4 text-[0.8125rem] font-bold bg-blue-50/50 text-blue-700"
                      style={{
                        opacity: typeof c.m12 === 'number' ? 0.3 + (c.m12 / 100) * 0.7 : 0.1,
                      }}
                    >
                      {c.m12}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Feature Adoption */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <h3 className="text-[1rem] font-bold text-slate-900 mb-6 flex items-center gap-3 tracking-tight">
            <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-600">
              <IconLayers className="w-5 h-5" />
            </div>
            Adoption des Fonctionnalités
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={featureAdoption} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="#E2E8F0"
                  opacity={0.5}
                />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 600 }}
                  unit="%"
                />
                <YAxis
                  type="category"
                  dataKey="feature"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#1E293B', fontSize: 13, fontWeight: 600 }}
                  width={90}
                />
                <Tooltip
                  cursor={{ fill: '#F8FAFC' }}
                  contentStyle={{
                    borderRadius: '1rem',
                    border: '1px solid #E2E8F0',
                    padding: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
                  }}
                />
                <Bar dataKey="usedBy" fill="#8B5CF6" radius={[0, 6, 6, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 text-[0.75rem] font-medium text-slate-400 text-center bg-slate-50/50 p-3 rounded-xl border border-slate-100/80">
            % des cabinets actifs utilisant la fonctionnalité au moins 1 fois / semaine.
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col pt-4 px-6 sm:px-10 pb-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {isSuperAdmin ? 'Intelligence SaaS' : 'Rapports & Analyses'}
          </h2>
          <p className="mt-2 text-[0.875rem] font-medium text-slate-500">
            {isSuperAdmin
              ? 'Analysez les performances globales de la plateforme.'
              : 'Suivez les indicateurs clés de votre cabinet.'}
          </p>
        </div>
        {isSuperAdmin && (
          <div className="flex gap-3">
            <button className="px-5 py-2.5 bg-white border border-slate-100/80 rounded-2xl text-[0.875rem] font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-sm">
              Dernier Trimestre
            </button>
            <button className="px-5 py-2.5 bg-blue-50/50 border border-blue-100/50 rounded-2xl text-[0.875rem] font-bold text-blue-700 transition-all shadow-[0_2px_10px_-4px_rgba(37,99,235,0.2)]">
              Cette Année
            </button>
          </div>
        )}
      </div>
      {isSuperAdmin ? renderSuperAdminReports() : renderClinicReports()}
    </div>
  );
};
