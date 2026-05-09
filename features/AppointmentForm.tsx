import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePatients } from '../hooks/usePatients';
import { useMedicomStore } from '../store';
import { AppointmentType, AppointmentStatus, Appointment } from '../types';
import { supabase } from '../lib/supabase';
import type { Patient } from '../types';
import { IconCalendar, IconClock, IconTrash } from '../components/Icons';

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  patientId:  z.string().min(1, 'Patient requis'),
  type:       z.nativeEnum(AppointmentType),
  date:       z.string().min(1, 'Date requise'),
  startTime:  z.string().min(1, 'Heure requise'),
  duration:   z.number().min(5),
  notes:      z.string().optional(),
  status:     z.nativeEnum(AppointmentStatus),
});
type FormData = z.infer<typeof schema>;

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<AppointmentType, { label: string; color: string; bg: string; dot: string }> = {
  [AppointmentType.CONSULTATION]: { label: 'Consultation', color: 'text-indigo-700',  bg: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100',  dot: 'bg-indigo-500' },
  [AppointmentType.TREATMENT]:    { label: 'Traitement',   color: 'text-purple-700',  bg: 'bg-purple-50 border-purple-200 hover:bg-purple-100',  dot: 'bg-purple-500' },
  [AppointmentType.CONTROL]:      { label: 'Contrôle',     color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100', dot: 'bg-emerald-500' },
  [AppointmentType.URGENCY]:      { label: 'Urgence',      color: 'text-rose-700',    bg: 'bg-rose-50 border-rose-200 hover:bg-rose-100',    dot: 'bg-rose-500' },
  [AppointmentType.BREAK]:        { label: 'Pause',        color: 'text-slate-600',   bg: 'bg-slate-50 border-slate-200 hover:bg-slate-100',   dot: 'bg-slate-400' },
};

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; bg: string; text: string }> = {
  [AppointmentStatus.PENDING]:     { label: 'En attente',       bg: 'bg-amber-50 border-amber-200',    text: 'text-amber-700' },
  [AppointmentStatus.CONFIRMED]:   { label: 'Confirmé',         bg: 'bg-blue-50 border-blue-200',      text: 'text-blue-700' },
  [AppointmentStatus.ARRIVED]:     { label: "En salle d'att.",  bg: 'bg-teal-50 border-teal-200',      text: 'text-teal-700' },
  [AppointmentStatus.IN_PROGRESS]: { label: 'En consultation',  bg: 'bg-indigo-50 border-indigo-200',  text: 'text-indigo-700' },
  [AppointmentStatus.COMPLETED]:   { label: 'Terminé',          bg: 'bg-green-50 border-green-200',    text: 'text-green-700' },
  [AppointmentStatus.CANCELLED]:   { label: 'Annulé',           bg: 'bg-red-50 border-red-200',        text: 'text-red-700' },
  [AppointmentStatus.RESCHEDULED]: { label: 'Reporté',          bg: 'bg-orange-50 border-orange-200',  text: 'text-orange-700' },
  [AppointmentStatus.NOSHOW]:      { label: 'Absent',           bg: 'bg-slate-100 border-slate-200',   text: 'text-slate-600' },
};

const CREATE_STATUSES = [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED];
const ALL_STATUSES    = Object.values(AppointmentStatus);

// ─── Field label ──────────────────────────────────────────────────────────────

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
    {children}
  </label>
);

// ─── Field input base style ───────────────────────────────────────────────────

const inputCls = (error?: boolean) =>
  `w-full px-3 py-2.5 border rounded-[12px] text-[13px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow ${
    error ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-white'
  }`;

// ─── Patient combobox ─────────────────────────────────────────────────────────

interface PatientComboboxProps {
  value: string;
  onChange: (id: string, name: string) => void;
  error?: string;
}

const PatientCombobox: React.FC<PatientComboboxProps> = ({ value, onChange, error }) => {
  const { patients, setSearch, create } = usePatients(50);
  const [inputVal, setInputVal]     = useState('');
  const [open, setOpen]             = useState(false);
  const [selectedName, setSelectedName] = useState('');
  const [creatingNew, setCreatingNew]   = useState(false);
  const [newFirst, setNewFirst] = useState('');
  const [newLast,  setNewLast]  = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [creating, setCreating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setCreatingNew(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleInput = (v: string) => {
    setInputVal(v);
    setSearch(v);
    setOpen(true);
    if (value) { onChange('', ''); setSelectedName(''); }
  };

  const selectPatient = (p: Patient) => {
    const name = `${p.firstName} ${p.lastName}`;
    onChange(p.id, name);
    setSelectedName(name);
    setInputVal('');
    setOpen(false);
    setCreatingNew(false);
  };

  const handleCreateNew = async () => {
    if (!newFirst.trim() || !newLast.trim() || !newPhone.trim()) return;
    setCreating(true);
    const created = await create({ firstName: newFirst.trim(), lastName: newLast.trim(), phone: newPhone.trim(), gender: 'M' });
    setCreating(false);
    if (created) {
      selectPatient(created);
      setNewFirst(''); setNewLast(''); setNewPhone('');
      setCreatingNew(false);
    }
  };

  const filtered = patients
    .filter(p => {
      const q = inputVal.toLowerCase();
      return `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) || p.phone?.includes(q);
    })
    .slice(0, 8);

  return (
    <div ref={containerRef} className="relative">
      {selectedName && !open ? (
        <div
          className="flex items-center justify-between px-3 py-2.5 border border-blue-200 rounded-[12px] bg-blue-50 cursor-pointer group"
          onClick={() => { setOpen(true); setSelectedName(''); onChange('', ''); inputRef.current?.focus(); }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
              {selectedName.charAt(0)}
            </div>
            <span className="text-[13px] font-semibold text-slate-800">{selectedName}</span>
          </div>
          <span className="text-[11px] text-slate-400 group-hover:text-rose-400 transition-colors">✕ Changer</span>
        </div>
      ) : (
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            className={`${inputCls(!!error)} pl-9`}
            placeholder="Rechercher par nom ou téléphone…"
            value={inputVal}
            onFocus={() => { setOpen(true); setSearch(inputVal); }}
            onChange={e => handleInput(e.target.value)}
          />
        </div>
      )}

      {open && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-[16px] shadow-xl overflow-hidden">
          {!creatingNew ? (
            <>
              <div className="max-h-48 overflow-y-auto">
                {filtered.length === 0 && (
                  <div className="px-4 py-3 text-[12px] text-slate-400 text-center">Aucun patient trouvé</div>
                )}
                {filtered.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => selectPatient(p)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold flex items-center justify-center shrink-0">
                      {p.firstName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-slate-800">{p.firstName} {p.lastName}</p>
                      {p.phone && <p className="text-[11px] text-slate-400">{p.phone}</p>}
                    </div>
                  </button>
                ))}
              </div>
              <div className="border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreatingNew(true)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Créer un nouveau patient{inputVal ? ` « ${inputVal} »` : ''}
                </button>
              </div>
            </>
          ) : (
            <div className="p-4 space-y-3">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Nouveau patient</p>
              <div className="grid grid-cols-2 gap-2">
                <input autoFocus type="text" placeholder="Prénom *" value={newFirst} onChange={e => setNewFirst(e.target.value)}
                  className="px-3 py-2 text-[13px] border border-slate-200 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="text" placeholder="Nom *" value={newLast} onChange={e => setNewLast(e.target.value)}
                  className="px-3 py-2 text-[13px] border border-slate-200 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <input type="tel" placeholder="Téléphone *" value={newPhone} onChange={e => setNewPhone(e.target.value)}
                className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={creating || !newFirst.trim() || !newLast.trim() || !newPhone.trim()}
                  onClick={handleCreateNew}
                  className="flex-1 py-2 bg-blue-600 text-white text-[13px] font-semibold rounded-[10px] hover:bg-blue-700 disabled:opacity-40 transition-colors"
                >
                  {creating ? 'Création…' : 'Créer et sélectionner'}
                </button>
                <button type="button" onClick={() => setCreatingNew(false)}
                  className="px-3 py-2 border border-slate-200 text-slate-500 text-[13px] rounded-[10px] hover:bg-slate-50">
                  Retour
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {error && <p className="text-[11px] font-semibold text-rose-500 mt-1.5">{error}</p>}
    </div>
  );
};

// ─── Conflict banner ──────────────────────────────────────────────────────────

const ConflictBanner: React.FC<{ conflict: boolean; checking: boolean }> = ({ conflict, checking }) => {
  if (checking) return (
    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-[10px] text-[12px] text-slate-500 border border-slate-100">
      <span className="w-3 h-3 border border-slate-400 border-t-transparent rounded-full animate-spin shrink-0" />
      Vérification des conflits…
    </div>
  );
  if (!conflict) return null;
  return (
    <div className="flex items-center gap-2 px-3 py-2.5 bg-rose-50 rounded-[12px] border border-rose-200 text-[13px] text-rose-700 font-semibold">
      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
      </svg>
      Conflit détecté — ce créneau est déjà occupé.
    </div>
  );
};

// ─── Main form ────────────────────────────────────────────────────────────────

interface AppointmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<Appointment>;
  onSubmit: (data: any) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  selectedDate?: Date;
}

export const AppointmentForm: React.FC<AppointmentFormProps> = ({
  isOpen,
  onClose,
  initialData,
  onSubmit,
  onDelete,
  selectedDate,
}) => {
  const currentUser    = useMedicomStore((s) => s.currentUser);
  const defaultDuration = currentUser?.preferences?.defaultSlotDuration ?? 30;
  const isEditing      = !!initialData?.id;

  const [selectedPatientName, setSelectedPatientName] = useState('');
  const [conflictDetected, setConflictDetected]       = useState(false);
  const [checkingConflict, setCheckingConflict]       = useState(false);
  const [deleting, setDeleting]                       = useState(false);
  const conflictTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type:     AppointmentType.CONSULTATION,
      duration: defaultDuration,
      status:   AppointmentStatus.PENDING,
      notes:    '',
    },
  });

  const watchedDate      = watch('date');
  const watchedTime      = watch('startTime');
  const watchedDuration  = watch('duration');
  const watchedType      = watch('type');
  const watchedStatus    = watch('status');
  const watchedPatientId = watch('patientId');

  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Prevent body scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else        document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Reset form when opened
  useEffect(() => {
    if (!isOpen) return;
    setConflictDetected(false);
    if (initialData) {
      const startDate = initialData.start ? new Date(initialData.start) : new Date();
      setSelectedPatientName(initialData.patientName ?? '');
      reset({
        patientId: initialData.patientId ?? '',
        type:      initialData.type ?? AppointmentType.CONSULTATION,
        date:      startDate.toISOString().split('T')[0],
        startTime: startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        duration:  initialData.duration ?? defaultDuration,
        notes:     initialData.notes ?? '',
        status:    initialData.status ?? AppointmentStatus.PENDING,
      });
    } else {
      setSelectedPatientName('');
      const base = selectedDate ?? new Date();
      reset({
        patientId: '',
        type:      AppointmentType.CONSULTATION,
        date:      base.toISOString().split('T')[0],
        startTime: base.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        duration:  defaultDuration,
        status:    AppointmentStatus.PENDING,
        notes:     '',
      });
    }
  }, [isOpen, initialData, selectedDate, reset, defaultDuration]);

  // Conflict check (debounced 600 ms)
  const runConflictCheck = useCallback(() => {
    if (!watchedDate || !watchedTime || !watchedDuration) return;
    if (conflictTimer.current) clearTimeout(conflictTimer.current);
    conflictTimer.current = setTimeout(async () => {
      setCheckingConflict(true);
      try {
        const start = new Date(`${watchedDate}T${watchedTime}`);
        if (isNaN(start.getTime())) return;
        const end = new Date(start.getTime() + watchedDuration * 60_000);
        let conflict = false;
        if (supabase) {
          const { data: overlapping } = await supabase
            .from('appointments')
            .select('id')
            .neq('status', 'cancelled')
            .neq('status', 'rescheduled')
            .lt('start_time', end.toISOString())
            .gt('end_time', start.toISOString())
            .neq('id', initialData?.id ?? '');
          conflict = (overlapping?.length ?? 0) > 0;
        }
        setConflictDetected(conflict);
      } finally {
        setCheckingConflict(false);
      }
    }, 600);
  }, [watchedDate, watchedTime, watchedDuration, initialData?.id]);

  useEffect(() => { runConflictCheck(); }, [runConflictCheck]);

  const handleFormSubmit = async (data: FormData) => {
    const start = new Date(`${data.date}T${data.startTime}`);
    await onSubmit({ ...data, start });
    onClose();
  };

  const handleDelete = async () => {
    if (!initialData?.id || !onDelete) return;
    if (!confirm('Supprimer ce rendez-vous ? Cette action est irréversible.')) return;
    setDeleting(true);
    await onDelete(initialData.id);
    setDeleting(false);
    onClose();
  };

  const availableStatuses = isEditing ? ALL_STATUSES : CREATE_STATUSES;

  if (!isOpen) return null;

  return (
    <>
      {/* Keyframe injection */}
      <style>{`
        @keyframes aptFormIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        {/* Panel */}
        <div
          className="bg-white rounded-[24px] shadow-2xl w-full max-w-[520px] flex flex-col"
          style={{
            maxHeight: 'min(720px, 92vh)',
            animation: 'aptFormIn 0.22s cubic-bezier(0.34,1.4,0.64,1)',
          }}
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 shrink-0 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[12px] bg-blue-50 flex items-center justify-center shrink-0">
                <IconCalendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-slate-900 tracking-tight leading-none">
                  {isEditing ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}
                </h3>
                <p className="text-[12px] font-medium text-slate-400 mt-1">
                  {isEditing && initialData?.patientName
                    ? initialData.patientName
                    : 'Planifier une consultation ou un traitement'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors shrink-0"
            >
              <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* ── Scrollable body ── */}
          <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

              {/* Patient */}
              <div>
                <Label>Patient</Label>
                <input type="hidden" {...register('patientId')} />
                <PatientCombobox
                  value={watchedPatientId}
                  onChange={(id, name) => {
                    setValue('patientId', id, { shouldValidate: true });
                    setSelectedPatientName(name);
                  }}
                  error={errors.patientId?.message}
                />
              </div>

              {/* Type */}
              <div>
                <Label>Type de rendez-vous</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.entries(TYPE_CONFIG) as [AppointmentType, typeof TYPE_CONFIG[AppointmentType]][]).map(([type, cfg]) => {
                    const isActive = watchedType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setValue('type', type)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-[12px] border text-[12px] font-semibold transition-all ${
                          isActive
                            ? `${cfg.bg} ${cfg.color} ring-2 ring-offset-1 ring-current`
                            : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full shrink-0 ${isActive ? cfg.dot : 'bg-slate-300'}`} />
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Date</Label>
                  <input type="date" {...register('date')} className={inputCls(!!errors.date)} />
                  {errors.date && <p className="text-[11px] text-rose-500 mt-1 font-semibold">{errors.date.message}</p>}
                </div>
                <div>
                  <Label>
                    <span className="flex items-center gap-1">
                      <IconClock className="w-3 h-3" /> Heure
                    </span>
                  </Label>
                  <input type="time" {...register('startTime')} className={inputCls(!!errors.startTime)} />
                  {errors.startTime && <p className="text-[11px] text-rose-500 mt-1 font-semibold">{errors.startTime.message}</p>}
                </div>
              </div>

              {/* Conflict */}
              <ConflictBanner conflict={conflictDetected} checking={checkingConflict} />

              {/* Duration */}
              <div>
                <Label>Durée</Label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[15, 30, 45, 60].map(min => (
                    <button
                      key={min}
                      type="button"
                      onClick={() => setValue('duration', min)}
                      className={`py-2 rounded-[12px] text-[12px] font-bold border transition-all ${
                        watchedDuration === min
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {min} min
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min={5}
                  step={5}
                  {...register('duration', { valueAsNumber: true })}
                  className={inputCls()}
                  placeholder="Durée personnalisée (min)"
                />
              </div>

              {/* Status */}
              <div>
                <Label>Statut</Label>
                <div className="flex flex-wrap gap-2">
                  {availableStatuses.map(st => {
                    const cfg      = STATUS_CONFIG[st];
                    const isActive = watchedStatus === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setValue('status', st)}
                        className={`px-3 py-1.5 rounded-[30px] text-[11px] font-bold border transition-all ${
                          isActive
                            ? `${cfg.bg} ${cfg.text} ring-2 ring-offset-1 ring-current`
                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label>
                  Notes{' '}
                  <span className="normal-case font-normal text-slate-300">(optionnel)</span>
                </Label>
                <textarea
                  {...register('notes')}
                  rows={3}
                  className={`${inputCls()} resize-none leading-relaxed`}
                  placeholder="Motif, instructions particulières, symptômes…"
                />
              </div>

            </div>

            {/* ── Footer ── */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 shrink-0">
              {/* Delete (edit only) */}
              {isEditing && onDelete ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-1.5 px-3 py-2 text-rose-500 hover:bg-rose-50 rounded-[12px] transition-colors text-[12px] font-semibold disabled:opacity-50"
                >
                  <IconTrash className="w-4 h-4" />
                  {deleting ? 'Suppression…' : 'Supprimer'}
                </button>
              ) : <div />}

              {/* Cancel + Submit */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-10 px-4 text-[13px] font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-[30px] transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 px-5 text-[13px] font-semibold bg-blue-600 text-white hover:bg-blue-700 rounded-[30px] transition-all disabled:opacity-50 min-w-[120px]"
                >
                  {isSubmitting
                    ? 'Enregistrement…'
                    : isEditing ? 'Mettre à jour' : 'Créer le RDV'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
