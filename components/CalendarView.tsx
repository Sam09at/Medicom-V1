import React, { useState, useEffect, useMemo } from 'react';
import { Appointment, AppointmentStatus, AppointmentType } from '../types';
import {
  IconPlus,
  IconSearch,
  IconChevronLeft,
  IconChevronRight,
  IconClock,
  IconCheck,
} from './Icons';
import { useAppointments } from '../hooks/useAppointments';
import { useMedicomStore } from '../store';
import { AppointmentForm } from '../features/AppointmentForm';

// ─── Constants ────────────────────────────────────────────────────────────────

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8 → 20

const TYPE_STYLES: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  Consultation:        { bg: 'bg-indigo-50',  text: 'text-indigo-700',  border: 'border-indigo-100',  dot: 'bg-indigo-500' },
  'Séance Traitement': { bg: 'bg-purple-50',  text: 'text-purple-700',  border: 'border-purple-100',  dot: 'bg-purple-500' },
  Contrôle:            { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', dot: 'bg-emerald-500' },
  Urgence:             { bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-100',    dot: 'bg-rose-500' },
  'Pause / Absence':   { bg: 'bg-slate-100',  text: 'text-slate-500',   border: 'border-slate-200',   dot: 'bg-slate-400' },
};

// ─── Mini Calendar ────────────────────────────────────────────────────────────

const MiniCalendar = ({
  currentDate,
  onDateSelect,
}: {
  currentDate: Date;
  onDateSelect: (d: Date) => void;
}) => {
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDay   = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  return (
    <div className="mb-6 select-none">
      <div className="flex justify-between items-center mb-4">
        <span className="text-[13px] font-bold text-slate-900 capitalize">
          {currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
        </span>
        <div className="flex gap-0.5">
          <button
            onClick={() => onDateSelect(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
            className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
          >
            <IconChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDateSelect(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
            className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
          >
            <IconChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 text-center mb-1">
        {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => (
          <div key={i} className="text-[10px] text-slate-400 font-bold tracking-widest uppercase py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-0.5 text-center">
        {days.map((d, i) => (
          <button
            key={i}
            disabled={!d}
            onClick={() => {
              if (d) {
                const nd = new Date(currentDate);
                nd.setDate(d);
                onDateSelect(nd);
              }
            }}
            className={`h-7 w-full text-[11px] rounded-[30px] transition-all font-semibold ${
              !d
                ? 'invisible'
                : d === currentDate.getDate()
                  ? 'bg-[#0F0F0F] text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {d}
          </button>
        ))}
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const CalendarView: React.FC = () => {
  const { showToast, currentUser } = useMedicomStore();

  const defaultView =
    currentUser?.role === 'doctor' && currentUser.preferences?.defaultCalendarView
      ? currentUser.preferences.defaultCalendarView
      : 'week';

  const [view, setView] = useState<'day' | 'week' | 'month'>(defaultView);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<string[]>(Object.values(AppointmentType));

  const dateRange = useMemo(() => {
    const start = new Date(currentDate);
    const end   = new Date(currentDate);
    if (view === 'day') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (view === 'week') {
      const day  = start.getDay();
      const diff = start.getDate() - day;
      start.setDate(diff); start.setHours(0, 0, 0, 0);
      end.setDate(diff + 6); end.setHours(23, 59, 59, 999);
    } else {
      start.setDate(1); start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1, 0); end.setHours(23, 59, 59, 999);
    }
    return { startDate: start, endDate: end };
  }, [view, currentDate]);

  const { appointments, loading, createAppointment, updateAppointment, deleteAppointment, checkConflict } =
    useAppointments(dateRange);

  const [draggedApt, setDraggedApt]           = useState<Appointment | null>(null);
  const [currentTime, setCurrentTime]         = useState(new Date());
  const [isFormOpen, setIsFormOpen]           = useState(false);
  const [selectedApt, setSelectedApt]         = useState<Appointment | undefined>(undefined);
  const [formSelectedDate, setFormSelectedDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const filteredAppointments = useMemo(() =>
    appointments.filter((apt) => {
      if (searchQuery && !apt.patientName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (!filters.includes(apt.type)) return false;
      return true;
    }),
  [appointments, searchQuery, filters]);

  // ── Navigation ──────────────────────────────────────────────────────────────

  const next = () => {
    const d = new Date(currentDate);
    if (view === 'day') d.setDate(d.getDate() + 1);
    else if (view === 'week') d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };
  const prev = () => {
    const d = new Date(currentDate);
    if (view === 'day') d.setDate(d.getDate() - 1);
    else if (view === 'week') d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };
  const goToday = () => setCurrentDate(new Date());

  // ── Drag & Drop ──────────────────────────────────────────────────────────────

  const handleDragStart = (e: React.DragEvent, apt: Appointment) => {
    setDraggedApt(apt);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', apt.id);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  const handleDrop = async (e: React.DragEvent, date: Date, hour: number) => {
    e.preventDefault();
    if (!draggedApt) return;

    const targetDate = new Date(date);
    const maxStartMinutes = 24 * 60 - draggedApt.duration;
    const clampedStartMinutes = Math.min(hour * 60, maxStartMinutes);
    const clampedHour = Math.floor(clampedStartMinutes / 60);
    const clampedMin  = clampedStartMinutes % 60;
    targetDate.setHours(clampedHour, clampedMin, 0, 0);

    const endTime = new Date(targetDate.getTime() + draggedApt.duration * 60_000);
    if (endTime.getDate() !== targetDate.getDate()) {
      showToast({ type: 'error', message: 'Le rendez-vous ne peut pas dépasser minuit.' });
      setDraggedApt(null);
      return;
    }
    if (clampedStartMinutes < hour * 60) {
      showToast({ type: 'info', message: `Heure ajustée à ${String(clampedHour).padStart(2, '0')}:${String(clampedMin).padStart(2, '0')}.` });
    }

    const conflict = await checkConflict(targetDate, endTime, draggedApt.doctorId, draggedApt.id);
    if (conflict) {
      showToast({ type: 'error', message: 'Conflit : Le créneau est déjà occupé.' });
      setDraggedApt(null);
      return;
    }
    try {
      await updateAppointment(draggedApt.id, { start: targetDate, status: AppointmentStatus.RESCHEDULED });
    } catch { /* handled by hook */ }
    setDraggedApt(null);
  };

  // ── Slot / event click ───────────────────────────────────────────────────────

  const handleSlotClick = (date: Date, hour: number) => {
    const d = new Date(date);
    d.setHours(hour, 0, 0, 0);
    setFormSelectedDate(d);
    setSelectedApt(undefined);
    setIsFormOpen(true);
  };
  const handleEventClick = (e: React.MouseEvent, apt: Appointment) => {
    e.stopPropagation();
    setSelectedApt(apt);
    setFormSelectedDate(undefined);
    setIsFormOpen(true);
  };
  const handleFormSubmit = async (data: any) => {
    if (selectedApt) await updateAppointment(selectedApt.id, data);
    else             await createAppointment(data);
    setIsFormOpen(false);
  };

  // ── Time Grid ────────────────────────────────────────────────────────────────

  const renderTimeGrid = (daysToShow: number) => {
    const startDay = new Date(currentDate);
    if (view === 'week') {
      const day = startDay.getDay();
      startDay.setDate(startDay.getDate() - day);
    }
    const daysArray = Array.from({ length: daysToShow }).map((_, i) => {
      const d = new Date(startDay);
      d.setDate(d.getDate() + i);
      return d;
    });

    return (
      <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
        {/* Sticky day headers */}
        <div className="sticky top-0 z-20 flex bg-white border-b border-slate-100">
          <div className="w-16 flex-shrink-0" />
          {daysArray.map((date, i) => {
            const isToday = new Date().toDateString() === date.toDateString();
            return (
              <div key={i} className="flex-1 text-center py-3 px-1">
                <div className={`text-[11px] font-bold uppercase tracking-widest mb-1 ${isToday ? 'text-blue-500' : 'text-slate-400'}`}>
                  {date.toLocaleDateString('fr-FR', { weekday: 'short' })}
                </div>
                <div className={`text-[18px] font-bold leading-none ${isToday ? 'text-white' : 'text-slate-800'}`}>
                  {isToday ? (
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-[14px]">
                      {date.getDate()}
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center w-8 h-8 text-slate-800">
                      {date.getDate()}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Hour rows */}
        <div className="relative">
          {HOURS.map((hour) => (
            <div key={hour} className="flex h-[88px] group/hour">
              <div className="w-16 flex-shrink-0 text-right pr-3 text-[11px] font-semibold text-slate-300 relative -top-2 group-hover/hour:text-slate-400 transition-colors select-none">
                {hour}:00
              </div>
              <div className="flex-1 border-t border-slate-100 flex">
                {daysArray.map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 border-r border-slate-100 last:border-r-0 group-hover/hour:bg-slate-50/40 transition-colors"
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Interactive + events layer */}
          <div className="absolute inset-0 top-0 left-16 right-0 flex pointer-events-none">
            {daysArray.map((date, dayIndex) => {
              const isCurrentDay = date.toDateString() === currentTime.toDateString();
              const dayEvents = filteredAppointments.filter((a) => {
                const d = new Date(a.start);
                return (
                  d.getDate() === date.getDate() &&
                  d.getMonth() === date.getMonth() &&
                  d.getFullYear() === date.getFullYear()
                );
              });

              return (
                <div key={dayIndex} className="flex-1 h-full relative pointer-events-auto">
                  {/* Drop / click zones */}
                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      className="absolute w-full h-[88px] z-0"
                      style={{ top: `${(hour - HOURS[0]) * 88}px` }}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, date, hour)}
                      onClick={() => handleSlotClick(date, hour)}
                    />
                  ))}

                  {/* Current-time indicator */}
                  {isCurrentDay && (
                    <div
                      className="absolute w-full border-t-2 border-rose-400 z-30 flex items-center pointer-events-none"
                      style={{
                        top: `${Math.max(0, (currentTime.getHours() - HOURS[0]) * 88 + (currentTime.getMinutes() / 60) * 88)}px`,
                      }}
                    >
                      <div className="w-2 h-2 bg-rose-400 rounded-full -ml-1" />
                    </div>
                  )}

                  {/* Events */}
                  {dayEvents.map((apt) => {
                    const start = new Date(apt.start);
                    if (start.getHours() < HOURS[0]) return null;
                    const top    = (start.getHours() - HOURS[0]) * 88 + (start.getMinutes() / 60) * 88;
                    const height = Math.max(28, (apt.duration / 60) * 88);
                    const s      = TYPE_STYLES[apt.type] || TYPE_STYLES['Consultation'];

                    return (
                      <div
                        key={apt.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, apt)}
                        onClick={(e) => handleEventClick(e, apt)}
                        className={`absolute left-1 right-1 rounded-[12px] px-2.5 py-1.5 cursor-pointer transition-all flex flex-col overflow-hidden border z-10 hover:z-20 hover:brightness-95 ${s.bg} ${s.border}`}
                        style={{ top: `${top}px`, height: `${height}px` }}
                        title={`${apt.patientName} — ${apt.type}`}
                      >
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
                          <div className={`font-bold truncate text-[12px] tracking-tight ${s.text}`}>
                            {apt.patientName}
                          </div>
                          {(apt.noShowScore !== undefined && apt.noShowScore >= 70) && (
                            <div className="ml-auto shrink-0 w-1.5 h-1.5 rounded-full bg-red-500" title="Risque d'absence élevé" />
                          )}
                          {apt.source === 'public_booking' && (
                            <div className="ml-auto shrink-0 px-1 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-bold rounded uppercase tracking-wide leading-none">WEB</div>
                          )}
                        </div>
                        {height > 44 && (
                          <div className={`text-[10px] font-medium opacity-70 ${s.text} flex items-center gap-1 mt-0.5`}>
                            <IconClock className="w-3 h-3" />
                            {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                        {apt.status === AppointmentStatus.CANCELLED && (
                          <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-rose-600 font-bold text-[10px] uppercase tracking-widest backdrop-blur-[1px] rounded-[12px]">
                            Annulé
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // ── Month View ───────────────────────────────────────────────────────────────

  const renderMonthView = () => {
    const year  = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay    = new Date(year, month, 1).getDay();
    const days: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));

    return (
      <div className="flex-1 overflow-y-auto p-4">
        {/* Day-of-week header */}
        <div className="grid grid-cols-7 mb-2">
          {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map((d) => (
            <div key={d} className="py-2 text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {days.map((date, i) => {
            if (!date) return <div key={i} className="rounded-[16px] h-32 bg-slate-50/50" />;

            const dayEvents = filteredAppointments.filter((a) => {
              const d = new Date(a.start);
              return d.getDate() === date.getDate() && d.getMonth() === month;
            });
            const isToday = date.toDateString() === new Date().toDateString();

            return (
              <div
                key={i}
                onClick={() => handleSlotClick(date, 9)}
                className={`rounded-[16px] h-32 p-2.5 cursor-pointer border transition-all group ${
                  isToday
                    ? 'bg-blue-50/40 border-blue-100'
                    : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex justify-between items-start mb-1.5">
                  <span className={`text-[13px] font-bold leading-none ${isToday ? 'text-blue-600' : 'text-slate-800'}`}>
                    {date.getDate()}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="text-[10px] font-bold text-slate-400">{dayEvents.length}</span>
                  )}
                </div>
                <div className="space-y-0.5 overflow-y-auto max-h-[74px] scrollbar-hide">
                  {dayEvents.slice(0, 3).map((apt) => {
                    const s = TYPE_STYLES[apt.type] || TYPE_STYLES['Consultation'];
                    return (
                      <div
                        key={apt.id}
                        onClick={(e) => handleEventClick(e, apt)}
                        className={`text-[10px] px-1.5 py-0.5 rounded-[6px] font-semibold truncate ${s.bg} ${s.text}`}
                      >
                        {new Date(apt.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                        {apt.patientName}
                      </div>
                    );
                  })}
                  {dayEvents.length > 3 && (
                    <div className="text-[10px] text-slate-400 font-semibold pl-1.5">
                      +{dayEvents.length - 3} autres
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ── Shell ────────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full bg-[#FAFAFA] overflow-hidden">

      {/* ── Left Sidebar ── */}
      <aside className="w-64 flex-shrink-0 bg-white border-r border-slate-100 flex flex-col p-5 overflow-y-auto">

        {/* New appointment CTA */}
        <button
          onClick={() => { setFormSelectedDate(new Date()); setSelectedApt(undefined); setIsFormOpen(true); }}
          className="mb-6 h-10 w-full flex items-center justify-center gap-2 text-[13px] font-medium rounded-[30px] bg-[#0F0F0F] text-white hover:bg-black transition-all"
        >
          <IconPlus className="w-4 h-4" /> Nouveau RDV
        </button>

        {/* Mini calendar */}
        <MiniCalendar currentDate={currentDate} onDateSelect={setCurrentDate} />

        {/* Divider */}
        <div className="border-t border-slate-100 pt-5">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
            Types
          </p>
          <div className="space-y-0.5">
            {Object.values(AppointmentType).map((type) => {
              const style    = TYPE_STYLES[type] || TYPE_STYLES['Consultation'];
              const isActive = filters.includes(type);
              return (
                <button
                  key={type}
                  onClick={() =>
                    setFilters((prev) =>
                      prev.includes(type) ? prev.filter((f) => f !== type) : [...prev, type]
                    )
                  }
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[20px] transition-all hover:bg-slate-50 group"
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                      isActive ? style.dot : 'border border-slate-200 bg-white'
                    }`}
                  >
                    {isActive && <IconCheck className="w-3 h-3 text-white" />}
                  </div>
                  <span className={`truncate text-[12px] font-semibold ${isActive ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'}`}>
                    {type}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Page header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 pt-6 pb-4 flex-shrink-0">
          <div>
            <h2
              className="text-[32px] font-normal tracking-[-0.02em] leading-tight text-slate-900"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Calendrier
            </h2>
            <span className="text-[14px] font-medium text-slate-500 mt-1 block">
              Gérez vos rendez-vous et votre planning ici.
            </span>
          </div>

          <div className="flex gap-3 items-center flex-wrap">
            {/* View switcher */}
            <div className="flex bg-slate-100 p-1 rounded-[20px]">
              {(['day', 'week', 'month'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1.5 text-[12px] font-bold rounded-[14px] transition-all ${
                    view === v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {v === 'day' ? 'Jour' : v === 'week' ? 'Semaine' : 'Mois'}
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-0.5 bg-white border border-slate-200 rounded-[20px] p-1">
              <button onClick={prev} className="p-1.5 hover:bg-slate-50 rounded-[12px] text-slate-500 transition-colors">
                <IconChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={goToday}
                className="px-3 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 rounded-[12px] uppercase tracking-widest transition-colors"
              >
                Auj.
              </button>
              <button onClick={next} className="p-1.5 hover:bg-slate-50 rounded-[12px] text-slate-500 transition-colors">
                <IconChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Sub-toolbar: month label + search */}
        <div className="flex items-center justify-between px-6 pb-4 flex-shrink-0">
          <span className="text-[14px] font-semibold text-slate-700 capitalize">
            {currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </span>
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher un patient..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-[13px] font-medium rounded-[20px] pl-9 pr-4 py-2 bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100 transition-all w-56"
            />
          </div>
        </div>

        {/* Calendar card */}
        <div className="mx-6 mb-6 bg-white rounded-[20px] border border-slate-100 flex-1 overflow-hidden flex flex-col">
          {view === 'month' ? renderMonthView() : renderTimeGrid(view === 'day' ? 1 : 7)}
        </div>
      </div>

      <AppointmentForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialData={selectedApt}
        selectedDate={formSelectedDate}
        onSubmit={handleFormSubmit}
        onDelete={async (id) => { await deleteAppointment(id); setIsFormOpen(false); }}
      />
    </div>
  );
};
