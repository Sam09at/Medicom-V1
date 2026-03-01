import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SlideOver } from '../components/SlideOver';
import { usePatients } from '../hooks/usePatients';
import { useMedicomStore } from '../store';
import { AppointmentType, AppointmentStatus, Appointment } from '../types';
import { IconCalendar, IconUsers, IconClock, IconCheck, IconX } from '../components/Icons';

const appointmentSchema = z.object({
  patientId: z.string().min(1, 'Patient requis'),
  type: z.nativeEnum(AppointmentType),
  date: z.string().min(1, 'Date requise'),
  startTime: z.string().min(1, 'Heure requise'),
  duration: z.number().min(15, 'Durée minimum 15 min'),
  notes: z.string().optional(),
  status: z.nativeEnum(AppointmentStatus),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface AppointmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<Appointment>;
  onSubmit: (data: any) => Promise<void>;
  selectedDate?: Date;
}

export const AppointmentForm: React.FC<AppointmentFormProps> = ({
  isOpen,
  onClose,
  initialData,
  onSubmit,
  selectedDate,
}) => {
  // FIX: use setSearch instead of searchPatients
  const { patients, setSearch } = usePatients();
  const [searchTerm, setSearchTerm] = React.useState('');
  const currentUser = useMedicomStore((state) => state.currentUser);
  const defaultDuration =
    currentUser?.role === 'doctor' && currentUser.preferences?.defaultSlotDuration
      ? currentUser.preferences.defaultSlotDuration
      : 30;

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      type: AppointmentType.CONSULTATION,
      duration: defaultDuration,
      status: AppointmentStatus.PENDING,
      notes: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          patientId: initialData.patientId,
          type: initialData.type,
          date: initialData.start ? new Date(initialData.start).toISOString().split('T')[0] : '',
          // Handle Date object or string for start
          startTime: initialData.start
            ? new Date(initialData.start).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })
            : '',
          duration: initialData.duration || defaultDuration,
          notes: initialData.notes || '',
          status: initialData.status || AppointmentStatus.PENDING,
        });
      } else if (selectedDate) {
        reset({
          type: AppointmentType.CONSULTATION,
          date: selectedDate.toISOString().split('T')[0],
          startTime: selectedDate.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          duration: defaultDuration,
          status: AppointmentStatus.PENDING,
          notes: '',
          patientId: '',
        });
      } else {
        reset({
          type: AppointmentType.CONSULTATION,
          duration: defaultDuration,
          status: AppointmentStatus.PENDING,
          notes: '',
          patientId: '',
        });
      }
    }
  }, [isOpen, initialData, selectedDate, reset, defaultDuration]);

  // Handle patient search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.length >= 2) {
        setSearch(searchTerm);
      } else {
        setSearch('');
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, setSearch]);

  const handleFormSubmit: import('react-hook-form').SubmitHandler<AppointmentFormData> = async (
    data
  ) => {
    try {
      // Combine date and time
      const start = new Date(`${data.date}T${data.startTime}`);

      await onSubmit({
        ...data,
        start,
      });
      onClose();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <SlideOver
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}
      subtitle="Planifiez une consultation ou un traitement"
      width="md"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto space-y-6 p-6 sm:p-8">

          {/* Patient Selection */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Patient
            </label>
            <Controller
              name="patientId"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  <input
                    type="text"
                    className="input"
                    placeholder="Rechercher un patient par nom..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <select
                    {...field}
                    className="input appearance-none"
                  >
                    <option value="" disabled>Sélectionner depuis les résultats</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.firstName} {p.lastName}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400">
                    Tapez au moins 2 lettres pour filtrer la liste.
                  </p>
                </div>
              )}
            />
            {errors.patientId && (
              <p className="text-[11px] font-semibold text-rose-500">{errors.patientId.message}</p>
            )}
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Type de rendez-vous
            </label>
            <select {...register('type')} className="input appearance-none">
              {Object.values(AppointmentType).map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            {errors.type && (
              <p className="text-[11px] font-semibold text-rose-500">{errors.type.message}</p>
            )}
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  {...register('date')}
                  className="input pl-9"
                />
                <IconCalendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              {errors.date && (
                <p className="text-[11px] font-semibold text-rose-500">{errors.date.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Heure
              </label>
              <div className="relative">
                <input
                  type="time"
                  {...register('startTime')}
                  className="input pl-9"
                />
                <IconClock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              {errors.startTime && (
                <p className="text-[11px] font-semibold text-rose-500">{errors.startTime.message}</p>
              )}
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Durée
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[15, 30, 45, 60].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setValue('duration', mins)}
                  className={`flex items-center justify-center rounded-[30px] py-2 text-[13px] font-semibold transition-all duration-200 ${watch('duration') === mins
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                >
                  {mins} m
                </button>
              ))}
            </div>
            <input
              type="number"
              {...register('duration', { valueAsNumber: true })}
              className="input mt-2"
              placeholder="Durée personnalisée (min)"
            />
            {errors.duration && (
              <p className="text-[11px] font-semibold text-rose-500">{errors.duration.message}</p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Statut
            </label>
            <select {...register('status')} className="input appearance-none">
              {Object.values(AppointmentStatus).map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Notes <span className="normal-case text-slate-300">(optionnel)</span>
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              className="input resize-none leading-relaxed"
              placeholder="Motif de la visite, instructions particulières..."
            />
          </div>

        </div>

        {/* Form Actions — sticky footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-100 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary disabled:opacity-50"
          >
            {isSubmitting
              ? 'Enregistrement...'
              : initialData
                ? 'Mettre à jour'
                : 'Créer le rendez-vous'}
          </button>
        </div>
      </form>
    </SlideOver>
  );
};
