
import React, { useState, useEffect, useRef } from 'react';
import { Appointment, AppointmentStatus, AppointmentType } from '../types';
import { IconPlus, IconSearch, IconChevronLeft, IconChevronRight, IconClock, IconFilter, IconCheck, IconSettings, IconMenu } from './Icons';

interface CalendarViewProps {
  appointments: Appointment[];
  onAddAppointment: (date: Date, time: string) => void;
  onUpdateAppointment?: (apt: Appointment) => void;
  addToast: (type: 'success' | 'error' | 'warning', message: string) => void;
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8:00 to 20:00
const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

// Matching the screenshot colors (Vivid Pastels)
const TYPE_STYLES: Record<string, { bg: string, text: string, border?: string }> = {
    'Consultation': { bg: 'bg-sky-200', text: 'text-sky-800' },
    'Séance Traitement': { bg: 'bg-purple-200', text: 'text-purple-800' },
    'Contrôle': { bg: 'bg-amber-200', text: 'text-amber-800' },
    'Urgence': { bg: 'bg-rose-200', text: 'text-rose-800' },
    'Pause / Absence': { bg: 'bg-slate-100', text: 'text-slate-500' },
};

const MiniCalendar = ({ currentDate, onDateSelect }: { currentDate: Date, onDateSelect: (d: Date) => void }) => {
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); 
    
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    return (
        <div className="mb-8">
            <div className="flex justify-between items-center mb-4 px-1">
                <span className="font-bold text-slate-900 text-sm">
                    {currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                </span>
                <div className="flex gap-1">
                    <button className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600">
                        <IconChevronLeft className="w-3 h-3" />
                    </button>
                    <button className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600">
                        <IconChevronRight className="w-3 h-3" />
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {['D','L','M','M','J','V','S'].map(d => (
                    <div key={d} className="text-[10px] text-slate-400 font-semibold">{d}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-y-1 gap-x-1 text-center">
                {days.map((d, i) => (
                    <button 
                        key={i} 
                        disabled={!d}
                        className={`h-7 w-7 text-xs rounded-full flex items-center justify-center transition-all ${
                            !d ? 'invisible' :
                            d === currentDate.getDate() ? 'bg-blue-600 text-white font-bold shadow-md' : 
                            'text-slate-600 hover:bg-slate-100 font-medium'
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

export const CalendarView: React.FC<CalendarViewProps> = ({ appointments: initialAppointments, onAddAppointment, onUpdateAppointment, addToast }) => {
  const [appointments, setAppointments] = useState(initialAppointments);
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedApt, setDraggedApt] = useState<Appointment | null>(null);
  const [filters, setFilters] = useState<string[]>(Object.values(AppointmentType));
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hoveredSlot, setHoveredSlot] = useState<{day: number, hour: number} | null>(null);

  useEffect(() => {
    setAppointments(initialAppointments);
  }, [initialAppointments]);

  useEffect(() => {
      const interval = setInterval(() => setCurrentTime(new Date()), 60000);
      return () => clearInterval(interval);
  }, []);

  const getDayDate = (dayIndex: number) => {
    // 0 is Sunday in JS Date.getDay()
    // We want column 0 to be Sunday as per the array DAYS
    const d = new Date(currentWeekStart);
    const day = d.getDay(); 
    // Calculate offset to get to the Sunday of the current week
    const diff = d.getDate() - day + dayIndex;
    const result = new Date(d.setDate(diff));
    return result;
  };

  const getAppointmentsForSlot = (date: Date, hour: number) => {
    return filteredAppointments.filter(apt => {
      const aptDate = new Date(apt.start);
      return (
        aptDate.getDate() === date.getDate() &&
        aptDate.getMonth() === date.getMonth() &&
        aptDate.getFullYear() === date.getFullYear() &&
        aptDate.getHours() === hour
      );
    });
  };

  const filteredAppointments = appointments.filter(apt => {
    if (searchQuery && !apt.patientName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (!filters.includes(apt.type)) return false;
    return true;
  });

  const handleDragStart = (e: React.DragEvent, apt: Appointment) => {
    setDraggedApt(apt);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', apt.id);
  };

  const handleDragOver = (e: React.DragEvent, dayIndex: number, hour: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setHoveredSlot({ day: dayIndex, hour });
  };

  const handleDrop = (e: React.DragEvent, date: Date, hour: number) => {
    e.preventDefault();
    setHoveredSlot(null);
    if (!draggedApt) return;

    const targetDate = new Date(date);
    targetDate.setHours(hour, 0, 0, 0);

    const conflict = appointments.find(a => 
      a.id !== draggedApt.id && 
      new Date(a.start).getTime() === targetDate.getTime()
    );

    if (conflict) {
      addToast('error', `Conflit : ${conflict.patientName} est déjà planifié à cet horaire.`);
      setDraggedApt(null);
      return;
    }

    const updatedApt = { 
        ...draggedApt, 
        start: targetDate, 
        status: AppointmentStatus.RESCHEDULED 
    };

    const newAppointments = appointments.map(a => a.id === draggedApt.id ? updatedApt : a);
    setAppointments(newAppointments);
    if (onUpdateAppointment) onUpdateAppointment(updatedApt);
    
    addToast('success', `RDV déplacé au ${targetDate.toLocaleDateString()} à ${hour}h00`);
    setDraggedApt(null);
  };

  const toggleFilter = (type: string) => {
    setFilters(prev => prev.includes(type) ? prev.filter(f => f !== type) : [...prev, type]);
  };

  return (
    <div className="flex h-full bg-white font-sans overflow-hidden rounded-lg shadow-sm border border-slate-200">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-slate-200 bg-white p-6 flex flex-col overflow-y-auto">
        <button 
            onClick={() => onAddAppointment(new Date(), '09:00')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm flex items-center justify-center gap-2 mb-8 transition-all"
        >
            <IconPlus className="w-4 h-4" /> New Event
        </button>

        <MiniCalendar currentDate={currentWeekStart} onDateSelect={setCurrentWeekStart} />

        <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">My Calendar</h3>
                <button className="text-slate-400 hover:text-slate-600"><IconPlus className="w-3 h-3" /></button>
            </div>
            <div className="space-y-1">
                {Object.values(AppointmentType).map((type) => {
                    const style = TYPE_STYLES[type] || TYPE_STYLES['Consultation'];
                    const isActive = filters.includes(type);
                    // Extract color for the checkbox square
                    const colorClass = style.bg.replace('bg-', 'bg-').replace('200', '400');
                    
                    return (
                        <button 
                            key={type}
                            onClick={() => toggleFilter(type)}
                            className="w-full flex items-center gap-3 px-2 py-1.5 rounded-md text-sm transition-colors hover:bg-slate-50 group"
                        >
                            <div className={`w-4 h-4 rounded-[4px] flex items-center justify-center transition-colors ${isActive ? colorClass : 'border border-slate-300 bg-white'}`}>
                                {isActive && <IconCheck className="w-3 h-3 text-white" />}
                            </div>
                            <span className={`truncate ${isActive ? 'text-slate-700' : 'text-slate-400'}`}>{type}</span>
                        </button>
                    );
                })}
            </div>
        </div>
      </aside>

      {/* Main Calendar Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Toolbar */}
        <header className="h-16 border-b border-slate-100 flex items-center justify-between px-6 flex-shrink-0">
            <div className="flex items-center gap-6">
                <h2 className="text-2xl font-bold text-slate-900">
                    {currentWeekStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>
                <div className="flex items-center gap-2">
                    <div className="flex bg-slate-100 p-0.5 rounded-md">
                        <button className="px-3 py-1 text-xs font-medium text-slate-600 hover:bg-white hover:shadow-sm rounded-sm transition-all">Day</button>
                        <button className="px-3 py-1 text-xs font-medium text-slate-900 bg-white shadow-sm rounded-sm transition-all">Week</button>
                        <button className="px-3 py-1 text-xs font-medium text-slate-600 hover:bg-white hover:shadow-sm rounded-sm transition-all">Month</button>
                        <button className="px-3 py-1 text-xs font-medium text-slate-600 hover:bg-white hover:shadow-sm rounded-sm transition-all">Year</button>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="relative">
                    <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Search anything..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-4 py-1.5 bg-slate-50 border-none hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-md text-sm transition-all w-64 outline-none placeholder:text-slate-400"
                    />
                </div>
                <div className="flex gap-1">
                    <button className="p-2 hover:bg-slate-50 rounded text-slate-500" onClick={() => setCurrentWeekStart(new Date(currentWeekStart.setDate(currentWeekStart.getDate() - 7)))}>
                        <IconChevronLeft className="w-4 h-4" />
                    </button>
                    <button className="px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded border border-slate-200" onClick={() => setCurrentWeekStart(new Date())}>Today</button>
                    <button className="p-2 hover:bg-slate-50 rounded text-slate-500" onClick={() => setCurrentWeekStart(new Date(currentWeekStart.setDate(currentWeekStart.getDate() + 7)))}>
                        <IconChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </header>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="min-w-full inline-block align-top">
                {/* Header Row (Days) */}
                <div className="sticky top-0 z-20 flex bg-white pb-2 pt-4">
                    <div className="w-16 flex-shrink-0 text-right pr-4 pt-1 text-xs font-bold text-slate-400">BST</div> 
                    {Array.from({ length: 7 }).map((_, i) => { 
                        const date = getDayDate(i); 
                        const isToday = new Date().toDateString() === date.toDateString();
                        
                        return (
                            <div key={i} className="flex-1 text-center">
                                <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${isToday ? 'text-blue-600' : 'text-slate-400'}`}>
                                    {date.toLocaleDateString('en-US', { weekday: 'short' })} {date.getDate()}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Grid Body */}
                <div className="relative">
                    {/* Horizontal Lines for Hours */}
                    {HOURS.map((hour) => (
                        <div key={hour} className="flex h-[100px]">
                            {/* Time Label */}
                            <div className="w-16 flex-shrink-0 text-right pr-4 text-[10px] font-medium text-slate-400 relative -top-2">
                                {hour > 12 ? hour - 12 : hour} {hour >= 12 ? 'PM' : 'AM'}
                            </div>
                            
                            {/* Grid Lines */}
                            <div className="flex-1 border-t border-slate-100 flex">
                                {Array.from({ length: 7 }).map((_, dayIndex) => (
                                    <div key={dayIndex} className="flex-1 border-r border-slate-50 last:border-r-0 h-full relative">
                                        {/* Drop Zone Logic is handled by the event positioning */}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Events Layer - Absolute Positioning would be ideal, but grid-based is easier for responsiveness in this demo */}
                    <div className="absolute inset-0 top-0 left-16 right-0 flex pointer-events-none">
                         {Array.from({ length: 7 }).map((_, dayIndex) => {
                             const date = getDayDate(dayIndex);
                             const isCurrentDay = date.toDateString() === currentTime.toDateString();

                             return (
                                <div 
                                    key={dayIndex} 
                                    className="flex-1 h-full relative pointer-events-auto"
                                    onDragOver={(e) => { e.preventDefault(); /* Highlight logic */ }}
                                    onDrop={(e) => {
                                        // Need to calculate approximate hour based on Y position
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const y = e.clientY - rect.top;
                                        const hourIndex = Math.floor(y / 100); // 100px per hour
                                        const hour = HOURS[0] + hourIndex;
                                        handleDrop(e, date, hour);
                                    }}
                                    onClick={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const y = e.clientY - rect.top;
                                        const hourIndex = Math.floor(y / 100);
                                        const hour = HOURS[0] + hourIndex;
                                        onAddAppointment(date, `${hour}:00`);
                                    }}
                                >
                                    {/* Current Time Line */}
                                    {isCurrentDay && (
                                        <div 
                                            className="absolute w-full border-t-2 border-blue-500 z-30 flex items-center pointer-events-none"
                                            style={{ 
                                                top: `${((currentTime.getHours() - HOURS[0]) * 100) + ((currentTime.getMinutes() / 60) * 100)}px` 
                                            }}
                                        >
                                            <div className="w-2 h-2 bg-blue-500 rounded-full -ml-1"></div>
                                            <div className="flex-1"></div>
                                        </div>
                                    )}

                                    {/* Events */}
                                    {HOURS.map(hour => {
                                        const slotApts = getAppointmentsForSlot(date, hour);
                                        return slotApts.map(apt => {
                                            const style = TYPE_STYLES[apt.type] || TYPE_STYLES['Consultation'];
                                            // Simple top offset based on hour, should use minutes for better precision
                                            const topOffset = (hour - HOURS[0]) * 100; 
                                            const height = (apt.duration / 60) * 100;

                                            return (
                                                <div
                                                    key={apt.id}
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, apt)}
                                                    onClick={(e) => { e.stopPropagation(); }}
                                                    className={`absolute left-1 right-1 rounded-md p-2 text-xs cursor-pointer shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden ${style.bg} z-10 group`}
                                                    style={{ top: `${topOffset}px`, height: `${height}px` }}
                                                >
                                                    <div className={`font-semibold truncate ${style.text}`}>{apt.patientName}</div>
                                                    <div className={`text-[10px] opacity-80 ${style.text}`}>
                                                        {new Date(apt.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(new Date(apt.start).getTime() + apt.duration*60000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                    </div>
                                                    {apt.duration > 30 && (
                                                        <div className={`mt-1 text-[10px] px-1.5 py-0.5 bg-white/30 rounded inline-block w-fit ${style.text}`}>
                                                            {apt.type}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        });
                                    })}
                                </div>
                             );
                         })}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
