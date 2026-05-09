import React, { useState, useEffect } from 'react';
import {
  IconSearch,
  IconPlus,
  IconUserPlus,
  IconX,
  IconCheck,
  IconFilter,
  IconUsers,
  IconBriefcase,
  IconCheckCircle,
  IconClock,
  IconMessage,
  IconSend,
  IconMoreHorizontal,
  IconTrendingUp,
  IconActivity,
  IconZap,
  IconPhone,
  IconMail,
  IconCalendar,
  IconFileText,
} from '../components/Icons';
import { Prospect, OnboardingLead, Partner, Campaign } from '../types';
import { SlideOver } from '../components/SlideOver';
import {
  getDailyActivityMetrics,
  type Lead,
} from '../lib/api/saas/crm';
import { useCRM } from '../hooks/useCRM';

/* ── New types ── */
interface Meeting {
  id: string;
  prospect: string;
  contact: string;
  type: 'Demo' | 'Follow-up' | 'Closing' | 'Discovery';
  date: string;
  time: string;
  duration: number;
  status: 'Scheduled' | 'Completed' | 'No-show' | 'Cancelled';
  owner: string;
  notes: string;
  outcome?: string;
  nextStep?: string;
}

interface Proposition {
  id: string;
  prospect: string;
  contact: string;
  plan: 'Essentiel' | 'Pro' | 'Premium';
  amount: number;
  status: 'Draft' | 'Sent' | 'Viewed' | 'Accepted' | 'Rejected' | 'Negotiating';
  createdAt: string;
  sentAt?: string;
  viewedAt?: string;
  expiresAt: string;
  notes: string;
}

interface ScrapedLead {
  id: string;
  clinicName: string;
  specialty: string;
  city: string;
  phone?: string;
  address?: string;
  website?: string;
  source: 'Manual' | 'Directory' | 'CSV' | 'Maps';
  addedToFunnel: boolean;
  verified: boolean;
}

/* ── Mock data for new tabs ── */
const MOCK_MEETINGS: Meeting[] = [
  { id: 'm1', prospect: 'Cabinet Benali', contact: 'Dr. Benali', type: 'Demo', date: '2026-05-05', time: '10:00', duration: 30, status: 'Scheduled', owner: 'Youssef', notes: 'Intéressé par le module facturation', nextStep: 'Envoyer proposition post-démo' },
  { id: 'm2', prospect: 'Clinique Atlas', contact: 'Dr. Tazi', type: 'Closing', date: '2026-05-06', time: '14:30', duration: 45, status: 'Scheduled', owner: 'Samia', notes: 'Démo faite, attend decision', nextStep: 'Relance si pas de réponse à J+3' },
  { id: 'm3', prospect: 'Cabinet El Mansouri', contact: 'Dr. El Mansouri', type: 'Demo', date: '2026-05-03', time: '09:00', duration: 30, status: 'Completed', owner: 'Youssef', notes: '', outcome: 'Très positif — veut voir la partie RDV en ligne', nextStep: 'Envoyer proposition Pro' },
  { id: 'm4', prospect: 'Centre Santé Plus', contact: 'Mme. Chraibi', type: 'Discovery', date: '2026-05-02', time: '16:00', duration: 20, status: 'No-show', owner: 'Samia', notes: 'A pas décroché', nextStep: 'Relancer par SMS' },
  { id: 'm5', prospect: 'Cabinet Dr. Idrissi', contact: 'Dr. Idrissi', type: 'Follow-up', date: '2026-05-08', time: '11:00', duration: 15, status: 'Scheduled', owner: 'Youssef', notes: 'Proposition envoyée il y a 5j, check-in' },
  { id: 'm6', prospect: 'Polyclinique Marrakech', contact: 'Dr. Hammou', type: 'Demo', date: '2026-05-09', time: '15:00', duration: 60, status: 'Scheduled', owner: 'Samia', notes: 'Gros compte — 6 médecins', nextStep: 'Préparer démo multi-praticiens' },
];

const MOCK_PROPOSITIONS: Proposition[] = [
  { id: 'p1', prospect: 'Cabinet El Mansouri', contact: 'Dr. El Mansouri', plan: 'Pro', amount: 999, status: 'Sent', createdAt: '2026-05-03', sentAt: '2026-05-03', expiresAt: '2026-05-17', notes: 'Inclus 3 mois offerts' },
  { id: 'p2', prospect: 'Clinique Atlas', contact: 'Dr. Tazi', plan: 'Premium', amount: 1499, status: 'Viewed', createdAt: '2026-04-28', sentAt: '2026-04-29', viewedAt: '2026-05-01', expiresAt: '2026-05-13', notes: 'Intégration WhatsApp incluse' },
  { id: 'p3', prospect: 'Polyclinique Marrakech', contact: 'Dr. Hammou', plan: 'Premium', amount: 1499, status: 'Draft', createdAt: '2026-05-04', expiresAt: '2026-05-18', notes: 'À personnaliser avec modules chirurgie' },
  { id: 'p4', prospect: 'Cabinet Saada', contact: 'Dr. Saada', plan: 'Essentiel', amount: 499, status: 'Accepted', createdAt: '2026-04-20', sentAt: '2026-04-21', expiresAt: '2026-05-05', notes: 'Converti — Contrat signé' },
  { id: 'p5', prospect: 'Cabinet Belhaj', contact: 'Dr. Belhaj', plan: 'Pro', amount: 999, status: 'Rejected', createdAt: '2026-04-15', sentAt: '2026-04-16', expiresAt: '2026-04-30', notes: 'Trop cher selon lui' },
  { id: 'p6', prospect: 'Centre Santé Plus', contact: 'Mme. Chraibi', plan: 'Pro', amount: 999, status: 'Negotiating', createdAt: '2026-05-01', sentAt: '2026-05-01', viewedAt: '2026-05-02', expiresAt: '2026-05-15', notes: 'Demande 10% de remise' },
];

const MOCK_SCRAPED_LEADS: ScrapedLead[] = [
  { id: 'sl1', clinicName: 'Cabinet Dr. Alami', specialty: 'Dentiste', city: 'Casablanca', phone: '05 22 XX XX XX', address: 'Bd Massira, Casablanca', source: 'Maps', addedToFunnel: false, verified: true },
  { id: 'sl2', clinicName: 'Cabinet Pédiatrique Idrissi', specialty: 'Pédiatre', city: 'Casablanca', phone: '05 22 YY YY YY', address: 'Maârif, Casablanca', source: 'Directory', addedToFunnel: true, verified: true },
  { id: 'sl3', clinicName: 'Dr. Radi — Gynécologie', specialty: 'Gynécologue', city: 'Casablanca', phone: undefined, address: 'Anfa, Casablanca', source: 'Maps', addedToFunnel: false, verified: false },
  { id: 'sl4', clinicName: 'Centre Médical Hay Riad', specialty: 'Généraliste', city: 'Rabat', phone: '05 37 XX XX XX', address: 'Hay Riad, Rabat', source: 'Directory', addedToFunnel: false, verified: true },
  { id: 'sl5', clinicName: 'Cabinet Dr. Bensouda', specialty: 'Cardiologue', city: 'Fès', phone: '05 35 YY YY YY', address: 'Centre ville, Fès', source: 'Manual', addedToFunnel: false, verified: true },
  { id: 'sl6', clinicName: 'Clinique Maamora', specialty: 'Multi-spécialités', city: 'Kénitra', phone: '05 37 ZZ ZZ ZZ', address: 'Centre, Kénitra', source: 'Maps', addedToFunnel: false, verified: false },
];

/* ── Constants ── */
const MOCK_CAMPAIGNS: Campaign[] = [
  { id: 'c1', name: 'Rappel détartrage 6 mois', type: 'SMS', status: 'Sent', audience: 'Patients > 6 mois sans visite', sentCount: 145, date: '10 Jan 2024' },
  { id: 'c2', name: 'Voeux Ramadan', type: 'WhatsApp', status: 'Scheduled', audience: 'Tous les patients actifs', sentCount: 0, date: '10 Mar 2024' },
  { id: 'c3', name: 'Relance Devis Orthodontie', type: 'Email', status: 'Draft', audience: 'Devis > 30 jours sans réponse', sentCount: 0, date: '—' },
];

const COLUMNS = ['New', 'Contacted', 'Demo', 'Converted', 'Lost'];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string; border: string }> = {
  New: { label: 'Nouveaux', color: 'text-blue-700', bg: 'bg-blue-50', dot: 'bg-blue-500', border: 'border-blue-200' },
  Contacted: { label: 'Contactés', color: 'text-indigo-700', bg: 'bg-indigo-50', dot: 'bg-indigo-500', border: 'border-indigo-200' },
  Demo: { label: 'Démo', color: 'text-violet-700', bg: 'bg-violet-50', dot: 'bg-violet-500', border: 'border-violet-200' },
  Converted: { label: 'Convertis', color: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500', border: 'border-emerald-200' },
  Lost: { label: 'Perdus', color: 'text-slate-600', bg: 'bg-slate-100', dot: 'bg-slate-400', border: 'border-slate-200' },
};

const ONBOARDING_STEPS = ['Contract_Sent', 'Contract_Signed', 'Training', 'Data_Import', 'Live'];

// Primary tabs (visible by default) + secondary tabs (collapse into "More")
const TABS_PRIMARY = [
  { id: 'tower',        label: 'Control Tower',    icon: IconZap },
  { id: 'sales',        label: 'Pipeline',          icon: IconBriefcase },
  { id: 'meetings',     label: 'Réunions',          icon: IconCalendar },
  { id: 'propositions', label: 'Propositions',      icon: IconFileText },
  { id: 'scraping',     label: 'Prospection',       icon: IconSearch },
  { id: 'team-calendar',label: 'Équipe',            icon: IconActivity },
];
const TABS_SECONDARY = [
  { id: 'onboarding',   label: 'Onboarding',        icon: IconCheckCircle },
  { id: 'partners',     label: 'Partenaires',        icon: IconUsers },
  { id: 'campaigns',    label: 'Campagnes',          icon: IconSend },
];
const TABS = [...TABS_PRIMARY, ...TABS_SECONDARY];

/* ── KPI Strip ── */
const KpiCard = ({ label, value, sub, trend }: { label: string; value: string; sub?: string; trend?: string }) => (
  <div className="bg-white border border-slate-100 rounded-[12px] px-5 py-4 flex flex-col gap-1">
    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">{label}</span>
    <span className="text-[26px] font-semibold text-slate-900 tracking-tight leading-none">{value}</span>
    {sub && <span className="text-[11px] text-slate-400">{sub}</span>}
    {trend && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 w-fit">{trend}</span>}
  </div>
);

/* ── Main Component ── */
export const CRM = () => {
  const { prospects, activities, loadActivities, moveLead, logActivity, scheduleDemo, loading, refresh, addLead } = useCRM();
  const [activeTab, setActiveTab] = useState<'tower' | 'sales' | 'onboarding' | 'partners' | 'campaigns' | 'meetings' | 'propositions' | 'scraping' | 'team-calendar'>('tower');
  const [dailyMetrics, setDailyMetrics] = useState({ calls: 0, emails: 0, meetings: 0 });
  const [draggedItem, setDraggedItem] = useState<Prospect | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [activeScript, setActiveScript] = useState<'pitch' | 'price' | 'timing'>('pitch');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [onboardingLeads, setOnboardingLeads] = useState<OnboardingLead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>(MOCK_CAMPAIGNS);
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newLead, setNewLead] = useState({ clinicName: '', contactName: '', city: '', email: '', phone: '', doctors: '1', currentSystem: 'Paper', timeline: 'Just browsing' });

  // ── New feature state ──
  const [meetings, setMeetings] = useState<Meeting[]>(MOCK_MEETINGS);
  const [propositions, setPropositions] = useState<Proposition[]>(MOCK_PROPOSITIONS);
  const [scrapedLeads, setScrapedLeads] = useState<ScrapedLead[]>(MOCK_SCRAPED_LEADS);
  const [scrapingCity, setScrapingCity] = useState('Casablanca');
  const [scrapingSpecialty, setScrapingSpecialty] = useState('Dentiste');
  const [calendarWeek, setCalendarWeek] = useState(0); // offset from current week

  useEffect(() => {
    if (!selectedProspect) return;
    loadActivities(selectedProspect.id);
  }, [selectedProspect, loadActivities]);

  useEffect(() => {
    getDailyActivityMetrics().then(setDailyMetrics).catch(() => { });
  }, []);

  /* ── Drag & Drop ── */
  const handleDragStart = (e: React.DragEvent, p: Prospect) => {
    setDraggedItem(p);
    e.dataTransfer.effectAllowed = 'move';
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  const handleDragOver = (e: React.DragEvent, col: string) => {
    e.preventDefault();
    setDragOverCol(col);
  };

  const handleDrop = async (e: React.DragEvent, status: string) => {
    e.preventDefault();
    setDragOverCol(null);
    if (draggedItem && draggedItem.status !== status) {
      await moveLead(draggedItem.id, status);
      if (selectedProspect?.id === draggedItem.id) setSelectedProspect({ ...selectedProspect, status: status as Prospect['status'] });
    }
    setDraggedItem(null);
  };

  /* ── Quick Actions ── */
  const logRapidAction = async (type: 'call' | 'email' | 'meeting') => {
    if (!selectedProspect) return;
    try {
      if (type === 'call' && selectedProspect.phone) window.open(`tel:${selectedProspect.phone}`, '_self');
      if (type === 'email' && selectedProspect.email) window.open(`mailto:${selectedProspect.email}?subject=${encodeURIComponent('Medicom - Votre cabinet digital')}`, '_blank');
      await logActivity(selectedProspect.id, type, `Action: ${type}`);
      setDailyMetrics(prev => ({ ...prev, [type === 'call' ? 'calls' : type === 'email' ? 'emails' : 'meetings']: prev[type === 'call' ? 'calls' : type === 'email' ? 'emails' : 'meetings'] + 1 }));
      if (type === 'call' && selectedProspect.status === 'New') await moveLead(selectedProspect.id, 'Contacted');
      if (type === 'meeting' && ['New', 'Contacted'].includes(selectedProspect.status)) await moveLead(selectedProspect.id, 'Demo');
      refresh(); setSelectedProspect(null);
    } catch (e) { console.error(e); }
  };

  const handleCreateLead = async () => {
    let score = 20;
    if (newLead.doctors === '5+') score += 40; else if (newLead.doctors === '2-5') score += 20;
    if (['None', 'Paper'].includes(newLead.currentSystem)) score += 20; else score += 10;
    if (newLead.timeline === 'Immediate') score += 20; else if (newLead.timeline === '1-3 months') score += 10;
    await addLead({ name: newLead.clinicName, contactPerson: newLead.contactName, email: newLead.email, phone: newLead.phone, city: newLead.city, source: 'Direct Form', status: 'New', estValue: score * 100, notes: `Taille: ${newLead.doctors} | Système: ${newLead.currentSystem} | Timing: ${newLead.timeline}` });
    setIsAddLeadOpen(false);
    setNewLead({ clinicName: '', contactName: '', city: '', email: '', phone: '', doctors: '1', currentSystem: 'Paper', timeline: 'Just browsing' });
  };

  const filteredProspects = (col: string) =>
    prospects.filter(p => p.status === col && (!searchQuery || p.clinicName?.toLowerCase().includes(searchQuery.toLowerCase()) || p.contactName?.toLowerCase().includes(searchQuery.toLowerCase())));

  /* ─────── SHARED HELPERS ─────── */

  const daysAgo = (dateStr: string) =>
    Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);

  const daysUntil = (dateStr: string) =>
    Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);

  /* ─────── VIEWS ─────── */

  const ControlTowerView = () => {
    // ── Revenue mission ──
    const MRR_TARGET = 35000;
    const MRR_ACTUAL = 24500;
    const mrrPct = Math.min(Math.round((MRR_ACTUAL / MRR_TARGET) * 100), 100);
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const dayOfMonth = today.getDate();
    const dayPct = Math.round((dayOfMonth / daysInMonth) * 100);
    const isOnTrack = mrrPct >= dayPct - 5;

    // ── Pipeline by stage ──
    const pipelineStages = COLUMNS.map(col => ({
      col,
      cfg: STATUS_CONFIG[col],
      count: prospects.filter(p => p.status === col).length,
      value: prospects.filter(p => p.status === col).reduce((s, p) => s + ((p as any).estValue || 0), 0),
    }));
    const totalPipeline = pipelineStages.reduce((s, st) => s + st.value, 0);

    // ── Critical alerts ──
    const coldLeads = prospects.filter(p =>
      ['New', 'Contacted'].includes(p.status) && daysAgo(p.date) >= 5
    );
    const expiringProps = propositions.filter(p =>
      ['Sent', 'Viewed', 'Negotiating'].includes(p.status) && daysUntil(p.expiresAt) <= 3
    );
    const noShowFollowUps = meetings.filter(m => m.status === 'No-show');
    const stalledDeals = prospects.filter(p =>
      ['Demo', 'Contacted'].includes(p.status) && daysAgo(p.date) >= 10
    );
    const totalAlerts = coldLeads.length + expiringProps.length + noShowFollowUps.length + stalledDeals.length;

    // ── Action queue — sorted by urgency then score ──
    const actionQueue = [...prospects]
      .filter(p => !['Converted', 'Lost'].includes(p.status))
      .sort((a, b) => {
        const urgA = daysAgo(a.date) >= 5 ? 10 : 0;
        const urgB = daysAgo(b.date) >= 5 ? 10 : 0;
        return (urgB + (b.leadScore ?? 0)) - (urgA + (a.leadScore ?? 0));
      })
      .slice(0, 7);

    // ── Team scoreboard ──
    const TEAM = [
      { name: 'Youssef', calls: dailyMetrics.calls, demos: meetings.filter(m => m.owner === 'Youssef' && m.status === 'Completed').length, proposals: propositions.filter(p => p.status !== 'Draft').length, color: 'bg-blue-600' },
      { name: 'Samia',   calls: Math.max(0, dailyMetrics.calls - 4), demos: meetings.filter(m => m.owner === 'Samia' && m.status === 'Completed').length, proposals: 1, color: 'bg-violet-600' },
      { name: 'Amine',   calls: Math.max(0, dailyMetrics.calls - 8), demos: 0, proposals: 0, color: 'bg-emerald-600' },
      { name: 'Laila',   calls: Math.max(0, dailyMetrics.calls - 2), demos: meetings.filter(m => m.owner === 'Laila' && m.status === 'Completed').length, proposals: 1, color: 'bg-amber-500' },
    ].sort((a, b) => (b.demos * 3 + b.proposals * 2 + b.calls * 0.1) - (a.demos * 3 + a.proposals * 2 + a.calls * 0.1));

    return (
      <div className="space-y-5">

        {/* ── 1. Revenue Mission Bar ─────────────────────────────────────────── */}
        <div className="bg-[#0f0f10] rounded-[12px] px-6 py-5 flex items-center gap-8">
          <div className="shrink-0">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mission du mois — Mai 2026</p>
            <p className="text-[11px] text-slate-400 mt-0.5">J{dayOfMonth} / {daysInMonth} · {daysInMonth - dayOfMonth} jours restants</p>
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-white font-semibold text-[22px] tracking-tight">{MRR_ACTUAL.toLocaleString()} <span className="text-slate-500 text-[13px] font-normal">MAD MRR</span></span>
              <span className="text-slate-400 text-[13px]">/ {MRR_TARGET.toLocaleString()} MAD</span>
            </div>
            <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ${isOnTrack ? 'bg-emerald-500' : 'bg-amber-500'}`}
                style={{ width: `${mrrPct}%` }}
              />
              {/* Day pace marker */}
              <div className="absolute inset-y-0 w-0.5 bg-slate-600" style={{ left: `${dayPct}%` }} />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className={`text-[11px] font-bold ${isOnTrack ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isOnTrack ? 'En avance' : 'En retard'} · {mrrPct}% atteint
              </span>
              <span className="text-[11px] text-slate-500">Rythme requis: {Math.round((MRR_TARGET - MRR_ACTUAL) / Math.max(daysInMonth - dayOfMonth, 1)).toLocaleString()} MAD/j</span>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pipeline total</p>
            <p className="text-white text-[20px] font-semibold">{(totalPipeline / 1000).toFixed(0)}k <span className="text-slate-500 text-[12px]">MAD</span></p>
            <p className="text-[11px] text-slate-500">{prospects.filter(p => !['Converted', 'Lost'].includes(p.status)).length} deals actifs</p>
          </div>
        </div>

        {/* ── 2. Daily Input Scorecards ─────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Appels',      val: dailyMetrics.calls,    target: 50, color: 'bg-blue-600' },
            { label: 'Démos',       val: dailyMetrics.meetings,  target: 3,  color: 'bg-emerald-500' },
            { label: 'Propositions',val: propositions.filter(p => p.status !== 'Draft').length, target: 2, color: 'bg-violet-500' },
          ].map(m => {
            const pct = Math.min(Math.round((m.val / m.target) * 100), 100);
            const done = m.val >= m.target;
            return (
              <div key={m.label} className="bg-white border border-slate-100 rounded-[12px] p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{m.label} du jour</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${done ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                    {done ? 'Objectif atteint' : `${m.target - m.val} restants`}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-[40px] font-bold text-slate-900 leading-none tracking-tighter">{m.val}</span>
                  <span className="text-[18px] text-slate-300">/ {m.target}</span>
                </div>
                <div className="mt-4 space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">{pct}%</span>
                    <span className="text-slate-400">{m.target - m.val > 0 ? `${m.target - m.val} restants` : 'Objectif atteint'}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${m.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── 3. Alerts + Pipeline Health ──────────────────────────────────── */}
        <div className="grid grid-cols-5 gap-4">

          {/* Alerts — col-span-3 */}
          <div className="col-span-3 bg-white border border-slate-100 rounded-[12px] overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-[14px] font-semibold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">{totalAlerts}</span>
                Alertes requérant action
              </h3>
              {totalAlerts === 0 && <span className="text-[11px] text-emerald-500 font-semibold">Tout est sous contrôle</span>}
            </div>
            <div className="divide-y divide-slate-50">
              {expiringProps.map(p => (
                <div key={p.id} className="px-5 py-3 flex items-center gap-3 hover:bg-red-50/30 transition-colors">
                  <div className="w-8 h-8 bg-red-50 rounded-[8px] flex items-center justify-center shrink-0">
                    <IconClock className="w-4 h-4 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-slate-900">Proposition expire dans {daysUntil(p.expiresAt)}j</p>
                    <p className="text-[11px] text-slate-400">{p.prospect} · Plan {p.plan} · {p.amount.toLocaleString()} MAD</p>
                  </div>
                  <button onClick={() => setActiveTab('propositions')} className="text-[11px] font-semibold text-red-600 hover:underline shrink-0">Relancer →</button>
                </div>
              ))}
              {noShowFollowUps.map(m => (
                <div key={m.id} className="px-5 py-3 flex items-center gap-3 hover:bg-amber-50/30 transition-colors">
                  <div className="w-8 h-8 bg-amber-50 rounded-[8px] flex items-center justify-center shrink-0">
                    <IconPhone className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-slate-900">No-show à relancer — {m.prospect}</p>
                    <p className="text-[11px] text-slate-400">{m.type} · {m.date} à {m.time} · {m.owner}</p>
                  </div>
                  <button onClick={() => setActiveTab('meetings')} className="text-[11px] font-semibold text-amber-600 hover:underline shrink-0">Voir →</button>
                </div>
              ))}
              {stalledDeals.slice(0, 3).map(p => (
                <div key={p.id} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50/60 transition-colors">
                  <div className="w-8 h-8 bg-slate-100 rounded-[8px] flex items-center justify-center shrink-0">
                    <IconActivity className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-slate-900">Deal gelé depuis {daysAgo(p.date)}j — {p.clinicName}</p>
                    <p className="text-[11px] text-slate-400">{p.status} · {p.city} · Score {p.leadScore ?? 0}%</p>
                  </div>
                  <button onClick={() => { setSelectedProspect(p); }} className="text-[11px] font-semibold text-slate-500 hover:underline shrink-0">Agir →</button>
                </div>
              ))}
              {coldLeads.filter(l => !stalledDeals.includes(l)).slice(0, 2).map(p => (
                <div key={p.id} className="px-5 py-3 flex items-center gap-3 hover:bg-blue-50/20 transition-colors">
                  <div className="w-8 h-8 bg-blue-50 rounded-[8px] flex items-center justify-center shrink-0">
                    <IconMail className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-slate-900">Sans contact depuis {daysAgo(p.date)}j — {p.clinicName}</p>
                    <p className="text-[11px] text-slate-400">{p.status} · Source: {p.source}</p>
                  </div>
                  <button onClick={() => { setSelectedProspect(p); }} className="text-[11px] font-semibold text-blue-500 hover:underline shrink-0">Contacter →</button>
                </div>
              ))}
              {totalAlerts === 0 && (
                <div className="px-5 py-8 text-center">
                  <p className="text-[13px] text-slate-400">Aucune alerte — pipeline sain</p>
                </div>
              )}
            </div>
          </div>

          {/* Pipeline Health — col-span-2 */}
          <div className="col-span-2 bg-white border border-slate-100 rounded-[12px] overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-[14px] font-semibold text-slate-900">Santé du pipeline</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Valeur par étape</p>
            </div>
            <div className="flex-1 divide-y divide-slate-50 px-5">
              {pipelineStages.map(st => {
                const stagePct = totalPipeline > 0 ? Math.round((st.value / totalPipeline) * 100) : 0;
                return (
                  <div key={st.col} className="py-3 flex items-center gap-3">
                    <div className="flex items-center gap-1.5 w-24 shrink-0">
                      <span className={`w-2 h-2 rounded-full ${st.cfg.dot}`} />
                      <span className="text-[12px] font-semibold text-slate-600">{st.cfg.label}</span>
                    </div>
                    <div className="flex-1">
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${st.cfg.dot}`} style={{ width: `${stagePct}%` }} />
                      </div>
                    </div>
                    <div className="text-right shrink-0 w-24">
                      <span className="text-[12px] font-semibold text-slate-900">{(st.value / 1000).toFixed(1)}k MAD</span>
                      <span className="text-[10px] text-slate-400 ml-1">({st.count})</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50">
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-slate-400">Forecast close mois</span>
                <span className="text-[13px] font-bold text-slate-900">{Math.round(totalPipeline * 0.35 / 1000)}k MAD</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── 4. Smart Action Queue ─────────────────────────────────────────── */}
        <div className="bg-white border border-slate-100 rounded-[12px] overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-[14px] font-semibold text-slate-900 flex items-center gap-2">
              <IconZap className="w-4 h-4 text-amber-500" />
              File d'action — triée par priorité & score
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full font-semibold">{actionQueue.length} prospects</span>
              <button onClick={() => setIsAddLeadOpen(true)} className="sa-btn text-[11px] py-1 !px-3">+ Lead</button>
            </div>
          </div>
          {actionQueue.length === 0 ? (
            <div className="py-10 text-center">
              <IconCheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-[13px] font-semibold text-slate-600">Pipeline traité — Excellent travail !</p>
            </div>
          ) : (
            <div>
              {/* Column headers */}
              <div className="grid px-5 py-2 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest" style={{ gridTemplateColumns: '1fr 100px 80px 100px 80px 140px' }}>
                <span>Prospect</span><span>Étape</span><span>Score</span><span>Valeur</span><span>Âge</span><span className="text-right">Actions</span>
              </div>
              <div className="divide-y divide-slate-50">
                {actionQueue.map((lead, idx) => {
                  const age = daysAgo(lead.date);
                  const isCold = age >= 5;
                  const isUrgent = age >= 7 || (lead.leadScore ?? 0) >= 80;
                  return (
                    <div
                      key={lead.id}
                      className={`grid items-center px-5 py-3 transition-colors group hover:bg-slate-50/60 ${isCold ? 'bg-amber-50/20' : ''}`}
                      style={{ gridTemplateColumns: '1fr 100px 80px 100px 80px 140px' }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 border ${isUrgent ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                          {(lead.clinicName || '?').charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-slate-900 truncate">{lead.clinicName}</p>
                          <p className="text-[11px] text-slate-400 truncate">{lead.contactName} · {lead.city}</p>
                        </div>
                      </div>
                      <div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_CONFIG[lead.status]?.bg || 'bg-slate-100'} ${STATUS_CONFIG[lead.status]?.color || 'text-slate-600'}`}>
                          {STATUS_CONFIG[lead.status]?.label || lead.status}
                        </span>
                      </div>
                      <div>
                        {lead.leadScore != null ? (
                          <div className="flex items-center gap-1.5">
                            <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden w-10">
                              <div className={`h-full rounded-full ${lead.leadScore > 70 ? 'bg-emerald-500' : lead.leadScore > 40 ? 'bg-amber-400' : 'bg-slate-300'}`} style={{ width: `${lead.leadScore}%` }} />
                            </div>
                            <span className="text-[11px] font-semibold text-slate-600">{lead.leadScore}%</span>
                          </div>
                        ) : <span className="text-[11px] text-slate-300">—</span>}
                      </div>
                      <div>
                        <span className="text-[12px] font-semibold text-slate-900">
                          {(lead as any).estValue ? `${((lead as any).estValue / 1000).toFixed(1)}k` : '—'} <span className="text-[10px] font-normal text-slate-400">MAD</span>
                        </span>
                      </div>
                      <div>
                        <span className={`text-[12px] font-semibold ${age >= 7 ? 'text-red-500' : age >= 3 ? 'text-amber-500' : 'text-slate-500'}`}>
                          {age === 0 ? 'Auj.' : `${age}j`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 justify-end">
                        {lead.phone && (
                          <a href={`tel:${lead.phone}`} className="w-7 h-7 rounded-[6px] bg-emerald-50 flex items-center justify-center hover:bg-emerald-100 transition-colors" title="Appeler">
                            <IconPhone className="w-3.5 h-3.5 text-emerald-600" />
                          </a>
                        )}
                        {lead.email && (
                          <a href={`mailto:${lead.email}`} className="w-7 h-7 rounded-[6px] bg-blue-50 flex items-center justify-center hover:bg-blue-100 transition-colors" title="Email">
                            <IconMail className="w-3.5 h-3.5 text-blue-600" />
                          </a>
                        )}
                        <button
                          onClick={() => { setActiveTab('meetings'); }}
                          className="w-7 h-7 rounded-[6px] bg-violet-50 flex items-center justify-center hover:bg-violet-100 transition-colors"
                          title="Planifier réunion"
                        >
                          <IconCalendar className="w-3.5 h-3.5 text-violet-600" />
                        </button>
                        <button
                          onClick={() => setSelectedProspect(lead)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 border border-slate-200 rounded-[6px] hover:bg-slate-50 transition-colors"
                        >
                          Ouvrir
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── 5. Team Leaderboard ───────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-3">
          {TEAM.map((member, rank) => (
            <div key={member.name} className={`bg-white border rounded-[12px] p-4 flex flex-col gap-3 ${rank === 0 ? 'border-amber-200 bg-amber-50/20' : 'border-slate-100'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full ${member.color} flex items-center justify-center text-white text-[10px] font-bold`}>
                    {member.name.charAt(0)}
                  </div>
                  <span className="text-[13px] font-semibold text-slate-900">{member.name}</span>
                </div>
                {rank === 0 && <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full">#1</span>}
                {rank > 0 && <span className="text-[10px] font-semibold text-slate-400">#{rank + 1}</span>}
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: 'Appels', val: member.calls },
                  { label: 'Démos', val: member.demos },
                  { label: 'Props.', val: member.proposals },
                ].map(stat => (
                  <div key={stat.label} className="bg-slate-50 rounded-[6px] py-1.5">
                    <p className="text-[15px] font-bold text-slate-900 leading-none">{stat.val}</p>
                    <p className="text-[9px] text-slate-400 mt-0.5 font-semibold uppercase tracking-wide">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    );
  };

  const SalesView = () => {
    const totalValue = prospects.filter(p => !['Converted', 'Lost'].includes(p.status)).reduce((s, p) => s + ((p as any).estValue || 0), 0);
    const convRate = prospects.length > 0 ? Math.round((prospects.filter(p => p.status === 'Converted').length / prospects.length) * 100) : 0;
    const avgCycle = 18;

    return (
    <div className="space-y-4">
      {/* Pipeline KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Taux de conversion" value={`${convRate}%`} trend="↑ +2.1% ce mois" />
        <KpiCard label="Deals actifs" value={`${prospects.filter(p => !['Converted', 'Lost'].includes(p.status)).length}`} sub="Dans le pipeline" />
        <KpiCard label="Pipeline MRR" value={`${(totalValue / 1000).toFixed(0)}k MAD`} sub="Valeur potentielle" />
        <KpiCard label="Cycle moyen" value={`${avgCycle}j`} sub="Du New au Close" />
      </div>

      {/* Search + filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un prospect…"
            className="w-full h-9 pl-9 pr-3 border border-slate-200 rounded-[8px] text-[13px] bg-white outline-none focus:border-slate-400 placeholder:text-slate-400 transition-colors"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span className="w-2 h-2 rounded-full bg-amber-400" /> Froid (5j+)
          <span className="w-2 h-2 rounded-full bg-red-400 ml-2" /> Urgent (7j+ / Score élevé)
        </div>
        <button onClick={() => setIsAddLeadOpen(true)} className="sa-btn ml-auto">
          <IconPlus className="w-3.5 h-3.5" /> Nouveau lead
        </button>
      </div>

      {/* Kanban */}
      <div className="flex gap-3 min-w-[1000px] overflow-x-auto pb-3">
        {COLUMNS.map(col => {
          const cfg = STATUS_CONFIG[col];
          const cards = filteredProspects(col);
          const colValue = cards.reduce((s, p) => s + ((p as any).estValue || 0), 0);
          return (
            <div
              key={col}
              className={`flex-1 min-w-[220px] flex flex-col rounded-[12px] border transition-colors duration-200 ${dragOverCol === col ? 'border-blue-300 bg-blue-50/20' : 'bg-slate-50/60 border-slate-100'}`}
              onDragOver={e => handleDragOver(e, col)}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={e => handleDrop(e, col)}
            >
              {/* Column header with value total */}
              <div className="px-3.5 py-3 border-b border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-widest">{cfg.label}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400 bg-white border border-slate-100 rounded-full px-2 py-0.5">{cards.length}</span>
                </div>
                {colValue > 0 && (
                  <p className="text-[11px] font-semibold text-slate-500 pl-3.5">
                    {(colValue / 1000).toFixed(0)}k MAD
                  </p>
                )}
              </div>

              <div className="flex-1 p-2 space-y-2 overflow-y-auto scrollbar-hide min-h-[200px]">
                {cards.map(p => {
                  const age = daysAgo(p.date);
                  const isCold = age >= 5;
                  const isHot = (p.leadScore ?? 0) >= 75 || p.priority === 'High';
                  const estValue = (p as any).estValue;
                  return (
                    <div key={p.id}
                      draggable onDragStart={e => handleDragStart(e, p)} onClick={() => setSelectedProspect(p)}
                      className={[
                        'bg-white rounded-[10px] p-3.5 cursor-grab active:cursor-grabbing group transition-all duration-150 select-none',
                        draggedItem?.id === p.id ? 'opacity-40 scale-[0.97]' : '',
                        isCold ? 'border border-amber-200 hover:border-amber-300' : 'border border-slate-100 hover:border-slate-300',
                      ].filter(Boolean).join(' ')}
                    >
                      {/* Top row: priority + cold/hot badge */}
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${p.priority === 'High' || isHot ? 'bg-red-50 text-red-600' : p.priority === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>
                          {p.priority === 'High' || isHot ? 'Hot' : p.priority === 'Medium' ? 'Med' : 'Low'}
                        </span>
                        <div className="flex items-center gap-1">
                          {isCold && <span className="text-[9px] font-bold text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-full">{age}j sans contact</span>}
                        </div>
                      </div>

                      {/* Clinic name + city */}
                      <p className="text-[13px] font-semibold text-slate-900 leading-tight">{p.clinicName}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{p.contactName} · {p.city}</p>

                      {/* Deal value */}
                      {estValue > 0 && (
                        <div className="mt-2 flex items-center gap-1">
                          <span className="text-[12px] font-bold text-slate-700">{(estValue / 1000).toFixed(1)}k</span>
                          <span className="text-[10px] text-slate-400">MAD/mois</span>
                        </div>
                      )}

                      {/* Score bar */}
                      {p.leadScore != null && (
                        <div className="mt-2.5">
                          <div className="flex justify-between text-[9px] font-semibold text-slate-400 mb-1">
                            <span>Score qualité</span><span className="text-slate-600">{p.leadScore}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1">
                            <div className={`h-1 rounded-full ${p.leadScore > 75 ? 'bg-emerald-500' : p.leadScore > 45 ? 'bg-blue-400' : 'bg-slate-300'}`} style={{ width: `${p.leadScore}%` }} />
                          </div>
                        </div>
                      )}

                      {/* Footer: source + quick actions */}
                      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-50">
                        <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide">{p.source}</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {p.phone && (
                            <a href={`tel:${p.phone}`} onClick={e => e.stopPropagation()} className="w-5 h-5 rounded bg-emerald-50 flex items-center justify-center hover:bg-emerald-100">
                              <IconPhone className="w-3 h-3 text-emerald-600" />
                            </a>
                          )}
                          <button onClick={e => { e.stopPropagation(); setActiveTab('meetings'); }} className="w-5 h-5 rounded bg-violet-50 flex items-center justify-center hover:bg-violet-100">
                            <IconCalendar className="w-3 h-3 text-violet-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {cards.length === 0 && (
                  <div className="h-20 border-2 border-dashed border-slate-100 rounded-[10px] flex items-center justify-center text-[11px] text-slate-300">
                    Glisser ici
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
  };

  const OnboardingView = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="En onboarding" value={`${onboardingLeads.length}`} sub="Clients actifs" />
        <KpiCard label="Go-live ce mois" value="3" trend="↑ en avance" />
        <KpiCard label="Temps moyen" value="18j" sub="Du contrat au live" />
      </div>
      <div className="bg-white border border-slate-100 rounded-[10px] overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-[14px] font-semibold text-slate-900">Suivi d'onboarding</h3>
          <button className="sa-btn"><IconPlus className="w-3.5 h-3.5" /> Nouveau client</button>
        </div>
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-slate-50">
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Cabinet</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Progression</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Étape</th>
              <th className="px-5 py-3 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Contact</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {onboardingLeads.map(lead => {
              const currentIdx = ONBOARDING_STEPS.indexOf(lead.status);
              const pct = Math.round(((currentIdx + 1) / ONBOARDING_STEPS.length) * 100);
              return (
                <tr key={lead.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-violet-50 flex items-center justify-center text-violet-700 text-[12px] font-bold border border-violet-100">
                        {lead.clinicName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-slate-900">{lead.clinicName}</p>
                        <p className="text-[12px] text-slate-400">{lead.doctorName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="w-full">
                      <div className="flex justify-between text-[11px] font-semibold mb-1.5">
                        <span className="text-slate-400">Progression</span>
                        <span className="text-slate-700">{pct}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {lead.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <p className="text-[13px] font-medium text-slate-900">{lead.contact}</p>
                    <button className="text-[11px] text-blue-600 font-semibold hover:underline">Voir dossier →</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const PartnersView = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Partenaires actifs" value={`${partners.filter(p => p.status === 'Active').length}`} />
        <KpiCard label="Referrals ce mois" value="8" trend="↑ +3 vs mois dernier" />
        <KpiCard label="CA généré" value="42k MAD" sub="Via partenaires" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {partners.map(p => (
          <div key={p.id} className="bg-white border border-slate-100 rounded-[10px] p-5 hover:border-slate-300 transition-all cursor-pointer group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-[10px] bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700">
                <IconBriefcase className="w-5 h-5" />
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${p.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                {p.status}
              </span>
            </div>
            <h3 className="text-[15px] font-semibold text-slate-900">{p.name}</h3>
            <p className="text-[12px] text-slate-400 mt-0.5">{p.type} · {p.commissionRate}% comm.</p>
            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-50">
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Revenus</p>
                <p className="text-[15px] font-semibold text-slate-900 mt-0.5">{p.totalRevenue.toLocaleString()} <span className="text-[11px] font-normal text-slate-400">MAD</span></p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Referrals</p>
                <p className="text-[15px] font-semibold text-slate-900 mt-0.5">{p.activeReferrals}</p>
              </div>
            </div>
          </div>
        ))}
        <button
          onClick={() => { const n = prompt('Nom du partenaire :'); if (n) setPartners([...partners, { id: `p-${Date.now()}`, name: n, type: 'Referral', commissionRate: 10, activeReferrals: 0, totalRevenue: 0, status: 'Active' }]); }}
          className="border-2 border-dashed border-slate-200 rounded-[10px] p-5 flex flex-col items-center justify-center text-slate-400 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/20 transition-all bg-white min-h-[160px]"
        >
          <IconPlus className="w-6 h-6 mb-2" />
          <span className="text-[13px] font-semibold">Ajouter un partenaire</span>
        </button>
      </div>
    </div>
  );

  const CampaignsView = () => {
    const statusBadge = (s: string) => {
      if (s === 'Sent') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      if (s === 'Scheduled') return 'bg-blue-50 text-blue-700 border-blue-200';
      return 'bg-slate-100 text-slate-500 border-slate-200';
    };
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <KpiCard label="Campagnes envoyées" value="2" sub="Ce trimestre" />
          <KpiCard label="Messages envoyés" value="145" sub="Total destinataires" />
          <KpiCard label="Taux d'ouverture" value="68%" trend="↑ Excellent" />
        </div>
        <div className="bg-white border border-slate-100 rounded-[10px] overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-[14px] font-semibold text-slate-900">Historique des campagnes</h3>
            <button onClick={() => { const n = prompt('Nom de la campagne :'); if (n) setCampaigns([...campaigns, { id: `c-${Date.now()}`, name: n, type: 'SMS', status: 'Draft', audience: 'Tous', sentCount: 0, date: '—' }]); }} className="sa-btn">
              <IconPlus className="w-3.5 h-3.5" /> Nouvelle campagne
            </button>
          </div>
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-50">
                {['Campagne', 'Canal', 'Audience', 'Envois', 'Date', 'Statut'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {campaigns.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-4 text-[13px] font-semibold text-slate-900">{c.name}</td>
                  <td className="px-5 py-4">
                    <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">{c.type}</span>
                  </td>
                  <td className="px-5 py-4 text-[12px] text-slate-500 max-w-[180px] truncate">{c.audience}</td>
                  <td className="px-5 py-4 text-[13px] font-semibold text-slate-900">{c.sentCount.toLocaleString()}</td>
                  <td className="px-5 py-4 text-[12px] text-slate-400 font-mono">{c.date}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusBadge(c.status)}`}>{c.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  /* ── Meetings View ── */
  const MeetingsView = () => {
    const [filter, setFilter] = useState<'all' | 'Scheduled' | 'Completed' | 'No-show'>('all');
    const [showForm, setShowForm] = useState(false);
    const [newMeeting, setNewMeeting] = useState({ prospect: '', contact: '', type: 'Demo', date: '', time: '10:00', duration: 30, owner: 'Youssef', notes: '' });

    const filtered = filter === 'all' ? meetings : meetings.filter(m => m.status === filter);
    const upcoming = meetings.filter(m => m.status === 'Scheduled').length;
    const completed = meetings.filter(m => m.status === 'Completed').length;
    const noShow = meetings.filter(m => m.status === 'No-show').length;
    const noShowRate = meetings.length > 0 ? Math.round((noShow / meetings.length) * 100) : 0;

    const statusBadge = (s: Meeting['status']) => {
      if (s === 'Scheduled') return 'bg-blue-50 text-blue-700 border-blue-200';
      if (s === 'Completed') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      if (s === 'No-show') return 'bg-red-50 text-red-700 border-red-200';
      return 'bg-slate-100 text-slate-500 border-slate-200';
    };
    const typeBadge = (t: Meeting['type']) => {
      if (t === 'Demo') return 'bg-violet-50 text-violet-700';
      if (t === 'Closing') return 'bg-amber-50 text-amber-700';
      if (t === 'Discovery') return 'bg-sky-50 text-sky-700';
      return 'bg-slate-50 text-slate-600';
    };

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-4">
          <KpiCard label="Réunions prévues" value={`${upcoming}`} sub="Cette semaine" />
          <KpiCard label="Démos complétées" value={`${completed}`} trend={completed > 0 ? `↑ ${completed} ce mois` : undefined} />
          <KpiCard label="Taux no-show" value={`${noShowRate}%`} sub={noShow > 0 ? `${noShow} absence(s)` : 'Excellent'} />
          <KpiCard label="Durée moy." value="32min" sub="Par réunion" />
        </div>

        <div className="bg-white border border-slate-100 rounded-[10px] overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-[14px] font-semibold text-slate-900">Toutes les réunions</h3>
              <div className="flex bg-slate-100 rounded-[8px] p-0.5 gap-0.5">
                {(['all', 'Scheduled', 'Completed', 'No-show'] as const).map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`px-3 py-1 rounded-[6px] text-[11px] font-semibold transition-colors ${filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    {f === 'all' ? 'Toutes' : f === 'Scheduled' ? 'Planifiées' : f === 'Completed' ? 'Terminées' : 'No-show'}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => setShowForm(!showForm)} className="sa-btn">
              <IconPlus className="w-3.5 h-3.5" /> Planifier réunion
            </button>
          </div>

          {showForm && (
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-100">
              <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-3">Nouvelle réunion</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Prospect</label>
                  <input className="input text-[12px]" placeholder="Nom du cabinet" value={newMeeting.prospect} onChange={e => setNewMeeting({ ...newMeeting, prospect: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Contact</label>
                  <input className="input text-[12px]" placeholder="Dr. Nom" value={newMeeting.contact} onChange={e => setNewMeeting({ ...newMeeting, contact: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Type</label>
                  <select className="input text-[12px]" value={newMeeting.type} onChange={e => setNewMeeting({ ...newMeeting, type: e.target.value })}>
                    {['Discovery', 'Demo', 'Follow-up', 'Closing'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Date</label>
                  <input type="date" className="input text-[12px]" value={newMeeting.date} onChange={e => setNewMeeting({ ...newMeeting, date: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Heure</label>
                  <input type="time" className="input text-[12px]" value={newMeeting.time} onChange={e => setNewMeeting({ ...newMeeting, time: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Durée (min)</label>
                  <select className="input text-[12px]" value={newMeeting.duration} onChange={e => setNewMeeting({ ...newMeeting, duration: +e.target.value })}>
                    {[15, 20, 30, 45, 60].map(d => <option key={d} value={d}>{d} min</option>)}
                  </select>
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Notes</label>
                <input className="input text-[12px] w-full" placeholder="Contexte ou objectif…" value={newMeeting.notes} onChange={e => setNewMeeting({ ...newMeeting, notes: e.target.value })} />
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  disabled={!newMeeting.prospect || !newMeeting.date}
                  onClick={() => {
                    setMeetings([{ ...newMeeting, id: `m-${Date.now()}`, type: newMeeting.type as Meeting['type'], status: 'Scheduled', owner: 'Youssef' }, ...meetings]);
                    setShowForm(false);
                    setNewMeeting({ prospect: '', contact: '', type: 'Demo', date: '', time: '10:00', duration: 30, owner: 'Youssef', notes: '' });
                  }}
                  className="sa-btn disabled:opacity-50"
                >Créer la réunion</button>
                <button onClick={() => setShowForm(false)} className="sa-btn-ghost">Annuler</button>
              </div>
            </div>
          )}

          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-50">
                {['Prospect', 'Type', 'Date & Heure', 'Durée', 'Attribuer à', 'Statut', 'Next Step'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(m => (
                <tr key={m.id} className="hover:bg-slate-50/60 transition-colors group">
                  <td className="px-5 py-4">
                    <p className="text-[13px] font-semibold text-slate-900">{m.prospect}</p>
                    <p className="text-[11px] text-slate-400">{m.contact}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${typeBadge(m.type)}`}>{m.type}</span>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-[13px] font-semibold text-slate-900">{new Date(m.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</p>
                    <p className="text-[11px] text-slate-400">{m.time}</p>
                  </td>
                  <td className="px-5 py-4 text-[12px] text-slate-500">{m.duration} min</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-[9px] font-bold shrink-0">{m.owner.charAt(0)}</div>
                      <select
                        className="text-[12px] text-slate-700 font-semibold bg-transparent border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-200 rounded px-1"
                        value={m.owner}
                        onChange={e => setMeetings(prev => prev.map(mt => mt.id === m.id ? { ...mt, owner: e.target.value } : mt))}
                      >
                        {['Youssef', 'Samia', 'Amine', 'Laila'].map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusBadge(m.status)}`}>{m.status}</span>
                  </td>
                  <td className="px-5 py-4 text-[11px] text-slate-400 max-w-[180px] truncate">{m.nextStep || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  /* ── Propositions View ── */
  const PropositionsView = () => {
    const planColors: Record<string, string> = {
      Essentiel: 'bg-slate-100 text-slate-700 border-slate-200',
      Pro: 'bg-violet-50 text-violet-700 border-violet-200',
      Premium: 'bg-amber-50 text-amber-700 border-amber-200',
    };
    const statusColors: Record<string, string> = {
      Draft: 'bg-slate-100 text-slate-500 border-slate-200',
      Sent: 'bg-blue-50 text-blue-700 border-blue-200',
      Viewed: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      Accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      Rejected: 'bg-red-50 text-red-600 border-red-200',
      Negotiating: 'bg-amber-50 text-amber-700 border-amber-200',
    };
    const statusDot: Record<string, string> = {
      Draft: 'bg-slate-300',
      Sent: 'bg-blue-400',
      Viewed: 'bg-indigo-400',
      Accepted: 'bg-emerald-500',
      Rejected: 'bg-red-400',
      Negotiating: 'bg-amber-400',
    };
    const statusBg: Record<string, string> = {
      Draft: 'bg-slate-100',
      Sent: 'bg-blue-50',
      Viewed: 'bg-indigo-50',
      Accepted: 'bg-emerald-50',
      Rejected: 'bg-red-50',
      Negotiating: 'bg-amber-50',
    };

    const totalPipeline = propositions.filter(p => ['Sent', 'Viewed', 'Negotiating'].includes(p.status)).reduce((s, p) => s + p.amount, 0);
    const wonValue = propositions.filter(p => p.status === 'Accepted').reduce((s, p) => s + p.amount, 0);
    const winRate = propositions.length > 0 ? Math.round((propositions.filter(p => p.status === 'Accepted').length / propositions.filter(p => ['Accepted', 'Rejected'].includes(p.status)).length) * 100) : 0;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-4">
          <KpiCard label="Pipeline actif" value={`${totalPipeline.toLocaleString()} MAD`} sub="Propositions en cours" />
          <KpiCard label="MRR gagné" value={`${wonValue.toLocaleString()} MAD`} trend={wonValue > 0 ? '↑ Ce mois' : undefined} />
          <KpiCard label="Win rate" value={`${isNaN(winRate) ? 0 : winRate}%`} sub="Acceptées / Envoyées" />
          <KpiCard label="En négociation" value={`${propositions.filter(p => p.status === 'Negotiating').length}`} sub="Requièrent attention" />
        </div>

        <div className="bg-white border border-slate-100 rounded-[10px] overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-[14px] font-semibold text-slate-900">Propositions commerciales</h3>
            <button
              onClick={() => {
                const prospect = prompt('Nom du prospect :');
                if (!prospect) return;
                const plan = (prompt('Plan (Essentiel/Pro/Premium) :') || 'Pro') as Proposition['plan'];
                const amount = plan === 'Premium' ? 1499 : plan === 'Pro' ? 999 : 499;
                setPropositions([{ id: `pr-${Date.now()}`, prospect, contact: '', plan, amount, status: 'Draft', createdAt: new Date().toISOString().slice(0, 10), expiresAt: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10), notes: '' }, ...propositions]);
              }}
              className="sa-btn">
              <IconPlus className="w-3.5 h-3.5" /> Nouvelle proposition
            </button>
          </div>

          <div className="divide-y divide-slate-50">
            {propositions.map(p => (
              <div key={p.id} className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50/40 transition-colors group">
                <div className={`w-9 h-9 rounded-[8px] flex items-center justify-center shrink-0 ${statusBg[p.status] || 'bg-slate-100'}`}>
                  <span className={`w-3 h-3 rounded-full ${statusDot[p.status] || 'bg-slate-300'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[14px] font-semibold text-slate-900">{p.prospect}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${planColors[p.plan]}`}>{p.plan}</span>
                  </div>
                  <p className="text-[12px] text-slate-400 mt-0.5">
                    Créée le {new Date(p.createdAt).toLocaleDateString('fr-FR')} · expire le {new Date(p.expiresAt).toLocaleDateString('fr-FR')}
                    {p.viewedAt ? ` · vue le ${new Date(p.viewedAt).toLocaleDateString('fr-FR')}` : ''}
                  </p>
                  {p.notes && <p className="text-[11px] text-slate-400 italic mt-0.5 truncate">{p.notes}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[18px] font-semibold text-slate-900">{p.amount.toLocaleString()} <span className="text-[12px] font-normal text-slate-400">MAD/mois</span></p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColors[p.status]}`}>{p.status}</span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                  {p.status === 'Draft' && (
                    <button
                      onClick={() => setPropositions(propositions.map(pr => pr.id === p.id ? { ...pr, status: 'Sent', sentAt: new Date().toISOString().slice(0, 10) } : pr))}
                      className="sa-btn text-[11px] py-1 !px-2.5"
                    >Envoyer</button>
                  )}
                  {p.status === 'Negotiating' && (
                    <button
                      onClick={() => setPropositions(propositions.map(pr => pr.id === p.id ? { ...pr, status: 'Accepted' } : pr))}
                      className="px-2.5 py-1 bg-emerald-500 text-white rounded-[6px] text-[11px] font-semibold"
                    >Acceptée</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  /* ── Data Scraping / Prospection View ── */
  const ScrapingView = () => {
    const specialties = ['Dentiste', 'Médecin généraliste', 'Pédiatre', 'Gynécologue', 'Ophtalmologue', 'Cardiologue', 'Dermatologue', 'Kinésithérapeute', 'Psychiatre', 'Nutritionniste'];
    const cities = ['Casablanca', 'Rabat', 'Marrakech', 'Fès', 'Tanger', 'Meknès', 'Oujda', 'Agadir', 'Kénitra', 'Tétouan'];
    const [isScanning, setIsScanning] = useState(false);
    const [csvText, setCsvText] = useState('');
    const [activeSection, setActiveSection] = useState<'scanner' | 'csv' | 'manual'>('scanner');

    const handleScan = () => {
      setIsScanning(true);
      setTimeout(() => {
        const newLeads: ScrapedLead[] = [
          { id: `sl-${Date.now()}-1`, clinicName: `Cabinet Dr. ${['Alaoui', 'Benali', 'Cherkaoui', 'Drissi'][Math.floor(Math.random() * 4)]}`, specialty: scrapingSpecialty, city: scrapingCity, phone: `05 ${Math.floor(Math.random() * 90 + 10)} XX XX XX`, source: 'Maps', addedToFunnel: false, verified: false },
          { id: `sl-${Date.now()}-2`, clinicName: `Centre ${scrapingSpecialty} ${scrapingCity}`, specialty: scrapingSpecialty, city: scrapingCity, address: `Bd Hassan II, ${scrapingCity}`, source: 'Directory', addedToFunnel: false, verified: false },
        ];
        setScrapedLeads(prev => [...newLeads, ...prev]);
        setIsScanning(false);
      }, 2500);
    };

    const handleCSVImport = () => {
      const lines = csvText.trim().split('\n').filter(Boolean);
      const imported: ScrapedLead[] = lines.slice(1).map((line, i) => {
        const [name, specialty, city, phone] = line.split(',').map(s => s.trim());
        return { id: `csv-${Date.now()}-${i}`, clinicName: name || 'Cabinet', specialty: specialty || 'Généraliste', city: city || 'Casablanca', phone, source: 'CSV', addedToFunnel: false, verified: false };
      });
      setScrapedLeads(prev => [...imported, ...prev]);
      setCsvText('');
    };

    const addToFunnel = (lead: ScrapedLead) => {
      setScrapedLeads(prev => prev.map(l => l.id === lead.id ? { ...l, addedToFunnel: true } : l));
      addLead({ name: lead.clinicName, contactPerson: '', email: '', phone: lead.phone || '', city: lead.city, source: lead.source, status: 'New', estValue: 499, notes: `Spécialité: ${lead.specialty}` });
    };

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-4">
          <KpiCard label="Leads scrappés" value={`${scrapedLeads.length}`} sub="Base de données" />
          <KpiCard label="Ajoutés au pipeline" value={`${scrapedLeads.filter(l => l.addedToFunnel).length}`} />
          <KpiCard label="Vérifiés" value={`${scrapedLeads.filter(l => l.verified).length}`} sub="Données confirmées" />
          <KpiCard label="Taux conversion" value={scrapedLeads.length > 0 ? `${Math.round((scrapedLeads.filter(l => l.addedToFunnel).length / scrapedLeads.length) * 100)}%` : '—'} sub="Scraping → Pipeline" />
        </div>

        {/* Input methods */}
        <div className="grid grid-cols-3 gap-4">
          {/* Scanner */}
          <div className="bg-white border border-slate-100 rounded-[10px] p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-50 rounded-[8px] flex items-center justify-center">
                <IconSearch className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-slate-900">Scanner par zone</p>
                <p className="text-[11px] text-slate-400">Google Maps / Annuaire</p>
              </div>
            </div>
            <div className="space-y-2.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Spécialité</label>
                <select className="input text-[12px]" value={scrapingSpecialty} onChange={e => setScrapingSpecialty(e.target.value)}>
                  {specialties.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ville</label>
                <select className="input text-[12px]" value={scrapingCity} onChange={e => setScrapingCity(e.target.value)}>
                  {cities.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <button onClick={handleScan} disabled={isScanning} className="w-full sa-btn justify-center disabled:opacity-60">
                {isScanning ? (
                  <span className="flex items-center gap-2"><span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" /> Scan en cours…</span>
                ) : 'Lancer le scan'}
              </button>
            </div>
          </div>

          {/* CSV Import */}
          <div className="bg-white border border-slate-100 rounded-[10px] p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-emerald-50 rounded-[8px] flex items-center justify-center">
                <IconFileText className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-slate-900">Import CSV</p>
                <p className="text-[11px] text-slate-400">Nom,Spécialité,Ville,Téléphone</p>
              </div>
            </div>
            <textarea
              className="w-full h-28 px-3 py-2 border border-slate-200 rounded-[8px] text-[11px] font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-300"
              placeholder={"Nom,Spécialité,Ville,Téléphone\nCabinet Dr. Alami,Dentiste,Casablanca,0522XXXXXX"}
              value={csvText}
              onChange={e => setCsvText(e.target.value)}
            />
            <button onClick={handleCSVImport} disabled={!csvText.trim()} className="w-full sa-btn justify-center mt-2 disabled:opacity-50">
              Importer le CSV
            </button>
          </div>

          {/* Manual Add */}
          <div className="bg-white border border-slate-100 rounded-[10px] p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-violet-50 rounded-[8px] flex items-center justify-center">
                <IconUserPlus className="w-4 h-4 text-violet-600" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-slate-900">Ajout manuel</p>
                <p className="text-[11px] text-slate-400">LinkedIn / Contacts</p>
              </div>
            </div>
            <div className="space-y-2.5">
              {[
                { label: 'Nom du cabinet', key: 'clinicName', placeholder: 'Cabinet Dr. …' },
                { label: 'Spécialité', key: 'specialty', placeholder: 'Dentiste' },
                { label: 'Ville', key: 'city', placeholder: 'Casablanca' },
                { label: 'Téléphone', key: 'phone', placeholder: '0522 XX XX XX' },
              ].reduce<React.ReactNode[]>((acc, f, i, arr) => {
                acc.push(
                  <div key={f.key}>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{f.label}</label>
                    <input id={`manual-${f.key}`} className="input text-[12px]" placeholder={f.placeholder} />
                  </div>
                );
                if (i === arr.length - 1) {
                  acc.push(
                    <button key="add" onClick={() => {
                      const get = (k: string) => (document.getElementById(`manual-${k}`) as HTMLInputElement)?.value || '';
                      const name = get('clinicName');
                      if (!name) return;
                      setScrapedLeads(prev => [{ id: `m-${Date.now()}`, clinicName: name, specialty: get('specialty') || 'Généraliste', city: get('city') || 'Casablanca', phone: get('phone'), source: 'Manual', addedToFunnel: false, verified: true }, ...prev]);
                    }} className="w-full sa-btn justify-center">
                      Ajouter
                    </button>
                  );
                }
                return acc;
              }, [])}
            </div>
          </div>
        </div>

        {/* Leads table */}
        <div className="bg-white border border-slate-100 rounded-[10px] overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-[14px] font-semibold text-slate-900">Base de leads ({scrapedLeads.length})</h3>
            <div className="flex gap-2 text-[11px] text-slate-400">
              <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-semibold">{scrapedLeads.filter(l => l.source === 'Maps').length} Maps</span>
              <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">{scrapedLeads.filter(l => l.source === 'CSV').length} CSV</span>
              <span className="bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full font-semibold">{scrapedLeads.filter(l => l.source === 'Manual').length} Manuel</span>
            </div>
          </div>
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-50">
                {['Cabinet', 'Spécialité', 'Ville', 'Téléphone', 'Source', 'Vérifié', ''].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {scrapedLeads.map(lead => (
                <tr key={lead.id} className={`hover:bg-slate-50/60 transition-colors ${lead.addedToFunnel ? 'opacity-50' : ''}`}>
                  <td className="px-5 py-3">
                    <p className="text-[13px] font-semibold text-slate-900">{lead.clinicName}</p>
                    {lead.address && <p className="text-[11px] text-slate-400 truncate max-w-[160px]">{lead.address}</p>}
                  </td>
                  <td className="px-5 py-3 text-[12px] text-slate-600">{lead.specialty}</td>
                  <td className="px-5 py-3 text-[12px] text-slate-600">{lead.city}</td>
                  <td className="px-5 py-3 text-[12px] font-mono text-slate-600">{lead.phone || '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${lead.source === 'Maps' ? 'bg-blue-50 text-blue-700' : lead.source === 'CSV' ? 'bg-emerald-50 text-emerald-700' : lead.source === 'Directory' ? 'bg-amber-50 text-amber-700' : 'bg-violet-50 text-violet-700'}`}>
                      {lead.source}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {lead.verified ? <span className="text-emerald-500 font-bold">✓</span> : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {lead.addedToFunnel ? (
                      <span className="text-[11px] text-slate-400 italic">Dans le pipeline</span>
                    ) : (
                      <button onClick={() => addToFunnel(lead)} className="sa-btn text-[11px] py-1 !px-2.5">
                        → Ajouter au pipeline
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  /* ── Team Calendar View ── */
  const TeamCalendarView = () => {
    const TEAM = ['Youssef', 'Samia', 'Amine', 'Laila'];
    const COLORS: Record<string, string> = {
      Youssef: 'bg-blue-100 text-blue-800 border-blue-200',
      Samia:   'bg-violet-100 text-violet-800 border-violet-200',
      Amine:   'bg-emerald-100 text-emerald-800 border-emerald-200',
      Laila:   'bg-amber-100 text-amber-800 border-amber-200',
    };
    const OWNER_DOT: Record<string, string> = {
      Youssef: 'bg-blue-500',
      Samia:   'bg-violet-500',
      Amine:   'bg-emerald-500',
      Laila:   'bg-amber-500',
    };
    const EVENT_TYPE_COLOR: Record<string, string> = {
      Demo:        'bg-violet-50 border-violet-200 text-violet-800',
      Closing:     'bg-amber-50 border-amber-200 text-amber-800',
      Discovery:   'bg-sky-50 border-sky-200 text-sky-800',
      'Follow-up': 'bg-slate-50 border-slate-200 text-slate-700',
    };

    const [schedulingSlot, setSchedulingSlot] = React.useState<{ day: Date; hour: number } | null>(null);
    const [visitForm, setVisitForm] = React.useState<{
      prospect: string; type: Meeting['type']; duration: number; owner: string; notes: string;
    }>({ prospect: '', type: 'Demo', duration: 30, owner: 'Youssef', notes: '' });

    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1 + calendarWeek * 7);
    const days = Array.from({ length: 5 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    });
    const hours = Array.from({ length: 9 }, (_, i) => i + 9);

    const getMeetingsForDayAndHour = (day: Date, hour: number) =>
      meetings.filter(m => {
        const md = new Date(m.date);
        return md.toDateString() === day.toDateString() && parseInt(m.time.split(':')[0]) === hour;
      });

    const handleScheduleVisit = () => {
      if (!schedulingSlot || !visitForm.prospect) return;
      const h = schedulingSlot.hour;
      const timeStr = `${String(h).padStart(2, '0')}:00`;
      setMeetings(prev => [{
        id: `m-${Date.now()}`,
        prospect: visitForm.prospect,
        contact: '',
        type: visitForm.type,
        date: schedulingSlot.day.toISOString().slice(0, 10),
        time: timeStr,
        duration: visitForm.duration,
        status: 'Scheduled',
        owner: visitForm.owner,
        notes: visitForm.notes,
      }, ...prev]);
      setSchedulingSlot(null);
      setVisitForm({ prospect: '', type: 'Demo', duration: 30, owner: 'Youssef', notes: '' });
    };

    const weekLabel = `${days[0].toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} — ${days[4].toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}`;

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <button onClick={() => setCalendarWeek(w => w - 1)} className="w-8 h-8 flex items-center justify-center rounded-[8px] border border-slate-200 hover:bg-slate-50 transition-colors text-slate-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button onClick={() => setCalendarWeek(0)} className="px-3 py-1.5 text-[12px] font-semibold text-slate-600 border border-slate-200 rounded-[8px] hover:bg-slate-50 transition-colors">Aujourd'hui</button>
              <button onClick={() => setCalendarWeek(w => w + 1)} className="w-8 h-8 flex items-center justify-center rounded-[8px] border border-slate-200 hover:bg-slate-50 transition-colors text-slate-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
            <span className="text-[14px] font-semibold text-slate-900">{weekLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            {TEAM.map(member => (
              <span key={member} className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${COLORS[member]}`}>{member}</span>
            ))}
            <button
              onClick={() => setSchedulingSlot({ day: today, hour: 10 })}
              className="sa-btn ml-2"
            >
              <IconPlus className="w-3.5 h-3.5" /> Programmer visite
            </button>
          </div>
        </div>

        {/* Scheduling form — shown when a slot is selected */}
        {schedulingSlot && (
          <div className="bg-white border border-slate-200 rounded-[12px] p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[13px] font-semibold text-slate-900">Programmer une visite</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {schedulingSlot.day.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' })} à {schedulingSlot.hour}:00
                </p>
              </div>
              <button onClick={() => setSchedulingSlot(null)} className="w-7 h-7 flex items-center justify-center rounded-[6px] text-slate-400 hover:bg-slate-100 transition-colors">
                <IconX className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-5 gap-3 mb-3">
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Prospect / Cabinet</label>
                <input
                  className="input text-[12px]"
                  placeholder="Nom du cabinet…"
                  value={visitForm.prospect}
                  onChange={e => setVisitForm({ ...visitForm, prospect: e.target.value })}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Type</label>
                <select className="input text-[12px]" value={visitForm.type} onChange={e => setVisitForm({ ...visitForm, type: e.target.value as Meeting['type'] })}>
                  {(['Discovery', 'Demo', 'Follow-up', 'Closing'] as Meeting['type'][]).map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Attribuer à</label>
                <select className="input text-[12px]" value={visitForm.owner} onChange={e => setVisitForm({ ...visitForm, owner: e.target.value })}>
                  {TEAM.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Durée</label>
                <select className="input text-[12px]" value={visitForm.duration} onChange={e => setVisitForm({ ...visitForm, duration: +e.target.value })}>
                  {[15, 20, 30, 45, 60].map(d => <option key={d} value={d}>{d} min</option>)}
                </select>
              </div>
            </div>
            <div className="mb-3">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Notes (optionnel)</label>
              <input className="input text-[12px] w-full" placeholder="Contexte ou objectif de la visite…" value={visitForm.notes} onChange={e => setVisitForm({ ...visitForm, notes: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={!visitForm.prospect}
                onClick={handleScheduleVisit}
                className="sa-btn disabled:opacity-50"
              >
                Confirmer la visite
              </button>
              <button onClick={() => setSchedulingSlot(null)} className="sa-btn-ghost">Annuler</button>
              {schedulingSlot && (
                <div className="ml-auto flex items-center gap-2">
                  <label className="text-[11px] text-slate-400 font-semibold">Date</label>
                  <input
                    type="date"
                    className="input text-[12px] py-1"
                    value={schedulingSlot.day.toISOString().slice(0, 10)}
                    onChange={e => {
                      const d = new Date(e.target.value);
                      if (!isNaN(d.getTime())) setSchedulingSlot({ ...schedulingSlot, day: d });
                    }}
                  />
                  <label className="text-[11px] text-slate-400 font-semibold">Heure</label>
                  <select className="input text-[12px] py-1" value={schedulingSlot.hour} onChange={e => setSchedulingSlot({ ...schedulingSlot, hour: +e.target.value })}>
                    {hours.map(h => <option key={h} value={h}>{h}:00</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Calendar grid */}
        <div className="bg-white border border-slate-100 rounded-[12px] overflow-hidden">
          {/* Day headers */}
          <div className="grid border-b border-slate-100" style={{ gridTemplateColumns: '60px repeat(5, 1fr)' }}>
            <div className="border-r border-slate-100" />
            {days.map((day, i) => {
              const isToday = day.toDateString() === today.toDateString();
              return (
                <div key={i} className={`px-4 py-3 border-r border-slate-100 last:border-r-0 text-center ${isToday ? 'bg-blue-50' : ''}`}>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                    {day.toLocaleDateString('fr-FR', { weekday: 'short' })}
                  </p>
                  <p className={`text-[20px] font-semibold leading-none mt-0.5 ${isToday ? 'text-blue-600' : 'text-slate-900'}`}>
                    {day.getDate()}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Hour rows */}
          <div className="overflow-y-auto" style={{ maxHeight: 460 }}>
            {hours.map(hour => (
              <div key={hour} className="grid border-b border-slate-50 last:border-b-0" style={{ gridTemplateColumns: '60px repeat(5, 1fr)', minHeight: 68 }}>
                <div className="border-r border-slate-100 px-2 py-2 text-right shrink-0">
                  <span className="text-[10px] text-slate-400 font-mono">{hour}:00</span>
                </div>
                {days.map((day, di) => {
                  const dayMeetings = getMeetingsForDayAndHour(day, hour);
                  return (
                    <div
                      key={di}
                      className="border-r border-slate-50 last:border-r-0 p-1 min-h-[68px] group/cell cursor-pointer hover:bg-slate-50/60 transition-colors relative"
                      onClick={() => {
                        if (dayMeetings.length === 0) {
                          setSchedulingSlot({ day, hour });
                          setVisitForm(f => ({ ...f }));
                        }
                      }}
                    >
                      {dayMeetings.map(m => (
                        <div
                          key={m.id}
                          className={`rounded-[6px] border px-2 py-1 mb-1 ${EVENT_TYPE_COLOR[m.type] || 'bg-slate-50 border-slate-200 text-slate-700'}`}
                          onClick={e => e.stopPropagation()}
                        >
                          <div className="flex items-center gap-1 mb-0.5">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${OWNER_DOT[m.owner] || 'bg-slate-400'}`} />
                            <p className="text-[11px] font-semibold truncate leading-tight flex-1">{m.prospect}</p>
                          </div>
                          <p className="text-[10px] opacity-70 leading-tight mb-1">{m.type} · {m.time} · {m.duration}min</p>
                          {/* Attribution inline select */}
                          <select
                            className="w-full text-[9px] font-semibold bg-white/60 border border-current/20 rounded px-1 py-0.5 cursor-pointer focus:outline-none"
                            value={m.owner}
                            onChange={e => {
                              setMeetings(prev => prev.map(mt => mt.id === m.id ? { ...mt, owner: e.target.value } : mt));
                            }}
                          >
                            {TEAM.map(t => <option key={t}>{t}</option>)}
                          </select>
                        </div>
                      ))}
                      {dayMeetings.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/cell:opacity-100 transition-opacity pointer-events-none">
                          <span className="text-[9px] text-slate-300 font-semibold">+ Planifier</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Team workload */}
        <div className="grid grid-cols-4 gap-4">
          {TEAM.map(member => {
            const memberMeetings = meetings.filter(m => m.owner === member && m.status === 'Scheduled');
            const completed = meetings.filter(m => m.owner === member && m.status === 'Completed').length;
            return (
              <div key={member} className="bg-white border border-slate-100 rounded-[12px] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold border ${COLORS[member]}`}>
                    {member.charAt(0)}
                  </div>
                  <p className="text-[13px] font-semibold text-slate-900">{member}</p>
                  <button
                    onClick={() => {
                      setSchedulingSlot({ day: today, hour: 10 });
                      setVisitForm(f => ({ ...f, owner: member }));
                    }}
                    className="ml-auto w-6 h-6 flex items-center justify-center rounded-[5px] border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
                    title={`Planifier pour ${member}`}
                  >
                    <IconPlus className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[11px] text-slate-400">Planifiées</span>
                    <span className="text-[12px] font-semibold text-slate-900">{memberMeetings.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[11px] text-slate-400">Terminées</span>
                    <span className="text-[12px] font-semibold text-emerald-600">{completed}</span>
                  </div>
                  <div className="mt-2">
                    {memberMeetings.slice(0, 2).map(m => (
                      <div key={m.id} className="text-[10px] text-slate-400 py-0.5 border-t border-slate-50 first:border-0 truncate">
                        {new Date(m.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} {m.time} · {m.prospect}
                      </div>
                    ))}
                    {memberMeetings.length > 2 && (
                      <p className="text-[10px] text-slate-400 pt-0.5">+{memberMeetings.length - 2} autres</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /* ── Slide-Over: Prospect Detail ── */
  const SCRIPTS = {
    pitch: `Bonjour ${selectedProspect?.contactName},\n\nJe suis de Medicom. J'appelle car nous aidons les cabinets à ${selectedProspect?.city || 'votre région'} à digitaliser leur gestion sans changer la façon dont le médecin travaille.\n\nÊtes-vous la bonne personne pour parler d'une plateforme qui gère les dossiers et RDV automatiquement ?`,
    price: `Je comprends. Si on regarde le temps gagné sur les RDV manqués et la paperasse, le système s'autofinance en récupérant 2 consultations par mois.\n\nSeriez-vous ouvert à une démo de 10 min pour voir si ça s'applique à votre cabinet ?`,
    timing: `Justement, la raison de mon appel est de vous faire GAGNER du temps. Je sais que vous êtes occupé.\n\nEst-ce que je peux vous bloquer 10 min mardi prochain à 14h ? Si à 14h10 vous n'êtes pas convaincu, on s'arrête là.`,
  };

  const activityIconConfig: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    call: { bg: 'bg-green-50', text: 'text-green-600', icon: <IconPhone className="w-3.5 h-3.5" /> },
    email: { bg: 'bg-blue-50', text: 'text-blue-600', icon: <IconMail className="w-3.5 h-3.5" /> },
    meeting: { bg: 'bg-violet-50', text: 'text-violet-600', icon: <IconCalendar className="w-3.5 h-3.5" /> },
    note: { bg: 'bg-slate-100', text: 'text-slate-600', icon: <IconActivity className="w-3.5 h-3.5" /> },
    status_change: { bg: 'bg-amber-50', text: 'text-amber-600', icon: <IconCheckCircle className="w-3.5 h-3.5" /> },
  };

  return (
    <div className="flex flex-col h-full space-y-6 font-sans">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold text-slate-900 tracking-tight">Growth & CRM</h1>
          <p className="text-[13px] text-slate-500 mt-0.5">Command center — Pipeline · Réunions · Propositions · Prospection · Équipe</p>
        </div>
        {/* Always-visible MRR ticker */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-slate-900 rounded-[10px] px-4 py-2.5">
            <div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">MRR Mai 2026</p>
              <div className="flex items-baseline gap-1">
                <span className="text-white font-bold text-[15px] tracking-tight">24 500</span>
                <span className="text-slate-500 text-[10px]">/ 35 000 MAD</span>
              </div>
            </div>
            <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: '70%' }} />
            </div>
            <span className="text-[11px] font-bold text-emerald-400">70%</span>
          </div>
          <button onClick={() => setIsAddLeadOpen(true)} className="sa-btn">
            <IconPlus className="w-4 h-4" />
            Nouveau lead
          </button>
        </div>
      </div>

      {/* ── Tab Switcher ── */}
      <div className="flex items-center gap-1 bg-slate-100/70 rounded-[10px] p-1 self-start flex-wrap">
        {TABS_PRIMARY.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] text-[12px] font-semibold transition-all duration-150 ${activeTab === tab.id ? 'bg-[#0f0f10] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
        <div className="w-px h-5 bg-slate-200 mx-1" />
        {TABS_SECONDARY.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-[8px] text-[12px] font-medium transition-all duration-150 ${activeTab === tab.id ? 'bg-[#0f0f10] text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <tab.icon className="w-3 h-3" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Views ── */}
      {activeTab === 'tower' && <ControlTowerView />}
      {activeTab === 'sales' && <SalesView />}
      {activeTab === 'meetings' && <MeetingsView />}
      {activeTab === 'propositions' && <PropositionsView />}
      {activeTab === 'scraping' && <ScrapingView />}
      {activeTab === 'team-calendar' && <TeamCalendarView />}
      {activeTab === 'onboarding' && <OnboardingView />}
      {activeTab === 'partners' && <PartnersView />}
      {activeTab === 'campaigns' && <CampaignsView />}

      {/* ── Prospect Detail SlideOver ── */}
      <SlideOver isOpen={!!selectedProspect} onClose={() => setSelectedProspect(null)} title={selectedProspect?.clinicName || ''} subtitle="Prospect">
        {selectedProspect && (
          <div>
            {/* Status strip */}
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2 flex-wrap">
              {COLUMNS.map(col => (
                <button key={col}
                  onClick={async () => { await moveLead(selectedProspect.id, col); setSelectedProspect({ ...selectedProspect, status: col as any }); refresh(); }}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${selectedProspect.status === col ? `${STATUS_CONFIG[col].bg} ${STATUS_CONFIG[col].color} ${STATUS_CONFIG[col].border}` : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}>
                  {STATUS_CONFIG[col].label}
                </button>
              ))}
            </div>

            {/* Rapid actions */}
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Actions rapides</p>
              <div className="flex gap-2">
                <button onClick={() => logRapidAction('call')} className="sa-btn-ghost flex items-center gap-1.5 text-[12px] py-1.5">
                  <IconPhone className="w-3.5 h-3.5 text-emerald-600" /> Appeler
                </button>
                <button onClick={() => logRapidAction('email')} className="sa-btn-ghost flex items-center gap-1.5 text-[12px] py-1.5">
                  <IconMail className="w-3.5 h-3.5 text-blue-600" /> Email
                </button>
                <button onClick={() => logRapidAction('meeting')} className="sa-btn flex items-center gap-1.5 text-[12px] py-1.5">
                  <IconCalendar className="w-3.5 h-3.5" /> Réserver démo
                </button>
              </div>
            </div>

            {/* Info grid */}
            <div className="px-5 py-4 border-b border-slate-100">
              <ol className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Contact', value: selectedProspect.contactName },
                  { label: 'Email', value: selectedProspect.email || '—' },
                  { label: 'Ville', value: selectedProspect.city },
                  { label: 'Source', value: selectedProspect.source },
                  { label: 'Valeur estimée', value: (selectedProspect as any).estValue ? `${((selectedProspect as any).estValue).toLocaleString()} MAD` : '—' },
                  { label: 'Date', value: selectedProspect.date },
                ].map(i => (
                  <li key={i.label}>
                    <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{i.label}</dt>
                    <dd className="text-[13px] font-semibold text-slate-900 mt-0.5">{i.value}</dd>
                  </li>
                ))}
              </ol>
            </div>

            {/* Playbook */}
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Playbook</p>
              <div className="flex bg-slate-100 rounded-[8px] p-1 mb-3">
                {(['pitch', 'price', 'timing'] as const).map(s => (
                  <button key={s} onClick={() => setActiveScript(s)}
                    className={`flex-1 text-[12px] px-2 py-1.5 rounded-[6px] font-semibold transition-colors ${activeScript === s ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    {s === 'pitch' ? 'Elevator Pitch' : s === 'price' ? 'Objection Prix' : 'Objection Temps'}
                  </button>
                ))}
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-[8px] p-4 font-mono text-[12px] text-slate-700 leading-relaxed whitespace-pre-wrap">
                {SCRIPTS[activeScript]}
              </div>
            </div>

            {/* Activity log */}
            <div className="px-5 py-4 border-b border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Interactions</p>
                <div className="flex gap-1.5">
                  {(['call', 'email', 'note'] as const).map(type => (
                    <button key={type} onClick={() => logActivity(selectedProspect.id, type, type === 'note' ? (prompt('Note :') || '') : `${type} logged`)}
                      className="p-1.5 rounded-[6px] bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
                      {type === 'call' ? <IconPhone className="w-3.5 h-3.5" /> : type === 'email' ? <IconMail className="w-3.5 h-3.5" /> : <IconActivity className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                {activities.length > 0 ? activities.map(act => {
                  const cfg = activityIconConfig[act.type] || activityIconConfig.note;
                  return (
                    <div key={act.id} className="flex gap-3">
                      <div className={`w-7 h-7 rounded-full ${cfg.bg} ${cfg.text} flex items-center justify-center shrink-0`}>{cfg.icon}</div>
                      <div>
                        <p className="text-[12px] font-semibold text-slate-700 capitalize">{act.type.replace('_', ' ')}</p>
                        <p className="text-[11px] text-slate-400">{new Date(act.createdAt).toLocaleDateString('fr-FR')} · {act.description}</p>
                      </div>
                    </div>
                  );
                }) : (
                  <p className="text-[12px] text-slate-400 text-center py-4">Aucune interaction enregistrée</p>
                )}
              </div>
            </div>

            {/* Footer actions */}
            <div className="px-5 py-4 flex gap-3">
              <button onClick={async () => { await scheduleDemo(selectedProspect.id); setSelectedProspect({ ...selectedProspect, status: 'Demo' }); }} className="flex-1 sa-btn justify-center">
                Programmer Démo
              </button>
              <button className="flex-1 sa-btn-ghost justify-center">
                Modifier Lead
              </button>
            </div>
          </div>
        )}
      </SlideOver>

      {/* ── Add Lead SlideOver ── */}
      <SlideOver isOpen={isAddLeadOpen} onClose={() => setIsAddLeadOpen(false)} title="Nouveau Prospect" subtitle="Saisie d'un nouveau lead">
        <div className="p-5 space-y-4">
          {[
            { label: 'Nom du Cabinet *', key: 'clinicName', type: 'text', full: true },
            { label: 'Contact', key: 'contactName', type: 'text', full: false },
            { label: 'Ville', key: 'city', type: 'text', full: false },
            { label: 'Email', key: 'email', type: 'email', full: false },
            { label: 'Téléphone', key: 'phone', type: 'text', full: false },
          ].map(f => (
            <div key={f.key} className={f.full ? '' : ''}>
              <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">{f.label}</label>
              <input type={f.type} className="input" value={(newLead as any)[f.key]} onChange={e => setNewLead({ ...newLead, [f.key]: e.target.value })} />
            </div>
          ))}
          <div className="h-px bg-slate-100" />
          {[
            { label: 'Taille du cabinet', key: 'doctors', opts: [['1', '1 Médecin (Solo)'], ['2-5', '2 à 5 Médecins'], ['5+', 'Plus de 5 Médecins']] },
            { label: 'Système actuel', key: 'currentSystem', opts: [['Paper', 'Papier / Classeur'], ['None', 'Excel / Aucun logiciel'], ['Competitor', 'Logiciel concurrent']] },
            { label: 'Urgence', key: 'timeline', opts: [['Immediate', 'Urgent / Immédiat'], ['1-3 months', '1 à 3 mois'], ['Just browsing', 'Curieux']] },
          ].map(s => (
            <div key={s.key}>
              <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">{s.label}</label>
              <select className="input" value={(newLead as any)[s.key]} onChange={e => setNewLead({ ...newLead, [s.key]: e.target.value })}>
                {s.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          ))}
          <div className="pt-4 border-t border-slate-100">
            <button onClick={handleCreateLead} disabled={!newLead.clinicName} className="sa-btn w-full justify-center disabled:opacity-50">
              Enregistrer le prospect
            </button>
            <p className="text-center text-[11px] text-slate-400 mt-2">Le Score Qualité sera calculé automatiquement</p>
          </div>
        </div>
      </SlideOver>
    </div>
  );
};
