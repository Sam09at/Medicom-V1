import React, { useState, useEffect, useMemo } from 'react';
import { Appointment, AppointmentStatus, AppointmentType } from '../types';
import {
  IconPlus,
  IconSearch,
  IconChevronLeft,
  IconChevronRight,
  IconClock,
  IconFilter,
  IconCheck,
  IconSettings,
  IconMenu,
} from './Icons';
import { useAppointments } from '../hooks/useAppointments';
import { useMedicomStore } from '../store';
import { AppointmentForm } from '../features/AppointmentForm';

// Constants
const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8:00 to 20:00
const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const TYPE_STYLES: Record<string, { bg: string; text: string; border?: string }> = {
  Consultation: { bg: 'bg-sky-200', text: 'text-sky-800' },
  'Séance Traitement': { bg: 'bg-purple-200', text: 'text-purple-800' },
  Contrôle: { bg: 'bg-amber-200', text: 'text-amber-800' },
  Urgence: { bg: 'bg-rose-200', text: 'text-rose-800' },
  'Pause / Absence': { bg: 'bg-gray-100', text: 'text-gray-500' },
};

// Helper components
const MiniCalendar = ({
  currentDate,
  onDateSelect,
}: {
  currentDate: Date;
  onDateSelect: (d: Date) => void;
}) => {
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  return (
    <div className="mb-8 select-none">
      <div className="flex justify-between items-center mb-4 px-1">
        <span className="font-bold text-gray-900 text-sm capitalize">
          {currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
        </span>
        <div className="flex gap-1">
          <button
            onClick={() =>
              onDateSelect(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
            }
            className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
          >
            <IconChevronLeft className="w-3 h-3" />
          </button>
          <button
            onClick={() =>
              onDateSelect(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
            }
            className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
          >
            <IconChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d) => (
          <div key={d} className="text-[10px] text-gray-400 font-semibold">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1 gap-x-1 text-center">
        {days.map((d, i) => (
          <button
            key={i}
            disabled={!d}
            className={`h-8 w-8 text-xs rounded-full flex items-center justify-center transition-all ${
              !d
                ? 'invisible'
                : d === currentDate.getDate()
                  ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-200/50'
                  : 'text-gray-600 hover:bg-gray-50 font-semibold'
            }`}
            onClick={() => {
              if (d) {
                const newDate = new Date(currentDate);
                newDate.setDate(d);
                onDateSelect(newDate);
              }
            }}
          >
            {d}
          </button>
        ))}
      </div>
    </div>
  );
};

export const CalendarView: React.FC = () => {
  const { showToast, currentUser } = useMedicomStore();

  // Determine the default view
  const defaultView =
    currentUser?.role === 'doctor' && currentUser.preferences?.defaultCalendarView
      ? currentUser.preferences.defaultCalendarView
      : 'week';

  const [view, setView] = useState<'day' | 'week' | 'month'>(defaultView);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<string[]>(Object.values(AppointmentType));

  // Date range for hook
  const dateRange = useMemo(() => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    if (view === 'day') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (view === 'week') {
      const day = start.getDay();
      const diff = start.getDate() - day; // Sunday start
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      end.setDate(diff + 6);
      end.setHours(23, 59, 59, 999);
    } else {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
    }
    return { startDate: start, endDate: end };
  }, [view, currentDate]);

  const { appointments, loading, createAppointment, updateAppointment, checkConflict } =
    useAppointments(dateRange);

  const [draggedApt, setDraggedApt] = useState<Appointment | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedApt, setSelectedApt] = useState<Appointment | undefined>(undefined);
  const [formSelectedDate, setFormSelectedDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      if (searchQuery && !apt.patientName.toLowerCase().includes(searchQuery.toLowerCase()))
        return false;
      if (!filters.includes(apt.type)) return false;
      return true;
    });
  }, [appointments, searchQuery, filters]);

  // View Navigation Helpers
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

  const today = () => setCurrentDate(new Date());

  // Drag & Drop
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

    // ── BUG-001 Fix: clamp start hour so appointment never crosses midnight ──
    // Max allowed start = floor((24*60 - duration) / 60) hours, capped to 23
    const maxStartMinutes = 24 * 60 - draggedApt.duration; // last valid start (in minutes from midnight)
    const requestedStartMinutes = hour * 60;
    const clampedStartMinutes = Math.min(requestedStartMinutes, maxStartMinutes);
    const clampedHour = Math.floor(clampedStartMinutes / 60);
    const clampedMin = clampedStartMinutes % 60;

    targetDate.setHours(clampedHour, clampedMin, 0, 0);

    const endTime = new Date(targetDate.getTime() + draggedApt.duration * 60000);

    // Sanity check — end must still be same calendar day
    if (endTime.getDate() !== targetDate.getDate()) {
      showToast({ type: 'error', message: 'Le rendez-vous ne peut pas dépasser minuit.' });
      setDraggedApt(null);
      return;
    }

    // Show info toast if start was clamped
    if (clampedStartMinutes < requestedStartMinutes) {
      showToast({
        type: 'info',
        message: `Heure ajustée à ${String(clampedHour).padStart(2, '0')}:${String(clampedMin).padStart(2, '0')} pour rester dans la journée.`,
      });
    }

    // Conflict check
    const conflict = await checkConflict(targetDate, endTime, draggedApt.doctorId, draggedApt.id);
    if (conflict) {
      showToast({ type: 'error', message: `Conflit : Le créneau est déjà occupé.` });
      setDraggedApt(null);
      return;
    }

    // Persist
    try {
      await updateAppointment(draggedApt.id, {
        start: targetDate,
        status: AppointmentStatus.RESCHEDULED,
      });
    } catch {
      // Error handled by hook
    }

    setDraggedApt(null);
  };

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
    if (selectedApt) {
      await updateAppointment(selectedApt.id, data);
    } else {
      await createAppointment(data);
    }
    setIsFormOpen(false);
  };

  // Grid Renderers
  const renderTimeGrid = (daysToShow: number) => {
    const startDay = new Date(currentDate);
    if (view === 'week') {
      const day = startDay.getDay();
      const diff = startDay.getDate() - day;
      startDay.setDate(diff);
    }

    const daysArray = Array.from({ length: daysToShow }).map((_, i) => {
      const d = new Date(startDay);
      d.setDate(d.getDate() + i);
      return d;
    });

    return (
      <div className="flex-1 overflow-y-auto overflow-x-hidden bg-white relative">
        <div className="min-w-full inline-block align-top">
          {/* Header Row */}
          <div className="sticky top-0 z-20 flex bg-white/95 backdrop-blur-sm pb-4 pt-6 border-b border-gray-100/60">
            <div className="w-20 flex-shrink-0 text-right pr-6 pt-1 text-[0.65rem] font-bold text-gray-400 uppercase tracking-wider">
              BST
            </div>
            {daysArray.map((date, i) => {
              const isToday = new Date().toDateString() === date.toDateString();
              return (
                <div key={i} className="flex-1 text-center">
                  <div
                    className={`text-[0.65rem] font-bold uppercase tracking-[0.1em] mb-1.5 ${isToday ? 'text-blue-600' : 'text-gray-400'}`}
                  >
                    {date.toLocaleDateString('fr-FR', { weekday: 'short' })}
                  </div>
                  <div
                    className={`text-xl font-bold tracking-tight ${isToday ? 'text-blue-600' : 'text-gray-900'}`}
                  >
                    {date.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Body */}
          <div className="relative">
            {/* Hours Background */}
            {HOURS.map((hour) => (
              <div key={hour} className="flex h-[100px] group/hour">
                <div className="w-20 flex-shrink-0 text-right pr-6 text-[0.65rem] font-bold text-gray-300 relative -top-2 transition-colors group-hover/hour:text-gray-500">
                  {hour}:00
                </div>
                <div className="flex-1 border-t border-gray-100/40 flex h-full">
                  {daysArray.map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 border-r border-gray-100/20 last:border-r-0 h-full group-hover/hour:bg-gray-50/30 transition-colors"
                    ></div>
                  ))}
                </div>
              </div>
            ))}

            {/* Interactive Layer */}
            <div className="absolute inset-0 top-0 left-20 right-0 flex pointer-events-none">
              {daysArray.map((date, dayIndex) => {
                const isCurrentDay = date.toDateString() === currentTime.toDateString();

                // Filter events for this day
                const dayEvents = filteredAppointments.filter((a) => {
                  const d = new Date(a.start);
                  return (
                    d.getDate() === date.getDate() &&
                    d.getMonth() === date.getMonth() &&
                    d.getFullYear() === date.getFullYear()
                  );
                });

                return (
                  <div
                    key={dayIndex}
                    className="flex-1 h-full relative pointer-events-auto border-r border-transparent"
                  >
                    {/* Drop/Click Zones */}
                    {HOURS.map((hour) => (
                      <div
                        key={hour}
                        className="absolute w-full h-[100px] z-0"
                        style={{ top: `${(hour - HOURS[0]) * 100}px` }}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, date, hour)}
                        onClick={() => handleSlotClick(date, hour)}
                      />
                    ))}

                    {/* Current Time Indicator */}
                    {isCurrentDay && (
                      <div
                        className="absolute w-full border-t-2 border-red-500 z-30 flex items-center pointer-events-none"
                        style={{
                          top: `${Math.max(0, (currentTime.getHours() - HOURS[0]) * 100 + (currentTime.getMinutes() / 60) * 100)}px`,
                        }}
                      >
                        <div className="w-2 h-2 bg-red-500 rounded-full -ml-1"></div>
                      </div>
                    )}

                    {/* Events */}
                    {dayEvents.map((apt) => {
                      const start = new Date(apt.start);
                      if (start.getHours() < HOURS[0]) return null; // Before start
                      const top =
                        (start.getHours() - HOURS[0]) * 100 + (start.getMinutes() / 60) * 100;
                      const height = (apt.duration / 60) * 100;
                      const style = TYPE_STYLES[apt.type] || TYPE_STYLES['Consultation'];
                      const accentColor = style.bg.replace('200', '500').replace('100', '400');

                      return (
                        <div
                          key={apt.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, apt)}
                          onClick={(e) => handleEventClick(e, apt)}
                          className={`absolute left-1 right-1 rounded-2xl p-3 text-xs cursor-pointer shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.1)] transition-all flex flex-col overflow-hidden ${style.bg} z-10 group opacity-95 hover:opacity-100 hover:z-20 border border-white/40`}
                          style={{ top: `${top}px`, height: `${height}px` }}
                          title={`${apt.patientName} - ${apt.type}`}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${accentColor.replace('bg-', 'bg-')}`}
                            ></div>
                            <div
                              className={`font-bold truncate text-[0.8125rem] tracking-tight ${style.text}`}
                            >
                              {apt.patientName}
                            </div>
                          </div>
                          <div
                            className={`text-[0.6875rem] font-medium opacity-70 ${style.text} flex items-center gap-1`}
                          >
                            <IconClock className="w-3 h-3" />
                            {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          {apt.status === AppointmentStatus.CANCELLED && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/60 text-red-600 font-bold text-[0.65rem] uppercase tracking-widest backdrop-blur-[1px]">
                              ANNULÉ
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
      </div>
    );
  };

  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));

    return (
      <div className="flex-1 bg-white p-6 overflow-y-auto">
        <div className="grid grid-cols-7 gap-2">
          {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map((d) => (
            <div
              key={d}
              className="p-3 text-center text-[0.65rem] font-bold text-gray-400 uppercase tracking-[0.1em]"
            >
              {d}
            </div>
          ))}
          {days.map((date, i) => {
            if (!date) return <div key={i} className="bg-gray-50/30 rounded-2xl h-36"></div>;
            const dayEvents = filteredAppointments.filter((a) => {
              const d = new Date(a.start);
              return d.getDate() === date.getDate() && d.getMonth() === month;
            });
            const isToday = date.toDateString() === new Date().toDateString();

            return (
              <div
                key={i}
                className={`group rounded-2xl h-36 p-3 transition-all cursor-pointer border ${isToday ? 'bg-blue-50/30 border-blue-100 shadow-[0_4px_12px_-2px_rgba(37,99,235,0.05)]' : 'bg-white border-gray-100/60 hover:border-blue-200/60 hover:shadow-sm'}`}
                onClick={() => handleSlotClick(date, 9)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div
                    className={`text-[0.875rem] font-bold leading-none ${isToday ? 'text-blue-600' : 'text-gray-900 group-hover:text-blue-600'}`}
                  >
                    {date.getDate()}
                  </div>
                  {dayEvents.length > 0 && (
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                  )}
                </div>
                <div className="space-y-1 overflow-y-auto max-h-[85px] pr-0.5 scrollbar-hide">
                  {dayEvents.map((apt) => (
                    <div
                      key={apt.id}
                      onClick={(e) => handleEventClick(e, apt)}
                      className={`text-[0.625rem] px-2 py-1 rounded-lg font-bold truncate transition-transform hover:scale-[1.02] active:scale-[0.98] ${TYPE_STYLES[apt.type]?.bg || 'bg-gray-100'} ${TYPE_STYLES[apt.type]?.text || 'text-gray-700'}`}
                    >
                      {new Date(apt.start).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      {apt.patientName}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full bg-gray-50 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 flex-shrink-0 bg-white p-6 flex flex-col overflow-y-auto">
        <button
          onClick={() => {
            setFormSelectedDate(new Date());
            setSelectedApt(undefined);
            setIsFormOpen(true);
          }}
          className="btn-primary w-full h-12 flex items-center justify-center gap-2 mb-8"
        >
          <IconPlus className="w-5 h-5" /> Nouveau RDV
        </button>

        <MiniCalendar currentDate={currentDate} onDateSelect={setCurrentDate} />

        <div className="space-y-6">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-[0.1em]">
              Filtres
            </h3>
          </div>
          <div className="space-y-1">
            {Object.values(AppointmentType).map((type) => {
              const style = TYPE_STYLES[type] || TYPE_STYLES['Consultation'];
              const isActive = filters.includes(type);
              const colorClass = style.bg.replace('200', '400');

              return (
                <button
                  key={type}
                  onClick={() =>
                    setFilters((prev) =>
                      prev.includes(type) ? prev.filter((f) => f !== type) : [...prev, type]
                    )
                  }
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-gray-50 group"
                >
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${isActive ? colorClass : 'border border-gray-200 bg-white group-hover:border-gray-300'}`}
                  >
                    {isActive && <IconCheck className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <span className={`truncate ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                    {type}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Main Calendar */}
      <div className="flex-1 flex flex-col min-w-0 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] m-6 rounded-[2.5rem] border border-gray-100/50 overflow-hidden">
        {/* Toolbar */}
        <header className="h-20 border-b border-gray-100/60 flex items-center justify-between px-8 flex-shrink-0 bg-white/80 backdrop-blur-md">
          <div className="flex items-center gap-8">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight capitalize">
              {currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex bg-gray-100/80 p-1.5 rounded-2xl">
              <button
                onClick={() => setView('day')}
                className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${view === 'day' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Jour
              </button>
              <button
                onClick={() => setView('week')}
                className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${view === 'week' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Semaine
              </button>
              <button
                onClick={() => setView('month')}
                className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${view === 'month' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Mois
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 pr-5 py-2.5 bg-gray-50/50 border border-transparent hover:bg-gray-100 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/20 rounded-2xl text-[0.875rem] font-medium transition-all w-72 outline-none"
              />
            </div>
            <div className="flex gap-1.5 border border-gray-100/80 rounded-2xl p-1.5 bg-gray-50/30">
              <button
                className="p-1.5 hover:bg-white hover:shadow-sm rounded-xl text-gray-500 transition-all active:scale-95"
                onClick={prev}
              >
                <IconChevronLeft className="w-5 h-5" />
              </button>
              <button
                className="px-5 py-1.5 text-xs font-bold text-gray-700 hover:bg-white hover:shadow-sm rounded-xl transition-all uppercase tracking-wider active:scale-95"
                onClick={today}
              >
                Aujourd'hui
              </button>
              <button
                className="p-1.5 hover:bg-white hover:shadow-sm rounded-xl text-gray-500 transition-all active:scale-95"
                onClick={next}
              >
                <IconChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        {view === 'month' ? renderMonthView() : renderTimeGrid(view === 'day' ? 1 : 7)}
      </div>

      <AppointmentForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialData={selectedApt}
        selectedDate={formSelectedDate}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
};
