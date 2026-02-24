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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Content Management System</h3>
          <p className="text-sm text-gray-500">
            Gérez les communications, pages légales et traductions.
          </p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-[8px]">
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-1.5 text-sm font-medium rounded-[8px] transition-all ${activeTab === 'templates' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Templates (Email/SMS)
          </button>
          <button
            onClick={() => setActiveTab('pages')}
            className={`px-4 py-1.5 text-sm font-medium rounded-[8px] transition-all ${activeTab === 'pages' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Pages Légales
          </button>
          <button
            onClick={() => setActiveTab('translations')}
            className={`px-4 py-1.5 text-sm font-medium rounded-[8px] transition-all ${activeTab === 'translations' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
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
              className="bg-white border border-gray-200 rounded-[8px] p-5 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <div
                  className={`p-2 rounded-[8px] ${tmpl.type === 'Email' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}
                >
                  {tmpl.type === 'Email' ? (
                    <IconMail className="w-5 h-5" />
                  ) : (
                    <IconMessage className="w-5 h-5" />
                  )}
                </div>
                <button
                  onClick={() => handleEditTemplate(tmpl)}
                  className="text-gray-400 hover:text-indigo-600"
                >
                  <IconEdit className="w-4 h-4" />
                </button>
              </div>
              <h4 className="font-bold text-gray-900 text-sm mb-1">{tmpl.name}</h4>
              <p className="text-xs text-gray-500 mb-4 truncate">Sujet: {tmpl.subject}</p>
              <div className="pt-3 border-t border-gray-50 text-[10px] text-gray-400 flex justify-between items-center">
                <span>Modifié: {tmpl.lastModified}</span>
                <span className="uppercase tracking-wider font-bold bg-gray-50 px-1.5 py-0.5 rounded">
                  {tmpl.type}
                </span>
              </div>
            </div>
          ))}
          <button className="border-2 border-dashed border-gray-200 rounded-[8px] p-6 flex flex-col items-center justify-center text-gray-400 hover:border-indigo-300 hover:text-indigo-600 transition-all">
            <IconPlus className="w-8 h-8 mb-2" />
            <span className="font-medium text-sm">Nouveau Modèle</span>
          </button>
        </div>
      )}

      {/* PAGES TAB */}
      {activeTab === 'pages' && (
        <div className="bg-white border border-gray-200 rounded-[8px] shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Titre
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Slug URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Dernière MàJ
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                  Statut
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pages.map((page) => (
                <tr key={page.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <IconFileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">{page.title}</span>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-gray-500">{page.slug}</td>
                  <td className="px-6 py-4 text-xs text-gray-500">{page.lastUpdated}</td>
                  <td className="px-6 py-4 text-right">
                    <span
                      className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        page.status === 'Published'
                          ? 'bg-green-50 text-green-700 border border-green-100'
                          : 'bg-yellow-50 text-yellow-700 border border-yellow-100'
                      }`}
                    >
                      {page.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-gray-400 hover:text-indigo-600 mx-1">
                      <IconEdit className="w-4 h-4" />
                    </button>
                    <button className="text-gray-400 hover:text-gray-600 mx-1">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {translations.map((mod) => (
              <div
                key={mod.id}
                className="bg-white border border-gray-200 rounded-[8px] p-5 shadow-sm"
              >
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-gray-900">{mod.name}</h4>
                  <IconGlobe className="w-4 h-4 text-gray-400" />
                </div>
                <div className="mb-2 flex justify-between text-xs text-gray-500">
                  <span>Progression</span>
                  <span>{mod.progress}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
                  <div
                    className={`h-2 rounded-full ${mod.progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                    style={{ width: `${mod.progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-gray-50 text-xs">
                  <span className="text-gray-400">{mod.keys} clés</span>
                  <button className="text-indigo-600 font-medium hover:underline">Gérer</button>
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
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sujet</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-[8px] p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                defaultValue={editingTemplate.subject}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Corps du message
              </label>
              <textarea
                rows={15}
                className="w-full border border-gray-300 rounded-[8px] p-3 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50"
                value={templateBody}
                onChange={(e) => setTemplateBody(e.target.value)}
              />
              <p className="mt-2 text-xs text-gray-500">
                Variables disponibles:{' '}
                <code className="bg-gray-100 px-1 rounded">{`{userName}`}</code>,{' '}
                <code className="bg-gray-100 px-1 rounded">{`{clinicName}`}</code>,{' '}
                <code className="bg-gray-100 px-1 rounded">{`{actionUrl}`}</code>.
              </p>
            </div>
            <div className="pt-4 flex gap-3 border-t border-gray-100">
              <button
                onClick={() => setEditingTemplate(null)}
                className="flex-1 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-[8px] hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveTemplate}
                className="flex-1 py-2 text-sm font-medium text-white bg-indigo-600 rounded-[8px] hover:bg-indigo-700 shadow-sm flex justify-center items-center gap-2"
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-[8px] border border-gray-200 shadow-sm flex flex-col justify-between h-32">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">
            MRR (Mensuel)
          </div>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold text-gray-900">{mrr.toLocaleString()}</span>
            <span
              className={`text-xs px-1.5 py-0.5 rounded font-medium border ${mrrGrowth >= 0 ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}
            >
              {mrrGrowth >= 0 ? '+' : ''}
              {mrrGrowth}%
            </span>
          </div>
          <div className="text-xs text-gray-400">MAD Recurring Revenue</div>
        </div>
        <div className="bg-white p-5 rounded-[8px] border border-gray-200 shadow-sm flex flex-col justify-between h-32">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">ARPU</div>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold text-gray-900">{arpu.toLocaleString()}</span>
            <span className="text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded font-medium border border-green-100">
              +5%
            </span>
          </div>
          <div className="text-xs text-gray-400">
            Revenu moyen par cabinet ({activeTenants} actifs)
          </div>
        </div>
        <div className="bg-white p-5 rounded-[8px] border border-gray-200 shadow-sm flex flex-col justify-between h-32">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Churn Rate</div>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold text-gray-900">1.2%</span>
            <span className="text-xs bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-medium border border-red-100">
              +0.1%
            </span>
          </div>
          <div className="text-xs text-gray-400">Taux de désabonnement</div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-[8px] shadow-sm p-6">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Plans d'abonnement</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {MOCK_PLANS.map((plan) => (
            <div
              key={plan.id}
              className="border border-gray-200 rounded-[8px] p-5 hover:border-indigo-300 transition-colors relative group bg-gray-50/30"
            >
              {plan.isPopular && (
                <span className="absolute top-0 right-0 bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded-bl-lg border-l border-b border-indigo-200">
                  POPULAIRE
                </span>
              )}
              <h4 className="font-bold text-gray-900">{plan.name}</h4>
              <div className="mt-2 text-2xl font-bold text-indigo-600">
                {plan.price}{' '}
                <span className="text-sm text-gray-500 font-medium">
                  {plan.currency}/{plan.billing === 'Monthly' ? 'mo' : 'yr'}
                </span>
              </div>
              <div className="mt-4 space-y-2">
                {plan.features.slice(0, 3).map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                    <IconCheckCircle className="w-3 h-3 text-green-500" /> {f}
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center">
                <span className="text-xs font-medium text-gray-500">
                  {plan.activeClinics} abonnés
                </span>
                <button
                  onClick={() => alert(`Modifier le plan ${plan.name}`)}
                  className="text-xs text-indigo-600 font-medium hover:underline"
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
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Marketplace & Add-ons</h3>
          <p className="text-sm text-gray-500">
            Gérez les modules additionnels vendus aux cliniques.
          </p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-[8px] text-sm font-medium hover:bg-blue-700 shadow-sm">
          <IconPlus className="w-4 h-4" /> Créer un Add-on
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {addons.map((addon) => (
          <div
            key={addon.id}
            className="bg-white border border-gray-200 rounded-[8px] p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-[8px]">
                {addon.icon === 'message' ? (
                  <IconMail className="w-6 h-6" />
                ) : addon.icon === 'wand' ? (
                  <IconWand className="w-6 h-6" />
                ) : (
                  <IconCheckCircle className="w-6 h-6" />
                )}
              </div>
              <span
                className={`px-2 py-1 rounded text-xs font-bold ${
                  addon.status === 'Available'
                    ? 'bg-green-100 text-green-700'
                    : addon.status === 'Beta'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-100 text-gray-600'
                }`}
              >
                {addon.status}
              </span>
            </div>
            <h4 className="font-bold text-gray-900 text-lg">{addon.name}</h4>
            <p className="text-sm text-gray-500 mt-1 h-10">{addon.description}</p>

            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
              <div className="font-bold text-gray-900">
                {addon.price} MAD <span className="font-normal text-xs text-gray-400">/mois</span>
              </div>
              <div className="text-xs text-gray-500">{addon.activeInstalls} installs</div>
            </div>

            <div className="mt-4 flex gap-2">
              <button className="flex-1 py-1.5 text-xs font-medium border border-gray-200 rounded hover:bg-gray-50 text-gray-700">
                Éditer
              </button>
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
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Broadcasts & Annonces</h3>
          <p className="text-sm text-gray-500">Envoyez des messages à tous vos utilisateurs.</p>
        </div>
        <button
          onClick={() => setIsComposeOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-[8px] text-sm font-medium hover:bg-blue-700 shadow-sm"
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
                    className={`w-2 h-2 rounded-full ${status === 'Sent' ? 'bg-green-500' : status === 'Scheduled' ? 'bg-blue-500' : 'bg-gray-400'}`}
                  ></div>
                  <span className="text-sm font-bold text-gray-700">{status}</span>
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
                      className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm cursor-grab active:cursor-grabbing"
                    >
                      <h4 className="font-bold text-gray-900 text-sm mb-1">{b.title}</h4>
                      <p className="text-xs text-gray-500 line-clamp-2">{b.message}</p>
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
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            onClick={() => setIsComposeOpen(false)}
          ></div>
          <div className="bg-white rounded-[8px] shadow-xl w-full max-w-md relative z-10 p-6 space-y-4">
            <h3 className="text-lg font-bold">Nouvelle Annonce</h3>
            <input
              type="text"
              placeholder="Titre"
              className="w-full border p-2 rounded"
              value={newBroadcast.title}
              onChange={(e) => setNewBroadcast({ ...newBroadcast, title: e.target.value })}
            />
            <textarea
              placeholder="Message"
              className="w-full border p-2 rounded"
              rows={4}
              value={newBroadcast.message}
              onChange={(e) => setNewBroadcast({ ...newBroadcast, message: e.target.value })}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsComposeOpen(false)} className="px-4 py-2">
                Annuler
              </button>
              <button
                onClick={handleCreateBroadcast}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Créer
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
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-gray-900">AI Command Center</h3>
          <p className="text-sm text-gray-500">Gestion des modèles LLM et coûts.</p>
        </div>
        <span className="text-xl font-bold text-gray-900">185.40 USD / jour</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-[8px] border border-gray-200 shadow-sm">
          <h4 className="text-sm font-bold mb-6">Usage & Rentabilité</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={AI_USAGE_DATA}>
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#82ca9d" fill="#82ca9d" />
                <Area type="monotone" dataKey="cost" stroke="#8884d8" fill="#8884d8" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="space-y-4">
          {MOCK_AI_CONFIGS.map((config) => (
            <div key={config.id} className="bg-white p-4 rounded-[8px] border border-gray-200">
              <div className="font-bold">{config.name}</div>
              <div className="text-xs text-gray-500">
                {config.provider} • ${config.costPer1kTokens}/1k tk
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: '60%' }}></div>
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
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-[8px] p-6 text-white shadow-lg flex justify-between">
        <h3 className="text-xl font-bold">Santé du Parc Clients</h3>
        <div className="text-3xl font-bold">92/100</div>
      </div>
      <div className="bg-white border border-gray-200 rounded-[8px] shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-100">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Tenant</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase">MRR</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Risk Score</th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {risks.map((risk) => (
              <tr key={risk.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium">{risk.clinicName}</td>
                <td className="px-6 py-4 text-sm">{risk.mrr} MAD</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold ${risk.riskScore > 70 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
                  >
                    {risk.riskScore}%
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-blue-600 font-medium">Contacter</button>
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
    <h3 className="text-lg font-bold">Data & Backups</h3>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-[8px] border border-gray-200 shadow-sm">
        <h4 className="text-sm font-bold mb-4">Derniers Snapshots</h4>
        <div className="divide-y">
          {MOCK_BACKUPS.map((bk) => (
            <div key={bk.id} className="py-3 flex justify-between items-center">
              <div className="text-sm">
                {bk.clinicName} • {bk.createdAt}
              </div>
              <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">Réussi</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export const InfrastructurePage = () => (
  <div className="space-y-6">
    <h3 className="text-lg font-bold">Infrastructure & Scaling</h3>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {MOCK_REGIONS.map((region) => (
        <div key={region.id} className="bg-gray-900 rounded-[8px] p-5 text-white">
          <div className="text-xs font-bold text-gray-400 uppercase">{region.code}</div>
          <div className="text-xl font-bold">{region.name}</div>
          <div className="text-sm text-gray-400 mt-2">{region.activeTenants} Tenants</div>
        </div>
      ))}
    </div>
    <div className="bg-white p-6 rounded-[8px] border border-gray-200">
      <h4 className="font-bold mb-4">Cache Hit Rates</h4>
      {MOCK_CACHE_METRICS.map((c) => (
        <div key={c.name} className="mb-4">
          <div className="flex justify-between text-xs mb-1">
            <span>{c.name}</span>
            <span>{c.hitRate}%</span>
          </div>
          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
            <div className="bg-indigo-500 h-full" style={{ width: `${c.hitRate}%` }}></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const CompliancePage = () => (
  <div className="space-y-6">
    <h3 className="text-lg font-bold">Compliance Center</h3>
    <div className="bg-white border border-gray-200 rounded-[8px] overflow-hidden">
      <table className="min-w-full divide-y divide-gray-100">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left">Tenant</th>
            <th className="px-6 py-3 text-left">Data Location</th>
            <th className="px-6 py-3 text-right">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {MOCK_COMPLIANCE.map((c) => (
            <tr key={c.id}>
              <td className="px-6 py-4">{c.clinicName}</td>
              <td className="px-6 py-4">{c.dataLocation}</td>
              <td className="px-6 py-4 text-right">
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
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
    <h3 className="text-lg font-bold">Product Roadmap</h3>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {['Planned', 'In Progress', 'Live'].map((status) => (
        <div key={status} className="space-y-4">
          <div className="font-bold border-b pb-2">{status}</div>
          {MOCK_FEATURE_REQUESTS.filter((f) => (status === 'Live' ? f.status === 'Live' : true))
            .slice(0, 2)
            .map((f) => (
              <div key={f.id} className="bg-white p-4 rounded border shadow-sm">
                <div className="font-bold text-sm">{f.title}</div>
                <div className="text-xs text-gray-500 mt-2">Votes: {f.votes}</div>
              </div>
            ))}
        </div>
      ))}
    </div>
  </div>
);

export const SecurityPage = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-4 gap-4">
      <div className="bg-gray-900 p-4 rounded-[8px] text-white">
        <div className="text-xs opacity-60">Threat Level</div>
        <div className="text-xl font-bold text-green-400">Low</div>
      </div>
    </div>
    <div className="bg-white border rounded-[8px] overflow-hidden">
      <table className="min-w-full divide-y">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left">Event</th>
            <th className="px-6 py-3 text-left">IP</th>
            <th className="px-6 py-3 text-right">Threat</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {MOCK_SECURITY_EVENTS.map((s) => (
            <tr key={s.id}>
              <td className="px-6 py-4">{s.reason}</td>
              <td className="px-6 py-4 font-mono text-xs">{s.ip}</td>
              <td className="px-6 py-4 text-right">{s.threatLevel}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export const SystemHealthPage = () => (
  <div className="space-y-6">
    <h2 className="text-lg font-bold">System Health</h2>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white p-6 border rounded-[8px]">
        <h4 className="mb-4">Latency (ms)</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={SYSTEM_METRICS_DATA}>
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="latency" stroke="#4f46e5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white p-6 border rounded-[8px]">
        <h4 className="mb-4">Active Jobs</h4>
        {MOCK_JOBS.map((j) => (
          <div key={j.id} className="flex justify-between py-2 border-b">
            <span>{j.name}</span>
            <span className="text-xs bg-blue-50 text-blue-600 px-2 rounded">Running</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const DevelopersPage = () => {
  const [subTab, setSubTab] = useState<'webhooks' | 'api' | 'flags' | 'sql'>('webhooks');
  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b">
        {['webhooks', 'api', 'flags', 'sql'].map((t) => (
          <button
            key={t}
            onClick={() => setSubTab(t as any)}
            className={`pb-2 px-4 text-sm font-medium ${subTab === t ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>
      {subTab === 'webhooks' && (
        <div className="bg-white border rounded-[8px]">
          {MOCK_WEBHOOKS.map((w) => (
            <div key={w.id} className="p-4 flex justify-between border-b last:border-0">
              <div className="font-mono text-sm">{w.url}</div>
              <div className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">Active</div>
            </div>
          ))}
        </div>
      )}
      {subTab === 'api' && (
        <div className="grid grid-cols-3 gap-4">
          {MOCK_API_METRICS.map((m) => (
            <div key={m.endpoint} className="p-4 border rounded bg-gray-50">
              <div className="text-xs text-gray-500 truncate">{m.endpoint}</div>
              <div className="text-xl font-bold">{m.requests} reqs</div>
            </div>
          ))}
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

  const renderContent = () => {
    switch (activeTab) {
      case 'users':
        return <SaaSUsersPage />;
      case 'finance':
        return <FinancePage />;
      case 'marketplace':
        return <MarketplacePage />;
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
        return <div className="text-gray-400 text-center py-10">Section en construction</div>;
    }
  };

  return (
    <div className="flex h-full bg-white rounded-[8px] border border-gray-200 shadow-sm overflow-hidden font-sans">
      <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
            Administration
          </h2>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-[8px] transition-colors ${
                activeTab === item.id
                  ? 'bg-white text-indigo-700 shadow-sm border border-gray-200'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <item.icon
                className={`w-4 h-4 ${activeTab === item.id ? 'text-indigo-600' : 'text-gray-400'}`}
              />
              {item.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="flex-1 overflow-auto bg-gray-50/30 p-8">
        <div className="max-w-6xl mx-auto h-full flex flex-col">{renderContent()}</div>
      </div>
    </div>
  );
};
