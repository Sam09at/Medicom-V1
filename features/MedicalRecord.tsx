import React, { useState, useEffect } from 'react';
import {
  IconSearch,
  IconPlus,
  IconPill,
  IconFileText,
  IconDownload,
  IconArrowLeft,
  IconClock,
  IconTooth,
  IconActivity,
  IconUserPlus,
} from '../components/Icons';
import { Patient, Consultation, Prescription } from '../types';
import { Odontogram } from '../components/Odontogram';
import { usePatients } from '../hooks/usePatients';
import { getPatientHistory } from '../lib/api/consultations';
import { useMedicomStore } from '../store';

type TimelineEvent = {
  id: string;
  date: string;
  type: 'Consultation' | 'Ordonnance' | 'Document' | 'Note';
  title: string;
  details: string;
  author: string;
  icon: any;
  color: string;
};

export const MedicalRecord = () => {
  const { patients } = usePatients();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [activeTab, setActiveTab] = useState<'history' | 'chart'>('history');
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Filter patients
  const filteredPatients = patients.filter(
    (p) =>
      p.firstName.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.lastName.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.phone.includes(patientSearch)
  );

  const fetchHistory = async (patientId: string) => {
    setIsLoadingHistory(true);
    try {
      const history = await getPatientHistory(patientId);
      const events: TimelineEvent[] = [];

      history.forEach((consult: any) => {
        // Consultation Event
        events.push({
          id: consult.id,
          date: consult.createdAt,
          type: 'Consultation',
          title: consult.status === 'draft' ? 'Consultation (Brouillon)' : 'Consultation',
          details: consult.notes || consult.chiefComplaint || 'Aucune note',
          author: consult.doctorName || 'Médecin',
          icon: IconActivity,
          color: 'bg-blue-100 text-blue-600',
        });

        // Prescription Events associated with consultation
        if (consult.prescriptions && consult.prescriptions.length > 0) {
          consult.prescriptions.forEach((rx: any) => {
            events.push({
              id: rx.id,
              date: rx.issued_at || consult.createdAt,
              type: 'Ordonnance',
              title: 'Prescription',
              details: `${rx.drugs.length} médicaments prescrits`,
              author: consult.doctorName || 'Médecin',
              icon: IconPill,
              color: 'bg-purple-100 text-purple-600',
            });
          });
        }
      });

      setTimeline(events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setPatientSearch('');
    setActiveTab('history');
    fetchHistory(patient.id);
  };

  if (!selectedPatient) {
    return (
      <div className="space-y-8 font-sans h-full flex flex-col pt-4 px-6 sm:px-10 pb-10">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Dossiers Médicaux
          </h2>
          <p className="text-[0.875rem] font-medium text-slate-500 mt-2">
            Recherchez et sélectionnez un patient pour consulter son historique complet.
          </p>
        </div>

        <div className="relative max-w-2xl group animate-in fade-in slide-in-from-bottom-6 duration-300">
          <IconSearch className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Rechercher par nom, téléphone..."
            value={patientSearch}
            onChange={(e) => setPatientSearch(e.target.value)}
            className="w-full pl-14 pr-5 py-4 bg-white border border-slate-100/80 rounded-[7px] text-[0.875rem] font-bold text-slate-900 transition-all outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/20 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] placeholder:font-medium placeholder:text-slate-400"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-300">
          {filteredPatients.map((patient) => (
            <div
              key={patient.id}
              onClick={() => handleSelectPatient(patient)}
              className="bg-white p-5 rounded-3xl border border-slate-100/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:border-blue-100 cursor-pointer transition-all flex items-center gap-5 group"
            >
              <div className="w-14 h-14 rounded-[7px] bg-slate-50 border border-slate-100/80 text-slate-500 font-bold text-lg flex items-center justify-center group-hover:bg-blue-50 group-hover:border-blue-100 group-hover:text-blue-600 transition-colors">
                {patient.firstName[0]}
                {patient.lastName[0]}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="font-bold text-[1rem] text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                  {patient.firstName} {patient.lastName}
                </div>
                <div className="text-[0.75rem] font-medium text-slate-500 truncate mt-0.5">
                  {patient.age} ans • {patient.phone}
                </div>
              </div>
              <div className="w-8 h-8 rounded-[7px] bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                <svg
                  className="w-4 h-4 text-blue-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          ))}
          {filteredPatients.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
              <div className="w-16 h-16 bg-white rounded-[7px] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] flex items-center justify-center mb-4">
                <IconSearch className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-[0.875rem] font-bold text-slate-400">
                Aucun patient ne correspond à votre recherche.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans h-full flex flex-col pt-4 px-6 sm:px-10 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-100/80 bg-slate-50/30 sticky top-0 z-10 -mx-6 sm:-mx-10 px-6 sm:px-10 pt-2">
        <div className="flex items-center gap-5 flex-1">
          <button
            onClick={() => setSelectedPatient(null)}
            className="w-10 h-10 bg-white border border-slate-200 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 text-slate-500 rounded-[7px] flex items-center justify-center transition-all"
          >
            <IconArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {selectedPatient.firstName} {selectedPatient.lastName}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-1.5 align-middle">
              <span className="inline-flex px-2 py-0.5 rounded-[7px] bg-slate-100 text-slate-600 text-[0.75rem] font-bold">
                {selectedPatient.age} ans
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-[0.875rem] font-medium text-slate-500">
                {selectedPatient.gender === 'M' ? 'Homme' : 'Femme'}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-[0.875rem] font-mono text-slate-500">
                {selectedPatient.phone}
              </span>
            </div>
          </div>
        </div>

        <div className="flex bg-slate-100/50 p-1.5 rounded-[7px] border border-slate-200/50 shadow-inner">
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-5 py-2.5 text-[0.875rem] font-bold rounded-[7px] transition-all ${activeTab === 'history' ? 'bg-white text-blue-600 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)]' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
          >
            <IconClock className="w-4 h-4" /> Historique
          </button>
          <button
            onClick={() => setActiveTab('chart')}
            className={`flex items-center gap-2 px-5 py-2.5 text-[0.875rem] font-bold rounded-[7px] transition-all ${activeTab === 'chart' ? 'bg-white text-blue-600 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)]' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
          >
            <IconTooth className="w-4 h-4" /> Schéma Dentaire
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row gap-8 pt-4">
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto pr-2 pb-10">
          {activeTab === 'history' && (
            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-8 before:w-0.5 before:bg-slate-200/60">
              {isLoadingHistory ? (
                <div className="pl-20 py-8 text-[0.875rem] font-medium text-slate-500 flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
                  Chargement de l'historique...
                </div>
              ) : timeline.length === 0 ? (
                <div className="pl-20 py-8 text-[0.875rem] font-medium text-slate-400 italic">
                  Aucun historique disponible.
                </div>
              ) : (
                timeline.map((event) => (
                  <div key={event.id} className="relative flex gap-6 group">
                    <div
                      className={`absolute left-0 w-16 h-16 rounded-[7px] border flex items-center justify-center z-10 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] transition-transform group-hover:scale-110 group-hover:shadow-md ${
                        event.type === 'Consultation'
                          ? 'bg-blue-50 border-blue-100 text-blue-600'
                          : event.type === 'Ordonnance'
                            ? 'bg-purple-50 border-purple-100 text-purple-600'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <event.icon className="w-6 h-6" />
                    </div>
                    <div className="ml-24 flex-1 bg-white p-6 rounded-3xl border border-slate-100/50 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] group-hover:border-blue-100 group-hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-2">
                        <div>
                          <span
                            className={`inline-block px-2.5 py-1 rounded-[7px] text-[0.65rem] font-bold uppercase tracking-widest mb-2 ${
                              event.type === 'Consultation'
                                ? 'bg-blue-50 text-blue-600'
                                : 'bg-purple-50 text-purple-600'
                            }`}
                          >
                            {event.type}
                          </span>
                          <h4 className="text-[1.125rem] font-bold text-slate-900 tracking-tight">
                            {event.title}
                          </h4>
                        </div>
                        <div className="text-left sm:text-right mt-1 sm:mt-0">
                          <div className="inline-flex px-3 py-1.5 rounded-[7px] bg-slate-50 border border-slate-100 text-[0.75rem] font-bold text-slate-500">
                            {new Date(event.date).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </div>
                        </div>
                      </div>
                      <p className="text-[0.875rem] font-medium text-slate-600 mb-6 leading-relaxed bg-slate-50/50 p-4 rounded-[7px] border border-slate-100/50">
                        {event.details}
                      </p>
                      <div className="flex justify-between items-center pt-4 border-t border-slate-100/80">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[0.5rem] font-bold text-slate-500">
                            {event.author
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                          </div>
                          <span className="text-[0.75rem] text-slate-500 font-bold uppercase tracking-widest">
                            Par {event.author}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'chart' && (
            <div className="bg-white rounded-3xl border border-slate-100/80 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <h3 className="text-[1rem] font-bold text-slate-900 mb-8 flex items-center gap-3 tracking-tight">
                <div className="w-10 h-10 rounded-[7px] bg-blue-50 flex items-center justify-center text-blue-600">
                  <IconTooth className="w-5 h-5" />
                </div>
                Odontogramme Actuel
              </h3>
              <div className="mb-0 bg-slate-50/50 p-6 sm:p-10 rounded-[2rem] border border-slate-100/50 flex justify-center overflow-x-auto">
                <Odontogram statusMap={{}} readOnly={true} />
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="w-full lg:w-80 shrink-0 space-y-6 overflow-y-auto pb-10">
          <div className="bg-white p-6 rounded-3xl border border-slate-100/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <h3 className="text-[1rem] font-bold text-slate-900 mb-6 tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 rounded-[7px] bg-slate-50 flex items-center justify-center text-slate-500">
                <IconFileText className="w-5 h-5" />
              </div>
              Informations Générales
            </h3>
            <div className="space-y-5">
              <div className="bg-slate-50/50 p-4 rounded-[7px] border border-slate-100/50">
                <div className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Email
                </div>
                <div className="text-[0.875rem] text-slate-900 font-bold truncate">
                  {selectedPatient.email || 'Non renseigné'}
                </div>
              </div>
              <div className="bg-slate-50/50 p-4 rounded-[7px] border border-slate-100/50">
                <div className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Assurance
                </div>
                <div className="text-[0.875rem] text-slate-900 font-bold">
                  {selectedPatient.insuranceType}
                </div>
              </div>
              {/* Actions placeholder */}
              <div className="pt-2">
                <button className="w-full py-3.5 bg-white border border-slate-200 hover:border-blue-200 text-slate-600 hover:text-blue-600 text-[0.875rem] font-bold rounded-[7px] transition-all shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] flex items-center justify-center gap-2 group">
                  <IconDownload className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
                  Exporter le dossier
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
