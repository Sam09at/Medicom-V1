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
  getLeads,
  updateLeadStatus,
  getLeadActivities,
  getDailyActivityMetrics,
  addActivity,
  type Lead,
  type LeadActivity,
} from '../lib/api/saas/crm';

import { useCRM } from '../hooks/useCRM';
import { SegmentedTabs } from '../components/SegmentedTabs';
import { motion } from 'framer-motion';

const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: 'c1',
    name: 'Rappel détartrage 6 mois',
    type: 'SMS',
    status: 'Sent',
    audience: 'Patients > 6 mois sans visite',
    sentCount: 145,
    date: '10 Jan 2024',
  },
  {
    id: 'c2',
    name: 'Voeux Ramadan',
    type: 'WhatsApp',
    status: 'Scheduled',
    audience: 'Tous les patients actifs',
    sentCount: 0,
    date: '10 Mar 2024',
  },
];

const COLUMNS = ['New', 'Contacted', 'Demo', 'Converted', 'Lost'];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  New: { label: 'Nouveaux', color: 'text-blue-700', bg: 'bg-blue-50', dot: 'bg-blue-500' },
  Contacted: {
    label: 'Contactés',
    color: 'text-indigo-700',
    bg: 'bg-indigo-50',
    dot: 'bg-indigo-500',
  },
  Demo: { label: 'Démo', color: 'text-purple-700', bg: 'bg-purple-50', dot: 'bg-purple-500' },
  Converted: {
    label: 'Convertis',
    color: 'text-green-700',
    bg: 'bg-green-50',
    dot: 'bg-green-500',
  },
  Lost: { label: 'Perdus', color: 'text-slate-600', bg: 'bg-slate-100', dot: 'bg-slate-400' },
};

const ONBOARDING_STEPS = ['Contract_Sent', 'Contract_Signed', 'Training', 'Data_Import', 'Live'];

const ActionQueue = ({ leads, onLogAction }: { leads: Prospect[], onLogAction: (lead: Prospect) => void }) => {
  const actionLeads = leads
    .filter(l => ['New', 'Contacted'].includes(l.status))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  if (actionLeads.length === 0) {
    return (
      <div className="bg-white border border-slate-100 rounded-[4px] p-8 text-center flex flex-col items-center">
        <IconCheckCircle className="w-12 h-12 text-emerald-400 mb-4" />
        <h3 className="text-slate-900 font-medium text-[16px]">Queue Cleared!</h3>
        <p className="text-slate-500 text-[14px] mt-1">You reached inbox zero for high-priority leads.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-100 rounded-[4px] shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-medium text-slate-900 text-[16px] flex items-center">
          <IconZap className="w-4 h-4 text-amber-500 mr-2" />
          Rapid Action Queue
        </h3>
        <span className="text-[12px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-[30px]">{actionLeads.length} pending</span>
      </div>
      <div className="divide-y divide-slate-100">
        {actionLeads.map(lead => (
          <div key={lead.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-[14px]">
                {lead.clinicName ? lead.clinicName.charAt(0) : 'L'}
              </div>
              <div>
                <h4 className="text-slate-900 font-medium text-[14px]">{lead.clinicName}</h4>
                <div className="flex items-center gap-2 mt-0.5 text-[13px] text-slate-500">
                  <span>{lead.status}</span>
                  <span>•</span>
                  <span>{lead.source}</span>
                </div>
              </div>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onLogAction(lead)}
                className="bg-slate-900 text-white px-4 py-2 rounded-[4px] text-[13px] font-medium shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:bg-slate-800 transition-colors flex items-center cursor-pointer"
              >
                <IconPhone className="w-3.5 h-3.5 mr-1.5" />
                Action
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const CRM = () => {
  const { prospects, activities, loadActivities, moveLead, logActivity, scheduleDemo, loading, refresh } =
    useCRM();
  const [activeTab, setActiveTab] = useState<'tower' | 'sales' | 'onboarding' | 'partners' | 'campaigns'>(
    'tower'
  );
  const [dailyMetrics, setDailyMetrics] = useState({ calls: 0, emails: 0, meetings: 0 });
  const [draggedItem, setDraggedItem] = useState<Prospect | null>(null);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [activeScript, setActiveScript] = useState<'pitch' | 'price' | 'timing'>('pitch');
  const [partners, setPartners] = useState<Partner[]>(MOCK_PARTNERS);
  const [campaigns, setCampaigns] = useState<Campaign[]>(MOCK_CAMPAIGNS);

  // Load activities when prospect selected
  useEffect(() => {
    if (!selectedProspect) return;
    loadActivities(selectedProspect.id);
  }, [selectedProspect, loadActivities]);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const metrics = await getDailyActivityMetrics();
        setDailyMetrics(metrics);
      } catch (e) {
        console.error('Failed to load daily metrics', e);
      }
    };
    loadMetrics();
  }, []);

  // Kanban Handlers
  const handleDragStart = (e: React.DragEvent, prospect: Prospect) => {
    setDraggedItem(prospect);
    e.dataTransfer.effectAllowed = 'move';
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, status: string) => {
    e.preventDefault();
    if (draggedItem && draggedItem.status !== status) {
      await moveLead(draggedItem.id, status);

      // If the selected prospect is the one being dragged, update its status locally in the slideover view
      if (selectedProspect?.id === draggedItem.id) {
        setSelectedProspect({ ...selectedProspect, status: status as Prospect['status'] });
      }
    }
    setDraggedItem(null);
  };

  const handleAddPartner = () => {
    const name = prompt('Nom du nouveau partenaire :');
    if (name) {
      const newPartner: Partner = {
        id: `p-${Date.now()}`,
        name,
        type: 'Referral',
        commissionRate: 10,
        activeReferrals: 0,
        totalRevenue: 0,
        status: 'Active',
      };
      setPartners([...partners, newPartner]);
    }
  };

  const createCampaign = () => {
    const name = prompt('Nom de la campagne :');
    if (name) {
      const camp: Campaign = {
        id: `c-${Date.now()}`,
        name,
        type: 'SMS',
        status: 'Draft',
        audience: 'Tous',
        sentCount: 0,
        date: new Date().toLocaleDateString('en-GB'),
      };
      setCampaigns([...campaigns, camp]);
    }
  };

  const logRapidAction = async (type: 'call' | 'email' | 'meeting') => {
    if (!selectedProspect) return;
    try {
      if (type === 'call' && selectedProspect.phone) {
        window.open(`tel:${selectedProspect.phone}`, '_self');
      } else if (type === 'email' && selectedProspect.email) {
        const subject = encodeURIComponent('Medicom - Votre cabinet digital');
        const body = encodeURIComponent(`Bonjour ${selectedProspect.contactName},\n\nJ'aimerais discuter de la plateforme Medicom SaaS avec vous...`);
        window.open(`mailto:${selectedProspect.email}?subject=${subject}&body=${body}`, '_blank');
      }

      await logActivity(selectedProspect.id, type, `Rapid action logged: ${type}`);

      setDailyMetrics(prev => ({
        ...prev,
        [type === 'call' ? 'calls' : type === 'email' ? 'emails' : 'meetings']:
          prev[type === 'call' ? 'calls' : type === 'email' ? 'emails' : 'meetings'] + 1
      }));

      if (type === 'call' && selectedProspect.status === 'New') {
        await moveLead(selectedProspect.id, 'Contacted');
      } else if (type === 'meeting' && ['New', 'Contacted'].includes(selectedProspect.status)) {
        await moveLead(selectedProspect.id, 'Demo');
      }

      refresh();
      setSelectedProspect(null);
    } catch (error) {
      console.error(error);
    }
  };

  const ControlTowerView = () => (
    <div className="space-y-6">
      {/* Scoreboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-100 rounded-[4px] p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center text-center">
          <div className="text-slate-500 text-[12px] font-bold tracking-widest uppercase mb-2">Calls Today</div>
          <div className="text-[52px] font-heading font-medium tracking-tight text-slate-900 leading-none">
            {dailyMetrics.calls} <span className="text-[20px] text-slate-400 font-normal">/ 50</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full transition-all" style={{ width: `${Math.min((dailyMetrics.calls / 50) * 100, 100)}%` }} />
          </div>
        </div>
        <div className="bg-white border border-slate-100 rounded-[4px] p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center text-center">
          <div className="text-slate-500 text-[12px] font-bold tracking-widest uppercase mb-2">Demos Booked</div>
          <div className="text-[52px] font-heading font-medium tracking-tight text-slate-900 leading-none">
            {dailyMetrics.meetings} <span className="text-[20px] text-slate-400 font-normal">/ 3</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${Math.min((dailyMetrics.meetings / 3) * 100, 100)}%` }} />
          </div>
        </div>
        <div className="bg-white border border-slate-100 rounded-[4px] p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center text-center">
          <div className="text-slate-500 text-[12px] font-bold tracking-widest uppercase mb-2">Emails Sent</div>
          <div className="text-[52px] font-heading font-medium tracking-tight text-slate-900 leading-none">
            {dailyMetrics.emails}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActionQueue leads={prospects} onLogAction={(lead) => setSelectedProspect(lead)} />
        </div>
        <div className="space-y-6">
          <div className="bg-white border border-slate-100 rounded-[4px] p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)]">
            <h3 className="font-medium text-slate-900 text-[16px] mb-4">Input Philosophy</h3>
            <p className="text-slate-500 text-[14px] leading-relaxed">
              "We don't lack capacity. We lack conviction. The volume of outputs is dictated entirely by the volume of inputs. If you want more revenue, do more inputs."
            </p>
            <div className="mt-4 text-[12px] font-bold text-slate-400 text-right uppercase tracking-wider">— Alex Hormozi</div>
          </div>
        </div>
      </div>
    </div>
  );

  const SalesView = () => (
    <div className="flex-1 overflow-x-auto pb-4">
      <div className="flex gap-6 min-w-[1200px] h-full p-2">
        {COLUMNS.map((col) => (
          <div
            key={col}
            className={`flex-1 flex flex-col min-w-[280px] bg-[#FAFAFA] rounded-[8px] p-2 transition-colors ${draggedItem ? 'bg-slate-100/80 ring-2 ring-[#EAEAEA]' : ''}`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col)}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4 mt-2 px-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                  {STATUS_CONFIG[col].label}
                </span>
                <span className="text-[10px] font-mono font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5">
                  {prospects.filter((p) => p.status === col).length}
                </span>
              </div>
            </div>

            {/* Cards */}
            <div className="flex-1 p-2 space-y-2 overflow-y-auto scrollbar-hide">
              {prospects
                .filter((p) => p.status === col)
                .map((prospect) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={prospect.id}
                    draggable
                    onDragStart={(e: any) => handleDragStart(e, prospect)}
                    onClick={() => setSelectedProspect(prospect)}
                    className={`bg-white rounded-[8px] p-4 border border-[#EAEAEA] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.08)] cursor-grab active:cursor-grabbing active:scale-[0.98] transition-all duration-200 group ${draggedItem?.id === prospect.id ? 'opacity-40 scale-[0.98]' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 ${prospect.priority === 'High'
                          ? 'bg-red-50 text-red-600'
                          : prospect.priority === 'Medium'
                            ? 'bg-orange-50 text-orange-600'
                            : 'bg-slate-50 text-slate-500'
                          }`}
                      >
                        {prospect.priority || 'Low'}
                      </span>
                      <button className="text-slate-300 hover:text-slate-500 transition-colors">
                        <IconMoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>

                    <h4 className="font-semibold text-slate-900 text-[13px] leading-tight mb-1">
                      {prospect.clinicName}
                    </h4>
                    <p className="text-[11px] text-slate-500 mb-3 font-medium">
                      {prospect.contactName} • {prospect.city}
                    </p>

                    {prospect.leadScore && (
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                            Lead Score
                          </span>
                          <span className="text-[10px] font-bold text-slate-700">
                            {prospect.leadScore}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1">
                          <div
                            className={`h-1 rounded-full transition-all duration-500 ${prospect.leadScore > 80
                              ? 'bg-green-500'
                              : prospect.leadScore > 50
                                ? 'bg-blue-500'
                                : 'bg-slate-400'
                              }`}
                            style={{ width: `${prospect.leadScore}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100/50">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-500 border border-slate-200 uppercase">
                          {prospect.contactName.substring(0, 2)}
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 tracking-tight">
                          {prospect.date}
                        </span>
                      </div>
                      <IconMessage className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                    </div>
                  </motion.div>
                ))}
              {prospects.filter((p) => p.status === col).length === 0 && (
                <div className="h-16 border border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-[11px] font-medium bg-slate-50/30">
                  Aucun prospect
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const OnboardingView = () => (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-[30px] overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Client
              </th>
              <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Étape Onboarding
              </th>
              <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Contact
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {MOCK_ONBOARDING.map((lead) => (
              <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-900 text-sm">{lead.clinicName}</div>
                  <div className="text-xs text-slate-500">{lead.doctorName}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    {ONBOARDING_STEPS.map((step, idx) => {
                      const currentIndex = ONBOARDING_STEPS.indexOf(lead.status);
                      const isCompleted = idx <= currentIndex;
                      return (
                        <div
                          key={step}
                          className={`h-2 rounded-full flex-1 transition-all ${isCompleted ? 'bg-green-500' : 'bg-slate-200'
                            }`}
                          title={step.replace('_', ' ')}
                        ></div>
                      );
                    })}
                    <span className="ml-3 text-xs font-bold text-slate-700 capitalize">
                      {lead.status.replace('_', ' ')}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="text-sm font-medium text-slate-900">{lead.contact}</div>
                  <button className="text-[11px] text-blue-600 font-bold hover:underline">
                    Ouvrir Dossier
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full space-y-8 font-sans">
      <div className="flex flex-col sm:flex-row md:items-end justify-between gap-4 border-b border-[#EAEAEA] pb-0">
        <div className="pb-2">
          <h2 className="text-[2rem] font-semibold tracking-[-0.02em] leading-tight text-slate-900">
            Growth & CRM
          </h2>
          <p className="text-[13px] font-normal text-slate-500 mt-1">
            Gérez votre pipeline de vente et l'onboarding client.
          </p>
        </div>
        <div>
          <SegmentedTabs
            activeTab={activeTab}
            onChange={(id) => setActiveTab(id as any)}
            tabs={[
              { id: 'tower', label: 'Control Tower', icon: IconZap as any },
              { id: 'sales', label: 'Pipeline', icon: IconBriefcase as any },
              { id: 'onboarding', label: 'Onboarding', icon: IconCheckCircle as any },
              { id: 'partners', label: 'Partenaires', icon: IconUsers as any },
            ]}
          />
        </div>
      </div>

      {activeTab !== 'tower' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-[8px] border border-slate-200 shadow-sm">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Conversion Rate
            </div>
            <div className="text-xl font-semibold text-slate-900 mt-1">24.5%</div>
            <div className="flex items-center gap-1 text-green-600 text-[11px] font-medium mt-2">
              <IconTrendingUp className="w-3 h-3" /> +2.1%
            </div>
          </div>
          <div className="bg-white p-5 rounded-[8px] border border-slate-200 shadow-sm">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Active Trials
            </div>
            <div className="text-xl font-semibold text-slate-900 mt-1">12</div>
            <div className="flex items-center gap-1 text-slate-400 text-[11px] font-medium mt-2">
              Cabinets en démo
            </div>
          </div>
          <div className="bg-white p-5 rounded-[8px] border border-slate-200 shadow-sm">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Pipeline Value
            </div>
            <div className="text-xl font-semibold text-slate-900 mt-1">
              125k <span className="text-xs font-mono text-slate-400">MAD</span>
            </div>
            <div className="flex items-center gap-1 text-blue-600 text-[11px] font-medium mt-2">
              Potentiel MRR
            </div>
          </div>
          <div className="bg-white p-5 rounded-[8px] border border-slate-200 shadow-sm">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Days to Close
            </div>
            <div className="text-xl font-semibold text-slate-900 mt-1">18</div>
            <div className="flex items-center gap-1 text-slate-400 text-[11px] font-medium mt-2">
              Moyenne cycle vente
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tower' && <ControlTowerView />}
      {activeTab === 'sales' && <SalesView />}
      {activeTab === 'onboarding' && <OnboardingView />}
      {activeTab === 'partners' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {partners.map((partner) => (
            <div
              key={partner.id}
              className="bg-white border border-slate-200 rounded-[30px] p-6 shadow-sm hover:border-blue-400 transition-all"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-[8px] border border-blue-100">
                  <IconBriefcase className="w-6 h-6" />
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${partner.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}
                >
                  {partner.status}
                </span>
              </div>
              <h3 className="font-bold text-lg text-slate-900">{partner.name}</h3>
              <p className="text-sm text-slate-500 mb-6">
                {partner.type} • {partner.commissionRate}% Commission
              </p>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-6">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Revenue
                  </div>
                  <div className="text-lg font-bold text-slate-900">
                    {partner.totalRevenue.toLocaleString()} MAD
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Referrals
                  </div>
                  <div className="text-lg font-bold text-slate-900">{partner.activeReferrals}</div>
                </div>
              </div>
            </div>
          ))}
          <button
            onClick={handleAddPartner}
            className="border-2 border-dashed border-slate-200 rounded-[8px] p-6 flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-600 transition-all bg-white hover:bg-blue-50/20"
          >
            <IconPlus className="w-10 h-10 mb-2" />
            <span className="font-bold text-sm">Ajouter un Partenaire</span>
          </button>
        </div>
      )}

      <SlideOver
        isOpen={!!selectedProspect}
        onClose={() => setSelectedProspect(null)}
        title={selectedProspect?.clinicName || ''}
        subtitle="Détail du Prospect"
      >
        {selectedProspect && (
          <div className="p-0">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-[11px] font-bold tracking-widest text-slate-400 uppercase mb-2">Rapid Logging</h3>
                <div className="flex gap-2">
                  <button onClick={() => logRapidAction('call')} className="btn-secondary text-[12px] py-1.5 px-3 bg-white cursor-pointer">
                    <IconPhone className="w-3 h-3 mr-1.5 inline-block" /> Log Call
                  </button>
                  <button onClick={() => logRapidAction('email')} className="btn-secondary text-[12px] py-1.5 px-3 bg-white cursor-pointer">
                    <IconMail className="w-3 h-3 mr-1.5 inline-block" /> Log Email
                  </button>
                  <button onClick={() => logRapidAction('meeting')} className="bg-emerald-500 text-white hover:bg-emerald-600 rounded-[4px] px-3 py-1.5 text-[12px] font-medium shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-colors inline-flex items-center cursor-pointer">
                    <IconCalendar className="w-3 h-3 mr-1.5" /> Book Demo
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white border-b border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[13px] font-bold text-slate-900 tracking-tight">Guided Playbook</h3>
                <div className="flex bg-slate-100 rounded-[6px] p-1">
                  <button
                    onClick={() => setActiveScript('pitch')}
                    className={`text-[12px] px-3 py-1 rounded-[4px] font-medium transition-colors ${activeScript === 'pitch' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700 cursor-pointer'}`}
                  >
                    Elevator Pitch
                  </button>
                  <button
                    onClick={() => setActiveScript('price')}
                    className={`text-[12px] px-3 py-1 rounded-[4px] font-medium transition-colors ${activeScript === 'price' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700 cursor-pointer'}`}
                  >
                    Objection: Prix
                  </button>
                  <button
                    onClick={() => setActiveScript('timing')}
                    className={`text-[12px] px-3 py-1 rounded-[4px] font-medium transition-colors ${activeScript === 'timing' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700 cursor-pointer'}`}
                  >
                    Objection: Pas le temps
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-[8px] p-4 font-mono text-[13px] text-slate-700 leading-relaxed whitespace-pre-wrap">
                {activeScript === 'pitch' && `Bonjour ${selectedProspect.contactName},\n\nJe suis de Medicom. J'appelle car nous aidons les cabinets à ${selectedProspect.city || 'votre région'} à digitaliser leur gestion sans changer la manière dont le médecin travaille.\n\nEtes-vous la bonne personne pour parler d'une plateforme qui gère les dossiers et RDV automatiquement ?`}

                {activeScript === 'price' && `Je comprends. Si on regarde le temps gagné sur les RDV manqués et la paperasse, le système s'autofinance en récupérant 2 consultations par mois.\n\nSeriez-vous ouvert à une démo de 10 min juste pour voir si ça s'applique à votre cabinet ?`}

                {activeScript === 'timing' && `Justement, la raison de mon appel est de vous faire GAGNER du temps. Je sais que vous êtes occupé. \n\nEst-ce que je peux vous bloquer 10 min mardi prochain à 14h ? Si à 14h10 vous n'êtes pas convaincu, on s'arrête là.`}
              </div>
            </div>

            <div className="p-8 space-y-8">
              <div className="bg-slate-50 p-6 rounded-[8px] border border-slate-100">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Contact
                    </label>
                    <div className="font-bold text-slate-900">{selectedProspect.contactName}</div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Email
                    </label>
                    <div className="font-bold text-slate-900">{selectedProspect.email || '—'}</div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Ville
                    </label>
                    <div className="font-bold text-slate-900">{selectedProspect.city}</div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Source
                    </label>
                    <div className="font-bold text-slate-900">{selectedProspect.source}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-900 text-sm">Historique des interactions</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        logActivity(selectedProspect.id, 'call', 'Appel téléphonique de suivi')
                      }
                      className="p-1.5 text-green-600 bg-green-50 rounded-[8px] hover:bg-green-100 transition-colors"
                      title="Ajouter un appel"
                    >
                      <IconMessage className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => logActivity(selectedProspect.id, 'email', 'Email envoyé')}
                      className="p-1.5 text-blue-600 bg-blue-50 rounded-[8px] hover:bg-blue-100 transition-colors"
                      title="Ajouter un email"
                    >
                      <IconSend className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        const note = prompt('Saisir une note :');
                        if (note) logActivity(selectedProspect.id, 'note', note);
                      }}
                      className="p-1.5 text-slate-600 bg-slate-100 rounded-[8px] hover:bg-slate-200 transition-colors"
                      title="Ajouter une note"
                    >
                      <IconActivity className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-4">
                  {activities.length > 0 ? (
                    activities.map((act) => {
                      const iconConfig: Record<
                        string,
                        { bg: string; text: string; icon: React.ReactNode }
                      > = {
                        call: {
                          bg: 'bg-green-100',
                          text: 'text-green-600',
                          icon: <IconMessage className="w-4 h-4" />,
                        },
                        email: {
                          bg: 'bg-blue-100',
                          text: 'text-blue-600',
                          icon: <IconSend className="w-4 h-4" />,
                        },
                        meeting: {
                          bg: 'bg-purple-100',
                          text: 'text-purple-600',
                          icon: <IconUsers className="w-4 h-4" />,
                        },
                        note: {
                          bg: 'bg-slate-100',
                          text: 'text-slate-600',
                          icon: <IconActivity className="w-4 h-4" />,
                        },
                        status_change: {
                          bg: 'bg-indigo-100',
                          text: 'text-indigo-600',
                          icon: <IconCheckCircle className="w-4 h-4" />,
                        },
                      };
                      const cfg = iconConfig[act.type] || iconConfig.note;
                      return (
                        <div key={act.id} className="flex gap-4">
                          <div
                            className={`w-8 h-8 rounded-full ${cfg.bg} flex items-center justify-center ${cfg.text} shrink-0`}
                          >
                            {cfg.icon}
                          </div>
                          <div>
                            <div className="text-sm font-bold capitalize">
                              {act.type.replace('_', ' ')}
                            </div>
                            <div className="text-xs text-slate-500">
                              {new Date(act.createdAt).toLocaleDateString('fr-FR')} •{' '}
                              {act.description}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-xs text-slate-400 italic py-4 text-center">
                      Aucune interaction enregistrée
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-8 border-t border-slate-100 flex gap-3">
                <button
                  onClick={async () => {
                    await scheduleDemo(selectedProspect.id);
                    setSelectedProspect({ ...selectedProspect, status: 'Demo' });
                  }}
                  className="flex-1 py-3 btn-primary flex items-center justify-center font-bold cursor-pointer"
                >
                  Programmer Démo
                </button>
                <button className="flex-1 py-3 btn-secondary flex items-center justify-center font-bold cursor-pointer">
                  Modifier Lead
                </button>
              </div>
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  );
};
