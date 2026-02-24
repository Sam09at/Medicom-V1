import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
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
  getDailyBookingStats,
  getChurnRiskTenants,
  getNewSignups,
  getUrgentTicketsCount,
  MRRData,
  ActivityFeedItem,
} from '../lib/api/saas/analytics';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

const KPICard = ({ label, value, trend, icon: Icon, bgClass, textClass }: any) => (
  <div className="card p-5 h-full flex flex-col justify-between group">
    <div className="flex items-start justify-between mb-4">
      <div className="w-8 h-8 rounded-[6px] bg-slate-50 border border-slate-100 flex items-center justify-center text-gray-500 group-hover:bg-gray-100 transition-colors">
        <Icon className="w-4 h-4" />
      </div>
      {trend !== undefined && (
        <div
          className={`badge ${trend >= 0 ? 'badge-green' : 'badge-red'} gap-1 font-semibold`}
        >
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
      <div className="text-[13px] font-medium text-gray-500 mb-1">
        {label}
      </div>
      <div className="text-2xl font-semibold text-gray-900 tracking-tight">
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
      description: 'Dr. Ahmed: Nouveau RDV',
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'm3',
      type: 'invoice.paid',
      description: 'Facture payée: Cabinet Casablanca (1500 MAD)',
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
    return <div className="p-8 text-center text-gray-500">Chargement du tableau de bord...</div>;

  return (
    <div className="space-y-8 font-sans animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">
            Command Center
          </h2>
          <p className="text-[13px] text-gray-500 mt-1">
            Vue temps réel de la performance SaaS
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="badge badge-gray gap-2 px-3 py-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            Système Opérationnel
          </span>
          <span className="text-[11px] text-gray-400 font-mono">v0.15.0</span>
        </div>
      </div>

      {/* Quick Actions Row */}
      <div className="flex gap-4">
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
          className="btn-secondary flex-1 py-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
        >
          <IconAlertTriangle className="w-4 h-4" />
          Tickets urgents
        </button>
      </div>

      {/* KPI Grid (5 cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <KPICard
          label="Tenants Actifs"
          value={activeTenants}
          trend={5}
          icon={IconUsers}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />
        <KPICard
          label="MRR Global"
          value={`${mrrData?.currentMRR.toLocaleString('fr-FR')}`}
          trend={mrrData?.growth || 0}
          icon={IconDollarSign}
          colorClass="text-indigo-600"
          bgClass="bg-indigo-50"
        />
        <KPICard
          label="Nouveaux (7j)"
          value={newSignups}
          trend={12}
          icon={IconTrendingUp}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <KPICard
          label="Risque Churn"
          value={riskTenants.length}
          trend={-2}
          icon={IconTrendingDown}
          colorClass="text-orange-500"
          bgClass="bg-orange-50"
        />
        <KPICard
          label="Tickets Urgents"
          value={urgentTickets}
          trend={0}
          icon={IconMessageSquare}
          colorClass="text-rose-600"
          bgClass="bg-rose-50"
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart: MRR Growth (Line Chart based on history) */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-[14px] font-semibold text-gray-900">
                Croissance MRR (12 Mois)
              </h3>
              <p className="text-[13px] text-gray-500 mt-1">
                Évolution du revenue mensuel récurrent
              </p>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={mrrData?.history || []}
                margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 12 }}
                  width={80}
                  tickFormatter={(value) => `${value.toLocaleString('fr-FR')}`}
                />
                <Tooltip
                  cursor={{ stroke: '#6366F1', strokeWidth: 1 }}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  }}
                  formatter={(value: any) => [`${value.toLocaleString('fr-FR')} MAD`, 'MRR']}
                />
                <Line
                  type="monotone"
                  dataKey="mrr"
                  stroke="#6366F1"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#6366F1', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Activity Feed */}
        <div className="card p-6 flex flex-col h-[410px]">
          <h3 className="text-[14px] font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <IconActivity className="w-4 h-4 text-gray-400" /> Flux d'Activité
          </h3>
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-hide">
            {activityFeed.length === 0 ? (
              <div className="text-[0.875rem] text-gray-500 text-center mt-10">
                Aucune activité récente.
              </div>
            ) : (
              activityFeed.map((item) => (
                <div key={item.id} className="flex gap-3 text-sm group">
                  <div className="mt-1 shrink-0">
                    <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                      {item.type.includes('tenant') ? (
                        <IconUsers className="w-4 h-4 text-blue-500" />
                      ) : item.type.includes('invoice') ? (
                        <IconDollarSign className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <IconActivity className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 pb-3 border-b border-gray-100">
                    <div className="text-[0.875rem] text-gray-800 font-medium leading-snug">
                      {item.description}
                    </div>
                    <div className="text-[0.75rem] text-gray-400 mt-1 font-medium">
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
