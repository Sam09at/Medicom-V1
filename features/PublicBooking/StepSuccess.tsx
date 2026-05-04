import React from 'react';
import type { TimeSlot } from '../../lib/api/publicBooking';

interface Props {
  slot: TimeSlot;
  firstName: string;
  clinicName: string;
  clinicPhone?: string | null;
  accentColor: string;
  onClose: () => void;
}

export const StepSuccess: React.FC<Props> = ({
  slot, firstName, clinicName, clinicPhone, accentColor, onClose,
}) => {
  const formattedDate = slot.start.toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  // Build ICS download
  const downloadICS = () => {
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Medicom//FR',
      'BEGIN:VEVENT',
      `DTSTART:${fmt(slot.start)}`,
      `DTEND:${fmt(slot.end)}`,
      `SUMMARY:Rendez-vous – ${clinicName}`,
      `DESCRIPTION:Votre rendez-vous à ${clinicName}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rendez-vous-medicom.ics';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col items-center text-center gap-6 py-4">
      {/* Check animation */}
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg"
        style={{ backgroundColor: accentColor }}
      >
        <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <div>
        <h3 className="text-xl font-bold text-slate-900">Rendez-vous confirmé !</h3>
        <p className="text-slate-500 text-sm mt-1">Merci {firstName}, à très bientôt.</p>
      </div>

      {/* Summary card */}
      <div className="w-full rounded-2xl border border-slate-100 bg-slate-50 p-5 text-left space-y-3">
        <div className="flex items-start gap-3">
          <svg className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          <div>
            <p className="text-xs text-slate-400 font-medium">Date & heure</p>
            <p className="text-sm font-semibold text-slate-900 capitalize">{formattedDate} à {slot.label}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <svg className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          <div>
            <p className="text-xs text-slate-400 font-medium">Cabinet</p>
            <p className="text-sm font-semibold text-slate-900">{clinicName}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="w-full flex flex-col gap-2.5">
        <button
          onClick={downloadICS}
          className="w-full py-3 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Ajouter à l'agenda
        </button>

        {clinicPhone && (
          <a
            href={`tel:${clinicPhone}`}
            className="w-full py-3 rounded-2xl text-white text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            style={{ backgroundColor: accentColor }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
            Appeler le cabinet
          </a>
        )}

        <button
          onClick={onClose}
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors py-1"
        >
          Fermer
        </button>
      </div>
    </div>
  );
};
