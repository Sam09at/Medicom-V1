import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CabinetStats, Task } from '../types';
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

const MOCK_TASKS: Task[] = [
  { id: '1', text: 'Appeler Labo Prothèse', completed: false, priority: 'High', assignee: 'Sarah' },
  {
    id: '2',
    text: 'Commander Anesthésique',
    completed: true,
    priority: 'Medium',
    assignee: 'Amina',
  },
  {
    id: '3',
    text: 'Relancer facture M. Tazi',
    completed: false,
    priority: 'Low',
    assignee: 'Sarah',
  },
];

const StatCard = ({ label, value, trend, trendValue, icon: Icon, colorClass, bgClass }: any) => (
  <div className="card p-6 h-full flex flex-col justify-between group">
    <div className="flex items-center justify-between mb-6">
      <div
        className={`w-10 h-10 rounded-[7px] flex items-center justify-center ${bgClass} ${colorClass} transition-transform group-hover:scale-105 duration-300`}
      >
        <Icon className="w-5 h-5" />
      </div>
      {trend && (
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[30px] ${trend === 'up' ? 'bg-emerald-50 text-emerald-700' : trend === 'down' ? 'bg-rose-50 text-rose-700' : 'bg-slate-50 text-slate-600'} text-[11px] font-medium uppercase tracking-wider`}
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
      <div className="text-[12px] font-semibold tracking-wider text-slate-400 uppercase mb-2">
        {label}
      </div>
      <div
        className="text-[28px] font-normal tracking-tight text-slate-900 leading-none"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        {value}
      </div>
    </div>
  </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ stats }) => {
  const navigate = useNavigate();
  const { currentUser } = useMedicomStore();
  const { waitingPatients } = useWaitingRoom();
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [newTaskText, setNewTaskText] = useState('');

  const isDoctor = currentUser?.role === 'doctor';

  const toggleTask = (id: string) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    setTasks([
      ...tasks,
      {
        id: Date.now().toString(),
        text: newTaskText,
        completed: false,
        priority: 'Medium',
        assignee: 'Me',
      },
    ]);
    setNewTaskText('');
  };

  const removeTask = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  return (
    <div className="space-y-8 font-sans animate-in fade-in duration-150 pb-8">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-[32px] leading-[1.1] font-normal tracking-[-0.02em] text-slate-900 mb-2">
            Bonjour, {isDoctor ? 'Dr. ' : ''}
            {(currentUser?.name || 'Amina').replace(/^Dr\.?\s*/i, '')}
          </h2>
          <p className="text-slate-500 text-[14px] font-medium">
            Voici ce qui se passe aujourd'hui au cabinet.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-semibold bg-white border border-slate-100 px-4 py-2 rounded-[7px] shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] text-slate-600 tracking-tight">
            {new Date().toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </span>
        </div>
      </div>

      {isDoctor && (
        <div className="flex items-center gap-4 flex-wrap mt-2">
          <button
            onClick={() => navigate('/app/waiting-room')}
            className="btn-secondary flex items-center gap-2"
          >
            <IconUsers className="w-4 h-4" /> Salle d'attente
          </button>
          <button
            onClick={() => navigate('/app/calendar')}
            className="btn-secondary flex items-center gap-2"
          >
            <IconCalendar className="w-4 h-4" /> Calendrier
          </button>
          <button
            onClick={() => navigate('/app/patients')}
            className="btn-secondary flex items-center gap-2"
          >
            <IconStethoscope className="w-4 h-4" /> Patients
          </button>
          <button
            onClick={() => navigate('/app/consultations')}
            className="btn-primary flex items-center gap-2 ml-auto"
          >
            <IconPlus className="w-4 h-4" /> Nouvelle Consultation
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isDoctor ? (
          <>
            <StatCard
              label="Rendez-vous du jour"
              value={stats.appointmentsToday}
              trend="up"
              trendValue="Actifs"
              icon={IconCalendar}
              bgClass="bg-blue-50"
              colorClass="text-blue-600"
            />
            <StatCard
              label="Patients en attente"
              value={waitingPatients.length}
              trend="neutral"
              trendValue="Salle d'attente"
              icon={IconUsers}
              bgClass="bg-orange-50"
              colorClass="text-orange-600"
            />
            <StatCard
              label="Prochains RDV"
              value={stats.pendingConfirmations}
              trend="neutral"
              trendValue="À venir"
              icon={IconClock}
              bgClass="bg-sky-50"
              colorClass="text-sky-600"
            />
            <StatCard
              label="Tâches Complétées"
              value={tasks.filter((t) => t.completed).length + '/' + tasks.length}
              trend="up"
              trendValue="Aujourd'hui"
              icon={IconCheckSquare}
              bgClass="bg-green-50"
              colorClass="text-green-600"
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
              colorClass="text-blue-600"
            />
            <StatCard
              label="Salle d'Attente"
              value={stats.waitingRoom}
              trend="neutral"
              trendValue="Actifs"
              icon={IconUsers}
              bgClass="bg-orange-50"
              colorClass="text-orange-600"
            />
            <StatCard
              label="Recettes (MAD)"
              value={stats.revenueToday.toLocaleString('fr-MA')}
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
              bgClass="bg-purple-50"
              colorClass="text-purple-600"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart Section */}
        <div className="lg:col-span-2 card p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3
                className="text-[18px] font-normal text-slate-900 tracking-tight"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Recettes Hebdomadaires
              </h3>
              <p className="text-[13px] font-medium text-slate-500 mt-1">Comparatif sur 7 jours</p>
            </div>
            <select className="text-[12px] font-medium border border-slate-200 rounded-[7px] px-3 py-2 bg-slate-50 text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer">
              <option>Cette semaine</option>
              <option>Semaine dernière</option>
            </select>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dataRevenue}
                barSize={40}
                margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 13, fontWeight: 500 }}
                  dy={16}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 13, fontWeight: 500 }}
                  tickFormatter={(value) => `${value.toLocaleString('fr-FR')}`}
                  dx={-10}
                />
                <Tooltip
                  cursor={{ fill: '#F8FAFC' }}
                  contentStyle={{
                    borderRadius: '15px',
                    border: '1px solid #F1F5F9',
                    boxShadow: '0 4px 20px -4px rgba(0,0,0,0.06)',
                    padding: '12px 16px',
                    fontWeight: 500,
                    fontFamily: 'var(--font-sans)',
                  }}
                  formatter={(value: any) => [`${value.toLocaleString('fr-FR')} MAD`, 'Recettes']}
                />
                <Bar dataKey="value" fill="#0F0F0F" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity & Tasks Column */}
        <div className="space-y-8">
          {/* Waiting Room Widget */}
          <div className="card p-8">
            <div className="flex items-center justify-between mb-6">
              <h3
                className="text-[16px] font-medium text-slate-900 flex items-center gap-2 tracking-tight"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Salle d'Attente
              </h3>
              <span className="badge-blue">
                {isDoctor ? waitingPatients.length : stats.waitingRoom} patients
              </span>
            </div>
            {(isDoctor ? waitingPatients.length : stats.waitingRoom) > 0 ? (
              <div className="space-y-3">
                {isDoctor ? (
                  waitingPatients.slice(0, 4).map((patient) => (
                    <div
                      key={patient.id}
                      onClick={() => navigate(`/app/consultation/${patient.id}`)}
                      className="flex items-center justify-between p-3 bg-white rounded-[7px] border border-slate-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.02)] hover:border-slate-200 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-9 h-9 rounded-[7px] bg-slate-50 text-slate-600 flex items-center justify-center font-semibold text-[12px] border border-slate-100">
                          {patient.patientName
                            ? patient.patientName.substring(0, 2).toUpperCase()
                            : 'PT'}
                        </div>
                        <div>
                          <div className="text-[13px] font-semibold text-slate-900 group-hover:text-black transition-colors">
                            {patient.patientName}
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                            {patient.type}
                          </div>
                        </div>
                      </div>
                      <IconClock className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-all" />
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-between p-3 bg-white rounded-[7px] border border-slate-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.02)] transition-colors cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 rounded-[7px] bg-slate-50 text-slate-600 flex items-center justify-center font-semibold text-[12px] border border-slate-100">
                        KB
                      </div>
                      <div>
                        <div className="text-[13px] font-semibold text-slate-900 transition-colors">
                          Karim Benali
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                          Attente: 15 min
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-10 flex flex-col items-center justify-center text-slate-400 text-sm text-center bg-slate-50/50 rounded-[7px] border border-dashed border-slate-200">
                <IconUsers className="w-6 h-6 mb-3 text-slate-300" />
                <div className="text-[13px] font-medium">Aucun patient en attente</div>
              </div>
            )}
          </div>

          {/* Task Widget */}
          <div className="card p-8 flex flex-col h-[380px]">
            <h3
              className="text-[16px] font-medium text-slate-900 mb-6 tracking-tight flex items-center justify-between"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Tâches
              <span className="badge-gray px-3 py-1 bg-slate-50 border border-slate-100">
                {tasks.filter((t) => !t.completed).length} à faire
              </span>
            </h3>

            <div className="space-y-2 mb-6 flex-1 overflow-y-auto pr-2 scrollbar-hide">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start group p-3 border border-transparent hover:border-slate-100 hover:bg-slate-50/50 rounded-[7px] transition-all"
                >
                  <button
                    onClick={() => toggleTask(task.id)}
                    className={`mt-0.5 mr-3 shrink-0 ${task.completed ? 'text-black' : 'text-slate-300 hover:text-black transition-colors'}`}
                  >
                    {task.completed ? (
                      <IconCheckSquare className="w-4 h-4" />
                    ) : (
                      <IconSquare className="w-4 h-4" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p
                      className={`text-[13px] font-semibold leading-tight truncate transition-colors ${task.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}
                    >
                      {task.text}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      {/* You can display priority badges here if needed */}
                      <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400">
                        {task.priority}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeTask(task.id)}
                    className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-white rounded-[7px] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]"
                  >
                    <IconTrash className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={addTask} className="relative mt-auto">
              <input
                type="text"
                placeholder="Ajouter une tâche..."
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                className="input pr-12"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-black p-1.5 transition-colors"
              >
                <IconPlus className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
