import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { CalendarView } from './components/CalendarView';
import { Dashboard } from './features/Dashboard';
import { PatientList } from './features/PatientList';
import { Reports } from './features/Reports';
import { Settings } from './features/Settings';
import { SuperAdminDashboard } from './features/SuperAdminDashboard';
import { CURRENT_USER_ADMIN, CURRENT_USER_DOCTOR, MOCK_APPOINTMENTS, MOCK_PATIENTS } from './constants';
import { User, CabinetStats, Appointment } from './types';

// Mock stats for dashboard
const STATS: CabinetStats = {
  appointmentsToday: 8,
  pendingConfirmations: 3,
  revenueToday: 4200,
  activeTreatments: 142
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [appointments, setAppointments] = useState<Appointment[]>(MOCK_APPOINTMENTS);

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

  const handleAddAppointment = (date: Date, time: string) => {
    // In a real app, this would open a modal
    const hour = parseInt(time.split(':')[0]);
    alert(`Création de RDV pour le ${date.toLocaleDateString()} à ${time}`);
    
    // Mock adding
    const newApt: Appointment = {
      id: `new-${Date.now()}`,
      patientId: 'p1',
      doctorId: user.id,
      start: new Date(date.setHours(hour, 0)),
      duration: 30,
      type: 'Consultation' as any,
      status: 'En attente' as any,
      patientName: 'Nouveau Patient'
    };
    setAppointments([...appointments, newApt]);
  };

  const renderContent = () => {
    if (user.role === 'SUPER_ADMIN') {
      switch (currentView) {
        case 'saas-dashboard': return <SuperAdminDashboard />;
        case 'reports': return <Reports user={user} />;
        case 'settings': return <Settings />;
        default: return <div className="flex items-center justify-center h-full text-slate-400">Module en construction (MVP)</div>;
      }
    } else {
      switch (currentView) {
        case 'dashboard': return <Dashboard stats={STATS} />;
        case 'calendar': return <CalendarView appointments={appointments} onAddAppointment={handleAddAppointment} />;
        case 'patients': return <PatientList patients={MOCK_PATIENTS} />;
        case 'reports': return <Reports user={user} />;
        case 'settings': return <Settings />;
        default: return <div className="flex items-center justify-center h-full text-slate-400">Module en construction (MVP)</div>;
      }
    }
  };

  return (
    <Layout 
      user={user} 
      onLogout={() => setUser(null)}
      currentView={currentView}
      onChangeView={setCurrentView}
    >
      {renderContent()}
    </Layout>
  );
}

export default App;