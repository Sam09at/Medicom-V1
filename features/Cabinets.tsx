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
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold text-slate-900 tracking-tight">Gestion des Tenants</h1>
          <p className="text-[13px] text-slate-500 mt-0.5">
            Supervision et configuration des instances cliniques.
          </p>
        </div>
        <button
          onClick={() => setIsProvisioning(true)}
          className="btn-primary"
        >
          <IconPlus className="w-4 h-4" /> Provisionner
        </button>
      </div>

      {/* Tenant List */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center bg-[#FAFAFA] gap-4">
          <div className="flex gap-2">
            {['All', 'Active', 'Suspended'].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 text-[11px] font-semibold rounded-[30px] border transition-all ${filter === s
                    ? 'bg-white text-slate-900 border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
                    : 'text-slate-400 border-transparent hover:bg-slate-100 hover:text-slate-700'
                  }`}
              >
                {s === 'All' ? 'Tous' : s}
              </button>
            ))}
          </div>

          {selectedIds.size > 0 ? (
            <div className="flex items-center gap-2 bg-blue-50/80 px-3 py-1.5 rounded-[8px] border border-blue-100/60 animate-in fade-in">
              <span className="text-[11px] font-semibold text-[#136cfb]">
                {selectedIds.size} sélectionné(s)
              </span>
              <div className="h-4 w-px bg-blue-200 mx-1"></div>
              <button
                onClick={() => handleBulkAction('activate')}
                className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 px-2"
              >
                Activer
              </button>
              <button
                onClick={() => handleBulkAction('suspend')}
                className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 px-2"
              >
                Suspendre
              </button>
              <button
                onClick={() => handleBulkAction('export')}
                className="text-[11px] font-semibold text-[#136cfb] hover:text-blue-700 px-2 flex items-center gap-1"
              >
                <IconDownload className="w-3 h-3" /> CSV
              </button>
            </div>
          ) : (
            <div className="relative w-full sm:w-64">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-9 py-1.5"
              />
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead>
              <tr className="bg-[#FAFAFA]">
                <th scope="col" className="px-6 py-3.5 text-left">
                  <input
                    type="checkbox"
                    onChange={toggleAll}
                    checked={
                      selectedIds.size === filteredTenants.length && filteredTenants.length > 0
                    }
                    className="w-4 h-4 rounded border-slate-300 text-[#136cfb]"
                  />
                </th>
                <th scope="col" className="px-6 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Tenant</th>
                <th scope="col" className="px-6 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Plan</th>
                <th scope="col" className="px-6 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Statut</th>
                <th scope="col" className="px-6 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Admin</th>
                <th scope="col" className="px-6 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Dernière activité</th>
                <th scope="col" className="px-6 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">MRR</th>
                <th scope="col" className="px-6 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Churn Risk</th>
                <th scope="col" className="relative px-6 py-3.5"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {filteredTenants.map((tenant) => (
                <tr
                  key={tenant.id}
                  onClick={() => setSelectedTenant(tenant)}
                  className={`hover:bg-slate-50/60 transition-colors cursor-pointer group ${selectedIds.has(tenant.id) ? 'bg-blue-50/40' : ''
                    }`}
                >
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(tenant.id)}
                      onChange={(e) => toggleSelection(tenant.id, e as any)}
                      className="w-4 h-4 rounded border-slate-200 text-[#136cfb]"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 flex-shrink-0 bg-blue-50 text-[#136cfb] rounded-[6px] flex items-center justify-center font-semibold text-[11px] border border-blue-100/60">
                        {tenant.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-[13px] font-semibold text-slate-900">{tenant.name}</div>
                        <div className="text-[11px] text-slate-400 font-medium">
                          {tenant.id.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`badge ${tenant.plan === 'Premium' ? 'badge-blue' : 'badge-gray'
                      }`}>
                      {tenant.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-[30px] border ${tenant.status === 'Active'
                        ? 'bg-emerald-50/80 text-emerald-700 border-emerald-100/60'
                        : 'bg-rose-50/80 text-rose-700 border-rose-100/60'
                      }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${tenant.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'
                        }`} />
                      {tenant.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[12px] font-medium text-slate-600">
                    <div className="flex items-center gap-1">
                      <IconShield className="w-3 h-3 text-slate-300" />
                      {tenant.contactName}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[12px] font-medium text-slate-400">
                    Aujourd'hui, 14:30
                  </td>
                  <td className="px-6 py-4 text-[13px] font-semibold text-slate-900">
                    {tenant.mrr.toLocaleString()} MAD
                  </td>
                  <td className="px-6 py-4">
                    <span className={`badge ${Math.random() > 0.8 ? 'badge-orange' : 'badge-green'
                      }`}>
                      {Math.random() > 0.8 ? 'High' : 'Low'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTenant(tenant);
                      }}
                      className="text-slate-300 hover:text-[#136cfb] p-2 transition-colors"
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
          <div className="flex flex-col h-full bg-[#FAFAFA]">
            <div className="flex bg-white border-b border-slate-100 px-6 overflow-x-auto">
              {['overview', 'billing', 'usage', 'users', 'logs', 'actions'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveDetailTab(tab)}
                  className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${activeDetailTab === tab
                      ? 'border-[#136cfb] text-[#136cfb]'
                      : 'border-transparent text-slate-400 hover:text-slate-900'
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {activeDetailTab === 'overview' && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="card p-5">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">MRR</div>
                      <div className="text-[22px] font-semibold text-slate-900 tracking-tight">{selectedTenant.mrr.toLocaleString()} MAD</div>
                    </div>
                    <div className="card p-5">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Utilisateurs</div>
                      <div className="text-[22px] font-semibold text-slate-900 tracking-tight">{selectedTenant.usersCount}</div>
                    </div>
                    <div className="card p-5">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Stockage</div>
                      <div className="text-[22px] font-semibold text-slate-900 tracking-tight">{selectedTenant.storageUsed}</div>
                    </div>
                  </div>
                  <div className="card p-6">
                    <h3 className="text-[13px] font-semibold text-slate-900 mb-4">Informations</h3>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                      <div>
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Contact</label>
                        <p className="text-[13px] font-medium text-slate-900 mt-0.5">{selectedTenant.contactName}</p>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Email</label>
                        <p className="text-[13px] font-medium text-slate-900 mt-0.5">{selectedTenant.email}</p>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Région</label>
                        <p className="text-[13px] font-medium text-slate-900 mt-0.5">{selectedTenant.region}</p>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Inscrit le</label>
                        <p className="text-[13px] font-medium text-slate-900 mt-0.5">{selectedTenant.joinedAt}</p>
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

                  <div className="card overflow-hidden divide-y divide-slate-100">
                    {Object.keys(MODULE_LABELS).map((key) => {
                      const moduleKey = key as keyof ModuleConfiguration;
                      const isEnabled = selectedTenant.enabledModules[moduleKey];
                      return (
                        <div
                          key={key}
                          className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors"
                        >
                          <div>
                            <div className="text-[13px] font-medium text-slate-900">
                              {MODULE_LABELS[moduleKey]}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                              module.{key}
                            </div>
                          </div>
                          <button
                            onClick={() => toggleModule(moduleKey)}
                            className={`transition-all ${isEnabled ? 'text-[#136cfb]' : 'text-slate-200 hover:text-slate-300'
                              }`}
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
                <div className="card p-6 animate-in fade-in">
                  <h3 className="text-[13px] font-semibold text-slate-900 mb-4">Utilisateurs du Cabinet</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-[6px] border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-blue-50 text-[#136cfb] rounded-full flex items-center justify-center font-semibold text-[11px]">
                          {selectedTenant.contactName.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-[13px] font-medium text-slate-900">{selectedTenant.contactName}</div>
                          <div className="text-[11px] text-slate-400">Administrateur</div>
                        </div>
                      </div>
                      <span className="text-[11px] font-medium text-slate-400">Dernière cx: 2h</span>
                    </div>
                  </div>
                </div>
              )}

              {activeDetailTab === 'logs' && (
                <div className="card p-6 animate-in fade-in">
                  <h3 className="text-[13px] font-semibold text-slate-900 mb-4">Journaux d'Audit</h3>
                  <div className="space-y-0 divide-y divide-slate-100">
                    {MOCK_AUDIT_LOGS.map((log) => (
                      <div
                        key={log.id}
                        className="flex gap-3 py-3 hover:bg-slate-50/60 transition-colors"
                      >
                        <IconActivity className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" />
                        <div>
                          <div className="text-[13px] font-medium text-slate-900">{log.action}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {log.timestamp} · IP: {log.ipAddress}
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

                    <button className="flex items-center justify-between p-4 rounded-[8px] border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors group">
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
                      className="flex items-center justify-between p-4 rounded-[8px] border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
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
                      className="flex items-center justify-between p-4 rounded-[8px] border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-colors group"
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
                        className="flex-1 bg-white border border-rose-200 text-rose-700 hover:bg-rose-100 py-2 rounded-[8px] text-sm font-bold transition-colors"
                      >
                        {selectedTenant.status === 'Active'
                          ? "Suspendre l'accès"
                          : "Réactiver l'accès"}
                      </button>
                      <button className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-2 rounded-[8px] text-sm font-bold transition-colors shadow-sm">
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
