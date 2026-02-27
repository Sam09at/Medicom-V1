import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMedicomStore } from '../store';
import {
  CURRENT_USER_DOCTOR,
  CURRENT_USER_ASSISTANT,
  CURRENT_USER_ADMIN,
  CURRENT_USER_CLINIC_ADMIN,
  MOCK_TENANTS_DETAILED,
} from '../constants';
import type { User, UserRole } from '../types';

/**
 * Dev-only login picker. Shown when no user is in the Zustand store.
 * Will be removed in Phase 14 when real Supabase auth is implemented.
 */
export const MockLoginPicker: React.FC = () => {
  const navigate = useNavigate();
  const { setCurrentUser, setCurrentTenant, setAuthLoading } = useMedicomStore();

  const handleLogin = (mockUser: User, redirectTo: string) => {
    setCurrentUser(mockUser);

    // Set tenant for clinic users
    if (mockUser.role !== 'super_admin') {
      const tenant = MOCK_TENANTS_DETAILED.find((t) =>
        t.name.includes(mockUser.clinicName?.split(' ').pop() || '')
      );
      if (tenant) {
        setCurrentTenant(tenant);
      }
    }

    setAuthLoading(false);
    navigate(redirectTo, { replace: true });
  };

  const profiles: {
    user: User;
    label: string;
    sublabel: string;
    redirectTo: string;
    accent: string;
  }[] = [
    {
      user: CURRENT_USER_DOCTOR,
      label: 'Dr. Amina (Doctor)',
      sublabel: 'Full Access — Premium Plan',
      redirectTo: '/app/dashboard',
      accent: 'blue',
    },
    {
      user: { ...CURRENT_USER_ASSISTANT, clinicName: 'Cabinet Dentaire Dr. Amina' },
      label: 'Sarah Benani (Staff)',
      sublabel: 'Limited Access — Front Desk & Stock',
      redirectTo: '/app/dashboard',
      accent: 'blue',
    },
    {
      user: CURRENT_USER_CLINIC_ADMIN,
      label: 'Dr. Hassan Tazi (Clinic Admin)',
      sublabel: 'Admin Access — Pro Plan',
      redirectTo: '/app/dashboard',
      accent: 'emerald',
    },
    {
      user: CURRENT_USER_ADMIN,
      label: 'Platform Admin',
      sublabel: 'Sami Admin — Super Admin Control',
      redirectTo: '/admin/dashboard',
      accent: 'indigo',
    },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-12 px-6 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <img
          src="/logo.png"
          alt="Medicom Logo"
          className="w-16 h-16 object-contain mx-auto mb-10"
        />
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Medicom login</h2>
        <p className="mt-3 text-gray-500 text-[15px]">
          Select a demo profile to enter the platform.
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md space-y-4">
        {profiles.map((p) => (
          <button
            key={p.user.id}
            onClick={() => handleLogin(p.user, p.redirectTo)}
            className={`w-full flex items-center justify-between p-5 border border-gray-200 rounded-xl hover:border-${p.accent}-600 hover:bg-${p.accent}-50/50 transition-all bg-white group`}
          >
            <div className="text-left">
              <p className={`font-bold text-gray-900 group-hover:text-${p.accent}-700`}>
                {p.label}
              </p>
              <p className="text-xs text-gray-500 font-medium">{p.sublabel}</p>
            </div>
            <span className={`text-${p.accent}-600 font-bold`}>&rarr;</span>
          </button>
        ))}
      </div>
    </div>
  );
};
