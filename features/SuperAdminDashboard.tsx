import React, { useEffect, useState } from 'react';
import {
  AreaChart, Area,
  BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
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
  IconCheck,
  IconArrowRight,
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

/* ─── Mock Data ─── */
const MRR_HISTORY = [
  { month: 'Jan', mrr: 38000, prev: 34000 },
  { month: 'Fév', mrr: 42000, prev: 36000 },
  { month: 'Mar', mrr: 39000, prev: 38000 },
  { month: 'Avr', mrr: 55000, prev: 42000 },
  { month: 'Mai', mrr: 62000, prev: 48000 },
  { month: 'Juin', mrr: 58000, prev: 55000 },
  { month: 'Juil', mrr: 67000, prev: 60000 },
  { month: 'Août', mrr: 71000, prev: 64000 },
  { month: 'Sep', mrr: 65000, prev: 66000 },
  { month: 'Oct', mrr: 74000, prev: 68000 },
  { month: 'Nov', mrr: 79000, prev: 71000 },
  { month: 'Déc', mrr: 82000, prev: 75000 },
];

const SIGNUP_HISTORY = [
  { month: 'Jan', count: 3 },
  { month: 'Fév', count: 5 },
  { month: 'Mar', count: 4 },
  { month: 'Avr', count: 9 },
  { month: 'Mai', count: 11 },
  { month: 'Juin', count: 8 },
  { month: 'Juil', count: 13 },
  { month: 'Août', count: 15 },
  { month: 'Sep', count: 10 },
  { month: 'Oct', count: 17 },
  { month: 'Nov', count: 19 },
  { month: 'Déc', count: 22 },
];

const MOCK_FEED: ActivityFeedItem[] = [
  { id: 'f1', type: 'tenant.created', description: 'Nouveau cabinet inscrit: Cabinet Rabat Centre', created_at: new Date(Date.now() - 8 * 60000).toISOString() },
  { id: 'f2', type: 'invoice.paid', description: 'Paiement reçu: Cabinet Casablanca — 1 500 MAD', created_at: new Date(Date.now() - 25 * 60000).toISOString() },
  { id: 'f3', type: 'appointment.created', description: 'Dr. Ahmed Benali: 12 nouveaux RDV confirmés', created_at: new Date(Date.now() - 48 * 60000).toISOString() },
  { id: 'f4', type: 'tenant.created', description: 'Cabinet El Jadida — Onboarding démarré', created_at: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: 'f5', type: 'invoice.paid', description: 'Paiement reçu: Cabinet Marrakech — 2 200 MAD', created_at: new Date(Date.now() - 4 * 3600000).toISOString() },
  { id: 'f6', type: 'appointment.created', description: 'Cabinet Agadir — Nouveau module facturé', created_at: new Date(Date.now() - 6 * 3600000).toISOString() },
];

const TOP_CABINETS = [
  { name: 'Cabinet Casablanca Centre', mrr: 3200, growth: 12, plan: 'Premium', status: 'healthy', papcpm: 42 },
  { name: 'Clinique Dentaire Rabat', mrr: 2800, growth: 8, plan: 'Pro', status: 'healthy', papcpm: 28 },
  { name: 'Cabinet Dr. Amrani Fès', mrr: 2400, growth: -3, plan: 'Pro', status: 'risk', papcpm: 12 },
  { name: 'Cabinet El Jadida', mrr: 1900, growth: 22, plan: 'Starter', status: 'healthy', papcpm: 5 },
  { name: 'Clinique Marrakech Guéliz', mrr: 1750, growth: 5, plan: 'Pro', status: 'healthy', papcpm: 19 },
];

const PAPCPM_HISTORY = [
  { month: 'Jan', papcpm: 0,  bookings: 0 },
  { month: 'Fév', papcpm: 1,  bookings: 3 },
  { month: 'Mar', papcpm: 3,  bookings: 14 },
  { month: 'Avr', papcpm: 7,  bookings: 31 },
  { month: 'Mai', papcpm: 12, bookings: 58 },
  { month: 'Juin', papcpm: 18, bookings: 87 },
  { month: 'Juil', papcpm: 22, bookings: 106 },
  { month: 'Août', papcpm: 19, bookings: 91 },
  { month: 'Sep', papcpm: 25, bookings: 122 },
  { month: 'Oct', papcpm: 31, bookings: 151 },
  { month: 'Nov', papcpm: 28, bookings: 138 },
  { month: 'Déc', papcpm: 35, bookings: 172 },
];

/* ─── Custom Tooltip ─── */
const MRRTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const diff = payload[0]?.value - (payload[1]?.value || 0);
  const pct = payload[1]?.value ? Math.round((diff / payload[1].value) * 100) : 0;
  return (
    <div className="bg-white border border-slate-100 rounded-[10px] px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
      <p className="text-[12px] font-bold text-slate-900 mb-1">{label}</p>
      <div className="flex items-center gap-2 mb-0.5">
        <span className="text-[11px] text-slate-500">MRR:</span>
        <span className="text-[13px] font-semibold text-slate-900">{payload[0]?.value?.toLocaleString('fr-FR')} MAD</span>
      </div>
      <div className={`inline-flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded ${pct >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
        {pct >= 0 ? '↑' : '↓'} {Math.abs(pct)}% vs N-1
      </div>
    </div>
  );
};

/* ─── Gauge Chart (SVG arc) ─── */
const GaugeChart = ({ value, target, label }: { value: number; target: number; label: string }) => {
  const pct = Math.min(value / target, 1);
  const radius = 70;
  const strokeWidth = 10;
  const cx = 90, cy = 90;
  const startAngle = -210; // degrees
  const sweepAngle = 240;  // total arc degrees
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const polarToCartesian = (angle: number) => ({
    x: cx + radius * Math.cos(toRad(angle)),
    y: cy + radius * Math.sin(toRad(angle)),
  });
  const describeArc = (startDeg: number, endDeg: number) => {
    const s = polarToCartesian(startDeg);
    const e = polarToCartesian(endDeg);
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${large} 1 ${e.x} ${e.y}`;
  };
  const endAngle = startAngle + sweepAngle * pct;
  const dotPos = polarToCartesian(endAngle);

  return (
    <div className="flex flex-col items-center">
      <svg width="180" height="130" viewBox="0 0 180 130">
        {/* Track */}
        <path d={describeArc(startAngle, startAngle + sweepAngle)} fill="none" stroke="#F1F5F9" strokeWidth={strokeWidth} strokeLinecap="round" />
        {/* Fill */}
        {pct > 0 && (
          <path d={describeArc(startAngle, endAngle)} fill="none" stroke="#10b981" strokeWidth={strokeWidth} strokeLinecap="round"
            style={{ filter: 'drop-shadow(0 0 4px rgba(16,185,129,0.3))' }} />
        )}
        {/* Dot */}
        {pct > 0 && <circle cx={dotPos.x} cy={dotPos.y} r="6" fill="white" stroke="#10b981" strokeWidth="3" />}
      </svg>
      <div className="text-center -mt-10">
        <div className="text-[26px] font-semibold text-slate-900 tracking-tight leading-none">
          {value.toLocaleString('fr-FR')}
        </div>
        <div className="text-[12px] text-slate-400 mt-1">de {target.toLocaleString('fr-FR')} MAD</div>
      </div>
    </div>
  );
};

/* ─── KPI Card ─── */
const KPICard = ({ label, value, trend, sub, icon: Icon }: any) => (
  <div className="bg-white border border-slate-100 rounded-[12px] p-5 flex flex-col justify-between gap-3 group hover:border-slate-200 transition-colors">
    <div className="flex items-start justify-between">
      <div className="w-9 h-9 rounded-[10px] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500">
        <Icon className="w-4 h-4" />
      </div>
      {trend !== undefined && (
        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${trend >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
          {trend >= 0 ? <IconTrendingUp className="w-3 h-3" /> : <IconTrendingDown className="w-3 h-3" />}
          {trend >= 0 ? `+${Math.abs(trend)}%` : `-${Math.abs(trend)}%`}
        </span>
      )}
    </div>
    <div>
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-[26px] font-semibold text-slate-900 tracking-tight leading-none">{value}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-1">{sub}</p>}
    </div>
  </div>
);

/* ─── Main ─── */
export const SuperAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [mrrData, setMrrData] = useState<MRRData | null>(null);
  const [activeTenants, setActiveTenants] = useState(47);
  const [newSignups, setNewSignups] = useState(9);
  const [riskTenants, setRiskTenants] = useState<any[]>([]);
  const [urgentTickets, setUrgentTickets] = useState(3);
  const [loading, setLoading] = useState(false);
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>(MOCK_FEED);
  const [mrrGoal] = useState(100000);
  const [currentMRR] = useState(82000);

  useEffect(() => {
    // Load real data with graceful fallback to mock defaults
    const loadData = async () => {
      try {
        const mrr = await getPlatformMRR();
        setMrrData(mrr);
      } catch (_) { /* keep default mock values */ }
      try {
        const tenants = await getActiveTenantsCount();
        if (tenants) setActiveTenants(tenants);
      } catch (_) { }
      try {
        const signups = await getNewSignups(7);
        if (signups) setNewSignups(signups);
      } catch (_) { }
      try {
        const risks = await getChurnRiskTenants();
        if (risks?.length) setRiskTenants(risks);
      } catch (_) { }
      try {
        const tickets = await getUrgentTicketsCount();
        if (tickets !== undefined) setUrgentTickets(tickets);
      } catch (_) { }
    };
    loadData();

    // Realtime only if supabase is available
    if (!supabase) return;
    const sub = supabase
      .channel('admin-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, (payload) => {
        const e = payload.new as any;
        setActivityFeed((prev) =>
          [{ id: e.id, type: e.action, description: `Activité: ${e.action}`, created_at: e.created_at }, ...prev].slice(0, 10)
        );
      })
      .subscribe();
    return () => { supabase!.removeChannel(sub); };
  }, []);

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `il y a ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `il y a ${hrs}h`;
    return `il y a ${Math.floor(hrs / 24)}j`;
  };

  const FEED_ICONS: Record<string, { bg: string; icon: React.ReactNode }> = {
    'tenant.created': { bg: 'bg-blue-50', icon: <IconUsers className="w-3.5 h-3.5 text-blue-600" /> },
    'invoice.paid': { bg: 'bg-emerald-50', icon: <IconDollarSign className="w-3.5 h-3.5 text-emerald-600" /> },
    'appointment.created': { bg: 'bg-violet-50', icon: <IconCheck className="w-3.5 h-3.5 text-violet-600" /> },
  };

  return (
    <div className="space-y-6 font-sans">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-slate-900 tracking-tight">Command Center</h1>
          <p className="text-[13px] text-slate-400 mt-0.5">Vue temps réel de la plateforme Medicom SaaS</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 text-[12px] font-semibold text-slate-500 bg-white border border-slate-100 rounded-full px-3 py-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Système opérationnel
          </span>
          <button onClick={() => navigate('/admin/cabinets/new')} className="sa-btn">
            <IconPlus className="w-4 h-4" /> Nouveau cabinet
          </button>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <KPICard label="Tenants actifs" value={activeTenants} trend={5} sub="Total abonnés actifs" icon={IconUsers} />
        <KPICard label="MRR global" value={`${(mrrData?.currentMRR || currentMRR).toLocaleString('fr-FR')} MAD`} trend={mrrData?.growth || 10} sub="Revenu mensuel récurrent" icon={IconDollarSign} />
        <KPICard label="Nouveaux (7j)" value={newSignups} trend={12} sub="Inscriptions récentes" icon={IconTrendingUp} />
        <KPICard label="RDV en ligne" value={PAPCPM_HISTORY[PAPCPM_HISTORY.length - 1].bookings} trend={25} sub="Via widget public ce mois" icon={IconActivity} />
        <KPICard label="Risque churn" value={riskTenants.length || 4} trend={-2} sub="Cabinets à risque" icon={IconAlertTriangle} />
        <KPICard label="Tickets urgents" value={urgentTickets} trend={0} sub="Nécessitent une réponse" icon={IconMessageSquare} />
      </div>

      {/* ── Main Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* MRR Area Chart — spans 2 cols */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-[12px] p-5">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h3 className="text-[15px] font-semibold text-slate-900 tracking-tight">Croissance MRR — 12 mois</h3>
              <p className="text-[12px] text-slate-400 mt-0.5">Comparaison avec N-1 (pointillés)</p>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-400">
              <span className="flex items-center gap-1.5"><span className="w-6 h-0.5 bg-emerald-500 rounded" /> Cette année</span>
              <span className="flex items-center gap-1.5"><span className="w-6 h-0.5 bg-slate-200 rounded border-dashed border border-slate-300" /> N-1</span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MRR_HISTORY} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="10%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="90%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} width={36} />
                <Tooltip content={<MRRTooltip />} cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '4 2', opacity: 0.4 }} />
                {/* Previous year — dashed line */}
                <Area type="monotone" dataKey="prev" stroke="#CBD5E1" strokeWidth={1.5} strokeDasharray="5 3" fill="none" dot={false} activeDot={false} />
                {/* Current year — solid area */}
                <Area type="monotone" dataKey="mrr" stroke="#10b981" strokeWidth={2.5} fill="url(#mrrGrad)"
                  dot={false} activeDot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50">
            <div className="flex gap-6">
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">MRR Actuel</p>
                <p className="text-[18px] font-semibold text-slate-900 tracking-tight">{(mrrData?.currentMRR || currentMRR).toLocaleString('fr-FR')} <span className="text-[12px] font-normal text-slate-400">MAD</span></p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Croissance</p>
                <p className="text-[18px] font-semibold text-emerald-600 tracking-tight">+{mrrData?.growth || 10}%</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">ARR Projeté</p>
                <p className="text-[18px] font-semibold text-slate-900 tracking-tight">{((mrrData?.currentMRR || currentMRR) * 12).toLocaleString('fr-FR')} <span className="text-[12px] font-normal text-slate-400">MAD</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* MRR Goal Gauge */}
        <div className="bg-white border border-slate-100 rounded-[12px] p-5 flex flex-col">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-[15px] font-semibold text-slate-900 tracking-tight">Objectif MRR</h3>
              <p className="text-[12px] text-slate-400 mt-0.5">Mars 2026</p>
            </div>
            <button onClick={() => navigate('/admin/intelligence')} className="text-[11px] font-semibold text-slate-400 hover:text-slate-700 transition-colors flex items-center gap-1">
              Voir rapport <IconArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center py-2">
            <GaugeChart value={mrrData?.currentMRR || currentMRR} target={mrrGoal} label="MRR" />
            <div className="mt-4 text-center">
              <p className="text-[13px] font-semibold text-emerald-600">{Math.round(((mrrData?.currentMRR || currentMRR) / mrrGoal) * 100)}% de l'objectif</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-50 grid grid-cols-2 gap-3">
            <div className="text-center">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Restant</p>
              <p className="text-[15px] font-semibold text-slate-900">{(mrrGoal - (mrrData?.currentMRR || currentMRR)).toLocaleString('fr-FR')} <span className="text-[10px] font-normal text-slate-400">MAD</span></p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Objectif</p>
              <p className="text-[15px] font-semibold text-slate-900">{mrrGoal.toLocaleString('fr-FR')} <span className="text-[10px] font-normal text-slate-400">MAD</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Top Cabinets */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-[12px] overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
            <h3 className="text-[14px] font-semibold text-slate-900">Top cabinets par MRR</h3>
            <button onClick={() => navigate('/admin/cabinets')} className="text-[11px] font-semibold text-slate-400 hover:text-slate-700 transition-colors flex items-center gap-1">
              Voir tout <IconArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {TOP_CABINETS.map((cab, i) => (
              <div key={cab.name} className="px-5 py-3.5 flex items-center gap-4 hover:bg-slate-50/60 transition-colors group cursor-pointer">
                <span className="text-[12px] font-bold text-slate-300 w-5 shrink-0">#{i + 1}</span>
                <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-[11px] font-bold text-blue-600 shrink-0">
                  {cab.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-slate-900 truncate">{cab.name}</p>
                  <p className="text-[11px] text-slate-400">{cab.plan}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[13px] font-semibold text-slate-900">{cab.mrr.toLocaleString('fr-FR')} <span className="text-[10px] font-normal text-slate-400">MAD</span></p>
                  <p className={`text-[11px] font-bold ${cab.growth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {cab.growth >= 0 ? '↑' : '↓'} {Math.abs(cab.growth)}%
                  </p>
                </div>
                <div className="text-right shrink-0 hidden lg:block">
                  <p className="text-[13px] font-semibold text-blue-600">{cab.papcpm}</p>
                  <p className="text-[10px] text-slate-400">PAPCPM</p>
                </div>
                <span className={`w-2 h-2 rounded-full shrink-0 ${cab.status === 'healthy' ? 'bg-emerald-400' : 'bg-amber-400'}`} title={cab.status === 'risk' ? 'Risque churn' : 'Sain'} />
              </div>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-white border border-slate-100 rounded-[12px] overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
            <h3 className="text-[14px] font-semibold text-slate-900 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Activité en direct
            </h3>
            <IconActivity className="w-3.5 h-3.5 text-slate-300" />
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50 scrollbar-hide">
            {activityFeed.map(item => {
              const cfg = FEED_ICONS[item.type] || { bg: 'bg-slate-50', icon: <IconActivity className="w-3.5 h-3.5 text-slate-400" /> };
              return (
                <div key={item.id} className="px-5 py-3 flex items-start gap-3 hover:bg-slate-50/60 transition-colors">
                  <div className={`w-7 h-7 rounded-full ${cfg.bg} flex items-center justify-center shrink-0 mt-0.5`}>{cfg.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-slate-700 leading-snug">{item.description}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-mono">{timeAgo(item.created_at)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── New Signups Trend (mini sparkline row) ── */}
      <div className="bg-white border border-slate-100 rounded-[12px] p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[14px] font-semibold text-slate-900">Nouvelles inscriptions — tendance annuelle</h3>
            <p className="text-[12px] text-slate-400 mt-0.5">Nombre de nouveaux cabinets par mois</p>
          </div>
          <div className="text-right">
            <p className="text-[22px] font-semibold text-slate-900">{SIGNUP_HISTORY.reduce((a, b) => a + b.count, 0)}</p>
            <p className="text-[11px] text-slate-400">total sur 12 mois</p>
          </div>
        </div>
        <div className="h-28">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={SIGNUP_HISTORY} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="10%" stopColor="#136cfb" stopOpacity={0.12} />
                  <stop offset="90%" stopColor="#136cfb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} dy={6} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} width={20} />
              <Tooltip
                contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: 'none', fontSize: '12px' }}
                formatter={(v: any) => [`${v} cabinets`, 'Inscriptions']}
                cursor={{ stroke: '#136cfb', strokeWidth: 1, opacity: 0.3 }}
              />
              <Area type="monotone" dataKey="count" stroke="#136cfb" strokeWidth={2} fill="url(#signupGrad)"
                dot={false} activeDot={{ r: 4, fill: '#136cfb', strokeWidth: 2, stroke: '#fff' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── PAPCPM — North Star Metric ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* PAPCPM trend chart */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-[12px] p-5">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h3 className="text-[15px] font-semibold text-slate-900 tracking-tight">
                Réservations en ligne — tendance
              </h3>
              <p className="text-[12px] text-slate-400 mt-0.5">
                RDV publics cumulés par mois (source: widget de réservation)
              </p>
            </div>
            <div className="text-right">
              <p className="text-[22px] font-semibold text-slate-900">
                {PAPCPM_HISTORY[PAPCPM_HISTORY.length - 1].bookings}
              </p>
              <p className="text-[11px] text-slate-400">ce mois</p>
            </div>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={PAPCPM_HISTORY} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="papcpmGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="10%" stopColor="#136cfb" stopOpacity={0.15} />
                    <stop offset="90%" stopColor="#136cfb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} dy={6} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} width={28} />
                <Tooltip
                  contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', fontSize: '12px' }}
                  formatter={(v: any, name?: string) => [v, name === 'bookings' ? 'Réservations' : 'PAPCPM']}
                  cursor={{ stroke: '#136cfb', strokeWidth: 1, opacity: 0.3 }}
                />
                <Area type="monotone" dataKey="bookings" stroke="#136cfb" strokeWidth={2.5} fill="url(#papcpmGrad)"
                  dot={false} activeDot={{ r: 5, fill: '#136cfb', strokeWidth: 2, stroke: '#fff' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* KPI footer */}
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-slate-50">
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">PAPCPM moyen</p>
              <p className="text-[18px] font-semibold text-slate-900">
                {PAPCPM_HISTORY[PAPCPM_HISTORY.length - 1].papcpm}
                <span className="text-[11px] font-normal text-slate-400 ml-1">rdv/cabinet</span>
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Cible Phase 2</p>
              <p className="text-[18px] font-semibold text-violet-600">15 <span className="text-[11px] font-normal text-slate-400">rdv/cabinet</span></p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total YTD</p>
              <p className="text-[18px] font-semibold text-slate-900">
                {PAPCPM_HISTORY.reduce((s, d) => s + d.bookings, 0).toLocaleString('fr-FR')}
                <span className="text-[11px] font-normal text-slate-400 ml-1">RDV</span>
              </p>
            </div>
          </div>
        </div>

        {/* PAPCPM by clinic — bar chart */}
        <div className="bg-white border border-slate-100 rounded-[12px] p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[14px] font-semibold text-slate-900">Top cabinets</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">PAPCPM ce mois</p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">En ligne</span>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart
                data={[...TOP_CABINETS].sort((a, b) => b.papcpm - a.papcpm)}
                layout="vertical"
                margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
                barCategoryGap="25%"
              >
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10 }} width={130} />
                <Tooltip
                  contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: 'none', fontSize: '12px' }}
                  formatter={(v: any) => [`${v} rdv/mois`, 'PAPCPM']}
                  cursor={{ fill: '#F8FAFC' }}
                />
                <Bar dataKey="papcpm" radius={[0, 4, 4, 0]} maxBarSize={14}>
                  {[...TOP_CABINETS].sort((a, b) => b.papcpm - a.papcpm).map((_, i) => (
                    <Cell key={i} fill={i === 0 ? '#136cfb' : i === 1 ? '#60a5fa' : '#bfdbfe'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Phase target */}
          <div className="mt-4 pt-4 border-t border-slate-50">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[11px] font-semibold text-slate-500">Progression Phase 1</p>
              <p className="text-[11px] font-bold text-blue-600">
                {PAPCPM_HISTORY[PAPCPM_HISTORY.length - 1].papcpm}/5 <span className="font-normal text-slate-400">cible</span>
              </p>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${Math.min(100, (PAPCPM_HISTORY[PAPCPM_HISTORY.length - 1].papcpm / 5) * 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5">Objectif: 5 cabinets avec ≥ 5 PAPCPM pour fin Phase 1</p>
          </div>
        </div>
      </div>

      {/* ── Quick Actions Row ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Voir les leads', sub: 'Pipeline CRM', icon: IconUsers, path: '/admin/crm', color: 'text-blue-600 bg-blue-50' },
          { label: 'Tickets urgents', sub: `${urgentTickets} en attente`, icon: IconMessageSquare, path: '/admin/support', color: 'text-rose-600 bg-rose-50' },
          { label: 'Rapport intelligence', sub: 'Analytics & AI', icon: IconActivity, path: '/admin/intelligence', color: 'text-violet-600 bg-violet-50' },
        ].map(action => (
          <button key={action.label} onClick={() => navigate(action.path)}
            className="bg-white border border-slate-100 rounded-[12px] p-5 flex items-center gap-4 hover:border-slate-200 hover:bg-slate-50/50 transition-all group text-left">
            <div className={`w-10 h-10 rounded-[10px] ${action.color} flex items-center justify-center shrink-0`}>
              <action.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-slate-900">{action.label}</p>
              <p className="text-[12px] text-slate-400">{action.sub}</p>
            </div>
            <IconArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 ml-auto transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
};
