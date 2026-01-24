
import React, { useState } from 'react';
import { IconSearch, IconPlus, IconSettings, IconDatabase, IconActivity, IconLock, IconToggleRight, IconToggleLeft, IconX, IconCheck } from '../components/Icons';
import { MOCK_TENANTS_DETAILED, MOCK_AUDIT_LOGS } from '../constants';
import { TenantDetailed, ModuleConfiguration } from '../types';
import { SlideOver } from '../components/SlideOver';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const USAGE_DATA = [
    { name: 'Jan', api: 4000, storage: 2400 },
    { name: 'Feb', api: 3000, storage: 1398 },
    { name: 'Mar', api: 2000, storage: 9800 },
    { name: 'Apr', api: 2780, storage: 3908 },
    { name: 'May', api: 1890, storage: 4800 },
    { name: 'Jun', api: 2390, storage: 3800 },
];

const MODULE_LABELS: Record<keyof ModuleConfiguration, string> = {
    dashboard: 'Tableau de bord',
    calendar: 'Calendrier & Agenda',
    patients: 'Dossiers Patients',
    treatments: 'Schémas & Traitements',
    inventory: 'Gestion de Stock',
    labOrders: 'Suivi Laboratoires',
    documents: 'Gestion Documentaire (GED)',
    records: 'Archives Médicales',
    billing: 'Facturation & Caisse',
    reports: 'Analyses & Statistiques',
    support: 'Module Support Client',
};

export const Cabinets = () => {
  const [selectedTenant, setSelectedTenant] = useState<TenantDetailed | null>(null);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDetailTab, setActiveDetailTab] = useState('overview');
  
  // Create Tenant Form State
  const [newTenant, setNewTenant] = useState({ name: '', email: '', plan: 'Pro', region: 'Casablanca' });

  const filteredTenants = MOCK_TENANTS_DETAILED.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filter === 'All' || t.status === filter;
      return matchesSearch && matchesFilter;
  });

  const toggleModule = (moduleKey: keyof ModuleConfiguration) => {
      if (!selectedTenant) return;
      const updatedModules = { 
          ...selectedTenant.enabledModules, 
          [moduleKey]: !selectedTenant.enabledModules[moduleKey] 
      };
      // In a real app, this would be an API call
      setSelectedTenant({ ...selectedTenant, enabledModules: updatedModules });
  };

  const handleCreateTenant = (e: React.FormEvent) => {
      e.preventDefault();
      alert(`Provisioning started for ${newTenant.name}.`);
      setIsProvisioning(false);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Gestion des Tenants</h2>
          <p className="text-sm text-slate-500 mt-1">Supervision et configuration des instances cliniques.</p>
        </div>
        <button 
            onClick={() => setIsProvisioning(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-[13px] font-bold transition-all shadow-sm active:scale-95"
        >
          <IconPlus className="w-4 h-4" /> Provisionner
        </button>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/30">
            <div className="flex gap-2">
                {['All', 'Active', 'Suspended'].map(s => (
                    <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-all ${filter === s ? 'bg-white text-slate-900 border-slate-300 shadow-sm' : 'text-slate-400 border-transparent hover:bg-slate-100'}`}>
                        {s === 'All' ? 'Tous' : s}
                    </button>
                ))}
            </div>
            <div className="relative w-64">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Rechercher..." className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100" />
            </div>
        </div>
        <table className="min-w-full divide-y divide-slate-100">
          <thead>
            <tr className="bg-slate-50/50">
              <th scope="col" className="px-6 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Tenant</th>
              <th scope="col" className="px-6 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Plan</th>
              <th scope="col" className="px-6 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Statut</th>
              <th scope="col" className="px-6 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">MRR</th>
              <th scope="col" className="relative px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {filteredTenants.map((tenant) => (
              <tr key={tenant.id} onClick={() => setSelectedTenant(tenant)} className="hover:bg-slate-50 transition-colors cursor-pointer group">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold text-sm border border-blue-100">
                      {tenant.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-bold text-slate-900">{tenant.name}</div>
                      <div className="text-xs text-slate-500">{tenant.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                    tenant.plan === 'Premium' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                  }`}>
                    {tenant.plan}
                  </span>
                </td>
                <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        tenant.status === 'Active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
                    }`}>
                        {tenant.status}
                    </span>
                </td>
                <td className="px-6 py-4 text-sm font-bold text-slate-900">{tenant.mrr} MAD</td>
                <td className="px-6 py-4 text-right">
                  <button className="text-slate-400 hover:text-blue-600 p-2"><IconSettings className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail SlideOver */}
      <SlideOver
        isOpen={!!selectedTenant}
        onClose={() => setSelectedTenant(null)}
        title={selectedTenant?.name || ''}
        subtitle={`Tenant ID: ${selectedTenant?.id}`}
        width="xl"
      >
        {selectedTenant && (
            <div className="flex flex-col h-full bg-[#F9FAFB]">
                <div className="flex bg-white border-b border-slate-200 px-6">
                    {['overview', 'usage', 'features', 'logs'].map(tab => (
                        <button key={tab} onClick={() => setActiveDetailTab(tab)} className={`px-4 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${activeDetailTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-900'}`}>
                            {tab === 'features' ? 'Fonctionnalités' : tab}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                    {activeDetailTab === 'overview' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="grid grid-cols-3 gap-6">
                                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">MRR</div>
                                    <div className="text-2xl font-bold mt-1 text-slate-900">{selectedTenant.mrr} MAD</div>
                                </div>
                                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Utilisateurs</div>
                                    <div className="text-2xl font-bold mt-1 text-slate-900">{selectedTenant.usersCount}</div>
                                </div>
                                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stockage</div>
                                    <div className="text-2xl font-bold mt-1 text-slate-900">{selectedTenant.storageUsed}</div>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                                <h3 className="font-bold text-slate-900 text-sm mb-4">Informations</h3>
                                <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                                    <div><label className="text-[10px] font-bold text-slate-400 uppercase">Contact</label><p className="font-medium">{selectedTenant.contactName}</p></div>
                                    <div><label className="text-[10px] font-bold text-slate-400 uppercase">Email</label><p className="font-medium">{selectedTenant.email}</p></div>
                                    <div><label className="text-[10px] font-bold text-slate-400 uppercase">Région</label><p className="font-medium">{selectedTenant.region}</p></div>
                                    <div><label className="text-[10px] font-bold text-slate-400 uppercase">Inscrit le</label><p className="font-medium">{selectedTenant.joinedAt}</p></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeDetailTab === 'features' && (
                        <div className="space-y-4 animate-in fade-in duration-300">
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex gap-4">
                                <IconLock className="w-5 h-5 text-blue-600 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-bold text-blue-900">Module-Based Control</h4>
                                    <p className="text-xs text-blue-700 mt-1">Activez ou désactivez les modules spécifiques pour ce cabinet. Ces changements impactent instantanément l'interface utilisateur du tenant.</p>
                                </div>
                            </div>

                            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden divide-y divide-slate-100">
                                {Object.keys(MODULE_LABELS).map((key) => {
                                    const moduleKey = key as keyof ModuleConfiguration;
                                    const isEnabled = selectedTenant.enabledModules[moduleKey];
                                    return (
                                        <div key={key} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                            <div>
                                                <div className="text-sm font-bold text-slate-900">{MODULE_LABELS[moduleKey]}</div>
                                                <div className="text-[11px] text-slate-500 uppercase tracking-tight mt-0.5">module.{key}</div>
                                            </div>
                                            <button 
                                                onClick={() => toggleModule(moduleKey)}
                                                className={`transition-all ${isEnabled ? 'text-blue-600' : 'text-slate-300 hover:text-slate-400'}`}
                                            >
                                                {isEnabled ? <IconToggleRight className="w-10 h-10" /> : <IconToggleLeft className="w-10 h-10" />}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* usage & logs would remain similar to previous but refined for style */}
                    {activeDetailTab === 'usage' && (
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-in fade-in">
                            <h3 className="text-sm font-bold mb-8">API Traffic (Last 6 months)</h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={USAGE_DATA}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                                        <Tooltip contentStyle={{borderRadius: '8px', border: '1px solid #E5E7EB'}} />
                                        <Area type="monotone" dataKey="api" stroke="#007AFF" strokeWidth={2} fill="#007AFF" fillOpacity={0.05} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}
      </SlideOver>
    </div>
  );
};
