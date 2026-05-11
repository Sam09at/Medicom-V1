import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useMedicomStore } from '../../store';
import { signIn } from '../../lib/api/auth';
import { isSupabaseConfigured } from '../../lib/supabase';
import { MedicomError } from '../../lib/errors';
import {
  CURRENT_USER_DOCTOR,
  CURRENT_USER_ASSISTANT,
  CURRENT_USER_ADMIN,
  CURRENT_USER_CLINIC_ADMIN,
  MOCK_TENANTS_DETAILED,
} from '../../constants';
import type { User } from '../../types';

const schema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(6, 'Mot de passe trop court (6 caractères minimum)'),
});

type FormData = z.infer<typeof schema>;

const DEMO_PROFILES: { user: User; label: string; sub: string; redirectTo: string; color: string }[] = [
  {
    user: CURRENT_USER_ADMIN,
    label: 'Super Admin',
    sub: 'Sami Atif — Accès plateforme complet',
    redirectTo: '/admin/dashboard',
    color: '#0f0f10',
  },
  {
    user: CURRENT_USER_DOCTOR,
    label: 'Dr. Amina — Médecin',
    sub: 'Cabinet Dentaire — Plan Premium',
    redirectTo: '/app/dashboard',
    color: '#2563eb',
  },
  {
    user: CURRENT_USER_CLINIC_ADMIN,
    label: 'Dr. Hassan Tazi — Admin Cabinet',
    sub: 'Clinique du Sourire — Plan Pro',
    redirectTo: '/app/dashboard',
    color: '#059669',
  },
  {
    user: { ...CURRENT_USER_ASSISTANT, clinicName: 'Cabinet Dentaire Dr. Amina' },
    label: 'Sarah Benani — Staff',
    sub: 'Accueil & Stock — Accès limité',
    redirectTo: '/app/dashboard',
    color: '#7c3aed',
  },
];

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const setCurrentUser = useMedicomStore((s) => s.setCurrentUser);
  const setCurrentTenant = useMedicomStore((s) => s.setCurrentTenant);
  const setAuthLoading = useMedicomStore((s) => s.setAuthLoading);
  const showToast = useMedicomStore((s) => s.showToast);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showDemo, setShowDemo] = useState(!isSupabaseConfigured);

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  const from =
    (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? null;

  const handleDemoLogin = (profile: typeof DEMO_PROFILES[0]) => {
    setCurrentUser(profile.user);
    if (profile.user.role !== 'super_admin') {
      const tenant = MOCK_TENANTS_DETAILED.find((t) =>
        t.name.includes(profile.user.clinicName?.split(' ').pop() || '')
      );
      if (tenant) setCurrentTenant(tenant);
    }
    setAuthLoading(false);
    navigate(from ?? profile.redirectTo, { replace: true });
  };

  // True when the user clicked a demo profile while Supabase is configured.
  // In this state writes go to Supabase with no real session → RLS blocks them.
  const demoWithSupabase = isSupabaseConfigured;

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    try {
      const { user, tenant } = await signIn(data);
      setCurrentUser(user);
      setCurrentTenant(tenant);
      navigate(from ?? (user.role === 'super_admin' ? '/admin/dashboard' : '/app/dashboard'), { replace: true });
    } catch (err) {
      const msg =
        err instanceof MedicomError
          ? err.userMessage
          : 'Une erreur est survenue. Veuillez réessayer.';
      setServerError(msg);
      showToast({ type: 'error', message: msg });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 bg-[#0f0f10] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm tracking-tight">M</span>
            </div>
            <span className="font-semibold text-slate-900 text-[15px]">Medicom</span>
          </div>

          <h1 className="text-xl font-semibold text-slate-900 mb-1 tracking-tight">Connexion</h1>
          <p className="text-sm text-slate-500 mb-6">Accédez à votre tableau de bord</p>

          {serverError && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="docteur@cabinet.ma"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              />
              {errors.email && <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Mot de passe</label>
              <input
                {...register('password')}
                type="password"
                autoComplete="current-password"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              />
              {errors.password && <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>}
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                Mot de passe oublié ?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-[#0f0f10] text-white text-sm font-semibold rounded-lg hover:bg-slate-800 active:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>
        </div>

        {/* Demo access */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <button
            onClick={() => setShowDemo(s => !s)}
            className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[12px] font-semibold text-slate-600">Accès démonstration</span>
            </div>
            <svg
              className={`w-4 h-4 text-slate-400 transition-transform ${showDemo ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showDemo && (
            <div className="border-t border-slate-100 divide-y divide-slate-50">
              {demoWithSupabase && (
                <div className="px-5 py-3 bg-amber-50 border-b border-amber-100">
                  <p className="text-[11px] font-semibold text-amber-700 leading-snug">
                    ⚠️ Supabase est connecté — les profils de démo utilisent des données fictives et ne persisteront pas. Connectez-vous avec un vrai compte pour sauvegarder vos données.
                  </p>
                </div>
              )}
              {DEMO_PROFILES.map((p) => (
                <button
                  key={p.user.id}
                  onClick={() => handleDemoLogin(p)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-slate-50 transition-colors group"
                >
                  <div
                    className="w-8 h-8 rounded-[8px] flex items-center justify-center text-white font-bold text-[11px] shrink-0"
                    style={{ backgroundColor: p.color }}
                  >
                    {p.user.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-slate-900 truncate">{p.label}</p>
                    <p className="text-[11px] text-slate-400 truncate">{p.sub}</p>
                  </div>
                  <svg className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
              <div className="px-5 py-2.5 bg-slate-50">
                <p className="text-[10px] text-slate-400 text-center">Profils de démonstration — aucun mot de passe requis</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
