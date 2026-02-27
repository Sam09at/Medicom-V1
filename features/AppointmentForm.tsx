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
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 p-6 sm:p-8">
        {/* Patient Selection */}
        <div className="space-y-2">
          <label className="block text-[0.75rem] font-bold text-slate-400 uppercase tracking-widest">
            Patient
          </label>
          <div className="mt-1 relative">
            <Controller
              name="patientId"
              control={control}
              render={({ field }) => (
                <div className="space-y-3">
                  <input
                    type="text"
                    className="w-full px-5 py-3.5 bg-slate-50/50 border border-slate-100/80 rounded-[8px] text-[0.875rem] font-medium text-slate-900 transition-all outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/20 shadow-sm"
                    placeholder="Rechercher un patient par nom..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <div className="relative">
                    <select
                      {...field}
                      className="w-full px-5 py-3.5 bg-white border border-slate-100/80 rounded-[8px] text-[0.875rem] font-bold text-slate-900 transition-all outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/20 shadow-sm appearance-none"
                    >
                      <option value="" disabled>
                        Sélectionner depuis les résultats
                      </option>
                      {patients.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.firstName} {p.lastName}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              )}
            />
            <p className="mt-2 text-[0.75rem] font-medium text-slate-500">
              Recherchez un patient puis sélectionnez-le dans la liste.
            </p>
          </div>
          {errors.patientId && (
            <p className="mt-2 text-[0.75rem] font-bold text-rose-500">
              {errors.patientId.message}
            </p>
          )}
        </div>

        {/* Type */}
        <div className="space-y-2">
          <label className="block text-[0.75rem] font-bold text-slate-400 uppercase tracking-widest">
            Type de rendez-vous
          </label>
          <div className="relative mt-1">
            <select
              {...register('type')}
              className="w-full px-5 py-3.5 bg-white border border-slate-100/80 rounded-[8px] text-[0.875rem] font-bold text-slate-900 transition-all outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/20 shadow-sm appearance-none"
            >
              {Object.values(AppointmentType).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-slate-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
          {errors.type && (
            <p className="mt-2 text-[0.75rem] font-bold text-rose-500">{errors.type.message}</p>
          )}
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-[0.75rem] font-bold text-slate-400 uppercase tracking-widest">
              Date
            </label>
            <div className="relative mt-1">
              <input
                type="date"
                {...register('date')}
                className="w-full pl-12 pr-5 py-3.5 bg-white border border-slate-100/80 rounded-[8px] text-[0.875rem] font-bold text-slate-900 transition-all outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/20 shadow-sm"
              />
              <div className="pointer-events-none absolute top-1/2 -translate-y-1/2 left-4 text-slate-400">
                <IconCalendar className="w-5 h-5" />
              </div>
            </div>
            {errors.date && (
              <p className="mt-2 text-[0.75rem] font-bold text-rose-500">{errors.date.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-[0.75rem] font-bold text-slate-400 uppercase tracking-widest">
              Heure
            </label>
            <div className="relative mt-1">
              <input
                type="time"
                {...register('startTime')}
                className="w-full pl-12 pr-5 py-3.5 bg-white border border-slate-100/80 rounded-[8px] text-[0.875rem] font-bold text-slate-900 transition-all outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/20 shadow-sm"
              />
              <div className="pointer-events-none absolute top-1/2 -translate-y-1/2 left-4 text-slate-400">
                <IconClock className="w-5 h-5" />
              </div>
            </div>
            {errors.startTime && (
              <p className="mt-2 text-[0.75rem] font-bold text-rose-500">
                {errors.startTime.message}
              </p>
            )}
          </div>
        </div>

        {/* Duration */}
        <div className="space-y-3">
          <label className="block text-[0.75rem] font-bold text-slate-400 uppercase tracking-widest">
            Durée
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[15, 30, 45, 60].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => setValue('duration', mins)}
                className={`flex items-center justify-center rounded-[30px] py-2.5 text-[0.875rem] font-bold transition-all ${
                  watch('duration') === mins
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200/50 scale-[1.02]'
                    : 'bg-white border border-slate-100/80 text-slate-700 hover:bg-slate-50 hover:border-slate-200'
                }`}
              >
                {mins} m
              </button>
            ))}
          </div>
          {/* Custom duration */}
          <input
            type="number"
            {...register('duration', { valueAsNumber: true })}
            className="w-full px-5 py-3.5 bg-white border border-slate-100/80 rounded-[8px] text-[0.875rem] font-bold text-slate-900 transition-all outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/20 shadow-sm"
            placeholder="Personnalisée (min)"
          />
          {errors.duration && (
            <p className="mt-2 text-[0.75rem] font-bold text-rose-500">{errors.duration.message}</p>
          )}
        </div>

        {/* Status */}
        <div className="space-y-2">
          <label className="block text-[0.75rem] font-bold text-slate-400 uppercase tracking-widest">
            Statut
          </label>
          <div className="relative mt-1">
            <select
              {...register('status')}
              className="w-full px-5 py-3.5 bg-white border border-slate-100/80 rounded-[8px] text-[0.875rem] font-bold text-slate-900 transition-all outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/20 shadow-sm appearance-none"
            >
              {Object.values(AppointmentStatus).map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-slate-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label className="block text-[0.75rem] font-bold text-slate-400 uppercase tracking-widest">
            Notes (optionnel)
          </label>
          <textarea
            {...register('notes')}
            rows={3}
            className="w-full px-5 py-4 bg-white border border-slate-100/80 rounded-[8px] text-[0.875rem] font-medium text-slate-700 transition-all outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/20 shadow-sm resize-none leading-relaxed"
            placeholder="Motif de la visite, instructions particulières..."
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4 pt-6 mt-8 border-t border-slate-100/80">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3.5 bg-white border border-slate-200 text-slate-600 text-[0.875rem] font-bold rounded-[8px] hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary py-3.5 px-8 rounded-[8px] text-[0.875rem] disabled:opacity-50"
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
