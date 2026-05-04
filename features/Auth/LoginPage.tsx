import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useMedicomStore } from '../../store';
import { signIn } from '../../lib/api/auth';
import { isSupabaseConfigured } from '../../lib/supabase';
import { MockLoginPicker } from '../../dev/MockLoginPicker';
import { MedicomError } from '../../lib/errors';

const schema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(6, 'Mot de passe trop court (6 caractères minimum)'),
});

type FormData = z.infer<typeof schema>;

export const LoginPage: React.FC = () => {
  // Mock mode: no Supabase credentials — render the existing dev picker unchanged.
  // This preserves the full local-dev workflow without any env setup.
  if (import.meta.env.DEV && !isSupabaseConfigured) {
    return <MockLoginPicker />;
  }

  const navigate = useNavigate();
  const location = useLocation();
  const setCurrentUser = useMedicomStore((s) => s.setCurrentUser);
  const setCurrentTenant = useMedicomStore((s) => s.setCurrentTenant);
  const showToast = useMedicomStore((s) => s.showToast);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const from =
    (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? null;

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    try {
      const { user, tenant } = await signIn(data);
      setCurrentUser(user);
      setCurrentTenant(tenant);
      const dest =
        from ?? (user.role === 'super_admin' ? '/admin/dashboard' : '/app/dashboard');
      navigate(dest, { replace: true });
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
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm tracking-tight">M</span>
          </div>
          <span className="font-semibold text-slate-900 text-[15px]">Medicom</span>
        </div>

        <h1 className="text-xl font-semibold text-slate-900 mb-1 tracking-tight">
          Connexion
        </h1>
        <p className="text-sm text-slate-500 mb-6">Accédez à votre tableau de bord</p>

        {serverError && (
          <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Email
            </label>
            <input
              {...register('email')}
              type="email"
              autoComplete="email"
              placeholder="docteur@cabinet.ma"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            />
            {errors.email && (
              <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Mot de passe
            </label>
            <input
              {...register('password')}
              type="password"
              autoComplete="current-password"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            />
            {errors.password && (
              <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Mot de passe oublié ?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
};
