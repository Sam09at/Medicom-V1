
import React, { useState } from 'react';
import { ModernUserTable } from '../components/ModernUserTable';
import { 
  MOCK_SAAS_USERS, MOCK_WEBHOOKS, MOCK_API_METRICS, MOCK_JOBS, MOCK_APP_ERRORS, MOCK_SECURITY_EVENTS, MOCK_PLANS, MOCK_FLAGS, MOCK_BROADCASTS,
  MOCK_REGIONS, MOCK_CACHE_METRICS, MOCK_QUEUES, MOCK_DEPLOYMENTS, MOCK_COMPLIANCE, MOCK_AUDIT_LOGS, MOCK_FEATURE_REQUESTS, MOCK_ADDONS, MOCK_BACKUPS, MOCK_AI_CONFIGS, MOCK_CHURN_RISK
} from '../constants';
import { 
  IconActivity, IconDatabase, IconShield, IconCode, IconRefresh, 
  IconAlertTriangle, IconCheckCircle, IconZap, IconPlus, IconTrash,
  IconEdit, IconMegaphone, IconUsers, IconCreditCard, IconMail, IconFlag, IconBroadcast,
  IconServer, IconMap, IconScale, IconCheck, IconGlobe, IconWand, IconShoppingBag, IconTrendingUp, IconHardDrive, IconDownload, IconPlay, IconMoreHorizontal, IconX, IconSend
} from '../components/Icons';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid, AreaChart, Area } from 'recharts';
import { BroadcastMessage } from '../types';

const SYSTEM_METRICS_DATA = [
    { time: '10:00', latency: 45, cpu: 12, errors: 2 },
    { time: '10:05', latency: 48, cpu: 15, errors: 0 },
    { time: '10:10', latency: 150, cpu: 45, errors: 12 },
    { time: '10:15', latency: 55, cpu: 20, errors: 1 },
    { time: '10:20', latency: 42, cpu: 14, errors: 0 },
    { time: '10:25', latency: 40, cpu: 12, errors: 0 },
];

const AI_USAGE_DATA = [
    { day: 'Lun', cost: 120, revenue: 180 },
    { day: 'Mar', cost: 135, revenue: 210 },
    { day: 'Mer', cost: 110, revenue: 160 },
    { day: 'Jeu', cost: 150, revenue: 240 },
    { day: 'Ven', cost: 180, revenue: 290 },
    { day: 'Sam', cost: 90, revenue: 130 },
    { day: 'Dim', cost: 60, revenue: 90 },
];

export const SaaSAdministration = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState(MOCK_SAAS_USERS);

  const toggleUserStatus = (id: string) => {
    setUsers(users.map(u => u.id === id ? { ...u, status: u.status === 'Active' ? 'Locked' : 'Active' } : u));
  };

  const navItems = [
    { id: 'users', label: 'Utilisateurs', icon: IconUsers },
    { id: 'finance', label: 'Finance & Plans', icon: IconCreditCard },
    { id: 'marketplace', label: 'Marketplace', icon: IconShoppingBag },
    { id: 'broadcasts', label: 'Broadcasts', icon: IconBroadcast },
    { id: 'ai', label: 'AI Command Center', icon: IconWand },
    { id: 'success', label: 'Customer Success', icon: IconTrendingUp },
    { id: 'infra', label: 'Infrastructure', icon: IconServer },
    { id: 'backups', label: 'Data & Backups', icon: IconHardDrive },
    { id: 'compliance', label: 'Compliance & Legal', icon: IconScale },
    { id: 'roadmap', label: 'Roadmap', icon: IconMap },
    { id: 'security', label: 'Sécurité', icon: IconShield },
    { id: 'developers', label: 'Développeurs', icon: IconCode },
  ];

  const FinancePage = () => (
    <div className="space-y-6">
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between h-32">
             <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">MRR (Mensuel)</div>
             <div className="flex items-end justify-between">
                <span className="text-3xl font-bold text-slate-900">35 200</span>
                <span className="text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded font-medium border border-green-100">+12%</span>
             </div>
             <div className="text-xs text-slate-400">MAD Recurring Revenue</div>
          </div>
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between h-32">
             <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">ARPU</div>
             <div className="flex items-end justify-between">
                <span className="text-3xl font-bold text-slate-900">850</span>
                <span className="text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded font-medium border border-green-100">+5%</span>
             </div>
             <div className="text-xs text-slate-400">Revenu moyen par cabinet</div>
          </div>
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between h-32">
             <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Churn Rate</div>
             <div className="flex items-end justify-between">
                <span className="text-3xl font-bold text-slate-900">1.2%</span>
                <span className="text-xs bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-medium border border-red-100">+0.1%</span>
             </div>
             <div className="text-xs text-slate-400">Taux de désabonnement</div>
          </div>
       </div>

       <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Plans d'abonnement</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {MOCK_PLANS.map(plan => (
                <div key={plan.id} className="border border-slate-200 rounded-lg p-5 hover:border-indigo-300 transition-colors relative group bg-slate-50/30">
                   {plan.isPopular && <span className="absolute top-0 right-0 bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded-bl-lg border-l border-b border-indigo-200">POPULAIRE</span>}
                   <h4 className="font-bold text-slate-900">{plan.name}</h4>
                   <div className="mt-2 text-2xl font-bold text-indigo-600">{plan.price} <span className="text-sm text-slate-500 font-medium">{plan.currency}/{plan.billing === 'Monthly' ? 'mo' : 'yr'}</span></div>
                   <div className="mt-4 space-y-2">
                      {plan.features.slice(0,3).map((f, i) => (
                         <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                            <IconCheckCircle className="w-3 h-3 text-green-500" /> {f}
                         </div>
                      ))}
                   </div>
                   <div className="mt-6 pt-4 border-t border-slate-200 flex justify-between items-center">
                      <span className="text-xs font-medium text-slate-500">{plan.activeClinics} abonnés</span>
                      <button onClick={() => alert(`Modifier le plan ${plan.name}`)} className="text-xs text-indigo-600 font-medium hover:underline">Modifier</button>
                   </div>
                </div>
             ))}
          </div>
       </div>
    </div>
  );

  const MarketplacePage = () => {
      const [addons, setAddons] = useState(MOCK_ADDONS);

      const toggleStatus = (id: string) => {
          setAddons(addons.map(a => a.id === id ? { ...a, status: a.status === 'Available' ? 'Deprecated' : 'Available' } : a));
      };

      return (
          <div className="space-y-6">
              <div className="flex justify-between items-center">
                  <div>
                      <h3 className="text-lg font-bold text-slate-900">Marketplace & Add-ons</h3>
                      <p className="text-sm text-slate-500">Gérez les modules additionnels vendus aux cliniques.</p>
                  </div>
                  <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 shadow-sm">
                      <IconPlus className="w-4 h-4" /> Créer un Add-on
                  </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {addons.map(addon => (
                      <div key={addon.id} className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-4">
                              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                  {addon.icon === 'message' ? <IconMail className="w-6 h-6" /> : 
                                   addon.icon === 'wand' ? <IconWand className="w-6 h-6" /> : 
                                   <IconCheckCircle className="w-6 h-6" />}
                              </div>
                              <span className={`px-2 py-1 rounded text-xs font-bold ${
                                  addon.status === 'Available' ? 'bg-green-100 text-green-700' : 
                                  addon.status === 'Beta' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
                              }`}>
                                  {addon.status}
                              </span>
                          </div>
                          <h4 className="font-bold text-slate-900 text-lg">{addon.name}</h4>
                          <p className="text-sm text-slate-500 mt-1 h-10">{addon.description}</p>
                          
                          <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                              <div className="font-bold text-slate-900">{addon.price} MAD <span className="font-normal text-xs text-slate-400">/mois</span></div>
                              <div className="text-xs text-slate-500">{addon.activeInstalls} installs</div>
                          </div>
                          
                          <div className="mt-4 flex gap-2">
                              <button className="flex-1 py-1.5 text-xs font-medium border border-slate-200 rounded hover:bg-slate-50 text-slate-700">Éditer</button>
                              <button 
                                onClick={() => toggleStatus(addon.id)}
                                className={`flex-1 py-1.5 text-xs font-medium border rounded transition-colors ${
                                    addon.status === 'Available' 
                                    ? 'border-red-200 text-red-600 hover:bg-red-50' 
                                    : 'border-green-200 text-green-600 hover:bg-green-50'
                                }`}
                              >
                                  {addon.status === 'Available' ? 'Désactiver' : 'Activer'}
                              </button>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      );
  };

  const BroadcastsPage = () => {
      const [broadcasts, setBroadcasts] = useState(MOCK_BROADCASTS);
      const [isComposeOpen, setIsComposeOpen] = useState(false);
      const [newBroadcast, setNewBroadcast] = useState({ title: '', message: '', target: 'All' });
      const [draggedBroadcast, setDraggedBroadcast] = useState<BroadcastMessage | null>(null);

      const handleCreateBroadcast = () => {
          if(!newBroadcast.title) return;
          const msg: BroadcastMessage = {
              id: `b-${Date.now()}`,
              title: newBroadcast.title,
              message: newBroadcast.message,
              target: newBroadcast.target as any,
              status: 'Draft'
          };
          setBroadcasts([...broadcasts, msg]);
          setIsComposeOpen(false);
          setNewBroadcast({ title: '', message: '', target: 'All' });
      };

      const handleDragStart = (e: React.DragEvent, broadcast: BroadcastMessage) => {
          setDraggedBroadcast(broadcast);
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', broadcast.id);
      };

      const handleDrop = (e: React.DragEvent, status: string) => {
          e.preventDefault();
          if (draggedBroadcast && draggedBroadcast.status !== status) {
              const updatedStatus = status as any;
              const sentAt = updatedStatus === 'Sent' ? 'Just now' : undefined;
              
              setBroadcasts(broadcasts.map(b => 
                  b.id === draggedBroadcast.id ? { ...b, status: updatedStatus, sentAt } : b
              ));
          }
          setDraggedBroadcast(null);
      };

      const handleDragOver = (e: React.DragEvent) => {
          e.preventDefault();
      };

      const columns = ['Draft', 'Scheduled', 'Sent'];

      return (
          <div className="space-y-6 h-full flex flex-col">
              <div className="flex justify-between items-center">
                  <div>
                      <h3 className="text-lg font-bold text-slate-900">Broadcasts & Annonces</h3>
                      <p className="text-sm text-slate-500">Envoyez des messages à tous vos utilisateurs.</p>
                  </div>
                  <button onClick={() => setIsComposeOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 shadow-sm">
                      <IconPlus className="w-4 h-4" /> Nouvelle Annonce
                  </button>
              </div>

              {/* Kanban Board for Broadcasts */}
              <div className="flex-1 overflow-x-auto pb-2">
                  <div className="flex gap-6 h-full min-w-[800px]">
                      {columns.map(status => (
                          <div 
                            key={status} 
                            className="flex-1 flex flex-col min-w-[280px]"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, status)}
                          >
                              <div className="flex items-center justify-between mb-4 px-1">
                                  <div className="flex items-center gap-2">
                                      <div className={`w-2 h-2 rounded-full ${status === 'Sent' ? 'bg-green-500' : status === 'Scheduled' ? 'bg-blue-500' : 'bg-slate-400'}`}></div>
                                      <span className="text-sm font-bold text-slate-700">{status}</span>
                                      <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                          {broadcasts.filter(b => b.status === status).length}
                                      </span>
                                  </div>
                              </div>
                              <div className="flex-1 space-y-3 p-1">
                                  {broadcasts.filter(b => b.status === status).map(b => (
                                      <div 
                                        key={b.id} 
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, b)}
                                        className={`bg-white p-4 rounded-xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] group cursor-grab active:cursor-grabbing transition-all ${draggedBroadcast?.id === b.id ? 'opacity-50' : ''}`}
                                      >
                                          <div className="flex justify-between items-start mb-2">
                                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                                                  b.target === 'Premium' ? 'bg-purple-50 text-purple-700' : 'bg-slate-100 text-slate-600'
                                              }`}>
                                                  {b.target}
                                              </span>
                                              {b.status === 'Sent' && <span className="text-[10px] text-slate-400">{b.sentAt}</span>}
                                          </div>
                                          <h4 className="font-bold text-slate-900 text-sm mb-1">{b.title}</h4>
                                          <p className="text-xs text-slate-500 line-clamp-2">{b.message}</p>
                                          
                                          <div className="flex items-center justify-end pt-3 border-t border-slate-50 mt-3">
                                              {b.status === 'Draft' && (
                                                  <button onClick={() => setBroadcasts(broadcasts.map(i => i.id === b.id ? {...i, status: 'Sent', sentAt: 'Just now'} : i))} className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1">
                                                      <IconSend className="w-3 h-3" /> Envoyer
                                                  </button>
                                              )}
                                              {b.status === 'Sent' && <div className="text-xs text-green-600 flex items-center gap-1"><IconCheckCircle className="w-3 h-3" /> Envoyé</div>}
                                          </div>
                                      </div>
                                  ))}
                                  {broadcasts.filter(b => b.status === status).length === 0 && (
                                      <div className="h-24 border-2 border-dashed border-slate-100 rounded-xl flex flex-col items-center justify-center text-xs text-slate-300">
                                          Vide
                                      </div>
                                  )}
                              </div>
                          </div>
                      ))}
                  </div>
              </div>

              {/* Compose Modal */}
              {isComposeOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsComposeOpen(false)}></div>
                      <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative z-10 p-6 space-y-4 animate-in zoom-in-95 duration-200">
                          <div className="flex justify-between items-center">
                              <h3 className="text-lg font-bold text-slate-900">Nouvelle Annonce</h3>
                              <button onClick={() => setIsComposeOpen(false)}><IconX className="w-5 h-5 text-slate-400" /></button>
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Titre</label>
                              <input 
                                type="text" 
                                className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={newBroadcast.title}
                                onChange={e => setNewBroadcast({...newBroadcast, title: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Cible</label>
                              <select 
                                className="w-full border border-slate-300 rounded-md p-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                value={newBroadcast.target}
                                onChange={e => setNewBroadcast({...newBroadcast, target: e.target.value})}
                              >
                                  <option value="All">Tous les tenants</option>
                                  <option value="Premium">Premium uniquement</option>
                                  <option value="Free">Plan Gratuit</option>
                              </select>
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                              <textarea 
                                rows={4}
                                className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={newBroadcast.message}
                                onChange={e => setNewBroadcast({...newBroadcast, message: e.target.value})}
                              />
                          </div>
                          <div className="pt-2 flex justify-end gap-2">
                              <button onClick={() => setIsComposeOpen(false)} className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded">Annuler</button>
                              <button onClick={handleCreateBroadcast} className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm">Créer Brouillon</button>
                          </div>
                      </div>
                  </div>
              )}
          </div>
      );
  };

  const AiOpsPage = () => {
      const [isConfigOpen, setIsConfigOpen] = useState(false);
      
      return (
      <div className="space-y-6">
          <div className="flex justify-between items-center">
              <div>
                  <h3 className="text-lg font-bold text-slate-900">AI Command Center</h3>
                  <p className="text-sm text-slate-500">Gestion des modèles LLM, coûts et prompts système.</p>
              </div>
              <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Coût Journalier</span>
                  <span className="text-xl font-bold text-slate-900">185.40 USD</span>
              </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                  <h4 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
                      <IconActivity className="w-4 h-4 text-purple-500" /> Usage & Rentabilité AI
                  </h4>
                  <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={AI_USAGE_DATA}>
                              <defs>
                                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                                      <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                                  </linearGradient>
                                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                                  </linearGradient>
                              </defs>
                              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <Tooltip contentStyle={{borderRadius: '4px', border: 'none', boxShadow: '0 2px 5px rgba(0,0,0,0.1)'}} />
                              <Area type="monotone" dataKey="revenue" stroke="#82ca9d" fillOpacity={1} fill="url(#colorRev)" name="Revenu Facturé" />
                              <Area type="monotone" dataKey="cost" stroke="#8884d8" fillOpacity={1} fill="url(#colorCost)" name="Coût API" />
                          </AreaChart>
                      </ResponsiveContainer>
                  </div>
              </div>

              <div className="space-y-4">
                  {MOCK_AI_CONFIGS.map(config => (
                      <div key={config.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                          <div className="flex justify-between items-start mb-2">
                              <div className="font-bold text-slate-900">{config.name}</div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${config.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                  {config.status}
                              </span>
                          </div>
                          <div className="flex justify-between text-xs text-slate-500 mb-3">
                              <span>{config.provider}</span>
                              <span>${config.costPer1kTokens}/1k tk</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 mb-1">
                              <div className="bg-purple-500 h-1.5 rounded-full" style={{width: `${Math.min(config.usage24h / 20000, 100)}%`}}></div>
                          </div>
                          <div className="text-[10px] text-right text-slate-400">{config.usage24h.toLocaleString()} tokens (24h)</div>
                      </div>
                  ))}
                  <button 
                    onClick={() => setIsConfigOpen(true)}
                    className="w-full py-2 border-2 border-dashed border-slate-200 rounded-lg text-slate-500 text-xs font-medium hover:bg-slate-50"
                  >
                      + Configurer Modèle
                  </button>
              </div>
          </div>

          {/* Config Modal */}
          {isConfigOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsConfigOpen(false)}></div>
                  <div className="bg-white rounded-lg shadow-xl w-full max-w-sm relative z-10 p-6 space-y-4 animate-in zoom-in-95 duration-200">
                      <div className="flex justify-between items-center">
                          <h3 className="text-lg font-bold text-slate-900">Configurer Modèle AI</h3>
                          <button onClick={() => setIsConfigOpen(false)}><IconX className="w-5 h-5 text-slate-400" /></button>
                      </div>
                      <div className="space-y-4">
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Provider</label>
                              <select className="w-full border border-slate-300 rounded p-2 text-sm bg-white">
                                  <option>OpenAI</option>
                                  <option>Anthropic</option>
                                  <option>Google Gemini</option>
                              </select>
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Model Name</label>
                              <input type="text" className="w-full border border-slate-300 rounded p-2 text-sm" placeholder="e.g. gpt-4-turbo" />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Cost per 1k Tokens ($)</label>
                              <input type="number" step="0.001" className="w-full border border-slate-300 rounded p-2 text-sm" placeholder="0.01" />
                          </div>
                      </div>
                      <div className="pt-2 flex justify-end gap-2">
                          <button onClick={() => setIsConfigOpen(false)} className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded">Annuler</button>
                          <button onClick={() => setIsConfigOpen(false)} className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm">Sauvegarder</button>
                      </div>
                  </div>
              </div>
          )}
      </div>
      );
  };

  const CustomerSuccessPage = () => (
      <div className="space-y-6">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg p-6 text-white shadow-lg flex justify-between items-center">
              <div>
                  <h3 className="text-xl font-bold">Santé du Parc Clients</h3>
                  <p className="text-emerald-100 text-sm">3 tenants nécessitent une attention immédiate.</p>
              </div>
              <div className="text-center">
                  <div className="text-3xl font-bold">92/100</div>
                  <div className="text-xs uppercase tracking-wide opacity-80">Score Global</div>
              </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                  <h4 className="font-bold text-slate-900 text-sm">Tenants à Risque (Churn Prediction)</h4>
                  <button className="text-xs text-blue-600 font-medium hover:underline">Voir tout</button>
              </div>
              <table className="min-w-full divide-y divide-slate-100">
                  <thead>
                      <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Tenant</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">MRR</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Risk Score</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Facteurs</th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Action</th>
                      </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                      {MOCK_CHURN_RISK.map(risk => (
                          <tr key={risk.id} className="hover:bg-slate-50">
                              <td className="px-6 py-4 font-medium text-sm text-slate-900">{risk.clinicName}</td>
                              <td className="px-6 py-4 text-sm text-slate-600">{risk.mrr} MAD</td>
                              <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                      <div className="w-16 bg-slate-100 rounded-full h-2">
                                          <div 
                                              className={`h-2 rounded-full ${risk.riskScore > 70 ? 'bg-red-500' : risk.riskScore > 40 ? 'bg-orange-500' : 'bg-green-500'}`} 
                                              style={{width: `${risk.riskScore}%`}}
                                          ></div>
                                      </div>
                                      <span className="text-xs font-bold text-slate-700">{risk.riskScore}%</span>
                                  </div>
                              </td>
                              <td className="px-6 py-4">
                                  <div className="flex flex-wrap gap-1">
                                      {risk.factors.map((f, i) => (
                                          <span key={i} className="text-[10px] bg-red-50 text-red-700 border border-red-100 px-1.5 py-0.5 rounded">{f}</span>
                                      ))}
                                  </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                  <button className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded font-medium hover:bg-indigo-100">Intervenir</button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
  );

  const BackupManagerPage = () => {
      const triggerBackup = () => {
          if(confirm("Lancer une sauvegarde manuelle globale ? Cela peut impacter les performances.")) {
              alert("Sauvegarde initiée (Job ID: #BK-999)");
          }
      };

      return (
          <div className="space-y-6">
              <div className="flex justify-between items-center">
                  <div>
                      <h3 className="text-lg font-bold text-slate-900">Data & Backups</h3>
                      <p className="text-sm text-slate-500">Politiques de sauvegarde et récupération (Disaster Recovery).</p>
                  </div>
                  <button onClick={triggerBackup} className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-700 shadow-sm">
                      <IconPlay className="w-4 h-4" /> Backup Now
                  </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                      <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                          <IconHardDrive className="w-4 h-4 text-slate-400" /> Utilisation Stockage Global
                      </h4>
                      <div className="relative pt-1">
                          <div className="flex mb-2 items-center justify-between">
                              <div>
                                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                                      S3 Bucket
                                  </span>
                              </div>
                              <div className="text-right">
                                  <span className="text-xs font-semibold inline-block text-blue-600">
                                      45%
                                  </span>
                              </div>
                          </div>
                          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-100">
                              <div style={{ width: "45%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"></div>
                          </div>
                          <div className="text-xs text-slate-500 flex justify-between">
                              <span>Utilisé: 4.5 TB</span>
                              <span>Total: 10 TB</span>
                          </div>
                      </div>
                  </div>

                  <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                      <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
                          <h4 className="text-sm font-bold text-slate-900">Derniers Snapshots</h4>
                      </div>
                      <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                          {MOCK_BACKUPS.map(bk => (
                              <div key={bk.id} className="px-5 py-3 flex justify-between items-center hover:bg-slate-50">
                                  <div>
                                      <div className="text-sm font-medium text-slate-900">{bk.clinicName}</div>
                                      <div className="text-xs text-slate-500">{bk.createdAt} • {bk.type}</div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                      <span className="text-xs font-mono text-slate-600">{bk.size}</span>
                                      <span className={`w-2 h-2 rounded-full ${bk.status === 'Success' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                      {bk.status === 'Success' && <button className="text-slate-400 hover:text-blue-600"><IconDownload className="w-4 h-4" /></button>}
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
      );
  };

  const InfrastructurePage = () => {
      const handleRollback = () => {
          if (confirm("Voulez-vous vraiment annuler le dernier déploiement ? Cette action est critique.")) {
              alert("Rollback initié...");
          }
      };

      return (
      <div className="space-y-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <IconServer className="w-5 h-5 text-slate-500" /> Infrastructure & Scaling
          </h3>

          {/* Region Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {MOCK_REGIONS.map(region => (
                  <div key={region.id} className="bg-slate-900 rounded-lg p-5 text-white relative overflow-hidden shadow-lg">
                      <div className="absolute top-0 right-0 p-4 opacity-20">
                          <IconGlobe className="w-16 h-16" />
                      </div>
                      <div className="relative z-10">
                          <div className="flex items-center gap-2 mb-2">
                              <span className={`w-2 h-2 rounded-full ${region.status === 'Healthy' ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`}></span>
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{region.code}</span>
                          </div>
                          <div className="text-xl font-bold mb-1">{region.name}</div>
                          <div className="text-sm text-slate-400">{region.activeTenants} Tenants actifs</div>
                      </div>
                  </div>
              ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Job Queues */}
              <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                  <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <IconRefresh className="w-4 h-4 text-slate-400" /> Job Queues (Redis)
                  </h4>
                  <div className="space-y-4">
                      {MOCK_QUEUES.map(queue => (
                          <div key={queue.id} className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-100">
                              <div>
                                  <div className="font-semibold text-sm text-slate-900">{queue.name}</div>
                                  <div className="text-xs text-slate-500 mt-1">
                                      <span className="text-green-600 font-medium">{queue.active} active</span> • <span className="text-red-600">{queue.failed} failed</span>
                                  </div>
                              </div>
                              <span className={`px-2 py-1 rounded text-xs font-bold ${
                                  queue.status === 'Healthy' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                                  {queue.status}
                              </span>
                          </div>
                      ))}
                  </div>
              </div>

              {/* Cache Stats */}
              <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                  <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <IconDatabase className="w-4 h-4 text-slate-400" /> Cache Performance
                  </h4>
                  <div className="space-y-6">
                      {MOCK_CACHE_METRICS.map((cache, i) => (
                          <div key={i}>
                              <div className="flex justify-between text-sm mb-1">
                                  <span className="font-medium text-slate-700">{cache.name}</span>
                                  <span className="font-bold text-indigo-600">{cache.hitRate}% Hit Rate</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
                                  <div className="bg-indigo-500 h-full rounded-full" style={{width: `${cache.hitRate}%`}}></div>
                              </div>
                              <div className="flex justify-between text-xs text-slate-500">
                                  <span>Mem: {cache.memoryUsed}MB</span>
                                  <span>Keys: {cache.keys.toLocaleString()}</span>
                                  <span>Uptime: {cache.uptime}</span>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>

          {/* Deployment History */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                  <h4 className="text-sm font-bold text-slate-900">Historique de Déploiement</h4>
                  <button onClick={handleRollback} className="text-xs bg-slate-800 text-white px-3 py-1.5 rounded hover:bg-slate-700 transition-colors">Rollback</button>
              </div>
              <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-white">
                      <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Version</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Auteur</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Commit</th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Statut</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                      {MOCK_DEPLOYMENTS.map(deploy => (
                          <tr key={deploy.id} className="hover:bg-slate-50">
                              <td className="px-6 py-3 text-sm font-medium text-slate-900">{deploy.version}</td>
                              <td className="px-6 py-3 text-sm text-slate-500">{deploy.date}</td>
                              <td className="px-6 py-3 text-sm text-slate-500">{deploy.author}</td>
                              <td className="px-6 py-3 text-sm font-mono text-slate-400">{deploy.commitHash}</td>
                              <td className="px-6 py-3 text-right">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                      deploy.status === 'Success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                  }`}>
                                      {deploy.status === 'Success' && <IconCheckCircle className="w-3 h-3 mr-1" />}
                                      {deploy.status}
                                  </span>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
      );
  };

  const CompliancePage = () => {
      const handleAudit = () => {
          alert("Génération du rapport d'audit en cours. Vous recevrez un email une fois terminé.");
      };

      return (
      <div className="space-y-6">
          <div className="flex justify-between items-center">
              <div>
                  <h3 className="text-lg font-bold text-slate-900">Compliance Center</h3>
                  <p className="text-sm text-slate-500">Gestion RGPD / CNDP et souveraineté des données.</p>
              </div>
              <button onClick={handleAudit} className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-md text-sm font-medium shadow-sm hover:bg-slate-50">
                  <IconShield className="w-4 h-4" /> Audit Report
              </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Compliance List */}
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
                  <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                      <h4 className="text-sm font-bold text-slate-900">Statut Legal des Tenants</h4>
                  </div>
                  <div className="divide-y divide-slate-100">
                      {MOCK_COMPLIANCE.map(rec => (
                          <div key={rec.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                              <div>
                                  <div className="font-medium text-sm text-slate-900">{rec.clinicName}</div>
                                  <div className="text-xs text-slate-500 mt-1">Hébergé: {rec.dataLocation}</div>
                              </div>
                              <div className="text-right">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${
                                      rec.status === 'Compliant' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                                  }`}>
                                      {rec.status}
                                  </span>
                                  <div className="text-[10px] text-slate-400 mt-1">Audit: {rec.lastAudit}</div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>

              {/* Sensitive Access Logs (Break Glass) */}
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
                  <div className="px-6 py-4 border-b border-slate-200 bg-red-50">
                      <h4 className="text-sm font-bold text-red-900 flex items-center gap-2">
                          <IconAlertTriangle className="w-4 h-4" /> Accès Données Sensibles (Support)
                      </h4>
                  </div>
                  <div className="p-4 space-y-4">
                      {MOCK_AUDIT_LOGS.filter(l => l.action.includes('EXPORT') || l.action.includes('LOGIN')).slice(0, 3).map(log => (
                          <div key={log.id} className="flex gap-3 text-sm">
                              <div className="mt-1 min-w-[4rem] text-xs font-mono text-slate-400">{log.timestamp.split(' ')[1]}</div>
                              <div>
                                  <span className="font-bold text-slate-900">{log.actorName}</span>
                                  <span className="text-slate-600"> a effectué </span>
                                  <code className="bg-slate-100 px-1 py-0.5 rounded text-xs font-mono">{log.action}</code>
                                  <span className="text-slate-600"> sur </span>
                                  <span className="font-medium text-indigo-600">{log.clinicName}</span>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      </div>
      );
  };

  const RoadmapPage = () => {
      // Enhanced Kanban Board UI
      return (
      <div className="space-y-6">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-8 text-white shadow-lg">
              <h3 className="text-2xl font-bold mb-2">Product Roadmap</h3>
              <p className="text-indigo-100 max-w-xl">
                  Votez et priorisez les fonctionnalités demandées par la communauté.
              </p>
          </div>

          <div className="flex-1 overflow-x-auto pb-4">
              <div className="flex gap-6 min-w-[800px] h-full p-2">
                  {['Under Review', 'Planned', 'In Progress'].map(status => {
                      const items = MOCK_FEATURE_REQUESTS.filter(f => f.status === status);
                      const statusColor = status === 'In Progress' ? 'bg-blue-500' : status === 'Planned' ? 'bg-purple-500' : 'bg-slate-400';
                      
                      return (
                      <div key={status} className="flex-1 flex flex-col min-w-[280px]">
                          {/* Column Header */}
                          <div className="flex items-center justify-between mb-4 px-1">
                              <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${statusColor}`}></div>
                                  <span className="text-sm font-bold text-slate-700">{status}</span>
                                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                      {items.length}
                                  </span>
                              </div>
                              <button className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded transition-colors">
                                  <IconPlus className="w-4 h-4" />
                              </button>
                          </div>

                          <div className="flex-1 space-y-3">
                              {items.map(feat => (
                                  <div 
                                    key={feat.id} 
                                    className="bg-white p-4 rounded-xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] cursor-pointer transition-all group"
                                    onClick={() => alert(`Détails de: ${feat.title}`)}
                                  >
                                      <div className="flex justify-between items-start mb-3">
                                          <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md bg-indigo-50 text-indigo-700">
                                              {feat.tags[0]}
                                          </span>
                                          <button className="text-slate-300 hover:text-slate-500">
                                              <IconMoreHorizontal className="w-4 h-4" />
                                          </button>
                                      </div>
                                      
                                      <h5 className="font-bold text-slate-900 text-sm mb-1">{feat.title}</h5>
                                      <p className="text-xs text-slate-500 line-clamp-2 mb-4">{feat.description}</p>
                                      
                                      {/* Footer */}
                                      <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                          <div className="flex -space-x-2">
                                              {/* Fake Voters */}
                                              <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white"></div>
                                              <div className="w-6 h-6 rounded-full bg-slate-300 border-2 border-white"></div>
                                          </div>
                                          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-50 px-2 py-1 rounded">
                                              ▲ {feat.votes}
                                          </div>
                                      </div>
                                  </div>
                              ))}
                              {items.length === 0 && (
                                  <div className="h-24 border-2 border-dashed border-slate-100 rounded-xl flex flex-col items-center justify-center text-xs text-slate-300">
                                      Vide
                                  </div>
                              )}
                          </div>
                      </div>
                  )})}
              </div>
          </div>
      </div>
      );
  };

  const SecurityPage = () => (
    // ... (content unchanged) ...
    <div className="space-y-6">
       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 rounded-lg p-5 text-white flex flex-col justify-between h-32 relative overflow-hidden">
             <IconShield className="absolute right-[-10px] bottom-[-10px] w-24 h-24 text-slate-800 opacity-50" />
             <div className="text-xs font-bold text-slate-400 uppercase tracking-wide z-10">Threat Level</div>
             <div className="text-2xl font-bold text-green-400 z-10">Low</div>
             <div className="text-xs text-slate-500 z-10">No active attacks detected</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm h-32 flex flex-col justify-between">
             <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Failed Logins (24h)</div>
             <div className="text-2xl font-bold text-slate-900">124</div>
             <div className="text-xs text-red-500">+12% vs yesterday</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm h-32 flex flex-col justify-between">
             <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">WAF Blocked</div>
             <div className="text-2xl font-bold text-slate-900">1,820</div>
             <div className="text-xs text-green-600">Requests</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm h-32 flex flex-col justify-between">
             <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Admin Sessions</div>
             <div className="text-2xl font-bold text-slate-900">3</div>
             <div className="text-xs text-slate-400">Active now</div>
          </div>
       </div>

       <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center">
             <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2"><IconActivity className="w-4 h-4 text-slate-400" /> Audit Logs (Security)</h3>
             <button onClick={() => alert("Chargement de tous les logs...")} className="text-xs text-blue-600 font-medium hover:underline">Voir tout</button>
          </div>
          <table className="min-w-full divide-y divide-slate-100">
             <thead className="bg-slate-50">
                <tr>
                   <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Event</th>
                   <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Actor</th>
                   <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">IP Address</th>
                   <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Location</th>
                   <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                   <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Time</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
                {MOCK_SECURITY_EVENTS.map(evt => (
                   <tr key={evt.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 text-xs font-medium text-slate-900">{evt.reason}</td>
                      <td className="px-5 py-3 text-xs text-slate-600">Unknown</td>
                      <td className="px-5 py-3 text-xs font-mono text-slate-500">{evt.ip}</td>
                      <td className="px-5 py-3 text-xs text-slate-500">{evt.location}</td>
                      <td className="px-5 py-3">
                         <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            evt.threatLevel === 'High' ? 'bg-red-100 text-red-700 border-red-200' :
                            evt.threatLevel === 'Medium' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                            'bg-yellow-100 text-yellow-700 border-yellow-200'
                         }`}>{evt.threatLevel}</span>
                      </td>
                      <td className="px-5 py-3 text-right text-xs text-slate-400">{evt.date}</td>
                   </tr>
                ))}
             </tbody>
          </table>
       </div>
    </div>
  );

  const SystemHealthPage = () => (
    // ... (content unchanged) ...
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Santé du Système</h2>
          <p className="text-sm text-slate-500">Monitoring temps réel, logs d'erreurs et tâches de maintenance.</p>
        </div>
        <div className="flex gap-2">
           <span className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 text-sm font-medium rounded-full border border-green-200">
             <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
             Tous les systèmes opérationnels
           </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
           <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
             <IconActivity className="w-4 h-4 text-slate-400" /> Latence & Charge
           </h3>
           <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={SYSTEM_METRICS_DATA}>
                      <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                      <Tooltip contentStyle={{borderRadius: '4px', border: '1px solid #e2e8f0'}} />
                      <Line type="monotone" dataKey="latency" stroke="#4f46e5" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="errors" stroke="#ef4444" strokeWidth={2} dot={false} />
                  </LineChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col">
           <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
             <IconRefresh className="w-4 h-4 text-slate-400" /> Background Jobs
           </h3>
           <div className="flex-1 space-y-4">
              {MOCK_JOBS.map(job => (
                <div key={job.id} className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-100">
                   <div>
                      <div className="text-sm font-medium text-slate-900">{job.name}</div>
                      <div className="text-xs text-slate-500">{job.frequency} • {job.status}</div>
                   </div>
                   <div className={`w-2 h-2 rounded-full ${job.status === 'Running' ? 'bg-blue-500 animate-pulse' : job.status === 'Idle' ? 'bg-slate-300' : 'bg-red-500'}`}></div>
                </div>
              ))}
           </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
         <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-sm font-bold text-red-900 flex items-center gap-2">
               <IconAlertTriangle className="w-4 h-4 text-red-500" /> Erreurs Récentes
            </h3>
            <button className="text-xs text-slate-500 hover:text-slate-900 underline">Voir Sentry</button>
         </div>
         <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
               <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Message</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Composant</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Dernière fois</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Statut</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
               {MOCK_APP_ERRORS.map(err => (
                  <tr key={err.id} className="hover:bg-slate-50">
                     <td className="px-6 py-3 text-xs font-mono text-red-600 truncate max-w-md">{err.message}</td>
                     <td className="px-6 py-3 text-xs text-slate-600">{err.component}</td>
                     <td className="px-6 py-3 text-xs text-slate-500">{err.lastSeen}</td>
                     <td className="px-6 py-3 text-right">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${err.status === 'Open' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-green-50 text-green-700 border-green-100'}`}>{err.status}</span>
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>
    </div>
  );

  const DevelopersPage = () => {
    // ... (content unchanged) ...
    const [subTab, setSubTab] = useState<'webhooks'|'api'|'flags'|'sql'>('webhooks');
    const [sqlQuery, setSqlQuery] = useState("SELECT id, email, created_at FROM users WHERE status = 'Active' ORDER BY created_at DESC LIMIT 10;");
    const [webhooks, setWebhooks] = useState(MOCK_WEBHOOKS);

    const handleRunQuery = () => {
        alert("Running query: " + sqlQuery);
    };

    const handleAddWebhook = () => {
        const newHook: any = {
            id: `wh-${Date.now()}`,
            url: 'https://example.com/webhook',
            events: ['new.event'],
            status: 'Active',
            failureRate: 0
        };
        setWebhooks([...webhooks, newHook]);
    };

    const handleDeleteWebhook = (id: string) => {
        if(confirm('Supprimer ce webhook ?')) {
            setWebhooks(webhooks.filter(w => w.id !== id));
        }
    };

    return (
      <div className="space-y-6">
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Espace Développeurs</h2>
              <p className="text-sm text-slate-500">Configuration technique avancée et accès API.</p>
            </div>
            <div className="flex bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
                <button onClick={() => setSubTab('webhooks')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${subTab === 'webhooks' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>Webhooks</button>
                <button onClick={() => setSubTab('api')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${subTab === 'api' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>API Keys</button>
                <button onClick={() => setSubTab('flags')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${subTab === 'flags' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>Feature Flags</button>
                <button onClick={() => setSubTab('sql')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${subTab === 'sql' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>Database</button>
            </div>
         </div>

         <div className="bg-white rounded-lg border border-slate-200 shadow-sm min-h-[400px]">
            {subTab === 'webhooks' && (
               <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                     <h3 className="text-base font-semibold text-slate-900">Webhooks Configurés</h3>
                     <button onClick={handleAddWebhook} className="flex items-center gap-2 text-xs bg-indigo-600 text-white px-3 py-2 rounded-md font-medium hover:bg-indigo-700 shadow-sm">
                        <IconPlus className="w-3 h-3" /> Ajouter Endpoint
                     </button>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                     {webhooks.map(hook => (
                        <div key={hook.id} className="border border-slate-200 rounded-lg p-4 flex items-center justify-between hover:border-indigo-300 transition-colors bg-slate-50/50">
                           <div>
                              <div className="flex items-center gap-3">
                                 <span className={`w-2.5 h-2.5 rounded-full ${hook.status === 'Active' ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                                 <div className="font-mono text-sm text-slate-700">{hook.url}</div>
                              </div>
                              <div className="flex gap-2 mt-2 ml-5">
                                 {hook.events.map(ev => <span key={ev} className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-500">{ev}</span>)}
                              </div>
                           </div>
                           <div className="flex items-center gap-4 text-sm text-slate-500">
                              <span>Taux d'échec: <span className={hook.failureRate > 0 ? 'text-red-600 font-bold' : 'text-green-600'}>{hook.failureRate}%</span></span>
                              <button onClick={() => handleDeleteWebhook(hook.id)} className="text-slate-400 hover:text-red-600"><IconTrash className="w-4 h-4" /></button>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            )}

            {subTab === 'api' && (
               <div className="p-6">
                  <h3 className="text-base font-semibold text-slate-900 mb-6">Métriques API (24h)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                     {MOCK_API_METRICS.slice(0, 3).map((m, i) => (
                        <div key={i} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                           <div className="text-xs font-mono text-slate-500 mb-2 truncate">{m.endpoint}</div>
                           <div className="flex justify-between items-end">
                              <div className="text-xl font-bold text-slate-900">{m.requests.toLocaleString()} <span className="text-xs font-normal text-slate-400">reqs</span></div>
                              <div className="text-xs font-bold text-indigo-600">{m.avgLatency}ms</div>
                           </div>
                        </div>
                     ))}
                  </div>
                  <div className="border-t border-slate-200 pt-6">
                     <h4 className="text-sm font-bold text-slate-900 mb-4">Clés API Actives</h4>
                     <div className="bg-yellow-50 border border-yellow-200 rounded p-3 flex items-start gap-3">
                        <IconAlertTriangle className="w-5 h-5 text-yellow-600 shrink-0" />
                        <div className="text-sm text-yellow-800">
                           Les clés API donnent un accès complet aux données. Ne les partagez jamais.
                        </div>
                     </div>
                  </div>
               </div>
            )}

            {subTab === 'flags' && (
                <div className="p-6">
                    <h3 className="text-base font-semibold text-slate-900 mb-6 flex items-center gap-2">
                        <IconFlag className="w-4 h-4 text-slate-500" /> Feature Flags
                    </h3>
                    <div className="space-y-4">
                        {MOCK_FLAGS.map(flag => (
                            <div key={flag.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg">
                                <div>
                                    <div className="font-semibold text-slate-900 text-sm">{flag.name}</div>
                                    <div className="font-mono text-xs text-slate-500 mt-1">{flag.key}</div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-xs text-slate-500 font-medium">Rollout: {flag.rolloutPercentage}%</div>
                                    <div className={`px-2 py-1 rounded text-xs font-bold ${flag.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                                        {flag.status}
                                    </div>
                                    <button onClick={() => alert("Edit flag: " + flag.name)} className="text-indigo-600 text-xs font-medium hover:underline">Edit</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {subTab === 'sql' && (
               <div className="flex flex-col h-[500px]">
                  <div className="bg-slate-900 p-4 rounded-t-lg flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <IconDatabase className="w-4 h-4 text-green-400" />
                        <span className="text-xs font-mono text-slate-300">production-db-primary (Read-Only)</span>
                     </div>
                     <button onClick={handleRunQuery} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded font-bold hover:bg-green-700 shadow-sm flex items-center gap-1">
                        <IconZap className="w-3 h-3" /> Run Query
                     </button>
                  </div>
                  <textarea 
                     className="flex-1 bg-slate-800 text-slate-300 font-mono text-sm p-6 focus:outline-none resize-none leading-relaxed"
                     value={sqlQuery}
                     onChange={(e) => setSqlQuery(e.target.value)}
                  ></textarea>
                  <div className="bg-white border-t border-slate-200 p-4 h-12 flex items-center justify-between text-xs text-slate-500">
                     <span>Query time: 0ms</span>
                     <span>0 rows affected</span>
                  </div>
               </div>
            )}
         </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'users': return <ModernUserTable users={users} onToggleStatus={toggleUserStatus} />;
      case 'finance': return <FinancePage />;
      case 'marketplace': return <MarketplacePage />;
      case 'broadcasts': return <BroadcastsPage />;
      case 'ai': return <AiOpsPage />;
      case 'success': return <CustomerSuccessPage />;
      case 'backups': return <BackupManagerPage />;
      case 'infra': return <InfrastructurePage />;
      case 'compliance': return <CompliancePage />;
      case 'roadmap': return <RoadmapPage />;
      case 'health': return <SystemHealthPage />;
      case 'developers': return <DevelopersPage />;
      case 'security': return <SecurityPage />;
      default: return <div className="text-slate-400 text-center py-10">Section en construction</div>;
    }
  };

  return (
    <div className="flex h-full bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden font-sans">
      {/* Internal Sidebar */}
      <div className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Administration</h2>
          <p className="text-xs text-slate-500 mt-1">Paramètres globaux du SaaS</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === item.id
                  ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-indigo-600' : 'text-slate-400'}`} />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto bg-slate-50/30 p-8">
        <div className="max-w-6xl mx-auto h-full flex flex-col">
           {renderContent()}
        </div>
      </div>
    </div>
  );
};
