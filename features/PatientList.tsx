
import React, { useState } from 'react';
import { Patient } from '../types';
import { IconSearch, IconCalendar, IconPhone, IconMessage, IconFileText, IconAlertOctagon, IconPlus, IconQrCode, IconTrash, IconUserPlus, IconCheck, IconCreditCard, IconFolder, IconX, IconSend, IconMoreHorizontal, IconFilter, IconClock, IconTooth, IconDownload, IconEye } from '../components/Icons';
import { SlideOver } from '../components/SlideOver';
import { MOCK_APPOINTMENTS, MOCK_DOCUMENTS, MOCK_PATIENTS } from '../constants';

interface PatientListProps {
  patients: Patient[];
}

const MOCK_PATIENT_INVOICES = [
    { id: 'F-101', date: '2024-01-24', amount: 450, status: 'Paid', items: 'Consultation' },
    { id: 'F-102', date: '2023-12-15', amount: 1200, status: 'Pending', items: 'Soins Carie' },
    { id: 'F-103', date: '2023-11-20', amount: 300, status: 'Paid', items: 'Contrôle' },
];

export const PatientList: React.FC<PatientListProps> = ({ patients: initialPatients }) => {
  const [patients, setPatients] = useState(initialPatients);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  
  // Create Patient State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newPatient, setNewPatient] = useState({ firstName: '', lastName: '', phone: '', email: '', age: '', gender: 'M', insuranceType: 'None' });

  const filteredPatients = patients.filter(p => 
    p.firstName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.phone.includes(searchQuery)
  );

  const handleCreatePatient = (e: React.FormEvent) => {
      e.preventDefault();
      const patient: Patient = {
          id: `p-${Date.now()}`,
          firstName: newPatient.firstName,
          lastName: newPatient.lastName,
          phone: newPatient.phone,
          email: newPatient.email,
          age: parseInt(newPatient.age) || 0,
          gender: newPatient.gender as 'M' | 'F',
          insuranceType: newPatient.insuranceType as any,
          lastVisit: 'Jamais'
      };
      
      setPatients([patient, ...patients]);
      setIsCreateOpen(false);
      setNewPatient({ firstName: '', lastName: '', phone: '', email: '', age: '', gender: 'M', insuranceType: 'None' });
  };

  const getPatientAppointments = (patientId: string) => {
      return MOCK_APPOINTMENTS.filter(a => a.patientId === patientId).sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());
  };

  const getPatientDocuments = (patientName: string) => {
      // In a real app, match by ID. Here using name match for mock consistency
      return MOCK_DOCUMENTS.filter(d => d.patientName.includes(patientName.split(' ')[1])); 
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header / Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
              <h2 className="text-lg font-bold text-slate-900">Patients</h2>
              <div className="h-6 w-px bg-slate-200"></div>
              <span className="text-sm text-slate-500 font-medium">{patients.length} dossiers</span>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
              <button 
                  onClick={() => setIsCreateOpen(true)}
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm w-full sm:w-auto"
              >
                  <IconUserPlus className="w-4 h-4" /> Nouveau Patient
              </button>
          </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                  type="text" 
                  placeholder="Rechercher par nom, téléphone..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border-none bg-transparent focus:ring-0 placeholder:text-slate-400"
              />
          </div>
          <div className="flex items-center border-l border-slate-100 pl-3 gap-2">
              <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 rounded-md transition-colors">
                  <IconFilter className="w-4 h-4" /> Filtrer
              </button>
          </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex-1 overflow-hidden flex flex-col">
          <div className="overflow-auto flex-1">
              <table className="min-w-full divide-y divide-slate-100 text-left">
                  <thead className="bg-slate-50 sticky top-0 z-10">
                      <tr>
                          <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient</th>
                          <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
                          <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Assurance</th>
                          <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Dernière Visite</th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredPatients.map((patient) => (
                          <tr 
                            key={patient.id} 
                            onClick={() => setSelectedPatient(patient)}
                            className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                          >
                              <td className="px-6 py-3 whitespace-nowrap">
                                  <div className="flex items-center">
                                      <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs border border-slate-200 mr-3">
                                          {patient.firstName[0]}{patient.lastName[0]}
                                      </div>
                                      <div>
                                          <div className="text-sm font-medium text-slate-900">{patient.firstName} {patient.lastName}</div>
                                          <div className="text-xs text-slate-500">{patient.age} ans • {patient.gender}</div>
                                      </div>
                                  </div>
                              </td>
                              <td className="px-6 py-3 whitespace-nowrap">
                                  <div className="text-sm text-slate-600">{patient.phone}</div>
                                  <div className="text-xs text-slate-400">{patient.email}</div>
                              </td>
                              <td className="px-6 py-3 whitespace-nowrap">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                                      patient.insuranceType === 'CNOPS' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                      patient.insuranceType === 'CNSS' ? 'bg-green-50 text-green-700 border-green-100' :
                                      'bg-slate-50 text-slate-600 border-slate-200'
                                  }`}>
                                      {patient.insuranceType}
                                  </span>
                              </td>
                              <td className="px-6 py-3 whitespace-nowrap text-sm text-slate-500">
                                  {patient.lastVisit || '—'}
                              </td>
                              <td className="px-6 py-3 whitespace-nowrap text-right">
                                  <button className="text-slate-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50 transition-colors">
                                      <IconMoreHorizontal className="w-5 h-5" />
                                  </button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
          <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500 flex justify-between items-center">
              <span>Affichage de {filteredPatients.length} patients</span>
              <div className="flex gap-2">
                  <button className="px-2 py-1 bg-white border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50" disabled>Précédent</button>
                  <button className="px-2 py-1 bg-white border border-slate-200 rounded hover:bg-slate-50">Suivant</button>
              </div>
          </div>
      </div>

      {/* Patient Detail SlideOver */}
      <SlideOver
        isOpen={!!selectedPatient}
        onClose={() => setSelectedPatient(null)}
        title={selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : ''}
        subtitle="Dossier Patient"
        width="xl"
      >
        {selectedPatient && (
          <div className="flex flex-col h-full">
            {/* Tabs Header */}
            <div className="flex border-b border-slate-200 px-6">
                {[
                    { id: 'overview', label: 'Général', icon: IconUserPlus },
                    { id: 'history', label: 'Rendez-vous', icon: IconCalendar },
                    { id: 'finance', label: 'Finance', icon: IconCreditCard },
                    { id: 'docs', label: 'Documents', icon: IconFolder },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === tab.id 
                            ? 'border-blue-600 text-blue-600' 
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="p-6 space-y-6 flex-1 overflow-y-auto bg-slate-50/30">
                {/* Content based on Tab */}
                {activeTab === 'overview' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Summary Card */}
                        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-2xl font-bold text-slate-500">
                                    {selectedPatient.firstName[0]}{selectedPatient.lastName[0]}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900">{selectedPatient.firstName} {selectedPatient.lastName}</h3>
                                    <div className="text-sm text-slate-500 mt-1">{selectedPatient.age} ans • {selectedPatient.gender === 'M' ? 'Homme' : 'Femme'}</div>
                                    <div className="flex gap-2 mt-3">
                                        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700">
                                            <IconMessage className="w-3.5 h-3.5" /> SMS
                                        </button>
                                        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded text-xs font-medium hover:bg-slate-50">
                                            <IconPhone className="w-3.5 h-3.5" /> Appeler
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Téléphone</label>
                                    <div className="text-sm font-medium text-slate-900 mt-1">{selectedPatient.phone}</div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Email</label>
                                    <div className="text-sm font-medium text-slate-900 mt-1">{selectedPatient.email || '-'}</div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Assurance</label>
                                    <div className="text-sm font-medium text-slate-900 mt-1">{selectedPatient.insuranceType}</div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Adresse</label>
                                    <div className="text-sm font-medium text-slate-900 mt-1">{selectedPatient.address || 'Non renseignée'}</div>
                                </div>
                            </div>
                        </div>

                        {/* Medical Alerts */}
                        <div className="bg-red-50 border border-red-100 rounded-lg p-5">
                            <h4 className="text-sm font-bold text-red-800 flex items-center gap-2 mb-3">
                                <IconAlertOctagon className="w-4 h-4" /> Alertes Médicales
                            </h4>
                            {selectedPatient.medicalHistory && selectedPatient.medicalHistory.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {selectedPatient.medicalHistory.map((h, i) => (
                                        <span key={i} className="bg-white text-red-700 text-xs font-medium px-2.5 py-1 rounded border border-red-100">{h}</span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-red-600/70 italic">Aucune alerte connue.</p>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-sm font-bold text-slate-900">Historique des Rendez-vous</h4>
                            <button className="text-xs text-blue-600 font-medium hover:underline">+ Ajouter RDV</button>
                        </div>
                        {getPatientAppointments(selectedPatient.id).length > 0 ? (
                            <div className="space-y-3">
                                {getPatientAppointments(selectedPatient.id).map(apt => (
                                    <div key={apt.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                                <IconCalendar className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-900">{apt.type}</div>
                                                <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                    <IconClock className="w-3 h-3" />
                                                    {new Date(apt.start).toLocaleDateString()} à {new Date(apt.start).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                                            apt.status === 'Terminé' ? 'bg-green-50 text-green-700 border-green-100' : 
                                            apt.status === 'Annulé' ? 'bg-red-50 text-red-700 border-red-100' :
                                            'bg-blue-50 text-blue-700 border-blue-100'
                                        }`}>
                                            {apt.status}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-400 bg-white rounded-lg border border-dashed border-slate-200 text-sm">
                                Aucun historique disponible.
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'finance' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-sm font-bold text-slate-900">Historique Financier</h4>
                            <button className="text-xs text-blue-600 font-medium hover:underline">+ Créer Facture</button>
                        </div>
                        <div className="space-y-3">
                            {MOCK_PATIENT_INVOICES.map((inv, idx) => (
                                <div key={idx} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:border-blue-300 transition-colors cursor-pointer">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <IconFileText className="w-4 h-4 text-slate-400" />
                                            <span className="text-sm font-bold text-slate-900">{inv.id}</span>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                            inv.status === 'Paid' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-yellow-50 text-yellow-700 border-yellow-100'
                                        }`}>{inv.status}</span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div className="text-xs text-slate-500">
                                            <div>{inv.date}</div>
                                            <div>{inv.items}</div>
                                        </div>
                                        <div className="text-base font-bold text-slate-900">{inv.amount} MAD</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'docs' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-sm font-bold text-slate-900">Documents (GED)</h4>
                            <button className="text-xs text-blue-600 font-medium hover:underline">+ Ajouter Fichier</button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {getPatientDocuments(selectedPatient.firstName + ' ' + selectedPatient.lastName).length > 0 ? (
                                getPatientDocuments(selectedPatient.firstName + ' ' + selectedPatient.lastName).map(doc => (
                                    <div key={doc.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm group hover:shadow-md transition-all">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded">
                                                <IconFolder className="w-5 h-5" />
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-1 hover:bg-slate-100 rounded text-slate-500"><IconEye className="w-3 h-3" /></button>
                                                <button className="p-1 hover:bg-slate-100 rounded text-slate-500"><IconDownload className="w-3 h-3" /></button>
                                            </div>
                                        </div>
                                        <div className="text-sm font-medium text-slate-900 truncate" title={doc.fileName}>{doc.fileName}</div>
                                        <div className="text-[10px] text-slate-400 mt-1">{doc.date} • {doc.size}</div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-2 text-center py-8 text-slate-400 bg-white rounded-lg border border-dashed border-slate-200 text-sm">
                                    Aucun document trouvé.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
          </div>
        )}
      </SlideOver>

      {/* Create Modal */}
      <SlideOver
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Nouveau Patient"
        subtitle="Création rapide de dossier"
      >
          <form onSubmit={handleCreatePatient} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Prénom</label>
                      <input 
                        type="text" 
                        required
                        className="w-full border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={newPatient.firstName}
                        onChange={e => setNewPatient({...newPatient, firstName: e.target.value})}
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Nom</label>
                      <input 
                        type="text" 
                        required
                        className="w-full border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={newPatient.lastName}
                        onChange={e => setNewPatient({...newPatient, lastName: e.target.value})}
                      />
                  </div>
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
                  <input 
                    type="tel" 
                    className="w-full border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newPatient.phone}
                    onChange={e => setNewPatient({...newPatient, phone: e.target.value})}
                  />
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input 
                    type="email" 
                    className="w-full border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newPatient.email}
                    onChange={e => setNewPatient({...newPatient, email: e.target.value})}
                  />
              </div>
              <div className="pt-4 border-t border-slate-100 flex gap-3">
                  <button type="button" onClick={() => setIsCreateOpen(false)} className="flex-1 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50">Annuler</button>
                  <button type="submit" className="flex-1 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 shadow-sm">Créer</button>
              </div>
          </form>
      </SlideOver>
    </div>
  );
};
