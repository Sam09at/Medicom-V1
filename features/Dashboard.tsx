import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { CabinetStats } from '../types';

interface DashboardProps {
  stats: CabinetStats;
}

const dataRevenue = [
  { name: 'Lun', value: 4000 },
  { name: 'Mar', value: 3000 },
  { name: 'Mer', value: 5500 },
  { name: 'Jeu', value: 4500 },
  { name: 'Ven', value: 6000 },
  { name: 'Sam', value: 2000 },
];

const dataPatients = [
  { name: 'Jan', value: 65 },
  { name: 'Fev', value: 59 },
  { name: 'Mar', value: 80 },
  { name: 'Avr', value: 81 },
  { name: 'Mai', value: 90 },
  { name: 'Juin', value: 105 },
];

const StatCard = ({ label, value, trend, trendValue, color }: { label: string, value: string | number, trend?: 'up' | 'down' | 'neutral', trendValue?: string, color?: string }) => (
  <div className="bg-white p-5 rounded-md border border-slate-200 hover:border-slate-300 transition-colors">
    <div className="text-slate-500 text-xs font-medium uppercase tracking-wide">{label}</div>
    <div className="mt-3 flex items-end justify-between">
      <span className="text-2xl font-semibold text-slate-900">{value}</span>
      {trend && (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          trend === 'up' ? 'bg-green-50 text-green-700' : 
          trend === 'down' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'
        }`}>
          {trendValue}
        </span>
      )}
    </div>
  </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ stats }) => {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="RDV Aujourd'hui" 
          value={stats.appointmentsToday} 
          trend="up" 
          trendValue="+12%" 
        />
        <StatCard 
          label="En attente" 
          value={stats.pendingConfirmations} 
          trend="neutral" 
          trendValue="Action requise" 
        />
        <StatCard 
          label="Recettes (MAD)" 
          value={stats.revenueToday.toLocaleString('fr-MA')} 
          trend="up" 
          trendValue="+5%" 
        />
        <StatCard 
          label="Traitements Actifs" 
          value={stats.activeTreatments} 
          trend="neutral" 
          trendValue="Stable" 
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-md border border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-medium text-slate-900">Recettes Hebdomadaires</h3>
            <button className="text-xs text-blue-600 font-medium hover:text-blue-700">Voir détails</button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataRevenue} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}} 
                  contentStyle={{borderRadius: '4px', border: '1px solid #e2e8f0', boxShadow: 'none'}} 
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Patient Growth */}
        <div className="bg-white p-6 rounded-md border border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-medium text-slate-900">Nouveaux Patients</h3>
            <button className="text-xs text-blue-600 font-medium hover:text-blue-700">Voir détails</button>
          </div>
          <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dataPatients}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip contentStyle={{borderRadius: '4px', border: '1px solid #e2e8f0', boxShadow: 'none'}} />
                <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={{r: 3, fill: '#fff', strokeWidth: 2}} activeDot={{r: 5}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity List */}
      <div className="bg-white rounded-md border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
          <h3 className="text-sm font-medium text-slate-900">Dernières Actions</h3>
          <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">Tout voir</button>
        </div>
        <div className="divide-y divide-slate-50">
           {[1, 2, 3].map((_, i) => (
             <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
               <div className="flex items-center gap-4">
                 <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-green-500' : i === 1 ? 'bg-blue-500' : 'bg-yellow-500'}`}></div>
                 <div>
                   <p className="text-sm font-medium text-slate-700">
                     {i === 0 ? 'Paiement reçu - Karim Benali' : i === 1 ? 'RDV confirmé - Fatima Zahra' : 'Nouveau dossier créé - Youssef'}
                   </p>
                   <p className="text-xs text-slate-400 mt-0.5">Il y a {i * 15 + 5} minutes par Assistante</p>
                 </div>
               </div>
               <span className="text-xs font-medium text-slate-400">14:3{i}</span>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};