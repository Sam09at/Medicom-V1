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
  IconMail,
  IconAlertTriangle,
  IconTrendingUp,
  IconZap,
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

// Churn risk is stable per row (not re-randomized per render)
const CHURN_RISK_MAP: Record<string, 'Low' | 'High'> = {};

const getChurnRisk = (id: string): 'Low' | 'High' => {
  if (!CHURN_RISK_MAP[id]) {
    CHURN_RISK_MAP[id] = Math.random() > 0.8 ? 'High' : 'Low';
  }
  return CHURN_RISK_MAP[id];
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

  const [newTenant, setNewTenant] = useState({
    name: '',
    email: '',
    plan: 'Pro',
    region: 'Casablanca',
  });

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
    setSelectedTenant({
      ...selectedTenant,
      enabledModules: {
        ...selectedTenant.enabledModules,
        [moduleKey]: !selectedTenant.enabledModules[moduleKey],
      },
    });
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
          selectedIds.has(t.id) ? { ...t, status: action === 'suspend' ? 'Suspended' : 'Active' } : t
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

  if (loading)
    return (
      <div className="p-8 text-center text-slate-500 text-[13px]">
        Chargement des tenants...
      </div>
    );

  // Detail tabs configuration
  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'billing', label: 'Billing' },
    { id: 'usage', label: 'Usage' },
    { id: 'modules', label: 'Modules' },
    { id: 'users', label: 'Users' },
    { id: 'logs', label: 'Logs' },
    { id: 'actions', label: 'Actions' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold text-slate-900 tracking-tight">
            Gestion des Tenants
          </h1>
          <p className="text-[13px] text-slate-500 mt-0.5">
            {tenants.length} instances cliniques · {tenants.filter((t) => t.status === 'Active').length} actives
          </p>
        </div>
        <button onClick={() => setIsProvisioning(true)} className="sa-btn">
          <IconPlus className="w-4 h-4" /> Provisionner un cabinet
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Tenants Actifs', value: tenants.filter((t) => t.status === 'Active').length, icon: IconZap, badge: null },
          { label: 'MRR Total', value: tenants.reduce((s, t) => s + t.mrr, 0).toLocaleString() + ' MAD', icon: IconTrendingUp, badge: '+8%' },
          { label: 'Utilisateurs', value: tenants.reduce((s, t) => s + t.usersCount, 0), icon: IconUsers, badge: null },
          { label: 'Risque Élevé', value: Object.values(CHURN_RISK_MAP).filter((v) => v === 'High').length, icon: IconAlertTriangle, danger: true },
        ].map(({ label, value, icon: Icon, badge, danger }: any) => (
          <div key={label} className="card p-5 flex flex-col justify-between group">
            <div className="flex items-start justify-between mb-3">
              <div
                className={`w-9 h-9 rounded-[12px] border flex items-center justify-center transition-colors duration-300 ${danger
                    ? 'bg-rose-50 border-rose-100/60 text-rose-500 group-hover:bg-rose-100/60'
                    : 'bg-slate-50 border-slate-100 text-slate-500 group-hover:bg-slate-100'
                  }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              {badge && (
                <span className="badge badge-green gap-1 font-semibold rounded-[30px] px-2 py-0.5 text-[10px]">
                  {badge}
                </span>
              )}
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                {label}
              </div>
              <div className={`text-[22px] font-semibold tracking-tight leading-none ${danger ? 'text-rose-600' : 'text-slate-900'}`}>
                {value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tenant Table */}
      <div className="card overflow-hidden">
        {/* Table toolbar */}
        <div className="px-6 py-3.5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center bg-[#FAFAFA] gap-3">
          <div className="flex gap-1.5">
            {['All', 'Active', 'Suspended'].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 text-[11px] font-semibold rounded-[30px] border transition-all duration-200 ${filter === s
                    ? 'bg-white text-slate-900 border-slate-200/60 shadow-sm'
                    : 'text-slate-400 border-transparent hover:bg-slate-100 hover:text-slate-700'
                  }`}
              >
                {s === 'All' ? 'Tous' : s}
              </button>
            ))}
          </div>

          {selectedIds.size > 0 ? (
            <div className="flex items-center gap-2 bg-blue-50/80 px-3 py-1.5 rounded-[20px] border border-blue-100/60 animate-in fade-in">
              <span className="text-[11px] font-semibold text-[#136cfb]">
                {selectedIds.size} sélectionné(s)
              </span>
              <div className="h-4 w-px bg-blue-200 mx-1" />
              <button onClick={() => handleBulkAction('activate')} className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 px-2">
                Activer
              </button>
              <button onClick={() => handleBulkAction('suspend')} className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 px-2">
                Suspendre
              </button>
              <button onClick={() => handleBulkAction('export')} className="text-[11px] font-semibold text-[#136cfb] hover:text-blue-700 px-2 flex items-center gap-1">
                <IconDownload className="w-3 h-3" /> CSV
              </button>
            </div>
          ) : (
            <div className="relative w-full sm:w-60">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un cabinet..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-8 py-1.5 text-[12px]"
              />
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead>
              <tr className="bg-[#FAFAFA]">
                <th scope="col" className="px-6 py-3.5 text-left w-10">
                  <input
                    type="checkbox"
                    onChange={toggleAll}
                    checked={selectedIds.size === filteredTenants.length && filteredTenants.length > 0}
                    className="w-4 h-4 rounded border-slate-300 text-[#136cfb]"
                  />
                </th>
                {['Tenant', 'Plan', 'Statut', 'Admin', 'Dernière activité', 'MRR', 'Churn Risk', ''].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-6 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {filteredTenants.map((tenant) => (
                <tr
                  key={tenant.id}
                  onClick={() => { setSelectedTenant(tenant); setActiveDetailTab('overview'); }}
                  className={`hover:bg-slate-50/60 transition-colors cursor-pointer ${selectedIds.has(tenant.id) ? 'bg-blue-50/30' : ''
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
                      <div className="h-8 w-8 flex-shrink-0 bg-blue-50 text-[#136cfb] rounded-[8px] flex items-center justify-center font-semibold text-[11px] border border-blue-100/60">
                        {tenant.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-[13px] font-semibold text-slate-900 leading-snug">
                          {tenant.name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {tenant.id.slice(0, 12)}…
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`badge ${tenant.plan === 'Premium' ? 'badge-blue' : 'badge-gray'} rounded-[30px] px-2.5 py-0.5`}>
                      {tenant.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-[30px] border ${tenant.status === 'Active'
                          ? 'bg-emerald-50/80 text-emerald-700 border-emerald-100/60'
                          : 'bg-rose-50/80 text-rose-700 border-rose-100/60'
                        }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${tenant.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      {tenant.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[12px] font-medium text-slate-600">
                    {tenant.contactName}
                  </td>
                  <td className="px-6 py-4 text-[12px] font-medium text-slate-400">
                    Aujourd'hui, 14:30
                  </td>
                  <td className="px-6 py-4 text-[13px] font-semibold text-slate-900">
                    {tenant.mrr.toLocaleString()} <span className="text-[11px] font-medium text-slate-400">MAD</span>
                  </td>
                  <td className="px-6 py-4">
                    {(() => {
                      const risk = getChurnRisk(tenant.id);
                      return (
                        <span className={`badge rounded-[30px] px-2.5 py-0.5 ${risk === 'High' ? 'badge-orange' : 'badge-green'}`}>
                          {risk}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedTenant(tenant); setActiveDetailTab('overview'); }}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-slate-300 hover:text-[#136cfb] hover:bg-blue-50 transition-all"
                    >
                      <IconSettings className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredTenants.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-[13px] text-slate-400">
                    Aucun cabinet trouvé pour ce filtre.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Detail SlideOver ── */}
      <SlideOver
        isOpen={!!selectedTenant}
        onClose={() => setSelectedTenant(null)}
        title={selectedTenant?.name || ''}
        subtitle={`Tenant · ${selectedTenant?.id}`}
        width="xl"
      >
        {selectedTenant && (
          <div className="flex flex-col h-full">

            {/* Status header strip */}
            <div className="flex items-center gap-3 px-6 py-3 border-b border-slate-100 bg-[#FAFAFA]">
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-[30px] border ${selectedTenant.status === 'Active'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100/60'
                  : 'bg-rose-50 text-rose-700 border-rose-100/60'
                }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${selectedTenant.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                {selectedTenant.status}
              </span>
              <span className="badge badge-gray rounded-[30px] px-2.5 py-0.5">{selectedTenant.plan}</span>
              <span className="text-[11px] text-slate-400 font-medium ml-auto">{selectedTenant.region}</span>
            </div>

            {/* Tabs */}
            <div className="flex bg-white border-b border-slate-100 px-4 overflow-x-auto scrollbar-hide">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveDetailTab(tab.id)}
                  className={`px-4 py-3 text-[12px] font-semibold transition-all whitespace-nowrap border-b-2 -mb-px ${activeDetailTab === tab.id
                      ? 'border-slate-900 text-slate-900'
                      : 'border-transparent text-slate-400 hover:text-slate-700'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">

              {/* ── OVERVIEW ── */}
              {activeDetailTab === 'overview' && (
                <div className="space-y-5 animate-in fade-in duration-200">

                  {/* KPI row */}
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'MRR', value: `${selectedTenant.mrr.toLocaleString()} MAD`, sub: 'Revenu mensuel' },
                      { label: 'Utilisateurs', value: selectedTenant.usersCount, sub: 'Comptes actifs' },
                      { label: 'Stockage', value: selectedTenant.storageUsed, sub: 'Données hébergées' },
                    ].map(({ label, value, sub }) => (
                      <div key={label} className="card p-4 flex flex-col justify-between">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                          {label}
                        </div>
                        <div className="text-[20px] font-semibold text-slate-900 tracking-tight leading-none">
                          {value}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1.5">{sub}</div>
                      </div>
                    ))}
                  </div>

                  {/* Info card */}
                  <div className="card p-5">
                    <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                      Informations du compte
                    </h3>
                    <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
                      {[
                        { label: 'Contact', value: selectedTenant.contactName },
                        { label: 'Email', value: selectedTenant.email, mono: false, link: true },
                        { label: 'Région', value: selectedTenant.region },
                        { label: 'Inscrit le', value: selectedTenant.joinedAt },
                        { label: 'Tenant ID', value: selectedTenant.id, mono: true },
                        { label: 'Plan', value: selectedTenant.plan },
                      ].map(({ label, value, mono, link }) => (
                        <div key={label}>
                          <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                            {label}
                          </dt>
                          <dd className={`text-[13px] font-medium text-slate-900 mt-0.5 ${mono ? 'font-mono text-[11px] text-slate-500' : ''} ${link ? 'text-[#136cfb]' : ''}`}>
                            {value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>

                  {/* Usage mini preview */}
                  <div className="card p-5">
                    <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                      Activité récente
                    </h3>
                    <div className="space-y-3">
                      {[
                        { label: 'Rendez-vous créés', value: 142, max: 200 },
                        { label: 'Patients enregistrés', value: 89, max: 150 },
                        { label: 'Stockage utilisé', value: 60, max: 100, suffix: '%' },
                      ].map(({ label, value, max, suffix }) => (
                        <div key={label}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[12px] font-medium text-slate-700">{label}</span>
                            <span className="text-[12px] font-semibold text-slate-900">
                              {value}{suffix || `/${max}`}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#136cfb] rounded-full transition-all duration-500"
                              style={{ width: `${(value / max) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── BILLING ── */}
              {activeDetailTab === 'billing' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="card p-5">
                    <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                      Abonnement actuel
                    </h3>
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <div className="text-[14px] font-semibold text-slate-900">{selectedTenant.plan} Plan</div>
                        <div className="text-[12px] text-slate-400 mt-0.5">Facturation mensuelle · Prochaine échéance dans 12 jours</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[20px] font-semibold text-slate-900">{selectedTenant.mrr.toLocaleString()}</div>
                        <div className="text-[11px] text-slate-400">MAD / mois</div>
                      </div>
                    </div>
                  </div>
                  <div className="card overflow-hidden">
                    <div className="px-5 py-3 bg-[#FAFAFA] border-b border-slate-100">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Historique des paiements</span>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {[
                        { date: '01 Fév 2026', amount: selectedTenant.mrr, status: 'Payé' },
                        { date: '01 Jan 2026', amount: selectedTenant.mrr, status: 'Payé' },
                        { date: '01 Déc 2025', amount: selectedTenant.mrr, status: 'Payé' },
                      ].map((inv) => (
                        <div key={inv.date} className="px-5 py-3.5 flex items-center justify-between">
                          <div>
                            <div className="text-[13px] font-medium text-slate-900">{inv.date}</div>
                            <div className="text-[11px] text-slate-400">Facture mensuelle</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="badge badge-green rounded-[30px] px-2.5">
                              <IconCheck className="w-3 h-3 mr-1" />{inv.status}
                            </span>
                            <span className="text-[13px] font-semibold text-slate-700">
                              {inv.amount.toLocaleString()} MAD
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── USAGE ── */}
              {activeDetailTab === 'usage' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="card p-5">
                    <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                      Consommation des ressources
                    </h3>
                    <div className="space-y-5">
                      {[
                        { label: 'Rendez-vous', used: 142, total: 200, color: 'bg-[#136cfb]' },
                        { label: 'Patients enregistrés', used: 89, total: 150, color: 'bg-emerald-500' },
                        { label: 'Stockage (GB)', used: 1.2, total: 5, color: 'bg-orange-400' },
                        { label: 'Utilisateurs actifs', used: selectedTenant.usersCount, total: 10, color: 'bg-purple-500' },
                        { label: 'Emails envoyés', used: 340, total: 1000, color: 'bg-slate-400' },
                      ].map(({ label, used, total, color }) => (
                        <div key={label}>
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[13px] font-medium text-slate-700">{label}</span>
                            <span className="text-[12px] text-slate-400">
                              <span className="font-semibold text-slate-900">{used}</span> / {total}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${color} rounded-full transition-all duration-500`}
                              style={{ width: `${Math.min((Number(used) / Number(total)) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── MODULES ── */}
              {activeDetailTab === 'modules' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-start gap-3 bg-blue-50 border border-blue-100/60 rounded-[12px] p-4">
                    <IconLock className="w-4 h-4 text-[#136cfb] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[12px] font-semibold text-[#136cfb]">Contrôle granulaire des fonctionnalités</p>
                      <p className="text-[12px] text-blue-700/70 mt-0.5">
                        Les changements sont appliqués instantanément à l'interface du cabinet.
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
                          className="px-5 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
                        >
                          <div>
                            <div className="text-[13px] font-medium text-slate-900">
                              {MODULE_LABELS[moduleKey]}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                              module.{key}
                            </div>
                          </div>
                          <button
                            onClick={() => toggleModule(moduleKey)}
                            className={`transition-all duration-200 ${isEnabled ? 'text-[#136cfb]' : 'text-slate-200 hover:text-slate-300'}`}
                          >
                            {isEnabled ? (
                              <IconToggleRight className="w-9 h-9" />
                            ) : (
                              <IconToggleLeft className="w-9 h-9" />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── USERS ── */}
              {activeDetailTab === 'users' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="card overflow-hidden">
                    <div className="px-5 py-3 bg-[#FAFAFA] border-b border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                        {selectedTenant.usersCount} Utilisateur(s)
                      </span>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {/* Admin user */}
                      <div className="px-5 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 bg-blue-50 text-[#136cfb] rounded-full flex items-center justify-center font-semibold text-[12px] border border-blue-100/60">
                            {selectedTenant.contactName.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-[13px] font-semibold text-slate-900">
                              {selectedTenant.contactName}
                            </div>
                            <div className="text-[11px] text-slate-400">{selectedTenant.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="badge badge-blue rounded-[30px] px-2.5">Admin</span>
                          <span className="text-[11px] text-slate-400">il y a 2h</span>
                        </div>
                      </div>
                      {/* Placeholder rows */}
                      {Array.from({ length: Math.max(0, selectedTenant.usersCount - 1) }).map((_, i) => (
                        <div key={i} className="px-5 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center font-semibold text-[12px]">
                              U{i + 2}
                            </div>
                            <div>
                              <div className="text-[13px] font-medium text-slate-700">Utilisateur {i + 2}</div>
                              <div className="text-[11px] text-slate-400">user{i + 2}@cabinet.ma</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="badge badge-gray rounded-[30px] px-2.5">Praticien</span>
                            <span className="text-[11px] text-slate-400">il y a {(i + 1) * 3}h</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── LOGS ── */}
              {activeDetailTab === 'logs' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="card overflow-hidden">
                    <div className="px-5 py-3 bg-[#FAFAFA] border-b border-slate-100">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Journal d'audit</span>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {MOCK_AUDIT_LOGS.map((log) => (
                        <div key={log.id} className="px-5 py-4 flex gap-3 hover:bg-slate-50/50 transition-colors">
                          <div className="w-7 h-7 shrink-0 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mt-0.5">
                            <IconActivity className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="text-[13px] font-medium text-slate-900">{log.action}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {log.timestamp} · <span className="font-mono">{log.ipAddress}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── ACTIONS ── */}
              {activeDetailTab === 'actions' && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  {/* Quick actions */}
                  <div className="card overflow-hidden divide-y divide-slate-100">
                    <div className="px-5 py-3 bg-[#FAFAFA] border-b border-slate-100">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Actions rapides</span>
                    </div>
                    {[
                      {
                        icon: IconUsers,
                        title: 'Impersonate Tenant',
                        desc: 'Se connecter en tant qu\'administrateur du cabinet',
                        color: 'text-[#136cfb]',
                        bg: 'bg-blue-50 border-blue-100/60',
                      },
                      {
                        icon: IconSettings,
                        title: 'Changer de plan',
                        desc: 'Mettre à niveau ou downgrader l\'abonnement',
                        color: 'text-purple-600',
                        bg: 'bg-purple-50 border-purple-100/60',
                      },
                      {
                        icon: IconMail,
                        title: 'Envoyer un email',
                        desc: 'Contacter directement l\'administrateur du cabinet',
                        color: 'text-emerald-600',
                        bg: 'bg-emerald-50 border-emerald-100/60',
                      },
                      {
                        icon: IconDownload,
                        title: 'Exporter les données',
                        desc: 'Exporter les données conformes (RGPD/CNDP)',
                        color: 'text-slate-600',
                        bg: 'bg-slate-50 border-slate-100',
                      },
                    ].map(({ icon: Icon, title, desc, color, bg }) => (
                      <button
                        key={title}
                        className="w-full px-5 py-4 flex items-center gap-4 hover:bg-slate-50/60 transition-colors text-left group"
                      >
                        <div className={`w-9 h-9 rounded-[10px] border flex items-center justify-center shrink-0 ${bg} ${color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-[13px] font-semibold text-slate-900 group-hover:text-slate-700">
                            {title}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Danger zone */}
                  <div className="border border-rose-100 rounded-[12px] overflow-hidden">
                    <div className="px-5 py-3 bg-rose-50/60 border-b border-rose-100">
                      <span className="text-[11px] font-bold text-rose-400 uppercase tracking-widest">Zone dangereuse</span>
                    </div>
                    <div className="p-5 space-y-4 bg-white">
                      <p className="text-[12px] text-slate-500">
                        Ces actions ont un impact direct sur la disponibilité du service. Irréversibles pour la suppression.
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleSuspendToggle(selectedTenant)}
                          className="sa-btn-danger flex-1"
                        >
                          {selectedTenant.status === 'Active' ? "Suspendre l'accès" : "Réactiver l'accès"}
                        </button>
                        <button
                          onClick={() => alert('Suppression confirmée — non implémentée en prod')}
                          className="flex-1 inline-flex items-center justify-center gap-2 text-[13px] font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-[30px] px-4 py-2.5 transition-all duration-200"
                        >
                          <IconX className="w-4 h-4" /> Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </SlideOver>

      {/* Provisioning Modal */}
      {isProvisioning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
            onClick={() => setIsProvisioning(false)}
          />
          <div className="bg-white rounded-[20px] w-full max-w-md relative z-10 border border-slate-200/60 overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-slate-100">
              <h2 className="text-[16px] font-semibold text-slate-900 tracking-tight">
                Provisionner un cabinet
              </h2>
              <p className="text-[12px] text-slate-400 mt-0.5">
                Une instance Medicom sera créée et configurée automatiquement.
              </p>
            </div>
            <form onSubmit={handleCreateTenant} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Nom du cabinet
                </label>
                <input
                  type="text"
                  placeholder="Cabinet Dr. Alami"
                  className="input"
                  value={newTenant.name}
                  onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Email administrateur
                </label>
                <input
                  type="email"
                  placeholder="admin@cabinet.ma"
                  className="input"
                  value={newTenant.email}
                  onChange={(e) => setNewTenant({ ...newTenant, email: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Plan
                  </label>
                  <select
                    className="input appearance-none"
                    value={newTenant.plan}
                    onChange={(e) => setNewTenant({ ...newTenant, plan: e.target.value })}
                  >
                    <option>Starter</option>
                    <option>Pro</option>
                    <option>Premium</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Région
                  </label>
                  <select
                    className="input appearance-none"
                    value={newTenant.region}
                    onChange={(e) => setNewTenant({ ...newTenant, region: e.target.value })}
                  >
                    <option>Casablanca</option>
                    <option>Rabat</option>
                    <option>Marrakech</option>
                    <option>Fès</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsProvisioning(false)} className="sa-btn-ghost">
                  Annuler
                </button>
                <button type="submit" className="sa-btn">
                  <IconCheck className="w-4 h-4" /> Provisionner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
