
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Legend, ComposedChart, Area
} from 'recharts';
import { IconTrendingDown, IconTrendingUp, IconAlertTriangle, IconCheckCircle, IconClock, IconActivity, IconDollarSign, IconUsers } from '../components/Icons';

// Mock Data for MRR Movements
const mrrMovementsData = [
  { month: 'Jan', new: 5000, expansion: 2000, churn: -1000, net: 6000 },
  { month: 'Fev', new: 4500, expansion: 2500, churn: -500, net: 6500 },
  { month: 'Mar', new: 6000, expansion: 1500, churn: -2000, net: 5500 },
  { month: 'Avr', new: 7000, expansion: 3000, churn: -800, net: 9200 },
  { month: 'Mai', new: 5500, expansion: 4000, churn: -1200, net: 8300 },
  { month: 'Juin', new: 8000, expansion: 5000, churn: -1500, net: 11500 },
];

const riskTenants = [
  { name: 'Clinique du Nord', mrr: 2500, health: 45, issue: 'Usage en baisse (-20%)', contact: 'Dr. Berrada' },
  { name: 'Centre Dentaire Sud', mrr: 1800, health: 30, issue: '3 Factures impayées', contact: 'Mme. Tazi' },
  { name: 'Ortho Plus', mrr: 1200, health: 55, issue: 'Support Ticket Spike', contact: 'Dr. Alami' },
];

const liveActivity = [
  { id: 1, type: 'success', text: 'Nouveau tenant "Cabinet Dr. Idrissi" activé (Pro)', time: '2 min ago' },
  { id: 2, type: 'warning', text: 'Paiement échoué pour "Sourire Marrakech"', time: '15 min ago' },
  { id: 3, type: 'info', text: 'Upgrade plan: "Clinique Atlas" (Starter -> Premium)', time: '1h ago' },
  { id: 4, type: 'error', text: 'Alerte Latence API > 500ms (Region: Casa)', time: '2h ago' },
];

const KPICard = ({ label, value, trend, subtext, icon: Icon, color }: any) => (
  <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden group">
    <div className={`absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
        <Icon className="w-16 h-16" />
    </div>
    <div className="relative z-10">
        <div className="text-slate-500 text-xs font-bold uppercase tracking-wide flex items-center gap-2">
            {label}
        </div>
        <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{value}</span>
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded flex items-center ${trend >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {trend >= 0 ? <IconTrendingUp className="w-3 h-3 mr-1" /> : <IconTrendingDown className="w-3 h-3 mr-1" />}
                {Math.abs(trend)}%
            </span>
        </div>
        <div className="mt-1 text-xs text-slate-400">{subtext}</div>
    </div>
  </div>
);

export const SuperAdminDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Command Center</h2>
          <p className="text-slate-500 text-sm mt-1">Vue temps réel de la performance SaaS.</p>
        </div>
        <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-600 shadow-sm">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Système Opérationnel
            </span>
            <span className="text-xs text-slate-400 font-mono">v2.4.0-prod</span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
            label="MRR Global" 
            value="35 200 MAD" 
            trend={12.5} 
            subtext="vs 31 300 MAD m-1" 
            icon={IconDollarSign}
            color="text-indigo-600"
        />
        <KPICard 
            label="Tenants Actifs" 
            value="42" 
            trend={5} 
            subtext="+2 cette semaine" 
            icon={IconUsers}
            color="text-blue-600"
        />
        <KPICard 
            label="NRR (Rétention)" 
            value="108%" 
            trend={-1.2} 
            subtext="Net Revenue Retention" 
            icon={IconActivity}
            color="text-purple-600"
        />
        <KPICard 
            label="LTV / CAC" 
            value="4.2x" 
            trend={0.5} 
            subtext="Efficience Capital" 
            icon={IconTrendingUp}
            color="text-green-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart: MRR Movements */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-base font-bold text-slate-900">Mouvements MRR</h3>
                    <p className="text-xs text-slate-500">Impact des nouveaux clients, expansions et churn.</p>
                </div>
                <div className="flex gap-2">
                    <div className="flex items-center gap-1 text-xs text-slate-600"><span className="w-3 h-3 bg-indigo-500 rounded-sm"></span> New</div>
                    <div className="flex items-center gap-1 text-xs text-slate-600"><span className="w-3 h-3 bg-green-500 rounded-sm"></span> Expansion</div>
                    <div className="flex items-center gap-1 text-xs text-slate-600"><span className="w-3 h-3 bg-red-500 rounded-sm"></span> Churn</div>
                </div>
            </div>
            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mrrMovementsData} stackOffset="sign">
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                        <Tooltip 
                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                            cursor={{fill: '#f8fafc'}}
                        />
                        <Bar dataKey="new" stackId="stack" fill="#6366f1" radius={[0, 0, 4, 4]} />
                        <Bar dataKey="expansion" stackId="stack" fill="#22c55e" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="churn" stackId="stack" fill="#ef4444" radius={[0, 0, 4, 4]} />
                        
                        {/* Net Line Overlay */}
                        <Line type="monotone" dataKey="net" stroke="#0f172a" strokeWidth={2} dot={{r: 4, fill: '#0f172a'}} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Live Activity Feed */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <IconActivity className="w-4 h-4 text-slate-400" /> Live Activity
            </h3>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {liveActivity.map((activity) => (
                    <div key={activity.id} className="flex gap-3 items-start group">
                        <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                            activity.type === 'success' ? 'bg-green-500' : 
                            activity.type === 'warning' ? 'bg-orange-500' :
                            activity.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                        }`}></div>
                        <div>
                            <p className="text-xs text-slate-700 font-medium leading-snug group-hover:text-indigo-600 transition-colors">{activity.text}</p>
                            <p className="text-[10px] text-slate-400 mt-1">{activity.time}</p>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100">
                <button className="w-full py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded transition-colors">
                    Voir tout l'historique
                </button>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Risk Radar */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <IconAlertTriangle className="w-5 h-5 text-red-500" /> Churn Risk Radar
                  </h3>
                  <span className="text-xs font-medium bg-red-50 text-red-700 px-2 py-1 rounded-full border border-red-100">3 Critiques</span>
              </div>
              
              <div className="overflow-hidden rounded-md border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-100">
                      <thead className="bg-slate-50">
                          <tr>
                              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Tenant</th>
                              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">MRR Impact</th>
                              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Santé</th>
                              <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500">Action</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                          {riskTenants.map((tenant, i) => (
                              <tr key={i} className="hover:bg-slate-50">
                                  <td className="px-4 py-3">
                                      <div className="text-xs font-bold text-slate-900">{tenant.name}</div>
                                      <div className="text-[10px] text-slate-500">{tenant.issue}</div>
                                  </td>
                                  <td className="px-4 py-3 text-xs font-medium text-slate-900">{tenant.mrr} MAD</td>
                                  <td className="px-4 py-3">
                                      <div className="w-16 bg-slate-200 rounded-full h-1.5 mb-1">
                                          <div className={`h-1.5 rounded-full ${tenant.health < 40 ? 'bg-red-500' : 'bg-orange-500'}`} style={{width: `${tenant.health}%`}}></div>
                                      </div>
                                      <span className="text-[10px] text-slate-500">{tenant.health}/100</span>
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                      <button className="text-xs bg-white border border-slate-200 text-slate-600 px-2 py-1 rounded hover:border-red-300 hover:text-red-600 transition-colors">
                                          Contacter
                                      </button>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>

          {/* Regional Distribution (Simulated Map) */}
          <div className="bg-slate-900 p-6 rounded-lg shadow-sm text-white flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full filter blur-[80px] opacity-20 -translate-y-1/2 translate-x-1/2"></div>
              
              <h3 className="text-base font-bold mb-1 relative z-10">Répartition Géographique</h3>
              <p className="text-xs text-slate-400 mb-6 relative z-10">Concentration des cabinets actifs par région.</p>

              <div className="space-y-4 relative z-10">
                  {[
                      { region: 'Casablanca-Settat', count: 18, pct: 45 },
                      { region: 'Rabat-Salé-Kénitra', count: 12, pct: 30 },
                      { region: 'Marrakech-Safi', count: 8, pct: 20 },
                      { region: 'Tanger-Tétouan', count: 4, pct: 10 },
                  ].map((r, i) => (
                      <div key={i}>
                          <div className="flex justify-between text-xs mb-1">
                              <span className="font-medium text-slate-200">{r.region}</span>
                              <span className="text-slate-400">{r.count} cabinets</span>
                          </div>
                          <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
                              <div className="bg-indigo-500 h-full rounded-full" style={{width: `${r.pct}%`}}></div>
                          </div>
                      </div>
                  ))}
              </div>

              <div className="mt-auto pt-6 flex justify-between items-center text-xs text-slate-500 relative z-10">
                  <span>Data center principal: Casablanca</span>
                  <button className="text-indigo-400 hover:text-indigo-300">Voir carte détaillée &rarr;</button>
              </div>
          </div>
      </div>
    </div>
  );
};
