import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  IconTrendingDown,
  IconTrendingUp,
  IconAlertTriangle,
  IconActivity,
  IconDollarSign,
  IconUsers,
  IconPlus,
  IconMessageSquare,
} from '../components/Icons';
import {
  getPlatformMRR,
  getActiveTenantsCount,
  getChurnRiskTenants,
  getNewSignups,
  getUrgentTicketsCount,
  MRRData,
  ActivityFeedItem,
} from '../lib/api/saas/analytics';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

const KPICard = ({ label, value, trend, icon: Icon }: any) => (
  <div className="card p-5 h-full flex flex-col justify-between group">
    <div className="flex items-start justify-between mb-4">
      <div className="w-8 h-8 rounded-[6px] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-slate-100 transition-colors">
        <Icon className="w-4 h-4" />
      </div>
      {trend !== undefined && (
        <div className={`badge ${trend >= 0 ? 'badge-green' : 'badge-red'} gap-1 font-semibold`}>
          {trend >= 0 ? (
            <IconTrendingUp className="w-3 h-3" />
          ) : (
            <IconTrendingDown className="w-3 h-3" />
          )}
          <span>{trend >= 0 ? `+${Math.abs(trend)}%` : `-${Math.abs(trend)}%`}</span>
        </div>
      )}
    </div>
    <div>
      <div className="text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-widest">
        {label}
      </div>
      <div className="text-[26px] font-semibold text-slate-900 tracking-tight leading-none">
        {value}
      </div>
    </div>
  </div>
);

export const SuperAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [mrrData, setMrrData] = useState<MRRData | null>(null);
  const [activeTenants, setActiveTenants] = useState(0);
  const [newSignups, setNewSignups] = useState(0);
  const [riskTenants, setRiskTenants] = useState<any[]>([]);
  const [urgentTickets, setUrgentTickets] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([
    {
      id: 'm1',
      type: 'tenant.created',
      description: 'Nouveau cabinet inscrit: Cabinet Rabat',
      created_at: new Date().toISOString(),
    },
    {
      id: 'm2',
      type: 'appointment.created',
      description: 'Dr. Ahmed: Nouveau RDV confirmé',
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'm3',
      type: 'invoice.paid',
      description: 'Facture payée: Cabinet Casablanca (1 500 MAD)',
      created_at: new Date(Date.now() - 7200000).toISOString(),
    },
  ]);

  useEffect(() => {
    const loadCounts = async () => {
      try {
        const [mrr, tenants, signups, risks, tickets] = await Promise.all([
          getPlatformMRR(),
          getActiveTenantsCount(),
          getNewSignups(7),
          getChurnRiskTenants(),
          getUrgentTicketsCount(),
        ]);
        setMrrData(mrr);
        setActiveTenants(tenants);
        setNewSignups(signups);
        setRiskTenants(risks);
        setUrgentTickets(tickets);
      } catch (error) {
        console.error('Failed to load admin stats', error);
      } finally {
        setLoading(false);
      }
    };
    loadCounts();

    if (supabase) {
      const subscription = supabase
        .channel('admin-activity-feed')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'audit_logs' },
          (payload) => {
            const newEvent = payload.new;
            setActivityFeed((prev) =>
              [
                {
                  id: newEvent.id,
                  type: newEvent.action,
                  description: `Activité détectée: ${newEvent.action}`,
                  created_at: newEvent.created_at,
                },
                ...prev,
              ].slice(0, 10)
            );
          }
        )
        .subscribe();

      return () => {
        if (supabase) supabase.removeChannel(subscription);
      };
    }
  }, []);

  if (loading)
    return (
      <div className="p-8 text-center text-slate-500 text-[13px]">
        Chargement du tableau de bord...
      </div>
    );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold text-slate-900 tracking-tight">
            Command Center
          </h1>
          <p className="text-[13px] text-slate-500 mt-0.5">
            Vue temps réel de la performance SaaS
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="badge badge-gray gap-2 px-3 py-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            Système Opérationnel
          </span>
          <span className="text-[11px] text-slate-400 font-mono">v0.15.0</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => navigate('/admin/cabinets/new')}
          className="btn-primary flex-1 py-2"
        >
          <IconPlus className="w-4 h-4" />
          Nouveau cabinet
        </button>
        <button
          onClick={() => navigate('/admin/crm')}
          className="btn-secondary flex-1 py-2"
        >
          <IconUsers className="w-4 h-4" />
          Voir leads
        </button>
        <button
          onClick={() => navigate('/admin/support?priority=high')}
          className="btn-secondary flex-1 py-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 hover:border-rose-100"
        >
          <IconAlertTriangle className="w-4 h-4" />
          Tickets urgents
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          label="Tenants Actifs"
          value={activeTenants}
          trend={5}
          icon={IconUsers}
        />
        <KPICard
          label="MRR Global"
          value={`${mrrData?.currentMRR.toLocaleString('fr-FR')} MAD`}
          trend={mrrData?.growth || 0}
          icon={IconDollarSign}
        />
        <KPICard
          label="Nouveaux (7j)"
          value={newSignups}
          trend={12}
          icon={IconTrendingUp}
        />
        <KPICard
          label="Risque Churn"
          value={riskTenants.length}
          trend={-2}
          icon={IconTrendingDown}
        />
        <KPICard
          label="Tickets Urgents"
          value={urgentTickets}
          trend={0}
          icon={IconMessageSquare}
        />
      </div>

      {/* Charts + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MRR Line Chart */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-[14px] font-semibold text-slate-900 tracking-tight">
                Croissance MRR — 12 mois
              </h3>
              <p className="text-[12px] text-slate-500 mt-0.5">
                Évolution du revenu mensuel récurrent
              </p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={mrrData?.history || []}
                margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 11 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 11 }}
                  width={80}
                  tickFormatter={(value) => `${value.toLocaleString('fr-FR')}`}
                />
                <Tooltip
                  cursor={{ stroke: '#136cfb', strokeWidth: 1, strokeDasharray: '4 2' }}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                    fontSize: '12px',
                  }}
                  formatter={(value: any) => [`${value.toLocaleString('fr-FR')} MAD`, 'MRR']}
                />
                <Line
                  type="monotone"
                  dataKey="mrr"
                  stroke="#136cfb"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#136cfb', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 5, strokeWidth: 0, fill: '#136cfb' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Activity Feed */}
        <div className="card p-6 flex flex-col" style={{ maxHeight: '420px' }}>
          <h3 className="text-[13px] font-semibold text-slate-900 mb-5 flex items-center gap-2 tracking-tight">
            <IconActivity className="w-4 h-4 text-slate-400" />
            Flux d'Activité
            <span className="ml-auto w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          </h3>
          <div className="flex-1 overflow-y-auto space-y-0 scrollbar-hide">
            {activityFeed.length === 0 ? (
              <div className="text-[13px] text-slate-400 text-center mt-10">
                Aucune activité récente.
              </div>
            ) : (
              activityFeed.map((item) => (
                <div key={item.id} className="flex gap-3 py-3 border-b border-slate-100 last:border-0 group">
                  <div className="shrink-0 mt-0.5">
                    <div className="w-7 h-7 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-blue-50/60 transition-colors">
                      {item.type.includes('tenant') ? (
                        <IconUsers className="w-3.5 h-3.5 text-[#136cfb]" />
                      ) : item.type.includes('invoice') ? (
                        <IconDollarSign className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <IconActivity className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-slate-800 font-medium leading-snug truncate">
                      {item.description}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
                      {new Date(item.created_at).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
