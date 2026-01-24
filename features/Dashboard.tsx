
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CabinetStats, Task } from '../types';
import { IconClock, IconUsers, IconCheckSquare, IconSquare, IconPlus, IconTrash, IconActivity, IconArrowLeft, IconFlag, IconUserPlus, IconTrendingUp, IconTrendingDown } from '../components/Icons';

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
    { id: '2', text: 'Commander Anesthésique', completed: true, priority: 'Medium', assignee: 'Amina' },
    { id: '3', text: 'Relancer facture M. Tazi', completed: false, priority: 'Low', assignee: 'Sarah' },
];

const StatCard = ({ label, value, trend, trendValue }: { label: string, value: string | number, trend?: 'up' | 'down' | 'neutral', trendValue?: string }) => (
  <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:border-slate-300 transition-all">
    <div className="text-slate-500 text-xs font-semibold uppercase tracking-wide">{label}</div>
    <div className="mt-3 flex items-end justify-between">
      <span className="text-2xl font-bold text-slate-900 tracking-tight">{value}</span>
      {trend && (
        <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full flex items-center gap-1 ${
          trend === 'up' ? 'bg-green-50 text-green-700' : 
          trend === 'down' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'
        }`}>
          {trend === 'up' ? <IconTrendingUp className="w-3 h-3" /> : trend === 'down' ? <IconTrendingDown className="w-3 h-3" /> : null}
          {trendValue}
        </span>
      )}
    </div>
  </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ stats }) => {
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [newTaskText, setNewTaskText] = useState('');
  
  const toggleTask = (id: string) => {
      setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const addTask = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newTaskText.trim()) return;
      setTasks([...tasks, { 
          id: Date.now().toString(), 
          text: newTaskText, 
          completed: false,
          priority: 'Medium',
          assignee: 'Me'
      }]);
      setNewTaskText('');
  };

  const removeTask = (id: string) => {
      setTasks(tasks.filter(t => t.id !== id));
  };

  return (
    <div className="space-y-8 font-sans animate-in fade-in duration-500">
      
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
          <div>
              <h2 className="text-xl font-bold text-slate-900">Bonjour, Dr. Amina</h2>
              <p className="text-slate-500 text-sm mt-1">Voici ce qui se passe aujourd'hui au cabinet.</p>
          </div>
          <div className="flex gap-3">
              <span className="text-xs font-medium bg-white border border-slate-200 px-3 py-1.5 rounded-md shadow-sm text-slate-600">
                  {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
          </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="RDV Aujourd'hui" 
          value={stats.appointmentsToday} 
          trend="up" 
          trendValue="+12%" 
        />
        <StatCard 
          label="Salle d'Attente" 
          value={stats.waitingRoom} 
          trend="neutral" 
          trendValue="Actifs" 
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Section */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
                <h3 className="text-base font-bold text-slate-900">Recettes Hebdomadaires</h3>
                <p className="text-xs text-slate-500">Comparatif sur 7 jours</p>
            </div>
            <select className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-slate-50 text-slate-700 outline-none focus:ring-1 focus:ring-blue-500">
                <option>Cette semaine</option>
                <option>Semaine dernière</option>
            </select>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataRevenue} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}} 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'}} 
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity & Tasks Column */}
        <div className="space-y-6">
            {/* Waiting Room Widget */}
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <IconClock className="w-4 h-4 text-blue-500" /> Salle d'Attente
                    </h3>
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold">{stats.waitingRoom}</span>
                </div>
                {stats.waitingRoom > 0 ? (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-100 hover:border-blue-200 transition-colors cursor-pointer group">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">KB</div>
                                <div>
                                    <div className="text-sm font-bold text-slate-900 group-hover:text-blue-600">Karim Benali</div>
                                    <div className="text-xs text-orange-600 font-medium">Attente: 15 min</div>
                                </div>
                            </div>
                            <button className="text-xs bg-white border border-slate-200 px-2 py-1 rounded hover:bg-blue-50 hover:text-blue-600 transition-colors">Appeler</button>
                        </div>
                    </div>
                ) : (
                    <div className="py-8 flex flex-col items-center justify-center text-slate-400 text-sm text-center">
                        <IconUsers className="w-8 h-8 mb-2 opacity-20" />
                        <div>Aucun patient en attente</div>
                    </div>
                )}
            </div>

            {/* Task Widget */}
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col h-[340px]">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <IconCheckSquare className="w-4 h-4 text-emerald-500" /> Tâches
                </h3>
                
                <div className="space-y-1 mb-4 flex-1 overflow-y-auto pr-1">
                    {tasks.map(task => (
                        <div key={task.id} className="flex items-start group p-2 hover:bg-slate-50 rounded transition-colors">
                            <button onClick={() => toggleTask(task.id)} className={`mt-0.5 mr-3 ${task.completed ? 'text-emerald-500' : 'text-slate-300 hover:text-blue-500'}`}>
                                {task.completed ? <IconCheckSquare className="w-4 h-4" /> : <IconSquare className="w-4 h-4" />}
                            </button>
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm truncate ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{task.text}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-[10px] px-1.5 rounded-full ${
                                        task.priority === 'High' ? 'bg-red-50 text-red-600' : 
                                        task.priority === 'Medium' ? 'bg-orange-50 text-orange-600' : 'bg-slate-100 text-slate-500'
                                    }`}>{task.priority}</span>
                                </div>
                            </div>
                            <button onClick={() => removeTask(task.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
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
                      className="w-full pl-3 pr-10 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-colors"
                    />
                    <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600">
                        <IconPlus className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </div>
      </div>
    </div>
  );
};
