import React, { useState } from 'react';
import { 
  IconSearch, IconPlus, IconUserPlus, IconX, IconCheck, IconFilter, 
  IconUsers, IconBriefcase, IconCheckCircle, IconClock, IconMessage, 
  IconSend, IconMoreHorizontal, IconTrendingUp, IconActivity
} from '../components/Icons';
import { Prospect, OnboardingLead, Partner, Campaign } from '../types';
import { MOCK_ONBOARDING, MOCK_PARTNERS } from '../constants';
// Add missing SlideOver import
import { SlideOver } from '../components/SlideOver';

const MOCK_PROSPECTS: Prospect[] = [
  { id: '1', clinicName: 'Cabinet Dentaire Targa', contactName: 'Dr. Tazi', city: 'Marrakech', status: 'New', source: 'LinkedIn', date: '25 Jan 2024', leadScore: 85, priority: 'High', email: 'contact@targa.ma' },
  { id: '2', clinicName: 'Clinique Al Azhar', contactName: 'Mme. Bennani', city: 'Rabat', status: 'Demo', source: 'Referral', date: '22 Jan 2024', leadScore: 60, priority: 'Medium' },
  { id: '3', clinicName: 'Orthodontie Fes', contactName: 'Dr. Lahlou', city: 'Fes', status: 'Contacted', source: 'Website', date: '20 Jan 2024', leadScore: 45, priority: 'Low' },
  { id: '4', clinicName: 'Cabinet Dr. Karim', contactName: 'Dr. Karim', city: 'Casablanca', status: 'Converted', source: 'Direct', date: '15 Jan 2024', leadScore: 95, priority: 'High' },
  { id: '5', clinicName: 'Centre Médical Nord', contactName: 'Dr. Berrada', city: 'Tanger', status: 'Lost', source: 'Cold Call', date: '10 Jan 2024', leadScore: 20, priority: 'Low' },
];

const MOCK_CAMPAIGNS: Campaign[] = [
    { id: 'c1', name: 'Rappel détartrage 6 mois', type: 'SMS', status: 'Sent', audience: 'Patients > 6 mois sans visite', sentCount: 145, date: '10 Jan 2024' },
    { id: 'c2', name: 'Voeux Ramadan', type: 'WhatsApp', status: 'Scheduled', audience: 'Tous les patients actifs', sentCount: 0, date: '10 Mar 2024' },
];

const COLUMNS = ['New', 'Contacted', 'Demo', 'Converted', 'Lost'];

const STATUS_CONFIG: Record<string, { label: string, color: string, bg: string, dot: string }> = {
    'New': { label: 'Nouveaux', color: 'text-blue-700', bg: 'bg-blue-50', dot: 'bg-blue-500' },
    'Contacted': { label: 'Contactés', color: 'text-indigo-700', bg: 'bg-indigo-50', dot: 'bg-indigo-500' },
    'Demo': { label: 'Démo', color: 'text-purple-700', bg: 'bg-purple-50', dot: 'bg-purple-500' },
    'Converted': { label: 'Convertis', color: 'text-green-700', bg: 'bg-green-50', dot: 'bg-green-500' },
    'Lost': { label: 'Perdus', color: 'text-slate-600', bg: 'bg-slate-100', dot: 'bg-slate-400' },
};

const ONBOARDING_STEPS = ['Contract_Sent', 'Contract_Signed', 'Training', 'Data_Import', 'Live'];

export const CRM = () => {
  const [activeTab, setActiveTab] = useState<'sales' | 'onboarding' | 'partners' | 'campaigns'>('sales');
  const [prospects, setProspects] = useState<Prospect[]>(MOCK_PROSPECTS);
  const [draggedItem, setDraggedItem] = useState<Prospect | null>(null);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [partners, setPartners] = useState<Partner[]>(MOCK_PARTNERS);
  const [campaigns, setCampaigns] = useState<Campaign[]>(MOCK_CAMPAIGNS);

  // Kanban Handlers
  const handleDragStart = (e: React.DragEvent, prospect: Prospect) => {
      setDraggedItem(prospect);
      e.dataTransfer.effectAllowed = 'move';
      const img = new Image();
      img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
      e.dataTransfer.setDragImage(img, 0, 0);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };

  const handleDrop = (e: React.DragEvent, status: string) => {
      e.preventDefault();
      if (draggedItem && draggedItem.status !== status) {
          const updated = prospects.map(p => p.id === draggedItem.id ? { ...p, status: status as any } : p);
          setProspects(updated);
      }
      setDraggedItem(null);
  };

  const handleAddPartner = () => {
      const name = prompt("Nom du nouveau partenaire :");
      if (name) {
          const newPartner: Partner = {
              id: `p-${Date.now()}`,
              name,
              type: 'Referral',
              commissionRate: 10,
              activeReferrals: 0,
              totalRevenue: 0,
              status: 'Active'
          };
          setPartners([...partners, newPartner]);
      }
  };

  const createCampaign = () => {
      const name = prompt("Nom de la campagne :");
      if (name) {
          const camp: Campaign = {
              id: `c-${Date.now()}`,
              name,
              type: 'SMS',
              status: 'Draft',
              audience: 'Tous',
              sentCount: 0,
              date: new Date().toLocaleDateString('en-GB')
          };
          setCampaigns([...campaigns, camp]);
      }
  };

  const SalesView = () => (
      <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex gap-6 min-w-[1200px] h-full p-2">
              {COLUMNS.map(col => (
                  <div 
                    key={col} 
                    className={`flex-1 flex flex-col min-w-[280px] rounded-xl transition-colors ${draggedItem ? 'bg-slate-100/50' : ''}`}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, col)}
                  >
                      {/* Column Header */}
                      <div className="flex items-center justify-between mb-4 px-2">
                          <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${STATUS_CONFIG[col].dot}`}></div>
                              <span className="text-sm font-bold text-slate-700">{STATUS_CONFIG[col].label}</span>
                              <span className="text-xs font-bold text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                                  {prospects.filter(p => p.status === col).length}
                              </span>
                          </div>
                      </div>

                      {/* Cards */}
                      <div className="flex-1 space-y-3 overflow-y-auto pr-2 scrollbar-hide">
                          {prospects.filter(p => p.status === col).map(prospect => (
                              <div 
                                key={prospect.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, prospect)}
                                onClick={() => setSelectedProspect(prospect)}
                                className={`bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-all group ${draggedItem?.id === prospect.id ? 'opacity-50' : ''}`}
                              >
                                  <div className="flex justify-between items-start mb-3">
                                      <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md ${
                                          prospect.priority === 'High' ? 'bg-red-50 text-red-600' :
                                          prospect.priority === 'Medium' ? 'bg-orange-50 text-orange-600' :
                                          'bg-slate-100 text-slate-500'
                                      }`}>
                                          {prospect.priority || 'Low'}
                                      </span>
                                      <button className="text-slate-300 hover:text-slate-500">
                                          <IconMoreHorizontal className="w-4 h-4" />
                                      </button>
                                  </div>

                                  <h4 className="font-bold text-slate-900 text-sm mb-1">{prospect.clinicName}</h4>
                                  <p className="text-xs text-slate-500 mb-4">{prospect.contactName} • {prospect.city}</p>

                                  {prospect.leadScore && (
                                      <div className="mb-4">
                                          <div className="flex justify-between items-center mb-1.5">
                                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Lead Score</span>
                                              <span className="text-[10px] font-bold text-slate-700">{prospect.leadScore}%</span>
                                          </div>
                                          <div className="w-full bg-slate-100 rounded-full h-1">
                                              <div 
                                                  className={`h-1 rounded-full transition-all duration-500 ${
                                                      prospect.leadScore > 80 ? 'bg-green-500' : 
                                                      prospect.leadScore > 50 ? 'bg-blue-500' : 'bg-slate-400'
                                                  }`} 
                                                  style={{ width: `${prospect.leadScore}%` }}
                                              ></div>
                                          </div>
                                      </div>
                                  )}

                                  <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                      <div className="flex items-center gap-2">
                                          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-500 border border-slate-200">
                                              {prospect.contactName.substring(0,2).toUpperCase()}
                                          </div>
                                          <span className="text-[10px] font-medium text-slate-400">{prospect.date}</span>
                                      </div>
                                      <IconMessage className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                                  </div>
                              </div>
                          ))}
                          {prospects.filter(p => p.status === col).length === 0 && (
                              <div className="h-24 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-300 text-xs font-medium">
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
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50">
                      <tr>
                          <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Client</th>
                          <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Étape Onboarding</th>
                          <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-400 uppercase tracking-widest">Contact</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {MOCK_ONBOARDING.map(lead => (
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
                                                className={`h-2 rounded-full flex-1 transition-all ${
                                                  isCompleted ? 'bg-green-500' : 'bg-slate-200'
                                                }`}
                                                title={step.replace('_', ' ')}
                                              ></div>
                                          );
                                      })}
                                      <span className="ml-3 text-xs font-bold text-slate-700 capitalize">{lead.status.replace('_', ' ')}</span>
                                  </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                  <div className="text-sm font-medium text-slate-900">{lead.contact}</div>
                                  <button className="text-[11px] text-blue-600 font-bold hover:underline">Ouvrir Dossier</button>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Growth & CRM</h2>
              <p className="text-[14px] text-slate-500 font-medium mt-1">Gérez votre pipeline de vente et l'onboarding client.</p>
          </div>
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
              <button 
                onClick={() => setActiveTab('sales')}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${activeTab === 'sales' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
              >
                  Sales
              </button>
              <button 
                onClick={() => setActiveTab('onboarding')}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${activeTab === 'onboarding' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
              >
                  Onboarding
              </button>
              <button 
                onClick={() => setActiveTab('partners')}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${activeTab === 'partners' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
              >
                  Partenaires
              </button>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Conversion Rate</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">24.5%</div>
              <div className="flex items-center gap-1 text-green-600 text-[11px] font-bold mt-2">
                  <IconTrendingUp className="w-3 h-3" /> +2.1%
              </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Trials</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">12</div>
              <div className="flex items-center gap-1 text-slate-400 text-[11px] font-bold mt-2">
                  Cabinets en démo
              </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pipeline Value</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">125k <span className="text-sm font-medium text-slate-400">MAD</span></div>
              <div className="flex items-center gap-1 text-blue-600 text-[11px] font-bold mt-2">
                  Potentiel MRR
              </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Days to Close</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">18</div>
              <div className="flex items-center gap-1 text-slate-400 text-[11px] font-bold mt-2">
                  Moyenne cycle vente
              </div>
          </div>
      </div>

      {activeTab === 'sales' && <SalesView />}
      {activeTab === 'onboarding' && <OnboardingView />}
      {activeTab === 'partners' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {partners.map(partner => (
                  <div key={partner.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-blue-400 transition-all">
                      <div className="flex justify-between items-start mb-6">
                          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                              <IconBriefcase className="w-6 h-6" />
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${partner.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                              {partner.status}
                          </span>
                      </div>
                      <h3 className="font-bold text-lg text-slate-900">{partner.name}</h3>
                      <p className="text-sm text-slate-500 mb-6">{partner.type} • {partner.commissionRate}% Commission</p>
                      
                      <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-6">
                          <div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Revenue</div>
                              <div className="text-lg font-bold text-slate-900">{partner.totalRevenue.toLocaleString()} MAD</div>
                          </div>
                          <div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Referrals</div>
                              <div className="text-lg font-bold text-slate-900">{partner.activeReferrals}</div>
                          </div>
                      </div>
                  </div>
              ))}
              <button onClick={handleAddPartner} className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-600 transition-all bg-white hover:bg-blue-50/20">
                  <IconPlus className="w-10 h-10 mb-2" />
                  <span className="font-bold text-sm">Ajouter un Partenaire</span>
              </button>
          </div>
      )}

      {/* Details SlideOver */}
      <SlideOver
        isOpen={!!selectedProspect}
        onClose={() => setSelectedProspect(null)}
        title={selectedProspect?.clinicName || ''}
        subtitle="Détail du Prospect"
      >
          {selectedProspect && (
              <div className="p-8 space-y-8">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                      <div className="grid grid-cols-2 gap-6">
                          <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contact</label>
                              <div className="font-bold text-slate-900">{selectedProspect.contactName}</div>
                          </div>
                          <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</label>
                              <div className="font-bold text-slate-900">{selectedProspect.email || '—'}</div>
                          </div>
                          <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ville</label>
                              <div className="font-bold text-slate-900">{selectedProspect.city}</div>
                          </div>
                          <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Source</label>
                              <div className="font-bold text-slate-900">{selectedProspect.source}</div>
                          </div>
                      </div>
                  </div>

                  <div className="space-y-4">
                      <h4 className="font-bold text-slate-900 text-sm">Historique des interactions</h4>
                      <div className="space-y-4">
                          <div className="flex gap-4">
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0"><IconMessage className="w-4 h-4" /></div>
                              <div>
                                  <div className="text-sm font-bold">Email envoyé</div>
                                  <div className="text-xs text-slate-500">24 Jan 2024 • Proposition commerciale envoyée.</div>
                              </div>
                          </div>
                          <div className="flex gap-4">
                              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0"><IconActivity className="w-4 h-4" /></div>
                              <div>
                                  <div className="text-sm font-bold">Démo programmée</div>
                                  <div className="text-xs text-slate-500">22 Jan 2024 • RDV fixé pour mardi à 11h.</div>
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="pt-8 border-t border-slate-100 flex gap-3">
                      <button className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-blue-700">Programmer Démo</button>
                      <button className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50">Modifier Lead</button>
                  </div>
              </div>
          )}
      </SlideOver>
    </div>
  );
};
