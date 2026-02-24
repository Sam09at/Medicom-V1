import React, { useState, useEffect } from 'react';
import {
  IconCheck,
  IconActivity,
  IconFileText,
  IconChevronRight,
  IconWand,
  IconTooth,
  IconList,
  IconTrash,
  IconPlus,
  IconDollarSign,
  IconX,
} from '../components/Icons';
import { Patient, Appointment, ToothData, ToothStatus, AppointmentStatus } from '../types';
import { Odontogram } from '../components/Odontogram';
import { MOCK_SERVICES, MOCK_INVENTORY } from '../constants';
import { useConsultationLogic } from '../hooks/useConsultationLogic';
import { PrescriptionForm } from './PrescriptionForm';
import { SegmentedTabs } from '../components/SegmentedTabs';
import { ProcessStepper, ProcessStep } from '../components/ProcessStepper';
import { useMedicomStore } from '../store';
import { updateAppointmentStatus } from '../lib/api/appointments';
import { supabase } from '../lib/supabase';
import { Star } from 'lucide-react';

interface ConsultationProps {
  patient: Patient;
  appointment: Appointment;
  onFinish: () => void;
}

const TABS = [
  { id: 'vitals', label: 'Constantes', icon: IconActivity },
  { id: 'chart', label: 'Schéma', icon: IconTooth },
  { id: 'procedures', label: 'Actes', icon: IconList },
  { id: 'rx', label: 'Ordonnance', icon: IconCheck }, // Placeholder icon if IconPill not available
  { id: 'notes', label: 'Notes', icon: IconFileText },
];

export const Consultation: React.FC<ConsultationProps> = ({ patient, appointment, onFinish }) => {
  const {
    isLoading,
    isSaving,
    lastSaved,
    activeTab,
    setActiveTab,
    vitals,
    setVitals,
    notes,
    setNotes,
    toothStatus,
    setToothStatus,
    selectedProcedures,
    setSelectedProcedures,
    prescriptionDrugs,
    setPrescriptionDrugs,
    finalizeConsultation,
    saveData,
  } = useConsultationLogic({
    appointmentId: appointment.id,
    patientId: patient.id,
  });

  const { currentUser, currentTenant } = useMedicomStore();
  const setDoctorPreferencesStore = useMedicomStore((state) => state.setDoctorPreferences);

  const noteTemplates = currentUser?.preferences?.favorites?.noteTemplates || [];
  const favoriteActs = currentUser?.preferences?.favorites?.acts || [];

  const toggleFavoriteAct = async (actId: string) => {
    if (!currentUser || currentUser.role !== 'doctor' || !currentTenant) return;

    const newFavorites = favoriteActs.includes(actId)
      ? favoriteActs.filter((id: string) => id !== actId)
      : [...favoriteActs, actId];

    const newPrefs = {
      ...currentUser.preferences,
      favorites: {
        ...currentUser.preferences?.favorites,
        acts: newFavorites,
      },
    };

    setDoctorPreferencesStore(newPrefs);

    if (!supabase) return;

    try {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('settings_json')
        .eq('id', currentTenant.id)
        .single();

      if (tenant) {
        const settings = tenant.settings_json || {};
        const doctors = settings.doctors || {};
        doctors[currentUser.id] = newPrefs;

        await supabase
          .from('tenants')
          .update({ settings_json: { ...settings, doctors } })
          .eq('id', currentTenant.id);
      }
    } catch (err) {
      console.error('Failed to update favorite acts', err);
    }
  };

  useEffect(() => {
    if (
      currentUser?.role === 'doctor' &&
      currentTenant &&
      currentUser.preferences?.autoStatusConsultation
    ) {
      if (appointment.status !== AppointmentStatus.IN_PROGRESS) {
        updateAppointmentStatus(
          appointment.id,
          AppointmentStatus.IN_PROGRESS,
          currentTenant.id,
          currentUser.id
        ).catch(console.error);
      }
    }
  }, [appointment.id, appointment.status, currentUser, currentTenant]);

  // Local UI State (not persisted in hook yet or handled locally)
  const [selectedActId, setSelectedActId] = useState('');
  const [selectedTeethForAct, setSelectedTeethForAct] = useState('');
  // const [activeToothTool, setActiveToothTool] = useState('Caries'); // Removed in favor of Odontogram popover
  const [showAiModal, setShowAiModal] = useState(false);

  // Voice Dictation
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleToothUpdate = (number: number, data: ToothData) => {
    setToothStatus({ ...toothStatus, [number]: data });
  };

  // Helper for toolbar clicks to apply status to a tooth when clicked on chart (if we still support that mode)
  // Actually, new Odontogram handles selection and updates via popover.
  // But for quick status application from the toolbar, we might want a different interaction?
  // The new Odontogram takes `onToothUpdate` which is called by the popover.
  // If we want the toolbar to work, we need to adapt.
  // For now, let's just support the popover fully and maybe ignore the toolbar or make the toolbar updates the selected tooth?
  // The existing toolbar was: Select Tool -> Click Tooth -> Apply Status.
  // New Odontogram is: Click Tooth -> Select Status from Popover.
  // We should probably rely on the new Odontogram's popover and remove the external toolbar if it's redundant, or keep it as a preset.

  // Let's keep the toolbar but make it update the current selection if possible, or just remove it if Odontogram is self-contained.
  // The new Odontogram is self-contained with its popover.
  // So I will remove `activeToothTool` and the toolbar UI, and just use `handleToothUpdate`.

  const addProcedure = () => {
    const act = MOCK_SERVICES.find((s) => s.id === selectedActId);
    if (act) {
      setSelectedProcedures([
        ...selectedProcedures,
        {
          id: Math.random().toString(),
          name: act.name,
          price: act.price,
          teeth: selectedTeethForAct,
        },
      ]);
      setSelectedTeethForAct('');
      setSelectedActId('');
    }
  };

  const removeProcedure = (id: string) => {
    setSelectedProcedures(selectedProcedures.filter((p: any) => p.id !== id));
  };

  const generateAiLetter = () => {
    setNotes(
      (prev) =>
        prev +
        `\n\n[Généré par IA]:\nPatient: ${patient.firstName} ${patient.lastName}\nConstantes: TA ${vitals.bpSystolic}/${vitals.bpDiastolic}, T° ${vitals.temp}°C\n\nObservations:\nExamen clinique normal.`
    );
    setShowAiModal(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      setNotes((prev) => prev + '\n[Dictée]: Douleur localisée sur 46.');
      setIsRecording(false);
    } else {
      setIsRecording(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFinish = async () => {
    await finalizeConsultation();

    if (
      currentUser?.role === 'doctor' &&
      currentTenant &&
      currentUser.preferences?.autoRemoveConsultation
    ) {
      if (appointment.status !== AppointmentStatus.COMPLETED) {
        await updateAppointmentStatus(
          appointment.id,
          AppointmentStatus.COMPLETED,
          currentTenant.id,
          currentUser.id
        ).catch(console.error);
      }
    }

    onFinish();
  };

  const totalCost = selectedProcedures.reduce((sum: number, p: any) => sum + p.price, 0);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500">
        Chargement de la consultation...
      </div>
    );
  }

  const processSteps: ProcessStep[] = [
    {
      id: 'arrival',
      title: 'Arrivée & Accueil',
      date: '10:00 AM',
      status: 'completed',
      description: 'Patient enregistré par la réception.',
    },
    {
      id: 'vitals',
      title: 'Constantes',
      date: '10:05 AM',
      status: activeTab === 'vitals' ? 'current' : 'completed',
    },
    {
      id: 'exam',
      title: 'Examen Clinique',
      status:
        activeTab === 'chart' || activeTab === 'procedures'
          ? 'current'
          : activeTab === 'rx' || activeTab === 'notes'
            ? 'completed'
            : 'upcoming',
      description: 'Schéma dentaire et actes.',
    },
    {
      id: 'rx',
      title: 'Prescription & Notes',
      status: activeTab === 'rx' || activeTab === 'notes' ? 'current' : 'upcoming',
    },
    {
      id: 'checkout',
      title: 'Sortie',
      status: 'upcoming',
    },
  ];

  return (
    <div className="flex h-full bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] m-6 rounded-[2.5rem] border border-slate-100/50 relative font-sans overflow-hidden">
      {/* Left Sidebar: Process Stepper */}
      <div className="w-80 border-r border-slate-100/60 bg-white/50 p-8 hidden lg:block overflow-y-auto">
        <div className="mb-10">
          <h2 className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-[0.1em] mb-2">
            Workflow
          </h2>
          <p className="text-[1.25rem] text-slate-900 font-bold tracking-tight">
            {patient.firstName} {patient.lastName}
          </p>
        </div>
        <ProcessStepper steps={processSteps} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white relative">
        {/* AI Modal */}
        {showAiModal && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-50 flex items-center justify-center p-8">
            <div className="bg-white border border-slate-200 shadow-2xl rounded-[7px] max-w-lg w-full p-6 text-center animate-in zoom-in-95 duration-200">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <IconWand className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Assistant Clinique IA</h3>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={generateAiLetter}
                  className="p-3 border border-slate-200 rounded-[7px] hover:border-purple-500 hover:bg-purple-50 text-sm font-medium text-slate-700 transition-colors"
                >
                  Générer compte-rendu
                </button>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="mt-6 text-sm text-slate-400 hover:text-slate-600"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Header Stepper (Now using SegmentedTabs) */}
        <div className="px-8 py-4 border-b border-slate-100/60 flex items-center justify-between glass-header">
          <SegmentedTabs
            tabs={TABS.map((t) => ({ id: t.id, label: t.label, icon: <t.icon /> }))}
            activeTab={activeTab}
            onChange={setActiveTab}
          />

          <div className="flex items-center gap-4">
            {/* Autosave Indicator */}
            <div className="text-xs text-slate-400 font-medium mr-4 flex items-center gap-1.5">
              {isSaving ? (
                <span className="animate-pulse flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> Sauvegarde...
                </span>
              ) : lastSaved ? (
                <span className="hidden sm:inline">
                  Sauvegardé {lastSaved.toLocaleTimeString()}
                </span>
              ) : null}
            </div>

            <div className="text-right mr-6 hidden sm:block">
              <div className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-[0.1em] mb-0.5">
                Total estimé
              </div>
              <div className="text-[1.125rem] font-bold text-slate-900 tracking-tight leading-none">
                {totalCost} MAD
              </div>
            </div>
            <button
              onClick={handleFinish}
              className="btn-primary flex items-center gap-2 py-2 px-5 text-sm"
            >
              <IconCheck className="w-4 h-4" /> Terminer
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          {/* Vitals Step */}
          {activeTab === 'vitals' && (
            <div className="max-w-2xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-300 mt-4">
              <div>
                <h3 className="text-2xl font-bold tracking-tight text-slate-900">
                  Constantes Vitales
                </h3>
                <p className="text-slate-500 text-[1rem] font-medium mt-1">
                  Saisissez les mesures du patient.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                    Tension (Sys/Dia)
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      value={vitals.bpSystolic}
                      onChange={(e) => setVitals({ ...vitals, bpSystolic: e.target.value })}
                      placeholder="120"
                      className="w-full px-5 py-3.5 bg-slate-50 border border-transparent hover:bg-slate-100 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/20 rounded-[7px] text-[0.875rem] font-bold text-slate-900 transition-all outline-none"
                    />
                    <span className="py-3.5 font-bold text-slate-300">/</span>
                    <input
                      type="number"
                      value={vitals.bpDiastolic}
                      onChange={(e) => setVitals({ ...vitals, bpDiastolic: e.target.value })}
                      placeholder="80"
                      className="w-full px-5 py-3.5 bg-slate-50 border border-transparent hover:bg-slate-100 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/20 rounded-[7px] text-[0.875rem] font-bold text-slate-900 transition-all outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                    Poids (kg)
                  </label>
                  <input
                    type="number"
                    value={vitals.weight}
                    onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
                    placeholder="70"
                    className="w-full px-5 py-3.5 bg-slate-50 border border-transparent hover:bg-slate-100 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/20 rounded-[7px] text-[0.875rem] font-bold text-slate-900 transition-all outline-none"
                  />
                </div>
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                    Température (°C)
                  </label>
                  <input
                    type="number"
                    value={vitals.temp}
                    onChange={(e) => setVitals({ ...vitals, temp: e.target.value })}
                    placeholder="37"
                    className="w-full px-5 py-3.5 bg-slate-50 border border-transparent hover:bg-slate-100 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/20 rounded-[7px] text-[0.875rem] font-bold text-slate-900 transition-all outline-none"
                  />
                </div>
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                    Fréq. Cardiaque (bpm)
                  </label>
                  <input
                    type="number"
                    value={vitals.heartRate}
                    onChange={(e) => setVitals({ ...vitals, heartRate: e.target.value })}
                    placeholder="75"
                    className="w-full px-5 py-3.5 bg-slate-50 border border-transparent hover:bg-slate-100 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/20 rounded-[7px] text-[0.875rem] font-bold text-slate-900 transition-all outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-6">
                <button
                  onClick={() => setActiveTab('chart')}
                  className="flex items-center gap-1.5 text-blue-600 font-bold hover:text-blue-700 transition-colors uppercase text-xs tracking-wider"
                >
                  Suivant <IconChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Chart Step */}
          {activeTab === 'chart' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300 mt-4 max-w-5xl mx-auto">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                  <h3 className="text-2xl font-bold tracking-tight text-slate-900">
                    Schéma Dentaire
                  </h3>
                  <p className="text-slate-500 text-[1rem] font-medium mt-1">
                    Cliquez sur les dents pour marquer leur état.
                  </p>
                </div>
              </div>

              <div className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/50 rounded-[2rem] p-6 sm:p-10 overflow-x-auto">
                <Odontogram statusMap={toothStatus} onToothUpdate={handleToothUpdate} />
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setActiveTab('procedures')}
                  className="flex items-center gap-1.5 text-blue-600 font-bold hover:text-blue-700 transition-colors uppercase text-xs tracking-wider"
                >
                  Suivant <IconChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Procedures Step */}
          {activeTab === 'procedures' && (
            <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300 mt-4">
              <div>
                <h3 className="text-2xl font-bold tracking-tight text-slate-900">
                  Actes & Honoraires
                </h3>
                <p className="text-slate-500 text-[1rem] font-medium mt-1">
                  Ajoutez les actes réalisés.
                </p>
              </div>

              {/* Procedure Input */}
              <div className="bg-slate-50/50 p-6 rounded-3xl border border-transparent shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div className="sm:col-span-6">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
                      Acte
                    </label>
                    <select
                      className="w-full px-5 py-3.5 bg-white border border-slate-100/80 rounded-[7px] text-[0.875rem] font-bold text-slate-900 transition-all outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/20 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] appearance-none"
                      value={selectedActId}
                      onChange={(e) => setSelectedActId(e.target.value)}
                    >
                      <option value="">Sélectionner un acte...</option>
                      {MOCK_SERVICES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.price} MAD)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
                      Dents (opt)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 16"
                      className="w-full px-5 py-3.5 bg-white border border-slate-100/80 rounded-[7px] text-[0.875rem] font-bold text-slate-900 transition-all outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/20 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]"
                      value={selectedTeethForAct}
                      onChange={(e) => setSelectedTeethForAct(e.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-3 flex items-end gap-2">
                    <button
                      onClick={() => selectedActId && toggleFavoriteAct(selectedActId)}
                      disabled={!selectedActId}
                      className={`p-3.5 rounded-[7px] transition-all shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] ${favoriteActs.includes(selectedActId) ? 'bg-amber-100/50 text-amber-500 hover:bg-amber-100' : 'bg-white border border-slate-100/80 text-slate-400 hover:bg-slate-50'}`}
                      title="Favori"
                    >
                      <Star
                        className="w-5 h-5"
                        fill={favoriteActs.includes(selectedActId) ? 'currentColor' : 'none'}
                      />
                    </button>
                    <button
                      onClick={addProcedure}
                      disabled={!selectedActId}
                      className="flex-1 btn-primary py-3.5 rounded-[7px] text-[0.875rem]"
                    >
                      Ajouter
                    </button>
                  </div>
                </div>

                {favoriteActs.length > 0 && (
                  <div className="pt-5 border-t border-slate-200/50">
                    <p className="text-[0.65rem] font-bold text-slate-400 mb-3 uppercase tracking-[0.1em]">
                      Actes Favoris
                    </p>
                    <div className="flex flex-wrap gap-2.5">
                      {favoriteActs.map((actId: string) => {
                        const act = MOCK_SERVICES.find((s: any) => s.id === actId);
                        if (!act) return null;
                        return (
                          <button
                            key={act.id}
                            onClick={() => {
                              setSelectedProcedures([
                                ...selectedProcedures,
                                {
                                  id: Math.random().toString(),
                                  name: act.name,
                                  price: act.price,
                                  teeth: '',
                                },
                              ]);
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-50/80 text-amber-600 hover:bg-amber-100 border border-amber-100/60 rounded-[7px] text-[0.75rem] font-bold transition-all shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]"
                          >
                            <Star className="w-3.5 h-3.5" fill="currentColor" /> {act.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white border border-slate-100/50 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <table className="min-w-full">
                  <thead className="bg-slate-50/50 border-b border-slate-100/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-[0.65rem] font-bold text-slate-400 uppercase tracking-[0.1em]">
                        Description
                      </th>
                      <th className="px-6 py-4 text-left text-[0.65rem] font-bold text-slate-400 uppercase tracking-[0.1em]">
                        Détails
                      </th>
                      <th className="px-6 py-4 text-right text-[0.65rem] font-bold text-slate-400 uppercase tracking-[0.1em]">
                        Prix
                      </th>
                      <th className="w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-50">
                    {selectedProcedures.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-6 py-12 text-center text-[0.875rem] text-slate-400 italic font-medium"
                        >
                          Aucun acte ajouté
                        </td>
                      </tr>
                    ) : (
                      selectedProcedures.map((proc, i) => (
                        <tr key={i} className="group hover:bg-slate-50/30 transition-colors">
                          <td className="px-6 py-4 text-[0.875rem] font-bold text-slate-900">
                            {proc.name}
                          </td>
                          <td className="px-6 py-4 text-[0.875rem] font-medium text-slate-500">
                            Dents: {proc.teeth || '-'}
                          </td>
                          <td className="px-6 py-4 text-[0.875rem] font-bold text-slate-900 text-right">
                            {proc.price}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => removeProcedure(proc.id)}
                              className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-[7px] transition-all opacity-0 group-hover:opacity-100"
                            >
                              <IconTrash className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot className="bg-slate-50/30 border-t border-slate-100/80">
                    <tr>
                      <td
                        colSpan={2}
                        className="px-6 py-4 text-[0.875rem] font-bold text-slate-400 uppercase tracking-widest text-right"
                      >
                        Total
                      </td>
                      <td className="px-6 py-4 text-[1.125rem] font-bold text-blue-600 text-right">
                        {totalCost} <span className="text-[0.75rem] text-blue-400">MAD</span>
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setActiveTab('rx')}
                  className="flex items-center gap-1.5 text-blue-600 font-bold hover:text-blue-700 transition-colors uppercase text-xs tracking-wider"
                >
                  Suivant <IconChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Rx Step */}
          {activeTab === 'rx' && (
            <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300 mt-4">
              <PrescriptionForm
                drugs={prescriptionDrugs}
                setDrugs={setPrescriptionDrugs}
                patientName={`${patient.firstName} ${patient.lastName}`}
                doctorName={currentUser?.name || ''}
              />
              <div className="flex justify-end mt-8">
                <button
                  onClick={() => setActiveTab('notes')}
                  className="flex items-center gap-1.5 text-blue-600 font-bold hover:text-blue-700 transition-colors uppercase text-xs tracking-wider"
                >
                  Suivant <IconChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Notes Step */}
          {activeTab === 'notes' && (
            <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300 mt-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-2xl font-bold tracking-tight text-slate-900">
                    Notes & Observations
                  </h3>
                  <p className="text-slate-500 text-[1rem] font-medium mt-1">
                    Détails cliniques et compte-rendu.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={toggleRecording}
                    className={`flex items-center gap-2 px-4 py-2 rounded-[7px] text-sm font-bold transition-all shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] ${
                      isRecording
                        ? 'bg-red-50 text-red-600 border-2 border-red-200 animate-pulse'
                        : 'bg-white border-2 border-slate-100 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-red-600' : 'bg-slate-300'}`}
                    ></div>
                    {isRecording ? `Enregistrement ${formatTime(recordingTime)}` : 'Dictée Vocale'}
                  </button>
                  <button
                    onClick={() => setShowAiModal(true)}
                    className="flex items-center gap-2 bg-purple-50 text-purple-600 hover:text-purple-700 px-4 py-2 rounded-[7px] text-sm font-bold hover:bg-purple-100 transition-colors shadow-none"
                  >
                    <IconWand className="w-4 h-4" /> Assistant IA
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {noteTemplates.length > 0 && (
                  <div>
                    <select
                      className="w-full sm:w-auto px-5 py-3.5 bg-white border border-slate-100/80 rounded-[7px] text-[0.875rem] font-bold text-slate-900 transition-all outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/20 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] appearance-none"
                      onChange={(e) => {
                        const template = noteTemplates.find((t: any) => t.id === e.target.value);
                        if (template) {
                          setNotes(notes ? notes + '\n\n' + template.content : template.content);
                        }
                        e.target.value = ''; // Reset selection
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Insérer un modèle de note...
                      </option>
                      {noteTemplates.map((t: any) => (
                        <option key={t.id} value={t.id}>
                          {t.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <textarea
                  rows={12}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-6 py-5 bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] border border-slate-100/80 hover:border-slate-200 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/20 rounded-3xl text-[0.875rem] font-medium text-slate-700 transition-all outline-none resize-none leading-relaxed"
                  placeholder="Observations cliniques, diagnostic..."
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
