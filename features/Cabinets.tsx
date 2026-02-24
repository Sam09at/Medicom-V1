import React, { useState, useEffect } from 'react';
import {
  IconSearch,
  IconPlus,
  IconSettings,
  IconDatabase,
  IconActivity,
  IconLock,
  IconToggleRight,
  IconToggleLeft,
  IconX,
  IconCheck,
  IconDownload,
  IconUsers,
  IconFileText,
  IconShield,
} from '../components/Icons';
import { MOCK_TENANTS_DETAILED, MOCK_AUDIT_LOGS } from '../constants';
import { TenantDetailed, ModuleConfiguration } from '../types';
import { SlideOver } from '../components/SlideOver';
import { getAllTenants, suspendTenant, activateTenant } from '../lib/api/saas/tenants';

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
  const [tenants, setTenants] = useState<TenantDetailed[]>(MOCK_TENANTS_DETAILED);
  const [selectedTenant, setSelectedTenant] = useState<TenantDetailed | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDetailTab, setActiveDetailTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // Create Tenant Form State
  const [newTenant, setNewTenant] = useState({
    name: '',
    email: '',
    plan: 'Pro',
    region: 'Casablanca',
  });

  // Load tenants from Supabase
  useEffect(() => {
    const load = async () => {
      try {
        const data = await getAllTenants();
        if (data.length > 0) setTenants(data);
      } catch (err) {
        console.warn('[Cabinets] Using fallback mock data:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredTenants = tenants.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'All' || t.status === filter;
    return matchesSearch && matchesFilter;
  });

  const toggleModule = (moduleKey: keyof ModuleConfiguration) => {
    if (!selectedTenant) return;
    const updatedModules = {
      ...selectedTenant.enabledModules,
      [moduleKey]: !selectedTenant.enabledModules[moduleKey],
    };
    setSelectedTenant({ ...selectedTenant, enabledModules: updatedModules });
  };

  const handleSuspendToggle = async (tenant: TenantDetailed) => {
    try {
      if (tenant.status === 'Active') {
        await suspendTenant(tenant.id);
        setTenants((prev) =>
          prev.map((t) => (t.id === tenant.id ? { ...t, status: 'Suspended' as const } : t))
        );
        if (selectedTenant?.id === tenant.id) setSelectedTenant({ ...tenant, status: 'Suspended' });
      } else {
        await activateTenant(tenant.id);
        setTenants((prev) =>
          prev.map((t) => (t.id === tenant.id ? { ...t, status: 'Active' as const } : t))
        );
        if (selectedTenant?.id === tenant.id) setSelectedTenant({ ...tenant, status: 'Active' });
      }
    } catch (err) {
      console.error('[Cabinets] Suspend/Activate failed:', err);
    }
  };

  const handleBulkAction = async (action: 'suspend' | 'activate' | 'export') => {
    if (selectedIds.size === 0) return;

    if (action === 'export') {
      const csv = ['ID,Name,Email,Status,MRR,Plan']
        .concat(
          Array.from(selectedIds).map((id) => {
            const t = tenants.find((x) => x.id === id);
            return t ? `${t.id},${t.name},${t.email},${t.status},${t.mrr},${t.plan}` : '';
          })
        )
        .join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tenants_export_${new Date().toISOString()}.csv`;
      a.click();
      return;
    }

    try {
      const ids = Array.from(selectedIds);
      for (const id of ids) {
        if (action === 'suspend') await suspendTenant(id);
        if (action === 'activate') await activateTenant(id);
      }
      setTenants((prev) =>
        prev.map((t) =>
          selectedIds.has(t.id)
            ? { ...t, status: action === 'suspend' ? 'Suspended' : 'Active' }
            : t
        )
      );
      setSelectedIds(new Set());
    } catch (err) {
      console.error('[Cabinets] Bulk action failed:', err);
    }
  };

  const toggleSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredTenants.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTenants.map((t) => t.id)));
    }
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
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Gestion des Tenants</h2>
          <p className="text-sm text-gray-500 mt-1">
            Supervision et configuration des instances cliniques.
          </p>
        </div>
        <button
          onClick={() => setIsProvisioning(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-[13px] font-bold transition-all shadow-sm active:scale-95"
        >
          <IconPlus className="w-4 h-4" /> Provisionner
        </button>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center bg-gray-50/30 gap-4">
          <div className="flex gap-2">
            {['All', 'Active', 'Suspended'].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-all ${filter === s ? 'bg-white text-gray-900 border-gray-300 shadow-sm' : 'text-gray-400 border-transparent hover:bg-gray-100'}`}
              >
                {s === 'All' ? 'Tous' : s}
              </button>
            ))}
          </div>

          {selectedIds.size > 0 ? (
            <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 animate-in fade-in">
              <span className="text-xs font-medium text-indigo-700">
                {selectedIds.size} sélectionné(s)
              </span>
              <div className="h-4 w-px bg-indigo-200 mx-1"></div>
              <button
                onClick={() => handleBulkAction('activate')}
                className="text-xs font-medium text-emerald-600 hover:text-emerald-700 px-2"
              >
                Activer
              </button>
              <button
                onClick={() => handleBulkAction('suspend')}
                className="text-xs font-medium text-rose-600 hover:text-rose-700 px-2"
              >
                Suspendre
              </button>
              <button
                onClick={() => handleBulkAction('export')}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 px-2 flex items-center gap-1"
              >
                <IconDownload className="w-3 h-3" /> CSV
              </button>
            </div>
          ) : (
            <div className="relative w-full sm:w-64">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50/50">
                <th scope="col" className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    onChange={toggleAll}
                    checked={
                      selectedIds.size === filteredTenants.length && filteredTenants.length > 0
                    }
                    className="w-4 h-4 rounded border-gray-300 text-blue-600"
                  />
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest"
                >
                  Tenant
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest"
                >
                  Plan
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest"
                >
                  Statut
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest"
                >
                  Admin
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest"
                >
                  Last Booking
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest"
                >
                  MRR
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest"
                >
                  Churn Risk
                </th>
                <th scope="col" className="relative px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredTenants.map((tenant) => (
                <tr
                  key={tenant.id}
                  onClick={() => setSelectedTenant(tenant)}
                  className={`hover:bg-gray-50 transition-colors cursor-pointer group ${selectedIds.has(tenant.id) ? 'bg-blue-50/50' : ''}`}
                >
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(tenant.id)}
                      onChange={(e) => toggleSelection(tenant.id, e as any)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-9 w-9 flex-shrink-0 bg-gradient-to-br from-blue-50 to-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-bold text-xs border border-indigo-100 shadow-sm">
                        {tenant.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-bold text-gray-900">{tenant.name}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <IconFileText className="w-3 h-3" /> {tenant.id.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                        tenant.plan === 'Premium'
                          ? 'bg-purple-50 text-purple-700 border-purple-100'
                          : 'bg-blue-50 text-blue-700 border-blue-100'
                      }`}
                    >
                      {tenant.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        tenant.status === 'Active'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${tenant.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`}
                      ></span>
                      {tenant.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-gray-600">
                    <div className="flex items-center gap-1">
                      <IconShield className="w-3 h-3 text-gray-400" /> {tenant.contactName}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-gray-500">
                    Aujourd'hui, 14:30
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">
                    {tenant.mrr.toLocaleString()} MAD
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold ${Math.random() > 0.8 ? 'text-amber-600' : 'text-emerald-600'}`}
                      >
                        {Math.random() > 0.8 ? 'High' : 'Low'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTenant(tenant);
                      }}
                      className="text-gray-400 hover:text-blue-600 p-2"
                    >
                      <IconSettings className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
            <div className="flex bg-white border-b border-gray-200 px-6 overflow-x-auto">
              {['overview', 'billing', 'usage', 'users', 'logs', 'actions'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveDetailTab(tab)}
                  className={`px-4 py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${activeDetailTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-900'}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {activeDetailTab === 'overview' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="grid grid-cols-3 gap-6">
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        MRR
                      </div>
                      <div className="text-2xl font-bold mt-1 text-gray-900">
                        {selectedTenant.mrr} MAD
                      </div>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Utilisateurs
                      </div>
                      <div className="text-2xl font-bold mt-1 text-gray-900">
                        {selectedTenant.usersCount}
                      </div>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Stockage
                      </div>
                      <div className="text-2xl font-bold mt-1 text-gray-900">
                        {selectedTenant.storageUsed}
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <h3 className="font-bold text-gray-900 text-sm mb-4">Informations</h3>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase">
                          Contact
                        </label>
                        <p className="font-medium">{selectedTenant.contactName}</p>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase">
                          Email
                        </label>
                        <p className="font-medium">{selectedTenant.email}</p>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase">
                          Région
                        </label>
                        <p className="font-medium">{selectedTenant.region}</p>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase">
                          Inscrit le
                        </label>
                        <p className="font-medium">{selectedTenant.joinedAt}</p>
                      </div>
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
                      <p className="text-xs text-blue-700 mt-1">
                        Activez ou désactivez les modules spécifiques pour ce cabinet. Ces
                        changements impactent instantanément l'interface utilisateur du tenant.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden divide-y divide-gray-100">
                    {Object.keys(MODULE_LABELS).map((key) => {
                      const moduleKey = key as keyof ModuleConfiguration;
                      const isEnabled = selectedTenant.enabledModules[moduleKey];
                      return (
                        <div
                          key={key}
                          className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                        >
                          <div>
                            <div className="text-sm font-bold text-gray-900">
                              {MODULE_LABELS[moduleKey]}
                            </div>
                            <div className="text-[11px] text-gray-500 uppercase tracking-tight mt-0.5">
                              module.{key}
                            </div>
                          </div>
                          <button
                            onClick={() => toggleModule(moduleKey)}
                            className={`transition-all ${isEnabled ? 'text-blue-600' : 'text-gray-300 hover:text-gray-400'}`}
                          >
                            {isEnabled ? (
                              <IconToggleRight className="w-10 h-10" />
                            ) : (
                              <IconToggleLeft className="w-10 h-10" />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeDetailTab === 'users' && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 animate-in fade-in">
                  <h3 className="font-bold text-gray-900 text-sm mb-4">Utilisateurs du Cabinet</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-xs">
                          MA
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900">
                            {selectedTenant.contactName}
                          </div>
                          <div className="text-xs text-gray-500">Administrateur</div>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-gray-500">Dernière cx: 2h</span>
                    </div>
                  </div>
                </div>
              )}

              {activeDetailTab === 'logs' && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 animate-in fade-in">
                  <h3 className="font-bold text-gray-900 text-sm mb-4">
                    Journaux d'Audit (Tenant)
                  </h3>
                  <div className="space-y-4">
                    {MOCK_AUDIT_LOGS.map((log) => (
                      <div
                        key={log.id}
                        className="flex gap-4 p-3 hover:bg-gray-50 border border-transparent hover:border-gray-100 rounded-lg transition-colors"
                      >
                        <IconActivity className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{log.action}</div>
                          <div className="text-xs text-gray-500">
                            {log.timestamp} - IP: {log.ipAddress}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeDetailTab === 'actions' && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex flex-col gap-4">
                    <h3 className="font-bold text-gray-900 text-sm">Actions Rapides</h3>

                    <button className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors group">
                      <div className="flex items-center gap-3">
                        <IconUsers className="w-5 h-5 text-indigo-500" />
                        <div className="text-left">
                          <div className="text-sm font-bold text-gray-900 group-hover:text-indigo-900">
                            Impersonate Tenant
                          </div>
                          <div className="text-xs text-gray-500">
                            Se connecter en tant qu'administrateur du cabinet
                          </div>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => alert('Changement de plan')}
                      className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <IconSettings className="w-5 h-5 text-blue-500" />
                        <div className="text-left">
                          <div className="text-sm font-bold text-gray-900 group-hover:text-blue-900">
                            Change Plan
                          </div>
                          <div className="text-xs text-gray-500">
                            Mettre à niveau ou downgrader l'abonnement
                          </div>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => alert('Export')}
                      className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <IconDownload className="w-5 h-5 text-emerald-500" />
                        <div className="text-left">
                          <div className="text-sm font-bold text-gray-900 group-hover:text-emerald-900">
                            Export Data
                          </div>
                          <div className="text-xs text-gray-500">
                            Exporter les données conformes (RGPD/CNDP)
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>

                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 flex flex-col gap-4">
                    <h3 className="font-bold text-rose-900 text-sm">Zone de danger</h3>
                    <p className="text-xs text-rose-700">
                      Ces actions ont un impact direct sur la disponibilité du service pour ce
                      client.
                    </p>

                    <div className="flex gap-4">
                      <button
                        onClick={() => handleSuspendToggle(selectedTenant)}
                        className="flex-1 bg-white border border-rose-200 text-rose-700 hover:bg-rose-100 py-2 rounded-lg text-sm font-bold transition-colors"
                      >
                        {selectedTenant.status === 'Active'
                          ? "Suspendre l'accès"
                          : "Réactiver l'accès"}
                      </button>
                      <button className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-2 rounded-lg text-sm font-bold transition-colors shadow-sm">
                        Supprimer définitivement
                      </button>
                    </div>
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
