import React, { Suspense, useState, useEffect } from 'react';
import { createBrowserRouter, Navigate, useNavigate, useParams } from 'react-router-dom';
import { RoleGuard } from './RoleGuard';
import { AppLayout } from './AppLayout';
import { AdminLayout } from './AdminLayout';
import { LoadingSpinner } from '../components/LoadingSpinner';

// ── Eager imports (needed on first paint) ──
import { Dashboard } from '../features/Dashboard';
import { CalendarView } from '../components/CalendarView';
import { MockLoginPicker } from '../dev/MockLoginPicker';
import { useMedicomStore } from '../store';
import { MOCK_APPOINTMENTS, MOCK_PATIENTS } from '../constants';
import { CabinetStats, AppointmentStatus, Appointment, Patient } from '../types';
import { supabase } from '../lib/supabase';

// ── Lazy-loaded features (code-split for smaller initial bundle) ──
const PatientList = React.lazy(() =>
  import('../features/PatientList').then((m) => ({ default: m.PatientList }))
);
const PatientDetail = React.lazy(() =>
  import('../features/PatientDetail').then((m) => ({ default: m.PatientDetail }))
);
const Treatments = React.lazy(() =>
  import('../features/Treatments').then((m) => ({ default: m.Treatments }))
);
const Consultation = React.lazy(() =>
  import('../features/Consultation').then((m) => ({ default: m.Consultation }))
);
const MedicalRecord = React.lazy(() =>
  import('../features/MedicalRecord').then((m) => ({ default: m.MedicalRecord }))
);
const Inventory = React.lazy(() =>
  import('../features/Inventory').then((m) => ({ default: m.Inventory }))
);
const LabOrders = React.lazy(() =>
  import('../features/LabOrders').then((m) => ({ default: m.LabOrders }))
);
const Documents = React.lazy(() =>
  import('../features/Documents').then((m) => ({ default: m.Documents }))
);
const Billing = React.lazy(() =>
  import('../features/Billing').then((m) => ({ default: m.Billing }))
);
const Reports = React.lazy(() =>
  import('../features/Reports').then((m) => ({ default: m.Reports }))
);
const WaitingRoom = React.lazy(() =>
  import('../features/WaitingRoom').then((m) => ({ default: m.WaitingRoom }))
);
const Support = React.lazy(() =>
  import('../features/Support').then((m) => ({ default: m.Support }))
);
const Settings = React.lazy(() =>
  import('../features/Settings').then((m) => ({ default: m.Settings }))
);
const SuperAdminDashboard = React.lazy(() =>
  import('../features/SuperAdminDashboard').then((m) => ({ default: m.SuperAdminDashboard }))
);
const Cabinets = React.lazy(() =>
  import('../features/Cabinets').then((m) => ({ default: m.Cabinets }))
);
const CRM = React.lazy(() => import('../features/CRM').then((m) => ({ default: m.CRM })));
const SaaSAdministration = React.lazy(() =>
  import('../features/SaaSAdministration').then((m) => ({ default: m.SaaSAdministration }))
);

/** Suspense wrapper for lazy-loaded routes */
function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>;
}

// ── Helpers for pages that still need props ──
const INITIAL_STATS: CabinetStats = {
  appointmentsToday: 8,
  pendingConfirmations: 3,
  revenueToday: 4200,
  activeTreatments: 142,
  waitingRoom: 1,
};

/** Wrapper to inject props that features still expect (will be removed as features migrate to hooks) */
const DashboardPage = () => {
  const stats = {
    ...INITIAL_STATS,
    waitingRoom: MOCK_APPOINTMENTS.filter((a) => a.status === AppointmentStatus.ARRIVED).length,
  };
  return <Dashboard stats={stats} />;
};

const CalendarPage = () => {
  return <CalendarView />;
};

const PatientsPage = () => (
  <Lazy>
    <PatientList />
  </Lazy>
);

const ReportsPage = () => {
  const user = useMedicomStore((s) => s.currentUser);
  return user ? (
    <Lazy>
      <Reports user={user} />
    </Lazy>
  ) : null;
};

const SupportPage = () => {
  const user = useMedicomStore((s) => s.currentUser);
  return user ? (
    <Lazy>
      <Support user={user} />
    </Lazy>
  ) : null;
};

const ConsultationPage = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!appointmentId) {
      setLoading(false);
      return;
    }

    async function load() {
      // Try Supabase first
      if (supabase) {
        try {
          const { data: apptData } = await supabase
            .from('appointments')
            .select('*')
            .eq('id', appointmentId)
            .maybeSingle();
          if (apptData) {
            setAppointment(apptData as Appointment);
            const { data: ptData } = await supabase
              .from('patients')
              .select('*')
              .eq('id', apptData.patient_id)
              .maybeSingle();
            if (ptData) {
              setPatient(ptData as Patient);
              setLoading(false);
              return;
            }
          }
        } catch {
          /* fall through to mock */
        }
      }
      // Mock fallback
      const appt =
        MOCK_APPOINTMENTS.find((a) => a.id === appointmentId) || MOCK_APPOINTMENTS[0] || null;
      setAppointment(appt);
      if (appt) {
        const p =
          MOCK_PATIENTS.find((pt) => pt.id === (appt as any).patientId) || MOCK_PATIENTS[0] || null;
        setPatient(p);
      }
      setLoading(false);
    }
    load();
  }, [appointmentId]);

  if (loading) return <LoadingSpinner />;

  if (!appointment || !patient) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-500 p-10 text-center">
        <p className="text-xl font-semibold text-gray-900">Consultation introuvable</p>
        <p className="text-sm">Le rendez-vous #{appointmentId} n'existe pas.</p>
        <button
          onClick={() => navigate('/app/calendar')}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
        >
          Retour au calendrier
        </button>
      </div>
    );
  }

  return (
    <Lazy>
      <Consultation
        patient={patient}
        appointment={appointment}
        onFinish={() => navigate('/app/calendar')}
      />
    </Lazy>
  );
};

const WaitingRoomPage = () => (
  <Lazy>
    <WaitingRoom />
  </Lazy>
);

const PatientDetailPage = () => (
  <Lazy>
    <PatientDetail />
  </Lazy>
);

const PortalPlaceholder = () => (
  <div className="min-h-screen flex items-center justify-center text-gray-500 font-sans">
    <div className="text-center">
      <h2 className="text-xl font-bold">Portail Patient</h2>
      <p className="mt-2">À venir — Phase 10</p>
    </div>
  </div>
);

const UnauthorizedPage = () => (
  <div className="min-h-screen flex items-center justify-center text-gray-500 font-sans">
    <div className="text-center">
      <div className="w-16 h-16 bg-red-50 text-red-400 rounded-full flex items-center justify-center mb-6 mx-auto border border-red-100 text-2xl">
        🔒
      </div>
      <h2 className="text-xl font-bold text-gray-900">Accès non autorisé</h2>
      <p className="mt-2">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
    </div>
  </div>
);

// ── Smart root redirect ──
const RootRedirect = () => {
  const user = useMedicomStore((s) => s.currentUser);
  if (!user) return <MockLoginPicker />;
  if (user.role === 'super_admin') return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/app/dashboard" replace />;
};

// ── Route tree ──
export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootRedirect />,
  },
  {
    path: '/app',
    element: (
      <RoleGuard allowedRoles={['doctor', 'staff', 'clinic_admin']}>
        <AppLayout />
      </RoleGuard>
    ),
    children: [
      { index: true, element: <Navigate to="/app/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'calendar', element: <CalendarPage /> },
      { path: 'patients', element: <PatientsPage /> },
      { path: 'patients/:id', element: <PatientDetailPage /> },
      {
        path: 'treatments',
        element: (
          <Lazy>
            <Treatments />
          </Lazy>
        ),
      },
      { path: 'consultation/:appointmentId', element: <ConsultationPage /> },
      {
        path: 'records',
        element: (
          <Lazy>
            <MedicalRecord />
          </Lazy>
        ),
      },
      {
        path: 'inventory',
        element: (
          <Lazy>
            <Inventory />
          </Lazy>
        ),
      },
      {
        path: 'lab-orders',
        element: (
          <Lazy>
            <LabOrders />
          </Lazy>
        ),
      },
      {
        path: 'documents',
        element: (
          <Lazy>
            <Documents />
          </Lazy>
        ),
      },
      {
        path: 'billing',
        element: (
          <Lazy>
            <Billing />
          </Lazy>
        ),
      },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'waiting-room', element: <WaitingRoomPage /> },
      { path: 'support', element: <SupportPage /> },
      {
        path: 'settings/*',
        element: (
          <Lazy>
            <Settings />
          </Lazy>
        ),
      },
    ],
  },
  {
    path: '/admin',
    element: (
      <RoleGuard allowedRoles={['super_admin']}>
        <AdminLayout />
      </RoleGuard>
    ),
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      {
        path: 'dashboard',
        element: (
          <Lazy>
            <SuperAdminDashboard />
          </Lazy>
        ),
      },
      {
        path: 'cabinets',
        element: (
          <Lazy>
            <Cabinets />
          </Lazy>
        ),
      },
      {
        path: 'cabinets/:id',
        element: (
          <Lazy>
            <Cabinets />
          </Lazy>
        ),
      },
      {
        path: 'crm',
        element: (
          <Lazy>
            <CRM />
          </Lazy>
        ),
      },
      {
        path: 'administration',
        element: (
          <Lazy>
            <SaaSAdministration />
          </Lazy>
        ),
      },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'support', element: <SupportPage /> },
      {
        path: 'settings',
        element: (
          <Lazy>
            <Settings />
          </Lazy>
        ),
      },
    ],
  },
  {
    path: '/portal/*',
    element: (
      <RoleGuard allowedRoles={['patient']}>
        <PortalPlaceholder />
      </RoleGuard>
    ),
  },
  { path: '/login', element: <MockLoginPicker /> },
  { path: '/unauthorized', element: <UnauthorizedPage /> },
  { path: '*', element: <Navigate to="/" replace /> },
]);
