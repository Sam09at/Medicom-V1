import React, { useState } from 'react';
import { Appointment, AppointmentStatus, AppointmentType } from '../types';
import { IconPlus } from './Icons';

interface CalendarViewProps {
  appointments: Appointment[];
  onAddAppointment: (date: Date, time: string) => void;
}

const HOURS = Array.from({ length: 11 }, (_, i) => i + 8); // 8:00 to 18:00
const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

const TYPE_COLORS: Record<string, string> = {
    'Consultation': 'bg-blue-100 text-blue-700 border-blue-200',
    'Séance Traitement': 'bg-indigo-100 text-indigo-700 border-indigo-200',
    'Contrôle': 'bg-slate-100 text-slate-700 border-slate-200',
    'Urgence': 'bg-red-100 text-red-700 border-red-200',
};

export const CalendarView: React.FC<CalendarViewProps> = ({ appointments, onAddAppointment }) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());

  const getDayDate = (dayIndex: number) => {
    const d = new Date(currentWeekStart);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) + dayIndex;
    return new Date(d.setDate(diff));
  };

  const getAppointmentsForSlot = (dayIndex: number, hour: number) => {
    const date = getDayDate(dayIndex);
    return appointments.filter(apt => {
      const aptDate = new Date(apt.start);
      return (
        aptDate.getDate() === date.getDate() &&
        aptDate.getMonth() === date.getMonth() &&
        aptDate.getHours() === hour
      );
    });
  };

  return (
    <div className="bg-white rounded-md border border-slate-200 flex flex-col h-full overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-4">
           <span className="text-lg font-semibold text-slate-800">
             {getDayDate(0).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
           </span>
           <div className="flex items-center bg-slate-100 rounded-md p-0.5">
             <button className="p-1.5 hover:bg-white rounded text-slate-500 hover:text-slate-900 transition-all shadow-sm" onClick={() => setCurrentWeekStart(new Date(currentWeekStart.setDate(currentWeekStart.getDate() - 7)))}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
             </button>
             <button className="px-3 py-1 text-xs font-medium text-slate-700" onClick={() => setCurrentWeekStart(new Date())}>Aujourd'hui</button>
             <button className="p-1.5 hover:bg-white rounded text-slate-500 hover:text-slate-900 transition-all shadow-sm" onClick={() => setCurrentWeekStart(new Date(currentWeekStart.setDate(currentWeekStart.getDate() + 7)))}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
             </button>
           </div>
        </div>
        
        <div className="flex gap-3">
           <div className="flex bg-slate-100 rounded-md p-0.5">
               <button className="px-3 py-1 text-xs font-medium bg-white text-slate-900 rounded shadow-sm border border-slate-200">Semaine</button>
               <button className="px-3 py-1 text-xs font-medium text-slate-500 hover:text-slate-900">Mois</button>
               <button className="px-3 py-1 text-xs font-medium text-slate-500 hover:text-slate-900">Jour</button>
           </div>
           <button 
             onClick={() => onAddAppointment(new Date(), '09:00')}
             className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-blue-700 transition-colors shadow-sm"
           >
             <IconPlus className="w-3.5 h-3.5" />
             Nouveau RDV
           </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-white">
        <div className="min-w-[800px]">
          {/* Header Days */}
          <div className="grid grid-cols-7 border-b border-slate-200 sticky top-0 bg-white z-10">
            <div className="w-14 p-2 border-r border-slate-100"></div> 
            {DAYS.map((day, i) => {
              const date = getDayDate(i);
              const isToday = new Date().toDateString() === date.toDateString();
              return (
                <div key={day} className={`py-3 px-2 text-center border-r border-slate-100 ${isToday ? 'bg-blue-50/30' : ''}`}>
                  <div className={`text-[10px] font-semibold uppercase tracking-wider ${isToday ? 'text-blue-600' : 'text-slate-400'}`}>{day}</div>
                  <div className={`mt-1 text-sm font-medium ${isToday ? 'text-blue-700 bg-blue-100 inline-block w-7 h-7 leading-7 rounded-full' : 'text-slate-700'}`}>{date.getDate()}</div>
                </div>
              );
            })}
          </div>

          {/* Time Grid */}
          <div className="relative">
             {HOURS.map(hour => (
               <div key={hour} className="grid grid-cols-7 min-h-[100px]">
                 <div className="w-14 border-r border-b border-slate-100 p-2 text-[10px] text-slate-400 text-right sticky left-0 bg-white">
                   {hour}:00
                 </div>
                 {DAYS.map((_, dayIndex) => {
                   const slotApts = getAppointmentsForSlot(dayIndex, hour);
                   return (
                     <div 
                       key={`${dayIndex}-${hour}`} 
                       className="border-r border-b border-slate-100 relative p-1 transition-colors hover:bg-slate-50/50 group"
                       onClick={() => onAddAppointment(getDayDate(dayIndex), `${hour}:00`)}
                     >
                       
                       {slotApts.map(apt => (
                         <div 
                           key={apt.id}
                           onClick={(e) => { e.stopPropagation(); alert(`RDV: ${apt.patientName}`); }}
                           className={`mb-1 p-2 rounded border-l-2 text-xs cursor-pointer hover:opacity-90 transition-opacity ${TYPE_COLORS[apt.type] || 'bg-slate-100 text-slate-700 border-slate-300'}`}
                         >
                           <div className="font-semibold truncate leading-tight">{apt.patientName}</div>
                           <div className="flex justify-between items-center mt-1 text-[10px] opacity-80">
                             <span>{apt.type}</span>
                             <span>{apt.duration}m</span>
                           </div>
                         </div>
                       ))}
                       
                       {slotApts.length === 0 && (
                           <div className="opacity-0 group-hover:opacity-100 absolute inset-0 flex items-center justify-center pointer-events-none">
                             <div className="w-full h-full border-2 border-dashed border-blue-100 bg-blue-50/10 m-1 rounded"></div>
                           </div>
                       )}
                     </div>
                   );
                 })}
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};