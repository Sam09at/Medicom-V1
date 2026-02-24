import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPatient } from '../lib/api/patients';
import { useMedicomStore } from '../store';
import type { Patient } from '../types';
import { MOCK_APPOINTMENTS } from '../constants';
import {
  IconCalendar,
  IconPhone,
  IconMessage,
  IconAlertOctagon,
  IconCreditCard,
  IconFolder,
  IconFileText,
  IconTooth,
  IconClock,
  IconEye,
} from '../components/Icons';

const TABS = [
  { id: 'dossier', label: 'Dossier' },
  { id: 'rdv', label: 'Rendez-vous' },
  { id: 'consultations', label: 'Consultations' },
  { id: 'traitements', label: 'Traitements' },
  { id: 'ordonnances', label: 'Ordonnances' },
  { id: 'documents', label: 'Documents' },
  { id: 'factures', label: 'Factures' },
] as const;

const PhasePlaceholder: React.FC<{
  name: string;
  phase: number;
  icon: React.FC<{ className?: string }>;
}> = ({ name, phase, icon: Icon }) => (
  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
    <Icon className="w-10 h-10 mb-3 text-gray-300" />
    <p className="text-sm font-medium">{name}</p>
    <p className="text-xs mt-1">Module disponible en Phase {phase}</p>
  </div>
);

export const PatientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentTenant = useMedicomStore((s) => s.currentTenant);
  const tenantId = currentTenant?.id ?? '';

  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dossier');

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    getPatient(id, tenantId)
      .then((p) => {
        setPatient(p);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message ?? 'Patient introuvable');
        setIsLoading(false);
      });
  }, [id, tenantId]);

  const appointments = MOCK_APPOINTMENTS.filter((a) => a.patientId === id).sort(
    (a, b) => new Date(b.start).getTime() - new Date(a.start).getTime()
  );

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (error || !patient)
    return (
      <div className="text-center py-16">
        <p className="text-red-600 font-medium">{error || 'Patient introuvable'}</p>
        <button
          onClick={() => navigate('/app/patients')}
          className="mt-4 text-blue-600 text-sm hover:underline"
        >
          ← Retour à la liste
        </button>
      </div>
    );

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <button
          onClick={() => navigate('/app/patients')}
          className="hover:text-blue-600 transition-colors"
        >
          Patients
        </button>
        <span>/</span>
        <span className="font-medium text-gray-900">
          {patient.firstName} {patient.lastName}
        </span>
      </div>

      {/* Header Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-3xl font-bold text-blue-600 border-2 border-blue-100">
            {patient.firstName[0]}
            {patient.lastName[0]}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {patient.firstName} {patient.lastName}
              </h1>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  patient.insuranceType === 'CNOPS'
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : patient.insuranceType === 'CNSS'
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : patient.insuranceType === 'Private'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-gray-50 text-gray-600 border-gray-200'
                }`}
              >
                {patient.insuranceType}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {patient.age} ans • {patient.gender === 'M' ? 'Homme' : 'Femme'} •{' '}
              {patient.city || 'Ville non renseignée'}
            </p>
            <div className="flex items-center gap-4 mt-3">
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors">
                <IconMessage className="w-3.5 h-3.5" /> SMS
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors">
                <IconPhone className="w-3.5 h-3.5" /> {patient.phone || 'Pas de téléphone'}
              </button>
            </div>
          </div>
          {/* Quick Stats */}
          <div className="flex gap-6">
            {[
              { label: 'Rendez-vous', value: appointments.length },
              { label: 'Dernière visite', value: patient.lastVisit || '—' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="flex border-b border-gray-200 px-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Dossier Tab */}
          {activeTab === 'dossier' && (
            <div className="grid grid-cols-2 gap-6 animate-in fade-in duration-300">
              <div className="bg-gray-50 rounded-lg p-5 space-y-4">
                <h3 className="text-sm font-bold text-gray-900">Informations Personnelles</h3>
                {[
                  ['Téléphone', patient.phone || '-'],
                  ['Email', patient.email || '-'],
                  ['Date de Naissance', patient.dateOfBirth || '-'],
                  ['Adresse', patient.address || '-'],
                  ['Ville', patient.city || '-'],
                  ['N° Assurance', patient.insuranceNumber || '-'],
                ].map(([l, v]) => (
                  <div key={l as string}>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                      {l}
                    </label>
                    <div className="text-sm text-gray-900 mt-0.5">{v}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-5">
                <div className="bg-red-50 border border-red-100 rounded-lg p-5">
                  <h3 className="text-sm font-bold text-red-800 flex items-center gap-2 mb-3">
                    <IconAlertOctagon className="w-4 h-4" /> Allergies
                  </h3>
                  {(patient.allergies?.length ?? 0) > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {patient.allergies!.map((a) => (
                        <span
                          key={a}
                          className="bg-white text-red-700 text-xs font-medium px-2.5 py-1 rounded border border-red-100"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-red-600/70 italic">Aucune allergie connue.</p>
                  )}
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-5">
                  <h3 className="text-sm font-bold text-amber-800 flex items-center gap-2 mb-3">
                    <IconFileText className="w-4 h-4" /> Pathologies
                  </h3>
                  {(patient.pathologies?.length ?? 0) > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {patient.pathologies!.map((p) => (
                        <span
                          key={p}
                          className="bg-white text-amber-700 text-xs font-medium px-2.5 py-1 rounded border border-amber-100"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-amber-600/70 italic">Aucune pathologie connue.</p>
                  )}
                </div>
                {patient.notes && (
                  <div className="bg-white border border-gray-200 rounded-lg p-5">
                    <h3 className="text-sm font-bold text-gray-900 mb-2">Notes</h3>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{patient.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* RDV Tab */}
          {activeTab === 'rdv' && (
            <div className="space-y-3 animate-in fade-in duration-300">
              {appointments.length > 0 ? (
                appointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex justify-between items-center hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <IconCalendar className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900">{apt.type}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <IconClock className="w-3 h-3" />
                          {new Date(apt.start).toLocaleDateString()} à{' '}
                          {new Date(apt.start).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold border ${apt.status === 'Terminé' ? 'bg-green-50 text-green-700 border-green-100' : apt.status === 'Annulé' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}
                    >
                      {apt.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200 text-sm">
                  Aucun rendez-vous enregistré.
                </div>
              )}
            </div>
          )}

          {activeTab === 'consultations' && (
            <PhasePlaceholder name="Consultations" phase={5} icon={IconEye} />
          )}
          {activeTab === 'traitements' && (
            <PhasePlaceholder name="Traitements" phase={6} icon={IconTooth} />
          )}
          {activeTab === 'ordonnances' && (
            <PhasePlaceholder name="Ordonnances" phase={5} icon={IconFileText} />
          )}
          {activeTab === 'documents' && (
            <PhasePlaceholder name="Documents (GED)" phase={8} icon={IconFolder} />
          )}
          {activeTab === 'factures' && (
            <PhasePlaceholder name="Facturation" phase={7} icon={IconCreditCard} />
          )}
        </div>
      </div>
    </div>
  );
};
