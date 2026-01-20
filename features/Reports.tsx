import React, { useState } from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { IconDownload, IconFileText } from '../components/Icons';
import { User } from '../types';

interface ReportsProps {
  user: User;
}

// Mock Data (same as before)
const revenueData = [
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

const saasStats = [
  { month: 'Jan', activeClinics: 10, totalAppointments: 1200 },
  { month: 'Fev', activeClinics: 14, totalAppointments: 1800 },
  { month: 'Mar', activeClinics: 18, totalAppointments: 2400 },
  { month: 'Avr', activeClinics: 22, totalAppointments: 3100 },
  { month: 'Mai', activeClinics: 28, totalAppointments: 4500 },
];

export const Reports: React.FC<ReportsProps> = ({ user }) => {
  const [reportType, setReportType] = useState<'financial' | 'operational' | 'clinical'>('financial');
  const [dateRange, setDateRange] = useState('6months');

  const isSuperAdmin = user.role === 'SUPER_ADMIN';

  const handleExport = (format: 'csv' | 'pdf') => {
    alert(`Export du rapport ${reportType} en format ${format.toUpperCase()} lancé...`);
  };

  const renderClinicReports = () => (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-2 rounded-md border border-slate-200 shadow-sm">
        <div className="flex gap-1 p-1 bg-slate-100 rounded">
          <button 
            onClick={() => setReportType('financial')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${reportType === 'financial' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Revenus
          </button>
          <button 
             onClick={() => setReportType('operational')}
             className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${reportType === 'operational' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Opérations
          </button>
          <button 
             onClick={() => setReportType('clinical')}
             className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${reportType === 'clinical' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Clinique
          </button>
        </div>

        <div className="flex items-center gap-2">
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="block w-40 pl-3 pr-8 py-1.5 text-xs border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 rounded bg-white text-slate-700"
          >
            <option value="1month">Ce mois</option>
            <option value="3months">Dernier trimestre</option>
            <option value="6months">6 derniers mois</option>
            <option value="year">Cette année</option>
          </select>
          <button onClick={() => handleExport('csv')} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded border border-transparent hover:border-slate-200" title="Export CSV">
            <IconFileText className="w-4 h-4" />
          </button>
          <button onClick={() => handleExport('pdf')} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded border border-transparent hover:border-slate-200" title="Export PDF">
            <IconDownload className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {reportType === 'financial' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white p-5 rounded-md border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-800 mb-6">Évolution des Revenus</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '4px', border: '1px solid #e2e8f0', boxShadow: 'none'}} />
                  <Legend wrapperStyle={{fontSize: '12px', paddingTop: '10px'}}/>
                  <Bar dataKey="revenue" name="Réalisé" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="projected" name="Objectif" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white p-5 rounded-md border border-slate-200 flex flex-col justify-center space-y-8">
             <div>
                 <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">Revenu Total (6 mois)</div>
                 <div className="text-3xl font-semibold text-slate-900 mt-2">338k <span className="text-lg text-slate-400 font-normal">MAD</span></div>
                 <div className="text-xs text-green-600 mt-1 font-medium bg-green-50 inline-block px-1.5 py-0.5 rounded">↑ 12% vs période préc.</div>
             </div>
             <div>
                 <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">Panier Moyen / Patient</div>
                 <div className="text-2xl font-semibold text-slate-900 mt-2">650 <span className="text-sm text-slate-400 font-normal">MAD</span></div>
             </div>
             <div>
                 <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">Taux Recouvrement</div>
                 <div className="text-2xl font-semibold text-slate-900 mt-2">94%</div>
                 <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                    <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '94%' }}></div>
                 </div>
             </div>
          </div>
        </div>
      )}

      {reportType === 'operational' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-md border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-800 mb-6">Statut des Rendez-vous</h3>
            <div className="h-72 flex justify-center">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={appointmentStats}
                     cx="50%"
                     cy="50%"
                     innerRadius={70}
                     outerRadius={100}
                     paddingAngle={5}
                     dataKey="value"
                     stroke="none"
                   >
                     {appointmentStats.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.color} />
                     ))}
                   </Pie>
                   <Tooltip />
                   <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '12px'}}/>
                 </PieChart>
               </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white p-5 rounded-md border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-800 mb-6">Taux d'Absence (No-Show)</h3>
            <div className="h-72">
               <ResponsiveContainer width="100%" height="100%">
                <LineChart data={noShowTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} unit="%" />
                  <Tooltip contentStyle={{borderRadius: '4px', border: '1px solid #e2e8f0', boxShadow: 'none'}} />
                  <Line type="monotone" dataKey="rate" stroke="#ef4444" strokeWidth={2} dot={{r: 3}} activeDot={{r: 5}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {reportType === 'clinical' && (
        <div className="bg-white rounded-md border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-sm font-semibold text-slate-800">Performance des Traitements</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Type Traitement</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre Actes</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Durée Moy. (min)</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Chiffre d'Affaires</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {treatmentPerformance.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 text-right">{item.count}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 text-right">{item.avgDuration}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-semibold text-right">{item.revenue.toLocaleString()} MAD</td>
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
    <div className="space-y-6">
       <div className="bg-white p-6 rounded-md border border-slate-200">
          <div className="flex justify-between mb-6 items-center">
            <h3 className="text-sm font-semibold text-slate-800">Croissance Globale SaaS</h3>
            <div className="flex gap-2">
              <button onClick={() => handleExport('csv')} className="text-xs text-blue-600 font-medium hover:underline">Exporter CSV</button>
            </div>
          </div>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={saasStats} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip contentStyle={{borderRadius: '4px', border: '1px solid #e2e8f0', boxShadow: 'none'}} />
                <Legend wrapperStyle={{fontSize: '12px', paddingTop: '10px'}}/>
                <Bar yAxisId="left" dataKey="activeClinics" name="Cabinets Actifs" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="totalAppointments" name="Volume RDV Total" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
       </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
       <h2 className="text-xl font-semibold text-slate-800 mb-6">{isSuperAdmin ? 'Rapports Système SaaS' : 'Rapports & Analyses'}</h2>
       {isSuperAdmin ? renderSuperAdminReports() : renderClinicReports()}
    </div>
  );
};