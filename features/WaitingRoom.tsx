
import React, { useState } from 'react';
import { Appointment, AppointmentStatus } from '../types';
import { IconClock, IconArrowRight, IconMegaphone, IconCheckCircle, IconMonitor, IconX, IconFilter, IconSettings, IconSortAsc, IconMoreHorizontal, IconPlus } from '../components/Icons';

interface WaitingRoomProps {
  appointments: Appointment[];
  onUpdateStatus: (id: string, status: AppointmentStatus) => void;
}

const COLUMNS = [
  { id: AppointmentStatus.PENDING, label: 'À venir', countBg: 'bg-slate-100 text-slate-600' },
  { id: AppointmentStatus.ARRIVED, label: 'En salle d\'attente', countBg: 'bg-blue-100 text-blue-700' },
  { id: AppointmentStatus.IN_PROGRESS, label: 'En consultation', countBg: 'bg-purple-100 text-purple-700' },
  { id: AppointmentStatus.COMPLETED, label: 'Terminé', countBg: 'bg-green-100 text-green-700' },
];

export const WaitingRoom: React.FC<WaitingRoomProps> = ({ appointments, onUpdateStatus }) => {
  const [draggedApt, setDraggedApt] = useState<Appointment | null>(null);
  const [isTvMode, setIsTvMode] = useState(false);

  const handleDragStart = (e: React.DragEvent, apt: Appointment) => {
    setDraggedApt(apt);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', apt.id);
  };

  const handleDrop = (e: React.DragEvent, status: AppointmentStatus) => {
    e.preventDefault();
    if (draggedApt && draggedApt.status !== status) {
      onUpdateStatus(draggedApt.id, status);
    }
    setDraggedApt(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleCallPatient = (name: string) => {
      alert(`Appel patient : ${name} au cabinet 1`);
  };

  const getWaitTime = (start: Date) => {
      const diff = Math.floor((new Date().getTime() - new Date(start).getTime()) / 60000);
      return diff > 0 ? diff : 0; 
  };

  if (isTvMode) {
      const currentCall = appointments.filter(a => a.status === AppointmentStatus.IN_PROGRESS).pop();
      const waiting = appointments.filter(a => a.status === AppointmentStatus.ARRIVED);

      return (
          <div className="fixed inset-0 z-[100] bg-slate-900 text-white flex flex-col p-8 font-sans cursor-none">
              <button onClick={() => setIsTvMode(false)} className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 z-50 cursor-pointer">
                  <IconX className="w-6 h-6" />
              </button>
              
              <div className="flex-1 flex gap-8">
                  <div className="w-2/3 bg-blue-600 rounded-3xl flex flex-col items-center justify-center p-12 shadow-2xl relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-700 opacity-50"></div>
                      <div className="relative z-10 text-center">
                          <h2 className="text-3xl font-medium text-blue-100 uppercase tracking-widest mb-8">Patient Appelé</h2>
                          {currentCall ? (
                              <>
                                <div className="text-8xl font-bold mb-6">{currentCall.patientName}</div>
                                <div className="text-4xl bg-white/20 px-8 py-3 rounded-full inline-block">Cabinet 1</div>
                              </>
                          ) : (
                              <div className="text-5xl font-light italic opacity-70">En attente...</div>
                          )}
                      </div>
                  </div>

                  <div className="w-1/3 bg-slate-800 rounded-3xl p-8 flex flex-col border border-slate-700">
                      <h3 className="text-2xl font-bold text-slate-400 mb-6 uppercase tracking-wide border-b border-slate-700 pb-4">Prochains Patients</h3>
                      <div className="space-y-4 flex-1 overflow-hidden">
                          {waiting.length > 0 ? waiting.slice(0, 5).map((apt, i) => (
                              <div key={apt.id} className="flex items-center gap-4 p-4 bg-slate-700/50 rounded-xl">
                                  <div className="w-12 h-12 bg-slate-600 rounded-full flex items-center justify-center font-bold text-xl">{i + 1}</div>
                                  <div className="text-2xl font-medium">{apt.patientName}</div>
                              </div>
                          )) : (
                              <div className="text-slate-500 italic text-xl">Aucun patient en attente</div>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="h-full flex flex-col font-sans">
       {/* Header Toolbar */}
       <div className="flex items-center justify-between mb-4 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 px-2">
             <div className="flex items-center gap-2">
                <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md"><IconMonitor className="w-4 h-4" /></span>
                <span className="font-bold text-sm text-slate-900">File d'Attente</span>
             </div>
             <div className="h-4 w-px bg-slate-200"></div>
             <div className="flex items-center gap-1 text-slate-500">
                 <button className="flex items-center gap-1 px-2 py-1 hover:bg-slate-50 rounded text-xs font-medium"><IconFilter className="w-3.5 h-3.5" /> Filter</button>
                 <button className="flex items-center gap-1 px-2 py-1 hover:bg-slate-50 rounded text-xs font-medium"><IconSortAsc className="w-3.5 h-3.5" /> Sort</button>
             </div>
          </div>
          <button 
            onClick={() => setIsTvMode(true)}
            className="flex items-center gap-2 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md transition-colors shadow-sm"
          >
              <IconMonitor className="w-3.5 h-3.5" /> Mode TV
          </button>
       </div>

       {/* Kanban Board */}
       <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex h-full gap-6 min-w-[1000px] p-2">
              {COLUMNS.map(col => {
                  const items = appointments.filter(a => a.status === col.id);
                  const isPending = col.id === AppointmentStatus.PENDING;
                  const isDone = col.id === AppointmentStatus.COMPLETED;
                  
                  return (
                     <div 
                       key={col.id} 
                       className="flex-1 flex flex-col min-w-[280px]"
                       onDragOver={handleDragOver}
                       onDrop={(e) => handleDrop(e, col.id)}
                     >
                        {/* Modern Column Header */}
                        <div className="flex items-center justify-between mb-4 px-1">
                           <div className="flex items-center gap-2">
                               <span className={`text-sm font-bold text-slate-700`}>{col.label}</span>
                               <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                   {items.length}
                               </span>
                           </div>
                           <button className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded transition-colors">
                               <IconPlus className="w-4 h-4" />
                           </button>
                        </div>

                        {/* Drop Zone Visual */}
                        {draggedApt && (
                            <div className="border-2 border-dashed border-indigo-200 rounded-xl h-12 mb-3 bg-indigo-50/30 flex items-center justify-center">
                                <span className="text-xs text-indigo-400 font-medium">Déposer ici</span>
                            </div>
                        )}

                        {/* Cards List */}
                        <div className="flex-1 overflow-y-auto px-1 pb-2 space-y-3 scrollbar-hide">
                           {items.map(apt => {
                              const waitTime = getWaitTime(apt.start);
                              const isLate = waitTime > 20 && (col.id === AppointmentStatus.ARRIVED || col.id === AppointmentStatus.IN_PROGRESS);
                              
                              return (
                              <div 
                                key={apt.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, apt)}
                                className={`bg-white p-4 rounded-xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] cursor-grab active:cursor-grabbing transition-all group relative ${draggedApt?.id === apt.id ? 'opacity-50 rotate-3 scale-95' : ''}`}
                              >
                                 {/* Header: Type Tag & Options */}
                                 <div className="flex justify-between items-start mb-3">
                                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide ${
                                        apt.type === 'Consultation' ? 'bg-blue-50 text-blue-600' :
                                        apt.type === 'Urgence' ? 'bg-red-50 text-red-600' :
                                        'bg-purple-50 text-purple-600'
                                    }`}>
                                        {apt.type}
                                    </span>
                                    {isLate && (
                                        <div className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100 animate-pulse">
                                            <IconClock className="w-3 h-3" /> {waitTime} min
                                        </div>
                                    )}
                                 </div>
                                 
                                 {/* Content */}
                                 <h4 className="font-bold text-slate-900 text-sm mb-1">{apt.patientName}</h4>
                                 <p className="text-xs text-slate-500 mb-4 flex items-center gap-1.5">
                                     <IconMonitor className="w-3 h-3 text-slate-400" /> Dr. Amina • Cabinet 1
                                 </p>

                                 {/* Footer Actions / Info */}
                                 <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                     <div className="flex items-center gap-2">
                                         <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-600 border border-white shadow-sm">
                                             {apt.patientName.substring(0,2).toUpperCase()}
                                         </div>
                                         <span className="text-[10px] font-medium text-slate-400">
                                             {new Date(apt.start).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                         </span>
                                     </div>

                                     {/* Action Button based on status */}
                                     {col.id === AppointmentStatus.ARRIVED && (
                                         <button 
                                            onClick={() => handleCallPatient(apt.patientName)}
                                            className="p-1.5 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                            title="Appeler Patient"
                                         >
                                             <IconMegaphone className="w-3.5 h-3.5" />
                                         </button>
                                     )}
                                     {col.id === AppointmentStatus.PENDING && (
                                         <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                                     )}
                                     {col.id === AppointmentStatus.COMPLETED && (
                                         <div className="p-1 bg-green-50 text-green-600 rounded-full">
                                             <IconCheckCircle className="w-3.5 h-3.5" />
                                         </div>
                                     )}
                                 </div>
                              </div>
                           )})}
                           {items.length === 0 && (
                               <div className="h-24 border-2 border-dashed border-slate-100 rounded-xl flex flex-col items-center justify-center text-xs text-slate-300 gap-1">
                                   <IconMonitor className="w-5 h-5 opacity-50" />
                                   <span>Aucun patient</span>
                               </div>
                           )}
                        </div>
                     </div>
                  );
              })}
          </div>
       </div>
    </div>
  );
};
