import React, { useMemo, useState } from 'react';
import type { TimeSlot } from '../../lib/api/publicBooking';
import { hasAnySlots } from '../../lib/api/publicBooking';

const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

interface Props {
  slots: TimeSlot[];
  loadingSlots: boolean;
  selectedSlot: TimeSlot | null;
  selectedDate: Date;
  onDateChange: (d: Date) => void;
  onSlotSelect: (s: TimeSlot) => void;
  accentColor: string;
  scheduleRows?: Array<{ day: string; hours: string; closed: boolean }>;
}

export const StepSelectSlot: React.FC<Props> = ({
  slots, loadingSlots, selectedSlot, selectedDate, onDateChange, onSlotSelect, accentColor, scheduleRows,
}) => {
  const [viewMonth, setViewMonth] = useState(() => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = startOfMonth(viewMonth);
    const lastDay = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0);
    const days: (Date | null)[] = [];
    // Leading empty cells
    for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
    // Days of month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d));
    }
    // Trailing empty cells to complete last row
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [viewMonth]);

  const prevMonth = () => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1));
  const nextMonth = () => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1));

  const isDayDisabled = (d: Date) => {
    if (d < today) return true;
    return !hasAnySlots(d, scheduleRows);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ── Month calendar ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevMonth}
            disabled={viewMonth <= new Date(today.getFullYear(), today.getMonth(), 1)}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-bold text-slate-900 capitalize">
            {MONTHS_FR[viewMonth.getMonth()]} {viewMonth.getFullYear()}
          </span>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS_FR.map(d => (
            <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase py-1">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {calendarDays.map((day, i) => {
            if (!day) return <div key={`e-${i}`} />;
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, today);
            const disabled = isDayDisabled(day);

            return (
              <button
                key={day.toISOString()}
                disabled={disabled}
                onClick={() => {
                  onDateChange(day);
                  if (viewMonth.getMonth() !== day.getMonth()) {
                    setViewMonth(new Date(day.getFullYear(), day.getMonth(), 1));
                  }
                }}
                className="relative h-9 w-full rounded-lg text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={isSelected
                  ? { backgroundColor: accentColor, color: '#fff' }
                  : isToday
                    ? { border: `1.5px solid ${accentColor}`, color: accentColor }
                    : { color: '#374151' }
                }
                onMouseEnter={e => { if (!disabled && !isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = `${accentColor}15`; }}
                onMouseLeave={e => { if (!disabled && !isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = ''; }}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Time slots ── */}
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
          Créneaux disponibles — {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>

        {loadingSlots ? (
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : slots.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-slate-400 font-medium">Aucun créneau disponible</p>
            <p className="text-xs text-slate-300 mt-1">Choisissez un autre jour</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {slots.map(slot => {
              const isSelected = selectedSlot?.label === slot.label && isSameDay(selectedSlot.start, slot.start);
              return (
                <button
                  key={slot.label}
                  onClick={() => onSlotSelect(slot)}
                  className="h-10 rounded-lg text-sm font-semibold transition-all border"
                  style={isSelected
                    ? { backgroundColor: accentColor, color: '#fff', borderColor: accentColor }
                    : { backgroundColor: '#f8fafc', color: '#374151', borderColor: '#e2e8f0' }
                  }
                  onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = `${accentColor}12`; }}
                  onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = '#f8fafc'; }}
                >
                  {slot.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
