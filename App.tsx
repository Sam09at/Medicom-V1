
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

import { ToastContainer } from './components/Toast';
import { CURRENT_USER_ADMIN, CURRENT_USER_DOCTOR, CURRENT_USER_ASSISTANT, MOCK_APPOINTMENTS, MOCK_PATIENTS, MOCK_TENANTS_DETAILED } from './constants';
import { User, CabinetStats, Appointment, ToastMessage, SearchResult, AppointmentStatus, ToastType, AppointmentType } from './types';

// Mock stats for dashboard
const INITIAL_STATS: CabinetStats = {
  appointmentsToday: 8,
  pendingConfirmations: 3,
  revenueToday: 4200,
  activeTreatments: 142,
  waitingRoom: 1
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
         if (apt) setActiveConsultation(apt);
     }
  };

  const handleGlobalSearch = (query: string): SearchResult[] => {
    const lowerQuery = query.toLowerCase();
    const results: SearchResult[] = [];
    MOCK_PATIENTS.forEach(p => {
        if (p.firstName.toLowerCase().includes(lowerQuery) || p.lastName.toLowerCase().includes(lowerQuery)) {
            results.push({ id: p.id, type: 'Patient', title: `${p.firstName} ${p.lastName}`, subtitle: p.phone });
        }
    });
    return results.slice(0, 10);
  };

  const handleOpenAddAppointment = (date: Date, time: string) => {
    setNewAppointmentData({ ...newAppointmentData, date: date.toISOString().split('T')[0], time: time });
    setIsAppointmentModalOpen(true);
  };

  // Switch between demo profiles
  const handleLogin = (role: 'DOCTOR' | 'ASSISTANT' | 'SUPER_ADMIN', tenantId?: string) => {
      if (role === 'SUPER_ADMIN') {
          setUser(CURRENT_USER_ADMIN);
          setCurrentView('saas-dashboard');
      } else if (role === 'ASSISTANT') {
          setUser(CURRENT_USER_ASSISTANT);
          setCurrentView('dashboard');
      } else {
          const tenant = MOCK_TENANTS_DETAILED.find(t => t.id === tenantId);
          if (tenant) {
              const doctorUser: User = {
                  ...CURRENT_USER_DOCTOR,
                  clinicName: tenant.name,
                  plan: tenant.plan,
                  enabledModules: tenant.enabledModules
              };
              setUser(doctorUser);
              setCurrentView('dashboard');
          }
      }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-center py-12 px-6 font-sans">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
           <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-lg mx-auto mb-10">M</div>
           <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Medicom login</h2>
           <p className="mt-3 text-slate-500 text-[15px]">Select a demo profile to enter the platform.</p>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md space-y-4">
             <button onClick={() => handleLogin('DOCTOR', 'TEN-001')} className="w-full flex items-center justify-between p-5 border border-slate-200 rounded-xl hover:border-blue-600 hover:bg-blue-50/50 transition-all bg-white group">
               <div className="text-left">
                   <p className="font-bold text-slate-900 group-hover:text-blue-700">Dr. Amina (Doctor)</p>
                   <p className="text-xs text-slate-500 font-medium">Full Access - Premium Plan</p>
               </div>
               <span className="text-blue-600 font-bold">&rarr;</span>
             </button>

             <button onClick={() => handleLogin('ASSISTANT')} className="w-full flex items-center justify-between p-5 border border-slate-200 rounded-xl hover:border-blue-600 hover:bg-blue-50/50 transition-all bg-white group">
               <div className="text-left">
                   <p className="font-bold text-slate-900 group-hover:text-blue-700">Sarah Benani (Assistant)</p>
                   <p className="text-xs text-slate-500 font-medium">Limited Access - Front Desk & Stock</p>
               </div>
               <span className="text-blue-600 font-bold">&rarr;</span>
             </button>

             <button onClick={() => handleLogin('SUPER_ADMIN')} className="w-full flex items-center justify-between p-5 border border-slate-200 rounded-xl hover:border-indigo-600 hover:bg-indigo-50/50 transition-all bg-white group">
               <div className="text-left">
                   <p className="font-bold text-slate-900 group-hover:text-indigo-700">Platform Admin</p>
                   <p className="text-xs text-slate-500 font-medium">Sami Admin - Super Admin Control</p>
               </div>
               <span className="text-indigo-600 font-bold">&rarr;</span>
             </button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
      const modules = user.enabledModules || ({} as any);

      if (user.role === 'SUPER_ADMIN') {
          switch (currentView) {
              case 'saas-dashboard': return <SuperAdminDashboard />;
              case 'cabinets': return <Cabinets />;
              case 'crm': return <CRM />;
              case 'saas-admin': return <SaaSAdministration />;
              case 'reports': return <Reports user={user} />;
              case 'support': return <Support user={user} />;
              case 'settings': return <Settings />;
              default: return <SuperAdminDashboard />;
          }
      }

      // Dynamic Module Rendering
      switch (currentView) {
        case 'dashboard': return modules.dashboard ? <Dashboard stats={stats} /> : <NoAccess />;
        case 'calendar': return modules.calendar ? <CalendarView appointments={appointments} onAddAppointment={handleOpenAddAppointment} addToast={addToast} /> : <NoAccess />;
        case 'patients': return modules.patients ? <PatientList patients={MOCK_PATIENTS} /> : <NoAccess />;
        case 'treatments': return modules.treatments ? <Treatments /> : <NoAccess />;
        case 'inventory': return modules.inventory ? <Inventory /> : <NoAccess />; 
        case 'lab-orders': return modules.labOrders ? <LabOrders /> : <NoAccess />; 
        case 'records': return modules.records ? <MedicalRecord /> : <NoAccess />;
        case 'documents': return modules.documents ? <Documents /> : <NoAccess />; 
        case 'billing': return modules.billing ? <Billing /> : <NoAccess />;
        case 'reports': return modules.reports ? <Reports user={user} /> : <NoAccess />;
        case 'support': return modules.support ? <Support user={user} /> : <NoAccess />;
        case 'settings': return <Settings />; 
        default: return <Dashboard stats={stats} />;
      }
  };

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      <SlideOver isOpen={!!activeConsultation} onClose={() => setActiveConsultation(null)} title="Consultation" width="2xl">
         {activeConsultation && (
             <Consultation 
                patient={MOCK_PATIENTS[0]} 
                appointment={activeConsultation}
                onFinish={() => { setActiveConsultation(null); addToast('success', 'Consultation terminée'); }}
             />
         )}
      </SlideOver>

      <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} onNavigate={setCurrentView} />

      <Layout user={user} onLogout={() => setUser(null)} currentView={currentView} onChangeView={setCurrentView} onSearch={handleGlobalSearch}>
        {renderContent()}
      </Layout>
    </>
  );
}

const NoAccess = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-10 bg-white rounded-xl border border-slate-200">
        <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-6 border border-slate-100"><IconShield className="w-8 h-8" /></div>
        <h3 className="text-xl font-bold text-slate-900">Module restreint</h3>
        <p className="text-slate-500 mt-2 max-w-sm">Votre rôle ne vous permet pas d'accéder à cette section, ou le module a été désactivé pour votre cabinet.</p>
        <button className="mt-8 px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all">Retour au tableau de bord</button>
    </div>
);

import { IconShield as ShieldIcon } from './components/Icons';
const IconShield = ShieldIcon;

export default App;
