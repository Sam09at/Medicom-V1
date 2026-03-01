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
} from '../components/Icons';
import { Prospect, OnboardingLead, Partner, Campaign } from '../types';
import { MOCK_ONBOARDING, MOCK_PARTNERS } from '../constants';
import { SlideOver } from '../components/SlideOver';
import {
  getDailyActivityMetrics,
  type Lead,
} from '../lib/api/saas/crm';
import { useCRM } from '../hooks/useCRM';
import { motion } from 'framer-motion';

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

const TABS = [
  { id: 'tower', label: 'Control Tower', icon: IconZap },
  { id: 'sales', label: 'Pipeline', icon: IconBriefcase },
  { id: 'onboarding', label: 'Onboarding', icon: IconCheckCircle },
  { id: 'partners', label: 'Partenaires', icon: IconUsers },
  { id: 'campaigns', label: 'Campagnes', icon: IconSend },
];

/* ── KPI Strip ── */
const KpiCard = ({ label, value, sub, trend }: { label: string; value: string; sub?: string; trend?: string }) => (
  <div className="bg-white border border-slate-100 rounded-[10px] px-5 py-4 flex flex-col gap-1">
    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">{label}</span>
    <span className="text-[24px] font-semibold text-slate-900 tracking-tight leading-none">{value}</span>
    {sub && <span className="text-[11px] text-slate-400">{sub}</span>}
    {trend && <span className="text-[11px] text-emerald-600 font-semibold">{trend}</span>}
  </div>
);

/* ── Main Component ── */
export const CRM = () => {
  const { prospects, activities, loadActivities, moveLead, logActivity, scheduleDemo, loading, refresh, addLead } = useCRM();
  const [activeTab, setActiveTab] = useState<'tower' | 'sales' | 'onboarding' | 'partners' | 'campaigns'>('tower');
  const [dailyMetrics, setDailyMetrics] = useState({ calls: 0, emails: 0, meetings: 0 });
  const [draggedItem, setDraggedItem] = useState<Prospect | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [activeScript, setActiveScript] = useState<'pitch' | 'price' | 'timing'>('pitch');
  const [partners, setPartners] = useState<Partner[]>(MOCK_PARTNERS);
  const [campaigns, setCampaigns] = useState<Campaign[]>(MOCK_CAMPAIGNS);
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newLead, setNewLead] = useState({ clinicName: '', contactName: '', city: '', email: '', phone: '', doctors: '1', currentSystem: 'Paper', timeline: 'Just browsing' });

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

  /* ─────── VIEWS ─────── */

  const ControlTowerView = () => {
    const actionLeads = prospects.filter(l => ['New', 'Contacted'].includes(l.status)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);
    return (
      <div className="space-y-6">
        {/* Daily Scoreboard */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Appels aujourd\'hui', val: dailyMetrics.calls, target: 50, color: 'bg-blue-600' },
            { label: 'Démos réservées', val: dailyMetrics.meetings, target: 3, color: 'bg-emerald-500' },
            { label: 'Emails envoyés', val: dailyMetrics.emails, target: 20, color: 'bg-violet-500' },
          ].map(metric => (
            <div key={metric.label} className="bg-white border border-slate-100 rounded-[10px] p-5 flex flex-col gap-3">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">{metric.label}</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[36px] font-semibold text-slate-900 leading-none tracking-tight">{metric.val}</span>
                <span className="text-[16px] text-slate-300 font-normal">/ {metric.target}</span>
              </div>
              <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                <div className={`${metric.color} h-full rounded-full transition-all duration-700`} style={{ width: `${Math.min((metric.val / metric.target) * 100, 100)}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rapid Action Queue */}
          <div className="lg:col-span-2 bg-white border border-slate-100 rounded-[10px] overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-[14px] font-semibold text-slate-900 flex items-center gap-2">
                <IconZap className="w-4 h-4 text-amber-500" />
                Rapid Action Queue
              </h3>
              <span className="text-[12px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">{actionLeads.length} en attente</span>
            </div>
            {actionLeads.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center gap-3">
                <IconCheckCircle className="w-10 h-10 text-emerald-400" />
                <p className="text-[14px] font-medium text-slate-700">Queue vide — Bravo !</p>
                <p className="text-[12px] text-slate-400">Tous vos leads actifs ont été contactés.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {actionLeads.map(lead => (
                  <div key={lead.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50/60 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-700 font-bold text-[12px] border border-blue-100">
                        {(lead.clinicName || 'L').charAt(0)}
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-slate-900">{lead.clinicName}</p>
                        <p className="text-[12px] text-slate-400">{lead.status} · {lead.source}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setSelectedProspect(lead)} className="sa-btn py-1 !px-3 text-[12px]">Ouvrir</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Playbook Quote */}
          <div className="bg-slate-900 border border-slate-800 rounded-[10px] p-6 flex flex-col justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4">Input Philosophy</p>
              <p className="text-[14px] text-slate-200 leading-relaxed italic">
                "We don't lack capacity. We lack conviction. The volume of outputs is dictated entirely by the volume of inputs."
              </p>
            </div>
            <p className="text-[11px] font-bold text-slate-500 mt-6 text-right">— Alex Hormozi</p>
          </div>
        </div>
      </div>
    );
  };

  const SalesView = () => (
    <div className="space-y-4">
      {/* Pipeline KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Taux de conversion" value="24.5%" trend="↑ +2.1% ce mois" />
        <KpiCard label="Trials actifs" value="12" sub="Cabinets en démo" />
        <KpiCard label="Pipeline value" value="125k MAD" sub="Potentiel MRR" />
        <KpiCard label="Cycle de vente" value="18j" sub="Moyenne jours to close" />
      </div>
      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un prospect…"
            className="w-full h-9 pl-9 pr-3 border border-slate-200 rounded-[8px] text-[13px] bg-white outline-none focus:border-slate-400 placeholder:text-slate-400 transition-colors"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      {/* Kanban */}
      <div className="flex gap-4 min-w-[900px] overflow-x-auto pb-2">
        {COLUMNS.map(col => {
          const cfg = STATUS_CONFIG[col];
          const cards = filteredProspects(col);
          return (
            <div
              key={col}
              className={`flex-1 min-w-[220px] flex flex-col rounded-[10px] bg-slate-50/70 border transition-colors duration-200 ${dragOverCol === col ? 'border-blue-300 bg-blue-50/30' : 'border-slate-100'}`}
              onDragOver={e => handleDragOver(e, col)}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={e => handleDrop(e, col)}
            >
              <div className="flex items-center justify-between px-3.5 py-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">{cfg.label}</span>
                </div>
                <span className="text-[11px] font-semibold text-slate-400 bg-white border border-slate-100 rounded-full px-2 py-0.5">{cards.length}</span>
              </div>
              <div className="flex-1 p-2 space-y-2 overflow-y-auto scrollbar-hide min-h-[200px]">
                {cards.map(p => (
                  <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} key={p.id}
                    draggable onDragStart={e => handleDragStart(e as any, p)} onClick={() => setSelectedProspect(p)}
                    className={`bg-white border border-slate-100 rounded-[8px] p-3.5 cursor-grab active:cursor-grabbing group hover:border-slate-300 transition-all duration-150 ${draggedItem?.id === p.id ? 'opacity-40 scale-[0.97]' : ''}`}>
                    <div className="flex items-start justify-between mb-1.5">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${p.priority === 'High' ? 'bg-red-50 text-red-600' : p.priority === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-500'}`}>
                        {p.priority || 'Low'}
                      </span>
                      <IconMoreHorizontal className="w-3.5 h-3.5 text-slate-300" />
                    </div>
                    <p className="text-[13px] font-semibold text-slate-900 leading-tight">{p.clinicName}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{p.contactName} · {p.city}</p>
                    {p.leadScore != null && (
                      <div className="mt-2.5">
                        <div className="flex justify-between text-[10px] font-semibold text-slate-400 mb-1">
                          <span>Score</span><span className="text-slate-700">{p.leadScore}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1">
                          <div className={`h-1 rounded-full ${p.leadScore > 80 ? 'bg-emerald-500' : p.leadScore > 50 ? 'bg-blue-500' : 'bg-slate-400'}`} style={{ width: `${p.leadScore}%` }} />
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-50">
                      <span className="text-[10px] text-slate-400 font-mono">{p.date}</span>
                      <IconMessage className="w-3.5 h-3.5 text-slate-200 group-hover:text-blue-500 transition-colors" />
                    </div>
                  </motion.div>
                ))}
                {cards.length === 0 && (
                  <div className="h-20 border border-dashed border-slate-200 rounded-[8px] flex items-center justify-center text-[11px] text-slate-400">
                    Vide
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const OnboardingView = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="En onboarding" value={`${MOCK_ONBOARDING.length}`} sub="Clients actifs" />
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
            {MOCK_ONBOARDING.map(lead => {
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
          <p className="text-[13px] text-slate-500 mt-0.5">Pipeline de vente, onboarding, partenaires et campagnes.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsAddLeadOpen(true)} className="sa-btn">
            <IconPlus className="w-4 h-4" />
            Nouveau lead
          </button>
        </div>
      </div>

      {/* ── Tab Switcher ── */}
      <div className="flex items-center gap-1 bg-slate-100/70 rounded-[10px] p-1 self-start">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-[8px] text-[13px] font-semibold transition-all duration-150 ${activeTab === tab.id ? 'bg-[#0f0f10] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Views ── */}
      {activeTab === 'tower' && <ControlTowerView />}
      {activeTab === 'sales' && <SalesView />}
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
