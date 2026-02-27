import React, { useState, useEffect } from 'react';
import { ModernUserTable } from '../components/ModernUserTable';
import { SlideOver } from '../components/SlideOver';
import {
  MOCK_SAAS_USERS,
  MOCK_WEBHOOKS,
  MOCK_API_METRICS,
  MOCK_JOBS,
  MOCK_APP_ERRORS,
  MOCK_SECURITY_EVENTS,
  MOCK_PLANS,
  MOCK_FLAGS,
  MOCK_BROADCASTS,
  MOCK_REGIONS,
  MOCK_CACHE_METRICS,
  MOCK_QUEUES,
  MOCK_DEPLOYMENTS,
  MOCK_COMPLIANCE,
  MOCK_AUDIT_LOGS,
  MOCK_FEATURE_REQUESTS,
  MOCK_ADDONS,
  MOCK_BACKUPS,
  MOCK_AI_CONFIGS,
  MOCK_CHURN_RISK,
  MOCK_TEMPLATES,
  MOCK_CONTENT,
  MOCK_TRANSLATIONS,
} from '../constants';
import {
  IconActivity,
  IconDatabase,
  IconShield,
  IconCode,
  IconRefresh,
  IconAlertTriangle,
  IconCheckCircle,
  IconZap,
  IconPlus,
  IconTrash,
  IconEdit,
  IconMegaphone,
  IconUsers,
  IconCreditCard,
  IconMail,
  IconFlag,
  IconBroadcast,
  IconServer,
  IconMap,
  IconScale,
  IconCheck,
  IconGlobe,
  IconWand,
  IconShoppingBag,
  IconTrendingUp,
  IconHardDrive,
  IconDownload,
  IconPlay,
  IconMoreHorizontal,
  IconX,
  IconSend,
  IconFileText,
  IconEye,
  IconMessage,
} from '../components/Icons';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import { BroadcastMessage, EmailTemplate } from '../types';
import { supabase } from '../lib/supabase';
import { getPlatformMRR, getActiveTenantsCount } from '../lib/api/saas/analytics';
import { getChurnRiskTenants } from '../lib/api/saas/analytics';

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

export const SaaSUsersPage = () => {
  const [users, setUsers] = useState(MOCK_SAAS_USERS);

  useEffect(() => {
    const loadUsers = async () => {
      if (!supabase) return;
      try {
        const { data } = await supabase
          .from('users')
          .select('id, first_name, last_name, email, role, tenant_id, updated_at')
          .order('updated_at', { ascending: false });
        if (data && data.length > 0) {
          setUsers(
            data.map((u: any) => ({
              id: u.id,
              name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
              email: u.email,
              role: u.role,
              clinic: u.tenant_id || 'N/A',
              lastLogin: u.updated_at ? new Date(u.updated_at).toLocaleDateString('fr-FR') : 'N/A',
              status: 'Active' as const,
            }))
          );
        }
      } catch {
        /* fallback to mock */
      }
    };
    loadUsers();
  }, []);

  const toggleUserStatus = (id: string) => {
    setUsers(
      users.map((u) =>
        u.id === id ? { ...u, status: u.status === 'Active' ? 'Locked' : 'Active' } : u
      )
    );
  };
  return <ModernUserTable users={users} onToggleStatus={toggleUserStatus} />;
};

export const ContentManagementPage = () => {
  const [activeTab, setActiveTab] = useState<'templates' | 'pages' | 'translations'>('templates');
  const [templates, setTemplates] = useState(MOCK_TEMPLATES);
  const [pages, setPages] = useState(MOCK_CONTENT);
  const [translations, setTranslations] = useState(MOCK_TRANSLATIONS);

  // Editor State
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [templateBody, setTemplateBody] = useState('');

  const handleEditTemplate = (tmpl: EmailTemplate) => {
    setEditingTemplate(tmpl);
    setTemplateBody(
      `Bonjour {userName},\n\nCeci est le contenu du modèle "${tmpl.name}".\n\nCordialement,\nL'équipe Medicom.`
    );
  };

  const handleSaveTemplate = () => {
    if (editingTemplate) {
      setTemplates(
        templates.map((t) => (t.id === editingTemplate.id ? { ...t, lastModified: 'Just now' } : t))
      );
      setEditingTemplate(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-6">
        <div>
          <h3 className="text-[18px] font-semibold text-slate-900 tracking-tight">Content Management System</h3>
          <p className="text-[13px] text-slate-500 mt-1">
            Gérez les communications, pages légales et traductions
          </p>
        </div>
        <div className="flex bg-slate-100/80 p-1 rounded-[8px] border border-slate-200/60 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-1.5 text-[13px] font-medium rounded-[6px] transition-all ${activeTab === 'templates' ? 'bg-white text-slate-900 shadow-[0_1px_3px_rgba(0,0,0,0.05)]' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Templates (Email/SMS)
          </button>
          <button
            onClick={() => setActiveTab('pages')}
            className={`px-4 py-1.5 text-[13px] font-medium rounded-[6px] transition-all ${activeTab === 'pages' ? 'bg-white text-slate-900 shadow-[0_1px_3px_rgba(0,0,0,0.05)]' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Pages Légales
          </button>
          <button
            onClick={() => setActiveTab('translations')}
            className={`px-4 py-1.5 text-[13px] font-medium rounded-[6px] transition-all ${activeTab === 'translations' ? 'bg-white text-slate-900 shadow-[0_1px_3px_rgba(0,0,0,0.05)]' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Traductions
          </button>
        </div>
      </div>

      {/* TEMPLATES TAB */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((tmpl) => (
            <div
              key={tmpl.id}
              className="bg-white border border-slate-200/60 rounded-[12px] p-5 shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-shadow group"
            >
              <div className="flex justify-between items-start mb-4">
                <div
                  className={`p-2.5 rounded-[8px] border ${tmpl.type === 'Email' ? 'bg-blue-50/50 text-blue-600 border-blue-100/50' : 'bg-emerald-50/50 text-emerald-600 border-emerald-100/50'}`}
                >
                  {tmpl.type === 'Email' ? (
                    <IconMail className="w-5 h-5" />
                  ) : (
                    <IconMessage className="w-5 h-5" />
                  )}
                </div>
                <button
                  onClick={() => handleEditTemplate(tmpl)}
                  className="text-slate-400 hover:text-blue-600 transition-colors"
                >
                  <IconEdit className="w-4 h-4" />
                </button>
              </div>
              <h4 className="font-bold text-slate-900 text-[14px] mb-1.5">{tmpl.name}</h4>
              <p className="text-[12px] text-slate-500 mb-4 truncate font-medium">Sujet: {tmpl.subject}</p>
              <div className="pt-4 border-t border-slate-100 text-[11px] font-medium text-slate-400 flex justify-between items-center">
                <span>Modifié: {tmpl.lastModified}</span>
                <span className="uppercase tracking-wider font-bold bg-slate-50 px-2 py-1 rounded-[4px] border border-slate-100/80">
                  {tmpl.type}
                </span>
              </div>
            </div>
          ))}
          <button className="border-2 border-dashed border-slate-200/80 rounded-[12px] p-6 flex flex-col items-center justify-center text-slate-400 hover:border-blue-400/50 hover:bg-slate-50 hover:text-blue-600 transition-all cursor-pointer">
            <IconPlus className="w-8 h-8 mb-2" />
            <span className="font-medium text-[13px]">Nouveau Modèle</span>
          </button>
        </div>
      )}

      {/* PAGES TAB */}
      {activeTab === 'pages' && (
        <div className="bg-white border border-slate-200/60 rounded-[12px] shadow-[0_2px_4px_rgba(0,0,0,0.02)] overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200/60">
            <thead className="bg-[#FAFAFA]">
              <tr>
                <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Titre
                </th>
                <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Slug URL
                </th>
                <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Dernière MàJ
                </th>
                <th className="px-6 py-3.5 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3.5 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60">
              {pages.map((page) => (
                <tr key={page.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <IconFileText className="w-4 h-4 text-slate-400" />
                    <span className="text-[13px] font-medium text-slate-900">{page.title}</span>
                  </td>
                  <td className="px-6 py-4 text-[12px] font-mono text-slate-500">{page.slug}</td>
                  <td className="px-6 py-4 text-[13px] text-slate-500">{page.lastUpdated}</td>
                  <td className="px-6 py-4 text-right">
                    <span
                      className={`px-2 py-1 rounded-[4px] border text-[10px] font-bold uppercase ${page.status === 'Published'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100/50'
                        : 'bg-yellow-50 text-yellow-700 border-yellow-100/50'
                        }`}
                    >
                      {page.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-slate-400 hover:text-blue-600 transition-colors mx-1.5 cursor-pointer">
                      <IconEdit className="w-4 h-4" />
                    </button>
                    <button className="text-slate-400 hover:text-slate-600 transition-colors mx-1.5 cursor-pointer">
                      <IconEye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TRANSLATIONS TAB */}
      {activeTab === 'translations' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {translations.map((mod) => (
              <div
                key={mod.id}
                className="bg-white border border-slate-200/60 rounded-[12px] p-5 shadow-[0_2px_4px_rgba(0,0,0,0.02)]"
              >
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-[14px] text-slate-900 tracking-tight">{mod.name}</h4>
                  <IconGlobe className="w-4 h-4 text-slate-400" />
                </div>
                <div className="mb-2 flex justify-between text-[11px] font-semibold text-slate-500">
                  <span>Progression</span>
                  <span>{mod.progress}%</span>
                </div>
                <div className="w-full bg-slate-100 border border-slate-200/50 rounded-full h-1.5 mb-5 shadow-inner">
                  <div
                    className={`h-full rounded-full ${mod.progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                    style={{ width: `${mod.progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-slate-100/80 text-[12px] font-medium">
                  <span className="text-slate-500">{mod.keys} clés</span>
                  <button className="text-blue-600 font-bold hover:text-blue-700 hover:underline transition-all">Gérer</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Template SlideOver */}
      <SlideOver
        isOpen={!!editingTemplate}
        onClose={() => setEditingTemplate(null)}
        title={`Éditer ${editingTemplate?.name}`}
        subtitle={
          editingTemplate?.type === 'Email' ? 'Format HTML supporté' : 'Texte brut uniquement'
        }
      >
        {editingTemplate && (
          <div className="p-6 space-y-6 flex flex-col h-full bg-[#FAFAFA]">
            <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Sujet</label>
              <input
                type="text"
                className="w-full border border-slate-200/60 rounded-[8px] p-2.5 text-[14px] bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none shadow-sm transition-all"
                defaultValue={editingTemplate.subject}
              />
            </div>
            <div className="flex-1 flex flex-col min-h-0">
              <label className="block text-[13px] font-bold text-slate-700 mb-1.5">
                Corps du message
              </label>
              <textarea
                className="w-full flex-1 border border-slate-200/60 rounded-[8px] p-3 text-[13px] font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-slate-50 shadow-inner resize-none transition-all leading-relaxed"
                value={templateBody}
                onChange={(e) => setTemplateBody(e.target.value)}
              />
              <p className="mt-3 text-[11px] font-medium text-slate-500 flex flex-wrap gap-1.5 items-center">
                Variables disponibles:
                <code className="bg-slate-200/60 text-slate-700 font-bold px-1.5 py-0.5 rounded-[4px]">{`{userName}`}</code>
                <code className="bg-slate-200/60 text-slate-700 font-bold px-1.5 py-0.5 rounded-[4px]">{`{clinicName}`}</code>
                <code className="bg-slate-200/60 text-slate-700 font-bold px-1.5 py-0.5 rounded-[4px]">{`{actionUrl}`}</code>
              </p>
            </div>
            <div className="pt-4 flex gap-3 border-t border-slate-200/60 mt-auto">
              <button
                onClick={() => setEditingTemplate(null)}
                className="flex-1 py-2 text-[13px] font-bold text-slate-700 border border-slate-200/60 rounded-[8px] hover:bg-slate-100 transition-colors shadow-sm bg-white cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveTemplate}
                className="flex-1 py-2 text-[13px] font-bold text-white bg-slate-900 rounded-[8px] hover:bg-slate-800 transition-colors shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex justify-center items-center gap-2 cursor-pointer"
              >
                <IconCheckCircle className="w-4 h-4" /> Sauvegarder
              </button>
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  );
};

export const FinancePage = () => {
  const [mrr, setMrr] = useState(35200);
  const [mrrGrowth, setMrrGrowth] = useState(12);
  const [activeTenants, setActiveTenants] = useState(0);
  const [arpu, setArpu] = useState(850);

  useEffect(() => {
    const load = async () => {
      try {
        const mrrData = await getPlatformMRR();
        setMrr(mrrData.currentMRR);
        setMrrGrowth(mrrData.growth);
        const count = await getActiveTenantsCount();
        setActiveTenants(count);
        if (count > 0) setArpu(Math.round(mrrData.currentMRR / count));
      } catch {
        /* fallback */
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[12px] border border-slate-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between h-32">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
            MRR (Mensuel)
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">{mrr.toLocaleString()}</span>
            <span
              className={`text-[11px] font-bold px-2 py-1 rounded-[4px] border ${mrrGrowth >= 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-100/50' : 'bg-red-50 text-red-700 border-red-100/50'}`}
            >
              {mrrGrowth >= 0 ? '+' : ''}
              {mrrGrowth}%
            </span>
          </div>
          <div className="text-[12px] text-slate-400 font-medium">MAD Recurring Revenue</div>
        </div>
        <div className="bg-white p-6 rounded-[12px] border border-slate-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between h-32">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">ARPU</div>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">{arpu.toLocaleString()}</span>
            <span className="text-[11px] font-bold px-2 py-1 rounded-[4px] border bg-emerald-50 text-emerald-700 border-emerald-100/50">
              +5%
            </span>
          </div>
          <div className="text-[12px] text-slate-400 font-medium">
            Revenu moyen par cabinet ({activeTenants} actifs)
          </div>
        </div>
        <div className="bg-white p-6 rounded-[12px] border border-slate-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between h-32">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Churn Rate</div>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">1.2%</span>
            <span className="text-[11px] font-bold px-2 py-1 rounded-[4px] border bg-red-50 text-red-700 border-red-100/50">
              +0.1%
            </span>
          </div>
          <div className="text-[12px] text-slate-400 font-medium">Taux de désabonnement</div>
        </div>
      </div>

      <div className="bg-white border border-slate-200/60 rounded-[12px] shadow-[0_2px_8px_rgba(0,0,0,0.02)] p-6">
        <h3 className="text-[14px] font-bold text-slate-900 mb-6">Plans d'abonnement</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {MOCK_PLANS.map((plan) => (
            <div
              key={plan.id}
              className="border border-slate-200/60 rounded-[8px] p-5 hover:border-indigo-300 hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all relative group bg-slate-50/30"
            >
              {plan.isPopular && (
                <span className="absolute top-0 right-0 bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded-bl-[8px] border-l border-b border-indigo-100">
                  POPULAIRE
                </span>
              )}
              <h4 className="font-bold text-slate-900">{plan.name}</h4>
              <div className="mt-2 text-2xl font-bold text-indigo-600 tracking-tight">
                {plan.price}{' '}
                <span className="text-[13px] text-slate-500 font-medium tracking-normal">
                  {plan.currency}/{plan.billing === 'Monthly' ? 'mo' : 'yr'}
                </span>
              </div>
              <div className="mt-5 space-y-2.5">
                {plan.features.slice(0, 3).map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-[13px] text-slate-600 font-medium">
                    <IconCheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> <span className="truncate">{f}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200/60 flex justify-between items-center">
                <span className="text-[12px] font-bold text-slate-500">
                  {plan.activeClinics} abonnés
                </span>
                <button
                  onClick={() => alert(`Modifier le plan ${plan.name}`)}
                  className="text-[12px] text-indigo-600 font-bold hover:text-indigo-700"
                >
                  Modifier
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const MarketplacePage = () => {
  const [addons, setAddons] = useState(MOCK_ADDONS);
  const toggleStatus = (id: string) => {
    setAddons(
      addons.map((a) =>
        a.id === id ? { ...a, status: a.status === 'Available' ? 'Deprecated' : 'Available' } : a
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h3 className="text-[18px] font-semibold text-slate-900 tracking-tight">Marketplace & Add-ons</h3>
          <p className="text-[13px] text-slate-500 mt-1">
            Gérez les modules additionnels vendus aux cliniques
          </p>
        </div>
        <button className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-[6px] text-[13px] font-medium hover:bg-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-colors">
          <IconPlus className="w-4 h-4" /> Créer un Add-on
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {addons.map((addon) => (
          <div
            key={addon.id}
            className="bg-white border border-slate-200/60 rounded-[12px] p-5 shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-indigo-50/50 text-indigo-600 rounded-[8px] border border-indigo-100/50">
                {addon.icon === 'message' ? (
                  <IconMail className="w-5 h-5" />
                ) : addon.icon === 'wand' ? (
                  <IconWand className="w-5 h-5" />
                ) : (
                  <IconCheckCircle className="w-5 h-5" />
                )}
              </div>
              <span
                className={`px-2 py-1 rounded-[4px] border text-[11px] font-bold ${addon.status === 'Available'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100/50'
                  : addon.status === 'Beta'
                    ? 'bg-purple-50 text-purple-700 border-purple-100/50'
                    : 'bg-slate-100 text-slate-600 border-slate-200/60'
                  }`}
              >
                {addon.status}
              </span>
            </div>
            <h4 className="font-bold text-slate-900 text-[14px]">{addon.name}</h4>
            <p className="text-[13px] text-slate-500 mt-1.5 h-10 leading-snug">{addon.description}</p>

            <div className="mt-5 pt-4 border-t border-slate-100 flex justify-between items-center">
              <div className="font-bold text-slate-900">
                {addon.price} MAD <span className="font-medium text-[11px] text-slate-400">/mois</span>
              </div>
              <div className="text-[12px] font-bold text-slate-500">{addon.activeInstalls} installs</div>
            </div>

            <div className="mt-5 flex gap-2">
              <button className="flex-1 py-1.5 text-[12px] font-bold border border-slate-200/60 rounded-[6px] hover:bg-slate-50 text-slate-700 transition-colors">
                Éditer
              </button>
              <button
                onClick={() => toggleStatus(addon.id)}
                className={`flex-1 py-1.5 text-[12px] font-bold border rounded-[6px] transition-colors ${addon.status === 'Available'
                  ? 'border-red-100/50 text-red-600 bg-red-50/50 hover:bg-red-50'
                  : 'border-emerald-100/50 text-emerald-600 bg-emerald-50/50 hover:bg-emerald-50'
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

export const BroadcastsPage = () => {
  const [broadcasts, setBroadcasts] = useState(MOCK_BROADCASTS);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [newBroadcast, setNewBroadcast] = useState({ title: '', message: '', target: 'All' });
  const [draggedBroadcast, setDraggedBroadcast] = useState<BroadcastMessage | null>(null);

  const handleCreateBroadcast = () => {
    if (!newBroadcast.title) return;
    const msg: BroadcastMessage = {
      id: `b-${Date.now()}`,
      title: newBroadcast.title,
      message: newBroadcast.message,
      target: newBroadcast.target as any,
      status: 'Draft',
    };
    setBroadcasts([...broadcasts, msg]);
    setIsComposeOpen(false);
    setNewBroadcast({ title: '', message: '', target: 'All' });
  };

  const handleDragStart = (e: React.DragEvent, broadcast: BroadcastMessage) => {
    setDraggedBroadcast(broadcast);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    if (draggedBroadcast && draggedBroadcast.status !== status) {
      setBroadcasts(
        broadcasts.map((b) =>
          b.id === draggedBroadcast.id
            ? { ...b, status: status as any, sentAt: status === 'Sent' ? 'Just now' : undefined }
            : b
        )
      );
    }
    setDraggedBroadcast(null);
  };

  const columns = ['Draft', 'Scheduled', 'Sent'];

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h3 className="text-[18px] font-semibold text-slate-900 tracking-tight">Broadcasts & Annonces</h3>
          <p className="text-[13px] text-slate-500 mt-1">Envoyez des messages à tous vos utilisateurs</p>
        </div>
        <button
          onClick={() => setIsComposeOpen(true)}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-[6px] text-[13px] font-medium hover:bg-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-colors"
        >
          <IconPlus className="w-4 h-4" /> Nouvelle Annonce
        </button>
      </div>

      <div className="flex-1 overflow-x-auto pb-2">
        <div className="flex gap-6 h-full min-w-[800px]">
          {columns.map((status) => (
            <div
              key={status}
              className="flex-1 flex flex-col min-w-[280px]"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, status)}
            >
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${status === 'Sent' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : status === 'Scheduled' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]' : 'bg-slate-300'}`}
                  ></div>
                  <span className="text-[13px] font-bold text-slate-900 tracking-tight">{status}</span>
                </div>
              </div>
              <div className="flex-1 space-y-3 p-1">
                {broadcasts
                  .filter((b) => b.status === status)
                  .map((b) => (
                    <div
                      key={b.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, b)}
                      className="bg-white p-4 rounded-[12px] border border-slate-200/60 shadow-[0_2px_4px_rgba(0,0,0,0.02)] cursor-grab active:cursor-grabbing hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-shadow"
                    >
                      <h4 className="font-bold text-slate-900 text-[13px] mb-1.5">{b.title}</h4>
                      <p className="text-[12px] text-slate-500 line-clamp-2 leading-relaxed">{b.message}</p>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {isComposeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
            onClick={() => setIsComposeOpen(false)}
          ></div>
          <div className="bg-white rounded-[12px] shadow-[0_8px_32px_rgba(0,0,0,0.08)] w-full max-w-md relative z-10 p-6 space-y-5 border border-slate-200/60">
            <h3 className="text-[16px] font-bold text-slate-900 tracking-tight">Nouvelle Annonce</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Titre</label>
                <input
                  type="text"
                  placeholder="Ex: Mise à jour 2.0"
                  className="w-full border border-slate-200/60 p-2.5 rounded-[8px] text-[13px] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder-slate-400"
                  value={newBroadcast.title}
                  onChange={(e) => setNewBroadcast({ ...newBroadcast, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Message</label>
                <textarea
                  placeholder="Détails de l'annonce..."
                  className="w-full border border-slate-200/60 p-2.5 rounded-[8px] text-[13px] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder-slate-400"
                  rows={4}
                  value={newBroadcast.message}
                  onChange={(e) => setNewBroadcast({ ...newBroadcast, message: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsComposeOpen(false)}
                className="px-4 py-2 text-[13px] font-bold text-slate-700 hover:bg-slate-50 rounded-[6px] transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateBroadcast}
                className="px-4 py-2 bg-slate-900 text-white text-[13px] font-bold rounded-[6px] hover:bg-slate-800 transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
              >
                Créer l'annonce
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const AiOpsPage = () => {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h3 className="text-[18px] font-semibold text-slate-900 tracking-tight">AI Command Center</h3>
          <p className="text-[13px] text-slate-500 mt-1">Gestion des modèles LLM et coûts</p>
        </div>
        <span className="text-xl font-bold text-slate-900 tracking-tight">185.40 USD <span className="text-[13px] font-medium text-slate-400">/ jour</span></span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-[12px] border border-slate-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <h4 className="text-[13px] font-bold text-slate-900 mb-6">Usage & Rentabilité</h4>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={AI_USAGE_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} dx={-10} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                  itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={2} />
                <Area type="monotone" dataKey="cost" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="space-y-4">
          {MOCK_AI_CONFIGS.map((config) => (
            <div key={config.id} className="bg-white p-5 rounded-[12px] border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
              <div className="font-bold text-[14px] text-slate-900">{config.name}</div>
              <div className="text-[12px] text-slate-500 mt-1 font-medium">
                {config.provider} • <span className="text-indigo-600 font-bold">${config.costPer1kTokens}</span>/1k tk
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-4">
                <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const CustomerSuccessPage = () => {
  const [risks, setRisks] = useState(MOCK_CHURN_RISK);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getChurnRiskTenants();
        if (data.length > 0) setRisks(data);
      } catch {
        /* fallback */
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-emerald-50 rounded-[12px] p-6 border border-emerald-100 flex items-center justify-between h-32 shadow-[0_2px_4px_rgba(16,185,129,0.05)]">
        <div>
          <h3 className="text-[14px] font-bold text-emerald-900 mb-1">Santé du Parc Clients</h3>
          <p className="text-[12px] text-emerald-700/80 mt-1 font-medium">Vue globale sur le risque d'attrition</p>
        </div>
        <div className="text-4xl font-bold text-emerald-700 tracking-tight">
          92<span className="text-[16px] text-emerald-500/70 tracking-normal">/100</span>
        </div>
      </div>
      <div className="bg-white border border-slate-200/60 rounded-[12px] shadow-[0_2px_4px_rgba(0,0,0,0.02)] overflow-hidden">
        <table className="min-w-full divide-y divide-slate-100/80">
          <thead>
            <tr className="bg-[#FAFAFA]">
              <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Tenant</th>
              <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">MRR</th>
              <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Risk Score</th>
              <th className="px-6 py-3.5 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/80">
            {risks.map((risk) => (
              <tr key={risk.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 text-[13px] font-bold text-slate-900">{risk.clinicName}</td>
                <td className="px-6 py-4 text-[13px] font-medium text-slate-600">{risk.mrr} MAD</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded-[4px] border border-transparent text-[11px] font-bold ${risk.riskScore > 70 ? 'bg-red-50 text-red-700 border-red-100/50' : 'bg-emerald-50 text-emerald-700 border-emerald-100/50'}`}
                  >
                    {risk.riskScore}%
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-[12px] text-blue-600 font-bold hover:text-blue-700 transition-colors">Contacter</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const BackupManagerPage = () => (
  <div className="space-y-6">
    <div>
      <h3 className="text-[18px] font-semibold text-slate-900 tracking-tight">Data & Backups</h3>
      <p className="text-[13px] text-slate-500 mt-1">Gérez les sauvegardes et la rétention des données pour vos tenants.</p>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-[12px] border border-slate-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <h4 className="text-[13px] font-bold text-slate-900 mb-4">Derniers Snapshots</h4>
        <div className="divide-y divide-slate-100/80">
          {MOCK_BACKUPS.map((bk) => (
            <div key={bk.id} className="py-3 flex justify-between items-center">
              <div className="text-[13px] text-slate-800 font-medium">
                {bk.clinicName} <span className="text-slate-400 font-normal ml-1">• {bk.createdAt}</span>
              </div>
              <span className="text-[11px] font-bold bg-emerald-50 text-emerald-700 px-2 py-1 rounded-[4px] border border-emerald-100/50">Réussi</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export const InfrastructurePage = () => (
  <div className="space-y-6">
    <div>
      <h3 className="text-[18px] font-semibold text-slate-900 tracking-tight">Infrastructure & Scaling</h3>
      <p className="text-[13px] text-slate-500 mt-1">Supervisez l'état des serveurs et les performances de l'infrastructure.</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {MOCK_REGIONS.map((region) => (
        <div key={region.id} className="bg-[#0F0F0F] rounded-[12px] p-6 text-white border border-slate-800 shadow-[0_4px_16px_rgba(0,0,0,0.1)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">{region.code}</div>
            <div className="text-2xl font-bold mt-1 text-slate-50 tracking-tight">{region.name}</div>
            <div className="text-[13px] text-slate-400 mt-3 flex items-center gap-1.5"><IconGlobe className="w-3.5 h-3.5" /> {region.activeTenants} Tenants</div>
          </div>
        </div>
      ))}
    </div>
    <div className="bg-white p-6 rounded-[12px] border border-slate-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
      <h4 className="text-[13px] font-bold text-slate-900 mb-6 flex items-center gap-2"><IconActivity className="w-4 h-4 text-emerald-500" /> Cache Hit Rates</h4>
      {MOCK_CACHE_METRICS.map((c) => (
        <div key={c.name} className="mb-4">
          <div className="flex justify-between text-[13px] font-medium text-slate-700 mb-2">
            <span>{c.name}</span>
            <span className="text-emerald-600">{c.hitRate}%</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${c.hitRate}%` }}></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const CompliancePage = () => (
  <div className="space-y-6">
    <div>
      <h3 className="text-[18px] font-semibold text-slate-900 tracking-tight">Compliance Center</h3>
      <p className="text-[13px] text-slate-500 mt-1">Gardez un œil sur la conformité légale et la souveraineté des données.</p>
    </div>
    <div className="bg-white border border-slate-200/60 shadow-[0_2px_4px_rgba(0,0,0,0.02)] rounded-[12px] overflow-hidden">
      <table className="min-w-full divide-y divide-slate-200/60">
        <thead className="bg-[#FAFAFA]">
          <tr>
            <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Tenant</th>
            <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Data Location</th>
            <th className="px-6 py-3.5 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200/60">
          {MOCK_COMPLIANCE.map((c) => (
            <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-6 py-4 text-[13px] font-medium text-slate-900">{c.clinicName}</td>
              <td className="px-6 py-4 text-[13px] text-slate-500">{c.dataLocation}</td>
              <td className="px-6 py-4 text-right">
                <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-1 rounded-[4px] text-[11px] border border-emerald-100/50">
                  Compliant
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export const RoadmapPage = () => (
  <div className="space-y-6">
    <div>
      <h3 className="text-[18px] font-semibold text-slate-900 tracking-tight">Product Roadmap</h3>
      <p className="text-[13px] text-slate-500 mt-1">Visualisez les requêtes fonctionnalités et définissez les priorités.</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {['Planned', 'In Progress', 'Live'].map((status) => (
        <div key={status} className="space-y-4">
          <div className="text-[13px] font-bold text-slate-800 border-b border-slate-200/60 pb-3">{status}</div>
          {MOCK_FEATURE_REQUESTS.filter((f) => (status === 'Live' ? f.status === 'Live' : true))
            .slice(0, 2)
            .map((f) => (
              <div key={f.id} className="bg-white p-4 rounded-[8px] border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-shadow cursor-default group">
                <div className="font-bold text-[13px] text-slate-900 group-hover:text-blue-600 transition-colors">{f.title}</div>
                <div className="flex items-center gap-2 mt-3 text-[11px] text-slate-500 font-medium bg-slate-50 w-fit px-2 py-1 rounded-[4px]">
                  <IconTrendingUp className="w-3 h-3 text-slate-400" /> Votes: {f.votes}
                </div>
              </div>
            ))}
        </div>
      ))}
    </div>
  </div>
);

export const SecurityPage = () => (
  <div className="space-y-6">
    <div>
      <h3 className="text-[18px] font-semibold text-slate-900 tracking-tight">Sécurité</h3>
      <p className="text-[13px] text-slate-500 mt-1">Journal des événements de sécurité et alertes.</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="bg-[#0F0F0F] p-5 rounded-[12px] text-white border border-gray-800 flex flex-col justify-between h-32 shadow-[0_4px_16px_rgba(0,0,0,0.1)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
        <div className="relative z-10">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Threat Level</div>
          <div className="text-[32px] font-semibold text-emerald-400 tracking-tight mt-1 flex items-center gap-2">Low <IconCheckCircle className="w-6 h-6" /></div>
        </div>
      </div>
    </div>
    <div className="bg-white border border-slate-200/60 shadow-[0_2px_4px_rgba(0,0,0,0.02)] rounded-[12px] overflow-hidden">
      <table className="min-w-full divide-y divide-slate-200/60">
        <thead className="bg-[#FAFAFA]">
          <tr>
            <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Event</th>
            <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">IP</th>
            <th className="px-6 py-3.5 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Threat</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200/60">
          {MOCK_SECURITY_EVENTS.map((s) => (
            <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-6 py-4 text-[13px] font-medium text-slate-900">{s.reason}</td>
              <td className="px-6 py-4 font-mono text-[12px] text-slate-500">{s.ip}</td>
              <td className="px-6 py-4 text-right">
                <span className={`px-2 py-1 rounded-[4px] text-[11px] font-bold border ${s.threatLevel === 'High' ? 'bg-red-50 text-red-700 border-red-100/50' : s.threatLevel === 'Medium' ? 'bg-orange-50 text-orange-700 border-orange-100/50' : 'bg-emerald-50 text-emerald-700 border-emerald-100/50'}`}>
                  {s.threatLevel}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export const SystemHealthPage = () => (
  <div className="space-y-6">
    <div>
      <h3 className="text-[18px] font-semibold text-slate-900 tracking-tight">System Health</h3>
      <p className="text-[13px] text-slate-500 mt-1">Métriques de performance de la plateforme en temps réel.</p>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white p-6 border border-slate-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.02)] rounded-[12px]">
        <h4 className="text-[13px] font-bold text-slate-900 mb-6">Latency (ms)</h4>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={SYSTEM_METRICS_DATA}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} dx={-10} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
              />
              <Line type="monotone" dataKey="latency" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white p-6 border border-slate-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.02)] rounded-[12px] flex flex-col">
        <h4 className="text-[13px] font-bold text-slate-900 mb-6 flex items-center justify-between">
          Active Jobs
          <span className="bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded-[4px] text-[10px]">{MOCK_JOBS.length} Queue</span>
        </h4>
        <div className="divide-y divide-slate-100/80 flex-1">
          {MOCK_JOBS.map((j) => (
            <div key={j.id} className="flex justify-between items-center py-3">
              <span className="text-[13px] font-medium text-slate-700">{j.name}</span>
              <span className="text-[11px] font-bold bg-blue-50/80 text-blue-600 px-2 py-1 rounded-[4px] border border-blue-100/50 flex items-center gap-1">
                <IconRefresh className="w-3 h-3 animate-spin" /> {j.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export const DevelopersPage = () => {
  const [subTab, setSubTab] = useState<'webhooks' | 'api' | 'flags' | 'sql'>('webhooks');
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-[18px] font-semibold text-slate-900 tracking-tight">Développeurs</h3>
        <p className="text-[13px] text-slate-500 mt-1">Intégrations, API, et paramètres avancés.</p>
      </div>
      <div className="flex gap-1 border-b border-slate-200/60">
        {['webhooks', 'api', 'flags', 'sql'].map((t) => (
          <button
            key={t}
            onClick={() => setSubTab(t as any)}
            className={`pb-3 px-4 text-[13px] font-bold transition-all border-b-2 -mb-[2px] cursor-pointer ${subTab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>
      {subTab === 'webhooks' && (
        <div className="bg-white border border-slate-200/60 shadow-[0_2px_4px_rgba(0,0,0,0.02)] rounded-[12px] overflow-hidden">
          <div className="divide-y divide-slate-100/80">
            {MOCK_WEBHOOKS.map((w) => (
              <div key={w.id} className="p-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div>
                  <div className="font-mono text-[13px] text-slate-700 font-bold">{w.url}</div>
                  <div className="text-[12px] font-medium text-slate-400 mt-1.5 flex items-center gap-1.5">
                    <span className="text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-[4px] border border-slate-200/50">Events</span> {w.events.join(', ')}
                  </div>
                </div>
                <div className="text-[11px] font-bold bg-emerald-50 text-emerald-700 px-2 py-1 rounded-[4px] border border-emerald-100/50">Active</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {subTab === 'api' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {MOCK_API_METRICS.map((m) => (
            <div key={m.endpoint} className="p-6 border border-slate-200/60 rounded-[12px] bg-white shadow-[0_2px_4px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-shadow">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><IconCode className="w-10 h-10 text-slate-400" /></div>
              <div className="text-[12px] font-mono font-bold text-slate-500 truncate relative z-10">{m.endpoint}</div>
              <div className="text-[28px] font-bold text-slate-900 mt-3 relative z-10 tracking-tight">{m.requests.toLocaleString()} <span className="text-[14px] font-medium tracking-normal text-slate-400">reqs</span></div>
              <div className="text-[12px] font-bold mt-5 relative z-10 flex gap-4">
                <span className="text-slate-500 bg-slate-50 px-2.5 py-1 rounded-[4px] border border-slate-200/50">Latency: {m.avgLatency}ms</span>
                <span className={`px-2.5 py-1 rounded-[4px] border ${m.errors > 0 ? 'bg-red-50 text-red-600 border-red-100/50' : 'bg-emerald-50 text-emerald-600 border-emerald-100/50'}`}>Err: {m.errors}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {subTab !== 'api' && subTab !== 'webhooks' && (
        <div className="p-10 text-center bg-slate-50/50 border border-slate-200/60 border-dashed rounded-[12px]">
          <p className="text-[13px] text-slate-500 font-medium tracking-tight">Ce module est en cours de développement.</p>
        </div>
      )}
    </div>
  );
};

export const SaaSAdministration = () => {
  const [activeTab, setActiveTab] = useState('users');
  const navItems = [
    { id: 'users', label: 'Utilisateurs', icon: IconUsers },
    { id: 'finance', label: 'Finance & Plans', icon: IconCreditCard },
    { id: 'marketplace', label: 'Marketplace', icon: IconShoppingBag },
    { id: 'content', label: 'Content Management', icon: IconFileText },
    { id: 'broadcasts', label: 'Broadcasts', icon: IconBroadcast },
    { id: 'ai', label: 'AI Command Center', icon: IconWand },
    { id: 'success', label: 'Customer Success', icon: IconTrendingUp },
    { id: 'health', label: 'System Health', icon: IconActivity },
    { id: 'infra', label: 'Infrastructure', icon: IconServer },
    { id: 'backups', label: 'Data & Backups', icon: IconHardDrive },
    { id: 'compliance', label: 'Compliance & Legal', icon: IconScale },
    { id: 'roadmap', label: 'Roadmap', icon: IconMap },
    { id: 'security', label: 'Sécurité', icon: IconShield },
    { id: 'developers', label: 'Développeurs', icon: IconCode },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'users':
        return <SaaSUsersPage />;
      case 'finance':
        return <FinancePage />;
      case 'marketplace':
        return <MarketplacePage />;
      case 'content':
        return <ContentManagementPage />;
      case 'broadcasts':
        return <BroadcastsPage />;
      case 'ai':
        return <AiOpsPage />;
      case 'success':
        return <CustomerSuccessPage />;
      case 'backups':
        return <BackupManagerPage />;
      case 'infra':
        return <InfrastructurePage />;
      case 'compliance':
        return <CompliancePage />;
      case 'roadmap':
        return <RoadmapPage />;
      case 'health':
        return <SystemHealthPage />;
      case 'developers':
        return <DevelopersPage />;
      case 'security':
        return <SecurityPage />;
      default:
        return <div className="text-slate-400 font-medium text-center py-10 tracking-tight">Section en construction</div>;
    }
  };

  return (
    <div className="flex relative h-[min(calc(100vh-140px),900px)] min-h-[600px] bg-white rounded-[16px] border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden font-sans">
      <div className="w-64 bg-[#FAFAFA] border-r border-slate-200/60 flex flex-col pt-2 relative z-10">
        <div className="px-5 py-4 mb-2">
          <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em]">
            Administration
          </h2>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pb-6 space-y-0.5 custom-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-[13px] font-bold rounded-[8px] transition-all duration-200 cursor-pointer ${activeTab === item.id
                ? 'bg-white text-slate-900 shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50 border border-transparent'
                }`}
            >
              <item.icon
                className={`w-4 h-4 transition-colors ${activeTab === item.id ? 'text-slate-900' : 'text-slate-400'}`}
              />
              {item.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="flex-1 overflow-auto bg-slate-50/30 p-8 custom-scrollbar relative z-0">
        <div className="max-w-[1000px] mx-auto h-full flex flex-col pb-10">{renderContent()}</div>
      </div>
    </div>
  );
};
