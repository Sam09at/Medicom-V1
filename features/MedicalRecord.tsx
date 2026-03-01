import React, { useState } from 'react';
import {
  IconSearch,
  IconPill,
  IconFileText,
  IconDownload,
  IconArrowLeft,
  IconClock,
  IconTooth,
  IconActivity,
} from '../components/Icons';
import { Patient } from '../types';
import { Odontogram } from '../components/Odontogram';
import { usePatients } from '../hooks/usePatients';
import { getPatientHistory } from '../lib/api/consultations';

type TimelineEvent = {
  id: string;
  date: string;
  type: 'Consultation' | 'Ordonnance' | 'Document' | 'Note';
  title: string;
  details: string;
  author: string;
  icon: any;
  color: string;
  accent: string;
};

const TYPE_STYLE: Record<string, { bg: string; text: string; accent: string }> = {
  Consultation: { bg: 'bg-blue-50', text: 'text-[#136cfb]', accent: '#136cfb' },
  Ordonnance: { bg: 'bg-violet-50', text: 'text-violet-600', accent: '#8b5cf6' },
  Document: { bg: 'bg-slate-50', text: 'text-slate-500', accent: '#94a3b8' },
  Note: { bg: 'bg-amber-50', text: 'text-amber-600', accent: '#f59e0b' },
};

export const MedicalRecord = () => {
  const { patients } = usePatients();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [activeTab, setActiveTab] = useState<'history' | 'chart'>('history');
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

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
        events.push({
          id: consult.id,
          date: consult.createdAt,
          type: 'Consultation',
          title: consult.status === 'draft' ? 'Consultation (Brouillon)' : 'Consultation',
          details: consult.notes || consult.chiefComplaint || 'Aucune note',
          author: consult.doctorName || 'Médecin',
          icon: IconActivity,
          color: 'bg-blue-50 text-[#136cfb]',
          accent: '#136cfb',
        });
        if (consult.prescriptions?.length > 0) {
          consult.prescriptions.forEach((rx: any) => {
            events.push({
              id: rx.id,
              date: rx.issued_at || consult.createdAt,
              type: 'Ordonnance',
              title: 'Prescription',
              details: `${rx.drugs.length} médicaments prescrits`,
              author: consult.doctorName || 'Médecin',
              icon: IconPill,
              color: 'bg-violet-50 text-violet-600',
              accent: '#8b5cf6',
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

  // ── Patient Picker ─────────────────────────────────────────────────────
  if (!selectedPatient) {
    return (
      <div className="space-y-6 font-sans animate-in fade-in duration-150 pb-10">
        {/* Header */}
        <div>
          <h2 className="text-[22px] font-semibold tracking-tight text-slate-900">
            Dossiers Médicaux
          </h2>
          <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Sélectionnez un patient pour consulter son historique
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-xl">
          <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, téléphone..."
            value={patientSearch}
            onChange={(e) => setPatientSearch(e.target.value)}
            className="input pl-11 w-full"
            autoFocus
          />
        </div>

        {/* Patient grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filteredPatients.map((patient) => (
            <div
              key={patient.id}
              onClick={() => handleSelectPatient(patient)}
              className="card p-4 flex items-center gap-4 cursor-pointer hover:border-[#136cfb]/30 hover:bg-blue-50/20 transition-all group"
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-blue-50 text-[#136cfb] flex items-center justify-center text-[13px] font-bold shrink-0">
                {patient.firstName[0]}
                {patient.lastName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13.5px] font-semibold text-slate-900 truncate group-hover:text-[#136cfb] transition-colors">
                  {patient.firstName} {patient.lastName}
                </div>
                <div className="text-[11.5px] font-medium text-slate-400 mt-0.5 truncate">
                  {patient.age} ans · {patient.phone}
                </div>
              </div>
              <svg
                className="w-4 h-4 text-slate-300 group-hover:text-[#136cfb] transition-colors shrink-0 -translate-x-1 group-hover:translate-x-0 duration-200"
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
          ))}

          {filteredPatients.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 card border-dashed">
              <IconSearch className="w-6 h-6 text-slate-300 mb-3" />
              <p className="text-[13px] font-semibold text-slate-400">Aucun patient trouvé</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Patient Detail ─────────────────────────────────────────────────────
  return (
    <div className="space-y-6 font-sans animate-in fade-in duration-150 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedPatient(null)}
            className="w-9 h-9 rounded-[20px] border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-all"
          >
            <IconArrowLeft className="w-4 h-4" />
          </button>
          {/* Patient avatar + info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-[#136cfb] flex items-center justify-center text-[13px] font-bold shrink-0">
              {selectedPatient.firstName[0]}
              {selectedPatient.lastName[0]}
            </div>
            <div>
              <h2 className="text-[18px] font-semibold tracking-tight text-slate-900 leading-tight">
                {selectedPatient.firstName} {selectedPatient.lastName}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-[30px]">
                  {selectedPatient.age} ans
                </span>
                <span className="text-slate-300 text-[11px]">·</span>
                <span className="text-[12px] font-medium text-slate-400">
                  {selectedPatient.gender === 'M' ? 'Homme' : 'Femme'}
                </span>
                <span className="text-slate-300 text-[11px]">·</span>
                <span className="text-[12px] font-medium text-slate-400 font-mono">
                  {selectedPatient.phone}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center bg-slate-100/60 rounded-[30px] p-1 gap-1">
          {[
            { id: 'history', label: 'Historique', icon: IconClock },
            { id: 'chart', label: 'Odontogramme', icon: IconTooth },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-[30px] text-[12px] font-semibold transition-all ${
                activeTab === id
                  ? 'bg-white text-[#136cfb] '
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          {activeTab === 'history' && (
            <div>
              {isLoadingHistory ? (
                <div className="flex items-center gap-3 py-10 text-[13px] font-semibold text-slate-400">
                  <div className="w-4 h-4 border-2 border-slate-200 border-t-[#136cfb] rounded-full animate-spin" />
                  Chargement de l'historique...
                </div>
              ) : timeline.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 card border-dashed">
                  <IconClock className="w-6 h-6 text-slate-300 mb-3" />
                  <p className="text-[13px] font-semibold text-slate-400">
                    Aucun historique disponible
                  </p>
                </div>
              ) : (
                <div>
                  {timeline.map((event, i) => {
                    const ts = TYPE_STYLE[event.type] ?? TYPE_STYLE.Note;
                    const isLast = i === timeline.length - 1;
                    return (
                      <div
                        key={event.id}
                        className={`flex gap-4 py-4 ${!isLast ? 'border-b border-slate-100' : ''}`}
                      >
                        {/* Icon */}
                        <div
                          className={`w-8 h-8 rounded-[20px] flex items-center justify-center shrink-0 mt-0.5 ${ts.bg} ${ts.text}`}
                        >
                          <event.icon className="w-4 h-4" />
                        </div>
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-1">
                            <div>
                              <span
                                className={`text-[10px] font-bold uppercase tracking-widest ${ts.text}`}
                              >
                                {event.type}
                              </span>
                              <h4 className="text-[14px] font-semibold text-slate-900 leading-tight mt-0.5">
                                {event.title}
                              </h4>
                            </div>
                            <span className="text-[11px] font-semibold text-slate-400 shrink-0 mt-0.5">
                              {new Date(event.date).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                          <p className="text-[12.5px] font-medium text-slate-500 leading-relaxed bg-slate-50 px-3 py-2 rounded-[6px] mt-2">
                            {event.details}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-500">
                              {event.author
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </div>
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                              Par {event.author}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'chart' && (
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-[20px] bg-blue-50 flex items-center justify-center text-[#136cfb]">
                  <IconTooth className="w-4 h-4" />
                </div>
                <h3 className="text-[15px] font-semibold text-slate-900 tracking-tight">
                  Odontogramme Actuel
                </h3>
              </div>
              <div className="bg-slate-50/50 p-6 rounded-[20px] border border-slate-100 flex justify-center overflow-x-auto">
                <Odontogram statusMap={{}} readOnly={true} />
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-72 shrink-0 space-y-4">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-[6px] bg-slate-50 flex items-center justify-center text-slate-500">
                <IconFileText className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-[13px] font-semibold text-slate-900">Informations Générales</h3>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Email', value: selectedPatient.email || 'Non renseigné' },
                { label: 'Assurance', value: selectedPatient.insuranceType },
                { label: 'Téléphone', value: selectedPatient.phone },
              ].map(({ label, value }) => (
                <div key={label} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    {label}
                  </div>
                  <div className="text-[13px] font-semibold text-slate-900 truncate">{value}</div>
                </div>
              ))}
              <button className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 rounded-[30px] border border-slate-200 text-[12px] font-semibold text-slate-600 hover:border-[#136cfb] hover:text-[#136cfb] transition-all">
                <IconDownload className="w-3.5 h-3.5" /> Exporter le dossier
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
