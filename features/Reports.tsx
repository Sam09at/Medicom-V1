
import React, { useState } from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { IconDownload, IconFileText, IconUsers, IconActivity, IconLayers } from '../components/Icons';
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
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           {/* Retention Cohort Analysis */}
           <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
               <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                   <IconUsers className="w-4 h-4 text-slate-400" /> Analyse de Rétention (Cohortes)
               </h3>
               <div className="overflow-x-auto">
                   <table className="w-full text-xs text-center border-collapse">
                       <thead>
                           <tr>
                               <th className="p-2 border-b border-slate-200 text-left text-slate-500 font-medium">Cohorte</th>
                               <th className="p-2 border-b border-slate-200 text-slate-500 font-medium">Taille</th>
                               <th className="p-2 border-b border-slate-200 text-slate-500 font-medium">M1</th>
                               <th className="p-2 border-b border-slate-200 text-slate-500 font-medium">M2</th>
                               <th className="p-2 border-b border-slate-200 text-slate-500 font-medium">M3</th>
                               <th className="p-2 border-b border-slate-200 text-slate-500 font-medium">M6</th>
                               <th className="p-2 border-b border-slate-200 text-slate-500 font-medium">M12</th>
                           </tr>
                       </thead>
                       <tbody>
                           {cohorts.map((c, i) => (
                               <tr key={i}>
                                   <td className="p-2 border-b border-slate-100 text-left font-medium text-slate-900">{c.cohort}</td>
                                   <td className="p-2 border-b border-slate-100 text-slate-500">{c.size}</td>
                                   <td className="p-2 border-b border-slate-100 bg-indigo-50 text-indigo-700">{c.m1}%</td>
                                   <td className="p-2 border-b border-slate-100 bg-indigo-50 text-indigo-700" style={{opacity: typeof c.m2 === 'number' ? c.m2/100 : 0.5}}>{c.m2}%</td>
                                   <td className="p-2 border-b border-slate-100 bg-indigo-50 text-indigo-700" style={{opacity: typeof c.m3 === 'number' ? c.m3/100 : 0.5}}>{c.m3}%</td>
                                   <td className="p-2 border-b border-slate-100 bg-indigo-50 text-indigo-700" style={{opacity: typeof c.m6 === 'number' ? c.m6/100 : 0.1}}>{c.m6}%</td>
                                   <td className="p-2 border-b border-slate-100 bg-indigo-50 text-indigo-700" style={{opacity: typeof c.m12 === 'number' ? c.m12/100 : 0.1}}>{c.m12}%</td>
                               </tr>
                           ))}
                       </tbody>
                   </table>
               </div>
           </div>

           {/* Feature Adoption */}
           <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
               <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                   <IconLayers className="w-4 h-4 text-slate-400" /> Adoption des Fonctionnalités
               </h3>
               <div className="h-64">
                   <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={featureAdoption} layout="vertical" margin={{ left: 20 }}>
                           <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                           <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} unit="%" />
                           <YAxis type="category" dataKey="feature" axisLine={false} tickLine={false} tick={{fill: '#1e293b', fontSize: 12, fontWeight: 500}} width={80} />
                           <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '4px', border: '1px solid #e2e8f0'}} />
                           <Bar dataKey="usedBy" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                       </BarChart>
                   </ResponsiveContainer>
               </div>
               <div className="mt-4 text-xs text-slate-500 text-center">
                   % des cabinets actifs utilisant la fonctionnalité au moins 1 fois / semaine.
               </div>
           </div>
       </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
       <div className="flex justify-between items-center mb-6">
           <h2 className="text-xl font-bold text-slate-900">{isSuperAdmin ? 'Intelligence SaaS' : 'Rapports & Analyses'}</h2>
           {isSuperAdmin && (
               <div className="flex gap-2">
                   <button className="px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">Dernier Trimestre</button>
                   <button className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded text-xs font-medium text-indigo-700 transition-colors">Cette Année</button>
               </div>
           )}
       </div>
       {isSuperAdmin ? renderSuperAdminReports() : renderClinicReports()}
    </div>
  );
};
