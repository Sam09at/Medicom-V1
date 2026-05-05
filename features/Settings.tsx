import React, { useState, useEffect } from 'react';
import {
  IconMessage,
  IconCheck,
  IconUsers,
  IconUserPlus,
  IconPlus,
  IconMoreHorizontal,
  IconShield,
  IconDollarSign,
  IconGlobe,
  IconCode,
  IconEdit,
  IconTrash,
  IconClipboard,
  IconHome,
  IconX,
  IconClock,
  IconSettings,
  IconBell,
  IconCreditCard,
} from '../components/Icons';
import { PLAN_PRICING } from '../constants';
import { MedicalService } from '../types';
import { supabase, getCurrentTenantId } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import { applyLanguageDirection } from '../lib/i18n';
import { useMedicomStore } from '../store';
import { WhatsAppLog } from './WhatsAppLog';
import { useServices } from '../hooks/useServices';

/* ── Mock data ── */
const MOCK_STAFF = [
  { id: 1, name: 'Dr. Amina El Amrani', role: 'Propriétaire', email: 'amina@cabinet.ma', status: 'Actif', lastActive: 'Il y a 5 min' },
  { id: 2, name: 'Sarah Benani', role: 'Assistante', email: 'sarah@cabinet.ma', status: 'Actif', lastActive: 'Il y a 1h' },
  { id: 3, name: 'Dr. Karim Tazi', role: 'Remplaçant', email: 'karim@gmail.com', status: 'Inactif', lastActive: 'Il y a 2 jours' },
];

/* ── Sub-components ── */
const SectionHeader = ({ title, desc }: { title: string; desc: string }) => (
  <div className="mb-6">
    <h2 className="text-[16px] font-semibold text-slate-900 tracking-tight">{title}</h2>
    <p className="text-[13px] text-slate-400 mt-0.5">{desc}</p>
  </div>
);

const SettingRow = ({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) => (
  <div className="flex items-center justify-between py-4 border-b border-slate-50 last:border-0">
    <div className="flex-1 pr-8">
      <p className="text-[13px] font-semibold text-slate-800">{label}</p>
      {desc && <p className="text-[12px] text-slate-400 mt-0.5">{desc}</p>}
    </div>
    <div className="shrink-0">{children}</div>
  </div>
);

const Toggle = ({ on, onChange }: { on: boolean; onChange: () => void }) => (
  <button onClick={onChange} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${on ? 'bg-slate-900' : 'bg-slate-200'}`}>
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow ${on ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
  </button>
);

// ─── SEO Tab ──────────────────────────────────────────────────────────────────

const SEO_SCORES = [
  { label: 'Titre SEO', score: 82, tip: 'Ajoutez votre ville au titre pour le SEO local.' },
  { label: 'Méta description', score: 65, tip: 'La description est trop courte. Visez 150–160 caractères.' },
  { label: 'Mots-clés locaux', score: 90, tip: 'Bonne utilisation des mots-clés géographiques.' },
  { label: 'Contenu des sections', score: 73, tip: 'Enrichissez la section "À propos" avec plus de détails.' },
  { label: 'Balises structurées', score: 55, tip: 'Ajoutez le schema.org MedicalClinic pour un meilleur référencement.' },
];

const SEO_SUGGESTIONS = [
  { icon: '🔍', title: 'Optimisez votre titre SEO', body: 'Incluez le nom de votre spécialité et votre ville. Ex : "Cabinet Dentaire à Casablanca — Dr. Benali"', action: 'Modifier le titre' },
  { icon: '📍', title: 'Renseignez votre adresse complète', body: 'Les recherches "dentiste près de moi" dépendent de votre adresse Google Maps.', action: 'Ajouter l\'adresse' },
  { icon: '⭐', title: 'Collectez des avis Google', body: 'Les cabinets avec ≥ 10 avis apparaissent 3× plus dans les résultats locaux.', action: 'Voir la stratégie' },
  { icon: '🖼️', title: 'Ajoutez des photos de qualité', body: 'Les cabinets avec des photos reçoivent 42 % de demandes de directions en plus.', action: 'Ajouter des photos' },
  { icon: '🕐', title: 'Vérifiez vos horaires d\'ouverture', body: 'Des horaires à jour évitent les avis négatifs pour "cabinet fermé".', action: 'Mettre à jour' },
];

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-400' : 'bg-rose-400';
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-[11px] font-semibold text-slate-500 w-7 text-right">{score}</span>
    </div>
  );
}

function SeoTab() {
  const [generating, setGenerating] = React.useState(false);
  const [generated, setGenerated] = React.useState(false);

  const avgScore = Math.round(SEO_SCORES.reduce((s, i) => s + i.score, 0) / SEO_SCORES.length);
  const scoreColor = avgScore >= 80 ? 'text-emerald-600' : avgScore >= 60 ? 'text-amber-500' : 'text-rose-500';

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setGenerated(true); }, 2200);
  };

  return (
    <div className="space-y-6">
      {/* Header + score */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[15px] font-semibold text-slate-900">SEO & Référencement local</p>
          <p className="text-[12px] text-slate-400 mt-0.5">Optimisez votre visibilité sur Google pour les patients de votre zone.</p>
        </div>
        <div className="text-right">
          <p className={`text-[32px] font-semibold leading-none ${scoreColor}`}>{avgScore}</p>
          <p className="text-[11px] text-slate-400 mt-1">Score SEO</p>
        </div>
      </div>

      {/* Audit breakdown */}
      <div className="border border-slate-100 rounded-[12px] overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Audit de la page</p>
        </div>
        <div className="divide-y divide-slate-50">
          {SEO_SCORES.map(item => (
            <div key={item.label} className="px-4 py-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-semibold text-slate-700">{item.label}</p>
              </div>
              <ScoreBar score={item.score} />
              <p className="text-[11px] text-slate-400">{item.tip}</p>
            </div>
          ))}
        </div>
      </div>

      {/* AI suggestions */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Suggestions IA</p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-[11px] font-semibold rounded-[8px] hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            {generating ? (
              <><div className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />Analyse…</>
            ) : (
              <><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>{generated ? 'Réanalyser' : 'Analyser avec l\'IA'}</>
            )}
          </button>
        </div>
        <div className="space-y-2">
          {SEO_SUGGESTIONS.map((s, i) => (
            <div key={i} className="flex items-start gap-3 p-3.5 border border-slate-100 rounded-[12px] hover:border-slate-200 transition-colors">
              <span className="text-[18px] leading-none mt-0.5">{s.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-slate-800">{s.title}</p>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{s.body}</p>
              </div>
              <button className="shrink-0 px-2.5 py-1 text-[11px] font-semibold text-slate-600 border border-slate-200 rounded-[8px] hover:bg-slate-50 transition-colors whitespace-nowrap">
                {s.action}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Google Business quick link */}
      <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-[12px]">
        <div className="w-9 h-9 bg-blue-600 rounded-[10px] flex items-center justify-center shrink-0">
          <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold text-blue-900">Profil Google Business</p>
          <p className="text-[11px] text-blue-600 mt-0.5">Revendiquez et optimisez votre fiche pour apparaître dans Google Maps.</p>
        </div>
        <button className="shrink-0 px-3 py-1.5 bg-blue-600 text-white text-[11px] font-semibold rounded-[8px] hover:bg-blue-700 transition-colors">
          Accéder
        </button>
      </div>
    </div>
  );
}

// ─── Subscription Tab ────────────────────────────────────────────────────────

const PLAN_FEATURES: Record<string, { label: string; included: boolean }[]> = {
  essentiel: [
    { label: 'Tableau de bord', included: true },
    { label: 'Calendrier de RDV', included: true },
    { label: 'Gestion patients', included: true },
    { label: 'Facturation de base', included: true },
    { label: 'Support intégré', included: true },
    { label: 'Traitements & protocoles', included: false },
    { label: 'Inventaire', included: false },
    { label: 'Documents & fichiers', included: false },
    { label: 'Rapports avancés', included: false },
    { label: 'Ordres de laboratoire', included: false },
  ],
  pro: [
    { label: 'Tableau de bord', included: true },
    { label: 'Calendrier de RDV', included: true },
    { label: 'Gestion patients', included: true },
    { label: 'Facturation de base', included: true },
    { label: 'Support intégré', included: true },
    { label: 'Traitements & protocoles', included: true },
    { label: 'Inventaire', included: true },
    { label: 'Documents & fichiers', included: true },
    { label: 'Rapports avancés', included: true },
    { label: 'Ordres de laboratoire', included: false },
  ],
  premium: [
    { label: 'Tableau de bord', included: true },
    { label: 'Calendrier de RDV', included: true },
    { label: 'Gestion patients', included: true },
    { label: 'Facturation de base', included: true },
    { label: 'Support intégré', included: true },
    { label: 'Traitements & protocoles', included: true },
    { label: 'Inventaire', included: true },
    { label: 'Documents & fichiers', included: true },
    { label: 'Rapports avancés', included: true },
    { label: 'Ordres de laboratoire', included: true },
  ],
};

const PLAN_ORDER = ['essentiel', 'pro', 'premium'] as const;

const PLAN_BADGE: Record<string, { bg: string; text: string; ring: string; btn: string }> = {
  essentiel: { bg: 'bg-slate-50', text: 'text-slate-700', ring: 'ring-slate-200', btn: 'bg-slate-900 hover:bg-slate-700 text-white' },
  pro:       { bg: 'bg-violet-50', text: 'text-violet-700', ring: 'ring-violet-300', btn: 'bg-violet-600 hover:bg-violet-700 text-white' },
  premium:   { bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-400', btn: 'bg-[#136cfb] hover:bg-blue-700 text-white' },
};

function SubscriptionTab({ currentPlan }: { currentPlan: string }) {
  const [annual, setAnnual] = React.useState(false);
  const [upgrading, setUpgrading] = React.useState<string | null>(null);
  const { showToast } = useMedicomStore();

  const activePlan = currentPlan.toLowerCase();

  const handleUpgrade = (planKey: string) => {
    if (planKey === activePlan) return;
    setUpgrading(planKey);
    setTimeout(() => {
      setUpgrading(null);
      showToast({ type: 'info', message: 'Contactez notre équipe pour mettre à jour votre abonnement.' });
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[15px] font-semibold text-slate-900">Mon abonnement</p>
          <p className="text-[12px] text-slate-400 mt-0.5">Gérez votre plan et accédez à plus de fonctionnalités.</p>
        </div>
        {/* Annual toggle */}
        <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-100 rounded-[10px] p-1">
          <button
            onClick={() => setAnnual(false)}
            className={`px-3 py-1 rounded-[8px] text-[11px] font-semibold transition-all ${!annual ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
          >
            Mensuel
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={`px-3 py-1 rounded-[8px] text-[11px] font-semibold transition-all flex items-center gap-1.5 ${annual ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
          >
            Annuel
            <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">−16%</span>
          </button>
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-3 gap-4">
        {PLAN_ORDER.map(planKey => {
          const plan = PLAN_PRICING[planKey];
          const style = PLAN_BADGE[planKey];
          const isCurrent = activePlan === planKey || (activePlan === 'starter' && planKey === 'essentiel');
          const isDowngrade = PLAN_ORDER.indexOf(planKey) < PLAN_ORDER.indexOf(activePlan as typeof PLAN_ORDER[number]);
          const monthlyPrice = annual ? Math.round(plan.mad * 0.84) : plan.mad;
          const features = PLAN_FEATURES[planKey];

          return (
            <div
              key={planKey}
              className={`relative rounded-[12px] border-2 p-5 flex flex-col gap-4 transition-all ${isCurrent ? `ring-2 ${style.ring} border-transparent bg-white` : 'border-slate-100 bg-white hover:border-slate-200'}`}
            >
              {isCurrent && (
                <div className={`absolute -top-2.5 left-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${style.bg} ${style.text} border border-current border-opacity-20`}>
                  Plan actuel
                </div>
              )}
              {planKey === 'pro' && !isCurrent && (
                <div className="absolute -top-2.5 left-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-violet-600 text-white">
                  Populaire
                </div>
              )}

              {/* Plan name + price */}
              <div>
                <p className={`text-[12px] font-bold uppercase tracking-widest mb-2 ${style.text}`}>{plan.label}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-[28px] font-semibold text-slate-900 leading-none">{monthlyPrice.toLocaleString('fr-FR')}</span>
                  <span className="text-[13px] text-slate-400">MAD/mois</span>
                </div>
                {annual && <p className="text-[11px] text-emerald-600 font-semibold mt-1">Facturé {(monthlyPrice * 12).toLocaleString('fr-FR')} MAD/an</p>}
              </div>

              {/* CTA button */}
              <button
                onClick={() => handleUpgrade(planKey)}
                disabled={isCurrent || isDowngrade}
                className={`w-full py-2 rounded-[10px] text-[12px] font-semibold transition-colors ${isCurrent
                  ? 'bg-slate-100 text-slate-400 cursor-default'
                  : isDowngrade
                    ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
                    : `${style.btn} flex items-center justify-center gap-2`
                }`}
              >
                {upgrading === planKey
                  ? <><div className="w-3.5 h-3.5 border border-white/40 border-t-white rounded-full animate-spin" />Traitement…</>
                  : isCurrent ? 'Plan actuel'
                  : isDowngrade ? 'Plan inférieur'
                  : `Passer à ${plan.label}`}
              </button>

              {/* Feature list */}
              <div className="space-y-1.5 border-t border-slate-50 pt-4">
                {features.map(f => (
                  <div key={f.label} className={`flex items-center gap-2 ${f.included ? '' : 'opacity-40'}`}>
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${f.included ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                      {f.included
                        ? <svg className="w-2.5 h-2.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        : <svg className="w-2.5 h-2.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      }
                    </div>
                    <p className="text-[11px] text-slate-600">{f.label}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Billing info strip */}
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-[12px] border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-[8px] border border-slate-200 flex items-center justify-center">
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <div>
            <p className="text-[12px] font-semibold text-slate-800">Renouvellement automatique</p>
            <p className="text-[11px] text-slate-400">Prochain paiement le 1 juin 2026 · Virement bancaire</p>
          </div>
        </div>
        <button className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition-colors underline underline-offset-2">
          Contacter la facturation
        </button>
      </div>
    </div>
  );
}

/* ── NAV ── */
const NAV_ITEMS = [
  { id: 'general', label: 'Général', icon: IconHome },
  { id: 'team', label: 'Équipe & Accès', icon: IconUsers },
  { id: 'services', label: 'Services & Tarifs', icon: IconDollarSign },
  { id: 'schedule', label: 'Horaires', icon: IconClock },
  { id: 'notifications', label: 'Notifications & SMS', icon: IconBell },
  { id: 'seo', label: 'SEO & Référencement', icon: IconGlobe },
  { id: 'subscription', label: 'Mon Abonnement', icon: IconCreditCard },
  { id: 'widget', label: 'Widget Réservation', icon: IconGlobe },
  { id: 'security', label: 'Sécurité', icon: IconShield },
  { id: 'language', label: 'Langue & Région', icon: IconGlobe },
];

/* ── Main ── */
export const Settings: React.FC = () => {
  const { t, i18n } = useTranslation();
  const currentUser = useMedicomStore(s => s.currentUser);
  const setDoctorPreferencesStore = useMedicomStore(s => s.setDoctorPreferences);

  const [activeTab, setActiveTab] = useState('general');
  const [currentLang, setCurrentLang] = useState(i18n.language || 'fr');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);

  /* General */
  const [clinicInfo, setClinicInfo] = useState({
    name: 'Cabinet Dentaire Dr. Amina', address: '123 Bd Zerktouni, Casablanca',
    phone: '+212 522 123 456', email: 'contact@cabinet-amina.ma',
    ice: '001122334455667', website: 'www.cabinet-amina.ma',
  });

  /* Notifications */
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState('24');
  const [messageTemplate, setMessageTemplate] = useState(
    'Bonjour {patient}, ceci est un rappel pour votre rendez-vous chez {cabinet} le {date} à {heure}. Répondez STOP pour ne plus recevoir de SMS.'
  );

  /* Services */
  const { services, save: saveServiceApi, toggle: toggleServiceApi } = useServices(true);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<MedicalService | null>(null);
  const [newService, setNewService] = useState({ name: '', code: '', price: 0, durationMinutes: 30 });

  /* Team */
  const [users, setUsers] = useState(MOCK_STAFF);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Assistante' });

  /* Widget */
  const [widgetColor, setWidgetColor] = useState('#2563eb');
  const [widgetTitle, setWidgetTitle] = useState('Prendre rendez-vous en ligne');
  const [copied, setCopied] = useState(false);

  /* Schedule */
  const [schedule, setSchedule] = useState([
    { day: 'Lundi', open: '09:00', close: '18:00', active: true },
    { day: 'Mardi', open: '09:00', close: '18:00', active: true },
    { day: 'Mercredi', open: '09:00', close: '18:00', active: true },
    { day: 'Jeudi', open: '09:00', close: '18:00', active: true },
    { day: 'Vendredi', open: '09:00', close: '17:00', active: true },
    { day: 'Samedi', open: '09:00', close: '13:00', active: true },
    { day: 'Dimanche', open: '00:00', close: '00:00', active: false },
  ]);

  /* Doctor prefs */
  const [autoStatusConsultation, setAutoStatusConsultation] = useState(false);
  const [defaultCalendarView, setDefaultCalendarView] = useState<'day' | 'week' | 'month'>('week');
  const [defaultSlotDuration, setDefaultSlotDuration] = useState(30);

  /* Load from Supabase */
  useEffect(() => {
    if (!supabase) return;
    (async () => {
      try {
        const tid = await getCurrentTenantId();
        setTenantId(tid);
        if (!tid) return;
        const { data: tenant } = await supabase.from('tenants').select('name, settings_json, email, website, ice').eq('id', tid).single();
        if (tenant) {
          setClinicInfo(prev => ({ ...prev, name: tenant.name || prev.name, email: tenant.email || prev.email, website: tenant.website || prev.website, ice: tenant.ice || prev.ice, ...(tenant.settings_json?.clinic || {}) }));
          if (tenant.settings_json?.schedule) setSchedule(tenant.settings_json.schedule);
          if (tenant.settings_json?.notifications) {
            const n = tenant.settings_json.notifications;
            setSmsEnabled(n.smsEnabled ?? true);
            setReminderTime(n.reminderTime ?? '24');
            setMessageTemplate(n.messageTemplate ?? messageTemplate);
          }
        }
        const { data: staffData } = await supabase.from('users').select('id, first_name, last_name, email, role, updated_at').eq('tenant_id', tid);
        if (staffData?.length) setUsers(staffData.map((u: any) => ({ id: u.id, name: `${u.first_name || ''} ${u.last_name || ''}`.trim(), role: u.role === 'clinic_admin' ? 'Propriétaire' : u.role === 'doctor' ? 'Médecin' : 'Assistante', email: u.email, status: 'Actif', lastActive: u.updated_at ? new Date(u.updated_at).toLocaleDateString('fr-FR') : 'N/A' })));
      } catch (err) { console.warn('[Settings] fallback:', err); }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (supabase && tenantId) {
        const { data: ct } = await supabase.from('tenants').select('settings_json').eq('id', tenantId).single();
        const cs = ct?.settings_json || {};
        await supabase.from('tenants').update({ name: clinicInfo.name, email: clinicInfo.email, website: clinicInfo.website, ice: clinicInfo.ice, settings_json: { ...cs, clinic: { address: clinicInfo.address, phone: clinicInfo.phone }, schedule, notifications: { smsEnabled, reminderTime, messageTemplate } } }).eq('id', tenantId);
      }
    } catch (err) { console.error('[Settings] save error:', err); }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleLanguageChange = (lang: string) => { i18n.changeLanguage(lang); setCurrentLang(lang); applyLanguageDirection(lang); };
  const updateSchedule = (i: number, field: string, value: string | boolean) => { const s = [...schedule]; (s[i] as any)[field] = value; setSchedule(s); };
  const copyWidget = () => { navigator.clipboard.writeText(`<iframe src="https://medicom.ma/widget/cabinet-amina" width="100%" height="600" frameborder="0"></iframe>`); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const openServiceModal = (svc?: MedicalService) => { setEditingService(svc || null); setNewService(svc ? { name: svc.name, code: svc.code || '', price: svc.price, durationMinutes: svc.durationMinutes } : { name: '', code: '', price: 0, durationMinutes: 30 }); setIsServiceModalOpen(true); };
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveServiceApi({
      ...(editingService ? { id: editingService.id } : {}),
      name: newService.name,
      code: newService.code,
      durationMinutes: newService.durationMinutes,
      price: newService.price,
      isActive: true,
    });
    setIsServiceModalOpen(false);
    setEditingService(null);
    setNewService({ name: '', code: '', price: 0, durationMinutes: 30 });
  };
  const deleteService = async (id: string) => {
    if (confirm('Supprimer cet acte ?')) await toggleServiceApi(id, false);
  };
  const handleInviteUser = (e: React.FormEvent) => { e.preventDefault(); setUsers([...users, { id: Date.now(), name: newUser.name, role: newUser.role, email: newUser.email, status: 'Actif', lastActive: 'Jamais' }]); setIsUserModalOpen(false); setNewUser({ name: '', email: '', role: 'Assistante' }); };

  /* ── Tab Content ── */
  const renderContent = () => {
    switch (activeTab) {
      case 'general': return (
        <div>
          <SectionHeader title="Informations du cabinet" desc="Ces informations apparaissent sur vos factures et vos rappels patients." />
          <div className="space-y-4">
            {[
              { label: 'Nom du cabinet', key: 'name' },
              { label: 'Adresse', key: 'address' },
              { label: 'Téléphone', key: 'phone' },
              { label: 'Email professionnel', key: 'email' },
              { label: 'ICE', key: 'ice' },
              { label: 'Site web', key: 'website' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">{f.label}</label>
                <input className="input" value={(clinicInfo as any)[f.key]} onChange={e => setClinicInfo({ ...clinicInfo, [f.key]: e.target.value })} />
              </div>
            ))}
          </div>
        </div>
      );

      case 'team': return (
        <div>
          <SectionHeader title="Équipe & Accès" desc="Gérez les membres de votre équipe et leurs niveaux d'accès." />
          <div className="bg-white border border-slate-100 rounded-[10px] overflow-hidden mb-4">
            <div className="px-4 py-3 border-b border-slate-50 flex justify-between items-center">
              <span className="text-[13px] font-semibold text-slate-700">{users.length} membres</span>
              <button onClick={() => setIsUserModalOpen(true)} className="sa-btn py-1.5 !px-3 text-[12px]">
                <IconUserPlus className="w-3.5 h-3.5" /> Inviter
              </button>
            </div>
            <div className="divide-y divide-slate-50">
              {users.map(u => (
                <div key={u.id} className="px-4 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[12px] font-bold text-slate-600 border border-slate-200">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-slate-900">{u.name}</p>
                      <p className="text-[11px] text-slate-400">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-400">{u.role}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.status === 'Actif' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{u.status}</span>
                    <button className="text-slate-300 hover:text-slate-500 transition-colors"><IconMoreHorizontal className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-[10px] p-4">
            <p className="text-[12px] font-semibold text-amber-800">💡 Gestion avancée des rôles bientôt disponible</p>
            <p className="text-[11px] text-amber-600 mt-1">Les permissions granulaires (lecture seule, accès facturation) seront disponibles dans la prochaine mise à jour.</p>
          </div>
        </div>
      );

      case 'services': return (
        <div>
          <SectionHeader title="Services & Tarifs" desc="Configurez les actes médicaux, leurs durées et leurs prix." />
          <div className="bg-white border border-slate-100 rounded-[10px] overflow-hidden mb-4">
            <div className="px-4 py-3 border-b border-slate-50 flex justify-between items-center">
              <span className="text-[13px] font-semibold text-slate-700">{services.length} actes configurés</span>
              <button onClick={() => openServiceModal()} className="sa-btn py-1.5 !px-3 text-[12px]">
                <IconPlus className="w-3.5 h-3.5" /> Ajouter
              </button>
            </div>
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-50">
                  {['Libellé', 'Code', 'Durée', 'Prix', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {services.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3.5 text-[13px] font-semibold text-slate-900">{s.name}</td>
                    <td className="px-4 py-3.5"><span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{s.code || '—'}</span></td>
                    <td className="px-4 py-3.5 text-[12px] text-slate-500">{s.durationMinutes} min</td>
                    <td className="px-4 py-3.5 text-[13px] font-semibold text-slate-900">{s.price} <span className="text-[11px] font-normal text-slate-400">MAD</span></td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => openServiceModal(s)} className="text-slate-400 hover:text-slate-600 transition-colors p-1"><IconEdit className="w-3.5 h-3.5" /></button>
                        <button onClick={() => deleteService(s.id)} className="text-slate-400 hover:text-red-500 transition-colors p-1"><IconTrash className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );

      case 'schedule': return (
        <div>
          <SectionHeader title="Horaires d'ouverture" desc="Définissez les jours et heures d'ouverture de votre cabinet." />
          <div className="bg-white border border-slate-100 rounded-[10px] overflow-hidden">
            {schedule.map((day, i) => (
              <div key={day.day} className={`px-5 py-4 flex items-center gap-4 ${i < schedule.length - 1 ? 'border-b border-slate-50' : ''}`}>
                <Toggle on={day.active} onChange={() => updateSchedule(i, 'active', !day.active)} />
                <span className={`w-24 text-[13px] font-semibold ${day.active ? 'text-slate-900' : 'text-slate-400'}`}>{day.day}</span>
                {day.active ? (
                  <div className="flex items-center gap-2">
                    <input type="time" value={day.open} onChange={e => updateSchedule(i, 'open', e.target.value)} className="input !w-28 text-center !py-1.5 text-[13px]" />
                    <span className="text-slate-400 text-[12px]">—</span>
                    <input type="time" value={day.close} onChange={e => updateSchedule(i, 'close', e.target.value)} className="input !w-28 text-center !py-1.5 text-[13px]" />
                  </div>
                ) : (
                  <span className="text-[12px] text-slate-400">Fermé</span>
                )}
              </div>
            ))}
          </div>
        </div>
      );

      case 'notifications': return (
        <div>
          <SectionHeader title="Notifications & SMS" desc="Configurez les rappels automatiques pour vos patients." />
          <div className="bg-white border border-slate-100 rounded-[10px] divide-y divide-slate-50">
            <SettingRow label="Activer les SMS" desc="Envoyez automatiquement des rappels par SMS.">
              <Toggle on={smsEnabled} onChange={() => setSmsEnabled(!smsEnabled)} />
            </SettingRow>
            <SettingRow label="WhatsApp" desc="Rappels via WhatsApp Business (bientôt disponible).">
              <Toggle on={whatsappEnabled} onChange={() => setWhatsappEnabled(!whatsappEnabled)} />
            </SettingRow>
            <SettingRow label="Email de rappel" desc="Envoyez un email 48h avant le rendez-vous.">
              <Toggle on={emailEnabled} onChange={() => setEmailEnabled(!emailEnabled)} />
            </SettingRow>
            <SettingRow label="Délai du rappel" desc="Combien de temps avant le RDV envoyer le rappel.">
              <select className="input !w-auto" value={reminderTime} onChange={e => setReminderTime(e.target.value)}>
                <option value="2">2 heures avant</option>
                <option value="24">24 heures avant</option>
                <option value="48">48 heures avant</option>
              </select>
            </SettingRow>
          </div>
          <div className="mt-4">
            <label className="block text-[12px] font-semibold text-slate-500 mb-2">Modèle de message SMS</label>
            <textarea rows={4} className="input !h-auto resize-none" value={messageTemplate} onChange={e => setMessageTemplate(e.target.value)} />
            <p className="text-[11px] text-slate-400 mt-1.5">Variables : {'{patient}'}, {'{cabinet}'}, {'{date}'}, {'{heure}'}</p>
          </div>
          <WhatsAppLog />
        </div>
      );

      case 'widget': return (
        <div>
          <SectionHeader title="Widget de réservation en ligne" desc="Intégrez un widget de prise de RDV sur votre site web." />
          <div className="space-y-4">
            <div>
              <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">Titre du widget</label>
              <input className="input" value={widgetTitle} onChange={e => setWidgetTitle(e.target.value)} />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">Couleur principale</label>
              <div className="flex items-center gap-3">
                <input type="color" value={widgetColor} onChange={e => setWidgetColor(e.target.value)} className="w-10 h-10 rounded-[8px] border border-slate-200 cursor-pointer p-0.5 bg-white" />
                <span className="font-mono text-[13px] text-slate-500">{widgetColor}</span>
              </div>
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">Code d'intégration</label>
              <div className="relative">
                <code className="block w-full bg-slate-900 text-emerald-400 text-[12px] font-mono p-4 rounded-[10px] pr-16 whitespace-pre-wrap leading-relaxed">
                  {`<iframe\n  src="https://medicom.ma/widget/cabinet-amina"\n  width="100%"\n  height="600"\n  frameborder="0"\n></iframe>`}
                </code>
                <button onClick={copyWidget} className="absolute top-3 right-3 sa-btn-ghost !px-2.5 !py-1.5 text-[11px] bg-white/10 text-white hover:bg-white/20">
                  {copied ? <><IconCheck className="w-3 h-3" /> Copié</> : <><IconClipboard className="w-3 h-3" /> Copier</>}
                </button>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-[10px] p-4">
              <p className="text-[12px] font-semibold text-blue-800">🔗 Lien direct vers la réservation</p>
              <p className="text-[12px] text-blue-600 mt-1 font-mono">https://medicom.ma/rdv/cabinet-amina</p>
            </div>
          </div>
        </div>
      );

      case 'security': return (
        <div>
          <SectionHeader title="Sécurité du compte" desc="Gérez l'authentification et les paramètres de sécurité." />
          <div className="bg-white border border-slate-100 rounded-[10px] divide-y divide-slate-50">
            <SettingRow label="Double authentification (2FA)" desc="Ajoutez une couche de sécurité supplémentaire à votre connexion.">
              <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">Non activé</span>
            </SettingRow>
            <SettingRow label="Sessions actives" desc="Gérez les appareils connectés à votre compte.">
              <button className="sa-btn-ghost text-[12px] py-1.5">Voir les sessions</button>
            </SettingRow>
            <SettingRow label="Mot de passe" desc="Dernière modification il y a 3 mois.">
              <button className="sa-btn-ghost text-[12px] py-1.5">Modifier</button>
            </SettingRow>
            <SettingRow label="Journal d'activité" desc="Historique des connexions et actions effectuées.">
              <button className="sa-btn-ghost text-[12px] py-1.5">Consulter</button>
            </SettingRow>
          </div>
          <div className="mt-6 bg-white border border-red-100 rounded-[10px] p-5">
            <h3 className="text-[14px] font-semibold text-red-700 mb-1">Zone de danger</h3>
            <p className="text-[12px] text-slate-500 mb-4">Ces actions sont irréversibles. Procédez avec prudence.</p>
            <button className="sa-btn-danger text-[12px] py-2">Supprimer le compte cabinet</button>
          </div>
        </div>
      );

      case 'language': return (
        <div>
          <SectionHeader title="Langue & Région" desc="Choisissez la langue et les paramètres régionaux de l'interface." />
          <div className="bg-white border border-slate-100 rounded-[10px] divide-y divide-slate-50">
            <SettingRow label="Langue de l'interface">
              <div className="flex gap-2">
                {[['fr', '🇫🇷 Français'], ['ar', '🇲🇦 العربية'], ['en', '🇬🇧 English']].map(([code, label]) => (
                  <button key={code} onClick={() => handleLanguageChange(code)}
                    className={`px-3 py-1.5 rounded-[8px] text-[12px] font-semibold border transition-all ${currentLang === code ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </SettingRow>
            <SettingRow label="Fuseau horaire" desc="Utilisé pour l'affichage des créneaux et des rappels.">
              <select className="input !w-auto">
                <option value="Africa/Casablanca">Casablanca (GMT +1)</option>
                <option value="Europe/Paris">Paris (GMT +1)</option>
              </select>
            </SettingRow>
            <SettingRow label="Format de date">
              <select className="input !w-auto">
                <option value="dd/mm/yyyy">DD/MM/YYYY</option>
                <option value="mm/dd/yyyy">MM/DD/YYYY</option>
                <option value="yyyy-mm-dd">YYYY-MM-DD</option>
              </select>
            </SettingRow>
            <SettingRow label="Devise">
              <select className="input !w-auto">
                <option value="MAD">MAD (Dirham marocain)</option>
                <option value="EUR">EUR (Euro)</option>
              </select>
            </SettingRow>
          </div>
        </div>
      );

      case 'seo': return <SeoTab />;

      case 'subscription': return <SubscriptionTab currentPlan={currentUser?.plan || 'Essentiel'} />;

      default: return null;
    }
  };

  return (
    <div className="w-full mx-auto font-sans">
      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-slate-900 tracking-tight">Paramètres</h1>
          <p className="text-[13px] text-slate-500 mt-0.5">Gérez la configuration de votre cabinet Medicom.</p>
        </div>
        <button onClick={handleSave} disabled={saving} className={`sa-btn transition-all ${saved ? 'bg-emerald-600 border-emerald-600 hover:bg-emerald-700' : ''}`}>
          {saved ? <><IconCheck className="w-4 h-4" /> Sauvegardé</> : saving ? 'Sauvegarde…' : 'Sauvegarder'}
        </button>
      </div>

      {/* Layout */}
      <div className="flex gap-6">
        {/* Sidebar nav */}
        <nav className="w-52 shrink-0 space-y-0.5">
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[8px] text-[13px] font-semibold transition-all duration-150 ${activeTab === item.id ? 'bg-[#0f0f10] text-white' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/70'}`}>
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-white border border-slate-100 rounded-[12px] p-6">
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Service Modal */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsServiceModalOpen(false)} />
          <div className="bg-white rounded-[12px] w-full max-w-sm relative z-10 p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center">
              <h3 className="text-[15px] font-semibold text-slate-900">{editingService ? "Modifier l'acte" : 'Nouvel Acte'}</h3>
              <button onClick={() => setIsServiceModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1"><IconX className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveService} className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">Libellé *</label>
                <input type="text" required className="input" value={newService.name} onChange={e => setNewService({ ...newService, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">Code *</label>
                  <input type="text" required className="input" value={newService.code} onChange={e => setNewService({ ...newService, code: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">Prix (MAD)</label>
                  <input type="number" min="0" className="input" value={newService.price} onChange={e => setNewService({ ...newService, price: parseInt(e.target.value) })} />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">Durée</label>
                <select className="input" value={newService.durationMinutes} onChange={e => setNewService({ ...newService, durationMinutes: parseInt(e.target.value) })}>
                  {[15, 30, 45, 60, 90].map(m => <option key={m} value={m}>{m} min</option>)}
                </select>
              </div>
              <button type="submit" className="sa-btn w-full justify-center mt-2">Enregistrer</button>
            </form>
          </div>
        </div>
      )}

      {/* User Invite Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsUserModalOpen(false)} />
          <div className="bg-white rounded-[12px] w-full max-w-sm relative z-10 p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center">
              <h3 className="text-[15px] font-semibold text-slate-900">Inviter un membre</h3>
              <button onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1"><IconX className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleInviteUser} className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">Nom complet *</label>
                <input type="text" required className="input" placeholder="Ex: Sarah Benani" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">Email *</label>
                <input type="email" required className="input" placeholder="email@cabinet.ma" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">Rôle</label>
                <select className="input" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                  <option value="Assistante">Assistant(e)</option>
                  <option value="Secrétaire">Secrétaire</option>
                  <option value="Remplaçant">Dentiste Remplaçant</option>
                </select>
              </div>
              <button type="submit" className="sa-btn w-full justify-center mt-2">Envoyer l'invitation</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
