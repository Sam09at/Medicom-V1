import React, { useState, useEffect, useMemo } from 'react';
import {
  IconSearch,
  IconPlus,
  IconUsers,
  IconCheck,
  IconX,
  IconSettings,
  IconAlertTriangle,
  IconZap,
  IconTrendingUp,
  IconDownload,
  IconChevronRight,
  IconChevronDown,
  IconGlobe,
  IconShield,
  IconMail,
  IconPhone,
  IconDatabase,
  IconActivity,
  IconFileText,
  IconLock,
  IconCopy,
  IconExternalLink,
  IconEdit,
  IconMapPin,
  IconToggleRight,
  IconToggleLeft,
  IconUserPlus,
  IconCreditCard,
  IconDollarSign,
  IconCalendar,
  IconRefresh,
} from '../components/Icons';
import { TenantDetailed, ModuleConfiguration, ClinicSpecialty } from '../types';
import {
  SPECIALTY_LABELS,
  SPECIALTY_MODULE_DEFAULTS,
  PLAN_CONFIG,
  makeSlug,
} from '../lib/constants/specialtyMatrix';
import { getAllTenants, suspendTenant, activateTenant, createClinicWithAdmin } from '../lib/api/saas/tenants';

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterTab = 'all' | 'active' | 'trial' | 'suspended';

type DetailTab = 'profil' | 'domaines' | 'plan' | 'page-web' | 'equipe' | 'usage' | 'billing';

type WizardStep = 0 | 1 | 2 | 3;

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'docteur' | 'assistant';
  status: 'active' | 'invited' | 'inactive';
  avatarColor: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MODULE_LABELS: Record<keyof ModuleConfiguration, string> = {
  dashboard: 'Tableau de bord',
  calendar: 'Calendrier & Agenda',
  patients: 'Dossiers Patients',
  treatments: 'Schémas & Traitements',
  inventory: 'Gestion de Stock',
  labOrders: 'Suivi Laboratoires',
  documents: 'Gestion Documentaire',
  records: 'Archives Médicales',
  billing: 'Facturation & Caisse',
  reports: 'Analyses & Statistiques',
  support: 'Module Support',
  landingPageBuilder: 'Page Web Publique',
};

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-teal-500',
];

const getAvatarColor = (id: string) =>
  AVATAR_COLORS[id.charCodeAt(id.length - 1) % AVATAR_COLORS.length];

const getInitials = (name: string) =>
  name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

const MOCK_TEAM: Record<string, TeamMember[]> = {
  'TEN-001': [
    { id: 'u1', name: 'Dr. Amina Belhaj', email: 'amina@cabinet.ma', role: 'admin', status: 'active', avatarColor: 'bg-blue-500' },
    { id: 'u2', name: 'Youssef Alami', email: 'youssef@cabinet.ma', role: 'assistant', status: 'active', avatarColor: 'bg-emerald-500' },
  ],
  'TEN-002': [
    { id: 'u3', name: 'Dr. Tazi Khalil', email: 'tazi@sourire.ma', role: 'docteur', status: 'active', avatarColor: 'bg-purple-500' },
    { id: 'u4', name: 'Sara Idrissi', email: 'sara@sourire.ma', role: 'assistant', status: 'invited', avatarColor: 'bg-rose-500' },
  ],
  'TEN-003': [
    { id: 'u5', name: 'Mme. Bennani', email: 'admin@orthoplus.ma', role: 'admin', status: 'active', avatarColor: 'bg-amber-500' },
  ],
};

const PLAN_BADGE: Record<string, string> = {
  Starter: 'bg-slate-100 text-slate-700',
  starter: 'bg-slate-100 text-slate-700',
  Pro: 'bg-blue-100 text-blue-700',
  pro: 'bg-blue-100 text-blue-700',
  Premium: 'bg-purple-100 text-purple-700',
  premium: 'bg-purple-100 text-purple-700',
  Enterprise: 'bg-emerald-100 text-emerald-700',
  enterprise: 'bg-emerald-100 text-emerald-700',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusDot({ status }: { status: TenantDetailed['status'] }) {
  if (status === 'Active') return <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />;
  if (status === 'Suspended') return <span className="inline-block w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />;
  return <span className="inline-block w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />;
}

function PlanBadge({ plan }: { plan: string }) {
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${PLAN_BADGE[plan] ?? 'bg-slate-100 text-slate-600'}`}>
      {plan}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
      {children}
    </p>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
      title="Copier"
    >
      {copied ? <IconCheck className="w-3.5 h-3.5 text-emerald-500" /> : <IconCopy className="w-3.5 h-3.5" />}
    </button>
  );
}

// ─── Wizard ───────────────────────────────────────────────────────────────────

interface WizardData {
  name: string;
  specialty: ClinicSpecialty;
  doctorName: string;
  email: string;
  password: string;
  phone: string;
  city: string;
  address: string;
  plan: string;
  customDomain: string;
  trial: string;
}

const DEFAULT_WIZARD: WizardData = {
  name: '',
  specialty: 'dentistry',
  doctorName: '',
  email: '',
  password: '',
  phone: '',
  city: '',
  address: '',
  plan: 'pro',
  customDomain: '',
  trial: '14',
};

function OnboardingWizard({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (tenant: TenantDetailed) => void;
}) {
  const [step, setStep] = useState<WizardStep>(0);
  const [data, setData] = useState<WizardData>(DEFAULT_WIZARD);
  const [showDnsInstructions, setShowDnsInstructions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const slug = useMemo(() => makeSlug(data.name), [data.name]);
  const publicUrl = data.customDomain ? `www.${data.customDomain}` : `${slug}.medicom.app`;
  const adminUrl = data.customDomain ? `admin.${data.customDomain}` : `${slug}-admin.medicom.app`;

  const update = (field: keyof WizardData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setData(d => ({ ...d, [field]: e.target.value }));

  const handleFinish = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const result = await createClinicWithAdmin({
        clinic_name: data.name,
        plan: data.plan as 'starter' | 'pro' | 'premium',
        admin_email: data.email,
        admin_password: data.password,
        admin_name: data.doctorName,
        admin_role: 'clinic_admin',
        phone: data.phone || undefined,
        location: data.city || undefined,
        region: data.city || undefined,
      });

      const planConfig = PLAN_CONFIG[data.plan];
      const modules = SPECIALTY_MODULE_DEFAULTS[data.specialty];
      const newTenant: TenantDetailed = {
        id: result.tenant_id,
        name: result.tenant_name,
        contactName: data.doctorName,
        email: data.email,
        phone: data.phone,
        city: data.city,
        address: data.address,
        plan: (planConfig?.label ?? 'Pro') as 'Starter' | 'Pro' | 'Premium',
        planTier: data.plan as 'starter' | 'pro' | 'premium',
        status: 'Active',
        usersCount: 1,
        storageUsed: '0 MB',
        joinedAt: new Date().toISOString(),
        mrr: planConfig?.price ?? 0,
        region: data.city,
        enabledModules: modules,
        specialty: data.specialty,
        slug,
        publicDomain: data.customDomain ? publicUrl : null,
        adminDomain: data.customDomain ? adminUrl : null,
        onboardingStatus: 'pending',
        trialEndsAt: data.trial !== '0' ? new Date(Date.now() + parseInt(data.trial) * 86400000).toISOString() : null,
        billingEmail: data.email,
      };
      onCreate(newTenant);
      onClose();
    } catch (err: any) {
      setSaveError(err.message ?? 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  const DENTAL_SPECIALTIES: ClinicSpecialty[] = ['dentistry','orthodontics','pediatric_dentistry','oral_surgery','periodontology','endodontics'];
  const MEDICAL_SPECIALTIES: ClinicSpecialty[] = ['general_medicine','cardiology','dermatology','psychology','pediatrics','gynecology','ophthalmology','orthopedics','ent'];

  const canNext = step === 0
    ? !!(data.name && data.doctorName && data.email && data.password.length >= 8)
    : step === 1 || step === 2
      ? true
      : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-[20px] shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Nouveau Cabinet</h2>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
              <IconX className="w-5 h-5" />
            </button>
          </div>
          {/* Step progress */}
          <div className="flex gap-1.5">
            {['Identification', 'Domaines', 'Plan & Accès', 'Confirmation'].map((label, i) => (
              <div key={i} className="flex-1">
                <div className={`h-1 rounded-full transition-colors ${i <= step ? 'bg-blue-500' : 'bg-slate-200'}`} />
                <p className={`text-[10px] mt-1 text-center truncate ${i === step ? 'text-blue-600 font-semibold' : 'text-slate-400'}`}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 max-h-[65vh] overflow-y-auto space-y-4">

          {/* ── Step 0: Identification ── */}
          {step === 0 && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nom du cabinet *</label>
                <input
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Cabinet Dentaire Amina"
                  value={data.name}
                  onChange={update('name')}
                />
                {slug && (
                  <p className="text-xs text-slate-400 mt-1">
                    URL: <span className="font-mono text-blue-600">{slug}.medicom.app</span>
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Spécialité *</label>
                <select
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={data.specialty}
                  onChange={e => setData(d => ({ ...d, specialty: e.target.value as ClinicSpecialty }))}
                >
                  <optgroup label="Dentaires">
                    {DENTAL_SPECIALTIES.map(s => (
                      <option key={s} value={s}>{SPECIALTY_LABELS[s]}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Médicales">
                    {MEDICAL_SPECIALTIES.map(s => (
                      <option key={s} value={s}>{SPECIALTY_LABELS[s]}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Autres">
                    <option value="other">{SPECIALTY_LABELS.other}</option>
                  </optgroup>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Médecin responsable *</label>
                <input
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Dr. Mohamed Lebbar"
                  value={data.doctorName}
                  onChange={update('doctorName')}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email *</label>
                <input
                  type="email"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="dr.lebbar@cabinet.ma"
                  value={data.email}
                  onChange={update('email')}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Mot de passe *</label>
                <input
                  type="password"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="8 caractères minimum"
                  value={data.password}
                  onChange={update('password')}
                />
                {data.password.length > 0 && data.password.length < 8 && (
                  <p className="text-[11px] text-red-500 mt-1">Au moins 8 caractères requis</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Téléphone</label>
                  <input
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+212 6xx xx xx xx"
                    value={data.phone}
                    onChange={update('phone')}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Ville</label>
                  <input
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Casablanca"
                    value={data.city}
                    onChange={update('city')}
                  />
                </div>
              </div>
            </>
          )}

          {/* ── Step 1: Domaines ── */}
          {step === 1 && (
            <>
              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">URLs générées</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-400">Page publique</p>
                    <p className="font-mono text-sm text-blue-600">{slug || 'mon-cabinet'}.medicom.app</p>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Actif dès activation</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-400">Interface admin</p>
                    <p className="font-mono text-sm text-slate-700">{slug || 'mon-cabinet'}-admin.medicom.app</p>
                  </div>
                </div>
              </div>

              <div>
                <button
                  className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                  onClick={() => setShowDnsInstructions(!showDnsInstructions)}
                >
                  <IconChevronDown className={`w-4 h-4 transition-transform ${showDnsInstructions ? 'rotate-180' : ''}`} />
                  Ajouter un domaine personnalisé
                </button>
                {showDnsInstructions && (
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Votre domaine public</label>
                      <input
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        placeholder="www.drlebbar.ma"
                        value={data.customDomain}
                        onChange={update('customDomain')}
                      />
                      {data.customDomain && (
                        <p className="text-xs text-slate-400 mt-1">
                          Admin: <span className="font-mono">admin.{data.customDomain}</span>
                        </p>
                      )}
                    </div>
                    <div className="bg-slate-900 rounded-xl p-3 text-xs font-mono space-y-1.5">
                      <p className="text-slate-400"># Enregistrements DNS requis</p>
                      <p><span className="text-emerald-400">A</span> <span className="text-slate-300">@</span> <span className="text-yellow-300">94.23.156.12</span></p>
                      <p><span className="text-emerald-400">CNAME</span> <span className="text-slate-300">www</span> <span className="text-yellow-300">proxy.medicom.app</span></p>
                      <p><span className="text-emerald-400">CNAME</span> <span className="text-slate-300">admin</span> <span className="text-yellow-300">proxy.medicom.app</span></p>
                    </div>
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <IconAlertTriangle className="w-3.5 h-3.5" />
                      La vérification DNS peut prendre 24–48h
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── Step 2: Plan & Accès ── */}
          {step === 2 && (
            <>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(PLAN_CONFIG).map(([key, plan]) => (
                  <button
                    key={key}
                    onClick={() => setData(d => ({ ...d, plan: key }))}
                    className={`relative rounded-xl border-2 p-3 text-left transition-all ${
                      data.plan === key
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {plan.popular && (
                      <span className="absolute top-2 right-2 text-[9px] bg-blue-500 text-white px-1.5 py-0.5 rounded-full">
                        Populaire
                      </span>
                    )}
                    <p className={`text-xs font-bold ${plan.color}`}>{plan.label}</p>
                    <p className="text-sm font-bold text-slate-900 mt-1">
                      {plan.price > 0 ? `${plan.price} MAD/mois` : 'Sur devis'}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {plan.maxUsers} utilisateurs · {plan.storage}
                    </p>
                  </button>
                ))}
              </div>

              {/* Specialty modules preview */}
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs font-semibold text-slate-500 mb-2">
                  Modules inclus · {SPECIALTY_LABELS[data.specialty]}
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {(Object.entries(SPECIALTY_MODULE_DEFAULTS[data.specialty]) as [keyof ModuleConfiguration, boolean][]).map(([mod, enabled]) => (
                    <div key={mod} className={`flex items-center gap-1.5 text-[11px] ${enabled ? 'text-slate-700' : 'text-slate-300'}`}>
                      {enabled
                        ? <IconCheck className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                        : <IconX className="w-3 h-3 flex-shrink-0" />
                      }
                      {MODULE_LABELS[mod]}
                    </div>
                  ))}
                </div>
              </div>

              {/* Trial */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Période d'essai</label>
                <select
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={data.trial}
                  onChange={update('trial')}
                >
                  <option value="14">14 jours</option>
                  <option value="30">30 jours</option>
                  <option value="0">Aucun</option>
                </select>
              </div>
            </>
          )}

          {/* ── Step 3: Confirmation ── */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Cabinet</span>
                  <span className="font-semibold text-slate-900">{data.name || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Spécialité</span>
                  <span className="font-semibold">{SPECIALTY_LABELS[data.specialty]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Plan</span>
                  <span className="font-semibold">{PLAN_CONFIG[data.plan]?.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">URL publique</span>
                  <span className="font-mono text-blue-600 text-xs">{publicUrl}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Modules actifs</span>
                  <span className="font-semibold">
                    {Object.values(SPECIALTY_MODULE_DEFAULTS[data.specialty]).filter(Boolean).length} / 12
                  </span>
                </div>
                {data.trial !== '0' && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Essai</span>
                    <span className="font-semibold">{data.trial} jours</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500 text-center">
                Un email sera envoyé à{' '}
                <span className="font-semibold text-slate-700">{data.email || '—'}</span>
                {' '}avec les accès et le mot de passe temporaire.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {saveError && (
          <div className="mx-6 mb-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {saveError}
          </div>
        )}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center">
          <button
            onClick={() => step > 0 ? setStep((step - 1) as WizardStep) : onClose()}
            disabled={saving}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-40"
          >
            {step === 0 ? 'Annuler' : 'Retour'}
          </button>
          {step < 3 ? (
            <button
              onClick={() => setStep((step + 1) as WizardStep)}
              disabled={step === 0 && !canNext}
              className="sa-btn disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Suivant
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={saving}
              className="sa-btn disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Création…
                </>
              ) : (
                'Créer le compte'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Detail Tabs ──────────────────────────────────────────────────────────────

// Tab: Profil
function TabProfil({ tenant, onUpdate }: { tenant: TenantDetailed; onUpdate: (t: TenantDetailed) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(tenant);

  const handleSave = () => {
    onUpdate(draft);
    setEditing(false);
  };

  const field = (label: string, icon: React.ReactNode, value: string | null | undefined, field: keyof TenantDetailed) => (
    <div>
      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1">{label}</label>
      {editing ? (
        <input
          className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={(draft[field] as string | undefined) ?? ''}
          onChange={e => setDraft(d => ({ ...d, [field]: e.target.value }))}
        />
      ) : (
        <div className="flex items-center gap-2 text-sm text-slate-700">
          {icon}
          <span>{value || <span className="text-slate-400 italic">Non renseigné</span>}</span>
        </div>
      )}
    </div>
  );

  const specialty = tenant.specialty ?? 'dentistry';

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-white rounded-[20px] border border-slate-100 p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl ${getAvatarColor(tenant.id)} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>
              {getInitials(tenant.name)}
            </div>
            <div>
              {editing ? (
                <input
                  className="border border-slate-200 rounded-xl px-3 py-1 text-base font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={draft.name}
                  onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
                />
              ) : (
                <h3 className="text-base font-bold text-slate-900">{tenant.name}</h3>
              )}
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium mt-1 inline-block">
                {SPECIALTY_LABELS[specialty]}
              </span>
            </div>
          </div>
          <button
            onClick={() => editing ? handleSave() : setEditing(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              editing
                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {editing ? <><IconCheck className="w-3.5 h-3.5" /> Sauvegarder</> : <><IconEdit className="w-3.5 h-3.5" /> Modifier</>}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {field('Email', <IconMail className="w-4 h-4 text-slate-400" />, tenant.email, 'email')}
          {field('Téléphone', <IconPhone className="w-4 h-4 text-slate-400" />, tenant.phone, 'phone')}
          {field('Ville', <IconMapPin className="w-4 h-4 text-slate-400" />, tenant.city, 'city')}
          {field('Adresse', <IconMapPin className="w-4 h-4 text-slate-400" />, tenant.address, 'address')}
          {field('Médecin', <IconShield className="w-4 h-4 text-slate-400" />, tenant.contactName, 'contactName')}
          {field('Email facturation', <IconMail className="w-4 h-4 text-slate-400" />, tenant.billingEmail, 'billingEmail')}
        </div>

        {editing && (
          <div className="flex justify-end mt-4">
            <button onClick={() => { setDraft(tenant); setEditing(false); }} className="text-sm text-slate-500 hover:text-slate-700 mr-3">
              Annuler
            </button>
            <button onClick={handleSave} className="sa-btn">Sauvegarder</button>
          </div>
        )}
      </div>

      {/* Meta info */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Rejoint le', value: new Date(tenant.joinedAt).toLocaleDateString('fr-FR') },
          { label: 'Région', value: tenant.region || tenant.city || '—' },
          { label: 'MRR', value: `${tenant.mrr.toLocaleString()} MAD` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-[20px] border border-slate-100 p-4 text-center">
            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-widest">{label}</p>
            <p className="text-sm font-bold text-slate-900 mt-1">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Tab: Domaines
function TabDomaines({ tenant, onUpdate }: { tenant: TenantDetailed; onUpdate: (t: TenantDetailed) => void }) {
  const slug = tenant.slug ?? makeSlug(tenant.name);
  const publicUrl = tenant.publicDomain ?? `${slug}.medicom.app`;
  const adminUrl = tenant.adminDomain ?? `${slug}-admin.medicom.app`;
  const [customInput, setCustomInput] = useState('');
  const [showDns, setShowDns] = useState(false);

  const handleApplyDomain = () => {
    if (!customInput) return;
    onUpdate({
      ...tenant,
      publicDomain: `www.${customInput}`,
      adminDomain: `admin.${customInput}`,
    });
    setCustomInput('');
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {/* Public URL */}
        <div className="bg-white rounded-[20px] border border-slate-100 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
              <IconGlobe className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-xs font-bold text-slate-700">Page publique</p>
          </div>
          <p className="font-mono text-xs text-blue-600 break-all mb-3">{publicUrl}</p>
          <div className="flex items-center gap-2">
            <CopyButton value={`https://${publicUrl}`} />
            <a
              href={`https://${publicUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
            >
              <IconExternalLink className="w-3.5 h-3.5" />
            </a>
            <span className="ml-auto text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-medium">
              En ligne
            </span>
          </div>
        </div>

        {/* Admin URL */}
        <div className="bg-white rounded-[20px] border border-slate-100 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center">
              <IconShield className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-xs font-bold text-slate-700">Interface admin</p>
          </div>
          <p className="font-mono text-xs text-slate-600 break-all mb-3">{adminUrl}</p>
          <div className="flex items-center gap-2">
            <CopyButton value={`https://${adminUrl}`} />
            <span className="ml-auto text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
              Sécurisé
            </span>
          </div>
        </div>
      </div>

      {/* Custom domain */}
      <div className="bg-white rounded-[20px] border border-slate-100 p-4">
        <SectionLabel>Domaine personnalisé</SectionLabel>
        <div className="flex gap-2 mb-3">
          <input
            className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="drlebbar.ma"
            value={customInput}
            onChange={e => setCustomInput(e.target.value)}
          />
          <button onClick={handleApplyDomain} className="sa-btn" disabled={!customInput}>
            Appliquer
          </button>
        </div>

        <button
          onClick={() => setShowDns(!showDns)}
          className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700"
        >
          <IconChevronDown className={`w-4 h-4 transition-transform ${showDns ? 'rotate-180' : ''}`} />
          Instructions DNS
        </button>

        {showDns && (
          <div className="mt-3 space-y-2">
            <div className="bg-slate-900 rounded-xl p-3 text-xs font-mono space-y-1.5">
              <p className="text-slate-400"># Enregistrements DNS requis</p>
              <p><span className="text-emerald-400">A</span><span className="text-slate-400 mx-2">@</span><span className="text-yellow-300">94.23.156.12</span></p>
              <p><span className="text-emerald-400">CNAME</span><span className="text-slate-400 mx-2">www</span><span className="text-yellow-300">proxy.medicom.app</span></p>
              <p><span className="text-emerald-400">CNAME</span><span className="text-slate-400 mx-2">admin</span><span className="text-yellow-300">proxy.medicom.app</span></p>
            </div>
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <IconAlertTriangle className="w-3.5 h-3.5" />
              La propagation DNS peut prendre 24–48h après modification
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`w-2 h-2 rounded-full ${tenant.publicDomain ? 'bg-emerald-500' : 'bg-amber-400'}`} />
              <span className="text-xs text-slate-600">
                {tenant.publicDomain ? 'Domaine personnalisé actif' : 'Aucun domaine personnalisé configuré'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Tab: Plan & Accès
function TabPlan({ tenant, onUpdate }: { tenant: TenantDetailed; onUpdate: (t: TenantDetailed) => void }) {
  const currentPlanKey = tenant.planTier ?? tenant.plan.toLowerCase();
  const modules = tenant.enabledModules;

  const handlePlanChange = (key: string) => {
    const cfg = PLAN_CONFIG[key];
    onUpdate({
      ...tenant,
      plan: (cfg?.label ?? 'Pro') as 'Starter' | 'Pro' | 'Premium',
      planTier: key as 'starter' | 'pro' | 'premium',
    });
  };

  const handleToggleModule = (mod: keyof ModuleConfiguration) => {
    onUpdate({
      ...tenant,
      enabledModules: { ...modules, [mod]: !modules[mod] },
    });
  };

  const specialty = tenant.specialty ?? 'dentistry';
  const defaults = SPECIALTY_MODULE_DEFAULTS[specialty];

  return (
    <div className="space-y-4">
      {/* Plan selector */}
      <div className="bg-white rounded-[20px] border border-slate-100 p-4">
        <SectionLabel>Plan tarifaire</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(PLAN_CONFIG).map(([key, plan]) => (
            <button
              key={key}
              onClick={() => handlePlanChange(key)}
              className={`relative rounded-xl border-2 p-3 text-left transition-all ${
                currentPlanKey === key
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {plan.popular && (
                <span className="absolute top-2 right-2 text-[9px] bg-blue-500 text-white px-1.5 py-0.5 rounded-full">
                  Populaire
                </span>
              )}
              <p className={`text-xs font-bold ${plan.color}`}>{plan.label}</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">
                {plan.price > 0 ? `${plan.price} MAD` : 'Sur devis'}
              </p>
              <p className="text-[10px] text-slate-500">{plan.maxUsers} users · {plan.storage}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Module toggles */}
      <div className="bg-white rounded-[20px] border border-slate-100 p-4">
        <SectionLabel>Modules inclus · {SPECIALTY_LABELS[specialty]}</SectionLabel>
        <div className="space-y-2">
          {(Object.keys(modules) as (keyof ModuleConfiguration)[]).map(mod => {
            const enabled = modules[mod];
            const defaultOn = defaults[mod];
            const locked = mod === 'dashboard' || mod === 'calendar' || mod === 'patients';
            return (
              <div key={mod} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-2">
                  {locked && <IconLock className="w-3 h-3 text-slate-300" />}
                  <span className={`text-sm ${enabled ? 'text-slate-800' : 'text-slate-400'}`}>
                    {MODULE_LABELS[mod]}
                  </span>
                  {!defaultOn && (
                    <span className="text-[9px] bg-amber-100 text-amber-700 px-1 py-0.5 rounded font-medium">
                      Non inclus spécialité
                    </span>
                  )}
                </div>
                {locked ? (
                  <span className="text-[10px] text-slate-400">Toujours actif</span>
                ) : (
                  <button onClick={() => handleToggleModule(mod)} className="text-slate-400 hover:text-slate-600">
                    {enabled
                      ? <IconToggleRight className="w-6 h-6 text-blue-500" />
                      : <IconToggleLeft className="w-6 h-6" />
                    }
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Tab: Page Web
function TabPageWeb({ tenant }: { tenant: TenantDetailed }) {
  const slug = tenant.slug ?? makeSlug(tenant.name);
  const [pageTitle, setPageTitle] = useState(tenant.name);
  const [pageDesc, setPageDesc] = useState('');
  const [accentColor, setAccentColor] = useState('#3B82F6');

  return (
    <div className="space-y-4">
      {/* Landing page card */}
      <div className="bg-white rounded-[20px] border border-slate-100 overflow-hidden">
        {/* Thumbnail */}
        <div
          className="h-36 flex flex-col items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${accentColor}22, ${accentColor}55)` }}
        >
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-lg mb-2"
            style={{ background: accentColor }}
          >
            {getInitials(tenant.name)}
          </div>
          <p className="text-sm font-bold text-slate-800">{pageTitle || tenant.name}</p>
          <p className="text-xs text-slate-500 mt-1 font-mono">{slug}.medicom.app</p>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
              Publiée
            </span>
            <div className="flex gap-2">
              <a
                href={`/admin/landing-pages/${tenant.id}`}
                className="sa-btn text-xs py-1.5"
              >
                <IconEdit className="w-3.5 h-3.5" />
                Ouvrir le builder
              </a>
              <a
                href={`/c/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <IconExternalLink className="w-3.5 h-3.5" />
                Voir la page
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Quick settings */}
      <div className="bg-white rounded-[20px] border border-slate-100 p-4">
        <SectionLabel>Paramètres rapides</SectionLabel>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Titre de la page</label>
            <input
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={pageTitle}
              onChange={e => setPageTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
            <input
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Votre cabinet de confiance à..."
              value={pageDesc}
              onChange={e => setPageDesc(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Couleur principale</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer"
                value={accentColor}
                onChange={e => setAccentColor(e.target.value)}
              />
              <span className="font-mono text-sm text-slate-600">{accentColor}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Tab: Équipe
function TabEquipe({ tenant }: { tenant: TenantDetailed }) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', email: '', password: '', role: 'assistant' as TeamMember['role'] });
  const [addingSaving, setAddingSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingMembers(true);
    import('../lib/supabase').then(({ supabase }) => {
      if (!supabase) { setLoadingMembers(false); return; }
      supabase
        .from('users')
        .select('id, name, full_name, first_name, last_name, email, role, status, is_active')
        .eq('tenant_id', tenant.id)
        .then(({ data }) => {
          if (cancelled) return;
          const mapped: TeamMember[] = (data ?? []).map((u: any) => {
            const displayName = u.name || u.full_name || `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email;
            const role: TeamMember['role'] =
              u.role === 'clinic_admin' ? 'admin' :
              u.role === 'doctor' ? 'docteur' : 'assistant';
            const status: TeamMember['status'] =
              (u.status === 'active' || u.is_active === true) ? 'active' :
              u.status === 'invited' ? 'invited' : 'inactive';
            return {
              id: u.id,
              name: displayName,
              email: u.email ?? '',
              role,
              status,
              avatarColor: getAvatarColor(u.id),
            };
          });
          setMembers(mapped);
          setLoadingMembers(false);
        });
    });
    return () => { cancelled = true; };
  }, [tenant.id]);

  const ROLE_BADGE: Record<TeamMember['role'], string> = {
    admin: 'bg-purple-100 text-purple-700',
    docteur: 'bg-blue-100 text-blue-700',
    assistant: 'bg-slate-100 text-slate-600',
  };

  const STATUS_LABEL: Record<TeamMember['status'], string> = {
    active: 'Actif',
    invited: 'Invité',
    inactive: 'Inactif',
  };

  const handleAdd = async () => {
    if (!newMember.name || !newMember.email || !newMember.password) return;
    setAddingSaving(true);
    setAddError(null);
    try {
      await createClinicWithAdmin({
        clinic_name: tenant.name,
        plan: (tenant.planTier ?? 'starter') as 'starter' | 'pro' | 'premium',
        admin_email: newMember.email,
        admin_password: newMember.password,
        admin_name: newMember.name,
        admin_role: newMember.role === 'admin' ? 'clinic_admin' : newMember.role === 'docteur' ? 'doctor' : 'staff',
      });
      setMembers(m => [
        ...m,
        {
          id: `u${Date.now()}`,
          name: newMember.name,
          email: newMember.email,
          role: newMember.role,
          status: 'active',
          avatarColor: AVATAR_COLORS[members.length % AVATAR_COLORS.length] ?? 'bg-slate-500',
        },
      ]);
      setNewMember({ name: '', email: '', password: '', role: 'assistant' });
      setShowAddForm(false);
    } catch (err: any) {
      setAddError(err.message ?? 'Erreur');
    } finally {
      setAddingSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-[20px] border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <p className="text-xs font-bold text-slate-700">{members.length} membre{members.length !== 1 ? 's' : ''}</p>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
          >
            <IconUserPlus className="w-3.5 h-3.5" />
            Ajouter
          </button>
        </div>

        {loadingMembers && (
          <div className="flex items-center justify-center py-6">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Add form */}
        {showAddForm && (
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
            {addError && (
              <p className="text-xs text-red-600 mb-2">{addError}</p>
            )}
            <div className="grid grid-cols-3 gap-2 mb-2">
              <input
                className="border border-slate-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nom complet"
                value={newMember.name}
                onChange={e => setNewMember(n => ({ ...n, name: e.target.value }))}
              />
              <input
                className="border border-slate-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="email@cabinet.ma"
                value={newMember.email}
                onChange={e => setNewMember(n => ({ ...n, email: e.target.value }))}
              />
              <select
                className="border border-slate-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={newMember.role}
                onChange={e => setNewMember(n => ({ ...n, role: e.target.value as TeamMember['role'] }))}
              >
                <option value="admin">Admin</option>
                <option value="docteur">Docteur</option>
                <option value="assistant">Assistant</option>
              </select>
            </div>
            <input
              type="password"
              className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
              placeholder="Mot de passe (8 car. min)"
              value={newMember.password}
              onChange={e => setNewMember(n => ({ ...n, password: e.target.value }))}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => { setShowAddForm(false); setAddError(null); }} disabled={addingSaving} className="text-xs text-slate-500 hover:text-slate-700 disabled:opacity-40">Annuler</button>
              <button onClick={handleAdd} disabled={addingSaving || !newMember.name || !newMember.email || newMember.password.length < 8} className="sa-btn text-xs py-1.5 disabled:opacity-40 flex items-center gap-1.5">
                {addingSaving ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Création…</> : 'Créer le compte'}
              </button>
            </div>
          </div>
        )}

        <table className="w-full text-sm">
          <tbody>
            {members.map(m => (
              <tr key={m.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg ${m.avatarColor} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                      {getInitials(m.name)}
                    </div>
                    <span className="font-medium text-slate-900">{m.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs">{m.email}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ROLE_BADGE[m.role]}`}>
                    {m.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-400">{STATUS_LABEL[m.status]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Tab: Usage
function TabUsage({ tenant }: { tenant: TenantDetailed }) {
  const planKey = tenant.planTier ?? tenant.plan.toLowerCase();
  const planCfg = PLAN_CONFIG[planKey];
  const maxUsers = planCfg?.maxUsers ?? 5;
  const maxPatients = planCfg?.maxPatients ?? null;

  const usedPatients = 187;
  const usedAppointments = 64;
  const storageGB = parseFloat(tenant.storageUsed?.replace(/[^0-9.]/g, '') ?? '1.2');
  const maxStorageGB = parseInt((planCfg?.storage ?? '10 GB').replace(/[^0-9]/g, '')) || 10;

  const kpis = [
    {
      label: 'Patients',
      value: usedPatients,
      max: maxPatients,
      displayValue: usedPatients.toLocaleString(),
      icon: <IconUsers className="w-4 h-4 text-blue-500" />,
      iconBg: 'bg-blue-50',
      color: 'bg-blue-500',
    },
    {
      label: 'RDV ce mois',
      value: usedAppointments,
      max: null,
      displayValue: usedAppointments.toLocaleString(),
      icon: <IconCalendar className="w-4 h-4 text-purple-500" />,
      iconBg: 'bg-purple-50',
      color: 'bg-purple-500',
    },
    {
      label: 'Stockage utilisé',
      value: storageGB,
      max: maxStorageGB,
      displayValue: tenant.storageUsed ?? `${storageGB} GB`,
      icon: <IconDatabase className="w-4 h-4 text-emerald-500" />,
      iconBg: 'bg-emerald-50',
      color: 'bg-emerald-500',
    },
    {
      label: 'Utilisateurs actifs',
      value: tenant.usersCount,
      max: maxUsers,
      displayValue: String(tenant.usersCount),
      icon: <IconShield className="w-4 h-4 text-amber-500" />,
      iconBg: 'bg-amber-50',
      color: 'bg-amber-500',
    },
  ];

  const ACTIVITY = [
    { text: 'Connexion Dr. admin', time: 'il y a 2h', dot: 'bg-blue-400' },
    { text: 'Nouveau patient enregistré', time: 'hier', dot: 'bg-emerald-400' },
    { text: 'Facture #1042 générée', time: 'il y a 3j', dot: 'bg-purple-400' },
    { text: 'Mise à jour plan → Pro', time: 'il y a 5j', dot: 'bg-amber-400' },
  ];

  return (
    <div className="space-y-4">
      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3">
        {kpis.map(kpi => {
          const pct = kpi.max ? Math.min(100, Math.round(kpi.value / kpi.max * 100)) : null;
          const isNearLimit = pct !== null && pct >= 80;
          return (
            <div key={kpi.label} className="bg-white rounded-[12px] border border-slate-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-[10px] ${kpi.iconBg} flex items-center justify-center`}>
                  {kpi.icon}
                </div>
                {isNearLimit && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
                    Limite proche
                  </span>
                )}
              </div>
              <p className="text-[26px] font-semibold text-slate-900 tracking-tight leading-none mb-1">
                {kpi.displayValue}
              </p>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                {kpi.label}
              </p>
              {pct !== null && kpi.max !== null && (
                <div className="mt-3">
                  <div className="bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isNearLimit ? 'bg-amber-500' : kpi.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">{kpi.value} / {kpi.max} • {pct}%</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Activity feed */}
      <div className="bg-white rounded-[12px] border border-slate-100 p-5">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4">
          Activité récente
        </p>
        <div className="space-y-0">
          {ACTIVITY.map((item, i) => (
            <div key={i} className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
              <span className={`w-2 h-2 rounded-full ${item.dot} flex-shrink-0`} />
              <span className="text-[13px] text-slate-700 flex-1">{item.text}</span>
              <span className="text-[11px] text-slate-400">{item.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* System health */}
      <div className="bg-white rounded-[12px] border border-slate-100 p-5">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4">
          Santé du système
        </p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Uptime', value: '99.98%', color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Latence API', value: '94 ms', color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Erreurs 7j', value: '2', color: 'text-slate-700', bg: 'bg-slate-50' },
          ].map(stat => (
            <div key={stat.label} className={`${stat.bg} rounded-[10px] p-3 text-center`}>
              <p className={`text-[18px] font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Tab: Billing
function TabBilling({ tenant }: { tenant: TenantDetailed }) {
  const planKey = tenant.planTier ?? tenant.plan.toLowerCase();
  const planCfg = PLAN_CONFIG[planKey];
  const mrr = tenant.mrr;
  const annualValue = mrr * 12;

  const nextBillingDate = new Date();
  nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
  nextBillingDate.setDate(1);
  const nextBillingStr = nextBillingDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

  const MOCK_INVOICES = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return {
      id: `INV-${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}-${String(100 + i).padStart(3, '0')}`,
      date: d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }),
      period: d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
      amount: mrr,
      status: i === 0 ? 'pending' : 'paid',
    };
  });

  const STATUS_STYLE: Record<string, string> = {
    paid: 'bg-emerald-50 text-emerald-700',
    pending: 'bg-amber-50 text-amber-700',
    failed: 'bg-red-50 text-red-700',
  };
  const STATUS_LABEL: Record<string, string> = {
    paid: 'Payée',
    pending: 'En attente',
    failed: 'Échouée',
  };

  return (
    <div className="space-y-4">
      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: 'MRR',
            value: `${mrr.toLocaleString()} MAD`,
            sub: `${annualValue.toLocaleString()} MAD / an`,
            icon: <IconDollarSign className="w-4 h-4 text-emerald-500" />,
            iconBg: 'bg-emerald-50',
            trend: '+12%',
            trendUp: true,
          },
          {
            label: 'Plan actif',
            value: planCfg?.label ?? tenant.plan,
            sub: `${planCfg?.maxUsers ?? '5'} utilisateurs max`,
            icon: <IconZap className="w-4 h-4 text-blue-500" />,
            iconBg: 'bg-blue-50',
            trend: null,
            trendUp: true,
          },
          {
            label: 'Prochaine facture',
            value: nextBillingStr,
            sub: `${mrr.toLocaleString()} MAD prévu`,
            icon: <IconCalendar className="w-4 h-4 text-purple-500" />,
            iconBg: 'bg-purple-50',
            trend: null,
            trendUp: true,
          },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-[12px] border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-[10px] ${card.iconBg} flex items-center justify-center`}>
                {card.icon}
              </div>
              {card.trend && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                  {card.trend}
                </span>
              )}
            </div>
            <p className="text-[20px] font-semibold text-slate-900 tracking-tight leading-none mb-1">
              {card.value}
            </p>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1">
              {card.label}
            </p>
            <p className="text-[11px] text-slate-400">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Invoice history */}
      <div className="bg-white rounded-[12px] border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <p className="text-[15px] font-semibold text-slate-900 tracking-tight">Historique des factures</p>
          <button className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-500 hover:text-slate-700 transition-colors">
            <IconDownload className="w-3.5 h-3.5" />
            Exporter
          </button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Facture</th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Période</th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Montant</th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Statut</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {MOCK_INVOICES.map(inv => (
              <tr key={inv.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                <td className="px-5 py-3">
                  <span className="text-[13px] font-mono text-slate-700">{inv.id}</span>
                </td>
                <td className="px-5 py-3 text-[13px] text-slate-600 capitalize">{inv.period}</td>
                <td className="px-5 py-3 text-[13px] font-semibold text-slate-900">{inv.amount.toLocaleString()} MAD</td>
                <td className="px-5 py-3">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[inv.status]}`}>
                    {STATUS_LABEL[inv.status]}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <button className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 ml-auto">
                    <IconDownload className="w-3 h-3" />
                    PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Payment method + billing settings */}
      <div className="grid grid-cols-2 gap-3">
        {/* Payment method */}
        <div className="bg-white rounded-[12px] border border-slate-100 p-5">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4">
            Moyen de paiement
          </p>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-[10px] bg-slate-900 flex items-center justify-center flex-shrink-0">
              <IconCreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-slate-900">Visa •••• 4242</p>
              <p className="text-[11px] text-slate-400">Expire 09/26</p>
            </div>
          </div>
          <button className="w-full text-[12px] font-semibold text-blue-600 hover:text-blue-700 text-left flex items-center gap-1.5 transition-colors">
            <IconRefresh className="w-3.5 h-3.5" />
            Mettre à jour
          </button>
        </div>

        {/* Billing settings */}
        <div className="bg-white rounded-[12px] border border-slate-100 p-5">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4">
            Paramètres de facturation
          </p>
          <div className="space-y-3">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 mb-1">Email de facturation</p>
              <p className="text-[13px] text-slate-900 font-medium">{tenant.billingEmail ?? tenant.email}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 mb-1">Cycle</p>
              <p className="text-[13px] text-slate-900 font-medium">Mensuel</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 mb-1">Membre depuis</p>
              <p className="text-[13px] text-slate-900 font-medium">
                {new Date(tenant.joinedAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-[12px] border border-slate-100 p-5">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4">
          Zone critique
        </p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-semibold text-slate-900">Annuler l'abonnement</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Le cabinet perdra l'accès à la fin de la période</p>
          </div>
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[12px] font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
            <IconAlertTriangle className="w-3.5 h-3.5" />
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function Cabinets() {
  const [tenants, setTenants] = useState<TenantDetailed[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');
  const [detailTab, setDetailTab] = useState<DetailTab>('profil');
  const [showWizard, setShowWizard] = useState(false);
  const [loading, setLoading] = useState(false);

  // Try loading real tenants
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAllTenants()
      .then(data => {
        if (!cancelled) setTenants(data);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    return tenants.filter(t => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        t.name.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        t.contactName.toLowerCase().includes(q);
      const matchTab = filterTab === 'all' ||
        (filterTab === 'active' && t.status === 'Active') ||
        (filterTab === 'suspended' && t.status === 'Suspended') ||
        (filterTab === 'trial' && t.trialEndsAt && new Date(t.trialEndsAt) > new Date());
      return matchSearch && matchTab;
    });
  }, [tenants, search, filterTab]);

  const selected = tenants.find(t => t.id === selectedId) ?? null;

  const updateTenant = (updated: TenantDetailed) => {
    setTenants(ts => ts.map(t => t.id === updated.id ? updated : t));
  };

  const handleToggleStatus = () => {
    if (!selected) return;
    const nextStatus = selected.status === 'Active' ? 'Suspended' : 'Active';
    updateTenant({ ...selected, status: nextStatus });
    if (nextStatus === 'Suspended') suspendTenant(selected.id).catch(() => {});
    else activateTenant(selected.id).catch(() => {});
  };

  const FILTER_TABS: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'Tous' },
    { key: 'active', label: 'Actif' },
    { key: 'trial', label: 'Essai' },
    { key: 'suspended', label: 'Suspendu' },
  ];

  const DETAIL_TABS: { key: DetailTab; label: string; icon: React.ReactNode }[] = [
    { key: 'profil', label: 'Profil', icon: <IconSettings className="w-4 h-4" /> },
    { key: 'domaines', label: 'Domaines', icon: <IconGlobe className="w-4 h-4" /> },
    { key: 'plan', label: 'Plan & Accès', icon: <IconZap className="w-4 h-4" /> },
    { key: 'page-web', label: 'Page Web', icon: <IconFileText className="w-4 h-4" /> },
    { key: 'equipe', label: 'Équipe', icon: <IconUsers className="w-4 h-4" /> },
    { key: 'usage', label: 'Usage', icon: <IconTrendingUp className="w-4 h-4" /> },
    { key: 'billing', label: 'Facturation', icon: <IconCreditCard className="w-4 h-4" /> },
  ];

  return (
    <div className="flex h-full bg-[#FAFAFA] overflow-hidden">
      {/* ── Left Panel ── */}
      <div className="w-[340px] flex-shrink-0 flex flex-col border-r border-slate-200 bg-white">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Cabinets</h2>
              <p className="text-xs text-slate-400">{tenants.length} cabinet{tenants.length !== 1 ? 's' : ''}</p>
            </div>
            <button onClick={() => setShowWizard(true)} className="sa-btn flex items-center gap-1.5">
              <IconPlus className="w-4 h-4" />
              Nouveau
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-[20px] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
              placeholder="Rechercher..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 mt-3">
            {FILTER_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilterTab(tab.key)}
                className={`flex-1 text-xs font-semibold py-1.5 rounded-xl transition-colors ${
                  filterTab === tab.key
                    ? 'bg-blue-500 text-white'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto py-2">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-12">
              <IconSearch className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Aucun cabinet trouvé</p>
            </div>
          )}
          {filtered.map(t => {
            const specialty = t.specialty ?? 'dentistry';
            const isSelected = t.id === selectedId;
            return (
              <button
                key={t.id}
                onClick={() => { setSelectedId(t.id); setDetailTab('profil'); }}
                className={`w-full text-left px-4 py-3 border-b border-slate-50 transition-colors ${
                  isSelected ? 'bg-blue-50 border-l-2 border-l-blue-500' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl ${getAvatarColor(t.id)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                    {getInitials(t.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900 truncate">{t.name}</span>
                      <StatusDot status={t.status} />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-500 truncate">{SPECIALTY_LABELS[specialty]}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <PlanBadge plan={t.planTier ?? t.plan} />
                      <span className="text-[10px] text-slate-400">{t.mrr.toLocaleString()} MAD</span>
                    </div>
                  </div>
                  {isSelected && <IconChevronRight className="w-4 h-4 text-blue-400 flex-shrink-0" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selected ? (
          <>
            {/* Detail header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl ${getAvatarColor(selected.id)} flex items-center justify-center text-white font-bold`}>
                    {getInitials(selected.name)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{selected.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <StatusDot status={selected.status} />
                      <span className="text-xs text-slate-500">{selected.status}</span>
                      <PlanBadge plan={selected.planTier ?? selected.plan} />
                      {selected.specialty && (
                        <span className="text-xs text-slate-500">{SPECIALTY_LABELS[selected.specialty]}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleStatus}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                      selected.status === 'Active'
                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                        : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                    }`}
                  >
                    {selected.status === 'Active'
                      ? <><IconAlertTriangle className="w-3.5 h-3.5" /> Suspendre</>
                      : <><IconCheck className="w-3.5 h-3.5" /> Activer</>
                    }
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                    <IconDownload className="w-3.5 h-3.5" />
                    Export
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                {DETAIL_TABS.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setDetailTab(tab.key)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors flex-shrink-0 ${
                      detailTab === tab.key
                        ? 'bg-blue-500 text-white'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-6">
              {detailTab === 'profil' && (
                <TabProfil tenant={selected} onUpdate={updateTenant} />
              )}
              {detailTab === 'domaines' && (
                <TabDomaines tenant={selected} onUpdate={updateTenant} />
              )}
              {detailTab === 'plan' && (
                <TabPlan tenant={selected} onUpdate={updateTenant} />
              )}
              {detailTab === 'page-web' && (
                <TabPageWeb tenant={selected} />
              )}
              {detailTab === 'equipe' && (
                <TabEquipe tenant={selected} />
              )}
              {detailTab === 'usage' && (
                <TabUsage tenant={selected} />
              )}
              {detailTab === 'billing' && (
                <TabBilling tenant={selected} />
              )}
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <IconShield className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-base font-bold text-slate-700 mb-2">Sélectionnez un cabinet</h3>
            <p className="text-sm text-slate-400 max-w-xs mb-6">
              Choisissez un cabinet dans la liste pour gérer son profil, ses domaines, son plan et son équipe.
            </p>
            <button onClick={() => setShowWizard(true)} className="sa-btn flex items-center gap-2">
              <IconPlus className="w-4 h-4" />
              Nouveau Cabinet
            </button>
          </div>
        )}
      </div>

      {/* Wizard modal */}
      {showWizard && (
        <OnboardingWizard
          onClose={() => setShowWizard(false)}
          onCreate={tenant => {
            setTenants(ts => [tenant, ...ts]);
            setSelectedId(tenant.id);
          }}
        />
      )}
    </div>
  );
}

export default Cabinets;
