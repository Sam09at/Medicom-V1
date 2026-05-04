import React from 'react';
import type { TimeSlot } from '../../lib/api/publicBooking';

interface Props {
  slot: TimeSlot;
  clinicName: string;
  accentColor: string;
  firstName: string;
  lastName: string;
  phone: string;
  reason: string;
  onFirstName: (v: string) => void;
  onLastName: (v: string) => void;
  onPhone: (v: string) => void;
  onReason: (v: string) => void;
  onSubmit: () => void;
  loading: boolean;
  error: string | null;
}

const inputCls = 'w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent bg-white transition-shadow placeholder:text-slate-300';

export const StepPatientInfo: React.FC<Props> = ({
  slot, clinicName, accentColor,
  firstName, lastName, phone, reason,
  onFirstName, onLastName, onPhone, onReason,
  onSubmit, loading, error,
}) => {
  const formattedDate = slot.start.toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Appointment summary */}
      <div className="rounded-xl p-4 border border-slate-100 bg-slate-50">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Votre rendez-vous</p>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${accentColor}18` }}
          >
            <svg className="w-5 h-5" style={{ color: accentColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 capitalize">{formattedDate}</p>
            <p className="text-sm text-slate-500 font-medium">
              {slot.label} · {clinicName}
            </p>
          </div>
        </div>
      </div>

      {/* Name fields */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5">Prénom <span className="text-red-400">*</span></label>
          <input
            className={inputCls}
            style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
            value={firstName}
            onChange={e => onFirstName(e.target.value)}
            placeholder="Amina"
            required
            autoFocus
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5">Nom <span className="text-red-400">*</span></label>
          <input
            className={inputCls}
            value={lastName}
            onChange={e => onLastName(e.target.value)}
            placeholder="Benali"
            required
          />
        </div>
      </div>

      {/* Phone */}
      <div>
        <label className="block text-xs font-bold text-slate-600 mb-1.5">Téléphone <span className="text-red-400">*</span></label>
        <input
          className={inputCls}
          type="tel"
          value={phone}
          onChange={e => onPhone(e.target.value)}
          placeholder="+212 6XX XXX XXX"
          required
        />
        <p className="text-[11px] text-slate-400 mt-1">Nous vous enverrons une confirmation sur ce numéro.</p>
      </div>

      {/* Reason (optional) */}
      <div>
        <label className="block text-xs font-bold text-slate-600 mb-1.5">Motif de consultation <span className="text-slate-400 font-normal">(optionnel)</span></label>
        <textarea
          className={`${inputCls} resize-none`}
          rows={2}
          value={reason}
          onChange={e => onReason(e.target.value)}
          placeholder="Contrôle de routine, douleur, urgence…"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
          </svg>
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || !firstName.trim() || !lastName.trim() || !phone.trim()}
        className="w-full py-3.5 rounded-2xl text-white text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{ backgroundColor: accentColor }}
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Confirmation en cours…
          </>
        ) : 'Confirmer le rendez-vous'}
      </button>
    </form>
  );
};
