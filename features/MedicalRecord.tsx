
import React, { useState } from 'react';
import { IconSearch, IconPlus, IconPill, IconFileText, IconDownload, IconArrowLeft, IconCalendar, IconImage, IconActivity, IconUserPlus, IconTooth, IconClock } from '../components/Icons';
import { MOCK_PATIENTS, MOCK_DOCUMENTS } from '../constants';
import { Patient } from '../types';
import { Odontogram } from '../components/Odontogram';

type TimelineEvent = {
    id: string;
    date: string; // ISO date
    type: 'Consultation' | 'Ordonnance' | 'Document' | 'Note';
    title: string;
    details: string;
    author: string;
    icon: React.ElementType;
    color: string;
};

// Helper to generate mock timeline for a patient
const generateTimeline = (patient: Patient): TimelineEvent[] => {
    const events: TimelineEvent[] = [
        { 
            id: 'evt-1', 
            date: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(), 
            type: 'Consultation', 
            title: 'Consultation Urgence', 
            details: 'Douleur dent 36. Pulpite irréversible diagnostiquée.', 
            author: 'Dr. Amina',
            icon: IconActivity,
            color: 'bg-blue-100 text-blue-600'
        },
        { 
            id: 'evt-2', 
            date: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(), 
            type: 'Ordonnance', 
            title: 'Prescription Antibiotique', 
            details: 'Amoxicilline 1g, Paracétamol 1g', 
            author: 'Dr. Amina',
            icon: IconPill,
            color: 'bg-purple-100 text-purple-600'
        },
        { 
            id: 'evt-3', 
            date: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString(), 
            type: 'Document', 
            title: 'Radio Panoramique', 
            details: 'Fichier reçu du centre de radiologie.', 
            author: 'Assistant',
            icon: IconImage,
            color: 'bg-orange-100 text-orange-600'
        },
        { 
            id: 'evt-4', 
            date: new Date(new Date().setDate(new Date().getDate() - 45)).toISOString(), 
            type: 'Note', 
            title: 'Note Clinique', 
            details: 'Patient anxieux, prévoir anesthésie renforcée.', 
            author: 'Dr. Amina',
            icon: IconFileText,
            color: 'bg-slate-100 text-slate-600'
        }
    ];
    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const MedicalRecord = () => {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [newNote, setNewNote] = useState('');
  const [activeTab, setActiveTab] = useState<'history' | 'chart'>('history');
  
  // Mock tooth status for the patient
  const [patientToothStatus, setPatientToothStatus] = useState<Record<number, string>>({
      16: 'Caries', 36: 'Treated', 46: 'Missing', 21: 'Crown'
  });

  const filteredPatients = MOCK_PATIENTS.filter(p => 
      p.firstName.toLowerCase().includes(patientSearch.toLowerCase()) || 
      p.lastName.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.phone.includes(patientSearch)
  );

  const handleSelectPatient = (patient: Patient) => {
      setSelectedPatient(patient);
      setTimeline(generateTimeline(patient));
      setActiveTab('history');
  };

  const handleAddNote = () => {
      if (!newNote.trim() || !selectedPatient) return;
      
      const noteEvent: TimelineEvent = {
          id: `note-${Date.now()}`,
          date: new Date().toISOString(),
          type: 'Note',
          title: 'Note Rapide',
          details: newNote,
          author: 'Moi',
          icon: IconFileText,
          color: 'bg-yellow-100 text-yellow-600'
      };
      
      setTimeline([noteEvent, ...timeline]);
      setNewNote('');
  };

  const handleToothClick = (number: number) => {
      // Read-only in this view usually, but let's allow toggle for demo
      const current = patientToothStatus[number];
      const newStatus = current ? (current === 'Caries' ? 'Treated' : undefined) : 'Caries';
      
      const nextMap = { ...patientToothStatus };
      if (newStatus) nextMap[number] = newStatus;
      else delete nextMap[number];
      
      setPatientToothStatus(nextMap);
  };

  if (!selectedPatient) {
      return (
        <div className="space-y-6 font-sans h-full flex flex-col">
            <div>
                <h2 className="text-xl font-semibold text-slate-900">Dossiers Médicaux</h2>
                <p className="text-sm text-slate-500 mt-1">Sélectionnez un patient pour consulter son historique complet.</p>
            </div>

            <div className="relative max-w-lg">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Rechercher par nom, téléphone..." 
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
                    autoFocus
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPatients.map(patient => (
                    <div 
                        key={patient.id} 
                        onClick={() => handleSelectPatient(patient)}
                        className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-md cursor-pointer transition-all flex items-center gap-4 group"
                    >
                        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 font-bold text-lg flex items-center justify-center group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                            {patient.firstName[0]}{patient.lastName[0]}
                        </div>
                        <div>
                            <div className="font-semibold text-slate-900 group-hover:text-blue-700">{patient.firstName} {patient.lastName}</div>
                            <div className="text-xs text-slate-500">{patient.age} ans • {patient.phone}</div>
                            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                <IconCalendar className="w-3 h-3" /> Dernière visite: {patient.lastVisit}
                            </div>
                        </div>
                    </div>
                ))}
                {filteredPatients.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                        <IconUserPlus className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">Aucun patient trouvé.</p>
                    </div>
                )}
            </div>
        </div>
      );
  }

  return (
    <div className="space-y-6 font-sans h-full flex flex-col">
       {/* Header */}
       <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-b border-slate-200 pb-4 bg-white sticky top-0 z-10 pt-2">
           <div className="flex items-center gap-4 flex-1">
               <button onClick={() => setSelectedPatient(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                   <IconArrowLeft className="w-5 h-5" />
               </button>
               <div>
                   <h2 className="text-xl font-bold text-slate-900">{selectedPatient.firstName} {selectedPatient.lastName}</h2>
                   <div className="flex items-center gap-3 text-sm text-slate-500">
                       <span>{selectedPatient.age} ans</span>
                       <span>•</span>
                       <span>{selectedPatient.gender === 'M' ? 'Homme' : 'Femme'}</span>
                       <span>•</span>
                       <span className="font-mono">{selectedPatient.phone}</span>
                   </div>
               </div>
           </div>
           
           {/* View Tabs */}
           <div className="flex bg-slate-100 p-1 rounded-md">
               <button 
                   onClick={() => setActiveTab('history')}
                   className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'history' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
               >
                   <IconClock className="w-4 h-4" /> Historique
               </button>
               <button 
                   onClick={() => setActiveTab('chart')}
                   className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'chart' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
               >
                   <IconTooth className="w-4 h-4" /> Schéma
               </button>
           </div>

           <div className="flex gap-2">
               <button className="px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-50 shadow-sm flex items-center gap-2">
                   <IconFileText className="w-4 h-4" /> Certificat
               </button>
               <button className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 shadow-sm flex items-center gap-2">
                   <IconPlus className="w-4 h-4" /> Nouvelle Consultation
               </button>
           </div>
       </div>

       <div className="flex-1 overflow-hidden flex flex-col md:flex-row gap-6">
           {/* Main Content Area */}
           <div className="flex-1 overflow-y-auto pr-2">
               
               {activeTab === 'history' && (
                   <>
                       <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
                           <h3 className="text-sm font-bold text-slate-700 mb-2">Ajouter une note rapide</h3>
                           <div className="flex gap-2">
                               <input 
                                    type="text" 
                                    value={newNote} 
                                    onChange={(e) => setNewNote(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                                    placeholder="Ex: Patient a appelé pour décaler..."
                                    className="flex-1 border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                               />
                               <button onClick={handleAddNote} className="bg-slate-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-700">Ajouter</button>
                           </div>
                       </div>

                       <div className="space-y-6 relative before:absolute before:inset-0 before:ml-6 before:w-0.5 before:bg-slate-200">
                           {timeline.map((event) => (
                               <div key={event.id} className="relative flex gap-4 group">
                                   <div className={`absolute left-0 mt-1 w-12 h-12 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10 ${event.color}`}>
                                       <event.icon className="w-5 h-5" />
                                   </div>
                                   <div className="ml-16 flex-1 bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                       <div className="flex justify-between items-start mb-2">
                                           <div>
                                               <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">{event.type}</span>
                                               <h4 className="text-base font-bold text-slate-900">{event.title}</h4>
                                           </div>
                                           <div className="text-right">
                                               <div className="text-xs font-medium text-slate-900">{new Date(event.date).toLocaleDateString()}</div>
                                               <div className="text-[10px] text-slate-400">{new Date(event.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                                           </div>
                                       </div>
                                       <p className="text-sm text-slate-600 mb-3">{event.details}</p>
                                       <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                                           <div className="text-xs text-slate-500 font-medium">Par {event.author}</div>
                                           {event.type === 'Document' || event.type === 'Ordonnance' ? (
                                               <button className="text-blue-600 hover:underline text-xs flex items-center gap-1">
                                                   <IconDownload className="w-3 h-3" /> Télécharger
                                               </button>
                                           ) : null}
                                       </div>
                                   </div>
                               </div>
                           ))}
                       </div>
                   </>
               )}

               {activeTab === 'chart' && (
                   <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
                       <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                           <IconTooth className="w-5 h-5 text-blue-500" /> Odontogramme Actuel
                       </h3>
                       <div className="mb-8">
                           <Odontogram statusMap={patientToothStatus} onToothClick={handleToothClick} readOnly={false} />
                       </div>
                       <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-6">
                           <div className="p-4 bg-slate-50 rounded-lg">
                               <h4 className="text-sm font-bold text-slate-700 mb-2">Soins à réaliser</h4>
                               <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
                                   <li>16: Traitement Carie</li>
                                   <li>46: Implant ou Bridge</li>
                               </ul>
                           </div>
                           <div className="p-4 bg-slate-50 rounded-lg">
                               <h4 className="text-sm font-bold text-slate-700 mb-2">Historique récent</h4>
                               <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
                                   <li>36: Traitement effectué (2023)</li>
                                   <li>21: Couronne posée (2022)</li>
                               </ul>
                           </div>
                       </div>
                   </div>
               )}
           </div>

           {/* Sidebar Info */}
           <div className="w-full md:w-80 shrink-0 space-y-4 overflow-y-auto">
               <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                   <h3 className="font-bold text-slate-900 mb-3 text-sm">Informations</h3>
                   <div className="space-y-3 text-sm">
                       <div>
                           <div className="text-slate-500 text-xs">Email</div>
                           <div className="text-slate-900 font-medium truncate">{selectedPatient.email || 'Non renseigné'}</div>
                       </div>
                       <div>
                           <div className="text-slate-500 text-xs">Assurance</div>
                           <div className="text-slate-900 font-medium">{selectedPatient.insuranceType}</div>
                       </div>
                       <div>
                           <div className="text-slate-500 text-xs">Adresse</div>
                           <div className="text-slate-900 font-medium">{selectedPatient.address || 'Casablanca, Maroc'}</div>
                       </div>
                   </div>
               </div>

               <div className="bg-red-50 p-4 rounded-lg border border-red-100 shadow-sm">
                   <h3 className="font-bold text-red-900 mb-3 text-sm flex items-center gap-2">
                       <IconActivity className="w-4 h-4" /> Alertes Médicales
                   </h3>
                   {selectedPatient.medicalHistory && selectedPatient.medicalHistory.length > 0 ? (
                       <div className="flex flex-wrap gap-2">
                           {selectedPatient.medicalHistory.map((h, i) => (
                               <span key={i} className="bg-white text-red-700 px-2 py-1 rounded text-xs font-bold border border-red-100 shadow-sm">
                                   {h}
                               </span>
                           ))}
                       </div>
                   ) : (
                       <p className="text-xs text-red-400 italic">Aucune alerte signalée.</p>
                   )}
               </div>
           </div>
       </div>
    </div>
  );
};
