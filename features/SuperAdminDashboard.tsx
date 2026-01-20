import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mrrData = [
  { month: 'Jan', value: 12000 },
  { month: 'Fev', value: 15500 },
  { month: 'Mar', value: 18000 },
  { month: 'Avr', value: 22000 },
  { month: 'Mai', value: 28500 },
  { month: 'Juin', value: 35000 },
];

const StatCard = ({ label, value, subtext, type = 'default' }: { label: string, value: string | number, subtext: string, type?: 'primary' | 'default' }) => (
  <div className={`p-6 rounded-md border shadow-sm ${type === 'primary' ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white border-transparent' : 'bg-white border-slate-200'}`}>
    <div className={`text-xs font-medium uppercase tracking-wide ${type === 'primary' ? 'text-indigo-100' : 'text-slate-500'}`}>{label}</div>
    <div className="mt-3 text-3xl font-semibold">{value}</div>
    <div className={`mt-1 text-sm ${type === 'primary' ? 'text-indigo-200' : 'text-slate-500'}`}>{subtext}</div>
  </div>
);

export const SuperAdminDashboard: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Vue d'ensemble SaaS</h2>
          <p className="text-slate-500 mt-1 text-sm">Métriques de performance globale Medicom</p>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-green-50 text-green-700 border border-green-100 rounded-full text-xs font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
            Système Sain
          </span>
        </div>
      </div>

      {/* High Level Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="MRR (Revenu Récurrent)" value="35 000 MAD" subtext="+22% ce mois" type="primary" />
        <StatCard label="Cabinets Actifs" value="24" subtext="+3 nouveaux" />
        <StatCard label="Taux de Churn" value="1.2%" subtext="↑ 0.1% vs m-1" />
        <StatCard label="Tickets Ouverts" value="5" subtext="2 urgents" />
      </div>

      {/* Main Growth Chart */}
      <div className="bg-white p-6 rounded-md border border-slate-200 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800 mb-6">Croissance MRR</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mrrData}>
              <defs>
                <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
              <Tooltip contentStyle={{borderRadius: '4px', border: '1px solid #e2e8f0', boxShadow: 'none'}} />
              <Area type="monotone" dataKey="value" stroke="#4F46E5" strokeWidth={2} fillOpacity={1} fill="url(#colorMrr)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Client List */}
      <div className="bg-white rounded-md border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white">
          <h3 className="text-sm font-semibold text-slate-800">Cabinets Récents</h3>
          <button className="px-3 py-1.5 border border-slate-200 rounded text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">Exporter CSV</button>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50/50">
            <tr>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cabinet</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Plan</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Statut</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Prochaine Facture</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {[
              { name: 'Cabinet Dentaire Amina', plan: 'Premium', status: 'Actif', bill: '25 Jan 2026' },
              { name: 'Centre Cardio Rabat', plan: 'Pro', status: 'Actif', bill: '01 Fev 2026' },
              { name: 'Dr. Tazi Pédiatrie', plan: 'Starter', status: 'Retard', bill: '15 Jan 2026' },
              { name: 'Clinique du Nord', plan: 'Premium', status: 'Actif', bill: '28 Jan 2026' },
            ].map((client, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-slate-900">{client.name}</td>
                <td className="px-6 py-4 text-sm text-slate-500">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${client.plan === 'Premium' ? 'bg-purple-50 text-purple-700 border border-purple-100' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                    {client.plan}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                   <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${client.status === 'Actif' ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
                     <span className={`w-1.5 h-1.5 rounded-full ${client.status === 'Actif' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                     {client.status}
                   </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">{client.bill}</td>
                <td className="px-6 py-4 text-sm text-blue-600 hover:text-blue-800 cursor-pointer font-medium">Gérer</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};