import React, { useState } from 'react';
import {
  IconSearch,
  IconPlus,
  IconTooth,
  IconTrash,
  IconCheck,
  IconCalendar,
} from '../components/Icons';
import { MOCK_PATIENTS, MOCK_SERVICES } from '../constants';
import { TreatmentPlan, ToothStatus, ToothSurface } from '../types';
import { SlideOver } from '../components/SlideOver';
import { Odontogram } from '../components/Odontogram';
import { useTreatments } from '../hooks/useTreatments';

interface PlanPhase {
  id: string;
  name: string;
  procedures: { id: string; name: string; price: number }[];
}

// Mock initial status for demo if no plan selected
const MOCK_INITIAL_STATUS: Record<number, { status: ToothStatus; surfaces: ToothSurface[] }> = {
  16: { status: 'Caries', surfaces: ['Occlusal'] },
  36: { status: 'Treated', surfaces: [] },
  46: { status: 'Missing', surfaces: [] },
};

export const Treatments = () => {
  const [activeTab, setActiveTab] = useState<'list' | 'chart'>('list');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<TreatmentPlan | null>(null);

  // State for new plan creation
  const [newPlanName, setNewPlanName] = useState('');
  const [phases, setPhases] = useState<PlanPhase[]>([
    { id: 'ph-1', name: 'Phase 1: Assainissement', procedures: [] },
  ]);
  const [selectedServiceId, setSelectedServiceId] = useState('');

  // Odontogram State
  const [odontogramState, setOdontogramState] =
    useState<Record<number, { status: ToothStatus; surfaces: ToothSurface[]; notes?: string }>>(
      MOCK_INITIAL_STATUS
    );

  const { plans, addPlan, saveOdontogram, addSession, completeSession } = useTreatments(
    selectedPatientId || undefined
  );

  const handleToothUpdate = (
    number: number,
    data: { status: ToothStatus; surfaces: ToothSurface[]; notes?: string }
  ) => {
    const newState = { ...odontogramState, [number]: data };
    setOdontogramState(newState);
  };

  const addPhase = () => {
    setPhases([
      ...phases,
      {
        id: `ph-${Date.now()}`,
        name: `Phase ${phases.length + 1}: Soins`,
        procedures: [],
      },
    ]);
  };

  const addProcedureToPhase = (phaseId: string) => {
    const service = MOCK_SERVICES.find((s) => s.id === selectedServiceId);
    if (!service) return;

    setPhases(
      phases.map((p) => {
        if (p.id === phaseId) {
          return {
            ...p,
            procedures: [
              ...p.procedures,
              { id: `proc-${Date.now()}`, name: service.name, price: service.price },
            ],
          };
        }
        return p;
      })
    );
    setSelectedServiceId('');
  };

  const removeProcedureFromPhase = (phaseId: string, procId: string) => {
    setPhases(
      phases.map((p) => {
        if (p.id === phaseId) {
          return { ...p, procedures: p.procedures.filter((proc) => proc.id !== procId) };
        }
        return p;
      })
    );
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) return;

    const patient = MOCK_PATIENTS.find((p) => p.id === selectedPatientId);
    if (!patient) return;

    const totalCost = phases.reduce(
      (acc, phase) => acc + phase.procedures.reduce((pAcc, proc) => pAcc + proc.price, 0),
      0
    );

    try {
      const plan = await addPlan({
        title: newPlanName,
        patientId: selectedPatientId,
        doctorId: 'current-user-id', // Context placeholder
        status: 'Active',
        totalAmount: totalCost,
        odontogramSnapshot: odontogramState,
        tenantId: 'current-tenant-id', // Context placeholder
      });

      // Create sessions for each phase if needed, or we can just let user add them manually later.
      // For now, let's create them from the phases.
      for (let i = 0; i < phases.length; i++) {
        const phase = phases[i];
        for (const proc of phase.procedures) {
          await addSession({
            treatmentPlanId: plan.id,
            tenantId: 'current-tenant-id',
            doctorId: 'current-user-id',
            serviceName: proc.name,
            price: proc.price,
            sessionOrder: i,
            status: 'Planned',
          });
        }
      }

      setIsCreateOpen(false);
      setNewPlanName('');
      setPhases([{ id: 'ph-1', name: 'Phase 1: Assainissement', procedures: [] }]);
    } catch (err) {
      console.error('Failed to create plan', err);
      alert('Erreur lors de la création du plan (vérifiez la console)');
    }
  };

  const handleCompleteSession = async (sessionId: string) => {
    try {
      await completeSession(sessionId, 'Completed');
      // If there's a selected plan open, update it locally or re-fetch
      if (selectedPlan) {
        const updatedSessions = selectedPlan.sessions.map((s) =>
          s.id === sessionId ? { ...s, status: 'Completed' } : s
        );
        setSelectedPlan({ ...selectedPlan, sessions: updatedSessions as any });
      }
    } catch (err) {
      console.error('Failed to complete session', err);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Plans de Traitement</h2>
          <p className="text-sm text-slate-500 mt-1">
            Suivez l'avancement clinique et financier des soins longs.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="bg-slate-100 p-1 rounded-[8px] flex text-sm font-medium">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-3 py-1.5 rounded-sm transition-colors ${activeTab === 'list' ? 'bg-white text-slate-900 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Liste
            </button>
            <button
              onClick={() => setActiveTab('chart')}
              className={`px-3 py-1.5 rounded-sm transition-colors ${activeTab === 'chart' ? 'bg-white text-slate-900 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Odontogramme
            </button>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-[8px] text-sm font-medium transition-colors shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]"
          >
            <IconPlus className="w-4 h-4" />
            Nouveau Plan
          </button>
        </div>
      </div>

      {/* Main Content */}
      {activeTab === 'chart' ? (
        <div className="bg-white rounded-[8px] border border-slate-200 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] p-6 sm:p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-slate-800">Visualisation Clinique</h3>
            <select
              className="border-slate-300 rounded-[8px] text-sm p-2"
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
            >
              <option value="">Sélectionner un patient...</option>
              {MOCK_PATIENTS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto pb-4">
            <Odontogram statusMap={odontogramState} onToothUpdate={handleToothUpdate} />
          </div>

          <div className="mt-8 border-t border-slate-100 pt-6">
            <h4 className="text-sm font-bold text-slate-700 mb-3">Légende</h4>
            <div className="flex flex-wrap gap-4 text-xs text-slate-600">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 bg-white border border-slate-300 rounded"></span> Saine
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 bg-red-50 border border-red-500 rounded"></span> Carie
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 bg-blue-50 border border-blue-500 rounded"></span> Soignée
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 bg-yellow-50 border border-yellow-500 rounded"></span>{' '}
                Couronne
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 bg-purple-50 border border-purple-500 rounded"></span>{' '}
                Dévitalisée
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 bg-indigo-50 border border-indigo-500 rounded"></span>{' '}
                Implant
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white p-2 rounded-[8px] border border-slate-200 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] flex items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <IconSearch className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-9 pr-3 py-1.5 border-none rounded-[8px] leading-5 bg-transparent placeholder-gray-400 focus:outline-none focus:ring-0 text-sm"
              />
            </div>
          </div>

          {/* Plan List */}
          <div className="bg-white rounded-[8px] border border-slate-200 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] overflow-hidden">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                    Montant
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {plans.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 text-sm">
                      {selectedPatientId
                        ? 'Aucun plan de traitement pour ce patient.'
                        : 'Sélectionnez un patient ou créez un nouveau plan.'}
                    </td>
                  </tr>
                ) : (
                  plans.map((plan) => (
                    <tr key={plan.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded bg-blue-50 text-blue-600 flex items-center justify-center mr-3">
                            <IconTooth className="w-4 h-4" />
                          </div>
                          <div className="text-sm font-medium text-slate-900">{plan.title}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">{plan.patientName}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            plan.status === 'Active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {plan.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {plan.totalAmount} MAD
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <button
                          onClick={() => setSelectedPlan(plan)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Voir détails
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Plan SlideOver */}
      <SlideOver
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Nouveau Plan de Traitement"
        subtitle="Planifiez une série de soins complexes"
        width="2xl"
      >
        <form onSubmit={handleCreatePlan} className="flex flex-col h-full bg-slate-50">
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Step 1: Patient & Basics */}
            <div className="space-y-4 bg-white p-4 rounded-[8px] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-slate-200">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">
                  1
                </span>
                Informations Générales
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Patient</label>
                  <select
                    required
                    className="w-full border-slate-300 rounded-[8px] text-sm p-2"
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                  >
                    <option value="">Sélectionner...</option>
                    {MOCK_PATIENTS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.firstName} {p.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Titre du plan
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Prothèse complète"
                    className="w-full border-slate-300 rounded-[8px] text-sm p-2"
                    value={newPlanName}
                    onChange={(e) => setNewPlanName(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Visualization */}
            <div className="bg-white p-4 rounded-[8px] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-slate-200">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">
                  2
                </span>
                État Actuel & Planification
              </h4>
              <div className="border border-slate-100 rounded-[8px] p-2 bg-slate-50">
                <Odontogram statusMap={odontogramState} onToothUpdate={handleToothUpdate} />
                <p className="text-xs text-center text-slate-400 mt-2">
                  Cliquez sur une dent pour modifier son statut
                </p>
              </div>
            </div>

            {/* Step 3: Phasing */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">
                    3
                  </span>
                  Séquencement des Soins
                </h4>
                <button
                  type="button"
                  onClick={addPhase}
                  className="text-xs text-blue-600 font-medium hover:underline"
                >
                  + Ajouter une phase
                </button>
              </div>

              {phases.map((phase, idx) => (
                <div
                  key={phase.id}
                  className="bg-white border border-slate-200 rounded-[8px] p-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]"
                >
                  <div className="flex justify-between items-center mb-3">
                    <input
                      className="font-medium text-sm border-none focus:ring-0 p-0 text-slate-900 placeholder-gray-400"
                      value={phase.name}
                      onChange={(e) => {
                        const newPhases = [...phases];
                        newPhases[idx].name = e.target.value;
                        setPhases(newPhases);
                      }}
                    />
                    <span className="text-xs font-bold text-slate-600">
                      {phase.procedures.reduce((sum, p) => sum + p.price, 0)} MAD
                    </span>
                  </div>

                  <div className="space-y-2 mb-3">
                    {phase.procedures.map((proc) => (
                      <div
                        key={proc.id}
                        className="flex justify-between text-sm bg-slate-50 p-2 rounded"
                      >
                        <span>{proc.name}</span>
                        <div className="flex gap-3">
                          <span className="font-mono">{proc.price}</span>
                          <button
                            type="button"
                            onClick={() => removeProcedureFromPhase(phase.id, proc.id)}
                            className="text-red-400"
                          >
                            <IconTrash className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <select
                      className="flex-1 text-xs border-slate-300 rounded"
                      value={selectedServiceId}
                      onChange={(e) => setSelectedServiceId(e.target.value)}
                    >
                      <option value="">Ajouter un acte...</option>
                      {MOCK_SERVICES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.price} MAD)
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => addProcedureToPhase(phase.id)}
                      className="px-3 py-1 bg-blue-50 text-blue-600 text-xs rounded font-medium"
                    >
                      Ajouter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-white border-t border-slate-200 flex justify-between items-center">
            <div>
              <div className="text-xs text-slate-500">Total Estimé</div>
              <div className="text-xl font-bold text-slate-900">
                {phases.reduce(
                  (acc, phase) =>
                    acc + phase.procedures.reduce((pAcc, proc) => pAcc + proc.price, 0),
                  0
                )}{' '}
                MAD
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-[30px] text-sm font-medium"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-[8px] text-sm font-medium hover:bg-blue-700 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]"
              >
                Créer le plan
              </button>
            </div>
          </div>
        </form>
      </SlideOver>
      {/* Plan Detail SlideOver */}
      <SlideOver
        isOpen={!!selectedPlan}
        onClose={() => setSelectedPlan(null)}
        title={selectedPlan?.title || 'Détails du Plan'}
        subtitle="Timeline clinique et financier"
        width="xl"
      >
        {selectedPlan && (
          <div className="flex flex-col h-full bg-slate-50">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Summary Card */}
              <div className="bg-white p-4 rounded-[8px] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-slate-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider font-bold">
                      Patient
                    </div>
                    <div className="text-lg font-semibold text-slate-900">
                      {selectedPlan.patientName || 'Patient'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500 uppercase tracking-wider font-bold">
                      Montant Total
                    </div>
                    <div className="text-lg font-bold text-blue-600">
                      {selectedPlan.totalAmount} MAD
                    </div>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${(selectedPlan.sessions.filter((s) => s.status === 'Completed').length / (selectedPlan.sessions.length || 1)) * 100}%`,
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] mt-1 text-slate-500 font-medium">
                  <span>PROGRESSION CLINIQUE</span>
                  <span>
                    {selectedPlan.sessions.filter((s) => s.status === 'Completed').length} /{' '}
                    {selectedPlan.sessions.length} séances
                  </span>
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-900 px-1">Séquences de traitement</h4>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200"></div>
                  <div className="space-y-6">
                    {selectedPlan.sessions
                      .sort((a, b) => a.sessionOrder - b.sessionOrder)
                      .map((session, idx) => (
                        <div key={session.id} className="relative pl-10">
                          <div
                            className={`absolute left-2.5 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] z-10 ${
                              session.status === 'Completed' ? 'bg-green-500' : 'bg-blue-400'
                            }`}
                          ></div>
                          <div className="bg-white p-4 rounded-[8px] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-slate-200 hover:border-blue-200 transition-colors">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="text-xs font-bold text-slate-400 mb-1">
                                  SÉANCE {idx + 1}
                                </div>
                                <div className="font-semibold text-slate-800">
                                  {session.serviceName}
                                </div>
                                {session.toothNumbers?.length > 0 && (
                                  <div className="text-[10px] text-blue-600 font-bold mt-1 uppercase">
                                    Dents: {session.toothNumbers.join(', ')}
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-bold text-slate-900">
                                  {session.price} MAD
                                </div>
                                <div
                                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded mt-1 inline-block ${
                                    session.status === 'Completed'
                                      ? 'bg-green-50 text-green-600'
                                      : 'bg-blue-50 text-blue-600'
                                  }`}
                                >
                                  {session.status.toUpperCase()}
                                </div>
                              </div>
                            </div>

                            {session.status === 'Planned' && (
                              <div className="mt-4 flex gap-2 pt-3 border-t border-slate-50">
                                <button
                                  onClick={() => handleCompleteSession(session.id)}
                                  className="flex-1 bg-green-50 text-green-600 hover:bg-green-100 py-1.5 rounded-[30px] text-xs font-bold transition-colors flex items-center justify-center gap-1"
                                >
                                  <IconCheck className="w-3 h-3" /> Terminer
                                </button>
                                <button className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 py-1.5 rounded-[30px] text-xs font-bold transition-colors flex items-center justify-center gap-1">
                                  <IconCalendar className="w-3 h-3" /> Planifier
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Odontogram Snapshot */}
              <div className="bg-white p-4 rounded-[8px] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-slate-200">
                <h4 className="text-sm font-bold text-slate-900 mb-4">Schéma du plan</h4>
                <div className="scale-[0.6] origin-top h-[180px]">
                  <Odontogram statusMap={selectedPlan.odontogramSnapshot || {}} readOnly />
                </div>
              </div>
            </div>

            <div className="p-4 bg-white border-t border-slate-200 flex gap-3">
              <button className="flex-1 bg-slate-100 text-slate-600 hover:bg-slate-200 py-2.5 rounded-[8px] text-sm font-bold transition-colors">
                Imprimer Devis
              </button>
              <button
                onClick={() => setSelectedPlan(null)}
                className="flex-1 bg-slate-900 text-white hover:bg-slate-800 py-2.5 rounded-[8px] text-sm font-bold shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] transition-all"
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  );
};
