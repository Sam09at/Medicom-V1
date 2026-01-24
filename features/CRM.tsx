
import React, { useState } from 'react';
import { IconSearch, IconPlus, IconUserPlus, IconX, IconCheck, IconFilter, IconUsers, IconBriefcase, IconCheckCircle, IconClock, IconMessage, IconSend, IconMoreHorizontal } from '../components/Icons';
import { Prospect, OnboardingLead, Partner, Campaign } from '../types';
import { MOCK_ONBOARDING, MOCK_PARTNERS } from '../constants';

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

  // Sub-components
  const SalesView = () => (
      <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex gap-6 min-w-[1000px] h-full p-2">
              {COLUMNS.map(col => (
                  <div 
                    key={col} 
                    className={`flex-1 flex flex-col min-w-[280px] rounded-xl transition-colors ${draggedItem ? 'bg-slate-50/50' : ''}`}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, col)}
                  >
                      {/* Column Header */}
                      <div className="flex items-center justify-between mb-4 px-1">
                          <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${STATUS_CONFIG[col].dot}`}></div>
                              <span className="text-sm font-bold text-slate-700">{STATUS_CONFIG[col].label}</span>
                              <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                  {prospects.filter(p => p.status === col).length}
                              </span>
                          </div>
                          <button className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded transition-colors">
                              <IconPlus className="w-4 h-4" />
                          </button>
                      </div>

                      {/* Cards */}
                      <div className="flex-1 space-y-3 overflow-y-auto pr-2 scrollbar-hide">
                          {prospects.filter(p => p.status === col).map(prospect => (
                              <div 
                                key={prospect.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, prospect)}
                                onClick={() => setSelectedProspect(prospect)}
                                className={`bg-white p-4 rounded-xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] cursor-grab active:cursor-grabbing transition-all group relative ${draggedItem?.id === prospect.id ? 'opacity-50 rotate-3 scale-95' : ''}`}
                              >
                                  {/* Tags Row */}
                                  <div className="flex justify-between items-start mb-3">
                                      <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md ${
                                          prospect.priority === 'High' ? 'bg-red-50 text-red-600' :
                                          prospect.priority === 'Medium' ? 'bg-orange-50 text-orange-600' :
                                          'bg-slate-100 text-slate-500'
                                      }`}>
                                          {prospect.priority || 'Low'}
                                      </span>
                                      <button className="text-slate-300 hover:text-slate-500">
                                          <div className="w-6 h-6 rounded-full hover:bg-slate-50 flex items-center justify-center">
                                              <IconMoreHorizontal className="w-4 h-4" />
                                          </div>
                                      </button>
                                  </div>

                                  {/* Content */}
                                  <h4 className="font-bold text-slate-900 text-sm mb-1">{prospect.clinicName}</h4>
                                  <p className="text-xs text-slate-500 line-clamp-2 mb-4">{prospect.contactName} • {prospect.city}</p>

                                  {/* Progress / Lead Score */}
                                  {prospect.leadScore && (
                                      <div className="mb-4">
                                          <div className="flex justify-between items-center mb-1.5">
                                              <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                                                  <IconCheckCircle className="w-3 h-3" /> Score
                                              </span>
                                              <span className="text-[10px] font-bold text-slate-700">{prospect.leadScore}%</span>
                                          </div>
                                          <div className="w-full bg-slate-100 rounded-full h-1.5">
                                              <div 
                                                  className={`h-1.5 rounded-full transition-all duration-500 ${
                                                      prospect.leadScore > 80 ? 'bg-green-500' : 
                                                      prospect.leadScore > 50 ? 'bg-blue-500' : 'bg-slate-400'
                                                  }`} 
                                                  style={{ width: `${prospect.leadScore}%` }}
                                              ></div>
                                          </div>
                                      </div>
                                  )}

                                  {/* Footer */}
                                  <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                      {/* Fake Avatars */}
                                      <div className="flex -space-x-2">
                                          <div className="w-6 h-6 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-indigo-600">JD</div>
                                          <div className="w-6 h-6 rounded-full bg-pink-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-pink-600">SM</div>
                                      </div>
                                      
                                      <div className="flex items-center gap-3 text-slate-400">
                                          <div className="flex items-center gap-1 text-[10px] font-medium bg-slate-50 px-1.5 py-0.5 rounded">
                                              <IconClock className="w-3 h-3" /> {prospect.date.split(' ')[0]} {prospect.date.split(' ')[1]}
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              ))}
          </div>
      </div>
  );

  const OnboardingView = () => (
      <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
              {MOCK_ONBOARDING.map(lead => (
                  <div key={lead.id} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex items-center gap-6">
                      <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                          {lead.clinicName.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="w-64 shrink-0">
                          <div className="font-bold text-slate-900">{lead.clinicName}</div>
                          <div className="text-xs text-slate-500">{lead.doctorName}</div>
                      </div>
                      <div className="flex-1 flex items-center gap-1">
                          {ONBOARDING_STEPS.map((step, idx) => {
                              const currentIndex = ONBOARDING_STEPS.indexOf(lead.status);
                              const isCompleted = idx <= currentIndex;
                              const isCurrent = idx === currentIndex;
                              
                              return (
                                  <div key={step} className="flex-1 flex flex-col items-center relative group">
                                      <div className={`w-full h-1 absolute top-1/2 left-[-50%] z-0 ${idx === 0 ? 'hidden' : ''} ${isCompleted ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>
                                      <div className={`w-3 h-3 rounded-full z-10 relative ${isCurrent ? 'bg-white border-2 border-indigo-600 scale-125' : isCompleted ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>
                                      <div className={`text-[10px] mt-2 font-medium ${isCurrent ? 'text-indigo-700' : 'text-slate-400'}`}>
                                          {step.replace('_', ' ')}
                                      </div>
                                  </div>
                              );
                          })}
                      </div>
                      <div className="shrink-0 text-right">
                          <button onClick={() => alert("Gestion onboarding pour " + lead.clinicName)} className="text-sm bg-white border border-slate-300 px-3 py-1.5 rounded text-slate-700 hover:bg-slate-50">Gérer</button>
                      </div>
                  </div>
              ))}
          </div>
      </div>
  );

  const PartnersView = () => (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {partners.map(partner => (
              <div key={partner.id} className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm hover:border-indigo-300 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                          <IconBriefcase className="w-6 h-6" />
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${partner.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                          {partner.status}
                      </span>
                  </div>
                  <h3 className="font-bold text-lg text-slate-900">{partner.name}</h3>
                  <p className="text-sm text-slate-500 mb-6">{partner.type} • {partner.commissionRate}% Commission</p>
                  
                  <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                      <div>
                          <div className="text-xs text-slate-400 uppercase font-medium">Revenus</div>
                          <div className="text-lg font-bold text-slate-900">{partner.totalRevenue.toLocaleString()} <span className="text-xs font-normal text-slate-400">MAD</span></div>
                      </div>
                      <div>
                          <div className="text-xs text-slate-400 uppercase font-medium">Referrals</div>
                          <div className="text-lg font-bold text-slate-900">{partner.activeReferrals}</div>
                      </div>
                  </div>
              </div>
          ))}
          <button onClick={handleAddPartner} className="border-2 border-dashed border-slate-200 rounded-lg p-6 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-300 hover:text-indigo-600 transition-all">
              <IconPlus className="w-8 h-8 mb-2" />
              <span className="font-medium">Ajouter un Partenaire</span>
          </button>
      </div>
  );

  const CampaignsView = () => (
      <div className="space-y-6">
          <div className="flex justify-end">
              <button onClick={createCampaign} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 shadow-sm">
                  <IconPlus className="w-4 h-4" /> Créer Campagne
              </button>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50">
                      <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Nom</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Statut</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Audience</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Envois</th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Date</th>
                      </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                      {campaigns.map(camp => (
                          <tr key={camp.id} className="hover:bg-slate-50">
                              <td className="px-6 py-4 text-sm font-medium text-slate-900">{camp.name}</td>
                              <td className="px-6 py-4">
                                  <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                                      {camp.type === 'SMS' ? <IconMessage className="w-3 h-3" /> : <IconSend className="w-3 h-3" />}
                                      {camp.type}
                                  </span>
                              </td>
                              <td className="px-6 py-4">
                                  <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
                                      camp.status === 'Sent' ? 'bg-green-50 text-green-700 border-green-200' :
                                      camp.status === 'Scheduled' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                      'bg-slate-100 text-slate-600 border-slate-200'
                                  }`}>
                                      {camp.status}
                                  </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-500">{camp.audience}</td>
                              <td className="px-6 py-4 text-sm font-bold text-slate-900">{camp.sentCount}</td>
                              <td className="px-6 py-4 text-right text-sm text-slate-500">{camp.date}</td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
  );

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Header Tabs */}
      <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">CRM & Growth</h2>
          <div className="flex bg-slate-100 p-1 rounded-md">
              <button 
                onClick={() => setActiveTab('sales')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'sales' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                  Sales Pipeline
              </button>
              <button 
                onClick={() => setActiveTab('onboarding')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'onboarding' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                  Onboarding
              </button>
              <button 
                onClick={() => setActiveTab('partners')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'partners' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                  Partners
              </button>
              <button 
                onClick={() => setActiveTab('campaigns')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'campaigns' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                  Campagnes
              </button>
          </div>
      </div>

      {activeTab === 'sales' && <SalesView />}
      {activeTab === 'onboarding' && <OnboardingView />}
      {activeTab === 'partners' && <PartnersView />}
      {activeTab === 'campaigns' && <CampaignsView />}

      {/* Prospect Detail SlideOver (Only active in Sales tab logic) */}
      <div 
        className={`fixed inset-0 z-50 transition-opacity duration-300 ${selectedProspect ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setSelectedProspect(null)}></div>
          <div className={`absolute inset-y-0 right-0 w-[500px] bg-white shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${selectedProspect ? 'translate-x-0' : 'translate-x-full'}`}>
              {selectedProspect && (
                  <>
                    <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">{selectedProspect.clinicName}</h2>
                            <p className="text-sm text-slate-500">{selectedProspect.contactName} • {selectedProspect.city}</p>
                        </div>
                        <button onClick={() => setSelectedProspect(null)} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-200/50 transition-colors">
                            <IconX className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="p-6 flex-1 overflow-y-auto space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-slate-50 rounded border border-slate-100">
                                <div className="text-xs text-slate-500 uppercase font-medium">Statut</div>
                                <div className={`mt-1 font-semibold ${STATUS_CONFIG[selectedProspect.status].color}`}>{STATUS_CONFIG[selectedProspect.status].label}</div>
                            </div>
                            <div className="p-3 bg-slate-50 rounded border border-slate-100">
                                <div className="text-xs text-slate-500 uppercase font-medium">Score Lead</div>
                                <div className="mt-1 font-semibold text-slate-900">{selectedProspect.leadScore || '-'} / 100</div>
                            </div>
                        </div>
                        {/* Details... */}
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between border-b border-slate-50 pb-2"><span className="text-slate-500">Email</span><span className="font-medium">{selectedProspect.email}</span></div>
                            <div className="flex justify-between border-b border-slate-50 pb-2"><span className="text-slate-500">Source</span><span className="font-medium">{selectedProspect.source}</span></div>
                        </div>
                    </div>
                  </>
              )}
          </div>
      </div>
    </div>
  );
};
