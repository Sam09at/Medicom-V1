
import React, { useState } from 'react';
import { IconSearch, IconPlus, IconSettings, IconDatabase, IconActivity, IconLock, IconToggleRight, IconToggleLeft } from '../components/Icons';
import { MOCK_TENANTS_DETAILED, MOCK_AUDIT_LOGS } from '../constants';
import { TenantDetailed } from '../types';
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

export const Cabinets = () => {
  const [selectedTenant, setSelectedTenant] = useState<TenantDetailed | null>(null);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDetailTab, setActiveDetailTab] = useState('overview');
  
  // Create Tenant Form State
  const [newTenant, setNewTenant] = useState({ name: '', email: '', plan: 'Pro', region: 'Casablanca' });

  // Feature Flags State (Mock per tenant)
  const [tenantFeatures, setTenantFeatures] = useState({
      aiModule: true,
      apiAccess: false,
      whiteLabel: false,
      sso: true
  });

  const filteredTenants = MOCK_TENANTS_DETAILED.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filter === 'All' || t.status === filter;
      return matchesSearch && matchesFilter;
  });

  const handleCreateTenant = (e: React.FormEvent) => {
      e.preventDefault();
      alert(`Provisioning started for ${newTenant.name} (${newTenant.plan}) in ${newTenant.region}.`);
      setIsProvisioning(false);
      setNewTenant({ name: '', email: '', plan: 'Pro', region: 'Casablanca' });
  };

  const handleAction = (action: string) => {
      if (selectedTenant) {
          if (confirm(`Êtes-vous sûr de vouloir ${action.toLowerCase()} pour ${selectedTenant.name} ?`)) {
              alert(`Action ${action} effectuée.`);
          }
      }
  };

  const toggleFeature = (feature: keyof typeof tenantFeatures) => {
      setTenantFeatures(prev => ({ ...prev, [feature]: !prev[feature] }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Gestion des Tenants</h2>
          <p className="text-sm text-slate-500 mt-1">Supervision des instances cabinets et cliniques.</p>
        </div>
        <button 
            onClick={() => setIsProvisioning(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
        >
          <IconPlus className="w-4 h-4" />
          Provisionner un Tenant
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-3 rounded-md border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
             <IconSearch className="h-4 w-4 text-slate-400" />
           </div>
           <input 
             type="text" 
             placeholder="Rechercher un cabinet, email..." 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="block w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-md leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm transition-all"
           />
        </div>
        <div className="flex gap-2">
            {['All', 'Active', 'Pending', 'Suspended'].map(status => (
                <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                        filter === status 
                        ? 'bg-blue-50 text-blue-700 border-blue-200' 
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                >
                    {status === 'All' ? 'Tous' : status}
                </button>
            ))}
        </div>
      </div>

      {/* Cabinets List */}
      <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tenant</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Plan</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Statut</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Utilisateurs</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">MRR</th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {filteredTenants.map((tenant) => (
              <tr key={tenant.id} onClick={() => setSelectedTenant(tenant)} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold text-sm border border-blue-100">
                      {tenant.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-slate-900">{tenant.name}</div>
                      <div className="text-xs text-slate-500">{tenant.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-0.5 inline-flex text-xs leading-4 font-medium rounded-full border ${
                    tenant.plan === 'Premium' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                    tenant.plan === 'Pro' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                    'bg-slate-50 text-slate-600 border-slate-200'
                  }`}>
                    {tenant.plan}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${
                        tenant.status === 'Active' ? 'bg-green-50 text-green-700 border-green-100' :
                        tenant.status === 'Suspended' ? 'bg-red-50 text-red-700 border-red-100' :
                        'bg-yellow-50 text-yellow-700 border-yellow-100'
                    }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                             tenant.status === 'Active' ? 'bg-green-500' :
                             tenant.status === 'Suspended' ? 'bg-red-500' :
                             'bg-yellow-500'
                        }`}></span>
                        {tenant.status}
                    </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  {tenant.usersCount} users
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                  {tenant.mrr} MAD
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-slate-400 hover:text-blue-600 transition-colors p-2">
                      <IconSettings className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tenant Details SlideOver */}
      <SlideOver
        isOpen={!!selectedTenant}
        onClose={() => setSelectedTenant(null)}
        title={selectedTenant?.name || ''}
        subtitle={`Tenant ID: ${selectedTenant?.id} • Région: ${selectedTenant?.region}`}
        width="xl"
      >
        {selectedTenant && (
            <div className="flex flex-col h-full">
                {/* Tabs */}
                <div className="flex border-b border-slate-200 px-6">
                    {[
                        { id: 'overview', label: 'Vue d\'ensemble' },
                        { id: 'usage', label: 'Métriques & Usage' },
                        { id: 'features', label: 'Fonctionnalités' },
                        { id: 'logs', label: 'Audit Logs' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveDetailTab(tab.id)}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                                activeDetailTab === tab.id 
                                ? 'border-blue-600 text-blue-600' 
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                    
                    {activeDetailTab === 'overview' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* Key Stats */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
                                    <div className="text-xs text-slate-500 uppercase tracking-wide font-medium">MRR Actuel</div>
                                    <div className="text-2xl font-bold text-slate-900 mt-1">{selectedTenant.mrr} <span className="text-sm font-normal text-slate-400">MAD</span></div>
                                </div>
                                <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
                                    <div className="text-xs text-slate-500 uppercase tracking-wide font-medium">Utilisateurs</div>
                                    <div className="text-2xl font-bold text-slate-900 mt-1">{selectedTenant.usersCount} <span className="text-xs font-normal text-green-600 bg-green-50 px-1.5 rounded">+2 this mo</span></div>
                                </div>
                                <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
                                    <div className="text-xs text-slate-500 uppercase tracking-wide font-medium">Stockage</div>
                                    <div className="text-2xl font-bold text-slate-900 mt-1">{selectedTenant.storageUsed}</div>
                                </div>
                            </div>

                            {/* Contact & Sub Info */}
                            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
                                <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">Informations Administratives</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <div className="text-slate-500 text-xs">Contact Principal</div>
                                        <div className="font-medium text-slate-900">{selectedTenant.contactName}</div>
                                    </div>
                                    <div>
                                        <div className="text-slate-500 text-xs">Email Administrateur</div>
                                        <div className="font-medium text-slate-900">{selectedTenant.email}</div>
                                    </div>
                                    <div>
                                        <div className="text-slate-500 text-xs">Date de création</div>
                                        <div className="font-medium text-slate-900">{selectedTenant.joinedAt}</div>
                                    </div>
                                    <div>
                                        <div className="text-slate-500 text-xs">Plan actuel</div>
                                        <div className="font-medium text-indigo-600">{selectedTenant.plan}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                                <h3 className="font-bold text-slate-900 text-sm mb-4">Actions Rapides</h3>
                                <div className="flex gap-3">
                                    <button onClick={() => handleAction('Reset Password')} className="px-4 py-2 bg-white border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm">
                                        Réinitialiser MDP
                                    </button>
                                    <button className="px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-md text-sm font-medium text-indigo-700 hover:bg-indigo-100 shadow-sm">
                                        Se connecter en tant que (Impersonate)
                                    </button>
                                    <button onClick={() => handleAction('Suspendre')} className="px-4 py-2 bg-red-50 border border-red-200 rounded-md text-sm font-medium text-red-700 hover:bg-red-100 ml-auto">
                                        Suspendre l'accès
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeDetailTab === 'usage' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                                <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
                                    <IconActivity className="w-4 h-4 text-slate-400" /> API Requests (Last 6 Months)
                                </h3>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={USAGE_DATA}>
                                            <defs>
                                                <linearGradient id="colorApi" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                                            <Tooltip />
                                            <Area type="monotone" dataKey="api" stroke="#3b82f6" fillOpacity={1} fill="url(#colorApi)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                                <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
                                    <IconDatabase className="w-4 h-4 text-slate-400" /> Storage Usage (MB)
                                </h3>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={USAGE_DATA} barSize={40}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                                            <Tooltip cursor={{fill: 'transparent'}} />
                                            <Bar dataKey="storage" fill="#64748b" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeDetailTab === 'features' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3 mb-6">
                                <IconLock className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                                <div className="text-sm text-yellow-800">
                                    <span className="font-bold">Zone Sensible :</span> La modification des fonctionnalités impacte immédiatement l'expérience utilisateur du tenant.
                                </div>
                            </div>

                            <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100 shadow-sm">
                                {Object.entries(tenantFeatures).map(([key, enabled]) => (
                                    <div key={key} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                        <div>
                                            <div className="font-medium text-slate-900 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                                            <div className="text-xs text-slate-500">Enable or disable this module for the tenant.</div>
                                        </div>
                                        <button 
                                            onClick={() => toggleFeature(key as keyof typeof tenantFeatures)}
                                            className={`transition-colors ${enabled ? 'text-green-600' : 'text-slate-300'}`}
                                        >
                                            {enabled ? <IconToggleRight className="w-10 h-10" /> : <IconToggleLeft className="w-10 h-10" />}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeDetailTab === 'logs' && (
                        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <table className="min-w-full divide-y divide-slate-100">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Action</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Actor</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {MOCK_AUDIT_LOGS.filter(log => log.clinicName.includes(selectedTenant.name) || log.clinicName === 'Cabinet Amina').map(log => (
                                        <tr key={log.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 text-sm text-slate-900 font-medium">{log.action}</td>
                                            <td className="px-4 py-3 text-sm text-slate-500">{log.actorName}</td>
                                            <td className="px-4 py-3 text-sm text-slate-400 text-right">{log.timestamp}</td>
                                        </tr>
                                    ))}
                                    {MOCK_AUDIT_LOGS.filter(log => log.clinicName.includes(selectedTenant.name)).length === 0 && (
                                        <tr><td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-400 italic">Aucun log récent</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        )}
      </SlideOver>

      {/* Provisioning SlideOver */}
      <SlideOver
        isOpen={isProvisioning}
        onClose={() => setIsProvisioning(false)}
        title="Provisionner un Nouveau Tenant"
        subtitle="Configuration initiale de l'instance client"
        width="md"
      >
          <form onSubmit={handleCreateTenant} className="p-6 space-y-6">
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nom du Cabinet/Clinique</label>
                  <input 
                    type="text" 
                    required
                    value={newTenant.name}
                    onChange={e => setNewTenant({...newTenant, name: e.target.value})}
                    className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                    placeholder="Ex: Clinique Al Azhar"
                  />
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email Administrateur</label>
                  <input 
                    type="email" 
                    required
                    value={newTenant.email}
                    onChange={e => setNewTenant({...newTenant, email: e.target.value})}
                    className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                    placeholder="admin@clinique.ma"
                  />
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Plan</label>
                  <select 
                    value={newTenant.plan}
                    onChange={e => setNewTenant({...newTenant, plan: e.target.value})}
                    className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                      <option value="Starter">Starter</option>
                      <option value="Pro">Pro</option>
                      <option value="Premium">Premium</option>
                  </select>
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Région Hébergement</label>
                  <select 
                    value={newTenant.region}
                    onChange={e => setNewTenant({...newTenant, region: e.target.value})}
                    className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                      <option value="Casablanca">Casablanca (Azure)</option>
                      <option value="Paris">Paris (AWS)</option>
                  </select>
              </div>
              
              <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsProvisioning(false)} className="flex-1 py-2 border border-slate-300 rounded-md text-slate-700 font-medium hover:bg-slate-50">Annuler</button>
                  <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 shadow-sm">Créer Instance</button>
              </div>
          </form>
      </SlideOver>
    </div>
  );
};
