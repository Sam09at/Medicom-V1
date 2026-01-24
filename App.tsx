
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { CalendarView } from './components/CalendarView';
import { Dashboard } from './features/Dashboard';
import { PatientList } from './features/PatientList';
import { Reports } from './features/Reports';
import { Settings } from './features/Settings';
import { Cabinets } from './features/Cabinets';
import { Billing } from './features/Billing';
import { Treatments } from './features/Treatments';
import { MedicalRecord } from './features/MedicalRecord';
import { Documents } from './features/Documents'; 
import { Inventory } from './features/Inventory'; 
import { LabOrders } from './features/LabOrders'; 
import { CRM } from './features/CRM';
import { Support } from './features/Support';
import { WaitingRoom } from './features/WaitingRoom';
import { Consultation } from './features/Consultation'; 
import { SaaSAdministration } from './features/SaaSAdministration'; 
import { SuperAdminDashboard } from './features/SuperAdminDashboard';
import { SlideOver } from './components/SlideOver';
import { CommandPalette } from './components/CommandPalette';
import { IconCheck, IconCalendar, IconUserPlus, IconClock } from './components/Icons';

import { ToastContainer } from './components/Toast';
import { CURRENT_USER_ADMIN, CURRENT_USER_DOCTOR, MOCK_APPOINTMENTS, MOCK_PATIENTS } from './constants';
import { User, CabinetStats, Appointment, ToastMessage, SearchResult, AppointmentStatus, ToastType, AppointmentType } from './types';

// Mock stats for dashboard
const INITIAL_STATS: CabinetStats = {
  appointmentsToday: 8,
  pendingConfirmations: 3,
  revenueToday: 4200,
  activeTreatments: 142,
  waitingRoom: 1 // Initial value
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [appointments, setAppointments] = useState<Appointment[]>(MOCK_APPOINTMENTS);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [activeConsultation, setActiveConsultation] = useState<Appointment | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Appointment Form State
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [newAppointmentData, setNewAppointmentData] = useState({
      patientId: '',
      type: AppointmentType.CONSULTATION,
      date: '',
      time: '',
      duration: 30,
      notes: ''
  });

  const stats = {
      ...INITIAL_STATS,
      waitingRoom: appointments.filter(a => a.status === AppointmentStatus.ARRIVED).length
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const addToast = (type: ToastType, message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const updateAppointmentStatus = (id: string, status: AppointmentStatus) => {
     setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
     
     if (status === AppointmentStatus.IN_PROGRESS) {
         const apt = appointments.find(a => a.id === id);
         if (apt) {
             setActiveConsultation(apt);
             addToast('info', `Consultation démarrée avec ${apt.patientName}`);
         }
     } else {
        addToast('success', `Statut mis à jour : ${status}`);
     }
  };

  const handleGlobalSearch = (query: string): SearchResult[] => {
    const lowerQuery = query.toLowerCase();
    const results: SearchResult[] = [];

    // Search Patients
    MOCK_PATIENTS.forEach(p => {
        if (p.firstName.toLowerCase().includes(lowerQuery) || p.lastName.toLowerCase().includes(lowerQuery) || p.phone.includes(lowerQuery)) {
            results.push({
                id: p.id,
                type: 'Patient',
                title: `${p.firstName} ${p.lastName}`,
                subtitle: p.phone,
            });
        }
    });

    // Search Appointments
    appointments.forEach(a => {
        if (a.patientName.toLowerCase().includes(lowerQuery) || a.type.toLowerCase().includes(lowerQuery)) {
            results.push({
                id: a.id,
                type: 'RDV',
                title: `${a.type} - ${a.patientName}`,
                subtitle: `${new Date(a.start).toLocaleDateString()} ${new Date(a.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`,
            });
        }
    });

    return results.slice(0, 10);
  };

  // Triggered from Calendar Grid click
  const handleOpenAddAppointment = (date: Date, time: string) => {
    setNewAppointmentData({
        patientId: '',
        type: AppointmentType.CONSULTATION,
        date: date.toISOString().split('T')[0],
        time: time,
        duration: 30,
        notes: ''
    });
    setIsAppointmentModalOpen(true);
  };

  const handleSubmitAppointment = (e: React.FormEvent) => {
      e.preventDefault();
      const patient = MOCK_PATIENTS.find(p => p.id === newAppointmentData.patientId);
      if (!patient) {
          addToast('error', 'Veuillez sélectionner un patient');
          return;
      }

      const [hours, minutes] = newAppointmentData.time.split(':').map(Number);
      const start = new Date(newAppointmentData.date);
      start.setHours(hours, minutes);

      const newApt: Appointment = {
          id: `apt-${Date.now()}`,
          patientId: patient.id,
          doctorId: user?.id || 'u1',
          start: start,
          duration: newAppointmentData.duration,
          type: newAppointmentData.type,
          status: AppointmentStatus.PENDING,
          patientName: `${patient.firstName} ${patient.lastName}`,
          notes: newAppointmentData.notes
      };

      setAppointments([...appointments, newApt]);
      setIsAppointmentModalOpen(false);
      addToast('success', 'Rendez-vous planifié avec succès');
  };

  // Simple Login Screen
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
           <div className="inline-flex justify-center mb-8">
             <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-2xl shadow-sm shadow-blue-200">M</div>
           </div>
           <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Connexion Medicom</h2>
           <p className="mt-2 text-sm text-slate-500">
             Choisissez un profil de démonstration pour accéder à la plateforme.
           </p>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-sm border border-slate-200 rounded-lg sm:px-10 space-y-4">
             <button 
               onClick={() => { setUser(CURRENT_USER_DOCTOR); setCurrentView('dashboard'); }}
               className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-md hover:border-blue-500 hover:bg-blue-50/30 transition-all group bg-white"
             >
               <div className="flex items-center gap-4">
                 <img src={CURRENT_USER_DOCTOR.avatar} className="w-10 h-10 rounded-full bg-slate-100 object-cover" alt="" />
                 <div className="text-left">
                   <p className="font-semibold text-slate-900 group-hover:text-blue-700">Dr. Amina</p>
                   <p className="text-xs text-slate-500">Cabinet Dentaire</p>
                 </div>
               </div>
               <span className="text-blue-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">Login &rarr;</span>
             </button>

             <button 
               onClick={() => { setUser(CURRENT_USER_ADMIN); setCurrentView('saas-dashboard'); }}
               className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-md hover:border-indigo-500 hover:bg-indigo-50/30 transition-all group bg-white"
             >
               <div className="flex items-center gap-4">
                 <img src={CURRENT_USER_ADMIN.avatar} className="w-10 h-10 rounded-full bg-slate-100 object-cover" alt="" />
                 <div className="text-left">
                   <p className="font-semibold text-slate-900 group-hover:text-indigo-700">Sami</p>
                   <p className="text-xs text-slate-500">Super Admin SaaS</p>
                 </div>
               </div>
               <span className="text-indigo-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">Login &rarr;</span>
             </button>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
      // Safety check: ensure user exists before rendering content
      if (!user) return null;

      // Super Admin Views
      if (user.role === 'SUPER_ADMIN') {
          switch (currentView) {
              case 'saas-dashboard': return <SuperAdminDashboard />;
              case 'cabinets': return <Cabinets />;
              case 'saas-admin': return <SaaSAdministration />;
              case 'crm': return <CRM />;
              case 'reports': return <Reports user={user} />;
              case 'support': return <Support user={user} />;
              case 'settings': return <Settings />;
              default: return <SuperAdminDashboard />;
          }
      }

      // Doctor Views
      switch (currentView) {
        case 'dashboard': return <Dashboard stats={stats} />;
        case 'calendar': return <CalendarView appointments={appointments} onAddAppointment={handleOpenAddAppointment} addToast={addToast} />;
        case 'waiting-room': return <WaitingRoom appointments={appointments} onUpdateStatus={updateAppointmentStatus} />; 
        case 'patients': return <PatientList patients={MOCK_PATIENTS} />;
        case 'treatments': return <Treatments />;
        case 'inventory': return <Inventory />; 
        case 'lab-orders': return <LabOrders />; 
        case 'records': return <MedicalRecord />;
        case 'documents': return <Documents />; 
        case 'billing': return <Billing />;
        case 'reports': return <Reports user={user} />;
        case 'support': return <Support user={user} />;
        case 'settings': return <Settings />;
        default: return <div className="flex items-center justify-center h-full text-slate-400">Module en construction (MVP)</div>;
      }
  };

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* Active Consultation Overlay */}
      <SlideOver 
         isOpen={!!activeConsultation} 
         onClose={() => setActiveConsultation(null)}
         title="Consultation en cours"
         subtitle={`${activeConsultation?.patientName} • ${activeConsultation?.type}`}
         width="2xl"
      >
         {activeConsultation && (
             <Consultation 
                patient={MOCK_PATIENTS.find(p => p.id === activeConsultation.patientId) || MOCK_PATIENTS[0]} 
                appointment={activeConsultation}
                onFinish={() => {
                    updateAppointmentStatus(activeConsultation.id, AppointmentStatus.COMPLETED);
                    setActiveConsultation(null);
                    addToast('success', 'Consultation terminée');
                }}
             />
         )}
      </SlideOver>

      {/* Appointment Creation SlideOver */}
      <SlideOver
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        title="Nouveau Rendez-vous"
        subtitle="Planifier une consultation"
      >
          <form onSubmit={handleSubmitAppointment} className="p-6 space-y-6">
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Patient</label>
                  <select 
                    required
                    className="w-full border-slate-300 rounded-md p-2.5 text-sm border focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    value={newAppointmentData.patientId}
                    onChange={e => setNewAppointmentData({...newAppointmentData, patientId: e.target.value})}
                  >
                      <option value="">Sélectionner un patient...</option>
                      {MOCK_PATIENTS.map(p => (
                          <option key={p.id} value={p.id}>{p.firstName} {p.lastName} - {p.phone}</option>
                      ))}
                  </select>
                  <button type="button" className="text-xs text-blue-600 mt-1 hover:underline flex items-center gap-1">
                      <IconUserPlus className="w-3 h-3" /> Nouveau patient ?
                  </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                      <input 
                        type="date" 
                        required
                        className="w-full border-slate-300 rounded-md p-2.5 text-sm border focus:ring-2 focus:ring-blue-500 outline-none"
                        value={newAppointmentData.date}
                        onChange={e => setNewAppointmentData({...newAppointmentData, date: e.target.value})}
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Heure</label>
                      <input 
                        type="time" 
                        required
                        className="w-full border-slate-300 rounded-md p-2.5 text-sm border focus:ring-2 focus:ring-blue-500 outline-none"
                        value={newAppointmentData.time}
                        onChange={e => setNewAppointmentData({...newAppointmentData, time: e.target.value})}
                      />
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                      <select 
                        className="w-full border-slate-300 rounded-md p-2.5 text-sm border focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        value={newAppointmentData.type}
                        onChange={e => setNewAppointmentData({...newAppointmentData, type: e.target.value as AppointmentType})}
                      >
                          {Object.values(AppointmentType).map(t => (
                              <option key={t} value={t}>{t}</option>
                          ))}
                      </select>
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Durée (min)</label>
                      <select 
                        className="w-full border-slate-300 rounded-md p-2.5 text-sm border focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        value={newAppointmentData.duration}
                        onChange={e => setNewAppointmentData({...newAppointmentData, duration: parseInt(e.target.value)})}
                      >
                          <option value="15">15 min</option>
                          <option value="30">30 min</option>
                          <option value="45">45 min</option>
                          <option value="60">1h 00</option>
                          <option value="90">1h 30</option>
                      </select>
                  </div>
              </div>

              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                  <textarea 
                    rows={3}
                    className="w-full border-slate-300 rounded-md p-2.5 text-sm border focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Motif de la consultation..."
                    value={newAppointmentData.notes}
                    onChange={e => setNewAppointmentData({...newAppointmentData, notes: e.target.value})}
                  />
              </div>

              <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsAppointmentModalOpen(false)} className="flex-1 py-2.5 text-sm font-medium text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors">Annuler</button>
                  <button type="submit" className="flex-1 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 shadow-sm flex justify-center items-center gap-2 transition-colors">
                      <IconCalendar className="w-4 h-4" /> Confirmer le RDV
                  </button>
              </div>
          </form>
      </SlideOver>

      {/* Global Command Palette */}
      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={setCurrentView}
      />

      <Layout 
        user={user} 
        onLogout={() => setUser(null)}
        currentView={currentView}
        onChangeView={setCurrentView}
        onSearch={handleGlobalSearch}
      >
        {renderContent()}
      </Layout>
    </>
  );
}

export default App;
