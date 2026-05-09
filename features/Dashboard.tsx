import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { CabinetStats } from '../types';
import {
  IconClock,
  IconUsers,
  IconCheckSquare,
  IconSquare,
  IconPlus,
  IconTrash,
  IconTrendingUp,
  IconTrendingDown,
  IconCalendar,
  IconStethoscope,
  IconDollarSign,
  IconActivity,
} from '../components/Icons';
import { useMedicomStore } from '../store';
import { useWaitingRoom } from '../hooks/useWaitingRoom';
import { useDashboardKPIs, RevenuePoint, AppointmentStatusPoint } from '../hooks/useDashboardKPIs';
import { useAppointments } from '../hooks/useAppointments';
import { useTasks } from '../hooks/useTasks';

interface DashboardProps {
  stats: CabinetStats;
}

// ─── Placeholder data (shown before real data loads) ──────────────────────────

const REVENUE_PLACEHOLDER: RevenuePoint[] = [
  { name: 'Jan', current: 0, prev: 0 }, { name: 'Fév', current: 0, prev: 0 },
  { name: 'Mar', current: 0, prev: 0 }, { name: 'Avr', current: 0, prev: 0 },
  { name: 'Mai', current: 0, prev: 0 }, { name: 'Jui', current: 0, prev: 0 },
  { name: 'Jul', current: 0, prev: 0 }, { name: 'Aoû', current: 0, prev: 0 },
  { name: 'Sep', current: 0, prev: 0 }, { name: 'Oct', current: 0, prev: 0 },
  { name: 'Nov', current: 0, prev: 0 }, { name: 'Déc', current: 0, prev: 0 },
];

const RDV_PLACEHOLDER: AppointmentStatusPoint[] = [
  { label: 'Confirmés', value: 1, color: '#136cfb' },
];


const STATUS_STYLE: Record<string, { label: string; color: string; pill: string }> = {
  confirmed: {
    label: 'Confirmé',
    color: '#136cfb',
    pill: 'text-[#136cfb] bg-blue-50/80 border border-blue-100/60',
  },
  waiting: {
    label: 'En attente',
    color: '#f59e0b',
    pill: 'text-amber-600 bg-amber-50/80 border border-amber-100/60',
  },
  pending: {
    label: 'À confirmer',
    color: '#cbd5e1',
    pill: 'text-slate-400 bg-slate-50 border border-slate-200/60',
  },
};

// ─── Sub-components ────────────────────────────────────────────────────────────

const StatCard = ({ label, value, trend, trendValue, icon: Icon, colorClass, bgClass }: any) => (
  <div className="card p-5 flex flex-col justify-between group">
    <div className="flex items-start justify-between mb-4">
      <div
        className={`w-8 h-8 rounded-[6px] flex items-center justify-center ${bgClass} ${colorClass} transition-colors`}
      >
        <Icon className="w-4 h-4" />
      </div>
      {trend && (
        <div
          className={`badge ${trend === 'up' ? 'badge-green' : trend === 'down' ? 'badge-red' : 'badge-gray'} gap-1 font-semibold`}
        >
          {trend === 'up' ? (
            <IconTrendingUp className="w-3 h-3" />
          ) : trend === 'down' ? (
            <IconTrendingDown className="w-3 h-3" />
          ) : null}
          <span>{trendValue}</span>
        </div>
      )}
    </div>
    <div>
      <div className="text-[12px] font-semibold text-slate-400 uppercase tracking-widest mb-1">
        {label}
      </div>
      <div className="text-[26px] font-semibold tracking-tight text-slate-900 leading-none">
        {value}
      </div>
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#136cfb] text-white rounded-[30px] px-4 py-2.5 text-[13px] font-semibold">
        <div className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-0.5">
          {label}
        </div>
        <div>{payload[0].value.toLocaleString('fr-FR')} MAD</div>
      </div>
    );
  }
  return null;
};

const RevenueChart = ({ data }: { data: RevenuePoint[] }) => (
  <div className="card p-6 h-full">
    <div className="flex justify-between items-start mb-6">
      <div>
        <h3 className="text-[15px] font-semibold text-slate-900 tracking-tight">
          Recettes Analytics
        </h3>
        <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">
          Sur 12 mois
        </p>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#136cfb]" />
            <span className="text-[11px] font-semibold text-slate-500">Cette année</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#e2405f]" />
            <span className="text-[11px] font-semibold text-slate-500">Passée</span>
          </div>
        </div>
      </div>
    </div>
    <div className="h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="gcurrent" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#136cfb" stopOpacity={0.22} />
              <stop offset="100%" stopColor="#136cfb" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gprev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e2405f" stopOpacity={0.12} />
              <stop offset="100%" stopColor="#e2405f" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#F1F5F9" />
          <XAxis
            dataKey="name"
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
            content={<CustomTooltip />}
            cursor={{ stroke: '#136cfb', strokeWidth: 1, strokeDasharray: '4 4' }}
          />
          <Area
            type="monotone"
            dataKey="prev"
            stroke="#e2405f"
            strokeWidth={1.5}
            fill="url(#gprev)"
            dot={false}
            activeDot={false}
          />
          <Area
            type="monotone"
            dataKey="current"
            stroke="#136cfb"
            strokeWidth={2.5}
            fill="url(#gcurrent)"
            dot={false}
            activeDot={{ r: 4, fill: '#136cfb', stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const AppointmentStatusChart = ({ data }: { data: AppointmentStatusPoint[] }) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="card p-6 h-full">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-[15px] font-semibold text-slate-900 tracking-tight">Statuts des RDV</h3>
          <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">
            Ce mois-ci
          </p>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="relative shrink-0">
          <PieChart width={160} height={160}>
            <Pie
              data={data.length > 0 ? data : [{ label: '', value: 1, color: '#e2e8f0' }]}
              cx={75}
              cy={75}
              innerRadius={52}
              outerRadius={72}
              paddingAngle={3}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              strokeWidth={0}
            >
              {(data.length > 0 ? data : [{ color: '#e2e8f0' }]).map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[20px] font-semibold text-slate-900 leading-none tracking-tight">
              {total}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Total
            </span>
          </div>
        </div>
        <div className="flex-1 space-y-3.5">
          {data.map((d) => {
            const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
            return (
              <div key={d.label}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-[12px] font-semibold text-slate-600">{d.label}</span>
                  </div>
                  <span className="text-[12px] font-semibold text-slate-900">{pct}%</span>
                </div>
                <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: d.color }} />
                </div>
              </div>
            );
          })}
          {data.length === 0 && (
            <p className="text-[12px] font-semibold text-slate-400 text-center py-4">
              Aucune donnée ce mois
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const TasksWidget = ({
  tasks,
  toggleTask,
  removeTask,
  newTaskText,
  setNewTaskText,
  addTask,
}: {
  tasks: { id: string; text: string; completed: boolean; priority?: string }[];
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;
  newTaskText: string;
  setNewTaskText: (v: string) => void;
  addTask: (e: React.FormEvent) => void;
}) => (
  <div className="card p-6 flex flex-col h-full">
    <div className="flex items-center justify-between mb-5">
      <h3 className="text-[15px] font-semibold text-slate-900 tracking-tight">Tâches</h3>
      <span className="badge badge-gray font-semibold">
        {tasks.filter((t) => !t.completed).length} à faire
      </span>
    </div>
    <div className="space-y-1 flex-1 overflow-y-auto scrollbar-hide">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="flex items-start group p-2.5 border border-transparent hover:border-slate-200/60 hover:bg-slate-50/50 rounded-[6px] transition-all"
        >
          <button
            onClick={() => toggleTask(task.id)}
            className={`mt-0.5 mr-3 shrink-0 transition-colors ${task.completed ? 'text-[#136cfb]' : 'text-slate-300 hover:text-slate-600'}`}
          >
            {task.completed ? (
              <IconCheckSquare className="w-4 h-4" />
            ) : (
              <IconSquare className="w-4 h-4" />
            )}
          </button>
          <div className="flex-1 min-w-0 pt-0.5">
            <p
              className={`text-[13px] font-semibold leading-tight truncate ${task.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}
            >
              {task.text}
            </p>
            <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mt-1 block">
              {task.priority}
            </span>
          </div>
          <button
            onClick={() => removeTask(task.id)}
            className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
          >
            <IconTrash className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
    <form onSubmit={addTask} className="relative mt-4 pt-4 border-t border-slate-100">
      <input
        type="text"
        placeholder="Ajouter une tâche..."
        value={newTaskText}
        onChange={(e) => setNewTaskText(e.target.value)}
        className="input pr-10"
      />
      <button
        type="submit"
        className="absolute right-3 top-1/2 mt-2 -translate-y-1/2 text-slate-400 hover:text-[#136cfb] transition-colors"
      >
        <IconPlus className="w-4 h-4" />
      </button>
    </form>
  </div>
);

const WaitingRoomWidget = ({ isDoctor, waitingPatients, waitingRoom, navigate }: any) => {
  const count = isDoctor ? waitingPatients.length : waitingRoom;
  return (
    <div className="card p-6 h-full">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[15px] font-semibold text-slate-900 tracking-tight">Salle d'Attente</h3>
        <span className="badge-blue font-semibold">
          {count} patient{count !== 1 ? 's' : ''}
        </span>
      </div>
      {count > 0 ? (
        <div className="space-y-2">
          {isDoctor ? (
            waitingPatients.slice(0, 5).map((p: any) => (
              <div
                key={p.id}
                onClick={() => navigate(`/app/consultation/${p.id}`)}
                className="flex items-center justify-between p-3 rounded-[20px] border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-[6px] bg-blue-50 text-[#136cfb] flex items-center justify-center font-bold text-[11px]">
                    {p.patientName?.substring(0, 2).toUpperCase() ?? 'PT'}
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-slate-900">{p.patientName}</div>
                    <div className="text-[11px] font-semibold text-slate-400">{p.type}</div>
                  </div>
                </div>
                <IconClock className="w-4 h-4 text-slate-300 group-hover:text-[#136cfb] transition-colors" />
              </div>
            ))
          ) : (
            <div className="flex items-center justify-between p-3 rounded-[20px] border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[6px] bg-blue-50 text-[#136cfb] flex items-center justify-center font-bold text-[11px]">
                  KB
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-slate-900">Karim Benali</div>
                  <div className="text-[11px] font-semibold text-slate-400">Attente : 15 min</div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center py-10 bg-slate-50/50 rounded-[20px] border border-dashed border-slate-200">
          <IconUsers className="w-5 h-5 mb-2 text-slate-300" />
          <div className="text-[12px] font-semibold text-slate-400">Aucun patient en attente</div>
        </div>
      )}
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────

export const Dashboard: React.FC<DashboardProps> = ({ stats: fallbackStats }) => {
  const navigate = useNavigate();
  const { currentUser } = useMedicomStore();
  const { waitingPatients } = useWaitingRoom();
  const { stats, revenueByMonth, appointmentStatusData } = useDashboardKPIs(fallbackStats);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  const { appointments: todayAppts } = useAppointments({ startDate: todayStart, endDate: todayEnd });

  const { tasks, addTask: addTaskToDb, toggleTask, removeTask } = useTasks();
  const [newTaskText, setNewTaskText] = useState('');

  const isDoctor = currentUser?.role === 'doctor';

  const chartData = revenueByMonth.length > 0 ? revenueByMonth : REVENUE_PLACEHOLDER;
  const statusData = appointmentStatusData.length > 0 ? appointmentStatusData : RDV_PLACEHOLDER;

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    addTaskToDb(newTaskText.trim());
    setNewTaskText('');
  };

  return (
    <div className="space-y-6 font-sans animate-in fade-in duration-150 pb-10">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[22px] font-semibold tracking-tight text-slate-900 leading-tight">
            Bonjour{isDoctor ? ', Dr. ' : ', '}
            {(currentUser?.name || 'Amina').replace(/^Dr\.?\s*/i, '')} 👋
          </h2>
          <p className="text-[13px] font-semibold text-slate-400 mt-1 uppercase tracking-widest">
            {new Date().toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-3 flex-wrap justify-end">
          {isDoctor ? (
            <>
              <button
                onClick={() => navigate('/app/waiting-room')}
                className="btn-secondary !rounded-[30px] !px-5 !py-2.5 gap-2"
              >
                <IconUsers className="w-4 h-4" /> Salle d'attente
              </button>
              <button
                onClick={() => navigate('/app/calendar')}
                className="btn-secondary !rounded-[30px] !px-5 !py-2.5 gap-2"
              >
                <IconCalendar className="w-4 h-4" /> Calendrier
              </button>
              <button
                onClick={() => navigate('/app/calendar')}
                className="btn-primary !rounded-[30px] !px-5 !py-2.5 gap-2"
              >
                <IconPlus className="w-4 h-4" /> Nouvelle Consultation
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('/app/calendar')}
                className="btn-secondary !rounded-[30px] !px-5 !py-2.5 gap-2"
              >
                <IconCalendar className="w-4 h-4" /> Calendrier
              </button>
              <button
                onClick={() => navigate('/app/patients')}
                className="btn-secondary !rounded-[30px] !px-5 !py-2.5 gap-2"
              >
                <IconStethoscope className="w-4 h-4" /> Patients
              </button>
              <button
                onClick={() => navigate('/app/waiting-room')}
                className="btn-primary !rounded-[30px] !px-5 !py-2.5 gap-2"
              >
                <IconPlus className="w-4 h-4" /> Nouveau RDV
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isDoctor ? (
          <>
            <StatCard
              label="RDV Aujourd'hui"
              value={stats.appointmentsToday}
              trend="up"
              trendValue="+2 vs hier"
              icon={IconCalendar}
              bgClass="bg-blue-50"
              colorClass="text-[#136cfb]"
            />
            <StatCard
              label="Patients en salle"
              value={waitingPatients.length}
              trend="neutral"
              trendValue="En attente"
              icon={IconUsers}
              bgClass="bg-amber-50"
              colorClass="text-amber-600"
            />
            <StatCard
              label="Prochains RDV"
              value={stats.pendingConfirmations}
              trend="neutral"
              trendValue="À confirmer"
              icon={IconClock}
              bgClass="bg-sky-50"
              colorClass="text-sky-600"
            />
            <StatCard
              label="Tâches"
              value={`${tasks.filter((t: { completed: boolean }) => t.completed).length}/${tasks.length}`}
              trend="up"
              trendValue="Complétées"
              icon={IconCheckSquare}
              bgClass="bg-emerald-50"
              colorClass="text-emerald-600"
            />
          </>
        ) : (
          <>
            <StatCard
              label="RDV Aujourd'hui"
              value={stats.appointmentsToday}
              trend="up"
              trendValue="+12%"
              icon={IconCalendar}
              bgClass="bg-blue-50"
              colorClass="text-[#136cfb]"
            />
            <StatCard
              label="Salle d'Attente"
              value={stats.waitingRoom}
              trend="neutral"
              trendValue="Actifs"
              icon={IconUsers}
              bgClass="bg-amber-50"
              colorClass="text-amber-600"
            />
            <StatCard
              label="Recettes du jour"
              value={`${stats.revenueToday.toLocaleString('fr-MA')} MAD`}
              trend="up"
              trendValue="+5%"
              icon={IconDollarSign}
              bgClass="bg-emerald-50"
              colorClass="text-emerald-600"
            />
            <StatCard
              label="Traitements Actifs"
              value={stats.activeTreatments}
              trend="neutral"
              trendValue="Stable"
              icon={IconActivity}
              bgClass="bg-violet-50"
              colorClass="text-violet-600"
            />
          </>
        )}
      </div>

      {/* ══ DOCTOR LAYOUT ═══════════════════════════════════════════════════ */}
      {isDoctor && (
        <>
          {/* Row 1 — Today's Schedule (primary) + Waiting Room */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Schedule — main panel */}
            <div className="lg:col-span-2 card p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-1">
                <div>
                  <h3 className="text-[15px] font-semibold text-slate-900 tracking-tight">
                    Programme du jour
                  </h3>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    {todayAppts.filter((a) => (a.status as string) === 'confirmed').length} confirmés ·{' '}
                    {todayAppts.length} au total
                  </p>
                </div>
                <button
                  onClick={() => navigate('/app/calendar')}
                  className="btn-secondary !rounded-[30px] !px-4 !py-1.5 text-[12px] gap-1.5"
                >
                  <IconCalendar className="w-3.5 h-3.5" /> Voir calendrier
                </button>
              </div>
              {/* Micro progress bar */}
              <div className="h-[2px] w-full bg-slate-100 rounded-full overflow-hidden mb-5 mt-3">
                <div
                  className="h-full rounded-full bg-[#136cfb] transition-all duration-700"
                  style={{
                    width: todayAppts.length > 0
                      ? `${(todayAppts.filter((a) => (a.status as string) === 'confirmed').length / todayAppts.length) * 100}%`
                      : '0%',
                  }}
                />
              </div>
              {/* Schedule list — linear style */}
              <div>
                {todayAppts.length === 0 ? (
                  <div className="py-10 text-center text-[13px] font-semibold text-slate-400">
                    Aucun rendez-vous aujourd'hui.
                  </div>
                ) : todayAppts.map((appt, i) => {
                  const statusKey = (appt.status as string) === 'waiting_room' ? 'waiting' : (appt.status as string);
                  const s = STATUS_STYLE[statusKey] ?? STATUS_STYLE.pending;
                  const initials = (appt.patientName ?? '')
                    .split(' ')
                    .map((n: string) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();
                  const isLast = i === todayAppts.length - 1;
                  const timeStr = appt.start instanceof Date
                    ? appt.start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                    : String(appt.start);
                  return (
                    <div
                      key={appt.id}
                      className={`flex items-center gap-5 py-3.5 px-1 transition-colors cursor-pointer group hover:bg-slate-50/60 rounded-[4px] ${!isLast ? 'border-b border-slate-100/80' : ''}`}
                    >
                      {/* Time */}
                      <span className="w-11 shrink-0 text-[12px] font-bold text-slate-400 tabular-nums tracking-tight">
                        {timeStr}
                      </span>

                      {/* Thin accent bar */}
                      <div
                        className="w-[3px] h-7 rounded-full shrink-0"
                        style={{ backgroundColor: s.color, opacity: 0.85 }}
                      />

                      {/* Avatar */}
                      <div
                        className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold"
                        style={{ backgroundColor: `${s.color}18`, color: s.color }}
                      >
                        {initials}
                      </div>

                      {/* Name + type */}
                      <div className="flex-1 min-w-0">
                        <div className="text-[13.5px] font-semibold text-slate-800 leading-tight group-hover:text-slate-900 transition-colors">
                          {appt.patientName}
                        </div>
                        <div className="text-[11.5px] font-medium text-slate-400 mt-0.5">
                          {appt.type}
                        </div>
                      </div>

                      {/* Status — minimal pill */}
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-[30px] shrink-0 ${s.pill}`}
                      >
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Waiting Room */}
            <WaitingRoomWidget
              isDoctor={isDoctor}
              waitingPatients={waitingPatients}
              waitingRoom={stats.waitingRoom}
              navigate={navigate}
            />
          </div>

          {/* Row 2 — Revenue Chart + RDV Status + Tasks */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <RevenueChart data={chartData} />
            </div>
            <div className="lg:col-span-1">
              <AppointmentStatusChart data={statusData} />
            </div>
            <div className="lg:col-span-1">
              <TasksWidget
                tasks={tasks}
                toggleTask={toggleTask}
                removeTask={removeTask}
                newTaskText={newTaskText}
                setNewTaskText={setNewTaskText}
                addTask={handleAddTask}
              />
            </div>
          </div>
        </>
      )}

      {/* ══ STAFF / CABINET ADMIN LAYOUT ════════════════════════════════════ */}
      {!isDoctor && (
        <>
          {/* Row 1 — Revenue chart (primary) + Appointment status */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RevenueChart data={chartData} />
            </div>
            <div className="lg:col-span-1">
              <AppointmentStatusChart data={statusData} />
            </div>
          </div>

          {/* Row 2 — KPI insight cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              {
                label: 'Non présentés',
                value: '13',
                sub: 'ce mois',
                color: '#e2405f',
                bg: 'bg-rose-50',
              },
              {
                label: 'Reportés',
                value: '11',
                sub: 'ce mois',
                color: '#f59e0b',
                bg: 'bg-amber-50',
              },
              {
                label: 'Taux de présence',
                value: '87%',
                sub: 'objectif 90%',
                color: '#136cfb',
                bg: 'bg-blue-50',
              },
              {
                label: 'RDV confirmés',
                value: '58',
                sub: 'ce mois',
                color: '#10b981',
                bg: 'bg-emerald-50',
              },
              {
                label: 'Annulés',
                value: '4',
                sub: 'ce mois',
                color: '#8b5cf6',
                bg: 'bg-violet-50',
              },
              {
                label: "Liste d'attente",
                value: '7',
                sub: 'patients',
                color: '#94a3b8',
                bg: 'bg-slate-50',
              },
            ].map((item) => (
              <div key={item.label} className="card p-4 flex flex-col gap-2">
                <div
                  className={`w-7 h-7 rounded-[6px] ${item.bg} flex items-center justify-center`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                </div>
                <div className="text-[22px] font-semibold tracking-tight text-slate-900 leading-none mt-1">
                  {item.value}
                </div>
                <div className="text-[12px] font-semibold text-slate-600 leading-tight">
                  {item.label}
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {item.sub}
                </div>
              </div>
            ))}
          </div>

          {/* Row 3 — Waiting Room + Tasks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WaitingRoomWidget
              isDoctor={isDoctor}
              waitingPatients={waitingPatients}
              waitingRoom={stats.waitingRoom}
              navigate={navigate}
            />
            <TasksWidget
              tasks={tasks}
              toggleTask={toggleTask}
              removeTask={removeTask}
              newTaskText={newTaskText}
              setNewTaskText={setNewTaskText}
              addTask={handleAddTask}
            />
          </div>
        </>
      )}
    </div>
  );
};
