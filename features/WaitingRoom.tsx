import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Appointment, AppointmentStatus } from '../types';
import {
  IconClock,
  IconMegaphone,
  IconCheckCircle,
  IconMonitor,
  IconX,
  IconFilter,
  IconSortAsc,
  IconPlus,
  IconCalendar,
} from '../components/Icons';
import { useAppointments } from '../hooks/useAppointments';
import { useMedicomStore } from '../store';

const COLUMNS = [
  { id: AppointmentStatus.PENDING, label: 'À venir', countBg: 'bg-slate-100 text-slate-600' },
  {
    id: AppointmentStatus.ARRIVED,
    label: "En salle d'attente",
    countBg: 'bg-blue-100 text-blue-700',
  },
  {
    id: AppointmentStatus.IN_PROGRESS,
    label: 'En consultation',
    countBg: 'bg-purple-100 text-purple-700',
  },
  { id: AppointmentStatus.COMPLETED, label: 'Terminé', countBg: 'bg-green-100 text-green-700' },
];

export const WaitingRoom: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, waitingRoomFilter, setWaitingRoomFilter, showToast } = useMedicomStore();

  // Fetch appointments for today
  const today = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }, []);

  const { appointments, updateAppointment, loading } = useAppointments({
    startDate: today.start,
    endDate: today.end,
  });

  const filteredAppointments = useMemo(() => {
    if (currentUser?.role !== 'doctor' || waitingRoomFilter === 'all') {
      return appointments;
    }
    return appointments.filter((apt) => apt.doctorId === currentUser?.id);
  }, [appointments, currentUser, waitingRoomFilter]);

  const [draggedApt, setDraggedApt] = useState<Appointment | null>(null);
  const [isTvMode, setIsTvMode] = useState(false);

  const handleDragStart = (e: React.DragEvent, apt: Appointment) => {
    setDraggedApt(apt);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', apt.id);
  };

  const handleDrop = async (e: React.DragEvent, status: AppointmentStatus) => {
    e.preventDefault();
    if (draggedApt && draggedApt.status !== status) {
      try {
        await updateAppointment(draggedApt.id, { status });
      } catch (err) {
        console.error('Failed to update status', err);
      }
    }
    setDraggedApt(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleCallPatient = async (apt: Appointment) => {
    if (confirm(`Appeler ${apt.patientName} et démarrer la consultation ?`)) {
      try {
        await updateAppointment(apt.id, { status: AppointmentStatus.IN_PROGRESS });
        navigate(`/app/consultation/${apt.id}`);
      } catch (err) {
        console.error('Failed to start consultation', err);
      }
    }
  };

  const getWaitTime = (start: Date) => {
    const diff = Math.floor((new Date().getTime() - new Date(start).getTime()) / 60000);
    return diff > 0 ? diff : 0;
  };

  if (loading && filteredAppointments.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500">Chargement de la salle d'attente...</div>
    );
  }

  if (isTvMode) {
    const currentCall = filteredAppointments
      .filter((a) => a.status === AppointmentStatus.IN_PROGRESS)
      .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime())[0];
    const waiting = filteredAppointments
      .filter(
        (a) => a.status === AppointmentStatus.ARRIVED || a.status === AppointmentStatus.PENDING
      )
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    return (
      <div className="fixed inset-0 z-[100] bg-slate-900 text-white flex flex-col p-8 font-sans cursor-none">
        <button
          onClick={() => setIsTvMode(false)}
          className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 z-50 cursor-pointer"
        >
          <IconX className="w-6 h-6" />
        </button>

        <div className="flex-1 flex gap-8">
          <div className="w-2/3 bg-blue-600 rounded-[20px] flex flex-col items-center justify-center p-12 relative overflow-hidden">
            <div className="relative z-10 text-center">
              <h2 className="text-3xl font-medium text-blue-100 uppercase tracking-widest mb-8">
                Patient Appelé
              </h2>
              {currentCall ? (
                <>
                  <div className="text-8xl font-bold mb-6">{currentCall.patientName}</div>
                  <div className="text-4xl bg-white/20 px-8 py-3 rounded-full inline-block">
                    Cabinet 1
                  </div>
                </>
              ) : (
                <div className="text-5xl font-light italic opacity-70">En attente...</div>
              )}
            </div>
          </div>

          <div className="w-1/3 bg-slate-800 rounded-[20px] p-8 flex flex-col border border-slate-700">
            <h3 className="text-2xl font-bold text-slate-400 mb-6 uppercase tracking-wide border-b border-slate-700 pb-4">
              Prochains Patients
            </h3>
            <div className="space-y-4 flex-1 overflow-hidden">
              {waiting.length > 0 ? (
                waiting.slice(0, 5).map((apt, i) => (
                  <div
                    key={apt.id}
                    className="flex items-center gap-4 p-4 bg-slate-700/50 rounded-[20px]"
                  >
                    <div className="w-12 h-12 bg-slate-600 rounded-full flex items-center justify-center font-bold text-xl">
                      {i + 1}
                    </div>
                    <div className="text-2xl font-medium">{apt.patientName}</div>
                    <div className="ml-auto text-lg text-slate-400">
                      {new Date(apt.start).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                ))
              ) : (
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
      <div className="flex items-center justify-between mb-4 bg-white p-2 rounded-[20px] border border-slate-200 ">
        <div className="flex items-center gap-4 px-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-[20px]">
              <IconMonitor className="w-4 h-4" />
            </span>
            <span className="font-bold text-sm text-slate-900">File d'Attente</span>
          </div>
          <div className="h-4 w-px bg-slate-200"></div>
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <IconCalendar className="w-4 h-4" />
            <span>
              Aujourd'hui,{' '}
              {new Date().toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </span>
          </div>

          {currentUser?.role === 'doctor' && (
            <>
              <div className="h-4 w-px bg-slate-200 mx-2"></div>
              <div className="flex bg-slate-100 p-0.5 rounded-[20px] border border-slate-200">
                <button
                  onClick={() => setWaitingRoomFilter('all')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-[30px] transition-all ${
                    waitingRoomFilter === 'all'
                      ? 'bg-white text-slate-900 '
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Tous les patients
                </button>
                <button
                  onClick={() => setWaitingRoomFilter('my_patients')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-[30px] transition-all ${
                    waitingRoomFilter === 'my_patients'
                      ? 'bg-white text-slate-900 '
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Mes patients
                </button>
              </div>
            </>
          )}
        </div>
        <button
          onClick={() => setIsTvMode(true)}
          className="flex items-center gap-2 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-[30px] transition-colors "
        >
          <IconMonitor className="w-3.5 h-3.5" /> Mode TV
        </button>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex h-full gap-6 min-w-[1000px] p-2">
          {COLUMNS.map((col) => {
            const items = filteredAppointments
              .filter((a) => a.status === col.id)
              .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

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
                  <div className="border-2 border-dashed border-indigo-200 rounded-[20px] h-12 mb-3 bg-indigo-50/30 flex items-center justify-center">
                    <span className="text-xs text-indigo-400 font-medium">Déposer ici</span>
                  </div>
                )}

                {/* Cards List */}
                <div className="flex-1 overflow-y-auto px-1 pb-2 space-y-3 scrollbar-hide">
                  {items.map((apt) => {
                    const waitTime = getWaitTime(apt.start);
                    const isArrived = col.id === AppointmentStatus.ARRIVED;

                    let waitColor = 'text-green-600 bg-green-50 border-green-100';
                    if (waitTime >= 10 && waitTime <= 20)
                      waitColor = 'text-orange-600 bg-orange-50 border-orange-100';
                    else if (waitTime > 20)
                      waitColor = 'text-red-600 bg-red-50 border-red-100 animate-pulse';

                    return (
                      <div
                        key={apt.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, apt)}
                        className={`bg-white p-4 rounded-[20px] border border-slate-100  hover: cursor-grab active:cursor-grabbing transition-all group relative flex flex-col ${draggedApt?.id === apt.id ? 'opacity-50 rotate-3 scale-95' : ''}`}
                      >
                        {/* Header: Type Tag & Options */}
                        <div className="flex justify-between items-start mb-3">
                          <span
                            className={`px-2 py-1 rounded-[30px] text-[10px] font-bold uppercase tracking-wide ${
                              apt.type === 'Consultation'
                                ? 'bg-blue-50 text-blue-600'
                                : apt.type === 'Urgence'
                                  ? 'bg-red-50 text-red-600'
                                  : 'bg-purple-50 text-purple-600'
                            }`}
                          >
                            {apt.type}
                          </span>
                          {isArrived && (
                            <div
                              className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border ${waitColor}`}
                            >
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
                        <div className="flex items-center justify-between pt-3 border-t border-slate-50 mt-auto">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-600 border border-white ">
                              {apt.patientName.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="text-[10px] font-medium text-slate-400">
                              {new Date(apt.start).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          {/* Action Button based on status - Staff View */}
                          {currentUser?.role !== 'doctor' &&
                            col.id === AppointmentStatus.ARRIVED && (
                              <button
                                onClick={() => handleCallPatient(apt)}
                                className="p-1.5 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-600 hover:text-white transition-all "
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

                        {/* Doctor Quick Actions */}
                        {currentUser?.role === 'doctor' &&
                          (col.id === AppointmentStatus.PENDING ||
                            col.id === AppointmentStatus.ARRIVED) && (
                            <div className="flex gap-2 mt-3 pt-3 border-t border-slate-50 w-full">
                              <button
                                onClick={async () => {
                                  await updateAppointment(apt.id, {
                                    status: AppointmentStatus.IN_PROGRESS,
                                  });
                                  navigate(`/app/consultation/${apt.id}`);
                                }}
                                className="flex-1 text-[10px] font-medium py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded transition-colors text-center"
                              >
                                Commencer
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm('Voulez-vous reporter ce rendez-vous ?')) {
                                    updateAppointment(apt.id, {
                                      status: AppointmentStatus.RESCHEDULED,
                                    });
                                    showToast({ type: 'info', message: 'Rendez-vous reporté.' });
                                  }
                                }}
                                className="flex-1 text-[10px] font-medium py-1.5 bg-slate-50 text-slate-600 hover:bg-slate-200 rounded transition-colors text-center border border-slate-200"
                              >
                                Reporter
                              </button>
                            </div>
                          )}
                      </div>
                    );
                  })}
                  {items.length === 0 && (
                    <div className="h-24 border-2 border-dashed border-slate-100 rounded-[30px] flex flex-col items-center justify-center text-xs text-slate-300 gap-1">
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
